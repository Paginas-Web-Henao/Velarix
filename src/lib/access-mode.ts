// Single-owner private mode (ADR-008).
//
// Velarix es un workbench privado de un solo owner: no hay login, registro
// ni recuperación de contraseña en el flujo normal. La identidad de
// Supabase (JWT del owner) se conserva porque RLS, Storage y las Edge
// Functions dependen de `auth.uid()` — lo que desaparece es la fricción,
// no la seguridad.
//
// Dos estados:
// - LOCAL_PRIVATE: servidor de desarrollo de Vite en loopback. La sesión
//   del owner la inicia el propio servidor (plugin `vite/owner-session.ts`)
//   con credenciales que solo existen server-side. Sin interacción.
// - DEPLOYED_PRIVATE: cualquier otra cosa (build de producción, Vercel,
//   acceso por IP de red). No existe endpoint de sesión automática; el
//   owner debe desbloquear con su cuenta de Supabase. Fail closed.
//
// Módulo puro: sin imports de Supabase, DOM ni Node — lo usan el
// frontend y el plugin de Vite por igual. Las reglas que solo aplica el
// servidor local viven en `vite/owner-session-guards.ts` (fuera del bundle).

export type AccessMode = "local_private" | "deployed_private";

/** Ruta del endpoint de sesión del owner (solo existe en `vite dev`). */
export const OWNER_SESSION_PATH = "/__velarix/owner-session";
/** Header obligatorio: obliga a un preflight CORS en cualquier petición cross-origin (que nunca se aprueba). */
export const OWNER_SESSION_HEADER = "x-velarix-owner";

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

export function isLoopbackHostname(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  return LOOPBACK_HOSTNAMES.has(hostname.toLowerCase());
}

export function isLoopbackAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  return LOOPBACK_ADDRESSES.has(address);
}

/** Extrae el hostname de un header `Host` (`localhost:8080`, `[::1]:8080`). */
export function hostnameFromHostHeader(host: string | null | undefined): string | null {
  if (!host) return null;
  try {
    return new URL(`http://${host}`).hostname;
  } catch {
    return null;
  }
}

/**
 * Modo de acceso del frontend. LOCAL_PRIVATE solo si el bundle es de
 * desarrollo (`import.meta.env.DEV`) **y** se abrió desde loopback.
 * Cualquier otra combinación → DEPLOYED_PRIVATE.
 */
export function resolveAccessMode(input: { isDevBuild: boolean; hostname: string | null | undefined }): AccessMode {
  return input.isDevBuild && isLoopbackHostname(input.hostname) ? "local_private" : "deployed_private";
}
