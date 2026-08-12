# Reporte de contraste — Caso 08 (Munich Re) vs. `EXPEDIENTE-DE-VALORACION-V1.md`

**Fecha:** 2026-08-12
**Insumo:** `docs/velarix/casos/08-munich-re/CASO-08-MUNICH-RE-V0.md`
**Insumos previos:** `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`
y su reporte de contraste; `docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md`
y su reporte de contraste; `docs/velarix/casos/03-ecopetrol/CASO-03-ECOPETROL-V0.md`
y su reporte de contraste; `docs/velarix/casos/04-grupo-exito/CASO-04-GRUPO-EXITO-V0.md`
y su reporte de contraste; `docs/velarix/casos/05-isa/CASO-05-ISA-V0.md`
y su reporte de contraste; `docs/velarix/casos/06-bancolombia/CASO-06-BANCOLOMBIA-V0.md`
y su reporte de contraste; `docs/velarix/casos/07-goldman-sachs/CASO-07-GOLDMAN-SACHS-V0.md`
y su reporte de contraste (mismas carpetas que cada caso).
**Objetivo:** determinar, con el Caso 08 como octavo y último punto de
dato de la primera batería — la tercera institución financiera
prudencialmente regulada, deliberadamente elegida para evitar que dos
economías bancarias (Bancolombia, Goldman Sachs) agoten lo que Velarix
puede aprender de instituciones financieras reguladas — qué de lo
observado o reforzado por Tecnoglass, Terpel, Ecopetrol, Grupo Éxito,
ISA, Bancolombia y Goldman Sachs **sobrevive de forma transversal a los
ocho casos**, qué se profundiza o cambia de forma, qué candidato sube,
se mantiene, o recibe evidencia insuficiente, y qué necesidad **nueva**
aparece que el Expediente V1 (ya actualizado por los Casos 01–07) no
representaba todavía.

**CASO 08 NO AUTORIZA IMPLEMENTACIÓN.** Este reporte de contraste, igual
que el caso que resume, es exclusivamente documental. Ningún cambio
descrito aquí autoriza crear tablas, migraciones, schemas, UI, motores,
Edge Functions, automatizaciones ni ningún otro cambio técnico. Solo
Nicolás/fundador puede autorizar implementación, de forma explícita y
separada. **CASO 08 — MUNICH RE: FORMALMENTE CERRADO Y CONGELADO.** Este
reporte queda formalmente cerrado junto con el caso, tras autorización
explícita del fundador en esta misma ejecución. El cierre es
exclusivamente del caso de estudio y de este contraste — **no cierra
R1–R8, no cierra la metodología, no cierra los Bloques 1B ni 1C, no
congela el Expediente como arquitectura, y no cierra ninguno de los
Candidatos A–G ni las observaciones de compensación (Goldman) y de
exposición/retención/capital (Munich)**, que permanecen abiertos.

**Regla rectora de este reporte**: ocho casos muestran patrones más
resistentes; ocho casos no crean leyes universales. Un caso puede
reforzar, debilitar, refutar, resultar no material, producir evidencia
insuficiente, o revelar problemas nuevos — este reporte registra los
cinco resultados posibles con la misma disciplina.

**Clasificaciones usadas:** `PATRÓN OBSERVADO EN OCHO CASOS` (evidencia
transversal e independiente en los ocho casos), `SOBREVIVE — SE
PROFUNDIZA/INCOMPLETO`, `PROBLEMA MUY FUERTEMENTE DEMOSTRADO EN
MÚLTIPLES ECONOMÍAS` (comparabilidad/perímetro), `NECESIDAD CONCEPTUAL
MUY FUERTEMENTE RESPALDADA` (`scope` y `purpose`), `EVIDENCIA
INSUFICIENTE` (donde Munich Re no aportó evidencia suficiente para
elevar o confirmar algo), `EVIDENCIA FUERTE INDEPENDIENTE` /
`CANDIDATO F` / `CANDIDATO G` (elevaciones metodológicas/documentales de
este caso).

---

## 1. Matriz de contraste formal R1–R8

Ver detalle completo con evidencia en `CASO-08-MUNICH-RE-V0.md` §20.
Resumen:

| Regla | Resultado Caso 08 | Estado transversal | Nota |
|---|---|---|---|
| R1 — Contabilidad ≠ economía | `PATRÓN OBSERVADO EN OCHO CASOS` | `PATRÓN OBSERVADO EN OCHO CASOS` | Insurance liabilities, CSM, reinsurance held, investments — clasificación contable correcta que no determina, por sí sola, su interpretación para valoración |
| R2 — Observado ≠ normalizado ≠ proyectado | `PATRÓN OBSERVADO EN OCHO CASOS` | `PATRÓN OBSERVADO EN OCHO CASOS` | Cat losses observadas ≠ nivel through-the-cycle; reserve development ≠ automáticamente recurrente ni extraordinario; nunca sobrescribir lo reportado |
| R3 — Los supuestos están relacionados | núcleo `PATRÓN OBSERVADO EN OCHO CASOS`; representación general `SIGUE INSUFICIENTEMENTE VALIDADA` | `PATRÓN OBSERVADO EN OCHO CASOS` + `REPRESENTACIÓN GENERAL INSUFICIENTEMENTE VALIDADA` | Feedback, relaciones condicionales, mitigación, restricciones, circularidad entre pricing/claims/capital/inversiones/solvencia/retrocession; cautela contra grafo causal ingenuo A → B |
| R4 — Descomposición según dimensión económica relevante | `PATRÓN OBSERVADO EN OCHO CASOS` | `PATRÓN OBSERVADO EN OCHO CASOS` | Segmento, línea, accident year, gross/net, cat/man-made, moneda, duración, measurement model, riesgo; más granularidad no es automáticamente mejor análisis |
| R5 — Estado de conocimiento explícito | `SOBREVIVE Y SE PROFUNDIZA` | — | Claims, ultimate losses, reserve development, risk adjustment: cifra conocida y documentada con desenlace económico todavía incierto; no se crea enum nuevo |
| R6 — Método de determinación (scope/purpose) | `scope` y `purpose`: `NECESIDAD CONCEPTUAL MUY FUERTEMENTE RESPALDADA` | — | IFRS y Solvency II pueden representar el mismo Grupo con distintos propósitos, bases de medición y tratamientos de perímetro; scope ≠ purpose, no se fusionan |
| R7 — Drivers específicos por empresa | `PATRÓN OBSERVADO EN OCHO CASOS` | `PATRÓN OBSERVADO EN OCHO CASOS` | Loss ratio, expense ratio, combined ratio, cat losses, reserve development, pricing, retention, retrocession, CSM release, investment yield, solvencia, underwriting capacity — sin catálogo universal |
| R8 — Detectar incoherencias sin decidir | `PATRÓN OBSERVADO EN OCHO CASOS` | `PATRÓN OBSERVADO EN OCHO CASOS` | Velarix detecta desviaciones/ratios/reserve development/cambios de solvencia o CSM; el experto decide normalización, sostenibilidad, método, capital distribuible y supuestos |

## 2. Qué sobrevivió sin cambio material

- Las ocho reglas R1–R8 en su formulación conceptual base — ninguna fue
  refutada por Munich Re.
- La regla de normalizaciones (reportado → posible ajuste → motivo →
  evidencia → recurrente/no recurrente → importe propuesto →
  responsable → aprobación → importe normalizado, sin sobrescribir lo
  reportado).
- La prohibición de crear `case_perimeter`, `economic_period`,
  `economic_lifecycle`, `measurement_basis`, `availability`,
  `restricted_asset`, `fungibility`, `capital_bridge`,
  `distributable_capital`, `netting`, modelo de collateral, IFRS17
  engine, CSM engine, risk-adjustment engine, reserves engine, ni
  ninguna estructura técnica nueva.
- Las Decisiones 1, 2 y 4 del Bloque 1B — se profundizan
  conceptualmente, sin cambiar.
- La regla de que ningún caso, por sí solo, autoriza implementación.
- El estado del Candidato D (evidencia fuerte en Grupo Éxito, sin
  evidencia nueva en tres casos consecutivos: ISA, Bancolombia, Goldman
  Sachs — ahora cuatro con Munich Re).
- El estado de supplier financing y de leases.

## 3. Qué se reforzó o elevó

- **R1, R2, R4 (base), R7, R8**: se mantienen en `PATRÓN OBSERVADO EN
  OCHO CASOS` — el nivel de evidencia más alto de la serie, ahora con un
  octavo punto de dato.
- **R3 (núcleo)**: también `PATRÓN OBSERVADO EN OCHO CASOS`, con
  evidencia adicional de circularidad y mitigación propias de la
  economía aseguradora/reaseguradora.
- **`scope` y `purpose`**: ambos alcanzan `NECESIDAD CONCEPTUAL MUY
  FUERTEMENTE RESPALDADA` — el caso más fuerte hasta ahora de que el
  mismo Grupo puede requerir representaciones distintas según el
  propósito (IFRS vs. Solvency II).
- **Comparabilidad/perímetro**: sube a `PROBLEMA MUY FUERTEMENTE
  DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; MUNICH RE APORTA EVIDENCIA DIRECTA
  DE QUE UN MISMO GRUPO PUEDE REQUERIR PERÍMETROS Y MÉTODOS DE
  REPRESENTACIÓN DIFERENTES SEGÚN EL PROPÓSITO`.
- **Candidato A (neteo)**: sube a `EVIDENCIA FUERTE INDEPENDIENTE EN
  ECOPETROL, GOLDMAN SACHS Y MUNICH RE`, con la advertencia adicional de
  que "neteo" es un nombre demasiado estrecho — Munich Re aporta la
  cadena bruto → compensación jurídica → collateral →
  reinsurance/retrocession → mitigantes → exposición económica.
- **Candidato B (ciclo de vida)**: sube a seis casos.
- **Candidato C (atribución temporal)**: sube a `PROBLEMA METODOLÓGICO
  MUY FUERTEMENTE RESPALDADO POR MÚLTIPLES CASOS`.
- **Candidato E (base de medición/régimen monetario)**: la hipótesis de
  que son fenómenos distintos queda `MUY FUERTEMENTE RESPALDADA`.
- **ISA-F → Candidato F**: elevado formalmente — `CANDIDATO F —
  DISPONIBILIDAD ECONÓMICA DE RECURSOS — EVIDENCIA TRANSVERSAL
  FUERTEMENTE REFORZADA EN CUATRO ECONOMÍAS RADICALMENTE DISTINTAS: ISA,
  BANCOLOMBIA, GOLDMAN SACHS Y MUNICH RE`.
- **Bancolombia-G → Candidato G**: elevado formalmente — `CANDIDATO G —
  PUENTE CAPITAL / CAPACIDAD DE DISTRIBUCIÓN — PATRÓN OBSERVADO EN TRES
  INSTITUCIONES FINANCIERAS PRUDENCIALMENTE REGULADAS CON ECONOMÍAS
  MATERIALMENTE DISTINTAS`.

## 4. Qué quedó conceptualmente incompleto

- `assumption_relations`: el diseño sigue sin validar.
- `scope` y `purpose`: necesidad conceptual muy fuerte en ambos, sin
  diseño de tipo, enum ni estructura.
- Comparabilidad/perímetro: problema muy fuertemente demostrado, sin
  representación general disponible.
- Candidato A: evidencia fuerte independiente en tres casos, pero
  explícitamente sin elevación formal ni renombre — la formulación
  general (el puente bruto → mitigantes → exposición) queda pendiente
  para la consolidación.
- Candidato E: la hipótesis de separación se fortalece, sin dividirse
  todavía — pregunta explícita para la consolidación.
- Candidato F y Candidato G: elevados conceptualmente en este caso, sin
  ninguna estructura, campo, o enum.
- Selección de método de valoración para instituciones financieras
  prudencialmente reguladas: diez resultados documentados (§27 del
  caso), ninguno aprobado.
- La tensión WACC/Cost of Equity: documentada, no resuelta.
- Observación de compensación de Goldman y observación Munich de
  exposición/retención/capital: ambas `EVIDENCIA INSUFICIENTE`, sin
  candidato nuevo.

## 5. Qué supuestos financieros "universales" fueron refutados como universales

Munich Re aporta evidencia adicional para que este reporte registre que
**no deben asumirse como obligación universal**:

- Enterprise Value consolidado como arquitectura universal del grupo.
- Net debt convencional como métrica universal obligatoria a nivel
  consolidado.
- FCFF/WACC consolidado como default — sin que esto signifique que DCF
  no sirva para aseguradoras (DCF ≠ FCFF industrial).
- DDM literal basado solo en dividendos, como formulación suficiente de
  distribuciones potenciales.
- Un SOTP ingenuo que asuma que los segmentos IFRS son unidades
  obligatorias de valoración.
- Solvency ratio por encima del target como equivalente automático a
  capital distribuible.
- NWC industrial convencional como driver universal — sin que esto
  implique que sea irrelevante en todo `scope`.
- CAPEX contable como totalidad de la reinversión económica relevante.

**Ninguno de estos elementos se elimina de Velarix** — se documenta
únicamente que ninguno debe asumirse como default universal (ver
`CASO-08-MUNICH-RE-V0.md` §27).

## 6. Qué hallazgos son específicos de Munich Re / seguros-reaseguros

- La mecánica premium/claim/CSM/reserve de §8 del caso, sin equivalente
  exacto en los siete casos previos.
- IFRS 17 (General Measurement Model, Premium Allocation Approach,
  Variable Fee Approach, fulfilment cash flows, CSM, risk adjustment)
  (§9).
- El régimen dual IFRS/Solvency II y sus magnitudes distintas para el
  mismo Grupo (§10).
- Los diez resultados de métodos de valoración documentados
  específicamente para instituciones aseguradoras/reaseguradoras (§27).
- La observación Munich de exposición/retención/capital (§19).

## 7. Qué hallazgos son transversales (elevados en este caso)

- **Candidato F — Disponibilidad económica de recursos**: reconocimiento/
  propiedad/control de un recurso ≠ disponibilidad económica para
  cualquier propósito — ahora con evidencia en cuatro economías
  radicalmente distintas.
- **Candidato G — Puente capital / capacidad de distribución**: en
  instituciones financieras prudencialmente capitalizadas, la capacidad
  sostenible de distribución requiere un puente explícito entre
  resultado, capital disponible, capital requerido, crecimiento/riesgo,
  buffers, y decisiones de capital management — ahora con evidencia en
  tres instituciones financieras materialmente distintas.
- La distinción entre arquitectura universal del proceso de valoración y
  arquitectura financiera específica del método/economía (§7 del caso) —
  reforzada nuevamente, sin elevarse a regla formal (R9).

## 8. Qué evidencia fue insuficiente

- Candidato D (derechos económicos/propiedad dinámica): sin evidencia
  nueva en cuatro casos consecutivos (ISA, Bancolombia, Goldman Sachs,
  Munich Re).
- Observación de compensación de Goldman: sin evidencia nueva en Munich
  Re.
- Observación Munich de exposición/retención/capital: nueva, pero
  explícitamente insuficiente para candidato propio — puede terminar
  siendo parte del Candidato A, de R3, o del Candidato G.
- Supplier financing y leases: Munich Re no aportó evidencia material
  nueva en ninguno de los dos.

## 9. Los veintinueve puntos que deben viajar a la consolidación transversal

Consistente con `CASO-08-MUNICH-RE-V0.md` §30, este reporte confirma que
el Expediente **no** debe intentar resolver todavía ninguno de los
veintinueve puntos listados allí (R1–R8, `scope`/`purpose`,
comparabilidad/perímetro, Candidatos A–G, las dos observaciones
abiertas, supplier financing, leases, NWC, CAPEX/reinversión, deuda/net
debt, cash/liquidez/disponibilidad, capital, WACC, Cost of Equity,
Residual Income, FCFE, Potential Distributions, SOTP, horizonte, estado
estable, y la unidad económicamente adecuada de análisis) — todos
quedan clasificados como `NO DEBE RESOLVERSE TODAVÍA`, agenda explícita
para la consolidación transversal de los ocho casos, **no iniciada en
esta ejecución**.

## 10. Ajuste documental aplicado al Expediente

Consistente con la regla de cambio usada en los Casos 02–07 (modificar
el Expediente solo si el contraste demuestra una necesidad documental
clara o si corresponde continuidad metodológica del octavo caso), esta
ejecución distingue dos cosas:

**A. Elevaciones documentales explícitamente autorizadas por el
prompt de ejecución.** Dos elevaciones metodológicas/documentales — de
observación a candidato — fueron explícitamente instruidas y
sustentadas por evidencia de cuatro y tres casos respectivamente:
observación ISA-F → **Candidato F** (disponibilidad económica de
recursos), y observación Bancolombia-G → **Candidato G** (puente
capital/capacidad de distribución). Ninguna de las dos crea estructura,
campo, tabla, ni enum — son elevaciones de nomenclatura y estado
epistémico dentro de la prosa conceptual del Expediente.

**B. Actualizaciones de continuidad metodológica.** Además de esas dos
elevaciones, se actualizaron en el Expediente los estados ya existentes
por continuidad derivada del octavo caso: R1–R8 (§20 del caso), `scope`
y `purpose` (§5.2), comparabilidad/perímetro (§21), Candidatos A, B, C,
D, E (sin elevación formal salvo advertencias/refuerzos ya descritos), y
las dos nuevas observaciones (compensación de Goldman sin refuerzo;
observación Munich, nueva y explícitamente sin candidato). Estas
actualizaciones no son "un único ajuste" — siguen exactamente el mismo
patrón de continuidad usado en los Casos 02–07.

Ninguna de las dos categorías crea `netting`, `availability`,
`restricted_asset`, `fungibility`, `capital_bridge`,
`distributable_capital`, campos, ni enums (ver
`EXPEDIENTE-DE-VALORACION-V1.md` §28).

## 11. Qué NO está autorizado para implementación

Sin cambios respecto a los Casos 01–07, reafirmado explícitamente por
Munich Re (`CASO-08-MUNICH-RE-V0.md` §34, §37):

- `account_components`, `assumption_relations`, `coherence_flags`,
  `scope`, `purpose` — se mantienen como concepto, ninguno se
  implementa.
- `case_perimeter`, `economic_period`, `economic_lifecycle`,
  `measurement_basis`, `availability`, `restricted_asset`,
  `fungibility`, `netting`, modelo de collateral — no se crean.
- `regulatory_capital`, `capital_bridge`, `distributable_capital`,
  `bank_metrics`, `credit_risk`, PD, LGD, EAD, un motor de ECL, un enum
  de stages, campos de CET1, campos de RWA — no se crean.
- `cost_of_equity` field, `valuation_method`, un motor de Residual
  Income, un motor de DDM, un motor de FCFE, un motor de Potential
  Distributions, un motor de SOTP, un "bank mode", un "insurance mode",
  un enum de institución financiera, `industry_type`, un modelo de
  compensación, un IFRS17 engine, un CSM engine, un risk-adjustment
  engine, un reserves engine — no se crean.
- Ningún schema, tabla, migración, UI, Edge Function ni automatización.
- No se calculó WACC, Cost of Equity, g, FCFF, FCFE, ni ninguna
  valoración (EV, Equity Value, precio por acción, Residual Income,
  Potential Distributions, SOTP).
- No se seleccionó método final de valoración.
- No se crea "Candidato H" para la observación de compensación ni para
  la observación Munich.
- No se divide el Candidato E.
- No se cierran los Bloques 1B ni 1C.
- No se declara el Expediente listo para implementación.
- No se ejecuta la consolidación transversal de los ocho casos.
- No se convierte JPMorgan en Caso 09 de forma automática.

## 12. Resumen de disposición final

- **Incorporado como refuerzo transversal, sin cambio de
  especificación**: R1, R2, R4 (base), R7, R8, y R3 (núcleo) — todos
  `PATRÓN OBSERVADO EN OCHO CASOS`.
- **Incorporado como necesidad conceptual reforzada, sin implementar**:
  `scope`, `purpose` (ambos `NECESIDAD CONCEPTUAL MUY FUERTEMENTE
  RESPALDADA`); comparabilidad/perímetro (`PROBLEMA MUY FUERTEMENTE
  DEMOSTRADO`).
- **Mantenido sin cambio de nivel formal, con refuerzo**: Candidato A
  (evidencia fuerte independiente en tres casos, sin elevar); Candidato
  B (seis casos); Candidato C (`MUY FUERTEMENTE RESPALDADO`); Candidato
  E (hipótesis `MUY FUERTEMENTE RESPALDADA`, sin dividir).
- **Mantenido sin cambio, sin evidencia nueva**: Candidato D; supplier
  financing; leases.
- **Elevado formalmente en este caso**: Candidato F (disponibilidad
  económica de recursos, ex-ISA-F); Candidato G (puente capital/
  capacidad de distribución, ex-Bancolombia-G).
- **Registrado como observación sin candidato, sin arquitectura**:
  observación de compensación de Goldman (sin refuerzo); observación
  Munich de exposición/retención/capital (nueva).
- **Documentado como agenda de consolidación, sin resolver**: los
  veintinueve puntos de `CASO-08-MUNICH-RE-V0.md` §30 — método de
  valoración final, tensión WACC/Cost of Equity, y toda la síntesis en
  tres capas (§29 del caso).
- **Ninguna cifra de Munich Re** se incorporó como default, benchmark ni
  referencia metodológica de Velarix.
- **Ningún negocio, driver ni método de valoración específico de Munich
  Re** se declaró requisito universal para otras empresas o
  instituciones financieras.
- **Ninguna de las ocho reglas R1–R8** se declara completa, cerrada ni
  definitiva por haber sobrevivido a ocho casos.

## 13. Conclusión de disposición del Expediente

Consistente con `CASO-08-MUNICH-RE-V0.md` §35: el Expediente V1
sobrevive conceptualmente al Caso 08 — cierra la primera batería de ocho
casos reforzando su capa universal de proceso frente a la arquitectura
financiera específica del método y de la economía valorada — pero
**todavía no está listo para congelarse como arquitectura**. Las
elevaciones de Candidato F y Candidato G son documentales/metodológicas,
no arquitectónicas. El Expediente no se declara listo para
implementación.

## 14. Estado del caso

**El Caso 08 queda FORMALMENTE CERRADO Y CONGELADO** en esta ejecución,
tras autorización explícita de Nicolás/fundador. El cierre aplica
exclusivamente al caso de estudio y a este reporte de contraste — no
cierra R1–R8 como leyes universales, no cierra la metodología, no cierra
los Bloques 1B ni 1C, no congela el Expediente como arquitectura, no
cierra ninguno de los Candidatos A–G ni las observaciones de
compensación y de exposición/retención/capital, no selecciona método de
valoración final, y no autoriza ninguna implementación. El caso no debe
reabrirse salvo nueva evidencia concreta, una contradicción documental
real, un fallo concreto, un requerimiento nuevo, o una pregunta
explícita de Nicolás/fundador.

## 15. Qué sigue

1. **Siguiente etapa autorizada: consolidación transversal de los ocho
   casos** — revisando explícitamente los veintinueve puntos de
   `CASO-08-MUNICH-RE-V0.md` §30. **No se inicia en esta ejecución.**
2. **JPMorgan NO se convierte automáticamente en Caso 09.** Queda
   reservado únicamente si, después de la consolidación, aporta
   evidencia nueva que la justifique.
3. Ninguno de los cambios de este reporte autoriza implementación — sigue
   pendiente autorización explícita y separada del fundador.
4. Este reporte y el Caso 08 quedan **formalmente cerrados y
   congelados**, cerrando la primera batería de ocho casos. El cierre no
   afecta R1–R8, la metodología, los Bloques 1B/1C, el Expediente como
   arquitectura, ni los Candidatos A–G, que permanecen abiertos.
5. Las veintinueve preguntas de `CASO-08-MUNICH-RE-V0.md` §30 quedan
   como agenda concreta para la consolidación transversal y la próxima
   conversación con un revisor/experto financiero — no como ejercicio
   abstracto, sino con evidencia real de ocho casos independientes
   detrás.
