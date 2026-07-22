import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.113.0";

// Reemplaza el antiguo Lovable AI Gateway (ai.gateway.lovable.dev) — llama directo
// a la API de Anthropic. Requiere ANTHROPIC_API_KEY en las variables de entorno
// de la Edge Function. Devuelve "__RATE_LIMITED__" si Anthropic responde 429,
// o null si falta la key, hay otro error, o la respuesta no trae texto.
export async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000,
): Promise<string | null> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return null;

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = message.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text : null;
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return "__RATE_LIMITED__";
    console.error("Anthropic call error:", e);
    return null;
  }
}
