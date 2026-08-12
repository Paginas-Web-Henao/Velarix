# Reporte de contraste — Caso 06 (Grupo Cibest / Bancolombia) vs. `EXPEDIENTE-DE-VALORACION-V1.md`

**Fecha:** 2026-08-12
**Insumo:** `docs/velarix/casos/06-bancolombia/CASO-06-BANCOLOMBIA-V0.md`
**Insumos previos:** `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`
y su reporte de contraste; `docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md`
y su reporte de contraste; `docs/velarix/casos/03-ecopetrol/CASO-03-ECOPETROL-V0.md`
y su reporte de contraste; `docs/velarix/casos/04-grupo-exito/CASO-04-GRUPO-EXITO-V0.md`
y su reporte de contraste; `docs/velarix/casos/05-isa/CASO-05-ISA-V0.md`
y su reporte de contraste (mismas carpetas que cada caso).
**Objetivo:** determinar, con el Caso 06 como sexto punto de dato
independiente — y el primero sobre una institución financiera regulada
— qué de lo observado o reforzado por Tecnoglass, Terpel, Ecopetrol,
Grupo Éxito e ISA **sobrevive de forma transversal a los seis casos**,
qué se profundiza o cambia de forma, qué candidato sube, se mantiene, o
recibe evidencia insuficiente, y qué necesidad **nueva** aparece que el
Expediente V1 (ya actualizado por los Casos 01–05) no representaba
todavía.

**CASO 06 NO AUTORIZA IMPLEMENTACIÓN.** Este reporte de contraste, igual
que el caso que resume, es exclusivamente documental. Ningún cambio
descrito aquí autoriza crear tablas, migraciones, schemas, UI, motores,
Edge Functions, automatizaciones ni ningún otro cambio técnico. Solo
Nicolás/fundador puede autorizar implementación, de forma explícita y
separada. **Este reporte tampoco declara el Caso 06 formalmente cerrado
ni congelado** — el Caso 06 queda `ANÁLISIS DOCUMENTADO — PENDIENTE DE
REVISIÓN Y CIERRE FORMAL POR EL FUNDADOR`; el cierre, si corresponde, es
una ejecución posterior autorizada por Nicolás.

**Regla rectora de este reporte**: seis casos muestran patrones más
resistentes; seis casos no crean leyes universales. Un caso puede
reforzar, debilitar, refutar, resultar no material, producir evidencia
insuficiente, o revelar problemas nuevos — este reporte registra los
cinco resultados posibles con la misma disciplina.

**Clasificaciones usadas:** `PATRÓN OBSERVADO EN SEIS CASOS` (evidencia
transversal e independiente en los seis casos), `SOBREVIVE — SE
PROFUNDIZA/INCOMPLETO` (la regla reaparece, con distinto grado de diseño
pendiente), `PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS,
AHORA INCLUYENDO UNA INSTITUCIÓN FINANCIERA` (comparabilidad/perímetro),
`NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS`
(`scope`), `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES
CASOS, AÚN MENOS MADURA QUE SCOPE` (`purpose`, sin elevar en este caso),
`EVIDENCIA INSUFICIENTE` (donde Bancolombia no aportó evidencia
suficiente para elevar o confirmar algo), `EVIDENCIA FUERTE EN
BANCOLOMBIA — OBSERVACIÓN SECTORIAL; VALIDAR ANTES DE ELEVAR A
CANDIDATO TRANSVERSAL` (Bancolombia-G).

---

## 1. Matriz de contraste formal R1–R8

Ver detalle completo con evidencia en `CASO-06-BANCOLOMBIA-V0.md` §20.
Resumen:

| Regla | Resultado Caso 06 | Estado transversal | Nota |
|---|---|---|---|
| R1 — Contabilidad ≠ economía | `PATRÓN OBSERVADO EN SEIS CASOS` | `PATRÓN OBSERVADO EN SEIS CASOS` | Depósitos, intereses, liquidez, instrumentos financieros y capital pueden tener clasificación contable correcta sin que eso determine su interpretación para valoración |
| R2 — Observado ≠ normalizado ≠ proyectado | `PATRÓN OBSERVADO EN SEIS CASOS` | `PATRÓN OBSERVADO EN SEIS CASOS` | Provisiones/ECL, Banistmo, cifras reportadas vs. vistas analíticas/pro forma; nunca sobrescribir lo reportado |
| R3 — Los supuestos están relacionados | núcleo `PATRÓN OBSERVADO EN SEIS CASOS`; diseño `INSUFICIENTEMENTE VALIDADO` | `PATRÓN OBSERVADO EN SEIS CASOS` + `DISEÑO INSUFICIENTEMENTE VALIDADO` | Relaciones temporales, condicionales, regulatorias, macroeconómicas, bidireccionales o no lineales; cautela contra grafo causal ingenuo A → B; no se rediseña `assumption_relations` |
| R4 — Descomposición según dimensión económica relevante | `PATRÓN OBSERVADO EN SEIS CASOS` (formulación base) | `PATRÓN OBSERVADO EN SEIS CASOS` | Producto, tipo de cartera, fondeo, riesgo, función económica, moneda, geografía, entidad, regulación, modelo de negocio; se mantiene: más granularidad no es automáticamente mejor análisis |
| R5 — Estado de conocimiento explícito | `SOBREVIVE — SE PROFUNDIZA` | — | Provisiones, cash/liquidez y capital: "conozco la cifra, pero no sé cómo interpretarla económicamente para este propósito"; no se crea enum nuevo |
| R6 — Método de determinación (scope/purpose) | `SOBREVIVE — INCOMPLETO` | — | `scope` y `purpose` reciben refuerzo muy fuerte, sin elevar de nivel formal; `purpose` no alcanza la madurez de `scope`; no se fusionan |
| R7 — Drivers específicos por empresa | `PATRÓN OBSERVADO EN SEIS CASOS` | `PATRÓN OBSERVADO EN SEIS CASOS` | NIM, costo de depósitos, yield de cartera, costo de crédito, calidad de activos, stages/ECL, RWA, solvencia, liquidez, mix de fondeo — sin biblioteca universal cerrada |
| R8 — Detectar incoherencias sin decidir | `PATRÓN OBSERVADO EN SEIS CASOS` | `PATRÓN OBSERVADO EN SEIS CASOS` | Provisión alta ≠ extraordinaria; cash alto ≠ excess cash; depósito ≠ bono corporativo; fair value ≠ especulación; caída de utilidad ≠ deterioro recurrente. El experto decide |

## 2. Qué sobrevivió sin cambio material

- Las ocho reglas R1–R8 en su formulación conceptual base — ninguna fue
  refutada por Bancolombia.
- La regla de normalizaciones (reportado → posible ajuste → motivo →
  evidencia → recurrente/no recurrente → importe propuesto →
  responsable → aprobación → importe normalizado, sin sobrescribir lo
  reportado).
- La prohibición de crear `case_perimeter`, `contracts` universal,
  `economic_period`, `economic_lifecycle`, `measurement_basis`,
  `availability`, ni ninguna estructura técnica nueva.
- Las Decisiones 2 y 4 del Bloque 1B (estructura de capital observada;
  horizonte fijo de 5 años) — ambas se profundizan conceptualmente, sin
  cambiar.
- La regla de que ningún caso, por sí solo, autoriza implementación.

## 3. Qué se reforzó

- **R1, R2, R4 (base), R7, R8**: pasan a `PATRÓN OBSERVADO EN SEIS
  CASOS` — nivel de evidencia más alto registrado hasta ahora.
- **R3 (núcleo)**: también `PATRÓN OBSERVADO EN SEIS CASOS`, con
  evidencia adicional de relaciones bidireccionales/no lineales propias
  del balance bancario.
- **`scope` y `purpose`**: ambos reciben "refuerzo muy fuerte" — el caso
  más directo hasta ahora de que el mismo nombre coloquial de una
  compañía puede referirse a scopes materialmente distintos (holding,
  banco operativo, grupo consolidado, unidad regulatoria).
- **Comparabilidad/perímetro**: sube a "ahora incluyendo una institución
  financiera" (§5).
- **Candidato B (ciclo de vida económico)**: sube a cuatro casos.
- **Candidato C (atribución temporal)**: sube a "fuertemente
  respaldado".
- **Observación ISA-F**: sube a "observación transversal fuertemente
  reforzada en dos economías radicalmente distintas".
- **Leases y supplier financing**: reforzado en su problema (leases);
  para supplier financing, Bancolombia no aportó evidencia material
  útil — resultado `IRRELEVANCIA / EVIDENCIA INSUFICIENTE` para
  Bancolombia como empresa valorada, sin que esto confirme
  irrelevancia universal del fenómeno. Sin cambio de estado formal en
  ninguno de los dos.

## 4. Qué quedó conceptualmente incompleto

- `assumption_relations`: el diseño sigue sin validar, ahora con
  evidencia de relaciones temporales, condicionales y regulatorias
  además de las bidireccionales ya vistas en Grupo Éxito.
- `scope` y `purpose`: necesidad conceptual fuerte en ambos, sin diseño
  de tipo, enum ni estructura.
- Comparabilidad/perímetro: problema fuertemente demostrado, sin
  representación general disponible.
- Candidato E (base de medición/régimen monetario): la formulación
  general se vuelve **menos** estable con este caso, no más — Bancolombia
  muestra que puede estar agrupando fenómenos metodológicamente
  distintos (base de medición contable vs. régimen monetario/moneda).
- Selección de método de valoración para instituciones financieras:
  cinco candidatos documentados (§25 del caso), ninguno aprobado.
- La tensión WACC/Cost of Equity: documentada, no resuelta.

## 5. Qué supuestos financieros "universales" fueron refutados como universales

Bancolombia aporta evidencia suficiente para que este reporte registre
que **no deben asumirse como obligación universal**:

- La secuencia `FCFF → WACC → CAPEX → NWC → Enterprise Value → net debt
  → Equity Value` como único camino de valoración.
- NWC como driver universal obligatorio (no lo es para el core
  bancario; puede seguir siéndolo para otras economías).
- CAPEX como totalidad de la reinversión económica relevante.
- Net debt convencional como puente automático entre EV y Equity Value.
- Intereses como financiación externa a la operación, categóricamente.
- Cash observado como excess cash automáticamente.
- Deuda como categoría económicamente homogénea.
- Book equity como capital libre para distribución.
- Un set universal cerrado de drivers de valoración.
- WACC como input obligatorio de toda valoración, independientemente del
  método y del objeto económico valorado.

**Ninguno de estos elementos se elimina de Velarix** — se documenta
únicamente que ninguno debe asumirse como default universal (ver
`CASO-06-BANCOLOMBIA-V0.md` §31).

## 6. Qué hallazgos son específicos de banca

- El mecanismo NIM (margen neto de interés) como motor económico
  central (§10 del caso).
- La secuencia de provisiones/ECL como mecanismo de riesgo prospectivo
  (§11).
- Las cuatro nociones de cash bancario y las cinco nociones de capital
  bancario (§12, §13).
- El concepto de double leverage entre holding y banco operativo (§17).
- Los cinco métodos de valoración documentados específicamente para
  instituciones financieras (§25).
- Bancolombia-G (puente de capital/capacidad de distribución) — nueva
  observación sectorial, no transversal todavía.

## 7. Qué hallazgos podrían ser transversales

- La distinción entre "reconocimiento/titularidad de un recurso" y "su
  disponibilidad económica para cualquier propósito" — ya observada en
  ISA (efectivo restringido) y ahora en Bancolombia (cash bancario) con
  mecanismos distintos entre sí (observación ISA-F, §22 del caso).
- La necesidad de establecer explícitamente "qué interés económico se
  está intentando valorar" antes de elegir método — potencialmente
  relevante para cualquier caso con estructura societaria compleja, no
  solo bancos (§30 del caso).
- La distinción entre arquitectura universal del proceso de valoración y
  arquitectura financiera específica del método/economía (§29 del
  caso) — candidata a ser el hallazgo más transversal de todo el caso,
  aunque este reporte no la eleva a regla formal todavía.

## 8. Qué evidencia fue insuficiente

- Candidato A (neteo): sin evidencia independiente nueva.
- Candidato D (derechos económicos/propiedad dinámica), componente
  dinámico/contractual: la reorganización societaria de 2025 no
  demuestra, por sí sola, el fenómeno específico del candidato.
- Supplier financing: irrelevante para Bancolombia como empresa
  valorada — la actividad de financiar clientes es el negocio del
  banco, no un mecanismo de financiamiento de proveedores propio.
- Un ciclo de vida bancario específico y estructuralmente comparable a
  los de Ecopetrol/Grupo Éxito/ISA — la evidencia disponible es más
  débil que en los tres casos anteriores, aunque suficiente para sumar
  una cuarta instancia al Candidato B.

## 9. Qué preguntas deben sobrevivir a Goldman Sachs (Caso 07)

- Si el patrón `PATRÓN OBSERVADO EN SEIS CASOS` (R1, R2, R3 núcleo, R4
  base, R7, R8) se sostiene con un séptimo punto de dato independiente,
  ahora en una institución financiera de banca de inversión/gestión de
  activos, distinta de un banco comercial regulado.
- Si el Candidato A (neteo) recibe, por fin, evidencia independiente
  fuerte — la banca de inversión, con su intensivo uso de trading books
  y posiciones netas, podría ser un terreno más favorable para este
  candidato que la banca comercial.
- Si la observación ISA-F/disponibilidad de recursos se sostiene una
  tercera vez, acercándose a la elevación a Candidato F.
- Si el Candidato D (derechos económicos/propiedad dinámica) recibe
  evidencia independiente nueva — bancos de inversión pueden tener
  estructuras de participación y compensación diferida más dinámicas.
- Si los cinco métodos documentados en §25 (o alguno nuevo) reaparecen
  como candidatos relevantes, y con qué grado de aprobación implícita
  entre analistas del sector.

## 10. Qué preguntas deben sobrevivir a Munich Re (Caso 08)

- Si Bancolombia-G (puente de capital/capacidad de distribución) se
  refuerza con un segundo mecanismo sectorial independiente — el régimen
  de capital de solvencia de una aseguradora (ej. capital
  regulatorio/prudencial específico de seguros) es explícitamente la
  prueba futura más relevante identificada en este caso.
- Si Candidato E (base de medición/régimen monetario) recibe evidencia
  que ayude a decidir si debe dividirse — una aseguradora con reservas
  técnicas de largo plazo y exposición multi-moneda podría aportar un
  tercer mecanismo independiente.
- Si el Candidato C (atribución temporal) se refuerza con el mecanismo
  específico de reconocimiento de primas/reservas técnicas de una
  aseguradora, distinto de la banca y de las concesiones de ISA.
- Si "estado estable" adquiere un tercer significado sectorial distinto
  del bancario (§28 del caso) y del industrial de los Casos 01–02/04.

## 11. Qué NO está autorizado para implementación

Sin cambios respecto a los Casos 01–05, reafirmado explícitamente por
Bancolombia (`CASO-06-BANCOLOMBIA-V0.md` §36, §39):

- `account_components`, `assumption_relations`, `coherence_flags`,
  `scope`, `purpose` — se mantienen como concepto, ninguno se
  implementa.
- `case_perimeter`, `contracts` universal, `economic_period`,
  `economic_lifecycle`, `measurement_basis`, `availability` — no se
  crean.
- `regulatory_capital`, `capital_bridge`, `distributable_capital`,
  `bank_metrics`, `credit_risk`, PD, LGD, EAD, un motor de ECL, un enum
  de stages, campos de CET1, campos de RWA — no se crean.
- `cost_of_equity` field, `valuation_method`, un motor de Residual
  Income, un motor de DDM, un motor de FCFE, un motor de SOTP, un "bank
  mode", un enum de institución financiera, `industry_type` — no se
  crean.
- Ningún schema, tabla, migración, UI, Edge Function ni automatización.
- No se calculó WACC, Cost of Equity, g, FCFF, FCFE, ni ninguna
  valoración (EV, Equity Value, precio por acción, Residual Income,
  DDM, SOTP).
- No se seleccionó método final de valoración.
- No se eleva ISA-F a Candidato F.
- No se crea "Candidato G" para Bancolombia-G.
- No se divide el Candidato E.
- No se cierran los Bloques 1B ni 1C.
- No se declara el Expediente listo para implementación.

## 12. Resumen de disposición final

- **Incorporado como refuerzo transversal, sin cambio de
  especificación**: R1, R2, R4 (base), R7, R8, y R3 (núcleo) — todos
  `PATRÓN OBSERVADO EN SEIS CASOS`.
- **Incorporado como necesidad conceptual reforzada, sin implementar**:
  `scope`, `purpose` (ambos con refuerzo muy fuerte, sin elevar de
  nivel); comparabilidad/perímetro (ahora incluyendo una institución
  financiera).
- **Mantenido sin cambio de nivel**: Candidato A (neteo); Candidato D
  (derechos económicos/propiedad dinámica); supplier financing; leases
  (estado, aunque reforzado).
- **Elevado con evidencia de un caso adicional**: Candidato B (ciclo de
  vida, ahora cuatro casos); Candidato C (atribución temporal, ahora
  "fuertemente respaldado"); observación ISA-F (ahora "fuertemente
  reforzada en dos economías").
- **Tensionado, sin elevación simple**: Candidato E (base de
  medición/régimen monetario) — la formulación general se vuelve menos
  estable, no más.
- **Registrado como observación sectorial nueva, sin arquitectura**:
  Bancolombia-G (puente de capital/capacidad de distribución).
- **Documentado como tensión metodológica, sin resolver**: método de
  valoración final para instituciones financieras; WACC vs. Cost of
  Equity.
- **Ninguna cifra de Bancolombia** se incorporó como default, benchmark
  ni referencia metodológica de Velarix — el material de trabajo de
  este caso fue predominantemente conceptual, sin batería extensa de
  cifras.
- **Ningún negocio, driver ni método de valoración específico de
  Bancolombia** se declaró requisito universal para otras empresas o
  bancos.
- **Ninguna de las ocho reglas R1–R8** se declara completa, cerrada ni
  definitiva por haber sobrevivido a seis casos.

## 13. Conclusión de disposición del Expediente

Consistente con `CASO-06-BANCOLOMBIA-V0.md` §37: el Expediente V1
sobrevive conceptualmente al Caso 06 — refuerza especialmente su capa
universal de proceso (evidencia → contexto → interpretación → estado de
conocimiento → preguntas → normalizaciones → hipótesis/supuestos →
selección/justificación metodológica → aprobación experta → cálculo →
conclusión profesional) — pero **todavía no está listo para congelarse
como arquitectura**. Ninguno de los candidatos, ni la observación ISA-F,
ni la nueva observación Bancolombia-G, se convierten en requisito de
producto en este reporte. El Expediente no se declara listo para
implementación.

## 14. Estado del caso

**El Caso 06 NO queda formalmente cerrado ni congelado en este
reporte.** Estado: `ANÁLISIS DOCUMENTADO — PENDIENTE DE REVISIÓN Y
CIERRE FORMAL POR EL FUNDADOR`. El cierre, si corresponde, es una
ejecución posterior autorizada explícitamente por Nicolás tras revisar
este resultado.

## 15. Qué sigue

1. Caso 07 (Goldman Sachs, autorizado, no iniciado en esta tarea) y Caso
   08 (Munich Re, autorizado, no iniciado en esta tarea) deben intentar
   romper, no confirmar, las conclusiones de este caso — ver §9 y §10
   para las preguntas específicas que deben sobrevivir a cada uno.
2. Ninguno de los cambios de este reporte autoriza implementación — sigue
   pendiente autorización explícita y separada del fundador
   (`Negocio_Velarix_v4.2.md` §19, regla 19).
3. Este reporte no declara el Caso 06 formalmente cerrado ni congelado
   — esa declaración, si corresponde, es una ejecución posterior
   autorizada por Nicolás.
4. Las preguntas metodológicas de `CASO-06-BANCOLOMBIA-V0.md` §34
   (scope, purpose, `assumption_relations`, método de valoración final,
   tensión WACC/Cost of Equity, comparabilidad/perímetro, los cinco
   candidatos, ISA-F, Bancolombia-G) quedan como agenda concreta para la
   próxima conversación con un revisor/experto financiero — no como
   ejercicio abstracto, sino con evidencia real de seis casos
   independientes detrás.
