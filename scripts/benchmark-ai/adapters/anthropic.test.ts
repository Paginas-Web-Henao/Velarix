import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { callAnthropic } from "./anthropic";

// ANTHROPIC_BENCHMARK_EFFORT — cobertura focalizada del cambio mínimo:
// effort explícito en output_config, fail-closed sin default implícito,
// sin llamadas de red en ningún caso de este archivo.

describe("callAnthropic — ANTHROPIC_BENCHMARK_EFFORT", () => {
  const savedEnv = { ...process.env };
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    process.env.ANTHROPIC_BENCHMARK_MODEL = "claude-sonnet-5";
    delete process.env.ANTHROPIC_BENCHMARK_EFFORT;
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    process.env = { ...savedEnv };
    vi.unstubAllGlobals();
  });

  it("effort=low se incorpora en output_config.effort del payload, junto a thinking:disabled — sin tocarlo", async () => {
    process.env.ANTHROPIC_BENCHMARK_EFFORT = "low";
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: [{ type: "text", text: "{}" }], usage: { input_tokens: 1, output_tokens: 1 }, stop_reason: "end_turn" }),
    });

    await callAnthropic("system", "user", 100);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.output_config).toEqual({ effort: "low" });
    expect(body.thinking).toEqual({ type: "disabled" });
  });

  it("effort inválido (no está en low/medium/high/xhigh/max): falla antes de red", async () => {
    process.env.ANTHROPIC_BENCHMARK_EFFORT = "none";

    const result = await callAnthropic("system", "user", 100);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.text).toBeNull();
    expect(result.latencyMs).toBe(0);
    expect(result.error).toContain("ANTHROPIC_BENCHMARK_EFFORT");
    expect(result.error).toContain("none");
  });

  it("effort ausente en camino real (key y model configurados): falla antes de red, sin default silencioso", async () => {
    const result = await callAnthropic("system", "user", 100);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.text).toBeNull();
    expect(result.latencyMs).toBe(0);
    expect(result.error).toContain("ANTHROPIC_BENCHMARK_EFFORT");
  });

  it("dry-run (sin ANTHROPIC_API_KEY) sigue sin requerir model/effort — ni siquiera llega a validar effort", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_BENCHMARK_MODEL;
    delete process.env.ANTHROPIC_BENCHMARK_EFFORT;

    const result = await callAnthropic("system", "user", 100);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.error).toContain("ANTHROPIC_API_KEY");
    expect(result.text).toBeNull();
    expect(result.latencyMs).toBe(0);
  });

  it("cada valor válido (low/medium/high/xhigh/max) pasa la validación y llega al payload tal cual", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: [{ type: "text", text: "{}" }], usage: { input_tokens: 1, output_tokens: 1 }, stop_reason: "end_turn" }),
    });

    for (const effort of ["low", "medium", "high", "xhigh", "max"]) {
      fetchSpy.mockClear();
      process.env.ANTHROPIC_BENCHMARK_EFFORT = effort;
      const result = await callAnthropic("system", "user", 100);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, init] = fetchSpy.mock.calls[0];
      const body = JSON.parse(init.body as string);
      expect(body.output_config).toEqual({ effort });
      expect(result.error).toBeNull();
    }
  });
});
