// Bloque 1C-T (ajuste de semántica) — Pruebas del fingerprint
// determinístico del input EFECTIVO que consume
// `runCanonicalFinancialEngine`. Importa las funciones reales, nunca
// reimplementa la serialización, el hash ni la normalización dentro de
// la prueba.

import { describe, it, expect } from "vitest";
import { canonicalStringify, fnv1a64Hex, computeInputFingerprint } from "./calculation-fingerprint";
import type { CanonicalStructuredInput } from "./canonical-financial-engine";

const BASE_INPUT: CanonicalStructuredInput = {
  income_statement: { revenue: 2_000_000_000, cost_of_sales: 900_000_000, opex: 700_000_000, da: 40_000_000, interest_expense: 15_000_000 },
  balance_sheet: { financial_debt_total: 200_000_000, cash: 500_000_000, equity: 2_500_000_000 },
  moneda_analisis: "COP",
  factor_conversion: 1,
};

describe("canonicalStringify — serialización determinística", () => {
  it("produce el mismo string aunque cambie el orden de las propiedades (a cualquier nivel de anidamiento)", () => {
    const a = { z: 1, a: { y: 2, x: 3 }, m: [1, 2, 3] };
    const b = { a: { x: 3, y: 2 }, m: [1, 2, 3], z: 1 };
    expect(canonicalStringify(a)).toBe(canonicalStringify(b));
  });

  it("distingue objetos con los mismos valores pero distinta estructura de arreglo", () => {
    expect(canonicalStringify({ m: [1, 2] })).not.toBe(canonicalStringify({ m: [2, 1] }));
  });

  it("normaliza null/undefined y valores no finitos de forma estable", () => {
    expect(canonicalStringify(undefined)).toBe(canonicalStringify(null));
    expect(canonicalStringify(NaN)).toBe("null");
    expect(canonicalStringify(Infinity)).toBe("null");
  });
});

describe("fnv1a64Hex — hash determinístico (no criptográfico)", () => {
  it("produce siempre el mismo hash hexadecimal de 16 caracteres para el mismo string", () => {
    const h1 = fnv1a64Hex("hola mundo");
    const h2 = fnv1a64Hex("hola mundo");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{16}$/);
  });

  it("produce hashes distintos para strings distintos", () => {
    expect(fnv1a64Hex("a")).not.toBe(fnv1a64Hex("b"));
  });
});

describe("computeInputFingerprint — fingerprint del input EFECTIVO (normalizado, no del JSON crudo)", () => {
  it("mismo input → mismo fingerprint", () => {
    const f1 = computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(JSON.parse(JSON.stringify(BASE_INPUT)), "Software / Tecnología", 45);
    expect(f1).toBe(f2);
  });

  it("9. el orden de las propiedades de income_statement/balance_sheet no afecta el fingerprint", () => {
    const reordered: CanonicalStructuredInput = {
      moneda_analisis: "COP",
      factor_conversion: 1,
      balance_sheet: { equity: 2_500_000_000, cash: 500_000_000, financial_debt_total: 200_000_000 },
      income_statement: { interest_expense: 15_000_000, da: 40_000_000, opex: 700_000_000, cost_of_sales: 900_000_000, revenue: 2_000_000_000 },
    };
    expect(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45))
      .toBe(computeInputFingerprint(reordered, "Software / Tecnología", 45));
  });

  it("1. cambiar taxes o net_income no cambia el fingerprint — el motor no los lee", () => {
    const withTaxesAndNetIncome: CanonicalStructuredInput = {
      ...BASE_INPUT,
      income_statement: { ...BASE_INPUT.income_statement, taxes: 999_999_999, net_income: 123_456_789 } as CanonicalStructuredInput["income_statement"],
    };
    expect(computeInputFingerprint(withTaxesAndNetIncome, "Software / Tecnología", 45))
      .toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45));
  });

  it("2. revenue: -100 y revenue: 100 producen el mismo fingerprint (el motor aplica Math.abs())", () => {
    const negative: CanonicalStructuredInput = { ...BASE_INPUT, income_statement: { ...BASE_INPUT.income_statement, revenue: -100 } };
    const positive: CanonicalStructuredInput = { ...BASE_INPUT, income_statement: { ...BASE_INPUT.income_statement, revenue: 100 } };
    expect(computeInputFingerprint(negative, "Software / Tecnología", 45))
      .toBe(computeInputFingerprint(positive, "Software / Tecnología", 45));
  });

  it("3. da: 0, depreciation: 50 usa exactamente el mismo fallback que el motor (da || depreciation || 0)", () => {
    const daZeroDepreciationFifty: CanonicalStructuredInput = {
      ...BASE_INPUT,
      income_statement: { ...BASE_INPUT.income_statement, da: 0, depreciation: 50 } as CanonicalStructuredInput["income_statement"],
    };
    const daOmittedDepreciationFifty: CanonicalStructuredInput = {
      ...BASE_INPUT,
      income_statement: { revenue: BASE_INPUT.income_statement!.revenue, cost_of_sales: BASE_INPUT.income_statement!.cost_of_sales, opex: BASE_INPUT.income_statement!.opex, interest_expense: BASE_INPUT.income_statement!.interest_expense, depreciation: 50 } as CanonicalStructuredInput["income_statement"],
    };
    const daFiftyDirect: CanonicalStructuredInput = { ...BASE_INPUT, income_statement: { ...BASE_INPUT.income_statement, da: 50 } };

    const f1 = computeInputFingerprint(daZeroDepreciationFifty, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(daOmittedDepreciationFifty, "Software / Tecnología", 45);
    const f3 = computeInputFingerprint(daFiftyDirect, "Software / Tecnología", 45);
    expect(f1).toBe(f2);
    expect(f1).toBe(f3);
  });

  it("4. cambiar un campo de deuda ignorado por la prioridad real (total_debt/financial_debt) no cambia el fingerprint cuando financial_debt_total ya existe", () => {
    const withIgnoredDebtFields: CanonicalStructuredInput = {
      ...BASE_INPUT,
      balance_sheet: { ...BASE_INPUT.balance_sheet, total_debt: 999_999_999, financial_debt: 888_888_888 } as CanonicalStructuredInput["balance_sheet"],
    };
    expect(computeInputFingerprint(withIgnoredDebtFields, "Software / Tecnología", 45))
      .toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45));
  });

  it("5. cambiar la deuda efectiva (financial_debt_total) sí cambia el fingerprint", () => {
    const changed: CanonicalStructuredInput = { ...BASE_INPUT, balance_sheet: { ...BASE_INPUT.balance_sheet, financial_debt_total: 200_000_001 } };
    expect(computeInputFingerprint(changed, "Software / Tecnología", 45))
      .not.toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45));
  });

  it("6. un sector desconocido y el sector fallback (Software / Tecnología) producen el mismo fingerprint — el motor usa el mismo benchmark para ambos", () => {
    expect(computeInputFingerprint(BASE_INPUT, "Sector Que No Existe En SECTOR_BENCHMARKS", 45))
      .toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45));
  });

  it("cambiar a un sector CONOCIDO con benchmark distinto sí cambia el fingerprint", () => {
    expect(computeInputFingerprint(BASE_INPUT, "Manufactura", 45))
      .not.toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45));
  });

  it("7. expectedGrowth: 0 y el valor fallback actual (25) producen el mismo fingerprint — el motor usa expectedGrowth || 25", () => {
    expect(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 0))
      .toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 25));
  });

  it("cambiar expectedGrowth a un valor distinto del fallback sí cambia el fingerprint", () => {
    expect(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 10))
      .not.toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45));
  });

  it("8. cambiar el revenue efectivo (no solo el signo) sigue produciendo un fingerprint distinto", () => {
    const changed: CanonicalStructuredInput = { ...BASE_INPUT, income_statement: { ...BASE_INPUT.income_statement, revenue: 2_000_000_001 } };
    expect(computeInputFingerprint(changed, "Software / Tecnología", 45))
      .not.toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45));
  });

  it("no incluye ningún token, secreto, id o dato ajeno al cálculo — solo depende de los valores efectivos del motor", () => {
    const withExtra = { ...BASE_INPUT, provenance: { analysis_id: "secret-analysis-id-should-not-affect-hash" } } as CanonicalStructuredInput;
    expect(computeInputFingerprint(withExtra, "Software / Tecnología", 45))
      .toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45));
  });
});
