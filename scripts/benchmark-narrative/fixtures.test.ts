import { describe, it, expect } from "vitest";
import { assertNarrativeCalculationResult } from "../../supabase/functions/_shared/narrative-calculation-adapter";
import { BENCHMARK_FIXTURES, findFixture } from "./fixtures";
import { FIXTURE_IDS } from "./types";

describe("BENCHMARK_FIXTURES — inventario", () => {
  it("exactamente 3 fixtures, con los ids esperados", () => {
    expect(BENCHMARK_FIXTURES.length).toBe(3);
    expect(BENCHMARK_FIXTURES.map((f) => f.id).sort()).toEqual([...FIXTURE_IDS].sort());
  });

  it("cada fixture pasa el gate real de producción (assertNarrativeCalculationResult) sin lanzar", () => {
    for (const fixture of BENCHMARK_FIXTURES) {
      expect(() => assertNarrativeCalculationResult(fixture.calculationResult)).not.toThrow();
    }
  });

  it("cada fixture declara calculation_schema_version 1.1.0", () => {
    for (const fixture of BENCHMARK_FIXTURES) {
      expect(fixture.calculationResult.version.calculation_schema_version).toBe("1.1.0");
    }
  });

  it("findFixture resuelve los 3 ids y lanza para uno desconocido", () => {
    for (const id of FIXTURE_IDS) {
      expect(findFixture(id).id).toBe(id);
    }
    // @ts-expect-error — id inválido deliberado para probar el throw
    expect(() => findFixture("NOT_A_FIXTURE")).toThrow();
  });
});

describe("CASE_A_MODERATE — discriminantes", () => {
  const fixture = findFixture("CASE_A_MODERATE");
  const { kpis, valuation } = fixture.calculationResult;

  it("EBITDA y margen neto positivos", () => {
    expect(kpis.ebitdaMargin).toBeGreaterThan(0);
    expect(kpis.netMargin).toBeGreaterThan(0);
  });

  it("leverage moderado y cobertura de intereses saludable", () => {
    expect(kpis.leverage).toBeLessThan(3);
    expect(kpis.interestCoverage).toBeGreaterThan(2);
  });

  it("EV positivo y sensibilidad no extrema (evHigh/evLow < 2x)", () => {
    expect(valuation.enterpriseValue).toBeGreaterThan(0);
    expect(valuation.evHigh / valuation.evLow).toBeLessThan(2);
  });

  it("historical sin nulls", () => {
    const { income_statement, balance_sheet } = fixture.calculationResult.source_input_snapshot;
    for (const v of Object.values(income_statement)) expect(v).not.toBeNull();
    for (const v of Object.values(balance_sheet)) expect(v).not.toBeNull();
  });
});

describe("CASE_B_FINANCIAL_STRESS — discriminantes", () => {
  const fixture = findFixture("CASE_B_FINANCIAL_STRESS");
  const { kpis, valuation } = fixture.calculationResult;

  it("EBITDA positivo pero margen neto negativo", () => {
    expect(kpis.ebitdaMargin).toBeGreaterThan(0);
    expect(kpis.netMargin).toBeLessThan(0);
  });

  it("leverage > 3x e interest coverage < 2x", () => {
    expect(kpis.leverage).toBeGreaterThan(3);
    expect(kpis.interestCoverage).toBeLessThan(2);
  });

  it("EV positivo con sensibilidad alta (evHigh/evLow > 2x)", () => {
    expect(valuation.enterpriseValue).toBeGreaterThan(0);
    expect(valuation.evHigh / valuation.evLow).toBeGreaterThan(2);
  });

  it("sectorBenchmark presente", () => {
    expect(fixture.calculationResult.sectorBenchmark).toBeTruthy();
  });
});

describe("CASE_C_INCOMPLETE_EVIDENCE — discriminantes", () => {
  const fixture = findFixture("CASE_C_INCOMPLETE_EVIDENCE");
  const { balance_sheet, income_statement } = fixture.calculationResult.source_input_snapshot;

  it("nulls reales en accounts_receivable/inventory/accounts_payable/ppe", () => {
    expect(balance_sheet.accounts_receivable).toBeNull();
    expect(balance_sheet.inventory).toBeNull();
    expect(balance_sheet.accounts_payable).toBeNull();
    expect(balance_sheet.ppe).toBeNull();
  });

  it("cifras centrales (cash, deuda, equity) permanecen disponibles pese a los nulls", () => {
    expect(balance_sheet.cash).not.toBeNull();
    expect(balance_sheet.financial_debt_total).not.toBeNull();
    expect(balance_sheet.equity).not.toBeNull();
    expect(income_statement.revenue).not.toBeNull();
    expect(income_statement.ebitda).not.toBeNull();
    expect(income_statement.net_income).not.toBeNull();
  });

  it("sectorBenchmark solo trae los 5 campos canónicos — nunca roe/roa de referencia", () => {
    const sb = fixture.calculationResult.sectorBenchmark as Record<string, unknown>;
    expect(Object.keys(sb).sort()).toEqual(["beta", "ebitdaMargin", "evEbitda", "evRevenue", "waccRef"]);
    expect(sb.roe).toBeUndefined();
    expect(sb.roa).toBeUndefined();
  });
});

describe("auditNarrativeBundle — variantes deterministas por fixture", () => {
  it("cada fixture trae las 5 variantes requeridas, todas con texto no vacío", () => {
    for (const fixture of BENCHMARK_FIXTURES) {
      const bundle = fixture.auditNarrativeBundle;
      for (const key of ["clean", "invented_number", "contradicts_calculation", "invented_source", "unsupported_claim"] as const) {
        expect(typeof bundle[key]).toBe("string");
        expect(bundle[key].length).toBeGreaterThan(0);
      }
    }
  });
});
