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
