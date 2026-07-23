// Motor financiero canónico del servidor, extraído de
// `ejecutar-calculo/index.ts::runEngine` (Bloque 1B-M/1C-Prep, cierre
// técnico 2026-07-23).
//
// Sin imports de URL, sin Supabase, sin Deno, sin `serve()`, sin
// variables de entorno, sin efectos secundarios — importable desde Deno
// (import relativo con extensión `.ts`) y desde Vitest indistintamente.
//
// Conserva exactamente las fórmulas y el comportamiento actuales del
// servidor — no se cambió ninguna fórmula al extraerlo, incluyendo la
// reversión del cambio no autorizado de escenarios (ver
// docs/velarix/bloque-1b-metodologia/REPORTE-RECONCILIACION-METODOLOGICA.md).
// Usa los tipos reales de `structured_input` tal como los escribe
// `build-structured-input/index.ts` — no el `FinancialInputs` del motor
// cliente.

import { computeCapitalStructure, resolveFinancialDebtTotal } from "./capital-structure.ts";
import { CANONICAL_METHODOLOGY } from "./financial-methodology.ts";

export const SECTOR_BENCHMARKS: Record<string, { beta: number; ebitdaMargin: number; evEbitda: number; evRevenue: number; waccRef: number }> = {
  "Software / Tecnología":          { beta: 1.22, ebitdaMargin: 26,   evEbitda: 13,   evRevenue: 4.8, waccRef: 11.2 },
  "Retail / Comercio":              { beta: 1.08, ebitdaMargin: 18.5, evEbitda: 9.5,  evRevenue: 2.2, waccRef: 10.2 },
  "Servicios empresariales":        { beta: 0.98, ebitdaMargin: 20.5, evEbitda: 10.5, evRevenue: 2.6, waccRef: 9.6 },
  "Manufactura":                    { beta: 1.18, ebitdaMargin: 16.5, evEbitda: 8.5,  evRevenue: 1.9, waccRef: 10.6 },
  "Consumo":                        { beta: 0.93, ebitdaMargin: 22.5, evEbitda: 11.5, evRevenue: 3.1, waccRef: 9.1 },
  "Alimentos y bebidas":            { beta: 0.78, ebitdaMargin: 18.5, evEbitda: 10.5, evRevenue: 2.3, waccRef: 9.1 },
  "Agroindustria":                  { beta: 0.83, ebitdaMargin: 15.5, evEbitda: 8.5,  evRevenue: 1.6, waccRef: 9.6 },
  "Salud":                          { beta: 0.88, ebitdaMargin: 20.5, evEbitda: 11.5, evRevenue: 2.9, waccRef: 9.6 },
  "Educación":                      { beta: 0.73, ebitdaMargin: 18.5, evEbitda: 9.5,  evRevenue: 2.1, waccRef: 8.6 },
  "Transporte y logística":         { beta: 1.03, ebitdaMargin: 14.5, evEbitda: 8.5,  evRevenue: 1.7, waccRef: 10.1 },
  "Construcción e infraestructura": { beta: 1.13, ebitdaMargin: 13.5, evEbitda: 7.5,  evRevenue: 1.5, waccRef: 10.6 },
  "Energía y utilities":            { beta: 0.52, ebitdaMargin: 36,   evEbitda: 9.5,  evRevenue: 3.1, waccRef: 8.1 },
  "Turismo y hospitalidad":         { beta: 1.28, ebitdaMargin: 16.5, evEbitda: 9.5,  evRevenue: 2.1, waccRef: 11.1 },
  "Inmobiliario":                   { beta: 0.68, ebitdaMargin: 41,   evEbitda: 13.5, evRevenue: 5.2, waccRef: 8.6 },
  "Financiero / Seguros":           { beta: 0.83, ebitdaMargin: 31,   evEbitda: 10.5, evRevenue: 3.6, waccRef: 9.1 },
};

export interface CanonicalIncomeStatement {
  revenue?: number | null;
  cost_of_sales?: number | null;
  opex?: number | null;
  da?: number | null;
  depreciation?: number | null;
  interest_expense?: number | null;
  taxes?: number | null;
  net_income?: number | null;
}

export interface CanonicalBalanceSheet {
  financial_debt_total?: number | null;
  total_debt?: number | null;
  financial_debt?: number | null;
  cash?: number | null;
  equity?: number | null;
  total_equity?: number | null;
}

export interface CanonicalStructuredInput {
  income_statement?: CanonicalIncomeStatement;
  balance_sheet?: CanonicalBalanceSheet;
  moneda_analisis?: string;
  factor_conversion?: number;
}

export interface YearProjection {
  year: number;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  interest: number;
  ebt: number;
  taxes: number;
  netIncome: number;
  nopat: number;
  capex: number;
  deltaWC: number;
  fcff: number;
  discountedFcf: number;
}

export interface ScenarioResult {
  projections: YearProjection[];
  ev: number;
  assumptions: { growth: number; ebitdaMargin: number; wacc: number; terminalGrowth: number };
  label?: string;
}

export interface CanonicalKPIs {
  grossMargin: number;
  ebitdaMargin: number;
  ebitMargin: number;
  netMargin: number;
  roe: number;
  roa: number;
  netDebt: number;
  leverage: number;
  interestCoverage: number;
}

export interface CanonicalValuation {
  betaLevered: number;
  costOfEquity: number;
  costOfDebtAfterTax: number;
  wacc: number;
  terminalValue: number;
  discountedTV: number;
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  evLow: number;
  evHigh: number;
  evEbitda: number;
  evRevenue: number;
  waccWarning: string | null;
}

export interface CanonicalFinancialEngineResult {
  projections: YearProjection[];
  scenarios: {
    pessimistic: ScenarioResult;
    base: ScenarioResult;
    optimistic: ScenarioResult;
  };
  kpis: CanonicalKPIs;
  valuation: CanonicalValuation;
  sensitivityMatrix: { waccDelta: number; growthDelta: number; ev: number }[];
  sectorBenchmark: { beta: number; ebitdaMargin: number; evEbitda: number; evRevenue: number; waccRef: number };
  moneda: string;
  factor_conversion: number;
}

function computeProjections(
  revenue0: number, costRatio: number, totalDebt: number, costOfDebt: number,
  taxRate: number, growth: number, ebitdaMargin: number, capexPct: number,
  wcPct: number, waccDecimal: number
): YearProjection[] {
  const projections: YearProjection[] = [];
  for (let t = 1; t <= 5; t++) {
    const revenue = revenue0 * Math.pow(1 + growth / 100, t);
    const costOfSales = revenue * costRatio;
    const grossProfit = revenue - costOfSales;
    const ebitda = revenue * (ebitdaMargin / 100);
    const depreciation = revenue * (CANONICAL_METHODOLOGY.assumptions.depreciationPctOfRevenue.value / 100);
    const ebit = ebitda - depreciation;
    const interest = totalDebt * (costOfDebt / 100);
    const ebt = ebit - interest;
    const taxes = Math.max(ebt, 0) * (taxRate / 100);
    const netIncome = ebt - taxes;
    const nopat = ebit - ebit * (taxRate / 100);
    const capex = revenue * (capexPct / 100);
    const deltaWC = revenue * (wcPct / 100);
    const fcff = nopat + depreciation - capex - deltaWC;
    const discountedFcf = fcff / Math.pow(1 + waccDecimal, t);
    projections.push({ year: t, revenue, costOfSales, grossProfit, ebitda, depreciation, ebit, interest, ebt, taxes, netIncome, nopat, capex, deltaWC, fcff, discountedFcf });
  }
  return projections;
}

/**
 * Motor financiero canónico — la misma lógica que
 * `ejecutar-calculo/index.ts` usa para producir `calculation_result`.
 * Lanza si `revenue === 0` (comportamiento actual conservado, no
 * decidido de nuevo aquí — ver BL-30/DECISIONES-FINANCIERAS-PENDIENTES.md
 * decisión #10 sobre el motor cliente, que sí difiere en este punto).
 */
export function runCanonicalFinancialEngine(
  input: CanonicalStructuredInput,
  sector: string,
  expectedGrowth: number | null | undefined,
): CanonicalFinancialEngineResult {
  const bench = SECTOR_BENCHMARKS[sector] || SECTOR_BENCHMARKS["Software / Tecnología"];
  const is = input.income_statement || {};
  const bs = input.balance_sheet || {};

  const revenue = Math.abs(is.revenue || 0);
  const costOfSales = Math.abs(is.cost_of_sales || 0);
  const opex = Math.abs(is.opex || 0);
  const da = Math.abs(is.da || is.depreciation || 0);
  const interestExpense = Math.abs(is.interest_expense || 0);

  const totalDebt = resolveFinancialDebtTotal(bs);
  const cash = Math.abs(bs.cash || 0);
  const equity = Math.abs(bs.equity || bs.total_equity || 0);

  if (revenue === 0) throw new Error("Revenue es 0 — no se puede calcular valoración.");

  // Derived
  const ebitda0 = revenue - costOfSales - opex + da;
  const ebit0 = ebitda0 - da;
  const costRatio = costOfSales / revenue;
  const ebitdaMargin = (ebitda0 / revenue) * 100;
  const { assumptions } = CANONICAL_METHODOLOGY;
  const taxRate = assumptions.taxRatePct.value;
  const capexPct = assumptions.capexPctOfRevenue.value;
  const wcPct = assumptions.workingCapitalPctOfRevenue.value;
  const terminalGrowth = assumptions.terminalGrowthPct.value;
  const costOfDebt = assumptions.costOfDebtPct.value;
  const riskFreeRate = assumptions.riskFreeRatePct.value;
  const erp = assumptions.equityRiskPremiumPct.value;

  const capitalStructure = computeCapitalStructure({
    totalDebt, cash, equity,
    sectorBetaUnlevered: bench.beta,
    taxRatePct: taxRate,
    costOfDebtPct: costOfDebt,
    riskFreeRatePct: riskFreeRate,
    erpPct: erp,
  });
  const { betaLevered, costOfEquityPct, costOfDebtAfterTaxPct, waccPct, netDebt } = capitalStructure;
  const waccDecimal = waccPct / 100;

  const growth = expectedGrowth || 25;

  // Projections
  const projections = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, waccDecimal);

  // Terminal value
  const g = terminalGrowth / 100;
  let terminalValue = 0, discountedTV = 0, waccWarning: string | null = null;
  if (waccDecimal <= g) {
    waccWarning = "WACC ≤ g terminal: modelo DCF no converge.";
  } else {
    terminalValue = (projections[4].fcff * (1 + g)) / (waccDecimal - g);
    discountedTV = terminalValue / Math.pow(1 + waccDecimal, 5);
  }

  const sumDCF = projections.reduce((s, p) => s + p.discountedFcf, 0);
  const enterpriseValue = sumDCF + discountedTV;
  const equityValue = Math.max(enterpriseValue - netDebt, 0);

  // Sensitivity ±1% WACC
  let evLow = 0, evHigh = 0;
  const wL = waccDecimal - 0.01, wH = waccDecimal + 0.01;
  if (wH > g) {
    const pH = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, wH);
    const tvH = (pH[4].fcff * (1 + g)) / (wH - g);
    evLow = pH.reduce((s, p) => s + p.discountedFcf, 0) + tvH / Math.pow(1 + wH, 5);
  }
  if (wL > g) {
    const pL = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, wL);
    const tvL = (pL[4].fcff * (1 + g)) / (wL - g);
    evHigh = pL.reduce((s, p) => s + p.discountedFcf, 0) + tvL / Math.pow(1 + wL, 5);
  }

  // Multiples
  const evEbitda = projections[0].ebitda > 0 ? enterpriseValue / projections[0].ebitda : 0;
  const evRevenue = projections[0].revenue > 0 ? enterpriseValue / projections[0].revenue : 0;

  // Sensitivity matrix 5x5
  const sensitivityMatrix: { waccDelta: number; growthDelta: number; ev: number }[] = [];
  for (const wd of [-2, -1, 0, 1, 2]) {
    for (const gd of [-2, -1, 0, 1, 2]) {
      const w = waccDecimal + wd / 100;
      const gRate = g + gd / 100;
      if (w <= gRate || w <= 0) { sensitivityMatrix.push({ waccDelta: wd, growthDelta: gd, ev: 0 }); continue; }
      const ps = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, w);
      const tv = (ps[4].fcff * (1 + gRate)) / (w - gRate);
      sensitivityMatrix.push({ waccDelta: wd, growthDelta: gd, ev: ps.reduce((s, p) => s + p.discountedFcf, 0) + tv / Math.pow(1 + w, 5) });
    }
  }

  // KPIs
  const totalAssets = totalDebt + equity;
  const netIncome0 = (ebit0 - interestExpense) * (1 - taxRate / 100);
  const kpis: CanonicalKPIs = {
    grossMargin: ((revenue - costOfSales) / revenue) * 100,
    ebitdaMargin,
    ebitMargin: (ebit0 / revenue) * 100,
    netMargin: (netIncome0 / revenue) * 100,
    roe: equity > 0 ? (netIncome0 / equity) * 100 : 0,
    roa: totalAssets > 0 ? (netIncome0 / totalAssets) * 100 : 0,
    netDebt,
    leverage: ebitda0 > 0 ? netDebt / ebitda0 : 0,
    interestCoverage: interestExpense > 0 ? ebit0 / interestExpense : 0,
  };

  // Scenarios — NO varía capexPct/wcPct por escenario (ver nota de
  // reversión arriba y en ejecutar-calculo/index.ts).
  const mkScenario = (gMod: number, mMod: number, wMod: number, tg: number): ScenarioResult => {
    const sG = growth * gMod, sM = ebitdaMargin + mMod, sW = (waccPct + wMod) / 100;
    const sP = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, sG, sM, capexPct, wcPct, sW);
    const sTg = tg / 100;
    let sEV = 0;
    if (sW > sTg) {
      const sTV = (sP[4].fcff * (1 + sTg)) / (sW - sTg);
      sEV = sP.reduce((s, p) => s + p.discountedFcf, 0) + sTV / Math.pow(1 + sW, 5);
    }
    return { projections: sP, ev: sEV, assumptions: { growth: sG, ebitdaMargin: sM, wacc: waccPct + wMod, terminalGrowth: tg } };
  };

  const pessimistic = mkScenario(0.6, -3, 1.5, 2);
  const optimistic = mkScenario(1.4, 3, -1.5, 4);

  return {
    projections,
    scenarios: {
      pessimistic: { ...pessimistic, label: "Pesimista" },
      base: { projections, ev: enterpriseValue, assumptions: { growth, ebitdaMargin, wacc: waccPct, terminalGrowth }, label: "Base" },
      optimistic: { ...optimistic, label: "Optimista" },
    },
    kpis,
    valuation: {
      betaLevered,
      costOfEquity: costOfEquityPct,
      costOfDebtAfterTax: costOfDebtAfterTaxPct,
      wacc: waccPct,
      terminalValue,
      discountedTV,
      enterpriseValue,
      netDebt,
      equityValue,
      evLow,
      evHigh,
      evEbitda,
      evRevenue,
      waccWarning,
    },
    sensitivityMatrix,
    sectorBenchmark: bench,
    moneda: input.moneda_analisis || "COP",
    factor_conversion: input.factor_conversion || 1,
  };
}
