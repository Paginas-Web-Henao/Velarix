# Caso Público 06 — Grupo Cibest / Bancolombia S.A. — V0

**Fecha:** 2026-08-12
**Estado:** análisis manual, versión V0. No es una valoración. No autoriza
implementación de ningún cambio al Expediente. El reporte de contraste
(`REPORTE-CONTRASTE-EXPEDIENTE-V1.md`, esta misma carpeta) tampoco
constituye autorización de implementación; cualquier implementación
requiere autorización explícita y separada del fundador. **Este
documento NO declara el Caso 06 formalmente cerrado ni congelado.** El
Caso 06 queda en estado `ANÁLISIS DOCUMENTADO — PENDIENTE DE REVISIÓN Y
CIERRE FORMAL POR EL FUNDADOR`. El cierre y congelamiento serán una
ejecución posterior si Nicolás lo autoriza después de revisar este
resultado.

**CASO 06 NO AUTORIZA IMPLEMENTACIÓN.** Ningún hallazgo, hipótesis,
candidato u observación de este documento constituye autorización para
crear tablas, migraciones, schemas, UI, motores, Edge Functions,
automatizaciones ni ningún otro cambio técnico. Solo Nicolás/fundador
puede autorizar implementación, de forma explícita y separada.

---

## 1. Identificación del caso

- **Caso:** Caso Público 06 — Grupo Cibest / Bancolombia S.A.
- **Posición en la secuencia:** sexto caso de estudio manual, después de
  Caso 01 (Tecnoglass, cerrado y congelado), Caso 02 (Organización
  Terpel, cerrado), Caso 03 (Ecopetrol, cerrado y congelado), Caso 04
  (Grupo Éxito, formalmente cerrado y congelado) y Caso 05 (ISA,
  formalmente cerrado y congelado).
- **Insumos documentales de continuidad revisados para el contraste de
  este caso:**
  `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`,
  `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`,
  `docs/velarix/plan/REGISTRO-DE-DECISIONES.md`,
  `docs/velarix/casos/05-isa/CASO-05-ISA-V0.md`,
  `docs/velarix/casos/05-isa/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`, y los
  documentos equivalentes de los Casos 01–04, revisados exclusivamente
  para replicar estructura y convenciones, no para reauditar su
  contenido.
- **No se reanaliza ni se recalcula ningún elemento de los Casos 01–05**
  — se citan únicamente para contraste. Sus conclusiones no se
  reinterpretan retrospectivamente a partir de Bancolombia.
- **Casos 07 (Goldman Sachs) y 08 (Munich Re) están autorizados pero NO
  se inician en esta ejecución.** No se usan para completar vacíos de
  evidencia de este caso.

## 2. Objetivo del caso (adversarial)

El Caso 06 estudia a Bancolombia como **sexta economía**, deliberadamente
elegida por ser una institución financiera regulada — la primera de esta
naturaleza en la secuencia de casos — precisamente para **intentar
romper** lo aprendido en Tecnoglass, Terpel, Ecopetrol, Grupo Éxito e
ISA. **No busca confirmar Velarix.**

Un caso puede reforzar, debilitar, refutar, resultar no material,
producir evidencia insuficiente, o revelar problemas nuevos — este
documento registra los cinco resultados posibles con la misma
disciplina.

Principio epistemológico vigente, ahora extendido a seis casos: **seis
casos muestran patrones más resistentes; seis casos no crean leyes
universales.** Donde una conclusión reaparece de forma transversal e
idéntica en los seis casos, se documenta prudentemente como `PATRÓN
OBSERVADO EN SEIS CASOS` — **nunca** como `CONFIRMADO POR SEIS CASOS`, y
nunca como ley universal.

## 3. Límites del ejercicio

- No se calcula Enterprise Value, Equity Value, precio por acción,
  valoración implícita, WACC, Cost of Equity, g, FCFF, FCFE, valoración
  por Residual Income, valoración por DDM, ni valoración por SOTP.
- No se elige un método de valoración final para Bancolombia.
- No se completa ningún dato faltante con un valor por defecto, ni con
  una cifra tomada de los casos anteriores, de un comparable, o de
  cualquier fuente externa no entregada para este caso.
- No se trata ningún hallazgo de este caso como regla universal aplicable
  a cualquier empresa, banco o sector.
- No equivale a due diligence, auditoría, ni opinión profesional de
  valor.
- No se acusa a Bancolombia, a Grupo Cibest, a su administración ni a
  ningún tercero de ninguna irregularidad fiscal, contable o
  regulatoria — donde el material de trabajo describe un mecanismo (ej.
  la reorganización societaria de 2025, el acuerdo sobre Banistmo), este
  documento lo registra como fenómeno a entender, no como juicio de
  valor.
- Bancolombia/Grupo Cibest es una institución listada, regulada, con
  obligaciones de reporte superiores a las de una PYME colombiana
  típica — este caso no asume que una PYME real tendrá información de
  esta granularidad.
- Éxito de este caso **no** significa que los mecanismos o supuestos de
  Bancolombia apliquen a cualquier otro banco, ni que lo aprendido
  aplique automáticamente a Goldman Sachs o a Munich Re — ambos deben
  todavía intentar romperlo (ver §37).
- No se fuerza ningún hallazgo si la evidencia proporcionada no lo
  sostiene — donde el material de trabajo no permite concluir algo,
  este documento lo deja como `EVIDENCIA INSUFICIENTE` o `PREGUNTA
  ABIERTA`.

## 4. Período analizado

**Período financiero base: FY2025, con cierre al 31 de diciembre de
2025.** Este es el período sobre el que versan los hallazgos
documentados en §9–§19, salvo donde se indique explícitamente lo
contrario.

**Información posterior al corte (1T26 y 2T26) se documenta por
separado en §19, claramente etiquetada como `INFORMACIÓN POSTERIOR AL
CORTE`.** El eventual cierre de la venta de Banistmo puede usarse para
explicar el desarrollo posterior del evento, pero permanece
identificado como información posterior al corte cuando corresponda —
no se usa para reescribir silenciosamente las condiciones existentes al
31-dic-2025.

## 5. Procedencia y naturaleza de la evidencia

**Fuente de trabajo:** síntesis analítica proporcionada a esta ejecución
documental, elaborada previamente — fuera de esta ejecución — a partir
de información pública primaria de Grupo Cibest/Bancolombia,
principalmente: documentación oficial de Investor Relations, filings
ante la SEC, estados financieros consolidados FY2025, resultados 4T25,
documentos oficiales de la reorganización societaria de Grupo Cibest, y
regulación financiera oficial (incluyendo referencias al Banco de la
República cuando corresponda).

**Esta ejecución documental no realizó verificación independiente
adicional de las fuentes originales** — no se hizo scraping, descarga
automatizada, ni navegación por internet. Esta ejecución solo
inspeccionó documentos ya existentes en el repositorio (Casos 01–05,
Decisiones financieras del Bloque 1B, Registro de decisiones) para
preservar estructura, vocabulario y consistencia documental.

**No se atribuye a Nicolás/fundador la recopilación personal de esta
información.** El flujo real fue: (1) existe una síntesis analítica de
información pública primaria de Grupo Cibest/Bancolombia, elaborada
previamente a esta ejecución; (2) esa síntesis fue entregada a esta
ejecución mediante instrucciones; (3) esta ejecución documental no
verificó de forma independiente las fuentes originales de esa síntesis.

**Referencias metodológicas secundarias**: donde la síntesis recibida
incorpora metodología externa de valoración bancaria (ej. Aswath
Damodaran sobre valoración de firmas financieras; literatura del BIS
sobre valoración bancaria y price-to-book), este documento las distingue
explícitamente como `REFERENCIA METODOLÓGICA SECUNDARIA` — **no** como
evidencia primaria de hechos de Bancolombia.

Este caso, como Terpel e ISA, es principalmente **conceptual**: el
material de trabajo describió la economía bancaria en términos de
mecanismos y relaciones, sin una batería extensa de cifras específicas.
Este documento no completa esa ausencia con cifras estimadas, inferidas
ni de referencia externa — donde falta una cifra, queda `DESCONOCIDO` o
`EVIDENCIA INSUFICIENTE` de forma explícita. Ninguna cifra que sí se
cite carece de período y scope claros.

## 6. Objeto económico del caso: Grupo Cibest ≠ Bancolombia S.A.

`HECHO DOCUMENTADO` (según la síntesis recibida, sin verificación
independiente adicional, sin cifras): en mayo de 2025 se completó una
reorganización corporativa mediante la cual Bancolombia S.A. pasó a ser
subsidiaria de una nueva entidad holding, Grupo Cibest.

**El Caso 06 estudia Grupo Cibest desde la perspectiva del accionista
final, manteniendo Bancolombia S.A. como `scope` material
indispensable** para comprender la economía bancaria, la regulación, el
capital, la generación de resultados, la capacidad de distribución, y la
relación banco → holding → accionista.

**Esto no debe interpretarse como dos valoraciones.** Este caso no
realiza ninguna valoración de ninguna de las dos entidades.

**Regla explícita de este caso**: la reorganización de 2025 hace
material distinguir:

```
Grupo Cibest
  ≠
Bancolombia S.A.
  ≠
necesariamente la unidad regulatoria relevante
  ≠
automáticamente el flujo disponible al accionista final
```

Este es el ejemplo más directo, hasta ahora, de por qué `scope` (§20, R6)
es una necesidad conceptual fuertemente respaldada: el mismo nombre
coloquial ("Bancolombia") puede referirse, según el propósito del
análisis, al holding cotizado, al banco operativo regulado, o al grupo
consolidado — y cada uno tiene una economía, una regulación y una
capacidad de distribución potencialmente distintas.

## 7. Descripción económica resumida (mapa conceptual)

Mapa económico conceptual (específico de Grupo Cibest/Bancolombia, no
plantilla universal — ver §20, R7):

```
Depósitos de clientes (fondeo dominante) ──► motor de fondeo del banco
        │
        ▼
Cartera de crédito (originación, riesgo, provisiones/ECL) ──► ingresos
por intereses
        │
        ├──► NIM (margen neto de interés) — motor económico central
        ├──► Costo de depósitos / mix de fondeo
        ├──► Calidad de activos / stages / costo de crédito
        └──► Comisiones, tesorería, derivados, inversiones (roles
              distintos según función económica)
        │
        ▼
Capital: contable ≠ regulatorio ≠ prudencial/objetivo ≠ potencialmente
excedentario ≠ distribuible
        │
        ▼
Bancolombia S.A. (banco operativo, requerimientos regulatorios propios)
        │
        ▼
Grupo Cibest (holding, estructura financiera y monitoreo de double
leverage propios)
        │
        ▼
Accionista final — capacidad de distribución condicionada por
retención necesaria, crecimiento, buffers prudenciales y obligaciones
propias de cada nivel societario (ver Bancolombia-G, §22)
```

Este mapa es específico de Grupo Cibest/Bancolombia — no se propone como
plantilla universal para bancos, y mucho menos para cualquier empresa
(ver §20, R7).

## 8. Evidencia material analizada

Este caso documenta prudentemente, sin verificación independiente
adicional, los siguientes hallazgos conceptuales (detalle en §9–§19):

- **A. Depósitos y fondeo** — depósitos de clientes materialmente
  dominantes dentro de los pasivos; función económica de fondeo, no solo
  etiqueta contable de pasivo (§9).
- **B. Intereses / NIM** — ingresos y gastos por intereses, costo de
  depósitos, rendimiento de cartera y NIM como motor económico central,
  no financiación externa a la operación (§10).
- **C. Cartera y ECL/provisiones** — riesgo, comportamiento de cartera y
  estimaciones prospectivas incorporados en las provisiones crediticias
  (§11).
- **D. Cash/liquidez** — cash contable, liquidez prudencial/regulatoria,
  cash económicamente excedentario y cash distribuible como cuatro
  conceptos distintos (§12).
- **E. Capital** — patrimonio contable, capital regulatorio, capital
  prudencial/objetivo, capital potencialmente excedentario y capital
  distribuible como conceptos distintos (§13).
- **F. NWC** — el concepto industrial convencional no aparece como driver
  económicamente adecuado para el core bancario (§14).
- **G. CAPEX/reinversión** — CAPEX existe pero no representa
  necesariamente toda la reinversión económica relevante de un banco
  (§15).
- **H. Derivados/inversiones** — funciones económicas heterogéneas
  (negocio con clientes, cobertura, gestión de balance, liquidez,
  riesgo) (§16).
- **Holding/double leverage y Banistmo/perímetro** — la reorganización de
  2025 y el acuerdo sobre Banistmo como evidencia directa de
  comparabilidad/perímetro y atribución temporal (§17, §18).

Ninguno de estos hallazgos produce, por sí mismo, una cifra de valor —
son evidencia para tensionar el Expediente (§26–§29), no insumos de
cálculo.

## 9. A. Depósitos y fondeo

`HECHO DOCUMENTADO` (según la síntesis recibida, a nivel estructural,
sin cifras): Grupo Cibest cerró FY2025 con depósitos de clientes
materialmente dominantes dentro de sus pasivos.

**Regla explícita de este caso**: la economía bancaria exige investigar
los depósitos no únicamente como una etiqueta contable de pasivo, sino
por su función como fuente fundamental de fondeo. **No** es correcto
escribir "los depósitos no son deuda" como afirmación general. La
formulación correcta es: **la clasificación contable como pasivo no
determina por sí sola el tratamiento económico requerido para una
valoración.**

Esto es una instancia directa de R1 (contabilidad ≠ economía), con un
mecanismo — el fondeo bancario vía depósitos — sin precedente exacto en
los cinco casos previos.

`DESCONOCIDO` en este documento: el desglose cuantitativo de depósitos
por tipo, plazo, o costo — el material de trabajo no lo desagrega en
cifras, y este documento no lo estima.

**Preguntas a gerencia**: ver §33.

## 10. B. Intereses (NIM)

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida):
ingresos por intereses, gastos por intereses, costo de depósitos,
rendimiento de cartera y NIM (margen neto de interés) forman parte
central del motor económico bancario.

**Regla explícita de este caso**: la dicotomía industrial convencional
—`interés = financiación externa a la operación`— **no puede
trasladarse mecánicamente** al core bancario. En un banco, el margen
entre lo que cuesta el fondeo (depósitos, deuda) y lo que rinde la
cartera **es** la operación, no un elemento financiero separado de ella.

Esto refuerza R1 y aporta un mecanismo nuevo, distinto de los vistos en
los cinco casos previos.

**Preguntas a gerencia**: ver §33.

## 11. C. Cartera y ECL / provisiones

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida): las
provisiones crediticias incorporan riesgo, comportamiento de cartera,
exposiciones específicas y estimaciones prospectivas.

**Regla explícita de este caso**: **no concluir** que una provisión alta
es automáticamente extraordinaria. **Tampoco concluir** que una
provisión alta es automáticamente normalizable. La formulación prudente
es: una cifra reportada de provisiones puede requerir análisis antes de
determinar qué parte, si alguna, debe recibir un tratamiento de
normalización o proyección distinto.

Esto refuerza directamente R2 (observado ≠ normalizado ≠ proyectado) y
R8 (detectar sin decidir): Velarix puede señalar que una provisión se
apartó de su patrón histórico; el experto determina si eso amerita
tratamiento distinto.

**Preguntas a gerencia**: ver §33.

## 12. D. Cash / liquidez

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida): en
una institución bancaria deben distinguirse conceptualmente al menos
cuatro nociones de efectivo:

```
cash contable
  ≠
liquidez prudencial/regulatoria
  ≠
cash económicamente excedentario
  ≠
cash distribuible
```

**Regla explícita**: **no afirmar que todo cash bancario esté
jurídicamente restringido.** La distinción anterior no implica que todo
el efectivo reportado esté indisponible — implica que ninguna de las
cuatro nociones puede asumirse como equivalente a otra sin evidencia.

Esta es la segunda instancia, después de ISA (observación ISA-F, §22),
de que reconocimiento/titularidad contable de un recurso no equivale
automáticamente a su disponibilidad económica para cualquier propósito
— ahora con un mecanismo distinto (liquidez prudencial bancaria, no
efectivo restringido contractualmente).

**Preguntas a gerencia**: ver §33.

## 13. E. Capital

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida):
deben distinguirse conceptualmente al menos cinco nociones de capital:

```
patrimonio contable
  ≠
capital regulatorio
  ≠
capital prudencial/objetivo
  ≠
capital potencialmente excedentario
  ≠
capital distribuible
```

`HECHO DOCUMENTADO`: Bancolombia S.A. mantiene requerimientos
regulatorios propios como banco operativo. Grupo Cibest, como holding,
mantiene su propia estructura financiera y monitoreo de double leverage
(apalancamiento del holding sobre su inversión en la subsidiaria
regulada).

**Regla explícita**: la generación de utilidad o la existencia de
patrimonio contable en Bancolombia S.A. **no determina por sí sola**
cuánto capital puede fluir hacia Grupo Cibest ni cuánto de ese flujo
puede, a su vez, distribuirse al accionista final — ver Bancolombia-G
(§22).

**Preguntas a gerencia**: ver §33.

## 14. F. NWC

`HECHO DOCUMENTADO` (conclusión analítica de este caso): el concepto
industrial convencional de capital de trabajo neto (NWC) **no aparece
como un driver económicamente adecuado** para el core bancario — un
banco no tiene "inventario" ni "cuentas por cobrar comerciales" en el
sentido industrial; su "capital de trabajo" económico está mejor
representado por la relación entre depósitos, cartera y liquidez ya
descrita en §9–§12.

**Regla explícita, que no admite ambigüedad**: **esto no elimina NWC de
Velarix.** La conclusión correcta es: NWC no debe asumirse como driver
universal obligatorio — para el core bancario, no es el driver
relevante; para otras economías (retail, manufactura), puede seguir
siéndolo.

**Preguntas a gerencia**: ver §33.

## 15. G. CAPEX / reinversión

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida):
CAPEX existe en Bancolombia (infraestructura física, tecnología), pero
**no representa necesariamente toda la reinversión económica relevante**
de un banco. El crecimiento de un banco puede exigir, además,
**retención de capital** que soporte activos, riesgo y requerimientos
prudenciales — una forma de reinversión sin equivalente exacto en las
economías industriales de los cinco casos previos.

**Regla explícita**: **no crear una fórmula automática** que combine
CAPEX contable y retención de capital regulatorio en una única métrica
de "reinversión bancaria". Este documento solo registra que ambos
mecanismos existen y son conceptualmente distintos.

**Preguntas a gerencia**: ver §33.

## 16. H. Derivados / inversiones

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida): un
banco puede mantener derivados e inversiones financieras con funciones
económicas heterogéneas — negocio con clientes, cobertura, gestión de
balance, gestión de liquidez, gestión de riesgo — según el modelo de
negocio de cada instrumento.

**Regla explícita**: **no clasificar todos los derivados o inversiones
bajo una única función económica.** Refuerza R1 y R4 (descomposición
según la dimensión — aquí, "función económica" — que explique el
comportamiento).

**Preguntas a gerencia**: ver §33.

## 17. Holding / double leverage

`HECHO DOCUMENTADO` (según la síntesis recibida, sin verificación
independiente adicional, sin cifras): la reorganización societaria de
mayo de 2025 creó una estructura de dos niveles societarios materiales
para efectos de valoración — Bancolombia S.A. (banco operativo regulado)
y Grupo Cibest (holding cotizado). Grupo Cibest tiene, en principio, su
propia estructura financiera y su propio monitoreo de "double leverage"
(la práctica de que un holding financie parte de su inversión en una
subsidiaria regulada con deuda propia del holding).

**Regla explícita**: esto es evidencia directa de comparabilidad/
perímetro (§21) — el perímetro consolidado de Grupo Cibest, la
regulación aplicable específicamente a Bancolombia S.A., y la atribución
final al accionista de Grupo Cibest no son automáticamente la misma
cosa.

**Preguntas a gerencia**: ver §33.

## 18. Banistmo — perímetro / corte

`HECHO DOCUMENTADO` (según la síntesis recibida, sin verificación
independiente adicional, sin cifras): existe un acuerdo relacionado con
la venta de Banistmo, con clasificación contable relevante al cierre
(operación discontinuada / mantenida para la venta, según corresponda) y
con eventos posteriores al 31-dic-2025.

**Regla explícita, coherente con Candidato C (§22)**: este caso NO
resuelve si o cuándo se completó la venta — eso, cuando corresponda,
queda documentado como información posterior al corte (§19). Lo que este
caso documenta es que la clasificación al cierre, la fecha del hecho
económico (acuerdo), la fecha de reconocimiento contable, y la fecha de
cualquier cierre posterior de la transacción **son fechas distintas que
no deben confundirse entre sí**.

**Preguntas a gerencia**: ver §33.

## 19. Información posterior al corte — 2026

**Esta información NO pertenece a FY2025** y no se mezcla con los
hallazgos de §9–§18.

`INFORMACIÓN POSTERIOR AL CORTE — 1T26 y 2T26`: el material de trabajo
de este caso hace referencia a resultados de 1T26 y 2T26 de Grupo
Cibest/Bancolombia como parte de la síntesis recibida, incluyendo
posible desarrollo posterior del acuerdo sobre Banistmo, sin que este
documento reproduzca cifras específicas de esos periodos (`DESCONOCIDO`
el detalle cuantitativo).

**Regla explícita, que no admite excepción**: esta información **no
cambia el período base FY2025**. Este documento **no reescribe
retroactivamente** ningún hecho, cifra o clasificación que fuera
verdadera al 31 de diciembre de 2025. El eventual cierre de la venta de
Banistmo puede usarse para explicar el desarrollo posterior del evento,
pero permanece identificado como información posterior al corte.

## 20. Contraste formal R1–R8 (resultado del Caso 06)

Regla rectora, igual que en los contrastes de los Casos 02–05: `PATRÓN
OBSERVADO EN SEIS CASOS` se usa **solo** donde la evidencia de
Tecnoglass, Terpel, Ecopetrol, Grupo Éxito, ISA y Bancolombia es
realmente transversal — nunca como sinónimo de regla universal, nunca
como `CONFIRMADO POR SEIS CASOS`, y nunca por aplicación automática.

- **R1 — Contabilidad ≠ economía.** `PATRÓN OBSERVADO EN SEIS CASOS.`
  Bancolombia ofrece evidencia especialmente fuerte porque depósitos,
  intereses, liquidez, instrumentos financieros y capital pueden
  conservar una clasificación contable correcta sin que esa
  clasificación determine, por sí sola, su interpretación para
  valoración (§9–§16). **No decir `CONFIRMADO POR SEIS CASOS`.**
- **R2 — Observado ≠ normalizado ≠ proyectado.** `PATRÓN OBSERVADO EN
  SEIS CASOS.` Bancolombia refuerza mediante provisiones/ECL (§11),
  eventos particulares, Banistmo (§18), y la posible comparación entre
  cifras reportadas y otras vistas analíticas o pro forma. **Nunca
  sobrescribir lo reportado.**
- **R3 — Los supuestos están relacionados.** `PATRÓN OBSERVADO EN SEIS
  CASOS + DISEÑO INSUFICIENTEMENTE VALIDADO.` Bancolombia refuerza
  relaciones temporales, condicionales, regulatorias, macroeconómicas,
  bidireccionales o no lineales, y dependientes del comportamiento del
  balance (ej. costo de depósitos ↔ tasas de mercado ↔ NIM ↔ crecimiento
  de cartera ↔ capital requerido). **Cautela explícita, mantenida desde
  ISA**: no convertir `assumption_relations` en un grafo causal ingenuo
  A → B. **No se rediseña. No se implementa.**
- **R4 — Descomposición según la dimensión económica relevante.**
  Formulación vigente, sin cambios: *"una partida o variable material
  puede necesitar descomposición según la dimensión que explique su
  comportamiento económico."* `PATRÓN OBSERVADO EN SEIS CASOS.`
  Bancolombia añade evidencia sobre producto, tipo de cartera, fondeo,
  riesgo, función económica, moneda, geografía, entidad, regulación, y
  modelo de negocio (§9–§16). Se mantiene: *"MÁS GRANULARIDAD NO ES
  AUTOMÁTICAMENTE MEJOR ANÁLISIS."* **No se crea enum universal. No se
  hace obligatorio `account_components`.**
- **R5 — Estado de conocimiento explícito.** `SOBREVIVE — SE
  PROFUNDIZA.` Bancolombia ofrece múltiples instancias de "conozco la
  cifra, pero todavía no sé cómo interpretarla económicamente para este
  propósito" — especialmente en provisiones (§11), cash/liquidez (§12) y
  capital (§13). **No se crea un nuevo enum epistemológico.**
- **R6 — Método de determinación (scope / purpose).** Bancolombia aporta
  **refuerzo muy fuerte** a ambos, sin elevar formalmente ninguno más
  allá de su nivel ya alcanzado. `scope` continúa como `NECESIDAD
  CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS` — Bancolombia
  hace material distinguir holding, banco operativo, subsidiaria, grupo
  consolidado, unidad regulatoria, e interés económico final del
  accionista (§6, §17). Se mantiene: problema de `scope` ≠ obligación de
  modelar todos los niveles. `purpose` también recibe evidencia fuerte
  — instrumento mantenido para cobrar, negociar, cubrir riesgos,
  administrar liquidez, soportar necesidades regulatorias, u otro
  propósito económico relevante (§16) — y **permanece** en `NECESIDAD
  CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS, AÚN MENOS
  MADURA QUE SCOPE` (el mismo nivel alcanzado en el Caso 05): **no se
  concluye que `purpose` ya tenga la misma madurez conceptual que
  `scope`.** **No se crean campos. No se crean enums. No se diseña
  estructura final.**
- **R7 — Drivers específicos por empresa.** `PATRÓN OBSERVADO EN SEIS
  CASOS.` Bancolombia agrega drivers sectoriales bancarios: NIM, costo
  de depósitos, yield de cartera, crecimiento/mix de cartera, costo de
  crédito, calidad de activos, stages/ECL, RWA (activos ponderados por
  riesgo), solvencia, liquidez, mix de fondeo, FX, tasas, comisiones.
  **No se incorporan estos drivers como set universal del Expediente**
  — son ejemplos observados en Bancolombia, no un catálogo obligatorio.
- **R8 — Detectar incoherencias sin decidir.** `PATRÓN OBSERVADO EN SEIS
  CASOS.` Ejemplos conceptuales de este caso: provisión alta ≠
  automáticamente extraordinaria; cash alto ≠ automáticamente excess
  cash; depósito ≠ automáticamente equivalente económico a un bono
  corporativo; fair value ≠ automáticamente especulación; caída de
  utilidad ≠ automáticamente deterioro recurrente. Velarix **detecta**;
  el experto **interpreta y decide**.

## 21. Comparabilidad / perímetro

**Estado anterior** (Caso 05, §23 de `CASO-05-ISA-V0.md`):

`PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA
SUFICIENTE PARA EXIGIR TRATAMIENTO METODOLÓGICO, TODAVÍA INSUFICIENTE
PARA DISEÑAR UNA REPRESENTACIÓN GENERAL.`

**Después de Bancolombia**:

`PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS, AHORA
INCLUYENDO UNA INSTITUCIÓN FINANCIERA; EVIDENCIA SUFICIENTE PARA EXIGIR
TRATAMIENTO METODOLÓGICO, TODAVÍA INSUFICIENTE PARA DISEÑAR UNA
REPRESENTACIÓN GENERAL.`

**Razón**: Bancolombia aporta, simultáneamente: holding distinto del
banco operativo (§6, §17); regulación aplicada a `scopes` específicos
(§13, §17); consolidación; posibles intereses no controladores;
reorganización societaria completada en 2025 (§17); Banistmo como
operación discontinuada/mantenida para la venta (§18); y una diferencia
explícita entre el resultado del banco operativo y la atribución final
al accionista del holding (§13, Bancolombia-G, §22). Esta es la primera
vez que el problema se demuestra en una **institución financiera
regulada**, ampliando el rango de economías donde reaparece.

**Cautela obligatoria, sin cambio**: problema de perímetro demostrado ≠
obligación de modelar entidad por entidad. **No se crea
`case_perimeter`, tabla, schema, ni un motor automático de NCI/JV.**

## 22. Candidatos A–E, ISA-F y Bancolombia-G

Registrados como **candidatos u observaciones**, explícitamente **no**
como principios universales ni como R9/R10 — ninguna regla nueva se
numera junto a R1–R8 en este documento.

### Candidato A — Neteo (heredado de Ecopetrol, Caso 03)

**Resultado Bancolombia**: `EVIDENCIA INSUFICIENTE`. La existencia
simultánea de activos y pasivos financieros en el balance de un banco
(algo estructuralmente normal en la industria) **no constituye, por sí
misma, evidencia de neteo económicamente destructivo** — no debe
confundirse una cosa con la otra. **No se eleva.**

**Estado: se mantiene sin cambio: `EVIDENCIA FUERTE EN ECOPETROL —
VALIDAR EN CASOS FUTUROS`.**

### Candidato B — Ciclo de vida económico (heredado de Ecopetrol, reforzado por Grupo Éxito e ISA)

Ecopetrol: inversión→operación→mantenimiento/reposición→agotamiento→
abandono. Grupo Éxito: apertura→operación→remodelación/conversión→
posible cierre. ISA: adjudicación→construcción→operación→O&M→
refuerzos→vencimiento contractual→reversión/indemnización/renovación.

**Resultado Bancolombia**: el caso no aportó un ciclo de vida
específicamente bancario con la misma claridad estructural que los tres
anteriores (activos/pasivos financieros no siguen, en general, un ciclo
de vida físico comparable) — pero la vida/vencimiento contractual de
activos o pasivos financieros ≠ vida económica del portafolio ≠ vida de
la compañía es un mecanismo consistente con el patrón ya observado,
aunque de naturaleza distinta a los tres anteriores.

**Estado: sube a `PATRÓN OBSERVADO EN CUATRO CASOS DE NATURALEZA
ECONÓMICA MUY DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA`** (Ecopetrol,
Grupo Éxito, ISA, Bancolombia). **No se convierte en R9. No se crea
`economic_lifecycle`.**

### Candidato C — Atribución temporal / corte de conocimiento (heredado de Ecopetrol, reforzado por Grupo Éxito e ISA)

**Resultado Bancolombia**: refuerzo **muy fuerte**. El caso aporta: la
reorganización societaria de 2025 (§17); el acuerdo sobre Banistmo, su
clasificación al cierre, y sus eventos posteriores (§18, §19); y la
diferencia general entre fecha del hecho económico, fecha de
reconocimiento contable, fecha de corte, y fecha de conocimiento.

**Estado: sube a `PROBLEMA METODOLÓGICO FUERTEMENTE RESPALDADO POR
MÚLTIPLES CASOS — REQUIERE DEFINIR PRINCIPIOS ANTES DE DISEÑAR
REPRESENTACIÓN`** (elevado desde "respaldado" a "fuertemente
respaldado"). **No se crea `economic_period`. No se crean campos. No se
crea schema.**

### Candidato D — Derechos económicos / propiedad dinámica (nuevo en Grupo Éxito)

**Resultado Bancolombia**: `EVIDENCIA INSUFICIENTE PARA REFORZAR EL
COMPONENTE CONTRACTUAL/DINÁMICO`. La reorganización societaria de 2025
**por sí sola no demuestra** el fenómeno específico del candidato (una
opción u obligación contractual capaz de modificar la atribución
económica en el futuro) — es un cambio estructural completado, no un
derecho contractual dinámico pendiente. **No se eleva.**

**Estado: se mantiene el predominio de la evidencia previa de Grupo
Éxito: `EVIDENCIA FUERTE EN GRUPO ÉXITO — VALIDAR EN CASOS FUTUROS`.**

### Candidato E — Base de medición / régimen monetario (nuevo en Grupo Éxito, reforzado por ISA)

**Resultado Bancolombia**: evidencia adicional fuerte, pero que
**tensiona** la formulación general en vez de simplemente reforzarla.
Ejemplos de **base de medición** en este caso: costo amortizado, FVOCI
(fair value con cambios en otro resultado integral), FVTPL (fair value
con cambios en resultados), impairment/ECL. Ejemplos de **moneda /
régimen monetario**: moneda funcional, exposición FX, conversión.

**No se declara simplemente "patrón observado en tres casos".**
**Estado: `EVIDENCIA ADICIONAL FUERTE, PERO LA FORMULACIÓN GENERAL SE
VUELVE MENOS ESTABLE: BANCOLOMBIA REFUERZA QUE "BASE DE MEDICIÓN" Y
"RÉGIMEN MONETARIO / MONEDA" PUEDEN SER FENÓMENOS RELACIONADOS PERO
METODOLÓGICAMENTE DISTINTOS.`** **No se divide todavía en E1/E2. No se
convierte en R10. No se crea `measurement_basis`, enum monetario, ni
campos.** Esta tensión se envía a la consolidación posterior a los ocho
casos.

### Observación ISA-F — Disponibilidad / restricción económica de recursos (heredada de ISA, no candidato formal)

*"El reconocimiento, titularidad o control de un recurso no implica
necesariamente que esté económicamente disponible para cualquier
propósito."* ISA mostró: control/reconocimiento ≠ disponibilidad.
Bancolombia refuerza con un mecanismo distinto: cash contable ≠
automáticamente excess cash o cash distribuible (§12). **No afirmar que
toda caja esté restringida.**

**Estado: sube a `OBSERVACIÓN TRANSVERSAL FUERTEMENTE REFORZADA EN DOS
ECONOMÍAS RADICALMENTE DISTINTAS — ISA Y BANCOLOMBIA — MANTENER ABIERTA
PARA VALIDACIÓN EN CASOS 07–08 ANTES DE DECIDIR SU ELEVACIÓN.`**
**Explícitamente no se convierte todavía en Candidato F. No se crea
`availability`, enum, campo, schema, ni automatización.**

### Nueva observación — Bancolombia-G: puente de capital / capacidad de distribución

**Formulación (observación sectorial provisional, NO candidato
transversal formal)**: *"la generación de utilidad o la existencia de
patrimonio en una entidad regulada no determina por sí sola cuánto valor
económico puede distribuirse al accionista final; pueden intervenir
requerimientos de capital, crecimiento, buffers prudenciales y niveles
societarios intermedios."*

**Cadena conceptual**:

```
resultado
  → retención necesaria
  → capital que soporta crecimiento/riesgo
  → posible capital excedentario
  → capacidad de distribución de la subsidiaria
  → recursos recibidos por el holding
  → obligaciones propias del holding
  → capacidad final de distribución al accionista
```

**Estado: `EVIDENCIA FUERTE EN BANCOLOMBIA — OBSERVACIÓN SECTORIAL;
VALIDAR ANTES DE ELEVAR A CANDIDATO TRANSVERSAL`.** **No se llama
"Candidato G". No se fusiona todavía con ISA-F** (ambas tratan
disponibilidad/capacidad de recursos, pero por mecanismos distintos:
restricción de reconocimiento vs. puente de capital regulatorio-holding
— fusionarlas prematuramente perdería esa distinción). **Munich Re será
una prueba futura especialmente relevante para este candidato
provisional** (aseguradora regulada, con su propio régimen de capital).
**No se crea `capital_bridge`, `regulatory_capital`,
`distributable_capital`, campos, tablas, ni reglas automáticas.**

## 23. Supplier financing

**Resultado Bancolombia**: `IRRELEVANCIA / EVIDENCIA INSUFICIENTE`. Que
Bancolombia financie a sus clientes o a empresas **no constituye
automáticamente** supplier financing de Bancolombia como empresa
valorada — es la actividad ordinaria de un banco, no un mecanismo de
financiamiento de proveedores propio de Bancolombia. **No se usa este
caso para reforzarlo.**

**Estado: se mantiene sin cambio: `PROBLEMA FUERTEMENTE REFORZADO —
CRITERIOS DE RECLASIFICACIÓN TODAVÍA ABIERTOS`.** La evidencia histórica
principal sigue apoyada en Tecnoglass, Terpel y Grupo Éxito.

## 24. Leases

Bancolombia refuerza el problema: Grupo Cibest puede aparecer como
lessee, lessor, arrendador financiero, y arrendador operativo,
dependiendo del contrato.

**Regla explícita, coherente con Grupo Éxito e ISA**: vuelve a fallar
cualquier simplificación universal — `lease = deuda` o `lease =
operación`. Su interpretación depende de rol, contrato, `scope`,
`purpose`, y economía específica.

**Estado: se mantiene sin cambio: `PROBLEMA DEMOSTRADO — TRATAMIENTO DE
VALORACIÓN NO GENERALIZADO`.** **No se crea regla automática.**

## 25. Métodos de valoración — resultado del caso

**No se selecciona método final. No se valora Bancolombia.**

### A. EV / FCFF + WACC convencional

**Resultado: NO ADECUADO COMO DEFAULT PARA EL CORE BANCARIO.** Razones:
dificultad de separar operación y financiación (§9, §10); depósitos/
fondeo integrados al negocio; intereses operativamente centrales; NWC
industrial no representativo (§14); reinversión no capturada únicamente
por CAPEX (§15); net debt convencional problemático dado el rol de
depósitos y activos financieros en el balance.

**No escribir** "FCFF está prohibido para bancos" ni "Enterprise Value
no existe para bancos". La conclusión es únicamente que **no debe
asumirse automáticamente como método default** para el core bancario.

### B. Residual Income / Excess Return

**Resultado: CANDIDATO METODOLÓGICO MÁS FUERTE DEL CASO.** Razón
conceptual: conecta book equity con la capacidad de generar ROE por
encima o por debajo del Cost of Equity. **No está aprobado.** Riesgos
identificados: book equity puede requerir interpretación (§13); ROE
observado puede estar afectado por la reorganización, el perímetro, o
eventos particulares (§17, §18); el valor terminal requiere supuestos;
el `scope` importa (§6).

### C. FCFE adaptado a capital

**Resultado: CANDIDATO FUERTE.** Puede interpretar conceptualmente la
reinversión bancaria mediante el capital retenido necesario para
soportar crecimiento y riesgo (§15, Bancolombia-G). Requiere: supuestos
de crecimiento, RWA, capital requerido, buffers, capital objetivo, y
capacidad de distribución. **No se aprueba ninguna fórmula.**

### D. DDM / dividendos potenciales

**Resultado: CANDIDATO FUERTE.** Pero: dividendo observado ≠
automáticamente dividendo sostenible o distribuible. **No proyectar
mecánicamente el payout histórico.**

### E. SOTP (suma de partes)

**Resultado: CANDIDATO A EVALUAR POR MATERIALIDAD.** Puede ser relevante
dado que Grupo Cibest puede incluir Bancolombia S.A., otras entidades
financieras, y negocios no financieros bajo el mismo holding. **Más
granularidad ≠ automáticamente mejor valoración** (consistente con R4,
§20). **No se hace obligatorio.**

### F. Método final

**PREGUNTA ABIERTA. No se aprueba método en el Caso 06.**

## 26. WACC / Cost of Equity — tensión metodológica

Se documenta, sin resolver, la siguiente tensión: Bancolombia aporta
evidencia de que WACC no debería asumirse como input obligatorio de toda
valoración — la tasa de descuento necesaria depende del método elegido y
del objeto económico valorado (§6, §25). Si se valora directamente el
equity (ej. mediante Residual Income, FCFE o DDM), el Cost of Equity
puede ser la tasa relevante en lugar de un WACC que mezcle costo de
deuda y costo de equity de una forma que, para un banco, puede no ser
económicamente representativa.

**Esto NO modifica automáticamente las decisiones financieras
vigentes.** **No se aprueba Cost of Equity. No se aprueba un WACC nuevo.
No se modifica la metodología del Bloque 1B como decisión cerrada.**
Este punto se envía a revisión posterior a los ocho casos.

## 27. Estructura de capital (profundización de la Decisión 2)

La Decisión 2 del Bloque 1B
(`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md` §"Decisión 2 —
Estructura de capital observada vs. objetivo") establece que el
producto estándar usa siempre la estructura de capital observada de la
empresa, y que cualquier override profesional requiere justificación y
trazabilidad. **Esta decisión no cambia en este documento.**

**Cautela conceptual añadida por Bancolombia**: antes de usar una
estructura de capital observada puede ser necesario determinar
**¿estructura observada de qué `scope` y para qué `purpose`?** — Grupo
Cibest holding ≠ Bancolombia S.A. ≠ grupo consolidado ≠ otras entidades
reguladas (§6, §17).

**No se concluye** que cada subsidiaria necesite un WACC propio — eso
sería una generalización no sustentada por este documento. **No se
modifica la decisión aprobada.**

## 28. Horizonte / estado estable (profundización de la Decisión 4)

La Decisión 4 del Bloque 1B
(`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md` §"Decisión 4 —
Horizonte explícito del DCF") establece que Velarix mantiene, por ahora,
un horizonte explícito fijo de 5 años. **Esta decisión no cambia en
este documento.** Bancolombia **no** cambia la Decisión 4.

**Pregunta metodológica documentada, no resuelta**: en modelos de
equity/residual income aplicados a una institución financiera, "estado
estable" puede relacionarse con la convergencia de los retornos
económicos (ej. ROE convergiendo hacia el Cost of Equity) y con un
crecimiento sostenible del balance, **no** con la desaparición física de
la entidad — una noción de estado estable distinta de la usada en
Ecopetrol (activos finitos, §20 del Caso 05) o en las economías
industriales de los Casos 01–02 y 04.

**No se aprueba horizonte nuevo. No se aprueba g. No se cambia la
Decisión 4.**

## 29. Impacto sobre el Expediente

**El Caso 06 no destruye el Expediente de Valoración.** Refuerza su
capa universal de proceso:

```
EVIDENCIA
  → CONTEXTO
  → INTERPRETACIÓN
  → ESTADO DE CONOCIMIENTO
  → PREGUNTAS
  → NORMALIZACIONES
  → HIPÓTESIS / SUPUESTOS
  → SELECCIÓN / JUSTIFICACIÓN METODOLÓGICA
  → APROBACIÓN EXPERTA
  → CÁLCULO
  → CONCLUSIÓN PROFESIONAL
```

**Distinción central que este caso deja documentada** (ver también
§30):

```
ARQUITECTURA UNIVERSAL DEL PROCESO DE VALORACIÓN
  ≠
ARQUITECTURA FINANCIERA ESPECÍFICA DEL MÉTODO Y DE LA ECONOMÍA VALORADA
```

La primera puede conservar evidencia, procedencia, contexto, preguntas,
interpretación, normalizaciones, supuestos, aprobación y trazabilidad —
de forma transversal a los seis casos. La segunda puede variar según
economía, `scope`, `purpose`, método, regulación y drivers — Bancolombia
es la evidencia más fuerte hasta ahora de que esta segunda capa **no**
es universal (ver §31).

**Esta distinción no se convierte en**: `industry_type`, `bank_mode`,
`financial_institution` enum, motores sectoriales, ni arquitectura
técnica nueva.

## 30. Objeto de valoración y selección de método

Este caso deja documentada una necesidad conceptual que el Expediente no
representaba con esta claridad: **el Expediente queda conceptualmente
incompleto si presupone que "la empresa" es siempre un objeto
suficientemente preciso para valorar.**

Bancolombia demuestra la necesidad de establecer explícitamente **qué
interés económico se está intentando valorar** (§6: ¿Grupo Cibest
consolidado?, ¿Bancolombia S.A.?, ¿la porción atribuible al accionista
final después de NCI y double leverage?).

Asimismo, debe poder documentarse conceptualmente: qué métodos fueron
considerados (§25); por qué un método es compatible con la economía y el
objeto valorado; por qué otro puede ser inapropiado; y qué método
finalmente aprueba el experto.

**Esto es una necesidad metodológica, no un diseño de datos.** **No se
crea**: `valuation_method` field, enum, selector, "method engine", "bank
mode", ni "industry mode".

## 31. Elementos financieros que no pueden ser obligatorios universales

Bancolombia aporta evidencia suficiente para **rechazar como obligación
universal** la secuencia:

```
FCFF → WACC → CAPEX → NWC → Enterprise Value → net debt → Equity Value
```

**Esto no significa eliminar esa secuencia** — sigue siendo apropiada
cuando la economía y el método del caso la justifiquen (ej. Tecnoglass,
Terpel, Grupo Éxito). Significa que no deben asumirse universalmente:
FCFF; WACC; NWC; CAPEX como totalidad de la reinversión; net debt; el
puente EV → Equity Value; intereses como financiación no operativa;
cash como excess cash; deuda como categoría económicamente homogénea;
book equity como capital libre; ni un set universal cerrado de drivers.

## 32. Normalizaciones

Se mantiene sin cambios la regla vigente desde el Caso 01: partida
reportada → posible ajuste → motivo → evidencia → recurrente/no
recurrente → importe propuesto → responsable → aprobación → importe
normalizado — **nunca sobrescribir lo reportado**. **Bancolombia no
autoriza ninguna normalización automática** (ej. de provisiones,
§11).

## 33. Preguntas a gerencia (representativas, no exhaustivas)

**Depósitos y fondeo**

1. ¿Cuál es la composición de depósitos por tipo, plazo y costo?
2. ¿Cómo gestiona la tesorería el mix de fondeo entre depósitos y otras
   fuentes?

**Intereses / NIM**

3. ¿Cómo se descompone el NIM entre rendimiento de cartera y costo de
   fondeo?
4. ¿Qué sensibilidad tiene el NIM a movimientos de tasas de interés de
   referencia?

**Cartera / ECL**

5. ¿Qué parte de las provisiones del período responde a deterioro de
   cartera existente vs. crecimiento de originación?
6. ¿Qué supuestos macroeconómicos prospectivos se usan en el modelo de
   ECL?

**Cash / liquidez**

7. ¿Qué proporción del efectivo reportado está sujeta a requerimientos
   prudenciales de liquidez?
8. ¿Cómo determina la administración el "exceso" de liquidez sobre los
   mínimos regulatorios?

**Capital**

9. ¿Cuál es el capital regulatorio de Bancolombia S.A. frente a su
   patrimonio contable?
10. ¿Cómo se determina la política de dividendos entre Bancolombia S.A.
    y Grupo Cibest?
11. ¿Qué régimen de double leverage aplica a Grupo Cibest como holding?

**CAPEX / reinversión**

12. ¿Qué proporción de la retención de utilidades responde a
    requerimientos de capital regulatorio vs. crecimiento discrecional?

**Derivados / inversiones**

13. ¿Qué proporción de derivados/inversiones responde a negocio con
    clientes vs. cobertura vs. gestión de balance?

**Holding / Banistmo**

14. ¿Qué activos y pasivos específicos se transfirieron o permanecen
    afectados por la reorganización de 2025?
15. ¿Cuál es el estado exacto del acuerdo sobre Banistmo al cierre de
    FY2025, y qué eventos posteriores existen?

**Método de valoración**

16. ¿Qué interés económico es el objeto de un eventual encargo de
    valoración: Grupo Cibest consolidado, Bancolombia S.A., u otro
    scope?
17. ¿Qué metodología de valoración usa internamente la administración
    o los analistas que cubren la acción?

Estas preguntas siguen el mismo flujo usado en los casos previos:

```
hecho → desconocido/evidencia insuficiente → pregunta → respuesta/
evidencia futura → eventual decisión
```

Ninguna de estas preguntas se responde en este documento.

## 34. Preguntas metodológicas que permanecen abiertas

Preservadas explícitamente, sin resolución en este documento — y que
deben sobrevivir a los Casos 07 (Goldman Sachs) y 08 (Munich Re) sin
presuponer su resultado:

- Diseño final de `scope`.
- Diseño final de `purpose`.
- Si `assumption_relations` necesita representar relaciones temporales,
  condicionales, regulatorias o bidireccionales.
- Umbral de materialidad para exigir descomposición (`account_components`).
- Tratamiento de leases cuando el mismo grupo es simultáneamente
  arrendatario y arrendador — tercera instancia.
- Comparabilidad/perímetro — ahora incluyendo una institución
  financiera, sin representación general.
- Candidato A (neteo) — sin evidencia nueva en dos casos consecutivos
  (Grupo Éxito, ISA) ni en este.
- Candidato B (ciclo de vida) — ahora con evidencia de cuatro casos.
- Candidato C (atribución temporal) — ahora "fuertemente respaldado".
- Candidato D (derechos económicos/propiedad dinámica) — sin evidencia
  nueva en dos casos consecutivos (ISA, Bancolombia).
- Candidato E (base de medición/régimen monetario) — formulación general
  cada vez menos estable; pregunta abierta sobre si debe dividirse.
- Observación ISA-F — reforzada en dos economías radicalmente distintas;
  pregunta abierta sobre su elevación a Candidato F, a validar en Casos
  07–08.
- Observación Bancolombia-G — nueva, sectorial; pregunta abierta sobre
  su elevación a candidato transversal, especialmente relevante para el
  Caso 08 (Munich Re, con régimen de capital propio de seguros).
- Método de valoración final para instituciones financieras — pregunta
  abierta explícita, no resuelta.
- Tensión WACC/Cost of Equity — enviada a consolidación posterior a los
  ocho casos.
- Qué significa "estado estable" en modelos de equity/residual income
  aplicados a una institución financiera.
- A qué `scope` pertenece una estructura de capital observada antes de
  usarla como referencia.

Ninguna de estas preguntas se resuelve en este documento.

## 35. Qué NO se creó como candidato nuevo

Para evitar sobreingeniería, este documento **no** crea candidatos
independientes para fenómenos que, aunque reales y documentados, se
absorben dentro de reglas o candidatos ya existentes:

- "Depósitos ≠ deuda bajo toda definición" — no se afirma; se absorbe en
  R1 con la formulación prudente de §9.
- Diferencias funcionales entre derivados/inversiones (§16) — absorbidas
  en R1 y R4.
- La secuencia CAPEX/retención de capital (§15) — absorbida en R1, sin
  fórmula automática.
- La tensión WACC/Cost of Equity (§26) — documentada como tensión
  metodológica, no como candidato ni como regla nueva.

## 36. Qué el Caso 06 NO demostró

El documento deja explícitamente abierto que Bancolombia **no
demostró**:

- que Residual Income sea el método final;
- que FCFE sea el método final;
- que DDM sea el método final;
- que SOTP sea obligatorio;
- que EV sea inútil para toda institución financiera;
- que los depósitos "no sean deuda" bajo toda definición;
- que todo cash bancario esté restringido;
- que toda provisión sea recurrente;
- que CET1 (o cualquier métrica de capital regulatorio) deba convertirse
  directamente en input de valoración;
- que todos los bancos necesiten la misma metodología;
- que lo aprendido aplique a Goldman Sachs;
- que lo aprendido aplique a Munich Re;
- que la observación ISA-F ya sea Candidato F;
- que Bancolombia-G sea candidato transversal;
- que el Candidato E deba dividirse ahora;
- que el Bloque 1B esté cerrado;
- que el Bloque 1C esté cerrado;
- que WACC haya sido reemplazado como concepto;
- que Cost of Equity haya sido aprobado;
- que exista un método final de valoración para Bancolombia.

## 37. Conclusión metodológica propuesta

Con seis casos independientes (Tecnoglass, Terpel, Ecopetrol, Grupo
Éxito, ISA, Bancolombia), el estado de cada regla queda así — evitando
deliberadamente un conteo agregado que pueda ocultar diferencias de
madurez entre reglas (consistente con la corrección aplicada tras el
Caso 04):

- **R1, R2, R4 (base), R7 y R8** reaparecen de forma transversal e
  idéntica: `PATRÓN OBSERVADO EN SEIS CASOS`.
- **R3**: su núcleo conceptual es también `PATRÓN OBSERVADO EN SEIS
  CASOS` (§20), pero el diseño de `assumption_relations` sigue
  insuficientemente validado.
- **R5** sobrevive y se profundiza, sin etiqueta transversal formal no
  definida en §20.
- **R6** sobrevive incompleto; `scope` y `purpose` reciben refuerzo muy
  fuerte sin cambiar de nivel formal.

Ninguna de estas ocho reglas se declara ley universal por haber
reaparecido en seis casos.

**Conclusión propuesta del caso**: Bancolombia demuestra que una
arquitectura profesional de valoración puede conservar principios de
proceso transversales —evidencia, interpretación económica, estado de
conocimiento, normalización trazable, preguntas, supuestos y aprobación
experta— sin imponer una arquitectura financiera universal. En una
institución bancaria, conceptos como deuda, intereses, net debt, NWC,
reinversión, capital, cash disponible, tasa de descuento y flujo
valorado pueden adquirir una función económica distinta y deben
determinarse según el `scope`, el `purpose`, el método y la economía
relevante.

**Esta conclusión no se convierte en regla universal.** Goldman Sachs y
Munich Re todavía deben intentar romperla.

## 38. Estado del caso al final de esta ejecución

**Estado: `ANÁLISIS DOCUMENTADO — PENDIENTE DE REVISIÓN Y CIERRE FORMAL
POR EL FUNDADOR`.**

El Caso 06 **no** queda marcado como cerrado. El Caso 06 **no** queda
marcado como congelado. Esta ejecución no afirma que el fundador haya
aprobado el cierre. El cierre y congelamiento formal serán una ejecución
posterior si Nicolás lo autoriza después de revisar este resultado.

## 39. Prohibición explícita de interpretar el documento como autorización de implementación

**CASO 06 NO AUTORIZA IMPLEMENTACIÓN.** Ni el Caso 01, ni el Caso 02, ni
el Caso 03, ni el Caso 04, ni el Caso 05, ni el Caso 06, ni ninguno de
sus reportes de contraste, ni ninguna actualización del Expediente
basada en ellos, constituyen autorización para implementar ninguna
estructura técnica: clasificación epistémica nueva, campos
reported/normalized/projected nuevos, `account_components` nuevos,
`case_assumptions` ampliados, projection drivers, `assumption_relations`,
`coherence_flags`, `scope`, `purpose`, `case_perimeter`, neteo,
`economic_lifecycle`, `economic_period`, `measurement_basis`,
`availability`, `regulatory_capital`, `capital_bridge`,
`distributable_capital`, `bank_metrics`, `credit_risk`, PD, LGD, EAD, un
motor de ECL, un enum de stages, campos de CET1, campos de RWA, un
campo `cost_of_equity`, `valuation_method`, un motor de Residual Income,
un motor de DDM, un motor de FCFE, un motor de SOTP, un "bank mode", un
enum de institución financiera, `industry_type`, ni ningún schema,
tabla, migración, UI, Edge Function o automatización. Solo
Nicolás/fundador puede autorizar implementación, de forma explícita y
separada, caso por caso.

**Este documento no declara el Caso 06 formalmente cerrado ni
congelado.** El caso queda `ANÁLISIS DOCUMENTADO — PENDIENTE DE REVISIÓN
Y CIERRE FORMAL POR EL FUNDADOR` (§38).
