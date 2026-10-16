-- Velarix — Inmutabilidad REAL de homologaciones versionadas (ADR-009 / ADR-011).
--
-- Migración ADITIVA y LOCAL: una función y un trigger. Sin DROP, sin DELETE,
-- sin UPDATE de datos, sin cambios en políticas existentes.
--
-- Hasta ahora la historia de Evidence versionada la protegían las políticas
-- RESTRICTIVE de 20261016130000, que solo aplican a `authenticated`; la clave
-- de servidor (service_role, BYPASSRLS) podía hacer UPDATE/DELETE. Un trigger
-- se ejecuta para TODOS los roles, service_role incluido.
--
-- Reglas:
-- A. Legacy (evidence_run_id NULL antes y después): sin cambios (corregirCuenta legacy).
-- B. Run en `mapping` (construcción por map-accounts): solo la metadata de
--    mapping puede cambiar (canonical_account, confidence_score,
--    ambiguity_flag, mapping_notes). La Evidence observada (analysis_id,
--    document_id, original_label, category, period, value), el run, la fecha
--    de creación y la lineage nunca cambian.
-- C. Run en cualquier otro estado (mapped, validating, completed, failed): ningún UPDATE.
-- D. Fila versionada: DELETE siempre prohibido.
-- Una corrección posterior correcta es SIEMPRE un evidence run nuevo
-- (create_manual_mapping_run solo hace INSERT).

CREATE OR REPLACE FUNCTION public.guard_versioned_homologation_history()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  run_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.evidence_run_id IS NULL THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'VERSIONED_HOMOLOGATION_IMMUTABLE: una homologación de un evidence run no se borra (run %)', OLD.evidence_run_id USING ERRCODE = '42501';
  END IF;

  -- UPDATE
  IF OLD.evidence_run_id IS NULL AND NEW.evidence_run_id IS NULL THEN
    RETURN NEW; -- legacy
  END IF;
  IF NEW.evidence_run_id IS DISTINCT FROM OLD.evidence_run_id THEN
    RAISE EXCEPTION 'VERSIONED_HOMOLOGATION_IMMUTABLE: una homologación no cambia de evidence run' USING ERRCODE = '42501';
  END IF;
  -- FOR SHARE: la transición mapping → mapped del run espera a los UPDATE en vuelo.
  SELECT r.status INTO run_status FROM public.evidence_runs r WHERE r.id = OLD.evidence_run_id FOR SHARE;
  IF run_status IS DISTINCT FROM 'mapping' THEN
    RAISE EXCEPTION 'VERSIONED_HOMOLOGATION_IMMUTABLE: el run % está en estado %; la corrección es un evidence run nuevo', OLD.evidence_run_id, coalesce(run_status, 'inexistente') USING ERRCODE = '42501';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.analysis_id IS DISTINCT FROM OLD.analysis_id
     OR NEW.document_id IS DISTINCT FROM OLD.document_id
     OR NEW.original_label IS DISTINCT FROM OLD.original_label
     OR NEW.category IS DISTINCT FROM OLD.category
     OR NEW.period IS DISTINCT FROM OLD.period
     OR NEW.value IS DISTINCT FROM OLD.value
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.derived_from_homologation_id IS DISTINCT FROM OLD.derived_from_homologation_id
     OR NEW.manual_correction_by IS DISTINCT FROM OLD.manual_correction_by
     OR NEW.manual_correction_reason IS DISTINCT FROM OLD.manual_correction_reason
     OR NEW.manual_corrected_at IS DISTINCT FROM OLD.manual_corrected_at
     OR NEW.previous_canonical_account IS DISTINCT FROM OLD.previous_canonical_account THEN
    RAISE EXCEPTION 'VERSIONED_HOMOLOGATION_EVIDENCE_IMMUTABLE: durante mapping solo cambia la metadata de mapping (canonical_account, confidence_score, ambiguity_flag, mapping_notes)' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.guard_versioned_homologation_history() IS 'ADR-009/ADR-011: las homologaciones versionadas son inmutables (también para service_role); durante mapping solo cambia la metadata de mapping.';

CREATE TRIGGER guard_versioned_homologation_history
  BEFORE UPDATE OR DELETE ON public.account_homologations
  FOR EACH ROW EXECUTE FUNCTION public.guard_versioned_homologation_history();
