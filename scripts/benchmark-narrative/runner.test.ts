import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildCombinations, planMatrix, parseArgs, checkProviderConfig, HARDENING_RETEST_TASKS_BY_FIXTURE } from "./runner";
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
  it("sin flags: modo dry-run, profile default", () => {
    const r = parseArgs([]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.args.mode).toBe("dry-run");
      expect(r.args.profile).toBe("default");
    }
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

  it("--profile hardening-retest --dry-run: profile=hardening-retest, modo dry-run (el profile NO implica --execute)", () => {
    const r = parseArgs(["--profile", "hardening-retest", "--dry-run"]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.args.profile).toBe("hardening-retest");
      expect(r.args.mode).toBe("dry-run");
    }
  });

  it("--profile hardening-retest sin --execute: sigue siendo dry-run por defecto", () => {
    const r = parseArgs(["--profile", "hardening-retest"]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.args.mode).toBe("dry-run");
  });

  it("--profile con valor inválido: rechazado", () => {
    const r = parseArgs(["--profile", "algo-invalido"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("--profile inválido");
  });
});

describe("hardening-retest profile — 7 pares fixture-tarea × 2 proveedores = 14 combinaciones", () => {
  it("HARDENING_RETEST_TASKS_BY_FIXTURE cubre exactamente los 7 pares especificados", () => {
    expect(HARDENING_RETEST_TASKS_BY_FIXTURE.CASE_A_MODERATE).toEqual(["valuation_analysis", "conclusion"]);
    expect(HARDENING_RETEST_TASKS_BY_FIXTURE.CASE_B_FINANCIAL_STRESS).toEqual(["executive_summary", "profitability_analysis"]);
    expect(HARDENING_RETEST_TASKS_BY_FIXTURE.CASE_C_INCOMPLETE_EVIDENCE).toEqual(["profitability_analysis", "valuation_analysis", "conclusion"]);
  });

  it("buildCombinations('hardening-retest') genera exactamente 14 combinaciones, 7 por proveedor", () => {
    const combos = buildCombinations("hardening-retest");
    expect(combos.length).toBe(14);
    const byProvider = { anthropic: 0, openai: 0 };
    for (const c of combos) byProvider[c.provider]++;
    expect(byProvider.anthropic).toBe(7);
    expect(byProvider.openai).toBe(7);
  });

  it("cubre exactamente los 7 pares fixture::task especificados, sin duplicados ni extras", () => {
    const combos = buildCombinations("hardening-retest");
    const pairs = new Set(combos.map((c) => `${c.fixtureId}::${c.task}`));
    expect(pairs.size).toBe(7);
    expect([...pairs].sort()).toEqual(
      [
        "CASE_A_MODERATE::valuation_analysis",
        "CASE_A_MODERATE::conclusion",
        "CASE_B_FINANCIAL_STRESS::executive_summary",
        "CASE_B_FINANCIAL_STRESS::profitability_analysis",
        "CASE_C_INCOMPLETE_EVIDENCE::profitability_analysis",
        "CASE_C_INCOMPLETE_EVIDENCE::valuation_analysis",
        "CASE_C_INCOMPLETE_EVIDENCE::conclusion",
      ].sort(),
    );
  });

  it("planMatrix('hardening-retest') reporta combinations=14", () => {
    const plan = planMatrix("hardening-retest");
    expect(plan.combinations).toBe(14);
  });

  it("planMatrix() default (sin argumento) sigue reportando 30 — comportamiento default sin cambios", () => {
    const plan = planMatrix();
    expect(plan.combinations).toBe(30);
    expect(plan.fixtures).toBe(3);
    expect(plan.tasks).toBe(5);
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
