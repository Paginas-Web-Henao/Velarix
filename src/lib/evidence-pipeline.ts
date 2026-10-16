// Pipeline de EVIDENCE (frontend): PARSE → MAP ACCOUNTS → VALIDATE → STOP.
// No construye el input del motor ni calcula: Judgment y Calculation son
// pasos posteriores y explícitos (Evidence ≠ Judgment ≠ Calculation).
import { EVIDENCE_FINAL_STATUSES } from "../../supabase/functions/_shared/evidence-pipeline-guards";

/** Fases visibles del flujo de Evidence (sin Cálculo, Narrativa ni Informe). */
export const EVIDENCE_PHASES = [
  { numero: 1, nombre: "Documentos", icono: "📄" },
  { numero: 2, nombre: "Extracción", icono: "🔍" },
  { numero: 3, nombre: "Cuentas", icono: "🧾" },
  { numero: 4, nombre: "Validación", icono: "✓" },
] as const;

/** Fase que se muestra cuando todas las anteriores están completas. */
export const EVIDENCE_PHASES_DONE = EVIDENCE_PHASES.length + 1;

/** El flujo de Evidence terminó bien: el caso quedó validado (con o sin advertencias). */
export const isEvidenceComplete = (status: string | null | undefined): boolean =>
  !!status && (EVIDENCE_FINAL_STATUSES as readonly string[]).includes(status);

export interface PipelineOutcome {
  ok: boolean;
  /** `true` = no hubo respuesta HTTP (red/timeout): el pipeline pudo seguir corriendo en el servidor. */
  uncertain?: boolean;
  message?: string;
  /** Código del servidor (p. ej. CASE_ALREADY_CALCULATED). */
  code?: string;
}

/** Interpreta la respuesta HTTP de `run-analysis-pipeline`. Cualquier no-2xx o `success:false` es fallo. */
export function interpretPipelineResponse(httpOk: boolean, httpStatus: number, body: unknown): PipelineOutcome {
  const b = (body ?? null) as { success?: boolean; error?: { message?: string; code?: string } } | null;
  if (httpOk && b?.success !== false) return { ok: true };
  return {
    ok: false,
    code: b?.error?.code,
    message: b?.error?.message ?? `El pipeline respondió HTTP ${httpStatus}.`,
  };
}
