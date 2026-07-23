# Reporte de implementación — Bloque 1B-P0 (Testabilidad mínima y corrección de defectos confirmados)

Fecha: 2026-07-23. Alcance: exclusivamente BL-02, BL-03, BL-04, BL-05,
BL-06 y la infraestructura mínima de pruebas necesaria para demostrarlos.
**Este trabajo no cierra el Bloque 1B completo** — ver "Estado final" al
final de este documento. No se inició 1C, 1D ni 1E.

## 1. Protección inicial (antes de modificar)

```
$ git status --short
?? NEGOCIO_V4_VELARIX.md
?? Negocio_Velarix_v4.1.md
?? docs/
?? src/lib/financial-engine.characterization.test.ts
?? src/lib/pdf-generator.currency.spec.test.ts
?? src/types/
?? velarix-bloque-1a.zip
?? velarix-documentacion-auditoria.zip

$ git branch --show-current
main

$ git diff --stat
(vacío)
```

## 2. Baseline registrado antes de cualquier cambio

| Comando | Resultado |
|---|---|
| `npm test -- --run` | 3 archivos, 13 pruebas pasan + 1 "expected fail" (BL-04 de Bloque 1A) — 14 total |
| `npx tsc --build --noEmit` | Sin salida — compila limpio |
| `npm run build` | Compila exitosamente; misma advertencia preexistente de bundle >500kB (R-17) |
| `npm run lint` | 310 problemas (286 errores, 24 warnings) |

## 3. Estrategia de testabilidad aplicada

Deno no está instalado en este entorno, y las Edge Functions afectadas
mezclan lógica pura con imports de URL y `serve()` de nivel superior en
el mismo archivo (mismo bloqueo documentado en Bloque 1A). Se aplicó el
refactor mínimo y controlado exigido: se extrajo **únicamente** la
lógica pura necesaria a `supabase/functions/_shared/`, sin imports de
URL, sin Supabase, sin `serve()`, sin variables de entorno, sin efectos
secundarios — importable indistintamente desde Deno (import relativo con
extensión `.ts`, ya es la convención de este proyecto, ver
`_shared/anthropic-client.ts`) y desde Vitest.

Se amplió `vitest.config.ts` para escanear también
`supabase/functions/_shared/**/*.{test,spec}.ts` (única modificación de
infraestructura de pruebas, explícitamente autorizada).

### Módulos nuevos

| Módulo | Usado por | Reemplaza |
|---|---|---|
| `_shared/financial-accounts.ts` (`sumAccountValue`, `hasAccountValue`) | `build-structured-input`, `validate-analysis`, `continuar-tras-revision` | `getAccountValue`/`getVal`/`getValue` (`.find()`) |
| `_shared/currency.ts` (`computeTotalConversionFactor`, `applyConversion`, `normalizeCurrencyCode`) | `build-structured-input` | Lógica inline de conversión de moneda |
| `_shared/capital-structure.ts` (`computeCapitalStructure`, `resolveFinancialDebtTotal`) | `ejecutar-calculo` | Lectura directa de `bs.total_debt`/`bs.financial_debt` + cálculo inline de WACC/Hamada |
| `_shared/pipeline-guards.ts` (`evaluateMapAccountsResult`) | `run-analysis-pipeline` | Ausencia total de verificación tras `map-accounts` |

Cada módulo tiene su propio archivo `*.test.ts` junto a él — no se probó
ninguna copia de la fórmula, se importó exactamente la misma función que
usa producción (verificable comparando los imports en cada archivo de
prueba contra los imports en la Edge Function real).

## 4. Correcciones por defecto — ver el documento dedicado de cada uno

- `PRUEBAS-BL-02.md` — consolidación de subcuentas.
- `PRUEBAS-BL-03.md` — moneda y escala.
- `PRUEBAS-BL-04.md` — formato de moneda paramétrico en el PDF.
- `PRUEBAS-BL-05.md` — campo de deuda financiera.
- `PRUEBAS-BL-06.md` — abortar el pipeline ante falla de `map-accounts`.

## 5. Archivos modificados (producción)

| Archivo | Cambio |
|---|---|
| `supabase/functions/parse-document/index.ts` | BL-03: persistencia real de `moneda_documento`/`escala_documento`/`factor_escala`; ya no asume USD por defecto sin evidencia |
| `supabase/functions/build-structured-input/index.ts` | BL-02 (usa `sumAccountValue`) + BL-03 (usa `computeTotalConversionFactor`) |
| `supabase/functions/validate-analysis/index.ts` | BL-02 (`getVal`/`hasAccount` delegan al módulo compartido) |
| `supabase/functions/continuar-tras-revision/index.ts` | BL-02 (`getValue` delega al módulo compartido; además, `net_income` ya no confunde 0 con ausencia, mismo principio) |
| `supabase/functions/ejecutar-calculo/index.ts` | BL-05 (usa `resolveFinancialDebtTotal` + `computeCapitalStructure`) |
| `supabase/functions/run-analysis-pipeline/index.ts` | BL-06 (usa `evaluateMapAccountsResult`, aborta correctamente) |
| `src/lib/financial-engine.ts` | BL-04: nuevo campo `reportingCurrency` en `FinancialInputs`/`DEFAULT_INPUTS` |
| `src/lib/pdf-generator.ts` | BL-04: `formatMoneda` paramétrica, 3 literales "USD" corregidos |
| `src/pages/Dashboard.tsx` | BL-04: pasa la moneda real del `structured_input` al generador de PDF |
| `vitest.config.ts` | Infraestructura mínima: escanea también `supabase/functions/_shared/` |

## 6. Archivos nuevos

- `supabase/functions/_shared/financial-accounts.ts` + `.test.ts`
- `supabase/functions/_shared/currency.ts` + `.test.ts`
- `supabase/functions/_shared/capital-structure.ts` + `.test.ts`
- `supabase/functions/_shared/pipeline-guards.ts` + `.test.ts`
- `docs/velarix/bloque-1b/` (este directorio, 6 archivos)

`src/lib/pdf-generator.currency.spec.test.ts` (creado en Bloque 1A) se
**modificó** en este bloque: se convirtió de `test.fails()` a una suite
de 5 pruebas normales, todas pasando.

## 7. Validaciones finales

| Comando | Resultado | Comparación con baseline |
|---|---|---|
| `npm test -- --run` | 7 archivos, **59 pruebas pasan, 0 fallos** | +45 pruebas nuevas (BL-02: 11, BL-03: 12, BL-05: 12, BL-06: 6, BL-04: 4 adicionales); la única "expected fail" de Bloque 1A ya no existe (BL-04 corregido) |
| `npx tsc --build --noEmit` | Sin salida — compila limpio | Idéntico al baseline, sin errores nuevos |
| `npm run build` | Compila exitosamente, mismo tamaño de bundle | Idéntico al baseline |
| `npm run lint` | **303 problemas (279 errores, 24 warnings)** | **7 problemas MENOS que el baseline** (310→303) — los módulos compartidos reemplazan funciones `any`-tipadas por contratos tipados, reduciendo errores `no-explicit-any` preexistentes en `validate-analysis`, `ejecutar-calculo` y `build-structured-input`. Cero errores nuevos en los 8 archivos nuevos (`_shared/*.ts` + `*.test.ts`) ni en los 10 archivos modificados |

### Comandos específicos por BL (ver también cada `PRUEBAS-BL-XX.md`)

```
$ npx vitest run supabase/functions/_shared/financial-accounts.test.ts   # BL-02: 11 pasan
$ npx vitest run supabase/functions/_shared/currency.test.ts             # BL-03: 12 pasan
$ npx vitest run src/lib/pdf-generator.currency.spec.test.ts             # BL-04: 5 pasan
$ npx vitest run supabase/functions/_shared/capital-structure.test.ts    # BL-05: 12 pasan
$ npx vitest run supabase/functions/_shared/pipeline-guards.test.ts      # BL-06: 6 pasan
```

## 8. Errores preexistentes (no corresponden a este bloque)

- `velarix-code-latest/` (carpeta de respaldo duplicada, `D-02`) infla el
  conteo total de lint si no se filtra — ya documentado en Bloque 1A.
- Bundle >500kB sin code-splitting (`R-17`, Fase 7, no prioritario).
- El resto de los ~279 errores de lint (mayormente `no-explicit-any` en
  Edge Functions y componentes no tocados por este bloque) son
  preexistentes y no se resuelven aquí — no era el alcance autorizado.

## 9. Errores nuevos

Ninguno. `tsc` limpio, build exitoso, lint mejoró (menos errores que el
baseline), 0 regresiones en la suite de pruebas.

## 10. Decisiones metodológicas que permanecen abiertas (no resueltas en este bloque)

Registradas explícitamente en `docs/velarix/bloque-1a/BL-26-tabla-comparativa-motores.md`,
sección 9, y no tocadas aquí:

1. Estructura de capital derivada (servidor) vs. editable por el usuario (cliente).
2. 7 supuestos hardcodeados en el servidor (`taxRate`, `capexPct`, `wcPct`,
   `terminalGrowth`, `costOfDebt`, `riskFreeRate`, `erp`) que el cliente
   expone como ajustables — riesgo `R-19`, sigue abierto.
3. Clamp de piso en escenario optimista (presente solo en el cliente).
4. KPIs de ciclo de caja de demostración (no reales).
5. Impuestos/utilidad neta histórica leídos pero nunca usados por
   ningún motor.
6. `total_assets` sintético (`totalDebt + equity`) en vez del real.
7. Consolidación general de constantes macro/sectoriales (`BL-17`) — las
   3 copias manuales (servidor, cliente, `build-structured-input`) siguen
   existiendo, coincidentemente iguales hoy, sin una fuente única.
8. Prueba de integración end-to-end de BL-06 ("las etapas posteriores no
   son llamadas") — garantizada por construcción, no verificada por una
   prueba ejecutable (bloqueo de Deno, ver `PRUEBAS-BL-06.md`).

Ninguna de estas se convirtió en una decisión de código durante este
bloque.

## 11. `git status --short` al cierre

```
 M src/lib/financial-engine.ts
 M src/lib/pdf-generator.ts
 M src/pages/Dashboard.tsx
 M supabase/functions/build-structured-input/index.ts
 M supabase/functions/continuar-tras-revision/index.ts
 M supabase/functions/ejecutar-calculo/index.ts
 M supabase/functions/parse-document/index.ts
 M supabase/functions/run-analysis-pipeline/index.ts
 M supabase/functions/validate-analysis/index.ts
 M vitest.config.ts
?? docs/velarix/bloque-1b/
?? supabase/functions/_shared/capital-structure.test.ts
?? supabase/functions/_shared/capital-structure.ts
?? supabase/functions/_shared/currency.test.ts
?? supabase/functions/_shared/currency.ts
?? supabase/functions/_shared/financial-accounts.test.ts
?? supabase/functions/_shared/financial-accounts.ts
?? supabase/functions/_shared/pipeline-guards.test.ts
?? supabase/functions/_shared/pipeline-guards.ts
?? velarix-bloque-1b-p0.zip
```

(Más los archivos ya untracked de sesiones anteriores: `NEGOCIO_V4_VELARIX.md`,
`Negocio_Velarix_v4.1.md`, `velarix-bloque-1a.zip`,
`velarix-documentacion-auditoria.zip`, `src/lib/financial-engine.characterization.test.ts`,
`src/types/` — no tocados en este bloque.)

No se hizo `commit` ni `push`. No se usó `git reset`/`restore`/`checkout --`/`clean`.
No se ejecutaron migraciones, seeds, deploys ni llamadas a Supabase remoto.
No se usó Docker. No se instalaron dependencias ni herramientas globales.

## 12. Estado final

> **1B-P0 completado; 1B-metodología pendiente.**

Completado en este bloque: BL-02, BL-03, BL-04, BL-05, BL-06, y la
infraestructura mínima de pruebas (módulos `_shared/` + ampliación de
`vitest.config.ts`).

**No completado, explícitamente fuera de alcance de 1B-P0** (queda para
"1B-metodología" o bloques posteriores, sin autorización para iniciarse
todavía): `BL-17` (consolidación general de constantes), `R-19`
(reconciliación de los 7 supuestos ajustables), cambios metodológicos de
WACC/CAPM/estructura de capital/escenarios, correcciones de ROE/ROA que
requieran decisión financiera, conexión de narrativa, conexión del PDF al
resultado servidor, trazabilidad final, estados de aprobación,
autenticación, roles, RLS, automatización macro, pagos, dashboards,
refactors generales. Ninguno de estos se tocó. Bloques 1C, 1D y 1E no
fueron iniciados.
