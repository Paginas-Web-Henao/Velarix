import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildCombinations, planMatrix, parseArgs, checkProviderConfig } from "./runner";
import { BENCHMARK_FIXTURES } from "./fixtures";
import { BENCHMARK_TASKS, PROVIDERS } from "./types";

describe("D. planMatrix / buildCombinations — 3 casos × 5 tareas × 2 proveedores = 30", () => {
  it("planMatrix reporta los conteos exactos", () => {
    const plan = planMatrix();
    expect(plan.fixtures).toBe(3);
    expect(plan.tasks).toBe(5);
    expect(plan.providers).toBe(2);
    expect(plan.combinations).toBe(30);
  });

  it("buildCombinations genera exactamente 30 combinaciones, todas válidas", () => {
    const combos = buildCombinations();
    expect(combos.length).toBe(30);
    for (const c of combos) {
      expect(BENCHMARK_FIXTURES.some((f) => f.id === c.fixtureId)).toBe(true);
      expect(BENCHMARK_TASKS).toContain(c.task);
      expect(PROVIDERS).toContain(c.provider);
    }
  });

  it("cada combinación (fixture, task, provider) es única — sin duplicados", () => {
    const combos = buildCombinations();
    const keys = new Set(combos.map((c) => `${c.fixtureId}::${c.task}::${c.provider}`));
    expect(keys.size).toBe(30);
  });
});

describe("E. parseArgs — dry-run por defecto, cero red por construcción (parseArgs no toca red)", () => {
  it("sin flags: modo dry-run", () => {
    const r = parseArgs([]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.args.mode).toBe("dry-run");
  });

  it("--dry-run explícito: modo dry-run", () => {
    const r = parseArgs(["--dry-run"]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.args.mode).toBe("dry-run");
  });

  it("--execute: modo execute", () => {
    const r = parseArgs(["--execute"]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.args.mode).toBe("execute");
  });
});

describe("F. --dry-run y --execute simultáneos: rechazado, cero red", () => {
  it("parseArgs devuelve ok=false con mensaje de error", () => {
    const r = parseArgs(["--dry-run", "--execute"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
  });
});

describe("checkProviderConfig — solo presencia, nunca el valor", () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_BENCHMARK_MODEL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BENCHMARK_MODEL;
  });

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it("sin ninguna variable configurada: ambos providers reportan ausente", () => {
    expect(checkProviderConfig("anthropic")).toEqual({ keyPresent: false, modelConfigured: false, model: undefined });
    expect(checkProviderConfig("openai")).toEqual({ keyPresent: false, modelConfigured: false, model: undefined });
  });

  it("con key y model configurados: reporta presente sin exponer el valor de la key", () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    process.env.ANTHROPIC_BENCHMARK_MODEL = "claude-sonnet-5";
    const status = checkProviderConfig("anthropic");
    expect(status.keyPresent).toBe(true);
    expect(status.modelConfigured).toBe(true);
    // El modelo sí se reporta (no es secreto); la key nunca aparece en el status.
    expect(status.model).toBe("claude-sonnet-5");
    expect(Object.keys(status)).not.toContain("apiKey");
  });
});

describe("G. dry-run no requiere API keys y no toca red", () => {
  const savedEnv = { ...process.env };
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_BENCHMARK_MODEL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BENCHMARK_MODEL;
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    process.env = { ...savedEnv };
    vi.unstubAllGlobals();
  });

  it("planMatrix/buildCombinations/checkProviderConfig funcionan sin ninguna key y sin llamar fetch", () => {
    const plan = planMatrix();
    expect(plan.combinations).toBe(30);
    const combos = buildCombinations();
    expect(combos.length).toBe(30);
    checkProviderConfig("anthropic");
    checkProviderConfig("openai");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
