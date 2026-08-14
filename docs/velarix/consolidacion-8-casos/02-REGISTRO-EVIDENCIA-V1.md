# Registro de Evidencia — Consolidación de los Ocho Casos — V1

**Fecha:** 2026-08-14
**Estado:** Documento de consolidación. NO autoriza implementación. NO
selecciona método de valoración. NO reabre Bloque 1E. NO reabre los
ocho casos congelados (`docs/velarix/casos/01-tecnoglass/` a
`docs/velarix/casos/08-munich-re/`), que permanecen tal como fueron
cerrados.
**Fuente:** los 16 documentos congelados de los Casos 01–08 (`CASO-0X-...-V0.md`
y `REPORTE-CONTRASTE-EXPEDIENTE-V1.md` de cada caso). Ninguno de esos 16
documentos fue modificado para producir este registro.

---

## 0. Propósito y disciplina de este documento

Este registro no reproduce cada párrafo de los 16 documentos congelados.
Registra evidencia **material** suficiente para reconstruir, para cada
fenómeno del `01-REGISTRO-FENOMENOS-Y-MATRIZ-V1.md`: origen, refuerzo,
reformulación, tensión, evidencia insuficiente material, elevación,
degradación, presión de división/fusión, y estado final después del
Caso 08.

**Clasificación epistémica (`epistemic_class`)** — distinta de la matriz
de fenómenos para evitar colisión de siglas:

- `HD` — Hecho Documentado (reportado por la compañía o por la síntesis
  recibida, sin verificación independiente adicional en la ejecución
  original).
- `DC` — Distinción Conceptual (construida por el analista a partir de
  hechos, no reportada literalmente por la compañía).
- `IA` — Inferencia Analítica (conclusión económica construida a partir
  de hechos documentados).
- `IM` — Inferencia Metodológica (conclusión sobre qué debería poder
  hacer Velarix, construida a partir de evidencia económica).
- `PA` — Pregunta Abierta (el propio caso la registra como no resuelta).
- `EVI` — Evidencia Insuficiente (el caso buscó evidencia sobre un
  fenómeno y no la encontró en magnitud material).

**Clase de independencia (`independence_class`)**:

- `IND` — Independiente (mecanismo económico distinto del de otra
  evidencia del mismo fenómeno; sin relación de derivación entre ellas).
- `PART` — Parcialmente independiente (mismo tipo de mecanismo, empresa o
  sector distintos).
- `DER` — Derivativa/correlacionada (depende de o repite el mecanismo de
  otra evidencia ya registrada).

`limitations` es obligatorio en cada entrada. Ninguna entrada de este
registro inventa una fuente primaria externa a los 16 documentos
congelados — estos son la fuente autoritativa de esta consolidación.

---

## 1. Caso 01 — Tecnoglass

### E-01-001
- **case_id**: C01
- **source_document**: `CASO-01-TECNOGLASS-V0.md`
- **section**: §6, §19 (R1)
- **source_locator**: "una tarifa se registra fuera de Cost of Sales... clasificación contable ≠ clasificación económica"
- **evidence_summary**: Tarifas (aranceles) registradas en operating expenses, no en Cost of Sales, aunque económicamente son un costo variable ligado al volumen importado.
- **epistemic_class**: HD (la ubicación contable) + IA (la interpretación económica)
- **phenomenon_id**: R1
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: Presión de margen bruto observada (37.8% H1 2026 vs. 44.3% H1 2025) atribuida en parte a tarifas.
- **analyst_interpretation**: Primera instancia documentada de que la ubicación contable de un costo no determina su driver económico.
- **limitations**: Cifras aproximadas, no re-verificadas independientemente por esta ejecución ni por la ejecución que compiló el caso original.

### E-01-002
- **case_id**: C01
- **source_document**: `CASO-01-TECNOGLASS-V0.md`
- **section**: §8, §19 (R2)
- **source_locator**: working capital observado (AR/inventory/AP) y normalizaciones candidatas (§12) sin evaluar
- **evidence_summary**: Saldos de working capital observados no equivalen automáticamente a saldos normalizados ni proyectables; existen candidatas a normalización (ERC, debt extinguishment, tarifas, FX) sin evaluar ni aprobar.
- **epistemic_class**: HD
- **phenomenon_id**: R2
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: Consumo de caja por AR (~USD 32.3M) e inventory (~USD 35.8M) en H1 2026.
- **analyst_interpretation**: Establece la necesidad de que reportado/normalizado/proyectado coexistan sin sobrescribirse.
- **limitations**: Ninguna normalización fue evaluada ni aprobada en el caso; candidatas identificadas, no resueltas.

### E-01-003
- **case_id**: C01
- **source_document**: `CASO-01-TECNOGLASS-V0.md`
- **section**: §15, §19 (R3)
- **source_locator**: "CAPEX de expansión → capacidad instalada → ingresos máximos posibles"; "backlog → producción necesaria → consumo de capacidad → working capital asociado"
- **evidence_summary**: Cadenas causales identificadas entre CAPEX, capacidad, ingresos, automatización, costos, backlog y working capital.
- **epistemic_class**: DC
- **phenomenon_id**: R3
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: No cuantificada; relaciones cualitativas.
- **analyst_interpretation**: Primera evidencia de que los supuestos no son independientes entre sí.
- **limitations**: No se diseñó `assumption_relations`; relaciones registradas como ejemplos, no exhaustivas ni universales.

### E-01-004
- **case_id**: C01
- **source_document**: `CASO-01-TECNOGLASS-V0.md`
- **section**: §6, §19 (R4)
- **source_locator**: "Cost of Sales no tiene desagregación pública suficiente (materiales/labor/energía/logística)"
- **evidence_summary**: Una cuenta agregada (Cost of Sales) requeriría descomposición económica que la fuente pública no ofrece.
- **epistemic_class**: HD (agregación) + PA (desglose deseado)
- **phenomenon_id**: R4
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: Cost of Sales H1 2026 ≈ USD 338.4M, sin desagregar.
- **analyst_interpretation**: Formulación inicial de R4 sesgada hacia descomposición **contable** — el Caso 02 la generalizará.
- **limitations**: Formulación de origen, no generalizada todavía; el propio Caso 02 la corrige.

### E-01-005
- **case_id**: C01
- **source_document**: `CASO-01-TECNOGLASS-V0.md`
- **section**: §16, §19 (R5)
- **source_locator**: tabla de hechos/inferencias/desconocidos §16
- **evidence_summary**: Aplicación explícita de clasificación epistémica (hecho documentado, inferencia razonable, desconocido, pregunta a gerencia, decisión de gerencia) a lo largo del caso.
- **epistemic_class**: DC
- **phenomenon_id**: R5
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: No aplica (fenómeno de proceso, no de magnitud).
- **analyst_interpretation**: Origen de la necesidad de estado de conocimiento explícito.
- **limitations**: Tabla de §16 explícitamente ilustrativa, no exhaustiva.

### E-01-006
- **case_id**: C01
- **source_document**: `CASO-01-TECNOGLASS-V0.md`
- **section**: §19 (R6, formulación histórica)
- **source_locator**: "El sistema debe poder declarar 'información insuficiente', sin rellenar automáticamente"
- **evidence_summary**: Formulación original de R6: capacidad del sistema de declarar información insuficiente (desglose de CAPEX, composición de Cost of Sales).
- **epistemic_class**: DC
- **phenomenon_id**: R6-HIST
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: No aplica.
- **analyst_interpretation**: Esta formulación es distinta del uso posterior de "R6" (método de determinación / `scope` / `purpose`), introducido desde el Caso 02 — ver GAP-01 en `03-GENEALOGIAS-Y-GAPS-V1.md`.
- **limitations**: Semantic ID drift documentado explícitamente; no se renumera retrospectivamente el Caso 01.

### E-01-007
- **case_id**: C01
- **source_document**: `CASO-01-TECNOGLASS-V0.md`
- **section**: §5, §19 (R7)
- **source_locator**: "backlog es central para Tecnoglass, pero no se propone como requisito universal"
- **evidence_summary**: El backlog (remaining performance obligations ≈ USD 884.2M) es el driver de ingresos central de Tecnoglass, explícitamente no generalizado.
- **epistemic_class**: HD
- **phenomenon_id**: R7
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: Backlog ≈ 90% de revenue anual 2025.
- **analyst_interpretation**: Primer ejemplo de driver específico de empresa.
- **limitations**: Un solo caso; no generalizable sin el Caso 02.

### E-01-008
- **case_id**: C01
- **source_document**: `CASO-01-TECNOGLASS-V0.md`
- **section**: §19 (R8)
- **source_locator**: lista de patrones de incoherencia (revenue > capacidad, margen sin driver, g sin ajuste, etc.)
- **evidence_summary**: Ocho ejemplos conceptuales de incoherencias detectables sin decidir tratamiento.
- **epistemic_class**: DC
- **phenomenon_id**: R8
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: No aplica.
- **analyst_interpretation**: Origen del principio "detectar sin decidir".
- **limitations**: Ejemplos, no lista cerrada.

### E-01-009
- **case_id**: C01
- **source_document**: `CASO-01-TECNOGLASS-V0.md`
- **section**: §8, §18
- **source_locator**: "¿El supplier finance debe entenderse como parte del ciclo operativo o como una fuente de financiamiento?"
- **evidence_summary**: Supplier finance (≈USD 21.7M) planteado como pregunta metodológica abierta, sin resolver.
- **epistemic_class**: PA
- **phenomenon_id**: SUPPLIER-FIN
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: ≈USD 21.7M sobre AP total de ≈USD 178.9M.
- **analyst_interpretation**: Primer instrumento que oscila entre NWC operativo y deuda financiera.
- **limitations**: Un solo instrumento, un solo caso; sin criterio de clasificación.

---

## 2. Caso 02 — Organización Terpel

### E-02-001
- **case_id**: C02
- **source_document**: `CASO-02-TERPEL-V0.md`
- **section**: §5, §14 (R4)
- **source_locator**: "una partida o variable material puede necesitar descomposición según la dimensión que explique su comportamiento económico"
- **evidence_summary**: Terpel muestra que la dimensión relevante de descomposición puede ser de negocio (EDS/Industria/Aviación & Marinos/Lubricantes/Servicios Complementarios), no solo contable.
- **epistemic_class**: IM
- **phenomenon_id**: R4
- **effect**: REFORMULATION
- **independence_class**: IND
- **materiality_note**: Cualitativa; sin cifras en este caso.
- **analyst_interpretation**: Corrige el sesgo contable de E-01-004 hacia una formulación multidimensional.
- **limitations**: Lista de dimensiones (contable, negocio, producto, canal, geografía, contrato) no declarada cerrada.

### E-02-002
- **case_id**: C02
- **source_document**: `CASO-02-TERPEL-V0.md`
- **section**: §11, §14 (R6)
- **source_locator**: "`scope` (alcance): ¿a qué aplica exactamente este supuesto?"
- **evidence_summary**: Introducción del candidato conceptual `scope` — necesidad de saber a qué unidad económica aplica un supuesto en una organización multinegocio/multigeografía.
- **epistemic_class**: DC
- **phenomenon_id**: SCOPE
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: No aplica (necesidad conceptual, no magnitud).
- **analyst_interpretation**: Origen del candidato `scope`, más adelante `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA`.
- **limitations**: Sin tipo, enum, ni estructura propuesta.

### E-02-003
- **case_id**: C02
- **source_document**: `CASO-02-TERPEL-V0.md`
- **section**: §11, §14 (R6)
- **source_locator**: "`purpose` (propósito): ¿para qué fue originalmente determinado o utilizado este supuesto?"
- **evidence_summary**: Introducción del candidato `purpose`, con evidencia más débil que `scope` en este caso.
- **epistemic_class**: DC
- **phenomenon_id**: PURPOSE
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: No aplica.
- **analyst_interpretation**: Origen del candidato `purpose`.
- **limitations**: Explícitamente "evidencia más débil que scope" en el propio caso.

### E-02-004
- **case_id**: C02
- **source_document**: `CASO-02-TERPEL-V0.md`
- **section**: §7, §14 (R1, R2)
- **source_locator**: decalaje — "EBITDA reportado ≠ EBITDA sin decalaje automáticamente correcto"
- **evidence_summary**: El decalaje (variación de precio sobre inventario) muestra que el EBITDA contable puede diferir materialmente del EBITDA "sin decalaje", sin que ninguno sustituya automáticamente al otro.
- **epistemic_class**: HD (existencia del fenómeno) + DC (regla de tratamiento)
- **phenomenon_id**: R1, R2
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: Sin cifras (caso conceptual, sin magnitudes numéricas).
- **analyst_interpretation**: Segunda instancia independiente de R1/R2, con mecanismo distinto al de Tecnoglass.
- **limitations**: Sin cifras; nivel estructural únicamente.

### E-02-005
- **case_id**: C02
- **source_document**: `CASO-02-TERPEL-V0.md`
- **section**: §6, §14 (R3)
- **source_locator**: "precio → inventario → decalaje → margen; plazo de proveedor → cuentas por pagar → NWC → caja"
- **evidence_summary**: Cadenas causales más largas que las de Tecnoglass, sugiriendo que una relación simple de dos elementos puede no bastar.
- **epistemic_class**: IA
- **phenomenon_id**: R3
- **effect**: DEEPEN
- **independence_class**: IND
- **materiality_note**: No cuantificada.
- **analyst_interpretation**: Primera señal de que `assumption_relations` podría necesitar representar cadenas, no solo pares.
- **limitations**: No se rediseñó la entidad; hipótesis, no diseño.

### E-02-006
- **case_id**: C02
- **source_document**: `CASO-02-TERPEL-V0.md`
- **section**: §12
- **source_locator**: "EVIDENCIA INSUFICIENTE PARA DISEÑAR SOLUCIÓN — VALIDAR EN CASOS FUTUROS"
- **evidence_summary**: Primera mención de comparabilidad/perímetro histórico (adquisiciones, ventas, reclasificaciones, operaciones discontinuadas) como hipótesis débil, sin evidencia cuantificada.
- **epistemic_class**: PA
- **phenomenon_id**: PERIMETER
- **effect**: ORIGIN (EVI)
- **independence_class**: IND
- **materiality_note**: No cuantificada.
- **analyst_interpretation**: Punto de partida de PERIMETER, antes de ser "problema demostrado" en el Caso 03.
- **limitations**: Explícitamente evidencia insuficiente en este caso.

### E-02-007
- **case_id**: C02
- **source_document**: `CASO-02-TERPEL-V0.md`
- **section**: §6
- **source_locator**: "ampliación del plazo de pago con Ecopetrol (proveedor)"
- **evidence_summary**: Segunda instancia de la familia de preguntas de supplier financing / cuentas comerciales con naturaleza mixta operativa-financiera, con Ecopetrol como proveedor de Terpel.
- **epistemic_class**: HD
- **phenomenon_id**: SUPPLIER-FIN
- **effect**: REINFORCE
- **independence_class**: PART
- **materiality_note**: No cuantificada en este caso.
- **analyst_interpretation**: Mismo tipo de pregunta que Tecnoglass, mecanismo distinto (plazo de proveedor concentrado vs. supplier finance con banco).
- **limitations**: Sin cifras; sin criterio de clasificación resuelto.

### E-02-008
- **case_id**: C02
- **source_document**: `CASO-02-TERPEL-V0.md`
- **section**: §5, §14 (R7)
- **source_locator**: "negocio × volumen/actividad × mecanismo de margen × geografía"
- **evidence_summary**: Terpel usa drivers radicalmente distintos de Tecnoglass (múltiples negocios con mecanismos de margen propios).
- **epistemic_class**: HD/DC
- **phenomenon_id**: R7
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: No cuantificada.
- **analyst_interpretation**: Segunda economía independiente confirmando ausencia de biblioteca universal de drivers.
- **limitations**: Sin cifras.

---

## 3. Caso 03 — Ecopetrol

### E-03-001
- **case_id**: C03
- **source_document**: `CASO-03-ECOPETROL-V0.md`
- **section**: §11, §18
- **source_locator**: "impairment neto ≈0 de 2025 ocultaba una reversión de ≈COP 0,3 billones en transporte/logística y un deterioro de ≈COP 0,3 billones en E&P"
- **evidence_summary**: Una cifra neta matemáticamente correcta puede ocultar movimientos brutos de naturaleza económica opuesta — origen del Candidato A (neteo).
- **epistemic_class**: HD (cifras) + IA (conclusión de neteo)
- **phenomenon_id**: CA
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: Reversión ≈COP 0.3bn vs. deterioro ≈COP 0.3bn, netos a ≈0.
- **analyst_interpretation**: Primera evidencia fuerte de que el neteo contable puede destruir información económicamente relevante.
- **limitations**: Un solo caso; sin desglose cuantitativo completo de mecanismos detrás de cada movimiento.

### E-03-002
- **case_id**: C03
- **source_document**: `CASO-03-ECOPETROL-V0.md`
- **section**: §8, §12, §18
- **source_locator**: reposición/agotamiento de reservas (§8); provisión de abandono/desmantelamiento (§12)
- **evidence_summary**: Ciclo económico específico de E&P (inversión→operación→mantenimiento/reposición→agotamiento→abandono), con etapas no vistas en Tecnoglass ni Terpel — origen del Candidato B.
- **epistemic_class**: HD (reservas ≈1,944.2 MMBOE, reposición ≈121%, vida media ≈7.8 años) + DC (ciclo)
- **phenomenon_id**: CB
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: Vida media de reservas ≈7.8 años; provisión de abandono material, monto no desagregado.
- **analyst_interpretation**: Primera evidencia de que algunos activos tienen un ciclo de vida económico relevante para la valoración.
- **limitations**: Etapas observadas conceptualmente, no taxonomía cerrada; monto de provisión de abandono desconocido en este caso.

### E-03-003
- **case_id**: C03
- **source_document**: `CASO-03-ECOPETROL-V0.md`
- **section**: §9, §18
- **source_locator**: FEPC — "≈COP 7,6 billones recibidos durante 2025 correspondientes al saldo causado en 2024"
- **evidence_summary**: Desacople entre período económico de origen del derecho, período de reconocimiento contable y período de caja — origen del Candidato C.
- **epistemic_class**: HD
- **phenomenon_id**: CC
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: ≈COP 3.0bn por cobrar al cierre; ≈COP 7.6bn cobrados en 2025 de saldo causado en 2024.
- **analyst_interpretation**: Primera evidencia clara de que fecha del hecho económico, fecha de reconocimiento y fecha de caja pueden diferir materialmente.
- **limitations**: Monto exacto causado durante 2025 no desagregado.

### E-03-004
- **case_id**: C03
- **source_document**: `CASO-03-ECOPETROL-V0.md`
- **section**: §13
- **source_locator**: "control de ≈51,4% de ISA... consolidación completa, deuda e intereses no controladores materiales"
- **evidence_summary**: ISA consolidada al 100% con solo ≈51.4% de control económico; primera evidencia directa (no solo hipótesis) de que perímetro consolidado ≠ atribución económica al accionista.
- **epistemic_class**: HD
- **phenomenon_id**: PERIMETER
- **effect**: ELEVATE (de EVI a "problema demostrado; evidencia insuficiente para solución general")
- **independence_class**: IND
- **materiality_note**: NCI material sobre la porción de ISA no poseída (≈48.6%).
- **analyst_interpretation**: Convierte la hipótesis débil de Terpel (E-02-006) en un problema demostrado con evidencia concreta.
- **limitations**: Sin desglose de deuda de ISA dentro de la deuda consolidada del grupo.

### E-03-005
- **case_id**: C03
- **source_document**: `CASO-03-ECOPETROL-V0.md`
- **section**: §13, §17 (R6)
- **source_locator**: "un supuesto puede aplicar al grupo consolidado, a un negocio, o a la porción atribuible a Ecopetrol después de NCI"
- **evidence_summary**: Tres alcances distintos y materialmente diferentes coexisten en el mismo caso, elevando `scope` a necesidad conceptual fuertemente respaldada.
- **epistemic_class**: IA
- **phenomenon_id**: SCOPE
- **effect**: ELEVATE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Caso con la evidencia más fuerte de `scope` hasta ese punto de la secuencia.
- **limitations**: No se propuso enum ni estructura.

### E-03-006
- **case_id**: C03
- **source_document**: `CASO-03-ECOPETROL-V0.md`
- **section**: §17 (R1, R2, R7, R8)
- **source_locator**: "Estado transversal: `PATRÓN OBSERVADO EN TRES CASOS`"
- **evidence_summary**: R1, R2, R7 y R8 reaparecen de forma transversal e idéntica en Tecnoglass, Terpel y Ecopetrol.
- **epistemic_class**: IM
- **phenomenon_id**: R1, R2, R7, R8
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Primer punto en la secuencia donde se usa la etiqueta "patrón observado en N casos" con disciplina explícita (nunca "confirmado").
- **limitations**: Etiqueta de evidencia, no de ley universal.

### E-03-007
- **case_id**: C03
- **source_document**: `CASO-03-ECOPETROL-V0.md`
- **section**: §11, §17 (R4)
- **source_locator**: "la necesidad de descomposición puede aparecer no solo en cuentas o partidas, sino también en cifras netas... y en movimientos agregados"
- **evidence_summary**: Extensión candidata de R4 hacia cifras netas (impairment) y movimientos (reservas), no solo partidas/cuentas.
- **epistemic_class**: IA
- **phenomenon_id**: R4
- **effect**: EXPANSION (candidata, no adoptada como cambio de formulación base)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Extensión registrada como candidata, absorbida conceptualmente en la relación con CA, sin modificar la formulación base de R4.
- **limitations**: "A validar en casos futuros"; no se cambia la formulación de R4 en el propio Caso 03.

### E-03-008
- **case_id**: C03
- **source_document**: `CASO-03-ECOPETROL-V0.md`
- **section**: §14
- **source_locator**: "que una operación desaparezca en consolidación no significa que deje de explicar la economía de los negocios subyacentes"
- **evidence_summary**: Operaciones intragrupo económicamente relevantes que desaparecen contablemente al consolidar.
- **epistemic_class**: DC
- **phenomenon_id**: R1, PERIMETER
- **effect**: REINFORCE
- **independence_class**: PART
- **materiality_note**: No cuantificada.
- **analyst_interpretation**: Refuerza R1 con un mecanismo adicional (invisibilidad intragrupo), sin crear candidato independiente.
- **limitations**: Sin cifras específicas del detalle intragrupo.

### E-03-009
- **case_id**: C03
- **source_document**: `CASO-03-ECOPETROL-V0.md`
- **section**: §17 (R6)
- **source_locator**: "`purpose` (propósito original de un supuesto) permanece: `PREGUNTA CONCEPTUAL ABIERTA — EVIDENCIA MENOR QUE SCOPE` — este caso no aportó evidencia directa nueva sobre propósito original de una cifra específica"
- **evidence_summary**: El propio Caso 03 declara explícitamente que no aportó evidencia directa nueva sobre `purpose`, a diferencia de `scope`, que sí se elevó en este mismo caso (E-03-005).
- **epistemic_class**: EVI
- **phenomenon_id**: PURPOSE
- **effect**: INSUFFICIENT
- **independence_class**: N/A
- **materiality_note**: N/A.
- **analyst_interpretation**: Ecopetrol refuerza fuertemente `scope` (E-03-005) pero no `purpose` — ambas necesidades se mantienen explícitamente separadas y sin fusionarse, con niveles de evidencia distintos en este mismo caso.
- **limitations**: Ausencia de evidencia, no evidencia de ausencia — un caso futuro podría aportar evidencia directa de `purpose` en un contexto similar (grupo consolidado con NCI) sin que este documento lo anticipe.

---

## 4. Caso 04 — Grupo Éxito

### E-04-001
- **case_id**: C04
- **source_document**: `CASO-04-GRUPO-EXITO-V0.md`
- **section**: §15, §22
- **source_locator**: "opción de venta (put) sobre participaciones no controladoras de Grupo Disco Uruguay... ejercida parcialmente en 2025 (23,35% → 7,69%)"
- **evidence_summary**: La atribución económica de una entidad consolidada puede depender de derechos u obligaciones contractuales capaces de modificarla, no solo de la propiedad actual — origen del Candidato D.
- **epistemic_class**: HD
- **phenomenon_id**: CD
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: Pasivo financiero ≈COP 350,776M asociado al put al cierre de 2024; NCI de Grupo Disco Uruguay 23.35% → 7.69%.
- **analyst_interpretation**: Primera evidencia de propiedad económica dinámica ligada a un derecho contractual, no a un evento estructural completado.
- **limitations**: Un solo caso; mecanismo específico (opción put), no generalizado.

### E-04-002
- **case_id**: C04
- **source_document**: `CASO-04-GRUPO-EXITO-V0.md`
- **section**: §16, §22
- **source_locator**: "Argentina se trata como economía hiperinflacionaria... estados financieros ajustados conforme a NIC 29"
- **evidence_summary**: Dos cifras del mismo cierre contable pueden no ser económicamente comparables entre sí sin comprender cómo fueron medidas — origen del Candidato E.
- **epistemic_class**: HD
- **phenomenon_id**: CE-HIST
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: Inflación acumulada de tres años en Argentina >100%.
- **analyst_interpretation**: Origen compuesto de measurement basis + monetary regime, antes de la separación conceptual posterior.
- **limitations**: El propio candidato se registra como potencialmente compuesto desde ISA (Caso 05) en adelante — ver GAP-05.

### E-04-003
- **case_id**: C04
- **source_document**: `CASO-04-GRUPO-EXITO-V0.md`
- **section**: §14, §22
- **source_locator**: "18 tiendas remodeladas/convertidas y 43 tiendas cerradas en 2025"
- **evidence_summary**: Ciclo de vida económico de naturaleza distinta al de Ecopetrol: apertura→operación→remodelación/conversión→posible cierre.
- **epistemic_class**: HD
- **phenomenon_id**: CB
- **effect**: REINFORCE (elevado a "dos casos de naturaleza económica muy distinta")
- **independence_class**: IND
- **materiality_note**: 43 cierres de tienda en 2025 (20 Colombia, 11 Uruguay, 12 Argentina).
- **analyst_interpretation**: Segunda economía radicalmente distinta (retail físico vs. E&P) con ciclo de vida propio.
- **limitations**: Dos casos siguen sin ser suficientes para formulación general.

### E-04-004
- **case_id**: C04
- **source_document**: `CASO-04-GRUPO-EXITO-V0.md`
- **section**: §19, §22
- **source_locator**: "la propia compañía declara expresamente que el cambio en el perímetro de consolidación... limita la comparabilidad frente al año anterior"
- **evidence_summary**: Información posterior al corte (2T26) donde la propia compañía reconoce que un cambio de perímetro (Argentina, La Anónima) limita la comparabilidad.
- **epistemic_class**: HD
- **phenomenon_id**: CC, PERIMETER
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: Desde 1-jun-2026, terceros operan la mayoría del retail argentino.
- **analyst_interpretation**: La propia compañía, no solo el analista, reconoce el problema de comparabilidad — refuerzo particularmente fuerte.
- **limitations**: Información posterior al corte, no reescribe el perímetro al 31-dic-2025.

### E-04-005
- **case_id**: C04
- **source_document**: `CASO-04-GRUPO-EXITO-V0.md`
- **section**: §8, §21
- **source_locator**: "estructuras 'Viva'... participación atribuible al Grupo 26,01%, NCI 73,99%"
- **evidence_summary**: Segunda economía (retail/inmobiliario) con NCI materiales y JVs al 50% fuera de consolidación línea por línea, distinta de la estructura energética de Ecopetrol.
- **epistemic_class**: HD
- **phenomenon_id**: PERIMETER
- **effect**: ELEVATE (a "problema demostrado en múltiples economías")
- **independence_class**: IND
- **materiality_note**: NCI de 73.99% en estructuras Viva.
- **analyst_interpretation**: El problema de perímetro no es específico de un grupo energético con subsidiaria eléctrica.
- **limitations**: Mecanismo contractual detrás de las estructuras "Viva" no explicado en el material de trabajo.

### E-04-006
- **case_id**: C04
- **source_document**: `CASO-04-GRUPO-EXITO-V0.md`
- **section**: §12, §20 (R6)
- **source_locator**: "un supuesto válido para impairment o para el fair value de un inmueble no es automáticamente válido para una valoración profesional del equity"
- **evidence_summary**: Tasas de descuento para impairment, supuestos de UGE y metodologías de fair value inmobiliario, determinadas con propósito distinto al de valoración de equity.
- **epistemic_class**: IA
- **phenomenon_id**: PURPOSE
- **effect**: ELEVATE
- **independence_class**: IND
- **materiality_note**: Diferencia libro vs. fair value inmobiliario ≈COP 2.83bn.
- **analyst_interpretation**: Primera evidencia particularmente limpia de que `purpose` importa, más allá de la mención débil del Caso 02.
- **limitations**: Sin resolución de diseño de `purpose`.

### E-04-007
- **case_id**: C04
- **source_document**: `CASO-04-GRUPO-EXITO-V0.md`
- **section**: §9, §23
- **source_locator**: "convenios con algunas instituciones financieras que otorgan un período adicional de pago sobre determinadas facturas descontadas"
- **evidence_summary**: Tercera instancia de supplier financing, con mecanismo distinto (anticipación bancaria elegida por proveedor + convenio de plazo).
- **epistemic_class**: HD
- **phenomenon_id**: SUPPLIER-FIN
- **effect**: REINFORCE (a "problema fuertemente reforzado")
- **independence_class**: IND
- **materiality_note**: Saldo de convenio ≈COP 519,145M.
- **analyst_interpretation**: Ni "banco en el mecanismo = deuda" ni "presentación comercial = NWC" son correctos por sí solos.
- **limitations**: Sin criterio de clasificación resuelto.

### E-04-008
- **case_id**: C04
- **source_document**: `CASO-04-GRUPO-EXITO-V0.md`
- **section**: §11, §24
- **source_locator**: "Grupo Éxito no solo es arrendatario... también actúa como arrendador dentro de su negocio inmobiliario"
- **evidence_summary**: Primera instancia de doble rol lessee/lessor dentro del mismo grupo.
- **epistemic_class**: HD
- **phenomenon_id**: LEASES
- **effect**: ORIGIN (del mecanismo de doble rol; el problema de leases ya existía desde Tecnoglass)
- **independence_class**: IND
- **materiality_note**: Pasivo por arrendamiento ≈COP 1,993,319M; plazo promedio remanente 13 años.
- **analyst_interpretation**: Refuerza que `lease = deuda` o `lease = operación` son ambas simplificaciones incorrectas.
- **limitations**: Sin desglose de renta variable ni de corto plazo/bajo valor.

---

## 5. Caso 05 — ISA

### E-05-001
- **case_id**: C05
- **source_document**: `CASO-05-ISA-V0.md`
- **section**: §15, §24
- **source_locator**: "el reconocimiento, titularidad o control de un recurso no implica necesariamente que esté económicamente disponible para cualquier propósito"
- **evidence_summary**: ISA muestra evidencia fuerte de efectivo restringido — origen de la observación ISA-F.
- **epistemic_class**: HD (existencia del efectivo restringido) + DC (formulación)
- **phenomenon_id**: CF
- **effect**: ORIGIN (como observación, no candidato formal todavía)
- **independence_class**: IND
- **materiality_note**: Sin cifras (caso conceptual).
- **analyst_interpretation**: Origen de lo que se elevará formalmente a Candidato F después del Caso 08.
- **limitations**: Explícitamente "no es todavía un Candidato F formal" en el propio Caso 05.

### E-05-002
- **case_id**: C05
- **source_document**: `CASO-05-ISA-V0.md`
- **section**: §9, §13, §24
- **source_locator**: "adjudicación → construcción → entrada en operación → explotación/O&M → refuerzos/reposición → vencimiento contractual → reversión/indemnización/renovación"
- **evidence_summary**: Tercer ciclo de vida económico, de naturaleza distinta a Ecopetrol y Grupo Éxito (concesiones con vencimiento contractual).
- **epistemic_class**: DC
- **phenomenon_id**: CB
- **effect**: REINFORCE (a "tres casos de naturaleza económica muy distinta")
- **independence_class**: IND
- **materiality_note**: Sin cifras.
- **analyst_interpretation**: Refuerza que el ciclo de vida debe evaluarse respecto de la unidad económica pertinente (activo/proyecto/contrato ≠ ciclo de la compañía).
- **limitations**: Formulación general aún abierta con tres casos.

### E-05-003
- **case_id**: C05
- **source_document**: `CASO-05-ISA-V0.md`
- **section**: §6, §24
- **source_locator**: "monedas funcionales y monedas contractuales potencialmente distintas entre sí, con indexaciones y coberturas"
- **evidence_summary**: Segunda economía con evidencia de Candidato E, mediante mecanismo distinto (indexación/cobertura contractual) al de Grupo Éxito (hiperinflación).
- **epistemic_class**: DC
- **phenomenon_id**: CE-HIST
- **effect**: REINFORCE + TENSION (posible heterogeneidad interna del candidato)
- **independence_class**: PART
- **materiality_note**: Sin cifras.
- **analyst_interpretation**: Primera señal explícita de que el Candidato E puede estar agrupando fenómenos metodológicamente distintos.
- **limitations**: No se dividió el candidato en este caso.

### E-05-004
- **case_id**: C05
- **source_document**: `CASO-05-ISA-V0.md`
- **section**: §14, §23
- **source_locator**: "ISA aporta una nueva instancia... el fenómeno se observa dentro de la propia entidad que se está estudiando como caso"
- **evidence_summary**: Consolidación con control ≠ propiedad económica, NCI y JVs/asociadas concentradas dentro de una sola entidad (no solo entre matriz/subsidiaria como en Ecopetrol o Éxito).
- **epistemic_class**: HD
- **phenomenon_id**: PERIMETER
- **effect**: ELEVATE (a "problema fuertemente demostrado; evidencia suficiente para exigir tratamiento metodológico")
- **independence_class**: IND
- **materiality_note**: Sin cifras específicas de participación en este caso.
- **analyst_interpretation**: Evidencia más concentrada y multifacética que Ecopetrol o Grupo Éxito por separado.
- **limitations**: Sin evidencia suficiente para representación general.

### E-05-005
- **case_id**: C05
- **source_document**: `CASO-05-ISA-V0.md`
- **section**: §12, §22 (R4)
- **source_locator**: "la descomposición debería detenerse cuando una granularidad adicional deja de modificar materialmente la interpretación económica necesaria para el propósito del análisis"
- **evidence_summary**: Formulación de cautela para R4: cuándo detener la descomposición.
- **epistemic_class**: DC
- **phenomenon_id**: R4
- **effect**: DEEPEN
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Guía conceptual, no umbral numérico ni campo a implementar.
- **limitations**: No define un criterio operacional cuantitativo.

### E-05-006
- **case_id**: C05
- **source_document**: `CASO-05-ISA-V0.md`
- **section**: §16, §26
- **source_locator**: "ISA es la segunda instancia, después de Grupo Éxito, de un mismo grupo actuando simultáneamente como arrendatario y arrendador"
- **evidence_summary**: Segunda instancia de doble rol lessee/lessor, con arrendamientos financieros y operativos según contrato.
- **epistemic_class**: HD
- **phenomenon_id**: LEASES
- **effect**: REINFORCE
- **independence_class**: PART
- **materiality_note**: Sin cifras.
- **analyst_interpretation**: Confirma que el problema de leases no es idiosincrático de Grupo Éxito.
- **limitations**: Sin cambio de estado formal (se mantiene "problema demostrado — tratamiento no generalizado").

### E-05-007
- **case_id**: C05
- **source_document**: `CASO-05-ISA-V0.md`
- **section**: §18
- **source_locator**: "la clasificación contable del desembolso en el estado de flujos de efectivo no determina por sí sola si existe inversión económica"
- **evidence_summary**: Cautela nueva de CAPEX: un desembolso puede clasificarse contablemente de una forma y, aun así, ser económicamente inversión de expansión o mantenimiento (o viceversa).
- **epistemic_class**: DC
- **phenomenon_id**: CAPEX
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: Sin cifras.
- **analyst_interpretation**: Quinto caso independiente reforzando que CAPEX = % de ingresos no es metodología defendible.
- **limitations**: No propone taxonomía nueva de CAPEX.

### E-05-008
- **case_id**: C05
- **source_document**: `CASO-05-ISA-V0.md`
- **section**: §20
- **source_locator**: "vida física del activo ≠ vida contractual ≠ horizonte explícito ≠ vida de la empresa ≠ perpetuidad... un portafolio de activos/concesiones finitos, dentro de una empresa que puede seguir reinvirtiendo y obteniendo nuevos proyectos, no encaja naturalmente en la idea de '5 años y luego estado estable'"
- **evidence_summary**: Primera tensión formal y con ejemplo concreto entre la Decisión 4 (horizonte fijo de 5 años) y la evidencia metodológica acumulada: ISA tiene activos/concesiones finitos pero capacidad de reinversión potencialmente continua.
- **epistemic_class**: IA
- **phenomenon_id**: HORIZON, STEADY-STATE
- **effect**: TENSION
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Primer ejemplo concreto de por qué el horizonte fijo no debe asumirse como arquitectura universal futura, sin que ello autorice cambiar la Decisión 4 en este caso.
- **limitations**: No se resuelve la pregunta abierta en el propio Caso 05; no se aprueba horizonte ni g.

---

## 6. Caso 06 — Grupo Cibest / Bancolombia S.A.

### E-06-001
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §9, §10
- **source_locator**: "el margen entre lo que cuesta el fondeo (depósitos, deuda) y lo que rinde la cartera es la operación, no un elemento financiero separado de ella"
- **evidence_summary**: Primera institución financiera regulada de la secuencia: depósitos e intereses forman el motor económico central (NIM), no financiación externa a la operación.
- **epistemic_class**: HD (depósitos dominantes) + IA (conclusión de R1)
- **phenomenon_id**: R1, DEBT
- **effect**: REINFORCE (nuevo mecanismo)
- **independence_class**: IND
- **materiality_note**: Depósitos de clientes materialmente dominantes en pasivos (sin cifra exacta en el material de trabajo).
- **analyst_interpretation**: La dicotomía industrial "interés = financiación externa" no se traslada mecánicamente al core bancario.
- **limitations**: Sin desglose cuantitativo de depósitos por tipo/plazo/costo.

### E-06-002
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §14
- **source_locator**: "el concepto industrial convencional de capital de trabajo neto (NWC) no aparece como un driver económicamente adecuado para el core bancario"
- **evidence_summary**: NWC industrial no es driver relevante para el core bancario, sin que esto elimine NWC como concepto de Velarix.
- **epistemic_class**: IA
- **phenomenon_id**: NWC
- **effect**: TENSION (refutación de universalidad, no del concepto)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Primera evidencia fuerte contra la universalidad industrial de NWC.
- **limitations**: Aplica al core bancario consolidado; no se generaliza a todo scope bancario.

### E-06-003
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §15
- **source_locator**: "el crecimiento de un banco puede exigir, además, retención de capital que soporte activos, riesgo y requerimientos prudenciales"
- **evidence_summary**: CAPEX contable no representa necesariamente toda la reinversión económica de un banco; la retención de capital regulatorio es una forma de reinversión sin equivalente industrial exacto.
- **epistemic_class**: IA
- **phenomenon_id**: CAPEX, REINVESTMENT
- **effect**: EXPANSION (separación conceptual CAPEX vs. reinversión económica)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Primera evidencia clara de la separación CAPEX ≠ reinversión económica total.
- **limitations**: No propone fórmula que combine CAPEX y retención de capital.

### E-06-004
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §13, §22
- **source_locator**: "la generación de utilidad o la existencia de patrimonio contable en Bancolombia S.A. no determina por sí sola cuánto capital puede fluir hacia Grupo Cibest"
- **evidence_summary**: Puente conceptual entre resultado, retención necesaria, capital regulatorio, capital excedentario y capacidad de distribución al accionista final — origen de la observación Bancolombia-G.
- **epistemic_class**: IA
- **phenomenon_id**: CG
- **effect**: ORIGIN (como observación sectorial, no candidato transversal)
- **independence_class**: IND
- **materiality_note**: Sin cifras específicas de capital regulatorio en el material de trabajo.
- **analyst_interpretation**: Primer mecanismo económico del puente capital → distribución en una institución prudencialmente regulada.
- **limitations**: Explícitamente "no se llama Candidato G" en el propio Caso 06; sin fusión con ISA-F.

### E-06-005
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §12, §22
- **source_locator**: "cash contable ≠ liquidez prudencial/regulatoria ≠ cash económicamente excedentario ≠ cash distribuible"
- **evidence_summary**: Segunda instancia, después de ISA, de que reconocimiento/titularidad de un recurso no equivale a disponibilidad económica — mecanismo distinto (liquidez prudencial bancaria vs. efectivo restringido contractualmente).
- **epistemic_class**: DC
- **phenomenon_id**: CF
- **effect**: REINFORCE (a "observación transversal fuertemente reforzada en dos economías radicalmente distintas")
- **independence_class**: IND
- **materiality_note**: Sin cifras específicas.
- **analyst_interpretation**: Segunda economía radicalmente distinta reforzando la observación de disponibilidad de recursos.
- **limitations**: No se afirma que toda la caja bancaria esté restringida.

### E-06-006
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §6, §20 (R6)
- **source_locator**: "Grupo Cibest ≠ Bancolombia S.A. ≠ necesariamente la unidad regulatoria relevante ≠ automáticamente el flujo disponible al accionista final"
- **evidence_summary**: El mismo nombre coloquial ("Bancolombia") puede referirse al holding cotizado, al banco operativo regulado o al grupo consolidado, cada uno con economía y regulación distintas.
- **epistemic_class**: HD
- **phenomenon_id**: SCOPE, ANALYSIS-UNIT
- **effect**: REINFORCE (refuerzo muy fuerte, sin elevar de nivel formal)
- **independence_class**: IND
- **materiality_note**: Reorganización societaria completada en mayo de 2025.
- **analyst_interpretation**: El ejemplo más directo hasta ese punto de por qué `scope` es una necesidad conceptual fuertemente respaldada.
- **limitations**: No propone estructura ni enum.

### E-06-007
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §25
- **source_locator**: "Residual Income / Excess Return: CANDIDATO METODOLÓGICO MÁS FUERTE DEL CASO"
- **evidence_summary**: Residual Income conecta book equity con ROE por encima/debajo del Cost of Equity — candidato metodológico más fuerte, sin aprobar.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-RI
- **effect**: ORIGIN (como candidato fuerte)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Primera evidencia de que un método de equity directo puede ser más adecuado que EV/FCFF para bancos.
- **limitations**: No aprobado; riesgos identificados sin resolver (book equity, ROE afectado por reorganización).

### E-06-008
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §22 (Candidato E)
- **source_locator**: "Bancolombia refuerza que 'base de medición' y 'régimen monetario / moneda' pueden ser fenómenos relacionados pero metodológicamente distintos"
- **evidence_summary**: Tercera economía con evidencia de Candidato E (costo amortizado, FVOCI, FVTPL, ECL vs. moneda funcional/FX), que tensiona en vez de simplemente reforzar la formulación general.
- **epistemic_class**: DC
- **phenomenon_id**: MEASUREMENT-BASIS, MONETARY-REGIME
- **effect**: TENSION
- **independence_class**: PART
- **materiality_note**: Sin cifras específicas.
- **analyst_interpretation**: Refuerza la presión de división del candidato, sin dividirlo.
- **limitations**: No se divide en E1/E2 en este caso.

### E-06-009
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §21
- **source_locator**: "PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS, AHORA INCLUYENDO UNA INSTITUCIÓN FINANCIERA"
- **evidence_summary**: Comparabilidad/perímetro reaparece por primera vez en una institución financiera regulada (holding vs. banco operativo, Banistmo como operación discontinuada).
- **epistemic_class**: HD
- **phenomenon_id**: PERIMETER
- **effect**: ELEVATE
- **independence_class**: IND
- **materiality_note**: Sin cifras del acuerdo Banistmo en este caso.
- **analyst_interpretation**: Amplía el rango de economías donde reaparece el problema de perímetro.
- **limitations**: Sin representación general de diseño.

### E-06-010
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §25 A
- **source_locator**: "EV / FCFF + WACC convencional: NO ADECUADO COMO DEFAULT PARA EL CORE BANCARIO"
- **evidence_summary**: Enterprise Value y FCFF/WACC convencional evaluados conjuntamente como método (misma subsección del caso) y ambos resultan no adecuados como default para el core bancario, sin quedar prohibidos ni eliminados.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-EV, METHOD-FCFF
- **effect**: ORIGIN (primera evaluación explícita de EV y FCFF como métodos frente a una economía financiera prudencial)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Explícitamente "no escribir 'FCFF está prohibido para bancos' ni 'Enterprise Value no existe para bancos'" — la conclusión es solo que no deben asumirse automáticamente como default.
- **limitations**: Evaluación conjunta en una sola subsección del caso; Goldman Sachs y Munich Re las separan en subsecciones distintas.

### E-06-011
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §25 C
- **source_locator**: "FCFE adaptado a capital: CANDIDATO FUERTE"
- **evidence_summary**: FCFE adaptado a capital puede interpretar conceptualmente la reinversión bancaria mediante el capital retenido necesario para soportar crecimiento y riesgo.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-FCFE
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Primer candidato metodológico de equity directo adaptado a capital regulatorio.
- **limitations**: Ninguna fórmula aprobada; requiere supuestos de crecimiento, RWA, capital requerido, buffers.

### E-06-012
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §25 D
- **source_locator**: "DDM / dividendos potenciales: CANDIDATO FUERTE. Pero: dividendo observado ≠ automáticamente dividendo sostenible o distribuible"
- **evidence_summary**: DDM se documenta como candidato fuerte, con la cautela explícita de que no debe proyectarse mecánicamente el payout histórico.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-DDM
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Origen de METHOD-DDM como candidato — la evolución posterior hacia Potential Distributions (C07/C08) no invalida esta evaluación inicial de DDM como método potencial.
- **limitations**: No aprobado; la cautela sobre dividendo observado ≠ sostenible ya anticipa la insuficiencia de la lectura literal.

### E-06-013
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §25 E
- **source_locator**: "SOTP (suma de partes): CANDIDATO A EVALUAR POR MATERIALIDAD"
- **evidence_summary**: SOTP puede ser relevante dado que Grupo Cibest puede incluir Bancolombia S.A., otras entidades financieras y negocios no financieros bajo el mismo holding.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-SOTP
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Primera evaluación de SOTP como candidato condicionado por materialidad, no obligatorio.
- **limitations**: "Más granularidad ≠ automáticamente mejor valoración" — cautela explícita desde el origen.

### E-06-014
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §26
- **source_locator**: "Bancolombia aporta evidencia de que WACC no debería asumirse como input obligatorio de toda valoración... el Cost of Equity puede ser la tasa relevante"
- **evidence_summary**: Origen de la tensión metodológica WACC vs. Cost of Equity, documentada sin resolver y sin modificar la Decisión 1 del Bloque 1B.
- **epistemic_class**: IM
- **phenomenon_id**: DISCOUNT-RATE
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Primera instancia donde se cuestiona explícitamente la obligatoriedad universal de WACC como input de toda valoración.
- **limitations**: Tensión enviada a revisión posterior a los ocho casos; no se aprueba Cost of Equity ni un WACC nuevo.

### E-06-015
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §30
- **source_locator**: "el Expediente queda conceptualmente incompleto si presupone que 'la empresa' es siempre un objeto suficientemente preciso para valorar"
- **evidence_summary**: Necesidad de establecer explícitamente qué interés económico se intenta valorar, y de documentar qué métodos fueron considerados, por qué uno es compatible y otro no, y qué método aprueba finalmente el experto.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-SELECTION
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Origen explícito de la necesidad de gobierno/trazabilidad de selección de método, distinta de la aprobación de cualquier método concreto.
- **limitations**: "Esto es una necesidad metodológica, no un diseño de datos" — no se crea `valuation_method` field, enum, selector, ni "method engine".

### E-06-016
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §28
- **source_locator**: "'estado estable' puede relacionarse con la convergencia de los retornos económicos (ej. ROE convergiendo hacia el Cost of Equity)... no con la desaparición física de la entidad"
- **evidence_summary**: Primera institución financiera con un significado de "estado estable" distinto del industrial (convergencia ROE→Cost of Equity y crecimiento sostenible del balance).
- **epistemic_class**: IM
- **phenomenon_id**: HORIZON, STEADY-STATE
- **effect**: DEEPEN
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Refuerza que el horizonte fijo de 5 años (Decisión 4) no cambia, mientras el significado de "estado estable" se profundiza conceptualmente.
- **limitations**: No se aprueba horizonte nuevo ni g; no se cambia la Decisión 4.

### E-06-017
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §29
- **source_locator**: "ARQUITECTURA UNIVERSAL DEL PROCESO DE VALORACIÓN ≠ ARQUITECTURA FINANCIERA ESPECÍFICA DEL MÉTODO Y DE LA ECONOMÍA VALORADA"
- **evidence_summary**: Formulación explícita, por primera vez, de la distinción entre la capa universal de proceso del Expediente y la arquitectura financiera específica del método/economía.
- **epistemic_class**: IM
- **phenomenon_id**: PROCESS-ARCH
- **effect**: ORIGIN
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Origen de la inferencia metodológica central de toda esta consolidación.
- **limitations**: No se convierte en `industry_type`, `bank_mode`, `financial_institution` enum, ni arquitectura técnica nueva.

### E-06-018
- **case_id**: C06
- **source_document**: `CASO-06-BANCOLOMBIA-V0.md`
- **section**: §23
- **source_locator**: "que Bancolombia financie a sus clientes o a empresas no constituye automáticamente supplier financing de Bancolombia como empresa valorada — es la actividad ordinaria de un banco"
- **evidence_summary**: Primera instancia donde el propio caso concluye irrelevancia/evidencia insuficiente de supplier financing para la empresa valorada, distinguiéndolo de la actividad ordinaria del negocio.
- **epistemic_class**: IA
- **phenomenon_id**: SUPPLIER-FIN
- **effect**: INSUFFICIENT (irrelevancia para este caso específico, no degradación del fenómeno transversal)
- **independence_class**: N/A
- **materiality_note**: N/A.
- **analyst_interpretation**: No se usa este caso para reforzar la evidencia transversal de supplier financing, que sigue apoyada principalmente en Tecnoglass, Terpel y Grupo Éxito.
- **limitations**: Irrelevancia específica de Bancolombia como empresa valorada; no implica que supplier financing sea irrelevante en otras instituciones financieras.

---

## 7. Caso 07 — The Goldman Sachs Group, Inc.

### E-07-001
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §11, §12
- **source_locator**: "fair value bruto activos derivados: US$360.1B... derivados reconocidos finalmente en balance: activos aprox. US$53.0B"
- **evidence_summary**: Secuencia completa posición bruta → counterparty netting → cash-collateral netting → cifra neta reconocida, con diferencia material entre bruto (~US$360–391B) y neto (~US$53–84B) — segunda evidencia fuerte independiente del Candidato A.
- **epistemic_class**: HD
- **phenomenon_id**: CA
- **effect**: REINFORCE (a "evidencia fuerte independiente en Ecopetrol y Goldman Sachs") + TENSION (la formulación "el neteo destruye información" se marca insuficiente)
- **independence_class**: IND
- **materiality_note**: Notional ≈US$43.53T; diferencia bruto-neto de más de US$270B por lado.
- **analyst_interpretation**: Mostrar solo la cifra bruta también puede inducir una interpretación económica falsa (sobreestimación) — la formulación de Ecopetrol necesita refinamiento.
- **limitations**: No se eleva formalmente el candidato en este caso; formulación pendiente de refinar.

### E-07-002
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §17
- **source_locator**: "Level 1 / Level 2 / Level 3 reflejan distintas fuentes/observabilidad de inputs"
- **evidence_summary**: Fair value profundamente integrado en trading, derivatives e investments; Level 3 no equivale a irregularidad.
- **epistemic_class**: DC
- **phenomenon_id**: MEASUREMENT-BASIS
- **effect**: REINFORCE (muy fuerte en measurement basis; sin evidencia equivalente nueva en monetary regime)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Fortalece measurement basis mucho más que monetary regime, ampliando la asimetría entre los dos posibles linajes del Candidato E.
- **limitations**: No se divide el Candidato E en este caso.

### E-07-003
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §13–§15, §22 (R6)
- **source_locator**: "el mismo instrumento puede significar cosas distintas según financing, market making, hedge, liquidez, client facilitation, o investment"
- **evidence_summary**: Repos, securities borrowed/loaned y collateral muestran que el mismo instrumento puede tener funciones económicas distintas según su propósito — evidencia más fuerte hasta ahora de `purpose`.
- **epistemic_class**: DC
- **phenomenon_id**: PURPOSE
- **effect**: ELEVATE (reduce materialmente la brecha de madurez frente a `scope`, sin fusionarse)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Primera evidencia donde `purpose` domina claramente sobre `scope` como el eje explicativo relevante.
- **limitations**: No se crean campos ni enums; no se fusiona con `scope`.

### E-07-004
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §21
- **source_locator**: "compensation and benefits durante 2025... Goldman atribuye parte del incremento de 2025 a mejor operating performance"
- **evidence_summary**: Posible relación endógena revenue/performance ↔ compensation → margin, condicional, discrecional, diferida y variable por negocio — origen de la observación de compensación.
- **epistemic_class**: HD (cifra) + IA (relación)
- **phenomenon_id**: OBS-GS-COMP
- **effect**: ORIGIN (EVI para candidato)
- **independence_class**: IND
- **materiality_note**: Compensation and benefits ≈US$18.9B en 2025.
- **analyst_interpretation**: Pregunta abierta explícita sobre si es simplemente R3, R7, un fenómeno sectorial, o algo nuevo.
- **limitations**: Evidencia insuficiente para crear candidato; no reforzada en Munich Re (Caso 08).

### E-07-005
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §19, §20
- **source_locator**: "CET1 capital: US$104.3B... devolvió aproximadamente US$16.78B a accionistas... US$12.36B en recompras y US$4.42B en dividendos"
- **evidence_summary**: Segunda institución financiera con evidencia del puente capital → capacidad de distribución, mecanismo materialmente distinto al de Bancolombia (holding-banco), pero misma estructura conceptual.
- **epistemic_class**: HD (métricas) + IA (relación)
- **phenomenon_id**: CG
- **effect**: REINFORCE (a "evidencia fuerte independiente en dos instituciones financieras")
- **independence_class**: IND
- **materiality_note**: Recompras (US$12.36B) mayores que dividendos (US$4.42B) en 2025.
- **analyst_interpretation**: Segunda economía financiera materialmente distinta reforzando el puente capital-distribución.
- **limitations**: No se convierte todavía en "Candidato G"; se mantiene como observación abierta hasta Munich Re.

### E-07-006
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §8, §23
- **source_locator**: "Global Banking & Markets (GBM), Asset & Wealth Management (AWM), y Platform Solutions"
- **evidence_summary**: Tres segmentos con drivers, balance y funciones económicas heterogéneas; unidad económica adecuada de análisis puede no coincidir con entidad legal ni segmento contable.
- **epistemic_class**: HD
- **phenomenon_id**: PERIMETER, ANALYSIS-UNIT
- **effect**: REINFORCE (profundiza dentro de instituciones financieras)
- **independence_class**: IND
- **materiality_note**: Net revenues FY2025: total US$58.28B, GBM ≈US$41.45B, AWM ≈US$16.68B, Platform Solutions ≈US$151M.
- **analyst_interpretation**: El problema de perímetro se demuestra ahora también dentro de una segunda economía financiera radicalmente distinta a la banca comercial.
- **limitations**: No obliga a modelar entidad por entidad ni negocio por negocio.

### E-07-007
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §26, §14
- **source_locator**: "derivatives, deferred compensation, RSUs y structured products de Goldman no deben confundirse con el fenómeno específico de derechos económicos/propiedad dinámica"
- **evidence_summary**: Goldman no aporta evidencia comparable al fenómeno específico del Candidato D (opción/obligación capaz de modificar atribución futura).
- **epistemic_class**: EVI
- **phenomenon_id**: CD
- **effect**: INSUFFICIENT (mantiene sin elevar)
- **independence_class**: N/A
- **materiality_note**: N/A.
- **analyst_interpretation**: Tercer caso consecutivo (ISA, Bancolombia, Goldman) sin evidencia nueva para el Candidato D.
- **limitations**: El caso descarta explícitamente confundir mecanismos similares con el fenómeno específico.

### E-07-008
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §32 (D)
- **source_locator**: "SOTP en Goldman debe lidiar con interdependencias económicas reales entre negocios, no solo con separar segmentos contables"
- **evidence_summary**: SOTP es candidato fuerte y más relevante que en Bancolombia, pero puede destruir interdependencias económicas reales entre negocios.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-SOTP
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Refuerza el guardrail de que segmentos contables no son automáticamente unidades obligatorias de valoración.
- **limitations**: No se hace obligatorio; no se aprueba como método.

### E-07-009
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §29
- **source_locator**: "la reinversión puede involucrar capital regulatorio, capacidad de balance, tecnología, talento, advisors, capacidades, fundraising, plataformas, y adquisiciones"
- **evidence_summary**: Goldman amplía las vías de reinversión económica observadas en Bancolombia (retención de capital) hacia un conjunto más amplio y menos formulaico.
- **epistemic_class**: IA
- **phenomenon_id**: REINVESTMENT, CAPEX
- **effect**: EXPANSION
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: "Esto refina una posible extrapolación excesiva del Caso 06" — Goldman evita que la separación CAPEX/reinversión se reduzca a una fórmula bancaria simplista de capital retenido.
- **limitations**: No se crea fórmula automática que combine CAPEX contable y vías de reinversión ampliadas.

### E-07-010
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §10
- **source_locator**: "FICC Financing + Equities Financing generaron aproximadamente US$11.4B durante 2025... en Goldman, financiación no equivale automáticamente a actividad externa a la operación"
- **evidence_summary**: Financing es una fuente material y relativamente durable de ingresos, sin que esto implique que todo pasivo financiero de Goldman sea operativo (ni lo contrario).
- **epistemic_class**: HD (cifra) + IA (conclusión)
- **phenomenon_id**: DEBT
- **effect**: REINFORCE (segunda institución financiera con evidencia de que la clasificación de deuda requiere interpretación económica caso por caso)
- **independence_class**: IND
- **materiality_note**: FICC Financing + Equities Financing ≈US$11.4B en 2025.
- **analyst_interpretation**: "No concluir que todo pasivo financiero de Goldman es operativo. Tampoco concluir lo contrario."
- **limitations**: Clasificación caso por caso, sin regla general resuelta.

### E-07-011
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §31
- **source_locator**: "net debt convencional no parece medida económicamente adecuada como default para Goldman consolidado. Puede reaparecer en un scope específico si la economía lo justifica"
- **evidence_summary**: Segunda institución financiera (tras Bancolombia) donde net debt convencional se refuta como default consolidado, sin eliminarse como concepto.
- **epistemic_class**: IA
- **phenomenon_id**: NET-DEBT
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Construida a partir de §10 (financing puede ser operación) y §13–§14 (repos/collateral) — refuerza R6 (scope importa para saber si net debt aplica).
- **limitations**: No se elimina net debt de Velarix; puede seguir siendo apropiado en scopes específicos.

### E-07-012
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §32 F
- **source_locator**: "Enterprise Value: NO ADECUADO COMO ARQUITECTURA UNIVERSAL DEL GRUPO. POTENCIALMENTE ÚTIL EN DETERMINADOS SCOPES. PREGUNTA ABIERTA"
- **evidence_summary**: Segunda institución financiera donde Enterprise Value se evalúa explícitamente como no adecuado a nivel de grupo consolidado, sin descartarse en scopes específicos.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-EV
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: A diferencia de Bancolombia (evaluación conjunta EV+FCFF en §25 A), Goldman separa la evaluación de EV (F) de FCFF (E) en subsecciones distintas.
- **limitations**: Pregunta abierta explícita sobre qué scopes mantienen la utilidad de EV.

### E-07-013
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §32 E
- **source_locator**: "FCFF / WACC convencional: NO ADECUADO COMO DEFAULT DEL GRUPO CONSOLIDADO. Esto no significa que FCFF esté prohibido"
- **evidence_summary**: Segunda institución financiera reforzando que FCFF/WACC convencional no es default adecuado a nivel consolidado.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-FCFF
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Consistente con la refutación de universalidad ya iniciada en Bancolombia (E-06-010).
- **limitations**: No se elimina FCFF ni WACC.

### E-07-014
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §32 A
- **source_locator**: "Residual Income / Excess Return: CANDIDATO METODOLÓGICO MUY FUERTE. Goldman reporta y gestiona métricas como ROE, book value, y returns through-the-cycle"
- **evidence_summary**: Segunda institución financiera confirmando Residual Income como candidato muy fuerte, por razones económicas distintas a Bancolombia (ROE/book value de una firma de mercados, no NIM).
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-RI
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: "Residual Income es candidato fuerte en Goldman por razones distintas... de las que lo hicieron candidato fuerte en Bancolombia" (§35, punto 8) — refuerzo con mecanismo económico distinto, no repetición del mismo mecanismo.
- **limitations**: No aprobado; riesgos de base de capital, buybacks, fair value, intangibles.

### E-07-015
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §32 B
- **source_locator**: "FCFE adaptado a capital: CANDIDATO FUERTE. Pero no debe usarse una fórmula bancaria simplista"
- **evidence_summary**: Segunda institución financiera confirmando FCFE adaptado a capital como candidato fuerte, con reinversión dependiente de credit risk, market risk, operational risk, RWA, leverage, stress requirements.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-FCFE
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Amplía la noción de reinversión bancaria más allá de la fórmula simple de Bancolombia.
- **limitations**: No se aprueba ningún motor ni fórmula.

### E-07-016
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §32 G
- **source_locator**: "Goldman refuerza la tensión: WACC no debe asumirse como input obligatorio de toda valoración. Si se valora equity directamente, Cost of Equity puede ser relevante"
- **evidence_summary**: Segunda institución financiera reforzando la tensión WACC/Cost of Equity, sin aprobar ninguno ni cambiar la Decisión 1 del Bloque 1B.
- **epistemic_class**: IM
- **phenomenon_id**: DISCOUNT-RATE
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Consistente con el origen de la tensión en Bancolombia (E-06-014).
- **limitations**: No se aprueba Cost of Equity ni un WACC nuevo.

### E-07-017
- **case_id**: C07
- **source_document**: `REPORTE-CONTRASTE-EXPEDIENTE-V1.md` (Caso 07)
- **section**: §9, punto 11
- **source_locator**: "Selección de método: NO DEBE RESOLVERSE TODAVÍA — §30 (Caso 06) ya registra la necesidad conceptual de documentar método considerado/aprobado sin crear `valuation_method`; Goldman no exige ir más allá"
- **evidence_summary**: El propio reporte de contraste del Caso 07 evalúa explícitamente que la necesidad de gobierno/trazabilidad de método (originada en Bancolombia) sigue vigente sin requerir diseño adicional a partir de Goldman.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-SELECTION
- **effect**: REINFORCE (continuidad metodológica, no expansión del diseño)
- **independence_class**: PART
- **materiality_note**: N/A.
- **analyst_interpretation**: Goldman confirma la necesidad sin aportar un mecanismo nuevo que profundice el diseño más allá de lo ya registrado por Bancolombia.
- **limitations**: Evidencia de continuidad, no de expansión — no debe leerse como refuerzo fuerte independiente adicional al de origen.

### E-07-018
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §33
- **source_locator**: "estado estable ≠ resultados idénticos cada año. Para una firma expuesta a mercados puede importar normalized through-cycle profitability, business mix sostenible, capital intensity sostenible, crecimiento sostenible, ROE sostenible, Cost of Equity, y persistencia/convergencia de excess returns"
- **evidence_summary**: Tercer significado sectorial de "estado estable" (tras el industrial y el bancario tradicional): normalized through-cycle profitability de una firma de mercados.
- **epistemic_class**: IM
- **phenomenon_id**: HORIZON, STEADY-STATE
- **effect**: DEEPEN
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: La Decisión 4 (horizonte fijo de 5 años) no cambia; se profundiza únicamente el significado de estado estable.
- **limitations**: No se aprueba horizonte nuevo ni g.

### E-07-019
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §36
- **source_locator**: "la arquitectura financiera específica puede variar incluso entre actividades materialmente distintas que coexisten dentro de una misma organización"
- **evidence_summary**: Refuerzo de PROCESS-ARCH con un mecanismo nuevo respecto de Bancolombia: la heterogeneidad puede existir incluso intra-organizacionalmente (GBM vs. AWM vs. Platform Solutions), no solo entre organizaciones distintas.
- **epistemic_class**: IM
- **phenomenon_id**: PROCESS-ARCH
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Sin cambio de nivel formal respecto al Caso 06; aporta un mecanismo adicional (heterogeneidad intra-organizacional).
- **limitations**: No se eleva a R9; no se crea `industry_type`, `bank_mode` ni `financial_institution` enum.

### E-07-020
- **case_id**: C07
- **source_document**: `CASO-07-GOLDMAN-SACHS-V0.md`
- **section**: §22 (R3)
- **source_locator**: "Goldman introduce relaciones entre actividad, revenues, balance, financing, funding, risk, capital, liquidez y compensación — muchas pueden ser circulares, regulatorias, condicionales, no lineales, o mediadas por decisiones humanas"
- **evidence_summary**: Segunda institución financiera (tras Bancolombia) aportando evidencia de que las relaciones entre supuestos pueden ser circulares y mediadas por decisiones humanas, no solo cadenas o bidireccionalidad simple.
- **epistemic_class**: IA
- **phenomenon_id**: R3
- **effect**: DEEPEN (el diseño de `assumption_relations` queda "aún más insuficientemente validado, no menos")
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Refuerza la cautela explícita de no convertir `assumption_relations` en un grafo causal ingenuo A→B.
- **limitations**: No se rediseña la entidad; ejemplos cualitativos, no exhaustivos.

---

## 8. Caso 08 — Munich Re

### E-08-001
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §11
- **source_locator**: "posición/exposición bruta → compensación jurídicamente válida → collateral → reinsurance/retrocession → otros mitigantes → exposición económica relevante"
- **evidence_summary**: Tercera economía (Ecopetrol, Goldman Sachs, Munich Re) con evidencia fuerte del Candidato A; "neteo" se muestra como nombre demasiado estrecho, porque reinsurance/retrocession es un mecanismo económico distinto del netting jurídico o del collateral.
- **epistemic_class**: HD (mecanismos existentes) + IA (conclusión sobre el nombre)
- **phenomenon_id**: CA
- **effect**: REINFORCE + REFORMULATION_PRESSURE
- **independence_class**: IND
- **materiality_note**: Sin cifras específicas de retrocession en este caso.
- **analyst_interpretation**: Tercera economía radicalmente distinta reforzando el candidato y presionando su reformulación conceptual (no su nombre final, que queda pendiente).
- **limitations**: No se eleva formalmente ni se renombra en este documento; formulación exacta pendiente de la consolidación.

### E-08-002
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §12
- **source_locator**: "vida contractual ≠ coverage period ≠ vida del riesgo ≠ accident year ≠ claim development ≠ settlement ≠ vida del reconocimiento económico"
- **evidence_summary**: Sexta economía con ciclo de vida propio (seguro/reaseguro), sin equivalente exacto en los siete casos previos.
- **epistemic_class**: DC
- **phenomenon_id**: CB
- **effect**: REINFORCE (a "seis casos de naturaleza económica muy distinta")
- **independence_class**: IND
- **materiality_note**: Sin cifras específicas.
- **analyst_interpretation**: Nivel de evidencia más alto alcanzado por el Candidato B en la primera batería.
- **limitations**: Formulación general aún abierta pese a seis casos.

### E-08-003
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §13
- **source_locator**: "contrato; inicio de cobertura; ocurrencia; reporte; conocimiento posterior; reconocimiento; actualización de reservas; settlement; recoveries; valuation date"
- **evidence_summary**: Una de las instancias más fuertes hasta ahora de atribución temporal / corte de conocimiento, con hasta diez momentos económicos distinguibles.
- **epistemic_class**: DC
- **phenomenon_id**: CC
- **effect**: ELEVATE (a "problema metodológico muy fuertemente respaldado")
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: El nivel de granularidad temporal más alto observado en la primera batería.
- **limitations**: No se crea `economic_period`.

### E-08-004
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §10, §15
- **source_locator**: "IFRS y Solvency II pueden producir valores distintos para el mismo Grupo sin cambiar moneda... FX puede modificar valores sin cambiar la base de medición"
- **evidence_summary**: Evidencia clara y directa de que measurement basis y monetary regime son separables — un régimen dual de reporte (IFRS/Solvency II) cambia valores sin cambiar moneda, y el FX cambia valores sin cambiar la base de medición.
- **epistemic_class**: HD (existencia del régimen dual) + IA (separabilidad)
- **phenomenon_id**: MEASUREMENT-BASIS, MONETARY-REGIME
- **effect**: REINFORCE (hipótesis de separación "muy fuertemente respaldada")
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: La evidencia más directa de la serie de que measurement basis y monetary regime son fenómenos metodológicamente distintos, aunque relacionados.
- **limitations**: No se divide formalmente el Candidato E en este documento; queda como pregunta explícita para la consolidación.

### E-08-005
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §10, §16
- **source_locator**: "inversiones sujetas en determinados casos a restraints on disposal... tras los ajustes correspondientes, declaró que no existían restricciones significativas de fungibilidad/transferibilidad para cubrir el Group SCR"
- **evidence_summary**: Cuarta economía radicalmente distinta (ISA, Bancolombia, Goldman Sachs, Munich Re) con evidencia de disponibilidad económica de recursos — elevación formal a Candidato F.
- **epistemic_class**: HD
- **phenomenon_id**: CF
- **effect**: ELEVATE (formal, de observación ISA-F a Candidato F)
- **independence_class**: IND
- **materiality_note**: Sin cifras de restricciones específicas en el material de trabajo.
- **analyst_interpretation**: La elevación es únicamente metodológica/documental — no se implementa `availability`, `restricted_asset` ni `fungibility`.
- **limitations**: La existencia de restricciones puntuales no implica indisponibilidad total, y viceversa; ninguno de los dos extremos se afirma.

### E-08-006
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §17
- **source_locator**: "Munich Re opera bajo Solvency II, con eligible own funds, SCR, y un régimen de capital prudencial propio del sector seguros/reaseguros"
- **evidence_summary**: Tercera institución financiera prudencialmente regulada (banca comercial, banca de inversión, seguros/reaseguros) con evidencia del puente capital-distribución — elevación formal a Candidato G.
- **epistemic_class**: HD
- **phenomenon_id**: CG
- **effect**: ELEVATE (formal, de observación Bancolombia-G a Candidato G)
- **independence_class**: IND
- **materiality_note**: Sin cifras específicas de SCR o eligible own funds en el material de trabajo.
- **analyst_interpretation**: Estructura de fondo idéntica (capital regulatorio y buffers condicionan distribución) con mecanismo materialmente distinto al bancario.
- **limitations**: Elevación conceptual únicamente; no se implementa `capital_bridge`, `distributable_capital` ni `regulatory_capital`.

### E-08-007
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §19
- **source_locator**: "riesgo o exposición bruta ≠ riesgo retenido ≠ exposición después de mitigantes ≠ capital requerido por esa exposición"
- **evidence_summary**: Distinción entre exposición bruta, retenida, post-mitigantes y capital requerido — origen de la observación Munich, sin candidato propio.
- **epistemic_class**: DC
- **phenomenon_id**: OBS-MUNICH-EXPOSURE
- **effect**: ORIGIN (EVI para candidato propio)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Puede terminar siendo parte del Candidato A, de R3, o del Candidato G — sin resolver.
- **limitations**: Evidencia insuficiente para nuevo candidato; no se crea "Candidato H".

### E-08-008
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §6, §21
- **source_locator**: "field of business ≠ reportable segment ≠ entidad legal ≠ necesariamente unidad económica adecuada de valoración"
- **evidence_summary**: Global Specialty Insurance es primary insurance administrado dentro de Reinsurance; IFRS vs. Solvency II como dos representaciones válidas y distintas del mismo Grupo.
- **epistemic_class**: HD
- **phenomenon_id**: PERIMETER, ANALYSIS-UNIT
- **effect**: ELEVATE (a "problema muy fuertemente demostrado")
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Evidencia directa de que un mismo grupo puede requerir perímetros y métodos de representación diferentes según el propósito — el nivel de evidencia más alto de perímetro en la primera batería.
- **limitations**: No obliga a modelar todas las entidades; segmento reportable ≠ unidad obligatoria de valoración.

### E-08-009
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §27 (D, E, G, H)
- **source_locator**: "Residual Income / Excess Return: CANDIDATO MUY FUERTE"; "FCFE adaptado a capital: CANDIDATO FUERTE"; "Potential Distributions: CANDIDATO MUY FUERTE"; "SOTP: CANDIDATO MUY FUERTE"
- **evidence_summary**: Cuatro métodos de valoración (Residual Income, FCFE adaptado, Potential Distributions, SOTP) confirmados como candidatos fuertes o muy fuertes en la tercera institución financiera prudencial, ninguno aprobado.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-RI, METHOD-FCFE, METHOD-POTDIST, METHOD-SOTP
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Consistencia de estos cuatro métodos como candidatos a través de las tres instituciones financieras prudenciales (Bancolombia, Goldman Sachs, Munich Re), cada una con razones económicas distintas.
- **limitations**: Ninguno aprobado; problemas de base de capital, equity reinvestment y riesgo de doble conteo en SOTP quedan abiertos.

### E-08-010
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §20
- **source_locator**: "Estado transversal: `PATRÓN OBSERVADO EN OCHO CASOS`"
- **evidence_summary**: R1, R2, R4 (base), R7 y R8 reaparecen de forma transversal e idéntica en los ocho casos.
- **epistemic_class**: IM
- **phenomenon_id**: R1, R2, R4, R7, R8
- **effect**: REINFORCE (nivel de evidencia más alto de la primera batería)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Cierre de la primera batería con el nivel de evidencia acumulada más alto para estas cinco reglas — explícitamente no una ley universal.
- **limitations**: "PATRÓN OBSERVADO EN OCHO CASOS" nunca se reformula como "CONFIRMADO POR OCHO CASOS" en ningún documento congelado.

### E-08-011
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §18
- **source_locator**: "la síntesis recibida para este caso no aportó evidencia comparable sobre compensación como variable económica endógena en Munich Re"
- **evidence_summary**: La observación de compensación de Goldman (Caso 07) no recibe refuerzo en Munich Re.
- **epistemic_class**: EVI
- **phenomenon_id**: OBS-GS-COMP
- **effect**: INSUFFICIENT (sin refuerzo)
- **independence_class**: N/A
- **materiality_note**: N/A.
- **analyst_interpretation**: La observación permanece abierta como pregunta (¿R3? ¿R7? ¿particularidad sectorial de Goldman?), sin resolver.
- **limitations**: Un solo caso de origen; sin segunda instancia hasta el cierre de la primera batería.

### E-08-012
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §26
- **source_locator**: "financial liability ≠ automáticamente deuda económica externa a la operación; insurance liabilities ≠ strategic/corporate debt... Munich Re sí tiene strategic debt real"
- **evidence_summary**: Tercera institución financiera prudencial reforzando que ni todo pasivo financiero es deuda económica externa, ni toda aseguradora carece de deuda económica relevante; net debt convencional no debe ser métrica universal obligatoria pero tampoco se afirma "aseguradora = sin deuda económica relevante".
- **epistemic_class**: IA (relación) + HD (existencia de strategic debt)
- **phenomenon_id**: DEBT, NET-DEBT
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: Sin cifra específica de strategic debt en el material de trabajo.
- **analyst_interpretation**: Una sola subsección del caso cubre deuda y net debt conjuntamente, a diferencia de Goldman Sachs donde se documentan por separado (§10 y §31).
- **limitations**: No se crea fórmula automática de clasificación de deuda.

### E-08-013
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §8
- **source_locator**: "cash ≠ liquidity ≠ distributable resources... IFRS equity ≠ Solvency II eligible own funds ≠ SCR ≠ distributable excess"
- **evidence_summary**: Tercera institución financiera prudencial con un régimen dual de reporte (IFRS/Solvency II) que produce hasta cuatro magnitudes distintas de "recurso disponible" para el mismo Grupo.
- **epistemic_class**: DC
- **phenomenon_id**: CASH-LIQUIDITY
- **effect**: REINFORCE (mecanismo distinto al de Bancolombia: régimen dual de reporte, no solo liquidez prudencial)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Extiende las cuatro nociones bancarias de cash/liquidez (E-06-005) a un régimen dual de reporte específico de seguros/reaseguros.
- **limitations**: No se crean campos `excess_cash` ni `distributable_cash`.

### E-08-014
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §27 A
- **source_locator**: "Enterprise Value consolidado: NO ADECUADO COMO ARQUITECTURA UNIVERSAL DEL GRUPO. Puede existir utilidad en determinados scopes"
- **evidence_summary**: Tercera institución financiera confirmando que Enterprise Value no es arquitectura universal obligatoria a nivel consolidado.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-EV
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Tercera confirmación independiente (Bancolombia, Goldman Sachs, Munich Re) de la misma conclusión con mecanismos económicos distintos en cada caso.
- **limitations**: Pregunta abierta sobre scopes específicos donde EV mantiene utilidad.

### E-08-015
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §27 C
- **source_locator**: "FCFF / WACC consolidado: NO ADECUADO COMO DEFAULT. Pero: DCF ≠ FCFF industrial — Munich Re aporta evidencia de que discounted cash-flow approaches pueden ser económicamente útiles en determinados scopes. No se afirma 'DCF no sirve para aseguradoras'"
- **evidence_summary**: Tercera institución financiera reforzando que FCFF/WACC consolidado no es default adecuado, con la distinción explícita más clara de la serie entre FCFF industrial y el enfoque DCF en general.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-FCFF, METHOD-DCF-SCOPE
- **effect**: REINFORCE + REFORMULATION (separación explícita DCF ≠ FCFF industrial)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Es la formulación más clara de la serie de por qué la evidencia negativa contra FCFF no debe leerse como evidencia negativa contra DCF en general — ver GAP-10 en `03-GENEALOGIAS-Y-GAPS-V1.md`.
- **limitations**: No se elimina FCFF ni WACC; no se implica que cada scope necesite un DCF.

### E-08-016
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §27 D
- **source_locator**: "Residual Income / Excess Return: CANDIDATO MUY FUERTE. Problema abierto: ¿qué base de capital es económicamente adecuada?"
- **evidence_summary**: Tercera institución financiera confirmando Residual Income como candidato muy fuerte, con problema abierto propio (IFRS equity, adjusted equity, eligible own funds, SCR, CSM).
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-RI
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Tercera economía financiera prudencial distinta confirmando el mismo candidato con problema de base de capital propio.
- **limitations**: No se asume que IFRS book equity resuelve el problema.

### E-08-017
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §27 E
- **source_locator**: "FCFE adaptado a capital: CANDIDATO FUERTE. Problema abierto: definir equity reinvestment — equity reinvestment ≠ retained earnings ≠ cambio en IFRS equity ≠ cambio en eligible own funds ≠ cambio en SCR"
- **evidence_summary**: Tercera institución financiera confirmando FCFE adaptado a capital, con la definición de "equity reinvestment" como problema abierto propio y más granular que en Bancolombia/Goldman.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-FCFE
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Refuerza REINVESTMENT como concepto separado de CAPEX, con una quinta magnitud posible (cambio en SCR) no vista en los casos anteriores.
- **limitations**: No se aprueba fórmula.

### E-08-018
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §27 F
- **source_locator**: "DDM literal (solo dividendos): DEMASIADO ESTRECHO"
- **evidence_summary**: Tercera y más explícita instancia de que DDM literal (basado mecánicamente en dividendos/payout histórico) es una abstracción insuficiente, distinta de DDM como método potencial.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-DDM
- **effect**: DEGRADED (de la lectura literal, no del método como candidato)
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Formulación más explícita de la serie sobre por qué DDM literal se descarta como abstracción, mientras Potential Distributions (E-07-005, E-08-009) permanece como el candidato vigente.
- **limitations**: No descarta DDM como concepto — descarta únicamente su lectura literal basada en payout histórico.

### E-08-019
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §27 I, J
- **source_locator**: "Cost of Equity: CONCEPTUALMENTE NATURAL PARA MÉTODOS DIRECTOS DE EQUITY. No aprobado... WACC: NO UNIVERSAL. No se elimina para todo scope"
- **evidence_summary**: Tercera institución financiera reforzando la tensión WACC/Cost of Equity, con la formulación más explícita de la serie sobre qué no se aprueba (beta, ERP, country risk, tasa).
- **epistemic_class**: IM
- **phenomenon_id**: DISCOUNT-RATE
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Cierre de la primera batería sin resolver la tensión, consistente con Bancolombia (E-06-014) y Goldman Sachs (E-07-016).
- **limitations**: Explícitamente "no beta aprobada, no ERP aprobado, no country risk aprobado, no tasa aprobada".

### E-08-020
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §30
- **source_locator**: "la futura consolidación transversal... deberá revisar explícitamente: ... 21. Cost of Equity. 22. Residual Income. 23. FCFE. 24. Potential Distributions. 25. SOTP... 29. Arquitectura universal del proceso vs. arquitectura financiera específica"
- **evidence_summary**: Lista de veintinueve puntos que Munich Re explícitamente envía a la consolidación transversal, incluyendo la selección de método de valoración para instituciones financieras prudencialmente reguladas.
- **epistemic_class**: IM
- **phenomenon_id**: METHOD-SELECTION
- **effect**: REINFORCE (continuidad metodológica, consistente con la nota de E-07-017)
- **independence_class**: PART
- **materiality_note**: N/A.
- **analyst_interpretation**: Munich Re no resuelve la necesidad de gobierno de método — la registra explícitamente como agenda para la consolidación, que es precisamente lo que este documento y `04-BACKLOG-Y-PUENTE-1B-1C-V1.md` ejecutan como Frente 7.
- **limitations**: "Esta consolidación NO se realiza en esta ejecución" (Caso 08, §30) — la consolidación referida es la ejecutada en esta carpeta, posterior al cierre del Caso 08.

### E-08-021
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §28
- **source_locator**: "para insurance/reinsurance, estado estable debe interpretarse through-the-cycle — no significa cero catástrofes, cero reserve development, investment returns idénticos, ni combined ratio idéntico"
- **evidence_summary**: Cuarto significado sectorial de "estado estable" (industrial, bancario, banca de inversión, seguros/reaseguros): through-the-cycle sin catástrofes/reserve development/retornos idénticos.
- **epistemic_class**: IM
- **phenomenon_id**: HORIZON, STEADY-STATE
- **effect**: DEEPEN
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Cierre de la primera batería con cuatro significados sectoriales distintos de "estado estable" documentados, sin cambiar la Decisión 4.
- **limitations**: No se aprueba nueva g; no se cambia la Decisión 4.

### E-08-022
- **case_id**: C08
- **source_document**: `CASO-08-MUNICH-RE-V0.md`
- **section**: §7
- **source_locator**: "arquitectura universal del proceso de valoración ≠ arquitectura financiera universal del método... la unidad económicamente adecuada de análisis puede no coincidir con entidad legal, segmento contable, ni máxima granularidad disponible"
- **evidence_summary**: Cierre de la primera batería reforzando PROCESS-ARCH con la tercera institución financiera prudencial, consistente con el hallazgo central del Caso 07.
- **epistemic_class**: IM
- **phenomenon_id**: PROCESS-ARCH
- **effect**: REINFORCE
- **independence_class**: IND
- **materiality_note**: N/A.
- **analyst_interpretation**: Explícitamente "no se eleva a R9" en el propio Caso 08.
- **limitations**: No se crea arquitectura técnica nueva.

---

## 9. Nota de cobertura

Este registro no pretende ser exhaustivo párrafo por párrafo de los 16
documentos congelados. Cubre la evidencia material identificada por los
propios documentos como origen, refuerzo, reformulación, tensión,
elevación o evidencia insuficiente de cada fenómeno registrado en
`01-REGISTRO-FENOMENOS-Y-MATRIZ-V1.md`. Evidencia adicional de detalle
menor (ejemplos ilustrativos, preguntas a gerencia individuales) queda
disponible directamente en los documentos congelados de cada caso y no
se duplica aquí.
