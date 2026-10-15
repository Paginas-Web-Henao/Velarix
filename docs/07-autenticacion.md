---
tipo: autenticacion
actualizado: 2026-10-15
tags: [velarix, auth, seguridad, system]
---

# Acceso, autenticación y autorización

Volver a [[00-home]] · Arquitectura: [[02-arquitectura]] · Módulo: [[autorizacion]] · Decisión: [[ADR-008-single-owner-private-mode]] · Relacionado: [[05-base-de-datos]], [[06-api]]

> **VELARIX IS A PRIVATE SINGLE-OWNER VALUATION WORKBENCH.** No SaaS. No public authentication flow. No customer accounts.

## Principio

No hay login en el flujo normal, pero **los datos siguen protegidos por Supabase Auth + RLS** con la identidad del owner. Se quitó la pantalla, no la seguridad.

## Modos de acceso (`src/lib/access-mode.ts`)

| Modo | Condición | Sesión del owner |
|---|---|---|
| `LOCAL_PRIVATE` | Bundle de desarrollo (`vite dev`) **y** hostname loopback | Automática: `POST /__velarix/owner-session` |
| `DEPLOYED_PRIVATE` | Todo lo demás (build de producción, Vercel, IP de red) | Barrera `OwnerGate`: desbloqueo con la cuenta del owner |

Fail closed: si no hay sesión válida, el workbench no se monta y no se consulta ningún dato.

### Cómo funciona LOCAL_PRIVATE

1. `OwnerSessionProvider` (`src/contexts/OwnerSessionContext.tsx`) busca la sesión persistida en el navegador. Si existe, entra (supabase-js la refresca sola).
2. Si no existe, hace `POST /__velarix/owner-session` con el header `x-velarix-owner: 1`.
3. El plugin `vite/owner-session.ts`, que solo existe en `vite dev`, inicia sesión en Supabase Auth **desde Node** (`/auth/v1/token?grant_type=password` con la publishable key) y devuelve `access_token` + `refresh_token`.
4. El navegador llama a `supabase.auth.setSession`. Desde ahí todo es igual que con un login manual: RLS por `auth.uid()`, Storage por carpeta y JWT verificado en las Edge Functions.

### Configuración (una sola vez)

En `.env.local` (git-ignored; **sin** prefijo `VITE_`, así que Vite nunca lo envía al navegador):

```bash
VELARIX_OWNER_EMAIL=...      # la cuenta owner que ya existe en Supabase Auth
VELARIX_OWNER_PASSWORD=...
```

Luego `npm run dev` y abre `http://localhost:8080`. Si faltan las credenciales, el servidor lo avisa en consola y la app muestra la barrera de desbloqueo.

### Protecciones del endpoint (`vite/owner-session-guards.ts`)

- Solo `vite dev` (`apply: "serve"`): no existe en `vite build`, `vite preview` ni Vercel.
- No se registra si hay `NODE_ENV=production`, `VERCEL` o `CI`, si `server.host` no es loopback, o si faltan credenciales.
- El servidor escucha en `127.0.0.1` (`vite.config.ts`). Antes escuchaba en `::`, es decir, en toda la red.
- Por petición: solo `POST`, IP remota loopback, `Host` loopback (anti DNS-rebinding), `Origin`/`Sec-Fetch-Site` del mismo origen y header propio (obliga a un preflight CORS, que nunca se aprueba).
- Nunca imprime credenciales ni tokens. `Cache-Control: no-store`.

## Secretos: qué puede llegar al navegador

| Valor | ¿En el bundle? |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Sí: públicos por diseño, la seguridad la da RLS |
| `VELARIX_OWNER_EMAIL` / `VELARIX_OWNER_PASSWORD` | **Nunca**: solo los lee el plugin de Vite en Node |
| `SUPABASE_SECRET_KEYS`, service_role | **Nunca**: solo existen en las Edge Functions |

Defensas: `envPrefix: "VITE_"` fijo en `vite.config.ts`, `src/test/secret-exposure.test.ts` y `scripts/check-bundle-secrets.mjs`. Este último corre en cada `npm run build` y falla si `dist/` contiene una `sb_secret_…`, un JWT `service_role` o el valor de cualquier variable server-side.

## Rutas

| Ruta | Comportamiento |
|---|---|
| `/` | → `/workbench` |
| `/workbench`, `/workbench/reviews/:id` | Envueltas en `OwnerGate` |
| `/auth`, `/login`, `/register`, `/signup`, `/reset-password` | Retiradas: redirigen a `/workbench` |
| `/dashboard/*`, `/admin/*` | Redirecciones legacy al workbench |

Lo verifica `src/test/private-routing.test.tsx`. Las páginas `Auth.tsx`, `ResetPassword.tsx`, `AuthContext.tsx` y `UserProfile.tsx` se eliminaron (quedan en el historial de git, commit anterior a ADR-008).

## Roles (deuda técnica documentada)

`profiles.role` ∈ `user` | `analyst` | `admin` sigue en la base de datos **sin cambios**:

- RLS del Expediente y de `manual_reviews` exige `analyst`/`admin`.
- `authorization.ts` (`canContinueAfterReview`) impide que un `user` dueño se auto-apruebe.
- Trigger `trg_protect_profile_role` + `public.admin_set_user_role()` protegen la columna.

**Requisito:** la cuenta owner debe tener `role = 'admin'` (ADR-007, opción A). Settings muestra el rol y avisa si no lo es. La UI no ofrece gestión de usuarios ni de roles. Pasar a "dueño único" puro requiere una migración remota (opción B de ADR-007), pendiente de decisión.

## Autorización en Edge Functions (sin cambios)

Todas las funciones tienen `verify_jwt = false` en `supabase/config.toml`. Cada una verifica la autenticación en su propio código:

| Tipo | Funciones | Mecanismo |
|---|---|---|
| Usuario | parse-document, map-accounts, validate-analysis, build-structured-input, generate-narrative, upload-document, run-analysis-pipeline | `anonClient.auth.getUser(token)`; usa solo el `user.id` verificado (`_shared/user-auth.ts`) |
| Mixtas | ejecutar-calculo, continuar-tras-revision | JWT de usuario **o** secret key `default` en `apikey` (`isInternalServiceCall`) |
| Solo internas | enviar-notificacion, update-snapshots, check-data-freshness | Secret key `default` en `apikey` |

El JWT del owner que llega en LOCAL_PRIVATE es un JWT de usuario normal, así que estas funciones no necesitaron cambios.

## Pendientes remotos (no ejecutados)

- Desactivar los signups en Supabase Auth: hoy la API sigue aceptando `signUp` aunque ninguna UI lo use.
- Opcional: confirmar en Supabase que la cuenta owner tiene `role = 'admin'`.

## Historial de seguridad

- [[REPORTE-MIGRACION-CLAVES-LEGACY]]
- [[REPORTE-CORRECCION-RESPUESTAS-AUTH-EDGE-FUNCTIONS]]
- [[REPORTE-PREPARACION-JWT-SIGNING-KEYS]]
- [[REPORTE-CIERRE-HALLAZGOS-AUTH-PRE-JWT]]
- [[MATRIZ-PRUEBAS-AUTORIZACION]]
- [[05-SEGURIDAD-DATOS-RLS]]
