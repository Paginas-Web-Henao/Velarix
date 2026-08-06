# Plan de validación con el revisor financiero externo — Bloque 1B-metodología → 1C

**Fecha:** 2026-08-06

## Objetivo

Definir con precisión qué debe hacer el revisor financiero externo
(`Negocio_Velarix_v4.1.md` §9.4), con qué material, en cuántas sesiones,
y qué entregable exacto cierra formalmente el Bloque 1B-metodología y
habilita la aprobación del Bloque 1C. Este documento no sustituye la
revisión — la prepara.

## Perfil mínimo del revisor

- Experiencia demostrable en valoración de empresas (DCF, múltiplos),
  preferiblemente con casos de PYMES o mercados emergentes/Colombia.
- Conocimientos de WACC/CAPM, estructura de capital, análisis de estados
  financieros, normalización de EBITDA, valor terminal.
- Tipo de profesional: contador financiero con experiencia en valoración,
  analista de valoración, profesional de banca de inversión/corporate
  finance, o profesor de finanzas con experiencia práctica real (no solo
  docencia teórica).
- Haber participado en al menos una valoración DCF real de una empresa
  privada — no solo un caso académico.
- Independencia: no empleado de Velarix; preferiblemente sin
  participación económica en el resultado de las valoraciones que
  revisa.
- `Negocio_Velarix_v4.1.md` §9.4 exige explícitamente que no dependa de
  Claude como fuente metodológica.

## Documentos que debe recibir

1. `docs/velarix/bloque-1c/PAQUETE-REVISION-FINANCIERA.md`
2. `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md` (este bloque)
3. `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md` (análisis técnico original, conservado)
4. `docs/velarix/bloque-1c/CASOS-DORADOS-PROVISIONALES.md`
5. `docs/velarix/bloque-1c/MATRIZ-DE-PRUEBAS-FINANCIERAS.md`

## Preguntas exactas para el revisor, por decisión

| # | Pregunta exacta | Categoría |
|---|---|---|
| 1 | ¿Los valores actuales de tasa libre de riesgo, ERP, beta sectorial y costo de deuda son razonables como piso provisional? ¿Debe agregarse una prima de riesgo país/tamaño para PyMEs colombianas, y de qué magnitud? | Enviar a revisor |
| 2 | ¿La estructura de capital observada (comportamiento actual) es la política correcta por defecto? ¿Bajo qué condiciones debería permitirse una estructura "objetivo" distinta, y con qué controles? | Enviar a revisor |
| 3 | ¿El 3% de crecimiento perpetuo fijo es razonable? ¿Debe atarse a una fuente macro específica (DANE, Banco de la República) y con qué límite máximo? | Enviar a revisor |
| 4 | ¿El horizonte fijo de 5 años es aceptable como comportamiento provisional? ¿Qué reglas deberían activar un horizonte más largo, y qué advertencia mínima debería mostrarse cuando el resultado no se estabiliza en 5 años? | Enviar a revisor |
| 5 | ¿Qué criterio de materialidad debería usarse para decidir cuándo un dato histórico declarado (impuestos, utilidad neta) es lo suficientemente confiable para usarse en vez de la tasa fija? | Enviar a revisor |
| 6 | Ante patrimonio negativo: ¿el ROE debe mostrarse como "No interpretable"/"N/A" con advertencia, en vez de 0% o un porcentaje sin contexto? ¿Cómo debe tratarse el patrimonio negativo en la fórmula de Hamada (beta apalancada) y en el WACC? | Enviar a revisor |
| 7 | ¿Confirma que el uso de utilidad neta para ROE/ROA y NOPAT para el DCF es metodológicamente correcto y no requiere cambio? (Formalización, no debate de fondo) | Enviar a revisor (formalización) |
| 8 | ¿Qué multiplicadores concretos deberían usarse para los escenarios optimista/pesimista, y deben variar CAPEX/capital de trabajo por escenario en el servidor, igual que en el cliente? | Enviar a revisor |
| 9 | ¿La política de producto de mantener los 8 supuestos canónicos fijos (no editables por el cliente) es metodológicamente aceptable, o genera algún riesgo de subestimar/sobrestimar sistemáticamente? | Confirmar, no requiere debate de alternativas |
| — | Revisión general: ¿los tres casos dorados (A/B/C) son representativos y sus resultados son razonables dado el estado actual (provisional) de la metodología? | Aprobación formal de casos dorados |

## Decisiones que debe aprobar

Las 5 decisiones clasificadas "Enviar a revisor" en `REPORTE-CONSOLIDACION-DECISIONES-2026-08-06.md`
§6.C: fuentes y reglas del WACC (Decisión 1), estructura de capital
objetivo (Decisión 2), crecimiento perpetuo (Decisión 3), selección
futura de horizonte (Decisión 4), impuestos y conciliación (Decisión 5),
normalización financiera (Decisión 5), patrimonio negativo y
`total_assets` (Decisión 6), efecto sobre beta y WACC (Decisión 6),
escenarios dinámicos (Decisión 8), umbrales de materialidad (Decisión 5),
y los casos dorados definitivos (Decisiones 1-8 en conjunto, sección 3
del paquete).

## Entregables esperados

- Sección 6 de `PAQUETE-REVISION-FINANCIERA.md` completada: Aprobado /
  Aprobado con ajustes / Rechazado.
- Postura documentada por escrito sobre cada una de las 9 preguntas de
  la tabla anterior.
- Checklist de la sección 8 de `PAQUETE-REVISION-FINANCIERA.md` marcado.

## Evidencia requerida para considerar la revisión completa

- Firma o confirmación escrita del revisor (correo, documento firmado, o
  anotación directa en `PAQUETE-REVISION-FINANCIERA.md` sección 6).
- Fecha de la revisión.
- Nombre y credenciales del revisor, registrados en
  `plan/REGISTRO-DE-DECISIONES.md` como una nueva entrada.

## Formato de aprobación

El revisor marca una de las tres opciones de la sección 6 del paquete.
"Aprobado con ajustes" debe listar exactamente qué ajuste exige, en qué
decisión, y si ese ajuste requiere volver a ejecutar los 3 casos dorados
antes de considerarse aplicado.

## Puntos que el revisor puede rechazar

Cualquiera de las 5 decisiones C completas, cualquiera de los 3 casos
dorados individualmente, o la metodología completa. Un rechazo no cierra
el Bloque 1B-metodología ni el Bloque 1C — regresa el ítem rechazado a
`📊 Validación financiera` con la observación del revisor registrada.

## Proceso para registrar cambios exigidos por el revisor

1. El ajuste exacto se registra como una nueva entrada en
   `plan/REGISTRO-DE-DECISIONES.md` (siguiente disponible tras `D-07`).
2. Se actualiza `_shared/financial-methodology.ts` únicamente en los
   campos que el revisor aprobó explícitamente, marcando `approved: true`
   solo en esos campos.
3. Se re-ejecutan los 3 casos dorados (`canonical-financial-engine.golden-cases.test.ts`)
   y se actualizan los valores esperados si el ajuste los cambia,
   documentando el antes/después.
4. Ningún ajuste se aplica sin que exista, primero, la aprobación escrita
   del revisor para ese ajuste específico.

## Criterio para cerrar el Bloque 1B-metodología

- Las decisiones 7 (formalización) y las políticas de producto de las
  decisiones 2, 3, 4, 8 (mantener el comportamiento actual como
  provisional) quedan confirmadas por el fundador — ya lo están, en este
  documento y en `DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`.
- Las 5 decisiones C tienen, como mínimo, una postura inicial documentada
  del revisor (no necesariamente definitiva) sobre cada una.
- `BL-17` (consolidación de constantes macro/sectoriales) permanece
  parcialmente pendiente — no es condición de cierre de 1B-metodología
  per `plan/BACKLOG-CLASIFICADO.md`, sigue como deuda documentada.

## Criterio para cerrar el Bloque 1C

- Bloque 1B-metodología cerrado (criterio anterior).
- Sección 6 de `PAQUETE-REVISION-FINANCIERA.md` marcada "Aprobado" o
  "Aprobado con ajustes" con los ajustes ya aplicados y re-verificados.
- `BL-15` (trazabilidad) y `BL-32` (versionado) en el estado que el
  revisor considere suficiente para los casos dorados aprobados — no es
  obligatorio completarlos al 100% si el revisor no lo exige
  explícitamente.
