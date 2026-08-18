// Adaptador Anthropic para el benchmark — fetch crudo, sin SDK (no se
// instaló ningún SDK para esta tarea). Detalles de la Messages API
// verificados contra la skill claude-api antes de escribir esto (no
// inventados): endpoint, headers, shape de request/response, campos de
// usage.
//
// NO se llama a la red durante --dry-run: si falta ANTHROPIC_API_KEY o
// ANTHROPIC_BENCHMARK_MODEL, se devuelve un ProviderResult con `error` sin
// intentar el fetch.
//
// PRIMER PILOT SIN THINKING: para el camino real de este adaptador se
// envía explícitamente `thinking: {type: "disabled"}`, para no depender
// del default de Sonnet 5 (adaptive thinking, activado por defecto) y
// comparar extracción directa sin hidden reasoning. Esto aplica
// ÚNICAMENTE a este adaptador de benchmark — NO se modifica
// `supabase/functions/_shared/anthropic-client.ts` (producción).

import type { ProviderResult } from "../types.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

interface AnthropicTextBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicTextBlock[];
  usage?: { input_tokens?: number; output_tokens?: number };
  stop_reason?: string;
  error?: { message?: string; type?: string };
}

export async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<ProviderResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_BENCHMARK_MODEL;

  if (!apiKey) {
    return { provider: "anthropic", model: model ?? "(sin configurar)", text: null, inputTokens: null, outputTokens: null, latencyMs: 0, error: "ANTHROPIC_API_KEY no configurada — pendiente antes de la primera llamada real", stopReason: null };
  }
  if (!model) {
    return { provider: "anthropic", model: "(sin configurar)", text: null, inputTokens: null, outputTokens: null, latencyMs: 0, error: "ANTHROPIC_BENCHMARK_MODEL no configurada — la pareja modelo/proveedor del pilot aún no se decide en esta tarea", stopReason: null };
  }

  const start = Date.now();
  try {
    const resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        thinking: { type: "disabled" },
      }),
    });
    const latencyMs = Date.now() - start;
    const data: AnthropicResponse = await resp.json();
    const stopReason = data.stop_reason ?? null;

    if (!resp.ok) {
      return { provider: "anthropic", model, text: null, inputTokens: null, outputTokens: null, latencyMs, error: `HTTP ${resp.status}: ${data.error?.message ?? "error desconocido"}`, stopReason };
    }

    // refusal y max_tokens se registran como condición explícita, no como
    // success silencioso — el texto puede venir vacío o incompleto.
    if (stopReason === "refusal") {
      return { provider: "anthropic", model, text: null, inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null, latencyMs, error: "refusal (clasificador de seguridad de Anthropic)", stopReason };
    }
    if (stopReason === "max_tokens") {
      const textBlock = (data.content ?? []).find((b) => b.type === "text");
      return { provider: "anthropic", model, text: textBlock?.text ?? null, inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null, latencyMs, error: "max_tokens (respuesta truncada por el límite de tokens)", stopReason };
    }

    const textBlock = (data.content ?? []).find((b) => b.type === "text");
    return {
      provider: "anthropic",
      model,
      text: textBlock?.text ?? null,
      inputTokens: data.usage?.input_tokens ?? null,
      outputTokens: data.usage?.output_tokens ?? null,
      latencyMs,
      error: null,
      stopReason,
    };
  } catch (e) {
    return { provider: "anthropic", model, text: null, inputTokens: null, outputTokens: null, latencyMs: Date.now() - start, error: e instanceof Error ? e.message : String(e), stopReason: null };
  }
}
