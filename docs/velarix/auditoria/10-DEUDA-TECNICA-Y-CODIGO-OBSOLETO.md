# 10 — Deuda Técnica y Código Obsoleto

Clasificación por urgencia, no por tamaño. No se recomienda ninguna
reorganización masiva sin evidencia — `Negocio_Velarix_v4.1.md` §13.5
exige que un refactor justifique problema concreto, riesgo actual,
beneficio, alcance, pruebas y plan de reversión antes de ejecutarse.

## Deuda bloqueante (impide vender con confianza, no es solo estilo)

| Ítem | Evidencia | Por qué es bloqueante |
|---|---|---|
| Cero cobertura de pruebas del motor financiero | `src/test/example.test.ts` único archivo, trivial | No hay red de seguridad para tocar cálculos sin repetir esta auditoría a mano — ver `04-CALIDAD-FINANCIERA.md` |
| Split-brain de motores de cálculo (servidor vs. cliente) | `04-CALIDAD-FINANCIERA.md` | El entregable real no refleja el pipeline validado con IA |
| `run-analysis-pipeline` no aborta ante falla de `map-accounts` | `run-analysis-pipeline/index.ts:128-131` | Puede producir análisis "completados" con datos mal mapeados sin aviso |

## Deuda próxima (no bloquea hoy, pero se vuelve riesgo con el primer cliente real)

| Ítem | Evidencia | Por qué |
|---|---|---|
| `corsHeaders` duplicado 12 veces, sin `_shared/cors.ts` | 12 archivos `index.ts` | Un cambio de política CORS exige tocar 12 archivos; fácil olvidar uno |
| Patrón de autenticación duplicado en 9 de 13 funciones, sin `_shared/auth.ts` | ver `06-CALIDAD-CODIGO-Y-PRUEBAS.md` | Las 2 funciones que rompen el patrón (`ejecutar-calculo`, `continuar-tras-revision`) son justo las que tienen el bug de seguridad — un helper compartido lo habría evitado |
| Race condition en `map-accounts` sin lock propio | `06-CALIDAD-CODIGO-Y-PRUEBAS.md` | Duplicación de filas ante doble invocación concurrente |
| Contratos de respuesta entre Edge Functions sin tipar (`any` en `mapResult`, `buildResult`) | `run-analysis-pipeline/index.ts`, `map-accounts/index.ts` | Permite que bugs de contrato (`has_blocking_issues` siempre `false`) pasen inadvertidos en compilación |
| Bundle 1.76MB sin code-splitting | `09-RENDIMIENTO-Y-OBSERVABILIDAD.md` | Afecta tiempo de carga inicial, no la exactitud del producto |

## Deuda diferible (bajo riesgo, tipado/estilo)

| Ítem | Evidencia | Por qué es diferible |
|---|---|---|
| ~120 errores `@typescript-eslint/no-explicit-any` en payloads de Supabase/IA | `npm run lint`, ver `06-CALIDAD-CODIGO-Y-PRUEBAS.md` | Con `noImplicitAny:false` no cambia el comportamiento en runtime; es deuda de tipado, no de comportamiento |
| 15 `prefer-const` en `pdf-generator.ts` | mismo lint run | Cosmético |
| 2 `catch {}` vacíos de bajo riesgo (`parse-document:250,468`) | ver `06-CALIDAD-CODIGO-Y-PRUEBAS.md` | Ya tienen manejo aceptable en contexto |
| 3 `no-useless-escape`, 1 `no-unused-expressions`, 1 `no-require-imports` | mismo lint run | Cosmético, sin impacto funcional confirmado |

## Código prematuro

| Ítem | Evidencia |
|---|---|
| Bucket `reportes-pdf` + tabla `generated_reports` | Sin ningún `INSERT` real (`05-SEGURIDAD-DATOS-RLS.md`, `01-INVENTARIO-REPOSITORIO.md`) |
| `check-data-freshness` + `update-snapshots` + `snapshot_updates` | Sin cron, sin invocador real (`08-INFRAESTRUCTURA-E-INTEGRACIONES.md`) |
| Tipo de notificación `reporte_listo` | Implementado, sin ningún caller |
| `docs/velarix/plan/`, `docs/velarix/fases/` (antes de esta sesión) | Estructura creada sin contenido, ahora se completa como parte de esta auditoría |

## Código aparentemente obsoleto (no se elimina en esta auditoría)

| Ítem | Evidencia | Certeza |
|---|---|---|
| `src/tailwind.config.lov.json` | Sin ninguna referencia en el proyecto, resto de Lovable | VERIFICADO |
| `api-client.ts::parseDocument/mapAccounts/validateAnalysis/buildStructuredInput/generateNarrative/storeCalculationResults` | Wrappers sin ningún caller | VERIFICADO |
| `check-data-freshness/index.ts` | Sin invocador (ver arriba) | VERIFICADO |
| `src/components/NavLink.tsx` | Sin import fuera de su propia definición | INFERIDO — verificar antes de eliminar |
| `react-hook-form` + `@hookform/resolvers` (dependencia) | `NewAnalysisStepper.tsx` usa `useState` plano, no confirmado su uso en el stepper real | INFERIDO — verificar en todo el árbol antes de retirar la dependencia |

**Importante**: "OBSOLETO" en esta auditoría no es una recomendación de
borrado automático — es un hallazgo a decidir por el fundador, con
verificación adicional donde se marcó INFERIDO.

## Duplicaciones (resumen, detalle en `04` y `06`)

- 4 copias hardcodeadas del dataset sectorial Damodaran 2026.
- 5 copias de constantes macro (TRM, Rf, ERP).
- 2 motores de cálculo DCF/WACC independientes.
- `corsHeaders` y patrón de autenticación duplicados en las Edge Functions.

## Documentación desactualizada

No se encontró documentación que aún describa arquitectura Lovable como
vigente — la migración quedó bien documentada
(`_shared/anthropic-client.ts:2-4`, `Negocio.md` con el checklist de
Fase 0 marcado). El hallazgo relevante de documentación es distinto:
`velarix-datos-2026.ts` se autodescribe como "fuente única" y no lo es
(ver `04-CALIDAD-FINANCIERA.md`) — es una afirmación falsa en un
comentario de código, no documentación vieja de un sistema anterior.

## Refactors tentadores pero no prioritarios (no recomendados todavía)

- Extraer `_shared/cors.ts` y `_shared/auth.ts` — bajo riesgo, alto
  beneficio de mantenibilidad, pero **no es lo primero**: la prioridad es
  corregir cálculos, trazabilidad, seguridad y pruebas
  (`Negocio_Velarix_v4.1.md` §13.5).
- Dividir `pdf-generator.ts` (1155 líneas) en módulos por sección —
  razonable a mediano plazo, pero solo después de decidir cuál motor de
  cálculo alimenta el PDF (ver Fase 1).
- Migrar todos los `any` a tipos estrictos — diferible en bloque, salvo
  los contratos de respuesta entre Edge Functions (ver tabla de arriba).
