// Bloque 1C-T (ajuste de semántica) — Normalización centralizada del
// input EFECTIVO que consume `runCanonicalFinancialEngine`.
//
// Sin imports de URL, sin Supabase, sin Deno, sin `serve()`, sin
// variables de entorno, sin efectos secundarios — importable desde Deno
// y desde Vitest indistintamente.
//
// Motivo: el fingerprint (`calculation-fingerprint.ts`) serializaba
// antes los objetos `income_statement`/`balance_sheet` completos, lo que
// lo hacía cambiar por campos que el motor ni siquiera lee (`taxes`,
// `net_income`), por campos de deuda ignorados por la prioridad real
// (`resolveFinancialDebtTotal`), o por representaciones distintas que el
// motor normaliza al mismo valor (`revenue: -100` vs `revenue: 100`,
// ambos `Math.abs()`-normalizados a 100). Este módulo extrae EXACTAMENTE
// las mismas reglas que ya vivían inline en
// `canonical-financial-engine.ts` — ningún valor ni comportamiento
// nuevo — y ambos (el motor y el fingerprint) las importan desde aquí,
// para que nunca puedan divergir en el futuro.

export interface NormalizableIncomeStatement {
  revenue?: number | null;
  cost_of_sales?: number | null;
  opex?: number | null;
  da?: number | null;
  depreciation?: number | null;
  interest_expense?: number | null;
}

export interface NormalizableBalanceSheet {
  cash?: number | null;
  equity?: number | null;
  total_equity?: number | null;
}

export interface EffectiveIncomeStatement {
  revenue: number;
  costOfSales: number;
  opex: number;
  da: number;
  interestExpense: number;
}

/** Mismas reglas exactas que antes vivían inline en `runCanonicalFinancialEngine` — `Math.abs()` sobre cada campo, con el fallback `da || depreciation` sin cambios. */
export function resolveEffectiveIncomeStatement(is: NormalizableIncomeStatement | undefined): EffectiveIncomeStatement {
  const s = is || {};
  return {
    revenue: Math.abs(s.revenue || 0),
    costOfSales: Math.abs(s.cost_of_sales || 0),
    opex: Math.abs(s.opex || 0),
    da: Math.abs(s.da || s.depreciation || 0),
    interestExpense: Math.abs(s.interest_expense || 0),
  };
}

/** Misma regla exacta que antes vivía inline: `Math.abs(bs.cash || 0)`. */
export function resolveEffectiveCash(bs: NormalizableBalanceSheet | undefined): number {
  return Math.abs((bs || {}).cash || 0);
}

/** Misma regla exacta que antes vivía inline: `Math.abs(bs.equity || bs.total_equity || 0)`. */
export function resolveEffectiveEquity(bs: NormalizableBalanceSheet | undefined): number {
  const b = bs || {};
  return Math.abs(b.equity || b.total_equity || 0);
}

export const SECTOR_BENCHMARKS: Record<string, { beta: number; ebitdaMargin: number; evEbitda: number; evRevenue: number; waccRef: number }> = {
  "Software / Tecnología":          { beta: 1.22, ebitdaMargin: 26,   evEbitda: 13,   evRevenue: 4.8, waccRef: 11.2 },
  "Retail / Comercio":              { beta: 1.08, ebitdaMargin: 18.5, evEbitda: 9.5,  evRevenue: 2.2, waccRef: 10.2 },
  "Servicios empresariales":        { beta: 0.98, ebitdaMargin: 20.5, evEbitda: 10.5, evRevenue: 2.6, waccRef: 9.6 },
  "Manufactura":                    { beta: 1.18, ebitdaMargin: 16.5, evEbitda: 8.5,  evRevenue: 1.9, waccRef: 10.6 },
  "Consumo":                        { beta: 0.93, ebitdaMargin: 22.5, evEbitda: 11.5, evRevenue: 3.1, waccRef: 9.1 },
  "Alimentos y bebidas":            { beta: 0.78, ebitdaMargin: 18.5, evEbitda: 10.5, evRevenue: 2.3, waccRef: 9.1 },
  "Agroindustria":                  { beta: 0.83, ebitdaMargin: 15.5, evEbitda: 8.5,  evRevenue: 1.6, waccRef: 9.6 },
  "Salud":                          { beta: 0.88, ebitdaMargin: 20.5, evEbitda: 11.5, evRevenue: 2.9, waccRef: 9.6 },
  "Educación":                      { beta: 0.73, ebitdaMargin: 18.5, evEbitda: 9.5,  evRevenue: 2.1, waccRef: 8.6 },
  "Transporte y logística":         { beta: 1.03, ebitdaMargin: 14.5, evEbitda: 8.5,  evRevenue: 1.7, waccRef: 10.1 },
  "Construcción e infraestructura": { beta: 1.13, ebitdaMargin: 13.5, evEbitda: 7.5,  evRevenue: 1.5, waccRef: 10.6 },
  "Energía y utilities":            { beta: 0.52, ebitdaMargin: 36,   evEbitda: 9.5,  evRevenue: 3.1, waccRef: 8.1 },
  "Turismo y hospitalidad":         { beta: 1.28, ebitdaMargin: 16.5, evEbitda: 9.5,  evRevenue: 2.1, waccRef: 11.1 },
  "Inmobiliario":                   { beta: 0.68, ebitdaMargin: 41,   evEbitda: 13.5, evRevenue: 5.2, waccRef: 8.6 },
  "Financiero / Seguros":           { beta: 0.83, ebitdaMargin: 31,   evEbitda: 10.5, evRevenue: 3.6, waccRef: 9.1 },
};

/** Misma regla exacta que antes vivía inline: `SECTOR_BENCHMARKS[sector] || SECTOR_BENCHMARKS["Software / Tecnología"]`. Un sector desconocido y "Software / Tecnología" resuelven al MISMO objeto. */
export function resolveEffectiveSectorBenchmark(sector: string) {
  return SECTOR_BENCHMARKS[sector] || SECTOR_BENCHMARKS["Software / Tecnología"];
}

/** Misma regla exacta que antes vivía inline: `expectedGrowth || 25` (nota: `0` es falsy, cae al fallback — comportamiento preservado, no decidido de nuevo aquí). */
export function resolveEffectiveGrowth(expectedGrowth: number | null | undefined): number {
  return expectedGrowth || 25;
}

/** Misma regla exacta que antes vivía inline: `input.moneda_analisis || "COP"`. */
export function resolveEffectiveMoneda(monedaAnalisis: string | undefined | null): string {
  return monedaAnalisis || "COP";
}

/** Misma regla exacta que antes vivía inline: `input.factor_conversion || 1`. */
export function resolveEffectiveFactorConversion(factorConversion: number | undefined | null): number {
  return factorConversion || 1;
}
