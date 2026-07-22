// Velarix Financial Engine v2.2 — CFA-standard institutional logic
// All calculations run client-side — deterministic, no AI
// Data updated: January 2026 (Damodaran) / March 2026 (Macro)

export interface SectorBenchmark {
  label: string;
  beta: number;
  ebitdaMargin: number;
  evEbitda: number;
  evRevenue: number;
  waccRef: number;
  source: string;
  lastUpdated: string;
  vigenteHasta: string;
}

export const SECTOR_BENCHMARKS: Record<string, SectorBenchmark> = {
  "Software / Tecnología": {
    label: "Software / Tecnología",
    beta: 1.22, ebitdaMargin: 26, evEbitda: 13, evRevenue: 4.8, waccRef: 11.2,
    source: "Damodaran — Software (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Retail / Comercio": {
    label: "Retail / Comercio",
    beta: 1.08, ebitdaMargin: 18.5, evEbitda: 9.5, evRevenue: 2.2, waccRef: 10.2,
    source: "Damodaran — Retail (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Servicios empresariales": {
    label: "Servicios empresariales",
    beta: 0.98, ebitdaMargin: 20.5, evEbitda: 10.5, evRevenue: 2.6, waccRef: 9.6,
    source: "Damodaran — Business Services (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Manufactura": {
    label: "Manufactura",
    beta: 1.18, ebitdaMargin: 16.5, evEbitda: 8.5, evRevenue: 1.9, waccRef: 10.6,
    source: "Damodaran — Manufacturing (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Consumo": {
    label: "Consumo / Consumer Products",
    beta: 0.93, ebitdaMargin: 22.5, evEbitda: 11.5, evRevenue: 3.1, waccRef: 9.1,
    source: "Damodaran — Consumer Products (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Alimentos y bebidas": {
    label: "Alimentos y bebidas",
    beta: 0.78, ebitdaMargin: 18.5, evEbitda: 10.5, evRevenue: 2.3, waccRef: 9.1,
    source: "Damodaran — Food Processing + Beverage (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Agroindustria": {
    label: "Agroindustria",
    beta: 0.83, ebitdaMargin: 15.5, evEbitda: 8.5, evRevenue: 1.6, waccRef: 9.6,
    source: "Damodaran — Farming/Agriculture (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Salud": {
    label: "Salud",
    beta: 0.88, ebitdaMargin: 20.5, evEbitda: 11.5, evRevenue: 2.9, waccRef: 9.6,
    source: "Damodaran — Healthcare (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Educación": {
    label: "Educación",
    beta: 0.73, ebitdaMargin: 18.5, evEbitda: 9.5, evRevenue: 2.1, waccRef: 8.6,
    source: "Damodaran — Education (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Transporte y logística": {
    label: "Transporte y logística",
    beta: 1.03, ebitdaMargin: 14.5, evEbitda: 8.5, evRevenue: 1.7, waccRef: 10.1,
    source: "Damodaran — Transportation (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Construcción e infraestructura": {
    label: "Construcción e infraestructura",
    beta: 1.13, ebitdaMargin: 13.5, evEbitda: 7.5, evRevenue: 1.5, waccRef: 10.6,
    source: "Damodaran — Construction (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Energía y utilities": {
    label: "Energía y utilities",
    beta: 0.52, ebitdaMargin: 36, evEbitda: 9.5, evRevenue: 3.1, waccRef: 8.1,
    source: "Damodaran — Utilities/Power (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Turismo y hospitalidad": {
    label: "Turismo y hospitalidad",
    beta: 1.28, ebitdaMargin: 16.5, evEbitda: 9.5, evRevenue: 2.1, waccRef: 11.1,
    source: "Damodaran — Hotels/Restaurants (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Inmobiliario": {
    label: "Inmobiliario",
    beta: 0.68, ebitdaMargin: 41, evEbitda: 13.5, evRevenue: 5.2, waccRef: 8.6,
    source: "Damodaran — Real Estate (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
  "Financiero / Seguros": {
    label: "Financiero / Seguros",
    beta: 0.83, ebitdaMargin: 31, evEbitda: 10.5, evRevenue: 3.6, waccRef: 9.1,
    source: "Damodaran — Banks/Insurance (Global) Jan 2026", lastUpdated: "2026-01", vigenteHasta: "2026-12-31"
  },
};

export const SECTOR_KEYS = Object.keys(SECTOR_BENCHMARKS);

export interface FinancialInputs {
  companyName: string;
  sector: string;
  // Historical (Year 0)
  revenue: number;
  costOfSales: number;
  opex: number;
  depreciation: number;
  totalDebt: number;
  cash: number;
  equity: number;
  interestExpense: number;
  // Assumptions
  growth: number;           // %
  ebitdaMargin: number;     // %
  taxRate: number;           // %
  capexPct: number;          // %
  wcPct: number;             // %
  terminalGrowth: number;    // %
  diasMinCaja: number;       // days
  // Market
  costOfDebt: number;        // %
  riskFreeRate: number;      // %
  erp: number;               // %
  equityWeight: number;      // decimal
  debtWeight: number;        // decimal
}

export const DEFAULT_INPUTS: FinancialInputs = {
  companyName: "Empresa Demo",
  sector: "Software / Tecnología",
  revenue: 3_000_000,
  costOfSales: 1_350_000,
  opex: 300_000,
  depreciation: 90_000,
  totalDebt: 500_000,
  cash: 150_000,
  equity: 1_200_000,
  interestExpense: 40_000,
  growth: 25,
  ebitdaMargin: 22,
  taxRate: 30,
  capexPct: 5,
  wcPct: 3,
  terminalGrowth: 3,
  diasMinCaja: 15,
  costOfDebt: 8,
  riskFreeRate: 4.35,   // Updated: US Treasury 10Y Feb 2026
  erp: 5.80,            // Updated: Damodaran ERP Emerging Markets Jan 2026
  equityWeight: 0.70,
  debtWeight: 0.30,
};

// === KPI Interfaces ===
export interface KPIResult {
  grossMargin: number;
  ebitdaMargin: number;
  ebitMargin: number;
  netMargin: number;
  roe: number;
  roa: number;
  revenueGrowth: number;
  netDebt: number;
  leverage: number;
  interestCoverage: number;
  daysReceivable: number;
  daysInventory: number;
  daysPayable: number;
  cashCycle: number;
  cajaMinima: number;
}

// === Projection Interfaces ===
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
  // FCFF
  nopat: number;
  capex: number;
  deltaWC: number;
  fcff: number;
  discountedFcf: number;
}

export interface ScenarioAssumptions {
  label: string;
  growth: number;
  ebitdaMargin: number;
  capexPct: number;
  wcPct: number;
  wacc: number;
  terminalGrowth: number;
}

export interface AnalysisResult {
  projections: YearProjection[];
  scenarios: { pessimistic: YearProjection[]; base: YearProjection[]; optimistic: YearProjection[] };
  scenarioAssumptions: { pessimistic: ScenarioAssumptions; base: ScenarioAssumptions; optimistic: ScenarioAssumptions };
  kpis: KPIResult;
  betaLevered: number;
  costOfEquity: number;
  costOfDebtAfterTax: number;
  wacc: number; // as percentage
  terminalValue: number;
  discountedTV: number;
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  evLow: number;
  evHigh: number;
  evEbitda: number;
  evRevenue: number;
  sectorBenchmark: SectorBenchmark;
  sensitivityMatrix: { waccDelta: number; growthDelta: number; ev: number }[];
  scenarioEVs: { pessimistic: number; base: number; optimistic: number };
  waccWarning: string | null;
}

// === Helper: compute projections for given assumptions ===
function computeProjections(
  inputs: FinancialInputs,
  growth: number,
  ebitdaMargin: number,
  capexPct: number,
  wcPct: number,
  waccDecimal: number,
): YearProjection[] {
  const costRatio = inputs.costOfSales / inputs.revenue;
  const projections: YearProjection[] = [];

  for (let t = 1; t <= 5; t++) {
    const revenue = inputs.revenue * Math.pow(1 + growth / 100, t);
    const costOfSales = revenue * costRatio;
    const grossProfit = revenue - costOfSales;
    const ebitda = revenue * (ebitdaMargin / 100);
    const depreciation = revenue * 0.03; // DA as % of revenue (demo)
    const ebit = ebitda - depreciation;
    const interest = inputs.totalDebt * (inputs.costOfDebt / 100);
    const ebt = ebit - interest;
    const taxes = Math.max(ebt, 0) * (inputs.taxRate / 100);
    const netIncome = ebt - taxes;

    // FCFF (CFA standard)
    const taxOnEBIT = ebit * (inputs.taxRate / 100);
    const nopat = ebit - taxOnEBIT;
    const capex = revenue * (capexPct / 100);
    const deltaWC = revenue * (wcPct / 100);
    const fcff = nopat + depreciation - capex - deltaWC;
    const discountedFcf = fcff / Math.pow(1 + waccDecimal, t);

    projections.push({
      year: t, revenue, costOfSales, grossProfit, ebitda, depreciation,
      ebit, interest, ebt, taxes, netIncome, nopat, capex, deltaWC, fcff, discountedFcf,
    });
  }
  return projections;
}

// === Main Analysis ===
export function runAnalysis(inputs: FinancialInputs): AnalysisResult {
  const benchmark = SECTOR_BENCHMARKS[inputs.sector] || SECTOR_BENCHMARKS["Software / Tecnología"];
  const betaUnlevered = benchmark.beta;

  // Re-lever beta (Hamada Equation)
  const deRatio = inputs.debtWeight / inputs.equityWeight;
  const betaLevered = betaUnlevered * (1 + (1 - inputs.taxRate / 100) * deRatio);

  // CAPM
  const costOfEquity = inputs.riskFreeRate / 100 + betaLevered * (inputs.erp / 100);
  const costOfDebtAfterTax = (inputs.costOfDebt / 100) * (1 - inputs.taxRate / 100);

  // WACC
  const waccDecimal = costOfEquity * inputs.equityWeight + costOfDebtAfterTax * inputs.debtWeight;
  const waccPct = waccDecimal * 100;

  // Base projections
  const projections = computeProjections(inputs, inputs.growth, inputs.ebitdaMargin, inputs.capexPct, inputs.wcPct, waccDecimal);

  // Terminal value with WACC > g validation
  const g = inputs.terminalGrowth / 100;
  const lastFCFF = projections[4].fcff;
  let terminalValue = 0;
  let discountedTV = 0;
  let waccWarning: string | null = null;

  if (waccDecimal <= g) {
    waccWarning = "El WACC debe ser superior al crecimiento terminal para que el modelo DCF sea válido. Ajusta los parámetros para continuar.";
  } else {
    terminalValue = (lastFCFF * (1 + g)) / (waccDecimal - g);
    discountedTV = terminalValue / Math.pow(1 + waccDecimal, 5);
  }

  const sumDiscountedFCFF = projections.reduce((s, p) => s + p.discountedFcf, 0);
  const enterpriseValue = sumDiscountedFCFF + discountedTV;

  // Net debt & equity value
  const netDebt = inputs.totalDebt - inputs.cash;
  const equityValue = Math.max(enterpriseValue - netDebt, 0);

  // Sensitivity range ±1% WACC
  const waccLow = waccDecimal - 0.01;
  const waccHigh = waccDecimal + 0.01;
  const projsLow = computeProjections(inputs, inputs.growth, inputs.ebitdaMargin, inputs.capexPct, inputs.wcPct, waccLow);
  const projsHigh = computeProjections(inputs, inputs.growth, inputs.ebitdaMargin, inputs.capexPct, inputs.wcPct, waccHigh);

  let evLow = 0;
  let evHigh = 0;
  if (waccHigh > g) {
    const tvHigh = (projsHigh[4].fcff * (1 + g)) / (waccHigh - g);
    evLow = projsHigh.reduce((s, p) => s + p.discountedFcf, 0) + tvHigh / Math.pow(1 + waccHigh, 5);
  }
  if (waccLow > g) {
    const tvLow = (projsLow[4].fcff * (1 + g)) / (waccLow - g);
    evHigh = projsLow.reduce((s, p) => s + p.discountedFcf, 0) + tvLow / Math.pow(1 + waccLow, 5);
  }

  // Implied multiples (forward Y1)
  const evEbitda = projections[0].ebitda > 0 ? enterpriseValue / projections[0].ebitda : 0;
  const evRevenue = projections[0].revenue > 0 ? enterpriseValue / projections[0].revenue : 0;

  // Sensitivity matrix 5×5
  const sensitivityMatrix: { waccDelta: number; growthDelta: number; ev: number }[] = [];
  for (const wd of [-2, -1, 0, 1, 2]) {
    for (const gd of [-2, -1, 0, 1, 2]) {
      const w = waccDecimal + wd / 100;
      const gRate = g + gd / 100;
      if (w <= gRate || w <= 0) { sensitivityMatrix.push({ waccDelta: wd, growthDelta: gd, ev: 0 }); continue; }
      const projs = computeProjections(inputs, inputs.growth, inputs.ebitdaMargin, inputs.capexPct, inputs.wcPct, w);
      const tv = (projs[4].fcff * (1 + gRate)) / (w - gRate);
      const ev = projs.reduce((s, p) => s + p.discountedFcf, 0) + tv / Math.pow(1 + w, 5);
      sensitivityMatrix.push({ waccDelta: wd, growthDelta: gd, ev });
    }
  }

  // KPIs
  const ebitda0 = inputs.revenue - inputs.costOfSales - inputs.opex + inputs.depreciation;
  const ebit0 = ebitda0 - inputs.depreciation;
  const netIncome0 = (ebit0 - inputs.interestExpense) * (1 - inputs.taxRate / 100);
  const totalAssets = inputs.totalDebt + inputs.equity;
  const cajaMinima = (inputs.revenue / 360) * inputs.diasMinCaja;

  const kpis: KPIResult = {
    grossMargin: ((inputs.revenue - inputs.costOfSales) / inputs.revenue) * 100,
    ebitdaMargin: (ebitda0 / inputs.revenue) * 100,
    ebitMargin: (ebit0 / inputs.revenue) * 100,
    netMargin: (netIncome0 / inputs.revenue) * 100,
    roe: inputs.equity > 0 ? (netIncome0 / inputs.equity) * 100 : 0,
    roa: totalAssets > 0 ? (netIncome0 / totalAssets) * 100 : 0,
    revenueGrowth: inputs.growth,
    netDebt: inputs.totalDebt - inputs.cash,
    leverage: ebitda0 > 0 ? (inputs.totalDebt - inputs.cash) / ebitda0 : 0,
    interestCoverage: inputs.interestExpense > 0 ? ebit0 / inputs.interestExpense : 0,
    daysReceivable: 45,
    daysInventory: 30,
    daysPayable: 35,
    cashCycle: 45 + 30 - 35,
    cajaMinima,
  };

  // Scenarios
  const scenarioAssumptions = {
    pessimistic: {
      label: "Pesimista",
      growth: inputs.growth * 0.60,
      ebitdaMargin: inputs.ebitdaMargin - 3,
      capexPct: inputs.capexPct + 2,
      wcPct: inputs.wcPct + 1,
      wacc: waccPct + 1.5,
      terminalGrowth: 2,
    },
    base: {
      label: "Base",
      growth: inputs.growth,
      ebitdaMargin: inputs.ebitdaMargin,
      capexPct: inputs.capexPct,
      wcPct: inputs.wcPct,
      wacc: waccPct,
      terminalGrowth: inputs.terminalGrowth,
    },
    optimistic: {
      label: "Optimista",
      growth: inputs.growth * 1.40,
      ebitdaMargin: inputs.ebitdaMargin + 3,
      capexPct: Math.max(inputs.capexPct - 1, 1),
      wcPct: Math.max(inputs.wcPct - 1, 1),
      wacc: waccPct - 1.5,
      terminalGrowth: 4,
    },
  };

  const calcScenarioEV = (sa: ScenarioAssumptions) => {
    const w = sa.wacc / 100;
    const gS = sa.terminalGrowth / 100;
    if (w <= gS) return 0;
    const p = computeProjections(inputs, sa.growth, sa.ebitdaMargin, sa.capexPct, sa.wcPct, w);
    const tv = (p[4].fcff * (1 + gS)) / (w - gS);
    return p.reduce((s, pr) => s + pr.discountedFcf, 0) + tv / Math.pow(1 + w, 5);
  };

  const scenarioEVs = {
    pessimistic: calcScenarioEV(scenarioAssumptions.pessimistic),
    base: enterpriseValue,
    optimistic: calcScenarioEV(scenarioAssumptions.optimistic),
  };

  const scenarios = {
    pessimistic: computeProjections(inputs, scenarioAssumptions.pessimistic.growth, scenarioAssumptions.pessimistic.ebitdaMargin, scenarioAssumptions.pessimistic.capexPct, scenarioAssumptions.pessimistic.wcPct, scenarioAssumptions.pessimistic.wacc / 100),
    base: projections,
    optimistic: computeProjections(inputs, scenarioAssumptions.optimistic.growth, scenarioAssumptions.optimistic.ebitdaMargin, scenarioAssumptions.optimistic.capexPct, scenarioAssumptions.optimistic.wcPct, scenarioAssumptions.optimistic.wacc / 100),
  };

  return {
    projections,
    scenarios,
    scenarioAssumptions,
    kpis,
    betaLevered,
    costOfEquity: costOfEquity * 100,
    costOfDebtAfterTax: costOfDebtAfterTax * 100,
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
    sectorBenchmark: benchmark,
    sensitivityMatrix,
    scenarioEVs,
    waccWarning,
  };
}

export function quickValuation(revenue: number, growth: number, ebitdaMargin: number, sector: string) {
  const benchmark = SECTOR_BENCHMARKS[sector] || SECTOR_BENCHMARKS["Software / Tecnología"];
  const ebitda = revenue * (ebitdaMargin / 100);
  const evMultiple = ebitda * benchmark.evEbitda;
  const evRevMultiple = revenue * benchmark.evRevenue;
  const avg = (evMultiple + evRevMultiple) / 2;
  return {
    low: Math.round(avg * 0.85),
    high: Math.round(avg * 1.15),
    ebitda: Math.round(ebitda),
    multiple: benchmark.evEbitda,
    waccRef: benchmark.waccRef,
  };
}

export function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatCurrencyFull(n: number): string {
  return `USD ${n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatNumber(n: number, decimals = 1): string {
  return n.toLocaleString("es-CO", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// Normalization mapping (expanded)
export const NORMALIZATION_MAP = [
  { original: "Ventas / Revenue / Sales / Ingresos netos", normalized: "Ingresos" },
  { original: "COGS / Costos de ventas / Costo directo", normalized: "Costos" },
  { original: "SG&A / Gastos operativos / Gastos de administración", normalized: "Opex" },
  { original: "D&A / Depreciación / Amortización", normalized: "Depreciación (DA)" },
  { original: "EBIT / Utilidad operativa", normalized: "EBIT" },
  { original: "EBITDA / Resultado operativo bruto", normalized: "EBITDA" },
  { original: "Interest expense / Intereses financieros", normalized: "Intereses" },
  { original: "Income tax / Impuesto de renta", normalized: "Impuestos" },
  { original: "Cash / Caja / Efectivo / Disponible", normalized: "Caja" },
  { original: "Financial debt / Deuda financiera / Obligaciones", normalized: "Deuda" },
  { original: "Equity / Patrimonio / Capital contable", normalized: "Patrimonio" },
  { original: "Working capital / Capital de trabajo", normalized: "Capital de trabajo" },
  { original: "Free cash flow / Flujo de caja libre", normalized: "FCFF" },
];

// === Macro data — updated to March 2026 ===
export interface MacroSeries {
  label: string;
  source: string;
  frecuencia: string;
  ultimaActualizacion: string;
  proximaActualizacion: string;
  periods: string[];
  values: number[];
  valorActual: number;
  unidad: string;
}

export const MACRO_DATA: Record<string, MacroSeries> = {
  inflation: {
    label: "Inflación IPC (%)",
    source: "DANE",
    frecuencia: "mensual",
    ultimaActualizacion: "2026-02-28",
    proximaActualizacion: "2026-03-31",
    periods: ["2019", "2020", "2021", "2022", "2023", "2024", "Ene 25", "Jun 25", "Dic 25", "Feb 26"],
    values: [3.80, 1.61, 5.62, 13.12, 9.28, 5.20, 5.22, 4.71, 4.00, 3.88],
    valorActual: 3.88,
    unidad: "%",
  },
  policyRate: {
    label: "Tasa de política monetaria (%)",
    source: "Banco de la República",
    frecuencia: "mensual",
    ultimaActualizacion: "2026-03-15",
    proximaActualizacion: "2026-04-30",
    periods: ["2019", "2020", "2021", "2022", "2023", "Ene 24", "Jul 24", "Dic 24", "Sep 25", "Mar 26"],
    values: [4.25, 1.75, 3.00, 12.00, 13.25, 12.75, 10.75, 9.50, 8.25, 7.50],
    valorActual: 7.50,
    unidad: "%",
  },
  trm: {
    label: "TRM COP/USD (promedio)",
    source: "Banco de la República",
    frecuencia: "mensual",
    ultimaActualizacion: "2026-03-01",
    proximaActualizacion: "2026-04-01",
    periods: ["2019", "2020", "2021", "2022", "2023", "2024", "Mar 25", "Sep 25", "Dic 25", "Feb 26"],
    values: [3281, 3693, 3744, 4255, 4326, 4166, 4220, 4040, 3985, 4080],
    valorActual: 4080,
    unidad: "COP/USD",
  },
  gdpGrowth: {
    label: "Crecimiento PIB real (%)",
    source: "DANE",
    frecuencia: "trimestral",
    ultimaActualizacion: "2026-02-28",
    proximaActualizacion: "2026-05-31",
    periods: ["2019", "2020", "2021", "2022", "2023", "Q1 24", "Q3 24", "Q1 25", "Q3 25", "Q4 25"],
    values: [3.3, -7.0, 10.6, 7.3, 0.6, 1.2, 1.8, 2.3, 2.7, 2.8],
    valorActual: 2.8,
    unidad: "%",
  },
};

// === Market data — updated to March 2026 ===
export const MARKET_DATA = {
  riskFreeRate: {
    label: "Tasa libre de riesgo (US Treasury 10Y)",
    source: "US Treasury / FRED",
    frecuencia: "mensual",
    ultimaActualizacion: "2026-03-01",
    proximaActualizacion: "2026-04-01",
    valorActual: 4.35,
    unidad: "%",
  },
  erpEmergentes: {
    label: "ERP — mercados emergentes",
    source: "Damodaran — Country Risk Premium",
    frecuencia: "trimestral",
    ultimaActualizacion: "2026-01-15",
    proximaActualizacion: "2026-04-15",
    valorActual: 5.80,
    unidad: "%",
  },
  countryRiskColombia: {
    label: "Prima de riesgo país Colombia (EMBI)",
    source: "JP Morgan EMBI — Banco de la República",
    frecuencia: "semanal",
    ultimaActualizacion: "2026-03-20",
    proximaActualizacion: "2026-03-27",
    valorActual: 2.20,
    unidad: "%",
  },
};

// === Vigencia (freshness) system ===
export type VigenciaEstado = "verde" | "amarillo" | "rojo" | "desconocido";

const DIAS_VIGENCIA: Record<string, { verde: number; amarillo: number }> = {
  diario:     { verde: 1,   amarillo: 3   },
  semanal:    { verde: 7,   amarillo: 14  },
  mensual:    { verde: 31,  amarillo: 45  },
  trimestral: { verde: 92,  amarillo: 120 },
  anual:      { verde: 366, amarillo: 420 },
};

export interface VigenciaResult {
  estado: VigenciaEstado;
  dias: number;
  textoEstado: string;
}

export function evaluarVigencia(ultimaActualizacion: string, frecuencia: string): VigenciaResult {
  const hoy = new Date();
  const fechaUltima = new Date(ultimaActualizacion);
  const dias = Math.floor((hoy.getTime() - fechaUltima.getTime()) / (1000 * 60 * 60 * 24));

  const limites = DIAS_VIGENCIA[frecuencia];
  if (!limites) return { estado: "desconocido", dias, textoEstado: "Desconocido" };

  let estado: VigenciaEstado;
  if (dias <= limites.verde) estado = "verde";
  else if (dias <= limites.amarillo) estado = "amarillo";
  else estado = "rojo";

  const textos: Record<VigenciaEstado, string> = {
    verde: "Vigente",
    amarillo: "Por actualizar",
    rojo: "Desactualizado",
    desconocido: "Desconocido",
  };

  return { estado, dias, textoEstado: textos[estado] };
}

export function formatearFechaVigencia(fechaString: string): string {
  if (!fechaString) return "No disponible";
  const fecha = new Date(fechaString);
  const hoy = new Date();
  const dias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));

  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} sem.`;
  if (dias < 365) return `Hace ${Math.floor(dias / 30)} mes${dias < 60 ? "" : "es"}`;
  return fecha.toLocaleDateString("es-CO", { month: "short", year: "numeric" });
}

export interface VigenciaReportItem {
  parametro: string;
  fuente: string;
  frecuencia: string;
  ultimaActualizacion: string;
  proximaActualizacion: string;
  valorActual: number | null;
  unidad: string | null;
  categoria: string;
  estado: VigenciaEstado;
  dias: number;
  textoEstado: string;
}

export function evaluarVigenciaCompleta(): {
  reporte: VigenciaReportItem[];
  resumen: { verdes: number; amarillos: number; rojos: number; total: number };
  estadoGeneral: VigenciaEstado;
} {
  const reporte: VigenciaReportItem[] = [];

  // Macro Colombia
  Object.values(MACRO_DATA).forEach((param) => {
    const v = evaluarVigencia(param.ultimaActualizacion, param.frecuencia);
    reporte.push({
      parametro: param.label,
      fuente: param.source,
      frecuencia: param.frecuencia,
      ultimaActualizacion: param.ultimaActualizacion,
      proximaActualizacion: param.proximaActualizacion,
      valorActual: param.valorActual,
      unidad: param.unidad,
      categoria: "Macro Colombia",
      ...v,
    });
  });

  // Market global
  Object.values(MARKET_DATA).forEach((param) => {
    const v = evaluarVigencia(param.ultimaActualizacion, param.frecuencia);
    reporte.push({
      parametro: param.label,
      fuente: param.source,
      frecuencia: param.frecuencia,
      ultimaActualizacion: param.ultimaActualizacion,
      proximaActualizacion: param.proximaActualizacion,
      valorActual: param.valorActual,
      unidad: param.unidad,
      categoria: "Mercado global",
      ...v,
    });
  });

  // Damodaran sectorial (single entry)
  const dv = evaluarVigencia("2026-01-15", "anual");
  reporte.push({
    parametro: "Benchmarks sectoriales (Damodaran)",
    fuente: "Damodaran Industry Data Jan 2026",
    frecuencia: "anual",
    ultimaActualizacion: "2026-01-15",
    proximaActualizacion: "2027-01-15",
    valorActual: null,
    unidad: null,
    categoria: "Datos sectoriales",
    ...dv,
  });

  const verdes = reporte.filter((r) => r.estado === "verde").length;
  const amarillos = reporte.filter((r) => r.estado === "amarillo").length;
  const rojos = reporte.filter((r) => r.estado === "rojo").length;

  return {
    reporte,
    resumen: { verdes, amarillos, rojos, total: reporte.length },
    estadoGeneral: rojos > 0 ? "rojo" : amarillos > 0 ? "amarillo" : "verde",
  };
}

// Data integrity metadata — now dynamic with vigencia
export const DATA_INTEGRITY = [
  { source: "Damodaran (Global)", param: "Beta sectorial", frecuencia: "anual", lastUpdate: "Ene 2026", ultimaActualizacion: "2026-01-15" },
  { source: "Damodaran (Global)", param: "EV/EBITDA referencia", frecuencia: "anual", lastUpdate: "Ene 2026", ultimaActualizacion: "2026-01-15" },
  { source: "Damodaran (Global)", param: "Margen EBITDA sector", frecuencia: "anual", lastUpdate: "Ene 2026", ultimaActualizacion: "2026-01-15" },
  { source: "Damodaran (Global)", param: "ERP emergentes", frecuencia: "trimestral", lastUpdate: "Ene 2026", ultimaActualizacion: "2026-01-15" },
  { source: "Banco de la República", param: "Tasa de política", frecuencia: "mensual", lastUpdate: "Mar 2026", ultimaActualizacion: "2026-03-15" },
  { source: "DANE", param: "Inflación IPC", frecuencia: "mensual", lastUpdate: "Feb 2026", ultimaActualizacion: "2026-02-28" },
  { source: "DANE", param: "Crecimiento PIB", frecuencia: "trimestral", lastUpdate: "Feb 2026", ultimaActualizacion: "2026-02-28" },
  { source: "US Treasury", param: "Tasa libre de riesgo", frecuencia: "mensual", lastUpdate: "Mar 2026", ultimaActualizacion: "2026-03-01" },
  { source: "JP Morgan / Banrep", param: "EMBI Colombia", frecuencia: "semanal", lastUpdate: "Mar 2026", ultimaActualizacion: "2026-03-20" },
];
