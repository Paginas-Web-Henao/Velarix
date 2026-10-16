// Extracción de la lógica pura de reglas de `validate-analysis` — mismo
// patrón que `financial-accounts.ts`/`period-resolution.ts`: sin imports de
// URL, sin Supabase, sin Deno, sin `serve()`, sin efectos secundarios —
// importable tanto desde la Edge Function (Deno, import relativo con
// extensión `.ts`) como desde Vitest, ejecutando exactamente la misma
// implementación en ambos casos.
//
// La resolución de `base_period` NO vive aquí — sigue ocurriendo en
// `validate-analysis/index.ts` vía `resolveBasePeriod` (`period-resolution.ts`)
// antes de invocar `evaluate()`. Este módulo solo recibe el `basePeriod` ya
// resuelto.

import { sumAccountValue, sumObservedAccountValue, hasAccountValue, type HomologatedAccountRow } from "./financial-accounts.ts";
import { effectiveDocType } from "./document-type.ts";

export interface ValidationResult {
  code: string;
  severity: "critica" | "media" | "informativa";
  description: string;
  passed: boolean;
  detail: string | null;
  blocking: boolean;
}

export interface DocumentInput {
  original_filename?: string | null;
  file_size_bytes?: number | null;
  processing_status?: string | null;
  doc_type_declared?: string | null;
  /** Tipo resuelto por parse-document; el operacional es effective ?? declared. */
  doc_type_effective?: string | null;
}

// BL-02: reemplaza el `.find()` que tomaba solo la primera subcuenta
// coincidente por la consolidación real (suma) del módulo compartido.
// Bug 2: `period` ahora es obligatorio (el `base_period` ya resuelto por
// `resolveBasePeriod`) — nunca se busca implícitamente `period === null`
// mientras existan períodos explícitos en los datos.
function getVal(accounts: HomologatedAccountRow[], canonical: string, basePeriod: string | null): number | null {
  return sumAccountValue(accounts, canonical, basePeriod ?? undefined);
}

function hasAccount(accounts: HomologatedAccountRow[], canonical: string, basePeriod: string | null): boolean {
  return hasAccountValue(accounts, canonical, basePeriod ?? undefined);
}

// BAL_005 necesita el signo observado (sin la normalización ABS_NORMALIZED_ACCOUNTS
// de sumAccountValue) para poder señalar un cash negativo como validación,
// sin decidir si es convención de signos o sobregiro real — esa distinción
// requiere revisión humana. Solo se usa aquí; el resto de evaluate() y todo
// el cálculo posterior siguen usando getVal/sumAccountValue sin cambios.
function getObservedVal(accounts: HomologatedAccountRow[], canonical: string, basePeriod: string | null): number | null {
  return sumObservedAccountValue(accounts, canonical, basePeriod ?? undefined);
}

// ═══════════════════════════════════════════════════════════════
// Resumen de la validación de EVIDENCE (no de preparación para el cálculo)
// ═══════════════════════════════════════════════════════════════
// Evidence validation responde "¿la Evidence se procesó de forma íntegra y
// coherente?". NO responde "¿se puede calcular?": eso requiere además
// Judgment y supuestos explícitos (calculation preflight). Por eso las
// etiquetas hablan de Evidence y `calculation_readiness` queda NOT_EVALUATED.
export interface EvidenceValidationSummary {
  semaphore: "verde" | "amarillo" | "rojo";
  validationStatus: "aprobado" | "aprobado_con_advertencias" | "bloqueado";
  analysisStatus: "validacion_aprobada" | "validacion_con_advertencias" | "validacion_bloqueada";
  label: string;
  criticalCount: number;
  warningCount: number;
  scope: "evidence_validation";
  calculationReadiness: "NOT_EVALUATED";
}

export function summarizeEvidenceValidation(results: readonly ValidationResult[]): EvidenceValidationSummary {
  const criticalCount = results.filter((r) => !r.passed && r.blocking).length;
  const warningCount = results.filter((r) => !r.passed && (r.severity === "media" || r.severity === "critica")).length;
  const base = { criticalCount, warningCount, scope: "evidence_validation" as const, calculationReadiness: "NOT_EVALUATED" as const };
  if (criticalCount > 0) return { ...base, semaphore: "rojo", validationStatus: "bloqueado", analysisStatus: "validacion_bloqueada", label: "✗ Evidence bloqueada" };
  if (warningCount > 0) return { ...base, semaphore: "amarillo", validationStatus: "aprobado_con_advertencias", analysisStatus: "validacion_con_advertencias", label: "⚠ Evidence validada con advertencias" };
  return { ...base, semaphore: "verde", validationStatus: "aprobado", analysisStatus: "validacion_aprobada", label: "✓ Evidence validada" };
}

// ═══════════════════════════════════════════════════════════════
// Motor de validaciones — NUNCA bloquea por BAL_001 ni PER_002
// Tolerancia colombiana: documentos de trabajo, redondeos NIIF
// ═══════════════════════════════════════════════════════════════
export function evaluate(
  accounts: HomologatedAccountRow[],
  documents: DocumentInput[],
  periods: string[],
  basePeriod: string | null,
): ValidationResult[] {
  const r: ValidationResult[] = [];

  // ── DOC rules ──
  if (documents.length > 0) {
    const validFormats = ["pdf", "xlsx", "xls", "csv"];
    const allFormatsOk = documents.every((d) => validFormats.includes((d.original_filename || "").split(".").pop()?.toLowerCase() || ""));
    r.push({ code: "DOC_001", severity: "critica", description: "Formato de archivo soportado", passed: allFormatsOk, detail: allFormatsOk ? null : "Formato no soportado. Acepta PDF, XLSX, XLS, CSV.", blocking: true });

    const allSizeOk = documents.every((d) => d.file_size_bytes != null && d.file_size_bytes <= 10 * 1024 * 1024);
    const sizeUnknown = documents.some((d) => d.file_size_bytes == null);
    r.push({ code: "DOC_002", severity: "critica", description: "Tamaño dentro del límite", passed: allSizeOk, detail: allSizeOk ? null : (sizeUnknown ? "No se pudo determinar el tamaño del archivo." : "Archivo supera 10 MB."), blocking: true });

    const allParsed = documents.every((d) => d.processing_status === "completado");
    r.push({ code: "DOC_003", severity: "critica", description: "Documento legible", passed: allParsed, detail: allParsed ? null : "No se pudo extraer información. Verifica que no sea imagen escaneada.", blocking: true });

    r.push({ code: "DOC_005", severity: "critica", description: "Período contable detectable", passed: periods.length > 0, detail: periods.length === 0 ? "No se identificó el período contable." : null, blocking: true });
  }

  // ── MAP rules ──
  const hasIncomeStatement = documents.some((d) => ["estado_resultados", "mixto", "estados_financieros"].includes(effectiveDocType(d) ?? ""));
  const revenueFound = hasAccount(accounts, "revenue", basePeriod);

  // MAP_001: Revenue — WARNING if no income statement loaded
  if (hasIncomeStatement) {
    r.push({ code: "MAP_001", severity: "media", description: "Ingresos identificados", passed: revenueFound, detail: !revenueFound ? "No se identificaron ingresos. Se recomienda verificar el documento." : null, blocking: false });
  } else {
    r.push({ code: "MAP_001", severity: "informativa", description: "Ingresos identificados", passed: revenueFound, detail: !revenueFound ? "Solo se cargó balance — se recomienda agregar estado de resultados." : null, blocking: false });
  }

  // MAP_002: Cash — WARNING, not critical
  r.push({ code: "MAP_002", severity: "media", description: "Caja identificada", passed: hasAccount(accounts, "cash", basePeriod), detail: !hasAccount(accounts, "cash", basePeriod) ? "No se identificó una cuenta de caja homologada. Requiere revisión antes del cálculo; la ausencia no se interpreta como cero." : null, blocking: false });

  // MAP_003: Debt — informative
  const hasDebt = hasAccount(accounts, "current_financial_debt", basePeriod) || hasAccount(accounts, "long_term_financial_debt", basePeriod);
  r.push({ code: "MAP_003", severity: "informativa", description: "Deuda financiera identificada", passed: hasDebt, detail: !hasDebt ? "No se identificó deuda financiera." : null, blocking: false });

  // MAP_004: Equity — WARNING
  r.push({ code: "MAP_004", severity: "media", description: "Patrimonio identificado", passed: hasAccount(accounts, "equity", basePeriod), detail: !hasAccount(accounts, "equity", basePeriod) ? "No se identificó patrimonio." : null, blocking: false });

  // MAP_005: Total assets — WARNING
  r.push({ code: "MAP_005", severity: "informativa", description: "Total activos identificado", passed: hasAccount(accounts, "total_assets", basePeriod), detail: !hasAccount(accounts, "total_assets", basePeriod) ? "No se identificó una cuenta de total activos homologada. Requiere revisión; no se deriva por suma de componentes." : null, blocking: false });

  // MAP_006: Total liabilities — WARNING
  r.push({ code: "MAP_006", severity: "media", description: "Total pasivos identificado", passed: hasAccount(accounts, "total_liabilities", basePeriod), detail: !hasAccount(accounts, "total_liabilities", basePeriod) ? "No se identificó total pasivos." : null, blocking: false });

  // MAP_007: EBIT derivable
  const hasEBIT = hasAccount(accounts, "ebit", basePeriod) || (hasAccount(accounts, "revenue", basePeriod) && (hasAccount(accounts, "cost_of_sales", basePeriod) || hasAccount(accounts, "opex", basePeriod)));
  r.push({ code: "MAP_007", severity: "informativa", description: "EBIT derivable", passed: hasEBIT, detail: !hasEBIT ? "EBIT no derivable. Algunos KPIs estarán incompletos." : null, blocking: false });

  // MAP_008 / MAP_009 — solo en sets con una corrección manual de mapping
  // (ADR-011). La corrección no pasa por map-accounts, así que sus
  // invariantes se re-verifican aquí. Detectan; no corrigen nada.
  type MappingRow = { id?: string; original_label?: string | null; category?: string | null; canonical_account: string; period?: string | null; manual_correction_by?: string | null };
  const mappingRows = accounts as unknown as MappingRow[];
  const corrected = mappingRows.filter((a) => a.manual_correction_by);
  if (corrected.length) {
    const classified = mappingRows.filter((a) => a.canonical_account !== "unclassified");
    const byContext = new Map<string, number>();
    for (const a of classified) {
      const k = `${a.original_label ?? ""}|${a.category ?? ""}|${a.canonical_account}|${a.period ?? ""}`;
      byContext.set(k, (byContext.get(k) ?? 0) + 1);
    }
    const dupContexts = [...byContext].filter(([, n]) => n > 1).map(([k]) => k.split("|"));
    r.push({ code: "MAP_008", severity: "media", description: "Sin duplicados de etiqueta y contexto tras corrección manual", passed: dupContexts.length === 0,
      detail: dupContexts.length ? `Misma etiqueta, estado, cuenta y período más de una vez: ${dupContexts.map(([l, c, acc, per]) => `"${l}" (${c}) → ${acc} ${per}`).join("; ")}.` : null, blocking: false });
    const consolidated = corrected
      .filter((c) => c.canonical_account !== "unclassified")
      .map((c) => ({ c, others: classified.filter((o) => o.id !== c.id && o.canonical_account === c.canonical_account && (o.period ?? "") === (c.period ?? "")) }))
      .filter((x) => x.others.length > 0);
    r.push({ code: "MAP_009", severity: "media", description: "Cuenta corregida manualmente sin consolidarse con otras filas del período", passed: consolidated.length === 0,
      detail: consolidated.length ? `La corrección suma varias filas en la misma cuenta y período (revisar doble conteo): ${consolidated.map((x) => `${x.c.canonical_account} ${x.c.period ?? ""}: "${x.c.original_label ?? ""}" + ${x.others.map((o) => `"${o.original_label ?? ""}"`).join(", ")}`).join("; ")}.` : null, blocking: false });
  }

  // ── BAL rules — NEVER BLOCKING ──
  const totalAssets = getVal(accounts, "total_assets", basePeriod);
  const totalLiab = getVal(accounts, "total_liabilities", basePeriod);
  const equity = getVal(accounts, "equity", basePeriod);

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

  // Bug NULL/vacuous-pass: si el dato no existe, la regla de propiedad NO se
  // emite (mismo precedente que BAL_001 arriba). La ausencia la sigue
  // reportando su MAP_* correspondiente — aquí no se cambia threshold,
  // severity ni blocking, solo se deja de afirmar "passed" sobre un valor
  // que nunca se evaluó.
  if (totalAssets != null) {
    r.push({ code: "BAL_002", severity: "media", description: "Total activos mayor a cero", passed: totalAssets > 0, detail: totalAssets <= 0 ? "Total activos es cero o negativo." : null, blocking: false });
  }
  if (equity != null) {
    r.push({ code: "BAL_003", severity: "informativa", description: "Patrimonio positivo", passed: equity > 0, detail: equity <= 0 ? "Patrimonio es cero o negativo." : null, blocking: false });
  }

  const observedCash = getObservedVal(accounts, "cash", basePeriod);
  if (observedCash != null) {
    r.push({ code: "BAL_005", severity: "informativa", description: "Caja no negativa", passed: observedCash >= 0, detail: observedCash < 0 ? "Caja con valor negativo (posible sobregiro)." : null, blocking: false });
  }

  // ── IS rules ──
  const revenue = getVal(accounts, "revenue", basePeriod);
  if (revenue != null) {
    r.push({ code: "IS_001", severity: "media", description: "Ingresos mayores a cero", passed: revenue > 0, detail: revenue <= 0 ? "Ingresos son cero o negativos." : null, blocking: false });
  }

  r.push({ code: "IS_005", severity: "informativa", description: "Gastos financieros identificados", passed: getVal(accounts, "interest_expense", basePeriod) != null, detail: getVal(accounts, "interest_expense", basePeriod) == null ? "No se identificaron gastos financieros." : null, blocking: false });

  r.push({ code: "IS_006", severity: "informativa", description: "Impuestos identificados", passed: getVal(accounts, "taxes", basePeriod) != null, detail: getVal(accounts, "taxes", basePeriod) == null ? "No se identificó una cuenta de impuestos homologada. Requiere revisión antes del cálculo: no se asumirá una tasa sin Judgment explícito." : null, blocking: false });

  // ── PER rules — NEVER BLOCKING ──
  r.push({ code: "PER_001", severity: "media", description: "Al menos un período completo", passed: periods.length >= 1, detail: periods.length === 0 ? "No hay períodos contables." : null, blocking: false });
  r.push({ code: "PER_002", severity: "informativa", description: "Múltiples períodos", passed: periods.length >= 2, detail: periods.length === 1 ? "Solo se identificó un período contable; la suficiencia para proyección no se evalúa en esta etapa." : null, blocking: false });

  return r;
}
