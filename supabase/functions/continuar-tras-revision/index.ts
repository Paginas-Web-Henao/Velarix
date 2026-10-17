import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveBasePeriod } from "../_shared/period-resolution.ts";
import { applyActiveRunFilter, selectActiveRows } from "../_shared/evidence-runs.ts";
import { loadActiveJudgment } from "../_shared/judgment-loader.ts";
import { resolveActiveEvidenceDocumentMetadata } from "../_shared/evidence-document-metadata.ts";
import { LEGACY_EXCHANGE_RATE_COP_PER_USD, resolveStructuredInputCurrency } from "../_shared/structured-input-currency.ts";
import {
  buildCanonicalStructuredInput,
  resolveStructuredInputSnapshot,
  CANONICAL_STRUCTURED_INPUT_VERSION,
} from "../_shared/structured-input-builder.ts";
import { canContinueAfterReview, isInternalServiceCall, type ActorRole, type AuthenticatedActor } from "../_shared/authorization.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { requireAuthenticatedUser, mapErrorToResponse, type MinimalUser } from "../_shared/user-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// TRM from macro data (single source of truth) — mismo valor real que
// build-structured-input/index.ts (ver _shared/structured-input-builder.ts).
const TRM = LEGACY_EXCHANGE_RATE_COP_PER_USD; // LEGACY_COMPATIBILITY_DEFAULT (solo snapshot por defecto y casos legacy)


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const secretKey = resolveAdminSecretKey();
  const anonKey = resolvePublishableKey();
  const supabase = createClient(supabaseUrl, secretKey);

  // ── Autenticación ANTES de cualquier acceso a la base ──
  // Invocación interna real (secret key en `apikey`) o JWT de usuario
  // verificado con Supabase Auth. Sin credenciales válidas → 401 sin
  // ninguna lectura/escritura (ni audit, ni lookup del análisis).
  const authHeader = req.headers.get("Authorization");
  const apiKeyHeader = req.headers.get("apikey");
  const isInternalCall = isInternalServiceCall(apiKeyHeader, secretKey);
  let authUser: MinimalUser | null = null;
  if (!isInternalCall) {
    try {
      const anonClient = createClient(supabaseUrl, anonKey);
      authUser = await requireAuthenticatedUser(authHeader, async (token) => {
        const { data, error } = await anonClient.auth.getUser(token);
        return { user: data.user, error };
      });
    } catch (error) {
      const mapped = mapErrorToResponse(error, { code: "UNAUTHORIZED", message: "Autenticación requerida." });
      return new Response(JSON.stringify(mapped.body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  try {
    // Corrección de autenticación mixta (Bloque 1D, 2026-07-30):
    // `verify_jwt = false` en esta función (ver supabase/config.toml) —
    // la puerta de entrada de Supabase no reconoce el formato de la
    // secret key nueva, así que la función valida ella misma ambos
    // modos. Una llamada interna real envía la secret key en `apikey`
    // (nunca en `Authorization`, porque no es un JWT); una llamada de
    // usuario envía la publishable key en `apikey` y el JWT real en
    // `Authorization`.
    const { analysis_id } = await req.json();
    if (!analysis_id) {
      return new Response(
        JSON.stringify({ success: false, error: { message: "analysis_id requerido" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // BL-08/BL-09: función privilegiada. Ownership por sí solo NUNCA es
    // suficiente aquí -- a diferencia de ejecutar-calculo, el cliente
    // propietario del análisis no puede aprobar/continuar su propia
    // revisión. Se requiere analista, admin, o invocación interna real
    // (comparación contra la secret key real vía `apikey`, nunca un
    // campo público como {internal:true}).
    let actor: AuthenticatedActor | null = null;
    if (authUser) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", authUser.id).single();
      actor = { userId: authUser.id, role: (profile?.role as ActorRole) || "user" };
    }

    // 1. Get analysis
    const { data: analysis, error: aErr } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", analysis_id)
      .single();

    // Ownership antes de leer nada más del caso: un actor no privilegiado sobre
    // un análisis ajeno recibe la misma respuesta que "no existe" (sin audit,
    // sin revelar existencia). analyst/admin e invocación interna siguen la
    // política existente de canContinueAfterReview.
    const privileged = isInternalCall || actor?.role === "analyst" || actor?.role === "admin";
    if (aErr || !analysis || (!privileged && analysis.user_id !== actor?.userId)) {
      return new Response(
        JSON.stringify({ success: false, error: { message: "Análisis no encontrado" } }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1b. Estado de la revisión manual más reciente + control de
    // idempotencia (no se permite continuar dos veces la misma
    // aprobación): si el análisis ya no está en
    // "revision_manual_requerida", la continuación ya ocurrió antes.
    const { data: review } = await supabase
      .from("manual_reviews")
      .select("*")
      .eq("analysis_id", analysis_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const reviewState = (review as { estado?: string } | null)?.estado ?? null;
    const alreadyContinued = analysis.status !== "revision_manual_requerida";

    const decision = canContinueAfterReview({
      actor,
      isInternalCall,
      analysisOwnerId: analysis.user_id,
      reviewState,
      alreadyContinued,
    });

    if (!decision.allowed) {
      await supabase.from("audit_events").insert({
        analysis_id,
        user_id: actor?.userId || null,
        event_type: decision.reasonCode === "owner_self_approval_blocked"
          ? "acceso_rechazado_autoaprobacion"
          : "acceso_rechazado_continuar_revision",
        event_detail: `Motivo: ${decision.reasonCode}`,
        component: "continuar-tras-revision",
      });
      return new Response(
        JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: decision.publicMessage } }),
        { status: decision.httpStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get corrected homologations
    // Solo el set operacional ACTIVO (puntero del análisis; legacy si es null).
    const activeRunId = (analysis as { active_evidence_run_id?: string | null }).active_evidence_run_id ?? null;
    const { data: cuentasTodosRuns } = await applyActiveRunFilter(
      supabase.from("account_homologations").select("*").eq("analysis_id", analysis_id),
      activeRunId,
    );
    const cuentas = selectActiveRows(cuentasTodosRuns || [], activeRunId);

    if (!cuentas || cuentas.length === 0) {
      await supabase.from("analyses").update({ status: "validacion_bloqueada" }).eq("id", analysis_id);
      return new Response(
        JSON.stringify({ success: false, error: { message: "No hay cuentas homologadas" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check critical accounts exist
    const criticalAccounts = ["revenue", "cash", "equity", "total_assets", "total_liabilities"];
    const mappedCanonicals = cuentas.map((c: any) => c.canonical_account);
    const missingCritical = criticalAccounts.filter((ca) => !mappedCanonicals.includes(ca));

    if (missingCritical.length > 0) {
      await supabase.from("analyses").update({ status: "validacion_bloqueada" }).eq("id", analysis_id);
      await supabase.from("audit_events").insert({
        analysis_id,
        event_type: "validacion_post_revision_fallida",
        event_detail: `Cuentas críticas faltantes: ${missingCritical.join(", ")}`,
        component: "continuar-tras-revision",
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: `Cuentas críticas faltantes tras revisión: ${missingCritical.join(", ")}` },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3b. Bug 2 — política provisional de base_period: mismo resolver puro
    // que usan validate-analysis y build-structured-input, no una política
    // distinta. Si es ambiguo, no se continúa automáticamente.
    const periodResolution = resolveBasePeriod(cuentas.map((c: any) => c.period ?? null));
    if (!periodResolution.ok) {
      await supabase.from("analyses").update({ status: "validacion_bloqueada" }).eq("id", analysis_id);
      await supabase.from("audit_events").insert({
        analysis_id,
        user_id: actor?.userId || null,
        event_type: "periodo_base_ambiguo",
        event_detail: periodResolution.reason ?? "Período base ambiguo — requiere revisión humana.",
        component: "continuar-tras-revision",
        metadata: { available_periods: periodResolution.availablePeriods, selection_mode: periodResolution.selectionMode },
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "PERIOD_AMBIGUOUS",
            message: "Período base ambiguo — requiere revisión humana antes de continuar.",
            detail: periodResolution.reason,
            available_periods: periodResolution.availablePeriods,
          },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const basePeriod = periodResolution.basePeriod;
    const periods = periodResolution.availablePeriods;

    // ── Currency conversion (BL-03) — misma resolución que build-structured-input ──
    // Metadata documental ligada al evidence run activo (mismo resolver que build-structured-input).
    const docMeta = await resolveActiveEvidenceDocumentMetadata(supabase, analysis);
    if (!docMeta.ok) {
      await supabase.from("audit_events").insert({
        analysis_id, event_type: "structured_input_metadata_blocked", event_detail: `${docMeta.code}: ${docMeta.message}`,
        component: "continuar-tras-revision", user_id: actor?.userId ?? null, metadata: { code: docMeta.code, active_evidence_run_id: analysis.active_evidence_run_id ?? null },
      });
      return new Response(JSON.stringify({ success: false, error: { code: docMeta.code, message: docMeta.message } }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Moneda/escala/FX: en casos versionados nada implícito (ni COP, ni factor 1,
    // ni TRM fija); legacy conserva LEGACY_COMPATIBILITY_DEFAULT. Ver _shared/structured-input-currency.ts.
    const currency = resolveStructuredInputCurrency({ monedaAnalisisRaw: analysis.moneda_analisis, docMeta });
    if (!currency.ok) {
      await supabase.from("audit_events").insert({
        analysis_id, event_type: "structured_input_metadata_blocked", event_detail: `${currency.code}: ${currency.message}`,
        component: "continuar-tras-revision", user_id: actor?.userId ?? null, metadata: { code: currency.code, active_evidence_run_id: analysis.active_evidence_run_id ?? null },
      });
      return new Response(JSON.stringify({ success: false, error: { code: currency.code, message: currency.message } }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const monedaAnalisis = currency.monedaAnalisis;
    const monedaDoc = currency.monedaDocumento;
    const factorEscala = currency.factorEscala;

    // Get snapshot — mismo fallback Damodaran que build-structured-input
    // cuando no hay fila en external_snapshots para el sector (antes de
    // este fix, continuar-tras-revision no tenía fallback y omitía
    // snapshot_data/macro_data por completo).
    const { data: dbSnapshot } = await supabase
      .from("external_snapshots")
      .select("*")
      .eq("sector", analysis.sector)
      .order("effective_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Versionado sin fila real → snapshot ausente (null), nunca el default con
    // fuentes/fechas fijas; legacy conserva el default (LEGACY_COMPATIBILITY_DEFAULT).
    const snapshot = resolveStructuredInputSnapshot({
      versioned: currency.mode === "versioned",
      dbSnapshot,
      sector: analysis.sector,
      legacyExchangeRate: TRM,
    });
    const snapshotId = snapshot.id;

    const builtAt = new Date().toISOString();

    // Mismo criterio que build-structured-input: reutiliza el id de fila
    // existente en `structured_inputs` para este `analysis_id` (columna
    // UNIQUE) si ya existe, o genera uno nuevo para provenance.
    const { data: existingRow } = await supabase
      .from("structured_inputs").select("id").eq("analysis_id", analysis_id).maybeSingle();
    const structuredInputId: string = existingRow?.id || crypto.randomUUID();

    // 4. Build structured input from corrected homologations — único
    // constructor del contrato canónico v2.3, compartido con
    // build-structured-input (ver _shared/structured-input-builder.ts).
    // Ya no se reconstruye el payload aquí (ver
    // structured-input-canonical-contract.regression.test.ts).
    // Judgment versionado (ADR-010): mismo criterio que build-structured-input.
    const activeJudgment = await loadActiveJudgment(supabase, analysis);
    if (activeJudgment.mode === "judgment_set" && !activeJudgment.resolution.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: "JUDGMENT_SET_INVALID", message: "El judgment set activo no se puede materializar; no se construye el input.", issues: activeJudgment.resolution.issues },
      }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const judgment = activeJudgment.mode === "judgment_set" && activeJudgment.resolution.ok ? activeJudgment.resolution.judgment : null;

    const structuredInput = buildCanonicalStructuredInput({
      analysisId: analysis_id,
      sector: analysis.sector,
      // Judgment: null = no resuelto (el preflight de cálculo lo bloquea); nunca 25 por defecto.
      expectedGrowth: analysis.expected_growth ?? null,
      accounts: cuentas,
      basePeriod,
      periods,
      periodSelectionMode: periodResolution.selectionMode,
      monedaAnalisis,
      monedaDocumento: monedaDoc,
      scaleFactor: factorEscala,
      exchangeRate: currency.exchangeRate,
      snapshot: {
        id: snapshotId,
        data_payload: snapshot.data_payload,
        macro_payload: snapshot.macro_payload,
      },
      structuredInputId,
      createdAt: builtAt,
      judgment,
    });

    // 5. Upsert structured input
    await supabase.from("structured_inputs").upsert(
      {
        id: structuredInputId,
        analysis_id,
        input_payload: structuredInput,
        version_input: CANONICAL_STRUCTURED_INPUT_VERSION,
      },
      { onConflict: "analysis_id" }
    );

    // 6. Update analysis status
    await supabase
      .from("analyses")
      .update({
        status: "validacion_aprobada",
        validation_status: "verde",
        input_payload: structuredInput,
        snapshot_id: snapshotId,
      })
      .eq("id", analysis_id);

    // 7. Audit
    await supabase.from("audit_events").insert({
      analysis_id,
      user_id: actor?.userId || null,
      event_type: "flujo_reanudado_tras_revision",
      event_detail: `Validación aprobada post-revisión manual. Flujo continúa. Autorizado por: ${decision.reasonCode}.`,
      component: "continuar-tras-revision",
    });

    return new Response(
      JSON.stringify({ success: true, data: { status: "validacion_aprobada" } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en continuar-tras-revision:", error);
    return new Response(
      JSON.stringify({ success: false, error: { message: (error as { message?: string }).message } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
