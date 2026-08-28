// Auditoría de invariantes de los 3 fixtures — FASE 1E/Subbloque 2,
// corrección final antes de commit.
//
// Tres fuentes de verdad reutilizadas, NUNCA duplicadas a mano:
// 1. `evaluateCalculationPreflight` (_shared/calculation-preflight.ts) —
//    función pura, sin I/O — se importa directamente para confirmar que
//    los fixtures satisfacen los inputs requeridos por el pipeline real,
//    en vez de mantener una segunda lista de "campos requeridos" en este
//    archivo que podría divergir del contrato real con el tiempo. Nota de
//    precisión: esto demuestra `missing_inputs = []` — DATA-COMPLETE FOR
//    CALCULATION PREFLIGHT — no "preflight PASS" (`passed` exige además
//    `unapproved_assumptions = []`, que hoy nunca ocurre para ningún
//    análisis — ver sección A más abajo).
// 2. `resolveEffectiveSectorBenchmark`/`SECTOR_BENCHMARKS`
//    (_shared/canonical-input-normalization.ts) — mismas funciones/mapa
//    reales que usa el motor; los fixtures llaman a esa función para
//    construir `sectorBenchmark`, nunca escriben sus 5 valores a mano.
// 3. Las identidades de `canonical-financial-engine.ts` (líneas 186-272)
//    para grossMargin/ebitdaMargin/ebitMargin/netMargin/roe/roa/netDebt/
//    leverage/interestCoverage — no se puede importar la función completa
//    sin ejecutar el motor (calcula projections/WACC/DCF también), así
//    que aquí se reimplementa ÚNICAMENTE el sub-cálculo de KPIs de
//    período base, verificado línea por línea contra el archivo real (ver
//    comentario de `expectedKpisFromSnapshot` abajo). Esto NO es una
//    segunda metodología financiera — es el mismo cálculo, acotado a los
//    9 KPIs de la sección 3 de la tarea, con tolerancia documentada para
//    redondeo. `taxRatePct` se deriva de `CANONICAL_METHODOLOGY`
//    (_shared/financial-methodology.ts), nunca hardcodeado.

import { describe, it, expect } from "vitest";
import { evaluateCalculationPreflight } from "../../supabase/functions/_shared/calculation-preflight";
import { CANONICAL_METHODOLOGY } from "../../supabase/functions/_shared/financial-methodology";
import { SECTOR_BENCHMARKS, resolveEffectiveSectorBenchmark } from "../../supabase/functions/_shared/canonical-input-normalization";
import { BENCHMARK_FIXTURES, findFixture } from "./fixtures";
import type { PersistedCalculationResult } from "../../supabase/functions/_shared/narrative-calculation-adapter";

// Derivado de la fuente real, nunca duplicado a mano — si taxRatePct
// cambia algún día en financial-methodology.ts, este checker no queda
// desincronizado silenciosamente.
const TAX_RATE_PCT = CANONICAL_METHODOLOGY.assumptions.taxRatePct.value;
const TOLERANCE = 0.02; // redondeo de los literales del fixture (2-3 decimales) frente al cálculo de punto flotante completo.

/**
 * Reimplementación ACOTADA de canonical-financial-engine.ts líneas 186-272
 * — mismas fórmulas, verificadas línea por línea contra ese archivo:
 *   ebitda0 = revenue - costOfSales - opex + da
 *   ebit0 = ebitda0 - da
 *   netIncome0 = (ebit0 - interestExpense) * (1 - taxRate/100)
 *   totalAssets(engine) = totalDebt + equity   <- NO snapshot.total_assets
 *   netDebt = totalDebt - cash
 * Recibe los campos YA resueltos (abs, con fallback da||depreciation,
 * equity||total_equity) — replica `resolveEffective*`/`resolveFinancialDebtTotal`
 * mínimamente porque los fixtures no usan nombres alternos.
 */
function expectedKpisFromSnapshot(cr: PersistedCalculationResult) {
  const is = cr.source_input_snapshot.income_statement;
  const bs = cr.source_input_snapshot.balance_sheet;

  const revenue = Math.abs(is.revenue ?? 0);
  const costOfSales = Math.abs(is.cost_of_sales ?? 0);
  const opex = Math.abs(is.opex ?? 0);
  const da = Math.abs(is.da ?? 0);
  const interestExpense = Math.abs(is.interest_expense ?? 0);
  const cash = Math.abs(bs.cash ?? 0);
  const equity = Math.abs(bs.equity ?? 0);
  const totalDebt = Math.abs(bs.financial_debt_total ?? 0);

  const ebitda0 = revenue - costOfSales - opex + da;
  const ebit0 = ebitda0 - da;
  const netIncome0 = (ebit0 - interestExpense) * (1 - TAX_RATE_PCT / 100);
  const totalAssets = totalDebt + equity;
  const netDebt = totalDebt - cash;

  return {
    grossMargin: ((revenue - costOfSales) / revenue) * 100,
    ebitdaMargin: (ebitda0 / revenue) * 100,
    ebitMargin: (ebit0 / revenue) * 100,
    netMargin: (netIncome0 / revenue) * 100,
    roe: equity > 0 ? (netIncome0 / equity) * 100 : 0,
    roa: totalAssets > 0 ? (netIncome0 / totalAssets) * 100 : 0,
    netDebt,
    leverage: ebitda0 > 0 ? netDebt / ebitda0 : 0,
    interestCoverage: interestExpense > 0 ? ebit0 / interestExpense : 0,
  };
}

function expectClose(actual: number, expected: number, label: string) {
  expect(Math.abs(actual - expected), `${label}: esperado ≈${expected}, fixture trae ${actual}`).toBeLessThanOrEqual(TOLERANCE);
}

// ── A. DATA-COMPLETE FOR CALCULATION PREFLIGHT ──
// Formulación precisa (no "Calculation Preflight PASS" — eso implicaría
// `passed: true`, que el preflight real NUNCA devuelve hoy para ningún
// análisis, por `unapproved_assumptions`, no por datos). Lo que estos
// fixtures demuestran es exactamente: los inputs financieros REQUERIDOS
// están presentes (`missing_inputs = []`). El preflight completo sigue
// bloqueado por supuestos metodológicos sin aprobación humana — una
// limitación estructural del sistema hoy, ajena a estos fixtures.
describe("A. DATA-COMPLETE FOR CALCULATION PREFLIGHT (missing_inputs=[] — NO 'preflight PASS')", () => {
  it("CASE_C_INCOMPLETE_EVIDENCE: missing_inputs está vacío — revenue/cost_of_sales/opex/da/cash/equity/financial_debt_total todos observados", () => {
    const fixture = findFixture("CASE_C_INCOMPLETE_EVIDENCE");
    const result = evaluateCalculationPreflight({
      incomeStatement: fixture.calculationResult.source_input_snapshot.income_statement,
      balanceSheet: fixture.calculationResult.source_input_snapshot.balance_sheet,
    });
    expect(result.missing_inputs).toEqual([]);
  });

  it("los 3 fixtures satisfacen missing_inputs=[] (datos completos para el preflight — ninguno describe un cálculo inalcanzable por falta de inputs)", () => {
    for (const fixture of BENCHMARK_FIXTURES) {
      const result = evaluateCalculationPreflight({
        incomeStatement: fixture.calculationResult.source_input_snapshot.income_statement,
        balanceSheet: fixture.calculationResult.source_input_snapshot.balance_sheet,
      });
      expect(result.missing_inputs, `${fixture.id} missing_inputs`).toEqual([]);
    }
  });

  // unapproved_assumptions bloqueará SIEMPRE (documentado en el propio
  // preflight — ningún supuesto metodológico tiene aprobación humana hoy).
  // No es una propiedad de ESTE fixture — se confirma aquí para dejar
  // constancia explícita de que `passed` (missing_inputs=[] AND
  // unapproved_assumptions=[]) nunca será `true` hoy, por esa razón
  // estructural del sistema — nunca por datos faltantes de los fixtures.
  // Por eso "DATA-COMPLETE FOR CALCULATION PREFLIGHT" es la formulación
  // correcta, y "Calculation Preflight PASS" no lo es.
  it("unapproved_assumptions nunca está vacío hoy (comportamiento documentado del preflight, no un defecto del fixture) — por tanto `passed` nunca es true, aunque missing_inputs sí sea []", () => {
    const fixture = findFixture("CASE_A_MODERATE");
    const result = evaluateCalculationPreflight({
      incomeStatement: fixture.calculationResult.source_input_snapshot.income_statement,
      balanceSheet: fixture.calculationResult.source_input_snapshot.balance_sheet,
    });
    expect(result.unapproved_assumptions.length).toBeGreaterThan(0);
    expect(result.missing_inputs).toEqual([]);
    expect(result.passed).toBe(false);
  });
});

// ── Sector benchmark — sin drift frente al mapa canónico real ──
describe("sectorBenchmark de cada fixture coincide EXACTAMENTE con resolveEffectiveSectorBenchmark real (sin fallback)", () => {
  it.each(BENCHMARK_FIXTURES.map((f) => [f.id, f] as const))("%s", (_id, fixture) => {
    const sector = fixture.calculationResult.source_input_snapshot.sector;
    expect(sector).not.toBeNull();
    // No dependemos del fallback ("Software / Tecnología") en ningún caso
    // del benchmark — el sector debe ser una clave EXPLÍCITA del mapa real.
    expect(Object.prototype.hasOwnProperty.call(SECTOR_BENCHMARKS, sector as string), `"${sector}" debe ser clave explícita de SECTOR_BENCHMARKS`).toBe(true);
    expect(fixture.calculationResult.sectorBenchmark).toEqual(resolveEffectiveSectorBenchmark(sector as string));
  });

  it("ningún fixture depende del fallback (Software / Tecnología) — las 3 claves son explícitas", () => {
    const sectors = BENCHMARK_FIXTURES.map((f) => f.calculationResult.source_input_snapshot.sector);
    expect(new Set(sectors).size).toBe(3); // 3 sectores distintos, sin colisión
    for (const sector of sectors) {
      expect(sector).not.toBe("Software / Tecnología"); // la clave de fallback específicamente, para no confundir "coincide con el fallback por casualidad" con "usa el fallback"
    }
  });
});

// ── B/C/D. KPIs verificables contra snapshot ──
describe("B/C/D. kpis de cada fixture coinciden con las fórmulas reales del motor (tolerancia documentada)", () => {
  it.each(BENCHMARK_FIXTURES.map((f) => [f.id, f] as const))("%s: grossMargin/ebitdaMargin/ebitMargin/netMargin/roe/roa/netDebt/leverage/interestCoverage", (_id, fixture) => {
    const expected = expectedKpisFromSnapshot(fixture.calculationResult);
    const actual = fixture.calculationResult.kpis;
    expectClose(actual.grossMargin, expected.grossMargin, "grossMargin");
    expectClose(actual.ebitdaMargin, expected.ebitdaMargin, "ebitdaMargin");
    expectClose(actual.ebitMargin, expected.ebitMargin, "ebitMargin");
    expectClose(actual.netMargin, expected.netMargin, "netMargin");
    expectClose(actual.roe, expected.roe, "roe");
    expectClose(actual.roa, expected.roa, "roa");
    expect(actual.netDebt).toBe(expected.netDebt);
    expectClose(actual.leverage, expected.leverage, "leverage");
    expectClose(actual.interestCoverage, expected.interestCoverage, "interestCoverage");
  });
});

// ── E. netDebt: snapshot <-> kpis <-> valuation ──
describe("E. netDebt consistente entre snapshot, kpis y valuation", () => {
  it.each(BENCHMARK_FIXTURES.map((f) => [f.id, f] as const))("%s", (_id, fixture) => {
    const bs = fixture.calculationResult.source_input_snapshot.balance_sheet;
    const netDebtFromSnapshot = Math.abs(bs.financial_debt_total ?? 0) - Math.abs(bs.cash ?? 0);
    expect(fixture.calculationResult.kpis.netDebt).toBe(netDebtFromSnapshot);
    expect(fixture.calculationResult.valuation.netDebt).toBe(netDebtFromSnapshot);
    expect(fixture.calculationResult.kpis.netDebt).toBe(fixture.calculationResult.valuation.netDebt);
  });
});

// ── F/G. roe/roa y leverage/interestCoverage no contradicen el snapshot ──
describe("F/G. roe/roa y leverage/interestCoverage no contradicen el snapshot (mismo signo, misma zona)", () => {
  it.each(BENCHMARK_FIXTURES.map((f) => [f.id, f] as const))("%s", (_id, fixture) => {
    const expected = expectedKpisFromSnapshot(fixture.calculationResult);
    const actual = fixture.calculationResult.kpis;
    expect(Math.sign(actual.roe)).toBe(Math.sign(expected.roe));
    expect(Math.sign(actual.roa)).toBe(Math.sign(expected.roa));
    expect(Math.sign(actual.leverage)).toBe(Math.sign(expected.leverage));
    expect(Math.sign(actual.interestCoverage)).toBe(Math.sign(expected.interestCoverage));
  });
});

// ── Discriminantes explícitos por caso (siguen valiendo tras la corrección) ──
describe("discriminantes de caso — siguen cumpliéndose con los kpis corregidos", () => {
  it("CASE_A: EBITDA/margen neto positivos, leverage<3, interestCoverage>2", () => {
    const kpis = findFixture("CASE_A_MODERATE").calculationResult.kpis;
    expect(kpis.ebitdaMargin).toBeGreaterThan(0);
    expect(kpis.netMargin).toBeGreaterThan(0);
    expect(kpis.leverage).toBeLessThan(3);
    expect(kpis.interestCoverage).toBeGreaterThan(2);
  });

  it("CASE_B: EBITDA positivo, margen neto negativo, leverage>3, interestCoverage<2", () => {
    const kpis = findFixture("CASE_B_FINANCIAL_STRESS").calculationResult.kpis;
    expect(kpis.ebitdaMargin).toBeGreaterThan(0);
    expect(kpis.netMargin).toBeLessThan(0);
    expect(kpis.leverage).toBeGreaterThan(3);
    expect(kpis.interestCoverage).toBeLessThan(2);
  });

  it("CASE_B: evHigh/evLow > 2", () => {
    const v = findFixture("CASE_B_FINANCIAL_STRESS").calculationResult.valuation;
    expect(v.evHigh / v.evLow).toBeGreaterThan(2);
  });

  it("los 3 casos: evLow < enterpriseValue < evHigh y equityValue = enterpriseValue - netDebt", () => {
    for (const fixture of BENCHMARK_FIXTURES) {
      const v = fixture.calculationResult.valuation;
      expect(v.evLow).toBeLessThan(v.enterpriseValue);
      expect(v.enterpriseValue).toBeLessThan(v.evHigh);
      expect(v.equityValue).toBe(Math.max(v.enterpriseValue - v.netDebt, 0));
    }
  });
});

// ── H. ningún fixture convierte un campo null en cero ──
describe("H. ningún fixture convierte missing (null) en cero", () => {
  it("CASE_C: los campos permitidos-ausentes son exactamente null, nunca 0", () => {
    const { income_statement, balance_sheet } = findFixture("CASE_C_INCOMPLETE_EVIDENCE").calculationResult.source_input_snapshot;
    expect(balance_sheet.accounts_receivable).toBeNull();
    expect(balance_sheet.inventory).toBeNull();
    expect(balance_sheet.accounts_payable).toBeNull();
    expect(balance_sheet.ppe).toBeNull();
    expect(income_statement.taxes).toBeNull();
    // Ninguno de los 5 es 0 disfrazado de "ausente" — null explícito, distinguible de un 0 observado.
    for (const v of [balance_sheet.accounts_receivable, balance_sheet.inventory, balance_sheet.accounts_payable, balance_sheet.ppe, income_statement.taxes]) {
      expect(v).not.toBe(0);
    }
  });

  it("CASE_A y CASE_B (historical completo/completo): ningún campo requerido es null", () => {
    for (const id of ["CASE_A_MODERATE", "CASE_B_FINANCIAL_STRESS"] as const) {
      const { income_statement, balance_sheet } = findFixture(id).calculationResult.source_input_snapshot;
      for (const v of Object.values(income_statement)) expect(v).not.toBeNull();
      for (const v of Object.values(balance_sheet)) expect(v).not.toBeNull();
    }
  });
});

// ── I. CASE_C conserva EXACTAMENTE los campos de evidencia incompleta decididos ──
describe("I. CASE_C conserva exactamente el set de nulls decidido — ni más ni menos", () => {
  it("null únicamente en accounts_receivable/inventory/accounts_payable/ppe/taxes — todo lo demás observado", () => {
    const { income_statement, balance_sheet } = findFixture("CASE_C_INCOMPLETE_EVIDENCE").calculationResult.source_input_snapshot;

    const nullIncomeFields = (Object.entries(income_statement) as [string, unknown][]).filter(([, v]) => v === null).map(([k]) => k);
    const nullBalanceFields = (Object.entries(balance_sheet) as [string, unknown][]).filter(([, v]) => v === null).map(([k]) => k);

    expect(nullIncomeFields.sort()).toEqual(["taxes"]);
    expect(nullBalanceFields.sort()).toEqual(["accounts_payable", "accounts_receivable", "inventory", "ppe"]);

    // da, en particular, NUNCA debe estar en la lista de nulls de CASE_C — es requerido por preflight.
    expect(income_statement.da).not.toBeNull();
    expect(typeof income_statement.da).toBe("number");
  });
});
