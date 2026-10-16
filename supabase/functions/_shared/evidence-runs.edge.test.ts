// @vitest-environment node
// Versionado no destructivo de Evidence con los handlers REALES de
// map-accounts y validate-analysis sobre una base en memoria que aplica los
// filtros (incluido el compare-and-swap de la promoción). La IA no responde
// (callAnthropic → null).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryDb, type MemoryDb, type Row } from "./test-support/memory-db";
import { selectActiveRows, MixedEvidenceRunsError, applyActiveRunFilter, canPromote, selectRunToValidate } from "./evidence-runs";
import { deriveCoreFinancialFields } from "./structured-input-derivations";

const h = vi.hoisted(() => ({ handlers: [] as ((req: Request) => Promise<Response>)[], db: null as unknown }));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (fn: (req: Request) => Promise<Response>) => { h.handlers.push(fn); } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.49.1", () => ({ createClient: () => h.db }));
vi.mock("./anthropic-client.ts", () => ({ callAnthropic: async () => null }));

(globalThis as unknown as { Deno: unknown }).Deno = {
  env: { get: (k: string) => ({
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: "sb_secret_test_key_0000000000" }),
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: "sb_publishable_test" }),
  } as Record<string, string>)[k] },
};

await import("../map-accounts/index");
await import("../validate-analysis/index");
const [mapHandler, validateHandler] = h.handlers;

const row = (original_label: string, value: number, statement: string, source_section: string | null) =>
  ({ original_label, values: { "2024": value }, statement, source_section, unit: "monetaria", source_sheet: `${statement} sheet`, source_label: original_label });
const parsedVersion = (id: string, revenue: number, withCash: boolean): Row => ({
  id, document_id: "d1",
  parsed_structure: { rows: [
    row("Net sales", revenue, "income_statement", "Revenues:"),
    row("Net income", 10, "income_statement", null),
    ...(withCash ? [row("Cash and cash equivalents", 50, "balance_sheet", "Current assets:")] : []),
    row("Total assets", 900, "balance_sheet", "Long-term assets:"),
    row("Total liabilities", 400, "balance_sheet", "Long-term liabilities:"),
    row("Total shareholders' equity", 500, "balance_sheet", "SHAREHOLDERS' EQUITY"),
  ] },
});

let m: MemoryDb;
function setup(analysis: Row = {}) {
  m = createMemoryDb({
    analyses: [{ id: "a1", user_id: "owner-1", status: "parsing_completado", calculation_result: null, active_evidence_run_id: null, ...analysis }],
    documents: [{ id: "d1", analysis_id: "a1", original_filename: "fs.xlsx", file_size_bytes: 10, processing_status: "completado", doc_type_declared: "estado_resultados", doc_type_effective: "estados_financieros" }],
    documents_parsed: [{ ...parsedVersion("p-A", 100, true), created_at: "2026-10-16T00:00:01Z" }],
    evidence_runs: [], account_homologations: [], validation_results: [], audit_events: [],
  });
  h.db = m.client;
}
const call = (handler: (r: Request) => Promise<Response>, body: object) =>
  handler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify(body) }));
async function evidenceRun(): Promise<{ runId: string; map: Response; validate?: Response }> {
  const map = await call(mapHandler, { analysis_id: "a1" });
  const body = await map.clone().json();
  const runId = body.data?.evidence_run_id;
  if (!map.ok) return { runId, map };
  const validate = await call(validateHandler, { analysis_id: "a1", evidence_run_id: runId });
  return { runId, map, validate };
}
const newParse = (id: string, revenue: number, withCash: boolean) =>
  m.tables.documents_parsed.push({ ...parsedVersion(id, revenue, withCash), created_at: new Date(Date.now() + m.tables.documents_parsed.length * 1000).toISOString() });
const pointer = () => m.tables.analyses[0].active_evidence_run_id;
const runById = (id: string) => m.tables.evidence_runs.find((r) => r.id === id)!;
const homsOf = (id: string) => m.tables.account_homologations.filter((r) => r.evidence_run_id === id);
const valsOf = (id: string) => m.tables.validation_results.filter((r) => r.evidence_run_id === id);
const rule = (runId: string, code: string) => valsOf(runId).find((v) => v.rule_code === code);

beforeEach(() => setup());

describe("A/B: build then promote; el historial queda en las tablas operativas", () => {
  it("A. run A sigue almacenado después de run B · B. solo B es operacional tras la promoción", async () => {
    const A = await evidenceRun();
    expect(A.validate!.status).toBe(200);
    expect(pointer()).toBe(A.runId);
    expect(runById(A.runId)).toMatchObject({ status: "completed", source_parsed_document_ids: ["p-A"] });
    expect(runById(A.runId).promoted_at).toBeTruthy();

    newParse("p-B", 150, false);
    const B = await evidenceRun();
    expect(pointer()).toBe(B.runId);
    expect(runById(B.runId)).toMatchObject({ status: "completed", previous_active_run_id: A.runId, source_parsed_document_ids: ["p-B"] });

    // A intacto (ninguna fila borrada) y consultable.
    expect(homsOf(A.runId).length).toBeGreaterThan(0);
    expect(valsOf(A.runId).length).toBeGreaterThan(0);
    expect(m.tables.account_homologations.every((r) => r.evidence_run_id === A.runId || r.evidence_run_id === B.runId)).toBe(true);

    // Lectores operacionales: solo B.
    const active = selectActiveRows(m.tables.account_homologations as never[], pointer() as string);
    expect(new Set(active.map((r: Row) => r.evidence_run_id))).toEqual(new Set([B.runId]));
  });

  it("D. validation lineage: la validación de B evalúa SOLO la homologación de B (no mezcla con A)", async () => {
    const A = await evidenceRun();
    newParse("p-B", 150, false); // B no trae caja; A sí
    const B = await evidenceRun();
    expect(rule(A.runId, "MAP_002")).toMatchObject({ status: "passed" }); // A tenía caja
    expect(rule(B.runId, "MAP_002")).toMatchObject({ status: "failed" }); // B no: no se mezcló con A
    expect(valsOf(B.runId).every((v) => v.evidence_run_id === B.runId)).toBe(true);
    const ev = m.tables.audit_events.filter((e) => e.event_type === "validation_complete").at(-1)!;
    expect(ev.metadata).toMatchObject({ evidence_run_id: B.runId, previous_active_run_id: A.runId });
  });

  it("F. dos runs con revenue 2024: las derivaciones usan solo el activo y nunca suman ambos", async () => {
    await evidenceRun();
    newParse("p-B", 150, true);
    const B = await evidenceRun();
    const all = m.tables.account_homologations as never[];
    expect(() => deriveCoreFinancialFields(all, "2024")).toThrow(MixedEvidenceRunsError); // fail-closed
    expect(deriveCoreFinancialFields(selectActiveRows(all, B.runId), "2024").revenue).toBe(150); // no 250
  });
});

describe("C/E: un run fallido nunca se vuelve activo y no quita el último set bueno", () => {
  it("C. mapping falla → run failed; el activo anterior y sus filas siguen intactos", async () => {
    const B = await evidenceRun();
    const before = { homs: homsOf(B.runId).length, vals: valsOf(B.runId).length };
    newParse("p-C", 999, true);
    m.failInsertOnce.add("account_homologations");
    const C = await evidenceRun();
    expect(C.map.status).toBe(500);
    expect(runById(C.runId)).toMatchObject({ status: "failed", failed_stage: "mapping", error_code: "INSERT_FAILED" });
    expect(pointer()).toBe(B.runId);
    expect({ homs: homsOf(B.runId).length, vals: valsOf(B.runId).length }).toEqual(before);
    expect(canPromote(runById(C.runId) as never)).toBe(false);
  });

  it("E. validación falla → run failed; la validación activa anterior sigue activa", async () => {
    const B = await evidenceRun();
    const activeVals = valsOf(B.runId).length;
    newParse("p-D", 120, true);
    m.failInsertOnce.add("validation_results");
    const D = await evidenceRun();
    expect(D.validate!.status).toBe(500);
    expect(runById(D.runId)).toMatchObject({ status: "failed", failed_stage: "validation" });
    expect(pointer()).toBe(B.runId);
    expect(selectActiveRows(m.tables.validation_results as never[], pointer() as string)).toHaveLength(activeVals);
    expect(homsOf(D.runId).length).toBeGreaterThan(0); // D queda auditable, pero no activo
  });

  it("un run viejo no pisa a uno más nuevo (compare-and-swap): conflicto 409, el puntero no cambia", async () => {
    const X = await call(mapHandler, { analysis_id: "a1" });
    const xId = (await X.json()).data.evidence_run_id;
    newParse("p-Y", 130, true);
    const Y = await evidenceRun();
    expect(pointer()).toBe(Y.runId);
    const staleValidate = await call(validateHandler, { analysis_id: "a1", evidence_run_id: xId });
    expect(staleValidate.status).toBe(409);
    expect((await staleValidate.json()).error.code).toBe("EVIDENCE_RUN_PROMOTION_CONFLICT");
    expect(pointer()).toBe(Y.runId);
    expect(runById(xId)).toMatchObject({ status: "failed", failed_stage: "promotion" });
  });

  it("validar sin una homologación pendiente → 400, sin tocar el activo", async () => {
    const B = await evidenceRun();
    const resp = await call(validateHandler, { analysis_id: "a1" });
    expect(resp.status).toBe(400);
    expect((await resp.json()).error.code).toBe("NO_MAPPED_EVIDENCE_RUN");
    expect(pointer()).toBe(B.runId);
  });
});

describe("G/H: legacy y casos calculados", () => {
  it("G. sin puntero, los lectores ven exactamente las filas legacy (evidence_run_id null/ausente)", () => {
    const legacy = [{ canonical_account: "revenue", value: 100, period: "2024" }, { canonical_account: "cash", value: 5, period: "2024", evidence_run_id: null }];
    const versioned = [{ canonical_account: "revenue", value: 999, period: "2024", evidence_run_id: "run-1" }];
    expect(selectActiveRows([...legacy, ...versioned], null)).toEqual(legacy);
    expect(selectActiveRows([...legacy, ...versioned], undefined)).toEqual(legacy);
    expect(deriveCoreFinancialFields(selectActiveRows([...legacy, ...versioned], null), "2024").revenue).toBe(100);
    // Filtro de consulta: legacy → IS NULL; con puntero → eq.
    const calls: string[] = [];
    const q = { eq: (c: string, v: unknown) => { calls.push(`eq:${c}=${v}`); return q; }, is: (c: string) => { calls.push(`is:${c}=null`); return q; } };
    applyActiveRunFilter(q, null); applyActiveRunFilter(q, "run-1");
    expect(calls).toEqual(["is:evidence_run_id=null", "eq:evidence_run_id=run-1"]);
  });

  it("selectRunToValidate: explícito o el último mapped; nunca uno failed/completed", () => {
    const runs = [
      { id: "r1", status: "completed" as const, started_at: "2026-01-01" },
      { id: "r2", status: "mapped" as const, started_at: "2026-01-02" },
      { id: "r3", status: "failed" as const, started_at: "2026-01-03" },
    ];
    expect(selectRunToValidate(runs)).toEqual({ run: runs[1] });
    expect(selectRunToValidate(runs, "r3")).toMatchObject({ error: "RUN_NOT_MAPPED" });
    expect(selectRunToValidate(runs, "zz")).toMatchObject({ error: "RUN_NOT_FOUND" });
  });

  it("H. caso calculado: 409 CASE_ALREADY_CALCULATED y ningún evidence run creado", async () => {
    setup({ status: "calculo_completo", calculation_result: { version: { input_fingerprint: "x" } } });
    expect((await call(mapHandler, { analysis_id: "a1" })).status).toBe(409);
    expect((await call(validateHandler, { analysis_id: "a1" })).status).toBe(409);
    expect(m.tables.evidence_runs).toEqual([]);
    expect(m.tables.account_homologations).toEqual([]);
  });
});
