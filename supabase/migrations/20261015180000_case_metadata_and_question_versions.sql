-- Velarix v5 — metadata estructurado del caso + versiones de preguntas del Expediente.
--
-- Migración ADITIVA: solo columnas nullable nuevas. No toca datos, RLS,
-- calculation_result ni ninguna columna existente. Casos legacy quedan con
-- NULL (la UI muestra "—").
--
-- 1. analyses: metadata del caso que hasta ahora solo vivía en el case MOC
--    (00-home, decisión abierta 5). 1:1 con el caso → columnas, no tabla.
--    RLS: las políticas existentes de analyses (owner por auth.uid()) ya
--    cubren estas columnas; single-owner mode no necesita políticas nuevas.
-- 2. expedient_questions.supersedes_question_id: corrección de wording sin
--    UPDATE. El Expediente es insert-only por RLS; una corrección se registra
--    INSERTANDO una nueva versión que apunta a la anterior. La fila previa no
--    se modifica ni se borra (historial preservado).

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS valuation_date DATE,
  ADD COLUMN IF NOT EXISTS base_period TEXT,
  ADD COLUMN IF NOT EXISTS basis_of_value TEXT,
  ADD COLUMN IF NOT EXISTS valued_interest TEXT,
  ADD COLUMN IF NOT EXISTS calculation_architecture TEXT,
  ADD COLUMN IF NOT EXISTS business_profile JSONB;

COMMENT ON COLUMN public.analyses.valuation_date IS 'Fecha de valoración (P-13). NULL = no documentada.';
COMMENT ON COLUMN public.analyses.base_period IS 'Período base de la Evidence (p. ej. FY2024).';
COMMENT ON COLUMN public.analyses.basis_of_value IS 'Basis of value (p. ej. Market Value (IVS 102)).';
COMMENT ON COLUMN public.analyses.valued_interest IS 'Interés valorado / perímetro.';
COMMENT ON COLUMN public.analyses.calculation_architecture IS 'Arquitectura del cálculo (p. ej. PARENT_DCF_PLUS_SOTP).';
COMMENT ON COLUMN public.analyses.business_profile IS 'Resumen operativo mínimo para el Workbench {summary, segments, geographies, value_drivers, key_risks, moc_path}; cada ítem cita su fuente. El narrativo completo vive en el case MOC.';

ALTER TABLE public.expedient_questions
  ADD COLUMN IF NOT EXISTS supersedes_question_id UUID REFERENCES public.expedient_questions(id);

COMMENT ON COLUMN public.expedient_questions.supersedes_question_id IS 'Esta fila es una nueva versión de la pregunta indicada (corrección de wording). La versión anterior se conserva.';

CREATE INDEX IF NOT EXISTS idx_expedient_questions_supersedes ON public.expedient_questions(supersedes_question_id);
