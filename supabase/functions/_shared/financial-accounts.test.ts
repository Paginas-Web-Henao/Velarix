// BL-02 (Bloque 1B-P0) — Pruebas de especificación de la consolidación de
// subcuentas. Importan exactamente la misma función pura
// (`sumAccountValue`) que usan las Edge Functions reales
// (`build-structured-input`, `validate-analysis`, `continuar-tras-revision`)
// — no una copia de la fórmula.

import { describe, it, expect } from "vitest";
import { sumAccountValue, sumObservedAccountValue, hasAccountValue, type HomologatedAccountRow } from "./financial-accounts";

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

// Bug 2 — política provisional de base_period. Estas pruebas usan
// exactamente `sumAccountValue(rows, canonical, basePeriod)` como lo hacen
// ahora validate-analysis, build-structured-input y continuar-tras-revision
// tras resolver un `base_period` explícito con `resolveBasePeriod`.
describe("sumAccountValue con base_period explícito — Bug 2", () => {
  it("A. un solo período: revenue 2025=500, base_period=2025 -> 500", () => {
    const rows: HomologatedAccountRow[] = [{ canonical_account: "revenue", value: 500, period: "2025" }];
    expect(sumAccountValue(rows, "revenue", "2025")).toBe(500);
  });

  it("B. subcuentas del mismo período: opex A 2025=30 + opex B 2025=20 -> 50", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "opex", value: 30, period: "2025" },
      { canonical_account: "opex", value: 20, period: "2025" },
    ];
    expect(sumAccountValue(rows, "opex", "2025")).toBe(50);
  });

  it("C. dos años: revenue 2024=400, revenue 2025=500, base_period=2025 -> 500, NUNCA 900", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "revenue", value: 400, period: "2024" },
      { canonical_account: "revenue", value: 500, period: "2025" },
    ];
    expect(sumAccountValue(rows, "revenue", "2025")).toBe(500);
    expect(sumAccountValue(rows, "revenue", "2025")).not.toBe(900);
  });

  it("D. subcuentas en dos años: opex 2024(20+30)=50, opex 2025(25+35)=60, base_period=2025 -> 60, NUNCA 110", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "opex", value: 20, period: "2024" },
      { canonical_account: "opex", value: 30, period: "2024" },
      { canonical_account: "opex", value: 25, period: "2025" },
      { canonical_account: "opex", value: 35, period: "2025" },
    ];
    expect(sumAccountValue(rows, "opex", "2024")).toBe(50);
    expect(sumAccountValue(rows, "opex", "2025")).toBe(60);
    expect(sumAccountValue(rows, "opex", "2025")).not.toBe(110);
  });

  it("E. legacy null: sin período explícito, sigue funcionando sin pasar basePeriod", () => {
    const rows: HomologatedAccountRow[] = [{ canonical_account: "revenue", value: 500 }];
    expect(sumAccountValue(rows, "revenue")).toBe(500);
  });

  it("F. cuenta ausente en el período base: devuelve null, no cero", () => {
    const rows: HomologatedAccountRow[] = [{ canonical_account: "revenue", value: 500, period: "2025" }];
    expect(sumAccountValue(rows, "long_term_financial_debt", "2025")).toBeNull();
  });
});

// Hallazgo BAL_005/cash — sumAccountValue normaliza cash con Math.abs()
// (cuenta de naturaleza no-negativa, ver ABS_NORMALIZED_ACCOUNTS), lo que
// hace que un cash negativo en el dato fuente sea indistinguible de una
// convención de signos. sumObservedAccountValue conserva el signo tal como
// se capturó, para que validate-analysis (BAL_005) pueda inspeccionarlo sin
// alterar el valor que consume el cálculo.
describe("sumObservedAccountValue — hallazgo BAL_005/cash", () => {
  it("1. cash = -50: observado conserva el signo, normalizado lo vuelve positivo", () => {
    const rows: HomologatedAccountRow[] = [{ canonical_account: "cash", value: -50 }];
    expect(sumObservedAccountValue(rows, "cash")).toBe(-50);
    expect(sumAccountValue(rows, "cash")).toBe(50);
  });

  it("2. cash +50 y cash -20 (mismo período): observado y normalizado coinciden en +30", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "cash", value: 50 },
      { canonical_account: "cash", value: -20 },
    ];
    expect(sumObservedAccountValue(rows, "cash")).toBe(30);
    expect(sumAccountValue(rows, "cash")).toBe(30);
  });

  it("3. cash -50 y cash -30: observado -80, normalizado +80 (nunca +80/-80 mezclados)", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "cash", value: -50 },
      { canonical_account: "cash", value: -30 },
    ];
    expect(sumObservedAccountValue(rows, "cash")).toBe(-80);
    expect(sumAccountValue(rows, "cash")).toBe(80);
  });

  it("4. dos períodos: cash 2024=-40, cash 2025=-50, basePeriod=2025 -> observado -50, normalizado +50 (nunca -90/+90)", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "cash", value: -40, period: "2024" },
      { canonical_account: "cash", value: -50, period: "2025" },
    ];
    expect(sumObservedAccountValue(rows, "cash", "2025")).toBe(-50);
    expect(sumAccountValue(rows, "cash", "2025")).toBe(50);
    expect(sumObservedAccountValue(rows, "cash", "2025")).not.toBe(-90);
    expect(sumAccountValue(rows, "cash", "2025")).not.toBe(90);
  });

  it("5. cuenta ausente: sumObservedAccountValue también devuelve null, no cero (misma política que sumAccountValue)", () => {
    const rows: HomologatedAccountRow[] = [{ canonical_account: "revenue", value: 100 }];
    expect(sumObservedAccountValue(rows, "cash")).toBeNull();
  });

  it("6. cuenta sin normalización (revenue): observado y normalizado son idénticos, ambos conservan el signo", () => {
    const rows: HomologatedAccountRow[] = [{ canonical_account: "revenue", value: -100 }];
    expect(sumObservedAccountValue(rows, "revenue")).toBe(-100);
    expect(sumAccountValue(rows, "revenue")).toBe(-100);
  });
});
