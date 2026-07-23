// BL-02 (Bloque 1B-P0) — Pruebas de especificación de la consolidación de
// subcuentas. Importan exactamente la misma función pura
// (`sumAccountValue`) que usan las Edge Functions reales
// (`build-structured-input`, `validate-analysis`, `continuar-tras-revision`)
// — no una copia de la fórmula.

import { describe, it, expect } from "vitest";
import { sumAccountValue, hasAccountValue, type HomologatedAccountRow } from "./financial-accounts";

describe("sumAccountValue — BL-02", () => {
  it("1. una sola cuenta: devuelve su valor tal cual", () => {
    const rows: HomologatedAccountRow[] = [{ canonical_account: "revenue", value: 1_000_000 }];
    expect(sumAccountValue(rows, "revenue")).toBe(1_000_000);
  });

  it("2. dos subcuentas de caja (mismo período): se suman, no se toma solo la primera", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "cash", value: 50_000_000 }, // Banco Bogotá
      { canonical_account: "cash", value: 30_000_000 }, // Banco Davivienda
    ];
    expect(sumAccountValue(rows, "cash")).toBe(80_000_000);
  });

  it("3. tres subcuentas de gastos: se suman las tres", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "opex", value: 10_000 },
      { canonical_account: "opex", value: 20_000 },
      { canonical_account: "opex", value: 5_000 },
    ];
    expect(sumAccountValue(rows, "opex")).toBe(35_000);
  });

  it("4. valores null se ignoran, no cuentan como cero ni rompen la suma", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "opex", value: 10_000 },
      { canonical_account: "opex", value: null },
      { canonical_account: "opex", value: 5_000 },
    ];
    expect(sumAccountValue(rows, "opex")).toBe(15_000);
  });

  it("5. períodos diferentes: nunca se mezclan entre sí", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "revenue", value: 100, period: "2023" },
      { canonical_account: "revenue", value: 300, period: "2024" },
    ];
    expect(sumAccountValue(rows, "revenue", "2023")).toBe(100);
    expect(sumAccountValue(rows, "revenue", "2024")).toBe(300);
    // Sin período explícito (caso real más común: un solo año, period=null)
    // ninguna de las dos filas con período real coincide, así que no hay
    // fila válida para el período "sin especificar".
    expect(sumAccountValue(rows, "revenue")).toBeNull();
  });

  it("6. cuenta inexistente: devuelve null, no cero", () => {
    const rows: HomologatedAccountRow[] = [{ canonical_account: "revenue", value: 100 }];
    expect(sumAccountValue(rows, "long_term_financial_debt")).toBeNull();
    expect(hasAccountValue(rows, "long_term_financial_debt")).toBe(false);
  });

  it("7. valor negativo sujeto a normalización: cash se normaliza a valor absoluto sobre el total", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "cash", value: -50_000_000 }, // convención de signos inconsistente en el documento
    ];
    expect(sumAccountValue(rows, "cash")).toBe(50_000_000);

    // Cuentas sin normalización de signo (p. ej. revenue) conservan el signo real.
    const rowsRevenue: HomologatedAccountRow[] = [{ canonical_account: "revenue", value: -100 }];
    expect(sumAccountValue(rowsRevenue, "revenue")).toBe(-100);
  });

  it("8. prevención de doble conteo: el abs() se aplica una sola vez sobre el total, no por fila", () => {
    // Si abs() se aplicara por fila antes de sumar, -50 + -30 -> abs(-50)+abs(-30) = 80 (coincide).
    // El caso que distingue ambos enfoques es cuando los signos difieren entre filas:
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "cash", value: 50_000_000 },
      { canonical_account: "cash", value: -20_000_000 }, // una fila con signo inconsistente
    ];
    // abs(50M) + abs(-20M) = 70M (si se aplicara por fila, incorrecto: enmascara el signo antes de sumar)
    // abs(50M + (-20M)) = abs(30M) = 30M (correcto: se suma primero con signo, luego se normaliza el total)
    expect(sumAccountValue(rows, "cash")).toBe(30_000_000);
  });

  it("no usa .find(): una cuenta con 5 subcuentas suma las 5, no solo la primera", () => {
    const rows: HomologatedAccountRow[] = Array.from({ length: 5 }, (_, i) => ({
      canonical_account: "cash",
      value: (i + 1) * 1000,
    }));
    expect(sumAccountValue(rows, "cash")).toBe(1000 + 2000 + 3000 + 4000 + 5000);
  });

  it("ignora valores no numéricos (strings no parseables)", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "revenue", value: 100 },
      { canonical_account: "revenue", value: "no-es-un-numero" },
    ];
    expect(sumAccountValue(rows, "revenue")).toBe(100);
  });
});
