import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════
// INLINE FINANCIAL ENGINE — CFA-standard DCF + multiples
// No external imports to avoid Deno resolution issues
// ═══════════════════════════════════════════════════════════════

const SECTOR_BENCHMARKS: Record<string, { beta: number; ebitdaMargin: number; evEbitda: number; evRevenue: number; waccRef: number }> = {
  "Software / Tecnología":          { beta: 1.22, ebitdaMargin: 26,   evEbitda: 13,   evRevenue: 4.8, waccRef: 11.2 },
  "Retail / Comercio":              { beta: 1.08, ebitdaMargin: 18.5, evEbitda: 9.5,  evRevenue: 2.2, waccRef: 10.2 },
  "Servicios empresariales":        { beta: 0.98, ebitdaMargin: 20.5, evEbitda: 10.5, evRevenue: 2.6, waccRef: 9.6 },
  "Manufactura":                    { beta: 1.18, ebitdaMargin: 16.5, evEbitda: 8.5,  evRevenue: 1.9, waccRef: 10.6 },
  "Consumo":                        { beta: 0.93, ebitdaMargin: 22.5, evEbitda: 11.5, evRevenue: 3.1, waccRef: 9.1 },
  "Alimentos y bebidas":            { beta: 0.78, ebitdaMargin: 18.5, evEbitda: 10.5, evRevenue: 2.3, waccRef: 9.1 },
  "Agroindustria":                  { beta: 0.83, ebitdaMargin: 15.5, evEbitda: 8.5,  evRevenue: 1.6, waccRef: 9.6 },
  "Salud":                          { beta: 0.88, ebitdaMargin: 20.5, evEbitda: 11.5, evRevenue: 2.9, waccRef: 9.6 },
  "Educación":                      { beta: 0.73, ebitdaMargin: 18.5, evEbitda: 9.5,  evRevenue: 2.1, waccRef: 8.6 },
  "Transporte y logística":         { beta: 1.03, ebitdaMargin: 14.5, evEbitda: 8.5,  evRevenue: 1.7, waccRef: 10.1 },
  "Construcción e infraestructura": { beta: 1.13, ebitdaMargin: 13.5, evEbitda: 7.5,  evRevenue: 1.5, waccRef: 10.6 },
  "Energía y utilities":            { beta: 0.52, ebitdaMargin: 36,   evEbitda: 9.5,  evRevenue: 3.1, waccRef: 8.1 },
  "Turismo y hospitalidad":         { beta: 1.28, ebitdaMargin: 16.5, evEbitda: 9.5,  evRevenue: 2.1, waccRef: 11.1 },
  "Inmobiliario":                   { beta: 0.68, ebitdaMargin: 41,   evEbitda: 13.5, evRevenue: 5.2, waccRef: 8.6 },
  "Financiero / Seguros":           { beta: 0.83, ebitdaMargin: 31,   evEbitda: 10.5, evRevenue: 3.6, waccRef: 9.1 },
};

interface YearProjection {
  year: number;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  interest: number;
  ebt: number;
  taxes: number;
  netIncome: number;
  nopat: number;
  capex: number;
  deltaWC: number;
  fcff: number;
  discountedFcf: number;
}

function computeProjections(
  revenue0: number, costRatio: number, totalDebt: number, costOfDebt: number,
  taxRate: number, growth: number, ebitdaMargin: number, capexPct: number,
  wcPct: number, waccDecimal: number
): YearProjection[] {
  const projections: YearProjection[] = [];
  for (let t = 1; t <= 5; t++) {
    const revenue = revenue0 * Math.pow(1 + growth / 100, t);
    const costOfSales = revenue * costRatio;
    const grossProfit = revenue - costOfSales;
    const ebitda = revenue * (ebitdaMargin / 100);
    const depreciation = revenue * 0.03;
    const ebit = ebitda - depreciation;
    const interest = totalDebt * (costOfDebt / 100);
    const ebt = ebit - interest;
    const taxes = Math.max(ebt, 0) * (taxRate / 100);
    const netIncome = ebt - taxes;
    const nopat = ebit - ebit * (taxRate / 100);
    const capex = revenue * (capexPct / 100);
    const deltaWC = revenue * (wcPct / 100);
    const fcff = nopat + depreciation - capex - deltaWC;
    const discountedFcf = fcff / Math.pow(1 + waccDecimal, t);
    projections.push({ year: t, revenue, costOfSales, grossProfit, ebitda, depreciation, ebit, interest, ebt, taxes, netIncome, nopat, capex, deltaWC, fcff, discountedFcf });
  }
  return projections;
}

function runEngine(input: any, sector: string, expectedGrowth: number) {
  const bench = SECTOR_BENCHMARKS[sector] || SECTOR_BENCHMARKS["Software / Tecnología"];
  const is = input.income_statement || {};
  const bs = input.balance_sheet || {};

  const revenue = Math.abs(is.revenue || 0);
  const costOfSales = Math.abs(is.cost_of_sales || 0);
  const opex = Math.abs(is.opex || 0);
  const da = Math.abs(is.da || is.depreciation || 0);
  const interestExpense = Math.abs(is.interest_expense || 0);
  const taxes = Math.abs(is.taxes || 0);
  const netIncome = is.net_income || 0;

  const totalDebt = Math.abs(bs.total_debt || bs.financial_debt || 0);
  const cash = Math.abs(bs.cash || 0);
  const equity = Math.abs(bs.equity || bs.total_equity || 0);

  if (revenue === 0) throw new Error("Revenue es 0 — no se puede calcular valoración.");

  // Derived
  const ebitda0 = revenue - costOfSales - opex + da;
  const ebit0 = ebitda0 - da;
  const costRatio = costOfSales / revenue;
  const ebitdaMargin = (ebitda0 / revenue) * 100;
  const taxRate = 30; // Colombian corporate rate
  const capexPct = 5;
  const wcPct = 3;
  const terminalGrowth = 3;
  const costOfDebt = 8;
  const riskFreeRate = 4.35 / 100;
  const erp = 5.80 / 100;
  const equityWeight = equity > 0 ? equity / (equity + totalDebt) : 0.70;
  const debtWeight = 1 - equityWeight;

  // Beta re-levered (Hamada)
  const deRatio = debtWeight / equityWeight;
  const betaLevered = bench.beta * (1 + (1 - taxRate / 100) * deRatio);

  // CAPM + WACC
  const costOfEquity = riskFreeRate + betaLevered * erp;
  const costOfDebtAfterTax = (costOfDebt / 100) * (1 - taxRate / 100);
  const waccDecimal = costOfEquity * equityWeight + costOfDebtAfterTax * debtWeight;
  const waccPct = waccDecimal * 100;

  const growth = expectedGrowth || 25;

  // Projections
  const projections = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, waccDecimal);

  // Terminal value
  const g = terminalGrowth / 100;
  let terminalValue = 0, discountedTV = 0, waccWarning: string | null = null;
  if (waccDecimal <= g) {
    waccWarning = "WACC ≤ g terminal: modelo DCF no converge.";
  } else {
    terminalValue = (projections[4].fcff * (1 + g)) / (waccDecimal - g);
    discountedTV = terminalValue / Math.pow(1 + waccDecimal, 5);
  }

  const sumDCF = projections.reduce((s, p) => s + p.discountedFcf, 0);
  const enterpriseValue = sumDCF + discountedTV;
  const netDebt = totalDebt - cash;
  const equityValue = Math.max(enterpriseValue - netDebt, 0);

  // Sensitivity ±1% WACC
  let evLow = 0, evHigh = 0;
  const wL = waccDecimal - 0.01, wH = waccDecimal + 0.01;
  if (wH > g) {
    const pH = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, wH);
    const tvH = (pH[4].fcff * (1 + g)) / (wH - g);
    evLow = pH.reduce((s, p) => s + p.discountedFcf, 0) + tvH / Math.pow(1 + wH, 5);
  }
  if (wL > g) {
    const pL = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, wL);
    const tvL = (pL[4].fcff * (1 + g)) / (wL - g);
    evHigh = pL.reduce((s, p) => s + p.discountedFcf, 0) + tvL / Math.pow(1 + wL, 5);
  }

  // Multiples
  const evEbitda = projections[0].ebitda > 0 ? enterpriseValue / projections[0].ebitda : 0;
  const evRevenue = projections[0].revenue > 0 ? enterpriseValue / projections[0].revenue : 0;

  // Sensitivity matrix 5x5
  const sensitivityMatrix: { waccDelta: number; growthDelta: number; ev: number }[] = [];
  for (const wd of [-2, -1, 0, 1, 2]) {
    for (const gd of [-2, -1, 0, 1, 2]) {
      const w = waccDecimal + wd / 100;
      const gRate = g + gd / 100;
      if (w <= gRate || w <= 0) { sensitivityMatrix.push({ waccDelta: wd, growthDelta: gd, ev: 0 }); continue; }
      const ps = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, growth, ebitdaMargin, capexPct, wcPct, w);
      const tv = (ps[4].fcff * (1 + gRate)) / (w - gRate);
      sensitivityMatrix.push({ waccDelta: wd, growthDelta: gd, ev: ps.reduce((s, p) => s + p.discountedFcf, 0) + tv / Math.pow(1 + w, 5) });
    }
  }

  // KPIs
  const totalAssets = totalDebt + equity;
  const netIncome0 = (ebit0 - interestExpense) * (1 - taxRate / 100);
  const kpis = {
    grossMargin: ((revenue - costOfSales) / revenue) * 100,
    ebitdaMargin,
    ebitMargin: (ebit0 / revenue) * 100,
    netMargin: (netIncome0 / revenue) * 100,
    roe: equity > 0 ? (netIncome0 / equity) * 100 : 0,
    roa: totalAssets > 0 ? (netIncome0 / totalAssets) * 100 : 0,
    netDebt,
    leverage: ebitda0 > 0 ? netDebt / ebitda0 : 0,
    interestCoverage: interestExpense > 0 ? ebit0 / interestExpense : 0,
  };

  // Scenarios
  const mkScenario = (gMod: number, mMod: number, wMod: number, tg: number) => {
    const sG = growth * gMod, sM = ebitdaMargin + mMod, sW = (waccPct + wMod) / 100;
    const sP = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, sG, sM, capexPct, wcPct, sW);
    const sTg = tg / 100;
    let sEV = 0;
    if (sW > sTg) {
      const sTV = (sP[4].fcff * (1 + sTg)) / (sW - sTg);
      sEV = sP.reduce((s, p) => s + p.discountedFcf, 0) + sTV / Math.pow(1 + sW, 5);
    }
    return { projections: sP, ev: sEV, assumptions: { growth: sG, ebitdaMargin: sM, wacc: waccPct + wMod, terminalGrowth: tg } };
  };

  const pessimistic = mkScenario(0.6, -3, 1.5, 2);
  const optimistic = mkScenario(1.4, 3, -1.5, 4);

  return {
    projections,
    scenarios: {
      pessimistic: { ...pessimistic, label: "Pesimista" },
      base: { projections, ev: enterpriseValue, assumptions: { growth, ebitdaMargin, wacc: waccPct, terminalGrowth }, label: "Base" },
      optimistic: { ...optimistic, label: "Optimista" },
    },
    kpis,
    valuation: {
      betaLevered,
      costOfEquity: costOfEquity * 100,
      costOfDebtAfterTax: costOfDebtAfterTax * 100,
      wacc: waccPct,
      terminalValue,
      discountedTV,
      enterpriseValue,
      netDebt,
      equityValue,
      evLow,
      evHigh,
      evEbitda,
      evRevenue,
      waccWarning,
    },
    sensitivityMatrix,
    sectorBenchmark: bench,
    moneda: input.moneda_analisis || "COP",
    factor_conversion: input.factor_conversion || 1,
  };
}

// ═══════════════════════════════════════════════════════════════
// EDGE FUNCTION HANDLER
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { analysis_id } = await req.json();
    if (!analysis_id) throw new Error("analysis_id required");

    console.log(`[ejecutar-calculo] Starting for ${analysis_id}`);

    // Get analysis with input_payload
    const { data: analysis, error: fetchErr } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", analysis_id)
      .single();

    if (fetchErr || !analysis) throw new Error("Analysis not found");

    const input = analysis.input_payload;
    if (!input || !input.income_statement?.revenue) {
      throw new Error("No hay input_payload con revenue. Ejecuta build-structured-input primero.");
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
    const result = runEngine(input, analysis.sector, analysis.expected_growth);

    const elapsed = Date.now() - startTime;
    console.log(`[ejecutar-calculo] Completed in ${elapsed}ms. EV: ${result.valuation.enterpriseValue}`);

    // Store results
    await supabase.from("analyses").update({
      status: "calculo_completo",
      calculation_result: result,
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
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
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
