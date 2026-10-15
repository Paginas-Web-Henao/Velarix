---
tipo: modulo
capa: herramienta
estado_v5: FREEZE
actualizado: 2026-10-15
tags: [velarix, modulo, ia, benchmark]
---

# Benchmarks de IA

Índice: [[03-modulos]] · Decisión D-11 en [[REGISTRO-DE-DECISIONES]]

- `scripts/benchmark-ai/` — benchmark de extracción (`parse-document`): adapters Anthropic/OpenAI, `fixtures.ts`, `scoring.ts`, `pricing.ts`, `runner.ts`.
- `scripts/benchmark-narrative/` — benchmark de narrativa: además `blind.ts` (evaluación ciega) y `tasks.ts`. Resultados locales en `results/` (ignorado por git).
- Evidencia JSONL: `evidence/benchmark/2026-08-18/` (dentro de la raíz del repo pero **ignorada por git**, coherente con D-11).

No hay script npm para ejecutarlos. > Pendiente de confirmar el comando usado.
