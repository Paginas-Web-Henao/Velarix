// Single-owner private mode (ADR-008) — lado servidor de LOCAL_PRIVATE.
//
// Plugin de Vite que solo existe en `vite dev` (`apply: "serve"`): nunca
// entra en `vite build`, ni en `vite preview`, ni en Vercel. Expone
// POST /__velarix/owner-session, que inicia sesión del owner en Supabase
// Auth **del lado servidor** y devuelve al navegador un JWT de usuario
// normal (RLS lo limita a sus propios datos).
//
// - Credenciales: `VELARIX_OWNER_EMAIL` / `VELARIX_OWNER_PASSWORD` en
//   `.env.local`, SIN prefijo `VITE_` → Vite nunca las mete en el bundle.
// - Nunca usa la secret key ni la service_role: solo la publishable key,
//   igual que un login normal desde el navegador.
// - Nunca registra ni imprime credenciales ni tokens.
// - Fail closed: si el servidor está expuesto a la red, hay señales de
//   producción o faltan credenciales, el endpoint no se registra y el
//   frontend cae en la barrera de desbloqueo (DEPLOYED_PRIVATE).
import type { Plugin } from "vite";
import { loadEnv } from "vite";
import { OWNER_SESSION_PATH } from "../src/lib/access-mode";
import { decideOwnerBootstrap, isOwnerSessionRequestAllowed } from "./owner-session-guards";

const REASONS: Record<string, string> = {
  production_env: "entorno de producción/CI detectado",
  network_exposed: "server.host no es loopback",
  missing_credentials: "faltan VELARIX_OWNER_EMAIL / VELARIX_OWNER_PASSWORD en .env.local",
};

export function ownerSessionPlugin(): Plugin {
  return {
    name: "velarix-owner-session",
    apply: "serve",
    configureServer(server) {
      const env = { ...process.env, ...loadEnv(server.config.mode, server.config.envDir || process.cwd(), "") };
      const decision = decideOwnerBootstrap({ serverHost: server.config.server.host, env });
      if (!decision.enabled) {
        server.config.logger.warn(`[velarix] LOCAL_PRIVATE desactivado (${REASONS[decision.reason]}). La app pedirá desbloqueo del owner.`);
        return;
      }

      const supabaseUrl = env.VITE_SUPABASE_URL!.replace(/\/+$/, "");
      const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY!;

      server.middlewares.use(OWNER_SESSION_PATH, async (req, res) => {
        const allowed = isOwnerSessionRequestAllowed({
          method: req.method,
          remoteAddress: req.socket.remoteAddress,
          headers: req.headers,
        });
        if (!allowed) {
          res.statusCode = 403;
          res.end();
          return;
        }

        try {
          const r = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: { apikey: publishableKey, "Content-Type": "application/json" },
            body: JSON.stringify({ email: env.VELARIX_OWNER_EMAIL, password: env.VELARIX_OWNER_PASSWORD }),
          });
          if (!r.ok) {
            server.config.logger.warn(`[velarix] Supabase rechazó la sesión del owner (HTTP ${r.status}).`);
            res.statusCode = 502;
            res.end();
            return;
          }
          const body = (await r.json()) as { access_token?: string; refresh_token?: string };
          if (!body.access_token || !body.refresh_token) {
            res.statusCode = 502;
            res.end();
            return;
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify({ access_token: body.access_token, refresh_token: body.refresh_token }));
        } catch {
          res.statusCode = 502;
          res.end();
        }
      });
    },
  };
}
