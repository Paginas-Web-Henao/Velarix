// Calculation Preflight — gate fail-closed entre Minimum Expediente
// Checkpoint y el motor financiero (`runCanonicalFinancialEngine`).
//
// Sin imports de URL, sin Supabase, sin Deno, sin `serve()`, sin
// variables de entorno, sin efectos secundarios — importable desde Deno y
// desde Vitest indistintamente.
//
// Motivación (auditoría real): `canonical-input-normalization.ts` y
// `capital-structure.ts` convierten CUALQUIER campo ausente
// (revenue/cost_of_sales/opex/da/cash/equity/financial_debt_total) en `0`
// vía `|| 0` / `?? 0` antes de calcular — un `equity` ausente se vuelve
// indistinguible de un `equity` observado en cero, y activa una estructura
// de capital 70/30 hardcoded (`capital-structure.ts` línea 49). Además,
// los 8 supuestos de `financial-methodology.ts` (risk-free, ERP, tax
// rate, g terminal, cost of debt, capex%, working capital%, D&A%) están
// marcados `approved: false` en el propio código — nunca se les exige
// aprobación humana antes de usarlos. Y el horizonte de 5 años
// (`canonical-financial-engine.ts`, `for (let t=1;t<=5;t++)`) está
// hardcoded sin ninguna entrada de metadata en absoluto.
//
// Este módulo NO decide qué valores son correctos, NO aprueba nada, NO
// inventa una fuente de aprobación que no existe — solo verifica, ANTES
// de invocar el motor: (1) que los campos materiales de
// `structured_input` estén realmente observados (no `null`/`undefined`),
// y (2) que ningún supuesto metodológico usado por el motor esté marcado
// `approved: false` en la ÚNICA fuente de verdad que existe hoy
// (`CANONICAL_METHODOLOGY`).
//
// Limitación conocida y documentada, no oculta: no existe HOY ningún
// mecanismo persistido para que un humano marque estos supuestos como
// aprobados (verificado — sin schema/RPC para ello). Por tanto
// `unapproved_assumptions` bloqueará SIEMPRE, para todo análisis, hasta
// que exista un mecanismo real de aprobación (fuera de alcance de este
// módulo). Esto es la consecuencia correcta y esperada de no inventar una
// aprobación que no existe — no un bug de este preflight.

import { CANONICAL_METHODOLOGY } from "./financial-methodology.ts";

export interface PreflightIncomeStatement {
  revenue?: number | null;
  cost_of_sales?: number | null;
  opex?: number | null;
  da?: number | null;
  /** Nombre alterno que el motor también acepta para D&A (`da || depreciation`) — ver canonical-input-normalization.ts. */
  depreciation?: number | null;
}

export interface PreflightBalanceSheet {
  cash?: number | null;
  equity?: number | null;
  /** Nombre alterno que el motor también acepta para equity (`equity || total_equity`). */
  total_equity?: number | null;
  financial_debt_total?: number | null;
  /** Nombres alternos que el motor también acepta para deuda total — ver capital-structure.ts resolveFinancialDebtTotal. */
  total_debt?: number | null;
  financial_debt?: number | null;
}

export interface CalculationPreflightResult {
  passed: boolean;
  missing_inputs: string[];
  unapproved_assumptions: string[];
  blockers: string[];
}

function isObserved(value: number | null | undefined): boolean {
  return value !== null && value !== undefined;
}

/**
 * Campo material REQUIRED para el motor — evidencia de por qué (feeds
 * enterprise value / WACC / equity value directamente, no solo un KPI
 * supplementario):
 * - revenue/cost_of_sales/opex: base de ebitda0 y ebitdaMargin, que
 *   alimenta las proyecciones de los 5 años (`computeProjections`).
 * - da: alimenta ebitda0/ebit0 -> ebitdaMargin -> las 5 proyecciones.
 * - cash: alimenta netDebt (`totalDebt - cash`) -> equityValue.
 * - equity: alimenta equityWeight (`capital-structure.ts`) -> WACC
 *   completo. Es el campo cuya ausencia dispara el default 70/30
 *   hardcoded (evidencia central de esta auditoría).
 * - financial_debt_total: alimenta totalDebt -> equityWeight, netDebt,
 *   WACC, interest proyectado.
 *
 * `interest_expense` queda deliberadamente FUERA de este set: verificado
 * en el motor que solo alimenta KPIs supplementarios (netMargin,
 * interestCoverage, roe/roa vía netIncome0) — nunca enterpriseValue,
 * equityValue ni wacc. No es material para el resultado DCF en sí.
 */
function findMissingRequiredInputs(
  incomeStatement: PreflightIncomeStatement | null | undefined,
  balanceSheet: PreflightBalanceSheet | null | undefined,
): string[] {
  const is = incomeStatement || {};
  const bs = balanceSheet || {};
  const missing: string[] = [];

  if (!isObserved(is.revenue)) missing.push("revenue");
  if (!isObserved(is.cost_of_sales)) missing.push("cost_of_sales");
  if (!isObserved(is.opex)) missing.push("opex");
  if (!isObserved(is.da) && !isObserved(is.depreciation)) missing.push("da");
  if (!isObserved(bs.cash)) missing.push("cash");
  if (!isObserved(bs.equity) && !isObserved(bs.total_equity)) missing.push("equity");
  if (!isObserved(bs.financial_debt_total) && !isObserved(bs.total_debt) && !isObserved(bs.financial_debt)) {
    missing.push("financial_debt_total");
  }

  return missing;
}

/**
 * Nombre fijo, no derivado de ninguna tabla — el horizonte de proyección
 * (5 años) está hardcoded en `canonical-financial-engine.ts`
 * (`for (let t=1;t<=5;t++)`), sin representación en
 * `CANONICAL_METHODOLOGY.assumptions`. No se le agrega una entrada falsa
 * ahí (eso sería inventar metadata que no existe) — se bloquea aquí
 * explícitamente, con su propia razón, siempre, hasta que exista una
 * decisión metodológica real sobre el horizonte.
 */
const UNTRACKED_HARDCODED_ASSUMPTION = "projection_horizon_years";

function findUnapprovedAssumptions(): string[] {
  const unapproved: string[] = [];
  for (const [key, assumption] of Object.entries(CANONICAL_METHODOLOGY.assumptions)) {
    if (!assumption.approved) unapproved.push(key);
  }
  unapproved.push(UNTRACKED_HARDCODED_ASSUMPTION);
  return unapproved;
}

export function evaluateCalculationPreflight(params: {
  incomeStatement: PreflightIncomeStatement | null | undefined;
  balanceSheet: PreflightBalanceSheet | null | undefined;
}): CalculationPreflightResult {
  const missing_inputs = findMissingRequiredInputs(params.incomeStatement, params.balanceSheet);
  const unapproved_assumptions = findUnapprovedAssumptions();

  const blockers: string[] = [
    ...missing_inputs.map(
      (field) => `INPUT_MISSING: "${field}" ausente en structured_input — no se puede calcular sin fabricar un valor.`,
    ),
    ...unapproved_assumptions.map(
      (name) => `METHODOLOGY_APPROVAL_REQUIRED: el supuesto "${name}" no tiene aprobación humana registrada.`,
    ),
  ];

  return {
    passed: missing_inputs.length === 0 && unapproved_assumptions.length === 0,
    missing_inputs,
    unapproved_assumptions,
    blockers,
  };
}
