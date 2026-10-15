---
tipo: indice
actualizado: 2026-10-15
tags: [velarix, archive]
---

# Archivo

Volver a [[00-home]] · Índice principal del material histórico: **[[99-archive]]**

Esta carpeta está vacía a propósito. **No se movió nada** para no romper enlaces entre documentos históricos (muchos se citan por ruta, p. ej. `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`).

## Material ya considerado histórico (sigue en su lugar)
| Material | Ubicación | Por qué es histórico |
|---|---|---|
| Docs de negocio v1–v4.2 | `velarix-code/Negocio*.md`, `NEGOCIO_V4_VELARIX.md` | Superados por [[ADR-001-redefinicion-v5]] |
| Fases boutique 00–08 | `docs/velarix/fases/` | Roadmap comercial v4.2 |
| Reorientación boutique | [[REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10]] | D-09 superada |
| Bloques 1A–1D | `docs/velarix/bloque-*` | Historial de implementación |
| Auditoría jul-2026 | `docs/velarix/auditoria/` | Diagnóstico previo a v5 |
| Paquetes `.zip` de bloques | raíz de `velarix-code/` | Copias de entregas |
| `velarix-code-latest/` | dentro de `velarix-code/` | Snapshot viejo, ignorado por git (D-02) |
| PDF/DOCX originales | raíz del vault `Velarix/` | Material v1 (marzo 2026) |

## Eliminado (no archivado)
La landing comercial (`src/pages/Index.tsx`, `src/components/landing/`) se **eliminó** del código el 2026-10-15 en vez de archivarse. Se puede recuperar desde git (commit `c52f901`). Registro: [[landing]], [[ADR-006-retirar-landing-comercial]].

Si en el futuro se archiva algo aquí, primero hay que actualizar las rutas que lo citan.
