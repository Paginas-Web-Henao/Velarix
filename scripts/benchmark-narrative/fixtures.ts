// Fixtures sintéticos para el benchmark narrativo Anthropic vs OpenAI.
// Módulo puro — sin red, sin SDKs, sin motor financiero: los números de
// cada fixture están ESCRITOS A MANO como constantes, nunca producidos
// EJECUTANDO `canonical-financial-engine.ts` (no hay I/O ni invocación del
// motor en este archivo). Sí se aplican a mano, para cada fixture, las
// IDENTIDADES/FÓRMULAS ya existentes y verificadas contra ese motor —
// nunca una segunda metodología inventada:
//   ebitda0 = revenue - cost_of_sales - opex + da
//   ebit0 = ebitda0 - da
//   netIncome0 = (ebit0 - interest_expense) * (1 - taxRatePct/100)  [taxRatePct=30, CANONICAL_METHODOLOGY]
//   totalAssets(engine) = financial_debt_total + equity  (denominador de ROA — distinto del balance_sheet.total_assets del snapshot)
//   netDebt = financial_debt_total - cash
//   grossMargin/ebitdaMargin/ebitMargin/netMargin/roe/roa/leverage/interestCoverage: ver canonical-financial-engine.ts líneas 264-272
//   EV ≈ Σ discountedFcf + discountedTV (identidad DCF, sanity check — WACC/DCF no se recalculan aquí)
// Cada bloque `kpis:` documenta inline el cálculo exacto usado.
//
// Ninguna empresa real, ningún cliente real, ningún documento real —
//3 casos 100% sintéticos, con la misma forma que `PersistedCalculationResult`
// (schema 1.1.0), tomando como referencia estructural el fixture ya
// existente en
// `supabase/functions/_shared/narrative-calculation-adapter.test.ts::buildFixture()`.
//
// Se reutiliza el TIPO real `PersistedCalculationResult` (importado, no
// duplicado) para que cualquier cambio de forma del contrato canónico
// rompa la compilación de este archivo — visibilidad temprana de drift.

import type { PersistedCalculationResult } from "../../supabase/functions/_shared/narrative-calculation-adapter.ts";
import { buildCalculationVersionInfo } from "../../supabase/functions/_shared/calculation-versioning.ts";
import { resolveEffectiveSectorBenchmark } from "../../supabase/functions/_shared/canonical-input-normalization.ts";
import type { FixtureId } from "./types.ts";

// Los 3 sectores usan claves REALES de `SECTOR_BENCHMARKS`
// (_shared/canonical-input-normalization.ts) — no nombres inventados. Cada
// `sectorBenchmark` del fixture se construye llamando a
// `resolveEffectiveSectorBenchmark(sector)` (la función REAL, importada, no
// duplicada) sobre la MISMA constante que después se asigna a
// `source_input_snapshot.sector`, así ambos SIEMPRE coinciden por
// construcción — ver fixture-invariants.test.ts para el test de drift que
// lo confirma independientemente. Ninguno de los 3 depende del fallback
// ("Software / Tecnología"): las 3 claves existen explícitamente en el mapa.
const CASE_A_SECTOR = "Servicios empresariales";
const CASE_B_SECTOR = "Manufactura";
const CASE_C_SECTOR = "Retail / Comercio";

/** Bundle narrativo sintético para la tarea `narrative_audit` — NO depende de haber ejecutado las otras 4 llamadas (ver instrucción del paso: "no dependas de haber ejecutado las otras 4"). Cuatro variantes deterministas para poder probar detección de flags específicos en scoring.ts. */
export interface AuditNarrativeBundleVariants {
  /** Narrativa consistente con el ground truth — no debería disparar ningún flag crítico. */
  clean: string;
  /** Contiene una cifra que NO existe en ningún dato entregado al task. */
  invented_number: string;
  /** Afirma un signo/magnitud que contradice directamente un KPI del ground truth. */
  contradicts_calculation: string;
  /** Cita una fuente/comparable externo que nunca fue entregado en los datos. */
  invented_source: string;
  /** Afirmación causal específica (mala gestión/fraude/etc.) que los datos numéricos no sustentan. */
  unsupported_claim: string;
}

export interface NarrativeFixture {
  id: FixtureId;
  description: string;
  companyName: string;
  calculationResult: PersistedCalculationResult;
  auditNarrativeBundle: AuditNarrativeBundleVariants;
}

// `version` se construye con la función REAL de producción
// (`buildCalculationVersionInfo`, `_shared/calculation-versioning.ts`) en
// vez de escribir a mano `assumptions_snapshot` — así los 8 supuestos
// (taxRatePct, capexPctOfRevenue, workingCapitalPctOfRevenue,
// terminalGrowthPct, costOfDebtPct, riskFreeRatePct,
// equityRiskPremiumPct, depreciationPctOfRevenue) siempre coinciden
// exactamente con `CANONICAL_METHODOLOGY` real, sin duplicar valores a
// mano ni arriesgar un envelope estructuralmente más delgado que uno real
// de schema 1.1.0. `generate-narrative` no consume este detalle
// (`buildCalculationMeta` no lo proyecta), pero el fixture lo trae
// completo de todas formas porque reutilizarlo es más simple y más fiel
// que documentar una limitación.

// ═══════════════════════════════════════════════════════════════
// CASE_A_MODERATE — sano/moderado
// EBITDA positivo, net margin positivo, leverage moderado, interest
// coverage saludable, EV positivo, sensibilidad no extrema, benchmark
// sectorial disponible, historical completo (sin nulls).
// ═══════════════════════════════════════════════════════════════

const CASE_A_CALCULATION_RESULT: PersistedCalculationResult = {
  projections: [
    { year: 1, revenue: 4_500_000, costOfSales: 1_890_000, grossProfit: 2_610_000, ebitda: 945_000, depreciation: 180_000, ebit: 765_000, interest: 99_000, ebt: 666_000, taxes: 199_800, netIncome: 466_200, nopat: 535_500, capex: 225_000, deltaWC: 90_000, fcff: 400_500, discountedFcf: 363_760 },
    { year: 2, revenue: 4_800_000, costOfSales: 2_016_000, grossProfit: 2_784_000, ebitda: 1_008_000, depreciation: 192_000, ebit: 816_000, interest: 99_000, ebt: 717_000, taxes: 215_100, netIncome: 501_900, nopat: 571_200, capex: 240_000, deltaWC: 96_000, fcff: 427_200, discountedFcf: 352_417 },
    { year: 3, revenue: 5_100_000, costOfSales: 2_142_000, grossProfit: 2_958_000, ebitda: 1_071_000, depreciation: 204_000, ebit: 867_000, interest: 99_000, ebt: 768_000, taxes: 230_400, netIncome: 537_600, nopat: 606_900, capex: 255_000, deltaWC: 102_000, fcff: 453_900, discountedFcf: 340_093 },
    { year: 4, revenue: 5_400_000, costOfSales: 2_268_000, grossProfit: 3_132_000, ebitda: 1_134_000, depreciation: 216_000, ebit: 918_000, interest: 99_000, ebt: 819_000, taxes: 245_700, netIncome: 573_300, nopat: 642_600, capex: 270_000, deltaWC: 108_000, fcff: 480_600, discountedFcf: 327_065 },
    { year: 5, revenue: 5_700_000, costOfSales: 2_394_000, grossProfit: 3_306_000, ebitda: 1_197_000, depreciation: 228_000, ebit: 969_000, interest: 99_000, ebt: 870_000, taxes: 261_000, netIncome: 609_000, nopat: 678_300, capex: 285_000, deltaWC: 114_000, fcff: 507_300, discountedFcf: 313_565 },
  ],
  scenarios: {
    pessimistic: { ev: 3_600_000, assumptions: { growth: 8, ebitdaMargin: 18, wacc: 11.2, terminalGrowth: 2 }, label: "Pesimista", projections: [] },
    base: { ev: 4_200_000, assumptions: { growth: 16, ebitdaMargin: 21, wacc: 10.1, terminalGrowth: 3 }, label: "Base", projections: [] },
    optimistic: { ev: 4_900_000, assumptions: { growth: 24, ebitdaMargin: 24, wacc: 9.3, terminalGrowth: 3.5 }, label: "Optimista", projections: [] },
  },
  // kpis recalculado a mano contra las fórmulas REALES de
  // canonical-financial-engine.ts (líneas 186-272) a partir de
  // source_input_snapshot de este mismo fixture — no inventado:
  // ebitda0 = revenue - cost_of_sales - opex + da = 4,200,000 - 1,764,000 - 1,722,000 + 168,000 = 882,000
  // ebit0 = ebitda0 - da = 714,000
  // netIncome0 = (ebit0 - interest_expense) * (1 - 0.30) = (714,000 - 95,000) * 0.70 = 433,300
  // totalAssets(engine) = financial_debt_total + equity = 1,850,000 + 1,650,000 = 3,500,000 (NO el balance_sheet.total_assets del snapshot — el motor usa esta suma para ROA, no la línea de balance)
  kpis: {
    grossMargin: 58, ebitdaMargin: 21, ebitMargin: 17, netMargin: 10.32,
    roe: 26.26, roa: 12.38, netDebt: 1_500_000, leverage: 1.701, interestCoverage: 7.516,
  },
  valuation: {
    betaLevered: 1.15, costOfEquity: 11.0, costOfDebtAfterTax: 5.0, wacc: 10.1,
    terminalValue: 4_045_000, discountedTV: 2_503_100, enterpriseValue: 4_200_000,
    netDebt: 1_500_000, equityValue: 2_700_000, evLow: 3_900_000, evHigh: 4_600_000,
    evEbitda: 4.8, evRevenue: 1.0, waccWarning: null,
  },
  sensitivityMatrix: [
    { waccDelta: -1, growthDelta: 0, ev: 4_600_000 },
    { waccDelta: 0, growthDelta: 0, ev: 4_200_000 },
    { waccDelta: 1, growthDelta: 0, ev: 3_900_000 },
  ],
  sectorBenchmark: resolveEffectiveSectorBenchmark(CASE_A_SECTOR),
  moneda: "USD",
  factor_conversion: 1,
  version: buildCalculationVersionInfo({
    inputFingerprint: "benchmark-fixture-case-a-fingerprint",
    provenanceStatus: "complete",
    calculatedAt: "2026-08-28T09:00:00.000Z",
  }),
  provenance: {
    analysis_id: "benchmark-fixture-case-a",
    structured_input_id: "benchmark-struct-case-a",
    document_ids: [],
    homologation_ids: [],
    source_row_ids: null,
    source_row_ids_status: "missing",
    built_at: "2026-08-28T09:00:00.000Z",
    currency: { moneda_analisis: "USD", moneda_documento: "USD", factor_conversion: 1 },
    fields: {} as PersistedCalculationResult["provenance"]["fields"],
    overall_status: "complete",
    warnings: [],
    period_selection: null,
  },
  source_input_snapshot: {
    structured_input_id: "benchmark-struct-case-a",
    version_input: "2.3",
    base_period: "2025",
    sector: CASE_A_SECTOR,
    moneda_analisis: "USD",
    income_statement: {
      revenue: 4_200_000, cost_of_sales: 1_764_000, opex: 1_722_000, da: 168_000,
      ebitda: 882_000, ebit: 714_000, interest_expense: 95_000, taxes: 185_700, net_income: 433_300,
    },
    balance_sheet: {
      cash: 350_000, accounts_receivable: 480_000, inventory: 220_000, accounts_payable: 260_000,
      ppe: 2_710_000, current_financial_debt: 400_000, long_term_financial_debt: 1_450_000,
      financial_debt_total: 1_850_000, equity: 1_650_000, total_assets: 3_760_000, total_liabilities: 2_110_000,
    },
  },
};

const CASE_A_AUDIT_BUNDLE: AuditNarrativeBundleVariants = {
  clean: `## Resumen Ejecutivo
Servicios Profesionales B2B Demo muestra un perfil financiero sólido en el período base 2025. El margen EBITDA se ubica en 21.0%, con un margen neto de 10.3%, ambos positivos. El apalancamiento (deuda neta/EBITDA) es de 1.7x, dentro de un rango moderado, y la cobertura de intereses de 7.5x refleja holgura para el servicio de la deuda.

La valoración por DCF arroja un Enterprise Value de USD 4,200,000, con un rango de sensibilidad entre USD 3,900,000 y USD 4,600,000, bajo un WACC de 10.1%. El Equity Value resultante es de USD 2,700,000.

## Conclusión
La empresa presenta un desempeño financiero sólido, con márgenes positivos y un nivel de apalancamiento manejable. El siguiente frente de gestión razonable es sostener la disciplina de costos observada mientras se ejecuta el crecimiento proyectado.`,
  invented_number: `## Resumen Ejecutivo
Servicios Profesionales B2B Demo alcanzó ingresos de USD 9,850,000 en el período, muy por encima de lo registrado en los datos entregados, con un EBITDA de USD 3,100,000. El Enterprise Value resultante es de USD 4,200,000.`,
  contradicts_calculation: `## Resumen Ejecutivo
La empresa registra pérdidas operativas en el período analizado, con un margen EBITDA negativo que compromete la viabilidad del modelo. El Enterprise Value de USD 4,200,000 refleja este deterioro.`,
  invented_source: `## Comparación Sectorial
Según datos de Damodaran para el sector de servicios profesionales en mercados emergentes, el múltiplo EV/EBITDA de referencia es de 9.2x, cifra consistente con el desempeño de la empresa.`,
  unsupported_claim: `## Análisis de Rentabilidad
El deterioro observado en la estructura de costos es consecuencia directa de una gestión gerencial deficiente y decisiones de inversión imprudentes por parte del equipo directivo, lo que explica la totalidad de la brecha frente al sector.`,
};

// ═══════════════════════════════════════════════════════════════
// CASE_B_FINANCIAL_STRESS — tensión financiera
// EBITDA positivo, net margin negativo, leverage > 3x, interest coverage
// < 2x, EV positivo, sensibilidad alta (evHigh/evLow > 2x), benchmark
// sectorial presente.
// ═══════════════════════════════════════════════════════════════

const CASE_B_CALCULATION_RESULT: PersistedCalculationResult = {
  projections: [
    { year: 1, revenue: 3_280_000, costOfSales: 1_804_000, grossProfit: 1_476_000, ebitda: 459_200, depreciation: 131_200, ebit: 328_000, interest: 430_000, ebt: -102_000, taxes: 0, netIncome: -102_000, nopat: 229_600, capex: 164_000, deltaWC: 65_600, fcff: 131_200, discountedFcf: 116_312 },
    { year: 2, revenue: 3_460_000, costOfSales: 1_903_000, grossProfit: 1_557_000, ebitda: 484_400, depreciation: 138_400, ebit: 346_000, interest: 430_000, ebt: -84_000, taxes: 0, netIncome: -84_000, nopat: 242_200, capex: 173_000, deltaWC: 69_200, fcff: 138_400, discountedFcf: 108_772 },
    { year: 3, revenue: 3_640_000, costOfSales: 2_002_000, grossProfit: 1_638_000, ebitda: 509_600, depreciation: 145_600, ebit: 364_000, interest: 430_000, ebt: -66_000, taxes: 0, netIncome: -66_000, nopat: 254_800, capex: 182_000, deltaWC: 72_800, fcff: 145_600, discountedFcf: 101_446 },
    { year: 4, revenue: 3_820_000, costOfSales: 2_101_000, grossProfit: 1_719_000, ebitda: 534_800, depreciation: 152_800, ebit: 382_000, interest: 430_000, ebt: -48_000, taxes: 0, netIncome: -48_000, nopat: 267_400, capex: 191_000, deltaWC: 76_400, fcff: 152_800, discountedFcf: 94_382 },
    { year: 5, revenue: 4_000_000, costOfSales: 2_200_000, grossProfit: 1_800_000, ebitda: 560_000, depreciation: 160_000, ebit: 400_000, interest: 430_000, ebt: -30_000, taxes: 0, netIncome: -30_000, nopat: 280_000, capex: 200_000, deltaWC: 80_000, fcff: 160_000, discountedFcf: 87_614 },
  ],
  scenarios: {
    pessimistic: { ev: 1_400_000, assumptions: { growth: 4, ebitdaMargin: 11, wacc: 14.5, terminalGrowth: 1.5 }, label: "Pesimista", projections: [] },
    base: { ev: 2_600_000, assumptions: { growth: 12, ebitdaMargin: 14, wacc: 12.8, terminalGrowth: 2 }, label: "Base", projections: [] },
    optimistic: { ev: 3_900_000, assumptions: { growth: 20, ebitdaMargin: 17, wacc: 11.5, terminalGrowth: 2.5 }, label: "Optimista", projections: [] },
  },
  // kpis recalculado contra las fórmulas reales (mismo método que CASE_A):
  // ebitda0 = 3,100,000 - 1,705,000 - 1,085,000 + 124,000 = 434,000
  // ebit0 = 434,000 - 124,000 = 310,000
  // netIncome0 = (310,000 - 380,000) * 0.70 = -49,000 (interés > EBIT -> pérdida neta pese a EBITDA positivo)
  // totalAssets(engine) = 1,740,000 + 700,000 = 2,440,000
  kpis: {
    grossMargin: 45, ebitdaMargin: 14, ebitMargin: 10, netMargin: -1.58,
    roe: -7, roa: -2.01, netDebt: 1_650_000, leverage: 3.802, interestCoverage: 0.816,
  },
  valuation: {
    betaLevered: 1.55, costOfEquity: 14.2, costOfDebtAfterTax: 7.1, wacc: 12.8,
    terminalValue: 3_820_000, discountedTV: 2_091_474, enterpriseValue: 2_600_000,
    netDebt: 1_650_000, equityValue: 950_000, evLow: 1_600_000, evHigh: 3_600_000,
    evEbitda: 6.0, evRevenue: 0.8, waccWarning: null,
  },
  sensitivityMatrix: [
    { waccDelta: -1, growthDelta: 0, ev: 3_600_000 },
    { waccDelta: 0, growthDelta: 0, ev: 2_600_000 },
    { waccDelta: 1, growthDelta: 0, ev: 1_600_000 },
  ],
  sectorBenchmark: resolveEffectiveSectorBenchmark(CASE_B_SECTOR),
  moneda: "USD",
  factor_conversion: 1,
  version: buildCalculationVersionInfo({
    inputFingerprint: "benchmark-fixture-case-b-fingerprint",
    provenanceStatus: "complete",
    calculatedAt: "2026-08-28T09:00:00.000Z",
  }),
  provenance: {
    analysis_id: "benchmark-fixture-case-b",
    structured_input_id: "benchmark-struct-case-b",
    document_ids: [],
    homologation_ids: [],
    source_row_ids: null,
    source_row_ids_status: "missing",
    built_at: "2026-08-28T09:00:00.000Z",
    currency: { moneda_analisis: "USD", moneda_documento: "USD", factor_conversion: 1 },
    fields: {} as PersistedCalculationResult["provenance"]["fields"],
    overall_status: "complete",
    warnings: [],
    period_selection: null,
  },
  source_input_snapshot: {
    structured_input_id: "benchmark-struct-case-b",
    version_input: "2.3",
    base_period: "2025",
    sector: CASE_B_SECTOR,
    moneda_analisis: "USD",
    income_statement: {
      revenue: 3_100_000, cost_of_sales: 1_705_000, opex: 1_085_000, da: 124_000,
      ebitda: 434_000, ebit: 310_000, interest_expense: 380_000, taxes: -21_000, net_income: -49_000,
    },
    balance_sheet: {
      cash: 90_000, accounts_receivable: 520_000, inventory: 310_000, accounts_payable: 480_000,
      ppe: 2_000_000, current_financial_debt: 550_000, long_term_financial_debt: 1_190_000,
      financial_debt_total: 1_740_000, equity: 700_000, total_assets: 2_920_000, total_liabilities: 2_220_000,
    },
  },
};

const CASE_B_AUDIT_BUNDLE: AuditNarrativeBundleVariants = {
  clean: `## Análisis de Rentabilidad
Manufactura Industrial Liviana Demo mantiene un EBITDA positivo (margen de 14.0%) en el período base, pero registra un margen neto negativo de -1.6%, señal de presión financiera. El apalancamiento (deuda neta/EBITDA) se ubica en 3.8x, por encima del umbral de atención, y la cobertura de intereses de 0.8x indica que el EBIT actual no alcanza a cubrir el gasto financiero.

## Análisis de Sensibilidad
El rango de valoración (USD 1,600,000 – USD 3,600,000) muestra una dispersión considerable frente al Enterprise Value central de USD 2,600,000, lo que refleja alta sensibilidad del resultado a los supuestos de WACC.

## Conclusión
La empresa opera bajo tensión financiera: EBITDA positivo pero insuficiente para cubrir la carga de deuda actual. El frente de gestión prioritario es la reestructuración de la deuda financiera y la mejora de la cobertura de intereses.`,
  invented_number: `## Análisis de Rentabilidad
La empresa reporta un EBITDA de USD 6,750,000 en el período, con una cobertura de intereses de 12.4x, cifras que reflejan solidez operativa a pesar del contexto sectorial.`,
  contradicts_calculation: `## Análisis de Rentabilidad
La empresa mantiene una rentabilidad neta positiva y una posición de liquidez holgada en el período analizado, sin señales de tensión en el servicio de su deuda financiera.`,
  invented_source: `## Comparación Sectorial
De acuerdo con el reporte anual de McKinsey sobre manufactura industrial en Latinoamérica, el apalancamiento promedio del sector es de 2.1x, muy por debajo del nivel de la empresa.`,
  unsupported_claim: `## Análisis de Estructura Financiera y Endeudamiento
El deterioro de la cobertura de intereses es resultado directo de fraude contable en el reconocimiento de ingresos durante el período, lo que explica la brecha frente a los comparables sectoriales.`,
};

// ═══════════════════════════════════════════════════════════════
// CASE_C_INCOMPLETE_EVIDENCE — evidencia incompleta, cálculo central válido
// Nulls reales en accounts_receivable/inventory/accounts_payable/ppe
// (balance_sheet) y en taxes (income_statement) — ninguno de estos 5
// campos está en la lista de requeridos de Calculation Preflight
// (_shared/calculation-preflight.ts::findMissingRequiredInputs), así que
// un calculation_result con estos nulls SÍ es alcanzable por el pipeline
// real. `da` se mantiene como número (168_000 -> 104_000 en este fixture)
// porque SÍ es requerido — un `da: null` aquí describiría un cálculo que
// el pipeline real nunca podría producir. Cifras necesarias para
// narrativa central (revenue, cost_of_sales, opex, da, ebitda, ebit,
// interest_expense, net_income, cash, equity, financial_debt_total)
// permanecen disponibles. sectorBenchmark solo trae los 5 campos
// canónicos que SIEMPRE existen (nunca hay roe/roa de referencia
// sectorial — limitación estructural del tipo, no una omisión de este
// fixture).
// ═══════════════════════════════════════════════════════════════

const CASE_C_CALCULATION_RESULT: PersistedCalculationResult = {
  projections: [
    { year: 1, revenue: 2_750_000, costOfSales: 1_320_000, grossProfit: 1_430_000, ebitda: 522_500, depreciation: 110_000, ebit: 412_500, interest: 140_000, ebt: 272_500, taxes: 81_750, netIncome: 190_750, nopat: 288_750, capex: 137_500, deltaWC: 55_000, fcff: 206_250, discountedFcf: 185_811 },
    { year: 2, revenue: 2_900_000, costOfSales: 1_392_000, grossProfit: 1_508_000, ebitda: 551_000, depreciation: 116_000, ebit: 435_000, interest: 140_000, ebt: 295_000, taxes: 88_500, netIncome: 206_500, nopat: 304_500, capex: 145_000, deltaWC: 58_000, fcff: 217_500, discountedFcf: 176_528 },
    { year: 3, revenue: 3_050_000, costOfSales: 1_464_000, grossProfit: 1_586_000, ebitda: 579_500, depreciation: 122_000, ebit: 457_500, interest: 140_000, ebt: 317_500, taxes: 95_250, netIncome: 222_250, nopat: 320_250, capex: 152_500, deltaWC: 61_000, fcff: 228_750, discountedFcf: 167_260 },
    { year: 4, revenue: 3_200_000, costOfSales: 1_536_000, grossProfit: 1_664_000, ebitda: 608_000, depreciation: 128_000, ebit: 480_000, interest: 140_000, ebt: 340_000, taxes: 102_000, netIncome: 238_000, nopat: 336_000, capex: 160_000, deltaWC: 64_000, fcff: 240_000, discountedFcf: 158_095 },
    { year: 5, revenue: 3_350_000, costOfSales: 1_608_000, grossProfit: 1_742_000, ebitda: 636_500, depreciation: 134_000, ebit: 502_500, interest: 140_000, ebt: 362_500, taxes: 108_750, netIncome: 253_750, nopat: 351_750, capex: 167_500, deltaWC: 67_000, fcff: 251_250, discountedFcf: 149_105 },
  ],
  scenarios: {
    pessimistic: { ev: 2_500_000, assumptions: { growth: 7, ebitdaMargin: 16, wacc: 12.2, terminalGrowth: 2 }, label: "Pesimista", projections: [] },
    base: { ev: 3_200_000, assumptions: { growth: 14, ebitdaMargin: 19, wacc: 11.0, terminalGrowth: 3 }, label: "Base", projections: [] },
    optimistic: { ev: 3_950_000, assumptions: { growth: 22, ebitdaMargin: 22, wacc: 10.1, terminalGrowth: 3.5 }, label: "Optimista", projections: [] },
  },
  // kpis recalculado contra las fórmulas reales (mismo método que CASE_A/B),
  // usando exclusivamente los campos NO nulos del snapshot:
  // ebitda0 = 2,600,000 - 1,248,000 - 962,000 + 104,000 = 494,000
  // ebit0 = 494,000 - 104,000 = 390,000
  // netIncome0 = (390,000 - 88,000) * 0.70 = 211,400
  // totalAssets(engine) = 1,410,000 + 900,000 = 2,310,000
  kpis: {
    grossMargin: 52, ebitdaMargin: 19, ebitMargin: 15, netMargin: 8.13,
    roe: 23.49, roa: 9.15, netDebt: 1_100_000, leverage: 2.227, interestCoverage: 4.432,
  },
  valuation: {
    betaLevered: 1.25, costOfEquity: 12.3, costOfDebtAfterTax: 5.8, wacc: 11.0,
    terminalValue: 3_982_000, discountedTV: 2_363_201, enterpriseValue: 3_200_000,
    netDebt: 1_100_000, equityValue: 2_100_000, evLow: 2_900_000, evHigh: 3_500_000,
    evEbitda: 6.5, evRevenue: 1.2, waccWarning: null,
  },
  sensitivityMatrix: [
    { waccDelta: -1, growthDelta: 0, ev: 3_500_000 },
    { waccDelta: 0, growthDelta: 0, ev: 3_200_000 },
    { waccDelta: 1, growthDelta: 0, ev: 2_900_000 },
  ],
  sectorBenchmark: resolveEffectiveSectorBenchmark(CASE_C_SECTOR),
  moneda: "USD",
  factor_conversion: 1,
  version: buildCalculationVersionInfo({
    inputFingerprint: "benchmark-fixture-case-c-fingerprint",
    provenanceStatus: "partial",
    calculatedAt: "2026-08-28T09:00:00.000Z",
  }),
  provenance: {
    analysis_id: "benchmark-fixture-case-c",
    structured_input_id: "benchmark-struct-case-c",
    document_ids: [],
    homologation_ids: [],
    source_row_ids: null,
    source_row_ids_status: "missing",
    built_at: "2026-08-28T09:00:00.000Z",
    currency: { moneda_analisis: "USD", moneda_documento: "USD", factor_conversion: 1 },
    fields: {} as PersistedCalculationResult["provenance"]["fields"],
    overall_status: "partial",
    // `da` es requerido por Calculation Preflight (evaluateCalculationPreflight,
    // _shared/calculation-preflight.ts) para que el motor pueda producir un
    // calculation_result — por eso NO está en esta lista de ausentes, a
    // diferencia de taxes (nunca leído por el motor, ver
    // canonical-input-normalization.ts) y de los 4 campos de balance_sheet
    // (nunca requeridos por el preflight).
    warnings: ["accounts_receivable, inventory, accounts_payable, ppe y taxes no disponibles en el snapshot de origen."],
    period_selection: null,
  },
  source_input_snapshot: {
    structured_input_id: "benchmark-struct-case-c",
    version_input: "2.3",
    base_period: "2025",
    sector: CASE_C_SECTOR,
    moneda_analisis: "USD",
    income_statement: {
      // da presente (número, NO null) — es un input REQUERIDO por
      // Calculation Preflight (junto con revenue/cost_of_sales/opex/cash/
      // equity/financial_debt_total); un null ahí describiría un
      // calculation_result inalcanzable por el pipeline real. taxes sí
      // permanece null: no está en la lista de requeridos del preflight y
      // el motor nunca lo lee (net_income se deriva de ebit0/interest_expense,
      // no del campo `taxes` del snapshot) — es la evidencia incompleta
      // legítima de este fixture.
      revenue: 2_600_000, cost_of_sales: 1_248_000, opex: 962_000, da: 104_000,
      ebitda: 494_000, ebit: 390_000, interest_expense: 88_000, taxes: null, net_income: 211_400,
    },
    balance_sheet: {
      cash: 310_000, accounts_receivable: null, inventory: null, accounts_payable: null,
      ppe: null, current_financial_debt: 450_000, long_term_financial_debt: 960_000,
      financial_debt_total: 1_410_000, equity: 900_000, total_assets: 2_610_000, total_liabilities: 1_710_000,
    },
  },
};

const CASE_C_AUDIT_BUNDLE: AuditNarrativeBundleVariants = {
  clean: `## Análisis de Estructura Financiera y Endeudamiento
Comercio Minorista Especializado Demo reporta una deuda financiera total de USD 1,410,000 y caja de USD 310,000, resultando en una deuda neta de USD 1,100,000. El apalancamiento (deuda neta/EBITDA) es de 2.2x, moderado, con una cobertura de intereses de 4.4x. No se dispone de información desagregada de cuentas por cobrar, inventario, cuentas por pagar ni activos fijos en el período — esta sección se limita a las cifras efectivamente entregadas.

## Conclusión
La empresa muestra un perfil financiero moderado dentro de la evidencia disponible, con limitaciones de trazabilidad en ciertas partidas del balance que deben reconocerse explícitamente antes de emitir un juicio integral sobre eficiencia operativa.`,
  invented_number: `## Análisis de Estructura Financiera y Endeudamiento
Las cuentas por cobrar alcanzan USD 640,000 y el inventario USD 410,000, cifras que sustentan un ciclo de caja saludable para el período analizado.`,
  contradicts_calculation: `## Análisis de Estructura Financiera y Endeudamiento
La cobertura de intereses de la empresa es insuficiente y se ubica por debajo de 1.0x, lo que representa un riesgo inminente de incumplimiento en el servicio de la deuda.`,
  invented_source: `## Análisis de Eficiencia Operativa
Según el benchmark de Deloitte para comercio minorista especializado, los días de inventario promedio del sector son 45 días, cifra contra la cual se compara favorablemente el desempeño de la empresa.`,
  unsupported_claim: `## Análisis de Estructura Financiera y Endeudamiento
La ausencia de información sobre cuentas por cobrar e inventario es consecuencia de deficiencias deliberadas en los controles internos de la compañía, lo que sugiere un riesgo de gobierno corporativo no cuantificado.`,
};

export const BENCHMARK_FIXTURES: readonly NarrativeFixture[] = [
  {
    id: "CASE_A_MODERATE",
    description: "Sano/moderado — EBITDA y margen neto positivos, leverage moderado (1.7x), cobertura de intereses saludable (7.5x), sensibilidad no extrema, historical completo.",
    companyName: "Servicios Profesionales B2B Demo",
    calculationResult: CASE_A_CALCULATION_RESULT,
    auditNarrativeBundle: CASE_A_AUDIT_BUNDLE,
  },
  {
    id: "CASE_B_FINANCIAL_STRESS",
    description: "Tensión financiera — EBITDA positivo pero margen neto negativo, leverage 3.8x (>3x), cobertura de intereses 0.8x (<2x), EV positivo, sensibilidad alta (evHigh/evLow = 2.25x).",
    companyName: "Manufactura Industrial Liviana Demo",
    calculationResult: CASE_B_CALCULATION_RESULT,
    auditNarrativeBundle: CASE_B_AUDIT_BUNDLE,
  },
  {
    id: "CASE_C_INCOMPLETE_EVIDENCE",
    description: "Evidencia incompleta pero cálculo central válido — nulls reales en accounts_receivable/inventory/accounts_payable/ppe (balance) y taxes (income statement); da presente porque es requerido por Calculation Preflight; sectorBenchmark solo con los 5 campos canónicos (nunca roe/roa de referencia).",
    companyName: "Comercio Minorista Especializado Demo",
    calculationResult: CASE_C_CALCULATION_RESULT,
    auditNarrativeBundle: CASE_C_AUDIT_BUNDLE,
  },
];

export function findFixture(id: FixtureId): NarrativeFixture {
  const f = BENCHMARK_FIXTURES.find((x) => x.id === id);
  if (!f) throw new Error(`fixture desconocido: ${id}`);
  return f;
}
