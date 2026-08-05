// Bloque 1D — corrección de credenciales (2026-07-30).
//
// Incidente: la legacy `service_role` key quedó expuesta en un output de
// consola durante una sesión anterior de operaciones. Se trata como
// comprometida. Las Edge Functions administrativas (`ejecutar-calculo`,
// `continuar-tras-revision`) dejan de leer `SUPABASE_SERVICE_ROLE_KEY` y
// pasan a usar la secret key `default` que Supabase inyecta en
// `SUPABASE_SECRET_KEYS` (JSON), el mecanismo vigente de API keys.
//
// Sin imports de URL, sin efectos secundarios más allá de leer
// `Deno.env` — no imprime ni registra el valor de la key en ningún caso,
// ni siquiera en los mensajes de error (que son deliberadamente
// genéricos, seguros para exponer tal cual al cliente si el llamador no
// los intercepta).

/**
 * Resuelve la secret key administrativa `default` desde
 * `SUPABASE_SECRET_KEYS`. Lanza un error técnico seguro (sin detalles
 * internos) si la variable falta, no es JSON válido, o no contiene la
 * key `default`.
 */
export function resolveAdminSecretKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) {
    throw new Error("Configuración de servidor incompleta: falta la clave administrativa.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Configuración de servidor incompleta: clave administrativa inválida.");
  }

  const key = (parsed as Record<string, unknown> | null)?.default;
  if (typeof key !== "string" || key.length === 0) {
    throw new Error("Configuración de servidor incompleta: falta la clave administrativa por defecto.");
  }

  return key;
}
