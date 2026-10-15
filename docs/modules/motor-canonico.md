---
tipo: modulo
capa: calculation
estado_v5: KEEP
actualizado: 2026-10-15
tags: [velarix, modulo, motor]
---

# Motor canónico

Índice: [[03-modulos]] · Flujo: [[04-flujos]] §2

## Qué es
Motor DCF/FCFF del servidor y **fuente de verdad del cálculo** (decisión D-06). Ejecuta; no decide, no interpreta, no aprueba ([[04-VALUATION-METHODOLOGY-V5]] §17).

## Archivos
- `supabase/functions/_shared/canonical-financial-engine.ts` — `runCanonicalFinancialEngine(structuredInput, sector, expectedGrowth)`; tipos `CanonicalStructuredInput`, `YearProjection`, `ScenarioResult`, `CanonicalKPIs`, `CanonicalValuation`.
- `_shared/capital-structure.ts` — `computeCapitalStructure`, `resolveFinancialDebtTotal`. Con `resolved_assumptions` usa solo los componentes resueltos; sin ellos, rama legacy (incluye fallback 70/30).
- `_shared/canonical-input-normalization.ts` — normalización de input (RC-1: ya no aplica `Math.abs()` sobre equity).
- `_shared/financial-methodology.ts` — `CANONICAL_METHODOLOGY` versionada.
- `_shared/structured-input-*.ts`, `currency.ts`, `period-resolution.ts`, `financial-accounts.ts` — construcción del input.
- Edge Function: `supabase/functions/ejecutar-calculo/index.ts`.

## Dependencias
[[supuestos-y-preflight]] (entrada de Judgment) · [[expediente]] (gate) · [[reproducibilidad]] (envelope de salida). Primer caso real que lo ejecuta: [[caso-alpina]].

## Tests
`canonical-financial-engine.golden-cases.test.ts`, `canonical-financial-engine.consumption.v5.test.ts`, `capital-structure*.test.ts`, `roe-negative-equity.v5.test.ts`, `working-capital.v5.test.ts`. Ver [[13-testing]].

## Limitaciones
Horizonte fijo 5 años; sin stub period; year-end. Ver [[12-bugs]].

## Documentos
[[05-financial-engine-audit]] · [[04-VALUATION-METHODOLOGY-V5]] · [[BL-26-tabla-comparativa-motores]]
