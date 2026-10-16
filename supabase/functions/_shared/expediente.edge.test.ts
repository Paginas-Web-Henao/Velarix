// @vitest-environment node
// Write path del Minimum Expediente (LIM-11) con el handler REAL `expediente`
// sobre una base en memoria. Textos de prueba sintéticos.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryDb, type MemoryDb, type Row } from "./test-support/memory-db";
import { evaluateMinimumExpedienteCheckpoint } from "./minimum-expediente-checkpoint";
import { evaluateCalculationReadiness } from "./calculation-readiness";

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
await import("../expediente/index");
const [handler] = h.handlers;

let m: MemoryDb;
function setup(analysis: Row = {}, role = "admin") {
  m = createMemoryDb({
    analyses: [
      { id: "a1", user_id: "owner-1", company_name: "Acme", sector: "industrial", status: "validacion_aprobada", calculation_result: null, active_evidence_run_id: "run-1", ...analysis },
      { id: "a2", user_id: "someone-else", company_name: "Other", sector: "x", calculation_result: null, active_evidence_run_id: null },
    ],
    profiles: [{ id: "owner-1", role }],
    account_homologations: [
      { analysis_id: "a1", canonical_account: "revenue", evidence_run_id: "run-1" },
      { analysis_id: "a1", canonical_account: "old_only_account", evidence_run_id: "run-0" },
    ],
    valuation_files: [], account_notes: [], expedient_questions: [], expedient_answers: [], audit_events: [],
  });
  h.db = m.client;
}
const E = async (body: object) => {
  const r = await handler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify({ analysis_id: "a1", ...body }) }));
  return { status: r.status, body: await r.json() };
};
// Mismos conteos que ejecutar-calculo (valuation_file del caso → notas, preguntas, preguntas con ≥1 respuesta).
function counts(analysisId = "a1") {
  const vf = m.tables.valuation_files.find((v) => v.analysis_id === analysisId);
  if (!vf) return { materialAccountsCount: 0, ambiguitiesCount: 0, treatedAmbiguitiesCount: 0 };
  const qs = m.tables.expedient_questions.filter((q) => q.valuation_file_id === vf.id).map((q) => q.id);
  return {
    materialAccountsCount: m.tables.account_notes.filter((n) => n.valuation_file_id === vf.id).length,
    ambiguitiesCount: qs.length,
    treatedAmbiguitiesCount: new Set(m.tables.expedient_answers.filter((a) => qs.includes(a.question_id)).map((a) => a.question_id)).size,
  };
}
const checkpoint = () => evaluateMinimumExpedienteCheckpoint({ companyName: "Acme", sector: "industrial", ...counts() });

beforeEach(() => setup());

describe("Minimum Expediente — write path", () => {
  it("simulación: 0/0/0 → falta; archivo + nota + pregunta → todavía falta tratamiento; respuesta humana → PASS", async () => {
    expect(checkpoint()).toMatchObject({ passed: false, missing: ["material_account", "ambiguity", "treatment"] });
    expect((await E({ action: "ensure_valuation_file" })).body.data.created).toBe(true);
    expect((await E({ action: "add_account_note", canonical_account: "revenue", interpretation_text: "nota sintética" })).status).toBe(200);
    const q = await E({ action: "add_question", texto: "pregunta sintética", materialidad: "alta" });
    expect(q.status).toBe(200);
    expect(checkpoint()).toMatchObject({ passed: false, missing: ["treatment"] });
    expect((await E({ action: "add_answer", question_id: q.body.data.question_id, respuesta_texto: "respuesta humana sintética" })).status).toBe(200);
    expect(checkpoint()).toMatchObject({ passed: true, missing: [] });
    // Expediente PASS ≠ Calculation READY: sin Judgment sigue NOT_READY, ya sin bloqueos human_review.
    const r = evaluateCalculationReadiness({
      analysis: { moneda_analisis: "USD", validation_status: "aprobado" }, activeAccounts: [], basePeriod: null, resolvedAssumptions: null,
      minimumExpediente: { companyName: "Acme", sector: "industrial", ...counts() }, judgment: { mode: "judgment_set", resolution: { ok: false, issues: [{ category: "JUDGMENT_REQUIRED", code: "NO_ACTIVE_JUDGMENT_SET", key: null, message: "x" }] } },
    });
    expect(r.readiness).toBe("NOT_READY");
    expect(r.blockers.filter((b) => b.area === "human_review")).toEqual([]);
  });

  it("actor: siempre el usuario autenticado; el body no puede fijar actores ni declarar IA", async () => {
    for (const f of ["created_by", "respondido_por", "generado_por", "generado_por_ia"]) {
      expect(await E({ action: "add_question", texto: "x", [f]: f === "generado_por_ia" ? true : "attacker" })).toMatchObject({ status: 400, body: { error: { code: "ACTOR_FIELDS_NOT_ACCEPTED" } } });
    }
    const q = await E({ action: "add_question", texto: "x" });
    await E({ action: "add_account_note", canonical_account: "revenue", interpretation_text: "n" });
    await E({ action: "add_answer", question_id: q.body.data.question_id, respuesta_texto: "r" });
    expect(m.tables.valuation_files[0].created_by).toBe("owner-1");
    expect(m.tables.account_notes[0].created_by).toBe("owner-1");
    expect(m.tables.expedient_questions[0]).toMatchObject({ generado_por: "owner-1", generado_por_ia: false });
    expect(m.tables.expedient_answers[0].respondido_por).toBe("owner-1");
  });

  it("ownership: caso ajeno o inexistente → 404; rol sin permiso → 403", async () => {
    expect((await E({ analysis_id: "a2", action: "ensure_valuation_file" })).status).toBe(404);
    expect((await E({ analysis_id: "nope", action: "ensure_valuation_file" })).status).toBe(404);
    setup({}, "user");
    expect(await E({ action: "ensure_valuation_file" })).toMatchObject({ status: 403, body: { error: { code: "EXPEDIENTE_ROLE_REQUIRED" } } });
    expect(m.tables.valuation_files).toHaveLength(0);
  });

  it("caso con cálculo oficial (p. ej. Alpina) → 409 CASE_ALREADY_CALCULATED; no se escribe nada", async () => {
    setup({ calculation_result: { valuation: {} }, status: "calculo_completo" });
    for (const body of [{ action: "ensure_valuation_file" }, { action: "add_question", texto: "x" }, { action: "add_account_note", canonical_account: "revenue", interpretation_text: "n" }]) {
      expect(await E(body)).toMatchObject({ status: 409, body: { error: { code: "CASE_ALREADY_CALCULATED" } } });
    }
    expect([m.tables.valuation_files, m.tables.expedient_questions, m.tables.account_notes, m.tables.audit_events].every((t) => t.length === 0)).toBe(true);
  });

  it("append-only e historial: dos notas / dos respuestas = dos filas; nada se actualiza ni borra", async () => {
    await E({ action: "add_account_note", canonical_account: "revenue", interpretation_text: "v1" });
    await E({ action: "add_account_note", canonical_account: "revenue", interpretation_text: "v2 (corrección = fila nueva)" });
    const q = await E({ action: "add_question", texto: "x" });
    await E({ action: "add_answer", question_id: q.body.data.question_id, respuesta_texto: "r1" });
    await E({ action: "add_answer", question_id: q.body.data.question_id, respuesta_texto: "r2" });
    expect(m.tables.account_notes.map((n) => n.interpretation_text)).toEqual(["v1", "v2 (corrección = fila nueva)"]);
    expect(m.tables.expedient_answers.map((a) => a.respuesta_texto)).toEqual(["r1", "r2"]);
    expect(m.tables.expedient_questions[0].estado).toBeUndefined(); // estado no se reescribe (default de la base)
    expect(m.tables.valuation_files).toHaveLength(1); // ensure idempotente
    expect(counts().treatedAmbiguitiesCount).toBe(1);
  });

  it("integridad: nota de cuenta fuera del Evidence activo → 400; respuesta a pregunta de otro caso → 404", async () => {
    expect(await E({ action: "add_account_note", canonical_account: "old_only_account", interpretation_text: "n" })).toMatchObject({ status: 400, body: { error: { code: "CANONICAL_ACCOUNT_NOT_IN_ACTIVE_EVIDENCE" } } });
    m.tables.valuation_files.push({ id: "vf-other", analysis_id: "a2", created_by: "someone-else" });
    m.tables.expedient_questions.push({ id: "q-other", valuation_file_id: "vf-other", texto: "ajena" });
    await E({ action: "ensure_valuation_file" });
    expect((await E({ action: "add_answer", question_id: "q-other", respuesta_texto: "r" })).status).toBe(404);
    expect(m.tables.expedient_answers).toHaveLength(0);
    expect(await E({ action: "add_question", texto: "  " })).toMatchObject({ status: 400, body: { error: { code: "QUESTION_TEXT_REQUIRED" } } });
    expect(await E({ action: "add_question", texto: "x", materialidad: "enorme" })).toMatchObject({ status: 400 });
  });

  it("audit: un evento por acción, con ids y cuenta, sin copiar el texto", async () => {
    await E({ action: "add_account_note", canonical_account: "revenue", interpretation_text: "TEXTO-SENSIBLE-NOTA" });
    const q = await E({ action: "add_question", texto: "TEXTO-SENSIBLE-PREGUNTA" });
    await E({ action: "add_answer", question_id: q.body.data.question_id, respuesta_texto: "TEXTO-SENSIBLE-RESPUESTA" });
    await E({ action: "ensure_valuation_file" }); // ya existe: sin evento duplicado
    expect(m.tables.audit_events.map((e) => e.event_type)).toEqual(["valuation_file_created", "account_note_added", "expedient_question_added", "expedient_answer_added"]);
    expect(JSON.stringify(m.tables.audit_events)).not.toMatch(/TEXTO-SENSIBLE/);
    expect(m.tables.audit_events[1].metadata).toMatchObject({ canonical_account: "revenue", valuation_file_id: m.tables.valuation_files[0].id });
    expect(m.tables.audit_events[3].metadata).toMatchObject({ question_id: q.body.data.question_id });
    expect(m.tables.audit_events.every((e) => e.user_id === "owner-1" && e.component === "expediente")).toBe(true);
  });
});
