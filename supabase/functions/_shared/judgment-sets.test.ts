// Judgment versionado (ADR-010) — lógica pura. Los valores son los del
// fixture SINTÉTICO de tests (EXAMPLE_RESOLVED_ASSUMPTIONS); ninguno es
// Judgment real de un caso.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canTransition, checkInputJudgmentFreshness, effectiveEntries, materializeJudgmentSet, resolveActiveJudgmentSet,
  type JudgmentEntryRow, type JudgmentSetRow,
} from "./judgment-sets";
import { REQUIRED_RESOLVED_ASSUMPTION_KEYS } from "./resolved-calculation-assumptions";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";
import { evaluateCalculationReadiness } from "./calculation-readiness";

const SYN = "SYNTHETIC_TEST_FIXTURE";
let n = 0;
const entry = (setId: string, key: string, value: unknown, over: Partial<JudgmentEntryRow> = {}): JudgmentEntryRow =>
  ({ id: `e-${++n}`, judgment_set_id: setId, key, value, source: SYN, rationale: "test", status: "resolved", source_type: "JUDGMENT", ...over });

function fullEntries(setId: string, growth: unknown = 5): JudgmentEntryRow[] {
  const out = [
    entry(setId, "case.expected_growth", growth),
    entry(setId, "case.valuation_date", "2000-01-01"),
    entry(setId, "case.basis_of_value", "synthetic basis"),
    entry(setId, "case.valued_interest", "synthetic interest"),
    entry(setId, "case.calculation_architecture", "synthetic architecture"),
  ];
  for (const k of REQUIRED_RESOLVED_ASSUMPTION_KEYS) {
    const a = EXAMPLE_RESOLVED_ASSUMPTIONS[k] as { value: unknown; unit?: string; source: string; rationale: string; date?: string };
    out.push(entry(setId, `resolved.${k}`, a.value, { unit: a.unit ?? null, source: a.source, rationale: a.rationale, effective_date: a.date ?? null }));
  }
  return out;
}
const set = (id: string, over: Partial<JudgmentSetRow> = {}): JudgmentSetRow => ({ id, analysis_id: "an-1", evidence_run_id: "run-1", status: "completed", ...over });
const analysis = (over: Record<string, unknown> = {}) => ({ id: "an-1", active_judgment_set_id: "js-A", active_evidence_run_id: "run-1", ...over });
const codes = (r: ReturnType<typeof materializeJudgmentSet>) => (r.ok ? [] : r.issues.map((i) => i.code));

describe("judgment sets — materialización", () => {
  it("materializa EXACTAMENTE los 13 supuestos al contrato ResolvedCalculationAssumptions", () => {
    const r = materializeJudgmentSet(set("js-A"), fullEntries("js-A"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.judgment.resolvedAssumptions).toEqual(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(r.judgment).toMatchObject({ judgmentSetId: "js-A", evidenceRunId: "run-1", caseJudgment: { expected_growth: 5, valuation_date: "2000-01-01" } });
  });

  it("expected_growth: null no resuelve; 0 es Judgment válido; 5 se respeta (nunca 25)", () => {
    expect(codes(materializeJudgmentSet(set("js-A"), fullEntries("js-A", null)))).toEqual(["INVALID_JUDGMENT_VALUE"]);
    const zero = materializeJudgmentSet(set("js-A"), fullEntries("js-A", 0));
    expect(zero.ok && zero.judgment.caseJudgment.expected_growth).toBe(0);
    const five = materializeJudgmentSet(set("js-A"), fullEntries("js-A", 5));
    expect(five.ok && five.judgment.caseJudgment.expected_growth).toBe(5);
  });

  it("falta una key requerida → JUDGMENT_REQUIRED, sin rellenar", () => {
    const r = materializeJudgmentSet(set("js-A"), fullEntries("js-A").filter((e) => e.key !== "resolved.terminalG"));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.issues).toEqual([expect.objectContaining({ category: "JUDGMENT_REQUIRED", code: "JUDGMENT_KEY_MISSING", key: "resolved.terminalG" })]);
  });

  it("entrada propuesta (no resuelta) o sin source/rationale → bloquea", () => {
    const es = fullEntries("js-A");
    es[0] = { ...es[0], status: "proposed" };
    es[1] = { ...es[1], rationale: " " };
    expect(codes(materializeJudgmentSet(set("js-A"), es)).sort()).toEqual(["JUDGMENT_NOT_RESOLVED", "JUDGMENT_PROVENANCE_MISSING"]);
  });

  it("dos entradas efectivas de la misma key sin supersession → DUPLICATE_JUDGMENT_KEY", () => {
    expect(codes(materializeJudgmentSet(set("js-A"), [...fullEntries("js-A"), entry("js-A", "case.expected_growth", 3)]))).toContain("DUPLICATE_JUDGMENT_KEY");
  });

  it("supersession dentro del set: la entrada nueva reemplaza a la superada", () => {
    const es = fullEntries("js-A", 5);
    const g = es.find((e) => e.key === "case.expected_growth")!;
    const r = materializeJudgmentSet(set("js-A"), [...es, entry("js-A", "case.expected_growth", 3, { supersedes_entry_id: g.id })]);
    expect(r.ok && r.judgment.caseJudgment.expected_growth).toBe(3);
  });

  it("NUNCA latest-per-key entre sets: entradas de otro set → MIXED_JUDGMENT_SETS", () => {
    const r = materializeJudgmentSet(set("js-A"), [...fullEntries("js-A", 5), entry("js-B", "case.expected_growth", 9)]);
    expect(codes(r)).toContain("MIXED_JUDGMENT_SETS");
    // y la supersession no cruza sets
    const es = fullEntries("js-A");
    expect(effectiveEntries("js-A", [...es, entry("js-A", "case.expected_growth", 1, { supersedes_entry_id: "not-in-set" })]).issues.map((i) => i.code)).toContain("SUPERSEDES_OUTSIDE_SET");
  });

  it("key desconocida → SYSTEM_ERROR; decision.* es opcional y se congela", () => {
    expect(codes(materializeJudgmentSet(set("js-A"), [...fullEntries("js-A"), entry("js-A", "wacc", 1)]))).toEqual(["UNKNOWN_JUDGMENT_KEY"]);
    const r = materializeJudgmentSet(set("js-A"), [...fullEntries("js-A"), entry("js-A", "decision.synthetic", { a: 1 })]);
    expect(r.ok && r.judgment.decisions).toEqual({ "decision.synthetic": { value: { a: 1 }, source: SYN, rationale: "test" } });
  });
});

describe("judgment sets — set activo (fail-closed)", () => {
  it("sin puntero → NO_ACTIVE_JUDGMENT_SET (JUDGMENT_REQUIRED)", () => {
    const r = resolveActiveJudgmentSet({ analysis: analysis({ active_judgment_set_id: null }), set: null, entries: [] });
    expect(!r.ok && r.issues).toEqual([expect.objectContaining({ category: "JUDGMENT_REQUIRED", code: "NO_ACTIVE_JUDGMENT_SET" })]);
  });

  it("set activo draft o failed → no alimenta Calculation", () => {
    for (const status of ["draft", "failed"] as const) {
      const r = resolveActiveJudgmentSet({ analysis: analysis(), set: set("js-A", { status }), entries: fullEntries("js-A") });
      expect(codes(r)).toContain("ACTIVE_JUDGMENT_SET_NOT_COMPLETED");
    }
  });

  it("Evidence mismatch: set formulado sobre otro evidence run → JUDGMENT_STALE_FOR_EVIDENCE_RUN", () => {
    const r = resolveActiveJudgmentSet({ analysis: analysis({ active_evidence_run_id: "run-2" }), set: set("js-A"), entries: fullEntries("js-A") });
    expect(!r.ok && r.issues.map((i) => `${i.category}:${i.code}`)).toEqual(["JUDGMENT_REQUIRED:JUDGMENT_STALE_FOR_EVIDENCE_RUN"]);
  });

  it("set de otro análisis o puntero a set no recibido → SYSTEM_ERROR", () => {
    expect(codes(resolveActiveJudgmentSet({ analysis: analysis(), set: set("js-A", { analysis_id: "an-2" }), entries: fullEntries("js-A") }))).toContain("JUDGMENT_SET_ANALYSIS_MISMATCH");
    expect(codes(resolveActiveJudgmentSet({ analysis: analysis(), set: set("js-B"), entries: [] }))).toEqual(["ACTIVE_JUDGMENT_SET_NOT_FOUND"]);
  });

  it("transiciones: un draft no se promueve; un completed no admite entradas; no se promueve dos veces", () => {
    expect(canTransition(set("x", { status: "draft" }), "promote").allowed).toBe(false);
    expect(canTransition(set("x", { status: "failed" }), "promote").allowed).toBe(false);
    expect(canTransition(set("x"), "add_entry").allowed).toBe(false);
    expect(canTransition(set("x", { promoted_at: "2026-01-01" }), "promote").allowed).toBe(false);
    expect(canTransition(set("x"), "promote").allowed).toBe(true);
  });
});

describe("judgment sets — frescura del structured input (ejecutar-calculo)", () => {
  const prov = { judgment_set_id: "js-A", evidence_run_id: "run-1", assumptions_source: "judgment_set", case: { expected_growth: 0 }, decisions: {} };
  it("legacy (sin puntero y sin provenance) → sin cambios", () => {
    expect(checkInputJudgmentFreshness({ active_judgment_set_id: null }, { expected_growth: 7 })).toEqual({ ok: true, mode: "legacy" });
  });
  it("input del set activo → crecimiento del input (0 es válido)", () => {
    const r = checkInputJudgmentFreshness(analysis(), { expected_growth: 0, judgment: prov });
    expect(r).toMatchObject({ ok: true, mode: "judgment_set", expectedGrowth: 0 });
  });
  it("input obsoleto: otro set, otro evidence run, sin provenance o provenance sin puntero → bloquea", () => {
    expect(checkInputJudgmentFreshness(analysis({ active_judgment_set_id: "js-B" }), { expected_growth: 0, judgment: prov })).toMatchObject({ ok: false, code: "STRUCTURED_INPUT_STALE_FOR_JUDGMENT" });
    expect(checkInputJudgmentFreshness(analysis({ active_evidence_run_id: "run-2" }), { expected_growth: 0, judgment: prov })).toMatchObject({ ok: false, code: "STRUCTURED_INPUT_STALE_FOR_JUDGMENT" });
    expect(checkInputJudgmentFreshness(analysis(), { expected_growth: 0 })).toMatchObject({ ok: false, code: "STRUCTURED_INPUT_STALE_FOR_JUDGMENT" });
    expect(checkInputJudgmentFreshness(analysis({ active_judgment_set_id: null }), { expected_growth: 0, judgment: prov })).toMatchObject({ ok: false });
  });
  it("growth del input distinto del congelado, o null → MALFORMED (nunca 25)", () => {
    expect(checkInputJudgmentFreshness(analysis(), { expected_growth: 25, judgment: prov })).toMatchObject({ ok: false, code: "STRUCTURED_INPUT_JUDGMENT_MALFORMED" });
    expect(checkInputJudgmentFreshness(analysis(), { expected_growth: null, judgment: prov })).toMatchObject({ ok: false, code: "STRUCTURED_INPUT_JUDGMENT_MALFORMED" });
  });
});

describe("readiness con judgment set activo", () => {
  const ev = ["revenue", "cost_of_sales", "opex", "da", "cash", "equity", "current_financial_debt", "long_term_financial_debt"].map((c) => ({ canonical_account: c, value: 10, period: "2024", evidence_run_id: "run-1" }));
  const exp = { companyName: "Acme", sector: "x", materialAccountsCount: 1, ambiguitiesCount: 1, treatedAmbiguitiesCount: 1 };
  const emptyCase = { moneda_analisis: "USD", validation_status: "aprobado" };
  it("set válido: el Judgment sale SOLO del set (las columnas vacías de analyses no bloquean)", () => {
    const resolution = resolveActiveJudgmentSet({ analysis: analysis(), set: set("js-A"), entries: fullEntries("js-A") });
    const r = evaluateCalculationReadiness({ analysis: emptyCase, activeAccounts: ev, basePeriod: "2024", resolvedAssumptions: null, minimumExpediente: exp, judgment: { mode: "judgment_set", resolution } });
    expect(r).toMatchObject({ readiness: "READY", blockers: [] });
  });
  it("set obsoleto o incompleto → bloqueos con su categoría; sin fallback a columnas ni a resolvedAssumptions", () => {
    const resolution = resolveActiveJudgmentSet({ analysis: analysis({ active_evidence_run_id: "run-2" }), set: set("js-A"), entries: fullEntries("js-A").slice(1) });
    const r = evaluateCalculationReadiness({ analysis: { ...emptyCase, expected_growth: 5 }, activeAccounts: ev, basePeriod: "2024", resolvedAssumptions: EXAMPLE_RESOLVED_ASSUMPTIONS, minimumExpediente: exp, judgment: { mode: "judgment_set", resolution } });
    expect(r.readiness).toBe("NOT_READY");
    expect(r.blockers.map((b) => b.code).sort()).toEqual(["JUDGMENT_KEY_MISSING", "JUDGMENT_STALE_FOR_EVIDENCE_RUN"]);
  });
});

describe("sin default de crecimiento en el camino de Judgment", () => {
  it("ningún archivo del camino usa 25 como fallback", () => {
    for (const f of ["judgment-sets.ts", "judgment-loader.ts", "structured-input-builder.ts", "calculation-readiness.ts", "../judgment-sets/index.ts", "../ejecutar-calculo/index.ts"]) {
      const code = readFileSync(join(__dirname, f), "utf8").split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*")).join("\n");
      expect(code, f).not.toMatch(/(\?\?|\|\|)\s*25\b|expected_growth\s*[:=]\s*25\b/);
    }
  });
});
