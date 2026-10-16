import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveBasePeriod } from "../_shared/period-resolution.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { evaluateEvidenceReprocessing, reprocessingRejectedAuditEvent } from "../_shared/evidence-pipeline-guards.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, mapErrorToResponse } from "../_shared/user-auth.ts";
import { evaluate, summarizeEvidenceValidation } from "../_shared/validation-rules.ts";
import { selectRunToValidate, claimRunForValidation, markEvidenceRun, failEvidenceRun, promoteEvidenceRun } from "../_shared/evidence-runs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Run que esta validación procesa; un fallo antes de completarlo lo marca
  // failed (el set activo anterior sigue intacto).
  let evidenceRunId: string | null = null;
  let runFinished = false;
  let failedAnalysisId: string | null = null;
  let db: Parameters<typeof failEvidenceRun>[0] | null = null;
  try {
    const authHeader = req.headers.get("Authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const secretKey = resolveAdminSecretKey();
    const anonKey = resolvePublishableKey();
    const supabase = createClient(supabaseUrl, secretKey);
    db = supabase;
    const anonClient = createClient(supabaseUrl, anonKey);
    const user = await requireAuthenticatedUser(authHeader, async (token) => {
      const { data, error } = await anonClient.auth.getUser(token);
      return { user: data.user, error };
    });

    const { analysis_id, evidence_run_id: requestedRunId } = await req.json();
    if (!analysis_id) throw new Error("analysis_id required");

    const { data: analysis, error: analysisError } = await supabase.from("analyses").select("*").eq("id", analysis_id).single();
    const lookup = classifyOwnedResourceLookup(analysisError, analysis, user.id);
    if (lookup === "not_found") throw new NotFoundError();
    if (lookup === "technical_error") throw analysisError;

    // Caso con cálculo oficial persistido: este endpoint de Evidence no lo
    // reprocesa. Antes de cualquier escritura; el audit event es la única.
    // Se preserva el resultado oficial y su provenance; el versionado de
    // Evidence (ADR-009) solo aplica a casos no calculados.
    const reprocessing = evaluateEvidenceReprocessing(analysis);
    if (!reprocessing.allowed) {
      await supabase.from("audit_events").insert(reprocessingRejectedAuditEvent({
        analysisId: analysis_id, userId: user.id, component: "validate-analysis", status: (analysis as { status?: string }).status, decision: reprocessing,
      }));
      return new Response(JSON.stringify({ success: false, error: { code: reprocessing.code, message: reprocessing.message } }), { status: reprocessing.httpStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Versionado: se valida EXACTAMENTE la homologación de un run (el que pide
    // el pipeline, o el último homologado pendiente) — nunca una mezcla de runs.
    const { data: runs } = await supabase.from("evidence_runs").select("id, status, started_at, previous_active_run_id").eq("analysis_id", analysis_id);
    const pick = selectRunToValidate(runs || [], requestedRunId ?? null);
    if ("error" in pick) {
      return new Response(JSON.stringify({ success: false, error: { code: pick.error, message: pick.message } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const run = pick.run;
    // Reclamo atómico (mapped → validating): un segundo validate concurrente del
    // mismo run no duplica validaciones ni marca fallido un run ya promovido.
    if (!(await claimRunForValidation(supabase, run.id))) {
      return new Response(JSON.stringify({ success: false, error: { code: "EVIDENCE_RUN_ALREADY_CLAIMED", message: "Este evidence run ya se está validando o ya fue validado." } }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    evidenceRunId = run.id;
    failedAnalysisId = analysis_id;

    const { data: accounts } = await supabase.from("account_homologations").select("*").eq("analysis_id", analysis_id).eq("evidence_run_id", run.id);
    if (!accounts || accounts.length === 0) {
      await failEvidenceRun(supabase, run.id, "validation", "NO_ACCOUNTS", "El run no tiene cuentas homologadas.");
      runFinished = true;
      return new Response(JSON.stringify({ success: false, error: { code: "NO_ACCOUNTS", message: "No hay cuentas homologadas." } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: documents } = await supabase.from("documents").select("*").eq("analysis_id", analysis_id);

    // Bug 2 — política provisional de base_period: se resuelve un único
    // período base ANTES de leer ninguna cifra financiera. Si es ambiguo,
    // la validación financiera no se ejecuta como si los datos fueran
    // correctos — se bloquea de forma explícita y trazable.
    const periodResolution = resolveBasePeriod(accounts.map((a: any) => a.period ?? null));
    if (!periodResolution.ok) {
      await failEvidenceRun(supabase, run.id, "validation", "PERIOD_AMBIGUOUS", periodResolution.reason ?? "Período base ambiguo.");
      runFinished = true;
      await supabase.from("analyses").update({ status: "validacion_bloqueada", validation_status: "bloqueado" }).eq("id", analysis_id);
      await supabase.from("audit_events").insert({
        analysis_id, event_type: "periodo_base_ambiguo",
        event_detail: periodResolution.reason ?? "Período base ambiguo — requiere revisión humana.",
        component: "validate-analysis", user_id: user.id,
        metadata: { available_periods: periodResolution.availablePeriods, selection_mode: periodResolution.selectionMode },
      });
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: "PERIOD_AMBIGUOUS",
          message: "Período base ambiguo — requiere revisión humana antes de continuar.",
          detail: periodResolution.reason,
          available_periods: periodResolution.availablePeriods,
        },
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const basePeriod = periodResolution.basePeriod;
    const periods = periodResolution.availablePeriods;

    const results = evaluate(accounts, documents || [], periods, basePeriod);

    // Count issues — only DOC rules can block now. Validación de EVIDENCE: no
    // evalúa si el caso está listo para calcular (eso exige Judgment).
    const summary = summarizeEvidenceValidation(results);
    const hasCritical = summary.criticalCount > 0;

    // Store results — sin borrar los anteriores: ligados a este run.
    const { error: insertError } = await supabase.from("validation_results").insert(
      results.map(r => ({
        analysis_id,
        evidence_run_id: run.id,
        rule_code: r.code,
        severity: r.severity,
        status: r.passed ? "passed" : "failed",
        detail: r.detail,
        blocking_flag: !r.passed && r.blocking,
      }))
    );
    if (insertError) throw new Error(`Error al guardar validaciones: ${insertError.message}`);

    // Etapa completa → promoción (build then promote). El puntero solo se mueve
    // si sigue apuntando al run activo que existía cuando este run empezó
    // (compare-and-swap): un run viejo nunca pisa a uno más nuevo.
    const now = new Date().toISOString();
    await markEvidenceRun(supabase, run.id, { status: "completed", validated_at: now, completed_at: now });
    runFinished = true;
    const promoted = await promoteEvidenceRun(supabase, { analysisId: analysis_id, runId: run.id, expectedPreviousRunId: run.previous_active_run_id ?? null });
    if (!promoted) {
      await failEvidenceRun(supabase, run.id, "promotion", "PROMOTION_CONFLICT", "El run activo cambió mientras este run se procesaba; no se promovió.");
      return new Response(JSON.stringify({ success: false, error: { code: "EVIDENCE_RUN_PROMOTION_CONFLICT", message: "Otro evidence run se promovió mientras este se procesaba. El set activo no cambió." } }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await markEvidenceRun(supabase, run.id, { promoted_at: new Date().toISOString() });

    // Semaphore — much more tolerant (see summarizeEvidenceValidation)
    const { semaphore, validationStatus, analysisStatus, warningCount } = summary;

    await supabase.from("analyses").update({ status: analysisStatus, validation_status: validationStatus }).eq("id", analysis_id);

    await supabase.from("audit_events").insert({
      analysis_id, event_type: "validation_complete",
      event_detail: `Validación de Evidence: ${validationStatus} — semáforo: ${semaphore}. No evalúa la preparación para el cálculo (requiere Judgment).`,
      component: "validate-analysis", user_id: user.id,
      metadata: { evidence_run_id: run.id, previous_active_run_id: run.previous_active_run_id ?? null, validation_status: validationStatus, semaphore, critical_failures: summary.criticalCount, warnings: warningCount, scope: summary.scope, calculation_readiness: summary.calculationReadiness },
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        evidence_run_id: run.id,
        validation_status: validationStatus,
        semaphore: { color: semaphore, label: summary.label, can_proceed: !hasCritical, critical_count: summary.criticalCount, warning_count: warningCount },
        results: results.map(r => ({ rule_code: r.code, severity: r.severity, status: r.passed ? "passed" : "failed", detail: r.detail, blocking: !r.passed && r.blocking })),
        can_proceed: !hasCritical,
        scope: summary.scope,
        calculation_readiness: summary.calculationReadiness,
      },
      meta: { analysis_id, status: analysisStatus, timestamp: new Date().toISOString() },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("validate-analysis error:", error);
    if (evidenceRunId && !runFinished && db) {
      await failEvidenceRun(db, evidenceRunId, "validation", "VALIDATION_ERROR", error instanceof Error ? error.message : String(error)).catch(() => {});
      // Último intento fallido: no queda "en curso". El puntero activo no se toca.
      if (failedAnalysisId) await db.from("analyses").update({ status: "error_tecnico" }).eq("id", failedAnalysisId).then(() => {}, () => {});
    }
    const mapped = mapErrorToResponse(error, { code: "VALIDATION_ERROR", message: "Error en la validación." });
    // El run fallido queda trazable; el set activo anterior no cambió.
    const body = evidenceRunId && !runFinished ? { ...mapped.body, data: { evidence_run_id: evidenceRunId, evidence_run_status: "failed" } } : mapped.body;
    return new Response(JSON.stringify(body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
