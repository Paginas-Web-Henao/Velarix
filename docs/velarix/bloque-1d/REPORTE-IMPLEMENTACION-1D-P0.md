# Reporte de implementación — Bloque 1D-P0 (Seguridad P0 del flujo financiero)

Fecha: 2026-07-23. Alcance: exclusivamente BL-07, BL-08, recorte P0 de
BL-09, BL-10, RLS/controles estrictamente necesarios, auditoría y
pruebas de autorización. No se inició 1B-metodología, 1C ni 1E.

## 1. Checkpoint

Commit `6a8d027` ("chore: checkpoint phase 1A and 1B-P0") creado antes de
tocar cualquier archivo de seguridad — conserva el estado aprobado de
1A/1B-P0. Ver sección 9 para el detalle de qué se excluyó.

## 2. Hallazgos confirmados antes de corregir (evidencia)

- `ejecutar-calculo/index.ts` (antes): `if (!authHeader) throw...` — solo
  verifica que el header **exista**, nunca lo valida contra Supabase Auth
  ni verifica ownership. Cualquier string no vacío pasaba.
- `continuar-tras-revision/index.ts` (antes): **ningún** chequeo de
  autenticación — ni siquiera la presencia del header. Invocable por
  cualquiera que conozca la URL pública y un `analysis_id`.
- `profiles` RLS (`UPDATE ... USING (auth.uid() = id)`, sin
  `WITH CHECK`): un usuario puede actualizar su propia fila, incluida la
  columna `role`, sin ninguna restricción — auto-escalamiento directo.
- **Hallazgo nuevo, no documentado antes de este bloque**:
  `manual_reviews` RLS (`FOR ALL USING (analysis_id IN (SELECT id FROM
  analyses WHERE user_id = auth.uid()))`) permite que el **propietario**
  del análisis actualice `estado`/`resolution` de su propia revisión a
  `'aprobado'` mediante un UPDATE directo a la tabla — sin pasar por
  ninguna Edge Function ni por el frontend. Esto significa que el bug de
  autoaprobación (R-08) existía también **a nivel de base de datos**, no
  solo en la ausencia de verificación de la Edge Function. Corregido en
  la migración de BL-10 (sección 6).
- `manual_reviews` (hallazgo adicional): con la política anterior, un
  analista real (`role='analyst'`) **no podía** ver ni actualizar
  revisiones de análisis ajenos — la política solo permitía al
  propietario. El flujo de `/admin/revisiones` estaba roto para un
  analista real, no solo inseguro para un cliente. También corregido.

## 3. Controles implementados

### Módulo puro `supabase/functions/_shared/authorization.ts`

`canExecuteCalculation`, `canContinueAfterReview`, `canChangeRole`,
`isInternalServiceCall` — sin imports de URL, sin Supabase, sin
`serve()`, sin variables de entorno. Importado y usado realmente por
`ejecutar-calculo/index.ts` y `continuar-tras-revision/index.ts` (no
copiado dentro de las pruebas).

### BL-07 — `ejecutar-calculo/index.ts`

- Resuelve identidad real: `anonClient.auth.getUser(jwt)` → `profiles.role`.
- Detecta invocación interna comparando el `Authorization` header contra
  el valor real de `SUPABASE_SERVICE_ROLE_KEY` (nunca un campo público).
- Decide con `canExecuteCalculation`: propietario permitido sobre su
  propio análisis (regla de negocio actual — ejecutar el cálculo es una
  acción normal del flujo, no una aprobación); analista/admin permitidos
  sobre cualquier análisis; usuario ajeno y "análisis no encontrado"
  responden con **el mismo** status (404) y **el mismo** mensaje
  genérico, para no confirmar la existencia de análisis ajenos.
- Registra `acceso_rechazado_ejecutar_calculo` en `audit_events` en cada
  rechazo, con el `reasonCode` interno (nunca expuesto al cliente).

### BL-08/BL-09 — `continuar-tras-revision/index.ts`

- Misma resolución de identidad que BL-07.
- `canContinueAfterReview` exige analista, admin, o invocación interna —
  **ownership nunca es suficiente aquí**, a diferencia de BL-07.
- Verifica que la revisión más reciente (`manual_reviews.estado`) esté
  en `'aprobado'` antes de permitir continuar.
- Control de idempotencia: si `analyses.status` ya no es
  `'revision_manual_requerida'`, se interpreta como "ya continuado antes"
  y se rechaza con 409 — sin agregar columnas nuevas, reutilizando el
  estado ya existente.
- Registra `acceso_rechazado_autoaprobacion` (cuando el propietario
  intenta autoaprobarse) o `acceso_rechazado_continuar_revision` (el
  resto de rechazos) en `audit_events`.

### BL-10 — protección de `profiles.role`

Ver sección 6 (migración SQL, no aplicada).

## 4. Modelo de actores implementado

Basado estrictamente en el esquema ya existente (`profiles.role TEXT
DEFAULT 'user'`) — no se creó ninguna jerarquía paralela.

| Actor | Puede | No puede |
|---|---|---|
| Cliente propietario (`role='user'`) | Consultar y ejecutar cálculo sobre su propio análisis | Aprobar/continuar su propia revisión; cambiar su rol; actuar sobre análisis ajenos |
| Analista (`role='analyst'`) | Revisar, aprobar/bloquear, continuar el pipeline de cualquier análisis | Cambiar roles (a menos que también sea admin) |
| Administrador (`role='admin'`) | Todo lo del analista + `admin_set_user_role` sobre terceros | Cambiar su propio rol por `admin_set_user_role` |
| Invocación interna | Ejecutar cálculo y continuar revisión, verificado contra la service role key real | Nada más — no es un bypass general, solo cubre estas dos funciones |

No se construyó ningún sistema de asignación análisis↔analista — hoy
cualquier `role='analyst'` está autorizado para cualquier análisis, tal
como instruyó explícitamente el alcance de este bloque.

## 5. Auditoría

Eventos nuevos o confirmados en `audit_events`:

| Evento | Dónde | Cuándo |
|---|---|---|
| `acceso_rechazado_ejecutar_calculo` | `ejecutar-calculo` | Cualquier rechazo de autorización |
| `acceso_rechazado_autoaprobacion` | `continuar-tras-revision` | Propietario intenta autoaprobarse |
| `acceso_rechazado_continuar_revision` | `continuar-tras-revision` | Cualquier otro rechazo (sin sesión, sin rol, estado inválido, ya procesado) |
| `flujo_reanudado_tras_revision` | `continuar-tras-revision` | Continuación autorizada (ya existía, se le agregó `user_id` y el `reasonCode`) |
| `intento_rechazado_cambio_rol` | Trigger + RPC de BL-10 | UPDATE directo bloqueado, o llamada no autorizada a `admin_set_user_role` |
| `rol_modificado_por_admin` | RPC `admin_set_user_role` | Cambio de rol exitoso |
| `revision_manual_aprobada`, `revision_manual_bloqueada` | Ya existían en `manual-review-api.ts` | Sin cambios — ya cubrían "revisión aprobada/bloqueada" |
| `calculo_completado` | Ya existía en `ejecutar-calculo` | Sin cambios — ya cubría "cálculo ejecutado" |

Ningún evento nuevo registra tokens, claves, documentos completos ni
headers de autorización — solo `user_id`, `reasonCode` interno, y
mensajes descriptivos sin datos sensibles.

## 6. Migración SQL — creada, NO aplicada

`supabase/migrations/20260723090000_bloque_1d_bl10_role_protection.sql`

Contenido:
1. Trigger `protect_profile_role_column()` en `profiles` — bloquea
   cualquier UPDATE que cambie `role` salvo que se haya autorizado
   explícitamente vía una bandera de transacción (`app.role_change_authorized`,
   `set_config(..., true)` — no comparación directa OLD/NEW en una
   política RLS, que Postgres no permite de esa forma; el trigger sí
   tiene acceso legítimo a OLD/NEW).
2. RPC `admin_set_user_role(target_user_id, new_role)` — SECURITY
   DEFINER, única vía sancionada para cambiar un rol: verifica que el
   llamante ya sea admin, bloquea el auto-cambio incluso para un admin,
   valida el rol destino, y es la que activa la bandera de autorización
   antes de hacer el UPDATE real.
3. Reemplazo de la política `FOR ALL` de `manual_reviews` por 4
   políticas separadas (SELECT propio, SELECT para analista/admin,
   INSERT propio, UPDATE solo analista/admin) — cierra el hallazgo nuevo
   de la sección 2.

**No se ejecutó** contra ningún Postgres (ni local ni remoto) — no hay
Docker ni instancia de Postgres/Supabase disponible en este entorno.
Revisada línea por línea contra la sintaxis de PL/pgSQL y RLS de
Postgres 15. Ver notas de verificación al final del propio archivo SQL.

## 7. Pruebas

`supabase/functions/_shared/authorization.test.ts` — 24 pruebas, todas
pasan. Cubre los 12 escenarios mínimos exigidos — ver
`MATRIZ-PRUEBAS-AUTORIZACION.md` para el mapeo completo.

```
$ npx vitest run supabase/functions/_shared/authorization.test.ts
 Test Files  1 passed (1)
      Tests  24 passed (24)
```

## 8. Validación final

| Comando | Resultado | Comparación con baseline (post 1B-P0) |
|---|---|---|
| `npm test -- --run` | **8 archivos, 83 pruebas, 0 fallos** | +24 pruebas nuevas, 0 regresiones (antes: 59) |
| `npx tsc --build --noEmit` | Sin salida — limpio | Idéntico |
| `npm run build` | Exitoso, mismo tamaño de bundle | Idéntico |
| `npm run lint` | **303 problemas (279 errores, 24 warnings)** | **Idéntico al de 1B-P0** — cero errores nuevos en `_shared/authorization.ts`/`.test.ts`; los `any` reportados en `ejecutar-calculo`/`continuar-tras-revision` son líneas preexistentes (`function runEngine(input: any...)`, `cuentas.map((c: any) => ...)`), no introducidas por este bloque |

## 9. Checkpoint — archivos incluidos y excluidos

Commit `6a8d027`. Incluidos: todo el código fuente, pruebas y
documentación de 1A/1B-P0, y los dos documentos de negocio vigentes
(`NEGOCIO_V4_VELARIX.md`, `Negocio_Velarix_v4.1.md`).

Excluidos explícitamente (verificados con `git status --ignored` antes
del commit — todos ya cubiertos por `.gitignore`, ninguno se forzó):
- `velarix-bloque-1a.zip`, `velarix-documentacion-auditoria.zip` (ZIPs
  de entregas anteriores) y `velarix-bloque-1b-p0.zip` (no existía aún
  al momento del checkpoint).
- `.env`, `velarix-code-latest/.env`.
- `velarix-code-latest/` (carpeta de respaldo completa).
- `node_modules/`, `dist/`.
- `.DS_Store` (raíz, `docs/`, `docs/velarix/`).
- `.claude/settings.local.json` (configuración local de herramienta, no
  del proyecto).

No se encontró ningún archivo ambiguo adicional que pareciera secreto o
respaldo y no estuviera ya cubierto por `.gitignore`.

## 10. Decisiones y limitaciones que permanecen abiertas

- El **arranque del primer admin** no está automatizado: requiere un
  `UPDATE profiles SET role='admin' WHERE id = '<uuid>'` manual desde el
  panel de Supabase (SQL Editor), fuera de la aplicación — documentado
  aquí, no implementado como parte de este bloque (no hay todavía un
  segundo admin que pueda invocar `admin_set_user_role` para crear al
  primero).
- El sistema de asignación entre múltiples analistas (qué analista
  puede ver qué análisis) **no se construyó** — explícitamente fuera de
  alcance. Hoy, cualquier `role='analyst'` ve/gestiona todas las
  revisiones.
- `BL-18` (refactor general de `_shared/auth.ts` para las 12 Edge
  Functions) sigue fuera de alcance — solo se tocaron `ejecutar-calculo`
  y `continuar-tras-revision`.
- La migración SQL no fue probada contra un Postgres real — ver
  limitaciones exactas en `MATRIZ-PRUEBAS-AUTORIZACION.md`.
- `/admin/revisiones` (frontend) sigue protegida solo por `ProtectedRoute`
  (cualquier usuario autenticado puede navegar ahí) — la RLS de
  `manual_reviews` ahora impide que vean/modifiquen datos que no les
  corresponden, pero no se tocó el guard de la ruta en el frontend (fuera
  de alcance: "no dashboards", "no reorganices código").
- R-06/R-07 (`ejecutar-calculo`/`continuar-tras-revision` sin ownership)
  quedan cerrados por este bloque; R-08 (autoaprobación) cerrado con el
  recorte P0 (RLS + Edge Function); R-09/BL-10 (auto-escalamiento de rol)
  cerrado con la migración, pendiente de aplicarse.

## 11. Confirmación de alcance

No se tocó: eliminación de datos, privacidad con Anthropic, conexión de
narrativa, conexión del PDF al servidor, cambios financieros/metodológicos,
dashboards, pagos, migraciones destructivas, despliegues, ni llamadas
remotas a Supabase. No se aplicó la migración SQL. No se inició
1B-metodología, 1C ni 1E.

---

## 12. Adenda — Finalización operativa de 1D-P0 (2026-07-23, sesión posterior)

Continuación exclusiva de: corregir una imprecisión transaccional de
auditoría, validar/crear rollback, intentar aplicar la migración,
configurar el primer admin, pruebas reales, y cierre. No se repitió ni
se reabrió la implementación de BL-07/BL-08/BL-09 ya cerrada arriba.

### 12.1 Corrección de la auditoría transaccional

Hallazgo: un `INSERT INTO audit_events` hecho **antes** de un `RAISE
EXCEPTION` dentro de la misma transacción se revierte junto con esa
transacción — Postgres no aplica cambios de una transacción que termina
en error. La migración original declaraba (incorrectamente) que el
trigger de `profiles` "registra" el intento bloqueado antes de
lanzar la excepción; ese registro nunca habría persistido.

Corrección aplicada en
`supabase/migrations/20260723090000_bloque_1d_bl10_role_protection.sql`:

- **Trigger `protect_profile_role_column()`**: se eliminó el `INSERT` de
  auditoría. Ahora solo bloquea (`RAISE EXCEPTION`) — se documenta
  explícitamente, en el propio archivo SQL y aquí, que **un rechazo
  producido directamente por el trigger no puede auditarse de forma
  durable dentro de esa misma transacción sin infraestructura adicional**
  (conexión separada vía `dblink`/`postgres_fdw`, background worker, o
  Postgres 17+ con `COMMIT` intermedio en un procedimiento) — ninguna de
  esas alternativas se implementó, por ser desproporcionada para un
  parche P0.
- **RPC `admin_set_user_role`**: cambió su tipo de retorno de `void` a
  `jsonb`. Los tres rechazos (`NOT_ADMIN`, `SELF_ROLE_CHANGE_BLOCKED`,
  `INVALID_ROLE`) ahora usan `RETURN jsonb_build_object(...)` en vez de
  `RAISE EXCEPTION` — la transacción llega a `COMMIT` en todos los casos,
  así que el `INSERT` de auditoría que precede a cada `RETURN` sí
  persiste de verdad. Éxito devuelve `{"success": true, "code":
  "ROLE_UPDATED"}`.

No se modificó `_shared/authorization.ts` ni sus pruebas: `canChangeRole`
es una decisión pura independiente del SQL (no invoca la RPC), sigue
siendo válida y consistente con la nueva forma de `admin_set_user_role`.

### 12.2 Rollback creado

`supabase/rollback/20260723090000_bloque_1d_bl10_role_protection.rollback.sql`
— revierte únicamente el trigger, las dos funciones y las 4 políticas de
`manual_reviews` de esta migración. Incluye advertencia explícita: restaurar
la política anterior de `manual_reviews` reabre la autoaprobación (R-08) y
solo debe usarse para recuperación urgente, revirtiendo el rollback (volviendo
a aplicar la migración) tan pronto sea posible. **No ejecutado.**

### 12.3 Preflight de Supabase — BLOQUEADO, no se improvisó

```
$ which supabase   -> not found
$ which psql       -> not found
$ which docker     -> not found (tampoco se habría usado)
```

`.env` local contiene únicamente `VITE_SUPABASE_PROJECT_ID`,
`VITE_SUPABASE_PUBLISHABLE_KEY` (anon key, segura del lado del cliente) y
`VITE_SUPABASE_URL` — **no hay** `SUPABASE_SERVICE_ROLE_KEY` ni
`DATABASE_URL`/cadena de conexión completa disponible localmente. Existe
`supabase/config.toml` con un `project_id` (vinculación declarada), pero
sin el CLI no se puede confirmar el entorno (dev/no-producción) ni
ejecutar la migración de ninguna forma segura.

Conforme a la instrucción explícita de no improvisar cuando el CLI no
está disponible: **no se intentó ninguna vía alternativa** (no se
instaló el CLI, no se usó un cliente Postgres genérico con credenciales
inexistentes, no se llamó a la API de gestión de Supabase directamente).
La migración queda lista, revisada y corregida, esperando ejecución
manual por el fundador con el CLI o el panel de Supabase.

### 12.4 Migración — NO aplicada

Motivo exacto: bloqueo de herramientas (sección 12.3). Ningún comando de
aplicación se ejecutó. No hay identificador de migración aplicada que
registrar.

### 12.5 Primer administrador — pendiente

No configurado. Depende de que la migración esté aplicada (la función
`admin_set_user_role` y el trigger no existen todavía en ningún proyecto
real) y de que el fundador identifique la cuenta correcta desde el panel
de Supabase — no se tuvo acceso para consultar `auth.users`/`profiles`
reales en este entorno.

### 12.6 Pruebas reales post-migración (los 10 escenarios) — no ejecutables

Los 10 escenarios de la sección 7 de la instrucción **no se ejecutaron**:
dependen de la migración aplicada contra una base real, y esta sesión no
tuvo acceso a ninguna base de datos Supabase real (mismo bloqueo de la
sección 12.3). Se registran como "no ejecutable — bloqueo de entorno",
no como "pasando" ni "fallando". Ver el detalle escenario por escenario
en `MATRIZ-PRUEBAS-AUTORIZACION.md`, sección "Pruebas reales
post-migración".

### 12.7 Validación del repositorio (tras la corrección transaccional)

| Comando | Resultado |
|---|---|
| `npm test -- --run` | 8 archivos, **83 pruebas, 0 fallos** (sin cambios — la corrección fue solo SQL) |
| `npx tsc --build --noEmit` | Limpio |
| `npm run build` | Exitoso |
| `npm run lint` | 303 problemas — idéntico, ningún archivo TypeScript se modificó en esta sesión |

### 12.8 Estado de cierre de BL-10

**BL-10 permanece "migración creada y corregida, NO aplicada"** — no se
marca como cerrado/activo. Cerrar BL-10 requiere que la migración se
ejecute contra un proyecto Supabase real confirmado como no productivo,
lo cual no fue posible en esta sesión.
