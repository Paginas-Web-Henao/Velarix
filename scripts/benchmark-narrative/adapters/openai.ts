// Adapter LOCAL de OpenAI para el benchmark narrativo — Responses API,
// fetch crudo, sin SDK. Exclusivo de este harness: NO importa
// supabase/functions/_shared/parse-document-ai-provider.ts (ese módulo es
// la ruta productiva de parse-document, con su propia decisión de modelo
// ya cerrada por benchmark — ver su cabecera).
//
// Reglas duras de este adapter (FASE 1E/Subbloque 2, Paso 2, sección 14):
// - NUNCA lee `OPENAI_PARSE_MODEL` ni `PARSE_AI_PROVIDER` — el modelo
//   siempre llega como parámetro `model` explícito, resuelto por el
//   runner desde `OPENAI_BENCHMARK_MODEL` (sin default: la pareja
//   modelo/proveedor de narrativa no está decidida todavía).
// - NO se envía `reasoning.effort` — a diferencia de
//   `callOpenAiParse` (producción) y del adapter de parse-document del
//   otro harness, que sí fijan `effort:"none"` por una decisión de
//   benchmark específica de esa tarea. Aquí se deja al modelo/API con su
//   comportamiento normal, para la primera versión de este benchmark.
//
// Fail-closed: si falta OPENAI_API_KEY y/o `model`, se devuelve
// errorCode="NOT_CONFIGURED" SIN llamar a fetch.

import type { AdapterCallResult } from "../types.ts";
import { buildNotConfiguredResult } from "../types.ts";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

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
  usage?: { input_tokens?: number; output_tokens?: number; output_tokens_details?: { reasoning_tokens?: number } };
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

export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  model: string | undefined,
): Promise<AdapterCallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const missing: string[] = [];
  if (!apiKey) missing.push("OPENAI_API_KEY");
  if (!model) missing.push("OPENAI_BENCHMARK_MODEL");
  if (missing.length > 0) return buildNotConfiguredResult("openai", model, missing);

  const start = Date.now();
  try {
    const resp = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        instructions: systemPrompt,
        input: userPrompt,
        max_output_tokens: maxTokens,
      }),
    });
    const latencyMs = Date.now() - start;
    const data: OpenAIResponsesResponse = await resp.json();
    const responseStatus = data.status ?? null;
    const reasoningTokens = data.usage?.output_tokens_details?.reasoning_tokens ?? null;

    if (resp.status === 429) {
      return {
        provider: "openai", model: model as string, text: null,
        inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null,
        latencyMs, success: false, rateLimited: true, errorCode: "RATE_LIMITED",
        errorMessage: data.error?.message ?? "HTTP 429", responseStatus, reasoningTokens,
      };
    }

    if (!resp.ok) {
      return {
        provider: "openai", model: model as string, text: null,
        inputTokens: null, outputTokens: null, latencyMs, success: false, rateLimited: false,
        errorCode: `HTTP_${resp.status}`, errorMessage: data.error?.message ?? "error desconocido",
        responseStatus, reasoningTokens,
      };
    }

    const text = extractOpenAiText(data.output);

    if (responseStatus === "incomplete") {
      const reason = data.incomplete_details?.reason ?? "razón no especificada";
      return {
        provider: "openai", model: model as string, text,
        inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null,
        latencyMs, success: false, rateLimited: false, errorCode: "INCOMPLETE",
        errorMessage: `respuesta incompleta: ${reason}`, responseStatus, reasoningTokens,
      };
    }

    return {
      provider: "openai", model: model as string, text,
      inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null,
      latencyMs, success: text != null, rateLimited: false,
      errorCode: text != null ? null : "NO_TEXT_IN_RESPONSE",
      errorMessage: text != null ? null : "la respuesta no trae ningún output_text",
      responseStatus, reasoningTokens,
    };
  } catch (e) {
    return {
      provider: "openai", model: model as string, text: null,
      inputTokens: null, outputTokens: null, latencyMs: Date.now() - start,
      success: false, rateLimited: false, errorCode: "NETWORK_ERROR",
      errorMessage: e instanceof Error ? e.message : String(e), responseStatus: null, reasoningTokens: null,
    };
  }
}
