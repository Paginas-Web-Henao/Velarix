---
tipo: api
actualizado: 2026-10-15
tags: [velarix, api, edge-functions, system]
---

# API

Volver a [[00-home]] · Arquitectura: [[02-arquitectura]] · Relacionado: [[04-flujos]], [[07-autenticacion]], [[05-base-de-datos]]

No hay servidor propio: la "API" son **Supabase Edge Functions** (`supabase/functions/<nombre>/index.ts`, Deno) más acceso directo a tablas vía `supabase-js` bajo RLS.

## Edge Functions

| Función | Invocada por | Auth | Tablas principales | Módulo |
|---|---|---|---|---|
| `upload-document` | Frontend | JWT usuario | documents, analyses | [[pipeline-documental]] |
| `run-analysis-pipeline` | Frontend | JWT usuario | analyses, analysis_jobs, job_locks | [[pipeline-documental]] |
| `parse-document` | Pipeline | JWT usuario | documents, documents_parsed | [[pipeline-documental]] |
| `map-accounts` | Pipeline | JWT usuario | account_homologations | [[pipeline-documental]] |
| `validate-analysis` | Pipeline | JWT usuario | validation_results | [[pipeline-documental]] |
| `build-structured-input` | `continuar-tras-revision` / llamada explícita (**no** el pipeline de Evidence) | JWT usuario | structured_inputs, external_snapshots | [[pipeline-documental]] |
| `judgment-sets` | Explícito (`create_draft`, `add_entry`, `complete`, `fail`, `promote`) | JWT usuario (dueño) | judgment_sets, judgment_entries, analyses | [[supuestos-y-preflight]] |
| `ejecutar-calculo` | Explícito (**no** el pipeline de Evidence) | JWT usuario o secret key interna | analyses, structured_inputs, valuation_files, account_notes, expedient_* | [[motor-canonico]] |
| `continuar-tras-revision` | Frontend (admin) | JWT o secret key interna | manual_reviews, structured_inputs | [[revision-manual]] |
| `generate-narrative` | `api-client.generateNarrative` | JWT usuario | report_narratives | [[narrativa-ia]] |
| `enviar-notificacion` | Pipeline / narrativa | Solo interna (`apikey`) | analyses, profiles | [[notificaciones]] |
| `update-snapshots` | > Pendiente de confirmar (no hay cron en el repo) | Solo interna | external_snapshots | [[datos-de-mercado]] |
| `check-data-freshness` | > Pendiente de confirmar | Solo interna | data_sources, snapshot_updates | [[datos-de-mercado]] |

Todas tienen `verify_jwt = false` en `supabase/config.toml` y verifican identidad en su propio código (ver [[07-autenticacion]]).

Respuestas relevantes de `ejecutar-calculo`: **409** si falla el checkpoint del Expediente o el preflight (con el detalle en el body y un `audit_event`), o si el structured input no corresponde al judgment set / evidence run activos (`STRUCTURED_INPUT_STALE_FOR_JUDGMENT`). `build-structured-input` y `continuar-tras-revision` responden **409** `JUDGMENT_SET_INVALID` si el set activo no materializa.

## Cliente frontend

`src/lib/api-client.ts`:
`createAnalysis`, `getAnalyses`, `getAnalysis`, `deleteAnalysis` (soft delete), `uploadDocument`, `runAnalysisPipeline`, `parseDocument`, `mapAccounts`, `validateAnalysis`, `buildStructuredInput`, `generateNarrative`, `storeCalculationResults`, `getCurrentSnapshot`, `getSnapshot`, `getAuditEvents`, `getValidationResults`, `getMappedAccounts`, `getNarrative`, `getGeneratedReports`.

`src/lib/manual-review-api.ts`:
`crearRevisionManual`, `obtenerRevisionesPendientes`, `obtenerRevisiones`, `tomarRevision`, `obtenerDetalleRevision`, `corregirCuenta`, `aprobarRevision`, `bloquearRevision`.

## Funciones SQL (RPC)

- `public.admin_set_user_role(target_user_id, new_role)` — única vía autorizada para cambiar `profiles.role` (requiere `admin`).
