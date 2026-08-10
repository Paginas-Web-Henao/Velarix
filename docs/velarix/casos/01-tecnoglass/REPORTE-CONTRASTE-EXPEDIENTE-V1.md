# Reporte de contraste — Caso 01 (Tecnoglass) vs. `EXPEDIENTE-DE-VALORACION-V1.md`

**Fecha:** 2026-08-10
**Insumo:** `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`
**Objetivo:** determinar, hallazgo por hallazgo, si la especificación del
Expediente de Valoración V1 ya representaba lo que el Caso 01 demostró
necesario, y clasificar cada cambio. El propósito no es meter todo lo
imaginable al Expediente — solo agregar estructura que Tecnoglass haya
demostrado necesaria.

**Clasificaciones usadas:** `CONFIRMADO POR CASO` (se incorporó a la
especificación), `PROVISIONAL` (se incorporó, pero su diseño final
depende de más evidencia), `REQUIERE CASO 02` (no se incorpora todavía,
necesita ver si se repite en una empresa con economía distinta),
`REQUIERE EXPERTO` (no se incorpora todavía, necesita criterio
financiero externo), `NO IMPLEMENTAR TODAVÍA` (aplica a la
implementación, no a la especificación conceptual).

---

## Matriz de contraste

| # | Hallazgo Tecnoglass | ¿Expediente V1 ya lo cubría? | Cobertura previa | Cambio requerido | Razón | Evidencia del caso | Prioridad | ¿Implementación futura? | ¿Requiere experto? | ¿Requiere Caso 02? | Clasificación |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Ninguna afirmación tenía un estado de conocimiento explícito (hecho/inferencia/hipótesis/desconocido/pregunta/decisión/aprobado) | No | Ausente | Nueva subsección §5.1, aplicable a `company_context`, `account_notes`, `account_components`, `expedient_questions`, `projection_hypotheses`, `case_assumptions` | Sin esto, el expediente no puede distinguir "lo sabemos" de "lo estamos asumiendo" — riesgo directo de presentar una hipótesis como hecho | §16 y §19 (R5) de `CASO-01-TECNOGLASS-V0.md` | Alta | Sí, en el Paso 1 del plan incremental (§19) | No | No | `CONFIRMADO POR CASO` |
| 2 | Working capital y normalizaciones necesitan que reportado/normalizado/proyectado coexistan, no se sobrescriban | Parcial — `normalizations` ya conservaba historial, pero no vinculaba explícitamente la capa "proyectado" | Parcial | Aclarar en §5 (`normalizations`) y nuevo criterio de aceptación en §17 que las tres capas deben poder coexistir y consultarse juntas | Evidencia directa de working capital (AR/inventory/AP) y de las normalizaciones candidatas (§8, §12 del caso) | §8, §12, §19 (R2) | Alta | Sí, Pasos 1 y 3 | No | No | `CONFIRMADO POR CASO` |
| 3 | Una tarifa se registra fuera de Cost of Sales pero es, económicamente, un costo variable — clasificación contable ≠ económica | No | Ausente | `account_notes` distingue explícitamente `clasificacion_contable` de `interpretacion_economica` (driver, fijo/variable/mixto, sensibilidad a volumen/commodity/FX, pass-through y su lag) | Sin esta separación, el expediente heredaría la clasificación contable como si fuera la explicación económica | §6, §19 (R1) | Alta | Sí, Paso 1 | No | No | `CONFIRMADO POR CASO` |
| 4 | Cost of Sales no tiene desagregación pública suficiente (materiales/labor/energía/logística) | No | Ausente | Nueva entidad `account_components`, opcional, N por `account_notes`, cada componente con driver, participación estimada, fuente y estado epistémico | Sin ella, una cuenta material agregada no puede interpretarse a nivel de driver | §6, §19 (R4) | Media | Sí, Paso 1 o 2 | No — el umbral de materialidad que activa esta descomposición sí debería validarse con más casos | Sí — para calibrar cuándo vale la pena descomponer vs. dejar como nota única | `PROVISIONAL` |
| 5 | La tabla de variables del fundador (unidades vendidas, crecimiento de precios/costos, depreciación, caja mínima, etc.) tiene valores de ejemplo que **no** son defaults universales | Parcial — `case_assumptions` ya existía, pero con una lista de campos más corta que la necesaria | Parcial | Ampliar campos de `case_assumptions`: categoría, driver, tipo de información, método de determinación, nivel de certeza, materialidad, sensibilidad (algunos ya vivían en `Negocio_Velarix_v4.2.md` §9.5, pero no todos estaban reflejados en la entidad de este documento) | Evitar que un valor histórico de una tabla se convierta silenciosamente en un default aplicado a otra empresa | §14, §19 | Alta | Sí, Paso 4 | No | No | `CONFIRMADO POR CASO` |
| 6 | El backlog es un driver central de ingresos en Tecnoglass; otra empresa podría depender de unidades×precio, clientes×ARPU, contratos, capacidad, etc. | Parcial — `projection_hypotheses.driver` ya existía como campo, pero sin la aclaración explícita de que debe ser texto libre específico de empresa | Parcial | Aclarar en §5 que `driver` es texto libre, nunca un enum cerrado ni catálogo universal; una línea material puede requerir más de una hipótesis de driver | Evita que "backlog" (u otro driver de Tecnoglass) se codifique como campo obligatorio para cualquier empresa | §5, §19 (R7) | Alta | Sí, Paso 4 | No | Sí — confirmar con una empresa de economía distinta que el campo de texto libre es suficientemente flexible | `CONFIRMADO POR CASO`, con verificación pendiente `REQUIERE CASO 02` |
| 7 | Relaciones identificadas: CAPEX→capacidad→ingresos; automatización→costos; backlog→working capital; g→reinversión | No | Ausente | Nueva entidad `assumption_relations`, relación N:N entre `case_assumptions`/`projection_hypotheses`, con tipo de relación y razonamiento | Sin ella, cambiar un supuesto no advierte qué otros supuestos dependen de él — riesgo de incoherencia silenciosa | §15, §19 (R3) | Media | Sí, Paso 4 o 5 | Sí — qué tipos de relación son suficientes (dependencia simple vs. restricción dura) es un juicio metodológico | Sí — confirmar qué tipos de relación aparecen en otra empresa | `REQUIERE EXPERTO` + `REQUIERE CASO 02` |
| 8 | Patrones de incoherencia identificados (ingreso que excede capacidad, margen que mejora sin driver, g sin ajuste de reinversión, tasa de impuesto manual sin reconciliación, normalización sin evidencia, partida "extraordinaria" recurrente, supuesto material sin sensibilidad, hipótesis dependientes inconsistentes) | No | Ausente | Nueva entidad `coherence_flags` — señal generada, nunca decisoria — agregada como **concepto**, explícitamente marcada fuera de alcance de implementación en §20 | El sistema puede y debe poder señalar inconsistencias sin decidir por el analista o el experto | §19 (R8) | Media (concepto) / Baja (implementación, todavía no autorizada) | **No todavía** — requiere Caso 02 y criterio experto antes de precisar el diseño | Sí | Sí | `NO IMPLEMENTAR TODAVÍA` |
| 9 | Tratamiento económico del supplier finance: ¿working capital operativo o deuda económica? | No aplica — es una pregunta metodológica abierta, no un cambio de estructura del Expediente | — | Ninguno al Expediente; se registra como pregunta metodológica abierta (§18 del caso) | El Expediente ya permite registrar una decisión de este tipo vía `case_assumptions`/`account_notes` con estado epistémico `decision_del_analista` o `pregunta_a_gerencia` — no hace falta una entidad nueva, hace falta criterio para decidir el caso | §8, §18 | Media | No aplica | Sí — es exactamente el tipo de pregunta que se le llevaría a un revisor financiero externo | No necesariamente — pero un segundo caso con instrumentos similares ayudaría | `REQUIERE EXPERTO` |
| 10 | Volatilidad de la tasa efectiva de impuesto (31.5%–36.5% en trimestres observados) sin reconciliación pública completa | Parcial — el Expediente ya distingue conceptualmente impuestos (vía `case_assumptions`), pero no exigía explícitamente separar tasa estatutaria/efectiva/corriente/diferida/cash tax | Parcial | No se agregó una entidad nueva — la separación ya cabe dentro de los campos ampliados de `case_assumptions` (cambio #5); se deja registrado aquí como caso de uso concreto, no como estructura adicional | Confirma que los campos ampliados de `case_assumptions` son suficientes para este caso, sin necesitar una entidad "impuestos" separada | §9 | Baja (no generó cambio estructural nuevo) | No aplica | Sí, en el momento de aplicarlo a un caso real | No | `CONFIRMADO POR CASO` (ya cubierto por el cambio #5) |

---

## Resumen de disposición final

- **Incorporado a la especificación (`CONFIRMADO POR CASO` o
  `PROVISIONAL`)**: clasificación epistémica (§5.1), tres capas de valor,
  separación contable/económica, campos ampliados de `case_assumptions`,
  `driver` como texto libre, `account_components` (provisional en su
  umbral de materialidad).
- **Incorporado como concepto, explícitamente sin autorización de
  implementación**: `assumption_relations`, `coherence_flags`.
- **No incorporado, registrado como pregunta abierta**: tratamiento de
  supplier finance (no es un problema de estructura del Expediente, es
  una decisión metodológica que corresponde a un experto).
- **Ningún valor numérico de Tecnoglass** (márgenes, tasas de impuesto,
  días de capital de trabajo, múltiplos) se incorporó como default,
  benchmark ni referencia metodológica de Velarix.
- **Ningún driver específico de Tecnoglass** (backlog, capacidad
  manufacturera) se declaró requisito universal.

## Qué sigue

1. Caso 02 (empresa con economía distinta, no analizado en esta tarea) —
   confirmará o corregirá los cambios #6, #7, #8 y ayudará a calibrar el
   umbral de materialidad del cambio #4.
2. Ninguno de los cambios de este reporte autoriza implementación —
   sigue pendiente autorización explícita y separada del fundador
   (`Negocio_Velarix_v4.2.md` §19, regla 19).
3. Las preguntas metodológicas de `CASO-01-TECNOGLASS-V0.md` §18
   (especialmente supplier finance y el umbral de materialidad para
   descomposición de cuentas) quedan como agenda concreta para la
   próxima conversación con un revisor/experto financiero — no como
   ejercicio abstracto, sino con evidencia real detrás.
