// Bloque 1E — Subbloque 1 (corrección): PDF como consumidor del
// `calculation_result` canónico, con su `source_input_snapshot` como
// única fuente de históricos — nunca `structured_inputs` consultado de
// nuevo al momento de generar el PDF.
//
// Protege las invariantes centrales del subbloque (checklist Etapa 10):
//   A. Dashboard.tsx no llama a runAnalysis().
//   B. Dashboard.tsx no usa DEFAULT_INPUTS.
//   C. Dashboard.tsx no consulta structured_inputs para cifras financieras.
//   D. el mapper no recibe rawFinancials externo.
//   E. el mapper no importa (valores de) financial-engine.
//   F. EV/equity/WACC/projections/scenarios/sensitivity: copia 1:1 desde calculation_result.
//   G. históricos: copia 1:1 desde source_input_snapshot.
//   H. un histórico null permanece null (nunca se convierte en 0 ni se deriva).
//   I. snapshot ausente: fail-closed (el mapper lanza explícito).
//   J. version/fingerprint preservados.
//   K. calculation_result y snapshot pertenecen al MISMO envelope — probado
//      exhaustivamente en supabase/functions/_shared/calculation-envelope.integration.test.ts
//      (ejecuta el motor real + arma el envelope tal como ejecutar-calculo/index.ts).
//
// A, B, C, D y E se verifican por inspección estática del código fuente
// real (no por mock de un componente React) — la garantía que importa es
// "el símbolo/patrón no aparece en el archivo que corre en producción".
//
// El fixture de `PersistedCalculationResult` de abajo es artesanal (no se
// ejecuta ningún motor DCF para generarlo) — los números no tienen que
// "cuadrar" financieramente entre sí, solo ser distintos entre campos para
// que un mapeo cruzado o una fórmula reintroducida se note.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, test, expect } from "vitest";
import { mapCanonicalCalculationToPdfData } from "./pdf-canonical-mapper";
import type { PersistedCalculationResult, SourceInputSnapshot } from "@/types/calculation-result";

const DASHBOARD_SOURCE = readFileSync(resolve(__dirname, "../pages/Dashboard.tsx"), "utf-8");
const MAPPER_SOURCE = readFileSync(resolve(__dirname, "./pdf-canonical-mapper.ts"), "utf-8");

describe("PDF real de Dashboard — sin motor cliente ni structured_inputs en el camino", () => {
  test("A. Dashboard.tsx no llama a runAnalysis()", () => {
    expect(DASHBOARD_SOURCE).not.toMatch(/\brunAnalysis\s*\(/);
  });

  test("B. Dashboard.tsx no usa DEFAULT_INPUTS como fallback de valoración", () => {
    expect(DASHBOARD_SOURCE).not.toMatch(/\bDEFAULT_INPUTS\b/);
  });

  test("C. Dashboard.tsx no consulta structured_inputs para obtener cifras financieras del PDF", () => {
    expect(DASHBOARD_SOURCE).not.toMatch(/\.from\(["']structured_inputs["']\)/);
  });

  test("Dashboard.tsx no importa el motor financiero cliente (financial-engine) para el camino de PDF", () => {
    expect(DASHBOARD_SOURCE).not.toMatch(/from ["']@\/lib\/financial-engine["']/);
  });

  test("Dashboard.tsx bloquea la descarga si falta calculation_result o source_input_snapshot (fail-closed)", () => {
    expect(DASHBOARD_SOURCE).toMatch(/El cálculo canónico aún no está disponible/);
    expect(DASHBOARD_SOURCE).toMatch(/no contiene el snapshot canónico requerido/);
  });
});

describe("pdf-canonical-mapper.ts — sin rawFinancials externo, sin motor cliente", () => {
  test("D. el mapper no recibe rawFinancials como parámetro externo", () => {
    expect(MAPPER_SOURCE).not.toMatch(/rawFinancials/);
  });

  test("E. el mapper no importa ningún VALOR de financial-engine (solo tipos, import type)", () => {
    const valueImportFromEngine = /^import\s+\{[^}]*\}\s+from\s+["']\.\/financial-engine["']/m;
    expect(MAPPER_SOURCE).not.toMatch(valueImportFromEngine);
    expect(MAPPER_SOURCE).toMatch(/^import type \{[\s\S]*?\}\s+from\s+["']\.\/financial-engine["']/m);
    expect(MAPPER_SOURCE).not.toMatch(/\bSECTOR_BENCHMARKS\b/);
    expect(MAPPER_SOURCE).not.toMatch(/\brunAnalysis\s*\(/);
  });
});

function buildFixture(overrides: { snapshot?: Partial<SourceInputSnapshot> } = {}): PersistedCalculationResult {
  const baseProjections = [1, 2, 3, 4, 5].map((year) => ({
    year,
    revenue: 1_000_000 + year * 10_000,
    costOfSales: 400_000 + year * 1_000,
    grossProfit: 600_000 + year * 9_000,
    ebitda: 220_000 + year * 2_000,
    depreciation: 30_000 + year * 100,
    ebit: 190_000 + year * 1_900,
    interest: 15_000 + year * 50,
    ebt: 175_000 + year * 1_850,
    taxes: 52_500 + year * 555,
    netIncome: 122_500 + year * 1_295,
    nopat: 133_000 + year * 1_330,
    capex: 50_000 + year * 500,
    deltaWC: 30_000 + year * 300,
    fcff: 83_130 + year * 700,
    discountedFcf: 75_000 + year * 600,
  }));

  const scenario = (label: string, growth: number, ebitdaMargin: number, wacc: number, terminalGrowth: number, ev: number) => ({
    projections: baseProjections,
    ev,
    assumptions: { growth, ebitdaMargin, wacc, terminalGrowth },
    label,
  });

  const defaultSnapshot: SourceInputSnapshot = {
    structured_input_id: "struct-fixture-id",
    version_input: "2.3",
    base_period: "2025",
    sector: "Software / Tecnología",
    moneda_analisis: "USD",
    income_statement: {
      revenue: 3_600_000,
      cost_of_sales: 1_440_000,
      opex: 720_000,
      da: 108_000,
      ebitda: 1_476_000,
      ebit: 1_368_000,
      interest_expense: 76_000,
      taxes: 387_600,
      net_income: 904_400,
    },
    balance_sheet: {
      cash: 100_000,
      accounts_receivable: 300_000,
      inventory: 150_000,
      accounts_payable: 200_000,
      ppe: 900_000,
      current_financial_debt: 250_000,
      long_term_financial_debt: 700_000,
      financial_debt_total: 950_000,
      equity: 2_100_000,
      total_assets: 3_050_000,
      total_liabilities: 950_000,
    },
    ...overrides.snapshot,
  };

  return {
    projections: baseProjections,
    scenarios: {
      pessimistic: scenario("Pesimista", 15, 19, 12.5, 2, 4_100_000),
      base: scenario("Base", 25, 22, 11.2, 3, 4_732_915),
      optimistic: scenario("Optimista", 35, 25, 9.7, 4, 5_900_000),
    },
    kpis: {
      grossMargin: 60.1,
      ebitdaMargin: 22.3,
      ebitMargin: 19.4,
      netMargin: 12.7,
      roe: 18.9,
      roa: 11.2,
      netDebt: 850_000,
      leverage: 1.9,
      interestCoverage: 6.3,
    },
    valuation: {
      betaLevered: 1.34,
      costOfEquity: 12.15,
      costOfDebtAfterTax: 5.6,
      wacc: 11.2,
      terminalValue: 6_123_456,
      discountedTV: 4_012_789,
      enterpriseValue: 4_732_915,
      netDebt: 850_000,
      equityValue: 3_882_915,
      evLow: 4_200_000,
      evHigh: 5_400_000,
      evEbitda: 8.7,
      evRevenue: 1.9,
      waccWarning: null,
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
      calculation_schema_version: "1.0.0",
      canonical_engine_version: "1.0.0",
      methodology_version: "1.0.0-provisional",
      assumptions_snapshot: {
        taxRatePct: { value: 30, unit: "percent", approved: false },
        capexPctOfRevenue: { value: 5, unit: "percent", approved: false },
        workingCapitalPctOfRevenue: { value: 3, unit: "percent", approved: false },
        terminalGrowthPct: { value: 3, unit: "percent", approved: false },
        costOfDebtPct: { value: 8, unit: "percent", approved: false },
        riskFreeRatePct: { value: 4.35, unit: "percent", approved: false },
        equityRiskPremiumPct: { value: 5.80, unit: "percent", approved: false },
        depreciationPctOfRevenue: { value: 3, unit: "percent", approved: false },
      },
      calculated_at: "2026-08-20T12:00:00.000Z",
      input_fingerprint: "fixture-fingerprint-abc123",
      provenance_status: "complete",
    },
    provenance: {
      analysis_id: "fixture-analysis-id",
      structured_input_id: "struct-fixture-id",
      document_ids: ["doc-1"],
      homologation_ids: ["hom-1"],
      source_row_ids: null,
      source_row_ids_status: "missing",
      built_at: "2026-08-20T12:00:00.000Z",
      currency: { moneda_analisis: "USD", moneda_documento: "COP", factor_conversion: 1 },
      fields: {},
      overall_status: "complete",
      warnings: [],
      period_selection: null,
    },
    source_input_snapshot: defaultSnapshot,
  };
}

describe("mapCanonicalCalculationToPdfData — consumo puro del calculation_result canónico + su snapshot", () => {
  test("F. EV/equity/WACC/projections/scenarios/sensitivity: copia exacta del fixture, no recalculada", () => {
    const fixture = buildFixture();
    const { result } = mapCanonicalCalculationToPdfData({
      calculationResult: fixture,
      companyName: "Empresa Fixture S.A.S.",
      sector: "Software / Tecnología",
    });

    expect(result.enterpriseValue).toBe(fixture.valuation.enterpriseValue);
    expect(result.equityValue).toBe(fixture.valuation.equityValue);
    expect(result.wacc).toBe(fixture.valuation.wacc);
    expect(result.betaLevered).toBe(fixture.valuation.betaLevered);
    expect(result.terminalValue).toBe(fixture.valuation.terminalValue);
    expect(result.discountedTV).toBe(fixture.valuation.discountedTV);
    expect(result.evLow).toBe(fixture.valuation.evLow);
    expect(result.evHigh).toBe(fixture.valuation.evHigh);
    expect(result.evEbitda).toBe(fixture.valuation.evEbitda);
    expect(result.evRevenue).toBe(fixture.valuation.evRevenue);
    expect(result.netDebt).toBe(fixture.valuation.netDebt);

    expect(result.kpis.grossMargin).toBe(fixture.kpis.grossMargin);
    expect(result.kpis.ebitdaMargin).toBe(fixture.kpis.ebitdaMargin);
    expect(result.kpis.netMargin).toBe(fixture.kpis.netMargin);
    expect(result.kpis.leverage).toBe(fixture.kpis.leverage);
    expect(result.kpis.interestCoverage).toBe(fixture.kpis.interestCoverage);

    expect(result.projections).toEqual(fixture.projections);
    expect(result.scenarios.base).toEqual(fixture.scenarios.base.projections);
    expect(result.scenarios.pessimistic).toEqual(fixture.scenarios.pessimistic.projections);
    expect(result.scenarios.optimistic).toEqual(fixture.scenarios.optimistic.projections);
    expect(result.scenarioEVs).toEqual({
      pessimistic: fixture.scenarios.pessimistic.ev,
      base: fixture.scenarios.base.ev,
      optimistic: fixture.scenarios.optimistic.ev,
    });
    expect(result.sensitivityMatrix).toEqual(fixture.sensitivityMatrix);

    expect(result.sectorBenchmark.beta).toBe(fixture.sectorBenchmark.beta);
    expect(result.sectorBenchmark.waccRef).toBe(fixture.sectorBenchmark.waccRef);
    expect(result.sectorBenchmark.evEbitda).toBe(fixture.sectorBenchmark.evEbitda);
    // Etapa 8: label = sector (metadata, no la tabla del motor cliente); source/lastUpdated no inventados.
    expect(result.sectorBenchmark.label).toBe("Software / Tecnología");
    expect(result.sectorBenchmark.source).toBe("No disponible");

    // J. Trazabilidad: fingerprint/versión disponibles en el objeto que alimenta el PDF.
    expect(result.calculationMeta.input_fingerprint).toBe(fixture.version.input_fingerprint);
    expect(result.calculationMeta.calculation_schema_version).toBe(fixture.version.calculation_schema_version);
    expect(result.calculationMeta.calculated_at).toBe(fixture.version.calculated_at);
  });

  test("G. históricos: copia exacta del source_input_snapshot, sin recalcular", () => {
    const fixture = buildFixture();
    const { historicals } = mapCanonicalCalculationToPdfData({
      calculationResult: fixture,
      companyName: "Empresa Fixture S.A.S.",
      sector: "Software / Tecnología",
    });

    const is_ = fixture.source_input_snapshot.income_statement;
    const bs = fixture.source_input_snapshot.balance_sheet;
    expect(historicals.revenue).toBe(is_.revenue);
    expect(historicals.costOfSales).toBe(is_.cost_of_sales);
    expect(historicals.opex).toBe(is_.opex);
    expect(historicals.depreciation).toBe(is_.da);
    expect(historicals.ebitda).toBe(is_.ebitda);
    expect(historicals.ebit).toBe(is_.ebit);
    expect(historicals.interestExpense).toBe(is_.interest_expense);
    expect(historicals.taxes).toBe(is_.taxes);
    expect(historicals.netIncome).toBe(is_.net_income);
    expect(historicals.cash).toBe(bs.cash);
    expect(historicals.financialDebtTotal).toBe(bs.financial_debt_total);
    expect(historicals.equity).toBe(bs.equity);
    expect(historicals.totalAssets).toBe(bs.total_assets);
    expect(historicals.totalLiabilities).toBe(bs.total_liabilities);
  });

  test("H. un histórico null permanece null — nunca se convierte en 0 ni se deriva", () => {
    const fixture = buildFixture({
      snapshot: {
        income_statement: {
          revenue: 3_600_000,
          cost_of_sales: null,
          opex: null,
          da: 108_000,
          ebitda: null,
          ebit: null,
          interest_expense: 76_000,
          taxes: null,
          net_income: null,
        },
        balance_sheet: {
          cash: null,
          accounts_receivable: null,
          inventory: null,
          accounts_payable: null,
          ppe: null,
          current_financial_debt: null,
          long_term_financial_debt: null,
          financial_debt_total: null,
          equity: 2_100_000,
          total_assets: null,
          total_liabilities: null,
        },
      },
    });
    const { historicals } = mapCanonicalCalculationToPdfData({
      calculationResult: fixture,
      companyName: "Empresa Fixture S.A.S.",
      sector: "Software / Tecnología",
    });

    expect(historicals.costOfSales).toBeNull();
    expect(historicals.ebitda).toBeNull();
    expect(historicals.netIncome).toBeNull();
    expect(historicals.cash).toBeNull();
    expect(historicals.financialDebtTotal).toBeNull();
    expect(historicals.totalAssets).toBeNull();
    // Lo que SÍ está presente se preserva tal cual (no se "arrastra" un 0 a todo).
    expect(historicals.revenue).toBe(3_600_000);
    expect(historicals.equity).toBe(2_100_000);
  });

  test("I. snapshot ausente: el mapper falla explícito (fail-closed), no inventa históricos", () => {
    const fixture = buildFixture();
    (fixture as { source_input_snapshot?: unknown }).source_input_snapshot = undefined;

    expect(() =>
      mapCanonicalCalculationToPdfData({
        calculationResult: fixture,
        companyName: "Empresa Fixture S.A.S.",
        sector: "Software / Tecnología",
      })
    ).toThrow(/source_input_snapshot/);
  });

  test("supuesto faltante en assumptions_snapshot: el mapper falla explícito en vez de inventar el valor", () => {
    const fixture = buildFixture();
    delete (fixture.version.assumptions_snapshot as Record<string, unknown>).taxRatePct;

    expect(() =>
      mapCanonicalCalculationToPdfData({
        calculationResult: fixture,
        companyName: "Empresa Fixture S.A.S.",
        sector: "Software / Tecnología",
      })
    ).toThrow(/taxRatePct/);
  });

  test("moneda del calculation_result determina reportingCurrency", () => {
    const fixture = buildFixture();
    fixture.moneda = "COP";
    const { inputs } = mapCanonicalCalculationToPdfData({
      calculationResult: fixture,
      companyName: "Empresa Fixture S.A.S.",
      sector: "Software / Tecnología",
    });
    expect(inputs.reportingCurrency).toBe("COP");
  });
});
