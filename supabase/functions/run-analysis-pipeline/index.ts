import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const anonClient = createClient(supabaseUrl, anonKey.length > 0 ? anonKey : serviceRoleKey);
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    const { analysis_id } = await req.json();
    if (!analysis_id) throw new Error("analysis_id required");

    const { data: analysis } = await supabase
      .from("analyses").select("*").eq("id", analysis_id).single();
    if (!analysis || analysis.user_id !== user.id) throw new Error("Not found");

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

    try {
      const mapResp = await fetch(`${supabaseUrl}/functions/v1/map-accounts`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id }),
      });
      const mapResult = await mapResp.json();
      steps.push({ step: "map-accounts", success: mapResult.success, detail: mapResult.success ? `${mapResult.data?.total_mapped} cuentas mapeadas` : mapResult.error?.message });

      if (mapResult.data?.has_blocking_issues) {
        steps.push({ step: "map-accounts", success: false, detail: `Cuentas críticas faltantes: ${mapResult.data.missing_critical.join(", ")}` });
      }
      await updateJob("homologacion", 100, "Homologación completada.", "completado");
    } catch (e) {
      steps.push({ step: "map-accounts", success: false, detail: e instanceof Error ? e.message : "Error" });
      await updateJob("homologacion", 0, "Error en homologación", "error");
    }

    // Step 3: Validate
    await updateJob("validacion", 55, "Ejecutando validaciones contables...");
    try {
      const valResp = await fetch(`${supabaseUrl}/functions/v1/validate-analysis`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id }),
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
          headers: { "Content-Type": "application/json", "Authorization": authHeader },
          body: JSON.stringify({ tipo: "analisis_bloqueado", analysis_id, datos_extra: { problemas: failedRules } }),
        }).catch(e => console.error("Notification error:", e));

        return new Response(JSON.stringify({
          success: false,
          error: { code: "VALIDATION_BLOCKED", message: "El análisis fue bloqueado por una o más validaciones críticas." },
          data: { steps, validation: valResult.data },
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await updateJob("validacion", 100, "Validaciones aprobadas.", "completado");
    } catch (e) {
      steps.push({ step: "validate", success: false, detail: e instanceof Error ? e.message : "Error" });
      await updateJob("validacion", 0, "Error en validación", "error");
    }

    // Step 4: Build structured input (with 55s timeout)
    await updateJob("calculo", 65, "Construyendo input estructurado para el motor...");
    await supabase.from("analyses").update({ status: "calculo_en_curso" }).eq("id", analysis_id);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);

      const buildResp = await fetch(`${supabaseUrl}/functions/v1/build-structured-input`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const buildResult = await buildResp.json();
      steps.push({ step: "build-structured-input", success: buildResult.success, detail: buildResult.success ? "Input estructurado construido" : buildResult.error?.message });

      if (buildResult.success) {
        // Validate that we got meaningful data
        const si = buildResult.data;
        const revenue = si?.income_statement?.revenue;
        console.log("[calculo] Structured input keys:", Object.keys(si || {}));
        console.log("[calculo] Revenue:", revenue);

        if (!si || revenue === null || revenue === undefined || revenue === 0) {
          const errMsg = "Los datos financieros no llegaron al motor de cálculo. Verifica que los documentos contienen ingresos identificables.";
          await updateJob("calculo", 0, errMsg, "error");
          await supabase.from("analyses").update({ status: "error_tecnico" }).eq("id", analysis_id);
          await releaseLock(supabase, analysis_id);
          return new Response(JSON.stringify({ success: false, error: { code: "EMPTY_INPUT", message: errMsg }, data: { steps } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        await supabase.from("analyses").update({ status: "calculo_en_curso", input_payload: buildResult.data }).eq("id", analysis_id);
      } else {
        const errMsg = buildResult.error?.message || "Error construyendo input estructurado";
        await updateJob("calculo", 0, errMsg, "error");
        await supabase.from("analyses").update({ status: "error_tecnico" }).eq("id", analysis_id);
        await releaseLock(supabase, analysis_id);
        return new Response(JSON.stringify({ success: false, error: { code: "BUILD_FAILED", message: errMsg }, data: { steps } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await updateJob("calculo", 70, "Input listo. Ejecutando motor de valoración...", "completado");
    } catch (e) {
      const isTimeout = e instanceof DOMException && e.name === "AbortError";
      const errMsg = isTimeout ? "El cálculo tardó más de 55 segundos. Intenta con un documento más pequeño." : (e instanceof Error ? e.message : "Error construyendo input");
      steps.push({ step: "build-structured-input", success: false, detail: errMsg });
      await updateJob("calculo", 0, errMsg, "error");
      await supabase.from("analyses").update({ status: "error_tecnico" }).eq("id", analysis_id);
      await releaseLock(supabase, analysis_id);
      return new Response(JSON.stringify({ success: false, error: { code: "CALC_ERROR", message: errMsg }, data: { steps } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 5: Run calculation engine
    await updateJob("motor_calculo", 75, "Ejecutando motor de valoración DCF...");
    try {
      const calcResp = await fetch(`${supabaseUrl}/functions/v1/ejecutar-calculo`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id }),
      });
      const calcResult = await calcResp.json();
      steps.push({ step: "ejecutar-calculo", success: calcResult.success, detail: calcResult.success ? `EV: ${calcResult.data?.enterprise_value?.toFixed(0)}` : calcResult.error?.message });

      if (!calcResult.success) {
        await updateJob("motor_calculo", 0, calcResult.error?.message || "Error en motor de cálculo", "error");
        await supabase.from("analyses").update({ status: "error_tecnico" }).eq("id", analysis_id);
        await releaseLock(supabase, analysis_id);
        return new Response(JSON.stringify({ success: false, error: calcResult.error, data: { steps } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await updateJob("motor_calculo", 100, "Valoración DCF completada.", "completado");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Error en motor de cálculo";
      steps.push({ step: "ejecutar-calculo", success: false, detail: errMsg });
      await updateJob("motor_calculo", 0, errMsg, "error");
      await supabase.from("analyses").update({ status: "error_tecnico" }).eq("id", analysis_id);
      await releaseLock(supabase, analysis_id);
      return new Response(JSON.stringify({ success: false, error: { code: "CALC_ENGINE_ERROR", message: errMsg }, data: { steps } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update final status
    await supabase.from("analyses").update({ status: "informe_generado" }).eq("id", analysis_id);
    await releaseLock(supabase, analysis_id);

    // Audit
    await supabase.from("audit_events").insert({
      analysis_id,
      event_type: "pipeline_complete",
      event_detail: `Pipeline completado: ${steps.length} pasos ejecutados`,
      component: "run-analysis-pipeline",
      user_id: user.id,
      metadata: { steps },
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        steps,
        status: "informe_generado",
        message: "Pipeline completo. El análisis financiero está listo.",
      },
      meta: { analysis_id, timestamp: new Date().toISOString() },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("pipeline error:", error);
    // Notify user about technical error
    const { analysis_id: aid } = await req.clone().json().catch(() => ({ analysis_id: null }));
    if (aid) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      fetch(`${supabaseUrl}/functions/v1/enviar-notificacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": req.headers.get("Authorization") || "" },
        body: JSON.stringify({ tipo: "error_analisis", analysis_id: aid, datos_extra: { mensaje_error: error instanceof Error ? error.message : "Error técnico inesperado." } }),
      }).catch(e => console.error("Notification error:", e));
    }
    return new Response(JSON.stringify({ success: false, error: { code: "PIPELINE_ERROR", message: error instanceof Error ? error.message : "Error en el pipeline de análisis." } }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function releaseLock(supabase: any, analysisId: string) {
  await supabase.from("job_locks").delete().eq("job_key", `pipeline_${analysisId}`);
}
