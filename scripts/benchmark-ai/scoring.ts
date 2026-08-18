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

export function compareAccounts(expected: ExpectedAccount[], extractedRows: ExtractedRow[]): AccountComparison {
  const labelOutput = extractedRows
    .map((r) => (typeof r.original_label === "string" ? r.original_label : null))
    .filter((l): l is string => l !== null);

  const truePositives: string[] = [];
  const missingAccounts: string[] = [];
  const valueExactMatches: string[] = [];
  const valueMismatches: ValueMismatch[] = [];
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
