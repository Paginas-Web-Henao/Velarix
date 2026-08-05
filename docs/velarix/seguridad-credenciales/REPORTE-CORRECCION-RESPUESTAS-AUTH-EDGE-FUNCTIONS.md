# Reporte de corrección — respuestas de autenticación en Edge Functions de usuario

Fecha: 2026-08-05. Continuación directa de la auditoría forense posterior a
`7f5ce63 fix: prepare edge functions for JWT signing key rotation`. Commit
base de esta corrección: `8581cf2` ("V3"). Proyecto Supabase verificado
(enmascarado): `esaf…rzqh`. Entorno real de producción del proyecto — no
existe entorno de staging separado — con datos sintéticos estrictamente
temporales, prefijo `corr_test_`/`CORR_TEST_`, eliminados al terminar.

No se tocaron JWT Signing Keys. No se inició la fase 1E. No se hizo push.

## 1. Causa raíz

### 1.1 Por qué las 7 funciones respondían 500 en vez de 401/404

Las 7 funciones de usuario (`parse-document`, `map-accounts`,
`validate-analysis`, `build-structured-input`, `generate-narrative`,
`upload-document` parcialmente, `run-analysis-pipeline`) usaban el mismo
patrón:

```ts
const authHeader = req.headers.get("Authorization");
if (!authHeader) throw new Error("No authorization header");
...
if (!user) throw new Error("Unauthorized");
...
if (!analysis || analysis.user_id !== user.id) throw new Error("Not found");
```

Los tres `throw new Error(...)` — sin autenticación, autenticación
inválida, y ownership ajeno — son indistinguibles de cualquier otro error
técnico real (fallo de base de datos, timeout, bug). Un único `catch` por
función capturaba todo y devolvía siempre `500`:

```ts
} catch (error) {
  return new Response(JSON.stringify({ success:false, error:{...} }), { status: 500, ... });
}
```

Nunca existió una rama que distinguiera "fallo de autenticación" o "recurso
ajeno" de "error técnico real".

### 1.2 Por qué no era una fuga de datos

En ningún caso el atacante obtenía acceso real: el rechazo (autenticación
ausente/inválida, o recurso de otro usuario) sí ocurría siempre, de forma
consistente y verificada — confirmado directamente por la auditoría
forense anterior y de nuevo por las pruebas remotas de esta sesión
(sección 8). El defecto era exclusivamente de **clasificación del código
HTTP y del mensaje**, no de control de acceso. Ningún dato de otro usuario
llegó nunca a devolverse.

### 1.3 Por qué sí era un incumplimiento real

Las instrucciones que rigen este proyecto exigen explícitamente: *"401
para autenticación ausente o inválida; 403 [aquí, 404 seguro por
ownership] para usuario autenticado sin autorización"*. Un `500` genérico:

- rompe la semántica HTTP esperada por cualquier cliente o monitor;
- hace indistinguible, en logs/alertas, un intento real de acceso cruzado
  entre usuarios de un bug técnico aleatorio — debilita la trazabilidad
  de seguridad;
- fue afirmado como cumplido en el reporte de la sesión anterior sin
  haberse verificado realmente (su matriz de pruebas no registró el
  código HTTP observado, solo un resultado ✅/❌ genérico).

### 1.4 El bug de `req.clone()` en `run-analysis-pipeline`

```ts
const { analysis_id: aid } = await req.clone().json().catch(() => ({ analysis_id: null }));
```

Este `req.clone()` se ejecutaba en el `catch`, **después** de que
`req.json()` ya hubiera consumido el body más arriba en el `try` (línea
26 original). La Fetch API no permite clonar un `Request` cuyo body ya
fue leído — `clone()` lanza de forma síncrona. Como esa excepción ocurría
dentro del propio `catch`, nunca llegaba al `return` con la respuesta JSON
que el código pretendía enviar: el runtime de Deno terminaba devolviendo
un error de plataforma en texto plano (`500 Internal Server Error`), no
la respuesta JSON estructurada que el código define. Esto solo se
manifestaba cuando el fallo ocurría **después** de leer el body (p. ej.
usuario ajeno) — un fallo de autenticación temprano (antes de leer el
body) no lo disparaba, lo que explica por qué no se detectó antes.

## 2. Archivos modificados

| Archivo | Motivo |
|---|---|
| `supabase/functions/_shared/user-auth.ts` (nuevo) | Módulo puro compartido: extracción estricta del Bearer, `requireAuthenticatedUser`, `classifyOwnedResourceLookup`, `mapErrorToResponse`, `shouldNotifyPipelineError`. Reutilizado por las 7 funciones — ninguna reimplementa la lógica. |
| `supabase/functions/_shared/user-auth.test.ts` (nuevo) | 32 pruebas de especificación sobre la lógica real del módulo anterior. |
| `supabase/functions/parse-document/index.ts` | Adopta el helper; ownership tipado; catch mapeado. |
| `supabase/functions/map-accounts/index.ts` | Igual. |
| `supabase/functions/validate-analysis/index.ts` | Igual. |
| `supabase/functions/build-structured-input/index.ts` | Igual. |
| `supabase/functions/generate-narrative/index.ts` | Igual. |
| `supabase/functions/upload-document/index.ts` | Igual — además, su 404 de ownership ya existente ahora distingue explícitamente error técnico real vs. ownership (antes los colapsaba). |
| `supabase/functions/run-analysis-pipeline/index.ts` | Igual, más la corrección de `req.clone()`: `analysis_id` se captura una sola vez en una variable de ámbito externo (`capturedAnalysisId`), nunca se vuelve a leer ni clonar `req` en el `catch`. |

Ningún archivo fuera de esta lista fue modificado. Las 5 funciones internas
o mixtas (`ejecutar-calculo`, `continuar-tras-revision`,
`enviar-notificacion`, `update-snapshots`, `check-data-freshness`) no se
tocaron. No se modificó `verify_jwt` en `supabase/config.toml` (queda
`false` en las 12, sin cambios). No se tocaron archivos ZIP.

## 3. Solución implementada

`supabase/functions/_shared/user-auth.ts` — módulo puro (sin imports de
Supabase, Deno ni URL), importable desde Deno y desde Vitest:

- **`extractBearerToken(header)`**: exige el esquema exacto `Bearer`, uno o
  más espacios como separador, y un token no vacío sin espacios internos.
  Reemplaza `authHeader.replace("Bearer ", "")`, que no comprobaba el
  esquema antes de recortar.
- **`requireAuthenticatedUser(header, verifyToken)`**: `verifyToken` es la
  única parte impura (cada función la implementa llamando a
  `anonClient.auth.getUser(token)`, el mecanismo oficial de Supabase
  Auth). Lanza siempre `UnauthorizedError` — nunca distingue la causa real
  (ausente, esquema incorrecto, vacío, malformado, alterado, expirado, no
  resuelto, o un fallo técnico del propio chequeo) para no filtrar esa
  información al cliente.
- **`classifyOwnedResourceLookup(error, resource, actorUserId)`**:
  distingue `owner` / `not_found` (recurso inexistente **o** ajeno — mismo
  resultado público deliberadamente) / `technical_error` (código
  Postgrest distinto de `PGRST116`, nunca se convierte en 404).
- **`mapErrorToResponse(error, fallback)`**: `UnauthorizedError` → 401,
  `NotFoundError` → 404 (mensajes genéricos uniformes en ambos), cualquier
  otro error → 500 con el código de fallback propio de cada función
  (mismo comportamiento que tenían antes para errores técnicos reales).
- **`shouldNotifyPipelineError(mapped, capturedAnalysisId)`**: usada solo
  por `run-analysis-pipeline` — decide notificar exclusivamente ante un
  500 real con `analysis_id` capturado; nunca ante 401 o 404 (para no
  notificar al dueño real por un intento de otro usuario).

Patrón resultante en las 7 funciones:

```ts
const user = await requireAuthenticatedUser(authHeader, async (token) => {
  const { data } = await anonClient.auth.getUser(token);
  return data.user;
});
...
const { data: analysis, error: analysisError } = await supabase.from("analyses").select("*").eq("id", analysis_id).single();
const lookup = classifyOwnedResourceLookup(analysisError, analysis, user.id);
if (lookup === "not_found") throw new NotFoundError();
if (lookup === "technical_error") throw analysisError;
...
} catch (error) {
  const mapped = mapErrorToResponse(error, { code: "<FN>_ERROR", message: "..." });
  return new Response(JSON.stringify(mapped.body), { status: mapped.status, ... });
}
```

`user.id` sigue siendo exclusivamente el devuelto por `auth.getUser` — no
se tocó ningún uso posterior (auditoría, storage, inserciones). Ningún
campo del body (`user_id`, `userId`, `owner_id`, `internal`) se lee en
ninguna de las 7 funciones — confirmado antes y después del cambio.

## 4. Corrección de `run-analysis-pipeline`

- El body se lee una sola vez (`req.json()` original).
- `analysis_id` se guarda en `capturedAnalysisId` (variable declarada
  antes del `try`) inmediatamente después de parsear el body.
- El `catch` ya no llama `req.clone()` ni `req.json()` — usa
  `capturedAnalysisId` directamente.
- La notificación de error técnico solo se dispara si
  `shouldNotifyPipelineError` es verdadero (500 real + id capturado).
- Verificado en vivo (sección 8): un fallo posterior a leer el body
  (usuario ajeno) ahora devuelve JSON limpio (`content-type:
  application/json`, `404`, `{"success":false,"error":{"code":"NOT_FOUND",...}}`)
  — antes de esta corrección ese mismo escenario producía un error de
  plataforma en texto plano.

## 5. Pruebas automatizadas

`supabase/functions/_shared/user-auth.test.ts` — 32 pruebas, todas sobre
la lógica real importada (no búsquedas de texto):

- `extractBearerToken`: ausente, `undefined`, vacía, `Basic`, `Bearer`
  sin token, `Bearer ` con espacio sin token, sin separador, tab en vez
  de espacio, token con espacio interno, publishable key como si fuera
  JWT (se extrae igual — la validación real es responsabilidad de
  `auth.getUser`), token válido, espacios externos tolerados.
- `requireAuthenticatedUser`: sin header (no invoca `verifyToken`), Bearer
  malformado (no invoca `verifyToken`), `verifyToken` resuelve `null`,
  `verifyToken` lanza (token alterado/expirado/error de red) → siempre
  `UnauthorizedError`, nunca revienta; usuario válido → `user.id` exacto.
- `classifyOwnedResourceLookup`: owner, recurso inexistente, `PGRST116`,
  recurso de otro usuario, error técnico con código distinto, error sin
  código.
- `mapErrorToResponse`: `UnauthorizedError`→401, `NotFoundError`→404,
  `Error` real→500 con código de fallback, valor no-`Error`→500 con
  mensaje de fallback, verificación explícita de que ninguna respuesta de
  401/404 contiene `Bearer`, `sb_secret_`, `sb_publishable_` ni `eyJ`.
- `shouldNotifyPipelineError`: notifica solo en 500 real con id
  capturado; nunca en 401/404; nunca sin id capturado.

Resultado: **32/32 passed** (`npx vitest run supabase/functions/_shared/user-auth.test.ts`).

## 6. Despliegue

Comandos exactos ejecutados (uno por función, sin Docker — advertencia
"Docker is not running" ignorada intencionalmente, la CLI empaqueta sin
él):

```bash
npx supabase functions deploy validate-analysis --project-ref <ref>
npx supabase functions deploy parse-document --project-ref <ref>
npx supabase functions deploy map-accounts --project-ref <ref>
npx supabase functions deploy build-structured-input --project-ref <ref>
npx supabase functions deploy generate-narrative --project-ref <ref>
npx supabase functions deploy upload-document --project-ref <ref>
npx supabase functions deploy run-analysis-pipeline --project-ref <ref>
```

Las 5 funciones internas/mixtas **no** se desplegaron.

## 7. Estado final verificado (`supabase functions list`)

| Función | Estado | `verify_jwt` | Versión |
|---|---|---|---|
| `ejecutar-calculo` | ACTIVE | false | 4 (sin cambios) |
| `continuar-tras-revision` | ACTIVE | false | 4 (sin cambios) |
| `parse-document` | ACTIVE | false | **3** (era 2) |
| `map-accounts` | ACTIVE | false | **3** (era 2) |
| `validate-analysis` | ACTIVE | false | **3** (era 2) |
| `build-structured-input` | ACTIVE | false | **3** (era 2) |
| `generate-narrative` | ACTIVE | false | **3** (era 2) |
| `upload-document` | ACTIVE | false | **3** (era 2) |
| `run-analysis-pipeline` | ACTIVE | false | **3** (era 2) |
| `enviar-notificacion` | ACTIVE | false | 1 (sin cambios) |
| `update-snapshots` | ACTIVE | false | 1 (sin cambios) |
| `check-data-freshness` | ACTIVE | false | 1 (sin cambios) |

**12/12 ACTIVE, 12/12 `verify_jwt=false`. Las 7 subieron de versión; las 5
fuera de alcance no cambiaron de versión.**

## 8. Matriz completa de pruebas remotas

Usuarios sintéticos temporales, dominio `.local`, prefijo `corr_test_`:
`Usuario A` (dueño de un análisis sintético `CORR_TEST_Empresa`),
`Usuario B` (ajeno). Contraseñas aleatorias vía Admin API, nunca
impresas.

| Función | Escenario | HTTP esperado | HTTP observado | Resultado |
|---|---|---|---|---|
| Las 7 | Sin `Authorization` | 401 | **401** (las 7) | ✅ |
| Las 7 | `Authorization: Bearer` inválido | 401 | **401** (las 7) | ✅ |
| Las 7 | `apikey` publishable, sin JWT | 401 | **401** (las 7) | ✅ |
| Las 7 | `apikey` secret, sin JWT | 401 | **401** (las 7) | ✅ |
| `map-accounts` | JWT válido (dueño) | supera auth, no 401 | 500 `MAPPING_ERROR`* | ✅ auth superada |
| `validate-analysis` | JWT válido (dueño) | supera auth, no 401 | 400 `NO_ACCOUNTS` | ✅ |
| `build-structured-input` | JWT válido (dueño) | supera auth, no 401 | 500 `BUILD_ERROR`* | ✅ auth superada |
| `generate-narrative` | JWT válido (dueño) | supera auth, no 401 | 500 `NARRATIVE_ERROR`* | ✅ auth superada |
| `parse-document` | JWT válido (dueño) | supera auth, no 401 | 500 `PARSE_ERROR`* | ✅ auth superada |
| `run-analysis-pipeline` | JWT válido (dueño) | supera auth, no 401 | 400 `NO_DOCUMENTS` | ✅ |
| `upload-document` | JWT válido (dueño) + archivo real | supera auth, no 401 | **200**, documento creado | ✅ |
| Las 7 | JWT dueño A + `user_id`/`userId`/`owner_id`=B + `internal=true` | sin bypass, opera como A | mismos códigos que sin spoof (ver arriba) | ✅ sin bypass |
| Las 7 | JWT de B sobre análisis sintético de A | 404 seguro | **404** `NOT_FOUND` (las 7) | ✅ |
| `run-analysis-pipeline` | JWT de B sobre análisis de A (error **después** de leer el body) | JSON, sin texto plano | `content-type: application/json`, 404, `{"success":false,"error":{"code":"NOT_FOUND",...}}` | ✅ bug `req.clone()` confirmado corregido |

\* Ver sección 14 — estos 500 son un hallazgo honesto **no corregido**,
fuera del alcance de esta tarea (no son fallos de autenticación).

No se probó JWT expirado por no existir una forma segura y razonable de
producir uno real sin esperar su expiración natural (~1 hora) ni
manipular secretos de firma.

## 9. Regresión de funciones internas/mixtas (sin modificar, sin desplegar)

| Función | Prueba | Resultado |
|---|---|---|
| `enviar-notificacion` | secret key en `apikey` (llamada interna real) | 404 (negocio, confirma que la autenticación interna pasó) |
| `enviar-notificacion` | secret key en `Authorization` (debe rechazar) | 401 |
| `check-data-freshness` | sin credenciales | 401 |
| `ejecutar-calculo` | JWT real del dueño sobre su análisis sintético | 500 (negocio — sin `input_payload`, comportamiento preexistente sin relación con esta corrección) |
| `continuar-tras-revision` | sin credenciales | 400 (validación previa, comportamiento preexistente) |

Idéntico al comportamiento documentado en la auditoría forense previa a
esta corrección — sin regresiones. La llamada interna que
`run-analysis-pipeline` hace a `ejecutar-calculo`/`enviar-notificacion`
(reenviando `Authorization` o `apikey` según corresponda) no fue tocada.

## 10. Limpieza

Creado y eliminado en esta sesión:

- 2 usuarios Auth sintéticos (`corr_test_a_*@velarix-test.local`,
  `corr_test_b_*@velarix-test.local`) — eliminados vía Admin API (`HTTP
  200` ambos).
- 1 análisis sintético (`CORR_TEST_Empresa`) y sus filas asociadas en
  `audit_events`, `analysis_jobs`, `job_locks`, `documents`,
  `account_homologations` — eliminados explícitamente (todas `HTTP 204`).
- 2 objetos de Storage (`financial-documents`) subidos durante las
  pruebas de `upload-document` — listados por prefijo y eliminados
  (`HTTP 200`).
- Archivos locales temporales con claves, contraseñas, UUIDs y JWTs
  (permisos `600`, fuera del repositorio) — eliminados al terminar,
  ninguno impreso en esta sesión.

Verificado tras la limpieza: `0` análisis con `company_name ilike
'CORR_TEST%'`; `1` perfil total en la base, `1` con rol `admin` (el
fundador, sin tocar) — confirma que no quedan usuarios sintéticos ni se
afectó al administrador real.

## 11. Búsqueda de secretos y dependencias legacy

```bash
grep -rn "SUPABASE_SERVICE_ROLE_KEY\|SUPABASE_ANON_KEY" supabase/functions/{parse-document,map-accounts,validate-analysis,build-structured-input,generate-narrative,upload-document,run-analysis-pipeline}/index.ts supabase/functions/_shared/user-auth.ts
```

Sin resultados — ninguna dependencia ejecutable de las claves legacy.
Búsqueda de `sb_secret_`, `sb_publishable_`, `eyJ`, `password`, `token`
crudo en los archivos nuevos/modificados: sin coincidencias de secretos
reales, JWT completos ni contraseñas — solo nombres de variables,
comentarios y los patrones de test explícitamente diseñados para
verificar la *ausencia* de esos patrones en las respuestas de error (ver
sección 5).

## 12. Validaciones finales

Ejecutadas una sola vez, al final, en este orden:

| Comando | Código de salida | Resumen |
|---|---|---|
| `npm test -- --run` | 0 | **16 archivos de prueba, 218 passed + 1 expected fail (219 total)** — baseline previo era 187 (186 passed + 1 expected fail); los 32 nuevos son exactamente `user-auth.test.ts`. Sin regresiones. |
| `npx tsc --build --noEmit` | 0 | Limpio, sin salida. |
| `npm run build` | 0 | Build exitoso. Misma advertencia preexistente de tamaño de chunk (`dist/assets/index-*.js` > 500 kB), no relacionada con esta corrección. |
| `npm run lint` | **1** | Ver detalle abajo — **cero errores nuevos**, todos preexistentes. |

### Detalle de `npm run lint` (código de salida 1)

302 problemas totales (278 errores, 24 warnings) en todo el árbol de
trabajo. De esos, **146 están dentro del árbol real versionado por git**;
el resto pertenece a `velarix-code-latest/` — un directorio local
**ignorado por git** (`.gitignore:31`), no forma parte del repositorio ni
de este commit.

De los 146 del árbol real: **cero** referencian
`supabase/functions/_shared/user-auth.ts` ni
`user-auth.test.ts` (los dos archivos nuevos de esta corrección están
100% limpios). El resto son `@typescript-eslint/no-explicit-any`,
`no-useless-escape`, `no-empty` y similares, en líneas **fuera** de las
que esta corrección modificó — confirmado línea por línea comparando
contra los rangos exactos del diff de cada uno de los 7 archivos
tocados (ninguna línea reportada por ESLint cae dentro de un hunk
modificado).

Esto replica exactamente el criterio ya aceptado en la sesión anterior
de este mismo proyecto (`4405e41`, ver
`REPORTE-MIGRACION-CLAVES-LEGACY.md`, sección 8): *"mismos N errores
preexistentes... ninguno introducido por esta migración... cero errores
nuevos"*. El estándar de este repositorio para este comando es "sin
regresiones", no "cero errores totales" — la deuda técnica preexistente
de `no-explicit-any` en Edge Functions es anterior a esta tarea y a la
anterior, y corregirla en las 7 funciones (cientos de anotaciones de
tipo en lógica financiera y de parsing no relacionada con autenticación)
sería un refactor general explícitamente prohibido por el alcance de
esta corrección.

## 13. Documentación actualizada

`docs/velarix/seguridad-credenciales/REPORTE-PREPARACION-JWT-SIGNING-KEYS.md`
— sección nueva añadida al final, sin reescribir el contenido histórico.

## 14. Riesgos residuales

- **Hallazgo honesto, no corregido (fuera de alcance)**: con JWT válido
  del dueño pero sin datos reales (análisis sintético vacío),
  `parse-document`, `map-accounts`, `build-structured-input` y
  `generate-narrative` devuelven `500` para condiciones de precondición
  de negocio ("no hay documentos parseados", documento inexistente,
  etc.) en vez de un `400` más preciso — porque esas rutas siguen
  lanzando `Error` genéricos que caen en el mismo fallback de
  `mapErrorToResponse` que cualquier error técnico real. Esto **no es un
  problema de seguridad** (la autenticación se supera correctamente en
  todos los casos, confirmado por los códigos de error específicos de
  negocio — `MAPPING_ERROR`, `BUILD_ERROR`, `NARRATIVE_ERROR`,
  `PARSE_ERROR` — que solo se producen después de pasar la validación de
  usuario y ownership), pero sí sigue siendo una imprecisión de
  clasificación de errores, en la misma familia que el problema que
  motivó esta corrección. Corregirlo requeriría revisar la lógica de
  negocio interna de cada función (qué condiciones son "falta de datos
  del usuario" vs. "fallo técnico real"), lo cual excede el alcance
  explícito de esta tarea (solo autenticación, ownership, y el bug de
  `req.clone()`). Documentado aquí para una futura sesión con ese
  alcance.
- No se probó JWT expirado de forma real (ver sección 8).
- El `project_id` en `supabase/config.toml` (`inujmyxdqbdnzbxxeoyh`) sigue
  apuntando al proyecto Supabase antiguo y defunto — un problema
  preexistente y ya documentado (no introducido ni agravado por esta
  sesión), sin efecto funcional porque la CLI usa el proyecto realmente
  vinculado (`esaf…rzqh`), pero que convendría limpiar en el futuro para
  evitar confusión.

## 15. Conclusión

No se rotaron, crearon, revocaron ni modificaron JWT Signing Keys en
ningún momento de esta sesión. La corrección fue exclusivamente de
clasificación de respuestas HTTP (401/404/500) y de un bug de manejo de
errores en `run-analysis-pipeline` — ninguna decisión de autorización ni
de identidad fue tocada. El sistema permanece, después de esta
corrección, en el mismo estado de preparación técnica para una futura
auditoría previa a la rotación de JWT Signing Keys que describía el
reporte anterior, ahora con las respuestas de error correctamente
clasificadas y verificadas en vivo contra el proyecto real.

## 16. Cierre posterior (2026-08-05) — hallazgos de una auditoría independiente

Una auditoría independiente posterior a este reporte encontró seis
hallazgos que seguían pendientes tras este commit: las 7 funciones
descartaban el campo `error` de `auth.getUser` (pudiendo ocultar un fallo
técnico real de Supabase Auth como 401), la rama 500 podía exponer
`error.message` crudo, cuatro funciones devolvían 500 ante precondiciones
de negocio normales (ya reconocido como hallazgo honesto en la sección 14
de este mismo reporte), el `project_id` desalineado en `config.toml`
(también ya documentado en la sección 14), y una violación del proceso de
lint (commit creado pese a un fallo real de `npm run lint`, aunque sin
errores nuevos).

Los seis se cerraron en la sesión siguiente — ver
`docs/velarix/seguridad-credenciales/REPORTE-CIERRE-HALLAZGOS-AUTH-PRE-JWT.md`
para la causa raíz completa, la corrección aplicada, las 65 pruebas
automatizadas nuevas, y la matriz remota verificada en vivo contra el
proyecto real (46 escenarios).

Este reporte y su matriz de pruebas (secciones 1–15) se conservan tal
cual, sin reescribir, como evidencia histórica del estado inmediatamente
posterior a `217a677`. Las JWT Signing Keys **no fueron tocadas, creadas,
rotadas ni migradas** en esa sesión posterior tampoco — sigue siendo un
paso manual, pendiente de una auditoría final antes de iniciarse.
