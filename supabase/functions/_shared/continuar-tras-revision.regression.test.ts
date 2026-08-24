// REGRESIÓN — continuar-tras-revision/index.ts ya NO reconstruye
// structured_input con lógica propia. Antes convertía campos genuinamente
// AUSENTES (`da`, `financial_debt_total`) en `0` fabricado vía `?? 0` / `||`
// y recalculaba `net_income` con una tasa de impuestos de 30% hardcoded sin
// aprobación metodológica, antes de llegar al Calculation Preflight. El fix
// eliminó esa segunda implementación financiera: ambos caminos
// (build-structured-input y continuar-tras-revision) llaman ahora a
// `deriveCoreFinancialFields`, el único derivador puro compartido en
// structured-input-derivations.ts.
//
// index.ts no puede importarse en Vitest: usa `serve()` de Deno std y URL
// imports de esm.sh/deno.land. Mismo patrón que
// calculation-preflight.integration.test.ts / minimum-expediente-checkpoint
// .integration.test.ts: (1) verificación estática de que index.ts realmente
// invoca el derivador canónico compartido y ya no contiene los patrones
// vulnerables; (2) las mismas expectativas de comportamiento de la
// regresión original, ahora ejercidas contra la implementación REAL
// (`deriveCoreFinancialFields`, sin modificar) en vez de una réplica
// hardcodeada del código viejo -- de lo contrario este archivo seguiría
// probando el bug ya corregido, no el comportamiento real post-fix.
//
// Las expectativas de los 4 tests de regresión NO cambiaron respecto a la
// versión pre-fix de este archivo.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { evaluateCalculationPreflight } from "./calculation-preflight";
import {
  deriveCoreFinancialFields,
  deriveEbitdaFromComponents,
  deriveFinancialDebtTotal,
  type CoreFinancialFields,
} from "./structured-input-derivations";
import type { HomologatedAccountRow } from "./financial-accounts";

const sourcePath = path.resolve(__dirname, "../continuar-tras-revision/index.ts");
const source = fs.readFileSync(sourcePath, "utf-8");

describe("continuar-tras-revision/index.ts — verificación estática: usa el derivador canónico compartido, ya no reconstruye con lógica propia", () => {
  it("importa y llama a deriveCoreFinancialFields desde _shared/structured-input-derivations.ts", () => {
    expect(source).toContain(
      'import { deriveCoreFinancialFields } from "../_shared/structured-input-derivations.ts";',
    );
    expect(source).toContain("deriveCoreFinancialFields(cuentas as HomologatedAccountRow[], basePeriod)");
  });

  it("ya no contiene los patrones vulnerables anteriores: fabricación missing->0 y tasa de impuestos hardcoded", () => {
    expect(source).not.toContain('getValue("da") ?? 0');
    expect(source).not.toContain('getValue("current_financial_debt") ?? 0');
    expect(source).not.toContain('getValue("long_term_financial_debt") ?? 0');
    expect(source).not.toContain("(currentDebt + longTermDebt) ||");
    expect(source).not.toContain("1 - 0.3"); // tasa de impuestos inline eliminada
    expect(source).not.toContain("const getValue = (canonical: string)"); // segunda implementación local eliminada
  });
});

describe("continuar-tras-revision — REGRESIÓN: da / financial_debt_total ausentes deben quedar null, no fabricarse como 0", () => {
  // Homologación corregida por el analista: SÍ trae las 5 cuentas críticas
  // que el gate de la línea 128 exige (revenue/cash/equity/total_assets/
  // total_liabilities), pero NO trae ninguna fila para da/
  // current_financial_debt/long_term_financial_debt/financial_debt_total en
  // el base_period -- ausencia real de dato, no un cero observado.
  const observed: Record<string, number> = {
    revenue: 1000,
    cost_of_sales: 400,
    opex: 200,
    interest_expense: 50,
    cash: 100,
    equity: 500,
    total_assets: 900,
    total_liabilities: 400,
  };
  const rows: HomologatedAccountRow[] = Object.entries(observed).map(([canonical_account, value]) => ({
    canonical_account,
    value,
    period: null,
  }));

  // Ejercita la MISMA implementación real que ahora usa
  // continuar-tras-revision/index.ts (confirmado por la verificación
  // estática de arriba) -- no una copia paralela.
  const reconstructed: CoreFinancialFields = deriveCoreFinancialFields(rows, null);

  it("REGRESIÓN: da ausente debe propagarse como null (ausente), no fabricarse como 0", () => {
    expect(reconstructed.da).toBeNull();
  });

  it("REGRESIÓN: financial_debt_total con ambos componentes ausentes debe coincidir con el derivador canónico compartido (null), no fabricarse como 0", () => {
    expect(deriveFinancialDebtTotal(null, null)).toBeNull(); // fuente canónica: ausente -> null
    expect(reconstructed.financialDebtTotal).toBe(deriveFinancialDebtTotal(null, null));
  });

  it("REGRESIÓN: el ebitda reconstruido debe coincidir con el derivador canónico compartido cuando da está ausente (null), no fabricar un número", () => {
    const canonicalEbitda = deriveEbitdaFromComponents({
      revenue: observed.revenue,
      costOfSales: observed.cost_of_sales,
      opex: observed.opex,
      da: null, // ausente de verdad -- ninguna fila da/base_period en cuentas
    });
    expect(canonicalEbitda).toBeNull();
    expect(reconstructed.ebitda).toBe(canonicalEbitda);
  });

  it("REGRESIÓN: el Calculation Preflight real (sin modificar) detecta 'da' y 'financial_debt_total' como ausentes", () => {
    const preflight = evaluateCalculationPreflight({
      incomeStatement: {
        revenue: reconstructed.revenue,
        cost_of_sales: reconstructed.costOfSales,
        opex: reconstructed.opex,
        da: reconstructed.da,
      },
      balanceSheet: {
        cash: reconstructed.cash,
        equity: reconstructed.equity,
        financial_debt_total: reconstructed.financialDebtTotal,
      },
    });

    expect(preflight.missing_inputs).toContain("da");
    expect(preflight.missing_inputs).toContain("financial_debt_total");
  });
});

describe("continuar-tras-revision — REGRESIÓN: net_income sin tasa de impuestos inventada", () => {
  it("net_income ausente queda null -- ya no se deriva con (ebit - interest_expense) * (1 - 0.3)", () => {
    const rows: HomologatedAccountRow[] = [
      { canonical_account: "revenue", value: 1000, period: null },
      { canonical_account: "cost_of_sales", value: 400, period: null },
      { canonical_account: "opex", value: 200, period: null },
      { canonical_account: "da", value: 50, period: null },
      { canonical_account: "interest_expense", value: 30, period: null },
      // net_income: sin fila -- ausente de verdad.
    ];
    const core = deriveCoreFinancialFields(rows, null);
    // Con da observado, ebit sí se deriva (400-400-200+50=... revenue-cost-opex+da=1000-400-200+50=450; ebit=450-50=400),
    // pero net_income NO tiene ninguna regla canónica aprobada que lo derive de ebit/intereses -- debe quedar null.
    expect(core.ebit).not.toBeNull();
    expect(core.netIncome).toBeNull();
  });
});
