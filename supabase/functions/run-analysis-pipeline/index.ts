import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { evaluateMapAccountsResult } from "../_shared/pipeline-guards.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, mapErrorToResponse, shouldNotifyPipelineError } from "../_shared/user-auth.ts";
import { evaluateEvidenceReprocessing, reprocessingRejectedAuditEvent, resolveEvidenceFinalStatus } from "../_shared/evidence-pipeline-guards.ts";

// Pipeline de EVIDENCE: PARSE → MAP ACCOUNTS → VALIDATE → STOP.
// Termina antes de build-structured-input y de ejecutar-calculo: el input
// del motor necesita Judgment (resolved_assumptions) y el cálculo es un
// paso posterior y explícito. Evidence ≠ Judgment ≠ Calculation.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Capturado una sola vez, tras leer el body con éxito — nunca se
  // vuelve a leer ni clonar `req` en el catch (el body ya fue
  // consumido por `req.json()` más abajo, y `req.clone()` después de
  // eso lanza porque la Fetch API no permite clonar un body ya leído).
  let capturedAnalysisId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const secretKey = resolveAdminSecretKey();
    const anonKey = resolvePublishableKey();
    const supabase = createClient(supabaseUrl, secretKey);
    const anonClient = createClient(supabaseUrl, anonKey);
    const user = await requireAuthenticatedUser(authHeader, async (token) => {
      const { data, error } = await anonClient.auth.getUser(token);
      return { user: data.user, error };
    });

    const { analysis_id } = await req.json();
    if (!analysis_id) throw new Error("analysis_id required");
    capturedAnalysisId = analysis_id;

    const { data: analysis, error: analysisError } = await supabase
      .from("analyses").select("*").eq("id", analysis_id).single();
    const lookup = classifyOwnedResourceLookup(analysisError, analysis, user.id);
    if (lookup === "not_found") throw new NotFoundError();
    if (lookup === "technical_error") throw analysisError;

    // Un caso con cálculo oficial persistido no se reprocesa automáticamente
    // (homologaciones/validaciones/estado cambiarían bajo ese cálculo).
    // Antes de tomar el lock y de tocar cualquier estado.
    const reprocessing = evaluateEvidenceReprocessing(analysis);
    if (!reprocessing.allowed) {
      await supabase.from("audit_events").insert(reprocessingRejectedAuditEvent({
        analysisId: analysis_id, userId: user.id, component: "run-analysis-pipeline", status: analysis.status, decision: reprocessing,
      }));
      return new Response(JSON.stringify({ success: false, error: { code: reprocessing.code, message: reprocessing.message } }), { status: reprocessing.httpStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check for existing running pipeline (idempotency)
    const { data: existingLock } = await supabase
      .from("job_locks")
      .select("*")
      .eq("job_key", `pipeline_${analysis_id}`)
      .single();

    if (existingLock && existingLock.expires_at && new Date(existingLock.expires_at) > new Date()) {
      return new Response(JSON.stringify({ success: false, error: { code: "CONFLICT", message: "Ya hay un análisis en curso para este caso. Por favor espera a que termine." } }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Acquire lock (3 minute expiry)
    const expiresAt = new Date(Date.now() + 180000).toISOString();
    await supabase.from("job_locks").upsert({
      job_key: `pipeline_${analysis_id}`,
      locked_at: new Date().toISOString(),
      locked_by: "run-analysis-pipeline",
      expires_at: expiresAt,
    }, { onConflict: "job_key" });

    // Helper: update job progress
    const updateJob = async (jobType: string, pct: number, mensaje: string, status = "en_progreso") => {
      await supabase.from("analysis_jobs").upsert({
        analysis_id,
        job_type: jobType,
        status,
        progreso_pct: pct,
        progreso_mensaje: mensaje,
        started_at: status === "en_progreso" ? new Date().toISOString() : undefined,
        completed_at: status === "completado" || status === "error" ? new Date().toISOString() : undefined,
      }, { onConflict: "analysis_id,job_type" });
    };

    // Get documents
    const { data: documents } = await supabase
      .from("documents").select("id, doc_type_declared, processing_status")
      .eq("analysis_id", analysis_id);

    if (!documents || documents.length === 0) {
      await releaseLock(supabase, analysis_id);
      return new Response(JSON.stringify({ success: false, error: { code: "NO_DOCUMENTS", message: "No se han cargado documentos para este análisis." } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const steps: any[] = [];

    // Step 1: Parse unparsed documents
    await updateJob("parsing", 10, "Extrayendo información de los documentos...");
    await supabase.from("analyses").update({ status: "parsing_en_curso" }).eq("id", analysis_id);

    const unparsed = documents.filter(d => d.processing_status !== "completado");
    for (const doc of unparsed) {
      try {
        await updateJob("parsing", 10 + Math.round((documents.indexOf(doc) / documents.length) * 30), `Procesando ${doc.doc_type_declared || "documento"}...`);

        const parseResp = await fetch(`${supabaseUrl}/functions/v1/parse-document`, {
          method: "POST",
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ analysis_id, document_id: doc.id }),
        });
        const parseResult = await parseResp.json();
        steps.push({ step: "parse", document_id: doc.id, success: parseResult.success, detail: parseResult.success ? `${parseResult.data?.rows_extracted} filas` : parseResult.error?.message });
        if (!parseResult.success) {
          await updateJob("parsing", 0, parseResult.error?.message || "Error en parsing", "error");
          await releaseLock(supabase, analysis_id);
          return new Response(JSON.stringify({
            success: false,
            error: { code: "PARSE_FAILED", message: `Error al procesar el documento ${doc.doc_type_declared}: ${parseResult.error?.message}` },
            data: { steps },
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } catch (e) {
        steps.push({ step: "parse", document_id: doc.id, success: false, detail: e instanceof Error ? e.message : "Error" });
        await updateJob("parsing", 0, "Error técnico durante el parsing", "error");
        await releaseLock(supabase, analysis_id);
        return new Response(JSON.stringify({ success: false, error: { code: "PARSE_ERROR", message: "Error técnico durante el parsing." }, data: { steps } }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    await updateJob("parsing", 100, "Documentos procesados correctamente.", "completado");

    // Step 2: Map accounts
    await updateJob("homologacion", 45, "Homologando cuentas contables con IA...");
    await supabase.from("analyses").update({ status: "homologacion_en_curso" }).eq("id", analysis_id);

    // Evidence run que produjo esta homologación: validate-analysis valida ESE run.
    let evidenceRunId: string | null = null;
    try {
      const mapResp = await fetch(`${supabaseUrl}/functions/v1/map-accounts`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id }),
      });
      const mapResult = await mapResp.json();
      steps.push({ step: "map-accounts", success: mapResult.success, detail: mapResult.success ? `${mapResult.data?.total_mapped} cuentas mapeadas` : mapResult.error?.message });

      // BL-06: antes, ni `success: false` ni `has_blocking_issues: true`
      // detenían el pipeline — la ejecución siempre continuaba a
      // validación con cuentas mal homologadas o sin homologar, y
      // terminaba produciendo un informe como si todo hubiera salido
      // bien. `evaluateMapAccountsResult` es la misma función pura que
      // prueba `pipeline-guards.test.ts`.
      const decision = evaluateMapAccountsResult(mapResult);
      if (decision.shouldAbort) {
        steps.push({ step: "map-accounts", success: false, detail: decision.errorMessage });
        await updateJob("homologacion", 0, decision.errorMessage || "Error en homologación", "error");
        await supabase.from("analyses").update({ status: decision.analysisStatus }).eq("id", analysis_id);
        await releaseLock(supabase, analysis_id);
        return new Response(JSON.stringify({
          success: false,
          error: { code: decision.errorCode, message: decision.errorMessage },
          data: { steps },
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      evidenceRunId = mapResult.data?.evidence_run_id ?? null;
      await updateJob("homologacion", 100, "Homologación completada.", "completado");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Error técnico durante la homologación.";
      steps.push({ step: "map-accounts", success: false, detail: errMsg });
      await updateJob("homologacion", 0, errMsg, "error");
      await supabase.from("analyses").update({ status: "error_tecnico" }).eq("id", analysis_id);
      await releaseLock(supabase, analysis_id);
      return new Response(JSON.stringify({
        success: false,
        error: { code: "MAP_ACCOUNTS_ERROR", message: errMsg },
        data: { steps },
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 3: Validate
    await updateJob("validacion", 55, "Ejecutando validaciones contables...");
    let validationStatus: string | null = null;
    try {
      const valResp = await fetch(`${supabaseUrl}/functions/v1/validate-analysis`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id, evidence_run_id: evidenceRunId }),
      });
      const valResult = await valResp.json();
      steps.push({ step: "validate", success: valResult.success, detail: `Estado: ${valResult.data?.validation_status}`, semaphore: valResult.data?.semaphore });

      if (!valResult.data?.can_proceed) {
        await updateJob("validacion", 0, "Validación bloqueada — revisa los documentos.", "error");
        await supabase.from("analyses").update({ status: "validacion_bloqueada" }).eq("id", analysis_id);
        await releaseLock(supabase, analysis_id);

        // Notify user about blocked analysis
        const failedRules = (valResult.data?.results || [])
          .filter((r: any) => r.status === "failed" && r.blocking)
          .map((r: any) => r.detail || r.rule_code);
        fetch(`${supabaseUrl}/functions/v1/enviar-notificacion`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": secretKey },
          body: JSON.stringify({ tipo: "analisis_bloqueado", analysis_id, datos_extra: { problemas: failedRules } }),
        }).catch(e => console.error("Notification error:", e));

        return new Response(JSON.stringify({
          success: false,
          error: { code: "VALIDATION_BLOCKED", message: "El análisis fue bloqueado por una o más validaciones críticas." },
          data: { steps, validation: valResult.data },
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      validationStatus = valResult.data?.validation_status ?? null;
      await updateJob("validacion", 100, "Validaciones aprobadas.", "completado");
    } catch (e) {
      // Antes la excepción de validación se ignoraba y el pipeline seguía hacia
      // el cálculo. Ahora no hay paso posterior: sin validación no hay un final
      // exitoso, así que se corta de forma explícita.
      const errMsg = e instanceof Error ? e.message : "Error técnico durante la validación.";
      steps.push({ step: "validate", success: false, detail: errMsg });
      await updateJob("validacion", 0, errMsg, "error");
      await supabase.from("analyses").update({ status: "error_tecnico" }).eq("id", analysis_id);
      await releaseLock(supabase, analysis_id);
      return new Response(JSON.stringify({
        success: false,
        error: { code: "VALIDATE_ERROR", message: errMsg },
        data: { steps },
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // FIN DEL PIPELINE DE EVIDENCE. `validate-analysis` ya dejó el estado final
    // (`validacion_aprobada` o `validacion_con_advertencias`); aquí NO se
    // construye el input estructurado, NO se calcula y NO se cambia el estado.
    const finalStatus = resolveEvidenceFinalStatus(validationStatus);
    if (!finalStatus) {
      const errMsg = `Estado de validación inesperado (${validationStatus ?? "sin dato"}): el pipeline de Evidence no puede darse por terminado.`;
      steps.push({ step: "validate", success: false, detail: errMsg });
      await updateJob("validacion", 0, errMsg, "error");
      await supabase.from("analyses").update({ status: "error_tecnico" }).eq("id", analysis_id);
      await releaseLock(supabase, analysis_id);
      return new Response(JSON.stringify({ success: false, error: { code: "VALIDATE_UNEXPECTED_STATUS", message: errMsg }, data: { steps } }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await releaseLock(supabase, analysis_id);

    // Evento nuevo; los `pipeline_complete` históricos no se tocan ni se reinterpretan.
    await supabase.from("audit_events").insert({
      analysis_id,
      event_type: "evidence_pipeline_complete",
      event_detail: `Evidence procesada (${steps.length} pasos): ${finalStatus}. Sin input estructurado ni cálculo.`,
      component: "run-analysis-pipeline",
      user_id: user.id,
      metadata: { steps, final_status: finalStatus, validation_status: validationStatus, stopped_before: ["build-structured-input", "ejecutar-calculo"] },
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        steps,
        status: finalStatus,
        message: "Evidence procesada. El cálculo requiere Judgment y una ejecución explícita.",
      },
      meta: { analysis_id, timestamp: new Date().toISOString() },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("pipeline error:", error);
    const mapped = mapErrorToResponse(error, { code: "PIPELINE_ERROR", message: "Error en el pipeline de análisis." });

    // Solo notifica errores técnicos reales (500) con analysis_id
    // capturado de forma segura — nunca por un 401 (fallo de
    // autenticación) ni un 404 (recurso ajeno, para no notificar al
    // dueño real por un intento de otro usuario).
    if (shouldNotifyPipelineError(mapped, capturedAnalysisId)) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        fetch(`${supabaseUrl}/functions/v1/enviar-notificacion`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": resolveAdminSecretKey() },
          body: JSON.stringify({ tipo: "error_analisis", analysis_id: capturedAnalysisId, datos_extra: { mensaje_error: error instanceof Error ? error.message : "Error técnico inesperado." } }),
        }).catch(e => console.error("Notification error:", e));
      } catch (e) {
        console.error("Notification error:", e);
      }
    }
    return new Response(JSON.stringify(mapped.body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function releaseLock(supabase: any, analysisId: string) {
  await supabase.from("job_locks").delete().eq("job_key", `pipeline_${analysisId}`);
}
