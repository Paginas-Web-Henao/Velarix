// Bloque 3B — Tests-first de la separación Evidence/Judgment en
// snapshots, docs/velarix-v5/05-financial-engine-audit.md v1.3 §7.
//
// `source_input_snapshot` (buildSourceInputSnapshot, función REAL de
// producción, sin modificar) debe permanecer exclusivamente como
// Evidence. `resolved_assumptions_used` es un snapshot separado de
// Judgment que todavía no existe como función productiva — aquí se
// define como helper/fixture de especificación (explícitamente
// permitido: "puede ser un helper/test fixture por ahora"), NO como
// parte de _shared/ productivo. No se implementa el envelope de
// ejecutar-calculo en este bloque.

import { describe, it, expect } from "vitest";
import { buildSourceInputSnapshot } from "./source-input-snapshot";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";
import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions";

const FULL_INPUT = {
  base_period: "2025",
  moneda_analisis: "USD",
  income_statement: { revenue: 1_000_000, cost_of_sales: 400_000, opex: 150_000, da: 30_000, ebitda: 420_000, ebit: 390_000, interest_expense: 20_000, taxes: 111_000, net_income: 259_000 },
  balance_sheet: { cash: 80_000, accounts_receivable: 120_000, inventory: 60_000, accounts_payable: 90_000, ppe: 500_000, current_financial_debt: 40_000, long_term_financial_debt: 160_000, financial_debt_total: 200_000, equity: 700_000, total_assets: 1_100_000, total_liabilities: 400_000 },
  resolved_assumptions: EXAMPLE_RESOLVED_ASSUMPTIONS,
};

describe("source_input_snapshot — permanece limitado a Evidence (verde — ya se cumple hoy)", () => {
  it("no contiene resolved_assumptions aunque el input lo incluya", () => {
    const snapshot = buildSourceInputSnapshot({
      structuredInputId: "struct-1",
      versionInput: "2.3",
      sector: "Software / Tecnología",
      input: FULL_INPUT,
    });
    expect(snapshot).not.toHaveProperty("resolved_assumptions");
    expect(JSON.stringify(snapshot)).not.toContain("terminalG");
    expect(JSON.stringify(snapshot)).not.toContain("capitalStructure");
  });

  it("sigue congelando los inputs financieros fuente exactamente igual que sin resolved_assumptions presente", () => {
    const withJudgment = buildSourceInputSnapshot({ structuredInputId: "s1", versionInput: "2.3", sector: "Software / Tecnología", input: FULL_INPUT });
    const { resolved_assumptions: _omitted, ...withoutJudgment } = FULL_INPUT;
    const withoutJudgmentSnapshot = buildSourceInputSnapshot({ structuredInputId: "s1", versionInput: "2.3", sector: "Software / Tecnología", input: withoutJudgment });
    expect(withJudgment).toEqual(withoutJudgmentSnapshot);
  });
});

// ─────────────────────────────────────────────────────────────────
// resolved_assumptions_used — helper/fixture de especificación.
// NO es producción. Vive solo en este archivo de test. Define el
// comportamiento que una futura `buildResolvedAssumptionsSnapshot`
// (Bloque 3C) debería tener: copia literal, sin recalcular, sin
// sustituir valores, sin mezclar evidencia financiera salvo las
// referencias/source que cada supuesto ya declara por sí mismo.
// ─────────────────────────────────────────────────────────────────

function buildResolvedAssumptionsSnapshotSpec(
  resolvedAssumptions: ResolvedCalculationAssumptions,
): ResolvedCalculationAssumptions {
  // Passthrough literal — ninguna transformación, ningún cálculo.
  return JSON.parse(JSON.stringify(resolvedAssumptions));
}

describe("resolved_assumptions_used — especificación (helper de test, no producción)", () => {
  it("conserva exactamente los supuestos usados, sin omitir ninguno de los 13", () => {
    const snapshot = buildResolvedAssumptionsSnapshotSpec(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(snapshot).toEqual(EXAMPLE_RESOLVED_ASSUMPTIONS);
  });

  it("no recalcula ningún valor — el mismo objeto de entrada produce el mismo objeto de salida byte a byte", () => {
    const snapshot = buildResolvedAssumptionsSnapshotSpec(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(JSON.stringify(snapshot)).toBe(JSON.stringify(EXAMPLE_RESOLVED_ASSUMPTIONS));
  });

  it("no sustituye valores por defaults ni por ningún otro valor — un supuesto con un valor inusual se preserva tal cual", () => {
    const unusual: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      terminalG: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG, value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value, valuePct: 0.01 } },
    };
    const snapshot = buildResolvedAssumptionsSnapshotSpec(unusual);
    expect(snapshot.terminalG.value.valuePct).toBe(0.01);
  });

  it("no mezcla evidencia financiera (income_statement/balance_sheet) dentro del objeto — solo lo que cada supuesto ya declara como source/rationale propios", () => {
    const snapshot = buildResolvedAssumptionsSnapshotSpec(EXAMPLE_RESOLVED_ASSUMPTIONS);
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain("income_statement");
    expect(serialized).not.toContain("balance_sheet");
  });

  it("es conceptualmente distinto de source_input_snapshot — ambos pueden coexistir en el mismo envelope sin solaparse", () => {
    const evidenceSnapshot = buildSourceInputSnapshot({ structuredInputId: "s1", versionInput: "2.3", sector: "Manufactura", input: FULL_INPUT });
    const judgmentSnapshot = buildResolvedAssumptionsSnapshotSpec(EXAMPLE_RESOLVED_ASSUMPTIONS);
    const evidenceKeys = new Set(Object.keys(evidenceSnapshot));
    const judgmentKeys = new Set(Object.keys(judgmentSnapshot));
    const overlap = [...evidenceKeys].filter((k) => judgmentKeys.has(k));
    expect(overlap).toEqual([]);
  });
});
