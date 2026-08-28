// Scoring DETERMINÍSTICO del benchmark narrativo — únicamente lo
// objetivable (flags binarios + extracción numérica). Deliberadamente NO
// hay score 0-5 automático de claridad/tono/utilidad profesional — eso es
// revisión humana (ver blind.ts). Módulo puro — sin red, sin SDKs.
//
// Reglas conservadoras y explicables, no perfectas: cuando la
// clasificación de un token numérico es ambigua, se reporta en
// `needsHumanReview` en vez de afirmar con falsa certeza que es una cifra
// inventada.

import type { NarrativeCalculationViewModel } from "../../supabase/functions/_shared/narrative-calculation-adapter.ts";

// ═══════════════════════════════════════════════════════════════
// Extracción y normalización numérica
// ═══════════════════════════════════════════════════════════════

// Dos alternativas, en orden: (1) número agrupado en miles con al menos un
// separador de grupo de 3 dígitos ("4,200,000" / "4.200.000"); (2) número
// plano, con o sin un único separador decimal ("4200000", "21.0", "7.2").
// Sin esta alternancia, un run de dígitos sin separadores ("4200000") solo
// matcheaba sus primeros 3 dígitos — bug detectado al validar contra
// evidence/output reales.
const NUMERIC_TOKEN_RE = /\$?-?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?\s?[%x]?|\$?-?\d+(?:[.,]\d+)?\s?[%x]?/gi;

export interface NumericToken {
  raw: string;
  kind: "percent" | "multiple" | "plain";
}

export function extractNumericTokens(text: string): NumericToken[] {
  const matches = text.match(NUMERIC_TOKEN_RE) ?? [];
  return matches
    .map((raw) => raw.trim())
    .filter((raw) => /\d/.test(raw))
    .map((raw) => {
      if (raw.endsWith("%")) return { raw, kind: "percent" as const };
      if (/x$/i.test(raw)) return { raw, kind: "multiple" as const };
      return { raw, kind: "plain" as const };
    });
}

/**
 * Normaliza un token numérico crudo a `number`, tolerando separadores de
 * miles en formato "1,234,567" o "1.234.567" y decimales con "." o ",".
 * Heurística conservadora: con un solo separador, un grupo de EXACTAMENTE
 * 3 dígitos después (y sin sufijo %/x) se asume separador de miles; en
 * cualquier otro caso se asume decimal. Con más de un separador, todos
 * menos el último se asumen de miles. Devuelve `null` si no puede
 * normalizarse sin ambigüedad — nunca inventa una interpretación.
 */
export function normalizeNumericToken(token: NumericToken): number | null {
  const s = token.raw.trim().replace(/^\$/, "").replace(/\s?[%x]$/i, "").trim();
  const isRatio = token.kind !== "plain";
  const lastSepPos = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));

  if (lastSepPos === -1) {
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  const digitsAfterLastSep = s.length - lastSepPos - 1;
  // Un porcentaje/múltiplo casi nunca trae agrupación de miles (sus
  // valores son pequeños) — el último separador siempre es decimal ahí.
  // Para un número plano, EXACTAMENTE 3 dígitos tras el último separador
  // se asume agrupación de miles (heurística conservadora, documentada
  // arriba); cualquier otra cantidad de dígitos se asume decimal.
  const lastSepIsDecimal = isRatio || digitsAfterLastSep !== 3;

  if (lastSepIsDecimal) {
    const intPart = s.slice(0, lastSepPos).replace(/[.,]/g, "");
    const decPart = s.slice(lastSepPos + 1);
    const n = Number(`${intPart}.${decPart}`);
    return Number.isFinite(n) ? n : null;
  }

  const n = Number(s.replace(/[.,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function numbersWithinTolerance(a: number, b: number): boolean {
  if (Math.abs(a) < 1000 || Math.abs(b) < 1000) {
    // Porcentajes/múltiplos — tolerancia absoluta de redondeo (p.ej. 21.0 vs 21 vs 20.95).
    return Math.abs(a - b) <= 0.2;
  }
  // Cifras grandes (moneda) — tolerancia relativa de redondeo/formato ("~4.2 millones").
  return Math.abs(a - b) <= Math.max(1, Math.abs(b) * 0.015);
}

// 4 dígitos sin separadores, sin %/x — candidato "año" (p.ej. 2025). Fuente
// frecuente de falsos positivos porque los años no siempre están en el
// whitelist explícito de una sección — se reportan como needs_human_review
// en vez de invented_number con falsa certeza.
function looksLikeBareYear(raw: string): boolean {
  return /^\d{4}$/.test(raw.trim());
}

export interface InventedNumberResult {
  invented: string[];
  needsHumanReview: string[];
}

/**
 * Compara cada número presente en `outputText` contra el whitelist de
 * números presentes en `evidenceTexts` (system + user prompt reales
 * entregados al modelo). Un número del output que no matchea ningún
 * número del whitelist (con tolerancia de formato/redondeo) es candidato a
 * `invented_number` — salvo que sea ambiguo de normalizar o parezca un año
 * de 4 dígitos, en cuyo caso se reporta como `needsHumanReview`.
 */
export function detectInventedNumbers(outputText: string, evidenceTexts: readonly string[]): InventedNumberResult {
  const whitelist: number[] = [];
  for (const text of evidenceTexts) {
    for (const token of extractNumericTokens(text)) {
      const n = normalizeNumericToken(token);
      if (n !== null) whitelist.push(n);
    }
  }

  const invented: string[] = [];
  const needsHumanReview: string[] = [];
  for (const token of extractNumericTokens(outputText)) {
    const n = normalizeNumericToken(token);
    if (n === null) {
      needsHumanReview.push(token.raw);
      continue;
    }
    const matched = whitelist.some((w) => numbersWithinTolerance(n, w));
    if (matched) continue;
    if (looksLikeBareYear(token.raw)) {
      needsHumanReview.push(token.raw);
      continue;
    }
    invented.push(token.raw);
  }
  return { invented, needsHumanReview };
}

// ═══════════════════════════════════════════════════════════════
// Fuentes/comparables inventados
// ═══════════════════════════════════════════════════════════════

const KNOWN_EXTERNAL_SOURCE_NAMES = [
  "bloomberg", "damodaran", "mckinsey", "deloitte", "\\bey\\b", "pwc", "kpmg", "bcg",
  "banco mundial", "world bank", "fmi", "\\bimf\\b", "statista", "gartner",
  "moody's", "moodys", "s&p", "fitch",
];

const SOURCE_CITATION_PATTERNS: RegExp[] = [
  new RegExp(`(${KNOWN_EXTERNAL_SOURCE_NAMES.join("|")})`, "i"),
  /seg[uú]n\s+(?:datos\s+de\s+|el\s+reporte\s+de\s+|el\s+benchmark\s+de\s+)?[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑñ&.\s]{2,40}/,
  /de\s+acuerdo\s+con\s+[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑñ&.\s]{2,40}/,
  /fuente:\s*\S+/i,
];

/** sectorBenchmark en el motor canónico NUNCA trae un campo de fuente/institución — cualquier cita de este tipo en la narrativa es, por construcción, no respaldada por los datos entregados. */
export function detectInventedSource(outputText: string): { flagged: boolean; matches: string[] } {
  const matches: string[] = [];
  for (const re of SOURCE_CITATION_PATTERNS) {
    const m = outputText.match(re);
    if (m) matches.push(m[0]);
  }
  return { flagged: matches.length > 0, matches };
}

// ═══════════════════════════════════════════════════════════════
// Afirmaciones sin respaldo (causales que los datos numéricos no sustentan)
// ═══════════════════════════════════════════════════════════════

const UNSUPPORTED_CLAIM_PATTERNS: RegExp[] = [
  /fraude/i,
  /gesti[oó]n\s+(gerencial\s+)?deficiente/i,
  /mala\s+gesti[oó]n/i,
  /decisiones?\s+(gerenciales?|directivas?)\s+(deficientes?|imprudentes?)/i,
  /insolvencia/i,
  /quiebra/i,
  /riesgo\s+de\s+default\s+inminente/i,
  /controles?\s+internos?\s+deficientes?/i,
  /gobierno\s+corporativo\s+deficiente/i,
];

/** Heurística conservadora por palabra clave — no exhaustiva, preferible a un falso positivo silencioso o a no detectar nada. */
export function detectUnsupportedClaim(outputText: string): { flagged: boolean; matches: string[] } {
  const matches: string[] = [];
  for (const re of UNSUPPORTED_CLAIM_PATTERNS) {
    const m = outputText.match(re);
    if (m) matches.push(m[0]);
  }
  return { flagged: matches.length > 0, matches };
}

// ═══════════════════════════════════════════════════════════════
// Contradicción con el cálculo — solo checks de signo/umbral bien definidos
// ═══════════════════════════════════════════════════════════════

// `[^.]{0,N}` tolera verbos/conectores entre el sujeto y el adjetivo
// ("cobertura de intereses ES saludable", no solo "cobertura saludable")
// sin cruzar el límite de una oración.
const POSITIVE_EBITDA_CONTRADICTION_RE = /p[ée]rdidas?\s+operativas|margen\s+ebitda\s+negativo/i;
const NEGATIVE_EBITDA_CONTRADICTION_RE = /(ebitda|rentabilidad\s+operativa)[^.]{0,15}(positiv[oa]|s[oó]lid[oa])/i;
const POSITIVE_NET_MARGIN_CONTRADICTION_RE = /(rentabilidad|resultado|utilidad)\s+neta?[^.]{0,15}positiv[oa]/i;
const NEGATIVE_NET_MARGIN_CONTRADICTION_RE = /(p[ée]rdidas?\s+netas?|resultado\s+neto\s+negativo)/i;
const HEALTHY_COVERAGE_CONTRADICTION_RE = /cobertura\s+de\s+intereses[^.]{0,20}(saludable|holgada|adecuada|suficiente)/i;
const INSUFFICIENT_COVERAGE_CONTRADICTION_RE = /cobertura\s+de\s+intereses[^.]{0,20}insuficiente|no\s+(alcanza|cubre)[^.]{0,20}gasto\s+financiero/i;

export function detectContradictsCalculation(outputText: string, vm: NarrativeCalculationViewModel): { flagged: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const { ebitdaMargin, netMargin, interestCoverage } = vm.kpis;

  if (typeof ebitdaMargin === "number") {
    if (ebitdaMargin > 0 && POSITIVE_EBITDA_CONTRADICTION_RE.test(outputText)) reasons.push("afirma pérdidas operativas/margen EBITDA negativo con ebitdaMargin > 0 en el ground truth");
    if (ebitdaMargin < 0 && NEGATIVE_EBITDA_CONTRADICTION_RE.test(outputText)) reasons.push("afirma EBITDA/rentabilidad operativa positiva con ebitdaMargin < 0 en el ground truth");
  }
  if (typeof netMargin === "number") {
    if (netMargin > 0 && NEGATIVE_NET_MARGIN_CONTRADICTION_RE.test(outputText)) reasons.push("afirma pérdidas netas con netMargin > 0 en el ground truth");
    if (netMargin < 0 && POSITIVE_NET_MARGIN_CONTRADICTION_RE.test(outputText)) reasons.push("afirma rentabilidad neta positiva con netMargin < 0 en el ground truth");
  }
  if (typeof interestCoverage === "number") {
    if (interestCoverage >= 2 && INSUFFICIENT_COVERAGE_CONTRADICTION_RE.test(outputText)) reasons.push("afirma cobertura de intereses insuficiente con interestCoverage >= 2.0x en el ground truth");
    if (interestCoverage < 2 && HEALTHY_COVERAGE_CONTRADICTION_RE.test(outputText)) reasons.push("afirma cobertura de intereses saludable con interestCoverage < 2.0x en el ground truth");
  }

  return { flagged: reasons.length > 0, reasons };
}

// ═══════════════════════════════════════════════════════════════
// Trata missing (null) como cero
// ═══════════════════════════════════════════════════════════════

/** Para un campo null dado (p.ej. "inventario"), busca ese label seguido de "0"/"cero" en una ventana corta — señal de que el modelo inventó un valor cero en vez de omitir el campo. */
export function detectTreatsMissingAsZero(outputText: string, nullFieldLabels: readonly string[]): { flagged: boolean; matches: string[] } {
  const matches: string[] = [];
  for (const label of nullFieldLabels) {
    const re = new RegExp(`${label}[^.]{0,40}?\\b(0|cero)\\b`, "i");
    const m = outputText.match(re);
    if (m) matches.push(m[0]);
  }
  return { flagged: matches.length > 0, matches };
}

// ═══════════════════════════════════════════════════════════════
// Metodología inventada — nombres de método no usados por el motor canónico
// ═══════════════════════════════════════════════════════════════

const UNKNOWN_METHODOLOGY_PATTERNS: RegExp[] = [
  /m[uú]ltiplos\s+de\s+transacciones\s+comparables/i,
  /black-scholes/i,
  /opciones\s+reales/i,
  /monte\s+carlo/i,
  /dividend\s+discount\s+model/i,
  /modelo\s+de\s+dividendos\s+descontados/i,
  /\bapv\b/i,
  /valor\s+de\s+liquidaci[oó]n/i,
  /m[eé]todo\s+de\s+libros/i,
];

export function detectInventsMethodology(outputText: string): { flagged: boolean; matches: string[] } {
  const matches: string[] = [];
  for (const re of UNKNOWN_METHODOLOGY_PATTERNS) {
    const m = outputText.match(re);
    if (m) matches.push(m[0]);
  }
  return { flagged: matches.length > 0, matches };
}

// ═══════════════════════════════════════════════════════════════
// Combinación — los 6 flags críticos del paso 18
// ═══════════════════════════════════════════════════════════════

export interface ScoringFlags {
  invented_number: boolean;
  invented_source: boolean;
  unsupported_financial_claim: boolean;
  contradicts_calculation: boolean;
  treats_missing_as_zero: boolean;
  invents_methodology: boolean;
  needs_human_review: string[];
  details: {
    invented_numbers: string[];
    invented_source_matches: string[];
    unsupported_claim_matches: string[];
    contradiction_reasons: string[];
    treats_missing_as_zero_matches: string[];
    invents_methodology_matches: string[];
  };
}

export function scoreOutput(
  outputText: string,
  evidenceTexts: readonly string[],
  vm: NarrativeCalculationViewModel,
  nullFieldLabels: readonly string[] = [],
): ScoringFlags {
  const numbers = detectInventedNumbers(outputText, evidenceTexts);
  const source = detectInventedSource(outputText);
  const claim = detectUnsupportedClaim(outputText);
  const contradiction = detectContradictsCalculation(outputText, vm);
  const missingAsZero = detectTreatsMissingAsZero(outputText, nullFieldLabels);
  const methodology = detectInventsMethodology(outputText);

  return {
    invented_number: numbers.invented.length > 0,
    invented_source: source.flagged,
    unsupported_financial_claim: claim.flagged,
    contradicts_calculation: contradiction.flagged,
    treats_missing_as_zero: missingAsZero.flagged,
    invents_methodology: methodology.flagged,
    needs_human_review: numbers.needsHumanReview,
    details: {
      invented_numbers: numbers.invented,
      invented_source_matches: source.matches,
      unsupported_claim_matches: claim.matches,
      contradiction_reasons: contradiction.reasons,
      treats_missing_as_zero_matches: missingAsZero.matches,
      invents_methodology_matches: methodology.matches,
    },
  };
}

/** Labels en español de los campos null de CASE_C_INCOMPLETE_EVIDENCE — usados con detectTreatsMissingAsZero. */
export const CASE_C_NULL_FIELD_LABELS = ["cuentas por cobrar", "inventario", "cuentas por pagar", "activos fijos", "ppe", "propiedad,?\\s*planta y equipo"];
