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
//    — un escalar genérico por año; el motor no distingue internamente
//    PP&E/intangibles/lease reinvestment, solo suma el agregado. Lineage
//    recuperado del contexto histórico (4D.1 → 4E.1), que corrige la
//    conclusión anterior de este archivo:
//      4D.1 (Method B, histórico) — economic CAPEX = PP&E cash +
//      intangibles cash + lease reinvestment (`ROU depreciation +
//      ΔLeaseLiability`, NO ROU additions): FY2024 28,695,000 +
//      955,946 + 27,308,257 = 56,959,203 (2.714% revenue); FY2023
//      20,553,855 + 2,246,827 + 42,625,027 = 65,425,709 (3.001%
//      revenue) → promedio ponderado ≈2.86% revenue, YA inclusivo de
//      lease reinvestment por construcción — las ROU additions
//      quedaron solo como accounting cross-check, nunca la definición
//      usada.
//      4E.1 (interpolación) — desde ese ancla histórica 2.86% hasta
//      4.9204% revenue en Y5 (requerido para cumplir Net
//      Reinvestment/NOPAT = g/ROC con g=3%, ROC=24%, tras corregir el
//      margen EBITDA FY2024 ejecutable a ≈13.9895%) → el path final
//      (70,718,655 / 82,003,940 / 93,921,384 / 106,470,072 /
//      119,695,825).
//    Por tanto el path explícito ES el aggregate economic reinvestment
//    (PP&E + intangibles + lease reinvestment) por construcción de su
//    propio ancla histórica — no un CAPEX PP&E-only al que le falte
//    reconciliar `ΔLeaseLiability` por separado. Limitación únicamente
//    de PRESENTACIÓN: el motor no descompone prospectivamente el
//    agregado entre PP&E/intangibles/lease reinvestment año a año — eso
//    no distorsiona ni impide el FCFF mientras el escalar agregado
//    permanezca económicamente consistente, que es el caso aquí.
// D. EV→Equity: `netDebt = totalDebt − cash` (797,129,347 − 49,548,598),
//    `equityValue = max(enterpriseValue − netDebt, 0)` — un único campo
//    de deuda genérico, sin ninguna referencia a SOTP/leases por
//    separado. SOTP permanece completamente fuera de este bridge (no se
//    importa ni se referencia en `canonical-financial-engine.ts`).
//
// CLASIFICACIÓN: `MAPPING_SUPPORTED`. El contrato representa
// `CAPITALIZED_LEASES` honestamente con los campos existentes en las
// cuatro dimensiones (A, B, C, D) — verificado por consumo real, no por
// nombre de campo — sin pérdida material ni doble conteo. No hay ninguna
// pieza del bridge/lease detail pendiente de reconciliar antes de 4F.5.
//
// HALLAZGO APARTE (no es un lease-mapping issue, descubierto durante la
// misma auditoría de consumo — documentado para 4F.5/4F.6, sin tocar
// producción todavía): en `computeProjections`, la línea de "interest"
// proyectada por año (`totalDebt × costOfDebt`) usa SIEMPRE
// `CANONICAL_METHODOLOGY.assumptions.costOfDebtPct` LEGACY, nunca el
// `costOfDebt` v5 resuelto (11.79%) — incluso en ejecución v5 completa.
// Clasificación provisional: `UNIVERSAL_NON_DCF_OUTPUT_MISMATCH` — no
// afecta FCFF, WACC, TV ni EV, ni el `interestCoverage`/`roe` del año
// base (esos usan el `interestExpense` HISTÓRICO real de Evidence, no
// esta línea); SÍ afecta el P&L proyectado auxiliar
// (`ebt`/`taxes`/`netIncome` dentro de `YearProjection`). No bloquea la
// primera ejecución DCF de 4F.5 — debe revisarse en 4F.6 (Output Audit)
// antes de declarar cerrado todo el output del motor. No se corrige
// aquí ni en 4F.4/4F.5.
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
// - `total_liabilities` y el desglose de D&A: el tipo del motor
//   (`CanonicalBalanceSheet`) NO tiene campos para ellos (a diferencia
//   del `CanonicalBalanceSheet` de `structured-input-builder.ts`, el
//   contrato de persistencia de ingesta, que no se usa aquí). Se
//   preservan como `ALPINA_2024_EXTENDED_EVIDENCE` (más abajo),
//   exclusivamente para validación case-specific — nunca fabricados
//   dentro de un campo que el schema real no tiene. `total_assets` YA
//   NO está en esta lista — desde 4F.6D2, `CanonicalBalanceSheet` sí lo
//   declara y `ALPINA_2024_STRUCTURED_INPUT.balance_sheet.total_assets`
//   lo transporta (única fuente del dato en este archivo).
// - `taxes` del año base: campo opcional del tipo, nunca leído por el
//   motor ni exigido por el preflight (verificado) — se deja `null`
//   explícitamente en vez de fabricar un valor sin Evidence para esta
//   fase. `net_income` YA NO está en esta lista — desde 4F.6D2 (RC-KPI-
//   NetIncome), `netMargin`/`ROE`/`ROA` en v5 lo consumen directamente
//   (Decisión 7 ya aprobada por el fundador) y
//   `ALPINA_2024_STRUCTURED_INPUT.income_statement.net_income` lo
//   transporta con la Evidence real observada. `taxes` sigue sin
//   consumidor v5 — se deja `null`, no se fabrica.
//
// Este archivo YA ejecutó `runCanonicalFinancialEngine` (4F.5/4F.6) —
// también se usa contra `evaluateCalculationPreflight`.

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
    // 4F.6D2 (RC-KPI-NetIncome) — "Utilidad neta del año" observada en
    // los estados financieros separados FY2024 de Alpina. En v5,
    // netMargin/ROE consumen este valor directamente (04 §1 Evidence,
    // Decisión 7 ya aprobada) — nunca el netIncome0 sintético legacy
    // (EBIT−interés×(1−tax)).
    net_income: 100_521_166,
  },
  balance_sheet: {
    cash: 49_548_598,
    equity: 175_759_391,
    // Bancaria (653,189,423) + leases (143,939,924) = 797,129,347 —
    // total debt-like económicamente correcto bajo CAPITALIZED_LEASES
    // (ver EXECUTION MAPPING CHECK, punto A, arriba).
    financial_debt_total: 797_129_347,
    // 4F.6D2 (RC-KPI-Assets) — Total Assets observado, Evidence FY2024
    // standalone. En v5, ROA consume este valor directamente — nunca el
    // proxy totalDebt+equity. Única fuente de este dato en el archivo —
    // ver nota sobre `ALPINA_2024_EXTENDED_EVIDENCE` más abajo (ya no
    // duplica este número).
    total_assets: 1_431_184_168,
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
  // totalAssets vive en `ALPINA_2024_STRUCTURED_INPUT.balance_sheet.total_assets`
  // (4F.6D2, RC-KPI-Assets) — no se duplica aquí para evitar dos
  // literales independientes que puedan divergir. `totalLiabilities`
  // permanece solo aquí (el motor no lo consume) para el chequeo
  // assets≈liabilities+equity del test de Evidence.
  totalLiabilities: 1_255_424_777,
  bankFinancialDebt: 653_189_423,
  leaseLiabilities: 143_939_924,
  daBreakdown: {
    ppeDepreciation: 48_776_286,
    rouDepreciation: 31_731_724,
    intangiblesAmortization: 12_733_771,
  },
};
