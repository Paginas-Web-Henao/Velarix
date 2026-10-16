// @vitest-environment node
// Judgment versionado (ADR-010) con los handlers REALES de judgment-sets y
// build-structured-input sobre una base en memoria que aplica los filtros
// (incluido el compare-and-swap del puntero). Los valores de Judgment son los
// del fixture SINTÉTICO de tests; ninguno es Judgment real de un caso.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryDb, type MemoryDb, type Row } from "./test-support/memory-db";
import { REQUIRED_RESOLVED_ASSUMPTION_KEYS } from "./resolved-calculation-assumptions";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";

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

await import("../judgment-sets/index");
await import("../build-structured-input/index");
const [judgmentHandler, buildHandler] = h.handlers;

const SYN = "SYNTHETIC_TEST_FIXTURE";
const hom = (canonical_account: string, value: number, evidence_run_id: string | null) =>
  ({ analysis_id: "a1", canonical_account, original_label: canonical_account, value, period: "2024", evidence_run_id, confidence: 1, status: "clasificada" });
const RUN1 = ["revenue", "cost_of_sales", "opex", "da", "cash", "equity", "current_financial_debt", "long_term_financial_debt"].map((c, i) => hom(c, 100 + i, "run-1"));

let m: MemoryDb;
function setup(analysis: Row = {}) {
  m = createMemoryDb({
    analyses: [{ id: "a1", user_id: "owner-1", status: "validacion_aprobada", sector: "industrial", moneda_analisis: "USD", calculation_result: null, active_evidence_run_id: "run-1", active_judgment_set_id: null, expected_growth: null, ...analysis }],
    evidence_runs: [{ id: "run-1", analysis_id: "a1", status: "completed" }, { id: "run-2", analysis_id: "a1", status: "completed" }],
    // Filas de otros runs: nunca deben llegar al input.
    account_homologations: [...RUN1, hom("revenue", 999_999, "run-0"), hom("revenue", 888_888, null)],
    judgment_sets: [], judgment_entries: [], structured_inputs: [], audit_events: [], external_snapshots: [],
  });
  h.db = m.client;
}
const call = (handler: (r: Request) => Promise<Response>, body: object) =>
  handler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify(body) }));
const J = async (body: object) => { const r = await call(judgmentHandler, { analysis_id: "a1", ...body }); return { status: r.status, body: await r.json() }; };
const pointer = () => m.tables.analyses[0].active_judgment_set_id;
const setRow = (id: string) => m.tables.judgment_sets.find((s) => s.id === id)!;

function judgmentPayloads(growth: unknown = 5) {
  const out: Row[] = [
    { key: "case.expected_growth", value: growth },
    { key: "case.valuation_date", value: "2000-01-01" },
    { key: "case.basis_of_value", value: "synthetic basis" },
    { key: "case.valued_interest", value: "synthetic interest" },
    { key: "case.calculation_architecture", value: "synthetic architecture" },
  ].map((e) => ({ ...e, source: SYN, rationale: "test", status: "resolved" }));
  for (const k of REQUIRED_RESOLVED_ASSUMPTION_KEYS) {
    const a = EXAMPLE_RESOLVED_ASSUMPTIONS[k] as { value: unknown; unit?: string; source: string; rationale: string; date?: string };
    out.push({ key: `resolved.${k}`, value: a.value, unit: a.unit, source: a.source, rationale: a.rationale, status: "resolved", effective_date: a.date });
  }
  return out;
}
async function draft(extra: object = {}): Promise<string> {
  const r = await J({ action: "create_draft", ...extra });
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  return r.body.data.judgment_set_id;
}
async function fill(id: string, growth: unknown = 5) {
  for (const e of judgmentPayloads(growth)) {
    const r = await J({ action: "add_entry", judgment_set_id: id, ...e });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
  }
}
async function completedAndPromoted(growth: unknown = 5): Promise<string> {
  const id = await draft();
  await fill(id, growth);
  expect((await J({ action: "complete", judgment_set_id: id })).status).toBe(200);
  expect((await J({ action: "promote", judgment_set_id: id })).status).toBe(200);
  return id;
}
async function build() { const r = await call(buildHandler, { analysis_id: "a1" }); return { status: r.status, body: await r.json() }; }

beforeEach(() => setup());

describe("A–D: build then promote", () => {
  it("A. set completo + promovido → puntero; columnas de analyses quedan como proyección", async () => {
    const A = await completedAndPromoted(5);
    expect(pointer()).toBe(A);
    expect(setRow(A)).toMatchObject({ status: "completed", evidence_run_id: "run-1" });
    expect(setRow(A).promoted_at).toBeTruthy();
    expect(m.tables.analyses[0]).toMatchObject({ expected_growth: 5, valuation_date: "2000-01-01", calculation_architecture: "synthetic architecture" });
  });

  it("B. un draft B no reemplaza a A; A sigue siendo el activo", async () => {
    const A = await completedAndPromoted(5);
    const B = await draft();
    await J({ action: "add_entry", judgment_set_id: B, key: "case.expected_growth", value: 9, source: SYN, rationale: "t", status: "resolved" });
    expect(pointer()).toBe(A);
    expect(setRow(B).previous_active_judgment_set_id).toBe(A);
    const built = await build();
    expect(built.body.data.judgment.judgment_set_id).toBe(A);
    expect(built.body.data.expected_growth).toBe(5);
  });

  it("C. un set fallido nunca se promueve ni mueve el puntero", async () => {
    const A = await completedAndPromoted();
    const B = await draft();
    expect((await J({ action: "fail", judgment_set_id: B, reason: "test" })).status).toBe(200);
    const p = await J({ action: "promote", judgment_set_id: B });
    expect(p).toMatchObject({ status: 409, body: { error: { code: "JUDGMENT_SET_NOT_PROMOTABLE" } } });
    expect(pointer()).toBe(A);
    expect((await J({ action: "add_entry", judgment_set_id: B, key: "case.expected_growth", value: 1, source: SYN, rationale: "t", status: "resolved" })).status).toBe(409);
  });

  it("D. promover un draft (aun completo en contenido) → 409; el puntero no se mueve", async () => {
    const id = await draft();
    await fill(id);
    expect(await J({ action: "promote", judgment_set_id: id })).toMatchObject({ status: 409, body: { error: { code: "JUDGMENT_SET_NOT_PROMOTABLE" } } });
    expect(pointer()).toBeNull();
  });

  it("E. completar un set incompleto → 409 con issues; sigue draft", async () => {
    const id = await draft();
    await J({ action: "add_entry", judgment_set_id: id, key: "case.expected_growth", value: 0, source: SYN, rationale: "t", status: "resolved" });
    const r = await J({ action: "complete", judgment_set_id: id });
    expect(r).toMatchObject({ status: 409, body: { error: { code: "JUDGMENT_SET_INCOMPLETE" } } });
    expect(r.body.error.issues.length).toBeGreaterThan(0);
    expect(setRow(id).status).toBe("draft");
  });

  it("F. promover B tras A: A queda almacenado; B pasa a activo", async () => {
    const A = await completedAndPromoted(5);
    const B = await draft();
    await fill(B, 0);
    await J({ action: "complete", judgment_set_id: B });
    expect((await J({ action: "promote", judgment_set_id: B })).body.data.previous_active_judgment_set_id).toBe(A);
    expect(pointer()).toBe(B);
    expect(setRow(A).status).toBe("completed");
    expect(m.tables.judgment_entries.filter((e) => e.judgment_set_id === A)).toHaveLength(18);
    expect(m.tables.analyses[0].expected_growth).toBe(0);
  });
});

describe("G–I: correcciones, Evidence y reutilización", () => {
  it("G. key repetida sin supersession → SUPERSESSION_REQUIRED; con supersession → la nueva es la efectiva", async () => {
    const id = await draft();
    await fill(id, 5);
    const dup = await J({ action: "add_entry", judgment_set_id: id, key: "case.expected_growth", value: 3, source: SYN, rationale: "t", status: "resolved" });
    expect(dup).toMatchObject({ status: 409, body: { error: { code: "SUPERSESSION_REQUIRED" } } });
    const old = m.tables.judgment_entries.find((e) => e.judgment_set_id === id && e.key === "case.expected_growth")!;
    expect((await J({ action: "add_entry", judgment_set_id: id, key: "case.expected_growth", value: 3, source: SYN, rationale: "t", status: "resolved", supersedes_entry_id: old.id })).status).toBe(200);
    expect((await J({ action: "complete", judgment_set_id: id })).status).toBe(200);
    await J({ action: "promote", judgment_set_id: id });
    expect((await build()).body.data.expected_growth).toBe(3);
  });

  it("H. Evidence mismatch: run activo cambia → no se completa ni promueve; el input no se construye", async () => {
    const A = await completedAndPromoted();
    const B = await draft();
    await fill(B);
    m.tables.account_homologations.push(...RUN1.map((r) => ({ ...r, evidence_run_id: "run-2" })));
    m.tables.analyses[0].active_evidence_run_id = "run-2";
    expect(await J({ action: "complete", judgment_set_id: B })).toMatchObject({ status: 409, body: { error: { code: "EVIDENCE_RUN_CHANGED" } } });
    const built = await build();
    expect(built.status).toBe(409);
    expect(built.body.error.code).toBe("JUDGMENT_SET_INVALID");
    expect(built.body.error.issues.map((i: { code: string }) => i.code)).toContain("JUDGMENT_STALE_FOR_EVIDENCE_RUN");
    expect(pointer()).toBe(A);
  });

  it("H2. set completado sobre run-1 no se promueve si el run activo es otro", async () => {
    const id = await draft();
    await fill(id);
    await J({ action: "complete", judgment_set_id: id });
    m.tables.analyses[0].active_evidence_run_id = "run-2";
    expect(await J({ action: "promote", judgment_set_id: id })).toMatchObject({ status: 409, body: { error: { code: "EVIDENCE_RUN_MISMATCH" } } });
    expect(pointer()).toBeNull();
  });

  it("I. reutilización EXPLÍCITA tras un nuevo run: copia con referencias, en draft, sin mover el puntero", async () => {
    const A = await completedAndPromoted();
    m.tables.analyses[0].active_evidence_run_id = "run-2";
    const C = await draft({ reuse_from_judgment_set_id: A });
    expect(setRow(C)).toMatchObject({ status: "draft", evidence_run_id: "run-2", reused_from_judgment_set_id: A });
    const copied = m.tables.judgment_entries.filter((e) => e.judgment_set_id === C);
    expect(copied).toHaveLength(18);
    expect(copied.every((e) => (e.references as { reused_from_judgment_set_id: string }).reused_from_judgment_set_id === A)).toBe(true);
    expect(pointer()).toBe(A);
  });
});

describe("J–M: el input del cálculo sale del Evidence activo + Judgment activo", () => {
  it("J. v5: resolved_assumptions EXACTOS del set + provenance; growth del set aunque la columna diga otra cosa", async () => {
    const A = await completedAndPromoted(0);
    m.tables.analyses[0].expected_growth = 99; // columna = proyección; no es la fuente
    const built = await build();
    expect(built.status, JSON.stringify(built.body)).toBe(200);
    const p = built.body.data;
    expect(p.resolved_assumptions).toEqual(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(p.expected_growth).toBe(0);
    expect(p.judgment).toMatchObject({ judgment_set_id: A, evidence_run_id: "run-1", assumptions_source: "judgment_set", case: { expected_growth: 0, valuation_date: "2000-01-01" } });
    expect(p.income_statement.revenue).toBe(100); // solo filas del run activo
    expect(JSON.parse(JSON.stringify(m.tables.structured_inputs[0].input_payload))).toEqual(p);
  });

  it("K. legacy (sin judgment set): el payload no anuncia resolved_assumptions ni judgment", async () => {
    setup({ expected_growth: 7 });
    const built = await build();
    expect(built.status).toBe(200);
    expect(Object.prototype.hasOwnProperty.call(built.body.data, "resolved_assumptions")).toBe(false);
    expect(built.body.data.judgment).toBeUndefined();
    expect(built.body.data.expected_growth).toBe(7);
  });

  it("L. legacy con growth null: sigue null (nunca 25)", async () => {
    const built = await build();
    expect(built.body.data.expected_growth).toBeNull();
    expect(built.body.data.quality_flags).toContain("expected_growth_no_resuelto");
  });

  it("M. caso con cálculo persistido → el Judgment no se modifica", async () => {
    setup({ calculation_result: { valuation: {} }, status: "calculo_completo" });
    expect(await J({ action: "create_draft" })).toMatchObject({ status: 409, body: { error: { code: "CASE_ALREADY_CALCULATED" } } });
  });
});
