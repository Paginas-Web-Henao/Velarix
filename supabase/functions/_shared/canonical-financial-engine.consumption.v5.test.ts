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
  };
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

// Bloque 3C.4 — corrección: las dos aserciones "HOY" originales
// comparaban una ejecución que anunciaba v5 completo (`withResolved({})`,
// con TODOS los drivers de EXAMPLE_RESOLVED_ASSUMPTIONS presentes) contra
// el comportamiento legacy — válido únicamente mientras NINGÚN driver se
// consumía. Ahora que Tax/CAPEX/D&A/WC/capital-structure SÍ se consumen
// en v5 (3C.2-3C.4), esa comparación ya no aísla nada — se retira, y se
// reemplaza por una verificación LEGACY genuina: una llamada SIN la
// clave `resolved_assumptions` en absoluto sigue produciendo exactamente
// el resultado legacy de siempre.
describe("Tax — LEGACY (sin resolved_assumptions, verde — compatibilidad con golden cases)", () => {
  it("NOPAT usa la tasa legacy única (30%) en todos los años", () => {
    const r = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    for (const p of r.projections) {
      expect(p.nopat).toBeCloseTo(p.ebit * (1 - 0.30), 2);
    }
  });

  it("el tax shield del costo de deuda usa la tasa legacy única (30%)", () => {
    const r = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    const kdAfterTaxLegacy = 8 * (1 - 0.30); // costOfDebtPct legacy = 8 (financial-methodology.ts)
    expect(r.valuation.costOfDebtAfterTax).toBeCloseTo(kdAfterTaxLegacy, 3);
  });
});

describe("Tax — Explicit forecast — V5 OBJETIVO", () => {
  it("NOPAT_t debe usar explicitFcffTaxRatePctByYear[t] — año 1 usa índice 0, año 5 usa índice 4, NUNCA la marginal automáticamente", () => {
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    for (let t = 0; t < 5; t++) {
      const p = r.projections[t];
      const nopatTarget = p.ebit * (1 - TAX.explicitFcffTaxRatePctByYear[t] / 100);
      expect(p.nopat).toBeCloseTo(nopatTarget, 2);
    }
  });

  it("el path fiscal NO es uniforme — el motor no puede estar simplemente aplicando una sola tasa (ni la marginal ni ninguna otra constante) a los 5 años", () => {
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    const impliedRates = r.projections.map((p) => 1 - p.nopat / p.ebit);
    const allEqual = impliedRates.every((rate) => Math.abs(rate - impliedRates[0]) < 1e-9);
    expect(allEqual).toBe(false);
  });
});

describe("Tax — Debt tax shield — V5 OBJETIVO", () => {
  it("costOfDebtAfterTax = Kd × (1 - debtTaxShieldRatePct) — NO Kd×(1-explicitFcffTaxRatePctByYear[t]) y NO necesariamente Kd×(1-marginalRatePct)", () => {
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    const kdResuelto = EXAMPLE_RESOLVED_ASSUMPTIONS.costOfDebt.value.valuePct;
    const target = kdResuelto * (1 - TAX.debtTaxShieldRatePct / 100);
    expect(r.valuation.costOfDebtAfterTax).toBeCloseTo(target, 3);
  });
});

describe("Tax — Separation — V5 OBJETIVO", () => {
  it("cambiar SOLO explicitFcffTaxRatePctByYear[2] afecta NOPAT/FCFF del año 3, pero NO el debt tax shield ni el WACC", () => {
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

  it("cambiar SOLO debtTaxShieldRatePct afecta after-tax Kd/WACC, pero NO el NOPAT de ningún año del horizonte", () => {
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

// Bloque 3C.4 — corrección: la "HOY" original comparaba una ejecución v5
// completa (con capexReinvestmentDriver como único override explícito,
// pero tax/D&A/WC/capital-structure de EXAMPLE_RESOLVED_ASSUMPTIONS
// también presentes) contra el comportamiento legacy — válido solo
// mientras NADA se consumía. Retirada; reemplazada por una verificación
// LEGACY genuina (sin la clave `resolved_assumptions` en absoluto).
describe("CAPEX — LEGACY (sin resolved_assumptions, verde — compatibilidad con golden cases)", () => {
  it("capex se calcula como revenue_t × capexPctOfRevenue/100 legacy (5%, financial-methodology.ts)", () => {
    const r = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    for (const p of r.projections) {
      expect(p.capex).toBeCloseTo(p.revenue * 0.05, 2);
    }
  });
});

describe("CAPEX — V5 OBJETIVO", () => {
  function withCapexPath(path: number[]) {
    return runCanonicalFinancialEngine(
      withResolved({ capexReinvestmentDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capexReinvestmentDriver, value: { mode: "explicit_path", explicitPath: path } } }),
      SECTOR, GROWTH,
    );
  }

  // Bloque 3C.4 (cierre de cobertura) — 12% elegido deliberadamente
  // distinto del legacy (5%, financial-methodology.ts) y del default del
  // fixture (4.5%), para que esta aserción no pueda coincidir por
  // accidente con ningún valor legacy — prueba consumo real de Judgment,
  // no una coincidencia numérica.
  it("percent_of_revenue: capex_t = revenue_t × capexPctOfRevenue/100 para los 5 años, con un % resuelto deliberadamente distinto del legacy (12% vs. 5% legacy)", () => {
    const CAPEX_PCT_V5 = 12;
    const r = runCanonicalFinancialEngine(
      withResolved({ capexReinvestmentDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capexReinvestmentDriver, value: { mode: "percent_of_revenue", capexPctOfRevenue: CAPEX_PCT_V5 } } }),
      SECTOR, GROWTH,
    );
    for (let t = 0; t < 5; t++) {
      const p = r.projections[t];
      expect(p.capex).toBeCloseTo(p.revenue * (CAPEX_PCT_V5 / 100), 2);
      // Nunca coincide con lo que el legacy (5%) habría producido para el mismo revenue.
      expect(p.capex).not.toBeCloseTo(p.revenue * 0.05, 2);
    }
  });

  it("explicit_path: cada año t usa exactamente explicitPath[t] como capex — no revenue×capexPct%", () => {
    const r = withCapexPath(CAPEX_EXPLICIT_PATH);
    for (let t = 0; t < 5; t++) expect(r.projections[t].capex).toBe(CAPEX_EXPLICIT_PATH[t]);
  });

  it("cambiar CAPEX del año 3 modifica CAPEX/FCFF/discountedFcf de ese año y el downstream (EV), sin modificar revenue/margen ni el capex de otros años", () => {
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
// tax shield del año: ΔFCFF = ΔD&A × explicitFcffTaxRatePctByYear[t]
// (NUNCA la marginal — 04 §6.3/§6.4, corregido en 3C.4, ver nota abajo).
// ─────────────────────────────────────────────────────────────────

const DA_EXPLICIT_PATH = [34_000_000, 36_000_000, 29_000_000, 41_000_000, 37_000_000];

// Bloque 3C.4 — misma corrección que Tax/CAPEX: la "HOY" original
// comparaba una ejecución v5 completa contra el comportamiento legacy,
// válido solo mientras nada se consumía. Retirada; reemplazada por una
// verificación LEGACY genuina.
describe("D&A — LEGACY (sin resolved_assumptions, verde — compatibilidad con golden cases)", () => {
  it("D&A se calcula como revenue_t × depreciationPctOfRevenue/100 legacy (3%)", () => {
    const r = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    for (const p of r.projections) {
      expect(p.depreciation).toBeCloseTo(p.revenue * 0.03, 2);
    }
  });
});

describe("D&A — V5 OBJETIVO", () => {
  // Bloque 3C.4 (cierre de cobertura) — 9% elegido deliberadamente
  // distinto del legacy (3%, financial-methodology.ts) y del default del
  // fixture (3.2%). Además verifica EBIT = EBITDA - D&A en cada año, para
  // demostrar que esta D&A resuelta efectivamente entra al forecast (no
  // solo que el campo `depreciation` del resultado la refleja).
  it("percent_of_revenue: D&A_t = revenue_t × daPctOfRevenue/100 para los 5 años, con un % resuelto deliberadamente distinto del legacy (9% vs. 3% legacy) — y EBIT = EBITDA - D&A en cada año", () => {
    const DA_PCT_V5 = 9;
    const r = runCanonicalFinancialEngine(
      withResolved({ depreciationDaDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.depreciationDaDriver, value: { mode: "percent_of_revenue", daPctOfRevenue: DA_PCT_V5 } } }),
      SECTOR, GROWTH,
    );
    for (let t = 0; t < 5; t++) {
      const p = r.projections[t];
      const expectedDa = p.revenue * (DA_PCT_V5 / 100);
      expect(p.depreciation).toBeCloseTo(expectedDa, 2);
      // Nunca coincide con lo que el legacy (3%) habría producido para el mismo revenue.
      expect(p.depreciation).not.toBeCloseTo(p.revenue * 0.03, 2);
      // La D&A resuelta efectivamente entra al forecast: EBIT = EBITDA - D&A.
      expect(p.ebit).toBeCloseTo(p.ebitda - expectedDa, 2);
    }
  });

  function withDaPath(path: number[]) {
    return runCanonicalFinancialEngine(
      withResolved({ depreciationDaDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.depreciationDaDriver, value: { mode: "explicit_path", explicitPath: path } } }),
      SECTOR, GROWTH,
    );
  }

  // Bloque 3C.4 — corrección: las dos aserciones de abajo usaban
  // `marginalRatePct` (35%) como "la" tasa de NOPAT — correcto solo
  // por coincidencia en el año 5 (índice 4, donde
  // `explicitFcffTaxRatePctByYear[4]` también es 35%). Para el resto de
  // los años (20/24/28/32%, deliberadamente distintos entre sí desde
  // 3B.2, precisamente para exponer este tipo de error) NOPAT usa
  // `explicitFcffTaxRatePctByYear[t]` — nunca la marginal (`04 §6.3/§6.4`,
  // ver también la sección "Tax" arriba). Corregido para usar la tasa
  // correcta por año, no una tasa constante.
  it("cada año t usa exactamente explicitPath[t] como D&A, y EBIT/NOPAT reflejan esa D&A coherentemente (EBIT = EBITDA - D&A; NOPAT = EBIT×(1-explicitFcffTaxRatePctByYear[t]))", () => {
    const r = withDaPath(DA_EXPLICIT_PATH);
    const explicitRates = EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value.explicitFcffTaxRatePctByYear;
    for (let t = 0; t < 5; t++) {
      const p = r.projections[t];
      expect(p.depreciation).toBe(DA_EXPLICIT_PATH[t]);
      expect(p.ebit).toBeCloseTo(p.ebitda - DA_EXPLICIT_PATH[t], 2);
      expect(p.nopat).toBeCloseTo(p.ebit * (1 - explicitRates[t] / 100), 2);
    }
  });

  it("cambiar D&A del año 3 modifica FCFF_3 exactamente por el tax shield del año (ΔFCFF = ΔD&A × explicitFcffTaxRatePctByYear[2]), no por el monto completo de D&A ni por la tasa marginal", () => {
    const deltaDa = 8_000_000;
    const variantB = [...DA_EXPLICIT_PATH];
    variantB[2] += deltaDa;
    const resultA = withDaPath(DA_EXPLICIT_PATH);
    const resultB = withDaPath(variantB);
    const yearThreeRate = EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value.explicitFcffTaxRatePctByYear[2] / 100;

    expect(resultB.projections[2].fcff - resultA.projections[2].fcff).toBeCloseTo(deltaDa * yearThreeRate, 2);
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

// Bloque 3C.5 — corrección: la "LEGACY" (antes "HOY tras 3C.4") original
// comparaba dos ejecuciones v5 idénticas salvo terminalG y esperaba
// terminalValue igual — válido solo mientras terminalG NO se consumía.
// Ahora que sí se consume, esa comparación queda invertida (ver "SÍ
// cambia" abajo); se retira, y se reemplaza por una verificación LEGACY
// genuina (sin la clave `resolved_assumptions`).
describe("Terminal g — LEGACY (sin resolved_assumptions, verde — compatibilidad con golden cases)", () => {
  it("usa terminalGrowthPct legacy (3%, financial-methodology.ts) — no se ve afectado por ningún terminalG resuelto", () => {
    const r = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    const gLegacy = 0.03;
    const waccDecimal = r.valuation.wacc / 100;
    const expectedTv = r.projections[4].fcff * (1 + gLegacy) / (waccDecimal - gLegacy);
    expect(r.valuation.terminalValue).toBeCloseTo(expectedTv, 2);
  });
});

describe("Terminal g — V5 OBJETIVO", () => {
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

  it("cambiar terminalG.valuePct NO cambia revenue/EBIT/NOPAT/D&A/CAPEX/ΔWC de ningún año explícito (estructuralmente iguales, no solo el fcff agregado)", () => {
    const resultA = withTerminalG(3.5);
    const resultB = withTerminalG(4.8);
    for (let t = 0; t < 5; t++) {
      const pA = resultA.projections[t];
      const pB = resultB.projections[t];
      expect(pB.revenue).toBe(pA.revenue);
      expect(pB.ebit).toBe(pA.ebit);
      expect(pB.nopat).toBe(pA.nopat);
      expect(pB.depreciation).toBe(pA.depreciation);
      expect(pB.capex).toBe(pA.capex);
      expect(pB.deltaWC).toBe(pA.deltaWC);
    }
  });

  it("cambiar terminalG.valuePct NO cambia WACC, beta apalancado, costo de equity ni costo de deuda after-tax", () => {
    const resultA = withTerminalG(3.5);
    const resultB = withTerminalG(4.8);
    expect(resultB.valuation.wacc).toBeCloseTo(resultA.valuation.wacc, 10);
    expect(resultB.valuation.betaLevered).toBeCloseTo(resultA.valuation.betaLevered, 10);
    expect(resultB.valuation.costOfEquity).toBeCloseTo(resultA.valuation.costOfEquity, 10);
    expect(resultB.valuation.costOfDebtAfterTax).toBeCloseTo(resultA.valuation.costOfDebtAfterTax, 10);
  });

  it("cambiar terminalG.valuePct SÍ cambia el terminal value y el Enterprise Value", () => {
    const resultA = withTerminalG(3.5);
    const resultB = withTerminalG(4.8);
    expect(resultB.valuation.terminalValue).not.toBeCloseTo(resultA.valuation.terminalValue, 2);
    expect(resultB.valuation.enterpriseValue).not.toBeCloseTo(resultA.valuation.enterpriseValue, 2);
  });

  it("fórmula: TV_5 = FCFF_5 × (1+g) / (WACC-g), verificada algebraicamente contra el propio resultado (no un número mágico externo)", () => {
    const valuePct = 3.5;
    const r = withTerminalG(valuePct);
    const gDecimal = valuePct / 100;
    const waccDecimal = r.valuation.wacc / 100;
    const expectedTv = (r.projections[4].fcff * (1 + gDecimal)) / (waccDecimal - gDecimal);
    expect(r.valuation.terminalValue).toBeCloseTo(expectedTv, 2);
  });

  describe("guardia WACC vs. g", () => {
    it("WACC > g: terminal value válido (número positivo, sin advertencia)", () => {
      const r = withTerminalG(3.5); // el WACC resuelto del fixture es sustancialmente mayor a 3.5%
      expect(r.valuation.waccWarning).toBeNull();
      expect(r.valuation.terminalValue).toBeGreaterThan(0);
      expect(Number.isFinite(r.valuation.terminalValue)).toBe(true);
    });

    it("WACC = g: no se permite un cálculo terminal normal — waccWarning explícito, terminalValue/discountedTV en 0 (nunca NaN)", () => {
      const waccPct = withTerminalG(3.5).valuation.wacc; // terminalG no afecta WACC — reutilizable como referencia
      const r = withTerminalG(waccPct); // g == WACC exactamente
      expect(r.valuation.waccWarning).not.toBeNull();
      expect(r.valuation.terminalValue).toBe(0);
      expect(r.valuation.discountedTV).toBe(0);
      expect(Number.isNaN(r.valuation.terminalValue)).toBe(false);
    });

    it("WACC < g: no se permite un cálculo terminal normal — waccWarning explícito, terminalValue/discountedTV en 0 (nunca NaN)", () => {
      const waccPct = withTerminalG(3.5).valuation.wacc;
      const r = withTerminalG(waccPct + 2); // g > WACC
      expect(r.valuation.waccWarning).not.toBeNull();
      expect(r.valuation.terminalValue).toBe(0);
      expect(r.valuation.discountedTV).toBe(0);
      expect(Number.isNaN(r.valuation.terminalValue)).toBe(false);
    });

    it("un terminalG.valuePct resuelto extremo (99%) sigue respetando la guardia (waccWarning), consistente con el `g` efectivamente usado", () => {
      const extreme = withTerminalG(99); // muy por encima de cualquier WACC plausible
      expect(extreme.valuation.waccWarning).not.toBeNull();
      expect(extreme.valuation.terminalValue).toBe(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// Terminal g de escenario (pesimista/optimista) — 04 §11: "Cualquier g
// de escenario debe derivarse explícitamente del g base con lógica
// documentada — nunca ser un literal sin relación declarada". El
// contrato (`TerminalGValue`) ya representa esos dos valores
// (`pessimisticScenarioPct`/`optimisticScenarioPct`) junto al `valuePct`
// base — la derivación documentada vive en el `rationale` de la entrada
// resuelta, no en el motor. El motor solo los consume literalmente,
// nunca cae silenciosamente a los literales legacy 2%/4%.
// ─────────────────────────────────────────────────────────────────

describe("Terminal g de escenario (pesimista/optimista) — LEGACY (sin resolved_assumptions, verde — compatibilidad con golden cases)", () => {
  it("usa exactamente los literales históricos 2% (pesimista) / 4% (optimista)", () => {
    const r = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    expect(r.scenarios.pessimistic.assumptions.terminalGrowth).toBe(2);
    expect(r.scenarios.optimistic.assumptions.terminalGrowth).toBe(4);
  });
});

describe("Terminal g de escenario (pesimista/optimista) — V5 OBJETIVO", () => {
  function withScenarioG(pessimisticScenarioPct: number, optimisticScenarioPct: number) {
    return runCanonicalFinancialEngine(
      withResolved({
        terminalG: {
          ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG,
          value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value, pessimisticScenarioPct, optimisticScenarioPct },
        },
      }),
      SECTOR, GROWTH,
    );
  }

  // 1.1%/5.5% elegidos deliberadamente distintos de los literales legacy
  // 2%/4% — el fixture por defecto ya tiene pessimisticScenarioPct=2.0
  // (coincide por casualidad con el legacy), así que estos tests los
  // sobre-escriben explícitamente para que ninguna aserción pueda pasar
  // por coincidencia numérica.
  it("una ejecución v5 no usa los literales legacy 2%/4% para pessimistic/optimistic — usa terminalG.pessimisticScenarioPct/optimisticScenarioPct resueltos", () => {
    const r = withScenarioG(1.1, 5.5);
    expect(r.scenarios.pessimistic.assumptions.terminalGrowth).toBe(1.1);
    expect(r.scenarios.optimistic.assumptions.terminalGrowth).toBe(5.5);
    expect(r.scenarios.pessimistic.assumptions.terminalGrowth).not.toBe(2);
    expect(r.scenarios.optimistic.assumptions.terminalGrowth).not.toBe(4);
  });

  it("cambiar únicamente terminalG.pessimisticScenarioPct cambia el EV del escenario pesimista, sin afectar el optimista ni el caso base", () => {
    const a = withScenarioG(1.1, 5.5);
    const b = withScenarioG(2.9, 5.5); // solo pesimista cambia
    expect(b.scenarios.pessimistic.ev).not.toBeCloseTo(a.scenarios.pessimistic.ev, 2);
    expect(b.scenarios.optimistic.ev).toBeCloseTo(a.scenarios.optimistic.ev, 6);
    expect(b.valuation.enterpriseValue).toBeCloseTo(a.valuation.enterpriseValue, 6);
  });

  it("cambiar únicamente terminalG.optimisticScenarioPct cambia el EV del escenario optimista, sin afectar el pesimista ni el caso base", () => {
    const a = withScenarioG(1.1, 5.5);
    const b = withScenarioG(1.1, 6.8); // solo optimista cambia
    expect(b.scenarios.optimistic.ev).not.toBeCloseTo(a.scenarios.optimistic.ev, 2);
    expect(b.scenarios.pessimistic.ev).toBeCloseTo(a.scenarios.pessimistic.ev, 6);
    expect(b.valuation.enterpriseValue).toBeCloseTo(a.valuation.enterpriseValue, 6);
  });

  it("cambiar los g de escenario no cambia los 5 FCFF explícitos del caso base", () => {
    const a = withScenarioG(1.1, 5.5);
    const b = withScenarioG(2.9, 6.8);
    for (let t = 0; t < 5; t++) {
      expect(b.projections[t].fcff).toBe(a.projections[t].fcff);
    }
  });

  it("cambiar los g de escenario no cambia los 5 FCFF proyectados dentro de cada escenario (mismo growth/margen de escenario — solo cambia el terminal)", () => {
    const a = withScenarioG(1.1, 5.5);
    const b = withScenarioG(2.9, 6.8);
    for (let t = 0; t < 5; t++) {
      expect(b.scenarios.pessimistic.projections[t].fcff).toBe(a.scenarios.pessimistic.projections[t].fcff);
      expect(b.scenarios.optimistic.projections[t].fcff).toBe(a.scenarios.optimistic.projections[t].fcff);
    }
  });

  it("ejecución v5 sin terminalG.pessimisticScenarioPct/optimisticScenarioPct resueltos lanza explícitamente — nunca cae silenciosamente a 2%/4%", () => {
    expect(() =>
      runCanonicalFinancialEngine(
        withResolved({ terminalG: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG, value: { valuePct: 3.5 } } }), // sin los dos campos de escenario
        SECTOR, GROWTH,
      ),
    ).toThrow(/pessimisticScenarioPct|optimisticScenarioPct/);
  });

  // Bloque 3C.5 (cierre) — corrección: `ev` pasó de `0` (ambiguo con un
  // EV real, y que además descartaba el PV de los 5 FCFF explícitos) a
  // `number | null`. `null` es la representación explícita de "no
  // interpretable" cuando `scenarioWacc <= scenarioTerminalG` — mismo
  // principio que `CanonicalKPIs.roe` (3C.2). `projections` (los 5 años
  // del escenario) permanecen siempre disponibles, incluso cuando el
  // terminal no converge.
  describe("guardia scenarioWacc vs. scenarioTerminalG", () => {
    it("scenarioWacc > scenarioTerminalG: ev numérico válido", () => {
      const r = withScenarioG(1.1, 5.5); // el WACC del escenario pesimista es sustancialmente mayor a 1.1%
      expect(typeof r.scenarios.pessimistic.ev).toBe("number");
      expect(r.scenarios.pessimistic.ev).toBeGreaterThan(0);
      expect(Number.isFinite(r.scenarios.pessimistic.ev)).toBe(true);
    });

    it("scenarioWacc = scenarioTerminalG: no hay ev numérico normal — ev es null (nunca NaN, nunca 0)", () => {
      const scenarioWaccPct = withScenarioG(1.1, 5.5).scenarios.pessimistic.assumptions.wacc;
      const r = withScenarioG(scenarioWaccPct, 5.5); // pessimisticScenarioPct == WACC del escenario pesimista exactamente
      expect(r.scenarios.pessimistic.ev).toBeNull();
      expect(Number.isNaN(r.scenarios.pessimistic.ev)).toBe(false);
    });

    it("scenarioWacc < scenarioTerminalG: no hay ev numérico normal — ev es null (nunca NaN, nunca 0)", () => {
      const scenarioWaccPct = withScenarioG(1.1, 5.5).scenarios.pessimistic.assumptions.wacc;
      const r = withScenarioG(scenarioWaccPct + 3, 5.5); // pessimisticScenarioPct > WACC del escenario pesimista
      expect(r.scenarios.pessimistic.ev).toBeNull();
      expect(Number.isNaN(r.scenarios.pessimistic.ev)).toBe(false);
    });

    it("cuando el escenario no converge (ev: null), los 5 FCFF explícitos del escenario siguen disponibles — el terminal no converge, el horizonte explícito sí existe", () => {
      const scenarioWaccPct = withScenarioG(1.1, 5.5).scenarios.pessimistic.assumptions.wacc;
      const r = withScenarioG(scenarioWaccPct, 5.5);
      expect(r.scenarios.pessimistic.ev).toBeNull();
      expect(r.scenarios.pessimistic.projections).toHaveLength(5);
      for (const p of r.scenarios.pessimistic.projections) {
        expect(typeof p.fcff).toBe("number");
        expect(Number.isFinite(p.fcff)).toBe(true);
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// Escenarios (pesimista/optimista) — consumo de forecast drivers v5.
// Bloque 3C.5 (cierre): antes, `mkScenario` llamaba a `computeProjections`
// SIN el argumento `v5Drivers` — una ejecución v5 con terminal g/WACC
// resueltos podía terminar calculando el FCFF de
// `scenarios.pessimistic`/`optimistic` con tax/CAPEX/D&A/ΔWC LEGACY,
// exactamente el fallback silencioso que `05 v1.3 §6` prohíbe. Corregido
// para que ambos escenarios reciban el MISMO `v5Drivers` ya resuelto que
// el caso base — los modificadores de growth/margen/WACC de escenario no
// cambian.
// ─────────────────────────────────────────────────────────────────

describe("Escenarios (pesimista/optimista) — LEGACY: sin cambios (compatibilidad con golden cases)", () => {
  it("un escenario sin resolved_assumptions sigue usando tax/CAPEX/D&A/WC legacy — igual que siempre", () => {
    const r = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    const p1 = r.scenarios.pessimistic.projections[0];
    // Legacy (financial-methodology.ts): capexPct=5%, depreciationPct=3%, wcPct=3%, taxRate=30%.
    expect(p1.capex).toBeCloseTo(p1.revenue * 0.05, 2);
    expect(p1.depreciation).toBeCloseTo(p1.revenue * 0.03, 2);
    expect(p1.deltaWC).toBeCloseTo(p1.revenue * 0.03, 2);
    expect(p1.nopat).toBeCloseTo(p1.ebit * (1 - 0.30), 2);
  });
});

describe("Escenarios (pesimista/optimista) — V5 OBJETIVO: consumen los mismos drivers resueltos que el caso base", () => {
  it("cambiar únicamente explicitFcffTaxRatePctByYear cambia el NOPAT del escenario pesimista — nunca el 30% legacy", () => {
    const changedPath = [15, 15, 15, 15, 15];
    const modified = withResolved({
      taxTreatment: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment, value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value, explicitFcffTaxRatePctByYear: changedPath } },
    });
    const r = runCanonicalFinancialEngine(modified, SECTOR, GROWTH);
    const p1 = r.scenarios.pessimistic.projections[0];
    expect(p1.nopat).toBeCloseTo(p1.ebit * (1 - 0.15), 2);
    expect(p1.nopat).not.toBeCloseTo(p1.ebit * (1 - 0.30), 2);
  });

  it("CAPEX explicit_path: pesimista y optimista usan el mismo valor literal que el caso base, año por año — no revenue×capexPct%", () => {
    const path = [10_000_000, 11_000_000, 12_000_000, 13_000_000, 14_000_000];
    const modified = withResolved({
      capexReinvestmentDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capexReinvestmentDriver, value: { mode: "explicit_path", explicitPath: path } },
    });
    const r = runCanonicalFinancialEngine(modified, SECTOR, GROWTH);
    for (let t = 0; t < 5; t++) {
      expect(r.scenarios.pessimistic.projections[t].capex).toBe(path[t]);
      expect(r.scenarios.optimistic.projections[t].capex).toBe(path[t]);
    }
  });

  it("CAPEX percent_of_revenue: se aplica al revenue propio de cada escenario (distinto del revenue del caso base, por el modificador de growth de escenario)", () => {
    const modified = withResolved({
      capexReinvestmentDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capexReinvestmentDriver, value: { mode: "percent_of_revenue", capexPctOfRevenue: 7 } },
    });
    const r = runCanonicalFinancialEngine(modified, SECTOR, GROWTH);
    const p1Pess = r.scenarios.pessimistic.projections[0];
    const p1Base = r.projections[0];
    expect(p1Pess.capex).toBeCloseTo(p1Pess.revenue * 0.07, 2);
    expect(p1Pess.revenue).not.toBe(p1Base.revenue); // growth de escenario distinto del caso base
    expect(p1Pess.capex).not.toBeCloseTo(p1Base.capex, 2); // por tanto el CAPEX resultante también difiere
  });

  it("D&A explicit_path: el escenario optimista usa el mismo valor literal que el caso base, año por año", () => {
    const path = [8_000_000, 9_000_000, 10_000_000, 11_000_000, 12_000_000];
    const modified = withResolved({
      depreciationDaDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.depreciationDaDriver, value: { mode: "explicit_path", explicitPath: path } },
    });
    const r = runCanonicalFinancialEngine(modified, SECTOR, GROWTH);
    for (let t = 0; t < 5; t++) {
      expect(r.scenarios.optimistic.projections[t].depreciation).toBe(path[t]);
    }
  });

  it("explicitDeltaNwcByYear: pesimista y optimista usan el mismo valor literal que el caso base, año por año — nunca el %revenue legacy", () => {
    const path = [1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000];
    const modified = withResolved({
      workingCapitalDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.workingCapitalDriver, value: { explicitDeltaNwcByYear: path } },
    });
    const r = runCanonicalFinancialEngine(modified, SECTOR, GROWTH);
    for (let t = 0; t < 5; t++) {
      expect(r.scenarios.pessimistic.projections[t].deltaWC).toBe(path[t]);
      expect(r.scenarios.optimistic.projections[t].deltaWC).toBe(path[t]);
    }
  });
});
