# Reporte de saneamiento — Migración de claves legacy (P0)

Fecha: 2026-08-05. Continuación directa de `fix: complete mixed auth and
founder bootstrap` (`ac22829`). Proyecto destino real (Supabase,
enmascarado): `esaf…rzqh`, **"Velarix"**. Entorno de desarrollo — todos
los registros creados en esta sesión fueron sintéticos, prefijo
`1D_TEST_`, eliminados al terminar.

## Por qué existe este reporte (distinto de 1D)

`REPORTE-ACTIVACION-1D.md` documenta el **cierre funcional de 1D**:
`ejecutar-calculo` y `continuar-tras-revision` con autenticación mixta,
y el fundador configurado como administrador. Eso ya estaba cerrado
antes de esta sesión y no se reabrió.

Este reporte documenta una tarea distinta y posterior: el **incidente de
credencial** reportado al cierre de 1D (la legacy `service_role` key fue
impresa en texto plano en una sesión anterior y se declaró comprometida)
dejaba **diez Edge Functions adicionales** todavía dependiendo
operativamente de esa misma key — lo que impedía al fundador rotarla o
desactivarla sin romper el sistema. El objetivo de esta sesión fue
eliminar esa dependencia en las diez funciones restantes, sin tocar la
lógica financiera, visual o de negocio de ninguna de ellas.

## Estado final: **saneamiento completo de las 10 funciones**

| Condición | Resultado |
|---|---|
| Búsqueda inicial de dependencias legacy en todo el repo | ✅ Confirmado: exactamente las 10 funciones nombradas, sin extras |
| Las 10 funciones migradas a `SUPABASE_SECRET_KEYS`/`SUPABASE_PUBLISHABLE_KEYS` | ✅ Sí |
| Llamadas entre funciones corregidas (nunca secret key en `Authorization`) | ✅ Sí |
| `verify_jwt` decidido función por función, no de forma uniforme | ✅ Sí |
| Desplegadas solo las funciones modificadas | ✅ Sí — las 10, `ACTIVE` |
| Pruebas remotas por categoría (usuario, servicio interno, pipeline integrado) | ✅ Sí, todas contra el proyecto real |
| Auditoría final: cero referencias ejecutables a claves legacy | ✅ Sí |
| Validaciones locales | ✅ Sí — sin regresiones |
| Datos/usuarios sintéticos eliminados | ✅ Sí |

## 1. Consumidores encontrados (búsqueda inicial, todo el repositorio)

Búsqueda de `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, claves JWT
legacy hardcodeadas, `Authorization: Bearer` con keys administrativas,
`supabase.functions.invoke`, `pg_net`, `cron`/`pg_cron`, webhooks,
`.github/`, `vercel.json`/`*.yml`, scripts de despliegue:

- **Ejecutables**: exactamente las 10 funciones nombradas por la tarea
  (`parse-document`, `build-structured-input`, `upload-document`,
  `generate-narrative`, `map-accounts`, `validate-analysis`,
  `run-analysis-pipeline`, `check-data-freshness`,
  `enviar-notificacion`, `update-snapshots`) — ninguna función adicional
  no listada dependía de las keys legacy.
- **Sin infraestructura de cron/pg_net/webhooks/CI/CD** en este
  repositorio — cero resultados en todas las búsquedas. `update-snapshots`
  y `check-data-freshness` no tienen ningún invocador en el código
  (destinadas a invocación manual o futura, nunca automatizada hoy).
- El único otro lugar que mencionaba las variables legacy era
  `supabase/functions/_shared/admin-key.ts`, en un comentario explicativo
  (sin valores).

## 2. Funciones migradas y modelo de autenticación de cada una

Ninguna se configuró de forma uniforme — cada una se analizó por
separado antes de tocar código:

### Usuario-only (7) — JWT real de usuario, nunca secret key

Reciben `apikey: <publishable key>` + `Authorization: Bearer <JWT del
usuario>`. Confirmado por lectura de `src/lib/api-client.ts`
(`getAuthHeaders()`): estas 7 funciones son las únicas que el frontend
invoca directamente. `verify_jwt` permanece en su valor por defecto
`true` (la puerta de entrada de Supabase sí reconoce JWT reales de
usuario, a diferencia de las secret keys).

| Función | Quién la invoca | Qué necesita | RLS o admin |
|---|---|---|---|
| `parse-document` | Frontend (usuario autenticado) | Leer/actualizar su propio documento y análisis | Cliente admin (`secretKey`) para escritura de resultados de parsing + cliente `anonKey` solo para verificar identidad del JWT |
| `map-accounts` | Frontend | Homologar cuentas de su análisis | Igual patrón |
| `validate-analysis` | Frontend | Ejecutar validaciones contables de su análisis | Igual patrón |
| `build-structured-input` | Frontend | Construir input estructurado de su análisis | Igual patrón |
| `generate-narrative` | Frontend | Generar narrativa de su análisis, dispara notificación interna | Igual patrón + llamada saliente a `enviar-notificacion` con secret key |
| `upload-document` | Frontend | Subir documento a storage + crear registro | Igual patrón; ya no depende de una URL de proyecto vieja hardcodeada |
| `run-analysis-pipeline` | Frontend | Orquestar las 5 funciones anteriores + `ejecutar-calculo`, mantener `job_locks`/`analysis_jobs` | Cliente admin propio para las tablas de control; reenvía el JWT real del usuario (sin cambios) a cada función que invoca |

Todas migraron el bloque idéntico:

```ts
const secretKey = resolveAdminSecretKey();
const anonKey = resolvePublishableKey();
const supabase = createClient(supabaseUrl, secretKey);
const anonClient = createClient(supabaseUrl, anonKey);
```

`upload-document` además perdió el fallback hardcodeado al proyecto
Supabase antiguo y defunto (`https://inujmyxdqbdnzbxxeoyh.supabase.co`)
y su lógica condicional de "service role si existe, si no anon key" —
ahora usa siempre el cliente admin, igual que las demás.

### Internas-only (3) — nunca las llama el frontend

Reciben la secret key `default` **únicamente** por `apikey`; cualquier
`Authorization` se ignora para efectos de autorización (solo se
usaría para un JWT real, que estas funciones no aceptan). Verifican
explícitamente `apikey === secretKey` con `isInternalServiceCall`
(`_shared/authorization.ts`) — la misma función pura que 1D ya probó,
reutilizada sin modificar sus reglas. `verify_jwt = false`, justificado
en `supabase/config.toml`: la puerta de entrada no reconoce el formato
de secret key, así que la verificación queda explícita en el código de
cada función, igual que `ejecutar-calculo`/`continuar-tras-revision`.

| Función | Quién la invoca | Antes de esta sesión | Ahora |
|---|---|---|---|
| `enviar-notificacion` | `generate-narrative`, `run-analysis-pipeline` (2 puntos) | **Sin ninguna verificación de identidad del llamador** | Exige `apikey` = secret key; rechaza cualquier otra cosa con `401` |
| `update-snapshots` | Nadie en el código actual (invocación manual/futura) | Sin verificación | Exige `apikey` = secret key |
| `check-data-freshness` | Nadie en el código actual | Sin verificación | Exige `apikey` = secret key |

**Nota importante**: `enviar-notificacion` y `update-snapshots` no
tenían *ninguna* verificación de identidad antes de esta sesión — esto
coincide con el hallazgo previo `BL-11`/riesgo `R-10` del backlog
("Autenticar `update-snapshots` y `enviar-notificacion`"). La migración
de claves cierra ese hallazgo como consecuencia directa, no como
alcance añadido — antes cualquiera con la URL de la función podía
disparar el envío de un correo o la reescritura de los snapshots de
valoración; ahora exige la secret key.

### Ya migradas en 1D (2) — sin cambios esta sesión

`ejecutar-calculo`, `continuar-tras-revision`: autenticación mixta,
`verify_jwt = false`, sin tocar.

## 3. Llamadas entre funciones corregidas

La secuencia real de `run-analysis-pipeline` (confirmada leyendo el
código, no asumida) es:
`parse-document → map-accounts → validate-analysis →
build-structured-input → ejecutar-calculo`, reenviando el **mismo JWT
real del usuario** en cada paso (sin cambios — estas 5 llamadas nunca
usaron ni deben usar una secret key). `generate-narrative` **no** forma
parte de esta cadena — se invoca por separado, después, desde el
frontend.

Las llamadas que sí usaban una key administrativa se corrigieron para
enviarla exclusivamente por `apikey`, nunca por `Authorization`:

- `run-analysis-pipeline` → `enviar-notificacion` (rama de validación
  bloqueada, ~línea 177): antes `Authorization: authHeader` (el JWT del
  usuario, sin ningún efecto real dado que `enviar-notificacion` no
  verificaba nada) → ahora `apikey: <secret key>`.
- `run-analysis-pipeline` → `enviar-notificacion` (rama de error técnico
  del `catch` global, ~línea 305): mismo cambio, con manejo explícito de
  que la resolución de la secret key en el propio `catch` no interrumpa
  la respuesta de error si llegara a fallar.
- `generate-narrative` → `enviar-notificacion`: antes `Authorization:
  Bearer ${anonKey}` (la publishable key, sin ningún efecto real) →
  ahora `apikey: <secret key>`.

Ningún cuerpo (`body`) de estas llamadas otorga identidad ni privilegios
— `enviar-notificacion` nunca leyó `internal`/`user_id` del body, y
sigue sin hacerlo.

## 4. Configuración final de `verify_jwt` (`supabase/config.toml`)

No se aplicó un valor uniforme. Justificación por función, documentada
también como comentario en el propio archivo:

- **`true` (7 funciones, sin sección propia — valor por defecto de la
  plataforma)**: `parse-document`, `map-accounts`, `validate-analysis`,
  `build-structured-input`, `generate-narrative`, `upload-document`,
  `run-analysis-pipeline`. Solo reciben JWT reales de usuario en
  `Authorization` — formato que la puerta de entrada sí reconoce.
- **`false` (3 funciones nuevas)**: `enviar-notificacion`,
  `update-snapshots`, `check-data-freshness`. Reciben la secret key por
  `apikey`, formato que la puerta de entrada no reconoce — la
  verificación queda explícita en el código de cada función.
- **`false` (2 funciones, sin cambios de 1D)**: `ejecutar-calculo`,
  `continuar-tras-revision`.

Verificado contra el proyecto real tras el despliegue
(`supabase functions list`): los 10 `verify_jwt` remotos coinciden
exactamente con lo declarado en `config.toml`.

## 5. Despliegue

Únicamente las 10 funciones modificadas, sin Docker:
`parse-document`, `map-accounts`, `validate-analysis`,
`build-structured-input`, `generate-narrative`, `upload-document`,
`run-analysis-pipeline`, `enviar-notificacion`, `update-snapshots`,
`check-data-freshness` — todas `status: "ACTIVE"`, `version: 1` (primer
despliegue de esta sesión). `ejecutar-calculo`/`continuar-tras-revision`
no se redesplegaron (sin cambios).

## 6. Pruebas remotas (contra el proyecto real, datos sintéticos `1D_TEST_`)

Usuarios sintéticos temporales: `1D_TEST_OWNER5` (dueño de un análisis
sintético), `1D_TEST_OUTSIDER5` (usuario ajeno). Contraseñas aleatorias
vía Admin API, nunca impresas, eliminados al terminar.

### Usuario (contra `map-accounts`, representativa del patrón de las 7)

| # | Escenario | Resultado |
|---|---|---|
| 1 | Sin `Authorization` ni `apikey` | `401 UNAUTHORIZED_NO_AUTH_HEADER` (rechazo de la puerta de entrada, `verify_jwt=true`) |
| 2 | Solo `apikey` publishable, sin JWT | Rechazado — código propio, "No authorization header" |
| 3 | Publishable + JWT válido (dueño) | Autenticación aceptada, llega a lógica de negocio real |
| 4 | Publishable + JWT inválido | `401 UNAUTHORIZED_INVALID_JWT_FORMAT` (puerta de entrada) |
| 5 | Usuario ajeno con JWT válido | Rechazado — mismo mensaje genérico "Not found" que un análisis inexistente |
| 6 | Body con `internal: true` y `user_id` falsificado (JWT ajeno) | Sin efecto — mismo rechazo genérico que el escenario 5 |
| 7 | Secret key en `apikey`, sin `Authorization` | Rechazado — la secret key **no** otorga privilegios internos a una función usuario-only; sigue exigiendo JWT |

Confirmación puntual del mismo patrón (auth aceptada, llega a lógica de
negocio real) repetida contra `validate-analysis`,
`build-structured-input`, `generate-narrative`, `parse-document` y
`run-analysis-pipeline` con el JWT real del dueño.

**Nota honesta**: varios rechazos de aplicación devuelven `500` en vez
de un `401`/`403` más preciso (p. ej. escenario 2). Es un patrón de
manejo de errores **preexistente** a esta sesión (un `catch` genérico
que no distingue el tipo de error) — no se modificó, porque no forma
parte del alcance de esta migración de credenciales y tocarlo sería
cambiar lógica de negocio fuera de lo autorizado. Se documenta aquí para
que quede registrado, no oculto.

### Servicio interno (contra las 3 funciones nuevas)

| # | Escenario | `enviar-notificacion` | `update-snapshots` | `check-data-freshness` |
|---|---|---|---|---|
| 1 | Secret key en `apikey` | `404` negocio (análisis sintético inexistente — confirma que la autenticación pasó) | `200`, `0` snapshots creados (idempotente, ya existían) | `200`, reporte real de frescura |
| 2 | Secret key en `Authorization` (no en `apikey`) | `401 "No autorizado."` | `401` | `401` |
| 3 | Key incorrecta en `apikey` | `401` (rechazo de la puerta de entrada, "Invalid API key") | — | `401` (puerta de entrada) |
| 4 | Publishable + JWT real de usuario | `401 "No autorizado."` | `401` | `401` |

Ninguna prueba de `enviar-notificacion` disparó un correo real — el
escenario "permitido" usó un `analysis_id` sintético inexistente para
confirmar que la autenticación pasa sin ejecutar el envío real.

### Pipeline integrado (`run-analysis-pipeline`)

Con el análisis sintético del usuario dueño:

1. Ejecución sin documentos cargados → `400 NO_DOCUMENTS`, confirma que
   `resolveAdminSecretKey()`/`resolvePublishableKey()` y el cliente
   admin nuevo funcionan correctamente contra las tablas reales
   (`analyses`, `documents`, `job_locks`).
2. Con un `job_locks` activo simulado (`expires_at` futuro) → `409
   CONFLICT`, confirma que la protección de idempotencia sigue intacta
   con las nuevas keys.
3. Tras liberar el lock, nueva ejecución → `400 NO_DOCUMENTS` de nuevo,
   sin dejar el lock huérfano (verificado por consulta directa:
   `job_locks` vacío tras la ejecución) y sin crear filas duplicadas en
   `analysis_jobs` (verificado: `0` filas, porque la función retorna
   antes del primer `updateJob`, comportamiento esperado y sin cambios).

**Alcance reconocido**: no se ejecutó una corrida completa del motor de
cálculo DCF de extremo a extremo (requeriría documentos financieros
reales y varias llamadas a Claude, fuera del criterio de "datos
sintéticos mínimos" de esta tarea). Las dos llamadas internas de
`run-analysis-pipeline` a `enviar-notificacion` se verificaron por
revisión de código más una prueba directa equivalente contra
`enviar-notificacion` con `apikey` = secret key (sección anterior) — no
se observaron disparándose en la misma ejecución en vivo del pipeline.

### Limpieza

Al terminar: `2` usuarios Auth sintéticos eliminados, `1` análisis
sintético eliminado junto con sus `job_locks`/`analysis_jobs`/
`audit_events` asociados. Verificado por consulta directa: `0`
análisis con `company_name like '1D_TEST%'`, `0` perfiles con
`company like '1D_TEST%'`, `0` usuarios Auth con `1d_test` en el email,
`0` locks residuales, exactamente `1` administrador (el fundador, sin
tocar). Todos los archivos temporales (dos claves, dos contraseñas, dos
JWT de sesión) vivieron con permisos `600` fuera del repositorio y se
eliminaron al terminar; ninguno se imprimió en esta sesión.

## 7. Auditoría final de referencias legacy (todo el repositorio)

Repetida la misma búsqueda de la sección 1, ahora esperando cero
resultados ejecutables:

- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY`: **cero** referencias
  ejecutables en `supabase/functions/**`. Las únicas coincidencias
  restantes son comentarios explicativos (`_shared/admin-key.ts`,
  `config.toml`) y documentación histórica (`.md`) que nombra las
  variables sin contener ningún valor.
- `SUPABASE_PUBLISHABLE_KEY` (variable legacy singular, distinta de
  `SUPABASE_PUBLISHABLE_KEYS` plural nueva): **cero** referencias.
- Claves hardcodeadas (`sb_secret_...`, `sb_publishable_...`, JWT con
  prefijo `eyJ`): **cero** en código — solo referencias de formato en
  comentarios (`_shared/authorization.ts`), sin valores.
- URL del proyecto Supabase antiguo (`inujmyxdqbdnzbxxeoyh`) hardcodeada
  en código: **cero** — eliminada de `upload-document`. Sigue apareciendo
  en `supabase/config.toml:1` (`project_id`, deliberadamente sin tocar
  desde 1D — el CLI usa `.temp/project-ref` para el proyecto realmente
  vinculado, no ese campo) y en documentación histórica de auditoría
  (`08-INFRAESTRUCTURA-E-INTEGRACIONES.md`, snapshot congelado de la
  fase 1A, fuera del alcance de actualización de esta tarea).
- Frontend (`src/`): **cero** referencias a `SUPABASE_SERVICE_ROLE_KEY`/
  `SUPABASE_ANON_KEY`. `.env` (ignorado por git) solo contiene
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `VITE_SUPABASE_PROJECT_ID`.
- `functions.invoke`, `pg_net`, `net.http_post`/`get`, `cron`/`pg_cron`,
  webhooks de base de datos, `.github/`, `vercel.json`, otros `*.yml`:
  **cero** resultados — confirma que no existe infraestructura de
  cron/CI/webhooks en este repositorio hoy que dependa de ninguna key.

**Conclusión de la auditoría**: cero consumidores operativos restantes
de `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ANON_KEY` en las 12 Edge
Functions del proyecto (las 10 de esta sesión + las 2 de 1D).

## 8. Validaciones locales (ejecutadas una sola vez, al final)

- `npm test -- --run`: **186 passed + 1 expected fail (187 total)** —
  mismo baseline que 1D, sin regresiones.
- `npx tsc --build --noEmit`: limpio, sin errores.
- `npm run build`: exitoso (advertencia preexistente de tamaño de chunk,
  no relacionada).
- `npm run lint`: mismos **16 errores preexistentes** en las funciones
  tocadas (todos `@typescript-eslint/no-explicit-any` y
  `no-useless-escape`, ninguno introducido por esta migración —
  confirmado comparando línea por línea contra el código previo al
  cambio: el conteo es idéntico, solo se desplazaron los números de
  línea por la línea de `import` añadida). **Cero errores nuevos.**

## 9. Componente preexistente no relacionado (hallazgo incidental)

`velarix-bloque-1d-activado.zip` aparece modificado en el árbol de
trabajo (70217 → 73156 bytes) sin que esta sesión lo haya tocado — el
commit `V2.3` del propio usuario incluyó una versión distinta a la que
existe actualmente en disco. No forma parte de este saneamiento y no se
incluyó en el commit de esta tarea; se deja para que el usuario decida
si quiere regenerarlo o descartarlo.

## 10. Acción manual pendiente

**Rotar/desactivar la legacy `service_role` key** desde el dashboard de
Supabase (Project Settings → API Keys, proyecto `esaf…rzqh`). Con esta
sesión, **las 12 Edge Functions del proyecto ya no dependen
operativamente de ella** — es la primera vez que se puede afirmar esto
con una auditoría completa del repositorio. Sigue siendo una acción
manual, fuera del alcance de la CLI y de este reporte.

## 11. Confirmación de entorno mock

Todos los datos creados en esta sesión fueron sintéticos, prefijo
`1D_TEST_`, dominio `.local`, eliminados al terminar. Ningún dato real
de cliente fue creado, leído ni modificado. No se tocó la cuenta del
fundador ni su rol de administrador.
