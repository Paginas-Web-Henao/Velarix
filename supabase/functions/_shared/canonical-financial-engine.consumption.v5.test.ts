// Bloque 3B.1 — Tests-first de CONSUMO real de supuestos resueltos por
// `runCanonicalFinancialEngine` (Tax, CAPEX, D&A, Terminal g),
// docs/velarix-v5/05-financial-engine-audit.md v1.3 §6-§7, RC-3.
//
// Archivo NUEVO, no listado entre los 10 originales de Bloque 3B —
// flagged explícitamente en el reporte de este bloque. Los tests de
// consumo requeridos por el encargo (Tax/CAPEX/D&A/terminal g) no
// encajan temáticamente en ningún archivo v5 existente sin diluir su
// propósito (`working-capital.v5.test.ts` es específico de ΔWC,
// `capital-structure.v5.test.ts` es específico de estructura de
// capital/Ke, `roe-negative-equity.v5.test.ts` es específico de ROE) —
// todos ejercitan `runCanonicalFinancialEngine` en su forma completa
// (proyecciones de 5 años + valor terminal), no una función aislada.
//
// Llama a la función REAL de producción (`runCanonicalFinancialEngine`)
// — nunca reimplementa su lógica. No se modifica
// canonical-financial-engine.ts en este bloque.

import { describe, it, expect } from "vitest";
import { runCanonicalFinancialEngine, type CanonicalStructuredInput } from "./canonical-financial-engine";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";
import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions";

const BASE_INPUT: CanonicalStructuredInput = {
  income_statement: { revenue: 1_000_000_000, cost_of_sales: 500_000_000, opex: 100_000_000, da: 50_000_000, interest_expense: 20_000_000 },
  balance_sheet: { financial_debt_total: 200_000_000, cash: 100_000_000, equity: 800_000_000 },
  moneda_analisis: "COP",
  factor_conversion: 1,
};
const SECTOR = "Manufactura";
const GROWTH = 10;

function withResolved(overrides: Partial<ResolvedCalculationAssumptions>): CanonicalStructuredInput {
  return {
    ...BASE_INPUT,
    resolved_assumptions: { ...EXAMPLE_RESOLVED_ASSUMPTIONS, ...overrides },
  } as any;
}

// ─────────────────────────────────────────────────────────────────
// Tax — 04 §6.3/§6.4/§10.6, 03 P-03/P-04. Bloque 3B.2 corrige la v1 de
// estos tests, que colapsaba marginal/explicit-path/debt-tax-shield en
// una sola tasa — exactamente el error que la metodología prohíbe.
// Ahora se prueban las TRES tasas por separado, con el fixture sintético
// que las mantiene deliberadamente distintas (marginal=35%,
// explicitFcffTaxRatePctByYear=[20,24,28,32,35], debtTaxShieldRatePct=30%).
// NOLs/máquina de estados quedan explícitamente fuera (case-specific,
// `NOT BUILDING` — el contrato transporta el path ya resuelto, el motor
// solo lo ejecuta, mismo principio que CAPEX/D&A/ΔWC).
// ─────────────────────────────────────────────────────────────────

const TAX = EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value;

describe("Tax — HOY (caracterización, verde)", () => {
  it("NOPAT usa la tasa legacy única (30%) en todos los años, ignorando explicitFcffTaxRatePctByYear resuelto", () => {
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    for (const p of r.projections) {
      expect(p.nopat).toBeCloseTo(p.ebit * (1 - 0.30), 2);
    }
  });

  it("el tax shield del costo de deuda usa la tasa legacy única (30%), ignorando debtTaxShieldRatePct resuelto (30% en el fixture — coincide por diseño del fixture legacy, no por consumo real; ver nota)", () => {
    // Nota: el fixture fija debtTaxShieldRatePct=30 precisamente igual al
    // legacy costOfDebtPct×(1-30%) — esto es deliberado para que el test
    // de abajo ("Debt tax shield — V5 OBJETIVO") no pueda pasar por
    // coincidencia numérica cuando cambia explicitFcffTaxRatePctByYear en
    // vez de debtTaxShieldRatePct. Este test HOY solo confirma que la
    // tasa que el motor usa hoy es la legacy (30%), no la resuelta.
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    const kdAfterTaxLegacy = 8 * (1 - 0.30); // costOfDebtPct legacy = 8 (financial-methodology.ts)
    expect(r.valuation.costOfDebtAfterTax).toBeCloseTo(kdAfterTaxLegacy, 3);
  });
});

describe("Tax — Explicit forecast — V5 OBJETIVO (rojo esperado hasta implementar RC-3)", () => {
  it.fails("NOPAT_t debe usar explicitFcffTaxRatePctByYear[t] — año 1 usa índice 0, año 5 usa índice 4, NUNCA la marginal automáticamente", () => {
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    for (let t = 0; t < 5; t++) {
      const p = r.projections[t];
      const nopatTarget = p.ebit * (1 - TAX.explicitFcffTaxRatePctByYear[t] / 100);
      expect(p.nopat).toBeCloseTo(nopatTarget, 2);
    }
  });

  it.fails("el path fiscal NO es uniforme — el motor no puede estar simplemente aplicando una sola tasa (ni la marginal ni ninguna otra constante) a los 5 años", () => {
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    const impliedRates = r.projections.map((p) => 1 - p.nopat / p.ebit);
    const allEqual = impliedRates.every((rate) => Math.abs(rate - impliedRates[0]) < 1e-9);
    expect(allEqual).toBe(false);
  });
});

describe("Tax — Debt tax shield — V5 OBJETIVO (rojo esperado hasta implementar RC-3)", () => {
  it.fails("costOfDebtAfterTax = Kd × (1 - debtTaxShieldRatePct) — NO Kd×(1-explicitFcffTaxRatePctByYear[t]) y NO necesariamente Kd×(1-marginalRatePct)", () => {
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    const kdResuelto = EXAMPLE_RESOLVED_ASSUMPTIONS.costOfDebt.value.valuePct;
    const target = kdResuelto * (1 - TAX.debtTaxShieldRatePct / 100);
    expect(r.valuation.costOfDebtAfterTax).toBeCloseTo(target, 3);
  });
});

describe("Tax — Separation — V5 OBJETIVO (rojo esperado hasta implementar RC-3)", () => {
  it.fails("cambiar SOLO explicitFcffTaxRatePctByYear[2] afecta NOPAT/FCFF del año 3, pero NO el debt tax shield ni el WACC", () => {
    const changedPath = [...TAX.explicitFcffTaxRatePctByYear];
    changedPath[2] = 50;
    const modified = withResolved({ taxTreatment: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment, value: { ...TAX, explicitFcffTaxRatePctByYear: changedPath } } });

    const resultA = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    const resultB = runCanonicalFinancialEngine(modified, SECTOR, GROWTH);

    expect(resultB.projections[2].nopat).not.toBeCloseTo(resultA.projections[2].nopat, 2);
    expect(resultB.projections[0].nopat).toBeCloseTo(resultA.projections[0].nopat, 6);
    expect(resultB.projections[4].nopat).toBeCloseTo(resultA.projections[4].nopat, 6);
    expect(resultB.valuation.costOfDebtAfterTax).toBeCloseTo(resultA.valuation.costOfDebtAfterTax, 6);
    expect(resultB.valuation.wacc).toBeCloseTo(resultA.valuation.wacc, 6);
  });

  it.fails("cambiar SOLO debtTaxShieldRatePct afecta after-tax Kd/WACC, pero NO el NOPAT de ningún año del horizonte", () => {
    const modified = withResolved({ taxTreatment: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment, value: { ...TAX, debtTaxShieldRatePct: TAX.debtTaxShieldRatePct + 10 } } });

    const resultA = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    const resultB = runCanonicalFinancialEngine(modified, SECTOR, GROWTH);

    expect(resultB.valuation.costOfDebtAfterTax).not.toBeCloseTo(resultA.valuation.costOfDebtAfterTax, 3);
    expect(resultB.valuation.wacc).not.toBeCloseTo(resultA.valuation.wacc, 3);
    for (let t = 0; t < 5; t++) {
      expect(resultB.projections[t].nopat).toBeCloseTo(resultA.projections[t].nopat, 6);
    }
  });

  it("cambiar SOLO marginalRatePct NO reescribe automáticamente los explicit-period tax rates — el NOPAT del horizonte explícito no debe moverse", () => {
    const modified = withResolved({ taxTreatment: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment, value: { ...TAX, marginalRatePct: 50 } } });

    const resultA = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    const resultB = runCanonicalFinancialEngine(modified, SECTOR, GROWTH);

    for (let t = 0; t < 5; t++) {
      expect(resultB.projections[t].nopat).toBeCloseTo(resultA.projections[t].nopat, 6);
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// CAPEX — 04 §8. Forma mínima inequívoca para v5: unión discriminada
// `{mode:"explicit_path", explicitPath:[...]}` vs.
// `{mode:"percent_of_revenue", capexPctOfRevenue:...}` — nunca ambos
// simultáneamente (garantizado por el tipo, ver
// resolved-calculation-assumptions.test.ts).
// ─────────────────────────────────────────────────────────────────

const CAPEX_EXPLICIT_PATH = [38_000_000, 45_000_000, 21_000_000, 60_000_000, 33_000_000];

describe("CAPEX — HOY (caracterización, verde)", () => {
  it("capex se calcula como revenue_t × capexPctOfRevenue/100, ignorando cualquier explicitPath resuelto", () => {
    const withExplicit = runCanonicalFinancialEngine(
      withResolved({ capexReinvestmentDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capexReinvestmentDriver, value: { mode: "explicit_path", explicitPath: CAPEX_EXPLICIT_PATH } } }),
      SECTOR, GROWTH,
    );
    const withoutIt = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    expect(withExplicit.projections).toEqual(withoutIt.projections);
  });
});

describe("CAPEX — V5 OBJETIVO (rojo esperado hasta implementar RC-3)", () => {
  function withCapexPath(path: number[]) {
    return runCanonicalFinancialEngine(
      withResolved({ capexReinvestmentDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capexReinvestmentDriver, value: { mode: "explicit_path", explicitPath: path } } }),
      SECTOR, GROWTH,
    );
  }

  it.fails("cada año t usa exactamente explicitPath[t] como capex — no revenue×capexPct%", () => {
    const r = withCapexPath(CAPEX_EXPLICIT_PATH);
    for (let t = 0; t < 5; t++) expect(r.projections[t].capex).toBe(CAPEX_EXPLICIT_PATH[t]);
  });

  it.fails("cambiar CAPEX del año 3 modifica CAPEX/FCFF/discountedFcf de ese año y el downstream (EV), sin modificar revenue/margen ni el capex de otros años", () => {
    const variantB = [...CAPEX_EXPLICIT_PATH];
    variantB[2] += 10_000_000;
    const resultA = withCapexPath(CAPEX_EXPLICIT_PATH);
    const resultB = withCapexPath(variantB);

    expect(resultB.projections[0].capex).toBe(resultA.projections[0].capex);
    expect(resultB.projections[0].revenue).toBe(resultA.projections[0].revenue);
    expect(resultB.projections[1].capex).toBe(resultA.projections[1].capex);
    expect(resultB.projections[3].capex).toBe(resultA.projections[3].capex);
    expect(resultB.projections[4].capex).toBe(resultA.projections[4].capex);

    expect(resultB.projections[2].capex).not.toBe(resultA.projections[2].capex);
    expect(resultB.projections[2].fcff).not.toBe(resultA.projections[2].fcff);
    expect(resultB.projections[2].discountedFcf).not.toBe(resultA.projections[2].discountedFcf);
    expect(resultB.valuation.enterpriseValue).not.toBe(resultA.valuation.enterpriseValue);
  });
});

// ─────────────────────────────────────────────────────────────────
// D&A — misma disciplina que CAPEX. D&A afecta EBIT/NOPAT hacia abajo
// pero se suma de vuelta en FCFF — el efecto neto en FCFF es solo el
// tax shield: ΔFCFF = ΔD&A × T (con T la tasa marginal resuelta).
// ─────────────────────────────────────────────────────────────────

const DA_EXPLICIT_PATH = [34_000_000, 36_000_000, 29_000_000, 41_000_000, 37_000_000];

describe("D&A — HOY (caracterización, verde)", () => {
  it("D&A se calcula como revenue_t × depreciationPctOfRevenue/100 (3%), ignorando cualquier explicitPath resuelto", () => {
    const withExplicit = runCanonicalFinancialEngine(
      withResolved({ depreciationDaDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.depreciationDaDriver, value: { mode: "explicit_path", explicitPath: DA_EXPLICIT_PATH } } }),
      SECTOR, GROWTH,
    );
    const withoutIt = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    expect(withExplicit.projections).toEqual(withoutIt.projections);
  });
});

describe("D&A — V5 OBJETIVO (rojo esperado hasta implementar RC-3)", () => {
  function withDaPath(path: number[]) {
    return runCanonicalFinancialEngine(
      withResolved({ depreciationDaDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.depreciationDaDriver, value: { mode: "explicit_path", explicitPath: path } } }),
      SECTOR, GROWTH,
    );
  }

  it.fails("cada año t usa exactamente explicitPath[t] como D&A, y EBIT/NOPAT reflejan esa D&A coherentemente (EBIT = EBITDA - D&A; NOPAT = EBIT×(1-T))", () => {
    const r = withDaPath(DA_EXPLICIT_PATH);
    const T = EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value.marginalRatePct / 100;
    for (let t = 0; t < 5; t++) {
      const p = r.projections[t];
      expect(p.depreciation).toBe(DA_EXPLICIT_PATH[t]);
      expect(p.ebit).toBeCloseTo(p.ebitda - DA_EXPLICIT_PATH[t], 2);
      expect(p.nopat).toBeCloseTo(p.ebit * (1 - T), 2);
    }
  });

  it.fails("cambiar D&A del año 3 modifica FCFF_3 exactamente por el tax shield (ΔFCFF = ΔD&A × T), no por el monto completo de D&A", () => {
    const deltaDa = 8_000_000;
    const variantB = [...DA_EXPLICIT_PATH];
    variantB[2] += deltaDa;
    const resultA = withDaPath(DA_EXPLICIT_PATH);
    const resultB = withDaPath(variantB);
    const T = EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value.marginalRatePct / 100;

    expect(resultB.projections[2].fcff - resultA.projections[2].fcff).toBeCloseTo(deltaDa * T, 2);
    expect(resultB.projections[0].fcff).toBe(resultA.projections[0].fcff);
    expect(resultB.projections[4].fcff).toBe(resultA.projections[4].fcff);
  });
});

// ─────────────────────────────────────────────────────────────────
// Terminal g — 04 §11. Cambiar únicamente terminalG.valuePct no debe
// afectar los años explícitos (el `g` solo entra en la fórmula de
// Gordon Growth del año terminal) — sí debe cambiar terminal value y EV,
// y debe seguir respetando WACC > g.
// ─────────────────────────────────────────────────────────────────

describe("Terminal g — HOY (caracterización, verde)", () => {
  it("terminalG resuelto (3.5%) no se usa hoy — el motor sigue usando terminalGrowthPct legacy (3%) de CANONICAL_METHODOLOGY", () => {
    const withResolvedG = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    const withoutIt = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    expect(withResolvedG.valuation.terminalValue).toBeCloseTo(withoutIt.valuation.terminalValue, 2);
  });
});

describe("Terminal g — V5 OBJETIVO (rojo esperado hasta implementar RC-3)", () => {
  function withTerminalG(valuePct: number) {
    return runCanonicalFinancialEngine(
      withResolved({ terminalG: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG, value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value, valuePct } } }),
      SECTOR, GROWTH,
    );
  }

  it("cambiar terminalG.valuePct NO cambia el FCFF de ningún año explícito", () => {
    const resultA = withTerminalG(3.5);
    const resultB = withTerminalG(4.8);
    for (let t = 0; t < 5; t++) {
      expect(resultB.projections[t].fcff).toBe(resultA.projections[t].fcff);
    }
  });

  it.fails("cambiar terminalG.valuePct SÍ cambia el terminal value y el Enterprise Value", () => {
    const resultA = withTerminalG(3.5);
    const resultB = withTerminalG(4.8);
    expect(resultB.valuation.terminalValue).not.toBeCloseTo(resultA.valuation.terminalValue, 2);
    expect(resultB.valuation.enterpriseValue).not.toBeCloseTo(resultA.valuation.enterpriseValue, 2);
  });

  it.fails("un terminalG.valuePct resuelto que violaría WACC > g debe seguir respetando esa guardia (waccWarning), consistente con el `g` efectivamente usado", () => {
    const extreme = withTerminalG(99); // muy por encima de cualquier WACC plausible
    // Si el motor efectivamente consumiera este `g` resuelto, WACC<=g y debería advertir.
    expect(extreme.valuation.waccWarning).not.toBeNull();
  });
});
