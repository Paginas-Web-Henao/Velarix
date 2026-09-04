// Bloque 3B (tests-first) + Bloque 3C.2 (implementación) — ROE ante
// equity no positivo, docs/velarix-v5/05-financial-engine-audit.md v1.3
// §4, §9. Llama a la función REAL de producción
// (`runCanonicalFinancialEngine`) — el KPI `roe` se calcula dentro de ese
// motor (canonical-financial-engine.ts, kpis.roe), corregido en 3C.2
// para devolver `null` cuando `equity <= 0` en vez de `0`. No se infiere
// causa alguna del patrimonio negativo — el motor no interpreta (04 §17).

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

// Bloque 3C.2 — el describe "HOY" original documentaba dos comportamientos
// que ya no existen en producción: `equity=0` devolviendo `0%` (colapsado
// con un ROE real de cero) y `equity<0` devolviendo un ROE "normal" por
// efecto colateral de `Math.abs()` (RC-1). Preservar esas aserciones como
// caracterización habría preservado el bug en vez de documentarlo — se
// retiran; la única aserción de ese bloque que seguía siendo válida
// (equity > 0 → ROE numérico normal) se conserva abajo, en el describe
// "V5 OBJETIVO".

describe("ROE — V5 OBJETIVO", () => {
  it("equity = 0 → ROE no interpretable (null), distinguible de un ROE de 0%", () => {
    const r = runCanonicalFinancialEngine(inputWithEquity(0), SECTOR, GROWTH);
    expect(r.kpis.roe).toBeNull();
  });

  it("equity < 0 → ROE no interpretable (null) — nunca un porcentaje calculado sobre un equity con el signo alterado", () => {
    const r = runCanonicalFinancialEngine(inputWithEquity(-500_000_000), SECTOR, GROWTH);
    expect(r.kpis.roe).toBeNull();
  });

  it("equity > 0 sigue produciendo un ROE numérico normal (esto no debe romperse al corregir los casos no interpretables)", () => {
    const r = runCanonicalFinancialEngine(inputWithEquity(800_000_000), SECTOR, GROWTH);
    expect(typeof r.kpis.roe).toBe("number");
    expect(r.kpis.roe).not.toBeNull();
  });

  it("cuando ROE no es interpretable, el resultado debe distinguir explícitamente null de 0% en su tipo/valor — nunca colapsar ambos casos al mismo número", () => {
    const zero = runCanonicalFinancialEngine(inputWithEquity(0), SECTOR, GROWTH);
    const negative = runCanonicalFinancialEngine(inputWithEquity(-500_000_000), SECTOR, GROWTH);
    expect(zero.kpis.roe).toBeNull();
    expect(negative.kpis.roe).toBeNull();
    // Ambos son "no interpretable" — no se espera que null se confunda con 0 en ningún punto posterior del pipeline.
    expect(zero.kpis.roe).not.toBe(0);
  });
});
