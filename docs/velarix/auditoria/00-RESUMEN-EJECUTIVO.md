# 00 — Resumen Ejecutivo de la Auditoría

Ver `README.md` para convención de estados y alcance de esta auditoría.
Fuente de negocio: `Negocio_Velarix_v4.1.md`.

## Qué existe realmente

Un producto técnicamente ambicioso y en buena parte funcional, pero con
**dos productos paralelos que no se hablan entre sí**: un flujo server-side
completo (parseo → homologación → validación → structured input → cálculo
DCF en Edge Function → narrativa con IA auditada por 6 criterios), y un
flujo client-side independiente (recalculo del DCF en el navegador +
generación del PDF) que es, en la práctica, **el único que el cliente final
ve**. Existen 12 Edge Functions, 16 tablas con RLS habilitado, 2 buckets de
Storage privados, un flujo de revisión manual funcionalmente completo, y una
migración reciente y correcta de IA (de un gateway de Lovable a Anthropic
directo). También existe deuda técnica real: cero cobertura de pruebas,
cuatro copias hardcodeadas de los mismos datos macro/sectoriales, y varios
bugs de cálculo financiero confirmados con evidencia exacta.

## Qué funciona

- Autenticación (Supabase Auth) y RLS por usuario en la mayoría de tablas — VERIFICADO.
- Carga de documentos con verificación de ownership, checksum y `audit_events` — VERIFICADO.
- Parsing de Excel/CSV/PDF con fallback a IA — VERIFICADO, funcional.
- Migración completa de Lovable a Anthropic (modelo `claude-opus-4-8`) — VERIFICADO, sin restos del gateway anterior en código real.
- Motor DCF cliente (`financial-engine.ts`) — determinístico, sin aleatoriedad en el cálculo — VERIFICADO.
- Flujo de revisión manual (crear → tomar → corregir → aprobar/bloquear → reanudar) — VERIFICADO, funcionalmente completo en su lógica.
- El botón de descarga de PDF de la demo realmente no existe en el DOM sin login (`return null`, no `disabled`) — VERIFICADO, cumple la regla de negocio citada.

## Qué no fue posible verificar

- Si `claude-opus-4-8` es aceptado en producción por la API de Anthropic en tiempo real (no se hizo ninguna llamada real a la API durante esta auditoría de solo lectura). Nota de consolidación: esta sesión ya había cargado la referencia oficial de modelos Anthropic antes de la migración y `claude-opus-4-8` (Claude Opus 4.8) es un identificador de modelo válido y vigente — se marca **RESUELTO** por esa referencia, no por verificación en vivo contra la API.
- Configuración real de `verify_jwt` y CORS a nivel de plataforma Supabase (`supabase/config.toml` no la declara; se infiere el comportamiento por defecto).
- Si las variables de entorno de producción (Vercel/Supabase) están efectivamente configuradas — el `.env` local tiene las claves sin valor.
- Comportamiento de aislamiento de instancias (isolates) de Deno bajo concurrencia real en producción.

## Cuáles son los bloqueantes (ver detalle en cada archivo y en `plan/MATRIZ-DE-RIESGOS.md`)

1. **Split-brain del motor de cálculo y narrativa nunca ejecutada** — el pipeline server-side con IA no llega al PDF que descarga el cliente, y `generate-narrative` no se invoca en el flujo real. Ver `04-CALIDAD-FINANCIERA.md`, `03-FLUJOS-END-TO-END.md`.
2. **Conversión de moneda nunca se aplica realmente** (`moneda_documento`/`factor_escala` nunca se persisten desde `parse-document`) + **PDF siempre etiqueta "USD"** sin importar la moneda elegida. Ver `04-CALIDAD-FINANCIERA.md`.
3. **Consolidación de subcuentas rota** (`.find()` en vez de sumar) en 3 archivos independientes. Ver `04-CALIDAD-FINANCIERA.md`.
4. **Sin verificación de ownership** en `ejecutar-calculo` y sin ninguna autenticación en `continuar-tras-revision` — fuga potencial de datos de valoración entre clientes. Ver `05-SEGURIDAD-DATOS-RLS.md`.
5. **Sin control de rol real** — cualquier usuario autenticado accede a `/admin/revisiones` y puede auto-aprobar su propia revisión, rompiendo el principio de negocio "la IA nunca aprueba sola" (`Negocio_Velarix_v4.1.md` §8.3). Ver `05-SEGURIDAD-DATOS-RLS.md`, `07-FRONTEND-RUTAS-Y-UX.md`.

## Mayor riesgo financiero

La combinación de los hallazgos 1, 2 y 3: un cliente podría recibir un PDF
con EBITDA/caja subestimados (subcuentas no sumadas), en la moneda
equivocada mostrada como "USD", calculado por un motor (`financial-engine.ts`
en el navegador) que nunca pasó por el pipeline de homologación validado ni
por revisión humana formal sobre el resultado numérico final — y sin ningún
caso de prueba que lo hubiera detectado antes de entregarlo.

## Mayor riesgo de seguridad

`ejecutar-calculo` (sin verificación de ownership) y `continuar-tras-revision`
(sin ninguna autenticación) son invocables por cualquiera con la clave
pública `anon` (visible en el bundle del frontend por diseño) para el
`analysis_id` de **cualquier otro cliente**, permitiendo leer cifras de
valoración ajenas y, en el caso de `continuar-tras-revision`, saltar el
control de revisión manual de otra empresa.

## Qué está construido prematuramente

- Bucket `reportes-pdf` + tabla `generated_reports` — creados, con
  políticas RLS, sin ningún `INSERT` real (el PDF nunca se persiste, solo
  se descarga en el navegador).
- `check-data-freshness` y `update-snapshots` — funciones desplegadas, sin
  cron ni invocador real; el sistema de "vigencia de datos" completo (2
  funciones + 2-3 tablas) está desconectado del motor de cálculo.
- `docs/velarix/plan/`, `docs/velarix/fases/` — estructura de gobierno
  creada en esta misma sesión, sin contenido previo (se llena ahora).
- Dependencias declaradas sin uso confirmado en el flujo principal
  (`react-hook-form` no se usa en el stepper real; ver `10-DEUDA-TECNICA-Y-CODIGO-OBSOLETO.md`).

## Qué debe hacerse primero

Antes de cualquier otra cosa, según evidencia y según `Negocio_Velarix_v4.1.md`
§17: (a) decidir explícitamente cuál motor de cálculo es el oficial
(servidor con IA, o cliente determinístico) y eliminar el split-brain; (b)
corregir la cadena de conversión de moneda y la consolidación de
subcuentas; (c) cerrar los dos huecos de autenticación; (d) decidir si el
flujo de revisión manual necesita un rol real antes de aceptar el primer
cliente pagado, dado que hoy no cumple su propósito de negocio.

## Decisión recomendada

**No listo para pilotos con datos financieros reales de terceros.** Es
razonable seguir validando con datos propios o ficticios mientras se
resuelve la Fase 1 (exactitud financiera) y la Fase 2 (seguridad) definidas
en `Negocio_Velarix_v4.1.md` §18 — ambas tienen bloqueantes confirmados con
evidencia en esta auditoría, no solo hipótesis.

## Los 10 hallazgos más importantes

| # | Hallazgo | Severidad | Evidencia (archivo:línea) | Impacto | Fase que lo resuelve |
|---|---|---|---|---|---|
| 1 | El PDF descargado recalcula todo con `financial-engine.ts` (cliente) e ignora `analyses.calculation_result` (servidor) y `report_narratives` (IA) | Crítica | `src/pages/Dashboard.tsx:64-133`, `src/lib/financial-engine.ts:2` | El "informe" vendido no refleja el pipeline con IA/homologación validada que el negocio describe | Fase 1 |
| 2 | `generate-narrative` nunca se invoca desde el flujo real (`run-analysis-pipeline` termina en `ejecutar-calculo`) | Crítica | `supabase/functions/run-analysis-pipeline/index.ts` (sin fetch a generate-narrative), estado final `informe_generado` en línea 252 | Sin narrativa de IA, sin detección de riesgos/recomendaciones, sin auditoría de 6 criterios en el entregable real | Fase 1 |
| 3 | Conversión de moneda nunca se aplica (`moneda_documento`/`factor_escala` siempre caen a defaults) | Crítica | `supabase/functions/build-structured-input/index.ts:165-166`; ausencia de persistencia en `parse-document/index.ts:632-658` | Error potencial de ~4080x en cifras si el documento no está en COP | Fase 1 |
| 4 | `getAccountValue`/`getVal`/`getValue` usan `.find()`, no suman subcuentas | Crítica | `build-structured-input/index.ts:34-40`, `validate-analysis/index.ts:23-26`, `continuar-tras-revision/index.ts:80-83` | EBITDA/caja/opex mal calculados en cualquier balance con más de una subcuenta por rubro | Fase 1 |
| 5 | PDF siempre muestra "USD" sin leer `moneda_analisis` | Crítica | `src/lib/pdf-generator.ts:85-86,433,529,644` | Entregable mal etiquetado en cualquier análisis en COP | Fase 1 |
| 6 | `ejecutar-calculo` no verifica ownership del `analysis_id` | Bloqueante (seguridad) | `supabase/functions/ejecutar-calculo/index.ts:244-263,311-320` | Fuga de valoración financiera entre clientes | Fase 2 |
| 7 | `continuar-tras-revision` sin ninguna autenticación | Bloqueante (seguridad) | `supabase/functions/continuar-tras-revision/index.ts:10-19` | Cualquiera puede forzar el avance de una revisión bloqueada de otro cliente | Fase 2 |
| 8 | Sin control de rol real; RLS de `manual_reviews` permite auto-aprobación | Bloqueante (negocio) | `src/App.tsx:43-44`, migración `20260320180111...sql:35-37` | Rompe el principio "la IA nunca aprueba sola" — no hay revisor independiente real | Fase 2 |
| 9 | `ejecutar-calculo` lee `bs.total_debt`/`bs.financial_debt` (campos que no existen); el campo real es `financial_debt_total` | Crítica (latente) | `ejecutar-calculo/index.ts:91` vs `build-structured-input/index.ts:210` | `totalDebt` siempre 0 en el motor servidor; se activaría si se conecta ese motor al entregable real | Fase 1 |
| 10 | Cero cobertura de pruebas real (1 test trivial); sin casos dorados del motor financiero | Deuda crítica | `src/test/example.test.ts` (único archivo de test), ausencia confirmada en `supabase/functions/` | No hay red de seguridad para tocar el motor de cálculo sin repetir esta auditoría manualmente | Fase 1 |

Detalle completo, con más hallazgos de menor severidad, en los archivos
`01` a `11` de esta carpeta.
