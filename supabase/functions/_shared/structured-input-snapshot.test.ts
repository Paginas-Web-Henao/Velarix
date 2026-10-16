// @vitest-environment node
// Snapshot del structured input: un caso VERSIONADO nunca recibe provenance
// sintética (buildDefaultSnapshot); legacy sin cambios. Handler REAL.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryDb, type MemoryDb, type Row } from "./test-support/memory-db";
import { resolveStructuredInputSnapshot } from "./structured-input-builder";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const h = vi.hoisted(() => ({ handlers: [] as ((req: Request) => Promise<Response>)[], db: null as unknown }));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (fn: (req: Request) => Promise<Response>) => { h.handlers.push(fn); } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.49.1", () => ({ createClient: () => h.db }));
(globalThis as unknown as { Deno: unknown }).Deno = {
  env: { get: (k: string) => ({
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: "sb_secret_test_key_0000000000" }),
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: "sb_publishable_test" }),
  } as Record<string, string>)[k] },
};
await import("../build-structured-input/index");
const [buildHandler] = h.handlers;

const SYNTHETIC = /Damodaran|Banco de la Rep|US Treasury|4080|trm_avg|snap_default/;
const ACCOUNTS = ["revenue", "cost_of_sales", "opex", "da", "cash", "equity", "total_assets", "total_liabilities", "current_financial_debt", "long_term_financial_debt"];
let m: MemoryDb;
function setup(analysis: Row = {}, snapshots: Row[] = []) {
  const versioned = !("active_evidence_run_id" in analysis) || analysis.active_evidence_run_id !== null;
  const meta = { moneda_documento: "USD", factor_escala: 1000, escala_origen: "DECLARED" };
  m = createMemoryDb({
    analyses: [{ id: "a1", user_id: "owner-1", status: "validacion_aprobada", sector: "Manufactura", moneda_analisis: "USD", calculation_result: null, active_evidence_run_id: "run-A", expected_growth: null, ...analysis }],
    evidence_runs: [{ id: "run-A", analysis_id: "a1", status: "completed", source_parsed_document_ids: ["p-A"] }],
    documents_parsed: [{ id: "p-A", document_id: "d1", parsing_metadata: meta }],
    audit_events: [{ analysis_id: "a1", event_type: "parse_complete", metadata: meta }],
    account_homologations: ACCOUNTS.map((c, i) => ({ analysis_id: "a1", canonical_account: c, original_label: c, value: 100 + i, period: "2024", evidence_run_id: versioned ? "run-A" : null })),
    external_snapshots: snapshots, structured_inputs: [], judgment_sets: [], judgment_entries: [],
  });
  h.db = m.client;
}
const build = async () => {
  const r = await buildHandler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify({ analysis_id: "a1" }) }));
  return { status: r.status, body: await r.json() };
};
const REAL_SNAPSHOT = { id: "ext-snap-1", sector: "Manufactura", effective_date: "2026-01-31", data_payload: { real: "persisted-row" }, macro_payload: { macro: "persisted" } };

beforeEach(() => setup());

describe("snapshot en casos VERSIONADOS", () => {
  it("sin external_snapshot → snapshot_id/data/macro = null y CERO provenance sintética (Damodaran/TRM/fechas)", async () => {
    const r = await build();
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.data).toMatchObject({ snapshot_id: null, snapshot_data: null, macro_data: null });
    expect(JSON.stringify(r.body.data)).not.toMatch(SYNTHETIC);
    expect(JSON.stringify(m.tables.structured_inputs[0].input_payload)).not.toMatch(SYNTHETIC);
    expect(m.tables.analyses[0].snapshot_id).toBeUndefined(); // no se fija un snapshot que no existe
  });
  it("forma de Tecnoglass: sector 'Manufactura' vs filas remotas con slug 'manufactura' → no coincide → ausencia explícita, no default", async () => {
    setup({}, [{ ...REAL_SNAPSHOT, id: "slug-row", sector: "manufactura" }]);
    const r = await build();
    expect(r.body.data).toMatchObject({ snapshot_id: null, snapshot_data: null });
    expect(JSON.stringify(r.body.data)).not.toMatch(SYNTHETIC);
  });
  it("con external_snapshot real → usa exactamente esa fila", async () => {
    setup({}, [REAL_SNAPSHOT]);
    const r = await build();
    expect(r.body.data).toMatchObject({ snapshot_id: "ext-snap-1", snapshot_data: { real: "persisted-row" }, macro_data: { macro: "persisted" } });
    expect(m.tables.analyses[0].snapshot_id).toBe("ext-snap-1");
  });
});

describe("legacy (sin evidence run activo)", () => {
  it("sin snapshot → buildDefaultSnapshot como antes (LEGACY_COMPATIBILITY_DEFAULT)", async () => {
    setup({ active_evidence_run_id: null });
    const r = await build();
    expect(r.status).toBe(200);
    expect(r.body.data.snapshot_id).toBeNull();
    expect(r.body.data.snapshot_data).not.toBeNull();
    expect(JSON.stringify(r.body.data.snapshot_data)).toMatch(/Damodaran/);
  });
});

describe("pura", () => {
  it("resolveStructuredInputSnapshot: versionado nunca construye el default", () => {
    expect(resolveStructuredInputSnapshot({ versioned: true, dbSnapshot: null, sector: "Manufactura", legacyExchangeRate: 4080 })).toEqual({ id: null, data_payload: null, macro_payload: null, source: "unavailable" });
    expect(resolveStructuredInputSnapshot({ versioned: false, dbSnapshot: null, sector: "Manufactura", legacyExchangeRate: 4080 }).source).toBe("legacy_default");
    expect(resolveStructuredInputSnapshot({ versioned: true, dbSnapshot: { id: "x", data_payload: { a: 1 } }, sector: "M", legacyExchangeRate: 4080 })).toMatchObject({ id: "x", data_payload: { a: 1 }, source: "external_snapshot" });
  });
  it("ningún consumidor del motor / preflight / readiness lee snapshot_data o macro_data", () => {
    for (const f of ["canonical-financial-engine.ts", "capital-structure.ts", "calculation-preflight.ts", "calculation-readiness.ts", "calculation-fingerprint.ts", "../ejecutar-calculo/index.ts"]) {
      expect(readFileSync(join(__dirname, f), "utf8"), f).not.toMatch(/snapshot_data|macro_data/);
    }
  });
});
