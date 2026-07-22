
-- Table for async job tracking
CREATE TABLE public.analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  progreso_pct INTEGER DEFAULT 0,
  progreso_mensaje TEXT,
  input_payload JSONB,
  output_payload JSONB,
  error_mensaje TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_job UNIQUE (analysis_id, job_type)
);

ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis jobs"
  ON public.analysis_jobs FOR SELECT TO authenticated
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own analysis jobs"
  ON public.analysis_jobs FOR ALL TO authenticated
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

-- Table for data source monitoring
CREATE TABLE public.data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  frecuencia TEXT NOT NULL,
  url_referencia TEXT,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read data sources"
  ON public.data_sources FOR SELECT TO authenticated
  USING (true);

-- Table for snapshot update tracking
CREATE TABLE public.snapshot_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.data_sources(id),
  sector TEXT,
  parametro TEXT NOT NULL,
  valor_anterior NUMERIC,
  valor_nuevo NUMERIC,
  unidad TEXT,
  fecha_dato DATE NOT NULL,
  fuente_detalle TEXT,
  estado TEXT DEFAULT 'pendiente',
  notas_validacion TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.snapshot_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read snapshot updates"
  ON public.snapshot_updates FOR SELECT TO authenticated
  USING (true);

-- Table for update job logs
CREATE TABLE public.update_jobs_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_nombre TEXT NOT NULL,
  estado TEXT NOT NULL,
  parametros JSONB,
  resultado JSONB,
  error_detalle TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.update_jobs_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read update logs"
  ON public.update_jobs_log FOR SELECT TO authenticated
  USING (true);

-- Add macro_payload column to external_snapshots if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'external_snapshots' AND column_name = 'macro_payload'
  ) THEN
    ALTER TABLE public.external_snapshots ADD COLUMN macro_payload JSONB;
  END IF;
END $$;

-- Seed data sources
INSERT INTO public.data_sources (nombre, tipo, frecuencia, url_referencia, descripcion) VALUES
('Damodaran Industry Betas', 'sector_benchmark', 'anual', 'https://pages.stern.nyu.edu/~adamodar/', 'Beta desapalancado y ratio D/E por sector'),
('Damodaran EV Multiples', 'sector_benchmark', 'trimestral', 'https://pages.stern.nyu.edu/~adamodar/', 'EV/EBITDA y EV/Revenue por sector'),
('Damodaran Operating Margins', 'sector_benchmark', 'anual', 'https://pages.stern.nyu.edu/~adamodar/', 'Márgenes operativos y EBITDA por sector'),
('Damodaran Cost of Capital', 'sector_benchmark', 'anual', 'https://pages.stern.nyu.edu/~adamodar/', 'WACC de referencia por sector'),
('Damodaran ERP Emerging Markets', 'riesgo_mercado', 'trimestral', 'https://pages.stern.nyu.edu/~adamodar/', 'Equity Risk Premium mercados emergentes'),
('US Treasury 10Y', 'riesgo_mercado', 'mensual', 'https://fred.stlouisfed.org/', 'Tasa libre de riesgo'),
('EMBI Colombia', 'riesgo_mercado', 'semanal', 'https://www.banrep.gov.co/', 'Country Risk Premium Colombia'),
('Banrep - Tasa Política', 'macro_colombia', 'mensual', 'https://www.banrep.gov.co/', 'Tasa de intervención Banco de la República'),
('DANE - Inflación IPC', 'macro_colombia', 'mensual', 'https://www.dane.gov.co/', 'Inflación IPC Colombia'),
('Banrep - TRM', 'macro_colombia', 'mensual', 'https://www.banrep.gov.co/', 'Tasa de cambio COP/USD promedio mensual'),
('DANE - PIB', 'macro_colombia', 'trimestral', 'https://www.dane.gov.co/', 'Crecimiento PIB real Colombia');
