// @vitest-environment node
// Código REAL de parse-document, map-accounts y validate-analysis (index.ts)
// con dobles de serve, supabase-js, xlsx y Deno. Regla: si el caso tiene
// `calculation_result`, ningún endpoint de reprocesamiento de Evidence lo
// modifica — 409 CASE_ALREADY_CALCULATED y el audit event de rechazo como
// ÚNICA escritura (se preserva el resultado oficial y su provenance).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeState, createFakeSupabase, type FakeState } from "./test-support/fake-supabase";

const h = vi.hoisted(() => ({ handlers: [] as ((req: Request) => Promise<Response>)[], fake: null as unknown }));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (fn: (req: Request) => Promise<Response>) => { h.handlers.push(fn); } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.49.1", () => ({ createClient: () => h.fake }));
vi.mock("https://esm.sh/xlsx@0.18.5", () => ({ read: vi.fn(), utils: {} }));
vi.mock("https://esm.sh/@anthropic-ai/sdk@0.113.0", () => ({ default: class { messages = { create: vi.fn() }; } }));

(globalThis as unknown as { Deno: unknown }).Deno = {
  env: {
    get: (k: string) => ({
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SECRET_KEYS: JSON.stringify({ default: "sb_secret_test_key_0000000000" }),
      SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: "sb_publishable_test" }),
    } as Record<string, string>)[k],
  },
};

await import("../parse-document/index");
await import("../map-accounts/index");
await import("../validate-analysis/index");
const [parseHandler, mapHandler, validateHandler] = h.handlers;

// Envelope de cálculo con decimales y anidamiento: se compara byte-for-byte.
const CALC = {
  valuation: { enterpriseValue: 1668259651.2050533, equityValue: 920678902.2050533, wacc: 10.554236424286662 },
  version: { input_fingerprint: "db5429ad178da7f5", calculated_at: "2026-10-15T15:12:03.302Z" },
  projections: [{ year: 5, fcff: 135441290.79827598 }],
};
const CALC_BYTES = JSON.stringify(CALC);

let state: FakeState;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  state = createFakeState({ id: "a1", user_id: "owner-1", status: "calculo_completo", validation_status: "aprobado", calculation_result: CALC });
  h.fake = createFakeSupabase(state);
  fetchMock = vi.fn(async () => new Response("{}"));
  vi.stubGlobal("fetch", fetchMock); // ninguna llamada a IA ni a otras funciones
});

const call = (handler: (req: Request) => Promise<Response>, body: Record<string, unknown>) =>
  handler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify(body) }));

function expectOnlyRejectionWrite(component: string) {
  expect(state.writes).toHaveLength(1);
  expect(state.writes[0]).toMatchObject({ table: "audit_events", op: "insert" });
  expect(state.writes[0].payload).toMatchObject({ event_type: "evidence_reprocessing_rejected", component, metadata: { code: "CASE_ALREADY_CALCULATED", status: "calculo_completo" } });
  expect(JSON.stringify(state.analysis!.calculation_result)).toBe(CALC_BYTES);
  expect(state.analysis!.status).toBe("calculo_completo");
  expect(state.storageUploads).toEqual([]);
  expect(fetchMock).not.toHaveBeenCalled();
}

describe("endpoints directos de Evidence sobre un caso calculado → 409, sin escrituras", () => {
  it("parse-document: 409 antes de escribir (no documents_parsed, no status, no descarga)", async () => {
    const resp = await call(parseHandler, { analysis_id: "a1", document_id: "d1" });
    expect(resp.status).toBe(409);
    expect((await resp.json()).error.code).toBe("CASE_ALREADY_CALCULATED");
    expectOnlyRejectionWrite("parse-document");
    expect(state.writes.some((w) => w.table === "documents_parsed" || w.table === "documents")).toBe(false);
  });

  it("map-accounts: 409 y NO ejecuta el DELETE de account_homologations", async () => {
    const resp = await call(mapHandler, { analysis_id: "a1" });
    expect(resp.status).toBe(409);
    expect((await resp.json()).error.code).toBe("CASE_ALREADY_CALCULATED");
    expectOnlyRejectionWrite("map-accounts");
    expect(state.writes.some((w) => w.table === "account_homologations")).toBe(false);
  });

  it("validate-analysis: 409 y NO ejecuta el DELETE de validation_results", async () => {
    const resp = await call(validateHandler, { analysis_id: "a1" });
    expect(resp.status).toBe(409);
    expect((await resp.json()).error.code).toBe("CASE_ALREADY_CALCULATED");
    expectOnlyRejectionWrite("validate-analysis");
    expect(state.writes.some((w) => w.table === "validation_results")).toBe(false);
    expect(state.analysis!.validation_status).toBe("aprobado");
  });

  it("ningún endpoint toca structured_inputs ni calculation_result", async () => {
    await call(parseHandler, { analysis_id: "a1", document_id: "d1" });
    await call(mapHandler, { analysis_id: "a1" });
    await call(validateHandler, { analysis_id: "a1" });
    expect(state.writes.some((w) => w.table === "structured_inputs" || w.table === "analyses")).toBe(false);
    expect(JSON.stringify(state.analysis!.calculation_result)).toBe(CALC_BYTES);
  });
});

describe("sin calculation_result el guard no interviene (comportamiento previo)", () => {
  it("map-accounts sobre un caso no calculado sí avanza a sus escrituras normales", async () => {
    state = createFakeState({ id: "a1", user_id: "owner-1", status: "parsing_completado", calculation_result: null });
    h.fake = createFakeSupabase(state);
    await call(mapHandler, { analysis_id: "a1" });
    expect(state.writes.find((w) => w.table === "analyses")?.payload).toMatchObject({ status: "homologacion_en_curso" });
    expect(state.writes.some((w) => (w.payload as { event_type?: string })?.event_type === "evidence_reprocessing_rejected")).toBe(false);
  });
});
