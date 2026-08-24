// Bug pérdida de cuenta en CSV/texto de una sola columna — extraído de
// parse-document/index.ts a un módulo puro para poder probarlo con Vitest
// sin Deno/Supabase (index.ts no se puede importar directo, igual que el
// resto de las Edge Functions de este repo). Sin red, sin efectos
// secundarios. Comportamiento idéntico al que vivía inline salvo la
// corrección puntual documentada en extraerCSV() abajo.

import { normalizarNumero } from "./parse-document-ai-fallback.ts";

export interface ParsedRow {
  posicion: number;
  texto: string;
  valor_raw: string | null;
  valor: number | null;
  es_encabezado: boolean;
  periodo?: string | null;
  columna?: number;
  es_comparativo?: boolean;
  convencion_signos?: string;
  linea_original?: string;
}

export function normalizarTexto(texto: string | null): string {
  if (!texto) return "";
  let s = String(texto).trim();
  s = s.replace(/^\d{4,6}[\s\-\.]+/, "").trim();
  s = s.replace(/^\d+[.\-)\s]+/, "");
  s = s.replace(/_{2,}/g, " ").replace(/\s{2,}/g, " ");
  const siglas = ["EBITDA", "EBIT", "WACC", "ROE", "ROA", "D&A", "PP&E", "COGS", "SG&A", "CAPEX", "EBT", "NIIF", "IFRS", "GAAP", "NOPAT", "FCFF"];
  if (s === s.toUpperCase() && !siglas.includes(s) && s.length > 3) {
    s = s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  return s.trim();
}

/**
 * Detección de fila de encabezado — busca, en las primeras 5 líneas, la
 * primera que contenga un patrón de año (YYYY) EN ALGUNA DE SUS COLUMNAS.
 *
 * Bug: un archivo de una sola columna (texto/prosa sin separador real,
 * p. ej. "Ingresos 2024: 1.000.000. Ingresos 2025: 1.200.000." como línea
 * completa, sin comas) tiene exactamente 1 celda tras parseLine(). Sin el
 * requisito `.length > 1`, esa línea de DATOS se confundía con un
 * encabezado real solo porque contenía un año embebido en su texto — y al
 * marcarse como encabezado, se excluía por completo de `filas` (nunca más
 * se reconstruye desde el texto original: `textoPlano` se arma después a
 * partir de `filas`), perdiendo la cuenta y sus valores de forma
 * silenciosa, incluso antes de llegar al fallback de IA.
 *
 * El fix es exactamente la misma condición que YA se usa más abajo en esta
 * función (`columnHeaders.length > 1`) para decidir si una fila es
 * comparativa multi-período o de una sola columna — un encabezado real
 * SIEMPRE tiene más de una celda (columna de etiqueta + al menos un
 * período); una línea de una sola celda nunca puede ser un encabezado
 * multi-período, sin importar qué texto contenga.
 */
function detectarFilaEncabezado(datosJSON: string[][]): { encabezadoIdx: number; columnHeaders: (string | null)[] } {
  const patronAnio = /\b(19|20)\d{2}\b/;
  for (let i = 0; i < Math.min(datosJSON.length, 5); i++) {
    if (datosJSON[i].length > 1 && datosJSON[i].some((c) => patronAnio.test(c))) {
      return { encabezadoIdx: i, columnHeaders: datosJSON[i].map((c) => c || null) };
    }
  }
  return { encabezadoIdx: -1, columnHeaders: [] };
}

export function extraerCSV(bytes: Uint8Array): { filas: ParsedRow[]; metadatos: Record<string, any> } {
  let texto = "";
  try { texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { try { texto = new TextDecoder("iso-8859-1").decode(bytes); } catch { texto = new TextDecoder("windows-1252").decode(bytes); } }
  if (!/[áéíóúñÁÉÍÓÚÑ]/.test(texto) && /Ã|Â/.test(texto)) {
    try { texto = new TextDecoder("utf-8").decode(bytes); } catch {}
  }
  const lineas = texto.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lineas.length === 0) throw new Error("El archivo CSV está vacío.");

  const counters = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of lineas[0]) { if (ch in counters) (counters as any)[ch]++; }
  const sep = Object.entries(counters).sort((a, b) => b[1] - a[1])[0][0];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "", inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === sep && !inQuotes) { result.push(current.trim()); current = ""; }
      else current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const datosJSON = lineas.map(parseLine);
  const { encabezadoIdx, columnHeaders } = detectarFilaEncabezado(datosJSON);

  const filas: ParsedRow[] = [];
  const startIdx = encabezadoIdx >= 0 ? encabezadoIdx + 1 : 1;
  for (let i = startIdx; i < datosJSON.length; i++) {
    const row = datosJSON[i];
    if (row.every(c => !c)) continue;
    const textoCuenta = row[0]?.trim();
    if (!textoCuenta) continue;
    if (columnHeaders.length > 1) {
      for (let col = 1; col < row.length; col++) {
        if (row[col]) {
          filas.push({ posicion: i, texto: normalizarTexto(textoCuenta), valor_raw: row[col], valor: normalizarNumero(row[col]), columna: col - 1, periodo: columnHeaders[col] || null, es_encabezado: false, es_comparativo: true });
        }
      }
    } else {
      filas.push({ posicion: i, texto: normalizarTexto(textoCuenta), valor_raw: row[1] || null, valor: normalizarNumero(row[1]), es_encabezado: !(row[1]) });
    }
  }
  return { filas, metadatos: { separador: sep, lineas_totales: lineas.length, tipo_interno: "csv", column_headers: columnHeaders.filter(Boolean) } };
}
