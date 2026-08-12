# Caso Público 07 — The Goldman Sachs Group, Inc. — V0

**Fecha:** 2026-08-12
**Estado: ANÁLISIS DOCUMENTADO — PENDIENTE DE REVISIÓN Y CIERRE FORMAL POR
EL FUNDADOR.** Versión V0. No es una valoración. No autoriza
implementación de ningún cambio al Expediente. No produce Enterprise
Value, Equity Value, precio por acción, WACC definitivo, Cost of Equity
aprobado, g definitiva, ni horizonte definitivo, y no selecciona método
de valoración final. Este documento **no está formalmente cerrado ni
congelado** — queda pendiente de revisión por Nicolás/fundador, posibles
correcciones de redacción, y su autorización explícita de cierre en una
ejecución separada y posterior, siguiendo el mismo patrón usado en los
Casos 01–06.

**CASO 07 NO AUTORIZA IMPLEMENTACIÓN.** Ningún hallazgo, hipótesis,
candidato u observación de este documento constituye autorización para
crear tablas, migraciones, schemas, UI, motores, Edge Functions,
automatizaciones ni ningún otro cambio técnico. Solo Nicolás/fundador
puede autorizar implementación, de forma explícita y separada.

---

## 1. Identificación del caso

- **Caso:** Caso Público 07 — The Goldman Sachs Group, Inc.
- **Posición en la secuencia:** séptimo caso de estudio manual, después
  de Caso 01 (Tecnoglass, cerrado y congelado), Caso 02 (Organización
  Terpel, cerrado), Caso 03 (Ecopetrol, cerrado y congelado), Caso 04
  (Grupo Éxito, formalmente cerrado y congelado), Caso 05 (ISA,
  formalmente cerrado y congelado) y Caso 06 (Grupo Cibest/Bancolombia,
  formalmente cerrado y congelado) — el segundo caso sobre una
  institución financiera regulada, deliberadamente elegido para evitar
  que "institución financiera" se convierta en una categoría económica
  homogénea a partir de un solo ejemplo.
- **Insumos documentales de continuidad revisados para el contraste de
  este caso:**
  `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`,
  `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`,
  `docs/velarix/plan/REGISTRO-DE-DECISIONES.md`,
  `docs/velarix/casos/06-bancolombia/CASO-06-BANCOLOMBIA-V0.md`,
  `docs/velarix/casos/06-bancolombia/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`,
  y los documentos equivalentes de los Casos 01–05, revisados
  exclusivamente para replicar estructura y convenciones, no para
  reauditar su contenido.
- **No se reanaliza ni se recalcula ningún elemento de los Casos 01–06**
  — se citan únicamente para contraste. Sus conclusiones no se
  reinterpretan retrospectivamente a partir de Goldman Sachs.
- **Caso 08 (Munich Re) está autorizado pero NO se inicia en esta
  ejecución.** No se usa para completar vacíos de evidencia de este
  caso.

## 2. Objetivo del caso (adversarial)

El Caso 07 estudia a The Goldman Sachs Group, Inc. como **séptima
economía**, deliberadamente elegida para **evitar** que Bancolombia
(banca universal/tradicional latinoamericana) se convierta en el
representante único de "institución financiera" dentro de Velarix.
Goldman introduce investment banking, advisory, underwriting, markets,
trading, market making, financing, prime financing, derivados,
securities financing, asset management, wealth management, e
investment activities — una combinación de negocios intensivos en
balance junto con negocios más capital-light, coexistiendo dentro de la
misma organización. **No busca confirmar Velarix ni confirmar lo
aprendido en Bancolombia.**

Un caso puede reforzar, debilitar, refutar, resultar no material,
producir evidencia insuficiente, o revelar problemas nuevos — este
documento registra los cinco resultados posibles con la misma
disciplina.

Principio epistemológico vigente, ahora extendido a siete casos: **siete
casos muestran patrones más resistentes; siete casos no crean leyes
universales.** Donde una conclusión reaparece de forma transversal e
idéntica en los siete casos, se documenta prudentemente como `PATRÓN
OBSERVADO EN SIETE CASOS` — **nunca** como `CONFIRMADO POR SIETE CASOS`,
y nunca como ley universal.

Goldman se documenta primero **por su propia economía** (§6–§21); el
contraste explícito con Bancolombia ocurre después de comprender Goldman
(§22–§24), no antes.

## 3. Límites del ejercicio

- No se calcula Enterprise Value, Equity Value, precio por acción,
  valoración implícita, WACC, Cost of Equity, g, FCFF, FCFE, valoración
  por Residual Income, valoración por DDM, ni valoración por SOTP.
- No se elige un método de valoración final para Goldman Sachs.
- No se completa ningún dato faltante con un valor por defecto, ni con
  una cifra tomada de los casos anteriores, de un comparable, o de
  cualquier fuente externa no entregada para este caso.
- No se trata ningún hallazgo de este caso como regla universal aplicable
  a cualquier empresa, banco o sector.
- No equivale a due diligence, auditoría, ni opinión profesional de
  valor.
- No se acusa a Goldman Sachs, a su administración ni a ningún tercero de
  ninguna irregularidad fiscal, contable o regulatoria — donde el
  material de trabajo describe un mecanismo (ej. netting de derivados,
  reducción de historical principal investments), este documento lo
  registra como fenómeno a entender, no como juicio de valor.
- Goldman Sachs es una institución listada, regulada, con obligaciones de
  reporte muy superiores a las de una PYME colombiana típica — este caso
  no asume que una PYME real tendrá información de esta granularidad.
- Éxito de este caso **no** significa que los mecanismos o supuestos de
  Goldman apliquen a cualquier otro banco de inversión, ni que lo
  aprendido aplique automáticamente a Munich Re — ambos deben todavía
  intentar romperlo (ver §37).
- No se fuerza ningún hallazgo si la evidencia proporcionada no lo
  sostiene — donde el material de trabajo no permite concluir algo, este
  documento lo deja como `EVIDENCIA INSUFICIENTE` o `PREGUNTA ABIERTA`.

## 4. Período analizado

**Período financiero base: FY2025, con cierre al 31 de diciembre de
2025.** Este es el período sobre el que versan los hallazgos
documentados en §6–§21, salvo donde se indique explícitamente lo
contrario.

**Información posterior al corte (1T26 y 2T26) se documenta por
separado en §38, claramente etiquetada como `INFORMACIÓN POSTERIOR AL
CORTE`.** No se mezcla silenciosamente con FY2025 y no se usa para
reescribir retroactivamente las condiciones existentes al 31-dic-2025.

## 5. Procedencia y naturaleza de la evidencia

**Fuente de trabajo:** síntesis analítica proporcionada a esta ejecución
documental, elaborada previamente — fuera de esta ejecución — a partir
de información pública primaria de The Goldman Sachs Group, Inc.,
principalmente: documentación oficial de Investor Relations, filings
ante la SEC, y estados financieros consolidados FY2025.

**Esta ejecución documental no realizó verificación independiente
adicional de las fuentes originales**, salvo donde se indique
expresamente — no se hizo scraping, descarga automatizada, ni
navegación por internet. Esta ejecución solo inspeccionó documentos ya
existentes en el repositorio (Casos 01–06, Decisiones financieras del
Bloque 1B, Registro de decisiones) para preservar estructura,
vocabulario y consistencia documental.

**No se atribuye a Nicolás/fundador la recopilación personal de esta
información.** El flujo real fue: (1) existe una síntesis analítica de
información pública primaria de Goldman Sachs, elaborada previamente a
esta ejecución; (2) esa síntesis fue entregada a esta ejecución mediante
instrucciones; (3) esta ejecución documental no verificó de forma
independiente las fuentes originales de esa síntesis, salvo donde se
indique expresamente.

Este caso, como Bancolombia, combina cifras específicas (balance,
derivados, capital, compensación — §8–§11, §19, §21) con mecanismos
conceptuales sin batería exhaustiva de cifras (financing, repos,
collateral, fair value — §10, §13–§15, §17). Este documento no completa
ninguna ausencia con cifras estimadas, inferidas ni de referencia
externa — donde falta una cifra, queda `DESCONOCIDO` o `EVIDENCIA
INSUFICIENTE` de forma explícita. Ninguna cifra que sí se cite carece de
período y scope claros; todas corresponden a FY2025 salvo indicación
contraria.

## 6. Objetivo adversarial de Goldman: evitar homogeneizar "institución financiera"

`DISTINCIÓN CONCEPTUAL` (construida a partir de la comparación entre
Bancolombia y Goldman, no un hecho reportado literalmente por ninguna de
las dos compañías): Bancolombia representó, dentro de la secuencia de
casos, principalmente banca universal/tradicional latinoamericana —
depósitos, cartera de crédito, NIM, ECL. Goldman introduce una economía
materialmente distinta dentro de la misma etiqueta amplia de
"institución financiera regulada": investment banking, advisory,
underwriting, markets, trading, market making, financing, prime
financing, derivados, securities financing, asset management, wealth
management, e investment activities.

**Regla explícita de este caso**: Goldman se documenta primero por su
propia economía (§7–§21); el contraste con Bancolombia se realiza
después (§22–§24), no antes — para evitar que la experiencia de un solo
banco previo sesgue la lectura de Goldman.

## 7. Hallazgo central del Caso 07

`INFERENCIA METODOLÓGICA` (conclusión construida a partir de los hechos
económicos de §8–§21, no un hecho reportado por Goldman): una
institución financiera no constituye necesariamente una sola economía
financiera homogénea, y la arquitectura financiera adecuada puede variar
incluso entre actividades que coexisten dentro de la misma organización.

Goldman muestra coexistencia de:

- **Advisory / underwriting** → capital humano, relaciones, deals y
  fees.
- **Market making / intermediation** → inventario, clientes, derivados,
  riesgo y balance.
- **Financing / prime** → balance, collateral, lending, securities
  financing y spreads.
- **Asset management** → AUS/AUM, fees, fundraising, performance e
  inflows/outflows.
- **Wealth / private banking** → assets de clientes, advisory, lending y
  depósitos.
- **Investment activities** → capital propio, fair value y retornos
  sobre inversiones.

**Regla explícita, que no admite ambigüedad**: más descomposición **no**
equivale automáticamente a mejor valoración (consistente con R4, §22).
Goldman también tiene interdependencias económicas entre negocios (§34).
**La unidad económicamente adecuada de análisis puede no coincidir con
entidad legal, segmento contable, ni máxima granularidad disponible.**

**Esto es `INFERENCIA METODOLÓGICA`. No es R9.** No se numera junto a
R1–R8.

## 8. Anatomía económica — hechos a documentar

`HECHO DOCUMENTADO` (según la síntesis recibida, sin verificación
independiente adicional): Goldman reporta tres segmentos — Global
Banking & Markets (GBM), Asset & Wealth Management (AWM), y Platform
Solutions. La estrategia actual está fundamentalmente concentrada en GBM
y AWM.

**FY2025, net revenues aproximados:**

- Total: US$58.28B.
- GBM: aprox. US$41.45B.
- AWM: aprox. US$16.68B.
- Platform Solutions: aprox. US$151M.

Dentro de GBM existen, entre otras: Investment Banking Fees; FICC;
Equities; intermediation; financing. Dentro de AWM existen: management
and other fees; private banking and lending; investments; incentive
fees.

**Assets under supervision:** aprox. US$3.606T al cierre de FY2025.

`HECHO DOCUMENTADO`: Goldman ha venido reduciendo historical principal
investments y escalando negocios más capital-light / third-party-capital-driven.

`DESCONOCIDO` en este documento: cualquier desglose adicional no citado
explícitamente en la síntesis recibida — este documento no lo estima ni
lo completa con cifras de referencia externa.

**Preguntas a gerencia**: ver §39.

## 9. Balance — hechos documentados

`HECHO DOCUMENTADO` (según la síntesis recibida, sin verificación
independiente adicional): al 31-dic-2025, cifras aproximadas US$B:

**Activos**

| Partida | US$B aprox. |
|---|---|
| Cash | 164 |
| Collateralized agreements | 334 |
| Customer and other receivables | 186 |
| Trading assets | 657 |
| Investments | 195 |
| Loans | 238 |
| Otros | 36 |
| **Total assets** | **1,810** |

**Pasivos**

| Partida | US$B aprox. |
|---|---|
| Deposits | 501 |
| Collateralized financings | 305 |
| Customer and other payables | 232 |
| Trading liabilities | 263 |
| Unsecured short-term borrowings | 70 |
| Unsecured long-term borrowings | 286 |
| Otros | 28 |
| **Total liabilities** | **1,685** |

**Regla explícita, que no admite ambigüedad**: estas cuentas **no** se
interpretan automáticamente como "operación" vs. "financiación". Ese
tratamiento requiere interpretación económica (§10, R1, §22).

**Preguntas a gerencia**: ver §39.

## 10. Financing como parte del negocio

`HECHO DOCUMENTADO`: FICC Financing + Equities Financing generaron
aproximadamente US$11.4B durante 2025. Goldman presenta financing como
una fuente material y relativamente durable de ingresos. Puede incluir
secured financing, structured financing, margin lending, securities
lending, prime financing, y portfolio financing.

`INFERENCIA ANALÍTICA` (conclusión construida a partir de ese hecho, no
un hecho reportado literalmente por Goldman): en Goldman, financiación
**no equivale automáticamente** a actividad externa a la operación.

**Regla explícita**: **no concluir** que todo pasivo financiero de
Goldman es operativo. **Tampoco concluir** lo contrario. La clasificación
requiere interpretación económica caso por caso, consistente con R1 y
con el hallazgo central de §7 (financing forma parte del negocio en al
menos algunas de las actividades de Goldman, sin que esto se generalice
a todo pasivo financiero del grupo).

**Preguntas a gerencia**: ver §39.

## 11. Derivados

`HECHO DOCUMENTADO`: al cierre de 2025, cifras aproximadas:

- Fair value bruto activos derivados: US$360.1B.
- Fair value bruto pasivos derivados: US$391.2B.
- Counterparty netting: aprox. US$261.2B por lado.
- Cash-collateral netting: aprox. US$46B.
- Derivados reconocidos finalmente en balance: activos aprox. US$53.0B;
  pasivos aprox. US$84.4B.
- Notional: aprox. US$43.53T.

**Regla explícita, que no admite ambigüedad**: notional ≠ pérdida
esperada. Fair value bruto ≠ exposición económica. Fair value neto ≠
explicación completa de la economía. Ninguna de estas tres magnitudes
sustituye a las otras dos.

**Preguntas a gerencia**: ver §39.

## 12. Candidato A — Neteo (resultado del Caso 07)

**Estado previo a este caso** (heredado de Ecopetrol, Caso 03; sin
evidencia nueva en Grupo Éxito, ISA ni Bancolombia): `EVIDENCIA FUERTE
EN ECOPETROL — VALIDAR EN CASOS FUTUROS`.

**Resultado Goldman**: `EVIDENCIA FUERTE INDEPENDIENTE`. Los derivados de
Goldman (§11) muestran una secuencia completa — posición bruta →
counterparty netting → cash-collateral netting → cifra neta reconocida
en balance — con una diferencia material entre bruto (~US$360–391B por
lado) y neto reconocido (~US$53–84B por lado).

**Regla explícita, importante**: **no usar** "el neteo destruye
información" como formulación suficiente, porque mostrar solo la cifra
bruta también puede inducir una interpretación económica falsa de la
exposición (sobreestimarla). La formulación debe refinarse antes de
cualquier elevación.

**Estado propuesto por este caso: `CANDIDATO A — EVIDENCIA FUERTE
INDEPENDIENTE EN ECOPETROL Y GOLDMAN SACHS; LA FORMULACIÓN GENERAL DEBE
REFINARSE ANTES DE CUALQUIER ELEVACIÓN.`**

La pregunta que debe sobrevivir a este caso: ¿qué información debe
preservarse para reconstruir el puente entre posición bruta → netting
jurídicamente/económicamente válido → collateral → mitigantes →
exposición económica relevante?

**No se eleva formalmente el Candidato A en este documento. No se crea
R9. No se crean campos. No se crea `netting`.**

**Preguntas a gerencia**: ver §39.

## 13. Repos / reverse repos

`DISTINCIÓN CONCEPTUAL` (construida a partir de la síntesis recibida, no
un hecho reportado literalmente por Goldman): la forma jurídica de una
compra/venta de securities no determina automáticamente su función
económica. Repos/reverse repos pueden funcionar económicamente como
financiación garantizada, y además pueden servir a client facilitation,
liquidity management, short coverage, o financing propio.

**Regla explícita**: **no se crea regla universal** que asigne una única
función económica a repos/reverse repos.

**Preguntas a gerencia**: ver §39.

## 14. Securities borrowed / loaned

`INFERENCIA ANALÍTICA` (construida a partir de la síntesis recibida, no
un hecho reportado literalmente por Goldman): estas operaciones pueden
estar relacionadas con market making, short selling, client financing, o
securities financing. El tratamiento puede variar según el negocio, el
contrato, y la elección contable ("accounting election").

**Regla explícita**: instrumento similar ≠ función económica idéntica —
consistente con R1 y R4 (§22).

**Preguntas a gerencia**: ver §39.

## 15. Collateral

`HECHO DOCUMENTADO`: Goldman recibe y entrega collateral en múltiples
actividades. En determinados contratos puede reuse, rehypothecate, o
repledge ese collateral; en otros, no — esto puede depender
contractualmente de los derechos existentes.

`DISTINCIÓN CONCEPTUAL` (construida a partir de ese hecho, no un hecho
reportado literalmente por Goldman): control o posesión de collateral ≠
disponibilidad económica universal. Pero tampoco es correcto afirmar que
collateral = siempre restringido — depende de los derechos y del
propósito (`purpose`, §22).

**Preguntas a gerencia**: ver §39.

## 16. ISA-F (resultado del Caso 07)

**Formulación original** (Caso 05, ISA): *"el reconocimiento, titularidad
o control de un recurso no implica necesariamente que esté
económicamente disponible para cualquier propósito."*

**Estado previo a este caso** (Caso 06, Bancolombia): `OBSERVACIÓN
TRANSVERSAL FUERTEMENTE REFORZADA EN DOS ECONOMÍAS RADICALMENTE
DISTINTAS — ISA Y BANCOLOMBIA — MANTENER ABIERTA PARA VALIDACIÓN EN
CASOS 07–08 ANTES DE DECIDIR SU ELEVACIÓN`.

**Resultado Goldman**: Goldman añade dimensión contractual, de
collateral, de reuse/repledge, de liquidez, y de regulación (§15). Goldman
reportó además Global Core Liquid Assets promedio aproximados de
US$466B durante 2025 — otra magnitud donde reconocimiento contable de un
recurso no equivale automáticamente a su disponibilidad para cualquier
propósito.

**Estado después de Goldman: `OBSERVACIÓN TRANSVERSAL FUERTEMENTE
REFORZADA EN TRES ECONOMÍAS RADICALMENTE DISTINTAS — ISA, BANCOLOMBIA Y
GOLDMAN SACHS — MANTENER ABIERTA HASTA MUNICH RE ANTES DE DECIDIR SU
ELEVACIÓN.`**

**No se convierte en Candidato F en este documento. No se crea
`availability`, enum, campo, schema, ni automatización.**

**Preguntas a gerencia**: ver §39.

## 17. Fair value

`HECHO DOCUMENTADO`: fair value está profundamente integrado en trading,
derivatives, investments, ciertas financiaciones, y determinados
activos/pasivos de Goldman.

`DISTINCIÓN CONCEPTUAL` (construida a partir de ese hecho, no un hecho
reportado literalmente por Goldman): deben distinguirse instrumento
económico, base de medición, y observabilidad/incertidumbre de medición.
Fair value **no** equivale a "valor inventado". Level 1 / Level 2 / Level
3 reflejan distintas fuentes/observabilidad de inputs — Level 3 puede
involucrar correlations, volatility, credit spreads, recovery
assumptions, model uncertainty, y valuation adjustments.

**Regla explícita, que no admite ambigüedad**: **no presentar Level 3
como irregularidad.**

**Preguntas a gerencia**: ver §39.

## 18. Candidato E (resultado del Caso 07)

**Estado previo a este caso** (Caso 06, Bancolombia): `EVIDENCIA
ADICIONAL FUERTE, PERO LA FORMULACIÓN GENERAL SE VUELVE MENOS ESTABLE:
BANCOLOMBIA REFUERZA QUE "BASE DE MEDICIÓN" Y "RÉGIMEN MONETARIO /
MONEDA" PUEDEN SER FENÓMENOS RELACIONADOS PERO METODOLÓGICAMENTE
DISTINTOS.`

**Resultado Goldman**: Goldman fortalece extraordinariamente **base de
medición** (§17: fair value, Level 1/2/3, observabilidad de inputs,
instrumentos financieros integrados en trading, derivatives,
investments). Goldman **no** aporta evidencia equivalente nueva para
**régimen monetario / moneda**.

**Estado después de Goldman: `EVIDENCIA MUY FUERTE ADICIONAL EN GOLDMAN
SACHS, PERO LA FORMULACIÓN GENERAL SE VUELVE AÚN MENOS ESTABLE; LA
HIPÓTESIS DE QUE BASE DE MEDICIÓN Y RÉGIMEN MONETARIO SON FENÓMENOS
DISTINTOS SE FORTALECE.`**

**No se divide todavía en E1/E2. No se convierte en R10. No se crean
campos. Munich Re debe tensionarlo (§37).**

**Preguntas a gerencia**: ver §39.

## 19. Capital y regulación

`HECHO DOCUMENTADO`: FY2025, aproximadamente:

- CET1 capital: US$104.3B.
- Standardized RWA: US$726B.
- Standardized CET1 ratio: 14.4%.
- Advanced CET1 ratio: 15.0%.
- Supplementary Leverage Ratio: 5.2%.
- Goldman devolvió aproximadamente US$16.78B a accionistas en 2025:
  US$12.36B en recompras y US$4.42B en dividendos.

**Regla explícita, que no admite ambigüedad**: **no convertir** estos
hechos automáticamente en capacidad sostenible de distribución (ver
Bancolombia-G, §20).

**Preguntas a gerencia**: ver §39.

## 20. Bancolombia-G (resultado del Caso 07)

**Formulación provisional original** (Caso 06, Bancolombia): *"la
generación de utilidad o la existencia de patrimonio en una entidad
regulada no determina por sí sola cuánto valor económico puede
distribuirse al accionista final; pueden intervenir requerimientos de
capital, crecimiento, buffers prudenciales y niveles societarios
intermedios."*

**Resultado Goldman**: Goldman produce evidencia independiente. Los
US$16.78B devueltos a accionistas en 2025 (§19) coexisten con
requerimientos de CET1, RWA, y Supplementary Leverage Ratio que
condicionan cuánto capital puede liberarse para distribución —
mecanismo materialmente distinto del puente banco operativo → holding
de Bancolombia (§20 del Caso 06), pero con la misma estructura
conceptual: utilidad/patrimonio ≠ automáticamente capacidad de
distribución.

**Estado después del Caso 07: `EVIDENCIA FUERTE INDEPENDIENTE EN DOS
INSTITUCIONES FINANCIERAS CON ECONOMÍAS MATERIALMENTE DISTINTAS —
BANCOLOMBIA Y GOLDMAN SACHS — MANTENER COMO OBSERVACIÓN ABIERTA HASTA
MUNICH RE ANTES DE DECIDIR SI ES SECTORIAL O MÁS TRANSVERSAL.`**

**No se convierte en "Candidato G" todavía. No se fusiona con ISA-F. No
se crea `capital_bridge`. No se crea `distributable_capital`.**

**Preguntas a gerencia**: ver §39.

## 21. Compensación

`HECHO DOCUMENTADO`: Goldman reportó aproximadamente US$18.9B en
compensation and benefits durante 2025 — una proporción material de
ingresos y operating expenses. Goldman atribuye parte del incremento de
2025 a mejor operating performance.

`INFERENCIA ANALÍTICA` (construida a partir de ese hecho, no un hecho
reportado literalmente por Goldman): esto sugiere potencialmente una
relación revenue/performance ↔ compensation → margin. Pero la relación
puede ser condicional, discrecional, diferida, variable por negocio,
cíclica, y afectada por stock-based/deferred compensation.

**Estado: `OBSERVACIÓN GOLDMAN — COMPENSACIÓN COMO POSIBLE VARIABLE
ECONÓMICA ENDÓGENA.`**

**Pregunta abierta**: ¿es simplemente R3? ¿es driver R7? ¿es fenómeno
sectorial de negocios intensivos en capital humano? ¿es algo nuevo?

**`EVIDENCIA INSUFICIENTE PARA CREAR CANDIDATO`. No se crea "Goldman-H".
No se crea `compensation model`.**

**Preguntas a gerencia**: ver §39.

## 22. Contraste formal R1–R8 (resultado del Caso 07)

Regla rectora, igual que en los contrastes de los Casos 02–06: `PATRÓN
OBSERVADO EN SIETE CASOS` se usa **solo** donde la evidencia de
Tecnoglass, Terpel, Ecopetrol, Grupo Éxito, ISA, Bancolombia y Goldman
Sachs es realmente transversal — nunca como sinónimo de regla universal,
nunca como `CONFIRMADO POR SIETE CASOS`, y nunca por aplicación
automática.

- **R1 — Contabilidad ≠ economía.** `PATRÓN OBSERVADO EN SIETE CASOS.`
  Goldman refuerza mediante repos, derivatives, collateral, trading
  assets/liabilities, securities financing y financing (§9–§15): la
  clasificación contable correcta no determina automáticamente el
  tratamiento económico. **No decir `CONFIRMADO POR SIETE CASOS`.**
- **R2 — Observado ≠ normalizado ≠ proyectado.** `PATRÓN OBSERVADO EN
  SIETE CASOS.` Goldman refuerza especialmente mediante markets revenue,
  advisory, underwriting, incentive fees, investment results y
  compensation (§8, §21). **No se crea regla automática de
  normalización** — un año fuerte en trading no es automáticamente
  extraordinario.
- **R3 — Los supuestos están relacionados.** `PATRÓN OBSERVADO EN SIETE
  CASOS + DISEÑO AÚN MÁS INSUFICIENTEMENTE VALIDADO.` Goldman introduce
  relaciones entre actividad, revenues, balance, financing, funding,
  risk, capital, liquidez y compensación (§8–§21) — muchas pueden ser
  circulares, regulatorias, condicionales, no lineales, o mediadas por
  decisiones humanas. **No se convierte en grafo causal ingenuo. No se
  rediseña. No se implementa.**
- **R4 — Descomposición según la dimensión económica relevante.**
  `PATRÓN OBSERVADO EN SIETE CASOS.` Goldman presenta drivers
  materialmente diferentes entre advisory, underwriting, FICC, Equities,
  financing, asset management, wealth, lending e investments (§32). Se
  mantiene: **más granularidad no es automáticamente mejor análisis. No
  se crea enum universal. No se hace obligatorio `account_components`.**
- **R5 — Estado de conocimiento explícito.** `SOBREVIVE / SE
  PROFUNDIZA.` Ejemplo Goldman: se puede conocer la posición bruta de
  derivados, el netting, el collateral, y la cifra neta (§11) — y
  todavía no saber automáticamente qué magnitud representa mejor la
  exposición económica relevante para el propósito concreto (§12). **No
  se crea nuevo enum.**
- **R6 — Método de determinación (scope / purpose).** `scope`:
  `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS.`
  Goldman vuelve a mostrar diferencias entre holding, banco, broker-dealer,
  subsidiarias, entidades reguladas, y negocio consolidado — sin que
  esto implique modelar cada subsidiaria. `purpose`: Goldman aporta la
  evidencia más fuerte hasta ahora — el mismo instrumento puede
  significar cosas distintas según financing, market making, hedge,
  liquidez, client facilitation, o investment (§13–§15, §17). **Estado:
  `PURPOSE — NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES
  CASOS; GOLDMAN REDUCE MATERIALMENTE LA BRECHA DE MADUREZ FRENTE A
  SCOPE.`** **No se fusionan `scope` y `purpose`. No se crean campos ni
  enums.**
- **R7 — Drivers específicos por empresa.** `PATRÓN OBSERVADO EN SIETE
  CASOS.` Drivers de Goldman: en Investment Banking — deal activity,
  advisory, underwriting volumes; en Markets — client activity,
  volatility, volumen, spreads, financing balances; en AWM — AUS/AUM,
  inflows/outflows, asset performance, fee rates, fundraising, incentive
  fees. **No existe set universal cerrado.**
- **R8 — Detectar incoherencias sin decidir.** `PATRÓN OBSERVADO EN
  SIETE CASOS.` Goldman refuerza: derivado grande ≠ especulación; Level
  3 ≠ medición incorrecta; posición bruta enorme ≠ riesgo económico
  equivalente; collateral recibido ≠ recurso libre; high markets revenue
  ≠ automáticamente extraordinario. Velarix **detecta**; el experto
  **interpreta y decide**.

## 23. Comparabilidad / perímetro

**Estado anterior** (Caso 06, Bancolombia): `PROBLEMA FUERTEMENTE
DEMOSTRADO EN MÚLTIPLES ECONOMÍAS, AHORA INCLUYENDO UNA INSTITUCIÓN
FINANCIERA; EVIDENCIA SUFICIENTE PARA EXIGIR TRATAMIENTO METODOLÓGICO,
TODAVÍA INSUFICIENTE PARA DISEÑAR UNA REPRESENTACIÓN GENERAL.`

**Después de Goldman**: `PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES
ECONOMÍAS Y PROFUNDIZADO DENTRO DE INSTITUCIONES FINANCIERAS; EXISTE
EVIDENCIA SUFICIENTE PARA EXIGIR TRATAMIENTO METODOLÓGICO, TODAVÍA
INSUFICIENTE PARA DISEÑAR UNA REPRESENTACIÓN GENERAL.`

**Razón**: Goldman aporta, dentro de la misma categoría amplia de
"institución financiera regulada" ya abierta por Bancolombia, una
segunda economía con perímetro materialmente distinto — tres segmentos
reportables (GBM, AWM, Platform Solutions) con drivers, balance y
funciones económicas heterogéneas (§8), y una unidad económica adecuada
de análisis que puede no coincidir con entidad legal ni segmento
contable (§7).

**Cautela obligatoria, sin cambio**: problema de perímetro demostrado ≠
obligación de modelar entidad por entidad ni negocio por negocio. **No
se crea `case_perimeter`, tabla, schema, ni un motor automático.**

## 24. Candidato B — Ciclo de vida (resultado del Caso 07)

**Estado previo a este caso** (Caso 06, Bancolombia): `PATRÓN OBSERVADO
EN CUATRO CASOS DE NATURALEZA ECONÓMICA MUY DISTINTA — FORMULACIÓN
GENERAL AÚN ABIERTA` (Ecopetrol, Grupo Éxito, ISA, Bancolombia).

**Resultado Goldman**: en Goldman coexisten múltiples nociones de "vida"
de naturaleza distinta entre sí: vida contractual de una posición ≠ vida
de la relación con cliente ≠ vida del programa/fondo ≠ vida de la
franquicia ≠ vida de la empresa.

**Estado después de Goldman: `PATRÓN OBSERVADO EN CINCO CASOS DE
NATURALEZA ECONÓMICA MUY DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA`**
(Ecopetrol, Grupo Éxito, ISA, Bancolombia, Goldman Sachs). **No se
convierte en R9. No se crea `economic_lifecycle`.**

## 25. Candidato C — Atribución temporal / corte de conocimiento (resultado del Caso 07)

**Estado previo a este caso** (Caso 06, Bancolombia): `PROBLEMA
METODOLÓGICO FUERTEMENTE RESPALDADO POR MÚLTIPLES CASOS — REQUIERE
DEFINIR PRINCIPIOS ANTES DE DISEÑAR REPRESENTACIÓN.`

**Resultado Goldman**: Goldman aporta una nueva economía temporal —
secuencias posibles como commitment → execution → recognition →
remeasurement → settlement → realization, y en investment banking
posibles diferencias entre backlog/pipeline → transaction → completion →
fee recognition.

**Estado: `PROBLEMA METODOLÓGICO FUERTEMENTE RESPALDADO POR MÚLTIPLES
CASOS — GOLDMAN APORTA UNA NUEVA ECONOMÍA TEMPORAL.`** **No se crea
`economic_period`. No se crean campos. No se crea schema.**

## 26. Candidato D — Derechos económicos / propiedad dinámica (resultado del Caso 07)

**Estado previo a este caso** (heredado de Grupo Éxito, Caso 04; sin
evidencia nueva en ISA ni Bancolombia): `EVIDENCIA FUERTE EN GRUPO ÉXITO
— VALIDAR EN CASOS FUTUROS.`

**Resultado Goldman**: `EVIDENCIA INSUFICIENTE PARA REFORZAR EL
FENÓMENO`. Derivatives, deferred compensation, RSUs y structured
products de Goldman no deben confundirse con el fenómeno específico de
derechos económicos/propiedad dinámica identificado en Grupo Éxito (una
opción u obligación contractual capaz de modificar la atribución
económica futura, como la opción de venta sobre Grupo Disco Uruguay).

**Estado: `EVIDENCIA FUERTE EN GRUPO ÉXITO — GOLDMAN SACHS APORTA
EVIDENCIA INSUFICIENTE PARA REFORZAR EL FENÓMENO.`** **No se eleva.**

## 27. Supplier financing

`HECHO DOCUMENTADO`: que Goldman financie a sus clientes forma parte de
su negocio (§10) y no constituye automáticamente supplier financing
propio de la empresa valorada.

**Resultado Goldman**: `IRRELEVANCIA / EVIDENCIA INSUFICIENTE`.

**Estado general: sin cambio** — se mantiene `PROBLEMA FUERTEMENTE
REFORZADO — CRITERIOS DE RECLASIFICACIÓN TODAVÍA ABIERTOS`, apoyado en
Tecnoglass, Terpel y Grupo Éxito.

## 28. Leases

`INFERENCIA ANALÍTICA`: Goldman no produjo evidencia suficientemente
nueva para cambiar el estado del problema de leases.

**Regla explícita**: no se cuenta a Goldman como nueva instancia
únicamente porque existan leases — se requiere un mecanismo específico
(como el doble rol lessee/lessor ya documentado en ISA y Bancolombia)
para sumar instancia.

**Estado: se mantiene sin cambio: `PROBLEMA DEMOSTRADO — TRATAMIENTO DE
VALORACIÓN NO GENERALIZADO.`**

## 29. CAPEX / reinversión

`HECHO DOCUMENTADO`: Goldman está expandiendo negocios más capital-light
y reduciendo historical principal investments (§8).

`INFERENCIA ANALÍTICA` (conclusión construida a partir de ese hecho, no
un hecho reportado literalmente por Goldman): CAPEX contable no
representa necesariamente toda la reinversión económica de Goldman. La
reinversión puede involucrar capital regulatorio, capacidad de balance,
tecnología, talento, advisors, capacidades, fundraising, plataformas, y
adquisiciones. Capital regulatorio necesario ≠ toda la reinversión
económica.

**Regla explícita**: esto **refina** una posible extrapolación excesiva
del Caso 06 (donde CAPEX/retención de capital se documentó con un
mecanismo más simple) — Goldman muestra un conjunto más amplio y menos
formulaico de vías de reinversión. **No se crea fórmula automática.**

## 30. NWC

`INFERENCIA ANALÍTICA`: el NWC industrial convencional no aparece como
driver económicamente adecuado para el core consolidado de Goldman.

**Regla explícita, que no admite ambigüedad**: esto **no elimina** NWC
de Velarix. Refuerza: **NWC no es driver universal obligatorio** —
consistente con la conclusión ya alcanzada en Bancolombia (§14 del Caso
06).

## 31. Deuda / net debt

`INFERENCIA ANALÍTICA` (construida a partir de §10, §13, §14): Goldman
muestra que financing puede ser operación. Por tanto, pasivo financiero
≠ automáticamente deuda económica externa a la operación.

**Regla explícita**: net debt convencional **no** parece medida
económicamente adecuada como default para Goldman consolidado. Puede
reaparecer en un `scope` específico si la economía lo justifica — esto
refuerza R6.

## 32. Métodos de valoración — resultado del caso

**No se selecciona método final. No se valora Goldman Sachs.**

**Nota epistemológica de esta sección**: todo este apartado es
`INFERENCIA METODOLÓGICA` — no hecho reportado por Goldman. No se
selecciona método final.

### A. Residual Income / Excess Return

**Resultado: `CANDIDATO METODOLÓGICO MUY FUERTE`.** Goldman reporta y
gestiona métricas como ROE, book value, y returns through-the-cycle. El
modelo conceptualmente conecta book equity + PV de excess returns sobre
el Cost of Equity. Pero book equity ≠ base económicamente perfecta —
pueden importar buybacks, fair value, capital allocation, intangibles, y
business mix. **No se aprueba.**

### B. FCFE adaptado a capital

**Resultado: `CANDIDATO FUERTE`.** Pero no debe usarse una fórmula
bancaria simplista — la reinversión/capital puede depender de credit
risk, market risk, operational risk, RWA, leverage, stress requirements,
balance mix, y business mix. **No se aprueba ningún motor.**

### C. DDM / distribuciones potenciales

**Resultado: `CANDIDATO FUERTE`.** Goldman muestra que dividendos
observados ≠ capital total devuelto, y capital total devuelto ≠
capacidad sostenible de distribución — las recompras (US$12.36B) fueron
mucho mayores que los dividendos (US$4.42B) en 2025 (§19). **No se
proyectan mecánicamente los dividendos históricos.**

### D. SOTP (suma de partes)

**Resultado: `CANDIDATO FUERTE Y MÁS RELEVANTE QUE EN BANCOLOMBIA`.**
Pero descomponer puede destruir interdependencias económicas reales —
Goldman tiene conexiones entre advisory, financing, hedging, AWM, y
relaciones de clientes (§34). **SOTP no es obligación.**

### E. FCFF / WACC convencional

**Resultado: `NO ADECUADO COMO DEFAULT DEL GRUPO CONSOLIDADO`.** Esto
**no significa** que FCFF esté prohibido.

### F. Enterprise Value

**Resultado: `NO ADECUADO COMO ARQUITECTURA UNIVERSAL DEL GRUPO`.
POTENCIALMENTE ÚTIL EN DETERMINADOS SCOPES. `PREGUNTA ABIERTA`.**

### G. Cost of Equity

Goldman refuerza la tensión: WACC no debe asumirse como input
obligatorio de toda valoración. Si se valora equity directamente, Cost
of Equity puede ser relevante. **No se aprueba Cost of Equity. No se
cambia la Decisión 1 del Bloque 1B.**

## 33. Horizonte / estado estable

La Decisión 4 del Bloque 1B
(`DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md` §"Decisión 4 —
Horizonte explícito del DCF") establece, por ahora, un horizonte
explícito fijo de 5 años. **Goldman no la modifica. Esta decisión no
cambia en este documento.**

Goldman sí refuerza conceptualmente que estado estable ≠ resultados
idénticos cada año. Para una firma expuesta a mercados puede importar
normalized through-cycle profitability, business mix sostenible, capital
intensity sostenible, crecimiento sostenible, ROE sostenible, Cost of
Equity, y persistencia/convergencia de excess returns.

**Esto es `INFERENCIA METODOLÓGICA`. No se aprueba horizonte nuevo. No
se aprueba g.**

## 34. Contraste controlado con Bancolombia

Después de estudiar Goldman por sí mismo (§6–§33), se documenta el
contraste con Bancolombia — **sin convertirlo en comparación
superficial**:

**A. Lo que parece especialmente propio de banca comercial/tradicional**
(observado en Bancolombia, no reforzado por Goldman): NIM dominante;
costo/mix de depósitos; cartera como núcleo del activo productivo;
ECL/calidad de cartera como eje principal del riesgo.

**B. Lo que parece más amplio dentro de instituciones financieras
reguladas** (observado en ambos casos, con mecanismos distintos): capital
requerido importa para crecimiento/distribución (Bancolombia-G, §20);
cash no equivale automáticamente a recursos distribuibles (ISA-F, §16);
net debt puede dejar de ser interpretable (§31); FCFF/WACC puede ser mal
default (§32); valoración directa de equity puede ser natural (§32);
scope regulatorio importa (§22, R6).

**C. Lo que parece más transversal** (reforzado en los siete casos):
contabilidad ≠ economía (R1); observado ≠ normalizado ≠ proyectado (R2);
estado de conocimiento (R5); drivers específicos (R7); detectar sin
decidir (R8); la unidad económica de análisis puede diferir de la
etiqueta legal/contable (§7, §23).

## 35. Qué Goldman rompió de Bancolombia

`INFERENCIA METODOLÓGICA`: Goldman debilita simplificaciones que
podrían haberse extraído prematuramente de un solo caso bancario
(Bancolombia) — **no** los principios subyacentes (R1–R8):

1. "Banco = depósitos + préstamos + NIM" — Goldman muestra un banco de
   inversión donde NIM no es el motor dominante (§8).
2. "Reinversión financiera = capital retenido" — Goldman muestra vías de
   reinversión más amplias (§29).
3. "Deuda puede reconocerse económicamente por la cuenta contable" —
   financing puede ser operación en Goldman (§10, §31).
4. "Bruto conserva información y neto la destruye" — mostrar solo bruto
   también puede inducir una interpretación falsa de la exposición
   (§12).
5. "Fair value es solamente base contable" — fair value está integrado
   en la economía operativa de Goldman, no solo en su reporte (§17).
6. "Scope es claramente más importante que purpose" — purpose recibe la
   evidencia más fuerte hasta ahora en Goldman, reduciendo materialmente
   su brecha de madurez frente a scope (§22, R6).
7. "SOTP = separar segmentos" — SOTP en Goldman debe lidiar con
   interdependencias económicas reales entre negocios, no solo con
   separar segmentos contables (§32, §34).
8. "Residual Income funciona porque la empresa es un banco" — Residual
   Income es candidato fuerte en Goldman por razones distintas
   (ROE/book value/excess returns de una firma de mercados, no por NIM)
   de las que lo hicieron candidato fuerte en Bancolombia (§32).

**La conclusión correcta depende de la economía, no de la etiqueta
sectorial.**

## 36. Arquitectura universal vs. arquitectura financiera

`INFERENCIA METODOLÓGICA`, sin cambio de nivel formal respecto al Caso
06: **arquitectura universal del proceso de valoración ≠ arquitectura
financiera específica del método y de la economía valorada.**

La capa de proceso puede incluir transversalmente: evidencia → contexto
→ interpretación → estado de conocimiento → preguntas → normalizaciones
→ hipótesis/supuestos → selección/justificación metodológica →
aprobación experta → cálculo → conclusión profesional.

**Goldman agrega**: la arquitectura financiera específica puede variar
incluso entre actividades materialmente distintas que coexisten dentro
de una misma organización (§7, §34).

**No se eleva a R9. No se crea `industry_type`. No se crea `bank_mode`.
No se crea `financial_institution enum`.**

## 37. Preguntas que deben sobrevivir para Munich Re

El Caso 07 deja explícitamente abiertas, entre otras, las siguientes
preguntas — que Munich Re (Caso 08, autorizado, no iniciado) debe
intentar responder o romper, sin presuponer su resultado:

1. ¿Bancolombia-G (§20) aparece también en seguros/reaseguros?
2. ¿ISA-F (§16) vuelve a aparecer mediante activos destinados a soportar
   obligaciones, capital o regulación?
3. ¿Munich Re obliga finalmente a separar base de medición de régimen
   monetario dentro del Candidato E (§18)?
4. ¿Reservas y contratos de larga duración refuerzan los Candidatos B y
   C (§24, §25)?
5. ¿Residual Income sigue siendo fuerte en seguros/reaseguros (§32)?
6. ¿FCFE adaptado a capital sigue funcionando conceptualmente (§32)?
7. ¿DDM/distribuciones potenciales vuelve a aparecer (§32)?
8. ¿SOTP vuelve a ser material (§32)?
9. ¿La unidad económica adecuada de análisis vuelve a diferir de la
   entidad legal/segmento contable (§7, §23)?
10. ¿La observación de compensación de Goldman (§21) es simplemente R3/R7
    o revela algo más amplio?

**No se inicia Munich Re durante esta ejecución.**

## 38. Información posterior al corte — 2026

**Esta información NO pertenece a FY2025** y no se mezcla con los
hallazgos de §6–§37.

`INFORMACIÓN POSTERIOR AL CORTE — 1T26 y 2T26`: este caso no incorpora
cifras específicas de 1T26/2T26 — la síntesis recibida para este caso se
concentró en el cierre FY2025. `DESCONOCIDO` el detalle cuantitativo de
2026 en este documento.

**Regla explícita, que no admite excepción**: si en una futura ejecución
se incorpora información posterior al corte, esta no debe reescribir
retroactivamente ningún hecho, cifra o clasificación que fuera verdadera
al 31 de diciembre de 2025.

## 39. Preguntas a gerencia (representativas, no exhaustivas)

**Anatomía económica / segmentos**

1. ¿Cómo se determina la asignación de balance, capital y financing
   entre GBM y AWM?
2. ¿Qué proporción de Assets Under Supervision corresponde a mandatos
   discrecionales vs. no discrecionales?

**Balance**

3. ¿Qué criterios internos distinguen partidas de balance
   operativas de partidas de financiación dentro de trading assets y
   collateralized agreements/financings?

**Financing**

4. ¿Qué proporción de FICC Financing + Equities Financing corresponde a
   client financing vs. financing propio del balance de Goldman?

**Derivados**

5. ¿Qué políticas internas de netting/collateral determinan la cifra
   neta reconocida en balance frente a la posición bruta?
6. ¿Qué proporción del notional corresponde a client facilitation vs.
   posición propia?

**Repos / securities borrowed-loaned**

7. ¿Qué proporción de repos/reverse repos se gestiona como financiación
   propia vs. client facilitation/liquidity management?

**Collateral**

8. ¿Qué proporción del collateral recibido tiene derechos contractuales
   de reuse/rehypothecation, y bajo qué condiciones?

**Fair value**

9. ¿Qué proporción de activos/pasivos Level 3 corresponde a qué líneas
   de negocio, y qué supuestos de valoración usa la administración?

**Capital / distribución**

10. ¿Cómo determina la administración la capacidad sostenible de
    distribución frente a los requerimientos de CET1, RWA y
    Supplementary Leverage Ratio?

**Compensación**

11. ¿Qué proporción de la compensación 2025 es diferida/variable, y bajo
    qué condiciones de vesting o clawback?

**Método de valoración**

12. ¿Qué metodología de valoración usan internamente los analistas que
    cubren la acción de Goldman Sachs?

Estas preguntas siguen el mismo flujo usado en los casos previos:

```
hecho → desconocido/evidencia insuficiente → pregunta → respuesta/
evidencia futura → eventual decisión
```

Ninguna de estas preguntas se responde en este documento.

## 40. Qué NO se creó como candidato nuevo

Para evitar sobreingeniería, este documento **no** crea candidatos
independientes para fenómenos que, aunque reales y documentados, se
absorben dentro de reglas o candidatos ya existentes:

- "Financing es siempre operación en instituciones financieras" — no se
  afirma; se absorbe en R1 con la formulación prudente de §10.
- Diferencias funcionales entre repos, securities borrowed/loaned, y
  collateral (§13–§15) — absorbidas en R1 y R4.
- La observación de compensación (§21) — explícitamente `EVIDENCIA
  INSUFICIENTE PARA CREAR CANDIDATO`, no se convierte en "Goldman-H".
- La distinción arquitectura universal vs. financiera (§36) — se
  mantiene como `INFERENCIA METODOLÓGICA`, no se eleva a R9.

## 41. Qué el Caso 07 NO demostró

El documento deja explícitamente abierto que Goldman Sachs **no
demostró**:

- que Residual Income sea el método final;
- que FCFE sea el método final;
- que DDM sea el método final;
- que SOTP sea obligatorio;
- que Enterprise Value sea inútil para toda institución financiera;
- que el Candidato A (neteo) deba elevarse ya, sin refinar su
  formulación;
- que toda posición de collateral esté disponible o esté restringida;
- que todo Level 3 sea irregular;
- que la observación de compensación sea un candidato nuevo;
- que CET1 (o cualquier métrica de capital regulatorio) deba convertirse
  directamente en input de valoración;
- que todas las instituciones financieras necesiten la misma
  metodología;
- que lo aprendido en Goldman aplique a Munich Re;
- que la observación ISA-F ya deba elevarse a Candidato F;
- que Bancolombia-G sea ya candidato transversal;
- que el Candidato E deba dividirse ahora;
- que el Bloque 1B esté cerrado;
- que el Bloque 1C esté cerrado;
- que WACC haya sido reemplazado como concepto;
- que Cost of Equity haya sido aprobado;
- que exista un método final de valoración para Goldman Sachs.

## 42. Conclusión metodológica propuesta

Con siete casos independientes (Tecnoglass, Terpel, Ecopetrol, Grupo
Éxito, ISA, Bancolombia, Goldman Sachs), el estado de cada regla queda
así — evitando deliberadamente un conteo agregado que pueda ocultar
diferencias de madurez entre reglas (consistente con la corrección
aplicada tras el Caso 04):

- **R1, R2, R4 (base), R7 y R8** reaparecen de forma transversal e
  idéntica: `PATRÓN OBSERVADO EN SIETE CASOS`.
- **R3**: su núcleo conceptual es también `PATRÓN OBSERVADO EN SIETE
  CASOS` (§22), pero el diseño de `assumption_relations` sigue
  insuficientemente validado — Goldman lo deja aún más insuficientemente
  validado, no menos.
- **R5** sobrevive y se profundiza, sin etiqueta transversal formal
  distinta de la definida en §22.
- **R6** sobrevive incompleto; `scope` mantiene su nivel; `purpose`
  reduce materialmente su brecha de madurez frente a `scope`, sin
  fusionarse con él.

Ninguna de estas ocho reglas se declara ley universal por haber
reaparecido en siete casos.

**Conclusión propuesta del caso**: Goldman Sachs demuestra que, incluso
dentro de una misma organización financiera, la arquitectura financiera
adecuada puede variar entre actividades materialmente distintas
(advisory, market making, financing, asset management, wealth, e
investment activities). Refuerza que una arquitectura profesional de
valoración puede conservar principios de proceso transversales
—evidencia, interpretación económica, estado de conocimiento,
normalización trazable, preguntas, supuestos y aprobación experta— sin
imponer una arquitectura financiera universal, ni siquiera dentro del
mismo sector ampliamente etiquetado como "institución financiera".

**Esta conclusión no se convierte en regla universal.** Munich Re
todavía debe intentar romperla.

## 43. Estado del caso al final de esta ejecución

**Estado: `ANÁLISIS DOCUMENTADO — PENDIENTE DE REVISIÓN Y CIERRE FORMAL
POR EL FUNDADOR`.**

Este documento **no está formalmente cerrado ni congelado**. El cierre
formal del Caso 07 requiere: (1) revisión del resultado documental por
Nicolás/fundador; (2) posibles correcciones de redacción o de etiquetado
epistémico; (3) autorización explícita y posterior del fundador para el
cierre y congelamiento, en una ejecución separada — siguiendo el mismo
patrón usado en los Casos 03, 04, 05 y 06.

**Este documento no cierra R1–R8 como leyes universales, no cierra la
metodología, no cierra los Bloques 1B ni 1C, no congela el Expediente
como arquitectura, no cierra ninguno de los Candidatos A–E ni las
observaciones ISA-F y Bancolombia-G, no selecciona método de valoración
final, no aprueba WACC, Cost of Equity, g ni un horizonte nuevo, y no
autoriza que Munich Re se asuma similar a Goldman Sachs o a
Bancolombia** — Munich Re todavía debe intentar romper estas
conclusiones (§37).

## 44. Prohibición explícita de interpretar el documento como autorización de implementación

**CASO 07 NO AUTORIZA IMPLEMENTACIÓN.** Ni el Caso 01, ni el Caso 02, ni
el Caso 03, ni el Caso 04, ni el Caso 05, ni el Caso 06, ni el Caso 07,
ni ninguno de sus reportes de contraste, ni ninguna actualización del
Expediente basada en ellos, constituyen autorización para implementar
ninguna estructura técnica: clasificación epistémica nueva, campos
reported/normalized/projected nuevos, `account_components` nuevos,
`case_assumptions` ampliados, projection drivers, `assumption_relations`,
`coherence_flags`, `scope`, `purpose`, `case_perimeter`, `netting`,
modelo de collateral, `economic_lifecycle`, `economic_period`,
`measurement_basis`, `availability`, `regulatory_capital`,
`capital_bridge`, `distributable_capital`, `bank_metrics`, `credit_risk`
engine, PD, LGD, EAD, un motor de ECL, un enum de stages, campos de
CET1, campos de RWA, un campo `cost_of_equity`, `valuation_method`, un
motor de Residual Income, un motor de DDM, un motor de FCFE, un motor de
SOTP, un "bank mode", un enum de institución financiera, `industry_type`,
un modelo de compensación, ni ningún schema, tabla, migración, UI, Edge
Function o automatización. Solo Nicolás/fundador puede autorizar
implementación, de forma explícita y separada, caso por caso.

**Este documento NO declara el Caso Público 07 — The Goldman Sachs
Group, Inc. formalmente cerrado ni congelado** (§43). El cierre formal
requiere revisión y autorización explícita posterior del fundador, en
una ejecución separada.
