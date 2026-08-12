# Caso Público 04 — Grupo Éxito — V0

**Fecha:** 2026-08-12 (cierre formal: 2026-08-12, tras revisión humana)
**Estado: CASO PÚBLICO 04 — GRUPO ÉXITO: FORMALMENTE CERRADO Y
CONGELADO.** Versión V0. No es una valoración. No autorizó implementación
de ningún cambio al Expediente. No produjo Enterprise Value, Equity
Value, precio por acción, WACC definitivo, g definitiva ni horizonte
definitivo. El análisis metodológico de este caso terminó: el caso queda
cerrado **como caso de estudio**, y sus hallazgos metodológicos quedan
preservados (R1–R8, `scope`, `purpose`, comparabilidad/perímetro,
Candidatos A–E, supplier financing, leases, CAPEX — ver §20–§27). No
debe reabrirse salvo nueva evidencia concreta, una contradicción
documental real, o una instrucción explícita de Nicolás/fundador.

**Este cierre es exclusivamente del Caso 04 como caso de estudio —
NO cierra R1–R8, NO cierra la metodología, NO cierra los Bloques 1B ni
1C, NO congela el Expediente como arquitectura, y NO cierra ninguno de
los Candidatos A–E, que siguen siendo candidatos.** Los asuntos
pendientes de este caso se llevarán a casos posteriores y a la
consolidación prevista después del Caso 06. El reporte de contraste
(`REPORTE-CONTRASTE-EXPEDIENTE-V1.md`, esta misma carpeta) queda
formalmente cerrado junto con este caso, y tampoco constituye
autorización de implementación; cualquier implementación requiere
autorización explícita y separada del fundador.

**CASO 04 NO AUTORIZA IMPLEMENTACIÓN.** Ningún hallazgo, hipótesis,
candidato o patrón de este documento constituye autorización para crear
tablas, migraciones, schemas, UI, motores, Edge Functions,
automatizaciones ni ningún otro cambio técnico. Solo Nicolás/fundador
puede autorizar implementación, de forma explícita y separada.

---

## 1. Identificación del caso

- **Caso:** Caso Público 04 — Grupo Éxito.
- **Posición en la secuencia:** cuarto caso de estudio manual, después de
  Caso 01 (Tecnoglass, cerrado y congelado), Caso 02 (Organización
  Terpel, cerrado) y Caso 03 (Ecopetrol, cerrado y congelado).
- **Insumos documentales de continuidad revisados para el contraste y
  cierre del Caso 04:**
  `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`,
  `docs/velarix/casos/01-tecnoglass/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`,
  `docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md`,
  `docs/velarix/casos/02-terpel/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`,
  `docs/velarix/casos/03-ecopetrol/CASO-03-ECOPETROL-V0.md`,
  `docs/velarix/casos/03-ecopetrol/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`,
  `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`.
- **No se reanaliza ni se recalcula ningún elemento de los Casos 01, 02
  o 03** — se citan únicamente para contraste.
- **Unidad inicial de análisis: Grupo Éxito consolidado.** Almacenes
  Éxito S.A. (la entidad jurídica matriz, separada del grupo
  consolidado) se usa únicamente como referencia conceptual cuando ayuda
  a entender la diferencia entre entidad jurídica y grupo consolidado —
  este documento no dispone de cifras separadas de Almacenes Éxito S.A.
  distintas de las del grupo consolidado, y no las inventa
  (`DESCONOCIDO` donde no se proporcionaron).

## 2. Objetivo del caso

Este caso **no busca practicar otra valoración**. Fue diseñado
explícitamente **para intentar romper Velarix, no para confirmarlo**:
tensionar y, donde corresponda, refutar lo observado o reforzado por
Tecnoglass, Terpel y Ecopetrol, con una cuarta economía deliberadamente
distinta — un grupo de **retail** multiformato y multigeografía, con
márgenes bajos, ciclo físico de tiendas, capital de trabajo intensivo,
proveedores, supplier financing, leases, un componente inmobiliario
material, negocios conjuntos, intereses no controladores (NCI),
distintas bases de medición monetaria (incluida una subsidiaria en
economía hiperinflacionaria), y propiedad económica potencialmente
dinámica (opciones sobre participaciones).

Regla explícita, vigente desde el Caso 02 y reforzada en el Caso 03:
**cuatro casos muestran patrones más resistentes; cuatro casos no crean
leyes universales.** Donde una conclusión reaparece de forma transversal
e idéntica en los cuatro casos, se documenta prudentemente como `PATRÓN
OBSERVADO EN CUATRO CASOS` — **nunca** como `CONFIRMADO POR CUATRO
CASOS`, y nunca como ley universal. Para elementos respaldados solo por
dos casos o por un solo caso, este documento lo indica explícitamente
como tal, sin inflar el nivel de evidencia.

## 3. Límites del ejercicio

- No se calcula Enterprise Value, Equity Value ni precio por acción.
- No se elige un WACC, un crecimiento terminal (g), ni un horizonte
  explícito numérico.
- No se completa ningún dato faltante con un valor por defecto, ni con
  una cifra tomada de Tecnoglass, Terpel, Ecopetrol, de un comparable, o
  de cualquier fuente externa no entregada para este caso.
- No se trata ningún hallazgo de este caso como regla universal aplicable
  a cualquier empresa o sector.
- No equivale a due diligence, auditoría, ni opinión profesional de
  valor.
- No se acusa a Grupo Éxito, a su administración ni a ningún tercero de
  ninguna irregularidad fiscal, contable o regulatoria — donde el
  material de trabajo describe un mecanismo (ej. convenios de pronto
  pago con instituciones financieras, reconfiguración de la operación en
  Argentina), este documento lo registra como fenómeno a entender, no
  como juicio de valor.
- Grupo Éxito es una compañía listada, con obligaciones de reporte
  regulatorio superiores a las de una PYME colombiana típica — este caso
  no asume que una PYME real tendrá información de esta granularidad;
  ayuda, igual que los tres casos previos, a entender qué preguntar a una
  empresa que reporte de forma más simple.
- Éxito de este caso **no** significa que los negocios, mecanismos o
  supuestos de Grupo Éxito apliquen a cualquier otra empresa de retail,
  ni que cuatro casos sean suficientes para declarar cerrada ninguna de
  las ocho reglas R1–R8.
- No se fuerza ningún hallazgo si la evidencia proporcionada no lo
  sostiene — donde el material de trabajo no permite concluir algo, este
  documento lo deja como `EVIDENCIA INSUFICIENTE` o `PREGUNTA ABIERTA`
  en lugar de completarlo.

## 4. Período analizado

**Período financiero base: FY2025, con cierre al 31 de diciembre de
2025.** Este es el período sobre el que versan las cifras y hallazgos
documentados en §8–§18 de este caso, salvo donde se indique
explícitamente lo contrario.

**Información posterior al corte (1T26 y 2T26, incluida la publicada el
12 de agosto de 2026) se documenta por separado en §19, claramente
etiquetada como `INFORMACIÓN POSTERIOR AL CORTE`.** No se mezcla con las
cifras de FY2025, y no reescribe retroactivamente qué pertenecía al
perímetro de consolidación al 31 de diciembre de 2025 — ver Candidato C
(§22) y comparabilidad/perímetro (§21).

## 5. Procedencia y naturaleza de la evidencia

**Fuente de trabajo:** síntesis analítica proporcionada a esta ejecución
documental, elaborada previamente a partir de información pública de
Grupo Éxito. Esta ejecución documental **no realizó verificación
independiente adicional de las fuentes originales** — no se hizo
scraping, descarga automatizada, ni acceso de red para contrastar las
cifras contra los documentos primarios.

Las fuentes primarias citadas como origen de la síntesis (proporcionadas
en la instrucción de esta ejecución, no descargadas ni verificadas
directamente por esta ejecución):

- Estados Financieros Consolidados 4T2025 (Grupo Éxito).
- Información financiera oficial de Grupo Éxito.
- Informe de Resultados 4T25.
- Documentación de la Asamblea de Accionistas 2026 (FY2025).
- Informe de Resultados 1T26 (información posterior al corte, §19).
- Informe de Resultados 2T26 / 1S26 (información posterior al corte,
  §19).
- Estados Financieros Consolidados 2T26 (información posterior al
  corte, §19).

**No se afirma en este documento** que Claude Code investigó, descargó o
verificó independientemente estas fuentes, ni que el fundador las
recopiló personalmente — el flujo real fue: (1) existe una síntesis
analítica de información pública de Grupo Éxito, elaborada previamente a
esta ejecución; (2) esa síntesis fue entregada a esta ejecución mediante
instrucciones; (3) esta ejecución documental no verificó de forma
independiente las fuentes originales de esa síntesis.

Las cifras citadas en este documento se reproducen tal como fueron
entregadas a esta ejecución, sin recalcularlas ni completarlas con
supuestos adicionales. Donde el material de trabajo no incluyó una cifra
o un detalle, este documento no la completa — queda registrada
explícitamente como `DESCONOCIDO` o `EVIDENCIA INSUFICIENTE`.

## 6. Descripción económica resumida de Grupo Éxito

`HECHO DOCUMENTADO` (según la síntesis analítica recibida por esta
ejecución, sin verificación independiente adicional de las fuentes
originales): Grupo Éxito es un grupo de retail consolidado que combina,
al menos:

- Múltiples formatos de tienda (el material de trabajo no detalla el
  inventario completo de formatos — `DESCONOCIDO` el desglose exhaustivo,
  aunque sí hace referencia a Libertad como marca/formato con posible
  reenfoque hacia real estate, ver §19).
- Múltiples geografías (al menos Colombia, Uruguay y Argentina, según
  el desglose de cierres de tiendas de 2025, §14).
- Un componente inmobiliario material y estructuralmente distinto del
  negocio de retail operativo (§12).
- Negocios conjuntos (joint ventures) contabilizados por método de
  participación: Compañía de Financiamiento Tuya S.A. (50%), Puntos
  Colombia S.A.S. (50%), Sara ANV S.A. (50%).
- Estructuras de propiedad inmobiliaria (ej. proyectos "Viva") donde
  Grupo Éxito consolida entidades controladas aunque su participación
  económica directa + indirecta sea materialmente inferior al 100%
  (§8).
- Una subsidiaria en economía hiperinflacionaria (Argentina), con
  estados financieros ajustados conforme NIC 29 antes de convertirse a
  la moneda de presentación del grupo (§16).

**Conclusión metodológica**: igual que Terpel no debía reducirse a
`galones × precio` y Ecopetrol no debía reducirse a un único driver de
barriles equivalentes, Grupo Éxito **no** debe reducirse a un único
driver de "ventas de mercancía". La coexistencia de retail operativo,
inmobiliario, negocios conjuntos financieros/de fidelización, y una
subsidiaria hiperinflacionaria dentro de un mismo grupo consolidado
tensiona la idea de aplicar un único conjunto de drivers, un único WACC
o un único horizonte a todo el grupo — sin que este documento decida si
eso implica, para Velarix, un enfoque de suma de partes (`HIPÓTESIS`, no
autorizada ni diseñada aquí, consistente con la misma hipótesis abierta
en el Caso 03).

Mapa económico conceptual (específico de Grupo Éxito, no plantilla
universal — ver §20, R7):

```
Negocios (retail multiformato, inmobiliario, JVs financieros/
fidelización) × Geografías (Colombia, Uruguay, Argentina)
        │
        ▼
Ciclo físico de tiendas: apertura → operación → remodelación/
conversión → posible cierre (§14, Candidato B)
        │
        ├──► Ventas de mercancía + ventas de inventario de proyectos
        │     inmobiliarios (mecanismos distintos, §13)
        ├──► Capital de trabajo: inventarios, proveedores de bienes,
        │     convenios de pronto pago con instituciones financieras
        │     (supplier financing, §9, §23)
        ├──► Leases (IFRS 16): derecho de uso, pasivo, principal,
        │     interés, plazo remanente — Grupo Éxito además arrienda
        │     como arrendador en su negocio inmobiliario (§11, §24)
        ├──► Inmobiliario: propiedades de inversión, valor en libros vs.
        │     valor razonable revelado (§12)
        ├──► CAPEX distribuido por naturaleza económica: expansión/
        │     innovación/omnicanalidad vs. mantenimiento/TI/logística
        │     (§14)
        └──► Propiedad económica dinámica: opción de venta sobre NCI de
              Grupo Disco Uruguay, ejercida parcialmente en 2025 (§15,
              Candidato D)
        │
        ▼
Perímetro consolidado (incluye entidades con NCI materiales — ej. Viva
Sincelejo/Villavicencio/San Pedro Etapa II/Viva Palmas al 26,01% de
participación atribuible — y JVs fuera de consolidación línea por línea)
≠ atribución económica final al accionista de Grupo Éxito (§8, §21)
```

## 7. Evidencia material analizada

Este caso documenta prudentemente, sin verificación independiente
adicional, los siguientes hallazgos analíticos (detalle en §8–§18):

- **A. Perímetro y atribución** — subsidiarias inmobiliarias
  consolidadas con participación económica atribuible tan baja como
  26,01% (73,99% NCI); JVs al 50% por método de participación (§8).
- **B. Inventarios / proveedores / capital de trabajo** — supplier
  financing con anticipación bancaria elegida por el proveedor y
  convenios de plazo adicional con instituciones financieras (§9).
- **C. Inventarios y costo** — heterogeneidad económica dentro de
  "inventario" (mercancías, descuentos de proveedores, logística,
  mermas/averías, timing, e inventarios de proyectos inmobiliarios) (§10).
- **D. Leases** — pasivo IFRS 16 material, con Grupo Éxito actuando
  simultáneamente como arrendatario y como arrendador (§11).
- **E. Inmobiliario** — diferencia material entre valor en libros
  (≈COP 1,72 billones) y valor razonable revelado (≈COP 4,55 billones)
  de propiedades de inversión (§12).
- **F. Ingresos / actividades distintas** — venta de mercancías vs.
  venta de inventario de proyectos inmobiliarios vs. ingresos por
  servicios (arrendamientos, concesionarios, administración
  inmobiliaria) (§13).
- **G. CAPEX** — distribución entre expansión/innovación/omnicanalidad
  (58%) y mantenimiento/TI/logística (resto); 18 tiendas
  remodeladas/convertidas y 43 tiendas cerradas en 2025 (§14).
- **H. Propiedad dinámica / put** — opción de venta sobre NCI de Grupo
  Disco Uruguay, ejercida parcialmente en 2025 (§15).
- **I. Hiperinflación / base de medición** — Argentina como economía
  hiperinflacionaria, NIC 29, reexpresión y conversión (§16).
- **J. Fidelización** — pasivo de programa de fidelización y costo del
  negocio conjunto Puntos Colombia (§17).
- **K. Principal/agente** — política existente, ingresos como agente
  declarados inmateriales por la compañía (§18).

Ninguno de estos hallazgos produce, por sí mismo, una cifra de valor —
son evidencia para tensionar el Expediente (§20, §21, §22), no insumos
de cálculo.

## 8. A. Perímetro y atribución

`HECHO DOCUMENTADO` (según la síntesis recibida, cifras aproximadas, sin
verificación independiente adicional): los estados financieros
consolidados de Grupo Éxito al 31-dic-2025 incluyen subsidiarias
controladas y reconocen participaciones no controladoras (NCI). Existen
estructuras inmobiliarias donde Grupo Éxito consolida entidades
controladas aunque la participación económica directa + indirecta
atribuible al grupo sea materialmente inferior al 100%:

| Entidad | Participación atribuible al Grupo | NCI |
|---|---|---|
| Viva Sincelejo | 26,01% | 73,99% |
| Viva Villavicencio | 26,01% | 73,99% |
| San Pedro Etapa II | 26,01% | 73,99% |
| Viva Palmas | 26,01% | 73,99% |

Al mismo tiempo, existen negocios conjuntos contabilizados mediante
método de participación (no consolidados línea por línea): Compañía de
Financiamiento Tuya S.A. (50%), Puntos Colombia S.A.S. (50%), Sara ANV
S.A. (50%).

**Regla explícita de este caso, coherente con Ecopetrol/ISA (Caso 03,
§13)**: esto tensiona la diferencia entre **perímetro consolidado**,
**participación económica**, **atribución final**, y lo que podría
llamarse el **ecosistema económico** de la compañía (negocios conjuntos
que no consolidan línea por línea, pero que son económicamente
relevantes para entender el grupo). Un mismo grupo puede, simultáneamente,
consolidar al 100% una entidad donde posee solo 26,01% económico, y no
consolidar línea por línea negocios donde posee 50%.

`INFERENCIA`: la existencia de estructuras "Viva" con NCI tan altos
(73,99%) sugiere un modelo de desarrollo inmobiliario en el que Grupo
Éxito aporta control operativo/de gestión sin aportar la mayoría del
capital económico — el material de trabajo no explica el mecanismo
contractual detrás de esta estructura (`DESCONOCIDO`).

**No se diseña `case_perimeter` en este documento.** Ver comparabilidad/
perímetro (§21).

**Preguntas a gerencia**: ver §28.

## 9. B. Inventarios / proveedores / capital de trabajo (supplier financing)

`HECHO DOCUMENTADO` (según la síntesis recibida, cifras al 31-dic-2025,
sin verificación independiente adicional):

- Inventarios netos: COP 2.718.202 millones.
- Cuentas por pagar a proveedores de bienes: COP 2.846.428 millones.
- Cuentas por pagar a proveedores y otras cuentas por pagar — convenio:
  COP 519.145 millones, de los cuales proveedores de bienes: COP
  455.277 millones, y otros proveedores: COP 63.868 millones.

La compañía explica que los proveedores pueden anticipar facturas con
bancos elegidos por ellos. Adicionalmente, Grupo Éxito celebra convenios
con algunas instituciones financieras que otorgan un período adicional
de pago sobre determinadas facturas descontadas.

**Regla explícita de este caso**: esto demuestra un problema económico
real para supplier financing — **la presentación comercial no determina
automáticamente si toda la obligación debe tratarse como capital de
trabajo (NWC) operativo**. Pero tampoco puede asumirse lo contrario:
**la sola presencia de un banco en el mecanismo no equivale
automáticamente a deuda financiera.** Ambos extremos son incorrectos sin
evidencia adicional.

**Cadena económica identificada** (consistente con Terpel §6, ahora con
un mecanismo más elaborado):

```
condiciones de proveedor (plazo + posible anticipación bancaria elegida
por el proveedor + convenio de plazo adicional con instituciones
financieras)
  → cuentas por pagar (comerciales vs. convenio)
  → capital de trabajo neto (NWC)
  → caja
```

**Patrón transversal observado (R2)**: saldo observado ≠ saldo
normalizado ≠ saldo proyectado — un mismo saldo de cuentas por pagar
puede reflejar mecanismos comerciales, financieros o mixtos
simultáneamente, sin que eso implique automáticamente reclasificarlo.

**Mantener decisión humana** — este documento no clasifica el saldo del
convenio (COP 519.145 millones) como NWC operativo ni como deuda
financiera. Ver estado consolidado de supplier financing en §23.

**Preguntas a gerencia**: ver §28.

## 10. C. Inventarios y costo

`HECHO DOCUMENTADO` (según la síntesis recibida, a nivel conceptual, sin
verificación independiente adicional): la política contable y las notas
de Grupo Éxito muestran interacción entre mercancías, descuentos de
proveedores, logística, mermas/averías, y timing de reconocimiento.
Adicionalmente existen inventarios de proyectos inmobiliarios,
económicamente distintos de los inventarios de mercancía retail.

**Regla explícita de este caso**: **no tratar "inventario" como una
unidad económica necesariamente homogénea.** Un inventario de mercancía
retail (rotación rápida, riesgo de merma, descuentos de proveedor) y un
inventario de proyecto inmobiliario (ciclo largo, riesgo de mercado
inmobiliario, financiamiento propio) comparten la etiqueta contable
"inventario", pero no comparten mecanismo económico — consistente con
R4 (§20), sin que esto obligue a una descomposición universal de
`account_components` para cualquier caso futuro con inventarios (ver
matiz de R4 sobre sobregranularidad, §20).

**Preguntas a gerencia**: ver §28.

## 11. D. Leases

`HECHO DOCUMENTADO` (según la síntesis recibida, cifras al 31-dic-2025 y
flujos del año 2025, sin verificación independiente adicional):

- Derechos de uso netos: COP 1.745.480 millones.
- Pasivo por arrendamiento: aproximadamente COP 1.993.319 millones.
- Pagos 2025 de principal de pasivos por arrendamiento: COP 282.205
  millones.
- Intereses pagados: COP 155.271 millones.
- Plazo promedio remanente de contratos: 13 años.

Existen además arrendamientos de corto plazo, de bajo valor, y otras
particularidades (el material de trabajo no las desagrega en detalle —
`DESCONOCIDO` el desglose exacto).

**Hallazgo particular de este caso, sin precedente exacto en Tecnoglass,
Terpel o Ecopetrol**: Grupo Éxito no solo es arrendatario (tiendas,
bodegas) — también actúa como **arrendador** dentro de su negocio
inmobiliario (arrendamiento de espacios a concesionarios y terceros,
§13). Un mismo grupo puede tener, simultáneamente, un pasivo de leases
material como arrendatario y un flujo de ingresos por arrendamiento
como arrendador — dos mecanismos económicos distintos que conviven bajo
la misma palabra "arrendamiento".

**Regla explícita**: **no concluir universalmente que `lease = deuda`,
ni que `lease = operación`.** La metodología de tratamiento (¿ajustar
EV?, ¿tratar el pasivo como deuda económica?, ¿dejarlo como pasivo
operativo?) requiere revisión experta posterior y depende de las
características de cada contrato — ver estado consolidado en §24.

**Preguntas a gerencia**: ver §28.

## 12. E. Inmobiliario

`HECHO DOCUMENTADO` (según la síntesis recibida, cifras al 31-dic-2025,
sin verificación independiente adicional):

- Propiedades de inversión, valor en libros: COP 1.718.123 millones.
- Propiedades de inversión, valor razonable revelado: COP 4.547.703
  millones.

La diferencia entre valor en libros y valor razonable revelado
(≈COP 2,83 billones) es material.

**Regla explícita de este caso**: **no sumar automáticamente la
diferencia a Equity Value.** Riesgos conceptuales identificados:

- Doble conteo (si el valor razonable ya refleja flujos que también se
  proyectarían operativamente en otra parte del modelo).
- Atribución a NCI (parte de las propiedades de inversión puede estar
  dentro de estructuras con NCI materiales, ver §8).
- Perímetro (¿la propiedad está 100% dentro del perímetro consolidado, o
  parcialmente en una estructura como las "Viva"?).
- Flujos ya incorporados (si un flujo de arrendamiento ya se proyecta
  como ingreso operativo, el valor razonable del activo subyacente no
  puede sumarse de forma independiente sin correr el riesgo de contar el
  mismo valor dos veces).
- Impuestos (una revaluación a valor razonable puede tener efectos
  fiscales diferidos no reflejados en la simple diferencia de cifras).
- Diferencias entre propósito contable y valoración profesional (el
  valor razonable revelado en notas responde a un propósito de
  información financiera bajo NIIF, no necesariamente al propósito de
  una valoración profesional de equity — ver `purpose`, §20 R6).

**Preguntas a gerencia**: ver §28.

## 13. F. Ingresos / actividades distintas

`HECHO DOCUMENTADO` (según la síntesis recibida, cifras de FY2025, sin
verificación independiente adicional): dentro de la categoría "venta de
bienes" de FY2025:

- Venta de mercancías: COP 20.993.751 millones.
- Venta de inventario de proyectos inmobiliarios: COP 13.053 millones.

La venta inmobiliaria de 2025 incluye participaciones de proyectos
inmobiliarios. Los ingresos por servicios incluyen, entre otros:
arrendamientos de inmuebles, arrendamientos de espacios, concesionarios,
y administración inmobiliaria.

**Regla explícita de este caso**: **no asumir que todos los pesos de
ingreso responden al mismo mecanismo económico.** Un peso de venta de
mercancías (rotación rápida, margen retail) y un peso de venta de
inventario de proyectos inmobiliarios (ciclo largo, margen de
desarrollo inmobiliario) están dentro de la misma línea contable
agregada ("venta de bienes"), pero responden a mecanismos, riesgos y
horizontes completamente distintos — nueva evidencia de R1 y R4 (§20).

**Preguntas a gerencia**: ver §28.

## 14. G. CAPEX

`HECHO DOCUMENTADO` (según la síntesis recibida, cifras y hechos de
FY2025, sin verificación independiente adicional):

- CapEx consolidado 2025: COP 235.912 millones.
- Según la administración: 58% correspondió a expansión, innovación,
  omnicanalidad y transformación digital; el resto a mantenimiento,
  soporte de estructuras operativas, sistemas TI y logística.
- Durante 2025, 18 tiendas tuvieron reformas/conversiones/remodelaciones.
- Se cerraron 43 tiendas: 20 en Colombia, 11 en Uruguay, 12 en
  Argentina.

**Conclusión metodológica (coincide con Tecnoglass §7, Terpel §8 y
Ecopetrol §10)**: `CAPEX = % de ingresos` **no** es metodología
defendible para Grupo Éxito — cuarto caso independiente con el mismo
patrón, evidencia distinta.

**Regla explícita, coherente con los tres casos previos**: **no imponer
universalmente** una clasificación binaria `maintenance CAPEX / growth
CAPEX`. Grupo Éxito añade categorías propias de retail (expansión,
innovación, omnicanalidad, transformación digital, mantenimiento,
soporte operativo, TI, logística) más el componente inmobiliario (§12) y
el ciclo físico de apertura/remodelación/cierre de tiendas (43 cierres
en 2025) — ver Candidato B (§22).

**Preguntas a gerencia**: ver §28.

## 15. H. Propiedad dinámica / put — Grupo Disco Uruguay

`HECHO DOCUMENTADO` (según la síntesis recibida, cifras y hechos de
2024–2025, sin verificación independiente adicional): al cierre de 2024
existía un pasivo financiero de COP 350.776 millones relacionado con una
opción de venta (put) sobre participaciones no controladoras de Grupo
Disco Uruguay. En septiembre de 2025 se ejerció la opción correspondiente
a 15,66%. La participación no controladora de Grupo Disco Uruguay pasó
de 23,35% al cierre de 2024 a 7,69% al cierre de 2025 (23,35% − 15,66% =
7,69%, consistente internamente con el material de trabajo).

**Hallazgo nuevo del Caso 04, sin precedente exacto en los tres casos
previos**: la atribución económica de una entidad consolidada puede
depender no solo de la propiedad actual en un momento dado, sino también
de **derechos u obligaciones contractuales capaces de modificarla** (una
opción de venta ejercible sobre NCI). Un analista que mirara únicamente
el porcentaje de NCI al cierre de un período, sin comprender que existe
un pasivo financiero asociado a una opción sobre esa misma NCI, podría
subestimar cuánta de la participación no controladora es, económicamente,
más parecida a una deuda con vencimiento incierto que a capital de
terceros permanente.

**Riesgo conceptual identificado**: una valoración puede equivocarse si
combina, sin comprender la relación entre ellos: el porcentaje de NCI
reportado, la obligación contractual (pasivo por la opción), la posible
adquisición futura de la participación, y la transición de Enterprise
Value a Equity Value — generando atribución incorrecta o doble conteo
(ej. tratar la NCI como capital de terceros permanente **y**, al mismo
tiempo, no reconocer que existe un pasivo financiero que ya anticipa su
posible adquisición).

Este hallazgo se registra como **Candidato D — Derechos económicos /
propiedad dinámica** (§22). **No se convierte en R9. No se crea entidad,
tabla, campos, ni un modelo automático de valoración de opciones.**

**Preguntas a gerencia**: ver §28.

## 16. I. Hiperinflación / base de medición

`HECHO DOCUMENTADO` (según la síntesis recibida, sin verificación
independiente adicional): al 31-dic-2025, Grupo Éxito declara que la
inflación acumulada de tres años en Argentina superó 100%. Argentina se
trata como economía hiperinflacionaria. Las subsidiarias argentinas
presentan estados financieros ajustados conforme a NIC 29 (reexpresión
por hiperinflación) y después se convierten a la moneda de presentación
del grupo.

**Hallazgo nuevo del Caso 04, sin precedente exacto en los tres casos
previos**: dos cifras pueden pertenecer al mismo cierre contable y **no
ser económicamente comparables entre sí** sin comprender cómo fueron
medidas — una cifra proveniente de una subsidiaria reexpresada bajo NIC
29 y luego convertida a la moneda del grupo no es directamente
comparable, sin ajuste conceptual, con una cifra proveniente de una
subsidiaria en una economía sin hiperinflación (ej. Colombia).

Este hallazgo se registra como **Candidato E — Base de medición /
régimen monetario** (§22). **No se convierte en R10. No se crea
`measurement_basis`, ni enum monetario, ni campos, ni schema.**

**Preguntas a gerencia**: ver §28.

## 17. J. Fidelización

`HECHO DOCUMENTADO` (según la síntesis recibida, cifras de FY2025, sin
verificación independiente adicional):

- Pasivo de programas de fidelización: COP 41.997 millones.
- Puntos Colombia S.A.S. es, además, un negocio conjunto 50/50 (§8).
- Costo del programa con Puntos Colombia en 2025: COP 120.345 millones.
- Cuenta por cobrar por redención de puntos: COP 37.260 millones.

**Regla explícita de este caso**: se registra como fenómeno relevante —
evidencia adicional de que una misma relación comercial (fidelización)
puede generar simultáneamente un pasivo, un costo, una cuenta por cobrar,
y una participación en un negocio conjunto — pero **no se crea un
candidato metodológico independiente**. Este fenómeno se absorbe dentro
de R1 (contabilidad ≠ economía) y R7 (drivers específicos), consistente
con la instrucción de esta ejecución de no multiplicar candidatos sin
evidencia de que sean generalizables.

## 18. K. Principal / agente

`HECHO DOCUMENTADO` (según la síntesis recibida, sin verificación
independiente adicional): existe una política contable de
principal/agente en Grupo Éxito, pero la compañía indica que los
ingresos donde actúa como agente son inmateriales.

**Regla explícita de este caso**: **no se fuerza un candidato nuevo** —
la propia compañía declara el fenómeno inmaterial, y el material de
trabajo no aporta evidencia que contradiga esa declaración. Se registra
únicamente como constancia de que la pregunta fue considerada y
descartada por falta de materialidad, no por omisión.

## 19. Información posterior al corte — 2026

**Esta información NO pertenece a FY2025** y no se mezcla con las
cifras y hallazgos de §8–§18. Se documenta aquí exclusivamente para
registrar su relevancia metodológica (Candidato C, comparabilidad/
perímetro), no como parte del período financiero base.

`INFORMACIÓN POSTERIOR AL CORTE — 1T26`: los resultados de 1T26 ya
mostraban la intención de reconfigurar la operación en Argentina y de
enfocar la marca/formato Libertad más hacia real estate.

`INFORMACIÓN POSTERIOR AL CORTE — 2T26` (publicada el 12 de agosto de
2026, según la síntesis recibida):

- Desde el 1 de junio de 2026, La Anónima comenzó a operar 12 tiendas de
  Grupo Éxito en Argentina y un centro de distribución.
- Una de las dos tiendas restantes pasó a ser operada por otro socio
  estratégico bajo su propia marca.
- Grupo Éxito indica que este cambio permite avanzar hacia una
  estructura enfocada en real estate.
- La compañía declara expresamente que el cambio en el perímetro de
  consolidación explica gran parte de la reducción de ingresos de
  Argentina y **limita la comparabilidad frente al año anterior**
  (declaración de la propia compañía, no una inferencia de este
  documento).

**Interpretación metodológica permitida por esta ejecución**: esta
evidencia **refuerza** el Candidato C (atribución temporal / corte de
conocimiento, §22) y comparabilidad/perímetro (§21) — es la propia
compañía quien reconoce explícitamente que un cambio de perímetro afecta
la comparabilidad entre periodos, con fecha posterior al cierre FY2025.

**Regla explícita, que no admite excepción**: esta información **no
cambia el período base FY2025**. Este documento **no reescribe
retroactivamente** qué pertenecía al perímetro de consolidación de Grupo
Éxito al 31 de diciembre de 2025 — al cierre de FY2025, la operación
argentina descrita en §6, §14 todavía formaba parte del perímetro
consolidado tal como se documentó en esa fecha.

## 20. Contraste formal R1–R8 (resultado del Caso 04)

Regla rectora, igual que en los contrastes de los Casos 02 y 03: `PATRÓN
OBSERVADO EN CUATRO CASOS` se usa **solo** donde la evidencia de
Tecnoglass, Terpel, Ecopetrol y Grupo Éxito es realmente transversal —
nunca como sinónimo de regla universal, nunca como `CONFIRMADO POR
CUATRO CASOS`, y nunca por aplicación automática.

- **R1 — Contabilidad ≠ economía.** `SOBREVIVE — MUY FUERTEMENTE
  REFORZADA.` Grupo Éxito lo muestra con mecanismos propios: inmobiliario
  con valor en libros materialmente distinto del valor razonable
  revelado (§12); supplier financing donde la presentación comercial no
  determina por sí sola el tratamiento económico (§9); inventarios
  heterogéneos bajo una sola etiqueta contable (§10); perímetro
  consolidado con NCI materiales que no equivale a atribución económica
  (§8). **Cautela explícita**: esta regla **no** debe interpretarse como
  "la contabilidad es información inferior que debe reemplazarse" — la
  representación contable no determina, por sí sola, la interpretación
  económica, pero **sigue siendo evidencia fundamental**, no algo a
  descartar. **Estado transversal: `PATRÓN OBSERVADO EN CUATRO CASOS`.**
- **R2 — Observado ≠ normalizado ≠ proyectado.** `SOBREVIVE —
  FUERTEMENTE REFORZADA.` Grupo Éxito muestra especialmente que el NWC
  observado no determina por sí solo su mecanismo futuro; que una cifra
  contable inmobiliaria (valor en libros) no determina automáticamente
  un ajuste de valoración; y que el supplier financing requiere
  interpretación antes de poder proyectarse. **Estado transversal:
  `PATRÓN OBSERVADO EN CUATRO CASOS`.**
- **R3 — Los supuestos están relacionados.** `SOBREVIVE — DISEÑO
  TODAVÍA INSUFICIENTEMENTE VALIDADO.` Grupo Éxito aporta cadenas
  potenciales adicionales: ventas → compras → inventario → proveedores →
  descuentos → margen → caja; y tiendas → leases → ventas → CAPEX →
  remodelaciones/cierres. Pero también muestra evidencia de **causalidad
  inversa** y **retroalimentación** (ej. un cierre de tienda reduce
  ventas, lo que puede a su vez afectar decisiones de CAPEX futuras) —
  las relaciones entre supuestos no son necesariamente binarias ni
  unidireccionales. **No se rediseña `assumption_relations` en este
  documento.** Estado: `PATRÓN OBSERVADO EN CUATRO CASOS + DISEÑO
  INSUFICIENTEMENTE VALIDADO`.
- **R4 — Descomposición según la dimensión económica relevante.**
  Formulación vigente, sin cambios: *"una partida o variable material
  puede necesitar descomposición según la dimensión que explique su
  comportamiento económico."* `SOBREVIVE — REFORZADA`, con evidencia de
  inventarios (§10) e ingresos (§13) heterogéneos bajo una misma
  etiqueta contable. **Cautela nueva, aportada por Grupo Éxito**: **más
  granularidad no es automáticamente mejor análisis** — la
  descomposición debe depender de comportamiento económico,
  materialidad y propósito analítico, no aplicarse por defecto. **No se
  crea un enum universal. No se hace obligatorio `account_components`.**
  La extensión de R4 hacia cifras netas/movimientos agregados
  (Candidato A, heredado de Ecopetrol) **sigue sin suficiente evidencia
  transversal para modificación universal** — Grupo Éxito no aportó
  evidencia independiente fuerte sobre esta extensión específica (ver
  §22, Candidato A). **Estado transversal (formulación base): `PATRÓN
  OBSERVADO EN CUATRO CASOS`.**
- **R5 — Estado de conocimiento explícito.** `SOBREVIVE — SE
  PROFUNDIZA.` Grupo Éxito muestra, con supplier financing, que puedo
  conocer la cifra, la clasificación contable, el contrato, y la
  participación bancaria, y **todavía no conocer la interpretación
  económica correcta para efectos de valoración**. Se mantiene el matiz
  introducido en el Caso 03: "conozco la cifra, pero todavía no sé cómo
  interpretarla económicamente." **No se crea un nuevo enum
  epistemológico en este documento.**
- **R6 — Método de determinación (scope / purpose).** `SOBREVIVE —
  INCOMPLETO.` `scope` (alcance) se mantiene en `NECESIDAD CONCEPTUAL
  FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS` — Grupo Éxito no aportó
  evidencia directa nueva sobre a qué aplica un supuesto que eleve el
  nivel ya alcanzado en el Caso 03, aunque el perímetro con NCI del §8
  es consistente con la necesidad ya registrada. `purpose` (propósito
  original de un supuesto) **sube de nivel**: pasa de `PREGUNTA
  CONCEPTUAL ABIERTA — EVIDENCIA MENOR QUE SCOPE` a `NECESIDAD
  CONCEPTUAL RESPALDADA POR MÚLTIPLES CASOS, AÚN MENOS MADURA QUE
  SCOPE`. Evidencia particularmente limpia: tasas de descuento para
  impairment, supuestos de UGE, y metodologías de fair value inmobiliario
  — un supuesto válido para impairment o para el fair value de un
  inmueble **no es automáticamente válido para una valoración profesional
  del equity**, porque fue determinado con un propósito distinto. **No
  se fusionan `scope` y `purpose`. No se implementa ninguno.**
- **R7 — Drivers específicos por empresa.** `SOBREVIVE — FUERTEMENTE
  REFORZADA.` Grupo Éxito usa drivers radicalmente distintos de
  Tecnoglass, Terpel y Ecopetrol (metros cuadrados, productividad por
  tienda, venta por tienda, rotación, ocupación, renta, ciclo de
  apertura/cierre). **Cautela explícita**: driver específico **no**
  significa máxima granularidad disponible — una métrica solo es un
  driver relevante si es materialmente causal para el análisis, no por
  el simple hecho de estar disponible. **Estado transversal: `PATRÓN
  OBSERVADO EN CUATRO CASOS`.**
- **R8 — Detectar incoherencias sin decidir.** `SOBREVIVE — MUY
  FUERTEMENTE REFORZADA.` Velarix puede detectar: supplier financing sin
  clasificar, neteos, diferencias de fair value sin explicar, NCI sin
  atribución, cambios de perímetro (§19), inconsistencias, conflictos de
  evidencia. Pero **el experto decide**: reclasificación, normalización,
  tratamiento de leases, tratamiento de supplier financing, método,
  WACC, g, horizonte, valor final. **Estado transversal: `PATRÓN
  OBSERVADO EN CUATRO CASOS`.**

## 21. Comparabilidad / perímetro

**Estado anterior** (Caso 03, §13 de `CASO-03-ECOPETROL-V0.md`):

`PROBLEMA DEMOSTRADO; EVIDENCIA INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN
GENERAL.`

**Después de Grupo Éxito**:

`PROBLEMA DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA TODAVÍA
INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN GENERAL.`

**Razón del cambio de estado**: Ecopetrol demostró el problema con una
subsidiaria consolidada al 100% con solo ≈51,4% de control económico
(ISA). Grupo Éxito aporta una segunda economía, de naturaleza
completamente distinta (retail/inmobiliario vs. energía), con el mismo
problema estructural: consolidación con NCI materiales (participación
atribuible tan baja como 26,01% en las estructuras "Viva", §8), negocios
conjuntos fuera de consolidación línea por línea (§8), y un cambio
posterior del perímetro de Argentina reconocido explícitamente por la
propia compañía como limitante de comparabilidad (§19). Esto refuerza
que el problema **no es específico de la estructura de un grupo
energético con una subsidiaria eléctrica** — reaparece en una economía
de naturaleza completamente distinta.

**Esto no significa que exista todavía una solución de diseño.** El
Expediente puede documentar narrativamente el problema (mediante
`company_context`, `account_notes`, `expedient_questions` y
`case_assumptions` con estado epistémico apropiado), pero todavía no
puede representarlo estructuradamente sin pérdida de información. **No
se crea `case_perimeter`, tabla, schema, ni campos.**

## 22. Candidatos A–E

Registrados como **candidatos**, explícitamente **no** como principios
universales ni como R9/R10/R11 — ninguna regla nueva se numera junto a
R1–R8 en este documento.

### Candidato A — Neteo (heredado de Ecopetrol, Caso 03)

*"El neteo puede destruir información económica relevante."*

**Resultado Caso 04**: este caso **no aportó evidencia independiente
fuerte suficiente** sobre este candidato específico — el material de
trabajo de Grupo Éxito no incluyó un ejemplo directo y material de una
cifra neta que ocultara movimientos brutos de naturaleza opuesta,
comparable al impairment neto ≈0 de Ecopetrol.

**Estado: se mantiene esencialmente sin cambio: `EVIDENCIA FUERTE EN
ECOPETROL — VALIDAR EN CASOS FUTUROS`.** **No se eleva** a patrón de dos
o cuatro casos. No se modifica arquitectura.

### Candidato B — Ciclo de vida económico (heredado de Ecopetrol, Caso 03)

*"Algunas variables, activos o unidades económicas tienen un ciclo de
vida económico que importa para la valoración."*

Ecopetrol mostró: origen/inversión → operación → mantenimiento/
reposición → agotamiento → abandono (activos de E&P).

Grupo Éxito aporta una economía completamente distinta, con su propio
ciclo: apertura → operación → remodelación/conversión → posible cierre
(tiendas físicas; evidencia directa: 18 tiendas remodeladas/convertidas
y 43 tiendas cerradas en 2025, §14).

**Estado: `PATRÓN OBSERVADO EN DOS CASOS DE NATURALEZA ECONÓMICA MUY
DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA`.** Dos economías tan
distintas (activos de E&P con agotamiento geológico vs. tiendas físicas
con ciclo de remodelación/cierre comercial) sugieren que el patrón
podría ser más general que un fenómeno específico de industrias
extractivas, pero **dos casos siguen sin ser suficientes** para cerrar
una formulación general. **No se crea `economic_lifecycle`. No se crea
tabla.**

### Candidato C — Atribución temporal / corte de conocimiento (heredado de Ecopetrol, Caso 03)

Distingue potencialmente: fecha de valoración, período financiero
analizado, fecha económica del hecho, fecha de reconocimiento, fecha de
caja, y fecha de publicación/conocimiento de la información.

Ecopetrol produjo evidencia (FEPC: causación 2024, cobro 2025; también
publicación de FY2025 durante 2026). Grupo Éxito produce **evidencia
independiente muy fuerte y de naturaleza distinta**: FY2025 incluye la
operación argentina existente al 31-dic-2025; 1T26 comunica la
intención de reconfiguración; 2T26 (publicado 2026-08-12) confirma que,
desde el 1 de junio de 2026, terceros pasan a operar la mayor parte del
retail argentino, y **la propia compañía declara explícitamente** que el
cambio de perímetro limita la comparabilidad frente al año anterior
(§19).

**Estado: `PROBLEMA METODOLÓGICO RESPALDADO POR MÚLTIPLES CASOS —
REQUIERE DEFINIR PRINCIPIOS ANTES DE DISEÑAR REPRESENTACIÓN.`** **No se
crea `economic_period`, ni campos nuevos de fecha, ni schema.**

### Candidato D — Derechos económicos / propiedad dinámica (nuevo del Caso 04)

*"La atribución económica puede depender no solo de la propiedad
actual, sino también de derechos u obligaciones contractuales capaces
de modificarla."*

Evidencia: opción de venta (put) sobre NCI de Grupo Disco Uruguay,
ejercida parcialmente en 2025 (23,35% → 7,69% de NCI, §15).

**Riesgo conceptual**: una valoración puede equivocarse si combina, sin
comprenderlos en conjunto, el porcentaje de NCI, la obligación
contractual asociada, la posible adquisición futura de la participación,
y la transición de Enterprise Value a Equity Value — generando
atribución incorrecta o doble conteo.

**Estado: `EVIDENCIA FUERTE EN GRUPO ÉXITO — VALIDAR EN CASOS
FUTUROS`.** **No se convierte en R9. No se crea entidad, tabla, campos,
ni modelo automático de valoración de opciones.**

### Candidato E — Base de medición / régimen monetario (nuevo del Caso 04)

*"Antes de comparar, normalizar o proyectar una cifra, puede ser
necesario conocer la base de medición y el régimen monetario bajo el
cual fue construida."*

Evidencia: Argentina como economía hiperinflacionaria, NIC 29,
reexpresión, moneda funcional, posterior conversión a COP (§16). Dos
cifras pueden pertenecer al mismo cierre y no ser económicamente
comparables sin comprender cómo fueron medidas.

**Estado: `EVIDENCIA FUERTE EN GRUPO ÉXITO — VALIDAR EN CASOS
FUTUROS`.** **No se convierte en R10. No se crea `measurement_basis`,
enum monetario, campos, ni schema.**

## 23. Supplier financing (estado consolidado)

**Estado después del Caso 04**: `PROBLEMA FUERTEMENTE REFORZADO —
CRITERIOS DE RECLASIFICACIÓN TODAVÍA ABIERTOS.`

Pregunta que sigue sin resolverse: ¿cuándo una cuenta comercial permanece
como capital de trabajo (NWC) operativo y cuándo adquiere naturaleza
financiera? Grupo Éxito demuestra que pueden coexistir, en el mismo
saldo: origen comercial, proveedor, anticipación bancaria elegida por el
proveedor, extensión adicional de plazo concedida mediante instituciones
financieras, y presentación contable comercial. **No se concluye
automáticamente. No se automatiza.** Esta es ya la tercera instancia de
la misma familia de pregunta (Tecnoglass: supplier finance; Terpel: plazo
ampliado con Ecopetrol como proveedor; Grupo Éxito: convenios de pronto
pago con instituciones financieras) — cada vez con un mecanismo distinto,
sin que ninguna instancia por sí sola resuelva el criterio general.

## 24. Leases (estado consolidado)

**Estado**: `PROBLEMA DEMOSTRADO — TRATAMIENTO DE VALORACIÓN NO
GENERALIZADO.`

Grupo Éxito muestra: pasivo IFRS 16, derecho de uso, principal, interés,
posible renta variable, arrendamientos de corto plazo y de bajo valor, y
un rol simultáneo como arrendador en el negocio inmobiliario. **No se
concluye `lease = deuda` ni `lease = operación`.** La metodología
financiera de tratamiento requiere revisión experta posterior.

## 25. CAPEX (guardrails)

Se mantienen, reforzados por cuarta vez: **no** usar `CAPEX = % de
ingresos` como metodología universal; **no** imponer universalmente la
clasificación binaria `maintenance CAPEX / growth CAPEX`. Grupo Éxito
añade categorías propias: expansión, remodelaciones, conversiones,
innovación, omnicanalidad, transformación digital, mantenimiento, TI,
logística, inmobiliario, y cierres — sin que esta lista se declare
taxonomía universal (ver R7, §20).

## 26. Normalizaciones

Se mantiene sin cambios la regla vigente desde el Caso 01: partida
reportada → posible ajuste → motivo → evidencia → recurrente/no
recurrente → importe propuesto → responsable → aprobación → importe
normalizado — **nunca sobrescribir lo reportado**. Las ventas de
inventario de proyectos inmobiliarios (§13) pueden ser objeto de
pregunta o normalización si un experto concluye que corresponde — **no
se normalizan automáticamente en este documento**.

## 27. assumption_relations

Grupo Éxito refuerza que el problema existe (§20, R3), y aporta además
evidencia de que una relación puede tener dirección, causalidad inversa,
retroalimentación, y cadenas con mecanismos más ricos que una relación
simple entre dos elementos. **Estado: `PATRÓN OBSERVADO EN CUATRO CASOS
+ DISEÑO TODAVÍA INSUFICIENTEMENTE VALIDADO`.** **No se rediseña. No se
implementa.**

## 28. Preguntas a gerencia (representativas, no exhaustivas)

**Perímetro y atribución**

1. ¿Cuál es el mecanismo contractual detrás de las estructuras "Viva"
   con NCI de 73,99%?
2. ¿Cómo gestiona Grupo Éxito su relación económica con los negocios
   conjuntos (Tuya, Puntos Colombia, Sara ANV) más allá de la
   participación del 50%?
3. ¿Existen restricciones sobre el uso de caja o distribuciones desde
   las estructuras con NCI materiales?

**Supplier financing**

4. ¿Qué proporción del saldo de convenio (COP 519.145 millones) responde
   a anticipación elegida por el proveedor vs. extensión de plazo
   negociada por Grupo Éxito?
5. ¿Existe un límite o política interna sobre el uso de estos convenios?
6. ¿Cómo ha evolucionado el saldo de convenio en los últimos periodos?

**Leases**

7. ¿Qué proporción del pasivo por arrendamiento corresponde a contratos
   con renta variable?
8. ¿Cuáles son los términos típicos de renovación a 13 años de plazo
   remanente promedio?
9. ¿Qué ingresos genera Grupo Éxito como arrendador, y qué proporción
   del inmobiliario los genera?

**Inmobiliario**

10. ¿Qué metodología y supuestos sustentan el valor razonable revelado
    de COP 4.547.703 millones?
11. ¿Ese valor razonable considera o no los flujos de arrendamiento ya
    proyectados operativamente?
12. ¿Qué parte del portafolio inmobiliario está dentro de estructuras
    con NCI materiales?

**Ingresos**

13. ¿Cómo se reconoce y factura la venta de participaciones de proyectos
    inmobiliarios?
14. ¿Qué margen y ciclo de caja tiene el negocio inmobiliario frente al
    retail?

**CAPEX**

15. ¿Cómo define management el retorno esperado de la inversión en
    omnicanalidad y transformación digital?
16. ¿Cuál es el criterio para decidir remodelar vs. cerrar una tienda?
17. ¿Qué CAPEX mínimo se requiere para sostener la red actual de
    tiendas?

**Propiedad dinámica (Grupo Disco Uruguay)**

18. ¿Existen opciones similares (put/call) sobre otras participaciones
    no controladoras del grupo?
19. ¿Cuáles son los términos y el plazo de la opción remanente sobre el
    7,69% de NCI en Grupo Disco Uruguay?

**Hiperinflación / Argentina**

20. ¿Cómo afecta la reexpresión NIC 29 a la comparabilidad de márgenes
    entre Argentina y el resto del grupo?
21. ¿Qué impacto cambiario adicional existe entre el peso argentino y el
    peso colombiano más allá del ajuste por hiperinflación?

**Temporalidad / Argentina 2026**

22. ¿Qué activos y pasivos de la operación argentina permanecen en el
    perímetro consolidado después de junio de 2026?
23. ¿Cómo cuantifica la compañía el efecto de comparabilidad que ella
    misma reconoce en el informe de 2T26?

Estas preguntas siguen el mismo flujo confirmado en los tres casos
previos:

```
hecho → desconocido/evidencia insuficiente → pregunta → respuesta/
evidencia futura → eventual decisión
```

Ninguna de estas preguntas se responde en este documento.

## 29. Preguntas metodológicas que permanecen abiertas

Preservadas explícitamente, sin resolución en este documento:

- Diseño final de `scope`.
- Diseño final de `purpose` (ahora con evidencia algo más fuerte, ver
  §20 R6, pero todavía sin diseño).
- Si `assumption_relations` necesita representar dirección, causalidad
  inversa, retroalimentación o cadenas más ricas que una relación
  simple.
- Supplier financing — tercera instancia de la misma familia de pregunta
  (§23), sin criterio general todavía.
- Umbral de materialidad para exigir descomposición (`account_components`),
  ahora con la cautela adicional de que más granularidad no es
  automáticamente mejor análisis (§20, R4).
- Tratamiento de leases cuando el mismo grupo es simultáneamente
  arrendatario y arrendador (§11, §24).
- Cómo representar, sin doble conteo, una diferencia material entre
  valor en libros y valor razonable de un activo (§12).
- Comparabilidad/perímetro — ahora `PROBLEMA DEMOSTRADO EN MÚLTIPLES
  ECONOMÍAS` (§21), sin solución de diseño.
- Candidato A (neteo) — sigue con evidencia de un solo caso (§22).
- Candidato B (ciclo de vida económico) — ahora con evidencia de dos
  casos de naturaleza muy distinta, formulación general todavía abierta
  (§22).
- Candidato C (atribución temporal/corte de conocimiento) — ahora
  `PROBLEMA METODOLÓGICO RESPALDADO POR MÚLTIPLES CASOS`, requiere
  definir principios antes de diseñar representación (§22).
- Candidato D (derechos económicos/propiedad dinámica) — nuevo, evidencia
  de un solo caso (§22).
- Candidato E (base de medición/régimen monetario) — nuevo, evidencia de
  un solo caso (§22).

Ninguna de estas preguntas se resuelve en este documento.

## 30. Qué NO se creó como candidato nuevo

Para evitar sobreingeniería, este documento **no** crea candidatos
independientes para fenómenos que, aunque reales y documentados, se
absorben dentro de reglas o candidatos ya existentes:

- Fidelización (§17) — absorbido en R1 y R7.
- Principal/agente (§18) — descartado explícitamente por falta de
  materialidad declarada por la propia compañía.
- Ventas inmobiliarias (§13) — absorbido en R1 y R4.
- Productividad por metro cuadrado — absorbido en R7 como posible
  driver, no como candidato metodológico.
- Diferentes métodos de impairment — absorbido en R6 (`purpose`).
- E-commerce — no apareció con evidencia material específica en el
  material de trabajo de este caso (`EVIDENCIA INSUFICIENTE`).
- Formatos de tienda — absorbido en R7 y en el mapa económico (§6), sin
  candidato propio.
- Real estate como categoría universal — absorbido en R1, R4 y en
  comparabilidad/perímetro (§21), sin convertirse en candidato aparte.

## 31. Qué NO puede concluirse todavía / qué no produce este caso

El Caso 04 **no produce valoración**. Queda explícito que **no se
calcularon ni aprobaron**: Enterprise Value, Equity Value, precio por
acción, WACC definitivo, g definitiva, ni horizonte definitivo para
Grupo Éxito. Este documento **no presenta escenarios de valoración**.
Velarix continúa buscando **una** conclusión profesional principal de
valor, cuando exista un encargo real y aprobación experta — no tres
escenarios equivalentes.

Adicionalmente:

- No se puede concluir si el saldo del convenio con proveedores (§9)
  debe tratarse como NWC operativo o como deuda financiera.
- No se puede concluir el tratamiento metodológico final de los leases
  (§11, §24).
- No se puede concluir cómo, ni si, incorporar la diferencia entre valor
  en libros y valor razonable del inmobiliario a una valoración (§12).
- No se puede concluir un diseño final para `scope`, `purpose`,
  `assumption_relations` enriquecidas, comparabilidad/perímetro, ni
  ninguno de los cinco candidatos (A–E).
- No se puede concluir que los negocios, drivers o mecanismos de Grupo
  Éxito apliquen a cualquier otra empresa de retail, ni siquiera a otro
  operador multiformato o multigeografía.
- No se puede concluir que las ocho reglas R1–R8 estén completas o sean
  definitivas — ahora provienen de cuatro casos, no de tres, pero cuatro
  casos siguen sin ser una ley universal.

## 32. Conclusión metodológica

Con cuatro casos independientes (Tecnoglass, Terpel, Ecopetrol, Grupo
Éxito), el estado de cada regla queda así — se evita deliberadamente un
conteo agregado tipo "cinco de ocho" o "seis de ocho", porque un conteo
de ese tipo puede ocultar diferencias reales de madurez entre reglas:

- **R1, R2, R7 y R8** reaparecen de forma transversal e idéntica:
  `PATRÓN OBSERVADO EN CUATRO CASOS`.
- **R3**: su núcleo conceptual —que existen relaciones materiales entre
  supuestos— es también `PATRÓN OBSERVADO EN CUATRO CASOS` (§20), pero
  el diseño de `assumption_relations` sigue **insuficientemente
  validado** (evidencia nueva de causalidad inversa y retroalimentación,
  no solo de cadenas más largas) — por eso su estado completo es
  `PATRÓN OBSERVADO EN CUATRO CASOS + DISEÑO INSUFICIENTEMENTE
  VALIDADO`, no una simple ausencia de la lista transversal.
- **R4**, en su formulación base, es igualmente `PATRÓN OBSERVADO EN
  CUATRO CASOS`; su extensión candidata hacia cifras netas/movimientos
  (Candidato A) sigue sin evidencia transversal suficiente para
  modificar la formulación.
- **R5** sobrevive y se profundiza — este documento no le asigna una
  etiqueta transversal formal, porque §20 no la definió para R5.
- **R6** sobrevive incompleto; `scope` y `purpose` mantienen sus estados
  específicos (ver más abajo), sin fusionarse entre sí.

Ninguna de estas ocho reglas se declara ley universal por haber
reaparecido en cuatro casos — es, hasta ahora, el nivel de evidencia más
alto que Velarix ha registrado, **explícitamente no una ley universal**.
`purpose` sube un nivel de madurez sin alcanzar a `scope`; `scope` se
mantiene sin nueva evidencia que lo eleve más allá de lo ya alcanzado en
el Caso 03.

Grupo Éxito refuerza dos candidatos heredados de Ecopetrol de forma
desigual: Candidato B (ciclo de vida económico) sube a evidencia de dos
casos de naturaleza muy distinta; Candidato C (atribución temporal/corte
de conocimiento) sube a "problema metodológico respaldado por múltiples
casos"; Candidato A (neteo) **no** recibe evidencia nueva y se mantiene
sin elevar. Grupo Éxito aporta además dos candidatos completamente
nuevos — Candidato D (derechos económicos/propiedad dinámica) y
Candidato E (base de medición/régimen monetario) — ambos con evidencia
fuerte de un solo caso, explícitamente **no** como reglas nuevas R9–R11.

Comparabilidad/perímetro histórico deja de ser un problema demostrado en
una sola economía y pasa a ser un **problema demostrado en múltiples
economías**, con evidencia directa e independiente en Ecopetrol (ISA) y
en Grupo Éxito (estructuras "Viva", JVs, y el cambio de perímetro de
Argentina reconocido por la propia compañía) — pero sigue sin evidencia
suficiente para diseñar una solución general.

**Una conclusión válida y honesta de este caso es**: el Expediente V1
sobrevive conceptualmente al Caso 04 — ninguna de sus entidades o
principios centrales resultó refutado — pero **todavía no está listo
para congelarse como arquitectura**. Ninguno de estos hallazgos autoriza,
por sí mismo, ningún cambio técnico — ver §33.

## 33. Prohibición explícita de interpretar el documento como autorización de implementación

**CASO 04 NO AUTORIZA IMPLEMENTACIÓN.** Ni el Caso 01, ni el Caso 02, ni
el Caso 03, ni el Caso 04, ni ninguno de sus reportes de contraste, ni
ninguna actualización del Expediente basada en ellos, constituyen
autorización para implementar ninguna estructura técnica: tablas, SQL,
migraciones, schemas, UI, motores, Edge Functions, automatizaciones,
persistencia, coherence engine, decomposition engine, grafo causal,
`case_perimeter`, `contracts`, `economic_period`, `economic_lifecycle`,
`measurement_basis`, ni ningún otro cambio runtime. Solo Nicolás/fundador
puede autorizar implementación, de forma explícita y separada, caso por
caso.

**Este documento declara el Caso Público 04 — Grupo Éxito FORMALMENTE
CERRADO Y CONGELADO**, tras la revisión humana correspondiente. Este
cierre aplica exclusivamente al caso de estudio y a su reporte de
contraste — **no cierra R1–R8, no cierra la metodología, no cierra los
Bloques 1B ni 1C, no congela el Expediente como arquitectura, y no
cierra ninguno de los Candidatos A–E**, que permanecen abiertos como
candidatos. Los asuntos pendientes de este caso se llevarán a casos
posteriores y a la consolidación prevista después del Caso 06.
