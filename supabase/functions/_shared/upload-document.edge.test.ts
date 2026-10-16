// @vitest-environment node
// Comportamiento REAL de upload-document/index.ts con dobles de serve,
// supabase-js y Deno: subir un documento a un caso ya calculado no degrada
// su estado ni toca calculation_result, y queda marcado fuera del cálculo.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeState, createFakeSupabase, writesTo, type FakeState } from "./test-support/fake-supabase";

const h = vi.hoisted(() => ({ handler: null as null | ((req: Request) => Promise<Response>), fake: null as unknown }));
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

await import("../upload-document/index");

let state: FakeState;

function upload() {
  const fd = new FormData();
  fd.append("file", new File([new Uint8Array([37, 80, 68, 70])], "er.pdf", { type: "application/pdf" }));
  fd.append("analysis_id", "a1");
  fd.append("doc_type", "estado_resultados");
  return h.handler!(new Request("http://localhost/upload", { method: "POST", headers: { Authorization: "Bearer tok" }, body: fd }));
}

const setup = (analysis: Record<string, unknown>) => {
  state = createFakeState(analysis);
  h.fake = createFakeSupabase(state);
};

describe("upload-document", () => {
  beforeEach(() => setup({ id: "a1", user_id: "owner-1", status: "creado", calculation_result: null }));

  it("caso sin cálculo: pasa a documentos_cargados (comportamiento previo)", async () => {
    const body = await (await upload()).json();
    expect(body.success).toBe(true);
    expect(body.data.excluded_from_calculation).toBe(false);
    expect(state.analysis!.status).toBe("documentos_cargados");
    expect(state.storageUploads).toHaveLength(1);
  });

  it("caso calculado: no degrada el estado, no toca calculation_result y marca el documento fuera del cálculo", async () => {
    const calc = { valuation: { enterpriseValue: 1668259651.2050533 }, version: { input_fingerprint: "db5429ad178da7f5" } };
    setup({ id: "a1", user_id: "owner-1", status: "calculo_completo", calculation_result: calc });

    const body = await (await upload()).json();
    expect(body.success).toBe(true);
    expect(writesTo(state, "analyses")).toHaveLength(0); // ninguna escritura en analyses
    expect(state.analysis!.status).toBe("calculo_completo");
    expect(state.analysis!.calculation_result).toEqual(calc);
    expect(body.data.excluded_from_calculation).toBe(true);
    expect(body.data.warning).toMatch(/NO forma parte de ese cálculo/);
    expect(body.meta.status).toBe("calculo_completo");
    const audit = writesTo(state, "audit_events", "insert")[0].payload as { metadata: Record<string, unknown> };
    expect(audit.metadata.excluded_from_official_calculation).toBe(true);
  });
});
