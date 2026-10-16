// Homologación consciente del estado financiero (ACCOUNT HOMOLOGATION
// LINEAGE). Módulo puro: sin Supabase, sin Deno, sin IA.
//
// Filas con contexto de estado (las que produce el extractor de libros
// multi-estado: `statement`, `source_section`, `unit`, `source_sheet`…) se
// homologan solo si la cuenta fuente y la cuenta canónica son compatibles con
// ese contexto, en este orden: etiqueta → estado → sección → unidad →
// período → valor. Si la compatibilidad no se puede determinar con
// seguridad, la fila queda `unclassified` con el motivo — nunca se elige por
// posición, magnitud ni orden de iteración.
//
// Filas SIN contexto (CSV, PDF, Excel de una hoja) conservan exactamente la
// regla previa (`matchAccount` + categoría por doc_type).
//
// La taxonomía no se amplía aquí: las cuentas canónicas siguen siendo las de
// account-taxonomy.ts (todas monetarias; balance_sheet e income_statement;
// ninguna de flujo de caja ni de impuesto diferido).

import { TAXONOMY, matchAccount, normalizeLabel, exactCanonicalIn } from "./account-taxonomy.ts";

export interface SourceRow {
  label: string;
  values: Record<string, unknown>;
  documentId: string;
  docType: string;
  posicion?: number;
  statement?: string | null;
  section?: string | null;
  unit?: string | null;
  sheet?: string | null;
  sourceLabel?: string | null;
}

export interface HomologationRecord {
  analysis_id: string;
  document_id: string;
  original_label: string;
  canonical_account: string;
  category: string;
  period: string | null;
  value: number | null;
  confidence_score: "alta" | "media" | "baja";
  ambiguity_flag: boolean;
  mapping_notes: string;
}

export type RejectionCode =
  | "UNIT_NOT_MONETARY"
  | "STATEMENT_INCOMPATIBLE"
  | "SECTION_INCOMPATIBLE"
  | "SUBSTRING_AMBIGUOUS"
  | "DUPLICATE_LABEL_CONTEXT"
  | "NO_MATCH";

/** Conflictos determinísticos: la IA no puede reclasificarlos. */
export const DETERMINISTIC_REJECTIONS: ReadonlySet<RejectionCode> = new Set([
  "UNIT_NOT_MONETARY", "STATEMENT_INCOMPATIBLE", "SECTION_INCOMPATIBLE", "SUBSTRING_AMBIGUOUS", "DUPLICATE_LABEL_CONTEXT",
]);

export interface MappingDraft {
  record: HomologationRecord;
  /** true si la fila trae contexto de estado (lineage nuevo). */
  contextual: boolean;
  rejection: RejectionCode | null;
  source: SourceRow;
}

type TaxonomyCategory = keyof typeof TAXONOMY;

/**
 * Lado del balance de cada cuenta canónica de balance existente (propiedad
 * contable de la cuenta, no una cuenta nueva). Un test exige que toda cuenta
 * de TAXONOMY.balance_sheet declare su lado.
 */
export const BALANCE_SIDE: Record<string, "asset" | "liability" | "equity"> = {
  cash: "asset", accounts_receivable: "asset", inventory: "asset", ppe: "asset", total_assets: "asset",
  accounts_payable: "liability", current_financial_debt: "liability", long_term_financial_debt: "liability", total_liabilities: "liability",
  equity: "equity",
};

/** Lado que declara un encabezado de sección del balance, o null si no lo declara (o declara más de uno). */
export function sectionSide(section: string | null | undefined): "asset" | "liability" | "equity" | null {
  const s = normalizeLabel(String(section ?? ""));
  const sides = new Set<"asset" | "liability" | "equity">();
  if (/\bassets?\b|\bactivos?\b/.test(s)) sides.add("asset");
  if (/\bliabilit(y|ies)\b|\bpasivos?\b/.test(s)) sides.add("liability");
  if (/\bequity\b|\bpatrimonio\b/.test(s)) sides.add("equity");
  return sides.size === 1 ? [...sides][0] : null;
}

/** Estado del documento → categoría de la taxonomía con cuentas canónicas, o null si ese estado no tiene ninguna. */
function taxonomyCategoryOf(statement: string): TaxonomyCategory | null {
  return statement === "balance_sheet" || statement === "income_statement" ? statement : null;
}

// Exacto incluye EXACT_ONLY_SYNONYMS (sinónimos que nunca cuentan por substring).
const exactIn = (label: string, category: TaxonomyCategory): string | null => exactCanonicalIn(label, category);

function substringIn(label: string, category: TaxonomyCategory): string[] {
  const n = normalizeLabel(label);
  const hits = new Set<string>();
  for (const [canonical, synonyms] of Object.entries(TAXONOMY[category])) {
    if (synonyms.some((s) => { const ns = normalizeLabel(s); return n.includes(ns) || ns.includes(n); })) hits.add(canonical);
  }
  return [...hits];
}

export interface ContextDecision {
  canonical: string | null;
  score: number;
  rejection: RejectionCode | null;
  reason: string | null;
}

/** Homologación de una fila con contexto de estado. Nunca vuelve a la regla genérica si el contexto la contradice. */
export function matchAccountInContext(row: Pick<SourceRow, "label" | "statement" | "section" | "unit">): ContextDecision {
  const reject = (rejection: RejectionCode, reason: string): ContextDecision => ({ canonical: null, score: 0.3, rejection, reason });
  const statement = String(row.statement);
  const otherCategories = (Object.keys(TAXONOMY) as TaxonomyCategory[]).filter((c) => c !== statement);

  if (row.unit && row.unit !== "monetaria") {
    return reject("UNIT_NOT_MONETARY", `unidad "${row.unit}": todas las cuentas canónicas son monetarias`);
  }
  const category = taxonomyCategoryOf(statement);
  const foreign = (c: TaxonomyCategory[]) => {
    for (const cat of c) { const e = exactIn(row.label, cat); if (e) return { canonical: e, cat }; }
    for (const cat of c) { const s = substringIn(row.label, cat); if (s.length) return { canonical: s.join("|"), cat }; }
    return null;
  };
  if (!category) {
    const f = foreign(Object.keys(TAXONOMY) as TaxonomyCategory[]);
    return f
      ? reject("STATEMENT_INCOMPATIBLE", `"${f.canonical}" es de ${f.cat}; la fila es de ${statement}, que no tiene cuentas canónicas`)
      : reject("NO_MATCH", "sin cuenta canónica");
  }

  let canonical = exactIn(row.label, category);
  let score = 0.95;
  if (!canonical) {
    const exactForeign = foreign(otherCategories.filter((c) => exactIn(row.label, c)));
    if (exactForeign) return reject("STATEMENT_INCOMPATIBLE", `"${exactForeign.canonical}" es de ${exactForeign.cat}; la fila es de ${statement}`);
    const hits = substringIn(row.label, category);
    if (hits.length > 1) return reject("SUBSTRING_AMBIGUOUS", `coincide con varias cuentas de ${category}: ${hits.join(", ")}`);
    if (hits.length === 0) {
      const f = foreign(otherCategories);
      return f ? reject("STATEMENT_INCOMPATIBLE", `"${f.canonical}" es de ${f.cat}; la fila es de ${statement}`) : reject("NO_MATCH", "sin cuenta canónica");
    }
    canonical = hits[0];
    score = 0.82;
  }

  if (category === "balance_sheet") {
    const side = sectionSide(row.section);
    const expected = BALANCE_SIDE[canonical];
    if (side && expected && side !== expected) {
      return reject("SECTION_INCOMPATIBLE", `"${canonical}" es ${expected}; la sección "${row.section}" es ${side}`);
    }
  }
  return { canonical, score, rejection: null, reason: null };
}

const confidenceOf = (score: number): "alta" | "media" | "baja" => (score >= 0.9 ? "alta" : score >= 0.75 ? "media" : "baja");

function lineageNote(row: SourceRow): string {
  const parts = [
    `estado=${row.statement}`,
    row.section ? `sección="${row.section}"` : "sección=—",
    `unidad=${row.unit ?? "—"}`,
    row.sheet ? `hoja="${row.sheet}"` : null,
    row.sourceLabel ? `etiqueta="${row.sourceLabel}"` : null,
  ].filter(Boolean);
  return `contexto: ${parts.join("; ")}`;
}

export const hasStatementContext = (row: SourceRow) => typeof row.statement === "string" && row.statement.length > 0;

/**
 * PASS 1 (reglas) de map-accounts. Filas sin contexto: comportamiento previo
 * idéntico. Filas con contexto: compatibilidad estado/sección/unidad, sin
 * filas de encabezado (sin valor numérico no hay cuenta que homologar; la
 * Evidence sigue en parsed_structure) y sin duplicados operacionales.
 */
export function buildRuleMappings(analysisId: string, rows: readonly SourceRow[]): MappingDraft[] {
  const drafts: MappingDraft[] = [];
  for (const row of rows) {
    const periods = Object.keys(row.values).filter((k) => row.values[k] != null && typeof row.values[k] === "number");

    if (!hasStatementContext(row)) {
      const { canonical, category, score } = matchAccount(row.label);
      const base = (period: string | null, value: number | null): MappingDraft => ({
        contextual: false, rejection: null, source: row,
        record: {
          analysis_id: analysisId, document_id: row.documentId, original_label: row.label,
          canonical_account: canonical || "unclassified",
          category: category === "unknown" ? (row.docType === "estado_resultados" ? "income_statement" : "balance_sheet") : category,
          period, value,
          confidence_score: confidenceOf(score),
          ambiguity_flag: score < 0.75 || canonical === null,
          mapping_notes: canonical ? `Regla: ${canonical} (${score.toFixed(2)})` : `Regla: no clasificado (${score.toFixed(2)})`,
        },
      });
      if (periods.length > 0) for (const p of periods) drafts.push(base(p, row.values[p] as number));
      else { const v = row.values.col_1; drafts.push(base(null, typeof v === "number" && v ? v : null)); }
      continue;
    }

    if (periods.length === 0) continue; // encabezado de sección: no es una cuenta
    const d = matchAccountInContext(row);
    for (const p of periods) {
      drafts.push({
        contextual: true, rejection: d.rejection, source: row,
        record: {
          analysis_id: analysisId, document_id: row.documentId, original_label: row.label,
          canonical_account: d.canonical ?? "unclassified",
          category: String(row.statement),
          period: p, value: row.values[p] as number,
          confidence_score: confidenceOf(d.score),
          ambiguity_flag: d.canonical === null || d.score < 0.75,
          mapping_notes: d.canonical
            ? `Regla: ${d.canonical} (${d.score.toFixed(2)}) · ${lineageNote(row)}`
            : `Regla: no clasificado — ${d.rejection}: ${d.reason} · ${lineageNote(row)}`,
        },
      });
    }
  }

  // Duplicados con contexto: misma cuenta canónica + período + etiqueta en
  // más de una fila fuente → no se puede saber si es una sola observación
  // repetida o dos partidas distintas. Todas quedan abiertas (no se suma, no
  // se promedia, no se elige la primera).
  const groups = new Map<string, MappingDraft[]>();
  for (const d of drafts) {
    if (!d.contextual || d.record.canonical_account === "unclassified") continue;
    const k = `${d.record.canonical_account}|${d.record.period}|${normalizeLabel(d.record.original_label)}`;
    groups.set(k, [...(groups.get(k) ?? []), d]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const canonical = group[0].record.canonical_account;
    for (const d of group) {
      d.rejection = "DUPLICATE_LABEL_CONTEXT";
      Object.assign(d.record, {
        canonical_account: "unclassified", ambiguity_flag: true, confidence_score: "baja",
        mapping_notes: `Regla: no clasificado — DUPLICATE_LABEL_CONTEXT: "${canonical}" aparece ${group.length} veces para ${d.record.period} con la misma etiqueta · ${lineageNote(d.source)}`,
      });
    }
  }
  return drafts;
}

export type AiProposalDecision = { accepted: true } | { accepted: false; reason: string };

/**
 * ¿Puede aplicarse una propuesta de IA (canonical para una etiqueta+período)
 * sobre filas con contexto? Solo clasifica: nunca cambia el valor, nunca
 * resuelve un conflicto determinístico, y exige una única fila destino
 * compatible con estado/sección/unidad.
 */
export function evaluateAiProposalForContextRows(targets: readonly MappingDraft[], canonical: string, aiValue: number): AiProposalDecision {
  if (targets.length !== 1) return { accepted: false, reason: `la propuesta coincide con ${targets.length} filas fuente; no se elige una` };
  const [t] = targets;
  if (t.rejection && DETERMINISTIC_REJECTIONS.has(t.rejection)) return { accepted: false, reason: `conflicto determinístico ${t.rejection}` };
  if (t.record.value !== aiValue) return { accepted: false, reason: `el valor propuesto (${aiValue}) no es el de la fila fuente (${t.record.value})` };
  const ctx = matchAccountInContext(t.source);
  if (ctx.rejection && ctx.rejection !== "NO_MATCH") return { accepted: false, reason: `conflicto determinístico ${ctx.rejection}` };
  const category = taxonomyCategoryOf(String(t.source.statement));
  if (!category || !(canonical in TAXONOMY[category])) return { accepted: false, reason: `"${canonical}" no es una cuenta de ${t.source.statement}` };
  const side = category === "balance_sheet" ? sectionSide(t.source.section) : null;
  if (side && BALANCE_SIDE[canonical] && BALANCE_SIDE[canonical] !== side) return { accepted: false, reason: `"${canonical}" es ${BALANCE_SIDE[canonical]}; la sección es ${side}` };
  return { accepted: true };
}

export type UncontextualAiDecision =
  | { accepted: true }
  | { accepted: false; code: "AI_SYNTHETIC_HOMOLOGATION_NOT_ALLOWED" | "AI_AMBIGUOUS_SOURCE" | "AI_VALUE_MISMATCH"; reason: string };

interface UncontextualRow { original_label: string; category?: string | null; period?: string | null; value: number | null; canonical_account: string }

/**
 * Propuesta de IA sobre filas SIN contexto de estado (misma regla que
 * `evaluateAiProposalForContextRows`, sin la parte de estado/sección que estas
 * filas no tienen). AI classification ≠ Evidence creation:
 * - sin fila fuente observada → rechazo (nunca se inserta una homologación
 *   con cifra, etiqueta o documento propuestos por la IA, ni "consolidada");
 * - varias filas candidatas, o una clave (etiqueta, estado, período) que no
 *   identifica una sola fila → rechazo (no se elige);
 * - valor propuesto ≠ valor observado → rechazo (la IA no corrige ni consolida cifras).
 * Si se acepta, el llamador solo cambia metadata de mapping; `value` nunca.
 */
export function evaluateAiProposalForUncontextualRows(
  candidates: readonly UncontextualRow[],
  aiValue: number,
  allRows: readonly UncontextualRow[] = candidates,
): UncontextualAiDecision {
  if (candidates.length === 0) {
    return { accepted: false, code: "AI_SYNTHETIC_HOMOLOGATION_NOT_ALLOWED", reason: "sin fila fuente observada: la IA no crea homologaciones con cifras propias (ni consolidadas)" };
  }
  if (candidates.length !== 1) return { accepted: false, code: "AI_AMBIGUOUS_SOURCE", reason: `la propuesta coincide con ${candidates.length} filas fuente; no se elige una` };
  const [t] = candidates;
  const sameKey = allRows.filter((r) => r.original_label === t.original_label && (r.category ?? null) === (t.category ?? null) && (r.period ?? null) === (t.period ?? null));
  if (sameKey.length !== 1) return { accepted: false, code: "AI_AMBIGUOUS_SOURCE", reason: `la etiqueta "${t.original_label}" aparece ${sameKey.length} veces en ${t.period ?? "el período"}; no se elige una` };
  if (t.value !== aiValue) return { accepted: false, code: "AI_VALUE_MISMATCH", reason: `el valor propuesto (${aiValue}) no es el de la fila fuente (${t.value}); la IA no reescribe ni consolida cifras` };
  return { accepted: true };
}
