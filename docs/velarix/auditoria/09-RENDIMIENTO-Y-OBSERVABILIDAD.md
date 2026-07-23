# 09 — Rendimiento y Observabilidad

No se hizo ninguna optimización durante esta auditoría — solo se
documenta con evidencia. Plan de medición al final.

## Bundle sin code-splitting — VERIFICADO

`npx vite build` (ejecutado en esta sesión): `dist/assets/index-*.js` =
1.76 MB sin comprimir (511 KB gzip). Vite advierte sobre chunks >500KB.

**Causa raíz**: `src/App.tsx` no usa `React.lazy`/`Suspense` en ninguna de
las 7 rutas — todas se importan de forma estática y van al bundle
inicial. Esto arrastra:
- `jsPDF` + `jspdf-autotable` (`pdf-generator.ts`), importado
  transitivamente por `Dashboard.tsx:7` (ruta protegida, pero cargada en
  el bundle principal igual).
- `framer-motion`, importado a nivel de módulo en 11 componentes de
  `landing/*` y en `demo/DemoDashboard.tsx`, `DemoReport.tsx`. La landing
  (`Index`) es la ruta de entrada, así que se descarga siempre, incluso
  para usuarios que nunca ven el dashboard.
- `recharts`, importado en 5+ componentes (`demo/DemoCharts.tsx`,
  `DemoBenchmarkView.tsx`, `DemoMacro.tsx`, `landing/BenchmarkSection.tsx`,
  `landing/MacroSection.tsx`, `components/ui/chart.tsx`).

## Llamadas seriales no paralelizadas — VERIFICADO

`src/hooks/useAnalysisProgress.ts:44-56` (`consultarEstado`) hace
`await supabase.from("analyses").select(...)` y luego, secuencialmente,
`await supabase.from("analysis_jobs").select(...)` — ambas son
independientes y podrían envolverse en `Promise.all`. Se ejecuta cada
2.5s mientras el análisis está activo, así que la latencia serial se paga
en cada tick.

## Polling

`useAnalysisProgress.ts:102`: `setInterval(consultarEstado, 2500)` — cada
2.5s, 2 queries a Supabase mientras el análisis está activo. No es
agresivo comparado con polls de 1s. Riesgo relacionado: si el pipeline
queda en un estado intermedio no contemplado (ver bug de
`run-analysis-pipeline` que no aborta ante falla de `map-accounts`, en
`06-CALIDAD-CODIGO-Y-PRUEBAS.md`), el polling seguiría indefinidamente
mientras el componente esté montado. `ProgressPanel.tsx:41` tiene otro
`setInterval` (visual/cosmético, no vinculado a red, menor riesgo).

## PDF / base64 / payloads grandes

No se detectó manejo de imágenes en base64 de gran tamaño en el flujo
principal. El PDF se genera con `jsPDF` en memoria del navegador; no se
midió el tiempo de generación real (NO VERIFICABLE sin ejecutar la app).

## Edge Function timeouts

`build-structured-input` tiene el único timeout explícito encontrado (55s
vía `AbortController`, ver `08-INFRAESTRUCTURA-E-INTEGRACIONES.md`). El
resto de funciones no declara timeout propio — dependen del límite por
defecto de la plataforma Supabase (NO VERIFICABLE su valor exacto desde el
repo).

## Falta de índices

NO VERIFICABLE desde el repo sin acceso a `EXPLAIN ANALYZE` contra la base
real. Las migraciones sí crean índices explícitos en las tablas
principales (`analyses`, `documents`, `account_homologations`, etc. — ver
`20260320164123...sql`); no se auditó si cubren los patrones de consulta
reales usados por el frontend (ej. filtros combinados por `analysis_id` +
`canonical_account` + `period` en `getAccountValue`).

## Logs, métricas, trazas

VERIFICADO — no existe ninguna integración de observabilidad
(Sentry/Datadog/OpenTelemetry) en `package.json` ni en las Edge Functions.
El único mecanismo de diagnóstico son `console.log`/`console.error`
dispersos (ver riesgo de PII en logs en `05-SEGURIDAD-DATOS-RLS.md`) y la
tabla `audit_events` (cobertura parcial, sin eventos de descarga).

## Errores silenciosos relevantes para observabilidad

- `map-accounts/index.ts:338` y `generate-narrative/index.ts:371` —
  fallos de parseo de respuesta de IA solo van a `console.error`, sin
  `audit_events`.
- `run-analysis-pipeline/index.ts:128-131` — fallo de `map-accounts` no
  detiene el pipeline (ver `06-CALIDAD-CODIGO-Y-PRUEBAS.md`), lo que
  también significa que ese fallo es difícil de detectar después del
  hecho sin revisar logs manualmente.

## Plan de medición antes de optimizar (no ejecutado en esta auditoría)

1. Medir tiempo real de carga inicial (LCP/TTI) de `/` y `/dashboard` con
   herramientas de navegador, antes de decidir si el code-splitting es
   prioritario.
2. Medir tiempo real de ejecución de `run-analysis-pipeline` end-to-end
   con un documento de prueba, para decidir si 55s de timeout en
   `build-structured-input` es adecuado.
3. Confirmar límites de timeout reales de Supabase Edge Functions en el
   proyecto (consola de Supabase, no en este repo).
4. Solo después de estas mediciones, decidir si vale la pena invertir en
   `React.lazy`, `Promise.all` en el polling, o índices adicionales — no
   antes, para no optimizar sin evidencia de que sea el cuello de botella
   real (`Negocio_Velarix_v4.1.md` §13.1: "la arquitectura se construye
   para soportar el servicio, no para simular escala antes de tener
   demanda").
