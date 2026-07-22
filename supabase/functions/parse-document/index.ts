import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════
// PARSING MODULE — Complete rewrite for Colombian financial docs
// ═══════════════════════════════════════════════════════════════

// ── Format Detection ──
function detectarFormato(bytes: Uint8Array, filename: string, mimeType: string | null): { tipo: string; soportado: boolean } {
  const magic = {
    pdf:  [0x25, 0x50, 0x44, 0x46],
    xlsx: [0x50, 0x4B, 0x03, 0x04],
    xls:  [0xD0, 0xCF, 0x11, 0xE0],
  };
  const first4 = Array.from(bytes.slice(0, 4));
  if (first4.every((b, i) => b === magic.pdf[i])) return { tipo: "pdf", soportado: true };
  if (first4.every((b, i) => b === magic.xlsx[i])) return { tipo: "xlsx", soportado: true };
  if (first4.every((b, i) => b === magic.xls[i])) return { tipo: "xls", soportado: true };
  const ext = filename.split(".").pop()?.toLowerCase();
  if (mimeType === "text/csv" || ext === "csv") return { tipo: "csv", soportado: true };
  return { tipo: ext || "desconocido", soportado: false };
}

// ── Number Normalization ──
function normalizarNumero(valorRaw: string | number | null | undefined): number | null {
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
    const digits = s.replace(/[^0-9.\-]/g, "");
    num = digits ? parseFloat(digits) : null;
  }

  if (num === null || isNaN(num)) return null;
  return esNegParentesis ? -Math.abs(num) : num;
}

// ── Text Normalization ──
function normalizarTexto(texto: string | null): string {
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

// ── Row Interface ──
interface ParsedRow {
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

// ═══════════════════════════════════════════════════════════════
// EXCEL READER — cellFormula:false forces cached values only
// ═══════════════════════════════════════════════════════════════

const HOJAS_IGNORAR = ["control", "hoja1", "nomina", "nómina", "estacionalidad", "ventas_anuales", "hoja de trabajo"];

function extraerExcel(bytes: Uint8Array): { filas: ParsedRow[]; metadatos: Record<string, any>; textoCompleto: string } {
  // cellFormula:false → XLSX drops formulas and keeps only cached .v values
  const wb = XLSX.read(bytes, { type: "array", cellFormula: false, cellNF: false, raw: true });
  const nombreHojas = wb.SheetNames;
  if (!nombreHojas.length) throw new Error("El archivo Excel no contiene hojas.");

  // Filter out non-financial sheets
  const hojasFiltradas = nombreHojas.filter(n => !HOJAS_IGNORAR.includes(n.toLowerCase()));
  const hojasCandidatas = hojasFiltradas.length > 0 ? hojasFiltradas : nombreHojas;

  // Pick best sheet: keyword match first, then most numeric rows
  const keywords = ["resultado", "resultados", "p&l", "income", "balance", "situacion", "situación", "estado", "financiero", "consolidado"];
  let hojaUsada = hojasCandidatas[0];
  let found = false;
  for (const nombre of hojasCandidatas) {
    if (keywords.some(k => nombre.toLowerCase().includes(k))) { hojaUsada = nombre; found = true; break; }
  }
  if (!found && hojasCandidatas.length > 1) {
    let maxRows = 0;
    for (const nombre of hojasCandidatas) {
      const ws = wb.Sheets[nombre];
      if (!ws || !ws["!ref"]) continue;
      const rango = XLSX.utils.decode_range(ws["!ref"]);
      let numericCount = 0;
      for (let r = rango.s.r; r <= rango.e.r; r++) {
        for (let c = rango.s.c; c <= rango.e.c; c++) {
          const celda = ws[XLSX.utils.encode_cell({ r, c })];
          if (celda && typeof celda.v === "number") numericCount++;
        }
      }
      if (numericCount > maxRows) { maxRows = numericCount; hojaUsada = nombre; }
    }
  }

  const ws = wb.Sheets[hojaUsada];
  if (!ws || !ws["!ref"]) throw new Error("La hoja seleccionada está vacía.");
  const rango = XLSX.utils.decode_range(ws["!ref"]);

  // Read cell values directly — .v is always the cached value when cellFormula:false
  const matriz: any[][] = [];
  for (let r = rango.s.r; r <= rango.e.r; r++) {
    const fila: any[] = [];
    for (let c = rango.s.c; c <= rango.e.c; c++) {
      const celda = ws[XLSX.utils.encode_cell({ r, c })];
      if (!celda) { fila.push(null); continue; }
      if (typeof celda.v === "number" && isFinite(celda.v)) {
        fila.push(celda.v);
      } else if (typeof celda.v === "string" && !celda.v.startsWith("=")) {
        fila.push(celda.v);
      } else {
        fila.push(null);
      }
    }
    matriz.push(fila);
  }

  // Detect currency/scale info from headers (store in metadata, do NOT convert)
  const textoHeader = matriz.slice(0, 5).flat().filter(Boolean).join(" ");
  let monedaDoc = "USD";
  let escalaDoc = "";
  let factorEscala = 1;
  if (/cop\s*mm|mm\s*cop|millones\s*de\s*pesos|cifras\s*en\s*millones/i.test(textoHeader)) {
    monedaDoc = "COP"; escalaDoc = "MM"; factorEscala = 1_000_000;
  } else if (/cop\s*miles|miles\s*de\s*pesos/i.test(textoHeader)) {
    monedaDoc = "COP"; escalaDoc = "Miles"; factorEscala = 1_000;
  } else if (/\bCOP\b|pesos/i.test(textoHeader)) {
    monedaDoc = "COP"; escalaDoc = "unidades"; factorEscala = 1;
  }

  // Detect header row (years)
  const patronAnio = /\b(19|20)\d{2}\b/;
  let encabezadoIdx = -1;
  let columnHeaders: (string | null)[] = [];
  for (let i = 0; i < Math.min(matriz.length, 10); i++) {
    if (matriz[i] && matriz[i].some((c: any) => c && patronAnio.test(String(c)))) {
      encabezadoIdx = i;
      columnHeaders = matriz[i].map((c: any) => c ? String(c).trim() : null);
      break;
    }
  }

  // Build parsed rows (NO currency conversion here)
  const filas: ParsedRow[] = [];
  const startIdx = encabezadoIdx >= 0 ? encabezadoIdx + 1 : 0;
  for (let i = startIdx; i < matriz.length; i++) {
    const fila = matriz[i];
    if (!fila || fila.every((c: any) => c === null || c === "")) continue;
    const textoCuenta = fila[0] ? String(fila[0]).trim() : null;
    if (!textoCuenta) continue;

    if (columnHeaders.length > 1) {
      for (let col = 1; col < fila.length; col++) {
        const celda = fila[col];
        if (celda !== null && celda !== "" && celda !== undefined) {
          filas.push({
            posicion: i, texto: normalizarTexto(textoCuenta),
            valor_raw: String(celda),
            valor: typeof celda === "number" ? celda : normalizarNumero(celda),
            columna: col - 1, periodo: columnHeaders[col] || null,
            es_encabezado: false, es_comparativo: true, linea_original: fila.join("\t"),
          });
        }
      }
    } else {
      const rawVal = fila[1] !== null && fila[1] !== undefined ? String(fila[1]).trim() : null;
      filas.push({
        posicion: i, texto: normalizarTexto(textoCuenta),
        valor_raw: rawVal,
        valor: typeof fila[1] === "number" ? fila[1] : normalizarNumero(rawVal),
        es_encabezado: !rawVal, linea_original: fila.join("\t"),
      });
    }
  }

  const textoCompleto = matriz.flat().map((c: any) => c !== null ? String(c) : "").join(" ");

  // Content detection per sheet
  const contenidoPorHoja: Record<string, string> = {};
  for (const nombre of nombreHojas) {
    const s = wb.Sheets[nombre];
    if (!s || !s["!ref"]) continue;
    const r2 = XLSX.utils.decode_range(s["!ref"]);
    const tokens: string[] = [];
    for (let r = r2.s.r; r <= Math.min(r2.e.r, 30); r++) {
      for (let c = r2.s.c; c <= r2.e.c; c++) {
        const v = s[XLSX.utils.encode_cell({ r, c })]?.v;
        if (v) tokens.push(String(v).toLowerCase());
      }
    }
    contenidoPorHoja[nombre] = tokens.join(" ");
  }

  return {
    filas,
    metadatos: {
      hojas: nombreHojas, hoja_usada: hojaUsada, multiple_hojas: nombreHojas.length > 1,
      column_headers: columnHeaders.filter(Boolean), tipo_interno: "excel",
      moneda_documento: monedaDoc, escala_documento: escalaDoc, factor_escala: factorEscala,
      contenido_por_hoja: contenidoPorHoja,
    },
    textoCompleto,
  };
}

// ═══════════════════════════════════════════════════════════════
// CSV Extraction
// ═══════════════════════════════════════════════════════════════

function extraerCSV(bytes: Uint8Array): { filas: ParsedRow[]; metadatos: Record<string, any> } {
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
  const patronAnio = /\b(19|20)\d{2}\b/;
  let encabezadoIdx = -1;
  let columnHeaders: (string | null)[] = [];
  for (let i = 0; i < Math.min(datosJSON.length, 5); i++) {
    if (datosJSON[i].some(c => patronAnio.test(c))) {
      encabezadoIdx = i;
      columnHeaders = datosJSON[i].map(c => c || null);
      break;
    }
  }

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

// ═══════════════════════════════════════════════════════════════
// PDF Extraction
// ═══════════════════════════════════════════════════════════════

function extraerTextoPDF(bytes: Uint8Array): string {
  const raw = new TextDecoder("latin1").decode(bytes);
  const textBlocks: string[] = [];
  const btPattern = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btPattern.exec(raw)) !== null) {
    const block = match[1];
    const tjPattern = /\(([^)]*)\)\s*Tj|\[([^\]]*)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjPattern.exec(block)) !== null) {
      if (tjMatch[1]) textBlocks.push(tjMatch[1]);
      if (tjMatch[2]) {
        const arrPattern = /\(([^)]*)\)/g;
        let arrMatch;
        while ((arrMatch = arrPattern.exec(tjMatch[2])) !== null) textBlocks.push(arrMatch[1]);
      }
    }
  }
  return textBlocks.join(" ").replace(/\s+/g, " ").trim();
}

function verificarCalidadTexto(texto: string): boolean {
  if (!texto || texto.length < 50) return false;
  const alfanum = (texto.match(/[a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s.,]/g) || []).length;
  return (alfanum / texto.length) >= 0.60;
}

function extraerFilasDePDF(bytes: Uint8Array): { filas: ParsedRow[]; metadatos: Record<string, any>; textoPlano: string } {
  const texto = extraerTextoPDF(bytes);
  if (texto.length < 50 || !verificarCalidadTexto(texto)) {
    return { filas: [], metadatos: { tipo_interno: texto.length < 50 ? "pdf_posiblemente_escaneado" : "pdf_ocr_baja_calidad" }, textoPlano: texto };
  }
  const lineas = texto.split(/[.\n]/).map(l => l.trim()).filter(l => l.length > 2);
  const patronValor = /(-?\(?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?\)?)/g;
  const filas: ParsedRow[] = [];
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    if (/^[-=*_\s]+$/.test(linea)) continue;
    const valores = [...linea.matchAll(patronValor)].map(m => m[0]);
    if (valores.length === 0) {
      filas.push({ posicion: i, texto: normalizarTexto(linea), valor_raw: null, valor: null, es_encabezado: true });
    } else if (valores.length === 1) {
      const textoSinValor = linea.replace(patronValor, "").trim();
      filas.push({ posicion: i, texto: normalizarTexto(textoSinValor || linea), valor_raw: valores[0], valor: normalizarNumero(valores[0]), es_encabezado: false });
    } else {
      const primerIdx = linea.search(patronValor);
      const textoCuenta = linea.substring(0, primerIdx).trim();
      for (let col = 0; col < valores.length; col++) {
        filas.push({ posicion: i, texto: normalizarTexto(textoCuenta), valor_raw: valores[col], valor: normalizarNumero(valores[col]), columna: col, es_encabezado: false, es_comparativo: valores.length > 1 });
      }
    }
  }
  return { filas, metadatos: { tipo_interno: "pdf_digital", texto_total: texto.length }, textoPlano: texto };
}

// ═══════════════════════════════════════════════════════════════
// Content Detection — ER vs ESF in single file
// ═══════════════════════════════════════════════════════════════

function detectarContenidoArchivo(filas: ParsedRow[]): { tieneEstadoResultados: boolean; tieneBalanceGeneral: boolean; tieneAmbos: boolean } {
  const textoCompleto = filas.map(f => f.texto || "").join(" ").toLowerCase();
  const tieneER = /ventas|ingresos|costo.*venta|utilidad.*neta|resultado.*periodo|estado.*resultado|revenue|cost.*sales/i.test(textoCompleto);
  const tieneESF = /activo|pasivo|patrimonio|capital|balance|situacion.*financiera|assets|liabilities/i.test(textoCompleto);
  return { tieneEstadoResultados: tieneER, tieneBalanceGeneral: tieneESF, tieneAmbos: tieneER && tieneESF };
}

// ═══════════════════════════════════════════════════════════════
// Sign Convention + Structure Validation
// ═══════════════════════════════════════════════════════════════

function detectarConvencionSignos(filas: ParsedRow[]): ParsedRow[] {
  const patronesCosto = [/costo/i, /gasto/i, /cost/i, /expense/i, /opex/i, /depreciaci/i, /amortizaci/i, /interés/i, /interest/i, /impuesto/i, /tax/i];
  const patronesIngreso = [/ingreso/i, /venta/i, /revenue/i, /sales/i, /utilidad bruta/i];
  let costosPos = 0, costosNeg = 0, ingresosPos = 0;
  for (const f of filas) {
    if (f.valor === null) continue;
    if (patronesCosto.some(p => p.test(f.texto))) { f.valor > 0 ? costosPos++ : costosNeg++; }
    if (patronesIngreso.some(p => p.test(f.texto)) && f.valor > 0) ingresosPos++;
  }
  const convencion = (ingresosPos > 0 && costosPos > costosNeg) ? "presentacion" : "analitica";
  return filas.map(f => ({ ...f, convencion_signos: convencion }));
}

function validarEstructuraAmigable(filas: ParsedRow[]): { valida: boolean; errores: any[]; alertas: any[]; resumen: any } {
  const errores: any[] = [];
  const alertas: any[] = [];
  const filasConValor = filas.filter(f => f.valor !== null);

  // Friendly validation — less than 5 rows with numbers
  if (filasConValor.length < 3) {
    errores.push({ codigo: "INSUF_FILAS", mensaje: `El archivo parece estar vacío o tener muy pocos datos (${filasConValor.length} filas con valores). Verifica que exportaste el estado financiero completo.` });
  }

  // All zeros
  const filasNoZero = filasConValor.filter(f => f.valor !== 0);
  if (filasConValor.length > 0 && filasNoZero.length === 0) {
    errores.push({ codigo: "TODOS_CEROS", mensaje: "Los valores del archivo son todos cero. Si el Excel usa fórmulas, intenta guardarlo como 'Guardar como → Excel con valores' antes de cargarlo." });
  }

  // Negative assets warning (don't block)
  const negativosActivos = filasConValor.filter(f => f.valor! < 0 && /activo|asset|equipo|maquinaria/i.test(f.texto));
  if (negativosActivos.length > 0) {
    alertas.push({ codigo: "ACTIVOS_NEGATIVOS", mensaje: "Se detectaron valores negativos en activos (probablemente depreciación acumulada). Se ajustarán automáticamente." });
  }

  const comparativas = filas.filter(f => f.es_comparativo);
  if (comparativas.length > 0) {
    alertas.push({ codigo: "FORMATO_COMPARATIVO", mensaje: `${comparativas.length} filas con múltiples columnas detectadas.` });
  }

  return {
    valida: errores.length === 0,
    errores,
    alertas,
    resumen: { filas_totales: filas.length, filas_con_valor: filasConValor.length, filas_encabezado: filas.filter(f => f.es_encabezado).length, tiene_comparativo: comparativas.length > 0 },
  };
}

// ═══════════════════════════════════════════════════════════════
// Currency Detection (non-Excel paths)
// ═══════════════════════════════════════════════════════════════

function detectarMoneda(filas: ParsedRow[], textoCompleto: string): { moneda: string; factor: number; nota: string | null } {
  // Only detect currency — NO conversion. Conversion happens in build-structured-input.
  const esUSD = /\bUSD\b|\bUS\$|dolares|dólares/i.test(textoCompleto);
  if (esUSD) return { moneda: "USD", factor: 1, nota: null };
  const esCOPMM = /cop\s*mm|mm\s*cop|millones\s*de\s*pesos|cifras\s*en\s*millones/i.test(textoCompleto);
  if (esCOPMM) return { moneda: "COP", factor: 1, nota: "Valores en COP (millones)" };
  const esCOP = /\bCOP\b|\$\s*\d|pesos/i.test(textoCompleto);
  if (esCOP) return { moneda: "COP", factor: 1, nota: "Valores en COP" };
  const valores = filas.filter(f => f.valor !== null).map(f => Math.abs(f.valor!));
  const max = valores.length > 0 ? Math.max(...valores) : 0;
  if (max > 1_000_000_000) return { moneda: "COP", factor: 1, nota: "Valores detectados en COP (por magnitud)" };
  return { moneda: "USD", factor: 1, nota: null };
}

function detectarEscala(filas: ParsedRow[]): { escala: number; nota: string | null } {
  const valores = filas.filter(f => f.valor !== null && f.valor! > 0).map(f => f.valor!);
  if (valores.length === 0) return { escala: 1, nota: null };
  const sorted = [...valores].sort((a, b) => a - b);
  const mediana = sorted[Math.floor(sorted.length / 2)];
  if (mediana < 1_000 && mediana > 1) return { escala: 1_000_000_000, nota: "Valores detectados en miles de millones" };
  if (mediana < 100_000 && mediana > 10) return { escala: 1_000_000, nota: "Valores detectados en millones" };
  return { escala: 1, nota: null };
}

// ═══════════════════════════════════════════════════════════════
// AI SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════

const SYSTEM_CLASSIFIER = `Eres el clasificador documental de Velarix. Identifica el tipo de documento financiero.
Tipos: estado_resultados, balance_general, mixto, flujo_de_caja, no_reconocible
Devuelve JSON: { "tipo_documento": "...", "confianza": 0-1, "evidencias": [], "advertencias": [], "puede_continuar": true/false }`;

const SYSTEM_PERIOD_DETECTOR = `Eres el detector de períodos financieros de Velarix.
Devuelve JSON: { "periodos": [{"etiqueta": "2024", "tipo": "anual", "columna_indice": 0}], "periodo_mas_reciente": "etiqueta", "cantidad_periodos": número }`;

const SYSTEM_PARSER_FALLBACK = `Eres un extractor de datos financieros. Extrae cuentas contables con valores.
Devuelve JSON: { "rows": [{"original_label": "...", "values": {"col_1": número}, "es_subtotal": false, "posicion": número}], "column_headers": ["Cuenta", "2024"], "total_rows_extracted": número }`;

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string, maxTokens = 3000): Promise<string | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], max_tokens: maxTokens }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

function extractJSON(text: string): any {
  try { const m = text.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch {} return null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || serviceRoleKey;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    const { analysis_id, document_id } = await req.json();
    if (!analysis_id || !document_id) throw new Error("analysis_id and document_id required");

    const { data: analysis } = await supabase.from("analyses").select("*").eq("id", analysis_id).single();
    if (!analysis || analysis.user_id !== user.id) throw new Error("Not found");

    const { data: document } = await supabase.from("documents").select("*").eq("id", document_id).eq("analysis_id", analysis_id).single();
    if (!document) throw new Error("Document not found");

    await supabase.from("analyses").update({ status: "parsing_en_curso" }).eq("id", analysis_id);
    await supabase.from("documents").update({ processing_status: "procesando" }).eq("id", document_id);

    const { data: fileData, error: downloadError } = await supabase.storage.from("financial-documents").download(document.storage_path!);
    if (downloadError || !fileData) throw new Error(`Failed to download: ${downloadError?.message}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const inicio = Date.now();

    const formato = detectarFormato(bytes, document.original_filename, document.mime_type);
    if (!formato.soportado) {
      await supabase.from("documents").update({ processing_status: "fallido" }).eq("id", document_id);
      throw new Error(`El formato "${formato.tipo}" no es compatible.`);
    }

    let filas: ParsedRow[] = [];
    let metadatos: Record<string, any> = {};
    let textoPlano = "";
    let usedAIFallback = false;

    try {
      if (formato.tipo === "xlsx" || formato.tipo === "xls") {
        const result = extraerExcel(bytes);
        filas = result.filas;
        metadatos = result.metadatos;
        textoPlano = result.textoCompleto || filas.map(f => `${f.texto} ${f.valor_raw || ""}`).join("\n");
      } else if (formato.tipo === "csv") {
        const result = extraerCSV(bytes);
        filas = result.filas;
        metadatos = result.metadatos;
        textoPlano = filas.map(f => `${f.texto} ${f.valor_raw || ""}`).join("\n");
      } else if (formato.tipo === "pdf") {
        const result = extraerFilasDePDF(bytes);
        filas = result.filas;
        metadatos = result.metadatos;
        textoPlano = result.textoPlano;
      }
    } catch (e) { console.error("Extraction error, falling back to AI:", e); }

    // AI Fallback if too few rows
    const filasConValor = filas.filter(f => f.valor !== null);
    if (filasConValor.length < 3) {
      usedAIFallback = true;
      let contentForAI = textoPlano;
      if (!contentForAI || contentForAI.length < 50) {
        contentForAI = new TextDecoder("utf-8", { fatal: false }).decode(bytes).substring(0, 8000);
      }
      const parseResult = await callAI(LOVABLE_API_KEY, SYSTEM_PARSER_FALLBACK,
        `Extrae todas las cuentas contables.\n\nContenido:\n${contentForAI.substring(0, 6000)}`, 4000);
      const parsed = parseResult ? extractJSON(parseResult) : null;
      if (parsed?.rows?.length > 0) {
        filas = parsed.rows.map((row: any, idx: number) => {
          const firstVal = row.values ? Object.values(row.values)[0] : null;
          return { posicion: row.posicion || idx, texto: normalizarTexto(row.original_label), valor_raw: firstVal !== null ? String(firstVal) : null, valor: normalizarNumero(firstVal), es_encabezado: firstVal === null, es_comparativo: row.values && Object.keys(row.values).length > 1 } as ParsedRow;
        });
        metadatos = { ...metadatos, ai_fallback: true, ai_rows: parsed.rows.length, column_headers: parsed.column_headers };
      }
    }

    // Sign convention
    filas = detectarConvencionSignos(filas);

    // Currency/scale for non-Excel
    const yaConvertido = metadatos.factor_conversion_aplicado !== undefined;
    if (!yaConvertido) {
      const { factor: factorMoneda, nota: notaMoneda } = detectarMoneda(filas, textoPlano);
      if (factorMoneda !== 1) {
        filas = filas.map(f => ({ ...f, valor: f.valor !== null ? Math.round(f.valor * factorMoneda) : null }));
        metadatos = { ...metadatos, factor_conversion: factorMoneda, nota_moneda: notaMoneda };
      }
      if (factorMoneda === 1) {
        const { escala, nota: notaEscala } = detectarEscala(filas);
        if (escala !== 1) {
          filas = filas.map(f => ({ ...f, valor: f.valor !== null ? f.valor * escala : null }));
          metadatos = { ...metadatos, escala_detectada: escala, nota_escala: notaEscala };
        }
      }
    }

    // Content detection
    const contenido = detectarContenidoArchivo(filas);

    // Structure validation (friendly)
    const validacion = validarEstructuraAmigable(filas);

    if (!validacion.valida) {
      await supabase.from("documents").update({ processing_status: "fallido" }).eq("id", document_id);
      const errorMsg = validacion.errores.map((e: any) => e.mensaje).join(" ");
      await supabase.from("audit_events").insert({ analysis_id, event_type: "parse_failed", event_detail: `Parsing fallido: ${errorMsg}`, component: "parse-document", user_id: user.id, metadata: { errores: validacion.errores, formato: formato.tipo } });
      throw new Error(errorMsg);
    }

    // AI Classification
    const sampleText = filas.slice(0, 30).map(f => `${f.texto}: ${f.valor_raw || "(encabezado)"}`).join("\n");
    const classifyResult = await callAI(LOVABLE_API_KEY, SYSTEM_CLASSIFIER, `Clasifica este documento financiero.\n\nFilas extraídas:\n${sampleText}`, 500);
    const classification = classifyResult ? extractJSON(classifyResult) : null;
    let docType = classification?.tipo_documento || document.doc_type_declared || "no_reconocible";

    // Override doc type based on content detection if AI says "no_reconocible"
    if (docType === "no_reconocible" && contenido.tieneAmbos) docType = "mixto";
    else if (docType === "no_reconocible" && contenido.tieneEstadoResultados) docType = "estado_resultados";
    else if (docType === "no_reconocible" && contenido.tieneBalanceGeneral) docType = "balance_general";

    // AI Period Detection
    const periodResult = await callAI(LOVABLE_API_KEY, SYSTEM_PERIOD_DETECTOR, `Detecta los períodos.\n\n${sampleText}`, 500);
    const periods = periodResult ? extractJSON(periodResult) : null;
    const periodsDetected = periods?.periodos?.map((p: any) => p.etiqueta) || [];

    const tiempoMs = Date.now() - inicio;

    // Store Results
    const parsedStructure = {
      rows: filas.map(f => ({
        original_label: f.texto,
        values: f.valor !== null ? { [f.periodo || "col_1"]: f.valor } : {},
        es_subtotal: false,
        posicion: f.posicion,
        es_comparativo: f.es_comparativo || false,
        convencion_signos: f.convencion_signos,
      })),
      column_headers: metadatos.column_headers || periodsDetected,
      total_rows_extracted: filas.length,
      validacion,
      contenido_detectado: contenido,
    };

    await supabase.from("documents_parsed").insert({
      document_id,
      parsed_structure: parsedStructure,
      periods_detected: periodsDetected.length > 0 ? periodsDetected : null,
      parsing_metadata: {
        classification: classification || { tipo_documento: docType },
        periods_info: periods,
        rows_extracted: filas.length,
        rows_with_values: filas.filter(f => f.valor !== null).length,
        formato: formato.tipo,
        ai_fallback_used: usedAIFallback,
        tiempo_ms: tiempoMs,
        contenido_detectado: contenido,
        nota_conversion: metadatos.nota_conversion || metadatos.nota_moneda || null,
      },
    });

    await supabase.from("documents").update({ processing_status: "completado", doc_type_declared: docType }).eq("id", document_id);
    await supabase.from("analyses").update({ status: "parsing_completado" }).eq("id", analysis_id);

    await supabase.from("audit_events").insert({
      analysis_id, event_type: "parse_complete",
      event_detail: `Parsing completado: ${filas.length} filas (${filas.filter(f => f.valor !== null).length} con valor), tipo: ${docType}, contenido: ER=${contenido.tieneEstadoResultados} ESF=${contenido.tieneBalanceGeneral}`,
      component: "parse-document", user_id: user.id,
      metadata: {
        doc_type: docType, formato: formato.tipo, rows: filas.length,
        contenido_detectado: contenido,
        nota_conversion: metadatos.nota_conversion || metadatos.nota_moneda || null,
        ai_fallback: usedAIFallback, tiempo_ms: tiempoMs,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        doc_type: docType,
        classification,
        periods,
        rows_extracted: filas.length,
        rows_with_values: filas.filter(f => f.valor !== null).length,
        column_headers: parsedStructure.column_headers,
        formato: formato.tipo,
        ai_fallback_used: usedAIFallback,
        contenido_detectado: contenido,
        validacion,
        tiempo_ms: tiempoMs,
        nota_conversion: metadatos.nota_conversion || metadatos.nota_moneda || null,
      },
      meta: { analysis_id, document_id, timestamp: new Date().toISOString() },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("parse-document error:", error);
    return new Response(JSON.stringify({ success: false, error: { code: "PARSE_ERROR", message: error instanceof Error ? error.message : "Error al procesar el documento." } }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
