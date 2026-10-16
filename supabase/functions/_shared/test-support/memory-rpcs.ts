// Emulación EN MEMORIA de public.create_manual_mapping_run (migración
// 20261016150000) para los tests de handlers. Refleja la función SQL paso a
// paso; la versión real (atomicidad, lock, copia NUMERIC exacta) se prueba
// contra Postgres. Solo para tests.
import type { Row } from "./memory-db";

let seq = 0;
export function createManualMappingRunInMemory(tables: Record<string, Row[]>, args: Record<string, unknown>) {
  const err = (message: string) => ({ data: null, error: { message } });
  const analysis = (tables.analyses ?? []).find((a) => a.id === args.p_analysis_id);
  if (!analysis) return err("ANALYSIS_NOT_FOUND: análisis inexistente");
  if (analysis.calculation_result !== null && analysis.calculation_result !== undefined) return err("CASE_ALREADY_CALCULATED: el caso tiene un cálculo oficial");
  const active = analysis.active_evidence_run_id ?? null;
  if (!active || active !== args.p_expected_run_id) return err(`EVIDENCE_RUN_CHANGED: el run activo es ${active ?? "ninguno"}`);
  const run = (tables.evidence_runs ?? []).find((r) => r.id === active && r.analysis_id === args.p_analysis_id && r.status === "completed");
  if (!run) return err("ACTIVE_EVIDENCE_RUN_INVALID: el run activo no está completo");
  const source = (tables.account_homologations ?? []).filter((h) => h.analysis_id === args.p_analysis_id && h.evidence_run_id === active);
  const target = source.find((h) => h.id === args.p_homologation_id);
  if (!target) return err("HOMOLOGATION_NOT_IN_ACTIVE_RUN: la fila no pertenece al run activo");
  if (target.canonical_account === args.p_new_canonical_account) return err(`MANUAL_CORRECTION_NOOP: la fila ya está en ${String(target.canonical_account)}`);
  if (!String(args.p_reason ?? "").trim() || !args.p_actor) return err("MANUAL_CORRECTION_INVALID: motivo y actor obligatorios");
  const now = new Date().toISOString();
  const runId = `manual-run-${++seq}`;
  const newRun = { id: runId, analysis_id: args.p_analysis_id, status: "mapped", source_parsed_document_ids: [...((run.source_parsed_document_ids as string[]) ?? [])], previous_active_run_id: active, created_by: args.p_actor, mapped_at: now, started_at: now, origin: "manual_mapping_correction" };
  const copies = source.map((h, i) => {
    const hit = h.id === args.p_homologation_id;
    return {
      id: `${runId}-h${i}`, created_at: now,
      analysis_id: h.analysis_id, document_id: h.document_id, original_label: h.original_label,
      canonical_account: hit ? args.p_new_canonical_account : h.canonical_account,
      category: h.category, period: h.period, value: h.value,
      confidence_score: hit ? "alta" : h.confidence_score,
      ambiguity_flag: hit ? false : h.ambiguity_flag,
      mapping_notes: hit ? `Corrección manual de mapping (ver manual_correction_*) · ${String(h.mapping_notes ?? "")}` : h.mapping_notes,
      evidence_run_id: runId, derived_from_homologation_id: h.id,
      manual_correction_by: hit ? args.p_actor : (h.manual_correction_by ?? null), manual_correction_reason: hit ? String(args.p_reason).trim() : (h.manual_correction_reason ?? null),
      manual_corrected_at: hit ? now : (h.manual_corrected_at ?? null), previous_canonical_account: hit ? h.canonical_account : (h.previous_canonical_account ?? null),
    };
  });
  (tables.evidence_runs ??= []).push(newRun);
  (tables.account_homologations ??= []).push(...copies);
  return { data: [{ evidence_run_id: runId, homologations_copied: copies.length }], error: null };
}
