// `analyses.expected_growth` es Judgment: null/undefined = no resuelto
// (falla cerrado), 0 = crecimiento cero explícito. Nunca un 25 por defecto.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveEffectiveGrowth, isResolvedGrowth, UnresolvedGrowthError } from "./canonical-input-normalization";
import { runCanonicalFinancialEngine } from "./canonical-financial-engine";
import { evaluateCalculationPreflight } from "./calculation-preflight";
import { buildCanonicalStructuredInput } from "./structured-input-builder";
import { CASO_A_ESTABLE_SERVIDOR as A } from "./canonical-financial-engine.golden-cases.fixtures";

describe("resolveEffectiveGrowth — null-aware, sin fallback", () => {
  it("null, undefined y no finitos permanecen sin resolver (excepción explícita)", () => {
    for (const v of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(isResolvedGrowth(v)).toBe(false);
      expect(() => resolveEffectiveGrowth(v as number | null | undefined)).toThrow(UnresolvedGrowthError);
    }
  });
  it("0 permanece 0; 5 permanece 5; negativos se respetan", () => {
    expect(resolveEffectiveGrowth(0)).toBe(0);
    expect(resolveEffectiveGrowth(5)).toBe(5);
    expect(resolveEffectiveGrowth(-2)).toBe(-2);
  });
  it("ningún consumidor del servidor conserva el fallback a 25", () => {
    const root = join(__dirname, "..");
    for (const f of ["build-structured-input/index.ts", "continuar-tras-revision/index.ts", "ejecutar-calculo/index.ts", "_shared/canonical-input-normalization.ts", "_shared/calculation-fingerprint.ts", "_shared/structured-input-builder.ts"]) {
      const code = readFileSync(join(root, f), "utf8").split("\n").filter((l) => !/^\s*(\/\/|\/?\*)/.test(l)).join("\n");
      expect(code, f).not.toMatch(/(\|\||\?\?)\s*25\b/);
    }
  });
});

describe("motor y preflight", () => {
  it("el motor falla cerrado sin crecimiento resuelto y respeta 0 (proyección sin crecimiento)", () => {
    expect(() => runCanonicalFinancialEngine(A.input, A.sector, null)).toThrow(UnresolvedGrowthError);
    const zero = runCanonicalFinancialEngine(A.input, A.sector, 0);
    expect(zero.projections[4].revenue).toBeCloseTo(zero.projections[0].revenue, 6);
  });
  it("los golden cases con growth explícito no cambian", () => {
    const r = runCanonicalFinancialEngine(A.input, A.sector, A.expectedGrowth);
    expect(r.projections[0].revenue).toBeCloseTo((A.input.income_statement.revenue as number) * (1 + A.expectedGrowth / 100), 6);
  });
  it("el preflight bloquea con JUDGMENT_REQUIRED si expected_growth no está resuelto; 0 no bloquea por growth", () => {
    const is = { revenue: 1, cost_of_sales: 1, opex: 1, da: 1 };
    const bs = { cash: 1, equity: 1, financial_debt_total: 1 };
    const unresolved = evaluateCalculationPreflight({ incomeStatement: is, balanceSheet: bs, resolvedAssumptions: null, expectedGrowth: null });
    expect(unresolved.passed).toBe(false);
    expect(unresolved.unresolved_judgments).toEqual(["expected_growth"]);
    expect(unresolved.blockers.some((b) => b.startsWith("JUDGMENT_REQUIRED") && b.includes("expected_growth"))).toBe(true);
    expect(evaluateCalculationPreflight({ incomeStatement: is, balanceSheet: bs, expectedGrowth: 0 }).unresolved_judgments).toEqual([]);
  });
});

describe("structured input: el crecimiento sin resolver queda explícito, no se rellena", () => {
  const build = (expectedGrowth: number | null) => buildCanonicalStructuredInput({
    analysisId: "a", sector: "Manufactura", expectedGrowth,
    accounts: [{ id: "r", document_id: "d", canonical_account: "revenue", period: "2024", value: 100 }],
    basePeriod: "2024", periods: ["2024"], periodSelectionMode: "single_explicit",
    monedaAnalisis: "USD", monedaDocumento: "USD", scaleFactor: 1000, exchangeRate: 4000,
    snapshot: { id: null, data_payload: {}, macro_payload: {} }, structuredInputId: "s", createdAt: "2026-01-01T00:00:00.000Z",
  });
  it("null → expected_growth null y quality flag; nunca 25", () => {
    const si = build(null) as unknown as { expected_growth: number | null; quality_flags: string[] };
    expect(si.expected_growth).toBeNull();
    expect(si.quality_flags).toContain("expected_growth_no_resuelto");
  });
  it("0 → 0, sin quality flag", () => {
    const si = build(0) as unknown as { expected_growth: number | null; quality_flags: string[] };
    expect(si.expected_growth).toBe(0);
    expect(si.quality_flags).not.toContain("expected_growth_no_resuelto");
  });
});
