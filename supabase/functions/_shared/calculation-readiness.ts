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
//   varios evidence runs, judgment set malformado, Expediente no evaluado).
// Cada bloqueo trae además `area` (evidence | human_review | judgment |
// methodology | system): el Minimum Expediente incompleto es JUDGMENT_REQUIRED
// del área human_review (revisión humana registrada, no un supuesto).
// Con judgment set activo (ADR-010), la metadata del caso y los 13 supuestos
// salen EXCLUSIVAMENTE del set materializado; las columnas de `analyses` y
// `resolvedAssumptions` se ignoran en ese modo.
// No calcula valoración, no rellena valores, no usa defaults, no escribe nada.

import { deriveCoreFinancialFields } from "./structured-input-derivations.ts";
import { evaluateCalculationPreflight } from "./calculation-preflight.ts";
import { isResolvedGrowth } from "./canonical-input-normalization.ts";
import { assertSingleEvidenceRun, MixedEvidenceRunsError } from "./evidence-runs.ts";
import type { HomologatedAccountRow } from "./financial-accounts.ts";
import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions.ts";
import { evaluateMinimumExpedienteCheckpoint, type MinimumExpedienteCheckpointInput } from "./minimum-expediente-checkpoint.ts";
import type { JudgmentResolution } from "./judgment-sets.ts";
import { evaluateManualMappingReview, MANUAL_MAPPING_REVIEW_REQUIRED, type ValidationResultRow } from "./manual-mapping-review.ts";

export type ReadinessBlockerCategory = "MISSING_EVIDENCE" | "JUDGMENT_REQUIRED" | "METHODOLOGY_DECISION_REQUIRED" | "SYSTEM_ERROR";

export type ReadinessArea = "evidence" | "human_review" | "judgment" | "methodology" | "system";

export interface ReadinessBlocker {
  category: ReadinessBlockerCategory;
  area: ReadinessArea;
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
  /**
   * Conteos del Minimum Expediente (mismos que usa ejecutar-calculo). `null` /
   * ausente = no evaluado → SYSTEM_ERROR (fail-closed: nunca se asume completo).
   */
  minimumExpediente?: MinimumExpedienteCheckpointInput | null;
  /**
   * Judgment activo. Ausente o `{mode:"legacy"}` = sin judgment set (columnas
   * de `analyses` + `resolvedAssumptions`, comportamiento previo).
   */
  judgment?: { mode: "legacy" } | { mode: "judgment_set"; resolution: JudgmentResolution } | null;
  /**
   * validation_results del análisis + el evidence run activo (regla canónica
   * de manual-mapping-review.ts; solo cuenta el run activo). Ausente = no
   * evaluado → SYSTEM_ERROR (fail-closed).
   */
  manualMappingReview?: { activeEvidenceRunId: string | null; validationResults: readonly ValidationResultRow[] } | null;
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
  const AREA: Record<ReadinessBlockerCategory, ReadinessArea> = { MISSING_EVIDENCE: "evidence", JUDGMENT_REQUIRED: "judgment", METHODOLOGY_DECISION_REQUIRED: "methodology", SYSTEM_ERROR: "system" };
  const push = (category: ReadinessBlockerCategory, code: string, field: string, message: string, area: ReadinessArea = AREA[category]) =>
    blockers.push({ category, area, code, field, message });
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

  // ── Revisión humana: Minimum Expediente (mismo checkpoint que ejecutar-calculo) ──
  if (!input.minimumExpediente) {
    push("SYSTEM_ERROR", "MINIMUM_EXPEDIENTE_NOT_EVALUATED", "minimum_expediente", "No se evaluó el Minimum Expediente; no se asume completo.", "human_review");
  } else {
    const cp = evaluateMinimumExpedienteCheckpoint(input.minimumExpediente);
    const labels: Record<string, string> = {
      context: "contexto del caso (empresa y sector)",
      material_account: "al menos una cuenta material anotada (account_notes)",
      ambiguity: "al menos una ambigüedad registrada (expedient_questions)",
      treatment: "al menos un tratamiento humano de una ambigüedad (expedient_answers)",
    };
    for (const m of cp.missing) push("JUDGMENT_REQUIRED", "MINIMUM_EXPEDIENTE_MISSING", `minimum_expediente.${m}`, `Falta ${labels[m] ?? m}.`, "human_review");
  }

  // ── Revisión humana: correcciones manuales de mapping con conflicto (MAP_008 / MAP_009 del run activo) ──
  if (!input.manualMappingReview) {
    push("SYSTEM_ERROR", "MANUAL_MAPPING_REVIEW_NOT_EVALUATED", "validation_results", "No se evaluaron las validaciones del evidence run activo; no se asume que no haya conflictos de mapping.", "human_review");
  } else {
    const review = evaluateManualMappingReview(input.manualMappingReview.activeEvidenceRunId, input.manualMappingReview.validationResults);
    if (review.required) push("JUDGMENT_REQUIRED", MANUAL_MAPPING_REVIEW_REQUIRED, "account_homologations", review.message!, "human_review");
  }

  // ── Judgment del caso ──
  if (empty(input.analysis.moneda_analisis)) push("JUDGMENT_REQUIRED", "CASE_JUDGMENT_MISSING", "moneda_analisis", "Falta moneda del análisis.");
  const judgment = input.judgment ?? { mode: "legacy" as const };
  if (judgment.mode === "judgment_set") {
    // Fuente única: el set activo materializado. Sin fallback a columnas.
    if (!judgment.resolution.ok) {
      for (const i of judgment.resolution.issues) push(i.category, i.code, i.key ?? "judgment_set", i.message);
    }
  } else {
    for (const { field, label } of REQUIRED_CASE_JUDGMENT) {
      if (field === "moneda_analisis") continue;
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
