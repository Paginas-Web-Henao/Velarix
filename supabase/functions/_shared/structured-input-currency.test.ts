// @vitest-environment node
// Moneda / escala / FX en el camino VERSIONADO (fail-closed) vs legacy
// (LEGACY_COMPATIBILITY_DEFAULT). Handlers REALES sobre una base en memoria.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryDb, type MemoryDb, type Row } from "./test-support/memory-db";
import { resolveStructuredInputCurrency, LEGACY_EXCHANGE_RATE_COP_PER_USD } from "./structured-input-currency";
import { resolveMetadataFromParsedDocuments } from "./evidence-document-metadata";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

const ACCOUNTS = ["revenue", "cost_of_sales", "opex", "da", "cash", "equity", "total_assets", "total_liabilities", "current_financial_debt", "long_term_financial_debt"];
const hom = (c: string, i: number, run: string | null) => ({ analysis_id: "a1", canonical_account: c, original_label: c, value: 100 + i, period: "2024", evidence_run_id: run, confidence: 1, status: "clasificada" });
let m: MemoryDb;
function setup(analysis: Row = {}, docMeta: Row = { moneda_documento: "USD", factor_escala: 1000, escala_origen: "DECLARED" }, extra: Partial<Record<string, Row[]>> = {}) {
  const versioned = !("active_evidence_run_id" in analysis) || analysis.active_evidence_run_id !== null;
  m = createMemoryDb({
    analyses: [{ id: "a1", user_id: "owner-1", status: "validacion_aprobada", sector: "industrial", moneda_analisis: "USD", calculation_result: null, active_evidence_run_id: "run-A", expected_growth: null, ...analysis }],
    profiles: [{ id: "owner-1", role: "admin" }],
    evidence_runs: [{ id: "run-A", analysis_id: "a1", status: "completed", source_parsed_document_ids: ["p-A"] }],
    documents_parsed: [{ id: "p-A", document_id: "d1", parsing_metadata: docMeta }],
    audit_events: [{ analysis_id: "a1", event_type: "parse_complete", metadata: docMeta }],
    account_homologations: ACCOUNTS.map((c, i) => hom(c, i, versioned ? "run-A" : null)),
    structured_inputs: [], external_snapshots: [], judgment_sets: [], judgment_entries: [], manual_reviews: [],
    ...extra,
  });
  h.db = m.client;
}
const call = async (handler = buildHandler) => {
  const r = await handler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify({ analysis_id: "a1" }) }));
  return { status: r.status, body: await r.json() };
};
const blocked = (r: { status: number; body: { error?: { code: string } } }, code: string) => {
  expect(r.status, JSON.stringify(r.body)).toBe(409);
  expect(r.body.error?.code).toBe(code);
  expect(m.tables.structured_inputs).toHaveLength(0);
};

beforeEach(() => setup());

describe("caso VERSIONADO: moneda/escala/FX explícitos o 409", () => {
  it("A. moneda_analisis null → 409 ANALYSIS_CURRENCY_REQUIRED (no COP)", async () => {
    for (const v of [null, ""]) { setup({ moneda_analisis: v }); blocked(await call(), "ANALYSIS_CURRENCY_REQUIRED"); }
  });
  it("B. moneda_analisis EUR / no soportada → 409", async () => {
    for (const v of ["EUR", "usd", "PESOS"]) { setup({ moneda_analisis: v }); blocked(await call(), "ANALYSIS_CURRENCY_REQUIRED"); }
  });
  it("C. moneda del documento no reconocida → 409 ACTIVE_EVIDENCE_CURRENCY_MISSING", async () => {
    setup({}, { moneda_documento: null, factor_escala: 1000, escala_origen: "DECLARED" });
    blocked(await call(), "ACTIVE_EVIDENCE_CURRENCY_MISSING");
  });
  it("D. factor 1 persistido por default sin origen (o NONE / INFERRED) → 409 ACTIVE_EVIDENCE_SCALE_UNRESOLVED", async () => {
    for (const meta of [{ moneda_documento: "USD", factor_escala: 1, escala_origen: null }, { moneda_documento: "USD", factor_escala: 1, escala_origen: "NONE" }, { moneda_documento: "USD", factor_escala: 1_000_000, escala_origen: "INFERRED" }]) {
      setup({}, meta); blocked(await call(), "ACTIVE_EVIDENCE_SCALE_UNRESOLVED");
    }
  });
  it("E/F. USD explícito + escala DECLARED 1000, USD/USD → válido y sin exigir FX", async () => {
    const r = await call();
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.data).toMatchObject({ moneda_analisis: "USD", moneda_documento: "USD", factor_conversion: 1000 });
    expect(r.body.data.income_statement.revenue).toBe(100 * 1000);
    expect(JSON.stringify(r.body.data.quality_flags)).not.toMatch(/TRM|4080/);
  });
  it("E2. COP/COP explícito → válido", async () => {
    setup({ moneda_analisis: "COP" }, { moneda_documento: "COP", factor_escala: 1_000_000, escala_origen: "DECLARED" });
    const r = await call();
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ moneda_analisis: "COP", factor_conversion: 1_000_000 });
  });
  it("G. COP→USD (y USD→COP) versionado → 409 EXCHANGE_RATE_REQUIRED; nunca usa 4080", async () => {
    setup({ moneda_analisis: "USD" }, { moneda_documento: "COP", factor_escala: 1, escala_origen: "DECLARED" });
    const r = await call();
    blocked(r, "EXCHANGE_RATE_REQUIRED");
    expect(JSON.stringify(r.body)).toMatch(/no usa TRM hardcodeada/);
    setup({ moneda_analisis: "COP" }, { moneda_documento: "USD", factor_escala: 1, escala_origen: "DECLARED" });
    blocked(await call(), "EXCHANGE_RATE_REQUIRED");
  });
  it("G2. continuar-tras-revision aplica la misma regla (cross-currency versionado → 409)", async () => {
    setup({ status: "revision_manual_requerida", moneda_analisis: "COP" }, { moneda_documento: "USD", factor_escala: 1000, escala_origen: "DECLARED" },
      { manual_reviews: [{ id: "rv1", analysis_id: "a1", estado: "aprobado", created_at: "2026-10-16T12:00:00Z" }] });
    blocked(await call(continuarHandler), "EXCHANGE_RATE_REQUIRED");
    setup({ status: "revision_manual_requerida", moneda_analisis: null }, undefined, { manual_reviews: [{ id: "rv1", analysis_id: "a1", estado: "aprobado", created_at: "2026-10-16T12:00:00Z" }] });
    blocked(await call(continuarHandler), "ANALYSIS_CURRENCY_REQUIRED");
  });
});

describe("H. legacy (sin evidence run activo): comportamiento histórico", () => {
  it("moneda_analisis null → COP, escala ausente → 1, conversión con TRM fija (LEGACY_COMPATIBILITY_DEFAULT)", async () => {
    setup({ active_evidence_run_id: null, moneda_analisis: null }, { moneda_documento: "USD" });
    const r = await call();
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.data).toMatchObject({ moneda_analisis: "COP", moneda_documento: "USD", factor_conversion: LEGACY_EXCHANGE_RATE_COP_PER_USD });
  });
  it("legacy sin moneda del documento: sigue construyendo con la advertencia histórica", async () => {
    setup({ active_evidence_run_id: null }, {});
    const r = await call();
    expect(r.status).toBe(200);
    expect(r.body.data.quality_flags).toContain("moneda_documento_no_detectada");
  });
});

describe("pura", () => {
  it("I. metadata con la forma real de Tecnoglass (USD, factor 1000, DECLARED; análisis USD) → válida sin FX", () => {
    const meta = resolveMetadataFromParsedDocuments("15ab0f56-c702-45a7-9333-edde72ae45f7", ["9aa8ba2b-cbbf-4eb8-89ab-2cb6b6f507a6"], [{ id: "9aa8ba2b-cbbf-4eb8-89ab-2cb6b6f507a6", parsing_metadata: { moneda_documento: "USD", factor_escala: 1000, escala_origen: "DECLARED" } }]);
    expect(meta).toMatchObject({ ok: true, monedaDocumento: "USD", factorEscala: 1000, escalaOrigen: "DECLARED" });
    if (!meta.ok) return;
    expect(resolveStructuredInputCurrency({ monedaAnalisisRaw: "USD", docMeta: meta })).toEqual({ ok: true, mode: "versioned", monedaAnalisis: "USD", monedaDocumento: "USD", factorEscala: 1000, exchangeRate: null });
  });
  it("las rutas versionadas no contienen ?? \"COP\" ni TRM fija", () => {
    for (const f of ["../build-structured-input/index.ts", "../continuar-tras-revision/index.ts"]) {
      const src = readFileSync(join(__dirname, f), "utf8");
      expect(src, f).not.toMatch(/\?\?\s*"COP"/);
      expect(src, f).not.toMatch(/exchangeRate:\s*TRM/);
    }
  });
});
