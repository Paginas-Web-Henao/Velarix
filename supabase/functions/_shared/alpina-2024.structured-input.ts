// Velarix v5 — FASE 4F.4. Primer `structured_input` REAL, FY2024
// standalone, de Alpina Productos Alimenticios S.A.S. BIC. NO es un
// fixture sintético. Vive junto a `alpina-2024.resolved-assumptions.ts`
// en `_shared` (no en `src/`, no en el engine) por la misma razón: debe
// poder consumirse desde Vitest y desde el flujo real de Deno en 4F.5,
// separado de lógica universal y sin depender de Supabase.
//
// Origen de los números: Alpina Productos Alimenticios S.A.S. BIC —
// estados financieros separados FY2024 y notas auditadas/revisadas en
// Velarix 4B.1 (artefacto histórico no versionado dentro de este
// repositorio de código — ver la misma nota de trazabilidad honesta en
// `alpina-2024.resolved-assumptions.ts`). Valuation date: 2024-12-31.
// Basis of value: Market Value (IVS 102). Standalone parent operating
// DCF únicamente (`PARENT_DCF_PLUS_SOTP` — el SOTP es un análisis
// separado, fuera de alcance de este archivo).
//
// AUDITORÍA DE CONTRATO (4F.4, previa a construir este artifact) —
// resumen de lo verificado leyendo el código real, no un fixture:
//
// - El tipo que de verdad consumen `evaluateCalculationPreflight`
//   (`calculation-preflight.ts::PreflightIncomeStatement/
//   PreflightBalanceSheet`) y `runCanonicalFinancialEngine`
//   (`canonical-financial-engine.ts::CanonicalIncomeStatement/
//   CanonicalBalanceSheet/CanonicalStructuredInput`) es MÁS SIMPLE y
//   MÁS PEQUEÑO que el `CanonicalStructuredInput`/`buildCanonicalStructuredInput`
//   de `structured-input-builder.ts` (ese es el contrato v2.3 de
//   PERSISTENCIA de la ingesta documental real — homologación de cuentas,
//   snapshots de `external_snapshots`, provenance de documentos —, todo
//   respaldado por tablas de Supabase). Este archivo usa el tipo del
//   MOTOR (`canonical-financial-engine.ts`), no el del builder de
//   ingesta — es el tipo correcto para un caso con Evidence ya limpia y
//   auditada manualmente, sin pasar por el pipeline de homologación
//   documental, y es el único que no exige tocar Supabase.
// - `PreflightIncomeStatement`/`PreflightBalanceSheet` son subconjuntos
//   estructurales exactos de `CanonicalIncomeStatement`/
//   `CanonicalBalanceSheet` (mismos nombres de campo) — el mismo objeto
//   sirve, sin adaptación, para preflight (4F.4, este archivo) y para el
//   motor (4F.5, fuera de alcance aquí).
// - `resolveFinancialDebtTotal` (`capital-structure.ts`) lee
//   `financial_debt_total ?? total_debt ?? financial_debt ?? 0`
//   (`Math.abs` sobre el resultado) — es un campo GENÉRICO, no
//   "deuda bancaria estricta" por nombre. No existe en todo el código
//   (`_shared`/`src`, verificado por grep) ningún campo separado para
//   lease liabilities.
//
// EXECUTION MAPPING CHECK — LEASES (05 §10 ítem 13, condición disparada
// por evidencia real; NO nueva decisión metodológica, NO root-cause
// nuevo):
//
// A. Debt/WACC: en ejecución v5, los PESOS de capital structure vienen
//    EXCLUSIVAMENTE de `resolvedAssumptions.capitalStructure`
//    (comparables Damodaran) — `computeCapitalStructure` (rama v5)
//    IGNORA `financial_debt_total`/`equity` de Evidence para los weights
//    (verificado leyendo `capital-structure.ts`). El único consumo real
//    de `financial_debt_total` en v5 es `netDebt = totalDebt - cash` →
//    `equityValue = enterpriseValue - netDebt` (EV→Equity bridge) y el
//    término `interest = totalDebt × costOfDebt legacy` dentro de
//    `computeProjections` (línea contable de KPIs de escenario, NO FCFF/
//    EV/WACC — ver hallazgo aparte más abajo). Por tanto: usar
//    `financial_debt_total = 797,129,347` (bancaria+leases) es
//    económicamente correcto bajo `CAPITALIZED_LEASES` y NO genera doble
//    conteo (los weights de WACC no dependen de este campo en v5; nada
//    más en el código resta leases dos veces, porque no existe ningún
//    otro campo/consumo de "lease" en absoluto). Usar 653,189,423
//    (bancaria only) SÍ haría desaparecer 143,939,924 del bridge
//    EV→Equity — confirmado, no supuesto.
// B. D&A: el motor usa exclusivamente `depreciationDaDriver` (v5) para
//    la depreciación proyectada — nunca vuelve a sumar/leer ROU por
//    separado (no existe ningún código que lo haga). El 4.2% Judgment ya
//    está confirmado (ver `alpina-2024.resolved-assumptions.ts`) como
//    inclusivo de ROU depreciation vía el desglose FY2024 observado
//    (93,241,781 = PP&E 48,776,286 + ROU 31,731,724 + intangibles
//    12,733,771). Sin riesgo de doble conteo — es la única depreciación
//    que entra a `ebit`/`fcff`.
// C. Reinvestment/CAPEX: `capexReinvestmentDriver.explicitPath` se
//    consume literalmente como `capex` en `fcff = nopat + depreciation −
//    capex − deltaWC` (`canonical-financial-engine.ts::computeProjections`)
//    — un escalar genérico por año; el motor NO distingue si ese capex
//    es "solo PP&E/intangibles" o si además incorpora el componente de
//    reinvestment de leases (`ΔLeaseLiability`) que la convención
//    congelada exige junto con ROU depreciation. La Evidence/Judgment de
//    4D.2 que calibró el path (histórico ≈2.86% revenue → convergencia
//    g/ROC en Y5) NO documenta explícitamente si `ΔLeaseLiability` se
//    incorporó al calibrar esos 5 valores. Esto NO impide calcular un EV
//    standalone (el motor acepta el escalar tal cual, sin objeción
//    técnica) y NO bloquea el preflight (que no valida coherencia
//    económica entre CAPEX y D&A) — pero es una pieza del bridge/lease
//    detail que queda sin verificar independientemente, a resolver antes
//    de confiar en el FCFF/EV final de 4F.5 (posible sensibilidad o
//    reconciliación explícita, no un cambio de contrato ni de motor).
// D. EV→Equity: `netDebt = totalDebt − cash`, `equityValue =
//    max(enterpriseValue − netDebt, 0)` — un único campo de deuda
//    genérico, sin ninguna referencia a SOTP/leases por separado. SOTP
//    permanece completamente fuera de este bridge (no se importa ni se
//    referencia en `canonical-financial-engine.ts`).
//
// CLASIFICACIÓN: `CASE_MAPPING_LIMITATION`. El contrato ejecuta el EV
// standalone correctamente y de forma honesta con los campos existentes
// (A, B, D — soportados, verificados, sin doble conteo); el único punto
// que "queda fuera" es la reconciliación explícita de `ΔLeaseLiability`
// dentro del CAPEX Judgment ya congelado (C) — un detalle de caso a
// manejar antes de 4F.5/al interpretar el FCFF, no un `UNIVERSAL_
// EXECUTION_CONTRACT_GAP` (el motor/contrato no necesita cambiar) ni una
// nueva decisión metodológica (`CAPITALIZED_LEASES` ya está cerrado).
//
// HALLAZGO APARTE (no es un lease-mapping issue, descubierto durante la
// misma auditoría de consumo — documentado para 4F.5, sin tocar
// producción ahora): en `computeProjections`, la línea de "interest"
// proyectada por año (`totalDebt × costOfDebt`) usa SIEMPRE
// `CANONICAL_METHODOLOGY.assumptions.costOfDebtPct` LEGACY, nunca el
// `costOfDebt` v5 resuelto (11.79%) — incluso en ejecución v5 completa.
// Afecta únicamente `ebt`/`taxes`/`netIncome` DENTRO de `YearProjection`
// (detalle de P&L proyectado) — NO afecta FCFF, EV, WACC ni
// `kpis.interestCoverage`/`roe` del año base (esos usan el
// `interestExpense` HISTÓRICO real de Evidence, no esta línea). No se
// corrige aquí — está fuera del alcance de 4F.4 (preflight), es un
// hallazgo para tener presente al interpretar KPIs de escenario en 4F.5.
//
// Lo que este archivo NO transporta (deliberado):
// - `sector` y `expected_growth`: NO son campos de
//   `CanonicalStructuredInput` (motor) — son argumentos posicionales
//   separados de `runCanonicalFinancialEngine(input, sector,
//   expectedGrowth)`. `expected_growth` se documenta como constante
//   hermana (`ALPINA_2024_EXPECTED_GROWTH_PCT`, más abajo) porque ya está
//   cerrado (3.0% flat); `sector` NO se decide en este archivo — 4F.4 es
//   preflight únicamente, y `evaluateCalculationPreflight` no recibe
//   `sector` en absoluto.
// - `total_assets`/`total_liabilities` y el desglose de D&A: el tipo del
//   motor (`CanonicalBalanceSheet`) NO tiene campos para ellos (a
//   diferencia del `CanonicalBalanceSheet` de `structured-input-builder.ts`,
//   el contrato de persistencia de ingesta, que no se usa aquí). Se
//   preservan como `ALPINA_2024_EXTENDED_EVIDENCE` (más abajo),
//   exclusivamente para validación case-specific (item 9) — nunca
//   fabricados dentro de un campo que el schema real no tiene.
// - `taxes`/`net_income` del año base: campos opcionales del tipo, nunca
//   leídos por el motor ni exigidos por el preflight (verificado) — se
//   dejan `null` explícitamente en vez de fabricar un valor sin Evidence
//   para esta fase.
//
// Este archivo NO ha ejecutado todavía `runCanonicalFinancialEngine`
// (4F.5, fuera de alcance). Solo se usa contra `evaluateCalculationPreflight`.

import type { CanonicalStructuredInput } from "./canonical-financial-engine";
import { ALPINA_2024_RESOLVED_ASSUMPTIONS } from "./alpina-2024.resolved-assumptions";

export const ALPINA_2024_STRUCTURED_INPUT: CanonicalStructuredInput = {
  income_statement: {
    revenue: 2_098_376_569,
    cost_of_sales: 1_219_179_952,
    opex: 678_886_169,
    da: 93_241_781,
    interest_expense: 99_244_487,
    taxes: null,
    net_income: null,
  },
  balance_sheet: {
    cash: 49_548_598,
    equity: 175_759_391,
    // Bancaria (653,189,423) + leases (143,939,924) = 797,129,347 —
    // total debt-like económicamente correcto bajo CAPITALIZED_LEASES
    // (ver EXECUTION MAPPING CHECK, punto A, arriba).
    financial_debt_total: 797_129_347,
  },
  moneda_analisis: "COP",
  factor_conversion: 1,
  resolved_assumptions: ALPINA_2024_RESOLVED_ASSUMPTIONS,
};

/**
 * `expected_growth` cerrado para el caso (3.0% flat, 5 años) — NO es un
 * campo de `CanonicalStructuredInput` (ver cabecera). `resolveEffectiveGrowth`
 * (`canonical-input-normalization.ts`) espera el número tal cual (3, no
 * 0.03) y hace `expectedGrowth || 25` — con `3` (truthy) no activa el
 * fallback de 25. Verificado, no ejecutado contra el motor todavía.
 */
export const ALPINA_2024_EXPECTED_GROWTH_PCT = 3;

/**
 * Evidence FY2024 real que el tipo del motor (`CanonicalStructuredInput`)
 * no tiene dónde transportar — preservada aquí exclusivamente para
 * validación case-specific (item 9 de 4F.4), nunca fabricada dentro de
 * `ALPINA_2024_STRUCTURED_INPUT`. COP miles.
 */
export const ALPINA_2024_EXTENDED_EVIDENCE = {
  totalAssets: 1_431_184_168,
  totalLiabilities: 1_255_424_777,
  bankFinancialDebt: 653_189_423,
  leaseLiabilities: 143_939_924,
  daBreakdown: {
    ppeDepreciation: 48_776_286,
    rouDepreciation: 31_731_724,
    intangiblesAmortization: 12_733_771,
  },
};
