// @vitest-environment node
// AUTH ANTES DE LA BASE en ejecutar-calculo y continuar-tras-revision (handlers
// REALES sobre una base en memoria que registra TODA operación). Con
// verify_jwt = false, una request sin credenciales válidas debe responder 401
// sin ninguna lectura ni escritura (ni audit, ni lookup del análisis).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryDb, type MemoryDb, type Row } from "./test-support/memory-db";

const h = vi.hoisted(() => ({ handlers: [] as ((req: Request) => Promise<Response>)[], db: null as unknown }));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (fn: (req: Request) => Promise<Response>) => { h.handlers.push(fn); } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.49.1", () => ({ createClient: () => h.db }));
vi.mock("https://esm.sh/@supabase/supabase-js@2", () => ({ createClient: () => h.db }));
const SECRET = "sb_secret_test_key_0000000000";
(globalThis as unknown as { Deno: unknown }).Deno = {
  env: { get: (k: string) => ({
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: SECRET }),
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: "sb_publishable_test" }),
  } as Record<string, string>)[k] },
};
await import("../ejecutar-calculo/index");
await import("../continuar-tras-revision/index");
const [ejecutar, continuar] = h.handlers;

let m: MemoryDb;
function setup(role = "user", analysis: Row = {}) {
  m = createMemoryDb({
    analyses: [
      { id: "own", user_id: "owner-1", status: "revision_manual_requerida", sector: "industrial", company_name: "Acme", calculation_result: null, active_evidence_run_id: null, ...analysis },
      { id: "foreign", user_id: "someone-else", status: "revision_manual_requerida", sector: "x", company_name: "Ajena", calculation_result: null, active_evidence_run_id: null },
    ],
    profiles: [{ id: "owner-1", role }],
    manual_reviews: [{ id: "rv-own", analysis_id: "own", estado: "aprobado", created_at: "2026-10-16T00:00:00Z" }, { id: "rv-foreign", analysis_id: "foreign", estado: "aprobado", created_at: "2026-10-16T00:00:00Z" }],
    audit_events: [], structured_inputs: [], valuation_files: [], account_homologations: [], validation_results: [],
  });
  h.db = m.client;
}
const req = (handler: (r: Request) => Promise<Response>, body: object, headers: Record<string, string> = { Authorization: "Bearer valid-token", apikey: "sb_publishable_test" }) =>
  handler(new Request("http://localhost/fn", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }));
const writes = () => m.ops.filter((o) => o.op !== "select");
const reads = () => m.ops.filter((o) => o.op === "select").map((o) => o.table);

beforeEach(() => setup());

for (const [name, handler] of [["ejecutar-calculo", () => ejecutar], ["continuar-tras-revision", () => continuar]] as const) {
  describe(`${name}: autenticación antes de cualquier acceso a la base`, () => {
    it("A. sin Authorization → 401 y CERO operaciones de base (ni lecturas ni audit)", async () => {
      const r = await req(handler(), { analysis_id: "own" }, {});
      expect(r.status).toBe(401);
      expect((await r.json()).error.code).toBe("UNAUTHORIZED");
      expect(m.ops).toEqual([]);
    });
    it("B. Authorization inválida → 401 y CERO operaciones de base", async () => {
      m.auth.user = null;
      const r = await req(handler(), { analysis_id: "own" }, { Authorization: "Bearer garbage", apikey: "sb_publishable_test" });
      expect(r.status).toBe(401);
      expect(m.ops).toEqual([]);
      // esquema incorrecto o apikey pública sin JWT → también 401 sin base
      for (const headers of [{ Authorization: "Basic abc" }, { apikey: "sb_publishable_test" }]) {
        expect((await req(handler(), { analysis_id: "own" }, headers)).status).toBe(401);
      }
      expect(m.ops).toEqual([]);
    });
    it("C. JWT válido + análisis inexistente → 404, solo lecturas post-auth, 0 escrituras", async () => {
      const r = await req(handler(), { analysis_id: "missing" });
      expect(r.status).toBe(404);
      expect(writes()).toEqual([]);
      expect(reads()).toEqual(["profiles", "analyses"]);
    });
    it("D. JWT válido + análisis de otro owner (rol user) → 404 canónico, 0 escrituras, nada más del caso se lee", async () => {
      const r = await req(handler(), { analysis_id: "foreign" });
      expect(r.status).toBe(404);
      expect(writes()).toEqual([]);
      expect(reads()).toEqual(["profiles", "analyses"]);
      expect(m.tables.audit_events).toEqual([]);
    });
    it("F/G. ninguna request no autenticada crea audit, cambia estado ni inicia Calculation", async () => {
      await req(handler(), { analysis_id: "own" }, {});
      await req(handler(), { analysis_id: "foreign" }, {});
      expect(m.tables.audit_events).toEqual([]);
      expect(m.tables.analyses.map((a) => a.status)).toEqual(["revision_manual_requerida", "revision_manual_requerida"]);
      expect(m.tables.analyses.every((a) => a.calculation_result === null)).toBe(true);
      expect(m.ops).toEqual([]);
    });
    it("H. invocación interna canónica (secret key en apikey, sin JWT) pasa el gate", async () => {
      const r = await req(handler(), { analysis_id: "own" }, { apikey: SECRET });
      expect(r.status).not.toBe(401);
      expect(reads()).toContain("analyses");
    });
  });
}

describe("E. JWT válido + análisis propio → alcanza la lógica existente", () => {
  it("ejecutar-calculo: pasa auth y ownership y llega a la lógica existente (aquí, sin structured input → error del flujo actual)", async () => {
    setup("user", { status: "validacion_aprobada", active_evidence_run_id: null });
    const r = await req(ejecutar, { analysis_id: "own" });
    const body = await r.json();
    expect(r.status).not.toBe(401);
    expect(r.status).not.toBe(404);
    expect(body.error.message).toMatch(/input_payload/);
    expect(reads()).toEqual(expect.arrayContaining(["profiles", "analyses", "structured_inputs"]));
  });
  it("continuar-tras-revision: el dueño (rol user) llega a la decisión existente (auto-aprobación bloqueada, con su audit en SU caso)", async () => {
    const r = await req(continuar, { analysis_id: "own" });
    expect(r.status).toBe(403);
    expect(reads()).toEqual(["profiles", "analyses", "manual_reviews"]);
    expect(m.tables.audit_events).toEqual([expect.objectContaining({ analysis_id: "own", event_type: "acceso_rechazado_autoaprobacion" })]);
  });
  it("continuar-tras-revision: analyst/admin conserva la política existente (sigue a homologaciones)", async () => {
    setup("admin");
    const r = await req(continuar, { analysis_id: "own" });
    expect(r.status).toBe(400); // sin homologaciones en este fixture → comportamiento existente
    expect(reads()).toEqual(expect.arrayContaining(["manual_reviews", "account_homologations"]));
  });
});

describe("el catch de ejecutar-calculo no escribe para requests no autorizadas", () => {
  it("JWT válido pero body sin analysis_id → error, 0 escrituras", async () => {
    const r = await req(ejecutar, {});
    expect(r.status).toBe(500);
    expect(writes()).toEqual([]);
  });
});

describe("P12.1 ejecutar-calculo: existencia ANTES de la decisión de acceso (privilegio ≠ existencia)", () => {
  const noSideEffects = () => {
    expect(writes()).toEqual([]);
    expect(m.tables.audit_events).toEqual([]);
    expect(m.tables.analysis_jobs ?? []).toEqual([]);
    expect(m.tables.analyses.map((a) => a.status)).toEqual(["revision_manual_requerida", "revision_manual_requerida"]);
    expect(m.tables.analyses.every((a) => a.calculation_result === null)).toBe(true);
  };
  for (const role of ["user", "admin", "analyst"]) {
    it(`1-3. rol ${role} + análisis inexistente → 404, solo lecturas post-auth, 0 escrituras`, async () => {
      setup(role);
      const r = await req(ejecutar, { analysis_id: "missing" });
      expect(r.status).toBe(404);
      expect(reads()).toEqual(["profiles", "analyses"]);
      noSideEffects();
    });
  }
  it("4. llamada interna confiable + inexistente → 404, 0 escrituras", async () => {
    const r = await req(ejecutar, { analysis_id: "missing" }, { apikey: SECRET });
    expect(r.status).toBe(404);
    expect(reads()).toEqual(["analyses"]);
    noSideEffects();
  });
  it("4b. el 404 de inexistente es indistinguible del 404 de ajeno", async () => {
    const missing = await (await req(ejecutar, { analysis_id: "missing" })).json();
    const foreign = await (await req(ejecutar, { analysis_id: "foreign" })).json();
    expect(missing).toEqual(foreign);
  });
  it("5. ajeno + rol user → 404, 0 escrituras", async () => {
    const r = await req(ejecutar, { analysis_id: "foreign" });
    expect(r.status).toBe(404);
    noSideEffects();
  });
  it("6. ajeno + rol admin → política privilegiada existente: NO 404 por ownership, alcanza la lógica posterior", async () => {
    setup("admin");
    const r = await req(ejecutar, { analysis_id: "foreign" });
    expect(r.status).not.toBe(404);
    expect(r.status).not.toBe(401);
    expect(reads()).toEqual(expect.arrayContaining(["profiles", "analyses", "structured_inputs"]));
  });
  it("7. error técnico real del lookup de analyses → 500 (no 404), 0 escrituras", async () => {
    setup("admin");
    m.selectErrorOnce.set("analyses", { code: "08006", message: "connection failure" });
    const r = await req(ejecutar, { analysis_id: "own" });
    expect(r.status).toBe(500);
    noSideEffects();
    m.selectErrorOnce.set("analyses", { code: "08006", message: "connection failure" });
    expect((await req(ejecutar, { analysis_id: "own" }, { apikey: SECRET })).status).toBe(500);
    noSideEffects();
  });
});

describe("P12.1 continuar-tras-revision: confirmación (sin cambios de código)", () => {
  for (const role of ["admin", "analyst"]) {
    it(`rol ${role} + inexistente → 404, 0 escrituras`, async () => {
      setup(role);
      const r = await req(continuar, { analysis_id: "missing" });
      expect(r.status).toBe(404);
      expect(writes()).toEqual([]);
    });
  }
  it("llamada interna + inexistente → 404, 0 escrituras", async () => {
    const r = await req(continuar, { analysis_id: "missing" }, { apikey: SECRET });
    expect(r.status).toBe(404);
    expect(writes()).toEqual([]);
  });
});
