// Calculation Preflight — pruebas del evaluador puro. Ver
// calculation-preflight.ts para la evidencia completa de la auditoría que
// motivó este módulo (canonical-input-normalization.ts/capital-structure.ts
// convertían ausencia en 0; financial-methodology.ts tiene 8 supuestos
// approved:false; el horizonte de 5 años no tiene ninguna metadata).

import { describe, it, expect } from "vitest";
import { evaluateCalculationPreflight } from "./calculation-preflight";
import { CANONICAL_METHODOLOGY } from "./financial-methodology";

const COMPLETE_INCOME_STATEMENT = { revenue: 1_200_000, cost_of_sales: 700_000, opex: 220_000, da: 50_000 };
const COMPLETE_BALANCE_SHEET = { cash: 300_000, equity: 900_000, financial_debt_total: 100_000 };

describe("evaluateCalculationPreflight — completitud de inputs", () => {
  it("1. inputs completos, pero methodology sigue sin aprobación real hoy -> passed sigue en false (NO se puede construir un PASS real con el modelo actual — ver limitación documentada abajo)", () => {
    const r = evaluateCalculationPreflight({ incomeStatement: COMPLETE_INCOME_STATEMENT, balanceSheet: COMPLETE_BALANCE_SHEET });
    expect(r.missing_inputs).toEqual([]);
    expect(r.passed).toBe(false); // bloqueado únicamente por METHODOLOGY_APPROVAL_REQUIRED, no por INPUT_MISSING
    expect(r.unapproved_assumptions.length).toBeGreaterThan(0);
  });

  it("2. da ausente -> FAIL input (missing_inputs contiene 'da')", () => {
    const r = evaluateCalculationPreflight({
      incomeStatement: { ...COMPLETE_INCOME_STATEMENT, da: null },
      balanceSheet: COMPLETE_BALANCE_SHEET,
    });
    expect(r.missing_inputs).toContain("da");
    expect(r.passed).toBe(false);
  });

  it("da ausente pero 'depreciation' (nombre alterno) observado -> NO cuenta como missing (mismo fallback que el motor: da || depreciation)", () => {
    const r = evaluateCalculationPreflight({
      incomeStatement: { ...COMPLETE_INCOME_STATEMENT, da: null, depreciation: 40_000 },
      balanceSheet: COMPLETE_BALANCE_SHEET,
    });
    expect(r.missing_inputs).not.toContain("da");
  });

  it("3. equity ausente -> FAIL input (missing_inputs contiene 'equity')", () => {
    const r = evaluateCalculationPreflight({
      incomeStatement: COMPLETE_INCOME_STATEMENT,
      balanceSheet: { ...COMPLETE_BALANCE_SHEET, equity: null },
    });
    expect(r.missing_inputs).toContain("equity");
  });

  it("4. financial_debt_total ausente -> FAIL input", () => {
    const r = evaluateCalculationPreflight({
      incomeStatement: COMPLETE_INCOME_STATEMENT,
      balanceSheet: { ...COMPLETE_BALANCE_SHEET, financial_debt_total: null },
    });
    expect(r.missing_inputs).toContain("financial_debt_total");
  });

  it("5. cero OBSERVADO no se confunde con missing (da=0, equity=0, financial_debt_total=0, cash=0 son datos reales)", () => {
    const r = evaluateCalculationPreflight({
      incomeStatement: { ...COMPLETE_INCOME_STATEMENT, da: 0 },
      balanceSheet: { cash: 0, equity: 0, financial_debt_total: 0 },
    });
    expect(r.missing_inputs).toEqual([]);
  });

  it("6. múltiples campos ausentes -> lista completa y determinística (fixture remoto real: da, interest_expense no material, equity, financial_debt_total)", () => {
    const r = evaluateCalculationPreflight({
      incomeStatement: { revenue: 1_200_000, cost_of_sales: 700_000, opex: 220_000, da: null },
      balanceSheet: { cash: 300_000, equity: null, financial_debt_total: null },
    });
    expect(r.missing_inputs.sort()).toEqual(["da", "equity", "financial_debt_total"]);
  });

  it("interest_expense ausente NO bloquea — verificado que solo alimenta KPIs (netMargin/interestCoverage), nunca enterpriseValue/wacc/equityValue", () => {
    const r = evaluateCalculationPreflight({
      incomeStatement: { ...COMPLETE_INCOME_STATEMENT, interest_expense: null },
      balanceSheet: COMPLETE_BALANCE_SHEET,
    });
    expect(r.missing_inputs).not.toContain("interest_expense");
  });

  it("revenue/cost_of_sales/opex ausentes también bloquean (base de ebitda0/ebitdaMargin que alimenta las 5 proyecciones)", () => {
    const r = evaluateCalculationPreflight({ incomeStatement: {}, balanceSheet: COMPLETE_BALANCE_SHEET });
    expect(r.missing_inputs).toEqual(expect.arrayContaining(["revenue", "cost_of_sales", "opex", "da"]));
  });

  it("incomeStatement/balanceSheet null o undefined no lanzan — se tratan como todo ausente", () => {
    const r = evaluateCalculationPreflight({ incomeStatement: null, balanceSheet: undefined });
    expect(r.missing_inputs.length).toBeGreaterThan(0);
    expect(r.passed).toBe(false);
  });
});

describe("evaluateCalculationPreflight — aprobación de metodología (reutiliza CANONICAL_METHODOLOGY, no inventa una lista)", () => {
  it("7. los 8 supuestos con approved:false en CANONICAL_METHODOLOGY aparecen en unapproved_assumptions (fuente reutilizada, no reimplementada)", () => {
    const r = evaluateCalculationPreflight({ incomeStatement: COMPLETE_INCOME_STATEMENT, balanceSheet: COMPLETE_BALANCE_SHEET });
    const trackedKeys = Object.keys(CANONICAL_METHODOLOGY.assumptions);
    expect(trackedKeys.every((k) => r.unapproved_assumptions.includes(k))).toBe(true);
  });

  it("8. lista completa: exactamente los 8 supuestos rastreados + el horizonte (untracked) = 9 entradas", () => {
    const r = evaluateCalculationPreflight({ incomeStatement: COMPLETE_INCOME_STATEMENT, balanceSheet: COMPLETE_BALANCE_SHEET });
    expect(r.unapproved_assumptions).toHaveLength(9);
    expect(r.unapproved_assumptions).toContain("projection_horizon_years");
  });

  it("el horizonte de 5 años se reporta explícitamente aunque no exista en CANONICAL_METHODOLOGY.assumptions — no se le inventa una entrada ahí, se bloquea aquí con su propia razón", () => {
    expect(Object.keys(CANONICAL_METHODOLOGY.assumptions)).not.toContain("projection_horizon_years");
    const r = evaluateCalculationPreflight({ incomeStatement: COMPLETE_INCOME_STATEMENT, balanceSheet: COMPLETE_BALANCE_SHEET });
    expect(r.blockers.some((b) => b.includes("METHODOLOGY_APPROVAL_REQUIRED") && b.includes("projection_horizon_years"))).toBe(true);
  });

  it("blockers distingue explícitamente INPUT_MISSING de METHODOLOGY_APPROVAL_REQUIRED — nunca un mensaje ambiguo que mezcle ambas causas", () => {
    const r = evaluateCalculationPreflight({
      incomeStatement: { ...COMPLETE_INCOME_STATEMENT, da: null },
      balanceSheet: COMPLETE_BALANCE_SHEET,
    });
    const inputBlockers = r.blockers.filter((b) => b.startsWith("INPUT_MISSING:"));
    const methodologyBlockers = r.blockers.filter((b) => b.startsWith("METHODOLOGY_APPROVAL_REQUIRED:"));
    expect(inputBlockers).toHaveLength(1);
    expect(methodologyBlockers).toHaveLength(9);
    expect(inputBlockers[0]).not.toMatch(/METHODOLOGY_APPROVAL_REQUIRED/);
    expect(methodologyBlockers.every((b) => !b.includes("INPUT_MISSING"))).toBe(true);
  });
});

describe("evaluateCalculationPreflight — fixture remoto real (Terra Test S.A.S.)", () => {
  it("con el structured input real actual, el preflight bloquea (INPUT_MISSING: equity, financial_debt_total, da + METHODOLOGY_APPROVAL_REQUIRED completo)", () => {
    const r = evaluateCalculationPreflight({
      incomeStatement: { revenue: 1_200_000, cost_of_sales: 700_000, opex: 220_000, da: null, interest_expense: null },
      balanceSheet: { cash: 300_000, equity: null, financial_debt_total: null },
    });
    expect(r.passed).toBe(false);
    expect(r.missing_inputs.sort()).toEqual(["da", "equity", "financial_debt_total"]);
    expect(r.unapproved_assumptions).toHaveLength(9);
  });
});
