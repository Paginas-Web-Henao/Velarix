import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { HomologatedAccountRow } from "../_shared/financial-accounts.ts";
import { resolveBasePeriod } from "../_shared/period-resolution.ts";
import { deriveCoreFinancialFields } from "../_shared/structured-input-derivations.ts";
import { canContinueAfterReview, isInternalServiceCall, type ActorRole, type AuthenticatedActor } from "../_shared/authorization.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // 4. Build structured input from corrected homologations
    // Usa el MISMO derivador puro compartido que build-structured-input
    // (`deriveCoreFinancialFields`) — este archivo reconstruía antes estos
    // campos con su propia aritmética, coaccionando `null -> 0` vía `?? 0`
    // (da, current/long_term_financial_debt) y recalculando net_income con
    // una tasa de impuestos de 30% hardcoded sin aprobación metodológica.
    // Eso fabricaba valores para campos genuinamente ausentes, ocultando el
    // missing al Calculation Preflight (ver
    // continuar-tras-revision.regression.test.ts). AUSENTE != 0: un campo
    // sin fila en `cuentas` para el `base_period` resuelto queda `null`,
    // igual que en el camino canónico.
    const core = deriveCoreFinancialFields(cuentas as HomologatedAccountRow[], basePeriod);
    const {
      revenue, costOfSales, opex, da, interestExpense, taxes, netIncome,
      ebitda, ebit,
      cash, accountsReceivable, inventory, ppe,
      currentDebt, longTermDebt, financialDebtTotal,
      equity, totalAssets, totalLiabilities,
    } = core;

    // Get snapshot
    const { data: snapshot } = await supabase
      .from("external_snapshots")
      .select("*")
      .eq("sector", analysis.sector)
      .order("effective_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const structuredInput = {
      analysis_id,
      sector: analysis.sector,
      expected_growth: analysis.expected_growth || 25,
      periods: periodResolution.availablePeriods,
      base_period: basePeriod,
      income_statement: {
        revenue,
        cost_of_sales: costOfSales,
        opex,
        da,
        ebitda,
        ebit,
        interest_expense: interestExpense,
        taxes,
        net_income: netIncome,
      },
      balance_sheet: {
        cash,
        accounts_receivable: accountsReceivable,
        inventory,
        ppe,
        current_financial_debt: currentDebt,
        long_term_financial_debt: longTermDebt,
        financial_debt_total: financialDebtTotal,
        equity,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
      },
      quality_flags: ["revisado_manualmente"],
      validation_notes: ["Cuentas corregidas por revisión manual"],
      snapshot_id: snapshot?.id || null,
      version_input: "1.1",
    };

    // 5. Upsert structured input
    await supabase.from("structured_inputs").upsert(
      {
        analysis_id,
        input_payload: structuredInput,
        version_input: "1.1",
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
        snapshot_id: snapshot?.id || null,
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
