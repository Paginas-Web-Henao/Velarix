# Reporte de reconciliación metodológica — Bloque 1B-M

Fecha: 2026-07-23. Clasifica cada diferencia entre el motor cliente
(`src/lib/financial-engine.ts`) y el motor servidor
(`supabase/functions/ejecutar-calculo/index.ts`), documentadas
originalmente en `docs/velarix/bloque-1a/BL-26-tabla-comparativa-motores.md`,
en una de 5 categorías. El servidor sigue siendo la fuente canónica del
resultado financiero (`D-06`). Ninguna diferencia se convirtió
automáticamente en metodología oficial solo por ser el comportamiento
actual del cliente.

**Categorías:**
1. Bug técnico evidente (corregido en este bloque).
2. Diferencia de implementación sin impacto metodológico.
3. Decisión metodológica ya definida por documentos existentes.
4. Decisión metodológica que requiere aprobación del fundador o revisor (ver `DECISIONES-FINANCIERAS-PENDIENTES.md`).
5. Código demostrativo que debe eliminarse o reemplazarse posteriormente.

## Clasificación completa

| # | Diferencia (BL-26 §) | Categoría | Resolución en este bloque |
|---|---|---|---|
| 1 | Escenarios: servidor no variaba `capexPct`/`wcPct` por escenario, cliente sí (§3) | **1 — Bug técnico evidente** | **Corregido**: `ejecutar-calculo/index.ts::mkScenario` ahora recibe `capexDelta`/`wcDelta` y aplica el mismo piso (`Math.max(x,1)`) que el cliente. Mismos multiplicadores en ambos motores ahora. |
| 2 | 7 supuestos hardcodeados en el servidor, sin fuente única, no editables por input (§4, "Riesgo identificado") | **1 (fuente única) + 4 (¿deberían ser editables?)** | **Parcialmente corregido**: se creó `_shared/financial-methodology.ts` como fuente única versionada — el servidor ahora lee estos 7 valores (+ D&A%) de ahí, no de literales duplicados. La pregunta de si deben ser editables por `structured_input` **no se decidió** — ver decisión pendiente #1. |
| 3 | `income_statement.taxes`/`net_income` leídos y nunca usados (variables muertas en el servidor) (§2) | **5 — Código demostrativo/muerto** | **Corregido**: se eliminaron las variables locales `taxes`/`netIncome` sin uso en `ejecutar-calculo/index.ts` (el cliente nunca tuvo estos campos, nada que tocar ahí). No se decidió si el contrato de `structured_input` debería dejar de enviarlos — eso es un cambio de contrato de datos, fuera de alcance aquí. |
| 4 | KPIs de ciclo de caja del cliente (`daysReceivable=45`, `daysInventory=30`, `daysPayable=35`, `cashCycle=40`) — constantes fijas para cualquier empresa, presentadas en el PDF con evaluación "✓ Eficiente"/"⚠ Extendido" en un lugar y "Referencia demo" en otro (§3) | **5 — Código demostrativo, presentado de forma inconsistente como si fuera real** | **Corregido parcialmente**: se unificó el rótulo a "Referencia demo" en las 2 ubicaciones de `pdf-generator.ts` (antes una evaluaba "✓/⚠" sobre datos fabricados, dando una falsa señal de salud financiera). **No se corrigió** el cálculo en sí (seguir siendo valores fijos) — calcularlos con datos reales requiere que el `structured_input` capture cartera/inventario/proveedores por período, que hoy no existe de forma confiable — ver decisión pendiente #2. |
| 5 | Estructura de capital: servidor deriva `equityWeight`/`debtWeight` de saldos reales; cliente los toma como input independiente (§2) | **4 — Decisión metodológica que requiere aprobación** | No resuelto — ver decisión pendiente #3. |
| 6 | `total_assets` sintético (`totalDebt + equity`) en vez del campo real ya disponible en `structured_inputs.balance_sheet.total_assets` — en **ambos** motores (§3) | **4 — Decisión metodológica que requiere aprobación** | No resuelto — ver decisión pendiente #4. Cambiarlo altera ROA en todos los análisis retroactivamente, no es un bug de código sino una elección de qué dato usar. |
| 7 | Impuestos/utilidad neta históricos declarados pero ignorados: ambos motores siempre recalculan con tasa fija en vez de usar `net_income`/`taxes` reales del `structured_input` (§2, §9.5) | **4 — Decisión metodológica que requiere aprobación** | No resuelto — ver decisión pendiente #5. |
| 8 | `revenue === 0`: servidor lanza error explícito; cliente no, produce márgenes en `Infinity`/`NaN` (`grossMargin`, `ebitdaMargin`, `ebitMargin`, `netMargin`) (§5) | **4 — Decisión metodológica/de producto que requiere aprobación** (¿debe el cliente lanzar error, devolver `null`, o degradar con aviso?) | **No corregido** — se documentó y probó explícitamente (`financial-engine.golden-cases.test.ts`, prueba `test.fails()`) para no decidir silenciosamente la UX de error. Ver decisión pendiente #6. |
| 9 | `netIncome0`/utilidad neta histórica sin clamp cuando es negativa, a diferencia de la proyección (que sí recorta impuestos con `Math.max(ebt,0)`) — en ambos motores (§5) | **3 — Ya definido, es una inconsistencia interna consistente entre motores, no una divergencia** | No aplica corrección — mismo comportamiento en ambos motores, no hay decisión que tomar entre ellos. Queda registrado como características del modelo actual (no un bug de divergencia). |
| 10 | Manejo de moneda: servidor solo devuelve `moneda_analisis`/`factor_conversion` sin usarlos en cálculos; conversión real ya se corrigió en Bloque 1B-P0 (BL-03) (§6) | **2 — Diferencia de implementación sin impacto metodológico** | Ya resuelto en 1B-P0 (persistencia real de moneda/escala) — no requiere acción en 1B-M. |
| 11 | Forma del resultado (anidado `valuation:{...}` en servidor vs. plano en `AnalysisResult` del cliente) (§7) | **2 — Diferencia de implementación sin impacto metodológico** | Sin acción — el contrato tipado de `src/types/calculation-result.ts` (Bloque 1A, BL-31) ya define la forma canónica futura; unificar la forma real es tarea de 1C/1E, no de 1B-M. |
| 12 | ROE/ROA: fórmula idéntica en ambos motores, pero ninguno distingue "ROE sobre patrimonio promedio" vs. "ROE sobre patrimonio final" ni usa NOPAT en vez de utilidad neta para ningún indicador (§3) | **4 — Decisión metodológica que requiere aprobación** | No resuelto — ver decisión pendiente #7 (agrupa con #4, "uso de utilidad neta vs. NOPAT"). |

## Fórmulas verificadas como algebraicamente idénticas (sin cambios)

Hamada, CAPM, WACC, proyección de ingresos, FCFF, valor terminal (Gordon
Growth), sensibilidad ±1% WACC, matriz de sensibilidad 5×5, múltiplos
implícitos — confirmado de nuevo en este bloque mediante las 31 pruebas
de `financial-engine.golden-cases.test.ts`, que ejercitan estas fórmulas
sobre 3 casos sintéticos reales (no solo se re-leyó el código, se
ejecutó).

## Resumen de cambios de código en este bloque

1. `ejecutar-calculo/index.ts`: escenarios pesimista/optimista ahora
   varían `capexPct`/`wcPct` igual que el cliente (bug técnico).
2. `ejecutar-calculo/index.ts`: eliminadas 2 variables muertas
   (`taxes`, `netIncome` sin uso) (código demostrativo/muerto).
3. Nuevo `_shared/financial-methodology.ts`: fuente única y versionada
   para los 7+1 supuestos que antes eran literales duplicados dentro de
   `ejecutar-calculo/index.ts` — mismos valores exactos, ningún número
   nuevo, todos marcados `approved: false`.
4. `pdf-generator.ts`: 2 filas de KPIs demostrativos ("Días de cartera",
   "Ciclo de caja" en la sección de liquidez) dejaron de mostrar una
   evaluación "✓/⚠" sobre datos fabricados — ahora dicen "Referencia
   demo" de forma consistente con la sección de eficiencia.

Ningún cambio afectó: Hamada, CAPM, WACC, FCFF, valor terminal, la forma
de `AnalysisResult`/`calculation_result`, ni ninguna de las 7 decisiones
metodológicas listadas en `DECISIONES-FINANCIERAS-PENDIENTES.md`.
