# Caso Público 05 — Interconexión Eléctrica S.A. E.S.P. (ISA) — V0

**Fecha:** 2026-08-12
**Estado:** análisis manual, versión V0. No es una valoración. No autoriza
implementación de ningún cambio al Expediente. El reporte de contraste
(`REPORTE-CONTRASTE-EXPEDIENTE-V1.md`, esta misma carpeta) tampoco
constituye autorización de implementación; cualquier implementación
requiere autorización explícita y separada del fundador. **Este
documento NO declara el Caso 05 formalmente cerrado ni congelado** — ese
cierre, si corresponde, será una ejecución posterior tras revisión
humana de este commit.

**CASO 05 NO AUTORIZA IMPLEMENTACIÓN.** Ningún hallazgo, hipótesis,
candidato u observación de este documento constituye autorización para
crear tablas, migraciones, schemas, UI, motores, Edge Functions,
automatizaciones ni ningún otro cambio técnico. Solo Nicolás/fundador
puede autorizar implementación, de forma explícita y separada.

---

## 1. Identificación del caso

- **Caso:** Caso Público 05 — Interconexión Eléctrica S.A. E.S.P. (ISA).
- **Posición en la secuencia:** quinto caso de estudio manual, después de
  Caso 01 (Tecnoglass, cerrado y congelado), Caso 02 (Organización
  Terpel, cerrado), Caso 03 (Ecopetrol, cerrado y congelado) y Caso 04
  (Grupo Éxito, formalmente cerrado y congelado).
- **Insumos documentales de continuidad revisados para el contraste de
  este caso:**
  `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`,
  `docs/velarix/casos/01-tecnoglass/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`,
  `docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md`,
  `docs/velarix/casos/02-terpel/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`,
  `docs/velarix/casos/03-ecopetrol/CASO-03-ECOPETROL-V0.md`,
  `docs/velarix/casos/03-ecopetrol/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`,
  `docs/velarix/casos/04-grupo-exito/CASO-04-GRUPO-EXITO-V0.md`,
  `docs/velarix/casos/04-grupo-exito/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`,
  `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`, y las Decisiones 2
  y 4 de `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`
  (estructura de capital y horizonte explícito, ver §19–§20).
- **No se reanaliza ni se recalcula ningún elemento de los Casos 01, 02,
  03 o 04** — se citan únicamente para contraste. Sus documentos no se
  modifican en esta ejecución salvo referencia transversal estrictamente
  necesaria en el Expediente.
- **Nota de perímetro dentro del propio caso**: ISA ya apareció
  mencionada en el Caso 03 (Ecopetrol) como subsidiaria consolidada al
  ≈51,4% de control económico dentro del grupo Ecopetrol
  (`CASO-03-ECOPETROL-V0.md` §13). Este Caso 05 estudia a ISA como
  **entidad propia**, no como parte del análisis de Ecopetrol — no se
  reabre ni se reinterpreta lo documentado en el Caso 03 sobre esa
  relación de control.

## 2. Objetivo del caso

ISA se utilizó como **quinta economía** para intentar **romper** lo
aprendido en los cuatro casos anteriores — **no para confirmar
Velarix**. Un caso puede reforzar, debilitar, refutar, resultar no
material, producir evidencia insuficiente, o revelar problemas nuevos;
este documento registra los cinco resultados posibles con la misma
disciplina, sin sesgar hacia el resultado que "confirme" el sistema.

Principio epistemológico vigente, ahora extendido a cinco casos: **cinco
casos muestran patrones más resistentes; cinco casos no crean leyes
universales.** Donde una conclusión reaparece de forma transversal e
idéntica en los cinco casos, se documenta prudentemente como `PATRÓN
OBSERVADO EN CINCO CASOS` — **nunca** como `CONFIRMADO POR CINCO
CASOS`, y nunca como ley universal.

## 3. Límites del ejercicio

- No se calcula Enterprise Value, Equity Value ni precio por acción.
- No se elige un WACC, un crecimiento terminal (g), ni un horizonte
  explícito numérico definitivo — no se fija todavía una fecha
  profesional de valoración.
- No se completa ningún dato faltante con un valor por defecto, ni con
  una cifra tomada de los casos anteriores, de un comparable, o de
  cualquier fuente externa no entregada para este caso.
- No se trata ningún hallazgo de este caso como regla universal aplicable
  a cualquier empresa o sector.
- No equivale a due diligence, auditoría, ni opinión profesional de
  valor.
- No se acusa a ISA, a su administración ni a ningún tercero de ninguna
  irregularidad fiscal, contable o regulatoria — donde el material de
  trabajo describe un mecanismo (ej. reconocimiento de activos
  contractuales en concesiones brasileñas), este documento lo registra
  como fenómeno a entender, no como juicio de valor.
- ISA es una compañía listada, con obligaciones de reporte regulatorio
  superiores a las de una PYME colombiana típica — este caso no asume
  que una PYME real tendrá información de esta granularidad; ayuda,
  igual que los cuatro casos previos, a entender qué preguntar a una
  empresa que reporte de forma más simple.
- Éxito de este caso **no** significa que los negocios, mecanismos o
  supuestos de ISA apliquen a cualquier otra empresa de energía,
  infraestructura o concesiones, ni que cinco casos sean suficientes
  para declarar cerrada ninguna de las ocho reglas R1–R8.
- No se fuerza ningún hallazgo si la evidencia proporcionada no lo
  sostiene — donde el material de trabajo no permite concluir algo,
  este documento lo deja como `EVIDENCIA INSUFICIENTE` o `PREGUNTA
  ABIERTA` en lugar de completarlo.

## 4. Período analizado

**Período financiero base: FY2025, con cierre al 31 de diciembre de
2025.** Este es el período sobre el que versan los hallazgos
documentados en §8–§18 de este caso, salvo donde se indique
explícitamente lo contrario.

**Información posterior al corte (1T26 y 2T26) se documenta por
separado en §21, claramente etiquetada como `INFORMACIÓN POSTERIOR AL
CORTE`.** No se mezcla con los hallazgos de FY2025, y no reescribe
retroactivamente qué era cierto al 31 de diciembre de 2025.

No se fija todavía una fecha profesional definitiva de valoración. El
caso **no produjo una valoración**: no se calcularon ni aprobaron
Enterprise Value, Equity Value, precio por acción, WACC definitivo, g
definitiva, ni horizonte definitivo.

## 5. Procedencia y naturaleza de la evidencia

**Fuente de trabajo:** síntesis analítica proporcionada a esta ejecución
documental, elaborada previamente — fuera de esta ejecución — a partir
de información pública primaria de ISA, incluyendo principalmente:
estados financieros consolidados FY2025, notas a los estados
financieros, reporte integrado, estructura societaria, documentos
oficiales corporativos, resultados 1T26 y resultados 2T26.

**Esta ejecución documental no realizó verificación independiente
adicional de las fuentes originales** — no se hizo scraping, descarga
automatizada, ni navegación por internet para rehacer la investigación.
Esta ejecución solo inspeccionó documentos ya existentes en el
repositorio (Casos 01–04, sus reportes de contraste, y el Expediente)
para preservar estructura, vocabulario y consistencia documental.

**No se atribuye a Nicolás/fundador la recopilación personal de esta
información.** El flujo real fue: (1) existe una síntesis analítica de
información pública primaria de ISA, elaborada previamente a esta
ejecución; (2) esa síntesis fue entregada a esta ejecución mediante
instrucciones; (3) esta ejecución documental no verificó de forma
independiente las fuentes originales de esa síntesis.

Este caso, a diferencia de Ecopetrol o Grupo Éxito, **no reproduce
cifras financieras específicas de ISA** — el material de trabajo
recibido describió la economía de la empresa en términos conceptuales
(mecanismos, dimensiones, relaciones), sin magnitudes numéricas
concretas. Este documento no completa esa ausencia con cifras
estimadas, inferidas ni de referencia externa — donde falta una cifra,
queda `DESCONOCIDO` de forma explícita.

## 6. Descripción económica resumida de ISA

`HECHO DOCUMENTADO` (según la síntesis analítica recibida por esta
ejecución, sin verificación independiente adicional de las fuentes
originales, a nivel estructural, sin cifras): ISA es un grupo que
combina, al menos:

- Transmisión de energía eléctrica, en múltiples geografías (incluidas,
  al menos, Colombia, Brasil y Perú/Bolivia).
- Concesiones viales.
- Telecomunicaciones / TIC.
- Negocios regulados, con marcos regulatorios distintos por país y por
  negocio.
- Contratos y concesiones de largo plazo, con vidas contractuales
  distintas entre sí.
- Intereses no controladores (NCI) materiales.
- Negocios conjuntos y asociadas.
- Situaciones donde el control societario y el porcentaje de propiedad
  económica no coinciden.
- Grandes activos físicos, activos contractuales, activos financieros e
  intangibles concesionales, coexistiendo dentro de negocios similares.
- CAPEX recurrente y de expansión.
- Monedas funcionales y monedas contractuales potencialmente distintas
  entre sí, con indexaciones y coberturas.
- Deuda en diferentes niveles del grupo.
- Efectivo restringido.
- Arrendamientos (leases) donde ISA actúa tanto como arrendatario como
  arrendador.
- Vidas contractuales finitas conviviendo con un grupo potencialmente
  perpetuo.

**Conclusión metodológica**: igual que ningún caso anterior debía
reducirse a un único driver homogéneo, ISA **no** debe reducirse a un
único mecanismo económico ni a una única representación contable. Una
misma categoría contable o línea de negocio (ej. "transmisión") puede
contener mecanismos económicos materialmente distintos según el país,
el régimen regulatorio y el vehículo contractual — ver §8–§13.

Mapa económico conceptual (específico de ISA, no plantilla universal —
ver §22, R7):

```
Negocios (transmisión, concesiones viales, telecomunicaciones/TIC) ×
Geografías (Colombia, Brasil, Perú/Bolivia, otras) × Régimen regulatorio
        │
        ▼
Vehículo contractual/concesional específico (contrato de concesión,
licencia, activo propio, JV, asociada)
        │
        ├──► Secuencia económica en ciertas concesiones brasileñas:
        │     CAPEX → construcción → reconocimiento de ingreso de
        │     infraestructura → activo contractual → entrada en
        │     operación → remuneración contractual/regulatoria →
        │     recaudo (§9)
        ├──► Concesiones viales: mecanismo de remuneración que puede
        │     incluir tráfico×tarifa, pero también garantías, VPI,
        │     ingresos mínimos, subsidios u otras estructuras
        │     contractuales (§10)
        ├──► Perímetro y atribución: control societario ≠ porcentaje de
        │     propiedad económica; NCI materiales; JVs/asociadas fuera
        │     de consolidación línea por línea (§14)
        ├──► Efectivo restringido: titularidad/control contable ≠
        │     disponibilidad económica automática (§15, observación
        │     ISA-F)
        ├──► Leases: ISA como arrendatario y como arrendador
        │     simultáneamente (§16)
        └──► CAPEX distribuido entre PPE, intangibles, activos
              contractuales, concesiones, refuerzos, mantenimiento y
              aportes a JVs (§18)
        │
        ▼
Vida física del activo ≠ vida contractual ≠ horizonte explícito ≠ vida
de la empresa ≠ perpetuidad (§20)
```

## 7. Evidencia material analizada

Este caso documenta prudentemente, sin verificación independiente
adicional, los siguientes hallazgos conceptuales (detalle en §8–§20):

- **A. Transmisión multi-geografía** — Colombia, Brasil y Perú/Bolivia
  no comparten necesariamente el mismo mecanismo económico ni la misma
  representación contable (§8).
- **B. Secuencia CAPEX → activo contractual (concesiones brasileñas)** —
  una cadena económica distinta de la vista en casos anteriores (§9).
- **C. Concesiones viales — driver no reducible a tráfico×tarifa** —
  garantías, VPI, ingresos mínimos, subsidios y otras estructuras
  contractuales pueden intervenir (§10).
- **D. Dimensiones económicas potencialmente relevantes** — negocio,
  país, régimen regulatorio, contrato y proyecto pueden ser dimensiones
  materialmente distintas (§11).
- **E. Granularidad económicamente correcta** — depende de
  comportamiento económico, materialidad y propósito, no de la máxima
  desagregación disponible (§12).
- **F. Vida física, contractual, horizonte, empresa y perpetuidad** —
  no son necesariamente equivalentes entre sí (§13, §20).
- **G. Perímetro y atribución** — control ≠ porcentaje de propiedad
  económica; NCI y JVs/asociadas materiales (§14).
- **H. Efectivo restringido** — observación ISA-F, no candidato formal
  (§15).
- **I. Leases** — ISA como arrendatario y arrendador simultáneamente
  (§16).
- **J. Supplier financing** — evidencia insuficiente en este caso (§17).
- **K. CAPEX** — la clasificación contable del desembolso no determina
  por sí sola si existe inversión económica (§18).
- **L. Estructura de capital y horizonte** — profundización conceptual
  de las Decisiones 2 y 4 del Bloque 1B, sin cambiarlas (§19, §20).

Ninguno de estos hallazgos produce, por sí mismo, una cifra de valor —
son evidencia para tensionar el Expediente (§22, §23, §24), no insumos
de cálculo.

## 8. A. Transmisión multi-geografía

`HECHO DOCUMENTADO` (según la síntesis recibida, a nivel conceptual, sin
verificación independiente adicional, sin cifras): ISA opera negocios de
transmisión de energía en más de una geografía, al menos Colombia,
Brasil y Perú/Bolivia.

**Regla explícita de este caso**: transmisión en Colombia, Brasil y
Perú/Bolivia no necesariamente poseen el mismo mecanismo económico ni la
misma representación contable. El régimen regulatorio, el mecanismo de
remuneración, y el tratamiento contable del activo subyacente (PPE,
intangible, activo contractual, activo financiero) pueden diferir por
país, aun cuando la actividad física ("transmitir energía eléctrica")
sea conceptualmente similar.

Esto refuerza directamente R1 (contabilidad ≠ economía) y R4
(descomposición según dimensión económica relevante): la dimensión
"país" y la dimensión "régimen regulatorio" pueden ser tan relevantes
como la dimensión "negocio" para entender el comportamiento económico
de "transmisión" dentro de ISA.

`DESCONOCIDO` en este documento: el desglose cuantitativo de ingresos,
activos o márgenes por geografía dentro de transmisión — el material de
trabajo no lo desagrega en cifras, y este documento no lo estima.

**Preguntas a gerencia**: ver §26.

## 9. B. Secuencia CAPEX → activo contractual (concesiones brasileñas)

`HECHO DOCUMENTADO` (según la síntesis recibida, a nivel conceptual, sin
verificación independiente adicional): en determinadas concesiones
brasileñas puede existir una secuencia económica semejante a:

```
CAPEX
  → construcción
  → reconocimiento de ingreso de infraestructura
  → activo contractual
  → entrada en operación
  → remuneración contractual/regulatoria
  → recaudo
```

**Hallazgo conceptual, sin precedente exacto en los cuatro casos
previos**: en este mecanismo, la construcción de infraestructura de
transmisión puede generar, contablemente, un reconocimiento de ingreso y
un activo contractual **antes** de que exista recaudo — el ingreso
contable reconocido durante la fase de construcción no es
necesariamente caja recibida, ni necesariamente el mismo mecanismo
económico que la remuneración posterior por operar el activo.

Esto es una instancia directa de R1 (contabilidad ≠ economía) y de R2
(observado ≠ normalizado ≠ proyectado), con un mecanismo — reconocimiento
de ingreso de infraestructura vía activo contractual — distinto de los
vistos en Tecnoglass, Terpel, Ecopetrol o Grupo Éxito.

`REGLA EXPLÍCITA DE ESTE CASO`: una cifra reportada en esta secuencia
puede ser correcta y, aun así, no ser apropiado proyectarla
mecánicamente — el ingreso de construcción, el activo contractual y la
remuneración contractual/regulatoria posterior responden a mecanismos y
momentos económicos distintos, aunque todos aparezcan bajo el mismo
proyecto concesional.

`DESCONOCIDO`: el detalle cuantitativo de esta secuencia para proyectos
específicos de ISA — el material de trabajo no lo desagrega, y este
documento no lo estima.

**Preguntas a gerencia**: ver §26.

## 10. C. Concesiones viales — el driver no se reduce a tráfico×tarifa

`HECHO DOCUMENTADO` (según la síntesis recibida, a nivel conceptual, sin
verificación independiente adicional): en concesiones viales, `tráfico ×
tarifa` **no** constituye necesariamente el driver económico universal,
porque pueden existir garantías, mecanismos contractuales, VPI (valor
presente de ingresos, según corresponda al contrato), ingresos mínimos
garantizados, subsidios, u otras estructuras contractuales que
modifican la relación entre tráfico observado y remuneración percibida.

**Conclusión metodológica**: no modelar ingresos de concesión vial
únicamente como `tráfico × tarifa`. El driver relevante depende del
diseño contractual específico de cada concesión — un supuesto de
"tráfico × tarifa" que ignore una garantía de ingreso mínimo o un
mecanismo de VPI puede subestimar o sobrestimar materialmente el
ingreso económico real.

Esto refuerza R7 (drivers específicos por empresa): no existe un driver
universal ni siquiera dentro de una misma categoría de negocio
("concesión vial") — el contrato específico determina el mecanismo.

**Preguntas a gerencia**: ver §26.

## 11. D. Dimensiones económicas potencialmente relevantes

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida):
negocio, país, régimen regulatorio, contrato y proyecto pueden ser
dimensiones materialmente diferentes entre sí dentro de ISA — una
partida material puede necesitar entenderse simultáneamente por más de
una de estas dimensiones para explicar su comportamiento económico.

**Regla explícita, consistente con R4**: esto no crea una lista cerrada
ni obligatoria de dimensiones — las cinco mencionadas (negocio, país,
régimen, contrato, proyecto) son ejemplos observados en ISA, no un enum
universal. Otros casos han mostrado otras dimensiones (contable,
producto, canal — Tecnoglass/Terpel; movimientos/cifras netas —
Ecopetrol). Ver R4 consolidado en §22.

**Preguntas a gerencia**: ver §26.

## 12. E. Granularidad económicamente correcta

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida): la
granularidad económicamente correcta para analizar una partida o
variable de ISA depende de: comportamiento económico, materialidad, y
propósito del análisis — no de la máxima desagregación técnicamente
disponible.

**Cautela reforzada, ya introducida por Grupo Éxito (Caso 04)**: "más
granularidad no es automáticamente mejor análisis." ISA aporta una
formulación adicional, sin convertirla en estructura: *"la
descomposición debería detenerse cuando una granularidad adicional deja
de modificar materialmente la interpretación económica necesaria para
el propósito del análisis."* Esto es una guía conceptual, no un umbral
numérico ni un campo a implementar.

**Preguntas a gerencia**: ver §26.

## 13. F. Vida física, contractual, horizonte, empresa y perpetuidad

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida):
vida física de un activo, vida contractual de una concesión, horizonte
explícito de una valoración, vida de la empresa, y perpetuidad **no son
necesariamente equivalentes entre sí**.

**Hallazgo conceptual**: un activo físico puede tener una vida útil
distinta de la vida del contrato de concesión que lo remunera; ese
contrato puede vencer, revertirse, indemnizarse o renovarse según sus
términos; y la empresa que posee el activo puede continuar operando —
mediante reinversión, nuevos proyectos o nuevas concesiones — más allá
del vencimiento de cualquier contrato individual.

Esto se desarrolla junto con el Candidato B (ciclo de vida económico,
§23) y con la profundización de la Decisión 4 (horizonte explícito,
§20) — sin resolver aquí ninguna de las dos preguntas.

**Preguntas a gerencia**: ver §26.

## 14. G. Perímetro y atribución

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida, sin
cifras): ISA consolida entidades donde el control societario no
necesariamente coincide con el porcentaje de propiedad económica.
Existen intereses no controladores (NCI) materiales, y negocios
conjuntos/asociadas que no consolidan línea por línea.

**Regla explícita, coherente con Ecopetrol/ISA-como-subsidiaria (Caso
03, §13) y con Grupo Éxito (Caso 04, §8)**: esto es la **quinta**
instancia, y la más directa hasta ahora, de que perímetro consolidado ≠
participación económica ≠ atribución final al accionista. A diferencia
de Ecopetrol (una subsidiaria, ISA, con NCI material) y de Grupo Éxito
(estructuras "Viva" con NCI muy altos), en ISA el fenómeno se observa
**dentro de la propia entidad que se está estudiando como caso**, con
múltiples negocios y geografías simultáneamente.

`INFERENCIA`: la combinación de NCI materiales, JVs/asociadas, y
múltiples geografías sugiere que la atribución económica final al
accionista de ISA requiere, en principio, entender el perímetro y la
atribución negocio por negocio y país por país — pero esto **no implica
la obligación de modelar entidad por entidad** (ver cautela en §23).

**No se diseña `case_perimeter` en este documento.** Ver comparabilidad/
perímetro (§23).

**Preguntas a gerencia**: ver §26.

## 15. H. Efectivo restringido — observación ISA-F

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida, sin
cifras): ISA mostró evidencia fuerte de efectivo restringido.

**Formulación provisional (no es un candidato formal — ver §23)**:
*"el reconocimiento, titularidad o control de un recurso no implica
necesariamente que esté económicamente disponible para cualquier
propósito."*

**Consecuencia metodológica**: cash contable ≠ automáticamente cash
disponible para net debt o para distribución a accionistas.

**Distinción importante, que este documento no resuelve**: no debe
confundirse una restricción contractual de uso de efectivo (ej. cuenta
reservada por un contrato de deuda o de concesión) con una restricción
societaria derivada de subsidiarias con NCI (ej. caja que, aunque
disponible contractualmente, pertenece parcialmente a terceros). Una
aparente contradicción entre ambas puede desaparecer al comprender
mejor el `scope` y el significado específico de la restricción.

**Estado: `EVIDENCIA FUERTE EN ISA — VALIDAR ANTES DE ELEVAR A
CANDIDATO TRANSVERSAL`.** **No se crea un Candidato F formal. No se crea
`availability`, enum, campo, schema, ni automatización.**

**Preguntas a gerencia**: ver §26.

## 16. I. Leases

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida, sin
cifras): ISA refuerza el problema de leases mediante roles múltiples:
arrendatario (activo por derecho de uso, pasivo por lease) y arrendador,
con arrendamientos que pueden ser financieros u operativos según el
contrato.

**Regla explícita, coherente con Grupo Éxito (Caso 04, §11)**: **no
concluir universalmente que `lease = deuda`, ni que `lease =
operación`.** ISA es la segunda instancia, después de Grupo Éxito, de un
mismo grupo actuando simultáneamente como arrendatario y arrendador —
ver estado consolidado en §25.

**Preguntas a gerencia**: ver §26.

## 17. J. Supplier financing

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida): el
material de trabajo de este caso **no aportó evidencia suficiente**
sobre mecanismos de supplier financing específicos de ISA comparables a
los observados en Tecnoglass, Terpel o Grupo Éxito.

**Regla explícita**: este caso **no** se cuenta como una cuarta
instancia de la evidencia transversal de supplier financing. La
evidencia transversal continúa apoyada principalmente en Tecnoglass,
Terpel y Grupo Éxito — ver estado consolidado en §24.

**Preguntas a gerencia**: ver §26.

## 18. K. CAPEX

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida, sin
cifras): en ISA, la actividad económicamente asociada a inversión puede
interactuar con PPE, intangibles, activos contractuales, concesiones,
construcción, refuerzos, mejoras, mantenimiento, y aportes a negocios
conjuntos — no solo con una única categoría de "CAPEX".

**Cautela conceptual nueva, aportada por ISA**: *"la clasificación
contable del desembolso en el estado de flujos de efectivo no determina
por sí sola si existe inversión económica."* Un desembolso puede
clasificarse contablemente de una forma (ej. aporte a un negocio
conjunto, en vez de CAPEX de PP&E) y, aun así, ser económicamente una
inversión de expansión o de mantenimiento de capacidad — o viceversa.

**Conclusión metodológica (coincide con Tecnoglass §7, Terpel §8,
Ecopetrol §10 y Grupo Éxito §14)**: `CAPEX = % de ingresos` **no** es
metodología defendible para ISA — quinto caso independiente con el
mismo patrón, evidencia distinta. **No se crea todavía una nueva
taxonomía de CAPEX** — ver guardrails consolidados en §26.

**Preguntas a gerencia**: ver §29.

## 19. L. Estructura de capital (profundización de la Decisión 2)

La Decisión 2 del Bloque 1B (`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`
§"Decisión 2 — Estructura de capital observada vs. objetivo") establece
que el producto estándar usa siempre la estructura de capital observada
de la empresa, y que cualquier override futuro requiere justificación,
trazabilidad y revisión profesional. **Esta decisión no cambia en este
documento.**

**Cautela conceptual añadida por ISA**: antes de utilizar una estructura
de capital observada puede importar determinar a qué `scope` pertenece
esa estructura — la estructura de capital observada al nivel del grupo
consolidado de ISA puede no ser representativa de la estructura de
capital de un proyecto o concesión específica, financiada con deuda de
proyecto (project finance) propia.

**Pero no hay evidencia en este caso para concluir universalmente que
cada proyecto necesita su propio WACC** — eso sería una generalización
no sustentada por este documento. La Decisión 2 se mantiene tal como
está; **no se calcula WACC en este documento.**

**Preguntas a gerencia**: ver §26.

## 20. Horizonte explícito y estado estable (profundización de la Decisión 4)

La Decisión 4 del Bloque 1B (`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`
§"Decisión 4 — Horizonte explícito del DCF") establece que Velarix
mantiene, por ahora, un horizonte explícito fijo de 5 años en ambos
motores, sin que eso signifique valorar la empresa solo 5 años — el
valor terminal representa la perpetuidad después del período explícito.
**Esta decisión no cambia en este documento.**

**Cautela conceptual reforzada por ISA**: vida física del activo ≠ vida
contractual ≠ horizonte explícito ≠ vida de la empresa ≠ perpetuidad
(§13). ISA refuerza que el horizonte fijo de 5 años no debe asumirse
como arquitectura universal futura — la Decisión 4 ya lo advertía
("cuando una empresa no se estabilice dentro de 5 años, el sistema
deberá advertir que el horizonte puede ser insuficiente"), y ISA aporta
un ejemplo concreto de por qué: un portafolio de activos/concesiones
finitos, dentro de una empresa que puede seguir reinvirtiendo y
obteniendo nuevos proyectos, no encaja naturalmente en la idea de
"5 años y luego estado estable".

**Pregunta abierta relevante, no resuelta aquí**: ¿qué significa
"estado estable" para una compañía cuyo portafolio contiene activos
finitos (concesiones con vencimiento) pero cuya capacidad de
reinversión y obtención de nuevos proyectos puede continuar
indefinidamente?

**No se resuelve esta pregunta en este documento. No se aprueba
horizonte. No se aprueba g. No se diseña un valor terminal nuevo.**

**Preguntas a gerencia**: ver §26.

## 21. Información posterior al corte — 2026

**Esta información NO pertenece a FY2025** y no se mezcla con los
hallazgos de §8–§20.

`INFORMACIÓN POSTERIOR AL CORTE — 1T26 y 2T26`: el material de trabajo
de este caso hace referencia a resultados de 1T26 y 2T26 de ISA como
parte de la síntesis recibida, sin que este documento reproduzca cifras
específicas de esos periodos (`DESCONOCIDO` el detalle cuantitativo,
consistente con la ausencia general de cifras en este caso, ver §5).

**Regla explícita, que no admite excepción**: esta información **no
cambia el período base FY2025**. Este documento **no reescribe
retroactivamente** ningún hecho, cifra o clasificación que fuera
verdadera al 31 de diciembre de 2025.

## 22. Contraste formal R1–R8 (resultado del Caso 05)

Regla rectora, igual que en los contrastes de los Casos 02–04: `PATRÓN
OBSERVADO EN CINCO CASOS` se usa **solo** donde la evidencia de
Tecnoglass, Terpel, Ecopetrol, Grupo Éxito e ISA es realmente
transversal — nunca como sinónimo de regla universal, nunca como
`CONFIRMADO POR CINCO CASOS`, y nunca por aplicación automática.

- **R1 — Contabilidad ≠ economía.** `PATRÓN OBSERVADO EN CINCO CASOS.`
  Se mantiene la formulación conceptual: *"la representación contable no
  determina por sí sola la interpretación económica."* ISA refuerza que
  activos físicamente similares (ej. infraestructura de transmisión)
  pueden representarse como PPE, intangible, activo contractual, o
  activo financiero, dependiendo de la naturaleza económica/contractual
  específica (§8, §9). **Cautela explícita, mantenida desde el Caso
  04**: esto **no** debe interpretarse como que la contabilidad es
  información inferior — sigue siendo evidencia fundamental.
- **R2 — Observado ≠ normalizado ≠ proyectado.** `PATRÓN OBSERVADO EN
  CINCO CASOS.` ISA refuerza especialmente el problema mediante ingresos
  de construcción y activos contractuales (§9): una cifra reportada
  puede ser correcta y, aun así, no ser apropiado proyectarla
  mecánicamente. **No sobrescribir lo reportado.**
- **R3 — Los supuestos están relacionados.** `PATRÓN OBSERVADO EN CINCO
  CASOS + DISEÑO INSUFICIENTEMENTE VALIDADO.` ISA refuerza que existen
  relaciones materiales entre supuestos, pero muestra además que pueden
  ser temporales, condicionales, regulatorias, reestimables, afectadas
  por variables externas, y no necesariamente simples ni
  unidireccionales (ej. la secuencia CAPEX→activo contractual→
  remuneración de §9 depende de decisiones regulatorias que pueden
  cambiar). **Cautela explícita**: no convertir `assumption_relations`
  en un grafo causal ingenuo tipo A → B. **No se rediseña
  `assumption_relations` en este documento. No se implementa.**
- **R4 — Descomposición según la dimensión económica relevante.**
  Formulación vigente, sin cambios: *"una partida o variable material
  puede necesitar descomposición según la dimensión que explique su
  comportamiento económico."* `PATRÓN OBSERVADO EN CINCO CASOS.` ISA
  refuerza que pueden importar dimensiones como negocio, geografía,
  regulación, contrato, concesión, proyecto, u otra dimensión
  económicamente relevante (§11). Se mantiene: *"MÁS GRANULARIDAD NO ES
  AUTOMÁTICAMENTE MEJOR ANÁLISIS."* Se añade conceptualmente, sin
  convertir en estructura: *"la descomposición debería detenerse cuando
  una granularidad adicional deja de modificar materialmente la
  interpretación económica necesaria para el propósito del análisis"*
  (§12). **No se crea enum universal. No se hace obligatorio
  `account_components`.**
- **R5 — Estado de conocimiento explícito.** `SOBREVIVE — SE
  PROFUNDIZA.` Se mantienen `DESCONOCIDO`, `PREGUNTA_A_GERENCIA`, y el
  matiz "conozco la cifra, pero todavía no sé cómo interpretarla
  económicamente" (introducido en el Caso 03). ISA aporta ejemplos
  especialmente claros mediante deuda en distintos niveles, leases,
  activos contractuales, efectivo restringido, y estructuras
  societarias (§14, §15, §16). **No se crea un nuevo enum
  epistemológico en este documento.**
- **R6 — Método de determinación (scope / purpose).** `SOBREVIVE —
  INCOMPLETO.` `scope`: `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR
  MÚLTIPLES CASOS`. ISA refuerza que puede importar distinguir entre
  grupo consolidado, holding, filial, concesión, proyecto, activo, y
  atribución al accionista (§14, §19) — pero **problema de `scope` ≠
  obligación de modelar siempre todos esos niveles**. `purpose`: pasa a
  `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS, AÚN
  MENOS MADURA QUE SCOPE`. ISA aportó ejemplos de información válida
  para un propósito que no debe reutilizarse automáticamente para otro:
  WACC/tasas regulatorias, tasas usadas en mediciones contables,
  información segmentada usada por administración, métricas
  contractuales, y otras determinaciones hechas con una finalidad
  distinta a una valoración profesional de equity (§19). **Importante**:
  la necesidad conceptual de comprender `purpose` **no** equivale a la
  necesidad de crear un campo `purpose` — puede resolverse eventualmente
  mediante contexto, procedencia, narrativa, método de determinación, u
  otra representación. **No se fusionan `scope` y `purpose`. No se
  implementa ninguno.**
- **R7 — Drivers específicos por empresa.** `PATRÓN OBSERVADO EN CINCO
  CASOS.` ISA refuerza que no existe un set universal cerrado de
  drivers — pueden importar, dependiendo del negocio, RAP (remuneración
  de activos de transmisión), inflación, fecha de entrada en operación,
  tráfico, tarifas, garantías, condiciones de concesión, capacidad,
  utilización, contratos, u otros (§8, §10). Se mantiene: *"driver
  específico ≠ máxima granularidad disponible."*
- **R8 — Detectar incoherencias sin decidir.** `PATRÓN OBSERVADO EN
  CINCO CASOS.` ISA refuerza muy fuertemente que Velarix puede detectar:
  NCI, JVs, monedas distintas, leases, restricciones de caja, tasas
  regulatorias, diferencias entre control y propiedad, diferencias de
  bases de medición, y aparentes contradicciones. Pero **no decide
  automáticamente su tratamiento profesional**. Se añade
  conceptualmente: *"detectar una aparente contradicción ≠ demostrar que
  existe una contradicción"* — antes de concluir que hay una
  incoherencia real, puede ser necesario comprender `scope`,
  definición, procedencia, y `purpose` (§15 muestra un ejemplo directo:
  la aparente contradicción entre dos tipos de restricción de efectivo
  puede desaparecer al entender mejor cada una).

## 23. Comparabilidad / perímetro

**Estado anterior** (Caso 04, §21 de `CASO-04-GRUPO-EXITO-V0.md`):

`PROBLEMA DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA TODAVÍA
INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN GENERAL.`

**Después de ISA**:

`PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA
SUFICIENTE PARA EXIGIR TRATAMIENTO METODOLÓGICO, TODAVÍA INSUFICIENTE
PARA DISEÑAR UNA REPRESENTACIÓN GENERAL.`

**Razón del cambio de estado**: ISA aporta, simultáneamente, dentro de
una sola entidad: consolidación sin 100% económico, NCI material,
interés económico sin consolidación línea por línea, negocios
conjuntos/asociadas, y diferencias entre control y porcentaje
económico (§14). Esto es evidencia más concentrada y multifacética que
la de Ecopetrol (una subsidiaria con NCI) o Grupo Éxito (estructuras
"Viva" y JVs) por separado — el problema deja de poder tratarse como
ocasional y pasa a exigir tratamiento metodológico explícito, aunque
**todavía no exista evidencia suficiente para diseñar una
representación general**.

**Cautela obligatoria**: problema de perímetro demostrado ≠ obligación
de modelar entidad por entidad. **No se crea `case_perimeter`, tabla,
schema, campos, ni un motor automático de NCI/JV.**

## 24. Candidatos A–E y observación ISA-F

Registrados como **candidatos**, explícitamente **no** como principios
universales ni como R9/R10/R11 — ninguna regla nueva se numera junto a
R1–R8 en este documento.

### Candidato A — Neteo (heredado de Ecopetrol, Caso 03)

*"El neteo puede destruir información económica relevante."*

**Resultado ISA**: `EVIDENCIA INSUFICIENTE`. El material de trabajo de
este caso no aportó un ejemplo directo y material de una cifra neta que
ocultara movimientos brutos de naturaleza opuesta, comparable al
impairment neto ≈0 de Ecopetrol. **ISA no se usa como nueva
confirmación independiente.**

**Estado: se mantiene sin cambio: `EVIDENCIA FUERTE EN ECOPETROL —
VALIDAR EN CASOS FUTUROS`.** **No se eleva.** No se modifica
arquitectura.

### Candidato B — Ciclo de vida económico (heredado de Ecopetrol, Caso 03; reforzado por Grupo Éxito, Caso 04)

*"Algunas variables, activos o unidades económicas tienen un ciclo de
vida económico que importa para la valoración."*

Ecopetrol mostró: inversión → operación → mantenimiento/reposición →
agotamiento → abandono. Grupo Éxito mostró: apertura → operación →
remodelación/conversión → posible cierre. ISA añade un tercer ciclo, de
naturaleza distinta a ambos: adjudicación → construcción → entrada en
operación → explotación/O&M → refuerzos/reposición → vencimiento
contractual → reversión / indemnización / renovación según contrato
(§9, §13).

**Estado: `PATRÓN OBSERVADO EN TRES CASOS DE NATURALEZA ECONÓMICA MUY
DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA`.** Tres economías distintas
(activos de E&P con agotamiento geológico; tiendas físicas con ciclo
comercial; activos/concesiones con vencimiento contractual y posible
reversión) siguen sin ser suficientes para cerrar una formulación
general, pero refuerzan que el patrón podría ser más amplio que
fenómenos sectoriales aislados.

**Cautela nueva, aportada por ISA**: *"el ciclo de vida debe evaluarse
respecto de la unidad económica pertinente; el ciclo de un activo,
proyecto o contrato no determina automáticamente el ciclo de vida de la
compañía que lo posee"* (ver §13, §20). **No se convierte en R9. No se
crea `economic_lifecycle`.**

### Candidato C — Atribución temporal / corte de conocimiento (heredado de Ecopetrol, Caso 03; reforzado por Grupo Éxito, Caso 04)

ISA refuerza que construcción, reconocimiento, puesta en servicio,
remuneración, revisión regulatoria, recaudo, y vencimiento contractual
pueden ocurrir en momentos distintos (§9, §20) — consistente con el
mismo tipo de desacople temporal ya documentado en Ecopetrol (FEPC) y
Grupo Éxito (cambio de perímetro de Argentina).

**Estado: se mantiene sin cambio: `PROBLEMA METODOLÓGICO RESPALDADO POR
MÚLTIPLES CASOS — REQUIERE DEFINIR PRINCIPIOS ANTES DE DISEÑAR
REPRESENTACIÓN`.** **No se crea `economic_period`, campos, ni schema.**

### Candidato D — Derechos económicos / propiedad dinámica (nuevo en Grupo Éxito, Caso 04)

*"La atribución económica puede depender no solo de la propiedad
actual, sino también de derechos u obligaciones contractuales capaces
de modificarla."*

Grupo Éxito aportó evidencia fuerte mediante una opción de venta (put)
sobre NCI de Grupo Disco Uruguay. ISA aporta evidencia fuerte de
**control ≠ porcentaje económico** (§14), que es parte del problema más
amplio de atribución económica, pero **no** aporta evidencia
equivalente sobre la parte específicamente **dinámica/contractual**
del candidato (una opción u obligación capaz de modificar la
atribución en el futuro).

**Estado: se mantiene sin cambio: `EVIDENCIA FUERTE EN GRUPO ÉXITO —
VALIDAR EN CASOS FUTUROS`.** **No se eleva.** ISA se registra
únicamente como evidencia adicional del problema más amplio de
atribución económica y de la diferencia entre control y propiedad — no
como nueva confirmación de la parte dinámica del Candidato D. **No se
convierte en regla nueva. No se crea tabla. No se crea entidad. No se
crea un "options engine".**

### Candidato E — Base de medición / régimen monetario (nuevo en Grupo Éxito, Caso 04)

*"Antes de comparar, normalizar o proyectar una cifra, puede ser
necesario conocer la base de medición y el régimen monetario bajo el
cual fue construida."*

Grupo Éxito aportó hiperinflación, NIC 29, moneda funcional,
reexpresión y conversión. ISA añade evidencia independiente mediante
moneda funcional, moneda de presentación, moneda contractual,
indexación, coberturas, medición a valor nominal vs. costo amortizado,
mediciones contractuales, y distintas referencias e índices (§6).

**Estado: `PATRÓN OBSERVADO EN DOS CASOS DE NATURALEZA ECONÓMICA
DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA`.**

**Cautela nueva, aportada por ISA**: *"el Candidato E puede estar
agrupando fenómenos económicamente relacionados pero metodológicamente
diferentes"* — hiperinflación/NIC 29 (Grupo Éxito) e
indexación/cobertura contractual (ISA) comparten la idea general de
"base de medición", pero pueden requerir tratamientos metodológicos
distintos entre sí; este documento no los funde en un único mecanismo.
**No se convierte en R10. No se crea `measurement_basis`, enum
monetario, campos, ni schema.**

### Observación ISA-F — Disponibilidad / restricción económica de recursos (NO es un candidato formal)

Ver desarrollo completo en §15. Formulación provisional: *"el
reconocimiento, titularidad o control de un recurso no implica
necesariamente que esté económicamente disponible para cualquier
propósito."* Evidencia: efectivo restringido en ISA. Consecuencia: cash
contable ≠ automáticamente cash disponible para net debt o
distribución.

**Estado: `EVIDENCIA FUERTE EN ISA — VALIDAR ANTES DE ELEVAR A
CANDIDATO TRANSVERSAL`.** **Explícitamente no es todavía un Candidato F
formal** — requiere ver si reaparece en un caso futuro antes de
registrarse como tal. **No se crea `availability`, enum, campo, schema,
ni automatización.**

### Posible regla "inversión ≠ ingreso ≠ caja" — NO se crea como candidato nuevo

Aunque ISA demuestra claramente este fenómeno (§9, §18), se explica
adecuadamente mediante R1, R2, R3, R4, R7 y el Candidato C ya
existentes — no se crea un candidato adicional para evitar
proliferación innecesaria de reglas.

## 25. Supplier financing (estado consolidado)

**Estado después del Caso 05**: se mantiene sin cambio: `PROBLEMA
FUERTEMENTE REFORZADO — CRITERIOS DE RECLASIFICACIÓN TODAVÍA ABIERTOS.`

ISA no aportó evidencia suficiente sobre este mecanismo (§17) — **no se
cuenta como cuarta instancia**. La evidencia transversal continúa
apoyada principalmente en Tecnoglass, Terpel y Grupo Éxito. **No
automatizar. No asumir que banco = deuda. No asumir que presentación
comercial = NWC operativo.**

## 26. Leases (estado consolidado)

**Estado**: se mantiene sin cambio: `PROBLEMA DEMOSTRADO — TRATAMIENTO
DE VALORACIÓN NO GENERALIZADO.`

ISA refuerza el problema mediante roles múltiples (arrendatario,
arrendador, arrendamiento financiero, arrendamiento operativo, §16) —
segunda instancia, después de Grupo Éxito, de un mismo grupo con doble
rol. **No concluir `lease = deuda` ni `lease = operación`.**

## 27. CAPEX (guardrails)

Se mantienen, reforzados por quinta vez: **no** usar `CAPEX = % de
ingresos` como metodología universal; **no** imponer universalmente la
clasificación binaria `maintenance CAPEX / growth CAPEX`. Se añade la
cautela de ISA (§18): *"la clasificación contable del desembolso en el
estado de flujos de efectivo no determina por sí sola si existe
inversión económica."* **No se crea todavía una nueva taxonomía de
CAPEX.**

## 28. Horizonte / estado estable y estructura de capital (estado consolidado)

**Decisión 4 (horizonte explícito del DCF)**: no cambia — se mantiene el
horizonte fijo de 5 años como estado actual del producto (`Decisión 4`,
Bloque 1B). ISA refuerza que este horizonte fijo no debe asumirse como
arquitectura universal futura, y deja registrada la pregunta abierta
sobre qué significa "estado estable" para una compañía con activos
finitos pero capacidad de reinversión potencialmente continua (§20).
**No se aprueba horizonte. No se aprueba g. No se diseña terminal value
nuevo.**

**Decisión 2 (estructura de capital observada)**: no cambia — el
estándar sigue usando la estructura de capital observada; cualquier
override requiere justificación, trazabilidad y revisión profesional
(`Decisión 2`, Bloque 1B). ISA añade la cautela conceptual de que,
antes de usar una estructura observada, puede importar determinar a qué
`scope` pertenece (§19) — sin que exista evidencia para concluir
universalmente que cada proyecto necesita su propio WACC. **No se
calcula WACC.**

## 29. Normalizaciones

Se mantiene sin cambios la regla vigente desde el Caso 01: partida
reportada → posible ajuste → motivo → evidencia → recurrente/no
recurrente → importe propuesto → responsable → aprobación → importe
normalizado — **nunca sobrescribir lo reportado**. **ISA no autoriza
ninguna normalización automática.**

## 30. assumption_relations

ISA refuerza que el problema existe (§22, R3), y aporta evidencia de que
una relación entre supuestos puede ser temporal, condicional,
regulatoria, reestimable, y afectada por variables externas — no solo
una cadena más larga o con causalidad inversa (ya visto en Grupo
Éxito). **Estado: `PATRÓN OBSERVADO EN CINCO CASOS + DISEÑO TODAVÍA
INSUFICIENTEMENTE VALIDADO`.** **Cautela explícita**: no convertir
`assumption_relations` en un grafo causal ingenuo A → B. **No se
rediseña. No se implementa.**

## 31. Implicaciones para 1B / 1C

`ISA NO cierra el Bloque 1B. ISA NO cierra el Bloque 1C.`

**Para 1B**, ISA hace más concretos temas metodológicos ya pendientes,
sin resolverlos: perímetro y atribución económica (§14, §23); `scope`
(§19, §22 R6); `purpose` (§19, §22 R6); CAPEX (§18, §27); efectivo
restringido/disponibilidad (§15, §24); horizonte y estado estable (§20,
§28); bases de medición (§24, Candidato E); e interacción entre
activos/proyectos finitos y una empresa potencialmente perpetua (§13,
§20).

**Para 1C**, ISA muestra temas que eventualmente requerirán validación
financiera externa cuando corresponda: deuda relevante para valoración
en distintos niveles del grupo; efectivo restringido; NCI; JVs/asociadas;
leases; estructura de capital (Decisión 2) frente a posibles `scopes`
particulares; WACC consolidado vs. WACC de proyecto; concesiones;
horizonte; estado estable; y valor terminal.

**Ninguno de estos temas se cierra autónomamente en este documento.**

## 32. Preguntas a gerencia (representativas, no exhaustivas)

**Transmisión multi-geografía**

1. ¿Cómo difiere el mecanismo de remuneración de transmisión entre
   Colombia, Brasil y Perú/Bolivia?
2. ¿Qué activos de transmisión se registran como PPE, cuáles como
   intangible, y cuáles como activo contractual o financiero, y por qué?

**Concesiones brasileñas / activo contractual**

3. ¿Cuál es el mecanismo exacto de reconocimiento de ingreso de
   infraestructura durante la fase de construcción?
4. ¿Cómo se determina la remuneración contractual/regulatoria posterior
   a la entrada en operación?
5. ¿Qué tan predecible es el recaudo respecto de la remuneración
   reconocida?

**Concesiones viales**

6. ¿Qué mecanismos de garantía, VPI, ingreso mínimo o subsidio existen
   en las concesiones viales de ISA?
7. ¿Cómo cambia el driver económico entre concesiones con y sin estos
   mecanismos?

**Perímetro y atribución**

8. ¿Cuál es el detalle de participación económica vs. control societario
   por negocio y país?
9. ¿Qué JVs/asociadas son más materiales para el grupo?
10. ¿Existen restricciones sobre distribución de caja desde entidades
    con NCI material?

**Efectivo restringido**

11. ¿Qué proporción del efectivo reportado está restringido, y bajo qué
    mecanismo (contractual vs. societario)?
12. ¿Cómo gestiona ISA la disponibilidad de caja entre negocios y
    geografías?

**Leases**

13. ¿Qué proporción de los contratos de arrendamiento de ISA son
    financieros vs. operativos, como arrendatario y como arrendador?

**CAPEX**

14. ¿Cómo distingue management el CAPEX de mantenimiento, expansión,
    refuerzos y aportes a JVs?
15. ¿Qué retorno exige management a cada tipo de inversión?

**Estructura de capital y horizonte**

16. ¿Existen estructuras de financiamiento de proyecto (project finance)
    materialmente distintas de la estructura de capital consolidada?
17. ¿Cómo planea management el pipeline de nuevos proyectos/concesiones
    más allá del vencimiento de los contratos actuales?

**Base de medición**

18. ¿Qué proporción de los activos/pasivos de ISA está denominada,
    indexada o cubierta en monedas distintas a la moneda de
    presentación?

Estas preguntas siguen el mismo flujo usado en los cuatro casos
previos:

```
hecho → desconocido/evidencia insuficiente → pregunta → respuesta/
evidencia futura → eventual decisión
```

Ninguna de estas preguntas se responde en este documento.

## 33. Preguntas metodológicas que permanecen abiertas

Preservadas explícitamente, sin resolución en este documento:

- Diseño final de `scope`.
- Diseño final de `purpose` (evidencia ahora fuertemente respaldada,
  §22 R6, pero todavía sin diseño).
- Si `assumption_relations` necesita representar relaciones temporales,
  condicionales o regulatorias, más allá de dirección y
  retroalimentación.
- Supplier financing — sin nueva instancia en este caso, criterio
  general todavía sin resolver.
- Umbral de materialidad para exigir descomposición
  (`account_components`), ahora con la cautela adicional sobre cuándo
  la descomposición deja de aportar valor analítico (§12).
- Tratamiento de leases cuando el mismo grupo es simultáneamente
  arrendatario y arrendador — segunda instancia (§16, §26).
- Comparabilidad/perímetro — ahora `PROBLEMA FUERTEMENTE DEMOSTRADO EN
  MÚLTIPLES ECONOMÍAS` (§23), todavía sin representación general.
- Candidato A (neteo) — sigue con evidencia de un solo caso (§24).
- Candidato B (ciclo de vida económico) — ahora con evidencia de tres
  casos de naturaleza muy distinta, formulación general todavía abierta
  (§24).
- Candidato C (atribución temporal/corte de conocimiento) — sin
  elevación en este caso, sigue requiriendo definir principios (§24).
- Candidato D (derechos económicos/propiedad dinámica) — sin elevación
  en este caso; ISA solo aporta evidencia del problema más amplio de
  atribución (§24).
- Candidato E (base de medición/régimen monetario) — ahora con
  evidencia de dos casos de naturaleza distinta, con la cautela de que
  puede estar agrupando fenómenos metodológicamente diferentes (§24).
- Observación ISA-F (disponibilidad de recursos) — evidencia de un solo
  caso, todavía no es candidato formal (§24).
- Qué significa "estado estable" para una compañía con activos finitos
  y capacidad de reinversión potencialmente continua (§20, §28).
- A qué `scope` pertenece una estructura de capital observada antes de
  usarla como referencia (§19, §28).

Ninguna de estas preguntas se resuelve en este documento.

## 34. Qué NO se creó como candidato nuevo

Para evitar sobreingeniería, este documento **no** crea candidatos
independientes para fenómenos que, aunque reales y documentados, se
absorben dentro de reglas o candidatos ya existentes:

- "Inversión ≠ ingreso ≠ caja" (§9, §18) — absorbido en R1, R2, R3, R4,
  R7 y el Candidato C.
- Disponibilidad/restricción de efectivo (§15) — registrada como
  observación ISA-F, explícitamente no candidato formal.
- Parte dinámica del Candidato D — ISA no aportó evidencia suficiente;
  no se fuerza su elevación.
- Diferencias de mecanismo de remuneración entre concesiones viales
  (§10) — absorbido en R7.
- Secuencia CAPEX→activo contractual (§9) — absorbida en R1 y R2, no
  convertida en candidato aparte.

## 35. Qué NO puede concluirse todavía / qué no produce este caso

El Caso 05 **no produce valoración**. Queda explícito que **no se
calcularon ni aprobaron**: Enterprise Value, Equity Value, precio por
acción, WACC definitivo, g definitiva, ni horizonte definitivo para ISA.
Este documento **no presenta escenarios de valoración**. Velarix
continúa buscando **una** conclusión profesional principal de valor,
cuando exista un encargo real y aprobación experta — no tres escenarios
equivalentes.

Adicionalmente:

- No se puede concluir el tratamiento metodológico final de los leases
  de ISA (§16, §26).
- No se puede concluir cómo distinguir, en la práctica, restricciones
  contractuales de efectivo de restricciones societarias derivadas de
  NCI (§15).
- No se puede concluir un diseño final para `scope`, `purpose`,
  `assumption_relations` enriquecidas, comparabilidad/perímetro, ni
  ninguno de los cinco candidatos (A–E) ni de la observación ISA-F.
- No se puede concluir que los negocios, drivers o mecanismos de ISA
  apliquen a cualquier otra empresa de energía, infraestructura o
  concesiones, ni siquiera a otro operador de transmisión o de
  concesiones viales.
- No se puede concluir que las ocho reglas R1–R8 estén completas o sean
  definitivas — ahora provienen de cinco casos, no de cuatro, pero cinco
  casos siguen sin ser una ley universal.
- No se cierran las Decisiones 2 ni 4 del Bloque 1B — solo se
  profundizan conceptualmente.

## 36. Conclusión metodológica

Con cinco casos independientes (Tecnoglass, Terpel, Ecopetrol, Grupo
Éxito, ISA), el estado de cada regla queda así — evitando
deliberadamente un conteo agregado que pueda ocultar diferencias de
madurez entre reglas:

- **R1, R2, R7 y R8** reaparecen de forma transversal e idéntica:
  `PATRÓN OBSERVADO EN CINCO CASOS`.
- **R3**: su núcleo conceptual —que existen relaciones materiales entre
  supuestos— es también `PATRÓN OBSERVADO EN CINCO CASOS` (§22), pero el
  diseño de `assumption_relations` sigue **insuficientemente
  validado**, ahora con evidencia adicional de relaciones temporales,
  condicionales y regulatorias.
- **R4**, en su formulación base, es igualmente `PATRÓN OBSERVADO EN
  CINCO CASOS`; se añade la cautela conceptual sobre cuándo detener la
  descomposición (§12).
- **R5** sobrevive y se profundiza, sin etiqueta transversal formal no
  definida en §22.
- **R6** sobrevive incompleto; `scope` se mantiene en su nivel
  alcanzado en el Caso 03; `purpose` sube de nivel, acercándose más a
  `scope` sin fusionarse con él.

Ninguna de estas ocho reglas se declara ley universal por haber
reaparecido en cinco casos — es, hasta ahora, el nivel de evidencia más
alto que Velarix ha registrado, **explícitamente no una ley universal**.

ISA produjo resultados desiguales sobre los candidatos heredados: el
Candidato B (ciclo de vida económico) sube a tres casos de naturaleza
muy distinta; el Candidato E (base de medición) sube a dos casos, con
una cautela nueva sobre posible heterogeneidad interna del candidato; el
Candidato C se mantiene reforzado sin cambio de estado; el Candidato A
(neteo) **no** recibió evidencia nueva y se mantiene sin elevar; el
Candidato D (derechos económicos/propiedad dinámica) tampoco se elevó —
ISA solo aportó evidencia del problema más amplio de atribución
económica, no de su componente dinámico/contractual específico. ISA
aporta además una observación nueva — ISA-F, disponibilidad/restricción
de recursos — explícitamente **no** registrada como candidato formal
todavía.

Comparabilidad/perímetro histórico pasa de "problema demostrado en
múltiples economías" a **"problema fuertemente demostrado en múltiples
economías, con evidencia suficiente para exigir tratamiento
metodológico"** — pero sigue sin evidencia suficiente para diseñar una
representación general.

**Una conclusión válida y honesta de este caso es**: el Expediente V1
sobrevive conceptualmente al Caso 05 — ninguna de sus entidades o
principios centrales resultó refutada — pero **todavía no está listo
para congelarse como arquitectura**, y las Decisiones 2 y 4 del Bloque
1B siguen sin cerrarse más allá de su profundización conceptual.
Ninguno de estos hallazgos autoriza, por sí mismo, ningún cambio técnico
— ver §37.

## 37. Prohibición explícita de interpretar el documento como autorización de implementación

**CASO 05 NO AUTORIZA IMPLEMENTACIÓN.** Ni el Caso 01, ni el Caso 02, ni
el Caso 03, ni el Caso 04, ni el Caso 05, ni ninguno de sus reportes de
contraste, ni ninguna actualización del Expediente basada en ellos,
constituyen autorización para implementar ninguna estructura técnica:
tablas, SQL, migraciones, schemas, UI, motores, Edge Functions,
automatizaciones, persistencia, coherence engine, decomposition engine,
grafo causal, `case_perimeter`, `contracts`, `economic_period`,
`economic_lifecycle`, `measurement_basis`, `availability`, un "options
engine", un algoritmo automático de NCI/JV, ni ningún otro cambio
runtime. Solo Nicolás/fundador puede autorizar implementación, de forma
explícita y separada, caso por caso.

**Este documento no declara el Caso 05 formalmente cerrado ni
congelado.** Esa declaración, si corresponde, es una ejecución posterior
condicionada a revisión humana de este commit.
