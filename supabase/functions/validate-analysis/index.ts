import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveBasePeriod } from "../_shared/period-resolution.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, mapErrorToResponse } from "../_shared/user-auth.ts";
import { evaluate } from "../_shared/validation-rules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { data: analysis, error: analysisError } = await supabase.from("analyses").select("*").eq("id", analysis_id).single();
    const lookup = classifyOwnedResourceLookup(analysisError, analysis, user.id);
    if (lookup === "not_found") throw new NotFoundError();
    if (lookup === "technical_error") throw analysisError;

    const { data: accounts } = await supabase.from("account_homologations").select("*").eq("analysis_id", analysis_id);
    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ success: false, error: { code: "NO_ACCOUNTS", message: "No hay cuentas homologadas." } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: documents } = await supabase.from("documents").select("*").eq("analysis_id", analysis_id);

    // Bug 2 — política provisional de base_period: se resuelve un único
    // período base ANTES de leer ninguna cifra financiera. Si es ambiguo,
    // la validación financiera no se ejecuta como si los datos fueran
    // correctos — se bloquea de forma explícita y trazable.
    const periodResolution = resolveBasePeriod(accounts.map((a: any) => a.period ?? null));
    if (!periodResolution.ok) {
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

    // Count issues — only DOC rules can block now
    let hasCritical = false;
    let warningCount = 0;
    for (const r of results) {
      if (!r.passed && r.blocking) hasCritical = true;
      if (!r.passed && (r.severity === "media" || r.severity === "critica")) warningCount++;
    }

    // Store results
    await supabase.from("validation_results").delete().eq("analysis_id", analysis_id);
    await supabase.from("validation_results").insert(
      results.map(r => ({
        analysis_id,
        rule_code: r.code,
        severity: r.severity,
        status: r.passed ? "passed" : "failed",
        detail: r.detail,
        blocking_flag: !r.passed && r.blocking,
      }))
    );

    // Semaphore — much more tolerant
    let semaphore: string, validationStatus: string, analysisStatus: string;
    if (hasCritical) {
      semaphore = "rojo"; validationStatus = "bloqueado"; analysisStatus = "validacion_bloqueada";
    } else if (warningCount >= 3) {
      semaphore = "amarillo"; validationStatus = "aprobado_con_advertencias"; analysisStatus = "validacion_con_advertencias";
    } else if (warningCount > 0) {
      semaphore = "amarillo"; validationStatus = "aprobado_con_advertencias"; analysisStatus = "validacion_con_advertencias";
    } else {
      semaphore = "verde"; validationStatus = "aprobado"; analysisStatus = "validacion_aprobada";
    }

    await supabase.from("analyses").update({ status: analysisStatus, validation_status: validationStatus }).eq("id", analysis_id);

    await supabase.from("audit_events").insert({
      analysis_id, event_type: "validation_complete",
      event_detail: `Validación: ${validationStatus} — semáforo: ${semaphore}`,
      component: "validate-analysis", user_id: user.id,
      metadata: { validation_status: validationStatus, semaphore, critical_failures: results.filter(r => !r.passed && r.blocking).length, warnings: warningCount },
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        validation_status: validationStatus,
        semaphore: { color: semaphore, label: semaphore === "rojo" ? "✗ Bloqueado" : semaphore === "amarillo" ? "⚠ Listo con advertencias" : "✓ Listo", can_proceed: !hasCritical, critical_count: results.filter(r => !r.passed && r.blocking).length, warning_count: warningCount },
        results: results.map(r => ({ rule_code: r.code, severity: r.severity, status: r.passed ? "passed" : "failed", detail: r.detail, blocking: !r.passed && r.blocking })),
        can_proceed: !hasCritical,
      },
      meta: { analysis_id, status: analysisStatus, timestamp: new Date().toISOString() },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("validate-analysis error:", error);
    const mapped = mapErrorToResponse(error, { code: "VALIDATION_ERROR", message: "Error en la validación." });
    return new Response(JSON.stringify(mapped.body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
