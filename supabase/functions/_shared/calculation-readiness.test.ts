import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateCalculationReadiness, type CalculationReadinessInput } from "./calculation-readiness";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";

const row = (canonical_account: string, value: number, evidence_run_id: string | null = "run-1") => ({ canonical_account, value, period: "2024", evidence_run_id });
const FULL_EVIDENCE = [row("revenue", 1000), row("cost_of_sales", 600), row("opex", 200), row("da", 50), row("cash", 100), row("equity", 500), row("current_financial_debt", 30), row("long_term_financial_debt", 70)];
const FULL_CASE = { valuation_date: "2024-12-31", basis_of_value: "Market Value", valued_interest: "100% equity", calculation_architecture: "DCF", moneda_analisis: "USD", expected_growth: 5, validation_status: "aprobado" };
const base = (over: Partial<CalculationReadinessInput> = {}): CalculationReadinessInput => ({
  analysis: FULL_CASE, activeAccounts: FULL_EVIDENCE, basePeriod: "2024", resolvedAssumptions: EXAMPLE_RESOLVED_ASSUMPTIONS, ...over,
});
const cats = (r: ReturnType<typeof evaluateCalculationReadiness>) => r.blockers.map((b) => `${b.category}:${b.field}`);

describe("calculation readiness — Evidence validada no implica listo para calcular", () => {
  it("todo resuelto → READY, sin bloqueos", () => {
    const r = evaluateCalculationReadiness(base());
    expect(r).toMatchObject({ readiness: "READY", scope: "calculation_readiness", blockers: [] });
  });

  it("Evidence aprobada + Judgment faltante → NOT_READY con JUDGMENT_REQUIRED (incluida la fecha de valoración y el growth)", () => {
    const r = evaluateCalculationReadiness(base({ analysis: { ...FULL_CASE, valuation_date: null, expected_growth: null }, resolvedAssumptions: null }));
    expect(r.readiness).toBe("NOT_READY");
    expect(cats(r)).toEqual(expect.arrayContaining(["JUDGMENT_REQUIRED:valuation_date", "JUDGMENT_REQUIRED:expected_growth", "JUDGMENT_REQUIRED:taxTreatment", "JUDGMENT_REQUIRED:terminalG"]));
    expect(r.counts.JUDGMENT_REQUIRED).toBe(2 + 13);
    expect(r.counts.MISSING_EVIDENCE).toBe(0);
  });

  it("growth 0 es Judgment resuelto (no bloquea)", () => {
    expect(cats(evaluateCalculationReadiness(base({ analysis: { ...FULL_CASE, expected_growth: 0 } })))).not.toContain("JUDGMENT_REQUIRED:expected_growth");
  });

  it("Evidence faltante → MISSING_EVIDENCE (nunca se rellena)", () => {
    const r = evaluateCalculationReadiness(base({ activeAccounts: FULL_EVIDENCE.filter((x) => x.canonical_account !== "da" && x.canonical_account !== "cash") }));
    expect(r.readiness).toBe("NOT_READY");
    expect(cats(r)).toEqual(["MISSING_EVIDENCE:da", "MISSING_EVIDENCE:cash"]);
  });

  it("decisión metodológica pendiente declarada → METHODOLOGY_DECISION_REQUIRED (no MISSING_EVIDENCE)", () => {
    const r = evaluateCalculationReadiness(base({
      activeAccounts: FULL_EVIDENCE.filter((x) => x.canonical_account !== "da"),
      methodologyDecisionsPending: [{ field: "da", decision: "D&A solo observada en el flujo de caja." }, { field: "ev_equity_bridge", decision: "Asociadas materiales." }],
    }));
    expect(cats(r)).toEqual(["METHODOLOGY_DECISION_REQUIRED:da", "METHODOLOGY_DECISION_REQUIRED:ev_equity_bridge"]);
  });

  it("Evidence no validada, sin Evidence o sin período base → MISSING_EVIDENCE", () => {
    expect(cats(evaluateCalculationReadiness(base({ analysis: { ...FULL_CASE, validation_status: "bloqueado" } })))).toEqual(["MISSING_EVIDENCE:validation_status"]);
    expect(cats(evaluateCalculationReadiness(base({ activeAccounts: [] })))).toEqual(["MISSING_EVIDENCE:account_homologations"]);
    expect(cats(evaluateCalculationReadiness(base({ basePeriod: null })))).toEqual(["MISSING_EVIDENCE:base_period"]);
  });

  it("filas de dos evidence runs → SYSTEM_ERROR (no se suman)", () => {
    const r = evaluateCalculationReadiness(base({ activeAccounts: [...FULL_EVIDENCE, row("revenue", 999, null)] }));
    expect(cats(r)).toEqual(["SYSTEM_ERROR:account_homologations"]);
  });

  it("es pura: no calcula, no escribe, no muta su input", () => {
    const src = readFileSync(join(__dirname, "calculation-readiness.ts"), "utf8");
    expect(src).not.toMatch(/runCanonicalFinancialEngine|createClient|\.from\(|fetch\(/);
    const input = base({ analysis: { ...FULL_CASE, valuation_date: null } });
    const before = JSON.stringify(input);
    evaluateCalculationReadiness(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
