# Caso Público 01 — Tecnoglass — V0

**Fecha:** 2026-08-10
**Estado:** análisis manual, versión V0. No es una valoración. No autoriza
implementación de ningún cambio al Expediente. El reporte de contraste
(`REPORTE-CONTRASTE-EXPEDIENTE-V1.md`, esta misma carpeta) tampoco
constituye autorización de implementación; cualquier implementación
requiere autorización explícita y separada del fundador.
**Fuente de los datos:** material de trabajo aportado directamente por el
fundador, compilado a partir de reportes financieros públicos de
Tecnoglass (cifras descritas por el fundador como aproximadas). **No se
hizo scraping, descarga automatizada, ni re-verificación independiente de
estas cifras en esta sesión** — se usan tal como fueron entregadas, sin
recalcularlas ni completarlas con supuestos adicionales.

---

## 1. Objetivo del caso

Este caso no busca determinar cuánto vale Tecnoglass. Busca responder:
**¿qué información, relaciones, preguntas, clasificaciones y decisiones
necesita capturar Velarix para entender suficientemente una empresa antes
de calcular una valoración?**

Tecnoglass se usa como empresa pública con información abundante,
precisamente para poner a prueba `EXPEDIENTE-DE-VALORACION-V1.md` contra
un caso real antes de implementarlo.

## 2. Alcance y limitaciones

- No se calcula Enterprise Value, Equity Value ni precio por acción.
- No se elige un WACC, un crecimiento terminal (g), ni un horizonte
  explícito numérico.
- No se completa ningún dato faltante con un valor por defecto.
- No se trata ningún hallazgo de este caso como regla universal aplicable
  a cualquier empresa o sector.
- No equivale a due diligence, auditoría, ni opinión profesional de
  valor.
- Tecnoglass es una compañía pública (New York Stock Exchange, NYSE) con obligaciones de
  reporte muy superiores a las de una PYME colombiana típica — este caso
  no asume que una PYME real tendrá información de esta granularidad; al
  contrario, ayuda a entender qué preguntarle a una empresa que reporte
  mucho menos.
- Éxito de este caso **no** significa que el mismo modelo de drivers
  sirva idénticamente para todas las empresas, que los supuestos
  encontrados sean universales, que empresas del mismo sector deban
  valorarse igual, o que una empresa pública sea equivalente a una PYME.

## 3. Qué sabemos de la empresa

`HECHO DOCUMENTADO` (según compilación del fundador; no re-verificado
independientemente en esta sesión), salvo donde se indique lo contrario:

Tecnoglass es un fabricante verticalmente integrado de vidrio
arquitectónico, ventanas, aluminio y vinilo.

- Principal manufactura en Colombia, con concentración relevante en
  Barranquilla.
- Aproximadamente 96% de los ingresos de 2025 provinieron de Estados
  Unidos.
- Exposición importante a Florida.
- Negocio residencial y comercial.
- Actividades de fabricación, distribución e instalación.
- Expansión geográfica en curso dentro de Estados Unidos.
- Incorporación reciente del negocio de vinyl.
- Adquisiciones recientes, incluida Continental/Contiglass.
- Capacidad productiva en expansión.
- Costos expuestos a: precio del aluminio, salarios colombianos, tipo de
  cambio COP/USD, logística y tarifas (aranceles).
- Redomicilió su matriz de Cayman a Florida en julio de 2026 (`HECHO
  DOCUMENTADO`).

`INFERENCIA RAZONABLE`: la combinación de manufactura en Colombia con
ventas mayoritarias en USD genera una exposición cambiaria estructural
(costos parcialmente en COP, ingresos mayoritariamente en USD) — el caso
no cuantifica esta exposición, solo señala que existe y que es relevante
para WACC, márgenes y riesgo (ver §10).

Este contexto ya demuestra que "país de domicilio", "sector" o "CAGR
histórico" no son suficientes para explicar económicamente la empresa —
son insumos, no la explicación completa.

## 4. Mapa económico del negocio

```
Backlog / nueva contratación (commercial + residential, US + otros)
        │
        ▼
Capacidad instalada (Colombia, en expansión) ──► restricción de producción
        │
        ▼
Producción (vidrio, aluminio, vinyl) ──► costos expuestos a aluminio, COP, tarifas
        │
        ▼
Ingresos reconocidos (product sales + fixed-price contracts)
        │
        ├──► Costo de ventas (materiales, labor, energía, logística — agregado, sin desagregación pública suficiente)
        ├──► Working capital (AR, inventory, AP, contract assets/liabilities, supplier finance)
        ├──► CAPEX (mantenimiento, expansión de capacidad, automatización, nuevos productos)
        └──► Impuestos (multi-jurisdicción, tasa efectiva variable, redomiciliación reciente)
        │
        ▼
Estructura de capital (deuda SOFR+spread, leases, supplier finance, caja, JV)
        │
        ▼
Horizonte hasta estado estable (capacidad, márgenes, CAPEX y NWC todavía no estabilizados)
```

Este mapa es específico de Tecnoglass — no se propone como plantilla
universal (ver §19, R7).

## 5. Ingresos

`HECHO DOCUMENTADO` (cifras aproximadas aportadas por el fundador):

- H1 2026 revenue ≈ USD 544.3M.
- Product sales ≈ USD 388.6M; fixed-price contracts ≈ USD 155.8M.
- Comercial ≈ USD 329.3M; residencial ≈ USD 215.0M.
- Estados Unidos ≈ USD 523.4M.
- A junio de 2026, remaining performance obligations ≈ USD 884.2M, con
  ≈USD 309.2M esperados en el resto de 2026, ≈USD 409.8M en 2027 y
  ≈USD 165.2M en 2028.
- Capacidad manufacturera indicada por management ≈ USD 1.3B (sin incluir
  capacidad incremental de instalación).
- Revenue anual: 2025 ≈ USD 983.6M; 2024 ≈ USD 890.2M; 2023 ≈ USD 833.3M.
- Parte del crecimiento reciente incluye la adquisición de
  Continental/Contiglass (`HECHO DOCUMENTADO` la adquisición; `INFERENCIA
  RAZONABLE` que explica parte del crecimiento — el caso no cuantifica
  cuánto).

**Conclusión metodológica**: no modelar ingresos únicamente como
`Revenue × (1 + growthRate)`. Los drivers relevantes para Tecnoglass
incluyen al menos: backlog existente, nueva contratación, volumen,
pricing, capacidad, mix comercial/residencial, expansión geográfica,
nuevas líneas de producto, y adquisiciones.

**Preguntas a gerencia** (no resueltas): volumen vs. precio vs. mix;
utilización real de capacidad; conversión pipeline → backlog → revenue;
composición del backlog; crecimiento orgánico vs. adquirido; capacidad
futura después de las inversiones en curso.

## 6. Costos

`HECHO DOCUMENTADO` (cifras aproximadas):

- H1 2026 Cost of Sales ≈ USD 338.4M. Margen bruto H1 2026 ≈ 37.8%
  (H1 2025 ≈ 44.3%).
- Management atribuye la presión de margen a: aluminio, salarios
  colombianos, fortalecimiento del COP, tarifas y otros costos.
- Materiales relevantes: vidrio, aluminio, PVB, ionoplast, vinyl.
- Parte importante de las tarifas se registra en operating
  expenses/selling expense, no en Cost of Sales.
- La automatización busca reducir headcount, desperdicio, lead times y
  costos (`HECHO DOCUMENTADO` la intención declarada; `DESCONOCIDO` el
  ahorro esperado en cifras).

`DESCONOCIDO`: `Cost of Sales` no ofrece desagregación económica
suficiente (composición material/labor/energía/logística no está
disponible en el material de trabajo de este caso).

**Regla transversal confirmada**: la clasificación contable donde se
registra un costo (ej. tarifas en operating expenses) puede diferir de su
driver económico real — **clasificación contable ≠ clasificación
económica**. Que una tarifa se registre "abajo" del Cost of Sales no
significa que no sea, económicamente, un costo variable ligado al
volumen importado.

**Preguntas a gerencia**: composición detallada de Cost of Sales;
fijo/variable/mixto; costos por moneda; margen por producto/mercado;
mecanismo y velocidad de pass-through de costos a precio; duración
esperada de la presión de márgenes; ahorro esperado por automatización.

## 7. CAPEX

`HECHO DOCUMENTADO`:

- Inversiones recientes en automatización, expansión de aluminio, glass
  lines, warehouses, terrenos, vinyl, fachadas, capacidad y eficiencia.
- H1 2026: cash PP&E ≈ USD 52.7M; activos adicionales adquiridos vía
  crédito/deuda ≈ USD 9.8M.

`INFERENCIA RAZONABLE`: el CAPEX observado mezcla económicamente
mantenimiento, expansión, eficiencia, nuevos productos, infraestructura y
elementos estratégicos — el material disponible no permite separarlos con
precisión (`DESCONOCIDO` el desglose exacto por categoría).

**Conclusión metodológica**: no usar una regla genérica `CAPEX = X% ×
revenue`. El CAPEX debería poder clasificarse por proyecto o grupo
material (maintenance, growth, efficiency, new product/market,
regulatory, strategic) — una misma inversión puede tener múltiples
efectos.

**Relación identificada**: CAPEX → capacidad → fecha de entrada en
operación → crecimiento permitido → eficiencia → costos futuros (ver
§15).

**Preguntas a gerencia**: desglose entre maintenance CAPEX y growth
CAPEX; vida económica de los activos; capacidad incremental generada;
ahorro esperado por eficiencia; fecha de puesta en marcha de cada
inversión relevante; nivel de utilización considerado "normal".

## 8. Working capital

`HECHO DOCUMENTADO` (a junio de 2026, cifras aproximadas):

- Trade receivables ≈ USD 287.5M; inventories ≈ USD 271.6M; AP/accruals ≈
  USD 178.9M; contract assets ≈ USD 58.1M; contract liabilities ≈ USD
  174.8M (net contract liability ≈ USD 116.8M); supplier finance ≈ USD
  21.7M.
- H1 2026: utilidad neta ≈ USD 56.4M; CFO ≈ USD 11.1M; receivables
  consumieron ≈ USD 32.3M; inventory consumió ≈ USD 35.8M; AP/accruals
  aportaron ≈ USD 31.3M.
- El inventario está muy concentrado en raw materials.

**Conclusión metodológica**: no usar solamente `NWC = X% × revenue`. Se
necesitan componentes y drivers específicos: AR, inventory, AP, contract
assets, contract liabilities, advances, retainage, supplier finance.

**Regla transversal confirmada**: saldo observado ≠ saldo normalizado ≠
saldo proyectado — las tres capas deben poder coexistir, no
sobrescribirse.

**Pregunta metodológica abierta (no resuelta aquí)**: ¿el supplier
finance debe tratarse como working capital operativo o como deuda
económica? No se resuelve automáticamente — queda registrada como
decisión de análisis que depende de las características económicas
específicas del instrumento (ver §18).

## 9. Impuestos

`HECHO DOCUMENTADO` (cifras aproximadas):

- Tasa efectiva 2025 ≈ 32%; H1 2026 ≈ 31.5%; Q2 2026 ≈ 36.5%.
- H1 2026 tax provision ≈ USD 26.0M; cash taxes pagados ≈ USD 51.6M.
- Operaciones sujetas a distintas jurisdicciones; existen impuesto
  corriente y diferido, gastos no deducibles, y créditos/incentivos
  fiscales.
- Redomiciliación de la matriz de Cayman a Florida en julio de 2026.
- Management no espera un incremento material del impuesto federal tras
  aplicar foreign tax credits, pero esto queda como algo a observar, no
  como un hecho confirmado por este caso (`DECISIÓN DE GERENCIA
  reportada, no verificada de forma independiente aquí`).

**Regla transversal confirmada**: gasto contable de impuesto ≠
obligación fiscal del periodo ≠ cash tax pagado — las tres cifras
existen, difieren, y ninguna sustituye a las otras dos.

**Conclusión metodológica**: no usar una tasa tributaria fija sin
explicación. Se necesita distinguir: tasa estatutaria, tasa efectiva,
impuesto corriente, impuesto diferido, cash taxes, jurisdicciones,
diferencias permanentes/temporarias, créditos/incentivos, tasa
normalizada, y su evidencia.

## 10. Capital structure / WACC

`HECHO DOCUMENTADO` (a junio de 2026, cifras aproximadas):

- Gross debt / borrowing obligations ≈ USD 225.4M; principal credit
  facility ≈ USD 219M (SOFR + spread); cash ≈ USD 80.8M.
- Existen leases, supplier finance, y una JV (Vidrio Andino).
- Manufactura principal en Colombia; ingresos principalmente en
  USD/Estados Unidos; parte de los costos en COP; exposición económica a
  más de una jurisdicción.

**Conclusión metodológica**: no calcular WACC con constantes genéricas.
Antes de construir un WACC específico habría que resolver: moneda de
valoración, tasa libre de riesgo consistente con esa moneda, comparables,
beta, prima de riesgo de mercado, exposición económica/geográfica,
riesgo país, deuda económica (vs. contable), caja operativa mínima,
estructura de capital actual vs. sostenible, costo de deuda normalizado,
y la tasa aplicable al escudo fiscal.

**Regla transversal confirmada**: exposición económica ≠ domicilio
legal — la redomiciliación a Florida no cambia, por sí sola, dónde
ocurre la actividad económica real (manufactura en Colombia, ventas en
EE.UU.).

Este caso **no** calcula un WACC para Tecnoglass — solo identifica qué
inputs harían falta y por qué ninguno puede fijarse hoy sin más
información y sin juicio experto.

## 11. Horizonte explícito y terminal

`HECHO DOCUMENTADO`: Tecnoglass sigue aumentando capacidad, automatizando,
expandiéndose geográficamente, incorporando nuevos productos, integrando
adquisiciones recientes, y realizando CAPEX importante — es decir, no hay
evidencia en este material de que la empresa esté hoy en un estado
estable.

**Conclusión metodológica**: no usar automáticamente `5 años + g = 3%`.
El horizonte explícito debería durar hasta que sea defendible que las
variables relevantes (crecimiento, margen, CAPEX, working capital,
capacidad, estructura de capital) se aproximan a un estado sostenible. El
valor terminal debe ser económicamente coherente con esas variables —
Velarix debería poder validar consistencia entre g, tasa de reinversión,
ROIC, CAPEX, working capital y crecimiento estable, **sin que el software
elija la g** — el software detecta incoherencias, no decide el valor.

Este caso no propone un horizonte ni una g numérica para Tecnoglass.

## 12. Normalizaciones

`HECHO DOCUMENTADO` — partidas candidatas a revisión de normalización
observadas en el material de trabajo (ninguna se normaliza en este caso):

- Other operating income de carácter aparentemente extraordinario.
- Gains por disposal de activos.
- Employee Retention Credits.
- Debt extinguishment loss.
- Costos de adquisición de Continental.
- Efectos de adquisición en general.
- Tariffs (aranceles).
- Ganancias/pérdidas cambiarias (FX).
- Contribuciones caritativas de apariencia recurrente.
- Gastos legales o estratégicos específicos.

**Regla transversal confirmada**: detectar una partida anormal no
significa eliminarla automáticamente. El proceso obligatorio es: partida
reportada → posible ajuste → motivo → evidencia → recurrente/no
recurrente → importe propuesto → responsable → aprobación → importe
normalizado — **sin sobrescribir nunca el dato reportado**. Deben
coexistir: reportado, normalizado y proyectado.

Este caso no propone ni aprueba ninguna normalización concreta para
Tecnoglass — solo documenta candidatas.

## 13. Sensibilidades

Velarix busca producir **una conclusión principal de valor**, no tres
valores equivalentes (optimista/base/pesimista, ver
`Negocio_Velarix_v4.2.md` §9.6). La sensibilidad existe alrededor del
valor principal, no como sustituto de él.

**Regla confirmada por este caso**: sensibilizar cuando exista
incertidumbre relevante **y** impacto material simultáneamente — no
variar un número arbitrario de inputs (ej. 25) en ±10% de forma genérica.
Candidatos identificados en este caso donde ambas condiciones podrían
cumplirse (sin decidir aquí si aplica): margen bruto (presión reciente de
aluminio/COP/tarifas), velocidad de conversión de backlog a revenue,
CAPEX de expansión vs. capacidad resultante, tasa efectiva de impuesto
(volatilidad trimestral observada 31.5%–36.5%).

## 14. Variables que deben determinarse, no inferirse

El fundador aportó una tabla histórica de variables (ej. cumplimiento de
unidades vendidas, crecimiento real de precios de venta, crecimiento real
de costos unitarios, crecimiento real de costos fijos, crecimiento real
de salarios, crecimiento real de otros gastos de administración y
ventas, depreciación de equipos existentes, impuesto de renta, caja
mínima) con valores de ejemplo (p. ej. 100%, 0.50%, 0.45%, 1%, 2.59%,
1.85%, 6 años, 35%, 5 días).

**Regla epistémica obligatoria confirmada por este caso**: esos valores
**no son defaults metodológicos universales** de Velarix. Existencia de
un valor histórico o de referencia en una tabla ≠ autorización para
inferirlo en otra empresa (incluida Tecnoglass). El aprendizaje real no
es "estos son los números" — es que **existen categorías de variables**
que toda valoración necesita conocer, calcular, solicitar o justificar,
cada una con:

nombre, valor, unidad, categoría, driver, tipo de información, método de
determinación, fuente, fecha, razonamiento, contexto específico de la
empresa, clasificación epistémica (hecho / cálculo / supuesto / decisión
de gerencia / juicio del analista), nivel de certeza, materialidad,
sensibilidad, responsable, estado, aprobación.

Ejemplos de "método de determinación": informado por gerencia, extraído
de estados financieros, calculado desde históricos, contrato, política
contable, fuente macro externa, benchmark, juicio del analista, validado
por experto.

## 15. Relaciones entre supuestos

Ejemplos concretos identificados en este caso (no exhaustivos, no
universales):

- CAPEX de expansión → capacidad instalada → ingresos máximos posibles.
- Automatización → estructura de costos (headcount, desperdicio, lead
  times).
- Volumen de ingresos → nivel de inventario, cuentas por cobrar y por
  pagar (working capital).
- Backlog → producción necesaria → consumo de capacidad → working
  capital asociado.
- Crecimiento terminal (g) → tasa de reinversión sostenible.

**Regla confirmada**: los supuestos no deben tratarse como inputs
independientes entre sí — cambiar uno sin revisar sus dependencias puede
producir un resultado internamente inconsistente (ver §19, R3 y R8).

## 16. Hechos vs. inferencias vs. desconocidos (muestra representativa)

| Dato | Clasificación |
|---|---|
| H1 2026 revenue ≈ USD 544.3M | `HECHO DOCUMENTADO` (según compilación del fundador, no re-verificado en esta sesión) |
| ≈96% de ingresos 2025 desde EE.UU. | `HECHO DOCUMENTADO` |
| Redomiciliación Cayman → Florida, julio 2026 | `HECHO DOCUMENTADO` |
| Parte del crecimiento reciente proviene de Continental/Contiglass | `INFERENCIA RAZONABLE` (la adquisición es un hecho; la atribución exacta de cuánto crecimiento explica, no) |
| Composición detallada de Cost of Sales (materiales/labor/energía/logística) | `DESCONOCIDO` |
| Desglose de CAPEX entre mantenimiento y crecimiento | `DESCONOCIDO` |
| Tratamiento económico correcto de supplier finance (¿NWC operativo o deuda?) | `PREGUNTA A GERENCIA` / `DECISIÓN DEL ANALISTA` pendiente |
| Management no espera incremento material de impuesto federal tras foreign tax credits | `DECISIÓN DE GERENCIA reportada` (no verificada independientemente) |
| Cuál sería el horizonte explícito correcto para Tecnoglass | `DESCONOCIDO` — depende de cuándo se estabilicen crecimiento, margen, CAPEX, NWC y capacidad |
| Cuál sería el WACC correcto para Tecnoglass | `DESCONOCIDO` — depende de decisiones no tomadas en este caso (moneda, comparables, beta, riesgo país) |
| Qué normalizaciones deberían aprobarse | `DESCONOCIDO` — solo hay candidatas identificadas, ninguna evaluada ni aprobada |

Esta tabla es una muestra ilustrativa, no un inventario exhaustivo de
todo el caso.

## 17. Preguntas que le haríamos a gerencia

1. ¿Cuál es el desglose de crecimiento entre volumen, precio y mix de
   producto?
2. ¿Cuál es la utilización real de capacidad instalada hoy, y proyectada
   tras las inversiones en curso?
3. ¿Cómo se convierte el pipeline comercial en backlog, y el backlog en
   revenue reconocido? ¿Cuál es la composición actual del backlog?
4. ¿Qué proporción del crecimiento reciente es orgánica vs. adquirida
   (Continental/Contiglass)?
5. ¿Cuál es la composición económica detallada del Cost of Sales
   (materiales, labor, energía, logística, instalación, overhead)?
6. ¿Qué parte de los costos es fija, variable o mixta, y en qué moneda
   están denominados?
7. ¿Cómo y con qué velocidad se traslada (pass-through) un incremento de
   costos (aluminio, COP, tarifas) al precio?
8. ¿Cuánto tiempo se espera que dure la presión actual sobre el margen
   bruto?
9. ¿Qué ahorro específico se espera de las iniciativas de automatización?
10. ¿Cuál es el desglose del CAPEX entre mantenimiento, crecimiento,
    eficiencia y nuevos productos/mercados?
11. ¿Cuál es la vida económica esperada de las inversiones recientes y su
    fecha de entrada en operación plena?
12. ¿El supplier finance debe entenderse como parte del ciclo operativo o
    como una fuente de financiamiento?
13. ¿Qué parte de la tasa efectiva de impuesto (volátil entre 31.5% y
    36.5% en los trimestres observados) es estructural y qué parte es
    puntual?
14. ¿Qué impacto tributario real se espera de la redomiciliación a
    Florida, más allá de la expectativa declarada por management?
15. ¿Cuáles de las partidas candidatas a normalización (§12) gerencia
    considera genuinamente no recurrentes, y con qué evidencia?
16. ¿Cuándo espera la compañía alcanzar un crecimiento, margen y nivel de
    CAPEX/NWC estables (estado estable)?

## 18. Preguntas metodológicas que todavía debemos resolver

- ¿Cómo debe representar el Expediente la descomposición económica de una
  cuenta agregada (ej. Cost of Sales) cuando la fuente pública no la
  desagrega? ¿Se deja como `DESCONOCIDO` explícito, o se estima con
  metodología y evidencia declarada?
- ¿Qué umbral de materialidad activa la exigencia de descomposición de
  una cuenta, frente a dejarla como una sola nota?
- ¿Cómo debe tratarse metodológicamente el supplier finance — como regla
  general aplicable a cualquier caso similar, o como decisión caso por
  caso sin regla general?
- ¿Qué constituye evidencia suficiente para clasificar una partida como
  no recurrente cuando la única fuente es el propio reporte de la
  empresa (parte interesada)?
- ¿Cómo debe el sistema representar una restricción de capacidad (CAPEX →
  capacidad → techo de ingresos) sin convertirla en una regla rígida para
  empresas sin restricción de capacidad relevante?
- ¿Qué mecanismo (no automático) debería usarse para decidir cuándo una
  empresa "ya alcanzó" el estado estable que justifica cerrar el
  horizonte explícito?

Ninguna de estas preguntas se resuelve en este documento — quedan
registradas para discutirlas con un experto financiero cuando corresponda
(ver `REPORTE-CONTRASTE-EXPEDIENTE-V1.md`).

## 19. Qué aprendió Velarix del Caso 01

Ocho reglas transversales, confirmadas con evidencia de este caso (no
como generalización automática a partir de una sola empresa, sino como
capacidades que el Expediente debería tener):

- **R1. Contabilidad ≠ economía.** Debe guardarse tanto la ubicación/
  clasificación contable como la interpretación/driver económico, sin
  que uno reemplace al otro (evidencia: tarifas registradas fuera de
  Cost of Sales).
- **R2. Observado ≠ normalizado ≠ proyectado.** Las tres capas deben
  coexistir (evidencia: working capital, normalizaciones candidatas).
- **R3. Los supuestos se relacionan entre sí.** No deben tratarse como
  inputs independientes (evidencia: CAPEX→capacidad→ingresos,
  automatización→costos, backlog→NWC, g→reinversión).
- **R4. Una cuenta agregada puede requerir descomposición económica**
  (evidencia: Cost of Sales sin desagregación pública suficiente).
- **R5. Cada afirmación necesita un estado de conocimiento explícito**
  (hecho, inferencia, hipótesis, desconocido, pregunta, decisión,
  aprobado) — aplicado en §16 de este documento.
- **R6. El sistema debe poder declarar "información insuficiente"**, sin
  rellenar automáticamente (evidencia: desglose de CAPEX, composición de
  Cost of Sales).
- **R7. Las variables sensibles dependen de la empresa** — no existe un
  catálogo rígido universal de drivers (evidencia: backlog es central
  para Tecnoglass, pero no se propone como requisito universal — ver
  §2).
- **R8. El sistema puede detectar incoherencias sin tomar la decisión**
  (ej. revenue que excedería la capacidad declarada; margen que mejora
  sin un driver identificado; g que cambia sin ajuste de reinversión;
  tasa de impuesto manual sin reconciliación; normalización sin
  evidencia; partida marcada como extraordinaria que aparece de forma
  recurrente; supuesto material sin sensibilidad asociada; dos hipótesis
  dependientes entre sí que resultan inconsistentes).

## 20. Qué NO puede concluirse todavía

- No se puede concluir cuánto vale Tecnoglass — no se calculó EV, Equity
  Value ni un precio por acción, y la cotización bursátil de la empresa
  no se usó para "validar" nada, porque no existe ninguna valoración que
  validar en este documento.
- No se puede concluir cuál es el WACC, la g terminal, ni el horizonte
  explícito correctos para Tecnoglass.
- No se puede concluir qué normalizaciones deberían aprobarse — solo hay
  candidatas identificadas, sin evaluar.
- No se puede concluir que los drivers de Tecnoglass (backlog, capacidad,
  mix comercial/residencial) apliquen a cualquier otra empresa, ni
  siquiera del mismo sector.
- No se puede concluir que las 8 reglas de §19 estén completas o sean
  definitivas — provienen de un solo caso.

## 21. Qué debe probar el Caso 02

Sin analizarlo todavía en esta tarea: después del cierre documental de
este Caso 01 se estudiará una segunda empresa con una economía
claramente distinta (por ejemplo, un negocio de servicios recurrentes,
o una empresa sin restricción de capacidad relevante, o con un driver de
ingresos muy distinto — unidades × precio, clientes × ARPU, contratos,
volumen), específicamente para comprobar:

- qué reglas confirmadas en Tecnoglass eran particulares de su economía
  (ej. backlog, capacidad manufacturera);
- qué patrones (R1–R8) se repiten y cuáles no;
- qué estructura del Expediente empieza a mostrarse realmente
  generalizable, en vez de asumirlo a partir de un único caso.

No se afirma en este documento que ningún elemento de §19 sea universal
solo por haber aparecido en Tecnoglass.
