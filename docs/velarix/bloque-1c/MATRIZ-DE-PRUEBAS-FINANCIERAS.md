# Matriz de pruebas financieras — Bloque 1C-Prep

Mapea los 16 escenarios mínimos exigidos contra las pruebas reales.
Todas importan `runAnalysis` (`src/lib/financial-engine.ts`) o
`CANONICAL_METHODOLOGY` (`supabase/functions/_shared/financial-methodology.ts`)
— las mismas funciones/objetos que usa producción, nunca una copia de
sus fórmulas. Las comparaciones de identidad (FCFF, descuento a valor
presente, EV, equity value) verifican consistencia **entre los propios
campos de salida** de la función real, no reimplementan la fórmula desde
los inputs — así la prueba detecta una regresión real sin duplicar la
lógica que se supone debe vigilar.

| # | Escenario | Archivo de prueba | Función real importada | Resultado |
|---|---|---|---|---|
| 1 | Identidad financiera básica | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 2 | Pesos de deuda y patrimonio | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 3 | WACC | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 4 | Flujo de caja libre | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 5 | Valor terminal | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (Caso A) |
| 6 | Descuento a valor presente | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (Caso A) |
| 7 | Enterprise value | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 8 | Equity value | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 9 | Deuda neta | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 10 | Sensibilidad a WACC | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (3 casos) |
| 11 | Sensibilidad a crecimiento perpetuo | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (Caso A) |
| 12 | Manejo de EBITDA negativo | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (Caso C) |
| 13 | Patrimonio negativo | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Pasa (Caso C) |
| 14 | Datos insuficientes (`revenue=0`) | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Ver nota — 1 `test.fails()` + 1 evidencia |
| 15 | Prevención de NaN e Infinity | `financial-engine.golden-cases.test.ts` | `runAnalysis` | Ver nota — mismo par de pruebas que #14 |
| 16 | Consistencia del contrato de supuestos | `financial-methodology.test.ts` | `CANONICAL_METHODOLOGY` | Pasa (8 pruebas) |

## Nota sobre los escenarios 14 y 15 (mismo hallazgo, dos ángulos)

`revenue = 0` **no** produce `NaN`/`Infinity` en `enterpriseValue`/`wacc`
(quedan en `0`, un resultado finito pero silenciosamente engañoso). Sí
produce `Infinity`/`NaN` en los márgenes históricos (`grossMargin`,
`ebitdaMargin`, `ebitMargin`, `netMargin`), que dividen directamente por
`inputs.revenue` sin ningún clamp. Dos pruebas registran esto:

1. `test.fails(...)` — especificación de que ningún margen debería ser
   no-finito ante `revenue=0`. Falla hoy (esperado), documentando el gap
   sin decidir silenciosamente cuál es el comportamiento correcto (ver
   decisión pendiente #10 en `DECISIONES-FINANCIERAS-PENDIENTES.md`).
2. Prueba normal — confirma que al menos un margen es no-finito hoy, y
   que `enterpriseValue` es exactamente `0` (evidencia del
   comportamiento actual, no un criterio de corrección).

## Comandos y resultados

```
$ npx vitest run src/lib/financial-engine.golden-cases.test.ts

 Test Files  1 passed (1)
      Tests  30 passed | 1 expected fail (31)

$ npx vitest run supabase/functions/_shared/financial-methodology.test.ts

 Test Files  1 passed (1)
      Tests  8 passed (8)
```

## Qué NO se probó (limitación explícita)

El motor **servidor** (`ejecutar-calculo/index.ts::runEngine`) sigue sin
ser importable en Vitest — mismo bloqueo ambiental documentado desde
Bloque 1A (Deno no instalado, imports de URL, `serve()` de nivel
superior). Las 31+8 pruebas de este bloque verifican el motor **cliente**
(`runAnalysis`) sobre los 3 casos dorados. La corrección de escenarios
aplicada a `ejecutar-calculo/index.ts` (capexPct/wcPct por escenario,
ver `REPORTE-RECONCILIACION-METODOLOGICA.md`) se verificó por lectura
cuidadosa del código y comparación algebraica contra el cliente ya
probado — no por ejecución directa del servidor. Esta limitación ya
estaba registrada desde Bloque 1A/1B-P0 y no se resolvió en este bloque
(no era su alcance).
