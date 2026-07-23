// Bloque 1C-T — Pruebas del fingerprint determinístico del input canónico.
// Importa las funciones reales, nunca reimplementa la serialización o el
// hash dentro de la prueba.

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
  it("1. produce el mismo string aunque cambie el orden de las propiedades (a cualquier nivel de anidamiento)", () => {
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

describe("computeInputFingerprint — fingerprint del input efectivamente usado por el motor", () => {
  it("2. el mismo input produce el mismo fingerprint", () => {
    const f1 = computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(structuredClone(BASE_INPUT), "Software / Tecnología", 45);
    expect(f1).toBe(f2);
  });

  it("el mismo input con las propiedades de income_statement/balance_sheet reordenadas produce el mismo fingerprint", () => {
    const reordered: CanonicalStructuredInput = {
      moneda_analisis: "COP",
      factor_conversion: 1,
      balance_sheet: { equity: 2_500_000_000, cash: 500_000_000, financial_debt_total: 200_000_000 },
      income_statement: { interest_expense: 15_000_000, da: 40_000_000, opex: 700_000_000, cost_of_sales: 900_000_000, revenue: 2_000_000_000 },
    };
    expect(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45))
      .toBe(computeInputFingerprint(reordered, "Software / Tecnología", 45));
  });

  it("3. cambiar revenue produce un fingerprint diferente", () => {
    const changed: CanonicalStructuredInput = {
      ...BASE_INPUT,
      income_statement: { ...BASE_INPUT.income_statement, revenue: 2_000_000_001 },
    };
    expect(computeInputFingerprint(changed, "Software / Tecnología", 45))
      .not.toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45));
  });

  it("4. cambiar la deuda (financial_debt_total) produce un fingerprint diferente", () => {
    const changed: CanonicalStructuredInput = {
      ...BASE_INPUT,
      balance_sheet: { ...BASE_INPUT.balance_sheet, financial_debt_total: 200_000_001 },
    };
    expect(computeInputFingerprint(changed, "Software / Tecnología", 45))
      .not.toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45));
  });

  it("cambiar el sector o el crecimiento esperado también produce un fingerprint diferente (son parte del input real del motor)", () => {
    const base = computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45);
    expect(computeInputFingerprint(BASE_INPUT, "Manufactura", 45)).not.toBe(base);
    expect(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 10)).not.toBe(base);
  });

  it("12. no incluye ningún token, secreto o dato ajeno al cálculo — solo depende de income_statement/balance_sheet/moneda/factor/sector/growth", () => {
    const withExtra = { ...BASE_INPUT, provenance: { analysis_id: "secret-analysis-id-should-not-affect-hash" } } as CanonicalStructuredInput;
    expect(computeInputFingerprint(withExtra, "Software / Tecnología", 45))
      .toBe(computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45));
  });
});

function structuredClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
