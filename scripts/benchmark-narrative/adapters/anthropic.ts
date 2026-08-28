// Adapter LOCAL de Anthropic para el benchmark narrativo — fetch crudo,
// sin SDK (mismo patrón técnico que scripts/benchmark-ai/adapters/anthropic.ts
// y que supabase/functions/_shared/anthropic-client.ts, pero SIN
// importar ninguno de los dos: este archivo es exclusivo del harness).
//
// Diferencia deliberada frente a scripts/benchmark-ai/adapters/anthropic.ts:
// el modelo se recibe como parámetro EXPLÍCITO (nunca se lee de
// process.env dentro del adapter) — el runner es quien resuelve
// ANTHROPIC_BENCHMARK_MODEL y lo pasa. Esto hace visible en cada call site
// si el modelo está configurado, en vez de que quede escondido dentro del
// adapter. Tampoco se envía ningún campo de "thinking"/"effort" — no se
// pidió para este benchmark narrativo (a diferencia del pilot de
// parse-document), así que se deja al modelo con su comportamiento normal,
// simétrico a la decisión de no fijar `reasoning.effort` en el adapter de
// OpenAI de este mismo harness.
//
// Fail-closed: si falta ANTHROPIC_API_KEY y/o `model`, se devuelve
// errorCode="NOT_CONFIGURED" SIN llamar a fetch. Nunca hay un modelo por
// defecto (ni siquiera el que usa producción, claude-opus-4-8) — ver
// FASE 1E/Subbloque 2, Paso 2, sección 3: "no asumir silenciosamente
// claude-opus-4-8 como modelo del benchmark".

import type { AdapterCallResult } from "../types.ts";
import { buildNotConfiguredResult } from "../types.ts";

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
  model: string | undefined,
): Promise<AdapterCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const missing: string[] = [];
  if (!apiKey) missing.push("ANTHROPIC_API_KEY");
  if (!model) missing.push("ANTHROPIC_BENCHMARK_MODEL");
  if (missing.length > 0) return buildNotConfiguredResult("anthropic", model, missing);

  const start = Date.now();
  try {
    const resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey as string,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const latencyMs = Date.now() - start;
    const data: AnthropicResponse = await resp.json();
    const stopReason = data.stop_reason ?? null;

    if (resp.status === 429) {
      return {
        provider: "anthropic", model: model as string, text: null,
        inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null,
        latencyMs, success: false, rateLimited: true, errorCode: "RATE_LIMITED",
        errorMessage: data.error?.message ?? "HTTP 429", stopReason,
      };
    }

    if (!resp.ok) {
      return {
        provider: "anthropic", model: model as string, text: null,
        inputTokens: null, outputTokens: null, latencyMs, success: false, rateLimited: false,
        errorCode: `HTTP_${resp.status}`, errorMessage: data.error?.message ?? "error desconocido", stopReason,
      };
    }

    const textBlock = (data.content ?? []).find((b) => b.type === "text");
    const text = textBlock?.text ?? null;

    // Hardening (FASE 1E/1E-hardening, evidencia de 2 benchmarks reales):
    // stop_reason="max_tokens" es un HTTP/API success pero NUNCA una
    // narrativa completa — 24/30 llamadas Anthropic terminaron así en la
    // segunda corrida, y varias quedaban reportadas como success=true pese
    // a estar truncadas. Se distingue explícitamente "HTTP/API success" de
    // "NARRATIVE COMPLETION success": con max_tokens, success siempre es
    // false y errorCode="INCOMPLETE", exista o no texto parcial. El texto
    // parcial (si lo hay) se preserva igual en `text` — nunca se descarta.
    if (stopReason === "max_tokens") {
      return {
        provider: "anthropic", model: model as string, text,
        inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null,
        latencyMs, success: false, rateLimited: false, errorCode: "INCOMPLETE",
        errorMessage: text != null
          ? "respuesta truncada por max_tokens — texto parcial preservado"
          : "respuesta truncada por max_tokens — sin texto",
        stopReason,
      };
    }

    return {
      provider: "anthropic", model: model as string, text,
      inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null,
      latencyMs, success: text != null, rateLimited: false,
      errorCode: text != null ? null : "NO_TEXT_IN_RESPONSE",
      errorMessage: text != null ? null : "la respuesta no trae ningún bloque de texto",
      stopReason,
    };
  } catch (e) {
    return {
      provider: "anthropic", model: model as string, text: null,
      inputTokens: null, outputTokens: null, latencyMs: Date.now() - start,
      success: false, rateLimited: false, errorCode: "NETWORK_ERROR",
      errorMessage: e instanceof Error ? e.message : String(e), stopReason: null,
    };
  }
}
