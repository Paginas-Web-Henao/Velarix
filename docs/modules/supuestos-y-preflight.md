---
tipo: modulo
capa: judgment
estado_v5: KEEP
actualizado: 2026-10-15
tags: [velarix, modulo, supuestos]
---

# Supuestos resueltos y preflight

Índice: [[03-modulos]]

## Qué es
Contrato tipado de los **13 supuestos resueltos** (Judgment) y el gate que exige su presencia y coherencia antes de invocar el [[motor-canonico]].

## Los 13 supuestos (`REQUIRED_RESOLVED_ASSUMPTION_KEYS`)
`taxTreatment`, `capitalStructure`, `riskFreeRateConstruction`, `matureErp`, `countryRiskPremium`, `countryRiskLambda`, `betaTreatment`, `costOfDebt`, `capexReinvestmentDriver`, `depreciationDaDriver`, `workingCapitalDriver`, `terminalG`, `projectionHorizonYears`.

`expected_growth` **no** es uno de ellos: es parámetro propio del motor.

Primer conjunto real de supuestos: [[caso-alpina]] (`alpina-2024.resolved-assumptions.ts`). Principios que los gobiernan: [[04-VALUATION-METHODOLOGY-V5]] §6–§11.

## Archivos
- `supabase/functions/_shared/resolved-calculation-assumptions.ts` — tipos y claves requeridas; `MOTOR_SUPPORTED_PROJECTION_HORIZON_YEARS = 5`.
- `_shared/calculation-preflight.ts` — `evaluateCalculationPreflight`. Bloquea con 409 en `ejecutar-calculo` si falta algo.
- `_shared/resolved-calculation-assumptions.fixtures.ts` — `SYNTHETIC_TEST_FIXTURE` (solo tests).

## Decisiones
[[ADR-005-lambda-juicio-directo]] · RC-3 en [[05-financial-engine-audit]] §5–§6.

## Tests
`calculation-preflight*.test.ts`, `resolved-calculation-assumptions.test.ts`.
