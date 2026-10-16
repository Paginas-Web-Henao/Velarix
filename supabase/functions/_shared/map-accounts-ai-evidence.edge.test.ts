// @vitest-environment node
// AI classification ≠ Evidence creation. Handler REAL de map-accounts sobre
// una base en memoria; la IA está simulada (respuestas sintéticas de prueba).
// En Evidence versionada la IA solo re-clasifica UNA fila observada con su
// mismo valor; nunca crea filas con cifras propias ni reescribe `value`.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryDb, type MemoryDb, type Row } from "./test-support/memory-db";
import { evaluateAiProposalForUncontextualRows } from "./statement-aware-mapping";

const h = vi.hoisted(() => ({ handlers: [] as ((req: Request) => Promise<Response>)[], db: null as unknown, ai: null as string | null }));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (fn: (req: Request) => Promise<Response>) => { h.handlers.push(fn); } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.49.1", () => ({ createClient: () => h.db }));
vi.mock("./anthropic-client.ts", () => ({ callAnthropic: async () => h.ai }));
(globalThis as unknown as { Deno: unknown }).Deno = {
  env: { get: (k: string) => ({
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: "sb_secret_test_key_0000000000" }),
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: "sb_publishable_test" }),
  } as Record<string, string>)[k] },
};
await import("../map-accounts/index");
const [mapHandler] = h.handlers;

// Filas SIN contexto de estado (rama no contextual de map-accounts).
const RAW = (original_label: string, value: number) => ({ original_label, values: { "2024": value } });
const PARSED = [RAW("Caja y bancos", 50), RAW("Total activos", 900), RAW("Partida X", 10), RAW("Partida Y", 20), RAW("Fila fuente real", 100)];

let m: MemoryDb;
function setup() {
  m = createMemoryDb({
    analyses: [{ id: "a1", user_id: "owner-1", status: "parsing_completado", calculation_result: null, active_evidence_run_id: null }],
    documents: [{ id: "d1", analysis_id: "a1", original_filename: "x.xlsx", processing_status: "completado", doc_type_declared: "estado_resultados" }],
    documents_parsed: [{ id: "p1", document_id: "d1", created_at: "2026-10-16T00:00:00Z", parsed_structure: { rows: PARSED } }],
    evidence_runs: [], account_homologations: [], audit_events: [],
  });
  h.db = m.client;
}
const ai = (mappings: object[]) => { h.ai = JSON.stringify({ mappings }); };
const run = async () => {
  const r = await mapHandler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify({ analysis_id: "a1" }) }));
  expect(r.status, await r.clone().text()).toBe(200);
  return m.tables.audit_events.find((e) => e.event_type === "mapping_end")!.metadata as { ai_classifications_applied: number; ai_proposals_rejected: number; ai_rejected: { code?: string; canonical_account: string; reason: string }[] };
};
const homs = () => m.tables.account_homologations as Row[];
const values = () => homs().map((x) => x.value);
const row = (label: string) => homs().find((x) => x.original_label === label)!;

beforeEach(() => { setup(); h.ai = null; });

describe("map-accounts (rama sin contexto): la IA no crea Evidence numérica", () => {
  it("baseline sin IA: una fila por fila parseada, valores observados", async () => {
    await run();
    expect(homs()).toHaveLength(PARSED.length);
    expect(values().sort((a, b) => Number(a) - Number(b))).toEqual([10, 20, 50, 100, 900]);
    expect(homs().every((x) => x.evidence_run_id)).toBe(true); // siempre versionado
  });

  it("propuesta SIN fila fuente (revenue 2024 = 123456789, varias etiquetas) → no se inserta nada; rechazada con AI_SYNTHETIC_HOMOLOGATION_NOT_ALLOWED", async () => {
    ai([{ canonical_account: "revenue", confidence: 0.95, source_labels: ["Ventas nacionales", "Ventas exportación"], values: { "2024": 123456789 }, nota: "TEST-ONLY sintético" }]);
    const meta = await run();
    expect(homs()).toHaveLength(PARSED.length); // idéntico al baseline
    expect(values()).not.toContain(123456789);
    expect(homs().some((x) => String(x.original_label).includes(" + "))).toBe(false); // sin etiqueta sintética
    expect(meta.ai_classifications_applied).toBe(0);
    expect(meta.ai_proposals_rejected).toBe(1);
    expect(meta.ai_rejected[0]).toMatchObject({ code: "AI_SYNTHETIC_HOMOLOGATION_NOT_ALLOWED", canonical_account: "revenue" });
  });

  it("consolidación A=10 + B=20 que la IA devuelve como 35 → no se crea 35 ni se suma; ningún valor cambia", async () => {
    ai([{ canonical_account: "revenue", confidence: 0.95, source_labels: ["Partida X", "Partida Y"], values: { "2024": 35 } }]);
    const meta = await run();
    expect(homs()).toHaveLength(PARSED.length);
    expect(values()).not.toContain(35);
    expect(values()).not.toContain(30);
    expect([row("Partida X").value, row("Partida Y").value]).toEqual([10, 20]);
    expect([row("Partida X").canonical_account, row("Partida Y").canonical_account]).toEqual(["unclassified", "unclassified"]);
    expect(meta.ai_classifications_applied).toBe(0);
    expect(meta.ai_rejected[0].code).toBe("AI_AMBIGUOUS_SOURCE");
  });

  it("fila fuente real (value 100) con valor IA 999999 → value queda EXACTAMENTE 100 y no se presenta como aplicado", async () => {
    ai([{ canonical_account: "revenue", confidence: 0.95, source_labels: ["Fila fuente real"], values: { "2024": 999999 } }]);
    const meta = await run();
    expect(row("Fila fuente real")).toMatchObject({ value: 100, canonical_account: "unclassified" });
    expect(values()).not.toContain(999999);
    expect(meta.ai_classifications_applied).toBe(0);
    expect(meta.ai_rejected[0]).toMatchObject({ code: "AI_VALUE_MISMATCH" });
  });

  it("sin regresión: la IA re-clasifica una fila fuente compatible con su mismo valor → aplicado, value intacto", async () => {
    ai([{ canonical_account: "revenue", confidence: 0.95, source_labels: ["Fila fuente real"], values: { "2024": 100 }, nota: "clasificación" }]);
    const meta = await run();
    expect(row("Fila fuente real")).toMatchObject({ canonical_account: "revenue", value: 100, confidence_score: "alta" });
    expect(homs()).toHaveLength(PARSED.length);
    expect(meta.ai_classifications_applied).toBe(1);
    expect(meta.ai_proposals_rejected).toBe(0);
  });
});

describe("regla pura", () => {
  const r = (original_label: string, value: number) => ({ original_label, category: "income_statement", period: "2024", value, canonical_account: "unclassified" });
  it("sin fuente → sintético; varias → ambiguo; valor distinto → mismatch; mismo valor y clave única → aceptado", () => {
    expect(evaluateAiProposalForUncontextualRows([], 5)).toMatchObject({ accepted: false, code: "AI_SYNTHETIC_HOMOLOGATION_NOT_ALLOWED" });
    expect(evaluateAiProposalForUncontextualRows([r("a", 1), r("b", 2)], 3)).toMatchObject({ accepted: false, code: "AI_AMBIGUOUS_SOURCE" });
    expect(evaluateAiProposalForUncontextualRows([r("a", 1)], 2)).toMatchObject({ accepted: false, code: "AI_VALUE_MISMATCH" });
    expect(evaluateAiProposalForUncontextualRows([r("a", 1)], 1, [r("a", 1), r("a", 1)])).toMatchObject({ accepted: false, code: "AI_AMBIGUOUS_SOURCE" });
    expect(evaluateAiProposalForUncontextualRows([r("a", 1)], 1)).toEqual({ accepted: true });
  });
});
