# Bloque 3B — Tests-first de los root causes universales

**Fecha:** 2026-09-03
**Autoridad:** `04-VALUATION-METHODOLOGY-V5.md` v1.1, `05-financial-engine-audit.md` v1.3.
**Checkpoints previos:** `6748a6a` (metodología), `dc3e2fb` (auditoría).
**Naturaleza:** tests-first. Ningún archivo de lógica productiva fue modificado. Los expected failures (`it.fails`) son deliberados — expresan comportamiento v5 correcto todavía no implementado, no errores de escritura de test.

**Alcance de esta metodología:** Velarix v5 se construye primero como modelo financiero técnico/personal — el motor, el contrato de supuestos resueltos y su suite de tests se diseñan para ser correctos en general, no en función de una empresa concreta. Ninguna empresa real define la arquitectura. Los ejemplos de este documento y de sus fixtures usan un **flagship case** genérico (el primer caso completo que se ejecutará una vez cerrado Bloque 3C) — qué empresa concreta sea ese flagship case es una decisión todavía no tomada y fuera del alcance de este bloque.

---

## 0. Verificación inicial

`git status --short` antes de empezar (Bloque 3B): vacío. Working tree limpio, confirmado contra `dc3e2fb`.

Tests existentes inventariados antes de escribir nada nuevo:

| Área | Archivo(s) existentes | Relevancia |
|---|---|---|
| canonical input normalization | *(ninguno — sin archivo `.test.ts` dedicado, confirmado en `05 v1.3` Test Audit)* | El `Math.abs()` de RC-1 no tiene protección de test directa; solo se ejercita indirectamente vía golden cases |
| capital structure | `capital-structure.test.ts` (12 tests) | Fija el fallback 70/30 y el `Math.abs()` de deuda como comportamiento esperado hoy |
| preflight | `calculation-preflight.test.ts` (13 tests), `calculation-preflight.integration.test.ts` (5 tests) | Fija y documenta explícitamente que `passed` nunca puede ser `true` hoy (test 1) |
| canonical engine | `canonical-financial-engine.golden-cases.test.ts` (7 tests, 3 fixtures A/B/C) | Fija WACC/EV/EquityValue/FCFF de los 3 casos dorados, incluyendo el Caso C con equity negativo sintético |
| fingerprint | `calculation-fingerprint.test.ts` (16 tests) | Fija que el fingerprint depende únicamente de una lista blanca de campos de evidencia |
| calculation versioning | `calculation-versioning.test.ts` (7 tests) | Fija que `assumptions_snapshot` siempre refleja `CANONICAL_METHODOLOGY` |
| source input snapshot | `source-input-snapshot.test.ts` (7 tests) | Fija el passthrough literal de evidencia, sin recalcular |

No se modificó ninguno de estos 7 archivos, en ningún momento de Bloque 3B, 3B.1 ni 3B.2.

---

## 1. Archivos del bloque (final — 12 archivos)

Lista exacta, corregida (la versión anterior de este documento decía 11; `git status` siempre mostró 12):

1. `docs/velarix-v5/06-tests-first-plan.md`
2. `supabase/functions/_shared/resolved-calculation-assumptions.ts` — contrato `ResolvedCalculationAssumptions` (13 campos).
3. `supabase/functions/_shared/resolved-calculation-assumptions.fixtures.ts` — fixture 100% sintética.
4. `supabase/functions/_shared/resolved-calculation-assumptions.test.ts` — forma del contrato (13 tests, todos verdes).
5. `supabase/functions/_shared/calculation-preflight.v5.test.ts` — comportamiento v5 del preflight (16 tests: 3 verdes, 13 expected fail).
6. `supabase/functions/_shared/capital-structure.v5.test.ts` — RC-1, RC-2, legacy vs. v5, y consumo de componentes de Ke/WACC (20 tests: 6 verdes, 14 expected fail).
7. `supabase/functions/_shared/working-capital.v5.test.ts` — RC-4, `explicit_delta_nwc_by_year` (5 tests: 1 verde, 4 expected fail).
8. `supabase/functions/_shared/roe-negative-equity.v5.test.ts` — ROE ante equity no positivo (7 tests: 4 verdes, 3 expected fail).
9. `supabase/functions/_shared/calculation-fingerprint.v5.test.ts` — identidad Evidence + Judgment completa (11 tests: 4 verdes, 7 expected fail).
10. `supabase/functions/_shared/source-input-snapshot.v5.test.ts` — separación Evidence/Judgment en snapshots (7 tests, todos verdes).
11. `supabase/functions/_shared/calculation-versioning.v5.test.ts` — `assumptions_source` (7 tests: 2 verdes, 5 expected fail).
12. `supabase/functions/_shared/canonical-financial-engine.consumption.v5.test.ts` — consumo de Tax (marginal/explicit-path/debt-tax-shield separados), CAPEX, D&A, Terminal g (18 tests: 7 verdes, 11 expected fail). No estaba entre los 10 archivos originales de Bloque 3B — se creó porque la cobertura exigida (Tax/CAPEX/D&A/Terminal g) no encajaba temáticamente en ningún archivo v5 existente sin diluir su propósito.

**Patrón usado en todos los tests `it.fails` ("V5 OBJETIVO"):** llaman a la función REAL de producción con la forma que su firma debería aceptar en v5 (`resolvedAssumptions` como campo o parámetro adicional), usando un cast `as any` explícito y comentado — nunca una reimplementación local de la lógica que se está probando. Hoy esos campos se ignoran, así que las aserciones sobre comportamiento v5 fallan honestamente — y `it.fails` documenta esa falla como esperada en vez de romper la suite.

---

## 2. Correcciones aplicadas — historial completo (3B.1 y 3B.2)

### 3B.1

- **Fingerprint** corregido para depender del Judgment completo (`value`+`source`+`rationale`+`status`+`date`), no solo de `value`.
- **Book equity** retirado de `CapitalStructureValue` — es Evidence, no Judgment.
- **`leveredBeta`** retirado de `BetaTreatmentValue` — es Calculation (se recompone vía Hamada), no Judgment.
- **CAPEX/D&A** convertidos a uniones discriminadas por `mode` — nunca dos drivers simultáneos.
- **21 tests de consumo real** agregados (Ke/WACC en `capital-structure.v5.test.ts`; Tax/CAPEX/D&A/terminal g en el nuevo archivo de consumo).
- **Fixture** vuelto 100% sintético (`source: "SYNTHETIC_TEST_FIXTURE"`, encabezado `TEST DATA ONLY`).
- **Desanclaje** de este documento respecto de cualquier empresa concreta.

### 3B.2 (esta revisión — cierre técnico definitivo)

- **`TaxTreatmentValue` corregido** — separaba insuficientemente los tres conceptos fiscales exigidos por `04 §6.3/§6.4/§10.6` y `03 P-03/P-04`. Ahora transporta explícitamente:
  - `marginalRatePct` — tasa marginal/largo plazo (valor terminal).
  - `explicitFcffTaxRatePctByYear` — arreglo de tasas del horizonte explícito, una por año, longitud = `projectionHorizonYears`. Puede coincidir con la marginal si no hay diferencias temporales/NOLs, pero el contrato permite que sea distinta — nunca se reescribe automáticamente con la marginal.
  - `debtTaxShieldRatePct` — tasa económicamente relevante para `Kd×(1-T)`, independiente de las dos anteriores.
  - `nolsNotes` opcional, texto libre — **no** se construye ninguna máquina de estados de NOLs (acumulación, expiración, límites jurisdiccionales, utilización automática). El contrato transporta el path ya resuelto por Judgment humano; el motor solo lo ejecuta — mismo principio ya aplicado a CAPEX/D&A/ΔNWC.
- **Fixture fiscal corregido** para probar la separación: `marginalRatePct=35`, `explicitFcffTaxRatePctByYear=[20,24,28,32,35]`, `debtTaxShieldRatePct=30` — deliberadamente distintos entre sí, para que ningún bug de colapso pase desapercibido.
- **Helper `computeTargetCapm`** en `capital-structure.v5.test.ts` corregido: tanto el reapalancamiento de Hamada como el tax shield de `Kd` usan `debtTaxShieldRatePct` — no `marginalRatePct` (ambos gobiernan la misma pregunta económica: la deducibilidad fiscal de la deuda).
- **9 tests fiscales nuevos** en `canonical-financial-engine.consumption.v5.test.ts`, reemplazando los 2 anteriores (que colapsaban las tres tasas): consumo año-por-año del explicit path, no-uniformidad del path, fórmula exacta del debt tax shield, y 3 tests de separación (cambiar cada tasa por separado no debe afectar las otras dos).
- **1 test de preflight nuevo**: `explicitFcffTaxRatePctByYear.length === projectionHorizonYears`.
- **Falso positivo corregido en `calculation-versioning.v5.test.ts`**: un `toContain("35")` sobre el JSON serializado pasaba en verde hoy por una coincidencia de texto (`riskFreeRatePct: 4.35` ya contiene la subcadena "35"), no porque la tasa resuelta se usara realmente. Reemplazado por una comparación estructural directa entre el snapshot con `resolvedAssumptions` y el snapshot puramente legacy.
- **Los 57 tests verdaderamente "V5 OBJETIVO — todavía no implementado" convertidos a `it.fails`** (Vitest 4.1), verificados uno por uno contra la ejecución real antes de convertir — ningún test verde, de caracterización ("HOY") o legacy fue tocado. La suite completa ahora termina con **exit code 0**.
- **12 vs. 11 archivos**: corregido en este documento (siempre fueron 12 según `git status`; la versión anterior de este documento tenía un error de conteo).
- **"13 campos" vs. "12 drivers + 1 gate"**: corregido — ver §5.

---

## 3. Test inventory (final)

| Test / grupo | Behavior protected | Current status | Why |
|---|---|---|---|
| 7 archivos pre-existentes (67 tests) | Comportamiento legacy completo (capital structure, preflight, golden cases, fingerprint, versioning, snapshot) | 🟢 GREEN | No tocados en ningún momento de 3B/3B.1/3B.2 |
| `resolved-calculation-assumptions.test.ts` (13) | Forma del contrato de 13 campos; "Judgment no approvals"; book equity/leveredBeta fuera del contrato; CAPEX/D&A/Tax como forma inequívoca | 🟢 GREEN (13) | Pura verificación de tipos/forma |
| `capital-structure.v5.test.ts` (20) | RC-1 signo; RC-2 book equity nunca decide weights en v5; consumo de Ke/WACC (7 componentes + estructura) | 🟢 GREEN (6: 2 HOY + 2 LEGACY + 2 no-regresión) / 🔴 `it.fails` (14) | RC-1/RC-2/RC-3 no implementados |
| `working-capital.v5.test.ts` (5) | RC-4: consumo literal de `explicit_delta_nwc_by_year` | 🟢 GREEN (1 HOY) / 🔴 `it.fails` (4) | RC-4 no implementado |
| `roe-negative-equity.v5.test.ts` (7) | ROE `null` cuando equity ≤ 0, distinguible de 0% | 🟢 GREEN (4: 3 HOY + 1 no-regresión) / 🔴 `it.fails` (3) | Depende de RC-1 + ajuste de KPIs |
| `calculation-fingerprint.v5.test.ts` (11) | Identidad Evidence+Judgment completa (value/source/rationale/status/date) | 🟢 GREEN (4: 2 HOY + 2 no-regresión) / 🔴 `it.fails` (7) | RC-3 no implementado en el fingerprint |
| `calculation-preflight.v5.test.ts` (16) | La pregunta correcta del preflight; blockers específicos por campo/validación, incluyendo longitud del tax path | 🟢 GREEN (3 HOY) / 🔴 `it.fails` (13) | RC-3 no implementado |
| `source-input-snapshot.v5.test.ts` (7) | `source_input_snapshot` limitado a evidencia (permanente); especificación de `resolved_assumptions_used` | 🟢 GREEN (7) | Invariante permanente + especificación de helper de test |
| `calculation-versioning.v5.test.ts` (7) | `assumptions_source` distingue `resolved_case_input`/`legacy_canonical_default` | 🟢 GREEN (2 HOY) / 🔴 `it.fails` (5) | RC-3 no implementado en versioning |
| `canonical-financial-engine.consumption.v5.test.ts` (18) | Tax (3 tasas separadas), CAPEX (`explicit_path`), D&A (`explicit_path`, tax shield exacto), Terminal g | 🟢 GREEN (7: 4 HOY + 1 terminal-g-no-afecta-años + 1 marginal-no-reescribe + 1 debt-shield-HOY) / 🔴 `it.fails` (11) | RC-3 no implementado |

**Totales:** 104 tests nuevos (47 verdes + 57 `it.fails`) + 487 pre-existentes (todos verdes) = **591 tests, 534 passed, 57 expected fail, exit code 0**.

---

## 4. Expected failures (`it.fails`) — 57, por archivo

- **`capital-structure.v5.test.ts` (14):** signo negativo preservado; 3 estados de book equity con weights resueltos; señal de juicio requerido sin estructura resuelta; book equity como sanity check desde Evidence; baseline Ke/WACC; risk-free; mature ERP; CRP; lambda; beta (Hamada); costo de deuda; estructura de capital.
- **`calculation-preflight.v5.test.ts` (13):** pasa con los 13 resueltos; falla por ausencia total; falla por campo específico ausente; status≠resolved; source vacío; rationale vacío; weights inválidos; weights≠100%; horizonte≠5; ΔNWC con 4 valores; ΔNWC con 6 valores; longitud de `explicitFcffTaxRatePctByYear`≠horizonte; la pregunta correcta no depende de `CANONICAL_METHODOLOGY`.
- **`canonical-financial-engine.consumption.v5.test.ts` (11):** NOPAT por año vía `explicitFcffTaxRatePctByYear[t]`; no-uniformidad del path fiscal; debt tax shield vía `debtTaxShieldRatePct`; separación explicit-path↔año 3; separación debt-shield↔WACC; CAPEX consumido literalmente; aislamiento de CAPEX año 3; D&A consumido literalmente con coherencia EBIT/NOPAT; D&A año 3 vía tax shield exacto; terminal g mueve TV/EV; terminal g respeta WACC>g.
- **`calculation-fingerprint.v5.test.ts` (7):** terminal_g, capital_structure, ΔNWC, `source`, `rationale`, `status`, `date` cambian el fingerprint.
- **`working-capital.v5.test.ts` (4):** consumo literal por año; fórmula FCFF con ΔNWC explícito; aislamiento del año 3; no-interpretación como ratio.
- **`calculation-versioning.v5.test.ts` (5):** `assumptions_source` legacy; `assumptions_source` resolved; snapshot refleja lo resuelto; cambiar judgment cambia identidad; versioning no reporta defaults como usados (comparación estructural, no substring).
- **`roe-negative-equity.v5.test.ts` (3):** ROE `null` con equity=0; ROE `null` con equity<0; distinción null≠0%.

Total: 14+13+11+7+4+5+3 = **57** (coincide exactamente con `57 expected fail` de la ejecución real).

## Preserved green tests

**Los 7 archivos pre-existentes** (67 tests) permanecen verdes, sin modificación — confirmado por ejecución real.

**47 tests nuevos verdes**: los 13 de `resolved-calculation-assumptions.test.ts`, los describe "HOY"/"LEGACY" de caracterización en cada archivo v5, los 7 de `source-input-snapshot.v5.test.ts`, y las aserciones de no-regresión dentro de los describe "V5 OBJETIVO" que ya se cumplen hoy por construcción correcta previa.

## Legacy tests requiring later deliberate update

1. **`canonical-financial-engine.golden-cases.test.ts` — `EXPECTED_CASE_C`** (equity negativo sintético). RC-1 es vinculante e incondicional — una vez implementado, el equity de Caso C llegará como negativo real, y RC-2 debe decidir qué hacer sin estructura resuelta (señalar juicio requerido, no calcular mecánicamente). Caso C probablemente deje de tener un resultado numérico "limpio". Decisión de diseño para Bloque 3C — no resuelta aquí.
2. **`capital-structure.test.ts` — "equity <= 0: usa el peso de equity por defecto (0.70)"**. Evaluado — usa `equity: 0` (no negativo), sigue siendo comportamiento legacy legítimo. No requiere cambio.
3. **`financial-methodology.test.ts` — `taxRatePct.value === 30`**. Evaluado — `05 v1.3 §10` recomienda no cambiar el default global; el canal es `resolved_assumptions` para cualquier caso que lo necesite. No requiere cambio.
4. **Motor cliente/demo** (`financial-engine.golden-cases.test.ts`, `financial-engine.characterization.test.ts`): no usan `resolveEffectiveEquity`/`computeCapitalStructure` de `_shared`. No requieren actualización por RC-1/RC-2/RC-3/RC-4.

---

## 5. Cobertura de drivers financieros — precisión de alcance

**12 drivers financieros que deben afectar el cálculo tienen tests de consumo o comportamiento matemático**: `taxTreatment` (3 tasas separadas), `capitalStructure`, `riskFreeRateConstruction`, `matureErp`, `countryRiskPremium`, `countryRiskLambda`, `betaTreatment`, `costOfDebt`, `capexReinvestmentDriver`, `depreciationDaDriver`, `workingCapitalDriver`, `terminalG`.

**`projectionHorizonYears` no es un driver calculable de la misma naturaleza** — el motor permanece intencionalmente fijo en 5 años (no se hizo configurable en este bloque, por instrucción explícita). Se prueba únicamente como **restricción de compatibilidad/preflight**: el preflight debe rechazar un horizonte resuelto distinto de 5, y `explicitFcffTaxRatePctByYear`/`explicitDeltaNwcByYear` deben tener exactamente esa longitud. No existe, ni debería existir todavía, un "test de consumo" de horizonte en el sentido de "cambiar el horizonte mueve el resultado según una fórmula" — eso exigiría hacer el motor configurable, fuera de alcance.

Total: 12 drivers con test de consumo/comportamiento + 1 gate de compatibilidad = los 13 campos del contrato, todos cubiertos, pero no de la misma manera.

---

## Mapping

| Root cause | Test(s) que definen el comportamiento correcto | Futuro(s) archivo(s) de producción |
|---|---|---|
| RC-1 (signo de equity) | `capital-structure.v5.test.ts` › RC-1 | `canonical-input-normalization.ts` (`resolveEffectiveEquity`) |
| RC-2 (book equity no decide WACC en v5) | `capital-structure.v5.test.ts` › RC-2 | `capital-structure.ts` (`computeCapitalStructure`) |
| RC-1×RC-2 (interacción, KPIs) | `roe-negative-equity.v5.test.ts` | `canonical-financial-engine.ts` (`kpis.roe`) |
| RC-3 (contrato + preflight legítimo) | `calculation-preflight.v5.test.ts`, `resolved-calculation-assumptions.ts`/`.test.ts` | `calculation-preflight.ts`, `resolved-calculation-assumptions.ts` (ya existe, contrato congelado) |
| RC-3 (consumo Ke/WACC: Rf, ERP, CRP, λ, beta, Kd, estructura) | `capital-structure.v5.test.ts` › RC-3 consumo | `capital-structure.ts` |
| RC-3 (consumo tax — 3 tasas separadas/CAPEX/D&A/terminal g) | `canonical-financial-engine.consumption.v5.test.ts` | `canonical-financial-engine.ts` |
| RC-3 (consumo ΔWC) | `working-capital.v5.test.ts` | `canonical-financial-engine.ts` |
| RC-3 (reproducibilidad — fingerprint, Evidence+Judgment completo) | `calculation-fingerprint.v5.test.ts` | `calculation-fingerprint.ts` |
| RC-3 (reproducibilidad — versioning) | `calculation-versioning.v5.test.ts` | `calculation-versioning.ts` |
| RC-3 (reproducibilidad — snapshot de Judgment) | `source-input-snapshot.v5.test.ts` › Judgment spec | Nuevo: `resolved-assumptions-snapshot.ts` (no existe todavía) |
| RC-3 (envelope) | *(sin test dedicado — requiere `ejecutar-calculo/index.ts`, fuera del alcance de test unitario puro)* | `ejecutar-calculo/index.ts` |
| RC-4 (ΔWC) | `working-capital.v5.test.ts` | `canonical-financial-engine.ts` (`computeProjections`) |

---

## Definition of done for Bloque 3C

Cuando una implementación de 3C haga que un `it.fails` empiece a pasar, Vitest lo señala como **unexpected pass** (falla la suite hasta resolverlo). El procedimiento en ese momento: (1) verificar que pasó por la razón correcta, no por coincidencia; (2) convertir ese test de `it.fails` a `it`; (3) mantenerlo verde permanentemente.

- **RC-1 + RC-2 completos**: los 14 `it.fails` de `capital-structure.v5.test.ts` (RC-1/RC-2/RC-3-consumo) pasan a `it`; los describe "LEGACY" siguen verdes sin cambios; los "HOY" pueden retirarse. Los 3 `it.fails` de `roe-negative-equity.v5.test.ts` pasan a `it`. Decisión explícita tomada sobre `EXPECTED_CASE_C`.
- **RC-3 completo (preflight + consumo + reproducibilidad)**: los 13 `it.fails` de `calculation-preflight.v5.test.ts`, los 11 de `canonical-financial-engine.consumption.v5.test.ts`, los 7 de `calculation-fingerprint.v5.test.ts` y los 5 de `calculation-versioning.v5.test.ts` pasan a `it`. Los 5 tests de especificación de Judgment en `source-input-snapshot.v5.test.ts` migrados a verificación contra una función productiva real.
- **RC-4 completo**: los 4 `it.fails` de `working-capital.v5.test.ts` pasan a `it`.
- **En todo momento**: los 7 archivos de test pre-existentes (67 tests) permanecen verdes, salvo el cambio deliberado y documentado a `EXPECTED_CASE_C` si así se decide. La suite completa mantiene exit code 0 en cada etapa intermedia — nunca queda rota mientras se implementa 3C incrementalmente.

---

## Resultados de ejecución (Bloque 3B.2, verificados — no estimados)

```
Test Files  40 passed (40)
     Tests  534 passed | 57 expected fail (591)
Exit code: 0
```

**Typecheck**: no existe script `typecheck` en `package.json`, y `tsconfig.app.json` solo incluye `src/` — `supabase/functions/_shared` no está cubierto por ningún proyecto TS oficial. Se ejecutó `npx tsc --noEmit` de forma no destructiva, acotado a los 12 archivos de este bloque, con flags equivalentes a `tsconfig.app.json`: **0 errores, exit code 0**.

---

## Cierre

No se modificó ningún archivo de lógica productiva (`canonical-financial-engine.ts`, `capital-structure.ts`, `canonical-input-normalization.ts`, `calculation-preflight.ts`, `calculation-fingerprint.ts`, `calculation-versioning.ts`, `source-input-snapshot.ts`, `calculation-provenance.ts`, `ejecutar-calculo/index.ts` ni ningún otro Edge Function). No se modificaron migraciones, Supabase, secrets, `01`-`05`, frontend ni el motor demo. No se inició ningún caso real — el fixture usado en toda la suite es explícitamente sintético. No se eligió todavía el flagship case de Velarix v5. No se hizo commit.
