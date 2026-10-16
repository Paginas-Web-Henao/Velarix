// Moneda del análisis, moneda del documento, escala y tipo de cambio que
// pueden entrar al structured input. Decisión pura (sin I/O).
//
// VERSIONADO (hay evidence run activo): nada implícito. La moneda del
// análisis debe ser COP o USD explícitos; la metadata documental llega ya
// validada por `resolveActiveEvidenceDocumentMetadata` (moneda reconocida,
// escala DECLARED); si las monedas difieren se exige un tipo de cambio
// explícito y trazable, que hoy no existe → EXCHANGE_RATE_REQUIRED. Nunca
// COP por defecto, nunca factor 1 por defecto, nunca TRM fija.
// LEGACY (sin run activo): LEGACY_COMPATIBILITY_DEFAULT — COP si la moneda
// del análisis no se reconoce y TRM fija; se conserva solo para no alterar
// Alpina ni los golden cases. No es el comportamiento correcto v5.
// No cambia la fórmula de conversión (BL-03, `currency.ts`).

import { normalizeCurrencyCode, type CurrencyCode } from "./currency.ts";
import type { DocumentMetadataResolution } from "./evidence-document-metadata.ts";

/** LEGACY_COMPATIBILITY_DEFAULT: TRM fija, solo para casos sin evidence run activo. */
export const LEGACY_EXCHANGE_RATE_COP_PER_USD = 4080;

export type StructuredInputCurrencyErrorCode = "ANALYSIS_CURRENCY_REQUIRED" | "ACTIVE_EVIDENCE_CURRENCY_MISSING" | "EXCHANGE_RATE_REQUIRED";

export type StructuredInputCurrency =
  | { ok: true; mode: "versioned"; monedaAnalisis: CurrencyCode; monedaDocumento: CurrencyCode; factorEscala: number; exchangeRate: null }
  | { ok: true; mode: "legacy"; monedaAnalisis: CurrencyCode; monedaDocumento: CurrencyCode | null; factorEscala: number; exchangeRate: number; legacyDefaults: string[] }
  | { ok: false; code: StructuredInputCurrencyErrorCode; message: string };

export function resolveStructuredInputCurrency(params: {
  monedaAnalisisRaw: unknown;
  docMeta: Extract<DocumentMetadataResolution, { ok: true }>;
}): StructuredInputCurrency {
  const raw = typeof params.monedaAnalisisRaw === "string" ? params.monedaAnalisisRaw : null;
  const analysisCurrency = normalizeCurrencyCode(raw);
  const { docMeta } = params;

  if (docMeta.source === "active_evidence_run") {
    if (!analysisCurrency) {
      return { ok: false, code: "ANALYSIS_CURRENCY_REQUIRED", message: `La moneda del análisis debe ser COP o USD explícitos (recibido: ${JSON.stringify(params.monedaAnalisisRaw ?? null)}); en un caso versionado no se asume COP.` };
    }
    if (!docMeta.monedaDocumento) {
      return { ok: false, code: "ACTIVE_EVIDENCE_CURRENCY_MISSING", message: "La moneda del documento fuente no está reconocida; no se asume que no haya conversión." };
    }
    if (docMeta.monedaDocumento !== analysisCurrency) {
      return { ok: false, code: "EXCHANGE_RATE_REQUIRED", message: `Convertir ${docMeta.monedaDocumento} → ${analysisCurrency} requiere una tasa de conversión con fuente y fecha explícitas; el sistema no usa TRM hardcodeada en casos versionados.` };
    }
    return { ok: true, mode: "versioned", monedaAnalisis: analysisCurrency, monedaDocumento: docMeta.monedaDocumento, factorEscala: docMeta.factorEscala, exchangeRate: null };
  }

  const legacyDefaults: string[] = [];
  if (!analysisCurrency) legacyDefaults.push("moneda_analisis→COP");
  return {
    ok: true, mode: "legacy",
    monedaAnalisis: analysisCurrency ?? "COP",
    monedaDocumento: docMeta.monedaDocumento,
    factorEscala: docMeta.factorEscala,
    exchangeRate: LEGACY_EXCHANGE_RATE_COP_PER_USD,
    legacyDefaults,
  };
}
