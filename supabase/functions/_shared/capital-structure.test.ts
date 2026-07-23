// BL-05 (Bloque 1B-P0) — Pruebas de especificación de la estructura de
// capital y de la resolución del campo de deuda financiera. Importan
// exactamente las mismas funciones puras (`computeCapitalStructure`,
// `resolveFinancialDebtTotal`) que usa `ejecutar-calculo/index.ts::runEngine`
// — no una copia de la fórmula. Estas pruebas demuestran que el
// resultado financiero (debtWeight, WACC, netDebt) efectivamente cambia
// según la deuda resuelta, no solo que se leyó un número.

import { describe, it, expect } from "vitest";
import { computeCapitalStructure, resolveFinancialDebtTotal } from "./capital-structure";

const BASE = {
  sectorBetaUnlevered: 1.0,
  taxRatePct: 30,
  costOfDebtPct: 8,
  riskFreeRatePct: 4.35,
  erpPct: 5.80,
};

describe("resolveFinancialDebtTotal — BL-05", () => {
  it("5. campo correcto (financial_debt_total) presente: se usa directamente", () => {
    expect(resolveFinancialDebtTotal({ financial_debt_total: 900 })).toBe(900);
  });

  it("6. campo antiguo (total_debt) presente, canónico ausente: compatibilidad", () => {
    expect(resolveFinancialDebtTotal({ total_debt: 500 })).toBe(500);
  });

  it("7. ambos campos presentes: gana el contrato canónico", () => {
    expect(resolveFinancialDebtTotal({ financial_debt_total: 900, total_debt: 500, financial_debt: 100 })).toBe(900);
  });

  it("8. deuda negativa por convención contable: se normaliza a valor absoluto", () => {
    expect(resolveFinancialDebtTotal({ financial_debt_total: -900 })).toBe(900);
  });

  it("ningún campo de deuda presente: 0", () => {
    expect(resolveFinancialDebtTotal({})).toBe(0);
  });

  it("financial_debt_total = 0 explícito (empresa sin deuda) no cae a los campos antiguos", () => {
    expect(resolveFinancialDebtTotal({ financial_debt_total: 0, total_debt: 500 })).toBe(0);
  });
});

describe("computeCapitalStructure — BL-05", () => {
  it("1. empresa sin deuda: debtWeight = 0, netDebt = -cash (o negativo si hay caja)", () => {
    const r = computeCapitalStructure({ ...BASE, totalDebt: 0, cash: 100_000, equity: 1_000_000 });
    expect(r.debtWeight).toBe(0);
    expect(r.equityWeight).toBe(1);
    expect(r.netDebt).toBe(-100_000);
  });

  it("2. empresa con deuda: debtWeight > 0 y distinto del caso sin deuda", () => {
    const sinDeuda = computeCapitalStructure({ ...BASE, totalDebt: 0, cash: 100_000, equity: 1_000_000 });
    const conDeuda = computeCapitalStructure({ ...BASE, totalDebt: 500_000, cash: 100_000, equity: 1_000_000 });
    expect(conDeuda.debtWeight).toBeGreaterThan(0);
    expect(conDeuda.debtWeight).not.toBe(sinDeuda.debtWeight);
    expect(conDeuda.waccPct).not.toBeCloseTo(sinDeuda.waccPct, 6);
  });

  it("3. empresa con deuda y caja: netDebt = deuda - caja", () => {
    const r = computeCapitalStructure({ ...BASE, totalDebt: 900_000, cash: 300_000, equity: 1_000_000 });
    expect(r.netDebt).toBe(600_000);
  });

  it("4. empresa con deuda mayor al patrimonio: debtWeight > equityWeight", () => {
    const r = computeCapitalStructure({ ...BASE, totalDebt: 3_000_000, cash: 0, equity: 1_000_000 });
    expect(r.debtWeight).toBeGreaterThan(r.equityWeight);
  });

  it("9. impacto en debtWeight: aumentar totalDebt manteniendo equity fijo sube debtWeight monótonamente", () => {
    const low = computeCapitalStructure({ ...BASE, totalDebt: 100_000, cash: 0, equity: 1_000_000 });
    const mid = computeCapitalStructure({ ...BASE, totalDebt: 500_000, cash: 0, equity: 1_000_000 });
    const high = computeCapitalStructure({ ...BASE, totalDebt: 1_000_000, cash: 0, equity: 1_000_000 });
    expect(low.debtWeight).toBeLessThan(mid.debtWeight);
    expect(mid.debtWeight).toBeLessThan(high.debtWeight);
  });

  it("10. impacto en WACC y net debt: la resolución correcta de la deuda (BL-05) cambia el resultado financiero final", () => {
    const balanceSheet: { financial_debt_total: number; total_debt?: number; financial_debt?: number } = { financial_debt_total: 900_000 }; // nombre canónico real
    const totalDebtCorregido = resolveFinancialDebtTotal(balanceSheet);
    const totalDebtBugAntiguo = Math.abs(balanceSheet.total_debt || balanceSheet.financial_debt || 0); // comportamiento previo al fix: siempre 0

    expect(totalDebtBugAntiguo).toBe(0);
    expect(totalDebtCorregido).toBe(900_000);

    const conBug = computeCapitalStructure({ ...BASE, totalDebt: totalDebtBugAntiguo, cash: 100_000, equity: 1_000_000 });
    const corregido = computeCapitalStructure({ ...BASE, totalDebt: totalDebtCorregido, cash: 100_000, equity: 1_000_000 });

    // El bug (BL-05) hacía que una empresa apalancada se calculara como si
    // no tuviera deuda: WACC y netDebt quedaban mal calculados.
    expect(conBug.netDebt).toBe(-100_000);
    expect(corregido.netDebt).toBe(800_000);
    expect(corregido.waccPct).not.toBeCloseTo(conBug.waccPct, 6);
    expect(corregido.debtWeight).toBeGreaterThan(conBug.debtWeight);
  });

  it("equity <= 0: usa el peso de equity por defecto (0.70) en vez de dividir por cero", () => {
    const r = computeCapitalStructure({ ...BASE, totalDebt: 500_000, cash: 0, equity: 0 });
    expect(r.equityWeight).toBe(0.70);
    expect(Number.isFinite(r.waccPct)).toBe(true);
  });
});
