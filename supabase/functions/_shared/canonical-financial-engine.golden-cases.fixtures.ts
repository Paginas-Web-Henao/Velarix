// Bloque 1C-Prep (cierre técnico) — Casos dorados técnicos
// provisionales, en la forma real que consume el motor servidor
// (`CanonicalStructuredInput`), no el `FinancialInputs` del cliente.
//
// "Caso dorado técnico provisional — pendiente de aprobación
// financiera." Mismos datos económicos crudos que
// `src/lib/financial-engine.golden-cases.fixtures.ts` (para permitir una
// comparación directa servidor/cliente), reexpresados en el contrato de
// `structured_input`. Ninguno fue revisado ni aprobado por el fundador ni
// por un revisor financiero externo.

import type { CanonicalStructuredInput } from "./canonical-financial-engine";

export interface GoldenCaseServerFixture {
  input: CanonicalStructuredInput;
  sector: string;
  expectedGrowth: number;
}

export const CASO_A_ESTABLE_SERVIDOR: GoldenCaseServerFixture = {
  input: {
    income_statement: {
      revenue: 5_000_000_000,
      cost_of_sales: 3_000_000_000,
      opex: 800_000_000,
      da: 150_000_000,
      interest_expense: 80_000_000,
    },
    balance_sheet: {
      financial_debt_total: 1_000_000_000,
      cash: 600_000_000,
      equity: 3_000_000_000,
    },
    moneda_analisis: "COP",
    factor_conversion: 1,
  },
  sector: "Servicios empresariales",
  expectedGrowth: 12,
};

export const CASO_B_ALTO_CRECIMIENTO_SERVIDOR: GoldenCaseServerFixture = {
  input: {
    income_statement: {
      revenue: 2_000_000_000,
      cost_of_sales: 900_000_000,
      opex: 700_000_000,
      da: 40_000_000,
      interest_expense: 15_000_000,
    },
    balance_sheet: {
      financial_debt_total: 200_000_000,
      cash: 500_000_000,
      equity: 2_500_000_000,
    },
    moneda_analisis: "COP",
    factor_conversion: 1,
  },
  sector: "Software / Tecnología",
  expectedGrowth: 45,
};

export const CASO_C_TENSIONADA_SERVIDOR: GoldenCaseServerFixture = {
  input: {
    income_statement: {
      revenue: 3_000_000_000,
      cost_of_sales: 2_700_000_000,
      opex: 500_000_000,
      da: 100_000_000,
      interest_expense: 350_000_000,
    },
    balance_sheet: {
      financial_debt_total: 4_000_000_000,
      cash: 50_000_000,
      equity: -500_000_000, // patrimonio negativo, sintético
    },
    moneda_analisis: "COP",
    factor_conversion: 1,
  },
  sector: "Manufactura",
  expectedGrowth: 5,
};
