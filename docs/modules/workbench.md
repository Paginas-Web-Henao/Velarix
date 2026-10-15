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
| A | Case (cabecera) | `analyses`: período base, fecha de valoración y basis of value (metadata estructurado), status, EV/Equity | — |
| B | Evidence | `documents` (SUPABASE_DOCUMENT_EVIDENCE), `source_input_snapshot` (con su capa de origen), y tres estados de provenance: case source, document y account lineage | EVIDENCE |
| C | Business | `analyses` (contexto, interés valorado, arquitectura) + `business_profile` (resumen, segmentos, geografías, drivers y riesgos, cada uno con su fuente); el narrativo completo vive en el case MOC | EVIDENCE |
| D | Accounts | `account_homologations`, `validation_results`, `account_notes` | EVIDENCE / JUDGMENT |
| E | Questions | Checkpoint mínimo; hilos C-xx colapsables (estado, evidencia, Judgment completo, fuente e historial de versiones superseded); `manual_reviews` | JUDGMENT |
| F | Judgment | `resolved_assumptions_used` (o snapshot legacy, marcado como tal) + Ke/WACC calculados | JUDGMENT / CALCULATION |
| G | Forecast | `calculation_result.projections` | CALCULATION |
| H | Valuation | `calculation_result.valuation` | CALCULATION |
| I | Challenge | `scenarios`, `sensitivityMatrix`; P-12 marcado como NOT IMPLEMENTED | CALCULATION |
| J | Output | Bloque OFFICIAL CALCULATION VERIFIED (solo si existe un `official_calculation_verified` con el mismo fingerprint y `calculated_at` y 0 diferencias reales), rango, limitaciones de trazabilidad, narrativa (borrador IA), PDF | — |
| K | Audit trail | `version`, provenance por campo (capa de origen; «not available» = ausencia conocida, nunca ids fabricados), snapshots, `audit_events` | — |

**Semántica de provenance** (`case-provenance.ts`, sin nada específico de un caso):
- *Case source provenance:* `REPO_CANONICAL` si existe el evento `case_materialized_from_repo`. Pasa a `VERIFIED · REPO_CANONICAL` solo si además hay una verificación oficial que coincide con el cálculo persistido.
- *Document provenance* y *Account homologation lineage:* `MISSING`, `PARTIAL` o `COMPLETE`, según el envelope del cálculo.
- `REPO_CANONICAL_EVIDENCE` ≠ `SUPABASE_DOCUMENT_EVIDENCE`. No se simulan documentos.

**Sin tabla todavía (honesto en la UI):** los ajustes de normalización (viven en el case MOC).

## Tests
`src/test/private-routing.test.tsx` (rutas privadas), `pdf-canonical-calculation.regression.test.ts` (PDF fail-closed), `CaseWorkbench.test.tsx` (cabecera con metadata o con NULL), `CaseSections.test.tsx` (provenance, VERIFIED, Questions, texto largo, P-12) y `src/test/engine-integrity.test.ts` (SHA-256 fijos del motor y de los fixtures de Alpina).
