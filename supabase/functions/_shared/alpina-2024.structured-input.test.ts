// Velarix v5 — FASE 4F.4. Validaciones case-specific de
// `ALPINA_2024_STRUCTURED_INPUT` (Evidence FY2024, item 9) y ejecución
// FORMAL REAL del preflight canónico (`evaluateCalculationPreflight`,
// item 10) — sin mock, sin bypass, sin llamada parcial. NO invoca
// `runCanonicalFinancialEngine` — eso es 4F.5, fuera de alcance aquí.

import { describe, it, expect } from "vitest";
import { evaluateCalculationPreflight } from "./calculation-preflight";
import {
  ALPINA_2024_STRUCTURED_INPUT,
  ALPINA_2024_EXPECTED_GROWTH_PCT,
  ALPINA_2024_EXTENDED_EVIDENCE,
} from "./alpina-2024.structured-input";
import { resolveEffectiveGrowth } from "./canonical-input-normalization";

describe("Alpina 2024 — Evidence FY2024 (4F.4, validaciones case-specific)", () => {
  const is = ALPINA_2024_STRUCTURED_INPUT.income_statement!;
  const bs = ALPINA_2024_STRUCTURED_INPUT.balance_sheet!;
  const ext = ALPINA_2024_EXTENDED_EVIDENCE;

  it("revenue > 0", () => {
    expect(is.revenue).toBeGreaterThan(0);
  });

  it("EBITDA/EBIT reconstruidos desde los componentes coinciden con la Evidence congelada", () => {
    // El motor reconstruye ebitda0/ebit0 desde revenue/cost_of_sales/opex/da
    // (canonical-financial-engine.ts) — no lee un campo "ebitda" aparte.
    // Verificamos aquí que esa reconstrucción es honesta contra la
    // Evidence: revenue - cost_of_sales - opex = EBIT; EBIT + D&A = EBITDA.
    const ebit = is.revenue! - is.cost_of_sales! - is.opex!;
    const ebitda = ebit + is.da!;
    expect(ebit).toBe(200_310_448);
    expect(ebitda).toBe(293_552_229);
  });

  it("EBITDA − D&A = EBIT", () => {
    expect(293_552_229 - is.da!).toBe(200_310_448);
  });

  it("assets ≈ liabilities + equity (bs.total_assets contra la Evidence extendida, tolerancia de redondeo)", () => {
    const diff = Math.abs(bs.total_assets! - (ext.totalLiabilities + bs.equity!));
    expect(diff).toBeLessThan(1); // COP miles — sin margen de redondeo real en la Evidence
  });

  it("bank debt + leases = total debt-like", () => {
    expect(ext.bankFinancialDebt + ext.leaseLiabilities).toBe(bs.financial_debt_total);
  });

  it("D&A breakdown observado suma exactamente el D&A del año base", () => {
    const { ppeDepreciation, rouDepreciation, intangiblesAmortization } = ext.daBreakdown;
    expect(ppeDepreciation + rouDepreciation + intangiblesAmortization).toBe(is.da);
  });

  it("ningún valor numérico del structured input o de la Evidence extendida es NaN/Infinity", () => {
    const allNumbers = [
      ...Object.values(is), ...Object.values(bs),
      ext.totalLiabilities, ext.bankFinancialDebt, ext.leaseLiabilities,
      ...Object.values(ext.daBreakdown),
    ].filter((v): v is number => typeof v === "number");
    expect(allNumbers.length).toBeGreaterThan(0);
    for (const n of allNumbers) expect(Number.isFinite(n)).toBe(true);
  });

  it("no candidatos superseded: financial_debt_total NO es el bank-only 653,189,423", () => {
    expect(bs.financial_debt_total).not.toBe(653_189_423);
  });

  it("4F.6D2 — net_income/total_assets observados están presentes (Evidence real, no fabricados)", () => {
    expect(is.net_income).toBe(100_521_166);
    expect(bs.total_assets).toBe(1_431_184_168);
  });

  it("expectedGrowth: resolveEffectiveGrowth(3) preserva 3, no activa el fallback de 25", () => {
    expect(resolveEffectiveGrowth(ALPINA_2024_EXPECTED_GROWTH_PCT)).toBe(3);
    expect(resolveEffectiveGrowth(ALPINA_2024_EXPECTED_GROWTH_PCT)).not.toBe(25);
  });
});

describe("Alpina 2024 — Preflight canónico REAL (4F.4, formal, sin mock/bypass)", () => {
  it("evaluateCalculationPreflight(ALPINA_2024_STRUCTURED_INPUT + ALPINA_2024_RESOLVED_ASSUMPTIONS) → PASS", () => {
    const result = evaluateCalculationPreflight({
      incomeStatement: ALPINA_2024_STRUCTURED_INPUT.income_statement,
      balanceSheet: ALPINA_2024_STRUCTURED_INPUT.balance_sheet,
      resolvedAssumptions: ALPINA_2024_STRUCTURED_INPUT.resolved_assumptions,
    });

    if (!result.passed) {
      // Falla ruidosa y específica en vez de un simple `toBe(true)` —
      // si esto rompe alguna vez, el mensaje de assertion trae los
      // blockers exactos sin tener que re-ejecutar nada a mano.
      throw new Error(`Preflight FAIL — blockers: ${JSON.stringify(result.blockers, null, 2)}`);
    }

    expect(result.passed).toBe(true);
    expect(result.missing_inputs).toEqual([]);
    expect(result.blockers).toEqual([]);
  });
});
