// Bloque 1C-T — Versionado del cálculo y sus supuestos.
//
// Sin imports de URL, sin Supabase, sin Deno, sin `serve()`, sin
// variables de entorno, sin efectos secundarios — importable desde Deno
// y desde Vitest indistintamente.
//
// No duplica manualmente la versión metodológica: `methodology_version`
// y `assumptions_snapshot` se derivan siempre de
// `CANONICAL_METHODOLOGY` (`_shared/financial-methodology.ts`), la única
// fuente de esos 8 supuestos desde Bloque 1B-M. Si esos valores cambian
// algún día, este módulo los refleja automáticamente sin editar nada
// aquí.

import { CANONICAL_METHODOLOGY } from "./financial-methodology.ts";
import type { ProvenanceStatus } from "./calculation-provenance.ts";
import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions.ts";

/**
 * Versión explícita, asignada a mano, del motor financiero canónico
 * (`_shared/canonical-financial-engine.ts`). NO es un timestamp ni un
 * número aleatorio — es un valor semver simple que debe incrementarse
 * manualmente cuando cambie una fórmula o el comportamiento de
 * `runCanonicalFinancialEngine` (ver ese archivo). Se mantiene en este
 * módulo, no dentro del motor, para no mezclar versionado/metadatos con
 * las fórmulas financieras que ese archivo debe conservar intactas.
 */
export const CANONICAL_ENGINE_VERSION = "1.0.0";

/**
 * Versión del "sobre" (envelope) que agrega versionado + procedencia al
 * resultado del motor. Ver `ejecutar-calculo/index.ts`.
 *
 * 1.0.0 → 1.1.0 (Bloque 1E, Subbloque 1 — corrección de trazabilidad):
 * el envelope incorporó `source_input_snapshot` (ver
 * `_shared/source-input-snapshot.ts`), un campo aditivo/compatible — no
 * cambia ni remueve ningún campo existente del envelope, así que es un
 * cambio menor (minor), no un cambio de motor ni de metodología. Un
 * `calculation_result` con `calculation_schema_version: "1.0.0"` no tiene
 * `source_input_snapshot`; uno con `"1.1.0"` sí.
 */
export const CALCULATION_SCHEMA_VERSION = "1.1.0";

export interface AssumptionSnapshotEntry {
  value: number;
  unit: string;
  approved: boolean;
}

export type AssumptionsSnapshot = Record<string, AssumptionSnapshotEntry>;

/**
 * Bloque 3C.6 (`04 §16`, `05 v1.3 §7`) — distingue explícitamente la
 * fuente metodológica que produjo el resultado: los 8 defaults globales
 * de `CANONICAL_METHODOLOGY` (legacy), o el `ResolvedCalculationAssumptions`
 * de Judgment efectivamente resuelto para este caso (v5). No es una
 * taxonomía más grande — solo estos dos valores, los mismos que ya usa
 * `05 v1.3 §7`.
 */
export type AssumptionsSource = "legacy_canonical_default" | "resolved_case_input";

export interface CalculationVersionInfo {
  calculation_schema_version: string;
  canonical_engine_version: string;
  methodology_version: string;
  /**
   * Legacy: los 8 defaults de `CANONICAL_METHODOLOGY` (`AssumptionsSnapshot`,
   * sin cambios). V5: el `ResolvedCalculationAssumptions` COMPLETO
   * efectivamente usado — no un resumen derivado ni duplicado (`05 v1.3
   * §7`: "remite al mismo `resolved_assumptions_used`, no lo duplica").
   */
  assumptions_snapshot: AssumptionsSnapshot | ResolvedCalculationAssumptions;
  assumptions_source: AssumptionsSource;
  calculated_at: string;
  input_fingerprint: string;
  provenance_status: ProvenanceStatus;
}

/** Snapshot de los 8 supuestos REALMENTE usados por el motor al momento del cálculo — derivado de CANONICAL_METHODOLOGY, ningún valor nuevo ni duplicado. */
function buildAssumptionsSnapshot(): AssumptionsSnapshot {
  const snapshot: AssumptionsSnapshot = {};
  for (const [key, assumption] of Object.entries(CANONICAL_METHODOLOGY.assumptions)) {
    snapshot[key] = { value: assumption.value, unit: assumption.unit, approved: assumption.approved };
  }
  return snapshot;
}

/**
 * Legacy vs. v5: PRESENCIA de la propiedad `resolvedAssumptions` en
 * `params` (`Object.hasOwnProperty`) — mismo criterio base usado desde
 * `calculation-preflight.ts` (3C.1) — Y ADEMÁS su valor debe ser un
 * objeto real (no `null`/`undefined`). La segunda condición es una
 * adaptación deliberada, no una inconsistencia: a diferencia del
 * preflight (que debe BLOQUEAR una v5 anunciada pero incompleta antes
 * del motor), esta función es puramente de REPORTE, invocada solo
 * DESPUÉS de un cálculo ya exitoso — si el cálculo fue realmente v5, el
 * motor ya exigió y validó `resolved_assumptions` antes de llegar aquí
 * (3C.1-3C.5); no existe un caso real donde la clave esté presente con
 * valor vacío. Una llamada legacy real omite la clave por completo
 * (comportamiento IDÉNTICO al de antes de este bloque: `assumptions_snapshot`
 * sigue siendo los 8 defaults globales). Nunca se reporta un default
 * global como si hubiera sido el supuesto realmente usado en una
 * ejecución v5.
 */
export function buildCalculationVersionInfo(params: {
  inputFingerprint: string;
  provenanceStatus: ProvenanceStatus;
  calculatedAt?: string;
  resolvedAssumptions?: ResolvedCalculationAssumptions | null;
}): CalculationVersionInfo {
  const isV5 = Object.prototype.hasOwnProperty.call(params, "resolvedAssumptions") && params.resolvedAssumptions != null;
  return {
    calculation_schema_version: CALCULATION_SCHEMA_VERSION,
    canonical_engine_version: CANONICAL_ENGINE_VERSION,
    methodology_version: CANONICAL_METHODOLOGY.methodologyVersion,
    assumptions_snapshot: isV5 ? (params.resolvedAssumptions as ResolvedCalculationAssumptions) : buildAssumptionsSnapshot(),
    assumptions_source: isV5 ? "resolved_case_input" : "legacy_canonical_default",
    calculated_at: params.calculatedAt ?? new Date().toISOString(),
    input_fingerprint: params.inputFingerprint,
    provenance_status: params.provenanceStatus,
  };
}
