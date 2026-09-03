// Bloque 3B — Tests-first del comportamiento v5 del Calculation Preflight
// (docs/velarix-v5/05-financial-engine-audit.md v1.3 §5, RC-3).
//
// Estos tests llaman a la función REAL de producción
// (`evaluateCalculationPreflight`, calculation-preflight.ts) — nunca
// reimplementan su lógica. Su firma actual es
// `evaluateCalculationPreflight({ incomeStatement, balanceSheet })` — no
// acepta todavía `resolvedAssumptions`. Los tests de esta sección la
// pasan de todos modos, vía un cast explícito `as any`, para expresar la
// llamada que la firma v5 debería aceptar — hoy ese campo se ignora por
// completo, así que las aserciones sobre comportamiento v5 fallan
// legítimamente (ROJO), no por un error de compilación ni por un test
// mal escrito. NO se modifica calculation-preflight.ts en este bloque.
//
// Convención de blocker asumida para v5 (documentada aquí, no
// implementada): cada blocker específico de un supuesto resuelto
// inválido/faltante debe empezar con el prefijo `RESOLVED_ASSUMPTION_`
// seguido del nombre EXACTO del campo (ej.
// `RESOLVED_ASSUMPTION_MISSING: terminalG`). Se eligió un prefijo nuevo,
// no una coincidencia de substring sobre el texto de los blockers
// legacy, deliberadamente: los blockers legacy de hoy ya mencionan
// nombres como "terminalGrowthPct", "workingCapitalPctOfRevenue" o
// "projection_horizon_years" — un test que solo buscara /horizon/i o
// /working.?capital/i coincidiría por accidente con ESOS nombres legacy
// y pasaría en falso incluso sin ninguna implementación v5 real. Usar un
// prefijo que hoy no existe en ningún blocker evita ese falso positivo
// y fuerza que el rojo sea honesto.
//
// Se distinguen dos capas, explícitas en cada describe():
//  - "HOY (caracterización)": documenta el comportamiento REAL actual,
//    verde, tal como existe (incluyendo el bloqueo permanente ya
//    demostrado en 05 v1.3 §1/Hallazgo A).
//  - "V5 OBJETIVO (rojo esperado)": expresa el comportamiento que
//    evaluateCalculationPreflight debería tener una vez implementado
//    RC-3 — no se adapta la aserción para que pase hoy.

import { describe, it, expect } from "vitest";
import { evaluateCalculationPreflight } from "./calculation-preflight";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";
import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions";

const COMPLETE_INCOME_STATEMENT = { revenue: 1_200_000, cost_of_sales: 700_000, opex: 220_000, da: 50_000 };
const COMPLETE_BALANCE_SHEET = { cash: 300_000, equity: 900_000, financial_debt_total: 100_000 };

/** Verifica que exista un blocker con el prefijo v5 objetivo para el campo dado — nunca coincide con texto de blockers legacy (ver nota de archivo). */
function hasResolvedAssumptionBlocker(blockers: string[], fieldNameOrTopic: string): boolean {
  const needle = `RESOLVED_ASSUMPTION_${fieldNameOrTopic}`.toLowerCase();
  return blockers.some((b) => b.toLowerCase().startsWith("resolved_assumption_") && b.toLowerCase().includes(needle.replace("resolved_assumption_", "")));
}

/** Llamada v5-objetivo: pasa `resolvedAssumptions` además de los inputs financieros — firma que evaluateCalculationPreflight todavía no tiene. */
function evaluatePreflightV5Target(resolvedAssumptions: ResolvedCalculationAssumptions | Partial<ResolvedCalculationAssumptions>) {
  return evaluateCalculationPreflight({
    incomeStatement: COMPLETE_INCOME_STATEMENT,
    balanceSheet: COMPLETE_BALANCE_SHEET,
    resolvedAssumptions,
  } as any);
}

describe("Calculation Preflight — HOY (caracterización, verde)", () => {
  it("con inputs completos y resolvedAssumptions completos, sigue bloqueado por METHODOLOGY_APPROVAL_REQUIRED — resolvedAssumptions se ignora por completo hoy", () => {
    const r = evaluatePreflightV5Target(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(r.passed).toBe(false);
    expect(r.unapproved_assumptions).toHaveLength(9);
    expect(r.blockers.some((b) => b.includes("METHODOLOGY_APPROVAL_REQUIRED"))).toBe(true);
  });

  it("el resultado no cambia en absoluto si resolvedAssumptions está vacío o ausente (no se lee en ningún punto)", () => {
    const withAssumptions = evaluatePreflightV5Target(EXAMPLE_RESOLVED_ASSUMPTIONS);
    const withoutAssumptions = evaluateCalculationPreflight({ incomeStatement: COMPLETE_INCOME_STATEMENT, balanceSheet: COMPLETE_BALANCE_SHEET });
    expect(withAssumptions).toEqual(withoutAssumptions);
  });

  it("hoy NUNCA existe ningún blocker con el prefijo RESOLVED_ASSUMPTION_ — confirma que ninguno de los tests de abajo puede pasar hoy por una coincidencia accidental de texto legacy", () => {
    const r = evaluatePreflightV5Target(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(r.blockers.some((b) => b.toUpperCase().startsWith("RESOLVED_ASSUMPTION_"))).toBe(false);
  });
});

describe("Calculation Preflight — V5 OBJETIVO (rojo esperado hasta implementar RC-3)", () => {
  it.fails("debe PASAR cuando los inputs financieros están completos y los 13 supuestos están resueltos con provenance mínima", () => {
    const r = evaluatePreflightV5Target(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(r.passed).toBe(true);
  });

  it.fails("debe FALLAR cuando los inputs financieros están completos pero faltan supuestos metodológicos v5 (resolvedAssumptions ausente)", () => {
    const r = evaluateCalculationPreflight({ incomeStatement: COMPLETE_INCOME_STATEMENT, balanceSheet: COMPLETE_BALANCE_SHEET } as any);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "MISSING")).toBe(true);
  });

  it.fails("debe FALLAR cuando falta un supuesto requerido específico (ej. terminalG ausente)", () => {
    const { terminalG: _omitted, ...incomplete } = EXAMPLE_RESOLVED_ASSUMPTIONS;
    const r = evaluatePreflightV5Target(incomplete);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "MISSING_TERMINALG")).toBe(true);
  });

  it.fails("debe FALLAR cuando un supuesto resuelto tiene status distinto de 'resolved'", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      terminalG: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG, status: "pending" as unknown as "resolved" },
    };
    const r = evaluatePreflightV5Target(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "STATUS_TERMINALG")).toBe(true);
  });

  it.fails("debe FALLAR cuando falta 'source' en un supuesto resuelto", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      costOfDebt: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.costOfDebt, source: "" },
    };
    const r = evaluatePreflightV5Target(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "SOURCE_COSTOFDEBT")).toBe(true);
  });

  it.fails("debe FALLAR cuando falta 'rationale' en un supuesto resuelto", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      costOfDebt: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.costOfDebt, rationale: "" },
    };
    const r = evaluatePreflightV5Target(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "RATIONALE_COSTOFDEBT")).toBe(true);
  });

  it.fails("debe FALLAR cuando los weights de capital structure son inválidos (negativos)", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      capitalStructure: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure,
        value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure.value, equityWeight: -0.1, debtWeight: 1.1 },
      },
    };
    const r = evaluatePreflightV5Target(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_CAPITALSTRUCTURE")).toBe(true);
  });

  it.fails("debe FALLAR cuando equityWeight + debtWeight != 100%", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      capitalStructure: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure,
        value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure.value, equityWeight: 0.5, debtWeight: 0.3 },
      },
    };
    const r = evaluatePreflightV5Target(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_CAPITALSTRUCTURE")).toBe(true);
  });

  it.fails("debe FALLAR cuando projectionHorizonYears != 5 mientras el motor solo soporte 5", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      projectionHorizonYears: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.projectionHorizonYears,
        value: { years: 7 },
      },
    };
    const r = evaluatePreflightV5Target(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INCOMPATIBLE_PROJECTIONHORIZONYEARS")).toBe(true);
  });

  it.fails("debe FALLAR cuando explicit_delta_nwc_by_year no tiene exactamente 5 valores (horizonte=5)", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      workingCapitalDriver: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.workingCapitalDriver,
        value: { explicitDeltaNwcByYear: [1, 2, 3, 4] }, // 4 valores, no 5
      },
    };
    const r = evaluatePreflightV5Target(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_WORKINGCAPITALDRIVER")).toBe(true);
  });

  it.fails("debe FALLAR cuando explicit_delta_nwc_by_year tiene 6 valores (más del horizonte)", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      workingCapitalDriver: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.workingCapitalDriver,
        value: { explicitDeltaNwcByYear: [1, 2, 3, 4, 5, 6] },
      },
    };
    const r = evaluatePreflightV5Target(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_WORKINGCAPITALDRIVER")).toBe(true);
  });

  it.fails("debe FALLAR cuando explicitFcffTaxRatePctByYear no tiene exactamente la misma longitud que projectionHorizonYears (04 §6.3, Bloque 3B.2)", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      taxTreatment: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment,
        value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value, explicitFcffTaxRatePctByYear: [20, 24, 28, 32] }, // 4 valores, no 5
      },
    };
    const r = evaluatePreflightV5Target(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_TAXTREATMENT")).toBe(true);
  });

  it.fails("la pregunta del preflight v5 es 'están los supuestos resueltos', no 'los defaults globales están approved=true' — pasar con resolvedAssumptions completos no debe depender de que CANONICAL_METHODOLOGY cambie", () => {
    const r = evaluatePreflightV5Target(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(r.passed).toBe(true);
    // Ningún supuesto legacy debería seguir bloqueando cuando el equivalente
    // v5 ya fue resuelto explícitamente.
    expect(r.unapproved_assumptions).toEqual([]);
  });
});
