---
tipo: skill
actualizado: 2026-10-15
tags: [velarix, skill]
---

# Comandos y skill de Claude Code

Volver a [[07-SKILL]] · Especificación: [[VELARIX-VALUATION-SKILL]]

Claude Code admite **skills de proyecto** (`.claude/skills/<nombre>/SKILL.md`, frontmatter `name` y `description`) y **comandos personalizados** (`.claude/commands/<nombre>.md`, invocables como `/<nombre>`, con `$ARGUMENTS`). Ambos están versionados en el repo y no requieren dependencias.

| Archivo | Uso |
|---|---|
| `.claude/skills/velarix-valuation/SKILL.md` | Claude la carga cuando el trabajo es de valoración. Solo apunta a la especificación |
| `/velarix-new-case <empresa>` | Crea el case MOC desde [[_case-template]] y lista los pasos en el workbench |
| `/velarix-review-evidence <caso>` | Inventario de evidencia, vacíos y preguntas |
| `/velarix-assumptions <caso>` | Estado de los 13 supuestos; propone sin aprobar |
| `/velarix-run-valuation <caso>` | Verifica checkpoint y preflight; ruta oficial `ejecutar-calculo` |
| `/velarix-challenge <caso>` | Sensibilidades, escenarios, supuestos débiles |
| `/velarix-case-summary <caso>` | Estado del caso: qué hay, qué falta, qué bloquea |

**ChatGPT u otros**: no hay mecanismo equivalente en el repo. Pega el contenido de [[VELARIX-VALUATION-SKILL]] como instrucciones del proyecto o de la conversación.

Las reglas viven **solo** en la especificación; los comandos y la skill la referencian. Si cambia el comportamiento esperado de la IA, se edita la especificación.
