# Auditoría del motor financiero vs. metodología congelada (Bloque 3A)

**Versión:** 1.3
**Fecha:** 2026-09-03
**Autoridad metodológica:** `04-VALUATION-METHODOLOGY-V5.md` v1.1 (commit `6748a6a`). Donde `01`/`02`/`03` divergen de `04` v1.1, manda `04`.
**Naturaleza:** auditoría de solo lectura. No se modificó código, tests, migraciones ni Supabase. No se ejecutó Alpina.
**Precede a v1.2** de este mismo documento. Esta revisión (Bloque 3A.3) aplica una única corrección arquitectónica sobre §7 (y los tests derivados de §10): v1.2 recomendaba agregar `resolved_assumptions` completos dentro de `source_input_snapshot` — eso mezcla **Evidence** con **Judgment**, exactamente la distinción que `04 §1` exige mantener separada. `source_input_snapshot` vuelve a representar únicamente evidencia fuente/inputs financieros; los supuestos resueltos pasan a congelarse en un snapshot propio y separado (`resolved_assumptions_used`) dentro del envelope del resultado. No se reabrió ningún otro contenido de v1.2 — severidades, working capital, capital structure, los 13 campos del contrato, preflight y el minimal correction set quedan exactamente como en v1.2.

---

## 1. Executive verdict

**El motor NO puede ejecutar Alpina hoy a través del flujo real (`ejecutar-calculo`) — y esto es independiente de si sus inputs son correctos.**

`calculation-preflight.ts::findUnapprovedAssumptions()` agrega incondicionalmente los 8 supuestos de `CANONICAL_METHODOLOGY` (todos `approved: false`) más `"projection_horizon_years"` a `unapproved_assumptions`. No existe ningún mecanismo que pueda vaciar esa lista. `ejecutar-calculo/index.ts:206` bloquea con HTTP 409 antes de invocar el motor. Es comportamiento conocido y documentado en el propio código.

No se acepta como ruta oficial invocar el motor puro saltándose `ejecutar-calculo`/preflight. Alpina debe demostrar `evidence → human judgment → resolved assumptions → preflight → deterministic calculation`. Esto no exige roles ni workflows de aprobación — exige que el preflight tenga una pregunta legítima que responder (§5).

### Root causes — versión final

| Root cause | Ubicación | Severidad final | Por qué |
|---|---|---|---|
| **RC-1** — `Math.abs()` destruye el signo de `equity` | `canonical-input-normalization.ts:63` | **P0** | Vinculante por Decisión 6 independientemente de si el signo alimenta o no el WACC — también afecta KPIs (ROE) y trazabilidad de datos |
| **RC-2** — el motor puede determinar automáticamente los weights del WACC a partir de book equity (positivo, cero o negativo), sin pasar por un supuesto de estructura de capital resuelto | `capital-structure.ts:49` | **P0** | `04 §10.1` nunca sanciona book value como proxy no cuestionado de weights de mercado/económicos — esto aplica siempre, no solo cuando equity es negativo (corrección de v1.1, ver §4) |
| **RC-3** — no existe ningún contrato de supuestos metodológicos resueltos que preflight y motor puedan consumir | `calculation-preflight.ts`, `capital-structure.ts`, `canonical-financial-engine.ts` | **P0** | Única causa detrás de: preflight nunca pasa; no hay canal para WACC/tax/CAPEX/D&A/WC/g resueltos; RC-2 no puede resolverse sin este contrato |
| **RC-4** — el driver de capital de trabajo no deriva de Operating NWC real, sin trayectoria consistente con el crecimiento | `canonical-financial-engine.ts:156` | **P1** (reclasificado — ver §3) | Magnitud del impacto depende de evidencia real de Alpina, no está probado que la fórmula en sí sea inválida |

**P0 root causes: 3. P1 root causes: 1.** No se cuentan por separado los síntomas de una misma root cause (ver v1.1 §1 para el razonamiento completo de por qué "Hallazgo B" no es un blocker independiente).

### Conteo de hallazgos (findings) por severidad — actualizado

| Severidad | Cantidad |
|---|---|
| P0 | 4 (mapeados a 3 root causes) |
| P1 | 6 (mapeados a 1 root cause + 5 sin root cause de código, resolubles como juicio de caso) |
| P2 | 6 |
| P3 | 3 |

13/13 mismatches originales confirmados. 6 hallazgos adicionales.

---

## 2. Architecture traced

Sin cambios respecto a v1.1 — pipeline verificado:

```
account_homologations (Supabase)
        │
        ▼
structured-input-derivations.ts::deriveCoreFinancialFields()
   — AUSENTE≠0 correctamente implementado.
        │
        ▼
structured-input-builder.ts::buildCanonicalStructuredInput()
   — usada por build-structured-input/index.ts:124 y
     continuar-tras-revision/index.ts:237 (misma función).
        │
        ▼
structured_inputs.input_payload (Supabase, fuente canónica única)
        │
        ▼
ejecutar-calculo/index.ts
   1. resolveStructuredInput()
   2. Minimum Expediente Checkpoint — no es gate financiero.
   3. Calculation Preflight — BLOQUEA SIEMPRE hoy (RC-3, §5).
   4. runCanonicalFinancialEngine() — línea 238, recibe SOLO
      (input, sector, expected_growth). Ningún canal de supuestos
      resueltos (RC-3).
        │
        ▼
canonical-financial-engine.ts::runCanonicalFinancialEngine()
   a. canonical-input-normalization.ts — Math.abs() (RC-1 en línea 63).
   b. capital-structure.ts::computeCapitalStructure() — RC-2 en línea 49.
   c. computeProjections() — deltaWC en línea 156 (RC-4).
   d. Terminal value, EV/Equity, sensibilidad, escenarios.
        │
        ▼
calculation-fingerprint.ts / calculation-versioning.ts /
source-input-snapshot.ts / calculation-provenance.ts
   — ver §7 (auditoría nueva de esta versión): ninguno de estos
     módulos capturaría hoy un campo `resolved_assumptions` sin
     modificación explícita.
        │
        ▼
analyses.calculation_result (Supabase)
```

---

## 3. Working capital — severidad y semántica corregidas

**Corrección respecto a v1.1**: la v1.1 afirmó, como hecho, que `deltaWC = revenue × wcPct` "confunde nivel de NWC con ΔNWC" bajo cualquier interpretación. Eso fue impreciso. La evidencia recogida (`pdf-generator.ts:1105` etiqueta el campo `"Δ Capital de trabajo"`; `DECISIONES-FINANCIERAS-PENDIENTES.md:109-121` lo trata como intensidad de reinversión anual, en paralelo con CAPEX) apunta consistentemente a que `wcPct` **siempre fue conceptualizado como `ΔNWC/Revenue`**, un supuesto de flujo — nunca como una razón de nivel (`NWC/Revenue`). Bajo esa lectura, **la fórmula `deltaWC_t = revenue_t × wcPct%` es algebraicamente válida** para lo que dice calcular — no hay ningún error de álgebra que afirmar como hecho.

**El mismatch real frente a `04 §7` no es de fórmula — es de derivación y coherencia:**

- El supuesto (`wcPct=3`, fijo) no deriva del Operating NWC observado de ninguna empresa — no hay ningún cálculo, en ningún punto del código o su historia, que lo haya calibrado contra AR/inventario/AP reales.
- No existe vínculo explícito entre `wcPct` y los saldos de AR/inventario/AP que `structured_input` sí captura (`structured-input-builder.ts:177-179`) pero que el motor nunca lee.
- No existe ninguna trayectoria que relacione `wcPct` con el crecimiento (`04 §7.2` exige que ΔNWC se relacione con el crecimiento de ingresos) — es el mismo valor fijo en el año 1 (con `growth=45%` en el Caso B) que en el año terminal (con `g=3%`), sin ninguna verificación de que ambos sean coherentes con sus respectivos regímenes de crecimiento.
- Puede producir, para un caso específico, una reinversión terminal económicamente incoherente frente a `04 §11` (`Reinvestment Rate = g/ROC`) — pero esto es una posibilidad a verificar con datos reales, no un hecho ya demostrado con los golden cases actuales (que no fueron diseñados para probar esto).

**Severidad revisada: P1 material confirmado.** Escala a P0 únicamente si una cuantificación con datos reales de Alpina demuestra que la magnitud de la distorsión es material para EV/FCFF — cuantificación que no corresponde hacer todavía, porque Alpina no ha comenzado.

### Solución mínima recomendada para v5.0

**`explicit_delta_nwc_by_year`** dentro de `ResolvedCalculationAssumptions` (§6): un arreglo de valores de ΔNWC ya resueltos, uno por año del horizonte, calculados fuera del motor a partir de una proyección trazable de AR, inventario, AP y otros activos/pasivos operativos materiales de Alpina. El motor consume esos valores directamente en el FCFF, sin ninguna lógica de derivación interna.

Esto es metodológicamente correcto (deriva de Operating NWC real, vía juicio humano documentado), reproducible (los 5 valores quedan fijos y trazables en el Expediente), y evita construir un modelo genérico de *working-capital days* o de arrastre de stock dentro del motor para un solo caso activo.

La alternativa general (`baseOperatingNwc` + razones de NWC/Revenue proyectadas, con el motor calculando el delta internamente) permanece como alternativa futura, útil si Velarix llega a tener múltiples casos con esta necesidad — se clasifica **`NOT BUILDING IN V5.0`**, salvo que durante la construcción del Expediente de Alpina aparezca una razón material concreta para necesitarla (por ejemplo, si `explicit_delta_nwc_by_year` resulta insuficiente para capturar una dinámica de capital de trabajo que cambia de forma no lineal).

---

## 4. Capital structure — el book equity nunca decide el WACC en v5 (corrección de §8 de v1.1)

La v1.1 trataba `equity=0` como un caso donde el fallback 70/30 seguía siendo "legítimo" y solo `equity<0` exigía resolución explícita. Eso era insuficientemente estricto frente a `04 §10.1`: **los weights del WACC deben ser market/economic/target weights defendibles — el book equity, sea cual sea su signo, nunca es por sí solo esa base.** Para cualquier ejecución oficial v5 (Alpina incluido), `ResolvedCalculationAssumptions.capital_structure` es obligatorio **independientemente** de que el book equity observado sea positivo, cero o negativo. El book equity se conserva siempre como evidencia y verificación de sanidad — nunca como la fuente que decide el cálculo.

| Estado del book equity | Tratamiento |
|---|---|
| **Positivo** | Se preserva. Puede usarse como referencia/verificación de sanidad frente a la estructura resuelta. **No** determina automáticamente los weights del WACC en una ejecución v5. |
| **Cero** | Se preserva. **No** equivale a ausente. **No** activa automáticamente 70/30 en v5. |
| **Negativo** | Se preserva (RC-1, sin `Math.abs()`). ROE = no interpretable/N/A + alerta. Sin Hamada mecánica sobre D/E contable. Sin fallback 70/30. Exige `capital_structure` resuelta. |
| **Ausente** | El preflight debe señalarlo como evidencia faltante (mecanismo `INPUT_MISSING` ya existente). Tampoco implica automáticamente una estructura 70/30 en una ejecución v5. |

### Legacy compatibility vs. v5 canonical behavior

El fallback mecánico actual (`equityWeight = equity>0 ? equity/(equity+totalDebt) : 0.70`) puede **mantenerse como comportamiento legacy**, exclusivamente para no romper los golden cases históricos (A/B/C), que no pasan ni pasarán `resolved_assumptions`. La regla de discriminación recomendada (no implementada): si una ejecución **no** provee `resolved_assumptions.capital_structure`, el motor cae al comportamiento mecánico actual sin cambios (compatibilidad total con los 3 golden cases existentes); si una ejecución **sí** provee `resolved_assumptions`, el motor **nunca** debe tocar la rama mecánica/70-30 — usa exclusivamente los weights resueltos. Esto separa limpiamente:

> **legacy compatibility** (comportamiento histórico, preservado para no invalidar tests existentes) **de v5 canonical behavior** (comportamiento exigido para cualquier caso nuevo bajo esta metodología, Alpina incluido).

### Interacción RC-1 × RC-2 (sin cambios de fondo respecto a v1.1, reencuadrada)

Con `equity: -500_000_000` (golden Case C): `Math.abs()` (RC-1) lo convierte en `+500_000_000` antes de llegar a `computeCapitalStructure`, donde `equity>0` (RC-2) evalúa verdadero y calcula una estructura de capital "normal" para una empresa con patrimonio negativo real (`betaLevered=7.788`, verificado algebraicamente contra `EXPECTED_CASE_C`). Corregir solo RC-1 sin RC-2 simplemente cambiaría qué rama incorrecta se ejecuta (de "fingir positivo" a "70/30 silencioso ante negativo") — ninguna corrección aislada resuelve nada. Bajo la regla ampliada de esta sección, esto deja de ser un caso especial de equity negativo: **ninguna ejecución v5 debería llegar nunca a esta rama mecánica**, sin importar el signo.

---

## 5. Preflight — pregunta correcta y validación mínima

La pregunta que el preflight v5 debe responder:

> ¿Están presentes los inputs financieros materiales, y todos los supuestos metodológicos requeridos para esta ejecución han sido explícitamente resueltos y documentados?

**No**: "¿los defaults globales están `approved=true`?" (pregunta que nunca puede responderse afirmativamente, RC-3). **Tampoco**: "¿existe un objeto cualquiera llamado `resolved_assumptions`?" (una verificación de presencia vacía de contenido no es una validación real).

### Validación mínima por cada supuesto resuelto

Para cada uno de los 13 puntos de §6, el preflight debe verificar, como mínimo:

- **Presencia** — el campo existe en `resolved_assumptions`.
- **Valor** — numérico, finito, dentro de un rango plausible cuando aplique (p. ej. un peso de estructura de capital no puede ser negativo ni mayor a 1).
- **Unidad** — declarada cuando corresponda (porcentaje, razón, años).
- **Source** — de dónde proviene el valor (cálculo propio, fuente primaria, benchmark).
- **Rationale** — por qué es razonable para este caso.
- **Status** — literalmente `"resolved"` (no `"approved"` — el motor y el preflight no aprueban nada, verifican que la resolución ya ocurrió, `04 §17`).

### Verificaciones de compatibilidad con lo que el motor realmente soporta

- `projection_horizon_years` resuelto debe ser exactamente `5` mientras el motor no soporte otro valor. Si el juicio del caso concluye que 5 años bastan para la convergencia de Alpina, `projection_horizon_years=5` es un supuesto resuelto válido y documentado — no hace falta hacer el horizonte configurable para que esto pase el preflight. Si Alpina requiriera un horizonte distinto, eso se detecta aquí, **antes** de calcular, como un mismatch condicional ya conocido (`04 §9`) — no como un bloqueo silencioso ni como una ejecución con un horizonte incorrecto.
- Los componentes de `capital_structure` deben ser suficientes para recomponer Ke/WACC (risk-free local, beta, ERP maduro, CRP, lambda, costo de deuda, weights) — todos presentes juntos, no parcialmente.
- `capital_structure.equity_weight + capital_structure.debt_weight` debe sumar 1 (con tolerancia de redondeo razonable).
- `country_risk_lambda` (RC-5, 4F.2) — coherencia del modo elegido, mutuamente excluyente: si `mode = observed_revenue_exposure`, `domesticRevenuePctCompany` y `domesticRevenuePctMarketAvg` deben estar presentes, ser numéricos finitos, `company` en `[0,100]` y `market` en `(0,100]`, y `value` debe ser numéricamente coherente con `domesticRevenuePctCompany / domesticRevenuePctMarketAvg` dentro de una tolerancia explícita razonable (nunca igualdad floating-point exacta) — el modo no puede convertirse en tres números independientes que solo aparenten trazabilidad. Si `mode = direct_documented_judgment`, ambos porcentajes deben estar **ausentes** (su presencia bloquea, aunque hayan sido construidos dinámicamente evadiendo el tipo de TypeScript) y `value` debe ser un número finito — la metodología no exige `value = 1`, solo que Alpina lo use así (`04 §10.4`). `mode` ausente o desconocido bloquea en ambos casos.
- `explicit_delta_nwc_by_year` debe tener exactamente la misma longitud que `projection_horizon_years` resuelto.
- `terminal_g < WACC`: esta verificación específica depende de un WACC ya calculado, que no existe todavía en el momento del preflight — se recomienda mantenerla donde ya vive correctamente hoy, como guardia del motor (`waccWarning`, ya implementado y verificado en `04 §11.1`/v1.1 §3), no duplicarla como una segunda verificación previa en el preflight que exigiría recalcular el WACC dos veces.

No se propone ningún sistema de aprobaciones, roles ni workflow — esto es una función pura de validación estructural, del mismo estilo que `evaluateCalculationPreflight` ya tiene hoy para `missing_inputs`.

---

## 6. `ResolvedCalculationAssumptions` — contrato completo (13 puntos)

Reauditados contra los blockers reales de `calculation-preflight.ts::findUnapprovedAssumptions()` (8 supuestos de `CANONICAL_METHODOLOGY` + `projection_horizon_years` = 9) más los puntos adicionales que la metodología `04` exige resolver y que la v1.1 dejó fuera (WACC desagregado en sus componentes, D&A). El contrato representa la metodología v5 — no copia 1:1 el modelo de 8 supuestos antiguo.

| # | Campo | Contenido mínimo | ¿Required for Alpina? |
|---|---|---|---|
| 1 | `tax_treatment` | Tasa marginal (verificada, ej. 35% DIAN), tratamiento efectivo/cash si hay NOLs, notas de realización (`04 §6.4`) | **Sí** |
| 2 | `capital_structure` | `equity_weight`, `debt_weight`, `source` (comparables/objetivo/óptima/iterativa), referencia de book equity como sanity check | **Sí** |
| 3 | `risk_free_rate_construction` | Risk-free de referencia (moneda limpia), diferencial de inflación, risk-free local resultante (relación de Fisher, `04 §10.3`) | **Sí** |
| 4 | `mature_erp` | Valor, fuente, fecha | **Sí** |
| 5 | `country_risk_premium` | Valor, fuente, fecha | **Sí** |
| 6 | `country_risk_lambda` | `value` (escalar, único dato que consume Calculation) + modo de derivación explícito y mutuamente excluyente (RC-5, 4F.2): **(a)** `observed_revenue_exposure` — `domesticRevenuePctCompany` y `domesticRevenuePctMarketAvg`, ambos presentes; **(b)** `direct_documented_judgment` — sin porcentajes, Judgment documentado vía `source`/`rationale` del wrapper | **Sí** |
| 7 | `beta_treatment` | Beta desapalancado y su fuente, método de reapalancamiento (Hamada), beta apalancado resultante | **Sí** |
| 8 | `cost_of_debt` | Valor, jerarquía usada (marginal observable / spread estimado / fallback documentado, `04 §10.5`) | **Sí** |
| 9 | `capex_reinvestment_driver` | CAPEX (% de ingresos o trayectoria explícita), distinción mantenimiento/crecimiento, notas de verificación `g/ROC` | **Sí** |
| 10 | `depreciation_da_driver` | D&A (% de ingresos o trayectoria explícita) y su fuente — **no puede quedar resuelto por default silencioso** (`CANONICAL_METHODOLOGY.depreciationPctOfRevenue=3%`) si el resto de los supuestos sí se resuelve explícitamente | **Sí** (añadido en esta revisión — omitido en v1.1) |
| 11 | `working_capital_driver` | `explicit_delta_nwc_by_year` (§3) | **Sí** |
| 12 | `terminal_g` | Valor base, derivación documentada de los `g` de escenario pesimista/optimista | **Sí** |
| 13 | `projection_horizon_years` | Valor (hoy debe ser `5`), notas de juicio sobre convergencia suficiente | **Sí**, con la restricción de compatibilidad de §5 |

Campos evaluados y explícitamente **no** incluidos por ahora:

- `wacc_final` (WACC ya resuelto como escape hatch) — **`NOT BUILDING`**, salvo que Alpina exija la alternativa iterativa de `04 §10.1`(d) que no se descomponga limpiamente en los componentes 3-8 (ver v1.1 §7, sin cambios: se prefieren componentes resueltos sobre un WACC final por razones de auditabilidad y consistencia matemática).
- `forecast_growth_path` (trayectoria de crecimiento año a año, más allá del `expected_growth` puntual ya soportado por el motor) — **`NOT BUILDING`**, el parámetro existente basta salvo evidencia contraria de C-12.

No todos estos 13 puntos necesitan convertirse en campos de esquema permanentes de la base de datos — el contrato en sí (§7 de v1.1, sin cambios: vive embebido en `structured_input`, sin tabla ni migración nueva).

---

## 7. Fingerprint / provenance / versioning / snapshot — corregido para no mezclar Evidence con Judgment

`04 §1` separa explícitamente **Evidence** (hecho verificable en fuente primaria), **Judgment** (decisión humana documentada) y **Calculation** (aplicación determinística de fórmulas). v1.2 recomendaba congelar `resolved_assumptions` completo dentro de `source_input_snapshot` — eso mezclaba Judgment dentro de lo que debe representar exclusivamente Evidence. Esta versión corrige la ubicación, no la necesidad de trazabilidad en sí (que sigue siendo real y obligatoria).

**Mapeo conceptual corregido:**

| Capa (`04 §1`) | Artefacto persistido |
|---|---|
| Evidence | `source_input_snapshot` — exclusivamente inputs financieros/evidencia fuente ya usados por el cálculo (revenue, cost_of_sales, opex, da, cash, equity, deuda, AR/inventario/AP, etc.) |
| Judgment | `resolved_assumptions_used` — snapshot propio y separado de los 13 supuestos resueltos de §6, congelado tal cual se usaron en esa ejecución |
| Calculation | `calculation_result` (projections/valuation/kpis/sensitivityMatrix/etc.) — el output determinístico del motor |

Se verificó, leyendo el código real de los 4 módulos, qué requeriría modificación bajo este mapeo corregido. **No se asumió nada.**

### `source-input-snapshot.ts::buildSourceInputSnapshot` — sin cambio de propósito; se retira la recomendación de v1.2

`pickNumericFields` (líneas 79-87) extrae exclusivamente campos numéricos de `income_statement`/`balance_sheet` — evidencia fuente, nada más. **Se retira** la recomendación de v1.2 de agregar `resolved_assumptions` aquí. Este módulo permanece limitado a Evidence, sin modificación de propósito. (Si en el futuro se decide incluir también AR/inventario/AP —necesarios para la reconciliation manual de §8— eso sigue siendo Evidence, no Judgment, y encajaría igual de bien en este mismo snapshot sin contradecir esta corrección; no se decide aquí si hace falta.)

### `resolved_assumptions_used` — snapshot nuevo y separado, no una extensión de `source_input_snapshot`

No existe hoy ningún artefacto que congele los supuestos resueltos usados en una ejecución — es una pieza nueva, del mismo patrón que `source_input_snapshot` (copia literal, sin recalcular nada), pero conceptualmente distinta: congela `resolved_assumptions` exactamente como se usó, como un campo propio del envelope de resultado (`ejecutar-calculo/index.ts`, junto a `version`/`provenance`/`source_input_snapshot`, línea 290), no como parte de ninguno de los snapshots de evidencia existentes.

### `calculation-fingerprint.ts::computeInputFingerprint` — requiere modificación (ambas capas)

El fingerprint **no** serializa `structured_input` completo — construye un objeto `payload` explícito y acotado (líneas 127-140): `revenue, cost_of_sales, opex, da, interest_expense, financial_debt_total, cash, equity, moneda_analisis, factor_conversion, sector_benchmark, expected_growth`. Es una lista blanca deliberada. `resolved_assumptions` no está en esa lista — **hoy, cambiar `terminal_g` o `capital_structure` no cambiaría el fingerprint en absoluto**, que es exactamente el escenario que esta auditoría califica como inaceptable.

La corrección no exige mezclar ambas capas dentro de un mismo objeto de evidencia — el fingerprint es una identidad de **Calculation** (qué combinación exacta de Evidence + Judgment produjo este resultado), no un tercer lugar donde Evidence y Judgment deban fusionarse conceptualmente. Basta con construir la identidad como equivalente a `hash({ source_inputs_used, resolved_assumptions_used })`, usando la misma canonicalización determinística (`canonicalStringify`/`fnv1a64Hex`) ya existente, sobre ambos objetos por separado antes de combinarlos. **Requiere modificación mínima**: extender el `payload` de `computeInputFingerprint` para incluir `resolved_assumptions` (o su representación canónica) junto a los campos de evidencia que ya incluye — cualquier supuesto material que cambie debe cambiar el fingerprint.

### `calculation-versioning.ts::buildCalculationVersionInfo` — requiere modificación

`buildAssumptionsSnapshot()` (líneas 61-67) itera siempre `CANONICAL_METHODOLOGY.assumptions` — el objeto global — y no recibe ningún parámetro de supuestos resueltos por caso. Si una ejecución usa `resolved_assumptions` para calcular pero el envelope persistido sigue mostrando los 8 valores globales (`taxRatePct=30`, etc.) como "los supuestos usados", el registro sería activamente engañoso. **Requiere modificación mínima**: dejar de afirmar que los defaults de `CANONICAL_METHODOLOGY` fueron los supuestos utilizados cuando existe una ejecución v5 — registrar explícitamente `methodology_version`, un `assumptions_source: "resolved_case_input" | "legacy_canonical_default"`, y un snapshot/resumen de los supuestos efectivamente utilizados (que remite al mismo `resolved_assumptions_used` de arriba, no lo duplica).

### `calculation-provenance.ts` — mantiene su propósito actual sin cambios

Este módulo resuelve una pregunta distinta y no relacionada: qué fila de `account_homologations`/documento respalda cada cifra de estado financiero (`TRACEABLE_FIELDS`: revenue, cost_of_sales, opex, depreciation, interest_expense, financial_debt_total, cash, equity) — es decir, provenance de **Evidence**. No se introduce aquí ningún supuesto resuelto. La provenance de cada supuesto de `ResolvedCalculationAssumptions` ya vive dentro de su propia entrada (§6: `source`, `rationale`, `status`, `unit`/`date` cuando aplique) — no necesita, ni debe, duplicarse dentro de `calculation-provenance.ts`. **No requiere modificación.**

### Persistencia física — una aclaración, no una excepción

`resolved_assumptions_used` puede seguir almacenándose dentro del mismo contenedor JSONB que hoy usa `structured_input.input_payload` (evita una migración nueva, consistente con v1.2 §5-§6) — pero **compartir un contenedor JSONB no convierte `resolved_assumptions` en source financial evidence**. Es una capa lógica separada de Judgment, con su propio snapshot (`resolved_assumptions_used`), aunque físicamente resida cerca de la evidencia por conveniencia de esquema.

### Conclusión de esta sección

Con la separación corregida: **`source-input-snapshot.ts` no requiere modificación de propósito** (se retira la recomendación de v1.2 de mezclar `resolved_assumptions` en él). **Sí requieren modificación mínima**: `computeInputFingerprint` (incluir ambas capas en la identidad del cálculo) y `buildCalculationVersionInfo` (dejar de reportar defaults no usados como si fueran los supuestos reales). Se necesita, además, un artefacto nuevo y propio — `resolved_assumptions_used` — como snapshot de Judgment, separado del snapshot de Evidence, adjunto al envelope junto a `version`/`provenance`/`source_input_snapshot`. `calculation-provenance.ts` no cambia. Ninguna de estas modificaciones se implementó.

---

## 8. Working capital — test esperado (redefinido)

Se reemplaza el test propuesto en v1.1 (que verificaba `k×(Revenue_t−Revenue_{t-1})`, dependiente de una alternativa — la (A) — que queda `NOT BUILDING IN V5.0`, §3) por dos verificaciones separadas, correspondientes a las dos capas que deben mantenerse distintas:

**1. Test del motor (determinismo, sin juicio):** dado `explicit_delta_nwc_by_year = [x1, x2, x3, x4, x5]`, el motor debe usar exactamente `x_t` — ni recalculado, ni ajustado — en:

$$FCFF_t = NOPAT_t + D\&A_t - CAPEX_t - x_t$$

Este test no verifica de dónde salió `x_t` — solo que el motor lo consume literalmente, sin ninguna lógica de derivación interna que lo sustituya o lo module.

**2. Verificación del Expediente/cross-check (juicio, sin el motor):** cada `x_t` debe corresponder, de forma documentada y auditable fuera del motor, a:

$$x_t = \text{Operating NWC}_t - \text{Operating NWC}_{t-1}$$

calculado independientemente a partir de la proyección de AR, inventario y AP de Alpina. Esta verificación es responsabilidad del análisis del caso, no del motor — el motor no tiene (ni necesita tener, bajo la solución mínima de §3) visibilidad de AR/inventario/AP.

Separar estas dos capas es exactamente lo que permite que el motor siga siendo un cálculo determinístico simple (consume números ya resueltos) mientras el juicio real sobre capital de trabajo — la parte que sí requiere criterio humano — vive en el Expediente, documentado y verificable, no enterrado dentro de una fórmula del motor.

---

## 9. Mismatch audit — tabla completa (13 ítems, severidades finales)

Sin cambios respecto a v1.1 salvo el ítem #4 (ver §3) y el ítem #8 (ver §4, ampliado a los 4 estados de book equity).

| ID | Methodology (04) | Root cause | Status | Severity | Minimal fix |
|---|---|---|---|---|---|
| 1 | §3.2 — preservar signo | RC-1 | CONFIRMED | **P0** | Quitar `Math.abs()` de `resolveEffectiveEquity` — junto con RC-2 |
| 2 | §10.2-10.4 — Fisher, ERP/CRP/lambda | RC-3 (downstream) | CONFIRMED | **P0** | Contrato §6, componentes no WACC final (§7 de v1.1) |
| 3 | §6.3 — 35% DIAN, marginal/efectiva/cash | RC-3 (downstream) | CONFIRMED | **P1** | Vía contrato §6 |
| 4 | §7 — ΔNWC de Operating NWC real | RC-4 | CONFIRMED (severidad revisada) | **P1**, condicional a P0 con evidencia de Alpina | `explicit_delta_nwc_by_year` (§3) |
| 5 | §8, §11 — `Reinvestment Rate = g/ROC` | Ninguna (verificación externa) | CONFIRMED | **P1** | Verificación manual |
| 6 | §9 — horizonte suficiente | Ninguna | CONFIRMED | **P2** | Decisión resuelta = 5, documentada (§5, §6-13) |
| 7 | §11.2 — `g` de escenario derivado | Ninguna | CONFIRMED | **P1** | Derivación manual documentada |
| 8 | §10.1 — nunca book value como proxy no cuestionado, en ningún signo | RC-2 | CONFIRMED (ampliado, §4) | **P0** | Ver §4 — junto con RC-1 y RC-3 |
| 9 | §15 — 6 pruebas mínimas | Ninguna | CONFIRMED (parcial) | **P1** | Script externo |
| 10 | §2, §14 — `valuation_date` | Ninguna | CONFIRMED | **P2** | Dato documentado |
| 11 | §14 — stub period | Ninguna | CONFIRMED | **P2** | Condicional a C-10 |
| 12 | §14 — mid-year | Ninguna | CONFIRMED | **P2** | Documentar year-end consciente |
| 13 | §12 — leases/NCI/asociadas | Ninguna (condicional C-08) | CONFIRMED | **P1**, condicional a P0 | Ajuste manual si aplica |

**Hallazgos adicionales** (severidad sin cambios respecto a v1.1 salvo lo ya corregido en §4): preflight siempre bloquea (P0, downstream RC-3), floor de equity value — `NO FORMULA CHANGE/ADD TRACEABILITY` (P2), beta/Ke extremo sin warning — sin clamp (P2), NOPAT con EBIT negativo (P3, condicional), divergencias motor cliente/canónico (P3), triplicación de benchmarks (P3).

---

## 10. Minimal correction set — backlog definitivo de Bloque 3B

### MUST FIX IN CODE BEFORE ALPINA

Solo root causes (3 P0 + su interacción, ninguna condicional a evidencia):

1. **RC-1 + RC-2 + RC-3 como una unidad de trabajo** (no son tres tickets independientes — RC-2 no puede resolverse sin el contrato de RC-3, y RC-1 debe corregirse en la misma pasada para que RC-2 tenga algo correcto que leer):
   - `resolveEffectiveEquity` deja de aplicar `Math.abs()`.
   - Diseño e implementación de `resolved_assumptions: ResolvedCalculationAssumptions | null` embebido en `structured_input` (§6, 13 campos).
   - `evaluateCalculationPreflight` verifica presencia/completitud de supuestos resueltos (§5) en vez de `approved`.
   - `capital-structure.ts` distingue: sin `resolved_assumptions.capital_structure` → comportamiento legacy sin cambios (compatibilidad con golden A/B/C); con `resolved_assumptions.capital_structure` → lo usa exclusivamente, nunca la rama mecánica/70-30 (§4).
   - `runCanonicalFinancialEngine` consume `resolved_assumptions` para tax/WACC-components/CAPEX/D&A/WC/terminal-g cuando están presentes.
2. **Fingerprint/versioning/envelope** (§7 — Evidence/Judgment/Calculation separados): extender el payload de `computeInputFingerprint` para incluir `resolved_assumptions` junto a los campos de evidencia ya cubiertos; corregir `buildAssumptionsSnapshot`/`assumptions_source` en `calculation-versioning.ts` para que refleje los supuestos realmente utilizados, no los defaults globales; agregar `resolved_assumptions_used` como snapshot propio y separado (de Judgment, no de Evidence) en el envelope de `ejecutar-calculo/index.ts`, junto a `version`/`provenance`/`source_input_snapshot`. `source-input-snapshot.ts` **no** requiere modificación de propósito — permanece limitado a evidencia fuente. Sin esto, el punto 1 de esta lista queda con un resultado que no es reproducible ni versionado correctamente — no es opcional, es parte de la misma corrección.

**RC-4 (working capital) NO está en esta lista** — es P1 condicional, se resuelve como input de caso (`explicit_delta_nwc_by_year`), no exige código nuevo más allá de lo que RC-3 ya cubre (el contrato debe poder transportar un arreglo, no solo escalares — verificar esto durante la implementación de RC-3, no es un ítem de código separado).

### MUST WRITE TESTS FIRST

Antes de tocar cualquier código de la lista anterior, definir:

1. No-regresión: sin `resolved_assumptions`, los 3 golden cases A/B/C no cambian.
2. Comportamiento de `equity` en sus 4 estados (positivo/cero/negativo/ausente, §4) — incluyendo que `equity=0` y `equity` ausente NO activan automáticamente 70/30 en un contexto v5 (solo en el contexto legacy sin `resolved_assumptions`).
3. El test de ΔWC de dos capas (§8): motor usa `x_t` literal; el reconciliation `x_t = NWC_t - NWC_{t-1}` se prueba aparte, como verificación de caso, no como test del motor.
4. Preflight pasa solo cuando los 13 campos de §6 están presentes con `status="resolved"` y pasan las verificaciones de compatibilidad de §5 (suma de weights, longitud de `explicit_delta_nwc_by_year`, horizonte=5).
5. Fingerprint cambia si cualquier `resolved_assumption` cambia (test directo de la corrección de §7 — cubre ambas capas, evidencia y juicio, dentro de la misma identidad de cálculo).
6. `resolved_assumptions_used` queda congelado, tal cual se usó, dentro del envelope del resultado (snapshot de Judgment, separado de `source_input_snapshot`).
7. `calculation-versioning.ts` refleja los supuestos realmente utilizados (`assumptions_source: "resolved_case_input"` cuando aplica, no los defaults globales no usados).
8. `source_input_snapshot` permanece limitado a evidencia fuente — un test que verifique explícitamente que **no** contiene `resolved_assumptions` (se retira el test de v1.2 que exigía lo contrario).
9. Cambiar únicamente `resolved_assumptions` (sin tocar ningún input financiero) cambia el fingerprint y la versión del resultado, sin alterar el contenido de `source_input_snapshot` — las tres capas se mueven de forma independiente y verificable.

### RESOLVED AS CASE INPUT/JUDGMENT

Valores que el análisis de Alpina calcula y entrega vía el contrato de §6 — sin código adicional más allá de lo ya listado en MUST FIX:

- Tratamiento fiscal (35% + NOLs si existen) — C-01.
- Estructura de capital entre las 4 alternativas de `04 §10.1` — C-02.
- Costo de deuda — C-03.
- Risk-free/Fisher, ERP maduro, CRP, beta — C-11.
- `explicit_delta_nwc_by_year` — C-06/C-07, con su reconciliation vs. NWC real (§8).
- Driver de CAPEX/reinversión + verificación g/ROC — C-07.
- Driver de D&A — C-07/C-12.
- `g` terminal y derivación de escenarios — C-04.
- `projection_horizon_years` = 5, con juicio documentado de convergencia — C-12.

**Excepción confirmada en 4F.1 — `country_risk_lambda` (C-11, RC-5):** a diferencia de los demás elementos de esta lista, lambda NO se resolvía únicamente con el contrato §6 previo a esta revisión — el contrato exigía siempre `domesticRevenuePctCompany`/`domesticRevenuePctMarketAvg`, sin ninguna vía para un Judgment directo cuando esa Evidence es insuficiente, forzando su fabricación. Identificado en 4F.1 como gap universal (no específico de Alpina) y corregido en esta revisión de §5/§6 (modos `observed_revenue_exposure`/`direct_documented_judgment`) — requiere el contract fix de 4F.2 (tipo + preflight) antes de poder ejecutarse el primer caso real con integridad.

### CROSS-CHECK ONLY

Nunca sustituye el flujo oficial:

- Invocación directa de `runCanonicalFinancialEngine` vía script, con el mismo `structured_input`/`resolved_assumptions` que usaría `ejecutar-calculo`, para confirmar reproducibilidad fuera de la Edge Function.

### CONDITIONAL AFTER ALPINA EVIDENCE

No se construye nada de esto hasta conocer C-01 a C-12:

- Escalamiento de RC-4 (working capital) a P0 si la cuantificación real lo demuestra.
- Horizonte >5 años, si la evidencia muestra que Alpina no converge en 5 (requeriría entonces sí tocar código — el literal `5` repetido en varios puntos del motor).
- Lógica de stub period, si la fecha de valoración no coincide con el cierre del período base.
- Adopción de mid-year en código, solo si year-end se descarta explícitamente.
- Complejidad del puente EV→Equity, si C-08 revela leases/NCI/asociadas materiales.
- Evaluación de realización fiscal ante EBIT negativo, si aparece en la proyección.
- Warning de beta/Ke extremo, si la estructura resuelta produce un D/E alto.

### NOT BUILDING

- `baseOperatingNwc` + razones de NWC/Revenue proyectadas con delta calculado internamente por el motor (§3) — alternativa general, no para v5.0.
- `wacc_final` como campo primario del contrato (§6/§7 de v1.1) — solo si Alpina exige la alternativa iterativa.
- `forecast_growth_path` año a año más allá del `expected_growth` existente.
- Estructuras de datos genéricas para NCI/leases/asociadas/caja restringida entre múltiples casos futuros (`04 §18.2`).
- Unificación de motores servidor/cliente.
- Roles, workflows o tablas de aprobación.
- Clamp matemático sobre beta/Ke.
- Sensibilidades de un factor como funciones genéricas del motor.
- De-duplicación de benchmarks sectoriales triplicados.

---

## 11. Sign conventions, Demo vs. canonical, Test audit

Sin cambios de fondo respecto a v1.1 — ver esa versión para el detalle completo por campo (`equity`/`revenue`/`cost_of_sales`/`opex`/`da`/`interest_expense`/`cash`/`financial_debt_total`), la comparación motor cliente vs. canónico, y la tabla de qué prueba realmente cada test existente. Ninguno de esos análisis se invalida por las correcciones de esta versión.

---

## 12. Proposed execution order

### Unconditional corrections (independientes de la evidencia de Alpina)

1. RC-1 + RC-2 + RC-3 como unidad (§10, MUST FIX #1), con sus tests (§10, MUST WRITE TESTS FIRST #1-4).
2. Fingerprint/versioning/envelope (§10, MUST FIX #2 — `source-input-snapshot.ts` ya no requiere cambio de propósito, ver §7), con sus tests (§10, MUST WRITE TESTS FIRST #5-9).

### Case-dependent corrections (solo relevantes según evidencia C-01 a C-12)

3. Calcular los 13 supuestos resueltos de Alpina (§6), incluyendo la reconciliation de `explicit_delta_nwc_by_year` (§8).
4. Cuantificar si RC-4 escala a P0 con los números reales de Alpina.
5. Decidir horizonte, stub period, timing, complejidad del bridge, realización fiscal — todo condicional a evidencia.

### Entonces, y solo entonces

6. Ejecutar Alpina por el flujo real `ejecutar-calculo`, con `resolved_assumptions` completo y preflight legítimamente pasado.
7. Cross-check independiente vía script (opcional, nunca sustituye el paso 6).

---

## Cierre

No se modificó ningún archivo de código, test, migración ni configuración de Supabase. No se creó ningún archivo nuevo. No se modificaron `01`-`04`. No se creó ninguna entidad nueva del Expediente. No se inició el caso Alpina. Esta versión sobrescribe únicamente `docs/velarix-v5/05-financial-engine-audit.md`.
