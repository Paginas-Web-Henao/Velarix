# BL-28 — Diseño de la máquina de estados de un análisis

Bloque 1A, `FASE-01-EXACTITUD-FINANCIERA.md`. Diseño únicamente — no se
implementa, no se migra la base de datos, no se cambia ningún `status`
real en este bloque. El objetivo es dejar especificado el estado
`approved_for_delivery` y sus reglas antes de que Bloque 1D (autorización)
y Bloque 1E (activación) lo necesiten.

## 1. Estados actuales en producción (verificado)

`src/pages/Dashboard.tsx:19-34` (`statusConfig`) confirma que hoy existen
estos valores reales de `analyses.status`:

```
creado → documentos_cargados → parsing_en_curso → parsing_completado →
homologacion_en_curso → validacion_aprobada | validacion_con_advertencias | validacion_bloqueada →
calculo_en_curso → calculo_completo → interpretacion_en_curso → informe_generado
```

Más dos estados transversales de error/excepción: `error_tecnico`,
`revision_manual_requerida`.

**Ninguno de estos estados distingue "calculado" de "aprobado para
entrega"** — `informe_generado` es el único estado terminal, y hoy se
alcanza sin que ningún humano apruebe el resultado numérico (confirmado en
auditoría previa: no existe flujo de revisión humana sobre el resultado
final antes de la descarga, ver `plan/MATRIZ-DE-TRAZABILIDAD.md`, fila
"Cifra del PDF → persona que aprobó").

## 2. Estados propuestos (diseño, nombres en inglés para no chocar con los `status` reales en español — ver mapeo en la sección 3)

```
uploaded → parsed → mapped → validated → calculated →
narrative_generated → human_review_pending → approved_for_delivery → delivered
```

Con dos estados transversales alcanzables desde cualquier punto:
`technical_error`, `stale` (ver sección 5 — invalidación por modificación
posterior).

## 3. Mapeo con los estados reales de hoy

| Estado propuesto (diseño) | Estado real equivalente hoy | ¿Existe ya el equivalente? |
|---|---|---|
| `uploaded` | `creado` / `documentos_cargados` | Sí, ya existen dos estados reales para esto — el diseño los consolida en uno para simplificar, pendiente de decidir en 1C si se fusionan de verdad |
| `parsed` | `parsing_completado` | Sí |
| `mapped` | (implícito — no hay estado explícito de "homologación completada", solo `homologacion_en_curso`) | Parcial — falta un estado real de "mapeo completo" antes de validar |
| `validated` | `validacion_aprobada` / `validacion_con_advertencias` / `validacion_bloqueada` | Sí, con 3 variantes reales |
| `calculated` | `calculo_completo` | Sí |
| `narrative_generated` | (no existe — `generate-narrative` no se invoca en el flujo real hoy, ver BL-26 sección 8) | No — este estado es nuevo, se activa junto con la conexión real de la narrativa en Bloque 1E |
| `human_review_pending` | `revision_manual_requerida` (existe, pero hoy no está atado a la aprobación de un resultado numérico específico) | Parcial |
| `approved_for_delivery` | **No existe ningún equivalente hoy** | **No — es el estado nuevo central de este diseño** |
| `delivered` | `informe_generado` (hoy se alcanza sin pasar por `approved_for_delivery`) | Parcial — el nombre existe pero la garantía que debería preceder a este estado no |
| `technical_error` | `error_tecnico` | Sí |
| `stale` | **No existe** | **No — es el estado nuevo de invalidación (sección 5)** |

## 4. Reglas por estado

### `approved_for_delivery` (el estado central de este diseño)

- **Solo este estado habilita generar o descargar el informe
  profesional** — la verificación debe ser **server-side** (en la Edge
  Function que sirve el PDF/narrativa, o en una política RLS), nunca
  confiando en una bandera del frontend. Esto ya está fijado como
  criterio de cierre en `plan/DEFINICION-DE-TERMINADO.md`, sección "Estado
  y aprobación del análisis (Bloques 1A/1E)".
- Quién puede llevar un análisis a este estado se decide en **Bloque
  1D** (modelo de actores: cliente propietario, analista autorizado,
  administrador, invocación interna) — este documento de 1A no define
  permisos, solo el estado y sus invariantes.
- Al aprobar, se debe registrar: usuario, rol, timestamp, y la versión
  exacta de cálculo/fórmulas/datos macro vigente en ese momento (ver
  `CalculationVersionInfo` en `src/types/calculation-result.ts`, diseñado
  en BL-31/BL-32). Sin este registro, la aprobación no es válida.

### `stale` (invalidación — nuevo, resuelve un vacío real)

- Cualquier modificación posterior a una aprobación —documento nuevo o
  reemplazado, cambio de mapeo, cambio de un input, cambio de un
  supuesto, cambio de fórmula/versión de cálculo, o regeneración de la
  narrativa— debe mover el análisis de `approved_for_delivery` de vuelta
  a un estado anterior (`calculated` o `validated`, según qué cambió),
  **nunca dejarlo "aprobado" con datos distintos a los que efectivamente
  se aprobaron.**
- Esta regla no tiene hoy ningún mecanismo real que la haga cumplir — es
  exactamente el vacío que `plan/DEFINICION-DE-TERMINADO.md` ya señala
  ("Existe una prueba que demuestra que cualquier modificación
  posterior... invalida una aprobación ya otorgada"). Implementar el
  disparador real (trigger de base de datos, o verificación en cada Edge
  Function que modifique datos aguas arriba) es trabajo de Bloque 1C/1D,
  no de este documento de diseño.

### `delivered`

- El PDF entregado debe corresponder a una versión **inmutable o
  reproducible** del resultado aprobado — no a un recálculo posterior.
  Esto es precisamente lo que hoy se viola: `Dashboard.tsx:124`
  (`runAnalysis(inputs)`) recalcula en el navegador en el momento de la
  descarga, en vez de servir el `calculation_result` ya persistido y
  aprobado. Corregir esto es la tarea central de Bloque 1E (`D-06`), no
  de este documento.

### `technical_error`

- Estado transversal, alcanzable desde cualquier punto del pipeline
  cuando una Edge Function falla. Ya existe y funciona así hoy
  (`error_tecnico`) — el diseño no le agrega reglas nuevas.

## 5. Transiciones prohibidas (explícitas, para que 1D/1E no las reintroduzcan por accidente)

- `approved_for_delivery → delivered` sin verificación server-side de que
  el estado actual sea realmente `approved_for_delivery` — un check
  únicamente en el frontend (ocultar un botón) no cuenta como control de
  este estado (mismo principio que `plan/DEFINICION-DE-TERMINADO.md`,
  sección RLS: "una prueba que solo confirma que el frontend oculta un
  botón NO cuenta como evidencia de corrección de seguridad").
- Ningún estado puede saltar directamente a `delivered` sin pasar por
  `approved_for_delivery` para un informe profesional — el diseño no
  contempla una ruta de emergencia que lo permita, ni siquiera durante un
  incidente (ver el principio de rollback de `D-07`/R-18 en
  `plan/MATRIZ-DE-RIESGOS.md`: el rollback nunca reactiva el motor cliente
  para producir una valoración profesional, y por la misma lógica tampoco
  debe saltarse la aprobación).
- `stale → approved_for_delivery` de forma automática — siempre debe
  volver a pasar por revisión humana explícita, no reaprobarse solo
  porque el nuevo cálculo "parece similar" al anterior.

## 6. Qué NO decide este documento

- No decide si los estados en español de la base de datos se renombran a
  inglés — es una decisión de implementación de Bloque 1C, y podría
  incluso decidirse que no vale la pena renombrar y solo se agregan los
  estados nuevos (`approved_for_delivery`, `stale`) al esquema existente
  en español.
- No decide el mecanismo técnico de invalidación (trigger de Postgres vs.
  verificación en cada función) — eso es Bloque 1C/1D.
- No decide quién puede aprobar — eso es Bloque 1D.
