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
import {
  resolveEffectiveIncomeStatement,
  resolveEffectiveCash,
  resolveEffectiveEquity,
  resolveEffectiveSectorBenchmark,
  resolveEffectiveGrowth,
  resolveEffectiveMoneda,
  resolveEffectiveFactorConversion,
} from "./canonical-input-normalization.ts";
import { resolveFinancialDebtTotal } from "./capital-structure.ts";

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
 * Fingerprint determinístico del input EFECTIVAMENTE usado por
 * `runCanonicalFinancialEngine` — no de los objetos crudos
 * `income_statement`/`balance_sheet` tal como llegan. Ajuste de
 * semántica (2026-07-23): antes se serializaban esos objetos completos,
 * lo que hacía cambiar el fingerprint por campos que el motor ni
 * siquiera lee (`taxes`, `net_income`), por campos de deuda ignorados
 * por la prioridad real (`resolveFinancialDebtTotal`), o por
 * representaciones distintas que el motor normaliza al mismo valor
 * (`revenue: -100` y `revenue: 100`, ambos `Math.abs()`-normalizados a
 * 100). Ahora se calcula exclusivamente sobre los valores resueltos por
 * `canonical-input-normalization.ts` — las MISMAS funciones que usa el
 * motor, importadas aquí, nunca reimplementadas — para que el motor y el
 * fingerprint no puedan divergir.
 *
 * Deliberadamente NO incluye `analysis_id`, timestamps, tokens de sesión
 * ni ningún otro dato ajeno al cálculo financiero — dos inputs que
 * producen exactamente el mismo cálculo (aunque su representación cruda
 * difiera) producen el mismo fingerprint, y ese es el comportamiento
 * esperado (el fingerprint identifica el cálculo EFECTIVO, no la forma
 * literal del JSON de origen).
 */
export function computeInputFingerprint(
  input: CanonicalStructuredInput,
  sector: string,
  expectedGrowth: number | null | undefined,
): string {
  const { revenue, costOfSales, opex, da, interestExpense } = resolveEffectiveIncomeStatement(input.income_statement);
  const financialDebtTotal = resolveFinancialDebtTotal(input.balance_sheet || {});
  const cash = resolveEffectiveCash(input.balance_sheet);
  const equity = resolveEffectiveEquity(input.balance_sheet);
  const sectorBenchmark = resolveEffectiveSectorBenchmark(sector);
  const growth = resolveEffectiveGrowth(expectedGrowth);
  const monedaAnalisis = resolveEffectiveMoneda(input.moneda_analisis);
  const factorConversion = resolveEffectiveFactorConversion(input.factor_conversion);

  const payload = {
    revenue,
    cost_of_sales: costOfSales,
    opex,
    da,
    interest_expense: interestExpense,
    financial_debt_total: financialDebtTotal,
    cash,
    equity,
    moneda_analisis: monedaAnalisis,
    factor_conversion: factorConversion,
    sector_benchmark: sectorBenchmark,
    expected_growth: growth,
  };
  return fnv1a64Hex(canonicalStringify(payload));
}
