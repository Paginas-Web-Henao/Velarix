---
tipo: decision
id: ADR-009
estado: aceptada (local; migración remota pendiente de autorización)
fecha: 2026-10-16
tags: [velarix, decision, evidence, system]
---

# ADR-009 — Evidence runs: versionado no destructivo de homologación y validación

Índice: [[09-decisiones]] · Contexto: LIM-05 en [[12-bugs]] · Módulo: [[pipeline-documental]] · Datos: [[05-base-de-datos]]

## Contexto
`map-accounts` y `validate-analysis` borraban sus filas anteriores (`DELETE` por `analysis_id`) antes de insertar las nuevas. Reprocesar un caso perdía la Evidence previa, y un fallo a mitad dejaba el caso sin set operacional. Tecnoglass (252 homologaciones, 20 validaciones) no se puede reprocesar sin resolverlo.

## Decisión
- **Un evidence run = homologación + validación** (tabla `evidence_runs`). Ciclo `mapping → mapped → validating → completed`, o `failed` en cualquier etapa (`failed_stage`: mapping / validation / promotion). Las filas quedan ligadas al run (`account_homologations.evidence_run_id`, `validation_results.evidence_run_id`) y nunca se borran.
- **Build then promote.** El set operacional lo indica un solo puntero, `analyses.active_evidence_run_id`. Se promueve solo cuando el run completó homologación **y** validación, con un `UPDATE` de una fila condicionado al puntero que existía cuando el run empezó (compare-and-swap). Ese `UPDATE` es el único punto atómico: un run fallido o viejo nunca mueve el puntero.
- **Lectores operacionales: solo el set activo.** Puntero NULL → filas legacy (`evidence_run_id` NULL); puntero = run → filas de ese run. `sumAccountValue` falla cerrado si recibe filas de más de un run.
- **Se valida exactamente la homologación del run** (`run-analysis-pipeline` pasa el `evidence_run_id`; sin él, el último run `mapped`).
- **Promoción por finalización técnica, no por veredicto** (confirmado por Nicolás, 2026-10-16). `active_evidence_run_id` = la Evidence más reciente procesada de forma completa, no "el último run verde". Un run cuya validación termina bloqueada se promueve y el caso queda `validacion_bloqueada`. No se promueven: fallo de homologación, fallo técnico de validación ni conflicto de promoción.
- **Reclamo atómico del run a validar** (`mapped → validating` con UPDATE condicionado que devuelve la fila): un segundo validate concurrente del mismo run responde 409 `EVIDENCE_RUN_ALREADY_CLAIMED`.
- **Estado del caso tras un fallo:** si map o validate fallan después de iniciar un run, `analyses.status = error_tecnico` (el mismo que fija el pipeline). El puntero no se toca.
- **Inmutabilidad de filas versionadas:** la corrección manual se rechaza en casos/filas versionadas (`VERSIONED_MANUAL_MAPPING_CORRECTION_PENDING`). Garantía en base de datos: migración local `20261016130000_versioned_evidence_write_guards.sql` (políticas RESTRICTIVE en `account_homologations` + trigger que impide al cliente mover `active_evidence_run_id`).

## Alternativa descartada
Punteros separados para mapping y validación: permitirían un set activo de homologaciones no validado junto a validaciones de otro set (inconsistencia entre etapas).

## Consecuencias
- Migraciones `20261016120000_evidence_runs_and_document_types.sql` y `20261016130000_versioned_evidence_write_guards.sql` (aditivas; sin DROP/DELETE; RLS de lectura por dueño en `evidence_runs`; políticas RESTRICTIVE nuevas, ninguna existente modificada). Dry-run: PGlite (Postgres real) + `supabase db push --dry-run`.
- Casos calculados siguen protegidos por `CASE_ALREADY_CALCULATED` (no se reprocesan).
- Desplegar las funciones nuevas **después** de aplicar la migración (insertan en `evidence_runs`).
- `analyses.status` sigue siendo el estado del último intento: tras un fallo puede quedar en `homologacion_en_curso` / `error_tecnico` aunque el set activo anterior siga intacto.
