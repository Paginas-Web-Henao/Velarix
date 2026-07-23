// Módulo puro compartido — Bloque 1B-P0, BL-03.
//
// Cómputo del factor de conversión total (escala × moneda) aplicado a un
// `structured_input`. Sin imports de URL, sin Supabase, sin `serve()`,
// sin variables de entorno, sin efectos secundarios — importable desde
// Deno (import relativo `.ts`) y desde Vitest indistintamente.
//
// Nombres canónicos de este módulo (contrato interno, sin ambigüedad):
// `sourceCurrency`, `reportingCurrency`, `scaleFactor`, `exchangeRate`,
// `totalConversionFactor`. Los nombres ya ampliamente usados en la base
// de datos y en `structured_inputs.input_payload`
// (`moneda_documento`, `moneda_analisis`, `factor_escala`,
// `factor_conversion`) se conservan en las Edge Functions que llaman a
// este módulo — la adaptación explícita entre ambos vocabularios ocurre
// en el punto de llamada (`build-structured-input/index.ts`), no aquí.

export type CurrencyCode = "COP" | "USD";

/**
 * Convierte un valor crudo (de base de datos, JSON, o texto detectado) a
 * un `CurrencyCode` válido, o `null` si no es reconocible. Nunca asume
 * una moneda por defecto — la ausencia de evidencia se representa como
 * `null`, no como `"COP"` ni `"USD"`.
 */
export function normalizeCurrencyCode(raw: string | null | undefined): CurrencyCode | null {
  if (raw === "COP" || raw === "USD") return raw;
  return null;
}

export interface ConversionFactorInput {
  /** Moneda real del documento fuente. `null` si no pudo determinarse. */
  sourceCurrency: CurrencyCode | null;
  /** Moneda en la que el usuario quiere ver el análisis. */
  reportingCurrency: CurrencyCode;
  /** Factor de escala del documento (1, 1_000, 1_000_000, ...). */
  scaleFactor: number;
  /** Tasa de cambio COP por 1 USD (TRM). */
  exchangeRate: number;
}

export interface ConversionFactorResult {
  /** Factor único a multiplicar por cada valor crudo: scaleFactor × factor de moneda. */
  totalConversionFactor: number;
  /** true si se aplicó una conversión de moneda real (no solo escala). */
  currencyConversionApplied: boolean;
  /** true si `sourceCurrency` era `null` — no se pudo determinar la moneda real. */
  currencyUndetected: boolean;
}

/**
 * Calcula el factor de conversión total. El factor se aplica exactamente
 * una vez sobre cada valor crudo (ver `applyConversion`) — esta función
 * no muta ni acumula estado entre llamadas, así que invocarla dos veces
 * con la misma entrada siempre produce el mismo resultado (no hay forma
 * de "doble conversión" a este nivel; la responsabilidad de no volver a
 * aplicar el factor sobre un valor ya convertido es de quien la invoca).
 *
 * Regla explícita: si `sourceCurrency` es `null` (moneda no detectada o
 * no reconocida), **no se inventa una conversión** — se retorna
 * `currencyUndetected: true` y el factor de moneda queda en 1 (solo se
 * aplica la escala). Quien llama debe registrar una advertencia visible
 * (`quality_flag`), no asumir silenciosamente que el documento está en la
 * moneda de reporte.
 */
export function computeTotalConversionFactor(
  input: ConversionFactorInput,
): ConversionFactorResult {
  const { sourceCurrency, reportingCurrency, scaleFactor, exchangeRate } = input;

  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) {
    throw new Error(`scale_factor inválido: ${scaleFactor}`);
  }
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new Error(`exchange_rate inválido: ${exchangeRate}`);
  }

  if (sourceCurrency === null) {
    return {
      totalConversionFactor: scaleFactor,
      currencyConversionApplied: false,
      currencyUndetected: true,
    };
  }

  if (sourceCurrency === reportingCurrency) {
    return {
      totalConversionFactor: scaleFactor,
      currencyConversionApplied: false,
      currencyUndetected: false,
    };
  }

  let currencyFactor: number;
  if (sourceCurrency === "COP" && reportingCurrency === "USD") {
    currencyFactor = 1 / exchangeRate;
  } else if (sourceCurrency === "USD" && reportingCurrency === "COP") {
    currencyFactor = exchangeRate;
  } else {
    throw new Error(`Par de monedas no soportado: ${sourceCurrency} -> ${reportingCurrency}`);
  }

  return {
    totalConversionFactor: scaleFactor * currencyFactor,
    currencyConversionApplied: true,
    currencyUndetected: false,
  };
}

/** Aplica el factor total a un valor, preservando `null` como "sin dato". */
export function applyConversion(value: number | null, totalConversionFactor: number): number | null {
  return value === null ? null : value * totalConversionFactor;
}
