-- Velarix v5 — guardas de escritura para Evidence versionada (ADR-009).
--
-- Migración ADITIVA: no elimina ni modifica políticas existentes y no toca
-- datos. Requiere 20261016120000_evidence_runs_and_document_types.sql.
--
-- Problema: account_homologations tiene la política PERMISSIVE "Users can
-- manage own homologations" (FOR ALL, authenticated). La UI ya rechaza
-- corregir filas versionadas (VERSIONED_MANUAL_MAPPING_CORRECTION_PENDING),
-- pero un cliente autenticado podría escribir directamente. Y la política
-- "Users can update own analyses" permitiría mover active_evidence_run_id.
--
-- 1. Políticas RESTRICTIVE (se combinan con AND con las permissive
--    existentes): para authenticated, las filas con evidence_run_id son de
--    solo lectura y no se pueden crear desde el cliente. Las filas legacy
--    (evidence_run_id NULL) conservan el comportamiento actual. Las Edge
--    Functions usan la clave de servidor (service_role), que no está sujeta a RLS.
-- 2. Trigger en analyses: active_evidence_run_id solo lo cambia el servidor
--    (promoción con compare-and-swap). RLS no puede comparar valor viejo y
--    nuevo de una columna; un trigger BEFORE UPDATE sí.

CREATE POLICY "Versioned homologations are immutable (insert)"
  ON public.account_homologations AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (evidence_run_id IS NULL);

CREATE POLICY "Versioned homologations are immutable (update)"
  ON public.account_homologations AS RESTRICTIVE FOR UPDATE
  TO authenticated
  USING (evidence_run_id IS NULL)
  WITH CHECK (evidence_run_id IS NULL);

CREATE POLICY "Versioned homologations are immutable (delete)"
  ON public.account_homologations AS RESTRICTIVE FOR DELETE
  TO authenticated
  USING (evidence_run_id IS NULL);

CREATE OR REPLACE FUNCTION public.guard_active_evidence_run_pointer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.active_evidence_run_id IS DISTINCT FROM OLD.active_evidence_run_id
     AND current_user IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'active_evidence_run_id solo lo cambia el servidor (promoción de evidence runs, ADR-009)'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_active_evidence_run_pointer
  BEFORE UPDATE OF active_evidence_run_id ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.guard_active_evidence_run_pointer();

COMMENT ON FUNCTION public.guard_active_evidence_run_pointer() IS 'ADR-009: el puntero del set activo de Evidence solo lo mueve el servidor.';
