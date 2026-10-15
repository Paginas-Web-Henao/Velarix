// ADR-008 — el endpoint de sesión del owner solo se activa en loopback y
// en `vite dev`. Cualquier señal de despliegue o de exposición a la red
// lo desactiva (fail closed).
import { describe, it, expect } from "vitest";
import { OWNER_SESSION_HEADER } from "../src/lib/access-mode";
import { decideOwnerBootstrap, isOwnerSessionRequestAllowed, type OwnerSessionRequest } from "./owner-session-guards";

const CREDS = {
  VELARIX_OWNER_EMAIL: "owner@example.com",
  VELARIX_OWNER_PASSWORD: "x",
  VITE_SUPABASE_URL: "https://p.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
};

describe("decideOwnerBootstrap (fail closed)", () => {
  it("se activa solo en loopback con credenciales completas", () => {
    expect(decideOwnerBootstrap({ serverHost: "127.0.0.1", env: CREDS })).toEqual({ enabled: true });
    expect(decideOwnerBootstrap({ serverHost: undefined, env: CREDS })).toEqual({ enabled: true });
  });

  it.each([
    [{ ...CREDS, NODE_ENV: "production" }],
    [{ ...CREDS, VERCEL: "1" }],
    [{ ...CREDS, CI: "true" }],
  ])("señales de producción lo desactivan", (env) => {
    expect(decideOwnerBootstrap({ serverHost: "127.0.0.1", env })).toEqual({ enabled: false, reason: "production_env" });
  });

  it.each([true, "0.0.0.0", "::", "192.168.1.20"])("servidor expuesto a la red (%s) lo desactiva", (serverHost) => {
    expect(decideOwnerBootstrap({ serverHost, env: CREDS })).toEqual({ enabled: false, reason: "network_exposed" });
  });

  it("sin credenciales del owner no se activa", () => {
    expect(decideOwnerBootstrap({ serverHost: "127.0.0.1", env: { ...CREDS, VELARIX_OWNER_PASSWORD: undefined } }))
      .toEqual({ enabled: false, reason: "missing_credentials" });
  });
});

describe("isOwnerSessionRequestAllowed", () => {
  const ok: OwnerSessionRequest = {
    method: "POST",
    remoteAddress: "127.0.0.1",
    headers: { host: "localhost:8080", origin: "http://localhost:8080", "sec-fetch-site": "same-origin", [OWNER_SESSION_HEADER]: "1" },
  };

  it("acepta la petición same-origin del propio workbench", () => {
    expect(isOwnerSessionRequestAllowed(ok)).toBe(true);
    expect(isOwnerSessionRequestAllowed({ ...ok, remoteAddress: "::1", headers: { host: "[::1]:8080", [OWNER_SESSION_HEADER]: "1" } })).toBe(true);
  });

  it.each<[string, Partial<OwnerSessionRequest>]>([
    ["GET", { method: "GET" }],
    ["IP remota", { remoteAddress: "192.168.1.30" }],
    ["Host no loopback (DNS rebinding)", { headers: { ...ok.headers, host: "evil.example:8080" } }],
    ["Origin ajeno", { headers: { ...ok.headers, origin: "https://evil.example" } }],
    ["cross-site", { headers: { ...ok.headers, "sec-fetch-site": "cross-site" } }],
    ["sin header propio", { headers: { host: "localhost:8080" } }],
  ])("rechaza: %s", (_label, patch) => {
    expect(isOwnerSessionRequestAllowed({ ...ok, ...patch })).toBe(false);
  });
});
