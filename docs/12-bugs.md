---
tipo: bugs
actualizado: 2026-10-15
tags: [velarix, bugs, system]
---

# Bugs y limitaciones conocidas

Volver a [[00-home]] · Pendientes: [[11-pendientes]] · Roadmap: [[10-roadmap]] (las limitaciones CONDITIONAL afectan la fase 3, [[caso-alpina]])

Regla v5.0: **un cálculo financieramente incorrecto es bloqueante absoluto**, por encima de cualquier trabajo de UI.

## Abiertos

| ID | Descripción | Ubicación | Severidad | Fuente |
|---|---|---|---|---|
| BUG-01 | `revenue = 0` produce márgenes `Infinity`/`NaN` en el motor **cliente** | `src/lib/financial-engine.ts` | Baja (solo Quick Model) | `test.fails` en `financial-engine.golden-cases.test.ts:154`; [[DECISIONES-FINANCIERAS-PENDIENTES]] |
| ~~BUG-02~~ | ✅ Resuelto el 2026-10-15: `types.ts` incluye las tablas del Expediente y `admin_set_user_role` (a mano, idéntico a las migraciones) | `src/integrations/supabase/types.ts` | — | Commit `1a52f2e` |
| BUG-03 | `playwright.config.ts` apunta a `./tests`, que no existe | raíz | Baja | Inspección del repo |
| BUG-04 | `npx tsc --noEmit -p tsconfig.app.json` falla en `pdf-canonical-calculation.regression.test.ts` (`node:fs`, `node:path`, `__dirname` sin tipos de Node). No afecta a `npm run build` ni a `npm test` | `src/lib/pdf-canonical-calculation.regression.test.ts` | Baja | Verificado el 2026-10-15; ya existía antes de retirar la landing |
| BUG-05 | `npm run lint` da 266 errores y 25 warnings (sobre todo `no-explicit-any`; incluye `velarix-code-latest/`, que eslint no ignora). Línea base previa: 268/25; los 2 errores menos son del `Dashboard.tsx` eliminado | varios | Baja | Comparación regla por regla, 2026-10-15: 0 introducidos |

## Limitaciones de diseño (documentadas, no bugs)

| ID | Limitación | Clasificación | Fuente |
|---|---|---|---|
| LIM-01 | Horizonte de proyección fijo en 5 años (`MOTOR_SUPPORTED_PROJECTION_HORIZON_YEARS = 5`) | CONDITIONAL FOR ALPINA | [[04-VALUATION-METHODOLOGY-V5]] §18.3 #6 |
| LIM-02 | Sin lógica de stub period | CONDITIONAL (no aplica si fecha de valoración = cierre) | §18.3 #11 |
| LIM-03 | Dos motores DCF (cliente vs. canónico) pueden divergir | Unificación `NOT BUILDING` | D-06 en [[REGISTRO-DE-DECISIONES]] |
| LIM-04 | Rama legacy de `capital-structure.ts` conserva el fallback 70/30 cuando no hay `resolved_assumptions` | Compatibilidad con golden cases A/B/C | [[05-financial-engine-audit]] §4 |
| LIM-05 | `EVIDENCE_REPROCESSING_VERSIONING_PENDING`: resuelto en local por [[ADR-009-evidence-runs-versionado]] (evidence runs, build then promote; sin `DELETE`). Hasta aplicar la migración `20261016120000` y desplegar, el remoto sigue con el comportamiento anterior (map/validate borran sus filas). Los casos con `calculation_result` siguen protegidos: 409 `CASE_ALREADY_CALCULATED`. | En curso (local listo; remoto pendiente de autorización) | [[04-flujos]] §1, `_shared/evidence-runs.ts`, `_shared/evidence-pipeline-guards.ts` |
| LIM-05 | Modelo de Anthropic fijo en `anthropic-client.ts` | Decisión D-03 | [[REGISTRO-DE-DECISIONES]] |
| LIM-06 | Dataset Damodaran 2026 hardcodeado en `update-snapshots` | Por diseño | `update-snapshots/index.ts` |
| LIM-07 | `supabase/functions/_shared` no está cubierto por ningún `tsconfig` | Sin typecheck oficial | [[06-tests-first-plan]] |
| LIM-08 | El extractor PDF de `parse-document` solo lee PDFs sin comprimir ni cifrar: busca `BT…ET` en los bytes crudos, sin descomprimir FlateDecode ni descifrar. Un PDF moderno (p. ej. el 10-K FY2024 de Tecnoglass, RC4-128 + FlateDecode) da 0 caracteres. Antes el fallback de IA recibía entonces los bytes del archivo; desde el 2026-10-16 falla cerrado con `DOCUMENT_TEXT_UNAVAILABLE` (sin IA, sin `documents_parsed`). Soporte PDF real (descompresión/descifrado/OCR) pendiente de diseño | Abierta | `_shared/document-text-gate.ts`, [[pipeline-documental]] |
| LIM-09 | `VERSIONED_MANUAL_MAPPING_CORRECTION_PENDING`: la corrección manual de homologaciones (`corregirCuenta`) solo funciona sobre filas legacy. En casos versionados se rechaza antes del UPDATE porque las filas de un evidence run son inmutables. Flujo pendiente: clonar el set activo en un run nuevo (servidor) → aplicar la corrección con provenance → validar → promover. | Abierta (diseño en [[ADR-009-evidence-runs-versionado]]) | `src/lib/manual-review-api.ts`, `_shared/evidence-runs.ts` |

## Corregidos recientemente (referencia)

Root causes de [[05-financial-engine-audit]] implementados en Bloque 3C (2026-09-03 → 09-06), con sus tests v5 en verde:
- RC-1 `Math.abs()` sobre `equity` · RC-2 weights del WACC desde book equity · RC-3 contrato de supuestos resueltos · RC-5 lambda de riesgo país.
- 2026-09-07: clasificación de leases de Alpina (`bbd5c7a`), procedencia de supuestos (`9f20de0`), sensibilidad con drivers v5 (`7e52dfc`), escenarios alineados con overlays de `g` (`50f2d08`), KPIs base desde evidencia observada (`c52f901`).

> Pendiente de confirmar: si el bug de signo de equity negativo entre motores servidor/cliente (hallazgo v4.2) sigue presente en el motor **cliente**.

## Cómo registrar un bug nuevo

Añadir una fila con ID `BUG-NN`, archivo:línea, severidad (P0 financiero / P1 / baja) y la fuente que lo demuestra (test, commit o documento). Si es financiero, enlazar la sección de [[04-VALUATION-METHODOLOGY-V5]] que se incumple.
