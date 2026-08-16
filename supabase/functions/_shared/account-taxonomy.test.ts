// Bug 1 (map-accounts) — precedencia exact match > substring match.
// Antes, un substring de una cuenta definida ANTES en TAXONOMY (p. ej.
// "ventas" de `revenue`) ganaba sobre el match EXACTO de una cuenta
// definida DESPUÉS (p. ej. "costo de ventas" de `cost_of_sales`).

import { describe, it, expect } from "vitest";
import { matchAccount, normalizeLabel, TAXONOMY } from "./account-taxonomy";

describe("matchAccount — Bug 1 (exact > substring)", () => {
  it("M1. 'Ventas Netas' -> revenue por match EXACTO (no por substring 'ventas')", () => {
    const result = matchAccount("Ventas Netas");
    expect(result.canonical).toBe("revenue");
    expect(result.score).toBe(0.95); // exact, no 0.82 (substring)
  });

  it("M2. 'Costo de Ventas' -> cost_of_sales, NUNCA revenue", () => {
    const result = matchAccount("Costo de Ventas");
    expect(result.canonical).toBe("cost_of_sales");
    expect(result.canonical).not.toBe("revenue");
    expect(result.score).toBe(0.95);
  });

  it("M3. el orden de definición de TAXONOMY no determina el resultado: revenue se evalúa antes que cost_of_sales en el objeto, pero el exact match de cost_of_sales gana", () => {
    const categories = Object.keys(TAXONOMY.income_statement);
    expect(categories.indexOf("revenue")).toBeLessThan(categories.indexOf("cost_of_sales"));
    // A pesar de ese orden, "Costo de Ventas" (exact de cost_of_sales)
    // no cae en el substring "ventas" de revenue evaluado primero.
    expect(matchAccount("Costo de Ventas").canonical).toBe("cost_of_sales");
  });

  it("M4. el fallback de substring sigue funcionando cuando no hay match exacto", () => {
    // "Efectivo y Equivalentes de Caja" no es sinónimo exacto de ninguna
    // cuenta, pero contiene el sinónimo exacto "efectivo y equivalentes" de cash.
    const result = matchAccount("Efectivo y Equivalentes de Caja");
    expect(result.canonical).toBe("cash");
    expect(result.score).toBe(0.82); // substring, no exact
  });

  it("M5. normalización (mayúsculas, tildes, espacios) se preserva", () => {
    const result = matchAccount("  DEPRECIACIÓN   ");
    expect(result.canonical).toBe("da");
    expect(result.score).toBe(0.95);
    expect(normalizeLabel("Depreciación")).toBe("depreciacion");
    expect(normalizeLabel("  Ventas   Netas  ")).toBe("ventas netas");
  });

  it("M6. label sin match: unclassified/unknown, no se inventa clasificación", () => {
    const result = matchAccount("Reserva Legal No Distribuible XYZ123");
    expect(result.canonical).toBeNull();
    expect(result.category).toBe("unknown");
    expect(result.score).toBe(0.30);
  });
});
