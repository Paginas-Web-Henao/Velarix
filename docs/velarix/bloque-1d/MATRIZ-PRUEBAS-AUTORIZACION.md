# Matriz de pruebas de autorización — Bloque 1D-P0

Mapeo de los 12 escenarios mínimos exigidos por el Bloque 1D contra las
pruebas reales en `supabase/functions/_shared/authorization.test.ts` (24
pruebas totales — 12 mínimas + 12 adicionales de robustez).

| # | Escenario | Función probada | Prueba | Resultado |
|---|---|---|---|---|
| 1 | Sin autenticación | `canExecuteCalculation` | "1. sin autenticación (actor null, sin header): rechazado 401" | Pasa — 401 |
| 2 | Solo anon key | `canExecuteCalculation` | "2. solo anon key (auth.getUser no resuelve -> actor null...)" | Pasa — mismo código que #1, por diseño (ver nota abajo) |
| 3 | Usuario ajeno al análisis | `canExecuteCalculation` | "3. usuario ajeno al análisis: rechazado, sin revelar si el análisis existe" | Pasa — 404 |
| 4 | Cliente propietario ejecutando su propio cálculo | `canExecuteCalculation` | "4. cliente propietario ejecutando su propio cálculo: permitido" | Pasa — permitido |
| 5 | Cliente propietario intentando continuar/aprobar | `canContinueAfterReview` | "5. cliente propietario intentando continuar/aprobar su propia revisión: rechazado" | Pasa — 403, `owner_self_approval_blocked` |
| 6 | Cliente intentando cambiar su rol | `canChangeRole` | "6. cliente intentando cambiar su propio rol: rechazado (no es admin)" | Pasa — 403 |
| 7 | Analista autorizado | `canExecuteCalculation` + `canContinueAfterReview` | "7. analista autorizado..." (ambos describe blocks) | Pasa — permitido en ambas funciones |
| 8 | Administrador autorizado | `canExecuteCalculation` + `canContinueAfterReview` | "8. administrador autorizado: permitido" (ambos) | Pasa — permitido en ambas funciones |
| 9 | Invocación interna válida | `canExecuteCalculation` + `canContinueAfterReview` + `isInternalServiceCall` | "9. invocación interna válida..." (ambos) + suite de `isInternalServiceCall` | Pasa — permitido; y confirmado que un campo público `{internal:true}` NO cuenta como interno |
| 10 | Acceso cruzado sin filtración de información sensible | `canExecuteCalculation` | "10. acceso cruzado sin filtración: 'ajeno' y 'no existe' devuelven el mismo status y el mismo mensaje" | Pasa — mismo `httpStatus` (404) y mismo `publicMessage` para ambos casos |
| 11 | Revisión en estado inválido | `canContinueAfterReview` | "11. revisión en estado inválido (pendiente): rechazado incluso para un analista" | Pasa — 403, `invalid_review_state` |
| 12 | Segundo intento de continuar una revisión ya procesada | `canContinueAfterReview` | "12. segundo intento de continuar una revisión ya procesada: rechazado (409, idempotencia)" | Pasa — 409, `already_continued` |

## Nota sobre los escenarios 1 y 2

Desde la perspectiva del módulo puro, "sin autenticación" y "solo anon
key" producen el mismo `actor: null` — la Edge Function llama
`anonClient.auth.getUser(token)` en ambos casos (sin header no se llega
siquiera a intentarlo; con la anon key como token, `auth.getUser`
simplemente no resuelve a un usuario real). La distinción real está en
la integración (qué token llega), no en la lógica de autorización — que
correctamente trata ambos como "no hay identidad verificada". Esto es
intencional, no una omisión.

## Pruebas adicionales (más allá del mínimo)

- Usuario ajeno (no propietario, no analista) intentando continuar una
  revisión: rechazado (`not_privileged`).
- Sin autenticación en `canContinueAfterReview`: rechazado 401 antes de
  evaluar el estado de la revisión (orden de verificación correcto).
- Un admin no puede cambiar su propio rol por esta vía
  (`self_role_change_blocked`) — más estricto que el mínimo exigido (que
  solo pedía bloquear al cliente).
- Rol destino inválido (`newRole` fuera de `user`/`analyst`/`admin`):
  rechazado incluso si el actor es admin.
- `isInternalServiceCall`: header ausente, secreto ausente, o valor que
  no coincide exactamente — todos `false`, nunca `true` por omisión.

## Cobertura no ejecutable en este entorno (transparencia)

Las Edge Functions reales (`ejecutar-calculo/index.ts`,
`continuar-tras-revision/index.ts`) no se pueden importar ni ejecutar
end-to-end en Vitest: mismo bloqueo documentado desde Bloque 1A (Deno no
instalado, imports de URL, `serve()` de nivel superior). Lo que **no**
se verificó con una prueba ejecutable real en este bloque:

- Que `auth.getUser()` efectivamente rechace un anon key real contra un
  proyecto Supabase real (requiere una instancia real, no solo la lógica
  pura).
- Que las políticas RLS de la migración SQL de BL-10 (`manual_reviews`,
  el trigger de `profiles`) se comporten como se espera contra un
  Postgres real — la migración fue revisada línea por línea pero no
  ejecutada (ni localmente ni remoto), según lo autorizado.
- El comportamiento de `admin_set_user_role` bajo concurrencia real.

Estas verificaciones quedan pendientes para cuando exista un entorno con
Deno y/o una instancia de Supabase disponible para pruebas — no se
declaran como "probadas" en este documento.

## Comando y resultado

```
$ npx vitest run supabase/functions/_shared/authorization.test.ts

 Test Files  1 passed (1)
      Tests  24 passed (24)
```

---

## Pruebas reales post-migración (10 escenarios exigidos en la finalización operativa)

Estas son pruebas **reales** contra una base de datos Supabase real —
distintas de las 24 pruebas puras de arriba (que corren en Vitest sin
ninguna base de datos). Todas quedan registradas como **no ejecutable —
bloqueo de entorno**, no como "pasando" ni "fallando": la migración
(`20260723090000_bloque_1d_bl10_role_protection.sql`) no se pudo aplicar
en esta sesión (Supabase CLI, `psql` y Docker no disponibles; sin
`SUPABASE_SERVICE_ROLE_KEY` ni cadena de conexión local — ver
`REPORTE-IMPLEMENTACION-1D-P0.md` §12.3), así que ninguna de estas
pruebas tiene una base real contra la cual ejecutarse todavía.

| # | Escenario | Estado |
|---|---|---|
| 1 | Usuario normal intenta cambiar su propio `role` directamente | No ejecutable — bloqueo de entorno |
| 2 | Usuario normal llama `admin_set_user_role` (debe retornar rechazo estructurado, no modificar nada) | No ejecutable — bloqueo de entorno |
| 3 | Admin intenta cambiar su propio rol (debe ser rechazado) | No ejecutable — bloqueo de entorno |
| 4 | Admin cambia el rol de otro usuario (debe permitirse y auditarse) | No ejecutable — bloqueo de entorno; además depende de tener una segunda cuenta real (ver §12.5 del reporte) |
| 5 | Propietario de análisis intenta actualizar su revisión a `aprobado` directamente | No ejecutable — bloqueo de entorno |
| 6 | Analista/admin puede consultar revisiones | No ejecutable — bloqueo de entorno |
| 7 | Analista/admin puede actualizar una revisión válida | No ejecutable — bloqueo de entorno |
| 8 | Propietario puede consultar su propia revisión | No ejecutable — bloqueo de entorno |
| 9 | Propietario puede crear una solicitud de revisión propia | No ejecutable — bloqueo de entorno |
| 10 | Ningún rechazo expone secretos | No ejecutable — bloqueo de entorno; verificado de forma estática leyendo el SQL (ningún `RAISE`/`INSERT` de este archivo incluye tokens, claves o headers) |

**Ninguna de estas 10 se declara "pasando" en este documento.** Quedan
pendientes para cuando exista acceso real a un proyecto Supabase de
desarrollo confirmado como no productivo.
