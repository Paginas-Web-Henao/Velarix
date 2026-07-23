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

/** Versión del "sobre" (envelope) que agrega versionado + procedencia al resultado del motor. Ver `ejecutar-calculo/index.ts`. */
export const CALCULATION_SCHEMA_VERSION = "1.0.0";

export interface AssumptionSnapshotEntry {
  value: number;
  unit: string;
  approved: boolean;
}

export type AssumptionsSnapshot = Record<string, AssumptionSnapshotEntry>;

export interface CalculationVersionInfo {
  calculation_schema_version: string;
  canonical_engine_version: string;
  methodology_version: string;
  assumptions_snapshot: AssumptionsSnapshot;
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

export function buildCalculationVersionInfo(params: {
  inputFingerprint: string;
  provenanceStatus: ProvenanceStatus;
  calculatedAt?: string;
}): CalculationVersionInfo {
  return {
    calculation_schema_version: CALCULATION_SCHEMA_VERSION,
    canonical_engine_version: CANONICAL_ENGINE_VERSION,
    methodology_version: CANONICAL_METHODOLOGY.methodologyVersion,
    assumptions_snapshot: buildAssumptionsSnapshot(),
    calculated_at: params.calculatedAt ?? new Date().toISOString(),
    input_fingerprint: params.inputFingerprint,
    provenance_status: params.provenanceStatus,
  };
}
