# Reporte de activación — Bloque 1D-OPS

Fecha de activación inicial: 2026-07-23. Corrección de credenciales:
2026-07-30. Corrección final de autenticación mixta + administrador
real: 2026-08-05. Proyecto destino real (Supabase, enmascarado):
`esaf…rzqh`, nombrado **"Velarix"** en el dashboard. Entorno de
desarrollo, autorizado explícitamente por no contener datos reales de
clientes — todos los registros creados en cada sesión de este bloque
fueron sintéticos, prefijo `1D_TEST_`, y se eliminaron al terminar.

## Estado final: **1D CERRADO**

| Condición | Resultado |
|---|---|
| Migración aplicada | ✅ Sí |
| Funciones desplegadas con autenticación correcta | ✅ Sí — `ejecutar-calculo` y `continuar-tras-revision`, `ACTIVE`, autenticación mixta propia, `verify_jwt: false` (justificado, ver sección 1) |
| Primer admin real configurado | ✅ Sí — cuenta real del fundador, promovida por bootstrap protegido |
| Pruebas críticas reales pasaron | ✅ Sí — SQL/RPC/RLS, HTTP con usuario real, autenticación mixta (10 escenarios), auditoría |

## 1. Modelo de autenticación final

Las dos funciones aceptan exactamente dos modos, verificados **dentro
del código de cada función** (no en la puerta de entrada de Supabase):

- **Usuario real**: `apikey: <publishable key>` + `Authorization: Bearer
  <JWT del usuario>`. El JWT se valida contra Supabase Auth
  (`auth.getUser`) — si no resuelve a un usuario real, no hay sesión.
- **Servicio interno**: `apikey: <secret key "default">`, sin
  `Authorization` (o cualquier valor en `Authorization` es ignorado si
  `apikey` ya coincide con la secret key real).

**Por qué `verify_jwt = false` en estas dos funciones** (`supabase/config.toml`):
la puerta de entrada de Supabase con `verify_jwt = true` solo entiende
JWT (legacy `anon`/`service_role`), no el formato de las secret keys
nuevas (`sb_secret_...`) — con `verify_jwt = true` una llamada de
servicio interno enviando la secret key por `apikey` sería rechazada
antes de llegar al código. Por eso ambas funciones desactivan la
verificación de la puerta de entrada y **implementan su propia
verificación explícita** para los dos modos — no quedan públicas, no
usan `auth: none`, y el JWT del usuario se sigue validando
criptográficamente contra Supabase Auth en cada llamada.

**Nota sobre `@supabase/server`**: se investigó `withSupabase`/
`createSupabaseContext` (`npm:@supabase/server`) como lo sugería la
instrucción original. La documentación oficial confirma que existe,
pero no se pudo verificar con certeza la sintaxis exacta del modo
combinado con una secret key nombrada (`"secret:default"` vs. `"secret"`
simple), y una fuente indicaba que `verify_jwt` debía permanecer `true`
para ese paquete — contradicho por la guía de migración de claves, que
es explícita: *"the platform's built-in verify_jwt check only
understands the legacy JWT-based keys, so set verify_jwt = false for
these functions and authorize the request in your own code"*. Ante esa
contradicción y por ser una dependencia nueva no usada antes en este
repositorio, se optó por la alternativa explícitamente autorizada: una
implementación manual equivalente, auditable, sin dependencias nuevas —
consistente con el resto de `_shared/*.ts` en este proyecto.

`isInternalServiceCall` (`_shared/authorization.ts`) se adaptó: antes
comparaba `Authorization` contra la key administrativa; ahora compara el
header `apikey` — nunca `Authorization`, porque las secret keys no son
JWT. Ninguna otra regla de autorización (roles, ownership, idempotencia)
cambió.

Ambas funciones también dejaron de leer `SUPABASE_ANON_KEY`/
`SUPABASE_PUBLISHABLE_KEY` (variables legacy singulares) para el cliente
que verifica el JWT de usuario — ahora usan `resolvePublishableKey()`
(`_shared/admin-key.ts`), que lee la publishable key `default` desde
`SUPABASE_PUBLISHABLE_KEYS` (JSON), el equivalente no-administrativo de
`SUPABASE_SECRET_KEYS`. Verificado empíricamente en producción tras el
despliegue.

## 2. Estado de las funciones

`ejecutar-calculo` y `continuar-tras-revision`: `status: "ACTIVE"`,
`verify_jwt: false` (justificado arriba), `version: 4` tras dos
redespliegues de esta sesión (auth mixta explícita, luego migración de
la publishable key).

## 3. Pruebas de autenticación (10 escenarios exigidos + conservación de reglas de negocio)

Ejecutadas contra ambas funciones desplegadas, con 3 usuarios Auth
sintéticos temporales reales (`1D_TEST_OWNER3/OUTSIDER3/ANALYST3`,
contraseña aleatoria vía Admin API, eliminados al terminar):

| # | Prueba | Resultado |
|---|---|---|
| 1 | Sin `Authorization` y sin `apikey` | ✅ `401 "No autenticado."` (verificado en el código de la función, no en la puerta de entrada — `verify_jwt=false`) |
| 2 | Solo publishable key en `apikey`, sin JWT | ✅ `401 "No autenticado."` |
| 3 | Publishable key + JWT válido (propietario, luego analista) | ✅ `200`, permitido según rol |
| 4 | Publishable key + JWT inválido | ✅ `401 "No autenticado."` |
| 5 | Secret key `default` únicamente en `apikey`, sin `Authorization` | ✅ `200`, llamada interna permitida (ambas funciones) |
| 6 | Secret key enviada como `Authorization: Bearer` | ✅ Rechazada — con `apikey` de otro tipo presente, el gateway de Supabase la rechaza primero (`401 "Conflicting API keys"`); enviada sola en `Authorization` sin `apikey`, el código propio la rechaza igual (`401 "No autenticado."`, porque no es un JWT válido) |
| 7 | Otra key incorrecta en `apikey` | ✅ `401 "No autenticado."` |
| 8 | Body con `internal: true` | ✅ Sin efecto — el código nunca lee ese campo |
| 9 | Body con `user_id` falsificado (token de usuario ajeno) | ✅ Sin efecto — mismo rechazo `404` genérico que sin falsificar nada |
| 10 | Rechazos no revelan si un análisis ajeno existe | ✅ Mismo mensaje `404 "Análisis no encontrado."` para "no existe" y "existe pero no es tuyo" |

Reglas de negocio conservadas, reverificadas tras el cambio de
autenticación:

- Propietario ejecuta su propio análisis — permitido.
- Ajeno — rechazado (`404` genérico).
- Propietario intenta continuar su propia revisión — rechazado (`403
  "No autorizado."`, autoaprobación).
- Analista, revisión ya aprobada — permitido (`200`).
- Segundo intento sobre la misma revisión procesada — `409 "Esta
  revisión ya fue procesada."` (idempotencia intacta).
- `audit_events`: 16 eventos reales de esta sesión revisados, 0 con
  patrón de token/secreto.

## 4. Frontend migrado a publishable key

`.env` (ignorado por git) actualizado: `VITE_SUPABASE_URL` al proyecto
real, `VITE_SUPABASE_PUBLISHABLE_KEY` a la nueva `sb_publishable_...`
(reemplazando la legacy `anon` tipo JWT). `VITE_SUPABASE_PROJECT_ID` sin
tocar (el código no lo usa). La publishable key nunca se envía en
`Authorization` — solo en `apikey`; `Authorization` siempre lleva el JWT
real de la sesión del usuario.

**Corrección sobre un hallazgo anterior**: se había reportado que
`sb_publishable_...` era rechazada por la puerta de entrada de Edge
Functions de este proyecto. Verificado ahora que **sí funciona
correctamente** — el rechazo anterior ocurría con `verify_jwt = true`
(la puerta de entrada validaba la key con lógica que no reconocía el
formato nuevo); con `verify_jwt = false` y la key correctamente enviada
en `apikey`, la llamada funciona sin problema. Confirmado con una
invocación real: sesión de usuario auténtica + `apikey` publishable +
`Authorization` con el JWT real → `200`.

## 5. Fundador configurado como administrador

Se inspeccionó `auth.users` de forma enmascarada: exactamente **una**
cuenta no `.local`, creada por el fundador antes de esta sesión,
inequívocamente distinguible de las cuentas de prueba (`.local`,
`1d_test*`). Se promovió mediante el mecanismo protegido de bootstrap
(`SET LOCAL app.role_change_authorized = 'true'` + `UPDATE profiles SET
role='admin'`, dentro de una transacción explícita) — **sin tocar su
contraseña**.

Verificado:

- `profiles.role = 'admin'` para esa cuenta.
- Evento `bootstrap_administrador_fundador` insertado en `audit_events`.
- La cuenta **no puede** cambiar su propio rol vía
  `admin_set_user_role` — `SELF_ROLE_CHANGE_BLOCKED` (simulado con su
  identidad real vía `request.jwt.claims`, sin necesitar ni conocer su
  contraseña).
- La cuenta **sí puede** ejecutar una operación administrativa válida
  sobre otro usuario (sintético) — `ROLE_UPDATED` (simulación de
  solo-lectura, revertida con `rollback`, sin dejar cambios persistentes
  fuera de la promoción real).

No se creó ninguna cuenta sintética permanente como sustituto.

## 6. Limpieza

Creados y eliminados en esta sesión: 3 usuarios Auth sintéticos, 3
análisis, 2 revisiones manuales, homologaciones asociadas. Verificado
tras la limpieza: `0` perfiles con `company='1D_TEST_'`, `0` análisis,
`0` revisiones, exactamente `1` administrador (el fundador).

Todos los archivos temporales (secret key, publishable key, 3
contraseñas, 3 tokens de sesión) vivieron con permisos `600` fuera del
repositorio y se eliminaron al terminar; ninguno se imprimió en esta
respuesta ni se escribió en el repositorio.

## 7. Validaciones locales

`npm test -- --run`, `npx tsc --build --noEmit`, `npm run build`, `npm
run lint` — resultados en la respuesta final.

## 8. Componentes que todavía dependen de claves legacy (fuera de alcance de 1D)

Las siguientes Edge Functions **no** son parte de 1D y siguen sin migrar
(leen `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ANON_KEY` directamente):
`parse-document`, `build-structured-input`, `upload-document`,
`generate-narrative`, `map-accounts`, `validate-analysis`,
`run-analysis-pipeline`, `check-data-freshness`, `enviar-notificacion`,
`update-snapshots`. Migrarlas queda fuera del alcance de este bloque —
no se tocaron.

## 9. Acción manual pendiente (fuera del alcance de este reporte)

**Desactivar/rotar la legacy `service_role` key** desde el dashboard de
Supabase (Project Settings → API Keys, proyecto `esaf…rzqh`). El código
de `ejecutar-calculo`/`continuar-tras-revision` ya no la usa, pero sigue
existiendo y siendo válida hasta que alguien con acceso al dashboard la
revoque manualmente — no ejecutable desde la CLI ni desde este reporte.
Las 10 funciones listadas en la sección 8 sí siguen dependiendo de ella
operativamente, así que revocarla hoy las rompería — revocar solo
después de migrar esas funciones (fuera de alcance de 1D).

## 10. Rollback disponible

`supabase/rollback/` documenta el rollback de la migración
`20260723090000_bloque_1d_bl10_role_protection.sql`. No se ejecutó
ningún rollback en esta sesión.

## 11. Confirmación de entorno mock

Todos los datos usados en todas las sesiones de este bloque fueron
sintéticos, con prefijo `1D_TEST_` y correos de dominio `.local` —
ningún dato real de cliente fue creado, leído ni modificado. La única
cuenta real involucrada es la del fundador, y solo se le cambió
`profiles.role` (nunca su contraseña ni ningún otro dato).
