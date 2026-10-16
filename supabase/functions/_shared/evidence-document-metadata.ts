// Metadata documental (moneda del documento, factor de escala) que acompaña
// al set ACTIVO de Evidence al construir el structured input.
//
// Con `active_evidence_run_id`, la metadata sale EXCLUSIVAMENTE de los
// `documents_parsed` que alimentaron ese run (`evidence_runs.source_parsed_document_ids`),
// nunca del último `parse_complete` del análisis: un parse posterior cuyo run
// falló no puede cambiar la moneda/escala de las homologaciones activas.
// Fail-closed: sin fuentes, fuente inexistente, escala ausente o fuentes
// incompatibles → error (no se elige "la última").
// Puntero NULL (legacy): comportamiento previo — último `parse_complete` del
// análisis, `factor_escala` ausente → 1 (VALID_LEGACY_DEFAULT, documentado).
// No cambia la conversión (BL-03): solo QUÉ metadata se usa.

import { normalizeCurrencyCode, type CurrencyCode } from "./currency.ts";
import type { Db } from "./evidence-runs.ts";

export interface ParsedDocumentMetadataRow {
  id: string;
  parsing_metadata?: { moneda_documento?: unknown; factor_escala?: unknown } | null;
}

export type DocumentMetadataErrorCode =
  | "ACTIVE_EVIDENCE_SOURCE_MISSING"
  | "ACTIVE_EVIDENCE_SOURCE_NOT_FOUND"
  | "ACTIVE_EVIDENCE_SCALE_MISSING"
  | "ACTIVE_EVIDENCE_METADATA_CONFLICT";

export type DocumentMetadataResolution =
  | { ok: true; source: "active_evidence_run"; evidenceRunId: string; parsedDocumentIds: string[]; monedaDocumento: CurrencyCode | null; factorEscala: number }
  | { ok: true; source: "legacy_latest_parse_event"; monedaDocumento: CurrencyCode | null; factorEscala: number }
  | { ok: false; code: DocumentMetadataErrorCode; message: string };

/** Decisión pura sobre los parsed documents fuente de un evidence run. */
export function resolveMetadataFromParsedDocuments(evidenceRunId: string, sourceIds: readonly string[] | null | undefined, rows: readonly ParsedDocumentMetadataRow[]): DocumentMetadataResolution {
  const ids = [...new Set(sourceIds ?? [])];
  if (ids.length === 0) return { ok: false, code: "ACTIVE_EVIDENCE_SOURCE_MISSING", message: `El evidence run ${evidenceRunId} no declara documentos parseados fuente; no se infiere metadata.` };
  const byId = new Map(rows.map((r) => [r.id, r]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) return { ok: false, code: "ACTIVE_EVIDENCE_SOURCE_NOT_FOUND", message: `No se encontraron los documentos parseados fuente del run: ${missing.join(", ")}.` };
  const currencies = new Set<CurrencyCode | null>();
  const factors = new Set<number>();
  for (const id of ids) {
    const meta = byId.get(id)!.parsing_metadata ?? {};
    currencies.add(normalizeCurrencyCode(typeof meta.moneda_documento === "string" ? meta.moneda_documento : null));
    const f = typeof meta.factor_escala === "number" ? meta.factor_escala : Number(meta.factor_escala);
    if (meta.factor_escala === null || meta.factor_escala === undefined || !Number.isFinite(f) || f <= 0) {
      return { ok: false, code: "ACTIVE_EVIDENCE_SCALE_MISSING", message: `El documento parseado ${id} no declara factor_escala válido; no se asume 1.` };
    }
    factors.add(f);
  }
  if (currencies.size > 1 || factors.size > 1) {
    return { ok: false, code: "ACTIVE_EVIDENCE_METADATA_CONFLICT", message: `Los documentos fuente del run tienen moneda/escala incompatibles (monedas: ${[...currencies].map(String).join(", ")}; escalas: ${[...factors].join(", ")}).` };
  }
  return { ok: true, source: "active_evidence_run", evidenceRunId, parsedDocumentIds: ids, monedaDocumento: [...currencies][0] ?? null, factorEscala: [...factors][0] };
}

/** I/O mínimo: lee el run activo y sus parsed documents fuente (o el evento legacy). */
export async function resolveActiveEvidenceDocumentMetadata(db: Db, analysis: { id: string; active_evidence_run_id?: string | null }): Promise<DocumentMetadataResolution> {
  const runId = analysis.active_evidence_run_id ?? null;
  if (!runId) {
    const { data: auditParse } = await db.from("audit_events")
      .select("metadata").eq("analysis_id", analysis.id).eq("event_type", "parse_complete")
      .order("created_at", { ascending: false }).limit(1);
    const parseMeta = (auditParse?.[0]?.metadata as { moneda_documento?: string | null; factor_escala?: unknown } | null) || {};
    return { ok: true, source: "legacy_latest_parse_event", monedaDocumento: normalizeCurrencyCode(parseMeta.moneda_documento), factorEscala: Number(parseMeta.factor_escala) || 1 };
  }
  const { data: run, error: runError } = await db.from("evidence_runs").select("id, source_parsed_document_ids").eq("id", runId).eq("analysis_id", analysis.id).maybeSingle();
  if (runError) throw new Error(`Error leyendo evidence_runs: ${runError.message}`);
  if (!run) return { ok: false, code: "ACTIVE_EVIDENCE_SOURCE_NOT_FOUND", message: `El evidence run activo ${runId} no existe para este análisis.` };
  const ids: string[] = Array.isArray(run.source_parsed_document_ids) ? run.source_parsed_document_ids : [];
  if (ids.length === 0) return resolveMetadataFromParsedDocuments(runId, ids, []);
  const { data: rows, error } = await db.from("documents_parsed").select("id, parsing_metadata").in("id", ids);
  if (error) throw new Error(`Error leyendo documents_parsed: ${error.message}`);
  return resolveMetadataFromParsedDocuments(runId, ids, (rows ?? []) as ParsedDocumentMetadataRow[]);
}
