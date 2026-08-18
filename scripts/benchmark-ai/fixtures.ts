// Fixtures sintéticos para el benchmark OpenAI vs Anthropic de parse-document.
// Módulo puro — sin red, sin SDKs.
//
// Fuente de los datos: NO se inventa ningún hecho económico nuevo. Los dos
// fixtures reutilizan exactamente los mismos números que
// `supabase/functions/_shared/canonical-financial-engine.golden-cases.fixtures.ts`
// → `CASO_A_ESTABLE_SERVIDOR`. Ese caso es un fixture sintético técnico ya
// EXISTENTE en el repo y usado en tests de regresión del motor de cálculo
// — su uso técnico aquí NO implica ni afirma ninguna aprobación financiera
// profesional (el propio archivo de origen se declara "caso dorado técnico
// provisional — pendiente de aprobación financiera"). Solo se les asignó
// una etiqueta de período ("2025") para poder representarlos como un
// documento de un solo período — ese caso dorado no traía año explícito.
//
// Esta primera comparación aísla el componente IA: MISMO texto
// post-extracción + MISMO system prompt + MISMA instrucción de usuario +
// MISMO ground truth, variando solo el proveedor. No se generan PDF/XLSX
// todavía — eso llega después de elegir proveedor/modelo.

export interface ExpectedAccount {
  /** Id interno del benchmark para scoring — NO es el `canonical_account` de producción (ese lo asigna map-accounts, fuera de alcance aquí). */
  id: string;
  /** Formas de superficie aceptadas como "true positive" al comparar contra el `original_label` que devuelva el modelo — match EXACTO tras normalizar (minúsculas/diacríticos/espacios/puntuación), nunca substring. Cualquier forma adicional debe agregarse aquí explícitamente. */
  labelSynonyms: string[];
  expectedValue: number;
}

export interface BenchmarkFixture {
  id: string;
  description: string;
  source_text: string;
  expected_document_type: "estado_resultados" | "balance_general" | "mixto" | "flujo_de_caja" | "no_reconocible";
  expected_periods: string[];
  expected_accounts: string[];
  expected_values: Record<string, number>;
  /** Detalle completo de ground truth por cuenta, usado por scoring.ts para matching tolerante a sinónimos. */
  accounts: ExpectedAccount[];
  ambiguity_notes: string | null;
}

// Ground truth único, compartido por ambos fixtures — mismos valores que
// CASO_A_ESTABLE_SERVIDOR. Los sinónimos listados son los que un
// clasificador financiero razonable debería reconocer como el mismo
// concepto, no términos inventados sin relación.
const GROUND_TRUTH_ACCOUNTS: ExpectedAccount[] = [
  { id: "revenue", labelSynonyms: ["ingresos", "ventas netas", "ventas"], expectedValue: 5_000_000_000 },
  { id: "cost_of_sales", labelSynonyms: ["costo de ventas", "costo de mercancía vendida", "costo de mercaderia vendida"], expectedValue: 3_000_000_000 },
  { id: "opex", labelSynonyms: ["gastos operativos", "gastos de administración y ventas", "gastos administrativos y de ventas"], expectedValue: 800_000_000 },
  { id: "da", labelSynonyms: ["depreciación y amortización", "depreciacion y amortizacion", "d&a", "depreciación y amortización del ejercicio"], expectedValue: 150_000_000 },
  { id: "interest_expense", labelSynonyms: ["gastos financieros", "intereses pagados", "gastos de intereses"], expectedValue: 80_000_000 },
  { id: "financial_debt_total", labelSynonyms: ["deuda financiera total", "obligaciones financieras", "deuda financiera", "obligaciones financieras (corto y largo plazo)"], expectedValue: 1_000_000_000 },
  { id: "cash", labelSynonyms: ["caja", "efectivo", "posición de caja", "caja y equivalentes"], expectedValue: 600_000_000 },
  { id: "equity", labelSynonyms: ["patrimonio", "patrimonio de los accionistas", "patrimonio neto"], expectedValue: 3_000_000_000 },
];

function expectedAccountsList(): string[] {
  return GROUND_TRUTH_ACCOUNTS.map((a) => a.id);
}

function expectedValuesMap(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of GROUND_TRUTH_ACCOUNTS) out[a.id] = a.expectedValue;
  return out;
}

export const FIXTURE_CLEAN: BenchmarkFixture = {
  id: "clean_caso_a",
  description:
    "Representación textual limpia, de un solo período, de CASO_A_ESTABLE_SERVIDOR — etiquetas contables estándar en español, orden convencional (estado de resultados primero, balance después), formato numérico consistente.",
  source_text: `Estado de Resultados y Balance General - Período 2025 (COP)

Ingresos: 5.000.000.000
Costo de ventas: 3.000.000.000
Gastos operativos: 800.000.000
Depreciación y amortización: 150.000.000
Gastos financieros: 80.000.000

Deuda financiera total: 1.000.000.000
Caja: 600.000.000
Patrimonio: 3.000.000.000`,
  expected_document_type: "mixto",
  expected_periods: ["2025"],
  expected_accounts: expectedAccountsList(),
  expected_values: expectedValuesMap(),
  accounts: GROUND_TRUTH_ACCOUNTS,
  ambiguity_notes: null,
};

export const FIXTURE_NOISY: BenchmarkFixture = {
  id: "noisy_caso_a",
  description:
    "MISMO ground truth económico que FIXTURE_CLEAN (CASO_A_ESTABLE_SERVIDOR, período 2025) pero con variación de superficie textual realista: cuentas fuera de orden, sinónimos razonables, texto narrativo neutro intercalado (sin agregar hechos económicos/empresariales/de gerencia), formato numérico inconsistente (comas vs. puntos como separador de miles). No introduce ningún hecho económico nuevo ni ambigüedad sin respuesta conocida — solo ruido de superficie: orden, espacios, encabezados, sinónimos, puntuación, separadores numéricos.",
  source_text: `Informe financiero preliminar — ejercicio 2025

Durante el período se reportaron las siguientes partidas. A continuación
se presenta el detalle correspondiente al estado de resultados y al
balance general.

--- Resumen de resultados ---
Ventas netas ................. 5,000,000,000
Costo de mercancía vendida ... 3,000,000,000

Nota: la depreciación y amortización del ejercicio ascendió a
150.000.000.

Gastos de administración y ventas: 800.000.000
Intereses pagados: 80.000.000

--- Balance ---
Patrimonio de los accionistas: 3.000.000.000
Obligaciones financieras (corto y largo plazo): 1.000.000.000
Posición de caja: $600.000.000 COP`,
  expected_document_type: "mixto",
  expected_periods: ["2025"],
  expected_accounts: expectedAccountsList(),
  expected_values: expectedValuesMap(),
  accounts: GROUND_TRUTH_ACCOUNTS,
  ambiguity_notes:
    "Ninguna ambigüedad económica nueva respecto a FIXTURE_CLEAN — solo variación de superficie (orden, sinónimos, narrativa neutra intercalada, formato numérico). El período sigue siendo inequívoco ('ejercicio 2025' aparece una sola vez, sin períodos comparativos). El texto narrativo no afirma ningún hecho económico, empresarial, de gerencia ni de gobierno corporativo — solo conecta las secciones.",
};

export const BENCHMARK_FIXTURES: readonly BenchmarkFixture[] = [FIXTURE_CLEAN, FIXTURE_NOISY];
