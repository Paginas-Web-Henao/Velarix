import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, BadRequestError, mapErrorToResponse } from "../_shared/user-auth.ts";
import { hasPersistedCalculation } from "../_shared/evidence-pipeline-guards.ts";
import {
  classifyCorrectionRpcError, evaluateCorrectionTarget,
  MANUAL_CORRECTION_ACTOR_FIELDS, MANUAL_CORRECTION_REASON_MIN, MANUAL_CORRECTION_ROLES,
} from "../_shared/manual-mapping-correction.ts";

// Corrección manual de homologación sobre Evidence VERSIONADA (ADR-011, LIM-09).
// Nunca UPDATE: construye un evidence run NUEVO derivado del activo (RPC
// transaccional create_manual_mapping_run: copia exacta + corrección en el
// INSERT, mismas source_parsed_document_ids, sin reparse) y lo deja `mapped`.
// La validación y la promoción son las de siempre: validate-analysis con
// evidence_run_id = run nuevo (CAS contra previous_active_run_id, ADR-009).
// Este endpoint NO promueve. El run anterior queda intacto.
//
// Body: analysis_id, expected_active_evidence_run_id, homologation_id,
//       new_canonical_account, reason. El actor lo fija el servidor.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const fail = (status: number, code: string, message: string) => json(status, { success: false, error: { code, message } });

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
    const { analysis_id, expected_active_evidence_run_id: expectedRunId, homologation_id: homologationId, new_canonical_account: target } = body ?? {};
    if (!analysis_id || typeof expectedRunId !== "string" || typeof homologationId !== "string" || typeof target !== "string") {
      throw new BadRequestError("BAD_REQUEST", "analysis_id, expected_active_evidence_run_id, homologation_id y new_canonical_account son obligatorios.");
    }
    const actorFields = MANUAL_CORRECTION_ACTOR_FIELDS.filter((f) => Object.prototype.hasOwnProperty.call(body, f));
    if (actorFields.length) return fail(400, "ACTOR_FIELDS_NOT_ACCEPTED", `El actor lo fija el servidor (usuario autenticado); no se aceptan: ${actorFields.join(", ")}.`);
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length < MANUAL_CORRECTION_REASON_MIN) return fail(400, "MANUAL_CORRECTION_REASON_REQUIRED", `El motivo humano debe tener al menos ${MANUAL_CORRECTION_REASON_MIN} caracteres.`);

    const { data: analysis, error: analysisError } = await supabase.from("analyses").select("*").eq("id", analysis_id).single();
    const lookup = classifyOwnedResourceLookup(analysisError, analysis, user.id);
    if (lookup === "not_found") throw new NotFoundError();
    if (lookup === "technical_error") throw analysisError;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!MANUAL_CORRECTION_ROLES.includes(String(profile?.role ?? ""))) return fail(403, "MANUAL_CORRECTION_ROLE_REQUIRED", "Solo un perfil analyst/admin corrige homologaciones.");
    if (hasPersistedCalculation(analysis)) {
      return fail(409, "CASE_ALREADY_CALCULATED", "Este caso ya tiene un cálculo oficial persistido; su Evidence no se modifica, para preservar el resultado oficial y su provenance.");
    }
    const activeRunId: string | null = analysis.active_evidence_run_id ?? null;
    if (!activeRunId) return fail(409, "NOT_VERSIONED_EVIDENCE", "El caso no tiene un evidence run activo; la corrección legacy sigue en manual-review (corregirCuenta).");
    if (activeRunId !== expectedRunId) return fail(409, "EVIDENCE_RUN_CHANGED", `El run activo es ${activeRunId}, no ${expectedRunId}; vuelve a leer la Evidence activa antes de corregir.`);

    const { data: row, error: rowError } = await supabase.from("account_homologations").select("id, canonical_account, category")
      .eq("id", homologationId).eq("analysis_id", analysis_id).eq("evidence_run_id", activeRunId).maybeSingle();
    if (rowError) throw rowError;
    if (!row) return fail(409, "HOMOLOGATION_NOT_IN_ACTIVE_RUN", "La homologación no pertenece al evidence run activo de este caso.");
    const decision = evaluateCorrectionTarget(row, target);
    if (!decision.ok) return fail(400, decision.code, decision.message);

    // Construcción atómica (una transacción): CAS contra el run activo esperado + copia exacta.
    const { data: built, error: rpcError } = await supabase.rpc("create_manual_mapping_run", {
      p_analysis_id: analysis_id, p_expected_run_id: expectedRunId, p_homologation_id: homologationId,
      p_new_canonical_account: target, p_reason: reason, p_actor: user.id,
    });
    if (rpcError) {
      const c = classifyCorrectionRpcError(rpcError);
      return fail(c.status, c.code, rpcError.message ?? "La corrección no se aplicó.");
    }
    const result = (Array.isArray(built) ? built[0] : built) as { evidence_run_id: string; homologations_copied: number } | null;
    if (!result?.evidence_run_id) throw new Error("create_manual_mapping_run no devolvió el run creado.");

    await supabase.from("audit_events").insert({
      analysis_id, event_type: "manual_mapping_run_created", component: "create-manual-mapping-run", user_id: user.id,
      event_detail: `Corrección manual de mapping: ${row.canonical_account} → ${target} (run nuevo pendiente de validar)`,
      metadata: {
        evidence_run_id: result.evidence_run_id, previous_active_run_id: activeRunId, source_homologation_id: homologationId,
        previous_canonical_account: row.canonical_account, new_canonical_account: target, homologations_copied: result.homologations_copied,
        reason_length: reason.length,
      },
    });
    return json(200, {
      success: true,
      data: { evidence_run_id: result.evidence_run_id, evidence_run_status: "mapped", previous_active_run_id: activeRunId, homologations_copied: result.homologations_copied, next_step: "validate-analysis" },
    });
  } catch (error) {
    console.error("create-manual-mapping-run error:", error);
    const mapped = mapErrorToResponse(error, { code: "MANUAL_CORRECTION_ERROR", message: "Error en la corrección manual de homologación." });
    return new Response(JSON.stringify(mapped.body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
