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
