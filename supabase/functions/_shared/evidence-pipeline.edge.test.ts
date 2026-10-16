// @vitest-environment node
// Comportamiento REAL de run-analysis-pipeline/index.ts: se importa el handler
// con `serve`, supabase-js, Deno y `fetch` sustituidos por dobles. Demuestra que
// el pipeline de Evidence termina tras validate y nunca llama a
// build-structured-input ni a ejecutar-calculo.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeState, createFakeSupabase, writesTo, type FakeState } from "./test-support/fake-supabase";

const h = vi.hoisted(() => ({
  handler: null as null | ((req: Request) => Promise<Response>),
  fake: null as unknown,
}));

vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (fn: (req: Request) => Promise<Response>) => { h.handler = fn; } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.49.1", () => ({ createClient: () => h.fake }));

(globalThis as unknown as { Deno: unknown }).Deno = {
  env: {
    get: (k: string) => ({
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SECRET_KEYS: JSON.stringify({ default: "sb_secret_test_key_0000000000" }),
      SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: "sb_publishable_test" }),
    } as Record<string, string>)[k],
  },
};

await import("../run-analysis-pipeline/index");

const ANALYSIS = { id: "a1", user_id: "owner-1", status: "documentos_cargados", calculation_result: null, input_payload: null };
const DOCS = [{ id: "d1", doc_type_declared: "estado_resultados", processing_status: "pendiente" }];

let state: FakeState;
let fetched: string[];

function run(validate: { status?: string; body?: unknown; throws?: boolean } = {}) {
  fetched = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const name = url.split("/functions/v1/")[1] ?? url;
    fetched.push(name);
    if (name === "parse-document") return new Response(JSON.stringify({ success: true, data: { rows_extracted: 12 } }));
    if (name === "map-accounts") return new Response(JSON.stringify({ success: true, data: { total_mapped: 20 } }));
    if (name === "validate-analysis") {
      if (validate.throws) throw new Error("validate down");
      const vs = validate.status ?? "aprobado";
      // Como el real: validate-analysis deja el estado del caso.
      state.analysis!.status = vs === "aprobado" ? "validacion_aprobada" : vs === "aprobado_con_advertencias" ? "validacion_con_advertencias" : "validacion_bloqueada";
      return new Response(JSON.stringify(validate.body ?? { success: true, data: { validation_status: vs, can_proceed: vs !== "bloqueado", semaphore: {}, results: [] } }));
    }
    return new Response(JSON.stringify({ success: false }), { status: 500 }); // cualquier otra función
  }));
  return h.handler!(new Request("http://localhost/run", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify({ analysis_id: "a1" }) }));
}

beforeEach(() => {
  state = createFakeState(ANALYSIS, DOCS);
  h.fake = createFakeSupabase(state);
});

describe("run-analysis-pipeline — Evidence: parse → map → validate → STOP", () => {
  it("termina tras validate: nunca llama build-structured-input ni ejecutar-calculo", async () => {
    const resp = await run();
    const body = await resp.json();
    expect(resp.status).toBe(200);
    expect(body.success).toBe(true);
    expect(fetched).toEqual(["parse-document", "map-accounts", "validate-analysis"]);
    expect(fetched.some((f) => /build-structured-input|ejecutar-calculo/.test(f))).toBe(false);
  });

  it("conserva como estado final el que fijó validate (aprobada) y no escribe estados de cálculo", async () => {
    const body = await (await run()).json();
    expect(body.data.status).toBe("validacion_aprobada");
    expect(state.analysis!.status).toBe("validacion_aprobada");
    const statuses = writesTo(state, "analyses", "update").map((w) => (w.payload as { status?: string }).status);
    expect(statuses.every((s) => ["parsing_en_curso", "homologacion_en_curso"].includes(s as string))).toBe(true);
    for (const w of writesTo(state, "analyses", "update")) expect(Object.keys(w.payload as object)).not.toContain("input_payload");
  });

  it("con advertencias: estado final validacion_con_advertencias", async () => {
    const body = await (await run({ status: "aprobado_con_advertencias" })).json();
    expect(body.data.status).toBe("validacion_con_advertencias");
    expect(state.analysis!.status).toBe("validacion_con_advertencias");
  });

  it("registra evidence_pipeline_complete y ningún pipeline_complete; los jobs son solo de Evidence", async () => {
    await run();
    const events = writesTo(state, "audit_events", "insert").map((w) => (w.payload as { event_type: string }).event_type);
    expect(events).toContain("evidence_pipeline_complete");
    expect(events).not.toContain("pipeline_complete");
    const jobs = new Set(writesTo(state, "analysis_jobs", "upsert").map((w) => (w.payload as { job_type: string }).job_type));
    expect([...jobs].sort()).toEqual(["homologacion", "parsing", "validacion"]);
    expect(writesTo(state, "job_locks", "delete")).toHaveLength(1); // lock liberado
  });

  it("validación bloqueada: el pipeline se detiene (400) y no avanza", async () => {
    const resp = await run({ status: "bloqueado" });
    expect(resp.status).toBe(400);
    expect((await resp.json()).error.code).toBe("VALIDATION_BLOCKED");
    expect(state.analysis!.status).toBe("validacion_bloqueada");
    expect(fetched.some((f) => /build-structured-input|ejecutar-calculo/.test(f))).toBe(false);
  });

  it("una excepción en validate ya no se ignora: error_tecnico, sin continuar", async () => {
    const resp = await run({ throws: true });
    expect(resp.status).toBe(500);
    expect(state.analysis!.status).toBe("error_tecnico");
    expect(fetched).toEqual(["parse-document", "map-accounts", "validate-analysis"]);
  });

  it("un estado de validación inesperado no se da por terminado", async () => {
    const resp = await run({ body: { success: true, data: { validation_status: "raro", can_proceed: true } } });
    expect(resp.status).toBe(500);
    expect(state.analysis!.status).toBe("error_tecnico");
  });
});

describe("run-analysis-pipeline — protección de casos ya calculados", () => {
  it("rechaza (409) el reprocesamiento y no toca nada", async () => {
    const calculated = { valuation: { enterpriseValue: 1 }, version: { input_fingerprint: "f" } };
    state = createFakeState({ ...ANALYSIS, status: "calculo_completo", calculation_result: calculated }, DOCS);
    h.fake = createFakeSupabase(state);

    const resp = await run();
    expect(resp.status).toBe(409);
    expect((await resp.json()).error.code).toBe("CASE_ALREADY_CALCULATED");
    expect(fetched).toEqual([]); // ninguna función invocada
    expect(writesTo(state, "analyses")).toHaveLength(0);
    expect(writesTo(state, "job_locks")).toHaveLength(0);
    expect(writesTo(state, "analysis_jobs")).toHaveLength(0);
    expect(state.analysis!.calculation_result).toEqual(calculated);
    expect(state.analysis!.status).toBe("calculo_completo");
    const events = writesTo(state, "audit_events", "insert").map((w) => (w.payload as { event_type: string }).event_type);
    expect(events).toEqual(["evidence_reprocessing_rejected"]);
  });
});
