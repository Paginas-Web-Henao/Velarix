// Bloque 3C.6 (`04 §16`, `05 v1.3 §7`) — snapshot de Judgment,
// congelado tal cual se usó en una ejecución v5.
//
// Sin imports de URL, sin Supabase, sin Deno, sin `serve()`, sin efectos
// secundarios — función pura, importable desde Deno y desde Vitest
// indistintamente (mismo patrón que `source-input-snapshot.ts`).
//
// `04 §1` separa Evidence (source_input_snapshot) de Judgment
// (resolved_assumptions_used) de Calculation (calculation_result) — este
// módulo resuelve exclusivamente la capa de Judgment, nunca mezclada con
// evidencia financiera ni con el resultado del motor.
//
// Regla dura: copia LITERAL del `ResolvedCalculationAssumptions`
// efectivamente usado — nunca recalcula, nunca sustituye valores, nunca
// resume ni deriva un subconjunto. `05 v1.3 §7`: "congela
// `resolved_assumptions` exactamente como se usó ... copia literal, sin
// recalcular nada". En legacy (sin Judgment resuelto) el snapshot es
// `null` — no se inventa Judgment retroactivamente para una ejecución
// que nunca lo tuvo.

import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions.ts";

/**
 * `null` cuando no hubo `ResolvedCalculationAssumptions` para esta
 * ejecución (legacy) — nunca un objeto vacío ni un resumen parcial. El
 * valor devuelto es una copia estructural (`JSON.parse(JSON.stringify(...))`),
 * no una referencia mutable al objeto de entrada: mutar el input original
 * después de construir el snapshot no debe alterar retroactivamente lo
 * que ya se congeló como "lo que efectivamente se usó".
 */
export function buildResolvedAssumptionsSnapshot(
  resolvedAssumptions: ResolvedCalculationAssumptions | null | undefined,
): ResolvedCalculationAssumptions | null {
  if (resolvedAssumptions == null) return null;
  return JSON.parse(JSON.stringify(resolvedAssumptions));
}
