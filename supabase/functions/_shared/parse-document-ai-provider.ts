// Selección de proveedor + adapter OpenAI para las 3 llamadas de IA de
// parse-document (classifier, period_detector, parser_fallback) —
// decisión cerrada tras el benchmark controlado Terra vs Sonnet 5 (ver
// commits 5b27fb2 "fix: preserve AI fallback periods" y d923883 "feat:
// add discriminant AI benchmark fixture"). CLEAN/NOISY/HARD no mostraron
// diferencia material entre Terra y Sonnet 5; se elige Terra por menor
// costo en las rondas comparables. Sonnet 5 low queda como alternativa
// evaluada, no como fallback automático.
//
// Módulo puro en su lógica de configuración (resolveParseAiConfig): sin
// Deno, sin red — para poder probarlo con Vitest. La única función que
// toca red (callOpenAiParse) usa fetch, pero no se ejecuta en los tests;
// solo se prueba resolveParseAiConfig(), que corre SIEMPRE antes de
// cualquier fetch (fail-closed).
//
// Deliberadamente NO importa ../_shared/anthropic-client.ts aquí: ese
// import trae el SDK de Anthropic vía URL de esm.sh, que bloquea la
// carga del módulo en Vitest (mismo problema ya documentado para
// parse-document/index.ts en otros módulos de este directorio). El
// dispatch entre proveedores (callAnthropic vs callOpenAiParse) vive en
// parse-document/index.ts, que ya es Deno-only y no se prueba de forma
// directa — anthropic-client.ts NO se modifica: es compartido con
// map-accounts y generate-narrative, fuera de alcance de esta tarea.
//
// Selección EXPLÍCITA vía PARSE_AI_PROVIDER — sin default implícito, sin
// inferir el proveedor por existencia de una key, sin fallback
// automático entre proveedores, sin llamar a los dos.

export type ParseAiProvider = "anthropic" | "openai";

const SUPPORTED_PROVIDERS: readonly ParseAiProvider[] = ["anthropic", "openai"];

function isSupportedProvider(value: string | undefined): value is ParseAiProvider {
  return value !== undefined && (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

/** Falla cerrada de configuración — siempre antes de cualquier llamada de red. Nunca se loguea ningún valor de key, solo el mensaje genérico. */
export class ParseAiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseAiConfigError";
  }
}

export interface ParseAiEnvInput {
  provider: string | undefined;
  openaiApiKey: string | undefined;
  openaiModel: string | undefined;
}

export type ResolvedParseAiConfig = { provider: "anthropic" } | { provider: "openai"; openaiApiKey: string; openaiModel: string };

/**
 * Decide el proveedor a partir de `PARSE_AI_PROVIDER` — sin default
 * implícito. Falla cerrado (lanza `ParseAiConfigError`, SIN tocar red) si:
 * - el proveedor no es "anthropic" ni "openai" (incluye no configurado);
 * - provider=openai y falta OPENAI_API_KEY o OPENAI_PARSE_MODEL.
 *
 * El camino "anthropic" NO valida aquí ANTHROPIC_API_KEY — esa
 * validación ya existe, sin cambios, dentro de `callAnthropic()`
 * (anthropic-client.ts). Duplicarla aquí arriesgaría que las dos
 * validaciones diverjan; el caller (parse-document/index.ts) sigue
 * comprobando esa key explícitamente antes de proceder, igual que hacía
 * antes de este cambio.
 */
export function resolveParseAiConfig(env: ParseAiEnvInput): ResolvedParseAiConfig {
  if (!isSupportedProvider(env.provider)) {
    throw new ParseAiConfigError(
      `PARSE_AI_PROVIDER debe ser uno de: ${SUPPORTED_PROVIDERS.join(", ")} (recibido: ${JSON.stringify(env.provider)}). Configuración requerida explícitamente, sin valor por defecto.`,
    );
  }
  if (env.provider === "anthropic") {
    return { provider: "anthropic" };
  }
  if (!env.openaiApiKey) {
    throw new ParseAiConfigError("PARSE_AI_PROVIDER=openai requiere OPENAI_API_KEY configurada.");
  }
  if (!env.openaiModel) {
    throw new ParseAiConfigError("PARSE_AI_PROVIDER=openai requiere OPENAI_PARSE_MODEL configurada.");
  }
  return { provider: "openai", openaiApiKey: env.openaiApiKey, openaiModel: env.openaiModel };
}

// ── OpenAI (Terra) — Responses API ──
// Mismo contrato de request ya validado en
// scripts/benchmark-ai/adapters/openai.ts (POST /v1/responses,
// reasoning.effort, output_text) — reimplementado aquí sin importar el
// harness (ese código es del benchmark, no de producción) y sin SDK
// (ninguno está instalado, igual que el adapter del benchmark).
//
// reasoning.effort=none queda FIJO en código: es la decisión ya cerrada
// del benchmark (Terra, reasoning.effort=none, primary provisional), no
// una perilla de configuración por request.

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_REASONING_EFFORT = "none";

interface OpenAIResponsesContentItem {
  type?: string;
  text?: string;
}
interface OpenAIResponsesOutputItem {
  type?: string;
  content?: OpenAIResponsesContentItem[];
}
interface OpenAIResponsesResponse {
  status?: string;
  incomplete_details?: { reason?: string };
  output?: OpenAIResponsesOutputItem[];
  error?: { message?: string };
}

function extractOpenAiText(output: OpenAIResponsesOutputItem[] | undefined): string | null {
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const block of item.content) {
      if (block.type === "output_text" && typeof block.text === "string") return block.text;
    }
  }
  return null;
}

/**
 * Llama a Terra vía Responses API. Devuelve texto plano compatible con
 * `extractJSON()` — mismo contrato de salida que `callAnthropic()`
 * (string | null) para que los 3 call sites de parse-document/index.ts
 * no cambien de forma. Nunca lanza por condiciones de red/HTTP (devuelve
 * null y registra el error) — la configuración faltante ya se validó en
 * `resolveParseAiConfig()` antes de llegar aquí, así que este punto solo
 * ve fallos de red/API genuinos, no errores de configuración.
 */
export async function callOpenAiParse(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  config: { openaiApiKey: string; openaiModel: string },
): Promise<string | null> {
  try {
    const resp = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.openaiApiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: config.openaiModel,
        instructions: systemPrompt,
        input: userPrompt,
        max_output_tokens: maxTokens,
        reasoning: { effort: OPENAI_REASONING_EFFORT },
      }),
    });
    const data: OpenAIResponsesResponse = await resp.json();
    if (!resp.ok) {
      console.error("callOpenAiParse: HTTP", resp.status, data.error?.message ?? "error desconocido");
      return null;
    }
    if (data.status === "incomplete") {
      console.error("callOpenAiParse: respuesta incompleta —", data.incomplete_details?.reason ?? "razón no especificada");
    }
    return extractOpenAiText(data.output);
  } catch (e) {
    console.error("callOpenAiParse: error de red —", e instanceof Error ? e.message : String(e));
    return null;
  }
}
