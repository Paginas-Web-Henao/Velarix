import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { callAnthropic } from "./anthropic";

describe("callAnthropic — fail-closed, model explícito, sin fallback", () => {
  const savedEnv = { ...process.env };
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_BENCHMARK_MODEL;
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    process.env = { ...savedEnv };
    vi.unstubAllGlobals();
  });

  it("G. sin ANTHROPIC_API_KEY ni model: NOT_CONFIGURED, cero red", async () => {
    const result = await callAnthropic("system", "user", 100, undefined);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NOT_CONFIGURED");
    expect(result.text).toBeNull();
    expect(result.latencyMs).toBe(0);
  });

  it("con key pero sin model: NOT_CONFIGURED, cero red — el modelo NUNCA se infiere", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    const result = await callAnthropic("system", "user", 100, undefined);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.errorCode).toBe("NOT_CONFIGURED");
    expect(result.errorMessage).toContain("ANTHROPIC_BENCHMARK_MODEL");
  });

  it("I. NUNCA usa un modelo por defecto (ni claude-opus-4-8, el de producción) cuando `model` es undefined", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    const result = await callAnthropic("system", "user", 100, undefined);
    expect(result.model).not.toBe("claude-opus-4-8");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("con key y model explícitos: llama a fetch con el modelo pasado, sin campos thinking/output_config", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: [{ type: "text", text: "hola" }], usage: { input_tokens: 10, output_tokens: 5 }, stop_reason: "end_turn" }),
    });

    const result = await callAnthropic("system", "user", 100, "claude-sonnet-5");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("claude-sonnet-5");
    expect(body.thinking).toBeUndefined();
    expect(body.output_config).toBeUndefined();
    expect(result.text).toBe("hola");
    expect(result.success).toBe(true);
    expect(result.inputTokens).toBe(10);
    expect(result.outputTokens).toBe(5);
    expect(result.stopReason).toBe("end_turn");
  });

  it("HTTP 429: rateLimited=true, success=false, sin lanzar", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    fetchSpy.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: { message: "rate limited" } }) });

    const result = await callAnthropic("system", "user", 100, "claude-sonnet-5");
    expect(result.rateLimited).toBe(true);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("RATE_LIMITED");
  });

  // ═══════════════════════════════════════════════════════════════
  // Hardening — semántica success de Anthropic (evidencia: 24/30 llamadas
  // reales de la 2ª corrida terminaron por max_tokens; algunas se
  // reportaban success=true pese a estar truncadas). Distingue HTTP/API
  // success de NARRATIVE COMPLETION success.
  // ═══════════════════════════════════════════════════════════════

  it("A. stop_reason=end_turn con texto: success=true", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    fetchSpy.mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ content: [{ type: "text", text: "narrativa completa" }], usage: { input_tokens: 10, output_tokens: 50 }, stop_reason: "end_turn" }),
    });
    const result = await callAnthropic("system", "user", 500, "claude-sonnet-5");
    expect(result.success).toBe(true);
    expect(result.errorCode).toBeNull();
    expect(result.text).toBe("narrativa completa");
  });

  it("B. stop_reason=max_tokens con texto parcial: success=false, errorCode=INCOMPLETE, texto parcial preservado", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    fetchSpy.mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ content: [{ type: "text", text: "texto parcial truncado a mitad de f" }], usage: { input_tokens: 10, output_tokens: 500 }, stop_reason: "max_tokens" }),
    });
    const result = await callAnthropic("system", "user", 500, "claude-sonnet-5");
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("INCOMPLETE");
    expect(result.text).toBe("texto parcial truncado a mitad de f");
    expect(result.stopReason).toBe("max_tokens");
  });

  it("C. stop_reason=max_tokens sin texto: success=false, errorCode=INCOMPLETE, text=null", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    fetchSpy.mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ content: [], usage: { input_tokens: 10, output_tokens: 0 }, stop_reason: "max_tokens" }),
    });
    const result = await callAnthropic("system", "user", 500, "claude-sonnet-5");
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("INCOMPLETE");
    expect(result.text).toBeNull();
  });

  it("D. rate limit (HTTP 429) sigue separado de la semántica max_tokens — errorCode=RATE_LIMITED, no INCOMPLETE", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    fetchSpy.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: { message: "rate limited" } }) });
    const result = await callAnthropic("system", "user", 500, "claude-sonnet-5");
    expect(result.rateLimited).toBe(true);
    expect(result.errorCode).toBe("RATE_LIMITED");
    expect(result.errorCode).not.toBe("INCOMPLETE");
  });

  it("error de red: no lanza, devuelve NETWORK_ERROR", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    fetchSpy.mockRejectedValue(new Error("boom"));

    const result = await callAnthropic("system", "user", 100, "claude-sonnet-5");
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NETWORK_ERROR");
    expect(result.errorMessage).toContain("boom");
  });
});
