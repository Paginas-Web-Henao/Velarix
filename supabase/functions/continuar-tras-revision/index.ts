import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveBasePeriod } from "../_shared/period-resolution.ts";
import { normalizeCurrencyCode } from "../_shared/currency.ts";
import {
  buildCanonicalStructuredInput,
  buildDefaultSnapshot,
  CANONICAL_STRUCTURED_INPUT_VERSION,
} from "../_shared/structured-input-builder.ts";
import { canContinueAfterReview, isInternalServiceCall, type ActorRole, type AuthenticatedActor } from "../_shared/authorization.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// TRM from macro data (single source of truth) — mismo valor real que
// build-structured-input/index.ts (ver _shared/structured-input-builder.ts).
const TRM = 4080;

/** Subconjunto mínimo de `analyses` que necesita la resolución de moneda (BL-03). */
interface AnalysisCurrencyFields {
  moneda_analisis?: string | null;
}

/** Metadata de `audit_events` (event_type "parse_complete") que necesita la resolución de moneda del documento fuente. */
interface ParseMetadata {
  moneda_documento?: string | null;
  factor_escala?: number | string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // 1. Get analysis
    const { data: analysis, error: aErr } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", analysis_id)
      .single();

    if (aErr || !analysis) {
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
    const { data: cuentas } = await supabase
      .from("account_homologations")
      .select("*")
      .eq("analysis_id", analysis_id);

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
    const monedaAnalisis = normalizeCurrencyCode((analysis as AnalysisCurrencyFields).moneda_analisis) ?? "COP";
    const { data: auditParse } = await supabase.from("audit_events")
      .select("metadata").eq("analysis_id", analysis_id).eq("event_type", "parse_complete")
      .order("created_at", { ascending: false }).limit(1);
    const parseMeta = (auditParse?.[0]?.metadata as ParseMetadata | null) || {};
    const monedaDoc = normalizeCurrencyCode(parseMeta.moneda_documento);
    const factorEscala = Number(parseMeta.factor_escala) || 1;

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

    const snapshot = dbSnapshot || buildDefaultSnapshot(analysis.sector, TRM);
    const snapshotId = dbSnapshot?.id || null;

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
    const structuredInput = buildCanonicalStructuredInput({
      analysisId: analysis_id,
      sector: analysis.sector,
      expectedGrowth: analysis.expected_growth || 25,
      accounts: cuentas,
      basePeriod,
      periods,
      periodSelectionMode: periodResolution.selectionMode,
      monedaAnalisis,
      monedaDocumento: monedaDoc,
      scaleFactor: factorEscala,
      exchangeRate: TRM,
      snapshot: {
        id: snapshotId,
        data_payload: snapshot.data_payload || snapshot,
        macro_payload: snapshot.macro_payload || null,
      },
      structuredInputId,
      createdAt: builtAt,
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
      JSON.stringify({ success: false, error: { message: error.message } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
