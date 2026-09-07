// Velarix v5 — FASE 4F.3. Primer objeto REAL, case-specific, de las 13
// `ResolvedCalculationAssumptions` (docs/velarix-v5/05-financial-engine-audit.md
// §6, contrato post-RC-5). NO es un fixture sintético — a diferencia de
// `resolved-calculation-assumptions.fixtures.ts` (`SYNTHETIC_TEST_FIXTURE`,
// usado para ejercitar álgebra en tests), este archivo transporta Judgment
// y Evidence reales del caso Alpina, ya cerrados por el reviewer financiero
// en fases previas (4B–4F.1). Vive en `_shared` (no en `src/` ni en un
// fixture de test) porque debe poder consumirse tanto desde Vitest como
// desde el flujo real de Deno (`ejecutar-calculo`) en 4F.4/4F.5, sin
// mezclarse con datos sintéticos ni con lógica universal del motor.
//
// Caso — Expediente de Valoración:
// - Subject: 100% del economic equity de Alpina Productos Alimenticios
//   S.A.S. BIC.
// - Basis of value: Market Value (IVS 102). Investment Value/Worth
//   descartado — no existe comprador/tenedor particular con expectativas
//   o sinergias específicas.
// - Valuation date: 2024-12-31 (coincide con el cierre del período base,
//   Evidence FY2024 standalone).
// - Architecture: PARENT_DCF_PLUS_SOTP. Este archivo cubre ÚNICAMENTE el
//   standalone parent operating DCF — el SOTP es un análisis separado que
//   no bloquea ni depende de este objeto.
//
// Lo que este archivo NO transporta (deliberado, no un olvido):
// - `expected_growth` (3.0% flat, 5 años): NO es una de las 13
//   `ResolvedCalculationAssumptions` — 05 §6 ya lo señala explícitamente
//   ("`forecast_growth_path`... NOT BUILDING, el parámetro existente
//   basta") como un parámetro propio del motor
//   (`runCanonicalFinancialEngine(structuredInput, sector, expectedGrowth)`,
//   `canonical-financial-engine.ts:234`, `resolveEffectiveGrowth`) y de
//   `analysis.expected_growth` en el flujo real (`ejecutar-calculo/index.ts`,
//   `structured-input-builder.ts`). Debe suministrarse como ese parámetro
//   separado en 4F.5 — no se fabrica aquí una decimocuarta assumption.
// - Evidence FY2024 (revenue 2,098,376,569; EBITDA 293,552,229;
//   EBIT 200,310,448; cash 49,548,598; deuda bancaria 653,189,423; leases
//   143,939,924; equity 175,759,391 — COP miles): es Evidence, no
//   Judgment — vive en `structured_input.income_statement`/`balance_sheet`
//   (consumido por `evaluateCalculationPreflight`/`computeCapitalStructure`
//   directamente), nunca dentro de `ResolvedCalculationAssumptions`. Ese
//   `structured_input` completo es un artefacto propio de 4F.4/4F.5, fuera
//   del alcance de 4F.3.
// - Convención de leases `CAPITALIZED_LEASES`: no existe HOY ningún campo
//   dedicado en `ResolvedCalculationAssumptions` ni en `structured_input`
//   para "ROU depreciation" o "ΔLeaseLiability" por separado (verificado:
//   ningún archivo de `_shared`/`src` menciona "lease" — gap ya clasificado
//   en `05 §10`, ítem 13 del mismo mismatch audit, "CONDITIONAL FOR
//   ALPINA — solo si Alpina presenta partidas materiales de este tipo";
//   Alpina sí las presenta, 143,939,924 de 797,129,347 de deuda total-like,
//   ~18%). La convención se respeta de forma AGREGADA en este objeto: el
//   793,129,347 de deuda total-like (bancaria+leases) es el número que
//   deberá alimentar `structured_input.balance_sheet.financial_debt_total`
//   (Evidence, fuera de este archivo) para que `capitalStructure`/WACC ya
//   reflejen leases consistentemente; `depreciationDaDriver` (≈4.2%
//   ingresos) se declara aquí como ya inclusivo de ROU depreciation, sin
//   desagregarla; el reinvestment económico completo (ROU depreciation +
//   ΔLeaseLiability) para el diagnóstico de ROC/g terminal es una
//   verificación fuera del motor (05 §10, "CROSS-CHECK ONLY"), no un campo
//   de este contrato. Esto NO es un root-cause nuevo — es el ítem 13 ya
//   clasificado en 05 §10, condición disparada por evidencia real de
//   Alpina, a resolver explícitamente en 4F.4/4F.5, no en 4F.3.
//
// Cross-checks de referencia (NO inputs, NO se almacenan en el objeto —
// `capitalStructure.ts::computeCapitalStructure` los recompone
// determinísticamente a partir de las 7 entradas de Ke/WACC de abajo):
// βL ≈ 0.81715, Ke ≈ 11.6845%, WACC ≈ 10.5542%.
//
// Este archivo NO ha sido evaluado todavía contra `evaluateCalculationPreflight`
// (4F.4, gate formal separado) ni ejecutado contra el motor (4F.5). No usar
// como input de un cálculo real todavía.

import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions";

export const ALPINA_2024_RESOLVED_ASSUMPTIONS: ResolvedCalculationAssumptions = {
  taxTreatment: {
    value: {
      marginalRatePct: 35,
      explicitFcffTaxRatePctByYear: [35, 35, 35, 35, 35],
      debtTaxShieldRatePct: 35,
    },
    unit: "percent",
    date: "2024-12-31",
    source: "DIAN — tarifa general de renta para personas jurídicas vigente a la fecha de valoración (35%); Evidence FY2024 standalone de Alpina Productos Alimenticios S.A.S. BIC.",
    rationale:
      "Sin NOLs materiales, diferencias temporales significativas ni régimen tributario especial identificados en la Evidence FY2024 de Alpina — el reviewer no encontró base para separar marginal/efectiva/tax-shield de la tarifa estatutaria. Las tres tasas coinciden en 35% de forma honesta (no son iguales por colapso accidental del contrato, sino porque la Evidence del caso no sustenta una divergencia): marginalRatePct de largo plazo, explicitFcffTaxRatePctByYear flat en los 5 años del horizonte explícito, y debtTaxShieldRatePct para Kd×(1-T) y Hamada (04 §6.3/§6.4/§10.6).",
    status: "resolved",
  },

  capitalStructure: {
    value: {
      // D/E ≈ 39.10118% (valor más preciso disponible) → E/V = 1/(1+D/E), D/V = 1-E/V.
      equityWeight: 0.7189011624,
      debtWeight: 0.2810988376,
      structureSource: "comparables",
    },
    unit: "composite",
    date: "2025-01",
    source:
      "Aswath Damodaran / NYU Stern — Emerging Markets, Food Processing, dataset de enero de 2025 (n=993), D/E promedio del sector desapalancado/reapalancado (04 §10.1(a)).",
    rationale:
      "Reviewer (decisión R-02, 4F.1): estructura de capital resuelta directamente desde comparables sectoriales, sin transition modeling, tras verificar en la Evidence FY2024 disponible que (1) no hay evento contractual de leverage conocido que deba persistir materialmente durante los 5 años del horizonte explícito, y (2) no hay distress financiero estructural que haga incomparable la referencia sectorial (interest coverage ≈2.02x registrado como credit sanity check a vigilar, no como distress — bono histórico recomprado 100% en 2023, deuda relevante a 2024-12-31 es bancaria + leases, sin default/restructuring/covenant-breach/going-concern identificado en la Nota 15 y estados financieros separados FY2024). `structureSource` es \"comparables\" y no \"target\" (04 §10.1) — aunque económicamente esta estructura sectorial se usa como sustainable long-run target del caso, la fuente contractual es el promedio de comparables Damodaran, no una política de apalancamiento propia declarada por Alpina.",
    status: "resolved",
  },

  riskFreeRateConstruction: {
    value: {
      referenceCurrencyRatePct: 4.58,
      inflationDifferentialPct: 0.9803921569,
      localRatePct: 5.6052941176,
    },
    date: "2024-12-31",
    source:
      "Rf USD 4.58% (referencia limpia de riesgo de default, vintage de la construcción R-03); metas de inflación de largo plazo: Banco de la República (Colombia, 3%) y Reserva Federal/FOMC (EE.UU., 2%).",
    rationale:
      "Relación de paridad de tasas de Fisher exacta (04 §10.3), no aproximación aditiva: (1+Rf_COP) = (1+Rf_USD) × (1+π_COL)/(1+π_US) → inflationDifferentialPct = (1.03/1.02 − 1)×100 ≈ 0.9803921569%; localRatePct = (1.0458×1.03/1.02 − 1)×100 ≈ 5.6052941176%. Reviewer (decisión R-03, 4F.1) cerró esta construcción por consistencia de horizonte frente a candidatos previos ≈6.7–6.9% de outputs 4C/4E, que quedan SUPERSEDED para esta ejecución — no se reviven.",
    status: "resolved",
  },

  matureErp: {
    value: { valuePct: 4.33 },
    unit: "percent",
    source: "Aswath Damodaran / NYU Stern — Equity Risk Premium implícito de mercado maduro, vintage usada en el reviewer pack de Alpina (mismo handoff que capitalStructure/betaTreatment, Damodaran EM Food Processing enero 2025).",
    rationale: "Base del término β×ERP del CAPM (04 §10.2) — mercado de referencia sin riesgo soberano adicional significativo, distinto del country risk premium (04 §10.4).",
    status: "resolved",
  },

  countryRiskPremium: {
    value: { valuePct: 2.541 },
    unit: "percent",
    source: "Aswath Damodaran / NYU Stern — Country Default Spreads and Risk Premiums, Colombia (CRP basado en calificación soberana), mismo reviewer pack/vintage que matureErp.",
    rationale: "Componente adicional de riesgo específico de Colombia, separado del ERP de mercado maduro — se incorpora exclusivamente a través del término λ×CRP del CAPM (04 §10.4), sin duplicarse en ningún otro ajuste del modelo (04 §13).",
    status: "resolved",
  },

  countryRiskLambda: {
    value: { mode: "direct_documented_judgment", value: 1 },
    source: "Reviewer financiero — decisión R-01 (4F.1, RC-5): Judgment experto directo, no ratio observado (04 §10.4 enmendado).",
    rationale:
      "No existe un desglose standalone suficientemente robusto de ingresos domésticos/exportación de Alpina, ni un denominador de mercado directamente observable, para calcular el ratio de exposición sin falsa precisión — el reviewer recomienda λ=1 como base. Esto NO implica afirmar que Alpina tiene exposición observada exactamente promedio: implica que no existe base suficientemente robusta para cuantificar una desviación de esa línea base. La sensitivity λ≈1.10–1.15 documentada por el reviewer es un escenario cualitativo (\"qualitative documented Judgment/sensitivity\", no ratio observado) evaluado por separado en el análisis de escenarios — no forma parte de este valor base ni se mezcla con él.",
    status: "resolved",
  },

  betaTreatment: {
    value: { unleveredBeta: 0.6515519, releveringMethod: "hamada" },
    source: "Aswath Damodaran / NYU Stern — unlevered beta sectorial, Emerging Markets Food Processing, mismo dataset/vintage que capitalStructure (enero 2025, n=993).",
    rationale:
      "Beta desapalancado sectorial, consistente con el mismo universo de comparables usado para resolver capitalStructure. El beta apalancado se recompone determinísticamente dentro de Calculation vía Hamada, a partir de este valor, capitalStructure y taxTreatment.debtTaxShieldRatePct (Bloque 3B.1) — no se almacena un leveredBeta independiente en este contrato. Cross-check esperado de esa recomposición: βL ≈ 0.81715 (referencia, no almacenada aquí — ver cabecera del archivo).",
    status: "resolved",
  },

  costOfDebt: {
    value: { valuePct: 11.79, hierarchy: "fallback_documented" },
    unit: "percent",
    date: "2024-12-31",
    source:
      "Evidence FY2024 de Alpina — Nota 15 (7 obligaciones financieras bancarias reales, con principal/tasas-spreads/moneda/vencimientos) y leases (NIIF 16), bajo la convención económica congelada CAPITALIZED_LEASES. Kd histórico implícito blended (deuda bancaria + leases).",
    rationale:
      "Costo de deuda marginal observable de mercado (jerarquía 1, 04 §10.5) no disponible con granularidad suficiente para esta ejecución; se usa el Kd histórico implícito blended ≈11.79% como fallback documentado (hierarchy: \"fallback_documented\", narrative: \"historical_implied_fallback\" — nunca calificado como marginal borrowing cost). El bono histórico fue recomprado 100% en 2023; la deuda relevante a 2024-12-31 es bancaria + leases, incluidos ambos de forma consistente con la convención de leases congelada. Candidatos previos (incluyendo 12.65% bank-only) quedan SUPERSEDED para esta ejecución.",
    status: "resolved",
  },

  capexReinvestmentDriver: {
    value: {
      mode: "explicit_path",
      explicitPath: [70_718_655, 82_003_940, 93_921_384, 106_470_072, 119_695_825],
    },
    unit: "currency",
    date: "2024-12-31",
    source: "Velarix v5 Alpina — 4D.2 Operating Forecast, reconciliado desde Evidence FY2024 standalone y plan de CAPEX de Alpina (Judgment derivado, no fuente primaria directa; artefacto histórico no versionado dentro de este repositorio de código).",
    rationale:
      "Path explícito de CAPEX año a año (COP miles, 04 §8), reconciliado contra el histórico CAPEX vs. D&A de Alpina — supersede un candidato provisional ≈2.82% de ingresos usado en outputs 4C/4E anteriores, que queda descartado para esta ejecución. Verificación g/ROC terminal pendiente como cross-check fuera del motor (05 §10), no bloquea este valor.",
    status: "resolved",
  },

  depreciationDaDriver: {
    value: { mode: "percent_of_revenue", daPctOfRevenue: 4.2 },
    unit: "percent",
    date: "2024-12-31",
    source: "Velarix v5 Alpina — 4D.2 Operating Forecast, Judgment reconciliado desde Evidence FY2024 standalone (D&A histórico), bajo la convención CAPITALIZED_LEASES.",
    rationale:
      "≈4.2% de ingresos durante el horizonte explícito — supersede un candidato provisional de 3.2% usado en outputs 4C/4E anteriores, que queda descartado para esta ejecución. Ya inclusivo de ROU depreciation bajo la convención de leases congelada (CAPITALIZED_LEASES) — no se desagrega por separado porque el contrato no tiene un campo dedicado para ello (ver nota de cabecera del archivo sobre el canal de leases).",
    status: "resolved",
  },

  workingCapitalDriver: {
    value: {
      explicitDeltaNwcByYear: [1_609_505, 1_666_749, 1_717_193, 1_768_880, 1_821_877],
    },
    unit: "currency",
    date: "2024-12-31",
    source: "Velarix v5 Alpina — 4D.2 Operating Forecast, ΔNWC explícito reconciliado desde Evidence FY2024 standalone (AR/inventario/AP), Judgment derivado.",
    rationale: "Valores explícitos año a año (COP miles, 05 §3) — no proporcionales entre sí ni a ingresos, reconciliados contra el capital de trabajo operativo real de Alpina, no un %/ratio genérico.",
    status: "resolved",
  },

  terminalG: {
    value: { valuePct: 3.0, pessimisticScenarioPct: 2.5, optimisticScenarioPct: 3.5 },
    unit: "percent",
    source: "Velarix v5 Alpina — reviewer financiero, g terminal de largo plazo reconciliado económicamente (crecimiento de largo plazo del sector/geografía, 04 §11).",
    rationale:
      "g base 3.0% verificado contra WACC>g y contra Net Reinvestment/NOPAT ≈ g/ROC en el año terminal, con ROC diagnóstico ≈24% (rango 23.5%–24.5%, confianza LOW-MEDIUM — ver projectionHorizonYears.convergenceJudgmentNotes; el ROC en sí no se almacena aquí porque terminalG no tiene un campo para ello). pessimisticScenarioPct (2.5%) y optimisticScenarioPct (3.5%) son un SENSITIVITY_OVERLAY documentado sobre el mismo g base (04 §11.2) — no escenarios de negocio completamente recalibrados.",
    status: "resolved",
  },

  projectionHorizonYears: {
    value: {
      years: 5,
      convergenceJudgmentNotes:
        "5 años coincide con la única capacidad actual del motor (canonical-financial-engine.ts, horizonte hardcoded). El año 5 cumple conceptualmente Net Reinvestment/NOPAT ≈ g/ROC con ROC diagnóstico ≈24% (rango 23.5%–24.5%, confianza LOW-MEDIUM) — verificación de consistencia interna del horizonte (04 §11/05 §10, cross-check fuera del motor), no una assumption independiente ni un campo nuevo de terminalG.",
    },
    unit: "years",
    source: "Velarix v5 Alpina — Judgment de convergencia del reviewer financiero, verificado contra la única capacidad actual del motor.",
    rationale: "Horizonte explícito de 5 años suficiente para la convergencia de Alpina según el diagnóstico g/ROC del año terminal — no se identificó evidencia que exija un horizonte distinto (05 §10, ítem condicional no disparado).",
    status: "resolved",
  },
};
