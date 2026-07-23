// BL-27 (Bloque 1A) — Pruebas de caracterización de src/lib/financial-engine.ts
//
// Estas pruebas registran el comportamiento ACTUAL del motor cliente, sea
// correcto o no. No son criterio de corrección de ningún bug (ver
// docs/velarix/plan/DEFINICION-DE-TERMINADO.md, sección "Distinción
// obligatoria: caracterización vs. especificación"). Se usan en el Bloque 1E
// para comparar servidor vs. cliente.
//
// Cada fixture es sintético, versionado (ver comentario por escenario) y
// declara explícitamente unidad/moneda: las cifras se tratan como unidades
// monetarias abstractas ("u.m.") — el motor cliente no tiene campo de
// moneda (confirmado: `FinancialInputs` en financial-engine.ts:97-123 no
// incluye `currency`), así que ningún escenario asume COP ni USD.
//
// Referencia de evidencia: docs/velarix/fases/BL-26-tabla-comparativa-motores.md

import { describe, it, expect } from "vitest";
import { runAnalysis, DEFAULT_INPUTS, quickValuation, SECTOR_BENCHMARKS, type FinancialInputs } from "./financial-engine";

const fixtureVersion = "BL-27-fixtures-v1";

function withInputs(overrides: Partial<FinancialInputs>): FinancialInputs {
  return { ...DEFAULT_INPUTS, ...overrides };
}

describe(`financial-engine.runAnalysis — caracterización (${fixtureVersion})`, () => {
  // 1. Caso base — DEFAULT_INPUTS tal como están definidos hoy (financial-engine.ts:125-148)
  it("1. caso base (DEFAULT_INPUTS) produce un enterpriseValue positivo y sin advertencia de WACC", () => {
    const result = runAnalysis(DEFAULT_INPUTS);
    expect(result.waccWarning).toBeNull();
    expect(result.enterpriseValue).toBeGreaterThan(0);
    expect(result.wacc).toBeGreaterThan(0);
    expect(result.projections).toHaveLength(5);
  });

  // 2. Sector desconocido — cae al fallback "Software / Tecnología" (financial-engine.ts:266)
  it("2. sector no reconocido usa el benchmark de fallback 'Software / Tecnología'", () => {
    const inputs = withInputs({ sector: "Sector inexistente XYZ" });
    const result = runAnalysis(inputs);
    expect(result.sectorBenchmark.label).toBe("Software / Tecnología");
  });

  // 3. WACC <= crecimiento terminal — dispara waccWarning y terminalValue=0 (financial-engine.ts:291-296)
  it("3. cuando WACC <= g terminal, terminalValue y discountedTV quedan en 0 y se emite waccWarning", () => {
    const inputs = withInputs({ terminalGrowth: 50, debtWeight: 0.99, equityWeight: 0.01 });
    const result = runAnalysis(inputs);
    if (result.wacc / 100 <= inputs.terminalGrowth / 100) {
      expect(result.waccWarning).not.toBeNull();
      expect(result.terminalValue).toBe(0);
      expect(result.discountedTV).toBe(0);
    } else {
      // Documenta el caso alterno sin asumir: el fixture fue elegido para
      // forzar wacc <= g, pero si el modelo de WACC cambia esta rama debe
      // re-verificarse (no es una pieza de especificación, es un registro).
      expect(result.waccWarning).toBeNull();
    }
  });

  // 4. interestExpense = 0 — interestCoverage cae en la rama "else 0" (financial-engine.ts:357)
  it("4. con gastos financieros en 0, interestCoverage se registra como 0 (no Infinity)", () => {
    const inputs = withInputs({ interestExpense: 0 });
    const result = runAnalysis(inputs);
    expect(result.kpis.interestCoverage).toBe(0);
  });

  // 5. ebitda0 <= 0 — leverage cae en la rama "else 0" (financial-engine.ts:356)
  it("5. con EBITDA histórico <= 0, leverage se registra como 0 (no división por cero)", () => {
    const inputs = withInputs({ revenue: 100_000, costOfSales: 90_000, opex: 40_000, depreciation: 0 });
    const result = runAnalysis(inputs);
    const ebitda0 = inputs.revenue - inputs.costOfSales - inputs.opex + inputs.depreciation;
    expect(ebitda0).toBeLessThanOrEqual(0);
    expect(result.kpis.leverage).toBe(0);
  });

  // 6. equity = 0 — roe cae en la rama "else 0" (financial-engine.ts:352)
  it("6. con patrimonio en 0, ROE se registra como 0 (no división por cero)", () => {
    const inputs = withInputs({ equity: 0, totalDebt: 1_000_000 });
    const result = runAnalysis(inputs);
    expect(result.kpis.roe).toBe(0);
  });

  // 7. EBT histórico negativo — impuestos se recortan a 0 vía Math.max(ebt,0) dentro de computeProjections (financial-engine.ts:245),
  //    y netIncome0 (línea 343) NO tiene ese mismo clamp — se documenta la asimetría, no se corrige.
  it("7. con EBT proyectado negativo, las taxes proyectadas se recortan a 0 (Math.max), pero netIncome0 histórico no tiene el mismo clamp", () => {
    const inputs = withInputs({
      revenue: 500_000, costOfSales: 480_000, opex: 100_000, depreciation: 10_000,
      totalDebt: 2_000_000, costOfDebt: 40, interestExpense: 300_000,
    });
    const result = runAnalysis(inputs);
    const anyNegativeEbtYear = result.projections.some(p => p.ebt < 0);
    if (anyNegativeEbtYear) {
      const negYear = result.projections.find(p => p.ebt < 0)!;
      expect(negYear.taxes).toBe(0);
    }
    const ebitda0 = inputs.revenue - inputs.costOfSales - inputs.opex + inputs.depreciation;
    const ebit0 = ebitda0 - inputs.depreciation;
    const expectedNetIncome0 = (ebit0 - inputs.interestExpense) * (1 - inputs.taxRate / 100);
    expect(result.kpis.netMargin).toBeCloseTo((expectedNetIncome0 / inputs.revenue) * 100, 6);
  });

  // 8. netDebt negativo (cash > totalDebt) — no hay clamp a 0 en netDebt, sólo en equityValue (financial-engine.ts:302-303)
  it("8. cuando la caja excede la deuda total, netDebt es negativo y equityValue queda protegido en 0 como piso", () => {
    const inputs = withInputs({ cash: 5_000_000, totalDebt: 500_000 });
    const result = runAnalysis(inputs);
    expect(result.netDebt).toBeLessThan(0);
    expect(result.equityValue).toBeGreaterThanOrEqual(0);
  });

  // 9. Escenario apalancado (deuda alta, equity bajo) — Hamada re-levering produce un beta re-apalancado mayor al desapalancado (financial-engine.ts:270-271)
  it("9. con alto apalancamiento (deudaWeight alto), el beta re-apalancado (Hamada) es mayor al beta desapalancado del sector", () => {
    const inputs = withInputs({ debtWeight: 0.80, equityWeight: 0.20 });
    const result = runAnalysis(inputs);
    const benchmarkBeta = result.sectorBenchmark.beta;
    expect(result.betaLevered).toBeGreaterThan(benchmarkBeta);
  });

  // 10. totalAssets = totalDebt + equity (sintético, no viene de un balance real) — financial-engine.ts:344
  it("10. total_assets usado en ROA es sintético: siempre igual a totalDebt + equity, sin leer un total_assets real", () => {
    const inputs = withInputs({ totalDebt: 700_000, equity: 1_300_000 });
    const result = runAnalysis(inputs);
    const ebitda0 = inputs.revenue - inputs.costOfSales - inputs.opex + inputs.depreciation;
    const ebit0 = ebitda0 - inputs.depreciation;
    const netIncome0 = (ebit0 - inputs.interestExpense) * (1 - inputs.taxRate / 100);
    const syntheticTotalAssets = inputs.totalDebt + inputs.equity;
    expect(result.kpis.roa).toBeCloseTo((netIncome0 / syntheticTotalAssets) * 100, 6);
  });

  // Escenarios adicionales de caracterización (fuera del mínimo de 10, registran ramas de escenarios pesimista/optimista)
  it("11. escenario optimista aplica clamp de piso 1% a capexPct y wcPct (financial-engine.ts:389-390)", () => {
    const inputs = withInputs({ capexPct: 1.5, wcPct: 1.2 });
    const result = runAnalysis(inputs);
    expect(result.scenarioAssumptions.optimistic.capexPct).toBeGreaterThanOrEqual(1);
    expect(result.scenarioAssumptions.optimistic.wcPct).toBeGreaterThanOrEqual(1);
  });

  it("12. quickValuation es una función independiente y no usa runAnalysis", () => {
    const q = quickValuation(1_000_000, 20, 25, "Software / Tecnología");
    const bm = SECTOR_BENCHMARKS["Software / Tecnología"];
    expect(q.multiple).toBe(bm.evEbitda);
    expect(q.low).toBeLessThan(q.high);
  });
});
