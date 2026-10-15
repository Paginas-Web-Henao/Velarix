---
tipo: modulo
capa: salida
estado_v5: KEEP
actualizado: 2026-10-15
tags: [velarix, modulo, ia]
---

# Narrativa con IA

Índice: [[03-modulos]] · Integraciones: [[08-integraciones]]

## Qué es
Borrador de narrativa del informe generado con Anthropic, **ligado al cálculo canónico** (commit `c34f964`). La IA no altera cifras.

## Archivos
- `supabase/functions/generate-narrative/index.ts` (cabecera "VELARIX v4.1 — Motor Narrativo Institucional Completo"; 20 secciones + riesgos + recomendaciones + auditoría). Si su auditoría falla → `revision_manual_requerida`.
- `_shared/narrative-calculation-adapter.ts` — adaptador puro `calculation_result` → narrativa.
- `_shared/anthropic-client.ts` — `callAnthropic`, modelo `claude-opus-4-8`.
- Tabla `report_narratives`.

## Pendiente
> Pendiente de confirmar: qué la invoca hoy (no se encontró llamada desde componentes; solo `generateNarrative` en `api-client.ts`).

## Tests
`generate-narrative-contract.test.ts`, `narrative-calculation-adapter.test.ts`. Benchmark: [[benchmarks-ia]].
