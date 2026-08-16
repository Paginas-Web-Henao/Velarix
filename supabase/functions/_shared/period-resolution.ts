// Política provisional (técnica, no metodológica financiera) de selección de
// base_period. Ver docs/velarix/ (Bug 2) para el contexto completo. Reglas:
// 1. Un solo período explícito CON formato de año fiscal simple (YYYY) -> se
//    usa tal cual. Si ese único período NO tiene formato YYYY (p. ej.
//    "LTM Jun-2025", "2025-Q1") -> también es ambiguo, ver regla 3.
// 2. Varios períodos, todos con formato de año fiscal simple (YYYY) -> se
//    elige el año numéricamente mayor (nunca orden alfabético como base).
// 3. Uno o varios períodos y al menos uno no es YYYY simple -> ambiguo,
//    nunca se adivina (aplica sin importar si hay uno o varios períodos).
// 4. Ningún período explícito (todo period=null) -> modo legacy, compatible
//    con el comportamiento histórico de sumAccountValue/hasAccountValue.
// 5. Coexisten filas con period=null y filas con período explícito -> ambiguo
//    (no se sabe si el null pertenece al mismo período o a uno distinto).
//
// Nota de diseño (aclara una tensión textual entre la política aprobada y
// PASO 3 de la especificación): la regla 1 dice, en su redacción general,
// "un solo período explícito -> se usa". PASO 3 exige a la vez que
// periods=["LTM Jun-2025"] (un solo elemento) resuelva como AMBIGUO. Se
// resuelve aplicando la validación de formato YYYY de forma uniforme, sin
// importar si hay uno o varios períodos: un período único que no es un año
// fiscal simple (p. ej. "LTM Jun-2025", "2025-Q1", "2025-06-30") tampoco es
// una base segura y también requiere revisión humana. Esto es más
// conservador que la lectura literal de la regla 1 y coincide exactamente
// con el caso de prueba explícito de PASO 3.

export type PeriodSelectionMode =
  | "single_explicit"
  | "latest_simple_fiscal_year"
  | "legacy_null"
  | "ambiguous";

export interface BasePeriodResolution {
  ok: boolean;
  basePeriod: string | null;
  selectionMode: PeriodSelectionMode;
  availablePeriods: string[];
  reason: string | null;
}

const SIMPLE_FISCAL_YEAR = /^\d{4}$/;

function isExplicit(period: string | null | undefined): period is string {
  return period !== null && period !== undefined && period !== "";
}

export function resolveBasePeriod(
  periods: ReadonlyArray<string | null | undefined>,
): BasePeriodResolution {
  const hasLegacyNullRows = periods.some((p) => !isExplicit(p));
  const explicitPeriods = [...new Set(periods.filter(isExplicit))].sort();

  if (explicitPeriods.length === 0) {
    return {
      ok: true,
      basePeriod: null,
      selectionMode: "legacy_null",
      availablePeriods: [],
      reason: null,
    };
  }

  if (hasLegacyNullRows) {
    return {
      ok: false,
      basePeriod: null,
      selectionMode: "ambiguous",
      availablePeriods: explicitPeriods,
      reason:
        "Coexisten filas sin período (period=null) y filas con período " +
        "explícito (" + explicitPeriods.join(", ") + "). No se puede " +
        "determinar de forma segura si pertenecen al mismo período base. " +
        "Requiere revisión humana.",
    };
  }

  const allSimpleFiscalYears = explicitPeriods.every((p) => SIMPLE_FISCAL_YEAR.test(p));

  if (explicitPeriods.length === 1) {
    if (!allSimpleFiscalYears) {
      return {
        ok: false,
        basePeriod: null,
        selectionMode: "ambiguous",
        availablePeriods: explicitPeriods,
        reason:
          "El único período disponible (" + explicitPeriods[0] + ") no tiene " +
          "formato de año fiscal simple (YYYY). No se puede asumir a qué " +
          "rango temporal corresponde. Requiere revisión humana.",
      };
    }
    return {
      ok: true,
      basePeriod: explicitPeriods[0],
      selectionMode: "single_explicit",
      availablePeriods: explicitPeriods,
      reason: null,
    };
  }

  if (!allSimpleFiscalYears) {
    return {
      ok: false,
      basePeriod: null,
      selectionMode: "ambiguous",
      availablePeriods: explicitPeriods,
      reason:
        "Existen múltiples períodos y al menos uno no tiene formato de año " +
        "fiscal simple (YYYY): " + explicitPeriods.join(", ") + ". No se " +
        "selecciona automáticamente. Requiere revisión humana.",
    };
  }

  const numericSorted = [...explicitPeriods].sort((a, b) => Number(a) - Number(b));
  const selected = numericSorted[numericSorted.length - 1];
  return {
    ok: true,
    basePeriod: selected,
    selectionMode: "latest_simple_fiscal_year",
    availablePeriods: numericSorted,
    reason: null,
  };
}
