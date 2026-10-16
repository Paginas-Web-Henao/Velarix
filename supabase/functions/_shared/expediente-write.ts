// Reglas puras del write path del Minimum Expediente (Edge Function `expediente`).
// Sin Supabase, sin Deno: importable desde Vitest.

/** Campos de actor que el body NUNCA puede fijar: los pone el servidor con el usuario autenticado. */
export const EXPEDIENTE_ACTOR_FIELDS = ["created_by", "generado_por", "generado_por_ia", "respondido_por", "respondido_at", "user_id"] as const;

/** Mismos roles que la RLS de las tablas del Expediente (migración 20260817140000). */
export const EXPEDIENTE_ROLES: readonly string[] = ["analyst", "admin"];

export const EXPEDIENTE_TEXT_MAX = 10_000;

export function normalizeExpedienteText(value: unknown, max = EXPEDIENTE_TEXT_MAX): { ok: true; value: string } | { ok: false; reason: string } {
  if (typeof value !== "string") return { ok: false, reason: "debe ser texto" };
  const v = value.trim();
  if (!v) return { ok: false, reason: "no puede estar vacío" };
  if (v.length > max) return { ok: false, reason: `supera ${max} caracteres` };
  return { ok: true, value: v };
}
