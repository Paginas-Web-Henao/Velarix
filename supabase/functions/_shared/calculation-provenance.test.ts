// Bloque 1C-T — Pruebas del contrato de procedencia. Importa la función
// real (`buildCalculationProvenance`), nunca reimplementa su lógica
// dentro de la prueba.

import { describe, it, expect } from "vitest";
import { buildCalculationProvenance, buildMissingProvenance, type HomologationReference } from "./calculation-provenance";

const ALL_FIELDS_ROWS: HomologationReference[] = [
  { id: "hom-revenue", document_id: "doc-1", canonical_account: "revenue" },
  { id: "hom-cogs", document_id: "doc-1", canonical_account: "cost_of_sales" },
  { id: "hom-opex", document_id: "doc-1", canonical_account: "opex" },
  { id: "hom-da", document_id: "doc-1", canonical_account: "da" },
  { id: "hom-interest", document_id: "doc-2", canonical_account: "interest_expense" },
  { id: "hom-debt-cp", document_id: "doc-2", canonical_account: "current_financial_debt" },
  { id: "hom-debt-lp", document_id: "doc-2", canonical_account: "long_term_financial_debt" },
  { id: "hom-cash", document_id: "doc-2", canonical_account: "cash" },
  { id: "hom-equity", document_id: "doc-2", canonical_account: "equity" },
];

function baseParams(rows: HomologationReference[]) {
  return {
    analysisId: "analysis-1",
    structuredInputId: "struct-1",
    homologationRows: rows,
    monedaAnalisis: "COP",
    monedaDocumento: "COP",
    factorConversion: 1,
    builtAt: "2026-07-23T00:00:00.000Z",
  };
}

describe("buildCalculationProvenance", () => {
  it("8. trazabilidad completa cuando existen todas las referencias (incluida la compuesta financial_debt_total)", () => {
    const p = buildCalculationProvenance(baseParams(ALL_FIELDS_ROWS));
    expect(p.overall_status).toBe("complete");
    for (const field of Object.keys(p.fields) as (keyof typeof p.fields)[]) {
      expect(p.fields[field].source_status).toBe("complete");
    }
    expect(p.fields.financial_debt_total.homologation_ids.sort()).toEqual(["hom-debt-cp", "hom-debt-lp"]);
  });

  it("9. trazabilidad parcial cuando faltan algunas referencias (incluye el caso compuesto: solo una mitad de financial_debt_total)", () => {
    const partialRows = ALL_FIELDS_ROWS.filter((r) => r.canonical_account !== "long_term_financial_debt" && r.canonical_account !== "cash");
    const p = buildCalculationProvenance(baseParams(partialRows));
    expect(p.overall_status).toBe("partial");
    expect(p.fields.financial_debt_total.source_status).toBe("partial"); // solo current_financial_debt
    expect(p.fields.cash.source_status).toBe("missing");
    expect(p.fields.revenue.source_status).toBe("complete");
    expect(p.warnings.some((w) => w.includes("financial_debt_total"))).toBe(true);
  });

  it("10. trazabilidad missing cuando no existe ninguna referencia — no se rellena con un arreglo vacío disfrazado de completa", () => {
    const p = buildCalculationProvenance(baseParams([]));
    expect(p.overall_status).toBe("missing");
    for (const field of Object.keys(p.fields) as (keyof typeof p.fields)[]) {
      expect(p.fields[field].source_status).toBe("missing");
      expect(p.fields[field].homologation_ids).toEqual([]);
    }
    expect(p.document_ids).toEqual([]);
    expect(p.homologation_ids).toEqual([]);
  });

  it("11. las referencias de revenue/deuda/caja/equity quedan preservadas con sus ids reales de homologación y documento", () => {
    const p = buildCalculationProvenance(baseParams(ALL_FIELDS_ROWS));
    expect(p.fields.revenue.homologation_ids).toEqual(["hom-revenue"]);
    expect(p.fields.revenue.document_ids).toEqual(["doc-1"]);
    expect(p.fields.cash.homologation_ids).toEqual(["hom-cash"]);
    expect(p.fields.equity.homologation_ids).toEqual(["hom-equity"]);
    expect(p.fields.financial_debt_total.document_ids).toEqual(["doc-2"]);
    expect(p.document_ids.sort()).toEqual(["doc-1", "doc-2"]);
  });

  it("source_row_ids siempre es null con status 'missing' explícito — no existe ese nivel de granularidad hoy", () => {
    const p = buildCalculationProvenance(baseParams(ALL_FIELDS_ROWS));
    expect(p.source_row_ids).toBeNull();
    expect(p.source_row_ids_status).toBe("missing");
    expect(p.warnings.some((w) => w.includes("source_row_ids"))).toBe(true);
  });

  it("no duplica ids cuando varias filas homologadas comparten el mismo canonical_account (consolidación por múltiples subcuentas)", () => {
    const rows: HomologationReference[] = [
      { id: "hom-a", document_id: "doc-1", canonical_account: "revenue" },
      { id: "hom-b", document_id: "doc-1", canonical_account: "revenue" },
    ];
    const p = buildCalculationProvenance(baseParams(rows));
    expect(p.fields.revenue.homologation_ids.sort()).toEqual(["hom-a", "hom-b"]);
    expect(p.fields.revenue.document_ids).toEqual(["doc-1"]);
  });

  it("12. no incluye ningún secreto ni token — solo ids de homologación/documento, moneda y estados", () => {
    const p = buildCalculationProvenance(baseParams(ALL_FIELDS_ROWS));
    const serialized = JSON.stringify(p).toLowerCase();
    for (const forbidden of ["service_role", "bearer ", "authorization", "secret", "password", "apikey", "supabase.co"]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(serialized).not.toMatch(/eyj[a-z0-9_-]+\.eyj[a-z0-9_-]+\./);
  });

  it("ajuste de semántica: una homologación existente con document_id: null NO cuenta como 'complete' — queda 'partial'", () => {
    const rows: HomologationReference[] = [
      { id: "hom-revenue", document_id: null, canonical_account: "revenue" },
    ];
    const p = buildCalculationProvenance(baseParams(rows));
    expect(p.fields.revenue.source_status).toBe("partial");
    expect(p.fields.revenue.homologation_ids).toEqual(["hom-revenue"]);
    expect(p.fields.revenue.document_ids).toEqual([]); // sin documento identificable
  });

  it("ajuste de semántica: cifra compuesta (financial_debt_total) donde una parte tiene documento y la otra no queda 'partial', no 'complete'", () => {
    const rows: HomologationReference[] = [
      { id: "hom-debt-cp", document_id: "doc-1", canonical_account: "current_financial_debt" },
      { id: "hom-debt-lp", document_id: null, canonical_account: "long_term_financial_debt" },
    ];
    const p = buildCalculationProvenance(baseParams(rows));
    expect(p.fields.financial_debt_total.source_status).toBe("partial");
    expect(p.fields.financial_debt_total.homologation_ids.sort()).toEqual(["hom-debt-cp", "hom-debt-lp"]);
    expect(p.fields.financial_debt_total.document_ids).toEqual(["doc-1"]);
  });

  it("ajuste de semántica: todas las referencias con homologación Y documento sí quedan 'complete'", () => {
    const p = buildCalculationProvenance(baseParams(ALL_FIELDS_ROWS));
    expect(p.overall_status).toBe("complete");
    expect(p.fields.financial_debt_total.source_status).toBe("complete");
    expect(p.fields.revenue.source_status).toBe("complete");
  });

  it("una cuenta sin ninguna homologación (ni siquiera sin documento) sigue siendo 'missing', no 'partial'", () => {
    const p = buildCalculationProvenance(baseParams([]));
    expect(p.fields.revenue.source_status).toBe("missing");
  });
});

describe("buildMissingProvenance", () => {
  it("declara explícitamente 'missing' en todos los campos documentales — usado cuando ejecutar-calculo no recibe procedencia adjunta al input", () => {
    const p = buildMissingProvenance({
      analysisId: "analysis-x",
      monedaAnalisis: "COP",
      monedaDocumento: null,
      factorConversion: 1,
      builtAt: "2026-07-23T00:00:00.000Z",
    });
    expect(p.overall_status).toBe("missing");
    expect(p.analysis_id).toBe("analysis-x");
    expect(p.structured_input_id).toBeNull();
  });

  it("ajuste de semántica: conserva la moneda y el factor de conversión REALES del cálculo — no asume COP/1 cuando el input indica otra cosa (caso USD, factor ≠ 1)", () => {
    const p = buildMissingProvenance({
      analysisId: "analysis-usd",
      monedaAnalisis: "USD",
      monedaDocumento: "USD",
      factorConversion: 4080,
      builtAt: "2026-07-23T00:00:00.000Z",
    });
    expect(p.currency.moneda_analisis).toBe("USD");
    expect(p.currency.moneda_documento).toBe("USD");
    expect(p.currency.factor_conversion).toBe(4080);
    expect(p.overall_status).toBe("missing"); // sin homologaciones, independientemente de la moneda
  });

  it("mismo caso con EUR y sin moneda de documento detectada", () => {
    const p = buildMissingProvenance({
      analysisId: "analysis-eur",
      monedaAnalisis: "EUR",
      monedaDocumento: null,
      factorConversion: 4450.5,
      builtAt: "2026-07-23T00:00:00.000Z",
    });
    expect(p.currency.moneda_analisis).toBe("EUR");
    expect(p.currency.moneda_documento).toBeNull();
    expect(p.currency.factor_conversion).toBe(4450.5);
  });
});
