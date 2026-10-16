// Lectura del Judgment activo para construir el input del cálculo (I/O mínimo).
// Sin puntero → modo legacy (comportamiento previo, sin inventar valores).
// Con puntero → el set activo, validado fail-closed contra el evidence run activo.
import { resolveActiveJudgmentSet, type JudgmentEntryRow, type JudgmentResolution, type JudgmentSetRow } from "./judgment-sets.ts";
import type { Db } from "./evidence-runs.ts";

export type ActiveJudgmentLoad = { mode: "legacy" } | { mode: "judgment_set"; resolution: JudgmentResolution };

export async function loadActiveJudgment(db: Db, analysis: { id: string; active_judgment_set_id?: string | null; active_evidence_run_id?: string | null }): Promise<ActiveJudgmentLoad> {
  if (!analysis.active_judgment_set_id) return { mode: "legacy" };
  const { data: set, error } = await db.from("judgment_sets").select("*").eq("id", analysis.active_judgment_set_id).maybeSingle();
  if (error) throw new Error(`Error leyendo judgment_sets: ${error.message}`);
  const { data: entries, error: entriesError } = await db.from("judgment_entries").select("*").eq("judgment_set_id", analysis.active_judgment_set_id);
  if (entriesError) throw new Error(`Error leyendo judgment_entries: ${entriesError.message}`);
  return { mode: "judgment_set", resolution: resolveActiveJudgmentSet({ analysis, set: (set as JudgmentSetRow | null) ?? null, entries: (entries ?? []) as JudgmentEntryRow[] }) };
}
