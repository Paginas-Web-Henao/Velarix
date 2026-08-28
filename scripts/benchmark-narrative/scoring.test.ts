import { describe, it, expect } from "vitest";
import {
  extractNumericTokens,
  normalizeNumericToken,
  detectInventedNumbers,
  detectInventedSource,
  detectUnsupportedClaim,
  detectContradictsCalculation,
  detectTreatsMissingAsZero,
  detectInventsMethodology,
  scoreOutput,
  CASE_C_NULL_FIELD_LABELS,
} from "./scoring";
import { findFixture } from "./fixtures";
import { buildViewModel } from "./tasks";

describe("normalizeNumericToken — tolera formatos con separadores", () => {
  it("miles con coma: 4,200,000", () => {
    expect(normalizeNumericToken({ raw: "4,200,000", kind: "plain" })).toBe(4_200_000);
  });
  it("miles con punto (formato colombiano): 4.200.000", () => {
    expect(normalizeNumericToken({ raw: "4.200.000", kind: "plain" })).toBe(4_200_000);
  });
  it("porcentaje con decimal: 21.0%", () => {
    expect(normalizeNumericToken({ raw: "21.0%", kind: "percent" })).toBe(21.0);
  });
  it("porcentaje con coma decimal: 21,0%", () => {
    expect(normalizeNumericToken({ raw: "21,0%", kind: "percent" })).toBe(21.0);
  });
  it("múltiplo: 7.2x", () => {
    expect(normalizeNumericToken({ raw: "7.2x", kind: "multiple" })).toBe(7.2);
  });
  it("con símbolo de dólar: $4,200,000", () => {
    expect(normalizeNumericToken({ raw: "$4,200,000", kind: "plain" })).toBe(4_200_000);
  });
});

describe("K. detecta cifra inventada sencilla", () => {
  it("una cifra que no existe en ninguna evidencia se marca invented_number", () => {
    const evidence = ["Enterprise Value: USD 4,200,000. WACC: 10.1%."];
    const output = "El EBITDA reportado asciende a USD 9,850,000, una cifra sobresaliente.";
    const result = detectInventedNumbers(output, evidence);
    expect(result.invented).toContain("9,850,000");
  });
});

describe("L. NO marca como inventado un valor real con formato distinto razonable", () => {
  it("el mismo número en distinto formato de separadores no se flaggea", () => {
    const evidence = ["enterpriseValue: 4200000"];
    const output = "El Enterprise Value es de USD 4.200.000 según el modelo.";
    const result = detectInventedNumbers(output, evidence);
    expect(result.invented).not.toContain("4.200.000");
  });

  it("un porcentaje redondeado de forma razonable no se flaggea", () => {
    const evidence = ["ebitdaMargin: 21.04"];
    const output = "El margen EBITDA es de 21.0%.";
    const result = detectInventedNumbers(output, evidence);
    expect(result.invented).not.toContain("21.0%");
  });

  it("un año de 4 dígitos no matcheado va a needsHumanReview, no a invented con falsa certeza", () => {
    const evidence = ["kpis presentes, sin mención explícita del período base"];
    const output = "En el período 2025 la empresa mostró estabilidad.";
    const result = detectInventedNumbers(output, evidence);
    expect(result.invented).not.toContain("2025");
    expect(result.needsHumanReview).toContain("2025");
  });
});

describe("M. fuente/comparable inventado sencillo detectable", () => {
  it("cita a una institución externa conocida", () => {
    const result = detectInventedSource("Según datos de Bloomberg, el múltiplo sectorial es de 9.2x.");
    expect(result.flagged).toBe(true);
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it("patrón genérico 'fuente:' también se detecta", () => {
    const result = detectInventedSource("Fuente: Reporte Anual 2025.");
    expect(result.flagged).toBe(true);
  });

  it("narrativa sin ninguna cita no se flaggea", () => {
    const result = detectInventedSource("El margen EBITDA se ubica en 21.0%, dentro de un rango saludable.");
    expect(result.flagged).toBe(false);
  });
});

describe("detectUnsupportedClaim", () => {
  it("detecta afirmación causal sin respaldo (mala gestión)", () => {
    const result = detectUnsupportedClaim("El deterioro es consecuencia de una gestión gerencial deficiente.");
    expect(result.flagged).toBe(true);
  });
  it("narrativa sobria sin causales no se flaggea", () => {
    const result = detectUnsupportedClaim("El margen EBITDA se mantiene en niveles saludables durante el período.");
    expect(result.flagged).toBe(false);
  });
});

describe("detectContradictsCalculation", () => {
  it("CASE_A (EBITDA/margen neto positivos): afirmar pérdidas operativas contradice el ground truth", () => {
    const vm = buildViewModel(findFixture("CASE_A_MODERATE"));
    const result = detectContradictsCalculation("La empresa registra pérdidas operativas en el período analizado.", vm);
    expect(result.flagged).toBe(true);
  });

  it("CASE_A: texto consistente con ground truth no se flaggea", () => {
    const vm = buildViewModel(findFixture("CASE_A_MODERATE"));
    const result = detectContradictsCalculation("El margen EBITDA se mantiene sólido en el período.", vm);
    expect(result.flagged).toBe(false);
  });

  it("CASE_B (interestCoverage < 2x): afirmar cobertura saludable contradice el ground truth", () => {
    const vm = buildViewModel(findFixture("CASE_B_FINANCIAL_STRESS"));
    const result = detectContradictsCalculation("La cobertura de intereses es saludable en el período.", vm);
    expect(result.flagged).toBe(true);
  });
});

describe("detectTreatsMissingAsZero — CASE_C", () => {
  it("afirmar inventario en cero cuando el campo es null se flaggea", () => {
    const result = detectTreatsMissingAsZero("El inventario reportado es de 0 en el período.", CASE_C_NULL_FIELD_LABELS);
    expect(result.flagged).toBe(true);
  });

  it("omitir el campo sin mencionarlo no se flaggea", () => {
    const result = detectTreatsMissingAsZero("No se dispone de información de inventario para el período.", CASE_C_NULL_FIELD_LABELS);
    expect(result.flagged).toBe(false);
  });
});

describe("detectInventsMethodology", () => {
  it("detecta mención de una metodología que el motor canónico no usa", () => {
    const result = detectInventsMethodology("Se aplicó adicionalmente un análisis de opciones reales para contrastar el resultado.");
    expect(result.flagged).toBe(true);
  });
  it("mención de DCF/WACC (metodología real) no se flaggea", () => {
    const result = detectInventsMethodology("La valoración por DCF utiliza un WACC de 10.1%.");
    expect(result.flagged).toBe(false);
  });
});

describe("scoreOutput — combina los 6 flags", () => {
  it("una narrativa limpia no dispara ningún flag crítico", () => {
    const fixture = findFixture("CASE_A_MODERATE");
    const vm = buildViewModel(fixture);
    const evidence = [fixture.auditNarrativeBundle.clean];
    const result = scoreOutput(fixture.auditNarrativeBundle.clean, evidence, vm);
    expect(result.invented_source).toBe(false);
    expect(result.unsupported_financial_claim).toBe(false);
    expect(result.contradicts_calculation).toBe(false);
    expect(result.invents_methodology).toBe(false);
  });

  it("la variante invented_source del fixture dispara invented_source", () => {
    const fixture = findFixture("CASE_A_MODERATE");
    const vm = buildViewModel(fixture);
    const result = scoreOutput(fixture.auditNarrativeBundle.invented_source, [], vm);
    expect(result.invented_source).toBe(true);
  });

  it("la variante contradicts_calculation del fixture dispara contradicts_calculation", () => {
    const fixture = findFixture("CASE_A_MODERATE");
    const vm = buildViewModel(fixture);
    const result = scoreOutput(fixture.auditNarrativeBundle.contradicts_calculation, [], vm);
    expect(result.contradicts_calculation).toBe(true);
  });

  it("la variante unsupported_claim del fixture dispara unsupported_financial_claim", () => {
    const fixture = findFixture("CASE_A_MODERATE");
    const vm = buildViewModel(fixture);
    const result = scoreOutput(fixture.auditNarrativeBundle.unsupported_claim, [], vm);
    expect(result.unsupported_financial_claim).toBe(true);
  });
});
