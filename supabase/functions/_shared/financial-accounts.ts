// Módulo puro compartido — Bloque 1B-P0, BL-02.
//
// Consolidación de subcuentas homologadas (`account_homologations`) por
// `canonical_account` + período. Sin imports de URL, sin Supabase, sin
// `serve()`, sin variables de entorno, sin efectos secundarios — puede
// importarse tanto desde una Edge Function de Deno (import relativo con
// extensión `.ts`) como desde Vitest, ejecutando exactamente la misma
// implementación en ambos casos.
//
// Reemplaza los patrones `.find()` duplicados en
// `build-structured-input/index.ts` (`getAccountValue`),
// `validate-analysis/index.ts` (`getVal`) y
// `continuar-tras-revision/index.ts` (`getValue` inline), que tomaban
// solo la primera fila coincidente y descartaban el resto en silencio
// (ver docs/velarix/bloque-1a/BL-26-tabla-comparativa-motores.md,
// R-01/BL-02).

export interface HomologatedAccountRow {
  canonical_account: string;
  value: number | string | null;
  period?: string | null;
}

/**
 * Cuentas de naturaleza no-negativa: si la suma resulta negativa por una
 * convención de signos inconsistente en el documento fuente, se normaliza
 * a su valor absoluto. El clamp se aplica una sola vez, sobre el total ya
 * sumado — nunca por fila individual antes de sumar.
 */
const ABS_NORMALIZED_ACCOUNTS: ReadonlySet<string> = new Set([
  "cash",
  "accounts_receivable",
  "inventory",
  "ppe",
  "total_assets",
]);

function normalizePeriod(period: string | null | undefined): string | null {
  return period === undefined || period === null || period === "" ? null : period;
}

function toFiniteNumber(raw: number | string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Suma todas las filas homologadas con el mismo `canonical_account` para
 * un período dado (por defecto, el período "sin especificar" — `null`/
 * `undefined`/cadena vacía se tratan como el mismo período, que es el caso
 * real más común hoy: análisis de un solo año sin columnas comparativas).
 *
 * - Ignora valores `null`, `undefined` o no numéricos.
 * - No usa `.find()`: nunca descarta una fila válida por tomar solo la
 *   primera coincidencia.
 * - Devuelve `null` cuando no existe ninguna fila válida — nunca confunde
 *   ausencia de dato con cero.
 * - Distingue períodos: dos filas con el mismo `canonical_account` pero
 *   distinto período NUNCA se suman entre sí (evita mezclar, por ejemplo,
 *   ingresos de 2023 con ingresos de 2024).
 */
export function sumAccountValue(
  rows: readonly HomologatedAccountRow[],
  canonical: string,
  period?: string | null,
): number | null {
  const targetPeriod = normalizePeriod(period);

  const matchedValues: number[] = [];
  for (const row of rows) {
    if (row.canonical_account !== canonical) continue;
    if (normalizePeriod(row.period) !== targetPeriod) continue;
    const val = toFiniteNumber(row.value);
    if (val === null) continue;
    matchedValues.push(val);
  }

  if (matchedValues.length === 0) return null;

  const sum = matchedValues.reduce((acc, v) => acc + v, 0);

  return ABS_NORMALIZED_ACCOUNTS.has(canonical) ? Math.abs(sum) : sum;
}

/** Equivalente a `sumAccountValue(...) !== null` — reemplaza `hasAccount`. */
export function hasAccountValue(
  rows: readonly HomologatedAccountRow[],
  canonical: string,
  period?: string | null,
): boolean {
  return sumAccountValue(rows, canonical, period) !== null;
}
