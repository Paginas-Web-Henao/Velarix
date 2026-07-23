# Fase 03 — Pilotos Controlados

## Estado

Bloqueada. Depende del cierre de Fase 01 y Fase 02.

## Objetivo

`Negocio_Velarix_v4.1.md` §18: "Validar metodología, operación, tiempo y
experiencia."

## Justificación de negocio

§16.2 (bloqueante antes del primer cliente regular) y §9.4 (revisor
externo bloqueante antes del primer cliente pagado) — ningún piloto con
datos reales de un tercero debe ejecutarse sin exactitud financiera y
seguridad mínima ya resueltas.

## Condiciones de entrada

- [ ] Fase 01 y Fase 02 cerradas.
- [ ] Revisor financiero externo identificado y disponible.
- [ ] Contrato y NDA redactados (trabajo legal, no de código — ver
      dependencia en `plan/MATRIZ-DE-DEPENDENCIAS.md`).
- [ ] Al menos 1 caso dorado interno aprobado (heredado de Fase 01).

## Alcance

No técnico en su mayoría — esta fase es de **operación y validación**, no
de código nuevo. Alcance según `Negocio_Velarix_v4.1.md` §18:
seleccionar casos autorizados, ejecutar máximo un caso a la vez, registrar
horas, registrar errores, obtener revisión externa, recoger
retroalimentación, ajustar alcance/checklist/informe, calcular costo real.

## Exclusiones

- No se automatiza nada nuevo en esta fase (registro manual, según §13.4
  del negocio: "Durante pilotos y primeros casos se puede usar una hoja
  controlada").
- No se cobra un precio final — el precio de los pilotos es provisional
  (§6.5 v4.1: "precio provisional de piloto").

## Hallazgos que resuelve

Ninguno de `plan/BACKLOG-CLASIFICADO.md` directamente — esta fase produce
evidencia operativa (horas reales, errores encontrados en un caso real)
que puede generar nuevos hallazgos a documentar en `auditoria/*` y
`plan/MATRIZ-DE-RIESGOS.md` si aparecen durante el piloto.

## Dependencias

Fase 01, Fase 02, disponibilidad del revisor financiero externo, contrato/
NDA. Ver `plan/MATRIZ-DE-DEPENDENCIAS.md`.

## Orden interno de trabajo

1. Seleccionar el primer caso piloto (criterios de rechazo de
   `Negocio_Velarix_v4.1.md` §15.4 aplican desde el primer piloto, no solo
   para clientes pagados).
2. Ejecutar el flujo completo con datos reales, registrando cada hora
   manualmente.
3. Revisión externa del resultado antes de entregar cualquier cosa al
   piloto.
4. Recoger retroalimentación, documentar errores encontrados.
5. Repetir con un segundo piloto antes de cerrar la fase.

## Archivos o componentes potencialmente afectados

Ninguno predecible de antemano — dependerá de qué errores aparezcan en un
caso real que la Fase 01 no haya cubierto con sus casos dorados
sintéticos. Documentar cualquier archivo tocado en el reporte de
implementación.

## Cambios de base de datos potenciales

Ninguno planeado. Si un piloto revela la necesidad de un campo nuevo, se
documenta como hallazgo antes de migrar, no se improvisa en producción.

## Riesgos

- Ejecutar un piloto con datos reales de un tercero antes de que Fase 01/02
  estén realmente cerradas (no solo "casi cerradas") — riesgo reputacional
  y de exactitud real, no hipotético.
- Prometer tiempos al piloto sin haber medido antes (§16.3, "tiempo por
  proyecto" es explícitamente una hipótesis pendiente, no un dato).

## Pruebas obligatorias

Las de Fase 01 ya deben estar pasando. No se agregan pruebas automatizadas
nuevas en esta fase salvo que un error del piloto revele un caso no
cubierto — en ese caso, se agrega como caso de regresión antes de cerrar
la fase.

## Casos de regresión

Cualquier error encontrado durante el piloto que no estuviera ya cubierto
por los casos dorados de Fase 01 debe convertirse en un caso de regresión
nuevo antes de cerrar esta fase.

## Criterios de aceptación

`Negocio_Velarix_v4.1.md` §18, Fase 3: "al menos dos pilotos completos y
una decisión informada sobre precio y oferta."

## Evidencias requeridas

Registro de horas reales (hoja controlada), retroalimentación documentada
de cada piloto, aprobación del revisor externo sobre el resultado de cada
piloto, costo real calculado.

## Plan de rollback

No aplica en el sentido técnico — si un piloto revela un error grave, se
detiene ese piloto específico, se corrige (volviendo a Fase 01 si es
necesario), y se repite. No se "revierte" un piloto ya entregado; se
documenta la lección y se corrige antes del siguiente.

## Condiciones de detención

- Si el revisor externo no aprueba el resultado de un piloto, no se
  entrega al cliente piloto — se corrige primero.
- Si aparece un error de exactitud financiera no cubierto por Fase 01, se
  detiene esta fase y se vuelve a Fase 01 para ese hallazgo específico.

## Checklist de cierre

- [ ] Mínimo 2 pilotos completos.
- [ ] Horas reales medidas y documentadas.
- [ ] Revisión financiera externa de cada piloto.
- [ ] Retroalimentación recogida y documentada.
- [ ] Decisión informada sobre precio (alimenta Fase 4, no se fija aún
      como definitivo).
- [ ] Reporte de implementación completado.

## Plantilla del reporte de implementación

Ver plantilla en `fases/FASE-00-CIERRE-DE-AUDITORIA.md`.
