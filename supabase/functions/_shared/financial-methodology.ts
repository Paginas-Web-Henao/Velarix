// Bloque 1B-M — Contrato tipado y versionado de los supuestos financieros
// canónicos usados por el motor servidor (`ejecutar-calculo`).
//
// Sin imports de URL, sin Supabase, sin `serve()`, sin variables de
// entorno, sin efectos secundarios — importable desde Deno y desde
// Vitest indistintamente.
//
// Este archivo NO conecta fuentes externas ni automatiza tasas — usa
// ÚNICAMENTE valores ya existentes y documentados en el repositorio
// (los mismos 7 literales que antes vivían duplicados e inline dentro de
// `ejecutar-calculo/index.ts`, ver docs/velarix/bloque-1a/BL-26-tabla-comparativa-motores.md
// sección 4). Ningún valor aquí es nuevo ni fue inventado en este bloque.
//
// Los valores marcados `approved: false` son **provisionales** — reflejan
// el comportamiento actual del sistema, no una metodología ya aprobada
// por el fundador o un revisor financiero externo. Ver
// docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md.

export type AssumptionUnit = "percent" | "decimal" | "ratio" | "days";
export type AssumptionSourceType = "hardcoded_legacy" | "sector_benchmark" | "market_data" | "business_rule";

export interface FinancialAssumption {
  /** Valor efectivamente usado hoy por ejecutar-calculo. */
  value: number;
  unit: AssumptionUnit;
  /** Tipo de fuente — hoy todas son "hardcoded_legacy": constantes literales sin fuente externa conectada. */
  sourceType: AssumptionSourceType;
  /** Descripción legible de la fuente (no una URL ni una conexión real). */
  sourceDescription: string;
  /** Fecha desde la que este valor está vigente en el código (no una fecha de "aprobación financiera"). */
  effectiveDate: string;
  /** ¿El servidor permite que `structured_input` sobrescriba este valor hoy? Ver R-19. */
  editableByInput: boolean;
  /** ¿Fue aprobado explícitamente por el fundador o un revisor financiero externo? */
  approved: boolean;
  /** Por qué existe este valor como fallback fijo, si no fue aprobado formalmente. */
  fallbackReason: string;
  /** Advertencias metodológicas específicas de este supuesto. */
  warnings: string[];
}

export interface FinancialMethodology {
  methodologyVersion: string;
  assumptions: {
    taxRatePct: FinancialAssumption;
    capexPctOfRevenue: FinancialAssumption;
    workingCapitalPctOfRevenue: FinancialAssumption;
    terminalGrowthPct: FinancialAssumption;
    costOfDebtPct: FinancialAssumption;
    riskFreeRatePct: FinancialAssumption;
    equityRiskPremiumPct: FinancialAssumption;
    depreciationPctOfRevenue: FinancialAssumption;
  };
  /** Advertencias metodológicas a nivel de todo el motor, no de un supuesto individual. */
  globalWarnings: string[];
}

/**
 * Metodología canónica vigente hoy (2026-07-23). Todos los valores son
 * los mismos 7 (+1) literales que ya existían inline en
 * `ejecutar-calculo/index.ts` antes de este bloque — ningún número nuevo.
 * `approved: false` en todos porque ninguno ha sido revisado formalmente
 * por el fundador ni por un revisor financiero externo (`Negocio_Velarix_v4.1.md`
 * §9.4) — son el comportamiento actual del sistema, no una decisión ya
 * tomada.
 */
export const CANONICAL_METHODOLOGY: FinancialMethodology = {
  methodologyVersion: "1.0.0-provisional",
  assumptions: {
    taxRatePct: {
      value: 30,
      unit: "percent",
      sourceType: "hardcoded_legacy",
      sourceDescription: "Tasa corporativa de referencia para Colombia (comentario original: \"Colombian corporate rate\")",
      effectiveDate: "2026-03-20",
      editableByInput: false,
      approved: false,
      fallbackReason: "Nunca se conectó a una tabla de tasas real ni a un valor que el usuario pueda ajustar en el servidor.",
      warnings: ["No refleja regímenes tributarios especiales (zonas francas, rentas exentas, etc.)."],
    },
    capexPctOfRevenue: {
      value: 5,
      unit: "percent",
      sourceType: "hardcoded_legacy",
      sourceDescription: "Supuesto fijo de CAPEX como % de ingresos",
      effectiveDate: "2026-03-20",
      editableByInput: false,
      approved: false,
      fallbackReason: "El cliente expone este campo como ajustable por el usuario (FinancialInputs.capexPct); el servidor lo ignora.",
      warnings: ["Un CAPEX real muy distinto al 5% distorsiona el FCFF proyectado sin ningún aviso al usuario."],
    },
    workingCapitalPctOfRevenue: {
      value: 3,
      unit: "percent",
      sourceType: "hardcoded_legacy",
      sourceDescription: "Supuesto fijo de capital de trabajo como % de ingresos",
      effectiveDate: "2026-03-20",
      editableByInput: false,
      approved: false,
      fallbackReason: "Mismo patrón que capexPctOfRevenue.",
      warnings: [],
    },
    terminalGrowthPct: {
      value: 3,
      unit: "percent",
      sourceType: "business_rule",
      sourceDescription: "Crecimiento perpetuo asumido para el valor terminal (Gordon Growth)",
      effectiveDate: "2026-03-20",
      editableByInput: false,
      approved: false,
      fallbackReason: "No hay una decisión documentada sobre si debe atarse a la inflación/PIB de largo plazo de Colombia.",
      warnings: ["Un g terminal fijo para todos los sectores ignora diferencias reales de crecimiento de largo plazo entre industrias."],
    },
    costOfDebtPct: {
      value: 8,
      unit: "percent",
      sourceType: "hardcoded_legacy",
      sourceDescription: "Costo de deuda pre-impuesto asumido",
      effectiveDate: "2026-03-20",
      editableByInput: false,
      approved: false,
      fallbackReason: "No conectado a un spread de deuda real por sector o por calificación crediticia de la empresa.",
      warnings: [],
    },
    riskFreeRatePct: {
      value: 4.35,
      unit: "percent",
      sourceType: "market_data",
      sourceDescription: "US Treasury 10Y (según comentario original en financial-engine.ts, actualizado Feb 2026)",
      effectiveDate: "2026-02-01",
      editableByInput: false,
      approved: false,
      fallbackReason: "Valor de mercado copiado manualmente, no conectado a una fuente en vivo.",
      warnings: ["Puede quedar desactualizado si no se refresca manualmente — no hay proceso de vigencia automatizado (eso es Fase 7)."],
    },
    equityRiskPremiumPct: {
      value: 5.80,
      unit: "percent",
      sourceType: "market_data",
      sourceDescription: "Damodaran ERP Emerging Markets (según comentario original, actualizado Jan 2026)",
      effectiveDate: "2026-01-01",
      editableByInput: false,
      approved: false,
      fallbackReason: "Mismo patrón que riskFreeRatePct.",
      warnings: [],
    },
    depreciationPctOfRevenue: {
      value: 3,
      unit: "percent",
      sourceType: "hardcoded_legacy",
      sourceDescription: "D&A proyectado como % de ingresos (ambos motores, comentario original \"demo\" en financial-engine.ts)",
      effectiveDate: "2026-03-20",
      editableByInput: false,
      approved: false,
      fallbackReason: "Ninguno de los dos motores deriva este valor del D&A histórico real declarado por el usuario.",
      warnings: ["Empresas con activos fijos intensivos (manufactura, construcción) probablemente tienen una D&A real muy distinta al 3% de ingresos."],
    },
  },
  globalWarnings: [
    "Ninguno de estos 8 supuestos fue revisado ni aprobado por un revisor financiero externo — son el comportamiento actual del sistema, no una metodología cerrada (Negocio_Velarix_v4.1.md §9.4).",
    "El servidor (ejecutar-calculo) no permite que ninguno de estos 8 valores sea sobrescrito por structured_input — ver R-19 en plan/MATRIZ-DE-RIESGOS.md.",
  ],
};
