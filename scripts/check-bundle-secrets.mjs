// Single-owner private mode (ADR-008) — verificación post-build.
//
// Falla el build si `dist/` contiene algo que nunca debe llegar al
// navegador:
// - una secret key de Supabase (`sb_secret_<valor>`);
// - un JWT con `role: service_role` (legacy service_role key);
// - el valor de cualquier variable de entorno server-side conocida
//   (VELARIX_OWNER_*, SUPABASE_SECRET_KEYS, SUPABASE_SERVICE_ROLE_KEY…),
//   leída de process.env y de los .env* que carga Vite.
// Nunca imprime ningún valor: solo el nombre de la variable y el archivo.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadEnv } from "vite";

const DIST = process.argv[2] ?? "dist";
const SERVER_ONLY = [
  "VELARIX_OWNER_EMAIL",
  "VELARIX_OWNER_PASSWORD",
  "SUPABASE_SECRET_KEYS",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
];

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(js|mjs|css|html|json|map|txt)$/.test(name)) yield p;
  }
}

function jwtRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return payload?.role;
  } catch {
    return undefined;
  }
}

const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
const secrets = SERVER_ONLY
  .map((name) => [name, env[name]])
  .filter(([, v]) => typeof v === "string" && v.length >= 8);

const problems = [];
for (const file of files(DIST)) {
  const text = readFileSync(file, "utf8");
  // Clave real, no el literal "sb_secret_" que supabase-js usa para detectar el formato.
  if (/sb_secret_[A-Za-z0-9_-]{16,}/.test(text)) problems.push(`${file}: contiene una secret key de Supabase (sb_secret_…)`);
  for (const m of text.matchAll(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g)) {
    if (jwtRole(m[0]) === "service_role") problems.push(`${file}: contiene un JWT con role=service_role`);
  }
  for (const [name, value] of secrets) {
    if (text.includes(value)) problems.push(`${file}: contiene el valor de ${name}`);
  }
}

if (problems.length) {
  console.error("✗ El bundle expone secretos server-side:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`✓ Bundle sin secretos server-side (${DIST}).`);
