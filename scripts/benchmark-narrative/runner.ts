// Runner del benchmark narrativo Anthropic vs OpenAI para generate-narrative.
//
// FAIL-CLOSED: dry-run es el comportamiento por defecto. Las llamadas
// reales SOLO ocurren si se pasa explícitamente --execute. No existe
// ninguna combinación de flags que dispare red sin --execute — mismo
// patrón que scripts/benchmark-ai/runner.ts.
//
// Uso:
//   npx tsx scripts/benchmark-narrative/runner.ts               → dry-run (default)
//   npx tsx scripts/benchmark-narrative/runner.ts --dry-run     → dry-run (explícito)
//   npx tsx scripts/benchmark-narrative/runner.ts --execute     → camino real (NO usado en este subbloque)
//   npx tsx scripts/benchmark-narrative/runner.ts --dry-run --execute  → error, cero red
//
// Primera ronda: 1 ejecución por combinación (3 casos × 5 tareas × 2
// proveedores = 30), sin `--runs` — a diferencia de scripts/benchmark-ai/,
// aquí no se pidieron repeticiones para la primera ronda.
//
// --profile hardening-retest (FASE 1E/1E-hardening): retest dirigido de
// 7 pares fixture-tarea × 2 proveedores = 14 combinaciones — ver
// HARDENING_RETEST_TASKS_BY_FIXTURE. NO cambia el comportamiento default
// (sin --profile sigue siendo 3×5×2=30) y NO implica --execute:
//   npx tsx scripts/benchmark-narrative/runner.ts --profile hardening-retest --dry-run

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { BENCHMARK_FIXTURES, findFixture } from "./fixtures.ts";
import { BENCHMARK_TASKS, PROVIDERS, type BenchmarkTask, type FixtureId, type Provider, type ProviderResult } from "./types.ts";
import { buildTaskInput } from "./tasks.ts";
import { callAnthropic } from "./adapters/anthropic.ts";
import { callOpenAI } from "./adapters/openai.ts";
import { estimateCostUsd } from "../benchmark-ai/pricing.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(HERE, "results");

export interface BenchmarkCombination {
  fixtureId: FixtureId;
  task: BenchmarkTask;
  provider: Provider;
}

export type BenchmarkProfile = "default" | "hardening-retest";

// Perfil de retest dirigido (FASE 1E/1E-hardening, evidencia de 2
// benchmarks reales — ver tasks.ts::FINANCIAL_SEMANTIC_GUARDRAILS). NO
// cambia el comportamiento default (3×5×2=30, sin --profile). Cubre
// exactamente los 7 pares fixture-tarea donde se observó el error real:
// NO_TEXT/max_tokens de Anthropic en valuation_analysis, EBITDA-vs-WACC,
// interestCoverage mal descrito, "pérdida operativa" con EBIT positivo
// (CASE_B), y truncamiento en profitability/valuation.
export const HARDENING_RETEST_TASKS_BY_FIXTURE: Readonly<Record<FixtureId, readonly BenchmarkTask[]>> = {
  CASE_A_MODERATE: ["valuation_analysis", "conclusion"],
  CASE_B_FINANCIAL_STRESS: ["executive_summary", "profitability_analysis"],
  CASE_C_INCOMPLETE_EVIDENCE: ["profitability_analysis", "valuation_analysis", "conclusion"],
};

/** Genera la matriz de combinaciones para el `profile` dado — función pura, sin red. Default: fixtures × tareas × proveedores completo (3×5×2=30, comportamiento sin cambios). `hardening-retest`: solo los 7 pares fixture-tarea de HARDENING_RETEST_TASKS_BY_FIXTURE × 2 proveedores = 14. */
export function buildCombinations(profile: BenchmarkProfile = "default"): BenchmarkCombination[] {
  const combos: BenchmarkCombination[] = [];
  if (profile === "hardening-retest") {
    for (const fixture of BENCHMARK_FIXTURES) {
      for (const task of HARDENING_RETEST_TASKS_BY_FIXTURE[fixture.id]) {
        for (const provider of PROVIDERS) {
          combos.push({ fixtureId: fixture.id, task, provider });
        }
      }
    }
    return combos;
  }
  for (const fixture of BENCHMARK_FIXTURES) {
    for (const task of BENCHMARK_TASKS) {
      for (const provider of PROVIDERS) {
        combos.push({ fixtureId: fixture.id, task, provider });
      }
    }
  }
  return combos;
}

export interface PlannedMatrix {
  fixtures: number;
  tasks: number;
  providers: number;
  combinations: number;
}

export function planMatrix(profile: BenchmarkProfile = "default"): PlannedMatrix {
  const combos = buildCombinations(profile);
  return {
    fixtures: new Set(combos.map((c) => c.fixtureId)).size,
    tasks: new Set(combos.map((c) => c.task)).size,
    providers: PROVIDERS.length,
    combinations: combos.length,
  };
}

export interface ProviderConfigStatus {
  keyPresent: boolean;
  modelConfigured: boolean;
  model: string | undefined;
}

/** Solo presencia — NUNCA imprime el valor de la key ni del modelo (el modelo sí se reporta, no es secreto; la key nunca). */
export function checkProviderConfig(provider: Provider): ProviderConfigStatus {
  if (provider === "anthropic") {
    return {
      keyPresent: Boolean(process.env.ANTHROPIC_API_KEY),
      modelConfigured: Boolean(process.env.ANTHROPIC_BENCHMARK_MODEL),
      model: process.env.ANTHROPIC_BENCHMARK_MODEL,
    };
  }
  return {
    keyPresent: Boolean(process.env.OPENAI_API_KEY),
    modelConfigured: Boolean(process.env.OPENAI_BENCHMARK_MODEL),
    model: process.env.OPENAI_BENCHMARK_MODEL,
  };
}

export interface ParsedArgs {
  mode: "dry-run" | "execute";
  profile: BenchmarkProfile;
}

export type ParseArgsResult = { ok: true; args: ParsedArgs } | { ok: false; error: string };

/**
 * Parseo de argumentos — fail-closed y puro (no toca red, no imprime).
 * Sin flags -> dry-run + profile default. --dry-run y --execute
 * simultáneos -> error. `--profile hardening-retest` NO implica
 * --execute — sigue siendo dry-run salvo que --execute se pase aparte.
 */
export function parseArgs(argv: readonly string[]): ParseArgsResult {
  const hasDryRun = argv.includes("--dry-run");
  const hasExecute = argv.includes("--execute");
  if (hasDryRun && hasExecute) {
    return { ok: false, error: "No se puede pasar --dry-run y --execute al mismo tiempo." };
  }

  let profile: BenchmarkProfile = "default";
  const profileFlagIndex = argv.indexOf("--profile");
  if (profileFlagIndex !== -1) {
    const value = argv[profileFlagIndex + 1];
    if (value !== "default" && value !== "hardening-retest") {
      return { ok: false, error: `--profile inválido: "${value ?? "(ausente)"}" — valores permitidos: default, hardening-retest.` };
    }
    profile = value;
  }

  return { ok: true, args: { mode: hasExecute ? "execute" : "dry-run", profile } };
}

async function callProvider(
  provider: Provider,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  model: string | undefined,
) {
  return provider === "anthropic"
    ? callAnthropic(systemPrompt, userPrompt, maxTokens, model)
    : callOpenAI(systemPrompt, userPrompt, maxTokens, model);
}

function printDryRunReport(profile: BenchmarkProfile): void {
  const plan = planMatrix(profile);
  const anthropicStatus = checkProviderConfig("anthropic");
  const openaiStatus = checkProviderConfig("openai");

  console.log(`modo=dry-run`);
  console.log(`profile=${profile}`);
  console.log(`fixtures=${plan.fixtures}`);
  console.log(`tasks=${plan.tasks}`);
  console.log(`providers=${plan.providers}`);
  console.log(`planned_combinations=${plan.combinations}`);
  console.log(`fixture_ids=${BENCHMARK_FIXTURES.map((f) => f.id).join(",")}`);
  console.log(`task_ids=${BENCHMARK_TASKS.join(",")}`);
  console.log(`anthropic_key_present=${anthropicStatus.keyPresent ? "YES" : "NO"}`);
  console.log(`anthropic_model_configured=${anthropicStatus.modelConfigured ? "YES" : "NO"}`);
  console.log(`openai_key_present=${openaiStatus.keyPresent ? "YES" : "NO"}`);
  console.log(`openai_model_configured=${openaiStatus.modelConfigured ? "YES" : "NO"}`);

  console.log(`--- matriz prevista ---`);
  for (const combo of buildCombinations(profile)) {
    console.log(`fixture=${combo.fixtureId} task=${combo.task} provider=${combo.provider}`);
  }

  // Prueba de cableado local — construye el TaskInput real de una
  // combinación sin llamar a ningún proveedor, solo para demostrar que el
  // pipeline fixture -> task -> prompt está bien conectado en dry-run.
  const sample = findFixture(BENCHMARK_FIXTURES[0].id);
  const taskInput = buildTaskInput("executive_summary", sample);
  console.log(`ejemplo_tarea=executive_summary fixture=${sample.id} maxTokens=${taskInput.maxTokens} systemPromptChars=${taskInput.systemPrompt.length} userPromptChars=${taskInput.userPrompt.length}`);
  console.log(`network_requests=0`);
}

async function runExecute(profile: BenchmarkProfile): Promise<void> {
  const combos = buildCombinations(profile);
  const anthropicModel = process.env.ANTHROPIC_BENCHMARK_MODEL;
  const openaiModel = process.env.OPENAI_BENCHMARK_MODEL;
  const results: ProviderResult[] = [];

  for (const combo of combos) {
    const fixture = findFixture(combo.fixtureId);
    const taskInput = buildTaskInput(combo.task, fixture);
    const model = combo.provider === "anthropic" ? anthropicModel : openaiModel;
    const call = await callProvider(combo.provider, taskInput.systemPrompt, taskInput.userPrompt, taskInput.maxTokens, model);
    const estimatedCostUsd = estimateCostUsd(combo.provider, call.model, call.inputTokens, call.outputTokens);
    const result: ProviderResult = {
      ...call,
      task: combo.task,
      fixtureId: combo.fixtureId,
      inputChars: taskInput.userPrompt.length + taskInput.systemPrompt.length,
      outputChars: call.text?.length ?? 0,
      estimatedCostUsd,
    };
    results.push(result);
    console.log(JSON.stringify(result));
  }

  mkdirSync(RESULTS_DIR, { recursive: true });
  const outPath = join(RESULTS_DIR, `run-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`resultados_guardados=${outPath}`);
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(`error=${parsed.error}`);
    console.error(`network_requests=0`);
    process.exitCode = 1;
    return;
  }

  if (parsed.args.mode === "dry-run") {
    printDryRunReport(parsed.args.profile);
    return;
  }

  await runExecute(parsed.args.profile);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
