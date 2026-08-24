// Conversión pura del output de SYSTEM_PARSER_FALLBACK (IA) al modelo
// interno ParsedRow — extraída de parse-document/index.ts para poder
// probarla con Vitest sin Deno/Supabase (index.ts no se puede importar
// directo, igual que el resto de las Edge Functions de este repo). Sin
// red, sin efectos secundarios.
//
// Antes, parse-document/index.ts tomaba `Object.values(row.values)[0]` —
// solo el primer valor de cada fila IA, sin importar cuántos períodos
// devolviera el modelo, y sin asignar `periodo` real (quedaba como el
// literal "col_1" al persistir). Esto: (1) descartaba silenciosamente
// cualquier período adicional, y (2) corrompía el único período
// sobreviviente, que map-accounts interpretaba como si "col_1" fuera un
// año real, haciendo que resolveBasePeriod bloqueara el análisis siempre
// (ver auditoría — Bug período AI fallback).
//
// La corrección: una fila IA con varios períodos en `values` se EXPLOTA en
// varias filas internas, una por cuenta × período — el mismo modelo que ya
// usan extraerExcel/extraerCSV en index.ts (una fila = una cuenta × un
// período, nunca varios valores dentro de una sola fila).

/** Idéntica a la función privada normalizarNumero() que vivía en
 *  parse-document/index.ts — reubicada aquí porque la explosión de
 *  columnas de IA la necesita para preservar signo/formato (incluye
 *  negativos entre paréntesis), y así queda cubierta por tests. index.ts
 *  la importa desde este módulo en vez de mantener una copia local. */
export function normalizarNumero(valorRaw: string | number | null | undefined): number | null {
  if (valorRaw === null || valorRaw === undefined || valorRaw === "") return null;
  if (typeof valorRaw === "number") return isNaN(valorRaw) ? null : valorRaw;
  const str = String(valorRaw).trim();
  if (str.startsWith("=")) return null;
  if (["-", "—", "n/a", "n.a.", "nd", "n.d.", ""].includes(str.toLowerCase())) return null;

  const esNegParentesis = str.startsWith("(") && str.endsWith(")");
  let s = esNegParentesis ? str.slice(1, -1) : str;
  s = s.replace(/[$€£]/g, "").replace(/COP|USD|MXN/gi, "").trim();

  let num: number | null = null;
  if (/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(s)) {
    num = parseFloat(s.replace(/\./g, "").replace(",", "."));
  } else if (/^\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(s)) {
    num = parseFloat(s.replace(/,/g, ""));
  } else if (/^\d+([.,]\d{1,2})?$/.test(s)) {
    num = parseFloat(s.replace(",", "."));
  } else if (/^\d+(\.\d+)?M$/i.test(s)) {
    num = parseFloat(s) * 1_000_000;
  } else if (/^\d+(\.\d+)?K$/i.test(s)) {
    num = parseFloat(s) * 1_000;
  } else {
    const digits = s.replace(/[^0-9.-]/g, "");
    num = digits ? parseFloat(digits) : null;
  }

  if (num === null || isNaN(num)) return null;
  return esNegParentesis ? -Math.abs(num) : num;
}

export interface ExplodedPeriodRow {
  valor: number;
  periodo: string;
  columna: number;
}

/**
 * Una clave `col_N` está presente en `values` pero `column_headers` no
 * tiene una etiqueta en esa posición (falta el header, o `column_headers`
 * es más corto de lo que las claves de `values` sugieren). Esto NO es una
 * ausencia legítima (el modelo sí reportó un valor) ni se puede reasignar
 * a otro período por adivinanza — es un error de datos estructural.
 * Fail-closed: se lanza en vez de persistir una fila con período `null`
 * (que el resolver de base_period trataría como el caso legítimo "sin
 * período", ver period-resolution.ts regla 5) o con un año inventado.
 */
export class UnmappedAiColumnError extends Error {
  constructor(
    public readonly columnKey: string,
    public readonly originalLabel: string,
  ) {
    super(
      `La columna "${columnKey}" del fallback IA no tiene un período correspondiente en column_headers ` +
        `(fila: "${originalLabel}"). No se puede asignar de forma segura — revisión requerida.`,
    );
    this.name = "UnmappedAiColumnError";
  }
}

/**
 * Explota los valores de UNA fila cruda de IA (`values: {"col_1": n, "col_2": n}`)
 * en una fila interna por cada período REALMENTE reportado.
 *
 * - `col_N` (N >= 1, 1-indexado) -> `columnHeaders[N]` — misma convención
 *   posicional que ya usan extraerExcel/extraerCSV (índice 0 es siempre la
 *   columna de etiqueta, nunca un período).
 * - `col_0`, o cualquier clave que no matchee `col_<entero positivo>`, no
 *   es una columna de período reconocida — se ignora, igual que cualquier
 *   otra clave inesperada en `values`.
 * - Una clave `col_N` AUSENTE en `values` nunca se inventa ni se convierte
 *   en 0 — simplemente no genera fila para ese período.
 * - Una clave `col_N` presente pero sin `columnHeaders[N]` (o con un
 *   header vacío) lanza `UnmappedAiColumnError` — fail-closed, ver esa
 *   clase para el razonamiento.
 * - Un valor presente que no normaliza a número (`normalizarNumero`
 *   devuelve null) tampoco genera fila — no se fabrica un 0.
 */
const SIMPLE_FISCAL_YEAR = /^\d{4}$/;

/**
 * Reconcilia los períodos que devolvió SYSTEM_PERIOD_DETECTOR (IA) con los
 * que ya observó determinísticamente el paso de extracción (`column_headers`
 * de extraerExcel/extraerCSV, o `parsed.column_headers` del propio
 * SYSTEM_PARSER_FALLBACK) — ver auditoría: `sampleText` (el input que recibe
 * el period_detector) se arma solo con `texto: valor_raw` por fila, sin el
 * período de cada una ni los column_headers, así que el detector puede
 * devolver `periodos: []` incluso cuando ya se observaron años válidos.
 *
 * - Solo se incorporan encabezados con formato de año fiscal simple (YYYY);
 *   cualquier otro formato ("LTM Jun-2025", "2025-Q1", etc.) se ignora tal
 *   cual — nunca se convierte ni se adivina a qué año corresponde.
 * - Es una UNIÓN determinística, no un reemplazo: si el period_detector ya
 *   encontró períodos válidos, se conservan.
 * - No selecciona un base_period ni ordena por relevancia — eso lo decide
 *   resolveBasePeriod() más adelante, con la evidencia completa por fila.
 */
export function reconcileDetectedPeriods(
  aiDetectedPeriods: ReadonlyArray<string>,
  columnHeaders: ReadonlyArray<unknown>,
): string[] {
  const headerPeriods = columnHeaders
    .map((h) => (h === null || h === undefined ? "" : String(h).trim()))
    .filter((h) => SIMPLE_FISCAL_YEAR.test(h));
  return Array.from(new Set([...aiDetectedPeriods, ...headerPeriods])).sort();
}

export function explodeAiFallbackRowByPeriod(
  originalLabel: string,
  values: Record<string, unknown>,
  columnHeaders: readonly string[],
): ExplodedPeriodRow[] {
  const out: ExplodedPeriodRow[] = [];
  for (const [key, rawValue] of Object.entries(values)) {
    const m = /^col_([1-9]\d*)$/.exec(key);
    if (!m) continue;
    const colIndex = Number(m[1]);
    const periodo = columnHeaders[colIndex];
    if (!periodo) {
      throw new UnmappedAiColumnError(key, originalLabel);
    }
    const valor = normalizarNumero(rawValue as string | number | null | undefined);
    if (valor === null) continue;
    out.push({ valor, periodo, columna: colIndex - 1 });
  }
  return out;
}
