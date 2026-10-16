---
tipo: modulo
capa: evidence
estado_v5: KEEP
actualizado: 2026-10-16
tags: [velarix, modulo, pipeline]
---

# Pipeline documental

Índice: [[03-modulos]] · Flujo: [[04-flujos]] §1 · API: [[06-api]]

## Qué es
Ingesta de estados financieros (PDF, Excel, CSV): **CREATE CASE → UPLOAD → PARSE → MAP ACCOUNTS → VALIDATE → STOP** ([[04-flujos]] §1). Es solo Evidence: no construye el input del motor ni calcula (Evidence ≠ Judgment ≠ Calculation).

## Edge Functions
| Paso | Función | Lógica pura en `_shared/` |
|---|---|---|
| Subida | `upload-document` | — |
| Orquestación (termina tras validar) | `run-analysis-pipeline` | `pipeline-guards.ts`, `evidence-pipeline-guards.ts` |
| Extracción (IA OpenAI) | `parse-document` | `parse-document-ai-provider.ts`, `parse-document-ai-fallback.ts`, `parse-document-csv-extractor.ts`, `parse-document-prompts.ts` |
| Homologación (IA Anthropic) | `map-accounts` | `account-taxonomy.ts`, `latest-parsed-document.ts` |
| Validación | `validate-analysis` | `validation-rules.ts` |
| Structured input — **fuera del pipeline automático** (lo invoca `continuar-tras-revision` o una llamada explícita) | `build-structured-input` | `structured-input-builder.ts`, `structured-input-resolution.ts`, `structured-input-derivations.ts`, `currency.ts`, `period-resolution.ts` |

**Evidence runs ([[ADR-009-evidence-runs-versionado]]):** `map-accounts` crea un run e inserta un set nuevo de homologaciones ligado a él (sin borrar los anteriores); `validate-analysis` valida exactamente ese run y, al completar, lo promueve con compare-and-swap sobre `analyses.active_evidence_run_id`. Un run fallido queda `failed` y el set activo anterior no cambia. `build-structured-input`, `continuar-tras-revision`, el Workbench, la revisión manual y `ProgressPanel` leen solo el set activo (legacy si no hay puntero). `parse-document` ya no sobrescribe `doc_type_declared`: escribe `doc_type_effective` + `doc_type_origin`.

**Casos calculados:** `run-analysis-pipeline`, `parse-document`, `map-accounts` y `validate-analysis` rechazan con 409 `CASE_ALREADY_CALCULATED` un caso con `calculation_result`. Su única escritura es el evento `evidence_reprocessing_rejected`. `upload-document` adjunta el documento sin degradar el estado y lo deja fuera del cálculo oficial. Ver LIM-05 en [[12-bugs]]. `build-structured-input` y `continuar-tras-revision` no se cubrieron en esta fase.

**Fallback de IA fail-closed:** si la extracción estructurada deja menos de 3 filas con valor, el fallback de IA (`SYSTEM_PARSER_FALLBACK`) solo recibe texto realmente extraído que supere `evaluateAiFallbackText` (`_shared/document-text-gate.ts`: ≥ 200 caracteres, ≥ 60 % alfanumérico, sin contenido binario). Nunca recibe los bytes del archivo. Si no pasa, `parse-document` responde 400 `DOCUMENT_TEXT_UNAVAILABLE`, marca el documento `fallido`, registra `parse_failed` (`ai_called: false`) y no crea `documents_parsed`. Los PDFs comprimidos/cifrados caen aquí (LIM-08 en [[12-bugs]]).

**AI classification ≠ Evidence creation.** En `map-accounts` la IA solo puede re-clasificar UNA homologación existente cuyo valor observado sea exactamente el que propone, cambiando solo metadata de mapping (`canonical_account`, `confidence_score`, `ambiguity_flag`, `mapping_notes`). Nunca crea una fila (ni "consolidada"), nunca escribe `value`, nunca inventa etiqueta ni documento; lo demás queda en `ai_rejected` (`AI_SYNTHETIC_HOMOLOGATION_NOT_ALLOWED`, `AI_AMBIGUOUS_SOURCE`, `AI_VALUE_MISMATCH`). Invariante: en un evidence run, `account_homologations.value` proviene de una fila parseada observada o de la copia exacta de una homologación previa (`create_manual_mapping_run`); nunca de la IA, un benchmark, un supuesto, Judgment, un cálculo del frontend ni una consolidación libre. La base refuerza el UPDATE de `value` (trigger `guard_versioned_homologation_history`); un INSERT sintético no es distinguible en la base hoy (no hay `parsed_row_id`), así que esa defensa vive en `map-accounts` + tests.

## Frontend
`src/components/dashboard/DocumentUpload.tsx` (botón «Procesar Evidence»; Workbench → Evidence), `NewAnalysisStepper.tsx` (Nuevo caso: sin campo de crecimiento → `expected_growth = null`; metadata opcional → `null` si vacía; al terminar abre el caso en Accounts), `ProgressPanel.tsx` (solo fases Documentos · Extracción · Cuentas · Validación), `src/hooks/useAnalysisProgress.ts`, `src/lib/evidence-pipeline.ts`, `src/lib/new-case.ts`.

## Documentos
[[03-FLUJOS-END-TO-END]] · [[REPORTE-IMPLEMENTACION-1B-P0]]
