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

**Casos calculados:** `run-analysis-pipeline`, `parse-document`, `map-accounts` y `validate-analysis` rechazan con 409 `CASE_ALREADY_CALCULATED` un caso con `calculation_result`. Su única escritura es el evento `evidence_reprocessing_rejected`. `upload-document` adjunta el documento sin degradar el estado y lo deja fuera del cálculo oficial. Ver LIM-05 en [[12-bugs]]. `build-structured-input` y `continuar-tras-revision` no se cubrieron en esta fase.

## Frontend
`src/components/dashboard/DocumentUpload.tsx` (botón «Procesar Evidence»; Workbench → Evidence), `NewAnalysisStepper.tsx` (Nuevo caso: sin campo de crecimiento → `expected_growth = null`; metadata opcional → `null` si vacía; al terminar abre el caso en Accounts), `ProgressPanel.tsx` (solo fases Documentos · Extracción · Cuentas · Validación), `src/hooks/useAnalysisProgress.ts`, `src/lib/evidence-pipeline.ts`, `src/lib/new-case.ts`.

## Documentos
[[03-FLUJOS-END-TO-END]] · [[REPORTE-IMPLEMENTACION-1B-P0]]
