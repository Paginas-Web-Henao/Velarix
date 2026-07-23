# docs/velarix/ — Auditoría técnica y plan de gobierno

## Propósito de esta carpeta

Documentar, con evidencia verificable contra el repositorio real, el estado
técnico actual de Velarix; identificar riesgos, contradicciones y deuda; y
ordenar el trabajo pendiente por dependencias y fases — de forma que
cualquier sesión futura (de Claude Code o de una persona) pueda continuar
sin depender del historial de chat que generó esta auditoría.

Esta carpeta es un documento vivo de **gobierno técnico**. No es la fuente
de verdad del negocio (ver siguiente sección) ni reemplaza el juicio de un
revisor financiero, legal o de seguridad humano.

## Fuente de verdad de negocio

El documento maestro de negocio es:

**`/Users/nicohenao/Documents/Velarix/velarix-code/Negocio_Velarix_v4.1.md`**

Toda decisión de producto, alcance, precio o prioridad se valida contra ese
documento, no contra este. Si algo en `docs/velarix/` contradice
`Negocio_Velarix_v4.1.md`, gana `Negocio_Velarix_v4.1.md` — se corrige la
documentación técnica, no la de negocio (regla de autoridad, §0 de ese
documento).

**Nota de estado del repositorio (hallazgo, no decisión):** al momento de
esta auditoría existen **tres** archivos de definición de negocio en la
raíz del repo con contenido distinto: `Negocio.md` (v3, comprometido en el
commit `ecb20a9 "V1.0"`, superado), `NEGOCIO_V4_VELARIX.md` (v4, superado
por v4.1) y `Negocio_Velarix_v4.1.md` (v4.1, la versión que se usó como
fuente de verdad para toda esta auditoría). No se movieron, renombraron ni
eliminaron estos archivos porque esa acción no estaba autorizada en el
alcance de esta tarea. Se recomienda que el fundador consolide manualmente
a un solo archivo cuando lo considere oportuno.

## Estado de la auditoría

| Campo | Valor |
|---|---|
| Fecha | 2026-07-22 |
| Commit de Git auditado | `ecb20a9` (rama `main`, 1 commit por delante de `origin/main`, sin push) |
| Estado de `git status --short` al iniciar | 2 archivos sin trackear: `NEGOCIO_V4_VELARIX.md`, `Negocio_Velarix_v4.1.md` (documentos de negocio, no tocados) |
| Modificaciones realizadas al código fuente | Ninguna |
| Modificaciones realizadas fuera de `docs/velarix/` | Ninguna |
| Alcance ejecutado | Fase 0 — Revisión del negocio y del estado real (auditoría documental únicamente) |
| Validaciones técnicas ejecutadas | `git status`, `npm run lint`, `npx tsc --build --noEmit`, `npm test`, `npx vite build` (ver `auditoria/06-CALIDAD-CODIGO-Y-PRUEBAS.md`) |
| Subagentes de solo lectura usados | 6 (arquitectura, motor financiero, seguridad, frontend, infraestructura, calidad de código) — ver cada archivo de `auditoria/` para el frente correspondiente |

## Orden recomendado de lectura

1. `auditoria/00-RESUMEN-EJECUTIVO.md` — punto de partida, decisión listo/no listo.
2. `auditoria/04-CALIDAD-FINANCIERA.md` — el frente más crítico del negocio.
3. `auditoria/11-CONTRADICCIONES-NEGOCIO-CODIGO.md` — dónde el código no cumple lo que el negocio exige.
4. `auditoria/05-SEGURIDAD-DATOS-RLS.md` — bloqueantes de seguridad.
5. Resto de `auditoria/*` según interés (arquitectura, flujos, frontend, infraestructura, calidad de código, rendimiento, deuda técnica).
6. `plan/PLAN-MAESTRO.md` → `plan/MATRIZ-DE-RIESGOS.md` → `plan/MATRIZ-DE-DEPENDENCIAS.md` → `plan/ROADMAP.md`.
7. `fases/FASE-00-CIERRE-DE-AUDITORIA.md` en adelante, en orden, solo cuando se autorice implementación.

## Convención de estados (idéntica a `Negocio_Velarix_v4.1.md` §0, extendida para hallazgos técnicos)

| Estado | Significado |
|---|---|
| `VERIFICADO` | Comprobado directamente contra código, migración o comando ejecutado, con cita de archivo/línea. |
| `INFERIDO` | Conclusión razonable a partir de evidencia parcial; no se pudo confirmar de forma directa. |
| `NO VERIFICABLE` | Falta acceso, configuración o información para confirmar o descartar. |
| `CONTRADICCIÓN` | El código no coincide con `Negocio_Velarix_v4.1.md` o dos partes del código se contradicen entre sí. |
| `RIESGO` | Puede producir error, pérdida de datos, exposición o resultado incorrecto. |
| `DEUDA` | No bloquea hoy, pero dificulta mantenimiento o aumenta el riesgo con el tiempo. |
| `PREMATURO` | Funcionalidad construida antes de validar su necesidad real. |
| `OBSOLETO` | Aparentemente ya no participa en ningún flujo real; **no se elimina** solo por esta auditoría. |
| `BLOQUEANTE` | Impide pilotos, recepción de datos reales o cobro, según `Negocio_Velarix_v4.1.md` §17. |

## Reglas para actualizar esta documentación

- Todo hallazgo nuevo debe citar archivo + línea (o comando + resultado) — nunca "se sospecha que…" sin evidencia.
- No se reclasifica un hallazgo de `RIESGO`/`BLOQUEANTE` a resuelto sin una prueba que lo demuestre (no basta con "ya se corrigió", debe existir el caso de regresión pasando).
- No se implementan varias fases simultáneamente. Cada fase de `fases/FASE-XX-*.md` se cierra (checklist de cierre) antes de abrir la siguiente, salvo excepción explícita documentada en `plan/REGISTRO-DE-DECISIONES.md`.
- Ninguna hipótesis de negocio (`🧪` en `Negocio_Velarix_v4.1.md`) se convierte en requisito técnico confirmado dentro de esta carpeta sin que el documento de negocio la haya movido primero a `✅ Confirmado`.
- Los archivos de esta carpeta son Markdown únicamente. No se modifica código desde aquí — un hallazgo documentado no es una autorización para corregirlo.

## Prohibición explícita

No se implementa la Fase 1 (ni ninguna otra) como consecuencia de esta
auditoría sin una autorización explícita y separada del fundador, tal como
exige `Negocio_Velarix_v4.1.md` §19, regla 1: *"Claude Code no debe
interpretar el texto como autorización automática para implementar."*
