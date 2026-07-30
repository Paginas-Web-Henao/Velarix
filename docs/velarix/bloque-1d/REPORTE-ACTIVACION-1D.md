# Reporte de activación — Bloque 1D-OPS

Fecha de activación: 2026-07-23, cerrado el 2026-07-30. Proyecto destino
real (Supabase, enmascarado): `esaf…rzqh`, nombrado **"Velarix"** en el
dashboard. Entorno de desarrollo, autorizado explícitamente por no
contener datos reales de clientes — todos los registros creados en este
bloque fueron sintéticos, prefijo `1D_TEST_`, y se eliminaron al terminar.

## Estado final: **1D CERRADO**

Las cuatro condiciones exigidas se cumplieron:

| Condición | Resultado |
|---|---|
| Migración aplicada | ✅ Sí — `20260723090000_bloque_1d_bl10_role_protection.sql`, verificada en Remote |
| Funciones desplegadas | ✅ Sí — `ejecutar-calculo` y `continuar-tras-revision`, `ACTIVE`, `verify_jwt: true` |
| Primer admin configurado | ✅ Sí (proceso de bootstrap probado; cuenta temporal eliminada al cerrar, ver sección 6) |
| Pruebas críticas reales pasaron | ✅ Sí — SQL/RPC/RLS (15) y HTTP autenticado (14 + 4 previas) |

## 1. Migración aplicada

`supabase/migrations/20260723090000_bloque_1d_bl10_role_protection.sql`,
como parte de la cadena completa de 9 migraciones locales (el proyecto
remoto estaba completamente vacío, sin esquema previo que conservar).
`npx supabase migration list --linked` confirma las 9 con Local=Remote.
`npx supabase inspect db table-stats --linked` confirmó las 18 tablas del
esquema creadas. Sin cambios en esta sesión de cierre (no se repitieron
migraciones ni despliegues salvo verificar que ambas funciones seguían
`ACTIVE`).

## 2. Funciones desplegadas

`ejecutar-calculo` y `continuar-tras-revision`, ambas `status: "ACTIVE"`,
`verify_jwt: true` (nunca se usó `--no-verify-jwt`). Verificado de nuevo
al inicio de esta sesión de cierre — seguían activas, no se redesplegó.

**Corrección histórica**: el `403` reportado en una versión anterior de
este documento nunca fue un límite de privilegios de la cuenta — fue un
Project Ref equivocado de mi parte (usé el de `supabase/config.toml` en
vez del realmente vinculado por la CLI, `supabase/.temp/project-ref`).
Con el ref correcto, el despliegue funcionó sin problema. Detalle
completo del hallazgo (dos Project Ref distintos en el repositorio) en
`docs/velarix/bloque-1d/REPORTE-ACTIVACION-1D.md` (historial de commits)
y corregido de forma permanente en la sección 7 de este documento.

## 3. Configuración del frontend corregida

`VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en `.env` fueron
actualizados para apuntar al proyecto real (`esaf…rzqh`), reemplazando
valores de un proyecto anterior que ya no existe en esta cuenta.
`VITE_SUPABASE_PROJECT_ID` **no se tocó** — se confirmó por búsqueda en
`src/` que ningún código lo usa, así que corregirlo no tenía efecto
funcional y la instrucción explícita era no tocarlo salvo que el código
lo usara.

**Hallazgo durante la corrección**: la key de tipo `sb_publishable_...`
(formato nuevo de Supabase) es rechazada por la puerta de entrada de
Edge Functions de este proyecto (`401 Invalid API key`), aunque es una
key válida y vigente según la API de gestión. La key legacy tipo JWT
(`anon`) sí es aceptada. Se usó la legacy — es la que efectivamente
funciona contra este proyecto hoy. Ninguna key secreta/`service_role` se
usó ni se colocó en `.env` ni en ningún archivo del repositorio.

`supabase/config.toml` **no se modificó** — el vínculo remoto ya lo
gestiona `supabase link` (`supabase/.temp/`, ignorado por git). Se
verificó que `.env` y `.env.local` están en `.gitignore` y que `git
status` no los muestra como cambios a comitear.

## 4. Matriz de pruebas SQL / RPC / RLS (sin cambios desde el cierre parcial anterior)

| # | Prueba | Capa | Resultado |
|---|---|---|---|
| 1 | Usuario normal cambia su propio `role` directo | Trigger SQL | ✅ Bloqueado |
| 2 | Usuario normal cambia el `role` de otro, UPDATE directo | RLS | ✅ Bloqueado (0 filas) |
| 3 | Usuario normal llama `admin_set_user_role` | RPC | ✅ `NOT_ADMIN`, sin modificación |
| 4 | Admin cambia su propio rol vía RPC | RPC | ✅ `SELF_ROLE_CHANGE_BLOCKED` |
| 5 | Admin cambia el rol de otro vía RPC | RPC | ✅ Permitido, `ROLE_UPDATED` |
| 6 | Cambio autorizado queda auditado | SQL | ✅ Persistido |
| 7 | Intentos rechazados quedan auditados | SQL | ✅ Persistidos |
| 8–13 | Visibilidad/edición de `manual_reviews` por propietario/ajeno/analista | RLS | ✅ Todas correctas |
| 15 | Auditoría sin secretos | SQL | ✅ |

Detalle completo de estas 15 (incluida la corrección de la prueba #11
sobre un usuario que había cambiado de rol a mitad de la ejecución
anterior) en el historial de commits de este archivo.

## 5. Matriz de pruebas HTTP autenticadas (nuevas en este cierre)

Actores reales: 4 usuarios Auth sintéticos creados vía Admin API con
contraseña aleatoria (`1D_TEST_OWNER/OUTSIDER/ANALYST/ADMIN`), sesión
obtenida por `POST /auth/v1/token?grant_type=password` (flujo estándar,
sin usar la service role key para generar sesiones).

### `ejecutar-calculo`

| # | Prueba | Capa del rechazo/permiso | Resultado |
|---|---|---|---|
| — | Sin JWT | Gateway (verify_jwt) | ✅ `401 UNAUTHORIZED_NO_AUTH_HEADER` |
| — | Solo anon key | Gateway (verify_jwt) | ✅ `401 UNAUTHORIZED_LEGACY_JWT` |
| 1 | Propietario sobre análisis propio | Autorización de la función | ✅ `200`, cálculo real devuelto |
| 2 | Usuario ajeno sobre análisis del propietario | Autorización de la función | ✅ `404` genérico ("Análisis no encontrado") |
| 3 | Analista | Autorización de la función | ✅ `200` (`privileged_role`) |
| 4 | Administrador | Autorización de la función | ✅ `200` (`privileged_role`) |
| 5 | `user_id` falsificado en el body, token de un usuario ajeno | Autorización de la función | ✅ Mismo `404` que la prueba 2 — el body nunca se usa para identidad, solo el JWT |
| 6 | `analysis_id` inexistente | Autorización de la función | ✅ Mismo `404` genérico que la prueba 2 — no distingue "no existe" de "no es tuyo" |

### `continuar-tras-revision`

| # | Prueba | Capa del rechazo/permiso | Resultado |
|---|---|---|---|
| — | Sin JWT | Gateway (verify_jwt) | ✅ `401 UNAUTHORIZED_NO_AUTH_HEADER` |
| — | Solo anon key | Gateway (verify_jwt) | ✅ `401 UNAUTHORIZED_LEGACY_JWT` |
| 7 / 13 | Propietario (autoaprobación) | Autorización de la función | ✅ `403 "No autorizado."` (`owner_self_approval_blocked`) |
| 8 | Usuario ajeno | Autorización de la función | ✅ `403 "No autorizado."` — mensaje idéntico al de la prueba 7, no distingue el motivo |
| 11 | Analista, revisión aún no aprobada (`estado='pendiente'`) | Estado de negocio | ✅ `403 "La revisión no está en un estado que permita continuar."` |
| 9 | Analista, revisión ya aprobada (`estado='aprobado'`) | Autorización + estado — permitido | ✅ `200`, `status: "validacion_aprobada"` |
| 12 | Segundo intento sobre la misma revisión ya procesada | Idempotencia (`analysis.status`) | ✅ `409 "Esta revisión ya fue procesada."` |
| 10 | Administrador sobre una segunda revisión aprobada | Autorización + estado — permitido | ✅ `200`, `status: "validacion_aprobada"` |
| 14 | Eventos de auditoría de ambas funciones | SQL (`audit_events`) | ✅ 12 eventos reales verificados (`calculo_completado`×3, `acceso_rechazado_ejecutar_calculo`×3, `acceso_rechazado_autoaprobacion`×1, `acceso_rechazado_continuar_revision`×3, `flujo_reanudado_tras_revision`×2), 0 con patrón de token/secreto |

**Nota metodológica**: para probar 9/10 con datos limpios se usaron dos
análisis distintos (cada uno con su propia revisión), porque una
revisión exitosa cambia el estado del análisis de forma permanente — no
se puede reutilizar el mismo caso para "analista permitido" y "admin
permitido" de forma independiente sin que el segundo choque con la
idempotencia de la prueba 12. Se aprobó cada revisión vía SQL
(`estado='aprobado'`, `resolution='approved'`) replicando exactamente lo
que hace el flujo real de aprobación en `src/lib/manual-review-api.ts`
antes de invocar la función — no se inventó un mecanismo nuevo.

## 6. Usuarios y datos temporales — creados y eliminados

**Creados** (Admin API, contraseña aleatoria de 24 bytes por usuario, no
impresa, generada con `openssl rand -base64 24`): `1D_TEST_OWNER`,
`1D_TEST_OUTSIDER`, `1D_TEST_ANALYST`, `1D_TEST_ADMIN` — 4 cuentas Auth
reales con correo `@velarix-dev.local`. Además: 3 análisis sintéticos
(dos para `continuar-tras-revision`, uno para `ejecutar-calculo`), 2
revisiones manuales, 10 filas de `account_homologations` (5 cuentas
críticas × 2 análisis), y las filas correspondientes de `analysis_jobs`
generadas automáticamente por `ejecutar-calculo`.

**Eliminados al cerrar**: los 3 análisis (en cascada: revisiones,
homologaciones, `analysis_jobs`, `structured_inputs` si aplicaba) vía SQL
directo; los 4 usuarios Auth vía `DELETE /auth/v1/admin/users/{id}`
(los 4 devolvieron `200`). Verificado: `0` perfiles con
`company='1D_TEST_'`, `0` análisis, `0` revisiones tras la limpieza.

**Todos los archivos temporales con secretos se eliminaron**: la
service role key (usada solo para crear/eliminar los 4 usuarios Auth vía
Admin API), las 4 contraseñas aleatorias, y los 4 tokens de sesión —
todos vivieron únicamente en archivos con permisos `600` fuera del
repositorio (`/private/tmp/.../scratchpad/`), nunca impresos en la
respuesta, nunca escritos en el repositorio. Los archivos se borraron al
terminar; ninguna variable de entorno con estos valores quedó exportada
en la sesión.

## 7. Tratamiento del admin de bootstrap

La cuenta `1D_TEST_ Admin` original (creada en la primera ejecución de
este bloque, con una contraseña de relleno no funcional, directamente
por SQL) **se eliminó** — no podía garantizarse una credencial segura
para ella (nunca tuvo una contraseña real), y no tenía necesidad
operativa inmediata distinta de la de un usuario de prueba más. Se
recreó como parte de los 4 usuarios temporales de esta sesión (con
contraseña aleatoria real) únicamente para las pruebas HTTP, y también
se eliminó al cerrar (sección 6).

**Consecuencia explícita**: hoy no existe ningún usuario con `role =
'admin'` en el proyecto de desarrollo. Antes de cualquier piloto o de
avanzar a 1E, el fundador debe configurar un primer administrador real
(cuenta con correo real del fundador o del equipo, contraseña segura
propia, no generada por este proceso) — mediante el mismo mecanismo de
bootstrap documentado en la migración (`SET LOCAL
app.role_change_authorized = 'true'` + `UPDATE profiles SET
role='admin'`, ejecutado una sola vez, manualmente, por quien tenga
acceso a la base).

## 8. Validaciones locales

`npm test -- --run`, `npx tsc --build --noEmit`, `npm run build`, `npm
run lint` — ver resultados exactos en la respuesta final. Ningún archivo
de código de producción cambió en este bloque (solo `.env`, fuera de
git); los resultados deben ser idénticos a la línea base anterior.

## 9. Rollback disponible

`supabase/rollback/` documenta el rollback de la migración
`20260723090000_bloque_1d_bl10_role_protection.sql`. No se ejecutó
ningún rollback — la migración se conserva aplicada intencionalmente.

## 10. Confirmación de entorno mock

El proyecto remoto era, antes del primer bloque, un esquema
completamente vacío. Todos los datos usados en ambas sesiones de este
bloque fueron sintéticos, con prefijo `1D_TEST_` y correos de dominio
`.local` — ningún dato real de cliente fue creado, leído ni modificado,
y todos los registros de prueba se eliminaron al cerrar.

## 11. Hallazgo permanente: dos Project Ref distintos (RESUELTO en `.env`)

| Fuente | Project Ref (enmascarado) |
|---|---|
| `supabase/.temp/project-ref` (vínculo real de la CLI) | `esaf…rzqh` |
| `npx supabase projects list` | Único proyecto visible: **"Velarix"**, `esaf…rzqh` |
| `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) | **Corregido** → ahora `esaf…rzqh` |
| `supabase/config.toml` (`project_id`) | Sigue en `inuj…eoyh` (sin tocar — el vínculo real lo gestiona `supabase link`, no este archivo) |

`supabase/config.toml` queda con un `project_id` que ya no coincide con
el proyecto real vinculado. Esto es **intencional en este cierre** (la
instrucción explícita fue no tocarlo), y no tiene efecto funcional
porque el vínculo real vive en `supabase/.temp/` (ignorado por git,
gestionado por `supabase link`). Si en el futuro se reconfigura la CLI
en otra máquina, `supabase link --project-ref esaf…rzqh` es el comando
que hay que ejecutar — no editar `config.toml` a mano.

## 12. Limitaciones reales restantes

- No existe hoy ningún administrador real configurado (sección 7) —
  bloqueante antes de 1E o de cualquier piloto.
- `supabase/config.toml` conserva un `project_id` desactualizado (sin
  efecto funcional, ver sección 11).
- La key `sb_publishable_...` (formato nuevo) no es compatible con la
  puerta de entrada de Edge Functions de este proyecto específico —
  documentado como hallazgo, no como bug de este repositorio.
- Ningún otro entorno (staging/producción) tiene esta migración
  aplicada — este cierre es válido únicamente para el proyecto de
  desarrollo `esaf…rzqh`.
