// Prompts de IA de `parse-document`, extraídos a un módulo puro para que el
// harness de benchmark OpenAI vs Anthropic (scripts/benchmark-ai/) los
// reutilice literalmente — sin importar el entrypoint de la Edge Function
// (sin Deno, sin Supabase, sin serve(), sin efectos secundarios).
//
// Contenido textual sin cambios respecto a como vivían inline en
// parse-document/index.ts — solo se movieron de lugar.

export const SYSTEM_CLASSIFIER = `Eres el clasificador documental de Velarix. Identifica el tipo de documento financiero.
Tipos: estado_resultados, balance_general, mixto, flujo_de_caja, no_reconocible
Devuelve JSON: { "tipo_documento": "...", "confianza": 0-1, "evidencias": [], "advertencias": [], "puede_continuar": true/false }`;

export const SYSTEM_PERIOD_DETECTOR = `Eres el detector de períodos financieros de Velarix.
Devuelve JSON: { "periodos": [{"etiqueta": "2024", "tipo": "anual", "columna_indice": 0}], "periodo_mas_reciente": "etiqueta", "cantidad_periodos": número }`;

export const SYSTEM_PARSER_FALLBACK = `Eres un extractor de datos financieros. Extrae cuentas contables con valores.
Devuelve JSON: { "rows": [{"original_label": "...", "values": {"col_1": número}, "es_subtotal": false, "posicion": número}], "column_headers": ["Cuenta", "2024"], "total_rows_extracted": número }`;
