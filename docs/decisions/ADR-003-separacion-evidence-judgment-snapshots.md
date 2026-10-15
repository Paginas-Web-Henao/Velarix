---
tipo: decision
id: ADR-003
estado: aceptada
fecha: 2026-09-03
tags: [velarix, decision, trazabilidad]
---

# ADR-003 — Snapshots separados de Evidence y Judgment

Índice: [[09-decisiones]] · Módulo: [[reproducibilidad]]

## Contexto
La versión 1.2 de la auditoría proponía meter los `resolved_assumptions` dentro de `source_input_snapshot`, lo que mezcla Evidence con Judgment.

## Decisión
`source_input_snapshot` contiene **solo** evidencia. Los supuestos resueltos se congelan en un snapshot propio (`resolved_assumptions_used`) dentro del envelope. El fingerprint cubre ambas capas.

## Consecuencias
Cambiar solo un supuesto cambia el fingerprint y la versión, pero no el `source_input_snapshot`: las capas se mueven de forma independiente y verificable.

## Fuente
[[05-financial-engine-audit]] v1.3, §7 y §10 (MUST WRITE TESTS FIRST #5–#9).
