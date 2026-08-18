// Estimación de costo USD — SOLO con precios de fuentes oficiales
// verificadas, nunca inventados. Si el modelo configurado no está en la
// tabla, se devuelve `null` en vez de adivinar un número.
//
// Precios verificados: 2026-08-17. Son precios short-context/base del API
// directo (primer partido). Los fixtures de este benchmark son pequeños
// — no entramos en long-context pricing. NO se modela caching todavía, NO
// se modela batch todavía, NO se modelan promociones históricas.

export interface PricePerMillion {
  inputUsd: number;
  outputUsd: number;
}

/**
 * Precios oficiales de la Claude API (primer partido), verificados
 * 2026-08-17. NO incluye precios de terceros (Bedrock/Vertex/Foundry, que
 * son operados por el partner con precios propios).
 *
 * `claude-sonnet-5` corregido a 2/10 (reemplaza la tabla anterior de
 * 3/15, que no aplicaba al pilot actual).
 */
export const ANTHROPIC_PRICING: Record<string, PricePerMillion> = {
  "claude-fable-5": { inputUsd: 10.0, outputUsd: 50.0 },
  "claude-mythos-5": { inputUsd: 10.0, outputUsd: 50.0 },
  "claude-opus-5": { inputUsd: 5.0, outputUsd: 25.0 },
  "claude-opus-4-8": { inputUsd: 5.0, outputUsd: 25.0 },
  "claude-opus-4-7": { inputUsd: 5.0, outputUsd: 25.0 },
  "claude-opus-4-6": { inputUsd: 5.0, outputUsd: 25.0 },
  "claude-sonnet-5": { inputUsd: 2.0, outputUsd: 10.0 },
  "claude-sonnet-4-6": { inputUsd: 3.0, outputUsd: 15.0 },
  "claude-haiku-4-5": { inputUsd: 1.0, outputUsd: 5.0 },
};

/**
 * Precios oficiales de la OpenAI API, verificados 2026-08-17. Se incluyen
 * únicamente los dos modelos necesarios para el pilot actual. "Luna" no se
 * incluye — no se verificó su fuente oficial vigente y no es necesario
 * para este pilot; agregarlo requiere verificación explícita, no se
 * adivina.
 */
export const OPENAI_PRICING: Record<string, PricePerMillion> = {
  "gpt-5.6-terra": { inputUsd: 2.0, outputUsd: 12.0 },
  "gpt-5.6-sol": { inputUsd: 5.0, outputUsd: 30.0 },
};

export function estimateCostUsd(
  provider: "anthropic" | "openai",
  model: string,
  inputTokens: number | null,
  outputTokens: number | null,
): number | null {
  if (inputTokens === null || outputTokens === null) return null;
  const table = provider === "anthropic" ? ANTHROPIC_PRICING : OPENAI_PRICING;
  const price = table[model];
  if (!price) return null;
  return (inputTokens / 1_000_000) * price.inputUsd + (outputTokens / 1_000_000) * price.outputUsd;
}
