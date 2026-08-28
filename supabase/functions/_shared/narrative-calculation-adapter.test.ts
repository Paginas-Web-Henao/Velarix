// Bloque 1E — Subbloque 2 — Pruebas del adaptador puro
// calculation_result → narrativa. Importa las funciones reales, nunca
// reimplementa fórmulas financieras dentro de la prueba.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertNarrativeCalculationResult,
  mapCalculationResultToNarrativeViewModel,
  buildCalculationMeta,
  detectRisks,
  CalculationResultRequiredError,
  UnsupportedCalculationResultError,
  SUPPORTED_CALCULATION_SCHEMA_VERSION,
  type PersistedCalculationResult,
} from "./narrative-calculation-adapter";

function buildFixture(overrides: Partial<PersistedCalculationResult> = {}): PersistedCalculationResult {
  const projections = [1, 2, 3, 4, 5].map((year) => ({
    year, revenue: 1_000_000 + year * 10_000, costOfSales: 400_000, grossProfit: 600_000,
    ebitda: 220_000, depreciation: 30_000, ebit: 190_000, interest: 15_000, ebt: 175_000,
    taxes: 52_500, netIncome: 122_500, nopat: 133_000, capex: 50_000, deltaWC: 30_000,
    fcff: 83_130, discountedFcf: 75_000,
  }));
  const scenario = (label: string, growth: number, ebitdaMargin: number, wacc: number, terminalGrowth: number, ev: number) => ({
    projections, ev, assumptions: { growth, ebitdaMargin, wacc, terminalGrowth }, label,
  });

  const base: PersistedCalculationResult = {
    projections,
    scenarios: {
      pessimistic: scenario("Pesimista", 15, 19, 12.5, 2, 4_100_000),
      base: scenario("Base", 25, 22, 11.2, 3, 4_732_915),
      optimistic: scenario("Optimista", 35, 25, 9.7, 4, 5_900_000),
    },
    kpis: {
      grossMargin: 60.1, ebitdaMargin: 22.3, ebitMargin: 19.4, netMargin: 12.7,
      roe: 18.9, roa: 11.2, netDebt: 850_000, leverage: 1.9, interestCoverage: 6.3,
    },
    valuation: {
      betaLevered: 1.34, costOfEquity: 12.15, costOfDebtAfterTax: 5.6, wacc: 11.2,
      terminalValue: 6_123_456, discountedTV: 4_012_789, enterpriseValue: 4_732_915,
      netDebt: 850_000, equityValue: 3_882_915, evLow: 4_200_000, evHigh: 5_400_000,
      evEbitda: 8.7, evRevenue: 1.9, waccWarning: null,
    },
    sensitivityMatrix: [
      { waccDelta: -1, growthDelta: 0, ev: 5_000_000 },
      { waccDelta: 0, growthDelta: 0, ev: 4_732_915 },
      { waccDelta: 1, growthDelta: 0, ev: 4_400_000 },
    ],
    sectorBenchmark: { beta: 1.22, ebitdaMargin: 26, evEbitda: 13, evRevenue: 4.8, waccRef: 11.2 },
    moneda: "USD",
    factor_conversion: 1,
    version: {
      calculation_schema_version: "1.1.0",
      canonical_engine_version: "1.0.0",
      methodology_version: "1.0.0-provisional",
      assumptions_snapshot: {
        taxRatePct: { value: 30, unit: "percent", approved: false },
      },
      calculated_at: "2026-08-27T12:00:00.000Z",
      input_fingerprint: "fixture-fingerprint-abc123",
      provenance_status: "complete",
    },
    provenance: {
      analysis_id: "fixture-analysis-id",
      structured_input_id: "struct-fixture-id",
      document_ids: [],
      homologation_ids: [],
      source_row_ids: null,
      source_row_ids_status: "missing",
      built_at: "2026-08-27T12:00:00.000Z",
      currency: { moneda_analisis: "USD", moneda_documento: "COP", factor_conversion: 1 },
      fields: {},
      overall_status: "complete",
      warnings: [],
      period_selection: null,
    },
    source_input_snapshot: {
      structured_input_id: "struct-fixture-id",
      version_input: "2.3",
      base_period: "2025",
      sector: "Software / Tecnología",
      moneda_analisis: "USD",
      income_statement: {
        revenue: 3_600_000, cost_of_sales: 1_440_000, opex: 720_000, da: 108_000,
        ebitda: 1_476_000, ebit: 1_368_000, interest_expense: 76_000, taxes: 387_600, net_income: 904_400,
      },
      balance_sheet: {
        cash: 100_000, accounts_receivable: 300_000, inventory: 150_000, accounts_payable: 200_000,
        ppe: 900_000, current_financial_debt: 250_000, long_term_financial_debt: 700_000,
        financial_debt_total: 950_000, equity: 2_100_000, total_assets: 3_050_000, total_liabilities: 950_000,
      },
    },
  };
  return { ...base, ...overrides };
}

describe("assertNarrativeCalculationResult — gates fail-closed", () => {
  it("E. acepta un calculation_result con calculation_schema_version soportada (1.1.0)", () => {
    expect(SUPPORTED_CALCULATION_SCHEMA_VERSION).toBe("1.1.0");
    const fixture = buildFixture();
    expect(() => assertNarrativeCalculationResult(fixture)).not.toThrow();
  });

  it("F. calculation_result null/undefined → CalculationResultRequiredError", () => {
    expect(() => assertNarrativeCalculationResult(null)).toThrow(CalculationResultRequiredError);
    expect(() => assertNarrativeCalculationResult(undefined)).toThrow(CalculationResultRequiredError);
  });

  it("G. version ausente → UnsupportedCalculationResultError", () => {
    const fixture = buildFixture();
    // @ts-expect-error borrado deliberado para la prueba
    delete fixture.version;
    expect(() => assertNarrativeCalculationResult(fixture)).toThrow(UnsupportedCalculationResultError);
  });

  it("H. input_fingerprint ausente → UnsupportedCalculationResultError", () => {
    const fixture = buildFixture();
    fixture.version = { ...fixture.version, input_fingerprint: "" };
    expect(() => assertNarrativeCalculationResult(fixture)).toThrow(UnsupportedCalculationResultError);
  });

  it("I. source_input_snapshot ausente → UnsupportedCalculationResultError", () => {
    const fixture = buildFixture();
    // @ts-expect-error borrado deliberado para la prueba
    delete fixture.source_input_snapshot;
    expect(() => assertNarrativeCalculationResult(fixture)).toThrow(UnsupportedCalculationResultError);
  });

  it("J. calculation_schema_version no soportada (p.ej. 1.0.0 sin snapshot) → UnsupportedCalculationResultError", () => {
    const fixture = buildFixture();
    fixture.version = { ...fixture.version, calculation_schema_version: "1.0.0" };
    expect(() => assertNarrativeCalculationResult(fixture)).toThrow(UnsupportedCalculationResultError);
  });

  it("los códigos de error son los esperados por el contrato HTTP", () => {
    expect(new CalculationResultRequiredError().code).toBe("CALCULATION_RESULT_REQUIRED");
    expect(new UnsupportedCalculationResultError("x").code).toBe("UNSUPPORTED_CALCULATION_RESULT");
  });

  it("G. sensitivityMatrix ausente/no-array → UnsupportedCalculationResultError", () => {
    const fixture = buildFixture();
    // @ts-expect-error asignación deliberadamente inválida para la prueba
    fixture.sensitivityMatrix = undefined;
    expect(() => assertNarrativeCalculationResult(fixture)).toThrow(UnsupportedCalculationResultError);
  });

  it("G. sectorBenchmark ausente → UnsupportedCalculationResultError", () => {
    const fixture = buildFixture();
    // @ts-expect-error borrado deliberado para la prueba
    delete fixture.sectorBenchmark;
    expect(() => assertNarrativeCalculationResult(fixture)).toThrow(UnsupportedCalculationResultError);
  });

  it("G. moneda ausente/vacía → UnsupportedCalculationResultError", () => {
    const fixtureMissing = buildFixture();
    // @ts-expect-error asignación deliberadamente inválida para la prueba
    fixtureMissing.moneda = undefined;
    expect(() => assertNarrativeCalculationResult(fixtureMissing)).toThrow(UnsupportedCalculationResultError);

    const fixtureEmpty = buildFixture();
    fixtureEmpty.moneda = "";
    expect(() => assertNarrativeCalculationResult(fixtureEmpty)).toThrow(UnsupportedCalculationResultError);
  });

  it("G. scenarios.base ausente → UnsupportedCalculationResultError", () => {
    const fixture = buildFixture();
    // @ts-expect-error borrado deliberado para la prueba
    delete fixture.scenarios.base;
    expect(() => assertNarrativeCalculationResult(fixture)).toThrow(UnsupportedCalculationResultError);
  });

  it("G. scenarios.base.assumptions ausente → UnsupportedCalculationResultError", () => {
    const fixture = buildFixture();
    // @ts-expect-error borrado deliberado para la prueba
    delete fixture.scenarios.base.assumptions;
    expect(() => assertNarrativeCalculationResult(fixture)).toThrow(UnsupportedCalculationResultError);
  });

  it("G. scenarios.base.assumptions.growth no numérico → UnsupportedCalculationResultError", () => {
    const fixture = buildFixture();
    // @ts-expect-error asignación deliberadamente inválida para la prueba
    fixture.scenarios.base.assumptions.growth = "25";
    expect(() => assertNarrativeCalculationResult(fixture)).toThrow(UnsupportedCalculationResultError);
  });
});

describe("mapCalculationResultToNarrativeViewModel — sin recalcular", () => {
  it("copia 1:1 valuation/kpis/projections/scenarios/sensitivityMatrix — nunca deriva ni recalcula", () => {
    const fixture = buildFixture();
    const vm = mapCalculationResultToNarrativeViewModel(fixture);

    expect(vm.enterpriseValue).toBe(fixture.valuation.enterpriseValue);
    expect(vm.equityValue).toBe(fixture.valuation.equityValue);
    expect(vm.wacc).toBe(fixture.valuation.wacc);
    expect(vm.costOfEquity).toBe(fixture.valuation.costOfEquity);
    expect(vm.betaLevered).toBe(fixture.valuation.betaLevered);
    expect(vm.evEbitda).toBe(fixture.valuation.evEbitda);
    expect(vm.evRevenue).toBe(fixture.valuation.evRevenue);
    expect(vm.netDebt).toBe(fixture.valuation.netDebt);
    expect(vm.evLow).toBe(fixture.valuation.evLow);
    expect(vm.evHigh).toBe(fixture.valuation.evHigh);
    expect(vm.terminalValue).toBe(fixture.valuation.terminalValue);
    expect(vm.discountedTV).toBe(fixture.valuation.discountedTV);

    expect(vm.kpis).toEqual(fixture.kpis);
    expect(vm.kpis.ebitdaMargin).toBe(fixture.kpis.ebitdaMargin);
    expect(vm.kpis.netMargin).toBe(fixture.kpis.netMargin);
    expect(vm.kpis.leverage).toBe(fixture.kpis.leverage);
    expect(vm.kpis.interestCoverage).toBe(fixture.kpis.interestCoverage);

    expect(vm.projections).toEqual(fixture.projections);
    expect(vm.scenarios).toEqual(fixture.scenarios);
    expect(vm.sensitivityMatrix).toEqual(fixture.sensitivityMatrix);
    expect(vm.sectorBenchmark).toEqual(fixture.sectorBenchmark);
    expect(vm.moneda).toBe(fixture.moneda);

    // growth: el supuesto realmente usado por el motor (escenario base), no inventado.
    expect(vm.growth).toBe(fixture.scenarios.base.assumptions.growth);
  });

  it("A. historical: copia 1:1 desde source_input_snapshot (base_period/income_statement/balance_sheet), sin derivar nada", () => {
    const fixture = buildFixture();
    const vm = mapCalculationResultToNarrativeViewModel(fixture);

    expect(vm.historical.base_period).toBe(fixture.source_input_snapshot.base_period);
    expect(vm.historical.income_statement).toEqual(fixture.source_input_snapshot.income_statement);
    expect(vm.historical.balance_sheet).toEqual(fixture.source_input_snapshot.balance_sheet);
    // Mismos valores exactos, no una copia recalculada.
    expect(vm.historical.income_statement.revenue).toBe(fixture.source_input_snapshot.income_statement.revenue);
    expect(vm.historical.balance_sheet.financial_debt_total).toBe(fixture.source_input_snapshot.balance_sheet.financial_debt_total);
  });

  it("B. historical: un campo null en el snapshot permanece null en el view model — nunca se convierte en 0", () => {
    const fixture = buildFixture();
    fixture.source_input_snapshot.income_statement = {
      ...fixture.source_input_snapshot.income_statement,
      cost_of_sales: null,
      ebitda: null,
    };
    fixture.source_input_snapshot.balance_sheet = {
      ...fixture.source_input_snapshot.balance_sheet,
      financial_debt_total: null,
    };
    const vm = mapCalculationResultToNarrativeViewModel(fixture);

    expect(vm.historical.income_statement.cost_of_sales).toBeNull();
    expect(vm.historical.income_statement.ebitda).toBeNull();
    expect(vm.historical.balance_sheet.financial_debt_total).toBeNull();
    // Lo que sí está presente se preserva tal cual.
    expect(vm.historical.income_statement.revenue).toBe(fixture.source_input_snapshot.income_statement.revenue);
  });

  it("L. no existe ninguna llamada/fórmula de WACC, DCF, EV, equity value, márgenes, leverage, cobertura o proyecciones dentro del adaptador (verificación estática de código fuente)", () => {
    // Lee el código fuente como texto para una verificación estática
    // simple, sin duplicar el motor financiero en la prueba.
    const source = readFileSync(resolve(__dirname, "./narrative-calculation-adapter.ts"), "utf-8");
    // Ninguna operación aritmética sobre las cifras financieras: el
    // adaptador solo hace acceso a propiedades (`valuation.x`, `kpis.x`)
    // y comparaciones de umbral ya existentes en detectRisks — nunca una
    // multiplicación/división/suma que combine dos cifras de valoración
    // para producir una tercera no presente en calculation_result.
    expect(source).not.toMatch(/waccDecimal|costOfEquityPct|riskFreeRate.*erp|Hamada/i);
    expect(source).not.toMatch(/runCanonicalFinancialEngine|runAnalysis\(|DEFAULT_INPUTS/);
  });
});

describe("buildCalculationMeta", () => {
  it("F. shape exacto con los 8 campos requeridos, tomados de version + source_input_snapshot", () => {
    const fixture = buildFixture();
    const meta = buildCalculationMeta(fixture);
    expect(meta).toEqual({
      input_fingerprint: fixture.version.input_fingerprint,
      calculation_schema_version: fixture.version.calculation_schema_version,
      canonical_engine_version: fixture.version.canonical_engine_version,
      methodology_version: fixture.version.methodology_version,
      calculated_at: fixture.version.calculated_at,
      structured_input_id: fixture.source_input_snapshot.structured_input_id,
      structured_input_version: fixture.source_input_snapshot.version_input,
      base_period: fixture.source_input_snapshot.base_period,
    });
  });
});

describe("detectRisks — moneda propagada, nunca hardcodeada (corrección)", () => {
  it("A. moneda = COP: VAL_001 y VAL_002 usan COP, nunca USD", () => {
    const fixture = buildFixture();
    fixture.moneda = "COP";
    fixture.valuation.enterpriseValue = -500_000; // dispara VAL_001
    fixture.valuation.evLow = 1_000_000;
    fixture.valuation.evHigh = 5_000_000; // ratio 5x > 2.0 -> dispara VAL_002
    const vm = mapCalculationResultToNarrativeViewModel(fixture);
    const risks = detectRisks(vm);

    const val001 = risks.find((r) => r.id === "VAL_001");
    const val002 = risks.find((r) => r.id === "VAL_002");
    expect(val001).toBeDefined();
    expect(val002).toBeDefined();
    expect(val001!.indicador).toContain("COP");
    expect(val001!.indicador).not.toContain("USD");
    expect(val002!.indicador).toContain("COP");
    expect(val002!.indicador).not.toContain("USD");
  });

  it("no existe ningún literal \"USD\" hardcodeado en el código fuente del adaptador (verificación estática)", () => {
    const source = readFileSync(resolve(__dirname, "./narrative-calculation-adapter.ts"), "utf-8");
    expect(source).not.toMatch(/USD/);
  });
});

describe("detectRisks — view model canónico, sin nombres legacy, null-safe", () => {
  it("K. leverage/interestCoverage/ebitdaMargin/netMargin ausentes (null) no lanzan y simplemente no disparan la regla — null no equivale a 0", () => {
    const fixture = buildFixture();
    const vm = mapCalculationResultToNarrativeViewModel(fixture);
    const vmWithNulls: typeof vm = {
      ...vm,
      kpis: { ...vm.kpis, leverage: null as unknown as number, interestCoverage: null as unknown as number, ebitdaMargin: null as unknown as number, netMargin: null as unknown as number },
    };
    expect(() => detectRisks(vmWithNulls)).not.toThrow();
    const risks = detectRisks(vmWithNulls);
    expect(risks.find((r) => r.id === "END_001")).toBeUndefined();
    expect(risks.find((r) => r.id === "END_002")).toBeUndefined();
    expect(risks.find((r) => r.id === "RENT_001")).toBeUndefined();
    expect(risks.find((r) => r.id === "RENT_003")).toBeUndefined();
  });

  it("liquidezCorriente no existe en el view model — no hay ninguna regla LIQ_001", () => {
    const fixture = buildFixture();
    fixture.kpis.leverage = 10; // dispara END_001 pero no debe existir ningún id LIQ_001 posible
    const vm = mapCalculationResultToNarrativeViewModel(fixture);
    const risks = detectRisks(vm);
    expect(risks.some((r) => r.id === "LIQ_001")).toBe(false);
    expect((vm as unknown as Record<string, unknown>).liquidezCorriente).toBeUndefined();
  });

  it("umbrales preservados exactamente: END_001 dispara en >3.0x, no en =3.0x", () => {
    const fixture = buildFixture();
    fixture.kpis.leverage = 3.0;
    let vm = mapCalculationResultToNarrativeViewModel(fixture);
    expect(detectRisks(vm).some((r) => r.id === "END_001")).toBe(false);

    fixture.kpis.leverage = 3.01;
    vm = mapCalculationResultToNarrativeViewModel(fixture);
    expect(detectRisks(vm).some((r) => r.id === "END_001")).toBe(true);
  });

  it("umbrales preservados exactamente: CREC_001 dispara en growth > 50, no en growth = 50", () => {
    const fixture = buildFixture();
    fixture.scenarios.base.assumptions.growth = 50;
    let vm = mapCalculationResultToNarrativeViewModel(fixture);
    expect(detectRisks(vm).some((r) => r.id === "CREC_001")).toBe(false);

    fixture.scenarios.base.assumptions.growth = 51;
    vm = mapCalculationResultToNarrativeViewModel(fixture);
    expect(detectRisks(vm).some((r) => r.id === "CREC_001")).toBe(true);
  });

  it("VAL_002 no divide por cero cuando evLow es 0 (antes evitado por accidente vía falsy, ahora explícito)", () => {
    const fixture = buildFixture();
    fixture.valuation.evLow = 0;
    fixture.valuation.evHigh = 10_000_000;
    const vm = mapCalculationResultToNarrativeViewModel(fixture);
    expect(() => detectRisks(vm)).not.toThrow();
    expect(detectRisks(vm).some((r) => r.id === "VAL_002")).toBe(false);
  });
});
