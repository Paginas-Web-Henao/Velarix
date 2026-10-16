// Calculation readiness (decisión pura: sin Supabase, sin Deno, sin red, sin motor).
//
// Responde "¿se puede calcular este caso?" — distinto de "¿la Evidence está
// validada?" (validate-analysis). Un caso puede estar en
// `validacion_aprobada` y aun así NOT_READY.
//
// Devuelve READY o NOT_READY con bloqueos clasificados:
// - MISSING_EVIDENCE: el set activo de Evidence no trae un dato observado requerido;
// - JUDGMENT_REQUIRED: falta una decisión humana explícita (metadata del caso,
//   expected_growth, los 13 supuestos resueltos);
// - METHODOLOGY_DECISION_REQUIRED: el sistema no tiene una regla canónica
//   aprobada. Solo se declara si quien llama lo indica explícitamente
//   (`methodologyDecisionsPending`) — este módulo no infiere metodología;
// - SYSTEM_ERROR: el input viola un invariante del sistema (p. ej. filas de
//   varios evidence runs).
// No calcula valoración, no rellena valores, no usa defaults, no escribe nada.

import { deriveCoreFinancialFields } from "./structured-input-derivations.ts";
import { evaluateCalculationPreflight } from "./calculation-preflight.ts";
import { isResolvedGrowth } from "./canonical-input-normalization.ts";
import { assertSingleEvidenceRun, MixedEvidenceRunsError } from "./evidence-runs.ts";
import type { HomologatedAccountRow } from "./financial-accounts.ts";
import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions.ts";

export type ReadinessBlockerCategory = "MISSING_EVIDENCE" | "JUDGMENT_REQUIRED" | "METHODOLOGY_DECISION_REQUIRED" | "SYSTEM_ERROR";

export interface ReadinessBlocker {
  category: ReadinessBlockerCategory;
  code: string;
  field: string;
  message: string;
}

export interface CalculationReadinessInput {
  analysis: {
    valuation_date?: string | null;
    basis_of_value?: string | null;
    valued_interest?: string | null;
    calculation_architecture?: string | null;
    moneda_analisis?: string | null;
    expected_growth?: number | null;
    validation_status?: string | null;
  };
  /** SOLO el set activo de Evidence (selectActiveRows). */
  activeAccounts: readonly HomologatedAccountRow[];
  /** Período base resuelto desde la Evidence (resolveBasePeriod); null si no se pudo resolver. */
  basePeriod: string | null;
  /** Los 13 supuestos resueltos (Judgment), tal como se entregarían al motor. */
  resolvedAssumptions: Partial<ResolvedCalculationAssumptions> | null | undefined;
  /** Decisiones metodológicas pendientes documentadas para el caso (campo → decisión). */
  methodologyDecisionsPending?: readonly { field: string; decision: string }[];
}

export interface CalculationReadinessResult {
  readiness: "READY" | "NOT_READY";
  scope: "calculation_readiness";
  blockers: ReadinessBlocker[];
  counts: Record<ReadinessBlockerCategory, number>;
}

/** Campos observados que el motor exige (mismos que `calculation-preflight.ts`). */
const REQUIRED_EVIDENCE: { field: string; pick: (c: ReturnType<typeof deriveCoreFinancialFields>) => number | null }[] = [
  { field: "revenue", pick: (c) => c.revenue },
  { field: "cost_of_sales", pick: (c) => c.costOfSales },
  { field: "opex", pick: (c) => c.opex },
  { field: "da", pick: (c) => c.da },
  { field: "cash", pick: (c) => c.cash },
  { field: "equity", pick: (c) => c.equity },
  { field: "financial_debt_total", pick: (c) => c.financialDebtTotal },
];

/** Metadata del caso que el cálculo necesita como Judgment explícito (nunca heredada ni inferida). */
const REQUIRED_CASE_JUDGMENT: { field: keyof CalculationReadinessInput["analysis"]; label: string }[] = [
  { field: "valuation_date", label: "fecha de valoración (no es la fecha del filing)" },
  { field: "basis_of_value", label: "basis of value" },
  { field: "valued_interest", label: "interés valorado / perímetro" },
  { field: "calculation_architecture", label: "arquitectura del cálculo" },
  { field: "moneda_analisis", label: "moneda del análisis" },
];

const EVIDENCE_OK = new Set(["aprobado", "aprobado_con_advertencias"]);
const empty = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

export function evaluateCalculationReadiness(input: CalculationReadinessInput): CalculationReadinessResult {
  const blockers: ReadinessBlocker[] = [];
  const push = (category: ReadinessBlockerCategory, code: string, field: string, message: string) => blockers.push({ category, code, field, message });
  const pending = new Map((input.methodologyDecisionsPending ?? []).map((d) => [d.field, d.decision]));

  // ── Evidence ──
  let mixed = false;
  try { assertSingleEvidenceRun(input.activeAccounts); } catch (e) {
    if (!(e instanceof MixedEvidenceRunsError)) throw e;
    mixed = true;
    push("SYSTEM_ERROR", "MIXED_EVIDENCE_RUNS", "account_homologations", e.message);
  }
  if (!EVIDENCE_OK.has(String(input.analysis.validation_status ?? ""))) {
    push("MISSING_EVIDENCE", "EVIDENCE_NOT_VALIDATED", "validation_status", `La Evidence activa no está validada (validation_status=${JSON.stringify(input.analysis.validation_status ?? null)}).`);
  }
  if (input.activeAccounts.length === 0) {
    push("MISSING_EVIDENCE", "NO_ACTIVE_EVIDENCE", "account_homologations", "No hay homologaciones en el set activo de Evidence.");
  } else if (!input.basePeriod) {
    push("MISSING_EVIDENCE", "BASE_PERIOD_UNRESOLVED", "base_period", "No se pudo resolver un período base único desde la Evidence.");
  } else if (!mixed) {
    const core = deriveCoreFinancialFields(input.activeAccounts, input.basePeriod);
    for (const { field, pick } of REQUIRED_EVIDENCE) {
      if (pick(core) !== null) continue;
      const decision = pending.get(field);
      if (decision) push("METHODOLOGY_DECISION_REQUIRED", "EVIDENCE_SOURCE_DECISION", field, decision);
      else push("MISSING_EVIDENCE", "EVIDENCE_FIELD_MISSING", field, `"${field}" no está observado en el set activo para ${input.basePeriod}.`);
    }
  }

  // ── Judgment del caso ──
  for (const { field, label } of REQUIRED_CASE_JUDGMENT) {
    if (empty(input.analysis[field])) push("JUDGMENT_REQUIRED", "CASE_JUDGMENT_MISSING", String(field), `Falta ${label}.`);
  }
  if (!isResolvedGrowth(input.analysis.expected_growth)) {
    push("JUDGMENT_REQUIRED", "CASE_JUDGMENT_MISSING", "expected_growth", "Falta el crecimiento de ingresos (expected_growth); no se usa ningún valor por defecto.");
  }

  // ── Los 13 supuestos resueltos (mismas reglas que el preflight del motor) ──
  const pf = evaluateCalculationPreflight({ incomeStatement: {}, balanceSheet: {}, resolvedAssumptions: input.resolvedAssumptions ?? null });
  for (const b of pf.blockers.filter((x) => x.startsWith("RESOLVED_ASSUMPTION_"))) {
    const code = b.slice(0, b.indexOf(":"));
    const field = /"([A-Za-z]+)"/.exec(b)?.[1] ?? code.replace(/^RESOLVED_ASSUMPTION_[A-Z]+_/, "").toLowerCase();
    push("JUDGMENT_REQUIRED", code, field, b.slice(b.indexOf(":") + 1).trim());
  }

  // ── Decisiones metodológicas pendientes no ligadas a un campo de Evidence ──
  const evidenceFields = new Set(REQUIRED_EVIDENCE.map((r) => r.field));
  for (const [field, decision] of pending) {
    if (!evidenceFields.has(field)) push("METHODOLOGY_DECISION_REQUIRED", "METHODOLOGY_DECISION_PENDING", field, decision);
  }

  const counts = { MISSING_EVIDENCE: 0, JUDGMENT_REQUIRED: 0, METHODOLOGY_DECISION_REQUIRED: 0, SYSTEM_ERROR: 0 };
  for (const b of blockers) counts[b.category]++;
  return { readiness: blockers.length === 0 ? "READY" : "NOT_READY", scope: "calculation_readiness", blockers, counts };
}
