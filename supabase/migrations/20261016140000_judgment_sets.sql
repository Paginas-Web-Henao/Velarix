-- Velarix v5 — Judgment versionado (judgment sets). Cierra LIM-10.
--
-- Migración ADITIVA: dos tablas nuevas, una columna nullable nueva y
-- triggers sobre las tablas nuevas y sobre el puntero nuevo. Sin DROP, sin
-- DELETE, sin UPDATE de datos existentes, sin cambios en políticas existentes.
-- Requiere 20261016120000 (evidence_runs).
--
-- Modelo (mismo principio que evidence runs, ADR-009 / ADR-010):
-- - judgment_sets: un conjunto COHERENTE de decisiones humanas formulado sobre
--   UN evidence run. Estados: draft → completed | failed. Se promueve con un
--   UPDATE de una fila en analyses.active_judgment_set_id (CAS en el servidor).
-- - judgment_entries: decisiones del set (key/value/unit/source/rationale/
--   status). Append-only; dentro de un draft, corregir = nueva entrada con
--   supersedes_entry_id. Solo se insertan en sets draft.
-- - analyses.active_judgment_set_id: el ÚNICO set que alimenta Calculation.
--   NULL en todos los casos existentes (Alpina, Tecnoglass): sin cambios.
-- Las Edge Functions escriben con la clave de servidor; el cliente solo lee.

-- ── 1. judgment_sets ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.judgment_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  evidence_run_id UUID NOT NULL REFERENCES public.evidence_runs(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'failed')),
  previous_active_judgment_set_id UUID REFERENCES public.judgment_sets(id),
  -- Reutilización EXPLÍCITA de un set anterior (p. ej. tras un nuevo evidence run): nunca implícita.
  reused_from_judgment_set_id UUID REFERENCES public.judgment_sets(id),
  error_code TEXT,
  error_detail TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  promoted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.judgment_sets IS 'Conjunto versionado de Judgment sobre un evidence run (ADR-010). draft → completed | failed; el activo lo indica analyses.active_judgment_set_id.';

-- ── 2. judgment_entries ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.judgment_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judgment_set_id UUID NOT NULL REFERENCES public.judgment_sets(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  unit TEXT,
  source_type TEXT NOT NULL DEFAULT 'JUDGMENT' CHECK (source_type = 'JUDGMENT'),
  source TEXT NOT NULL,
  rationale TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('resolved', 'proposed')),
  effective_date TEXT,
  "references" JSONB,
  supersedes_entry_id UUID REFERENCES public.judgment_entries(id),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.judgment_entries IS 'Decisiones de un judgment set. Append-only; supersession dentro del draft (supersedes_entry_id).';

CREATE INDEX IF NOT EXISTS idx_judgment_sets_analysis_created ON public.judgment_sets(analysis_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_judgment_entries_set_key ON public.judgment_entries(judgment_set_id, key);

-- ── 3. puntero activo ────────────────────────────────────────────
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS active_judgment_set_id UUID REFERENCES public.judgment_sets(id);

COMMENT ON COLUMN public.analyses.active_judgment_set_id IS 'Judgment set activo para Calculation v5 (ADR-010). NULL = sin Judgment versionado (legacy).';

-- ── 4. RLS: lectura del dueño; sin escritura del cliente ───────────
ALTER TABLE public.judgment_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judgment_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own judgment sets"
  ON public.judgment_sets FOR SELECT
  TO authenticated
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own judgment entries"
  ON public.judgment_entries FOR SELECT
  TO authenticated
  USING (judgment_set_id IN (
    SELECT s.id FROM public.judgment_sets s JOIN public.analyses a ON a.id = s.analysis_id WHERE a.user_id = auth.uid()
  ));

-- ── 5. Invariantes en la base (aplican también a la clave de servidor) ──

-- 5.1 Entradas inmutables y solo en sets draft.
CREATE OR REPLACE FUNCTION public.guard_judgment_entries()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  set_status TEXT;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'judgment_entries es append-only (ADR-010)' USING ERRCODE = '42501';
  END IF;
  SELECT status INTO set_status FROM public.judgment_sets WHERE id = NEW.judgment_set_id;
  IF set_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'solo se agregan entradas a un judgment set draft (estado: %)', coalesce(set_status, 'inexistente') USING ERRCODE = '42501';
  END IF;
  IF NEW.supersedes_entry_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.judgment_entries e WHERE e.id = NEW.supersedes_entry_id AND e.judgment_set_id = NEW.judgment_set_id AND e.key = NEW.key
  ) THEN
    RAISE EXCEPTION 'supersedes_entry_id debe apuntar a una entrada del mismo set y la misma key' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_judgment_entries
  BEFORE INSERT OR UPDATE OR DELETE ON public.judgment_entries
  FOR EACH ROW EXECUTE FUNCTION public.guard_judgment_entries();

-- 5.2 Transiciones de judgment_sets: draft → completed | failed; un set
--     completado solo admite registrar promoted_at una vez; failed es final.
CREATE OR REPLACE FUNCTION public.guard_judgment_set_transitions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'judgment_sets no se borran (ADR-010)' USING ERRCODE = '42501';
  END IF;
  IF NEW.analysis_id IS DISTINCT FROM OLD.analysis_id
     OR NEW.evidence_run_id IS DISTINCT FROM OLD.evidence_run_id
     OR NEW.previous_active_judgment_set_id IS DISTINCT FROM OLD.previous_active_judgment_set_id
     OR NEW.reused_from_judgment_set_id IS DISTINCT FROM OLD.reused_from_judgment_set_id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'la identidad de un judgment set es inmutable' USING ERRCODE = '42501';
  END IF;
  IF OLD.status = 'draft' AND NEW.status IN ('draft', 'completed', 'failed') AND OLD.promoted_at IS NULL AND NEW.promoted_at IS NULL THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'completed' AND NEW.status = 'completed' AND OLD.promoted_at IS NULL AND NEW.promoted_at IS NOT NULL
     AND NEW.completed_at IS NOT DISTINCT FROM OLD.completed_at AND NEW.failed_at IS NOT DISTINCT FROM OLD.failed_at
     AND NEW.error_code IS NOT DISTINCT FROM OLD.error_code AND NEW.error_detail IS NOT DISTINCT FROM OLD.error_detail THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'transición de judgment set no permitida (% → %)', OLD.status, NEW.status USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER guard_judgment_set_transitions
  BEFORE UPDATE OR DELETE ON public.judgment_sets
  FOR EACH ROW EXECUTE FUNCTION public.guard_judgment_set_transitions();

-- 5.3 Puntero activo: solo el servidor lo mueve, y solo hacia un set
--     completado del mismo análisis formulado sobre el evidence run activo.
CREATE OR REPLACE FUNCTION public.guard_active_judgment_set_pointer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  s RECORD;
BEGIN
  IF NEW.active_judgment_set_id IS NOT DISTINCT FROM OLD.active_judgment_set_id THEN
    RETURN NEW;
  END IF;
  IF current_user IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'active_judgment_set_id solo lo cambia el servidor (promoción de judgment sets, ADR-010)' USING ERRCODE = '42501';
  END IF;
  IF NEW.active_judgment_set_id IS NULL THEN
    RAISE EXCEPTION 'el judgment set activo no se retira; se reemplaza por otro set completado' USING ERRCODE = '42501';
  END IF;
  SELECT analysis_id, evidence_run_id, status INTO s FROM public.judgment_sets WHERE id = NEW.active_judgment_set_id;
  IF s.analysis_id IS DISTINCT FROM NEW.id OR s.status IS DISTINCT FROM 'completed' OR s.evidence_run_id IS DISTINCT FROM NEW.active_evidence_run_id THEN
    RAISE EXCEPTION 'solo se promueve un judgment set completado del mismo análisis y del evidence run activo' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_active_judgment_set_pointer
  BEFORE UPDATE OF active_judgment_set_id ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.guard_active_judgment_set_pointer();
