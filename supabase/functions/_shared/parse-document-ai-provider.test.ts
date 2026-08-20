// Integración de Terra como proveedor productivo de parse-document — ver
// ../_shared/parse-document-ai-provider.ts para el diseño completo.
//
// Sin red real: resolveParseAiConfig() es puro (sin fetch), y
// callOpenAiParse() se prueba mockeando `fetch` (nunca se llama a
// api.openai.com). No se puede importar parse-document/index.ts ni
// anthropic-client.ts en Vitest (bloqueados por sus imports de URL de
// Deno/el SDK de Anthropic vía esm.sh) — mismo problema ya documentado en
// runner.test.ts para los 3 SYSTEM_* prompts. Por eso los casos 9-11
// (classifier/period_detector/parser_fallback siguen recibiendo su
// SYSTEM_* prompt) y 14-16 (regresión) se verifican por inspección
// directa del diff / ejecutando los demás archivos de test, no aquí.

import { describe, it, expect, afterEach, vi } from "vitest";
import { resolveParseAiConfig, callOpenAiParse, ParseAiConfigError } from "./parse-document-ai-provider";
import { extractJSON } from "../../../scripts/benchmark-ai/scoring";

describe("resolveParseAiConfig — selección de proveedor (casos 1-7)", () => {
  it("1. provider=openai selecciona adapter OpenAI (config resuelto trae openaiApiKey/openaiModel)", () => {
    const config = resolveParseAiConfig({ provider: "openai", openaiApiKey: "sk-test", openaiModel: "gpt-5.6-terra" });
    expect(config).toEqual({ provider: "openai", openaiApiKey: "sk-test", openaiModel: "gpt-5.6-terra" });
  });

  it("2. provider=anthropic selecciona adapter Anthropic (config resuelto NO trae campos de openai)", () => {
    const config = resolveParseAiConfig({ provider: "anthropic", openaiApiKey: undefined, openaiModel: undefined });
    expect(config).toEqual({ provider: "anthropic" });
  });

  it("3. provider desconocido falla cerrado (ParseAiConfigError, síncrono — nunca llega a fetch)", () => {
    expect(() => resolveParseAiConfig({ provider: "azure", openaiApiKey: undefined, openaiModel: undefined })).toThrow(ParseAiConfigError);
  });

  it("3b. provider no configurado (undefined) también falla cerrado — sin default implícito", () => {
    expect(() => resolveParseAiConfig({ provider: undefined, openaiApiKey: undefined, openaiModel: undefined })).toThrow(ParseAiConfigError);
  });

  it("4. OpenAI sin OPENAI_API_KEY falla cerrado antes de network", () => {
    expect(() => resolveParseAiConfig({ provider: "openai", openaiApiKey: undefined, openaiModel: "gpt-5.6-terra" })).toThrow(/OPENAI_API_KEY/);
  });

  it("5. Anthropic — resolveParseAiConfig NO exige ANTHROPIC_API_KEY (esa validación se delega, sin cambios, a callAnthropic() en anthropic-client.ts, que ya falla antes de cualquier fetch si falta la key — no se puede ejecutar aquí porque ese módulo importa el SDK de Anthropic vía URL, bloqueado en Vitest; ver parse-document/index.ts línea ~519 donde el caller preserva la comprobación explícita)", () => {
    const config = resolveParseAiConfig({ provider: "anthropic", openaiApiKey: undefined, openaiModel: undefined });
    expect(config.provider).toBe("anthropic");
  });

  it("6. OpenAI sin OPENAI_PARSE_MODEL falla cerrado", () => {
    expect(() => resolveParseAiConfig({ provider: "openai", openaiApiKey: "sk-test", openaiModel: undefined })).toThrow(/OPENAI_PARSE_MODEL/);
  });

  it("7. Anthropic — el cliente actual (anthropic-client.ts) tiene el modelo hardcodeado ('claude-opus-4-8'), no lee ningún env var de modelo; por eso resolveParseAiConfig tampoco exige uno para provider=anthropic — no hay 'falta modelo' posible hoy en ese camino, documentado en vez de simulado", () => {
    const config = resolveParseAiConfig({ provider: "anthropic", openaiApiKey: undefined, openaiModel: undefined });
    expect(config).toEqual({ provider: "anthropic" });
  });

  it("13a. el resultado de resolveParseAiConfig nunca trae ambos proveedores a la vez (unión discriminada)", () => {
    const openaiConfig = resolveParseAiConfig({ provider: "openai", openaiApiKey: "k", openaiModel: "m" });
    const anthropicConfig = resolveParseAiConfig({ provider: "anthropic", openaiApiKey: "k-inesperada", openaiModel: "m-inesperado" });
    expect(Object.keys(openaiConfig).sort()).toEqual(["openaiApiKey", "openaiModel", "provider"]);
    expect(Object.keys(anthropicConfig)).toEqual(["provider"]);
  });
});

describe("callOpenAiParse — Responses API mockeada, sin red real (casos 8, 12, 13b)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("8. envía reasoning.effort='none' (Terra) en el body de la request", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: '{"ok":true}' }] }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await callOpenAiParse("system", "user", 500, { openaiApiKey: "sk-test", openaiModel: "gpt-5.6-terra" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body.reasoning).toEqual({ effort: "none" });
    expect(body.model).toBe("gpt-5.6-terra");
  });

  it("12. el texto devuelto es compatible con extractJSON() de scoring.ts", async () => {
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

  it("13b. una sola llamada de red por invocación (no se llama a dos proveedores)", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ status: "completed", output: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await callOpenAiParse("system", "user", 500, { openaiApiKey: "sk-test", openaiModel: "gpt-5.6-terra" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("respuesta HTTP no-ok: devuelve null, no lanza (no confundir error de red con error de configuración)", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: { message: "boom" } }), { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const text = await callOpenAiParse("system", "user", 500, { openaiApiKey: "sk-test", openaiModel: "gpt-5.6-terra" });
    expect(text).toBeNull();
  });
});
