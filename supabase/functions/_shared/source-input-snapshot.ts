// Bloque 1E — Subbloque 1 (corrección): snapshot del structured input EXACTO
// que `ejecutar-calculo` ya recuperó, validó y usó para el fingerprint y
// para `runCanonicalFinancialEngine`.
//
// Sin imports de URL, sin Supabase, sin Deno, sin `serve()`, sin efectos
// secundarios — función pura, importable desde Deno y desde Vitest
// indistintamente (mismo patrón que `calculation-versioning.ts` /
// `calculation-provenance.ts`).
//
// Motivo: `calculation_result` no re-emitía las cifras base (año 0) que
// consumió el motor — el PDF las tenía que volver a pedir a
// `structured_inputs`, lo que permite que un `calculation_result` viejo
// se combine con un `structured_input` más nuevo (o viceversa) al generar
// un informe, rompiendo la trazabilidad "este PDF corresponde exactamente
// a este cálculo". Este snapshot congela, dentro del propio
// `calculation_result`, el input que realmente produjo ese cálculo.
//
// Regla dura: esta función NO recalcula ni deriva ninguna cifra — copia
// literal de lo que ya está en el `input` resuelto por
// `resolveStructuredInput` (el mismo objeto que ya se usa para
// `computeInputFingerprint` y `runCanonicalFinancialEngine`). "Ausente"
// se preserva como `null`, nunca como `0`.

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

export interface SourceInputSnapshot {
  structured_input_id: string | null;
  version_input: string | null;
  base_period: string | null;
  sector: string;
  moneda_analisis: string | null;
  income_statement: SnapshotIncomeStatement;
  balance_sheet: SnapshotBalanceSheet;
}

const INCOME_STATEMENT_FIELDS = [
  "revenue", "cost_of_sales", "opex", "da", "ebitda", "ebit",
  "interest_expense", "taxes", "net_income",
] as const;

const BALANCE_SHEET_FIELDS = [
  "cash", "accounts_receivable", "inventory", "accounts_payable", "ppe",
  "current_financial_debt", "long_term_financial_debt", "financial_debt_total",
  "equity", "total_assets", "total_liabilities",
] as const;

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function pickNumericFields<K extends string>(
  source: unknown,
  fields: readonly K[],
): Record<K, number | null> {
  const src = (source && typeof source === "object" ? source : {}) as Record<string, unknown>;
  const out = {} as Record<K, number | null>;
  for (const field of fields) out[field] = num(src[field]);
  return out;
}

/**
 * Construye el snapshot a partir del MISMO `input` resuelto que
 * `ejecutar-calculo` ya usó para fingerprint y motor — no consulta nada,
 * no deriva nada. `structuredInputId`/`versionInput` deben venir de la
 * MISMA fila de `structured_inputs` ya leída (o `null` si el cálculo cayó
 * al fallback legacy `analyses.input_payload`, caso en el que no existe
 * fila real).
 */
export function buildSourceInputSnapshot(params: {
  structuredInputId: string | null;
  versionInput: string | null;
  sector: string;
  input: {
    base_period?: unknown;
    moneda_analisis?: unknown;
    income_statement?: unknown;
    balance_sheet?: unknown;
  };
}): SourceInputSnapshot {
  return {
    structured_input_id: params.structuredInputId,
    version_input: params.versionInput,
    base_period: str(params.input.base_period),
    sector: params.sector,
    moneda_analisis: str(params.input.moneda_analisis),
    income_statement: pickNumericFields(params.input.income_statement, INCOME_STATEMENT_FIELDS),
    balance_sheet: pickNumericFields(params.input.balance_sheet, BALANCE_SHEET_FIELDS),
  };
}
