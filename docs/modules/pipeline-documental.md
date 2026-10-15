---
tipo: modulo
capa: evidence
estado_v5: KEEP
actualizado: 2026-10-15
tags: [velarix, modulo, pipeline]
---

# Pipeline documental

Índice: [[03-modulos]] · Flujo: [[04-flujos]] §1 · API: [[06-api]]

## Qué es
Ingesta de estados financieros (PDF, Excel, CSV) hasta el `structured_input`.

## Edge Functions
| Paso | Función | Lógica pura en `_shared/` |
|---|---|---|
| Subida | `upload-document` | — |
| Orquestación | `run-analysis-pipeline` | `pipeline-guards.ts` |
| Extracción (IA OpenAI) | `parse-document` | `parse-document-ai-provider.ts`, `parse-document-ai-fallback.ts`, `parse-document-csv-extractor.ts`, `parse-document-prompts.ts` |
| Homologación (IA Anthropic) | `map-accounts` | `account-taxonomy.ts`, `latest-parsed-document.ts` |
| Validación | `validate-analysis` | `validation-rules.ts` |
| Structured input | `build-structured-input` | `structured-input-builder.ts`, `structured-input-resolution.ts`, `structured-input-derivations.ts`, `currency.ts`, `period-resolution.ts` |

## Frontend
`src/components/dashboard/DocumentUpload.tsx`, `NewAnalysisStepper.tsx`, `ProgressPanel.tsx`, `src/hooks/useAnalysisProgress.ts`.

## Documentos
[[03-FLUJOS-END-TO-END]] · [[REPORTE-IMPLEMENTACION-1B-P0]]
