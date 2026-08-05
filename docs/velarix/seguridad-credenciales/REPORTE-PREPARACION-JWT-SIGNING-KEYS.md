# Reporte de preparación — JWT Signing Keys asimétricas

Fecha: 2026-08-05. Continuación directa de `fix: remove remaining legacy
Supabase key dependencies` (`4405e41`). Proyecto destino real (Supabase,
enmascarado): `esaf…rzqh`, **"Velarix"**. Entorno de desarrollo — todos
los registros creados en esta sesión fueron sintéticos, prefijo
`1D_TEST_`, eliminados al terminar.

## Por qué existe este reporte (distinto de los dos anteriores)

`REPORTE-ACTIVACION-1D.md` cerró la autenticación mixta de 2 funciones.
`REPORTE-MIGRACION-CLAVES-LEGACY.md` migró las 10 funciones restantes de
`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ANON_KEY` a
`SUPABASE_SECRET_KEYS`/`SUPABASE_PUBLISHABLE_KEYS`, y confirmó (sesión
posterior de verificación) que el sistema sigue operando con normalidad
tras la desactivación manual de las claves legacy.

Esta sesión es un paso distinto: **preparar** el proyecto para rotar de
JWT Secret legacy (HS256, simétrico) a **JWT Signing Keys asimétricas**
(RS256/ES256). La puerta de entrada de Supabase, con `verify_jwt = true`,
valida el JWT usando el secret HS256 del proyecto — un mecanismo
incompatible con Signing Keys asimétricas. Las 7 funciones de usuario
(`parse-document`, `map-accounts`, `validate-analysis`,
`build-structured-input`, `generate-narrative`, `upload-document`,
`run-analysis-pipeline`) seguían con `verify_jwt = true`, así que
dependían de ese pre-chequeo de la puerta de entrada — no de forma
crítica (cada una ya verificaba la sesión por su cuenta), pero sí como
una capa adicional que dejaría de funcionar correctamente en cuanto el
proyecto rote a Signing Keys.

## Estado final: **12/12 funciones con `verify_jwt = false`, todas protegidas por autenticación explícita en código**

| Condición | Resultado |
|---|---|
| Validación de autenticación explícita confirmada en las 7 funciones, antes de tocar configuración | ✅ Sí — ninguna requirió corrección de código |
| `verify_jwt = false` configurado para las 7, sin tocar las 5 que ya lo tenían | ✅ Sí |
| Ninguna función quedó pública | ✅ Confirmado por prueba remota |
| Desplegadas solo las 7 funciones modificadas | ✅ Sí, sin Docker |
| Las 12 funciones `ACTIVE` y `verify_jwt=false` | ✅ Verificado contra el proyecto real |
| Pruebas remotas (8 escenarios × 7 funciones + internas + mixtas + frontend) | ✅ Todas correctas |
| Validaciones locales | ✅ Sin regresiones |
| Datos/usuarios sintéticos eliminados | ✅ Sí |

## 1. Validación de autenticación explícita, por función (antes de modificar nada)

Confirmado por lectura directa del código de cada una de las 7 funciones
(no asumido) — **ninguna requirió corrección**, las siete ya cumplían
las siete condiciones exigidas:

| Función | `Authorization: Bearer <JWT>` exigido | Extrae solo del header | `auth.getUser(token)` | Usa `user.id` validado (no `body.user_id`) | Acepta `internal=true` | Secret key en `apikey` da acceso de usuario | Ownership/RLS conservados |
|---|---|---|---|---|---|---|---|
| `parse-document` | ✅ | ✅ | ✅ | ✅ | ❌ (no lee ese campo) | ❌ (no lee `apikey` en el código) | ✅ |
| `map-accounts` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `validate-analysis` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `build-structured-input` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `generate-narrative` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `upload-document` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `run-analysis-pipeline` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

Las siete comparten el mismo patrón:

```ts
const authHeader = req.headers.get("Authorization");
if (!authHeader) throw new Error("No authorization header");
...
const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
if (!user) throw new Error("Unauthorized");
...
if (!analysis || analysis.user_id !== user.id) throw new Error("Not found");
```

`anonClient.auth.getUser(token)` es el mecanismo oficial de Supabase
Auth: hace una verificación real contra el servidor de Auth, no una
decodificación manual del JWT — es agnóstico al algoritmo de firma que
la plataforma use internamente (HS256 hoy, RS256/ES256 con Signing Keys
mañana). Por eso su seguridad real **nunca dependió** de que la puerta
de entrada (`verify_jwt`) también validara el JWT — esa era una capa de
pre-chequeo adicional, no la fuente de verdad.

Búsqueda explícita de `apikey` leído del header en código de negocio (no
en la lista CORS) y de `body.internal`/`body.user_id`: **cero
resultados** en las 7 funciones — confirma que ninguna secret key en
`apikey` puede otorgar acceso de usuario, y que ningún campo del body
puede suplantar la identidad real del JWT.

**Conclusión de la sección 2**: cero funciones requirieron corrección de
código. El único cambio de esta sesión es de configuración.

## 2. Cambios realizados

Único cambio: `supabase/config.toml` — se agregaron 7 secciones
`[functions.*]` con `verify_jwt = false` para `parse-document`,
`map-accounts`, `validate-analysis`, `build-structured-input`,
`generate-narrative`, `upload-document`, `run-analysis-pipeline`, con un
comentario explicando la justificación (transcrito en la sección
anterior). Las 5 funciones que ya tenían `verify_jwt = false`
(`ejecutar-calculo`, `continuar-tras-revision`, `enviar-notificacion`,
`update-snapshots`, `check-data-freshness`) no se tocaron.

Ninguna función se marcó como pública ni usa `auth: none` — las 12
siguen exigiendo autenticación explícita en su propio código, cada una
según su categoría (usuario, interna o mixta).

## 3. Despliegue

Únicamente las 7 funciones modificadas, sin Docker: `parse-document`,
`map-accounts`, `validate-analysis`, `build-structured-input`,
`generate-narrative`, `upload-document`, `run-analysis-pipeline`.

## 4. Estado `verify_jwt` de las 12 funciones (verificado contra el proyecto real)

| Función | Categoría | `verify_jwt` | Estado |
|---|---|---|---|
| `ejecutar-calculo` | Mixta | `false` (sin cambios) | `ACTIVE` |
| `continuar-tras-revision` | Mixta | `false` (sin cambios) | `ACTIVE` |
| `parse-document` | Usuario | `false` (nuevo) | `ACTIVE` |
| `map-accounts` | Usuario | `false` (nuevo) | `ACTIVE` |
| `validate-analysis` | Usuario | `false` (nuevo) | `ACTIVE` |
| `build-structured-input` | Usuario | `false` (nuevo) | `ACTIVE` |
| `generate-narrative` | Usuario | `false` (nuevo) | `ACTIVE` |
| `upload-document` | Usuario | `false` (nuevo) | `ACTIVE` |
| `run-analysis-pipeline` | Usuario | `false` (nuevo) | `ACTIVE` |
| `enviar-notificacion` | Interna | `false` (sin cambios) | `ACTIVE` |
| `update-snapshots` | Interna | `false` (sin cambios) | `ACTIVE` |
| `check-data-freshness` | Interna | `false` (sin cambios) | `ACTIVE` |

**12/12 `verify_jwt = false`, 12/12 `ACTIVE`.**

## 5. Pruebas remotas

Usuarios sintéticos temporales: `1D_TEST_OWNER7` (dueño de un análisis
sintético), `1D_TEST_OUTSIDER7` (usuario ajeno). Contraseñas aleatorias
vía Admin API, nunca impresas, eliminados al terminar.

### Los 8 escenarios, por función de usuario

| # | Escenario | Resultado esperado | `map-accounts` | `validate-analysis` | `build-structured-input` | `generate-narrative` | `parse-document` | `run-analysis-pipeline` | `upload-document` |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Sin credenciales | Rechazado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | Publishable sin JWT | Rechazado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | Publishable + JWT inválido | Rechazado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | Publishable + JWT válido | Aceptado, llega a lógica real | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | Usuario ajeno | Rechazado sin revelar existencia | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (ver nota) | ✅ |
| 6 | Body con `user_id` falsificado | Sin efecto | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (ver nota) | ✅ |
| 7 | Body con `internal: true` | Sin efecto | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (ver nota) | ✅ |
| 8 | Secret key sin JWT | No otorga acceso de usuario | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Confirmación de "llega a lógica real" (escenario 4) por el mensaje de
error de negocio devuelto (no de autenticación): `map-accounts` → "No
hay documentos parseados"; `validate-analysis`/`build-structured-input`
→ "No hay cuentas homologadas"; `generate-narrative` (con
`calculation_output` dummy en el body para superar su validación previa
al chequeo de ownership) → "ANTHROPIC_API_KEY not configured";
`parse-document` → "Document not found" (documento sintético
inexistente); `run-analysis-pipeline` → "No se han cargado documentos";
`upload-document` → "Body can not be decoded as form data" (se probó
solo la capa de autenticación con un body JSON, no un archivo real —
fuera del alcance de esta tarea probar la subida completa).

**Hallazgo honesto, no corregido (fuera de alcance)**: en
`run-analysis-pipeline`, los escenarios 5, 6 y 7 (usuario ajeno) devuelven
`500 "Internal Server Error"` en texto plano en vez de la respuesta JSON
estructurada `{"success":false,"error":{"code":"PIPELINE_ERROR",...}}`
que el código pretende devolver. La causa es una línea preexistente (no
tocada en esta sesión ni en la anterior) en el bloque `catch` de la
función: `req.clone()` se invoca después de que el body ya fue leído una
vez por `req.json()` más arriba en el `try` — un patrón fallido de la
Fetch API que no tiene relación con autenticación ni con esta migración.
**La seguridad no se ve afectada**: el rechazo del usuario ajeno sí
ocurre (no hay fuga de datos ni acceso indebido, confirmado por consulta
directa a `audit_events`: no se creó ningún job ni resultado para el
análisis ajeno), solo cambia el formato de la respuesta de error. No se
corrigió por estar fuera del alcance explícito de esta tarea (preparación
de JWT Signing Keys, no corrección de manejo de errores). Queda
documentado para una futura sesión que sí tenga ese alcance.

### Funciones internas (sin cambios esta sesión, reverificadas)

- `enviar-notificacion`: secret key en `apikey` → `404` de negocio
  (análisis sintético inexistente, confirma que la autenticación pasó);
  secret key en `Authorization` → `401 "No autorizado."`.
- `update-snapshots`: secret key en `apikey` → `200`, ejecución real
  (idempotente, `0` snapshots nuevos porque ya existían).
- `check-data-freshness`: verificado en el paso 1 de esta sesión (dentro
  de la comprobación de las 12 funciones `ACTIVE`).

### Funciones mixtas (sin cambios esta sesión, reverificadas)

- `ejecutar-calculo`: publishable + JWT real del dueño → llega a lógica
  real (`"No hay input_payload con revenue"`); secret key en `apikey`
  (llamada interna) → mismo comportamiento, confirma que ambos modos de
  autenticación mixta siguen intactos.
- `continuar-tras-revision`: sin credenciales → rechazado (`400
  "analysis_id requerido"`, una capa de validación distinta a `401` pero
  igualmente un rechazo — comportamiento preexistente, no tocado).

## 6. Frontend

Login con publishable key confirmado: `POST /auth/v1/token?grant_type=password`
con `apikey: <publishable key>` (el mismo flujo que usa
`src/lib/supabase-client.ts` vía `VITE_SUPABASE_PUBLISHABLE_KEY`) emitió
JWT reales para ambos usuarios sintéticos sin error.

## 7. Auditoría

Consulta directa a `audit_events` para el análisis sintético de esta
sesión: ninguna fila contiene `sb_secret_`, `sb_publishable_`, prefijo
JWT `eyJ`, ni las palabras `Authorization`/`Bearer` en `event_detail` o
`metadata` — confirmado por columna calculada `contains_sensitive =
false` en el 100% de las filas.

Ningún uso de `anon`/`service_role` legacy en ninguna prueba de esta
sesión — todas las llamadas usaron exclusivamente `sb_publishable_...`
(en `apikey`, para usuario) y `sb_secret_...` (en `apikey`, para
servicio interno), igual que la sesión anterior.

## 8. Limpieza

Al terminar: `2` usuarios Auth sintéticos eliminados, `1` análisis
sintético eliminado junto con sus `job_locks`/`analysis_jobs`/
`audit_events` asociados. Verificado por consulta directa: `0` análisis
con `company_name like '1D_TEST%'`, `0` perfiles con `company like
'1D_TEST%'`, `0` usuarios Auth con `1d_test` en el email, exactamente
`1` administrador (el fundador, sin tocar). Los dos archivos de claves,
dos contraseñas y dos JWT de sesión vivieron con permisos `600` fuera
del repositorio y se eliminaron al terminar; ninguno se imprimió en esta
sesión.

## 9. Validaciones locales (ejecutadas una sola vez, al final)

- `npm test -- --run`: **186 passed + 1 expected fail (187 total)** —
  mismo baseline, sin regresiones (19 regresiones A/B/C incluidas en ese
  total, sin cambios).
- `npx tsc --build --noEmit`: limpio.
- `npm run build`: exitoso (misma advertencia preexistente de tamaño de
  chunk).
- `npm run lint`: sin ejecutar diff línea por línea esta vez porque
  **no se modificó ningún archivo `.ts` en esta sesión** (el único
  cambio fue `supabase/config.toml`, que ESLint no analiza) — por
  construcción, cero errores nuevos posibles.

## 10. Bloqueos reales para rotar a JWT Signing Keys

Ninguno de origen técnico en este repositorio. Las 12 Edge Functions ya
no dependen de que la puerta de entrada de Supabase valide el JWT — cada
una lo verifica explícitamente contra Supabase Auth
(`auth.getUser(token)`), un mecanismo compatible con cualquier esquema
de firma. La rotación real (activar JWT Signing Keys asimétricas desde
el dashboard de Supabase, Project Settings → JWT Keys) sigue siendo una
acción manual del fundador, fuera del alcance de la CLI y de este
reporte.

## 11. Confirmación de entorno mock

Todos los datos creados en esta sesión fueron sintéticos, prefijo
`1D_TEST_`, dominio `.local`, eliminados al terminar. Ningún dato real
de cliente fue creado, leído ni modificado. No se tocó la cuenta del
fundador ni su rol de administrador. No se inició el Bloque 1E ni se
modificó lógica financiera o visual.
