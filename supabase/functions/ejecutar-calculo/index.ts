import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { computeCapitalStructure, resolveFinancialDebtTotal } from "../_shared/capital-structure.ts";
import { canExecuteCalculation, isInternalServiceCall, type ActorRole, type AuthenticatedActor } from "../_shared/authorization.ts";
import { CANONICAL_METHODOLOGY } from "../_shared/financial-methodology.ts";

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
    const depreciation = revenue * (CANONICAL_METHODOLOGY.assumptions.depreciationPctOfRevenue.value / 100);
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
  // Bloque 1B-M: `is.taxes`/`is.net_income` se leían en variables locales
  // que ningún cálculo posterior de esta función usaba (ver
  // docs/velarix/bloque-1a/BL-26-tabla-comparativa-motores.md sección 2,
  // "impuestos históricos"/"utilidad neta histórica") — código muerto,
  // eliminado. Los KPIs recalculan impuestos/utilidad neta con la tasa
  // corporativa (netIncome0 más abajo), nunca con el valor histórico
  // declarado; esa es una decisión metodológica pendiente (ver
  // docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md),
  // no algo que esta eliminación de código muerto decida.

  // BL-05: el nombre real del campo en structured_inputs.balance_sheet es
  // `financial_debt_total` (build-structured-input/index.ts:210) — antes
  // se leía `total_debt`/`financial_debt`, campos inexistentes, forzando
  // totalDebt a 0 siempre.
  const totalDebt = resolveFinancialDebtTotal(bs);
  const cash = Math.abs(bs.cash || 0);
  const equity = Math.abs(bs.equity || bs.total_equity || 0);

  if (revenue === 0) throw new Error("Revenue es 0 — no se puede calcular valoración.");

  // Derived
  const ebitda0 = revenue - costOfSales - opex + da;
  const ebit0 = ebitda0 - da;
  const costRatio = costOfSales / revenue;
  const ebitdaMargin = (ebitda0 / revenue) * 100;
  // Bloque 1B-M: estos 7 valores ya no son literales duplicados dentro de
  // esta función — vienen del contrato tipado y versionado
  // `_shared/financial-methodology.ts` (mismos valores exactos que antes,
  // ningún número nuevo). Siguen siendo `approved: false` (provisionales)
  // — ver docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md.
  const { assumptions } = CANONICAL_METHODOLOGY;
  const taxRate = assumptions.taxRatePct.value;
  const capexPct = assumptions.capexPctOfRevenue.value;
  const wcPct = assumptions.workingCapitalPctOfRevenue.value;
  const terminalGrowth = assumptions.terminalGrowthPct.value;
  const costOfDebt = assumptions.costOfDebtPct.value;
  const riskFreeRate = assumptions.riskFreeRatePct.value;
  const erp = assumptions.equityRiskPremiumPct.value;

  // BL-05: estructura de capital (peso equity/deuda, Hamada, CAPM, WACC,
  // deuda neta) delegada al módulo puro compartido — la misma función
  // que prueba `capital-structure.test.ts` demuestra que un `totalDebt`
  // correctamente resuelto efectivamente cambia debtWeight/WACC/netDebt.
  const capitalStructure = computeCapitalStructure({
    totalDebt, cash, equity,
    sectorBetaUnlevered: bench.beta,
    taxRatePct: taxRate,
    costOfDebtPct: costOfDebt,
    riskFreeRatePct: riskFreeRate,
    erpPct: erp,
  });
  const { betaLevered, costOfEquityPct, costOfDebtAfterTaxPct, waccPct, netDebt } = capitalStructure;
  const waccDecimal = waccPct / 100;

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
  // netDebt ya viene de computeCapitalStructure (capitalStructure.netDebt).
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
  // Bloque 1B-M: antes, esta función no variaba capexPct/wcPct por
  // escenario en absoluto (usaba siempre las constantes fijas de la
  // línea ~109) — a diferencia del motor cliente
  // (financial-engine.ts:376-400), que sí las ajusta por escenario
  // (pesimista: +2pp/+1pp; optimista: -1pp/-1pp con piso de 1%). Sin
  // ninguna razón documentada para la divergencia (ver
  // docs/velarix/bloque-1a/BL-26-tabla-comparativa-motores.md sección 3),
  // se corrige para que ambos motores calculen el mismo escenario de la
  // misma forma — duplicación que producía resultados diferentes sin
  // justificación.
  const mkScenario = (gMod: number, mMod: number, wMod: number, tg: number, capexDelta: number, wcDelta: number) => {
    const sG = growth * gMod, sM = ebitdaMargin + mMod, sW = (waccPct + wMod) / 100;
    const sCapexPct = Math.max(capexPct + capexDelta, 1);
    const sWcPct = Math.max(wcPct + wcDelta, 1);
    const sP = computeProjections(revenue, costRatio, totalDebt, costOfDebt, taxRate, sG, sM, sCapexPct, sWcPct, sW);
    const sTg = tg / 100;
    let sEV = 0;
    if (sW > sTg) {
      const sTV = (sP[4].fcff * (1 + sTg)) / (sW - sTg);
      sEV = sP.reduce((s, p) => s + p.discountedFcf, 0) + sTV / Math.pow(1 + sW, 5);
    }
    return { projections: sP, ev: sEV, assumptions: { growth: sG, ebitdaMargin: sM, wacc: waccPct + wMod, terminalGrowth: tg } };
  };

  const pessimistic = mkScenario(0.6, -3, 1.5, 2, 2, 1);
  const optimistic = mkScenario(1.4, 3, -1.5, 4, -1, -1);

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
      costOfEquity: costOfEquityPct,
      costOfDebtAfterTax: costOfDebtAfterTaxPct,
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
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || serviceRoleKey;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const authHeader = req.headers.get("Authorization");
    const { analysis_id } = await req.json();
    if (!analysis_id) throw new Error("analysis_id required");

    console.log(`[ejecutar-calculo] Starting for ${analysis_id}`);

    // BL-07: identidad real resuelta server-side. Nunca se confía en un
    // user_id enviado por el frontend — se deriva del JWT verificado
    // (auth.getUser) o de una invocación interna real (comparación
    // contra la service role key, no un campo público como {internal:true}).
    const isInternalCall = isInternalServiceCall(authHeader, serviceRoleKey);
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
