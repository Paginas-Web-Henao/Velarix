// Bloque 1C-T — Fingerprint determinístico del input canónico.
//
// Sin imports de URL, sin Supabase, sin Deno, sin `serve()`, sin
// variables de entorno, sin efectos secundarios — importable desde Deno
// y desde Vitest indistintamente.
//
// Se divide en dos partes independientes, según lo pedido en el cierre
// de Bloque 1C-T:
//   1. `canonicalStringify` — serialización canónica PURA (ordena claves
//      recursivamente para que el orden de propiedades del JSON de origen
//      no afecte el resultado). No depende de ningún runtime.
//   2. `fnv1a64Hex` — hashing sobre esa serialización. Se eligió FNV-1a de
//      64 bits (aritmética con BigInt, estándar de JS/TS) en vez de
//      `crypto.subtle.digest` (Web Crypto) porque `crypto.subtle` es
//      asíncrono en ambos runtimes (Deno y Node/Vitest) y hubiera forzado
//      a que todo el cálculo del fingerprint — y por tanto
//      `runCanonicalFinancialEngine` en el punto donde se invoca — fuera
//      asíncrono, sin necesidad: este fingerprint NO tiene fines
//      criptográficos ni de seguridad, solo necesita ser determinístico
//      para detectar si el input cambió. FNV-1a cumple ese requisito de
//      forma síncrona, sin dependencias externas, igual en Deno y Vitest.

import type { CanonicalStructuredInput } from "./canonical-financial-engine.ts";

/**
 * Serializa cualquier valor JSON-compatible de forma determinística:
 * las claves de cada objeto (a cualquier nivel de anidamiento) se ordenan
 * alfabéticamente antes de serializar, así que dos objetos con las mismas
 * claves y valores pero en distinto orden producen exactamente el mismo
 * string. `NaN`/`Infinity` se normalizan a `null` (nunca deberían llegar
 * aquí desde un input financiero válido, pero un valor no serializable no
 * debe romper el fingerprint).
 */
export function canonicalStringify(value: unknown): string {
  if (value === null || value === undefined) return "null";

  if (typeof value === "number") {
    return Number.isFinite(value) ? JSON.stringify(value) : "null";
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(",")}]`;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const entries = keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`);
    return `{${entries.join(",")}}`;
  }

  // function/symbol/bigint: no se espera en un input financiero, pero se
  // serializa de forma segura en vez de lanzar.
  return JSON.stringify(String(value));
}

const FNV_OFFSET_BASIS_64 = 0xcbf29ce484222325n;
const FNV_PRIME_64 = 0x100000001b3n;
const MASK_64 = 0xffffffffffffffffn;

/**
 * FNV-1a de 64 bits, codificado en hexadecimal (16 caracteres). No es un
 * hash criptográfico — no ofrece resistencia a colisiones adversarias, y
 * no debe usarse con fines de seguridad. Es determinístico y suficiente
 * para detectar si el input efectivamente usado por el motor cambió
 * entre dos cálculos.
 */
export function fnv1a64Hex(input: string): string {
  let hash = FNV_OFFSET_BASIS_64;
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * FNV_PRIME_64) & MASK_64;
  }
  return hash.toString(16).padStart(16, "0");
}

/**
 * Fingerprint determinístico del input efectivamente usado por
 * `runCanonicalFinancialEngine` (income_statement, balance_sheet, moneda,
 * factor de conversión, sector y crecimiento esperado). Deliberadamente
 * NO incluye `analysis_id`, timestamps, tokens de sesión ni ningún otro
 * dato ajeno al cálculo financiero — dos análisis distintos con
 * exactamente las mismas cifras producen el mismo fingerprint, y ese es
 * el comportamiento esperado (el fingerprint identifica el INPUT
 * numérico, no el caso de negocio).
 */
export function computeInputFingerprint(
  input: CanonicalStructuredInput,
  sector: string,
  expectedGrowth: number | null | undefined,
): string {
  const payload = {
    income_statement: input.income_statement ?? null,
    balance_sheet: input.balance_sheet ?? null,
    moneda_analisis: input.moneda_analisis ?? null,
    factor_conversion: input.factor_conversion ?? null,
    sector,
    expected_growth: expectedGrowth ?? null,
  };
  return fnv1a64Hex(canonicalStringify(payload));
}
