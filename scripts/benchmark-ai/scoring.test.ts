import { describe, it, expect } from "vitest";
import { compareAccounts, comparePeriods, compareClassifier, extractJSON } from "./scoring";
import { BENCHMARK_FIXTURES, FIXTURE_CLEAN, FIXTURE_NOISY, FIXTURE_HARD } from "./fixtures";

describe("fixtures — ground truth se carga", () => {
  it("hay exactamente 3 fixtures (CLEAN, NOISY y HARD)", () => {
    expect(BENCHMARK_FIXTURES.length).toBe(3);
    expect(BENCHMARK_FIXTURES.map((f) => f.id)).toEqual(["clean_caso_a", "noisy_caso_a", "hard_aurora_multi_periodo"]);
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

// ═══════════════════════════════════════════════════════════════
// FIXTURE_HARD — 21 casos obligatorios antes de llamar a ninguna API.
// Numeración según el pedido de la ronda HARD.
// ═══════════════════════════════════════════════════════════════

const HARD_HEADERS = ["Cuenta", "2024", "2025"];

// Fila por fila: la extracción "perfecta" del fixture HARD — mismas
// etiquetas literales de source_text, mismos valores del ground truth.
// "Resultado neto del ejercicio" no tiene col_1 (2024 ausente a propósito).
function hardPerfectRows() {
  return [
    { original_label: "Patrimonio neto", values: { col_1: 2_900_000_000, col_2: 3_150_000_000 } },
    { original_label: "Resultado neto del ejercicio", values: { col_2: -52_300_000 } },
    { original_label: "Efectivo y equivalentes de efectivo", values: { col_1: 410_000_000, col_2: 455_000_000 } },
    { original_label: "Ingresos de actividades ordinarias", values: { col_1: 6_200_000_000, col_2: 6_850_000_000 } },
    { original_label: "Obligaciones financieras totales", values: { col_1: 1_450_000_000, col_2: 1_600_000_000 } },
    { original_label: "Costo de mercancía vendida", values: { col_1: 3_700_000_000, col_2: 4_050_000_000 } },
    { original_label: "Gastos de administración y ventas", values: { col_1: 950_000_000, col_2: 1_020_000_000 } },
    { original_label: "Gasto por depreciación y amortización", values: { col_1: 180_000_000, col_2: 195_000_000 } },
  ];
}

// 1, 2, 3, 4 — carga y forma del ground truth
describe("FIXTURE_HARD — carga y forma del ground truth (casos 1-4)", () => {
  it("1. HARD está cargado en BENCHMARK_FIXTURES", () => {
    expect(BENCHMARK_FIXTURES.some((f) => f.id === "hard_aurora_multi_periodo")).toBe(true);
    expect(FIXTURE_HARD.id).toBe("hard_aurora_multi_periodo");
  });

  it("2. HARD expected_periods = exactamente ['2024','2025']", () => {
    expect(FIXTURE_HARD.expected_periods).toEqual(["2024", "2025"]);
  });

  it("3. cada cuenta HARD tiene exactamente un labelSynonym (fidelidad documental, sin sinónimos amplios)", () => {
    for (const account of FIXTURE_HARD.accounts) {
      expect(account.labelSynonyms.length).toBe(1);
    }
  });

  it("4. net_income: 2024 = null, 2025 = -52_300_000", () => {
    const netIncome = FIXTURE_HARD.accounts.find((a) => a.id === "net_income");
    expect(netIncome?.expectedValuesByPeriod).toEqual({ "2024": null, "2025": -52_300_000 });
  });

  it("'Costo de ventas' (sinónimo semántico, NO literal) no matchea cost_of_sales en HARD — solo el literal exacto de source_text", () => {
    const result = compareAccounts(FIXTURE_HARD.accounts, [{ original_label: "Costo de ventas", values: { col_1: 3_700_000_000 } }], HARD_HEADERS);
    expect(result.truePositives).not.toContain("cost_of_sales");
    expect(result.missingAccounts).toContain("cost_of_sales");
  });
});

// 5-14 — scoring multi-período por cuenta × período
describe("compareAccounts — multi-período HARD (casos 5-14)", () => {
  it("5. ambos períodos correctos -> 2 exact_match", () => {
    const result = compareAccounts(FIXTURE_HARD.accounts, hardPerfectRows(), HARD_HEADERS);
    const revenueOutcomes = result.periodValueOutcomes.filter((o) => o.accountId === "revenue");
    expect(revenueOutcomes).toEqual([
      { accountId: "revenue", period: "2024", expected: 6_200_000_000, returned: 6_200_000_000, outcome: "exact_match" },
      { accountId: "revenue", period: "2025", expected: 6_850_000_000, returned: 6_850_000_000, outcome: "exact_match" },
    ]);
  });

  it("6. 2024 correcto / 2025 incorrecto -> solo 2025 mismatch", () => {
    const rows = [{ original_label: "Ingresos de actividades ordinarias", values: { col_1: 6_200_000_000, col_2: 999 } }];
    const result = compareAccounts(FIXTURE_HARD.accounts, rows, HARD_HEADERS);
    const outcomes = result.periodValueOutcomes;
    expect(outcomes.find((o) => o.period === "2024")?.outcome).toBe("exact_match");
    expect(outcomes.find((o) => o.period === "2025")).toEqual({ accountId: "revenue", period: "2025", expected: 6_850_000_000, returned: 999, outcome: "mismatch" });
  });

  it("7. expected null + clave ausente (sin col_1) -> correctly_absent", () => {
    const rows = [{ original_label: "Resultado neto del ejercicio", values: { col_2: -52_300_000 } }];
    const result = compareAccounts(FIXTURE_HARD.accounts, rows, HARD_HEADERS);
    expect(result.periodValueOutcomes.find((o) => o.accountId === "net_income" && o.period === "2024")).toEqual({
      accountId: "net_income", period: "2024", expected: null, returned: null, outcome: "correctly_absent",
    });
  });

  it("8. expected null + null explícito -> correctly_absent (mismo outcome que clave ausente)", () => {
    const rows = [{ original_label: "Resultado neto del ejercicio", values: { col_1: null, col_2: -52_300_000 } }];
    const result = compareAccounts(FIXTURE_HARD.accounts, rows, HARD_HEADERS);
    expect(result.periodValueOutcomes.find((o) => o.accountId === "net_income" && o.period === "2024")?.outcome).toBe("correctly_absent");
  });

  it("9. expected null + número -> fabricated_absent", () => {
    const rows = [{ original_label: "Resultado neto del ejercicio", values: { col_1: 40_000_000, col_2: -52_300_000 } }];
    const result = compareAccounts(FIXTURE_HARD.accounts, rows, HARD_HEADERS);
    expect(result.periodValueOutcomes.find((o) => o.accountId === "net_income" && o.period === "2024")).toEqual({
      accountId: "net_income", period: "2024", expected: null, returned: 40_000_000, outcome: "fabricated_absent",
    });
  });

  it("10. expected null + 0 -> fabricated_absent (0 NUNCA es ausencia)", () => {
    const rows = [{ original_label: "Resultado neto del ejercicio", values: { col_1: 0, col_2: -52_300_000 } }];
    const result = compareAccounts(FIXTURE_HARD.accounts, rows, HARD_HEADERS);
    expect(result.periodValueOutcomes.find((o) => o.accountId === "net_income" && o.period === "2024")).toEqual({
      accountId: "net_income", period: "2024", expected: null, returned: 0, outcome: "fabricated_absent",
    });
  });

  it("11. expected número + clave ausente -> missing_reported_value", () => {
    const rows = [{ original_label: "Patrimonio neto", values: { col_2: 3_150_000_000 } }]; // sin col_1 (2024)
    const result = compareAccounts(FIXTURE_HARD.accounts, rows, HARD_HEADERS);
    expect(result.periodValueOutcomes.find((o) => o.accountId === "equity" && o.period === "2024")).toEqual({
      accountId: "equity", period: "2024", expected: 2_900_000_000, returned: null, outcome: "missing_reported_value",
    });
  });

  it("12. headers invertidos (['Cuenta','2025','2024']) + valores correctamente alineados -> exact_match (mapeo por contenido, no por posición)", () => {
    const invertedHeaders = ["Cuenta", "2025", "2024"];
    const rows = [{ original_label: "Patrimonio neto", values: { col_1: 3_150_000_000, col_2: 2_900_000_000 } }]; // col_1=2025, col_2=2024
    const result = compareAccounts(FIXTURE_HARD.accounts, rows, invertedHeaders);
    const outcomes = result.periodValueOutcomes;
    expect(outcomes.find((o) => o.period === "2024")?.outcome).toBe("exact_match");
    expect(outcomes.find((o) => o.period === "2025")?.outcome).toBe("exact_match");
  });

  it("13. headers canónicos + valores intercambiados -> dos mismatch (sin lógica especial, cada período se compara contra el número equivocado)", () => {
    const rows = [{ original_label: "Patrimonio neto", values: { col_1: 3_150_000_000, col_2: 2_900_000_000 } }]; // 2024 y 2025 cruzados
    const result = compareAccounts(FIXTURE_HARD.accounts, rows, HARD_HEADERS);
    const outcomes = result.periodValueOutcomes;
    expect(outcomes.find((o) => o.period === "2024")).toEqual({ accountId: "equity", period: "2024", expected: 2_900_000_000, returned: 3_150_000_000, outcome: "mismatch" });
    expect(outcomes.find((o) => o.period === "2025")).toEqual({ accountId: "equity", period: "2025", expected: 3_150_000_000, returned: 2_900_000_000, outcome: "mismatch" });
  });

  it("14. col_3 sin header correspondiente -> unexpectedColumnValues, no se descarta en silencio", () => {
    const rows = [{ original_label: "Patrimonio neto", values: { col_1: 2_900_000_000, col_2: 3_150_000_000, col_3: 999 } }];
    const result = compareAccounts(FIXTURE_HARD.accounts, rows, HARD_HEADERS);
    expect(result.unexpectedColumnValues).toEqual([{ accountId: "equity", columnKey: "col_3", value: 999 }]);
  });
});

// 15 — período inesperado sigue detectándose en comparePeriods (sin cambios en esa función)
describe("comparePeriods — HARD, 2 períodos (caso 15)", () => {
  it("15. un período inesperado en headers (ej. '2026') sigue apareciendo como unexpectedPeriods", () => {
    const r = comparePeriods(FIXTURE_HARD.expected_periods, ["2024", "2025", "2026"]);
    expect(r.exactSetMatch).toBe(false);
    expect(r.unexpectedPeriods).toEqual(["2026"]);
    expect(r.missingPeriods).toEqual([]);
  });
});

// 16, 17, 18 — cuenta canónica ausente vs. cuenta/fila inventada
describe("compareAccounts — cuenta ausente vs. inventada (casos 16-18)", () => {
  it("16. 'taxes' no está en expected_accounts de HARD; con la extracción perfecta (sin fila de impuestos) no hay penalización", () => {
    expect(FIXTURE_HARD.expected_accounts).not.toContain("taxes");
    const result = compareAccounts(FIXTURE_HARD.accounts, hardPerfectRows(), HARD_HEADERS);
    expect(result.missingAccounts).toEqual([]);
    expect(result.unexpectedAccounts).toEqual([]);
  });

  it("17. fila inventada 'Impuesto de renta' -> unexpectedAccounts", () => {
    const rows = [...hardPerfectRows(), { original_label: "Impuesto de renta", values: { col_1: 10_000_000, col_2: 12_000_000 } }];
    const result = compareAccounts(FIXTURE_HARD.accounts, rows, HARD_HEADERS);
    expect(result.unexpectedAccounts).toContain("Impuesto de renta");
    expect(result.missingAccounts).toEqual([]);
  });

  it("18. fila inventada desde narrativa ('87 empleados') -> unexpectedAccounts, nunca se convierte en cuenta", () => {
    const rows = [...hardPerfectRows(), { original_label: "87 empleados", values: { col_1: 87 } }];
    const result = compareAccounts(FIXTURE_HARD.accounts, rows, HARD_HEADERS);
    expect(result.unexpectedAccounts).toContain("87 empleados");
  });
});

// 19, 20 — regresión CLEAN/NOISY tras el cambio multi-período (mismo
// resultado que antes de agregar HARD; ver también los describe blocks de
// compareAccounts arriba, que ya ejercitan CLEAN/NOISY sin columnHeaders).
describe("regresión CLEAN/NOISY tras agregar scoring multi-período (casos 19-20)", () => {
  it("19. CLEAN — extracción perfecta sigue dando 8 truePositives / 8 valueExactMatches, sin periodValueOutcomes", () => {
    const rows = FIXTURE_CLEAN.accounts.map((a) => ({ original_label: a.labelSynonyms[0], values: { col_1: a.expectedValue } }));
    const result = compareAccounts(FIXTURE_CLEAN.accounts, rows);
    expect(result.truePositives.length).toBe(8);
    expect(result.valueExactMatches.length).toBe(8);
    expect(result.missingAccounts).toEqual([]);
    expect(result.periodValueOutcomes).toEqual([]);
    expect(result.unexpectedColumnValues).toEqual([]);
  });

  it("20. NOISY — extracción perfecta con etiquetas literales de NOISY sigue dando 8/8, sin periodValueOutcomes", () => {
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
    expect(result.valueExactMatches.length).toBe(8);
    expect(result.periodValueOutcomes).toEqual([]);
  });
});

// 21 — camino legacy explícito: HARD sin columnHeaders no rompe, cae al
// respaldo de un solo valor (expectedValue = cifra del período más
// reciente, 2025) en vez de crashear o devolver basura.
describe("compareAccounts — legacy sin expectedValuesByPeriod / sin columnHeaders (caso 21)", () => {
  it("21a. cuenta SIN expectedValuesByPeriod (CLEAN) mantiene comportamiento actual sin cambios", () => {
    const result = compareAccounts(FIXTURE_CLEAN.accounts, [{ original_label: "Ingresos", values: { col_1: 5_000_000_000 } }]);
    expect(result.truePositives).toEqual(["revenue"]);
    expect(result.valueExactMatches).toEqual(["revenue"]);
    expect(result.valueMismatches).toEqual([]);
  });

  it("21b. cuenta HARD (con expectedValuesByPeriod) invocada SIN columnHeaders cae al respaldo legacy (expectedValue = cifra 2025) en vez de fallar", () => {
    const rows = [{ original_label: "Ingresos de actividades ordinarias", values: { col_1: 6_850_000_000 } }];
    const result = compareAccounts(FIXTURE_HARD.accounts, rows); // sin 3er argumento
    expect(result.truePositives).toEqual(["revenue"]);
    expect(result.valueExactMatches).toEqual(["revenue"]);
    expect(result.periodValueOutcomes).toEqual([]);
  });
});
