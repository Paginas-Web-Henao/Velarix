# 08 — Infraestructura e Integraciones

## Supabase

VERIFICADO — `supabase/config.toml` completo:
```
project_id = "inujmyxdqbdnzbxxeoyh"
```
Única línea del archivo. Sin bloques `[functions.*]`, sin declaración de
`verify_jwt`, sin cron/scheduled functions. DEUDA/RIESGO: toda la
configuración de invocación (JWT, CORS, límites) queda implícita en
defaults de Supabase, no versionada en el repo.

### Variables de entorno por función — VERIFICADO

| Función | Variables | Fallback |
|---|---|---|
| `_shared/anthropic-client.ts` | `ANTHROPIC_API_KEY` | ninguno; si falta, retorna `null` |
| `parse-document` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`\|\|`SUPABASE_PUBLISHABLE_KEY`\|\|serviceRoleKey, `ANTHROPIC_API_KEY` (lanza error si falta) | |
| `map-accounts`, `validate-analysis`, `build-structured-input` | mismo patrón triple fallback | |
| `generate-narrative` | igual + `ANTHROPIC_API_KEY` (lanza error si falta) | |
| `ejecutar-calculo` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | sin fallback |
| `run-analysis-pipeline` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`\|\|`SUPABASE_PUBLISHABLE_KEY`\|\|`""` | |
| `enviar-notificacion` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL` (fallback `"https://app.velarix.co"`), `RESEND_API_KEY` (si falta, solo loguea, no falla) | |
| `upload-document` | `SUPABASE_URL`\|\|`VITE_SUPABASE_URL`\|\|hardcoded `https://inujmyxdqbdnzbxxeoyh.supabase.co`; `SUPABASE_SERVICE_ROLE_KEY` sin `!` (puede ser undefined) | |
| `update-snapshots`, `check-data-freshness`, `continuar-tras-revision` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | sin fallback |

**RIESGO** — `upload-document/index.ts:19`: único punto donde un secreto
de infraestructura (project ref) queda quemado en código como fallback en
vez de depender 100% de variables de entorno.

`.env` local (solo nombres, sin valores mostrados): `VITE_SUPABASE_PROJECT_ID`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`. Ningún secreto de
servidor vive en este archivo — consistente con que se configuran como
*secrets* de Edge Functions en Supabase.

## Migración a Anthropic — VERIFICADO, completa

`_shared/anthropic-client.ts`: `@anthropic-ai/sdk@0.113.0` vía esm.sh,
modelo `claude-opus-4-8`, `max_tokens` parametrizable (default 2000). Si
falta `ANTHROPIC_API_KEY` retorna `null` sin lanzar; si Anthropic responde
429 retorna `"__RATE_LIMITED__"`; cualquier otro error se loguea y retorna
`null`.

`parse-document`, `map-accounts`, `generate-narrative` importan
`callAnthropic` correctamente. Búsqueda exhaustiva de "lovable"/"ai.gateway"/
"gemini" en todo el repo (excluyendo backup) — único resultado es el
comentario histórico correcto en `anthropic-client.ts:3`. **Migración
confirmada completa**, sin restos del gateway anterior en código real.

**Nota de consolidación (no del subagente, de esta sesión)**: `claude-opus-4-8`
es un identificador de modelo Anthropic real y vigente (Claude Opus 4.8) —
esta sesión ya tenía cargada la referencia oficial de modelos al momento
de hacer la migración. Se marca **RESUELTO**, no como riesgo, aunque no
se hizo ninguna llamada real a la API durante esta auditoría de solo
lectura para confirmarlo en vivo.

## Resend / notificaciones

`enviar-notificacion/index.ts` soporta 4 `tipo`: `analisis_completado`,
`reporte_listo`, `error_analisis`, `analisis_bloqueado`. Cualquier otro
valor devuelve 400.

**Invocaciones reales** (grep sobre `supabase/functions/`):
- `generate-narrative/index.ts:485-489` → `analisis_completado`, solo si
  `auditPassed` — **pero `generate-narrative` nunca se ejecuta en el
  flujo real** (ver `03-FLUJOS-END-TO-END.md`, `04-CALIDAD-FINANCIERA.md`).
- `run-analysis-pipeline/index.ts:153-157` → `analisis_bloqueado`.
- `run-analysis-pipeline/index.ts:281-285` → `error_analisis`.

**DEUDA/OBSOLETO** — `reporte_listo`: implementado (template completo),
sin ninguna invocación en todo el repo. Código muerto.

**RIESGO — gap de cobertura**: cuando `generate-narrative` termina pero
la auditoría de IA falla (`auditPassed=false` → status
`revision_manual_requerida`), no se dispara ninguna notificación.

**En la práctica hoy**: la única notificación que efectivamente se envía
es `analisis_bloqueado` y `error_analisis` — "análisis completado
exitoso" nunca se dispara en producción real.

## Datos macro/sectoriales

`src/data/velarix-datos-2026.ts:4` se autodeclara *"FUENTE ÚNICA DE
DATOS"* — **CONTRADICCIÓN, VERIFICADO falso**: 4 copias independientes
hardcodeadas del mismo dataset Damodaran (ver `04-CALIDAD-FINANCIERA.md`).
Solo `DemoMacro.tsx` y `MacroSection.tsx` (marketing/demo) importan este
archivo; ni `financial-engine.ts` ni ninguna Edge Function lo hacen.

`update-snapshots/index.ts`: inserta en `external_snapshots` (solo si no
existen para esa `source_version`) y registra en `update_jobs_log`. **Sin
automatización real**: búsqueda de `pg_cron`/`cron.schedule`/`scheduled`
sobre `supabase/` sin resultados; `config.toml` no declara triggers;
**ninguna otra función ni archivo de `src/` invoca `update-snapshots`**
(solo se referencia a sí misma). Confirmado: solo invocable manualmente
vía HTTP.

`check-data-freshness/index.ts`: calcula semáforo por umbrales de días
leyendo `data_sources` y `snapshot_updates`. **DEUDA**: `snapshot_updates`
nunca recibe INSERT en ninguna función (`update-snapshots` escribe en
`external_snapshots`, tabla distinta y no relacionada por `source_id`) —
siempre cae al fallback genérico. Igual que `update-snapshots`, **no es
invocada por nadie** — subsistema de "vigencia" completo (2 funciones + 2
tablas) construido pero inerte.

No existe `src/utils/vigencia.js` ni equivalente — la única lógica de
vigencia real vive en `check-data-freshness/index.ts`, desconectada.

## Generación de PDF — hallazgo crítico

`jspdf@^4.2.1` + `jspdf-autotable@^5.0.7`. Se genera **100% en el
navegador**, nunca en una Edge Function.

**RIESGO crítico — VERIFICADO**: `Dashboard.tsx:64-133` (`handleDownloadPDF`)
lee `structured_inputs.input_payload` (no el resultado calculado),
recalcula desde cero con `runAnalysis()` de `financial-engine.ts`, y llama
`generatePDF()` sin recibir ni referenciar ningún narrative/texto de IA.
El PDF descargado **ignora por completo** `analyses.calculation_result`
(resultado server-side) y `report_narratives` (narrativa auditada por IA)
— el pipeline server-side completo no llega al documento que el cliente
descarga. Ver detalle completo en `04-CALIDAD-FINANCIERA.md` y
`02-ARQUITECTURA-ACTUAL.md`.

## Storage y subida de documentos

VERIFICADO — `upload-document/index.ts` es el único camino (sin subida
directa desde `src/`). Flujo: valida `Authorization`, ownership, tamaño
(≤10MB), MIME (PDF/XLSX/XLS/CSV), calcula SHA-256, sube a
`financial-documents` en ruta `{user_id}/{analysis_id}/{doc_type}_{timestamp}_{filename}`,
inserta `documents`, actualiza `analyses.status`, registra `audit_events`.

## `analysis_jobs`, polling y reintentos

`src/hooks/useAnalysisProgress.ts:102`: `setInterval(consultarEstado, 2500)`
— polling de `analyses.status` + `analysis_jobs` cada 2.5s, se detiene en
`informe_generado`, `calculo_completo`, `error_tecnico` o
`validacion_bloqueada`. Polling puro de lectura, sin reintento.

**RIESGO — sin reintento automático**: si `run-analysis-pipeline` falla a
mitad de camino, el frontend solo refleja el estado vía polling; no hay
cron, retry con backoff, ni cola que reintente. El usuario debe
re-disparar manualmente. El único control anti-duplicación es el lock en
`job_locks` (expira a los 3 min).

## `run-analysis-pipeline` — manejo de errores e idempotencia

**Manejo de fallos** (verificado paso por paso):
- Falla `parse-document` → libera lock, retorna 400. Correcto.
- Falla `map-accounts` → **solo loguea, no libera lock ni detiene el
  pipeline** (ver también `06-CALIDAD-CODIGO-Y-PRUEBAS.md`). Riesgo alto.
- `validate-analysis` bloqueante → libera lock, notifica, retorna 400. Correcto.
- `build-structured-input` con timeout de 55s (`AbortController`) → si
  aborta, marca `error_tecnico`, libera lock, **retorna HTTP 200 con
  `success:false`** — inconsistente con los 400/500 de otros pasos.
- `ejecutar-calculo` falla → marca `error_tecnico`, libera lock, retorna
  200 con error.
- Catch global → notifica `error_analisis` (best-effort, `.catch` sin
  re-lanzar) pero **no libera el lock** en ese branch — si el error ocurre
  antes de cualquier `releaseLock` explícito, el lock de 3 min queda
  activo hasta expirar, bloqueando reintentos inmediatos del mismo
  `analysis_id`.

**Idempotencia en re-ejecución**:
- `map-accounts`: `DELETE` previo a `INSERT` → idempotente en ejecución
  secuencial (no ante concurrencia, ver `06-CALIDAD-CODIGO-Y-PRUEBAS.md`).
- `analysis_jobs`: `upsert(..., {onConflict:"analysis_id,job_type"})` →
  idempotente.
- `report_narratives`: `upsert(..., {onConflict:"analysis_id"})` →
  idempotente.
- **`documents_parsed`**: `insert()` simple sin delete previo. Mitigado
  parcialmente porque `run-analysis-pipeline` filtra documentos ya
  `"completado"`. Si `processing_status` queda en estado intermedio tras
  un fallo parcial, una re-ejecución podría reinsertar filas sin limpiar
  las previas.

## Hallazgo transversal más grave — desconexión de esquema en lectura/escritura del resultado

`ejecutar-calculo/index.ts:288-291` escribe en la **columna**
`analyses.calculation_result` (JSONB, migración más reciente).
`enviar-notificacion/index.ts:154-160` lee de la **tabla**
`calculation_results` (plural, tabla independiente de la migración más
antigua), columna `output_payload`. Nada en el repo escribe jamás en esa
tabla — es tabla huérfana desde que se migró a la columna. Consecuencia:
el correo `analisis_completado` (si algún día se disparara) siempre
mostraría "Enterprise Value: No disponible", "WACC: N/D", "Margen EBITDA:
N/D" — refactor de esquema incompleto, agravado porque el PDF tampoco usa
ese dato (ver arriba). El resultado real del motor DCF server-side no se
consume en ningún punto de la UI ni de las notificaciones.

## Resumen

| Hallazgo | Severidad |
|---|---|
| PDF ignora el pipeline server-side completo | Crítica (repetido, ver 02/04) |
| `enviar-notificacion` lee tabla huérfana (`calculation_results` vs columna `analyses.calculation_result`) | Alta |
| Sin automatización real de datos macro (`update-snapshots`/`check-data-freshness` huérfanas) | Alta (deuda) |
| `map-accounts` falla sin detener el pipeline | Alta (repetido, ver 06) |
| `reporte_listo` código muerto; gap de notificación cuando falla la auditoría de narrativa | Media |
| Config de Supabase (`config.toml`) mínima, sin `verify_jwt`/CORS versionados | Media (deuda) |
