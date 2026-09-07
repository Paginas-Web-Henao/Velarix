# Metodología de Valoración Velarix v5.0

**Versión:** 1.1
**Fecha:** 2026-09-02
**Autor:** Nicolás Henao
**Estado:** Documento metodológico definitivo — deriva su autoridad de `03-methodology-decisions-v5.md` v1.1 (2026-08-31), aceptado como fuente canónica de decisiones metodológicas para v5.0.
**Regla de autoridad:** si cualquier documento histórico de Velarix contradice `03` v1.1, prevalece `03` v1.1. Este documento no reabre ninguna decisión ya cerrada en `03`.

**Nota de revisión v1.1:** corrige referencias a estándares IVS de una edición anterior a la edición vigente (efectiva desde el 31 de enero de 2025); precisa terminología de basis of value; elimina absolutismos en el tratamiento fiscal de estado estable y en el tax shield del WACC; elimina afirmaciones absolutas sobre caja operativa; separa explícitamente riesgo país de riesgo de comercialización sin asumir solapamiento por defecto; retira valores numéricos de mercado fechados del cuerpo metodológico; completa el mapa de implementation mismatches; precisa el tratamiento de leases y NCI; y reduce la extensión general eliminando redundancia y genealogía histórica no esencial.

---

## 1. Propósito y filosofía metodológica

Velarix es un proyecto técnico personal de valoración corporativa diseñado para demostrar criterio financiero, modelación reproducible y trazabilidad de decisiones mediante un caso completo. Cada número del resultado final debe poder rastrearse hasta una de tres fuentes: evidencia observada, un supuesto documentado, o un cálculo determinístico aplicado sobre las dos anteriores.

Esta distinción de tres capas organiza todo el documento:

- **Evidence:** un hecho verificable en fuente primaria (estado financiero auditado, nota, dato oficial). No se interpreta; se registra con su procedencia.
- **Judgment:** una decisión humana frente a evidencia insuficiente o ambigua — qué comparables usar, si una partida es genuinamente no recurrente, qué `g` terminal es sostenible. Se ejerce dentro de un marco cerrado (Secciones 3–15) y debe justificarse con evidencia y razonamiento explícitos.
- **Calculation:** la aplicación determinística de fórmulas sobre evidencia y supuestos ya fijados. No decide nada; ejecuta lo que evidencia y juicio determinaron.

La mayoría de los errores serios de valoración ocurren cuando una capa se disfraza de otra: un ajuste sin evidencia verificable es juicio disfrazado de evidencia; una normalización de signo aplicada uniformemente sobre toda una tabla de datos es cálculo disfrazado de juicio, porque decide silenciosamente que ningún signo negativo observado es económicamente significativo; un motor que selecciona un WACC o aprueba un `g` terminal sin intervención humana es cálculo usurpando juicio. De ahí el principio de arquitectura central: **el motor de cálculo no tiene autoridad metodológica** — ejecuta, reproduce y sensibiliza; no decide, no interpreta, no aprueba (Sección 17).

**Trazabilidad** significa que cualquier cifra puede recorrerse hacia atrás hasta su origen sin zonas oscuras. **Reproducibilidad** significa que el mismo conjunto de evidencia y supuestos produce, en cualquier momento, exactamente el mismo resultado. El **criterio de defendibilidad técnica** que gobierna cada decisión no es "¿es correcto en abstracto?", sino: ¿puede explicarse, frente a un interlocutor financiero competente, por qué se tomó esta decisión, qué alternativas existían y por qué se rechazaron? Fuentes académicas y normativas — IVSC, Damodaran/NYU Stern, DIAN, Banco de la República, IFRS Foundation — se usan como evidencia y contraste para sostener esa defensa, no como aprobación externa previa a avanzar.

---

## 2. Alcance y base de la valoración

Toda valoración debe fijar, antes de calcular:

**Objeto de valoración y subject interest.** Qué se valora: la empresa operativa (enterprise), el patrimonio de los accionistas (equity), o un interés específico dentro de ese patrimonio (participación minoritaria, bloque de control). Esta definición determina el tratamiento del puente EV→Equity (Sección 12) y la aplicabilidad de descuentos o primas por control/minoría (Sección 13).

**Basis of value.** IVS 102 (*Bases of Value*, edición vigente desde el 31 de enero de 2025) define **Market Value** como una basis específica, con supuestos propios (comprador y vendedor dispuestos, condiciones de independencia mutua, período de comercialización adecuado). **Investment Value/Worth** es una basis distinta: el valor para un tenedor o comprador particular, que puede incorporar sinergias o expectativas específicas no admisibles bajo Market Value. **Fair Market Value** es una noción que existe bajo marcos jurisdiccionales específicos (por ejemplo, ciertos contextos fiscales o legales) y **no debe equipararse automáticamente a Market Value** — sus supuestos y su origen normativo son distintos. Este documento no traduce mecánicamente entre las tres; la basis concreta bajo la cual se valora Alpina es una decisión pendiente que debe fijarse explícitamente antes de calcular, no asumirse por defecto.

**Fecha de valoración, unidad monetaria y régimen nominal/real.** La fecha de valoración se distingue del período financiero base (Sección 4) y se desarrolla en la Sección 14. La moneda y el régimen nominal/real deben ser consistentes entre flujos y tasa de descuento (Sección 10.3); ninguna de las dos decisiones tiene un valor por defecto universal.

**Materialidad.** Principio cualitativo: **una partida, ajuste u omisión es material cuando razonablemente podría cambiar una conclusión de la valoración, un input material del modelo, o el rango de valoración presentado** — no una función del tamaño absoluto desconectada de su efecto. El umbral cuantitativo concreto no tiene una respuesta única en la literatura de valoración consultada y se calibra en cada caso contra su propio Enterprise Value y su propio rango de sensibilidad.

---

## 3. Jerarquía de evidencia e integridad de datos

### 3.1 Jerarquía de evidencia

De mayor a menor solidez: **(1)** estados financieros auditados y sus notas — cuando una nota sustenta de forma verificable una partida y su monto, constituye por sí sola evidencia suficiente; **(2)** reportes oficiales y filings regulatorios; **(3)** comunicaciones oficiales de la empresa; **(4)** información adicional verificable (contratos, benchmarks, estudios sectoriales) — exigida cuando está disponible y cuando la materialidad o naturaleza de la partida lo amerita, no como requisito universal previo; **(5)** fuentes secundarias — solo cuando no existe evidencia primaria, siempre identificadas como tales.

Cuando la evidencia disponible es insuficiente para sustentar una partida con el nivel de solidez que su materialidad exige, la respuesta correcta es registrar explícitamente la limitación (Sección 18), no forzar una conclusión. Toda evidencia usada conserva su **provenance**: documento de origen, fecha, y convención de presentación.

### 3.2 Convención de signos

Cualquier cuenta atraviesa cuatro capas: **(1)** signo reportado/original; **(2)** convención de presentación (débito/crédito, paréntesis, notación local); **(3)** transformación técnica aplicada para llevarla a convención canónica; **(4)** valor económico usado en el cálculo. El principio de cierre: **se preserva el signo observado y su procedencia; no se aplica una normalización de signo universal (`Math.abs()` o equivalente) como regla general.** Cuando una fuente usa una convención distinta de la canónica, la transformación debe ser **explícita, documentada, reversible y trazable** — nunca una operación ciega sobre un objeto de datos completo.

Ocultar el signo original destruye información económica real: un patrimonio negativo, una reversión de gasto y una nota crédito significan cosas distintas entre sí y distintas de "un número positivo invertido por convención de captura". Una transformación no documentada no puede auditarse ni revertirse si resulta incorrecta para un caso concreto. Este principio no depende de una fuente externa para su justificación — es consistencia interna de auditoría de datos, reforzada por el requisito general de sustanciación y verificabilidad de inputs (IVS 104, *Data & Inputs*, edición vigente desde el 31 de enero de 2025).

Qué partidas de un caso real presentan efectivamente signos que requieren verificación manual es una pregunta de evidencia del caso (Sección 19), no un principio general adicional.

---

## 4. Reconstrucción financiera histórica

La reconstrucción histórica (income statement, balance sheet, cash flow, y las métricas derivadas: EBITDA, EBIT, D&A, deuda, caja, capital de trabajo, CAPEX) organiza la evidencia disponible como punto de partida para la normalización (Sección 5) y la proyección (Sección 9). Cada cifra se clasifica en una de cuatro categorías, registrada junto con el número:

- **Reported:** el valor tal como aparece en el estado financiero o su nota, sin más transformación que la convención de signo de la Sección 3.2.
- **Derived:** calculado a partir de cifras reportadas mediante una identidad contable o financiera estándar (por ejemplo, EBIT = EBITDA − D&A, o capital de trabajo derivado de saldos de cuentas corrientes).
- **Normalized:** un valor reportado o derivado ajustado según el procedimiento de la Sección 5, con evidencia y justificación documentadas.
- **Assumed:** un valor que no proviene de evidencia directa del caso, sino de un supuesto explícito adoptado para la proyección o el cálculo.

Presentar un valor asumido con la misma apariencia que uno reportado, sin distinguirlos, es una de las formas más comunes en que un modelo pierde defendibilidad. Este documento no presenta cifras del caso Alpina — su reconstrucción financiera real es trabajo del Expediente de ese caso.

---

## 5. Normalización de EBITDA

**Objetivo.** Ajustar el EBITDA reportado para reflejar la capacidad de generación de utilidad operativa recurrente y sostenible, removiendo partidas no representativas de la operación futura esperada. **Normalizar no significa maximizar el EBITDA** — un ajuste que reduce la cifra reportada es tan legítimo como uno que la incrementa; el criterio nunca es la dirección del ajuste, es si la partida ajustada refleja o no la operación recurrente.

**Procedimiento de admisibilidad.** Un ajuste solo es admisible si satisface: **(1)** evidencia suficiente y verificable, proporcional a la naturaleza y materialidad del ajuste — sin formato único obligatorio; los estados auditados y sus notas bastan por sí solos para muchos ajustes, documentación adicional se exige cuando está disponible y la materialidad lo amerita; **(2)** clasificación recurring vs. genuinely non-recurring — una partida etiquetada "no recurrente" que aparece todos los años bajo etiquetas cambiantes no califica; **(3)** encaje en una categoría reconocida, cada una con su propio estándar de evidencia:

| Categoría | Qué exige la evidencia |
|---|---|
| No operativa | Que sea ajena al giro del negocio |
| Compensación de propietario/familiares | Benchmark de mercado defendible para la posición, no solo la afirmación |
| Partes relacionadas | Evidencia de que el precio/término difiere de mercado, no solo que existe la relación |
| Reestructuración / litigios / disposición de activos / subsidios / FX / impairments | Evidencia de carácter aislado y no operativo |

En todos los casos rige la distinción **clasificación contable vs. sustancia económica**: el ajuste corrige la sustancia, no solo reclasifica la forma. **(4)** Comparabilidad NIIF 16: si se compara EBITDA contra comparables o períodos bajo un régimen de arrendamientos distinto, debe documentarse el efecto (NIIF 16 eleva el EBITDA reportado al excluir el gasto de arrendamiento, reemplazado por depreciación e interés).

Todo ajuste conserva, de forma auditable, el valor original y el ajustado, con evidencia y aprobador.

**Ejemplo conceptual** (sin relación con ningún caso real): Reported EBITDA = 100. Se identifica una indemnización por litigio laboral aislado, documentada en la nota de contingencias de los estados auditados, sin precedente en cinco años. Se revierte: Normalized EBITDA = 108, con el ajuste registrado junto a su evidencia y categoría. Un ajuste sin esa nota, o recurrente bajo etiquetas distintas en varios años, no habría calificado.

**Fuente:** consenso de la práctica profesional de valoración/M&A sobre categorías de normalización, combinado con el requisito general de sustanciación de inputs de IVS 104 (*Data & Inputs*) aplicado a ajustes de normalización. No existe una norma numerada única que codifique estas categorías como estándar oficial.

---

## 6. Marco de flujo de caja libre a la firma (FCFF)

$$FCFF = EBIT \times (1 - T) + D\&A - CAPEX - \Delta NWC$$

**EBIT** es la utilidad operativa antes de intereses e impuestos, de la reconstrucción (Sección 4) y, cuando corresponda, la normalización (Sección 5). **NOPAT** es $EBIT \times (1-T)$. **D&A** es depreciación y amortización del período. **CAPEX** es la inversión bruta de capital. **ΔNWC** es la variación del capital de trabajo operativo (Sección 7).

**Por qué el interés no se resta.** El FCFF mide el flujo disponible para todos los proveedores de capital, antes de cualquier decisión de financiamiento. Restar el interés contaría el efecto de la estructura de capital dos veces: en el flujo y en la tasa de descuento (el WACC ya incorpora el costo de deuda ponderado por su peso). Esto hace al FCFF **neutral respecto a la estructura de capital** — el mismo negocio produce el mismo FCFF sin importar cuánta deuda tenga, porque el efecto de la deuda se traslada íntegramente al WACC.

**Impuesto algebraico vs. cash tax effect.** $EBIT \times (1-T)$ es una presentación algebraica que asume monetización inmediata y completa del efecto fiscal — puede diferir del efecto en efectivo real cuando existen diferencias temporales o pérdidas fiscales compensables (NOLs). Deben distinguirse cinco conceptos: tasa estatutaria/general, tasa marginal, tasa efectiva, cash tax rate, y NOLs (que reducen la efectiva/cash mientras se compensan, sin cambiar la marginal de largo plazo).

**Principio de uso.** La tasa fiscal del **estado estable** (valor terminal) debe representar la carga fiscal marginal/cash sostenible de largo plazo. Normalmente convergerá hacia la tasa marginal estatutaria aplicable, porque en perpetuidad las distorsiones puramente transitorias (NOLs, diferencias temporales) se agotan según su capacidad legal/económica de utilización (ver más abajo). Pero **cualquier régimen, beneficio o característica fiscal con evidencia razonable de persistencia estructural** — no transitoria — debe evaluarse explícitamente antes de asumir esa convergencia; la tasa marginal estatutaria no es una regla absoluta e incondicional para el año terminal, es el resultado esperable en ausencia de evidencia de una condición fiscal estructural distinta. Para el **horizonte explícito**, la tasa efectiva/cash puede ser menor que la marginal si existen compensaciones en uso, convergiendo a medida que se agotan.

**EBIT negativo, NOLs y realización.** No se afirma, como regla mecánica, que EBIT negativo implique tasa cero, ni que genere automáticamente un beneficio fiscal inmediato vía $EBIT \times (1-T)$ sin más — ambos son versiones del mismo error: sustituir el análisis de realización por un automatismo. **Solo se reconoce un beneficio fiscal (o su ausencia) cuando existe capacidad legal y económica razonable de utilizarlo**, evaluando: si existen NOLs u otros créditos acumulados y su saldo disponible; si la jurisdicción permite compensación futura (o pasada, vía carryback) y bajo qué límites; si existe utilidad gravable futura razonablemente esperable, propia o consolidada a nivel de grupo si el régimen lo permite. Un EBIT negativo puntual dentro de una empresa con utilidad gravable consistente en otros años o entidades puede seguir generando un beneficio realizable; una pérdida sin utilidad gravable futura esperable no lo genera, independientemente del signo del EBIT en ese año.

**Fuente:** Aswath Damodaran / NYU Stern, *More on effective tax rates* — convergencia de la tasa efectiva hacia la marginal a medida que se agotan pérdidas acumuladas; las reglas jurisdiccionales específicas (carryback, límites de compensación, consolidación fiscal) remiten a normativa tributaria local verificable caso por caso (para Colombia, DIAN/Estatuto Tributario).

---

## 7. Capital de trabajo operativo

$$\text{Non-cash Operating Working Capital} = \text{Activos corrientes operativos} - \text{Pasivos corrientes operativos}$$

**Incluye:** cuentas por cobrar comerciales, inventario, otros activos corrientes operativos; cuentas por pagar comerciales y otros pasivos corrientes acumulados/operativos. **Excluye caja y valores negociables** — Velarix utiliza *Non-cash* Operating Working Capital para el FCFF; por esa definición, cash y marketable securities se excluyen del cálculo de NWC y se analizan separadamente en el puente EV→Equity (Sección 12), evitando que su efecto se cuente dos veces. Si la evidencia de un caso concreto sugiere una necesidad de caja operativa mínima distinta del exceso de caja, esa porción debe clasificarse con cuidado para no contarse simultáneamente en capital de trabajo, exceso de caja y puente EV→Equity — la clasificación exacta es case-specific. **Excluye deuda financiera con intereses** (incluida su porción corriente): es financiamiento, no operación; su efecto ya está en el WACC, e incluirla en el capital de trabajo sería *double-dipping*.

$$\Delta NWC_t = NWC_t - NWC_{t-1}$$

El ΔNWC no es independiente del crecimiento de ingresos: un negocio que crece típicamente necesita financiar más cuentas por cobrar e inventario (parcialmente compensado por más cuentas por pagar) antes de que ese crecimiento se traduzca en caja. Proyectar el ΔNWC desconectado del crecimiento asumido en el mismo período es una inconsistencia interna, salvo que la relación se justifique explícitamente.

Estructuras de *supplier finance*/*reverse factoring* — que aparecen contablemente como cuenta por pagar comercial pero pueden funcionar económicamente como financiamiento bancario — no se resuelven aquí de forma general; su clasificación depende de la sustancia económica del acuerdo específico (quién financia, a qué tasa, con qué garantías), evaluada caso por caso (Sección 19).

**Fuente:** Aswath Damodaran / NYU Stern, definición estándar de *Non-cash Working Capital*, con justificación explícita de exclusión de caja y de deuda con intereses (*"counting it among working capital is double-dipping"*).

---

## 8. CAPEX, reinversión y crecimiento

$$\text{Net CAPEX} = \text{Gross CAPEX} - D\&A \qquad \text{Reinvestment} = \text{Net CAPEX} + \Delta NWC$$

$$g \approx \text{Reinvestment Rate} \times ROC \qquad \text{donde } \text{Reinvestment Rate} = \text{Reinvestment}/NOPAT,\ \ ROC = NOPAT/\text{Capital Invertido}$$

En **estado estable** (año terminal, Sección 11), la relación se invierte:

$$\text{Reinvestment Rate}_{\text{estable}} = g / ROC$$

Esta relación conecta, dentro del mismo modelo, cuánto crece la empresa, cuánto reinvierte, y qué tan eficientemente convierte esa reinversión en utilidad operativa — sin ella es posible construir, sin darse cuenta, un valor terminal que asume crecimiento perpetuo sin la reinversión necesaria para sostenerlo.

Nótese la consistencia con el FCFF (Sección 6): dado que $\text{Reinvestment} = (CAPEX - D\&A) + \Delta NWC$,

$$FCFF = EBIT(1-T) + D\&A - CAPEX - \Delta NWC = NOPAT - \text{Reinvestment}$$

El FCFF es, de forma equivalente, NOPAT menos la reinversión total del período — la misma reinversión que gobierna la relación de crecimiento anterior.

Deben distinguirse conceptualmente **maintenance CAPEX** (mantener capacidad y calidad actual), **growth CAPEX** (expandir capacidad o entrar a nuevos mercados), inversión en **intangibles**, **expansión** y **reposición**. **No se fija una regla universal del tipo "maintenance CAPEX = D&A"** — es una aproximación común cuando no hay mejor evidencia, no una identidad necesaria; la relación exacta depende del plan de inversión real y del historial CAPEX vs. D&A del caso (Sección 19).

**Fuente:** Aswath Damodaran / NYU Stern — fórmula de crecimiento estable y su inversa para el año terminal; definición de reinversión como Net CapEx + ΔWC.

---

## 9. Metodología de proyección (forecast)

Cada driver del horizonte explícito — crecimiento de ingresos, margen EBITDA, reinversión, capital de trabajo, CAPEX, tasa impositiva — debe defenderse individualmente con evidencia y razonamiento, no heredarse por defecto de un valor genérico.

El horizonte debe extenderse el tiempo suficiente para que la empresa alcance un **estado razonablemente estable** — el punto en que márgenes, intensidad de capital, estructura de capital y perfil de riesgo dejan de cambiar materialmente año a año, y desde el cual el valor terminal (Sección 11) puede construirse con coherencia. Un valor terminal construido sobre un año todavía en transición traslada esa inconsistencia, magnificada, al componente que típicamente domina el Enterprise Value.

El horizonte de cinco años usado actualmente por el motor de cálculo de Velarix es un **placeholder técnico del sistema, no una ley metodológica universal**. No existe un fundamento financiero que fije la duración correcta de un horizonte explícito en un número específico de años aplicable por igual a cualquier empresa; la duración correcta depende de cuánto tiempo requiere, razonablemente, la empresa concreta para llegar a un estado estable defendible desde su situación actual. Este documento no fija un nuevo horizonte para ningún caso — exige que la duración se justifique frente al criterio de convergencia, dejando la duración concreta como decisión de evidencia del caso.

La convergencia hacia estado estable debe ser explícita y gradual: si el margen, la reinversión o el crecimiento del último año proyectado difieren sustancialmente de los supuestos de estado estable del valor terminal, esa discontinuidad debe justificarse o corregirse extendiendo el horizonte, no ignorarse.

---

## 10. Costo de capital

### 10.1 Estructura de capital

Los pesos de estructura de capital del WACC deben usar **valores de mercado/económicos, no valores contables**, siempre que exista una base razonable para estimarlos, y deben ser **internamente consistentes** con el beta usado (apalancado/desapalancado al mismo nivel de deuda), con el costo de deuda, y con cualquier otro supuesto del caso. Para una empresa privada no existe un valor de mercado observable de su propio equity, lo que descarta usar su book value como si fuera equivalente a un valor de mercado sin cuestionamiento — pero no hay una única alternativa correcta:

- **(a) Estructura de mercado promedio de comparables de industria** (desapalancada/reapalancada) — default práctico razonable cuando no existe evidencia mejor sustentada de una estructura objetivo propia, porque es observable y no depende circularmente del resultado que se calcula.
- **(b) Estructura objetivo explícita** de la propia empresa, declarada y justificada con evidencia (política de apalancamiento documentada, plan de refinanciamiento).
- **(c) Estructura óptima** derivada de un análisis propio (por ejemplo, minimización del WACC dentro de un rango de apalancamiento sostenible).
- **(d) Proceso iterativo** que converge equity value y estructura de capital simultáneamente, resolviendo la circularidad.

La estructura contable observada se conserva siempre como **verificación de sanidad** frente a cualquiera de las cuatro — un resultado que se aparta sustancialmente sin justificación merece revisión, no aceptación automática. No es defendible usar el book value propio como proxy no cuestionado de un valor de mercado, ni una elección que deje inconsistencia entre beta, costo de deuda y pesos.

**Fuente:** Aswath Damodaran / NYU Stern — tratamiento estándar de estructura de capital para empresas privadas: valores de mercado/económicos sobre book value, circularidad del equity value como input y output simultáneo, comparables de industria desapalancados/reapalancados como método reconocido.

### 10.2 Costo de equity (CAPM)

$$K_e = R_f + \beta_L \times ERP_{\text{maduro}} + \lambda \times CRP$$

$R_f$ es la tasa libre de riesgo en la moneda del modelo (10.3); $\beta_L$ el beta apalancado consistente con la estructura elegida (10.1); $ERP_{\text{maduro}}$ la prima de riesgo de un mercado maduro de referencia; $CRP$ la prima de riesgo país; $\lambda$ el factor de exposición de la empresa a ese riesgo (10.4).

### 10.3 Tasa libre de riesgo y moneda

Flujos nominales en una moneda deben descontarse con tasa nominal en esa misma moneda; flujos reales requieren tasa real. **Un rendimiento soberano con riesgo de default no es automáticamente una tasa libre de riesgo** — usarlo directamente como risk-free local y, además, sumar un CRP por separado, cuenta el mismo riesgo dos veces.

La relación principal para construir un risk-free local a partir de un risk-free limpio en otra moneda es la **relación de paridad de tasas (Fisher)**, no una aproximación aditiva:

$$(1 + R_{f,\text{local}}) = (1 + R_{f,\text{ref}}) \times \frac{(1 + \pi_{\text{local}})}{(1 + \pi_{\text{ref}})}$$

donde $R_{f,\text{ref}}$ ya está limpia de riesgo de default. La forma **aditiva** $R_{f,\text{local}} \approx R_{f,\text{ref}} + (\pi_{\text{local}} - \pi_{\text{ref}})$ es únicamente una **aproximación de primer orden**, válida cuando el diferencial de inflación es pequeño; con un diferencial grande puede desviarse de forma no despreciable y debe presentarse como aproximación, no como el método en sí. El riesgo soberano se incorpora **una sola vez**, como CRP dentro del costo de equity — no también dentro del risk-free.

**Fuente:** Aswath Damodaran / NYU Stern — relación de paridad de tasas de interés para construir risk-free rates en moneda local a partir de un risk-free en otra moneda y el diferencial de inflación esperada.

### 10.4 ERP y riesgo país

Deben distinguirse: **ERP de mercado maduro** (prima de un mercado de referencia sin riesgo soberano adicional significativo); **CRP** (componente adicional de riesgo específico del país); **exposición/lambda de la empresa** — no toda empresa domiciliada en un país tiene la misma exposición a su riesgo país; depende de dónde genera sus ingresos reales, no de dónde está domiciliada:

$$\lambda = \frac{\% \text{ ingresos domésticos (empresa)}}{\% \text{ ingresos domésticos (empresa promedio del mercado)}}$$

Esta razón de exposición a ingresos (`observed_revenue_exposure`) es el **método preferido** para determinar λ, y debe usarse siempre que ambos componentes — ingresos domésticos de la empresa e ingresos domésticos del promedio de mercado — tengan Evidence suficientemente sólida para estimarse sin falsa precisión.

**Cuando esa Evidence no es suficientemente sólida**, λ se resuelve como **Judgment experto directo y documentado** (`direct_documented_judgment`), no como una razón fabricada a partir de porcentajes que no pueden sostenerse con Evidence real. En esa vía: **λ=1 es el default metodológicamente defendible** ante Evidence cuantitativa insuficiente sobre exposición geográfica — no porque se afirme que la empresa tiene exposición exactamente promedio como hecho observado, sino porque no existe base suficientemente robusta para cuantificar una desviación de esa línea base. Un λ≠1 sin razón observada solo puede presentarse como **Judgment/sensitivity cualitativa explícitamente etiquetada como tal**, nunca como si fuera un ratio calculado. En ningún caso se fabrican porcentajes de ingresos domésticos, propios o de mercado, con el único propósito de satisfacer esta fórmula o el esquema de datos que la transporta. Esta vía de fallback es una regla de Judgment/gobernanza propia de Velarix (Secciones 1, 16 y 17), no una extensión del método de Damodaran citado abajo.

No debe existir doble conteo entre el CRP del costo de equity y cualquier otro ajuste de riesgo del modelo (Sección 13).

**Los market inputs no se fijan en este documento.** Risk-free, ERP maduro, country risk premium, spreads de default y tasas de política monetaria son valores de mercado que cambian con el tiempo — este documento no los cita como constantes metodológicas. **Todos los market inputs se congelan en el Expediente del caso con fuente, fecha de actualización, fecha de consulta y valuation date.** Las fuentes primarias recomendadas para obtenerlos al momento del cálculo son Damodaran/NYU Stern (risk-free, default spreads y country risk premiums, ERP implícito de mercado maduro, actualizados periódicamente) y Banco de la República (tasa de política monetaria, meta de inflación). Los valores concretos vigentes al momento de valorar Alpina se fijarán en su Expediente, usando la versión más reciente disponible y apropiada para su valuation date.

**Fuente:** Aswath Damodaran / NYU Stern, *Measuring Company Exposure to Country Risk* — definición de lambda y su aplicación (metodología independiente de la fecha de consulta).

### 10.5 Costo de deuda

Jerarquía, de mayor a menor preferencia: **(1)** costo marginal observable de la deuda propia de la empresa — tasas reales de créditos o bonos vigentes; **(2)** spread observable o estimado defendible por calificación crediticia comparable, tamaño y sector, cuando no hay deuda propia observable; **(3)** fallback documentado, usado solo cuando ninguna de las dos anteriores está disponible con evidencia suficiente, y presentado explícitamente como tal, con su limitación reconocida.

### 10.6 WACC

$$WACC = \frac{E}{D+E} \times K_e + \frac{D}{D+E} \times K_d \times (1-T)$$

Debe ser consistente en moneda, régimen nominal/real, y estructura de capital (los mismos pesos usados para des/reapalancar el beta) con el resto del modelo. Sobre impuestos: **la $T$ del tax shield de la deuda debe reflejar la tasa marginal económicamente relevante para la deducibilidad del interés y la capacidad real de la empresa de utilizar ese beneficio fiscal** — no necesariamente el mismo valor numérico que la tasa efectiva/cash aplicada al FCFF del mismo año (Sección 6), que puede diferir por NOLs, diferencias temporales, créditos o regímenes específicos. Ambas tasas deben ser coherentes entre sí frente a la misma situación fiscal real de la empresa, sin exigir igualdad numérica automática. Ningún componente de riesgo (país, tamaño, iliquidez) debe aparecer en más de un lugar del WACC ni duplicarse frente a un ajuste posterior (Secciones 12–13).

---

## 11. Valor terminal

$$TV_T = \frac{FCFF_{T+1}}{WACC - g} = \frac{FCFF_T \times (1+g)}{WACC - g}$$

**$WACC > g$ siempre, sin excepción** — de lo contrario el modelo no converge matemáticamente (verificación ya implementada como advertencia en el motor de cálculo actual).

El valor terminal domina típicamente el Enterprise Value de un DCF a horizonte finito — cualquier inconsistencia en sus componentes se magnifica al capitalizarse a perpetuidad. El año terminal debe representar un **estado estable defendible** en cinco dimensiones: **$g$ consistente con moneda e inflación** (un $g$ nominal no puede exceder razonablemente el crecimiento nominal de largo plazo de la economía de referencia); **margen EBITDA estable** (no simplemente el último margen proyectado sin verificar su sostenibilidad); **estructura de capital estable** (la objetivo/de largo plazo elegida en 10.1); **riesgo estable** (beta convergiendo a un nivel de empresa madura); **reinversión consistente** vía $\text{Reinvestment Rate}_{\text{estable}} = g/ROC$ (Sección 8).

**El último año proyectado no puede convertirse automáticamente en la base de la perpetuidad si todavía no representa, de hecho, un estado estable.** Si el horizonte explícito no fue suficientemente largo para converger en las cinco dimensiones, la respuesta correcta es extender el horizonte, no capitalizar un año de transición como si fuera perpetuo. Cualquier $g$ de escenario (pesimista/optimista) debe derivarse explícitamente del $g$ base con lógica documentada — nunca ser un literal sin relación declarada. El estado actual del motor de cálculo respecto a estos dos requisitos se registra en la Sección 18.

**Fuente:** Aswath Damodaran / NYU Stern — principios de "stable growth firm" (consistencia entre $g$, ROC, reinversión, riesgo y estructura de capital); práctica CFA estándar de $g \leq$ crecimiento nominal de la economía de referencia.

---

## 12. De Enterprise Value a Equity Value

**Principio rector.** Para cada partida: ¿es financiera (se resta/suma del EV) u operativa (ya está en el FCFF)? ¿está económicamente disponible para los accionistas? ¿ya se contó su efecto en otro punto del modelo — FCFF, WACC, EBITDA — de forma que incluirla aquí sería doble conteo? El riesgo central no es olvidar una partida — es contarla en el lugar equivocado o dos veces.

**Deuda financiera:** se resta — ya excluida del FCFF y reflejada en el WACC. **Caja:** se suma, distinguiendo **disponible** de **restringida** (garantías, depósitos regulatorios) — solo la disponible se suma sin ajuste. **Exceso de caja vs. caja operativa:** si una porción de la caja se trata como operativa dentro del capital de trabajo (Sección 7), esa misma porción no puede sumarse también aquí. **Inversiones/activos no operacionales:** se suman a valor de mercado o razonable.

**Leases.** No existe una única convención obligatoria para tratar el pasivo por arrendamiento en el puente — existen convenciones defendibles distintas, dependiendo de cómo se construyó el resto del modelo. El requisito de Velarix **no es "lease liability = debt" como regla de una línea**, sino **elegir una convención consistente y evitar modelos híbridos** que mezclen supuestos de convenciones distintas. La convención adoptada debe mantener consistencia entre: **(i)** si el EBITDA/EBIT usado es pre- o post-NIIF 16; **(ii)** la D&A del activo por derecho de uso (ROU) y si está incluida en la D&A del FCFF; **(iii)** los pagos de caja reales de arrendamiento y su reflejo en CAPEX/financiamiento; **(iv)** si el FCFF excluye el interés del pasivo de forma consistente con su tratamiento en el puente. Aplicar una convención sin verificar esta cadena completa puede penalizar el Equity Value dos veces, o dejar su efecto sin contar en ningún lado. La convención concreta para Alpina es case-specific (Sección 19).

**Asociadas y negocios conjuntos.** No se asume que el carrying value bajo equity method equivale al valor económico de la asociada — refleja participación en patrimonio contable histórico, que puede diverger de activos revaluados o expectativas de crecimiento no capturadas en libros. Si la participación es material, debe valorarse **separadamente** con metodología coherente; usar el carrying value como proxy solo es aceptable con justificación explícita de por qué la diferencia no es material.

**Intereses minoritarios (NCI).** Si el FCFF se deriva de estados consolidados al 100% (incluyendo subsidiarias no poseídas al 100%), el valor atribuible a NCI debe **restarse** del Equity Value. **El carrying value contable de los NCI no equivale automáticamente a su valor económico** — igual que con las asociadas, si la participación minoritaria es material, su valor económico puede divergir del registrado en libros y debe evaluarse con el mismo criterio de materialidad antes de usarse sin ajuste.

Pensiones u otras obligaciones debt-like se evalúan con la misma disciplina de consistencia que los leases, cuando son materiales. Este documento no diseña una nueva estructura de datos para representar de forma general estas partidas dentro del motor de cálculo — el marco se aplica caso por caso, con la evidencia específica de cada partida.

**Fuente:** IFRS Foundation, IFRS 16 *Leases* (vigente desde ejercicios que comienzan el o después del 1 de enero de 2019) — exige el reconocimiento contable del ROU y el pasivo, pero no dicta por sí sola el tratamiento en un puente EV→Equity. IAS 28 *Investments in Associates and Joint Ventures* — tratamiento general del equity method. IVS 200 (*Businesses and Business Interests*, edición vigente) — marco general de valoración de intereses empresariales, incluyendo ajustes por partidas no operativas y perímetro de consolidación.

---

## 13. Consideraciones de empresa privada

### 13.1 DLOM y size premium: condicionales, no automáticos

Ni el DLOM ni el size premium son ajustes obligatorios por el solo hecho de que la empresa sea privada — ambos son condicionales, y `DLOM = no aplicable` es una conclusión metodológicamente válida si está justificada. La pregunta de cierre para el DLOM: **¿el interés que se valora es no comercializable, y los pasos previos de la valoración ya asumieron implícitamente un valor comercializable como punto de partida?** El DLOM es apropiado únicamente si ambas condiciones se cumplen. Un DCF valora directamente el interés económico proyectado de la empresa — a diferencia de un enfoque de mercado basado en comparables cotizados — por lo que su aplicabilidad depende de cómo se construyó ese DCF específico, no es automática por usar un DCF. Factores a evaluar, ninguno decisivo por sí solo: subject interest (control vs. minoría), basis of value, perspectiva del comprador cuando corresponda, comercialización real de activos subyacentes, tamaño relativo del bloque, liquidez de los activos, salud financiera. Para el size premium, la literatura de tamaño tiene cuestionamientos empíricos serios sobre su persistencia reciente; aplicarlo requiere justificación explícita, no una prima estándar.

*Nota de edición IVS:* bajo la edición vigente, el marco general de valoración de intereses empresariales — incluyendo ajustes de marketability y control — corresponde a **IVS 200**. Formulaciones específicas sobre DLOM citadas en versiones anteriores de la práctica de valoración (bajo numeración de una edición previa de los estándares) no deben presentarse como texto normativo vigente; el principio de condicionalidad aquí descrito se sostiene en IVS 200 y, para el detalle operativo de cómo evaluarlo, en el marco práctico de Damodaran/NYU Stern, dado que IVSC no publica gratuitamente el mismo nivel de detalle operativo.

### 13.2 Riesgo país y marketability son conceptos distintos

**Country risk ≠ marketability risk.** El CRP compensa el riesgo de operar en una economía o mercado de capitales específico — afecta a cualquier activo expuesto a ese país, cotizado o no. El DLOM compensa la falta de un mercado líquido para transar el interés específico que se valora. **No se asume, por defecto, que un CRP ya incorpora un DLOM** o la falta de comercialización de una participación privada — son riesgos de naturaleza distinta y no deben tratarse como sustitutos. La verificación de doble conteo solo es necesaria **cuando existe evidencia concreta de que un ajuste de liquidez específico ya fue incorporado explícitamente** en la tasa de descuento, en los flujos de caja proyectados, o en otro descuento aplicado — no como una suposición genérica de solapamiento entre ambos conceptos.

### 13.3 No existe una prima genérica por ser empresa privada colombiana

No se añade una prima de riesgo genérica adicional por el solo hecho de que la empresa sea privada y colombiana. Todo riesgo adicional a los ya incorporados (CRP/lambda en el WACC, DLOM/size premium condicionales) debe **identificarse económicamente**, **justificarse con evidencia del caso** — no invocarse por categoría genérica ("es una PyME", "es colombiana") — y **aparecer una sola vez** en el modelo. Una prima genérica adicional es, con alta probabilidad, doble conteo disfrazado de prudencia.

---

## 14. Convención de timing

**Fecha de valoración explícita**, distinta del período contable base (Sección 2). Cuando no coinciden, corresponde modelar un **stub period** para el primer tramo proyectado, en vez de tratarlo como año completo. Entre **year-end** y **mid-year**, la convención de **mid-year es la más defendible por defecto** para un negocio en operación continua — los flujos se generan a lo largo del año, no en un solo pago al cierre, y year-end subestima sistemáticamente el valor presente de flujos recibidos antes del cierre. Year-end sigue siendo defendible si se documenta como elección consciente, no como default silencioso. La convención elegida debe aplicarse **de forma consistente al valor terminal** — mezclar mid-year en la proyección explícita con year-end en la capitalización terminal (o viceversa) introduce una inconsistencia sin justificación económica.

**Fuente:** consistente con el tratamiento general de construcción técnica de modelos de valoración de IVS 105 (*Valuation Models*, edición vigente) y con la práctica estándar de valoración DCF, ampliamente documentada en la disciplina sin una fuente primaria única citada línea por línea.

---

## 15. Sensibilidad y análisis de escenarios adversos

El caso final debe poder responder, como mínimo, seis pruebas: **(1)** WACC/$g$ terminal (matriz); **(2)** crecimiento de ingresos; **(3)** margen EBITDA; **(4)** capital de trabajo; **(5)** reinversión/CAPEX; **(6)** downside específico de margen EBITDA de −300 puntos básicos.

**Sensibilidad no es escenario.** Una sensibilidad responde *ceteris paribus*: si una única variable cambia en una magnitud dada, manteniendo todo lo demás constante, ¿cómo cambia el resultado? Un escenario describe una narrativa donde varias variables cambian simultáneamente de forma consistente entre sí (un escenario recesivo combina menor crecimiento, compresión de margen y mayor costo de capital a la vez, porque suelen ocurrir juntos). Cada prueba responde una pregunta distinta: la matriz WACC/$g$ mide cuánto pesan tasa de descuento y crecimiento perpetuo; crecimiento y margen suelen ser, en una empresa privada concreta, drivers de mayor incertidumbre real que el propio WACC; capital de trabajo y reinversión exponen cuánto del valor depende de supuestos de eficiencia operativa; el downside de −300bps es una prueba mínima de resiliencia frente al escenario adverso más común en la práctica de M&A.

---

## 16. Gobernanza y trazabilidad de supuestos

Todo supuesto material debe registrar: **value/unit**, **date**, **source**, **rationale** (por qué es razonable para este caso), **nature** (observed / derived / assumed), **status** (confirmado, pendiente de verificación, o placeholder provisional), **version/history** (si cambió respecto a una versión anterior y por qué), e **impact on valuation** (cuánto pesa sobre el resultado, informado por las sensibilidades de la Sección 15). Esta estructura recoge la filosofía de trazabilidad del Expediente de Valoración sin exigir, en esta etapa, entidades de base de datos formales — un registro documental disciplinado dentro del propio análisis del caso satisface el requisito.

**Fuente:** IVS 106 (*Documentation & Reporting*, edición vigente) — requisito general de documentar bases, supuestos y fuentes de una valoración, aplicado aquí a nivel de supuesto individual.

---

## 17. Rol de la inteligencia artificial y del cálculo determinístico

**La IA puede:** extraer datos hacia una estructura organizada; clasificar partidas dentro de categorías ya definidas por este documento, para revisión humana; detectar inconsistencias entre datos o frente a la metodología; preparar preguntas para dirigir la búsqueda de evidencia faltante; preparar borradores de análisis o documentación de un ajuste.

**La IA no puede:** aprobar un ajuste de normalización de EBITDA; seleccionar silenciosamente el WACC; aprobar el $g$ terminal; determinar el DLOM o su aplicabilidad; decidir qué normalizaciones son admisibles; emitir la conclusión de valor sin juicio humano explícito sobre cada decisión material.

**El motor de cálculo**, una vez implementada la metodología de este documento, deberá ejecutar las fórmulas sobre evidencia y supuestos ya fijados; reproducir el mismo resultado dado el mismo conjunto de inputs; validar relaciones de consistencia interna ($WACC > g$; $\text{Reinvestment Rate}_{\text{terminal}} \approx g/ROC$); sensibilizar el resultado frente a variaciones de sus inputs. El estado actual de esa implementación frente a este requisito se registra en la Sección 18. **El motor no interpreta** — no decide si un ajuste es admisible, no elige entre alternativas metodológicas legítimas, no emite juicio sobre materialidad.

---

## 18. Limitaciones conocidas e implementation mismatches

### 18.1 Genuinamente abiertas (`TRUE OPEN`)

**Representación general de perímetro de consolidación / NCI / asociadas** más allá del marco de preguntas de la Sección 12: la evidencia de casos previos del Expediente muestra que el problema está bien identificado, pero sigue siendo insuficiente para diseñar una representación general y reutilizable entre casos. Permanece abierta hasta que exista evidencia de múltiples casos reales que revele qué estructura sería genuinamente general.

**Umbral cuantitativo de materialidad:** el principio cualitativo (Sección 2) está cerrado; el número concreto no tiene respuesta única en la literatura consultada y se calibra en cada caso.

### 18.2 Fuera de alcance (`NOT BUILDING / OUT OF SCOPE`)

**Estructura de datos reutilizable** para el puente EV→Equity, NCI y leases entre múltiples casos futuros: no es una pregunta sin evidencia suficiente, es una pregunta que Velarix no necesita responder con un solo caso activo. Se reabriría legítimamente si existieran múltiples casos reales con el mismo patrón.

### 18.3 Implementation mismatches — mapa de entrada para auditoría del motor

Cada fila registra únicamente **metodología definida / comportamiento actual / gap**, sin asumir que la corrección requiere necesariamente código nuevo. Clasificación: **REQUIRED FOR ALPINA** (el caso no puede ejecutarse con integridad metodológica sin esto, en código o como input/override documentado); **CONDITIONAL FOR ALPINA** (aplica solo si la evidencia del caso revela una condición específica); **NOT BUILDING** (no se requiere, ni para Alpina ni en general, por ahora).

| # | Ítem | Metodología (sección) | Comportamiento actual del motor | Gap | Clasificación |
|---|---|---|---|---|---|
| 1 | Normalización de signo (`Math.abs()`) | §3.2 | Aplica `Math.abs()` universal sobre campos como `equity` | Contradice preservación de signo y provenance | **REQUIRED FOR ALPINA** |
| 2 | WACC — moneda/ERP/CRP/estructura de capital | §10 | No implementa Fisher, no separa ERP maduro/CRP con lambda, no aplica las cuatro alternativas de estructura de capital | WACC no alineado con la metodología de moneda, riesgo país y estructura de capital | **REQUIRED FOR ALPINA** — debe existir una forma metodológicamente correcta y trazable de entregar al cálculo los componentes o el WACC resultante; la auditoría del motor determinará si la infraestructura actual ya lo soporta o si requiere una modificación mínima |
| 3 | Tasa impositiva única | §6 | Una sola tasa para horizonte explícito y valor terminal | No distingue marginal/efectiva/cash ni convergencia condicional | **REQUIRED FOR ALPINA** la tasa correcta; **NOT BUILDING** la separación estructural en código |
| 4 | Capital de trabajo como % fijo de ingresos | §7 | ΔWC = ingresos × % fijo, ignora saldos reales de AR/inventario/AP ya capturados en otras estructuras | No deriva ΔWC de la definición de Non-cash Operating Working Capital | **CONDITIONAL FOR ALPINA** — solo si el ΔWC real difiere materialmente del placeholder |
| 5 | CAPEX/reinversión sin control $g/ROC$ terminal | §8, §11 | No verifica $\text{Reinvestment Rate} = g/ROC$ en el año terminal | Puede aceptar una combinación internamente inconsistente | **REQUIRED FOR ALPINA** la verificación (ejecutable fuera del motor) |
| 6 | Horizonte de 5 años hardcoded | §9 | Bucle fijo a 5 años, sin relación con convergencia a estado estable | No garantiza que el año terminal represente estado estable | **CONDITIONAL FOR ALPINA** — solo si la evidencia muestra que Alpina no converge en 5 años |
| 7 | $g$ de escenarios (2%/4%) sin trazabilidad | §11 | Valores hardcoded sin relación documentada con el $g$ base | Contradice el requisito de derivación explícita del $g$ base | **REQUIRED FOR ALPINA** si se muestran escenarios (corregible sin reescribir el motor) |
| 8 | Fallback 70/30 de estructura de capital | §10.1 | Valor por defecto silencioso ante `equity` observado en cero | No refleja ninguna de las cuatro alternativas legítimas | **CONDITIONAL FOR ALPINA** — solo si Alpina dispara el caso `equity = 0` |
| 9 | Sensibilidades limitadas a WACC/$g$ | §15 | Solo existe la matriz 5×5 de WACC/$g$ | Faltan las cinco pruebas adicionales exigidas | **REQUIRED FOR ALPINA** el resultado (resoluble con cálculo ad hoc fuera del motor) |
| 10 | Ausencia de `valuation_date` explícito | §2, §14 | No distingue fecha de valoración de período base | Impide modelar consistentemente timing y stub periods | **REQUIRED FOR ALPINA** como dato documentado del caso; **NOT BUILDING** como campo nuevo de esquema |
| 11 | Ausencia de lógica de stub period | §14 | No existe mecanismo para un primer tramo parcial | Si la fecha de valoración no coincide con el cierre del período base, el primer año se trataría incorrectamente como completo | **CONDITIONAL FOR ALPINA** — solo si la fecha de valoración no coincide con el cierre de los estados base |
| 12 | Year-end implícito / mid-year pendiente | §14 | El descuento asume flujos de fin de año | Mid-year (default metodológico) requeriría cambiar el exponente de descuento | **CONDITIONAL FOR ALPINA** — requerido solo si year-end se descarta explícitamente; si se documenta como elección consciente, no aplica |
| 13 | Puente EV→Equity simple | §12 | `netDebt = deuda total − caja`, sin leases, NCI, caja restringida ni asociadas | No implementa la verificación de consistencia de leases ni la valoración separada de asociadas materiales | **CONDITIONAL FOR ALPINA** — solo si Alpina presenta partidas materiales de este tipo; si no, **NOT BUILDING** |

En todos los casos marcados **REQUIRED** o **CONDITIONAL**: la metodología está definida en este documento; su implementación en código está pendiente y no debe presentarse como ya operativa dentro del motor de cálculo actual.

---

## 19. Lista de decisiones case-specific — Expediente de Alpina

Principio general ya cerrado; valor concreto pendiente de evidencia del caso. Esta sección no resuelve ninguna — responde: **¿qué necesito saber antes de calcular?**

| ID | Decisión pendiente | Gobernada por | Evidencia necesaria |
|---|---|---|---|
| C-01 | Régimen tributario y NOLs de Alpina | §6 | Declaraciones de renta recientes; régimen especial si aplica; saldo de pérdidas compensables y plazo legal |
| C-02 | Estructura de capital objetivo/comparables | §10.1 | Comparables públicos del sector, estructura y beta observables; estructura contable actual como verificación de sanidad |
| C-03 | Costo de deuda real | §10.5 | Tasas de créditos/bonos vigentes, o spread implícito por calificación y tamaño |
| C-04 | $g$ terminal específico | §11 | Crecimiento de largo plazo del sector/geografía, verificado contra $WACC>g$ y $g/ROC$ |
| C-05 | Ajustes de normalización de EBITDA | §5 | Estados auditados y notas; soporte adicional si la materialidad lo amerita |
| C-06 | Clasificación de cuentas de working capital | §7 | Detalle de AR/inventario/AP/pasivos acumulados; supplier finance si existe |
| C-07 | Plan de CAPEX (mantenimiento vs. crecimiento) | §8 | Plan de inversión; histórico CAPEX vs. D&A; proyectos de expansión específicos |
| C-08 | Partidas del puente EV→Equity | §12 | Deuda financiera real; tratamiento NIIF 16 si aplica; caja restringida; asociadas/NCI si existen |
| C-09 | Aplicabilidad de DLOM/size premium | §13 | Naturaleza del interés valorado; mecanismos de liquidez o su ausencia; tamaño relativo frente a comparables |
| C-10 | Fecha de valoración y stub period | §14 | Fecha acordada; fecha de cierre de los estados base; si coinciden |
| C-11 | Exposición al riesgo país (lambda) | §10.4 | Desagregación geográfica de ingresos frente al promedio de mercado (método preferido, `observed_revenue_exposure`); en su ausencia, documentación explícita de la insuficiencia de Evidence y del Judgment directo aplicado en su lugar (`direct_documented_judgment`) |
| C-12 | Drivers de forecast (crecimiento, márgenes) | §9 | Plan de negocio interno; histórico; evidencia de sostenibilidad del margen |

**Adicionalmente pendiente:** la basis of value concreta bajo la cual se valora Alpina (Market Value, Investment Value/Worth, u otra) — Sección 2 — debe fijarse explícitamente antes de calcular; no se asume por defecto.

---

## 20. Referencias

**Nota sobre numeración IVS.** La edición vigente de los *International Valuation Standards*, efectiva desde el 31 de enero de 2025, organiza los General Standards como: IVS 100 (*Valuation Framework*), IVS 101 (*Scope of Work*), IVS 102 (*Bases of Value*), IVS 103 (*Valuation Approaches*), IVS 104 (*Data & Inputs*), IVS 105 (*Valuation Models*), IVS 106 (*Documentation & Reporting*), e IVS 200 (*Businesses and Business Interests*). Este documento cita exclusivamente contra esta numeración vigente. Donde la práctica de valoración histórica formuló un principio bajo una numeración de una edición anterior (por ejemplo, un IVS 105 titulado *Valuation Approaches and Methods* en una edición previa a 2025), ese texto se trata como **referencia histórica de formulación**, no como norma vigente citable — el principio subyacente, cuando sigue siendo defendible, se ancla aquí en la numeración actual o en Damodaran/NYU Stern cuando IVSC no publica gratuitamente el mismo nivel de detalle operativo.

**Estándares y normativa (fuente metodológica):**

- IVSC — IVS 102 (*Bases of Value*), IVS 104 (*Data & Inputs*), IVS 105 (*Valuation Models*), IVS 106 (*Documentation & Reporting*), IVS 200 (*Businesses and Business Interests*) — edición vigente desde el 31 de enero de 2025.
- IFRS Foundation — IFRS 16 *Leases* (vigente desde ejercicios que comienzan el o después del 1 de enero de 2019); IAS 28 *Investments in Associates and Joint Ventures*.

**Metodología de valoración (fuente metodológica, independiente de la fecha de consulta):**

- Aswath Damodaran / NYU Stern — material de valoración docente (Investment Valuation / notas de DCF): estructura de capital para empresas privadas, tratamiento de tasas impositivas efectivas, relación de paridad de tasas (Fisher), exposición a riesgo país (lambda), definición de Non-cash Working Capital, fórmula de crecimiento estable y reinversión, principios de "stable growth firm".
- Práctica profesional de valoración/M&A — categorías estándar de normalización de EBITDA; consenso de la disciplina, sin una norma numerada única que las codifique.

**Datos de mercado y normativos fechados (verificar vigencia antes de cualquier uso):**

- DIAN (Colombia) — Art. 240 del Estatuto Tributario, modificado por el Art. 10 de la Ley 2277 de 2022. Consultado en `dian.gov.co`, 2026-08-31.
- Banco de la República (Colombia) — tasa de política monetaria y meta de inflación. Consultado en `banrep.gov.co`, 2026-08-31.
- Aswath Damodaran / NYU Stern — páginas de datos de mercado actualizadas periódicamente (risk-free rate, country default spreads y risk premiums, ERP implícito de mercado maduro): fuente recomendada para obtener los market inputs vigentes al momento del cálculo del caso; los valores concretos no se citan en este documento (Sección 10.4).

**Genealogía interna de Velarix (contexto histórico, no autoridad metodológica independiente):**

- `01-scope-surgery.md` — límites técnicos del motor de cálculo actual, referenciado únicamente para verificar el estado real del código frente a esta metodología (Sección 18.3).
- `02-methodology-reconciliation.md` — diagnóstico de brechas, aceptado como diagnóstico, no como conjunto de decisiones.
- `03-methodology-decisions-v5.md` v1.1 — fuente canónica de todas las decisiones metodológicas de este documento; prevalece sobre cualquier discrepancia con la genealogía histórica de Velarix.
