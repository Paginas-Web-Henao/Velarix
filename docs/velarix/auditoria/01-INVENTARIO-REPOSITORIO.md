# 01 — Inventario del Repositorio

Fuente: subagente de arquitectura e inventario (solo lectura). Alcance:
`/Users/nicohenao/Documents/Velarix/velarix-code`, excluyendo
`velarix-code-latest/` (respaldo de Lovable, no vigente).

## Stack técnico — VERIFICADO

- Frontend: React 18.3.1 + Vite 8.0.0 + TypeScript 5.8.3, Tailwind CSS +
  componentes shadcn/radix (`components.json`, `tailwind.config.ts`).
- Backend: Supabase (Postgres + RLS + Auth + Storage + Edge Functions Deno).
  `supabase/config.toml` solo declara `project_id`.
- IA: Anthropic directo vía `supabase/functions/_shared/anthropic-client.ts`
  (`@anthropic-ai/sdk@0.113.0`, modelo `claude-opus-4-8`).
- Node en el entorno de esta auditoría: v24.18.0. `package.json` no declara
  `engines` — NO VERIFICABLE qué versión espera producción/CI.

## Package manager — VERIFICADO

**npm**, confirmado por `package-lock.json` (282KB) y por el commit
`44dd0a6 "Estandarizar en npm: quitar bun.lock, reinstalar dependencias"`.
No existe `bun.lock` en el repo actual.

## Scripts (`package.json`) — VERIFICADO

| Script | Comando | Nota |
|---|---|---|
| `dev` | `vite` | |
| `build` | `vite build` | |
| `build:dev` | `vite build --mode development` | |
| `lint` | `eslint .` | Sin excluir `velarix-code-latest/` en `eslint.config.js` (solo ignora `dist`) — genera ruido al correrlo (ver `06-CALIDAD-CODIGO-Y-PRUEBAS.md`) |
| `preview` | `vite preview` | |
| `test` | `vitest run` | |
| `test:watch` | `vitest` | |

No hay script `test:e2e`/`playwright test`, aunque `@playwright/test` está
en devDependencies y existe `playwright.config.ts` — ver hallazgo de
pruebas ausentes en `06-CALIDAD-CODIGO-Y-PRUEBAS.md`.

## Librerías relevantes — VERIFICADO

- PDF: `jspdf` + `jspdf-autotable`, cliente (`src/lib/pdf-generator.ts`).
- Excel/CSV: `xlsx@0.18.5`, solo en la Edge Function `parse-document` (vía
  esm.sh, no en el frontend).
- Formularios: `react-hook-form` + `@hookform/resolvers` + `zod`
  declarados; **no confirmado su uso** en `NewAnalysisStepper.tsx` (usa
  `useState` plano) — ver `10-DEUDA-TECNICA-Y-CODIGO-OBSOLETO.md`.
- Fechas: `date-fns`.
- IA: `@anthropic-ai/sdk`, solo en Edge Functions vía import por URL (no en
  `package.json` de npm).
- Gráficas: `recharts`. Animación: `framer-motion`. Ver impacto de bundle
  en `09-RENDIMIENTO-Y-OBSERVABILIDAD.md`.

## Estructura de `src/` — VERIFICADO

```
src/
├── components/{dashboard,demo,landing,ui}/
├── contexts/         (AuthContext)
├── data/             (velarix-datos-2026.ts)
├── hooks/            (useAnalysisProgress, use-mobile, use-toast)
├── integrations/supabase/  (client, types autogenerados)
├── lib/              (financial-engine, pdf-generator, api-client, manual-review-api, utils)
├── pages/            (Index, Auth, Dashboard, AdminReviews, AdminReviewDetail, ResetPassword, NotFound)
└── test/             (setup.ts, example.test.ts)
```

`src/tailwind.config.lov.json` — residuo de Lovable, no referenciado por
`tailwind.config.ts` real. OBSOLETO (ver `10-DEUDA-TECNICA-Y-CODIGO-OBSOLETO.md`).

## Edge Functions (`supabase/functions/`) — VERIFICADO, 12 funciones + `_shared/`

| Función | Qué hace (evidencia de código real) |
|---|---|
| `upload-document` | Valida JWT y ownership del análisis, tamaño/MIME, sube a `financial-documents`, crea fila `documents`, actualiza `analyses.status`, inserta `audit_events`. |
| `parse-document` | Descarga archivo, detecta formato por magic bytes, extrae filas (regex sobre PDF crudo / Excel / CSV), fallback a IA si <3 filas con valor, detecta moneda/escala/clasificación/períodos, guarda `documents_parsed`. |
| `map-accounts` | Homologa cuentas: Pass 1 basado en reglas (`TAXONOMY`), Pass 2 vía IA para consolidar no clasificadas; escribe `account_homologations`. |
| `validate-analysis` | Evalúa ~20 reglas (`DOC_*`/`MAP_*`/`BAL_*`/`IS_*`/`PER_*`); solo `DOC_*` bloquea (comentario explícito en código); guarda `validation_results`. |
| `build-structured-input` | Consolida `account_homologations` en payload estructurado, aplica conversión de moneda/escala, adjunta snapshot sectorial; guarda `structured_inputs`. |
| `ejecutar-calculo` | Motor DCF inline (proyección 5 años, WACC vía CAPM/Hamada, valor terminal Gordon Growth, sensibilidad); guarda en `analyses.calculation_result` (JSONB). |
| `generate-narrative` | 14 secciones narrativas vía IA + motor de riesgos determinístico + recomendaciones + auditor de 6 criterios; guarda `report_narratives`; dispara `enviar-notificacion` (fire-and-forget). |
| `continuar-tras-revision` | Tras aprobación de revisión manual, reconstruye `structured_inputs` desde `account_homologations` corregidas y reanuda el flujo. |
| `run-analysis-pipeline` | Orquestador: lock (`job_locks`) → parse → map-accounts → validate → build-structured-input → ejecutar-calculo; actualiza `analysis_jobs`; libera lock. |
| `enviar-notificacion` | Emails transaccionales vía Resend (4 tipos: `analisis_completado`, `reporte_listo`, `error_analisis`, `analisis_bloqueado`). |
| `check-data-freshness` | Calcula semáforo de frescura por fuente de datos (`data_sources`), guarda en `update_jobs_log`. |
| `update-snapshots` | Siembra/actualiza `external_snapshots` con Damodaran 2026 hardcodeado + macro Colombia; acepta override de macro por body. |

**Patrón de orquestación real (VERIFICADO)**: el frontend usa
`run-analysis-pipeline` como único orquestador (`DocumentUpload.tsx::runPipeline`).
No llama cada función individualmente para el flujo normal. Los wrappers
`api-client.ts::parseDocument/mapAccounts/validateAnalysis/buildStructuredInput/generateNarrative/storeCalculationResults`
existen pero **no se invocan desde ningún componente** — código muerto
expuesto sin consumidor (ver `10-DEUDA-TECNICA-Y-CODIGO-OBSOLETO.md`).

**Funciones huérfanas confirmadas** (sin invocación desde frontend ni desde
otra Edge Function): `generate-narrative` (solo referenciada por un
wrapper que nunca se llama), `check-data-freshness`, `update-snapshots`
(sin cron configurado en el repo), el tipo `reporte_listo` dentro de
`enviar-notificacion`.

## Migraciones (`supabase/migrations/`) — VERIFICADO, 8 archivos

| Archivo | Resumen |
|---|---|
| `20260320164123_...` | Esquema inicial completo: enums, `analyses`, `documents`, `documents_parsed`, `account_homologations`, `validation_results`, `external_snapshots`, `calculation_results`, `report_narratives`, `generated_reports`, `audit_events`, `profiles` (+ trigger `handle_new_user`), RLS en todas, índices. |
| `20260320164136_...` | Fix de `search_path` en función `update_updated_at` (hardening). |
| `20260320180111_...` | `analyses.deleted_at` (soft-delete), auditoría en `report_narratives`, tablas `structured_inputs`, `manual_reviews`, `job_locks`; bucket `financial-documents` + políticas. |
| `20260322202441_...` | `analysis_jobs` (`UNIQUE(analysis_id, job_type)`), `data_sources`, `snapshot_updates`, `update_jobs_log`; siembra 11 `data_sources`. |
| `20260322202933_...` | Columnas de workflow en `manual_reviews` (`estado`, `prioridad`, `cuentas_a_revisar`, `correcciones`, `updated_at`). |
| `20260323003518_...` | Bucket `reportes-pdf` + políticas; siembra 15 snapshots sectoriales Damodaran 2026. |
| `20260409121703_...` | `analyses.moneda_analisis` (default `COP`). |
| `20260413152520_...` | `analyses.calculation_result` (JSONB) — la columna que usa `ejecutar-calculo`. |

**Nota de nomenclatura — CONTRADICCIÓN documentación vs. esquema real**:
`Negocio_Velarix_v4.1.md` §13.2 nombra `user_profiles`, `parsed_documents`,
`account_mappings`, `narrative_reports`. El esquema real usa `profiles`,
`documents_parsed`, `account_homologations`, `report_narratives`. Ver
`11-CONTRADICCIONES-NEGOCIO-CODIGO.md`.

## Buckets de Storage — VERIFICADO

- `financial-documents` — privado, 10MB, PDF/XLSX/XLS/CSV.
- `reportes-pdf` — privado, 50MB, solo PDF. **Sin ningún uso real** (nunca
  se sube nada); el PDF se genera y descarga 100% en el navegador. OBSOLETO.

## Pruebas existentes — VERIFICADO

- `src/test/example.test.ts` — un único test trivial (`expect(true).toBe(true)`).
- `src/test/setup.ts` — setup jsdom/testing-library.
- `playwright.config.ts` apunta a `testDir: "./tests"`, **carpeta que no
  existe** en el repo.
- Conclusión: sin cobertura real de ningún flujo de negocio.

## Documentación existente — VERIFICADO

- `README.md` (raíz, 20 líneas).
- `Negocio.md`, `NEGOCIO_V4_VELARIX.md`, `Negocio_Velarix_v4.1.md` (raíz,
  documentos de negocio — ver nota de estado en `README.md` de esta carpeta).
- `docs/velarix/` — creado en esta misma sesión (antes de esta auditoría,
  las tres subcarpetas existían vacías).

## Archivos grandes (>500 líneas) — VERIFICADO

| Archivo | Líneas |
|---|---|
| `src/lib/pdf-generator.ts` | 1155 |
| `src/integrations/supabase/types.ts` (autogenerado) | 930 |
| `src/lib/financial-engine.ts` | 726 |
| `src/components/ui/sidebar.tsx` (shadcn, boilerplate) | 637 |
| `supabase/functions/parse-document/index.ts` | 683 |
| `supabase/functions/generate-narrative/index.ts` | 524 |
| `src/lib/manual-review-api.ts` | 341 |
| `supabase/functions/map-accounts/index.ts` | 362 |
| `supabase/functions/ejecutar-calculo/index.ts` | 348 |
| `supabase/functions/run-analysis-pipeline/index.ts` | 293 |

## Duplicación relevante — RIESGO/DEUDA

4 copias hardcodeadas del mismo dataset sectorial Damodaran 2026, sin
importación cruzada: `src/data/velarix-datos-2026.ts`,
`src/lib/financial-engine.ts`, `supabase/functions/build-structured-input/index.ts`
(`SECTOR_SNAPSHOTS_2026`), `supabase/functions/update-snapshots/index.ts`
(`DAMODARAN_2026`). Detalle en `04-CALIDAD-FINANCIERA.md` y
`10-DEUDA-TECNICA-Y-CODIGO-OBSOLETO.md`.

## Puntos de entrada — VERIFICADO

- Frontend: `src/main.tsx` → `src/App.tsx` (rutas, ver `07-FRONTEND-RUTAS-Y-UX.md`).
- Cada Edge Function: su propio `serve(...)` en `index.ts`, sin router
  compartido más allá de `_shared/anthropic-client.ts` (no existe
  `_shared/cors.ts` ni `_shared/auth.ts` — ver `06-CALIDAD-CODIGO-Y-PRUEBAS.md`).

## Variables de entorno (solo nombres, sin valores)

`.env` (raíz, cliente): `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_URL` (sin valores asignados en el archivo local).

Edge Functions (`Deno.env.get`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_ANON_KEY`/`SUPABASE_PUBLISHABLE_KEY` (fallback entre sí),
`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `APP_URL`. Detalle completo por
función en `08-INFRAESTRUCTURA-E-INTEGRACIONES.md`. No se copió ningún
valor.
