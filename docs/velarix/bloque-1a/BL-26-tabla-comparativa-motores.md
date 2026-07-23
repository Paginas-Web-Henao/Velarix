# BL-26 — Tabla comparativa: motor servidor vs. motor cliente

Bloque 1A, `FASE-01-EXACTITUD-FINANCIERA.md`. Este documento compara
`supabase/functions/ejecutar-calculo/index.ts` (`runEngine`, servidor —
motor canónico por `D-06`) contra `src/lib/financial-engine.ts`
(`runAnalysis`, cliente). Cada afirmación cita archivo, función, líneas y
un estado: **verificado** (leído directamente en el código), **inferido**
(deducido de evidencia indirecta) o **no verificable** (no se pudo
confirmar en este entorno).

No se cambia ninguna fórmula ni se corrige ningún bug en este documento —
es un registro comparativo para habilitar el Bloque 1B.

## 1. Identidad y forma de invocación

| | Servidor (`ejecutar-calculo`) | Cliente (`financial-engine.ts`) |
|---|---|---|
| Función principal | `runEngine(input: any, sector: string, expectedGrowth: number)` — `ejecutar-calculo/index.ts:78` | `runAnalysis(inputs: FinancialInputs): AnalysisResult` — `financial-engine.ts:265` |
| Exportada | No — función interna del módulo, invocada solo dentro de `serve()` (`ejecutar-calculo/index.ts:282`) | Sí — `export function runAnalysis` |
| Tipo de entrada | `input: any` sin tipo — lee de `analysis.input_payload` (JSON de `structured_inputs`) | `FinancialInputs` — interfaz tipada, sin `any` (`financial-engine.ts:97-123`) |
| Efectos secundarios | Sí — el módulo completo ejecuta `serve(async (req) => {...})` de forma incondicional al importarse (`ejecutar-calculo/index.ts:239`); dentro del handler hace 6 llamadas a Supabase (lectura de `analyses`, escritura de `analyses`, `analysis_jobs` x2, `audit_events`) | Ninguno — función pura, sin I/O, sin dependencias de red o de base de datos |
| Runtime | Deno (imports de `https://deno.land/...`, `https://esm.sh/...`, `ejecutar-calculo/index.ts:1-2`) | Node/Vite/navegador — TypeScript estándar |
| Importable en Vitest | No — bloqueado por imports de URL + `serve()` de nivel superior (ver `BL-30-evidencia-pruebas-especificacion.md`) | Sí — sin bloqueos |
| Estado | Verificado | Verificado |

## 2. Campos de entrada — nombres y unidades

| Concepto | Servidor lee de `input.*` | Cliente lee de `FinancialInputs.*` | Estado | Nota |
|---|---|---|---|---|
| Ingresos | `income_statement.revenue` (`:83`) | `revenue` (`:101`) | Verificado | Mismo concepto, distinta forma (anidado vs. plano) |
| Costo de ventas | `income_statement.cost_of_sales` (`:84`) | `costOfSales` (`:102`) | Verificado | — |
| Gastos operativos | `income_statement.opex` (`:85`) | `opex` (`:103`) | Verificado | — |
| D&A histórico | `income_statement.da \|\| income_statement.depreciation` (`:86`) | `depreciation` (`:104`) | Verificado | Servidor acepta 2 nombres alternos; cliente solo 1 campo |
| Gastos financieros | `income_statement.interest_expense` (`:87`) | `interestExpense` (`:108`) | Verificado | — |
| Impuestos históricos | `income_statement.taxes` (`:88`) — leído pero **no usado** en ningún cálculo posterior de `runEngine` | No existe campo equivalente en `FinancialInputs` | Verificado | El servidor lee `taxes` y lo descarta; el cliente no lo modela en absoluto — ambos recalculan impuestos con una tasa fija, ninguno usa el impuesto histórico real declarado |
| Utilidad neta histórica | `income_statement.net_income` (`:89`) — leída pero **no usada** en ningún cálculo posterior | No existe campo equivalente | Verificado | Mismo patrón que impuestos: se lee y se descarta |
| Deuda financiera total | `bs.total_debt \|\| bs.financial_debt` (`:91`) — **campo inexistente**, ver R-05 | `totalDebt` (`:105`) | Verificado | El nombre real en `structured_inputs.balance_sheet` es `financial_debt_total` (`build-structured-input/index.ts:210`) — el servidor nunca lo lee correctamente |
| Caja | `bs.cash` (`:92`) | `cash` (`:106`) | Verificado | — |
| Patrimonio | `bs.equity \|\| bs.total_equity` (`:93`) | `equity` (`:107`) | Verificado | — |
| Crecimiento esperado | Parámetro `expectedGrowth`, con fallback `\|\| 25` (`:122`) | `growth` (`:110`), sin valor por defecto propio (usa `DEFAULT_INPUTS.growth = 25`) | Verificado | Incidentalmente el mismo valor (25%) en ambos, mantenido por separado |
| Margen EBITDA de entrada | No existe — el servidor **calcula** `ebitdaMargin` desde `ebitda0/revenue` (`:101`), no lo recibe como supuesto | `ebitdaMargin` (`:111`) — es un **supuesto de entrada** editable por el usuario | Verificado | Diferencia arquitectónica real: el cliente permite al usuario fijar un margen EBITDA proyectado distinto al histórico; el servidor siempre usa el margen histórico derivado |
| Tasa de impuestos | Constante fija `30` (`:102`, comentario "Colombian corporate rate") | `taxRate` (`:112`) — campo de `FinancialInputs`, configurable, default `30` (`DEFAULT_INPUTS.taxRate`) | Verificado | Ver sección 4 — mismo valor por defecto, pero el servidor lo hardcodea y el cliente lo trata como input de usuario |
| CAPEX % ingresos | Constante fija `5` (`:103`) | `capexPct` (`:113`), configurable, default `5` | Verificado | Igual que arriba |
| Capital de trabajo % | Constante fija `3` (`:104`) | `wcPct` (`:114`), configurable, default `3` | Verificado | Igual que arriba |
| Crecimiento terminal (g) | Constante fija `3` (`:105`) | `terminalGrowth` (`:115`), configurable, default `3` | Verificado | Igual que arriba |
| Costo de deuda | Constante fija `8` (`:106`) | `costOfDebt` (`:118`), configurable, default `8` | Verificado | Igual que arriba |
| Tasa libre de riesgo | Constante fija `4.35/100` (`:107`) | `riskFreeRate` (`:119`), configurable, default `4.35` | Verificado | Igual que arriba |
| ERP | Constante fija `5.80/100` (`:108`) | `erp` (`:120`), configurable, default `5.80` | Verificado | Igual que arriba |
| Peso equity/deuda | **Derivado** de los valores reales: `equity > 0 ? equity/(equity+totalDebt) : 0.70` (`:109-110`) | `equityWeight`/`debtWeight` (`:121-122`) — campos de entrada **independientes** de `totalDebt`/`equity`, configurables por el usuario, default `0.70`/`0.30` | Verificado | **Diferencia metodológica real, no un bug**: el servidor deriva la estructura de capital de los datos financieros reales; el cliente permite que el usuario declare un peso de capital que puede no coincidir con `totalDebt`/`equity` que también declaró. Ninguno de los dos documentos de negocio revisados resuelve cuál es la intención correcta — queda para revisión del revisor financiero externo en Bloque 1C |
| Moneda de análisis | `input.moneda_analisis \|\| "COP"` (`:230`, solo se **devuelve** en el resultado, no afecta ningún cálculo numérico) | No existe ningún campo de moneda en `FinancialInputs` | Verificado | Ver sección 6 |
| Sector | Parámetro `sector` (string) | `sector` (`:99`), debe matchear una clave de `SECTOR_BENCHMARKS` | Verificado | Ambos tienen fallback a `"Software / Tecnología"` si el sector no se reconoce (`ejecutar-calculo/index.ts:79`, `financial-engine.ts:266`) — coincide |

## 3. Fórmulas — comparación línea por línea

| Fórmula | Servidor | Cliente | ¿Idéntica? | Estado |
|---|---|---|---|---|
| Hamada (beta re-apalancado) | `bench.beta * (1 + (1-taxRate/100)*deRatio)` (`:114`) | `betaUnlevered * (1 + (1-taxRate/100)*deRatio)` (`financial-engine.ts:271`) | Sí, algebraicamente idéntica | Verificado |
| CAPM (costo de equity) | `riskFreeRate + betaLevered*erp` (`:117`) | `riskFreeRate/100 + betaLevered*(erp/100)` (`financial-engine.ts:274`) | Sí (el servidor ya normaliza `riskFreeRate`/`erp` a decimal en las constantes, líneas 107-108) | Verificado |
| WACC | `costOfEquity*equityWeight + costOfDebtAfterTax*debtWeight` (`:119`) | Idéntica forma (`financial-engine.ts:278`) | Sí | Verificado |
| Proyección de ingresos (5 años) | `revenue0 * (1+growth/100)^t` (`:58`, dentro de `computeProjections`) | Idéntica (`financial-engine.ts:237`) | Sí | Verificado |
| D&A proyectado | `revenue * 0.03` — constante hardcodeada, comentario "demo" en el cliente (`financial-engine.ts:241`) y sin comentario en el servidor (`:62`) | Idéntica constante `0.03` | Sí, pero **ambos** motores usan una constante de demo (3% de ingresos) para D&A proyectado, no un valor derivado del histórico ni configurable | Verificado |
| FCFF (NOPAT + D&A − CAPEX − ΔWC) | Idéntica estructura (`:68-71`) | Idéntica estructura (`financial-engine.ts:249-253`) | Sí | Verificado |
| Valor terminal (Gordon Growth) | `(lastFCFF*(1+g))/(wacc-g)`, con guarda `wacc<=g` (`:130-135`) | Idéntica, misma guarda (`financial-engine.ts:291-296`) | Sí | Verificado |
| Sensibilidad ±1% WACC | Idéntica (`:143-154`) | Idéntica (`financial-engine.ts:306-320`) | Sí | Verificado |
| Matriz de sensibilidad 5×5 | Idéntica (`:160-171`) | Idéntica (`financial-engine.ts:326-338`) | Sí | Verificado |
| Múltiplos implícitos (EV/EBITDA, EV/Revenue) | Idéntica (`:157-158`) | Idéntica (`financial-engine.ts:323-324`) | Sí | Verificado |
| Escenarios (pesimista/optimista) | `mkScenario` con los mismos multiplicadores (0.6/1.4 growth, ±3pp margen, ±1.5pp WACC) (`:189-202`) | Idénticos multiplicadores (`financial-engine.ts:366-393`) | Sí, salvo el clamp de piso (ver abajo) | Verificado |
| Clamp de piso en escenario optimista (capexPct/wcPct) | **No existe** — `mkScenario` no aplica ningún `Math.max` (`:189-198`) | `Math.max(inputs.capexPct - 1, 1)` (`financial-engine.ts:389-390`) | **No, difieren** | Verificado — diferencia real: el cliente evita que capexPct/wcPct bajen de 1% en el escenario optimista; el servidor no tiene ese piso y podría producir valores negativos si el input ya es bajo |
| KPIs (márgenes, ROE, ROA, leverage, cobertura) | Misma fórmula para cada uno (`:174-186`) | Misma fórmula para cada uno (`financial-engine.ts:341-363`) | Sí en las fórmulas comunes | Verificado |
| KPIs exclusivos del cliente | — | `daysReceivable`, `daysInventory`, `daysPayable`, `cashCycle`, `cajaMinima` (`financial-engine.ts:358-362`) — **valores fijos de demo** (45/30/35 días), no derivados de ningún dato real | El servidor no calcula estos KPIs en absoluto | Verificado — el `KPIResult` del cliente tiene 5 campos más que el del servidor, y esos 5 son datos de demostración, no reales |
| `total_assets` para ROA | `totalDebt + equity` (`:174`) — sintético, no lee `total_assets` real aunque `structured_inputs.balance_sheet.total_assets` sí existe como campo real | Idéntico: `inputs.totalDebt + inputs.equity` (`financial-engine.ts:344`) | Sí, ambos motores ignoran el `total_assets` real ya disponible en el dato de origen | Verificado — mismo defecto metodológico en ambos motores, no es una divergencia entre ellos |

## 4. Constantes y valores por defecto

| Constante | Servidor | Cliente (`DEFAULT_INPUTS`) | ¿Coinciden hoy? | Fuente única? |
|---|---|---|---|---|
| `taxRate` | `30` fijo, sin poder cambiarlo (`:102`) | `30` por defecto, pero editable por el usuario (`financial-engine.ts:138`) | Sí, hoy | No — dos literales mantenidos por separado, ningún archivo los importa de una fuente común |
| `capexPct` | `5` fijo (`:103`) | `5` por defecto, editable (`:139`) | Sí, hoy | No |
| `wcPct` | `3` fijo (`:104`) | `3` por defecto, editable (`:140`) | Sí, hoy | No |
| `terminalGrowth` | `3` fijo (`:105`) | `3` por defecto, editable (`:141`) | Sí, hoy | No |
| `costOfDebt` | `8` fijo (`:106`) | `8` por defecto, editable (`:143`) | Sí, hoy | No |
| `riskFreeRate` | `4.35` fijo (`:107`) | `4.35` por defecto, editable (`:144`) | Sí, hoy | No |
| `erp` | `5.80` fijo (`:108`) | `5.80` por defecto, editable (`:145`) | Sí, hoy | No |
| `SECTOR_BENCHMARKS` (beta, margen EBITDA sector, EV/EBITDA, EV/Revenue, WACC ref, 15 sectores) | Copia inline idéntica, sin `label`/`source`/`lastUpdated`/`vigenteHasta` (`ejecutar-calculo/index.ts:14-30`) | Copia con los mismos 15 sectores y valores numéricos, más metadatos de fuente/vigencia (`financial-engine.ts:17-93`) | Sí en los valores numéricos comparados campo por campo | No — dos copias mantenidas manualmente; el comentario en `ejecutar-calculo/index.ts:11` ("No external imports to avoid Deno resolution issues") confirma que la duplicación es intencional, no accidental, por la restricción de imports de Deno |
| TRM (tasa de cambio COP/USD) | `4080` (`build-structured-input/index.ts:32`, comentario "TRM from macro data (single source of truth)") | `4080` (`financial-engine.ts:536`, dentro de `MARKET_DATA.trm.valorActual`) | Sí, hoy | No — a pesar del comentario "single source of truth" en el servidor, es una tercera copia manual distinta del `MARKET_DATA` del cliente; ninguna se deriva de la otra |
| **Riesgo identificado** | Las 7 constantes fijas del servidor (`taxRate`...`erp`) **no pueden ser overridden** por el `input`, mientras que el cliente las trata como campos de `FinancialInputs` ajustables por el usuario en el formulario de análisis. Si el usuario ajusta alguno de estos supuestos en el formulario, el motor cliente lo refleja pero **el motor servidor (canónico por D-06) lo ignorará por completo** — esto es una divergencia de comportamiento con impacto directo en el resultado entregado, no solo un detalle de mantenimiento de constantes | | | **Riesgo** — no es un bug de código (ambos archivos hacen lo que su lógica dice), es una brecha de diseño entre lo que el formulario del cliente permite ajustar y lo que el motor canónico realmente usa. Debe resolverse en Bloque 1B o 1C: o el servidor empieza a leer estos supuestos del `input_payload`, o el formulario dejará de exponerlos como ajustables si el servidor nunca los va a usar |

## 5. Validaciones, clamps y manejo de errores

| Validación | Servidor | Cliente | Estado |
|---|---|---|---|
| `revenue === 0` | Lanza `throw new Error("Revenue es 0...")` (`:95`), capturado por el `catch` del handler → `status: "error_tecnico"` | No hay ninguna validación explícita; si `inputs.revenue === 0`, las divisiones por `inputs.revenue` en `computeProjections`/KPIs producen `Infinity`/`NaN` sin lanzar error | **No, difieren** | Verificado — riesgo latente en el cliente: un input con revenue 0 no falla explícitamente, produce resultados `NaN` que se propagarían silenciosamente hasta el PDF |
| Valores negativos en el balance | `Math.abs(...)` aplicado a casi todos los campos leídos (`:83-93`) | No hay `Math.abs` en `FinancialInputs` — los valores se usan tal como llegan | **No, difieren** | Verificado |
| `wacc <= g` (terminal) | `waccWarning` string, `terminalValue`/`discountedTV` en 0 (`:130-135`) | Idéntico patrón (`financial-engine.ts:291-296`) | Sí | Verificado |
| Recorte de impuestos proyectados negativos | `Math.max(ebt, 0) * taxRate` en `computeProjections` (`:66`) | Idéntico (`financial-engine.ts:245`) | Sí | Verificado |
| Recorte de impuestos **históricos** (`netIncome0`) | **No existe** — `netIncome0 = (ebit0 - interestExpense) * (1-taxRate/100)` sin `Math.max` (`:175`) | Idéntica ausencia de clamp (`financial-engine.ts:343`) | Sí — mismo defecto en ambos, no es una divergencia entre motores, pero sigue siendo una inconsistencia interna en cada uno (la proyección sí recorta, el histórico no) | Verificado |
| `equityValue` piso en 0 | `Math.max(enterpriseValue - netDebt, 0)` (`:140`) | Idéntico (`financial-engine.ts:303`) | Sí | Verificado |
| `netDebt` piso en 0 | No existe clamp — puede ser negativo (`:139`) | Idéntica ausencia de clamp (`financial-engine.ts:302`) | Sí, mismo comportamiento en ambos | Verificado |

## 6. Manejo de moneda

| | Servidor | Cliente |
|---|---|---|
| Campo de moneda en la entrada | `input.moneda_analisis` (default `"COP"`) y `input.factor_conversion` (default `1`) — ambos **leídos y devueltos tal cual** en el resultado (`ejecutar-calculo/index.ts:230-231`), **sin usarse en ningún cálculo numérico** | No existe ningún campo de moneda en `FinancialInputs` (`financial-engine.ts:97-123`) |
| ¿La conversión de moneda ya viene aplicada al llegar al motor? | Sí, en teoría — `build-structured-input` aplica `factorTotal` (escala × conversión) a cada valor antes de guardarlo (`build-structured-input/index.ts:186,209-210`) | No aplica — el cliente recibe valores ya convertidos por `Dashboard.tsx::handleDownloadPDF`, que los lee de `structured_inputs.input_payload` (ya procesados por el mismo `build-structured-input`) |
| ¿La conversión realmente ocurre en la práctica? | **No** — ver `BL-30-evidencia-pruebas-especificacion.md`, sección R-02/BL-03: el dato de moneda real del documento nunca se persiste desde `parse-document`, así que `build-structured-input` siempre asume `monedaDoc = "COP"` y el factor de conversión queda en `1` | Mismo problema heredado — el cliente confía ciegamente en que los valores que recibe ya están en la moneda correcta |
| Presentación en el PDF | N/A — el servidor no genera PDF | Etiqueta fija `"USD"` en 44 usos de `fUSD()` (`src/lib/pdf-generator.ts:85-86`) y en la tabla de perfil (`:433`) — nunca lee `moneda_analisis` ni ningún campo de moneda real | Verificado — ver R-03/BL-04 |
| Estado | Verificado | Verificado |

## 7. Salidas — forma del resultado

| | Servidor (`runEngine` retorna) | Cliente (`AnalysisResult`) |
|---|---|---|
| Estructura | `{ projections, scenarios, kpis, valuation: {...}, sensitivityMatrix, sectorBenchmark, moneda, factor_conversion }` (`ejecutar-calculo/index.ts:204-232`) — los campos de valoración están **anidados** bajo `valuation` | Estructura **plana**: `betaLevered`, `costOfEquity`, `wacc`, `enterpriseValue`, etc. son campos de primer nivel de `AnalysisResult` (`financial-engine.ts:200-222`), no anidados |
| Tipado | Ninguno — la función no declara un tipo de retorno; el objeto es inferido implícitamente por TypeScript/Deno, sin interfaz compartida con el cliente | `AnalysisResult` — interfaz exportada y explícita |
| Escenarios | `{ pessimistic: {...pessimistic, label}, base: {...}, optimistic: {...} }`, cada uno con `{projections, ev, assumptions}` (`:206-210`) | `{ scenarios: {pessimistic, base, optimistic} }` (arrays de `YearProjection`) **más** `scenarioAssumptions` y `scenarioEVs` como estructuras **separadas** (`financial-engine.ts:202-203,220`) — misma información, forma distinta |
| Estado | Verificado | Verificado |

## 8. Persistencia, narrativa y PDF — quién consume qué hoy

| Paso | ¿Ocurre hoy? | Evidencia |
|---|---|---|
| `runEngine` (servidor) se invoca | Sí, cuando se llama la Edge Function `ejecutar-calculo` | `ejecutar-calculo/index.ts:282` |
| El resultado del servidor se persiste | Sí — `analyses.calculation_result` (`ejecutar-calculo/index.ts:288-291`) | Verificado |
| El resultado del servidor llega a `generate-narrative` | No — `generate-narrative` no se invoca en el flujo real (confirmado en auditoría previa, `auditoria/04`, `auditoria/08`; no se re-verifica aquí porque no cambió desde la auditoría) | Inferido (heredado de auditoría anterior, no re-leído en este bloque) |
| El resultado del servidor llega al PDF | **No** — `Dashboard.tsx::handleDownloadPDF` (`:64-133`) lee `structured_inputs.input_payload` directamente (NO `analyses.calculation_result`), reconstruye un objeto `FinancialInputs` a mano (`:106-122`) y vuelve a ejecutar `runAnalysis` (motor **cliente**) en el navegador (`:124`) antes de llamar a `generatePDF` (`:125`) | Verificado — esta es la arquitectura "split-brain" ya decidida en `D-06`/`D-07`; este documento no reabre esa decisión, solo confirma con líneas exactas que sigue vigente hoy |
| ¿`Dashboard.tsx` usa el nombre de campo correcto al leer la deuda? | Sí — `Number(bs.financial_debt_total) || 0` (`Dashboard.tsx:97`) | Verificado — contraste directo con el bug de `ejecutar-calculo:91`, que es el único de los 3 consumidores que usa el nombre equivocado |

## 9. Diferencias sin explicación documentada (a resolver en 1B/1C, no en 1A)

1. **Estructura de capital**: servidor deriva `equityWeight`/`debtWeight` de los saldos reales; cliente los toma como input independiente del usuario (sección 2). Ninguno de los documentos de negocio revisados (`Negocio_Velarix_v4.1.md`) especifica cuál es la intención metodológica correcta.
2. **Clamp de piso en escenario optimista**: presente solo en el cliente (sección 3). No hay razón documentada de por qué el servidor no lo tiene.
3. **7 supuestos hardcodeados en el servidor** (`taxRate`, `capexPct`, `wcPct`, `terminalGrowth`, `costOfDebt`, `riskFreeRate`, `erp`) que el cliente sí expone como ajustables — riesgo directo si el motor servidor se activa como canónico sin resolver esto (sección 4).
4. **KPIs de ciclo de caja** (`daysReceivable`, `daysInventory`, `daysPayable`, `cashCycle`, `cajaMinima`) solo existen en el cliente y son datos de demostración fijos, no reales — no está documentado si el servidor debería calcularlos también, o si deberían eliminarse del PDF hasta tener datos reales.
5. **Impuestos y utilidad neta históricos** (`income_statement.taxes`, `income_statement.net_income`) se leen del `structured_input` pero ningún motor los usa — no está documentado si esto es intencional (ambos motores siempre recalculan con tasa fija) o un dato muerto que debería eliminarse del contrato de `structured_inputs`.

Estas 5 diferencias no se resuelven en el Bloque 1A — quedan registradas
aquí para que el Bloque 1B las tome como entrada, y para que el revisor
financiero externo (`Negocio_Velarix_v4.1.md` §9.4) las revise antes de
que cualquiera de los dos motores se declare metodológicamente cerrado.
