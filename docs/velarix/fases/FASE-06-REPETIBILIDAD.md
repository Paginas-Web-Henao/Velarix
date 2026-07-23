# Fase 06 — Repetibilidad

## Estado

Bloqueada. Depende del cierre de Fase 05.

## Objetivo

`Negocio_Velarix_v4.1.md` §18: "Demostrar que el servicio puede
repetirse."

## Justificación de negocio

Un solo cliente pagado no demuestra un negocio — demuestra que el
producto puede funcionar una vez. Esta fase exige repetición con menos
retrabajo cada vez.

## Condiciones de entrada

- [ ] Fase 05 cerrada (primer cliente pagado, sin incidentes críticos).
- [ ] Lecciones de Fase 05 documentadas y revisadas.

## Alcance

Estandarizar plantillas (propuesta, checklist, informe), reducir
retrabajo identificado en clientes anteriores, mejorar onboarding, medir
conversión real, construir alianzas (canales de §3.3 del negocio,
condicional a que la hipótesis de canal se valide), consolidar casos,
ajustar precios con más datos, definir capacidad mensual real.

## Exclusiones

No se contrata personal nuevo en esta fase (Fase 8, condicional a
demanda). No se automatiza cobro salvo que el volumen ya lo justifique
claramente (entonces se abre Fase 7 en paralelo, con justificación
explícita).

## Hallazgos que resuelve

Ninguno directo del backlog original — esta fase resuelve fricciones
descubiertas en Fase 05 y en clientes adicionales.

## Dependencias

Fase 05 cerrada; al menos 3 proyectos completados para poder declarar
"repetible" (criterio de salida explícito abajo).

## Orden interno de trabajo

1. Ejecutar el segundo y tercer cliente pagado, aplicando las mejoras de
   plantillas/onboarding entre cada uno.
2. Medir retrabajo y tiempo por proyecto en cada iteración.
3. Ajustar precio con base en 3+ casos reales, no solo los 2 pilotos.
4. Documentar capacidad mensual real sostenible (antes hipótesis en §21
   del negocio, ahora con datos).

## Archivos o componentes potencialmente afectados

Ninguno de código previsto — a menos que el retrabajo identificado sea
técnico (ej. un paso manual que debería automatizarse), en cuyo caso ese
ítem específico pasa a `plan/BACKLOG-CLASIFICADO.md` como candidato de
Fase 7, no se implementa dentro de esta fase sin evaluar la condición de
entrada de Fase 7.

## Cambios de base de datos potenciales

Ninguno previsto.

## Riesgos

Repetir sin medir — si no se mide tiempo/retrabajo real en cada proyecto,
esta fase se vuelve subjetiva ("se siente más fácil") en vez de basada en
evidencia, contradiciendo el estándar del resto de esta auditoría.

## Pruebas obligatorias

No aplica en sentido de pruebas automatizadas de código, salvo que un
cliente adicional revele un caso nuevo (mismo tratamiento que en Fase 03/05).

## Casos de regresión

Igual que en fases anteriores: cualquier hallazgo nuevo se convierte en
caso de regresión.

## Criterios de aceptación

`Negocio_Velarix_v4.1.md` §18, Fase 6: "tres o más proyectos consistentes
y margen aceptable."

## Evidencias requeridas

Plantillas estandarizadas, métricas de conversión y retrabajo por
proyecto, margen por proyecto, capacidad mensual documentada con datos.

## Plan de rollback

No aplica en sentido técnico.

## Condiciones de detención

Si el margen no mejora o empeora con la repetición (señal de que el
precio o el proceso todavía no son sostenibles), se detiene el avance a
Fase 7/8 y se vuelve a ajustar precio/proceso dentro de esta misma fase.

## Checklist de cierre

- [ ] 3+ proyectos completados y documentados.
- [ ] Margen aceptable confirmado con datos.
- [ ] Plantillas estandarizadas.
- [ ] Capacidad mensual real documentada.
- [ ] Reporte de implementación completado.

## Plantilla del reporte de implementación

Ver plantilla en `fases/FASE-00-CIERRE-DE-AUDITORIA.md`.
