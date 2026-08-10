# Caso Público 03 — Ecopetrol — V0

**Fecha:** 2026-08-10
**Estado: CASO PÚBLICO 03 — ECOPETROL: FORMALMENTE CERRADO Y
CONGELADO.** Versión V0. No es una valoración. No autoriza implementación
de ningún cambio al Expediente. No produjo Enterprise Value, Equity
Value, precio por acción, WACC definitivo, g definitiva ni horizonte
definitivo. El análisis metodológico de este caso terminó: el caso queda
congelado y no debe reabrirse salvo nueva evidencia concreta, una
contradicción documental real, o una pregunta explícita del fundador. El
reporte de contraste (`REPORTE-CONTRASTE-EXPEDIENTE-V1.md`, esta misma
carpeta) tampoco constituye autorización de implementación; cualquier
implementación requiere autorización explícita y separada del fundador.

**CASO 03 NO AUTORIZA IMPLEMENTACIÓN.** Ningún hallazgo, hipótesis,
candidato o patrón de este documento constituye autorización para crear
tablas, migraciones, schemas, UI, motores, Edge Functions,
automatizaciones ni ningún otro cambio técnico. Solo Nicolás/fundador
puede autorizar implementación, de forma explícita y separada.

---

## 1. Identificación del caso

- **Caso:** Caso Público 03 — Ecopetrol.
- **Posición en la secuencia:** tercer caso de estudio manual, después de
  Caso 01 (Tecnoglass, cerrado y congelado) y Caso 02 (Organización
  Terpel, formalmente cerrado).
- **Insumos previos leídos antes de escribir este documento:**
  `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`,
  `docs/velarix/casos/01-tecnoglass/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`,
  `docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md`,
  `docs/velarix/casos/02-terpel/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`,
  `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`.
- **No se reanaliza ni se recalcula ningún elemento de los Casos 01 o
  02** — se citan únicamente para contraste.

## 2. Objetivo del caso

Este caso **no busca practicar otra valoración**. Busca **tensionar y,
donde corresponda, refutar** lo aprendido en Tecnoglass y Terpel, con una
tercera economía deliberadamente distinta: un grupo empresarial
multinegocio, intensivo en activos de largo plazo con obligaciones de
cierre de vida útil, con consolidación de una subsidiaria no
enteramente controlada (ISA), y con mecanismos regulatorios/contractuales
(reservas bajo contratos ANH, Fondo de Estabilización de Precios de los
Combustibles — FEPC) que ni Tecnoglass ni Terpel mostraron.

Regla explícita, vigente desde el Caso 02 y confirmada aquí: **dos casos
muestran patrones; dos casos no crean leyes universales.** Con este
tercer caso, donde una conclusión reaparece de forma transversal e
idéntica en los tres, se documenta prudentemente como `PATRÓN OBSERVADO
EN TRES CASOS` — nunca como `CONFIRMADO`, y nunca como ley universal.

## 3. Límites del ejercicio

- No se calcula Enterprise Value, Equity Value ni precio por acción.
- No se elige un WACC, un crecimiento terminal (g), ni un horizonte
  explícito numérico.
- No se completa ningún dato faltante con un valor por defecto, ni con
  una cifra tomada de Tecnoglass, de Terpel, de un comparable, o de
  cualquier fuente externa no entregada para este caso.
- No se trata ningún hallazgo de este caso como regla universal aplicable
  a cualquier empresa o sector.
- No equivale a due diligence, auditoría, ni opinión profesional de
  valor.
- No se acusa a Ecopetrol, a su administración ni a ningún tercero de
  ninguna irregularidad fiscal, contable o regulatoria — donde el
  material de trabajo describe un mecanismo (ej. revisión de reservas
  asociada a un contrato con la ANH), este documento lo registra como
  fenómeno a entender, no como juicio de valor.
- Ecopetrol es una empresa mixta, listada, con obligaciones de reporte
  regulatorio superiores a las de una PYME colombiana típica — este caso
  no asume que una PYME real tendrá información de esta granularidad;
  ayuda, igual que Tecnoglass y Terpel, a entender qué preguntar a una
  empresa que reporte de forma más simple.
- Éxito de este caso **no** significa que los negocios, mecanismos o
  supuestos de Ecopetrol apliquen a cualquier otra empresa del sector
  energía/hidrocarburos, ni que tres casos sean suficientes para declarar
  cerrada ninguna de las ocho reglas R1–R8.

## 4. Período analizado

**Período financiero base: FY2025, con cierre al 31 de diciembre de
2025.** Este es el período sobre el que versan las cifras y hallazgos
documentados en este caso, salvo donde se indique explícitamente lo
contrario (ej. montos recibidos durante 2025 correspondientes a un saldo
causado en 2024, ver §9).

Este mismo período introduce un hallazgo metodológico propio del caso
(§16): parte de la información pública correspondiente a FY2025 fue
publicada durante 2026, y pueden existir hechos conocidos por el mercado
después del cierre contable — el período financiero analizado, la fecha
de valoración y la fecha en que la información estuvo disponible no son
necesariamente la misma fecha.

## 5. Procedencia y naturaleza de la evidencia

**Fuente de trabajo:** síntesis analítica proporcionada a esta ejecución,
elaborada previamente a partir de información pública de Ecopetrol
correspondiente a FY2025. Esta ejecución documental no realizó una
verificación independiente adicional de las fuentes originales, ni hizo
scraping ni descarga automatizada. Las cifras citadas en este documento
(reservas, reposición, vida media, impairment, saldo FEPC, cobros FEPC,
porcentaje de control de ISA) se reproducen tal como fueron entregadas
a esta ejecución, descritas como aproximadas donde corresponde, sin
recalcularlas ni completarlas con supuestos adicionales.

**No se atribuye a Nicolás/fundador la recopilación personal de esta
información** — el flujo real fue: (1) un análisis manual del caso,
realizado antes de esta ejecución de Claude Code, con información pública
de Ecopetrol; (2) la síntesis de ese análisis fue entregada a esta
ejecución mediante instrucciones; (3) esta ejecución no verificó de forma
independiente las fuentes originales de esa síntesis.

Donde el material de trabajo no incluyó una cifra o un detalle, este
documento no la completa — queda registrada explícitamente como
`DESCONOCIDO`.

## 6. Descripción económica resumida de Ecopetrol y sus principales negocios

`HECHO DOCUMENTADO` (según la síntesis analítica recibida por esta
ejecución, sin verificación independiente adicional de las fuentes
originales): Ecopetrol es un grupo empresarial que combina, al menos, las
siguientes economías materialmente distintas bajo un mismo grupo
consolidado:

- Exploración y producción (E&P) de hidrocarburos.
- Transporte / logística de hidrocarburos.
- Refinación / petroquímica.
- Gas y energías para la transición energética.
- ISA: transmisión eléctrica, concesiones viales (carreteras) y
  telecomunicaciones — negocio materialmente distinto al de
  hidrocarburos, consolidado dentro del mismo grupo sin ser
  100% propiedad de Ecopetrol (ver §13).

**Conclusión metodológica**: igual que Terpel no debía reducirse a
`galones × precio`, Ecopetrol **no** debe reducirse a un único driver de
"barriles equivalentes de petróleo × precio". La coexistencia de E&P,
transporte, refinación, gas/transición e ISA dentro de un mismo grupo
consolidado tensiona la idea de aplicar un único conjunto de drivers,
un único WACC o un único horizonte a todo el grupo — sin que este
documento decida si eso implica, para Velarix, un enfoque de suma de
partes (`HIPÓTESIS`, no autorizada ni diseñada aquí, ver §20).

Mapa económico conceptual (específico de Ecopetrol, no plantilla
universal — ver §17, R7):

```
Negocios (E&P, Transporte/Logística, Refinación/Petroquímica,
Gas/Transición, ISA)
        │
        ▼
Reservas / activos de largo plazo específicos por negocio
        │
        ├──► Reposición y agotamiento (E&P) — mecanismos geológicos,
        │     operativos, contractuales/regulatorios y de precio (§8)
        ├──► CAPEX orgánico distribuido por negocio y naturaleza
        │     económica (§10)
        ├──► Impairment / reversiones por línea de negocio, que pueden
        │     netearse a nivel de grupo (§11)
        ├──► Provisión de abandono / desmantelamiento al final de la
        │     vida útil de ciertos activos (§12)
        ├──► FEPC — desacople entre período económico, reconocimiento y
        │     caja (§9)
        └──► Operaciones intragrupo que pueden desaparecer en
              consolidación sin dejar de ser económicamente relevantes
              (§14)
        │
        ▼
Perímetro consolidado (incluye ISA al ~51,4% de control, con intereses
no controladores materiales) ≠ atribución económica final al accionista
de Ecopetrol (§13)
```

## 7. Evidencia material analizada

Este caso documenta prudentemente, sin verificación independiente
adicional, los siguientes hallazgos analíticos (detalle en §8–§16):

- **A. Multi-negocio estructural** — E&P, transporte, refinación,
  gas/transición e ISA como economías materialmente distintas (§6).
- **B. Reservas y agotamiento** — 1.944,2 MMBOE de reservas probadas al
  cierre de 2025, reposición ≈121%, vida media ≈7,8 años, con
  movimientos originados en mecanismos heterogéneos (§8).
- **C. Impairment y neteo** — deterioro agregado neto aproximadamente
  neutro en 2025, que oculta una reversión de ≈COP 0,3 billones en
  transporte/logística y un deterioro de ≈COP 0,3 billones en E&P (§11).
- **D. FEPC** — ≈COP 3,0 billones por cobrar al cierre de 2025; ≈COP 7,6
  billones recibidos durante 2025 correspondientes al saldo causado en
  2024, mientras un nuevo saldo se causó durante el mismo 2025 (§9).
- **E. Abandono / desmantelamiento** — provisión material asociada al
  cierre de vida útil de ciertos activos (§12).
- **F. CAPEX** — inversión orgánica de 2025 distribuida entre negocios y
  naturalezas económicas distintas, incluso dentro de hidrocarburos
  (§10).
- **G. ISA y perímetro** — control de ≈51,4% de ISA, consolidación
  completa, deuda e intereses no controladores materiales (§13).
- **H. Intragrupo / consolidación** — operaciones económicamente
  relevantes entre segmentos que pueden desaparecer al consolidar (§14).
- **I. Contratos / leases / concesiones / servidumbres** — vehículos
  jurídicos heterogéneos con mecanismos económicos distintos (§15).
- **J. Temporalidad y corte de conocimiento** — desfase entre cierre
  contable, publicación de la información y hechos posteriores (§16).

Ninguno de estos hallazgos produce, por sí mismo, una cifra de valor —
son evidencia para tensionar el Expediente (§17, §18), no insumos de
cálculo.

## 8. Reservas y agotamiento

`HECHO DOCUMENTADO` (según la síntesis recibida, cifras aproximadas, sin
verificación independiente adicional): al cierre de 2025 Ecopetrol
reportó aproximadamente 1.944,2 MMBOE de reservas probadas, con una
reposición 2025 de aproximadamente 121% y una vida media de reservas de
aproximadamente 7,8 años. Parte del movimiento de reservas provino de
revisiones relacionadas con elementos contractuales/regulatorios,
incluyendo contratos con la Agencia Nacional de Hidrocarburos (ANH).

**Conclusión analítica de este caso**: una variación de una métrica de
reservas puede originarse en mecanismos económicos distintos entre sí —
geología, producción, recuperación técnica, contratos, regulación,
derechos económicos, precios de referencia, o cambios de metodología de
medición. `REGLA EXPLÍCITA DE ESTE CASO`: **no interpretar
automáticamente** "las reservas subieron" como sinónimo de
"descubrimiento" o de "mejor desempeño operativo" — cada movimiento
necesita su propio mecanismo documentado antes de asumir una causa.

Esto es una instancia directa, con un mecanismo distinto, de R1
(contabilidad ≠ economía) y de R7 (drivers específicos por empresa): el
"driver" reservas no es un único número que sube o baja por una sola
razón, sino un agregado de movimientos con mecanismos heterogéneos (ver
§17).

`DESCONOCIDO` en este documento: el desglose cuantitativo de cuánto de
la reposición de 2025 corresponde a cada mecanismo (geología, producción,
contrato/regulación, precio, metodología) — el material de trabajo no
lo desagrega, y este documento no lo estima.

**Preguntas a gerencia**: ver §19.

## 9. FEPC

`HECHO DOCUMENTADO` (según la síntesis recibida, cifras aproximadas, sin
verificación independiente adicional): al cierre de 2025 Ecopetrol tenía
aproximadamente COP 3,0 billones por cobrar al Fondo de Estabilización de
Precios de los Combustibles (FEPC). Durante 2025 recibió aproximadamente
COP 7,6 billones correspondientes al saldo causado en 2024, mientras
durante el mismo 2025 se causó un nuevo saldo (cuyo monto exacto el
material de trabajo de este caso no desagrega — `DESCONOCIDO`).

**Cadena temporal identificada**:

```
período económico en que se origina el derecho (venta a precio regulado)
  ≠ necesariamente
período de reconocimiento contable del derecho
  ≠ necesariamente
período de caja (cuándo efectivamente se recibe el pago del FEPC)
```

**Regla explícita de este caso**: el cobro de ≈COP 7,6 billones en 2025
corresponde a un saldo *causado en 2024* — es decir, el flujo de caja
observado en un período no describe la actividad económica de ese mismo
período. `REGLA EXPLÍCITA`: **no proyectar mecánicamente el CFO
observado** de un período como si representara el desempeño económico de
ese mismo período cuando existe un mecanismo de desfase documentado como
el FEPC.

Esto refuerza directamente R2 (observado ≠ normalizado ≠ proyectado),
con un mecanismo — desfase entre causación y cobro de un derecho frente a
un fondo de estabilización — que ni Tecnoglass ni Terpel mostraron de
forma tan explícita (ver §17).

**Preguntas a gerencia**: ver §19.

## 10. CAPEX

`HECHO DOCUMENTADO` (según la síntesis recibida, nivel estructural, sin
verificación independiente adicional): la inversión orgánica de 2025
estuvo distribuida entre distintos negocios y naturalezas económicas —
hidrocarburos, gas/transición, transmisión eléctrica/carreteras (ISA) —
y, dentro de hidrocarburos, existían a su vez inversiones de naturalezas
distintas entre sí (el material de trabajo no las desagrega en detalle
— `DESCONOCIDO` el desglose exacto).

**Conclusión metodológica (coincide con Tecnoglass §7 y Terpel §8)**:
`CAPEX = % de ingresos` **no** es metodología defendible para Ecopetrol
— tercer caso independiente con el mismo patrón, evidencia distinta.

**Regla explícita, coherente con Terpel §8**: **no imponer todavía** una
clasificación universal binaria `maintenance CAPEX / growth CAPEX`. Con
Ecopetrol, la pregunta se complica adicionalmente porque coexisten, al
menos, cuatro naturalezas de inversión potencialmente distintas:
mantenimiento de infraestructura existente, expansión/reposición de
reservas, transición energética (con lógica de opcionalidad estratégica
y regulatoria, ya observada de forma distinta en Terpel — movilidad
eléctrica, parque solar), y expansión de negocios no petroleros (ISA).

**Preguntas a gerencia**: ver §19.

## 11. Impairment y neteo

`HECHO DOCUMENTADO` (según la síntesis recibida, cifras aproximadas, sin
verificación independiente adicional): en 2025 el deterioro agregado neto
de activos de largo plazo fue aproximadamente neutro a nivel de grupo,
pero ese neto agregaba, al menos, una reversión de aproximadamente COP
0,3 billones en transporte/logística y un deterioro de aproximadamente
COP 0,3 billones en exploración y producción — mecanismos económicos
distintos entre sí (una reversión responde a una mejora de expectativas
sobre un activo previamente deteriorado; un deterioro nuevo responde a un
empeoramiento de expectativas sobre otro activo).

**Hallazgo candidato de este caso**: una cifra neta matemáticamente
correcta (el impairment neto ≈0 del grupo) puede ocultar movimientos
materiales de naturaleza económica opuesta entre sí. Ver Candidato A —
neteo (§18).

**Regla explícita**: este documento no concluye que el neteo sea
incorrecto ni que deba prohibirse en el reporte financiero de Ecopetrol
— la contabilidad consolidada neteando es un hecho, no un error. Lo que
este caso documenta es que, **para efectos de análisis y valoración**,
Velarix no puede tratar la cifra neta como suficiente sin preguntar qué
movimientos brutos la componen y si tienen mecanismos económicos
distintos.

**Preguntas a gerencia**: ver §19.

## 12. Abandono / desmantelamiento

`HECHO DOCUMENTADO` (según la síntesis recibida, a nivel conceptual, sin
cifra específica en el material de trabajo de este caso — `DESCONOCIDO`
el monto): existe una provisión material asociada a obligaciones de
abandono y desmantelamiento de ciertos activos de Ecopetrol.

**Hallazgo conceptual**: algunos activos no solo requieren inversión
inicial, mantenimiento y reposición durante su vida útil — también
generan una obligación económica al final de esa vida útil (cierre,
desmantelamiento, restauración). Esto no apareció con esta claridad ni
en Tecnoglass ni en Terpel.

**Esto tensiona, sin resolver**: el criterio de estado estable (¿qué
significa "estado estable" para un activo cuya vida económica tiene un
final conocido y un costo asociado a ese final?), el horizonte explícito,
la relación entre CAPEX y agotamiento/reposición, y el flujo terminal —
todas preguntas metodológicas ya abiertas antes de este caso (ver §4 del
contexto previo), ahora con evidencia adicional.

**No se crea una tabla de ciclo de vida (lifecycle) en este
documento.** Ver Candidato B — ciclo de vida económico (§18).

**Preguntas a gerencia**: ver §19.

## 13. ISA, consolidación, NCI y perímetro

`HECHO DOCUMENTADO` (según la síntesis recibida, sin verificación
independiente adicional): Ecopetrol controla aproximadamente 51,4% de
ISA (Interconexión Eléctrica S.A.), no el 100%, pero consolida sus
cifras íntegramente en los estados financieros del grupo. Una porción
material de la deuda consolidada del grupo corresponde a ISA. Existen
intereses no controladores (NCI, non-controlling interests) materiales
asociados a la porción de ISA no poseída por Ecopetrol.

**Regla explícita de este caso**: perímetro consolidado ≠ automáticamente
atribución económica final al accionista de Ecopetrol. Una cifra
consolidada (ingresos, EBITDA, deuda, activos) de ISA aparece 100%
dentro del grupo Ecopetrol, pero económicamente una porción de ese valor
pertenece a los NCI, no a los accionistas de Ecopetrol. El puente futuro
entre operaciones/flujos consolidados, deuda consolidada, Enterprise
Value y Equity Value **requiere** comprensión precisa del perímetro y de
la atribución entre controladora y NCI — este documento no construye ese
puente, solo documenta que es necesario.

**Cambio de estado para comparabilidad/perímetro histórico** (pregunta
que venía abierta desde el Caso 02, §12 de `CASO-02-TERPEL-V0.md`):

Antes de este caso:
`EVIDENCIA INSUFICIENTE PARA DISEÑAR SOLUCIÓN — VALIDAR EN CASOS
FUTUROS`.

Después de Ecopetrol:
`PROBLEMA DEMOSTRADO; EVIDENCIA INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN
GENERAL.`

Es decir: Ecopetrol convierte una hipótesis débil (Terpel solo sugería
que adquisiciones/reclasificaciones/consolidación *podrían* afectar
comparabilidad, sin evidencia concreta) en un problema demostrado con
evidencia directa (ISA consolidada al 100% con solo 51,4% de control
económico, NCI materiales, deuda material atribuible parcialmente a
terceros). **Esto no significa que exista todavía una solución de
diseño** — sigue sin evidencia suficiente para diseñar `case_perimeter`
ni ninguna estructura (ver §20, §22).

**Preguntas a gerencia**: ver §19.

## 14. Operaciones intragrupo

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida, sin
cifras específicas en el material de trabajo — `DESCONOCIDO` el detalle
cuantitativo): existen operaciones económicamente relevantes entre los
distintos segmentos de Ecopetrol (ej. transporte interno de
hidrocarburos entre E&P y refinación, u otras relaciones intragrupo) que
desaparecen contablemente al consolidar los estados financieros del
grupo.

**Hallazgo explícito de este caso**: que una operación desaparezca en
consolidación no significa que deje de explicar la economía de los
negocios subyacentes. Un negocio de transporte interno, por ejemplo,
puede tener una economía propia (capacidad, tarifas internas, utilización)
que resulta invisible en el estado financiero consolidado, pero que
sigue siendo relevante para entender cada negocio por separado — sobre
todo si Ecopetrol llegara a analizarse con un enfoque de suma de partes
(`HIPÓTESIS`, no autorizada ni diseñada en este documento, ver §6, §20).

**Regla explícita**: **no se concluye** que Velarix deba reconstruir
automáticamente todas las operaciones intragrupo de cada caso — sería
sobreingeniería sin evidencia de que sea necesario para la mayoría de
los casos. Se registra únicamente que, cuando un negocio se estudie
individualmente dentro de un grupo multinegocio, la ausencia de
información intragrupo es una limitación a documentar explícitamente,
no a ignorar silenciosamente.

**Preguntas a gerencia**: ver §19.

## 15. Contratos / leases / concesiones / servidumbres

`HECHO DOCUMENTADO` (a nivel conceptual, según la síntesis recibida, sin
inventario específico en el material de trabajo de este caso —
`DESCONOCIDO` el detalle): Ecopetrol contiene distintos vehículos
jurídicos con derechos económicos de naturaleza diferente entre sí —
por ejemplo, contratos de exploración/producción con la ANH, concesiones
viales de ISA, arrendamientos (leases) de infraestructura, y
posiblemente servidumbres u otros derechos de paso necesarios para
transporte/transmisión.

**Conclusión metodológica de este caso**: "contrato" describe el
vehículo jurídico que documenta un derecho u obligación, **no
necesariamente el mecanismo económico** subyacente. Un contrato ANH, una
concesión vial y un lease de infraestructura pueden compartir la palabra
"contrato" en sentido amplio, pero implican mecanismos económicos, de
riesgo, de plazo y de reversión (o no) completamente distintos.

**Regla explícita, coherente con Terpel §9**: **no se crea una entidad
universal `contracts`. No se establece un tratamiento universal de
leases.** Ni Tecnoglass, ni Terpel, ni Ecopetrol demuestran todavía que
estos vehículos jurídicos heterogéneos requieran una estructura técnica
común — por ahora, cada uno puede documentarse con evidencia, preguntas,
contexto y supuestos ya previstos en la especificación vigente.

**Preguntas a gerencia**: ver §19.

## 16. Temporalidad y corte de conocimiento

`HECHO DOCUMENTADO`: el período financiero estudiado en este caso
termina el 31 de diciembre de 2025, pero ciertos documentos públicos
correspondientes a FY2025 fueron publicados durante 2026. Adicionalmente,
pueden existir hechos conocidos por el mercado después del cierre
contable que no estaban reflejados en las cifras de cierre.

**Nueva pregunta metodológica que aparece con este caso** (no apareció
con esta claridad ni en Tecnoglass ni en Terpel, cuyos materiales de
trabajo no distinguían explícitamente estas fechas entre sí):

¿Debe el Expediente distinguir explícitamente entre:

- fecha de valoración (a qué momento se valora la empresa);
- período financiero analizado (a qué cierre corresponden las cifras
  base);
- fecha económica del hecho (cuándo ocurrió económicamente un evento,
  ej. cuándo se causó un derecho al FEPC);
- fecha de reconocimiento (cuándo se registró contablemente);
- fecha de caja (cuándo hubo un movimiento de efectivo);
- fecha en que la información se conoció (cuándo estuvo disponible para
  quien analiza)?

**No se crea `economic_period` ni ningún campo nuevo en este
documento.** Se registra como Candidato C (§18), una pregunta
metodológica nueva que requiere más casos y, después, criterio experto —
no una estructura a diseñar todavía.

**Preguntas a gerencia**: ver §19.

## 17. Contraste formal R1–R8 (resultado del Caso 03)

Regla rectora, igual que en el contraste del Caso 02: `PATRÓN OBSERVADO
EN TRES CASOS` se usa **solo** donde la evidencia de Tecnoglass, Terpel y
Ecopetrol es realmente transversal — nunca como sinónimo de regla
universal, y nunca por aplicación automática.

- **R1 — Contabilidad ≠ economía.** `SOBREVIVE — FUERTEMENTE REFORZADA.`
  Ecopetrol lo muestra con mecanismos propios: reservas cuyo movimiento
  agregado esconde causas heterogéneas (§8); impairment neto que oculta
  una reversión y un deterioro de naturaleza opuesta (§11); perímetro
  consolidado de ISA que no equivale a atribución económica al accionista
  de Ecopetrol (§13); operaciones intragrupo que desaparecen contablemente
  sin dejar de ser económicamente relevantes (§14). **Estado
  transversal: `PATRÓN OBSERVADO EN TRES CASOS`** — la misma regla
  reaparece, con evidencia independiente, en Tecnoglass (tarifas fuera de
  Cost of Sales), Terpel (decalaje, contratos) y Ecopetrol (reservas,
  impairment neto, perímetro).
- **R2 — Observado ≠ normalizado ≠ proyectado.** `SOBREVIVE —
  FUERTEMENTE REFORZADA.` El FEPC es la evidencia más directa de este
  caso: el CFO observado de un período incluye cobros originados en un
  período distinto, por lo que observado, normalizado y proyectado deben
  seguir separados, con evidencia y razonamiento propios para cada capa
  (§9). **Estado transversal: `PATRÓN OBSERVADO EN TRES CASOS`**
  (Tecnoglass: working capital y normalizaciones candidatas; Terpel:
  decalaje; Ecopetrol: FEPC).
- **R3 — Los supuestos están relacionados.** `SOBREVIVE, PERO PARECE
  INCOMPLETO.` Ecopetrol aporta cadenas adicionales (ej. reposición de
  reservas → CAPEX de E&P → agotamiento → horizonte hasta estado
  estable; provisión de abandono → flujo terminal), coherentes con las
  cadenas ya vistas en Tecnoglass y Terpel, y con la misma conclusión de
  que podrían ser más ricas que una relación simple entre dos elementos.
  **No se rediseña `assumption_relations` en este documento.** Estado:
  `PATRÓN OBSERVADO EN TRES CASOS + DISEÑO INSUFICIENTEMENTE VALIDADO`.
- **R4 — Descomposición según la dimensión económica relevante.**
  `SOBREVIVE — FUERTEMENTE REFORZADA.` La formulación vigente
  (`docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md` §14) **no se
  reemplaza automáticamente**: *"una partida o variable material puede
  necesitar descomposición según la dimensión que explique su
  comportamiento económico"*. Ecopetrol aporta evidencia consistente con
  dimensiones ya conocidas (negocio: E&P/transporte/refinación/
  gas-transición/ISA) y aporta además evidencia de que la necesidad de
  descomposición puede aparecer no solo en cuentas o partidas, sino
  también en **cifras netas** (impairment neto, §11) y en **movimientos**
  agregados (reservas, §8) — no solo en saldos. **Esto se trata como
  extensión candidata, no como cambio de la formulación de R4** — ver
  Candidato A (§18). La formulación de R4 en sí misma queda: `A VALIDAR
  EN CASOS FUTUROS` en su alcance ampliado a cifras netas y movimientos;
  su formulación base sigue siendo `PATRÓN OBSERVADO EN TRES CASOS`
  (Tecnoglass: Cost of Sales; Terpel: negocios; Ecopetrol: reservas/
  impairment).
- **R5 — Estado de conocimiento explícito.** `SOBREVIVE — SE PROFUNDIZA.`
  Ecopetrol muestra que `DESCONOCIDO` no significa únicamente "falta el
  dato" — puede existir también la situación de "conozco la cifra (ej.
  el impairment neto ≈0), pero todavía no sé cómo interpretarla
  económicamente sin ver sus componentes". **No se crea un nuevo enum
  epistemológico en este documento** — se registra como matiz dentro de
  la clasificación ya vigente (§5.1 del Expediente), no como una
  categoría nueva.
- **R6 — Método de determinación (scope / purpose).** `SOBREVIVE —
  INCOMPLETO.` `scope` (alcance) pasa a **`NECESIDAD CONCEPTUAL
  FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS`**: Ecopetrol refuerza la
  necesidad de saber a qué aplica un supuesto (¿a todo el grupo
  consolidado?, ¿a un negocio?, ¿a la porción atribuible a Ecopetrol
  después de NCI?) — sin definir todavía enum ni implementar nada.
  `purpose` (propósito original de un supuesto) **permanece**:
  `PREGUNTA CONCEPTUAL ABIERTA — EVIDENCIA MENOR QUE SCOPE` — este caso
  no aportó evidencia directa nueva sobre propósito original de una
  cifra específica. **No se fusionan `scope` y `purpose`** — siguen
  siendo dos necesidades conceptuales distintas.
- **R7 — Drivers específicos por empresa.** `SOBREVIVE — FUERTEMENTE
  REFORZADA.` Ecopetrol usa drivers radicalmente distintos de Tecnoglass
  y de Terpel (reservas/agotamiento, FEPC, perímetro de consolidación con
  NCI, provisiones de abandono) — la ausencia de una biblioteca universal
  cerrada de drivers vuelve a observarse ahora en tres economías muy
  distintas entre sí. **Estado transversal: `PATRÓN OBSERVADO EN TRES
  CASOS`.**
- **R8 — Detectar incoherencias sin decidir.** `SOBREVIVE — FUERTEMENTE
  REFORZADA.` Ejemplos conceptuales nuevos, específicos de Ecopetrol:
  reservas que suben sin driver operativo/geológico identificado;
  impairment neto ≈0 sin desagregación de sus componentes brutos; CAPEX
  que cambia de negocio sin explicación operacional vinculada;
  crecimiento proyectado no compatible con reposición de reservas
  declarada; atribución a NCI ausente en una proyección de flujo a
  accionistas de Ecopetrol. Velarix puede detectar neteos, señalar
  incoherencias, formular preguntas, mostrar conflicto de evidencia y
  pedir revisión — **el experto decide**, el sistema no decide ni
  corrige automáticamente. **Estado transversal: `PATRÓN OBSERVADO EN
  TRES CASOS`.**

## 18. Nuevos candidatos A/B/C

Registrados como **candidatos**, explícitamente **no** como principios
universales ni como R9/R10/R11 — ninguna regla nueva se numera junto a
R1–R8 en este documento.

### Candidato A — Neteo

*"El neteo puede destruir información económica relevante."*

Evidencia: el impairment neto ≈0 de 2025 ocultaba una reversión de ≈COP
0,3 billones en transporte/logística y un deterioro de ≈COP 0,3 billones
en E&P, con mecanismos económicos opuestos entre sí (§11).

**Estado: `EVIDENCIA FUERTE EN ECOPETROL — VALIDAR EN CASOS FUTUROS`.**
No se convierte en arquitectura, campo, ni entidad en este documento.

### Candidato B — Ciclo de vida económico

*"Algunas variables o activos tienen un ciclo de vida económico que
importa para la valoración."*

Etapas posibles observadas conceptualmente en este caso (no exhaustivas,
no una taxonomía cerrada): origen/inversión, operación,
mantenimiento/reposición, agotamiento/vencimiento, cierre/abandono.
Evidencia: la provisión de abandono/desmantelamiento (§12) y el patrón
reposición-agotamiento de reservas (§8).

**Estado: `EVIDENCIA FUERTE EN ECOPETROL — VALIDAR EN CASOS FUTUROS`.**
**No se crea `economic_lifecycle`. No se crea tabla.**

### Candidato C — Atribución temporal / corte de conocimiento

La fecha de una cifra, la fecha económica del hecho que la origina, y la
fecha en que la información estuvo disponible para quien analiza pueden
ser distintas entre sí (§9, §16).

**Estado: `NUEVA PREGUNTA METODOLÓGICA — REQUIERE MÁS CASOS Y
POSTERIOR VALIDACIÓN EXPERTA`.** **No se crean campos ni `economic_period`
en este documento.**

## 19. Preguntas que permanecen abiertas

### Preguntas a gerencia (representativas, no exhaustivas)

**Reservas y agotamiento**

1. ¿Cuál es el desglose cuantitativo de la reposición 2025 entre
   geología, producción, contrato/regulación (ej. ANH), precio y
   metodología de medición?
2. ¿Con qué frecuencia y bajo qué criterio se revisan las reservas
   asociadas a contratos regulatorios?
3. ¿Qué parte de la vida media de reservas (≈7,8 años) es representativa
   de todos los campos, y qué tan concentrada está en pocos activos?

**FEPC**

4. ¿Cuál es el mecanismo exacto de causación y cobro del FEPC?
5. ¿Cuál fue el monto exacto causado durante 2025 (no solo lo cobrado)?
6. ¿Existe un patrón histórico de desfase entre causación y cobro, o el
   de 2024–2025 fue atípico?
7. ¿Qué riesgo de cobro (crédito, político, regulatorio) existe sobre el
   saldo por cobrar al FEPC?

**CAPEX**

8. ¿Cómo se distribuye el CAPEX 2025 entre mantenimiento, reposición de
   reservas, transición energética y expansión de ISA?
9. ¿Qué retorno exige management a cada tipo de inversión?
10. ¿Cómo se financia el CAPEX de transición energética frente al CAPEX
    tradicional de hidrocarburos?

**Impairment**

11. ¿Cuáles fueron los activos específicos detrás de la reversión de
    transporte/logística y del deterioro de E&P?
12. ¿Qué supuestos cambiaron para justificar cada movimiento?
13. ¿Con qué frecuencia se revisan los supuestos de deterioro por
    segmento?

**Abandono / desmantelamiento**

14. ¿Cuál es el monto de la provisión de abandono/desmantelamiento y su
    horizonte esperado de desembolso?
15. ¿Qué tasa de descuento y qué supuestos de costo futuro se usan para
    calcular la provisión?
16. ¿Existen activos con obligación de abandono próxima en el tiempo?

**ISA / perímetro**

17. ¿Cuál es la deuda específica de ISA dentro de la deuda consolidada
    del grupo?
18. ¿Cómo se calcula la atribución económica a NCI en la práctica de
    reporte de Ecopetrol?
19. ¿Existen restricciones (covenants, acuerdos de accionistas) sobre el
    uso de caja de ISA por parte de Ecopetrol?

**Intragrupo**

20. ¿Qué operaciones intragrupo son las más materiales entre segmentos?
21. ¿A qué precios de transferencia se registran esas operaciones?

**Contratos / leases / concesiones**

22. ¿Qué vehículos jurídicos (contratos ANH, concesiones ISA, leases,
    servidumbres) son más materiales para el grupo?
23. ¿Qué plazos, condiciones de reversión y obligaciones asociadas tiene
    cada uno?

**Temporalidad**

24. ¿Qué hechos relevantes de FY2025 se conocieron después del cierre
    contable, y cuándo?
25. ¿Cómo distingue management, internamente, entre la fecha de un hecho
    económico y la fecha en que lo reconoce o lo reporta?

### Preguntas metodológicas que siguen abiertas (heredadas y nuevas)

Preservadas explícitamente, sin resolución en este documento:

- Diseño final de `scope`.
- Diseño final de `purpose`.
- Si `assumption_relations` necesita representar dirección, mecanismo o
  cadenas causales más ricas que una relación simple.
- Supplier financing (Tecnoglass) y su segunda instancia, el plazo
  ampliado con Ecopetrol como proveedor de Terpel — **este caso no
  vuelve a analizar esa pregunta desde la perspectiva de Ecopetrol como
  emisor**, permanece igual de abierta que en el Caso 02.
- Cuándo una cuenta comercial sigue siendo NWC operativo y cuándo
  adquiere naturaleza financiera.
- Umbral de materialidad para exigir descomposición.
- Maintenance CAPEX vs. growth CAPEX — ahora con una tercera naturaleza
  observada (inversión estratégica de transición/expansión no
  tradicional).
- Criterio de estado estable — ahora tensionado adicionalmente por
  activos con obligación de abandono al final de su vida útil.
- Evidencia suficiente para aprobar una normalización.
- Comparabilidad/perímetro histórico — **cambia de estado** en este caso
  (ver §13): pasa de `EVIDENCIA INSUFICIENTE PARA DISEÑAR SOLUCIÓN` a
  `PROBLEMA DEMOSTRADO; EVIDENCIA INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN
  GENERAL`.
- Comprensión económica de contratos y arrendamientos — reforzada con
  vehículos jurídicos adicionales (concesiones, servidumbres).
- Nuevo: atribución temporal/corte de conocimiento (Candidato C, §18).
- Nuevo: si el neteo de movimientos económicamente distintos requiere
  algún tratamiento sistemático (Candidato A, §18).
- Nuevo: si el ciclo de vida económico de un activo debe representarse
  de alguna forma (Candidato B, §18).

Ninguna de estas preguntas se resuelve en este documento.

## 20. Cosas que el caso NO demuestra

Debe quedar explícito para evitar sobreingeniería.

Ecopetrol **no** demuestra que Velarix necesite obligatoriamente:

- Suma de partes (SOTP) como metodología obligatoria.
- Múltiples DCF.
- Múltiples WACC.
- Múltiples g.
- Múltiples horizontes.
- Una entidad universal `contracts`.
- `case_perimeter` como estructura técnica.
- Un grafo causal para `assumption_relations`.
- Una taxonomía universal de CAPEX.
- `economic_period` como campo o entidad.
- `economic_lifecycle` como campo, tabla o entidad.
- Un enum universal de `scope`.
- Un tratamiento universal de leases.
- Un coherence engine implementado.
- Un motor automático para normalizaciones.

Tampoco produjo una valoración: no se calculó Enterprise Value, Equity
Value, precio por acción, WACC definitivo, g definitiva ni horizonte
definitivo para Ecopetrol.

## 21. Conclusión metodológica

Con tres casos independientes (Tecnoglass, Terpel, Ecopetrol), cuatro de
las ocho reglas (R1, R2, R7, R8) reaparecen de forma transversal e
idéntica en su formulación — se documentan como `PATRÓN OBSERVADO EN
TRES CASOS`, un nivel de evidencia mayor que "dos casos", pero
**explícitamente no una ley universal**. R3, R5 y R6 se profundizan o se
muestran incompletos, sin que este documento cierre su diseño. R4
sobrevive en su formulación base, pero aporta evidencia de una posible
extensión (a cifras netas y movimientos, no solo partidas/cuentas) que
queda registrada como candidata, no como cambio de especificación.

Ecopetrol aporta, además, tres necesidades conceptuales nuevas —
neteo, ciclo de vida económico, y atribución temporal/corte de
conocimiento — que se registran como candidatos con evidencia fuerte en
un solo caso, explícitamente **no** como reglas nuevas R9–R11.

Comparabilidad/perímetro histórico deja de ser una hipótesis débil y
pasa a ser un **problema demostrado** con evidencia directa (ISA), pero
sigue sin evidencia suficiente para diseñar una solución general.

Ninguno de estos hallazgos autoriza, por sí mismo, ningún cambio técnico
— ver §22.

## 22. Prohibición explícita de interpretar el documento como autorización de implementación

**CASO 03 NO AUTORIZA IMPLEMENTACIÓN.** Ni el Caso 01, ni el Caso 02, ni
el Caso 03, ni ninguno de sus reportes de contraste, ni ninguna
actualización del Expediente basada en ellos, constituyen autorización
para implementar ninguna estructura técnica: tablas, SQL, migraciones,
schemas, UI, motores, Edge Functions, automatizaciones, persistencia,
coherence engine, decomposition engine, grafo causal, `case_perimeter`,
`contracts`, `economic_period`, `economic_lifecycle`, ni ningún otro
cambio runtime. Solo Nicolás/fundador puede autorizar implementación, de
forma explícita y separada, caso por caso.
