# Fase 08 — Escalamiento

## Estado

Bloqueada. Depende del cierre de Fase 07.

## Objetivo

`Negocio_Velarix_v4.1.md` §18: "Aumentar capacidad sin reducir calidad."

## Justificación de negocio

Toda expansión de capacidad (más analistas, más clientes simultáneos) sin
haber resuelto exactitud (Fase 1) y seguridad (Fase 2) multiplicaría el
impacto de cualquier hallazgo no resuelto — por eso esta fase es
explícitamente la última.

## Condiciones de entrada

- [ ] Fase 07 cerrada.
- [ ] Demanda real que justifique más capacidad que la de un operador
      único (condición de negocio, no técnica — no se inventa aquí).

## Alcance

Contratar analistas (rol ya modelado técnicamente desde Fase 02, BL-09),
formalizar el proceso de revisión para más de una persona, separar
funciones, mejorar control de calidad, definir entrenamiento, implementar
permisos por asignación (extensión de BL-09 para múltiples analistas
concurrentes, no solo uno), aumentar precios según reputación (dato que
depende de Fase 06, no se fija aquí), evaluar nuevos segmentos (los
diferidos en §3.4 del negocio — evaluación explícita, no activación
automática).

## Exclusiones

No se activa ningún segmento diferido (§3.4) ni caso de uso secundario
(§4.2) sin que el negocio lo confirme explícitamente primero, moviendo
esa hipótesis a `✅ Confirmado` en una revisión futura de
`Negocio_Velarix_v4.1.md`.

## Hallazgos que resuelve

Ninguno directo del backlog original — esta fase extiende BL-09 (control
de rol) a un escenario de múltiples analistas reales, que hoy no existe.

## Dependencias

Fase 07 cerrada; demanda real confirmada; decisión de negocio sobre qué
segmentos/casos de uso nuevos evaluar, si alguno.

## Orden interno de trabajo

1. Confirmar que la demanda real (no proyectada) justifica contratar.
2. Extender el modelo de rol (BL-09) para permisos por asignación entre
   varios analistas, no solo uno.
3. Definir y documentar el proceso de entrenamiento/onboarding de un
   analista nuevo.
4. Evaluar, uno a la vez, si algún segmento diferido tiene sentido ahora
   — sin comprometerse a activarlo solo por evaluarlo.

## Archivos o componentes potencialmente afectados

Extensión de las políticas RLS de `manual_reviews` y de la lógica de
asignación (hoy inexistente) para soportar más de un `analyst`
concurrente.

## Cambios de base de datos potenciales

Posible tabla de asignación explícita analista↔análisis si el volumen lo
justifica (hoy no existe ninguna lógica de asignación automática,
confirmado en la auditoría).

## Riesgos

Escalar el equipo antes de que el proceso esté realmente probado en
repetición (Fase 06) — diluye calidad exactamente donde el negocio ya
identificó su mayor riesgo (§10.1: "entregar un resultado convincente
pero equivocado" se vuelve más probable con más gente sin el control ya
maduro).

## Pruebas obligatorias

Pruebas de la extensión de permisos por asignación (que un analista no
vea/apruebe casos no asignados a él).

## Casos de regresión

Los ya existentes de Fase 01/02 siguen aplicando; se agregan los
específicos de la nueva lógica de asignación.

## Criterios de aceptación

`Negocio_Velarix_v4.1.md` §18 no define un criterio de salida único para
Fase 8 más allá del objetivo mismo ("aumentar capacidad sin reducir
calidad") — se interpreta como: capacidad aumentada, medida por
proyecto/mes, sin que la tasa de errores por proyecto (medida desde Fase
03) empeore.

## Evidencias requeridas

Métricas de calidad por proyecto antes/después de escalar el equipo.

## Plan de rollback

Si la calidad medida empeora al escalar, se detiene la contratación
adicional hasta corregir el proceso, no se sigue contratando "para
compensar".

## Condiciones de detención

Cualquier señal de que la calidad (tasa de errores, satisfacción,
revisión externa) empeora al agregar capacidad.

## Checklist de cierre

Esta fase, por diseño, no tiene un "cierre" definitivo — es el estado
estable de operación continua del negocio maduro. Se documenta como
cerrada cuando el fundador decida que el modelo de escalamiento ya está
funcionando de forma sostenida (criterio a definir por el negocio, no
inventado aquí).

## Plantilla del reporte de implementación

Ver plantilla en `fases/FASE-00-CIERRE-DE-AUDITORIA.md`.
