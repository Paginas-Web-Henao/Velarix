// Bloque 1D — corrección de credenciales (2026-07-30).
//
// Incidente: la legacy `service_role` key quedó expuesta en un output de
// consola durante una sesión anterior de operaciones. Se trata como
// comprometida. Las Edge Functions administrativas (`ejecutar-calculo`,
// `continuar-tras-revision`) dejan de leer `SUPABASE_SERVICE_ROLE_KEY` y
// pasan a usar la secret key `default` que Supabase inyecta en
// `SUPABASE_SECRET_KEYS` (JSON), el mecanismo vigente de API keys.
//
// Corrección de autenticación mixta (misma fecha): estas dos funciones
// también dejan de leer `SUPABASE_ANON_KEY`/`SUPABASE_PUBLISHABLE_KEY`
// (variables legacy, singulares) para el cliente que verifica el JWT de
// un usuario real — pasan a usar la publishable key `default` de
// `SUPABASE_PUBLISHABLE_KEYS` (JSON), el equivalente no-administrativo
// de `SUPABASE_SECRET_KEYS`.
//
// Sin imports de URL, sin efectos secundarios más allá de leer
// `Deno.env` — no imprime ni registra el valor de ninguna key en ningún
// caso, ni siquiera en los mensajes de error (que son deliberadamente
// genéricos, seguros para exponer tal cual al cliente si el llamador no
// los intercepta).

function resolveDefaultKeyFrom(envVarName: string, humanLabel: string): string {
  const raw = Deno.env.get(envVarName);
  if (!raw) {
    throw new Error(`Configuración de servidor incompleta: falta la clave ${humanLabel}.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Configuración de servidor incompleta: clave ${humanLabel} inválida.`);
  }

  const key = (parsed as Record<string, unknown> | null)?.default;
  if (typeof key !== "string" || key.length === 0) {
    throw new Error(`Configuración de servidor incompleta: falta la clave ${humanLabel} por defecto.`);
  }

  return key;
}

/**
 * Resuelve la secret key administrativa `default` desde
 * `SUPABASE_SECRET_KEYS`. Lanza un error técnico seguro (sin detalles
 * internos) si la variable falta, no es JSON válido, o no contiene la
 * key `default`.
 */
export function resolveAdminSecretKey(): string {
  return resolveDefaultKeyFrom("SUPABASE_SECRET_KEYS", "administrativa");
}

/**
 * Resuelve la publishable key `default` desde `SUPABASE_PUBLISHABLE_KEYS`
 * — usada únicamente para construir el cliente que verifica el JWT de un
 * usuario real (`auth.getUser`), nunca para operaciones administrativas.
 * Mismo comportamiento de error seguro que `resolveAdminSecretKey`.
 */
export function resolvePublishableKey(): string {
  return resolveDefaultKeyFrom("SUPABASE_PUBLISHABLE_KEYS", "pública");
}
