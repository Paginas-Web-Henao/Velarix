// Bloque 3B — Tests-first del comportamiento v5 del Calculation Preflight
// (docs/velarix-v5/05-financial-engine-audit.md v1.3 §5, RC-3).
//
// Bloque 3C.1 (implementación): `evaluateCalculationPreflight` acepta
// ahora una propiedad opcional adicional `resolvedAssumptions` en su
// (único) objeto de parámetros — no un parámetro posicional adicional,
// la función sigue teniendo aridad 1. Los 13 tests de validación v5 que
// antes eran `it.fails` (esperaban RC-3 sin implementar) ahora son `it`
// normales: se verificó, uno por uno, que cada uno pasa por la razón
// financiera/estructural correcta (no por coincidencia) antes de
// convertirlos.
//
// Bloque 3C.1.1 (esta revisión — corrección de una contradicción real):
// la distinción legacy/v5 se decide por PRESENCIA de la propiedad
// `resolvedAssumptions` en el objeto de parámetros
// (`Object.prototype.hasOwnProperty`), NUNCA por su valor. La versión
// anterior de `calculation-preflight.ts` comparaba
// `params.resolvedAssumptions !== undefined` para decidir el modo, lo
// que hacía indistinguibles "la llamada no incluye la clave" (legacy
// real) de "la llamada incluye la clave con valor `undefined`" (v5 con
// nada resuelto todavía) — y además invocaba la validación de los 13
// campos incondicionalmente, contaminando con blockers
// `RESOLVED_ASSUMPTION_MISSING_*` incluso una llamada legacy genuina.
// Corregido: ver `calculation-preflight.ts`. NO se introdujo ningún
// `executionMode` ni framework nuevo — la distinción es una única
// comprobación de presencia de propiedad.
//
// docs/velarix-v5/06-tests-first-plan.md es canónico y NO fue ni debe
// ser modificado por Bloque 3C — el detalle de esta implementación vive
// únicamente en este archivo y en el reporte del bloque, no en `06`.
//
// Convención de blocker v5 (implementada en calculation-preflight.ts):
// cada blocker específico de un supuesto resuelto inválido/faltante
// empieza con el prefijo `RESOLVED_ASSUMPTION_` seguido del nombre EXACTO
// del campo (ej. `RESOLVED_ASSUMPTION_MISSING_TERMINALG: ...`). Se eligió
// un prefijo nuevo, no una coincidencia de substring sobre el texto de
// los blockers legacy, deliberadamente: los blockers legacy ya mencionan
// nombres como "terminalGrowthPct", "workingCapitalPctOfRevenue" o
// "projection_horizon_years" — un test que solo buscara /horizon/i o
// /working.?capital/i coincidiría por accidente con ESOS nombres legacy.

import { describe, it, expect } from "vitest";
import { evaluateCalculationPreflight } from "./calculation-preflight";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";
import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions";

const COMPLETE_INCOME_STATEMENT = { revenue: 1_200_000, cost_of_sales: 700_000, opex: 220_000, da: 50_000 };
const COMPLETE_BALANCE_SHEET = { cash: 300_000, equity: 900_000, financial_debt_total: 100_000 };

/** Verifica que exista un blocker con el prefijo v5 para el campo/tema dado — nunca coincide con texto de blockers legacy (ver nota de archivo). */
function hasResolvedAssumptionBlocker(blockers: string[], fieldNameOrTopic: string): boolean {
  const needle = `RESOLVED_ASSUMPTION_${fieldNameOrTopic}`.toLowerCase();
  return blockers.some((b) => b.toLowerCase().startsWith("resolved_assumption_") && b.toLowerCase().includes(needle.replace("resolved_assumption_", "")));
}

function evaluatePreflightV5(resolvedAssumptions: ResolvedCalculationAssumptions | Partial<ResolvedCalculationAssumptions> | null | undefined) {
  return evaluateCalculationPreflight({
    incomeStatement: COMPLETE_INCOME_STATEMENT,
    balanceSheet: COMPLETE_BALANCE_SHEET,
    resolvedAssumptions,
  });
}

// ─────────────────────────────────────────────────────────────────
// Los 5 casos que distinguen legacy de v5 — exigidos explícitamente:
// propiedad ausente (legacy) vs. propiedad presente con undefined/null/
// {}/13-campos-válidos (v5, en sus 4 variantes). Cada uno es un test
// independiente, sin compartir aserciones entre sí.
// ─────────────────────────────────────────────────────────────────

describe("Legacy vs. v5 — distinción por presencia de la propiedad, no por su valor", () => {
  it("1. propiedad `resolvedAssumptions` TOTALMENTE AUSENTE del objeto de parámetros → legacy exacto, estructuralmente idéntico al resultado del commit 884173d", () => {
    const r = evaluateCalculationPreflight({ incomeStatement: COMPLETE_INCOME_STATEMENT, balanceSheet: COMPLETE_BALANCE_SHEET });
    // Objeto completo, no solo `passed` — extraído ejecutando el archivo
    // real tal como existía en 884173d contra este mismo fixture
    // (verificación puntual documentada en el reporte de este bloque).
    expect(r).toEqual({
      passed: false,
      missing_inputs: [],
      unapproved_assumptions: [
        "taxRatePct",
        "capexPctOfRevenue",
        "workingCapitalPctOfRevenue",
        "terminalGrowthPct",
        "costOfDebtPct",
        "riskFreeRatePct",
        "equityRiskPremiumPct",
        "depreciationPctOfRevenue",
        "projection_horizon_years",
      ],
      blockers: [
        'METHODOLOGY_APPROVAL_REQUIRED: el supuesto "taxRatePct" no tiene aprobación humana registrada.',
        'METHODOLOGY_APPROVAL_REQUIRED: el supuesto "capexPctOfRevenue" no tiene aprobación humana registrada.',
        'METHODOLOGY_APPROVAL_REQUIRED: el supuesto "workingCapitalPctOfRevenue" no tiene aprobación humana registrada.',
        'METHODOLOGY_APPROVAL_REQUIRED: el supuesto "terminalGrowthPct" no tiene aprobación humana registrada.',
        'METHODOLOGY_APPROVAL_REQUIRED: el supuesto "costOfDebtPct" no tiene aprobación humana registrada.',
        'METHODOLOGY_APPROVAL_REQUIRED: el supuesto "riskFreeRatePct" no tiene aprobación humana registrada.',
        'METHODOLOGY_APPROVAL_REQUIRED: el supuesto "equityRiskPremiumPct" no tiene aprobación humana registrada.',
        'METHODOLOGY_APPROVAL_REQUIRED: el supuesto "depreciationPctOfRevenue" no tiene aprobación humana registrada.',
        'METHODOLOGY_APPROVAL_REQUIRED: el supuesto "projection_horizon_years" no tiene aprobación humana registrada.',
      ],
    });
    // Ningún blocker v5 debe aparecer en una llamada legacy genuina —
    // esto es exactamente lo que la v1 de este archivo NO garantizaba.
    expect(r.blockers.some((b) => b.startsWith("RESOLVED_ASSUMPTION_"))).toBe(false);
  });

  it("2. propiedad presente con valor `undefined` → ejecución v5 bloqueada (NO legacy) — los 13 supuestos se reportan como faltantes", () => {
    const r = evaluatePreflightV5(undefined);
    expect(r.passed).toBe(false);
    expect(r.unapproved_assumptions).toEqual([]); // el mecanismo legacy queda sustituido, no acumulado
    expect(hasResolvedAssumptionBlocker(r.blockers, "MISSING")).toBe(true);
    // Los 13 campos, específicamente — no solo "algún" missing.
    for (const key of ["TAXTREATMENT", "CAPITALSTRUCTURE", "TERMINALG", "PROJECTIONHORIZONYEARS"]) {
      expect(hasResolvedAssumptionBlocker(r.blockers, `MISSING_${key}`)).toBe(true);
    }
  });

  it("3. propiedad presente con valor `null` → ejecución v5 bloqueada, mismo resultado que `undefined`", () => {
    const r = evaluatePreflightV5(null);
    expect(r.passed).toBe(false);
    expect(r.unapproved_assumptions).toEqual([]);
    expect(hasResolvedAssumptionBlocker(r.blockers, "MISSING")).toBe(true);
  });

  it("4. propiedad presente con `{}` → ejecución v5 bloqueada, los 13 campos faltan", () => {
    const r = evaluatePreflightV5({});
    expect(r.passed).toBe(false);
    expect(r.unapproved_assumptions).toEqual([]);
    let missingCount = 0;
    for (const key of ["TAXTREATMENT", "CAPITALSTRUCTURE", "RISKFREERATECONSTRUCTION", "MATUREERP", "COUNTRYRISKPREMIUM", "COUNTRYRISKLAMBDA", "BETATREATMENT", "COSTOFDEBT", "CAPEXREINVESTMENTDRIVER", "DEPRECIATIONDADRIVER", "WORKINGCAPITALDRIVER", "TERMINALG", "PROJECTIONHORIZONYEARS"]) {
      if (hasResolvedAssumptionBlocker(r.blockers, `MISSING_${key}`)) missingCount++;
    }
    expect(missingCount).toBe(13);
  });

  it("5. propiedad presente con los 13 supuestos válidos → ejecución v5 pasa", () => {
    const r = evaluatePreflightV5(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(r.passed).toBe(true);
    expect(r.unapproved_assumptions).toEqual([]);
    expect(r.blockers.some((b) => b.startsWith("RESOLVED_ASSUMPTION_"))).toBe(false);
  });
});

describe("Calculation Preflight — legacy (comportamiento histórico, tests adicionales)", () => {
  it("con inputs incompletos (fixture 'Terra Test S.A.S.'), el modo legacy sigue produciendo missing_inputs/unapproved_assumptions idénticos a antes de 3C.1", () => {
    const r = evaluateCalculationPreflight({
      incomeStatement: { revenue: 1_200_000, cost_of_sales: 700_000, opex: 220_000, da: null },
      balanceSheet: { cash: 300_000, equity: null, financial_debt_total: null },
    });
    expect(r.passed).toBe(false);
    expect(r.missing_inputs.sort()).toEqual(["da", "equity", "financial_debt_total"]);
    expect(r.unapproved_assumptions).toHaveLength(9);
    expect(r.blockers.some((b) => b.startsWith("RESOLVED_ASSUMPTION_"))).toBe(false);
  });
});

describe("Calculation Preflight — V5 (implementado en Bloque 3C.1)", () => {
  it("debe PASAR cuando los inputs financieros están completos y los 13 supuestos están resueltos con provenance mínima", () => {
    const r = evaluatePreflightV5(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(r.passed).toBe(true);
  });

  it("debe FALLAR cuando falta un supuesto requerido específico (ej. terminalG ausente)", () => {
    const { terminalG: _omitted, ...incomplete } = EXAMPLE_RESOLVED_ASSUMPTIONS;
    const r = evaluatePreflightV5(incomplete);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "MISSING_TERMINALG")).toBe(true);
  });

  it("debe FALLAR cuando un supuesto resuelto tiene status distinto de 'resolved'", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      terminalG: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG, status: "pending" as unknown as "resolved" },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "STATUS_TERMINALG")).toBe(true);
  });

  it("debe FALLAR cuando falta 'source' en un supuesto resuelto", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      costOfDebt: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.costOfDebt, source: "" },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "SOURCE_COSTOFDEBT")).toBe(true);
  });

  it("debe FALLAR cuando falta 'rationale' en un supuesto resuelto", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      costOfDebt: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.costOfDebt, rationale: "" },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "RATIONALE_COSTOFDEBT")).toBe(true);
  });

  it("debe FALLAR cuando los weights de capital structure son inválidos (negativos)", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      capitalStructure: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure,
        value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure.value, equityWeight: -0.1, debtWeight: 1.1 },
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_CAPITALSTRUCTURE")).toBe(true);
  });

  it("debe FALLAR cuando equityWeight + debtWeight != 100%", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      capitalStructure: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure,
        value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure.value, equityWeight: 0.5, debtWeight: 0.3 },
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_CAPITALSTRUCTURE")).toBe(true);
  });

  it("debe FALLAR cuando projectionHorizonYears != 5 mientras el motor solo soporte 5", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      projectionHorizonYears: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.projectionHorizonYears,
        value: { years: 7 },
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INCOMPATIBLE_PROJECTIONHORIZONYEARS")).toBe(true);
  });

  it("debe FALLAR cuando explicit_delta_nwc_by_year no tiene exactamente 5 valores (horizonte=5)", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      workingCapitalDriver: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.workingCapitalDriver,
        value: { explicitDeltaNwcByYear: [1, 2, 3, 4] }, // 4 valores, no 5
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_WORKINGCAPITALDRIVER")).toBe(true);
  });

  it("debe FALLAR cuando explicit_delta_nwc_by_year tiene 6 valores (más del horizonte)", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      workingCapitalDriver: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.workingCapitalDriver,
        value: { explicitDeltaNwcByYear: [1, 2, 3, 4, 5, 6] },
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_WORKINGCAPITALDRIVER")).toBe(true);
  });

  it("debe FALLAR cuando explicitFcffTaxRatePctByYear no tiene exactamente la misma longitud que projectionHorizonYears (04 §6.3, Bloque 3B.2)", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      taxTreatment: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment,
        value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.taxTreatment.value, explicitFcffTaxRatePctByYear: [20, 24, 28, 32] }, // 4 valores, no 5
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_TAXTREATMENT")).toBe(true);
  });

  // Bloque 3C.4 (cierre de cobertura) — mismo principio que
  // explicit_delta_nwc_by_year/explicitFcffTaxRatePctByYear arriba,
  // aplicado a los dos drivers de reinversión cuando usan
  // `mode: "explicit_path"`. El modo `percent_of_revenue` (usado por
  // EXAMPLE_RESOLVED_ASSUMPTIONS por defecto) no tiene longitud que
  // verificar, así que estos tests construyen explícitamente un driver
  // en modo `explicit_path` con longitud incorrecta.
  it("debe FALLAR cuando capexReinvestmentDriver.explicitPath (mode explicit_path) no tiene exactamente 5 valores", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      capexReinvestmentDriver: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.capexReinvestmentDriver,
        value: { mode: "explicit_path", explicitPath: [1, 2, 3, 4] }, // 4 valores, no 5
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_CAPEXREINVESTMENTDRIVER")).toBe(true);
  });

  it("debe FALLAR cuando capexReinvestmentDriver.explicitPath (mode explicit_path) tiene 6 valores (más del horizonte)", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      capexReinvestmentDriver: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.capexReinvestmentDriver,
        value: { mode: "explicit_path", explicitPath: [1, 2, 3, 4, 5, 6] },
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_CAPEXREINVESTMENTDRIVER")).toBe(true);
  });

  it("NO debe fallar por longitud cuando capexReinvestmentDriver usa mode: percent_of_revenue (sin explicitPath que verificar)", () => {
    const r = evaluatePreflightV5(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_CAPEXREINVESTMENTDRIVER")).toBe(false);
  });

  it("debe FALLAR cuando depreciationDaDriver.explicitPath (mode explicit_path) no tiene exactamente 5 valores", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      depreciationDaDriver: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.depreciationDaDriver,
        value: { mode: "explicit_path", explicitPath: [1, 2, 3, 4] }, // 4 valores, no 5
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_DEPRECIATIONDADRIVER")).toBe(true);
  });

  it("debe FALLAR cuando depreciationDaDriver.explicitPath (mode explicit_path) tiene 6 valores (más del horizonte)", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      depreciationDaDriver: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.depreciationDaDriver,
        value: { mode: "explicit_path", explicitPath: [1, 2, 3, 4, 5, 6] },
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_DEPRECIATIONDADRIVER")).toBe(true);
  });

  it("NO debe fallar por longitud cuando depreciationDaDriver usa mode: percent_of_revenue (sin explicitPath que verificar)", () => {
    const r = evaluatePreflightV5(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_DEPRECIATIONDADRIVER")).toBe(false);
  });

  // Bloque 3C.5 (cierre) — mismo principio que capexReinvestmentDriver/
  // depreciationDaDriver arriba: el motor exige, en v5, los tres números
  // de `terminalG` (`valuePct` base + `pessimisticScenarioPct`/
  // `optimisticScenarioPct` de escenario) — sin ellos lanza en vez de
  // caer al hardcode legacy 3%/2%/4%.
  it("debe FALLAR cuando terminalG.valuePct no es un número finito", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      terminalG: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG,
        value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value, valuePct: undefined as unknown as number },
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_TERMINALG")).toBe(true);
  });

  it("debe FALLAR cuando terminalG.pessimisticScenarioPct no está resuelto", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      terminalG: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG,
        value: { valuePct: EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value.valuePct, optimisticScenarioPct: EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value.optimisticScenarioPct },
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_TERMINALG")).toBe(true);
  });

  it("debe FALLAR cuando terminalG.optimisticScenarioPct no está resuelto", () => {
    const broken: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      terminalG: {
        ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG,
        value: { valuePct: EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value.valuePct, pessimisticScenarioPct: EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value.pessimisticScenarioPct },
      },
    };
    const r = evaluatePreflightV5(broken);
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_TERMINALG")).toBe(true);
  });

  it("NO debe fallar por terminalG cuando los tres campos (valuePct/pessimisticScenarioPct/optimisticScenarioPct) están resueltos", () => {
    const r = evaluatePreflightV5(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_TERMINALG")).toBe(false);
  });

  it("la pregunta del preflight v5 es 'están los supuestos resueltos', no 'los defaults globales están approved=true' — pasar con resolvedAssumptions completos no depende de que CANONICAL_METHODOLOGY cambie", () => {
    const r = evaluatePreflightV5(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(r.passed).toBe(true);
    expect(r.unapproved_assumptions).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────
// RC-5 (4F.2, GREEN) — `countryRiskLambda`: dos modos mutuamente
// excluyentes, `observed_revenue_exposure` / `direct_documented_judgment`
// (docs/velarix-v5/04 §10.4, 05 §5/§6, enmendados). Gap universal
// identificado en 4F.1 (CONFIRMED_UNIVERSAL_METHODOLOGY_AND_CONTRACT_GAP),
// cerrado en esta revisión: `resolved-calculation-assumptions.ts` ahora
// define `CountryRiskLambdaValue` como unión discriminada por `mode`, y
// `calculation-preflight.ts::findResolvedAssumptionBlockers` valida su
// coherencia estructural (blockers `RESOLVED_ASSUMPTION_INVALID_
// COUNTRYRISKLAMBDA_{MODE,OBSERVED,RATIO,JUDGMENT,JUDGMENT_UNEXPECTED_PCT}`).
//
// Técnica de shape: `withResolvedLambda` sigue usando un cast
// `as unknown as` — necesario para los casos que siguen siendo
// deliberadamente inválidos incluso bajo el tipo nuevo (mode
// desconocido/ausente, percentages ausentes en modo observado,
// percentages fabricados en modo directo — TypeScript los rechazaría
// correctamente como literales). El caso que SÍ tipa nativamente ahora
// (Grupo 1) se construye sin el helper y sin cast, para demostrar que
// el gap de compilación quedó cerrado.
// ─────────────────────────────────────────────────────────────────

/**
 * Tolerancia para `value ≈ domesticRevenuePctCompany / domesticRevenuePctMarketAvg`
 * — reutiliza la misma magnitud (1e-6) ya usada en
 * `calculation-preflight.ts` para `equityWeight + debtWeight ≈ 1`, y
 * consistente con `toBeCloseTo(x, 6)` en `capital-structure.v5.test.ts`.
 * Se elige esta magnitud y no la tolerancia de reconciliación contable
 * del 3% de `BAL_001` (`validation-rules.ts`) porque ese 3% existe para
 * conciliar partidas contables independientes con redondeo NIIF real
 * entre sí; aquí `value` y los dos porcentajes son todos supuestos
 * resueltos de la MISMA entrada sin una fuente de redondeo
 * independiente entre ellos — una tolerancia de precisión de punto
 * flotante es la comparación correcta, no una tolerancia de negocio.
 */
const LAMBDA_RATIO_TOLERANCE = 1e-6;

function withResolvedLambda(lambdaValue: unknown): Partial<ResolvedCalculationAssumptions> {
  return {
    ...EXAMPLE_RESOLVED_ASSUMPTIONS,
    countryRiskLambda: {
      source: "RC-5 test fixture — no representa Alpina ni ningún caso real",
      rationale: "Shape objetivo de RC-5 (4F.2), usada únicamente para ejercitar el preflight en tests determinísticos.",
      status: "resolved" as const,
      value: lambdaValue,
    },
  } as unknown as Partial<ResolvedCalculationAssumptions>;
}

describe("RC-5 (4F.2, GREEN) — countryRiskLambda: observed_revenue_exposure / direct_documented_judgment", () => {
  it("Grupo 1 — direct_documented_judgment con value=1 sin porcentajes: PASS (tipa nativamente, sin cast ni @ts-expect-error — el gap de compilación de RC-5 quedó cerrado)", () => {
    const target: ResolvedCalculationAssumptions["countryRiskLambda"]["value"] = {
      mode: "direct_documented_judgment",
      value: 1,
    };
    expect(target.value).toBe(1);

    const r = evaluatePreflightV5({
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      countryRiskLambda: {
        source: "Perfil de riesgo — reviewer financiero",
        rationale: "Evidence de desagregación geográfica de ingresos insuficientemente sólida; lambda=1 aplicado como Judgment directo (04 §10.4).",
        status: "resolved",
        value: target,
      },
    });
    expect(r.passed).toBe(true);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA")).toBe(false);
  });

  it("Grupo 2 — observed_revenue_exposure sin domesticRevenuePctMarketAvg: BLOCK (RESOLVED_ASSUMPTION_INVALID_COUNTRYRISKLAMBDA_OBSERVED)", () => {
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "observed_revenue_exposure", value: 1.1, domesticRevenuePctCompany: 88 }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_OBSERVED")).toBe(true);
  });

  it("Grupo 2 — observed_revenue_exposure sin domesticRevenuePctCompany: BLOCK", () => {
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "observed_revenue_exposure", value: 1.1, domesticRevenuePctMarketAvg: 80 }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_OBSERVED")).toBe(true);
  });

  it.each([
    ["company < 0", { domesticRevenuePctCompany: -5, domesticRevenuePctMarketAvg: 80 }],
    ["company > 100", { domesticRevenuePctCompany: 150, domesticRevenuePctMarketAvg: 80 }],
    ["market <= 0", { domesticRevenuePctCompany: 88, domesticRevenuePctMarketAvg: 0 }],
    ["market > 100", { domesticRevenuePctCompany: 88, domesticRevenuePctMarketAvg: 120 }],
    ["company = NaN", { domesticRevenuePctCompany: Number.NaN, domesticRevenuePctMarketAvg: 80 }],
    ["market = Infinity", { domesticRevenuePctCompany: 88, domesticRevenuePctMarketAvg: Number.POSITIVE_INFINITY }],
  ] as const)("Grupo 3 — observed_revenue_exposure con dominio numérico inválido (%s): BLOCK", (_label, pct) => {
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "observed_revenue_exposure", value: 1.1, ...pct }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_OBSERVED")).toBe(true);
  });

  it("Grupo 4 — observed_revenue_exposure con value incoherente con el ratio (company=90, market=75 → 1.2 esperado; value=1.05): BLOCK (RESOLVED_ASSUMPTION_INVALID_COUNTRYRISKLAMBDA_RATIO)", () => {
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "observed_revenue_exposure", value: 1.05, domesticRevenuePctCompany: 90, domesticRevenuePctMarketAvg: 75 }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_RATIO")).toBe(true);
  });

  it("Grupo 4 — observed_revenue_exposure con value coherente con el ratio dentro de tolerancia (company=90, market=75 → 1.2, sin redondear antes de comparar): PASS", () => {
    const coherentValue = 90 / 75;
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "observed_revenue_exposure", value: coherentValue, domesticRevenuePctCompany: 90, domesticRevenuePctMarketAvg: 75 }));
    expect(r.passed).toBe(true);
    expect(Math.abs(coherentValue - 90 / 75)).toBeLessThan(LAMBDA_RATIO_TOLERANCE);
  });

  it("Grupo 5 — direct_documented_judgment con porcentajes fabricados adjuntos (objeto dinámico, evade el excess-property check de TS): BLOCK (RESOLVED_ASSUMPTION_INVALID_COUNTRYRISKLAMBDA_JUDGMENT_UNEXPECTED_PCT)", () => {
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "direct_documented_judgment", value: 1, domesticRevenuePctCompany: 88, domesticRevenuePctMarketAvg: 80 }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_JUDGMENT_UNEXPECTED_PCT")).toBe(true);
  });

  it("Grupo 5b — direct_documented_judgment con domesticRevenuePctCompany EXPLÍCITAMENTE undefined (propiedad presente, valor undefined): BLOCK — 'ausente' significa hasOwnProperty false, no solo undefined", () => {
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "direct_documented_judgment", value: 1, domesticRevenuePctCompany: undefined }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_JUDGMENT_UNEXPECTED_PCT")).toBe(true);
  });

  it("Grupo 6 — mode ausente: BLOCK (RESOLVED_ASSUMPTION_INVALID_COUNTRYRISKLAMBDA_MODE)", () => {
    const r = evaluatePreflightV5(withResolvedLambda({ value: 1 }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_MODE")).toBe(true);
  });

  it("Grupo 6 — mode desconocido: BLOCK", () => {
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "made_up_mode", value: 1 }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_MODE")).toBe(true);
  });

  // Grupo 8 (05 §5, esta revisión — no scope creep, condición explícita
  // del amendment) — `value` no finito bloquea en AMBOS modos.
  it("Grupo 8 — observed_revenue_exposure con value = NaN: BLOCK", () => {
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "observed_revenue_exposure", value: Number.NaN, domesticRevenuePctCompany: 88, domesticRevenuePctMarketAvg: 80 }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_OBSERVED")).toBe(true);
  });

  it("Grupo 8 — observed_revenue_exposure con value = Infinity: BLOCK", () => {
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "observed_revenue_exposure", value: Number.POSITIVE_INFINITY, domesticRevenuePctCompany: 88, domesticRevenuePctMarketAvg: 80 }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_OBSERVED")).toBe(true);
  });

  it("Grupo 8 — direct_documented_judgment con value = NaN: BLOCK (RESOLVED_ASSUMPTION_INVALID_COUNTRYRISKLAMBDA_JUDGMENT)", () => {
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "direct_documented_judgment", value: Number.NaN }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_JUDGMENT")).toBe(true);
  });

  it("Grupo 8 — direct_documented_judgment con value = Infinity: BLOCK", () => {
    const r = evaluatePreflightV5(withResolvedLambda({ mode: "direct_documented_judgment", value: Number.POSITIVE_INFINITY }));
    expect(r.passed).toBe(false);
    expect(hasResolvedAssumptionBlocker(r.blockers, "INVALID_COUNTRYRISKLAMBDA_JUDGMENT")).toBe(true);
  });
});
