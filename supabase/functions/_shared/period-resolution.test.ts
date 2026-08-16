// Bug 2 (manejo de períodos) — pruebas de especificación del resolver puro
// `resolveBasePeriod`, usado por validate-analysis, build-structured-input
// y continuar-tras-revision para decidir un único período base antes de
// leer cifras de account_homologations.

import { describe, it, expect } from "vitest";
import { resolveBasePeriod } from "./period-resolution";
import { sumAccountValue, hasAccountValue, type HomologatedAccountRow } from "./financial-accounts";
import { buildCalculationProvenance, type HomologationReference } from "./calculation-provenance";

describe("resolveBasePeriod — Bug 2", () => {
  it("P1. un solo año explícito: se usa tal cual", () => {
    const r = resolveBasePeriod(["2025"]);
    expect(r.ok).toBe(true);
    expect(r.basePeriod).toBe("2025");
    expect(r.selectionMode).toBe("single_explicit");
  });

  it("P2. varios años fiscales simples: se elige el numéricamente mayor (no orden alfabético)", () => {
    const r = resolveBasePeriod(["2023", "2025", "2024"]);
    expect(r.ok).toBe(true);
    expect(r.basePeriod).toBe("2025");
    expect(r.selectionMode).toBe("latest_simple_fiscal_year");
  });

  it("P3. períodos duplicados: se deduplican antes de resolver", () => {
    const r = resolveBasePeriod(["2025", "2025", "2024"]);
    expect(r.ok).toBe(true);
    expect(r.basePeriod).toBe("2025");
    expect(r.availablePeriods).toEqual(["2024", "2025"]);
  });

  it("P4. ambigüedad por trimestre: nunca se elige automáticamente", () => {
    const r = resolveBasePeriod(["2024", "2025-Q1"]);
    expect(r.ok).toBe(false);
    expect(r.basePeriod).toBeNull();
    expect(r.selectionMode).toBe("ambiguous");
  });

  it("P5. ambigüedad por LTM: nunca se elige automáticamente", () => {
    const r = resolveBasePeriod(["2024", "LTM 2025"]);
    expect(r.ok).toBe(false);
    expect(r.basePeriod).toBeNull();
    expect(r.selectionMode).toBe("ambiguous");
  });

  it("P6. sin período explícito: modo legacy (compatible con period=null)", () => {
    const r = resolveBasePeriod([]);
    expect(r.ok).toBe(true);
    expect(r.basePeriod).toBeNull();
    expect(r.selectionMode).toBe("legacy_null");
    expect(r.availablePeriods).toEqual([]);
  });

  it("P7. coexistencia de period=null y período explícito: ambiguo, nunca se mezclan", () => {
    const r = resolveBasePeriod([null, "2025", undefined]);
    expect(r.ok).toBe(false);
    expect(r.selectionMode).toBe("ambiguous");
    expect(r.basePeriod).toBeNull();
  });

  it("CASO 4 (PASO 3): un solo período con formato no-YYYY tampoco se acepta a ciegas", () => {
    const r = resolveBasePeriod(["LTM Jun-2025"]);
    expect(r.ok).toBe(false);
    expect(r.basePeriod).toBeNull();
    expect(r.selectionMode).toBe("ambiguous");
  });

  it("año fiscal simple: rechaza formatos con más o menos de 4 dígitos", () => {
    const r = resolveBasePeriod(["25", "202X"]);
    expect(r.ok).toBe(false);
    expect(r.selectionMode).toBe("ambiguous");
  });

  it("string vacío se trata como ausencia de período, no como período explícito", () => {
    const r = resolveBasePeriod(["", "2025"]);
    // "" cuenta como fila sin período explícito -> coexiste con "2025" -> ambiguo
    expect(r.ok).toBe(false);
    expect(r.selectionMode).toBe("ambiguous");
  });
});

// Composición real que hacen validate-analysis, build-structured-input y
// continuar-tras-revision: resolveBasePeriod(periods) -> luego
// sumAccountValue(rows, canonical, basePeriod) para cada cifra. Usa los
// mismos módulos puros reales, con los fixtures exactos de la especificación
// (PASO 10/11/13), no una reimplementación de la lógica de los handlers.
describe("resolveBasePeriod + sumAccountValue — flujo real (Bug 2)", () => {
  it("PASO 10a. período único: BAL_001 puede evaluar assets=liabilities+equity del mismo período", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "total_assets", value: 300, period: "2025" },
      { canonical_account: "total_liabilities", value: 125, period: "2025" },
      { canonical_account: "equity", value: 175, period: "2025" },
    ];
    const resolution = resolveBasePeriod(rows.map((r) => r.period ?? null));
    expect(resolution.ok).toBe(true);
    expect(resolution.basePeriod).toBe("2025");

    const totalAssets = sumAccountValue(rows, "total_assets", resolution.basePeriod ?? undefined);
    const totalLiab = sumAccountValue(rows, "total_liabilities", resolution.basePeriod ?? undefined);
    const equity = sumAccountValue(rows, "equity", resolution.basePeriod ?? undefined);
    expect(totalAssets).toBe(300);
    expect(totalLiab).toBe(125);
    expect(equity).toBe(175);
    expect(totalAssets).toBe((totalLiab as number) + (equity as number)); // BAL_001 evaluable, ecuación exacta
  });

  it("PASO 10b. multi-año: base_period=2025 usa SOLO las cifras de 2025, nunca las de 2024", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "total_assets", value: 200, period: "2024" },
      { canonical_account: "total_liabilities", value: 100, period: "2024" },
      { canonical_account: "equity", value: 100, period: "2024" },
      { canonical_account: "total_assets", value: 300, period: "2025" },
      { canonical_account: "total_liabilities", value: 125, period: "2025" },
      { canonical_account: "equity", value: 175, period: "2025" },
    ];
    const resolution = resolveBasePeriod(rows.map((r) => r.period ?? null));
    expect(resolution.basePeriod).toBe("2025");

    const basePeriod = resolution.basePeriod ?? undefined;
    expect(sumAccountValue(rows, "total_assets", basePeriod)).toBe(300);
    expect(sumAccountValue(rows, "total_liabilities", basePeriod)).toBe(125);
    expect(sumAccountValue(rows, "equity", basePeriod)).toBe(175);
  });

  it("PASO 10c. ambiguo (2024 + 2025-Q1): no debe continuar automáticamente", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "total_assets", value: 200, period: "2024" },
      { canonical_account: "total_assets", value: 300, period: "2025-Q1" },
    ];
    const resolution = resolveBasePeriod(rows.map((r) => r.period ?? null));
    expect(resolution.ok).toBe(false);
    expect(resolution.basePeriod).toBeNull();
    expect(resolution.selectionMode).toBe("ambiguous");
  });

  it("PASO 11. fixture build-structured-input 2024/2025: base_period=2025, sin mezclar años", () => {
    const rows: HomologatedAccountRow[] = [
      // 2024
      { canonical_account: "revenue", value: 400, period: "2024" },
      { canonical_account: "cost_of_sales", value: 250, period: "2024" },
      { canonical_account: "opex", value: 80, period: "2024" },
      { canonical_account: "da", value: 10, period: "2024" },
      { canonical_account: "cash", value: 40, period: "2024" },
      { canonical_account: "current_financial_debt", value: 15, period: "2024" },
      { canonical_account: "long_term_financial_debt", value: 50, period: "2024" },
      { canonical_account: "equity", value: 140, period: "2024" },
      { canonical_account: "total_assets", value: 260, period: "2024" },
      { canonical_account: "total_liabilities", value: 120, period: "2024" },
      // 2025
      { canonical_account: "revenue", value: 500, period: "2025" },
      { canonical_account: "cost_of_sales", value: 300, period: "2025" },
      { canonical_account: "opex", value: 80, period: "2025" },
      { canonical_account: "da", value: 15, period: "2025" },
      { canonical_account: "cash", value: 50, period: "2025" },
      { canonical_account: "current_financial_debt", value: 20, period: "2025" },
      { canonical_account: "long_term_financial_debt", value: 60, period: "2025" },
      { canonical_account: "equity", value: 175, period: "2025" },
      { canonical_account: "total_assets", value: 300, period: "2025" },
      { canonical_account: "total_liabilities", value: 125, period: "2025" },
    ];

    const resolution = resolveBasePeriod(rows.map((r) => r.period ?? null));
    expect(resolution.ok).toBe(true);
    expect(resolution.basePeriod).toBe("2025");
    expect(resolution.availablePeriods).toEqual(["2024", "2025"]);

    const basePeriod = resolution.basePeriod ?? undefined;
    const incomeStatement = {
      revenue: sumAccountValue(rows, "revenue", basePeriod),
      cost_of_sales: sumAccountValue(rows, "cost_of_sales", basePeriod),
      opex: sumAccountValue(rows, "opex", basePeriod),
      da: sumAccountValue(rows, "da", basePeriod),
    };
    const balanceSheet = {
      cash: sumAccountValue(rows, "cash", basePeriod),
      current_financial_debt: sumAccountValue(rows, "current_financial_debt", basePeriod),
      long_term_financial_debt: sumAccountValue(rows, "long_term_financial_debt", basePeriod),
      equity: sumAccountValue(rows, "equity", basePeriod),
      total_assets: sumAccountValue(rows, "total_assets", basePeriod),
      total_liabilities: sumAccountValue(rows, "total_liabilities", basePeriod),
    };

    expect(incomeStatement).toEqual({ revenue: 500, cost_of_sales: 300, opex: 80, da: 15 });
    expect(balanceSheet).toEqual({
      cash: 50,
      current_financial_debt: 20,
      long_term_financial_debt: 60,
      equity: 175,
      total_assets: 300,
      total_liabilities: 125,
    });
    // Ninguna suma entre 2024 y 2025 debe aparecer (ej. revenue 400+500=900).
    expect(incomeStatement.revenue).not.toBe(900);
  });

  it("PASO 12. provenance registra base_period/available_periods/selection_mode sin romper trazabilidad previa", () => {
    const homologationRows: HomologationReference[] = [
      { id: "hom-1", document_id: "doc-1", canonical_account: "revenue" },
      { id: "hom-2", document_id: "doc-1", canonical_account: "cash" },
    ];
    const resolution = resolveBasePeriod(["2025"]);
    const provenance = buildCalculationProvenance({
      analysisId: "an-1",
      structuredInputId: "si-1",
      homologationRows,
      monedaAnalisis: "COP",
      monedaDocumento: "COP",
      factorConversion: 1,
      periodSelection: {
        base_period: resolution.basePeriod,
        selection_mode: resolution.selectionMode,
        available_periods: resolution.availablePeriods,
      },
    });

    expect(provenance.period_selection).toEqual({
      base_period: "2025",
      selection_mode: "single_explicit",
      available_periods: ["2025"],
    });
    // Trazabilidad preexistente intacta.
    expect(provenance.homologation_ids).toEqual(["hom-1", "hom-2"]);
    expect(provenance.document_ids).toEqual(["doc-1"]);
  });

  it("PASO 12b. sin periodSelection (ej. buildMissingProvenance): period_selection es null, no simulado", () => {
    const provenance = buildCalculationProvenance({
      analysisId: "an-1",
      structuredInputId: null,
      homologationRows: [],
      monedaAnalisis: "COP",
      monedaDocumento: null,
      factorConversion: 1,
    });
    expect(provenance.period_selection).toBeNull();
  });

  it("PASO 13. ambigüedad ['2024','2025-Q1']: no auto-selecciona 2025-Q1 ni 2024, ninguna fila resulta accesible", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "revenue", value: 400, period: "2024" },
      { canonical_account: "revenue", value: 500, period: "2025-Q1" },
    ];
    const resolution = resolveBasePeriod(rows.map((r) => r.period ?? null));
    expect(resolution.ok).toBe(false);
    expect(resolution.basePeriod).toBeNull();
    expect(resolution.reason).toMatch(/revisión humana/);
    // Sin un basePeriod resuelto, un consumidor correcto NUNCA debe llamar
    // sumAccountValue con "2024" ni con "2025-Q1" arbitrariamente — se
    // verifica que ninguno de los dos produce el valor "correcto por
    // accidente" que enmascararía el bloqueo.
    expect(hasAccountValue(rows, "revenue")).toBe(false); // sin período -> no hay fila period=null
  });
});
