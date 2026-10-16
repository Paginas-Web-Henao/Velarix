---
tipo: decision
id: ADR-010
estado: aceptada (local; migración remota y despliegue pendientes de autorización)
fecha: 2026-10-16
tags: [velarix, decision, judgment, system]
---

# ADR-010 — Judgment versionado: judgment sets con puntero activo

Índice: [[09-decisiones]] · Cierra: LIM-10 en [[12-bugs]] · Módulos: [[supuestos-y-preflight]], [[expediente]] · Datos: [[05-base-de-datos]] · Antecedente: [[ADR-009-evidence-runs-versionado]], [[ADR-003-separacion-evidence-judgment-snapshots]]

## Contexto
No había camino de producto que llevara Judgment estructurado al motor (LIM-10). La metadata del caso y `expected_growth` vivían como columnas mutables de `analyses`, los 13 supuestos resueltos solo existían en el script de Alpina, y `build-structured-input` sobrescribía la fila única de `structured_inputs`. Un Judgment no versionado no es reproducible ni auditable.

## Decisión
- **Opción B: judgment sets** (descartada A, entradas planas append-only con "última por key": mezcla decisiones de momentos distintos y no tiene un punto atómico de activación).
- `judgment_sets`: conjunto coherente de decisiones formulado sobre **un** evidence run. `draft → completed | failed`. `judgment_entries`: `key, value (JSONB), unit, source_type = JUDGMENT, source, rationale, status (resolved|proposed), effective_date, references, supersedes_entry_id, created_by`. Append-only; dentro de un draft, corregir = entrada nueva que supera a la anterior (misma key, mismo set).
- **Build then promote.** `analyses.active_judgment_set_id` es el único set que alimenta Calculation. Se promueve un set `completed` con CAS sobre el puntero previo **y** sobre `active_evidence_run_id = set.evidence_run_id`. Un draft o un failed nunca mueve el puntero; nunca hay "última fila gana" entre sets.
- **Ligado a Evidence.** Si el evidence run activo cambia, el set activo queda obsoleto (`JUDGMENT_STALE_FOR_EVIDENCE_RUN`) y no se calcula. Reutilizarlo exige una acción humana explícita: `create_draft` con `reuse_from_judgment_set_id` (copia con referencias, que luego se completa y promueve).
- **Keys.** `case.expected_growth`, `case.valuation_date`, `case.basis_of_value`, `case.valued_interest`, `case.calculation_architecture` + `resolved.<13 supuestos>` (obligatorias) + `decision.*` (opcionales, congeladas, no las consume el motor). `moneda_analisis`, `company_name` y `sector` siguen siendo metadata del caso, no Judgment versionado.
- **Fuente única.** Con judgment set activo, el set es canónico y las columnas de `analyses` son una **proyección** escrita en el mismo `UPDATE` de la promoción. Sin puntero (Alpina y todo caso previo), las columnas siguen siendo canónicas (legacy, sin cambios).
- **Materialización exacta.** Los 13 supuestos se reconstruyen al contrato `ResolvedCalculationAssumptions` (`{value, unit?, source, rationale, status, date?}`) y se validan con las mismas reglas del preflight. `expected_growth`: `null` = no resuelto; `0` = Judgment explícito válido; nunca 25.
- **Structured input: fila única (opción A).** Se descartó versionar `structured_inputs`: el cálculo ya congela el payload exacto (`source_input_snapshot`, `resolved_assumptions_used`, fingerprint). En modo judgment set, el payload incluye `resolved_assumptions` y `judgment {judgment_set_id, evidence_run_id, assumptions_source, case, decisions}`; `ejecutar-calculo` bloquea un input obsoleto (`STRUCTURED_INPUT_STALE_FOR_JUDGMENT`), toma el crecimiento del input y congela `judgment_used` (incluida la metadata del caso) en el envelope.
- **Write path único:** Edge Function `judgment-sets` (`create_draft`, `add_entry`, `complete`, `fail`, `promote`), con auditoría. El cliente solo lee (RLS SELECT del dueño); la base refuerza append-only, transiciones y el puntero con triggers.
- **Readiness** (`calculation-readiness.ts`) incluye el Minimum Expediente (mismo checkpoint que `ejecutar-calculo`; incompleto = JUDGMENT_REQUIRED, área `human_review`; no evaluado = SYSTEM_ERROR) y el set activo.

## Concurrencia (endurecimiento P8)
- **add_entry:** el trigger `guard_judgment_entries` toma `SELECT … FOR UPDATE` sobre la fila del set, exige `draft`, exige que `supersedes_entry_id` sea la cabeza vigente de la key (`JUDGMENT_ENTRY_HEAD_CONFLICT`, SQLSTATE 40001) e incrementa `judgment_sets.revision` en la misma transacción. Índices únicos parciales (`uq_judgment_entries_root_per_key`, `uq_judgment_entries_single_successor`) garantizan una cadena lineal por key aunque se escribiera sin el lock. El handler traduce el rechazo a 409 `JUDGMENT_ENTRY_CONFLICT`.
- **complete:** valida en TypeScript la revisión R leída **antes** que las entradas y completa con `UPDATE … WHERE status = 'draft' AND revision = R`. Si entró algo después, 0 filas → 409 `JUDGMENT_SET_CHANGED`; un insert en vuelo bloquea el UPDATE hasta su commit y Postgres re-evalúa la condición. Si el complete confirma primero, el insert concurrente ve `completed` y se rechaza.
- **promote:** CAS del puntero (puntero previo + evidence run activo) en un solo `UPDATE`. `promoted_at` es bitácora: si el puntero se movió y el registro falló, reintentar `promote` sobre el set activo es idempotente (registra `promoted_at` una sola vez, audita `judgment_set_promotion_reconciled`, no toca Judgment). Si el CAS pierde contra una promoción del mismo set, también es éxito idempotente.
- Verificado con Postgres 17.5 real y conexiones concurrentes (13/13) y con tests del handler.

## Consecuencias
- Migración aditiva `20261016140000_judgment_sets.sql` (2 tablas, 1 columna nullable, triggers; sin DROP/DELETE/UPDATE de datos). Dry-run en PGlite: datos previos idénticos, punteros NULL.
- Desplegar `judgment-sets`, `build-structured-input`, `continuar-tras-revision` y `ejecutar-calculo` **después** de aplicar la migración (leen `active_judgment_set_id`).
- Alpina no cambia (sin puntero → legacy; fingerprint idéntico).
- Ningún valor de Judgment real se persiste con este ADR. Las decisiones metodológicas de Tecnoglass siguen abiertas.
- Brecha separada: el Minimum Expediente no tiene write path de producto (LIM-11).
