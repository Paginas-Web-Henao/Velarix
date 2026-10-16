---
tipo: bugs
actualizado: 2026-10-16
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

| ~~BUG-06~~ | ✅ Corregido el 2026-10-16: `expected_growth || 25` convertía un crecimiento sin resolver (y también un `0` explícito) en 25 % en el motor, el fingerprint, `build-structured-input` y `continuar-tras-revision`. Ahora es null-aware: `null` = Judgment no resuelto (preflight `JUDGMENT_REQUIRED`, el motor falla cerrado), `0` = crecimiento cero válido | `_shared/canonical-input-normalization.ts`, `_shared/calculation-preflight.ts` | — | `expected-growth-null-aware.test.ts` |
| ~~BUG-07~~ | ✅ Corregido en local el 2026-10-16: `build-structured-input` y `continuar-tras-revision` tomaban `moneda_documento`/`factor_escala` del **último** `parse_complete` del análisis, aunque las homologaciones vinieran del evidence run activo. Un parse posterior cuyo run falló podía cambiar moneda/escala del input. Ahora salen de los `documents_parsed` fuente del run activo (`source_parsed_document_ids`), fail-closed ante fuentes ausentes, escala ausente o incompatibles; legacy (puntero NULL) sin cambios. Tecnoglass no estaba afectado (ambos parses USD ×1000). | `_shared/evidence-document-metadata.ts` | — | Auditoría P8 |

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
| LIM-10 | `JUDGMENT_TO_STRUCTURED_INPUT_PENDING`: resuelto en local por [[ADR-010-judgment-sets-versionados]] (judgment sets + `analyses.active_judgment_set_id`; `build-structured-input` y `continuar-tras-revision` construyen el input v5 solo desde el evidence run activo + el judgment set activo; `ejecutar-calculo` bloquea inputs obsoletos y congela `judgment_used`). Hasta aplicar la migración `20261016140000` y desplegar, el remoto sigue sin camino de Judgment. Ningún caso tiene todavía un judgment set. | En curso (local listo; remoto pendiente de autorización) | `_shared/judgment-sets.ts`, `judgment-sets/index.ts`, `_shared/calculation-readiness.ts` |
| LIM-11 | `MINIMUM_EXPEDIENTE_WRITE_PATH_MISSING`: resuelto en local por la Edge Function `expediente` (`ensure_valuation_file`, `add_account_note`, `add_question`, `add_answer`): actor = usuario autenticado (el body no puede fijarlo), dueño + rol analyst/admin, append-only, audit sin copiar texto, 409 `CASE_ALREADY_CALCULATED`. Sin migración (el schema bastaba). Hasta desplegar, el remoto sigue sin write path. Límite: no hay modelo de supersession para notas/preguntas (corregir = fila nueva) y `expedient_questions.estado` no se actualiza (el tratamiento se deriva de las respuestas). | En curso (local listo; despliegue pendiente) | `expediente/index.ts`, `_shared/expediente-write.ts` |
| LIM-12 | Defaults de moneda/escala/FX en la ruta del structured input: **resuelto en local para casos versionados** (`_shared/structured-input-currency.ts`, `_shared/evidence-document-metadata.ts`). Con evidence run activo: `moneda_analisis` debe ser COP/USD explícitos (`ANALYSIS_CURRENCY_REQUIRED`); la moneda del documento debe estar reconocida (`ACTIVE_EVIDENCE_CURRENCY_MISSING`); la escala solo cuenta si `escala_origen = "DECLARED"` (`ACTIVE_EVIDENCE_SCALE_UNRESOLVED`: parse-document persiste `factor_escala ?? 1`, no distingue unidad real de default, y `INFERRED` es una heurística por magnitud que ya multiplicó las filas); monedas distintas → `EXCHANGE_RATE_REQUIRED` (no hay tasa explícita trazable; nunca TRM 4080). Legacy (sin run activo) conserva COP / `\|\| 1` / TRM 4080 como LEGACY_COMPATIBILITY_DEFAULT (Alpina y golden cases sin cambios). Pendiente: un camino para registrar una tasa FX con fuente/fecha y para declarar la escala de un documento sin declaración (hoy ambos casos quedan bloqueados, no adivinados); `buildDefaultSnapshot` sigue guardando TRM 4080 como provenance (el motor no lo lee). | Mitigada (versionado fail-closed; FX/escala manual pendientes de diseño) | `build-structured-input`, `continuar-tras-revision`, `structured-input-builder.ts` |
| LIM-13 | `parse-document` con escala `INFERRED`: multiplica los valores de las filas por la escala inferida **y** persiste `factor_escala` = esa escala, que el builder vuelve a aplicar (posible doble escala en casos legacy no declarados). No se cambia (BL-03 fuera de alcance); en casos versionados queda bloqueado por `ACTIVE_EVIDENCE_SCALE_UNRESOLVED`. | Abierta (legacy) | `parse-document/index.ts` (`detectarEscala`) |

## Corregidos recientemente (referencia)

Root causes de [[05-financial-engine-audit]] implementados en Bloque 3C (2026-09-03 → 09-06), con sus tests v5 en verde:
- RC-1 `Math.abs()` sobre `equity` · RC-2 weights del WACC desde book equity · RC-3 contrato de supuestos resueltos · RC-5 lambda de riesgo país.
- 2026-09-07: clasificación de leases de Alpina (`bbd5c7a`), procedencia de supuestos (`9f20de0`), sensibilidad con drivers v5 (`7e52dfc`), escenarios alineados con overlays de `g` (`50f2d08`), KPIs base desde evidencia observada (`c52f901`).

> Pendiente de confirmar: si el bug de signo de equity negativo entre motores servidor/cliente (hallazgo v4.2) sigue presente en el motor **cliente**.

## Cómo registrar un bug nuevo

Añadir una fila con ID `BUG-NN`, archivo:línea, severidad (P0 financiero / P1 / baja) y la fuente que lo demuestra (test, commit o documento). Si es financiero, enlazar la sección de [[04-VALUATION-METHODOLOGY-V5]] que se incumple.
