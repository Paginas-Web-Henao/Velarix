// Calculation Preflight — gate fail-closed entre Minimum Expediente
// Checkpoint y el motor financiero (`runCanonicalFinancialEngine`).
//
// Sin imports de URL, sin Supabase, sin Deno, sin `serve()`, sin
// variables de entorno, sin efectos secundarios — importable desde Deno y
// desde Vitest indistintamente.
//
// Motivación (auditoría real): `canonical-input-normalization.ts` y
// `capital-structure.ts` convierten CUALQUIER campo ausente
// (revenue/cost_of_sales/opex/da/cash/equity/financial_debt_total) en `0`
// vía `|| 0` / `?? 0` antes de calcular — un `equity` ausente se vuelve
// indistinguible de un `equity` observado en cero, y activa una estructura
// de capital 70/30 hardcoded (`capital-structure.ts` línea 49). Además,
// los 8 supuestos de `financial-methodology.ts` (risk-free, ERP, tax
// rate, g terminal, cost of debt, capex%, working capital%, D&A%) están
// marcados `approved: false` en el propio código — nunca se les exige
// aprobación humana antes de usarlos. Y el horizonte de 5 años
// (`canonical-financial-engine.ts`, `for (let t=1;t<=5;t++)`) está
// hardcoded sin ninguna entrada de metadata en absoluto.
//
// Este módulo NO decide qué valores son correctos, NO aprueba nada, NO
// inventa una fuente de aprobación que no existe — solo verifica, ANTES
// de invocar el motor: (1) que los campos materiales de
// `structured_input` estén realmente observados (no `null`/`undefined`),
// y (2a, legacy) que ningún supuesto metodológico global de
// `CANONICAL_METHODOLOGY` esté marcado `approved: false` — cuando la
// LLAMADA no incluye en absoluto la propiedad `resolvedAssumptions`
// (legacy) — o (2b, v5, Bloque 3C.1) que los 13 supuestos de
// `ResolvedCalculationAssumptions`
// (docs/velarix-v5/05-financial-engine-audit.md v1.3 §5-§6) estén
// explícitamente resueltos y documentados — cuando la llamada SÍ incluye
// esa propiedad, sea cual sea su valor (`undefined`, `null`, `{}`,
// parcial o completo).
//
// Distinción legacy/v5 por PRESENCIA de la propiedad, no por su valor
// (`Object.prototype.hasOwnProperty`, ver `evaluateCalculationPreflight`)
// — deliberado: en JS, un objeto que omite la clave y un objeto que la
// incluye con valor `undefined` son indistinguibles si solo se compara
// contra `undefined`, pero representan intenciones distintas aquí: la
// primera es "esta llamada no es una ejecución v5, no la evalúes como
// tal"; la segunda es "esta ES una ejecución v5, y todavía no se resolvió
// ningún supuesto" (debe bloquear con blockers `RESOLVED_ASSUMPTION_*`,
// no con el mecanismo legacy).
//
// La pregunta que este módulo responde en modo v5 no es "¿los defaults
// globales están approved=true?" (nunca puede ser cierto, ver más abajo)
// sino "¿están los 13 supuestos metodológicos requeridos explícitamente
// resueltos y documentados para ESTA ejecución?" (05 v1.3 §5). El motor
// y este preflight no aprueban nada — verifican que la resolución humana
// ya ocurrió (`04 §17`).
//
// Legacy: mientras la llamada no incluya la propiedad
// `resolvedAssumptions`, el comportamiento es exactamente el de siempre
// — no existe HOY ningún mecanismo persistido para que un humano marque
// los 8 supuestos globales como aprobados (verificado — sin schema/RPC
// para ello), así que `unapproved_assumptions` sigue bloqueando SIEMPRE
// en ese modo. Esto preserva sin cambios los 13 tests pre-existentes de
// `calculation-preflight.test.ts` y la integración con
// `ejecutar-calculo/index.ts` (que hoy no incluye esa propiedad en su
// llamada).

import { CANONICAL_METHODOLOGY } from "./financial-methodology.ts";
import {
  REQUIRED_RESOLVED_ASSUMPTION_KEYS,
  MOTOR_SUPPORTED_PROJECTION_HORIZON_YEARS,
  type ResolvedCalculationAssumptions,
} from "./resolved-calculation-assumptions.ts";

export interface PreflightIncomeStatement {
  revenue?: number | null;
  cost_of_sales?: number | null;
  opex?: number | null;
  da?: number | null;
  /** Nombre alterno que el motor también acepta para D&A (`da || depreciation`) — ver canonical-input-normalization.ts. */
  depreciation?: number | null;
}

export interface PreflightBalanceSheet {
  cash?: number | null;
  equity?: number | null;
  /** Nombre alterno que el motor también acepta para equity (`equity || total_equity`). */
  total_equity?: number | null;
  financial_debt_total?: number | null;
  /** Nombres alternos que el motor también acepta para deuda total — ver capital-structure.ts resolveFinancialDebtTotal. */
  total_debt?: number | null;
  financial_debt?: number | null;
}

export interface CalculationPreflightResult {
  passed: boolean;
  missing_inputs: string[];
  unapproved_assumptions: string[];
  /** Judgment del caso fuera del contrato de supuestos resueltos (hoy: `expected_growth`) que sigue sin resolver. */
  unresolved_judgments: string[];
  blockers: string[];
}

function isObserved(value: number | null | undefined): boolean {
  return value !== null && value !== undefined;
}

/**
 * Campo material REQUIRED para el motor — evidencia de por qué (feeds
 * enterprise value / WACC / equity value directamente, no solo un KPI
 * supplementario):
 * - revenue/cost_of_sales/opex: base de ebitda0 y ebitdaMargin, que
 *   alimenta las proyecciones de los 5 años (`computeProjections`).
 * - da: alimenta ebitda0/ebit0 -> ebitdaMargin -> las 5 proyecciones.
 * - cash: alimenta netDebt (`totalDebt - cash`) -> equityValue.
 * - equity: alimenta equityWeight (`capital-structure.ts`) -> WACC
 *   completo. Es el campo cuya ausencia dispara el default 70/30
 *   hardcoded (evidencia central de esta auditoría).
 * - financial_debt_total: alimenta totalDebt -> equityWeight, netDebt,
 *   WACC, interest proyectado.
 *
 * `interest_expense` queda deliberadamente FUERA de este set: verificado
 * en el motor que solo alimenta KPIs supplementarios (netMargin,
 * interestCoverage, roe/roa vía netIncome0) — nunca enterpriseValue,
 * equityValue ni wacc. No es material para el resultado DCF en sí.
 */
function findMissingRequiredInputs(
  incomeStatement: PreflightIncomeStatement | null | undefined,
  balanceSheet: PreflightBalanceSheet | null | undefined,
): string[] {
  const is = incomeStatement || {};
  const bs = balanceSheet || {};
  const missing: string[] = [];

  if (!isObserved(is.revenue)) missing.push("revenue");
  if (!isObserved(is.cost_of_sales)) missing.push("cost_of_sales");
  if (!isObserved(is.opex)) missing.push("opex");
  if (!isObserved(is.da) && !isObserved(is.depreciation)) missing.push("da");
  if (!isObserved(bs.cash)) missing.push("cash");
  if (!isObserved(bs.equity) && !isObserved(bs.total_equity)) missing.push("equity");
  if (!isObserved(bs.financial_debt_total) && !isObserved(bs.total_debt) && !isObserved(bs.financial_debt)) {
    missing.push("financial_debt_total");
  }

  return missing;
}

/**
 * Nombre fijo, no derivado de ninguna tabla — el horizonte de proyección
 * (5 años) está hardcoded en `canonical-financial-engine.ts`
 * (`for (let t=1;t<=5;t++)`), sin representación en
 * `CANONICAL_METHODOLOGY.assumptions`. No se le agrega una entrada falsa
 * ahí (eso sería inventar metadata que no existe) — se bloquea aquí
 * explícitamente, con su propia razón, siempre, hasta que exista una
 * decisión metodológica real sobre el horizonte.
 */
const UNTRACKED_HARDCODED_ASSUMPTION = "projection_horizon_years";

function findUnapprovedAssumptions(): string[] {
  const unapproved: string[] = [];
  for (const [key, assumption] of Object.entries(CANONICAL_METHODOLOGY.assumptions)) {
    if (!assumption.approved) unapproved.push(key);
  }
  unapproved.push(UNTRACKED_HARDCODED_ASSUMPTION);
  return unapproved;
}

/**
 * Bloque 3C.1 — validación mínima de `ResolvedCalculationAssumptions`
 * (docs/velarix-v5/05-financial-engine-audit.md v1.3 §5-§6). Verifica,
 * para cada uno de los 13 campos: presencia; `status === "resolved"`;
 * `source`/`rationale` no vacíos. Además, verificaciones estructurales/
 * de compatibilidad puntuales cuando el campo relevante está presente:
 * pesos de `capitalStructure` válidos ([0,1] y suman 1); horizonte
 * resuelto compatible con el único valor que el motor soporta hoy (5);
 * longitud de `explicitDeltaNwcByYear`/`explicitFcffTaxRatePctByYear`/
 * `capexReinvestmentDriver.explicitPath`/`depreciationDaDriver.explicitPath`
 * (estos dos últimos solo cuando `mode === "explicit_path"`) coherente
 * con ese horizonte.
 *
 * NO decide si los VALORES son correctos financieramente (eso es
 * Judgment humano, no de este módulo) — solo que la resolución está
 * completa, documentada y estructuralmente consistente. NO aprueba
 * nada — `status` es literalmente `"resolved"`, nunca `"approved"`.
 *
 * El llamador (`evaluateCalculationPreflight`) decide legacy vs. v5 por
 * PRESENCIA de la propiedad `resolvedAssumptions` — esta función solo se
 * invoca cuando esa propiedad SÍ está presente (aunque su valor sea
 * `undefined`, `null`, `{}`, parcial o completo). Llamada con `undefined`
 * o `null`, reporta los 13 campos como faltantes — comportamiento
 * correcto: "hay una ejecución v5, pero no se resolvió ningún supuesto
 * todavía", distinto de "no hay ejecución v5 en absoluto" (legacy, nunca
 * llega a esta función).
 */
function findResolvedAssumptionBlockers(
  resolvedAssumptions: Partial<ResolvedCalculationAssumptions> | null | undefined,
): string[] {
  const blockers: string[] = [];
  const ra = resolvedAssumptions ?? undefined;

  for (const key of REQUIRED_RESOLVED_ASSUMPTION_KEYS) {
    const entry = ra ? (ra as Record<string, unknown>)[key] : undefined;
    const upperKey = key.toUpperCase();

    if (entry === undefined || entry === null) {
      blockers.push(`RESOLVED_ASSUMPTION_MISSING_${upperKey}: el supuesto resuelto "${key}" no está presente en resolvedAssumptions.`);
      continue;
    }

    const e = entry as { status?: unknown; source?: unknown; rationale?: unknown };
    if (e.status !== "resolved") {
      blockers.push(`RESOLVED_ASSUMPTION_STATUS_${upperKey}: el supuesto "${key}" no tiene status="resolved" (status actual: ${JSON.stringify(e.status)}).`);
    }
    if (typeof e.source !== "string" || e.source.trim().length === 0) {
      blockers.push(`RESOLVED_ASSUMPTION_SOURCE_${upperKey}: el supuesto "${key}" no declara 'source'.`);
    }
    if (typeof e.rationale !== "string" || e.rationale.trim().length === 0) {
      blockers.push(`RESOLVED_ASSUMPTION_RATIONALE_${upperKey}: el supuesto "${key}" no declara 'rationale'.`);
    }
  }

  // Verificaciones estructurales/de compatibilidad — solo cuando el campo relevante está presente.
  const capitalStructureValue = (ra?.capitalStructure as { value?: { equityWeight?: number; debtWeight?: number } } | undefined)?.value;
  if (capitalStructureValue) {
    const { equityWeight, debtWeight } = capitalStructureValue;
    const inUnitRange = (n: number | undefined): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
    const sumsToOne = inUnitRange(equityWeight) && inUnitRange(debtWeight) && Math.abs((equityWeight as number) + (debtWeight as number) - 1) < 1e-6;
    if (!inUnitRange(equityWeight) || !inUnitRange(debtWeight) || !sumsToOne) {
      blockers.push(
        `RESOLVED_ASSUMPTION_INVALID_CAPITALSTRUCTURE: equityWeight/debtWeight deben estar en [0,1] y sumar 1 (equityWeight=${equityWeight}, debtWeight=${debtWeight}).`,
      );
    }
  }

  // RC-5 (4F.2, `04 §10.4` enmendado / `05 §5` enmendado) — coherencia
  // del modo elegido de `countryRiskLambda`, mutuamente excluyente.
  // Calculation (`capital-structure.ts`) solo lee `.value.value` —
  // este bloque no cambia esa fórmula, solo valida la representación.
  const lambdaValue = (ra?.countryRiskLambda as { value?: Record<string, unknown> } | undefined)?.value;
  if (lambdaValue) {
    const isFiniteNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
    const mode = lambdaValue.mode;
    const value = lambdaValue.value;

    if (mode !== "observed_revenue_exposure" && mode !== "direct_documented_judgment") {
      blockers.push(
        `RESOLVED_ASSUMPTION_INVALID_COUNTRYRISKLAMBDA_MODE: "mode" debe ser "observed_revenue_exposure" o "direct_documented_judgment" (valor actual: ${JSON.stringify(mode)}).`,
      );
    } else if (mode === "observed_revenue_exposure") {
      const companyPct = lambdaValue.domesticRevenuePctCompany;
      const marketPct = lambdaValue.domesticRevenuePctMarketAvg;
      const companyValid = isFiniteNumber(companyPct) && companyPct >= 0 && companyPct <= 100;
      const marketValid = isFiniteNumber(marketPct) && marketPct > 0 && marketPct <= 100;
      if (!isFiniteNumber(value) || !companyValid || !marketValid) {
        blockers.push(
          `RESOLVED_ASSUMPTION_INVALID_COUNTRYRISKLAMBDA_OBSERVED: en modo "observed_revenue_exposure", value/domesticRevenuePctCompany/domesticRevenuePctMarketAvg deben ser numéricos finitos, con company en [0,100] y market en (0,100] (value=${JSON.stringify(value)}, company=${JSON.stringify(companyPct)}, market=${JSON.stringify(marketPct)}).`,
        );
      } else {
        // Sin redondear expectedLambda antes de comparar — `value` debe
        // conservar suficiente precisión para representar el ratio
        // registrado (05 §5, esta revisión). Tolerancia 1e-6: misma
        // magnitud ya usada arriba para equityWeight+debtWeight≈1.
        const expectedLambda = (companyPct as number) / (marketPct as number);
        if (Math.abs((value as number) - expectedLambda) > 1e-6) {
          blockers.push(
            `RESOLVED_ASSUMPTION_INVALID_COUNTRYRISKLAMBDA_RATIO: value debe ser numéricamente coherente con domesticRevenuePctCompany/domesticRevenuePctMarketAvg dentro de una tolerancia de 1e-6 (value=${value}, ratio esperado=${expectedLambda}).`,
          );
        }
      }
    } else {
      // mode === "direct_documented_judgment" — Judgment experto
      // directo: sin porcentajes, nunca fabricados para aparentar el
      // modo observado. "Ausente" significa la propiedad realmente no
      // presente (`hasOwnProperty`), no solo `undefined` — un objeto
      // que declara explícitamente `domesticRevenuePctCompany:
      // undefined` no es una representación limpia del modo directo.
      if (!isFiniteNumber(value)) {
        blockers.push(
          `RESOLVED_ASSUMPTION_INVALID_COUNTRYRISKLAMBDA_JUDGMENT: en modo "direct_documented_judgment", value debe ser un número finito (valor actual: ${JSON.stringify(value)}). La metodología no exige value=1 — solo que Alpina lo use así (04 §10.4).`,
        );
      }
      const hasCompanyPct = Object.prototype.hasOwnProperty.call(lambdaValue, "domesticRevenuePctCompany");
      const hasMarketPct = Object.prototype.hasOwnProperty.call(lambdaValue, "domesticRevenuePctMarketAvg");
      if (hasCompanyPct || hasMarketPct) {
        blockers.push(
          `RESOLVED_ASSUMPTION_INVALID_COUNTRYRISKLAMBDA_JUDGMENT_UNEXPECTED_PCT: en modo "direct_documented_judgment", domesticRevenuePctCompany/domesticRevenuePctMarketAvg deben estar ausentes — no se fabrican porcentajes para aparentar el modo observado (04 §10.4).`,
        );
      }
    }
  }

  const horizonValue = (ra?.projectionHorizonYears as { value?: { years?: number } } | undefined)?.value;
  if (horizonValue && horizonValue.years !== MOTOR_SUPPORTED_PROJECTION_HORIZON_YEARS) {
    blockers.push(
      `RESOLVED_ASSUMPTION_INCOMPATIBLE_PROJECTIONHORIZONYEARS: el motor solo soporta ${MOTOR_SUPPORTED_PROJECTION_HORIZON_YEARS} años (resuelto: ${horizonValue.years}).`,
    );
  }
  // Horizonte efectivo para verificar longitud de paths: el resuelto si está presente, si no el único que el motor soporta.
  const effectiveHorizon = horizonValue?.years ?? MOTOR_SUPPORTED_PROJECTION_HORIZON_YEARS;

  const workingCapitalValue = (ra?.workingCapitalDriver as { value?: { explicitDeltaNwcByYear?: number[] } } | undefined)?.value;
  if (workingCapitalValue && workingCapitalValue.explicitDeltaNwcByYear.length !== effectiveHorizon) {
    blockers.push(
      `RESOLVED_ASSUMPTION_INVALID_WORKINGCAPITALDRIVER: explicitDeltaNwcByYear tiene ${workingCapitalValue.explicitDeltaNwcByYear.length} valores, se esperaban ${effectiveHorizon}.`,
    );
  }

  const taxValue = (ra?.taxTreatment as { value?: { explicitFcffTaxRatePctByYear?: number[] } } | undefined)?.value;
  if (taxValue && taxValue.explicitFcffTaxRatePctByYear.length !== effectiveHorizon) {
    blockers.push(
      `RESOLVED_ASSUMPTION_INVALID_TAXTREATMENT: explicitFcffTaxRatePctByYear tiene ${taxValue.explicitFcffTaxRatePctByYear.length} valores, se esperaban ${effectiveHorizon}.`,
    );
  }

  // Bloque 3C.4 (cierre de cobertura) — mismo principio que
  // workingCapitalDriver/taxTreatment arriba: cuando el driver resuelto
  // usa `mode: "explicit_path"`, su longitud debe coincidir exactamente
  // con el horizonte efectivo. Sin esta verificación, un path corto/largo
  // llegaría al motor y produciría `undefined`/`NaN` en años fuera de
  // rango (`canonical-financial-engine.ts::computeProjections`,
  // `explicitPath[t-1]`) en vez de bloquearse aquí, antes del cálculo.
  // El modo `percent_of_revenue` no tiene longitud que verificar — se
  // omite deliberadamente.
  const capexValue = (ra?.capexReinvestmentDriver as { value?: { mode?: string; explicitPath?: number[] } } | undefined)?.value;
  if (capexValue?.mode === "explicit_path" && (capexValue.explicitPath?.length ?? -1) !== effectiveHorizon) {
    blockers.push(
      `RESOLVED_ASSUMPTION_INVALID_CAPEXREINVESTMENTDRIVER: explicitPath tiene ${capexValue.explicitPath?.length ?? 0} valores, se esperaban ${effectiveHorizon}.`,
    );
  }

  const depreciationValue = (ra?.depreciationDaDriver as { value?: { mode?: string; explicitPath?: number[] } } | undefined)?.value;
  if (depreciationValue?.mode === "explicit_path" && (depreciationValue.explicitPath?.length ?? -1) !== effectiveHorizon) {
    blockers.push(
      `RESOLVED_ASSUMPTION_INVALID_DEPRECIATIONDADRIVER: explicitPath tiene ${depreciationValue.explicitPath?.length ?? 0} valores, se esperaban ${effectiveHorizon}.`,
    );
  }

  // Bloque 3C.5 (cierre) — `04 §11`/`05 v1.3 §6`: el motor
  // (`canonical-financial-engine.ts`) exige, en v5, los TRES números de
  // `terminalG` (`valuePct` base + `pessimisticScenarioPct`/
  // `optimisticScenarioPct` de escenario) — sin ellos lanza
  // explícitamente en vez de caer al hardcode legacy 3%/2%/4%. El tipo
  // (`TerminalGValue`) los declara opcionales a nivel de contrato
  // (compatibilidad general), pero para que UNA EJECUCIÓN v5 esté
  // completa, el preflight los exige aquí — no se vuelven obligatorios
  // globalmente, solo se bloquea antes del motor si faltan.
  const terminalGValue = (ra?.terminalG as { value?: { valuePct?: number; pessimisticScenarioPct?: number; optimisticScenarioPct?: number } } | undefined)?.value;
  if (terminalGValue) {
    const isFiniteNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
    if (!isFiniteNumber(terminalGValue.valuePct)) {
      blockers.push(`RESOLVED_ASSUMPTION_INVALID_TERMINALG: valuePct debe ser un número finito (valor actual: ${JSON.stringify(terminalGValue.valuePct)}).`);
    }
    if (!isFiniteNumber(terminalGValue.pessimisticScenarioPct)) {
      blockers.push(`RESOLVED_ASSUMPTION_INVALID_TERMINALG: pessimisticScenarioPct debe ser un número finito (valor actual: ${JSON.stringify(terminalGValue.pessimisticScenarioPct)}).`);
    }
    if (!isFiniteNumber(terminalGValue.optimisticScenarioPct)) {
      blockers.push(`RESOLVED_ASSUMPTION_INVALID_TERMINALG: optimisticScenarioPct debe ser un número finito (valor actual: ${JSON.stringify(terminalGValue.optimisticScenarioPct)}).`);
    }
  }

  return blockers;
}

export function evaluateCalculationPreflight(params: {
  incomeStatement: PreflightIncomeStatement | null | undefined;
  balanceSheet: PreflightBalanceSheet | null | undefined;
  /**
   * Bloque 3C.1 — supuestos metodológicos resueltos (05 v1.3 §6). Campo
   * opcional de este mismo objeto de parámetros (no un parámetro
   * adicional de la función, que sigue teniendo un único argumento).
   *
   * Lo que distingue legacy de v5 es la PRESENCIA de esta propiedad en
   * el objeto `params`, no su valor — un llamador legacy real omite la
   * clave por completo; un llamador v5 la incluye siempre, aunque su
   * valor sea `undefined`, `null`, `{}`, parcial o completo (en los
   * cuatro últimos casos, la validación de los 13 campos determina qué
   * falta o es inválido vía `findResolvedAssumptionBlockers`).
   */
  resolvedAssumptions?: Partial<ResolvedCalculationAssumptions> | null;
  /**
   * `analyses.expected_growth` (Judgment). Solo se evalúa si la clave está
   * presente: `null`/`undefined`/no finito → bloqueo explícito (nunca 25 por
   * defecto); `0` es un crecimiento cero válido.
   */
  expectedGrowth?: number | null;
}): CalculationPreflightResult {
  const missing_inputs = findMissingRequiredInputs(params.incomeStatement, params.balanceSheet);
  const unresolved_judgments =
    Object.prototype.hasOwnProperty.call(params, "expectedGrowth") &&
    !(typeof params.expectedGrowth === "number" && Number.isFinite(params.expectedGrowth))
      ? ["expected_growth"]
      : [];
  const judgmentBlockers = unresolved_judgments.map(
    (field) => `JUDGMENT_REQUIRED: "${field}" no está resuelto — no se usa ningún valor por defecto.`,
  );

  // Distinción legacy vs. v5 — corregida en esta revisión: por
  // PRESENCIA de la propiedad `resolvedAssumptions` en `params`, no por
  // su valor. Una llamada legacy real no incluye esa clave en absoluto
  // — `params.resolvedAssumptions` sería `undefined` de todos modos,
  // indistinguible en JS de "la llamada incluyó la clave con valor
  // `undefined`" si solo se mirara el valor (`!== undefined`). Por eso
  // la distinción legacy/v5 se decide con `hasOwnProperty` sobre la
  // clave, nunca con una comparación de valor.
  const hasResolvedAssumptionsKey = Object.prototype.hasOwnProperty.call(params, "resolvedAssumptions");

  if (!hasResolvedAssumptionsKey) {
    // Legacy exacto: la clave ni siquiera formó parte de la ejecución.
    // Comportamiento IDÉNTICO, campo por campo, al preflight anterior a
    // Bloque 3C.1 — `findResolvedAssumptionBlockers` ni se invoca.
    const unapproved_assumptions = findUnapprovedAssumptions();
    const blockers: string[] = [
      ...missing_inputs.map(
        (field) => `INPUT_MISSING: "${field}" ausente en structured_input — no se puede calcular sin fabricar un valor.`,
      ),
      ...unapproved_assumptions.map(
        (name) => `METHODOLOGY_APPROVAL_REQUIRED: el supuesto "${name}" no tiene aprobación humana registrada.`,
      ),
      ...judgmentBlockers,
    ];
    return {
      passed: missing_inputs.length === 0 && unapproved_assumptions.length === 0 && unresolved_judgments.length === 0,
      missing_inputs,
      unapproved_assumptions,
      unresolved_judgments,
      blockers,
    };
  }

  // Ejecución v5: la clave está presente, sea cual sea su valor
  // (`undefined`, `null`, `{}`, parcial o completo) — todos exigen que
  // los 13 supuestos resueltos se validen; ninguno cae al fallback
  // legacy. Los 13 supuestos resueltos SUSTITUYEN la pregunta legacy de
  // "¿los 8 defaults globales están approved=true?" (que nunca puede
  // responderse afirmativamente, ver cabecera) — no tiene sentido exigir
  // ambas simultáneamente para la MISMA ejecución.
  const unapproved_assumptions: string[] = [];
  const resolved_assumption_blockers = findResolvedAssumptionBlockers(params.resolvedAssumptions);

  const blockers: string[] = [
    ...missing_inputs.map(
      (field) => `INPUT_MISSING: "${field}" ausente en structured_input — no se puede calcular sin fabricar un valor.`,
    ),
    ...resolved_assumption_blockers,
    ...judgmentBlockers,
  ];

  return {
    passed: missing_inputs.length === 0 && resolved_assumption_blockers.length === 0 && unresolved_judgments.length === 0,
    missing_inputs,
    unapproved_assumptions,
    unresolved_judgments,
    blockers,
  };
}
