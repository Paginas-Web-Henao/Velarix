// Terra como ÚNICO proveedor productivo de parse-document — ver
// ../_shared/parse-document-ai-provider.ts para el diseño completo.
//
// CORRECCIÓN (fix: scope Terra provider to parse-document): fc88c11
// permitía PARSE_AI_PROVIDER=anthropic y lo enrutaba a callAnthropic()
// (modelo hardcodeado claude-opus-4-8 — NO Sonnet 5 low, el modelo
// realmente evaluado en el benchmark). Se corrigió acotando el soporte
// productivo a "openai" únicamente; "anthropic" ahora falla cerrado como
// cualquier otro valor no soportado. Ver D-11
// (docs/velarix/plan/REGISTRO-DE-DECISIONES.md).
//
// Sin red real: resolveParseAiConfig() es puro (sin fetch), y
// callOpenAiParse() se prueba mockeando `fetch` (nunca se llama a
// api.openai.com). No se puede importar parse-document/index.ts en
// Vitest (bloqueado por sus imports de URL de Deno) — por eso el caso 10
// (los 3 prompts productivos permanecen sin cambios) se verifica con el
// test de fidelidad byte-for-byte ya existente en
// scripts/benchmark-ai/runner.test.ts + inspección directa del diff de
// parse-document/index.ts (los 3 call sites siguen usando literalmente
// SYSTEM_PARSER_FALLBACK/SYSTEM_CLASSIFIER/SYSTEM_PERIOD_DETECTOR, solo
// cambió el nombre de la función que los recibe). Los casos 11-13
// (regresión de AI fallback / benchmark / suite completa) se verifican
// ejecutando esos archivos de test, no aquí.

import { describe, it, expect, afterEach, vi } from "vitest";
import { resolveParseAiConfig, callOpenAiParse, ParseAiConfigError } from "./parse-document-ai-provider";
import { extractJSON } from "../../../scripts/benchmark-ai/scoring";

describe("resolveParseAiConfig — un solo proveedor productivo (casos 1-6)", () => {
  it("1. provider=openai resuelve correctamente (config trae openaiApiKey/openaiModel)", () => {
    const config = resolveParseAiConfig({ provider: "openai", openaiApiKey: "sk-test", openaiModel: "gpt-5.6-terra" });
    expect(config).toEqual({ provider: "openai", openaiApiKey: "sk-test", openaiModel: "gpt-5.6-terra" });
  });

  it("2. provider=anthropic falla cerrado antes de fetch — Anthropic/Sonnet 5 NO está conectado a parse-document", () => {
    expect(() => resolveParseAiConfig({ provider: "anthropic", openaiApiKey: undefined, openaiModel: undefined })).toThrow(ParseAiConfigError);
    expect(() => resolveParseAiConfig({ provider: "anthropic", openaiApiKey: undefined, openaiModel: undefined })).toThrow(/openai/);
  });

  it("3. provider desconocido (ej. 'azure') falla cerrado", () => {
    expect(() => resolveParseAiConfig({ provider: "azure", openaiApiKey: undefined, openaiModel: undefined })).toThrow(ParseAiConfigError);
  });

  it("4. provider ausente (undefined) falla cerrado — sin default implícito", () => {
    expect(() => resolveParseAiConfig({ provider: undefined, openaiApiKey: undefined, openaiModel: undefined })).toThrow(ParseAiConfigError);
  });

  it("5. OpenAI sin OPENAI_API_KEY falla cerrado", () => {
    expect(() => resolveParseAiConfig({ provider: "openai", openaiApiKey: undefined, openaiModel: "gpt-5.6-terra" })).toThrow(/OPENAI_API_KEY/);
  });

  it("6. OpenAI sin OPENAI_PARSE_MODEL falla cerrado", () => {
    expect(() => resolveParseAiConfig({ provider: "openai", openaiApiKey: "sk-test", openaiModel: undefined })).toThrow(/OPENAI_PARSE_MODEL/);
  });

  it("ningún valor de key/modelo se filtra al mensaje de error (nunca se loguea un secreto)", () => {
    try {
      resolveParseAiConfig({ provider: "openai", openaiApiKey: undefined, openaiModel: undefined });
      expect.fail("debía lanzar");
    } catch (e) {
      expect((e as Error).message).not.toContain("sk-");
    }
  });
});

describe("callOpenAiParse — Responses API mockeada, sin red real (casos 7-9)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("7. Terra envía reasoning.effort='none' en el body de la request", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: '{"ok":true}' }] }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await callOpenAiParse("system", "user", 500, { openaiApiKey: "sk-test", openaiModel: "gpt-5.6-terra" });

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body.reasoning).toEqual({ effort: "none" });
    expect(body.model).toBe("gpt-5.6-terra");
  });

  it("8. una invocación produce exactamente una llamada de red mockeada", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ status: "completed", output: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await callOpenAiParse("system", "user", 500, { openaiApiKey: "sk-test", openaiModel: "gpt-5.6-terra" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("9. el texto devuelto sigue siendo compatible con extractJSON() de scoring.ts", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          status: "completed",
          output: [{ type: "message", content: [{ type: "output_text", text: 'Aquí está: {"rows":[{"original_label":"Ingresos","values":{"col_1":100}}]}' }] }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const text = await callOpenAiParse("system", "user", 500, { openaiApiKey: "sk-test", openaiModel: "gpt-5.6-terra" });
    expect(typeof text).toBe("string");
    const parsed = extractJSON(text) as { rows: Array<{ original_label: string }> };
    expect(parsed.rows[0].original_label).toBe("Ingresos");
  });

  it("respuesta HTTP no-ok: devuelve null, no lanza (no confundir error de red con error de configuración)", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: { message: "boom" } }), { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const text = await callOpenAiParse("system", "user", 500, { openaiApiKey: "sk-test", openaiModel: "gpt-5.6-terra" });
    expect(text).toBeNull();
  });
});
