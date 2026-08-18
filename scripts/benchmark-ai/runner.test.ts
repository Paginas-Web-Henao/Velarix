import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildCombinations, scoreCombination, parseArgs } from "./runner";
import { BENCHMARK_FIXTURES, FIXTURE_CLEAN } from "./fixtures";
import { BENCHMARK_TASKS, PROVIDERS } from "./types";
import { SYSTEM_CLASSIFIER, SYSTEM_PERIOD_DETECTOR, SYSTEM_PARSER_FALLBACK } from "../../supabase/functions/_shared/parse-document-prompts";
import { callAnthropic } from "./adapters/anthropic";
import { callOpenAI } from "./adapters/openai";

describe("prompts compartidos — fidelidad con lo que usa parse-document/index.ts", () => {
  // No se puede importar supabase/functions/parse-document/index.ts
  // directamente en Vitest (bloqueado por sus imports de URL de Deno,
  // igual que el resto de las Edge Functions de este repo — ver
  // financial-accounts.ts/validation-rules.ts). En su lugar, este test fija
  // el contenido EXACTO que index.ts tenía inline antes de la extracción,
  // para detectar cualquier drift futuro del módulo compartido.
  it("SYSTEM_CLASSIFIER es byte-for-byte igual al original", () => {
    expect(SYSTEM_CLASSIFIER).toBe(
      `Eres el clasificador documental de Velarix. Identifica el tipo de documento financiero.
Tipos: estado_resultados, balance_general, mixto, flujo_de_caja, no_reconocible
Devuelve JSON: { "tipo_documento": "...", "confianza": 0-1, "evidencias": [], "advertencias": [], "puede_continuar": true/false }`,
    );
  });

  it("SYSTEM_PERIOD_DETECTOR es byte-for-byte igual al original", () => {
    expect(SYSTEM_PERIOD_DETECTOR).toBe(
      `Eres el detector de períodos financieros de Velarix.
Devuelve JSON: { "periodos": [{"etiqueta": "2024", "tipo": "anual", "columna_indice": 0}], "periodo_mas_reciente": "etiqueta", "cantidad_periodos": número }`,
    );
  });

  it("SYSTEM_PARSER_FALLBACK es byte-for-byte igual al original", () => {
    expect(SYSTEM_PARSER_FALLBACK).toBe(
      `Eres un extractor de datos financieros. Extrae cuentas contables con valores.
Devuelve JSON: { "rows": [{"original_label": "...", "values": {"col_1": número}, "es_subtotal": false, "posicion": número}], "column_headers": ["Cuenta", "2024"], "total_rows_extracted": número }`,
    );
  });
});

describe("buildCombinations", () => {
  it("genera fixtures × tareas × proveedores × runs", () => {
    const combos = buildCombinations(BENCHMARK_FIXTURES, 3);
    expect(combos.length).toBe(BENCHMARK_FIXTURES.length * BENCHMARK_TASKS.length * PROVIDERS.length * 3);
  });

  it("cada combinación referencia una tarea y un proveedor válidos", () => {
    const combos = buildCombinations(BENCHMARK_FIXTURES, 1);
    for (const c of combos) {
      expect(BENCHMARK_TASKS).toContain(c.task);
      expect(PROVIDERS).toContain(c.provider);
      expect(BENCHMARK_FIXTURES.some((f) => f.id === c.fixtureId)).toBe(true);
    }
  });
});

describe("scoreCombination — no llama a ningún proveedor, solo scorea texto ya dado", () => {
  it("parser_fallback: JSON válido con todas las cuentas produce match completo", () => {
    const fixture = BENCHMARK_FIXTURES[0];
    const raw = JSON.stringify({
      rows: fixture.accounts.map((a) => ({ original_label: a.labelSynonyms[0], values: { col_1: a.expectedValue } })),
      column_headers: ["Cuenta", ...fixture.expected_periods],
    });
    const scored = scoreCombination({ fixtureId: fixture.id, task: "parser_fallback", provider: "anthropic", runNumber: 1 }, raw);
    expect(scored.jsonParseSuccess).toBe(true);
    expect(scored.accounts?.truePositives.length).toBe(fixture.accounts.length);
    expect(scored.accounts?.missingAccounts).toEqual([]);
  });

  it("JSON inválido: jsonParseSuccess=false, sin lanzar excepción", () => {
    const fixture = BENCHMARK_FIXTURES[0];
    const scored = scoreCombination({ fixtureId: fixture.id, task: "parser_fallback", provider: "openai", runNumber: 1 }, "esto no es json");
    expect(scored.jsonParseSuccess).toBe(false);
    expect(scored.accounts?.truePositives).toEqual([]);
  });

  // Caso F del pedido de correcciones: expected=["2025"], headers
  // devueltos = ["Cuenta","2024","2025"] -> "2024" debe quedar como
  // unexpected y exactSetMatch debe ser false. Antes, un filtro contra el
  // ground truth ANTES de comparar ocultaba el período inesperado.
  it("parser_fallback: NO oculta un período inesperado en column_headers", () => {
    expect(FIXTURE_CLEAN.expected_periods).toEqual(["2025"]);
    const raw = JSON.stringify({ rows: [], column_headers: ["Cuenta", "2024", "2025"] });
    const scored = scoreCombination({ fixtureId: FIXTURE_CLEAN.id, task: "parser_fallback", provider: "anthropic", runNumber: 1 }, raw);
    expect(scored.periods?.returnedPeriods.sort()).toEqual(["2024", "2025"]);
    expect(scored.periods?.unexpectedPeriods).toEqual(["2024"]);
    expect(scored.periods?.missingPeriods).toEqual([]);
    expect(scored.periods?.exactSetMatch).toBe(false);
  });

  it("parser_fallback: sin período inesperado, exactSetMatch=true", () => {
    const raw = JSON.stringify({ rows: [], column_headers: ["Cuenta", "2025"] });
    const scored = scoreCombination({ fixtureId: FIXTURE_CLEAN.id, task: "parser_fallback", provider: "anthropic", runNumber: 1 }, raw);
    expect(scored.periods?.unexpectedPeriods).toEqual([]);
    expect(scored.periods?.exactSetMatch).toBe(true);
  });
});

describe("parseArgs — runner fail-closed", () => {
  // A. sin flags -> dry-run
  it("sin flags: modo dry-run por defecto", () => {
    const r = parseArgs([]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.args.mode).toBe("dry-run");
      expect(r.args.runs).toBe(3);
    }
  });

  it("--dry-run explícito: modo dry-run", () => {
    const r = parseArgs(["--dry-run"]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.args.mode).toBe("dry-run");
  });

  // B. --execute es requisito explícito para el camino real
  it("--execute: modo execute", () => {
    const r = parseArgs(["--execute"]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.args.mode).toBe("execute");
  });

  // C. --dry-run + --execute -> error antes de cualquier red
  it("--dry-run y --execute simultáneos: error, no ok", () => {
    const r = parseArgs(["--dry-run", "--execute"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
  });

  // D. --runs: 1 y 5 válidos; 0, 6, decimal, negativo, NaN inválidos
  it("--runs 1: válido", () => {
    const r = parseArgs(["--runs", "1"]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.args.runs).toBe(1);
  });

  it("--runs 5: válido", () => {
    const r = parseArgs(["--runs", "5"]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.args.runs).toBe(5);
  });

  it("--runs 0: inválido", () => {
    expect(parseArgs(["--runs", "0"]).ok).toBe(false);
  });

  it("--runs 6: inválido (fuera del rango 1-5 de esta fase)", () => {
    expect(parseArgs(["--runs", "6"]).ok).toBe(false);
  });

  it("--runs decimal: inválido", () => {
    expect(parseArgs(["--runs", "2.5"]).ok).toBe(false);
  });

  it("--runs negativo: inválido", () => {
    expect(parseArgs(["--runs", "-1"]).ok).toBe(false);
  });

  it("--runs NaN (no numérico): inválido", () => {
    expect(parseArgs(["--runs", "NaN"]).ok).toBe(false);
    expect(parseArgs(["--runs", "abc"]).ok).toBe(false);
  });
});

describe("dry-run no requiere API keys", () => {
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

  it("callAnthropic sin ANTHROPIC_API_KEY devuelve error sin lanzar excepción ni intentar red", async () => {
    const result = await callAnthropic("system", "user", 100);
    expect(result.error).toContain("ANTHROPIC_API_KEY");
    expect(result.text).toBeNull();
    expect(result.latencyMs).toBe(0);
  });

  it("callOpenAI sin OPENAI_API_KEY devuelve error sin lanzar excepción ni intentar red", async () => {
    const result = await callOpenAI("system", "user", 100);
    expect(result.error).toContain("OPENAI_API_KEY");
    expect(result.text).toBeNull();
    expect(result.latencyMs).toBe(0);
  });

  it("parseArgs/buildCombinations/scoreCombination funcionan sin ninguna key configurada", () => {
    const parsed = parseArgs([]);
    expect(parsed.ok).toBe(true);
    const combos = buildCombinations(BENCHMARK_FIXTURES, 1);
    expect(combos.length).toBeGreaterThan(0);
    const scored = scoreCombination(combos[0], null);
    expect(scored).toBeDefined();
  });
});
