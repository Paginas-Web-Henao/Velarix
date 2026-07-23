import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sumAccountValue, hasAccountValue, type HomologatedAccountRow } from "../_shared/financial-accounts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════
// Motor de validaciones — NUNCA bloquea por BAL_001 ni PER_002
// Tolerancia colombiana: documentos de trabajo, redondeos NIIF
// ═══════════════════════════════════════════════════════════════

interface ValidationResult {
  code: string;
  severity: "critica" | "media" | "informativa";
  description: string;
  passed: boolean;
  detail: string | null;
  blocking: boolean;
}

// BL-02: reemplaza el `.find()` que tomaba solo la primera subcuenta
// coincidente por la consolidación real (suma) del módulo compartido.
function getVal(accounts: HomologatedAccountRow[], canonical: string): number | null {
  return sumAccountValue(accounts, canonical);
}

function hasAccount(accounts: HomologatedAccountRow[], canonical: string): boolean {
  return hasAccountValue(accounts, canonical);
}

function evaluate(accounts: any[], documents: any[], periods: string[]): ValidationResult[] {
  const r: ValidationResult[] = [];

  // ── DOC rules ──
  if (documents.length > 0) {
    const validFormats = ["pdf", "xlsx", "xls", "csv"];
    const allFormatsOk = documents.every((d: any) => validFormats.includes((d.original_filename || "").split(".").pop()?.toLowerCase() || ""));
    r.push({ code: "DOC_001", severity: "critica", description: "Formato de archivo soportado", passed: allFormatsOk, detail: allFormatsOk ? null : "Formato no soportado. Acepta PDF, XLSX, XLS, CSV.", blocking: true });

    const allSizeOk = documents.every((d: any) => !d.file_size_bytes || d.file_size_bytes <= 10 * 1024 * 1024);
    r.push({ code: "DOC_002", severity: "critica", description: "Tamaño dentro del límite", passed: allSizeOk, detail: allSizeOk ? null : "Archivo supera 10 MB.", blocking: true });

    const allParsed = documents.every((d: any) => d.processing_status === "completado");
    r.push({ code: "DOC_003", severity: "critica", description: "Documento legible", passed: allParsed, detail: allParsed ? null : "No se pudo extraer información. Verifica que no sea imagen escaneada.", blocking: true });

    r.push({ code: "DOC_005", severity: "critica", description: "Período contable detectable", passed: periods.length > 0, detail: periods.length === 0 ? "No se identificó el período contable." : null, blocking: true });
  }

  // ── MAP rules ──
  const hasIncomeStatement = documents.some((d: any) => d.doc_type_declared === "estado_resultados" || d.doc_type_declared === "mixto");
  const revenueFound = hasAccount(accounts, "revenue");

  // MAP_001: Revenue — WARNING if no income statement loaded
  if (hasIncomeStatement) {
    r.push({ code: "MAP_001", severity: "media", description: "Ingresos identificados", passed: revenueFound, detail: !revenueFound ? "No se identificaron ingresos. Se recomienda verificar el documento." : null, blocking: false });
  } else {
    r.push({ code: "MAP_001", severity: "informativa", description: "Ingresos identificados", passed: revenueFound, detail: !revenueFound ? "Solo se cargó balance — se recomienda agregar estado de resultados." : null, blocking: false });
  }

  // MAP_002: Cash — WARNING, not critical
  r.push({ code: "MAP_002", severity: "media", description: "Caja identificada", passed: hasAccount(accounts, "cash"), detail: !hasAccount(accounts, "cash") ? "No se identificó caja. Se usará valor cero." : null, blocking: false });

  // MAP_003: Debt — informative
  const hasDebt = hasAccount(accounts, "current_financial_debt") || hasAccount(accounts, "long_term_financial_debt");
  r.push({ code: "MAP_003", severity: "informativa", description: "Deuda financiera identificada", passed: hasDebt, detail: !hasDebt ? "No se identificó deuda financiera." : null, blocking: false });

  // MAP_004: Equity — WARNING
  r.push({ code: "MAP_004", severity: "media", description: "Patrimonio identificado", passed: hasAccount(accounts, "equity"), detail: !hasAccount(accounts, "equity") ? "No se identificó patrimonio." : null, blocking: false });

  // MAP_005: Total assets — WARNING
  r.push({ code: "MAP_005", severity: "informativa", description: "Total activos identificado", passed: hasAccount(accounts, "total_assets"), detail: !hasAccount(accounts, "total_assets") ? "No se identificó total activos. Se calculará por suma de componentes." : null, blocking: false });

  // MAP_006: Total liabilities — WARNING
  r.push({ code: "MAP_006", severity: "media", description: "Total pasivos identificado", passed: hasAccount(accounts, "total_liabilities"), detail: !hasAccount(accounts, "total_liabilities") ? "No se identificó total pasivos." : null, blocking: false });

  // MAP_007: EBIT derivable
  const hasEBIT = hasAccount(accounts, "ebit") || (hasAccount(accounts, "revenue") && (hasAccount(accounts, "cost_of_sales") || hasAccount(accounts, "opex")));
  r.push({ code: "MAP_007", severity: "informativa", description: "EBIT derivable", passed: hasEBIT, detail: !hasEBIT ? "EBIT no derivable. Algunos KPIs estarán incompletos." : null, blocking: false });

  // ── BAL rules — NEVER BLOCKING ──
  const totalAssets = getVal(accounts, "total_assets");
  const totalLiab = getVal(accounts, "total_liabilities");
  const equity = getVal(accounts, "equity");

  if (totalAssets != null && totalLiab != null && equity != null) {
    const diff = Math.abs(totalAssets - (totalLiab + equity));
    const pct = totalAssets > 0 ? diff / totalAssets : 1;
    let detail: string | null = null;
    let severity: "critica" | "media" | "informativa" = "informativa";

    if (pct > 0.50) {
      detail = `Diferencia del ${(pct * 100).toFixed(1)}% entre activos y pasivo+patrimonio. Verificar datos.`;
      severity = "media";
    } else if (pct > 0.20) {
      detail = `Diferencia del ${(pct * 100).toFixed(1)}%. Puede deberse a partidas NIIF no explícitas.`;
      severity = "media";
    } else if (pct > 0.03) {
      detail = `Diferencia menor del ${(pct * 100).toFixed(1)}%. Dentro de tolerancia aceptable.`;
      severity = "informativa";
    }

    r.push({ code: "BAL_001", severity, description: "Ecuación patrimonial", passed: pct <= 0.03, detail, blocking: false });
  }

  r.push({ code: "BAL_002", severity: "media", description: "Total activos mayor a cero", passed: totalAssets == null || totalAssets > 0, detail: totalAssets != null && totalAssets <= 0 ? "Total activos es cero o negativo." : null, blocking: false });
  r.push({ code: "BAL_003", severity: "informativa", description: "Patrimonio positivo", passed: equity == null || equity > 0, detail: equity != null && equity <= 0 ? "Patrimonio es cero o negativo." : null, blocking: false });

  const cash = getVal(accounts, "cash");
  r.push({ code: "BAL_005", severity: "informativa", description: "Caja no negativa", passed: cash == null || cash >= 0, detail: cash != null && cash < 0 ? "Caja con valor negativo (posible sobregiro)." : null, blocking: false });

  // ── IS rules ──
  const revenue = getVal(accounts, "revenue");
  r.push({ code: "IS_001", severity: "media", description: "Ingresos mayores a cero", passed: revenue == null || revenue > 0, detail: revenue != null && revenue <= 0 ? "Ingresos son cero o negativos." : null, blocking: false });

  r.push({ code: "IS_005", severity: "informativa", description: "Gastos financieros identificados", passed: getVal(accounts, "interest_expense") != null, detail: getVal(accounts, "interest_expense") == null ? "No se identificaron gastos financieros." : null, blocking: false });

  r.push({ code: "IS_006", severity: "informativa", description: "Impuestos identificados", passed: getVal(accounts, "taxes") != null, detail: getVal(accounts, "taxes") == null ? "Impuestos no identificados. Se usará tasa corporativa de referencia." : null, blocking: false });

  // ── PER rules — NEVER BLOCKING ──
  r.push({ code: "PER_001", severity: "media", description: "Al menos un período completo", passed: periods.length >= 1, detail: periods.length === 0 ? "No hay períodos contables." : null, blocking: false });
  r.push({ code: "PER_002", severity: "informativa", description: "Múltiples períodos", passed: periods.length >= 2, detail: periods.length === 1 ? "Solo un período. Proyecciones basadas en un solo año." : null, blocking: false });

  return r;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || serviceRoleKey;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    const { analysis_id } = await req.json();
    if (!analysis_id) throw new Error("analysis_id required");

    const { data: analysis } = await supabase.from("analyses").select("*").eq("id", analysis_id).single();
    if (!analysis || analysis.user_id !== user.id) throw new Error("Not found");

    const { data: accounts } = await supabase.from("account_homologations").select("*").eq("analysis_id", analysis_id);
    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ success: false, error: { code: "NO_ACCOUNTS", message: "No hay cuentas homologadas." } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: documents } = await supabase.from("documents").select("*").eq("analysis_id", analysis_id);
    const periods = [...new Set(accounts.filter((a: any) => a.period).map((a: any) => a.period))].sort();

    const results = evaluate(accounts, documents || [], periods);

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
    return new Response(JSON.stringify({ success: false, error: { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Error en la validación." } }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
