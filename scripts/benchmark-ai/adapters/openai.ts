// Adaptador OpenAI para el benchmark — fetch crudo, sin SDK (ninguno está
// instalado en el repo; no se agregó ninguno para esta tarea).
//
// Usa la Responses API (`POST /v1/responses`), NO Chat Completions —
// requerido para el pilot de GPT-5.6. El modelo siempre viene de
// OPENAI_BENCHMARK_MODEL, nunca hardcodeado.
//
// Para el PRIMER pilot se envía razonamiento explícitamente deshabilitado
// (`reasoning: {effort: "none"}`). Si `status` es "incomplete", NO se
// trata como success silencioso — se registra como error/categoría de
// truncamiento explícita.
//
// NO se llama a la red durante --dry-run: si falta OPENAI_API_KEY o
// OPENAI_BENCHMARK_MODEL, se devuelve un ProviderResult con `error` sin
// intentar el fetch.

import type { ProviderResult } from "../types.ts";

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
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    output_tokens_details?: { reasoning_tokens?: number };
  };
  error?: { message?: string };
}

function extractText(output: OpenAIResponsesOutputItem[] | undefined): string | null {
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
): Promise<ProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_BENCHMARK_MODEL;

  if (!apiKey) {
    return { provider: "openai", model: model ?? "(sin configurar)", text: null, inputTokens: null, outputTokens: null, latencyMs: 0, error: "OPENAI_API_KEY no configurada — pendiente antes de la primera llamada real", responseStatus: null, reasoningTokens: null };
  }
  if (!model) {
    return { provider: "openai", model: "(sin configurar)", text: null, inputTokens: null, outputTokens: null, latencyMs: 0, error: "OPENAI_BENCHMARK_MODEL no configurada — la pareja modelo/proveedor del pilot aún no se decide en esta tarea", responseStatus: null, reasoningTokens: null };
  }

  const start = Date.now();
  try {
    const resp = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: systemPrompt,
        input: userPrompt,
        max_output_tokens: maxTokens,
        reasoning: { effort: "none" },
      }),
    });
    const latencyMs = Date.now() - start;
    const data: OpenAIResponsesResponse = await resp.json();
    const responseStatus = data.status ?? null;
    const reasoningTokens = data.usage?.output_tokens_details?.reasoning_tokens ?? null;

    if (!resp.ok) {
      return { provider: "openai", model, text: null, inputTokens: null, outputTokens: null, latencyMs, error: `HTTP ${resp.status}: ${data.error?.message ?? "error desconocido"}`, responseStatus, reasoningTokens };
    }

    const text = extractText(data.output);

    // status="incomplete" NUNCA es success silencioso — se registra como
    // condición de truncamiento explícita, con el texto parcial disponible
    // (si lo hay) para inspección, no como un resultado limpio.
    if (responseStatus === "incomplete") {
      const reason = data.incomplete_details?.reason ?? "razón no especificada";
      return { provider: "openai", model, text, inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null, latencyMs, error: `incomplete: ${reason}`, responseStatus, reasoningTokens };
    }

    return {
      provider: "openai",
      model,
      text,
      inputTokens: data.usage?.input_tokens ?? null,
      outputTokens: data.usage?.output_tokens ?? null,
      latencyMs,
      error: null,
      responseStatus,
      reasoningTokens,
    };
  } catch (e) {
    return { provider: "openai", model, text: null, inputTokens: null, outputTokens: null, latencyMs: Date.now() - start, error: e instanceof Error ? e.message : String(e), responseStatus: null, reasoningTokens: null };
  }
}
