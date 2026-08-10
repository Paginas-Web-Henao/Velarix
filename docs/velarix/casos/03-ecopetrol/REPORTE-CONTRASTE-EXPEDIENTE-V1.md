# Reporte de contraste — Caso 03 (Ecopetrol) vs. `EXPEDIENTE-DE-VALORACION-V1.md`

**Fecha:** 2026-08-10
**Insumo:** `docs/velarix/casos/03-ecopetrol/CASO-03-ECOPETROL-V0.md`
**Insumos previos:** `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`
y su reporte de contraste; `docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md`
y su reporte de contraste (mismas carpetas que cada caso).
**Objetivo:** determinar, con el Caso 03 como tercer punto de dato
independiente, qué de lo observado o reforzado por Tecnoglass y Terpel
**sobrevive de forma transversal a los tres casos**, qué **se profundiza
o cambia de forma**, qué **problema pasa de hipótesis a demostrado**, y
qué necesidad **nueva** aparece que el Expediente V1 (ya actualizado por
los Casos 01 y 02) no representaba todavía.

**CASO 03 NO AUTORIZA IMPLEMENTACIÓN.** Este reporte de contraste, igual
que el caso que resume, es exclusivamente documental. Ningún cambio
descrito aquí autoriza crear tablas, migraciones, schemas, UI, motores,
Edge Functions, automatizaciones ni ningún otro cambio técnico. Solo
Nicolás/fundador puede autorizar implementación, de forma explícita y
separada.

**Regla rectora de este reporte**: dos casos muestran patrones; dos casos
no crean leyes universales. Con un tercer caso, cuando la misma
conclusión reaparece de forma transversal e idéntica en Tecnoglass,
Terpel y Ecopetrol, se documenta prudentemente como `PATRÓN OBSERVADO EN
TRES CASOS` — **nunca** como `CONFIRMADO`, y nunca como ley universal.
Esta etiqueta se usa **solo** donde se verificó evidencia real en los
tres casos — no por reemplazo automático de menciones anteriores a "dos
casos".

**Clasificaciones usadas:** `PATRÓN OBSERVADO EN TRES CASOS` (evidencia
transversal e independiente en Tecnoglass + Terpel + Ecopetrol),
`SOBREVIVE, PERO SE PROFUNDIZA` / `INCOMPLETO` (la regla reaparece, pero
su diseño sigue sin cerrarse), `PROBLEMA DEMOSTRADO; EVIDENCIA
INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN GENERAL` (deja de ser hipótesis
débil, pasa a tener evidencia directa, pero sigue sin solución de
diseño), `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES
CASOS` (aplica a `scope`), `PREGUNTA CONCEPTUAL ABIERTA — EVIDENCIA MENOR
QUE SCOPE` (aplica a `purpose`), `EVIDENCIA FUERTE EN UN CASO — VALIDAR
EN CASOS FUTUROS` (candidatos A y B, evidencia fuerte pero de un solo
caso), `NUEVA PREGUNTA METODOLÓGICA — REQUIERE MÁS CASOS Y POSTERIOR
VALIDACIÓN EXPERTA` (candidato C).

---

## 1. Matriz de contraste formal R1–R8

Ver detalle completo con evidencia en `CASO-03-ECOPETROL-V0.md` §17.
Resumen:

| Regla | Resultado Caso 03 | Estado transversal | Nota |
|---|---|---|---|
| R1 — Contabilidad ≠ economía | `SOBREVIVE — FUERTEMENTE REFORZADA` | `PATRÓN OBSERVADO EN TRES CASOS` | Reservas con causas heterogéneas, impairment neto que oculta movimientos opuestos, perímetro de ISA ≠ atribución económica, operaciones intragrupo que desaparecen al consolidar |
| R2 — Observado ≠ normalizado ≠ proyectado | `SOBREVIVE — FUERTEMENTE REFORZADA` | `PATRÓN OBSERVADO EN TRES CASOS` | FEPC: CFO observado de un período incluye cobros originados en otro período |
| R3 — Los supuestos están relacionados | `SOBREVIVE, PERO PARECE INCOMPLETO` | `PATRÓN OBSERVADO EN TRES CASOS` + `DISEÑO INSUFICIENTEMENTE VALIDADO` | Cadenas adicionales (reposición→CAPEX→agotamiento→horizonte; abandono→flujo terminal); no se rediseña `assumption_relations` |
| R4 — Descomposición según dimensión económica relevante | `SOBREVIVE — FUERTEMENTE REFORZADA` (formulación base); extensión a cifras netas/movimientos `A VALIDAR EN CASOS FUTUROS` | `PATRÓN OBSERVADO EN TRES CASOS` (formulación base) | No se cambia la formulación de R4; se registra evidencia de que la descomposición puede aplicar también a cifras netas (impairment) y movimientos (reservas), no solo a partidas — ver §2 y Candidato A |
| R5 — Estado de conocimiento explícito | `SOBREVIVE — SE PROFUNDIZA` | — | `DESCONOCIDO` puede significar "no tengo el dato" o "tengo el dato pero no sé interpretarlo económicamente sin sus componentes"; no se crea un enum nuevo |
| R6 — Método de determinación (scope/purpose) | `SOBREVIVE — INCOMPLETO` | — | `scope` → `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS`; `purpose` permanece `PREGUNTA CONCEPTUAL ABIERTA — EVIDENCIA MENOR QUE SCOPE`; no se fusionan |
| R7 — Drivers específicos por empresa | `SOBREVIVE — FUERTEMENTE REFORZADA` | `PATRÓN OBSERVADO EN TRES CASOS` | Reservas/agotamiento, FEPC, perímetro con NCI, abandono — drivers sin precedente en Tecnoglass ni Terpel |
| R8 — Detectar incoherencias sin decidir | `SOBREVIVE — FUERTEMENTE REFORZADA` | `PATRÓN OBSERVADO EN TRES CASOS` | Nuevos ejemplos: reservas sin driver identificado, impairment neto sin desagregar, CAPEX sin explicación operacional, proyección sin atribución a NCI |

## 2. A. Elementos que sobreviven sin cambios relevantes

- Clasificación epistémica (§5.1 del Expediente) — Ecopetrol la usa de
  principio a fin (`HECHO DOCUMENTADO`, `DESCONOCIDO`, `HIPÓTESIS`) sin
  necesitar un valor nuevo.
- Tres capas de valor coexistentes (reportado/normalizado/proyectado) —
  el FEPC es un caso de uso adicional, no un cambio de estructura.
- `driver` como texto libre en `projection_hypotheses` — reservas,
  FEPC, abandono y perímetro/NCI se representan igual de bien como texto
  libre que backlog (Tecnoglass) o los negocios de Terpel.
- La regla de que no se crea una entidad universal `contracts` ni un
  tratamiento universal de leases (confirmada en Terpel §9, ahora con
  una tercera instancia: contratos ANH, concesiones ISA, servidumbres).
- La prohibición de tratar una normalización o driver de un caso como
  default aplicable a otro caso.

## 3. B. Elementos reforzados

- **R1, R2, R7, R8**: pasan de "reforzada con dos casos" a `PATRÓN
  OBSERVADO EN TRES CASOS` — ver matriz §1. Es el nivel de evidencia más
  alto que Velarix ha registrado hasta ahora para estas cuatro reglas,
  sin que eso las convierta en ley universal.
- **`account_components` / R4 (formulación base)**: la necesidad de
  descomposición según la dimensión económica relevante (contable,
  negocio, producto, canal, geografía, contrato) reaparece por tercera
  vez, ahora con evidencia de negocio (E&P/transporte/refinación/
  gas-transición/ISA), consistente con la dimensión "negocio" ya vista
  en Terpel.
- **`scope`**: pasa de "hueco conceptual sólido, reforzado por Terpel"
  (Caso 02) a `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES
  CASOS`. Ecopetrol es el caso con la evidencia más fuerte hasta ahora:
  un supuesto puede aplicar al grupo consolidado, a un negocio, o a la
  porción atribuible a Ecopetrol después de NCI — tres alcances
  distintos y materialmente diferentes en el mismo caso.

## 4. C. Elementos que parecen insuficientes

- **`assumption_relations`**: sigue permitiendo solo relaciones simples
  entre dos elementos. Ecopetrol aporta una tercera instancia de cadenas
  potencialmente más largas (reposición→CAPEX→agotamiento→horizonte;
  abandono→flujo terminal), consistente con lo visto en Terpel
  (precio→inventario→decalaje→margen). **No se rediseña en este
  reporte** — la pregunta de si necesita representar dirección,
  mecanismo o cadenas de más de dos elementos sigue abierta, ahora con
  evidencia de tres casos independientes en la misma dirección.
- **R5 (estado de conocimiento explícito)**: el enum actual (§5.1 del
  Expediente) sigue siendo suficiente para marcar algo como
  `desconocido`, pero Ecopetrol muestra un matiz no capturado
  explícitamente: "conozco la cifra, pero no sé interpretarla
  económicamente sin ver sus componentes" (impairment neto ≈0). No se
  concluye que haga falta un valor nuevo — se registra como matiz a
  vigilar en casos futuros.

## 5. D. Nuevas necesidades conceptuales

Ninguna de las siguientes se diseña ni se implementa en este reporte:

- **Extensión candidata de R4** (Candidato A relacionado): la
  descomposición puede ser necesaria no solo en partidas/cuentas
  materiales, sino en **cifras netas** y en **movimientos agregados**
  (ver §6).
- **Atribución temporal / corte de conocimiento** (Candidato C, §6):
  distinguir fecha de valoración, período financiero analizado, fecha
  económica del hecho, fecha de reconocimiento, fecha de caja y fecha en
  que la información se conoció. No apareció con esta claridad en
  Tecnoglass ni en Terpel.

## 6. E. Candidatos que requieren más casos

### Candidato A — Neteo

*"El neteo puede destruir información económica relevante."*

Evidencia: impairment neto ≈0 de 2025 en Ecopetrol, que agregaba una
reversión de ≈COP 0,3 billones en transporte/logística y un deterioro de
≈COP 0,3 billones en E&P (`CASO-03-ECOPETROL-V0.md` §11, §18).

**Estado: `EVIDENCIA FUERTE EN UN CASO — VALIDAR EN CASOS FUTUROS`.** No
se convierte en arquitectura, campo, validación automática ni entidad.

### Candidato B — Ciclo de vida económico

*"Algunas variables o activos tienen un ciclo de vida económico que
importa para la valoración."*

Etapas observadas conceptualmente (no una taxonomía cerrada):
origen/inversión, operación, mantenimiento/reposición,
agotamiento/vencimiento, cierre/abandono. Evidencia: provisión de
abandono/desmantelamiento y patrón reposición-agotamiento de reservas
(`CASO-03-ECOPETROL-V0.md` §8, §12, §18).

**Estado: `EVIDENCIA FUERTE EN UN CASO — VALIDAR EN CASOS FUTUROS`.**
**No se crea `economic_lifecycle`. No se crea tabla.**

### Candidato C — Atribución temporal / corte de conocimiento

La fecha de una cifra, la fecha económica del hecho que la origina y la
fecha en que la información estuvo disponible pueden ser distintas
entre sí (`CASO-03-ECOPETROL-V0.md` §9, §16, §18).

**Estado: `NUEVA PREGUNTA METODOLÓGICA — REQUIERE MÁS CASOS Y POSTERIOR
VALIDACIÓN EXPERTA`.** **No se crean campos ni `economic_period`.**

Ninguno de los tres candidatos se numera como R9, R10 o R11 — son
candidatos, no reglas transversales todavía.

## 7. F. Problemas demostrados sin solución general

### Comparabilidad / perímetro histórico

**Antes de este caso** (Caso 02, `REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
§3 de la carpeta `02-terpel`):

`EVIDENCIA INSUFICIENTE PARA DISEÑAR SOLUCIÓN — VALIDAR EN CASOS
FUTUROS`.

**Después de Ecopetrol**:

`PROBLEMA DEMOSTRADO; EVIDENCIA INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN
GENERAL.`

**Razón del cambio de estado**: Terpel solo sugería, sin evidencia
cuantificada, que adquisiciones/reclasificaciones/cambios de
consolidación *podrían* afectar comparabilidad. Ecopetrol aporta
evidencia directa y concreta: ISA consolidada al 100% con solo ≈51,4% de
control económico, intereses no controladores materiales, y deuda
material atribuible parcialmente a terceros (`CASO-03-ECOPETROL-V0.md`
§13). Esto convierte la hipótesis en un problema real y demostrado —
**pero no aporta, por sí solo, evidencia suficiente para diseñar una
solución general** aplicable a cualquier estructura de grupo. **No se
crea `case_perimeter` ni ninguna tabla o schema.**

## 8. G. Elementos que NO deben implementarse todavía

Sin cambios respecto a los Casos 01 y 02, reafirmado explícitamente por
Ecopetrol (`CASO-03-ECOPETROL-V0.md` §20, §22):

- `account_components`, `assumption_relations`, `coherence_flags` — se
  mantienen como concepto, ninguno se implementa.
- `scope`, `purpose` — necesidad conceptual reforzada (`scope`) o
  mantenida (`purpose`), sin tipo, enum ni estructura.
- `case_perimeter` — no se crea, pese al cambio de estado a "problema
  demostrado" (§7).
- `contracts` como entidad universal — no se crea, pese a la tercera
  instancia de vehículos jurídicos heterogéneos (ANH, concesiones,
  leases, servidumbres).
- `economic_period` — no se crea, pese al Candidato C.
- `economic_lifecycle` — no se crea, pese al Candidato B.
- Ningún grafo causal, motor de coherencia, ni motor automático de
  normalizaciones.
- Ninguna metodología de suma de partes (SOTP), múltiples DCF, múltiples
  WACC, múltiples g ni múltiples horizontes se declara obligatoria —
  Ecopetrol tensiona la idea de un único conjunto de drivers para todo
  el grupo, pero **no demuestra** que Velarix necesite ese enfoque como
  requisito metodológico (`CASO-03-ECOPETROL-V0.md` §20).

## 9. Resumen de disposición final

- **Incorporado como refuerzo transversal, sin cambio de especificación**:
  R1, R2, R7, R8 (`PATRÓN OBSERVADO EN TRES CASOS`); R4 en su formulación
  base.
- **Incorporado como necesidad conceptual reforzada, sin implementar**:
  `scope` (evidencia fuerte); comparabilidad/perímetro (pasa a "problema
  demostrado").
- **Mantenido sin cambio, con evidencia menor**: `purpose`.
- **Registrado como candidato nuevo, sin arquitectura**: neteo (A), ciclo
  de vida económico (B), atribución temporal/corte de conocimiento (C).
- **Ningún valor numérico de Ecopetrol** (reservas, reposición, vida
  media, impairment, saldo FEPC, cobros FEPC, porcentaje de control de
  ISA) se incorporó como default, benchmark ni referencia metodológica
  de Velarix.
- **Ningún negocio ni driver específico de Ecopetrol** (E&P, transporte,
  refinación, gas/transición, ISA) se declaró requisito universal para
  otras empresas.
- **Ninguna de las ocho reglas R1–R8** se declara completa, cerrada ni
  definitiva por haber sobrevivido a tres casos.

## 10. Qué sigue

1. Un eventual Caso 04 (empresa con una cuarta economía distinta, no
   analizado en esta tarea) ayudaría a: confirmar si `PATRÓN OBSERVADO EN
   TRES CASOS` (R1, R2, R7, R8) se sostiene con un cuarto punto de dato
   independiente; aportar más evidencia sobre los candidatos A (neteo),
   B (ciclo de vida) y C (atribución temporal); y ayudar a decidir si
   comparabilidad/perímetro puede pasar de "problema demostrado" a
   "evidencia suficiente para diseñar una solución general".
2. Ninguno de los cambios de este reporte autoriza implementación — sigue
   pendiente autorización explícita y separada del fundador
   (`Negocio_Velarix_v4.2.md` §19, regla 19).
3. Las preguntas metodológicas de `CASO-03-ECOPETROL-V0.md` §19
   (scope, purpose, cadenas causales de `assumption_relations`, criterio
   de estado estable con obligaciones de abandono, comparabilidad/
   perímetro, neteo, ciclo de vida, atribución temporal) quedan como
   agenda concreta para la próxima conversación con un revisor/experto
   financiero — no como ejercicio abstracto, sino con evidencia real de
   tres casos independientes detrás.
