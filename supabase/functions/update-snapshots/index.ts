import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════
// Damodaran 2026 dataset — hardcoded, updated annually in January
// Source: pages.stern.nyu.edu/~adamodar/
// ═══════════════════════════════════════════════════════════════

const DAMODARAN_2026 = {
  vigencia: { desde: "2026-01-01", hasta: "2026-12-31", version: "damodaran_2026_jan" },
  sectores: {
    "software-tecnologia":          { label: "Software / Tecnología",          beta_unlevered: 1.22, ebitda_margin: 26.0, ev_ebitda: 13.0, ev_revenue: 4.8, wacc_ref: 11.2 },
    "retail-comercio":              { label: "Retail / Comercio",              beta_unlevered: 1.08, ebitda_margin: 18.5, ev_ebitda: 9.5,  ev_revenue: 2.2, wacc_ref: 10.2 },
    "servicios-empresariales":      { label: "Servicios empresariales",        beta_unlevered: 0.98, ebitda_margin: 20.5, ev_ebitda: 10.5, ev_revenue: 2.6, wacc_ref: 9.6  },
    "manufactura":                  { label: "Manufactura",                    beta_unlevered: 1.18, ebitda_margin: 16.5, ev_ebitda: 8.5,  ev_revenue: 1.9, wacc_ref: 10.6 },
    "consumo-consumer":             { label: "Consumo / Consumer Products",    beta_unlevered: 0.93, ebitda_margin: 22.5, ev_ebitda: 11.5, ev_revenue: 3.1, wacc_ref: 9.1  },
    "alimentos-bebidas":            { label: "Alimentos y bebidas",            beta_unlevered: 0.78, ebitda_margin: 18.5, ev_ebitda: 10.5, ev_revenue: 2.3, wacc_ref: 9.1  },
    "agroindustria":                { label: "Agroindustria",                  beta_unlevered: 0.83, ebitda_margin: 15.5, ev_ebitda: 8.5,  ev_revenue: 1.6, wacc_ref: 9.6  },
    "salud":                        { label: "Salud",                          beta_unlevered: 0.88, ebitda_margin: 20.5, ev_ebitda: 11.5, ev_revenue: 2.9, wacc_ref: 9.6  },
    "educacion":                    { label: "Educación",                      beta_unlevered: 0.73, ebitda_margin: 18.5, ev_ebitda: 9.5,  ev_revenue: 2.1, wacc_ref: 8.6  },
    "transporte-logistica":         { label: "Transporte y logística",         beta_unlevered: 1.03, ebitda_margin: 14.5, ev_ebitda: 8.5,  ev_revenue: 1.7, wacc_ref: 10.1 },
    "construccion-infraestructura": { label: "Construcción e infraestructura", beta_unlevered: 1.13, ebitda_margin: 13.5, ev_ebitda: 7.5,  ev_revenue: 1.5, wacc_ref: 10.6 },
    "energia-utilities":            { label: "Energía y utilities",            beta_unlevered: 0.52, ebitda_margin: 36.0, ev_ebitda: 9.5,  ev_revenue: 3.1, wacc_ref: 8.1  },
    "turismo-hospitalidad":         { label: "Turismo y hospitalidad",         beta_unlevered: 1.28, ebitda_margin: 16.5, ev_ebitda: 9.5,  ev_revenue: 2.1, wacc_ref: 11.1 },
    "inmobiliario":                 { label: "Inmobiliario",                   beta_unlevered: 0.68, ebitda_margin: 41.0, ev_ebitda: 13.5, ev_revenue: 5.2, wacc_ref: 8.6  },
    "financiero-seguros":           { label: "Financiero / Seguros",           beta_unlevered: 0.83, ebitda_margin: 31.0, ev_ebitda: 10.5, ev_revenue: 3.6, wacc_ref: 9.1  },
  } as Record<string, any>,
  macro_colombia: {
    policy_rate:    { value: 7.50,  source: "Banco de la República", date: "2026-03" },
    inflation_ipc:  { value: 3.88,  source: "DANE",                  date: "2026-02" },
    trm_avg:        { value: 4080,  source: "Banco de la República", date: "2026-02" },
    gdp_growth:     { value: 2.8,   source: "DANE",                  date: "2025-Q4" },
  },
  risk_market: {
    risk_free_rate:       { value: 4.35, source: "US Treasury 10Y",  date: "2026-03" },
    country_risk_premium: { value: 2.20, source: "EMBI Colombia",    date: "2026-03" },
    erp_emergentes:       { value: 5.80, source: "Damodaran ERP Emerging Markets", date: "2026-01" },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Allow optional macro override from body
    const body = await req.json().catch(() => ({}));
    const macroOverride = body.macro || null;

    const hoy = new Date().toISOString().split("T")[0];

    const { data: jobLog } = await supabase
      .from("update_jobs_log")
      .insert({
        job_nombre: "update-snapshots",
        estado: "ejecutando",
        parametros: { fecha: hoy, version: DAMODARAN_2026.vigencia.version },
      })
      .select()
      .single();

    const snapshotsCreados: string[] = [];

    for (const [sectorKey, sectorData] of Object.entries(DAMODARAN_2026.sectores)) {
      const { data: existing } = await supabase
        .from("external_snapshots")
        .select("id")
        .eq("sector", sectorKey)
        .eq("source_version", DAMODARAN_2026.vigencia.version)
        .maybeSingle();

      if (existing) continue;

      const dateRef = DAMODARAN_2026.vigencia.desde.substring(0, 7);
      const fuente = `Damodaran ${sectorData.label} Jan 2026`;

      const macroData = macroOverride || DAMODARAN_2026.macro_colombia;
      const riskData = DAMODARAN_2026.risk_market;

      const dataPayload = {
        sector_data: {
          beta_unlevered:    { value: sectorData.beta_unlevered,  source: fuente, date: dateRef },
          ev_ebitda_ref:     { value: sectorData.ev_ebitda,       source: fuente, date: dateRef },
          ev_revenue_ref:    { value: sectorData.ev_revenue,      source: fuente, date: dateRef },
          ebitda_margin_ref: { value: sectorData.ebitda_margin,   source: fuente, date: dateRef },
          wacc_ref:          { value: sectorData.wacc_ref,        source: fuente, date: dateRef },
          erp:               { value: riskData.erp_emergentes.value, source: riskData.erp_emergentes.source, date: dateRef },
        },
      };

      const macroPayload = {
        macro_colombia: macroData,
        risk_market: riskData,
      };

      await supabase.from("external_snapshots").insert({
        effective_date: hoy,
        sector: sectorKey,
        source_version: DAMODARAN_2026.vigencia.version,
        data_payload: dataPayload,
        macro_payload: macroPayload,
      });

      snapshotsCreados.push(sectorKey);
    }

    // If macro override provided, update all existing snapshots for current year
    if (macroOverride) {
      const { data: vigentes } = await supabase
        .from("external_snapshots")
        .select("id, macro_payload")
        .gte("effective_date", `${new Date().getFullYear()}-01-01`);

      for (const snap of (vigentes || [])) {
        const updated = {
          macro_colombia: {
            policy_rate:   macroOverride.policy_rate   || DAMODARAN_2026.macro_colombia.policy_rate,
            inflation_ipc: macroOverride.inflation_ipc || DAMODARAN_2026.macro_colombia.inflation_ipc,
            trm_avg:       macroOverride.trm_avg       || DAMODARAN_2026.macro_colombia.trm_avg,
            gdp_growth:    macroOverride.gdp_growth    || DAMODARAN_2026.macro_colombia.gdp_growth,
          },
          risk_market: DAMODARAN_2026.risk_market,
        };
        await supabase.from("external_snapshots")
          .update({ macro_payload: updated }).eq("id", snap.id);
      }
    }

    if (jobLog) {
      await supabase
        .from("update_jobs_log")
        .update({
          estado: "completado",
          resultado: { snapshots_creados: snapshotsCreados.length, sectores: snapshotsCreados },
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobLog.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { snapshots_creados: snapshotsCreados.length, sectores: snapshotsCreados },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("update-snapshots error:", error);
    return new Response(
      JSON.stringify({ success: false, error: { message: error instanceof Error ? error.message : "Error" } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
