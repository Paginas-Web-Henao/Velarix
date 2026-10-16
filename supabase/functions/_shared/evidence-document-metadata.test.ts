// @vitest-environment node
// Metadata documental ligada al evidence run ACTIVO: pura + handlers REALES
// de build-structured-input y continuar-tras-revision sobre una base en memoria.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryDb, type MemoryDb, type Row } from "./test-support/memory-db";
import { resolveMetadataFromParsedDocuments } from "./evidence-document-metadata";

const h = vi.hoisted(() => ({ handlers: [] as ((req: Request) => Promise<Response>)[], db: null as unknown }));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (fn: (req: Request) => Promise<Response>) => { h.handlers.push(fn); } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.49.1", () => ({ createClient: () => h.db }));
vi.mock("https://esm.sh/@supabase/supabase-js@2", () => ({ createClient: () => h.db }));
(globalThis as unknown as { Deno: unknown }).Deno = {
  env: { get: (k: string) => ({
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: "sb_secret_test_key_0000000000" }),
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: "sb_publishable_test" }),
  } as Record<string, string>)[k] },
};
await import("../build-structured-input/index");
await import("../continuar-tras-revision/index");
const [buildHandler, continuarHandler] = h.handlers;

const meta = (moneda: string | null, factor: unknown, origen: unknown = "DECLARED") => ({ moneda_documento: moneda, factor_escala: factor, escala_origen: origen });

describe("resolveMetadataFromParsedDocuments (pura, fail-closed)", () => {
  it("una fuente → su moneda y escala", () => {
    expect(resolveMetadataFromParsedDocuments("run-A", ["p-A"], [{ id: "p-A", parsing_metadata: meta("USD", 1000) }])).toMatchObject({ ok: true, monedaDocumento: "USD", factorEscala: 1000, parsedDocumentIds: ["p-A"] });
  });
  it("sin fuentes, fuente inexistente o escala ausente → error (no se asume 1 ni se elige la última)", () => {
    expect(resolveMetadataFromParsedDocuments("r", [], [])).toMatchObject({ ok: false, code: "ACTIVE_EVIDENCE_SOURCE_MISSING" });
    expect(resolveMetadataFromParsedDocuments("r", ["p-X"], [])).toMatchObject({ ok: false, code: "ACTIVE_EVIDENCE_SOURCE_NOT_FOUND" });
    for (const f of [undefined, null, 0, -1, "abc"]) {
      expect(resolveMetadataFromParsedDocuments("r", ["p"], [{ id: "p", parsing_metadata: meta("USD", f) }])).toMatchObject({ ok: false, code: "ACTIVE_EVIDENCE_SCALE_MISSING" });
    }
  });
  it("varias fuentes compatibles → ok; incompatibles (moneda o escala, incluido null vs USD) → conflicto", () => {
    expect(resolveMetadataFromParsedDocuments("r", ["a", "b"], [{ id: "a", parsing_metadata: meta("USD", 1000) }, { id: "b", parsing_metadata: meta("USD", "1000") }])).toMatchObject({ ok: true, monedaDocumento: "USD", factorEscala: 1000 });
    expect(resolveMetadataFromParsedDocuments("r", ["a", "b"], [{ id: "a", parsing_metadata: meta("USD", 1000) }, { id: "b", parsing_metadata: meta("COP", 1000) }])).toMatchObject({ ok: false, code: "ACTIVE_EVIDENCE_METADATA_CONFLICT" });
    expect(resolveMetadataFromParsedDocuments("r", ["a", "b"], [{ id: "a", parsing_metadata: meta("USD", 1000) }, { id: "b", parsing_metadata: meta("USD", 1) }])).toMatchObject({ ok: false, code: "ACTIVE_EVIDENCE_METADATA_CONFLICT" });
    expect(resolveMetadataFromParsedDocuments("r", ["a", "b"], [{ id: "a", parsing_metadata: meta(null, 1000) }, { id: "b", parsing_metadata: meta("USD", 1000) }])).toMatchObject({ ok: false, code: "ACTIVE_EVIDENCE_METADATA_CONFLICT" });
  });
  it("moneda del documento no reconocida (null, EUR) → ACTIVE_EVIDENCE_CURRENCY_MISSING (no se asume ausencia de conversión)", () => {
    for (const mon of [null, "EUR", "usd"]) {
      expect(resolveMetadataFromParsedDocuments("r", ["a"], [{ id: "a", parsing_metadata: meta(mon, 1000) }])).toMatchObject({ ok: false, code: "ACTIVE_EVIDENCE_CURRENCY_MISSING" });
    }
  });
  it("escala no declarada (factor 1 por default, NONE, INFERRED, null) → ACTIVE_EVIDENCE_SCALE_UNRESOLVED", () => {
    expect(resolveMetadataFromParsedDocuments("r", ["a"], [{ id: "a", parsing_metadata: { moneda_documento: "USD", factor_escala: 1 } }])).toMatchObject({ ok: false, code: "ACTIVE_EVIDENCE_SCALE_UNRESOLVED" });
    for (const [f, o] of [[1, null], [1, "NONE"], [1_000_000, "INFERRED"], [1000, "GUESSED"]] as const) {
      expect(resolveMetadataFromParsedDocuments("r", ["a"], [{ id: "a", parsing_metadata: meta("USD", f, o) }])).toMatchObject({ ok: false, code: "ACTIVE_EVIDENCE_SCALE_UNRESOLVED" });
    }
    expect(resolveMetadataFromParsedDocuments("r", ["a"], [{ id: "a", parsing_metadata: meta("USD", 1, "DECLARED") }])).toMatchObject({ ok: true, factorEscala: 1, escalaOrigen: "DECLARED" });
  });
});

// Escenario: parse A (USD, ×1000) → run A promovido (activo). Luego parse B (COP, ×1) → run B FALLA (sin promoción).
const hom = (canonical_account: string, value: number, evidence_run_id: string | null) =>
  ({ analysis_id: "a1", canonical_account, original_label: canonical_account, value, period: "2024", evidence_run_id, confidence: 1, status: "clasificada" });
const ACCOUNTS = ["revenue", "cost_of_sales", "opex", "da", "cash", "equity", "total_assets", "total_liabilities", "current_financial_debt", "long_term_financial_debt"];
let m: MemoryDb;
function setup(analysis: Row = {}, extra: Partial<Record<string, Row[]>> = {}) {
  m = createMemoryDb({
    analyses: [{ id: "a1", user_id: "owner-1", status: "validacion_aprobada", sector: "industrial", moneda_analisis: "USD", calculation_result: null, active_evidence_run_id: "run-A", expected_growth: null, ...analysis }],
    profiles: [{ id: "owner-1", role: "admin" }],
    evidence_runs: [
      { id: "run-A", analysis_id: "a1", status: "completed", source_parsed_document_ids: ["p-A"] },
      { id: "run-B", analysis_id: "a1", status: "failed", failed_stage: "mapping", source_parsed_document_ids: ["p-B"] },
    ],
    documents_parsed: [
      { id: "p-A", document_id: "d1", created_at: "2026-10-16T10:00:00Z", parsing_metadata: meta("USD", 1000) },
      { id: "p-B", document_id: "d1", created_at: "2026-10-16T11:00:00Z", parsing_metadata: meta("COP", 1) },
    ],
    audit_events: [
      { analysis_id: "a1", event_type: "parse_complete", created_at: "2026-10-16T10:00:01Z", metadata: meta("USD", 1000) },
      { analysis_id: "a1", event_type: "parse_complete", created_at: "2026-10-16T11:00:01Z", metadata: meta("COP", 1) },
    ],
    account_homologations: [...ACCOUNTS.map((c, i) => hom(c, 100 + i, "run-A"))],
    structured_inputs: [], external_snapshots: [], judgment_sets: [], judgment_entries: [], manual_reviews: [],
    ...extra,
  });
  // El orden del evento legacy: la memoria no ordena, así que el más reciente va primero (como ORDER BY created_at DESC).
  m.tables.audit_events.reverse();
  h.db = m.client;
}
const call = async (handler: (r: Request) => Promise<Response>) => {
  const r = await handler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify({ analysis_id: "a1" }) }));
  return { status: r.status, body: await r.json() };
};
const persisted = () => m.tables.structured_inputs[0]?.input_payload as { moneda_documento: string | null; factor_conversion: number; income_statement: { revenue: number } } | undefined;

beforeEach(() => setup());

describe("parse A (USD ×1000, run activo) + parse B (COP ×1, run fallido)", () => {
  it("build-structured-input usa USD ×1000 de la fuente del run A — nunca COP ×1 del último parse", async () => {
    const r = await call(buildHandler);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.data).toMatchObject({ moneda_documento: "USD", factor_conversion: 1000 });
    expect(r.body.data.income_statement.revenue).toBe(100 * 1000);
  });

  it("continuar-tras-revision comparte el resolver: USD ×1000", async () => {
    setup({ status: "revision_manual_requerida" }, { manual_reviews: [{ id: "rv1", analysis_id: "a1", estado: "aprobado", created_at: "2026-10-16T12:00:00Z" }] });
    const r = await call(continuarHandler);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(persisted()).toMatchObject({ moneda_documento: "USD", factor_conversion: 1000 });
  });

  it("continuar-tras-revision también falla cerrado si las fuentes del run son incompatibles", async () => {
    setup({ status: "revision_manual_requerida" }, { manual_reviews: [{ id: "rv1", analysis_id: "a1", estado: "aprobado", created_at: "2026-10-16T12:00:00Z" }] });
    m.tables.evidence_runs[0].source_parsed_document_ids = ["p-A", "p-B"];
    const r = await call(continuarHandler);
    expect(r).toMatchObject({ status: 409, body: { error: { code: "ACTIVE_EVIDENCE_METADATA_CONFLICT" } } });
    expect(m.tables.structured_inputs).toHaveLength(0);
  });

  it("run activo sin fuentes declaradas → 409, sin input construido", async () => {
    m.tables.evidence_runs[0].source_parsed_document_ids = [];
    const r = await call(buildHandler);
    expect(r).toMatchObject({ status: 409, body: { error: { code: "ACTIVE_EVIDENCE_SOURCE_MISSING" } } });
    expect(m.tables.structured_inputs).toHaveLength(0);
  });

  it("legacy (puntero NULL): sigue usando el último parse_complete, como antes (documentado)", async () => {
    setup({ active_evidence_run_id: null }, { account_homologations: ACCOUNTS.map((c, i) => hom(c, 100 + i, null)) });
    const r = await call(buildHandler);
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ moneda_documento: "COP" });
  });
});
