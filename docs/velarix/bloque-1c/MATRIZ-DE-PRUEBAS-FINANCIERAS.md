# Matriz de pruebas financieras — Bloque 1C-Prep

Mapea los 16 escenarios mínimos exigidos contra las pruebas reales.
**Corrección de lenguaje (cierre técnico, 2026-07-23)**: `runAnalysis`
(motor cliente) es una **referencia**, no el motor canónico. El motor
canónico es `runCanonicalFinancialEngine`
(`supabase/functions/_shared/canonical-financial-engine.ts`), extraído
en este cierre técnico y ahora con sus propias regresiones numéricas
reales (`canonical-financial-engine.golden-cases.test.ts`) — ver tabla
abajo. Todas las pruebas importan la función/objeto real que usa
producción, nunca una copia de sus fórmulas. Las comparaciones de
identidad (FCFF, descuento a valor presente, EV, equity value) verifican
consistencia **entre los propios campos de salida** de la función real,
no reimplementan la fórmula desde los inputs.

| # | Escenario | Archivo de prueba | Función real importada | Resultado |
|---|---|---|---|---|
| 1 | Identidad financiera básica | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 2 | Pesos de deuda y patrimonio | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 3 | WACC | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 4 | Flujo de caja libre | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 5 | Valor terminal | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (Caso A) |
| 6 | Descuento a valor presente | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (Caso A) |
| 7 | Enterprise value | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 8 | Equity value | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 9 | Deuda neta | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 10 | Sensibilidad a WACC | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 11 | Sensibilidad a crecimiento perpetuo | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (Caso A) |
| 12 | Manejo de EBITDA negativo | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (Caso C) |
| 13 | Patrimonio negativo | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (Caso C) |
| 14 | Datos insuficientes (`revenue=0`) | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Ver nota — 1 `test.fails()` + 1 evidencia |
| 15 | Prevención de NaN e Infinity | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Ver nota — mismo par de pruebas que #14 |
| 16 | Consistencia del contrato de supuestos | `financial-methodology.test.ts` | `CANONICAL_METHODOLOGY` | Pasa (8 pruebas) |

**Regresiones numéricas del motor canónico (servidor)** — no formaban
parte de los 16 escenarios mínimos originales (que apuntaban al cliente
por ser el único importable en ese momento), agregadas en este cierre
técnico ahora que el servidor es importable:

| Escenario | Archivo de prueba | Función real importada | Resultado |
|---|---|---|---|
| WACC, beta, costos de capital (tolerancia 0.01pp) | `canonical-financial-engine.golden-cases.test.ts` | `runCanonicalFinancialEngine` | Pasa (3 casos) |
| Enterprise Value, Equity Value, Net Debt (tolerancia 0.1%/1000) | `canonical-financial-engine.golden-cases.test.ts` | `runCanonicalFinancialEngine` | Pasa (3 casos) |
| Valor terminal y FCFF Y1/Y5 (tolerancia 0.1%/1000) | `canonical-financial-engine.golden-cases.test.ts` | `runCanonicalFinancialEngine` | Pasa (3 casos) |
| `waccWarning` (igualdad exacta) | `canonical-financial-engine.golden-cases.test.ts` | `runCanonicalFinancialEngine` | Pasa (3 casos) |
| Identidades (equity value, FCFF) | `canonical-financial-engine.golden-cases.test.ts` | `runCanonicalFinancialEngine` | Pasa (3 casos + identidades) |
| `revenue=0` sigue rechazado por el servidor | `canonical-financial-engine.golden-cases.test.ts` | `runCanonicalFinancialEngine` | Pasa (comportamiento conservado, no decidido de nuevo) |

## Nota sobre los escenarios 14 y 15 (mismo hallazgo, dos ángulos)

`revenue = 0` **no** produce `NaN`/`Infinity` en `enterpriseValue`/`wacc`
(quedan en `0`, un resultado finito pero silenciosamente engañoso). Sí
produce `Infinity`/`NaN` en los márgenes históricos (`grossMargin`,
`ebitdaMargin`, `ebitMargin`, `netMargin`), que dividen directamente por
`inputs.revenue` sin ningún clamp. Dos pruebas registran esto:

1. `test.fails(...)` — especificación de que ningún margen debería ser
   no-finito ante `revenue=0`. Falla hoy (esperado), documentando el gap
   sin decidir silenciosamente cuál es el comportamiento correcto (ver
   decisión pendiente #10 en `DECISIONES-FINANCIERAS-PENDIENTES.md`).
2. Prueba normal — confirma que al menos un margen es no-finito hoy, y
   que `enterpriseValue` es exactamente `0` (evidencia del
   comportamiento actual, no un criterio de corrección).

## Comandos y resultados

```
$ npx vitest run src/lib/financial-engine.golden-cases.test.ts

 Test Files  1 passed (1)
      Tests  30 passed | 1 expected fail (31)

$ npx vitest run supabase/functions/_shared/financial-methodology.test.ts

 Test Files  1 passed (1)
      Tests  8 passed (8)

$ npx vitest run supabase/functions/_shared/canonical-financial-engine.golden-cases.test.ts

 Test Files  1 passed (1)
      Tests  19 passed (19)
```

## Qué se resolvió en el cierre técnico (2026-07-23)

El motor **servidor** (antes `ejecutar-calculo/index.ts::runEngine`, no
importable en Vitest) fue extraído a
`supabase/functions/_shared/canonical-financial-engine.ts`
(`runCanonicalFinancialEngine`) — sin imports de URL/Supabase/Deno, sí
importable. Las 19 pruebas nuevas son regresiones numéricas reales sobre
el motor canónico, no solo verificación por lectura de código. La
limitación de importabilidad que existía desde Bloque 1A/1B-P0 queda
resuelta para el motor de cálculo — `ejecutar-calculo/index.ts` importa y
usa `runCanonicalFinancialEngine` realmente, sin segunda copia.

## Qué sigue sin probarse (limitación restante)

El resto de la Edge Function `ejecutar-calculo/index.ts` (autenticación,
autorización, lectura/escritura en Supabase, manejo de `serve()`) sigue
sin poder ejecutarse en Vitest — mismo bloqueo ambiental de Deno
documentado desde Bloque 1A. Solo el motor de cálculo puro se volvió
testable, no la Edge Function completa.
