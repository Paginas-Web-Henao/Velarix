// Bloque 1C-Prep (cierre técnico) — Regresiones financieras reales sobre
// el motor SERVIDOR canónico. Importa exactamente
// `runCanonicalFinancialEngine` — la misma función que
// `ejecutar-calculo/index.ts` usa para producir `calculation_result` —
// nunca una copia de sus fórmulas.
//
// "Caso dorado técnico provisional — pendiente de aprobación
// financiera." Los valores esperados de abajo se calcularon UNA VEZ
// ejecutando el motor canónico actual contra los 3 fixtures — no se
// reimplementan las fórmulas dentro de esta prueba. Una modificación
// futura material en WACC/EV/equity value debe hacer fallar estas
// pruebas.

import { describe, it, expect } from "vitest";
import { runCanonicalFinancialEngine } from "./canonical-financial-engine";
import {
  CASO_A_ESTABLE_SERVIDOR,
  CASO_B_ALTO_CRECIMIENTO_SERVIDOR,
  CASO_C_TENSIONADA_SERVIDOR,
  type GoldenCaseServerFixture,
} from "./canonical-financial-engine.golden-cases.fixtures";

// Tolerancias explícitas (ver instrucción de cierre técnico):
// - tasas (wacc, costOfEquity, costOfDebtAfterTax, betaLevered): máx. 0.01 puntos
//   porcentuales — aplicada abajo vía `toBeCloseTo(..., 2)`, que exige
//   |actual-esperado| < 0.005pp, igual o más estricta que 0.01pp.
// - valores monetarios (EV, equity value, net debt, FCFF, terminal value): máx. 0.1% o
//   tolerancia absoluta de 1000 (lo que sea mayor), documentada aquí.
// - campos discretos (waccWarning): igualdad exacta.

function expectMonetaryClose(actual: number, expected: number, label: string) {
  const relativeTolerance = Math.abs(expected) * 0.001; // 0.1%
  const tolerance = Math.max(relativeTolerance, 1000); // piso absoluto de 1000 (unidad monetaria)
  expect(Math.abs(actual - expected), `${label}: esperado ${expected}, obtenido ${actual}`).toBeLessThanOrEqual(tolerance);
}

interface ExpectedCanonicalResult {
  wacc: number;
  betaLevered: number;
  costOfEquity: number;
  costOfDebtAfterTax: number;
  enterpriseValue: number;
  equityValue: number;
  netDebt: number;
  terminalValue: number;
  fcffY1: number;
  fcffY5: number;
  waccWarning: string | null;
}

// Calculados UNA VEZ ejecutando runCanonicalFinancialEngine contra cada
// fixture (2026-07-23) — ver docs/velarix/bloque-1c/CASOS-DORADOS-PROVISIONALES.md
// para el registro completo, incluyendo campos adicionales (KPIs, rango
// de sensibilidad) que no se repiten aquí como regresión estricta.
const EXPECTED_CASE_A: ExpectedCanonicalResult = {
  wacc: 9.9202,
  betaLevered: 1.208667,
  costOfEquity: 11.360267,
  costOfDebtAfterTax: 5.6,
  enterpriseValue: 12_766_089_939,
  equityValue: 12_366_089_939,
  netDebt: 400_000_000,
  terminalValue: 15_476_070_647,
  fcffY1: 660_800_000,
  fcffY5: 1_039_781_593,
  waccWarning: null,
};

const EXPECTED_CASE_B: ExpectedCanonicalResult = {
  wacc: 11.361348,
  betaLevered: 1.28832,
  costOfEquity: 11.822256,
  costOfDebtAfterTax: 5.6,
  enterpriseValue: 9_615_506_880,
  equityValue: 9_915_506_880,
  netDebt: -300_000_000,
  terminalValue: 13_107_172_559,
  fcffY1: 240_700_000,
  fcffY5: 1_064_015_854,
  waccWarning: null,
};

// Bloque 3C.2 (RC-1 + RC-2, docs/velarix-v5/05-financial-engine-audit.md
// v1.3 §4) — decisión de diseño explícita, no un olvido: los valores de
// este caso NO cambiaron. `runCanonicalFinancialEngine` invoca
// `computeCapitalStructure` con la firma legacy de 3 argumentos, sin la
// propiedad `resolvedAssumptions` — eso es "legacy" por PRESENCIA de la
// clave (`capital-structure.ts`, mismo criterio que
// `calculation-preflight.ts` desde 3C.1), sin importar el signo de
// `equity`. `04 §3.2`/RC-1 exige que Evidence (`resolveEffectiveEquity`)
// preserve el signo real (-500_000_000, ya no +500_000_000 vía
// `Math.abs()`) — pero `05 v1.3 §4` autoriza explícitamente que el
// cálculo MECÁNICO legacy reproduzca su comportamiento histórico
// mientras no exista contexto v5, para no romper los golden cases A/B/C.
// La rama legacy de `computeCapitalStructure` aplica esa compatibilidad
// de forma local y documentada (`Math.abs(equity ?? 0)`, SOLO para
// derivar los weights) sin alterar el `equity` de Evidence en ningún
// otro punto del pipeline — así que el resultado numérico de este caso
// es idéntico al de antes de la corrección: el bug de signo vivía en
// Evidence (ya corregido), no en la fórmula legacy en sí (deliberadamente
// preservada).
const EXPECTED_CASE_C: ExpectedCanonicalResult = {
  wacc: 10.480044,
  betaLevered: 7.788,
  costOfEquity: 49.5204,
  costOfDebtAfterTax: 5.6,
  enterpriseValue: -4_239_525_044,
  equityValue: 0,
  netDebt: 3_950_000_000,
  terminalValue: -4_973_544_147,
  fcffY1: -297_150_000,
  fcffY5: -361_187_682,
  waccWarning: null,
};

const CASOS: [string, GoldenCaseServerFixture, ExpectedCanonicalResult][] = [
  ["A (estable)", CASO_A_ESTABLE_SERVIDOR, EXPECTED_CASE_A],
  ["B (alto crecimiento)", CASO_B_ALTO_CRECIMIENTO_SERVIDOR, EXPECTED_CASE_B],
  ["C (tensionada)", CASO_C_TENSIONADA_SERVIDOR, EXPECTED_CASE_C],
];

describe("runCanonicalFinancialEngine — regresiones financieras reales (motor servidor)", () => {
  it.each(CASOS)("Caso %s: WACC, beta, costos de capital (tolerancia 0.01pp)", (_nombre, fixture, expected) => {
    const r = runCanonicalFinancialEngine(fixture.input, fixture.sector, fixture.expectedGrowth);
    expect(r.valuation.wacc).toBeCloseTo(expected.wacc, 2);
    expect(r.valuation.betaLevered).toBeCloseTo(expected.betaLevered, 2);
    expect(r.valuation.costOfEquity).toBeCloseTo(expected.costOfEquity, 2);
    expect(r.valuation.costOfDebtAfterTax).toBeCloseTo(expected.costOfDebtAfterTax, 2);
    // toBeCloseTo(..., 2) ya exige |actual-esperado| < 0.005 puntos porcentuales,
    // igual o más estricta que la tolerancia máxima de 0.01pp documentada
    // arriba — no se repite la comparación como una segunda aserción redundante.
  });

  it.each(CASOS)("Caso %s: Enterprise Value, Equity Value, Net Debt (tolerancia 0.1% o 1000)", (_nombre, fixture, expected) => {
    const r = runCanonicalFinancialEngine(fixture.input, fixture.sector, fixture.expectedGrowth);
    expectMonetaryClose(r.valuation.enterpriseValue, expected.enterpriseValue, "enterpriseValue");
    expectMonetaryClose(r.valuation.equityValue, expected.equityValue, "equityValue");
    expectMonetaryClose(r.valuation.netDebt, expected.netDebt, "netDebt");
  });

  it.each(CASOS)("Caso %s: valor terminal y FCFF de Y1/Y5 (tolerancia 0.1% o 1000)", (_nombre, fixture, expected) => {
    const r = runCanonicalFinancialEngine(fixture.input, fixture.sector, fixture.expectedGrowth);
    expectMonetaryClose(r.valuation.terminalValue, expected.terminalValue, "terminalValue");
    expectMonetaryClose(r.projections[0].fcff, expected.fcffY1, "fcffY1");
    expectMonetaryClose(r.projections[4].fcff, expected.fcffY5, "fcffY5");
  });

  it.each(CASOS)("Caso %s: waccWarning (igualdad exacta)", (_nombre, fixture, expected) => {
    const r = runCanonicalFinancialEngine(fixture.input, fixture.sector, fixture.expectedGrowth);
    expect(r.valuation.waccWarning).toBe(expected.waccWarning);
  });
});

describe("Identidades financieras (motor servidor) — no sustituyen las regresiones numéricas de arriba", () => {
  it.each(CASOS)("Caso %s: equityValue = max(enterpriseValue - netDebt, 0)", (_nombre, fixture) => {
    const r = runCanonicalFinancialEngine(fixture.input, fixture.sector, fixture.expectedGrowth);
    expect(r.valuation.equityValue).toBeCloseTo(Math.max(r.valuation.enterpriseValue - r.valuation.netDebt, 0), 2);
  });

  it.each(CASOS)("Caso %s: cada fcff proyectado es consistente con nopat + D&A - capex - ΔWC", (_nombre, fixture) => {
    const r = runCanonicalFinancialEngine(fixture.input, fixture.sector, fixture.expectedGrowth);
    for (const p of r.projections) {
      expect(p.fcff).toBeCloseTo(p.nopat + p.depreciation - p.capex - p.deltaWC, 6);
    }
  });

  it("Caso C: revenue=0 sigue siendo rechazado por el motor servidor (comportamiento conservado, no decidido de nuevo aquí)", () => {
    expect(() => runCanonicalFinancialEngine({ income_statement: { revenue: 0 }, balance_sheet: {} }, "Manufactura", 5))
      .toThrow("Revenue es 0 — no se puede calcular valoración.");
  });
});
