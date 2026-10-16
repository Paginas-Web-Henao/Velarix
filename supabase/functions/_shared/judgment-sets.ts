// Judgment versionado (judgment sets) — núcleo puro: sin Supabase, sin red.
//
// Analogía con evidence runs (ADR-009): un judgment set es un conjunto
// COHERENTE de decisiones humanas formulado sobre UN evidence run. Se
// construye como borrador (draft), se valida, se completa y solo entonces se
// promueve (puntero analyses.active_judgment_set_id). Nunca "la última fila
// por key gana" entre sets: un cálculo usa exactamente UN set.
//
// Dentro de un draft, corregir una decisión es SUPERSESSION (una entrada
// nueva que apunta a la anterior), no una mutación. Las entradas efectivas
// son las no superadas; dos entradas efectivas con la misma key = error.
//
// Materialización fail-closed: ResolvedCalculationAssumptions (contrato
// canónico, sin reinterpretar) + Judgment del caso. Ningún default.

import { REQUIRED_RESOLVED_ASSUMPTION_KEYS, type ResolvedCalculationAssumptions, type ResolvedAssumptionUnit } from "./resolved-calculation-assumptions.ts";
import { evaluateCalculationPreflight } from "./calculation-preflight.ts";
import { isResolvedGrowth } from "./canonical-input-normalization.ts";

export type JudgmentSetStatus = "draft" | "completed" | "failed";
export type JudgmentEntryStatus = "resolved" | "proposed";

export interface JudgmentSetRow {
  id: string;
  analysis_id: string;
  evidence_run_id: string;
  status: JudgmentSetStatus;
  previous_active_judgment_set_id?: string | null;
  reused_from_judgment_set_id?: string | null;
  completed_at?: string | null;
  promoted_at?: string | null;
  created_by?: string | null;
  /** Contador de escrituras del draft (trigger de entradas); CAS de complete. */
  revision?: number;
}

export interface JudgmentEntryRow {
  id: string;
  judgment_set_id: string;
  key: string;
  value: unknown;
  unit?: string | null;
  source_type?: string;
  source: string;
  rationale: string;
  status: JudgmentEntryStatus;
  effective_date?: string | null;
  references?: unknown;
  supersedes_entry_id?: string | null;
  created_by?: string | null;
  created_at?: string;
}

// ── Catálogo de keys ────────────────────────────────────────────────

/** Judgment del caso que el cálculo necesita (y que el snapshot del cálculo congela). */
export const CASE_JUDGMENT_KEYS = ["case.expected_growth", "case.valuation_date", "case.basis_of_value", "case.valued_interest", "case.calculation_architecture"] as const;
export type CaseJudgmentKey = (typeof CASE_JUDGMENT_KEYS)[number];

/** Los 13 supuestos resueltos del contrato canónico, como keys `resolved.<campo>`. */
export const RESOLVED_JUDGMENT_KEYS = REQUIRED_RESOLVED_ASSUMPTION_KEYS.map((k) => `resolved.${k}` as const);

/** Decisiones documentadas que hoy el motor no consume (puente EV→Equity, clasificaciones, normalizaciones). Opcionales, se congelan. */
export const DECISION_KEY_PREFIX = "decision.";

export const REQUIRED_JUDGMENT_KEYS: readonly string[] = [...CASE_JUDGMENT_KEYS, ...RESOLVED_JUDGMENT_KEYS];

export function isKnownJudgmentKey(key: string): boolean {
  return REQUIRED_JUDGMENT_KEYS.includes(key) || (key.startsWith(DECISION_KEY_PREFIX) && /^decision\.[a-z0-9_]+(\.[a-z0-9_]+)*$/.test(key));
}

// ── Errores clasificados ─────────────────────────────────────────────

export type JudgmentIssueCategory = "JUDGMENT_REQUIRED" | "SYSTEM_ERROR";
export interface JudgmentIssue { category: JudgmentIssueCategory; code: string; key: string | null; message: string }

const issue = (category: JudgmentIssueCategory, code: string, key: string | null, message: string): JudgmentIssue => ({ category, code, key, message });

/** Entradas efectivas de un set: las que ninguna otra entrada del MISMO set supera. */
export function effectiveEntries(setId: string, entries: readonly JudgmentEntryRow[]): { entries: JudgmentEntryRow[]; issues: JudgmentIssue[] } {
  const issues: JudgmentIssue[] = [];
  const own = entries.filter((e) => e.judgment_set_id === setId);
  if (own.length !== entries.length) issues.push(issue("SYSTEM_ERROR", "MIXED_JUDGMENT_SETS", null, `Se recibieron ${entries.length - own.length} entradas de otro judgment set; nunca se mezclan sets.`));
  const ids = new Set(own.map((e) => e.id));
  const superseded = new Set<string>();
  for (const e of own) {
    if (!e.supersedes_entry_id) continue;
    if (!ids.has(e.supersedes_entry_id)) issues.push(issue("SYSTEM_ERROR", "SUPERSEDES_OUTSIDE_SET", e.key, `La entrada ${e.id} supera una entrada que no pertenece a este set.`));
    else {
      const target = own.find((x) => x.id === e.supersedes_entry_id)!;
      if (target.key !== e.key) issues.push(issue("SYSTEM_ERROR", "SUPERSEDES_KEY_MISMATCH", e.key, `La entrada ${e.id} supera una entrada de otra key (${target.key}).`));
      superseded.add(e.supersedes_entry_id);
    }
  }
  return { entries: own.filter((e) => !superseded.has(e.id)), issues };
}

const isFiniteNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const nonEmpty = (s: unknown): s is string => typeof s === "string" && s.trim().length > 0;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validateCaseValue(key: CaseJudgmentKey, value: unknown): string | null {
  if (key === "case.expected_growth") return isFiniteNumber(value) ? null : "debe ser un número finito (0 es válido; null no)";
  if (key === "case.valuation_date") return typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)) ? null : "debe ser una fecha ISO YYYY-MM-DD";
  return nonEmpty(value) ? null : "debe ser un texto no vacío";
}

export interface CaseJudgment {
  expected_growth: number;
  valuation_date: string;
  basis_of_value: string;
  valued_interest: string;
  calculation_architecture: string;
}

export interface MaterializedJudgment {
  judgmentSetId: string;
  evidenceRunId: string;
  caseJudgment: CaseJudgment;
  resolvedAssumptions: ResolvedCalculationAssumptions;
  decisions: Record<string, { value: unknown; source: string; rationale: string }>;
}

export type JudgmentResolution = { ok: true; judgment: MaterializedJudgment } | { ok: false; issues: JudgmentIssue[] };

/**
 * Valida el contenido de un set (draft o completo) y lo materializa. Lo usa
 * la completación (antes de marcar `completed`) y la lectura (antes de
 * construir el input del cálculo). Fail-closed, sin "best effort".
 */
export function materializeJudgmentSet(set: JudgmentSetRow, entries: readonly JudgmentEntryRow[]): JudgmentResolution {
  const { entries: eff, issues } = effectiveEntries(set.id, entries);

  const byKey = new Map<string, JudgmentEntryRow>();
  for (const e of eff) {
    if (!isKnownJudgmentKey(e.key)) { issues.push(issue("SYSTEM_ERROR", "UNKNOWN_JUDGMENT_KEY", e.key, `Key desconocida "${e.key}".`)); continue; }
    if (byKey.has(e.key)) { issues.push(issue("SYSTEM_ERROR", "DUPLICATE_JUDGMENT_KEY", e.key, `Dos entradas efectivas para "${e.key}" en el mismo set.`)); continue; }
    if ((e.source_type ?? "JUDGMENT") !== "JUDGMENT") issues.push(issue("SYSTEM_ERROR", "INVALID_SOURCE_TYPE", e.key, `source_type debe ser JUDGMENT.`));
    if (!nonEmpty(e.source) || !nonEmpty(e.rationale)) issues.push(issue("JUDGMENT_REQUIRED", "JUDGMENT_PROVENANCE_MISSING", e.key, `"${e.key}" debe declarar source y rationale.`));
    if (e.status !== "resolved") issues.push(issue("JUDGMENT_REQUIRED", "JUDGMENT_NOT_RESOLVED", e.key, `"${e.key}" está en estado "${e.status}", no "resolved".`));
    byKey.set(e.key, e);
  }
  for (const key of REQUIRED_JUDGMENT_KEYS) {
    if (!byKey.has(key)) issues.push(issue("JUDGMENT_REQUIRED", "JUDGMENT_KEY_MISSING", key, `Falta "${key}".`));
  }
  for (const key of CASE_JUDGMENT_KEYS) {
    const e = byKey.get(key);
    const err = e ? validateCaseValue(key, e.value) : null;
    if (err) issues.push(issue("SYSTEM_ERROR", "INVALID_JUDGMENT_VALUE", key, `"${key}" ${err}.`));
  }

  // Los 13 supuestos se reconstruyen EXACTAMENTE con el contrato canónico y se
  // validan con las mismas reglas que el preflight del motor.
  const resolved: Record<string, unknown> = {};
  for (const k of REQUIRED_RESOLVED_ASSUMPTION_KEYS) {
    const e = byKey.get(`resolved.${k}`);
    if (!e) continue;
    resolved[k] = {
      value: e.value,
      ...(e.unit ? { unit: e.unit as ResolvedAssumptionUnit } : {}),
      source: e.source,
      rationale: e.rationale,
      status: e.status,
      ...(e.effective_date ? { date: e.effective_date } : {}),
    };
  }
  if (REQUIRED_RESOLVED_ASSUMPTION_KEYS.every((k) => k in resolved)) {
    const pf = evaluateCalculationPreflight({ incomeStatement: {}, balanceSheet: {}, resolvedAssumptions: resolved as Partial<ResolvedCalculationAssumptions> });
    for (const b of pf.blockers.filter((x) => x.startsWith("RESOLVED_ASSUMPTION_"))) {
      issues.push(issue("SYSTEM_ERROR", "INVALID_JUDGMENT_VALUE", null, b));
    }
  }

  if (issues.length) return { ok: false, issues };
  const v = (k: CaseJudgmentKey) => byKey.get(k)!.value;
  const decisions: MaterializedJudgment["decisions"] = {};
  for (const [k, e] of byKey) if (k.startsWith(DECISION_KEY_PREFIX)) decisions[k] = { value: e.value, source: e.source, rationale: e.rationale };
  return {
    ok: true,
    judgment: {
      judgmentSetId: set.id,
      evidenceRunId: set.evidence_run_id,
      caseJudgment: {
        expected_growth: v("case.expected_growth") as number,
        valuation_date: v("case.valuation_date") as string,
        basis_of_value: v("case.basis_of_value") as string,
        valued_interest: v("case.valued_interest") as string,
        calculation_architecture: v("case.calculation_architecture") as string,
      },
      resolvedAssumptions: resolved as unknown as ResolvedCalculationAssumptions,
      decisions,
    },
  };
}

/**
 * Lectura del set ACTIVO para el cálculo: fail-closed si no hay puntero, si
 * el set no está completo/promovido, si pertenece a otro análisis o si fue
 * formulado sobre un evidence run distinto del activo (Judgment no se
 * reutiliza en silencio entre runs).
 */
export function resolveActiveJudgmentSet(params: {
  analysis: { id: string; active_judgment_set_id?: string | null; active_evidence_run_id?: string | null };
  set: JudgmentSetRow | null;
  entries: readonly JudgmentEntryRow[];
}): JudgmentResolution {
  const { analysis, set } = params;
  if (!analysis.active_judgment_set_id) return { ok: false, issues: [issue("JUDGMENT_REQUIRED", "NO_ACTIVE_JUDGMENT_SET", null, "El caso no tiene un judgment set activo.")] };
  if (!set || set.id !== analysis.active_judgment_set_id) return { ok: false, issues: [issue("SYSTEM_ERROR", "ACTIVE_JUDGMENT_SET_NOT_FOUND", null, "El puntero apunta a un judgment set que no se recibió.")] };
  const issues: JudgmentIssue[] = [];
  if (set.analysis_id !== analysis.id) issues.push(issue("SYSTEM_ERROR", "JUDGMENT_SET_ANALYSIS_MISMATCH", null, "El judgment set activo pertenece a otro análisis."));
  // Lo que hace "activo" a un set es el puntero (CAS); `promoted_at` es bitácora.
  if (set.status !== "completed") issues.push(issue("SYSTEM_ERROR", "ACTIVE_JUDGMENT_SET_NOT_COMPLETED", null, `El set activo está en estado "${set.status}"; solo un set completado puede estar activo.`));
  if (set.evidence_run_id !== (analysis.active_evidence_run_id ?? null)) {
    issues.push(issue("JUDGMENT_REQUIRED", "JUDGMENT_STALE_FOR_EVIDENCE_RUN", null, `El judgment set se formuló sobre el evidence run ${set.evidence_run_id}; el activo es ${analysis.active_evidence_run_id ?? "legacy"}. Reutilizarlo exige una acción humana explícita (nuevo set).`));
  }
  const m = materializeJudgmentSet(set, params.entries);
  if (!m.ok) issues.push(...m.issues);
  return issues.length ? { ok: false, issues } : m;
}

// ── Transiciones (las aplica el servidor; la base las refuerza con triggers) ──

/** Traduce el rechazo de la base al escribir una entrada (los mensajes del trigger empiezan con el código). */
export function classifyEntryWriteError(error: { code?: string; message?: string }): { status: number; code: string } {
  const msg = error.message ?? "";
  if (msg.startsWith("JUDGMENT_SET_NOT_DRAFT")) return { status: 409, code: "JUDGMENT_SET_NOT_DRAFT" };
  if (msg.startsWith("JUDGMENT_ENTRY_HEAD_CONFLICT") || error.code === "23505" || error.code === "40001") return { status: 409, code: "JUDGMENT_ENTRY_CONFLICT" };
  return { status: 400, code: "JUDGMENT_ENTRY_REJECTED" };
}

export type JudgmentTransition = "add_entry" | "complete" | "fail" | "promote";

export function canTransition(set: JudgmentSetRow, action: JudgmentTransition): { allowed: true } | { allowed: false; reason: string } {
  if (action === "add_entry" || action === "complete" || action === "fail") {
    return set.status === "draft" ? { allowed: true } : { allowed: false, reason: `El set está en estado "${set.status}"; solo un draft admite ${action}.` };
  }
  if (set.status !== "completed") return { allowed: false, reason: `Solo un set completado se promueve (estado "${set.status}").` };
  if (set.promoted_at) return { allowed: false, reason: "El set ya fue promovido." };
  return { allowed: true };
}

// ── Frescura del structured input respecto del Judgment activo (ejecutar-calculo) ──

/** Provenance de Judgment que el builder congela en `input_payload.judgment`. */
export interface InputJudgmentProvenance {
  judgment_set_id: string;
  evidence_run_id: string;
  assumptions_source: "judgment_set";
  case: CaseJudgment;
  decisions: MaterializedJudgment["decisions"];
}

export type InputJudgmentCheck =
  | { ok: true; mode: "legacy" }
  | { ok: true; mode: "judgment_set"; expectedGrowth: number; provenance: InputJudgmentProvenance }
  | { ok: false; code: "STRUCTURED_INPUT_STALE_FOR_JUDGMENT" | "STRUCTURED_INPUT_JUDGMENT_MALFORMED"; message: string };

/**
 * Decide si el structured input persistido puede alimentar el cálculo frente
 * a los punteros ACTUALES del análisis. Fail-closed:
 * - sin puntero de Judgment y sin provenance → legacy (comportamiento previo);
 * - puntero de Judgment → el input debe haberse construido desde ESE set y
 *   ESE evidence run (si no, está obsoleto: reconstruir el input);
 * - provenance sin puntero, o malformada → no se calcula.
 * En modo judgment_set el crecimiento sale del input (materializado del set),
 * nunca de `analyses.expected_growth`.
 */
export function checkInputJudgmentFreshness(
  analysis: { active_judgment_set_id?: string | null; active_evidence_run_id?: string | null },
  input: { expected_growth?: unknown; judgment?: unknown } | null | undefined,
): InputJudgmentCheck {
  const prov = input?.judgment as Partial<InputJudgmentProvenance> | undefined | null;
  const activeSet = analysis.active_judgment_set_id ?? null;
  if (!activeSet && (prov === undefined || prov === null)) return { ok: true, mode: "legacy" };
  if (!activeSet) {
    return { ok: false, code: "STRUCTURED_INPUT_STALE_FOR_JUDGMENT", message: "El input trae provenance de Judgment pero el análisis no tiene judgment set activo." };
  }
  if (!prov || typeof prov !== "object") {
    return { ok: false, code: "STRUCTURED_INPUT_STALE_FOR_JUDGMENT", message: "El análisis tiene judgment set activo pero el input se construyó sin él; reconstruye el structured input." };
  }
  if (prov.assumptions_source !== "judgment_set" || typeof prov.judgment_set_id !== "string" || typeof prov.evidence_run_id !== "string" || !prov.case) {
    return { ok: false, code: "STRUCTURED_INPUT_JUDGMENT_MALFORMED", message: "La provenance de Judgment del input está incompleta." };
  }
  if (prov.judgment_set_id !== activeSet) {
    return { ok: false, code: "STRUCTURED_INPUT_STALE_FOR_JUDGMENT", message: `El input se construyó con el judgment set ${prov.judgment_set_id}, pero el activo es ${activeSet}.` };
  }
  if (prov.evidence_run_id !== (analysis.active_evidence_run_id ?? null)) {
    return { ok: false, code: "STRUCTURED_INPUT_STALE_FOR_JUDGMENT", message: `El input se construyó sobre el evidence run ${prov.evidence_run_id}, pero el activo es ${analysis.active_evidence_run_id ?? "ninguno"}.` };
  }
  const g = input?.expected_growth;
  if (!isResolvedGrowth(g) || g !== prov.case.expected_growth) {
    return { ok: false, code: "STRUCTURED_INPUT_JUDGMENT_MALFORMED", message: "expected_growth del input no coincide con el Judgment congelado." };
  }
  return { ok: true, mode: "judgment_set", expectedGrowth: g, provenance: prov as InputJudgmentProvenance };
}
