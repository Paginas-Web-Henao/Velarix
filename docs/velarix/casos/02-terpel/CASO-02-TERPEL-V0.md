# Caso Público 02 — Organización Terpel — V0

**Fecha:** 2026-08-10
**Estado:** análisis manual, versión V0. No es una valoración. No autoriza
implementación de ningún cambio al Expediente. El reporte de contraste
(`REPORTE-CONTRASTE-EXPEDIENTE-V1.md`, esta misma carpeta) tampoco
constituye autorización de implementación; cualquier implementación
requiere autorización explícita y separada del fundador.
**Fuente de los datos:** material de trabajo aportado directamente por el
fundador, compilado a partir de información pública de Organización
Terpel. **No se hizo scraping, descarga automatizada, ni re-verificación
independiente de estas cifras en esta sesión.** A diferencia del Caso 01
(Tecnoglass), este documento **no reproduce cifras financieras
específicas de Terpel** — el material de trabajo de esta ejecución
describió la economía de la empresa en términos cualitativos
(segmentos, mecanismos, tipos de partida), sin magnitudes numéricas
concretas. Este documento no completa esa ausencia con cifras estimadas,
inferidas ni de referencia externa — donde falta una cifra, queda
`DESCONOCIDO` de forma explícita.

---

**CASO 02 NO AUTORIZA IMPLEMENTACIÓN.** Ningún hallazgo, hipótesis o
patrón de este documento constituye autorización para crear tablas,
migraciones, schemas, UI, motores, Edge Functions, automatizaciones ni
ningún otro cambio técnico. Solo Nicolás/fundador puede autorizar
implementación, de forma explícita y separada.

## 1. Objetivo del caso

Este caso **no busca practicar otra valoración**. Busca **romper o
refutar** lo aprendido en el Caso 01 (Tecnoglass): ¿qué aprendizajes eran
específicos de la economía de Tecnoglass?, ¿cuáles reaparecen en una
empresa con una economía distinta?, ¿qué estructura del Expediente
empieza a generalizarse?, ¿qué campos parecen sobrar?, ¿qué campos
faltan?, ¿qué relaciones cambian?, ¿qué preguntas nuevas aparecen?

Regla explícita: **dos casos muestran patrones, dos casos no crean leyes
universales**.

## 2. Alcance y limitaciones

- No se calcula Enterprise Value, Equity Value ni precio por acción.
- No se elige un WACC, un crecimiento terminal (g), ni un horizonte
  explícito numérico.
- No se completa ningún dato faltante con un valor por defecto ni con una
  cifra tomada de Tecnoglass, de un comparable, o de cualquier fuente
  externa.
- No se trata ningún hallazgo de este caso como regla universal aplicable
  a cualquier empresa o sector.
- No equivale a due diligence, auditoría, ni opinión profesional de
  valor.
- Terpel es una organización con múltiples negocios, geografías y
  estructuras de reporte — este caso no asume que una PYME real tendrá
  información de esta complejidad; ayuda, igual que Tecnoglass, a
  entender qué preguntar a una empresa que reporte de forma más simple.
- Éxito de este caso **no** significa que los segmentos, mecanismos o
  supuestos de Terpel apliquen a cualquier otra empresa del sector
  combustibles/energía, ni que dos casos sean suficientes para declarar
  cerrada ninguna de las ocho reglas del Caso 01.

## 3. Qué sabemos de la empresa (nivel cualitativo)

`HECHO DOCUMENTADO` (según compilación del fundador; sin re-verificación
independiente en esta sesión), a nivel estructural — sin cifras:

- Terpel opera múltiples negocios económicamente distintos bajo una
  misma organización, entre ellos: EDS (estaciones de servicio),
  Industria, Aviación & Marinos, Lubricantes, y Servicios
  Complementarios.
- Existe exposición a más de una geografía.
- Existe un fenómeno de decalaje asociado a variaciones de precio sobre
  inventarios de combustibles.
- Existen inversiones (CAPEX) de distinta naturaleza económica:
  mantenimiento, expansión, almacenamiento, estaciones, lubricantes,
  movilidad eléctrica, nuevas energías, e inversión estratégica (ej. un
  parque solar).
- Existen desembolsos a clientes vinculados a mejoras de estaciones,
  conversiones, permanencia o volumen, en el contexto de relaciones
  contractuales.
- Existen arrendamientos materiales.
- Se identificó un evento relevante de ampliación del plazo de pago con
  Ecopetrol (proveedor).

`DESCONOCIDO` en este documento (no se estimó ni se buscó completar):
cifras de ingresos, EBITDA, márgenes, volúmenes, inventarios, deuda,
capital de trabajo, o cualquier otra magnitud numérica de Terpel.

Este contexto ya demuestra, igual que Tecnoglass mostró para "país de
domicilio" o "sector", que "empresa de combustibles" no es una
descripción económica suficiente — Terpel no es una única economía
homogénea, sino una organización de negocios distintos (ver §5).

## 4. Mapa económico del negocio (nivel conceptual, sin cifras)

```
Negocios (EDS, Industria, Aviación & Marinos, Lubricantes, Servicios
Complementarios)
        │
        ▼
Volumen / actividad específica por negocio (no un único "galón" homogéneo)
        │
        ▼
Mecanismo de margen específico por negocio (precio, mezcla, servicio,
contrato)
        │
        ├──► Decalaje (variación de precio sobre inventario) ──► EBITDA
        │     contable vs. EBITDA "sin decalaje" (fenómeno, no corrección
        │     automática — ver §7)
        ├──► Working capital (inventarios combustibles, inventarios
        │     lubricantes, materia prima/WIP/producto terminado en
        │     lubricantes, cuentas por cobrar, proveedores de
        │     combustibles, proveedores de lubricantes, otras cuentas
        │     comerciales)
        ├──► CAPEX (mantenimiento, expansión, almacenamiento, estaciones,
        │     lubricantes, movilidad eléctrica, nuevas energías,
        │     inversión estratégica)
        ├──► Contratos con clientes (aportes/desembolsos, exclusividad,
        │     volumen mínimo, duración, permanencia)
        └──► Arrendamientos (activos operativos críticos)
        │
        ▼
Geografía(s) — exposición no necesariamente homogénea entre negocios
```

Este mapa es específico de Terpel — no se propone como plantilla
universal, igual que el mapa de Tecnoglass tampoco lo era (ver §14, R7).

## 5. Segmentos / unidades económicas

`HECHO DOCUMENTADO` (nivel estructural, sin cifras): Terpel reporta u
opera, al menos, los siguientes negocios: EDS, Industria, Aviación &
Marinos, Lubricantes, Servicios Complementarios.

**Conclusión metodológica**: Terpel **no** debe reducirse conceptualmente
a `galones × precio`. La misma unidad física ("galón") no describe una
economía homogénea entre negocios: EDS, Industria, Aviación & Marinos y
Lubricantes tienen, presumiblemente, mecanismos de margen, clientes,
contratos y dinámicas de working capital distintos entre sí.

`HIPÓTESIS` (no confirmada con evidencia numérica en este caso): una
representación económica más adecuada se aproxima a

```
negocio × volumen/actividad × mecanismo de margen × geografía
```

en lugar de un único driver de volumen y un único margen consolidado.

**Esto no debe convertirse automáticamente en schema.** Es una hipótesis
de representación, no una entidad a implementar.

**Preguntas a gerencia**: ver §10.

## 6. Working capital

`HECHO DOCUMENTADO` (nivel estructural, sin cifras): se observan
económicamente, al menos, los siguientes componentes de capital de
trabajo:

- Inventarios de combustibles.
- Inventarios de lubricantes.
- Materias primas / producto en proceso (WIP) / producto terminado
  dentro del negocio de lubricantes.
- Cuentas por cobrar.
- Proveedores de combustibles.
- Proveedores de lubricantes.
- Otras cuentas comerciales.

`HECHO DOCUMENTADO`: se identificó una ampliación del plazo de pago a
proveedores con Ecopetrol como evento relevante.

**Cadena económica identificada**:

```
condiciones de proveedor (plazo)
  → cuentas por pagar
  → capital de trabajo neto (NWC)
  → caja
```

**Regla transversal confirmada (misma que Tecnoglass, R2)**: saldo
observado ≠ saldo normalizado ≠ saldo proyectado. El cambio de plazo con
Ecopetrol es un ejemplo directo: un mismo saldo de cuentas por pagar
puede reflejar una condición comercial temporal, no necesariamente
sostenible ni repetible en la proyección, sin que eso implique
automáticamente "corregirlo".

**Pregunta metodológica que sigue abierta (no se resuelve aquí, igual que
en Tecnoglass con supplier finance)**: ¿cuándo una cuenta comercial
(ej. cuentas por pagar a un proveedor con condiciones ampliadas)
continúa siendo NWC operativo, y cuándo adquiere naturaleza financiera?
Esta pregunta **no se decide en este documento** — queda registrada como
decisión de análisis dependiente de las características económicas
específicas del instrumento y del proveedor (ver §11).

## 7. Decalaje

`HECHO DOCUMENTADO` (a nivel de fenómeno, sin cifras): Terpel reporta un
fenómeno de decalaje asociado a variaciones de precio sobre inventarios
de combustibles.

`HECHO DOCUMENTADO` (a nivel conceptual, según el material de trabajo):
el EBITDA contable observado puede diferir materialmente del EBITDA
presentado "sin decalaje". El efecto puede ser positivo o negativo según
el ciclo de precios.

**Regla explícita de este caso**: **no** concluir que el EBITDA sin
decalaje es automáticamente "el EBITDA correcto". El decalaje es un
fenómeno económico que debe entenderse — con evidencia y razonamiento —
antes de decidir cualquier tratamiento o normalización.

Representación conceptual (mismo patrón de §12 del Caso 01):

```
EBITDA reportado
  → fenómeno económico (decalaje: variación de precio sobre inventario)
  → evidencia (cómo lo calcula y explica management)
  → pregunta (¿es recurrente?, ¿se revierte?, ¿qué productos afecta?)
  → posible tratamiento (¿normalización?, ¿nota informativa?, ¿ninguno?)
  → decisión humana (Nicolás y/o revisor experto)
```

Este fenómeno **refuerza** dos reglas confirmadas en Tecnoglass:

- **R1 (contabilidad ≠ economía)**: el decalaje es un efecto de
  valoración de inventario sobre el resultado contable, distinto del
  desempeño operativo subyacente del negocio.
- **R2 (observado ≠ normalizado ≠ proyectado)**: "EBITDA sin decalaje" no
  es automáticamente el valor a proyectar — es una capa adicional que
  debe coexistir con el EBITDA reportado, con su propia evidencia y
  razonamiento, no sustituirlo silenciosamente.

**Preguntas a gerencia**: ver §10.

## 8. CAPEX

`HECHO DOCUMENTADO` (nivel estructural, sin cifras): se identifican, al
menos, los siguientes tipos económicos de inversión en Terpel:
mantenimiento, expansión, almacenamiento, estaciones, lubricantes,
movilidad eléctrica, nuevas energías, e inversión estratégica (ej. un
parque solar).

**Conclusión metodológica (coincide con Tecnoglass, §7 del Caso 01)**:
`CAPEX = % de ingresos` **no** es metodología defendible para Terpel —
mismo patrón, evidencia distinta.

**Diferencia relevante frente a Tecnoglass**: la clasificación binaria
`maintenance / growth`, que ya era insuficiente en Tecnoglass (donde se
sugería una clasificación multi-categoría: mantenimiento, crecimiento,
eficiencia, nuevos productos/mercados, regulatorio, estratégico), aparece
aquí con una categoría adicional distinta en naturaleza: inversión
**estratégica de transición energética** (movilidad eléctrica, nuevas
energías, parque solar), que no encaja claramente ni en mantenimiento ni
en expansión de la capacidad tradicional del negocio de combustibles.

`HIPÓTESIS`: esta categoría podría tener una lógica de retorno y de
horizonte distinta a la del CAPEX de mantenimiento o expansión
tradicional (ej. opcionalidad estratégica, regulación, transición
energética, en lugar de retorno directo sobre capacidad instalada
existente).

**Regla explícita**: **no crear una taxonomía universal obligatoria de
CAPEX.** La pregunta de cuántas y cuáles categorías son necesarias sigue
abierta y depende de la empresa (ver §14, R7).

**Preguntas a gerencia**: ver §10.

## 9. Contratos

`HECHO DOCUMENTADO` (nivel estructural, sin cifras): existen desembolsos
a clientes vinculados a mejoras de estaciones, conversiones, permanencia
o volumen, dentro de relaciones contractuales.

Esto genera preguntas económicas sobre: adquisición/retención del
cliente, exclusividad, duración, volumen mínimo, y recuperación de la
inversión realizada.

**Regla explícita de este caso**: **no crear una entidad universal
`contracts`. No crear tabla.** No se concluye todavía que los contratos
requieran una estructura propia en el Expediente — por ahora, buena
parte de esta información puede representarse mediante evidencia,
preguntas, contexto y supuestos ya previstos en la especificación
vigente (ver §16 del reporte de contraste).

**Preguntas a gerencia**: ver §10.

## 10. Arrendamientos

`HECHO DOCUMENTADO`: Terpel tiene arrendamientos materiales (nivel
estructural, sin cifras ni inventario de activos específicos en este
documento).

Este caso concluye únicamente que estos arrendamientos deben comprenderse
económicamente (¿qué activos son?, ¿cuán críticos son para la operación?)
antes de decidir cualquier tratamiento. **No se decide en esta ejecución**
su clasificación como deuda, su ajuste al Enterprise Value, ni su
tratamiento metodológico final.

**Preguntas a gerencia**: ver §10.

## 11. Hallazgo sobre supuestos: alcance y propósito

Terpel, por ser una organización con múltiples negocios, países y
posibles contratos, expone un problema que Tecnoglass no dejó tan
visible: dentro de una misma organización pueden existir supuestos
distintos según la empresa, el país, el negocio, la unidad generadora de
efectivo (UGE), la operación, o el contrato al que se refieran. Un mismo
nombre de supuesto (ej. "margen", "días de inventario", "tasa de
descuento") puede significar cosas distintas según a qué parte de Terpel
se aplique.

Además, una cifra puede haber sido determinada originalmente para un
propósito distinto al de una valoración profesional de Velarix —por
ejemplo: prueba de deterioro, presupuesto, planificación interna,
covenant de deuda, valoración previa, o presentación gerencial— y ese
propósito original puede condicionar si la cifra es transferible a este
ejercicio sin ajuste.

De esto surgen dos candidatos conceptuales, **sin implementarlos**:

### `scope` (alcance)

Pregunta que responde: ¿a qué aplica exactamente este supuesto? (empresa
completa, filial, país, segmento, UGE, producto, contrato).

### `purpose` (propósito)

Pregunta que responde: ¿para qué fue originalmente determinado o
utilizado este supuesto?

**Explícitamente no se decide en este documento**: el nombre final de
estos campos, su tipo, sus enums, ni su estructura. La necesidad
conceptual de representar el alcance de un supuesto tiene evidencia más
fuerte en este caso que la de representar su propósito original, pero
ambas quedan registradas como necesidad conceptual con diseño abierto
(ver §16 del reporte de contraste).

## 12. Comparabilidad / perímetro histórico

`HIPÓTESIS` (evidencia limitada en este caso, no cuantificada): en una
organización con múltiples negocios y geografías, eventos como
adquisiciones, ventas, reclasificaciones entre segmentos, operaciones
discontinuadas o cambios de consolidación pueden afectar la
comparabilidad de las cifras entre periodos.

**No se diseña ninguna estructura para esto en este documento** (no
`case_perimeter`, no tabla, no schema). Se registra explícitamente como:

`EVIDENCIA INSUFICIENTE PARA DISEÑAR SOLUCIÓN — VALIDAR EN CASOS FUTUROS`.

## 13. Preguntas a gerencia

### Negocios / unidades económicas

1. ¿Cuáles negocios necesitan proyectarse separadamente?
2. ¿Cuál es la unidad económica relevante por negocio?
3. ¿Qué crecimiento proviene de activos existentes vs. expansión?
4. ¿Qué costos/infraestructura se comparten entre negocios?
5. ¿Qué márgenes usa management para gestionar cada negocio?
6. ¿Qué geografías necesitan hipótesis independientes?

### Decalaje / precios / margen

7. ¿Cómo se determina el precio por producto/geografía?
8. ¿Cuánto tiempo pasa entre la compra y la venta del inventario?
9. ¿Cómo calcula management el decalaje?
10. ¿Qué productos tienen mayor exposición al decalaje?
11. ¿El decalaje se revierte normalmente en un periodo posterior?
12. ¿Existe un rango histórico "normal" de decalaje?
13. ¿Cómo utiliza management el EBITDA sin decalaje internamente?

### Working capital

14. ¿Cuál es la rotación normal de capital de trabajo por negocio?
15. ¿Cuál es el inventario mínimo necesario para operar?
16. ¿Qué parte del capital de trabajo depende de volumen vs. precio?
17. ¿Cómo se comporta el capital de trabajo de combustibles vs.
    lubricantes?
18. ¿Cuáles son los días de cobro por negocio?
19. ¿Cuáles son las condiciones normales de pago a proveedores?
20. ¿El plazo ampliado con Ecopetrol es permanente, contractual,
    renovable o excepcional?
21. ¿Existe alguna contraprestación implícita asociada a ese plazo?
22. ¿Qué pasaría con el capital de trabajo y la caja si el plazo
    volviera a niveles anteriores?
23. ¿Qué otras cuentas comerciales podrían comportarse, económicamente,
    como financiación?

### CAPEX

24. ¿Cómo define management el CAPEX de mantenimiento?
25. ¿Cuál es el gasto mínimo necesario para sostener la capacidad
    actual?
26. ¿Qué parte del CAPEX depende de la edad/estado de los activos vs. del
    volumen?
27. ¿Cuáles son los economics típicos de una nueva estación (EDS)?
28. ¿Cuánto tiempo tarda una inversión nueva en madurar?
29. ¿Qué retorno exige management a una inversión de expansión?
30. ¿Existe capacidad ociosa relevante hoy?
31. ¿Cómo distingue management las inversiones estratégicas (movilidad
    eléctrica, nuevas energías, parque solar) de las de mantenimiento o
    expansión tradicional?

### Contratos

32. ¿Qué aportes iniciales requiere típicamente Terpel para asegurar un
    cliente o una estación?
33. ¿Qué recibe Terpel a cambio de esos aportes?
34. ¿Existe exclusividad contractual?
35. ¿Existe volumen mínimo comprometido?
36. ¿Cuál es la duración típica de estos contratos?
37. ¿Se renuevan habitualmente?
38. ¿Qué ocurre económicamente si el cliente abandona antes de tiempo?
39. ¿Cuánto crecimiento exige nuevos aportes contractuales?

### Arrendamientos

40. ¿Cuáles activos críticos están arrendados?
41. ¿Qué proporción de la operación es propia vs. arrendada?
42. ¿Existen contratos de arrendamiento indispensables para operar?
43. ¿Existen pagos variables dentro de los arrendamientos?
44. ¿Qué renovaciones son necesarias en el horizonte relevante?

Estas preguntas siguen el mismo flujo confirmado en Tecnoglass:

```
hecho → desconocido → pregunta → respuesta/evidencia futura → eventual decisión
```

Ninguna de estas preguntas se responde en este documento.

## 14. Contraste formal R1–R8 (resultado del Caso 02)

- **R1. Contabilidad ≠ economía.** `SOBREVIVE — REFORZADA.` Terpel lo
  muestra mediante mecanismos distintos a Tecnoglass: decalaje (efecto de
  valoración de inventario sobre el resultado contable, distinto del
  desempeño operativo), contratos (aportes a clientes con lógica
  económica de adquisición/retención, no solo de gasto), y la existencia
  de negocios con economics propios dentro de un mismo reporte
  consolidado.
- **R2. Observado ≠ normalizado ≠ proyectado.** `SOBREVIVE — REFORZADA.`
  El decalaje es la evidencia más directa: el EBITDA reportado no es
  automáticamente proyectable, y "EBITDA sin decalaje" tampoco lo es sin
  evidencia y razonamiento explícitos — ambas capas deben poder coexistir
  (ver §7).
- **R3. Los supuestos están relacionados.** `SOBREVIVE, PERO SE
  PROFUNDIZA.` Terpel sugiere cadenas causales más largas que las
  observadas en Tecnoglass: precio → inventario → decalaje → margen;
  plazo de proveedor → cuentas por pagar → NWC → caja. `HIPÓTESIS` (no
  diseñada aquí): `assumption_relations` podría necesitar en el futuro
  representar más que una relación simple entre dos elementos — **no se
  diseña esto en este documento** (ver §16 del reporte de contraste).
- **R4. Una cuenta agregada puede necesitar descomposición.** `CAMBIA.`
  Tecnoglass sesgaba la intuición hacia descomposición **contable** (ej.
  Cost of Sales en materiales/labor/energía/logística). Terpel muestra
  que la dimensión relevante de descomposición no es necesariamente
  contable: puede ser por negocio (EDS/Industria/Aviación &
  Marinos/Lubricantes/Servicios Complementarios), por producto, por
  canal, por geografía o por contrato. Nueva formulación conceptual
  provisional: *"una partida o variable material puede necesitar
  descomposición según la dimensión que explique su comportamiento
  económico"* — la dimensión puede ser contable, de negocio, de
  producto, de canal, de geografía, de contrato, u otra. **No se
  convierte esta lista en un enum universal. No se implementa.**
- **R5. Estado de conocimiento explícito.** `SOBREVIVE.` Terpel contiene
  preguntas que la información pública disponible en este caso no
  permite responder (ver §13). Velarix debe preservar `DESCONOCIDO` o
  `PREGUNTA_A_GERENCIA` sin rellenar silenciosamente — este documento lo
  aplica de forma explícita en §3, §5, §6, §8, §10, §12.
- **R6. Método de determinación.** `SOBREVIVE, PERO PARECE INCOMPLETO.`
  El método de determinación sigue siendo necesario, pero Terpel muestra
  que puede no ser suficiente por sí solo: introduce los candidatos
  `scope` (alcance) y `purpose` (propósito original) descritos en §11.
  **No se diseña su implementación en este documento.**
- **R7. Drivers específicos por empresa.** `SOBREVIVE — FUERTEMENTE
  REFORZADA.` Terpel usa drivers radicalmente distintos de Tecnoglass
  (múltiples negocios con mecanismos de margen propios, en vez de
  backlog/capacidad manufacturera). No existe una biblioteca universal
  cerrada de drivers — confirmado con dos economías muy distintas.
- **R8. Detectar incoherencias sin decidir.** `SOBREVIVE — REFORZADA.`
  Ejemplos conceptuales nuevos, específicos de Terpel: volumen que baja
  pero margen/utilidad que cambia materialmente sin explicación; EBITDA y
  EBITDA sin decalaje que divergen sin evidencia asociada; cuentas por
  pagar a proveedores que aumentan por un cambio de plazo sin que quede
  registrado como tal; CAPEX que cambia sin una explicación operacional
  vinculada; crecimiento proyectado no compatible con la capacidad o
  infraestructura instalada de un negocio específico. La herramienta
  puede **alertar** sobre estos patrones; no puede decidir por el
  analista o el revisor experto.

## 15. Qué NO puede concluirse todavía

- No se puede concluir cuánto vale Terpel — no se calculó EV, Equity
  Value ni precio por acción, y ningún precio de mercado se usó para
  "validar" nada, porque no existe ninguna valoración que validar en
  este documento.
- No se puede concluir cuál es el WACC, la g terminal, ni el horizonte
  explícito correctos para Terpel.
- No se puede concluir qué normalizaciones deberían aprobarse sobre el
  decalaje ni sobre ninguna otra partida — solo se documentó el fenómeno
  y las preguntas asociadas, sin evaluar ni aprobar nada.
- No se puede concluir si el plazo ampliado con Ecopetrol debe tratarse
  como capital de trabajo operativo o como financiación — sigue abierta,
  igual que el supplier finance de Tecnoglass.
- No se puede concluir un diseño final para `scope`, `purpose`,
  `assumption_relations` enriquecidas, ni comparabilidad/perímetro — son
  necesidades conceptuales registradas, no especificaciones cerradas.
- No se puede concluir que los negocios/drivers de Terpel (EDS,
  Industria, Aviación & Marinos, Lubricantes, Servicios Complementarios)
  apliquen a cualquier otra empresa del sector, ni siquiera a otro
  operador de combustibles.
- No se puede concluir que las ocho reglas R1–R8 estén completas o sean
  definitivas — ahora provienen de dos casos, no de uno, pero dos casos
  siguen sin ser una ley universal.

## 16. Qué queda pendiente después del Caso 02

Sin analizarlo todavía en esta tarea: la organización mantiene abiertas,
para casos futuros, al menos las siguientes preguntas que este caso no
resolvió y que no se resuelven artificialmente aquí:

- El diseño final de `scope` y `purpose` como posibles campos del
  Expediente.
- Si `assumption_relations` necesita representar cadenas causales más
  ricas que una relación simple entre dos elementos.
- El criterio de materialidad para exigir descomposición de una partida
  (heredado de Tecnoglass, todavía no calibrado).
- El criterio para separar CAPEX de mantenimiento, de expansión, y de
  inversión estratégica/transición energética cuando management no lo
  revela con ese detalle.
- El tratamiento metodológico de cuentas comerciales con condiciones
  ampliadas (Ecopetrol) y, en general, de instrumentos que oscilan entre
  capital de trabajo operativo y financiación.
- Si comparabilidad/perímetro histórico necesita representarse de forma
  explícita en el Expediente, y cómo.

Algunas de estas preguntas requieren más casos. Algunas requieren
criterio de un experto financiero. Ninguna se resuelve en este
documento.
