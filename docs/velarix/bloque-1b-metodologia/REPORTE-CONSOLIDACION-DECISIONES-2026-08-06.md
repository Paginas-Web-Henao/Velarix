# Reporte de consolidación — Decisiones financieras del fundador (2026-08-06)

## Estado inicial

- Repositorio: `/Users/nicohenao/Documents/Velarix/velarix-code`, rama `main`.
- HEAD al iniciar: `9a1826b fix: close auth error handling gaps before JWT rotation`.
- `git status --short`: limpio, sin cambios previos.
- `git status -sb`: `## main...origin/main [ahead 3]` — 3 commits locales sin push (`217a677`, `bb0563a`, `9a1826b`), ninguno tocado ni afectado por esta sesión.

## Análisis

El fundador (Nicolás) respondió las 10 decisiones metodológicas
pendientes de `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md`.
Se determinó `Negocio_Velarix_v4.1.md` como la fuente de verdad de
negocio vigente (versión declarada más alta, confirmado por
`docs/velarix/README.md`, por `plan/REGISTRO-DE-DECISIONES.md` D-01, y
por `diff` directo contra `NEGOCIO_V4_VELARIX.md`, que confirma que v4.1
es un refinamiento estrictamente aditivo de v4, sin contradicciones —
`Negocio.md` v3 describe un modelo de negocio distinto y queda superado).
Ninguno de los tres archivos de negocio se modificó en esta sesión.

Las 10 decisiones se clasificaron en 4 categorías, exactamente como
exigió la instrucción: 2 autorizadas para implementar ahora (Decisión 9
y 10A), 8 (más una función futura) para documentar sin cambiar fórmulas,
un subconjunto de 5 que además requiere envío formal a un revisor
financiero externo, y 8 elementos futuros diferidos explícitamente. Ver
la matriz completa en la sección 7 de esta respuesta.

Se inspeccionó el código real antes de tocar nada: `grep` confirmó que
los 7 supuestos canónicos (`taxRate`, `capexPct`, `wcPct`,
`terminalGrowth`, `costOfDebt`, `riskFreeRate`, `erp`) solo son editables
en un único componente, `src/components/demo/DemoInputsForm.tsx`
(`SECCIÓN "Supuestos operativos"`/`"Supuestos de mercado"`) — el flujo
real de análisis profesional (`src/components/dashboard/NewAnalysisStepper.tsx`)
no los expone en absoluto. `DemoInputsForm.tsx` alimenta al motor
cliente (`runAnalysis`, `financial-engine.ts`) desde el componente
`DemoDashboard`, invocado tanto desde la landing pública (`Index.tsx`)
como desde un botón "Demo" dentro del dashboard autenticado
(`Dashboard.tsx`) — en ningún caso toca el pipeline del servidor ni
documentos reales de un cliente.

## Archivos leídos

`Negocio_Velarix_v4.1.md`, `NEGOCIO_V4_VELARIX.md`, `Negocio.md`,
`docs/velarix/README.md`,
`docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md`,
`docs/velarix/bloque-1b-metodologia/REPORTE-RECONCILIACION-METODOLOGICA.md`,
`docs/velarix/bloque-1b/REPORTE-IMPLEMENTACION-1B-P0.md`,
`docs/velarix/bloque-1c/CASOS-DORADOS-PROVISIONALES.md`,
`docs/velarix/bloque-1c/MATRIZ-DE-PRUEBAS-FINANCIERAS.md`,
`docs/velarix/bloque-1c/PAQUETE-REVISION-FINANCIERA.md`,
`docs/velarix/bloque-1c/REPORTE-IMPLEMENTACION-1C-TECNICO.md`,
`docs/velarix/plan/REGISTRO-DE-DECISIONES.md`,
`docs/velarix/plan/BACKLOG-CLASIFICADO.md`,
`docs/velarix/plan/MATRIZ-DE-DEPENDENCIAS.md`,
`docs/velarix/plan/MATRIZ-DE-RIESGOS.md`,
`docs/velarix/fases/FASE-01-EXACTITUD-FINANCIERA.md`,
`supabase/functions/_shared/financial-methodology.ts`,
`src/lib/financial-engine.ts`, `src/components/demo/DemoInputsForm.tsx`,
`src/components/demo/DemoDashboard.tsx`,
`src/components/demo/DemoCharts.tsx`,
`src/components/demo/DemoSensitivity.tsx`,
`src/components/demo/DemoReport.tsx`,
`src/components/dashboard/NewAnalysisStepper.tsx`, `src/pages/Dashboard.tsx`,
`src/pages/Index.tsx`.

## Archivos creados

- `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`
- `docs/velarix/bloque-1b-metodologia/PLAN-VALIDACION-REVISOR-FINANCIERO.md`
- `docs/velarix/bloque-1b-metodologia/ROADMAP-METODOLOGIA-DINAMICA.md`
- `docs/velarix/bloque-1b-metodologia/PROMPT-CLAUDE-CONSOLIDACION-DECISIONES-2026-08-06.md`
- `docs/velarix/bloque-1b-metodologia/REPORTE-CONSOLIDACION-DECISIONES-2026-08-06.md` (este archivo)
- `src/components/demo/DemoInputsForm.test.tsx`

## Archivos actualizados

- `src/components/demo/DemoInputsForm.tsx` (Decisión 9 + Decisión 10A)
- `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md` (nota de estado, análisis original conservado)
- `docs/velarix/bloque-1c/PAQUETE-REVISION-FINANCIERA.md` (nota de estado, sección 6 sin tocar)
- `docs/velarix/plan/REGISTRO-DE-DECISIONES.md` (nueva entrada D-08)
- `docs/velarix/plan/BACKLOG-CLASIFICADO.md` (nota de estado, sin cerrar ningún `BL-XX`)
- `docs/velarix/plan/MATRIZ-DE-DEPENDENCIAS.md` (nota de estado en la fila de Bloque 1B-metodología)
- `docs/velarix/plan/MATRIZ-DE-RIESGOS.md` (fila `R-19`, severidad degradada de Alta a Media)
- `docs/velarix/fases/FASE-01-EXACTITUD-FINANCIERA.md` (nota de estado en el bloque de Bloque 1B)

No se modificó ningún documento de seguridad (`docs/velarix/bloque-1d/*`,
`docs/velarix/seguridad-credenciales/*`), ningún documento de negocio
(`Negocio_Velarix_v4.1.md`, `NEGOCIO_V4_VELARIX.md`, `Negocio.md`), y
ningún archivo fuera del alcance descrito.

## Decisiones documentadas

Ver `DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md` para el detalle
completo de las 10, y la sección "Matriz de las 10 decisiones" de la
respuesta final para el resumen ejecutivo.

## Cambios implementados

Ver secciones "Cambios implementados para la Decisión 9" y "... para la
Decisión 10A" de la respuesta final.

## Pruebas

Ver sección "Pruebas ejecutadas y resultados exactos" de la respuesta
final para el detalle completo, comandos y resultados exactos.

## Resultados

- 13/13 pruebas dirigidas nuevas pasando (`DemoInputsForm.test.tsx`).
- `npx tsc --build --noEmit`: código 0.
- `npm run build`: código 0.
- `npm run lint`: código 1 (302 problemas, idéntico al baseline previo a
  esta sesión) — 1 advertencia preexistente sin cambios en
  `DemoInputsForm.tsx` (dependencia faltante de `useEffect`, código no
  tocado por esta sesión); 0 problemas en el archivo de prueba nuevo.
- Suite completa (`npm test -- --run`): 18 archivos, 264 passed + 1
  expected fail (265 total) — +13 pruebas nuevas respecto al baseline de
  252, 0 regresiones.

## Limitaciones

- No se implementó ninguna corrección de las 5 decisiones que requieren
  revisor financiero externo — ninguna fórmula de WACC, beta, estructura
  de capital, g terminal, patrimonio negativo, escenarios, impuestos o
  normalización fue tocada, exactamente como exigía el alcance.
- No se implementó la Decisión 10B (defensa `revenue = 0` dentro del
  motor cliente `runAnalysis`) — diferida explícitamente, requiere
  revisar todos sus llamadores primero (`Dashboard.tsx`,
  `DemoDashboard.tsx`).
- No se implementó la función de revisión fiscal asistida — diferida,
  requiere revisor financiero/tributario y revisión legal previa.
- El formulario de la Decisión 9 sigue exponiendo `equityWeight`/
  `debtWeight` como editable — pertenece a la Decisión 2 (estructura de
  capital), no autorizada para tocar en esta sesión.

## Asuntos enviados a revisor

Las 5 decisiones (1, 2, 3, 5, 6, 8 con matices — ver desglose exacto en
`PLAN-VALIDACION-REVISOR-FINANCIERO.md`) y los casos dorados definitivos.
El paquete completo para esa revisión ya existía
(`PAQUETE-REVISION-FINANCIERA.md`) y ahora tiene un proceso explícito de
validación (`PLAN-VALIDACION-REVISOR-FINANCIERO.md`).

## Asuntos diferidos

APIs financieras automáticas, overrides de consultoría, horizonte
variable del DCF, g terminal dinámica, escenarios dinámicos, función
fiscal asistida por IA, defensa `revenue = 0` dentro del motor cliente,
interfaz especial para analistas — todos registrados con su condición de
entrada en `ROADMAP-METODOLOGIA-DINAMICA.md`.

## Estado final de Git

Ver sección "Estado final de Git" de la respuesta final (post-commit).

## Commit

Ver sección "Commit creado y hash" de la respuesta final.
