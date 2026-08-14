# Genealogías y Traceability Gaps — Consolidación de los Ocho Casos — V1

**Fecha:** 2026-08-14
**Estado:** Documento de consolidación. NO autoriza implementación. NO
edita ni corrige retrospectivamente ningún documento congelado de los
Casos 01–08 — cada gap se preserva como tal, no se "arregla
silenciosamente".
**Fuente:** `01-REGISTRO-FENOMENOS-Y-MATRIZ-V1.md`, `02-REGISTRO-EVIDENCIA-V1.md`,
y los 16 documentos congelados.

---

## 0. Disciplina de este documento

Tipos de evento de evolución usados en las genealogías:

`CREATED` · `REFINED` · `EXPANDED` · `NARROWED` · `SPLIT_PROPOSED` ·
`SPLIT_APPROVED_CONCEPTUALLY` · `MERGE_PROPOSED` ·
`MERGE_APPROVED_CONCEPTUALLY` · `RENAMED` · `DEGRADED` · `REACTIVATED` ·
`UNCHANGED_AFTER_TEST` · `DISCARDED_ABSTRACTION` · `ELEVATED` ·
`NOT_ENOUGH_EVIDENCE`

Ningún evento de este documento reescribe un documento congelado. Cuando
un caso posterior corrige, refina o generaliza una formulación de un
caso anterior, ambas formulaciones quedan preservadas aquí en su fecha y
contexto originales.

---

## 1. Evolution Ledger — fenómenos desarrollados con detalle

### R4 — Descomposición según dimensión económica relevante

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` | C01 | "Cost of Sales no tiene desagregación pública suficiente" — descomposición sesgada hacia subcuentas **contables**. |
| `REFINED` | C02 | "una partida o variable material puede necesitar descomposición según la dimensión que explique su comportamiento económico" — la dimensión puede ser contable, de negocio, de producto, de canal, de geografía, de contrato. |
| `EXPANDED` (candidata, no adoptada) | C03 | Extensión hacia cifras netas (impairment) y movimientos agregados (reservas) — no solo partidas/cuentas. Registrada como extensión candidata, absorbida conceptualmente en relación con CA, **sin cambiar la formulación base**. |
| `REFINED` (cautela) | C04 | "más granularidad no es automáticamente mejor análisis" — depende de comportamiento económico, materialidad y propósito. |
| `REFINED` (cautela adicional) | C05 | "la descomposición debería detenerse cuando una granularidad adicional deja de modificar materialmente la interpretación económica necesaria para el propósito del análisis." |
| `UNCHANGED_AFTER_TEST` | C06–C08 | La formulación base (C02, con cautelas de C04/C05) sobrevive sin cambios adicionales de forma, con evidencia acumulada de ocho casos. |

**Estado final**: `PATRÓN OBSERVADO EN OCHO CASOS` (formulación base de
C02, con las dos cautelas de C04/C05). La extensión hacia cifras
netas/movimientos permanece candidata, no adoptada.

---

### R6 — Semantic ID drift (ver también GAP-01)

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` | C01 | R6 = "el sistema debe poder declarar información insuficiente, sin rellenar automáticamente." |
| `RENAMED` (de facto, sin renombrar explícitamente) | C02 | "R6" empieza a usarse para introducir `scope` y `purpose` — un fenómeno distinto del de C01. El propio Caso 02 no declara este cambio de significado; ocurre implícitamente. |
| `SPLIT_PROPOSED` (implícito) | C03–C08 | "R6" se consolida en todos los contrastes posteriores como sinónimo de "scope/purpose", sin que ningún documento congelado revierta al significado original de C01. |
| `MERGE_APPROVED_CONCEPTUALLY` | Esta consolidación (V1) | El R6 histórico del Caso 01 se absorbe conceptualmente en R5 (estado de conocimiento explícito) para la formulación transversal actual. El uso de "R6" desde el Caso 02 en adelante se preserva como `SCOPE`/`PURPOSE` en el Phenomenon Registry. |

**Estado final**: dos fenómenos distintos comparten un mismo número
histórico. Esta consolidación no renombra retrospectivamente el Caso
01 — únicamente documenta el drift y decide cómo tratarlo hacia
adelante (ver GAP-01).

---

### SCOPE

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` | C02 | "¿a qué aplica exactamente este supuesto? (empresa completa, filial, país, segmento, UGE, producto, contrato)". |
| `REFINED` (evidencia fuerte) | C03 | Un supuesto puede aplicar al grupo consolidado, a un negocio, o a la porción atribuible después de NCI — tres alcances materialmente distintos en el mismo caso (Ecopetrol/ISA). Elevado a `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS`. |
| `UNCHANGED_AFTER_TEST` | C04, C05 | Sin evidencia nueva que eleve el nivel más allá de C03; refuerzo cualitativo sin cambio de estado formal. |
| `REFINED` (refuerzo muy fuerte) | C06 | El mismo nombre coloquial ("Bancolombia") puede referirse a holding, banco operativo o grupo consolidado — el ejemplo más directo hasta ese punto. Sin elevación de nivel formal. |
| `UNCHANGED_AFTER_TEST` | C07 | Diferencias entre holding, banco, broker-dealer, subsidiarias, entidades reguladas — refuerzo sin elevación. |
| `ELEVATED` | C08 | `scope` alcanza `NECESIDAD CONCEPTUAL MUY FUERTEMENTE RESPALDADA` — el caso más fuerte hasta ahora (IFRS vs. Solvency II como propósitos/scopes distintos del mismo Grupo). |

**Estado final**: `NECESIDAD CONCEPTUAL MUY FUERTEMENTE RESPALDADA`. Sin
diseño de tipo, enum ni estructura en ningún momento de la secuencia.

---

### PURPOSE

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` (evidencia débil) | C02 | "¿para qué fue originalmente determinado o utilizado este supuesto?" — explícitamente con evidencia más débil que `scope` en el propio caso. |
| `UNCHANGED_AFTER_TEST` | C03 | "PREGUNTA CONCEPTUAL ABIERTA — EVIDENCIA MENOR QUE SCOPE" — sin evidencia directa nueva. |
| `ELEVATED` | C04 | Tasas de descuento para impairment, supuestos de UGE, fair value inmobiliario — primera evidencia particularmente limpia. Sube a `NECESIDAD CONCEPTUAL RESPALDADA POR MÚLTIPLES CASOS, AÚN MENOS MADURA QUE SCOPE`. |
| `ELEVATED` | C05 | WACC/tasas regulatorias, mediciones contables, información segmentada — sube a `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA, AÚN MENOS MADURA QUE SCOPE`. |
| `UNCHANGED_AFTER_TEST` (refuerzo sin elevación) | C06 | Refuerzo muy fuerte, sin subir de nivel formal. |
| `ELEVATED` (mayor salto de la serie) | C07 | El mismo instrumento puede significar cosas distintas según financing/market making/hedge/liquidez/client facilitation/investment — la evidencia más fuerte hasta ahora. `purpose` reduce materialmente la brecha de madurez frente a `scope`. |
| `ELEVATED` | C08 | `purpose` alcanza `NECESIDAD CONCEPTUAL MUY FUERTEMENTE RESPALDADA` — mismo nivel que `scope`, sin fusionarse con él. |

**Estado final**: `NECESIDAD CONCEPTUAL MUY FUERTEMENTE RESPALDADA`,
equiparado en nivel a `scope` pero explícitamente no fusionado con él
en ningún momento de la secuencia.

---

### PERIMETER — Comparabilidad / perímetro

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` (evidencia débil) | C02 | "EVIDENCIA INSUFICIENTE PARA DISEÑAR SOLUCIÓN — VALIDAR EN CASOS FUTUROS." |
| `ELEVATED` | C03 | ISA consolidada al 100% con ≈51.4% de control económico — "PROBLEMA DEMOSTRADO; EVIDENCIA INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN GENERAL." |
| `ELEVATED` | C04 | Estructuras "Viva" (26.01% atribuible), JVs, cambio de perímetro de Argentina reconocido por la propia compañía — "PROBLEMA DEMOSTRADO EN MÚLTIPLES ECONOMÍAS." |
| `ELEVATED` | C05 | Control≠propiedad económica, NCI y JVs concentrados dentro de la propia entidad estudiada — "PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA SUFICIENTE PARA EXIGIR TRATAMIENTO METODOLÓGICO." |
| `EXPANDED` | C06 | Primera institución financiera regulada (holding vs. banco operativo, Banistmo) — "...AHORA INCLUYENDO UNA INSTITUCIÓN FINANCIERA." |
| `EXPANDED` | C07 | Segunda institución financiera, con perímetro materialmente distinto (GBM/AWM/Platform Solutions) — "...Y PROFUNDIZADO DENTRO DE INSTITUCIONES FINANCIERAS." |
| `ELEVATED` (máximo nivel de la serie) | C08 | IFRS vs. Solvency II como representaciones válidas y distintas del mismo Grupo — "PROBLEMA MUY FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; MUNICH RE APORTA EVIDENCIA DIRECTA DE QUE UN MISMO GRUPO PUEDE REQUERIR PERÍMETROS Y MÉTODOS DE REPRESENTACIÓN DIFERENTES SEGÚN EL PROPÓSITO." |

**Estado final**: máximo nivel de evidencia acumulada de todos los
fenómenos no-R1–R8 de esta consolidación, explícitamente sin solución
de representación general y sin `case_perimeter` en ningún momento.

---

### CA — Candidato A (neteo → puente bruto-exposición)

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` | C03 | Nombre: "Neteo". Evidencia: impairment neto ≈0 ocultando reversión y deterioro de naturaleza opuesta. "EVIDENCIA FUERTE EN ECOPETROL — VALIDAR EN CASOS FUTUROS." |
| `NOT_ENOUGH_EVIDENCE` | C04, C05, C06 | Tres casos consecutivos sin evidencia nueva material. |
| `REFINED` + `NARROWED` (crítica al nombre) | C07 | Derivados: bruto (~US$360–391B) → neto reconocido (~US$53–84B). "EVIDENCIA FUERTE INDEPENDIENTE." Pero: "no usar 'el neteo destruye información' como formulación suficiente, porque mostrar solo la cifra bruta también puede inducir una interpretación económica falsa." |
| `RENAMED` (presión, sin ejecutar) + `EXPANDED` | C08 | "Neteo" se muestra como nombre demasiado estrecho: cadena ampliada a "bruto → compensación jurídica → collateral → reinsurance/retrocession → otros mitigantes → exposición económica". |

**Estado final**: `EVIDENCIA FUERTE INDEPENDIENTE EN ECOPETROL, GOLDMAN
SACHS Y MUNICH RE; LA FORMULACIÓN GENERAL DEBE REFINARSE ANTES DE
CUALQUIER ELEVACIÓN.` Nombre final no decidido en ningún documento
congelado — ver GAP-04.

---

### CB — Candidato B (ciclo de vida económico)

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` | C03 | Ecopetrol: inversión→operación→mantenimiento/reposición→agotamiento→abandono. |
| `EXPANDED` (2 casos, naturaleza muy distinta) | C04 | Grupo Éxito: apertura→operación→remodelación/conversión→posible cierre. |
| `EXPANDED` (3 casos) | C05 | ISA: adjudicación→construcción→operación→O&M→refuerzos→vencimiento→reversión/indemnización/renovación. Cautela nueva: "el ciclo de vida debe evaluarse respecto de la unidad económica pertinente." |
| `EXPANDED` (4 casos) | C06 | Bancolombia: vida/vencimiento contractual de activos/pasivos financieros ≠ vida económica del portafolio ≠ vida de la compañía — evidencia más débil que las tres anteriores, pero consistente. |
| `EXPANDED` (5 casos) | C07 | Goldman: vida contractual de una posición ≠ vida de la relación con cliente ≠ vida del programa/fondo ≠ vida de la franquicia ≠ vida de la empresa. |
| `EXPANDED` (6 casos, nivel máximo de la serie) | C08 | Munich Re: contract life ≠ risk life ≠ claim life ≠ liability life ≠ asset duration. |

**Estado final**: `PATRÓN OBSERVADO EN SEIS CASOS DE NATURALEZA
ECONÓMICA MUY DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA.` No elevado a
R9; no se crea `economic_lifecycle` en ningún punto de la secuencia.

---

### CC — Candidato C (atribución temporal / corte de conocimiento)

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` | C03 | FEPC: causación 2024, cobro 2025; también desfase entre cierre FY2025 y publicación en 2026. |
| `EXPANDED` (evidencia particularmente fuerte) | C04 | La propia compañía (Grupo Éxito) declara en 2T26 que un cambio de perímetro limita la comparabilidad frente al año anterior. |
| `EXPANDED` | C05 | Construcción, reconocimiento, puesta en servicio, remuneración, revisión regulatoria, recaudo, vencimiento contractual en momentos distintos (ISA). |
| `EXPANDED` (elevado a "fuertemente respaldado") | C06 | Reorganización societaria de 2025, acuerdo Banistmo, sus eventos posteriores. |
| `EXPANDED` (Goldman aporta nueva economía temporal) | C07 | commitment→execution→recognition→remeasurement→settlement→realization; backlog/pipeline→transaction→completion→fee recognition. |
| `EXPANDED` (nivel máximo, "muy fuertemente respaldado") | C08 | Munich Re: contrato; inicio de cobertura; ocurrencia; reporte; conocimiento posterior; reconocimiento; actualización de reservas; settlement; recoveries; valuation date — hasta diez momentos distinguibles. |

**Estado final**: `PROBLEMA METODOLÓGICO MUY FUERTEMENTE RESPALDADO POR
MÚLTIPLES CASOS.` No se crea `economic_period` en ningún punto.

---

### CD — Candidato D (derechos económicos / propiedad dinámica)

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` | C04 | Opción de venta (put) sobre NCI de Grupo Disco Uruguay, ejercida parcialmente en 2025. |
| `NOT_ENOUGH_EVIDENCE` | C05 | ISA aporta evidencia del problema más amplio de atribución (control≠propiedad), pero no de la parte dinámica/contractual específica. |
| `NOT_ENOUGH_EVIDENCE` | C06 | La reorganización societaria de 2025 es un cambio estructural completado, no un derecho contractual dinámico pendiente. |
| `NOT_ENOUGH_EVIDENCE` | C07 | Derivatives, deferred compensation, RSUs no comparables al fenómeno específico. |
| `NOT_ENOUGH_EVIDENCE` (4 casos consecutivos sin refuerzo) | C08 | Participating contracts y underlying items de Munich Re no comparables al fenómeno específico. |

**Estado final**: `EVIDENCIA FUERTE EN GRUPO ÉXITO — VALIDAR EN CASOS
FUTUROS.` Prioridad degradada tras cuatro casos consecutivos sin
refuerzo, sin eliminarse.

---

### CE — Candidato E compuesto → presión de división en Measurement Basis / Monetary Regime

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` (compuesto) | C04 | Hiperinflación Argentina + NIC 29 — measurement basis y régimen monetario mezclados en un solo candidato. |
| `EXPANDED` + `SPLIT_PROPOSED` (implícito) | C05 | ISA: monedas funcional/contractual, indexación, cobertura — mecanismo distinto (contractual, no hiperinflacionario). Primera cautela: "el Candidato E puede estar agrupando fenómenos económicamente relacionados pero metodológicamente diferentes." |
| `EXPANDED` + `TENSION` | C06 | Costo amortizado, FVOCI, FVTPL, ECL vs. moneda funcional/FX — "la formulación general se vuelve MENOS estable, no más." |
| `EXPANDED` (asimétrico) | C07 | Evidencia muy fuerte en measurement basis (fair value, Level 1/2/3), sin evidencia equivalente nueva en monetary regime — asimetría creciente entre los dos posibles linajes. |
| `SPLIT_PROPOSED` (formal, sin ejecutar) | C08 | IFRS vs. Solvency II cambia valores sin cambiar moneda; FX cambia valores sin cambiar base de medición — "LA HIPÓTESIS... QUEDA MUY FUERTEMENTE RESPALDADA." Pregunta explícita para la consolidación: "¿la evidencia de los ocho casos ya justifica separar formalmente measurement basis de monetary regime?" |

**Estado final** (decisión de esta consolidación, autorizada por el
prompt de ejecución, §8 de las instrucciones): `DIVIDIR
CONCEPTUALMENTE` en dos linajes provisionales — `MEASUREMENT-BASIS` y
`MONETARY-REGIME` — preservando `CE-HIST` como origen compuesto en la
genealogía. No se crean IDs técnicos definitivos ni campos. Ver GAP-05.

---

### CF — Candidato F (disponibilidad económica de recursos, ex-ISA-F)

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` (como observación, no candidato) | C05 | Efectivo restringido en ISA. "EVIDENCIA FUERTE EN ISA — VALIDAR ANTES DE ELEVAR A CANDIDATO TRANSVERSAL." Explícitamente no Candidato F formal. |
| `EXPANDED` (2 economías) | C06 | Cash contable ≠ liquidez prudencial ≠ cash excedentario ≠ cash distribuible (Bancolombia) — mecanismo distinto (liquidez prudencial bancaria vs. restricción contractual). "OBSERVACIÓN TRANSVERSAL FUERTEMENTE REFORZADA EN DOS ECONOMÍAS RADICALMENTE DISTINTAS." |
| `EXPANDED` (3 economías) | C07 | GCLA de Goldman (≈US$466B promedio) + collateral/reuse/repledge. "OBSERVACIÓN TRANSVERSAL FUERTEMENTE REFORZADA EN TRES ECONOMÍAS RADICALMENTE DISTINTAS — MANTENER ABIERTA HASTA MUNICH RE." |
| `ELEVATED` (formal) | C08 | Restraints on disposal + fungibilidad/transferibilidad de Munich Re, con ajuste posterior sin restricción material al Group SCR. "CANDIDATO F — DISPONIBILIDAD ECONÓMICA DE RECURSOS — EVIDENCIA TRANSVERSAL FUERTEMENTE REFORZADA EN CUATRO ECONOMÍAS RADICALMENTE DISTINTAS." |

**Estado final**: elevación formal, **únicamente metodológica/documental**
(cambio de nomenclatura y estado epistémico), sin `availability`,
`restricted_asset` ni `fungibility`. Ver GAP-06.

---

### CG — Candidato G (puente capital / capacidad de distribución, ex-Bancolombia-G)

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` (como observación sectorial) | C06 | Resultado→retención necesaria→capital que soporta crecimiento/riesgo→posible capital excedentario→capacidad de distribución de la subsidiaria→recursos recibidos por el holding→obligaciones propias del holding→capacidad final de distribución. "EVIDENCIA FUERTE EN BANCOLOMBIA — OBSERVACIÓN SECTORIAL; VALIDAR ANTES DE ELEVAR A CANDIDATO TRANSVERSAL." |
| `EXPANDED` (2 instituciones) | C07 | CET1, RWA, Supplementary Leverage Ratio + retorno de capital vía recompras/dividendos (Goldman). "EVIDENCIA FUERTE INDEPENDIENTE EN DOS INSTITUCIONES FINANCIERAS CON ECONOMÍAS MATERIALMENTE DISTINTAS." |
| `ELEVATED` (formal) | C08 | Solvency II eligible own funds/SCR (Munich Re) — misma estructura de fondo, mecanismo materialmente distinto. "CANDIDATO G — PUENTE CAPITAL / CAPACIDAD DE DISTRIBUCIÓN — PATRÓN OBSERVADO EN TRES INSTITUCIONES FINANCIERAS PRUDENCIALMENTE REGULADAS." |

**Estado final**: elevación formal, Capa B (familia: instituciones
financieras prudencialmente reguladas/capitalizadas). Sin
`capital_bridge`, `regulatory_capital` ni `distributable_capital`. Ver
GAP-06.

---

### DCF vs. FCFF — evolución de la formulación

| Evento | Caso | Formulación |
|---|---|---|
| Formulación implícita | C01–C05 | El horizonte explícito de 5 años y el enfoque DCF se mencionan sin distinguir explícitamente "DCF como enfoque" de "FCFF industrial como implementación específica". |
| `NARROWED` (refutación de universalidad) | C06 | "FCFF/WACC convencional: NO ADECUADO COMO DEFAULT PARA EL CORE BANCARIO." Primera evidencia explícita de que FCFF ≠ único camino de descuento de flujos. |
| `REFINED` (distinción explícita) | C07 | "DCF ≠ FCFF industrial" — mención explícita, sin resolver aún la separación formal. |
| `SPLIT_APPROVED_CONCEPTUALLY` (documental) | C08 | Se registran como fenómenos separados: `METHOD-FCFF` (no adecuado como default) y `METHOD-DCF-SCOPE` (discounted cash-flow approaches pueden ser útiles en determinados scopes, sin implicar que cada scope necesite un DCF). "No se afirma 'DCF no sirve para aseguradoras'." |

**Estado final**: separación conceptual reconocida (ver GAP-10),
ninguno de los dos declarado obligatorio ni eliminado.

---

### DDM → Potential Distributions

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` | C06 | DDM / dividendos potenciales — candidato fuerte, con cautela: "dividendo observado ≠ automáticamente dividendo sostenible." |
| `NARROWED` (evidencia que refuta la literalidad) | C07 | Recompras (US$12.36B) mucho mayores que dividendos (US$4.42B) en Goldman 2025 — "capital total devuelto ≠ capacidad sostenible de distribución." |
| `RENAMED` + `EXPANDED` | C07/C08 | Emerge `METHOD-POTDIST` (Potential Distributions): dividendos + buybacks + capital requerido + crecimiento/riesgo + buffers + restricciones + capital management. |
| `DISCARDED_ABSTRACTION` (parcial) | C08 | "DDM literal (solo dividendos): DEMASIADO ESTRECHO." Potential Distributions confirmado como "CANDIDATO MUY FUERTE." |

**Estado final**: DDM literal descartado como abstracción suficiente;
Potential Distributions es el fenómeno vigente. Ver GAP-11.

---

### SOTP — madurez

| Evento | Caso | Formulación |
|---|---|---|
| `CREATED` (mencionado, sin evaluar formalmente) | C03 | Ecopetrol: hipótesis de suma de partes mencionada, explícitamente no autorizada ni diseñada. |
| `REFINED` | C06 | "CANDIDATO A EVALUAR POR MATERIALIDAD" — Grupo Cibest puede incluir Bancolombia S.A. y negocios no financieros bajo el mismo holding. |
| `EXPANDED` | C07 | "CANDIDATO FUERTE Y MÁS RELEVANTE QUE EN BANCOLOMBIA" — pero puede destruir interdependencias económicas reales entre negocios de Goldman. |
| `EXPANDED` (máximo nivel) | C08 | "CANDIDATO MUY FUERTE" — pero un SOTP ingenuo puede destruir diversificación, duplicar capital, asignar mal inversiones, ignorar transferencias internas e interdependencias; "no se asume que seis segmentos IFRS = seis unidades obligatorias de valoración." |

**Estado final**: candidato condicional fuerte/muy fuerte según
economía, nunca obligatorio. Ver GAP-12.

---

### Decisión de horizonte fijo (5 años) vs. evidencia metodológica

| Evento | Caso | Formulación |
|---|---|---|
| Decisión vigente preexistente | Bloque 1B, Decisión 4 | Horizonte explícito fijo de 5 años, "por ahora", con advertencia ya incluida de que el sistema debería advertir cuando 5 años sea insuficiente. |
| `TENSION` (primera) | C01 | Tecnoglass no muestra evidencia de estar en estado estable a los 5 años (CAPEX, capacidad, márgenes y NWC todavía no estabilizados). |
| `TENSION` (formal, con ejemplo concreto) | C05 | ISA: activos/concesiones finitos dentro de una empresa con capacidad de reinversión potencialmente continua — "un ejemplo concreto de por qué" el horizonte fijo no debe asumirse como arquitectura universal futura. |
| `UNCHANGED_AFTER_TEST` | C06, C07, C08 | Cada caso profundiza conceptualmente (convergencia ROE→Cost of Equity, normalized through-cycle profitability, through-the-cycle en seguros) sin cambiar la Decisión 4. |

**Estado final**: la Decisión 4 (horizonte fijo de 5 años) permanece
vigente y **no se cambia en esta consolidación** (instrucción explícita
§14 del prompt de ejecución). La tensión entre la decisión y la
evidencia metodológica acumulada queda registrada como GAP-13, no como
argumento para modificarla ahora.

---

## 2. Traceability Gaps obligatorios

### GAP-01 — R6 semantic ID drift

**Qué ocurrió**: el Caso 01 usó "R6" para "el sistema debe poder
declarar información insuficiente, sin rellenar automáticamente". Desde
el Caso 02, "R6" se usa para introducir y desarrollar `scope` y
`purpose` (método de determinación de un supuesto), un fenómeno
distinto. Ningún documento congelado señala explícitamente este cambio
de significado en el momento en que ocurre.

**Por qué importa**: si se lee "R6" en un documento congelado sin
contexto, el número por sí solo no identifica de forma inequívoca a qué
fenómeno se refiere — Caso 01 vs. Casos 02–08.

**Qué NO hacer**: no editar `CASO-01-TECNOGLASS-V0.md` para renombrar su
R6 a otra cosa. No asumir retroactivamente que el R6 del Caso 01 siempre
significó `scope`/`purpose`.

**Cómo se preserva en trazabilidad**: el Phenomenon Registry
(`01-REGISTRO-FENOMENOS-Y-MATRIZ-V1.md`) usa el ID `R6-HIST` para la
formulación del Caso 01, explícitamente absorbida conceptualmente en R5
para la formulación transversal actual, y los IDs `SCOPE`/`PURPOSE`
para el uso posterior. Ambos IDs coexisten y se referencian entre sí.

---

### GAP-02 — Lenguaje temprano "confirmado" vs. disciplina posterior "patrón observado"

**Qué ocurrió**: el `CASO-01-TECNOGLASS-V0.md` §19 usa la frase
"reglas transversales, **confirmadas** con evidencia de este caso" para
introducir R1–R8. El `REPORTE-CONTRASTE-EXPEDIENTE-V1.md` del propio
Caso 01 usa la clasificación `CONFIRMADO POR CASO`. Desde el Caso 02 en
adelante, la disciplina epistémica se endurece explícitamente: "dos
casos muestran patrones; dos casos no crean leyes universales", y la
etiqueta pasa a ser siempre `PATRÓN OBSERVADO EN N CASOS`, nunca
`CONFIRMADO`.

**Por qué importa**: leído aisladamente, el lenguaje del Caso 01 podría
sugerir que R1–R8 fueron alguna vez tratadas como leyes cerradas a
partir de un solo caso — lo cual contradice la disciplina epistémica
vigente desde el Caso 02.

**Qué NO hacer**: no editar el Caso 01 para sustituir "confirmadas" por
"patrón observado". No citar la formulación de "confirmado" del Caso 01
como si describiera el estado actual de R1–R8.

**Cómo se preserva en trazabilidad**: esta consolidación usa
sistemáticamente `PATRÓN OBSERVADO EN OCHO CASOS` para R1, R2, R4
(base), R7, R8, y nunca `CONFIRMADO POR OCHO CASOS`, consistente con la
disciplina vigente desde el Caso 02 en adelante — ver §22 del prompt de
ejecución de este documento.

---

### GAP-03 — R5 sin etiqueta transversal única porque se profundizó

**Qué ocurrió**: a diferencia de R1, R2, R4, R7 y R8 (que reciben la
etiqueta `PATRÓN OBSERVADO EN N CASOS` de forma consistente desde el
Caso 03), R5 recibe sistemáticamente la etiqueta `SOBREVIVE — SE
PROFUNDIZA` en los ocho casos, sin una etiqueta numérica transversal
formal equivalente. El matiz "conozco la cifra, pero todavía no sé cómo
interpretarla económicamente" (introducido en el Caso 03) se repite y
se refuerza en cada caso posterior, pero ningún documento congelado le
asigna la etiqueta `PATRÓN OBSERVADO EN N CASOS`.

**Por qué importa**: crea una asimetría de nomenclatura entre R5 y el
resto de las reglas R1–R8 dentro de los propios documentos congelados,
que un lector podría interpretar erróneamente como que R5 tiene menos
evidencia que las demás — cuando en realidad tiene evidencia
equivalente, solo que documentada con otro vocabulario.

**Qué NO hacer**: no asignar retroactivamente `PATRÓN OBSERVADO EN OCHO
CASOS` a R5 dentro de los documentos congelados originales. No asumir
que la ausencia de esa etiqueta implica menor solidez.

**Cómo se preserva en trazabilidad**: el Phenomenon Registry documenta
`current_status: SOBREVIVE Y SE PROFUNDIZA` para R5 de forma
consistente con los documentos congelados, sin forzar una etiqueta
numérica que esos documentos nunca le asignaron.

---

### GAP-04 — CA name drift: "Neteo" demasiado estrecho

**Qué ocurrió**: el Candidato A se creó en el Caso 03 con el nombre
"Neteo". El propio Caso 08 (Munich Re) documenta explícitamente que ese
nombre "ya parece un nombre demasiado estrecho" para el fenómeno, dado
que reinsurance/retrocession es un mecanismo económico distinto del
netting jurídico o del collateral. Ningún documento congelado propone
ni aprueba un nombre final.

**Por qué importa**: cualquier diseño futuro de 1B/1C que use el nombre
"neteo" heredaría un sesgo hacia el mecanismo de compensación jurídica
de posiciones (derivados), perdiendo la generalidad hacia collateral y
reinsurance/retrocession ya demostrada.

**Qué NO hacer**: no renombrar retroactivamente el candidato dentro de
los documentos congelados de los Casos 03–08. No decidir un nombre
final en esta consolidación (fuera de alcance — ver §7 de las
instrucciones de ejecución).

**Cómo se preserva en trazabilidad**: el Phenomenon Registry usa el ID
estable `CA` (no ligado a ningún nombre específico) con
`current_name: "Candidato A — puente bruto → exposición económica
(nombre histórico 'Neteo', registrado como demasiado estrecho)"`. La
pregunta del nombre final se envía explícitamente al Bloque 1B/1C en
`04-BACKLOG-Y-PUENTE-1B-1C-V1.md`.

---

### GAP-05 — CE compound candidate; posterior split pressure

**Qué ocurrió**: el Candidato E se creó en el Caso 04 como un candidato
único que mezclaba measurement basis (fair value, costo amortizado,
IFRS vs. Solvency II) y régimen monetario/moneda (hiperinflación, FX,
moneda funcional). Desde el Caso 05, cada caso posterior aporta
evidencia asimétrica hacia uno de los dos posibles linajes, hasta que
el Caso 08 declara la hipótesis de separación "muy fuertemente
respaldada", sin ejecutar la división.

**Por qué importa**: sin reconocer la genealogía compuesta, un lector
podría tratar `MEASUREMENT-BASIS` y `MONETARY-REGIME` como si hubieran
sido candidatos independientes desde el origen, perdiendo la evidencia
de por qué eran, al principio, un solo candidato con evidencia mixta.

**Qué NO hacer**: no crear IDs técnicos definitivos para
`MEASUREMENT-BASIS`/`MONETARY-REGIME` que finjan que existieron
históricamente como entidades separadas desde el Caso 04. No implementar
`measurement_basis` field ni enum monetario.

**Cómo se preserva en trazabilidad**: el Phenomenon Registry preserva
`CE-HIST` como el ID de origen compuesto, y registra
`MEASUREMENT-BASIS`/`MONETARY-REGIME` como "linajes conceptuales
provisionales", ambos vinculados explícitamente a `CE-HIST` en su campo
`related_phenomena`.

---

### GAP-06 — CF/CG elevation lineage: nacieron como observaciones

**Qué ocurrió**: tanto el Candidato F (disponibilidad económica de
recursos) como el Candidato G (puente capital/capacidad de distribución)
nacieron como observaciones sectoriales sin nombre de "Candidato"
(ISA-F en el Caso 05; Bancolombia-G en el Caso 06), y solo se elevaron
formalmente a "Candidato F" y "Candidato G" en el Caso 08, tras
acumular evidencia de cuatro y tres economías radicalmente distintas
respectivamente.

**Por qué importa**: un lector que solo vea "Candidato F" o "Candidato
G" en esta consolidación, sin conocer su origen como observaciones
ISA-F/Bancolombia-G, podría asumir que siempre tuvieron ese estatus
formal, perdiendo la disciplina epistémica gradual que llevó a su
elevación.

**Qué NO hacer**: no editar los Casos 05/06 para llamarlos
retroactivamente "Candidato F"/"Candidato G". No tratar la elevación
como autorización de implementación — es explícitamente
"únicamente metodológica/documental" según el propio Caso 08.

**Cómo se preserva en trazabilidad**: el Phenomenon Registry documenta
`current_name` con la aclaración "(elevación formal de la observación
ISA-F / Bancolombia-G)" y preserva la secuencia completa de eventos en
las tablas de este documento.

---

### GAP-07 — CAPEX → reinvestment semantic expansion

**Qué ocurrió**: CAPEX se trató como sinónimo aproximado de "inversión"
desde el Caso 01. Desde el Caso 06, se separa conceptualmente de
"reinversión económica" (que puede incluir retención de capital
regulatorio, tecnología, talento, fundraising, adquisiciones), ampliada
aún más en el Caso 07 (Goldman: vías de reinversión más amplias y menos
formulaicas que en Bancolombia).

**Por qué importa**: un uso descuidado de "CAPEX" y "reinversión" como
sinónimos, heredado de los Casos 01–05, podría ocultar que la
reinversión económica relevante excede sistemáticamente al CAPEX
contable en instituciones financieras prudenciales.

**Qué NO hacer**: no fusionar `CAPEX` y `REINVESTMENT` en un solo
fenómeno del registro. No crear una fórmula que combine automáticamente
ambos conceptos.

**Cómo se preserva en trazabilidad**: el Phenomenon Registry mantiene
`CAPEX` y `REINVESTMENT` como fenómenos separados desde el Caso 06 en
adelante, vinculados mediante `related_phenomena`.

---

### GAP-08 — Debt semantic dependence / pérdida de homogeneidad

**Qué ocurrió**: "deuda" se trató de forma relativamente homogénea
(deuda contable = deuda económica, con ajustes menores) en los Casos
01–05. Desde el Caso 06, "deuda" deja de ser una categoría económicamente
homogénea: depósitos, financing de Goldman e insurance liabilities de
Munich Re requieren cada uno interpretación económica específica antes
de tratarse como deuda o no.

**Por qué importa**: aplicar retroactivamente la lógica industrial de
"deuda" de los Casos 01–05 a instituciones financieras produciría
conclusiones incorrectas (ej. tratar depósitos como deuda corporativa
convencional).

**Qué NO hacer**: no crear una regla `financial_institution => sin
deuda`, ni asumir que toda institución financiera carece de deuda
económica relevante (Munich Re sí tiene strategic debt real).

**Cómo se preserva en trazabilidad**: el Phenomenon Registry documenta
`DEBT` con `current_generality: Capa B (instituciones financieras) /
Capa C (otras economías)`, reflejando la pérdida de homogeneidad.

---

### GAP-09 — Cash concept fragmentation

**Qué ocurrió**: "cash" se trató como una magnitud relativamente
unívoca (cash contable, con ajuste ocasional por caja mínima operativa)
en los Casos 01–05. Desde el Caso 06 (Bancolombia), se fragmenta
explícitamente en al menos cuatro nociones (cash contable, liquidez
prudencial, cash económicamente excedentario, cash distribuible), y el
Caso 08 (Munich Re) añade un régimen dual adicional (IFRS equity vs.
Solvency II eligible own funds vs. SCR vs. distributable excess).

**Por qué importa**: sin este registro, un lector podría seguir tratando
"cash" como una única cifra transferible entre economías, perdiendo la
fragmentación que las instituciones financieras prudenciales demuestran
necesaria.

**Qué NO hacer**: no crear múltiples campos (`excess_cash`,
`distributable_cash`, etc.) sin diseño validado en 1B/1C.

**Cómo se preserva en trazabilidad**: el Phenomenon Registry documenta
`CASH-LIQUIDITY` con las cuatro/más distinciones explícitas, vinculado a
`CF` y `CG`.

---

### GAP-10 — DCF / FCFF conflation in early stages

**Qué ocurrió**: en los Casos 01–05, "DCF" y "FCFF" se usan de forma
prácticamente intercambiable (el horizonte explícito de 5 años se
describe en términos de flujo de caja libre a la firma sin distinguir
el enfoque general de descuento de flujos de su implementación
industrial específica). La distinción explícita "DCF ≠ FCFF industrial"
solo aparece en el Caso 07, y se convierte en fenómenos separados
(`METHOD-FCFF` / `METHOD-DCF-SCOPE`) recién en el Caso 08.

**Por qué importa**: sin esta distinción, la evidencia negativa contra
FCFF como default consolidado en instituciones financieras (Casos
06–08) podría malinterpretarse como evidencia contra el enfoque DCF en
general, cuando el propio Caso 08 aclara explícitamente que no es así.

**Qué NO hacer**: no citar la evidencia negativa contra FCFF de los
Casos 06–08 como si aplicara automáticamente a cualquier enfoque de
flujo descontado.

**Cómo se preserva en trazabilidad**: el Phenomenon Registry separa
`METHOD-FCFF` de `METHOD-DCF-SCOPE`, documentando la fecha y el caso en
que la distinción se hizo explícita.

---

### GAP-11 — DDM → Potential Distributions evolution

**Qué ocurrió**: el Caso 06 introduce DDM (dividend discount model /
dividendos potenciales) como candidato fuerte, con la cautela de que
"dividendo observado ≠ dividendo sostenible". El Caso 07 muestra
evidencia directa (Goldman: recompras >> dividendos) de que DDM literal
es insuficiente, y hace emerger implícitamente un concepto más amplio.
El Caso 08 formaliza esa evolución nombrando explícitamente "Potential
Distributions" como el fenómeno vigente, y declara "DDM literal:
DEMASIADO ESTRECHO".

**Por qué importa**: un lector que solo vea "Potential Distributions" en
esta consolidación podría no reconocer que es una evolución directa de
"DDM", perdiendo la genealogía de por qué el nombre cambió.

**Qué NO hacer**: no editar el Caso 06 para sustituir "DDM" por
"Potential Distributions" retroactivamente. No tratar DDM y Potential
Distributions como fenómenos completamente ajenos entre sí.

**Cómo se preserva en trazabilidad**: el Phenomenon Registry mantiene
`METHOD-DDM` (con `current_status: DDM literal DEMASIADO ESTRECHO;
evolucionó hacia METHOD-POTDIST`) y `METHOD-POTDIST` como fenómenos
distintos pero explícitamente vinculados.

---

### GAP-12 — SOTP maturity shift

**Qué ocurrió**: el Caso 03 (Ecopetrol) menciona la posibilidad de suma
de partes sin evaluarla formalmente ni autorizarla. El Caso 06 la
convierte en "candidato a evaluar por materialidad". El Caso 07 la eleva
a "candidato fuerte y más relevante que en Bancolombia", con
advertencia de interdependencias. El Caso 08 la eleva a "candidato muy
fuerte", con la advertencia más desarrollada de la serie sobre el riesgo
de un SOTP ingenuo.

**Por qué importa**: la madurez de SOTP como candidato creció de forma
gradual y desigual a través de la serie; tratarlo como si hubiera tenido
el mismo nivel de evidencia desde el Caso 03 perdería esa progresión.

**Qué NO hacer**: no declarar SOTP obligatorio en ningún scope sin
evidencia de materialidad específica del caso.

**Cómo se preserva en trazabilidad**: el Phenomenon Registry documenta
`METHOD-SOTP` con la progresión completa Caso 03 → Caso 06 → Caso 07 →
Caso 08 en su `origin_evidence_id` y en la tabla de este documento.

---

### GAP-13 — Current fixed-horizon decision vs. methodological evidence

**Qué ocurrió**: la Decisión 4 del Bloque 1B (horizonte explícito fijo
de 5 años) es preexistente a los ocho casos y no ha sido modificada por
ninguno de ellos. Sin embargo, la evidencia metodológica acumulada
(Tecnoglass sin estado estable evidente a los 5 años; ISA con activos
finitos pero reinversión potencialmente continua; "estado estable"
adquiriendo significados sectoriales distintos en banca, banca de
inversión y seguros) tensiona esa decisión sin llegar a cuestionarla
formalmente en ningún documento congelado.

**Por qué importa**: existe una brecha real entre la decisión vigente
(numérica, fija) y la evidencia metodológica acumulada (conceptual,
tensionante) — brecha que ningún caso individual estaba autorizado a
resolver, y que esta consolidación tampoco resuelve (instrucción
explícita §14 del prompt de ejecución: "NO DECIDIR TODAVÍA").

**Qué NO hacer**: no interpretar esta consolidación como si cambiara el
horizonte a 5 años fijos. No inferir que la tensión documentada
constituye evidencia suficiente para pasar a horizonte variable.

**Cómo se preserva en trazabilidad**: el Phenomenon Registry documenta
`HORIZON` con `current_status: DECISIÓN VIGENTE (5 años fijos), NO
CAMBIADA POR NINGÚN CASO NI POR ESTA CONSOLIDACIÓN`, y la tabla de este
documento preserva la secuencia completa de tensiones sin resolverlas.

---

## 3. Nota de cierre

Ninguno de los trece gaps documentados en este archivo fue "corregido"
en los documentos congelados de los Casos 01–08. Cada uno se registra
aquí exactamente como se manifestó en la secuencia original, con su
fecha/caso de origen y su estado actual, para que la genealogía completa
sea reconstruible sin necesidad de releer los 16 documentos completos
cada vez.
