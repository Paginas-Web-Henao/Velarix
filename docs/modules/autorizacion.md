---
tipo: modulo
capa: transversal
estado_v5: KEEP
actualizado: 2026-10-15
tags: [velarix, modulo, seguridad]
---

# Autorización

Índice: [[03-modulos]] · Detalle: [[07-autenticacion]]

## Archivos (`supabase/functions/_shared/`)
- `authorization.ts` — decisiones puras de acceso (propietario vs. `analyst`/`admin`, cambios de rol, `isInternalServiceCall`).
- `user-auth.ts` — verificación de JWT para las 7 funciones de usuario, respuestas 401/403/404 consistentes.
- `admin-key.ts` — resolución de secret/publishable keys nuevas (reemplazo de `service_role` legacy).
- Migración `20260723090000_bloque_1d_bl10_role_protection.sql` + rollback.

## Tests
`authorization.test.ts`, `user-auth.test.ts`, `pipeline-body-read.test.ts`.
