# Pruebas — BL-03 (Moneda y escala)

Bloque 1B-P0. Bug corregido: la moneda y el factor de escala reales del
documento fuente se detectaban en `parse-document`, pero se descartaban
antes de persistirse (solo sobrevivía una nota de texto), y en la ruta
no-Excel el campo `moneda` ni siquiera se copiaba a `metadatos` en
ninguna rama (el `if (factorMoneda !== 1)` que lo guardaba nunca era
cierto, porque `detectarMoneda` siempre devolvía `factor: 1`). Además,
tanto la ruta Excel como la no-Excel asumían silenciosamente una moneda
por defecto (USD) cuando no había evidencia clara.

## Refactor mínimo de testabilidad

Módulo puro `supabase/functions/_shared/currency.ts`
(`computeTotalConversionFactor`, `applyConversion`, `normalizeCurrencyCode`).
Nombres canónicos internos: `sourceCurrency`, `reportingCurrency`,
`scaleFactor`, `exchangeRate`, `totalConversionFactor`. Los nombres ya
usados en la base de datos (`moneda_documento`, `moneda_analisis`,
`factor_escala`, `factor_conversion`) se conservan en las Edge Functions
— la adaptación entre ambos vocabularios ocurre explícitamente en
`build-structured-input/index.ts`.

## Cambios de código

1. `supabase/functions/parse-document/index.ts`:
   - `extraerExcel()`: ya no asume `"USD"` quandonada — si no hay marcador
     explícito en el encabezado, `moneda_documento` queda en `null` y se
     agrega `moneda_documento_detectada: false`.
   - `detectarMoneda()` (ruta no-Excel): mismo cambio — último `return`
     ahora es `{ moneda: null, ... }` en vez de `{ moneda: "USD", ... }`.
   - El bloque que llamaba a `detectarMoneda`/`detectarEscala` tenía una
     rama muerta (`if (factorMoneda !== 1)` nunca era cierta) que
     descartaba `moneda` siempre; ahora se persiste incondicionalmente.
   - **El fix central**: el insert a `documents_parsed.parsing_metadata`
     y el insert a `audit_events` (`event_type: "parse_complete"`) ahora
     incluyen `moneda_documento`, `moneda_documento_detectada`,
     `escala_documento`, `factor_escala` — antes solo sobrevivía
     `nota_conversion` (texto para humanos, no el valor numérico).
2. `supabase/functions/build-structured-input/index.ts`: la sección de
   conversión de moneda ahora usa `computeTotalConversionFactor`. Si
   `monedaDoc` es `null` (no detectado), se agrega el flag
   `moneda_documento_no_detectada` y **no se inventa una conversión**
   (el factor de moneda queda en 1, solo se aplica la escala).

## Archivo de prueba

`supabase/functions/_shared/currency.test.ts`

## Comando y resultado

```
$ npx vitest run supabase/functions/_shared/currency.test.ts

 Test Files  1 passed (1)
      Tests  12 passed (12)
```

## Los 10 escenarios mínimos exigidos (más 2 adicionales)

| # | Escenario | Resultado |
|---|---|---|
| 1 | COP en unidades → COP | Pasa — factor = 1 |
| 2 | COP en miles → COP | Pasa — factor = 1000 |
| 3 | COP en millones → COP | Pasa — factor = 1_000_000 |
| 4 | USD en unidades → COP | Pasa — factor = TRM |
| 5 | USD en miles → COP | Pasa — factor = 1000 × TRM |
| 6 | Documento y moneda de reporte iguales | Pasa — sin conversión de moneda, solo escala |
| 7 | Metadata ausente | Pasa — `currencyUndetected: true`, no se inventa una conversión |
| 8 | Moneda no reconocida (p. ej. "EUR") | Pasa — `normalizeCurrencyCode` la trata como `null`, no como COP por defecto |
| 9 | Prevención de conversión doble | Pasa — aplicar el factor sobre un valor ya convertido (misma moneda ambos lados) no vuelve a multiplicar |
| 10 | Factor explícito distinto de uno | Pasa — escala y moneda se multiplican correctamente en un solo paso |
| — | `applyConversion` preserva `null` | Pasa |
| — | `scale_factor`/`exchange_rate` inválidos lanzan error | Pasa |

## Antes / después (evidencia concreta)

```
ANTES:
parse-document detecta moneda_documento="USD" (documento real en USD)
  -> se descarta al persistir (solo "nota_conversion" sobrevive)
  -> build-structured-input lee parseMeta.moneda_documento -> undefined -> default "COP"
  -> factorConversion queda en 1 (nunca se aplica el TRM)
  -> error potencial de ~4080x si el usuario esperaba ver el valor en COP

DESPUÉS:
parse-document persiste moneda_documento="USD" real en audit_events.metadata
  -> build-structured-input lee "USD" correctamente
  -> computeTotalConversionFactor({sourceCurrency:"USD", reportingCurrency:"COP", ...})
  -> factor = TRM, se aplica exactamente una vez
```

## Regresión

`npm test -- --run` completo: 59 pruebas pasan, 0 fallos.
