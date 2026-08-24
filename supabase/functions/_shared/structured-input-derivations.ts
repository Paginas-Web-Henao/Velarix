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
