// Extracción determinística de libros XLSX con varios estados financieros
// (p. ej. el `Financial_Report.xlsx` que EDGAR genera desde XBRL). Módulo
// puro: sin Supabase, sin Deno, sin red, sin la librería xlsx — recibe las
// hojas ya leídas como matrices de celdas.
//
// Reglas (Evidence ≠ Judgment ≠ Calculation):
// - ESCALA: si el documento declara su escala ("$ in Thousands", "in
//   Millions", "miles de pesos"…), esa declaración manda y NO se infiere
//   otra por magnitud. Los valores se guardan CRUDOS, tal cual el archivo;
//   la escala viaja como `factor_escala` y la aplica una sola vez
//   build-structured-input (contrato BL-03). Escalas declaradas distintas
//   entre hojas seleccionadas → fail-closed.
// - HOJAS: se seleccionan los estados principales (balance, resultados,
//   flujo de caja) por título/nombre normalizado, nunca por índice ni por
//   nombre de empresa. Se excluyen Parenthetical, Policies, Tables, Details,
//   Schedule of… y notas.
// - PERÍODOS: una fecha de cierre se resuelve a año fiscal ("2024") solo con
//   contexto anual explícito (12 Months Ended / Year Ended) o, en el balance,
//   cuando coincide con el cierre de un período de 12 meses del mismo libro.
//   Trimestres, 3/6/9 meses, LTM o fechas sueltas quedan con su etiqueta
//   literal y se reportan como no resueltos — nunca se inventa un FY.
// - Las secciones dimensionales XBRL ("… [Member]") no son partidas
//   principales: se excluyen de las filas y se registran en metadata.

import { normalizarTexto, type ParsedRow } from "./parse-document-csv-extractor.ts";
import { normalizarNumero } from "./parse-document-ai-fallback.ts";

export type Cell = string | number | null;

export interface SheetInput {
  name: string;
  matrix: Cell[][];
  /** Rangos combinados (0-based, inclusivos), como `ws["!merges"]` de xlsx. */
  merges?: { s: { r: number; c: number }; e: { r: number; c: number } }[];
}

// ── Escala declarada ──────────────────────────────────────────────

export type ScaleName = "thousands" | "millions" | "billions";
export const SCALE_FACTORS: Record<ScaleName, number> = { thousands: 1_000, millions: 1_000_000, billions: 1_000_000_000 };

export interface DeclaredScale {
  name: ScaleName;
  factor: number;
  /** Fragmento literal del documento del que sale la escala. */
  text: string;
}

export class DeclaredScaleConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeclaredScaleConflictError";
  }
}

const EN_SCALE = /\b(thousands|millions|billions)\b/;
const ES_SCALE: [RegExp, ScaleName][] = [
  [/\bmiles\s+de\s+(?:pesos|d[oó]lares)\b|\bcifras\s+en\s+miles\b|\bcop\s*miles\b|\bmiles\s*cop\b/i, "thousands"],
  [/\bmillones\s+de\s+(?:pesos|d[oó]lares)\b|\bcifras\s+en\s+millones\b|\bcop\s*mm\b|\bmm\s*cop\b/i, "millions"],
];

/**
 * Escala monetaria declarada en un texto (título/cabecera). Solo cuenta una
 * declaración "<moneda> in <escala>" o "in <escala>" que no se refiera a
 * acciones ni a enteros ("shares in Thousands", "Integer in Millions").
 * Varias declaraciones monetarias distintas en el mismo texto → conflicto.
 */
export function detectDeclaredScale(text: string | null | undefined): DeclaredScale | null {
  const t = String(text ?? "").replace(/\s+/g, " ");
  const found = new Map<ScaleName, string>();
  const re = /(?:([$€]|\b(?:usd|us\$|cop|eur)\b|\b(?:shares|integer|units|pure)\b)\s*)?(?:\(\$\)\s*)?\bin\s+(thousands|millions|billions)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const qualifier = (m[1] ?? "").toLowerCase();
    if (["shares", "integer", "units", "pure"].includes(qualifier)) continue;
    const name = m[2].toLowerCase() as ScaleName;
    if (EN_SCALE.test(name)) found.set(name, m[0].trim());
  }
  for (const [rx, name] of ES_SCALE) {
    const em = t.match(rx);
    if (em) found.set(name, em[0].trim());
  }
  if (found.size === 0) return null;
  if (found.size > 1) {
    throw new DeclaredScaleConflictError(`Escalas monetarias declaradas incompatibles en el mismo encabezado: ${[...found.values()].join(" / ")}.`);
  }
  const [[name, frag]] = [...found.entries()];
  return { name, factor: SCALE_FACTORS[name], text: frag };
}

// ── Clasificación de hojas ────────────────────────────────────────

export type StatementCategory = "balance_sheet" | "income_statement" | "cash_flow" | "equity";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();

const EXCLUDE = /parenthetical|\(polic(y|ies)\)|\(tables?\)|\(details?\b|details narrative|\bschedule of\b|\bdisclosure\b|\bnotes? to\b/;
const CATEGORY_PATTERNS: [StatementCategory, RegExp][] = [
  ["cash_flow", /\bstatements? of (consolidated )?cash flows?\b|\bcash flows? statements?\b|\bestados? de flujos? de efectivo\b/],
  ["equity", /\bstatements? of (changes in )?(shareholders|stockholders)'? ?equity\b|\bstatements? of changes in equity\b|\bcambios en el patrimonio\b/],
  ["balance_sheet", /\bbalance sheets?\b|\bstatements? of (consolidated )?financial (position|condition)\b|\bbalance general\b|\bestados? de situacion financiera\b/],
  ["income_statement", /\bstatements? of (consolidated )?(operations|income|earnings)\b|\bincome statements?\b|\bprofit and loss\b|\bstatements? of (consolidated )?comprehensive income\b|\boperations and comprehensive income\b|\bestados? de resultados\b/],
];

/** Título de la hoja: la primera celda de texto (en los libros de EDGAR, A1). */
export function sheetTitle(sheet: SheetInput): string {
  for (const row of sheet.matrix.slice(0, 3)) {
    const v = row?.[0];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Categoría de estado principal según título y nombre de pestaña, o null (nota, detalle, política…). */
export function classifyStatementSheet(name: string, title: string): StatementCategory | null {
  const t = norm(title);
  const n = norm(name);
  if (EXCLUDE.test(t) || EXCLUDE.test(n)) return null;
  for (const [cat, rx] of CATEGORY_PATTERNS) if (rx.test(t)) return cat;
  for (const [cat, rx] of CATEGORY_PATTERNS) if (rx.test(n)) return cat;
  return null;
}

// ── Períodos ──────────────────────────────────────────────────────

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12, ene: 1, abr: 4, ago: 8, dic: 12 };

export interface CalendarDate { y: number; m: number; d: number }

/** "Dec. 31, 2024", "December 31, 2024", "31 Dec 2024", "2024-12-31". Otro formato → null. */
export function parseCloseDate(label: string | null | undefined): CalendarDate | null {
  const s = String(label ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),\s*(\d{4})$/);
  if (m) return monthOf(m[1]) ? valid(+m[3], monthOf(m[1])!, +m[2]) : null;
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})$/);
  if (m) return monthOf(m[2]) ? valid(+m[3], monthOf(m[2])!, +m[1]) : null;
  return null;
}
function monthOf(word: string): number | null {
  const w = word.toLowerCase();
  return MONTHS[w] ?? MONTHS[w.slice(0, 3)] ?? null;
}
function valid(y: number, m: number, d: number): CalendarDate | null {
  return y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31 ? { y, m, d } : null;
}
const dateKey = (d: CalendarDate) => `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;

export type DurationKind = "annual" | "interim" | "other";

/** "12 Months Ended" / "Year Ended" = anual; 3/6/9 meses, trimestre, LTM = interino. */
export function classifyDuration(label: string | null | undefined): DurationKind | null {
  const s = norm(String(label ?? ""));
  if (!s) return null;
  if (/^(12|twelve) months? ended$|^(fiscal )?years? ended$/.test(s)) return "annual";
  if (/\b(1|2|3|4|5|6|7|8|9|10|11|one|two|three|four|five|six|seven|eight|nine|ten|eleven) months? ended\b|\bquarter|\bltm\b|\btrailing\b|\bytd\b/.test(s)) return "interim";
  return "other";
}

export interface ColumnPeriod {
  col: number;
  /** Clave del período en `values`: "2024" si se resolvió, si no la etiqueta literal. */
  period: string;
  label: string;
  resolved: boolean;
  basis: "annual_duration" | "annual_close" | "fiscal_year_header" | "unresolved";
  /** Fecha de cierre parseada (para vincular el balance con los períodos de 12 meses). */
  close?: string;
  duration: DurationKind | null;
}

// ── Extracción ────────────────────────────────────────────────────

export interface SheetSummary {
  sheet: string;
  category: StatementCategory;
  title: string;
  extracted: boolean;
  rows: number;
  rows_with_values: number;
  periods: string[];
  unresolved_periods: string[];
  declared_scale: string | null;
  dimensional_rows_excluded: number;
  dimensional_members: string[];
}

export interface WorkbookExtraction {
  filas: ParsedRow[];
  column_headers: string[];
  declaredScale: (DeclaredScale & { sheets: string[] }) | null;
  sheets: SheetSummary[];
  detected_not_extracted: SheetSummary[];
}

const isBlank = (v: Cell | undefined) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");
const PER_SHARE = /\bper (basic |diluted )?(common |ordinary )?share\b|\bearnings per share\b|\beps\b/i;
const SHARE_COUNT = /\bweighted[- ]average\b.*\bshares\b|\bshares outstanding\b|^(number of )?shares (issued|outstanding)\b/i;

export function unitOfLabel(label: string): "monetaria" | "por_accion" | "acciones" {
  if (PER_SHARE.test(label)) return "por_accion";
  if (SHARE_COUNT.test(label)) return "acciones";
  return "monetaria";
}

/** Índice de la fila de fechas/años (primera de las 10 primeras con una fecha de cierre o un año en col ≥ 1). */
function findHeaderRow(matrix: Cell[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 10); i++) {
    const row = matrix[i] ?? [];
    if (row.slice(1).some((c) => typeof c === "string" && (parseCloseDate(c) !== null || /^(FY\s?)?(19|20)\d{2}$/i.test(c.trim())))) return i;
  }
  return -1;
}

/** Valor de una celda considerando rangos combinados (el valor vive en la esquina superior izquierda). */
function cellWithMerges(sheet: SheetInput, r: number, c: number): Cell {
  const direct = sheet.matrix[r]?.[c];
  if (!isBlank(direct)) return direct ?? null;
  for (const mg of sheet.merges ?? []) {
    if (r >= mg.s.r && r <= mg.e.r && c >= mg.s.c && c <= mg.e.c) return sheet.matrix[mg.s.r]?.[mg.s.c] ?? null;
  }
  return null;
}

function columnPeriods(sheet: SheetInput, headerRow: number): ColumnPeriod[] {
  const header = sheet.matrix[headerRow] ?? [];
  const out: ColumnPeriod[] = [];
  for (let c = 1; c < header.length; c++) {
    const raw = header[c];
    if (isBlank(raw)) continue;
    const label = String(raw).trim();
    let durationLabel: string | null = null;
    for (let r = headerRow - 1; r >= 0 && durationLabel === null; r--) {
      const v = cellWithMerges(sheet, r, c);
      if (typeof v === "string" && v.trim()) durationLabel = v.trim();
    }
    const duration = classifyDuration(durationLabel);
    const fy = label.match(/^(?:FY\s?)?((?:19|20)\d{2})$/i);
    const date = parseCloseDate(label);
    const shown = durationLabel ? `${durationLabel} ${label}` : label;
    if (fy && duration !== "interim") {
      out.push({ col: c, period: fy[1], label: shown, resolved: true, basis: "fiscal_year_header", duration });
    } else if (date && duration === "annual") {
      out.push({ col: c, period: String(date.y), label: shown, resolved: true, basis: "annual_duration", close: dateKey(date), duration });
    } else {
      out.push({ col: c, period: shown, label: shown, resolved: false, basis: "unresolved", close: date ? dateKey(date) : undefined, duration });
    }
  }
  return out;
}

const MEMBER_ROW = /\[member\]\s*$/i;

/**
 * Selecciona y extrae los estados principales de un libro. Devuelve null si
 * el libro no tiene al menos dos estados principales (balance, resultados,
 * flujo de caja): ese caso sigue la ruta clásica de una sola hoja.
 */
export function extractFinancialStatementsWorkbook(sheets: SheetInput[]): WorkbookExtraction | null {
  const classified = sheets.map((s) => ({ sheet: s, title: sheetTitle(s), category: classifyStatementSheet(s.name, sheetTitle(s)) }));
  const seen = new Set<string>();
  const primary = classified.filter((x) => {
    if (!x.category || x.category === "equity" || seen.has(x.sheet.name)) return false;
    seen.add(x.sheet.name);
    return true;
  });
  if (new Set(primary.map((p) => p.category)).size < 2) return null;

  // Escala: todas las hojas extraídas deben declarar la misma, o ninguna.
  const scales = primary.map((p) => ({ name: p.sheet.name, scale: detectDeclaredScale(p.sheet.matrix.slice(0, 3).flat().filter((c) => typeof c === "string").join(" ")) }));
  const declared = scales.filter((s) => s.scale);
  if (declared.length > 0) {
    const distinct = new Set(declared.map((s) => s.scale!.factor));
    if (distinct.size > 1 || declared.length !== scales.length) {
      throw new DeclaredScaleConflictError(
        `Las hojas seleccionadas no declaran una escala común: ${scales.map((s) => `${s.name}: ${s.scale?.text ?? "sin escala declarada"}`).join("; ")}.`,
      );
    }
  }

  // Cierres anuales observados en estados de flujo (12 meses) → validan las fechas del balance.
  const perSheet = primary.map((p) => {
    const headerRow = findHeaderRow(p.sheet.matrix);
    return { ...p, headerRow, cols: headerRow >= 0 ? columnPeriods(p.sheet, headerRow) : [] };
  });
  const annualCloses = new Set(perSheet.flatMap((p) => p.cols.filter((c) => c.basis === "annual_duration" && c.close).map((c) => c.close!)));
  for (const p of perSheet) {
    if (p.category !== "balance_sheet") continue;
    for (const col of p.cols) {
      if (!col.resolved && col.duration === null && col.close && annualCloses.has(col.close)) {
        Object.assign(col, { period: col.close.slice(0, 4), resolved: true, basis: "annual_close" as const });
      }
    }
  }

  const filas: ParsedRow[] = [];
  const summaries: SheetSummary[] = [];
  let offset = 0;
  for (const p of perSheet) {
    const { sheet, category, title, headerRow, cols } = p;
    let rows = 0, withValues = 0, dimensionalRows = 0;
    const members: string[] = [];
    let inMembers = false;
    for (let r = headerRow + 1; headerRow >= 0 && r < sheet.matrix.length; r++) {
      const row = sheet.matrix[r] ?? [];
      const rawLabel = row[0];
      if (isBlank(rawLabel)) continue;
      const labelText = String(rawLabel).trim();
      const valueCells = cols.map((c) => ({ c, v: row[c.col] })).filter((x) => !isBlank(x.v));
      if (MEMBER_ROW.test(labelText) && valueCells.length === 0) {
        inMembers = true;
        members.push(labelText);
        continue;
      }
      if (inMembers) { dimensionalRows++; continue; }
      const texto = normalizarTexto(labelText);
      const unidad = unitOfLabel(labelText);
      const base = { posicion: offset + r, texto, etiqueta_literal: labelText, hoja: sheet.name, estado: category!, unidad, linea_original: row.map((x) => (x === null ? "" : String(x))).join("\t") };
      if (valueCells.length === 0) {
        filas.push({ ...base, valor_raw: null, valor: null, es_encabezado: true });
        rows++;
        continue;
      }
      for (const { c, v } of valueCells) {
        const valor = typeof v === "number" ? v : normalizarNumero(String(v));
        filas.push({
          ...base, valor_raw: String(v), valor, columna: c.col - 1, periodo: c.period, periodo_etiqueta: c.label,
          es_encabezado: false, es_comparativo: cols.length > 1,
        });
        rows++;
        if (valor !== null) withValues++;
      }
    }
    offset += sheet.matrix.length;
    summaries.push({
      sheet: sheet.name, category: category!, title, extracted: true, rows, rows_with_values: withValues,
      periods: [...new Set(cols.filter((c) => c.resolved).map((c) => c.period))].sort().reverse(),
      unresolved_periods: cols.filter((c) => !c.resolved).map((c) => c.label),
      declared_scale: scales.find((s) => s.name === sheet.name)?.scale?.text ?? null,
      dimensional_rows_excluded: dimensionalRows, dimensional_members: members,
    });
  }

  const detected = classified
    .filter((x) => x.category === "equity")
    .map((x) => ({
      sheet: x.sheet.name, category: "equity" as const, title: x.title, extracted: false, rows: 0, rows_with_values: 0,
      periods: [], unresolved_periods: [], declared_scale: null, dimensional_rows_excluded: 0, dimensional_members: [],
    }));

  const column_headers = [...new Set(perSheet.flatMap((p) => p.cols.map((c) => c.period)))].sort().reverse();
  return {
    filas,
    column_headers,
    declaredScale: declared.length ? { ...declared[0].scale!, sheets: declared.map((d) => d.name) } : null,
    sheets: summaries,
    detected_not_extracted: detected,
  };
}
