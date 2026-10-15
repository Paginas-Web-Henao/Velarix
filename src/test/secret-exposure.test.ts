// ADR-008 — ningún secreto administrativo ni credencial del owner puede
// llegar al código cliente. El escaneo del bundle real lo hace
// `scripts/check-bundle-secrets.mjs` tras cada `npm run build`.
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import viteConfig from "../../vite.config";
import { ownerSessionPlugin } from "../../vite/owner-session";

function* sourceFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* sourceFiles(p);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) yield p;
  }
}

describe("exposición de secretos al navegador", () => {
  const src = [...sourceFiles(join(__dirname, ".."))].map((f) => [f, readFileSync(f, "utf8")] as const);

  it("el código cliente nunca referencia claves administrativas ni credenciales del owner", () => {
    for (const [file, text] of src) {
      expect(text, file).not.toMatch(/SERVICE_ROLE|SECRET_KEYS|sb_secret_|VELARIX_OWNER_PASSWORD|VELARIX_OWNER_EMAIL/);
    }
  });

  it("ninguna variable VITE_* (pública) parece un secreto", () => {
    for (const [file, text] of src) {
      for (const m of text.matchAll(/VITE_[A-Z0-9_]+/g)) {
        expect(m[0], file).not.toMatch(/SECRET|SERVICE|PASSWORD|PRIVATE|ADMIN/);
      }
    }
  });

  it("Vite solo expone VITE_* y el servidor local escucha en loopback", () => {
    const cfg = typeof viteConfig === "function" ? viteConfig({ command: "serve", mode: "development" }) : viteConfig;
    expect(cfg.envPrefix).toBe("VITE_");
    expect(cfg.server?.host).toBe("127.0.0.1");
  });

  it("el endpoint de sesión del owner solo existe en `vite dev` (nunca en build/preview)", () => {
    const plugin = ownerSessionPlugin();
    expect(plugin.apply).toBe("serve");
    expect(plugin).not.toHaveProperty("configurePreviewServer");
  });

  describe("scripts/check-bundle-secrets.mjs (corre tras cada build)", () => {
    const script = join(__dirname, "../../scripts/check-bundle-secrets.mjs");
    const scan = (content: string) => {
      const dir = mkdtempSync(join(tmpdir(), "velarix-dist-"));
      mkdirSync(join(dir, "assets"));
      writeFileSync(join(dir, "assets", "index.js"), content);
      return spawnSync(process.execPath, [script, dir], { encoding: "utf8" });
    };
    const fakeJwt = (role: string) =>
      ["eyJhbGciOiJIUzI1NiJ9", Buffer.from(JSON.stringify({ role })).toString("base64url"), "c2ln"].join(".");

    it("rechaza un bundle con una service_role key", () => {
      expect(scan(`const k="${fakeJwt("service_role")}";`).status).toBe(1);
    });

    it("rechaza un bundle con una secret key de Supabase", () => {
      expect(scan('const k="sb_secret_ABCDEFGHIJKLMNOPQRSTUV";').status).toBe(1);
    });

    it("acepta la publishable/anon key y el literal de detección de supabase-js", () => {
      const r = scan(`const a="${fakeJwt("anon")}";e.startsWith(\`sb_secret_\`);`);
      expect(r.status, r.stderr).toBe(0);
    });
  });
});
