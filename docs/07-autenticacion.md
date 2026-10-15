---
tipo: autenticacion
actualizado: 2026-10-15
tags: [velarix, auth, seguridad, system]
---

# Autenticación y autorización

Volver a [[00-home]] · Arquitectura: [[02-arquitectura]] · Módulo: [[autorizacion]] · Relacionado: [[05-base-de-datos]], [[06-api]]

## Autenticación (Supabase Auth)

- Email + contraseña, **una cuenta personal**. Implementado en `src/contexts/AuthContext.tsx`: `signIn`, `signOut`, `resetPassword` (redirige a `/reset-password`), `updatePassword`.
- Sesión escuchada con `onAuthStateChange`; `ProtectedRoute` en `src/App.tsx` redirige a `/auth` si no hay usuario, `AuthRoute` redirige a `/workbench` si ya hay sesión. `RootRedirect` resuelve `/`.
- **Sin registro público** en la UI (ADR-007). `signUp` sigue existiendo en el contexto, pero ninguna vista lo usa. Para bloquear el registro también por API hay que desactivar los signups en la configuración de Supabase Auth: es un ajuste remoto pendiente de decisión.
- Cliente: `src/integrations/supabase/client.ts` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Público vs. protegido (frontend)

| Ruta | Acceso |
|---|---|
| `/` | Sin contenido: redirige a `/workbench` con sesión o a `/auth` sin ella |
| `/auth`, `/reset-password` | Públicas (`/auth` redirige a `/workbench` si ya hay sesión) |
| `/workbench` ([[workbench]], incluye el [[quick-model]]) | Protegida (`ProtectedRoute` → `/auth`) |
| `/workbench/reviews/:revisionId` ([[revision-manual]]) | Protegida; los datos además requieren rol `analyst`/`admin` vía RLS |
| `/dashboard/*`, `/admin/*` | Redirecciones legacy al workbench (siguen exigiendo sesión) |

No hay ninguna vista pública con datos ni cálculos ([[ADR-007-personal-valuation-workbench]]). Lo verifica `src/test/private-routing.test.tsx`.

## Roles

`profiles.role` (`'user'` por defecto) ∈ `user` | `analyst` | `admin`.

- Trigger `trg_protect_profile_role` impide cambiar `role` por `UPDATE` directo.
- Solo `public.admin_set_user_role()` (llamada por un `admin`, nunca sobre sí mismo) puede cambiarlo.
- `analyst`/`admin`: acceso a todos los análisis, a `manual_reviews` y a las tablas del Expediente.

> Pendiente de confirmar: en v5.0 hay un solo actor real (Nicolás). [[01-scope-surgery]] §1 deja abierto si `analyst`/`admin` siguen siendo el modelo correcto. "Roles, workflows o tablas de aprobación" está en `NOT BUILDING` ([[05-financial-engine-audit]] §10).

## Autorización en Edge Functions

Todas las funciones tienen `verify_jwt = false` en `supabase/config.toml`. Motivo documentado en ese archivo: la puerta de entrada de Supabase no reconoce las nuevas secret keys (`sb_secret_…`) y su validación HS256 es incompatible con la migración prevista a JWT Signing Keys asimétricas. Por eso cada función verifica explícitamente:

| Tipo | Funciones | Mecanismo |
|---|---|---|
| Usuario | parse-document, map-accounts, validate-analysis, build-structured-input, generate-narrative, upload-document, run-analysis-pipeline | `anonClient.auth.getUser(token)`; usa solo el `user.id` verificado (`_shared/user-auth.ts`) |
| Mixtas | ejecutar-calculo, continuar-tras-revision | JWT de usuario **o** secret key `default` en `apikey` (`isInternalServiceCall`, `_shared/authorization.ts`) |
| Solo internas | enviar-notificacion, update-snapshots, check-data-freshness | Secret key `default` en `apikey` |

Claves: `_shared/admin-key.ts` resuelve `SUPABASE_SECRET_KEYS.default` / `SUPABASE_PUBLISHABLE_KEYS.default`. La `service_role` legacy se trató como comprometida (incidente 2026-07-30) y se dejó de usar.

## Historial de seguridad

- [[REPORTE-MIGRACION-CLAVES-LEGACY]]
- [[REPORTE-CORRECCION-RESPUESTAS-AUTH-EDGE-FUNCTIONS]]
- [[REPORTE-PREPARACION-JWT-SIGNING-KEYS]]
- [[REPORTE-CIERRE-HALLAZGOS-AUTH-PRE-JWT]]
- [[MATRIZ-PRUEBAS-AUTORIZACION]]
- [[05-SEGURIDAD-DATOS-RLS]]
