// Bloque 3B — Tests-first de RC-4 (working capital v5 vía
// explicit_delta_nwc_by_year), docs/velarix-v5/05-financial-engine-audit.md
// v1.3 §3, §5, §8. Llama a la función REAL de producción
// (`runCanonicalFinancialEngine`) — nunca reimplementa su lógica ni la
// del ΔWC. No se modifica canonical-financial-engine.ts en este bloque.
//
// Solución mínima congelada (05 v1.3 §3): el motor debe consumir
// `explicit_delta_nwc_by_year[t]` literalmente en
// `FCFF_t = NOPAT_t + D&A_t - CAPEX_t - ΔNWC_t`. NO se prueba aquí
// `baseOperatingNwc + ratio` (alternativa general, NOT BUILDING IN
// V5.0). La reconciliation `ΔNWC_t = OperatingNWC_t - OperatingNWC_{t-1}`
// es responsabilidad del Expediente/cross-check (05 v1.3 §8) — no del
// motor, y no se prueba en este archivo.

import { describe, it, expect } from "vitest";
import { runCanonicalFinancialEngine, type CanonicalStructuredInput } from "./canonical-financial-engine";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";

const BASE_INPUT: CanonicalStructuredInput = {
  income_statement: { revenue: 1_000_000_000, cost_of_sales: 500_000_000, opex: 100_000_000, da: 50_000_000, interest_expense: 20_000_000 },
  balance_sheet: { financial_debt_total: 200_000_000, cash: 100_000_000, equity: 800_000_000 },
  moneda_analisis: "COP",
  factor_conversion: 1,
};

const SECTOR = "Manufactura";
const GROWTH = 10;

// Deliberadamente NO proporcionales a revenue (ni entre sí) — para que
// ningún residuo de interpretación "% de ingresos" pueda coincidir por
// casualidad con estos valores.
const EXPLICIT_DELTA_NWC: [number, number, number, number, number] = [
  12_345_000, 41_000_000, 3_210_000, 27_800_000, 9_990_000,
];

function withResolvedWc(deltaByYear: number[]): CanonicalStructuredInput {
  return {
    ...BASE_INPUT,
    resolved_assumptions: {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      workingCapitalDriver: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.workingCapitalDriver,
        value: { explicitDeltaNwcByYear: deltaByYear },
      },
    },
  } as any;
}

describe("Working capital — HOY (caracterización, verde)", () => {
  it("deltaWC se calcula como revenue_t × wcPct/100, ignorando cualquier explicit_delta_nwc_by_year proporcionado", () => {
    const withWc = runCanonicalFinancialEngine(withResolvedWc(EXPLICIT_DELTA_NWC), SECTOR, GROWTH);
    const withoutWc = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    expect(withWc.projections).toEqual(withoutWc.projections);
    // El wcPct legacy (3%, financial-methodology.ts) sigue determinando el ΔWC del año 1.
    const wcPctLegacy = 3;
    const expectedDeltaWcY1 = withoutWc.projections[0].revenue * (wcPctLegacy / 100);
    expect(withoutWc.projections[0].deltaWC).toBeCloseTo(expectedDeltaWcY1, 2);
  });
});

describe("Working capital — V5 OBJETIVO (rojo esperado hasta implementar RC-4)", () => {
  it.fails("cada año t usa exactamente explicit_delta_nwc_by_year[t] como deltaWC — no revenue×wcPct%", () => {
    const r = runCanonicalFinancialEngine(withResolvedWc(EXPLICIT_DELTA_NWC), SECTOR, GROWTH);
    for (let t = 0; t < 5; t++) {
      expect(r.projections[t].deltaWC).toBe(EXPLICIT_DELTA_NWC[t]);
    }
  });

  it.fails("FCFF_t = NOPAT_t + D&A_t - CAPEX_t - explicit_delta_nwc_by_year[t]", () => {
    const r = runCanonicalFinancialEngine(withResolvedWc(EXPLICIT_DELTA_NWC), SECTOR, GROWTH);
    for (let t = 0; t < 5; t++) {
      const p = r.projections[t];
      expect(p.fcff).toBeCloseTo(p.nopat + p.depreciation - p.capex - EXPLICIT_DELTA_NWC[t], 2);
    }
  });

  it.fails("cambiar únicamente ΔNWC del año 3 afecta solo el FCFF/discountedFcf de ese año y el downstream (EV) — no los años 1, 2, 4 y 5", () => {
    const variantA = EXPLICIT_DELTA_NWC;
    const variantB: [number, number, number, number, number] = [...EXPLICIT_DELTA_NWC];
    variantB[2] = variantB[2] + 15_000_000; // solo año 3 (índice 2) cambia

    const resultA = runCanonicalFinancialEngine(withResolvedWc(variantA), SECTOR, GROWTH);
    const resultB = runCanonicalFinancialEngine(withResolvedWc(variantB), SECTOR, GROWTH);

    // Años no relacionados: sin cambio.
    expect(resultB.projections[0].fcff).toBe(resultA.projections[0].fcff);
    expect(resultB.projections[1].fcff).toBe(resultA.projections[1].fcff);
    expect(resultB.projections[3].fcff).toBe(resultA.projections[3].fcff);
    expect(resultB.projections[4].fcff).toBe(resultA.projections[4].fcff);

    // Año 3: cambia, y su valor descontado también.
    expect(resultB.projections[2].fcff).not.toBe(resultA.projections[2].fcff);
    expect(resultB.projections[2].discountedFcf).not.toBe(resultA.projections[2].discountedFcf);

    // Downstream: el Enterprise Value debe reflejar el cambio.
    expect(resultB.valuation.enterpriseValue).not.toBe(resultA.valuation.enterpriseValue);
  });

  it.fails("no interpreta explicit_delta_nwc_by_year como NWC/Revenue ni como % de ingresos — usa los valores literales, aunque no guarden ninguna proporción con revenue", () => {
    // Los valores de EXPLICIT_DELTA_NWC no son proporcionales entre sí
    // ni a revenue_t — si el motor los tratara como wcPct% (revenue×ratio)
    // en vez de como delta literal, el resultado no podría coincidir con
    // estos números exactos para los 5 años simultáneamente.
    const r = runCanonicalFinancialEngine(withResolvedWc(EXPLICIT_DELTA_NWC), SECTOR, GROWTH);
    const impliedRatios = r.projections.map((p, t) => EXPLICIT_DELTA_NWC[t] / p.revenue);
    const allRatiosEqual = impliedRatios.every((ratio) => Math.abs(ratio - impliedRatios[0]) < 1e-9);
    expect(allRatiosEqual).toBe(false); // confirma que el fixture no es, por accidente, un caso proporcional
    for (let t = 0; t < 5; t++) {
      expect(r.projections[t].deltaWC).toBe(EXPLICIT_DELTA_NWC[t]);
    }
  });
});
