# Decisiones financieras aprobadas por el fundador — Bloque 1B-metodología

**Fecha:** 2026-08-06
**Fundador:** Nicolás
**Fuente de autoridad de negocio:** `Negocio_Velarix_v4.1.md` (§0, regla de autoridad; §9.4, revisor externo)
**Documento anterior que este consolida (sin reemplazarlo):** `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md`

## Contexto

Este documento registra formalmente la respuesta del fundador a las 10
decisiones metodológicas pendientes identificadas en el Bloque 1B-M
(`DECISIONES-FINANCIERAS-PENDIENTES.md`). **Ninguna respuesta del
fundador aquí registrada equivale, por sí sola, a una aprobación
financiera formal.** Donde el fundador aprueba una política de producto o
un comportamiento provisional, ese comportamiento queda `✅ Confirmado`
para efectos de producto — pero la metodología financiera subyacente
(fórmulas, valores, umbrales) permanece `📊 Validación financiera`,
pendiente de un revisor financiero externo con experiencia demostrable
(`Negocio_Velarix_v4.1.md` §9.4), hasta que ese revisor la apruebe
explícitamente en `docs/velarix/bloque-1c/PAQUETE-REVISION-FINANCIERA.md`.

Una misma decisión puede tener, simultáneamente: una política de producto
ya confirmada, una metodología financiera todavía pendiente de validación,
y una funcionalidad futura explícitamente diferida. Las tres capas se
distinguen por separado en cada ficha.

**Este documento no cierra el Bloque 1B-metodología, no cierra el Bloque
1C, no desbloquea el Bloque 1E, y no declara a Velarix listo para pilotos
pagados ni clientes reales.**

---

## Decisión 1 — Supuestos de mercado del WACC

| Campo | Contenido |
|---|---|
| Estado | `📊 Validación financiera` (metodología y valores definitivos) · `⏸️ Diferido` (automatización completa mediante APIs) |
| Decisión actual | Un revisor financiero externo deberá validar fuentes, valores, periodicidad y reglas para: tasa libre de riesgo, ERP, beta sectorial, costo de deuda, prima país, prima por tamaño y cualquier otro ajuste del WACC |
| Comportamiento permitido | Los valores actuales de `_shared/financial-methodology.ts` (`CANONICAL_METHODOLOGY`) siguen usándose, exclusivamente como provisionales, para desarrollo y pruebas sintéticas |
| Comportamiento prohibido | No se implementan APIs, integraciones ni cambios de WACC en este bloque |
| Dependencia del revisor | Sí — obligatoria antes de aprobar el WACC como metodología válida |
| Criterio futuro (arquitectura) | Fuente principal, fuentes de contraste, jerarquía entre fuentes, fecha de vigencia, fecha de consulta, versión del dato, trazabilidad, validación cruzada, detección de anomalías, rangos permitidos, fallback controlado, último valor validado, alerta ante discrepancia material entre fuentes, bloqueo ante dato crítico faltante. El backend podrá ejecutar controles automáticos, pero nunca sustituirá al revisor financiero |
| Impacto técnico de esta sesión | Ninguno — no se tocó código de WACC, beta, ni supuestos de mercado |
| Criterio de aceptación | Ver `PLAN-VALIDACION-REVISOR-FINANCIERO.md` |
| Trazabilidad | `DECISIONES-FINANCIERAS-PENDIENTES.md` #1 · `R-19`, `plan/MATRIZ-DE-RIESGOS.md` · `_shared/financial-methodology.ts` |

## Decisión 2 — Estructura de capital observada vs. objetivo

| Campo | Contenido |
|---|---|
| Estado | `✅ Confirmado` (política del producto estándar) · `📊 Validación financiera` (criterios de override) · `⏸️ Diferido` (interfaz de consultoría) |
| Decisión actual | El producto estándar usa siempre la estructura de capital observada de la empresa. El cliente no puede modificarla directamente |
| Comportamiento permitido | Comportamiento actual sin cambios: `equityWeight`/`debtWeight` se derivan de saldos reales |
| Comportamiento prohibido | No se implementan overrides ni se modifica la estructura de capital en este bloque |
| Dependencia del revisor | Sí — debe definir, antes de implementar cualquier override futuro: cuándo se permite, qué soportes requiere, qué límites aplica, cómo afecta beta, WACC y Enterprise Value |
| Criterio futuro (capa de consultoría) | Todo override futuro debe: estar restringido por rol; incluir justificación; conservar valor original y valor ajustado; identificar al responsable; registrar fecha; quedar auditado; reflejarse en el informe; poder revertirse; nunca sobrescribir silenciosamente los datos originales |
| Impacto técnico de esta sesión | Ninguno |
| Criterio de aceptación | Ver `PLAN-VALIDACION-REVISOR-FINANCIERO.md` |
| Trazabilidad | `DECISIONES-FINANCIERAS-PENDIENTES.md` #2 · `REPORTE-RECONCILIACION-METODOLOGICA.md` fila 5 |

## Decisión 3 — Crecimiento perpetuo (g terminal)

| Campo | Contenido |
|---|---|
| Estado | `✅ Confirmado` (dirección futura del producto) · `📊 Validación financiera` (fórmula y límites) · `⏸️ Diferido` (implementación dinámica) |
| Decisión actual | El 3% fijo actual no debe permanecer como metodología definitiva para todas las empresas — es un supuesto provisional de desarrollo |
| Comportamiento permitido | `terminalGrowthPct = 3` (fijo) se mantiene en `_shared/financial-methodology.ts`, marcado `approved: false`, únicamente para desarrollo |
| Comportamiento prohibido | No se modifica g terminal ni las fórmulas de valor terminal en este bloque |
| Dependencia del revisor | Sí — debe validar la fórmula y los límites, considerando inflación esperada de largo plazo, crecimiento real potencial, moneda, exposición geográfica, madurez de sector/empresa, capacidad sostenible de reinversión, retorno en estado estable, contexto macroeconómico |
| Criterio futuro | La tasa resultante debe: respetar límites conservadores; ser consistente con el estado estable; ser compatible con el WACC; registrar fuentes y fecha; detectar combinaciones imposibles; recibir validación inicial y periódica |
| Impacto técnico de esta sesión | Ninguno |
| Criterio de aceptación | Ver `PLAN-VALIDACION-REVISOR-FINANCIERO.md` |
| Trazabilidad | `DECISIONES-FINANCIERAS-PENDIENTES.md` #3 |

## Decisión 4 — Horizonte explícito del DCF

| Campo | Contenido |
|---|---|
| Estado | `✅ Confirmado` (mantener 5 años actualmente) · `⏸️ Diferido` (horizonte variable) · `📊 Validación financiera` (reglas de selección futura) |
| Decisión actual | Velarix mantiene por ahora un horizonte explícito fijo de 5 años. Esto no significa valorar la empresa solo 5 años — después del periodo explícito, el modelo usa el valor terminal para representar la perpetuidad |
| Comportamiento permitido | 5 años fijos en ambos motores, sin cambios |
| Comportamiento prohibido | No se cambia el horizonte ni la arquitectura del motor en este bloque |
| Dependencia del revisor | Sí, para las reglas de selección de horizonte variable (madurez, etapa de crecimiento, tiempo de estabilización, convergencia de márgenes, reinversión, riesgo, disponibilidad de proyecciones defendibles) |
| Criterio futuro | Cuando una empresa no se estabilice dentro de 5 años, el sistema deberá advertir que el horizonte puede ser insuficiente y enviar el caso a revisión — advertencia todavía no implementada (ver riesgo residual en el reporte final) |
| Impacto técnico de esta sesión | Ninguno — no se modificó el horizonte ni se agregó la advertencia |
| Criterio de aceptación | Ver `PLAN-VALIDACION-REVISOR-FINANCIERO.md` |
| Trazabilidad | `DECISIONES-FINANCIERAS-PENDIENTES.md` #4 · `CASOS-DORADOS-PROVISIONALES.md`, Caso B (EV negativo del motor cliente por horizonte corto con reinversión intensa) |

## Decisión 5 — Impuestos y utilidad histórica

| Campo | Contenido |
|---|---|
| Estado | `✅ Confirmado` (política de revisión y conciliación) · `📊 Validación financiera y tributaria` (metodología) · `⏸️ Diferido` (función avanzada de revisión asistida) |
| Decisión actual | Velarix no asume automáticamente que los impuestos, la utilidad neta u otros datos históricos reportados por el cliente son correctos. Tampoco asume que una diferencia representa evasión, fraude, manipulación o error intencional |
| Comportamiento permitido | Comportamiento actual: ambos motores recalculan siempre con tasa fija, sin usar el histórico declarado |
| Comportamiento prohibido | No se modifican impuestos, utilidad histórica ni normalización de EBITDA en este bloque |
| Dependencia del revisor | Sí — debe definir documentos mínimos, impuesto corriente, impuesto diferido, conciliación contable-fiscal, ajustes permitidos, umbrales de materialidad, condiciones de bloqueo, condiciones para continuar con advertencia, responsables de aprobación. Revisor financiero **y** tributario |
| Criterio futuro (metodología) | Conservar la cifra reportada → calcular una referencia independiente → comparar ambas → cuantificar diferencias → identificar diferencias materiales → solicitar explicaciones o soportes → detener la aprobación automática cuando corresponda → permitir revisión humana → conservar trazabilidad de cualquier ajuste → mostrar, cuando sea útil, el resultado basado en información reportada y el resultado normalizado por separado. La explicación debe ser neutral |
| Impacto técnico de esta sesión | Ninguno |
| Criterio de aceptación | Ver `PLAN-VALIDACION-REVISOR-FINANCIERO.md` |
| Trazabilidad | `DECISIONES-FINANCIERAS-PENDIENTES.md` #5 |

### Función futura relacionada con la Decisión 5 — revisión fiscal asistida

| Campo | Contenido |
|---|---|
| Estado | `⏸️ Diferido` · `📊 Validación financiera y tributaria` · `⚖️ Revisión legal y de tratamiento de datos` (antes de activarse) |
| Decisión actual | Queda registrada una función futura exclusiva para Nicolás o administradores autorizados, para cargar manualmente documentos complementarios (declaración de renta, conciliación fiscal, notas a estados financieros, certificados, soportes contables, documentos tributarios) |
| Comportamiento permitido de la IA (futuro) | Extraer información, clasificar datos, comparar cifras, detectar diferencias, identificar documentos faltantes, preparar preguntas, mostrar valor reportado/recalculado/diferencia, registrar nivel de confianza, conservar evidencia y trazabilidad |
| Comportamiento prohibido (siempre) | La función no podrá acusar evasión, afirmar fraude, modificar libros, aprobar automáticamente obligaciones tributarias, reemplazar a un contador, reemplazar a un revisor, ni tomar decisiones finales sin intervención humana |
| Dependencia del revisor | Sí, financiero y tributario, antes de diseñar la metodología. Revisión legal y de tratamiento de datos antes de activarse |
| Impacto técnico de esta sesión | Ninguno — no se implementó esta función |
| Trazabilidad | Ver `ROADMAP-METODOLOGIA-DINAMICA.md`, sección "Función fiscal asistida" |

## Decisión 6 — Patrimonio negativo

| Campo | Contenido |
|---|---|
| Estado | `✅ Confirmado` (política de interpretación y presentación) · `📊 Validación financiera` (efecto sobre WACC, beta y valoración) · `🚨 Bloqueante` para cierre metodológico mientras los motores produzcan resultados contradictorios · **No autorizado para corrección de fórmulas en este bloque** |
| Decisión actual | Velarix debe conservar el patrimonio con su signo real. Nunca debe convertir artificialmente un patrimonio negativo en positivo para ocultar su condición |
| Comportamiento permitido (cuando se implemente, fuera de este bloque) | Cuando el patrimonio sea negativo: el ROE no debe presentarse como 0% ni como un porcentaje ordinario sin contexto; debe mostrarse como "No interpretable por patrimonio negativo" o "N/A"; debe aparecer una alerta; el caso debe pasar a revisión; deben mostrarse los indicadores que sí sean interpretables; debe conservarse el patrimonio original; debe usarse `total_assets` real cuando exista y la metodología esté validada; ambos motores deben aplicar finalmente el mismo tratamiento |
| Comportamiento prohibido | No se modifica `Math.abs()`, ROE, `total_assets`, beta, WACC ni ningún motor financiero en este bloque |
| Aclaración explícita del fundador | Patrimonio negativo no significa automáticamente pérdida, mal negocio, fraude o irregularidad — puede relacionarse con pérdidas acumuladas, distribuciones a socios, recompras, ajustes contables, reorganizaciones, estructura de deuda u otras circunstancias legítimas |
| Dependencia del revisor | Sí — debe definir cómo afecta beta apalancada, WACC, estructura de capital, Enterprise Value, Equity Value, casos dorados y presentación del informe |
| Hallazgo técnico documentado (sin corregir) | El motor servidor (`_shared/canonical-financial-engine.ts`) aplica `Math.abs()` al patrimonio antes de cualquier cálculo, ocultando el signo negativo; el motor cliente (`financial-engine.ts`) no lo hace. Resultado verificado en el Caso C de `CASOS-DORADOS-PROVISIONALES.md`: servidor ROE = −77%, cliente ROE = 0% (clamp correcto), para la misma empresa sintética. Beta re-apalancado también difiere (7.788 vs. 5.861) por la misma causa |
| Impacto técnico de esta sesión | Ninguno — el hallazgo queda documentado, no corregido |
| Criterio de aceptación | Ver `PLAN-VALIDACION-REVISOR-FINANCIERO.md` |
| Trazabilidad | `DECISIONES-FINANCIERAS-PENDIENTES.md` #6 · `REPORTE-RECONCILIACION-METODOLOGICA.md`, "Hallazgo nuevo (cierre técnico)" · `CASOS-DORADOS-PROVISIONALES.md`, Caso C |

## Decisión 7 — Utilidad neta vs. NOPAT

| Campo | Contenido |
|---|---|
| Estado | `✅ Confirmado` — solo requiere formalización documental |
| Decisión actual | Mantener el comportamiento actual: utilidad neta para ROE, utilidad neta para ROA, NOPAT para el flujo de caja del DCF. No se cambia el motor |
| Justificación formal | ROE y ROA son indicadores de rentabilidad contable; el DCF usa NOPAT como componente operativo del FCFF; utilizar métricas diferentes en esos dos contextos es intencional, no una inconsistencia |
| Comportamiento prohibido | No se cambia el motor |
| Dependencia del revisor | Solo para formalización del criterio, no para elegir entre alternativas |
| Impacto técnico de esta sesión | Ninguno — comportamiento ya vigente, ahora documentado formalmente aquí |
| Criterio de aceptación | Confirmado por el fundador en este documento; formalización final en la sesión de revisión (ver `PLAN-VALIDACION-REVISOR-FINANCIERO.md`) |
| Trazabilidad | `DECISIONES-FINANCIERAS-PENDIENTES.md` #7 · `REPORTE-RECONCILIACION-METODOLOGICA.md` fila 12 |

## Decisión 8 — Escenarios base, optimista y pesimista

| Campo | Contenido |
|---|---|
| Estado | `✅ Confirmado` (mantener provisionalmente la configuración actual) · `📊 Validación financiera` (metodología definitiva) · `⏸️ Diferido` (escenarios dinámicos y unificación definitiva) |
| Decisión actual | Por ahora, Velarix mantiene porcentajes/multiplicadores fijos para construir los escenarios. Esto es provisional |
| Comportamiento permitido | Servidor: no varía `capexPct`/`wcPct` por escenario. Cliente: sí los varía. Divergencia documentada, mantenida tal cual — **no se repite el intento de unificación no autorizada que ya se revirtió una vez** (`REPORTE-RECONCILIACION-METODOLOGICA.md` fila 1) |
| Comportamiento prohibido | No se modifican multiplicadores, CAPEX, capital de trabajo, crecimiento, margen ni WACC de los escenarios en este bloque |
| Dependencia del revisor | Sí — debe definir variables que cambian, límites, multiplicadores, relaciones entre variables, fuentes, reglas de consistencia, tratamiento por sector y por etapa empresarial |
| Criterio futuro | Después de la validación, servidor y cliente deberán usar exactamente la misma metodología |
| Impacto técnico de esta sesión | Ninguno |
| Criterio de aceptación | Ver `PLAN-VALIDACION-REVISOR-FINANCIERO.md` |
| Trazabilidad | `DECISIONES-FINANCIERAS-PENDIENTES.md` #8 · `REPORTE-RECONCILIACION-METODOLOGICA.md` fila 1 (intento previo revertido) |

## Decisión 9 — Supuestos ajustables por el cliente

| Campo | Contenido |
|---|---|
| Estado | `✅ Confirmado` — **AUTORIZADO E IMPLEMENTADO EN ESTA SESIÓN** |
| Decisión actual | La página y el producto estándar deben ejecutar siempre la misma metodología. El cliente no debe ver controles que aparenten permitir ajustar supuestos financieros cuando el backend no aplica esos ajustes |
| Comportamiento permitido | Los 8 supuestos canónicos (`_shared/financial-methodology.ts`) se mantienen fijos; el motor cliente sigue usando sus valores por defecto (`DEFAULT_INPUTS`) para los 7 campos correspondientes (`taxRate`, `capexPct`, `wcPct`, `terminalGrowth`, `costOfDebt`, `riskFreeRate`, `erp`) |
| Comportamiento prohibido | No se construyó la capa de consultoría; no se implementaron overrides; no se cambiaron valores financieros por defecto |
| Dependencia del revisor | No para la política de producto (decisión del fundador); sí, indirectamente, para validar los valores que quedan fijos (Decisión 1) |
| Impacto técnico de esta sesión | **Implementado** — ver sección 8 del `REPORTE-CONSOLIDACION-DECISIONES-2026-08-06.md` |
| Criterio de aceptación | Los 7 controles ya no aparecen en el formulario; el cliente no puede modificarlos; el formulario conserva su funcionamiento; el payload conserva el contrato sin overrides del cliente; el cálculo financiero no se alteró — verificado con 6 pruebas dirigidas nuevas |
| Trazabilidad | `DECISIONES-FINANCIERAS-PENDIENTES.md` #9 · `R-19`, `plan/MATRIZ-DE-RIESGOS.md` · `src/components/demo/DemoInputsForm.tsx` · `src/components/demo/DemoInputsForm.test.tsx` |

## Decisión 10 — Revenue igual a cero

| Campo | Contenido |
|---|---|
| Estado (10A) | `✅ Confirmado` — **AUTORIZADO E IMPLEMENTADO EN ESTA SESIÓN** |
| Estado (10B) | `⏸️ Diferido` |
| Decisión actual (10A) | El formulario debe impedir enviar un análisis cuando los ingresos sean iguales a cero (o negativos) |
| Comportamiento permitido | Validación en la capa de formulario (`DemoInputsForm.tsx`): bloquea el envío, muestra un mensaje claro asociado al campo, no depende únicamente de deshabilitar el botón |
| Comportamiento prohibido | No se modificaron fórmulas financieras; no se cambió el motor cliente ni el motor servidor (el servidor ya rechazaba `revenue=0` desde antes de esta sesión) |
| Decisión futura (10B, diferida) | El motor cliente (`runAnalysis`) también deberá rechazar `revenue = 0` como segunda capa de defensa, pero solo después de revisar todos sus llamadores (`Dashboard.tsx`, `DemoDashboard.tsx`) — no implementado en este bloque |
| Dependencia del revisor | No es necesaria — decisión de producto/UX |
| Impacto técnico de esta sesión | **Implementado (10A)** — ver sección 9 del `REPORTE-CONSOLIDACION-DECISIONES-2026-08-06.md` |
| Criterio de aceptación | Ingresos en 0 o negativos bloquean el envío con mensaje visible y accesible; valor positivo permite el envío; no hay regresión en el flujo normal — verificado con 7 pruebas dirigidas nuevas |
| Trazabilidad | `DECISIONES-FINANCIERAS-PENDIENTES.md` #10 · `MATRIZ-DE-PRUEBAS-FINANCIERAS.md`, escenarios 14/15 · `src/components/demo/DemoInputsForm.tsx` · `src/components/demo/DemoInputsForm.test.tsx` |

---

## Nota sobre la fuente de verdad de negocio usada en esta consolidación

Se determinó `Negocio_Velarix_v4.1.md` como la fuente de verdad vigente,
confirmado por: (a) versión declarada más alta (`v4.1` > `v4` > `v3`); (b)
`docs/velarix/README.md` lo declara explícitamente como el documento
maestro; (c) `plan/REGISTRO-DE-DECISIONES.md`, decisión `D-01`, ya
resolvió esta misma pregunta el 2026-07-22; (d) `diff` directo entre
`NEGOCIO_V4_VELARIX.md` y `Negocio_Velarix_v4.1.md` confirma que v4.1 es
un refinamiento estrictamente aditivo de v4 (aclara la excepción del
Estimador gratuito en §1.1, refina la política de descuentos en §6.5, y
divide §17 en 17.1/17.2/17.3 con criterios más granulares), sin ninguna
contradicción entre ambos. `Negocio.md` (v3) describe un modelo de
negocio distinto (retainer estilo abogado, con tablas `retainers`/
`time_entries` que no existen en el esquema real) y queda superado — no
se actualizó ninguno de los tres documentos de negocio en esta sesión, no
era necesario ni estaba dentro del alcance autorizado.
