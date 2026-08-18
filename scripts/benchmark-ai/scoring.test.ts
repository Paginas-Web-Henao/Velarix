import { describe, it, expect } from "vitest";
import { compareAccounts, comparePeriods, compareClassifier, extractJSON } from "./scoring";
import { BENCHMARK_FIXTURES, FIXTURE_CLEAN, FIXTURE_NOISY } from "./fixtures";

describe("fixtures — ground truth se carga", () => {
  it("hay exactamente 2 fixtures (CLEAN y NOISY)", () => {
    expect(BENCHMARK_FIXTURES.length).toBe(2);
    expect(BENCHMARK_FIXTURES.map((f) => f.id)).toEqual(["clean_caso_a", "noisy_caso_a"]);
  });

  it("ambos fixtures comparten el mismo ground truth económico (mismos valores, mismas cuentas)", () => {
    expect(FIXTURE_CLEAN.expected_values).toEqual(FIXTURE_NOISY.expected_values);
    expect(FIXTURE_CLEAN.expected_accounts).toEqual(FIXTURE_NOISY.expected_accounts);
    expect(FIXTURE_CLEAN.expected_periods).toEqual(["2025"]);
    expect(FIXTURE_NOISY.expected_periods).toEqual(["2025"]);
  });

  it("NOISY no introduce ambigüedad nueva (tiene notas explícitas al respecto)", () => {
    expect(FIXTURE_CLEAN.ambiguity_notes).toBeNull();
    expect(FIXTURE_NOISY.ambiguity_notes).toContain("Ninguna ambigüedad económica nueva");
  });
});

describe("extractJSON — mirror de la lógica de producción", () => {
  it("extrae un bloque JSON válido embebido en texto libre", () => {
    const parsed = extractJSON('Aquí está: {"a": 1, "b": [1,2,3]} — listo.');
    expect(parsed).toEqual({ a: 1, b: [1, 2, 3] });
  });

  it("devuelve null si no hay JSON parseable", () => {
    expect(extractJSON("no hay json aquí")).toBeNull();
    expect(extractJSON(null)).toBeNull();
  });
});

describe("compareAccounts", () => {
  it("detecta match exacto por sinónimo y valor", () => {
    const result = compareAccounts(FIXTURE_CLEAN.accounts, [
      { original_label: "Ingresos", values: { col_1: 5_000_000_000 } },
    ]);
    expect(result.truePositives).toEqual(["revenue"]);
    expect(result.valueExactMatches).toEqual(["revenue"]);
    expect(result.valueMismatches).toEqual([]);
    expect(result.missingAccounts).not.toContain("revenue");
  });

  it("detecta cuenta faltante (missing)", () => {
    const result = compareAccounts(FIXTURE_CLEAN.accounts, []);
    expect(result.missingAccounts).toEqual(FIXTURE_CLEAN.accounts.map((a) => a.id));
    expect(result.truePositives).toEqual([]);
  });

  it("detecta cuenta inesperada/fabricada (unexpected)", () => {
    const result = compareAccounts(FIXTURE_CLEAN.accounts, [
      { original_label: "Ingresos", values: { col_1: 5_000_000_000 } },
      { original_label: "Concepto inventado que no existe", values: { col_1: 999 } },
    ]);
    expect(result.unexpectedAccounts).toEqual(["Concepto inventado que no existe"]);
  });

  it("detecta value mismatch cuando la cuenta se identifica pero el valor no coincide", () => {
    const result = compareAccounts(FIXTURE_CLEAN.accounts, [
      { original_label: "Ingresos", values: { col_1: 4_999_999_999 } },
    ]);
    expect(result.truePositives).toEqual(["revenue"]);
    expect(result.valueExactMatches).toEqual([]);
    expect(result.valueMismatches).toEqual([{ id: "revenue", expected: 5_000_000_000, extracted: 4_999_999_999 }]);
  });

  it("reconoce sinónimos del fixture NOISY igual que las etiquetas del fixture CLEAN", () => {
    const result = compareAccounts(FIXTURE_NOISY.accounts, [
      { original_label: "Ventas netas", values: { col_1: 5_000_000_000 } },
      { original_label: "Costo de mercancía vendida", values: { col_1: 3_000_000_000 } },
    ]);
    expect(result.truePositives.sort()).toEqual(["cost_of_sales", "revenue"]);
    expect(result.valueExactMatches.sort()).toEqual(["cost_of_sales", "revenue"]);
  });

  it("REGRESIÓN — 'ventas' (sinónimo de revenue) NO matchea 'Gastos de administración y ventas' (opex): el matcher es exacto, no substring", () => {
    const result = compareAccounts(FIXTURE_CLEAN.accounts, [
      { original_label: "Gastos de administración y ventas", values: { col_1: 800_000_000 } },
    ]);
    // Debe reconocerse como opex (match exacto con su propio sinónimo)...
    expect(result.truePositives).toEqual(["opex"]);
    // ...y NUNCA como revenue, aunque "ventas" sea substring de la etiqueta.
    expect(result.truePositives).not.toContain("revenue");
    expect(result.missingAccounts).toContain("revenue");
  });

  it("OPEX sigue matcheando correctamente con su propio sinónimo exacto", () => {
    const result = compareAccounts(FIXTURE_CLEAN.accounts, [
      { original_label: "Gastos operativos", values: { col_1: 800_000_000 } },
    ]);
    expect(result.truePositives).toEqual(["opex"]);
    expect(result.valueExactMatches).toEqual(["opex"]);
  });

  // Regresión — hallazgo del primer pilot real (gpt-5.6-terra, noisy_caso_a,
  // parser_fallback): el modelo devolvió estas dos etiquetas EXACTAS, tal
  // como aparecen literalmente en FIXTURE_NOISY.source_text, pero el ground
  // truth no las tenía como sinónimo -> SCORER_FALSE_NEGATIVE (no error del
  // modelo). Corrección: agregar la forma literal a labelSynonyms.

  it("A — 'Depreciación y amortización del ejercicio' (forma literal de NOISY) matchea da", () => {
    const result = compareAccounts(FIXTURE_NOISY.accounts, [
      { original_label: "Depreciación y amortización del ejercicio", values: { col_1: 150_000_000 } },
    ]);
    expect(result.truePositives).toEqual(["da"]);
    expect(result.valueExactMatches).toEqual(["da"]);
    expect(result.unexpectedAccounts).toEqual([]);
  });

  it("B — 'Obligaciones financieras (corto y largo plazo)' (forma literal de NOISY) matchea financial_debt_total", () => {
    const result = compareAccounts(FIXTURE_NOISY.accounts, [
      { original_label: "Obligaciones financieras (corto y largo plazo)", values: { col_1: 1_000_000_000 } },
    ]);
    expect(result.truePositives).toEqual(["financial_debt_total"]);
    expect(result.valueExactMatches).toEqual(["financial_debt_total"]);
    expect(result.unexpectedAccounts).toEqual([]);
  });

  it("C — extracción equivalente de las 8 cuentas del fixture NOISY con sus etiquetas literales: 8 true positives, 0 missing, 0 unexpected, todos los valores exactos", () => {
    const rows = [
      { original_label: "Ventas netas", values: { col_1: 5_000_000_000 } },
      { original_label: "Costo de mercancía vendida", values: { col_1: 3_000_000_000 } },
      { original_label: "Gastos de administración y ventas", values: { col_1: 800_000_000 } },
      { original_label: "Depreciación y amortización del ejercicio", values: { col_1: 150_000_000 } },
      { original_label: "Intereses pagados", values: { col_1: 80_000_000 } },
      { original_label: "Obligaciones financieras (corto y largo plazo)", values: { col_1: 1_000_000_000 } },
      { original_label: "Posición de caja", values: { col_1: 600_000_000 } },
      { original_label: "Patrimonio de los accionistas", values: { col_1: 3_000_000_000 } },
    ];
    const result = compareAccounts(FIXTURE_NOISY.accounts, rows);
    expect(result.truePositives.length).toBe(8);
    expect(result.missingAccounts).toEqual([]);
    expect(result.unexpectedAccounts).toEqual([]);
    expect(result.valueExactMatches.length).toBe(8);
    expect(result.valueMismatches).toEqual([]);
  });

  it("D — agregar la forma literal a labelSynonyms NO abre la puerta a substring: una etiqueta que solo CONTIENE el nuevo sinónimo no matchea por substring", () => {
    const result = compareAccounts(FIXTURE_NOISY.accounts, [
      { original_label: "Proyección de Obligaciones financieras (corto y largo plazo) para 2026", values: { col_1: 1_000_000_000 } },
    ]);
    expect(result.truePositives).not.toContain("financial_debt_total");
    expect(result.missingAccounts).toContain("financial_debt_total");
  });
});

describe("comparePeriods — no depende del orden", () => {
  it("exactSetMatch=true sin importar el orden de entrada", () => {
    const a = comparePeriods(["2024", "2025"], ["2025", "2024"]);
    expect(a.exactSetMatch).toBe(true);
    expect(a.missingPeriods).toEqual([]);
    expect(a.unexpectedPeriods).toEqual([]);
  });

  it("detecta período faltante y período inesperado simultáneamente", () => {
    const r = comparePeriods(["2024", "2025"], ["2025", "2026"]);
    expect(r.exactSetMatch).toBe(false);
    expect(r.missingPeriods).toEqual(["2024"]);
    expect(r.unexpectedPeriods).toEqual(["2026"]);
  });
});

describe("compareClassifier", () => {
  it("exactMatch true cuando el tipo devuelto coincide", () => {
    const r = compareClassifier("mixto", { tipo_documento: "mixto", confianza: 0.9, advertencias: [], puede_continuar: true });
    expect(r.exactMatch).toBe(true);
    expect(r.confidence).toBe(0.9);
    expect(r.puedeContinuar).toBe(true);
  });

  it("exactMatch false y campos null cuando el parsed es inválido", () => {
    const r = compareClassifier("mixto", null);
    expect(r.exactMatch).toBe(false);
    expect(r.returnedType).toBeNull();
    expect(r.confidence).toBeNull();
  });
});
