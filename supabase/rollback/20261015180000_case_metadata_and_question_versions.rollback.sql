-- Rollback MANUAL de 20261015180000_case_metadata_and_question_versions.
-- ⚠ Destructivo: elimina el metadata del caso y el vínculo entre versiones
-- de preguntas (las filas de preguntas se conservan). Ejecutar solo con
-- confirmación explícita.

DROP INDEX IF EXISTS public.idx_expedient_questions_supersedes;
ALTER TABLE public.expedient_questions DROP COLUMN IF EXISTS supersedes_question_id;

ALTER TABLE public.analyses
  DROP COLUMN IF EXISTS business_profile,
  DROP COLUMN IF EXISTS calculation_architecture,
  DROP COLUMN IF EXISTS valued_interest,
  DROP COLUMN IF EXISTS basis_of_value,
  DROP COLUMN IF EXISTS base_period,
  DROP COLUMN IF EXISTS valuation_date;
