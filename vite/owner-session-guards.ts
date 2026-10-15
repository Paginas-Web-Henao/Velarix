// Single-owner private mode (ADR-008) — reglas del servidor local.
//
// Solo las importa el plugin `vite/owner-session.ts` (Node). Viven fuera
// de `src/` para que ni los nombres de las credenciales del owner lleguen
// al bundle del navegador.
import {
  OWNER_SESSION_HEADER,
  hostnameFromHostHeader,
  isLoopbackAddress,
  isLoopbackHostname,
} from "../src/lib/access-mode";

export interface OwnerBootstrapConfig {
  /** `server.host` de Vite (`undefined` = valor por defecto de Vite, `localhost`). */
  serverHost: string | boolean | undefined;
  env: Record<string, string | undefined>;
}

export type OwnerBootstrapDecision =
  | { enabled: true }
  | { enabled: false; reason: "production_env" | "network_exposed" | "missing_credentials" };

/**
 * ¿Puede el servidor de desarrollo activar el endpoint de sesión del
 * owner? Fail closed: cualquier señal de producción, un servidor expuesto
 * a la red o credenciales incompletas lo desactivan.
 */
export function decideOwnerBootstrap({ serverHost, env }: OwnerBootstrapConfig): OwnerBootstrapDecision {
  if (env.NODE_ENV === "production" || env.VERCEL || env.CI) {
    return { enabled: false, reason: "production_env" };
  }
  if (serverHost === true || (typeof serverHost === "string" && !isLoopbackHostname(serverHost))) {
    return { enabled: false, reason: "network_exposed" };
  }
  if (!env.VELARIX_OWNER_EMAIL || !env.VELARIX_OWNER_PASSWORD || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    return { enabled: false, reason: "missing_credentials" };
  }
  return { enabled: true };
}

export interface OwnerSessionRequest {
  method: string | undefined;
  remoteAddress: string | null | undefined;
  headers: Record<string, string | string[] | undefined>;
}

const header = (h: OwnerSessionRequest["headers"], name: string): string | undefined => {
  const v = h[name];
  return Array.isArray(v) ? v[0] : v;
};

/**
 * Filtro por petición del endpoint de sesión. Solo acepta: POST, desde
 * loopback, con `Host` loopback (anti DNS-rebinding), mismo origen
 * (`Origin` loopback si viene, `Sec-Fetch-Site` same-origin si viene) y
 * con el header propio (fuerza preflight CORS en peticiones ajenas).
 */
export function isOwnerSessionRequestAllowed(req: OwnerSessionRequest): boolean {
  if (req.method !== "POST") return false;
  if (!isLoopbackAddress(req.remoteAddress)) return false;
  if (!isLoopbackHostname(hostnameFromHostHeader(header(req.headers, "host")))) return false;
  if (header(req.headers, OWNER_SESSION_HEADER) !== "1") return false;

  const origin = header(req.headers, "origin");
  if (origin !== undefined) {
    try {
      if (!isLoopbackHostname(new URL(origin).hostname)) return false;
    } catch {
      return false;
    }
  }
  const fetchSite = header(req.headers, "sec-fetch-site");
  if (fetchSite !== undefined && fetchSite !== "same-origin") return false;
  return true;
}
