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
//
// La normalización del input efectivo (`Math.abs()` por campo, fallback
// de sector, fallback de crecimiento, fallback de moneda/factor) vive
// centralizada en `canonical-input-normalization.ts` desde el ajuste de
// semántica de fingerprint/procedencia (2026-07-23) — el fingerprint del
// input (`calculation-fingerprint.ts`) importa exactamente las mismas
// funciones, para que nunca puedan divergir. Mismas reglas de siempre,
// solo extraídas; ningún resultado de A/B/C cambia.

import { computeCapitalStructure, resolveFinancialDebtTotal } from "./capital-structure.ts";
import { CANONICAL_METHODOLOGY } from "./financial-methodology.ts";
import {
  SECTOR_BENCHMARKS,
  resolveEffectiveIncomeStatement,
  resolveEffectiveCash,
  resolveEffectiveEquity,
  resolveEffectiveSectorBenchmark,
  resolveEffectiveGrowth,
  resolveEffectiveMoneda,
  resolveEffectiveFactorConversion,
} from "./canonical-input-normalization.ts";
import type {
  ResolvedCalculationAssumptions,
  CapexReinvestmentDriverValue,
  DepreciationDaDriverValue,
} from "./resolved-calculation-assumptions.ts";

export { SECTOR_BENCHMARKS };

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
  /**
   * Bloque 3C.4 (RC-3/RC-4, `04 §6-§8`, `05 v1.3 §5-§6/§8`) — supuestos
   * metodológicos resueltos para esta ejecución. Legacy vs. v5 se
   * distingue por PRESENCIA de esta propiedad (`Object.hasOwnProperty`),
   * no por su valor — mismo patrón ya usado en
   * `calculation-preflight.ts` (3C.1) y `capital-structure.ts` (3C.2/
   * 3C.3). Nombre en `snake_case` porque describe el mismo
   * `structured_input` que persiste `build-structured-input/index.ts`
   * (todos sus demás campos son `snake_case`), no el estilo interno
   * `camelCase` del motor.
   */
  resolved_assumptions?: ResolvedCalculationAssumptions | null;
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
  /**
   * Bloque 3C.5 (cierre) — `null` cuando `scenarioWacc <= scenarioTerminalG`
   * (Gordon Growth no converge para este escenario): antes se representaba
   * como `0`, ambiguo con un Enterprise Value real y que además
   * descartaba el PV de los 5 FCFF explícitos ya calculados. `projections`
   * permanece siempre disponible — el escenario no converge en el
   * terminal, no dejó de tener flujo explícito. Mismo principio que
   * `CanonicalKPIs.roe` (3C.2): nunca fabricar un número plausible para
   * "no interpretable".
   */
  ev: number | null;
  assumptions: { growth: number; ebitdaMargin: number; wacc: number; terminalGrowth: number };
  label?: string;
}

export interface CanonicalKPIs {
  grossMargin: number;
  ebitdaMargin: number;
  ebitMargin: number;
  netMargin: number;
  /**
   * Bloque 3C.2 (`04 §3.2`, `05 v1.3 §4`) — `null` cuando `equity <= 0`:
   * no interpretable, y deliberadamente distinguible de un ROE real de
   * `0%`. No se infiere aquí ninguna causa del patrimonio no positivo
   * (`04 §17`).
   */
  roe: number | null;
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

/**
 * Bloque 3C.4 — drivers de forecast resueltos por Judgment (`04 §6-§8`,
 * `05 v1.3 §6/§8`) que reemplazan, SOLO para `nopat`/`depreciation`/
 * `capex`/`deltaWC` (los términos de FCFF), los porcentajes legacy
 * globales — cuando están presentes. `taxes`/`netIncome`/`interest`
 * (líneas contables, no de FCFF — `04 §6`: "el interés no se resta")
 * permanecen sobre la tasa/costo de deuda legacy en ambos casos; no son
 * parte del alcance de este bloque.
 */
interface V5ProjectionDrivers {
  /** `taxTreatment.value.explicitFcffTaxRatePctByYear` — NUNCA `debtTaxShieldRatePct` (WACC) ni `marginalRatePct` (no sustituye el path explícito), `04 §6.3/§6.4`, `05 v1.3 §6`. Longitud 5, índice `t-1`. */
  explicitFcffTaxRatePctByYear: number[];
  capexDriver: CapexReinvestmentDriverValue;
  depreciationDriver: DepreciationDaDriverValue;
  /** `workingCapitalDriver.value.explicitDeltaNwcByYear` — consumido literalmente, nunca recalculado como `% revenue` (`05 v1.3 §3/§8`). Longitud 5, índice `t-1`. */
  explicitDeltaNwcByYear: number[];
}

function computeProjections(
  revenue0: number, costRatio: number, totalDebt: number, costOfDebt: number,
  taxRate: number, growth: number, ebitdaMargin: number, capexPct: number,
  wcPct: number, waccDecimal: number, v5?: V5ProjectionDrivers
): YearProjection[] {
  const projections: YearProjection[] = [];
  for (let t = 1; t <= 5; t++) {
    const revenue = revenue0 * Math.pow(1 + growth / 100, t);
    const costOfSales = revenue * costRatio;
    const grossProfit = revenue - costOfSales;
    const ebitda = revenue * (ebitdaMargin / 100);
    const depreciation = v5
      ? (v5.depreciationDriver.mode === "explicit_path"
          ? v5.depreciationDriver.explicitPath[t - 1]
          : revenue * (v5.depreciationDriver.daPctOfRevenue / 100))
      : revenue * (CANONICAL_METHODOLOGY.assumptions.depreciationPctOfRevenue.value / 100);
    const ebit = ebitda - depreciation;
    const interest = totalDebt * (costOfDebt / 100);
    const ebt = ebit - interest;
    const taxes = Math.max(ebt, 0) * (taxRate / 100);
    const netIncome = ebt - taxes;
    const nopatTaxRatePct = v5 ? v5.explicitFcffTaxRatePctByYear[t - 1] : taxRate;
    const nopat = ebit - ebit * (nopatTaxRatePct / 100);
    const capex = v5
      ? (v5.capexDriver.mode === "explicit_path"
          ? v5.capexDriver.explicitPath[t - 1]
          : revenue * (v5.capexDriver.capexPctOfRevenue / 100))
      : revenue * (capexPct / 100);
    const deltaWC = v5 ? v5.explicitDeltaNwcByYear[t - 1] : revenue * (wcPct / 100);
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
  const bench = resolveEffectiveSectorBenchmark(sector);
  const { revenue, costOfSales, opex, da, interestExpense } = resolveEffectiveIncomeStatement(input.income_statement);

  const totalDebt = resolveFinancialDebtTotal(input.balance_sheet || {});
  const cash = resolveEffectiveCash(input.balance_sheet);
  const equity = resolveEffectiveEquity(input.balance_sheet);

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

  // Legacy vs. v5: por presencia de la clave `resolved_assumptions` en
  // `input`, no por su valor — mismo patrón que `capital-structure.ts`
  // (3C.2/3C.3) y `calculation-preflight.ts` (3C.1).
  const isV5Execution = Object.prototype.hasOwnProperty.call(input, "resolved_assumptions");
  const resolved = input.resolved_assumptions;

  const capitalStructure = computeCapitalStructure({
    totalDebt, cash, equity,
    sectorBetaUnlevered: bench.beta,
    taxRatePct: taxRate,
    costOfDebtPct: costOfDebt,
    riskFreeRatePct: riskFreeRate,
    erpPct: erp,
    // Propaga la MISMA presencia de clave — `computeCapitalStructure` ya
    // implementa RC-2/RC-3 (3C.2/3C.3): pesos, Ke y WACC completos desde
    // `resolvedAssumptions` cuando la clave está presente, o lanza si el
    // contrato v5 está incompleto. Nunca cae al cálculo legacy en v5.
    ...(isV5Execution ? { resolvedAssumptions: resolved } : {}),
  });
  const { betaLevered, costOfEquityPct, costOfDebtAfterTaxPct, waccPct, netDebt } = capitalStructure;
  const waccDecimal = waccPct / 100;

  const growth = resolveEffectiveGrowth(expectedGrowth);

  // Projections — Bloque 3C.4 (RC-4, `04 §6-§8`, `05 v1.3 §6/§8`): en v5,
  // NOPAT/CAPEX/D&A/ΔWC consumen los drivers resueltos; nunca caen
  // silenciosamente a los porcentajes legacy de `CANONICAL_METHODOLOGY`.
  // El horizonte de proyección sigue fijo en 5 años (ya validado por el
  // preflight v5 de 3C.1) — no se implementa horizonte dinámico aquí.
  //
  // Bloque 3C.5 (cierre) — `v5Drivers` se extrae UNA vez y se reutiliza
  // tanto para las proyecciones del caso base como para las de
  // `mkScenario` (más abajo): antes, los escenarios pesimista/optimista
  // llamaban a `computeProjections` sin este argumento, así que una
  // ejecución v5 terminaba usando tax/CAPEX/D&A/ΔWC LEGACY dentro de
  // `scenarios.pessimistic`/`scenarios.optimistic` — exactamente el
  // fallback silencioso que `04 §6-§8`/`05 v1.3 §6` prohíben. Los
  // modificadores de escenario (growth/margen/WACC) no cambian — solo se
  // corrige qué drivers de reinversión/impuestos alimentan su FCFF.
  let v5Drivers: V5ProjectionDrivers | undefined;
  if (isV5Execution) {
    const explicitFcffTaxRatePctByYear = resolved?.taxTreatment?.value?.explicitFcffTaxRatePctByYear;
    const capexDriver = resolved?.capexReinvestmentDriver?.value;
    const depreciationDriver = resolved?.depreciationDaDriver?.value;
    const explicitDeltaNwcByYear = resolved?.workingCapitalDriver?.value?.explicitDeltaNwcByYear;

    const missing: string[] = [];
    if (!explicitFcffTaxRatePctByYear) missing.push("taxTreatment.explicitFcffTaxRatePctByYear");
    if (!capexDriver) missing.push("capexReinvestmentDriver");
    if (!depreciationDriver) missing.push("depreciationDaDriver");
    if (!explicitDeltaNwcByYear) missing.push("workingCapitalDriver.explicitDeltaNwcByYear");
    if (missing.length > 0) {
      throw new Error(
        `runCanonicalFinancialEngine: ejecución v5 sin todos los drivers de forecast resueltos (05 v1.3 §5/§6) — faltan: ${missing.join(", ")}.`,
      );
    }

    v5Drivers = {
      explicitFcffTaxRatePctByYear: explicitFcffTaxRatePctByYear as number[],
      capexDriver: capexDriver as CapexReinvestmentDriverValue,
      depreciationDriver: depreciationDriver as DepreciationDaDriverValue,
      explicitDeltaNwcByYear: explicitDeltaNwcByYear as number[],
    };
  }
  const projections = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, waccDecimal, v5Drivers);

  // Terminal value — Bloque 3C.5 (RC-3, `04 §11`, `05 v1.3 §5/§6`): en
  // v5, `g` viene EXCLUSIVAMENTE de `resolvedAssumptions.terminalG.value.
  // valuePct` — nunca del `terminalGrowthPct` legacy de
  // `CANONICAL_METHODOLOGY`, ni de un fallback silencioso al 3%/2%/4%.
  // El terminal value parte del FCFF_5 ya calculado (por la rama
  // legacy o v5 de `computeProjections` de arriba, sin recalcularlo aquí)
  // — no se introduce un NOPAT terminal ni un FCFF terminal normalizado
  // distinto (`04 §11` no lo exige; ampliarlo sería scope de un bloque
  // futuro, no de 3C.5). La guardia `WACC <= g` reutiliza EXACTAMENTE el
  // mecanismo ya existente (`waccWarning` + `terminalValue`/`discountedTV`
  // en `0`, nunca `NaN`) — `04 §11` ya la documenta como "verificación ya
  // implementada" y `05 v1.3 §5` pide mantenerla donde ya vive
  // correctamente, no duplicarla. `evLow`/`evHigh`/`sensitivityMatrix`
  // (más abajo) reutilizan esta MISMA variable `g` — a diferencia de
  // capexPct/wcPct/taxRate (3C.4), que sí requieren un argumento v5
  // aparte para cada llamada de sensibilidad y permanecen en su versión
  // legacy en esas rutas (fuera de alcance), `g` nunca tuvo esa
  // duplicación: es un único escalar ya resuelto arriba, así que la
  // sensibilidad de WACC/g hereda automáticamente el `g` v5 sin código
  // adicional — comportamiento correcto, no una inconsistencia. Los
  // escenarios (`mkScenario`, más abajo) usan su PROPIO g de escenario
  // (pesimista/optimista) — en v5 viene de
  // `terminalG.pessimisticScenarioPct`/`optimisticScenarioPct` resueltos,
  // nunca del hardcode legacy 2%/4% (ver bloque de scenarios más abajo).
  let terminalGResolvedPct: number | undefined;
  if (isV5Execution) {
    terminalGResolvedPct = resolved?.terminalG?.value?.valuePct;
    if (terminalGResolvedPct === undefined || terminalGResolvedPct === null) {
      throw new Error(
        "runCanonicalFinancialEngine: ejecución v5 sin terminalG resuelto (05 v1.3 §5/§6) — falta: terminalG.valuePct.",
      );
    }
  }
  const g = isV5Execution ? (terminalGResolvedPct as number) / 100 : terminalGrowth / 100;
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

  // Sensitivity ±1% WACC — Bloque 3C.5 (cierre, extendido en 4F.6B):
  // mismo `v5Drivers` ya resuelto arriba para el caso base, para que una
  // ejecución v5 no recalcule esta sensibilidad con tax/CAPEX/D&A/ΔWC
  // legacy (exactamente el fallback silencioso ya corregido para
  // `scenarios.pessimistic`/`optimistic` en `mkScenario`, más abajo, pero
  // que no se había extendido aquí — confirmado con diferencia exacta 0
  // contra un cross-check independiente en la auditoría 4F.6A).
  let evLow = 0, evHigh = 0;
  const wL = waccDecimal - 0.01, wH = waccDecimal + 0.01;
  if (wH > g) {
    const pH = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, wH, v5Drivers);
    const tvH = (pH[4].fcff * (1 + g)) / (wH - g);
    evLow = pH.reduce((s, p) => s + p.discountedFcf, 0) + tvH / Math.pow(1 + wH, 5);
  }
  if (wL > g) {
    const pL = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, wL, v5Drivers);
    const tvL = (pL[4].fcff * (1 + g)) / (wL - g);
    evHigh = pL.reduce((s, p) => s + p.discountedFcf, 0) + tvL / Math.pow(1 + wL, 5);
  }

  // Multiples
  const evEbitda = projections[0].ebitda > 0 ? enterpriseValue / projections[0].ebitda : 0;
  const evRevenue = projections[0].revenue > 0 ? enterpriseValue / projections[0].revenue : 0;

  // Sensitivity matrix 5x5 — mismo `v5Drivers`, misma razón que evLow/evHigh arriba.
  const sensitivityMatrix: { waccDelta: number; growthDelta: number; ev: number }[] = [];
  for (const wd of [-2, -1, 0, 1, 2]) {
    for (const gd of [-2, -1, 0, 1, 2]) {
      const w = waccDecimal + wd / 100;
      const gRate = g + gd / 100;
      if (w <= gRate || w <= 0) { sensitivityMatrix.push({ waccDelta: wd, growthDelta: gd, ev: 0 }); continue; }
      const ps = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, w, v5Drivers);
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
    roe: equity > 0 ? (netIncome0 / equity) * 100 : null,
    roa: totalAssets > 0 ? (netIncome0 / totalAssets) * 100 : 0,
    netDebt,
    leverage: ebitda0 > 0 ? netDebt / ebitda0 : 0,
    interestCoverage: interestExpense > 0 ? ebit0 / interestExpense : 0,
  };

  // Scenarios — NO varía capexPct/wcPct/taxRate LEGACY por escenario (ver
  // nota de reversión arriba y en ejecutar-calculo/index.ts) — siguen
  // pasándose como argumentos porque `computeProjections` los usa para
  // `taxes`/`netIncome`/`interest` (líneas contables, no de FCFF) incluso
  // en v5. Bloque 3C.5 (cierre): `v5Drivers` (el MISMO objeto ya resuelto
  // arriba para el caso base) se pasa también aquí — antes no se pasaba,
  // así que una ejecución v5 terminaba calculando el FCFF de
  // `scenarios.pessimistic`/`optimistic` con tax/CAPEX/D&A/ΔWC legacy,
  // exactamente el fallback silencioso prohibido por `05 v1.3 §6`.
  //
  // `sEV: number | null` — antes `sEV = 0` cuando `sW <= sTg`, ambiguo
  // con un Enterprise Value real y que además descartaba el PV de los 5
  // FCFF explícitos (`sSumDCF` ahora se calcula SIEMPRE, fuera del if).
  // `null` es la representación explícita de "no interpretable" (mismo
  // principio que `CanonicalKPIs.roe`, 3C.2) — nunca `NaN`, nunca un
  // clamp, nunca se ajusta `g`/WACC automáticamente. `sP` (las
  // proyecciones de 5 años del escenario) permanecen siempre disponibles
  // — el escenario no converge en el terminal, no en el horizonte
  // explícito.
  const mkScenario = (gMod: number, mMod: number, wMod: number, tg: number): ScenarioResult => {
    const sG = growth * gMod, sM = ebitdaMargin + mMod, sW = (waccPct + wMod) / 100;
    const sP = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, sG, sM, capexPct, wcPct, sW, v5Drivers);
    const sTg = tg / 100;
    const sSumDCF = sP.reduce((s, p) => s + p.discountedFcf, 0);
    let sEV: number | null = null;
    if (sW > sTg) {
      const sTV = (sP[4].fcff * (1 + sTg)) / (sW - sTg);
      sEV = sSumDCF + sTV / Math.pow(1 + sW, 5);
    }
    return { projections: sP, ev: sEV, assumptions: { growth: sG, ebitdaMargin: sM, wacc: waccPct + wMod, terminalGrowth: tg } };
  };

  // Bloque 3C.5 (cierre) — `04 §11`: "Cualquier g de escenario
  // (pesimista/optimista) debe derivarse explícitamente del g base con
  // lógica documentada — nunca ser un literal sin relación declarada".
  // El contrato (`TerminalGValue`) YA representa estructuralmente esos
  // dos valores (`pessimisticScenarioPct`/`optimisticScenarioPct`,
  // opcionales junto a `valuePct` base) — la derivación documentada vive
  // en el `rationale` de la entrada resuelta (`04 §16`), no en una
  // fórmula del motor. El motor solo CONSUME los tres números ya
  // resueltos — no deriva nada él mismo, mismo principio que CAPEX/D&A/
  // ΔWC (3C.4). En v5, nunca caen silenciosamente a los literales legacy
  // 2%/4% — si el caso resolvió `terminalG` pero no sus dos escenarios,
  // se lanza explícitamente en vez de fabricar un valor.
  let pessimisticTg: number;
  let optimisticTg: number;
  if (isV5Execution) {
    const pessimisticScenarioPct = resolved?.terminalG?.value?.pessimisticScenarioPct;
    const optimisticScenarioPct = resolved?.terminalG?.value?.optimisticScenarioPct;
    const missingScenarioG: string[] = [];
    if (pessimisticScenarioPct === undefined || pessimisticScenarioPct === null) missingScenarioG.push("terminalG.pessimisticScenarioPct");
    if (optimisticScenarioPct === undefined || optimisticScenarioPct === null) missingScenarioG.push("terminalG.optimisticScenarioPct");
    if (missingScenarioG.length > 0) {
      throw new Error(
        `runCanonicalFinancialEngine: ejecución v5 sin los g de escenario resueltos de terminalG (05 v1.3 §6) — faltan: ${missingScenarioG.join(", ")}.`,
      );
    }
    pessimisticTg = pessimisticScenarioPct as number;
    optimisticTg = optimisticScenarioPct as number;
  } else {
    // LEGACY — comportamiento histórico preservado exactamente (2%/4%).
    pessimisticTg = 2;
    optimisticTg = 4;
  }

  const pessimistic = mkScenario(0.6, -3, 1.5, pessimisticTg);
  const optimistic = mkScenario(1.4, 3, -1.5, optimisticTg);

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
    moneda: resolveEffectiveMoneda(input.moneda_analisis),
    factor_conversion: resolveEffectiveFactorConversion(input.factor_conversion),
  };
}
