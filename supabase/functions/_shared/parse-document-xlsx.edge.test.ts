// @vitest-environment node
// Código REAL de parse-document (index.ts) sobre libros XLSX en memoria (doble
// mínimo de la librería xlsx: read + decode_range/encode_cell). `fetch` espía
// la IA. Comprueba: escala declarada (valores crudos + factor_escala), libro
// con varios estados, períodos anuales determinísticos y que la ruta clásica
// sin escala declarada conserva su comportamiento.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeState, createFakeSupabase, writesTo, type FakeState } from "./test-support/fake-supabase";
import { SYSTEM_PARSER_FALLBACK } from "./parse-document-prompts";

type Cell = string | number | null;
type Sheet = { name: string; rows: Cell[][]; merges?: { s: { r: number; c: number }; e: { r: number; c: number } }[] };

const h = vi.hoisted(() => {
  const col = (c: number) => { let s = ""; c++; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
  const encode_cell = ({ r, c }: { r: number; c: number }) => `${col(c)}${r + 1}`;
  const decodeCell = (a: string) => { const m = /^([A-Z]+)(\d+)$/.exec(a)!; let c = 0; for (const ch of m[1]) c = c * 26 + (ch.charCodeAt(0) - 64); return { r: Number(m[2]) - 1, c: c - 1 }; };
  const decode_range = (ref: string) => { const [a, b] = ref.split(":"); return { s: decodeCell(a), e: decodeCell(b ?? a) }; };
  return { handlers: [] as ((req: Request) => Promise<Response>)[], fake: null as unknown, wb: null as unknown, encode_cell, decode_range };
});
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (fn: (req: Request) => Promise<Response>) => { h.handlers.push(fn); } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.49.1", () => ({ createClient: () => h.fake }));
vi.mock("https://esm.sh/xlsx@0.18.5", () => ({ read: () => h.wb, utils: { encode_cell: h.encode_cell, decode_range: h.decode_range } }));

(globalThis as unknown as { Deno: unknown }).Deno = {
  env: { get: (k: string) => ({
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: "sb_secret_test_key_0000000000" }),
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: "sb_publishable_test" }),
    PARSE_AI_PROVIDER: "openai", OPENAI_API_KEY: "test-openai-key", OPENAI_PARSE_MODEL: "test-model",
  } as Record<string, string>)[k] },
};

await import("../parse-document/index");
const [parseHandler] = h.handlers;

function workbook(sheets: Sheet[]) {
  const Sheets: Record<string, Record<string, unknown>> = {};
  for (const s of sheets) {
    const ws: Record<string, unknown> = {};
    const width = Math.max(...s.rows.map((r) => r.length));
    s.rows.forEach((row, r) => row.forEach((v, c) => { if (v !== null) ws[h.encode_cell({ r, c })] = { v }; }));
    ws["!ref"] = `A1:${h.encode_cell({ r: s.rows.length - 1, c: width - 1 })}`;
    if (s.merges) ws["!merges"] = s.merges;
    Sheets[s.name] = ws;
  }
  return { SheetNames: sheets.map((s) => s.name), Sheets };
}

const M = (r0: number, c0: number, r1: number, c1: number) => ({ s: { r: r0, c: c0 }, e: { r: r1, c: c1 } });
const SEC_LIKE: Sheet[] = [
  { name: "Cover", rows: [["Cover - USD ($)", "12 Months Ended"], [null, "Dec. 31, 2024"], ["Document Type", "10-K"]] },
  { name: "Consolidated Balance Sheets", rows: [
    ["Consolidated Balance Sheets - USD ($) $ in Thousands", "Dec. 31, 2024", "Dec. 31, 2023"],
    ["Cash and cash equivalents", 1200, 1100], ["Inventories", 900, 950], ["Total assets", 9000, 8500], ["Total liabilities", 4000, 3900],
  ] },
  { name: "Consolidated Balance Sheets (Pa", rows: [["Consolidated Balance Sheets (Parenthetical) - $ / shares", "Dec. 31, 2024"], ["Par value", 0.0001]] },
  { name: "Consolidated Statements of Oper", merges: [M(0, 1, 0, 3)], rows: [
    ["Consolidated Statements of Operations - USD ($) $ in Thousands", "12 Months Ended", null, null],
    [null, "Dec. 31, 2024", "Dec. 31, 2023", "Dec. 31, 2022"],
    ["Total operating revenues", 5000, 4500, 4000], ["Cost of sales", 3000, 2700, 2400], ["Net income", 600, 550, 500],
  ] },
  { name: "Consolidated Statements of Cash", merges: [M(0, 1, 0, 3)], rows: [
    ["Consolidated Statements of Cash Flows - USD ($) $ in Thousands", "12 Months Ended", null, null],
    [null, "Dec. 31, 2024", "Dec. 31, 2023", "Dec. 31, 2022"],
    ["Net cash provided by operating activities", 700, 650, 600], ["Acquisition of property and equipment", -300, -280, -250],
  ] },
  { name: "Schedule of Inventories (Detail", rows: [["Schedule of Inventories (Details) - USD ($) $ in Thousands", "Dec. 31, 2024"], ["Raw materials", 10]] },
];

let state: FakeState;
let aiCalls: { instructions: string }[];

function fake(s: FakeState) {
  const base = createFakeSupabase(s);
  return {
    ...base,
    from: (table: string) => {
      const chain = base.from(table) as Record<string, (...a: unknown[]) => unknown>;
      if (table !== "documents") return chain;
      let isSelect = true;
      const update = chain.update;
      chain.update = (p: unknown) => { isSelect = false; return update(p); };
      const single = chain.single;
      chain.single = () => (isSelect ? Promise.resolve({ data: { id: "d1", analysis_id: "a1", storage_path: "p", original_filename: "Financial_Report.xlsx", mime_type: null, doc_type_declared: "estados_financieros" }, error: null }) : single());
      return chain;
    },
    storage: { from: () => ({ download: async () => ({ data: new Blob([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0])]), error: null }) }) },
  };
}

beforeEach(() => {
  aiCalls = [];
  state = createFakeState({ id: "a1", user_id: "owner-1", status: "documentos_cargados", calculation_result: null });
  h.fake = fake(state);
  vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    aiCalls.push({ instructions: body.instructions });
    // La IA "detecta" un período espurio: nunca debe convertirse en Evidence si la extracción ya lo resolvió.
    const text = JSON.stringify({ tipo_documento: "mixto", periodos: [{ etiqueta: "2019" }] });
    return new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text }] }] }), { status: 200 });
  }));
});

const call = () => parseHandler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify({ analysis_id: "a1", document_id: "d1" }) }));
const parsedInsert = () => writesTo(state, "documents_parsed", "insert")[0]?.payload as {
  parsed_structure: { rows: { original_label: string; values: Record<string, number>; source_sheet?: string; statement?: string; unit?: string }[]; column_headers: string[] };
  periods_detected: string[] | null;
  parsing_metadata: Record<string, unknown> & { hojas_seleccionadas?: { sheet: string; category: string }[] };
};
const auditMeta = () => (writesTo(state, "audit_events", "insert").at(-1)!.payload as { metadata: Record<string, unknown> }).metadata;
const valuesOf = (label: string) => parsedInsert().parsed_structure.rows.filter((r) => r.original_label === label).map((r) => r.values);

describe("parse-document — libro SEC con varios estados y escala declarada", () => {
  it("procesa balance + resultados + flujo de caja; ignora Parenthetical/Details/Cover", async () => {
    h.wb = workbook(SEC_LIKE);
    const resp = await call();
    expect(resp.status).toBe(200);
    const p = parsedInsert();
    expect(p.parsing_metadata.hojas_seleccionadas!.map((s) => [s.sheet, s.category])).toEqual([
      ["Consolidated Balance Sheets", "balance_sheet"], ["Consolidated Statements of Oper", "income_statement"], ["Consolidated Statements of Cash", "cash_flow"],
    ]);
    const sheets = new Set(p.parsed_structure.rows.map((r) => r.source_sheet));
    expect(sheets).toEqual(new Set(["Consolidated Balance Sheets", "Consolidated Statements of Oper", "Consolidated Statements of Cash"]));
    expect(p.parsed_structure.rows.some((r) => r.original_label === "Raw materials" || r.original_label === "Par value")).toBe(false);
  });

  it("'$ in Thousands' → valores CRUDOS + factor_escala 1000 (DECLARED); nunca ×1.000.000 por magnitud", async () => {
    h.wb = workbook(SEC_LIKE);
    await call();
    expect(valuesOf("Cash and cash equivalents")).toEqual([{ "2024": 1200 }, { "2023": 1100 }]);
    expect(valuesOf("Total assets")).toEqual([{ "2024": 9000 }, { "2023": 8500 }]);
    expect(parsedInsert().parsing_metadata).toMatchObject({ factor_escala: 1000, escala_documento: "thousands", escala_origen: "DECLARED", escala_texto: "$ in Thousands", valores: "crudos_sin_escalar", moneda_documento: "USD" });
    // Lo que lee build-structured-input (audit parse_complete): la escala se aplica allí, una sola vez.
    expect(auditMeta()).toMatchObject({ factor_escala: 1000, escala_origen: "DECLARED", moneda_documento: "USD" });
  });

  it("períodos determinísticos 2024/2023/2022; la IA no agrega períodos a la Evidence", async () => {
    h.wb = workbook(SEC_LIKE);
    await call();
    const p = parsedInsert();
    expect(p.periods_detected).toEqual(["2022", "2023", "2024"]);
    expect(p.parsed_structure.column_headers).toEqual(["2024", "2023", "2022"]);
    expect(valuesOf("Net income")).toEqual([{ "2024": 600 }, { "2023": 550 }, { "2022": 500 }]);
    expect(p.periods_detected).not.toContain("2019");
  });

  it("tipo documental: libro multi-estado → estados_financieros aunque la IA diga otra cosa (origen determinístico)", async () => {
    h.wb = workbook(SEC_LIKE); // la IA de este test responde tipo_documento "mixto"
    await call();
    expect(writesTo(state, "documents", "update").at(-1)!.payload).toMatchObject({ processing_status: "completado", doc_type_declared: "estados_financieros" });
    expect(parsedInsert().parsing_metadata).toMatchObject({ doc_type_efectivo: "estados_financieros", doc_type_origen: "DETERMINISTIC_WORKBOOK" });
    expect(auditMeta()).toMatchObject({ doc_type: "estados_financieros", doc_type_origen: "DETERMINISTIC_WORKBOOK" });
  });

  it("extracción determinística: sin fallback de IA", async () => {
    h.wb = workbook(SEC_LIKE);
    const body = await (await call()).json();
    expect(body.data.ai_fallback_used).toBe(false);
    expect(aiCalls.some((c) => c.instructions === SYSTEM_PARSER_FALLBACK)).toBe(false);
  });

  it("escalas declaradas incompatibles entre estados → 400 XLSX_DECLARED_SCALE_CONFLICT, sin IA ni documents_parsed", async () => {
    const conflict = SEC_LIKE.map((s) => (s.name === "Consolidated Statements of Cash" ? { ...s, rows: [["Consolidated Statements of Cash Flows - USD ($) $ in Millions", "12 Months Ended", null, null], ...s.rows.slice(1)] } : s));
    h.wb = workbook(conflict);
    const resp = await call();
    expect(resp.status).toBe(400);
    expect((await resp.json()).error.code).toBe("XLSX_DECLARED_SCALE_CONFLICT");
    expect(aiCalls).toEqual([]);
    expect(writesTo(state, "documents_parsed")).toEqual([]);
  });
});

describe("parse-document — ruta clásica de una hoja", () => {
  it("escala declarada '$ in Millions' en la cabecera → factor 1.000.000 y valores crudos", async () => {
    h.wb = workbook([{ name: "Income", rows: [["Income statement - USD ($) $ in Millions", "2024", "2023"], ["Revenue", 50, 45], ["Cost of sales", 30, 28], ["Net income", 6, 5]] }]);
    await call();
    expect(valuesOf("Revenue")).toEqual([{ "2024": 50 }, { "2023": 45 }]);
    expect(parsedInsert().parsing_metadata).toMatchObject({ factor_escala: 1_000_000, escala_origen: "DECLARED", escala_documento: "millions" });
  });

  it("sin escala declarada conserva la inferencia por magnitud existente (comportamiento previo)", async () => {
    h.wb = workbook([{ name: "Income", rows: [["Estado de resultados", "2024", "2023"], ["Ingresos", 50, 45], ["Costo de ventas", 30, 28], ["Utilidad neta", 6, 5]] }]);
    await call();
    // Mediana 30 → la inferencia previa elige "miles de millones" (×1e9). Se fija tal cual: esta fase no la cambia.
    expect(valuesOf("Ingresos")).toEqual([{ "2024": 50_000_000_000 }, { "2023": 45_000_000_000 }]);
    expect(parsedInsert().parsing_metadata).toMatchObject({ factor_escala: 1_000_000_000 });
  });
});
