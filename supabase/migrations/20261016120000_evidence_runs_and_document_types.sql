-- Velarix v5 — versionado no destructivo de Evidence (mapping + validation)
-- y separación del tipo documental declarado vs. efectivo.
--
-- Migración ADITIVA: una tabla nueva y columnas nullable nuevas. Sin DROP,
-- sin DELETE, sin UPDATE de datos existentes, sin cambios en RLS existente.
--
-- 1. evidence_runs: una ejecución de Evidence = homologación (map-accounts)
--    + validación (validate-analysis) sobre las mismas filas. Ciclo:
--      mapping → mapped → validating → completed   (o failed en cualquier etapa)
--    Las filas que produce cada etapa quedan ligadas al run
--    (account_homologations.evidence_run_id, validation_results.evidence_run_id).
--    Ningún run se borra: el historial queda consultable en las tablas
--    operativas.
-- 2. analyses.active_evidence_run_id: el ÚNICO puntero de consumo operacional.
--    Se promueve (build then promote) con un UPDATE de una sola fila,
--    condicionado al valor previo (compare-and-swap), y solo después de que el
--    run completó homologación Y validación. Un run fallido nunca se promueve,
--    así que el último set bueno sigue activo.
--      - puntero NULL  → casos legacy: se leen las filas con evidence_run_id NULL
--        (las de antes de esta migración; no se reescriben).
--      - puntero = run → se leen solo las filas de ese run.
-- 3. documents.doc_type_effective / doc_type_origin: clasificación operacional
--    resuelta por parse-document y su origen. doc_type_declared queda como lo
--    declaró la carga (parse-document deja de sobrescribirlo).
--
-- Efecto sobre datos existentes: ninguna fila cambia. Alpina (0 homologaciones,
-- 0 validaciones) y Tecnoglass (252 / 20) quedan con evidence_run_id NULL y
-- active_evidence_run_id NULL → sus lectores siguen viendo exactamente lo mismo.

-- ── 1. evidence_runs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evidence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('mapping', 'mapped', 'validating', 'completed', 'failed')),
  failed_stage TEXT CHECK (failed_stage IN ('mapping', 'validation', 'promotion')),
  error_code TEXT,
  error_detail TEXT,
  -- Versiones de documents_parsed que consumió la homologación (lineage del parse).
  source_parsed_document_ids UUID[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mapped_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  promoted_at TIMESTAMPTZ,
  -- Puntero activo que existía cuando el run empezó (contra él se hace el compare-and-swap).
  previous_active_run_id UUID REFERENCES public.evidence_runs(id),
  created_by UUID
);

COMMENT ON TABLE public.evidence_runs IS 'Ejecución de Evidence (homologación + validación). Insert + transiciones de estado; nunca se borra. El run activo lo indica analyses.active_evidence_run_id.';

ALTER TABLE public.evidence_runs ENABLE ROW LEVEL SECURITY;

-- Lectura para el dueño del análisis. Las escrituras las hacen las Edge
-- Functions con la clave de servidor (no hay política de escritura para authenticated).
CREATE POLICY "Users can view own evidence runs"
  ON public.evidence_runs FOR SELECT
  TO authenticated
  USING (
    analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_evidence_runs_analysis_started ON public.evidence_runs(analysis_id, started_at DESC);

-- ── 2. filas ligadas al run + puntero activo ───────────────────────
ALTER TABLE public.account_homologations
  ADD COLUMN IF NOT EXISTS evidence_run_id UUID REFERENCES public.evidence_runs(id);
ALTER TABLE public.validation_results
  ADD COLUMN IF NOT EXISTS evidence_run_id UUID REFERENCES public.evidence_runs(id);
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS active_evidence_run_id UUID REFERENCES public.evidence_runs(id);

COMMENT ON COLUMN public.account_homologations.evidence_run_id IS 'Run de Evidence que produjo la fila. NULL = fila legacy (anterior al versionado).';
COMMENT ON COLUMN public.validation_results.evidence_run_id IS 'Run de Evidence que produjo la fila; valida las homologaciones del MISMO run. NULL = legacy.';
COMMENT ON COLUMN public.analyses.active_evidence_run_id IS 'Run de Evidence activo para consumo operacional. NULL = el caso usa sus filas legacy (evidence_run_id NULL).';

CREATE INDEX IF NOT EXISTS idx_account_homologations_analysis_run ON public.account_homologations(analysis_id, evidence_run_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_analysis_run ON public.validation_results(analysis_id, evidence_run_id);

-- ── 3. tipo documental declarado ≠ efectivo ─────────────────────
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS doc_type_effective TEXT,
  ADD COLUMN IF NOT EXISTS doc_type_origin TEXT CHECK (doc_type_origin IN ('DETERMINISTIC_WORKBOOK', 'AI_CLASSIFIER', 'DECLARED', 'CONTENT_DETECTION'));

COMMENT ON COLUMN public.documents.doc_type_declared IS 'Tipo declarado en la carga (UI / upload-document). No lo modifica el parser.';
COMMENT ON COLUMN public.documents.doc_type_effective IS 'Tipo operacional resuelto por parse-document. Consumidores operacionales: doc_type_effective ?? doc_type_declared.';
COMMENT ON COLUMN public.documents.doc_type_origin IS 'Cómo se resolvió doc_type_effective.';
