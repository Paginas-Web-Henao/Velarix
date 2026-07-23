// Módulo puro compartido — Bloque 1B-P0, BL-05.
//
// Estructura de capital (peso equity/deuda, Hamada, CAPM, WACC, deuda
// neta) extraída de `ejecutar-calculo/index.ts::runEngine`. Extracción
// mínima y acotada: solo la parte afectada por el campo de deuda
// (`totalDebt`) — no se extraen proyecciones, valor terminal, matriz de
// sensibilidad ni escenarios, que quedan fuera del alcance de BL-05.
//
// Todas las tasas (`taxRatePct`, `costOfDebtPct`, `riskFreeRatePct`,
// `erpPct`) se expresan en escala porcentual (p. ej. `8` para 8%, no
// `0.08`), igual que las constantes de `ejecutar-calculo/index.ts`.

export interface CapitalStructureInput {
  totalDebt: number;
  cash: number;
  equity: number;
  sectorBetaUnlevered: number;
  taxRatePct: number;
  costOfDebtPct: number;
  riskFreeRatePct: number;
  erpPct: number;
  /** Peso de equity usado cuando `equity <= 0` (no se puede derivar de los saldos reales). Default 0.70, igual que el motor servidor hoy. */
  defaultEquityWeight?: number;
}

export interface CapitalStructureResult {
  equityWeight: number;
  debtWeight: number;
  betaLevered: number;
  costOfEquityPct: number;
  costOfDebtAfterTaxPct: number;
  waccPct: number;
  netDebt: number;
}

export function computeCapitalStructure(input: CapitalStructureInput): CapitalStructureResult {
  const {
    totalDebt,
    cash,
    equity,
    sectorBetaUnlevered,
    taxRatePct,
    costOfDebtPct,
    riskFreeRatePct,
    erpPct,
    defaultEquityWeight = 0.70,
  } = input;

  const equityWeight = equity > 0 ? equity / (equity + totalDebt) : defaultEquityWeight;
  const debtWeight = 1 - equityWeight;

  // Hamada — re-apalancamiento del beta sectorial
  const deRatio = debtWeight / equityWeight;
  const betaLevered = sectorBetaUnlevered * (1 + (1 - taxRatePct / 100) * deRatio);

  // CAPM
  const costOfEquityPct = riskFreeRatePct + betaLevered * erpPct;
  const costOfDebtAfterTaxPct = costOfDebtPct * (1 - taxRatePct / 100);

  // WACC
  const waccPct = costOfEquityPct * equityWeight + costOfDebtAfterTaxPct * debtWeight;

  const netDebt = totalDebt - cash;

  return { equityWeight, debtWeight, betaLevered, costOfEquityPct, costOfDebtAfterTaxPct, waccPct, netDebt };
}

/**
 * Resuelve el campo de deuda financiera total de un `balance_sheet` de
 * `structured_input`, con el orden explícito exigido por BL-05: nombre
 * canónico -> compatibilidad con nombres antiguos -> 0 solo cuando no
 * exista ninguna deuda válida. El `Math.abs` protege contra una
 * convención de signos inconsistente en el dato de origen.
 */
export function resolveFinancialDebtTotal(balanceSheet: {
  financial_debt_total?: number | null;
  total_debt?: number | null;
  financial_debt?: number | null;
}): number {
  return Math.abs(
    balanceSheet.financial_debt_total ??
      balanceSheet.total_debt ??
      balanceSheet.financial_debt ??
      0,
  );
}
