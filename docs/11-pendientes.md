---
tipo: pendientes
actualizado: 2026-10-15
tags: [velarix, pendientes]
---

# Pendientes

Volver a [[00-home]] · Roadmap: [[10-roadmap]] · Bugs y limitaciones: [[12-bugs]]

Solo trabajo derivado del alcance congelado v5.0 o de hechos verificables en el repo. No hay TODO/FIXME en el código (búsqueda del 2026-10-15).

## Caso Alpina (prioridad 1)

- [x] Alpina materializada en Supabase como primer caso operativo (2026-10-15, `npm run materialize:alpina`). → [[cases/alpina/00-case-home|Alpina]]
- [x] `ejecutar-calculo` remoto sincronizado con el repo (v14, 2026-10-15; la v13 era pre-v5). → [[14-deploy]]
- [ ] Verificar el drift repo↔remoto de las otras 11 Edge Functions (desplegadas en agosto, antes del v5).
- [x] Alpina ejecutada por `ejecutar-calculo` y verificada contra el congelado (2026-10-15; 0 diferencias reales). Antes: `npm run materialize:alpina -- --calculate` (compara sin tolerancia con el resultado congelado). → [[caso-alpina]]
- [ ] Workbench → Judgment y Evidence solo muestran datos desde un cálculo persistido; antes de calcular aparecen vacíos aunque `structured_inputs` ya tenga los 13 supuestos.
- [x] Metadata estructurado del caso + estados de provenance + bloque de verificación oficial en el workbench (2026-10-15, migración `20261015180000`).
- [x] C-11: wording desacoplado del CRP fechado (versión superseded conservada).
- [x] Cross-check g/ROC terminal de Alpina: TERMINAL REINVESTMENT CHECK = PASS. C-07.1 se reclasificó como validación de CALCULATION; la fila se conserva.
- [ ] P-12: suite adicional de challenge de un factor (marcada NOT IMPLEMENTED en Challenge).
- [ ] Ítems case-dependent de [[05-financial-engine-audit]] §12 (RC-4, horizonte, bridge, realización fiscal).
- [ ] Definir el alcance del SOTP mencionado en `alpina-2024.*` (análisis separado del parent DCF).
- [ ] Versionar o referenciar la evidencia de Alpina (fases 4B–4F): los archivos `alpina-2024.*` declaran que es un "artefacto histórico no versionado dentro de este repositorio". → [[caso-alpina]]
- [ ] Suite mínima de sensibilidades P-12 completa (hoy: matriz WACC × g y overlays de `g` en escenarios).

## Workbench (prioridad 2)

- [x] App privada: `/` → `/workbench` o `/auth`; sin demo pública (rama `personal-workbench`). → [[ADR-007-personal-valuation-workbench]]
- [ ] Revisar el workbench con datos reales de Supabase (solo se probó con mocks y con el envelope de Alpina en tests).
- [ ] Decidir si el [[quick-model]] se conserva, refleja el motor canónico o se retira. Unificar sigue siendo `NOT BUILDING`.
- [ ] Desplegar el frontend y la Edge Function `enviar-notificacion` (cambiaron copy y enlaces) tras el merge.
- [ ] Desactivar los signups en Supabase Auth (ajuste remoto).
- [x] Single-owner private mode: sin login en el flujo normal; Auth + RLS conservados. → [[ADR-008-single-owner-private-mode]]
- [ ] Añadir `VELARIX_OWNER_EMAIL` / `VELARIX_OWNER_PASSWORD` a `.env.local` y confirmar que la cuenta owner tiene `role = 'admin'` (Settings lo muestra).
- [ ] Deuda: roles `user/analyst/admin` y regla de no auto-aprobación siguen en BD y `authorization.ts`; dueño único puro = opción B de [[ADR-007-personal-valuation-workbench]] (migración remota, requiere confirmación).

## Cierre (prioridad 3)

- [x] README reescrito como workbench personal (2026-10-15).
- [x] Landing comercial eliminada (2026-10-15, sin commit). → [[landing]]
- [x] Commits locales en la rama `personal-workbench` (sin push ni merge).
- [x] Copy comercial retirado de Auth, QA, PDF, emails e `index.html` ([[personal-workbench-surgery-2026-10-15]]).
- [ ] Prompt de `generate-narrative` con framing "institucional / usuarios de negocio": requiere decisión (benchmark congelado).
- [ ] Archivar `Negocio.md`, `Negocio_Velarix_v4.1.md`, `Negocio_Velarix_v4.2.md`, `NEGOCIO_V4_VELARIX.md` (raíz de `velarix-code/`) tras desenganchar sus referencias desde [[EXPEDIENTE-DE-VALORACION-V1]].
- [ ] Writeup/arquitectura final.

## Decisiones abiertas

- [ ] ¿`analyst`/`admin` siguen siendo el modelo de actor o colapsan a un único actor? ([[01-scope-surgery]] §1, [[07-autenticacion]])
- [ ] O-01 perímetro de consolidación / NCI / asociadas; O-02 umbral de materialidad ([[03-methodology-decisions-v5]] Capa C).

## Mantenimiento técnico (no bloqueante, no ampliar alcance)

- [x] `types.ts` con las tablas del Expediente (a mano, desde la migración). Regenerar con el CLI cuando haya acceso, para confirmar que no hay drift.
- [ ] `quickValuation` (`src/lib/financial-engine.ts`) quedó sin uso en producción tras borrar la landing; solo lo cubre un test de caracterización. Decidir si se conserva.
- [ ] Ordenar archivos sueltos de la raíz de `velarix-code/`: 10 `.zip` de bloques históricos. **No se movieron** — ver [[obsidian-guia]] §"Cosas que no se tocaron".
- [x] Raíz única `velarix-code/` (vault + repo + evidence + assets), 2026-10-15.
- [ ] Decidir si los PDF/DOCX v1 de `docs/archive/source-material/` entran a git (depende de si el repo remoto es privado).
- [ ] Borrar `Velarix/_quarantine-2026-10-15/` (lockfile accidental, archivo `~$` de Word, backups de `.obsidian` y del registro de Obsidian) cuando confirmes que todo funciona.
