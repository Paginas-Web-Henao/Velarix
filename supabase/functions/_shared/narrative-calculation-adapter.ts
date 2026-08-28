// Bloque 1E — Subbloque 2: adaptador puro `calculation_result` → narrativa.
//
// Sin imports de URL, sin Supabase, sin Deno, sin `serve()`, sin llamadas a
// IA, sin efectos secundarios — importable desde Deno y desde Vitest
// indistintamente (mismo patrón que el resto de `_shared/`).
//
// Regla dura, igual que `pdf-canonical-mapper.ts` en el frontend: este
// archivo NUNCA recalcula WACC, DCF, valor terminal, enterprise value,
// equity value, márgenes, leverage, cobertura de intereses ni proyecciones.
// Todo sale 1:1 de `calculation_result` — solo se renombra/reorganiza.
//
// Contexto del cambio: `generate-narrative/index.ts` esperaba hasta ahora un
// tercer contrato legacy de `calculation_output` (campos como `ke`,
// `evEbitdaImplied`, `proyecciones`, `margenEBITDA`, `leverageDeudaEBITDA`,
// `liquidezCorriente`) que NO corresponde ni al motor canónico
// (`canonical-financial-engine.ts`) ni al motor cliente — parece un
// contrato de una iteración anterior del proyecto. Este adaptador traduce
// el `calculation_result` canónico real al view model mínimo que la
// narrativa necesita, sin inventar ni derivar ninguna cifra ausente.
//
// `liquidezCorriente` en particular NO existe en `CanonicalKPIs` (nunca
// existió tampoco en el motor cliente) — no se omite por error, se omite
// porque no hay ninguna fuente real de esa cifra. La regla de riesgo
// LIQ_001 que dependía de ella se elimina, no se rellena con 0 ni se
// infiere de otro campo.

import type {
  CanonicalFinancialEngineResult,
  YearProjection,
  ScenarioResult,
  CanonicalKPIs,
} from "./canonical-financial-engine.ts";
import { CALCULATION_SCHEMA_VERSION } from "./calculation-versioning.ts";
import type { CalculationVersionInfo } from "./calculation-versioning.ts";
import type { CalculationProvenance } from "./calculation-provenance.ts";
import type { SourceInputSnapshot, SnapshotIncomeStatement, SnapshotBalanceSheet } from "./source-input-snapshot.ts";

/** Mismo envelope que `ejecutar-calculo/index.ts` persiste en `analyses.calculation_result`. */
export interface PersistedCalculationResult extends CanonicalFinancialEngineResult {
  version: CalculationVersionInfo;
  provenance: CalculationProvenance;
  source_input_snapshot: SourceInputSnapshot;
}

/** Re-exportada para que los callers (generate-narrative/index.ts, tests) no dupliquen el literal de versión soportada. */
export const SUPPORTED_CALCULATION_SCHEMA_VERSION = CALCULATION_SCHEMA_VERSION;

export class CalculationResultRequiredError extends Error {
  readonly code = "CALCULATION_RESULT_REQUIRED" as const;
  constructor(message = "calculation_result no existe para este analysis.") {
    super(message);
    this.name = "CalculationResultRequiredError";
  }
}

export class UnsupportedCalculationResultError extends Error {
  readonly code = "UNSUPPORTED_CALCULATION_RESULT" as const;
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedCalculationResultError";
  }
}

/**
 * Gate técnico fail-closed: valida que `calculation_result` sea un
 * envelope canónico completo y de la versión de schema soportada, sin
 * inspeccionar nada del contenido financiero todavía. No recalcula, no
 * repara, no completa campos ausentes — solo decide si es seguro
 * adaptarlo o si hay que rechazar con un código explícito.
 */
export function assertNarrativeCalculationResult(calculationResult: unknown): PersistedCalculationResult {
  if (calculationResult === null || calculationResult === undefined || typeof calculationResult !== "object") {
    throw new CalculationResultRequiredError();
  }
  const cr = calculationResult as Partial<PersistedCalculationResult>;

  if (!cr.version || typeof cr.version !== "object") {
    throw new UnsupportedCalculationResultError("calculation_result.version ausente — envelope no versionado.");
  }
  if (typeof cr.version.input_fingerprint !== "string" || cr.version.input_fingerprint.length === 0) {
    throw new UnsupportedCalculationResultError("calculation_result.version.input_fingerprint ausente.");
  }
  if (cr.version.calculation_schema_version !== CALCULATION_SCHEMA_VERSION) {
    throw new UnsupportedCalculationResultError(
      `calculation_schema_version no soportada: "${cr.version.calculation_schema_version}" (se requiere "${CALCULATION_SCHEMA_VERSION}").`,
    );
  }
  if (!cr.source_input_snapshot || typeof cr.source_input_snapshot !== "object") {
    throw new UnsupportedCalculationResultError("calculation_result.source_input_snapshot ausente.");
  }
  if (!cr.kpis || !cr.valuation || !cr.projections || !cr.scenarios) {
    throw new UnsupportedCalculationResultError("calculation_result no tiene la forma esperada del motor canónico (kpis/valuation/projections/scenarios).");
  }

  // El mapper también consume sensitivityMatrix/sectorBenchmark/moneda y
  // scenarios.base.assumptions.growth — se valida aquí su presencia/shape
  // mínimo (nunca si growth "es correcto" ni ninguna otra cuestión
  // metodológica) para que el mapper nunca reciba un envelope incompleto.
  if (!Array.isArray(cr.sensitivityMatrix)) {
    throw new UnsupportedCalculationResultError("calculation_result.sensitivityMatrix ausente o inválido.");
  }
  if (!cr.sectorBenchmark || typeof cr.sectorBenchmark !== "object") {
    throw new UnsupportedCalculationResultError("calculation_result.sectorBenchmark ausente.");
  }
  if (typeof cr.moneda !== "string" || cr.moneda.length === 0) {
    throw new UnsupportedCalculationResultError("calculation_result.moneda ausente o vacía.");
  }
  if (!cr.scenarios.base || typeof cr.scenarios.base !== "object") {
    throw new UnsupportedCalculationResultError("calculation_result.scenarios.base ausente.");
  }
  if (!cr.scenarios.base.assumptions || typeof cr.scenarios.base.assumptions !== "object") {
    throw new UnsupportedCalculationResultError("calculation_result.scenarios.base.assumptions ausente.");
  }
  if (typeof cr.scenarios.base.assumptions.growth !== "number") {
    throw new UnsupportedCalculationResultError("calculation_result.scenarios.base.assumptions.growth ausente o no numérico.");
  }

  return cr as PersistedCalculationResult;
}

/** Métricas financieras que la narrativa consume, renombradas 1:1 desde `valuation`/`kpis`/`scenarios.base.assumptions` — ninguna se deriva. */
export interface NarrativeCalculationViewModel {
  enterpriseValue: number;
  equityValue: number;
  wacc: number;
  costOfEquity: number;
  costOfDebtAfterTax: number;
  betaLevered: number;
  evEbitda: number;
  evRevenue: number;
  netDebt: number;
  evLow: number;
  evHigh: number;
  terminalValue: number;
  discountedTV: number;
  waccWarning: string | null;
  /** Supuesto de crecimiento realmente usado por el motor canónico (`scenarios.base.assumptions.growth`) — no un campo top-level legacy. */
  growth: number;
  kpis: CanonicalKPIs;
  projections: YearProjection[];
  scenarios: { pessimistic: ScenarioResult; base: ScenarioResult; optimistic: ScenarioResult };
  sensitivityMatrix: { waccDelta: number; growthDelta: number; ev: number }[];
  sectorBenchmark: { beta: number; ebitdaMargin: number; evEbitda: number; evRevenue: number; waccRef: number };
  moneda: string;
  /**
   * Evidencia histórica del MISMO cálculo — 1:1 desde
   * `source_input_snapshot`, sin derivar nada (no se suma, no se divide,
   * no se calcula ningún ratio nuevo aquí). Solo el año/período base, no
   * una serie histórica — las secciones que la consumen no deben afirmar
   * una tendencia que esta única observación no sustenta.
   */
  historical: {
    base_period: string | null;
    income_statement: SnapshotIncomeStatement;
    balance_sheet: SnapshotBalanceSheet;
  };
}

/**
 * Adaptador puro: renombra/reorganiza `calculation_result` canónico al
 * view model de arriba. No recalcula ninguna fórmula financiera.
 */
export function mapCalculationResultToNarrativeViewModel(
  calculationResult: PersistedCalculationResult,
): NarrativeCalculationViewModel {
  const { valuation, kpis, scenarios, projections, sensitivityMatrix, sectorBenchmark, moneda, source_input_snapshot } = calculationResult;
  return {
    enterpriseValue: valuation.enterpriseValue,
    equityValue: valuation.equityValue,
    wacc: valuation.wacc,
    costOfEquity: valuation.costOfEquity,
    costOfDebtAfterTax: valuation.costOfDebtAfterTax,
    betaLevered: valuation.betaLevered,
    evEbitda: valuation.evEbitda,
    evRevenue: valuation.evRevenue,
    netDebt: valuation.netDebt,
    evLow: valuation.evLow,
    evHigh: valuation.evHigh,
    terminalValue: valuation.terminalValue,
    discountedTV: valuation.discountedTV,
    waccWarning: valuation.waccWarning,
    growth: scenarios.base.assumptions.growth,
    kpis,
    projections,
    scenarios,
    sensitivityMatrix,
    sectorBenchmark,
    moneda,
    // Pass-through puro — nunca se suma, divide ni deriva ningún ratio aquí.
    historical: {
      base_period: source_input_snapshot.base_period,
      income_statement: source_input_snapshot.income_statement,
      balance_sheet: source_input_snapshot.balance_sheet,
    },
  };
}

/** Metadata técnica de trazabilidad para persistir en `report_narratives.sections_payload._calculation_meta` — sin schema nuevo. */
export interface CalculationMeta {
  input_fingerprint: string;
  calculation_schema_version: string;
  canonical_engine_version: string;
  methodology_version: string;
  calculated_at: string;
  structured_input_id: string | null;
  structured_input_version: string | null;
  base_period: string | null;
}

export function buildCalculationMeta(calculationResult: PersistedCalculationResult): CalculationMeta {
  return {
    input_fingerprint: calculationResult.version.input_fingerprint,
    calculation_schema_version: calculationResult.version.calculation_schema_version,
    canonical_engine_version: calculationResult.version.canonical_engine_version,
    methodology_version: calculationResult.version.methodology_version,
    calculated_at: calculationResult.version.calculated_at,
    structured_input_id: calculationResult.source_input_snapshot.structured_input_id,
    structured_input_version: calculationResult.source_input_snapshot.version_input,
    base_period: calculationResult.source_input_snapshot.base_period,
  };
}

// ═══════════════════════════════════════════════════════════════
// Motor de Riesgos Determinístico — adaptado al view model canónico
// (antes vivía en generate-narrative/index.ts sobre nombres legacy)
// ═══════════════════════════════════════════════════════════════

export interface NarrativeRisk {
  id: string;
  nombre: string;
  categoria: string;
  indicador: string;
  umbral: string;
  impacto: string;
  probabilidad: string;
}

/**
 * Mismos 7 supuestos de umbral que el motor original (3.0x, 2.0x, 0%, 50%,
 * 0, 2.0x) — ninguno se modifica en este subbloque. Se elimina únicamente
 * la regla LIQ_001 (razón corriente), porque `liquidezCorriente` no existe
 * en `CanonicalKPIs` — no se sustituye por ningún campo aproximado.
 */
export function detectRisks(vm: NarrativeCalculationViewModel): NarrativeRisk[] {
  const risks: NarrativeRisk[] = [];
  const { kpis } = vm;

  // END_001: Apalancamiento elevado (antes leverageDeudaEBITDA)
  if (typeof kpis.leverage === "number" && kpis.leverage > 3.0) {
    risks.push({ id: "END_001", nombre: "Nivel de apalancamiento elevado", categoria: "Endeudamiento", indicador: `Deuda neta/EBITDA: ${kpis.leverage.toFixed(2)}x`, umbral: "> 3.0x", impacto: "Alto", probabilidad: "Media" });
  }

  // END_002: Cobertura de intereses baja (antes coberturaIntereses)
  if (typeof kpis.interestCoverage === "number" && kpis.interestCoverage < 2.0) {
    risks.push({ id: "END_002", nombre: "Cobertura de intereses insuficiente", categoria: "Endeudamiento", indicador: `Cobertura: ${kpis.interestCoverage.toFixed(1)}x`, umbral: "< 2.0x", impacto: "Alto", probabilidad: "Alta" });
  }

  // RENT_001: EBITDA margin negativo (antes margenEBITDA)
  if (typeof kpis.ebitdaMargin === "number" && kpis.ebitdaMargin < 0) {
    risks.push({ id: "RENT_001", nombre: "Pérdidas operativas en el período analizado", categoria: "Rentabilidad", indicador: `Margen EBITDA: ${kpis.ebitdaMargin.toFixed(1)}%`, umbral: "< 0%", impacto: "Alto", probabilidad: "Alta" });
  }

  // RENT_003: Net margin negativo con EBITDA positivo (antes margenNeto/margenEBITDA)
  if (typeof kpis.netMargin === "number" && kpis.netMargin < 0 && typeof kpis.ebitdaMargin === "number" && kpis.ebitdaMargin > 0) {
    risks.push({ id: "RENT_003", nombre: "Resultado neto negativo a pesar de EBITDA positivo", categoria: "Rentabilidad", indicador: `Margen neto: ${kpis.netMargin.toFixed(1)}%`, umbral: "< 0% con EBITDA positivo", impacto: "Medio", probabilidad: "Media" });
  }

  // CREC_001: Growth agresivo (antes top-level `growth` del contrato legacy)
  if (typeof vm.growth === "number" && vm.growth > 50) {
    risks.push({ id: "CREC_001", nombre: "Supuesto de crecimiento agresivo en el modelo", categoria: "Crecimiento", indicador: `Crecimiento asumido: ${vm.growth}%`, umbral: "> 50% anual", impacto: "Alto", probabilidad: "Media" });
  }

  // VAL_001: EV negativo
  if (typeof vm.enterpriseValue === "number" && vm.enterpriseValue < 0) {
    risks.push({ id: "VAL_001", nombre: "Enterprise Value negativo bajo los supuestos del modelo", categoria: "Valoración", indicador: `EV: ${vm.moneda} ${Math.round(vm.enterpriseValue).toLocaleString()}`, umbral: "EV < 0", impacto: "Alto", probabilidad: "Alta" });
  }

  // VAL_002: Alta sensibilidad. `evLow > 0` reemplaza el chequeo "truthy"
  // original (`output.evLow &&`) — explícito sobre número vs
  // ausente/cero, evita además una división por cero si evLow llegara a
  // ser 0 (el original la evitaba por accidente vía falsy(0), no por
  // diseño). Mismo umbral 2.0x.
  if (typeof vm.evLow === "number" && typeof vm.evHigh === "number" && vm.evLow > 0 && vm.evHigh / vm.evLow > 2.0) {
    risks.push({ id: "VAL_002", nombre: "Alta sensibilidad del valor a supuestos del modelo", categoria: "Valoración", indicador: `Rango EV: ${vm.moneda} ${(vm.evLow / 1e6).toFixed(1)}M – ${(vm.evHigh / 1e6).toFixed(1)}M`, umbral: "Ratio > 2.0x", impacto: "Medio", probabilidad: "Media" });
  }

  const impOrder: Record<string, number> = { Alto: 0, Medio: 1, Bajo: 2 };
  const probOrder: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 };
  risks.sort((a, b) => (impOrder[a.impacto] - impOrder[b.impacto]) || (probOrder[a.probabilidad] - probOrder[b.probabilidad]));
  return risks;
}
