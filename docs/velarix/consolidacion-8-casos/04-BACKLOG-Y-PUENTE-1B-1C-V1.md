# Backlog Metodológico y Puente a 1B/1C — Consolidación de los Ocho Casos — V1

**Fecha:** 2026-08-14
**Estado:** Documento de consolidación. NO autoriza implementación. NO
selecciona método de valoración. NO inicia Bloque 1E. Los siete frentes
de este documento quedan **AUTORIZADOS PARA ESTUDIO FUTURO** en el
Bloque 1B/1C — la implementación de cualquiera de ellos permanece **NO
AUTORIZADA**.
**Fuente:** `01-REGISTRO-FENOMENOS-Y-MATRIZ-V1.md`,
`02-REGISTRO-EVIDENCIA-V1.md`, `03-GENEALOGIAS-Y-GAPS-V1.md`.

---

## 1. Códigos de disposición del backlog metodológico

| Código | Significado |
|---|---|
| `M-A` | FORMALIZAR EN METODOLOGÍA |
| `M-B` | LLEVAR A DISEÑO 1B/1C |
| `M-C` | CONCEPTO / DECISIÓN HUMANA SIN ESTRUCTURA |
| `M-D` | ALERTA / PREGUNTA |
| `M-E` | MÁS EVIDENCIA |
| `M-F` | SECTORIAL / CONDICIONADO |
| `M-G` | FUSIONAR |
| `M-H` | DIVIDIR |
| `M-I` | DESCARTAR ABSTRACCIÓN |
| `M-J` | NO DECIDIR TODAVÍA |

Estos códigos M-A…M-J son distintos de los Candidatos A–G del
Phenomenon Registry — no deben confundirse entre sí.

---

## 2. Backlog metodológico consolidado (resumen ejecutivo por disposición)

### M-A — Formalizar en metodología

R1, R2, R4 (formulación base), R5, R7, R8, R3 (núcleo conceptual), NWC
(guardrail: no universal, no eliminado), CAPEX (separación conceptual
de reinversión), REINVESTMENT, DEBT (guardrail), NET-DEBT (guardrail,
no eliminado), CASH-LIQUIDITY (distinciones), CAPITAL (distinciones),
CB (como principio condicional), STEADY-STATE (el principio, no un
significado único), PROCESS-ARCH (arquitectura universal del proceso ≠
arquitectura financiera del método).

### M-B — Llevar a diseño 1B/1C

Los siete frentes de la sección 4 de este documento: SCOPE, PURPOSE,
PERIMETER, ANALYSIS-UNIT, CC (atribución temporal), CF (disponibilidad
económica), y gobierno/trazabilidad de selección de método
(METHOD-SELECTION).

### M-C — Concepto / decisión humana sin estructura

METHOD-EV (Enterprise Value, condicionado por scope), DISCOUNT-RATE
(WACC/Cost of Equity — tensión sin resolver).

### M-D — Alerta / pregunta

R8 (como mecanismo), SUPPLIER-FIN, LEASES.

### M-E — Más evidencia

R3 (representación general de `assumption_relations`), CA (mecánica
específica: netting/collateral/reinsurance), CD (derechos económicos /
propiedad dinámica).

### M-F — Sectorial / condicionado

METHOD-FCFF, METHOD-DCF-SCOPE, METHOD-RI, METHOD-FCFE, METHOD-POTDIST,
METHOD-SOTP, CG (puente capital / capacidad de distribución, Capa B).

### M-G — Fusionar

OBS-GS-COMP (con R3 o R7, condicionalmente); OBS-MUNICH-EXPOSURE (con
CA y/o R3/CG, condicionalmente).

### M-H — Dividir

CE-HIST → MEASUREMENT-BASIS / MONETARY-REGIME (conceptualmente, sin
IDs técnicos definitivos ni implementación).

### M-I — Descartar abstracción

METHOD-DDM literal (dividendos históricos = capacidad sostenible de
distribución) — reemplazado conceptualmente por METHOD-POTDIST. La
segunda abstracción descartada explícitamente por esta consolidación es
**la arquitectura financiera universal aplicable a todas las empresas**
(ver `00-INDICE-Y-SINTESIS-MAESTRA-V1.md` §6) — no un fenómeno del
registro, sino el marco central que esta consolidación descarta.

### M-J — No decidir todavía

HORIZON (horizonte explícito, 5 años fijos — decisión vigente, no
cambiada), G (crecimiento terminal — decisión vigente, no cambiada).

---

## 3. Elementos que NO deben llegar a diseño todavía

Registrados explícitamente como **NO AUTORIZADOS / NO JUSTIFICADOS
AHORA** (lista consolidada, consistente con §17 del prompt de
ejecución de esta tarea y con las prohibiciones explícitas de cada uno
de los ocho casos):

- Rediseño general del grafo de `assumption_relations`.
- `case_perimeter` como tabla.
- `economic_lifecycle`.
- `economic_period`.
- `measurement_basis` field.
- Enum de régimen monetario.
- `availability` booleano.
- `restricted_asset` como entidad universal.
- Modelo de fungibilidad.
- `capital_bridge` como tabla.
- `distributable_capital` field.
- `regulatory_capital` schema universal.
- Motor de netting.
- Motor de collateral.
- Motor de reinsurance.
- Motor IFRS 17.
- Motor CSM.
- Motor de risk adjustment.
- Motor de reservas.
- `bank_mode`.
- `insurance_mode`.
- `industry_type`.
- `valuation_method` automático.
- Motor de Residual Income.
- Motor de FCFE.
- Motor de Potential Distributions.
- Motor de SOTP.
- `cost_of_equity` field.
- Automatización o pluralidad de WACC.
- Horizonte variable.
- g automática/dinámica.
- Un "Candidato H" para la observación de compensación de Goldman o para la observación Munich de exposición/retención/capital.
- Cualquier schema, tabla, migración, UI, Edge Function o automatización derivada de este documento o de la consolidación en su conjunto.

Esta lista aplica a **todos** los fenómenos del Phenomenon Registry,
no solo a los mencionados aquí explícitamente — `implementation_status
= NOT_AUTHORIZED` para los 46 fenómenos, sin excepción.

---

## 4. Los siete frentes autorizados para el puente a 1B/1C

### Frente 1 — SCOPE

**A. Problema demostrado**: la necesidad de determinar a qué objeto o
parte de la organización aplica una afirmación, supuesto, evidencia o
cálculo, dentro de organizaciones con múltiples negocios, geografías,
niveles societarios o entidades reguladas.

**B. Casos que lo soportan**: C02 (origen), C03 (grupo/negocio/porción
atribuible tras NCI), C05 (grupo consolidado/holding/filial/
concesión/proyecto/activo/atribución al accionista), C06 (holding ≠
banco operativo ≠ grupo consolidado — el ejemplo más directo), C08
(IFRS vs. Solvency II como scopes/propósitos distintos del mismo
Grupo).

**C. Casos que limitan o matizan la generalización**: C04 no aportó
evidencia independiente que elevara el nivel más allá de C03; ningún
caso demostró que la respuesta correcta sea modelar siempre todos los
niveles posibles de scope.

**D. Formulación exacta actual**: "determinar a qué objeto o parte de la
organización aplica una afirmación, supuesto, evidencia o cálculo" —
`NECESIDAD CONCEPTUAL MUY FUERTEMENTE RESPALDADA`.

**E. Generalidad**: Capa A (necesidad) → respuesta concreta en Capa C
(el scope específico de cada caso).

**F. Riesgo si se ignora**: aplicar un supuesto determinado para un
scope a otro scope distinto sin advertirlo (ej. tasa de holding
aplicada al banco operativo; supuesto de impairment aplicado a
valoración de equity).

**G. Riesgo de sobreingeniería**: modelar automáticamente todos los
niveles posibles de scope de una organización, sin criterio de
materialidad.

**H. Mínimo diseño que 1B/1C debe estudiar**: cómo representar el scope
de un supuesto/afirmación de forma trazable sin imponer un enum
universal ni un árbol obligatorio; cómo relacionar scope con purpose y
con la unidad de análisis elegida.

**I. Qué NO debe implementar**: enum universal de scope; árbol
obligatorio de entidades; valoración automática por scope.

**J. Preguntas abiertas**: ¿scope necesita jerarquía (ej. país dentro de
segmento) o es una dimensión plana? ¿Cómo se documenta sin convertirse
en carga de captura desproporcionada para casos simples?

**K. Estado**: DISEÑO AUTORIZADO PARA ESTUDIO FUTURO. IMPLEMENTACIÓN NO
AUTORIZADA.

---

### Frente 2 — PURPOSE

**A. Problema demostrado**: la necesidad de preservar para qué fue
construida originalmente una cifra, supuesto o representación, y para
qué se usa ahora, cuando ello afecte su interpretación.

**B. Casos que lo soportan**: C02 (origen, evidencia débil), C04
(tasas de impairment/UGE/fair value inmobiliario — primer salto
fuerte), C05 (WACC/tasas regulatorias, información segmentada), C06
(fuerte, sin elevar de nivel), C07 (mismo instrumento, distinto
significado según financing/hedge/liquidez — reduce materialmente la
brecha frente a scope), C08 (IFRS vs. Solvency II — nivel máximo,
equiparado a scope).

**C. Casos que limitan o matizan la generalización**: C03 no aportó
evidencia directa nueva sobre propósito de una cifra específica; ningún
caso demostró que `purpose` deba representarse con un catálogo cerrado.

**D. Formulación exacta actual**: "preservar para qué fue construida
originalmente una cifra, supuesto o representación y para qué se usa
ahora cuando ello afecte su interpretación" — `NECESIDAD CONCEPTUAL MUY
FUERTEMENTE RESPALDADA`, equiparada a scope sin fusionarse con él.

**E. Generalidad**: Capa A (necesidad) → Capa C (propósito específico).

**F. Riesgo si se ignora**: reutilizar una cifra determinada para un
propósito (prueba de deterioro, covenant, planificación interna) como
si fuera automáticamente válida para una valoración profesional de
equity.

**G. Riesgo de sobreingeniería**: un catálogo universal cerrado de
propósitos posibles.

**H. Mínimo diseño que 1B/1C debe estudiar**: si la necesidad conceptual
de comprender `purpose` requiere necesariamente un campo `purpose`, o
puede resolverse mediante contexto/procedencia/narrativa ya prevista en
la especificación vigente.

**I. Qué NO debe implementar**: catálogo universal cerrado de
propósitos; fusión automática con `scope`.

**J. Preguntas abiertas**: ¿`purpose` necesita representación estructural
propia, o basta con narrativa/procedencia? ¿Cómo se relaciona con
`METHOD-SELECTION`?

**K. Estado**: DISEÑO AUTORIZADO PARA ESTUDIO FUTURO. IMPLEMENTACIÓN NO
AUTORIZADA.

---

### Frente 3 — PERIMETER / comparabilidad

**A. Problema demostrado**: eventos como adquisiciones, ventas,
reclasificaciones, cambios de consolidación, NCI, JVs/asociadas y
regímenes duales de reporte pueden afectar la comparabilidad de las
cifras entre periodos y la atribución económica al accionista final.

**B. Casos que lo soportan**: C03 (ISA al 51.4% de control económico
consolidada al 100%), C04 (estructuras "Viva" al 26.01%, cambio de
perímetro de Argentina reconocido por la propia compañía), C05 (control
≠ propiedad económica concentrado dentro de la propia entidad
estudiada), C06 (primera institución financiera: holding vs. banco
operativo, Banistmo), C07 (segunda institución financiera, GBM/AWM/
Platform Solutions), C08 (IFRS vs. Solvency II — evidencia directa de
que un mismo grupo requiere perímetros distintos según propósito).

**C. Casos que limitan o matizan la generalización**: C02 solo aportó
hipótesis débil, sin evidencia cuantificada; ningún caso demostró una
solución de representación general.

**D. Formulación exacta actual**: `PROBLEMA MUY FUERTEMENTE DEMOSTRADO
EN MÚLTIPLES ECONOMÍAS; MUNICH RE APORTA EVIDENCIA DIRECTA DE QUE UN
MISMO GRUPO PUEDE REQUERIR PERÍMETROS Y MÉTODOS DE REPRESENTACIÓN
DIFERENTES SEGÚN EL PROPÓSITO.`

**E. Generalidad**: Capa A (el problema) → Capa C (la solución concreta
por caso).

**F. Riesgo si se ignora**: tratar el perímetro consolidado como
equivalente a la atribución económica final al accionista, sobre- o
sub-estimando materialmente el valor atribuible.

**G. Riesgo de sobreingeniería**: modelar entidad por entidad o negocio
por negocio en cualquier caso, incluso cuando no sea material.

**H. Mínimo diseño que 1B/1C debe estudiar**: una representación
narrativa/estructurada mínima que documente perímetro, NCI/JVs
relevantes y atribución, sin obligar a modelar cada entidad.

**I. Qué NO debe implementar**: `case_perimeter` como tabla o schema;
árbol universal de entidades; motor automático de NCI/JV.

**J. Preguntas abiertas**: ¿qué nivel mínimo de documentación de
perímetro es suficiente para materialidad razonable? ¿Cómo se relaciona
con `scope` y con `ANALYSIS-UNIT`?

**K. Estado**: DISEÑO AUTORIZADO PARA ESTUDIO FUTURO. IMPLEMENTACIÓN NO
AUTORIZADA.

---

### Frente 4 — UNIDAD ECONÓMICA ADECUADA (ANALYSIS-UNIT)

**A. Problema demostrado**: qué unidad económica se considera apropiada
para el análisis y por qué; entidad legal ≠ segmento contable ≠ máxima
granularidad ≠ necesariamente unidad de valoración.

**B. Casos que lo soportan**: C06 (Grupo Cibest ≠ Bancolombia S.A. ≠
unidad regulatoria ≠ flujo disponible al accionista), C07 (unidad
económica puede no coincidir con segmento contable dentro de la misma
entidad legal — GBM/AWM/Platform Solutions), C08 (field of business ≠
reportable segment ≠ entidad legal ≠ unidad de valoración — Global
Specialty Insurance administrado dentro de Reinsurance).

**C. Casos que limitan o matizan la generalización**: los Casos 01–05
no formularon explícitamente este frente como necesidad distinta de
`scope`, aunque contienen evidencia consistente (ej. Terpel:
negocio×volumen×margen×geografía).

**D. Formulación exacta actual**: "la unidad económicamente adecuada de
análisis puede no coincidir con entidad legal, segmento contable, ni
máxima granularidad disponible" — `NECESIDAD CONCEPTUAL MUY FUERTEMENTE
RESPALDADA`.

**E. Generalidad**: Capa A (necesidad) → Capa C (unidad concreta).

**F. Riesgo si se ignora**: asumir que "la empresa" o "el segmento
contable" es siempre un objeto suficientemente preciso para valorar.

**G. Riesgo de sobreingeniería**: exigir una redefinición de unidad de
análisis para cada supuesto individual, en vez de una decisión
documentada a nivel de caso/propósito.

**H. Mínimo diseño que 1B/1C debe estudiar**: cómo documentar la
selección final de unidad de análisis (quién la elige, con qué
evidencia, con qué alternativas descartadas) sin automatizar la
selección.

**I. Qué NO debe implementar**: selección automática de unidad de
análisis basada en segmentos contables o en máxima granularidad
disponible.

**J. Preguntas abiertas**: ¿la unidad de análisis es una decisión única
por caso, o puede variar por método/propósito dentro del mismo caso?

**K. Estado**: DISEÑO AUTORIZADO PARA ESTUDIO FUTURO. IMPLEMENTACIÓN NO
AUTORIZADA.

---

### Frente 5 — ATRIBUCIÓN TEMPORAL / CORTE (CC)

**A. Problema demostrado**: qué fenómeno económico atribuimos al corte y
con qué información disponible a esa fecha; hasta diez momentos
económicos distinguibles pueden diferir entre sí (fecha del hecho,
reconocimiento, caja, información disponible/conocida, información
posterior).

**B. Casos que lo soportan**: C03 (FEPC: causación 2024, cobro 2025;
desfase entre cierre y publicación), C04 (la propia compañía declara
que un cambio de perímetro posterior limita la comparabilidad), C05
(construcción/reconocimiento/puesta en servicio/remuneración/recaudo en
momentos distintos), C06 (reorganización societaria 2025, acuerdo
Banistmo), C07 (commitment→execution→recognition→settlement;
backlog→transaction→fee recognition), C08 (contrato; cobertura;
ocurrencia; reporte; conocimiento posterior; reconocimiento;
actualización de reservas; settlement; recoveries; valuation date).

**C. Casos que limitan o matizan la generalización**: C01 y C02 no
distinguían explícitamente estas fechas entre sí; ningún caso propuso
una representación estructurada, solo el principio.

**D. Formulación exacta actual**: `PROBLEMA METODOLÓGICO MUY
FUERTEMENTE RESPALDADO POR MÚLTIPLES CASOS`.

**E. Generalidad**: Capa A (principio) → Capa C (fechas concretas
relevantes por economía).

**F. Riesgo si se ignora**: proyectar mecánicamente un flujo observado
como si representara el desempeño económico del mismo período cuando
existe un mecanismo de desfase documentado.

**G. Riesgo de sobreingeniería**: crear un campo por cada una de las
hasta diez fechas potencialmente relevantes en toda valoración,
independientemente de su materialidad.

**H. Mínimo diseño que 1B/1C debe estudiar**: qué subconjunto mínimo de
fechas es materialmente relevante caso por caso, y cómo se documenta la
distinción entre desempeño económico del período y flujo de caja
observado del período.

**I. Qué NO debe implementar**: `economic_period` como campo o entidad
nueva.

**J. Preguntas abiertas**: ¿existe un principio único que organice las
hasta diez fechas posibles, o el diseño debe ser condicional por
economía?

**K. Estado**: DISEÑO AUTORIZADO PARA ESTUDIO FUTURO. IMPLEMENTACIÓN NO
AUTORIZADA.

---

### Frente 6 — DISPONIBILIDAD ECONÓMICA DE RECURSOS (CF)

**A. Problema demostrado**: el reconocimiento, propiedad o control de un
recurso no implica necesariamente que esté económicamente disponible
para cualquier propósito.

**B. Casos que lo soportan**: C05 (origen: efectivo restringido en
ISA), C06 (cash contable ≠ liquidez prudencial ≠ cash excedentario ≠
cash distribuible), C07 (GCLA ≈US$466B + collateral/reuse/repledge),
C08 (elevación formal: restraints on disposal + fungibilidad, con
ajuste posterior sin restricción material al Group SCR).

**C. Casos que limitan o matizan la generalización**: ningún caso
demostró que toda restricción puntual implique indisponibilidad total,
ni que la ausencia de restricción reportada implique disponibilidad
plena — ambos extremos quedan explícitamente descartados por el propio
Caso 08.

**D. Formulación exacta actual**: `CANDIDATO F — DISPONIBILIDAD
ECONÓMICA DE RECURSOS — EVIDENCIA TRANSVERSAL FUERTEMENTE REFORZADA EN
CUATRO ECONOMÍAS RADICALMENTE DISTINTAS: ISA, BANCOLOMBIA, GOLDMAN
SACHS Y MUNICH RE.`

**E. Generalidad**: Capa A (principio) → Capa B (mecánica en
instituciones financieras prudenciales) → Capa C (mecanismo específico).

**F. Riesgo si se ignora**: asumir que todo recurso reconocido (cash,
inversión, collateral) es distribuible o transferible sin verificar
restricciones contractuales, prudenciales o societarias.

**G. Riesgo de sobreingeniería**: un campo `availability` booleano que
fuerce una clasificación binaria disponible/restringido.

**H. Mínimo diseño que 1B/1C debe estudiar**: cómo representar un
espectro de disponibilidad (dependiente de scope, purpose, entidad,
regulación, contractualidad, fungibilidad, transferibilidad,
compromisos) sin reducirlo a un booleano.

**I. Qué NO debe implementar**: `availability` boolean; `restricted_asset`
como entidad universal; modelo de fungibilidad.

**J. Preguntas abiertas**: ¿qué factores mínimos (de los siete
identificados: scope, purpose, entidad, regulación, contractualidad,
fungibilidad, transferibilidad, compromisos) son suficientes para
documentar disponibilidad sin sobrecargar el análisis?

**K. Estado**: DISEÑO AUTORIZADO PARA ESTUDIO FUTURO. IMPLEMENTACIÓN NO
AUTORIZADA.

---

### Frente 7 — GOBIERNO Y TRAZABILIDAD DE SELECCIÓN DE MÉTODO (METHOD-SELECTION)

**A. Problema demostrado**: debe preservarse trazabilidad de: objeto
económico valorado → scope → purpose → perímetro → unidad económica →
métodos considerados → compatibilidad/incompatibilidad → evidencia →
limitaciones → método finalmente aprobado → aprobador.

**B. Casos que lo soportan**: C06 (formulación explícita, cinco métodos
documentados para Bancolombia sin aprobar ninguno), C07 (seis
resultados de métodos documentados para Goldman), C08 (diez resultados
de métodos documentados para Munich Re — el nivel de documentación
metodológica más profundo de la serie).

**C. Casos que limitan o matizan la generalización**: los Casos 01–05
no enfrentaron explícitamente la pregunta de selección de método entre
alternativas materialmente distintas (EV/FCFF vs. Residual Income vs.
FCFE vs. Potential Distributions vs. SOTP); su necesidad emerge
específicamente con las tres instituciones financieras prudenciales.

**D. Formulación exacta actual**: necesidad de trazabilidad completa
desde el objeto económico valorado hasta el método finalmente aprobado
y su aprobador — `NECESIDAD METODOLÓGICA RECONOCIDA — NO DEBE
RESOLVERSE TODAVÍA` (clasificación explícita del Caso 07, reporte de
contraste, punto 11).

**E. Generalidad**: Capa A — es el marco que organiza a todos los
`METHOD-*` del Phenomenon Registry, no un método adicional.

**F. Riesgo si se ignora**: aprobar un método sin registro trazable de
por qué era compatible con la economía y el objeto valorado, o por qué
se descartaron las alternativas.

**G. Riesgo de sobreingeniería**: un selector automático de método
(`valuation_method` enum con lógica condicional automática).

**H. Mínimo diseño que 1B/1C debe estudiar**: una estructura documental
(no un motor) que permita registrar los métodos considerados, su
compatibilidad/incompatibilidad razonada, y la decisión final aprobada
por un humano.

**I. Qué NO debe implementar**: `valuation_method` field automático;
enum de método; "method engine"; selector automático por industria o
scope.

**J. Preguntas abiertas**: ¿esta trazabilidad se representa como
extensión de `case_assumptions`/`expedient_questions` ya existentes, o
requiere una entidad conceptual propia?

**K. Estado**: DISEÑO AUTORIZADO PARA ESTUDIO FUTURO. IMPLEMENTACIÓN NO
AUTORIZADA.

---

## 5. Elementos financieros — disposición consolidada (no son de los siete frentes, pero forman parte del backlog)

| Elemento | Disposición | Estado consolidado |
|---|---|---|
| NWC | M-A | No universal obligatorio; material en economías industriales/retail, no en core bancario/asegurador. |
| CAPEX | M-A | Manifestación contable de inversión en determinadas economías; no totalidad de la reinversión. |
| REINVESTMENT | M-A | Separado conceptualmente de CAPEX desde C06; sin fórmula universal. |
| DEBT | M-A | Financial liability ≠ automáticamente deuda económica externa; institución financiera ≠ automáticamente sin deuda. |
| NET-DEBT | M-A | No métrica universal obligatoria ni puente EV→Equity Value obligatorio; puede ser válido según scope/método/economía. |
| CASH-LIQUIDITY | M-A | Cuatro/más distinciones (contable/liquidez/excedentario/distribuible; IFRS equity/eligible own funds/SCR/distributable excess). |
| CAPITAL | M-A | Book equity ≠ capital regulatorio ≠ capital requerido ≠ capital excedentario ≠ capital distribuible. |
| METHOD-EV | M-C | No arquitectura universal obligatoria; puede ser útil en determinados scopes. |
| METHOD-FCFF | M-F | No default universal consolidado; especialmente no apropiado en las tres instituciones prudenciales; no eliminado. |
| METHOD-DCF-SCOPE | M-F | DCF ≠ FCFF industrial; conceptualmente respaldado como posibilidad, no obligatorio por scope. |
| METHOD-RI | M-F | Candidato muy fuerte en Bancolombia, Goldman Sachs y Munich Re; no aprobado. |
| METHOD-FCFE | M-F | Candidato fuerte en familia prudencial; no aprobado. |
| METHOD-DDM | M-I | DDM literal descartado como abstracción suficiente; ver METHOD-POTDIST. |
| METHOD-POTDIST | M-F | Candidato muy fuerte en familia prudencial; no aprobado. |
| METHOD-SOTP | M-F | Candidato fuerte/muy fuerte según economía; segmentos contables ≠ unidades obligatorias de valoración. |
| DISCOUNT-RATE | M-C | WACC no universal, no eliminado; Cost of Equity conceptualmente natural en métodos directos de equity, no aprobado. |
| METHOD-SELECTION | M-B | Ver Frente 7 arriba. |
| HORIZON | M-J | Decisión vigente: 5 años fijos por ahora; no cambiada. |
| STEADY-STATE | M-A | Steady state ≠ resultados idénticos todos los años; puede ser through-the-cycle; definición concreta depende de economía+objeto+método. |
| G | M-J | Decisión vigente; g debe ser coherente con steady state, reinversión y retornos; no se aprueba valor nuevo. |

---

## 6. Sugerencia de un posible sexto/séptimo documento

Durante la elaboración de esta consolidación no se identificó una
necesidad documental estrictamente necesaria de un documento adicional
más allá de los cinco autorizados. Como sugerencia, no como creación:
un futuro "Glosario de Vocabulario Consolidado" (una tabla de una sola
página con nombre actual, ID estable y una línea de definición para
cada uno de los 46 fenómenos) podría facilitar el uso operativo de este
registro por parte de un revisor externo que no necesite el detalle
completo del Phenomenon Registry. No se crea en esta tarea.
