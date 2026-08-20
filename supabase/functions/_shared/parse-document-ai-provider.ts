// Selección de proveedor + adapter OpenAI para las 3 llamadas de IA de
// parse-document (classifier, period_detector, parser_fallback) —
// decisión cerrada tras el benchmark controlado Terra vs Sonnet 5 (ver
// commits 5b27fb2 "fix: preserve AI fallback periods" y d923883 "feat:
// add discriminant AI benchmark fixture"). CLEAN/NOISY/HARD no mostraron
// diferencia material entre Terra y Sonnet 5.
//
// CORRECCIÓN (fix: scope Terra provider to parse-document): fc88c11
// conectaba `PARSE_AI_PROVIDER=anthropic` a `callAnthropic()`
// (anthropic-client.ts), pero ese cliente tiene el modelo hardcodeado a
// `claude-opus-4-8` — NO es Sonnet 5 low, el modelo realmente
// benchmarkeado. Esa ruta habría desplegado un proveedor no validado por
// este benchmark bajo la apariencia de "la alternativa evaluada". Se
// corrige acotando el soporte productivo a UN solo proveedor: OpenAI/
// Terra. Sonnet 5 low sigue siendo la alternativa EVALUADA (ver D-11),
// pero no está conectada productivamente — no se mantiene una segunda
// ruta "por si acaso". Si evidencia futura obliga a reconsiderar Terra,
// Sonnet 5 se conecta entonces de forma explícita, con su modelo/effort
// correctos.
//
// Módulo puro en su lógica de configuración (resolveParseAiConfig): sin
// Deno, sin red — para poder probarlo con Vitest. La única función que
// toca red (callOpenAiParse) usa fetch, pero no se ejecuta en los tests;
// solo se prueba resolveParseAiConfig(), que corre SIEMPRE antes de
// cualquier fetch (fail-closed).
//
// Este módulo no importa ni depende de ../_shared/anthropic-client.ts —
// ese archivo permanece intacto y fuera de alcance, compartido con
// map-accounts y generate-narrative.
//
// Selección EXPLÍCITA vía PARSE_AI_PROVIDER=openai — sin default
// implícito, sin inferir el proveedor por existencia de una key, sin
// fallback automático, sin ninguna otra ruta de proveedor.

export type ParseAiProvider = "openai";

const SUPPORTED_PROVIDERS: readonly ParseAiProvider[] = ["openai"];

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

export interface ResolvedParseAiConfig {
  provider: "openai";
  openaiApiKey: string;
  openaiModel: string;
}

/**
 * Decide el proveedor a partir de `PARSE_AI_PROVIDER` — sin default
 * implícito. Falla cerrado (lanza `ParseAiConfigError`, SIN tocar red) si:
 * - el proveedor no es exactamente "openai" (incluye "anthropic",
 *   cualquier otro valor, y no configurado);
 * - falta OPENAI_API_KEY;
 * - falta OPENAI_PARSE_MODEL.
 *
 * "anthropic" NO es un proveedor soportado aquí — Sonnet 5 low es
 * alternativa evaluada en el benchmark (ver D-11), no una ruta
 * productiva conectada. Ver el comentario de cabecera del módulo.
 */
export function resolveParseAiConfig(env: ParseAiEnvInput): ResolvedParseAiConfig {
  if (!isSupportedProvider(env.provider)) {
    throw new ParseAiConfigError(
      `PARSE_AI_PROVIDER debe ser exactamente "openai" (recibido: ${JSON.stringify(env.provider)}). Sonnet 5/Anthropic no está conectado productivamente a parse-document — ver D-11. Configuración requerida explícitamente, sin valor por defecto.`,
    );
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
