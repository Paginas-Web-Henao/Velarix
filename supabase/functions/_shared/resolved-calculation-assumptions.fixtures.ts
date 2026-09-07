// ═══════════════════════════════════════════════════════════════════
// TEST DATA ONLY — NOT CURRENT MARKET DATA — NOT A VALUATION RECOMMENDATION
// ═══════════════════════════════════════════════════════════════════
//
// Bloque 3B — Fixture compartida de ejemplo completo y válido de
// ResolvedCalculationAssumptions, usada por múltiples suites de test
// (preflight, capital structure, working capital, fingerprint,
// versioning, snapshots, consumo del contrato). Deliberadamente en un
// archivo `.fixtures.ts`, no `.test.ts` — mismo patrón que
// `canonical-financial-engine.golden-cases.fixtures.ts` — para que
// importarla no vuelva a registrar los describe()/it() de otro archivo
// de test como efecto secundario.
//
// Todos los valores numéricos son 100% sintéticos, elegidos únicamente
// para ejercitar álgebra determinística en tests — NO representan:
// - la economía colombiana actual;
// - datos vigentes de Damodaran;
// - la tarifa vigente de la DIAN;
// - Alpina ni ningún otro caso real;
// - ninguna recomendación de valoración.
// `source` se declara literalmente como `"SYNTHETIC_TEST_FIXTURE"` en
// cada entrada, precisamente para que no pueda confundirse con
// evidencia real si este archivo se lee fuera de contexto.

import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions";

const SYNTHETIC_SOURCE = "SYNTHETIC_TEST_FIXTURE";

export const EXAMPLE_RESOLVED_ASSUMPTIONS: ResolvedCalculationAssumptions = {
  taxTreatment: {
    // Los tres valores son deliberadamente DISTINTOS entre sí — usar la
    // misma tasa en los tres campos ocultaría exactamente el bug que
    // este fixture existe para exponer (04 §6.3/§6.4/§10.6, Bloque 3B.2).
    value: {
      marginalRatePct: 35, // tasa marginal/largo plazo — valor terminal
      explicitFcffTaxRatePctByYear: [20, 24, 28, 32, 35], // convergencia hacia la marginal, sintética
      debtTaxShieldRatePct: 30, // tasa del tax shield de deuda — distinta de ambas anteriores
    },
    unit: "percent",
    source: SYNTHETIC_SOURCE,
    rationale: "Tres tasas sintéticas y deliberadamente distintas (marginal/path explícito/tax shield de deuda) para ejercitar la separación exigida por 04 §6.3/§6.4/§10.6 en tests determinísticos — no representan ninguna jurisdicción ni empresa real.",
    status: "resolved",
    date: "2000-01-01",
  },
  capitalStructure: {
    value: { equityWeight: 0.6, debtWeight: 0.4, structureSource: "comparables" },
    unit: "composite",
    source: SYNTHETIC_SOURCE,
    rationale: "Weights sintéticos elegidos para ejercitar la fórmula de WACC/Hamada en tests determinísticos — no representan ninguna estructura de capital real observada.",
    status: "resolved",
  },
  riskFreeRateConstruction: {
    value: { referenceCurrencyRatePct: 4.0, inflationDifferentialPct: 4.0, localRatePct: 8.11 },
    unit: "percent",
    source: SYNTHETIC_SOURCE,
    rationale: "Valores sintéticos elegidos para ejercitar la relación de Fisher en tests determinísticos — no son datos de mercado vigentes.",
    status: "resolved",
  },
  matureErp: { value: { valuePct: 4.23 }, unit: "percent", source: SYNTHETIC_SOURCE, rationale: "Valor sintético elegido para ejercitar el término β×ERP de CAPM en tests determinísticos — no es un dato de mercado vigente.", status: "resolved" },
  countryRiskPremium: { value: { valuePct: 2.85 }, unit: "percent", source: SYNTHETIC_SOURCE, rationale: "Valor sintético elegido para ejercitar el término λ×CRP de CAPM en tests determinísticos — no es un dato de mercado vigente.", status: "resolved" },
  countryRiskLambda: {
    value: { mode: "observed_revenue_exposure", value: 1.1, domesticRevenuePctCompany: 88, domesticRevenuePctMarketAvg: 80 },
    source: SYNTHETIC_SOURCE,
    rationale: "Valores sintéticos elegidos para ejercitar el escalamiento de CRP en tests determinísticos — no describen ninguna empresa real.",
    status: "resolved",
  },
  betaTreatment: {
    value: { unleveredBeta: 0.78, releveringMethod: "hamada" },
    source: SYNTHETIC_SOURCE,
    rationale: "Beta desapalancado sintético elegido para ejercitar el reapalancamiento Hamada en tests determinísticos — no proviene de ningún comparable real.",
    status: "resolved",
  },
  costOfDebt: { value: { valuePct: 9.5, hierarchy: "spread_estimate" }, unit: "percent", source: SYNTHETIC_SOURCE, rationale: "Valor sintético elegido para ejercitar el tax shield de deuda en tests determinísticos — no es un costo de deuda real observado.", status: "resolved" },
  capexReinvestmentDriver: {
    value: { mode: "percent_of_revenue", capexPctOfRevenue: 4.5 },
    unit: "percent",
    source: SYNTHETIC_SOURCE,
    rationale: "Valor sintético elegido para ejercitar el driver de CAPEX en tests determinísticos — no proviene de ningún histórico real.",
    status: "resolved",
  },
  depreciationDaDriver: {
    value: { mode: "percent_of_revenue", daPctOfRevenue: 3.2 },
    unit: "percent",
    source: SYNTHETIC_SOURCE,
    rationale: "Valor sintético elegido para ejercitar el driver de D&A en tests determinísticos — no proviene de ningún histórico real.",
    status: "resolved",
  },
  workingCapitalDriver: {
    value: { explicitDeltaNwcByYear: [12_000_000, 13_500_000, 9_800_000, 11_200_000, 10_500_000] },
    source: SYNTHETIC_SOURCE,
    rationale: "Valores sintéticos, deliberadamente no proporcionales entre sí ni a revenue, elegidos para probar que el motor los consume literalmente en tests determinísticos — no describen el capital de trabajo de ninguna empresa real.",
    status: "resolved",
  },
  terminalG: { value: { valuePct: 3.5, pessimisticScenarioPct: 2.0, optimisticScenarioPct: 4.5 }, unit: "percent", source: SYNTHETIC_SOURCE, rationale: "Valor sintético elegido para ejercitar el valor terminal (Gordon Growth) en tests determinísticos — no es una tasa de crecimiento de largo plazo real de ningún sector.", status: "resolved" },
  projectionHorizonYears: { value: { years: 5, convergenceJudgmentNotes: "Valor sintético — 5 es además el único horizonte que el motor soporta hoy." }, unit: "years", source: SYNTHETIC_SOURCE, rationale: "Coincide con la única capacidad actual del motor; no es un juicio de convergencia sobre ninguna empresa real.", status: "resolved" },
};
