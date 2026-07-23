-- ROLLBACK de:
-- supabase/migrations/20260723090000_bloque_1d_bl10_role_protection.sql
--
-- NO EJECUTAR salvo recuperación urgente real. Este archivo revierte
-- ÚNICAMENTE lo creado por esa migración de Bloque 1D-P0 (BL-10) —
-- no toca nada de 1A/1B-P0 ni de ninguna otra migración.
--
-- ⚠️  ADVERTENCIA CRÍTICA DE SEGURIDAD ⚠️
-- La sección 3 de este rollback restaura la política RLS anterior de
-- `manual_reviews` ("Users can manage own manual reviews", FOR ALL).
-- Esa política es la que permitía al PROPIETARIO de un análisis
-- aprobar/bloquear su propia revisión con un UPDATE directo — es decir,
-- restaurarla REABRE la vulnerabilidad de autoaprobación (R-08/BL-09)
-- que este bloque corrigió. Esa sección **solo** debe ejecutarse como
-- medida técnica de emergencia (p. ej. si el trigger de la sección 1
-- está bloqueando incorrectamente un flujo legítimo y no hay tiempo de
-- diagnosticar la causa raíz) y debe revertirse de nuevo (volviendo a
-- aplicar la migración original) tan pronto como sea posible. No debe
-- quedar en ese estado de forma permanente.
--
-- Registro obligatorio: si este rollback se ejecuta alguna vez contra
-- un entorno real, debe documentarse en
-- docs/velarix/plan/REGISTRO-DE-DECISIONES.md con la causa exacta y la
-- fecha en que se reaplicó la protección.

-- ═══════════════════════════════════════════════════════════════
-- 1. Revertir políticas de manual_reviews a la forma anterior a 1D-P0.
--    ⚠️ Ver advertencia de seguridad arriba antes de ejecutar esto.
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Analysts and admins can update manual reviews" ON public.manual_reviews;
DROP POLICY IF EXISTS "Owners can request review for own analysis" ON public.manual_reviews;
DROP POLICY IF EXISTS "Analysts and admins can view all manual reviews" ON public.manual_reviews;
DROP POLICY IF EXISTS "Owners can view own manual reviews" ON public.manual_reviews;

-- Restauración textual exacta de la política previa a 1D-P0
-- (supabase/migrations/20260320180111_a231ac91-bb82-4dd5-a6be-30b7a86fa9f8.sql:35-37).
CREATE POLICY "Users can manage own manual reviews" ON public.manual_reviews
  FOR ALL TO authenticated
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- 2. Revertir la RPC administrativa.
-- ═══════════════════════════════════════════════════════════════

REVOKE ALL ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM authenticated;
DROP FUNCTION IF EXISTS public.admin_set_user_role(UUID, TEXT);

-- ═══════════════════════════════════════════════════════════════
-- 3. Revertir el trigger protector y su función. A partir de aquí,
--    profiles.role vuelve a ser modificable por cualquier UPDATE que
--    pase la política RLS existente de profiles (auth.uid() = id) —
--    es decir, vuelve a ser posible el auto-escalamiento (R-09).
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_profile_role_column();

-- ═══════════════════════════════════════════════════════════════
-- Fin del rollback. Después de ejecutar esto, R-08 y R-09 vuelven a
-- estar abiertos exactamente como estaban antes del Bloque 1D-P0.
-- ═══════════════════════════════════════════════════════════════
