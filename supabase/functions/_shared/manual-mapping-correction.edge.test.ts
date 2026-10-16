// @vitest-environment node
// Corrección manual de homologación sobre Evidence VERSIONADA (ADR-011, LIM-09):
// handler REAL create-manual-mapping-run + handler REAL validate-analysis sobre
// una base en memoria (la RPC SQL está emulada en test-support/memory-rpcs.ts;
// su versión real se prueba contra Postgres). Valores sintéticos.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryDb, type MemoryDb, type Row } from "./test-support/memory-db";
import { createManualMappingRunInMemory } from "./test-support/memory-rpcs";
import { allowedCanonicalAccountsFor, evaluateCorrectionTarget } from "./manual-mapping-correction";

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
await import("../create-manual-mapping-run/index");
await import("../validate-analysis/index");
const [correctHandler, validateHandler] = h.handlers;

let n = 0;
const hom = (original_label: string, canonical_account: string, category: string, value: number, evidence_run_id: string | null, period = "2024") =>
  ({ id: `h-${++n}`, analysis_id: "a1", document_id: "d1", original_label, canonical_account, category, period, value, confidence_score: canonical_account === "unclassified" ? "baja" : "alta", ambiguity_flag: canonical_account === "unclassified", mapping_notes: `nota ${original_label}`, evidence_run_id, created_at: "2026-10-16T10:00:00Z" });
let m: MemoryDb;
let RUN_A: Row[];
function setup(analysis: Row = {}, role = "admin") {
  n = 0;
  RUN_A = [
    hom("Net sales", "revenue", "income_statement", 1000.25, "run-A"),
    hom("Cost of sales", "cost_of_sales", "income_statement", 600, "run-A"),
    hom("Selling, general and administrative", "opex", "income_statement", 200, "run-A"),
    hom("Other income", "unclassified", "income_statement", 12.5, "run-A"),
    hom("Depreciation and amortization", "unclassified", "cash_flow", 26.47, "run-A"),
    hom("Cash and cash equivalents", "cash", "balance_sheet", 100, "run-A"),
    hom("Total assets", "total_assets", "balance_sheet", 900, "run-A"),
    hom("Total liabilities", "total_liabilities", "balance_sheet", 400, "run-A"),
    hom("Total shareholders' equity", "equity", "balance_sheet", 500, "run-A"),
  ];
  m = createMemoryDb({
    analyses: [{ id: "a1", user_id: "owner-1", status: "validacion_aprobada", validation_status: "aprobado", calculation_result: null, active_evidence_run_id: "run-A", ...analysis }],
    profiles: [{ id: "owner-1", role }],
    documents: [{ id: "d1", analysis_id: "a1", original_filename: "fs.xlsx", file_size_bytes: 10, processing_status: "completado", doc_type_declared: "estado_resultados", doc_type_effective: "estados_financieros" }],
    documents_parsed: [{ id: "p-A", document_id: "d1", created_at: "2026-10-16T09:00:00Z", parsed_structure: { rows: [] } }],
    evidence_runs: [
      { id: "run-0", analysis_id: "a1", status: "completed", source_parsed_document_ids: ["p-0"], started_at: "2026-10-15T00:00:00Z" },
      { id: "run-A", analysis_id: "a1", status: "completed", source_parsed_document_ids: ["p-A"], previous_active_run_id: "run-0", started_at: "2026-10-16T00:00:00Z" },
    ],
    account_homologations: [hom("Net sales", "revenue", "income_statement", 999, "run-0"), ...RUN_A],
    validation_results: [], audit_events: [],
  });
  m.rpcs.create_manual_mapping_run = createManualMappingRunInMemory;
  h.db = m.client;
}
const call = async (handler: (r: Request) => Promise<Response>, body: object) => {
  const r = await handler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify(body) }));
  return { status: r.status, body: await r.json() };
};
const target = () => RUN_A.find((r) => r.original_label === "Other income")!;
const correct = (over: object = {}) => call(correctHandler, { analysis_id: "a1", expected_active_evidence_run_id: "run-A", homologation_id: target().id, new_canonical_account: "revenue", reason: "TEST-ONLY: corrección sintética de prueba", ...over });
const rowsOf = (run: string) => m.tables.account_homologations.filter((r) => r.evidence_run_id === run);
const pointer = () => m.tables.analyses[0].active_evidence_run_id;
const EVIDENCE_FIELDS = ["analysis_id", "document_id", "original_label", "category", "period", "value"] as const;

beforeEach(() => setup());

describe("A → B: corrección versionada sin destruir historia", () => {
  it("crea B derivado de A: mismo número de filas, solo la fila objetivo cambia de cuenta; A intacto; B no se promueve", async () => {
    const before = structuredClone(rowsOf("run-A"));
    const r = await correct();
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const B = r.body.data.evidence_run_id as string;
    expect(r.body.data).toMatchObject({ evidence_run_status: "mapped", previous_active_run_id: "run-A", homologations_copied: RUN_A.length });
    expect(rowsOf("run-A")).toEqual(before); // A intacto: ningún UPDATE histórico
    const b = rowsOf(B);
    expect(b).toHaveLength(before.length);
    for (const src of before) {
      const copy = b.find((x) => x.derived_from_homologation_id === src.id)!;
      expect(copy, `copia de ${src.id}`).toBeTruthy();
      for (const f of EVIDENCE_FIELDS) expect(copy[f], f).toBe(src[f]); // value, period, label, documento, estado: idénticos
      if (src.id === target().id) {
        expect(copy).toMatchObject({ canonical_account: "revenue", previous_canonical_account: "unclassified", manual_correction_by: "owner-1", manual_correction_reason: "TEST-ONLY: corrección sintética de prueba", confidence_score: "alta", ambiguity_flag: false });
        expect(copy.manual_corrected_at).toBeTruthy();
      } else {
        expect(copy).toMatchObject({ canonical_account: src.canonical_account, mapping_notes: src.mapping_notes, manual_correction_by: null, previous_canonical_account: null });
      }
    }
    const run = m.tables.evidence_runs.find((x) => x.id === B)!;
    expect(run).toMatchObject({ status: "mapped", previous_active_run_id: "run-A", origin: "manual_mapping_correction", created_by: "owner-1" });
    expect(run.source_parsed_document_ids).toEqual(["p-A"]); // sin reparse ni parses falsos
    expect(m.tables.documents_parsed).toHaveLength(1);
    expect(pointer()).toBe("run-A"); // no se promueve antes de validar
    expect(m.tables.audit_events.find((e) => e.event_type === "manual_mapping_run_created")!.metadata).toMatchObject({ evidence_run_id: B, previous_active_run_id: "run-A", previous_canonical_account: "unclassified", new_canonical_account: "revenue" });
    expect(JSON.stringify(m.tables.audit_events)).not.toMatch(/TEST-ONLY/); // el motivo no se copia al audit
  });

  it("validate-analysis(B) termina → B activo (CAS ADR-009); A sigue histórico y consultable", async () => {
    const B = (await correct()).body.data.evidence_run_id;
    const v = await call(validateHandler, { analysis_id: "a1", evidence_run_id: B });
    expect(v.status, JSON.stringify(v.body)).toBe(200);
    expect(pointer()).toBe(B);
    expect(m.tables.evidence_runs.find((x) => x.id === B)).toMatchObject({ status: "completed" });
    expect(rowsOf("run-A")).toHaveLength(RUN_A.length);
    expect(m.tables.validation_results.filter((x) => x.evidence_run_id === B).length).toBeGreaterThan(0);
  });

  it("validate-analysis detecta la consolidación creada por la corrección (MAP_009), no la arregla", async () => {
    const B = (await correct()).body.data.evidence_run_id;
    await call(validateHandler, { analysis_id: "a1", evidence_run_id: B });
    const map9 = m.tables.validation_results.find((x) => x.evidence_run_id === B && x.rule_code === "MAP_009")!;
    expect(map9).toMatchObject({ status: "failed" });
    expect(String(map9.detail)).toMatch(/Other income.*Net sales|Net sales.*Other income/);
    expect(rowsOf(B).find((x) => x.original_label === "Other income")!.canonical_account).toBe("revenue"); // nada se des-hace en silencio
    // un run sin correcciones no recibe reglas nuevas (salidas previas sin cambios)
    expect(m.tables.validation_results.some((x) => x.evidence_run_id !== B && ["MAP_008", "MAP_009"].includes(String(x.rule_code)))).toBe(false);
  });

  it("validate-analysis(B) falla técnicamente → A sigue activo; B queda failed", async () => {
    const B = (await correct()).body.data.evidence_run_id;
    m.failInsertOnce.add("validation_results");
    const v = await call(validateHandler, { analysis_id: "a1", evidence_run_id: B });
    expect(v.status).toBeGreaterThanOrEqual(400);
    expect(pointer()).toBe("run-A");
    expect(m.tables.evidence_runs.find((x) => x.id === B)!.status).toBe("failed");
  });
});

describe("protecciones", () => {
  it("caso calculado → 409 CASE_ALREADY_CALCULATED; no se crea run", async () => {
    setup({ calculation_result: { valuation: {} }, status: "calculo_completo" });
    expect(await correct()).toMatchObject({ status: 409, body: { error: { code: "CASE_ALREADY_CALCULATED" } } });
    expect(m.tables.evidence_runs).toHaveLength(2);
  });
  it("fila de otro run (histórico) → 409 HOMOLOGATION_NOT_IN_ACTIVE_RUN", async () => {
    const old = m.tables.account_homologations.find((x) => x.evidence_run_id === "run-0")!;
    expect(await correct({ homologation_id: old.id, new_canonical_account: "opex" })).toMatchObject({ status: 409, body: { error: { code: "HOMOLOGATION_NOT_IN_ACTIVE_RUN" } } });
  });
  it("actor en el body → 400; rol sin permiso → 403; caso ajeno → 404", async () => {
    for (const f of ["created_by", "manual_correction_by", "user_id"]) {
      expect(await correct({ [f]: "attacker" })).toMatchObject({ status: 400, body: { error: { code: "ACTOR_FIELDS_NOT_ACCEPTED" } } });
    }
    setup({}, "user");
    expect((await correct()).status).toBe(403);
    setup({ user_id: "someone-else" });
    expect((await correct()).status).toBe(404);
    expect(m.tables.evidence_runs).toHaveLength(2);
  });
  it("run activo distinto del esperado → 409 EVIDENCE_RUN_CHANGED (antes y DENTRO de la transacción)", async () => {
    expect(await correct({ expected_active_evidence_run_id: "run-0" })).toMatchObject({ status: 409, body: { error: { code: "EVIDENCE_RUN_CHANGED" } } });
    // El puntero se mueve entre la lectura del handler y la RPC: la RPC re-verifica y no crea nada.
    const real = m.rpcs.create_manual_mapping_run;
    m.rpcs.create_manual_mapping_run = (tables, args) => { tables.analyses[0].active_evidence_run_id = "run-0"; return real(tables, args); };
    expect(await correct()).toMatchObject({ status: 409, body: { error: { code: "EVIDENCE_RUN_CHANGED" } } });
    expect(m.tables.evidence_runs).toHaveLength(2);
  });
  it("el puntero cambia DESPUÉS de crear B → validate(B) no promueve un set stale", async () => {
    const B = (await correct()).body.data.evidence_run_id;
    m.tables.evidence_runs.push({ id: "run-C", analysis_id: "a1", status: "completed", source_parsed_document_ids: ["p-A"], started_at: "2026-10-16T12:00:00Z" });
    m.tables.analyses[0].active_evidence_run_id = "run-C"; // otro run se promovió entretanto
    await call(validateHandler, { analysis_id: "a1", evidence_run_id: B });
    expect(pointer()).toBe("run-C");
    expect(m.tables.evidence_runs.find((x) => x.id === B)).toMatchObject({ status: "failed", failed_stage: "promotion" });
  });
  it("destino fuera de la taxonomía del estado de la fila → 400 (D&A del flujo de caja como `da` es metodología)", async () => {
    const cf = RUN_A.find((x) => x.category === "cash_flow")!;
    expect(await correct({ homologation_id: cf.id, new_canonical_account: "da" })).toMatchObject({ status: 400, body: { error: { code: "CANONICAL_ACCOUNT_NOT_ALLOWED" } } });
    expect(await correct({ new_canonical_account: "made_up_account" })).toMatchObject({ status: 400 });
    expect(await correct({ new_canonical_account: "unclassified" })).toMatchObject({ status: 400, body: { error: { code: "MANUAL_CORRECTION_NOOP" } } });
    expect(await correct({ reason: "corto" })).toMatchObject({ status: 400, body: { error: { code: "MANUAL_CORRECTION_REASON_REQUIRED" } } });
  });
  it("legacy (sin run activo) → 409 NOT_VERSIONED_EVIDENCE (sigue el camino legacy)", async () => {
    setup({ active_evidence_run_id: null });
    expect(await correct()).toMatchObject({ status: 409, body: { error: { code: "NOT_VERSIONED_EVIDENCE" } } });
  });
});

describe("reglas puras", () => {
  it("destinos válidos por estado + unclassified", () => {
    expect(allowedCanonicalAccountsFor("income_statement")).toEqual(expect.arrayContaining(["revenue", "da", "unclassified"]));
    expect(allowedCanonicalAccountsFor("cash_flow")).toEqual(["unclassified"]);
    expect(evaluateCorrectionTarget({ canonical_account: "unclassified", category: "balance_sheet" }, "cash")).toEqual({ ok: true });
  });
});
