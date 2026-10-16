// Evidence pipeline — decisiones puras (sin Supabase, sin Deno, sin red).
//
// El pipeline de Evidence es: PARSE → MAP ACCOUNTS → VALIDATE → STOP.
// Termina ANTES de construir el input estructurado (Evidence ≠ Judgment ≠
// Calculation: el input del motor necesita Judgment que aún no existe) y
// antes de cualquier cálculo. El cálculo (`ejecutar-calculo`) es un paso
// posterior y explícito.
//
// Importable desde Deno (Edge Functions), Vitest y el frontend: solo tipos
// y funciones puras.

/** Funciones que el pipeline de Evidence NUNCA debe invocar. */
export const EVIDENCE_PIPELINE_FORBIDDEN_CALLS = ["build-structured-input", "ejecutar-calculo"] as const;

/** Estados en los que termina el pipeline de Evidence (los fija `validate-analysis`). */
export const EVIDENCE_FINAL_STATUSES = ["validacion_aprobada", "validacion_con_advertencias"] as const;
export type EvidenceFinalStatus = (typeof EVIDENCE_FINAL_STATUSES)[number];

/** `validation_status` que devuelve `validate-analysis` → `analyses.status` final del pipeline. */
export function resolveEvidenceFinalStatus(validationStatus: string | null | undefined): EvidenceFinalStatus | null {
  if (validationStatus === "aprobado") return "validacion_aprobada";
  if (validationStatus === "aprobado_con_advertencias") return "validacion_con_advertencias";
  return null; // "bloqueado" u otro: no es un final exitoso
}

export interface CaseProbe {
  calculation_result?: unknown | null;
}

/** ¿El caso ya tiene un cálculo oficial persistido? (`null`/ausente = no.) */
export function hasPersistedCalculation(analysis: CaseProbe | null | undefined): boolean {
  return analysis?.calculation_result !== null && analysis?.calculation_result !== undefined;
}

export type ReprocessingDecision =
  | { allowed: true }
  | { allowed: false; httpStatus: 409; code: "CASE_ALREADY_CALCULATED"; message: string };

/**
 * Ningún endpoint de reprocesamiento de Evidence (run-analysis-pipeline,
 * parse-document, map-accounts, validate-analysis) modifica automáticamente un
 * caso que ya tiene `calculation_result`: homologaciones, validaciones y
 * estado cambiarían bajo un cálculo oficial ya persistido, y map/validate
 * BORRAN sus filas anteriores al reejecutarse. Reprocesar exigiría una
 * ejecución o un versionado explícitos que todavía no existen
 * (EVIDENCE_REPROCESSING_VERSIONING_PENDING). `upload-document` es la
 * excepción: adjunta el documento, fuera del cálculo oficial existente.
 */
export function evaluateEvidenceReprocessing(analysis: CaseProbe | null | undefined): ReprocessingDecision {
  if (!hasPersistedCalculation(analysis)) return { allowed: true };
  return {
    allowed: false,
    httpStatus: 409,
    code: "CASE_ALREADY_CALCULATED",
    message:
      "Este caso ya tiene un cálculo oficial persistido. El reprocesamiento de Evidence (pipeline, parse, map, validate) " +
      "no modifica casos calculados: hacerlo requiere una ejecución o un versionado explícitos (EVIDENCE_REPROCESSING_VERSIONING_PENDING).",
  };
}

/** Tipo único del evento de rechazo en todos los endpoints de reprocesamiento de Evidence. */
export const EVIDENCE_REPROCESSING_REJECTED_EVENT = "evidence_reprocessing_rejected";

/**
 * Payload del audit event de rechazo. Es la ÚNICA escritura permitida cuando un
 * endpoint de Evidence (pipeline, parse, map, validate) recibe un caso calculado.
 */
export function reprocessingRejectedAuditEvent(params: {
  analysisId: string;
  userId: string;
  component: string;
  status: string | null | undefined;
  decision: Extract<ReprocessingDecision, { allowed: false }>;
}) {
  return {
    analysis_id: params.analysisId,
    event_type: EVIDENCE_REPROCESSING_REJECTED_EVENT,
    event_detail: params.decision.message,
    component: params.component,
    user_id: params.userId,
    metadata: { code: params.decision.code, status: params.status ?? null },
  };
}

/**
 * `analyses.status` tras subir un documento. Un caso ya calculado conserva su
 * estado (`null` = no tocar): subir un documento no degrada un cálculo oficial.
 */
export function statusAfterUpload(analysis: CaseProbe | null | undefined): "documentos_cargados" | null {
  return hasPersistedCalculation(analysis) ? null : "documentos_cargados";
}

/** Aviso para el usuario cuando el documento se sube a un caso ya calculado. */
export function uploadWarning(analysis: CaseProbe | null | undefined): string | null {
  return hasPersistedCalculation(analysis)
    ? "Este caso ya tiene un cálculo oficial. El documento queda cargado, pero NO forma parte de ese cálculo hasta una futura ejecución o versionado explícitos."
    : null;
}
