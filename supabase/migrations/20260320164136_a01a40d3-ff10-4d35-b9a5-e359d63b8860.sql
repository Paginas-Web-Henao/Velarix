
-- Fix function search path mutable warning
ALTER FUNCTION public.update_updated_at() SET search_path = public;
