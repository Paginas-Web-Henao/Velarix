# Fase 07 — Automatización Selectiva

## Estado

Bloqueada. Depende del cierre de Fase 06 (repetición demostrada, no solo
deseada).

## Objetivo

`Negocio_Velarix_v4.1.md` §18: "Automatizar solo tareas ya validadas."

## Justificación de negocio

§13.3 del negocio difiere explícitamente: sistema completo de retainers,
time entries avanzados, pagos automáticos, múltiples analistas,
asignación inteligente, dashboards complejos, suscripciones, planes,
facturación automática, autoservicio total, marketplace, app móvil — "No
construir todavía, salvo necesidad demostrada."

## Condiciones de entrada

- [ ] Fase 06 cerrada (3+ proyectos repetibles).
- [ ] Para cada automatización candidata: el problema ocurre
      repetidamente (no una vez) y el ahorro esperado justifica el costo
      y riesgo — condición de entrada explícita de `Negocio_Velarix_v4.1.md`
      §18, Fase 7.

## Alcance

Condicional, evaluado ítem por ítem, no como paquete:

- BL-23 — Code-splitting del bundle (rendimiento, bajo riesgo, puede
  evaluarse independientemente del resto — no depende de demanda
  comercial, solo del plan de medición de `auditoria/09`).
- Retainers/time entries — **solo si** la Fase 06 demuestra que el
  registro manual en hoja de cálculo (§13.4 del negocio) ya es un cuello
  de botella real, medido, no supuesto.
- Notificaciones adicionales, asignación de analistas — **solo si** existe
  más de un analista activo (condición de negocio, no solo técnica).
- Actualización automática de datos macro (cron real para
  `update-snapshots`/`check-data-freshness`) — condicional a que BL-17
  (Fase 1) ya haya conectado esos datos al motor de cálculo; automatizar
  una fuente que el motor no lee sería repetir el problema ya encontrado
  en esta auditoría.

## Exclusiones

No se automatiza nada que no tenga ya evidencia de necesidad repetida en
Fase 06. No se construye autoservicio total (contradice §2.3 del negocio
en esta etapa).

## Hallazgos que resuelve

BL-23 (condicional). El resto depende de qué necesidad demuestre Fase 06
— no se puede predecir aquí sin inventar datos no verificables.

## Dependencias

Fase 06 cerrada. BL-17 (Fase 1) para la automatización de datos macro
específicamente.

## Orden interno de trabajo

1. Revisar qué fricciones de Fase 06 tienen evidencia de recurrencia real.
2. Priorizar por ahorro esperado vs. costo/riesgo de construir (mismo
   criterio P0-P3 de `plan/PLAN-MAESTRO.md`, aplicado aquí a
   automatización en vez de corrección de bugs).
3. Implementar una automatización a la vez, con su propio criterio de
   éxito medible antes/después.

## Archivos o componentes potencialmente afectados

Depende de qué automatización se decida — no se puede predecir con
evidencia verificable en este momento. Documentar en el reporte de
implementación de cada automatización específica.

## Cambios de base de datos potenciales

Si se autoriza un sistema de retainers/time entries, ver el diseño ya
esbozado (con otro alcance, en versiones anteriores de este trabajo) como
referencia, pero no como especificación final — debe rediseñarse contra
la necesidad real medida en Fase 06, no contra una suposición previa.

## Riesgos

El riesgo central de esta fase es el opuesto al resto de la auditoría:
construir de más, antes de tiempo — exactamente el patrón que
`Negocio_Velarix_v4.1.md` §13.1 busca evitar ("la arquitectura se
construye para soportar el servicio, no para simular escala antes de
tener demanda").

## Pruebas obligatorias

Cada automatización nueva requiere sus propias pruebas — no hay una lista
genérica válida aquí sin conocer qué se construye.

## Casos de regresión

Definidos por cada automatización específica al momento de implementarla.

## Criterios de aceptación

`Negocio_Velarix_v4.1.md` §18, Fase 7: condición de entrada = "el
problema ocurre repetidamente y el ahorro esperado justifica el costo y
riesgo" — este es también el criterio de aceptación para cada ítem
individual de esta fase, no solo para abrirla.

## Evidencias requeridas

Medición del problema antes de automatizar, medición del resultado
después.

## Plan de rollback

Cada automatización debe ser reversible a un proceso manual si falla —
no reemplazar el proceso manual hasta confirmar que la automatización
funciona en al menos un ciclo real.

## Condiciones de detención

Si no hay evidencia clara de recurrencia para un ítem candidato, no se
construye — se deja documentado como candidato para revisar cuando exista
más evidencia, no se fuerza.

## Checklist de cierre

- [ ] Cada automatización implementada tiene medición antes/después.
- [ ] Ninguna automatización reemplaza un proceso manual sin haber
      funcionado en al menos un ciclo real.
- [ ] Reporte de implementación completado por cada automatización.

## Plantilla del reporte de implementación

Ver plantilla en `fases/FASE-00-CIERRE-DE-AUDITORIA.md`.
