// Módulo puro compartido — Bloque 1B-P0, BL-05.
//
// Estructura de capital (peso equity/deuda, Hamada, CAPM, WACC, deuda
// neta) extraída de `ejecutar-calculo/index.ts::runEngine`. Extracción
// mínima y acotada: solo la parte afectada por el campo de deuda
// (`totalDebt`) — no se extraen proyecciones, valor terminal, matriz de
// sensibilidad ni escenarios, que quedan fuera del alcance de BL-05.
//
// Todas las tasas (`taxRatePct`, `costOfDebtPct`, `riskFreeRatePct`,
// `erpPct`) se expresan en escala porcentual (p. ej. `8` para 8%, no
// `0.08`), igual que las constantes de `ejecutar-calculo/index.ts`.

import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions.ts";

export interface CapitalStructureInput {
  totalDebt: number;
  cash: number;
  /** Book equity de Evidence (`04 §3.2`) — conserva su signo real, o `null` cuando no fue observado. Nunca se fabrica `0` aguas arriba (`canonical-input-normalization.ts::resolveEffectiveEquity`). */
  equity: number | null;
  sectorBetaUnlevered: number;
  taxRatePct: number;
  costOfDebtPct: number;
  riskFreeRatePct: number;
  erpPct: number;
  /** Peso de equity usado en la rama LEGACY cuando el equity efectivo (tras la compatibilidad de signo, ver más abajo) es `<= 0`. Default 0.70, igual que el motor servidor de siempre. */
  defaultEquityWeight?: number;
  /**
   * Bloque 3C.2 (RC-2, `04 §10.1`, `05 v1.3 §4`) — distingue legacy de v5
   * por PRESENCIA de esta propiedad en `input` (`Object.hasOwnProperty`),
   * no por su valor — mismo patrón ya usado en
   * `calculation-preflight.ts::evaluateCalculationPreflight` (Bloque
   * 3C.1). Un llamador legacy real omite la clave por completo. Un
   * llamador v5 la incluye siempre, aunque su valor sea `undefined`,
   * `null` o incompleto — en ese caso `computeCapitalStructure` lanza
   * (ver más abajo): el preflight v5 debe bloquear ANTES de llegar aquí
   * (`05 v1.3 §5`), así que una v5 sin `capitalStructure` resuelto que
   * de todos modos llega al motor es un estado inválido, no un resultado
   * a calcular silenciosamente.
   *
   * Cuando SÍ está presente y resuelta, `capitalStructure.value.equityWeight
   * /debtWeight` gobierna SIEMPRE los weights, sin importar el signo del
   * book `equity` recibido arriba — el book equity nunca decide el WACC
   * en una ejecución v5, permanece únicamente como Evidence/sanity-check
   * (`bookEquityReference` abajo). No se consumen aquí los demás campos
   * del contrato (Rf/ERP/CRP/λ/beta/Kd) — ese consumo completo de Ke/WACC
   * es RC-3, fuera de alcance de este bloque.
   */
  resolvedAssumptions?: ResolvedCalculationAssumptions | null;
}

export interface CapitalStructureResult {
  equityWeight: number;
  debtWeight: number;
  betaLevered: number;
  costOfEquityPct: number;
  costOfDebtAfterTaxPct: number;
  waccPct: number;
  netDebt: number;
  /** Book equity de Evidence, preservado siempre como referencia/sanity-check — nunca la fuente que decide el cálculo (`05 v1.3 §4`). `null` cuando no fue observado. */
  bookEquityReference: number | null;
}

export function computeCapitalStructure(input: CapitalStructureInput): CapitalStructureResult {
  const {
    totalDebt,
    cash,
    equity,
    sectorBetaUnlevered,
    taxRatePct,
    costOfDebtPct,
    riskFreeRatePct,
    erpPct,
    defaultEquityWeight = 0.70,
  } = input;

  // Legacy vs. v5: por presencia de la clave `resolvedAssumptions`, no
  // por su valor — consistente con `calculation-preflight.ts` (3C.1).
  const isV5Execution = Object.prototype.hasOwnProperty.call(input, "resolvedAssumptions");

  let equityWeight: number;
  let debtWeight: number;

  if (isV5Execution) {
    const resolvedCapitalStructure = input.resolvedAssumptions?.capitalStructure?.value;
    if (!resolvedCapitalStructure) {
      // Llamada v5 inválida: el preflight v5 (`calculation-preflight.ts`)
      // debe bloquear esto ANTES de invocar el motor — nunca debería
      // alcanzarse en el flujo real (`ejecutar-calculo/index.ts`). Se
      // lanza explícitamente en vez de devolver un resultado con `NaN`:
      // un `NaN` numérico es una señal pobre (se pierde al serializar, y
      // podría contaminar silenciosamente un `calculation_result`
      // persistido); una excepción no puede filtrarse a un resultado
      // canónico por accidente.
      throw new Error(
        "computeCapitalStructure: ejecución v5 (resolvedAssumptions presente) sin capitalStructure resuelto — el preflight v5 debe bloquear esto antes de invocar el motor (05 v1.3 §4/§5).",
      );
    }
    // RC-2: con estructura de capital resuelta, se usa exclusivamente —
    // nunca la rama mecánica derivada de book equity, sin importar su signo.
    equityWeight = resolvedCapitalStructure.equityWeight;
    debtWeight = resolvedCapitalStructure.debtWeight;
  } else {
    // LEGACY — comportamiento histórico preservado EXPLÍCITAMENTE, tal
    // como autoriza `05 v1.3 §4` ("Legacy compatibility vs. v5 canonical
    // behavior"): una ejecución sin contexto v5 (golden cases A/B/C
    // incluidos) reproduce el mismo cálculo de siempre, incluido el
    // efecto histórico de `Math.abs()` sobre un equity negativo o
    // ausente — pero esa transformación es ahora local a esta rama y
    // documentada, nunca contamina el `equity` de Evidence preservado
    // (`bookEquityReference` abajo sigue siendo el valor real, con signo,
    // o `null`). Corregir RC-1 (preservar el signo en Evidence) no obliga
    // a cambiar este cálculo mecánico histórico — la compatibilidad está
    // explícitamente permitida.
    const legacyEquityForWeights = Math.abs(equity ?? 0);
    equityWeight = legacyEquityForWeights > 0 ? legacyEquityForWeights / (legacyEquityForWeights + totalDebt) : defaultEquityWeight;
    debtWeight = 1 - equityWeight;
  }

  // Hamada — re-apalancamiento del beta sectorial
  const deRatio = debtWeight / equityWeight;
  const betaLevered = sectorBetaUnlevered * (1 + (1 - taxRatePct / 100) * deRatio);

  // CAPM
  const costOfEquityPct = riskFreeRatePct + betaLevered * erpPct;
  const costOfDebtAfterTaxPct = costOfDebtPct * (1 - taxRatePct / 100);

  // WACC
  const waccPct = costOfEquityPct * equityWeight + costOfDebtAfterTaxPct * debtWeight;

  const netDebt = totalDebt - cash;

  return {
    equityWeight,
    debtWeight,
    betaLevered,
    costOfEquityPct,
    costOfDebtAfterTaxPct,
    waccPct,
    netDebt,
    bookEquityReference: equity,
  };
}

/**
 * Resuelve el campo de deuda financiera total de un `balance_sheet` de
 * `structured_input`, con el orden explícito exigido por BL-05: nombre
 * canónico -> compatibilidad con nombres antiguos -> 0 solo cuando no
 * exista ninguna deuda válida. El `Math.abs` protege contra una
 * convención de signos inconsistente en el dato de origen.
 */
export function resolveFinancialDebtTotal(balanceSheet: {
  financial_debt_total?: number | null;
  total_debt?: number | null;
  financial_debt?: number | null;
}): number {
  return Math.abs(
    balanceSheet.financial_debt_total ??
      balanceSheet.total_debt ??
      balanceSheet.financial_debt ??
      0,
  );
}
