// Bug ausente->0 en build-structured-input — ver auditoría remota real: el
// código derivaba total_assets/total_liabilities desde una suma parcial de
// componentes (`cash + accounts_receivable + inventory + ppe`, cada uno
// convertido a 0 vía `|| 0` si estaba ausente), y financial_debt_total se
// computaba SIEMPRE de forma incondicional con el mismo patrón — nunca
// quedaba `null` aunque ambos componentes de deuda estuvieran ausentes, sin
// ningún quality_flag que lo señalara. El EBITDA derivado tenía el mismo
// problema con D&A: lo asumía en 0 cuando estaba ausente, sin que exista
// ninguna decisión metodológica aprobada que lo autorice (verificado contra
// docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md
// y DECISIONES-FINANCIERAS-PENDIENTES.md — ninguno menciona D&A/
// depreciación/amortización).
//
// Principio aplicado en todo este módulo: AUSENTE != 0. Un componente
// ausente (`null`) nunca se sustituye por 0 dentro de una fórmula — si hace
// falta y no está, el resultado derivado es `null` (missing), nunca un
// número fabricado a partir de evidencia parcial. Un componente OBSERVADO
// como 0 sigue siendo un dato real y se preserva tal cual (no se confunde
// con ausencia).
//
// La derivación de total_assets/total_liabilities por suma de componentes
// parciales se ELIMINÓ por completo en build-structured-input/index.ts (no
// se reemplaza por un equivalente aquí) — no existe ninguna decisión
// metodológica aprobada que autorice asumir que
// cash+accounts_receivable+inventory+ppe agotan exhaustivamente los
// activos totales de una empresa, ni que accounts_payable+deuda_financiera
// agoten los pasivos totales. Ambos campos ahora son un passthrough directo
// del valor observado (o `null`) — sin lógica que testear en este módulo.
//
// `deriveCoreFinancialFields` (más abajo) fue extraída de
// build-structured-input/index.ts para cerrar una segunda auditoría real:
// continuar-tras-revision/index.ts reconstruía estos mismos campos con su
// propia aritmética (`?? 0` sobre da/current_financial_debt/
// long_term_financial_debt, y una tasa de impuestos de 30% hardcoded para
// net_income sin ninguna aprobación metodológica) — una segunda
// implementación financiera independiente de la fuente canónica, que podía
// fabricar valores para campos genuinamente ausentes y ocultar ese missing
// al Calculation Preflight (ver
// continuar-tras-revision.regression.test.ts). Ahora build-structured-input
// y continuar-tras-revision llaman a esta misma función — no existe ya una
// segunda lógica financiera paralela.

import { sumAccountValue, type HomologatedAccountRow } from "./financial-accounts.ts";

/**
 * Suma current_financial_debt + long_term_financial_debt SOLO si AMBOS
 * están observados (no `null`). Un componente observado + uno ausente NO se
 * trata como "el ausente es 0" — el total queda `null` (missing), nunca un
 * valor parcial disfrazado de total. Dos valores observados en 0 sí
 * producen 0 (0 sigue siendo un dato real, no ausencia).
 *
 * No existe hoy una cuenta canonical de "deuda financiera total" observada
 * directamente en la taxonomía (`account-taxonomy.ts` solo tiene
 * `current_financial_debt`/`long_term_financial_debt` por separado) — por
 * eso esta función sigue derivando desde los dos componentes, nunca
 * prioriza un valor observado directo que no existe.
 */
export function deriveFinancialDebtTotal(
  currentDebt: number | null,
  ltDebt: number | null,
): number | null {
  if (currentDebt == null || ltDebt == null) return null;
  return currentDebt + ltDebt;
}

/**
 * EBITDA = revenue - cost_of_sales - opex + D&A, pero SOLO cuando los
 * CUATRO componentes están observados (incluyendo cualquiera de ellos
 * observado explícitamente en 0 — un cero observado sigue siendo un dato
 * real, no ausencia). Si falta cualquiera de los cuatro, no hay
 * autorización metodológica para asumirlo en 0 (ver comentario de
 * archivo) — el resultado es `null`, no una cifra derivada con un
 * componente fabricado.
 *
 * Hallazgo secundario ya cerrado: antes, cost_of_sales/opex ausentes caían
 * a 0 vía `|| 0` dentro de la fórmula (mismo patrón que D&A, señalado pero
 * no corregido en el commit anterior por no estar demostrado en el
 * fixture remoto real — donde ambos siempre estaban observados). Ahora los
 * cuatro componentes se tratan con el mismo criterio estricto de
 * observación.
 */
export function deriveEbitdaFromComponents(params: {
  revenue: number | null;
  costOfSales: number | null;
  opex: number | null;
  da: number | null;
}): number | null {
  const { revenue, costOfSales, opex, da } = params;
  if (revenue == null || costOfSales == null || opex == null || da == null) return null;
  return revenue - costOfSales - opex + da;
}

export interface CoreFinancialFields {
  revenue: number | null;
  costOfSales: number | null;
  opex: number | null;
  da: number | null;
  interestExpense: number | null;
  taxes: number | null;
  /** Passthrough directo de lo observado — no existe hoy una regla canónica aprobada para derivar net_income a partir de otros campos (ver auditoría en el comentario de archivo). */
  netIncome: number | null;
  ebitda: number | null;
  ebit: number | null;
  cash: number | null;
  accountsReceivable: number | null;
  inventory: number | null;
  ppe: number | null;
  accountsPayable: number | null;
  currentDebt: number | null;
  longTermDebt: number | null;
  financialDebtTotal: number | null;
  equity: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
}

/**
 * Único punto de lectura+derivación de los campos financieros "core" de
 * `structured_input` a partir de `account_homologations`, para el
 * `base_period` ya resuelto. Extraída literalmente de
 * build-structured-input/index.ts para que continuar-tras-revision/index.ts
 * use la MISMA implementación en vez de reconstruirla por su cuenta.
 *
 * Cada campo es `sumAccountValue(...)` (consolida subcuentas del mismo
 * `canonical_account`, nunca mezcla períodos, devuelve `null` cuando no hay
 * ninguna fila — nunca confunde ausencia con cero) salvo ebitda/ebit/
 * financial_debt_total, que además intentan primero un valor observado
 * directo (`ebitda`/`ebit` como canonical_account) y solo si no existe,
 * derivan vía `deriveEbitdaFromComponents`/`deriveFinancialDebtTotal` —
 * ambos con la misma regla: si falta cualquier componente requerido, el
 * resultado es `null`, nunca un número fabricado.
 */
export function deriveCoreFinancialFields(
  accounts: readonly HomologatedAccountRow[],
  basePeriod: string | null,
): CoreFinancialFields {
  const getValue = (canonical: string): number | null =>
    sumAccountValue(accounts, canonical, basePeriod ?? undefined);

  const revenue = getValue("revenue");
  const costOfSales = getValue("cost_of_sales");
  const opex = getValue("opex");
  const da = getValue("da");
  const interestExpense = getValue("interest_expense");
  const taxes = getValue("taxes");
  const netIncome = getValue("net_income");

  let ebitda = getValue("ebitda");
  let ebit = getValue("ebit");
  if (ebitda == null) ebitda = deriveEbitdaFromComponents({ revenue, costOfSales, opex, da });
  if (ebit == null && ebitda != null && da != null) ebit = ebitda - da;

  const cash = getValue("cash");
  const accountsReceivable = getValue("accounts_receivable");
  const inventory = getValue("inventory");
  const ppe = getValue("ppe");
  const accountsPayable = getValue("accounts_payable");
  const currentDebt = getValue("current_financial_debt");
  const longTermDebt = getValue("long_term_financial_debt");
  const financialDebtTotal = deriveFinancialDebtTotal(currentDebt, longTermDebt);
  const equity = getValue("equity");
  // AUSENTE != 0: total_assets/total_liabilities NUNCA se derivan por suma
  // parcial de componentes (ver comentario de archivo) — passthrough directo.
  const totalAssets = getValue("total_assets");
  const totalLiabilities = getValue("total_liabilities");

  return {
    revenue, costOfSales, opex, da, interestExpense, taxes, netIncome,
    ebitda, ebit,
    cash, accountsReceivable, inventory, ppe, accountsPayable,
    currentDebt, longTermDebt, financialDebtTotal,
    equity, totalAssets, totalLiabilities,
  };
}
