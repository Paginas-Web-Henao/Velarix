// Runner del benchmark OpenAI vs Anthropic para parse-document.
//
// FAIL-CLOSED: dry-run es el comportamiento por defecto. Las llamadas
// reales SOLO ocurren si se pasa explícitamente --execute. No existe
// ninguna combinación de flags que dispare red sin --execute.
//
// Uso:
//   npx tsx scripts/benchmark-ai/runner.ts                → dry-run (default)
//   npx tsx scripts/benchmark-ai/runner.ts --dry-run       → dry-run (explícito)
//   npx tsx scripts/benchmark-ai/runner.ts --execute       → camino real
//   npx tsx scripts/benchmark-ai/runner.ts --dry-run --execute  → error, cero red
//   npx tsx scripts/benchmark-ai/runner.ts --runs N        → N entero 1-5, default 3
//
// El runner NUNCA depende de que existan las API keys para poder hacer
// dry-run: la ausencia de ANTHROPIC_API_KEY / OPENAI_API_KEY (o de
// ANTHROPIC_BENCHMARK_MODEL / OPENAI_BENCHMARK_MODEL) no lo hace fallar —
// simplemente esas combinaciones quedan marcadas como "no configuradas"
// hasta que alguien decida la pareja proveedor/modelo del primer pilot.

import { BENCHMARK_FIXTURES, type BenchmarkFixture } from "./fixtures.ts";
import { BENCHMARK_TASKS, PROVIDERS, type BenchmarkTask, type Provider } from "./types.ts";
import { callAnthropic } from "./adapters/anthropic.ts";
import { callOpenAI } from "./adapters/openai.ts";
import { SYSTEM_CLASSIFIER, SYSTEM_PERIOD_DETECTOR, SYSTEM_PARSER_FALLBACK } from "../../supabase/functions/_shared/parse-document-prompts.ts";
import {
  extractJSON,
  compareAccounts,
  comparePeriods,
  compareClassifier,
  type ExtractedRow,
  type AccountComparison,
  type PeriodComparison,
  type ClassifierComparison,
} from "./scoring.ts";
import { estimateCostUsd } from "./pricing.ts";

const MIN_RUNS = 1;
const MAX_RUNS = 5;
const DEFAULT_RUNS = 3;

// Instrucciones de usuario — mismas plantillas exactas que usa
// `parse-document/index.ts` (líneas 565-566, 619, 629), interpolando el
// texto ya "post-extracción" del fixture en el lugar de lo que en
// producción sería `contentForAI`/`sampleText`. Ver CORRECCIÓN DE DISEÑO 3
// de la tarea que originó este harness: el proveedor nunca recibe el
// archivo bruto, solo texto ya preparado — por eso el fixture ES ese texto.
//
// Los 3 SYSTEM_* prompts se mantienen exactamente como están — sin
// structured outputs, sin response_format por proveedor, sin JSON schema
// específico de OpenAI, sin tool use. Ambos proveedores responden al mismo
// contrato lógico actual de parse-document, sin ayudas adicionales.
function buildUserPrompt(task: BenchmarkTask, sourceText: string): { prompt: string; maxTokens: number; systemPrompt: string } {
  switch (task) {
    case "parser_fallback":
      return { systemPrompt: SYSTEM_PARSER_FALLBACK, prompt: `Extrae todas las cuentas contables.\n\nContenido:\n${sourceText.substring(0, 6000)}`, maxTokens: 4000 };
    case "document_classifier":
      return { systemPrompt: SYSTEM_CLASSIFIER, prompt: `Clasifica este documento financiero.\n\nFilas extraídas:\n${sourceText}`, maxTokens: 500 };
    case "period_detector":
      return { systemPrompt: SYSTEM_PERIOD_DETECTOR, prompt: `Detecta los períodos.\n\n${sourceText}`, maxTokens: 500 };
  }
}

export interface BenchmarkCombination {
  fixtureId: string;
  task: BenchmarkTask;
  provider: Provider;
  runNumber: number;
}

/** Genera la matriz completa fixtures × tareas × proveedores × runs — función pura, sin red. */
export function buildCombinations(fixtures: readonly BenchmarkFixture[], runs: number): BenchmarkCombination[] {
  const combos: BenchmarkCombination[] = [];
  for (const fixture of fixtures) {
    for (const task of BENCHMARK_TASKS) {
      for (const provider of PROVIDERS) {
        for (let runNumber = 1; runNumber <= runs; runNumber++) {
          combos.push({ fixtureId: fixture.id, task, provider, runNumber });
        }
      }
    }
  }
  return combos;
}

function findFixture(id: string): BenchmarkFixture {
  const f = BENCHMARK_FIXTURES.find((x) => x.id === id);
  if (!f) throw new Error(`fixture desconocido: ${id}`);
  return f;
}

/**
 * Candidatos de período — SOLO para scoring del benchmark, sobre estos
 * fixtures anuales simples de un único período. Etiquetas YYYY de 4
 * dígitos. Esto NO es una política de períodos de producción (esa vive en
 * `_shared/period-resolution.ts` y no se toca aquí).
 */
function extractYearCandidates(headers: readonly string[]): string[] {
  return headers.filter((h) => /^\d{4}$/.test(h));
}

// Shapes mínimos del JSON crudo que cada prompt le pide al modelo que
// devuelva (ver los 3 prompts en parse-document-prompts.ts) — solo lo
// necesario para el scoring, sin usar `any`.
interface ParserFallbackRawOutput {
  rows?: unknown;
  column_headers?: unknown;
}

interface PeriodDetectorRawOutput {
  periodos?: unknown;
}

export interface ScoredCombination {
  task: BenchmarkTask;
  jsonParseSuccess: boolean;
  accounts?: AccountComparison;
  periods?: PeriodComparison;
  classifier?: ClassifierComparison;
}

function isExtractedRow(value: unknown): value is ExtractedRow {
  return typeof value === "object" && value !== null;
}

/** Simula el scoring de una combinación contra un output ya obtenido (real o local), sin llamar a ningún proveedor. Usado tanto por el runner real como por el dry-run con outputs simulados. */
export function scoreCombination(combo: BenchmarkCombination, rawText: string | null): ScoredCombination {
  const fixture = findFixture(combo.fixtureId);
  const parsed = extractJSON(rawText);
  const jsonParseSuccess = parsed !== null;

  if (combo.task === "parser_fallback") {
    const raw = jsonParseSuccess ? (parsed as ParserFallbackRawOutput) : undefined;
    const rows: ExtractedRow[] = Array.isArray(raw?.rows) ? raw.rows.filter(isExtractedRow) : [];
    const columnHeaders: string[] = Array.isArray(raw?.column_headers) ? raw.column_headers.filter((h: unknown): h is string => typeof h === "string") : [];
    // columnHeaders se pasa a compareAccounts para el scoring multi-período
    // (HARD) — ver ExpectedAccount.expectedValuesByPeriod en fixtures.ts.
    // Para CLEAN/NOISY (sin expectedValuesByPeriod) no cambia nada: siguen
    // el camino legacy exactamente como antes.
    const accounts = compareAccounts(fixture.accounts, rows, columnHeaders);
    // NO se filtra contra fixture.expected_periods antes de puntuar — eso
    // ocultaría períodos inesperados. Se identifican candidatos de forma
    // explícita e independiente del ground truth, y comparePeriods decide.
    const periods = comparePeriods(fixture.expected_periods, extractYearCandidates(columnHeaders));
    return { task: combo.task, jsonParseSuccess, accounts, periods };
  }
  if (combo.task === "document_classifier") {
    const classifier = compareClassifier(fixture.expected_document_type, parsed);
    return { task: combo.task, jsonParseSuccess, classifier };
  }
  // period_detector
  const raw = jsonParseSuccess ? (parsed as PeriodDetectorRawOutput) : undefined;
  const returnedPeriods: string[] = Array.isArray(raw?.periodos)
    ? raw.periodos
        .map((p: unknown) => (p && typeof p === "object" && "etiqueta" in p && typeof (p as { etiqueta: unknown }).etiqueta === "string" ? (p as { etiqueta: string }).etiqueta : null))
        .filter((x: string | null): x is string => x !== null)
    : [];
  const periods = comparePeriods(fixture.expected_periods, returnedPeriods);
  return { task: combo.task, jsonParseSuccess, periods };
}

async function callProvider(provider: Provider, systemPrompt: string, userPrompt: string, maxTokens: number) {
  return provider === "anthropic" ? callAnthropic(systemPrompt, userPrompt, maxTokens) : callOpenAI(systemPrompt, userPrompt, maxTokens);
}

export interface ParsedArgs {
  mode: "dry-run" | "execute";
  runs: number;
}

export type ParseArgsResult = { ok: true; args: ParsedArgs } | { ok: false; error: string };

/**
 * Parseo de argumentos — fail-closed y puro (no toca red, no imprime).
 * - Sin flags -> dry-run.
 * - --dry-run y --execute simultáneos -> error.
 * - --runs acepta EXCLUSIVAMENTE enteros 1-5; cualquier otra cosa (0,
 *   negativos, NaN, decimales, >5, no numérico) -> error.
 */
export function parseArgs(argv: readonly string[]): ParseArgsResult {
  const hasDryRun = argv.includes("--dry-run");
  const hasExecute = argv.includes("--execute");

  if (hasDryRun && hasExecute) {
    return { ok: false, error: "No se puede pasar --dry-run y --execute al mismo tiempo." };
  }

  let runs = DEFAULT_RUNS;
  const runsIdx = argv.indexOf("--runs");
  if (runsIdx !== -1) {
    const raw = argv[runsIdx + 1];
    if (raw === undefined || !/^-?\d+$/.test(raw)) {
      return { ok: false, error: `--runs debe ser un entero entre ${MIN_RUNS} y ${MAX_RUNS} (recibido: ${JSON.stringify(raw)})` };
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < MIN_RUNS || n > MAX_RUNS) {
      return { ok: false, error: `--runs debe ser un entero entre ${MIN_RUNS} y ${MAX_RUNS} (recibido: ${n})` };
    }
    runs = n;
  }

  return { ok: true, args: { mode: hasExecute ? "execute" : "dry-run", runs } };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(`error=${parsed.error}`);
    console.error(`network_requests=0`);
    process.exitCode = 1;
    return;
  }
  const { mode, runs } = parsed.args;
  const combos = buildCombinations(BENCHMARK_FIXTURES, runs);

  console.log(`fixtures_cargados=${BENCHMARK_FIXTURES.length}`);
  console.log(`prompts_cargados=3`); // SYSTEM_CLASSIFIER, SYSTEM_PERIOD_DETECTOR, SYSTEM_PARSER_FALLBACK
  console.log(`tareas=${BENCHMARK_TASKS.join(",")}`);
  console.log(`proveedores=${PROVIDERS.join(",")}`);
  console.log(`runs_por_combinacion=${runs}`);
  console.log(`combinaciones_totales=${combos.length}`);
  console.log(`modo=${mode}`);
  console.log(`anthropic_api_key_detectada=${Boolean(process.env.ANTHROPIC_API_KEY)}`);
  console.log(`anthropic_model_configurado=${Boolean(process.env.ANTHROPIC_BENCHMARK_MODEL)}`);
  console.log(`openai_api_key_detectada=${Boolean(process.env.OPENAI_API_KEY)}`);
  console.log(`openai_model_configurado=${Boolean(process.env.OPENAI_BENCHMARK_MODEL)}`);

  if (mode === "dry-run") {
    // Demuestra construcción de tareas + scoring contra un output LOCAL
    // simulado (no de ningún proveedor real), solo para probar que el
    // pipeline prompt -> llamada -> scoring está bien cableado.
    const sample = findFixture(BENCHMARK_FIXTURES[0].id);
    const { systemPrompt, prompt, maxTokens } = buildUserPrompt("parser_fallback", sample.source_text);
    console.log(`ejemplo_tarea=parser_fallback fixture=${sample.id} maxTokens=${maxTokens} systemPromptChars=${systemPrompt.length} userPromptChars=${prompt.length}`);

    const simulatedOutput = JSON.stringify({
      rows: sample.accounts.map((a) => ({ original_label: a.labelSynonyms[0], values: { col_1: a.expectedValue } })),
      column_headers: ["Cuenta", ...sample.expected_periods],
      total_rows_extracted: sample.accounts.length,
    });
    const scored = scoreCombination({ fixtureId: sample.id, task: "parser_fallback", provider: "anthropic", runNumber: 1 }, simulatedOutput);
    console.log(`scoring_simulado_ok=${scored.accounts?.truePositives?.length === sample.accounts.length}`);
    console.log(`network_requests=0`);
    return;
  }

  // mode === "execute" — camino real. Requiere --execute explícito (ver
  // parseArgs arriba). Por cada combinación arma el prompt correspondiente,
  // llama al proveedor, y anota provider/model/task/fixture/run_number/
  // tokens/latencia/costo/stopReason|responseStatus/scoring.
  for (const combo of combos) {
    const fixture = findFixture(combo.fixtureId);
    const { systemPrompt, prompt, maxTokens } = buildUserPrompt(combo.task, fixture.source_text);
    const result = await callProvider(combo.provider, systemPrompt, prompt, maxTokens);
    const scored = scoreCombination(combo, result.text);
    const costUsd = estimateCostUsd(combo.provider, result.model, result.inputTokens, result.outputTokens);
    console.log(JSON.stringify({ ...combo, ...result, costUsd, scored }));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
