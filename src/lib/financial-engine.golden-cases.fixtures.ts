// Bloque 1C-Prep — Casos dorados técnicos provisionales.
//
// "Caso dorado técnico provisional — pendiente de aprobación financiera."
// Estos 3 casos son sintéticos, diseñados para ejercitar el motor
// cliente (`runAnalysis`, la única función real e importable sin el
// bloqueo de Deno) en escenarios representativos. NINGUNO fue revisado
// ni aprobado por el fundador ni por un revisor financiero externo — no
// se declaran aprobados en ningún documento.

import type { FinancialInputs } from "./financial-engine";

export const CASO_A_ESTABLE: FinancialInputs = {
  companyName: "Caso Dorado A — Empresa estable y rentable",
  sector: "Servicios empresariales",
  reportingCurrency: "COP",
  revenue: 5_000_000_000,
  costOfSales: 3_000_000_000,
  opex: 800_000_000,
  depreciation: 150_000_000,
  totalDebt: 1_000_000_000,
  cash: 600_000_000,
  equity: 3_000_000_000,
  interestExpense: 80_000_000,
  growth: 12,
  ebitdaMargin: 22,
  taxRate: 30,
  capexPct: 5,
  wcPct: 3,
  terminalGrowth: 3,
  diasMinCaja: 15,
  costOfDebt: 8,
  riskFreeRate: 4.35,
  erp: 5.80,
  equityWeight: 0.75,
  debtWeight: 0.25,
};

export const CASO_B_ALTO_CRECIMIENTO: FinancialInputs = {
  companyName: "Caso Dorado B — Empresa de alto crecimiento",
  sector: "Software / Tecnología",
  reportingCurrency: "COP",
  revenue: 2_000_000_000,
  costOfSales: 900_000_000,
  opex: 700_000_000,
  depreciation: 40_000_000,
  totalDebt: 200_000_000,
  cash: 500_000_000,
  equity: 2_500_000_000,
  interestExpense: 15_000_000,
  growth: 45,
  ebitdaMargin: 18,
  taxRate: 30,
  capexPct: 15,
  wcPct: 8,
  terminalGrowth: 4,
  diasMinCaja: 10,
  costOfDebt: 8,
  riskFreeRate: 4.35,
  erp: 5.80,
  equityWeight: 0.90,
  debtWeight: 0.10,
};

export const CASO_C_TENSIONADA: FinancialInputs = {
  companyName: "Caso Dorado C — Empresa tensionada",
  sector: "Manufactura",
  reportingCurrency: "COP",
  revenue: 3_000_000_000,
  costOfSales: 2_700_000_000,
  opex: 500_000_000,
  depreciation: 100_000_000,
  totalDebt: 4_000_000_000,
  cash: 50_000_000,
  equity: -500_000_000, // patrimonio negativo, sintético
  interestExpense: 350_000_000,
  growth: 5,
  ebitdaMargin: -3,
  taxRate: 30,
  capexPct: 5,
  wcPct: 3,
  terminalGrowth: 2,
  diasMinCaja: 20,
  costOfDebt: 8,
  riskFreeRate: 4.35,
  erp: 5.80,
  equityWeight: 0.15,
  debtWeight: 0.85,
};
