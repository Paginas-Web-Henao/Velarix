# 04 — Calidad Financiera

**Este es el documento prioritario de toda la auditoría.** El negocio no
puede cobrar por una valoración si el motor de cálculo tiene errores
(`Negocio_Velarix_v4.1.md` §10.1, §17). Ningún hallazgo aquí ha sido
corregido — solo documentado con evidencia exacta, causa raíz, impacto,
caso de regresión propuesto y severidad.

## Bugs previamente reportados — confirmación con evidencia

### 1. Consolidación de subcuentas — CONFIRMADO, CRÍTICO, BLOQUEANTE

El mismo patrón roto existe en **tres archivos independientes**, no solo
uno:
- `supabase/functions/build-structured-input/index.ts:34-40` (`getAccountValue`)
- `supabase/functions/validate-analysis/index.ts:23-26` (`getVal`)
- `supabase/functions/continuar-tras-revision/index.ts:80-83` (`getValue`)

Los tres usan `.find()` sobre `account_homologations` y toman **solo la
primera fila** que coincide con un `canonical_account`, en vez de sumar
todas.

**Por qué sí ocurre en producción, no es un caso extremo**:
`map-accounts/index.ts` (`TAXONOMY`, líneas 118-119) mapea `"caja"`,
`"bancos"`, `"cdt"` — las tres — al mismo canónico `cash`, con score 0.95
("alta" confianza) desde el Pass 1 basado en reglas. Lo mismo con
`"gastos de personal"` y `"otros gastos de administracion y ventas"` →
ambas a `opex` (línea 111). El Pass 2 de IA solo actúa sobre cuentas que
quedaron `"unclassified"` — como estas ya tienen alta confianza en el
Pass 1, el Pass 2 nunca las toca. Resultado: 2-3 filas separadas en
`account_homologations` con el mismo `canonical_account`, y `getAccountValue`
descarta silenciosamente todas menos la primera (orden no determinístico:
la query en `build-structured-input:104` no tiene `.order()`).

**Impacto**: sub/sobreestimación de cash/opex/EBITDA/EV en cualquier
balance con más de una cuenta de caja o más de un rubro de gasto
operativo — el caso típico colombiano, no la excepción.

**Caso de regresión propuesto**: balance con `Caja=5.000`, `Bancos=15.000`,
`CDT=3.000` (período "2024"). Esperado: `cash=23.000`. Actual: valor de
la primera fila devuelta por Postgres (no determinístico). Repetir con
`Gastos de Personal=9.041` + `Otros Gastos Admón=2.847` → esperado
`opex=11.888`.

**Severidad: Crítica.**

### 2. Moneda en PDF — CONFIRMADO, CRÍTICO, BLOQUEANTE

`fUSD` (`src/lib/pdf-generator.ts:85-86`) tiene el prefijo `"USD"`
hardcodeado, sin parámetro de moneda — es la única función de formato
monetario del archivo, no existe `formatMoneda` ni variante paramétrica.
Además: `pdf-generator.ts:433` → `["Moneda del análisis", "USD"]` literal
fijo; `:529,644` → headers de tabla `"Valor (USD)"` fijos.
`generatePDF(result, inputs, version)` no recibe ningún parámetro de
moneda; `FinancialInputs` tampoco tiene campo `moneda`.

`structured_inputs.input_payload` sí guarda correctamente
`moneda_analisis` y convierte los valores si el usuario eligió COP, pero
el PDF etiqueta esos mismos números (ya en COP) como "USD" sin ninguna
conversión visual.

**Caso de regresión**: análisis con `moneda_analisis="COP"` → generar
PDF → verificar que ninguna celda diga "USD" y que el resumen ejecutivo
diga "COP".

**Severidad: Crítica.**

### 3. Constantes duplicadas (TRM y tasas macro) — CONFIRMADO, ALTA

TRM=4080 aparece en 5 lugares sin importación cruzada:
`build-structured-input/index.ts:32` (comentario "single source of truth",
falso), `update-snapshots/index.ts:36`, `src/data/velarix-datos-2026.ts:69,82`,
`src/lib/financial-engine.ts:535,536`, y la migración SQL
`20260323003518_...sql` (seed de `external_snapshots`). Mismo patrón para
`risk_free_rate=4.35`, `erp=5.80`, `policy_rate=7.50`.

Hoy coinciden numéricamente, pero no hay ningún mecanismo que los
mantenga sincronizados — y `update-snapshots` (el job pensado para
refrescarlos) escribe en una tabla (`external_snapshots`) que
**`ejecutar-calculo` nunca lee** (ver hallazgo (A) más abajo), así que una
actualización futura de TRM solo tocaría 1 de los 5 lugares.

`velarix-datos-2026.ts` se autodescribe como *"FUENTE ÚNICA DE
DATOS"* (línea 4) — **CONTRADICCIÓN**: solo lo importan `DemoMacro.tsx` y
`MacroSection.tsx` (páginas de marketing/demo); ni `financial-engine.ts`
ni ninguna Edge Function lo importan.

**Severidad: Alta (riesgo de divergencia futura, no error numérico hoy).**

### 4. ROE/ROA — CONFIRMADO, problema real, distinto matiz al reportado

- `net_income` real del documento se lee y se descarta:
  `ejecutar-calculo/index.ts:89` declara `netIncome` pero nunca lo usa
  después (0 usos posteriores, confirmado por grep). ROE/ROA usan un
  `netIncome0` **recalculado sintéticamente**:
  `ejecutar-calculo/index.ts:175` = `(ebit0 - interestExpense) * (1 - taxRate/100)`
  con `taxRate=30` fijo. Igual en `financial-engine.ts:343,352-353`. Ignora
  utilidades extraordinarias, tasa efectiva real o pérdidas fiscales
  reportadas.
- `equity` sí está en escala correcta (llega convertido desde
  `build-structured-input`) — no hay bug de escala en ese punto.
- `totalAssets` para ROA **no usa** `bs.total_assets` real:
  `ejecutar-calculo/index.ts:174` → `totalDebt + equity`. Como
  `totalDebt` está roto (ver hallazgo (B)), `totalAssets` termina siendo
  prácticamente `equity` solo.
- **No existe ninguna validación** que limite ROE/ROA a rangos razonables
  (0 clamps, 0 reglas de sanidad en `validate-analysis`, `ejecutar-calculo`,
  `financial-engine.ts`).

**Caso de regresión**: `equity=1.000`, `ebit0=5.000`, `interestExpense=0` →
ROE recalculado = 350%, sin flag ni warning.

**Severidad: Alta.**

### 5. Timer del panel de progreso / paginación doble del PDF

Fuera del alcance de este frente (motor financiero); pertenecen a
`07-FRONTEND-RUTAS-Y-UX.md` y `09-RENDIMIENTO-Y-OBSERVABILIDAD.md`. No se
investigaron a fondo aquí.

## Hallazgos nuevos (encontrados durante esta auditoría, no reportados antes)

### (A) — `external_snapshots` nunca se lee correctamente — CONFIRMADO, BLOQUEANTE a futuro

`update-snapshots` siembra `external_snapshots.sector` con **slugs**
(`"software-tecnologia"`). `analysis.sector` se guarda siempre como
**label completo** (`"Software / Tecnología"`, confirmado en
`NewAnalysisStepper.tsx:32,46`, viene de `SECTOR_KEYS` de
`financial-engine.ts`). `build-structured-input/index.ts:192-196` hace
`eq("sector", analysis.sector)` → **nunca coincide**, `dbSnapshot` es
siempre `null`, siempre se usa el fallback hardcodeado. Hoy los valores
del fallback coinciden con los sembrados (ambos copiados del mismo
Damodaran 2026), así que no hay error numérico hoy — pero todo el sistema
de "snapshots actualizables" es letra muerta: un cambio futuro vía
`update-snapshots` nunca llegaría al motor de cálculo. Mismo bug en
`continuar-tras-revision/index.ts:104-110`.

### (B) — `ejecutar-calculo` lee campos que no existen — CONFIRMADO, CRÍTICO (latente)

`build-structured-input/index.ts:210` escribe el balance con la clave
`financial_debt_total`. `ejecutar-calculo/index.ts:91` lee:
```
const totalDebt = Math.abs(bs.total_debt || bs.financial_debt || 0);
```
Ninguna de esas dos claves existe jamás en el payload. Por lo tanto
`totalDebt` es **siempre 0** en `ejecutar-calculo`, para cualquier
empresa con deuda:
- `equityWeight = 1.0` siempre (WACC ignora el costo de deuda).
- `deRatio = 0` → el beta relevered (Hamada) nunca releva.
- `netDebt = totalDebt - cash = -cash` (negativo), invirtiendo el puente
  EV→Equity: suma caja como si no hubiera deuda, sobreestimando el Equity
  Value en empresas apalancadas.

Comparado con `Dashboard.tsx:97` (`Number(bs.financial_debt_total) || 0`),
que sí usa el nombre correcto — prueba de que las "dos fórmulas
duplicadas" no son idénticas en la práctica: una funciona, la otra está
rota por un error de nombre de campo. Como el output de `ejecutar-calculo`
no se lee en ningún lado hoy, el impacto actual al cliente es nulo — pero
es un defecto real y crítico, latente, que se activaría en el momento en
que alguien conecte `calculation_result` a cualquier vista o a la
narrativa.

**Caso de regresión**: `bs={cash:100, equity:500, financial_debt_total:300}`
→ esperado `netDebt=200`, actual `netDebt=-100`.

### (C) — Conversión de moneda nunca se aplica — CONFIRMADO, CRÍTICO, el de mayor impacto potencial

`moneda_documento` y `factor_escala` (calculados en `extraerExcel`, línea
234 de `parse-document`) **nunca se persisten** en `audit_events.metadata`
ni en `documents_parsed.parsing_metadata` (ambos solo propagan
`nota_conversion`). Por lo tanto en `build-structured-input/index.ts:165-166`:
```
const monedaDoc = parseMeta.moneda_documento || "COP";   // SIEMPRE "COP"
const factorEscala = parseMeta.factor_escala || 1;        // SIEMPRE 1
```
siempre caen al default. Si un documento real está en USD y el usuario
elige `moneda_analisis="COP"`, la rama de conversión (línea 174) **nunca
se activa** — los valores en USD se tratan como si ya fueran COP, sin
ninguna conversión, con un error de **~4.080x** en todas las cifras.

Nota relacionada: `detectarMoneda` (en `parse-document`) siempre devuelve
`factor: 1` en sus 4 ramas (solo etiqueta, nunca convierte); el guard
`yaConvertido = metadatos.factor_conversion_aplicado !== undefined` es
siempre `false` porque esa clave nunca se asigna en ningún lugar del
archivo.

**Caso de regresión**: Excel con encabezado "USD" y `revenue=1.000.000`
(USD), análisis con `moneda_analisis="COP"`. Esperado:
`revenue≈4.080.000.000` (COP). Actual: `revenue=1.000.000` (tratado como
si ya fuera COP).

**Severidad: Crítica.**

## Fórmulas duplicadas WACC/Beta/CAPM/DCF/TV

`financial-engine.ts::runAnalysis` y `ejecutar-calculo/index.ts::runEngine`
son casi idénticas línea a línea (mismo Hamada, CAPM, Gordon Growth,
`taxRate=30`/`capexPct=5`/`wcPct=3`/`costOfDebt=8`), pero copiadas a mano,
sin código compartido, y con el bug (B) que las hace diverger en la
práctica.

**Cuál corre en producción**: ambas, para propósitos desconectados.
`ejecutar-calculo` escribe en `analyses.calculation_result`, que **nadie
lee**. El PDF real (`Dashboard.tsx::handleDownloadPDF`) ignora esa columna
y **re-ejecuta `financial-engine.ts` en el navegador** desde cero. El
motor "oficial" servidor es, en cuanto a su output, código muerto.

## Sectores/benchmarks — consistencia numérica confirmada, 4 copias

`velarix-datos-2026.ts::SECTOR_BENCHMARKS_2026`,
`financial-engine.ts::SECTOR_BENCHMARKS`,
`build-structured-input/index.ts::SECTOR_SNAPSHOTS_2026`,
`ejecutar-calculo/index.ts::SECTOR_BENCHMARKS` — verificados sector por
sector, **los números coinciden exactamente** hoy. Son 4 tablas separadas
que deben sincronizarse manualmente; la clave usada difiere (slug vs.
label), lo cual ya causó el bug (A).

## Signos, escala y moneda — detalle adicional

`detectarConvencionSignos` (`parse-document:377-388`): heurística
razonable, sin problema de doble aplicación (solo anota, no transforma).
`factor_escala` calculado por header de Excel en `extraerExcel:157-164` se
guarda pero **nunca se aplica** a `filas` (el comentario "store in
metadata, do NOT convert" se respeta) — pero esa información se pierde
igual por el bug (C).

## Trazabilidad

`account_homologations` sí guarda `document_id` por fila. Pero
`structured_inputs`, `calculation_results`, `generated_reports`,
`report_narratives` solo tienen `analysis_id` — ningún
`document_id`/`mapping_id`/`source_row_ids`. Una vez que `getAccountValue`
agrega valores, se pierde el vínculo con la fila/documento de origen.
DEUDA relevante para un negocio que debe justificar sus números ante el
cliente (`Negocio_Velarix_v4.1.md` §10.3).

## Casos dorados / pruebas de regresión del motor

**Confirmado por ausencia**: único test del repo es
`src/test/example.test.ts` (`expect(true).toBe(true)`). Sin fixtures
financieras, sin `.test.ts` en `supabase/functions/`, sin ningún caso con
inputs conocidos y outputs esperados para el motor DCF/WACC.

**Severidad: Deuda crítica** — no hay red de seguridad para tocar el
motor sin repetir esta auditoría manualmente.

## Reproducibilidad

El motor de cálculo en sí es determinístico — `Math.random()` solo
aparece en `pdf-generator.ts:222` para un `reportId` de exhibición (no
afecta cifras, no se persiste). Todos los `Date.now()`/`new Date()` en los
archivos de motor son timestamps de auditoría/vigencia, no insumos de
fórmulas.

## Hallazgo transversal — "informe_generado" es engañoso

`run-analysis-pipeline` marca `analyses.status = "informe_generado"` al
terminar `ejecutar-calculo`, **sin haber ejecutado `generate-narrative`
nunca**. El estado se traduce en la UI como *"¡Informe listo para
descarga!"*, pero en ese punto no existen ni las secciones narrativas con
IA, ni la detección de riesgos, ni las recomendaciones, ni la auditoría de
6 criterios — solo el resultado numérico del DCF. Ver también
`11-CONTRADICCIONES-NEGOCIO-CODIGO.md`.

## Resumen de severidades

| # | Hallazgo | Clasificación | Severidad |
|---|---|---|---|
| 1 | `.find()` sin sumar subcuentas (3 archivos) | VERIFICADO | Crítica |
| 2 | PDF siempre "USD" | VERIFICADO | Crítica |
| C | Conversión de moneda nunca se aplica | VERIFICADO | Crítica |
| B | `ejecutar-calculo` lee campos inexistentes (`total_debt`/`financial_debt`) | VERIFICADO | Crítica (latente) |
| — | `generate-narrative` nunca se invoca; "informe_generado" engañoso | VERIFICADO | Alta (negocio) |
| A | `external_snapshots` slug vs label, snapshot nunca leído | VERIFICADO | Alta (bloqueante a futuro) |
| 4 | ROE/ROA sintéticos sin cap de sanidad | VERIFICADO | Alta |
| 3 | TRM/tasas macro duplicadas en 5 lugares | VERIFICADO | Alta (deuda) |
| — | Dos motores duplicados, solo uno "vive" en el output real | VERIFICADO | Alta (arquitectura) |
| — | Sin casos dorados / regresión del motor | VERIFICADO (ausencia) | Deuda crítica |
| — | Sin trazabilidad documento→cifra en structured_inputs/calculation_results | VERIFICADO | Media (deuda) |
