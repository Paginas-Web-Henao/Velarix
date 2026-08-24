import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { canExecuteCalculation, isInternalServiceCall, type ActorRole, type AuthenticatedActor } from "../_shared/authorization.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { runCanonicalFinancialEngine, type CanonicalStructuredInput } from "../_shared/canonical-financial-engine.ts";
import { computeInputFingerprint } from "../_shared/calculation-fingerprint.ts";
import { buildCalculationVersionInfo } from "../_shared/calculation-versioning.ts";
import { buildMissingProvenance, type CalculationProvenance } from "../_shared/calculation-provenance.ts";
import { resolveEffectiveMoneda, resolveEffectiveFactorConversion } from "../_shared/canonical-input-normalization.ts";
import { resolveStructuredInput } from "../_shared/structured-input-resolution.ts";
import { evaluateMinimumExpedienteCheckpoint } from "../_shared/minimum-expediente-checkpoint.ts";
import { evaluateCalculationPreflight } from "../_shared/calculation-preflight.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════
// EDGE FUNCTION HANDLER
// ═══════════════════════════════════════════════════════════════
//
// El motor financiero (antes definido inline en este archivo) fue
// extraído a `_shared/canonical-financial-engine.ts` (cierre técnico de
// Bloque 1B-M/1C-Prep, 2026-07-23) — sin imports de URL/Supabase/Deno,
// importable desde Vitest. No queda ninguna segunda copia del motor
// aquí; este archivo solo orquesta autenticación, autorización, lectura/
// escritura en Supabase y la invocación de `runCanonicalFinancialEngine`.

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const secretKey = resolveAdminSecretKey();
  const anonKey = resolvePublishableKey();
  const supabase = createClient(supabaseUrl, secretKey);

  try {
    const authHeader = req.headers.get("Authorization");
    // Corrección de autenticación mixta (Bloque 1D, 2026-07-30):
    // `verify_jwt = false` en esta función (ver supabase/config.toml) —
    // la puerta de entrada de Supabase no reconoce el formato de la
    // secret key nueva, así que la función valida ella misma ambos
    // modos. Una llamada interna real envía la secret key en `apikey`
    // (nunca en `Authorization`, porque no es un JWT); una llamada de
    // usuario envía la publishable key en `apikey` y el JWT real en
    // `Authorization`.
    const apiKeyHeader = req.headers.get("apikey");
    const { analysis_id } = await req.json();
    if (!analysis_id) throw new Error("analysis_id required");

    console.log(`[ejecutar-calculo] Starting for ${analysis_id}`);

    // BL-07: identidad real resuelta server-side. Nunca se confía en un
    // user_id enviado por el frontend — se deriva del JWT verificado
    // (auth.getUser) o de una invocación interna real (comparación
    // contra la secret key real vía `apikey`, no un campo público como
    // {internal:true}).
    const isInternalCall = isInternalServiceCall(apiKeyHeader, secretKey);
    let actor: AuthenticatedActor | null = null;
    if (!isInternalCall && authHeader) {
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        actor = { userId: user.id, role: (profile?.role as ActorRole) || "user" };
      }
    }

    // Get analysis with input_payload (siempre con service role, para
    // poder decidir la autorización sin revelar antes de tiempo si el
    // recurso existe).
    const { data: analysis, error: fetchErr } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", analysis_id)
      .single();
    const analysisOwnerId = (!fetchErr && analysis) ? analysis.user_id : null;

    const decision = canExecuteCalculation({ actor, isInternalCall, analysisOwnerId });
    if (!decision.allowed) {
      await supabase.from("audit_events").insert({
        analysis_id: analysisOwnerId ? analysis_id : null, // evita violar la FK si el análisis no existe
        user_id: actor?.userId || null,
        event_type: "acceso_rechazado_ejecutar_calculo",
        event_detail: `Motivo: ${decision.reasonCode}`,
        component: "ejecutar-calculo",
      });
      return new Response(JSON.stringify({
        success: false,
        error: { code: "UNAUTHORIZED", message: decision.publicMessage },
      }), { status: decision.httpStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!analysis) throw new Error("Analysis not found");

    // Hallazgo B: `structured_inputs.input_payload` es la fuente canónica
    // del input estructurado (ver `_shared/structured-input-resolution.ts`
    // para la evidencia completa). Antes, esta función solo leía
    // `analyses.input_payload`, una copia que `build-structured-input`
    // invocado directamente nunca sincronizaba (bug de integración, no del
    // motor).
    const { data: structuredInputRow } = await supabase
      .from("structured_inputs")
      .select("input_payload")
      .eq("analysis_id", analysis_id)
      .maybeSingle();

    const resolution = resolveStructuredInput({
      structuredInputPayload: structuredInputRow?.input_payload,
      analysisInputPayload: analysis.input_payload,
    });
    const input = resolution.payload as any;
    if (!input || !input.income_statement?.revenue) {
      throw new Error("No hay input_payload con revenue. Ejecuta build-structured-input primero.");
    }

    // Minimum Expediente Checkpoint (docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md
    // §0.1): gate obligatorio del flujo profesional normal, distinto del
    // Expediente completo (que sigue siendo paralelo/no bloqueante, §13/
    // §17/§18 sin cambios). Se aplica siempre, sin excepción — no hay
    // bypass por `isInternalServiceCall` ni por ningún otro flag; los
    // tests del motor puro (`canonical-financial-engine.golden-cases.test.ts`)
    // no pasan por aquí porque llaman al motor directamente, sin HTTP.
    // Política: ausencia legítima de fila (valuation_file inexistente,
    // 0 account_notes/expedient_questions/expedient_answers) es una
    // condición normal que resuelve en checkpoint FAIL / 409. Un error
    // real de la query (`.error` no nulo) es un fallo operacional — se
    // relanza y cae en el catch general de este handler (500), nunca se
    // disfraza de "falta revisión humana".
    const { data: valuationFile, error: valuationFileError } = await supabase
      .from("valuation_files")
      .select("id")
      .eq("analysis_id", analysis_id)
      .maybeSingle();
    if (valuationFileError) {
      throw new Error(`Error consultando valuation_files: ${valuationFileError.message}`);
    }

    let materialAccountsCount = 0;
    let ambiguitiesCount = 0;
    let treatedAmbiguitiesCount = 0;

    if (valuationFile) {
      const [materialRes, questionsRes, answeredRes] = await Promise.all([
        supabase.from("account_notes").select("id", { count: "exact", head: true }).eq("valuation_file_id", valuationFile.id),
        supabase.from("expedient_questions").select("id", { count: "exact", head: true }).eq("valuation_file_id", valuationFile.id),
        supabase.from("expedient_answers").select("question_id, expedient_questions!inner(valuation_file_id)").eq("expedient_questions.valuation_file_id", valuationFile.id),
      ]);
      if (materialRes.error) throw new Error(`Error consultando account_notes: ${materialRes.error.message}`);
      if (questionsRes.error) throw new Error(`Error consultando expedient_questions: ${questionsRes.error.message}`);
      if (answeredRes.error) throw new Error(`Error consultando expedient_answers: ${answeredRes.error.message}`);
      materialAccountsCount = materialRes.count ?? 0;
      ambiguitiesCount = questionsRes.count ?? 0;
      treatedAmbiguitiesCount = new Set((answeredRes.data ?? []).map((r: any) => r.question_id)).size;
    }

    const checkpoint = evaluateMinimumExpedienteCheckpoint({
      companyName: analysis.company_name,
      sector: analysis.sector,
      materialAccountsCount,
      ambiguitiesCount,
      treatedAmbiguitiesCount,
    });

    if (!checkpoint.passed) {
      await supabase.from("audit_events").insert({
        analysis_id,
        user_id: actor?.userId || null,
        event_type: "minimum_expediente_required",
        event_detail: `Checkpoint mínimo no satisfecho: faltan ${checkpoint.missing.join(", ")}`,
        component: "ejecutar-calculo",
        metadata: { checkpoint },
      });
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: "MINIMUM_EXPEDIENTE_REQUIRED",
          message: "Este análisis todavía no tiene evidencia mínima de revisión humana (contexto, cuenta material, ambigüedad y tratamiento) registrada antes de calcular.",
          checkpoint,
        },
      }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Calculation Preflight (fail-closed): corre DESPUÉS de Minimum
    // Expediente y ANTES de tocar analyses.status/analysis_jobs, y antes
    // de invocar el motor. A diferencia del checkpoint anterior (evidencia
    // de revisión humana), esto verifica que los campos materiales del
    // structured_input estén realmente observados (canonical-input-
    // normalization.ts y capital-structure.ts convierten cualquier
    // ausencia en 0 silenciosamente — ver auditoría) y que ningún supuesto
    // metodológico usado por el motor esté sin aprobación humana
    // (CANONICAL_METHODOLOGY, hoy con los 8 supuestos + el horizonte de
    // 5 años marcados/tratados como no aprobados). Ver
    // ../_shared/calculation-preflight.ts para el detalle completo.
    const preflight = evaluateCalculationPreflight({
      incomeStatement: input.income_statement,
      balanceSheet: input.balance_sheet,
    });
    if (!preflight.passed) {
      await supabase.from("audit_events").insert({
        analysis_id,
        user_id: actor?.userId || null,
        event_type: "calculation_preflight_failed",
        event_detail: `Preflight bloqueado: ${preflight.blockers.join(" | ")}`,
        component: "ejecutar-calculo",
        metadata: { preflight },
      });
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: "CALCULATION_PREFLIGHT_REQUIRED",
          message: "El cálculo está bloqueado: falta información material y/o hay supuestos metodológicos sin aprobación humana registrada.",
          preflight,
        },
      }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update status
    await supabase.from("analyses").update({ status: "calculo_en_curso" }).eq("id", analysis_id);
    await supabase.from("analysis_jobs").upsert({
      analysis_id,
      job_type: "motor_calculo",
      status: "en_progreso",
      progreso_pct: 70,
      progreso_mensaje: "Ejecutando motor de valoración DCF...",
      started_at: new Date().toISOString(),
    }, { onConflict: "analysis_id,job_type" });

    // Run engine
    const typedInput = input as CanonicalStructuredInput;
    const result = runCanonicalFinancialEngine(typedInput, analysis.sector, analysis.expected_growth);

    const elapsed = Date.now() - startTime;
    console.log(`[ejecutar-calculo] Completed in ${elapsed}ms. EV: ${result.valuation.enterpriseValue}`);

    // Bloque 1C-T: versionado + procedencia. Se agregan como campos
    // adicionales del resultado persistido, sin modificar ni un solo
    // campo de `result` (projections/scenarios/kpis/valuation/
    // sensitivityMatrix/sectorBenchmark/moneda/factor_conversion quedan
    // exactamente como los produce `runCanonicalFinancialEngine`).
    // `provenance` viaja dentro de `input_payload.provenance` cuando
    // `build-structured-input` la construyó; si no está (p. ej. un
    // análisis calculado antes de este bloque, o invocado sin pasar por
    // ese paso), se declara explícitamente "missing" — nunca se simula
    // trazabilidad que no existe.
    const inputFingerprint = computeInputFingerprint(typedInput, analysis.sector, analysis.expected_growth);
    const provenance: CalculationProvenance =
      (input as { provenance?: CalculationProvenance }).provenance ||
      buildMissingProvenance({
        analysisId: analysis_id,
        // Ajuste de semántica (2026-07-23): la moneda/factor del
        // fallback deben ser los REALES efectivamente usados por el
        // cálculo (mismas funciones que usa el motor), nunca un "COP"/1
        // asumido cuando el input indica otra cosa. La ausencia de
        // homologaciones/documentos (campos documentales "missing") es
        // independiente de la moneda en la que se calculó.
        monedaAnalisis: resolveEffectiveMoneda(typedInput.moneda_analisis),
        monedaDocumento: (input as { moneda_documento?: string | null }).moneda_documento ?? null,
        factorConversion: resolveEffectiveFactorConversion(typedInput.factor_conversion),
        builtAt: new Date().toISOString(),
      });
    const version = buildCalculationVersionInfo({
      inputFingerprint,
      provenanceStatus: provenance.overall_status,
      calculatedAt: new Date().toISOString(),
    });
    const enrichedResult = { ...result, version, provenance };

    // Store results
    await supabase.from("analyses").update({
      status: "calculo_completo",
      calculation_result: enrichedResult,
    }).eq("id", analysis_id);

    await supabase.from("analysis_jobs").upsert({
      analysis_id,
      job_type: "motor_calculo",
      status: "completado",
      progreso_pct: 100,
      progreso_mensaje: `Valoración completada en ${(elapsed / 1000).toFixed(1)}s`,
      completed_at: new Date().toISOString(),
    }, { onConflict: "analysis_id,job_type" });

    // Audit
    await supabase.from("audit_events").insert({
      analysis_id,
      event_type: "calculo_completado",
      event_detail: `EV: ${result.valuation.enterpriseValue.toFixed(0)}, WACC: ${result.valuation.wacc.toFixed(2)}%`,
      component: "ejecutar-calculo",
      metadata: { elapsed_ms: elapsed, ev: result.valuation.enterpriseValue, wacc: result.valuation.wacc },
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        enterprise_value: result.valuation.enterpriseValue,
        equity_value: result.valuation.equityValue,
        wacc: result.valuation.wacc,
        ev_ebitda: result.valuation.evEbitda,
        elapsed_ms: elapsed,
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[ejecutar-calculo] Error:", error);

    // Try to update status on failure
    try {
      const { analysis_id: aid } = await req.clone().json().catch(() => ({ analysis_id: null }));
      if (aid) {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, resolveAdminSecretKey());
        await supabase.from("analyses").update({ status: "error_tecnico" }).eq("id", aid);
        await supabase.from("analysis_jobs").upsert({
          analysis_id: aid,
          job_type: "motor_calculo",
          status: "error",
          progreso_pct: 0,
          progreso_mensaje: error instanceof Error ? error.message : "Error en motor de cálculo",
          error_mensaje: error instanceof Error ? error.message : "Error desconocido",
          completed_at: new Date().toISOString(),
        }, { onConflict: "analysis_id,job_type" });
      }
    } catch (_) { /* best effort */ }

    return new Response(JSON.stringify({
      success: false,
      error: { code: "CALC_ENGINE_ERROR", message: error instanceof Error ? error.message : "Error en motor de cálculo" },
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
