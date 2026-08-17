// Minimum Expediente Checkpoint — evaluador puro de los 4 checks
// mínimos de docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md §0.1:
// contexto, >=1 cuenta material, >=1 ambigüedad, >=1 tratamiento humano.
//
// NO evalúa: WACC, g, horizonte, tax, aprobación metodológica,
// evidencias completas, expediente completo, informe, revisor,
// normalizaciones. Esto NO es el Expediente completo (que sigue siendo
// paralelo/no bloqueante) — es un gate mínimo distinto, más pequeño,
// para el flujo profesional normal.
//
// Sin imports de Supabase/Deno/URL — el caller resuelve los conteos
// (SELECT COUNT/EXISTS mínimos, sin cargar filas completas) y se los
// pasa ya calculados.

export interface MinimumExpedienteCheckpointInput {
  companyName: string | null | undefined;
  sector: string | null | undefined;
  materialAccountsCount: number;
  ambiguitiesCount: number;
  treatedAmbiguitiesCount: number;
}

export interface MinimumExpedienteCheckpointResult {
  passed: boolean;
  checks: {
    context: boolean;
    material_account: boolean;
    ambiguity: boolean;
    treatment: boolean;
  };
  missing: string[];
}

function isNonEmpty(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function evaluateMinimumExpedienteCheckpoint(
  input: MinimumExpedienteCheckpointInput,
): MinimumExpedienteCheckpointResult {
  const context = isNonEmpty(input.companyName) && isNonEmpty(input.sector);
  const material_account = input.materialAccountsCount >= 1;
  const ambiguity = input.ambiguitiesCount >= 1;
  const treatment = input.treatedAmbiguitiesCount >= 1;

  const checks = { context, material_account, ambiguity, treatment };
  const missing = (Object.keys(checks) as Array<keyof typeof checks>).filter((k) => !checks[k]);

  return { passed: missing.length === 0, checks, missing };
}
