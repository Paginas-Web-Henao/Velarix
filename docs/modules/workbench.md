---
tipo: modulo
capa: frontend
estado_v5: KEEP
actualizado: 2026-10-15
tags: [velarix, modulo, workbench]
---

# Workbench

Índice: [[03-modulos]] · Mapa: [[03-WORKBENCH]] · Decisión: [[ADR-007-personal-valuation-workbench]]

Interfaz privada de trabajo (`/workbench`). Un **caso** es una fila de `analyses`. El estado de navegación vive en la URL (`?case=<id>&tab=<sección>`, `?view=new|reviews|qa|account`) para no multiplicar rutas.

## Archivos
- `src/pages/Workbench.tsx`: barra superior, panel lateral (casos, Quick Model, Review Center, QA, Settings); la barra superior muestra el modo de acceso (LOCAL_PRIVATE / DEPLOYED_PRIVATE), sin email ni logout y vista principal.
- `src/components/workbench/OwnerGate.tsx` + `src/contexts/OwnerSessionContext.tsx`: acceso single-owner sin login ([[ADR-008-single-owner-private-mode]]).
- `src/components/workbench/SettingsPanel.tsx`: modo, Supabase, sesión del owner y rol interno (sustituye a "Cuenta").
- `src/components/workbench/CaseWorkbench.tsx`: cabecera del caso (A) y pestañas B–K.
- `src/components/workbench/CaseSections.tsx`: secciones de solo lectura sobre Supabase y el envelope canónico.
- `src/components/workbench/useCaseData.ts`: carga del caso (bajo RLS).
- `src/components/workbench/ui.tsx`, `format.ts`: primitivas (Panel, DataTable, etiquetas de capa).
- `src/lib/canonical-pdf-download.ts`: PDF fail-closed desde el `calculation_result` canónico.
- Reutilizados de `src/components/dashboard/`: `NewAnalysisStepper` (nuevo caso), `DocumentUpload`, `ProgressPanel`, `QAChecklist` (`UserProfile` se eliminó con ADR-008).
- Review Center: `src/pages/AdminReviews.tsx` embebido; detalle en `/workbench/reviews/:revisionId` (`AdminReviewDetail.tsx`).

## Secciones del caso

| | Sección | Fuente de datos | Capa |
|---|---|---|---|
| A | Case (cabecera) | `analyses` + `source_input_snapshot.base_period` | — |
| B | Evidence | `documents`, `source_input_snapshot`, `provenance` | EVIDENCE |
| C | Business | `analyses` (empresa, sector); el resto vive en el case MOC | EVIDENCE |
| D | Accounts | `account_homologations`, `validation_results`, `account_notes` | EVIDENCE / JUDGMENT |
| E | Questions | Checkpoint mínimo, `expedient_questions` + `expedient_answers`, `manual_reviews` | JUDGMENT |
| F | Judgment | `resolved_assumptions_used` (o snapshot legacy, marcado como tal) + Ke/WACC calculados | JUDGMENT / CALCULATION |
| G | Forecast | `calculation_result.projections` | CALCULATION |
| H | Valuation | `calculation_result.valuation` | CALCULATION |
| I | Challenge | `scenarios`, `sensitivityMatrix` | CALCULATION |
| J | Output | Rango, limitaciones, narrativa (borrador IA), PDF | — |
| K | Audit trail | `version`, `provenance.fields`, snapshots, `audit_events` | — |

**Sin tabla todavía (honesto en la UI):** fecha de valoración y basis of value como columnas, comprensión del negocio y ajustes de normalización. Viven en el case MOC de Obsidian.

## Tests
`src/test/private-routing.test.tsx` (rutas privadas, logout y redirecciones legacy) y `pdf-canonical-calculation.regression.test.ts` (PDF fail-closed).
