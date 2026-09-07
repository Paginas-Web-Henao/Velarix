// Velarix v5 — FASE 4F.3. Congela estructuralmente
// `ALPINA_2024_RESOLVED_ASSUMPTIONS` (alpina-2024.resolved-assumptions.ts)
// contra el contrato real post-RC-5. Esto NO es 4F.4 — no se invoca
// `evaluateCalculationPreflight` aquí (gate formal separado, deliberado).
// Estas son verificaciones de forma/trazabilidad/no-fabricación sobre el
// objeto en sí, no una corrida de preflight ni del motor.

import { describe, it, expect } from "vitest";
import { REQUIRED_RESOLVED_ASSUMPTION_KEYS, type ResolvedAssumptionEntry } from "./resolved-calculation-assumptions";
import { ALPINA_2024_RESOLVED_ASSUMPTIONS as A } from "./alpina-2024.resolved-assumptions";

/** Fillers genéricos explícitamente prohibidos (04 §16 — trazabilidad honesta, no aparentada). */
const FORBIDDEN_FILLERS = ["4e", "profesor", "approved assumption", "historical data", "n/a", "tbd", "todo"];

function collectAllNumbers(value: unknown, out: number[] = []): number[] {
  if (typeof value === "number") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectAllNumbers(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectAllNumbers(v, out));
  return out;
}

describe("Alpina 2024 — ResolvedCalculationAssumptions (4F.3, forma y trazabilidad)", () => {
  it("declara exactamente las 13 keys requeridas, en el orden canónico", () => {
    expect(Object.keys(A).sort()).toEqual([...REQUIRED_RESOLVED_ASSUMPTION_KEYS].sort());
    expect(Object.keys(A)).toHaveLength(13);
  });

  it("las 13 entradas declaran status='resolved', source y rationale no vacíos", () => {
    for (const key of REQUIRED_RESOLVED_ASSUMPTION_KEYS) {
      const entry = A[key] as ResolvedAssumptionEntry<unknown>;
      expect(entry.status).toBe("resolved");
      expect(entry.source.trim().length).toBeGreaterThan(20); // filler real, no un string vacío ni trivial
      expect(entry.rationale.trim().length).toBeGreaterThan(20);
    }
  });

  it("ningún source/rationale contiene un filler genérico prohibido", () => {
    for (const key of REQUIRED_RESOLVED_ASSUMPTION_KEYS) {
      const entry = A[key] as ResolvedAssumptionEntry<unknown>;
      const sourceLower = entry.source.toLowerCase();
      const rationaleLower = entry.rationale.toLowerCase();
      for (const filler of FORBIDDEN_FILLERS) {
        expect(sourceLower).not.toBe(filler);
        expect(sourceLower.split(/\s+/)).not.toContain(filler);
        expect(rationaleLower).not.toBe(filler);
      }
    }
  });

  it("ningún valor numérico en todo el objeto es NaN o Infinity", () => {
    const numbers = collectAllNumbers(A);
    expect(numbers.length).toBeGreaterThan(0);
    for (const n of numbers) {
      expect(Number.isFinite(n)).toBe(true);
    }
  });

  it("capitalStructure: pesos suman 1 y structureSource es 'comparables' (no 'target')", () => {
    const cs = A.capitalStructure.value;
    expect(cs.equityWeight + cs.debtWeight).toBeCloseTo(1, 9);
    expect(cs.structureSource).toBe("comparables");
    expect(cs).not.toHaveProperty("bookEquityReference");
  });

  it("countryRiskLambda: mode='direct_documented_judgment', value=1, SIN porcentajes fabricados", () => {
    const lambda = A.countryRiskLambda.value;
    expect(lambda.mode).toBe("direct_documented_judgment");
    expect(lambda.value).toBe(1);
    expect(lambda).not.toHaveProperty("domesticRevenuePctCompany");
    expect(lambda).not.toHaveProperty("domesticRevenuePctMarketAvg");
    expect(Object.keys(lambda).sort()).toEqual(["mode", "value"]);
  });

  it("betaTreatment: NO transporta leveredBeta — Calculation debe derivarlo vía Hamada, no un cross-check hardcodeado", () => {
    const beta = A.betaTreatment.value;
    expect(beta).not.toHaveProperty("leveredBeta");
    expect(beta.releveringMethod).toBe("hamada");
    expect(beta.unleveredBeta).toBe(0.6515519);
  });

  it("taxTreatment: explicitFcffTaxRatePctByYear tiene longitud 5, igual a projectionHorizonYears", () => {
    expect(A.taxTreatment.value.explicitFcffTaxRatePctByYear).toHaveLength(5);
    expect(A.projectionHorizonYears.value.years).toBe(5);
  });

  it("capexReinvestmentDriver: mode='explicit_path', longitud 5, NO revive el candidato superseded ≈2.82% de ingresos", () => {
    const capex = A.capexReinvestmentDriver.value;
    expect(capex.mode).toBe("explicit_path");
    if (capex.mode === "explicit_path") {
      expect(capex.explicitPath).toHaveLength(5);
      expect(capex).not.toHaveProperty("capexPctOfRevenue");
    }
  });

  it("depreciationDaDriver: mode='percent_of_revenue' ≈4.2%, NO revive el candidato superseded 3.2%", () => {
    const da = A.depreciationDaDriver.value;
    expect(da.mode).toBe("percent_of_revenue");
    if (da.mode === "percent_of_revenue") {
      expect(da.daPctOfRevenue).toBe(4.2);
      expect(da.daPctOfRevenue).not.toBe(3.2);
    }
  });

  it("workingCapitalDriver: explicitDeltaNwcByYear tiene longitud 5", () => {
    expect(A.workingCapitalDriver.value.explicitDeltaNwcByYear).toHaveLength(5);
  });

  it("riskFreeRateConstruction: Fisher exacto, NO revive candidatos superseded ≈6.7–6.9%", () => {
    const rf = A.riskFreeRateConstruction.value;
    expect(rf.localRatePct).toBeCloseTo(5.6052941176, 9);
    expect(rf.localRatePct).toBeLessThan(6.7);
    expect(rf.inflationDifferentialPct).toBeCloseTo(0.9803921569, 9);
  });

  it("costOfDebt: ≈11.79% fallback_documented, NO revive el candidato superseded 12.65% bank-only", () => {
    const kd = A.costOfDebt.value;
    expect(kd.valuePct).toBe(11.79);
    expect(kd.valuePct).not.toBe(12.65);
    expect(kd.hierarchy).toBe("fallback_documented");
    expect(A.costOfDebt.rationale.toLowerCase()).toContain("historical_implied_fallback");
  });

  it("terminalG: base 3.0%, escenarios 2.5%/3.5% derivados del base (04 §11.2) — ROC no vive en este value", () => {
    const g = A.terminalG.value;
    expect(g.valuePct).toBe(3.0);
    expect(g.pessimisticScenarioPct).toBeLessThan(g.valuePct);
    expect(g.optimisticScenarioPct).toBeGreaterThan(g.valuePct);
    expect(g).not.toHaveProperty("roc");
    expect(g).not.toHaveProperty("stableRoc");
  });
});
