-- Velarix — Corrección manual de homologaciones sobre Evidence VERSIONADA (cierra LIM-09).
--
-- Migración ADITIVA y LOCAL: columnas nullable nuevas, un CHECK que todas las
-- filas existentes ya cumplen (todo NULL) y una función. Sin DROP, sin DELETE,
-- sin UPDATE de datos, sin cambios en políticas existentes. Requiere
-- 20261016120000 / 20261016130000 (evidence runs).
--
-- Modelo (ADR-009 + ADR-011): una corrección humana de mapping NO modifica el
-- run activo A. Crea un run nuevo B (previous_active_run_id = A, mismas
-- source_parsed_document_ids, sin reparse) cuyas homologaciones son una COPIA
-- EXACTA de las de A con la corrección aplicada en el INSERT inicial. B queda
-- `mapped`; validate-analysis lo valida y lo promueve con el CAS existente.
-- A queda intacto e histórico.

-- ── 1. Lineage de homologaciones ────────────────────────────────
ALTER TABLE public.account_homologations
  ADD COLUMN IF NOT EXISTS derived_from_homologation_id UUID REFERENCES public.account_homologations(id),
  ADD COLUMN IF NOT EXISTS manual_correction_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS manual_correction_reason TEXT,
  ADD COLUMN IF NOT EXISTS manual_corrected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS previous_canonical_account TEXT;

COMMENT ON COLUMN public.account_homologations.derived_from_homologation_id IS 'Fila del run anterior de la que se copió esta (corrección manual versionada). NULL = producida por map-accounts.';
COMMENT ON COLUMN public.account_homologations.manual_correction_by IS 'Quién corrigió el mapping de esta fila (solo la fila corregida).';
COMMENT ON COLUMN public.account_homologations.previous_canonical_account IS 'canonical_account de la fila origen antes de la corrección manual.';

-- Una corrección manual está completa o no existe (y siempre tiene origen).
ALTER TABLE public.account_homologations
  ADD CONSTRAINT account_homologations_manual_correction_complete CHECK (
    (manual_correction_by IS NULL AND manual_correction_reason IS NULL AND manual_corrected_at IS NULL AND previous_canonical_account IS NULL)
    OR (manual_correction_by IS NOT NULL AND manual_correction_reason IS NOT NULL AND btrim(manual_correction_reason) <> ''
        AND manual_corrected_at IS NOT NULL AND previous_canonical_account IS NOT NULL AND derived_from_homologation_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_account_homologations_derived_from ON public.account_homologations(derived_from_homologation_id) WHERE derived_from_homologation_id IS NOT NULL;

-- ── 2. Origen del evidence run ──────────────────────────────────
ALTER TABLE public.evidence_runs
  ADD COLUMN IF NOT EXISTS origin TEXT CHECK (origin IS NULL OR origin = 'manual_mapping_correction');

COMMENT ON COLUMN public.evidence_runs.origin IS 'NULL = run de map-accounts; manual_mapping_correction = run derivado del activo por una corrección humana de mapping (ADR-011).';

-- ── 3. Construcción atómica del run corregido ───────────────────
-- Una sola transacción: lock del análisis, CAS contra el run activo esperado,
-- creación del run B y copia de TODAS las filas de A con INSERT … SELECT
-- (valores NUMERIC copiados exactamente, sin pasar por JSON). Si cualquier
-- paso falla, no queda nada: ni run B ni filas parciales. La validación de
-- negocio (auth, taxonomía, estado contable) vive en la Edge Function
-- create-manual-mapping-run; aquí solo los invariantes que exigen atomicidad.
-- Si account_homologations gana columnas de Evidence en el futuro, esta copia
-- debe ampliarse en la misma migración que las añada.
CREATE OR REPLACE FUNCTION public.create_manual_mapping_run(
  p_analysis_id UUID,
  p_expected_run_id UUID,
  p_homologation_id UUID,
  p_new_canonical_account TEXT,
  p_reason TEXT,
  p_actor UUID
)
RETURNS TABLE (evidence_run_id UUID, homologations_copied INTEGER)
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_active UUID;
  v_calc JSONB;
  v_sources UUID[];
  v_old TEXT;
  v_run UUID;
  v_copied INTEGER;
  v_source_count INTEGER;
BEGIN
  -- Lock de la fila del análisis: serializa contra promociones concurrentes
  -- (que hacen UPDATE de esta fila) mientras se construye B.
  SELECT a.active_evidence_run_id, a.calculation_result INTO v_active, v_calc
    FROM public.analyses a WHERE a.id = p_analysis_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ANALYSIS_NOT_FOUND: análisis inexistente' USING ERRCODE = 'P0002';
  END IF;
  IF v_calc IS NOT NULL THEN
    RAISE EXCEPTION 'CASE_ALREADY_CALCULATED: el caso tiene un cálculo oficial; su Evidence no se modifica' USING ERRCODE = '42501';
  END IF;
  IF v_active IS NULL OR v_active IS DISTINCT FROM p_expected_run_id THEN
    RAISE EXCEPTION 'EVIDENCE_RUN_CHANGED: el run activo es %, no %', coalesce(v_active::text, 'ninguno'), coalesce(p_expected_run_id::text, 'ninguno') USING ERRCODE = '40001';
  END IF;
  SELECT r.source_parsed_document_ids INTO v_sources
    FROM public.evidence_runs r WHERE r.id = v_active AND r.analysis_id = p_analysis_id AND r.status = 'completed';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ACTIVE_EVIDENCE_RUN_INVALID: el run activo no está completo' USING ERRCODE = '23514';
  END IF;
  SELECT h.canonical_account INTO v_old
    FROM public.account_homologations h
   WHERE h.id = p_homologation_id AND h.analysis_id = p_analysis_id AND h.evidence_run_id = v_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HOMOLOGATION_NOT_IN_ACTIVE_RUN: la fila no pertenece al run activo' USING ERRCODE = '23514';
  END IF;
  IF v_old = p_new_canonical_account THEN
    RAISE EXCEPTION 'MANUAL_CORRECTION_NOOP: la fila ya está en %', v_old USING ERRCODE = '22023';
  END IF;
  IF p_reason IS NULL OR btrim(p_reason) = '' OR p_actor IS NULL OR p_new_canonical_account IS NULL OR btrim(p_new_canonical_account) = '' THEN
    RAISE EXCEPTION 'MANUAL_CORRECTION_INVALID: motivo, actor y cuenta destino son obligatorios' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.evidence_runs (analysis_id, status, source_parsed_document_ids, previous_active_run_id, created_by, mapped_at, origin)
  VALUES (p_analysis_id, 'mapped', v_sources, v_active, p_actor, now(), 'manual_mapping_correction')
  RETURNING id INTO v_run;

  INSERT INTO public.account_homologations (
    analysis_id, document_id, original_label, canonical_account, category, period, value,
    confidence_score, ambiguity_flag, mapping_notes, evidence_run_id,
    derived_from_homologation_id, manual_correction_by, manual_correction_reason, manual_corrected_at, previous_canonical_account
  )
  SELECT
    h.analysis_id, h.document_id, h.original_label,
    CASE WHEN h.id = p_homologation_id THEN p_new_canonical_account ELSE h.canonical_account END,
    h.category, h.period, h.value,
    CASE WHEN h.id = p_homologation_id THEN 'alta'::public.confidence_level ELSE h.confidence_score END,
    CASE WHEN h.id = p_homologation_id THEN false ELSE h.ambiguity_flag END,
    CASE WHEN h.id = p_homologation_id THEN 'Corrección manual de mapping (ver manual_correction_*) · ' || coalesce(h.mapping_notes, '') ELSE h.mapping_notes END,
    v_run,
    h.id,
    -- Las correcciones anteriores viajan con su fila: un mapping manual sigue
    -- marcado como manual en los runs posteriores (MAP_008/MAP_009 lo ven).
    CASE WHEN h.id = p_homologation_id THEN p_actor ELSE h.manual_correction_by END,
    CASE WHEN h.id = p_homologation_id THEN btrim(p_reason) ELSE h.manual_correction_reason END,
    CASE WHEN h.id = p_homologation_id THEN now() ELSE h.manual_corrected_at END,
    CASE WHEN h.id = p_homologation_id THEN h.canonical_account ELSE h.previous_canonical_account END
  FROM public.account_homologations h
  WHERE h.analysis_id = p_analysis_id AND h.evidence_run_id = v_active;
  GET DIAGNOSTICS v_copied = ROW_COUNT;

  SELECT count(*) INTO v_source_count FROM public.account_homologations h WHERE h.evidence_run_id = v_active;
  IF v_copied <> v_source_count THEN
    RAISE EXCEPTION 'MANUAL_CORRECTION_COPY_MISMATCH: % filas copiadas de %', v_copied, v_source_count USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY SELECT v_run, v_copied;
END;
$$;

COMMENT ON FUNCTION public.create_manual_mapping_run(UUID, UUID, UUID, TEXT, TEXT, UUID) IS 'ADR-011: construye atómicamente un evidence run derivado del activo con una corrección manual de mapping. Solo servidor.';

-- Solo el servidor (Edge Function con la clave de servidor) puede ejecutarla.
REVOKE ALL ON FUNCTION public.create_manual_mapping_run(UUID, UUID, UUID, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_manual_mapping_run(UUID, UUID, UUID, TEXT, TEXT, UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_manual_mapping_run(UUID, UUID, UUID, TEXT, TEXT, UUID) TO service_role;
