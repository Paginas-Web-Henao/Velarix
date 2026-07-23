# Pruebas — BL-02 (Consolidación de subcuentas)

Bloque 1B-P0. Bug corregido: `getAccountValue`/`getVal`/`getValue`
usaban `.find()` y tomaban solo la primera fila homologada con un
`canonical_account` dado, descartando el resto en silencio.

## Refactor mínimo de testabilidad

Extracción de la lógica pura a `supabase/functions/_shared/financial-accounts.ts`
(`sumAccountValue`, `hasAccountValue`) — sin imports de URL, sin
Supabase, sin `serve()`, sin variables de entorno. Los tres consumidores
reales ahora importan y usan esta misma función:

- `supabase/functions/build-structured-input/index.ts` — `getAccountValue` es ahora un delegado de 1 línea a `sumAccountValue`.
- `supabase/functions/validate-analysis/index.ts` — `getVal`/`hasAccount` delegan a `sumAccountValue`/`hasAccountValue`.
- `supabase/functions/continuar-tras-revision/index.ts` — el `getValue` inline ahora delega a `sumAccountValue`.

## Archivo de prueba

`supabase/functions/_shared/financial-accounts.test.ts`

## Comando y resultado

```
$ npx vitest run supabase/functions/_shared/financial-accounts.test.ts

 Test Files  1 passed (1)
      Tests  11 passed (11)
```

## Los 8 escenarios mínimos exigidos (más 3 adicionales)

| # | Escenario | Resultado |
|---|---|---|
| 1 | Una sola cuenta | Pasa — devuelve el valor tal cual |
| 2 | Dos subcuentas de caja (mismo período) | Pasa — se suman (antes: solo la primera) |
| 3 | Tres subcuentas de gastos | Pasa — se suman las 3 |
| 4 | Valores `null` | Pasa — se ignoran, no rompen la suma ni cuentan como 0 |
| 5 | Períodos diferentes | Pasa — nunca se mezclan entre sí (aislamiento por período verificado explícitamente) |
| 6 | Cuenta inexistente | Pasa — devuelve `null`, no `0` |
| 7 | Valor negativo sujeto a normalización | Pasa — `cash` se normaliza a valor absoluto sobre el total |
| 8 | Prevención de doble conteo | Pasa — el `Math.abs()` se aplica una sola vez, sobre el total ya sumado, no por fila |
| — | No usa `.find()`: 5 subcuentas suman las 5 | Pasa |
| — | Ignora valores no numéricos (string no parseable) | Pasa |
| — | `hasAccountValue` para cuenta inexistente | Pasa — `false` |

## Antes / después (evidencia concreta)

```ts
// ANTES (build-structured-input/index.ts, hasta Bloque 1A)
function getAccountValue(accounts, canonical) {
  const match = accounts.find(a => a.canonical_account === canonical && a.value != null);
  if (!match) return null;
  return Number(match.value);
}
// Con 2 filas "cash" (Banco Bogotá 50M, Banco Davivienda 30M): devuelve 50_000_000

// DESPUÉS (_shared/financial-accounts.ts, usado por los 3 consumidores)
sumAccountValue(accounts, "cash") // => 80_000_000
```

## Regresión

`npm test -- --run` completo: 59 pruebas pasan, 0 fallos, 0 regresiones
en el resto de la suite (financial-engine, pdf-generator, currency,
capital-structure, pipeline-guards).
