---
tipo: decision
id: ADR-008
estado: aceptada
fecha: 2026-10-15
tags: [velarix, decision, seguridad, auth]
---

# ADR-008 — Single-owner private mode (sin login en el flujo normal)

Índice: [[09-decisiones]] · Antecedente: [[ADR-007-personal-valuation-workbench]] · Detalle técnico: [[07-autenticacion]]

## Contexto

**Velarix es un workbench de valoración privado y de un solo owner.** No es SaaS, no tiene autenticación pública ni cuentas de clientes. Pedir login cada vez era fricción sin valor.

Pero toda la capa de datos depende de Supabase Auth:

- El navegador habla directo con Postgres (supabase-js + publishable key). **RLS** filtra cada tabla por `auth.uid()` (`analyses.user_id`, y en cascada documents, calculations, audit_events…).
- **Storage** (`financial-documents`, `reportes-pdf`) exige que la primera carpeta sea `auth.uid()`.
- Las 7 Edge Functions de usuario verifican el JWT (`anonClient.auth.getUser`). `ejecutar-calculo` y `continuar-tras-revision` deciden con `profiles.role`.
- El Expediente y `manual_reviews` exigen `role IN ('analyst','admin')` en RLS.

Quitar Auth habría obligado a hacer públicas las tablas o a poner la secret key en el navegador. Las dos cosas están prohibidas.

## Decisión

Se quita la **fricción humana**, no la identidad. La identidad owner de Supabase se conserva y se obtiene sin interacción:

| Estado | Cuándo | Cómo se obtiene la sesión |
|---|---|---|
| `LOCAL_PRIVATE` | `vite dev` **y** abierto desde loopback | El plugin `vite/owner-session.ts` (solo `vite dev`) inicia sesión del owner **del lado servidor**, con `VELARIX_OWNER_EMAIL`/`VELARIX_OWNER_PASSWORD` de `.env.local` (sin prefijo `VITE_`), y entrega al navegador un JWT de usuario normal. |
| `DEPLOYED_PRIVATE` | Cualquier otro caso (build de producción, Vercel, IP de red) | No existe endpoint automático. Barrera `OwnerGate`: desbloqueo con la cuenta del owner. Sin registro ni recuperación. **Fail closed.** |

Además:

- La sesión persiste en el navegador y supabase-js la refresca sola, así que el servidor solo se consulta cuando no hay sesión.
- Rutas: `/` → `/workbench`. `/auth`, `/login`, `/register`, `/signup` y `/reset-password` solo redirigen a `/workbench`.
- "Cuenta" pasa a **Settings**: modo, Supabase, sesión del owner y rol interno. No hay logout en local.
- Roles: **sin migración**. El owner conserva `admin` internamente (opción A de ADR-007). La UI no muestra gestión de usuarios ni de roles.
- Review Center: se conserva como revisión de Judgment del owner, con estados de UI Abierta → En revisión → Aceptada | Rechazada sobre los mismos valores de `manual_reviews.estado`. No finge varios empleados. Su valor real es que nada continúa sin una **aceptación explícita, con notas y registrada en el audit trail**.

## Alternativas descartadas

- **Desactivar RLS / políticas `anon`:** cualquiera con la URL y la publishable key (pública por diseño, está en el bundle) leería todo.
- **Secret key o service_role en el navegador:** acceso administrativo para cualquiera que abra DevTools.
- **Backend proxy completo con la secret key:** reescribe todas las llamadas de datos, se salta RLS y obliga a cambiar las Edge Functions. Desproporcionado para el problema.

## Consecuencias

- Seguridad de datos idéntica a antes: RLS, Storage policies y Edge Functions sin cambios.
- Credencial nueva en disco: la contraseña del owner en `.env.local` (git-ignored). Tiene poder de usuario (limitado por RLS), no de administrador. Quien tenga acceso a tu sesión de macOS ya tenía acceso a tu navegador con sesión abierta.
- Deuda técnica: los roles `user/analyst/admin` y la regla "el dueño no se auto-aprueba" (`authorization.ts`) siguen existiendo. El owner pasa porque tiene `admin`. Simplificarlo a dueño único es la opción B de ADR-007 y requiere migración remota: no se ejecuta sin confirmación.
- Pendiente remoto: desactivar los signups en Supabase Auth.

## Verificación

`src/test/private-routing.test.tsx`, `src/lib/access-mode.test.ts`, `vite/owner-session-guards.test.ts`, `src/test/secret-exposure.test.ts` y `scripts/check-bundle-secrets.mjs` (corre en cada `npm run build`).
