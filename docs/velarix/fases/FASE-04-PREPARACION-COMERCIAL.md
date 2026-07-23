# Fase 04 — Preparación Comercial

## Estado

Bloqueada. Depende del cierre de Fase 03 (mínimo 2 pilotos completos).

## Objetivo

`Negocio_Velarix_v4.1.md` §18: "Poder vender con claridad y control."

## Justificación de negocio

§15.1 (bloqueante antes del lanzamiento comercial): sin descripción clara
del servicio, propuesta comercial, NDA, contrato, checklist de
documentos, política de correcciones, FAQ, etc., no hay forma de vender
sin improvisar cada vez.

## Condiciones de entrada

- [ ] Fase 03 cerrada (2+ pilotos, precio informado por datos reales).
- [ ] Revisión legal disponible para NDA/contrato definitivos (más allá
      de las versiones usadas en pilotos).

## Alcance

- BL-22 — Ajustar copy de landing (retirar "Metodología auditada" sin
  respaldo; comunicar la revisión humana obligatoria).
- Definir precio final y descuento máximo (§6.4, §6.5 del negocio —
  hipótesis que se resuelve aquí con los datos de Fase 03, no antes).
- Crear activos comerciales: propuesta, muestra anonimizada, formulario de
  precalificación, checklist de documentos, FAQ, perfil del fundador,
  información del revisor externo, proceso de seguridad resumido para el
  cliente.
- Definir proceso de onboarding y de cierre comercial.
- Definir criterios de rechazo operativos (ya existen en §15.4 del
  negocio; aquí se traducen a un checklist de precalificación usable).

## Exclusiones

No se automatiza el cobro en esta fase (Fase 5, condicional a volumen). No
se contrata personal adicional aquí (Fase 8).

## Hallazgos que resuelve

BL-22. El resto de esta fase es trabajo comercial/legal, no backlog
técnico de esta auditoría.

## Dependencias

Precio informado por Fase 03 (no antes — sería inventar un dato no
validado, prohibido explícitamente por las reglas de esta auditoría).

## Orden interno de trabajo

1. Definir precio y descuento máximo con los datos de los pilotos.
2. Ajustar copy de landing (BL-22) para que sea consistente con el
   precio y el posicionamiento reales.
3. Crear el resto de activos comerciales.
4. Definir proceso de onboarding/cierre.
5. Probar el proceso comercial completo con un lead ficticio antes de
   usarlo con un cliente real (dry-run).

## Archivos o componentes potencialmente afectados

`src/components/landing/*` (copy), posible página nueva de precalificación
si se decide que viva en el producto (condicional — hoy no existe y no se
asume que deba existir sin decisión explícita).

## Cambios de base de datos potenciales

Ninguno previsto. Si se decide construir un formulario de precalificación
persistente, evaluar como hallazgo nuevo antes de migrar.

## Riesgos

Fijar un precio antes de tiempo (mitigado por la condición de entrada de
Fase 03 ya cerrada). Comunicación de marketing que vuelva a prometer de
más (mitigado por BL-22 y por los límites de §2.2 del negocio).

## Pruebas obligatorias

No aplica en sentido de pruebas automatizadas de código. Sí aplica una
revisión manual explícita del copy contra `Negocio_Velarix_v4.1.md` §2.2
antes de publicar.

## Casos de regresión

No aplica.

## Criterios de aceptación

`Negocio_Velarix_v4.1.md` §18, Fase 4: "proceso comercial ejecutable sin
improvisación."

## Evidencias requeridas

Activos comerciales creados y listados; copy revisado; precio y descuento
máximo documentados con su justificación (datos de Fase 03).

## Plan de rollback

Cambios de copy son reversibles trivialmente (control de versión
estándar). Sin cambios de infraestructura en esta fase.

## Condiciones de detención

Si el precio que resulta de los datos de Fase 03 no permite margen
positivo ni siquiera con la fórmula mínima de §6.3, se detiene esta fase
y se documenta como decisión de negocio pendiente, no se fuerza un precio
insostenible solo para avanzar.

## Checklist de cierre

- [ ] Precio y descuento máximo definidos con datos reales.
- [ ] BL-22 resuelto.
- [ ] Activos comerciales completos (lista de §15.1 del negocio).
- [ ] Proceso de onboarding/cierre probado en dry-run.
- [ ] Reporte de implementación completado.

## Plantilla del reporte de implementación

Ver plantilla en `fases/FASE-00-CIERRE-DE-AUDITORIA.md`.
