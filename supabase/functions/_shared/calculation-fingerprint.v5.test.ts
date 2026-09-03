// Bloque 3B — Tests-first del fingerprint v5 (Evidence + Judgment),
// docs/velarix-v5/05-financial-engine-audit.md v1.3 §7. Llama a la
// función REAL de producción (`computeInputFingerprint`) — nunca
// reimplementa la serialización ni el hash. No se modifica
// calculation-fingerprint.ts en este bloque.
//
// Decisión CORREGIDA en Bloque 3B.1 (revierte la decisión original de
// Bloque 3B, que excluía source/rationale/status/date del fingerprint —
// esa exclusión contradecía 05 v1.3): la identidad metodológica del
// cálculo depende del Judgment COMPLETO utilizado, no solo del `value`
// numérico. Conceptualmente:
//
//   hash({ source_inputs_used, resolved_assumptions_used })
//
// donde `resolved_assumptions_used` es el objeto de Judgment COMPLETO
// (value + unit + source + rationale + status + date de cada una de las
// 13 entradas), no un subconjunto. Esto NO significa que el resultado
// FINANCIERO cambie al cambiar solo `source`/`rationale`/`status`/`date`
// — significa que la IDENTIDAD/VERSIÓN de la ejecución cambia, porque
// cambió el Judgment documentado que la respalda (dos ejecuciones con el
// mismo `value` pero justificaciones o fuentes distintas no son la misma
// decisión metodológica, aunque produzcan el mismo número). Esa es
// precisamente la disciplina de trazabilidad de `04 §16`.

import { describe, it, expect } from "vitest";
import { computeInputFingerprint } from "./calculation-fingerprint";
import type { CanonicalStructuredInput } from "./canonical-financial-engine";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";
import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions";

const BASE_INPUT: CanonicalStructuredInput = {
  income_statement: { revenue: 2_000_000_000, cost_of_sales: 900_000_000, opex: 700_000_000, da: 40_000_000, interest_expense: 15_000_000 },
  balance_sheet: { financial_debt_total: 200_000_000, cash: 500_000_000, equity: 2_500_000_000 },
  moneda_analisis: "COP",
  factor_conversion: 1,
};

function withJudgment(resolvedAssumptions: ResolvedCalculationAssumptions): CanonicalStructuredInput {
  return { ...BASE_INPUT, resolved_assumptions: resolvedAssumptions } as any;
}

describe("Fingerprint — HOY (caracterización, verde)", () => {
  it("cambiar terminal_g dentro de resolved_assumptions NO cambia el fingerprint hoy — confirmado, es exactamente el gap de 05 v1.3 §7", () => {
    const changed: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      terminalG: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG, value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value, valuePct: 99 } },
    };
    const f1 = computeInputFingerprint(withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS) as any, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(withJudgment(changed) as any, "Software / Tecnología", 45);
    expect(f1).toBe(f2);
  });

  it("resolved_assumptions completo vs. ausente producen el mismo fingerprint hoy", () => {
    const withIt = computeInputFingerprint(withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS) as any, "Software / Tecnología", 45);
    const without = computeInputFingerprint(BASE_INPUT, "Software / Tecnología", 45);
    expect(withIt).toBe(without);
  });
});

describe("Fingerprint — V5 OBJETIVO (rojo esperado hasta implementar RC-3/reproducibilidad)", () => {
  it("Evidence idéntica + Judgment idéntico → fingerprint idéntico (ya se cumple hoy, debe seguir cumpliéndose después de implementar)", () => {
    const f1 = computeInputFingerprint(withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS) as any, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(withJudgment(JSON.parse(JSON.stringify(EXAMPLE_RESOLVED_ASSUMPTIONS))) as any, "Software / Tecnología", 45);
    expect(f1).toBe(f2);
  });

  it("cambiar solo revenue (Evidence) cambia el fingerprint (ya se cumple hoy, debe seguir cumpliéndose)", () => {
    // OJO: withJudgment hace un spread superficial de BASE_INPUT — no mutar
    // income_statement de un objeto devuelto por withJudgment(), porque
    // comparte referencia con BASE_INPUT.income_statement y contaminaría
    // f1 también. Se construye un income_statement nuevo en su lugar.
    const changedRevenue: CanonicalStructuredInput = {
      ...withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS),
      income_statement: { ...BASE_INPUT.income_statement, revenue: 2_000_000_001 },
    };
    const f1 = computeInputFingerprint(withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS) as any, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(changedRevenue as any, "Software / Tecnología", 45);
    expect(f1).not.toBe(f2);
  });

  it.fails("cambiar solo terminal_g (Judgment) debe cambiar el fingerprint — ROJO hoy", () => {
    const changed: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      terminalG: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG, value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value, valuePct: 99 } },
    };
    const f1 = computeInputFingerprint(withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS) as any, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(withJudgment(changed) as any, "Software / Tecnología", 45);
    expect(f1).not.toBe(f2);
  });

  it.fails("cambiar solo capital_structure (Judgment) debe cambiar el fingerprint — ROJO hoy", () => {
    const changed: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      capitalStructure: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure,
        value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure.value, equityWeight: 0.9, debtWeight: 0.1 },
      },
    };
    const f1 = computeInputFingerprint(withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS) as any, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(withJudgment(changed) as any, "Software / Tecnología", 45);
    expect(f1).not.toBe(f2);
  });

  it.fails("cambiar solo un ΔNWC explícito debe cambiar el fingerprint — ROJO hoy", () => {
    const changed: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      workingCapitalDriver: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.workingCapitalDriver,
        value: { explicitDeltaNwcByYear: [12_000_000, 13_500_000, 999_999_999, 11_200_000, 10_500_000] },
      },
    };
    const f1 = computeInputFingerprint(withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS) as any, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(withJudgment(changed) as any, "Software / Tecnología", 45);
    expect(f1).not.toBe(f2);
  });

  it.fails("cambiar ÚNICAMENTE 'source' de un supuesto (mismo value) SÍ debe cambiar el fingerprint — ROJO hoy (decisión corregida en 3B.1: la identidad depende del Judgment completo)", () => {
    const changed: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      costOfDebt: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.costOfDebt, source: "Fuente completamente distinta" },
    };
    const f1 = computeInputFingerprint(withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS) as any, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(withJudgment(changed) as any, "Software / Tecnología", 45);
    expect(f1).not.toBe(f2);
  });

  it.fails("cambiar ÚNICAMENTE 'rationale' de un supuesto (mismo value) SÍ debe cambiar el fingerprint — ROJO hoy", () => {
    const changed: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      costOfDebt: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.costOfDebt, rationale: "Justificación completamente distinta" },
    };
    const f1 = computeInputFingerprint(withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS) as any, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(withJudgment(changed) as any, "Software / Tecnología", 45);
    expect(f1).not.toBe(f2);
  });

  it.fails("cambiar ÚNICAMENTE 'status' de un supuesto (mismo value) SÍ debe cambiar el fingerprint — ROJO hoy (aunque en la práctica 'status' casi siempre sea 'resolved', el contrato no lo impide a nivel de tipo de este test)", () => {
    const changed: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      costOfDebt: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.costOfDebt, status: "pending" as unknown as "resolved" },
    };
    const f1 = computeInputFingerprint(withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS) as any, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(withJudgment(changed) as any, "Software / Tecnología", 45);
    expect(f1).not.toBe(f2);
  });

  it.fails("cambiar una 'date' material SÍ debe cambiar el fingerprint — ROJO hoy (una fecha distinta puede implicar un snapshot de mercado distinto, aunque el value numérico coincida por coincidencia)", () => {
    const changed: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      taxTreatment: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment, date: "2099-01-01" },
    };
    const f1 = computeInputFingerprint(withJudgment(EXAMPLE_RESOLVED_ASSUMPTIONS) as any, "Software / Tecnología", 45);
    const f2 = computeInputFingerprint(withJudgment(changed) as any, "Software / Tecnología", 45);
    expect(f1).not.toBe(f2);
  });
});
