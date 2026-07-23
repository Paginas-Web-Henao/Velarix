// Bloque 1C-T — Contrato de procedencia (trazabilidad técnica).
//
// Sin imports de URL, sin Supabase, sin Deno, sin `serve()`, sin
// variables de entorno, sin efectos secundarios — importable desde Deno
// y desde Vitest indistintamente.
//
// Responde, para cada cifra financiera priorizada, la pregunta "¿de qué
// documento y de qué fila(s) de `account_homologations` salió este
// valor?". Reutiliza exclusivamente IDs y campos que ya existen hoy
// (`account_homologations.id`, `.document_id`, `.canonical_account`) —
// no crea ninguna tabla nueva ni inventa un campo que no exista.
//
// Limitación real conocida, documentada explícitamente (no oculta ni
// rellenada con un arreglo vacío disfrazado de trazabilidad completa):
// no existe en el esquema actual un identificador de FILA CRUDA anterior
// a `account_homologations` — `documents_parsed.parsed_structure` guarda
// las filas originales como un JSON con un campo `posicion` (índice
// dentro del documento parseado), pero `map-accounts/index.ts` NO
// persiste ese `posicion` al insertar en `account_homologations`. Por
// tanto `source_row_ids` es, hoy, siempre `null` con
// `source_row_ids_status: "missing"` — no una lista vacía sin explicar
// por qué. Ver `docs/velarix/plan/MATRIZ-DE-TRAZABILIDAD.md`.

export type ProvenanceStatus = "missing" | "partial" | "complete";

/** Cifras priorizadas para trazabilidad en este bloque (ver instrucción de cierre técnico, sección 5). */
export const TRACEABLE_FIELDS = [
  "revenue",
  "cost_of_sales",
  "opex",
  "depreciation",
  "interest_expense",
  "financial_debt_total",
  "cash",
  "equity",
] as const;

export type TraceableField = (typeof TRACEABLE_FIELDS)[number];

/**
 * Qué `canonical_account`(s) de `account_homologations` alimentan cada
 * cifra priorizada. `financial_debt_total` es la única compuesta (suma de
 * deuda corriente + deuda de largo plazo, igual que
 * `build-structured-input/index.ts`) — por eso puede quedar "partial" si
 * solo una de las dos partes tiene fila homologada.
 */
const FIELD_CANONICAL_ACCOUNTS: Record<TraceableField, readonly string[]> = {
  revenue: ["revenue"],
  cost_of_sales: ["cost_of_sales"],
  opex: ["opex"],
  depreciation: ["da"],
  interest_expense: ["interest_expense"],
  financial_debt_total: ["current_financial_debt", "long_term_financial_debt"],
  cash: ["cash"],
  equity: ["equity"],
};

export interface FieldProvenance {
  source_status: ProvenanceStatus;
  homologation_ids: string[];
  document_ids: string[];
}

/** Subconjunto de una fila real de `account_homologations` — solo los campos que esta trazabilidad necesita. */
export interface HomologationReference {
  id: string;
  document_id: string | null;
  canonical_account: string;
}

export interface CalculationProvenance {
  analysis_id: string;
  structured_input_id: string | null;
  document_ids: string[];
  homologation_ids: string[];
  /** Ver nota de limitación arriba — siempre `null` hoy, nunca un arreglo vacío silencioso. */
  source_row_ids: null;
  source_row_ids_status: "missing";
  built_at: string;
  currency: {
    moneda_analisis: string;
    moneda_documento: string | null;
    factor_conversion: number;
  };
  fields: Record<TraceableField, FieldProvenance>;
  overall_status: ProvenanceStatus;
  warnings: string[];
}

/**
 * Un `canonical_account` requerido queda "satisfecho" únicamente cuando
 * existe al menos una homologación identificable PARA ESE CAMPO **con
 * `document_id` no nulo**. Una homologación encontrada pero sin
 * documento no basta — la cifra existe en `account_homologations`, pero
 * no se puede rastrear hasta un documento real, así que no es
 * trazabilidad "completa" (ajuste de semántica, 2026-07-23: antes
 * bastaba con que existiera la fila homologada, sin exigir el
 * documento).
 */
function buildFieldProvenance(
  rows: readonly HomologationReference[],
  canonicalAccounts: readonly string[],
): FieldProvenance {
  const matched = rows.filter((r) => canonicalAccounts.includes(r.canonical_account));
  const homologationIds = [...new Set(matched.map((r) => r.id))];
  const documentIds = [...new Set(matched.map((r) => r.document_id).filter((d): d is string => !!d))];

  const accountsFound = new Set(matched.map((r) => r.canonical_account));
  const accountsSatisfied = new Set(
    matched.filter((r) => r.document_id !== null && r.document_id !== undefined).map((r) => r.canonical_account),
  );

  let sourceStatus: ProvenanceStatus;
  if (accountsFound.size === 0) {
    sourceStatus = "missing";
  } else if (accountsSatisfied.size === canonicalAccounts.length) {
    // Complete exige que TODAS las cuentas requeridas (ambas, para el
    // caso compuesto financial_debt_total) tengan homologación Y documento.
    sourceStatus = "complete";
  } else {
    // Encontrada pero sin documento, o solo una parte de una cifra
    // compuesta con homologación+documento — nunca "complete" a medias.
    sourceStatus = "partial";
  }

  return { source_status: sourceStatus, homologation_ids: homologationIds, document_ids: documentIds };
}

/**
 * Construye el contrato de procedencia a partir de las filas de
 * `account_homologations` que `build-structured-input` ya consulta hoy
 * (mismo `analysis_id`) — no requiere ninguna consulta adicional a
 * Supabase ni ninguna tabla nueva.
 */
export function buildCalculationProvenance(params: {
  analysisId: string;
  structuredInputId: string | null;
  homologationRows: readonly HomologationReference[];
  monedaAnalisis: string;
  monedaDocumento: string | null;
  factorConversion: number;
  builtAt?: string;
}): CalculationProvenance {
  const fields = {} as Record<TraceableField, FieldProvenance>;
  for (const field of TRACEABLE_FIELDS) {
    fields[field] = buildFieldProvenance(params.homologationRows, FIELD_CANONICAL_ACCOUNTS[field]);
  }

  const documentIds = [...new Set(params.homologationRows.map((r) => r.document_id).filter((d): d is string => !!d))];
  const homologationIds = [...new Set(params.homologationRows.map((r) => r.id))];

  const statuses = (Object.keys(fields) as TraceableField[]).map((f) => fields[f].source_status);
  let overallStatus: ProvenanceStatus;
  if (statuses.every((s) => s === "complete")) overallStatus = "complete";
  else if (statuses.every((s) => s === "missing")) overallStatus = "missing";
  else overallStatus = "partial";

  const missingOrPartial = (Object.keys(fields) as TraceableField[]).filter((f) => fields[f].source_status !== "complete");
  const warnings: string[] = [];
  if (missingOrPartial.length > 0) {
    warnings.push(
      `Sin trazabilidad completa hacia account_homologations para: ${missingOrPartial.join(", ")}.`,
    );
  }
  warnings.push(
    "source_row_ids no disponible: no existe un identificador de fila cruda anterior a " +
      "account_homologations en el esquema actual (map-accounts no persiste la posición " +
      "de fila de documents_parsed.parsed_structure al homologar).",
  );

  return {
    analysis_id: params.analysisId,
    structured_input_id: params.structuredInputId,
    document_ids: documentIds,
    homologation_ids: homologationIds,
    source_row_ids: null,
    source_row_ids_status: "missing",
    built_at: params.builtAt ?? new Date().toISOString(),
    currency: {
      moneda_analisis: params.monedaAnalisis,
      moneda_documento: params.monedaDocumento,
      factor_conversion: params.factorConversion,
    },
    fields,
    overall_status: overallStatus,
    warnings,
  };
}

/**
 * Procedencia de fallback cuando `ejecutar-calculo` no encuentra ninguna
 * procedencia adjunta al `input_payload` (por ejemplo, un análisis
 * calculado antes de este bloque, o invocado sin pasar por
 * `build-structured-input`). Declara explícitamente `missing` en todos
 * los campos documentales — nunca simula trazabilidad que no existe.
 *
 * Ajuste de semántica (2026-07-23): la moneda y el factor de conversión
 * SÍ deben reflejar los valores reales efectivamente usados por el
 * cálculo (`input.moneda_analisis`/`input.factor_conversion`, ya
 * resueltos por `canonical-input-normalization.ts`) — nunca se asume
 * `"COP"`/`1` cuando el input indica otra cosa. La ausencia de
 * trazabilidad documental (homologaciones/documentos) es independiente
 * de qué moneda se usó para calcular.
 */
export function buildMissingProvenance(params: {
  analysisId: string;
  monedaAnalisis: string;
  monedaDocumento: string | null;
  factorConversion: number;
  builtAt?: string;
}): CalculationProvenance {
  return buildCalculationProvenance({
    analysisId: params.analysisId,
    structuredInputId: null,
    homologationRows: [],
    monedaAnalisis: params.monedaAnalisis,
    monedaDocumento: params.monedaDocumento,
    factorConversion: params.factorConversion,
    builtAt: params.builtAt,
  });
}
