// Tipos base del harness de benchmark OpenAI vs Anthropic para parse-document.
// Módulo puro — sin dependencias de red, sin SDKs, sin efectos secundarios.
// Vive fuera de supabase/functions/_shared/ deliberadamente: nada aquí se
// despliega ni se usa en producción. Ver CORRECCIÓN DE DISEÑO 2 de la tarea
// que originó este harness.

/** Las 3 tareas reales de IA que usa parse-document, evaluadas por separado. */
export type BenchmarkTask = "document_classifier" | "period_detector" | "parser_fallback";

export const BENCHMARK_TASKS: readonly BenchmarkTask[] = [
  "document_classifier",
  "period_detector",
  "parser_fallback",
];

export type Provider = "anthropic" | "openai";

export const PROVIDERS: readonly Provider[] = ["anthropic", "openai"];

/**
 * Resultado uniforme de una llamada a un proveedor — la interfaz mínima
 * común entre adaptadores. `text` es la respuesta cruda tal como el modelo
 * la devolvió (antes de cualquier extractJSON/normalización); el scoring
 * vive en scoring.ts, no aquí.
 *
 * `reasoningTokens`/`responseStatus` (OpenAI Responses API) y `stopReason`
 * (Anthropic Messages API) son opcionales porque solo aplican a un
 * proveedor cada uno — no se inventan campos genéricos que no correspondan
 * a ninguna API real.
 */
export interface ProviderResult {
  provider: Provider;
  model: string;
  text: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  error: string | null;
  /** Solo OpenAI Responses API: usage.output_tokens_details.reasoning_tokens, si existe. */
  reasoningTokens?: number | null;
  /** Solo OpenAI Responses API: response.status ("completed", "incomplete", etc.). */
  responseStatus?: string | null;
  /** Solo Anthropic Messages API: response.stop_reason. */
  stopReason?: string | null;
}

/** Firma común de un adaptador — implementada por adapters/anthropic.ts y adapters/openai.ts. */
export type ProviderAdapter = (
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
) => Promise<ProviderResult>;
