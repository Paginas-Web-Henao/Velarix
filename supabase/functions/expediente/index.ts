import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, BadRequestError, mapErrorToResponse } from "../_shared/user-auth.ts";
import { hasPersistedCalculation } from "../_shared/evidence-pipeline-guards.ts";
import { applyActiveRunFilter } from "../_shared/evidence-runs.ts";
import { EXPEDIENTE_ACTOR_FIELDS, EXPEDIENTE_ROLES, normalizeExpedienteText } from "../_shared/expediente-write.ts";

// Write path del Minimum Expediente (cierra LIM-11). Es revisión humana /
// Judgment: no Evidence, no Calculation. Append-only (las 4 tablas no tienen
// UPDATE ni DELETE, decisión 7 de la migración 20260817140000): una
// corrección es una fila nueva. El actor SIEMPRE es el usuario autenticado;
// el body no puede fijar created_by / generado_por / respondido_por, ni
// declarar preguntas generadas por IA (la IA no escribe por esta vía).
//
// Acciones: ensure_valuation_file · add_account_note · add_question · add_answer.

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
    const { action, analysis_id } = body ?? {};
    if (!analysis_id || typeof action !== "string") throw new BadRequestError("BAD_REQUEST", "analysis_id y action son obligatorios.");
    const actorFields = EXPEDIENTE_ACTOR_FIELDS.filter((f) => Object.prototype.hasOwnProperty.call(body, f));
    if (actorFields.length) return fail(400, "ACTOR_FIELDS_NOT_ACCEPTED", `El actor lo fija el servidor (usuario autenticado); no se aceptan: ${actorFields.join(", ")}.`);

    const { data: analysis, error: analysisError } = await supabase.from("analyses").select("*").eq("id", analysis_id).single();
    const lookup = classifyOwnedResourceLookup(analysisError, analysis, user.id);
    if (lookup === "not_found") throw new NotFoundError();
    if (lookup === "technical_error") throw analysisError;
    // Mismo criterio que la RLS del Expediente: solo analyst/admin registran revisión humana.
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!EXPEDIENTE_ROLES.includes(String(profile?.role ?? ""))) return fail(403, "EXPEDIENTE_ROLE_REQUIRED", "Solo un perfil analyst/admin registra el Expediente.");
    // El Expediente que soportó un cálculo oficial no se modifica retroactivamente.
    if (hasPersistedCalculation(analysis)) {
      return fail(409, "CASE_ALREADY_CALCULATED", "Este caso ya tiene un cálculo oficial persistido; su Expediente no se modifica, para preservar el resultado oficial y su provenance.");
    }

    const audit = (event_type: string, event_detail: string, metadata: Record<string, unknown>) =>
      supabase.from("audit_events").insert({ analysis_id, event_type, event_detail, component: "expediente", user_id: user.id, metadata });

    // valuation_files es 1:1 con analyses (UNIQUE): crear si falta; idempotente y seguro ante carrera.
    const ensureValuationFile = async (): Promise<{ id: string; created: boolean }> => {
      const find = async () => {
        const { data, error } = await supabase.from("valuation_files").select("id").eq("analysis_id", analysis_id).maybeSingle();
        if (error) throw error;
        return data as { id: string } | null;
      };
      const existing = await find();
      if (existing) return { id: existing.id, created: false };
      const id = crypto.randomUUID();
      const { error } = await supabase.from("valuation_files").insert({ id, analysis_id, created_by: user.id });
      if (error) {
        const raced = await find(); // otra llamada lo creó en paralelo (UNIQUE analysis_id)
        if (raced) return { id: raced.id, created: false };
        throw error;
      }
      await audit("valuation_file_created", "Expediente del caso creado", { valuation_file_id: id });
      return { id, created: true };
    };

    if (action === "ensure_valuation_file") {
      const vf = await ensureValuationFile();
      return json(200, { success: true, data: { valuation_file_id: vf.id, created: vf.created } });
    }

    if (action === "add_account_note") {
      const canonical = normalizeExpedienteText(body.canonical_account, 200);
      const text = normalizeExpedienteText(body.interpretation_text);
      if (!canonical.ok) return fail(400, "CANONICAL_ACCOUNT_REQUIRED", `canonical_account ${canonical.reason}.`);
      if (!text.ok) return fail(400, "INTERPRETATION_TEXT_REQUIRED", `interpretation_text ${text.reason}.`);
      // La nota debe referirse a una cuenta del set ACTIVO de Evidence (legacy si el puntero es NULL).
      const { data: rows, error: rowsError } = await applyActiveRunFilter(
        supabase.from("account_homologations").select("canonical_account").eq("analysis_id", analysis_id).eq("canonical_account", canonical.value),
        analysis.active_evidence_run_id ?? null,
      );
      if (rowsError) throw rowsError;
      if (!rows?.length) return fail(400, "CANONICAL_ACCOUNT_NOT_IN_ACTIVE_EVIDENCE", `"${canonical.value}" no está en el set activo de Evidence de este caso.`);
      const vf = await ensureValuationFile();
      const id = crypto.randomUUID();
      const { error } = await supabase.from("account_notes").insert({ id, valuation_file_id: vf.id, canonical_account: canonical.value, interpretation_text: text.value, created_by: user.id });
      if (error) throw error;
      await audit("account_note_added", `Nota de cuenta ${canonical.value}`, { valuation_file_id: vf.id, account_note_id: id, canonical_account: canonical.value, text_length: text.value.length });
      return json(200, { success: true, data: { valuation_file_id: vf.id, account_note_id: id } });
    }

    if (action === "add_question") {
      const texto = normalizeExpedienteText(body.texto);
      if (!texto.ok) return fail(400, "QUESTION_TEXT_REQUIRED", `texto ${texto.reason}.`);
      const razon = body.razon === undefined || body.razon === null ? null : normalizeExpedienteText(body.razon);
      if (razon && !razon.ok) return fail(400, "QUESTION_REASON_INVALID", `razon ${razon.reason}.`);
      const materialidad = body.materialidad ?? null;
      if (materialidad !== null && !["alta", "media", "baja"].includes(materialidad)) return fail(400, "QUESTION_MATERIALITY_INVALID", "materialidad debe ser alta, media o baja.");
      const vf = await ensureValuationFile();
      const id = crypto.randomUUID();
      const { error } = await supabase.from("expedient_questions").insert({
        id, valuation_file_id: vf.id, texto: texto.value, razon: razon ? razon.value : null, materialidad,
        generado_por_ia: false, generado_por: user.id,
      });
      if (error) throw error;
      await audit("expedient_question_added", "Pregunta del Expediente registrada", { valuation_file_id: vf.id, question_id: id, materialidad, text_length: texto.value.length });
      return json(200, { success: true, data: { valuation_file_id: vf.id, question_id: id } });
    }

    if (action === "add_answer") {
      if (typeof body.question_id !== "string") return fail(400, "QUESTION_ID_REQUIRED", "question_id es obligatorio.");
      const text = normalizeExpedienteText(body.respuesta_texto);
      if (!text.ok) return fail(400, "ANSWER_TEXT_REQUIRED", `respuesta_texto ${text.reason}.`);
      const { data: vf, error: vfError } = await supabase.from("valuation_files").select("id").eq("analysis_id", analysis_id).maybeSingle();
      if (vfError) throw vfError;
      if (!vf) throw new NotFoundError();
      // La pregunta debe pertenecer al Expediente de ESTE caso (nunca a otro).
      const { data: q, error: qError } = await supabase.from("expedient_questions").select("id, valuation_file_id").eq("id", body.question_id).eq("valuation_file_id", vf.id).maybeSingle();
      if (qError) throw qError;
      if (!q) throw new NotFoundError();
      const id = crypto.randomUUID();
      // Historial de respuestas: append-only (sin UNIQUE(question_id), decisión 5). `estado` de la
      // pregunta no se reescribe; el tratamiento humano se deriva de que exista una respuesta.
      const { error } = await supabase.from("expedient_answers").insert({ id, question_id: q.id, respuesta_texto: text.value, respondido_por: user.id });
      if (error) throw error;
      await audit("expedient_answer_added", "Respuesta humana registrada", { valuation_file_id: vf.id, question_id: q.id, answer_id: id, text_length: text.value.length });
      return json(200, { success: true, data: { valuation_file_id: vf.id, question_id: q.id, answer_id: id } });
    }

    return fail(400, "UNKNOWN_ACTION", `Acción desconocida: ${action}.`);
  } catch (error) {
    console.error("expediente error:", error);
    const mapped = mapErrorToResponse(error, { code: "EXPEDIENTE_ERROR", message: "Error en el Expediente." });
    return new Response(JSON.stringify(mapped.body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
