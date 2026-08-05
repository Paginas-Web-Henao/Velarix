# Reporte de cierre — hallazgos de auth pendientes previos a JWT Signing Keys

Fecha: 2026-08-05. Continuación directa de `217a677 fix: return correct auth
responses from user edge functions` (commit base de esta tarea). Una
auditoría independiente posterior a ese commit encontró seis hallazgos
pendientes — este reporte documenta su cierre.

No se tocaron JWT Signing Keys. No se inició la fase 1E. No se hizo push.

## 1. Contexto

`217a677` corrigió correctamente las respuestas 401/404 de autenticación y
ownership, y el bug de `req.clone()` en `run-analysis-pipeline`. Una
auditoría independiente posterior encontró que aún faltaban seis
correcciones:

1. Las siete funciones descartaban el campo `error` de `auth.getUser`.
2. Un fallo técnico real de Supabase Auth podía quedar oculto como 401.
3. La respuesta 500 de `mapErrorToResponse` podía devolver `error.message`
   crudo al cliente.
4. Cuatro funciones devolvían 500 ante precondiciones normales de negocio
   (`parse-document`: documento inexistente; `map-accounts`: sin
   documentos procesados; `build-structured-input`: sin cuentas
   homologadas; `generate-narrative`: sin `calculation_output`).
5. `supabase/config.toml` declaraba el proyecto Supabase antiguo mientras
   la CLI estaba vinculada al proyecto actual.
6. `npm run lint` ya fallaba antes de esta tarea por deuda técnica global
   (302 problemas preexistentes, ninguno introducido por `217a677`).

Este reporte documenta el cierre verificable de los seis puntos.

## 2. Corrección del proyecto Supabase declarado (commit separado)

`supabase/config.toml` declaraba `project_id = "inuj...eoyh"` (proyecto
antiguo, defunto). Se corrigió a una sola línea para que coincida
exactamente con el proyecto realmente vinculado por la CLI
(`supabase/.temp/project-ref`). Sin efecto funcional en los despliegues
anteriores (que ya usaban el ref vinculado explícito), pero elimina el
riesgo de que una herramienta futura que lea `config.toml` implícitamente
apunte al proyecto equivocado. Commit: `chore: align Supabase project
configuration` (un archivo, una línea).

## 3. Clasificación oficial de errores de Auth

Las Edge Functions importan `@supabase/supabase-js@2.49.1` (pinneado, vía
esm.sh). Se verificó contra el registro de npm que esa versión depende
exactamente de `@supabase/auth-js@2.68.0`, y se inspeccionó el código
fuente publicado de esa versión exacta (`GoTrueClient.js`, `fetch.js`,
`errors.js`) para no inventar clases ni exports inexistentes.

Hallazgo clave: `auth.getUser(token)` con un token explícito (el uso real
en las 7 funciones) **nunca lanza** en la práctica — `_getUser` envuelve
toda la llamada en un `try/catch` que atrapa cualquier `AuthError` interno
y siempre resuelve `{ data: { user: null }, error }`:

- Token inválido, alterado, expirado, o rechazado por la API de Auth
  (HTTP 4xx del propio GoTrue) → `AuthApiError`.
- Sesión cuyo `session_id` ya no existe (usuario cerró sesión en otro
  lugar) → `AuthSessionMissingError`.
- Fallo de red, timeout, o 502/503/504 del propio servicio de Auth →
  `AuthRetryableFetchError`.
- Respuesta no-JSON o error inesperado → `AuthUnknownError`.

El código previo (`const { data } = await anonClient.auth.getUser(token);
return data.user;`) descartaba `error` por completo — cualquiera de estos
casos, incluidos los técnicos, colapsaba en `user: null` → 401 uniforme.

## 4. Diferencia entre 401 y fallo técnico 500

`supabase/functions/_shared/user-auth.ts` — `requireAuthenticatedUser`
ahora recibe `{ user, error }` completo desde `verifyToken` y aplica una
política conservadora (fail closed):

- `user` presente → continúa, sin más comprobaciones.
- `user` ausente y `error.name` es `AuthApiError` o
  `AuthSessionMissingError` (`isClientAuthError`) → `UnauthorizedError`
  (401) — el único caso que se convierte en 401.
- Cualquier otro caso (`AuthRetryableFetchError`, `AuthUnknownError`,
  error sin clasificar, o ausencia total de usuario y error) → se
  relanza tal cual, nunca se convierte en 401 — el catch-all de cada
  función lo mapea a 500 mediante `mapErrorToResponse`.

Las 7 funciones ahora pasan `{ user: data.user, error }` completo a
`requireAuthenticatedUser` en vez de descartar `error`.

## 5. Sanitización de errores 500

`mapErrorToResponse` ya no incluye la rama `error instanceof Error ?
error.message : fallback.message`. La rama 500 usa **exclusivamente**
`fallback.message` (el mensaje público seguro que define cada función),
sin excepción. El error real solo llega a `console.error` dentro de cada
handler, nunca a la respuesta HTTP. Se añadió `BadRequestError` (400) al
mismo mapeador, con `code`/`publicMessage` definidos explícitamente por
cada función — nunca un mensaje genérico ni el error crudo.

Pruebas nuevas inyectan mensajes técnicos sintéticos (nombre de tabla,
fragmento SQL, URL interna, cabecera `Authorization` completa, secret key
sintética, JWT sintético, mensaje de red/timeout, fragmento de stack
trace) y verifican que ninguno aparece en el cuerpo 500 — solo
`fallback.message`.

## 6. Cuatro precondiciones corregidas

| Función | Caso | HTTP anterior | HTTP nuevo | Código JSON | Resultado remoto |
|---|---|---|---|---|---|
| `parse-document` | Documento inexistente o no pertenece al análisis | 500 `PARSE_ERROR` | **404** | `NOT_FOUND` | ✅ verificado en vivo |
| `map-accounts` | Sin documentos procesados | 500 `MAPPING_ERROR` | **400** | `NO_PARSED_DOCUMENTS` | ✅ verificado en vivo |
| `build-structured-input` | Sin cuentas homologadas | 500 `BUILD_ERROR` | **400** | `NO_ACCOUNTS` | ✅ verificado en vivo |
| `generate-narrative` | Falta `calculation_output` | 500 `NARRATIVE_ERROR` | **400** | `MISSING_CALCULATION_OUTPUT` | ✅ verificado en vivo |

`parse-document` reutiliza el nuevo clasificador puro
`classifyResourceLookup` (existencia sin ownership, ya que el ownership
del `analysis_id` padre se valida antes) para distinguir "documento no
existe" de un fallo técnico real de la consulta — que sigue siendo 500.
Las otras tres usan la nueva clase `BadRequestError` (código y mensaje
público definidos por cada función), sumada a `mapErrorToResponse`.

Ningún caso tocó lógica financiera, de parsing, ni de generación
narrativa — solo la clasificación del error de precondición.

## 7. Archivos modificados

| Archivo | Motivo |
|---|---|
| `supabase/config.toml` | Alinea `project_id` con el proyecto vinculado (commit separado). |
| `supabase/functions/_shared/user-auth.ts` | `requireAuthenticatedUser` ya no descarta `error`; distingue error de cliente vs. técnico real; `mapErrorToResponse` ya no expone `error.message` en 500 y suma `BadRequestError`→400; nuevo `classifyResourceLookup` (existencia sin ownership). |
| `supabase/functions/_shared/user-auth.test.ts` | Ampliado: clasificación 401/500 con las formas reales de error de auth-js 2.68.0, sanitización de 500 con 8 casos de mensajes técnicos sintéticos, `BadRequestError`, `classifyResourceLookup`. |
| `supabase/functions/_shared/pipeline-body-read.test.ts` (nuevo) | Guarda de regresión que lee el código fuente real de `run-analysis-pipeline` y bloquea la reintroducción de `req.clone()` o una segunda lectura del body. |
| `supabase/functions/parse-document/index.ts` | Adopta `{user,error}` completo; documento inexistente → 404 vía `classifyResourceLookup`. |
| `supabase/functions/map-accounts/index.ts` | Adopta `{user,error}` completo; sin documentos procesados → 400 `NO_PARSED_DOCUMENTS`. |
| `supabase/functions/build-structured-input/index.ts` | Adopta `{user,error}` completo; sin cuentas homologadas → 400 `NO_ACCOUNTS`. |
| `supabase/functions/generate-narrative/index.ts` | Adopta `{user,error}` completo; falta `calculation_output` → 400 `MISSING_CALCULATION_OUTPUT` (el caso de `analysis_id` faltante, fuera del alcance de esta tarea, no se tocó). |
| `supabase/functions/validate-analysis/index.ts` | Solo adopta `{user,error}` completo — ya devolvía 400 correctamente. |
| `supabase/functions/upload-document/index.ts` | Solo adopta `{user,error}` completo. |
| `supabase/functions/run-analysis-pipeline/index.ts` | Solo adopta `{user,error}` completo — el bug de `req.clone()` ya estaba corregido en `217a677`. |

Ningún archivo fuera de esta lista fue modificado. No se tocó lógica
financiera, frontend, migraciones, dependencias, ni las 5 funciones
internas/mixtas.

## 8. Pruebas automatizadas

- 65 pruebas dirigidas nuevas (sobre 32 preexistentes de `217a677`):
  `user-auth.test.ts` ampliado + `pipeline-body-read.test.ts` (nuevo).
- Cobertura de fallos técnicos de Auth: `AuthApiError`,
  `AuthSessionMissingError` (→401), `AuthRetryableFetchError` (red/5xx),
  `AuthUnknownError`, ausencia de usuario y error, excepción inesperada
  de `verifyToken` (→ nunca 401, siempre se propaga hacia 500).
- Cobertura de sanitización: 8 casos de mensajes técnicos sintéticos que
  nunca aparecen en una respuesta 500; verificación explícita de que 401,
  404 y 400 tampoco filtran tokens/claves.
- Cobertura de las 4 precondiciones: mediante las funciones puras reales
  que cada handler usa (`classifyResourceLookup`, `BadRequestError` +
  `mapErrorToResponse`) — la verificación end-to-end de cada handler
  específico se hizo en la matriz remota (sección 10).
- `pipeline-body-read.test.ts` lee el código fuente real de
  `run-analysis-pipeline/index.ts` (no un mock) y confirma: cero usos de
  `req.clone()` en código ejecutable, `req.json()` exactamente una vez,
  `capturedAnalysisId` declarado antes del `try`, el `catch` nunca vuelve
  a leer el body.
- Resultado: suite completa **251 passed + 1 expected fail (252 total)**,
  17 archivos — verificado ejecutando `npm test -- --run` directamente.

## 9. Despliegue

Las 7 funciones desplegadas (una por una, `npx supabase functions
deploy <fn>`), las 5 internas/mixtas no tocadas ni redesplegadas.
Verificado con `supabase functions list` antes y después:

| Función | Versión antes | Versión después |
|---|---|---|
| `parse-document` | 3 | **4** |
| `map-accounts` | 3 | **4** |
| `validate-analysis` | 3 | **4** |
| `build-structured-input` | 3 | **4** |
| `generate-narrative` | 3 | **4** |
| `upload-document` | 3 | **4** |
| `run-analysis-pipeline` | 3 | **4** |
| `ejecutar-calculo` | 4 | 4 (sin cambios) |
| `continuar-tras-revision` | 4 | 4 (sin cambios) |
| `enviar-notificacion` | 1 | 1 (sin cambios) |
| `update-snapshots` | 1 | 1 (sin cambios) |
| `check-data-freshness` | 1 | 1 (sin cambios) |

**12/12 ACTIVE, 12/12 `verify_jwt=false`** — sin cambios respecto al
estado previo.

## 10. Matriz remota completa (usuarios sintéticos, dominio `.local`, prefijo `corr_test_`/`CORR_TEST_`)

`Usuario A` (dueño de un análisis sintético `CORR_TEST_Empresa`),
`Usuario B` (ajeno). Contraseñas aleatorias generadas localmente, nunca
impresas. 46 escenarios ejecutados contra el proyecto real desplegado.

| Escenario (las 7 funciones salvo donde se indique) | HTTP esperado | HTTP observado | Resultado |
|---|---|---|---|
| Sin `Authorization` | 401 | **401** (las 7) | ✅ |
| `Authorization: Bearer` inválido | 401 | **401** (las 7) | ✅ |
| `apikey` publishable solamente, sin `Authorization` | 401 | **401** (las 7) | ✅ |
| `apikey` secret solamente, sin `Authorization` | 401 | **401** (las 7) | ✅ |
| JWT de B sobre análisis de A | 404 | **404** `NOT_FOUND` (las 7) | ✅ |
| JWT de A + `user_id`/`userId`/`owner_id`=B + `internal=true` | mismo resultado que sin spoof | **idéntico** en las 7 (verificado explícitamente comparando cada respuesta con y sin los campos de spoof) | ✅ sin bypass |
| `parse-document`, JWT dueño, documento inexistente | 404 | **404** `NOT_FOUND` | ✅ |
| `map-accounts`, JWT dueño, sin documentos procesados | 400 | **400** `NO_PARSED_DOCUMENTS` | ✅ |
| `validate-analysis`, JWT dueño, sin cuentas | 400 | **400** `NO_ACCOUNTS` | ✅ (ya correcto antes) |
| `build-structured-input`, JWT dueño, sin cuentas | 400 | **400** `NO_ACCOUNTS` | ✅ |
| `generate-narrative`, JWT dueño, falta `calculation_output` | 400 | **400** `MISSING_CALCULATION_OUTPUT` | ✅ |
| `run-analysis-pipeline`, JWT dueño, sin documentos | 400 | **400** `NO_DOCUMENTS` | ✅ (ya correcto antes) |
| `upload-document`, JWT dueño + archivo CSV sintético real | 200 | **200**, documento creado | ✅ |
| `run-analysis-pipeline`, JWT de B sobre análisis de A (error **después** de leer el body) | JSON, sin texto plano | `content-type: application/json`, 404, `{"success":false,"error":{"code":"NOT_FOUND",...}}` | ✅ sin regresión del bug `req.clone()` |

**Corrección de proceso durante la ejecución:** la primera pasada de
`parse-document` (fase B, "JWT de B sobre análisis de A") reportó 500 —
se investigó de inmediato y se confirmó que era un defecto del arnés de
prueba (no se incluyó `document_id`, campo obligatorio que la función
valida *antes* del chequeo de ownership), no una regresión del código.
Se corrigió el arnés y se repitió la prueba con `document_id` incluido,
obteniendo el 404 esperado. La comparación de bypass para
`generate-narrative` tenía el mismo problema de diseño (comparaba contra
un body distinto) — se corrigió comparando el mismo body exacto con y sin
los campos de spoof, confirmando resultados idénticos.

No se probó JWT expirado real (no existe una forma segura de producirlo
sin esperar ~1 hora o manipular secretos de firma — igual que en
`217a677`). No se provocó una caída real de Supabase Auth; la
diferenciación 401/500 ante un fallo técnico está verificada mediante las
pruebas automatizadas con las formas de error reales de auth-js 2.68.0
(sección 8) y mediante inspección directa del código fuente de esa
versión (sección 3).

## 11. Regresión de las 5 funciones fuera de alcance

No modificadas, no redesplegadas. Confirmado ACTIVE, `verify_jwt=false` y
versión sin cambios para las 5 (sección 9). Prueba funcional ligera sobre
2 de ellas (sin efectos secundarios destructivos):

| Función | Prueba | Resultado |
|---|---|---|
| `enviar-notificacion` | secret key en `apikey` (llamada interna real) | 200 — confirma que la autenticación interna interna pasó y la función ejecutó su lógica de negocio |
| `enviar-notificacion` | secret key puesta en `Authorization` en vez de `apikey` (debe rechazar) | 401 |
| `check-data-freshness` | sin credenciales | 401 |

Sin regresiones. `ejecutar-calculo` y `continuar-tras-revision` no se
invocaron en esta sesión (su versión sin cambios ya confirma que no
fueron tocadas ni redesplegadas).

## 12. Limpieza

Creado y eliminado en esta sesión, verificado independientemente (no solo
narrado):

- 2 usuarios Auth sintéticos (`corr_test_a_*@velarix-test.local`,
  `corr_test_b_*@velarix-test.local`) — eliminados vía Admin API (HTTP
  200 ambos). Verificado: `0` perfiles sintéticos restantes tras la
  eliminación.
- 1 análisis sintético (`CORR_TEST_Empresa`) — eliminado (cascada
  `ON DELETE CASCADE` confirmada en el esquema para `documents`,
  `documents_parsed`, `account_homologations`, `validation_results`,
  `audit_events`, etc.). Verificado: `0` análisis con `company_name ilike
  'CORR_TEST%'` tras la eliminación.
- 1 documento sintético (subido en la prueba de `upload-document`) y su
  objeto de Storage correspondiente — eliminados explícitamente.
  Verificado: `0` documentos y `0` objetos de Storage bajo el prefijo
  sintético tras la eliminación.
- 1 fila residual de `job_locks` (creada y liberada por el propio código
  durante la prueba de `run-analysis-pipeline`) — eliminada
  defensivamente.
- Verificación final: `1` perfil total en la base, `1` con rol `admin`
  (el fundador, sin tocar) — confirma que no quedan usuarios sintéticos y
  que no se afectó al administrador real.
- Todos los archivos locales temporales con claves, JWT y contraseñas
  (directorio protegido, permisos `700`/`600`, fuera del repositorio) —
  eliminados al terminar. Verificado con una búsqueda final de patrones
  de clave/JWT en el directorio temporal: sin coincidencias.

Clasificación: **DEMOSTRADA** (verificación propia, no solo evidencia
narrada).

## 13. Línea base y resultado final de lint

| Momento | Código de salida | Total de problemas |
|---|---|---|
| Antes de modificar (línea base, ejecución directa sin tubería) | 1 | 302 (278 errores, 24 warnings) |
| Después de todos los cambios de código (ejecución directa sin tubería) | 1 | **302** (278 errores, 24 warnings) — idéntico |

Verificado archivo por archivo: los 3 archivos nuevos
(`user-auth.ts` ya existía y quedó en 0; `user-auth.test.ts` y
`pipeline-body-read.test.ts`) tienen **cero** problemas de lint. En los 6
archivos de función modificados, el conteo por archivo es idéntico al de
la línea base (mismo número, mismas reglas); los números de línea de los
problemas preexistentes se desplazaron por las líneas insertadas — se
verificó línea por línea que cada problema restante cae fuera de los
hunks realmente modificados por esta tarea (mismo patrón que ya se había
verificado para `217a677`). **Cero problemas nuevos.**

## 14. Riesgos residuales

- No se probó JWT expirado real ni una caída real de Supabase Auth (por
  diseño — ver sección 10). La diferenciación 401/500 está verificada por
  inspección de código fuente exacto y pruebas unitarias con las formas
  de error reales, no por una prueba end-to-end contra un fallo real de
  Auth.
- El caso "`analysis_id` faltante" en las 7 funciones sigue devolviendo
  500 genérico — deliberadamente fuera del alcance de esta tarea (solo se
  pidió corregir `calculation_output` faltante en `generate-narrative` y
  los otros 3 casos específicos). Mismo patrón de precondición mal
  tipada, documentado para una futura sesión.
- La deuda técnica global de lint (302 problemas, principalmente
  `no-explicit-any` en Edge Functions) sigue sin resolver — explícitamente
  fuera de alcance.
- Durante la ejecución, dos comandos de esta sesión (`supabase projects
  api-keys --reveal` y un script que ejecutaba `signup` público) fueron
  bloqueados inicialmente por el clasificador de seguridad de Claude Code;
  se detuvo el trabajo y se solicitó autorización explícita al usuario
  antes de continuar, quien la otorgó con las mismas restricciones ya
  vigentes (nunca imprimir valores, permisos 600, eliminar al terminar).
  Documentado por transparencia, no representa un riesgo residual del
  sistema Velarix.

## 15. Confirmaciones finales

- **No se tocaron, crearon, rotaron ni revocaron JWT Signing Keys** en
  ningún momento de esta sesión.
- No se inició la fase 1E.
- No se hizo push.
- La siguiente prioridad es una **auditoría independiente final** sobre
  este cierre; después, la **migración controlada del JWT secret legacy**
  hacia JWT Signing Keys asimétricas; después, verificación posterior; y
  solo entonces el inicio de la fase 1E.
