-- Minimum Expediente Checkpoint — subconjunto mínimo del modelo oficial
-- de docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md (§5, §6), acotado
-- a los 4 checks de §0.1: contexto, >=1 cuenta material, >=1 ambigüedad,
-- >=1 tratamiento humano. NO es el Expediente completo (ver §13/§17/§18:
-- el Expediente completo sigue siendo paralelo/no bloqueante).
--
-- APLICADA a Supabase remoto el 2026-08-17. Migration history verificado
-- después de `db push`: local 20260817140000 = remote 20260817140000.
--
-- Decisiones cerradas de esta iteración (no reabrir sin nueva decisión
-- del fundador):
--   1. Materialidad de account_notes: implícita en la existencia de la
--      fila (creada por analyst/admin) — sin columna
--      is_material/materiality/materiality_level.
--   2. Sin `epistemic_status` todavía (§5.1 del Expediente sigue vigente
--      conceptualmente, pero no se congela como ENUM en esta migración
--      mínima — es un tipo transversal que se diseñará junto con las
--      demás entidades del Expediente completo).
--   3. Solo entidades oficiales: valuation_files, account_notes,
--      expedient_questions, expedient_answers. Nada de company_context,
--      evidence_links, normalizations, approvals ni otras tablas del
--      Expediente completo (fuera de alcance de este checkpoint).
--   4. Contexto: analyses.company_name + analyses.sector ya son
--      suficientes — no se crea company_context.
--   5. expedient_answers no lleva UNIQUE(question_id): la especificación
--      no define inequívocamente si habrá una respuesta única o
--      historial de respuestas — el checkpoint solo necesita "existe al
--      menos una respuesta humana para alguna pregunta".
--   6. account_notes no lleva UNIQUE(valuation_file_id, canonical_account):
--      una misma cuenta podría requerir más de una nota en la evolución
--      futura del Expediente.
--   7. **Append-only V1** (revisión de esta sesión): ninguna de las 4
--      tablas tiene política UPDATE — sin ella, RLS deniega UPDATE por
--      defecto para `authenticated`. Motivo: las políticas UPDATE solo
--      comprobaban `role IN ('analyst','admin')`, lo que habría permitido
--      reescribir retroactivamente `created_by`/`generado_por`/
--      `respondido_por` y atribuir una acción histórica a otro usuario.
--      Reducir superficie (sin UPDATE) es más simple que un trigger de
--      inmutabilidad de columnas de actor, y es suficiente para el
--      checkpoint mínimo (que solo necesita que la evidencia exista, no
--      que sea editable). `account_notes.updated_at` se elimina por la
--      misma razón (no hay UPDATE, no tiene uso real todavía). Sin
--      políticas DELETE tampoco, por el mismo motivo de trazabilidad.
--      `service_role` conserva su capacidad administrativa normal (RLS
--      no le aplica).
--   8. **`account_note_id` pospuesto** (revisión de esta sesión): el
--      modelo oficial (§6) lo define como FK opcional en
--      expedient_questions ("puede vincularse opcionalmente a
--      account_notes... una pregunta puede no estar ligada a nada más
--      que la empresa en general") — omitirlo no es una desviación del
--      modelo, es usar la opción ya prevista de "sin vínculo". Se pospone
--      porque (a) ninguno de los 4 checks del checkpoint lo necesita, y
--      (b) una FK simple no garantiza que
--      account_note.valuation_file_id coincida con el
--      expedient_question.valuation_file_id de la misma fila (integridad
--      cross-parent) — resolverlo requeriría un trigger, que esta
--      revisión evita deliberadamente. Se diseñará junto con el resto
--      del Expediente completo, cuando esa relación sea realmente
--      necesaria.
--   9. Índice único de `valuation_files.analysis_id` no duplicado: el
--      propio constraint UNIQUE NOT NULL ya crea su índice — no se
--      agrega un CREATE INDEX adicional sobre la misma columna.

-- ═══════════════════════════════════════════════════════════════
-- 1. valuation_files — contenedor raíz, 1:1 con analyses.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.valuation_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.valuation_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analysts and admins can view all valuation_files"
  ON public.valuation_files FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('analyst', 'admin')));

-- Protección de identidad de actor: no basta con el rol — created_by
-- debe ser el propio auth.uid() de quien inserta (nadie puede atribuir
-- la creación del expediente a otro analista).
CREATE POLICY "Analysts and admins can create valuation_files"
  ON public.valuation_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('analyst', 'admin'))
    AND created_by = auth.uid()
  );

-- Append-only V1: sin política UPDATE ni DELETE (ver decisión 7 arriba).
-- Sin ellas, RLS deniega esas operaciones por defecto para `authenticated`.

-- Sin CREATE INDEX sobre analysis_id: el constraint UNIQUE NOT NULL de
-- arriba ya crea su propio índice (decisión 9).

-- ═══════════════════════════════════════════════════════════════
-- 2. account_notes — interpretación de una cuenta material (§5). La
--    existencia de la fila ES la marca de materialidad (decisión 1).
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.account_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_file_id UUID REFERENCES public.valuation_files(id) ON DELETE CASCADE NOT NULL,
  canonical_account TEXT NOT NULL,
  interpretation_text TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.account_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analysts and admins can view all account_notes"
  ON public.account_notes FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('analyst', 'admin')));

CREATE POLICY "Analysts and admins can create account_notes"
  ON public.account_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('analyst', 'admin'))
    AND created_by = auth.uid()
  );

-- Append-only V1: sin política UPDATE ni DELETE (ver decisión 7 arriba).
-- Si la interpretación cambia, se registra otra fila (no hay UNIQUE por
-- canonical_account, decisión 6) en vez de editar la existente.

CREATE INDEX idx_account_notes_valuation_file ON public.account_notes(valuation_file_id);

-- ═══════════════════════════════════════════════════════════════
-- 3. expedient_questions — ambigüedad (§5, §10). Sin account_note_id en
--    esta iteración (decisión 8) — pospuesto, no es una desviación del
--    modelo oficial (§6 ya prevé preguntas sin ese vínculo).
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.expedient_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_file_id UUID REFERENCES public.valuation_files(id) ON DELETE CASCADE NOT NULL,
  texto TEXT NOT NULL,
  razon TEXT,
  materialidad TEXT CHECK (materialidad IN ('alta', 'media', 'baja')),
  generado_por_ia BOOLEAN NOT NULL DEFAULT false,
  generado_por UUID REFERENCES auth.users(id),
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'respondida', 'evaluada', 'cerrada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expedient_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analysts and admins can view all expedient_questions"
  ON public.expedient_questions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('analyst', 'admin')));

-- No usamos IA todavía: para una pregunta insertada como humana,
-- generado_por_ia debe ser false y generado_por debe ser el propio
-- auth.uid() de quien la crea — nadie puede atribuir la pregunta a otro
-- analista ni marcarla como generada por IA para saltarse la atribución
-- humana.
CREATE POLICY "Analysts and admins can create human expedient_questions"
  ON public.expedient_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('analyst', 'admin'))
    AND generado_por_ia = false
    AND generado_por = auth.uid()
  );

-- Append-only V1: sin política UPDATE ni DELETE (ver decisión 7 arriba).
-- `estado` queda en su valor por defecto ('abierta') en esta iteración —
-- las transiciones de estado son Expediente completo, fuera de alcance.

CREATE INDEX idx_expedient_questions_valuation_file ON public.expedient_questions(valuation_file_id);

-- ═══════════════════════════════════════════════════════════════
-- 4. expedient_answers — tratamiento/interpretación humana (§5, §6).
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.expedient_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.expedient_questions(id) ON DELETE CASCADE NOT NULL,
  respuesta_texto TEXT NOT NULL,
  respondido_por UUID REFERENCES auth.users(id) NOT NULL,
  respondido_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expedient_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analysts and admins can view all expedient_answers"
  ON public.expedient_answers FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('analyst', 'admin')));

-- Protección de identidad: un analista no puede insertar una respuesta
-- atribuyéndola a otro (respondido_por = auth.uid() obligatorio).
CREATE POLICY "Analysts and admins can create expedient_answers"
  ON public.expedient_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('analyst', 'admin'))
    AND respondido_por = auth.uid()
  );

-- Append-only V1, reforzado: expedient_answers es la evidencia histórica
-- más sensible del checkpoint — sin política UPDATE NI DELETE (ver
-- decisión 7). Una respuesta ya registrada no se reescribe; futuras
-- correcciones/historial se diseñarán explícitamente si hacen falta.

CREATE INDEX idx_expedient_answers_question ON public.expedient_answers(question_id);
