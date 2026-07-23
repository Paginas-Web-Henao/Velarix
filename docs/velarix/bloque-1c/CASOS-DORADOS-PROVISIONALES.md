# Casos dorados provisionales — Bloque 1C-Prep

> **Caso dorado técnico provisional — pendiente de aprobación
> financiera.** Ninguno de estos 3 casos, ni los resultados que
> producen, fue revisado ni aprobado por el fundador ni por un revisor
> financiero externo (`Negocio_Velarix_v4.1.md` §9.4). Son sintéticos,
> diseñados para ejercitar el motor cliente (`runAnalysis`, la única
> función real e importable en Vitest sin el bloqueo de Deno) en
> escenarios representativos — no datos de un cliente real.

**Corrección de lenguaje (cierre técnico, 2026-07-23)**: los resultados
canónicos son **únicamente** los producidos por
`runCanonicalFinancialEngine` (`_shared/canonical-financial-engine.ts`,
el motor que usa `ejecutar-calculo`). Los resultados de `runAnalysis`
(motor cliente) son una **referencia del motor cliente**, no un
"resultado canónico" — corregido en todo este documento.

Fixtures cliente: `src/lib/financial-engine.golden-cases.fixtures.ts`
(pruebas: `financial-engine.golden-cases.test.ts`). Fixtures servidor:
`supabase/functions/_shared/canonical-financial-engine.golden-cases.fixtures.ts`
(pruebas de regresión: `canonical-financial-engine.golden-cases.test.ts`).
Todos los resultados de este documento son **valores reales, ejecutados**
(no calculados a mano ni inventados).

## Caso A — Empresa estable y rentable

**Input**: sector Servicios empresariales, ingresos 5.000M COP, costo de
ventas 3.000M, opex 800M, D&A 150M, deuda 1.000M, caja 600M, patrimonio
3.000M, gastos financieros 80M, crecimiento 12%, margen EBITDA proyectado
22%, `equityWeight` 0.75/`debtWeight` 0.25.

**Resultado canónico (servidor, `runCanonicalFinancialEngine`, ejecutado)**:

| Campo | Valor |
|---|---|
| WACC | 9.9202% |
| Beta re-apalancado | 1.2087 |
| Costo de equity | 11.3603% |
| Costo de deuda después de impuestos | 5.60% |
| Enterprise Value | COP 12.766.089.939 |
| Equity Value | COP 12.366.089.939 |
| Deuda neta | COP 400.000.000 |
| Rango EV (±1% WACC) | COP 11.090.879.191 — 15.010.388.190 |
| FCFF Y1 / Y5 | COP 660.800.000 / COP 1.039.781.593 |
| Valor terminal | COP 15.476.070.647 |
| `waccWarning` | ninguno |

**Referencia del motor cliente (`runAnalysis`, no canónico)**:

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

**Comprobaciones intermedias (cliente)**: margen bruto histórico 40.0%,
margen EBITDA histórico 27.0%, ROE 26.1%, ROA 19.6%, leverage 0.30x.
`waccWarning`: ninguno.

**Rango esperado**: EV positivo y del mismo orden de magnitud que los
ingresos (~1.8x revenue) — razonable para una empresa rentable de
servicios con crecimiento moderado.

**Advertencias**: ninguna — caso sin condiciones límite.

**Criterio de regresión**: los valores del servidor (canónicos) están
fijados como constantes esperadas con tolerancia explícita (0.01pp para
tasas, 0.1%/1000 para montos) en
`canonical-financial-engine.golden-cases.test.ts` — una modificación
futura material en WACC/EV/equity value hace fallar esas pruebas. Los
valores del cliente (`financial-engine.golden-cases.test.ts`) **no**
tienen esa misma aserción de regresión numérica fija — esas pruebas
verifican identidades internas (p. ej. `fcff = nopat + D&A − capex − ΔWC`)
y propiedades (p. ej. WACC entre costo de equity y costo de deuda), no
un valor concreto esperado; no se afirma que detecten un cambio mayor al
1% en el cliente porque no existe esa aserción todavía.

## Caso B — Empresa de alto crecimiento

**Input**: sector Software/Tecnología, ingresos 2.000M COP, costo de
ventas 900M, opex 700M, D&A 40M, deuda 200M (baja), caja 500M, patrimonio
2.500M, gastos financieros 15M, crecimiento 45% (alto), margen EBITDA
proyectado 18%, CAPEX 15%/capital de trabajo 8% de ingresos (reinversión
elevada), `equityWeight` 0.90/`debtWeight` 0.10.

**Resultado canónico (servidor, `runCanonicalFinancialEngine`, ejecutado)**:

| Campo | Valor |
|---|---|
| WACC | 11.3613% |
| Beta re-apalancado | 1.2883 |
| Enterprise Value | COP 9.615.506.880 (**positivo**, a diferencia del cliente) |
| Equity Value | COP 9.915.506.880 |
| Deuda neta | COP −300.000.000 (caja > deuda) |
| Rango EV (±1% WACC) | COP 8.438.649.357 — 11.119.494.986 |
| FCFF Y1 / Y5 | COP 240.700.000 / COP 1.064.015.854 |
| Valor terminal | COP 13.107.172.559 |
| `waccWarning` | ninguno |

**Referencia del motor cliente (`runAnalysis`, no canónico)**:

| Campo | Valor |
|---|---|
| WACC | 11.34% |
| Beta re-apalancado | 1.315 |
| Enterprise Value | **COP −12.335.061.263** (negativo) |
| Equity Value | COP 0 (piso, `Math.max(EV−netDebt,0)`) |
| Deuda neta | COP −300.000.000 (caja > deuda) |
| Rango EV (±1% WACC) | COP −10.667.863.001 — −14.537.896.713 |

**Comprobaciones intermedias (cliente)**: margen bruto histórico 55.0%,
margen EBITDA histórico 22.0%, ROE 10.8%, ROA 10.0%, leverage −0.68x
(negativo, consistente con caja > deuda).

**Causa conocida de la diferencia de signo entre motores**: el servidor
deriva `ebitdaMargin` del histórico real (22% aquí, igual que el
cliente en este caso particular) pero **nunca varía `capexPct`/`wcPct`
por escenario ni acepta el 15%/8% de reinversión intensa** que este
fixture declaró para el cliente — el servidor siempre usa el 5%/3% fijo
de `_shared/financial-methodology.ts`. Con menos reinversión asumida, el
FCFF proyectado del servidor es positivo antes de lo que sería con
15%/8%, produciendo un EV positivo en vez de negativo. Ver decisión
pendiente #9 (`_shared/financial-methodology.ts`, si estos supuestos
deben ser editables) — no se corrigió aquí.

**Rango esperado**: los dos motores producen signos **distintos** para
este caso, y ambos son resultados legítimos de sus respectivos modelos
actuales — no un error de cálculo en ninguno de los dos. La referencia
del cliente (EV negativo) expone la sensibilidad real del modelo a
WACC/crecimiento terminal cuando sí se asume reinversión intensa
(CAPEX 15%/capital de trabajo 8%, creciendo 45%/año): el FCFF proyectado
no alcanza a ser positivo dentro del horizonte de 5 años, y el valor
terminal hereda ese signo negativo — expone exactamente la "Decisión
pendiente #4" (horizonte del DCF). El resultado canónico del servidor es
positivo precisamente porque **no puede reflejar** esa reinversión
intensa (supuestos fijos de `_shared/financial-methodology.ts`) — expone
la "Decisión pendiente #9".

**Advertencias**: **ninguno de los dos motores emite una advertencia
explícita cuando el Enterprise Value resulta negativo** — `waccWarning`
solo se activa si `WACC ≤ g terminal`. Esto se registra aquí como
observación para el revisor financiero, no se corrigió en este bloque
(decidir qué debería pasar ante un EV negativo es una decisión
metodológica, no un bug de código).

**Criterio de regresión**: `canonical-financial-engine.golden-cases.test.ts`
fija el EV **positivo** del servidor como regresión numérica (tolerancia
0.1%/1000, ver `MATRIZ-DE-PRUEBAS-FINANCIERAS.md`). El signo negativo del
EV del cliente sigue siendo parte de su caracterización
(`financial-engine.golden-cases.test.ts`) — una prueba que "corrija"
cualquiera de los dos resultados para que coincidan con el otro, sin que
medie una decisión metodológica aprobada, estaría enmascarando el
comportamiento real de cada modelo, no corrigiéndolo.

## Caso C — Empresa tensionada

**Input**: sector Manufactura, ingresos 3.000M COP, costo de ventas
2.700M (90% de ingresos), opex 500M, D&A 100M (EBITDA histórico
**negativo**: −100M), deuda 4.000M (elevada), caja 50M (limitada),
patrimonio **−500M (negativo)**, gastos financieros 350M, crecimiento
5%, margen EBITDA proyectado −3%, `equityWeight` 0.15/`debtWeight` 0.85.

**Resultado canónico (servidor, `runCanonicalFinancialEngine`, ejecutado)**:

| Campo | Valor |
|---|---|
| WACC | 10.4800% |
| Beta re-apalancado | 7.788 (extremo — ver causa conocida abajo) |
| Enterprise Value | COP −4.239.525.044 (negativo) |
| Equity Value | COP 0 (piso) |
| Deuda neta | COP 3.950.000.000 (idéntico al cliente — no depende del signo de `equity`) |
| Rango EV (±1% WACC) | COP −3.734.482.028 — −4.900.687.389 |
| FCFF Y1 / Y5 | COP −297.150.000 / COP −361.187.682 |
| Valor terminal | COP −4.973.544.147 |
| `waccWarning` | ninguno |

**Referencia del motor cliente (`runAnalysis`, no canónico)**:

| Campo | Valor |
|---|---|
| WACC | 10.51% |
| Beta re-apalancado | 5.861 |
| Enterprise Value | COP −3.747.868.119 (negativo) |
| Equity Value | COP 0 (piso) |
| Deuda neta | COP 3.950.000.000 |
| Rango EV (±1% WACC) | COP −3.347.176.934 — −4.255.555.956 |

**Comprobaciones intermedias (cliente)**: margen bruto histórico 10.0%,
margen EBITDA histórico **−3.3%** (negativo, confirmado), **ROE = 0.0%**
(clamp correcto ante patrimonio negativo — no un ROE positivo
engañoso), ROA **−11.0%** (finito, refleja pérdida real sobre activos
positivos), **leverage = 0.00x** (clamp correcto: EBITDA histórico ≤ 0).

**Comprobaciones intermedias (servidor) — hallazgo nuevo**: el servidor
reporta **ROE = −77%**, no `0`. Causa conocida: `runCanonicalFinancialEngine`
aplica `Math.abs()` al patrimonio antes de cualquier cálculo, así que el
patrimonio negativo (−COP 500M) se convierte en +COP 500M — el clamp
`equity > 0 ? ... : 0` nunca detecta que el patrimonio era negativo, y
además ese patrimonio "positivo" artificial infla el apalancamiento
efectivo en Hamada, produciendo el beta extremo de 7.788 (vs. 5.861 del
cliente, que sí usa el patrimonio con signo real). Este es un hallazgo
del cierre técnico, no corregido — ver decisión pendiente #6 (refinada)
en `DECISIONES-FINANCIERAS-PENDIENTES.md`.

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

**Criterio de regresión**: mismo criterio que los casos A/B (regresión
numérica del servidor en `canonical-financial-engine.golden-cases.test.ts`,
caracterización del cliente en `financial-engine.golden-cases.test.ts`).
Específicamente para el **cliente**: `roe` debe seguir siendo exactamente
`0` (no un valor calculado) mientras `equity < 0`. Para el **servidor**:
`roe` hoy es `−77%`, no `0` — ese es el comportamiento actual verificado
del servidor (no un criterio de que "debería" ser así), y cualquier
cambio a cualquiera de los dos clamps debe pasar por una decisión
metodológica explícita, no un ajuste incidental. `leverage = 0` (EBITDA
histórico `≤ 0`) sí es idéntico en ambos motores.

## Comparación servidor (canónico) vs. cliente (referencia)

| Campo | Caso | Servidor | Cliente | Diferencia | Causa conocida | Decisión pendiente |
|---|---|---|---|---|---|---|
| Enterprise Value | A | 12.766.089.939 | 8.979.537.839 | +42% | Servidor deriva `ebitdaMargin` del histórico (27%); cliente lo tomó como supuesto independiente (22%) | #7 (uso de margen histórico vs. supuesto) |
| Enterprise Value | B | 9.615.506.880 (+) | −12.335.061.263 (−) | Signo opuesto | Servidor usa capex/wc fijos (5%/3%); cliente asumió reinversión intensa (15%/8%) que el servidor no puede reflejar | #9 (supuestos editables) |
| Enterprise Value | C | −4.239.525.044 | −3.747.868.119 | ~13% | Beta re-apalancado distinto (7.788 vs 5.861) por el `Math.abs()` del servidor sobre patrimonio negativo | #6 (patrimonio negativo, refinada) |
| ROE | C | −77% | 0% | Total | `Math.abs()` del servidor sobre patrimonio impide que su clamp de ROE detecte el patrimonio negativo | #6 (patrimonio negativo, refinada) |
| Deuda neta | A/B/C | Idéntica en los 3 casos | Idéntica en los 3 casos | Ninguna | `netDebt = totalDebt − cash` no depende del signo de `equity` en ningún motor | — |
| `waccWarning` | A/B/C | `null` en los 3 | `null` en los 3 | Ninguna | Ningún caso cruza `WACC ≤ g` | — (ver R-20: ninguno advierte ante EV negativo) |

No se forzó igualdad entre servidor y cliente en ninguna de estas filas —
las diferencias con causa conocida y decisión pendiente permanecen
exactamente como el modelo actual las produce.

## Qué NO se declara en este documento

- Que estos 3 casos representen la distribución real de clientes de
  Velarix — son sintéticos, elegidos para cubrir 3 perfiles de riesgo
  distintos.
- Que los resultados numéricos sean "correctos" en sentido financiero —
  son el resultado real y verificado del modelo **actual**, con sus
  decisiones metodológicas pendientes sin resolver (ver
  `DECISIONES-FINANCIERAS-PENDIENTES.md`).
- Que hayan sido aprobados por nadie más que esta ejecución técnica.
