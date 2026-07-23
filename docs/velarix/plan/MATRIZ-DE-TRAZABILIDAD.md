# Matriz de Trazabilidad

Conecta: Documento original → parsed document → mapping → structured
input → fórmula → calculation result → narrative → PDF. Indica qué
enlaces existen hoy y cuáles faltan (`Negocio_Velarix_v4.1.md` §10.3
exige que cada cifra material sea trazable hasta la persona que aprobó).

> **Corregido 2026-07-23 (tras D-07)**: la conexión real de narrativa y
> PDF al resultado servidor **no** ocurre en el Bloque 1A (que es
> únicamente diseño y pruebas, sin activar nada) — ocurre en el
> **Bloque 1E**, y solo cuando 1B, 1C y 1D ya están cerrados.

| Enlace | ¿Existe hoy? | Evidencia | Falta | Se cierra en |
|---|---|---|---|---|
| Documento original → `documents` | Sí | `upload-document/index.ts` inserta fila con `storage_path`, checksum | — | — |
| `documents` → `documents_parsed` (parsed document) | Sí, por `document_id` | `parse-document/index.ts:628` (`documents_parsed.document_id`) | — | — |
| `documents_parsed` → `account_homologations` (mapping) | Sí, por `document_id` | `map-accounts/index.ts:219,234` guarda `document_id` por fila | — | — |
| `account_homologations` → `structured_inputs` (structured input) | **Parcial (desde 1C-T, 2026-07-23)** | `structured_inputs.input_payload.provenance` (`_shared/calculation-provenance.ts`) guarda `homologation_ids`/`document_ids` por cifra para 8 campos priorizados. `source_row_ids` sigue `null`/`"missing"` — no existe identificador de fila cruda anterior a `account_homologations` en el esquema actual | Persistir un identificador de fila del documento parseado (`documents_parsed.parsed_structure[].posicion`) hasta `account_homologations`, para cerrar `source_row_ids` | **Bloque 1C** (`BL-15`, parcial — falta el nivel de fila cruda) |
| `structured_inputs` → fórmula aplicada | **Parcial (desde 1C-T, 2026-07-23)** | `_shared/calculation-versioning.ts` agrega `methodology_version` (de `CANONICAL_METHODOLOGY`) e `input_fingerprint` determinístico a cada resultado — pero solo del motor **servidor**; `financial-engine.ts` (cliente) sigue sin ningún registro de versión | Registrar versión de fórmula también en el motor cliente, si se decide que siga siendo relevante tras 1E | **Bloque 1C** (`BL-32`, parcial — falta versión de datos macro/sectoriales y el lado cliente) |
| Fórmula → `calculation_result` | **Parcial, ampliado en 1C-T** | El resultado se guarda (`analyses.calculation_result`) con `version`/`provenance` agregados como campos adicionales (`ejecutar-calculo/index.ts`) sin alterar `projections`/`scenarios`/`kpis`/`valuation`/etc. El contrato tipado formal (`BL-31`, `src/types/calculation-result.ts`) sigue sin conectarse a producción | Conectar el contrato tipado real de `BL-31`, no solo campos adicionales compatibles | **Bloque 1A** (contrato) **→ Bloque 1C** (población parcial ya hecha en 1C-T; conexión del contrato tipado formal sigue pendiente) |
| `calculation_result` → `report_narratives` (narrative) | **No, hoy** | `generate-narrative` no se invoca en el flujo real (ver `auditoria/04`, `auditoria/08`) | Conectar `generate-narrative` a `run-analysis-pipeline` (`BL-29`) | **Bloque 1E** — no antes: requiere que 1B (bugs corregidos), 1C (casos dorados aprobados) y 1D (seguridad) ya estén cerrados |
| `report_narratives`/`calculation_result` → PDF | **No, hoy** | El PDF se genera desde un recálculo independiente en el navegador (`financial-engine.ts`), no desde `calculation_result` ni `report_narratives` | Reconectar `Dashboard.tsx::handleDownloadPDF` a `calculation_result` | **Bloque 1E** — hallazgo central del split-brain; decisión ya tomada (`D-06`) y aprobada, pero la activación real espera a que 1B/1C/1D cierren |
| Cifra del PDF → persona que aprobó | **No** | Ningún flujo de revisión humana se ejecuta sobre el resultado numérico final antes de la descarga | Requiere el estado `approved_for_delivery` (diseñado en 1A) aplicado con autorización real (1D) y activado en el flujo real (1E) | **Bloque 1A** (diseña el estado) **+ Bloque 1D** (quién puede aprobar, sin autoaprobación) **+ Bloque 1E** (bloquea la descarga hasta que el estado se alcance realmente) |

## Conclusión

La trazabilidad es sólida en los primeros 3 pasos (documento → parseo →
mapping). **Desde 1C-T (2026-07-23)** existe trazabilidad real, aunque
parcial, desde `account_homologations` hasta `calculation_result` para 8
cifras priorizadas (`homologation_ids`/`document_ids` por campo) — pero
sigue sin poder responderse "¿de qué FILA EXACTA del Excel salió este
EBITDA?" (`source_row_ids` es `"missing"`, no existe ese nivel de detalle
en el esquema hoy), y esa trazabilidad **no llega todavía al PDF**,
porque el PDF sigue usando un recálculo independiente del motor cliente,
sin relación con `calculation_result`. Eso se cierra en Bloque 1E, no
antes.

**Actualizado 2026-07-23 (cierre de Bloque 1A)**: el contrato tipado
mencionado en las filas de abajo (`BL-31`) ya existe como diseño en
`src/types/calculation-result.ts` (`CalculationResult.traceability`,
campo `structuredInputId`/`sourceDocumentIds`/`sourceMappingIds`) — no
conectado a producción todavía, se puebla realmente en Bloque 1C. El
diseño de versionado (`BL-32`) también quedó documentado en
`docs/velarix/bloque-1a/BL-32-diseno-versionado.md`. Ninguna fila de esta
tabla cambia de "Falta" a "Existe" por esto — el diseño no es la
implementación.

**Actualizado 2026-07-23 (1B-P0)**: BL-02, BL-03, BL-04, BL-05 y BL-06
quedaron corregidos (ver `docs/velarix/bloque-1b/REPORTE-IMPLEMENTACION-1B-P0.md`),
pero esto tampoco cambia ninguna fila de "Falta" a "Existe" en esta
tabla — 1B-P0 corrigió la exactitud de los valores dentro de cada paso
del pipeline (subcuentas, moneda, deuda, formato de PDF, aborto ante
fallo), no agregó ningún enlace de trazabilidad nuevo entre pasos. Los
enlaces rotos (`structured_inputs → fórmula aplicada`,
`calculation_result → narrative`, `PDF → persona que aprobó`) siguen
exactamente igual de rotos que antes, y se cierran en los bloques ya
indicados (1C/1D/1E), no en 1B-P0.

**Actualizado 2026-07-23 (1B-M + 1C-Prep)**: `_shared/financial-methodology.ts`
agrega la versión de metodología (`methodologyVersion`) que el enlace
"`structured_inputs` → fórmula aplicada" necesitaba — pero el servidor
**todavía no la persiste** en `calculation_result` (eso es la
implementación real de `BL-32`, tarea de Bloque 1C, no hecha en esta
preparación). Los 3 casos dorados provisionales
(`docs/velarix/bloque-1c/CASOS-DORADOS-PROVISIONALES.md`) tampoco
cambian ninguna fila de "Falta" a "Existe" — son pruebas técnicas, no
trazabilidad de producción.

**Actualizado 2026-07-23 (D-07)**: con `D-06`/`D-07` ya decididos y
aprobados, cada enlace faltante tiene un bloque concreto donde se cierra.
El orden real es: **1A diseña** (contrato, estados, versionado) → **1B
corrige** los bugs subyacentes → **1C implementa** trazabilidad y
versionado sobre el motor ya corregido, con casos dorados aprobados por
el revisor externo → **1D cierra** la autorización de quién puede aprobar
→ **1E conecta** realmente narrativa y PDF al resultado, y activa el
bloqueo de descarga hasta `approved_for_delivery`. Ningún enlace de
narrativa/PDF se cierra antes de 1E, bajo ninguna circunstancia.

**Actualizado 2026-07-23 (cierre técnico de 1B-M/1C-Prep, commit `9cfe14a`)**:
el motor servidor canónico (`supabase/functions/_shared/canonical-financial-engine.ts`)
se extrajo y quedó consumido realmente por
`supabase/functions/ejecutar-calculo/index.ts`, con fixtures propios
(`canonical-financial-engine.golden-cases.fixtures.ts`) y regresiones
numéricas reales (`canonical-financial-engine.golden-cases.test.ts`). Los
resultados de `runAnalysis` (motor cliente) siguen siendo **referencia**,
no resultados canónicos — los únicos resultados canónicos son los de
`runCanonicalFinancialEngine`. Esto tampoco cambia ninguna fila de
"Falta" a "Existe": son pruebas técnicas sobre el motor, no trazabilidad
de producción. Estado: casos técnicos provisionales, pendientes de
aprobación financiera.

**Actualizado 2026-07-23 (Bloque 1C-T — trazabilidad, versionado y
fingerprint)**: tres filas de esta tabla pasan de "No" a "Parcial" (ver
arriba): `account_homologations → structured_inputs`,
`structured_inputs → fórmula aplicada`, y `Fórmula → calculation_result`
se amplía. Implementado con módulos puros nuevos
(`_shared/calculation-provenance.ts`, `_shared/calculation-versioning.ts`,
`_shared/calculation-fingerprint.ts`), sin tocar ninguna fórmula del
motor canónico ni los resultados de los Casos A/B/C. Detalle completo en
`docs/velarix/bloque-1c/REPORTE-IMPLEMENTACION-1C-TECNICO.md`. Ninguna
fila pasa a "Existe" (completa): las dos filas de narrativa/PDF siguen
"No, hoy", y la fila de `Cifra del PDF → persona que aprobó` sigue "No"
— ninguna de las dos se toca hasta Bloque 1E. `BL-15`/`BL-32` quedan
parciales, no completos (ver `plan/BACKLOG-CLASIFICADO.md`). La
aprobación formal del revisor financiero externo sigue pendiente
(`docs/velarix/bloque-1c/PAQUETE-REVISION-FINANCIERA.md`).
