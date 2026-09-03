// Bloque 3B — Pruebas de forma del contrato `ResolvedCalculationAssumptions`.
// No hay producción que ejercitar aquí — este archivo solo verifica que
// el contrato de tipos (resolved-calculation-assumptions.ts) representa
// exactamente los 13 puntos congelados en
// docs/velarix-v5/05-financial-engine-audit.md v1.3 §6, y que "Judgment,
// no approvals" se cumple en la forma del contrato (sin campos de
// aprobación/rol/workflow). Todas estas pruebas deben estar VERDES —
// no dependen de ningún comportamiento productivo todavía sin construir.

import { describe, it, expect } from "vitest";
import {
  REQUIRED_RESOLVED_ASSUMPTION_KEYS,
  MOTOR_SUPPORTED_PROJECTION_HORIZON_YEARS,
  type ResolvedAssumptionEntry,
} from "./resolved-calculation-assumptions";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";

describe("ResolvedCalculationAssumptions — forma del contrato", () => {
  it("declara exactamente 13 campos requeridos, en el orden de 05 v1.3 §6", () => {
    expect(REQUIRED_RESOLVED_ASSUMPTION_KEYS).toHaveLength(13);
    expect([...REQUIRED_RESOLVED_ASSUMPTION_KEYS]).toEqual([
      "taxTreatment",
      "capitalStructure",
      "riskFreeRateConstruction",
      "matureErp",
      "countryRiskPremium",
      "countryRiskLambda",
      "betaTreatment",
      "costOfDebt",
      "capexReinvestmentDriver",
      "depreciationDaDriver",
      "workingCapitalDriver",
      "terminalG",
      "projectionHorizonYears",
    ]);
  });

  it("cada campo requerido existe en un ejemplo completo y válido", () => {
    for (const key of REQUIRED_RESOLVED_ASSUMPTION_KEYS) {
      expect(EXAMPLE_RESOLVED_ASSUMPTIONS[key]).toBeDefined();
    }
  });

  it("cada entrada resuelta declara status literal 'resolved' — nunca 'approved' ni ningún otro estado", () => {
    for (const key of REQUIRED_RESOLVED_ASSUMPTION_KEYS) {
      const entry = EXAMPLE_RESOLVED_ASSUMPTIONS[key] as ResolvedAssumptionEntry<unknown>;
      expect(entry.status).toBe("resolved");
      expect(entry).not.toHaveProperty("approved");
      expect(entry).not.toHaveProperty("approvedBy");
      expect(entry).not.toHaveProperty("reviewer");
      expect(entry).not.toHaveProperty("role");
    }
  });

  it("cada entrada resuelta declara source y rationale no vacíos (04 §16)", () => {
    for (const key of REQUIRED_RESOLVED_ASSUMPTION_KEYS) {
      const entry = EXAMPLE_RESOLVED_ASSUMPTIONS[key] as ResolvedAssumptionEntry<unknown>;
      expect(entry.source.length).toBeGreaterThan(0);
      expect(entry.rationale.length).toBeGreaterThan(0);
    }
  });

  it("capitalStructure NO transporta book equity — es Judgment puro (weights + fuente), book equity es Evidence y vive en structured_input.balance_sheet.equity (Bloque 3B.1)", () => {
    const cs = EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure.value;
    expect(cs).not.toHaveProperty("bookEquityReference");
    expect(cs.structureSource).toBe("comparables");
    expect(cs.equityWeight + cs.debtWeight).toBeCloseTo(1, 6);
    expect(Object.keys(cs).sort()).toEqual(["debtWeight", "equityWeight", "structureSource"]);
  });

  it("taxTreatment separa marginal/explicit-path/debt-tax-shield — las tres tasas son distintas y no deben colapsarse (04 §6.3/§6.4/§10.6, Bloque 3B.2)", () => {
    const tax = EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value;
    expect(Array.isArray(tax.explicitFcffTaxRatePctByYear)).toBe(true);
    expect(typeof tax.marginalRatePct).toBe("number");
    expect(typeof tax.debtTaxShieldRatePct).toBe("number");
    // Deliberadamente distintas en el fixture — si coincidieran, un bug de colapso pasaría desapercibido.
    expect(tax.debtTaxShieldRatePct).not.toBe(tax.marginalRatePct);
    expect(tax.explicitFcffTaxRatePctByYear.every((v) => v !== tax.marginalRatePct)).toBe(false); // el último año SÍ converge a la marginal, por diseño
    expect(tax.explicitFcffTaxRatePctByYear[0]).not.toBe(tax.marginalRatePct);
    expect(tax.explicitFcffTaxRatePctByYear[0]).not.toBe(tax.debtTaxShieldRatePct);
  });

  it("explicitFcffTaxRatePctByYear tiene exactamente la misma longitud que projectionHorizonYears resuelto", () => {
    const tax = EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value;
    const horizon = EXAMPLE_RESOLVED_ASSUMPTIONS.projectionHorizonYears.value.years;
    expect(tax.explicitFcffTaxRatePctByYear).toHaveLength(horizon);
  });

  it("betaTreatment NO transporta leveredBeta — es Calculation, se recompone vía Hamada a partir de unleveredBeta + capitalStructure + taxTreatment (Bloque 3B.1)", () => {
    const beta = EXAMPLE_RESOLVED_ASSUMPTIONS.betaTreatment.value;
    expect(beta).not.toHaveProperty("leveredBeta");
    expect(beta.releveringMethod).toBe("hamada");
    expect(typeof beta.unleveredBeta).toBe("number");
  });

  it("capexReinvestmentDriver es una unión discriminada por 'mode' — nunca coexisten percent_of_revenue y explicit_path (Bloque 3B.1)", () => {
    const capex = EXAMPLE_RESOLVED_ASSUMPTIONS.capexReinvestmentDriver.value;
    expect(["percent_of_revenue", "explicit_path"]).toContain(capex.mode);
    if (capex.mode === "percent_of_revenue") {
      expect(capex).not.toHaveProperty("explicitPath");
    } else {
      expect(capex).not.toHaveProperty("capexPctOfRevenue");
    }
  });

  it("depreciationDaDriver es una unión discriminada por 'mode' — mismo principio que capexReinvestmentDriver (Bloque 3B.1)", () => {
    const da = EXAMPLE_RESOLVED_ASSUMPTIONS.depreciationDaDriver.value;
    expect(["percent_of_revenue", "explicit_path"]).toContain(da.mode);
    if (da.mode === "percent_of_revenue") {
      expect(da).not.toHaveProperty("explicitPath");
    } else {
      expect(da).not.toHaveProperty("daPctOfRevenue");
    }
  });

  it("workingCapitalDriver transporta explicitDeltaNwcByYear, no un wcPct/ratio (05 v1.3 §3)", () => {
    const wc = EXAMPLE_RESOLVED_ASSUMPTIONS.workingCapitalDriver.value;
    expect(Array.isArray(wc.explicitDeltaNwcByYear)).toBe(true);
    expect(wc).not.toHaveProperty("wcPct");
    expect(wc).not.toHaveProperty("nwcToRevenueRatio");
  });

  it("projectionHorizonYears puede resolverse en 5 mientras el motor solo soporte 5 (05 v1.3 §5)", () => {
    expect(EXAMPLE_RESOLVED_ASSUMPTIONS.projectionHorizonYears.value.years).toBe(MOTOR_SUPPORTED_PROJECTION_HORIZON_YEARS);
  });

  it("terminalG documenta explícitamente los g de escenario derivados del g base — nunca literales sin relación declarada (04 §11.2)", () => {
    const g = EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value;
    expect(g.pessimisticScenarioPct).toBeLessThan(g.valuePct);
    expect(g.optimisticScenarioPct).toBeGreaterThan(g.valuePct);
  });
});
