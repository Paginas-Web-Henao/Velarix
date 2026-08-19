// Scoring del benchmark OpenAI vs Anthropic — métricas CRUDAS únicamente.
// Deliberadamente NO hay score ponderado global todavía (pedido explícito:
// "No quiero pesos arbitrarios antes de ver evidencia"). Módulo puro — sin
// red, sin SDKs.

import type { ExpectedAccount } from "./fixtures.ts";

/**
 * Extracción de JSON desde texto libre. Mirrors deliberadamente la lógica
 * de `extractJSON` en `supabase/functions/parse-document/index.ts` (mismo
 * regex, mismo try/catch, mismo fallback a null) — no se importa esa
 * función porque solo se autorizó extraer los 3 prompts a un módulo
 * compartido, no el entrypoint de la Edge Function.
 */
export function extractJSON(text: string | null): unknown | null {
  if (text == null) return null;
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {
    // se ignora — devuelve null abajo, igual que producción
  }
  return null;
}

function normalizeLabel(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Match EXACTO tras normalizar (minúsculas, diacríticos, espacios,
 * puntuación) — nunca substring. Un substring match dejaba pasar falsos
 * positivos demostrados: "ventas" (sinónimo de revenue) hacía match con
 * "Gastos de administración y ventas" (opex), porque el primero es
 * substring del segundo. Si una forma adicional debe aceptarse, se agrega
 * explícitamente a `labelSynonyms` en fixtures.ts — no se infiere aquí.
 * NO fuzzy matching, NO Levenshtein, NO embeddings, NO IA para scorear IA.
 */
function labelsMatch(extractedLabel: string, synonyms: string[]): boolean {
  const normExtracted = normalizeLabel(extractedLabel);
  if (!normExtracted) return false;
  return synonyms.some((syn) => normalizeLabel(syn) === normExtracted);
}

// ── parser_fallback ──

export interface ExtractedRow {
  original_label?: unknown;
  values?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ValueMismatch {
  id: string;
  expected: number;
  extracted: number | null;
}

// ── multi-período (HARD) — ADITIVO, ver ExpectedAccount.expectedValuesByPeriod ──

export type PeriodOutcomeKind = "exact_match" | "mismatch" | "correctly_absent" | "fabricated_absent" | "missing_reported_value";

export interface PeriodValueOutcome {
  accountId: string;
  period: string;
  expected: number | null;
  returned: number | null;
  outcome: PeriodOutcomeKind;
}

export interface UnexpectedColumnValue {
  accountId: string;
  columnKey: string;
  value: unknown;
}

export interface AccountComparison {
  accountsExpectedCount: number;
  accountsExtractedCount: number;
  truePositives: string[];
  missingAccounts: string[];
  unexpectedAccounts: string[];
  valueExactMatches: string[];
  valueMismatches: ValueMismatch[];
  /** original_label devueltos por el modelo, tal cual — para revisión humana. */
  labelOutput: string[];
  /** ADITIVO — un registro por cuenta × período, solo para cuentas con `expectedValuesByPeriod` cuando se pasa `columnHeaders` a compareAccounts(). Vacío para fixtures de un solo período (CLEAN/NOISY). */
  periodValueOutcomes: PeriodValueOutcome[];
  /** ADITIVO — `col_N` presente en `values` de una fila ya matcheada sin `columnHeaders[N]` correspondiente. Nunca se descarta en silencio. */
  unexpectedColumnValues: UnexpectedColumnValue[];
}

function firstNumericValue(row: ExtractedRow): number | null {
  if (!row.values || typeof row.values !== "object") return null;
  for (const v of Object.values(row.values)) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function coerceNumeric(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** `col_N` (N >= 1) -> índice del header cuyo contenido sea exactamente `period`. Nunca asume que col_1 es un año fijo — se deriva del CONTENIDO de columnHeaders, así headers invertidos (["Cuenta","2025","2024"]) siguen resolviendo correctamente. */
function colIndexForPeriod(columnHeaders: readonly string[], period: string): number | null {
  for (let i = 1; i < columnHeaders.length; i++) {
    if (columnHeaders[i] === period) return i;
  }
  return null;
}

const COL_KEY_RE = /^col_([1-9]\d*)$/;

/**
 * Compara UNA cuenta ya matcheada, período por período, contra
 * `expectedValuesByPeriod`. Produce un outcome por cada período esperado
 * (incluyendo exact_match — no es solo una lista de anomalías, es
 * trazabilidad completa) y detecta `col_N` sin header correspondiente en
 * la misma fila.
 */
function scoreAccountPeriods(
  account: ExpectedAccount,
  row: ExtractedRow,
  columnHeaders: readonly string[],
): { outcomes: PeriodValueOutcome[]; unexpectedColumns: UnexpectedColumnValue[] } {
  const expectedByPeriod = account.expectedValuesByPeriod ?? {};
  const values: Record<string, unknown> = row.values && typeof row.values === "object" ? row.values : {};
  const outcomes: PeriodValueOutcome[] = [];

  for (const [period, expected] of Object.entries(expectedByPeriod)) {
    const colIndex = colIndexForPeriod(columnHeaders, period);
    const key = colIndex !== null ? `col_${colIndex}` : null;
    const hasKey = key !== null && Object.prototype.hasOwnProperty.call(values, key) && values[key] !== null;
    const returned = hasKey ? coerceNumeric(values[key as string]) : null;

    let outcome: PeriodOutcomeKind;
    if (expected === null) {
      outcome = returned !== null ? "fabricated_absent" : "correctly_absent";
    } else if (returned === null) {
      outcome = "missing_reported_value";
    } else if (returned === expected) {
      outcome = "exact_match";
    } else {
      outcome = "mismatch";
    }
    outcomes.push({ accountId: account.id, period, expected, returned, outcome });
  }

  // Cualquier col_N con valor presente en la fila sin columnHeaders[N]
  // correspondiente — dato estructuralmente huérfano, no se descarta en
  // silencio ni se reasigna a otro período por adivinanza.
  const unexpectedColumns: UnexpectedColumnValue[] = [];
  for (const columnKey of Object.keys(values)) {
    const m = COL_KEY_RE.exec(columnKey);
    if (!m) continue;
    const idx = Number(m[1]);
    if (!columnHeaders[idx]) {
      unexpectedColumns.push({ accountId: account.id, columnKey, value: values[columnKey] });
    }
  }

  return { outcomes, unexpectedColumns };
}

export function compareAccounts(
  expected: ExpectedAccount[],
  extractedRows: ExtractedRow[],
  columnHeaders?: readonly string[],
): AccountComparison {
  const labelOutput = extractedRows
    .map((r) => (typeof r.original_label === "string" ? r.original_label : null))
    .filter((l): l is string => l !== null);

  const truePositives: string[] = [];
  const missingAccounts: string[] = [];
  const valueExactMatches: string[] = [];
  const valueMismatches: ValueMismatch[] = [];
  const periodValueOutcomes: PeriodValueOutcome[] = [];
  const unexpectedColumnValues: UnexpectedColumnValue[] = [];
  const matchedRowIndexes = new Set<number>();

  for (const account of expected) {
    let matchedIndex = -1;
    for (let i = 0; i < extractedRows.length; i++) {
      if (matchedRowIndexes.has(i)) continue;
      const label = extractedRows[i].original_label;
      if (typeof label === "string" && labelsMatch(label, account.labelSynonyms)) {
        matchedIndex = i;
        break;
      }
    }
    if (matchedIndex === -1) {
      missingAccounts.push(account.id);
      continue;
    }
    matchedRowIndexes.add(matchedIndex);
    truePositives.push(account.id);

    if (account.expectedValuesByPeriod && columnHeaders) {
      const { outcomes, unexpectedColumns } = scoreAccountPeriods(account, extractedRows[matchedIndex], columnHeaders);
      periodValueOutcomes.push(...outcomes);
      unexpectedColumnValues.push(...unexpectedColumns);
      continue;
    }

    // Camino legacy — CLEAN/NOISY (1 período) y respaldo si compareAccounts()
    // se invoca sin columnHeaders para una cuenta con expectedValuesByPeriod.
    const extractedValue = firstNumericValue(extractedRows[matchedIndex]);
    if (extractedValue !== null && extractedValue === account.expectedValue) {
      valueExactMatches.push(account.id);
    } else {
      valueMismatches.push({ id: account.id, expected: account.expectedValue, extracted: extractedValue });
    }
  }

  const unexpectedAccounts = extractedRows
    .map((r, i) => ({ row: r, i }))
    .filter(({ i }) => !matchedRowIndexes.has(i))
    .map(({ row }) => (typeof row.original_label === "string" ? row.original_label : "(sin etiqueta)"));

  return {
    accountsExpectedCount: expected.length,
    accountsExtractedCount: extractedRows.length,
    truePositives,
    missingAccounts,
    unexpectedAccounts,
    valueExactMatches,
    valueMismatches,
    labelOutput,
    periodValueOutcomes,
    unexpectedColumnValues,
  };
}

// ── period_detector (y chequeo secundario de períodos dentro de parser_fallback) ──

export interface PeriodComparison {
  expectedPeriods: string[];
  returnedPeriods: string[];
  exactSetMatch: boolean;
  missingPeriods: string[];
  unexpectedPeriods: string[];
}

export function comparePeriods(expected: string[], returned: string[]): PeriodComparison {
  const expectedSet = new Set(expected);
  const returnedSet = new Set(returned);
  const missingPeriods = expected.filter((p) => !returnedSet.has(p));
  const unexpectedPeriods = returned.filter((p) => !expectedSet.has(p));
  const exactSetMatch = missingPeriods.length === 0 && unexpectedPeriods.length === 0 && expectedSet.size === returnedSet.size;
  return { expectedPeriods: expected, returnedPeriods: returned, exactSetMatch, missingPeriods, unexpectedPeriods };
}

// ── document_classifier ──

export interface ClassifierComparison {
  expectedType: string;
  returnedType: string | null;
  exactMatch: boolean;
  confidence: number | null;
  warnings: string[];
  puedeContinuar: boolean | null;
}

export function compareClassifier(expectedType: string, parsed: unknown): ClassifierComparison {
  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const returnedType = typeof obj.tipo_documento === "string" ? obj.tipo_documento : null;
  const confidence = typeof obj.confianza === "number" ? obj.confianza : null;
  const warnings = Array.isArray(obj.advertencias) ? obj.advertencias.filter((w): w is string => typeof w === "string") : [];
  const puedeContinuar = typeof obj.puede_continuar === "boolean" ? obj.puede_continuar : null;
  return {
    expectedType,
    returnedType,
    exactMatch: returnedType === expectedType,
    confidence,
    warnings,
    puedeContinuar,
  };
}
