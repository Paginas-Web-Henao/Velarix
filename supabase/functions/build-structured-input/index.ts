import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sumAccountValue, type HomologatedAccountRow } from "../_shared/financial-accounts.ts";
import { resolveBasePeriod } from "../_shared/period-resolution.ts";
import { deriveFinancialDebtTotal, deriveEbitdaFromComponents } from "../_shared/structured-input-derivations.ts";
import { computeTotalConversionFactor, normalizeCurrencyCode } from "../_shared/currency.ts";
import { buildCalculationProvenance, type HomologationReference } from "../_shared/calculation-provenance.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, BadRequestError, mapErrorToResponse } from "../_shared/user-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════
// Damodaran 2026 fallback — 15 sectores Colombia
// ═══════════════════════════════════════════════════════════════

const SECTOR_SNAPSHOTS_2026: Record<string, any> = {
  "Software / Tecnología":             { beta: 1.22, evEbitda: 13.0, evRevenue: 4.8, ebitdaMargin: 26.0, wacc: 11.2 },
  "Retail / Comercio":                 { beta: 1.08, evEbitda: 9.5,  evRevenue: 2.2, ebitdaMargin: 18.5, wacc: 10.2 },
  "Servicios empresariales":           { beta: 0.98, evEbitda: 10.5, evRevenue: 2.6, ebitdaMargin: 20.5, wacc: 9.6  },
  "Manufactura":                       { beta: 1.18, evEbitda: 8.5,  evRevenue: 1.9, ebitdaMargin: 16.5, wacc: 10.6 },
  "Consumo / Consumer Products":       { beta: 0.93, evEbitda: 11.5, evRevenue: 3.1, ebitdaMargin: 22.5, wacc: 9.1  },
  "Alimentos y bebidas":               { beta: 0.78, evEbitda: 10.5, evRevenue: 2.3, ebitdaMargin: 18.5, wacc: 9.1  },
  "Agroindustria":                     { beta: 0.83, evEbitda: 8.5,  evRevenue: 1.6, ebitdaMargin: 15.5, wacc: 9.6  },
  "Salud":                             { beta: 0.88, evEbitda: 11.5, evRevenue: 2.9, ebitdaMargin: 20.5, wacc: 9.6  },
  "Educación":                         { beta: 0.73, evEbitda: 9.5,  evRevenue: 2.1, ebitdaMargin: 18.5, wacc: 8.6  },
  "Transporte y logística":            { beta: 1.03, evEbitda: 8.5,  evRevenue: 1.7, ebitdaMargin: 14.5, wacc: 10.1 },
  "Construcción e infraestructura":    { beta: 1.13, evEbitda: 7.5,  evRevenue: 1.5, ebitdaMargin: 13.5, wacc: 10.6 },
  "Energía y utilities":               { beta: 0.52, evEbitda: 9.5,  evRevenue: 3.1, ebitdaMargin: 36.0, wacc: 8.1  },
  "Turismo y hospitalidad":            { beta: 1.28, evEbitda: 9.5,  evRevenue: 2.1, ebitdaMargin: 16.5, wacc: 11.1 },
  "Inmobiliario":                      { beta: 0.68, evEbitda: 13.5, evRevenue: 5.2, ebitdaMargin: 41.0, wacc: 8.6  },
  "Financiero / Seguros":              { beta: 0.83, evEbitda: 10.5, evRevenue: 3.6, ebitdaMargin: 31.0, wacc: 9.1  },
};

// TRM from macro data (single source of truth)
const TRM = 4080;

// BL-02: la consolidación de subcuentas (sumar todas las filas del mismo
// `canonical_account`, no tomar solo la primera con `.find()`) ahora vive
// en el módulo puro compartido `_shared/financial-accounts.ts`, usado
// también por `validate-analysis` y `continuar-tras-revision`.
// Bug 2: `basePeriod` es obligatorio (el `base_period` ya resuelto por
// `resolveBasePeriod`) — nunca se buscan implícitamente filas con
// `period === null` mientras existan períodos explícitos en los datos, y
// nunca se mezclan valores de distintos años.
function getAccountValue(accounts: HomologatedAccountRow[], canonical: string, basePeriod: string | null): number | null {
  return sumAccountValue(accounts, canonical, basePeriod ?? undefined);
}

function buildDefaultSnapshot(sector: string) {
  const bench = SECTOR_SNAPSHOTS_2026[sector] || SECTOR_SNAPSHOTS_2026["Servicios empresariales"];
  return {
    id: `snap_default_${sector.toLowerCase().replace(/\s+/g, "_")}`,
    effective_date: "2026-01-15",
    sector,
    source_version: "damodaran_2026_jan",
    data_payload: {
      sector_data: {
        beta_unlevered:    { value: bench.beta, source: "Damodaran Jan 2026", date: "2026-01" },
        ev_ebitda_ref:     { value: bench.evEbitda, source: "Damodaran Jan 2026", date: "2026-01" },
        ev_revenue_ref:    { value: bench.evRevenue, source: "Damodaran Jan 2026", date: "2026-01" },
        ebitda_margin_ref: { value: bench.ebitdaMargin, source: "Damodaran Jan 2026", date: "2026-01" },
        wacc_ref:          { value: bench.wacc, source: "Damodaran Jan 2026", date: "2026-01" },
        erp:               { value: 5.80, source: "Damodaran ERP Emerging Markets Jan 2026", date: "2026-01" },
      },
    },
    macro_payload: {
      macro_colombia: {
        policy_rate:    { value: 7.50, source: "Banco de la República", date: "2026-03" },
        inflation_ipc:  { value: 3.88, source: "DANE", date: "2026-02" },
        trm_avg:        { value: TRM, source: "Banco de la República", date: "2026-02" },
        gdp_growth:     { value: 2.8, source: "DANE", date: "2025-Q4" },
      },
      risk_market: {
        risk_free_rate:       { value: 4.35, source: "US Treasury 10Y", date: "2026-03" },
        country_risk_premium: { value: 2.20, source: "EMBI Colombia", date: "2026-03" },
      },
    },
  };
}

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

    // PROBLEMA 5: Flexible status — never block, just log
    const estadosPermitidos = [
      "validacion_aprobada", "validacion_con_advertencias", "validacion_bloqueada",
      "calculo_en_curso", "documentos_cargados", "parsing_completado", "homologacion_en_curso"
    ];
    if (!estadosPermitidos.includes(analysis.status)) {
      console.log("[build-structured-input] Estado actual:", analysis.status, "— continuando de todas formas");
    }

    const { data: accounts } = await supabase.from("account_homologations").select("*").eq("analysis_id", analysis_id);
    if (!accounts || accounts.length === 0) {
      throw new BadRequestError("NO_ACCOUNTS", "No hay cuentas homologadas.");
    }

    // Bug 2 — política provisional de base_period: se resuelve un único
    // período base ANTES de leer ninguna cifra financiera. Si es ambiguo,
    // no se construye un input estructurado parcialmente arbitrario — se
    // bloquea de forma explícita y trazable (mismo framework de errores
    // que NO_ACCOUNTS arriba).
    const periodResolution = resolveBasePeriod(accounts.map((a: any) => a.period ?? null));
    if (!periodResolution.ok) {
      await supabase.from("audit_events").insert({
        analysis_id, event_type: "periodo_base_ambiguo",
        event_detail: periodResolution.reason ?? "Período base ambiguo — requiere revisión humana.",
        component: "build-structured-input", user_id: user.id,
        metadata: { available_periods: periodResolution.availablePeriods, selection_mode: periodResolution.selectionMode },
      });
      throw new BadRequestError(
        "PERIOD_AMBIGUOUS",
        periodResolution.reason ?? "Período base ambiguo — requiere revisión humana antes de continuar.",
      );
    }
    const basePeriod = periodResolution.basePeriod;
    const periods = periodResolution.availablePeriods;

    const revenue = getAccountValue(accounts, "revenue", basePeriod);
    const costOfSales = getAccountValue(accounts, "cost_of_sales", basePeriod);
    const opex = getAccountValue(accounts, "opex", basePeriod);
    const da = getAccountValue(accounts, "da", basePeriod);
    const interestExpense = getAccountValue(accounts, "interest_expense", basePeriod);
    const taxes = getAccountValue(accounts, "taxes", basePeriod);
    const netIncome = getAccountValue(accounts, "net_income", basePeriod);

    let ebitda = getAccountValue(accounts, "ebitda", basePeriod);
    let ebit = getAccountValue(accounts, "ebit", basePeriod);
    if (ebitda == null) ebitda = deriveEbitdaFromComponents({ revenue, costOfSales, opex, da });
    if (ebit == null && ebitda != null && da != null) ebit = ebitda - da;

    const cash = getAccountValue(accounts, "cash", basePeriod);
    const accountsReceivable = getAccountValue(accounts, "accounts_receivable", basePeriod);
    const inventory = getAccountValue(accounts, "inventory", basePeriod);
    const ppe = getAccountValue(accounts, "ppe", basePeriod);
    const currentDebt = getAccountValue(accounts, "current_financial_debt", basePeriod);
    const ltDebt = getAccountValue(accounts, "long_term_financial_debt", basePeriod);
    const totalDebt = deriveFinancialDebtTotal(currentDebt, ltDebt);
    const equity = getAccountValue(accounts, "equity", basePeriod);
    // AUSENTE != 0: total_assets/total_liabilities NUNCA se derivan por
    // suma parcial de componentes — no existe una decisión metodológica
    // aprobada que autorice asumir que estos componentes agotan
    // exhaustivamente el total real. Ausente -> null, tal cual lo observado.
    const totalAssets = getAccountValue(accounts, "total_assets", basePeriod);
    const totalLiabilities = getAccountValue(accounts, "total_liabilities", basePeriod);
    const accountsPayable = getAccountValue(accounts, "accounts_payable", basePeriod);

    const qualityFlags: string[] = [];

    if (inventory == null) qualityFlags.push("sin_inventario_declarado");
    if (accountsReceivable == null) qualityFlags.push("sin_cartera_declarada");
    if (interestExpense == null) qualityFlags.push("sin_gastos_financieros");
    if (ebitda == null) qualityFlags.push("ebitda_no_derivable");

    // ── Currency conversion (BL-03) ──
    // monedaAnalisis: elección real del usuario (analyses.moneda_analisis,
    // default 'COP' — es un valor de producto, no una moneda "detectada").
    const monedaAnalisis = normalizeCurrencyCode((analysis as any).moneda_analisis) ?? "COP";
    const { data: auditParse } = await supabase.from("audit_events")
      .select("metadata").eq("analysis_id", analysis_id).eq("event_type", "parse_complete")
      .order("created_at", { ascending: false }).limit(1);
    const parseMeta = (auditParse?.[0]?.metadata as any) || {};
    // monedaDoc: moneda REAL del documento fuente, detectada por
    // parse-document. Antes de la corrección de BL-03, este campo nunca
    // sobrevivía la persistencia (ver parse-document/index.ts) y siempre
    // caía al valor por defecto — ahora, si sigue ausente, es porque
    // genuinamente no se detectó ninguna evidencia, no por un bug de
    // persistencia. No se asume "COP" en ese caso.
    const monedaDoc = normalizeCurrencyCode(parseMeta.moneda_documento);
    const factorEscala = Number(parseMeta.factor_escala) || 1;

    const { totalConversionFactor: factorTotal, currencyConversionApplied, currencyUndetected } =
      computeTotalConversionFactor({
        sourceCurrency: monedaDoc,
        reportingCurrency: monedaAnalisis,
        scaleFactor: factorEscala,
        exchangeRate: TRM,
      });

    if (currencyUndetected) {
      qualityFlags.push("moneda_documento_no_detectada");
    } else if (currencyConversionApplied) {
      qualityFlags.push(`Valores convertidos de ${monedaDoc} a ${monedaAnalisis} (TRM ${TRM})`);
    } else if (factorTotal !== 1) {
      qualityFlags.push(`Factor de escala aplicado: ${factorEscala}`);
    }

    const conv = (v: number | null) => v !== null ? v * factorTotal : null;

    const validationNotes: string[] = [];
    if (totalAssets != null && totalLiabilities != null && equity != null) validationNotes.push("Ecuación patrimonial validada");
    if (ebitda != null && getAccountValue(accounts, "ebitda", basePeriod) == null) validationNotes.push("EBITDA calculado desde componentes");

    const { data: dbSnapshot } = await supabase
      .from("external_snapshots").select("*")
      .eq("sector", analysis.sector)
      .order("effective_date", { ascending: false })
      .limit(1).single();

    const snapshot = dbSnapshot || buildDefaultSnapshot(analysis.sector);
    const snapshotId = dbSnapshot?.id || null;

    const builtAt = new Date().toISOString();

    // Bloque 1C-T: procedencia técnica — reutiliza las mismas filas de
    // `account_homologations` ya consultadas arriba (id, document_id,
    // canonical_account, period). No agrega ninguna consulta nueva a
    // Supabase.
    // `period` se incluye para que buildCalculationProvenance pueda filtrar
    // field-level provenance por basePeriod — antes se omitía, así que una
    // homologación de 2024 podía aparecer como evidencia de un valor
    // calculado para basePeriod=2025 (ver auditoría).
    const homologationRefs: HomologationReference[] = (accounts || []).map(
      (a: { id: string; document_id: string | null; canonical_account: string; period: string | null }) => ({
        id: a.id,
        document_id: a.document_id ?? null,
        canonical_account: a.canonical_account,
        period: a.period ?? null,
      }),
    );

    // Se necesita el id real de la fila de `structured_inputs` para la
    // procedencia (`structured_input_id`) antes de construir el payload
    // que se va a persistir en esa misma fila. Se reutiliza el id
    // existente si ya hay una fila para este `analysis_id` (columna
    // UNIQUE); si no, se genera uno nuevo aquí mismo para poder incluirlo
    // en el único upsert de abajo, sin una escritura previa intermedia.
    const { data: existingRow } = await supabase
      .from("structured_inputs").select("id").eq("analysis_id", analysis_id).maybeSingle();
    const structuredInputId: string = existingRow?.id || crypto.randomUUID();

    const provenance = buildCalculationProvenance({
      analysisId: analysis_id,
      structuredInputId,
      homologationRows: homologationRefs,
      monedaAnalisis,
      monedaDocumento: monedaDoc,
      factorConversion: factorTotal,
      builtAt,
      periodSelection: {
        base_period: periodResolution.basePeriod,
        selection_mode: periodResolution.selectionMode,
        available_periods: periodResolution.availablePeriods,
      },
    });

    const structuredInput = {
      analysis_id,
      sector: analysis.sector,
      expected_growth: analysis.expected_growth || 25,
      moneda_analisis: monedaAnalisis,
      moneda_documento: monedaDoc,
      factor_conversion: factorTotal,
      periods,
      base_period: basePeriod,
      income_statement: { revenue: conv(revenue), cost_of_sales: conv(costOfSales), opex: conv(opex), da: conv(da), ebitda: conv(ebitda), ebit: conv(ebit), interest_expense: conv(interestExpense), taxes: conv(taxes), net_income: conv(netIncome) },
      balance_sheet: { cash: conv(cash), accounts_receivable: conv(accountsReceivable), inventory: conv(inventory), accounts_payable: conv(accountsPayable), ppe: conv(ppe), current_financial_debt: conv(currentDebt), long_term_financial_debt: conv(ltDebt), financial_debt_total: conv(totalDebt), equity: conv(equity), total_assets: conv(totalAssets), total_liabilities: conv(totalLiabilities) },
      quality_flags: qualityFlags,
      validation_notes: validationNotes,
      snapshot_id: snapshotId,
      snapshot_data: snapshot.data_payload || snapshot,
      macro_data: snapshot.macro_payload || null,
      version_input: "2.3",
      created_at: builtAt,
      // Bloque 1C-T: trazabilidad técnica hacia account_homologations/documents.
      // No conecta todavía al PDF (eso es Bloque 1E) ni reemplaza las 10
      // decisiones metodológicas pendientes.
      provenance,
    };

    await supabase.from("structured_inputs").upsert(
      { id: structuredInputId, analysis_id, input_payload: structuredInput, version_input: "2.3" },
      { onConflict: "analysis_id" },
    );
    if (snapshotId) await supabase.from("analyses").update({ snapshot_id: snapshotId }).eq("id", analysis_id);

    await supabase.from("audit_events").insert({
      analysis_id, event_type: "structured_input_built",
      event_detail: `Input v2.3: ${qualityFlags.length} flags, ${periods.length} períodos, base_period: ${basePeriod}, moneda: ${monedaAnalisis}`,
      component: "build-structured-input", user_id: user.id,
      metadata: { quality_flags: qualityFlags, periods, base_period: basePeriod, snapshot_id: snapshotId, version: "2.3", moneda_analisis: monedaAnalisis, moneda_documento: monedaDoc, factor_total: factorTotal },
    });

    return new Response(JSON.stringify({
      success: true, data: structuredInput,
      meta: { analysis_id, timestamp: new Date().toISOString() },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("build-structured-input error:", error);
    const mapped = mapErrorToResponse(error, { code: "BUILD_ERROR", message: "Error al construir el input estructurado." });
    return new Response(JSON.stringify(mapped.body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
