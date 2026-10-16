// Regla canónica: una corrección manual de mapping cuyo efecto de
// duplicación / consolidación quedó señalado por validate-analysis (MAP_008 /
// MAP_009 FAILED) en el evidence run ACTIVO impide Calculation hasta revisión
// humana. No des-promueve Evidence (ADR-009 sigue: el run validado se promueve
// aunque tenga hallazgos), no vuelve al run anterior y no corrige nada: la
// salida es una corrección nueva que elimine el conflicto.
// Solo cuenta el run activo: hallazgos de runs históricos no bloquean.
// La usan calculation-readiness.ts y ejecutar-calculo (sin duplicar la regla).

export const MANUAL_MAPPING_REVIEW_RULES = ["MAP_008", "MAP_009"] as const;
export const MANUAL_MAPPING_REVIEW_REQUIRED = "MANUAL_MAPPING_REVIEW_REQUIRED";

export interface ValidationResultRow {
  evidence_run_id?: string | null;
  rule_code: string;
  status: string;
  detail?: string | null;
}

export interface ManualMappingReviewDecision {
  required: boolean;
  findings: { rule_code: string; detail: string | null }[];
  message: string | null;
}

export function evaluateManualMappingReview(activeEvidenceRunId: string | null | undefined, validationResults: readonly ValidationResultRow[]): ManualMappingReviewDecision {
  if (!activeEvidenceRunId) return { required: false, findings: [], message: null };
  const findings = validationResults
    .filter((v) => v.evidence_run_id === activeEvidenceRunId && v.status === "failed" && (MANUAL_MAPPING_REVIEW_RULES as readonly string[]).includes(v.rule_code))
    .map((v) => ({ rule_code: v.rule_code, detail: v.detail ?? null }));
  if (!findings.length) return { required: false, findings, message: null };
  return {
    required: true,
    findings,
    message: `La Evidence activa contiene una corrección manual de mapping cuyo efecto de duplicación/consolidación (${findings.map((f) => f.rule_code).join(", ")}) debe revisarse antes de Calculation. Corrígela con una nueva corrección versionada; la Evidence no se des-promueve ni se ajusta sola.`,
  };
}
