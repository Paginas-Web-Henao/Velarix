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

  // 4F.6C (UNIVERSAL_SCENARIO_SEMANTICS_MISMATCH) — corrección: esta
  // prueba asumía que el escenario tenía su PROPIO growth/revenue
  // (modificador legacy ×0.6/×1.4, nunca resuelto vía Judgment), y que
  // por tanto el CAPEX percent_of_revenue del escenario debía diferir
  // del caso base. Esa premisa era exactamente el bug — en v5,
  // pessimistic/optimistic reutilizan el MISMO forecast/revenue del caso
  // base (terminal-g-only overlay), así que el CAPEX percent_of_revenue
  // del escenario debe COINCIDIR con el del caso base, no diferir.
  it("CAPEX percent_of_revenue: pessimistic usa el MISMO revenue y por tanto el MISMO CAPEX que el caso base (v5, terminal-g-only overlay)", () => {
    const modified = withResolved({
      capexReinvestmentDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capexReinvestmentDriver, value: { mode: "percent_of_revenue", capexPctOfRevenue: 7 } },
    });
    const r = runCanonicalFinancialEngine(modified, SECTOR, GROWTH);
    const p1Pess = r.scenarios.pessimistic.projections[0];
    const p1Base = r.projections[0];
    expect(p1Pess.capex).toBeCloseTo(p1Pess.revenue * 0.07, 2);
    expect(p1Pess.revenue).toBe(p1Base.revenue);
    expect(p1Pess.capex).toBe(p1Base.capex);
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

// ─────────────────────────────────────────────────────────────────
// Escenarios (pesimista/optimista) — SEMÁNTICA v5 (4F.6C,
// UNIVERSAL_SCENARIO_SEMANTICS_MISMATCH). Confirmado en la auditoría
// 4F.6A: `mkScenario` aplica growth×0.6/1.4, margen∓3pp/±3pp y
// WACC±1.5pp/∓1.5pp como literales hardcoded que nunca fueron resueltos
// vía Judgment para ningún caso v5 — solo `terminalG.
// pessimisticScenarioPct/optimisticScenarioPct` es una decisión
// metodológica real (04 §11, `SENSITIVITY_OVERLAY`, no un business
// scenario recalibrado). Por tanto, en v5, `scenarios.pessimistic`/
// `optimistic` deben ser el MISMO forecast explícito y el MISMO WACC del
// caso base — el único grado de libertad es el `g` terminal resuelto.
// LEGACY (sin `resolved_assumptions`) permanece exactamente como
// siempre — esta corrección es exclusiva de la rama v5.
// ─────────────────────────────────────────────────────────────────

describe("Escenarios (pesimista/optimista) — V5: terminal-g-only overlay (4F.6C)", () => {
  const PROJECTION_FIELDS = ["revenue", "ebitda", "depreciation", "ebit", "nopat", "capex", "deltaWC", "fcff", "discountedFcf"] as const;

  it("RED 1 — pessimistic: el forecast explícito de los 5 años es IDÉNTICO al del caso base (revenue/ebitda/D&A/ebit/nopat/capex/ΔWC/fcff/discountedFcf) — solo cambia el terminal", () => {
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    for (let t = 0; t < 5; t++) {
      for (const field of PROJECTION_FIELDS) {
        expect(r.scenarios.pessimistic.projections[t][field]).toBe(r.projections[t][field]);
      }
    }
  });

  it("RED 2 — optimistic: el forecast explícito de los 5 años es IDÉNTICO al del caso base", () => {
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    for (let t = 0; t < 5; t++) {
      for (const field of PROJECTION_FIELDS) {
        expect(r.scenarios.optimistic.projections[t][field]).toBe(r.projections[t][field]);
      }
    }
  });

  it("RED 3 — scenario assumption metadata: growth/ebitdaMargin/wacc de pessimistic y optimistic igualan al caso base; solo terminalGrowth refleja el g resuelto de escenario", () => {
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    const pess = EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value.pessimisticScenarioPct;
    const opt = EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value.optimisticScenarioPct;

    expect(r.scenarios.pessimistic.assumptions.growth).toBe(r.scenarios.base.assumptions.growth);
    expect(r.scenarios.pessimistic.assumptions.ebitdaMargin).toBe(r.scenarios.base.assumptions.ebitdaMargin);
    expect(r.scenarios.pessimistic.assumptions.wacc).toBe(r.scenarios.base.assumptions.wacc);
    expect(r.scenarios.pessimistic.assumptions.terminalGrowth).toBe(pess);

    expect(r.scenarios.optimistic.assumptions.growth).toBe(r.scenarios.base.assumptions.growth);
    expect(r.scenarios.optimistic.assumptions.ebitdaMargin).toBe(r.scenarios.base.assumptions.ebitdaMargin);
    expect(r.scenarios.optimistic.assumptions.wacc).toBe(r.scenarios.base.assumptions.wacc);
    expect(r.scenarios.optimistic.assumptions.terminalGrowth).toBe(opt);
  });

  it("RED 4 — únicamente el terminal g cambia el EV de escenario: pessimistic/optimistic.ev reconcilian exactamente con ΣPV(FCFF base a WACC base) + PV(TV con el g de escenario) — sin reimplementar el forecast", () => {
    const r = runCanonicalFinancialEngine(withResolved({}), SECTOR, GROWTH);
    const waccBase = r.valuation.wacc / 100;
    const pessG = (EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value.pessimisticScenarioPct as number) / 100;
    const optG = (EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value.optimisticScenarioPct as number) / 100;

    expect(r.scenarios.pessimistic.ev).toBeCloseTo(recomputeEvAt(r.projections, waccBase, pessG), 6);
    expect(r.scenarios.optimistic.ev).toBeCloseTo(recomputeEvAt(r.projections, waccBase, optG), 6);
  });

  it("RED 5 (ya debe estar GREEN) — LEGACY sin resolved_assumptions: los escenarios siguen usando growth×0.6/1.4, margen∓3pp/±3pp, WACC±1.5pp/∓1.5pp — comportamiento histórico intacto", () => {
    const r = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    expect(r.scenarios.pessimistic.assumptions.growth).toBeCloseTo(r.scenarios.base.assumptions.growth * 0.6, 9);
    expect(r.scenarios.pessimistic.assumptions.ebitdaMargin).toBeCloseTo(r.scenarios.base.assumptions.ebitdaMargin - 3, 9);
    expect(r.scenarios.pessimistic.assumptions.wacc).toBeCloseTo(r.scenarios.base.assumptions.wacc + 1.5, 9);
    expect(r.scenarios.optimistic.assumptions.growth).toBeCloseTo(r.scenarios.base.assumptions.growth * 1.4, 9);
    expect(r.scenarios.optimistic.assumptions.ebitdaMargin).toBeCloseTo(r.scenarios.base.assumptions.ebitdaMargin + 3, 9);
    expect(r.scenarios.optimistic.assumptions.wacc).toBeCloseTo(r.scenarios.base.assumptions.wacc - 1.5, 9);
  });
});

// ─────────────────────────────────────────────────────────────────
// Sensitivity valuation (sensitivityMatrix/evLow/evHigh) — consumo de
// forecast drivers v5. 4F.6A (Velarix v5 Alpina) confirmó, con
// diferencia exacta 0 contra un cross-check independiente, que
// `sensitivityMatrix`/`evLow`/`evHigh` llaman a `computeProjections`
// SIN el argumento `v5Drivers` — exactamente el mismo fallback
// silencioso a tax/CAPEX/D&A/ΔWC legacy que Bloque 3C.5 ya corrigió
// para `scenarios.pessimistic`/`optimistic` (ver sección "Escenarios"
// arriba), pero que nunca se extendió a estos tres call sites. Universal
// — no es Alpina-specific: cualquier ejecución v5 cuyos drivers
// resueltos difieran de los defaults legacy (CAPEX 5%, D&A 3%, ΔWC 3%,
// tax 30%) produce un centro de matriz (waccDelta=0, growthDelta=0) que
// NO reproduce `valuation.enterpriseValue`, y `evLow`/`evHigh`
// calculados sobre un forecast distinto del que el caso realmente usa.
// ─────────────────────────────────────────────────────────────────

/**
 * Recalcula EV a partir de los FCFF YA PRODUCIDOS por una ejecución v5
 * correcta (`r.projections[t].fcff` — no depende de WACC, solo de
 * revenue/margen/CAPEX/D&A/tax, ya consumidos correctamente en el caso
 * base) descontados a un WACC/g distintos. Reutiliza únicamente la
 * aritmética de descuento/Gordon Growth ya usada en los tests de
 * "Terminal g" de este mismo archivo — nunca reimplementa CAPEX/D&A/tax,
 * que es exactamente lo que este bloque audita en producción.
 */
function recomputeEvAt(projections: { fcff: number }[], wacc: number, g: number): number {
  const sumPV = projections.reduce((s, p, i) => s + p.fcff / Math.pow(1 + wacc, i + 1), 0);
  const tv = (projections[4].fcff * (1 + g)) / (wacc - g);
  const pvTv = tv / Math.pow(1 + wacc, 5);
  return sumPV + pvTv;
}

describe("Sensitivity valuation (matrix/evLow/evHigh) — V5 OBJETIVO: debe usar los MISMOS v5Drivers que el caso base, nunca legacy", () => {
  // Deliberadamente MUY distintos de los defaults legacy (CAPEX 5%, D&A
  // 3%, ΔWC 3%, tax 30%, financial-methodology.ts) — si cualquier celda
  // cayera a legacy, estas aserciones lo expondrían de inmediato, sin
  // depender de que el fixture por defecto ya sea distinto por casualidad.
  const SENSITIVITY_CAPEX_PATH = [200_000_000, 210_000_000, 220_000_000, 230_000_000, 240_000_000];
  const SENSITIVITY_DA_PATH = [150_000_000, 155_000_000, 160_000_000, 165_000_000, 170_000_000];
  const SENSITIVITY_WC_PATH = [5_000_000, 5_500_000, 6_000_000, 6_500_000, 7_000_000];
  const SENSITIVITY_TAX = [60, 60, 60, 60, 60];

  function withDistinctDrivers() {
    return withResolved({
      capexReinvestmentDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capexReinvestmentDriver, value: { mode: "explicit_path", explicitPath: SENSITIVITY_CAPEX_PATH } },
      depreciationDaDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.depreciationDaDriver, value: { mode: "explicit_path", explicitPath: SENSITIVITY_DA_PATH } },
      workingCapitalDriver: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.workingCapitalDriver, value: { explicitDeltaNwcByYear: SENSITIVITY_WC_PATH } },
      taxTreatment: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment, value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value, explicitFcffTaxRatePctByYear: SENSITIVITY_TAX } },
    });
  }

  it("RED 1 — center invariant: sensitivityMatrix[waccDelta=0,growthDelta=0].ev debe coincidir con valuation.enterpriseValue (mismo forecast/WACC/g base)", () => {
    const r = runCanonicalFinancialEngine(withDistinctDrivers(), SECTOR, GROWTH);
    const center = r.sensitivityMatrix.find((c) => c.waccDelta === 0 && c.growthDelta === 0);
    expect(center).toBeDefined();
    expect(center!.ev).toBeCloseTo(r.valuation.enterpriseValue, 2);
  });

  it("RED 2 — evLow debe coincidir con el FCFF v5 base recalculado a WACC+1pp (mismo g), y con sensitivityMatrix[waccDelta=+1,growthDelta=0] — no con un forecast legacy distinto", () => {
    const r = runCanonicalFinancialEngine(withDistinctDrivers(), SECTOR, GROWTH);
    const g = EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value.valuePct / 100;
    const waccHigh = r.valuation.wacc / 100 + 0.01;
    const expected = recomputeEvAt(r.projections, waccHigh, g);
    expect(r.valuation.evLow).toBeCloseTo(expected, 2);
    const cell = r.sensitivityMatrix.find((c) => c.waccDelta === 1 && c.growthDelta === 0);
    expect(r.valuation.evLow).toBeCloseTo(cell!.ev, 6);
  });

  it("RED 3 — evHigh debe coincidir con el FCFF v5 base recalculado a WACC-1pp (mismo g), y con sensitivityMatrix[waccDelta=-1,growthDelta=0]", () => {
    const r = runCanonicalFinancialEngine(withDistinctDrivers(), SECTOR, GROWTH);
    const g = EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value.valuePct / 100;
    const waccLow = r.valuation.wacc / 100 - 0.01;
    const expected = recomputeEvAt(r.projections, waccLow, g);
    expect(r.valuation.evHigh).toBeCloseTo(expected, 2);
    const cell = r.sensitivityMatrix.find((c) => c.waccDelta === -1 && c.growthDelta === 0);
    expect(r.valuation.evHigh).toBeCloseTo(cell!.ev, 6);
  });

  it("RED 4 — driver preservation: TODA la fila growthDelta=0 de sensitivityMatrix debe ser consistente con el FCFF v5 resuelto (CAPEX/D&A/ΔWC/tax deliberadamente distintos de legacy) — una sensibilidad de WACC/g nunca debe reconstruir un forecast legacy", () => {
    const r = runCanonicalFinancialEngine(withDistinctDrivers(), SECTOR, GROWTH);
    const g = EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value.valuePct / 100;
    for (const wd of [-2, -1, 0, 1, 2]) {
      const wacc = r.valuation.wacc / 100 + wd / 100;
      const cell = r.sensitivityMatrix.find((c) => c.waccDelta === wd && c.growthDelta === 0);
      expect(cell).toBeDefined();
      if (wacc <= g) {
        expect(cell!.ev).toBe(0);
        continue;
      }
      const expected = recomputeEvAt(r.projections, wacc, g);
      expect(cell!.ev).toBeCloseTo(expected, 2);
    }
  });

  it("RED 5 (monotonicidad, protege el significado financiero de la matriz sin congelar las 25 celdas): a mismo g, subir WACC baja EV; a misma WACC, subir g sube EV", () => {
    const r = runCanonicalFinancialEngine(withDistinctDrivers(), SECTOR, GROWTH);
    const cellsByWacc = [-2, -1, 0, 1, 2].map((wd) => r.sensitivityMatrix.find((c) => c.waccDelta === wd && c.growthDelta === 0)!.ev);
    for (let i = 1; i < cellsByWacc.length; i++) {
      expect(cellsByWacc[i]).toBeLessThan(cellsByWacc[i - 1]); // wd creciente → EV decreciente
    }
    const cellsByGrowth = [-2, -1, 0, 1, 2].map((gd) => r.sensitivityMatrix.find((c) => c.waccDelta === 0 && c.growthDelta === gd)!.ev);
    for (let i = 1; i < cellsByGrowth.length; i++) {
      expect(cellsByGrowth[i]).toBeGreaterThan(cellsByGrowth[i - 1]); // gd creciente → EV creciente
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Base historical KPIs — V5 observed Evidence (4F.6D1/4F.6D2,
// RC-KPI-NetIncome / RC-KPI-Assets). Confirmado en la auditoría 4F.6D1:
// `net_income` ya fluye completo hasta el borde del motor (cuenta
// canónica real, `structured-input-derivations.ts` la extrae como
// passthrough puro), pero `canonical-financial-engine.ts` nunca la lee
// — `netIncome0` se sintetiza siempre vía `(ebit0-interestExpense)×
// (1-30%legacy)`, y `roa` usa `totalDebt+equity` como proxy en vez de
// `total_assets` real. Decisión 7 (`DECISIONES-FINANCIERAS-APROBADAS-
// POR-FUNDADOR.md`, ya aprobada por el fundador): "utilidad neta para
// ROE, utilidad neta para ROA, NOPAT para el flujo de caja del DCF" —
// esto es implementación pendiente de una decisión ya cerrada, no una
// metodología por decidir. `total_assets` (Decisión 6: "debe usarse
// total_assets real cuando exista") es cuenta canónica real, pero el
// tipo lightweight del motor (`CanonicalBalanceSheet`) todavía no la
// declara — se referencia aquí vía cast, sin tocar producción todavía.
// ─────────────────────────────────────────────────────────────────

const KPI_BASE_INCOME = { revenue: 100, cost_of_sales: 50, opex: 10, da: 5, interest_expense: 2 };

/** LEGACY explícito — nunca incluye la clave `resolved_assumptions`. */
function kpiInputLegacy(income: Record<string, unknown>, balance: Record<string, unknown>): CanonicalStructuredInput {
  return {
    income_statement: { ...KPI_BASE_INCOME, ...income },
    balance_sheet: { financial_debt_total: 30, cash: 10, ...balance },
    moneda_analisis: "COP",
    factor_conversion: 1,
  } as CanonicalStructuredInput;
}

/** V5 — incluye siempre la clave `resolved_assumptions` (activa isV5Execution). */
function kpiInputV5(
  income: Record<string, unknown>,
  balance: Record<string, unknown>,
  resolvedOverrides: Partial<ResolvedCalculationAssumptions> = {},
): CanonicalStructuredInput {
  return {
    ...kpiInputLegacy(income, balance),
    resolved_assumptions: { ...EXAMPLE_RESOLVED_ASSUMPTIONS, ...resolvedOverrides },
  } as CanonicalStructuredInput;
}

describe("Base historical KPIs (netMargin/ROE/ROA) — V5: Evidence observada, nunca sintética", () => {
  it("RED 1 — con net_income/equity/total_assets observados, netMargin/ROE/ROA usan Evidence real (revenue=100,net_income=10,equity=40,total_assets=200 → 10%/25%/5%)", () => {
    const r = runCanonicalFinancialEngine(kpiInputV5({ net_income: 10 }, { equity: 40, total_assets: 200 }), SECTOR, GROWTH);
    expect(r.kpis.netMargin).toBeCloseTo(10, 6);
    expect(r.kpis.roe).toBeCloseTo(25, 6);
    expect(r.kpis.roa).toBeCloseTo(5, 6);
  });

  it("RED 2 — tax invariance: netMargin/ROE/ROA son idénticos entre dos ejecuciones v5 con tax completamente distinto, cuando net_income está observado (el tax v5 sí afecta WACC, confirmando que el aislamiento es específico de estos 3 KPIs)", () => {
    const a = runCanonicalFinancialEngine(kpiInputV5({ net_income: 10 }, { equity: 40, total_assets: 200 }), SECTOR, GROWTH);
    const b = runCanonicalFinancialEngine(
      kpiInputV5({ net_income: 10 }, { equity: 40, total_assets: 200 }, {
        taxTreatment: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment, value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value, marginalRatePct: 5, debtTaxShieldRatePct: 5, explicitFcffTaxRatePctByYear: [5, 5, 5, 5, 5] } },
      }),
      SECTOR, GROWTH,
    );
    expect(a.kpis.netMargin).toBe(b.kpis.netMargin);
    expect(a.kpis.roe).toBe(b.kpis.roe);
    expect(a.kpis.roa).toBe(b.kpis.roa);
    expect(a.valuation.wacc).not.toBe(b.valuation.wacc);
  });

  it("RED 3 — net_income ausente (clave omitida) o explícitamente null: netMargin/ROE/ROA = null en ambos casos, nunca un número sintético", () => {
    const omitted = runCanonicalFinancialEngine(kpiInputV5({}, { equity: 40, total_assets: 200 }), SECTOR, GROWTH);
    const explicitNull = runCanonicalFinancialEngine(kpiInputV5({ net_income: null }, { equity: 40, total_assets: 200 }), SECTOR, GROWTH);
    for (const r of [omitted, explicitNull]) {
      expect(r.kpis.netMargin).toBeNull();
      expect(r.kpis.roe).toBeNull();
      expect(r.kpis.roa).toBeNull();
    }
  });

  it("RED 4 — net_income=0 observado (AUSENTE != 0): netMargin/ROE/ROA = 0, nunca null", () => {
    const r = runCanonicalFinancialEngine(kpiInputV5({ net_income: 0 }, { equity: 40, total_assets: 200 }), SECTOR, GROWTH);
    expect(r.kpis.netMargin).toBe(0);
    expect(r.kpis.roe).toBe(0);
    expect(r.kpis.roa).toBe(0);
  });

  it("RED 5 — total_assets ausente: netMargin/ROE numéricos correctos, ROA=null — nunca cae al proxy totalDebt+equity (30+40=70 → 14.2857%, valor deliberadamente distinto para exponer el proxy si reaparece)", () => {
    const r = runCanonicalFinancialEngine(kpiInputV5({ net_income: 10 }, { equity: 40 }), SECTOR, GROWTH);
    expect(r.kpis.netMargin).toBeCloseTo(10, 6);
    expect(r.kpis.roe).toBeCloseTo(25, 6);
    expect(r.kpis.roa).toBeNull();
  });

  it("RED 6 — equity=0 y equity<0 con net_income observado: ROE=null (regresión RC-1 preservada, nunca Math.abs)", () => {
    const zero = runCanonicalFinancialEngine(kpiInputV5({ net_income: 10 }, { equity: 0, total_assets: 200 }), SECTOR, GROWTH);
    const negative = runCanonicalFinancialEngine(kpiInputV5({ net_income: 10 }, { equity: -40, total_assets: 200 }), SECTOR, GROWTH);
    expect(zero.kpis.roe).toBeNull();
    expect(negative.kpis.roe).toBeNull();
  });

  it("RED 7 — LEGACY (sin resolved_assumptions): netMargin/ROE/ROA conservan exactamente la fórmula sintética histórica, ignorando net_income/total_assets observados", () => {
    const r = runCanonicalFinancialEngine(kpiInputLegacy({ net_income: 10 }, { equity: 40, total_assets: 200 }), SECTOR, GROWTH);
    // ebitda0=100-50-10+5=45; ebit0=45-5=40; netIncome0=(40-2)×(1-0.30)=26.6.
    // totalAssets legacy = totalDebt+equity = 30+40=70 (ignora total_assets=200 observado).
    expect(r.kpis.netMargin).toBeCloseTo(26.6, 6);
    expect(r.kpis.roe).toBeCloseTo(66.5, 6);
    expect(r.kpis.roa).toBeCloseTo((26.6 / 70) * 100, 6);
  });

  it("RED 8 (control, DCF isolation) — cambiar net_income/total_assets no afecta ningún output DCF-critical", () => {
    const a = runCanonicalFinancialEngine(kpiInputV5({ net_income: 10 }, { equity: 40, total_assets: 200 }), SECTOR, GROWTH);
    const b = runCanonicalFinancialEngine(kpiInputV5({ net_income: 999 }, { equity: 40, total_assets: 999_999 }), SECTOR, GROWTH);
    expect(b.valuation.betaLevered).toBe(a.valuation.betaLevered);
    expect(b.valuation.costOfEquity).toBe(a.valuation.costOfEquity);
    expect(b.valuation.wacc).toBe(a.valuation.wacc);
    a.projections.forEach((p, i) => expect(b.projections[i].fcff).toBe(p.fcff));
    expect(b.valuation.terminalValue).toBe(a.valuation.terminalValue);
    expect(b.valuation.discountedTV).toBe(a.valuation.discountedTV);
    expect(b.valuation.enterpriseValue).toBe(a.valuation.enterpriseValue);
    expect(b.valuation.netDebt).toBe(a.valuation.netDebt);
    expect(b.valuation.equityValue).toBe(a.valuation.equityValue);
  });
});
