---
tipo: guia
actualizado: 2026-10-15
tags: [velarix, obsidian]
---

# Guía del vault (Obsidian + VS Code + Claude)

Volver a [[00-home]]

## Dónde está cada cosa

- **Vault de Obsidian:** `Velarix/` (contiene `.obsidian/`). Abrir esa carpeta en Obsidian.
- **Repo de código:** `Velarix/velarix-code/` (git). Abrir esa carpeta en VS Code.
- **Capa de conocimiento:** `velarix-code/docs/` → versionada con el código, visible en Obsidian.
- **Nota de inicio:** [[00-home]]. Fijarla con *Bookmarks* (core plugin ya activo).

## Convenciones

- Enlaces internos con doble corchete y el nombre de la nota (p. ej. `[[00-home]]`). Los nombres de archivo son únicos en el vault, así que no hace falta la ruta.
- Toda nota nueva lleva frontmatter con `tipo`, `actualizado` y `tags`.
- `tipo` usado: `home`, `contexto`, `arquitectura`, `modulo`, `decision`, `indice`, `guia`, etc.
- Módulos: `docs/modules/<kebab-case>.md` con `estado_v5` (KEEP / MODIFY / FREEZE / LEGADO).
- Decisiones nuevas: copiar [[plantilla-decision]] → `docs/decisions/ADR-NNN-titulo.md` y añadir la fila en [[09-decisiones]].
- Lo que no se sabe con certeza se marca `> Pendiente de confirmar`.
- **No duplicar** contenido de `docs/velarix-v5/`: enlazarlo. Esos documentos son la autoridad metodológica.

## Filtros recomendados

### Archivos excluidos
*Settings → Files and links → Excluded files*. Configurado en `.obsidian/app.json` (`userIgnoreFilters`):

```
velarix-code/node_modules/
velarix-code/dist/
velarix-code/velarix-code-latest/
velarix-code/supabase/.temp/
velarix-code/scripts/benchmark-narrative/results/
```

Evita que ~350 paquetes de `node_modules` y el snapshot viejo de Lovable aparezcan en búsquedas, en el grafo y en la resolución de enlaces (`velarix-code-latest/` tiene un `README.md` y archivos con los mismos nombres que el código real).

### Grafo
Configurado en `.obsidian/graph.json`:

- **Filtro**: `path:"velarix-code/docs" -path:"velarix-code/docs/velarix/" -path:"velarix-code/docs/archive" -tag:#retirado`. Muestra la documentación activa y los canónicos de v5 (`docs/velarix-v5/`). Oculta la documentación histórica de `docs/velarix/` (sigue en el vault, en la búsqueda y en los enlaces) y los módulos retirados. Para ver todo, borra el filtro.
  - La barra final en `docs/velarix/` es necesaria: `path:` busca por subcadena, y sin la barra también ocultaría `docs/velarix-v5/`.
- **Huérfanos ocultos**, adjuntos ocultos, enlaces sin resolver ocultos, flechas visibles. Tamaño de nodo 1.2 y distancia de enlace 120 (antes 250).
- **Grupos de color** (Obsidian aplica el primero que coincide):
  1. `path:"velarix-code/docs/modules"`: módulos (verde).
  2. `path:"velarix-code/docs/decisions"`: ADRs (rojo).
  3. `path:"velarix-code/docs/velarix-v5"`: metodología canónica v5 (azul).
  4. `path:"velarix-code/docs" file:"00-home"`: nota de inicio (dorado).
- Copia de la configuración anterior: guardada fuera del vault. Si Obsidian estaba abierto con el grafo, recárgalo (*Reload app without saving*) para que no sobrescriba la configuración nueva.
- `showTags` queda en `false`: todas las notas comparten `#velarix`, y el nodo de esa etiqueta se conectaría con todo y taparía la estructura real de enlaces.

La estructura que debe verse: [[00-home]] → [[01-contexto]] → [[02-arquitectura]] → [[03-modulos]] → [[caso-alpina]] → [[04-VALUATION-METHODOLOGY-V5]] → [[motor-canonico]] → [[expediente]] → [[13-testing]] → [[09-decisiones]] → [[10-roadmap]].

### Búsquedas útiles
- Pendientes abiertos: `task-todo:""` o `"- [ ]" path:velarix-code/docs`
- Sin confirmar: `"Pendiente de confirmar"`
- Módulos a modificar: `[estado_v5:MODIFY]`
- Fuera de alcance: `"NOT BUILDING"`

### Bases (core plugin activo)
Se puede crear una *Base* filtrando `tipo = modulo` y mostrando `estado_v5`, `capa`, `actualizado` como columnas.

## Flujo de trabajo con Claude

- Claude Code lee `velarix-code/CLAUDE.md` automáticamente al trabajar en el repo. Ese archivo resume las reglas y enlaza esta documentación.
- Al cerrar un bloque de trabajo: actualizar [[11-pendientes]], [[10-roadmap]] y, si hubo decisión, crear un ADR.

## Cosas que no se tocaron (a propósito)

La creación del vault (2026-10-15) no movió, borró ni editó archivos existentes. Después, por decisión explícita, se eliminó la landing comercial y se tocó el Estimador, el checklist QA y el README ([[ADR-006-retirar-landing-comercial]]). Fuera de eso, siguen igual:
- El resto del código (`supabase/`, `scripts/`, configuración, lógica de `src/lib/`).
- `docs/velarix/` y `docs/velarix-v5/`.
- `.env`, `.env.local`, `.vercel/`, `supabase/.temp/` (no se leyeron valores).
- Los `.zip`, los `Negocio*.md` y `velarix-code-latest/`.
- Los PDF/DOCX/PNG de la raíz del vault.

Mover cualquiera de estos es una decisión aparte (ver [[archive-indice]]).
