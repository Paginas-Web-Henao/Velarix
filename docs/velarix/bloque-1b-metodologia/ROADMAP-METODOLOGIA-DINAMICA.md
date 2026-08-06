# Roadmap de metodología dinámica — de provisional a automatizada

**Fecha:** 2026-08-06

Separa, en el tiempo, lo que existe hoy de lo que se planea a futuro para
la metodología financiera de Velarix. Ninguna de las etapas futuras
descritas aquí está autorizada para implementarse — este documento es de
planeación, no de ejecución.

## Etapa 0 — Versión provisional actual (vigente hoy)

`💻 Confirmado técnicamente`

- 8 supuestos canónicos fijos en `_shared/financial-methodology.ts`,
  todos `approved: false`.
- Estructura de capital siempre derivada de saldos observados.
- Escenarios optimista/pesimista con multiplicadores fijos, sin variar
  CAPEX/capital de trabajo en el servidor.
- Patrimonio negativo: comportamiento inconsistente entre motores (Caso
  C, `CASOS-DORADOS-PROVISIONALES.md`) — hallazgo documentado, sin
  corregir.
- Formulario del cliente ya no expone los 8 supuestos como ajustables
  (Decisión 9, implementada en esta sesión).
- Formulario del cliente ya bloquea `revenue <= 0` (Decisión 10A,
  implementada en esta sesión).

## Etapa 1 — Versión validada inicial (siguiente hito)

`📊 Validación financiera` — condición de entrada a esta etapa: revisor
financiero externo identificado y las 7 decisiones con componentes
sustantivos revisadas (1, 2, 3, 4, 5, 6, 8 — ver
`PLAN-VALIDACION-REVISOR-FINANCIERO.md`).

- Los 8 supuestos canónicos pasan de `approved: false` a `approved: true`
  únicamente en los campos que el revisor apruebe explícitamente.
- Corrección de la inconsistencia de patrimonio negativo entre motores
  (Decisión 6), con el tratamiento que el revisor defina.
- Formalización escrita de la Decisión 7 (utilidad neta vs. NOPAT).
- Multiplicadores de escenarios (Decisión 8) calibrados y aprobados,
  aplicados de forma idéntica en ambos motores.
- Cierre formal del Bloque 1C (casos dorados aprobados).

**Condición para no construir todavía:** ninguna de las correcciones de
esta etapa se implementa sin la aprobación escrita previa del revisor
para ese campo específico.

## Etapa 2 — Automatización con APIs (futura, Fase 7)

`⏸️ Diferido` — condición de entrada: Etapa 1 completa, y demanda real
que justifique el costo/riesgo de la automatización (`Negocio_Velarix_v4.1.md`
§18, Fase 7: "el problema ocurre repetidamente y el ahorro esperado
justifica el costo y riesgo").

- Conexión a fuentes reales (Damodaran, Banco de la República, DANE) para
  tasa libre de riesgo, ERP, beta sectorial y crecimiento perpetuo.
- Arquitectura de fuente principal + fuentes de contraste + jerarquía +
  fecha de vigencia + versión del dato + validación cruzada + detección
  de anomalías + fallback controlado + alerta ante discrepancia entre
  fuentes + bloqueo ante dato crítico faltante (descrita en la Decisión 1
  de `DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`).
- El backend puede ejecutar controles automáticos, pero nunca sustituye
  al revisor financiero para cambios de metodología.

## Etapa 3 — Metodología dinámica completa (futura, sin fase asignada todavía)

`⏸️ Diferido` — condición de entrada: Etapa 2 completa, casos reales
suficientes que demuestren la necesidad.

- Horizonte del DCF variable y metodológicamente justificado según
  madurez/etapa/reinversión de la empresa (Decisión 4, opción B). El
  fundador citó 5, 7 y 10 años como ejemplos posibles, no como un rango
  aprobado — el horizonte final y sus reglas de selección quedan
  pendientes de la validación del revisor financiero externo (pregunta 4
  de `PLAN-VALIDACION-REVISOR-FINANCIERO.md`), no de una cifra fijada
  aquí.
- g terminal dinámico, atado a fuente macro en vivo (Decisión 3).
- Escenarios dinámicos calibrados con volatilidad histórica real del
  sector/empresa, no multiplicadores fijos (Decisión 8).
- Advertencia automática cuando el horizonte fijo resulte insuficiente
  (EV negativo o no estabilizado) — `R-20`, `plan/MATRIZ-DE-RIESGOS.md`.

## Función de consultoría (estructura de capital objetivo)

`⏸️ Diferido` — condición de entrada: demanda real de un caso donde la
estructura observada no sea representativa, y el revisor haya definido
los criterios de override (Decisión 2).

- Override de estructura de capital, restringido por rol (analista/admin,
  nunca el cliente), auditado, reversible, nunca silencioso.

## Función fiscal asistida por IA

`⏸️ Diferido` — condición de entrada: metodología de conciliación
tributaria definida por un revisor financiero y tributario (Decisión 5),
y revisión legal del tratamiento de datos completada.

- Carga manual de documentos complementarios (declaración de renta,
  conciliación fiscal, notas a estados financieros) exclusiva para
  administradores.
- IA solo extrae, clasifica, compara y señala diferencias — nunca acusa,
  nunca aprueba automáticamente, nunca reemplaza al contador o al
  revisor.

## Dependencias entre etapas

```
Etapa 0 (hoy)
  │
  ▼
Etapa 1 — requiere: revisor financiero externo identificado
  │
  ├──▶ Cierre de Bloque 1C
  │
  ▼
Etapa 2 — requiere: demanda real, Fase 7 del negocio
  │
  ▼
Etapa 3 — requiere: Etapa 2 completa, casos reales suficientes

Función de consultoría — requiere: Decisión 2 validada por revisor
Función fiscal asistida — requiere: Decisión 5 validada + revisión legal
```

## Riesgos de adelantar etapas

- Construir la Etapa 2 (APIs) antes de la Etapa 1 (validación) automatiza
  una metodología que el revisor podría rechazar o exigir cambiar —
  retrabajo directo.
- Construir la función fiscal asistida antes de la revisión legal expone
  a Velarix a manejar documentos tributarios sensibles sin un marco de
  tratamiento de datos definido (`Negocio_Velarix_v4.1.md` §12.3, §12.4).
- Construir la función de consultoría antes de que el revisor defina los
  criterios de override (Decisión 2) arriesga introducir una vía de
  manipulación de resultados sin control real, aunque esté "restringida
  por rol" en el papel.

## Orden recomendado

1. Etapa 1 (validación) — bloqueante para todo lo demás.
2. Cierre de Bloque 1C.
3. Bloque 1E (fuera del alcance de este roadmap financiero — ver
   `docs/velarix/fases/FASE-01-EXACTITUD-FINANCIERA.md`).
4. Etapa 2 (APIs), función de consultoría, función fiscal asistida — en
   el orden que la demanda real de clientes indique, no por conveniencia
   técnica.
5. Etapa 3 (metodología dinámica completa) — al final, cuando exista
   volumen suficiente de casos reales para calibrar con evidencia, no con
   suposiciones.
