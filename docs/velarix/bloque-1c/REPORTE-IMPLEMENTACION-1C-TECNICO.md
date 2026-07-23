# Reporte de implementación — Bloque 1C-T (trazabilidad, versionado, preparación de revisión)

Fecha: 2026-07-23. Alcance exacto: implementar trazabilidad técnica
desde el documento hasta el resultado, versionar el cálculo y sus
supuestos, crear un fingerprint determinístico del input, preservar los
resultados actuales del motor canónico, y preparar un paquete compacto
para revisión financiera externa. No se inició Bloque 1E ni Fase 2, y no
se modificó nada de Bloque 1D.

## 1. Qué se construyó

### 1.1 Contrato de procedencia — `_shared/calculation-provenance.ts`

Módulo puro y tipado. Responde, para 8 cifras financieras priorizadas
(`revenue`, `cost_of_sales`, `opex`, `depreciation`, `interest_expense`,
`financial_debt_total`, `cash`, `equity`), de qué fila(s) de
`account_homologations` (y de qué `document_id`) salió cada una.
Reutiliza exclusivamente IDs que ya existen (`account_homologations.id`,
`.document_id`, `.canonical_account`) — no crea ninguna tabla nueva.

Cada cifra tiene un `source_status`: `"complete"` (todas sus subcuentas
tienen fila homologada), `"partial"` (solo algunas — aplica a
`financial_debt_total`, que es la suma de deuda corriente + deuda de
largo plazo) o `"missing"` (ninguna). El objeto completo también expone
un `overall_status` agregado.

**Limitación real, documentada explícitamente, no oculta**:
`source_row_ids` es siempre `null` con `source_row_ids_status: "missing"`
— no existe en el esquema actual un identificador de fila cruda anterior
a `account_homologations` (`map-accounts/index.ts` no persiste el
`posicion` de `documents_parsed.parsed_structure` al homologar). Esto
**no se inventó ni se rellenó** con un arreglo vacío disfrazado de
trazabilidad completa.

### 1.2 Versionado — `_shared/calculation-versioning.ts`

Expone `CANONICAL_ENGINE_VERSION = "1.0.0"` (versión explícita, asignada
a mano, del motor `_shared/canonical-financial-engine.ts` — debe
incrementarse manualmente si sus fórmulas cambian) y
`CALCULATION_SCHEMA_VERSION = "1.0.0"` (versión del "sobre" que agrega
versionado + procedencia al resultado). `methodology_version` y
`assumptions_snapshot` se derivan siempre de `CANONICAL_METHODOLOGY`
(`_shared/financial-methodology.ts`) — no hay ninguna copia manual de
esos 8 valores en este módulo.

### 1.3 Fingerprint determinístico — `_shared/calculation-fingerprint.ts`

`canonicalStringify` serializa cualquier valor JSON ordenando las claves
de cada objeto recursivamente (el orden de propiedades del input de
origen no afecta el resultado). `fnv1a64Hex` aplica FNV-1a de 64 bits
sobre esa serialización — un hash determinístico, no criptográfico, sin
dependencias externas, síncrono en Deno y en Vitest por igual (se evitó
`crypto.subtle.digest` porque es asíncrono en ambos runtimes y no aporta
nada aquí: este fingerprint no tiene fines de seguridad). Ver comentarios
del archivo para el detalle del porqué de esta elección.

`computeInputFingerprint` se calcula únicamente sobre lo que
`runCanonicalFinancialEngine` efectivamente usa (`income_statement`,
`balance_sheet`, `moneda_analisis`, `factor_conversion`, `sector`,
`expected_growth`) — nunca sobre `analysis_id`, timestamps, tokens de
sesión ni ningún otro dato ajeno al cálculo.

## 2. Propagación real implementada

`build-structured-input/index.ts` ahora construye `provenance` a partir
de las mismas filas de `account_homologations` que ya consultaba
(ninguna consulta nueva a Supabase) y la incluye como
`structuredInput.provenance` — ese objeto es el mismo que
`run-analysis-pipeline` copia a `analyses.input_payload`, así que la
procedencia viaja con el input hasta `ejecutar-calculo` sin ningún paso
adicional.

`ejecutar-calculo/index.ts` importa `computeInputFingerprint`,
`buildCalculationVersionInfo` y `buildMissingProvenance` (o usa la
`provenance` ya presente en el input), y persiste
`{ ...result, version, provenance }` en `analyses.calculation_result` —
`result` (lo que produce `runCanonicalFinancialEngine`) **no se modifica
en ningún campo**; `version`/`provenance` se agregan como campos
adicionales del mismo objeto.

No se conectó todavía la trazabilidad al PDF — eso es explícitamente
tarea de Bloque 1E, no de este bloque.

## 3. Compatibilidad

`canonical-financial-engine.ts` (fórmulas del motor) **no se modificó ni
una línea** en este bloque. `projections`, `scenarios`, `kpis`,
`valuation`, `sensitivityMatrix`, `sectorBenchmark`, `moneda` y
`factor_conversion` siguen siendo exactamente los mismos objetos que
produce `runCanonicalFinancialEngine` — verificado con una prueba de
compatibilidad que compara por referencia/igualdad (no solo por tipo).
Las regresiones numéricas exactas de los Casos A/B/C
(`canonical-financial-engine.golden-cases.test.ts`) no cambiaron: mismo
archivo, mismas 19 pruebas, mismos valores esperados.

## 4. Pruebas nuevas

| Archivo | Cubre |
|---|---|
| `calculation-fingerprint.test.ts` | Serialización canónica estable, mismo input → mismo fingerprint, cambio de revenue/deuda/sector/growth → fingerprint distinto, ningún dato ajeno afecta el hash |
| `calculation-versioning.test.ts` | `methodology_version`/`assumptions_snapshot` derivados de `CANONICAL_METHODOLOGY`, `canonical_engine_version` presente y no es timestamp/aleatorio, sin secretos |
| `calculation-provenance.test.ts` | Trazabilidad completa/parcial/missing (incluido el caso compuesto `financial_debt_total`), referencias de revenue/deuda/caja/equity preservadas, `source_row_ids` siempre `null`+`"missing"` explícito, sin secretos |
| `calculation-envelope.integration.test.ts` | Compatibilidad del envelope sobre los 3 fixtures dorados del servidor, `revenue=0` sigue rechazado, verificación estática de que `ejecutar-calculo/index.ts` importa y usa realmente los 3 módulos nuevos |

32 pruebas nuevas, todas verdes. Total de la suite: 172 pasan + 1 falla
esperada (`revenue=0` del motor cliente, sin cambios).

## 5. Estado al terminar este bloque

- **1C técnico implementado**: trazabilidad (parcial, con limitación
  documentada), versionado y fingerprint existen y están conectados al
  flujo real (`build-structured-input` → `ejecutar-calculo`).
- **Aprobación financiera externa: pendiente.** Nada de este bloque
  aprueba ninguna de las 10 decisiones metodológicas — siguen exactamente
  las mismas 10, sin resolver.
- **`BL-15` (trazabilidad completa): parcial, no completo.** Existe
  trazabilidad real desde `account_homologations`/`documents` hasta el
  `structured_input` y hasta `calculation_result` para las 8 cifras
  priorizadas — pero `source_row_ids` (nivel de fila cruda del
  documento) sigue sin poder rastrearse, documentado como limitación, no
  como bug oculto.
- **Conexión de la trazabilidad al PDF: pendiente de Bloque 1E**, sin
  excepción.
- **Bloque 1C formal: todavía no cerrado.** Falta la aprobación real de
  un revisor financiero externo sobre los casos A/B/C y sobre las 10
  decisiones pendientes — el `PAQUETE-REVISION-FINANCIERA.md` de este
  bloque prepara esa revisión, no la sustituye.

## 6. Qué no se tocó

Fórmulas financieras, resultados esperados de A/B/C, escenarios
pesimista/optimista, los 8 supuestos financieros, las 10 decisiones
pendientes, RLS/autorización, narrativa, conexión del PDF al servidor,
frontend, diseño visual. Ninguna migración SQL nueva fue necesaria — toda
la trazabilidad y el versionado se implementaron reutilizando columnas
`JSONB` ya existentes (`structured_inputs.input_payload`,
`analyses.calculation_result`).
