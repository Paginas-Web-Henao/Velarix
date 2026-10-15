---
tipo: pendientes
actualizado: 2026-10-15
tags: [velarix, pendientes]
---

# Pendientes

Volver a [[00-home]] · Roadmap: [[10-roadmap]] · Bugs y limitaciones: [[12-bugs]]

Solo trabajo derivado del alcance congelado v5.0 o de hechos verificables en el repo. No hay TODO/FIXME en el código (búsqueda del 2026-10-15).

## Caso Alpina (prioridad 1)

- [ ] Confirmar si Alpina ya se ejecutó por `ejecutar-calculo` contra Supabase o solo dentro de Vitest. → [[caso-alpina]]
- [ ] Ítems case-dependent de [[05-financial-engine-audit]] §12 (RC-4, horizonte, bridge, realización fiscal).
- [ ] Definir el alcance del SOTP mencionado en `alpina-2024.*` (análisis separado del parent DCF).
- [ ] Versionar o referenciar la evidencia de Alpina (fases 4B–4F): los archivos `alpina-2024.*` declaran que es un "artefacto histórico no versionado dentro de este repositorio". → [[caso-alpina]]
- [ ] Suite mínima de sensibilidades P-12 completa (hoy: matriz WACC × g y overlays de `g` en escenarios).

## Demo (prioridad 2)

- [x] Quitar el gate de login del Estimador y servirlo en `/` (2026-10-15, sin commit). → [[ADR-006-retirar-landing-comercial]]
- [ ] Decidir explícitamente si el Estimador refleja las correcciones del motor canónico o queda como pieza aislada más simple ([[01-scope-surgery]] §8.5).

## Cierre (prioridad 3)

- [x] README reescrito con el framing v5.0 (2026-10-15, sin commit).
- [x] Landing comercial eliminada (2026-10-15, sin commit). → [[landing]]
- [ ] Hacer commit de los cambios del 2026-10-15 (landing, Estimador, README, docs).
- [ ] Revisar textos que quedan con tono comercial fuera de la landing: subtítulo "Inteligencia financiera institucional" en `src/pages/Auth.tsx` y título "Checklist de Lanzamiento" en `QAChecklist.tsx`. Solo se anotan; no se cambiaron.
- [ ] Archivar `Negocio.md`, `Negocio_Velarix_v4.1.md`, `Negocio_Velarix_v4.2.md`, `NEGOCIO_V4_VELARIX.md` (raíz de `velarix-code/`) tras desenganchar sus referencias desde [[EXPEDIENTE-DE-VALORACION-V1]].
- [ ] Writeup/arquitectura final.

## Decisiones abiertas

- [ ] ¿`analyst`/`admin` siguen siendo el modelo de actor o colapsan a un único actor? ([[01-scope-surgery]] §1, [[07-autenticacion]])
- [ ] O-01 perímetro de consolidación / NCI / asociadas; O-02 umbral de materialidad ([[03-methodology-decisions-v5]] Capa C).

## Mantenimiento técnico (no bloqueante, no ampliar alcance)

- [ ] Regenerar `src/integrations/supabase/types.ts` (le faltan las 4 tablas del Expediente). → [[12-bugs]] BUG-02
- [ ] `quickValuation` (`src/lib/financial-engine.ts`) quedó sin uso en producción tras borrar la landing; solo lo cubre un test de caracterización. Decidir si se conserva.
- [ ] Ordenar archivos sueltos de la raíz de `velarix-code/`: 10 `.zip` de bloques históricos. **No se movieron** — ver [[obsidian-guia]] §"Cosas que no se tocaron".
