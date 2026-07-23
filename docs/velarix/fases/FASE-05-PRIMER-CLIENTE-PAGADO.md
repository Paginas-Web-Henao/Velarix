# Fase 05 — Primer Cliente Pagado

## Estado

Bloqueada. Depende del cierre de Fase 04.

## Objetivo

`Negocio_Velarix_v4.1.md` §18: "Validar la entrega comercial completa."

## Justificación de negocio

Es la primera vez que todo el sistema (producto, precio, contrato,
seguridad, exactitud) se prueba junto con dinero real de por medio. Todos
los criterios de §17 (Criterios para cobrar) deben estar satisfechos, no
solo los de exactitud/seguridad de las Fases 1-2.

## Condiciones de entrada

- [ ] Fase 04 cerrada.
- [ ] Checklist completo de `Negocio_Velarix_v4.1.md` §17.1 y §17.2
      satisfecho (no repetido aquí — es la fuente de verdad, no se
      duplica en este archivo).

## Alcance

Aceptar un proyecto permitido (según criterios de rechazo §15.4), firmar
documentos, cobrar anticipo, ejecutar el proceso completo (Fase 5 en
`Negocio_Velarix_v4.1.md` §11.3), revisión externa, entrega, medir margen
real, documentar lecciones, obtener testimonio si procede.

## Exclusiones

No se automatiza nada nuevo. No se acepta ningún caso de los excluidos en
§4.3 del negocio, sin importar la presión comercial de "ya viene un
cliente".

## Hallazgos que resuelve

Ninguno directo de `plan/BACKLOG-CLASIFICADO.md` — valida que las Fases
1-4 realmente funcionan con un caso real y dinero real, no solo en
pilotos controlados.

## Dependencias

Fase 04 cerrada; §17 del negocio satisfecho en su totalidad.

## Orden interno de trabajo

Idéntico al flujo 11.3 de `Negocio_Velarix_v4.1.md`: precalificación →
propuesta → NDA y contrato → anticipo → onboarding → carga de documentos
→ validación → parseo → mapping → revisión manual de mapping →
structured input → cálculo determinístico → revisión de supuestos →
narrativa asistida por IA → revisión humana completa → revisión externa →
control de calidad → informe → reunión → corrección incluida → cierre.

## Archivos o componentes potencialmente afectados

Ninguno de código, salvo que este primer cliente real revele un hallazgo
no cubierto por las fases anteriores — en ese caso, se documenta y se
vuelve a la fase correspondiente (probablemente Fase 01) antes de
continuar con este cliente.

## Cambios de base de datos potenciales

Ninguno planeado — este es el primer uso real de la infraestructura ya
construida y corregida en fases anteriores.

## Riesgos

Que aparezca, con datos reales de un cliente pagado, un hallazgo que los
casos dorados sintéticos de Fase 01 no cubrieron. Es exactamente el tipo
de riesgo que los 2 pilotos de Fase 03 buscan reducir, pero no eliminan
del todo.

## Pruebas obligatorias

Todas las de Fase 01 deben seguir pasando antes de iniciar este proyecto.

## Casos de regresión

Cualquier hallazgo nuevo de este cliente real se convierte en caso de
regresión antes de cerrar esta fase, igual que en Fase 03.

## Criterios de aceptación

`Negocio_Velarix_v4.1.md` §18, Fase 5: "proyecto cerrado, pagado,
documentado y sin incidentes críticos."

## Evidencias requeridas

Contrato firmado, anticipo cobrado, revisión externa documentada, informe
entregado, margen real calculado, lecciones documentadas.

## Plan de rollback

Si durante la ejecución aparece un hallazgo crítico no resuelto, se
detiene la entrega a este cliente (no se entrega un informe con error
conocido), se corrige, y se retoma. No hay "rollback" de un cobro ya
hecho salvo que el negocio decida un reembolso — decisión explícita del
fundador, no automática.

## Condiciones de detención

Cualquiera de las condiciones de §17 del negocio deja de cumplirse
durante el proceso (ej. una prueba de regresión empieza a fallar tras un
cambio no relacionado) — se detiene la entrega hasta resolverlo.

## Checklist de cierre

- [ ] Proyecto cerrado y pagado.
- [ ] Sin incidentes críticos.
- [ ] Margen real medido.
- [ ] Lecciones documentadas (alimentan Fase 6).
- [ ] Reporte de implementación completado.

## Plantilla del reporte de implementación

Ver plantilla en `fases/FASE-00-CIERRE-DE-AUDITORIA.md`.
