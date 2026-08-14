# Registro de Fenómenos y Matriz Case × Phenomenon — Consolidación de los Ocho Casos — V1

**Fecha:** 2026-08-14
**Estado:** Documento de consolidación. NO autoriza implementación. NO
selecciona método de valoración. NO reabre Bloque 1E. Ver
`00-INDICE-Y-SINTESIS-MAESTRA-V1.md` para el contexto completo de esta
consolidación.
**Fuente de evidencia**: `02-REGISTRO-EVIDENCIA-V1.md` (evidence IDs
formato E-01-001 hasta E-08-022) y los 16 documentos congelados de los Casos 01–08.

---

## 0. Disciplina de este documento

Todos los campos `implementation_status` de este registro son
`NOT_AUTHORIZED`, sin excepción. Ningún `current_status` de este
documento equivale a "ley universal" ni a "confirmado". Donde un
candidato no existía todavía al momento de un caso determinado, la
matriz usa `—` en esa celda, en vez de fingir que fue investigado.

`IMPLEMENTATION_STATUS = NOT_AUTHORIZED` para **todos** los 45
fenómenos de este registro, sin excepción.

---

## 1. Phenomenon Registry

Cada entrada sigue el esquema: `phenomenon_id`, `current_name`,
`current_formulation`, `object_type`, `origin_case`,
`origin_evidence_id`, `origin_epistemic_class`, `current_generality`,
`related_phenomena`, `possible_overlap`, `current_status`,
`open_questions`, `wrong_implementation_risk`,
`non_representation_risk`, `disposition`, `implementation_status`.

`disposition` usa los códigos de `04-BACKLOG-Y-PUENTE-1B-1C-V1.md` §1
(M-A a M-J).

---

### R1 — Contabilidad ≠ economía

- **current_name**: Contabilidad ≠ economía
- **current_formulation**: La clasificación contable correcta debe preservarse como evidencia, pero no determina automáticamente la interpretación económica ni el tratamiento de valoración. La interpretación económica tampoco autoriza borrar o reemplazar la contabilidad.
- **object_type**: principio transversal del proceso
- **origin_case**: C01
- **origin_evidence_id**: E-01-001
- **origin_epistemic_class**: HD/IA
- **current_generality**: Capa A
- **related_phenomena**: R2, R4, CA, R6-HIST
- **possible_overlap**: Con R4 (la descomposición según dimensión económica es una aplicación de R1); con CA (el puente bruto→neto es un caso de R1 aplicado a exposición financiera).
- **current_status**: PATRÓN OBSERVADO EN OCHO CASOS
- **open_questions**: ¿Qué umbral de materialidad activa la exigencia de documentar la separación contable/económica en un caso concreto?
- **wrong_implementation_risk**: Convertir R1 en una regla que descarte o "corrija" automáticamente la clasificación contable reportada.
- **non_representation_risk**: Tratar la clasificación contable como la interpretación económica final, heredando sesgos de reporte sin cuestionarlos.
- **disposition**: M-A — FORMALIZAR EN METODOLOGÍA
- **implementation_status**: NOT_AUTHORIZED

### R2 — Observado ≠ normalizado ≠ proyectado

- **current_name**: Observado ≠ normalizado ≠ proyectado
- **current_formulation**: Las tres capas (observado/reportado, normalizado, proyectado) deben coexistir y mantenerse trazables. Nunca sobrescribir silenciosamente lo reportado.
- **object_type**: principio transversal del proceso
- **origin_case**: C01
- **origin_evidence_id**: E-01-002
- **origin_epistemic_class**: HD
- **current_generality**: Capa A
- **related_phenomena**: R1, R5, CC
- **possible_overlap**: Con CC (atribución temporal) cuando el desfase entre capas es de naturaleza temporal (ej. FEPC).
- **current_status**: PATRÓN OBSERVADO EN OCHO CASOS
- **open_questions**: ¿Qué evidencia mínima es suficiente para aprobar una normalización concreta?
- **wrong_implementation_risk**: Un motor que aplique normalizaciones automáticamente sin aprobación humana trazable.
- **non_representation_risk**: Presentar una única cifra (reportada o normalizada) como si fuera la única versión válida, perdiendo la trazabilidad de las otras capas.
- **disposition**: M-A — FORMALIZAR EN METODOLOGÍA
- **implementation_status**: NOT_AUTHORIZED

### R3 — Relaciones entre supuestos

- **current_name**: Relaciones entre supuestos
- **current_formulation**: Existen relaciones materiales entre supuestos, variables y restricciones que no deben ignorarse (núcleo). La representación general de esas relaciones (`assumption_relations`) permanece insuficientemente validada.
- **object_type**: principio transversal del proceso (núcleo) + entidad conceptual sin diseño (`assumption_relations`)
- **origin_case**: C01
- **origin_evidence_id**: E-01-003
- **origin_epistemic_class**: DC
- **current_generality**: Capa A (núcleo); representación — sin generalidad validada
- **related_phenomena**: R4, R8, CA, OBS-MUNICH-EXPOSURE, OBS-GS-COMP
- **possible_overlap**: Con OBS-GS-COMP y OBS-MUNICH-EXPOSURE, que podrían resolverse como instancias de R3 en vez de candidatos independientes.
- **current_status**: PATRÓN OBSERVADO EN OCHO CASOS (núcleo) + REPRESENTACIÓN GENERAL INSUFICIENTEMENTE VALIDADA
- **open_questions**: ¿Un grafo causal simple A→B es adecuado, o se necesitan cadenas, bidireccionalidad, condicionalidad, feedback y decisiones humanas? (Ver GAP en `03-GENEALOGIAS-Y-GAPS-V1.md`.)
- **wrong_implementation_risk**: Diseñar `assumption_relations` como grafo causal ingenuo A→B antes de que la representación esté validada.
- **non_representation_risk**: Cambiar un supuesto sin advertir qué otros supuestos dependen de él, produciendo un resultado internamente inconsistente sin que nadie lo note.
- **disposition**: núcleo → M-A — FORMALIZAR; representación → M-E — MÁS EVIDENCIA
- **implementation_status**: NOT_AUTHORIZED

### R4 — Descomposición según dimensión económica relevante

- **current_name**: Descomposición según dimensión económica relevante
- **current_formulation**: Una partida, variable, exposición o magnitud material puede requerir descomposición según la dimensión que explique su comportamiento económico para el propósito analítico; debe evitarse granularidad adicional que no cambie materialmente la interpretación.
- **object_type**: principio transversal del proceso
- **origin_case**: C01 (formulación inicial, sesgada a lo contable); reformulado en C02
- **origin_evidence_id**: E-01-004 (origen); E-02-001 (reformulación)
- **origin_epistemic_class**: HD → IM
- **current_generality**: Capa A
- **related_phenomena**: R1, R7, CA (extensión candidata a cifras netas/movimientos)
- **possible_overlap**: Con CA, cuando la descomposición se aplica a una cifra neta o a un movimiento agregado en lugar de a una partida/cuenta.
- **current_status**: PATRÓN OBSERVADO EN OCHO CASOS (formulación base); extensión a cifras netas/movimientos A VALIDAR EN CASOS FUTUROS
- **open_questions**: ¿Qué umbral de materialidad activa la exigencia de descomposición frente a dejar una cuenta como nota única?
- **wrong_implementation_risk**: Un enum universal cerrado de "dimensiones de descomposición" o hacer `account_components` obligatorio para toda cuenta material.
- **non_representation_risk**: Aplicar granularidad uniforme (o ausente) sin considerar qué dimensión explica realmente el comportamiento económico de la partida.
- **disposition**: M-A — FORMALIZAR EN METODOLOGÍA
- **implementation_status**: NOT_AUTHORIZED

### R5 — Estado de conocimiento explícito

- **current_name**: Estado de conocimiento explícito
- **current_formulation**: Cada afirmación necesita un estado de conocimiento explícito (hecho, inferencia, hipótesis, desconocido, pregunta, decisión, aprobación). "Conozco la cifra" ≠ "sé interpretarla económicamente" para el propósito del análisis.
- **object_type**: principio transversal del proceso
- **origin_case**: C01
- **origin_evidence_id**: E-01-005
- **origin_epistemic_class**: DC
- **current_generality**: Capa A
- **related_phenomena**: R6-HIST, SCOPE, PURPOSE
- **possible_overlap**: Con R6-HIST, cuyo fenómeno original (Caso 01) se absorbe conceptualmente en R5 desde esta consolidación (ver GAP-01).
- **current_status**: SOBREVIVE Y SE PROFUNDIZA
- **open_questions**: ¿El matiz "conozco la cifra pero no sé interpretarla" requiere un valor epistémico nuevo, o basta con la clasificación vigente combinada con una nota de interpretación pendiente?
- **wrong_implementation_risk**: Crear un enum epistemológico nuevo sin evidencia suficiente de que el existente (hecho/inferencia/hipótesis/desconocido/pregunta/decisión/aprobación) sea insuficiente.
- **non_representation_risk**: Presentar una cifra conocida como si su interpretación económica también estuviera resuelta.
- **disposition**: M-A — FORMALIZAR EN METODOLOGÍA
- **implementation_status**: NOT_AUTHORIZED

### R6-HIST — Declarar información insuficiente (formulación histórica del Caso 01)

- **current_name**: R6 histórico (Caso 01) — declarar información insuficiente
- **current_formulation**: El sistema debe poder declarar "información insuficiente", sin rellenar automáticamente.
- **object_type**: principio transversal del proceso (histórico)
- **origin_case**: C01
- **origin_evidence_id**: E-01-006
- **origin_epistemic_class**: DC
- **current_generality**: Capa A (absorbido)
- **related_phenomena**: R5, SCOPE, PURPOSE
- **possible_overlap**: Desde el Caso 02, "R6" pasa a usarse para método de determinación / `scope` / `purpose` — un fenómeno distinto que comparte el mismo número. Ver GAP-01 en `03-GENEALOGIAS-Y-GAPS-V1.md`.
- **current_status**: ABSORBIDO CONCEPTUALMENTE EN R5 para la formulación transversal actual
- **open_questions**: Ninguna nueva; el gap queda registrado como traceability gap, no como pregunta activa.
- **wrong_implementation_risk**: Confundir R6-HIST con el uso posterior de "R6" (scope/purpose) al implementar cualquier estructura futura.
- **non_representation_risk**: Perder la genealogía del Caso 01 al asumir que "R6" siempre significó scope/purpose.
- **disposition**: M-A (absorbido en R5) — no requiere formalización propia
- **implementation_status**: NOT_AUTHORIZED

### SCOPE — Alcance

- **current_name**: Scope (alcance)
- **current_formulation**: Necesidad de determinar a qué objeto o parte de la organización aplica una afirmación, supuesto, evidencia o cálculo (empresa completa, filial, país, segmento, UGE, producto, contrato, grupo consolidado, porción atribuible después de NCI, entidad regulada, holding).
- **object_type**: necesidad conceptual sin estructura
- **origin_case**: C02
- **origin_evidence_id**: E-02-002
- **origin_epistemic_class**: DC
- **current_generality**: Capa A/C (según objeto concreto)
- **related_phenomena**: PURPOSE, PERIMETER, ANALYSIS-UNIT, R6-HIST
- **possible_overlap**: Con PERIMETER (scope de un supuesto vs. perímetro de consolidación del caso) y con ANALYSIS-UNIT (scope vs. unidad económica de valoración).
- **current_status**: NECESIDAD CONCEPTUAL MUY FUERTEMENTE RESPALDADA (alcanzada en C08; sin nueva evidencia que la eleve más allá de C03 en C04/C05/C06/C07)
- **open_questions**: ¿Necesita jerarquía (ej. país dentro de segmento) o es una dimensión plana? ¿Problema de scope implica obligación de modelar todos los niveles? (No — explícitamente descartado.)
- **wrong_implementation_risk**: Un enum universal de scope, un árbol obligatorio, o valoración automática por scope.
- **non_representation_risk**: Aplicar un supuesto determinado para un scope distinto sin advertir la diferencia (ej. tasa de holding aplicada al banco operativo).
- **disposition**: M-B — LLEVAR A DISEÑO 1B/1C
- **implementation_status**: NOT_AUTHORIZED

### PURPOSE — Propósito

- **current_name**: Purpose (propósito)
- **current_formulation**: Necesidad de preservar para qué fue construida originalmente una cifra, supuesto o representación, y para qué se usa ahora, cuando ello afecte su interpretación.
- **object_type**: necesidad conceptual sin estructura
- **origin_case**: C02
- **origin_evidence_id**: E-02-003
- **origin_epistemic_class**: DC
- **current_generality**: Capa A/C (según objeto concreto)
- **related_phenomena**: SCOPE, R6-HIST, CA
- **possible_overlap**: Con SCOPE — genealogía completa de por qué son necesidades distintas en `03-GENEALOGIAS-Y-GAPS-V1.md`.
- **current_status**: NECESIDAD CONCEPTUAL MUY FUERTEMENTE RESPALDADA (alcanzada en C08; C07 fue el caso que más redujo la brecha frente a scope)
- **open_questions**: ¿La necesidad conceptual de comprender `purpose` requiere necesariamente un campo `purpose`, o puede resolverse mediante contexto/procedencia/narrativa?
- **wrong_implementation_risk**: Un catálogo universal cerrado de propósitos, o fusionar `purpose` con `scope` prematuramente.
- **non_representation_risk**: Reutilizar una cifra determinada para un propósito (ej. impairment, prueba de deterioro) como si fuera automáticamente válida para valoración de equity.
- **disposition**: M-B — LLEVAR A DISEÑO 1B/1C
- **implementation_status**: NOT_AUTHORIZED

### PERIMETER — Comparabilidad / perímetro

- **current_name**: Comparabilidad / perímetro
- **current_formulation**: Eventos como adquisiciones, ventas, reclasificaciones, cambios de consolidación, NCI, JVs/asociadas y regímenes duales de reporte pueden afectar la comparabilidad de las cifras entre periodos y la atribución económica al accionista final.
- **object_type**: necesidad conceptual sin estructura
- **origin_case**: C02 (evidencia insuficiente); demostrado en C03
- **origin_evidence_id**: E-02-006 (origen débil); E-03-004 (elevación a problema demostrado)
- **origin_epistemic_class**: PA → HD
- **current_generality**: Capa A/C
- **related_phenomena**: SCOPE, ANALYSIS-UNIT, CD
- **possible_overlap**: Con SCOPE (perímetro es, en parte, una instancia material de scope) y con ANALYSIS-UNIT.
- **current_status**: PROBLEMA MUY FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; MUNICH RE APORTA EVIDENCIA DIRECTA DE QUE UN MISMO GRUPO PUEDE REQUERIR PERÍMETROS Y MÉTODOS DE REPRESENTACIÓN DIFERENTES SEGÚN EL PROPÓSITO
- **open_questions**: ¿Qué representación estructurada evita pérdida de información sin obligar a modelar entidad por entidad?
- **wrong_implementation_risk**: `case_perimeter` como tabla/schema, o un árbol universal de entidades.
- **non_representation_risk**: Tratar el perímetro consolidado como equivalente a la atribución económica final al accionista (ej. ISA al 51.4%, estructuras Viva al 26.01%).
- **disposition**: M-B — LLEVAR A DISEÑO 1B/1C
- **implementation_status**: NOT_AUTHORIZED

### ANALYSIS-UNIT — Unidad económica adecuada

- **current_name**: Unidad económicamente adecuada de análisis
- **current_formulation**: La unidad económicamente adecuada de análisis puede no coincidir con entidad legal, segmento contable, ni máxima granularidad disponible; debe documentarse qué unidad se considera apropiada y por qué.
- **object_type**: necesidad conceptual sin estructura
- **origin_case**: C06 (formulación explícita); reforzado en C07, C08
- **origin_evidence_id**: E-06-006
- **origin_epistemic_class**: HD/IA
- **current_generality**: Capa A/C
- **related_phenomena**: SCOPE, PERIMETER, METHOD-SELECTION
- **possible_overlap**: Con SCOPE (la unidad de análisis es, en la práctica, el scope elegido) y con PERIMETER.
- **current_status**: NECESIDAD CONCEPTUAL MUY FUERTEMENTE RESPALDADA
- **open_questions**: ¿Cómo se documenta la selección final de la unidad de análisis sin convertirla en automática?
- **wrong_implementation_risk**: Selección automática de unidad de análisis basada en segmentos contables.
- **non_representation_risk**: Asumir que "la empresa" es siempre un objeto suficientemente preciso para valorar (ej. Grupo Cibest vs. Bancolombia S.A.).
- **disposition**: M-B — LLEVAR A DISEÑO 1B/1C
- **implementation_status**: NOT_AUTHORIZED

### R7 — Drivers específicos por empresa

- **current_name**: Drivers específicos por empresa
- **current_formulation**: Las variables sensibles dependen de la empresa/economía específica; no existe una biblioteca universal cerrada de drivers. Driver específico ≠ máxima granularidad disponible.
- **object_type**: principio transversal del proceso
- **origin_case**: C01
- **origin_evidence_id**: E-01-007
- **origin_epistemic_class**: HD
- **current_generality**: Capa A (principio) / Capa C (drivers concretos)
- **related_phenomena**: R4, SUPPLIER-FIN, LEASES
- **possible_overlap**: Ninguno estructural; drivers concretos observados (backlog, NIM, loss ratio, RAP) son Capa C.
- **current_status**: PATRÓN OBSERVADO EN OCHO CASOS
- **open_questions**: Ninguna estructural; lo transversal es precisamente la ausencia de biblioteca universal.
- **wrong_implementation_risk**: Codificar cualquier driver observado (backlog, NIM, RAP, loss ratio) como campo obligatorio universal.
- **non_representation_risk**: Forzar el análisis de una empresa a un catálogo cerrado de drivers que no incluya su driver realmente material.
- **disposition**: M-A — FORMALIZAR EN METODOLOGÍA
- **implementation_status**: NOT_AUTHORIZED

### R8 — Detectar sin decidir

- **current_name**: Detectar sin decidir
- **current_formulation**: Velarix puede detectar, señalar, contrastar, preguntar y exigir revisión. La interpretación económica material y la decisión profesional permanecen humanas.
- **object_type**: principio transversal del proceso
- **origin_case**: C01
- **origin_evidence_id**: E-01-008
- **origin_epistemic_class**: DC
- **current_generality**: Capa A
- **related_phenomena**: R3, R5
- **possible_overlap**: Con R3 (relaciones inconsistentes) y R5 (estado de conocimiento) como fuentes típicas de las incoherencias detectables.
- **current_status**: PATRÓN OBSERVADO EN OCHO CASOS
- **open_questions**: ¿Qué patrones de incoherencia adicionales, más allá de los ya documentados, merecen alerta sistemática?
- **wrong_implementation_risk**: Automatizar la decisión (normalización, reclasificación, método) en lugar de solo alertar.
- **non_representation_risk**: No alertar sobre una incoherencia material (ej. crecimiento proyectado incompatible con capacidad declarada) por ausencia de un detector.
- **disposition**: M-D — ALERTA / PREGUNTA
- **implementation_status**: NOT_AUTHORIZED

### CA — Candidato A (puente bruto → exposición económica)

- **current_name**: Candidato A — puente bruto → exposición económica (nombre histórico "Neteo", registrado como demasiado estrecho)
- **current_formulation**: Cuando la magnitud económicamente relevante resulte de transformar una magnitud bruta mediante mecanismos materiales (compensación jurídica, collateral, reinsurance/retrocession, otros mitigantes), el análisis debe preservar trazablemente el puente y distinguir los mecanismos que producen la transformación.
- **object_type**: candidato metodológico (Capa A, principio; Capa C, mecánica específica)
- **origin_case**: C03 (como "neteo")
- **origin_evidence_id**: E-03-001 (origen); E-07-001 (refuerzo/tensión); E-08-001 (refuerzo/presión de reformulación)
- **origin_epistemic_class**: HD/IA
- **current_generality**: Capa A (principio) / Capa C (mecánica: netting, collateral, reinsurance)
- **related_phenomena**: R1, R4, OBS-MUNICH-EXPOSURE
- **possible_overlap**: Con OBS-MUNICH-EXPOSURE, que puede terminar siendo parte de CA en la consolidación futura.
- **current_status**: EVIDENCIA FUERTE INDEPENDIENTE EN ECOPETROL, GOLDMAN SACHS Y MUNICH RE; LA FORMULACIÓN GENERAL DEBE REFINARSE ANTES DE CUALQUIER ELEVACIÓN FORMAL
- **open_questions**: ¿Qué información debe preservarse para reconstruir el puente de manera trazable? ¿Cuál es el nombre final del candidato?
- **wrong_implementation_risk**: Un modelo de `netting`/collateral/reinsurance engine, o asumir que "mostrar solo el bruto" es siempre la mejor práctica (puede inducir lectura económica falsa por sobreestimación).
- **non_representation_risk**: Presentar solo la cifra neta y perder la posibilidad de reconstruir qué mecanismos produjeron la transformación (ej. impairment neto ≈0 en Ecopetrol).
- **disposition**: M-A — FORMALIZAR EL PRINCIPIO (mecánica específica: M-E — MÁS EVIDENCIA)
- **implementation_status**: NOT_AUTHORIZED

### CB — Candidato B (ciclo de vida económico)

- **current_name**: Candidato B — ciclo de vida económico
- **current_formulation**: Diferentes objetos económicos relevantes pueden tener vidas o secuencias temporales distintas, que no deben confundirse con la vida de la empresa ni con el horizonte explícito.
- **object_type**: candidato metodológico condicional
- **origin_case**: C03
- **origin_evidence_id**: E-03-002 (origen); E-04-003, E-05-002, E-08-002 (refuerzos sucesivos)
- **origin_epistemic_class**: DC
- **current_generality**: Capa C (mecánica específica por economía); posible principio Capa A todavía no cerrado
- **related_phenomena**: CC, HORIZON, STEADY-STATE
- **possible_overlap**: Con CC (ambos tratan temporalidad, pero CB es sobre duración/vida y CC es sobre atribución de un hecho a una fecha de corte); con HORIZON (vida de un activo/contrato ≠ horizonte explícito de valoración).
- **current_status**: PATRÓN OBSERVADO EN SEIS CASOS DE NATURALEZA ECONÓMICA MUY DISTINTA (Ecopetrol, Grupo Éxito, ISA, Bancolombia, Goldman Sachs, Munich Re) — FORMULACIÓN GENERAL AÚN ABIERTA
- **open_questions**: ¿Existe una formulación general aplicable a las seis economías, o el fenómeno seguirá siendo mejor representado como principio condicional por economía?
- **wrong_implementation_risk**: `economic_lifecycle` como tabla o taxonomía universal de etapas.
- **non_representation_risk**: Confundir la vida de un activo, contrato o concesión con la vida de la empresa, produciendo un horizonte o valor terminal incoherente.
- **disposition**: M-A — FORMALIZAR COMO PRINCIPIO CONDICIONAL
- **implementation_status**: NOT_AUTHORIZED

### CC — Candidato C (atribución temporal / corte de conocimiento)

- **current_name**: Candidato C — atribución temporal / corte de conocimiento
- **current_formulation**: ¿Qué fenómeno económico atribuimos al corte y con qué información disponible a esa fecha? Deben distinguirse potencialmente: fecha de valoración, período financiero, fecha económica del hecho, reconocimiento, caja, información disponible/conocida, información posterior.
- **object_type**: problema metodológico sin representación
- **origin_case**: C03
- **origin_evidence_id**: E-03-003 (origen); E-04-004 (refuerzo muy fuerte); E-08-003 (elevación a "muy fuertemente respaldado")
- **origin_epistemic_class**: HD
- **current_generality**: Capa A/C
- **related_phenomena**: R2, CB
- **possible_overlap**: Con R2 (observado≠normalizado≠proyectado) cuando el desfase temporal es la causa del desacople entre capas.
- **current_status**: PROBLEMA METODOLÓGICO MUY FUERTEMENTE RESPALDADO POR MÚLTIPLES CASOS
- **open_questions**: ¿Qué principio general permite distinguir las hasta diez fechas potencialmente relevantes (Munich Re) sin crear un campo por cada una?
- **wrong_implementation_risk**: `economic_period` como campo o entidad nueva.
- **non_representation_risk**: Proyectar mecánicamente un flujo observado (ej. CFO) como si representara el desempeño económico del mismo período, cuando existe un mecanismo de desfase documentado (FEPC, reorganización societaria, cambio de perímetro).
- **disposition**: M-B — LLEVAR A DISEÑO 1B/1C
- **implementation_status**: NOT_AUTHORIZED

### CD — Candidato D (derechos económicos / propiedad dinámica)

- **current_name**: Candidato D — derechos económicos / propiedad dinámica
- **current_formulation**: La atribución económica puede depender no solo de la propiedad actual, sino también de derechos u obligaciones contractuales capaces de modificarla (ej. opciones put/call sobre NCI).
- **object_type**: candidato metodológico de evidencia limitada
- **origin_case**: C04
- **origin_evidence_id**: E-04-001 (origen); E-07-007 (evidencia insuficiente); C05, C06, C08 sin refuerzo
- **origin_epistemic_class**: HD
- **current_generality**: Capa C
- **related_phenomena**: PERIMETER, SCOPE
- **possible_overlap**: Con PERIMETER cuando el derecho dinámico afecta el porcentaje de NCI consolidado.
- **current_status**: EVIDENCIA FUERTE EN GRUPO ÉXITO — SIN EVIDENCIA NUEVA EN CUATRO CASOS CONSECUTIVOS (ISA, Bancolombia, Goldman Sachs, Munich Re)
- **open_questions**: ¿El fenómeno reaparecerá en un noveno caso, o es idiosincrático de Grupo Éxito?
- **wrong_implementation_risk**: Un "options engine" o modelo automático de valoración de derechos dinámicos.
- **non_representation_risk**: Tratar un porcentaje de NCI reportado como definitivo cuando existe un pasivo financiero asociado a una opción que ya anticipa su modificación futura.
- **disposition**: M-E — MÁS EVIDENCIA (prioridad degradada; no eliminado)
- **implementation_status**: NOT_AUTHORIZED

### CE-HIST — Candidato E histórico (base de medición / régimen monetario, compuesto)

- **current_name**: Candidato E histórico — base de medición / régimen monetario (origen compuesto)
- **current_formulation**: Antes de comparar, normalizar o proyectar una cifra, puede ser necesario conocer la base de medición y el régimen monetario bajo el cual fue construida.
- **object_type**: candidato metodológico compuesto, con presión de división
- **origin_case**: C04
- **origin_evidence_id**: E-04-002 (origen compuesto); E-05-003 (segunda economía, tensión); E-06-008 (tensión adicional); E-07-002 (asimetría measurement basis vs. monetary regime); E-08-004 (hipótesis de separación muy fuertemente respaldada)
- **origin_epistemic_class**: HD/DC
- **current_generality**: Capa A (compuesto, pendiente de división)
- **related_phenomena**: MEASUREMENT-BASIS, MONETARY-REGIME
- **possible_overlap**: Total con MEASUREMENT-BASIS y MONETARY-REGIME — este ID se preserva como origen compuesto en la genealogía; ver GAP-05.
- **current_status**: LA HIPÓTESIS DE QUE BASE DE MEDICIÓN Y RÉGIMEN MONETARIO / MONEDA SON DOS FENÓMENOS METODOLÓGICAMENTE DISTINTOS QUEDA MUY FUERTEMENTE RESPALDADA (Munich Re); no dividido formalmente
- **open_questions**: ¿La evidencia de los ocho casos ya justifica separar formalmente measurement basis de monetary regime? (Pregunta explícita para la consolidación — ver `04-BACKLOG-Y-PUENTE-1B-1C-V1.md`.)
- **wrong_implementation_risk**: `measurement_basis` field o enum monetario sin haber resuelto primero la separación conceptual.
- **non_representation_risk**: Tratar dos cifras del mismo cierre como comparables sin comprender que fueron medidas bajo bases o regímenes distintos (ej. IFRS vs. Solvency II; hiperinflación NIC 29).
- **disposition**: M-H — DIVIDIR (pendiente de ejecución en la consolidación/1B-1C)
- **implementation_status**: NOT_AUTHORIZED

### MEASUREMENT-BASIS — Base de medición (linaje conceptual provisional)

- **current_name**: Measurement Basis (linaje separado de CE-HIST)
- **current_formulation**: La base contable/técnica bajo la cual se midió una cifra (costo amortizado, fair value, IFRS vs. Solvency II, GMM/PAA/VFA, Level 1/2/3) puede cambiar sin que cambie la moneda.
- **object_type**: linaje conceptual provisional, sin ID técnico definitivo
- **origin_case**: C07 (evidencia fuerte específica); consolidado conceptualmente por C08
- **origin_evidence_id**: E-07-002; E-08-004
- **origin_epistemic_class**: DC
- **current_generality**: Capa A/C
- **related_phenomena**: CE-HIST, MONETARY-REGIME
- **possible_overlap**: Origen compartido con CE-HIST; ver GAP-05.
- **current_status**: EVIDENCIA MUY FUERTE (Goldman Sachs, Munich Re); separación de MONETARY-REGIME muy fuertemente respaldada, no ejecutada
- **open_questions**: Nombre e ID técnico definitivo, pendientes de la consolidación.
- **wrong_implementation_risk**: Crear `measurement_basis` field fingiendo que existió como entidad separada desde el origen del Candidato E.
- **non_representation_risk**: Igual que CE-HIST.
- **disposition**: M-H — DIVIDIR (parte 1 de 2)
- **implementation_status**: NOT_AUTHORIZED

### MONETARY-REGIME — Régimen monetario / moneda (linaje conceptual provisional)

- **current_name**: Monetary Regime / Currency (linaje separado de CE-HIST)
- **current_formulation**: El régimen monetario (moneda funcional, moneda de presentación, moneda contractual, FX, hiperinflación NIC 29, indexación, cobertura) puede cambiar valores sin que cambie la base de medición.
- **object_type**: linaje conceptual provisional, sin ID técnico definitivo
- **origin_case**: C04 (hiperinflación); reforzado en C05 (indexación/cobertura)
- **origin_evidence_id**: E-04-002; E-05-003
- **origin_epistemic_class**: HD/DC
- **current_generality**: Capa A/C
- **related_phenomena**: CE-HIST, MEASUREMENT-BASIS
- **possible_overlap**: Origen compartido con CE-HIST; ver GAP-05.
- **current_status**: EVIDENCIA FUERTE (Grupo Éxito, ISA); sin evidencia nueva equivalente en Goldman Sachs; reforzado indirectamente por Munich Re (FX como fenómeno separable de measurement basis)
- **open_questions**: Nombre e ID técnico definitivo, pendientes de la consolidación.
- **wrong_implementation_risk**: Enum monetario que asuma que este linaje fue siempre independiente de measurement basis.
- **non_representation_risk**: Igual que CE-HIST.
- **disposition**: M-H — DIVIDIR (parte 2 de 2)
- **implementation_status**: NOT_AUTHORIZED

### CF — Candidato F (disponibilidad económica de recursos)

- **current_name**: Candidato F — disponibilidad económica de recursos (elevación formal de la observación ISA-F)
- **current_formulation**: El reconocimiento, propiedad o control de un recurso no implica necesariamente que esté económicamente disponible para cualquier propósito.
- **object_type**: candidato metodológico elevado formalmente
- **origin_case**: C05 (como observación ISA-F); elevado a Candidato F en C08
- **origin_evidence_id**: E-05-001 (origen); E-06-005 (refuerzo, 2 economías); E-08-005 (elevación formal, 4 economías)
- **origin_epistemic_class**: DC
- **current_generality**: Capa A (principio) / Capa C (mecánica: restricción contractual, prudencial, societaria)
- **related_phenomena**: CASH-LIQUIDITY, CAPITAL, CG
- **possible_overlap**: Con CG (capacidad de distribución) — CF trata disponibilidad de un recurso reconocido; CG trata el puente capital→distribución en instituciones prudenciales. Se mantienen separados por decisión explícita del Caso 06 ("no fusionar prematuramente").
- **current_status**: CANDIDATO F — EVIDENCIA TRANSVERSAL FUERTEMENTE REFORZADA EN CUATRO ECONOMÍAS RADICALMENTE DISTINTAS: ISA, BANCOLOMBIA, GOLDMAN SACHS Y MUNICH RE
- **open_questions**: ¿Qué representación (no binaria) captura mejor el espectro entre disponible/restringido sin crear un campo booleano ingenuo?
- **wrong_implementation_risk**: Un campo `availability` booleano (`available = true/false`), `restricted_asset` como entidad universal, o un modelo de fungibilidad.
- **non_representation_risk**: Asumir que todo efectivo/inversión reconocido es distribuible (o, en el extremo opuesto, que toda restricción puntual implica indisponibilidad total).
- **disposition**: M-B — LLEVAR A DISEÑO 1B/1C (elevación de nomenclatura ya autorizada documentalmente por el Caso 08; sin implementación)
- **implementation_status**: NOT_AUTHORIZED

### CG — Candidato G (puente capital / capacidad de distribución)

- **current_name**: Candidato G — puente capital / capacidad de distribución (elevación formal de la observación Bancolombia-G)
- **current_formulation**: En instituciones financieras prudencialmente capitalizadas, la capacidad económica sostenible de distribución puede requerir un puente explícito entre: generación de resultados; capital disponible; capital requerido; crecimiento/riesgo; buffers; decisiones de capital management; y potencial distribución.
- **object_type**: candidato sectorial elevado formalmente (Capa B)
- **origin_case**: C06 (como observación Bancolombia-G); elevado a Candidato G en C08
- **origin_evidence_id**: E-06-004 (origen); E-07-005 (refuerzo, 2 instituciones); E-08-006 (elevación formal, 3 instituciones)
- **origin_epistemic_class**: IA
- **current_generality**: Capa B — familia: instituciones financieras prudencialmente reguladas/capitalizadas
- **related_phenomena**: CF, CAPITAL, CASH-LIQUIDITY, METHOD-RI, METHOD-FCFE, METHOD-POTDIST
- **possible_overlap**: Con CF (ver arriba); con OBS-MUNICH-EXPOSURE (el capital requerido por exposición retenida puede alimentar el puente de CG).
- **current_status**: CANDIDATO G — PATRÓN OBSERVADO EN TRES INSTITUCIONES FINANCIERAS PRUDENCIALMENTE REGULADAS CON ECONOMÍAS MATERIALMENTE DISTINTAS (Bancolombia, Goldman Sachs, Munich Re)
- **open_questions**: ¿El mecanismo específico del puente (CET1/RWA en banca vs. Solvency II/SCR en seguros) requiere representación sectorial distinta, o existe un principio común representable de forma única?
- **wrong_implementation_risk**: `capital_bridge`, `regulatory_capital` o `distributable_capital` como tabla/schema/campo.
- **non_representation_risk**: Confundir utilidad o patrimonio contable con capacidad de distribución, ignorando capital requerido y buffers prudenciales.
- **disposition**: M-F — SECTORIAL / CONDICIONADO
- **implementation_status**: NOT_AUTHORIZED

### OBS-GS-COMP — Observación Goldman: compensación

- **current_name**: Observación Goldman — compensación como posible variable económica endógena
- **current_formulation**: La compensación puede relacionarse con revenue/performance → margin de forma condicional, discrecional, diferida, variable por negocio y cíclica.
- **object_type**: observación sin candidato propio
- **origin_case**: C07
- **origin_evidence_id**: E-07-004 (origen); E-08-011 (sin refuerzo en Munich Re)
- **origin_epistemic_class**: IA
- **current_generality**: Capa C
- **related_phenomena**: R3, R7
- **possible_overlap**: Total — puede resolverse como instancia de R3 (relación endógena) o de R7 (driver específico), sin ser un fenómeno independiente.
- **current_status**: EVIDENCIA INSUFICIENTE PARA CREAR CANDIDATO — sin refuerzo en Munich Re, único caso posterior de la primera batería
- **open_questions**: ¿Es simplemente R3? ¿es driver R7? ¿es fenómeno sectorial de negocios intensivos en capital humano? ¿es algo nuevo? — no resuelto.
- **wrong_implementation_risk**: Un "modelo de compensación" o "Candidato H" sin evidencia de un segundo caso independiente.
- **non_representation_risk**: Ignorar que la compensación puede ser una variable materialmente relacionada con el desempeño en negocios intensivos en capital humano.
- **disposition**: M-G — FUSIONAR (con R3 o R7 cuando sea driver/relación material en un caso concreto)
- **implementation_status**: NOT_AUTHORIZED

### OBS-MUNICH-EXPOSURE — Observación Munich: exposición / retención / capital

- **current_name**: Observación Munich — puente exposición / retención / capital
- **current_formulation**: Debe distinguirse: riesgo o exposición bruta ≠ riesgo retenido ≠ exposición después de mitigantes ≠ capital requerido por esa exposición.
- **object_type**: observación sin candidato propio
- **origin_case**: C08
- **origin_evidence_id**: E-08-007
- **origin_epistemic_class**: DC
- **current_generality**: Capa C
- **related_phenomena**: CA, R3, CG
- **possible_overlap**: Total — la parte "gross → mitigants → retained/economic exposure" se relaciona con CA; la parte "exposure/risk → required capital" se relaciona con R3 y, cuando afecta distribución prudencial, con CG.
- **current_status**: EVIDENCIA INSUFICIENTE PARA NUEVO CANDIDATO — un solo caso, sin segundo punto de dato en la primera batería
- **open_questions**: ¿Termina siendo parte de CA, de R3, o de CG? — explícitamente sin resolver.
- **wrong_implementation_risk**: Un "Candidato H" o motor de exposición/retención de riesgo.
- **non_representation_risk**: Tratar la exposición bruta como equivalente a la exposición retenida o al capital requerido en una aseguradora/reaseguradora.
- **disposition**: M-H — DIVIDIR (conceptualmente entre CA y R3/CG, sin implementación)
- **implementation_status**: NOT_AUTHORIZED

### SUPPLIER-FIN — Supplier financing

- **current_name**: Supplier financing
- **current_formulation**: Determinadas cuentas comerciales pueden oscilar entre capital de trabajo (NWC) operativo y naturaleza financiera, según el mecanismo específico (anticipación bancaria, convenio de plazo, plazo ampliado con proveedor concentrado).
- **object_type**: problema real sin criterio de clasificación
- **origin_case**: C01
- **origin_evidence_id**: E-01-009 (origen); E-02-007, E-04-007 (refuerzos); C05, C06, C07, C08 sin evidencia adicional (irrelevante o insuficiente)
- **origin_epistemic_class**: PA/HD
- **current_generality**: Capa C
- **related_phenomena**: DEBT, NWC
- **possible_overlap**: Con DEBT (clasificación financiera) y NWC (clasificación operativa).
- **current_status**: PROBLEMA FUERTEMENTE REFORZADO — CRITERIOS DE RECLASIFICACIÓN TODAVÍA ABIERTOS (evidencia principal: Tecnoglass, Terpel, Grupo Éxito; irrelevante/insuficiente en Bancolombia, Goldman Sachs, ISA, Munich Re)
- **open_questions**: ¿Qué criterio distingue supplier financing operativo de deuda económica?
- **wrong_implementation_risk**: `supplier_financing` como entidad universal, o reglas automáticas ("supplier financing = deuda" / "= NWC").
- **non_representation_risk**: Ignorar que un mismo saldo de cuentas por pagar puede reflejar mecanismos comerciales, financieros o mixtos simultáneamente.
- **disposition**: M-D — ALERTA / PREGUNTA
- **implementation_status**: NOT_AUTHORIZED

### LEASES — Arrendamientos

- **current_name**: Leases
- **current_formulation**: Un mismo grupo puede ser simultáneamente arrendatario y arrendador, con arrendamientos financieros y operativos; el tratamiento de valoración (deuda vs. operación) no está generalizado.
- **object_type**: problema demostrado sin tratamiento generalizado
- **origin_case**: C01 (mención inicial); doble rol documentado desde C04
- **origin_evidence_id**: E-04-008 (doble rol, origen); E-05-006 (2ª instancia doble rol)
- **origin_epistemic_class**: HD
- **current_generality**: Capa C
- **related_phenomena**: DEBT
- **possible_overlap**: Con DEBT (¿lease = deuda económica?).
- **current_status**: PROBLEMA DEMOSTRADO — TRATAMIENTO DE VALORACIÓN NO GENERALIZADO (reforzado en Grupo Éxito, ISA, Bancolombia; sin nueva instancia material en Goldman Sachs ni Munich Re)
- **open_questions**: ¿Bajo qué criterios un lease específico se trata como deuda económica vs. pasivo operativo?
- **wrong_implementation_risk**: Regla universal `lease = deuda` o `lease = operación`; motor universal de leases.
- **non_representation_risk**: Ignorar que un mismo grupo puede generar simultáneamente un pasivo de leases material como arrendatario y un flujo de ingresos por arrendamiento como arrendador.
- **disposition**: M-D — ALERTA / PREGUNTA
- **implementation_status**: NOT_AUTHORIZED

### NWC — Capital de trabajo neto

- **current_name**: NWC (capital de trabajo neto)
- **current_formulation**: NWC convencional puede ser material en determinadas economías, pero no es driver universal obligatorio. Cuando sea material, debe construirse desde componentes/drivers económicos relevantes, no como `% de revenue`.
- **object_type**: guardrail financiero
- **origin_case**: C01 (formulación inicial: no usar solo `NWC = X% × revenue`); refutación de universalidad en C06
- **origin_evidence_id**: E-01-002; E-06-002 (refutación de universalidad)
- **origin_epistemic_class**: IA
- **current_generality**: Capa C (material en economías industriales/retail; no material en el core de instituciones financieras prudenciales)
- **related_phenomena**: SUPPLIER-FIN, R4
- **possible_overlap**: Con SUPPLIER-FIN (componente potencial de NWC).
- **current_status**: NO ES DRIVER UNIVERSAL OBLIGATORIO — evidencia negativa fuerte en Bancolombia, Goldman Sachs y Munich Re contra universalidad industrial; sigue siendo material en Tecnoglass, Terpel, Grupo Éxito
- **open_questions**: Ninguna estructural adicional.
- **wrong_implementation_risk**: Fórmula universal `NWC = % de revenue`, o eliminar NWC de Velarix por la evidencia bancaria/aseguradora.
- **non_representation_risk**: Asumir que toda empresa tiene NWC materialmente relevante, o que ninguna institución financiera lo tiene en ningún scope.
- **disposition**: M-A — FORMALIZAR GUARDRAIL
- **implementation_status**: NOT_AUTHORIZED

### CAPEX — CAPEX (manifestación contable de inversión)

- **current_name**: CAPEX
- **current_formulation**: CAPEX es la manifestación contable concreta de inversión en determinadas economías; no representa necesariamente la totalidad de la reinversión económica.
- **object_type**: guardrail financiero
- **origin_case**: C01
- **origin_evidence_id**: E-01-003 (mención); E-05-007 (cautela: clasificación contable no determina inversión económica)
- **origin_epistemic_class**: IA
- **current_generality**: Capa C
- **related_phenomena**: REINVESTMENT
- **possible_overlap**: Con REINVESTMENT — separación conceptual formal desde C06.
- **current_status**: `CAPEX = % de ingresos` NO ES METODOLOGÍA DEFENDIBLE — reforzado de forma independiente en los ocho casos. CAPEX y REINVESTMENT eran tratados como sinónimo aproximado hasta el Caso 05; el evento `M-H — DIVIDIR` (Caso 06) los separa conceptualmente — ver genealogía en `03-GENEALOGIAS-Y-GAPS-V1.md`.
- **open_questions**: ¿Qué taxonomía (mantenimiento/crecimiento/eficiencia/estratégico/regulatorio) es necesaria caso por caso, sin ser universal?
- **wrong_implementation_risk**: Taxonomía universal obligatoria de CAPEX, o fórmula `CAPEX = % revenue`.
- **non_representation_risk**: Confundir clasificación contable de un desembolso (ej. aporte a JV en vez de CAPEX de PP&E) con ausencia de inversión económica real.
- **disposition**: M-H — DIVIDIR (separación de REINVESTMENT, evento ya ejecutado documentalmente en C06); M-A — FORMALIZAR el concepto ya separado
- **implementation_status**: NOT_AUTHORIZED

### REINVESTMENT — Reinversión económica

- **current_name**: Reinversión económica
- **current_formulation**: Qué recursos económicos deben comprometerse para sostener crecimiento/capacidad. CAPEX contable ≠ necesariamente totalidad de la reinversión; capital regulatorio ≠ necesariamente totalidad de la reinversión.
- **object_type**: guardrail financiero, separado conceptualmente de CAPEX
- **origin_case**: C06 (separación formal); expandido en C07
- **origin_evidence_id**: E-06-003 (origen de la separación); E-07-009 (Goldman amplía vías: capital regulatorio, tecnología, talento, fundraising, plataformas, adquisiciones)
- **origin_epistemic_class**: IA
- **current_generality**: Capa B (en instituciones financieras prudenciales) / Capa C (en otras economías)
- **related_phenomena**: CAPEX, CG
- **possible_overlap**: Con CAPEX (ver arriba) y con CG (retención de capital como forma de reinversión bancaria/aseguradora).
- **current_status**: SEPARACIÓN CONCEPTUAL FORMALIZADA (evento `M-H`, C06) — sin fórmula universal para el concepto ya separado
- **open_questions**: ¿Cómo se documenta la reinversión cuando excede el CAPEX contable, sin crear una fórmula automática?
- **wrong_implementation_risk**: Fórmula que combine automáticamente CAPEX contable y retención de capital regulatorio en una única métrica de "reinversión".
- **non_representation_risk**: Asumir que el CAPEX contable agota la reinversión económica relevante, subestimando la capacidad de crecimiento real.
- **disposition**: M-H — DIVIDIR (separación de CAPEX, evento ya ejecutado documentalmente en C06); M-A — FORMALIZAR el concepto ya separado
- **implementation_status**: NOT_AUTHORIZED

### DEBT — Deuda

- **current_name**: Deuda
- **current_formulation**: Financial liability ≠ automáticamente deuda económica externa a la operación. Tampoco: institución financiera = sin deuda.
- **object_type**: guardrail financiero
- **origin_case**: C06 (formulación explícita mediante depósitos); reforzado en C07 (financing como operación) y C08 (insurance liabilities ≠ corporate debt, pero Munich Re sí tiene strategic debt real)
- **origin_evidence_id**: E-06-001; E-07-010 (financing como operación); E-08-012 (insurance liabilities ≠ strategic debt)
- **origin_epistemic_class**: IA
- **current_generality**: Capa B (instituciones financieras) / Capa C (otras economías)
- **related_phenomena**: NET-DEBT, LEASES, SUPPLIER-FIN
- **possible_overlap**: Con NET-DEBT, LEASES, SUPPLIER-FIN — todos instrumentos donde la clasificación contable ≠ automáticamente clasificación de deuda económica.
- **current_status**: FORMALIZADO COMO GUARDRAIL — ni todo pasivo financiero es deuda económica externa, ni toda institución financiera carece de deuda económica relevante
- **open_questions**: ¿Qué criterio distingue, caso por caso, un pasivo financiero operativo de deuda económica externa?
- **wrong_implementation_risk**: Regla `financial_institution => sin deuda`, o clasificación automática de todo pasivo financiero como deuda.
- **non_representation_risk**: Tratar depósitos, financing o insurance liabilities como deuda corporativa convencional sin analizar su función económica.
- **disposition**: M-A — FORMALIZAR
- **implementation_status**: NOT_AUTHORIZED

### NET-DEBT — Deuda neta

- **current_name**: Net debt
- **current_formulation**: Net debt convencional no es métrica universal obligatoria ni puente EV→Equity Value obligatorio. Puede ser válido según scope/método/economía.
- **object_type**: guardrail financiero
- **origin_case**: C01 (mención inicial); refutación de universalidad en C06, reforzada en C07 y C08
- **origin_evidence_id**: E-06-001; E-07-011 (net debt convencional no interpretable en ciertos scopes); E-08-012 (net debt convencional no obligatorio y potencialmente engañoso a nivel consolidado)
- **origin_epistemic_class**: IA
- **current_generality**: Capa C (aplicable según scope; problemático como default consolidado en instituciones financieras)
- **related_phenomena**: DEBT, CASH-LIQUIDITY
- **possible_overlap**: Con DEBT y CASH-LIQUIDITY.
- **current_status**: NO ES MÉTRICA UNIVERSAL OBLIGATORIA — evidencia negativa fuerte en Bancolombia, Goldman Sachs y Munich Re como default consolidado
- **open_questions**: ¿En qué `scope`s específicos net debt convencional sigue siendo el puente EV→Equity Value adecuado?
- **wrong_implementation_risk**: Puente EV→Equity Value automático vía net debt convencional para cualquier caso.
- **non_representation_risk**: Eliminar net debt de Velarix por la evidencia bancaria/aseguradora, perdiendo su utilidad en economías donde sí es adecuado.
- **disposition**: M-A — FORMALIZAR (no eliminar)
- **implementation_status**: NOT_AUTHORIZED

### CASH-LIQUIDITY — Cash / liquidez / disponibilidad / distribución

- **current_name**: Cash / liquidez / disponibilidad / distribución
- **current_formulation**: Deben preservarse las distinciones: cash contable ≠ liquidez ≠ cash excedentario ≠ disponibilidad económica ≠ recurso distribuible.
- **object_type**: guardrail financiero, distinciones conceptuales
- **origin_case**: C06 (formulación de las cuatro nociones bancarias); reforzado por C05 (ISA-F) y C08 (Munich Re: IFRS equity ≠ Solvency II eligible own funds ≠ SCR ≠ distributable excess)
- **origin_evidence_id**: E-06-005; E-05-001 (relacionado, CF); E-08-013 (régimen dual IFRS/Solvency II)
- **origin_epistemic_class**: DC
- **current_generality**: Capa B (instituciones financieras) / Capa C (otras economías)
- **related_phenomena**: CF, CG, CAPITAL
- **possible_overlap**: Fuerte con CF (disponibilidad económica) y CG (puente capital-distribución).
- **current_status**: DISTINCIONES FORMALIZADAS — no se afirma que todo cash esté restringido ni que todo cash sea excedentario
- **open_questions**: ¿Cómo se documentan estas distinciones sin crear un campo por cada noción?
- **wrong_implementation_risk**: Múltiples campos (`excess_cash`, `distributable_cash`, etc.) sin evidencia de diseño validado.
- **non_representation_risk**: Tratar cash contable como automáticamente disponible o automáticamente restringido.
- **disposition**: M-A — FORMALIZAR DISTINCIONES
- **implementation_status**: NOT_AUTHORIZED

### CAPITAL — Capital

- **current_name**: Capital
- **current_formulation**: Deben preservarse las distinciones: book equity ≠ capital regulatorio/prudencial ≠ capital requerido ≠ capital potencialmente excedentario ≠ capital distribuible.
- **object_type**: guardrail financiero, distinciones conceptuales
- **origin_case**: C06 (cinco nociones bancarias); reforzado por C07 (CET1/RWA/SLR) y C08 (eligible own funds/SCR)
- **origin_evidence_id**: E-06-004; E-07-005; E-08-006
- **origin_epistemic_class**: DC
- **current_generality**: Capa B (instituciones financieras) / Capa C (otras economías)
- **related_phenomena**: CG, CASH-LIQUIDITY
- **possible_overlap**: El puente prudencial específico pertenece a CG / Capa B.
- **current_status**: DISTINCIONES FORMALIZADAS
- **open_questions**: Ninguna adicional a las ya registradas en CG.
- **wrong_implementation_risk**: `regulatory_capital` como schema universal.
- **non_representation_risk**: Confundir patrimonio contable con capital distribuible.
- **disposition**: M-A — FORMALIZAR DISTINCIONES
- **implementation_status**: NOT_AUTHORIZED

### METHOD-EV — Enterprise Value

- **current_name**: Enterprise Value
- **current_formulation**: No es arquitectura universal obligatoria; puede ser útil en determinados scopes.
- **object_type**: método de valoración, no aprobado
- **origin_case**: C06 (evaluado por primera vez explícitamente como no adecuado para default bancario); reforzado en C07 y C08
- **origin_evidence_id**: E-06-010 (§25 A del caso); E-07-012 (§32 F); E-08-014 (§27 A)
- **origin_epistemic_class**: IM
- **current_generality**: Capa C (condicionado por scope)
- **related_phenomena**: METHOD-FCFF, METHOD-DCF-SCOPE
- **possible_overlap**: Con METHOD-FCFF (par metodológico tradicional).
- **current_status**: NO ADECUADO COMO ARQUITECTURA UNIVERSAL DEL GRUPO CONSOLIDADO EN INSTITUCIONES FINANCIERAS PRUDENCIALES; POTENCIALMENTE ÚTIL EN DETERMINADOS SCOPES — pregunta abierta
- **open_questions**: ¿En qué scopes específicos EV mantiene utilidad dentro de un grupo con instituciones financieras?
- **wrong_implementation_risk**: Selección automática de EV como método por defecto.
- **non_representation_risk**: Eliminar EV como opción de Velarix pese a seguir siendo apropiado en Tecnoglass, Terpel, Grupo Éxito.
- **disposition**: M-F — SECTORIAL / CONDICIONADO
- **implementation_status**: NOT_AUTHORIZED

### METHOD-FCFF — FCFF / WACC convencional

- **current_name**: FCFF / WACC convencional
- **current_formulation**: No es default universal consolidado, especialmente no apropiado como default en los tres casos prudenciales. DCF ≠ FCFF industrial — no se elimina FCFF ni WACC.
- **object_type**: método de valoración, no aprobado
- **origin_case**: C06; reforzado en C07 y C08
- **origin_evidence_id**: E-06-010 (§25 A); E-07-013 (§32 E); E-08-015 (§27 C)
- **origin_epistemic_class**: IM
- **current_generality**: Capa C
- **related_phenomena**: METHOD-EV, METHOD-DCF-SCOPE, DISCOUNT-RATE
- **possible_overlap**: Con METHOD-DCF-SCOPE (DCF ≠ FCFF industrial es la distinción explícita que evita eliminar el enfoque de flujo descontado).
- **current_status**: NO ADECUADO COMO DEFAULT — especialmente inapropiado en Bancolombia, Goldman Sachs y Munich Re como default consolidado
- **open_questions**: Ninguna adicional.
- **wrong_implementation_risk**: Motor de FCFF automático o WACC por defecto para cualquier caso.
- **non_representation_risk**: Eliminar FCFF/WACC de Velarix pese a seguir siendo apropiados en economías industriales.
- **disposition**: M-F — SECTORIAL / CONDICIONADO
- **implementation_status**: NOT_AUTHORIZED

### METHOD-DCF-SCOPE — DCF scope-specific

- **current_name**: DCF scope-specific
- **current_formulation**: Discounted cash-flow approaches pueden ser económicamente útiles en determinados scopes, sin implicar que cada scope necesite un DCF ni que DCF equivalga a FCFF industrial.
- **object_type**: método de valoración, conceptualmente respaldado
- **origin_case**: C08 (formulación explícita: "DCF ≠ FCFF industrial")
- **origin_evidence_id**: E-08-015 (§27 C)
- **origin_epistemic_class**: IM
- **current_generality**: Capa C
- **related_phenomena**: METHOD-FCFF
- **possible_overlap**: Con METHOD-FCFF.
- **current_status**: CONCEPTUALMENTE RESPALDADO COMO POSIBILIDAD
- **open_questions**: ¿En qué scopes concretos aplica?
- **wrong_implementation_risk**: Asumir que cada scope necesita un DCF.
- **non_representation_risk**: Descartar DCF como herramienta útil en scopes específicos por la evidencia negativa a nivel consolidado.
- **disposition**: M-F — SECTORIAL / CONDICIONADO
- **implementation_status**: NOT_AUTHORIZED

### METHOD-RI — Residual Income / Excess Return

- **current_name**: Residual Income / Excess Return
- **current_formulation**: Conecta book equity (u otra base de capital) con la capacidad de generar retornos por encima o por debajo del Cost of Equity.
- **object_type**: método de valoración, candidato fuerte, no aprobado
- **origin_case**: C06 ("candidato metodológico más fuerte del caso")
- **origin_evidence_id**: E-06-007 (origen); E-07-014 (Goldman, candidato muy fuerte por ROE/book value); E-08-016 (Munich Re, candidato muy fuerte)
- **origin_epistemic_class**: IM
- **current_generality**: Capa B — familia: instituciones financieras prudencialmente reguladas
- **related_phenomena**: DISCOUNT-RATE, CAPITAL
- **possible_overlap**: Con DISCOUNT-RATE (requiere Cost of Equity, no aprobado).
- **current_status**: CANDIDATO MUY FUERTE en las tres instituciones financieras prudenciales, con razones económicas distintas en cada una
- **open_questions**: Base de capital económicamente adecuada (IFRS equity, adjusted equity, eligible own funds, SCR); tratamiento de intangibles y buybacks.
- **wrong_implementation_risk**: Un "motor de Residual Income" implementado sin aprobación experta.
- **non_representation_risk**: Descartar Residual Income pese a ser el candidato más consistente en tres economías financieras distintas.
- **disposition**: M-F — SECTORIAL / CONDICIONADO (Capa B)
- **implementation_status**: NOT_AUTHORIZED

### METHOD-FCFE — FCFE adaptado a capital

- **current_name**: FCFE adaptado a capital
- **current_formulation**: Puede interpretar conceptualmente la reinversión mediante el capital retenido necesario para soportar crecimiento y riesgo.
- **object_type**: método de valoración, candidato fuerte, no aprobado
- **origin_case**: C06
- **origin_evidence_id**: E-06-011 (§25 C); E-07-015 (Goldman: reinversión más amplia, no fórmula bancaria simplista); E-08-017 (Munich Re: equity reinvestment ≠ retained earnings ≠ cambio en eligible own funds/SCR)
- **origin_epistemic_class**: IM
- **current_generality**: Capa B
- **related_phenomena**: METHOD-RI, REINVESTMENT, CG
- **possible_overlap**: Con REINVESTMENT y CG.
- **current_status**: CANDIDATO FUERTE en la familia prudencial
- **open_questions**: Definición de equity reinvestment sin fórmula bancaria simplista.
- **wrong_implementation_risk**: Fórmula aprobada automáticamente sin revisión experta.
- **non_representation_risk**: Ninguna adicional.
- **disposition**: M-F — SECTORIAL / CONDICIONADO
- **implementation_status**: NOT_AUTHORIZED

### METHOD-DDM — Dividend Discount Model

- **current_name**: DDM
- **current_formulation**: DDM como método/enfoque de valoración de equity permanece candidato condicionado (Capa B), sin aprobar ni descartar. Distinto de eso: la abstracción literal "dividendo histórico / payout histórico = capacidad sostenible de distribución" se descarta explícitamente.
- **object_type**: método de valoración, candidato condicionado (método); abstracción literal descartada (lectura específica)
- **origin_case**: C06 (candidato fuerte, como método); su lectura literal se muestra insuficiente en C07 (recompras >> dividendos) y se descarta explícitamente en C08 ("DEMASIADO ESTRECHO")
- **origin_evidence_id**: E-06-012 (§25 D, origen del método como candidato); E-07-005 (recompras US$12.36B vs. dividendos US$4.42B, evidencia contra la lectura literal); E-08-018 (§27 F, "DDM literal: DEMASIADO ESTRECHO")
- **origin_epistemic_class**: IM
- **current_generality**: Capa B
- **related_phenomena**: METHOD-POTDIST
- **possible_overlap**: Con METHOD-POTDIST, que absorbe y amplía lo que la lectura literal de DDM no capturaba (buybacks, capital requerido, buffers) — DDM como método no se elimina ni se fusiona con Potential Distributions, ambos permanecen candidatos distintos.
- **current_status**: DDM COMO MÉTODO: CANDIDATO CONDICIONADO, NO APROBADO NI DESCARTADO. Su lectura literal (dividendo/payout histórico = capacidad sostenible de distribución) queda DESCARTADA COMO ABSTRACCIÓN — ver genealogía GAP-11
- **open_questions**: ¿En qué scope o economía DDM (no literal) sigue siendo un método preferible frente a Potential Distributions?
- **wrong_implementation_risk**: Proyectar mecánicamente el payout histórico como capacidad sostenible de distribución (lectura literal); o, en el extremo opuesto, tratar DDM como método completamente eliminado de Velarix.
- **non_representation_risk**: Mantener la lectura literal de DDM como único marco de distribuciones, ignorando buybacks y capital requerido.
- **disposition**: M-F — SECTORIAL / CONDICIONADO (DDM como método); M-I — DESCARTAR ABSTRACCIÓN (únicamente la lectura literal dividendo/payout histórico = capacidad sostenible de distribución)
- **implementation_status**: NOT_AUTHORIZED

### METHOD-POTDIST — Potential Distributions

- **current_name**: Potential Distributions
- **current_formulation**: Debe distinguir: dividendos + buybacks + capital requerido + crecimiento/riesgo + buffers + restricciones + capital management.
- **object_type**: método de valoración, candidato muy fuerte, no aprobado
- **origin_case**: C07 (evolución explícita desde DDM); consolidado en C08
- **origin_evidence_id**: E-07-005; E-08-009
- **origin_epistemic_class**: IM
- **current_generality**: Capa B
- **related_phenomena**: METHOD-DDM, CG
- **possible_overlap**: Con CG (mismo puente conceptual).
- **current_status**: CANDIDATO MUY FUERTE en la familia prudencial
- **open_questions**: ¿Cómo se interpreta "solvency ratio por encima del target" sin asumir que es automáticamente capital distribuible?
- **wrong_implementation_risk**: Motor de Potential Distributions sin aprobación experta.
- **non_representation_risk**: Ninguna adicional.
- **disposition**: M-F — SECTORIAL / CONDICIONADO
- **implementation_status**: NOT_AUTHORIZED

### METHOD-SOTP — Suma de partes (SOTP)

- **current_name**: SOTP (Sum-of-the-Parts)
- **current_formulation**: Candidato fuerte/muy fuerte según economía, pero puede destruir diversificación, interdependencias, asignación de capital, transferencias y sinergias; segmentos contables ≠ unidades obligatorias de valoración.
- **object_type**: método de valoración, candidato condicional, no aprobado
- **origin_case**: C06 (candidato a evaluar por materialidad); reforzado en C07 (candidato fuerte y más relevante que en Bancolombia) y C08 (candidato muy fuerte, con riesgo de un SOTP ingenuo)
- **origin_evidence_id**: E-06-013 (§25 E); E-07-008; E-08-009
- **origin_epistemic_class**: IM
- **current_generality**: Capa C (según economía)
- **related_phenomena**: R4, PERIMETER, ANALYSIS-UNIT
- **possible_overlap**: Con PERIMETER y ANALYSIS-UNIT (segmentos vs. unidad de valoración).
- **current_status**: CANDIDATO FUERTE/MUY FUERTE SEGÚN ECONOMÍA — no obligatorio
- **open_questions**: ¿Qué criterio evita que un SOTP ingenuo destruya interdependencias reales entre negocios?
- **wrong_implementation_risk**: Asumir que los segmentos IFRS/contables son automáticamente unidades obligatorias de valoración.
- **non_representation_risk**: Ninguna adicional.
- **disposition**: M-F — SECTORIAL / CONDICIONADO
- **implementation_status**: NOT_AUTHORIZED

### DISCOUNT-RATE — WACC / Cost of Equity

- **current_name**: Tasa de descuento — WACC / Cost of Equity
- **current_formulation**: WACC no es input universal obligatorio; no está eliminado. Cost of Equity es conceptualmente natural en métodos directos de equity, no aprobado.
- **object_type**: decisión/concepto humano, sin estructura
- **origin_case**: C06 (tensión documentada por primera vez); reforzado en C07 y C08
- **origin_evidence_id**: E-06-014 (§26); E-07-016 (§32 G); E-08-019 (§27 I, J)
- **origin_epistemic_class**: IM
- **current_generality**: Capa A (principio) / Capa C (tasa concreta)
- **related_phenomena**: METHOD-RI, METHOD-FCFE
- **possible_overlap**: Con los métodos de equity directo (RI, FCFE, DDM/PotDist), que requieren Cost of Equity en lugar de WACC.
- **current_status**: TENSIÓN DOCUMENTADA, NO RESUELTA — enviada a revisión posterior a los ocho casos
- **open_questions**: ¿Qué tasa aplica según método y objeto valorado?
- **wrong_implementation_risk**: Aprobar Cost of Equity, beta, ERP, country risk o una tasa concreta sin decisión humana explícita.
- **non_representation_risk**: Aplicar WACC como input obligatorio de toda valoración independientemente del método.
- **disposition**: M-C — CONCEPTO / DECISIÓN HUMANA SIN ESTRUCTURA
- **implementation_status**: NOT_AUTHORIZED

### METHOD-SELECTION — Selección de método / gobierno y trazabilidad

- **current_name**: Selección y gobierno de método de valoración
- **current_formulation**: Debe preservarse trazabilidad de: objeto económico valorado → scope → purpose → perímetro → unidad económica → métodos considerados → compatibilidad/incompatibilidad → evidencia → limitaciones → método finalmente aprobado → aprobador.
- **object_type**: necesidad de gobierno/trazabilidad, no un método en sí
- **origin_case**: C06 (formulación explícita, origen); confirmado sin expansión de diseño en C07 y C08
- **origin_evidence_id**: E-06-015 (§30, origen); E-07-017 (§9 del reporte de contraste, punto 11 "NO DEBE RESOLVERSE TODAVÍA" — continuidad, no expansión); E-08-020 (§30, punto 29 de la lista para consolidación — continuidad, no expansión)
- **origin_epistemic_class**: IM
- **current_generality**: Capa A
- **related_phenomena**: SCOPE, PURPOSE, ANALYSIS-UNIT, todos los METHOD-*
- **possible_overlap**: Estructural con todos los métodos — es el marco que los organiza, no un método adicional.
- **current_status**: NECESIDAD METODOLÓGICA RECONOCIDA EN C06 — NO DEBE RESOLVERSE TODAVÍA. C07 y C08 confirman la necesidad sin aportar diseño adicional (evidencia de continuidad, no de refuerzo independiente fuerte)
- **open_questions**: Diseño completo pendiente para 1B/1C.
- **wrong_implementation_risk**: `valuation_method` field, enum, selector automático, o "method engine".
- **non_representation_risk**: Aprobar un método sin trazabilidad de por qué era compatible con la economía y el objeto valorado.
- **disposition**: M-B — LLEVAR A DISEÑO 1B/1C
- **implementation_status**: NOT_AUTHORIZED

### HORIZON — Horizonte explícito

- **current_name**: Horizonte explícito del DCF
- **current_formulation**: Decisión vigente: 5 años fijos por ahora (Decisión 4 del Bloque 1B). Horizonte explícito ≠ vida contractual ≠ vida económica ≠ vida de empresa ≠ perpetuidad.
- **object_type**: decisión vigente, no autorizada a cambiar en esta consolidación
- **origin_case**: C01 (primera tensión conceptual); Decisión 4 preexistente al Caso 01; profundizada en C05, C06, C07, C08
- **origin_evidence_id**: E-05-008 (§20, tensión explícita); E-06-016 (§28); E-07-018 (§33); E-08-021 (§28)
- **origin_epistemic_class**: DC/IM
- **current_generality**: Capa A (principio) — decisión vigente Capa C
- **related_phenomena**: CB, STEADY-STATE, G
- **possible_overlap**: Con CB (ciclo de vida económico) — la vida de un activo/contrato no determina automáticamente el horizonte explícito.
- **current_status**: DECISIÓN VIGENTE (5 años fijos), NO CAMBIADA POR NINGÚN CASO NI POR ESTA CONSOLIDACIÓN
- **open_questions**: ¿Qué significa "estado estable" para compañías con activos finitos pero reinversión potencialmente continua (ISA)? — no resuelta.
- **wrong_implementation_risk**: Horizonte variable o automático sin decisión humana explícita del fundador.
- **non_representation_risk**: Asumir que 5 años es siempre suficiente sin advertir cuándo la empresa no se estabiliza en ese plazo (la propia Decisión 4 ya lo advertía).
- **disposition**: M-J — NO DECIDIR TODAVÍA
- **implementation_status**: NOT_AUTHORIZED

### STEADY-STATE — Estado estable

- **current_name**: Estado estable / steady state
- **current_formulation**: Steady state ≠ resultados idénticos todos los años. Debe representar una configuración económica sostenible/coherente y puede ser through-the-cycle. La definición concreta depende de economía + objeto + método.
- **object_type**: principio a formalizar
- **origin_case**: C01 (tensión inicial); profundizado en C05 (activos finitos + reinversión continua), C06 (convergencia ROE→Cost of Equity), C07 (normalized through-cycle profitability), C08 (through-the-cycle en seguros/reaseguros)
- **origin_evidence_id**: E-05-008 (§20); E-06-016 (§28); E-07-018 (§33); E-08-021 (§28)
- **origin_epistemic_class**: IM
- **current_generality**: Capa A (principio) / Capa C (significado concreto por economía)
- **related_phenomena**: HORIZON, G, CB
- **possible_overlap**: Con HORIZON y G.
- **current_status**: FORMALIZAR EL PRINCIPIO — significado concreto varía por economía (industrial, bancario, asegurador)
- **open_questions**: Ninguna nueva más allá de lo ya registrado en HORIZON.
- **wrong_implementation_risk**: Asumir un único significado de "estado estable" (ej. crecimiento constante) aplicable a toda economía.
- **non_representation_risk**: Exigir resultados idénticos año a año como criterio de estado estable, ignorando catástrofes/reserve development/ciclos de mercado.
- **disposition**: M-A — FORMALIZAR
- **implementation_status**: NOT_AUTHORIZED

### G — Crecimiento terminal (g)

- **current_name**: g (crecimiento terminal)
- **current_formulation**: g debe ser coherente con steady state, reinversión y retornos. No se aprueba valor nuevo ni algoritmo ni g dinámica.
- **object_type**: decisión vigente, no autorizada a cambiar
- **origin_case**: C01 (tensión conceptual); sin cambio en ningún caso posterior
- **origin_evidence_id**: E-01-003 (relación g→reinversión, mencionada en R3)
- **origin_epistemic_class**: DC
- **current_generality**: Capa A (principio) — decisión vigente Capa C
- **related_phenomena**: HORIZON, STEADY-STATE
- **possible_overlap**: Con STEADY-STATE y HORIZON.
- **current_status**: DECISIÓN VIGENTE, NO CAMBIADA POR NINGÚN CASO NI POR ESTA CONSOLIDACIÓN
- **open_questions**: Ninguna nueva.
- **wrong_implementation_risk**: g dinámica, algoritmo automático de g, o aprobación de un valor numérico nuevo.
- **non_representation_risk**: Fijar g sin verificar coherencia con reinversión y retornos sostenibles (ROIC vs. g).
- **disposition**: M-J — NO DECIDIR TODAVÍA
- **implementation_status**: NOT_AUTHORIZED

### PROCESS-ARCH — Arquitectura universal del proceso vs. arquitectura financiera específica

- **current_name**: Arquitectura universal del proceso de valoración ≠ arquitectura financiera universal del método
- **current_formulation**: Ver §4 de `00-INDICE-Y-SINTESIS-MAESTRA-V1.md` — inferencia metodológica central de esta consolidación.
- **object_type**: inferencia metodológica de más alto nivel
- **origin_case**: C06 (formulación explícita); reforzada en C07 (heterogeneidad intra-organizacional) y C08 (cierre de la primera batería)
- **origin_evidence_id**: E-06-017 (§29); E-07-019 (§36); E-08-022 (§7)
- **origin_epistemic_class**: IM
- **current_generality**: Capa A
- **related_phenomena**: todos — es el principio organizador de la consolidación completa
- **possible_overlap**: Ninguno estructural; es la síntesis de más alto nivel.
- **current_status**: INFERENCIA METODOLÓGICA CENTRAL — NUNCA ELEVADA A R9, NUNCA DECLARADA LEY UNIVERSAL
- **open_questions**: Ver los siete frentes de `04-BACKLOG-Y-PUENTE-1B-1C-V1.md`.
- **wrong_implementation_risk**: Tratar esta distinción como si ya autorizara diseño técnico concreto, en vez de un principio organizador para 1B/1C.
- **non_representation_risk**: Perder la distinción y volver a intentar una arquitectura financiera única para todas las empresas.
- **disposition**: M-A — FORMALIZAR EN METODOLOGÍA (como principio rector de todo lo demás)
- **implementation_status**: NOT_AUTHORIZED

---

## 2. Matriz Case × Phenomenon

Códigos: `SF` strong support · `WF` weak/compatible support · `EI`
insufficient evidence · `NM` non-material · `NR` not relevant/not
investigated because irrelevant · `ND` not determinable from frozen
evidence · `CT` contradiction/tension · `RF` reformulation · `EX`
expansion · `SP` split pressure · `MG` merge pressure · `SI`
sector/family instance · `CS` case-specific instance · `OR` origin.

Máximo 2 códigos primarios por celda, formato `CÓDIGO · EVIDENCE_ID`
cuando aplica. `—` indica que el candidato no existía todavía al momento
de ese caso (no investigado por no existir aún), no ausencia de
evidencia.

| Fenómeno | C01 | C02 | C03 | C04 | C05 | C06 | C07 | C08 |
|---|---|---|---|---|---|---|---|---|
| R1 | OR·E-01-001 | SF·E-02-004 | SF·E-03-006 | SF | SF | SF·E-06-001 | SF·E-07-001 | SF·E-08-010 |
| R2 | OR·E-01-002 | SF·E-02-004 | SF·E-03-003 | SF | SF | SF | SF | SF·E-08-010 |
| R3 | OR·E-01-003 | EX·E-02-005 | SF·E-03-006 | SF+CT | SF+CT | SF+CT | SF+CT·E-07-020 | SF+CT |
| R4 | OR·E-01-004 | RF·E-02-001 | EX·E-03-007 | SF+CT | SF·E-05-005 | SF | SF | SF·E-08-010 |
| R5 | OR·E-01-005 | SF | EX·(matiz) | SF | SF | SF | SF | SF |
| R6-HIST | OR·E-01-006 | MG·(scope/purpose empieza) | — | — | — | — | — | — |
| SCOPE | — | OR·E-02-002 | SF·E-03-005 | WF | WF | SF·E-06-006 | WF | SF |
| PURPOSE | — | OR·E-02-003 | EI·E-03-009 | SF·E-04-006 | WF | SF | SF·E-07-003 | SF |
| PERIMETER | — | EI·E-02-006 | OR·E-03-004 | SF·E-04-005 | SF·E-05-004 | SF·E-06-009 | SF·E-07-006 | SF·E-08-008 |
| ANALYSIS-UNIT | — | — | — | — | — | OR·E-06-006 | SF·E-07-006 | SF·E-08-008 |
| R7 | OR·E-01-007 | SF·E-02-008 | SF | SF | SF | SF | SF | SF |
| R8 | OR·E-01-008 | SF | SF | SF | SF | SF | SF | SF |
| CA | — | — | OR·E-03-001 | EI | EI | EI | SF+CT·E-07-001 | SF+RF·E-08-001 |
| CB | — | — | OR·E-03-002 | SF·E-04-003 | SF·E-05-002 | WF | SF | SF·E-08-002 |
| CC | — | — | OR·E-03-003 | SF·E-04-004 | WF | SF | SF | SF·E-08-003 |
| CD | — | — | — | OR·E-04-001 | EI | EI | EI·E-07-007 | EI |
| CE-HIST | — | — | — | OR·E-04-002 | SF+SP·E-05-003 | SF+SP·E-06-008 | SF+SP·E-07-002 | SF+SP·E-08-004 |
| MEASUREMENT-BASIS | — | — | — | — | — | WF | SF·E-07-002 | SF·E-08-004 |
| MONETARY-REGIME | — | — | — | OR | SF·E-05-003 | WF | EI | WF |
| CF | — | — | — | — | OR·E-05-001 | SF·E-06-005 | SF | SF+EX·E-08-005 |
| CG | — | — | — | — | — | OR·E-06-004 | SF·E-07-005 | SF+EX·E-08-006 |
| OBS-GS-COMP | — | — | — | — | — | — | OR·E-07-004 | EI·E-08-011 |
| OBS-MUNICH-EXPOSURE | — | — | — | — | — | — | — | OR·E-08-007 |
| SUPPLIER-FIN | OR·E-01-009 | SF·E-02-007 | NR | SF·E-04-007 | EI | NR·E-06-018 | NR | NR |
| LEASES | WF | NR | NR | OR(doble rol)·E-04-008 | SF·E-05-006 | SF | EI | EI |
| NWC | WF | NR | NR | NR | NR | CT·E-06-002 | SF | SF |
| CAPEX | WF | SF | SF | SF | SF+RF·E-05-007 | SF+EX | SF | SF |
| REINVESTMENT | — | — | — | — | — | OR·E-06-003 | EX | SF |
| DEBT | ND | ND | ND | ND | ND | OR·E-06-001 | SF | SF |
| NET-DEBT | ND | ND | ND | ND | ND | CT | SF | SF |
| CASH-LIQUIDITY | ND | ND | ND | ND | WF | OR·E-06-005 | SF | SF |
| CAPITAL | ND | ND | ND | ND | ND | OR·E-06-004 | SF·E-07-005 | SF |
| METHOD-EV | — | — | — | — | — | CT | CT | CT |
| METHOD-FCFF | — | — | — | — | — | CT | CT | CT |
| METHOD-DCF-SCOPE | — | — | — | — | — | ND | ND | SF |
| METHOD-RI | — | — | — | — | — | OR·E-06-007 | SF | SF·E-08-009 |
| METHOD-FCFE | — | — | — | — | — | SF | SF | SF·E-08-009 |
| METHOD-DDM | — | — | — | — | — | SF | CT·E-07-005 | RF·(→POTDIST) |
| METHOD-POTDIST | — | — | — | — | — | — | OR·E-07-005 | SF·E-08-009 |
| METHOD-SOTP | — | — | — | — | — | WF | SF·E-07-008 | SF·E-08-009 |
| DISCOUNT-RATE | ND | ND | ND | ND | ND | OR·(tensión) | CT | CT |
| METHOD-SELECTION | — | — | — | — | — | OR·E-06-015 | WF·E-07-017 | WF·E-08-020 |
| HORIZON | WF | ND | ND | ND | CT·(ISA) | ND | ND | ND |
| STEADY-STATE | WF | ND | ND | ND | CT | SF | SF | SF |
| G | WF | ND | ND | ND | ND | ND | ND | ND |
| PROCESS-ARCH | ND | ND | ND | ND | ND | OR | SF | SF |

**Notas de lectura de la matriz**:

- Las celdas `ND` (not determinable) para fenómenos financieros
  específicos de instituciones reguladas (DEBT, NET-DEBT,
  CASH-LIQUIDITY, CAPITAL, DISCOUNT-RATE, los METHOD-*, HORIZON, G,
  PROCESS-ARCH en C01–C05) reflejan que esos casos no investigaron
  economías financieras prudenciales — no representan ausencia de
  evidencia sobre una pregunta que sí se hizo.
- `NR` en SUPPLIER-FIN y NWC para C03, C06, C07, C08 refleja que los
  propios casos concluyeron irrelevancia o no materialidad para esa
  economía específica (ej. financiar clientes es el negocio del banco,
  no supplier financing propio).
- `SF+CT` combina soporte fuerte del núcleo del fenómeno con tensión
  sobre su representación formal (ej. R3, R4 extendido, CA, CE-HIST).
- Ninguna celda de esta matriz se llenó por inferencia retrospectiva no
  documentada en los 16 archivos congelados.
