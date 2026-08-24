// Bug ausente->0 en build-structured-input — evidencia remota real: el
// fixture sintético tiene cash=300000 observado en 2025 pero NUNCA observó
// total_assets, accounts_receivable, inventory ni ppe. Antes del fix,
// build-structured-input derivaba total_assets=300000 (solo cash, tratando
// los otros 3 componentes ausentes como 0) y financial_debt_total=0 (ambos
// componentes de deuda ausentes, sin ningún guard). Ver
// structured-input-derivations.ts para el detalle completo y la cita de
// los documentos de decisiones financieras revisados (ninguno autoriza
// D&A=0 cuando está ausente).

import { describe, it, expect } from "vitest";
import { sumAccountValue } from "./financial-accounts";
import { deriveFinancialDebtTotal, deriveEbitdaFromComponents } from "./structured-input-derivations";

describe("total_assets / total_liabilities — AUSENTE != 0: la derivación por suma parcial de componentes fue eliminada", () => {
  it("1. total_assets observado -> se conserva", () => {
    const rows = [{ canonical_account: "total_assets", value: 5_000_000, period: "2025" }];
    expect(sumAccountValue(rows, "total_assets", "2025")).toBe(5_000_000);
  });

  it("2. total_assets ausente + solo cash presente (evidencia remota real) -> sigue null, NO se deriva desde cash", () => {
    const rows = [{ canonical_account: "cash", value: 300_000, period: "2025" }];
    expect(sumAccountValue(rows, "total_assets", "2025")).toBeNull();
  });

  it("3. total_assets ausente + cash/AR/inventory/PPE TODOS presentes -> sigue null (sin regla de totalidad aprobada)", () => {
    const rows = [
      { canonical_account: "cash", value: 300_000, period: "2025" },
      { canonical_account: "accounts_receivable", value: 150_000, period: "2025" },
      { canonical_account: "inventory", value: 80_000, period: "2025" },
      { canonical_account: "ppe", value: 1_000_000, period: "2025" },
    ];
    expect(sumAccountValue(rows, "total_assets", "2025")).toBeNull();
  });

  it("4. total_liabilities observado -> se conserva", () => {
    const rows = [{ canonical_account: "total_liabilities", value: 2_000_000, period: "2025" }];
    expect(sumAccountValue(rows, "total_liabilities", "2025")).toBe(2_000_000);
  });

  it("5. total_liabilities ausente + accounts_payable presente -> sigue null", () => {
    const rows = [{ canonical_account: "accounts_payable", value: 100_000, period: "2025" }];
    expect(sumAccountValue(rows, "total_liabilities", "2025")).toBeNull();
  });

  it("6. total_liabilities ausente + componentes parciales (accounts_payable + current_financial_debt) -> sigue null", () => {
    const rows = [
      { canonical_account: "accounts_payable", value: 100_000, period: "2025" },
      { canonical_account: "current_financial_debt", value: 50_000, period: "2025" },
    ];
    expect(sumAccountValue(rows, "total_liabilities", "2025")).toBeNull();
  });
});

describe("deriveFinancialDebtTotal — ausencia de un componente NO se asume como 0", () => {
  it("7. currentDebt=null + ltDebt=null -> null (evidencia remota real: ambos ausentes en el fixture)", () => {
    expect(deriveFinancialDebtTotal(null, null)).toBeNull();
  });

  it("8. currentDebt observado + ltDebt=null -> null (no asume que el ausente es 0)", () => {
    expect(deriveFinancialDebtTotal(100, null)).toBeNull();
  });

  it("9. currentDebt=null + ltDebt observado -> null", () => {
    expect(deriveFinancialDebtTotal(null, 200)).toBeNull();
  });

  it("10. currentDebt=0 observado + ltDebt=0 observado -> total=0 (cero observado se preserva, no se confunde con ausente)", () => {
    expect(deriveFinancialDebtTotal(0, 0)).toBe(0);
  });

  it("11. currentDebt=100 + ltDebt=200 -> total=300", () => {
    expect(deriveFinancialDebtTotal(100, 200)).toBe(300);
  });
});

describe("deriveEbitdaFromComponents — D&A ausente NO se asume en 0 (sin decisión metodológica aprobada que lo autorice)", () => {
  it("12. D&A ausente -> EBITDA derivado queda null (evidencia remota real: fixture nunca observó D&A)", () => {
    const result = deriveEbitdaFromComponents({ revenue: 1_200_000, costOfSales: 700_000, opex: 220_000, da: null });
    expect(result).toBeNull();
  });

  it("13. D&A=0 OBSERVADO explícitamente -> se usa como dato real (0 observado != ausente)", () => {
    const result = deriveEbitdaFromComponents({ revenue: 1_200_000, costOfSales: 700_000, opex: 220_000, da: 0 });
    expect(result).toBe(280_000);
  });

  it("14. D&A observado positivo -> fórmula mantiene comportamiento correcto", () => {
    const result = deriveEbitdaFromComponents({ revenue: 1_200_000, costOfSales: 700_000, opex: 220_000, da: 50_000 });
    expect(result).toBe(330_000);
  });

  it("revenue ausente -> EBITDA no se deriva (null), independientemente de D&A", () => {
    expect(deriveEbitdaFromComponents({ revenue: null, costOfSales: 700_000, opex: 220_000, da: 0 })).toBeNull();
  });

  it("cost_of_sales ausente -> EBITDA null (hallazgo secundario: mismo patrón que D&A, ahora cerrado)", () => {
    expect(deriveEbitdaFromComponents({ revenue: 1_200_000, costOfSales: null, opex: 220_000, da: 0 })).toBeNull();
  });

  it("opex ausente -> EBITDA null (hallazgo secundario: mismo patrón que D&A, ahora cerrado)", () => {
    expect(deriveEbitdaFromComponents({ revenue: 1_200_000, costOfSales: 700_000, opex: null, da: 0 })).toBeNull();
  });

  it("cost_of_sales=0 observado explícitamente -> se usa como 0 real, no como ausente", () => {
    const result = deriveEbitdaFromComponents({ revenue: 1_200_000, costOfSales: 0, opex: 220_000, da: 0 });
    expect(result).toBe(980_000);
  });

  it("opex=0 observado explícitamente -> se usa como 0 real, no como ausente", () => {
    const result = deriveEbitdaFromComponents({ revenue: 1_200_000, costOfSales: 700_000, opex: 0, da: 0 });
    expect(result).toBe(500_000);
  });

  it("los cuatro componentes observados con valores normales -> fórmula correcta", () => {
    const result = deriveEbitdaFromComponents({ revenue: 1_200_000, costOfSales: 700_000, opex: 220_000, da: 50_000 });
    expect(result).toBe(330_000);
  });
});

describe("taxes / interest_expense — ausentes permanecen null, sin tasa de referencia ni cero fabricado", () => {
  it("15. taxes ausente -> null", () => {
    const rows = [{ canonical_account: "revenue", value: 1_200_000, period: "2025" }];
    expect(sumAccountValue(rows, "taxes", "2025")).toBeNull();
  });

  it("16. interest_expense ausente -> null", () => {
    const rows = [{ canonical_account: "revenue", value: 1_200_000, period: "2025" }];
    expect(sumAccountValue(rows, "interest_expense", "2025")).toBeNull();
  });
});

describe("períodos — 2024 nunca entra en el payload resuelto para 2025 (fixture real)", () => {
  it("17. revenue 2024 y 2025 coexisten sin mezclarse al consultar por basePeriod", () => {
    const rows = [
      { canonical_account: "revenue", value: 1_000_000, period: "2024" },
      { canonical_account: "revenue", value: 1_200_000, period: "2025" },
    ];
    expect(sumAccountValue(rows, "revenue", "2025")).toBe(1_200_000);
    expect(sumAccountValue(rows, "revenue", "2024")).toBe(1_000_000);
  });
});

describe("cero observado no se confunde con missing", () => {
  it("18. cash=0 observado explícitamente se preserva como 0, no como null", () => {
    const rows = [{ canonical_account: "cash", value: 0, period: "2025" }];
    expect(sumAccountValue(rows, "cash", "2025")).toBe(0);
  });
});
