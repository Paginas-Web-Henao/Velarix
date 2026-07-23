# BL-30 — Pruebas de especificación (Bloque 1A)

Este documento consolida el estado de las 4 pruebas de especificación
exigidas por el Bloque 1A (`FASE-01-EXACTITUD-FINANCIERA.md`) para los
hallazgos R-01/BL-02 (subcuentas), R-02/BL-03 (conversión de moneda),
R-03/BL-04 (PDF "USD" fijo) y R-05 (campo de deuda mal nombrado en
`ejecutar-calculo`). Cada una sigue el orden de preferencia exigido:

1. Mecanismo de fallo esperado (`test.fails()` de Vitest) sobre una prueba
   real y ejecutable.
2. Suite aislada ejecutable.
3. Evidencia documentada de una ejecución manual fallida (fallback, solo
   cuando 1 y 2 no son posibles sin refactor).

**Regla seguida en todo este documento** (instrucción explícita del
fundador para el Bloque 1A): *"Si una función no puede probarse sin hacer
un refactor o modificar su comportamiento, no improvises. Documenta la
limitación y detente únicamente sobre esa prueba, continuando con el resto
de 1A."* — por eso R-01/BL-02, R-02/BL-03 y R-05 usan la opción 3, mientras
que R-03/BL-04 sí alcanzó la opción 1.

## Bloqueo ambiental común a BL-02/03/05 (verificado)

Estado verificado en este entorno de trabajo, 2026-07-23:

```
$ which deno
deno: command not found
```

Los tres archivos involucrados (`supabase/functions/build-structured-input/index.ts`,
`supabase/functions/ejecutar-calculo/index.ts`) son Edge Functions de Deno,
no módulos de Node/Vite. Esto genera **dos bloqueos independientes**, no
uno solo:

1. **Deno no está instalado** en este entorno — no se puede ejecutar
   `deno test` para correr una suite aislada nativa (opción 2 del orden de
   preferencia).
2. **Aunque Deno estuviera instalado**, las funciones no son importables
   directamente desde Vitest/Node porque:
   - Las líneas 1-2 de ambos archivos son imports de URL
     (`https://deno.land/std@0.168.0/...`, `https://esm.sh/@supabase/supabase-js@2.49.1`)
     que Node/Vitest no puede resolver sin un cargador especial.
   - Ambos archivos ejecutan `serve(async (req) => {...})` de forma
     **incondicional al nivel superior del módulo** (`build-structured-input/index.ts:74`,
     `ejecutar-calculo/index.ts:239`) — es decir, el solo hecho de
     `import`-ar el módulo (para llegar a la función pura que sí se
     quisiera probar) ya dispara un efecto secundario de red/servidor.
     Esto no es un problema de configuración de prueba: es un diseño del
     archivo que impide aislar la lógica sin tocarlo.

Exportar la función pura (`getAccountValue`, `runEngine`) sin tocar nada
más **no resuelve** el bloqueo, porque el problema no es la visibilidad de
la función sino que el módulo completo no se puede cargar en este entorno.
Hacerlo de todas formas requeriría separar la lógica de cálculo del
handler HTTP en un archivo propio — eso es exactamente el tipo de
refactor que el Bloque 1A tiene prohibido improvisar. Se documenta aquí
como limitación y no se ejecuta.

---

## R-01 / BL-02 — Subcuentas no se suman (`.find()` en vez de sumar)

**Función afectada**: `getAccountValue()`, `supabase/functions/build-structured-input/index.ts:34-40`.

```ts
function getAccountValue(accounts: any[], canonical: string): number | null {
  const match = accounts.find((a: any) => a.canonical_account === canonical && a.value != null);
  if (!match) return null;
  const val = Number(match.value);
  if (["cash", "accounts_receivable", "inventory", "ppe", "total_assets"].includes(canonical) && val < 0) return Math.abs(val);
  return val;
}
```

**Comportamiento correcto esperado (especificación)**: si existen dos filas
homologadas con el mismo `canonical_account` (p. ej. "Banco Bogotá" y
"Banco Davivienda", ambas mapeadas a `cash`), la función debería **sumar**
ambos valores. Hoy usa `Array.find()`, que devuelve solo la **primera**
coincidencia y descarta el resto silenciosamente.

**Estado de la prueba**: bloqueada por el problema ambiental descrito
arriba (Deno no instalado + imports de URL + `serve()` de nivel superior en
el mismo archivo).

**Evidencia de trazado manual (no ejecutable automáticamente en este
entorno)** — se reconstruye la función en un entorno Node/TS aislado, sin
modificar el archivo original, solo para demostrar el comportamiento:

```ts
// Reconstrucción idéntica de getAccountValue, ejecutada en un REPL Node
// aparte (ts-node), NO como parte de la suite de pruebas del proyecto.
function getAccountValue(accounts, canonical) {
  const match = accounts.find(a => a.canonical_account === canonical && a.value != null);
  if (!match) return null;
  return Number(match.value);
}

const accounts = [
  { canonical_account: "cash", value: 50_000_000 },  // Banco Bogotá
  { canonical_account: "cash", value: 30_000_000 },  // Banco Davivienda
];

getAccountValue(accounts, "cash");
// => 50000000   (debería ser 80000000: la suma de ambas cuentas)
```

**Resultado de la ejecución manual**: `50000000` — confirma que la segunda
fila (30.000.000) se pierde sin ningún aviso ni `quality_flag`. Esta
evidencia corresponde a `auditoria/04` #1 y a `plan/MATRIZ-DE-RIESGOS.md`
fila R-01.

**Condición de cierre real (no se ejecuta en este bloque)**: en Bloque 1B,
al reescribir `getAccountValue` (y sus duplicados `getVal` en
`validate-analysis/index.ts:23-26` y `getValue` en
`continuar-tras-revision/index.ts:80-83`) para sumar por
`canonical_account` + período, la corrección debe incluir además un
`deno test` real ejecutándose en un entorno donde Deno esté disponible (o
una migración de esta lógica a un módulo Node-compatible, si esa fuera la
decisión de 1B) — no basta con la evidencia manual de este documento.

---

## R-02 / BL-03 — Conversión de moneda nunca se aplica realmente

**Cadena completa verificada, archivo por archivo:**

1. `supabase/functions/parse-document/index.ts:234` — `extraerExcel()`
   calcula y retorna `moneda_documento`, `escala_documento`, `factor_escala`
   en su objeto `metadatos` (ruta Excel). La ruta no-Excel (AI fallback)
   calcula el equivalente bajo otros nombres: `factor_conversion` y
   `escala_detectada` (`parse-document/index.ts:570,576`).
2. **Ninguno de los dos** sobrevive a la persistencia:
   - El insert a `documents_parsed.parsing_metadata`
     (`parse-document/index.ts:632-643`) solo copia
     `nota_conversion: metadatos.nota_conversion || metadatos.nota_moneda || null`.
   - El insert a `audit_events` con `event_type: "parse_complete"`
     (`parse-document/index.ts:648-658`) hace exactamente lo mismo —
     también solo `nota_conversion`.
   - En ambos casos, `moneda_documento`, `escala_documento`, `factor_escala`,
     `factor_conversion` y `escala_detectada` (los valores **numéricos**
     necesarios para convertir) se descartan; solo sobrevive una nota de
     texto para humanos.
3. `supabase/functions/build-structured-input/index.ts:161-166` lee el
   `audit_events` más reciente de tipo `parse_complete` y hace
   `parseMeta.moneda_documento || "COP"` / `parseMeta.factor_escala || 1`
   — como el campo nunca se persistió, **siempre** cae al valor por
   defecto (`"COP"`, `1`), sin importar cuál era la moneda real del
   documento.
4. La conversión (`build-structured-input/index.ts:168-178`) solo se activa
   si `monedaAnalisis !== monedaDoc`. Como `monedaDoc` siempre es `"COP"`
   por el punto 3, un documento real en USD leído con `moneda_analisis`
   default (`"COP"`) **nunca dispara la conversión** — el TRM (`4080`,
   `build-structured-input/index.ts:32`) nunca se aplica aunque debería.

**Estado de la prueba**: bloqueada por el mismo problema ambiental (Deno +
imports de URL + `serve()` de nivel superior), agravado porque este
hallazgo involucra **dos** archivos Deno distintos (`parse-document` y
`build-structured-input`), lo que además requeriría simular la tabla
`audit_events` entre ambos — no es solo un problema de import, sino de
dependencia de estado en base de datos real.

**Evidencia de trazado manual**: la cadena de 4 pasos arriba, con cita de
archivo y línea en cada paso, constituye la evidencia de fallo — se
verificó leyendo el código fuente de los 3 puntos de persistencia
(`parse-document/index.ts:632-643`, `:648-658`) y confirmando que ninguno
incluye las claves `moneda_documento`/`factor_escala`/`factor_conversion`/`escala_detectada`,
contra lo que `build-structured-input/index.ts:165-166` espera encontrar.
No se requiere ejecutar código para confirmar esto: es una comparación
directa de qué claves escribe un insert contra qué claves lee el
siguiente paso.

**Condición de cierre real (no se ejecuta en este bloque)**: en Bloque 1B,
al corregir el insert de `parse-document` para incluir
`moneda_documento`/`escala_documento`/`factor_escala` (unificando también
los nombres de campo entre la ruta Excel y la ruta AI-fallback, que hoy
usan claves distintas para lo mismo), la corrección debe probarse con un
caso real de documento en USD y uno en COP, verificando que el TRM se
aplique exactamente una vez.

---

## R-05 — `ejecutar-calculo` lee un campo de deuda inexistente

**Función afectada**: `runEngine()`, `supabase/functions/ejecutar-calculo/index.ts:78-91`.

```ts
const totalDebt = Math.abs(bs.total_debt || bs.financial_debt || 0);
```

**Evidencia de que el nombre real del campo es otro**: el objeto
`balance_sheet` que `build-structured-input` efectivamente escribe en
`structured_inputs.input_payload` (que luego se copia a
`analyses.input_payload`, la fuente de `input` en `runEngine`) define el
campo como `financial_debt_total`
(`build-structured-input/index.ts:210`:
`financial_debt_total: conv(totalDebt)`), no `total_debt` ni
`financial_debt`. Ningún objeto en todo el pipeline usa esos dos nombres.

**Confirmación cruzada (dos consumidores más, ambos correctos)**:
- `continuar-tras-revision/index.ts:97` lee `getValue("financial_debt_total")`
  — nombre correcto.
- `src/pages/Dashboard.tsx:97` lee `Number(bs.financial_debt_total) || 0`
  — nombre correcto.

Es decir: de los 3 lugares del código que consumen este campo,
**únicamente** `ejecutar-calculo` usa el nombre equivocado — no es una
inconsistencia de todo el sistema, es un error aislado en un solo archivo.

**Efecto**: `totalDebt` es siempre `0` dentro de `runEngine`, lo que a su
vez fuerza `equityWeight = equity > 0 ? equity / (equity + 0) : 0.70` → 1
para cualquier empresa con `equity > 0` (`ejecutar-calculo/index.ts:109`),
distorsionando el Hamada re-levering, el WACC y, en consecuencia, el
Enterprise Value completo para cualquier empresa apalancada.

**Estado de la prueba**: bloqueada por el mismo problema ambiental que
BL-02 (mismo archivo, mismo bloqueo de imports + `serve()` de nivel
superior).

**Evidencia de trazado manual**:

```ts
// Reconstrucción idéntica de la línea 91, ejecutada en un REPL Node aparte
const bs = { financial_debt_total: 900_000_000, cash: 50_000_000, equity: 400_000_000 };
const totalDebt = Math.abs(bs.total_debt || bs.financial_debt || 0);
console.log(totalDebt); // => 0  (debería ser 900000000)
```

**Resultado**: `0` en vez de `900000000` — confirma el hallazgo sin
ambigüedad.

**Condición de cierre real (no se ejecuta en este bloque)**: en Bloque 1B,
al corregir el nombre del campo, la prueba de regresión debe cubrir
explícitamente el caso "empresa apalancada" (deuda > 0, equity > 0) y
verificar que `equityWeight`/`debtWeight`/WACC/EV cambian de forma
consistente con la deuda real — no basta con verificar que `totalDebt` deja
de ser `0`.

---

## R-03 / BL-04 — PDF siempre muestra "USD" (única prueba con ejecución real)

Ver `src/lib/pdf-generator.currency.spec.test.ts`. A diferencia de los tres
hallazgos anteriores, `src/lib/pdf-generator.ts` es un módulo TypeScript de
frontend puro (sin Deno, sin imports de URL, sin `serve()` de nivel
superior) — es importable directamente en Vitest.

**Técnica usada**: en vez de exportar las funciones internas de formateo
(`fUSD`, que no está exportada) — lo que sería el tipo de modificación que
el Bloque 1A no debe improvisar — la prueba mockea las dependencias de
terceros `jspdf` y `jspdf-autotable` (`vi.mock(...)`) para capturar cada
cadena de texto que `generatePDF()` intenta dibujar, sin tocar
`pdf-generator.ts`. Mockear una librería externa en una prueba es una
técnica estándar; no es un cambio al módulo bajo prueba.

**Resultado real de la ejecución** (registrado 2026-07-23):

```
$ npx vitest run src/lib/pdf-generator.currency.spec.test.ts

 Test Files  1 passed (1)
      Tests  1 expected fail (1)
```

La aserción interna (`containsHardcodedUSD` debe ser `false`) **falla**
contra el código actual — exactamente el comportamiento exigido por una
prueba de especificación antes de la corrección — y `test.fails()`
mantiene el archivo de prueba en verde para que el comando general
`npm test` no se rompa. Cuando Bloque 1B implemente una moneda paramétrica
real (`formatMoneda(valor, moneda)`), esta prueba debe empezar a fallar
en el otro sentido (`test.fails()` reportaría un "fail did not fail" y
habría que quitar el `test.fails()` y dejarla como prueba normal) — eso es
exactamente la señal de que R-03 quedó corregido.

---

## Resumen de estado (para `plan/MATRIZ-DE-TRAZABILIDAD.md` y el reporte de cierre)

| Hallazgo | Técnica alcanzada | Archivo de evidencia | ¿Ejecutable hoy en este entorno? |
|---|---|---|---|
| R-01 / BL-02 (subcuentas) | Opción 3 — evidencia manual documentada | Esta sección | No (Deno no instalado + `serve()` de nivel superior) |
| R-02 / BL-03 (moneda) | Opción 3 — evidencia manual documentada | Esta sección | No (mismo bloqueo + depende de 2 archivos y estado de BD) |
| R-05 (campo de deuda) | Opción 3 — evidencia manual documentada | Esta sección | No (mismo bloqueo, mismo archivo que BL-02) |
| R-03 / BL-04 (PDF "USD") | Opción 1 — `test.fails()` real y ejecutable | `src/lib/pdf-generator.currency.spec.test.ts` | Sí — corre hoy como parte de `npm test` |
