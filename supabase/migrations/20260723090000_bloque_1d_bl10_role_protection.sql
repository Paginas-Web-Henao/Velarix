-- Bloque 1D-P0 — BL-10: protección de profiles.role contra auto-escalamiento
-- + endurecimiento de RLS de manual_reviews (impide autoaprobación a nivel
-- de base de datos, no solo en la Edge Function).
--
-- NO APLICADA a Supabase remoto. Migración local, revisada manualmente,
-- pendiente de ejecución explícita por el fundador (`supabase db push` o
-- equivalente) — ver docs/velarix/bloque-1d/REPORTE-IMPLEMENTACION-1D-P0.md.
--
-- Diseño explícitamente evitado: una política RLS que compare OLD/NEW
-- directamente (Postgres no expone OLD dentro de la expresión de una
-- policy RLS de la forma en que sí lo hace un trigger). En su lugar se
-- usa un trigger (que sí tiene acceso legítimo a OLD/NEW) combinado con
-- una función RPC SECURITY DEFINER restringida — la única vía sancionada
-- para cambiar un rol.
--
-- LIMITACIÓN TRANSACCIONAL EXPLÍCITA (corrección tras revisión): un
-- `INSERT` en `audit_events` hecho dentro de la misma transacción que
-- luego ejecuta `RAISE EXCEPTION` se revierte junto con el resto de la
-- transacción — Postgres no aplica un `INSERT` cuya transacción termina
-- en error, así que ese registro de auditoría nunca llega a persistir.
-- Por eso el trigger de la sección 1 **ya no intenta auditar** el
-- intento bloqueado: solo lanza la excepción. Auditar de forma durable
-- un rechazo que termina en `RAISE EXCEPTION` requeriría infraestructura
-- adicional fuera de alcance de este parche P0 (p. ej. una conexión
-- separada vía `dblink`/`postgres_fdw`, un `BACKGROUND WORKER`, o migrar
-- a Postgres 17+ con procedimientos que permitan `COMMIT` intermedio
-- dentro de un trigger) — no se improvisó ninguna de estas alternativas.
-- `admin_set_user_role` (sección 2) sí audita sus rechazos de forma
-- durable, porque en ese caso se optó por `RETURN` de un resultado
-- estructurado en vez de `RAISE EXCEPTION`, así que la transacción llega
-- a `COMMIT` con el `INSERT` de auditoría incluido.

-- ═══════════════════════════════════════════════════════════════
-- 1. Trigger protector: ningún UPDATE directo puede cambiar `role`,
--    salvo que se haya autorizado explícitamente vía la bandera de
--    transacción `app.role_change_authorized` (solo la usa
--    admin_set_user_role, más abajo). No audita el intento bloqueado
--    (ver limitación transaccional arriba) — solo bloquea.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.protect_profile_role_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF current_setting('app.role_change_authorized', true) IS DISTINCT FROM 'true' THEN
      -- No se inserta un evento de auditoría aquí: cualquier INSERT hecho
      -- antes de este RAISE EXCEPTION se revertiría junto con él, dando
      -- una falsa impresión de que el intento quedó registrado de forma
      -- durable cuando en realidad no persiste. El bloqueo en sí mismo
      -- (la excepción) es la protección real; queda como limitación
      -- documentada, no como auditoría fallida en silencio.
      RAISE EXCEPTION 'No autorizado: el cambio de rol debe hacerse mediante public.admin_set_user_role().';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role_column();

-- ═══════════════════════════════════════════════════════════════
-- 2. RPC administrativa, única vía sancionada para cambiar un rol.
--    Requiere que el llamante ya tenga role='admin' (proceso de
--    arranque: el primer admin se asigna manualmente por SQL directo
--    en el panel de Supabase, no a través de esta función ni de la app).
--    Un admin no puede cambiar su propio rol por esta vía -- el cambio
--    de rol es siempre un acto sobre un tercero, explícito y auditado.
--
--    Corrección tras revisión: los rechazos ya NO usan RAISE EXCEPTION.
--    Se audita el intento con INSERT y se hace RETURN de un resultado
--    jsonb estructurado -- así la transacción llega a COMMIT y el
--    registro de auditoría persiste de verdad (a diferencia del trigger
--    de la sección 1, que si audita+excepciona en la misma transacción,
--    el INSERT nunca sobrevive). Esta es la única función del par que
--    puede auditar sus propios rechazos de forma durable.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id UUID, new_role TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  IF caller_role IS DISTINCT FROM 'admin' THEN
    INSERT INTO public.audit_events (analysis_id, user_id, event_type, event_detail, component)
    VALUES (
      NULL,
      auth.uid(),
      'intento_rechazado_cambio_rol',
      format('Usuario sin rol admin (role actual: %s) intentó cambiar el rol de %s vía admin_set_user_role', COALESCE(caller_role, 'sin_perfil'), target_user_id),
      'admin_set_user_role'
    );
    RETURN jsonb_build_object('success', false, 'code', 'NOT_ADMIN', 'message', 'No autorizado.');
  END IF;

  IF auth.uid() = target_user_id THEN
    INSERT INTO public.audit_events (analysis_id, user_id, event_type, event_detail, component)
    VALUES (
      NULL,
      auth.uid(),
      'intento_rechazado_cambio_rol',
      'Un administrador intentó cambiar su propio rol vía admin_set_user_role (bloqueado: siempre debe ser sobre un tercero)',
      'admin_set_user_role'
    );
    RETURN jsonb_build_object('success', false, 'code', 'SELF_ROLE_CHANGE_BLOCKED', 'message', 'No autorizado.');
  END IF;

  IF new_role NOT IN ('user', 'analyst', 'admin') THEN
    INSERT INTO public.audit_events (analysis_id, user_id, event_type, event_detail, component)
    VALUES (
      NULL,
      auth.uid(),
      'intento_rechazado_cambio_rol',
      format('Admin %s solicitó un rol destino inválido para el usuario %s', auth.uid(), target_user_id),
      'admin_set_user_role'
    );
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_ROLE', 'message', 'Rol inválido.');
  END IF;

  PERFORM set_config('app.role_change_authorized', 'true', true); -- true = local a esta transacción

  UPDATE public.profiles SET role = new_role, updated_at = now() WHERE id = target_user_id;

  INSERT INTO public.audit_events (analysis_id, user_id, event_type, event_detail, component)
  VALUES (
    NULL,
    auth.uid(),
    'rol_modificado_por_admin',
    format('Admin %s cambió el rol de %s a "%s"', auth.uid(), target_user_id, new_role),
    'admin_set_user_role'
  );

  RETURN jsonb_build_object('success', true, 'code', 'ROLE_UPDATED');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 3. manual_reviews: la política actual ("Users can manage own manual
--    reviews", FOR ALL) permite que el propietario del análisis
--    actualice estado/resolution de su propia revisión a 'aprobado' --
--    exactamente el bug de autoaprobación (R-08/BL-09), reproducible
--    hoy con un UPDATE directo desde el cliente sin pasar por ninguna
--    Edge Function. Se reemplaza por políticas separadas por operación.
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can manage own manual reviews" ON public.manual_reviews;

CREATE POLICY "Owners can view own manual reviews"
  ON public.manual_reviews FOR SELECT
  TO authenticated
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

CREATE POLICY "Analysts and admins can view all manual reviews"
  ON public.manual_reviews FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('analyst', 'admin')));

CREATE POLICY "Owners can request review for own analysis"
  ON public.manual_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid())
    AND requested_by = auth.uid()
  );

-- Único camino para transicionar estado/resolution/reviewed_by: un
-- analista o admin. El propietario del análisis (role='user') no puede
-- aprobar ni bloquear su propia revisión ni desde la app ni con un
-- UPDATE directo a la tabla.
CREATE POLICY "Analysts and admins can update manual reviews"
  ON public.manual_reviews FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('analyst', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('analyst', 'admin')));

-- ═══════════════════════════════════════════════════════════════
-- Notas de verificación manual (no ejecutadas contra Postgres real en
-- este entorno -- no hay Docker ni instancia local de Postgres/Supabase
-- disponible, ver REPORTE-IMPLEMENTACION-1D-P0.md):
--
-- - Sintaxis revisada línea por línea contra la documentación de
--   PL/pgSQL y RLS de Postgres 15 (versión usada por Supabase).
-- - `current_setting(name, true)` con el segundo argumento `true` evita
--   lanzar un error si la variable de sesión nunca fue seteada (caso
--   normal: cualquier UPDATE que no pase por admin_set_user_role).
-- - `set_config(name, value, true)` con tercer argumento `true` limita
--   el efecto a la transacción actual -- no persiste entre llamadas ni
--   se filtra a otras conexiones del pool.
-- - Múltiples políticas RLS permisivas para la misma operación (las dos
--   políticas SELECT) se combinan con OR, comportamiento estándar y
--   documentado de Postgres RLS -- no son excluyentes entre sí.
-- - `admin_set_user_role` devuelve `jsonb` (no `void`) precisamente para
--   poder auditar sus propios rechazos de forma durable -- ver la nota
--   de limitación transaccional al inicio del archivo. El llamante desde
--   una Edge Function debe leer `result.success`/`result.code`, no
--   asumir que "no lanzó excepción" significa éxito.
-- ═══════════════════════════════════════════════════════════════
