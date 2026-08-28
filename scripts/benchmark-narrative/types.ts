// Tipos base del harness de benchmark narrativo (Anthropic vs OpenAI) para
// generate-narrative. Módulo puro — sin red, sin SDKs, sin efectos
// secundarios. Vive fuera de supabase/functions/_shared/ deliberadamente:
// nada aquí se despliega ni se usa en producción (ver FASE 1E/Subbloque 2,
// Paso 2 — HEAD base c34f964).
//
// Aislamiento (ver README de la tarea que originó este harness): este
// directorio no puede ser importado por código productivo, y código
// productivo no depende de él. Puede importar módulos PUROS de
// `supabase/functions/_shared/` (p.ej. narrative-calculation-adapter.ts)
// del mismo modo que scripts/benchmark-ai/runner.ts ya importa
// `_shared/parse-document-prompts.ts` — la dirección de dependencia es
// siempre benchmark -> producción, nunca al revés.
//
// Distinto dominio que scripts/benchmark-ai/ (que es el harness YA
// EXISTENTE para parse-document — Terra vs Sonnet 5 low). Este harness es
// independiente y no introduce acoplamiento semántico con las tareas de
// parse-document; solo reutiliza `scripts/benchmark-ai/pricing.ts` para
// estimación de costo (permitido explícitamente).

/** Las 5 tareas reales de IA que usa generate-narrative, evaluadas por separado (liquidity/efficiency/multiples quedan fuera — `not_available`, sin AI call en producción). */
export type BenchmarkTask =
  | "executive_summary"
  | "profitability_analysis"
  | "valuation_analysis"
  | "conclusion"
  | "narrative_audit";

export const BENCHMARK_TASKS: readonly BenchmarkTask[] = [
  "executive_summary",
  "profitability_analysis",
  "valuation_analysis",
  "conclusion",
  "narrative_audit",
];

export type Provider = "anthropic" | "openai";

export const PROVIDERS: readonly Provider[] = ["anthropic", "openai"];

export type FixtureId = "CASE_A_MODERATE" | "CASE_B_FINANCIAL_STRESS" | "CASE_C_INCOMPLETE_EVIDENCE";

export const FIXTURE_IDS: readonly FixtureId[] = [
  "CASE_A_MODERATE",
  "CASE_B_FINANCIAL_STRESS",
  "CASE_C_INCOMPLETE_EVIDENCE",
];

/** Código de error fail-closed cuando falta key y/o modelo — nunca se usa un fallback silencioso. */
export type NotConfiguredCode = "NOT_CONFIGURED";

/**
 * Resultado uniforme de un adapter — la interfaz mínima común entre
 * Anthropic y OpenAI. `text` es la respuesta cruda tal como el modelo la
 * devolvió; el scoring vive en scoring.ts, no aquí.
 *
 * Campos específicos de un solo proveedor (`reasoningTokens`/
 * `responseStatus` de OpenAI Responses API, `stopReason` de Anthropic
 * Messages API) son opcionales — no se inventan campos genéricos que no
 * correspondan a ninguna API real. Si la API no devuelve un dato, el campo
 * queda `null`, nunca se adivina.
 */
export interface AdapterCallResult {
  provider: Provider;
  model: string;
  text: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  success: boolean;
  rateLimited: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  reasoningTokens?: number | null;
  responseStatus?: string | null;
  stopReason?: string | null;
}

/** `AdapterCallResult` + contexto de la combinación + métricas derivadas que arma el runner (nunca el adapter). */
export interface ProviderResult extends AdapterCallResult {
  task: BenchmarkTask;
  fixtureId: FixtureId;
  inputChars: number;
  outputChars: number;
  estimatedCostUsd: number | null;
}

/** Firma común de un adapter — implementada por adapters/anthropic.ts y adapters/openai.ts. El modelo se recibe SIEMPRE explícito (nunca se lee un default ni se infiere) — quien resuelve `process.env.*_BENCHMARK_MODEL` es el runner, no el adapter. */
export type ProviderAdapter = (
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  model: string | undefined,
) => Promise<AdapterCallResult>;

/**
 * Construye el resultado NOT_CONFIGURED común a ambos adapters — se usa
 * antes de tocar red en cualquier combinación de key/modelo ausente.
 * `missing` lista explícitamente qué falta (nunca un mensaje genérico
 * "algo falta" sin decir qué).
 */
export function buildNotConfiguredResult(provider: Provider, model: string | undefined, missing: readonly string[]): AdapterCallResult {
  return {
    provider,
    model: model ?? "(sin configurar)",
    text: null,
    inputTokens: null,
    outputTokens: null,
    latencyMs: 0,
    success: false,
    rateLimited: false,
    errorCode: "NOT_CONFIGURED",
    errorMessage: `Configuración incompleta — falta: ${missing.join(", ")}.`,
  };
}
