# Reporte de activación — Bloque 1D-OPS

Fecha de activación inicial: 2026-07-23. Corrección de credenciales y
administrador real: 2026-07-30. Proyecto destino real (Supabase,
enmascarado): `esaf…rzqh`, nombrado **"Velarix"** en el dashboard.
Entorno de desarrollo, autorizado explícitamente por no contener datos
reales de clientes — todos los registros creados en cada sesión de este
bloque fueron sintéticos, prefijo `1D_TEST_`, y se eliminaron al
terminar.

## Estado final: **1D parcial — no cerrado**

| Condición | Resultado |
|---|---|
| Migración aplicada | ✅ Sí |
| Funciones desplegadas con credencial segura | ✅ Sí — `ejecutar-calculo` y `continuar-tras-revision`, `ACTIVE`, `verify_jwt: true`, migradas a la nueva secret key |
| Primer admin real configurado | ❌ No — no existe ninguna cuenta en `auth.users` del proyecto vinculado (sección 6) |
| Pruebas críticas reales pasaron | ✅ Sí — SQL/RPC/RLS (15, sesión anterior) + HTTP (14, sesión anterior) + verificación mínima post-rotación (esta sesión) |

**1D no se cierra en esta sesión** — la única condición pendiente es el
administrador real, y no se pudo resolver porque el proyecto vinculado
no tiene ningún usuario todavía (ver sección 6, incluye la hipótesis más
probable de por qué).

## 0. Incidente de credencial (2026-07-30)

Durante la sesión de cierre anterior, un comando de consulta de API keys
imprimió la legacy `service_role` key completa en un output de consola
que quedó visible en la transcripción de esa sesión. Se trata esa key
como **comprometida**.

Acciones tomadas en esta sesión:

- `ejecutar-calculo`, `continuar-tras-revision` y cualquier helper
  compartido que ellas usan fueron migrados para dejar de leer
  `SUPABASE_SERVICE_ROLE_KEY` — ver sección 1.
- No se volvió a imprimir esa key en ningún momento de esta sesión, ni
  se usó para ninguna operación nueva.
- **Acción manual pendiente, no ejecutable desde aquí**: revocar/rotar
  la legacy `service_role` key desde el dashboard de Supabase
  (Project Settings → API Keys). Este reporte NO desactiva esa key —
  solo deja de usarla desde el código. La desactivación real requiere
  una acción humana en el dashboard (ver sección 9).

## 1. Funciones migradas a la nueva secret key

Nuevo módulo puro `supabase/functions/_shared/admin-key.ts`
(`resolveAdminSecretKey()`): lee `SUPABASE_SECRET_KEYS` (JSON que
Supabase inyecta en el runtime de la Edge Function), extrae la key
`default`, y lanza un error técnico genérico y seguro (sin exponer
ningún valor) si falta o es inválida. No imprime ni registra el valor en
ningún caso.

`ejecutar-calculo/index.ts` y `continuar-tras-revision/index.ts` ahora
llaman `resolveAdminSecretKey()` en vez de leer
`Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` — en los dos lugares de cada
archivo donde antes se leía esa variable (incluido el cliente de
recuperación del bloque `catch` de `ejecutar-calculo`). `isInternalServiceCall`
(`_shared/authorization.ts`) no cambió — es agnóstica de qué key se le
pase, así que la migración no altera ninguna regla de autorización.

**Confirmado: `SUPABASE_SERVICE_ROLE_KEY` ya no aparece en ningún lugar
del código de estas dos funciones ni de sus helpers compartidos**
(verificado por búsqueda en el árbol de archivos desplegado).

## 2. Estado de las funciones

`ejecutar-calculo` y `continuar-tras-revision` redesplegadas
(`--use-api`, sin Docker, sin `--no-verify-jwt`). Verificado con
`functions list`: ambas `status: "ACTIVE"`, `verify_jwt: true`,
`version: 2` (confirma que sí se redesplegaron con el código migrado).

## 3. Publishable key del frontend — corrección

**Corrección sobre el reporte anterior**: no es correcto afirmar que
`sb_publishable_...` es incompatible de forma permanente con este
proyecto. La prueba que llevó a esa conclusión estaba mezclada con un
error de construcción de headers en `curl` (la expansión
`${token:+...}` con comillas embebidas partía mal el header
`Authorization`). Lo único verificado con certeza es que la key legacy
tipo JWT (`anon`) funciona hoy contra el gateway de Functions de este
proyecto. `.env` conserva esa key legacy funcional — no se tocó en esta
sesión. La migración completa a `sb_publishable_...` (con una prueba
limpia, sin ese error) queda registrada como tarea de **Bloque 1E**, no
de este cierre. En ningún caso se envía una publishable key como
`Authorization: Bearer` — el `Authorization` de una petición autenticada
siempre lleva el JWT de sesión del usuario real; la publishable/anon key
va en el header `apikey`.

`verify_jwt` no se tocó en esta sesión (sigue `true` en ambas
funciones).

## 4. Verificación mínima post-rotación (esta sesión)

Con las funciones ya redesplegadas con la nueva secret key, se repitió
una verificación mínima (no las 14 pruebas completas de la sesión
anterior) con 4 usuarios sintéticos temporales
(`1D_TEST_OWNER2/OUTSIDER2/ANALYST2/ADMIN2`, creados vía Admin API con
la nueva secret key, contraseña aleatoria, eliminados al terminar):

| Prueba | Resultado |
|---|---|
| `ejecutar-calculo`: propietario sobre análisis propio | ✅ `200`, cálculo real |
| `ejecutar-calculo`: usuario ajeno | ✅ `404` genérico |
| `ejecutar-calculo`: analista | ✅ `200` |
| `ejecutar-calculo`: administrador | ✅ `200` |
| `continuar-tras-revision`: propietario (autoaprobación) | ✅ `403 "No autorizado."` |
| `continuar-tras-revision`: analista, revisión aprobada | ✅ `200`, `validacion_aprobada` |
| `continuar-tras-revision`: segundo intento (idempotencia) | ✅ `409 "Esta revisión ya fue procesada."` |
| `audit_events` de ambas funciones en esta sesión (7 eventos) | ✅ 0 con patrón de token/secreto |

Confirma que la migración de credencial no rompió ninguna regla de
autorización, RLS ni la idempotencia ya verificadas en la sesión
anterior.

## 5. Administrador real — NO configurado

**Bloqueado, sin promover ninguna cuenta.** Se inspeccionó `auth.users`
del proyecto vinculado (`esaf…rzqh`) de forma enmascarada:

```
select count(*) from auth.users;  →  0
```

**No existe ninguna cuenta** en el proyecto Supabase realmente vinculado
por la CLI — ni la del fundador ni ninguna otra. Por tanto no había
ninguna cuenta que inspeccionar ni promover, y no se creó ninguna
cuenta sintética permanente en su lugar.

**Hipótesis más probable, no confirmada**: este mismo repositorio tuvo
una confusión documentada de Project Ref (`docs/velarix/bloque-1d/REPORTE-ACTIVACION-1D.md`,
historial de commits — dos identificadores distintos convivían en
`supabase/config.toml`/`.env` vs. el vínculo real de la CLI). Es posible
que la cuenta del fundador se haya creado manualmente en el proyecto
Supabase **equivocado** (el antiguo, `inuj…eoyh`, que ya no existe en
esta cuenta de Supabase) en vez del proyecto real `esaf…rzqh`.

**Dato que falta para continuar**: confirmar en qué proyecto de Supabase
(revisando la URL del dashboard al momento de crear la cuenta) se creó
realmente el usuario del fundador. Si fue en `esaf…rzqh` y aun así no
aparece, puede haberse perdido o no haberse guardado — habría que
recrearlo ahí. Si se creó en otro proyecto, ese proyecto no es el que
usa este repositorio hoy.

## 6. Limpieza de esta sesión

Creados y eliminados en esta sesión: 4 usuarios Auth sintéticos
(`1D_TEST_OWNER2/OUTSIDER2/ANALYST2/ADMIN2`), 2 análisis, 1 revisión
manual, 5 homologaciones. Verificado tras la limpieza: `0` perfiles con
`company='1D_TEST_'`, `0` análisis, `0` revisiones.

Todos los archivos temporales (la nueva secret key, 4 contraseñas
aleatorias, 4 tokens de sesión) vivieron con permisos `600` fuera del
repositorio y se eliminaron al terminar; ninguno se imprimió en esta
respuesta ni en ningún archivo del repositorio.

## 7. Validaciones locales

`npm test -- --run`, `npx tsc --build --noEmit`, `npm run build`, `npm
run lint` — resultados en la respuesta final. Cambios de código de esta
sesión: `_shared/admin-key.ts` (nuevo), `ejecutar-calculo/index.ts` y
`continuar-tras-revision/index.ts` (migración de credencial), un
comentario en `_shared/authorization.ts` — ninguno afecta fórmulas
financieras, RLS, RPC ni migraciones.

## 8. Rollback disponible

`supabase/rollback/` documenta el rollback de la migración
`20260723090000_bloque_1d_bl10_role_protection.sql`. No se ejecutó
ningún rollback en esta sesión.

## 9. Acción manual pendiente (fuera del alcance de este reporte)

**Desactivar/rotar la legacy `service_role` key** desde el dashboard de
Supabase (Project Settings → API Keys, proyecto `esaf…rzqh`) — el código
ya no la usa, pero la key en sí sigue existiendo y siendo válida hasta
que alguien con acceso al dashboard la revoque manualmente. Esto no se
puede hacer desde la CLI ni desde este reporte.

## 10. Confirmación de entorno mock

Todos los datos usados en todas las sesiones de este bloque fueron
sintéticos, con prefijo `1D_TEST_` y correos de dominio `.local` —
ningún dato real de cliente fue creado, leído ni modificado.

## 11. Limitaciones reales restantes

- **No existe ningún administrador configurado** — bloqueante antes de
  1E o de cualquier piloto (sección 5).
- La legacy `service_role` key sigue activa en Supabase hasta que se
  revoque manualmente (sección 9).
- La migración completa del frontend a `sb_publishable_...` queda para
  1E (sección 3) — hoy usa la key legacy, que funciona pero no es el
  formato recomendado a futuro.
- `supabase/config.toml` conserva un `project_id` desactualizado
  (`inuj…eoyh`) sin efecto funcional — el vínculo real lo gestiona
  `supabase/.temp/` (`supabase link`), no ese archivo.
- Ningún otro entorno (staging/producción) tiene esta migración
  aplicada.
