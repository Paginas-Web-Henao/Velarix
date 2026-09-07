// Bloque 3B (tests-first) + Bloque 3C.2 (RC-1/RC-2) + Bloque 3C.3 (RC-3) —
// signo de equity, capital structure v5 vs. legacy, y consumo completo de
// Ke/WACC/Hamada vía `resolvedAssumptions`,
// docs/velarix-v5/05-financial-engine-audit.md v1.3 §4/§6/§7.
//
// Llaman a las funciones REALES de producción
// (`resolveEffectiveEquity`, `computeCapitalStructure`) — nunca
// reimplementan su lógica. Bloque 3C.2 implementó RC-1/RC-2; Bloque 3C.3
// implementó RC-3 (Ke/WACC/Hamada completos, sección más abajo) — todos
// los `it.fails` de este archivo pasaron a `it`, verificados uno por uno
// contra la fórmula correcta antes de convertirlos.

import { describe, it, expect } from "vitest";
import { resolveEffectiveEquity } from "./canonical-input-normalization";
import { computeCapitalStructure, type CapitalStructureInput } from "./capital-structure";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";

const BASE_CAPM: Omit<CapitalStructureInput, "totalDebt" | "cash" | "equity"> = {
  sectorBetaUnlevered: 1.0,
  taxRatePct: 30,
  costOfDebtPct: 8,
  riskFreeRatePct: 4.35,
  erpPct: 5.80,
};

// Bloque 3C.2 — el describe "HOY" que documentaba `Math.abs()` destruyendo
// el signo se retira: ese comportamiento ya no existe en producción
// (RC-1 corregido) y preservarlo como caracterización sería preservar el
// bug, no documentarlo (docs/velarix-v5/05-financial-engine-audit.md v1.3 §4).

describe("RC-1 — resolveEffectiveEquity — V5 OBJETIVO", () => {
  it("1. equity positivo: se preserva sin alterar", () => {
    expect(resolveEffectiveEquity({ equity: 500_000_000 })).toBe(500_000_000);
  });

  it("2. equity = 0 observado: se preserva exactamente 0 — no es 'ausente'", () => {
    expect(resolveEffectiveEquity({ equity: 0 })).toBe(0);
  });

  it("3. equity negativo: se preserva el signo negativo — Decisión 6, 04 §3.2, vinculante", () => {
    expect(resolveEffectiveEquity({ equity: -500_000_000 })).toBe(-500_000_000);
  });

  it("4. equity: null (observado explícitamente como no disponible): nunca se fabrica 0", () => {
    expect(resolveEffectiveEquity({ equity: null })).toBeNull();
  });

  it("5. equity: undefined (presente en el objeto pero sin valor): nunca se fabrica 0", () => {
    expect(resolveEffectiveEquity({ equity: undefined })).toBeNull();
  });

  it("6. propiedad equity ausente por completo del balance_sheet: nunca se fabrica 0", () => {
    expect(resolveEffectiveEquity({})).toBeNull();
  });

  it("7. fallback a total_equity SOLO cuando equity realmente no fue observado, preservando también su signo", () => {
    expect(resolveEffectiveEquity({ total_equity: -800_000_000 })).toBe(-800_000_000);
    expect(resolveEffectiveEquity({ equity: null, total_equity: -800_000_000 })).toBe(-800_000_000);
    // equity=0 observado es un valor final — NUNCA cae a total_equity, aunque total_equity esté presente.
    expect(resolveEffectiveEquity({ equity: 0, total_equity: -800_000_000 })).toBe(0);
  });
});

describe("Zero observado ≠ missing — distinción preservada por resolveEffectiveEquity (no solo por el preflight)", () => {
  it("equity=0 observado y equity ausente ya NO producen el mismo valor normalizado — 0 real vs. null", () => {
    expect(resolveEffectiveEquity({ equity: 0 })).toBe(0);
    expect(resolveEffectiveEquity({})).toBeNull();
    expect(resolveEffectiveEquity({ equity: 0 })).not.toBe(resolveEffectiveEquity({}));
  });

  it("distinguible también con Object.is (0 vs. null nunca son el mismo valor, a diferencia de -0 vs. 0)", () => {
    expect(Object.is(resolveEffectiveEquity({ equity: 0 }), resolveEffectiveEquity({}))).toBe(false);
  });
});

describe("RC-2 — computeCapitalStructure — LEGACY (sin resolvedAssumptions, verde — compatibilidad con golden cases, 05 v1.3 §4)", () => {
  it("equity > 0 deriva equityWeight de book equity/deuda (comportamiento legacy sin cambios)", () => {
    const r = computeCapitalStructure({ ...BASE_CAPM, totalDebt: 4_000_000_000, cash: 50_000_000, equity: 500_000_000 });
    expect(r.equityWeight).toBeCloseTo(500_000_000 / (500_000_000 + 4_000_000_000), 6);
  });

  it("equity = 0 cae al fallback 70/30 (comportamiento legacy sin cambios)", () => {
    const r = computeCapitalStructure({ ...BASE_CAPM, totalDebt: 4_000_000_000, cash: 50_000_000, equity: 0 });
    expect(r.equityWeight).toBe(0.70);
  });

  it("equity ausente (null) cae al mismo fallback 70/30 que equity=0 — comportamiento legacy sin cambios (no es una ejecución v5, no se bloquea aquí)", () => {
    const r = computeCapitalStructure({ ...BASE_CAPM, totalDebt: 4_000_000_000, cash: 50_000_000, equity: null });
    expect(r.equityWeight).toBe(0.70);
  });

  it("equity negativo real, SIN resolvedAssumptions (ninguna ejecución v5 anunciada): reproduce el comportamiento mecánico histórico — nunca 'requiere juicio', nunca NaN. La compatibilidad legacy está explícitamente autorizada por 05 v1.3 §4, incluso tras corregir RC-1 en Evidence", () => {
    const r = computeCapitalStructure({ ...BASE_CAPM, totalDebt: 4_000_000_000, cash: 50_000_000, equity: -500_000_000 });
    // Paridad exacta con el cálculo histórico: antes de RC-1, `Math.abs()`
    // ya convertía el equity a +500_000_000 ANTES de llegar aquí, así que
    // el resultado histórico era equivalente a invocar con +500_000_000.
    const asHistoricallyComputed = computeCapitalStructure({ ...BASE_CAPM, totalDebt: 4_000_000_000, cash: 50_000_000, equity: 500_000_000 });
    expect(r.equityWeight).toBeCloseTo(asHistoricallyComputed.equityWeight, 10);
    expect(r.waccPct).toBeCloseTo(asHistoricallyComputed.waccPct, 10);
    expect(Number.isNaN(r.equityWeight)).toBe(false);
    expect(Number.isNaN(r.waccPct)).toBe(false);
    // El book equity de Evidence preservado por el resultado SÍ conserva el signo real — solo el cálculo mecánico de weights usa la compatibilidad local.
    expect(r.bookEquityReference).toBe(-500_000_000);
  });
});

describe("RC-2 — computeCapitalStructure — V5 OBJETIVO", () => {
  const resolvedCS = EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure.value; // equityWeight 0.6 / debtWeight 0.4 / comparables

  it("con resolvedAssumptions.capitalStructure presente y equity positivo, usa los weights resueltos — NO los derivados de book equity", () => {
    const r = computeCapitalStructure({
      ...BASE_CAPM,
      totalDebt: 4_000_000_000,
      cash: 50_000_000,
      equity: 3_000_000_000, // book equity positivo — el legacy lo usaría para derivar equityWeight
      resolvedAssumptions: EXAMPLE_RESOLVED_ASSUMPTIONS,
    });
    expect(r.equityWeight).toBeCloseTo(resolvedCS.equityWeight, 6);
    expect(r.equityWeight).not.toBeCloseTo(3_000_000_000 / (3_000_000_000 + 4_000_000_000), 3);
  });

  it("con resolvedAssumptions.capitalStructure presente y equity = 0, usa los weights resueltos — NUNCA el fallback 70/30 silencioso", () => {
    const r = computeCapitalStructure({
      ...BASE_CAPM,
      totalDebt: 4_000_000_000,
      cash: 50_000_000,
      equity: 0,
      resolvedAssumptions: EXAMPLE_RESOLVED_ASSUMPTIONS,
    });
    expect(r.equityWeight).toBeCloseTo(resolvedCS.equityWeight, 6);
    expect(r.equityWeight).not.toBe(0.70);
  });

  it("con resolvedAssumptions.capitalStructure presente y equity negativo real (signo preservado), usa los weights resueltos — sin Hamada mecánica sobre book D/E negativo", () => {
    const r = computeCapitalStructure({
      ...BASE_CAPM,
      totalDebt: 4_000_000_000,
      cash: 50_000_000,
      equity: -500_000_000, // signo preservado (RC-1 ya corregido en este escenario objetivo)
      resolvedAssumptions: EXAMPLE_RESOLVED_ASSUMPTIONS,
    });
    expect(r.equityWeight).toBeCloseTo(resolvedCS.equityWeight, 6);
    expect(r.equityWeight).not.toBe(0.70);
    expect(Number.isFinite(r.betaLevered)).toBe(true);
  });

  it("ejecución v5 anunciada (clave resolvedAssumptions presente) pero SIN capitalStructure resuelto: lanza explícitamente — nunca calcula silenciosamente vía book D/E, vía 70/30, ni produce NaN. El preflight v5 (calculation-preflight.ts) debe bloquear esto antes de llegar al motor; llegar aquí de todos modos es un estado inválido, no un resultado a fabricar", () => {
    expect(() =>
      computeCapitalStructure({
        ...BASE_CAPM,
        totalDebt: 4_000_000_000,
        cash: 50_000_000,
        equity: -500_000_000,
        resolvedAssumptions: undefined, // clave PRESENTE (anuncia v5), valor sin resolver — igual que un preflight v5 que no debería haber dejado pasar esto
      }),
    ).toThrow(/capitalStructure resuelto/);
  });

  it("misma señal defensiva con resolvedAssumptions parcial (capitalStructure ausente de un objeto por lo demás con forma de ResolvedCalculationAssumptions)", () => {
    expect(() =>
      computeCapitalStructure({
        ...BASE_CAPM,
        totalDebt: 4_000_000_000,
        cash: 50_000_000,
        equity: 3_000_000_000, // el signo/valor de equity es irrelevante aquí — la señal depende solo de la ausencia de capitalStructure resuelto en un contexto v5 anunciado
        resolvedAssumptions: {} as any,
      }),
    ).toThrow(/capitalStructure resuelto/);
  });

  it("book equity (positivo, cero o negativo) se conserva siempre como referencia/sanity check en el resultado, nunca se descarta — la referencia viene del parámetro `equity` de Evidence, NUNCA de resolvedAssumptions (Bloque 3B.1: capitalStructure ya no transporta book equity, es puro Judgment)", () => {
    const r = computeCapitalStructure({
      ...BASE_CAPM,
      totalDebt: 4_000_000_000,
      cash: 50_000_000,
      equity: 3_000_000_000,
      resolvedAssumptions: EXAMPLE_RESOLVED_ASSUMPTIONS,
    });
    // Debe reflejar el `equity` de Evidence recibido como parámetro, no ningún campo de resolvedAssumptions.
    expect(r.bookEquityReference).toBe(3_000_000_000);
  });
});

// ─────────────────────────────────────────────────────────────────
// RC-3 — Consumo real de los componentes de Ke/WACC (Bloque 3B.1, §3).
//
// Metodología congelada (04 §10, 05 v1.3 §7):
//   Ke = Rf_local + βL × ERP_mature + λ × CRP
//   βL = unleveredBeta × (1 + (1-T) × D/E)                    [Hamada]
//   Kd_after_tax = Kd × (1-T)
//   WACC = Ke × E/(D+E) + Kd_after_tax × D/(D+E)
//
// `computeTargetCapm` es un helper de TEST (no producción) que implementa
// exactamente esta fórmula — sirve como especificación ejecutable para
// comparar contra `computeCapitalStructure`, que hoy usa un único
// `erpPct` fusionado y un beta derivado mecánicamente del D/E de book
// equity, ignorando el resto de resolvedAssumptions. Cada test aísla UNA
// variable resuelta y verifica (a) que la magnitud del cambio en el
// propio helper coincide con la fórmula (sanity del helper, siempre
// verde) y (b) que `computeCapitalStructure` debería reflejar ese mismo
// valor una vez implementado RC-3 (rojo hoy).
// ─────────────────────────────────────────────────────────────────

import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions";

/**
 * Bloque 3B.2: la tasa que gobierna tanto el reapalancamiento de Hamada
 * como el tax shield de `Kd×(1-T)` es `debtTaxShieldRatePct` — NO
 * `marginalRatePct` (04 §10.6: "la tasa económicamente relevante para
 * la deducibilidad del interés y la capacidad real de utilizar ese
 * beneficio fiscal", no la tasa marginal de largo plazo del NOPAT ni el
 * path fiscal del horizonte explícito). Ambos usos (Hamada y Kd
 * after-tax) tratan la misma pregunta económica — el efecto fiscal de
 * la deuda — así que deben usar la misma tasa entre sí, y esa tasa es
 * explícitamente distinta de la que gobierna el NOPAT (ver
 * canonical-financial-engine.consumption.v5.test.ts, sección Tax).
 */
function computeTargetCapm(resolved: ResolvedCalculationAssumptions) {
  const { equityWeight, debtWeight } = resolved.capitalStructure.value;
  const deRatio = debtWeight / equityWeight;
  const debtTaxShieldT = resolved.taxTreatment.value.debtTaxShieldRatePct / 100;
  const betaLevered = resolved.betaTreatment.value.unleveredBeta * (1 + (1 - debtTaxShieldT) * deRatio);
  const rfLocal = resolved.riskFreeRateConstruction.value.localRatePct;
  const matureErp = resolved.matureErp.value.valuePct;
  const crp = resolved.countryRiskPremium.value.valuePct;
  const lambda = resolved.countryRiskLambda.value.value;
  const ke = rfLocal + betaLevered * matureErp + lambda * crp;
  const kdAfterTax = resolved.costOfDebt.value.valuePct * (1 - debtTaxShieldT);
  const wacc = ke * equityWeight + kdAfterTax * debtWeight;
  return { betaLevered, ke, kdAfterTax, wacc };
}

function withCapm(resolved: ResolvedCalculationAssumptions) {
  return computeCapitalStructure({
    ...BASE_CAPM,
    totalDebt: 4_000_000_000,
    cash: 50_000_000,
    equity: 3_000_000_000,
    resolvedAssumptions: resolved,
  });
}

describe("RC-3 — consumo de componentes de Ke/WACC — V5 OBJETIVO", () => {
  const base = EXAMPLE_RESOLVED_ASSUMPTIONS;
  const baseTarget = computeTargetCapm(base);

  it("baseline: computeCapitalStructure debería reproducir Ke/WACC objetivo con los 7 componentes resueltos", () => {
    const r = withCapm(base);
    expect(r.costOfEquityPct).toBeCloseTo(baseTarget.ke, 6);
    expect(r.waccPct).toBeCloseTo(baseTarget.wacc, 6);
  });

  it("Risk-free: cambiar únicamente el risk-free local resuelto cambia Ke 1:1 (coeficiente 1 en la fórmula)", () => {
    const modified: ResolvedCalculationAssumptions = {
      ...base,
      riskFreeRateConstruction: { ...base.riskFreeRateConstruction, value: { ...base.riskFreeRateConstruction.value, localRatePct: base.riskFreeRateConstruction.value.localRatePct + 1 } },
    };
    const modifiedTarget = computeTargetCapm(modified);
    expect(modifiedTarget.ke - baseTarget.ke).toBeCloseTo(1, 6); // sanity del helper
    const r = withCapm(modified);
    expect(r.costOfEquityPct).toBeCloseTo(modifiedTarget.ke, 6);
  });

  it("Mature ERP: cambiar únicamente mature ERP cambia Ke según βL × ΔERP", () => {
    const deltaErp = 1;
    const modified: ResolvedCalculationAssumptions = {
      ...base,
      matureErp: { ...base.matureErp, value: { valuePct: base.matureErp.value.valuePct + deltaErp } },
    };
    const modifiedTarget = computeTargetCapm(modified);
    expect(modifiedTarget.ke - baseTarget.ke).toBeCloseTo(baseTarget.betaLevered * deltaErp, 6); // sanity del helper
    const r = withCapm(modified);
    expect(r.costOfEquityPct).toBeCloseTo(modifiedTarget.ke, 6);
  });

  it("CRP: cambiar únicamente el country risk premium cambia Ke según λ × ΔCRP", () => {
    const deltaCrp = 1;
    const modified: ResolvedCalculationAssumptions = {
      ...base,
      countryRiskPremium: { ...base.countryRiskPremium, value: { valuePct: base.countryRiskPremium.value.valuePct + deltaCrp } },
    };
    const modifiedTarget = computeTargetCapm(modified);
    expect(modifiedTarget.ke - baseTarget.ke).toBeCloseTo(base.countryRiskLambda.value.value * deltaCrp, 6); // sanity del helper
    const r = withCapm(modified);
    expect(r.costOfEquityPct).toBeCloseTo(modifiedTarget.ke, 6);
  });

  it("Lambda: cambiar únicamente lambda cambia Ke según CRP × Δλ", () => {
    const deltaLambda = 0.2;
    const modified: ResolvedCalculationAssumptions = {
      ...base,
      countryRiskLambda: { ...base.countryRiskLambda, value: { ...base.countryRiskLambda.value, value: base.countryRiskLambda.value.value + deltaLambda } },
    };
    const modifiedTarget = computeTargetCapm(modified);
    expect(modifiedTarget.ke - baseTarget.ke).toBeCloseTo(base.countryRiskPremium.value.valuePct * deltaLambda, 6); // sanity del helper
    const r = withCapm(modified);
    expect(r.costOfEquityPct).toBeCloseTo(modifiedTarget.ke, 6);
  });

  // RC-5 (4F.2, control — NO es RED): `computeCapitalStructure` solo lee
  // `countryRiskLambda.value.value` (capital-structure.ts:123) — nunca
  // domesticRevenuePctCompany/domesticRevenuePctMarketAvg. Este test
  // demuestra que eso YA es cierto hoy y debe seguir siéndolo tras el
  // GREEN de RC-5: Calculation es indiferente al modo de derivación de
  // lambda (`observed_revenue_exposure` vs. `direct_documented_judgment`,
  // docs/velarix-v5/04 §10.4 enmendado) — el motor no interpreta
  // metodología (`04 §17`). El tipo actual no permite la forma
  // `direct_documented_judgment` como literal (RC-5, ver
  // calculation-preflight.v5.test.ts para el mismo gap) — cada
  // asignación de `value` usa `@ts-expect-error`, explícito y limitado
  // a este test, sin tocar `resolved-calculation-assumptions.ts`.
  it("Lambda (RC-5, control) — countryRiskLambda en modo direct_documented_judgment: Ke cambia según CRP × Δλ igual que en modo observed_revenue_exposure — Calculation no interpreta el modo", () => {
    const deltaLambda = 0.2;
    const directJudgmentBase: ResolvedCalculationAssumptions = {
      ...base,
      countryRiskLambda: {
        ...base.countryRiskLambda,
        // @ts-expect-error RC-5 (4F.2): forma objetivo (mode: "direct_documented_judgment", sin porcentajes) — el tipo actual de countryRiskLambda.value no la permite todavía. Debe dejar de necesitar @ts-expect-error solo cuando el GREEN de RC-5 se implemente.
        value: { mode: "direct_documented_judgment", value: base.countryRiskLambda.value.value },
      },
    };
    const directJudgmentModified: ResolvedCalculationAssumptions = {
      ...directJudgmentBase,
      countryRiskLambda: {
        ...directJudgmentBase.countryRiskLambda,
        // @ts-expect-error RC-5 (4F.2): misma razón que arriba.
        value: { mode: "direct_documented_judgment", value: base.countryRiskLambda.value.value + deltaLambda },
      },
    };
    const baseTargetDirect = computeTargetCapm(directJudgmentBase);
    const modifiedTargetDirect = computeTargetCapm(directJudgmentModified);
    expect(modifiedTargetDirect.ke - baseTargetDirect.ke).toBeCloseTo(base.countryRiskPremium.value.valuePct * deltaLambda, 6); // sanity del helper, igual que el test "Lambda" de arriba
    const rBase = withCapm(directJudgmentBase);
    const rModified = withCapm(directJudgmentModified);
    expect(rModified.costOfEquityPct - rBase.costOfEquityPct).toBeCloseTo(modifiedTargetDirect.ke - baseTargetDirect.ke, 6);
  });

  it("Beta: cambiar únicamente unleveredBeta recompone betaLevered vía Hamada usando la estructura resuelta, y por tanto Ke — nunca un leveredBeta independiente (contrato ya no lo permite, ver resolved-calculation-assumptions.test.ts)", () => {
    const modified: ResolvedCalculationAssumptions = {
      ...base,
      betaTreatment: { ...base.betaTreatment, value: { ...base.betaTreatment.value, unleveredBeta: base.betaTreatment.value.unleveredBeta + 0.1 } },
    };
    const modifiedTarget = computeTargetCapm(modified);
    expect(modifiedTarget.betaLevered).not.toBeCloseTo(baseTarget.betaLevered, 6); // sanity del helper
    const r = withCapm(modified);
    expect(r.betaLevered).toBeCloseTo(modifiedTarget.betaLevered, 6);
    expect(r.costOfEquityPct).toBeCloseTo(modifiedTarget.ke, 6);
  });

  it("Cost of debt: cambiar únicamente Kd resuelto cambia costOfDebtAfterTax y el componente de deuda del WACC", () => {
    const modified: ResolvedCalculationAssumptions = {
      ...base,
      costOfDebt: { ...base.costOfDebt, value: { ...base.costOfDebt.value, valuePct: base.costOfDebt.value.valuePct + 1 } },
    };
    const modifiedTarget = computeTargetCapm(modified);
    expect(modifiedTarget.kdAfterTax - baseTarget.kdAfterTax).toBeCloseTo(1 * (1 - base.taxTreatment.value.debtTaxShieldRatePct / 100), 6); // sanity del helper
    const r = withCapm(modified);
    expect(r.costOfDebtAfterTaxPct).toBeCloseTo(modifiedTarget.kdAfterTax, 6);
    expect(r.waccPct).toBeCloseTo(modifiedTarget.wacc, 6);
  });

  it("Capital structure: cambiar únicamente los weights resueltos cambia WACC (y betaLevered vía D/E), usando esos weights — sin depender del book equity", () => {
    const modified: ResolvedCalculationAssumptions = {
      ...base,
      capitalStructure: { ...base.capitalStructure, value: { equityWeight: 0.8, debtWeight: 0.2, structureSource: "target" } },
    };
    const modifiedTarget = computeTargetCapm(modified);
    expect(modifiedTarget.wacc).not.toBeCloseTo(baseTarget.wacc, 3); // sanity del helper
    const r = withCapm(modified);
    expect(r.equityWeight).toBeCloseTo(0.8, 6);
    expect(r.waccPct).toBeCloseTo(modifiedTarget.wacc, 6);
    // El book equity (3_000_000_000) es idéntico al del baseline — el cambio de WACC viene solo del Judgment, no de Evidence.
  });
});
