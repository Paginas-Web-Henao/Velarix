# Decisiones financieras pendientes — Bloque 1B-M

Máximo 10 decisiones, agrupadas por causa común. Ninguna se decidió
silenciosamente en este bloque — cada una requiere aprobación explícita
del fundador o de un revisor financiero externo
(`Negocio_Velarix_v4.1.md` §9.4) antes de convertirse en metodología
oficial.

---

### 1. Fuente y vigencia de los supuestos de mercado (tasa libre de riesgo, ERP, beta sectorial, spread de deuda, prima país/tamaño)

- **Comportamiento actual**: 4 valores de mercado (`riskFreeRatePct=4.35`,
  `equityRiskPremiumPct=5.80`, beta por sector en `SECTOR_BENCHMARKS`,
  `costOfDebtPct=8`) son literales fijos sin fuente conectada ni fecha de
  refresco automatizada. No existe ningún tratamiento de prima por tamaño
  ni de riesgo país adicional al ERP genérico.
- **Alternativas reales**: (a) mantenerlos fijos y revisarlos
  manualmente cada trimestre; (b) conectarlos a una fuente real
  (Damodaran, Banco de la República) — automatización explícitamente
  diferida a Fase 7; (c) agregar una prima de riesgo país/tamaño
  explícita para PyMEs colombianas, distinta del ERP genérico de
  mercados emergentes.
- **Recomendación técnica**: mantener (a) como piso operativo, con
  revisión trimestral manual documentada en `_shared/financial-methodology.ts`
  (`effectiveDate`), y evaluar (c) con el revisor financiero antes de
  cualquier piloto real — las PyMEs suelen tener una prima de riesgo
  mayor que la implícita en betas de empresas públicas grandes.
- **Impacto en valoración**: alto — el WACC es el denominador de todo el
  DCF; un ERP/beta mal calibrado desplaza el Enterprise Value en la
  misma proporción que el error.
- **Riesgo de decidir mal**: sobreestimar valoraciones de PyMEs si no se
  agrega una prima de riesgo adicional, dañando la credibilidad de la
  boutique frente a clientes reales.
- **Quién debe aprobarla**: revisor financiero externo + fundador.

### 2. Estructura de capital: objetivo vs. observada, y si el servidor debe permitir sobrescribirla desde `structured_input`

- **Comportamiento actual**: el servidor deriva `equityWeight`/`debtWeight`
  de los saldos reales (`equity/(equity+totalDebt)`); el cliente los
  trata como campos de entrada independientes, editables por el usuario,
  que pueden no coincidir con `totalDebt`/`equity` que también declaró.
  Ninguno de los dos motores permite que el servidor use una estructura
  "objetivo" (target) distinta de la observada.
- **Alternativas reales**: (a) el servidor siempre deriva de saldos
  reales (comportamiento actual); (b) permitir una estructura de capital
  "objetivo" declarada explícitamente, común en valoraciones CFA cuando
  la estructura actual no es representativa de la de largo plazo; (c)
  exponer ambas y dejar que el analista elija por caso.
- **Recomendación técnica**: (a) es más defendible por defecto (menos
  supuestos discrecionales), pero (b) debería estar disponible como
  override explícito y auditado para el analista, no para el cliente.
- **Impacto en valoración**: alto — cambia `betaLevered`, WACC, y por
  tanto el Enterprise Value completo.
- **Riesgo de decidir mal**: usar una estructura de capital no
  representativa de la realidad o de la intención de largo plazo de la
  empresa, sesgando la valoración sin que quede explícito en el informe.
- **Quién debe aprobarla**: revisor financiero externo.

### 3. Tasa de crecimiento perpetuo (g terminal)

- **Comportamiento actual**: `terminalGrowthPct=3` fijo para todos los
  sectores y empresas en el servidor; el cliente lo trata como input
  ajustable con el mismo valor por defecto.
- **Alternativas reales**: (a) mantener un g único para todos (actual);
  (b) atarlo a la inflación de largo plazo/PIB potencial de Colombia
  (DANE/Banco de la República); (c) diferenciarlo por sector.
- **Recomendación técnica**: (b) es la práctica CFA estándar (g ≤
  crecimiento nominal de la economía) — un g fijo de 3% puede ser
  demasiado alto o bajo dependiendo del ciclo macro vigente.
- **Impacto en valoración**: alto — el valor terminal típicamente domina
  el Enterprise Value en un DCF a 5 años.
- **Riesgo de decidir mal**: sobrevalorar sistemáticamente si g queda por
  encima del crecimiento potencial de largo plazo de la economía.
- **Quién debe aprobarla**: revisor financiero externo.

### 4. Horizonte explícito del DCF (por qué 5 años, y si debe variar por caso)

- **Comportamiento actual**: ambos motores proyectan exactamente 5 años,
  sin posibilidad de ajustar el horizonte por tipo de empresa o madurez
  del negocio.
- **Alternativas reales**: (a) mantener 5 años fijos (simplicidad,
  consistencia entre informes); (b) permitir 3-10 años según la madurez
  / previsibilidad del negocio (p. ej. una empresa de alto crecimiento
  puede necesitar un horizonte más largo para llegar a un estado
  estable antes del valor terminal).
- **Recomendación técnica**: mantener (a) hasta tener casos reales que
  demuestren la necesidad de (b) — cambiar el horizonte es un cambio de
  arquitectura (arrays de tamaño fijo en ambos motores), no un ajuste
  trivial.
- **Impacto en valoración**: medio-alto, especialmente para el Caso B
  (alto crecimiento) de este bloque — pero de forma distinta en cada
  motor: en la **referencia del motor cliente** (`runAnalysis`, con
  reinversión intensa CAPEX 15%/capital de trabajo 8%), 5 años no
  alcanzan a estabilizar el FCFF antes del valor terminal y el Enterprise
  Value resulta negativo (−COP 12.335.061.263). El **motor servidor
  canónico** (`runCanonicalFinancialEngine`) produce un Enterprise Value
  **positivo** (COP 9.615.506.880) para el mismo Caso B, precisamente
  porque usa capex/wc% fijos más bajos (5%/3%) y no puede reflejar esa
  reinversión intensa — ver decisión #9. El riesgo del horizonte fijo de
  5 años es real para el perfil de empresa que el cliente modeló, no
  necesariamente para el servidor con sus supuestos actuales (ver
  `docs/velarix/bloque-1c/CASOS-DORADOS-PROVISIONALES.md`).
- **Riesgo de decidir mal**: para empresas de alto crecimiento con
  reinversión intensa, un horizonte corto puede producir un Enterprise
  Value negativo o artificialmente bajo, como se observó en la
  referencia del motor **cliente** para el Caso B — no en el resultado
  del motor servidor canónico para ese mismo caso, que fue positivo.
- **Quién debe aprobarla**: revisor financiero externo + fundador (impacto de producto/arquitectura).

### 5. Normalización de EBITDA e impuestos/utilidad neta históricos declarados pero ignorados

- **Comportamiento actual**: ambos motores leen (o, en el caso del
  cliente, ni siquiera modelan) `taxes`/`net_income` históricos del
  `structured_input`, pero siempre recalculan impuestos con la tasa fija
  de `financial-methodology.ts` — nunca usan el valor histórico real
  declarado por el usuario. Tampoco existe ningún ajuste por partidas
  no recurrentes (normalización de EBITDA).
- **Alternativas reales**: (a) seguir ignorando el histórico y recalcular
  siempre con tasa fija (actual); (b) usar el impuesto/utilidad neta real
  cuando esté disponible, con la tasa fija solo como fallback; (c)
  agregar un paso explícito de normalización de EBITDA (ajustes
  discrecionales documentados) antes de proyectar.
- **Recomendación técnica**: (b) es más preciso cuando el dato histórico
  es confiable; (c) requiere criterio humano caso por caso y no debería
  automatizarse sin revisión.
- **Impacto en valoración**: medio — afecta principalmente los KPIs
  históricos (netMargin, ROE), no directamente las proyecciones futuras.
- **Riesgo de decidir mal**: descartar información real disponible sin
  justificación, o automatizar ajustes de normalización que deberían
  requerir criterio humano.
- **Quién debe aprobarla**: revisor financiero externo.

### 6. Tratamiento de empresas con patrimonio negativo y `total_assets` sintético

- **Comportamiento actual**: los dos motores tratan el patrimonio
  negativo de forma **distinta entre sí**, no solo de forma imperfecta
  (hallazgo del cierre técnico, 2026-07-23): el motor **cliente** usa el
  valor de patrimonio con signo real, así que su clamp de ROE
  (`equity > 0 ? ... : 0`) detecta correctamente el patrimonio negativo
  y reporta `roe=0.0%` (Caso C). El motor **servidor** aplica
  `Math.abs()` al patrimonio **antes** de cualquier cálculo — el mismo
  patrimonio negativo se convierte en un número positivo, y el clamp de
  ROE nunca se activa: el servidor reporta `roe=-77%` para el mismo Caso
  C. `total_assets` sigue siendo sintético (`totalDebt + equity`, con o
  sin `Math.abs()` según el motor) en vez de leer el campo real ya
  disponible en `structured_inputs.balance_sheet.total_assets` — en
  ambos motores.
- **Alternativas reales**: (a) mantener el clamp de ROE en 0 (como hace
  hoy el cliente, evita un ROE positivo o negativo engañoso); (b) mostrar
  un ROE calculado igual pero con una advertencia explícita de
  "patrimonio negativo — interpretar con cautela"; (c) usar
  `total_assets` real cuando exista en vez del sintético; (d) unificar
  ambos motores para que ninguno aplique `Math.abs()` al patrimonio
  antes de los clamps de KPI, independientemente de cuál de (a)/(b) se
  elija.
- **Recomendación técnica**: (d) es la corrección mínima urgente — hoy
  el servidor y el cliente pueden reportar un ROE de signo y magnitud
  completamente distintos para el mismo caso, lo cual es peor que
  cualquiera de las dos alternativas individualmente. Sobre esa base,
  (b) es más informativo que (a) para un analista humano; (c) es más
  preciso pero cambia ROA retroactivamente para todo análisis con
  `total_assets` real declarado.
- **Impacto en valoración**: medio-alto para empresas en dificultades —
  exactamente el segmento donde una lectura equivocada de KPIs es más
  peligrosa, agravado por la inconsistencia entre motores.
- **Riesgo de decidir mal**: ocultar una situación patrimonial crítica
  detrás de un KPI en 0 sin ninguna advertencia visible, o — peor —
  que el resultado mostrado al cliente dependa de cuál motor lo calculó.
- **Quién debe aprobarla**: revisor financiero externo.

### 7. Uso de utilidad neta vs. NOPAT, y metodología definitiva de ROE/ROA

- **Comportamiento actual**: ROE y ROA usan `netIncome0` (utilidad neta
  histórica recalculada con tasa fija); el FCFF usa NOPAT. Ninguna regla
  documentada decide cuándo usar cada una, ni si ROE/ROA deberían
  calcularse sobre patrimonio/activos promedio o final.
- **Alternativas reales**: (a) mantener el uso actual (utilidad neta para
  ROE/ROA, NOPAT solo para FCFF — estándar CFA razonable); (b)
  estandarizar todo sobre NOPAT para consistencia interna; (c) usar
  saldos promedio en vez de finales para ROE/ROA.
- **Recomendación técnica**: (a) es metodológicamente defendible y ya es
  el estándar de facto — se recomienda formalizarlo por escrito, no
  cambiarlo.
- **Impacto en valoración**: bajo-medio — no afecta el Enterprise Value
  (que depende de FCFF/NOPAT), solo los KPIs de rentabilidad reportados.
- **Riesgo de decidir mal**: inconsistencia percibida por un revisor
  financiero si no queda documentado por qué se usan medidas distintas
  en distintos KPIs.
- **Quién debe aprobarla**: revisor financiero externo (formalización, no necesariamente cambio).

### 8. Límites de los escenarios optimista y pesimista

- **Comportamiento actual**: pesimista = 0.6x growth, -3pp margen, +1.5pp
  WACC; optimista = 1.4x growth, +3pp margen, -1.5pp WACC. El servidor
  **no** varía `capexPct`/`wcPct` por escenario; el cliente sí
  (pesimista +2pp/+1pp, optimista -1pp/-1pp con piso de 1%). **Nota de
  cierre técnico (2026-07-23)**: en una revisión anterior de este mismo
  bloque se había hecho que el servidor también variara `capexPct`/`wcPct`
  copiando el criterio del cliente — esa corrección se **revirtió**
  porque era una decisión metodológica aplicada sin la aprobación que
  esta misma fila exige. La divergencia entre motores sigue existiendo,
  sin resolver. Ninguno de los multiplicadores está documentado como
  derivado de un análisis estadístico — parecen valores redondos
  elegidos por conveniencia.
- **Alternativas reales**: (a) mantener la divergencia actual entre
  motores tal como está (servidor sin variar capex/wc, cliente sí) hasta
  tener una decisión aprobada; (b) unificar ambos motores para que
  varíen capex/wc de la misma forma, una vez aprobados los
  multiplicadores; (c) calibrarlos con volatilidad histórica real del
  sector/la empresa cuando exista suficiente histórico; (d) hacerlos
  configurables por el analista caso a caso.
- **Recomendación técnica**: (a) para el corto plazo — no hay datos
  históricos suficientes hoy para calibrar (c) de forma confiable, y (b)
  requiere primero que el fundador/revisor aprueben multiplicadores
  concretos.
- **Impacto en valoración**: medio — define el ancho del rango
  pesimista/optimista mostrado al cliente, no el caso base.
- **Riesgo de decidir mal**: un rango de escenarios que parezca
  arbitrario reduce la credibilidad profesional del informe.
- **Quién debe aprobarla**: revisor financiero externo (formalización del criterio).

### 9. ¿Deben los 8 supuestos canónicos ser editables desde `structured_input`?

- **Comportamiento actual**: `_shared/financial-methodology.ts` centraliza
  los 8 valores (antes duplicados), pero **ninguno** es editable por
  input hoy (`editableByInput: false` en los 8) — el servidor los usa
  siempre fijos, mientras el formulario del cliente expone 7 de ellos
  como ajustables por el usuario final (ver `R-19`,
  `plan/MATRIZ-DE-RIESGOS.md`).
- **Alternativas reales**: (a) mantenerlos fijos en el servidor
  (consistencia entre todos los análisis, cero superficie de
  manipulación por el cliente); (b) permitir que un analista (no el
  cliente) los ajuste caso a caso vía `structured_input`; (c) dejar de
  exponerlos como ajustables en el formulario del cliente si el servidor
  nunca los va a usar.
- **Recomendación técnica**: (a) + (c) — es la opción más simple y más
  defendible para un servicio de valoración estandarizado; (b) solo si
  el negocio realmente necesita personalización caso a caso.
- **Impacto en valoración**: alto si el cliente cree que su ajuste tuvo
  efecto y en realidad no lo tuvo (riesgo de confianza, no solo
  metodológico).
- **Riesgo de decidir mal**: mantener un formulario que promete
  personalización que el motor canónico ignora, dañando la confianza del
  cliente cuando lo descubra.
- **Quién debe aprobarla**: fundador (decisión de producto) + revisor financiero (impacto metodológico).

### 10. Manejo de `revenue = 0` / datos insuficientes en el motor cliente

- **Comportamiento actual**: el servidor lanza un error explícito
  (`"Revenue es 0 — no se puede calcular valoración."`); el cliente no
  valida esto y produce márgenes históricos en `Infinity`/`NaN`
  (`grossMargin`, `ebitdaMargin`, `ebitMargin`, `netMargin`), mientras
  `enterpriseValue`/`wacc` quedan en un valor finito pero engañoso (0) —
  verificado con una prueba real en `financial-engine.golden-cases.test.ts`.
- **Alternativas reales**: (a) el cliente lanza el mismo error que el
  servidor; (b) el cliente devuelve un resultado con un campo de
  advertencia explícito en vez de lanzar; (c) el formulario del cliente
  impide enviar revenue=0 antes de llegar al motor.
- **Recomendación técnica**: (c) como primera línea de defensa (UX), más
  (a) como defensa en profundidad — no se implementó ninguna en este
  bloque porque cambiar el comportamiento de `runAnalysis` (que hoy no
  lanza) tiene efectos en los llamadores existentes (`Dashboard.tsx`,
  `DemoDashboard.tsx`) que no se auditaron a fondo en este bloque.
- **Impacto en valoración**: bajo en la práctica (un análisis con
  revenue=0 no es un caso de negocio real), pero alto en confiabilidad
  del sistema si ocurre.
- **Riesgo de decidir mal**: un error que no se lanza correctamente puede
  producir un PDF con "Enterprise Value: COP 0" sin ninguna advertencia
  visible al cliente.
- **Quién debe aprobarla**: fundador (decisión de producto/UX).
