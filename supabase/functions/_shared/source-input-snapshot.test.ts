// Bloque 1E — Subbloque 1 (corrección): pruebas de `buildSourceInputSnapshot`.
// Importa la función real, nunca reimplementa su lógica dentro de la prueba.

import { describe, it, expect } from "vitest";
import { buildSourceInputSnapshot } from "./source-input-snapshot";

const FULL_INPUT = {
  base_period: "2025",
  moneda_analisis: "USD",
  income_statement: {
    revenue: 1_000_000,
    cost_of_sales: 400_000,
    opex: 150_000,
    da: 30_000,
    ebitda: 420_000,
    ebit: 390_000,
    interest_expense: 20_000,
    taxes: 111_000,
    net_income: 259_000,
  },
  balance_sheet: {
    cash: 80_000,
    accounts_receivable: 120_000,
    inventory: 60_000,
    accounts_payable: 90_000,
    ppe: 500_000,
    current_financial_debt: 40_000,
    long_term_financial_debt: 160_000,
    financial_debt_total: 200_000,
    equity: 700_000,
    total_assets: 1_100_000,
    total_liabilities: 400_000,
  },
};

describe("buildSourceInputSnapshot", () => {
  it("2. copia exactamente los valores del input resuelto (sin recalcular)", () => {
    const snapshot = buildSourceInputSnapshot({
      structuredInputId: "struct-1",
      versionInput: "2.3",
      sector: "Software / Tecnología",
      input: FULL_INPUT,
    });

    expect(snapshot.income_statement).toEqual(FULL_INPUT.income_statement);
    expect(snapshot.balance_sheet).toEqual(FULL_INPUT.balance_sheet);
    expect(snapshot.base_period).toBe("2025");
    expect(snapshot.moneda_analisis).toBe("USD");
    expect(snapshot.sector).toBe("Software / Tecnología");
  });

  it("3. no modifica ninguna cifra — mismos valores numéricos, sin redondeo/transformación", () => {
    const snapshot = buildSourceInputSnapshot({
      structuredInputId: "struct-1",
      versionInput: "2.3",
      sector: "Retail / Comercio",
      input: FULL_INPUT,
    });
    expect(snapshot.income_statement.net_income).toBe(259_000);
    expect(snapshot.balance_sheet.total_assets).toBe(1_100_000);
  });

  it("4. missing permanece null — nunca se convierte en 0", () => {
    const snapshot = buildSourceInputSnapshot({
      structuredInputId: "struct-1",
      versionInput: "2.3",
      sector: "Software / Tecnología",
      input: {
        base_period: "2025",
        moneda_analisis: "COP",
        income_statement: { revenue: 1_000_000, cost_of_sales: null, opex: undefined, da: 30_000 },
        balance_sheet: { cash: null },
      },
    });
    expect(snapshot.income_statement.cost_of_sales).toBeNull();
    expect(snapshot.income_statement.opex).toBeNull();
    expect(snapshot.income_statement.ebitda).toBeNull();
    expect(snapshot.income_statement.revenue).toBe(1_000_000);
    expect(snapshot.balance_sheet.cash).toBeNull();
    expect(snapshot.balance_sheet.equity).toBeNull();
  });

  it("5. structured_input_id y version_input quedan preservados tal cual", () => {
    const snapshot = buildSourceInputSnapshot({
      structuredInputId: "struct-xyz",
      versionInput: "2.3",
      sector: "Manufactura",
      input: FULL_INPUT,
    });
    expect(snapshot.structured_input_id).toBe("struct-xyz");
    expect(snapshot.version_input).toBe("2.3");
  });

  it("structured_input_id null cuando no hay fila real (fallback legacy) — no se inventa un id", () => {
    const snapshot = buildSourceInputSnapshot({
      structuredInputId: null,
      versionInput: null,
      sector: "Manufactura",
      input: FULL_INPUT,
    });
    expect(snapshot.structured_input_id).toBeNull();
    expect(snapshot.version_input).toBeNull();
  });

  it("income_statement/balance_sheet ausentes por completo no lanzan y quedan enteramente null", () => {
    const snapshot = buildSourceInputSnapshot({
      structuredInputId: "struct-1",
      versionInput: "2.3",
      sector: "Software / Tecnología",
      input: {},
    });
    expect(snapshot.income_statement.revenue).toBeNull();
    expect(snapshot.balance_sheet.equity).toBeNull();
    expect(snapshot.base_period).toBeNull();
    expect(snapshot.moneda_analisis).toBeNull();
  });
});
