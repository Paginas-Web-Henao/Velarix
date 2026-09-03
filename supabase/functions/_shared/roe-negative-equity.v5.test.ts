// Bloque 3B — Tests-first de ROE ante equity no positivo,
// docs/velarix-v5/05-financial-engine-audit.md v1.3 §4, §9.
// Llama a la función REAL de producción (`runCanonicalFinancialEngine`)
// — el KPI `roe` se calcula dentro de ese motor
// (canonical-financial-engine.ts, kpis.roe). No se modifica ese archivo
// en este bloque. No se infiere causa alguna del patrimonio negativo —
// el motor no interpreta (04 §17).

import { describe, it, expect } from "vitest";
import { runCanonicalFinancialEngine, type CanonicalStructuredInput } from "./canonical-financial-engine";

function inputWithEquity(equity: number): CanonicalStructuredInput {
  return {
    income_statement: { revenue: 1_000_000_000, cost_of_sales: 500_000_000, opex: 100_000_000, da: 50_000_000, interest_expense: 20_000_000 },
    balance_sheet: { financial_debt_total: 200_000_000, cash: 100_000_000, equity },
    moneda_analisis: "COP",
    factor_conversion: 1,
  };
}

const SECTOR = "Manufactura";
const GROWTH = 10;

describe("ROE — HOY (caracterización, verde)", () => {
  it("equity > 0 produce un ROE numérico normal", () => {
    const r = runCanonicalFinancialEngine(inputWithEquity(800_000_000), SECTOR, GROWTH);
    expect(typeof r.kpis.roe).toBe("number");
    expect(Number.isFinite(r.kpis.roe)).toBe(true);
  });

  it("equity = 0 produce hoy 0% (no null) — comportamiento actual confirmado, indistinguible de un ROE genuinamente nulo", () => {
    const r = runCanonicalFinancialEngine(inputWithEquity(0), SECTOR, GROWTH);
    expect(r.kpis.roe).toBe(0);
  });

  it("equity negativo (-500M) produce hoy un ROE numérico 'normal' — porque Math.abs() ya convirtió el equity a +500M antes de este cálculo (RC-1); el resultado es engañoso, no simplemente 0", () => {
    const r = runCanonicalFinancialEngine(inputWithEquity(-500_000_000), SECTOR, GROWTH);
    expect(typeof r.kpis.roe).toBe("number");
    expect(Number.isFinite(r.kpis.roe)).toBe(true);
    // Coincide con el ROE que se obtendría con equity=+500M — la prueba de que el signo se perdió.
    const asPositive = runCanonicalFinancialEngine(inputWithEquity(500_000_000), SECTOR, GROWTH);
    expect(r.kpis.roe).toBeCloseTo(asPositive.kpis.roe, 6);
  });
});

describe("ROE — V5 OBJETIVO (rojo esperado hasta implementar RC-1 + ajuste de KPIs)", () => {
  it.fails("equity = 0 → ROE no interpretable (null), distinguible de un ROE de 0%", () => {
    const r = runCanonicalFinancialEngine(inputWithEquity(0), SECTOR, GROWTH);
    expect(r.kpis.roe).toBeNull();
  });

  it.fails("equity < 0 → ROE no interpretable (null) — nunca un porcentaje calculado sobre un equity con el signo alterado", () => {
    const r = runCanonicalFinancialEngine(inputWithEquity(-500_000_000), SECTOR, GROWTH);
    expect(r.kpis.roe).toBeNull();
  });

  it("equity > 0 sigue produciendo un ROE numérico normal (esto no debe romperse al corregir los casos no interpretables)", () => {
    const r = runCanonicalFinancialEngine(inputWithEquity(800_000_000), SECTOR, GROWTH);
    expect(typeof r.kpis.roe).toBe("number");
    expect(r.kpis.roe).not.toBeNull();
  });

  it.fails("cuando ROE no es interpretable, el resultado debe distinguir explícitamente null de 0% en su tipo/valor — nunca colapsar ambos casos al mismo número", () => {
    const zero = runCanonicalFinancialEngine(inputWithEquity(0), SECTOR, GROWTH);
    const negative = runCanonicalFinancialEngine(inputWithEquity(-500_000_000), SECTOR, GROWTH);
    expect(zero.kpis.roe).toBeNull();
    expect(negative.kpis.roe).toBeNull();
    // Ambos son "no interpretable" — no se espera que null se confunda con 0 en ningún punto posterior del pipeline.
    expect(zero.kpis.roe).not.toBe(0);
  });
});
