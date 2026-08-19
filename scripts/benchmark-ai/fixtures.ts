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
  /** Formas de superficie aceptadas como "true positive" al comparar contra el `original_label` que devuelva el modelo — match EXACTO tras normalizar (minúsculas/diacríticos/espacios/puntuación), nunca substring. Cualquier forma adicional debe agregarse aquí explícitamente. Para fixtures HARD: exactamente UN elemento, el literal exacto de `source_text` — parser_fallback debe conservar fidelidad documental; la canonicalización por sinónimos amplios es trabajo de map-accounts, fuera de alcance aquí. */
  labelSynonyms: string[];
  /** Valor único esperado — camino legacy de un solo período (CLEAN/NOISY). Para cuentas HARD con `expectedValuesByPeriod`, se mantiene poblado (con la cifra del período más reciente) solo como respaldo si compareAccounts() se invoca sin `columnHeaders`; el scoring real de HARD usa `expectedValuesByPeriod`. */
  expectedValue: number;
  /**
   * ADITIVO — ground truth multi-período, opcional. Cuando está presente Y
   * se pasa `columnHeaders` a `compareAccounts()`, se usa en vez del
   * camino legacy (`expectedValue`/`firstNumericValue`) para comparar
   * cifra por cifra, período por período:
   * - number: esa cifra debe existir EXACTAMENTE para ese período.
   * - null: NO existe una cifra observada para ese período — el modelo
   *   NO debe inventarla (reportar cualquier número, incluyendo 0, es
   *   `fabricated_absent`).
   * Fixtures de un solo período (CLEAN/NOISY) no la definen y siguen el
   * camino legacy exactamente como antes, sin cambios.
   */
  expectedValuesByPeriod?: Record<string, number | null>;
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

function expectedAccountsList(accounts: ExpectedAccount[]): string[] {
  return accounts.map((a) => a.id);
}

function expectedValuesMap(accounts: ExpectedAccount[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of accounts) out[a.id] = a.expectedValue;
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
  expected_accounts: expectedAccountsList(GROUND_TRUTH_ACCOUNTS),
  expected_values: expectedValuesMap(GROUND_TRUTH_ACCOUNTS),
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
  expected_accounts: expectedAccountsList(GROUND_TRUTH_ACCOUNTS),
  expected_values: expectedValuesMap(GROUND_TRUTH_ACCOUNTS),
  accounts: GROUND_TRUTH_ACCOUNTS,
  ambiguity_notes:
    "Ninguna ambigüedad económica nueva respecto a FIXTURE_CLEAN — solo variación de superficie (orden, sinónimos, narrativa neutra intercalada, formato numérico). El período sigue siendo inequívoco ('ejercicio 2025' aparece una sola vez, sin períodos comparativos). El texto narrativo no afirma ningún hecho económico, empresarial, de gerencia ni de gobierno corporativo — solo conecta las secciones.",
};

// ═══════════════════════════════════════════════════════════════
// FIXTURE HARD — discriminante, multi-período, completamente sintético
// ═══════════════════════════════════════════════════════════════
//
// A diferencia de CLEAN/NOISY (1 período, mismo ground truth económico
// reutilizado de CASO_A_ESTABLE_SERVIDOR), HARD es un escenario nuevo y
// propio del benchmark — Manufacturas Aurora S.A.S., empresa ficticia sin
// relación con datos reales. Diseñado para discriminar entre modelos que
// ya sacan CLEAN/NOISY perfecto, sin introducir ninguna ambigüedad que
// requiera criterio humano para fijar el ground truth (ver
// ambiguity_notes de FIXTURE_HARD para el detalle de cada eje de
// dificultad y por qué es objetivamente puntuable).
const HARD_GROUND_TRUTH_ACCOUNTS: ExpectedAccount[] = [
  {
    id: "equity",
    labelSynonyms: ["Patrimonio neto"],
    expectedValue: 3_150_000_000,
    expectedValuesByPeriod: { "2024": 2_900_000_000, "2025": 3_150_000_000 },
  },
  {
    id: "net_income",
    labelSynonyms: ["Resultado neto del ejercicio"],
    expectedValue: -52_300_000,
    // 2024 = null a propósito: el modelo tiene todos los insumos
    // (revenue/cost_of_sales/opex/da de 2024) para "calcular" un
    // resultado neto plausible, pero el contrato es extraer, no calcular.
    expectedValuesByPeriod: { "2024": null, "2025": -52_300_000 },
  },
  {
    id: "cash",
    labelSynonyms: ["Efectivo y equivalentes de efectivo"],
    expectedValue: 455_000_000,
    expectedValuesByPeriod: { "2024": 410_000_000, "2025": 455_000_000 },
  },
  {
    id: "revenue",
    labelSynonyms: ["Ingresos de actividades ordinarias"],
    expectedValue: 6_850_000_000,
    expectedValuesByPeriod: { "2024": 6_200_000_000, "2025": 6_850_000_000 },
  },
  {
    id: "financial_debt_total",
    labelSynonyms: ["Obligaciones financieras totales"],
    expectedValue: 1_600_000_000,
    expectedValuesByPeriod: { "2024": 1_450_000_000, "2025": 1_600_000_000 },
  },
  {
    id: "cost_of_sales",
    labelSynonyms: ["Costo de mercancía vendida"],
    expectedValue: 4_050_000_000,
    expectedValuesByPeriod: { "2024": 3_700_000_000, "2025": 4_050_000_000 },
  },
  {
    id: "opex",
    labelSynonyms: ["Gastos de administración y ventas"],
    expectedValue: 1_020_000_000,
    expectedValuesByPeriod: { "2024": 950_000_000, "2025": 1_020_000_000 },
  },
  {
    id: "da",
    labelSynonyms: ["Gasto por depreciación y amortización"],
    expectedValue: 195_000_000,
    expectedValuesByPeriod: { "2024": 180_000_000, "2025": 195_000_000 },
  },
];

export const FIXTURE_HARD: BenchmarkFixture = {
  id: "hard_aurora_multi_periodo",
  description:
    "Fixture HARD sintético y discriminante — Manufacturas Aurora S.A.S. (empresa ficticia), dos períodos explícitos (2024/2025), formatos numéricos distintos por línea (coma-miles, punto-miles, dígitos sin separador, punto-miles con símbolo de moneda, separador de espacio), una cifra negativa entre paréntesis, una cuenta reportada solo en 2025, una cuenta canónica completamente ausente del texto, orden de cuentas no intuitivo, y ruido narrativo no financiero que no debe convertirse en fila. Sin notas auxiliares ambiguas, sin LTM/trimestres, sin ninguna cifra que requiera cálculo o interpretación humana para fijar el ground truth.",
  source_text: `Estados Financieros Comparativos — Manufacturas Aurora S.A.S.
Períodos 2024 y 2025 (cifras en COP)

Manufacturas Aurora S.A.S. es una compañía dedicada a la producción de
empaques industriales para el sector agroalimentario. Durante los períodos
reportados la compañía mantuvo operaciones en 2 plantas y contó con un
promedio de 87 empleados directos. La administración considera que el
entorno macroeconómico continúa siendo retador para el sector.

Patrimonio neto ............................. 2024: 2.900.000.000   2025: 3.150.000.000
Resultado neto del ejercicio ................ 2025: (52.300.000)
Efectivo y equivalentes de efectivo ......... 2024: 410000000        2025: 455000000
Ingresos de actividades ordinarias .......... 2024: $6.200.000.000   2025: $6.850.000.000
Obligaciones financieras totales ............ 2024: 1,450,000,000    2025: 1,600,000,000
Costo de mercancía vendida .................. 2024: 3 700 000 000    2025: 4 050 000 000
Gastos de administración y ventas ........... 2024: 950.000.000      2025: 1.020.000.000
Gasto por depreciación y amortización ....... 2024: 180,000,000      2025: 195,000,000`,
  expected_document_type: "mixto",
  expected_periods: ["2024", "2025"],
  expected_accounts: expectedAccountsList(HARD_GROUND_TRUTH_ACCOUNTS),
  expected_values: expectedValuesMap(HARD_GROUND_TRUTH_ACCOUNTS),
  accounts: HARD_GROUND_TRUTH_ACCOUNTS,
  ambiguity_notes:
    "Cuenta canónica completamente ausente: 'taxes' (impuesto de renta) — no aparece en ninguna parte de source_text; no está en expected_accounts; si el modelo inventa una fila de impuesto de renta debe caer en unexpectedAccounts. Ruido narrativo no financiero deliberado: '2 plantas' y '87 empleados' — ninguno de los dos debe convertirse en fila. net_income 2024 es null a propósito (ver nota en HARD_GROUND_TRUTH_ACCOUNTS): el modelo tiene todos los insumos para 'calcular' un resultado neto 2024 plausible, pero el contrato de SYSTEM_PARSER_FALLBACK es extraer, no calcular — cualquier valor no-null para net_income 2024 es fabricated_absent. Orden de cuentas deliberadamente no intuitivo (el resultado neto aparece en la segunda línea, antes que los ingresos). Ninguna ambigüedad de este fixture requiere criterio humano para fijar el ground truth.",
};

export const BENCHMARK_FIXTURES: readonly BenchmarkFixture[] = [FIXTURE_CLEAN, FIXTURE_NOISY, FIXTURE_HARD];
