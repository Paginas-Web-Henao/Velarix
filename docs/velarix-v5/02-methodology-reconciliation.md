# Reconciliación metodológica v5.0 — Bloque 2A

**Fecha:** 2026-08-31
**Tipo:** reconciliación metodológica (no financiera, no de negocio, no de código). No se modificó ningún archivo de código, migración ni configuración para producir este documento.
**Precede a:** el documento final de metodología (10–15 páginas), que todavía no se escribe.
**Cierra:** el Bloque 1 de la auditoría estructural v5.0 (`docs/velarix-v5/01-scope-surgery.md`) queda aceptado; este documento es el trabajo metodológico del Bloque 2A.

---

## 0. Cómo se hizo esta reconciliación

### 0.1 Fuentes internas revisadas (texto completo, no resumen de terceros)

- `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`
- `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md`
- `docs/velarix/bloque-1b-metodologia/REPORTE-RECONCILIACION-METODOLOGICA.md`
- `docs/velarix/bloque-1b-metodologia/ROADMAP-METODOLOGIA-DINAMICA.md`
- `docs/velarix/bloque-1b-metodologia/PLAN-VALIDACION-REVISOR-FINANCIERO.md`
- `docs/velarix/bloque-1c/CASOS-DORADOS-PROVISIONALES.md`
- `docs/velarix/bloque-1c/MATRIZ-DE-PRUEBAS-FINANCIERAS.md`
- `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md` (íntegro §0–§19; §20 completo, línea por línea; tabla de contenidos y grep dirigido de §21–§28 sobre los 8 casos históricos)
- `docs/velarix/plan/REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md`
- `docs/velarix/auditoria/04-CALIDAD-FINANCIERA.md`
- `docs/velarix/fases/FASE-01-EXACTITUD-FINANCIERA.md` (Bloque 1B íntegro; resto por tabla de contenidos)
- `docs/velarix/plan/REGISTRO-DE-DECISIONES.md` (índice D-01 a D-11)
- `docs/velarix/plan/MATRIZ-DE-RIESGOS.md` (R-19, R-20 completos)
- `docs/velarix-v5/01-scope-surgery.md` (íntegro)

No se leyó línea por línea `docs/velarix/consolidacion-8-casos/*` (4 documentos, ~245.000 palabras) — su contenido está sintetizado, con el mismo nivel de evidencia y trazabilidad de caso por caso, dentro de `EXPEDIENTE-DE-VALORACION-V1.md §20–§28`, que sí se revisó de forma exhaustiva. Donde ese §20–§28 cita un hallazgo específico (ej. NCI de ISA, netting de Goldman Sachs), se cita aquí con el mismo nivel de precisión que ese documento usa, sin inventar detalle adicional no presente en la síntesis.

### 0.2 Fuentes de código revisadas (texto completo)

`supabase/functions/_shared/canonical-financial-engine.ts` (321 líneas), `financial-methodology.ts` (163 líneas), `capital-structure.ts` (86 líneas), `canonical-input-normalization.ts` (102 líneas), `calculation-preflight.ts` (152 líneas), `structured-input-builder.ts` (327 líneas), `structured-input-derivations.ts` (174 líneas). Todas leídas completas, no por extracto.

### 0.3 Qué significa cada `Estado v5.0`

- **KEEP** — decisión ya defendible tal como está (metodología, no necesariamente el código), sobrevive la pregunta del banquero senior sin necesitar más evidencia externa.
- **SUPERSEDE** — la decisión histórica ya no aplica bajo v5.0 (normalmente porque asumía uniformidad por sector/cliente, que la reorientación de 2026-08-10 descartó); no significa que el código esté mal, significa que su rol cambia de "metodología" a "valor de referencia sugerido".
- **OPEN** — no hay evidencia interna ni externa suficiente para decidir; se mantiene abierta explícitamente, no se fuerza un cierre.
- **IMPLEMENTATION MISMATCH** — existe una decisión (histórica o del fundador) y el código actual no la refleja, o el código hace algo que ningún documento decidió.

Cuando la evidencia no permite decidir, se marca `OPEN` — no se convierte en `KEEP` para cerrar la tabla, por instrucción explícita de este bloque.

---

## 1. Convención de signos de estados financieros

| Campo | Contenido |
|---|---|
| Tema | Convención de signos: patrimonio negativo, revenue, COGS, OPEX, D&A, interest expense, cash, tratamiento actual de `Math.abs()` |
| Decisión histórica | Decisión 6 del fundador (`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`): "Velarix debe conservar el patrimonio con su signo real. Nunca debe convertir artificialmente un patrimonio negativo en positivo para ocultar su condición." Ninguna decisión histórica cubre el signo de revenue/COGS/OPEX/D&A/interest expense/cash — nunca se discutió si esos campos pueden ser legítimamente negativos (créditos, reversiones, notas crédito). |
| Implementación actual | `canonical-input-normalization.ts:44-53` (`resolveEffectiveIncomeStatement`) aplica `Math.abs()` a `revenue`, `cost_of_sales`, `opex`, `da`, `interest_expense`. `:56-58` aplica `Math.abs()` a `cash`. `:60-64` (`resolveEffectiveEquity`) aplica `Math.abs()` a `equity`/`total_equity` — **exactamente lo que la Decisión 6 del fundador prohíbe**, sin excepción ni bandera. El motor cliente (`src/lib/financial-engine.ts`, no auditado línea por línea en este documento, per `DECISIONES-FINANCIERAS-PENDIENTES.md` #6) usa el valor con signo real y por eso su clamp de ROE sí detecta patrimonio negativo (`roe=0%`, Caso C); el servidor con `Math.abs()` no lo detecta (`roe=−77%`, mismo caso). |
| Estado v5.0 | **IMPLEMENTATION MISMATCH** (equity — contradice Decisión 6, ya aprobada por el fundador) + **OPEN** (revenue/COGS/OPEX/D&A/interest expense — nunca se decidió si `Math.abs()` ciego es correcto ahí; `01-scope-surgery.md §7.1` lo registra como hallazgo nuevo, no diagnosticado) |
| Metodología propuesta v5.0 | No proponer todavía una regla general de signos por campo (sería exactamente el error que v5.0 corrige — una regla uniforme sin caso concreto). Para el campo `equity`: dejar de aplicar `Math.abs()` — esto ya tiene decisión aprobada, solo falta ejecutar el cambio de código sincronizado con `calculation-fingerprint.ts` (dependencia crítica `01-scope-surgery.md §4.3`), en la fase de auditoría/corrección del motor, con el caso Alpina como el primer caso real que lo ejercite. Para el resto de campos: verificar contra los estados financieros reales de Alpina si aparece algún valor negativo legítimo (nota crédito, reversión, ingreso no operacional negativo) antes de decidir. |
| Fundamento | Ocultar el signo de una cuenta destruye información económica real — un patrimonio negativo, una reversión de gasto, o una nota crédito tienen significado financiero distinto de un simple "positivo con signo invertido por error de captura". Confundir ambos casos es exactamente el patrón que la reorientación boutique-expert-led identificó como el problema central (`REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md §2`, caso Tecnoglass). |
| Fuente/evidencia | Decisión interna previa (Decisión 6, aprobada) para `equity`. Sin fuente externa consultada — no hace falta un estándar externo para "no ocultar signos", es un principio de integridad de datos, no una elección metodológica entre alternativas válidas. |
| Impacto en código | `canonical-input-normalization.ts:61-64` (quitar `Math.abs()` de `resolveEffectiveEquity`), sincronizado con `calculation-fingerprint.ts` (mismo comentario del propio archivo lo advierte, línea 17-18). `canonical-financial-engine.ts:268-269` (clamp de ROE/ROA sobre `equity > 0` seguiría funcionando igual una vez el signo sea real). `capital-structure.ts:49` (`equityWeight = equity > 0 ? ... : defaultEquityWeight`) ya está preparado para recibir un `equity` con signo real — no requiere cambio adicional. |
| Test financiero requerido | Regresión dirigida: Caso Dorado C (patrimonio −500M) debe producir `roe` del servidor igual al del cliente (ambos `0%` vía clamp, o ambos con la misma advertencia explícita si se decide mostrar una en vez de clamp) — hoy divergen (`−77%` vs `0%`). Test de identidad: beta re-apalancado del servidor debe coincidir con el del cliente en el mismo caso (hoy `7.788` vs `5.861`). |
| Pregunta que podría hacer un banquero senior | "¿Por qué toman valor absoluto de todo el estado de resultados y del balance antes de calcular? ¿Cómo distinguen un error de captura de un crédito, una reversión o un patrimonio genuinamente negativo?" |
| Respuesta que Nicolás debería ser capaz de defender | Hoy: no defendible para `equity` — hay una decisión aprobada que el código contradice. Para el resto de campos: "Verificamos caso por caso si aparece un valor negativo legítimo antes de decidir una regla; no aplicamos una transformación uniforme sin evidencia de que sea correcta para esa cuenta específica" — defendible solo si eso es realmente lo que se hace en el caso Alpina, no como excusa para no decidir nunca. |

---

## 2. Definición exacta de FCFF

| Campo | Contenido |
|---|---|
| Tema | FCFF: EBIT, NOPAT, impuestos, D&A, CAPEX, ΔNWC, intereses, consistencia EV/Equity |
| Decisión histórica | Decisión 7 (`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`): usar utilidad neta para ROE/ROA y NOPAT para el FCFF es intencional, no inconsistencia — confirmado por el fundador, pendiente solo de formalización escrita por el revisor (no de elegir entre alternativas). `REPORTE-RECONCILIACION-METODOLOGICA.md`: fórmulas de FCFF verificadas como algebraicamente idénticas entre motores, sin cambios en este bloque. |
| Implementación actual | `canonical-financial-engine.ts:150-157`: `ebit = ebitda − depreciation`; `interest = totalDebt × costOfDebt`; `ebt = ebit − interest`; `taxes = max(ebt,0) × taxRate` (impuesto real, sobre EBT, clamp en 0); `nopat = ebit − ebit × taxRate` (**no clamp**, impuesto sobre EBIT sin importar el signo de EBT); `fcff = nopat + depreciation − capex − deltaWC`. `capex`/`deltaWC` son porcentajes fijos de ingresos (`capexPct`/`wcPct` de `CANONICAL_METHODOLOGY`), no una proyección de balance. Intereses excluidos del FCFF (correcto para un flujo unlevered) — el efecto de la deuda entra únicamente vía WACC (costo de deuda después de impuestos), no vía el flujo. EV se descuenta a WACC; Equity = EV − netDebt (`:226-227`). |
| Estado v5.0 | **KEEP** (la estructura algebraica: NOPAT sobre EBIT sin clamp, exclusión de intereses del flujo, EV→Equity vía netDebt — es consistente con la práctica CFA estándar de un FCFF "unlevered", y la diferencia entre el impuesto real (`taxes`, clamped en EBT) y el impuesto teórico de NOPAT (no clamped, sobre EBIT) es una elección de diseño correcta, no un bug — el NOPAT debe ser neutral a la estructura de capital). **OPEN** para los insumos concretos de CAPEX/ΔNWC (ver temas 4 y 5 — son % fijos de ingresos, no derivados de un plan de reinversión real) |
| Metodología propuesta v5.0 | Mantener la arquitectura FCFF actual (EBIT→NOPAT sin clamp, exclusión de intereses, EV−netDebt=Equity). Formalizar por escrito, como ya pide la Decisión 7, que el NOPAT usa la tasa fiscal aplicada al EBIT (no al EBT) precisamente para que el FCFF sea neutral a la estructura de capital de la empresa que se valora — esto no está explicado en ningún documento hoy, aunque el código ya lo hace correctamente. |
| Fundamento | Un FCFF que no excluye intereses ni usa NOPAT capital-structure-neutral estaría mezclando el efecto de financiamiento en el flujo Y en la tasa de descuento (doble conteo). La estructura actual evita ese doble conteo. |
| Fuente/evidencia | Decisión interna previa (Decisión 7, aprobada) para utilidad neta vs. NOPAT. Práctica CFA/IVSC estándar de FCFF unlevered para la estructura NOPAT-sin-clamp — no se citó explícitamente en ningún documento interno, es una inferencia de este documento a partir de por qué el código ya está diseñado así, pendiente de que el revisor financiero la confirme por escrito como pide la Decisión 7. |
| Impacto en código | Ninguno requerido en la arquitectura del FCFF en sí. Los cambios de código relevantes están en los temas 4 (CAPEX), 5 (ΔNWC) y 6 (impuestos), que alimentan esta fórmula. |
| Test financiero requerido | Ya existe: identidad `fcff = nopat + D&A − capex − ΔWC` verificada en `financial-engine.golden-cases.test.ts` y en las regresiones del servidor. Falta un test explícito de que `nopat` no se ve afectado por el apalancamiento de la empresa (dos casos con mismo EBIT y distinto `interestExpense`/`totalDebt` deben producir el mismo `nopat`) — no existe hoy, sería la prueba que formaliza la Decisión 7 en código, no solo en documento. |
| Pregunta que podría hacer un banquero senior | "¿Por qué su NOPAT no usa el mismo impuesto clamped-en-cero que usan para la utilidad neta histórica? ¿No es eso una inconsistencia?" |
| Respuesta que Nicolás debería ser capaz de defender | "No es inconsistencia — es intencional: el NOPAT debe representar la utilidad operativa después de impuestos como si la empresa no tuviera deuda, para que el efecto del apalancamiento entre una sola vez, vía WACC. El impuesto sobre utilidad neta histórica sí se recorta en cero porque ahí sí importa el resultado contable real después de intereses." Defendible ya, pendiente solo de formalizarse por escrito (Decisión 7). |

---

## 3. Normalización de EBITDA

| Campo | Contenido |
|---|---|
| Tema | Qué puede ajustarse, qué no, evidencia mínima, recurrencia, related parties, owner compensation, extraordinarios, NIIF 16 |
| Decisión histórica | Decisión 5 (`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`): Velarix no asume que impuestos/utilidad neta históricos son correctos ni incorrectos sin evidencia; comportamiento actual = recalcular siempre con tasa fija, sin usar el histórico. Ningún documento interno menciona owner compensation, related parties, NIIF 16, ni un procedimiento de normalización de EBITDA como tal — es un vacío, no una decisión tomada y luego descartada. |
| Implementación actual | No existe ningún paso de normalización de EBITDA en `canonical-financial-engine.ts` ni en `structured-input-derivations.ts`. El EBITDA histórico (`ebitda0 = revenue − costOfSales − opex + da`, `canonical-financial-engine.ts:186`) se calcula directamente de las cuatro cuentas normalizadas por signo (tema 1), sin ningún ajuste discrecional, sin distinguir partidas recurrentes de extraordinarias, sin ajuste por NIIF 16 (arrendamientos capitalizados que inflan EBITDA vs. leases operativos pre-NIIF16). `structured-input-derivations.ts:82-91` exige los 4 componentes observados o devuelve `null` — no fabrica el EBITDA, pero tampoco lo normaliza. |
| Estado v5.0 | **OPEN** — no hay metodología, ni siquiera un borrador, y la entidad `normalizations` del Expediente de Valoración está explícitamente listada como "no implementada" en `01-scope-surgery.md §3.2`. |
| Metodología propuesta v5.0 | Ninguna todavía — este es exactamente el tipo de decisión que la reorientación boutique-expert-led exige resolver caso por caso (`REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md §4`: "NORMALIZAR" es un paso explícito del nuevo workflow, después de "RECIBIR RESPUESTAS Y SOPORTES" y antes de "DEFINIR HIPÓTESIS"). Para Alpina: cualquier ajuste de normalización debe registrarse como una entidad `normalizations` del Expediente (aún no implementada), con evidencia mínima documentada por ajuste — no debe inventarse una tabla de reglas generales antes de tener el primer caso real que la exija. |
| Fundamento | Ajustar EBITDA sin evidencia (o con una regla genérica aplicada a cualquier empresa) es exactamente la aproximación "ESTADOS FINANCIEROS → FÓRMULAS → VALORACIÓN" que la reorientación de 2026-08-10 supersedió. |
| Fuente/evidencia | Decisión interna previa: ninguna (vacío confirmado, no una decisión pendiente registrada explícitamente como tal en `DECISIONES-FINANCIERAS-PENDIENTES.md`, que tiene 10 decisiones y ninguna es "normalización de EBITDA" per se — la más cercana, #5, es sobre impuestos/utilidad neta, no sobre EBITDA). Sin fuente externa consultada porque no hay decisión que fundamentar todavía — sería prematuro citar IVSC/Damodaran sobre normalización antes de tener un caso real. |
| Impacto en código | Ninguno hoy. Cuando exista un caso concreto: la entidad `normalizations` del Expediente (no implementada, `EXPEDIENTE-DE-VALORACION-V1.md §5`), no el motor de cálculo — la reorientación es explícita en que el motor "ejecuta matemáticas sobre inputs y supuestos que previamente fueron interpretados... y aprobados" (§6), no que decida ajustes por sí mismo. |
| Test financiero requerido | Ninguno posible todavía — no hay metodología que probar. Cuando exista, debería requerir: evidencia documental del ajuste, quién lo aprobó, valor original vs. ajustado conservados ambos (mismo patrón que exige la Decisión 2 para overrides de estructura de capital). |
| Pregunta que podría hacer un banquero senior | "¿Qué ajustes de normalización le hicieron al EBITDA de Alpina, y con qué evidencia?" |
| Respuesta que Nicolás debería ser capaz de defender | Hoy: "Ninguno todavía — no hay una metodología de normalización definida; cualquier ajuste futuro requerirá evidencia documental específica del caso, no una regla genérica." Defendible como respuesta honesta de un proceso inmaduro deliberadamente no forzado a cerrarse; no defendible si se presenta como "ya resuelto". |

---

## 4. Working capital operativo

| Campo | Contenido |
|---|---|
| Tema | Cuentas incluidas/excluidas, cash, deuda, supplier finance, estacionalidad, relación con crecimiento |
| Decisión histórica | Ninguna decisión específica sobre la composición del capital de trabajo operativo. `EXPEDIENTE-DE-VALORACION-V1.md` líneas 1142 y 1156 (Caso 02, Terpel/Organización Terpel) registra explícitamente como pregunta abierta, sin resolver: "si el crédito de proveedores/financiamiento de cadena en Ecopetrol es capital de trabajo operativo o financiación" — sigue sin resolverse tras 8 casos adicionales. |
| Implementación actual | `canonical-financial-engine.ts:156`: `deltaWC = revenue × (wcPct/100)`, con `wcPct=3` fijo (`CANONICAL_METHODOLOGY.assumptions.workingCapitalPctOfRevenue`) — no es un capital de trabajo real (no usa `accounts_receivable`, `inventory`, `accounts_payable`, aunque `structured-input-builder.ts:311-317` sí los captura y persiste en `balance_sheet`). El motor canónico los ignora por completo para el cálculo de ΔWC — usa solo el % fijo de ingresos. El motor cliente (no auditado en detalle aquí) sí exponía KPIs de ciclo de caja (`daysReceivable`, `daysInventory`, `daysPayable`), pero como **valores fijos de demostración**, no calculados de datos reales (`auditoria/04-CALIDAD-FINANCIERA.md` hallazgo #4 confirmado, `REPORTE-RECONCILIACION-METODOLOGICA.md` fila 4). |
| Estado v5.0 | **OPEN** (qué cuentas componen el capital de trabajo operativo — pregunta explícitamente abierta desde el Caso 02, sin resolver en 6 casos posteriores) + **IMPLEMENTATION MISMATCH** (el `structured_input` ya captura AR/inventario/AP reales que el motor canónico nunca usa para ΔWC — solo usa un % fijo de ingresos, un dato mejor existe y no se consume) |
| Metodología propuesta v5.0 | Ninguna todavía. Para Alpina: si el Expediente registra evidencia suficiente sobre el ciclo AR/inventario/AP de Alpina, evaluar si ΔWC debe derivarse de esos saldos reales en vez del 3% fijo — pero esa decisión requiere primero resolver la pregunta abierta desde el Caso 02 (¿qué cuentas cuentan como "operativas" vs. "financiación"?), no solo conectar los campos que ya existen. |
| Fundamento | Usar un ΔWC calculado de datos reales cuando existen es más defendible que un % fijo — pero solo si la clasificación operativo/financiación de cada cuenta está resuelta primero; conectar los campos sin resolver esa pregunta repetiría el error de aplicar una regla mecánica sin comprensión previa. |
| Fuente/evidencia | Decisión interna previa: ninguna decisión cerrada. Inferencia: el propio `structured-input-builder.ts` ya captura los datos reales (`accounts_receivable`, `inventory`, `accounts_payable`), lo cual es evidencia de que la infraestructura para una fórmula distinta ya existe, aunque la decisión metodológica de usarla no. Sin fuente externa citada — la pregunta es específica al caso (supplier finance de Alpina), no un principio general que un estándar externo resuelva por adelantado. |
| Impacto en código | Si se decide: `canonical-financial-engine.ts:156` (reemplazar el % fijo por una derivación real), sincronizada con la definición de qué cuentas cuentan. No modificar sin esa decisión previa. |
| Test financiero requerido | Ninguno posible hasta resolver la pregunta abierta. Cuando exista: identidad `ΔWC_t = WC_t − WC_{t-1}` sobre saldos proyectados reales, no solo un % de ingresos. |
| Pregunta que podría hacer un banquero senior | "Su ΔNWC es 3% de ingresos fijo — ¿de dónde sale ese número para Alpina específicamente, y qué cuentas incluye?" |
| Respuesta que Nicolás debería ser capaz de defender | Hoy: no defendible como "la metodología de Alpina" — es un valor de referencia genérico heredado del motor canónico, sin conexión a los saldos reales de capital de trabajo de Alpina que ya se capturan en `structured_input` pero no se usan. |

---

## 5. CAPEX y reinversión

| Campo | Contenido |
|---|---|
| Tema | Maintenance vs. growth, D&A, intangibles, coherencia crecimiento/reinversión |
| Decisión histórica | Ninguna decisión específica del fundador sobre CAPEX. `EXPEDIENTE-DE-VALORACION-V1.md` línea 951-953 (cautela del Caso 05, ISA): "la clasificación contable de un desembolso en el estado de flujos de efectivo no determina por sí sola si existe inversión económica — no se crea todavía una nueva taxonomía de CAPEX" — reconocido como problema real, explícitamente sin resolver. |
| Implementación actual | `canonical-financial-engine.ts:155`: `capex = revenue × (capexPct/100)`, con `capexPct=5` fijo, idéntico en los 5 años proyectados y en los 3 escenarios (el escenario no varía `capexPct`/`wcPct`, ver tema 15/Decisión 8). Sin distinción maintenance/growth. D&A proyectado también es un % fijo de ingresos (`depreciationPctOfRevenue=3`, tema 2), desacoplado de CAPEX — un CAPEX de 5%/ingresos y una D&A de 3%/ingresos implican una base de activos creciendo indefinidamente en términos reales, sin verificación de si eso es consistente con el `g` terminal usado (tema 11). |
| Estado v5.0 | **OPEN** — la clasificación misma de qué constituye "inversión económica" para Alpina no está resuelta, y el código no distingue CAPEX de mantenimiento vs. de crecimiento en ningún punto. |
| Metodología propuesta v5.0 | Ninguna todavía. Cuando exista evidencia del caso Alpina (plan de inversión real, naturaleza del negocio), evaluar si CAPEX debe derivarse de un plan explícito en vez de un % de ingresos, y si D&A/CAPEX deben converger en el año terminal (ver tema 11, reinversión = g/ROC) — ninguna de las dos cosas se decide aquí. |
| Fundamento | Un CAPEX no distinguido entre mantenimiento y crecimiento sobreestima o subestima sistemáticamente el FCFF dependiendo de si la empresa está en fase de expansión o de madurez — Alpina, como empresa madura establecida, probablemente requiere un tratamiento distinto al de una startup de alto crecimiento, pero esto no puede decidirse sin los datos reales del caso. |
| Fuente/evidencia | Decisión interna previa: ninguna. Evidencia interna: cautela del Caso 05 (ISA) documentada arriba. Sin fuente externa citada todavía — el principio general (CAPEX de mantenimiento ≈ D&A en estado estable) es estándar en valoración (Damodaran lo trata extensamente), pero aplicarlo requiere primero los datos reales de Alpina, no solo citar la fuente. |
| Impacto en código | Ninguno hoy. Futuro: `canonical-financial-engine.ts:148,155` si se decide una fórmula distinta al % fijo. |
| Test financiero requerido | Ninguno posible hasta tener una metodología. Cuando exista: verificar que en el año terminal, CAPEX converja con D&A (o con la relación que se decida) de forma consistente con el `g` terminal usado. |
| Pregunta que podría hacer un banquero senior | "¿Ese 5% de CAPEX es de mantenimiento, de crecimiento, o ambos? ¿Es consistente con la D&A que están proyectando?" |
| Respuesta que Nicolás debería ser capaz de defender | Hoy: no defendible — es un valor genérico sin ninguna verificación de consistencia con D&A ni con el crecimiento terminal asumido. |

---

## 6. Impuestos

| Campo | Contenido |
|---|---|
| Tema | Marginal/statutory vs. effective, deferred taxes, NOLs, tasa de NOPAT |
| Decisión histórica | Decisión 5 (`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`): no asumir automáticamente que impuestos/utilidad neta históricos reportados son correctos, tampoco asumir que una diferencia es evasión/fraude — comportamiento actual (recalcular siempre con tasa fija) confirmado como política provisional, metodología pendiente de revisor financiero y tributario. |
| Implementación actual | `financial-methodology.ts:70-80`: `taxRatePct.value = 30`, `sourceDescription: "Tasa corporativa de referencia para Colombia"`, `approved: false`, advertencia propia: "No refleja regímenes tributarios especiales (zonas francas, rentas exentas, etc.)". Aplicado como tasa única, plana, sin distinguir marginal/efectiva, sin impuestos diferidos, sin NOLs. `canonical-financial-engine.ts:152-154`: impuesto real de proyección (`taxes`) usa esta tasa sobre `max(ebt,0)`; NOPAT usa la misma tasa sobre EBIT sin clamp (ver tema 2, esto es correcto por diseño, no un error). El histórico `taxes`/`net_income` de `structured_input` se lee (`structured-input-derivations.ts:145-146`, campos `taxes`/`netIncome`) pero **nunca se usa** en el motor canónico — se recalcula siempre con la tasa fija. |
| Estado v5.0 | **OPEN** — la tasa en sí (30%) no está verificada contra la normativa tributaria colombiana vigente (DIAN) en ningún documento revisado; el propio código la marca `approved: false` y advierte explícitamente sus limitaciones. |
| Metodología propuesta v5.0 | Ninguna todavía. Antes del caso Alpina: verificar la tasa corporativa vigente en Colombia contra una fuente primaria (DIAN, normativa tributaria aplicable) — no se verificó en este documento, y no debe asumirse que 30% sigue siendo correcto solo porque es el valor histórico del código. Evaluar si Alpina tiene algún régimen especial (zona franca, renta exenta) que la tasa plana no capturaría. |
| Fundamento | Una tasa de impuestos incorrecta desplaza el FCFF proyectado y el NOPAT directamente, sin ningún mecanismo de alerta hoy. |
| Fuente/evidencia | Decisión interna previa (Decisión 5, política de proceso confirmada; metodología de la tasa en sí, pendiente). Fuente externa recomendada, no consultada en este documento: DIAN / normativa tributaria aplicable a Colombia — debe verificarse antes de aprobar el 30% como definitivo, no asumirse. |
| Impacto en código | `financial-methodology.ts:70-80` si la tasa cambia; requiere re-ejecutar los 3 casos dorados (`canonical-financial-engine.golden-cases.test.ts`) y documentar el antes/después, como exige `PLAN-VALIDACION-REVISOR-FINANCIERO.md`. |
| Test financiero requerido | Regresión existente ya cubre la tasa actual (golden cases). Falta: verificación de la tasa contra fuente primaria vigente antes de usarla en un caso real, y un caso de prueba con régimen tributario especial si Alpina lo tuviera. |
| Pregunta que podría hacer un banquero senior | "¿30% es la tasa marginal, la efectiva, o la estatutaria vigente? ¿Verificaron que sigue siendo la tasa corporativa colombiana actual?" |
| Respuesta que Nicolás debería ser capaz de defender | Hoy: no defendible sin verificación — es un valor heredado sin fuente primaria confirmada en este ciclo de trabajo. |

---

## 7. Cost of Equity

| Campo | Contenido |
|---|---|
| Tema | Risk-free, ERP, beta, unlever/relever, CRP, moneda |
| Decisión histórica | Decisión 1 (`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`): revisor externo debe validar fuentes, valores, periodicidad y reglas para risk-free, ERP, beta sectorial, costo de deuda, prima país, prima por tamaño. Valores actuales usados solo como provisionales. `PLAN-VALIDACION-REVISOR-FINANCIERO.md` pregunta 1 pregunta explícitamente si debe agregarse una prima de riesgo país/tamaño adicional para PyMEs colombianas. |
| Implementación actual | `financial-methodology.ts:125-146`: `riskFreeRatePct.value=4.35`, fuente "US Treasury 10Y... actualizado Feb 2026"; `equityRiskPremiumPct.value=5.80`, fuente "Damodaran ERP Emerging Markets... actualizado Jan 2026". `capital-structure.ts:52-58`: Hamada (`betaLevered = betaUnlevered × (1+(1−t)×D/E)`), CAPM (`costOfEquity = riskFree + betaLevered × ERP`). Beta unlevered viene de `SECTOR_BENCHMARKS` (`canonical-input-normalization.ts:66-82`), 15 sectores, sin fuente citada por sector individual dentro de ese archivo (la fuente Damodaran se cita en `structured-input-builder.ts:102-106` para el snapshot, no en el archivo de benchmarks del motor). Sin prima de riesgo país explícita separada del ERP (el ERP ya se describe como "Emerging Markets", lo cual en la metodología Damodaran típicamente ya incorpora un componente de riesgo país — pero ningún documento interno confirma si eso es lo que se está usando aquí, o si haría falta una CRP adicional). Sin prima por tamaño. |
| Estado v5.0 | **OPEN** — explícitamente pendiente de revisor externo desde la Decisión 1; ningún avance metodológico nuevo desde 2026-08-06. |
| Metodología propuesta v5.0 | Ninguna todavía. Verificar antes del caso Alpina: (a) si el ERP "Emerging Markets" de Damodaran ya incluye el componente de riesgo país de Colombia o si requiere sumarse aparte (esto es ambiguo en la documentación actual, debe resolverse contra la fuente primaria de Damodaran, no asumirse); (b) si corresponde una prima de tamaño dado que Alpina no es una PyME pequeña sino una empresa establecida — la pregunta 1 del plan de validación fue formulada pensando en PyMEs pequeñas, puede no aplicar igual a Alpina. |
| Fundamento | El costo de equity es el input individual con mayor efecto sobre la valoración (denominador de todo el DCF vía WACC) — un ERP mal aplicado (doble-contando o excluyendo el riesgo país) desplaza el Enterprise Value materialmente. |
| Fuente/evidencia | Decisión interna previa (Decisión 1, pendiente de revisor). Fuente externa recomendada, no verificada en este documento: Damodaran / NYU Stern (para confirmar si el ERP Emerging Markets ya incorpora CRP de Colombia específicamente), Banco de la República (para risk-free en COP si se decide usar una tasa local en vez de Treasury USD, ver tema 10). |
| Impacto en código | `financial-methodology.ts:125-146` si los valores cambian; `canonical-input-normalization.ts:66-82` (`SECTOR_BENCHMARKS`) si la fuente de beta por sector cambia o se documenta mejor. |
| Test financiero requerido | Existente: regresión de WACC/beta en los 3 casos dorados. Falta: verificación explícita de que el ERP usado no duplica ni omite la prima de riesgo país de Colombia — no hay ningún test ni documento que lo confirme hoy. |
| Pregunta que podría hacer un banquero senior | "Su ERP de mercados emergentes — ¿ya incluye la prima de riesgo país de Colombia, o hace falta sumarla aparte? ¿Cómo lo verificaron?" |
| Respuesta que Nicolás debería ser capaz de defender | Hoy: no defendible — esta pregunta específica no tiene respuesta verificada en ningún documento interno revisado. |

---

## 8. Cost of Debt

| Campo | Contenido |
|---|---|
| Tema | Costo de deuda pre y después de impuestos |
| Decisión histórica | Decisión 1 cubre "costo de deuda" dentro del mismo paquete de supuestos de mercado pendientes de revisor externo — sin decisión separada específica. |
| Implementación actual | `financial-methodology.ts:114-124`: `costOfDebtPct.value=8`, `sourceDescription: "Costo de deuda pre-impuesto asumido"`, `fallbackReason: "No conectado a un spread de deuda real por sector o por calificación crediticia de la empresa"`, `approved: false`. `capital-structure.ts:58`: `costOfDebtAfterTaxPct = costOfDebtPct × (1 − taxRatePct/100)` = 8% × 70% = 5.6% — fórmula estándar, correcta. El valor de 8% es un único número para cualquier empresa, cualquier sector, cualquier nivel de apalancamiento o calificación crediticia. |
| Estado v5.0 | **OPEN** — mismo estado que el resto del paquete WACC (Decisión 1), sin evidencia adicional específica sobre costo de deuda en ningún documento revisado. |
| Metodología propuesta v5.0 | Ninguna todavía. Verificar si Alpina tiene deuda real observable (tasas de sus créditos/bonos reales) que pueda usarse en vez de un supuesto genérico — esto sería más defendible que 8% fijo si el dato existe, pero requiere el caso real, no una regla general nueva. |
| Fundamento | El costo de deuda de una empresa específica observable en sus propios contratos de crédito es siempre más defendible que un supuesto de mercado genérico, cuando ese dato existe. |
| Fuente/evidencia | Decisión interna previa: ninguna específica, cubierta genéricamente por Decisión 1. Sin fuente externa consultada — la pregunta correcta aquí es primero mirar el dato observado de Alpina antes de buscar una fuente de mercado sustituta. |
| Impacto en código | `financial-methodology.ts:114-124` si se reemplaza por un valor caso-específico (vía el mecanismo de "valor de referencia sugerido" del Expediente, `EXPEDIENTE-DE-VALORACION-V1.md §13`, no como cambio del valor canónico global). |
| Test financiero requerido | Existente: regresión de WACC en los 3 casos dorados, que ya ejercita `costOfDebtAfterTaxPct`. Ninguno nuevo requerido hasta que exista una fuente de dato real de Alpina. |
| Pregunta que podría hacer un banquero senior | "¿8% es la tasa real que paga Alpina por su deuda, o un supuesto genérico de mercado?" |
| Respuesta que Nicolás debería ser capaz de defender | Depende enteramente de si se usa el dato real de Alpina en el caso concreto — si se usa el valor genérico sin verificar el dato real disponible, no es defendible. |

---

## 9. Estructura de capital

| Campo | Contenido |
|---|---|
| Tema | Actual vs. objetivo, fallback 70/30 actual, valores contables vs. económicos |
| Decisión histórica | Decisión 2 (`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`): el producto estándar usa siempre la estructura de capital **observada** (saldos reales); el cliente no puede sobrescribirla. Override futuro ("estructura objetivo") diferido a una función de consultoría, con criterios pendientes del revisor. `EXPEDIENTE-DE-VALORACION-V1.md` líneas 956-965 (Caso 06, Bancolombia): "Bancolombia aporta evidencia suficiente para rechazar como obligación universal la secuencia `FCFF → WACC → CAPEX → NWC → Enterprise Value → net debt → Equity Value`, sin eliminarla como opción válida cuando la economía y el método la justifiquen" — explícitamente: "No se aprueba ningún método alternativo. No se calcula WACC ni Cost of Equity. No se modifica la Decisión 1 del Bloque 1B." |
| Implementación actual | `capital-structure.ts:49`: `equityWeight = equity > 0 ? equity/(equity+totalDebt) : defaultEquityWeight` (default 0.70). `calculation-preflight.ts:89-108` **sí distingue** `equity` ausente (`null`/`undefined`) de `equity` observado en 0 — un `equity` genuinamente ausente bloquea el cálculo entero (`missing_inputs`), no llega nunca a `capital-structure.ts`. El caso residual real, más estrecho de lo que sugería `01-scope-surgery.md §7.4`: un `equity` **observado y real en 0** (o negativo, antes de corregir el tema 1) sí pasa el preflight y activa el fallback 70/30 en `capital-structure.ts:49` de forma silenciosa, sin ninguna advertencia al usuario de que se usó una estructura fabricada en vez de la observada. |
| Estado v5.0 | **KEEP** (política de producto: usar siempre estructura observada por defecto — decisión ya confirmada por el fundador, y consistente con "menos supuestos discrecionales") para el caso general. **OPEN** (arquitectura método-dependiente para ciertos tipos de empresa — evidencia fuerte del Caso 06/Bancolombia de que la secuencia FCFF→WACC→CAPEX→NWC no es universal, aunque Alpina probablemente no sea una institución financiera regulada). **IMPLEMENTATION MISMATCH** menor: el fallback 70/30 se activa sin ninguna advertencia visible cuando `equity` observado es exactamente 0, un caso más angosto que "ausente vs. cero indistinguibles" (eso sí está resuelto por el preflight), pero real. |
| Metodología propuesta v5.0 | Mantener estructura observada como default (Decisión 2, ya aprobada). Agregar una advertencia explícita (no silenciosa) cuando el fallback 70/30 se activa por `equity=0` real observado — esto no es una decisión metodológica nueva, es hacer visible una decisión que ya existe (usar 70/30 como fallback) pero que hoy ocurre sin que nadie lo sepa. Para Alpina: si no es una institución financiera regulada, la secuencia FCFF→WACC→CAPEX→NWC→EV→Equity sigue siendo la arquitectura por defecto razonable (Caso 06 no la invalida en general, solo la rechaza como *obligación universal*). |
| Fundamento | Usar la estructura observada reduce supuestos discrecionales manipulables; el fallback 70/30 sin aviso es un riesgo de credibilidad silencioso, no de metodología en sí. |
| Fuente/evidencia | Decisión interna previa (Decisión 2, aprobada, para el default). Evidencia interna (Caso 06/Bancolombia, `EXPEDIENTE-DE-VALORACION-V1.md` líneas 956-965) para la advertencia de que la arquitectura no es universal — no aplica de forma directa a Alpina salvo que Alpina resulte ser un caso atípico (holding, estructura financiera compleja). |
| Impacto en código | `capital-structure.ts:49` — agregar una bandera/warning explícito cuando `equity <= 0` activa el fallback, sin cambiar el valor 70/30 en sí (eso sigue pendiente de revisor, Decisión 1/2). |
| Test financiero requerido | Test nuevo: `equity=0` observado (no ausente) debe producir un flag/warning visible en el resultado, distinto de silencio total — no existe hoy. |
| Pregunta que podría hacer un banquero senior | "¿Qué estructura de capital usaron para Alpina, y por qué?" |
| Respuesta que Nicolás debería ser capaz de defender | "La estructura observada de Alpina (equity/(equity+deuda) de sus saldos reales) — es la política estándar del producto, decidida explícitamente para minimizar supuestos discrecionales, salvo que la estructura del caso justifique un método distinto" — defendible mientras Alpina no dispare el fallback 70/30 silencioso. |

---

## 10. WACC

| Campo | Contenido |
|---|---|
| Tema | Consistencia moneda/inflación, nominal/real, COP |
| Decisión histórica | Ninguna. Ningún documento interno revisado discute explícitamente la consistencia moneda/inflación entre el WACC y los flujos de caja proyectados. |
| Implementación actual | `financial-methodology.ts:125-146`: risk-free = US Treasury 10Y (nominal, USD); ERP = Damodaran Emerging Markets (USD). `capital-structure.ts:57`: `costOfEquity = riskFree + betaLevered × ERP` — produce una tasa en base USD nominal. Esa misma tasa se aplica, sin ajuste visible, para descontar flujos de caja proyectados en `moneda_analisis` (típicamente COP, `canonical-financial-engine.ts:318`, `resolveEffectiveMoneda`), con crecimiento de ingresos (`expectedGrowth`, tema 14) presumiblemente nominal en COP. No existe en el código ningún ajuste de paridad de tasas (Fisher/PPP) entre la tasa de descuento USD y el flujo COP. |
| Estado v5.0 | **OPEN** — hallazgo de este documento (inferencia a partir del código, no una decisión interna registrada en ningún lugar); ningún documento revisado lo discute, lo cual en sí mismo es notable dado que es un supuesto con efecto directo y potencialmente material sobre el Enterprise Value. |
| Metodología propuesta v5.0 | Ninguna todavía. Antes de aprobar el WACC de Alpina: verificar explícitamente si la tasa de descuento (base USD nominal) es consistente con la moneda y el régimen de crecimiento de los flujos proyectados (COP nominal) — si no lo es, corresponde ajustar vía paridad de tasas de interés (Fisher) o usar una tasa base en COP en su lugar (ej. TES colombianos como risk-free en COP), no mezclar ambas sin ajuste. |
| Fundamento | Descontar flujos nominales en COP con una tasa construida sobre risk-free USD, sin ajuste, introduce un desajuste de inflación esperada entre ambas monedas (la inflación COP suele ser mayor que la USD) que puede sub o sobreestimar el valor presente de forma sistemática, dependiendo de la dirección del desajuste. |
| Fuente/evidencia | Decisión interna previa: ninguna. Inferencia de este documento a partir del código — no una decisión aprobada ni siquiera identificada como pendiente en ningún documento existente. Fuente externa recomendada, no consultada: Banco de la República (TES colombianos, expectativas de inflación) para evaluar si conviene una tasa base en COP; IVSC/Damodaran para el tratamiento estándar de consistencia moneda-flujo en DCF. |
| Impacto en código | Potencialmente alto si se decide corregir — afecta `financial-methodology.ts` (risk-free/ERP) y la relación entre `expectedGrowth`/`terminalGrowthPct` (temas 11, 14) y el WACC. No debe tocarse sin decisión explícita del revisor, dado el efecto material. |
| Test financiero requerido | Ninguno existe hoy que verifique consistencia moneda/inflación. Cuando se decida una metodología: test que confirme que WACC y `g` (crecimiento de ingresos y terminal) están expresados en la misma base nominal/real y en la misma moneda. |
| Pregunta que podría hacer un banquero senior | "Su risk-free es el Treasury americano, pero están descontando flujos en pesos colombianos — ¿cómo concilian esa inconsistencia de moneda e inflación?" |
| Respuesta que Nicolás debería ser capaz de defender | Hoy: no defendible — este es un gap metodológico real, no discutido en ningún documento interno hasta este momento, y que debe resolverse antes de presentar cualquier WACC de Alpina como definitivo. |

---

## 11. Terminal value

| Campo | Contenido |
|---|---|
| Tema | g, WACC > g, año estable, margen estable, ROC, reinvestment rate = g/ROC |
| Decisión histórica | Decisión 3 (`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`): 3% fijo actual **no** debe permanecer como metodología definitiva; es supuesto provisional. Revisor debe validar considerando inflación de largo plazo, crecimiento real, moneda, madurez, capacidad de reinversión sostenible, retorno en estado estable. `REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md §11`: "g=3%" listado explícitamente como hipótesis supersedida para aplicación universal. |
| Implementación actual | `canonical-financial-engine.ts:216-223`: Gordon Growth estándar, `terminalValue = FCFF_5 × (1+g) / (WACC−g)`, con verificación `WACC ≤ g → waccWarning`. `g = terminalGrowthPct/100 = 3%` (`financial-methodology.ts:103-113`) para el caso **base**. **Hallazgo nuevo de este documento, no registrado en ningún documento anterior revisado**: `canonical-financial-engine.ts:289-290` (`mkScenario`) usa `g` **hardcoded distinto** por escenario — `2%` para pesimista, `4%` para optimista — literales que no vienen de `CANONICAL_METHODOLOGY.assumptions.terminalGrowthPct` ni de ningún documento de decisión (ni Decisión 3, ni Decisión 8 sobre límites de escenarios los menciona). Sin verificación de que el año 5 represente un "estado estable" (margen constante en los 5 años por construcción, ver tema 14) ni de la tasa de reinversión implícita (`g/ROC`) — no se calcula ROC en ningún punto del motor. |
| Estado v5.0 | **OPEN** (el valor de `g`, pendiente de revisor — Decisión 3) + **IMPLEMENTATION MISMATCH** (los valores `2%`/`4%` de escenarios pesimista/optimista no están documentados en ninguna decisión ni derivados del `g` base de forma explícita — parecen valores redondos elegidos por conveniencia, el mismo patrón que la Decisión 8 ya señaló para los multiplicadores de escenario) |
| Metodología propuesta v5.0 | Ninguna nueva sobre el valor de `g` en sí (sigue pendiente de revisor, Decisión 3). Sí corresponde documentar o corregir el hallazgo del `g` hardcoded por escenario — como mínimo, que quede registrado como una decisión (aunque sea provisional) en vez de un literal sin trazabilidad; como mejor alternativa, derivarlo del `g` base ± un delta explícito y aprobado, igual que ya se hace con WACC/margen en los escenarios. Antes de aprobar cualquier `g` para Alpina, verificar consistencia con inflación de largo plazo COP y con el crecimiento potencial real del sector de Alpina (bienes de consumo/lácteos) — no citado en ningún documento existente. |
| Fundamento | Un `g` terminal domina típicamente el Enterprise Value en un DCF a 5 años (confirmado en `DECISIONES-FINANCIERAS-PENDIENTES.md` #3); usar valores no trazables por escenario socava la credibilidad del rango pesimista/optimista completo, no solo del caso base. |
| Fuente/evidencia | Decisión interna previa (Decisión 3, metodología pendiente). Hallazgo de código nuevo (este documento) para el `g` de escenarios — sin fuente externa, es un hallazgo de auditoría de consistencia interna. Fuente externa recomendada para el `g` base, no consultada aún: Banco de la República/DANE (crecimiento potencial e inflación de largo plazo de Colombia), Damodaran (relación estándar `g ≤ crecimiento nominal de la economía`). |
| Impacto en código | `canonical-financial-engine.ts:289-290` — los literales `2`/`4` deberían quedar trazables (documentados o derivados) antes del caso Alpina, incluso si el valor exacto no cambia todavía. `financial-methodology.ts:103-113` si el `g` base cambia tras revisión. |
| Test financiero requerido | Nuevo: verificar que el `g` de cada escenario (pesimista/base/optimista) esté documentado/trazable — no existe hoy ningún test que lo cubra, y ningún documento (`MATRIZ-DE-PRUEBAS-FINANCIERAS.md` incluida) lo menciona. |
| Pregunta que podría hacer un banquero senior | "¿De dónde salen el 2% y el 4% de crecimiento terminal en sus escenarios pesimista y optimista? ¿Por qué no son simplemente 3% ± algo documentado?" |
| Respuesta que Nicolás debería ser capaz de defender | Hoy: no defendible — ni siquiera Nicolás tenía este hallazgo documentado antes de esta reconciliación; son valores sin trazabilidad descubiertos en esta revisión de código. |

---

## 12. Enterprise Value → Equity Value

| Campo | Contenido |
|---|---|
| Tema | Deuda financiera, leases, debt-like items, caja, restricted cash, exceso de caja, activos no operacionales, associates, minorities, evitar doble conteo |
| Decisión histórica | Ninguna decisión específica del fundador. Evidencia interna extensa y explícitamente no resuelta desde `EXPEDIENTE-DE-VALORACION-V1.md §20`, acumulada durante el estudio manual de 8 casos históricos (Tecnoglass, Terpel, Ecopetrol, Grupo Éxito, ISA, Bancolombia, Goldman Sachs, Munich Re): perímetro de consolidación/NCI escaló de "problema demostrado, evidencia insuficiente" (Caso 03, Ecopetrol/ISA) a **"PROBLEMA MUY FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS"** (Caso 08, Munich Re) — **sin que en ningún momento se declare resuelto ni se cree ninguna estructura** (`case_perimeter` nunca se implementa, por decisión explícita documentada en cada caso). Candidato F ("disponibilidad económica de recursos" — caja contable ≠ caja disponible, incluye caja restringida) elevado formalmente a candidato tras evidencia en ISA, Bancolombia, Goldman Sachs y Munich Re (líneas 818-858). |
| Implementación actual | `capital-structure.ts:63`: `netDebt = totalDebt − cash`, sin distinguir caja restringida de caja disponible, sin leases (NIIF 16/IFRS 16) como debt-like item (`structured_input` no tiene un campo de pasivo por arrendamiento separado de `financial_debt_total`, confirmado en `structured-input-builder.ts:175-187`), sin pensiones ni contingencias como debt-like, sin ajuste por associates/JV (equity method), sin sustracción de intereses minoritarios (NCI). `canonical-financial-engine.ts:227`: `equityValue = max(enterpriseValue − netDebt, 0)` — puente simple, sin ningún ítem adicional. |
| Estado v5.0 | **OPEN** — y de forma inusual dentro de este documento, es el tema con **más evidencia acumulada** de los 16 (8 casos reales estudiados, candidatos con nombre propio, estados de evidencia graduados explícitamente), y aun así **deliberadamente no resuelto**: cada uno de los 8 reportes de caso concluye explícitamente "no se crea `case_perimeter` ni ninguna estructura" — es la constatación más fuerte de todo el corpus revisado de que "evidencia suficiente para exigir tratamiento metodológico" no equivale a "evidencia suficiente para diseñar una solución general". |
| Metodología propuesta v5.0 | Ninguna general todavía — sería exactamente el error que el propio Expediente evita cometer (forzar una regla universal de perímetro/NCI/caja disponible antes de tener un caso real que la exija con la forma correcta). Para Alpina específicamente: verificar si Alpina tiene subsidiarias con NCI material, caja restringida, o pasivos por arrendamiento significativos — si no los tiene, el puente EV→Equity simple puede ser suficiente para este caso concreto sin necesitar resolver el problema general primero. Si los tiene, ese sería el primer caso real que justifique diseñar (no antes) una representación específica. |
| Fundamento | Forzar un tratamiento genérico de NCI/leases/caja restringida sin un caso real que lo exija repetiría exactamente el patrón "ESTADOS FINANCIEROS → FÓRMULAS → VALORACIÓN" que la reorientación de 2026-08-10 abandonó — la disciplina de mantenerlo `OPEN` hasta tener evidencia suficiente es, en sí misma, la metodología correcta bajo v5.0, no una omisión. |
| Fuente/evidencia | Decisión interna previa: ninguna decisión cerrada — evidencia interna extensa (8 casos, `EXPEDIENTE-DE-VALORACION-V1.md §20-28`) que documenta el problema sin resolverlo. Fuente externa recomendada para cuando se decida: IVSC (tratamiento de NCI y activos no operacionales en International Valuation Standards), IFRS Foundation (NIIF 16 para el tratamiento de leases como debt-like item) — no consultadas todavía porque no hay caso concreto que las requiera aún. |
| Impacto en código | Ninguno hoy — `capital-structure.ts:63` y `canonical-financial-engine.ts:227` permanecen como están hasta que un caso real (posiblemente Alpina, si tiene subsidiarias/NCI/leases materiales) lo exija. |
| Test financiero requerido | Ninguno nuevo hasta que exista un caso real con NCI/leases/caja restringida material. Si Alpina lo tiene: test de identidad que verifique que `equityValue` refleja correctamente la exclusión de NCI y de caja restringida, con el tratamiento que se decida caso por caso. |
| Pregunta que podría hacer un banquero senior | "¿Cómo tratan los intereses minoritarios, los arrendamientos NIIF 16 y la caja restringida en su puente de Enterprise Value a Equity Value?" |
| Respuesta que Nicolás debería ser capaz de defender | "Todavía no tenemos una metodología general — la evidencia de 8 casos históricos que estudiamos (Ecopetrol, ISA, Bancolombia, Goldman Sachs, Munich Re, entre otros) muestra que este es un problema real y no trivial, y decidimos deliberadamente no resolverlo con una regla genérica hasta tener un caso real que la exija con la forma correcta. Para Alpina, verificamos primero si aplica." — defendible como postura metodológica seria, siempre que sea cierto que se verificó el caso Alpina específicamente antes de aplicar el puente simple. |

---

## 13. Private-company adjustments

| Campo | Contenido |
|---|---|
| Tema | DLOM, size premium, concentración, cuándo NO aplicarlos, riesgo de doble conteo |
| Decisión histórica | Ninguna decisión específica sobre DLOM o size premium como tales. `PLAN-VALIDACION-REVISOR-FINANCIERO.md` pregunta 1 menciona "prima por tamaño" como parte del paquete de supuestos de mercado a validar (Decisión 1), pero nunca se desarrolla como concepto separado, nunca se define un valor, nunca se discute cuándo aplicarlo ni el riesgo de doble conteo con el ERP de mercados emergentes (que puede ya incorporar parte de ese ajuste, ver tema 7). |
| Implementación actual | No existe ningún campo, constante ni lógica de DLOM (descuento por falta de liquidez de mercado), size premium, ni ajuste por concentración (de clientes, de propiedad) en ninguno de los 7 archivos de código revisados. `financial-methodology.ts` tiene exactamente 8 supuestos y ninguno es DLOM ni size premium. |
| Estado v5.0 | **OPEN** — sin metodología, sin valor, sin siquiera un placeholder marcado `approved: false` como los otros 8 supuestos. Es, junto con el tema 3 (normalización de EBITDA), uno de los dos temas con menor desarrollo metodológico interno de los 16. |
| Metodología propuesta v5.0 | Ninguna todavía. Cuando se defina (probablemente junto con la Decisión 1, costo de equity): verificar explícitamente el riesgo de doble conteo señalado en el tema 7 — si el ERP "Emerging Markets" de Damodaran ya incorpora parte del riesgo país/tamaño, agregar una prima adicional sin verificar eso sería sobreestimar el riesgo dos veces. |
| Fundamento | DLOM y size premium son ajustes materiales en valoración de empresas privadas/PyMEs (Alpina es una empresa privada colombiana, el segmento exacto donde estos ajustes suelen ser más relevantes que para una empresa pública comparable) — omitirlos sin justificación explícita, o aplicarlos sin verificar doble conteo, son ambos errores metodológicos reales. |
| Fuente/evidencia | Decisión interna previa: ninguna. Sin fuente externa consultada todavía — cuando se desarrolle, las fuentes primarias recomendadas son IVSC (tratamiento de descuentos y primas en International Valuation Standards) y Damodaran (metodología específica de size premium y su relación con el ERP de mercados emergentes, para evitar el doble conteo). |
| Impacto en código | Ninguno hoy — no hay código que modificar porque no hay valor ni fórmula que exista todavía. Futuro: un nuevo campo en `financial-methodology.ts` o, más probablemente dado que es un ajuste caso-específico (depende de la liquidez y concentración reales de Alpina), una entrada de `case_assumptions` del Expediente en vez de un supuesto canónico global. |
| Test financiero requerido | Ninguno posible hasta tener metodología. |
| Pregunta que podría hacer un banquero senior | "¿Aplicaron algún descuento por iliquidez o prima por tamaño a Alpina? Si no, ¿por qué no, dado que es una empresa privada?" |
| Respuesta que Nicolás debería ser capaz de defender | Hoy: no defendible — es un vacío metodológico real, no una decisión deliberada de excluirlos. Debe resolverse explícitamente antes de presentar la valoración de Alpina como completa, no dejarse como omisión silenciosa. |

---

## 14. Forecast

| Campo | Contenido |
|---|---|
| Tema | Horizonte, 5 años hardcoded actual, drivers de ingresos, márgenes, WC, CAPEX |
| Decisión histórica | Decisión 4 (`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`): mantener 5 años fijos por ahora como comportamiento confirmado; horizonte variable diferido; reglas de selección futura pendientes de revisor. `REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md §11`: "5 años" listado explícitamente como hipótesis supersedida para aplicación universal, "permanece como placeholder técnico provisional". |
| Implementación actual | `canonical-financial-engine.ts:143` (`computeProjections`): `for (let t=1; t<=5; t++)` hardcoded, sin ningún input de metadata que lo haga variable (confirmado también por `calculation-preflight.ts:110-119`, que registra `projection_horizon_years` como supuesto no rastreado y siempre bloqueante). Driver de ingresos: un único `growth` (`expectedGrowth` o fallback 25%, `canonical-input-normalization.ts:90-91`) compuesto geométricamente los 5 años, sin desaceleración ni curva de convergencia al `g` terminal. Margen EBITDA: constante los 5 años (mismo `ebitdaMargin` histórico usado en cada año de la proyección, `canonical-financial-engine.ts:147`), sin modelar mejora/deterioro hacia un margen de estado estable. CAPEX/WC: % fijo de ingresos cada año (temas 4, 5), sin convergencia explícita hacia el año terminal. |
| Estado v5.0 | **KEEP** (5 años como placeholder provisional explícito — ya confirmado por el fundador, y correctamente etiquetado como tal, no como verdad metodológica) para el horizonte en sí. **OPEN** (reglas de selección de horizonte variable, pendientes de revisor). **IMPLEMENTATION MISMATCH**: el forecast completo (margen, WC, CAPEX planos durante los 5 años, sin ninguna convergencia a un estado estable) contradice directamente la nueva premisa de la reorientación de 2026-08-10 ("cada empresa debe entenderse individualmente antes de construir una valoración", con pasos explícitos de "DEFINIR HIPÓTESIS" y "SELECCIONAR MÉTODO") — el motor sigue produciendo una proyección mecánica idéntica en su estructura para cualquier empresa, independientemente de qué hipótesis específicas se documenten en el Expediente, porque el Expediente todavía no está conectado al motor (`EXPEDIENTE-DE-VALORACION-V1.md §13`, explícitamente fuera de alcance de V1). |
| Metodología propuesta v5.0 | Mantener 5 años como placeholder (ya decidido). No proponer todavía reglas de horizonte variable (pendiente de revisor). Para Alpina: aunque el motor siga proyectando mecánicamente, el Expediente debería documentar explícitamente por qué 5 años/margen plano/CAPEX-WC fijos son o no son razonables para el perfil específico de Alpina — de forma que la limitación quede reconocida y justificada caso por caso, no oculta detrás de la ejecución del motor. |
| Fundamento | Un horizonte y una estructura de proyección mecánicos son aceptables como *placeholder técnico documentado*, pero no como *metodología defendible* sin que el Expediente registre explícitamente por qué se consideran razonables (o insuficientes, con advertencia) para el caso específico. |
| Fuente/evidencia | Decisión interna previa (Decisión 4, aprobada, para el horizonte). Reorientación de negocio (aprobada) para el principio general de comprensión caso-específica. Sin fuente externa consultada — la pregunta de cuántos años proyectar depende del caso, no de un estándar externo genérico. |
| Impacto en código | Ninguno requerido para el horizonte en sí (ya decidido mantenerlo). Si se decide documentar la limitación del margen/WC/CAPEX plano: no es un cambio de código, es contenido del Expediente (entidad `projection_hypotheses`, no implementada, `01-scope-surgery.md §3.2`). |
| Test financiero requerido | Existente: `R-20` (`MATRIZ-DE-RIESGOS.md`) ya registra que ningún motor advierte cuando el horizonte fijo produce un EV negativo o no estabilizado (Caso Dorado B) — sigue sin implementarse. Nuevo: ninguno adicional requerido hasta decisión de revisor sobre horizonte variable. |
| Pregunta que podría hacer un banquero senior | "¿Por qué asumen el mismo margen EBITDA constante los 5 años? ¿Alpina no tiene ninguna tendencia de mejora o deterioro de margen proyectada?" |
| Respuesta que Nicolás debería ser capaz de defender | "El motor de cálculo usa una estructura de proyección plana como placeholder técnico provisional — la comprensión específica de la trayectoria de márgenes de Alpina vive en el Expediente de Valoración, no en el motor, que todavía no está conectado al Expediente" — defendible solo si el Expediente de Alpina realmente documenta y justifica esa limitación, no si simplemente se ignora. |

---

## 15. Sensibilidades

| Campo | Contenido |
|---|---|
| Tema | WACC/g, revenue, EBITDA margin, WC, reinversión, downside de −300bps de EBITDA margin |
| Decisión histórica | Decisión 8 (`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`): mantener provisionalmente escenarios optimista/pesimista con multiplicadores fijos de growth/margen/WACC (servidor no varía CAPEX/WC por escenario — reversión explícita de un intento previo no autorizado, `REPORTE-RECONCILIACION-METODOLOGICA.md` fila 1); metodología definitiva de límites/multiplicadores pendiente de revisor. Ningún documento interno menciona una sensibilidad específica de −300bps de margen EBITDA como caso de prueba — es un requisito de este mismo encargo de reconciliación, no una decisión previa registrada. |
| Implementación actual | `canonical-financial-engine.ts:248-258` (matriz 5×5): varía **WACC** (`wd` de −2 a +2 puntos) × **crecimiento terminal `g`** (`gd` de −2 a +2 puntos) — **no** varía ingresos, margen EBITDA, capital de trabajo, ni reinversión. `:230-241` (`evLow`/`evHigh`): solo ±1% de WACC. `:277-290` (escenarios pesimista/base/optimista): varían growth (×0.6/×1.4), margen EBITDA (∓3pp/±3pp), WACC (±1.5pp) y `g` terminal (2%/4%, hallazgo del tema 11) — **no** varían CAPEX ni WC (Decisión 8, confirmado). No existe en ningún punto del motor canónico una sensibilidad aislada de solo EBITDA margin, solo revenue, solo WC, ni de reinversión (CAPEX/WC) por separado — la matriz 5×5 y el rango ±1% cubren únicamente WACC y `g` terminal. |
| Estado v5.0 | **IMPLEMENTATION MISMATCH** — el motor canónico no tiene ninguna sensibilidad de revenue, EBITDA margin, WC o reinversión de forma aislada (solo las variaciones combinadas y fijas de los 3 escenarios); la matriz 5×5 y el rango ±1% cubren exclusivamente WACC/g terminal. Un análisis de sensibilidad de "−300bps de margen EBITDA" específicamente **no puede producirse hoy sin modificar el motor o construirlo ad hoc fuera de él**. **OPEN** para los multiplicadores de escenario en sí (Decisión 8, pendiente de revisor). |
| Metodología propuesta v5.0 | Ninguna metodología nueva de multiplicadores todavía (pendiente de revisor, Decisión 8). Si el documento final de metodología o el informe de Alpina requiere mostrar sensibilidad aislada de EBITDA margin (ej. el downside de −300bps mencionado en el encargo de este mismo bloque), esa sensibilidad no existe en el motor hoy — debe decidirse explícitamente si se construye como una extensión del motor canónico (nueva función de sensibilidad de un solo factor) o se calcula fuera de él para el caso Alpina, sin modificar el comportamiento actual de escenarios/matriz sin autorización (mismo patrón que ya causó la reversión documentada en la Decisión 8). |
| Fundamento | Mostrar sensibilidad únicamente de WACC/g es insuficiente para un análisis defendible frente a un comité o un banquero — el margen EBITDA y la reinversión son con frecuencia los drivers de mayor incertidumbre real en una PyME/empresa privada, más que el WACC en sí. |
| Fuente/evidencia | Decisión interna previa (Decisión 8, para escenarios; pendiente de revisor). Hallazgo de código (este documento) para la ausencia de sensibilidades de un solo factor distintas de WACC/g. Sin fuente externa consultada — es un hallazgo de cobertura, no una elección entre alternativas metodológicas externas. |
| Impacto en código | Si se autoriza: nueva función de sensibilidad de un solo factor en `canonical-financial-engine.ts` (o un módulo nuevo), sin tocar `mkScenario` ni la matriz 5×5 existentes — evitar repetir el patrón de "corrección" no autorizada que ya causó una reversión documentada en este mismo motor (Decisión 8). |
| Test financiero requerido | Nuevo: si se implementa, un test de sensibilidad aislada de EBITDA margin (incluyendo el caso −300bps) sobre los 3 casos dorados existentes, análogo a la sensibilidad de WACC ya probada. No existe hoy ningún test de este tipo. |
| Pregunta que podría hacer un banquero senior | "Muéstrenme qué pasa con el Enterprise Value de Alpina si el margen EBITDA cae 300 puntos básicos, manteniendo todo lo demás constante." |
| Respuesta que Nicolás debería ser capaz de defender | Hoy: no puede responderse directamente desde el motor — requeriría construir esa sensibilidad específica primero, algo que no existe en el código actual y que debe decidirse explícitamente, no fabricarse ad hoc para una sola conversación. |

---

## 16. Timing

| Campo | Contenido |
|---|---|
| Tema | Valuation date, stub periods, year-end vs. mid-year convention |
| Decisión histórica | Ninguna. Ningún documento interno revisado (incluyendo `EXPEDIENTE-DE-VALORACION-V1.md`, que sí discute extensamente atribución temporal/corte de conocimiento como "Candidato C" — líneas 741-761, elevado a "PROBLEMA METODOLÓGICO MUY FUERTEMENTE RESPALDADO POR MÚLTIPLES CASOS" tras el Caso 08) trata específicamente la convención de descuento (year-end vs. mid-year) ni los stub periods de una fecha de valoración que no coincide con el cierre fiscal. El Candidato C del Expediente es un problema relacionado pero distinto (atribución temporal de eventos económicos, no la convención de descuento del DCF en sí). |
| Implementación actual | `canonical-financial-engine.ts:158`: `discountedFcf = fcff / (1+waccDecimal)^t`, con `t` entero (1 a 5) — convención de fin de año (year-end), no mid-year. No existe ningún campo de "fecha de valoración" explícito distinto de la fecha de creación del análisis/documentos (`structured-input-builder.ts` tiene `createdAt`, `basePeriod`, `periods`, pero ningún campo `valuation_date` conceptualmente separado). Sin manejo de período parcial (stub period) si la fecha de valoración no coincide con el inicio de un año fiscal completo — el primer año proyectado (`t=1`) siempre se trata como un año completo. |
| Estado v5.0 | **OPEN** — sin ninguna decisión ni siquiera un hallazgo documentado en ningún lugar antes de este documento. |
| Metodología propuesta v5.0 | Ninguna todavía. Antes de aprobar la valoración de Alpina: definir explícitamente la fecha de valoración (`valuation_date`) como campo distinto del período contable base, y decidir si corresponde un stub period (si la fecha de valoración cae a mitad de año fiscal) y si corresponde mid-year convention (más preciso para flujos que se generan a lo largo del año, en vez de al cierre) — ninguna de las dos decisiones se toma en este documento. |
| Fundamento | La convención year-end vs. mid-year tiene un efecto sistemático (aunque generalmente menor que WACC/g) sobre el valor presente de cada flujo — omitirla sin decisión explícita es un vacío metodológico, no una elección neutral. |
| Fuente/evidencia | Decisión interna previa: ninguna. Sin fuente externa consultada — cuando se decida, IVSC / International Valuation Standards trata explícitamente la convención de timing como parte de la definición de la fecha de valoración. |
| Impacto en código | Si se decide mid-year convention: `canonical-financial-engine.ts:158` (`t` pasaría a `t−0.5` en el descuento, o un ajuste equivalente) — cambio de fórmula que afecta los 3 casos dorados y requiere re-verificación completa, no un cambio trivial. |
| Test financiero requerido | Ninguno existe hoy. Si se decide una convención: test de identidad que verifique la fecha de valoración explícita y la convención de descuento aplicada de forma consistente en los 5 años y en el valor terminal. |
| Pregunta que podría hacer un banquero senior | "¿Cuál es exactamente la fecha de valoración de Alpina, y están usando convención de mitad de año o de fin de año para descontar los flujos?" |
| Respuesta que Nicolás debería ser capaz de defender | Hoy: no defendible — no hay una fecha de valoración explícita ni una convención de descuento decidida; el motor asume implícitamente fin de año sin que nadie lo haya decidido así de forma consciente. |

---

## A. Decisiones metodológicas ya sólidas

Solo las que sobreviven la pregunta del banquero senior **hoy**, sin depender de trabajo futuro:

1. **Estructura algebraica del FCFF** (tema 2) — NOPAT sobre EBIT sin clamp, exclusión de intereses del flujo, EV−netDebt=Equity. Consistente con la práctica CFA estándar de un flujo unlevered capital-structure-neutral. Pendiente solo de formalización escrita (Decisión 7), no de cambio de fondo.
2. **Uso de utilidad neta para ROE/ROA vs. NOPAT para el DCF** (parte del tema 2) — Decisión 7, ya aprobada por el fundador, defendible como intencional.
3. **Estructura de capital observada como política de producto por defecto** (tema 9) — Decisión 2, ya aprobada; reduce supuestos discrecionales, es la opción más simple y más defendible mientras no exista evidencia de que Alpina requiere un método alternativo.
4. **Horizonte de 5 años como placeholder técnico explícito, no como verdad metodológica** (tema 14) — Decisión 4, ya aprobada, correctamente etiquetado como provisional.
5. **Disciplina de mantener `OPEN` el puente EV→Equity (NCI, leases, caja restringida)** (tema 12) — no es una laguna accidental, es la conclusión correcta y bien evidenciada (8 casos reales) de que forzar una regla general sin caso concreto repetiría el error que la reorientación de 2026-08-10 corrigió.

## B. Decisiones que deben cambiar

1. **`Math.abs()` sobre `equity`** (tema 1) — contradice directamente la Decisión 6 ya aprobada por el fundador. No requiere nueva decisión metodológica, requiere ejecutar el cambio de código ya autorizado, sincronizado con el fingerprint.
2. **`g` terminal hardcoded distinto por escenario (2%/4%) sin trazabilidad** (tema 11) — hallazgo nuevo de este documento; como mínimo debe documentarse su origen, o derivarse explícitamente del `g` base con un delta aprobado.
3. **Fallback 70/30 silencioso ante `equity=0` observado** (tema 9) — no requiere resolver la Decisión 2 de nuevo, requiere hacer visible (warning) una decisión que ya existe mecánicamente en el código.

## C. Decisiones todavía abiertas

Sin evidencia interna ni externa suficiente para decidir — no se fuerza cierre:

1. Fuentes/valores definitivos del WACC completo: risk-free, ERP, beta, costo de deuda, prima país/tamaño (temas 7, 8, 13) — Decisión 1, sin revisor identificado.
2. Consistencia moneda/inflación del WACC frente a flujos COP (tema 10) — gap no discutido en ningún documento hasta este.
3. `g` terminal definitivo (tema 11) — Decisión 3.
4. Normalización de EBITDA (tema 3) — sin metodología, ni borrador.
5. Composición del capital de trabajo operativo (tema 4) — pregunta abierta desde el Caso 02, sin resolver en 6 casos posteriores.
6. CAPEX de mantenimiento vs. crecimiento (tema 5).
7. Tasa de impuestos — verificación contra fuente primaria vigente (tema 6).
8. Impuestos y utilidad histórica, materialidad (Decisión 5, tema 3/6).
9. Estructura de capital objetivo/override (Decisión 2, función de consultoría, tema 9).
10. Multiplicadores de escenarios pesimista/optimista (Decisión 8, tema 15).
11. Reglas de horizonte variable (Decisión 4, tema 14).
12. Perímetro de consolidación, NCI, associates, leases, caja restringida en el puente EV→Equity (tema 12) — el tema con más evidencia acumulada y, correctamente, sin cerrar.
13. DLOM, size premium, ajustes por concentración (tema 13) — sin desarrollo alguno.
14. Sensibilidades de un solo factor (revenue, EBITDA margin, WC, reinversión) más allá de WACC/g (tema 15).
15. Fecha de valoración, stub periods, convención year-end/mid-year (tema 16).

## D. Mismatches entre metodología y código

1. **Tema 1** — `Math.abs()` sobre `equity` contradice la Decisión 6 ya aprobada.
2. **Tema 4** — `structured_input` captura AR/inventario/AP reales que el motor canónico ignora, usando en su lugar un 3% fijo de ingresos.
3. **Tema 9** — fallback 70/30 se activa silenciosamente ante `equity=0` observado, sin ninguna advertencia visible.
4. **Tema 11** — `g` terminal de escenarios pesimista/optimista (2%/4%) hardcoded sin relación documentada con el `g` base (3%) ni con ninguna decisión aprobada.
5. **Tema 14** — el forecast (margen/CAPEX/WC planos durante 5 años) contradice mecánicamente la nueva premisa "comprender la empresa antes de valorar" de la reorientación de 2026-08-10, porque el Expediente todavía no está conectado al motor.
6. **Tema 15** — no existe en el motor ninguna sensibilidad aislada de revenue, EBITDA margin, WC o reinversión — solo WACC/g terminal, pese a que escenarios sí varían margen (de forma combinada, no aislada).

## E. Orden exacto en que deben resolverse antes de escribir la metodología final

Basado en dependencias reales identificadas en este documento y en `01-scope-surgery.md §4/§8`, no en conveniencia editorial:

1. **Verificar/ejecutar el cambio ya autorizado del tema 1** (`Math.abs()` sobre `equity`, Decisión 6) — es el único punto de este documento donde ya existe una decisión aprobada que el código contradice; resolverlo primero evita que cualquier caso de prueba posterior (incluido Alpina) se construya sobre un motor que sigue violando una decisión ya tomada.
2. **Resolver la consistencia moneda/inflación del WACC** (tema 10) — afecta directamente el WACC completo (temas 7, 8, 11) y debe decidirse antes de fijar cualquier valor de risk-free/ERP definitivo, no después.
3. **Cerrar el paquete WACC completo con el revisor financiero externo** (temas 7, 8, 13 — Decisión 1) — sigue siendo el bloqueante estructural más grande de todo el corpus (`R-19`, severidad Alta sin cambios), y varios otros temas (10, 11) dependen de sus valores finales.
4. **Definir `g` terminal y corregir la trazabilidad de sus valores por escenario** (tema 11, Decisión 3) — depende de 2 y 3 (moneda/WACC).
5. **Definir tasa de impuestos verificada contra fuente primaria** (tema 6, Decisión 5) — alimenta directamente el NOPAT (tema 2) y el FCFF completo.
6. **Resolver CAPEX/D&A/working capital operativo con evidencia del caso Alpina específico** (temas 4, 5) — no antes de tener el caso real, por diseño (evita repetir el error de la reorientación).
7. **Definir estructura de capital para Alpina específicamente** (tema 9) — depende de 3 (WACC) y del perfil real de Alpina (¿institución financiera atípica o empresa operativa estándar?).
8. **Evaluar necesidad de tratamiento de perímetro/NCI/leases/caja restringida para Alpina** (tema 12) — solo si la evidencia real de Alpina lo exige, no antes.
9. **Decidir necesidad de DLOM/size premium para Alpina** (tema 13) — depende de 3 (para evitar doble conteo con el ERP).
10. **Definir normalización de EBITDA para Alpina con evidencia real** (tema 3) — requiere los documentos y respuestas reales del caso, no puede adelantarse.
11. **Definir fecha de valoración y convención de timing** (tema 16) — puede resolverse en paralelo a 6-10, no depende de ellos, pero debe cerrarse antes del cálculo final.
12. **Construir sensibilidades de un solo factor si el informe de Alpina las requiere** (tema 15) — al final, una vez el caso base esté completo, para no sensibilizar sobre una metodología todavía inestable.

Solo después de resolver 1-11 (12 es paralelo/independiente) corresponde escribir el documento final de metodología de 10–15 páginas — escribirlo antes fijaría por escrito decisiones que este mismo documento marca explícitamente como `OPEN`.
