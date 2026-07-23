import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sumAccountValue, type HomologatedAccountRow } from "../_shared/financial-accounts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { analysis_id } = await req.json();
    if (!analysis_id) {
      return new Response(
        JSON.stringify({ success: false, error: { message: "analysis_id requerido" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // 4. Build structured input from corrected homologations
    // BL-02: antes tomaba la primera fila con `.find()` sin siquiera
    // filtrar `value != null`, y devolvía 0 en vez de distinguir ausencia
    // real. Ahora usa el módulo puro compartido (suma todas las
    // subcuentas del mismo `canonical_account`).
    const getValue = (canonical: string): number | null =>
      sumAccountValue(cuentas as HomologatedAccountRow[], canonical);

    // Campos usados en aritmética directa en este archivo: se coacciona
    // explícitamente `null -> 0` aquí, no dentro del helper compartido
    // (que preserva `null` como "sin dato" para el resto de consumidores).
    const revenue = getValue("revenue") ?? 0;
    const costOfSales = getValue("cost_of_sales") ?? 0;
    const opex = getValue("opex") ?? 0;
    const da = getValue("da") ?? 0;
    const interestExpense = getValue("interest_expense") ?? 0;
    const taxes = getValue("taxes");
    const cash = getValue("cash");
    const equity = getValue("equity");
    const totalAssets = getValue("total_assets");
    const totalLiabilities = getValue("total_liabilities");
    const currentDebt = getValue("current_financial_debt") ?? 0;
    const longTermDebt = getValue("long_term_financial_debt") ?? 0;
    const financialDebtTotal = (currentDebt + longTermDebt) || (getValue("financial_debt_total") ?? 0);

    const ebitda = revenue - costOfSales - opex + da;
    const ebit = ebitda - da;
    const netIncome = getValue("net_income") ?? (ebit - interestExpense) * (1 - 0.3);

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
      periods: ["2024"],
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
        accounts_receivable: getValue("accounts_receivable"),
        inventory: getValue("inventory"),
        ppe: getValue("ppe"),
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
      event_type: "flujo_reanudado_tras_revision",
      event_detail: "Validación aprobada post-revisión manual. Flujo continúa.",
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
