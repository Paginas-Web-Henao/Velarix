# Pruebas — BL-04 (Formato de moneda paramétrico en el PDF)

Bloque 1B-P0. Bug corregido: `fUSD` en `src/lib/pdf-generator.ts`
mostraba el literal `"USD"` de forma incondicional (44 usos), y 3
ubicaciones adicionales tenían la etiqueta `"USD"` hardcodeada en
encabezados de tabla/texto — sin importar la moneda real del análisis.

## Historia de esta prueba (continuidad con Bloque 1A)

- **Bloque 1A**: `src/lib/pdf-generator.currency.spec.test.ts` se creó
  con `test.fails()` porque el bug existía. Resultado registrado
  entonces: `1 expected fail`.
- **Bloque 1B-P0**: se corrigió el bug. La misma prueba se reescribió
  como prueba normal (sin `test.fails()`) y se amplió a 5 escenarios.

## Cambios de código

1. `src/lib/financial-engine.ts`: nuevo campo `reportingCurrency: "COP" | "USD"`
   en `FinancialInputs` (tipo `ReportingCurrency` exportado), con
   `DEFAULT_INPUTS.reportingCurrency = "COP"`.
2. `src/lib/pdf-generator.ts`:
   - Nueva función exportada `formatMoneda(valor, currency)` — paramétrica,
     reemplaza el `fUSD` module-level hardcodeado.
   - Dentro de `generatePDF()`, un closure local `const fUSD = (v) => formatMoneda(v, inputs.reportingCurrency);`
     reutiliza el mismo nombre (`fUSD`) para que los 44 call sites
     existentes seguían funcionando sin cambiarlos uno por uno — cambio
     mínimo y controlado.
   - 3 literales `"USD"` hardcodeados corregidos: la fila "Moneda del
     análisis", el encabezado "Valor (USD)" de dos tablas, y el título
     de la matriz de sensibilidad.
3. `src/pages/Dashboard.tsx`: `handleDownloadPDF` ahora lee
   `ip.moneda_analisis` (ya persistido por `build-structured-input`) y lo
   pasa como `inputs.reportingCurrency` — sin recalcularlo.

## Archivo de prueba

`src/lib/pdf-generator.currency.spec.test.ts`

## Comando y resultado

```
$ npx vitest run src/lib/pdf-generator.currency.spec.test.ts

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

## Escenarios

| # | Escenario | Resultado |
|---|---|---|
| 1 | PDF en COP no contiene la etiqueta "USD" en ningún texto capturado | Pasa |
| 2 | PDF en USD sí muestra la etiqueta "USD" | Pasa |
| 3 | Fila "Moneda del análisis" refleja COP | Pasa |
| 4 | Fila "Moneda del análisis" refleja USD | Pasa |
| 5 | Valores en COP muestran la etiqueta "COP" (cobertura de los 44 usos previos de `fUSD`) | Pasa |

## Antes / después (evidencia concreta)

```
ANTES (test.fails(), Bloque 1A):
containsHardcodedUSD = true  -> la aserción `expect(...).toBe(false)` fallaba (esperado)

DESPUÉS (prueba normal, Bloque 1B-P0):
containsHardcodedUSD (moneda COP) = false -> pasa
containsHardcodedUSD (moneda USD) = true  -> pasa (nueva prueba, confirma el caso USD real)
```

## Regresión

`npm test -- --run` completo: 59 pruebas pasan, 0 fallos, 0 "expected
fail" restantes (la única expected-fail de Bloque 1A ya no existe — se
convirtió en prueba normal, como exige el cierre de este bloque).
