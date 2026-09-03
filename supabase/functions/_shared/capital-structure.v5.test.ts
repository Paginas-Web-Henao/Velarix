// Bloque 3B — Tests-first de RC-1 (signo de equity) + RC-2 (capital
// structure no debe depender de book equity en una ejecución v5),
// docs/velarix-v5/05-financial-engine-audit.md v1.3 §4.
//
// Llaman a las funciones REALES de producción
// (`resolveEffectiveEquity`, `computeCapitalStructure`) — nunca
// reimplementan su lógica. No se modifica canonical-input-normalization.ts
// ni capital-structure.ts en este bloque.

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

describe("RC-1 — resolveEffectiveEquity — HOY (caracterización, verde)", () => {
  it("Math.abs() destruye el signo negativo hoy — comportamiento actual confirmado", () => {
    expect(resolveEffectiveEquity({ equity: -500_000_000 })).toBe(500_000_000);
  });
});

describe("RC-1 — resolveEffectiveEquity — V5 OBJETIVO (rojo esperado)", () => {
  it.fails("debe preservar el signo negativo de equity — Decisión 6, 04 §3.2, vinculante", () => {
    expect(resolveEffectiveEquity({ equity: -500_000_000 })).toBe(-500_000_000);
  });

  it("debe preservar equity positivo sin alterarlo (esto ya funciona hoy — no debe romperse al corregir el signo)", () => {
    expect(resolveEffectiveEquity({ equity: 500_000_000 })).toBe(500_000_000);
  });

  it("debe preservar equity observado en cero como 0 — no es 'ausente'", () => {
    expect(resolveEffectiveEquity({ equity: 0 })).toBe(0);
  });
});

describe("Book equity ausente — ya manejado correctamente aguas arriba (preflight), no por resolveEffectiveEquity", () => {
  it("equity ausente y equity=0 producen hoy el mismo valor normalizado (0) en esta capa — la distinción 'ausente vs. cero' vive en el preflight (isObserved sobre el valor crudo), no aquí; ver calculation-preflight.test.ts test 5-6", () => {
    expect(resolveEffectiveEquity({})).toBe(resolveEffectiveEquity({ equity: 0 }));
  });
});

describe("RC-2 — computeCapitalStructure — LEGACY (sin resolvedAssumptions, verde — compatibilidad con golden cases)", () => {
  it("equity > 0 deriva equityWeight de book equity/deuda (comportamiento legacy sin cambios)", () => {
    const r = computeCapitalStructure({ ...BASE_CAPM, totalDebt: 4_000_000_000, cash: 50_000_000, equity: 500_000_000 });
    expect(r.equityWeight).toBeCloseTo(500_000_000 / (500_000_000 + 4_000_000_000), 6);
  });

  it("equity <= 0 (incluyendo el resultado post-Math.abs de un equity negativo real) cae al fallback 70/30 (comportamiento legacy sin cambios)", () => {
    const r = computeCapitalStructure({ ...BASE_CAPM, totalDebt: 4_000_000_000, cash: 50_000_000, equity: 0 });
    expect(r.equityWeight).toBe(0.70);
  });
});

describe("RC-2 — computeCapitalStructure — V5 OBJETIVO (rojo esperado hasta implementar RC-2/RC-3)", () => {
  const resolvedCS = EXAMPLE_RESOLVED_ASSUMPTIONS.capitalStructure.value; // equityWeight 0.6 / debtWeight 0.4 / comparables

  it.fails("con resolvedAssumptions.capitalStructure presente y equity positivo, usa los weights resueltos — NO los derivados de book equity", () => {
    const r = computeCapitalStructure({
      ...BASE_CAPM,
      totalDebt: 4_000_000_000,
      cash: 50_000_000,
      equity: 3_000_000_000, // book equity positivo — el legacy lo usaría para derivar equityWeight
      resolvedAssumptions: EXAMPLE_RESOLVED_ASSUMPTIONS,
    } as any);
    expect(r.equityWeight).toBeCloseTo(resolvedCS.equityWeight, 6);
    expect(r.equityWeight).not.toBeCloseTo(3_000_000_000 / (3_000_000_000 + 4_000_000_000), 3);
  });

  it.fails("con resolvedAssumptions.capitalStructure presente y equity = 0, usa los weights resueltos — NUNCA el fallback 70/30 silencioso", () => {
    const r = computeCapitalStructure({
      ...BASE_CAPM,
      totalDebt: 4_000_000_000,
      cash: 50_000_000,
      equity: 0,
      resolvedAssumptions: EXAMPLE_RESOLVED_ASSUMPTIONS,
    } as any);
    expect(r.equityWeight).toBeCloseTo(resolvedCS.equityWeight, 6);
    expect(r.equityWeight).not.toBe(0.70);
  });

  it.fails("con resolvedAssumptions.capitalStructure presente y equity negativo real (signo preservado), usa los weights resueltos — sin Hamada mecánica sobre book D/E negativo", () => {
    const r = computeCapitalStructure({
      ...BASE_CAPM,
      totalDebt: 4_000_000_000,
      cash: 50_000_000,
      equity: -500_000_000, // signo preservado (RC-1 ya corregido en este escenario objetivo)
      resolvedAssumptions: EXAMPLE_RESOLVED_ASSUMPTIONS,
    } as any);
    expect(r.equityWeight).toBeCloseTo(resolvedCS.equityWeight, 6);
    expect(r.equityWeight).not.toBe(0.70);
    expect(Number.isFinite(r.betaLevered)).toBe(true);
  });

  it.fails("con equity negativo real y SIN resolvedAssumptions.capitalStructure, el motor debe señalar que se requiere juicio explícito — nunca calcular silenciosamente vía book D/E ni vía 70/30", () => {
    const r = computeCapitalStructure({
      ...BASE_CAPM,
      totalDebt: 4_000_000_000,
      cash: 50_000_000,
      equity: -500_000_000,
    } as any);
    // Campo objetivo (05 v1.3 §8) — no existe todavía en CapitalStructureResult.
    expect((r as any).requiresCapitalStructureJudgment).toBe(true);
    expect(r.equityWeight).not.toBe(0.70);
  });

  it.fails("book equity (positivo, cero o negativo) se conserva siempre como referencia/sanity check en el resultado, nunca se descarta — la referencia viene del parámetro `equity` de Evidence, NUNCA de resolvedAssumptions (Bloque 3B.1: capitalStructure ya no transporta book equity, es puro Judgment)", () => {
    const r = computeCapitalStructure({
      ...BASE_CAPM,
      totalDebt: 4_000_000_000,
      cash: 50_000_000,
      equity: 3_000_000_000,
      resolvedAssumptions: EXAMPLE_RESOLVED_ASSUMPTIONS,
    } as any);
    // Campo objetivo (05 v1.3 §4) — no existe todavía en CapitalStructureResult.
    // Debe reflejar el `equity` de Evidence recibido como parámetro, no ningún campo de resolvedAssumptions.
    expect((r as any).bookEquityReference).toBe(3_000_000_000);
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
  } as any);
}

describe("RC-3 — consumo de componentes de Ke/WACC — V5 OBJETIVO (rojo esperado hasta implementar RC-3)", () => {
  const base = EXAMPLE_RESOLVED_ASSUMPTIONS;
  const baseTarget = computeTargetCapm(base);

  it.fails("baseline: computeCapitalStructure debería reproducir Ke/WACC objetivo con los 7 componentes resueltos", () => {
    const r = withCapm(base);
    expect(r.costOfEquityPct).toBeCloseTo(baseTarget.ke, 6);
    expect(r.waccPct).toBeCloseTo(baseTarget.wacc, 6);
  });

  it.fails("Risk-free: cambiar únicamente el risk-free local resuelto cambia Ke 1:1 (coeficiente 1 en la fórmula)", () => {
    const modified: ResolvedCalculationAssumptions = {
      ...base,
      riskFreeRateConstruction: { ...base.riskFreeRateConstruction, value: { ...base.riskFreeRateConstruction.value, localRatePct: base.riskFreeRateConstruction.value.localRatePct + 1 } },
    };
    const modifiedTarget = computeTargetCapm(modified);
    expect(modifiedTarget.ke - baseTarget.ke).toBeCloseTo(1, 6); // sanity del helper
    const r = withCapm(modified);
    expect(r.costOfEquityPct).toBeCloseTo(modifiedTarget.ke, 6);
  });

  it.fails("Mature ERP: cambiar únicamente mature ERP cambia Ke según βL × ΔERP", () => {
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

  it.fails("CRP: cambiar únicamente el country risk premium cambia Ke según λ × ΔCRP", () => {
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

  it.fails("Lambda: cambiar únicamente lambda cambia Ke según CRP × Δλ", () => {
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

  it.fails("Beta: cambiar únicamente unleveredBeta recompone betaLevered vía Hamada usando la estructura resuelta, y por tanto Ke — nunca un leveredBeta independiente (contrato ya no lo permite, ver resolved-calculation-assumptions.test.ts)", () => {
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

  it.fails("Cost of debt: cambiar únicamente Kd resuelto cambia costOfDebtAfterTax y el componente de deuda del WACC", () => {
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

  it.fails("Capital structure: cambiar únicamente los weights resueltos cambia WACC (y betaLevered vía D/E), usando esos weights — sin depender del book equity", () => {
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
