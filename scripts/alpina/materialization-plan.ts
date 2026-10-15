// Materialización del caso Alpina en Supabase — plan PURO.
//
// Dirección única: fixtures canónicos del repo → snapshot en Supabase.
// Este módulo no toca la red ni el disco: solo construye, a partir de los
// fixtures congelados (`supabase/functions/_shared/alpina-2024.*`) y del
// texto de la metodología, exactamente qué filas deben existir. Nunca
// modifica los fixtures (los importa de solo lectura) y nunca inventa un
// valor: todo número sale de un fixture y todo texto de Judgment cita su
// archivo fuente. Lo que el repo no documenta queda vacío o ABIERTO.
//
// Capas (ADR-003, Evidence ≠ Judgment ≠ Calculation):
// - REPO_CANONICAL_EVIDENCE: números FY2024 del structured input.
// - JUDGMENT: los 13 supuestos resueltos + decisiones documentadas.
// - SUPABASE_DOCUMENT_EVIDENCE: ninguna (no hay documentos subidos).
// - CALCULATION: solo por el flujo oficial `ejecutar-calculo`.
import { ALPINA_2024_STRUCTURED_INPUT, ALPINA_2024_EXPECTED_GROWTH_PCT, ALPINA_2024_EXTENDED_EVIDENCE } from "../../supabase/functions/_shared/alpina-2024.structured-input";
import { ALPINA_2024_RESOLVED_ASSUMPTIONS as RA } from "../../supabase/functions/_shared/alpina-2024.resolved-assumptions";
import { canonicalStringify } from "../../supabase/functions/_shared/calculation-fingerprint";
import type { BusinessProfile } from "../../src/types/case-metadata";

export const MATERIALIZATION_ID = "alpina-2024-repo-canonical-v1";
export const MATERIALIZATION_EVENT = "case_materialized_from_repo";

const FILES = {
  structuredInput: "supabase/functions/_shared/alpina-2024.structured-input.ts",
  resolvedAssumptions: "supabase/functions/_shared/alpina-2024.resolved-assumptions.ts",
  canonicalExecution: "supabase/functions/_shared/alpina-2024.canonical-execution.test.ts",
  methodologyDecisions: "docs/velarix-v5/03-methodology-decisions-v5.md",
  caseHome: "docs/cases/alpina/00-case-home.md",
  adr004: "docs/decisions/ADR-004-alpina-base-de-valoracion.md",
  engineAudit: "docs/velarix-v5/05-financial-engine-audit.md",
} as const;
export const SOURCE_FILES = Object.values(FILES);

const n = (v: number) => v.toLocaleString("en-US");

/** `analyses` — contexto del caso. */
export const ALPINA_ANALYSIS = {
  company_name: "Alpina Productos Alimenticios S.A.S. BIC",
  // `ALPINA_SECTOR` de alpina-2024.canonical-execution.test.ts: el string
  // con el que se congeló la ejecución. En v5 es inerte para el DCF (solo
  // alimenta `sectorBenchmark`), verificado empíricamente en ese test.
  sector: "Alimentos y bebidas",
  expected_growth: ALPINA_2024_EXPECTED_GROWTH_PCT,
  moneda_analisis: ALPINA_2024_STRUCTURED_INPUT.moneda_analisis as string,
} as const;

/** `structured_inputs.input_payload` — copia JSON exacta del fixture (sin añadir ni quitar campos). */
export const ALPINA_STRUCTURED_PAYLOAD: Record<string, unknown> = JSON.parse(JSON.stringify(ALPINA_2024_STRUCTURED_INPUT));

/** Igualdad estructural estable (orden de claves irrelevante), la misma que usa el fingerprint. */
export const sameJson = (a: unknown, b: unknown) => canonicalStringify(a) === canonicalStringify(b);

/** Metadatos del caso que no tienen columna en el esquema (00-home, decisión abierta 5): solo van al audit trail. */
export const ALPINA_CASE_METADATA = {
  subject: "100% del economic equity",
  valuation_date: "2024-12-31",
  basis_of_value: "Market Value (IVS 102)",
  architecture: "PARENT_DCF_PLUS_SOTP (este caso cubre solo el standalone parent DCF; SOTP fuera de alcance)",
  unit: "COP miles",
  lease_convention: "CAPITALIZED_LEASES",
  source: `${FILES.resolvedAssumptions} (cabecera) · ${FILES.caseHome}`,
} as const;

// ─── Metadata estructurado del caso (columnas de analyses) ──────────

/** Columnas de `analyses` (migración 20261015180000), solo desde fuentes documentadas. */
export const ALPINA_CASE_COLUMNS = {
  valuation_date: ALPINA_CASE_METADATA.valuation_date,
  base_period: "FY2024 (cierre 2024-12-31)",
  basis_of_value: ALPINA_CASE_METADATA.basis_of_value,
  valued_interest: "100% del economic equity de Alpina Productos Alimenticios S.A.S. BIC — standalone parent (antes de SOTP)",
  calculation_architecture: "PARENT_DCF_PLUS_SOTP — en código solo el standalone parent DCF; SOTP es un análisis separado",
} as const;

const IS0 = ALPINA_2024_STRUCTURED_INPUT.income_statement;
const ebitdaFy2024 = (IS0.revenue as number) - (IS0.cost_of_sales as number) - (IS0.opex as number) + (IS0.da as number);
const leaseShare = ALPINA_2024_EXTENDED_EVIDENCE.leaseLiabilities / (ALPINA_2024_STRUCTURED_INPUT.balance_sheet.financial_debt_total as number);
const p1 = (x: number) => `${(x * 100).toFixed(2)}%`;

/**
 * Resumen operativo mínimo para la pestaña Business. Solo lo que el repo ya
 * documenta (ADR-004, fixtures, metodología); los números se derivan de los
 * fixtures. Lo no documentado queda vacío con su motivo en `gaps`.
 */
export const ALPINA_BUSINESS_PROFILE: BusinessProfile = {
  moc_path: FILES.caseHome,
  summary: {
    text: "Negocio operativo de consumo (sector lácteo/consumo) con ingresos recurrentes, inventario, cuentas por cobrar/pagar, CAPEX y deuda: un caso DCF corporativo limpio. Comparables: Emerging Markets — Food Processing (Damodaran, ene-2025).",
    source: `${FILES.adr004} ("Por qué Alpina") · ${FILES.methodologyDecisions} (C-02) · ${FILES.resolvedAssumptions} (capitalStructure.source)`,
  },
  segments: [],
  geographies: [
    { text: "Colombia — entidad standalone; riesgo país vía CRP Colombia (Baa2) con λ = 1.", source: `${FILES.resolvedAssumptions} (countryRiskPremium, countryRiskLambda)` },
    { text: "Desglose ingresos domésticos vs. exportación: no disponible en la Evidence revisada.", source: `${FILES.resolvedAssumptions} (countryRiskLambda.rationale)` },
    { text: "Fuera del perímetro: la subsidiaria Alpina Cauca Zona Franca S.A.S.", source: `${FILES.resolvedAssumptions} (taxTreatment.rationale)` },
  ],
  value_drivers: [
    { text: `Crecimiento de ingresos ${ALPINA_2024_EXPECTED_GROWTH_PCT}% plano a 5 años (parámetro del motor).`, source: `${FILES.structuredInput} (ALPINA_2024_EXPECTED_GROWTH_PCT)` },
    { text: `Margen EBITDA FY2024 ${p1(ebitdaFy2024 / (IS0.revenue as number))} (EBITDA ${n(ebitdaFy2024)} COP miles), base del forecast.`, source: `${FILES.structuredInput} (income_statement)` },
    { text: "Reinversión: CAPEX explícito desde ≈2.86% de ingresos hacia la reinversión terminal consistente con g/ROC (ROC ≈24%).", source: `${FILES.resolvedAssumptions} (capexReinvestmentDriver)` },
    { text: `g terminal ${RA.terminalG.value.valuePct}% (overlays ${RA.terminalG.value.pessimisticScenarioPct}% / ${RA.terminalG.value.optimisticScenarioPct}%).`, source: `${FILES.resolvedAssumptions} (terminalG)` },
  ],
  key_risks: [
    { text: "Cobertura de intereses ≈2.02x: credit sanity check a vigilar, no distress.", source: `${FILES.resolvedAssumptions} (capitalStructure.rationale)` },
    { text: `Leases = ${p1(leaseShare)} de la deuda debt-like (${n(ALPINA_2024_EXTENDED_EVIDENCE.leaseLiabilities)} de ${n(ALPINA_2024_STRUCTURED_INPUT.balance_sheet.financial_debt_total as number)}), bajo CAPITALIZED_LEASES.`, source: `${FILES.structuredInput} (ALPINA_2024_EXTENDED_EVIDENCE)` },
    { text: `Riesgo país Colombia: CRP ${RA.countryRiskPremium.value.valuePct}% con λ = ${RA.countryRiskLambda.value.value}; sensibilidad λ ≈ 1.10–1.15 documentada como escenario cualitativo.`, source: `${FILES.resolvedAssumptions} (countryRiskPremium, countryRiskLambda)` },
    { text: `Costo de deuda sin referencia marginal observable: fallback histórico implícito ${RA.costOfDebt.value.valuePct}%.`, source: `${FILES.resolvedAssumptions} (costOfDebt)` },
  ],
  gaps: {
    segments: "No documentados en el repo: Company Understanding sigue pendiente en el case MOC.",
  },
};

// ─── Expediente: account_notes ──────────────────────────────────────

const EE = ALPINA_2024_EXTENDED_EVIDENCE;
const BS = ALPINA_2024_STRUCTURED_INPUT.balance_sheet;
const IS = ALPINA_2024_STRUCTURED_INPUT.income_statement;

export interface AccountNotePlan { canonical_account: string; interpretation_text: string }

export const ALPINA_ACCOUNT_NOTES: AccountNotePlan[] = [
  {
    canonical_account: "financial_debt_total",
    interpretation_text:
      `[REPO_CANONICAL_JUDGMENT · CAPITALIZED_LEASES] Deuda debt-like = deuda bancaria ${n(EE.bankFinancialDebt)} + pasivos por arrendamiento (NIIF 16) ${n(EE.leaseLiabilities)} = ${n(BS.financial_debt_total as number)} COP miles. ` +
      `Se consume una sola vez, en el puente EV→Equity (netDebt = ${n(BS.financial_debt_total as number)} − caja ${n(BS.cash as number)}); los pesos del WACC vienen de comparables (capitalStructure), no de este campo. Clasificación: MAPPING_SUPPORTED. ` +
      `Fuente: ${FILES.structuredInput} (EXECUTION MAPPING CHECK, puntos A y D).`,
  },
  {
    canonical_account: "da",
    interpretation_text:
      `[REPO_CANONICAL_JUDGMENT · CAPITALIZED_LEASES] D&A FY2024 observado = ${n(IS.da as number)} = depreciación PP&E ${n(EE.daBreakdown.ppeDepreciation)} + depreciación ROU ${n(EE.daBreakdown.rouDepreciation)} + amortización de intangibles ${n(EE.daBreakdown.intangiblesAmortization)} COP miles. ` +
      `El driver proyectado (${RA.depreciationDaDriver.value.daPctOfRevenue}% de ingresos) es inclusivo de ROU; no hay segunda adición de ROU. ` +
      `Fuente: ${FILES.structuredInput} (punto B) y ${FILES.resolvedAssumptions} (depreciationDaDriver).`,
  },
];

// ─── Expediente: questions / answers ────────────────────────────────

export interface QuestionPlan {
  code: string;
  texto: string;
  razon: string;
  /** `null` = el repo no documenta una respuesta: la pregunta queda ABIERTA. */
  answer: string | null;
}

/** Tema y evidencia requerida, copiados de la Capa B de 03-methodology-decisions-v5.md (verificado por test). */
const C = {
  "C-01": ["Régimen tributario y posición de NOLs de Alpina", "Declaraciones de renta recientes de Alpina, confirmación de si aplica algún régimen especial (zona franca, renta exenta, incentivo sectorial), saldo de pérdidas fiscales compensables si existe y su plazo/límite legal de compensación bajo la normativa vigente."],
  "C-02": ["Estructura de capital objetivo/comparables para Alpina", "Set de comparables públicos del sector lácteo/consumo (Colombia/Latinoamérica/global si no hay suficientes comparables regionales), su estructura de capital observable (valores de mercado), beta observado por comparable; estructura contable actual de Alpina como verificación secundaria; evidencia de si Alpina tiene un plan de desapalancamiento/apalancamiento que justifique una estructura transicional."],
  "C-03": ["Costo de deuda real de Alpina", "Tasas reales de los créditos/bonos vigentes de Alpina (si existen y son observables), o spread de crédito implícito por calificación/tamaño si no hay deuda observable directamente."],
  "C-04": ["`g` terminal específico de Alpina", "Crecimiento potencial de largo plazo del sector de Alpina en Colombia (y en las geografías donde opere, si exporta o tiene operación fuera de Colombia), consistente con inflación de largo plazo y PIB potencial (Banco de la República/DANE), verificado contra `WACC > g` y contra `Reinvestment Rate = g/ROC` (P-07)."],
  "C-05": ["Ajustes concretos de normalización de EBITDA de Alpina", "Estados financieros auditados y sus notas de Alpina (base de evidencia primaria); soporte adicional (contratos, actas, benchmarks de compensación de mercado) cuando esté disponible y la materialidad del ajuste lo amerite; verificación de recurrencia real multi-año."],
  "C-06": ["Clasificación de cuentas de capital de trabajo de Alpina", "Detalle de AR/inventario/AP/pasivos acumulados de Alpina; verificación específica de si Alpina usa supplier finance/reverse factoring o mecanismos similares, y evidencia de la sustancia económica de esos acuerdos si existen."],
  "C-07": ["Plan de CAPEX de Alpina (mantenimiento vs. crecimiento)", "Plan de inversión real de Alpina (si existe documentado), histórico de CAPEX vs. D&A de varios años, evidencia de proyectos de expansión específicos vs. reposición de activos existentes."],
  "C-08": ["Partidas del puente EV→Equity de Alpina", "Deuda financiera real (montos, tasas, vencimientos); si Alpina reporta bajo NIIF 16, el pasivo por arrendamiento y si el EBITDA usado ya lo excluye correctamente; caja total y si alguna porción está restringida (garantías, depósitos); inversiones/activos no operacionales si existen; si Alpina tiene subsidiarias con NCI o participaciones en asociadas/negocios conjuntos."],
  "C-09": ["Aplicabilidad de DLOM/size premium a Alpina", "Naturaleza exacta del interés que se valora (control total vs. participación específica), evidencia de mecanismos de salida/liquidez reales o su ausencia, tamaño relativo de Alpina frente a los comparables usados para beta/estructura de capital (C-02) — para verificar si ya hay algún efecto de tamaño implícito en esos comparables que evitaría doble conteo."],
  "C-10": ["Fecha de valoración y stub period de Alpina", "Fecha exacta de valoración acordada para el caso, fecha de cierre de los estados financieros base usados, y si ambas coinciden o requieren modelar un stub period."],
  "C-11": ["Exposición de Alpina al riesgo país (lambda)", "Desagregación geográfica de ingresos de Alpina (¿qué % es doméstico Colombia vs. exportaciones/operación en otros países?), comparada contra el % doméstico promedio de una empresa colombiana típica, para calcular `λ` y decidir si el CRP vigente aplicado al caso debe utilizarse completo, escalado hacia arriba o hacia abajo."],
  "C-12": ["Drivers de forecast de Alpina (crecimiento de ingresos, trayectoria de márgenes)", "Plan de negocio/proyecciones internas de Alpina si existen, histórico de crecimiento y de márgenes de varios años, evidencia de por qué el margen actual (o uno distinto) es sostenible o no hacia el año terminal."],
} as const;
export const METHODOLOGY_QUESTION_TEXT = C;

const judgment = (key: keyof typeof RA, extra = "") =>
  `[REPO_CANONICAL_JUDGMENT] ${RA[key].rationale}${extra} Fuente: ${FILES.resolvedAssumptions} → ${key} (${RA[key].source})`;

/** Frase del rationale congelado de capexReinvestmentDriver que queda stale una vez existe el check determinístico. */
export const C07_STALE_SENTENCE = "Verificación g/ROC terminal pendiente como cross-check fuera del motor (05 §10), no bloquea este valor.";
const C07_CHECK_NOTE =
  "La verificación aritmética g/ROC terminal (Net Reinvestment/NOPAT vs. g/ROC) es una validación de CALCULATION, no parte de este Judgment: ver TERMINAL REINVESTMENT CHECK (Challenge y audit event terminal_reinvestment_check) sobre el cálculo oficial persistido.";

const ANSWERS: Record<keyof typeof C, string | null> = {
  "C-01": judgment("taxTreatment"),
  "C-02": judgment("capitalStructure"),
  "C-03": judgment("costOfDebt"),
  "C-04": judgment("terminalG"),
  "C-05": null, // 00-case-home: "Normalizations — Pendiente de documentar".
  "C-06": null, // ΔNWC resuelto, pero el repo no documenta la verificación de supplier finance.
  // El rationale congelado no se modifica (fixture); la transcripción vigente
  // sustituye solo la frase stale por la referencia al check determinístico.
  "C-07": `[REPO_CANONICAL_JUDGMENT] ${RA.capexReinvestmentDriver.rationale.replace(C07_STALE_SENTENCE, C07_CHECK_NOTE)} Fuente: ${FILES.resolvedAssumptions} → capexReinvestmentDriver (${RA.capexReinvestmentDriver.source})`,
  "C-08":
    `[REPO_CANONICAL_JUDGMENT · CAPITALIZED_LEASES] Debt-like = bancaria ${n(EE.bankFinancialDebt)} + leases ${n(EE.leaseLiabilities)} = ${n(BS.financial_debt_total as number)}; caja ${n(BS.cash as number)}; netDebt = ${n((BS.financial_debt_total as number) - (BS.cash as number))} COP miles, consumido una sola vez en el puente. ` +
    `D&A (incluye ROU) y CAPEX (reinversión económica agregada, incluye lease reinvestment) sin doble conteo. SOTP fuera de este puente. Clasificación MAPPING_SUPPORTED. ` +
    `Caja restringida, NCI y asociadas: no documentados en el repo para este perímetro standalone. Fuente: ${FILES.structuredInput} (EXECUTION MAPPING CHECK A–D).`,
  "C-09": null, // Sin conclusión documentada sobre DLOM/size premium.
  "C-10":
    `[REPO_CANONICAL_JUDGMENT] Fecha de valoración ${ALPINA_CASE_METADATA.valuation_date} = cierre del período base FY2024; sin stub period. Basis of value: ${ALPINA_CASE_METADATA.basis_of_value}. ` +
    `Fuente: ${FILES.resolvedAssumptions} (cabecera, "Valuation date: 2024-12-31 (coincide con el cierre del período base)") y ${FILES.caseHome}.`,
  "C-11": judgment("countryRiskLambda"),
  "C-12": null, // expected_growth 3.0% plano está cerrado, pero el repo no documenta su rationale de drivers.
};

const razonFor = (code: string, evidence: string) => `${evidence} Fuente: ${FILES.methodologyDecisions} (Capa B, ${code}).`;

/** Las 12 preguntas canónicas C-01…C-12 (Capa B). */
export const ALPINA_QUESTIONS: QuestionPlan[] = (Object.keys(C) as (keyof typeof C)[]).map((code) => ({
  code,
  texto: `[${code}] ${C[code][0]}`,
  razon: razonFor(code, C[code][1]),
  answer: ANSWERS[code],
}));

/** Pasos que solo se aplican si existe un `terminal_reinvestment_check` PASS para el cálculo persistido. */
export const TERMINAL_CHECK_EVENT = "terminal_reinvestment_check";

/**
 * Preguntas creadas antes y luego RECLASIFICADAS como validación de
 * CALCULATION (no Judgment humano). La fila se conserva tal cual; la
 * reclasificación se registra con un audit event `expedient_question_reclassified`.
 */
export const RECLASSIFIED_QUESTIONS: (QuestionPlan & { reclassifiedAs: string; reason: string })[] = [
  {
    // Creada el 2026-10-15 como seguimiento abierto de C-07. Es una operación
    // aritmética determinística sobre el cálculo persistido: se resuelve con
    // TERMINAL REINVESTMENT CHECK, no con una respuesta humana.
    code: "C-07.1",
    texto: "[C-07.1] Cross-check g/ROC terminal de la reinversión de Alpina",
    razon:
      `Verificar fuera del motor que Net Reinvestment/NOPAT ≈ g/ROC en el año terminal (g = ${RA.terminalG.value.valuePct}%, ROC diagnóstico ≈24%). ` +
      "Es un cross-check metodológico/documental adicional: el cálculo oficial ya está completo y verificado contra el resultado congelado, y este pendiente no bloquea ni invalida el calculation_result persistido. " +
      `Fuente: ${FILES.resolvedAssumptions} (capexReinvestmentDriver.rationale: "Verificación g/ROC terminal pendiente como cross-check fuera del motor (05 §10), no bloquea este valor") · ${FILES.engineAudit} (§8/§11, "Verificación manual").`,
    answer: null,
    reclassifiedAs: "CALCULATION_VALIDATION",
    reason: "Net Reinvestment/NOPAT vs. g/ROC es una operación aritmética determinística sobre el cálculo oficial persistido: se verifica con TERMINAL REINVESTMENT CHECK (PASS), no con Judgment humano. La fila se conserva como historial.",
  },
];

/**
 * Respuestas superseded (misma pregunta, nueva versión de la transcripción).
 * Solo se aplican tras un TERMINAL REINVESTMENT CHECK PASS persistido.
 */
export const SUPERSEDED_ANSWER_WORDING: Record<string, { answer: string; reason: string; requiresTerminalCheck: boolean }> = {
  "C-07": {
    answer: judgment("capexReinvestmentDriver"),
    reason: "La transcripción decía que la verificación g/ROC terminal seguía pendiente; quedó resuelta por el TERMINAL REINVESTMENT CHECK determinístico (PASS) sobre el cálculo oficial persistido. El rationale congelado del fixture no cambia.",
    requiresTerminalCheck: true,
  },
};

/**
 * Versiones superseded del wording (historial, nunca se borran). La fila
 * vieja permanece en Supabase; la nueva la referencia con
 * `supersedes_question_id` y queda un audit event `expedient_question_superseded`.
 */
export const SUPERSEDED_QUESTION_WORDING: Record<string, { razon: string; reason: string }> = {
  "C-11": {
    razon: razonFor("C-11", "Desagregación geográfica de ingresos de Alpina (¿qué % es doméstico Colombia vs. exportaciones/operación en otros países?), comparada contra el % doméstico promedio de una empresa colombiana típica, para calcular `λ` y decidir si el CRP de 2.85% se aplica completo, escalado hacia arriba o hacia abajo."),
    reason: "El wording acoplaba la pregunta a un CRP fechado (2.85%, snapshot ene-2026 de 03 §P-05) distinto del CRP vigente del caso (2.541%, countryRiskPremium). La metodología declara esos valores \"snapshots fechados, nunca constantes del método\". El Judgment de C-11 (λ = 1, R-01) no cambia.",
  },
};

/** Prefijo estable con el que el script reconoce una pregunta ya materializada. */
export const questionKey = (texto: string) => /^\[(C-\d{2}(?:\.\d+)?)\]/.exec(texto)?.[1] ?? null;

// ─── Audit trail ────────────────────────────────────────────────────

export function buildMaterializationMetadata(params: { gitCommit: string; inputFingerprint: string }) {
  return {
    materialization_id: MATERIALIZATION_ID,
    direction: "repo_fixtures → supabase (los fixtures nunca se modifican)",
    git_commit: params.gitCommit,
    source_files: SOURCE_FILES,
    input_fingerprint_local: params.inputFingerprint,
    case: ALPINA_CASE_METADATA,
    layers: {
      REPO_CANONICAL_EVIDENCE: "structured_inputs.input_payload.income_statement / balance_sheet (FY2024 standalone; estados financieros fuente no versionados en el repo)",
      JUDGMENT: "structured_inputs.input_payload.resolved_assumptions (13/13) + Expediente transcrito con prefijo [REPO_CANONICAL_JUDGMENT]",
      SUPABASE_DOCUMENT_EVIDENCE: "ninguna — no se subieron documentos ni se simuló el pipeline documental",
      CALCULATION: "pendiente — solo por ejecutar-calculo (flujo oficial), nunca copiado del test congelado",
    },
    expediente: {
      account_notes: ALPINA_ACCOUNT_NOTES.map((a) => a.canonical_account),
      questions_answered: ALPINA_QUESTIONS.filter((q) => q.answer).map((q) => q.code),
      questions_open: ALPINA_QUESTIONS.filter((q) => !q.answer).map((q) => q.code),
    },
  };
}

// ─── Comparación cálculo oficial vs. motor local congelado ──────────

export interface Difference { path: string; expected: unknown; actual: unknown }

/**
 * Tolerancia técnica de precisión de máquina (no financiera):
 * |a − b| ≤ K · ε · max(1, |a|, |b|), con ε = Number.EPSILON (2⁻⁵²).
 *
 * Evidencia (primera ejecución oficial de Alpina, 2026-10-15): 10 de 438
 * números difirieron entre Deno/V8 (Edge Function) y Node/V8 (local), todos
 * en exactamente 1 ULP, con K observado ≤ 0.818. Nacen en
 * `discountedFcf` del año 5 (FCFF/(1+WACC)^5 — `Math.pow` no está obligado
 * a redondear correctamente y puede diferir 1 ULP entre versiones de V8) y
 * se propagan a las sumas de EV de escenarios y de la matriz.
 * K = 4 deja margen para que ese ULP se acumule en una suma de pocos
 * términos (EV = 5 PV + PV(TV)) y sigue siendo ~1e-15 relativo: un error
 * financiero real de 1 COP miles sobre el EV (~6e-10 relativo) queda un
 * millón de veces por encima.
 */
export const MACHINE_PRECISION_K = 4;

export const isFloatEquivalent = (a: number, b: number) =>
  Number.isFinite(a) && Number.isFinite(b) &&
  Math.abs(a - b) <= MACHINE_PRECISION_K * Number.EPSILON * Math.max(1, Math.abs(a), Math.abs(b));

export interface Comparison {
  /** Hojas (string/number/boolean/null) idénticas. */
  exactMatches: number;
  /** Números distintos solo por precisión de máquina (diagnóstico, no bloquean). */
  floatEquivalent: Difference[];
  /** Cualquier otra diferencia: valor, tipo, clave, estructura. Bloquean. */
  realMismatches: Difference[];
}

/**
 * Compara dos valores JSON clasificando cada hoja en EXACT_MATCH,
 * FLOAT_EQUIVALENT o REAL_MISMATCH. Estructura, claves, arrays, strings,
 * booleans y null: exactos. Números: exactos o dentro de MACHINE_PRECISION_K.
 * Ninguna diferencia se descarta en silencio: las float quedan listadas.
 */
export function compareJson(expected: unknown, actual: unknown, path = "$", out: Comparison = { exactMatches: 0, floatEquivalent: [], realMismatches: [] }): Comparison {
  if (typeof expected === "number" && typeof actual === "number") {
    if (Object.is(expected, actual)) out.exactMatches++;
    else (isFloatEquivalent(expected, actual) ? out.floatEquivalent : out.realMismatches).push({ path, expected, actual });
    return out;
  }
  if (expected === null || actual === null || typeof expected !== "object" || typeof actual !== "object") {
    if (expected === actual) out.exactMatches++;
    else out.realMismatches.push({ path, expected, actual });
    return out;
  }
  if (Array.isArray(expected) !== Array.isArray(actual)) {
    out.realMismatches.push({ path, expected, actual });
    return out;
  }
  const keys = new Set([...Object.keys(expected as object), ...Object.keys(actual as object)]);
  for (const k of keys) compareJson((expected as Record<string, unknown>)[k], (actual as Record<string, unknown>)[k], `${path}.${k}`, out);
  return out;
}

/** Partes del resultado que deben ser idénticas entre la ejecución oficial y el motor local. */
export const COMPARED_RESULT_KEYS = ["valuation", "projections", "kpis", "scenarios", "sensitivityMatrix", "sectorBenchmark", "moneda", "factor_conversion"] as const;
