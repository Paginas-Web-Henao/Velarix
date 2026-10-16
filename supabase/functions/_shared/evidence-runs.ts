// Versionado no destructivo de Evidence (homologación + validación).
//
// Un evidence run = map-accounts + validate-analysis sobre las mismas filas.
// Build then promote:
//   1. map-accounts crea el run (status "mapping") e inserta filas ligadas a él;
//   2. al terminar, status "mapped" (o "failed"; nada se borra);
//   3. validate-analysis valida EXACTAMENTE las homologaciones de ese run y
//      liga sus resultados al mismo run;
//   4. al terminar, status "completed" y se PROMUEVE: un UPDATE de una sola
//      fila (analyses.active_evidence_run_id) condicionado al puntero previo
//      (compare-and-swap). Ese UPDATE es el punto de compromiso: o el puntero
//      pasa al run nuevo o sigue en el anterior. Un run fallido nunca se
//      promueve.
// Los lectores operacionales leen SOLO el set activo:
//   - puntero NULL → filas legacy (evidence_run_id NULL);
//   - puntero = run → filas de ese run.
// Atomicidad real: solo el UPDATE del puntero (una fila) es atómico. Las
// transiciones de status del run son bitácora: si fallan, el puntero no se
// movió y el set activo anterior sigue intacto.

export type EvidenceRunStatus = "mapping" | "mapped" | "validating" | "completed" | "failed";
export type EvidenceRunStage = "mapping" | "validation" | "promotion";

export interface RunScopedRow {
  evidence_run_id?: string | null;
}

const runOf = (row: RunScopedRow): string | null => row.evidence_run_id ?? null;

/** Filas del set operacional activo (puntero del análisis, o legacy si es null). */
export function selectActiveRows<T extends RunScopedRow>(rows: readonly T[], activeRunId: string | null | undefined): T[] {
  const active = activeRunId ?? null;
  return rows.filter((r) => runOf(r) === active);
}

export class MixedEvidenceRunsError extends Error {
  constructor(public readonly runIds: (string | null)[]) {
    super(`Filas de ${runIds.length} evidence runs distintos en un mismo cálculo: ${runIds.map((r) => r ?? "legacy").join(", ")}. Solo debe usarse el set activo.`);
    this.name = "MixedEvidenceRunsError";
  }
}

/** Fail-closed: un conjunto de filas que alimenta una derivación debe venir de un solo run. */
export function assertSingleEvidenceRun(rows: readonly RunScopedRow[]): void {
  const runs = [...new Set(rows.map(runOf))];
  if (runs.length > 1) throw new MixedEvidenceRunsError(runs);
}

/** Filtro de consulta del set activo (query builder de supabase-js). */
export function applyActiveRunFilter<Q extends { eq: (c: string, v: unknown) => Q; is: (c: string, v: null) => Q }>(query: Q, activeRunId: string | null | undefined): Q {
  return activeRunId ? query.eq("evidence_run_id", activeRunId) : query.is("evidence_run_id", null);
}

/** Si la promoción de un run puede hacerse (solo un run completo, nunca uno fallido). */
export function canPromote(run: { status: EvidenceRunStatus } | null | undefined): boolean {
  return run?.status === "completed";
}

/** Run que validate-analysis debe validar: el pedido explícitamente, o el último homologado pendiente. */
export function selectRunToValidate<T extends { id: string; status: EvidenceRunStatus; started_at: string }>(
  runs: readonly T[],
  requestedId?: string | null,
): { run: T } | { error: "RUN_NOT_FOUND" | "RUN_NOT_MAPPED" | "NO_MAPPED_EVIDENCE_RUN"; message: string } {
  if (requestedId) {
    const run = runs.find((r) => r.id === requestedId);
    if (!run) return { error: "RUN_NOT_FOUND", message: "El evidence run indicado no existe para este análisis." };
    if (run.status !== "mapped") return { error: "RUN_NOT_MAPPED", message: `El evidence run está en estado "${run.status}"; solo se valida un run homologado (mapped).` };
    return { run };
  }
  const pending = runs.filter((r) => r.status === "mapped").sort((a, b) => b.started_at.localeCompare(a.started_at));
  if (!pending.length) return { error: "NO_MAPPED_EVIDENCE_RUN", message: "No hay una homologación pendiente de validar. Ejecuta map-accounts antes de validar." };
  return { run: pending[0] };
}

// ── I/O mínimo (cliente supabase-js con la clave de servidor) ────────

// Cliente supabase-js (clave de servidor). Tipado mínimo: solo se usa .from().
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = { from: (t: string) => any };

export async function createEvidenceRun(db: Db, params: { analysisId: string; userId: string; previousActiveRunId: string | null; sourceParsedDocumentIds: string[] }): Promise<string> {
  const id = crypto.randomUUID();
  const { error } = await db.from("evidence_runs").insert({
    id, analysis_id: params.analysisId, status: "mapping", created_by: params.userId,
    previous_active_run_id: params.previousActiveRunId, source_parsed_document_ids: params.sourceParsedDocumentIds,
  });
  if (error) throw new Error(`No se pudo crear el evidence run: ${error.message}`);
  return id;
}

export async function markEvidenceRun(db: Db, runId: string, patch: Record<string, unknown>): Promise<void> {
  await db.from("evidence_runs").update(patch).eq("id", runId);
}

/**
 * Reclama un run "mapped" para validarlo: UPDATE condicionado al estado
 * (mapped → validating) que devuelve las filas afectadas. Solo un llamador
 * puede reclamarlo; un segundo validate concurrente del mismo run recibe
 * false y no inserta validaciones duplicadas ni toca el puntero.
 */
export async function claimRunForValidation(db: Db, runId: string): Promise<boolean> {
  const { data, error } = await db.from("evidence_runs").update({ status: "validating" }).eq("id", runId).eq("status", "mapped").select("id");
  return !error && Array.isArray(data) && data.length === 1;
}

export async function failEvidenceRun(db: Db, runId: string, stage: EvidenceRunStage, code: string, detail: string): Promise<void> {
  await markEvidenceRun(db, runId, { status: "failed", failed_stage: stage, error_code: code, error_detail: detail.slice(0, 2000) });
}

/**
 * Promueve un run COMPLETO a activo con compare-and-swap sobre el puntero
 * previo. Devuelve false si otro run se promovió entretanto (el puntero no se
 * pisa) o si la escritura no quedó aplicada.
 */
export async function promoteEvidenceRun(db: Db, params: { analysisId: string; runId: string; expectedPreviousRunId: string | null }): Promise<boolean> {
  const base = db.from("analyses").update({ active_evidence_run_id: params.runId }).eq("id", params.analysisId);
  const cas = params.expectedPreviousRunId ? base.eq("active_evidence_run_id", params.expectedPreviousRunId) : base.is("active_evidence_run_id", null);
  const { error } = await cas;
  if (error) return false;
  const { data } = await db.from("analyses").select("active_evidence_run_id").eq("id", params.analysisId).single();
  return data?.active_evidence_run_id === params.runId;
}

// ── Corrección manual de homologaciones ─────────────────────────────

export const VERSIONED_MANUAL_MAPPING_CORRECTION_PENDING = "VERSIONED_MANUAL_MAPPING_CORRECTION_PENDING";

export type ManualCorrectionDecision =
  | { allowed: true }
  | { allowed: false; code: typeof VERSIONED_MANUAL_MAPPING_CORRECTION_PENDING; message: string };

/**
 * Las filas de un evidence run son inmutables. Una corrección manual solo se
 * permite sobre el modelo legacy (caso sin run activo y fila sin run). En un
 * caso versionado la corrección crea un run nuevo derivado del activo
 * (Edge Function create-manual-mapping-run, ADR-011) → validate-analysis →
 * promoción CAS. El código se conserva por compatibilidad de clientes.
 */
export function evaluateManualMappingCorrection(params: { activeRunId: string | null | undefined; rowRunId: string | null | undefined }): ManualCorrectionDecision {
  if (!params.activeRunId && !params.rowRunId) return { allowed: true };
  return {
    allowed: false,
    code: VERSIONED_MANUAL_MAPPING_CORRECTION_PENDING,
    message: "Las homologaciones versionadas son inmutables. La corrección manual crea un nuevo Evidence run: create-manual-mapping-run (crearCorreccionMappingVersionada) y después validate-analysis con ese run.",
  };
}
