# 06 — Calidad de Código y Pruebas

## Validaciones ejecutadas en esta sesión (comando + resultado resumido)

| Comando | Resultado |
|---|---|
| `git status --short` | 2 archivos sin trackear (`NEGOCIO_V4_VELARIX.md`, `Negocio_Velarix_v4.1.md`), sin cambios pendientes en código |
| `npx tsc --build tsconfig.json --noEmit` | **0 errores**. Nota: el proyecto usa `noImplicitAny:false`, `strictNullChecks:false` — esto es permisivo, no garantiza type-safety real |
| `npm run lint` (ESLint) | 310 problemas totales (286 errores + 24 warnings) sobre TODO el árbol escaneado; **142 errores + 12 warnings pertenecen a código real** (el resto, 144 errores, son de `velarix-code-latest/`, backup que `eslint.config.js` no excluye — solo ignora `dist`) |
| `npm test` (`vitest run`) | 1 archivo de test, 1 test, pasa. Sin cobertura real |
| `npx vite build` | Compila correctamente. Bundle principal `dist/assets/index-*.js` = 1.76 MB sin comprimir (511 KB gzip), sin code-splitting; Vite advierte chunks >500KB |

## Desglose de los 142 errores de lint en código real

| Regla | Cantidad aprox. | Dónde concentra |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | ~120 | Extendido en todas las Edge Functions y en `pdf-generator.ts`, `AdminReview*.tsx`, `Dashboard.tsx` |
| `prefer-const` | 15 | `src/lib/pdf-generator.ts` (variables `y`/`yEnd` declaradas con `let`, nunca reasignadas) |
| `no-empty` | 2 | `supabase/functions/parse-document/index.ts:250,468` (bloques `catch {}` vacíos) |
| `no-useless-escape` | 3 | `parse-document`, `map-accounts` (regex con escapes innecesarios) |
| `no-unused-expressions` | 1 | `parse-document/index.ts:383` |
| `no-require-imports` | 1 | `tailwind.config.ts:100` |

## Duplicación

### 1a. Lógica financiera — VERIFICADO, duplicación activa (no histórica)

Ver detalle completo en `04-CALIDAD-FINANCIERA.md`. Resumen: 4 copias
hardcodeadas de las mismas constantes macro/sectoriales
(`financial-engine.ts`, `ejecutar-calculo/index.ts`,
`build-structured-input/index.ts`, `update-snapshots/index.ts`), sin
fuente única real pese a que `velarix-datos-2026.ts` se autodeclara como
tal.

### 1b. `runAnalysis()` cliente vs. servidor

`Dashboard.tsx::handleDownloadPDF` no lee el resultado ya calculado por
`ejecutar-calculo`; reconstruye inputs y **vuelve a correr todo el DCF en
el navegador** con `runAnalysis()`, usando sus propios `SECTOR_BENCHMARKS`/
`riskFreeRate` que pueden no coincidir con los del servidor. El número que
ve el usuario en el dashboard y el del PDF descargado pueden diferir sin
que nada lo detecte.

### 1c. `corsHeaders` duplicado 12 veces

El único archivo en `supabase/functions/_shared/` es
`anthropic-client.ts`. Las 12 funciones redefinen literalmente el mismo
bloque `corsHeaders`. DEUDA de baja severidad, trivial de resolver (mover
a `_shared/cors.ts`), pero riesgo real si cambia la política CORS y se
olvida un archivo.

### 1d. Patrón de autenticación duplicado en 9 de 13 funciones

El bloque `authHeader → anonClient.auth.getUser(...) → if (!user) throw`
se repite casi idéntico en 9 funciones, sin helper compartido. DEUDA —
candidato claro a `_shared/auth.ts`. Nota de seguridad relacionada: si
existiera este helper compartido, el bug de `ejecutar-calculo`/
`continuar-tras-revision` (ver `05-SEGURIDAD-DATOS-RLS.md`) probablemente
no habría ocurrido — ambos archivos son excepción justamente porque no
reutilizan el patrón que sí siguen los otros 9.

## Archivos extensos y responsabilidades mezcladas

Top 5 `src/`: `pdf-generator.ts` (1155), `types.ts` autogenerado (930, no
cuenta como deuda), `financial-engine.ts` (726), `sidebar.tsx` (637,
boilerplate shadcn), `manual-review-api.ts` (341).
Top 5 `supabase/functions/`: `parse-document/index.ts` (683),
`generate-narrative/index.ts` (524), `map-accounts/index.ts` (362),
`ejecutar-calculo/index.ts` (348), `run-analysis-pipeline/index.ts` (293).

- **`parse-document/index.ts` (683 líneas)** — mezcla detección de formato
  binario, normalización numérica, parsing de CSV/XLSX/PDF, heurísticas de
  clasificación de cuentas **y** llamadas a IA como fallback, todo en un
  único handler.
- **`pdf-generator.ts` (1155 líneas)** — único módulo con ~20 funciones de
  dibujo, mezclando formato de números, layout de PDF (coordenadas x/y
  hardcodeadas) y lógica de decisión de contenido (`shouldIncludePage`).
  Cero separación entre "qué mostrar" y "cómo dibujarlo".
- **`generate-narrative/index.ts` (524 líneas)** — combina generación de
  narrativa por secciones, prompts del auditor de consistencia y parsing
  de respuestas IA con `catch` silencioso (línea 371).

## Manejo de errores

26 bloques `catch` en `supabase/functions/`. Los más relevantes:

- `parse-document:539` — fallback funcional a IA, aceptable.
- `map-accounts:338` — si el JSON de IA no parsea, el mapeo se queda con
  el Pass 1 sin avisar; sin `audit_events` de ese fallo específico.
- `generate-narrative:371` — misma naturaleza.
- **`run-analysis-pipeline/index.ts:128-131` — RIESGO, el más grave de
  todo este frente**: si `map-accounts` lanza una excepción, el catch solo
  registra el paso como fallido en `steps` y llama `updateJob(..., "error")`,
  pero **no hace `return`, no aborta, no libera el lock** — el pipeline
  sigue a validación y cálculo con homologación de cuentas vacía o
  parcial. Es el único de los 5 pasos que no aborta ante excepción (parse
  sí aborta en líneas 102-107; build-structured-input y ejecutar-calculo
  abortan correctamente en 214-221 y 242-248). Puede producir análisis
  "completados" con datos mal mapeados, sin que el usuario se entere.
- **Código muerto relacionado**: `map-accounts/index.ts:354` retorna
  siempre `has_blocking_issues: false` (hardcodeado); el chequeo en
  `run-analysis-pipeline/index.ts:124` sobre ese campo nunca se activa.

Los 2 `catch {}` vacíos detectados por lint (`parse-document:250,468`) son
de severidad baja en contexto: uno es un fallback de decodificación de
encoding (red de seguridad previa existente), el otro devuelve `null` de
forma consistente y el llamador ya maneja ese caso. El riesgo real está en
`run-analysis-pipeline`, no en estos dos.

## Condiciones de carrera e idempotencia

**Pipeline completo — mitigado**: `job_locks` con expiración de 3 min,
`409 CONFLICT` si ya hay lock vigente. Doble clic sobre "Analizar" a nivel
de pipeline está cubierto.

**`map-accounts` en aislamiento — RIESGO real de race condition**: no
tiene lock propio. Su flujo (`DELETE` previo → construir mappings en
memoria → `INSERT` masivo → llamada a IA de varios segundos → `UPDATE`/
`INSERT` del Pass 2) es invocable directamente vía `fetch` con el token
del usuario, sin el lock de pipeline. Dos invocaciones concurrentes para
el mismo `analysis_id` (doble clic manual, dos pestañas) pueden duplicar
filas en `account_homologations` — no hay `unique constraint` ni `upsert`
con `onConflict` en esos inserts (a diferencia de `analysis_jobs.upsert(...,
{onConflict:"analysis_id,job_type"})`, que sí es idempotente).

**Estado en memoria a nivel de módulo**: revisadas todas las `const`/`let`
a nivel de módulo en las 13 funciones — todas constantes inmutables. Sin
variables mutables a nivel de módulo que pudieran filtrarse entre
invocaciones concurrentes de usuarios distintos. NO VERIFICABLE el
comportamiento exacto de reciclaje de isolates de Deno en producción sin
acceso al entorno de despliegue real.

## Código muerto / obsoleto

- **`financial-engine.ts` — NO es código muerto**: se usa en producción
  real desde `Dashboard.tsx:6,124` (regenera el PDF final) y en
  `demo/*`. Contradice cualquier hipótesis de que quedó huérfano — de
  hecho coexisten dos motores de cálculo activos, lo cual es peor que
  código muerto (ver `04-CALIDAD-FINANCIERA.md`).
- **`check-data-freshness/index.ts` — OBSOLETO**: desplegada, sin ningún
  invocador en `src/` ni en otras Edge Functions.
- **`src/tailwind.config.lov.json` — OBSOLETO**: sin ninguna referencia en
  el proyecto; resto de Lovable.
- **`src/components/NavLink.tsx` — sospechoso de no usarse (INFERIDO)**:
  sin ningún import fuera de su propia definición. Verificar antes de
  eliminar.
- **`api-client.ts::parseDocument/mapAccounts/validateAnalysis/buildStructuredInput/generateNarrative/storeCalculationResults`**
  — wrappers definidos, sin ningún caller (ver `01-INVENTARIO-REPOSITORIO.md`).

## Rendimiento (documentado aquí, detalle completo en `09-RENDIMIENTO-Y-OBSERVABILIDAD.md`)

Bundle de 1.76MB explicado por ausencia de `React.lazy` en las 7 rutas —
arrastra `jsPDF`, `framer-motion` (en 11 componentes de landing, siempre
en la ruta de entrada) y `recharts` (5+ componentes) sin lazy-loading.

`useAnalysisProgress.ts:44-56` hace 2 queries secuenciales
(`analyses` luego `analysis_jobs`) que podrían paralelizarse con
`Promise.all` — se ejecuta cada 2.5s mientras el análisis está activo.

## Deuda técnica y documentación

- Sin documentación desactualizada que aún describa arquitectura Lovable
  como vigente — la mención en `anthropic-client.ts:2-4` es correcta
  ("reemplaza al antiguo gateway"), no deuda.
- **Clasificación del volumen de `any` (142 errores lint, mayoría
  `no-explicit-any`)**: mayormente DIFERIBLE (deuda de tipado en payloads
  de Supabase/respuestas de IA, sin efecto en runtime dado
  `noImplicitAny:false`). **Excepción no diferible**: en
  `run-analysis-pipeline/index.ts` y `map-accounts/index.ts`, el uso de
  `any` en respuestas de `fetch(...).json()` (`mapResult: any`,
  `buildResult: any`) es precisamente lo que permite que bugs como
  `has_blocking_issues` siempre `false` y "continuar tras excepción de
  map-accounts" pasen inadvertidos en compilación. Recomendado: priorizar
  tipar los contratos de respuesta entre Edge Functions
  (`{success, data, error}`) antes que el resto de los `any` sueltos.

## Cobertura de pruebas — confirmado por ausencia

Ningún flujo de negocio (demo, auth, upload, parsing, cálculo, narrativa,
PDF, revisión manual, notificaciones) tiene cobertura de pruebas real.
`@playwright/test` está instalado y configurado (`playwright.config.ts`),
pero no existe la carpeta `tests/` que la configuración espera.

## Resumen

| Hallazgo | Severidad |
|---|---|
| `run-analysis-pipeline` no aborta ante excepción de `map-accounts` | Riesgo alto |
| Race condition en `map-accounts` sin lock propio | Riesgo medio-alto |
| Cero cobertura de pruebas real | Deuda crítica |
| 142 errores de lint reales, mayoría `any` diferible | Deuda media |
| `corsHeaders`/patrón de auth duplicados sin `_shared/` | Deuda baja-media |
| Bundle 1.76MB sin code-splitting | Deuda de rendimiento |
