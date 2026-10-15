---
tipo: modulo
capa: transversal
estado_v5: KEEP
actualizado: 2026-10-15
tags: [velarix, modulo, trazabilidad]
---

# Reproducibilidad y trazabilidad

Índice: [[03-modulos]] · Decisión: [[ADR-003-separacion-evidence-judgment-snapshots]]

## Qué es
Todo resultado de cálculo del [[motor-canonico]] viaja en un *envelope* que permite recorrer cada cifra hasta su origen y reproducirla. Se aplica a [[caso-alpina]] (fingerprint y snapshots en `alpina-2024.canonical-execution.test.ts`).

## Archivos (`supabase/functions/_shared/`)
- `calculation-fingerprint.ts` — hash determinístico de evidencia **y** supuestos resueltos.
- `calculation-versioning.ts` — versión del cálculo y de los supuestos realmente usados.
- `calculation-provenance.ts` — "¿de qué fuente sale esta cifra?".
- `source-input-snapshot.ts` — congela solo Evidence.
- `resolved-assumptions-snapshot.ts` — congela solo Judgment (`resolved_assumptions_used`).

## Tests
`calculation-fingerprint*.test.ts`, `calculation-versioning*.test.ts`, `calculation-provenance.test.ts`, `source-input-snapshot*.test.ts`, `calculation-envelope.integration.test.ts`.

## Documentos
[[05-financial-engine-audit]] §7 · [[BL-32-diseno-versionado]]
