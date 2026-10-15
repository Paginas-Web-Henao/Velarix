// ADR-008 — el frontend solo se considera LOCAL_PRIVATE en `vite dev` + loopback.
import { describe, it, expect } from "vitest";
import { resolveAccessMode } from "./access-mode";

describe("resolveAccessMode", () => {
  it("LOCAL_PRIVATE solo con bundle de desarrollo abierto desde loopback", () => {
    expect(resolveAccessMode({ isDevBuild: true, hostname: "localhost" })).toBe("local_private");
    expect(resolveAccessMode({ isDevBuild: true, hostname: "127.0.0.1" })).toBe("local_private");
  });

  it("producción nunca es LOCAL_PRIVATE, ni siquiera en localhost", () => {
    expect(resolveAccessMode({ isDevBuild: false, hostname: "localhost" })).toBe("deployed_private");
    expect(resolveAccessMode({ isDevBuild: false, hostname: "velarix.vercel.app" })).toBe("deployed_private");
  });

  it("dev abierto desde la red (IP LAN) es DEPLOYED_PRIVATE", () => {
    expect(resolveAccessMode({ isDevBuild: true, hostname: "192.168.1.20" })).toBe("deployed_private");
    expect(resolveAccessMode({ isDevBuild: true, hostname: null })).toBe("deployed_private");
  });
});
