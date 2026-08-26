// Fix — PARALLEL CANONICAL REBUILD BUG.
//
// build-structured-input/index.ts y continuar-tras-revision/index.ts
// compartían solo la derivación NUMÉRICA (`deriveCoreFinancialFields`),
// pero cada uno seguía ensamblando su propio objeto `structuredInput` con
// un literal independiente: build-structured-input producía el contrato
// v2.3 completo (moneda, snapshot con fallback Damodaran, provenance
// técnica, quality_flags/validation_notes derivados), mientras
// continuar-tras-revision reconstruía en paralelo un v1.1 incompleto (sin
// accounts_payable, sin moneda, sin snapshot_data/macro_data, sin
// provenance, con quality_flags/validation_notes hardcodeados a un único
// string estático) — ver
// structured-input-canonical-contract.regression.test.ts.
//
// `buildCanonicalStructuredInput` es la ÚNICA implementación pura del
// contrato completo, extraída literalmente del comportamiento de
// build-structured-input/index.ts (fuente de verdad — build ya estaba
// validado remotamente antes de este fix). Ambas Edge Functions llaman a
// esta misma función; ninguna vuelve a ensamblar el payload por su cuenta.
//
// Sin imports de URL, sin Supabase, sin Deno, sin `serve()`, sin
// variables de entorno, sin `fetch`, sin timestamps generados
// internamente — todo lo variable entra por parámetros. Importable desde
// Deno (import relativo `.ts`) y desde Vitest indistintamente, igual que
// el resto de `_shared/`.

import { deriveCoreFinancialFields } from "./structured-input-derivations.ts";
import { sumAccountValue, type HomologatedAccountRow } from "./financial-accounts.ts";
import { computeTotalConversionFactor, type CurrencyCode } from "./currency.ts";
import {
  buildCalculationProvenance,
  type HomologationReference,
  type CalculationProvenance,
} from "./calculation-provenance.ts";
import type { PeriodSelectionMode } from "./period-resolution.ts";

/** Única fuente de verdad para el número de versión del contrato canónico — nunca un literal duplicado en cada Edge Function. */
export const CANONICAL_STRUCTURED_INPUT_VERSION = "2.3";

// ═══════════════════════════════════════════════════════════════
// Damodaran 2026 fallback — 15 sectores Colombia.
//
// Movido literalmente desde build-structured-input/index.ts (antes
// privado a ese archivo) para que continuar-tras-revision pueda resolver
// el mismo fallback de snapshot cuando no existe fila en
// `external_snapshots` para el sector, en vez de omitir snapshot_data/
// macro_data como hacía antes de este fix. Ningún valor de benchmark
// cambia — solo su ubicación.
// ═══════════════════════════════════════════════════════════════

interface SectorSnapshotBenchmark {
  beta: number;
  evEbitda: number;
  evRevenue: number;
  ebitdaMargin: number;
  wacc: number;
}

const SECTOR_SNAPSHOTS_2026: Record<string, SectorSnapshotBenchmark> = {
  "Software / Tecnología":             { beta: 1.22, evEbitda: 13.0, evRevenue: 4.8, ebitdaMargin: 26.0, wacc: 11.2 },
  "Retail / Comercio":                 { beta: 1.08, evEbitda: 9.5,  evRevenue: 2.2, ebitdaMargin: 18.5, wacc: 10.2 },
  "Servicios empresariales":           { beta: 0.98, evEbitda: 10.5, evRevenue: 2.6, ebitdaMargin: 20.5, wacc: 9.6  },
  "Manufactura":                       { beta: 1.18, evEbitda: 8.5,  evRevenue: 1.9, ebitdaMargin: 16.5, wacc: 10.6 },
  "Consumo / Consumer Products":       { beta: 0.93, evEbitda: 11.5, evRevenue: 3.1, ebitdaMargin: 22.5, wacc: 9.1  },
  "Alimentos y bebidas":               { beta: 0.78, evEbitda: 10.5, evRevenue: 2.3, ebitdaMargin: 18.5, wacc: 9.1  },
  "Agroindustria":                     { beta: 0.83, evEbitda: 8.5,  evRevenue: 1.6, ebitdaMargin: 15.5, wacc: 9.6  },
  "Salud":                             { beta: 0.88, evEbitda: 11.5, evRevenue: 2.9, ebitdaMargin: 20.5, wacc: 9.6  },
  "Educación":                         { beta: 0.73, evEbitda: 9.5,  evRevenue: 2.1, ebitdaMargin: 18.5, wacc: 8.6  },
  "Transporte y logística":            { beta: 1.03, evEbitda: 8.5,  evRevenue: 1.7, ebitdaMargin: 14.5, wacc: 10.1 },
  "Construcción e infraestructura":    { beta: 1.13, evEbitda: 7.5,  evRevenue: 1.5, ebitdaMargin: 13.5, wacc: 10.6 },
  "Energía y utilities":               { beta: 0.52, evEbitda: 9.5,  evRevenue: 3.1, ebitdaMargin: 36.0, wacc: 8.1  },
  "Turismo y hospitalidad":            { beta: 1.28, evEbitda: 9.5,  evRevenue: 2.1, ebitdaMargin: 16.5, wacc: 11.1 },
  "Inmobiliario":                      { beta: 0.68, evEbitda: 13.5, evRevenue: 5.2, ebitdaMargin: 41.0, wacc: 8.6  },
  "Financiero / Seguros":              { beta: 0.83, evEbitda: 10.5, evRevenue: 3.6, ebitdaMargin: 31.0, wacc: 9.1  },
};

export interface DefaultSnapshot {
  id: string;
  effective_date: string;
  sector: string;
  source_version: string;
  data_payload: unknown;
  macro_payload: unknown;
}

/**
 * Fallback determinista cuando no hay fila en `external_snapshots` para el
 * sector. `exchangeRate` entra por parámetro (antes era la constante
 * módulo `TRM` de build-structured-input/index.ts) — mismo valor real
 * (4080), ahora explícito en el punto de llamada de cada Edge Function en
 * vez de estar hardcodeado dos veces.
 */
export function buildDefaultSnapshot(sector: string, exchangeRate: number): DefaultSnapshot {
  const bench = SECTOR_SNAPSHOTS_2026[sector] || SECTOR_SNAPSHOTS_2026["Servicios empresariales"];
  return {
    id: `snap_default_${sector.toLowerCase().replace(/\s+/g, "_")}`,
    effective_date: "2026-01-15",
    sector,
    source_version: "damodaran_2026_jan",
    data_payload: {
      sector_data: {
        beta_unlevered:    { value: bench.beta, source: "Damodaran Jan 2026", date: "2026-01" },
        ev_ebitda_ref:     { value: bench.evEbitda, source: "Damodaran Jan 2026", date: "2026-01" },
        ev_revenue_ref:    { value: bench.evRevenue, source: "Damodaran Jan 2026", date: "2026-01" },
        ebitda_margin_ref: { value: bench.ebitdaMargin, source: "Damodaran Jan 2026", date: "2026-01" },
        wacc_ref:          { value: bench.wacc, source: "Damodaran Jan 2026", date: "2026-01" },
        erp:               { value: 5.80, source: "Damodaran ERP Emerging Markets Jan 2026", date: "2026-01" },
      },
    },
    macro_payload: {
      macro_colombia: {
        policy_rate:    { value: 7.50, source: "Banco de la República", date: "2026-03" },
        inflation_ipc:  { value: 3.88, source: "DANE", date: "2026-02" },
        trm_avg:        { value: exchangeRate, source: "Banco de la República", date: "2026-02" },
        gdp_growth:     { value: 2.8, source: "DANE", date: "2025-Q4" },
      },
      risk_market: {
        risk_free_rate:       { value: 4.35, source: "US Treasury 10Y", date: "2026-03" },
        country_risk_premium: { value: 2.20, source: "EMBI Colombia", date: "2026-03" },
      },
    },
  };
}

/** Fila de `account_homologations` tal cual la devuelve `select("*")` — superset de `HomologatedAccountRow` (agrega `id`/`document_id`, requeridos por provenance). */
export interface CanonicalStructuredInputAccountRow extends HomologatedAccountRow {
  id: string;
  document_id: string | null;
}

/**
 * Snapshot ya resuelto por el llamador (fila real de `external_snapshots`,
 * o `buildDefaultSnapshot(...)` si no hay ninguna) — el builder no hace
 * I/O ni decide el fallback, solo consume el resultado. `id` es
 * exclusivamente un id REAL de `external_snapshots` (nunca el id
 * sintético de `buildDefaultSnapshot`) — mismo criterio que
 * build-structured-input aplicaba con `dbSnapshot?.id || null`.
 */
export interface CanonicalSnapshotInput {
  id: string | null;
  data_payload: unknown;
  macro_payload: unknown;
}

export interface BuildCanonicalStructuredInputParams {
  analysisId: string;
  sector: string;
  expectedGrowth: number;
  accounts: readonly CanonicalStructuredInputAccountRow[];
  basePeriod: string | null;
  periods: readonly string[];
  periodSelectionMode: PeriodSelectionMode;
  monedaAnalisis: CurrencyCode;
  monedaDocumento: CurrencyCode | null;
  scaleFactor: number;
  exchangeRate: number;
  snapshot: CanonicalSnapshotInput;
  /** Id de la fila de `structured_inputs` que va a persistir este payload — para `provenance.structured_input_id`. */
  structuredInputId: string | null;
  createdAt: string;
}

export interface CanonicalIncomeStatement {
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

export interface CanonicalBalanceSheet {
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

export interface CanonicalStructuredInput {
  analysis_id: string;
  sector: string;
  expected_growth: number;
  moneda_analisis: CurrencyCode;
  moneda_documento: CurrencyCode | null;
  factor_conversion: number;
  periods: string[];
  base_period: string | null;
  income_statement: CanonicalIncomeStatement;
  balance_sheet: CanonicalBalanceSheet;
  quality_flags: string[];
  validation_notes: string[];
  snapshot_id: string | null;
  snapshot_data: unknown;
  macro_data: unknown;
  version_input: typeof CANONICAL_STRUCTURED_INPUT_VERSION;
  created_at: string;
  provenance: CalculationProvenance;
}

/**
 * Único constructor del contrato canónico `structured_input` v2.3.
 * Extraído literalmente de build-structured-input/index.ts — misma
 * aritmética, mismos defaults, mismas reglas de quality_flags/
 * validation_notes, misma semántica de moneda y de provenance. No
 * reinterpreta metodología ni cambia ningún valor respecto al
 * comportamiento ya validado remotamente.
 */
export function buildCanonicalStructuredInput(
  params: BuildCanonicalStructuredInputParams,
): CanonicalStructuredInput {
  const {
    analysisId,
    sector,
    expectedGrowth,
    accounts,
    basePeriod,
    periods,
    periodSelectionMode,
    monedaAnalisis,
    monedaDocumento,
    scaleFactor,
    exchangeRate,
    snapshot,
    structuredInputId,
    createdAt,
  } = params;

  const core = deriveCoreFinancialFields(accounts, basePeriod);
  const {
    revenue, costOfSales, opex, da, interestExpense, taxes, netIncome,
    ebitda, ebit,
    cash, accountsReceivable, inventory, ppe, accountsPayable,
    currentDebt, longTermDebt, financialDebtTotal,
    equity, totalAssets, totalLiabilities,
  } = core;

  const qualityFlags: string[] = [];
  if (inventory == null) qualityFlags.push("sin_inventario_declarado");
  if (accountsReceivable == null) qualityFlags.push("sin_cartera_declarada");
  if (interestExpense == null) qualityFlags.push("sin_gastos_financieros");
  if (ebitda == null) qualityFlags.push("ebitda_no_derivable");

  const { totalConversionFactor: factorTotal, currencyConversionApplied, currencyUndetected } =
    computeTotalConversionFactor({
      sourceCurrency: monedaDocumento,
      reportingCurrency: monedaAnalisis,
      scaleFactor,
      exchangeRate,
    });

  if (currencyUndetected) {
    qualityFlags.push("moneda_documento_no_detectada");
  } else if (currencyConversionApplied) {
    qualityFlags.push(`Valores convertidos de ${monedaDocumento} a ${monedaAnalisis} (TRM ${exchangeRate})`);
  } else if (factorTotal !== 1) {
    qualityFlags.push(`Factor de escala aplicado: ${scaleFactor}`);
  }

  const conv = (v: number | null) => (v !== null ? v * factorTotal : null);

  const validationNotes: string[] = [];
  if (totalAssets != null && totalLiabilities != null && equity != null) validationNotes.push("Ecuación patrimonial validada");
  if (ebitda != null && sumAccountValue(accounts, "ebitda", basePeriod ?? undefined) == null) validationNotes.push("EBITDA calculado desde componentes");

  const homologationRefs: HomologationReference[] = accounts.map((a) => ({
    id: a.id,
    document_id: a.document_id ?? null,
    canonical_account: a.canonical_account,
    period: a.period ?? null,
  }));

  const provenance = buildCalculationProvenance({
    analysisId,
    structuredInputId,
    homologationRows: homologationRefs,
    monedaAnalisis,
    monedaDocumento,
    factorConversion: factorTotal,
    builtAt: createdAt,
    periodSelection: {
      base_period: basePeriod,
      selection_mode: periodSelectionMode,
      available_periods: [...periods],
    },
  });

  return {
    analysis_id: analysisId,
    sector,
    expected_growth: expectedGrowth,
    moneda_analisis: monedaAnalisis,
    moneda_documento: monedaDocumento,
    factor_conversion: factorTotal,
    periods: [...periods],
    base_period: basePeriod,
    income_statement: {
      revenue: conv(revenue), cost_of_sales: conv(costOfSales), opex: conv(opex), da: conv(da),
      ebitda: conv(ebitda), ebit: conv(ebit), interest_expense: conv(interestExpense), taxes: conv(taxes),
      net_income: conv(netIncome),
    },
    balance_sheet: {
      cash: conv(cash), accounts_receivable: conv(accountsReceivable), inventory: conv(inventory),
      accounts_payable: conv(accountsPayable), ppe: conv(ppe),
      current_financial_debt: conv(currentDebt), long_term_financial_debt: conv(longTermDebt),
      financial_debt_total: conv(financialDebtTotal),
      equity: conv(equity), total_assets: conv(totalAssets), total_liabilities: conv(totalLiabilities),
    },
    quality_flags: qualityFlags,
    validation_notes: validationNotes,
    snapshot_id: snapshot.id,
    snapshot_data: snapshot.data_payload,
    macro_data: snapshot.macro_payload,
    version_input: CANONICAL_STRUCTURED_INPUT_VERSION,
    created_at: createdAt,
    provenance,
  };
}
