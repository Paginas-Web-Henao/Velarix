
-- Add missing columns to existing tables
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.report_narratives 
  ADD COLUMN IF NOT EXISTS audit_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS audit_notes TEXT;

-- Create structured_inputs table
CREATE TABLE IF NOT EXISTS public.structured_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE UNIQUE NOT NULL,
  input_payload JSONB NOT NULL,
  version_input TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.structured_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own structured inputs" ON public.structured_inputs
  FOR ALL TO authenticated
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

-- Create manual_reviews table
CREATE TABLE IF NOT EXISTS public.manual_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID NOT NULL,
  reviewed_by UUID,
  reason TEXT NOT NULL,
  resolution TEXT CHECK (resolution IN ('approved','blocked')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.manual_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own manual reviews" ON public.manual_reviews
  FOR ALL TO authenticated
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

-- Create job_locks table
CREATE TABLE IF NOT EXISTS public.job_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_key TEXT UNIQUE NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT now(),
  locked_by TEXT,
  expires_at TIMESTAMPTZ
);
ALTER TABLE public.job_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only for job locks" ON public.job_locks
  FOR ALL TO authenticated
  USING (false);

-- Add status 'revision_manual_requerida' to analysis_status enum
ALTER TYPE public.analysis_status ADD VALUE IF NOT EXISTS 'revision_manual_requerida';

-- Create storage bucket for financial documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'financial-documents',
  'financial-documents',
  false,
  10485760,
  ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','text/csv']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload to their own analysis folders
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'financial-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'financial-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'financial-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_structured_inputs_analysis ON public.structured_inputs(analysis_id);
CREATE INDEX IF NOT EXISTS idx_manual_reviews_analysis ON public.manual_reviews(analysis_id);
CREATE INDEX IF NOT EXISTS idx_job_locks_key ON public.job_locks(job_key);
CREATE INDEX IF NOT EXISTS idx_analyses_deleted ON public.analyses(deleted_at) WHERE deleted_at IS NULL;
