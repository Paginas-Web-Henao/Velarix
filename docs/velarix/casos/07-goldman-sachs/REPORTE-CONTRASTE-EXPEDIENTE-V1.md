# Reporte de contraste — Caso 07 (The Goldman Sachs Group, Inc.) vs. `EXPEDIENTE-DE-VALORACION-V1.md`

**Fecha:** 2026-08-12
**Insumo:** `docs/velarix/casos/07-goldman-sachs/CASO-07-GOLDMAN-SACHS-V0.md`
**Insumos previos:** `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`
y su reporte de contraste; `docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md`
y su reporte de contraste; `docs/velarix/casos/03-ecopetrol/CASO-03-ECOPETROL-V0.md`
y su reporte de contraste; `docs/velarix/casos/04-grupo-exito/CASO-04-GRUPO-EXITO-V0.md`
y su reporte de contraste; `docs/velarix/casos/05-isa/CASO-05-ISA-V0.md`
y su reporte de contraste; `docs/velarix/casos/06-bancolombia/CASO-06-BANCOLOMBIA-V0.md`
y su reporte de contraste (mismas carpetas que cada caso).
**Objetivo:** determinar, con el Caso 07 como séptimo punto de dato
independiente — y el segundo sobre una institución financiera regulada,
deliberadamente elegido para evitar que "institución financiera" se
convierta en categoría homogénea — qué de lo observado o reforzado por
Tecnoglass, Terpel, Ecopetrol, Grupo Éxito, ISA y Bancolombia
**sobrevive de forma transversal a los siete casos**, qué se profundiza o
cambia de forma, qué candidato sube, se mantiene, o recibe evidencia
insuficiente, y qué necesidad **nueva** aparece que el Expediente V1 (ya
actualizado por los Casos 01–06) no representaba todavía.

**CASO 07 NO AUTORIZA IMPLEMENTACIÓN.** Este reporte de contraste, igual
que el caso que resume, es exclusivamente documental. Ningún cambio
descrito aquí autoriza crear tablas, migraciones, schemas, UI, motores,
Edge Functions, automatizaciones ni ningún otro cambio técnico. Solo
Nicolás/fundador puede autorizar implementación, de forma explícita y
separada. **CASO 07 — THE GOLDMAN SACHS GROUP, INC.: ANÁLISIS DOCUMENTADO
— PENDIENTE DE REVISIÓN Y CIERRE FORMAL POR EL FUNDADOR.** Este reporte
**no está formalmente cerrado**; su cierre requiere revisión y
autorización explícita del fundador en una ejecución separada y
posterior.

**Regla rectora de este reporte**: siete casos muestran patrones más
resistentes; siete casos no crean leyes universales. Un caso puede
reforzar, debilitar, refutar, resultar no material, producir evidencia
insuficiente, o revelar problemas nuevos — este reporte registra los
cinco resultados posibles con la misma disciplina.

**Clasificaciones usadas:** `PATRÓN OBSERVADO EN SIETE CASOS` (evidencia
transversal e independiente en los siete casos), `SOBREVIVE — SE
PROFUNDIZA/INCOMPLETO` (la regla reaparece, con distinto grado de diseño
pendiente), `PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS Y
PROFUNDIZADO DENTRO DE INSTITUCIONES FINANCIERAS` (comparabilidad/
perímetro), `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES
CASOS` (`scope`), `PURPOSE — NECESIDAD CONCEPTUAL FUERTEMENTE
RESPALDADA POR MÚLTIPLES CASOS; GOLDMAN REDUCE MATERIALMENTE LA BRECHA
DE MADUREZ FRENTE A SCOPE` (`purpose`), `EVIDENCIA INSUFICIENTE` (donde
Goldman no aportó evidencia suficiente para elevar o confirmar algo),
`EVIDENCIA FUERTE INDEPENDIENTE` (Candidato A y Bancolombia-G, sin
elevación formal a candidato/regla nueva).

---

## 1. Matriz de contraste formal R1–R8

Ver detalle completo con evidencia en `CASO-07-GOLDMAN-SACHS-V0.md` §22.
Resumen:

| Regla | Resultado Caso 07 | Estado transversal | Nota |
|---|---|---|---|
| R1 — Contabilidad ≠ economía | `PATRÓN OBSERVADO EN SIETE CASOS` | `PATRÓN OBSERVADO EN SIETE CASOS` | Repos, derivatives, collateral, trading assets/liabilities, securities financing, financing — clasificación contable correcta que no determina, por sí sola, su interpretación para valoración |
| R2 — Observado ≠ normalizado ≠ proyectado | `PATRÓN OBSERVADO EN SIETE CASOS` | `PATRÓN OBSERVADO EN SIETE CASOS` | Markets revenue, advisory, underwriting, incentive fees, investment results, compensation; nunca sobrescribir lo reportado |
| R3 — Los supuestos están relacionados | núcleo `PATRÓN OBSERVADO EN SIETE CASOS`; diseño `AÚN MÁS INSUFICIENTEMENTE VALIDADO` | `PATRÓN OBSERVADO EN SIETE CASOS` + `DISEÑO AÚN MÁS INSUFICIENTEMENTE VALIDADO` | Relaciones circulares, regulatorias, condicionales, no lineales, mediadas por decisiones humanas; cautela contra grafo causal ingenuo A → B; no se rediseña `assumption_relations` |
| R4 — Descomposición según dimensión económica relevante | `PATRÓN OBSERVADO EN SIETE CASOS` | `PATRÓN OBSERVADO EN SIETE CASOS` | Drivers distintos entre advisory, underwriting, FICC, Equities, financing, AWM, wealth, lending, investments; más granularidad no es automáticamente mejor análisis |
| R5 — Estado de conocimiento explícito | `SOBREVIVE / SE PROFUNDIZA` | — | Bruto/netting/collateral/neto de derivados: conocer la cifra no equivale a saber qué magnitud representa mejor la exposición económica relevante; no se crea enum nuevo |
| R6 — Método de determinación (scope/purpose) | `scope` sin cambio de nivel; `purpose` reduce brecha de madurez | — | `purpose` recibe la evidencia más fuerte hasta ahora (mismo instrumento, distinto significado según financing/market making/hedge/liquidez/client facilitation/investment); no se fusiona con `scope` |
| R7 — Drivers específicos por empresa | `PATRÓN OBSERVADO EN SIETE CASOS` | `PATRÓN OBSERVADO EN SIETE CASOS` | Deal activity, client activity, volatility, spreads, financing balances, AUS/AUM, fee rates — sin biblioteca universal cerrada |
| R8 — Detectar incoherencias sin decidir | `PATRÓN OBSERVADO EN SIETE CASOS` | `PATRÓN OBSERVADO EN SIETE CASOS` | Derivado grande ≠ especulación; Level 3 ≠ medición incorrecta; posición bruta ≠ riesgo equivalente; collateral recibido ≠ recurso libre; high markets revenue ≠ extraordinario. El experto decide |

## 2. Qué sobrevivió sin cambio material

- Las ocho reglas R1–R8 en su formulación conceptual base — ninguna fue
  refutada por Goldman.
- La regla de normalizaciones (reportado → posible ajuste → motivo →
  evidencia → recurrente/no recurrente → importe propuesto →
  responsable → aprobación → importe normalizado, sin sobrescribir lo
  reportado).
- La prohibición de crear `case_perimeter`, `economic_period`,
  `economic_lifecycle`, `measurement_basis`, `availability`,
  `capital_bridge`, `distributable_capital`, `netting`, modelo de
  collateral, ni ninguna estructura técnica nueva.
- Las Decisiones 1, 2 y 4 del Bloque 1B — se profundizan conceptualmente
  (tensión WACC/Cost of Equity, §32 del caso), sin cambiar.
- La regla de que ningún caso, por sí solo, autoriza implementación.

## 3. Qué se reforzó

- **R1, R2, R4 (base), R7, R8**: pasan a `PATRÓN OBSERVADO EN SIETE
  CASOS` — nivel de evidencia más alto registrado hasta ahora.
- **R3 (núcleo)**: también `PATRÓN OBSERVADO EN SIETE CASOS`, con
  evidencia adicional de relaciones circulares/regulatorias/no lineales
  propias de una institución financiera de mercados.
- **`purpose`**: reduce materialmente su brecha de madurez frente a
  `scope` — el caso más fuerte hasta ahora de que el mismo instrumento
  puede significar cosas distintas según su propósito económico.
- **Comparabilidad/perímetro**: sube a "profundizado dentro de
  instituciones financieras" (§4).
- **Candidato A (neteo)**: sube de "evidencia fuerte en Ecopetrol" a
  `EVIDENCIA FUERTE INDEPENDIENTE EN ECOPETROL Y GOLDMAN SACHS`, con
  formulación general pendiente de refinamiento antes de elevación.
- **Candidato B (ciclo de vida económico)**: sube a cinco casos.
- **Candidato C (atribución temporal)**: se mantiene "fuertemente
  respaldado", con Goldman aportando una nueva economía temporal.
- **Candidato E (base de medición/régimen monetario)**: recibe evidencia
  muy fuerte adicional en base de medición; la formulación general se
  vuelve aún menos estable, y la hipótesis de que son fenómenos
  distintos se fortalece.
- **Observación ISA-F**: sube a "reforzada en tres economías radicalmente
  distintas — ISA, Bancolombia y Goldman Sachs".
- **Observación Bancolombia-G**: sube a "evidencia fuerte independiente
  en dos instituciones financieras con economías materialmente
  distintas — Bancolombia y Goldman Sachs".

## 4. Qué quedó conceptualmente incompleto

- `assumption_relations`: el diseño sigue sin validar, ahora con
  evidencia adicional de relaciones circulares y regulatorias propias de
  una firma de mercados.
- `scope` y `purpose`: necesidad conceptual fuerte en ambos; `purpose`
  se acerca a la madurez de `scope` sin alcanzarla ni fusionarse.
- Comparabilidad/perímetro: problema fuertemente demostrado, sin
  representación general disponible.
- Candidato A (neteo): evidencia fuerte independiente en dos casos, pero
  la formulación general ("el neteo destruye información") queda
  explícitamente marcada como insuficiente y pendiente de refinamiento.
- Candidato E (base de medición/régimen monetario): la formulación
  general se vuelve **aún menos** estable, no más.
- Selección de método de valoración para instituciones financieras: seis
  candidatos/resultados documentados en el caso (§32), ninguno aprobado.
- La tensión WACC/Cost of Equity: documentada, no resuelta.
- La observación de compensación (§21 del caso): evidencia insuficiente
  para crear candidato — pregunta abierta explícita sobre si es R3, R7,
  fenómeno sectorial, o algo nuevo.

## 5. Qué supuestos financieros "universales" fueron refutados como universales

Goldman aporta evidencia suficiente para que este reporte registre que
**no deben asumirse como obligación universal**:

- FCFF/WACC convencional como default del grupo consolidado.
- Enterprise Value como arquitectura universal del grupo (aunque
  potencialmente útil en determinados `scope`s — pregunta abierta).
- NWC industrial convencional como driver del core consolidado.
- CAPEX contable como totalidad de la reinversión económica relevante.
- Net debt convencional como medida económicamente adecuada por
  default.
- Toda posición de collateral como universalmente disponible o
  universalmente restringida.
- Todo activo/pasivo Level 3 como irregularidad.
- "El neteo destruye información" como formulación metodológica
  suficiente — mostrar solo la cifra bruta también puede inducir una
  lectura económica falsa.
- Dividendos históricos como proyección mecánica de capacidad de
  distribución.
- WACC como input obligatorio de toda valoración, independientemente del
  método y del objeto económico valorado.

**Ninguno de estos elementos se elimina de Velarix** — se documenta
únicamente que ninguno debe asumirse como default universal (ver
`CASO-07-GOLDMAN-SACHS-V0.md` §32).

## 6. Qué hallazgos son específicos de Goldman Sachs / banca de inversión

- La coexistencia de seis funciones económicas heterogéneas dentro de la
  misma organización (advisory, market making, financing, asset
  management, wealth, investment activities — §7 del caso).
- La secuencia bruto → counterparty netting → cash-collateral netting →
  neto reconocido en derivados, con magnitudes de US$360–391B (bruto) a
  US$53–84B (neto) — §11, §12.
- Las cifras específicas de capital regulatorio (CET1, RWA,
  Supplementary Leverage Ratio) y de retorno de capital a accionistas
  (§19).
- La observación de compensación como posible variable económica
  endógena (§21).
- Los seis resultados de métodos de valoración documentados
  específicamente para Goldman Sachs (§32).

## 7. Qué hallazgos podrían ser transversales

- La distinción entre "reconocimiento/titularidad de un recurso" y "su
  disponibilidad económica para cualquier propósito" — ahora observada
  en tres economías radicalmente distintas (ISA, Bancolombia, Goldman
  Sachs) con mecanismos distintos entre sí (observación ISA-F, §16 del
  caso).
- La existencia de un puente entre utilidad/patrimonio y capacidad de
  distribución al accionista final, condicionado por requerimientos de
  capital y regulación — ahora observada en dos instituciones
  financieras materialmente distintas (Bancolombia-G, §20 del caso).
- La distinción entre arquitectura universal del proceso de valoración y
  arquitectura financiera específica del método/economía (§36 del
  caso) — reforzada por un mecanismo nuevo (heterogeneidad
  intra-organizacional), aunque este reporte no la eleva a regla formal
  todavía.
- La necesidad de reconstruir el puente bruto → netting → collateral →
  exposición económica antes de decidir qué magnitud usar (§12 del
  caso) — potencialmente relevante para cualquier caso con instrumentos
  financieros materiales, no solo bancos de inversión.

## 8. Qué evidencia fue insuficiente

- Candidato D (derechos económicos/propiedad dinámica): sin evidencia
  nueva en tres casos consecutivos (ISA, Bancolombia, Goldman Sachs).
- Supplier financing: irrelevante para Goldman como empresa valorada —
  financiar clientes es su negocio, no un mecanismo de financiamiento de
  proveedores propio.
- Leases: sin mecanismo específico nuevo (como el doble rol lessee/lessor
  de ISA/Bancolombia) que justifique sumar instancia.
- La observación de compensación (§21 del caso): evidencia insuficiente
  para crear un candidato nuevo ("Goldman-H").

## 9. Los veinte puntos de contraste explícito solicitados

Evaluación de si `EXPEDIENTE-DE-VALORACION-V1.md` puede representar
disciplinadamente lo aprendido en el Caso 07, sin repetir el caso
completo:

| # | Punto | Clasificación | Nota |
|---|---|---|---|
| 1 | Separación HECHO / INFERENCIA | `CUBIERTO` | §5.1 ya define la clasificación epistémica transversal; el Caso 07 la aplicó sin necesidad de ampliarla |
| 2 | Preservación de ambigüedad económica | `CUBIERTO` | La capa universal de proceso (§29 del Caso 06, reafirmada en §36 del Caso 07) ya admite `desconocido`/`evidencia insuficiente` sin bloquear el expediente (§17) |
| 3 | Scope | `PARCIALMENTE CUBIERTO` | §5.2 registra la necesidad conceptual; sigue sin tipo, enum ni estructura — sin cambio de nivel por Goldman |
| 4 | Purpose | `PARCIALMENTE CUBIERTO` | §5.2 registra la necesidad; Goldman reduce la brecha de madurez frente a `scope`, pero no alcanza estructura ni fusión — requiere actualización de redacción, no de diseño |
| 5 | Net debt | `NO DEBE RESOLVERSE TODAVÍA` | §31 del Bloque 13 asume net debt convencional en el flujo estándar; Goldman confirma que puede no ser interpretable en ciertos scopes, pero no exige una solución general todavía |
| 6 | NWC | `CUBIERTO` | §20 (Caso 06) ya registra que NWC no es driver universal obligatorio; Goldman refuerza sin requerir cambio adicional |
| 7 | CAPEX/reinversión | `PARCIALMENTE CUBIERTO` | §20 (Caso 06) ya distingue CAPEX de reinversión económica total; Goldman amplía las vías posibles (capital regulatorio, tecnología, talento, fundraising) sin que el Expediente necesite enumerarlas |
| 8 | WACC | `CUBIERTO` | Decisión 1 del Bloque 1B y la tensión documentada en §26 (Caso 06)/§32 (Caso 07) ya reflejan que WACC no es input obligatorio universal |
| 9 | Cost of Equity | `NO DEBE RESOLVERSE TODAVÍA` | Tensión documentada, sin resolver; no requiere representación nueva mientras no se apruebe ningún Cost of Equity |
| 10 | FCFF | `CUBIERTO` | §31 (Caso 06) ya registra que la secuencia FCFF/WACC/CAPEX/NWC/EV/net debt/Equity Value no es obligación universal |
| 11 | Selección de método | `NO DEBE RESOLVERSE TODAVÍA` | §30 (Caso 06) ya registra la necesidad conceptual de documentar método considerado/aprobado sin crear `valuation_method`; Goldman no exige ir más allá |
| 12 | Drivers diferentes por economía | `CUBIERTO` | R7 (§5, R4) ya admite drivers específicos sin catálogo cerrado |
| 13 | Evidencia gross/net/collateral | `NO CUBIERTO` | El Expediente no tenía, antes de este caso, ningún lenguaje que distinga explícitamente bruto/netting/collateral/neto como estados de una misma exposición con distinta información preservada — Goldman es el primer caso que lo demuestra con esta claridad (Candidato A, §12) |
| 14 | Unidad legal vs. unidad económica | `PARCIALMENTE CUBIERTO` | §20/§30 (Caso 06) ya cubren holding vs. banco operativo; Goldman aporta un mecanismo distinto (unidad económica ≠ segmento contable dentro de la misma entidad legal, §7) que refuerza sin requerir campo nuevo |
| 15 | Interdependencias entre negocios | `PARCIALMENTE CUBIERTO` | §7 y §34 del caso documentan interdependencias (SOTP puede destruirlas); el Expediente no necesita modelarlas, solo advertir sobre ellas — ya lo hace de forma general en R4 |
| 16 | Preguntas abiertas | `CUBIERTO` | §10 (Preguntas) ya existe como entidad; el flujo hecho → desconocido → pregunta → evidencia → decisión se mantiene sin cambio |
| 17 | Información posterior al corte | `CUBIERTO` | El tratamiento (FY2025 como base, posterior al corte etiquetado aparte, sin reescritura retroactiva) ya está establecido desde Casos 03–06 |
| 18 | Comparabilidad/perímetro | `CUBIERTO` | §20 ya tiene el mecanismo de actualización de estado por caso; este reporte solo aporta el texto correspondiente a Goldman |
| 19 | Estado de conocimiento | `CUBIERTO` | R5 (§5, §22) ya cubre "conozco la cifra, no sé cómo interpretarla" sin nuevo enum |
| 20 | Detect without decide | `CUBIERTO` | R8 (§5, §22) ya cubre esta distinción de forma transversal |

**Nota sobre el punto 13** (el único `NO CUBIERTO`): esto **no** significa
que deba diseñarse una estructura de "netting" o "collateral" en el
Expediente. Significa que la prosa conceptual del Expediente (§20,
Candidato A) debe poder mencionar explícitamente que existen al menos
cuatro estados de una misma exposición financiera (bruto, con netting
jurídico, con collateral, neto reconocido) y que el candidato requiere
refinar su formulación antes de cualquier elevación — ver §10 de este
reporte para el ajuste documental mínimo aplicado al Expediente.

## 10. Ajuste documental aplicado al Expediente

Consistente con la regla de cambio del Caso 07 (§50 del prompt de
ejecución: modificar el Expediente solo si el contraste demuestra una
necesidad documental clara), se aplicó **un único ajuste mínimo**:
actualizar el estado del Candidato A en §20 del Expediente para reflejar
la evidencia fuerte independiente de Goldman y la advertencia explícita
de que su formulación general ("el neteo destruye información") es
insuficiente y requiere refinamiento antes de cualquier elevación — sin
crear `netting`, sin crear campos, sin crear un modelo de collateral.
Los demás 19 puntos de la matriz (§9) ya podían representarse con la
estructura documental existente del Expediente (`scope`, `purpose`,
comparabilidad/perímetro, R1–R8, Candidatos B–E, ISA-F, Bancolombia-G) y
se actualizaron con el texto correspondiente a Goldman siguiendo
exactamente el mismo patrón usado en los Casos 02–06 — no por
necesidad estructural nueva, sino por continuidad de la fotografía
metodológica caso por caso (ver `EXPEDIENTE-DE-VALORACION-V1.md` §27).

## 11. Qué preguntas deben sobrevivir a Munich Re (Caso 08)

Ver `CASO-07-GOLDMAN-SACHS-V0.md` §37 para el detalle completo. Resumen:
si Bancolombia-G se refuerza con un tercer mecanismo sectorial
(capital de solvencia de una aseguradora); si el Candidato E recibe
evidencia que ayude a decidir su división; si el Candidato C se refuerza
con el mecanismo de reconocimiento de primas/reservas técnicas; si
"estado estable" adquiere un tercer significado sectorial; si Residual
Income, FCFE, DDM y SOTP siguen siendo candidatos fuertes; si la unidad
económica adecuada de análisis vuelve a diferir de la entidad legal; si
la observación de compensación de Goldman es simplemente R3/R7 o revela
algo más amplio.

## 12. Qué NO está autorizado para implementación

Sin cambios respecto a los Casos 01–06, reafirmado explícitamente por
Goldman Sachs (`CASO-07-GOLDMAN-SACHS-V0.md` §41, §44):

- `account_components`, `assumption_relations`, `coherence_flags`,
  `scope`, `purpose` — se mantienen como concepto, ninguno se
  implementa.
- `case_perimeter`, `economic_period`, `economic_lifecycle`,
  `measurement_basis`, `availability`, `netting`, modelo de collateral —
  no se crean.
- `regulatory_capital`, `capital_bridge`, `distributable_capital`,
  `bank_metrics`, `credit_risk`, PD, LGD, EAD, un motor de ECL, un enum
  de stages, campos de CET1, campos de RWA — no se crean.
- `cost_of_equity` field, `valuation_method`, un motor de Residual
  Income, un motor de DDM, un motor de FCFE, un motor de SOTP, un "bank
  mode", un enum de institución financiera, `industry_type`, un modelo
  de compensación — no se crean.
- Ningún schema, tabla, migración, UI, Edge Function ni automatización.
- No se calculó WACC, Cost of Equity, g, FCFF, FCFE, ni ninguna
  valoración (EV, Equity Value, precio por acción, Residual Income,
  DDM, SOTP).
- No se seleccionó método final de valoración.
- No se eleva ISA-F a Candidato F.
- No se crea "Candidato G" para Bancolombia-G.
- No se eleva el Candidato A formalmente.
- No se divide el Candidato E.
- No se crea "Candidato H" para la observación de compensación.
- No se cierran los Bloques 1B ni 1C.
- No se declara el Expediente listo para implementación.

## 13. Conclusión de disposición del Expediente

Consistente con `CASO-07-GOLDMAN-SACHS-V0.md` §42: el Expediente V1
sobrevive conceptualmente al Caso 07 — refuerza especialmente su capa
universal de proceso frente a la arquitectura financiera específica del
método y de la economía valorada, ahora con evidencia de que esa
heterogeneidad puede existir incluso dentro de una misma organización —
pero **todavía no está listo para congelarse como arquitectura**.
Ninguno de los candidatos, ni las observaciones ISA-F y Bancolombia-G,
se convierten en requisito de producto en este reporte. El Expediente no
se declara listo para implementación.

## 14. Estado del caso

**El Caso 07 permanece `ANÁLISIS DOCUMENTADO — PENDIENTE DE REVISIÓN Y
CIERRE FORMAL POR EL FUNDADOR`** al final de esta ejecución. No queda
formalmente cerrado ni congelado. El cierre formal requiere: revisión
del resultado documental por Nicolás/fundador, posibles correcciones, y
su autorización explícita y separada, siguiendo el mismo patrón usado en
los Casos 03, 04, 05 y 06.

## 15. Qué sigue

1. Caso 08 (Munich Re, autorizado, no iniciado en esta tarea) debe
   intentar romper, no confirmar, las conclusiones de este caso — ver
   §11 para las preguntas específicas que deben sobrevivir.
2. Ninguno de los cambios de este reporte autoriza implementación — sigue
   pendiente autorización explícita y separada del fundador.
3. Este reporte y el Caso 07 **no quedan cerrados ni congelados** en
   esta ejecución — su cierre formal requiere una ejecución separada y
   posterior con autorización explícita de Nicolás/fundador.
4. Las preguntas metodológicas de `CASO-07-GOLDMAN-SACHS-V0.md` §37 y
   §39 (scope, purpose, `assumption_relations`, método de valoración
   final, tensión WACC/Cost of Equity, comparabilidad/perímetro, los
   candidatos, ISA-F, Bancolombia-G, compensación) quedan como agenda
   concreta para la próxima conversación con un revisor/experto
   financiero — no como ejercicio abstracto, sino con evidencia real de
   siete casos independientes detrás.
