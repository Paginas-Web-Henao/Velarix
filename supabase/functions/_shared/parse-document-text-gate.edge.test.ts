// @vitest-environment node
// Código REAL de parse-document (index.ts) con dobles de serve, supabase-js,
// xlsx y Deno; `fetch` espía cada llamada a la IA (OpenAI Responses).
// Regla: sin texto legible extraído → DOCUMENT_TEXT_UNAVAILABLE, la IA NO se
// llama y no se crea documents_parsed (nunca cifras inventadas).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeState, createFakeSupabase, writesTo, type FakeState } from "./test-support/fake-supabase";
import { SYSTEM_PARSER_FALLBACK } from "./parse-document-prompts";

const h = vi.hoisted(() => ({ handlers: [] as ((req: Request) => Promise<Response>)[], fake: null as unknown }));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (fn: (req: Request) => Promise<Response>) => { h.handlers.push(fn); } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.49.1", () => ({ createClient: () => h.fake }));
vi.mock("https://esm.sh/xlsx@0.18.5", () => ({ read: vi.fn(), utils: {} }));

(globalThis as unknown as { Deno: unknown }).Deno = {
  env: {
    get: (k: string) => ({
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SECRET_KEYS: JSON.stringify({ default: "sb_secret_test_key_0000000000" }),
      SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: "sb_publishable_test" }),
      PARSE_AI_PROVIDER: "openai",
      OPENAI_API_KEY: "test-openai-key",
      OPENAI_PARSE_MODEL: "test-model",
    } as Record<string, string>)[k],
  },
};

await import("../parse-document/index");
const [parseHandler] = h.handlers;

const enc = (s: string) => new TextEncoder().encode(s);
const latin1 = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff);

// PDF con streams comprimidos/cifrados: el extractor no encuentra BT…ET (0 caracteres).
const PDF_SIN_TEXTO = latin1("%PDF-1.4\n1 0 obj << /Filter /FlateDecode /Length 400 >> stream\n" + Array.from({ length: 400 }, (_, i) => String.fromCharCode((i * 73 + 11) % 256)).join("") + "\nendstream endobj\n%%EOF");
const PDF_TEXTO_CORTO = latin1("%PDF-1.4\nBT (Ventas 1.000) Tj ET\n%%EOF");
const PDF_SIMBOLOS = latin1(`%PDF-1.4\nBT (${"#$%&*@!~^<>{}[]|/".repeat(20)}) Tj ET\n%%EOF`);
const PDF_CONTROLES = latin1(`%PDF-1.4\nBT (${"Ingresos \x01\x02\x03\x04 ".repeat(30)}) Tj ET\n%%EOF`);
const CSV_VALIDO = enc("Cuenta,2024,2023\nIngresos operacionales,1000000,900000\nCosto de ventas,600000,550000\nGastos operativos,200000,180000\n");
const CSV_PROSA = enc([
  "Informe de gestión de la compañía",
  "La compañía presenta sus estados financieros consolidados bajo NIIF en esta nota",
  "Las ventas del período crecieron frente al año anterior por mayor volumen en el mercado local",
  "El margen bruto se mantuvo estable y los gastos administrativos se controlaron durante el ejercicio",
  "La administración no espera cambios materiales en la estructura de capital",
].join("\n") + "\n");

let state: FakeState;
let file: Uint8Array;
let aiCalls: { instructions: string; input: string }[];

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
      chain.single = () => (isSelect ? Promise.resolve({ data: { id: "d1", analysis_id: "a1", storage_path: "owner-1/a1/doc", original_filename: s.documents[0]?.original_filename, mime_type: s.documents[0]?.mime_type, doc_type_declared: "estados_financieros" }, error: null }) : single());
      return chain;
    },
    storage: { from: () => ({ download: async () => ({ data: new Blob([file]), error: null }) }) },
  };
}

function setup(bytes: Uint8Array, filename: string, mime: string, analysis: Record<string, unknown> = {}) {
  file = bytes;
  state = createFakeState({ id: "a1", user_id: "owner-1", status: "documentos_cargados", calculation_result: null, ...analysis }, [{ id: "d1", original_filename: filename, mime_type: mime }]);
  h.fake = fake(state);
}

beforeEach(() => {
  aiCalls = [];
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    aiCalls.push({ instructions: body.instructions, input: body.input });
    const text = body.instructions === SYSTEM_PARSER_FALLBACK
      ? JSON.stringify({ column_headers: ["2024"], rows: [{ original_label: "Ventas", values: { col_1: 1 } }, { original_label: "Costos", values: { col_1: 2 } }, { original_label: "Utilidad", values: { col_1: 3 } }] })
      : JSON.stringify({ tipo_documento: "estado_resultados", periodos: [{ etiqueta: "2024" }] });
    return new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text }] }] }), { status: 200 });
  }));
});

const call = () => parseHandler(new Request("http://localhost/fn", { method: "POST", headers: { Authorization: "Bearer tok" }, body: JSON.stringify({ analysis_id: "a1", document_id: "d1" }) }));

async function expectFailClosed(reason: string) {
  const resp = await call();
  expect(resp.status).toBe(400);
  expect((await resp.json()).error.code).toBe("DOCUMENT_TEXT_UNAVAILABLE");
  expect(aiCalls).toEqual([]); // la IA NO se llama
  expect(writesTo(state, "documents_parsed")).toEqual([]); // nunca cifras inventadas
  expect(writesTo(state, "documents", "update").at(-1)?.payload).toEqual({ processing_status: "fallido" });
  const audit = writesTo(state, "audit_events", "insert").map((w) => w.payload as { event_type: string; metadata: Record<string, unknown> });
  expect(audit).toHaveLength(1);
  expect(audit[0]).toMatchObject({ event_type: "parse_failed", metadata: { code: "DOCUMENT_TEXT_UNAVAILABLE", reason, formato: "pdf", ai_called: false } });
  expect(state.analysis!.status).not.toBe("parsing_completado");
}

describe("parse-document — fail-closed sin texto legible", () => {
  it("PDF con 0 texto extraído (streams comprimidos/cifrados) → DOCUMENT_TEXT_UNAVAILABLE, sin IA", async () => {
    setup(PDF_SIN_TEXTO, "10-K.pdf", "application/pdf");
    await expectFailClosed("EMPTY");
  });

  it("PDF con texto insuficiente → sin IA", async () => {
    setup(PDF_TEXTO_CORTO, "corto.pdf", "application/pdf");
    await expectFailClosed("TOO_SHORT");
  });

  it("PDF con texto no fiable (símbolos) → sin IA", async () => {
    setup(PDF_SIMBOLOS, "simbolos.pdf", "application/pdf");
    await expectFailClosed("LOW_QUALITY");
  });

  it("PDF con texto lleno de caracteres de control → sin IA", async () => {
    setup(PDF_CONTROLES, "controles.pdf", "application/pdf");
    await expectFailClosed("BINARY_CONTENT");
  });
});

describe("parse-document — las rutas estructuradas conservan su comportamiento", () => {
  it("CSV válido: filas determinísticas del archivo, sin fallback de IA", async () => {
    setup(CSV_VALIDO, "eeff.csv", "text/csv");
    const resp = await call();
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.data).toMatchObject({ formato: "csv", ai_fallback_used: false, rows_with_values: 6 });
    expect(aiCalls.some((c) => c.instructions === SYSTEM_PARSER_FALLBACK)).toBe(false);
    const parsed = writesTo(state, "documents_parsed", "insert")[0].payload as { parsed_structure: { rows: { original_label: string; values: Record<string, number> }[] } };
    const ingresos = parsed.parsed_structure.rows.filter((r) => /ingresos/i.test(r.original_label)).map((r) => r.values);
    expect(ingresos).toEqual([{ "2024": 1000000 }, { "2023": 900000 }]);
    expect(state.analysis!.status).toBe("parsing_completado");
  });

  it("texto realmente extraído y legible sí puede ir al fallback — como texto, nunca como bytes", async () => {
    setup(CSV_PROSA, "informe.csv", "text/csv");
    await call();
    const fallback = aiCalls.find((c) => c.instructions === SYSTEM_PARSER_FALLBACK);
    expect(fallback).toBeDefined();
    expect(fallback!.input).toMatch(/estados financieros consolidados/i);
    expect([...fallback!.input].some((c) => c.charCodeAt(0) < 0x09 || c === "�")).toBe(false);
  });

  it("un caso calculado sigue protegido: 409 CASE_ALREADY_CALCULATED antes de leer el documento", async () => {
    setup(PDF_SIN_TEXTO, "10-K.pdf", "application/pdf", { status: "calculo_completo", calculation_result: { version: { input_fingerprint: "x" } } });
    const resp = await call();
    expect(resp.status).toBe(409);
    expect((await resp.json()).error.code).toBe("CASE_ALREADY_CALCULATED");
    expect(aiCalls).toEqual([]);
    expect(state.writes.map((w) => w.table)).toEqual(["audit_events"]);
  });
});
