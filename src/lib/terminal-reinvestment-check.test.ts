// TERMINAL REINVESTMENT CHECK: validación determinística sobre el cálculo
// persistido. Las entradas salen del motor canónico real sobre el fixture
// congelado de Alpina (no de números escritos a mano).
import { describe, it, expect } from "vitest";
import { runCanonicalFinancialEngine } from "../../supabase/functions/_shared/canonical-financial-engine";
import { ALPINA_2024_STRUCTURED_INPUT } from "../../supabase/functions/_shared/alpina-2024.structured-input";
import { buildResolvedAssumptionsSnapshot } from "../../supabase/functions/_shared/resolved-assumptions-snapshot";
import { parseDocumentedRoc, terminalReinvestmentCheck } from "./terminal-reinvestment-check";

const result = runCanonicalFinancialEngine(ALPINA_2024_STRUCTURED_INPUT, "Alimentos y bebidas", 3);
const cr = { projections: result.projections, resolved_assumptions_used: buildResolvedAssumptionsSnapshot(ALPINA_2024_STRUCTURED_INPUT.resolved_assumptions) };

describe("terminalReinvestmentCheck", () => {
  it("Alpina Y5: Net Reinvestment / NOPAT ≈ g/ROC (3% / 24%) → PASS", () => {
    const c = terminalReinvestmentCheck(cr);
    const y5 = result.projections[4];
    expect(c.status).toBe("PASS");
    expect(c.year).toBe(5);
    expect(c.netReinvestment).toBe(y5.capex - y5.depreciation + y5.deltaWC);
    expect(c.reinvestmentRate).toBeCloseTo(0.125, 6);
    expect(c.gOverRoc).toBe(3 / 24);
    expect(c.rocRangePct).toEqual([23.5, 24.5]);
    expect(c.impliedRocPct).toBeCloseTo(24, 4);
    // Insumos = los del cálculo (CAPEX del path explícito resuelto, D&A/NOPAT del motor).
    expect(c.capex).toBe(ALPINA_2024_STRUCTURED_INPUT.resolved_assumptions!.capexReinvestmentDriver.value.explicitPath!.at(-1));
  });

  it("el ROC sale del rationale documentado, no de una constante", () => {
    expect(parseDocumentedRoc(cr.resolved_assumptions_used!.terminalG.rationale)).toEqual({ rocPct: 24, range: [23.5, 24.5] });
    expect(parseDocumentedRoc("sin diagnóstico")).toBeNull();
  });

  it("FAIL si la reinversión terminal sale de la banda g/ROC documentada", () => {
    const projections = result.projections.map((p, i) => (i === 4 ? { ...p, capex: p.capex * 1.5 } : p));
    expect(terminalReinvestmentCheck({ ...cr, projections }).status).toBe("FAIL");
  });

  it("NOT_AVAILABLE sin cálculo, sin g resuelto o sin ROC documentado", () => {
    expect(terminalReinvestmentCheck(null).status).toBe("NOT_AVAILABLE");
    expect(terminalReinvestmentCheck({ projections: result.projections, resolved_assumptions_used: null }).status).toBe("NOT_AVAILABLE");
    expect(terminalReinvestmentCheck({ projections: result.projections, resolved_assumptions_used: { terminalG: { value: { valuePct: 3 }, rationale: "sin ROC" } } }).status).toBe("NOT_AVAILABLE");
  });
});
