---
tipo: decision
id: ADR-011
estado: aceptada (local; migración remota y despliegue pendientes de autorización)
fecha: 2026-10-16
tags: [velarix, decision, evidence, system]
---

# ADR-011 — Corrección manual de homologaciones sobre Evidence versionada

Índice: [[09-decisiones]] · Cierra: LIM-09 en [[12-bugs]] · Antecedente: [[ADR-009-evidence-runs-versionado]] · Módulo: [[revision-manual]] · Datos: [[05-base-de-datos]]

## Contexto
Las homologaciones de un evidence run son inmutables (ADR-009). `corregirCuenta` solo corrige filas legacy con UPDATE; en un caso versionado se rechazaba sin alternativa (`VERSIONED_MANUAL_MAPPING_CORRECTION_PENDING`).

## Decisión
- **Nunca UPDATE.** Una corrección humana de mapping crea un **run nuevo B** derivado del activo A: `previous_active_run_id = A`, mismas `source_parsed_document_ids` (sin reparse ni parses falsos), `origin = manual_mapping_correction`, estado `mapped`.
- **Copia exacta + corrección en el INSERT.** Todas las filas de A se copian con `INSERT … SELECT` (NUMERIC exacto, sin pasar por JSON). Solo la fila objetivo cambia `canonical_account` y su metadata de mapping (`confidence_score = alta`, `ambiguity_flag = false`, nota). Label, valor, período, documento y `category` (estado fuente) nunca cambian: corregir mapping ≠ corregir Evidence.
- **Lineage estructurada** (migración `20261016150000`, columnas nullable): `derived_from_homologation_id` (todas las copias), y en la fila corregida `manual_correction_by`, `manual_correction_reason`, `manual_corrected_at`, `previous_canonical_account`, con un CHECK de "completa o ausente".
- **Atomicidad real:** RPC `create_manual_mapping_run` en una sola transacción: `SELECT … FOR UPDATE` del análisis, CAS contra el run activo esperado (`EVIDENCE_RUN_CHANGED`), verificación de la fila en el run activo, creación de B y copia; si algo falla, no queda ni run ni filas parciales. Solo `service_role` puede ejecutarla.
- **Validación y promoción reutilizadas:** `validate-analysis(evidence_run_id = B)` y el CAS de ADR-009 contra `previous_active_run_id`. Si el puntero se movió después de crear B, B no se promueve (`failed_stage = promotion`). El endpoint de corrección no promueve.
- **Destino válido:** la cuenta debe pertenecer a la taxonomía del mismo estado que la fila (`category`), o `unclassified`. Usar una fila de otro estado como fuente (p. ej. D&A del flujo de caja como `da`) es una decisión metodológica, no una corrección de mapping.
- **Detección, no arreglo:** en sets con correcciones manuales, `validate-analysis` añade MAP_008 (misma etiqueta/estado/cuenta/período repetida) y MAP_009 (la cuenta corregida se consolida con otras filas del período → posible doble conteo). Los sets sin correcciones no cambian.
- **Quién:** JWT real, dueño del análisis, rol analyst/admin, caso sin cálculo oficial (409 `CASE_ALREADY_CALCULATED`); el actor lo fija el servidor.

## Alternativas descartadas
- Copiar filas una a una o en lote desde la Edge Function: un fallo a mitad o un crash deja un run a medias, y el round-trip por JSON pierde precisión NUMERIC por encima de 2^53.
- Extender `continuar-tras-revision` / `manual_reviews`: acopla la corrección de Evidence a la revisión manual legacy y a su máquina de estados.

## Consecuencias
- Edge Function nueva `create-manual-mapping-run`; helper cliente `crearCorreccionMappingVersionada` (sin UI).
- Un nuevo evidence run activo deja obsoleto el judgment set activo (ADR-010: `JUDGMENT_STALE_FOR_EVIDENCE_RUN`); reutilizarlo es una acción humana explícita.
- Si `account_homologations` gana columnas de Evidence, la copia de la RPC debe ampliarse en la misma migración.
- Verificado en Postgres 17.5 real (19/19) y con los handlers reales en memoria.
