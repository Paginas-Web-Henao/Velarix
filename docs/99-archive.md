---
tipo: archive
actualizado: 2026-10-15
tags: [velarix, archive]
---

# 99 — Archive (HISTORICAL / SUPERSEDED)

[[00-home]]

> [!warning] Todo lo que está en `docs/velarix/` es material **histórico**, salvo que una nota activa lo cite expresamente como evidencia o genealogía. Nada de ahí define el alcance, el roadmap ni la metodología actuales.

## Orden de autoridad
1. Metodología v5: [[04-VALUATION-METHODOLOGY-V5]] y [[03-methodology-decisions-v5]]
2. Decisiones vigentes: [[09-decisiones]] y los ADR
3. Documentos del caso activo: [[cases/alpina/00-case-home|Alpina]]
4. Documentación de sistema actual: [[02-SYSTEM]]
5. Documentos históricos: **solo contexto**

## Eras superadas

| Era | Qué era | Dónde está | Superada por |
|---|---|---|---|
| v1 (2026-03) | SaaS de valoración automatizada con IA | PDF/DOCX de la raíz del vault, `Negocio.md` | [[ADR-001-redefinicion-v5]] |
| v4.1 / v4.2 (2026-08) | Boutique expert-led con clientes, pricing y fases comerciales | `Negocio_Velarix_v4.1.md`, `Negocio_Velarix_v4.2.md`, `NEGOCIO_V4_VELARIX.md`, `docs/velarix/fases/`, `docs/velarix/plan/ROADMAP.md`, `PLAN-MAESTRO.md`, [[REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10]] | [[ADR-001-redefinicion-v5]] |
| Landing comercial | Página B2B | Eliminada; registro en [[landing]] | [[ADR-006-retirar-landing-comercial]] |
| Demo pública | Estimador sin login en `/` | Ahora [[quick-model]] privado | [[ADR-007-personal-valuation-workbench]] |
| Auditoría y bloques 1A–1D, 1B-M, 1C | Historial de implementación previo a v5 | `docs/velarix/auditoria/`, `docs/velarix/bloque-*` | Genealogía técnica; útil como contexto |
| 8 casos históricos | Casos manuales de aprendizaje | `docs/velarix/casos/`, `docs/velarix/consolidacion-8-casos/` | Material de aprendizaje, no backlog |

Los documentos comerciales llevan un aviso `HISTORICAL / SUPERSEDED` al inicio. Nada se borró. Para recuperar la landing: git, commit `c52f901`.

Índice de la carpeta: [[archive-indice]].
