// BL-03 (Bloque 1B-P0) — Pruebas de especificación de conversión de
// moneda y escala. Importan exactamente la misma función pura
// (`computeTotalConversionFactor`) que usa `build-structured-input`.

import { describe, it, expect } from "vitest";
import {
  computeTotalConversionFactor,
  applyConversion,
  normalizeCurrencyCode,
} from "./currency";

const TRM = 4080;

describe("computeTotalConversionFactor — BL-03", () => {
  it("1. COP en unidades -> COP: factor = 1 (sin escala, sin conversión)", () => {
    const r = computeTotalConversionFactor({ sourceCurrency: "COP", reportingCurrency: "COP", scaleFactor: 1, exchangeRate: TRM });
    expect(r.totalConversionFactor).toBe(1);
    expect(r.currencyConversionApplied).toBe(false);
    expect(applyConversion(1000, r.totalConversionFactor)).toBe(1000);
  });

  it("2. COP en miles -> COP: factor = 1000 (solo escala)", () => {
    const r = computeTotalConversionFactor({ sourceCurrency: "COP", reportingCurrency: "COP", scaleFactor: 1_000, exchangeRate: TRM });
    expect(r.totalConversionFactor).toBe(1_000);
    expect(applyConversion(500, r.totalConversionFactor)).toBe(500_000);
  });

  it("3. COP en millones -> COP: factor = 1_000_000 (solo escala)", () => {
    const r = computeTotalConversionFactor({ sourceCurrency: "COP", reportingCurrency: "COP", scaleFactor: 1_000_000, exchangeRate: TRM });
    expect(r.totalConversionFactor).toBe(1_000_000);
    expect(applyConversion(3, r.totalConversionFactor)).toBe(3_000_000);
  });

  it("4. USD en unidades -> COP: factor = TRM (conversión de moneda pura)", () => {
    const r = computeTotalConversionFactor({ sourceCurrency: "USD", reportingCurrency: "COP", scaleFactor: 1, exchangeRate: TRM });
    expect(r.totalConversionFactor).toBe(TRM);
    expect(r.currencyConversionApplied).toBe(true);
    expect(applyConversion(1000, r.totalConversionFactor)).toBe(1000 * TRM);
  });

  it("5. USD en miles -> COP: factor = 1000 * TRM (escala y moneda combinadas, aplicadas una sola vez)", () => {
    const r = computeTotalConversionFactor({ sourceCurrency: "USD", reportingCurrency: "COP", scaleFactor: 1_000, exchangeRate: TRM });
    expect(r.totalConversionFactor).toBe(1_000 * TRM);
  });

  it("6. documento y moneda de reporte iguales (USD -> USD): no se aplica conversión de moneda", () => {
    const r = computeTotalConversionFactor({ sourceCurrency: "USD", reportingCurrency: "USD", scaleFactor: 1, exchangeRate: TRM });
    expect(r.totalConversionFactor).toBe(1);
    expect(r.currencyConversionApplied).toBe(false);
  });

  it("7. metadata ausente (sourceCurrency null): no se inventa una conversión, se marca currencyUndetected", () => {
    const r = computeTotalConversionFactor({ sourceCurrency: null, reportingCurrency: "COP", scaleFactor: 1, exchangeRate: TRM });
    expect(r.currencyUndetected).toBe(true);
    expect(r.currencyConversionApplied).toBe(false);
    expect(r.totalConversionFactor).toBe(1); // solo escala (que aquí es 1), nunca una conversión de moneda inventada
  });

  it("8. moneda no reconocida: normalizeCurrencyCode la trata como no detectada, no como COP por defecto", () => {
    const raw = "EUR";
    const normalized = normalizeCurrencyCode(raw);
    expect(normalized).toBeNull();
    const r = computeTotalConversionFactor({ sourceCurrency: normalized, reportingCurrency: "COP", scaleFactor: 1, exchangeRate: TRM });
    expect(r.currencyUndetected).toBe(true);
  });

  it("9. prevención de conversión doble: aplicar el factor sobre un valor ya convertido (mismo currency) no vuelve a convertir", () => {
    const first = computeTotalConversionFactor({ sourceCurrency: "USD", reportingCurrency: "COP", scaleFactor: 1, exchangeRate: TRM });
    const convertido = applyConversion(100, first.totalConversionFactor); // 100 USD -> COP
    expect(convertido).toBe(100 * TRM);

    // Si se re-detectara la moneda sobre el valor YA convertido, ahora está en COP,
    // y la moneda de reporte también es COP -> no debe volver a multiplicar por TRM.
    const second = computeTotalConversionFactor({ sourceCurrency: "COP", reportingCurrency: "COP", scaleFactor: 1, exchangeRate: TRM });
    expect(second.totalConversionFactor).toBe(1);
    expect(applyConversion(convertido, second.totalConversionFactor)).toBe(convertido);
  });

  it("10. factor explícito distinto de uno: escala y moneda se multiplican correctamente en un solo paso", () => {
    const r = computeTotalConversionFactor({ sourceCurrency: "USD", reportingCurrency: "COP", scaleFactor: 1_000_000, exchangeRate: 4000 });
    expect(r.totalConversionFactor).toBe(1_000_000 * 4000);
    expect(applyConversion(2.5, r.totalConversionFactor)).toBe(2.5 * 1_000_000 * 4000);
  });

  it("applyConversion preserva null como ausencia de dato", () => {
    expect(applyConversion(null, 1000)).toBeNull();
  });

  it("lanza error ante scale_factor o exchange_rate inválidos (defensa de entrada, no silenciar)", () => {
    expect(() => computeTotalConversionFactor({ sourceCurrency: "COP", reportingCurrency: "COP", scaleFactor: 0, exchangeRate: TRM })).toThrow();
    expect(() => computeTotalConversionFactor({ sourceCurrency: "COP", reportingCurrency: "COP", scaleFactor: 1, exchangeRate: -1 })).toThrow();
  });
});
