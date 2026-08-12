# Reporte de contraste — Caso 04 (Grupo Éxito) vs. `EXPEDIENTE-DE-VALORACION-V1.md`

**Fecha:** 2026-08-12
**Insumo:** `docs/velarix/casos/04-grupo-exito/CASO-04-GRUPO-EXITO-V0.md`
**Insumos previos:** `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`
y su reporte de contraste; `docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md`
y su reporte de contraste; `docs/velarix/casos/03-ecopetrol/CASO-03-ECOPETROL-V0.md`
y su reporte de contraste (mismas carpetas que cada caso).
**Objetivo:** determinar, con el Caso 04 como cuarto punto de dato
independiente, qué de lo observado o reforzado por Tecnoglass, Terpel y
Ecopetrol **sobrevive de forma transversal a los cuatro casos**, qué se
profundiza o cambia de forma, qué candidato sube o se mantiene de nivel
de evidencia, y qué necesidad **nueva** aparece que el Expediente V1 (ya
actualizado por los Casos 01, 02 y 03) no representaba todavía.

**CASO 04 NO AUTORIZA IMPLEMENTACIÓN.** Este reporte de contraste, igual
que el caso que resume, es exclusivamente documental. Ningún cambio
descrito aquí autoriza crear tablas, migraciones, schemas, UI, motores,
Edge Functions, automatizaciones ni ningún otro cambio técnico. Solo
Nicolás/fundador puede autorizar implementación, de forma explícita y
separada. **Este reporte queda formalmente cerrado junto con el Caso
04 — Grupo Éxito**, tras revisión humana. El cierre es exclusivamente
del caso de estudio y de este contraste — **no cierra R1–R8, no cierra
la metodología, no congela el Expediente como arquitectura, y no cierra
ninguno de los Candidatos A–E**, que permanecen abiertos como
candidatos.

**Regla rectora de este reporte**: cuatro casos muestran patrones más
resistentes; cuatro casos no crean leyes universales. Con un cuarto
caso, cuando la misma conclusión reaparece de forma transversal e
idéntica en Tecnoglass, Terpel, Ecopetrol y Grupo Éxito, se documenta
prudentemente como `PATRÓN OBSERVADO EN CUATRO CASOS` — **nunca** como
`CONFIRMADO POR CUATRO CASOS`, y nunca como ley universal. Para
elementos respaldados solo por dos casos, o por un solo caso, este
reporte lo indica explícitamente como tal.

**Clasificaciones usadas:** `PATRÓN OBSERVADO EN CUATRO CASOS`
(evidencia transversal e independiente en los cuatro casos), `SOBREVIVE
— (SE PROFUNDIZA / INCOMPLETO / MUY FUERTEMENTE REFORZADA)` (la regla
reaparece, con distinto grado de refuerzo o de diseño pendiente),
`PROBLEMA DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA TODAVÍA
INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN GENERAL` (comparabilidad/
perímetro), `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES
CASOS` (`scope`), `NECESIDAD CONCEPTUAL RESPALDADA POR MÚLTIPLES CASOS,
AÚN MENOS MADURA QUE SCOPE` (`purpose`, elevado en este caso),
`EVIDENCIA FUERTE EN [CASO] — VALIDAR EN CASOS FUTUROS` (candidatos con
evidencia de un solo caso), `PATRÓN OBSERVADO EN DOS CASOS DE NATURALEZA
ECONÓMICA MUY DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA` (Candidato B),
`PROBLEMA METODOLÓGICO RESPALDADO POR MÚLTIPLES CASOS — REQUIERE DEFINIR
PRINCIPIOS ANTES DE DISEÑAR REPRESENTACIÓN` (Candidato C).

---

## 1. Matriz de contraste formal R1–R8

Ver detalle completo con evidencia en `CASO-04-GRUPO-EXITO-V0.md` §20.
Resumen:

| Regla | Resultado Caso 04 | Estado transversal | Nota |
|---|---|---|---|
| R1 — Contabilidad ≠ economía | `SOBREVIVE — MUY FUERTEMENTE REFORZADA` | `PATRÓN OBSERVADO EN CUATRO CASOS` | Inmobiliario (book vs. fair value), supplier financing, inventarios heterogéneos, perímetro con NCI. Cautela: la contabilidad sigue siendo evidencia fundamental, no información inferior a reemplazar |
| R2 — Observado ≠ normalizado ≠ proyectado | `SOBREVIVE — FUERTEMENTE REFORZADA` | `PATRÓN OBSERVADO EN CUATRO CASOS` | NWC observado no determina mecanismo futuro; cifra inmobiliaria no determina ajuste de valoración; supplier financing requiere interpretación previa |
| R3 — Los supuestos están relacionados | `SOBREVIVE — DISEÑO TODAVÍA INSUFICIENTEMENTE VALIDADO` | `PATRÓN OBSERVADO EN CUATRO CASOS` + `DISEÑO INSUFICIENTEMENTE VALIDADO` | Cadenas nuevas (ventas→compras→inventario→proveedores→margen→caja; tiendas→leases→ventas→CAPEX); evidencia de causalidad inversa y retroalimentación; no se rediseña `assumption_relations` |
| R4 — Descomposición según dimensión económica relevante | `SOBREVIVE — REFORZADA` (formulación base sin cambios); extensión a cifras netas/movimientos sigue `A VALIDAR EN CASOS FUTUROS` | `PATRÓN OBSERVADO EN CUATRO CASOS` (formulación base) | Nueva cautela: más granularidad no es automáticamente mejor análisis — depende de comportamiento económico, materialidad y propósito. No se crea enum universal ni se hace obligatorio `account_components` |
| R5 — Estado de conocimiento explícito | `SOBREVIVE — SE PROFUNDIZA` | — | Supplier financing: conocer la cifra, clasificación y contrato no equivale a conocer la interpretación económica correcta; no se crea enum nuevo |
| R6 — Método de determinación (scope/purpose) | `SOBREVIVE — INCOMPLETO` | — | `scope` se mantiene en su nivel del Caso 03 (sin evidencia nueva que lo eleve); `purpose` sube a `NECESIDAD CONCEPTUAL RESPALDADA POR MÚLTIPLES CASOS, AÚN MENOS MADURA QUE SCOPE` (tasas de impairment, supuestos de UGE, fair value inmobiliario); no se fusionan |
| R7 — Drivers específicos por empresa | `SOBREVIVE — FUERTEMENTE REFORZADA` | `PATRÓN OBSERVADO EN CUATRO CASOS` | Metros cuadrados, productividad por tienda, rotación, ocupación, renta. Cautela: driver específico no significa máxima granularidad disponible |
| R8 — Detectar incoherencias sin decidir | `SOBREVIVE — MUY FUERTEMENTE REFORZADA` | `PATRÓN OBSERVADO EN CUATRO CASOS` | Nuevos ejemplos: supplier financing sin clasificar, diferencias de fair value sin explicar, cambio de perímetro de Argentina; el experto sigue decidiendo, no el sistema |

## 2. A. Áreas suficientemente cubiertas conceptualmente

Sin cambios estructurales — Grupo Éxito refuerza que lo existente sigue
siendo suficiente:

- `company_context` — suficiente para registrar el contexto cualitativo
  multinegocio/multigeografía de Grupo Éxito.
- `account_notes` (clasificación contable vs. interpretación económica) —
  suficiente para inventarios, inmobiliario, y supplier financing.
- `normalizations` (reportado/normalizado/proyectado coexistentes) —
  suficiente para el caso de la venta de inventario de proyectos
  inmobiliarios, sin necesitar normalización automática.
- Drivers específicos por empresa (`projection_hypotheses.driver` como
  texto libre) — suficiente para metros cuadrados, productividad por
  tienda, rotación, ocupación, renta.
- Supplier financing como investigación no decisoria — el Expediente ya
  permite registrar la pregunta vía `case_assumptions`/`account_notes`
  con estado epistémico apropiado, sin necesitar una entidad nueva; esta
  es ya la tercera instancia de la misma familia de pregunta
  (Tecnoglass, Terpel, Grupo Éxito).
- Leases como investigación con decisión humana — mismo patrón: el
  Expediente permite documentar el problema sin imponer un tratamiento
  universal.

## 3. B. Cobertura parcial

- **`account_components`**: útil, con la necesidad observada por cuarta
  vez (inventarios §10, ingresos §13 de Grupo Éxito), pero Grupo Éxito
  aporta una cautela
  que no estaba explícita antes: **debe evitar sobregranularidad** — no
  toda partida material necesita descomponerse solo porque puede
  descomponerse; la descomposición depende de comportamiento económico,
  materialidad y propósito analítico. No se cambia la entidad ni se
  agrega esta cautela como regla obligatoria del Expediente en esta
  actualización — se registra como matiz de uso.
- **`assumption_relations`**: problema reconocido desde el Caso 01,
  diseño todavía incompleto. Grupo Éxito aporta evidencia de causalidad
  inversa y retroalimentación, no solo de cadenas más largas (ya visto en
  Terpel y Ecopetrol) — refuerza la necesidad sin resolver el diseño.
- **`scope`**: necesidad conceptual fuerte (mantenida en el nivel
  alcanzado en el Caso 03), representación final pendiente. Grupo Éxito
  no aportó evidencia independiente nueva que lo eleve más allá de lo ya
  registrado.
- **`purpose`**: necesidad ahora respaldada por múltiples casos —
  **sube de nivel** en este reporte, de `PREGUNTA CONCEPTUAL ABIERTA —
  EVIDENCIA MENOR QUE SCOPE` a `NECESIDAD CONCEPTUAL RESPALDADA POR
  MÚLTIPLES CASOS, AÚN MENOS MADURA QUE SCOPE` — pero todavía menos
  madura que `scope`. Evidencia: tasas de descuento para impairment,
  supuestos de UGE, metodologías de fair value inmobiliario, todos
  determinados con un propósito (información financiera, prueba de
  deterioro) que no es automáticamente el propósito de una valoración
  profesional de equity.
- **Candidato E (base de medición/régimen monetario)**: puede
  documentarse narrativamente en el Expediente actual (vía
  `company_context`, `account_notes`, `case_assumptions`), no todavía de
  forma estructurada — no se crea `measurement_basis` ni enum monetario.

## 4. C. Huecos conceptuales/estructurales demostrados (sin diseñar solución)

**Importante**: "hueco estructural" **no significa "autorizar una
tabla"**. Significa que el Expediente puede contar el problema en texto,
pero todavía no existe una representación estructurada validada.

- **Perímetro / atribución económica** — reforzado por Grupo Éxito
  (estructuras "Viva" con NCI de 73,99%, JVs al 50% fuera de
  consolidación línea por línea, cambio de perímetro de Argentina
  reconocido por la propia compañía en 2T26). Ver §5 (comparabilidad/
  perímetro) para el cambio de estado formal.
- **Candidato B — ciclo de vida económico** — sube de "evidencia fuerte
  en un caso" (Ecopetrol) a `PATRÓN OBSERVADO EN DOS CASOS DE NATURALEZA
  ECONÓMICA MUY DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA` (Ecopetrol:
  activos E&P con agotamiento geológico; Grupo Éxito: tiendas físicas con
  ciclo de apertura/remodelación/cierre). Sigue sin `economic_lifecycle`
  ni tabla.
- **Candidato C — atribución temporal / corte de conocimiento** — sube
  de "nueva pregunta metodológica, requiere más casos" a `PROBLEMA
  METODOLÓGICO RESPALDADO POR MÚLTIPLES CASOS — REQUIERE DEFINIR
  PRINCIPIOS ANTES DE DISEÑAR REPRESENTACIÓN`. Evidencia
  particularmente fuerte: la propia compañía declara en su informe de
  2T26 (información posterior al corte FY2025) que un cambio de
  perímetro limita la comparabilidad frente al año anterior. Sigue sin
  `economic_period` ni campos nuevos de fecha.
- **Candidato D — derechos económicos / propiedad dinámica** — nuevo,
  registrado por primera vez en este caso (opción de venta sobre NCI de
  Grupo Disco Uruguay). Evidencia de un solo caso — `EVIDENCIA FUERTE EN
  GRUPO ÉXITO — VALIDAR EN CASOS FUTUROS`. Sin entidad, tabla, campos, ni
  modelo automático de valoración de opciones.

## 5. Comparabilidad / perímetro — cambio de estado

**Antes de este caso** (Caso 03, `CASO-03-ECOPETROL-V0.md` §13):

`PROBLEMA DEMOSTRADO; EVIDENCIA INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN
GENERAL.`

**Después de Grupo Éxito**:

`PROBLEMA DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA TODAVÍA
INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN GENERAL.`

**Razón**: el problema ya no depende de una sola estructura (ISA dentro
de Ecopetrol) — reaparece, con mecanismos distintos, en una economía de
retail/inmobiliario completamente diferente (estructuras "Viva" con NCI
de 73,99%, JVs al 50%, y un cambio de perímetro de Argentina reconocido
explícitamente por la propia compañía como limitante de comparabilidad).
**Esto no aporta, por sí solo, evidencia suficiente para diseñar una
solución general.** No se crea `case_perimeter` ni ninguna tabla o
schema.

## 6. Candidato A — Neteo (sin elevación)

Este reporte deja explícito que el Caso 04 **no elevó** el Candidato A.
El material de trabajo de Grupo Éxito no incluyó un ejemplo directo y
material de una cifra neta que ocultara movimientos brutos de naturaleza
opuesta, comparable al impairment neto ≈0 de Ecopetrol. **Estado
mantenido: `EVIDENCIA FUERTE EN ECOPETROL — VALIDAR EN CASOS FUTUROS`.**
No se eleva a patrón de dos ni de cuatro casos.

## 7. Elementos que NO deben implementarse todavía

Sin cambios respecto a los Casos 01, 02 y 03, reafirmado explícitamente
por Grupo Éxito (`CASO-04-GRUPO-EXITO-V0.md` §31, §33):

- `account_components`, `assumption_relations`, `coherence_flags` — se
  mantienen como concepto, ninguno se implementa.
- `scope`, `purpose` — necesidad conceptual respaldada por múltiples
  casos en ambos casos, sin tipo, enum ni estructura.
- `case_perimeter` — no se crea, pese al cambio de estado a "problema
  demostrado en múltiples economías" (§5).
- `contracts` como entidad universal — no se crea.
- `economic_period` — no se crea, pese al refuerzo del Candidato C.
- `economic_lifecycle` — no se crea, pese al refuerzo del Candidato B.
- `measurement_basis` ni enum monetario — no se crean, pese al nuevo
  Candidato E.
- Ningún grafo causal, motor de coherencia, ni motor automático de
  normalizaciones.
- Ninguna metodología de suma de partes (SOTP), múltiples DCF, múltiples
  WACC, múltiples g ni múltiples horizontes se declara obligatoria.

## 8. Resumen de disposición final

- **Incorporado como refuerzo transversal, sin cambio de
  especificación**: R1, R2, R7, R8 (`PATRÓN OBSERVADO EN CUATRO CASOS`);
  R4 en su formulación base (`PATRÓN OBSERVADO EN CUATRO CASOS`); R3 en
  su núcleo conceptual —que existen relaciones materiales entre
  supuestos— también `PATRÓN OBSERVADO EN CUATRO CASOS`, aunque el
  diseño de `assumption_relations` sigue insuficientemente validado (ver
  matriz §1).
- **Incorporado como necesidad conceptual reforzada, sin implementar**:
  `purpose` (sube de nivel); comparabilidad/perímetro (pasa a "problema
  demostrado en múltiples economías").
- **Mantenido sin cambio de nivel**: `scope`; Candidato A (neteo).
- **Elevado con evidencia de un segundo caso**: Candidato B (ciclo de
  vida económico), Candidato C (atribución temporal/corte de
  conocimiento).
- **Registrado como candidato nuevo, sin arquitectura**: Candidato D
  (derechos económicos/propiedad dinámica), Candidato E (base de
  medición/régimen monetario).
- **Ningún valor numérico de Grupo Éxito** (inventarios, proveedores,
  leases, inmobiliario, CAPEX, participaciones NCI, cifras de
  fidelización) se incorporó como default, benchmark ni referencia
  metodológica de Velarix.
- **Ningún negocio ni driver específico de Grupo Éxito** (formatos de
  tienda, métricas de retail, estructura "Viva") se declaró requisito
  universal para otras empresas.
- **Ninguna de las ocho reglas R1–R8** se declara completa, cerrada ni
  definitiva por haber sobrevivido a cuatro casos.
- **La información posterior al corte (1T26, 2T26)** se incorporó
  únicamente como refuerzo de los Candidatos C y de comparabilidad/
  perímetro — no como parte del período financiero base FY2025, y sin
  reescribir retroactivamente el perímetro de consolidación al 31-dic-
  2025.

## 9. Conclusión de disposición del Expediente

Consistente con `CASO-04-GRUPO-EXITO-V0.md` §32: **el Expediente V1
sobrevive conceptualmente al Caso 04, pero todavía no está listo para
congelarse como arquitectura.** Ninguno de los candidatos (A–E) se
convierte en requisito de producto en este reporte. El Expediente no se
declara listo para implementación.

## 10. Qué sigue

1. Un eventual Caso 05 (empresa con una quinta economía distinta, no
   analizado en esta tarea) ayudaría a: evaluar si el patrón `PATRÓN
   OBSERVADO EN CUATRO CASOS` (R1, R2, R3 en su núcleo, R4 base, R7, R8)
   se sostiene con un quinto punto de dato independiente; aportar una
   tercera instancia a los
   Candidatos B y C (que ya tienen dos); aportar una segunda instancia a
   los Candidatos D y E (que hoy tienen solo una); y ayudar a decidir si
   comparabilidad/perímetro puede pasar de "problema demostrado en
   múltiples economías" a "evidencia suficiente para diseñar una
   solución general".
2. Ninguno de los cambios de este reporte autoriza implementación — sigue
   pendiente autorización explícita y separada del fundador
   (`Negocio_Velarix_v4.2.md` §19, regla 19).
3. Este reporte y el Caso 04 quedan **formalmente cerrados y
   congelados**, tras esta revisión humana (ver encabezado). El cierre
   no afecta R1–R8, la metodología, los Bloques 1B/1C, el Expediente
   como arquitectura, ni los Candidatos A–E, que permanecen abiertos.
4. Las preguntas metodológicas de `CASO-04-GRUPO-EXITO-V0.md` §29
   (scope, purpose, `assumption_relations`, supplier financing, leases
   con doble rol arrendatario/arrendador, book vs. fair value
   inmobiliario, comparabilidad/perímetro, y los cinco candidatos)
   quedan como agenda concreta para la próxima conversación con un
   revisor/experto financiero — no como ejercicio abstracto, sino con
   evidencia real de cuatro casos independientes detrás.
