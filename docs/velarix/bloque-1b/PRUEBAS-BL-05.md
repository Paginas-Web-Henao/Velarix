# Pruebas — BL-05 (Deuda financiera)

Bloque 1B-P0. Bug corregido: `ejecutar-calculo/index.ts::runEngine` leía
`bs.total_debt || bs.financial_debt`, campos que no existen en
`structured_inputs.balance_sheet` — el nombre real, escrito por
`build-structured-input`, es `financial_debt_total`. `totalDebt` era
siempre `0` para cualquier empresa, distorsionando `equityWeight`,
Hamada, WACC y `netDebt`.

## Refactor mínimo de testabilidad

Se extrajo a `supabase/functions/_shared/capital-structure.ts` la parte
de `runEngine` afectada por `totalDebt` (no toda la arquitectura): peso
equity/deuda, Hamada, CAPM, WACC y deuda neta
(`computeCapitalStructure`), más la resolución del campo de deuda
(`resolveFinancialDebtTotal`, con el orden exigido: canónico →
compatibilidad con nombres antiguos → 0 solo si no existe deuda válida).
`ejecutar-calculo/index.ts::runEngine` ahora llama a estas mismas
funciones — no se extrajeron proyecciones, valor terminal, matriz de
sensibilidad ni escenarios (fuera del alcance de BL-05).

## Archivo de prueba

`supabase/functions/_shared/capital-structure.test.ts`

## Comando y resultado

```
$ npx vitest run supabase/functions/_shared/capital-structure.test.ts

 Test Files  1 passed (1)
      Tests  12 passed (12)
```

## Los 10 escenarios mínimos exigidos (más 2 adicionales)

| # | Escenario | Resultado |
|---|---|---|
| 1 | Empresa sin deuda | Pasa — `debtWeight = 0`, `netDebt = -caja` |
| 2 | Empresa con deuda | Pasa — `debtWeight > 0` y distinto del caso sin deuda |
| 3 | Empresa con deuda y caja | Pasa — `netDebt = deuda - caja` |
| 4 | Empresa con deuda mayor al patrimonio | Pasa — `debtWeight > equityWeight` |
| 5 | Campo correcto (`financial_debt_total`) presente | Pasa — se usa directamente |
| 6 | Campo antiguo (`total_debt`) presente, canónico ausente | Pasa — compatibilidad |
| 7 | Ambos campos presentes | Pasa — gana el contrato canónico |
| 8 | Deuda negativa por convención contable | Pasa — se normaliza a valor absoluto |
| 9 | Impacto en `debtWeight` | Pasa — aumentar `totalDebt` sube `debtWeight` monótonamente |
| 10 | **Impacto en WACC y net debt** (demuestra que el resultado financiero usa la deuda, no solo que se leyó un número) | Pasa — ver evidencia abajo |
| — | Ningún campo de deuda presente | Pasa — `0` |
| — | `equity <= 0` | Pasa — usa el peso por defecto (0.70), no divide por cero |

## Antes / después (evidencia concreta — prueba #10, la que demuestra impacto financiero real)

```ts
const balanceSheet = { financial_debt_total: 900_000 };

// ANTES (comportamiento del bug):
const totalDebtBugAntiguo = Math.abs(balanceSheet.total_debt || balanceSheet.financial_debt || 0);
// => 0  (ninguno de los dos nombres existe en el dato real)

// DESPUÉS (resolveFinancialDebtTotal):
const totalDebtCorregido = resolveFinancialDebtTotal(balanceSheet);
// => 900_000

// Efecto en el resultado financiero (computeCapitalStructure), no solo en el número leído:
computeCapitalStructure({ ...BASE, totalDebt: totalDebtBugAntiguo, cash: 100_000, equity: 1_000_000 }).netDebt
// => -100_000  (como si la empresa no tuviera deuda)

computeCapitalStructure({ ...BASE, totalDebt: totalDebtCorregido, cash: 100_000, equity: 1_000_000 }).netDebt
// => 800_000  (deuda neta real)

// waccPct y debtWeight también difieren entre ambos casos (verificado en la prueba).
```

## Regresión

`npm test -- --run` completo: 59 pruebas pasan, 0 fallos. `ejecutar-calculo/index.ts`
verificado manualmente línea por línea tras el refactor (no ejecutable en
este entorno por el bloqueo de Deno, ver `REPORTE-IMPLEMENTACION-1B-P0.md`)
para confirmar que la salida (`valuation.wacc`, `valuation.netDebt`,
`kpis.leverage`) sigue siendo algebraicamente idéntica a la fórmula
original, con el único cambio real siendo `totalDebt` correctamente
resuelto.
