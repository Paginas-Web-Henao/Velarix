// Bloque 3B — Contrato mínimo de supuestos metodológicos resueltos
// (`ResolvedCalculationAssumptions`), definido en
// docs/velarix-v5/05-financial-engine-audit.md v1.3 §6.
//
// Este archivo contiene EXCLUSIVAMENTE tipos/interfaces y listas de
// nombres de campos (metadata, no cálculo) — cero lógica financiera
// productiva. No importa Supabase/Deno/URL. No implementa preflight, no
// implementa consumo por el motor, no implementa ningún cálculo. Existe
// únicamente para que los tests de Bloque 3B puedan compilar y expresar
// el comportamiento v5 objetivo contra un contrato compartido, en vez de
// que cada test invente su propia forma ad hoc.
//
// "Judgment, no approvals" (04 §17, 05 v1.3 §5): cada entrada resuelta
// declara `status: "resolved"` — nunca `approved` — porque ni el motor
// ni el preflight aprueban nada; verifican que la resolución humana ya
// ocurrió. No hay ningún campo de reviewer, rol o workflow en este
// contrato, deliberadamente.

/** Unidad de una entrada resuelta, cuando aplica (no todas las entradas tienen una unidad simple — p. ej. `capitalStructure` es un objeto compuesto). */
export type ResolvedAssumptionUnit = "percent" | "decimal" | "ratio" | "years" | "currency" | "composite";

/**
 * Envoltorio común de gobernanza para cada supuesto resuelto —
 * mismos campos de `04 §16` (value/unit/date/source/rationale/status),
 * aplicados aquí a nivel de cada uno de los 13 puntos de `05 v1.3 §6`.
 * `status` es siempre literalmente `"resolved"` — este contrato no
 * modela ningún otro estado (ni "pending", ni "approved", ni "rejected")
 * porque no es un mecanismo de aprobación.
 */
export interface ResolvedAssumptionEntry<TValue> {
  value: TValue;
  unit?: ResolvedAssumptionUnit;
  /** De dónde proviene el valor — cálculo propio, fuente primaria, benchmark. Nunca vacío para una entrada resuelta real. */
  source: string;
  /** Por qué es razonable para este caso específico. Nunca vacío para una entrada resuelta real. */
  rationale: string;
  status: "resolved";
  /** Fecha a la que corresponde el valor, cuando aplica (especialmente relevante para market inputs fechados, 04 §10.4). */
  date?: string;
}

/** `04 §10.1` — las cuatro alternativas legítimas de estructura de capital; nunca book value como proxy no cuestionado. */
export type CapitalStructureSource = "comparables" | "target" | "optimal" | "iterative";

/**
 * Bloque 3B.1 — corrección: `bookEquityReference` se retiró de este tipo.
 * Book equity es Evidence (vive en `structured_input.balance_sheet.equity`,
 * consumido directamente por `computeCapitalStructure` como parámetro
 * `equity`), no Judgment — no pertenece al contrato de supuestos
 * resueltos. La verificación de sanity-check contra book equity (05 v1.3
 * §4) se hace en el motor comparando su propio output contra el `equity`
 * de Evidence que ya recibe como input, no releyéndolo desde aquí.
 */
export interface CapitalStructureValue {
  equityWeight: number;
  debtWeight: number;
  structureSource: CapitalStructureSource;
}

/**
 * Bloque 3B.2 — corrección: la v1 de este contrato colapsaba marginal
 * rate, tasa efectiva del horizonte explícito y tasa del tax shield de
 * deuda en una sola `marginalRatePct`, contradiciendo `04 §6.3/§6.4/
 * §10.6` y `03 P-03/P-04` — esos tres conceptos son económicamente
 * distintos y no necesariamente iguales entre sí:
 *
 * - `marginalRatePct`: tasa marginal/estatutaria de largo plazo — la
 *   que corresponde al valor terminal (`04 §6.3`), donde en perpetuidad
 *   cualquier distorsión transitoria (NOLs, diferencias temporales) ya
 *   se agotó.
 * - `explicitFcffTaxRatePctByYear`: tasa aplicable al NOPAT/FCFF de
 *   CADA año del horizonte explícito — puede diferir de la marginal si
 *   hay NOLs u otras compensaciones en uso, convergiendo hacia ella a
 *   medida que se agotan (`04 §6.3/§6.4`). Longitud exactamente igual a
 *   `projectionHorizonYears` — nunca una sola tasa reutilizada
 *   automáticamente en todos los años.
 * - `debtTaxShieldRatePct`: la tasa económicamente relevante para la
 *   deducibilidad del interés en `Kd × (1-T)` (`04 §10.6`) — no
 *   necesariamente igual a ninguna de las dos anteriores; refleja la
 *   capacidad real de la empresa de deducir el interés, que puede
 *   depender de reglas distintas a las que gobiernan el NOPAT operativo.
 *
 * El contrato transporta el path fiscal YA RESUELTO por juicio humano —
 * no construye aquí ninguna máquina de estados de NOLs (acumulación,
 * expiración, límites jurisdiccionales, utilización automática): eso
 * sigue siendo case-specific/`NOT BUILDING` (mismo principio ya aplicado
 * a los paths de CAPEX/D&A/ΔNWC). `nolsNotes` es solo un campo de texto
 * libre para que el Judgment documente el razonamiento, si aplica — no
 * una estructura de datos de NOLs.
 */
export interface TaxTreatmentValue {
  marginalRatePct: number;
  explicitFcffTaxRatePctByYear: number[];
  debtTaxShieldRatePct: number;
  nolsNotes?: string;
}

export interface RiskFreeRateConstructionValue {
  referenceCurrencyRatePct: number;
  inflationDifferentialPct: number;
  /** Resultado de aplicar la relación de Fisher (04 §10.3) — no la aproximación aditiva sin más. */
  localRatePct: number;
}

/**
 * Bloque 3B.1 — corrección: `leveredBeta` se retiró de este tipo.
 * `unleveredBeta` + `releveringMethod` son Judgment (la elección de qué
 * beta de industria usar y qué método de reapalancamiento aplicar); el
 * beta apalancado resultante es Calculation — se recompone
 * determinísticamente vía Hamada a partir de `unleveredBeta`, la
 * estructura de capital resuelta (`capitalStructure`) y la tasa
 * impositiva resuelta (`taxTreatment`) — nunca un segundo valor
 * independiente que pudiera contradecir esa recomposición sin ninguna
 * validación. Ver test de consumo dedicado (05 v1.3 §7,
 * capital-structure.v5.test.ts).
 */
export interface BetaTreatmentValue {
  unleveredBeta: number;
  releveringMethod: "hamada";
}

export interface CostOfDebtValue {
  valuePct: number;
  hierarchy: "observed_marginal" | "spread_estimate" | "fallback_documented";
}

/**
 * Bloque 3B.1 — corrección: unión discriminada por `mode`, en vez de dos
 * campos opcionales coexistentes (`capexPctOfRevenue`/`explicitPath`)
 * que permitían dos "verdades" simultáneas sin ninguna regla de
 * precedencia. Solo un modo puede estar presente a la vez —
 * estructuralmente, no por convención.
 */
export type CapexReinvestmentDriverValue =
  | { mode: "percent_of_revenue"; capexPctOfRevenue: number; maintenanceVsGrowthNotes?: string }
  | { mode: "explicit_path"; explicitPath: number[]; maintenanceVsGrowthNotes?: string };

/** Bloque 3B.1 — misma corrección que CapexReinvestmentDriverValue, mismo principio. */
export type DepreciationDaDriverValue =
  | { mode: "percent_of_revenue"; daPctOfRevenue: number }
  | { mode: "explicit_path"; explicitPath: number[] };

/**
 * `05 v1.3 §3` — solución mínima congelada para v5.0: valores explícitos
 * de ΔNWC ya resueltos fuera del motor, uno por año del horizonte. NO es
 * `NWC/Revenue`, NO es `% of Revenue`, NO es un stock — es el delta ya
 * calculado. No se modela aquí `baseOperatingNwc + ratio proyectado`
 * (alternativa general, `NOT BUILDING IN V5.0` según el mismo documento).
 */
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

/**
 * RC-5 (4F.2) — corrección: `04 §10.4` define λ preferentemente como
 * razón de exposición a ingresos domésticos, pero exigir siempre esos
 * dos porcentajes forzaba fabricarlos cuando la Evidence geográfica no
 * es suficientemente sólida (gap universal identificado en 4F.1,
 * `CONFIRMED_UNIVERSAL_METHODOLOGY_AND_CONTRACT_GAP` — no específico
 * de Alpina). Unión discriminada por `mode`, mismo principio que
 * `CapexReinvestmentDriverValue`/`DepreciationDaDriverValue`: solo un
 * modo puede estar presente a la vez — estructuralmente, no por
 * convención.
 *
 * - `observed_revenue_exposure`: método preferido (`04 §10.4`) cuando
 *   ambos porcentajes tienen Evidence suficientemente sólida. `value`
 *   debe ser el ratio `domesticRevenuePctCompany /
 *   domesticRevenuePctMarketAvg` (verificado por el preflight,
 *   `05 §5`).
 * - `direct_documented_judgment`: Judgment experto directo cuando esa
 *   Evidence no es suficientemente sólida — sin porcentajes (nunca se
 *   fabrican para satisfacer el modo observado). `source`/`rationale`
 *   del `ResolvedAssumptionEntry` que envuelve este valor documentan
 *   por qué se usó este modo; este tipo no añade un campo de notas
 *   adicional (`05 §6`).
 *
 * En ambos modos, `value` es el único dato que consume Calculation
 * (`capital-structure.ts::computeCapitalStructure`, exclusivamente
 * `countryRiskLambda.value.value`) — el motor no interpreta el modo.
 */
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

/**
 * Los 13 puntos congelados en `05-financial-engine-audit.md` v1.3 §6.
 * Representa la metodología v5 — no es un mapeo 1:1 de los 8 supuestos
 * antiguos de `CANONICAL_METHODOLOGY` (financial-methodology.ts).
 */
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

/**
 * Los 13 nombres de campo requeridos, en el mismo orden que `05 v1.3 §6`.
 * Metadata pura (una lista de nombres), del mismo patrón que
 * `TRACEABLE_FIELDS` en `calculation-provenance.ts` — no es lógica de
 * validación, es la enumeración que una futura validación (Bloque 3C)
 * consumiría.
 */
export const REQUIRED_RESOLVED_ASSUMPTION_KEYS = [
  "taxTreatment",
  "capitalStructure",
  "riskFreeRateConstruction",
  "matureErp",
  "countryRiskPremium",
  "countryRiskLambda",
  "betaTreatment",
  "costOfDebt",
  "capexReinvestmentDriver",
  "depreciationDaDriver",
  "workingCapitalDriver",
  "terminalG",
  "projectionHorizonYears",
] as const satisfies readonly (keyof ResolvedCalculationAssumptions)[];

export type ResolvedCalculationAssumptionKey = (typeof REQUIRED_RESOLVED_ASSUMPTION_KEYS)[number];

/**
 * El motor hoy solo soporta un horizonte de proyección de 5 años
 * (`canonical-financial-engine.ts`, `for(t=1;t<=5;t++)`, hardcoded).
 * Constante documental, no una validación — el preflight objetivo de
 * Bloque 3C la usaría para verificar compatibilidad (05 v1.3 §5).
 */
export const MOTOR_SUPPORTED_PROJECTION_HORIZON_YEARS = 5;
