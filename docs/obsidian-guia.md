---
tipo: guia
actualizado: 2026-10-15
tags: [velarix, obsidian]
---

# Guía del vault: Velarix Knowledge System

Volver a [[00-home]]

## Dónde está cada cosa

- **Vault de Obsidian:** `Velarix/` (contiene `.obsidian/`). **Repo de código:** `Velarix/velarix-code/` (git). El conocimiento vive en `velarix-code/docs/`, versionado con el código.
- **Inicio:** [[00-home]] (fijarlo con Bookmarks).

## Estructura conceptual

```
00 HOME ............ 00-home
01 METHODOLOGY ..... maps/01-METHODOLOGY → velarix-v5/ (canónico)
02 SYSTEM .......... maps/02-SYSTEM → 02-arquitectura, 05–08, 13–14, modules/
03 WORKBENCH ....... maps/03-WORKBENCH → modules/workbench, modules/quick-model
04 CASES ........... maps/04-CASES → cases/alpina/00-case-home, cases/_case-template
05 DECISIONS ....... maps/05-DECISIONS → 09-decisiones, decisions/ADR-*
06 RESEARCH ........ maps/06-RESEARCH → research/
07 SKILL ........... maps/07-SKILL → skill/VELARIX-VALUATION-SKILL, skill/claude-commands
99 ARCHIVE ......... 99-archive → velarix/ (histórico), archive/
```

Los mapas (`docs/maps/`) son índices encima de las notas existentes: enlazan, no duplican. No se movió ningún documento canónico. Las notas numeradas `01-contexto` … `15-glosario` siguen siendo el detalle técnico.

## Convenciones

- Enlaces con doble corchete y el nombre de la nota (p. ej. `[[00-home]]`). Los case homes se enlazan **por ruta** (`[[cases/alpina/00-case-home|Alpina]]`), porque todos los casos usan el mismo nombre de archivo.
- Frontmatter con `tipo`, `actualizado` y `tags`. Las etiquetas conceptuales (`methodology`, `system`, `workbench`, `case`, `decision`, `skill`) alimentan los colores del grafo.
- Nuevo caso: copiar [[_case-template]] a `docs/cases/<caso>/00-case-home.md` (o usar `/velarix-new-case`).
- Nueva decisión: [[plantilla-decision]] → `docs/decisions/ADR-NNN-*.md` + fila en [[09-decisiones]].
- Lo incierto se marca `> Pendiente de confirmar`. No se duplica contenido de `docs/velarix-v5/`.
- Lo histórico lleva el aviso `HISTORICAL / SUPERSEDED` ([[99-archive]]).

## Graph View (`.obsidian/graph.json`)

- **Filtro:** `path:"velarix-code/docs" -path:"velarix-code/docs/velarix/" -path:"velarix-code/docs/archive" -tag:#retirado`. Muestra lo activo y los canónicos de v5. Oculta lo histórico de `docs/velarix/` (sigue en búsqueda y enlaces) y lo retirado. La barra final en `docs/velarix/` evita ocultar `docs/velarix-v5/`. Para ver todo, borra el filtro.
- Huérfanos, adjuntos y enlaces sin resolver ocultos; flechas visibles; `showTags: false`, porque el nodo `#velarix` conectaría todo y taparía la estructura.
- **6 grupos de color** (gana el primero que coincide): Home · Methodology (`docs/velarix-v5` + `#methodology`) · Cases (`#case`) · Decisions (`#decision`) · Skill (`#skill`) · System (`#system`, `#workbench`, `docs/modules`).
- Forma esperada: HOME → mapas 01–07 → notas de detalle. La metodología canónica queda visible.

## Búsquedas útiles

- Pendientes: `"- [ ]" path:"velarix-code/docs"`
- Sin confirmar: `"Pendiente de confirmar"`
- Fuera de alcance: `"NOT BUILDING"`
- Histórico marcado: `"HISTORICAL / SUPERSEDED"`

## Flujo con Claude

Claude Code carga `velarix-code/CLAUDE.md`, la skill `.claude/skills/velarix-valuation/` y los comandos `/velarix-*` ([[claude-commands]]). Al cerrar un trabajo se actualizan el case MOC, [[11-pendientes]], [[10-roadmap]] y, si hubo decisión, un ADR.

## Lo que no se toca sin decisión

`docs/velarix-v5/` (canónico), `docs/velarix/` (histórico; solo recibió el aviso), `.env*`, `.vercel/`, `supabase/.temp/`, los `.zip`, `velarix-code-latest/` y los PDF/DOCX de la raíz del vault.
