import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, BadRequestError, mapErrorToResponse } from "../_shared/user-auth.ts";
import { hasPersistedCalculation } from "../_shared/evidence-pipeline-guards.ts";
import {
  canTransition, effectiveEntries, isKnownJudgmentKey, materializeJudgmentSet,
  type JudgmentEntryRow, type JudgmentSetRow,
} from "../_shared/judgment-sets.ts";

// Write path del Judgment versionado (ADR-010). Único camino de escritura:
// el cliente no tiene políticas de INSERT/UPDATE sobre judgment_sets ni
// judgment_entries, y la base refuerza inmutabilidad y transiciones.
//
// Acciones: create_draft · add_entry · complete · fail · promote.
// Build then promote: un draft incompleto o fallido nunca mueve el puntero.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const fail = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) => json(status, { success: false, error: { code, message, ...extra } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, resolveAdminSecretKey());
    const anonClient = createClient(supabaseUrl, resolvePublishableKey());
    const user = await requireAuthenticatedUser(req.headers.get("Authorization"), async (token) => {
      const { data, error } = await anonClient.auth.getUser(token);
      return { user: data.user, error };
    });

    const body = await req.json();
    const { action, analysis_id } = body ?? {};
    if (!analysis_id || typeof action !== "string") throw new BadRequestError("BAD_REQUEST", "analysis_id y action son obligatorios.");

    const { data: analysis, error: analysisError } = await supabase.from("analyses").select("*").eq("id", analysis_id).single();
    const lookup = classifyOwnedResourceLookup(analysisError, analysis, user.id);
    if (lookup === "not_found") throw new NotFoundError();
    if (lookup === "technical_error") throw analysisError;
    if (hasPersistedCalculation(analysis)) {
      return fail(409, "CASE_ALREADY_CALCULATED", "Este caso ya tiene un cálculo oficial persistido; su Judgment no se modifica, para preservar el resultado oficial y su provenance.");
    }

    const audit = (event_type: string, event_detail: string, metadata: Record<string, unknown>) =>
      supabase.from("audit_events").insert({ analysis_id, event_type, event_detail, component: "judgment-sets", user_id: user.id, metadata });

    const loadSet = async (id: unknown): Promise<JudgmentSetRow> => {
      if (typeof id !== "string") throw new BadRequestError("BAD_REQUEST", "judgment_set_id es obligatorio.");
      const { data, error } = await supabase.from("judgment_sets").select("*").eq("id", id).eq("analysis_id", analysis_id).maybeSingle();
      if (error) throw error;
      if (!data) throw new NotFoundError();
      return data as JudgmentSetRow;
    };
    const loadEntries = async (setId: string): Promise<JudgmentEntryRow[]> => {
      const { data, error } = await supabase.from("judgment_entries").select("*").eq("judgment_set_id", setId);
      if (error) throw error;
      return (data ?? []) as JudgmentEntryRow[];
    };

    // ── create_draft ──
    if (action === "create_draft") {
      const evidenceRunId = analysis.active_evidence_run_id ?? null;
      if (!evidenceRunId) return fail(409, "NO_ACTIVE_EVIDENCE_RUN", "El Judgment se formula sobre un evidence run activo; este caso no tiene uno.");
      const id = crypto.randomUUID();
      let reused: { set: JudgmentSetRow; entries: JudgmentEntryRow[] } | null = null;
      if (body.reuse_from_judgment_set_id) {
        const src = await loadSet(body.reuse_from_judgment_set_id);
        if (src.status !== "completed") return fail(409, "REUSE_SOURCE_NOT_COMPLETED", "Solo se reutiliza un judgment set completado.");
        reused = { set: src, entries: effectiveEntries(src.id, await loadEntries(src.id)).entries };
      }
      const { error } = await supabase.from("judgment_sets").insert({
        id, analysis_id, evidence_run_id: evidenceRunId, status: "draft", created_by: user.id,
        previous_active_judgment_set_id: analysis.active_judgment_set_id ?? null,
        reused_from_judgment_set_id: reused?.set.id ?? null,
      });
      if (error) throw error;
      // Reutilización explícita: copia de las decisiones efectivas como entradas nuevas del draft,
      // con referencia a su origen. El draft sigue necesitando completarse y promoverse.
      if (reused?.entries.length) {
        const { error: copyError } = await supabase.from("judgment_entries").insert(reused.entries.map((e) => ({
          judgment_set_id: id, key: e.key, value: e.value, unit: e.unit ?? null, source: e.source, rationale: e.rationale,
          status: e.status, effective_date: e.effective_date ?? null, created_by: user.id,
          references: { reused_from_entry_id: e.id, reused_from_judgment_set_id: reused!.set.id, original_references: e.references ?? null },
        })));
        if (copyError) throw copyError;
      }
      await audit("judgment_set_created", `Judgment set draft sobre el evidence run ${evidenceRunId}${reused ? ` (reutiliza ${reused.set.id})` : ""}`, { judgment_set_id: id, evidence_run_id: evidenceRunId, reused_from_judgment_set_id: reused?.set.id ?? null });
      return json(200, { success: true, data: { judgment_set_id: id, status: "draft", evidence_run_id: evidenceRunId } });
    }

    const set = await loadSet(body.judgment_set_id);

    // ── add_entry (supersession, nunca mutación) ──
    if (action === "add_entry") {
      const t = canTransition(set, "add_entry");
      if (!t.allowed) return fail(409, "JUDGMENT_SET_NOT_DRAFT", t.reason);
      const { key, value, unit, source, rationale, status, effective_date, references, supersedes_entry_id } = body;
      if (typeof key !== "string" || !isKnownJudgmentKey(key)) return fail(400, "UNKNOWN_JUDGMENT_KEY", `Key desconocida: ${JSON.stringify(key)}.`);
      if (value === undefined) return fail(400, "JUDGMENT_VALUE_REQUIRED", "value es obligatorio (null explícito no es un Judgment resuelto).");
      if (status !== "resolved" && status !== "proposed") return fail(400, "INVALID_JUDGMENT_STATUS", "status debe ser resolved o proposed.");
      const current = effectiveEntries(set.id, await loadEntries(set.id)).entries.filter((e) => e.key === key);
      if (current.length && supersedes_entry_id !== current[0].id) {
        return fail(409, "SUPERSESSION_REQUIRED", `"${key}" ya tiene una entrada efectiva; una corrección debe superarla explícitamente (supersedes_entry_id = ${current[0].id}).`);
      }
      const { error } = await supabase.from("judgment_entries").insert({
        judgment_set_id: set.id, key, value, unit: unit ?? null, source, rationale, status,
        effective_date: effective_date ?? null, references: references ?? null, supersedes_entry_id: supersedes_entry_id ?? null, created_by: user.id,
      });
      if (error) return fail(400, "JUDGMENT_ENTRY_REJECTED", error.message);
      await audit("judgment_entry_added", `Judgment ${key}${supersedes_entry_id ? " (supersede)" : ""}`, { judgment_set_id: set.id, key, supersedes_entry_id: supersedes_entry_id ?? null });
      return json(200, { success: true, data: { judgment_set_id: set.id, key } });
    }

    // ── fail ──
    if (action === "fail") {
      const t = canTransition(set, "fail");
      if (!t.allowed) return fail(409, "JUDGMENT_SET_NOT_DRAFT", t.reason);
      await supabase.from("judgment_sets").update({ status: "failed", failed_at: new Date().toISOString(), error_code: "ABANDONED", error_detail: String(body.reason ?? "").slice(0, 2000) }).eq("id", set.id).eq("status", "draft");
      await audit("judgment_set_failed", "Judgment set descartado", { judgment_set_id: set.id });
      return json(200, { success: true, data: { judgment_set_id: set.id, status: "failed" } });
    }

    // ── complete: validación fail-closed del set entero ──
    if (action === "complete") {
      const t = canTransition(set, "complete");
      if (!t.allowed) return fail(409, "JUDGMENT_SET_NOT_DRAFT", t.reason);
      if (set.evidence_run_id !== (analysis.active_evidence_run_id ?? null)) {
        return fail(409, "EVIDENCE_RUN_CHANGED", "El evidence run activo cambió desde que se creó este draft; formula el Judgment sobre el run vigente (reutilización explícita).");
      }
      const m = materializeJudgmentSet(set, await loadEntries(set.id));
      if (!m.ok) return fail(409, "JUDGMENT_SET_INCOMPLETE", "El set no está completo o tiene valores inválidos.", { issues: m.issues });
      const { data: updated } = await supabase.from("judgment_sets").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", set.id).eq("status", "draft").select("id");
      if (!Array.isArray(updated) || updated.length !== 1) return fail(409, "JUDGMENT_SET_NOT_DRAFT", "El set ya no estaba en draft.");
      await audit("judgment_set_completed", "Judgment set completo y validado", { judgment_set_id: set.id, evidence_run_id: set.evidence_run_id });
      return json(200, { success: true, data: { judgment_set_id: set.id, status: "completed" } });
    }

    // ── promote: CAS del puntero + proyección del Judgment del caso en la MISMA fila ──
    if (action === "promote") {
      const t = canTransition(set, "promote");
      if (!t.allowed) return fail(409, "JUDGMENT_SET_NOT_PROMOTABLE", t.reason);
      if (set.evidence_run_id !== (analysis.active_evidence_run_id ?? null)) {
        return fail(409, "EVIDENCE_RUN_MISMATCH", "El set se formuló sobre otro evidence run; no se promueve contra el run activo sin una reutilización explícita.");
      }
      const m = materializeJudgmentSet(set, await loadEntries(set.id));
      if (!m.ok) return fail(409, "JUDGMENT_SET_INCOMPLETE", "El set completado no materializa (estado inconsistente).", { issues: m.issues });
      const c = m.judgment.caseJudgment;
      const prev = analysis.active_judgment_set_id ?? null;
      // Las columnas legacy de analyses quedan como PROYECCIÓN del set activo (display); la fuente canónica es el set.
      const base = supabase.from("analyses").update({
        active_judgment_set_id: set.id,
        expected_growth: c.expected_growth, valuation_date: c.valuation_date, basis_of_value: c.basis_of_value,
        valued_interest: c.valued_interest, calculation_architecture: c.calculation_architecture,
      }).eq("id", analysis_id).eq("active_evidence_run_id", set.evidence_run_id);
      const cas = prev ? base.eq("active_judgment_set_id", prev) : base.is("active_judgment_set_id", null);
      const { data: moved, error } = await cas.select("id");
      if (error || !Array.isArray(moved) || moved.length !== 1) {
        return fail(409, "JUDGMENT_PROMOTION_CONFLICT", "El Judgment activo o el evidence run activo cambiaron; el set no se promovió.");
      }
      await supabase.from("judgment_sets").update({ promoted_at: new Date().toISOString() }).eq("id", set.id).eq("status", "completed");
      await audit("judgment_set_promoted", "Judgment set promovido como activo", { judgment_set_id: set.id, previous_active_judgment_set_id: prev, evidence_run_id: set.evidence_run_id });
      return json(200, { success: true, data: { judgment_set_id: set.id, active: true, previous_active_judgment_set_id: prev } });
    }

    return fail(400, "UNKNOWN_ACTION", `Acción desconocida: ${action}.`);
  } catch (error) {
    console.error("judgment-sets error:", error);
    const mapped = mapErrorToResponse(error, { code: "JUDGMENT_SETS_ERROR", message: "Error en el Judgment versionado." });
    return new Response(JSON.stringify(mapped.body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
