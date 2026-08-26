// Bloque 1E — Subbloque 1 (corrección): adaptador puro `calculation_result` → PDF.
//
// Traduce el `PersistedCalculationResult` canónico (persistido por
// `ejecutar-calculo/index.ts` en `analyses.calculation_result`, incluyendo
// su `source_input_snapshot`) al shape que hoy espera `generatePDF()`
// (`AnalysisResult` + `FinancialInputs`, definidos en `./financial-engine`,
// más el nuevo `HistoricalFinancials` nullable para las cifras base).
//
// Regla dura: este archivo NUNCA recalcula WACC, DCF, valor terminal,
// enterprise value, equity value ni ningún supuesto metodológico. Todo
// número de valoración sale 1:1 de `calculation_result`. Los históricos
// (año 0) salen 1:1 de `calculation_result.source_input_snapshot` — nunca
// de una consulta externa ni de una fórmula. Si `source_input_snapshot`
// no existe, este mapper falla explícito (fail-closed) en vez de volver a
// leer `structured_inputs` por su cuenta — ese fallback es precisamente lo
// que rompía la trazabilidad "este PDF corresponde a este cálculo".
//
// Este archivo NO importa nada de `./financial-engine` — solo tipos, y
// tampoco. Los tipos de retorno (`AnalysisResult`, `FinancialInputs`) se
// importan como `import type` únicamente para tipar el valor de salida;
// ningún valor/función/constante de ese motor se usa aquí.

import type {
  AnalysisResult,
  FinancialInputs,
  ReportingCurrency,
} from "./financial-engine";
import type {
  PersistedCalculationResult,
  CanonicalScenarioResult,
  CanonicalCalculationVersion,
  HistoricalFinancials,
} from "@/types/calculation-result";

function getAssumption(version: CanonicalCalculationVersion, key: string): number {
  const entry = version.assumptions_snapshot[key];
  if (!entry) {
    throw new Error(`calculation_result.version.assumptions_snapshot no contiene "${key}" — no se puede mapear a PDF sin inventar el valor.`);
  }
  return entry.value;
}

function toScenarioProjections(scenario: CanonicalScenarioResult): AnalysisResult["scenarios"]["base"] {
  return scenario.projections;
}

export interface MapCanonicalCalculationParams {
  calculationResult: PersistedCalculationResult;
  companyName: string;
  sector: string;
}

export interface MappedPdfData {
  result: AnalysisResult & { calculationMeta: CanonicalCalculationVersion };
  inputs: FinancialInputs;
  historicals: HistoricalFinancials;
}

/**
 * Adaptador puro CalculationResult canónico → input de `generatePDF()`.
 * No invoca el motor financiero cliente, no recalcula ninguna fórmula
 * de valoración ni de históricos.
 */
export function mapCanonicalCalculationToPdfData(params: MapCanonicalCalculationParams): MappedPdfData {
  const { calculationResult: cr, companyName, sector } = params;

  if (!cr.source_input_snapshot) {
    throw new Error(
      "calculation_result no contiene source_input_snapshot — no se puede generar un PDF trazable sin inventar de dónde salieron las cifras históricas.",
    );
  }

  const reportingCurrency: ReportingCurrency = cr.moneda === "USD" ? "USD" : "COP";

  // Históricos (año 0): 1:1 desde source_input_snapshot, sin recalcular.
  // Ausente permanece null — nunca se convierte en 0.
  const is_ = cr.source_input_snapshot.income_statement;
  const bs = cr.source_input_snapshot.balance_sheet;
  const historicals: HistoricalFinancials = {
    revenue: is_.revenue,
    costOfSales: is_.cost_of_sales,
    opex: is_.opex,
    depreciation: is_.da,
    ebitda: is_.ebitda,
    ebit: is_.ebit,
    interestExpense: is_.interest_expense,
    taxes: is_.taxes,
    netIncome: is_.net_income,
    cash: bs.cash,
    financialDebtTotal: bs.financial_debt_total,
    equity: bs.equity,
    totalAssets: bs.total_assets,
    totalLiabilities: bs.total_liabilities,
  };

  // Benchmark sectorial: los VALORES numéricos siempre vienen de
  // cr.sectorBenchmark (canónico). Para label se usa el sector tal cual
  // (metadata no financiera, ya en `analyses.sector`) — no la tabla de
  // referencia estática del motor cliente. Para source/lastUpdated/
  // vigenteHasta: calculation_result/source_input_snapshot no traen una
  // fuente de citación inequívoca hoy, así que se declara explícitamente
  // "No disponible" en vez de inventarla (mismo patrón "N/D" que el resto
  // del PDF, no un dato fabricado).
  const NO_DISPONIBLE = "No disponible";
  const sectorBenchmark: AnalysisResult["sectorBenchmark"] = {
    label: sector,
    source: NO_DISPONIBLE,
    lastUpdated: NO_DISPONIBLE,
    vigenteHasta: NO_DISPONIBLE,
    beta: cr.sectorBenchmark.beta,
    ebitdaMargin: cr.sectorBenchmark.ebitdaMargin,
    evEbitda: cr.sectorBenchmark.evEbitda,
    evRevenue: cr.sectorBenchmark.evRevenue,
    waccRef: cr.sectorBenchmark.waccRef,
  };

  const baseGrowth = cr.scenarios.base.assumptions.growth;
  const baseEbitdaMargin = cr.scenarios.base.assumptions.ebitdaMargin;

  const result: AnalysisResult & { calculationMeta: CanonicalCalculationVersion } = {
    projections: cr.projections,
    scenarios: {
      pessimistic: toScenarioProjections(cr.scenarios.pessimistic),
      base: toScenarioProjections(cr.scenarios.base),
      optimistic: toScenarioProjections(cr.scenarios.optimistic),
    },
    scenarioAssumptions: {
      pessimistic: {
        label: cr.scenarios.pessimistic.label || "Pesimista",
        growth: cr.scenarios.pessimistic.assumptions.growth,
        ebitdaMargin: cr.scenarios.pessimistic.assumptions.ebitdaMargin,
        // capexPct/wcPct no varían por escenario en el motor canónico
        // (ver canonical-financial-engine.ts) — el único valor real es
        // el del snapshot de supuestos, igual para los 3 escenarios.
        capexPct: getAssumption(cr.version, "capexPctOfRevenue"),
        wcPct: getAssumption(cr.version, "workingCapitalPctOfRevenue"),
        wacc: cr.scenarios.pessimistic.assumptions.wacc,
        terminalGrowth: cr.scenarios.pessimistic.assumptions.terminalGrowth,
      },
      base: {
        label: cr.scenarios.base.label || "Base",
        growth: baseGrowth,
        ebitdaMargin: baseEbitdaMargin,
        capexPct: getAssumption(cr.version, "capexPctOfRevenue"),
        wcPct: getAssumption(cr.version, "workingCapitalPctOfRevenue"),
        wacc: cr.scenarios.base.assumptions.wacc,
        terminalGrowth: cr.scenarios.base.assumptions.terminalGrowth,
      },
      optimistic: {
        label: cr.scenarios.optimistic.label || "Optimista",
        growth: cr.scenarios.optimistic.assumptions.growth,
        ebitdaMargin: cr.scenarios.optimistic.assumptions.ebitdaMargin,
        capexPct: getAssumption(cr.version, "capexPctOfRevenue"),
        wcPct: getAssumption(cr.version, "workingCapitalPctOfRevenue"),
        wacc: cr.scenarios.optimistic.assumptions.wacc,
        terminalGrowth: cr.scenarios.optimistic.assumptions.terminalGrowth,
      },
    },
    kpis: {
      grossMargin: cr.kpis.grossMargin,
      ebitdaMargin: cr.kpis.ebitdaMargin,
      ebitMargin: cr.kpis.ebitMargin,
      netMargin: cr.kpis.netMargin,
      roe: cr.kpis.roe,
      roa: cr.kpis.roa,
      // revenueGrowth: el supuesto de crecimiento realmente usado por el
      // motor canónico (no recalculado — mismo valor que
      // resolveEffectiveGrowth() ya aplicó).
      revenueGrowth: baseGrowth,
      netDebt: cr.kpis.netDebt,
      leverage: cr.kpis.leverage,
      interestCoverage: cr.kpis.interestCoverage,
      // Placeholders INERTES — el tipo KPIResult del motor cliente exige
      // `number` (no puede ser null), pero calculation_result no produce
      // ninguno de estos 5 campos ni una caja mínima operativa. NO se
      // deriva ni se inventa ningún valor: pdf-generator.ts omite por
      // completo las filas/reglas de riesgo que dependían de ellos cuando
      // recibe `historicals` (camino canónico) — ver ese archivo. Estos
      // ceros nunca se leen en ese camino.
      daysReceivable: 0,
      daysInventory: 0,
      daysPayable: 0,
      cashCycle: 0,
      cajaMinima: 0,
    },
    betaLevered: cr.valuation.betaLevered,
    costOfEquity: cr.valuation.costOfEquity,
    costOfDebtAfterTax: cr.valuation.costOfDebtAfterTax,
    wacc: cr.valuation.wacc,
    terminalValue: cr.valuation.terminalValue,
    discountedTV: cr.valuation.discountedTV,
    enterpriseValue: cr.valuation.enterpriseValue,
    netDebt: cr.valuation.netDebt,
    equityValue: cr.valuation.equityValue,
    evLow: cr.valuation.evLow,
    evHigh: cr.valuation.evHigh,
    evEbitda: cr.valuation.evEbitda,
    evRevenue: cr.valuation.evRevenue,
    sectorBenchmark,
    sensitivityMatrix: cr.sensitivityMatrix,
    scenarioEVs: {
      pessimistic: cr.scenarios.pessimistic.ev,
      base: cr.scenarios.base.ev,
      optimistic: cr.scenarios.optimistic.ev,
    },
    waccWarning: cr.valuation.waccWarning,
    // Trazabilidad: fingerprint/versión del cálculo consumido, disponible
    // en el objeto que alimenta el PDF (Etapa 7) aunque no se muestre
    // visualmente todavía.
    calculationMeta: cr.version,
  };

  // inputs: solo companyName/sector/reportingCurrency (metadata) y los
  // SUPUESTOS del motor (siempre presentes en assumptions_snapshot, nunca
  // ausentes — por eso pueden ser `number` no-nullable). Los campos
  // históricos de FinancialInputs (revenue/costOfSales/opex/depreciation/
  // totalDebt/cash/equity/interestExpense) y equityWeight/debtWeight
  // quedan en `0` — placeholders INERTES, nunca leídos por pdf-generator.ts
  // en el camino canónico (que lee `historicals`, no `inputs`, para esas
  // cifras). NO se deriva equityWeight/debtWeight de ninguna fórmula de
  // capital-structure aquí — ver ETAPA 7.
  const inputs: FinancialInputs = {
    companyName,
    sector,
    reportingCurrency,
    revenue: 0,
    costOfSales: 0,
    opex: 0,
    depreciation: 0,
    totalDebt: 0,
    cash: 0,
    equity: 0,
    interestExpense: 0,
    growth: baseGrowth,
    ebitdaMargin: baseEbitdaMargin,
    taxRate: getAssumption(cr.version, "taxRatePct"),
    capexPct: getAssumption(cr.version, "capexPctOfRevenue"),
    wcPct: getAssumption(cr.version, "workingCapitalPctOfRevenue"),
    terminalGrowth: getAssumption(cr.version, "terminalGrowthPct"),
    diasMinCaja: 0,
    costOfDebt: getAssumption(cr.version, "costOfDebtPct"),
    riskFreeRate: getAssumption(cr.version, "riskFreeRatePct"),
    erp: getAssumption(cr.version, "equityRiskPremiumPct"),
    equityWeight: 0,
    debtWeight: 0,
  };

  return { result, inputs, historicals };
}
