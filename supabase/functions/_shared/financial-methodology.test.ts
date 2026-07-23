// Bloque 1B-M — Prueba de consistencia del contrato de supuestos
// financieros. Importa exactamente el mismo objeto
// (`CANONICAL_METHODOLOGY`) que usa `ejecutar-calculo/index.ts`.

import { describe, it, expect } from "vitest";
import { CANONICAL_METHODOLOGY, type FinancialAssumption } from "./financial-methodology";

const ALL_ASSUMPTIONS = Object.values(CANONICAL_METHODOLOGY.assumptions) as FinancialAssumption[];

describe("CANONICAL_METHODOLOGY — consistencia del contrato de supuestos", () => {
  it("declara una versión de metodología no vacía", () => {
    expect(CANONICAL_METHODOLOGY.methodologyVersion).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("los 8 supuestos existen y tienen un valor numérico finito", () => {
    expect(ALL_ASSUMPTIONS).toHaveLength(8);
    for (const a of ALL_ASSUMPTIONS) {
      expect(Number.isFinite(a.value)).toBe(true);
    }
  });

  it("ningún supuesto se declara aprobado todavía (son provisionales)", () => {
    for (const a of ALL_ASSUMPTIONS) {
      expect(a.approved).toBe(false);
    }
  });

  it("ningún supuesto es editable por input hoy (coincide con el comportamiento real del servidor)", () => {
    for (const a of ALL_ASSUMPTIONS) {
      expect(a.editableByInput).toBe(false);
    }
  });

  it("cada supuesto declara una unidad, una fuente y una fecha de vigencia", () => {
    for (const a of ALL_ASSUMPTIONS) {
      expect(a.unit).toBeTruthy();
      expect(a.sourceDescription.length).toBeGreaterThan(0);
      expect(a.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("cada supuesto no aprobado declara un motivo de fallback", () => {
    for (const a of ALL_ASSUMPTIONS) {
      if (!a.approved) expect(a.fallbackReason.length).toBeGreaterThan(0);
    }
  });

  it("los valores coinciden exactamente con los literales históricos conocidos (ningún número nuevo)", () => {
    expect(CANONICAL_METHODOLOGY.assumptions.taxRatePct.value).toBe(30);
    expect(CANONICAL_METHODOLOGY.assumptions.capexPctOfRevenue.value).toBe(5);
    expect(CANONICAL_METHODOLOGY.assumptions.workingCapitalPctOfRevenue.value).toBe(3);
    expect(CANONICAL_METHODOLOGY.assumptions.terminalGrowthPct.value).toBe(3);
    expect(CANONICAL_METHODOLOGY.assumptions.costOfDebtPct.value).toBe(8);
    expect(CANONICAL_METHODOLOGY.assumptions.riskFreeRatePct.value).toBe(4.35);
    expect(CANONICAL_METHODOLOGY.assumptions.equityRiskPremiumPct.value).toBe(5.80);
    expect(CANONICAL_METHODOLOGY.assumptions.depreciationPctOfRevenue.value).toBe(3);
  });

  it("declara al menos una advertencia global sobre la falta de aprobación y de editabilidad", () => {
    expect(CANONICAL_METHODOLOGY.globalWarnings.length).toBeGreaterThan(0);
  });
});
