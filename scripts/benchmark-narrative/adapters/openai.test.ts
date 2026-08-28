import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { callOpenAI } from "./openai";

const HERE = dirname(fileURLToPath(import.meta.url));
const OPENAI_ADAPTER_SOURCE = readFileSync(resolve(HERE, "./openai.ts"), "utf-8");

describe("callOpenAI — fail-closed, model explícito, sin fallback a parse", () => {
  const savedEnv = { ...process.env };
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BENCHMARK_MODEL;
    delete process.env.OPENAI_PARSE_MODEL;
    delete process.env.PARSE_AI_PROVIDER;
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    process.env = { ...savedEnv };
    vi.unstubAllGlobals();
  });

  it("G. sin OPENAI_API_KEY ni model: NOT_CONFIGURED, cero red", async () => {
    const result = await callOpenAI("system", "user", 100, undefined);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NOT_CONFIGURED");
    expect(result.text).toBeNull();
    expect(result.latencyMs).toBe(0);
  });

  it("H. aunque OPENAI_PARSE_MODEL y PARSE_AI_PROVIDER estén seteados en el entorno, el adapter los ignora por completo (nunca los lee)", async () => {
    process.env.OPENAI_API_KEY = "test-key-not-real";
    process.env.OPENAI_PARSE_MODEL = "gpt-5.6-terra";
    process.env.PARSE_AI_PROVIDER = "openai";
    // Sin OPENAI_BENCHMARK_MODEL explícito -> sigue NOT_CONFIGURED, pese a
    // que OPENAI_PARSE_MODEL SÍ está presente en el entorno.
    const result = await callOpenAI("system", "user", 100, undefined);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.errorCode).toBe("NOT_CONFIGURED");
    expect(result.errorMessage).toContain("OPENAI_BENCHMARK_MODEL");
  });

  it("H (fuente estática): el CÓDIGO del adapter nunca lee process.env.OPENAI_PARSE_MODEL ni process.env.PARSE_AI_PROVIDER (los nombres solo aparecen en el comentario de cabecera, explicando que NO se usan)", () => {
    expect(OPENAI_ADAPTER_SOURCE).not.toContain("process.env.OPENAI_PARSE_MODEL");
    expect(OPENAI_ADAPTER_SOURCE).not.toContain("process.env.PARSE_AI_PROVIDER");
  });

  it("con key y model explícitos: llama a fetch con el modelo pasado, sin campo reasoning", async () => {
    process.env.OPENAI_API_KEY = "test-key-not-real";
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "hola" }] }], usage: { input_tokens: 12, output_tokens: 6 } }),
    });

    const result = await callOpenAI("system", "user", 100, "gpt-5.6-terra");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/responses");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("gpt-5.6-terra");
    expect(body.reasoning).toBeUndefined();
    expect(result.text).toBe("hola");
    expect(result.success).toBe(true);
    expect(result.inputTokens).toBe(12);
    expect(result.outputTokens).toBe(6);
  });

  it("status incomplete: success=false, errorCode=INCOMPLETE, sin lanzar", async () => {
    process.env.OPENAI_API_KEY = "test-key-not-real";
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output: [] }),
    });

    const result = await callOpenAI("system", "user", 100, "gpt-5.6-terra");
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("INCOMPLETE");
  });

  it("HTTP 429: rateLimited=true, sin lanzar", async () => {
    process.env.OPENAI_API_KEY = "test-key-not-real";
    fetchSpy.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: { message: "rate limited" } }) });

    const result = await callOpenAI("system", "user", 100, "gpt-5.6-terra");
    expect(result.rateLimited).toBe(true);
    expect(result.success).toBe(false);
  });
});
