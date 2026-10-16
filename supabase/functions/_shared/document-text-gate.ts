// Gate fail-closed del fallback de IA de parse-document (decisión pura: sin
// Supabase, sin Deno, sin red).
//
// Regla: la IA nunca fabrica Evidence a partir de una fuente que el sistema
// no consiguió leer. El fallback (SYSTEM_PARSER_FALLBACK) solo puede recibir
// TEXTO realmente extraído por el parser estructurado que supere este gate.
// Nunca bytes crudos, ni la decodificación latin1/utf-8 de un binario (p. ej.
// un PDF con streams comprimidos o cifrados), ni texto vacío o casi vacío.
// Si el gate no pasa: DOCUMENT_TEXT_UNAVAILABLE, sin IA y sin documents_parsed.

export const DOCUMENT_TEXT_UNAVAILABLE = "DOCUMENT_TEXT_UNAVAILABLE";

/** Mínimo de caracteres (sin espacios redundantes) para que el texto cuente como legible. */
export const AI_FALLBACK_MIN_TEXT_CHARS = 200;
/** Proporción mínima de letras, dígitos, espacios, `.` y `,` (mismo criterio que verificarCalidadTexto). */
export const AI_FALLBACK_MIN_ALNUM_RATIO = 0.6;
/** Proporción máxima de caracteres de control / U+FFFD (indicio de contenido binario). */
export const AI_FALLBACK_MAX_BINARY_RATIO = 0.01;

export type TextGateReason = "EMPTY" | "TOO_SHORT" | "BINARY_CONTENT" | "LOW_QUALITY";

export interface TextGateMetrics {
  chars: number;
  alnum_ratio: number | null;
  binary_ratio: number | null;
}

export type TextGateDecision =
  | { allowed: true; text: string; metrics: TextGateMetrics }
  | { allowed: false; code: typeof DOCUMENT_TEXT_UNAVAILABLE; reason: TextGateReason; message: string; metrics: TextGateMetrics };

/** Caracteres de control (salvo \t \n \r), DEL y U+FFFD: indicio de bytes binarios decodificados. */
function isBinaryChar(code: number): boolean {
  return (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) || code === 0x7f || code === 0xfffd;
}
function countBinaryChars(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) if (isBinaryChar(s.charCodeAt(i))) n++;
  return n;
}

const ALNUM = /[a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s.,]/g;

const MESSAGES: Record<TextGateReason, string> = {
  EMPTY: "No se pudo extraer texto legible del documento.",
  TOO_SHORT: "El texto extraído del documento es insuficiente para interpretarlo.",
  BINARY_CONTENT: "El contenido extraído del documento es binario o ilegible.",
  LOW_QUALITY: "El texto extraído del documento no supera el mínimo de calidad.",
};

/**
 * ¿Puede este texto (ya extraído por el parser estructurado) enviarse al
 * fallback de IA? Recibe SOLO texto extraído; quien llama nunca debe
 * sustituirlo por los bytes del archivo.
 */
export function evaluateAiFallbackText(extracted: string | null | undefined): TextGateDecision {
  const raw = typeof extracted === "string" ? extracted : "";
  const binary = countBinaryChars(raw);
  const text = raw.replace(/\s+/g, " ").trim();
  const metrics: TextGateMetrics = {
    chars: text.length,
    alnum_ratio: text.length ? round((text.match(ALNUM) || []).length / text.length) : null,
    binary_ratio: raw.length ? round(binary / raw.length) : null,
  };
  const deny = (reason: TextGateReason): TextGateDecision => ({
    allowed: false, code: DOCUMENT_TEXT_UNAVAILABLE, reason, metrics,
    message: `${MESSAGES[reason]} No se usa IA para reconstruir cifras a partir de una fuente que el sistema no pudo leer (${DOCUMENT_TEXT_UNAVAILABLE}).`,
  });

  if (text.length === 0) return deny("EMPTY");
  if (raw.includes("\u0000") || (metrics.binary_ratio ?? 0) > AI_FALLBACK_MAX_BINARY_RATIO) return deny("BINARY_CONTENT");
  if (text.length < AI_FALLBACK_MIN_TEXT_CHARS) return deny("TOO_SHORT");
  if ((metrics.alnum_ratio ?? 0) < AI_FALLBACK_MIN_ALNUM_RATIO) return deny("LOW_QUALITY");
  return { allowed: true, text, metrics };
}

function round(x: number): number {
  return Math.round(x * 1000) / 1000;
}
