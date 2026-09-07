// BL-31 (Bloque 1A) — Contrato tipado para `calculation_result`.
//
// Diseño únicamente: este archivo NO se importa desde ningún código de
// producción todavía (ni `ejecutar-calculo`, ni `financial-engine.ts`, ni
// `Dashboard.tsx`). Conectar cualquiera de los dos motores a este contrato
// es trabajo de Bloque 1B/1C, no de 1A.
//
// Motivación (ver docs/velarix/bloque-1a/BL-26-tabla-comparativa-motores.md,
// sección 7): hoy el servidor devuelve los campos de valoración anidados
// bajo `valuation` y sin tipo declarado (`ejecutar-calculo/index.ts:204-232`,
// tipo implícito de TypeScript/Deno), mientras que el cliente los devuelve
// planos con un tipo explícito (`financial-engine.ts:200-222`,
// `AnalysisResult`). Este contrato unifica ambas formas en una sola,
// versionada, sin `any`, para que sea el contrato de salida futuro de
// AMBOS motores — no una copia de ninguno de los dos tal como están hoy.

/** Identifica exactamente qué produjo este resultado y con qué versión de cada pieza. Ver BL-32. */
export interface CalculationVersionInfo {
  /** Versión del contrato de este archivo (semver simple, no el semver de npm). */
  contractVersion: string;
  /** Versión de las fórmulas/lógica de cálculo (Hamada, CAPM, WACC, FCFF...). Ver BL-32. */
  calculationVersion: string;
  /** Versión del conjunto de fórmulas aplicadas dentro de `calculationVersion` (para cambios menores que no ameritan subir calculationVersion). */
  formulaVersion: string;
  /** Versión de los datos macro/sectoriales usados (Damodaran, Banco de la República, DANE). Ver BL-32. */
  macroDataVersion: string;
  /** Hash determinístico del `structured_input` que produjo este resultado — permite detectar si el input cambió después de calcular. Ver BL-32. */
  inputHash: string;
  /** Qué motor produjo este resultado. Útil mientras ambos motores coexistan (Bloque 1E). */
  engine: "server" | "client";
}

export type Currency = "COP" | "USD";

/** Origen y factor de conversión de moneda aplicados antes de este cálculo. Ver R-02/BL-03. */
export interface CurrencyInfo {
  /** Moneda en la que se reporta este resultado. */
  reportingCurrency: Currency;
  /** Moneda detectada en el documento fuente (antes de cualquier conversión). */
  sourceCurrency: Currency;
  /** Factor total aplicado (escala × conversión de moneda) para llegar de `sourceCurrency` a `reportingCurrency`. */
  conversionFactor: number;
}

export interface YearProjection {
  year: number;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  interest: number;
  ebt: number;
  taxes: number;
  netIncome: number;
  nopat: number;
  capex: number;
  deltaWC: number;
  fcff: number;
  discountedFcf: number;
}

export interface ScenarioAssumptions {
  label: string;
  growth: number;
  ebitdaMargin: number;
  capexPct: number;
  wcPct: number;
  wacc: number;
  terminalGrowth: number;
}

export interface ScenarioResult {
  assumptions: ScenarioAssumptions;
  projections: YearProjection[];
  enterpriseValue: number;
}

export interface KPIResult {
  grossMargin: number;
  ebitdaMargin: number;
  ebitMargin: number;
  netMargin: number;
  roe: number;
  roa: number;
  revenueGrowth: number;
  netDebt: number;
  leverage: number;
  interestCoverage: number;
  /**
   * Campos de ciclo de caja. Marcados explícitamente como no confiables
   * hasta que un motor los derive de datos reales — hoy ambos motores (o
   * solo el cliente, ver BL-26 sección 3) usan valores fijos de demo.
   */
  cashCycle: {
    daysReceivable: number;
    daysInventory: number;
    daysPayable: number;
    cashCycleDays: number;
    /** false mientras el valor sea un fijo de demostración, no derivado de datos reales del cliente. */
    isRealData: boolean;
  };
  cajaMinima: number;
}

export interface SensitivityCell {
  waccDelta: number;
  growthDelta: number;
  enterpriseValue: number;
}

export interface SectorBenchmarkRef {
  label: string;
  beta: number;
  ebitdaMargin: number;
  evEbitda: number;
  evRevenue: number;
  waccRef: number;
  source: string;
  lastUpdated: string;
}

export interface ValuationResult {
  betaLevered: number;
  costOfEquity: number;
  costOfDebtAfterTax: number;
  wacc: number;
  terminalValue: number;
  discountedTerminalValue: number;
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  evLow: number;
  evHigh: number;
  evEbitdaMultiple: number;
  evRevenueMultiple: number;
  /** Presente únicamente cuando WACC <= crecimiento terminal invalida el DCF. Null en el caso normal. */
  waccWarning: string | null;
}

/**
 * Contrato canónico de `calculation_result`. Ningún motor lo produce en
 * esta forma exacta todavía (ver BL-26 sección 7 para el estado actual de
 * cada uno) — es el objetivo de diseño para Bloque 1B/1C.
 */
export interface CalculationResult {
  version: CalculationVersionInfo;
  currency: CurrencyInfo;
  sector: string;
  sectorBenchmark: SectorBenchmarkRef;
  baseProjections: YearProjection[];
  scenarios: {
    pessimistic: ScenarioResult;
    base: ScenarioResult;
    optimistic: ScenarioResult;
  };
  kpis: KPIResult;
  valuation: ValuationResult;
  sensitivityMatrix: SensitivityCell[];
  /**
   * Trazabilidad hacia atrás — qué homologaciones/documentos alimentaron
   * este cálculo. Diseño relacionado con BL-15 (ver
   * plan/MATRIZ-DE-TRAZABILIDAD.md, fila "structured_inputs → fórmula
   * aplicada"). Se puebla realmente en Bloque 1C, no en 1A.
   */
  traceability: {
    structuredInputId: string;
    sourceDocumentIds: string[];
    sourceMappingIds: string[];
  };
}

// ═══════════════════════════════════════════════════════════════
// Bloque 1E — Subbloque 1: shape REAL de `analyses.calculation_result`
// ═══════════════════════════════════════════════════════════════
//
// A diferencia del `CalculationResult` de arriba (contrato de diseño
// para una futura unificación de motores, todavía sin conectar — ver su
// propio comentario de cabecera), esto sí es exactamente lo que
// `ejecutar-calculo/index.ts` persiste hoy en `analyses.calculation_result`:
// el output de `runCanonicalFinancialEngine()`
// (`supabase/functions/_shared/canonical-financial-engine.ts`) más
// `version` (`_shared/calculation-versioning.ts`), `provenance`
// (`_shared/calculation-provenance.ts`) y `source_input_snapshot`
// (`_shared/source-input-snapshot.ts`, Bloque 1E/Subbloque 1 — corrección
// de trazabilidad), tal como se spreadea en `ejecutar-calculo/index.ts`
// (`{ ...result, version, provenance, source_input_snapshot }`).
//
// Los campos se mantienen manualmente en sync con esos archivos —
// mismos nombres, mismos tipos, sin lógica — porque viven fuera de
// `src/` con imports estilo Deno (p. ej. `./capital-structure.ts`) que
// el resolutor de módulos del frontend no necesita ni debe resolver.

export interface CanonicalYearProjection {
  year: number;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  interest: number;
  ebt: number;
  taxes: number;
  netIncome: number;
  nopat: number;
  capex: number;
  deltaWC: number;
  fcff: number;
  discountedFcf: number;
}

export interface CanonicalScenarioResult {
  projections: CanonicalYearProjection[];
  /**
   * Bloque 3C.5 (cierre) — `null` cuando `scenarioWacc <= scenarioTerminalG`
   * (Gordon Growth no converge para este escenario) — mismo contrato que
   * `_shared/canonical-financial-engine.ts::ScenarioResult.ev`. `projections`
   * permanece siempre disponible aunque el terminal no converja.
   */
  ev: number | null;
  assumptions: { growth: number; ebitdaMargin: number; wacc: number; terminalGrowth: number };
  label?: string;
}

export interface CanonicalKPIs {
  grossMargin: number;
  ebitdaMargin: number;
  ebitMargin: number;
  /**
   * 4F.6D2 — `null` en v5 cuando `net_income` no fue observado (no
   * interpretable), distinguible de un margen neto real de `0%`. Mismo
   * contrato que `_shared/canonical-financial-engine.ts::CanonicalKPIs.netMargin`.
   */
  netMargin: number | null;
  /**
   * Bloque 3C.2 — `null` cuando `equity <= 0` o ausente (no interpretable),
   * distinguible de un ROE real de `0%`. Mismo contrato que
   * `_shared/canonical-financial-engine.ts::CanonicalKPIs.roe` — este tipo
   * describe el mismo `calculation_result` persistido, no un contrato
   * distinto.
   */
  roe: number | null;
  /** 4F.6D2 — `null` en v5 cuando `net_income`/`total_assets` no fueron observados (nunca `totalDebt+equity`). Mismo contrato que `_shared/canonical-financial-engine.ts::CanonicalKPIs.roa`. */
  roa: number | null;
  netDebt: number;
  leverage: number;
  interestCoverage: number;
}

export interface CanonicalValuation {
  betaLevered: number;
  costOfEquity: number;
  costOfDebtAfterTax: number;
  wacc: number;
  terminalValue: number;
  discountedTV: number;
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  evLow: number;
  evHigh: number;
  evEbitda: number;
  evRevenue: number;
  waccWarning: string | null;
}

export interface CanonicalAssumptionSnapshotEntry {
  value: number;
  unit: string;
  approved: boolean;
}

export type CanonicalProvenanceStatus = "missing" | "partial" | "complete";

/**
 * Bloque 3C.6 — distingue explícitamente si el resultado se produjo con
 * los defaults metodológicos legacy o con `ResolvedCalculationAssumptions`
 * de Judgment v5 resueltas para el caso (mismo contrato que
 * `_shared/calculation-versioning.ts::AssumptionsSource`).
 */
export type CanonicalAssumptionsSource = "legacy_canonical_default" | "resolved_case_input";

export interface CanonicalCalculationVersion {
  calculation_schema_version: string;
  canonical_engine_version: string;
  methodology_version: string;
  /**
   * Bloque 3C.6 (cierre): este tipo solo describe la forma LEGACY (8
   * defaults globales, `{value: number, unit, approved}`). En una
   * ejecución v5 real (`assumptions_source: "resolved_case_input"`), el
   * valor real de esta propiedad es el `ResolvedCalculationAssumptions`
   * completo de 13 campos (mismo shape que `resolved_assumptions_used`,
   * mirrorado aquí también por `_shared/calculation-versioning.ts` para
   * fingerprint/versioning) — NO esta forma legacy. `pdf-canonical-
   * mapper.ts` ya no depende de esta propiedad para v5: lee
   * `resolved_assumptions_used` (tipado como `ResolvedCalculationAssumptions`
   * más abajo), la fuente explícita de Judgment congelado, en vez de
   * reinterpretar este campo de versionado/fingerprint por su cuenta.
   */
  assumptions_snapshot: Record<string, CanonicalAssumptionSnapshotEntry>;
  assumptions_source: CanonicalAssumptionsSource;
  calculated_at: string;
  input_fingerprint: string;
  provenance_status: CanonicalProvenanceStatus;
}

// ── ResolvedCalculationAssumptions (Bloque 3C.6, cierre) ──
// Mirror exacto de `_shared/resolved-calculation-assumptions.ts` — mismo
// patrón que `SourceInputSnapshot`/`SnapshotIncomeStatement` más abajo:
// el frontend no importa tipos de `_shared` (Deno), así que el contrato
// se duplica aquí campo a campo. Antes de este bloque no se duplicaba
// (ver comentario retirado arriba) porque ningún consumidor frontend
// interpretaba el contenido — ahora `pdf-canonical-mapper.ts` sí lo hace,
// así que la duplicación deja de ser estructura anticipada sin uso.

export type ResolvedAssumptionUnit = "percent" | "decimal" | "ratio" | "years" | "currency" | "composite";

export interface ResolvedAssumptionEntry<TValue> {
  value: TValue;
  unit?: ResolvedAssumptionUnit;
  source: string;
  rationale: string;
  status: "resolved";
  date?: string;
}

export type CapitalStructureSource = "comparables" | "target" | "optimal" | "iterative";

export interface CapitalStructureValue {
  equityWeight: number;
  debtWeight: number;
  structureSource: CapitalStructureSource;
}

export interface TaxTreatmentValue {
  marginalRatePct: number;
  explicitFcffTaxRatePctByYear: number[];
  debtTaxShieldRatePct: number;
  nolsNotes?: string;
}

export interface RiskFreeRateConstructionValue {
  referenceCurrencyRatePct: number;
  inflationDifferentialPct: number;
  localRatePct: number;
}

export interface BetaTreatmentValue {
  unleveredBeta: number;
  releveringMethod: "hamada";
}

export interface CostOfDebtValue {
  valuePct: number;
  hierarchy: "observed_marginal" | "spread_estimate" | "fallback_documented";
}

/** RC-5 (4F.2) — mirror de `_shared/resolved-calculation-assumptions.ts`. */
export type CountryRiskLambdaValue =
  | {
      mode: "observed_revenue_exposure";
      value: number;
      domesticRevenuePctCompany: number;
      domesticRevenuePctMarketAvg: number;
    }
  | {
      mode: "direct_documented_judgment";
      value: number;
    };

export type CapexReinvestmentDriverValue =
  | { mode: "percent_of_revenue"; capexPctOfRevenue: number; maintenanceVsGrowthNotes?: string }
  | { mode: "explicit_path"; explicitPath: number[]; maintenanceVsGrowthNotes?: string };

export type DepreciationDaDriverValue =
  | { mode: "percent_of_revenue"; daPctOfRevenue: number }
  | { mode: "explicit_path"; explicitPath: number[] };

export interface WorkingCapitalDriverValue {
  explicitDeltaNwcByYear: number[];
}

export interface TerminalGValue {
  valuePct: number;
  pessimisticScenarioPct?: number;
  optimisticScenarioPct?: number;
}

export interface ProjectionHorizonValue {
  years: number;
  convergenceJudgmentNotes?: string;
}

/** Los 13 puntos congelados en `05-financial-engine-audit.md` v1.3 §6. */
export interface ResolvedCalculationAssumptions {
  taxTreatment: ResolvedAssumptionEntry<TaxTreatmentValue>;
  capitalStructure: ResolvedAssumptionEntry<CapitalStructureValue>;
  riskFreeRateConstruction: ResolvedAssumptionEntry<RiskFreeRateConstructionValue>;
  matureErp: ResolvedAssumptionEntry<{ valuePct: number }>;
  countryRiskPremium: ResolvedAssumptionEntry<{ valuePct: number }>;
  countryRiskLambda: ResolvedAssumptionEntry<CountryRiskLambdaValue>;
  betaTreatment: ResolvedAssumptionEntry<BetaTreatmentValue>;
  costOfDebt: ResolvedAssumptionEntry<CostOfDebtValue>;
  capexReinvestmentDriver: ResolvedAssumptionEntry<CapexReinvestmentDriverValue>;
  depreciationDaDriver: ResolvedAssumptionEntry<DepreciationDaDriverValue>;
  workingCapitalDriver: ResolvedAssumptionEntry<WorkingCapitalDriverValue>;
  terminalG: ResolvedAssumptionEntry<TerminalGValue>;
  projectionHorizonYears: ResolvedAssumptionEntry<ProjectionHorizonValue>;
}

export interface CanonicalFieldProvenance {
  source_status: CanonicalProvenanceStatus;
  homologation_ids: string[];
  document_ids: string[];
}

export interface CanonicalCalculationProvenance {
  analysis_id: string;
  structured_input_id: string | null;
  document_ids: string[];
  homologation_ids: string[];
  source_row_ids: null;
  source_row_ids_status: "missing";
  built_at: string;
  currency: { moneda_analisis: string; moneda_documento: string | null; factor_conversion: number };
  fields: Record<string, CanonicalFieldProvenance>;
  overall_status: CanonicalProvenanceStatus;
  warnings: string[];
  period_selection: { base_period: string | null; selection_mode: string; available_periods: string[] } | null;
}

// ── source_input_snapshot (Bloque 1E, Subbloque 1 — corrección) ──
// Congela, dentro del propio calculation_result, el structured input
// EXACTO que `ejecutar-calculo` usó para el fingerprint y el motor — así
// el PDF nunca puede combinar un calculation_result con un
// structured_input distinto/más reciente. Todos los campos financieros
// son `number | null`: el contrato v2.3 del structured input
// (`_shared/structured-input-builder.ts`) los declara nullable porque una
// cifra AUSENTE no es lo mismo que 0 — este tipo preserva esa semántica,
// nunca la colapsa.

export interface SnapshotIncomeStatement {
  revenue: number | null;
  cost_of_sales: number | null;
  opex: number | null;
  da: number | null;
  ebitda: number | null;
  ebit: number | null;
  interest_expense: number | null;
  taxes: number | null;
  net_income: number | null;
}

export interface SnapshotBalanceSheet {
  cash: number | null;
  accounts_receivable: number | null;
  inventory: number | null;
  accounts_payable: number | null;
  ppe: number | null;
  current_financial_debt: number | null;
  long_term_financial_debt: number | null;
  financial_debt_total: number | null;
  equity: number | null;
  total_assets: number | null;
  total_liabilities: number | null;
}

/** Mismo shape que produce `_shared/source-input-snapshot.ts::buildSourceInputSnapshot`. */
export interface SourceInputSnapshot {
  structured_input_id: string | null;
  version_input: string | null;
  base_period: string | null;
  sector: string;
  moneda_analisis: string | null;
  income_statement: SnapshotIncomeStatement;
  balance_sheet: SnapshotBalanceSheet;
}

/** Shape real y completo de `analyses.calculation_result` (columna JSON), tal como lo escribe `ejecutar-calculo/index.ts`. */
export interface PersistedCalculationResult {
  projections: CanonicalYearProjection[];
  scenarios: {
    pessimistic: CanonicalScenarioResult;
    base: CanonicalScenarioResult;
    optimistic: CanonicalScenarioResult;
  };
  kpis: CanonicalKPIs;
  valuation: CanonicalValuation;
  sensitivityMatrix: { waccDelta: number; growthDelta: number; ev: number }[];
  sectorBenchmark: { beta: number; ebitdaMargin: number; evEbitda: number; evRevenue: number; waccRef: number };
  moneda: string;
  factor_conversion: number;
  version: CanonicalCalculationVersion;
  provenance: CanonicalCalculationProvenance;
  source_input_snapshot: SourceInputSnapshot;
  /**
   * Bloque 3C.6 (`04 §16`, `05 v1.3 §7`) — snapshot de Judgment, separado
   * de `source_input_snapshot` (Evidence): `null` en legacy, el
   * `ResolvedCalculationAssumptions` completo (13 campos) congelado tal
   * cual se usó cuando `assumptions_source === "resolved_case_input"`.
   * Fuente explícita y preferida que consume `pdf-canonical-mapper.ts`
   * para mapear los supuestos v5 al PDF (en vez de reinterpretar
   * `version.assumptions_snapshot`, pensado para fingerprint/versioning).
   */
  resolved_assumptions_used: ResolvedCalculationAssumptions | null;
}

// ── Históricos nullable para el PDF (Bloque 1E, Subbloque 1 — corrección) ──
// `FinancialInputs`/`AnalysisResult` (src/lib/financial-engine.ts) exigen
// `number` porque el motor CLIENTE nunca deja un campo sin valor — pero
// el contrato canónico sí puede tener cifras ausentes (missing != 0). Este
// tipo, separado, es lo que `pdf-generator.ts` consume para las cifras
// históricas cuando renderiza desde un `calculation_result` real: cada
// campo nullable, "N/D" cuando falta, nunca 0 disfrazado de dato.
export interface HistoricalFinancials {
  revenue: number | null;
  costOfSales: number | null;
  opex: number | null;
  depreciation: number | null;
  ebitda: number | null;
  ebit: number | null;
  interestExpense: number | null;
  taxes: number | null;
  netIncome: number | null;
  cash: number | null;
  financialDebtTotal: number | null;
  equity: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
}

import type { FinancialInputs } from "@/lib/financial-engine";

// ── FinancialInputs nullable para el PDF (Bloque 3C.6, cierre) ──
// `FinancialInputs.taxRate/capexPct/wcPct` (src/lib/financial-engine.ts)
// exigen `number` porque el motor CLIENTE (demo) siempre tiene un valor
// real para esos tres campos, y su aritmética demo depende de que así
// sea. En el camino canónico v5, el Judgment resuelto
// (`ResolvedCalculationAssumptions`) no siempre tiene un equivalente
// escalar directo (p. ej. CAPEX en `explicit_path`, o working capital,
// que solo existe como `explicitDeltaNwcByYear[]`) — forzar esos casos a
// `FinancialInputs` fabricaría una tasa que el Judgment nunca declaró.
//
// `PdfFinancialInputs` (mismo patrón que `HistoricalFinancials` arriba)
// es lo que `generatePDF()` y `pdf-canonical-mapper.ts` usan en su lugar:
// idéntico a `FinancialInputs` salvo que taxRate/capexPct/wcPct son
// `number | null` — "N/D" cuando no hay equivalencia escalar real, nunca
// `0` disfrazado de supuesto. Como `number` es asignable a `number | null`,
// cualquier `FinancialInputs` real (demo) sigue siendo un
// `PdfFinancialInputs` válido sin cambios en los callers demo.
export type PdfFinancialInputs = Omit<FinancialInputs, "taxRate" | "capexPct" | "wcPct"> & {
  taxRate: number | null;
  capexPct: number | null;
  wcPct: number | null;
};
