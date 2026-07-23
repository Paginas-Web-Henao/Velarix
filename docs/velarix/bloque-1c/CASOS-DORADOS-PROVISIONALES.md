# Casos dorados provisionales — Bloque 1C-Prep

> **Caso dorado técnico provisional — pendiente de aprobación
> financiera.** Ninguno de estos 3 casos, ni los resultados que
> producen, fue revisado ni aprobado por el fundador ni por un revisor
> financiero externo (`Negocio_Velarix_v4.1.md` §9.4). Son sintéticos,
> diseñados para ejercitar el motor cliente (`runAnalysis`, la única
> función real e importable en Vitest sin el bloqueo de Deno) en
> escenarios representativos — no datos de un cliente real.

Fixtures: `src/lib/financial-engine.golden-cases.fixtures.ts`. Pruebas:
`src/lib/financial-engine.golden-cases.test.ts`. Todos los resultados de
este documento son **valores reales, ejecutados** contra `runAnalysis`
(no calculados a mano ni inventados).

## Caso A — Empresa estable y rentable

**Input**: sector Servicios empresariales, ingresos 5.000M COP, costo de
ventas 3.000M, opex 800M, D&A 150M, deuda 1.000M, caja 600M, patrimonio
3.000M, gastos financieros 80M, crecimiento 12%, margen EBITDA proyectado
22%, `equityWeight` 0.75/`debtWeight` 0.25.

**Resultado canónico (ejecutado)**:

| Campo | Valor |
|---|---|
| WACC | 9.92% |
| Beta re-apalancado | 1.209 |
| Costo de equity | 11.36% |
| Costo de deuda después de impuestos | 5.60% |
| Enterprise Value | COP 8.979.537.839 |
| Equity Value | COP 8.579.537.839 |
| Deuda neta | COP 400.000.000 |
| Rango EV (±1% WACC) | COP 7.801.211.634 — 10.558.154.405 |

**Comprobaciones intermedias**: margen bruto histórico 40.0%, margen
EBITDA histórico 27.0%, ROE 26.1%, ROA 19.6%, leverage 0.30x.
`waccWarning`: ninguno.

**Rango esperado**: EV positivo y del mismo orden de magnitud que los
ingresos (~1.8x revenue) — razonable para una empresa rentable de
servicios con crecimiento moderado.

**Advertencias**: ninguna — caso sin condiciones límite.

**Criterio de regresión**: si una futura corrección de fórmula cambia
alguno de estos valores en más de un 1% sin que se haya modificado
`sector`/`inputs` en el fixture, la prueba debe fallar (`toBeCloseTo`
con tolerancias estrechas en `financial-engine.golden-cases.test.ts`) y
requiere explicación explícita antes de aceptarse.

## Caso B — Empresa de alto crecimiento

**Input**: sector Software/Tecnología, ingresos 2.000M COP, costo de
ventas 900M, opex 700M, D&A 40M, deuda 200M (baja), caja 500M, patrimonio
2.500M, gastos financieros 15M, crecimiento 45% (alto), margen EBITDA
proyectado 18%, CAPEX 15%/capital de trabajo 8% de ingresos (reinversión
elevada), `equityWeight` 0.90/`debtWeight` 0.10.

**Resultado canónico (ejecutado)**:

| Campo | Valor |
|---|---|
| WACC | 11.34% |
| Beta re-apalancado | 1.315 |
| Enterprise Value | **COP −12.335.061.263** (negativo) |
| Equity Value | COP 0 (piso, `Math.max(EV−netDebt,0)`) |
| Deuda neta | COP −300.000.000 (caja > deuda) |
| Rango EV (±1% WACC) | COP −10.667.863.001 — −14.537.896.713 |

**Comprobaciones intermedias**: margen bruto histórico 55.0%, margen
EBITDA histórico 22.0%, ROE 10.8%, ROA 10.0%, leverage −0.68x (negativo,
consistente con caja > deuda).

**Rango esperado**: **no** un EV positivo grande — este caso está
diseñado para exponer la sensibilidad real del modelo a WACC/crecimiento
terminal en una empresa de alto crecimiento con reinversión intensa
(CAPEX 15% + capital de trabajo 8% de ingresos, creciendo 45%/año). El
FCFF proyectado no alcanza a ser positivo dentro del horizonte de 5 años
del modelo, y el valor terminal hereda ese signo negativo — un resultado
matemáticamente correcto dado el modelo actual, pero que expone
exactamente la "Decisión pendiente #4" (horizonte del DCF) de
`docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md`.

**Advertencias**: **el sistema hoy no emite ninguna advertencia
explícita cuando el Enterprise Value resulta negativo** — `waccWarning`
solo se activa si `WACC ≤ g terminal`, no ante un EV negativo por
reinversión intensa. Esto se registra aquí como observación para el
revisor financiero, no se corrigió en este bloque (decidir qué debería
pasar ante un EV negativo — ¿es un resultado válido que requiere
explicación al cliente, o síntoma de que el horizonte de 5 años es
insuficiente para este perfil de empresa? — es una decisión metodológica,
no un bug de código).

**Criterio de regresión**: mismo criterio que el Caso A. El signo
negativo del EV es **esperado y parte del caso** — una prueba que
"corrija" este caso para que el EV sea positivo sin cambiar el horizonte
del modelo o los supuestos de reinversión estaría enmascarando el
comportamiento real del modelo, no corrigiéndolo.

## Caso C — Empresa tensionada

**Input**: sector Manufactura, ingresos 3.000M COP, costo de ventas
2.700M (90% de ingresos), opex 500M, D&A 100M (EBITDA histórico
**negativo**: −100M), deuda 4.000M (elevada), caja 50M (limitada),
patrimonio **−500M (negativo)**, gastos financieros 350M, crecimiento
5%, margen EBITDA proyectado −3%, `equityWeight` 0.15/`debtWeight` 0.85.

**Resultado canónico (ejecutado)**:

| Campo | Valor |
|---|---|
| WACC | 10.51% |
| Beta re-apalancado | 5.861 (muy alto, consistente con `debtWeight=0.85`) |
| Enterprise Value | COP −3.747.868.119 (negativo) |
| Equity Value | COP 0 (piso) |
| Deuda neta | COP 3.950.000.000 |
| Rango EV (±1% WACC) | COP −3.347.176.934 — −4.255.555.956 |

**Comprobaciones intermedias**: margen bruto histórico 10.0%, margen
EBITDA histórico **−3.3%** (negativo, confirmado), **ROE = 0.0%**
(clamp correcto ante patrimonio negativo — no un ROE positivo
engañoso), ROA **−11.0%** (finito, refleja pérdida real sobre activos
positivos), **leverage = 0.00x** (clamp correcto: EBITDA histórico ≤ 0).

**Rango esperado**: EV negativo o cercano a cero — coherente con una
empresa con EBITDA negativo, deuda elevada y patrimonio negativo. Este
es exactamente el caso donde, per las instrucciones de este bloque, "el
sistema debe advertir cuando una metodología no sea aplicable".

**Advertencias**: al igual que en el Caso B, **no hay ninguna advertencia
explícita en el resultado** más allá de los clamps individuales de KPI
(ROE, leverage). El modelo no distingue "empresa tensionada pero
viable" de "empresa posiblemente inviable, la valoración DCF puede no
ser el método apropiado" — ver decisión pendiente #6 (patrimonio
negativo) en `DECISIONES-FINANCIERAS-PENDIENTES.md`.

**Criterio de regresión**: mismo criterio que los casos A/B. Además,
específicamente: `roe` debe seguir siendo exactamente `0` (no un valor
calculado) mientras `equity < 0`, y `leverage` debe seguir siendo
exactamente `0` mientras el EBITDA histórico sea `≤ 0` — estos dos clamps
son el comportamiento actual verificado, y cualquier cambio a ellos debe
pasar por una decisión metodológica explícita, no un ajuste incidental.

## Qué NO se declara en este documento

- Que estos 3 casos representen la distribución real de clientes de
  Velarix — son sintéticos, elegidos para cubrir 3 perfiles de riesgo
  distintos.
- Que los resultados numéricos sean "correctos" en sentido financiero —
  son el resultado real y verificado del modelo **actual**, con sus
  decisiones metodológicas pendientes sin resolver (ver
  `DECISIONES-FINANCIERAS-PENDIENTES.md`).
- Que hayan sido aprobados por nadie más que esta ejecución técnica.
