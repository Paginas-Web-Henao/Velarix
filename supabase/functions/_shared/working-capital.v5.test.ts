// Bloque 3B (tests-first) + Bloque 3C.4 (implementación) — RC-4 (working
// capital v5 vía explicit_delta_nwc_by_year),
// docs/velarix-v5/05-financial-engine-audit.md v1.3 §3, §5, §8. Llama a
// la función REAL de producción (`runCanonicalFinancialEngine`) — nunca
// reimplementa su lógica ni la del ΔWC.
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
  };
}

// Bloque 3C.4 — corrección: la "HOY" original comparaba una ejecución v5
// completa (con workingCapitalDriver como único override explícito, pero
// tax/CAPEX/D&A/capital-structure de EXAMPLE_RESOLVED_ASSUMPTIONS
// también presentes) contra el comportamiento legacy — válido solo
// mientras NADA se consumía. Ahora que Tax/CAPEX/D&A/capital-structure SÍ
// se consumen en v5 (3C.2-3C.4), esa comparación ya no aísla nada — se
// retira; reemplazada por una verificación LEGACY genuina (sin la clave
// `resolved_assumptions` en absoluto).
describe("Working capital — LEGACY (sin resolved_assumptions, verde — compatibilidad con golden cases)", () => {
  it("deltaWC se calcula como revenue_t × wcPct/100 legacy (3%, financial-methodology.ts)", () => {
    const r = runCanonicalFinancialEngine(BASE_INPUT, SECTOR, GROWTH);
    for (const p of r.projections) {
      expect(p.deltaWC).toBeCloseTo(p.revenue * 0.03, 2);
    }
  });
});

describe("Working capital — V5 OBJETIVO", () => {
  it("cada año t usa exactamente explicit_delta_nwc_by_year[t] como deltaWC — no revenue×wcPct%", () => {
    const r = runCanonicalFinancialEngine(withResolvedWc(EXPLICIT_DELTA_NWC), SECTOR, GROWTH);
    for (let t = 0; t < 5; t++) {
      expect(r.projections[t].deltaWC).toBe(EXPLICIT_DELTA_NWC[t]);
    }
  });

  it("FCFF_t = NOPAT_t + D&A_t - CAPEX_t - explicit_delta_nwc_by_year[t]", () => {
    const r = runCanonicalFinancialEngine(withResolvedWc(EXPLICIT_DELTA_NWC), SECTOR, GROWTH);
    for (let t = 0; t < 5; t++) {
      const p = r.projections[t];
      expect(p.fcff).toBeCloseTo(p.nopat + p.depreciation - p.capex - EXPLICIT_DELTA_NWC[t], 2);
    }
  });

  // Bloque 3C.4 (cierre de cobertura) — dos ejecuciones v5 IDÉNTICAS
  // salvo el ΔWC del año 1: caso A = 0 (ninguna liberación/consumo de
  // capital de trabajo), caso B = negativo (liberación de capital de
  // trabajo). Con NOPAT/D&A/CAPEX idénticos entre A y B (ningún otro
  // driver cambió), la identidad algebraica exacta es
  // FCFF = NOPAT + D&A - CAPEX - ΔWC ⟹ FCFF_B - FCFF_A = -(ΔWC_B - ΔWC_A) = -ΔWC_B
  // (ya que ΔWC_A = 0). Una liberación de capital de trabajo (ΔWC < 0)
  // por tanto AUMENTA el FCFF — exactamente en el monto liberado.
  it("ΔNWC negativo (liberación de capital de trabajo) aumenta FCFF exactamente en -ΔNWC — caso A: ΔNWC_year1=0, caso B: ΔNWC_year1<0", () => {
    const deltaByYearA = [0, ...EXPLICIT_DELTA_NWC.slice(1)];
    const deltaWcYear1B = -5_500_000; // negativo: liberación de capital de trabajo
    const deltaByYearB = [deltaWcYear1B, ...EXPLICIT_DELTA_NWC.slice(1)];

    const resultA = runCanonicalFinancialEngine(withResolvedWc(deltaByYearA), SECTOR, GROWTH);
    const resultB = runCanonicalFinancialEngine(withResolvedWc(deltaByYearB), SECTOR, GROWTH);

    const p1A = resultA.projections[0];
    const p1B = resultB.projections[0];
    // Mismo NOPAT/D&A/CAPEX en ambos casos — ningún otro driver cambió.
    expect(p1B.nopat).toBeCloseTo(p1A.nopat, 6);
    expect(p1B.depreciation).toBe(p1A.depreciation);
    expect(p1B.capex).toBe(p1A.capex);
    expect(p1A.deltaWC).toBe(0);
    expect(p1B.deltaWC).toBe(deltaWcYear1B);

    expect(p1B.fcff - p1A.fcff).toBeCloseTo(-deltaWcYear1B, 2);
    expect(p1B.fcff).toBeGreaterThan(p1A.fcff);
  });

  it("cambiar únicamente ΔNWC del año 3 afecta solo el FCFF/discountedFcf de ese año y el downstream (EV) — no los años 1, 2, 4 y 5", () => {
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

  it("no interpreta explicit_delta_nwc_by_year como NWC/Revenue ni como % de ingresos — usa los valores literales, aunque no guarden ninguna proporción con revenue", () => {
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
