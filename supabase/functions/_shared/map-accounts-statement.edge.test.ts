// @vitest-environment node
// Código REAL de map-accounts (index.ts) con dobles de serve, supabase-js y
// la IA (anthropic-client). Comprueba que la homologación usa el contexto de
// estado del parser: sin duplicados operacionales entre estados, unidades no
// monetarias fuera, y la IA solo clasifica (no cambia valores ni resuelve
// conflictos determinísticos). Las filas legacy conservan el comportamiento.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { writesTo, type FakeState } from "./test-support/fake-supabase";

const h = vi.hoisted(() => ({ handlers: [] as ((req: Request) => Promise<Response>)[], fake: null as unknown, ai: null as string | null }));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (fn: (req: Request) => Promise<Response>) => { h.handlers.push(fn); } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.49.1", () => ({ createClient: () => h.fake }));
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

type Row = Record<string, unknown>;
const ctx = (original_label: string, values: Record<string, number>, statement: string, source_section: string | null, unit = "monetaria") =>
  ({ original_label, values, statement, source_section, unit, source_sheet: `${statement} sheet`, source_label: original_label });

const SEC_ROWS: Row[] = [
  ctx("Total operating revenues", { "2024": 5000 }, "income_statement", "Operating revenues:"),
  ctx("Net income", { "2024": 600 }, "income_statement", "Operating expenses:"),
  ctx("Basic income per share", { "2024": 1.25 }, "income_statement", "Operating expenses:", "por_accion"),
  ctx("Basic weighted average common shares outstanding", { "2024": 480000 }, "income_statement", "Operating expenses:", "acciones"),
  ctx("Cash and cash equivalents", { "2024": 1200 }, "balance_sheet", "Current assets:"),
  ctx("Short-term deposits", { "2024": 50 }, "balance_sheet", "Current assets:"),
  ctx("Deferred income taxes", { "2024": 285 }, "balance_sheet", "Long-term assets:"),
  ctx("Deferred income taxes", { "2024": 11419 }, "balance_sheet", "Long-term liabilities:"),
  ctx("Total assets", { "2024": 9000 }, "balance_sheet", "Long-term assets:"),
  ctx("Net income", { "2024": 600 }, "cash_flow", "CASH FLOWS FROM OPERATING ACTIVITIES"),
  ctx("Cash Provided By Operating Activities", { "2024": 700 }, "cash_flow", "CASH FLOWS FROM OPERATING ACTIVITIES"),
];

let state: FakeState & { parsedRows: Row[] };

function fake(s: typeof state) {
  const exec = (table: string, op: string, payload: unknown, filters: Record<string, unknown>, single: boolean) => {
    if (op !== "select") s.writes.push({ table, op: op as "insert", payload, filters });
    if (table === "analyses" && op === "select") return { data: s.analysis, error: null };
    if (table === "analyses" && op === "update") { Object.assign(s.analysis!, payload as object); return { data: null, error: null }; }
    if (table === "documents" && op === "select") return { data: [{ id: "d1", doc_type_declared: "estados_financieros" }], error: null };
    if (table === "documents_parsed" && op === "select") return { data: [{ id: "p1", document_id: "d1", created_at: "2026-10-16T00:00:00Z", parsed_structure: { rows: s.parsedRows } }], error: null };
    return { data: single ? null : [], error: null };
  };
  const from = (table: string) => {
    const q = { op: "select", payload: undefined as unknown, filters: {} as Record<string, unknown> };
    const chain: Record<string, unknown> = {
      select: () => chain, is: () => chain, order: () => chain, limit: () => chain, in: () => chain,
      eq: (k: string, v: unknown) => { q.filters[k] = v; return chain; },
      insert: (p: unknown) => { q.op = "insert"; q.payload = p; return chain; },
      update: (p: unknown) => { q.op = "update"; q.payload = p; return chain; },
      delete: () => { q.op = "delete"; return chain; },
      single: () => Promise.resolve(exec(table, q.op, q.payload, q.filters, true)),
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(exec(table, q.op, q.payload, q.filters, false)).then(res, rej),
    };
    return chain;
  };
  return { from, auth: { getUser: async () => ({ data: { user: { id: "owner-1" } }, error: null }) } };
}

function setup(parsedRows: Row[], analysis: Row = {}) {
  state = { analysis: { id: "a1", user_id: "owner-1", status: "parsing_completado", calculation_result: null, ...analysis }, documents: [], writes: [], storageUploads: [], parsedRows };
  h.fake = fake(state);
}

beforeEach(() => { h.ai = null; });

const call = () => mapHandler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify({ analysis_id: "a1" }) }));
type Hom = { original_label: string; canonical_account: string; category: string; period: string | null; value: number | null; mapping_notes: string };
const inserted = () => writesTo(state, "account_homologations", "insert").flatMap((w) => (Array.isArray(w.payload) ? w.payload : [w.payload])) as Hom[];
const operational = (canonical: string, period: string) => inserted().filter((r) => r.canonical_account === canonical && r.period === period);

describe("map-accounts con contexto de estado", () => {
  it("una sola homologación operacional por cuenta+período; la fila del flujo de caja queda abierta con lineage", async () => {
    setup(SEC_ROWS);
    expect((await call()).status).toBe(200);
    expect(operational("net_income", "2024")).toEqual([expect.objectContaining({ category: "income_statement", value: 600 })]);
    expect(operational("cash", "2024")).toEqual([expect.objectContaining({ original_label: "Cash and cash equivalents", value: 1200 })]);
    const cfNet = inserted().find((r) => r.original_label === "Net income" && r.category === "cash_flow")!;
    expect(cfNet).toMatchObject({ canonical_account: "unclassified", value: 600 });
    expect(cfNet.mapping_notes).toMatch(/STATEMENT_INCOMPATIBLE/);
  });

  it("EPS y acciones no entran en cuentas monetarias; impuestos diferidos activo/pasivo quedan separados y abiertos", async () => {
    setup(SEC_ROWS);
    await call();
    for (const l of ["Basic income per share", "Basic weighted average common shares outstanding"]) {
      expect(inserted().find((r) => r.original_label === l)).toMatchObject({ canonical_account: "unclassified" });
    }
    expect(inserted().filter((r) => r.original_label === "Deferred income taxes").map((r) => [r.canonical_account, r.value])).toEqual([["unclassified", 285], ["unclassified", 11419]]);
  });

  it("la IA no resuelve conflictos determinísticos, no crea filas con cifras propias y no cambia valores", async () => {
    setup(SEC_ROWS);
    h.ai = JSON.stringify({ mappings: [
      { canonical_account: "net_income", values: { "2024": 600 }, confidence: 0.95, source_labels: ["Net income"] },
      { canonical_account: "opex", values: { "2024": 999 }, confidence: 0.95, nota: "Suma inventada", source_labels: ["Selling", "G&A"] },
      { canonical_account: "taxes", values: { "2024": 285 }, confidence: 0.95, source_labels: ["Deferred income taxes"] },
      { canonical_account: "cash", values: { "2024": 55 }, confidence: 0.95, source_labels: ["Short-term deposits"] },
    ] });
    await call();
    expect(writesTo(state, "account_homologations", "update")).toEqual([]);
    expect(writesTo(state, "account_homologations", "insert")).toHaveLength(1); // solo el PASS 1, sin inserts de IA
    const audit = writesTo(state, "audit_events", "insert").at(-1)!.payload as { metadata: { ai_rejected: { canonical_account: string }[]; rejected_by_rule: Record<string, number> } };
    // net_income 2024 ya tiene homologación determinística "alta" (estado de resultados): la regla previa
    // la salta antes de llegar aquí. Las otras tres se rechazan con motivo.
    expect(audit.metadata.ai_rejected.map((r) => r.canonical_account)).toEqual(["opex", "taxes", "cash"]);
    expect(operational("net_income", "2024")).toEqual([expect.objectContaining({ category: "income_statement", value: 600 })]);
    expect(audit.metadata.rejected_by_rule).toMatchObject({ STATEMENT_INCOMPATIBLE: 2, UNIT_NOT_MONETARY: 2 });
  });

  it("la IA sí puede clasificar una fila compatible sin match, conservando su valor", async () => {
    setup(SEC_ROWS);
    h.ai = JSON.stringify({ mappings: [{ canonical_account: "cash", values: { "2024": 50 }, confidence: 0.95, source_labels: ["Short-term deposits"] }] });
    await call();
    const [u] = writesTo(state, "account_homologations", "update");
    expect(u.payload).not.toHaveProperty("value");
    expect(u.payload).toMatchObject({ canonical_account: "cash" });
    expect(u.filters).toMatchObject({ original_label: "Short-term deposits", category: "balance_sheet", period: "2024" });
  });
});

describe("map-accounts legacy (sin contexto) y casos protegidos", () => {
  it("filas legacy: mismo resultado que la regla previa, incluida la consolidación de la IA", async () => {
    setup([{ original_label: "Ventas netas", values: { "2024": 100 } }, { original_label: "Bancos", values: { "2024": 10 } }, { original_label: "Gastos raros", values: { "2024": 7 } }]);
    h.ai = JSON.stringify({ mappings: [{ canonical_account: "opex", values: { "2024": 7 }, confidence: 0.95, source_labels: ["Gastos raros"] }] });
    await call();
    expect(inserted().map((r) => [r.original_label, r.canonical_account, r.category, r.value])).toEqual([
      ["Ventas netas", "revenue", "income_statement", 100], ["Bancos", "cash", "balance_sheet", 10], ["Gastos raros", "unclassified", "balance_sheet", 7],
    ]);
    expect(writesTo(state, "account_homologations", "update")[0].payload).toMatchObject({ canonical_account: "opex", value: 7 });
    const audit = writesTo(state, "audit_events", "insert").at(-1)!.payload as { metadata: Record<string, unknown> };
    expect(audit.metadata).not.toHaveProperty("statement_context");
  });

  it("CASE_ALREADY_CALCULATED sigue protegido: 409 y ninguna homologación", async () => {
    setup(SEC_ROWS, { status: "calculo_completo", calculation_result: { version: { input_fingerprint: "x" } } });
    const resp = await call();
    expect(resp.status).toBe(409);
    expect(writesTo(state, "account_homologations")).toEqual([]);
  });
});
