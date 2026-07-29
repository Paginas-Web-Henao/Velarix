# Reporte de activación — Bloque 1D-OPS

Fecha de activación: 2026-07-23. Proyecto destino (Supabase, enmascarado):
`inuj…eoyh`. Entorno de desarrollo, autorizado explícitamente por no
contener datos reales de clientes — todos los registros creados en este
bloque fueron sintéticos, prefijo `1D_TEST_`.

## Estado final: **parcial, no cerrado**

De las cuatro condiciones exigidas para declarar 1D cerrado, tres se
cumplieron y una no:

| Condición | Resultado |
|---|---|
| Migración aplicada | ✅ Sí |
| Funciones desplegadas | ❌ No — bloqueado (ver limitaciones) |
| Primer admin configurado | ✅ Sí |
| Pruebas críticas reales pasaron | ✅ Sí, las ejecutables a nivel SQL/RPC/RLS |

Por tanto **1D no se marca como cerrado**. La base de datos remota queda
con los controles de seguridad activos y verificados; la exposición de
esos controles a través de las Edge Functions queda pendiente de un
próximo intento, una vez resuelto el bloqueo de permisos descrito abajo.

## 1. Migración aplicada

`supabase/migrations/20260723090000_bloque_1d_bl10_role_protection.sql`,
como parte de la cadena completa de 9 migraciones locales (el proyecto
remoto estaba completamente vacío, sin esquema previo que conservar).

Secuencia: `npx supabase migration list --linked` confirmó 9 migraciones
locales con columna Remote vacía → `npx supabase db push --linked
--dry-run --include-all` confirmó que el dry-run incluía exactamente esas
9 migraciones, en orden cronológico, sin seeds/resets/borrados, ni
archivos ajenos → `npx supabase db push --linked --include-all` las
aplicó todas. `npx supabase migration list --linked` posterior confirmó
las 9 con Local=Remote. `npx supabase inspect db table-stats --linked`
confirmó las 18 tablas del esquema creadas (`analyses`, `documents`,
`documents_parsed`, `account_homologations`, `validation_results`,
`external_snapshots`, `calculation_results`, `report_narratives`,
`generated_reports`, `audit_events`, `profiles`, `analysis_jobs`,
`data_sources`, `snapshot_updates`, `update_jobs_log`,
`structured_inputs`, `manual_reviews`, `job_locks`).

## 2. Funciones desplegadas

**Ninguna.** `npx supabase functions deploy ejecutar-calculo
continuar-tras-revision --project-ref <ref> --use-api` (sin Docker) y
`npx supabase functions list --project-ref <ref>` devuelven
consistentemente `403: "Your account does not have the necessary
privileges to access this endpoint"`. Se confirmó que no es un problema
transitorio (reintentado dos veces, mismo resultado exacto) — a
diferencia de los `502` intermitentes de la API de gestión durante la
migración (esos sí eran transitorios y se resolvieron reintentando). Este
`403` es un límite de privilegios de la cuenta/token conectados,
independiente de la conexión directa a Postgres (que sí funciona sin
problema, incluyendo `db push` e `inspect db`). `npx supabase projects
api-keys` también devuelve el mismo `403`, confirmando que el límite
cubre la superficie de gestión de proyecto (Functions, API keys), no solo
Functions.

## 3. Primer administrador

Configurado mediante SQL directo autorizado, siguiendo exactamente el
mecanismo que la propia migración documenta para el bootstrap ("se asigna
manualmente por SQL directo… no a través de esta función ni de la app"):
`SET LOCAL app.role_change_authorized = 'true'` dentro de una transacción
explícita, inmediatamente antes del único `UPDATE` que fija `role =
'admin'`. No se usó la API pública ni ningún endpoint de administración
vulnerable. Cuenta: `1d_test_admin@velarix-dev.local` (correo sintético,
dominio `.local`, no real). Se verificó posteriormente (prueba #4) que
este admin no puede cambiar su propio rol mediante
`admin_set_user_role` — rechazo `SELF_ROLE_CHANGE_BLOCKED`.

**Esta cuenta se conserva** (no se eliminó al final del bloque) porque
será necesaria para continuar la activación de 1D (despliegue de
Functions) y, después, para 1E — recrearla exigiría repetir el mismo
bootstrap. Es la única cuenta de este bloque que sobrevive; el resto se
eliminó (ver sección 8).

## 4. Matriz breve de pruebas reales (SQL / RPC / RLS)

| # | Prueba | Capa | Resultado |
|---|---|---|---|
| 1 | Usuario normal cambia su propio `role` directo | Trigger SQL | ✅ Bloqueado (`RAISE EXCEPTION`) |
| 2 | Usuario normal cambia el `role` de otro, UPDATE directo | RLS | ✅ Bloqueado (0 filas) |
| 3 | Usuario normal llama `admin_set_user_role` | RPC | ✅ Rechazo estructurado `NOT_ADMIN`, sin modificación |
| 4 | Admin cambia su propio rol vía RPC | RPC | ✅ Rechazo estructurado `SELF_ROLE_CHANGE_BLOCKED` |
| 5 | Admin cambia el rol de otro vía RPC | RPC | ✅ Permitido, `ROLE_UPDATED`, persistido |
| 6 | Cambio autorizado queda auditado | SQL (audit_events) | ✅ Evento `rol_modificado_por_admin` persistido |
| 7 | Intentos rechazados quedan auditados | SQL (audit_events) | ✅ 3 eventos `intento_rechazado_cambio_rol` persistidos |
| 8 | Propietario consulta su propia revisión | RLS | ✅ Visible |
| 9 | Propietario crea una solicitud de revisión propia | RLS (INSERT) | ✅ Permitido |
| 10 | Propietario intenta aprobar/continuar su revisión | RLS | ✅ Bloqueado (0 filas) |
| 11 | Usuario ajeno consulta/modifica la revisión | RLS | ✅ Bloqueado (0 filas en ambos casos, sin distinguir "no existe" de "no autorizado") |
| 12 | Analista consulta la revisión | RLS | ✅ Visible |
| 13 | Analista actualiza la revisión (aprobación válida) | RLS | ✅ Permitido, persistido |
| 14 | Segundo intento de continuar una revisión ya procesada | Edge Function (`continuar-tras-revision`, chequeo de `analysis.status`) | ⚠️ No ejecutable — depende de la función desplegada (sección 2) |
| 15 | Ningún evento de auditoría contiene tokens/claves/headers | SQL (audit_events) | ✅ 0 de 4 eventos con patrón sospechoso |

**Corrección durante la ejecución**: la prueba #11 se ejecutó primero
contra el mismo usuario usado en la prueba #5 (que ya había sido
promovido a `analyst`), dando un falso "permitido". Se detectó, se creó
un quinto usuario sintético (`1D_TEST_ Other2`, `role='user'`,
totalmente ajeno a cualquier otra prueba) y se repitió correctamente,
confirmando el bloqueo real.

Todas las pruebas 1–13 y 15 se ejecutaron con `npx supabase db query
--linked`, simulando el contexto de cada actor con `SET LOCAL ROLE
authenticated` + `SET LOCAL request.jwt.claims` (mecanismo estándar de
prueba de RLS de Supabase — reproduce exactamente lo que ve Postgres
cuando la llamada llega vía PostgREST/Edge Function con un JWT real).

## 5. Pruebas de Edge Functions

**No ejecutables.** Requieren que `ejecutar-calculo` y
`continuar-tras-revision` estén desplegadas (sección 2), lo cual está
bloqueado. No se simuló ningún resultado en su lugar.

## 6. Registros temporales creados y eliminados

Creados: 5 usuarios sintéticos (`1D_TEST_ Admin/Owner/Other/Analyst/Other2`),
1 análisis, 1 structured input, 2 revisiones manuales — todos con
prefijo/marca `1D_TEST_` y correos `@velarix-dev.local`.

Eliminados al finalizar: Owner, Other, Analyst, Other2 (y en cascada, el
análisis, el structured input y las 2 revisiones). **Conservado**:
únicamente el admin (justificación en sección 3). Verificado tras la
limpieza: 1 perfil `1D_TEST_` restante (admin), 0 análisis, 0 revisiones.

## 7. Limitaciones

- **Bloqueo principal**: el token/cuenta conectado no tiene privilegios
  sobre la API de gestión de Functions ni de API keys del proyecto
  (`403` estable, no transitorio) — impide desplegar
  `ejecutar-calculo`/`continuar-tras-revision` y, por tanto, probarlas.
- Durante la aplicación de migraciones y las pruebas SQL se observaron
  varios `502` intermitentes de `api.supabase.com` (Cloudflare, origen
  sobrecargado) — todos transitorios, resueltos reintentando tras una
  breve espera; no afectaron el resultado final.
- La prueba #14 (idempotencia de `continuar-tras-revision`) depende
  enteramente de la función desplegada — no tiene equivalente a nivel
  SQL/RLS puro.

## 8. Rollback disponible

`supabase/rollback/` (creado en el bloque 1D-P0 original) documenta el
rollback de la migración `20260723090000_bloque_1d_bl10_role_protection.sql`.
No se ejecutó ningún rollback en este bloque — la migración se conserva
aplicada intencionalmente.

## 9. Confirmación de entorno mock

El proyecto remoto era, antes de este bloque, un esquema completamente
vacío (sin tablas), confirmado por el usuario y por
`table-stats`/`migration list` antes de aplicar nada. Todos los datos
insertados en este bloque son sintéticos, con prefijo `1D_TEST_` y
correos de dominio `.local` — ningún dato real de cliente fue creado,
leído ni modificado.
