
-- Velarix Backend Schema: Complete data model for financial analysis platform

-- Enum for analysis status
CREATE TYPE public.analysis_status AS ENUM (
  'creado',
  'documentos_cargados',
  'parsing_en_curso',
  'parsing_completado',
  'homologacion_en_curso',
  'validacion_aprobada',
  'validacion_con_advertencias',
  'validacion_bloqueada',
  'calculo_en_curso',
  'calculo_completo',
  'interpretacion_en_curso',
  'informe_generado',
  'error_tecnico'
);

-- Enum for validation severity
CREATE TYPE public.validation_severity AS ENUM ('critica', 'media', 'informativa');

-- Enum for confidence score
CREATE TYPE public.confidence_level AS ENUM ('alta', 'media', 'baja');

-- Enum for document processing status
CREATE TYPE public.doc_processing_status AS ENUM ('pendiente', 'procesando', 'completado', 'fallido');

-- 1. Analyses (cases)
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL DEFAULT 'Empresa Demo',
  sector TEXT NOT NULL,
  expected_growth NUMERIC(6,2) DEFAULT 25.0,
  status public.analysis_status NOT NULL DEFAULT 'creado',
  validation_status TEXT,
  snapshot_id UUID,
  input_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses"
  ON public.analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  doc_type_declared TEXT,
  original_filename TEXT NOT NULL,
  mime_type TEXT,
  storage_path TEXT,
  checksum TEXT,
  file_size_bytes BIGINT,
  processing_status public.doc_processing_status NOT NULL DEFAULT 'pendiente',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
  ON public.documents FOR ALL
  TO authenticated
  USING (
    analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid())
  );

-- 3. Parsed documents
CREATE TABLE public.documents_parsed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  parsed_structure JSONB NOT NULL DEFAULT '{}',
  periods_detected TEXT[],
  parsing_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents_parsed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parsed docs"
  ON public.documents_parsed FOR SELECT
  TO authenticated
  USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      JOIN public.analyses a ON d.analysis_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- 4. Account homologation (mapping)
CREATE TABLE public.account_homologations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  original_label TEXT NOT NULL,
  canonical_account TEXT NOT NULL,
  category TEXT NOT NULL,
  period TEXT,
  value NUMERIC(18,2),
  confidence_score public.confidence_level NOT NULL DEFAULT 'alta',
  ambiguity_flag BOOLEAN DEFAULT false,
  mapping_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.account_homologations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own homologations"
  ON public.account_homologations FOR ALL
  TO authenticated
  USING (
    analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid())
  );

-- 5. Validation results
CREATE TABLE public.validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  rule_code TEXT NOT NULL,
  severity public.validation_severity NOT NULL,
  status TEXT NOT NULL,
  detail TEXT,
  blocking_flag BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.validation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own validations"
  ON public.validation_results FOR SELECT
  TO authenticated
  USING (
    analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid())
  );

-- 6. External snapshots (immutable reference data)
CREATE TABLE public.external_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_date DATE NOT NULL,
  source_version TEXT,
  sector TEXT,
  data_payload JSONB NOT NULL,
  macro_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.external_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read snapshots"
  ON public.external_snapshots FOR SELECT
  TO authenticated
  USING (true);

-- 7. Calculation results
CREATE TABLE public.calculation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  input_payload JSONB NOT NULL,
  output_payload JSONB NOT NULL,
  engine_version TEXT DEFAULT '2.1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calculation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calculations"
  ON public.calculation_results FOR ALL
  TO authenticated
  USING (
    analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid())
  );

-- 8. Report narratives (AI-generated text)
CREATE TABLE public.report_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  executive_summary TEXT,
  sections_payload JSONB,
  generation_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.report_narratives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own narratives"
  ON public.report_narratives FOR ALL
  TO authenticated
  USING (
    analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid())
  );

-- 9. Generated reports
CREATE TABLE public.generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT,
  report_version TEXT DEFAULT '1.0',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reports"
  ON public.generated_reports FOR ALL
  TO authenticated
  USING (
    analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid())
  );

-- 10. Audit events
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_detail TEXT,
  component TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit events"
  ON public.audit_events FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create audit events"
  ON public.audit_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 11. User profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes for performance
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_documents_analysis_id ON public.documents(analysis_id);
CREATE INDEX idx_audit_events_analysis_id ON public.audit_events(analysis_id);
CREATE INDEX idx_audit_events_user_id ON public.audit_events(user_id);
CREATE INDEX idx_external_snapshots_sector ON public.external_snapshots(sector);
CREATE INDEX idx_external_snapshots_date ON public.external_snapshots(effective_date);
