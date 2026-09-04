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
   * (`bookEquityReference` abajo). Bloque 3C.3 (RC-3) además consume los
   * demás 7 componentes del contrato (Rf local, ERP maduro, CRP, λ, beta
   * desapalancado, Kd, `debtTaxShieldRatePct`) para recomponer Ke/WACC
   * completos vía CAPM/Hamada — nunca cae a los parámetros legacy
   * (`sectorBetaUnlevered`/`taxRatePct`/`costOfDebtPct`/`riskFreeRatePct`/
   * `erpPct`), exclusivos de la rama sin `resolvedAssumptions`.
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
  let betaLevered: number;
  let costOfEquityPct: number;
  let costOfDebtAfterTaxPct: number;
  let waccPct: number;

  if (isV5Execution) {
    const resolved = input.resolvedAssumptions;
    const resolvedCapitalStructure = resolved?.capitalStructure?.value;
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

    // RC-3 (Bloque 3C.3, `04 §10.2/§10.5/§10.6`, `05 v1.3 §6-§7`) — los
    // demás 7 componentes resueltos de Ke/WACC (además de los weights ya
    // resueltos arriba). Ninguno cae a los parámetros legacy
    // (`sectorBetaUnlevered`/`taxRatePct`/`costOfDebtPct`/
    // `riskFreeRatePct`/`erpPct`) — esos son EXCLUSIVOS de la rama legacy
    // de abajo. Igual que con `capitalStructure`, el preflight v5 debe
    // garantizar que estos componentes están presentes ANTES de invocar
    // el motor; si de todos modos falta alguno, se lanza explícitamente
    // en vez de fabricar un fallback silencioso o dejar pasar un `NaN`.
    const rfLocal = resolved?.riskFreeRateConstruction?.value?.localRatePct;
    const matureErp = resolved?.matureErp?.value?.valuePct;
    const crp = resolved?.countryRiskPremium?.value?.valuePct;
    const lambda = resolved?.countryRiskLambda?.value?.value;
    const unleveredBeta = resolved?.betaTreatment?.value?.unleveredBeta;
    const kd = resolved?.costOfDebt?.value?.valuePct;
    // `debtTaxShieldRatePct` — NO `marginalRatePct` ni
    // `explicitFcffTaxRatePctByYear` — es la única de las tres tasas
    // fiscales del contrato que gobierna la deducibilidad del interés
    // (Hamada y `Kd × (1-T)`), la pregunta económica que WACC/beta
    // apalancado necesitan (`04 §10.6`, `05 v1.3 §6`). Las otras dos
    // tasas fiscales pertenecen al NOPAT/FCFF (Bloque 3C.4), nunca a este
    // módulo.
    const debtTaxShieldRatePct = resolved?.taxTreatment?.value?.debtTaxShieldRatePct;

    const missing: string[] = [];
    if (rfLocal === undefined || rfLocal === null) missing.push("riskFreeRateConstruction.localRatePct");
    if (matureErp === undefined || matureErp === null) missing.push("matureErp.valuePct");
    if (crp === undefined || crp === null) missing.push("countryRiskPremium.valuePct");
    if (lambda === undefined || lambda === null) missing.push("countryRiskLambda.value");
    if (unleveredBeta === undefined || unleveredBeta === null) missing.push("betaTreatment.unleveredBeta");
    if (kd === undefined || kd === null) missing.push("costOfDebt.valuePct");
    if (debtTaxShieldRatePct === undefined || debtTaxShieldRatePct === null) missing.push("taxTreatment.debtTaxShieldRatePct");
    if (missing.length > 0) {
      throw new Error(
        `computeCapitalStructure: ejecución v5 sin todos los componentes resueltos de Ke/WACC (05 v1.3 §5/§6) — faltan: ${missing.join(", ")}.`,
      );
    }

    const debtTaxShieldT = (debtTaxShieldRatePct as number) / 100;
    const deRatio = debtWeight / equityWeight;
    // Hamada — SIEMPRE desde el unlevered beta de Judgment, nunca desde un beta sectorial legacy.
    betaLevered = (unleveredBeta as number) * (1 + (1 - debtTaxShieldT) * deRatio);
    // CAPM v5 — incluye el término λ×CRP que la rama legacy no modela.
    costOfEquityPct = (rfLocal as number) + betaLevered * (matureErp as number) + (lambda as number) * (crp as number);
    costOfDebtAfterTaxPct = (kd as number) * (1 - debtTaxShieldT);
    waccPct = costOfEquityPct * equityWeight + costOfDebtAfterTaxPct * debtWeight;
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

    // Hamada — re-apalancamiento del beta sectorial (legacy: un único
    // `taxRatePct` global, sin componentes de Ke/WACC resueltos).
    const deRatio = debtWeight / equityWeight;
    betaLevered = sectorBetaUnlevered * (1 + (1 - taxRatePct / 100) * deRatio);

    // CAPM legacy — sin término de riesgo país (CRP/lambda no existen en este camino).
    costOfEquityPct = riskFreeRatePct + betaLevered * erpPct;
    costOfDebtAfterTaxPct = costOfDebtPct * (1 - taxRatePct / 100);

    // WACC
    waccPct = costOfEquityPct * equityWeight + costOfDebtAfterTaxPct * debtWeight;
  }

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
