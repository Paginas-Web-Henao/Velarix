// Sinónimos ingleses de cuentas canónicas YA existentes: solo match exacto y
// solo en el estado compatible. Cada uno con su prueba semántica.
import { describe, it, expect } from "vitest";
import { TAXONOMY, EXACT_ONLY_SYNONYMS, matchAccount } from "./account-taxonomy";
import { matchAccountInContext } from "./statement-aware-mapping";

const ctx = (label: string, statement: string, section: string | null = null, unit = "monetaria") => matchAccountInContext({ label, statement, section, unit });

describe("EXACT_ONLY_SYNONYMS solo apunta a cuentas canónicas existentes (no amplía la taxonomía)", () => {
  it("toda cuenta y categoría existe en TAXONOMY", () => {
    for (const [category, accounts] of Object.entries(EXACT_ONLY_SYNONYMS)) {
      for (const canonical of Object.keys(accounts)) expect(TAXONOMY[category]?.[canonical], `${category}.${canonical}`).toBeDefined();
    }
  });
});

describe("equivalencias exactas en su estado", () => {
  it("E. 'Operating income' → ebit (= utilidad operativa), solo en el estado de resultados", () => {
    expect(ctx("Operating income", "income_statement")).toMatchObject({ canonical: "ebit", score: 0.95 });
    expect(ctx("Operating income", "cash_flow")).toMatchObject({ canonical: null, rejection: "STATEMENT_INCOMPATIBLE" });
  });

  it("F. 'Income tax provision' → taxes (= provisión de impuestos)", () => {
    expect(ctx("Income tax provision", "income_statement")).toMatchObject({ canonical: "taxes", score: 0.95 });
  });

  it("G. 'Long-term debt' → long_term_financial_debt, en pasivos", () => {
    expect(ctx("Long-term debt", "balance_sheet", "Long-term liabilities:")).toMatchObject({ canonical: "long_term_financial_debt" });
    expect(ctx("Long-term debt", "balance_sheet", "Long-term assets:")).toMatchObject({ canonical: null, rejection: "SECTION_INCOMPATIBLE" });
  });

  it("H. 'Short-term debt and current portion of long-term debt' → current_financial_debt (no long-term)", () => {
    expect(ctx("Short-term debt and current portion of long-term debt", "balance_sheet", "Current liabilities:")).toMatchObject({ canonical: "current_financial_debt" });
  });

  it("partidas de balance del filing con equivalencia directa: inventarios, cartera comercial neta, PP&E neto", () => {
    expect(ctx("Inventories", "balance_sheet", "Current assets:").canonical).toBe("inventory");
    expect(ctx("Trade accounts receivable, net", "balance_sheet", "Current assets:").canonical).toBe("accounts_receivable");
    expect(ctx("Property, plant and equipment, net", "balance_sheet", "Long-term assets:").canonical).toBe("ppe");
  });
});

describe("I. nunca por substring: las trampas del filing siguen abiertas", () => {
  it.each([
    ["Non-operating income, net", "income_statement"], // contiene 'operating income'
    ["Current portion of long-term debt", "balance_sheet"], // contiene 'long-term debt'
    ["Deferred income tax provision", "income_statement"],
    ["Property, plant and equipment, gross", "balance_sheet"], // solo el NETO es ppe
  ])("%s (%s) no toma el sinónimo exacto", (label, statement) => {
    const d = ctx(label, statement, null);
    expect(["ebit", "long_term_financial_debt", "taxes", "ppe"]).not.toContain(d.canonical);
  });

  it("las líneas de flujo de caja siguen sin poder convertirse en estas cuentas", () => {
    for (const l of ["Operating income", "Income tax provision", "Long-term debt", "Repayments of long-term debt", "Proceeds from long-term debt"]) {
      expect(ctx(l, "cash_flow").canonical, l).toBeNull();
    }
  });

  it("regla legacy sin contexto: el exacto aplica, el substring no ('income' suelto no es ebit)", () => {
    expect(matchAccount("Operating income")).toMatchObject({ canonical: "ebit", score: 0.95 });
    expect(matchAccount("Income").canonical).not.toBe("ebit");
    expect(matchAccount("Debt").canonical).not.toBe("long_term_financial_debt");
  });
});
