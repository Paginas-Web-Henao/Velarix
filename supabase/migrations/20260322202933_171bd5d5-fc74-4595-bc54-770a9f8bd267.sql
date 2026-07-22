
-- Add missing columns to manual_reviews for the review workflow
ALTER TABLE public.manual_reviews 
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS prioridad text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS cuentas_a_revisar jsonb,
  ADD COLUMN IF NOT EXISTS correcciones jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create indexes for review queries
CREATE INDEX IF NOT EXISTS idx_manual_reviews_estado ON public.manual_reviews(estado);
CREATE INDEX IF NOT EXISTS idx_manual_reviews_prioridad ON public.manual_reviews(prioridad);
