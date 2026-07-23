# BL-32 — Diseño de versionado de cálculo, fórmulas, datos macro e input

Bloque 1A, `FASE-01-EXACTITUD-FINANCIERA.md`. Diseño únicamente — no se
crean columnas nuevas, no se migra nada, no se conecta a producción. Los
campos aquí descritos ya están reflejados como tipos en
`src/types/calculation-result.ts` (`CalculationVersionInfo`, BL-31), pero
ese archivo tampoco está conectado a producción todavía.

## 1. Por qué hace falta (evidencia, no hipótesis)

`plan/MATRIZ-DE-TRAZABILIDAD.md` ya identificó, antes de este bloque, que
`structured_inputs → fórmula aplicada` es un enlace roto: "`ejecutar-calculo`/`financial-engine.ts`
no registran qué versión de fórmula/constantes se usó". Este documento
diseña los campos que cierran ese enlace — implementarlos y poblarlos con
datos reales es trabajo de Bloque 1C.

## 2. Campos de versionado (cuatro conceptos distintos, no uno solo)

### `calculationVersion`

Identifica la versión de la **lógica de cálculo** como un todo — cambia
cuando se corrige un bug del motor (Bloque 1B), se agrega/quita un KPI, o
se cambia la forma del contrato de salida. Formato propuesto: semver
simple (`"1.0.0"`), incrementado manualmente por quien haga el cambio, no
generado automáticamente.

- Ejemplo de cuándo sube: corregir R-05 (campo de deuda mal nombrado) es
  un cambio de comportamiento del motor → `calculationVersion` pasa de
  `"1.0.0"` a `"1.1.0"` (bug fix, no cambio de contrato) o `"2.0.0"` (si
  además cambia la forma del resultado).

### `formulaVersion`

Identifica qué conjunto de fórmulas específicas se aplicó **dentro** de
una `calculationVersion` dada — pensado para cambios metodológicos
puntuales que no ameritan una nueva versión completa del motor (p. ej.
cambiar la fórmula de Hamada por una variante, o agregar un clamp que hoy
no existe, ver BL-26 sección 3 "clamp de piso en escenario optimista").

- Relación con `calculationVersion`: una `calculationVersion` puede tener
  varias `formulaVersion` históricas si se ajustan fórmulas puntuales sin
  tocar el resto del motor.

### `macroDataVersion`

Identifica qué snapshot de datos macro/sectoriales (Damodaran, Banco de la
República, DANE) se usó — **no** la lógica de cálculo, sino los datos de
entrada externos. Ya existe una tabla real para esto
(`external_snapshots`, referenciada en `build-structured-input/index.ts:192-199`
y `ejecutar-calculo` a través de `sectorBenchmark`) — este campo de
versionado simplemente **cita el `id`** de ese snapshot (o
`"damodaran_2026_jan"` para el fallback hardcodeado, ver
`build-structured-input/index.ts:198`, `buildDefaultSnapshot`), en vez de
dejar implícito cuál se usó.

- Nota de diseño: hoy existen **tres** copias manuales de las mismas
  constantes macro/sectoriales (servidor `ejecutar-calculo`, cliente
  `financial-engine.ts::MARKET_DATA`/`SECTOR_BENCHMARKS`, y
  `build-structured-input::SECTOR_SNAPSHOTS_2026`/`buildDefaultSnapshot`)
  — ver BL-26 sección 4. Este campo de versión no resuelve esa
  duplicación (es trabajo de `BL-17`, consolidación de constantes,
  Bloque 1B), solo registra cuál copia se usó en un cálculo dado.

### `inputHash`

Hash determinístico (propuesto: SHA-256 sobre una serialización estable
del `structured_input`, ordenando las claves del JSON antes de hashear)
del `structured_input` exacto que produjo un `calculation_result`.

- Propósito: detectar si el input cambió **después** de calcular, sin
  necesidad de comparar el JSON completo campo por campo. Es el mecanismo
  concreto que hace verificable la transición `stale` diseñada en
  `BL-28-diseno-maquina-estados.md`, sección 5: si el hash del
  `structured_input` actual no coincide con el `inputHash` guardado en el
  `calculation_result` aprobado, el análisis debe considerarse `stale`.
- No se implementa el hashing en este bloque — se deja especificado el
  algoritmo (SHA-256, JSON con claves ordenadas) para que Bloque 1C lo
  implemente de forma consistente entre servidor y cliente, evitando que
  cada uno calcule el hash de forma distinta y lo vuelva inútil como
  comparación cruzada.

## 3. Dónde vivirían estos campos (diseño de esquema, no migración)

Propuesta para Bloque 1C, **no ejecutada aquí**:

- Los 4 campos de versión se agregan dentro de `calculation_result`
  (columna JSON existente en `analyses`), bajo una clave `version` — tal
  como ya se modeló en `CalculationVersionInfo`
  (`src/types/calculation-result.ts`). Esto es **aditivo**: no requiere
  una migración de esquema, solo que el motor empiece a poblar esa clave
  dentro del JSON que ya escribe hoy (`analyses.calculation_result`,
  `ejecutar-calculo/index.ts:288-291`).
- Alternativa considerada y descartada para 1A (queda para que 1C decida
  formalmente): columnas SQL separadas (`calculation_version`,
  `formula_version`, etc.) en vez de anidarlas en el JSON. Ventaja de
  columnas separadas: se pueden indexar y filtrar con SQL directo.
  Desventaja: requiere una migración de esquema real, mientras que la
  clave dentro del JSON no la requiere. Se deja como decisión abierta
  para Bloque 1C, no se resuelve en este documento.

## 4. Qué NO decide este documento

- No decide el algoritmo de hashing más allá de la propuesta (SHA-256 +
  JSON ordenado) — Bloque 1C puede ajustarlo si encuentra un problema
  práctico de implementación entre Deno y el navegador.
- No decide si se usan columnas SQL o clave JSON — ver sección 3.
- No define un proceso de "release" formal para subir
  `calculationVersion`/`formulaVersion` — solo dice qué información debe
  quedar registrada cuando alguien decide subirla manualmente.
