# Reporte de contraste — Caso 05 (ISA) vs. `EXPEDIENTE-DE-VALORACION-V1.md`

**Fecha:** 2026-08-12
**Insumo:** `docs/velarix/casos/05-isa/CASO-05-ISA-V0.md`
**Insumos previos:** `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`
y su reporte de contraste; `docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md`
y su reporte de contraste; `docs/velarix/casos/03-ecopetrol/CASO-03-ECOPETROL-V0.md`
y su reporte de contraste; `docs/velarix/casos/04-grupo-exito/CASO-04-GRUPO-EXITO-V0.md`
y su reporte de contraste (mismas carpetas que cada caso).
**Objetivo:** determinar, con el Caso 05 como quinto punto de dato
independiente, qué de lo observado o reforzado por Tecnoglass, Terpel,
Ecopetrol y Grupo Éxito **sobrevive de forma transversal a los cinco
casos**, qué se profundiza o cambia de forma, qué candidato sube, se
mantiene, o recibe evidencia insuficiente, y qué necesidad **nueva**
aparece que el Expediente V1 (ya actualizado por los Casos 01–04) no
representaba todavía.

**CASO 05 NO AUTORIZA IMPLEMENTACIÓN.** Este reporte de contraste, igual
que el caso que resume, es exclusivamente documental. Ningún cambio
descrito aquí autoriza crear tablas, migraciones, schemas, UI, motores,
Edge Functions, automatizaciones ni ningún otro cambio técnico. Solo
Nicolás/fundador puede autorizar implementación, de forma explícita y
separada. **CASO 05 — ISA: FORMALMENTE CERRADO Y CONGELADO.** Este
reporte queda formalmente cerrado junto con el caso, tras revisión
humana. El cierre es exclusivamente del caso de estudio y de este
contraste — **no cierra R1–R8, no cierra la metodología, no cierra los
Bloques 1B ni 1C, no congela el Expediente
como arquitectura, y no cierra ninguno de los Candidatos A–E ni eleva la
observación ISA-F a Candidato F**, que permanecen abiertos.

**Regla rectora de este reporte**: cinco casos muestran patrones más
resistentes; cinco casos no crean leyes universales. Un caso puede
reforzar, debilitar, refutar, resultar no material, producir evidencia
insuficiente, o revelar problemas nuevos — este reporte registra los
cinco resultados posibles con la misma disciplina, sin inflar
evidencia insuficiente hasta convertirla en confirmación.

**Clasificaciones usadas:** `PATRÓN OBSERVADO EN CINCO CASOS` (evidencia
transversal e independiente en los cinco casos), `SOBREVIVE —
(SE PROFUNDIZA / INCOMPLETO)` (la regla reaparece, con distinto grado de
diseño pendiente), `PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES
ECONOMÍAS; EVIDENCIA SUFICIENTE PARA EXIGIR TRATAMIENTO METODOLÓGICO,
TODAVÍA INSUFICIENTE PARA DISEÑAR UNA REPRESENTACIÓN GENERAL`
(comparabilidad/perímetro), `NECESIDAD CONCEPTUAL FUERTEMENTE
RESPALDADA POR MÚLTIPLES CASOS` (`scope`), `NECESIDAD CONCEPTUAL
FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS, AÚN MENOS MADURA QUE SCOPE`
(`purpose`, elevado en este caso), `EVIDENCIA FUERTE EN [CASO] —
VALIDAR EN CASOS FUTUROS` (candidatos de un solo caso, sin elevar),
`PATRÓN OBSERVADO EN TRES CASOS DE NATURALEZA ECONÓMICA MUY DISTINTA —
FORMULACIÓN GENERAL AÚN ABIERTA` (Candidato B), `PATRÓN OBSERVADO EN DOS
CASOS DE NATURALEZA ECONÓMICA DISTINTA — FORMULACIÓN GENERAL AÚN
ABIERTA` (Candidato E), `EVIDENCIA INSUFICIENTE` (donde ISA no aportó
evidencia suficiente para elevar o confirmar algo).

---

## 1. Matriz de contraste formal R1–R8

Ver detalle completo con evidencia en `CASO-05-ISA-V0.md` §22. Resumen:

| Regla | Resultado Caso 05 | Estado transversal | Nota |
|---|---|---|---|
| R1 — Contabilidad ≠ economía | `PATRÓN OBSERVADO EN CINCO CASOS` | `PATRÓN OBSERVADO EN CINCO CASOS` | Activos físicamente similares representados como PPE/intangible/activo contractual/activo financiero según naturaleza económica/contractual |
| R2 — Observado ≠ normalizado ≠ proyectado | `PATRÓN OBSERVADO EN CINCO CASOS` | `PATRÓN OBSERVADO EN CINCO CASOS` | Ingresos de construcción y activos contractuales: cifra correcta que no debe proyectarse mecánicamente |
| R3 — Los supuestos están relacionados | núcleo `PATRÓN OBSERVADO EN CINCO CASOS`; diseño `INSUFICIENTEMENTE VALIDADO` | `PATRÓN OBSERVADO EN CINCO CASOS` + `DISEÑO INSUFICIENTEMENTE VALIDADO` | Relaciones temporales, condicionales, regulatorias, reestimables; cautela contra grafo causal ingenuo A → B; no se rediseña `assumption_relations` |
| R4 — Descomposición según dimensión económica relevante | `PATRÓN OBSERVADO EN CINCO CASOS` (formulación base) | `PATRÓN OBSERVADO EN CINCO CASOS` | Nueva cautela: la descomposición debería detenerse cuando granularidad adicional deja de modificar materialmente la interpretación económica necesaria para el propósito del análisis |
| R5 — Estado de conocimiento explícito | `SOBREVIVE — SE PROFUNDIZA` | — | Ejemplos claros vía deuda en distintos niveles, leases, activos contractuales, efectivo restringido, estructuras societarias; no se crea enum nuevo |
| R6 — Método de determinación (scope/purpose) | `SOBREVIVE — INCOMPLETO` | — | `scope` se mantiene en su nivel del Caso 03; `purpose` sube a `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS, AÚN MENOS MADURA QUE SCOPE`; no se fusionan |
| R7 — Drivers específicos por empresa | `PATRÓN OBSERVADO EN CINCO CASOS` | `PATRÓN OBSERVADO EN CINCO CASOS` | RAP, inflación, entrada en operación, tráfico, tarifas, garantías, concesión, capacidad, utilización, contratos — sin biblioteca universal cerrada |
| R8 — Detectar incoherencias sin decidir | `PATRÓN OBSERVADO EN CINCO CASOS` | `PATRÓN OBSERVADO EN CINCO CASOS` | Nuevo matiz: detectar una aparente contradicción ≠ demostrar que existe una contradicción (requiere comprender scope/purpose antes) |

## 2. Comparabilidad / perímetro — cambio de estado

**Antes de este caso** (Caso 04, `CASO-04-GRUPO-EXITO-V0.md` §21):

`PROBLEMA DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA TODAVÍA
INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN GENERAL.`

**Después de ISA**:

`PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA
SUFICIENTE PARA EXIGIR TRATAMIENTO METODOLÓGICO, TODAVÍA INSUFICIENTE
PARA DISEÑAR UNA REPRESENTACIÓN GENERAL.`

**Razón**: ISA concentra, dentro de una sola entidad, consolidación sin
100% económico, NCI material, negocios conjuntos/asociadas fuera de
consolidación línea por línea, y diferencias entre control y porcentaje
económico (`CASO-05-ISA-V0.md` §14) — evidencia más concentrada y
multifacética que la aportada por separado en Ecopetrol y Grupo Éxito.
**Cautela obligatoria, sin cambio**: problema de perímetro demostrado ≠
obligación de modelar entidad por entidad. **No se crea `case_perimeter`
ni ninguna tabla o schema.**

## 3. Candidatos A–E y observación ISA-F

| Candidato | Estado antes de ISA | Resultado ISA | Estado después de ISA |
|---|---|---|---|
| A — Neteo | `EVIDENCIA FUERTE EN ECOPETROL — VALIDAR EN CASOS FUTUROS` | `EVIDENCIA INSUFICIENTE` | **Sin cambio** — se mantiene `EVIDENCIA FUERTE EN ECOPETROL — VALIDAR EN CASOS FUTUROS` |
| B — Ciclo de vida económico | `PATRÓN OBSERVADO EN DOS CASOS DE NATURALEZA ECONÓMICA MUY DISTINTA` | Evidencia fuerte, tercer ciclo distinto (adjudicación→construcción→operación→O&M→refuerzos→vencimiento→reversión/indemnización/renovación) | **Sube** a `PATRÓN OBSERVADO EN TRES CASOS DE NATURALEZA ECONÓMICA MUY DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA` |
| C — Atribución temporal / corte de conocimiento | `PROBLEMA METODOLÓGICO RESPALDADO POR MÚLTIPLES CASOS` | Reforzado (construcción/reconocimiento/puesta en servicio/remuneración/recaudo/vencimiento en momentos distintos) | **Sin cambio de estado** — se mantiene `PROBLEMA METODOLÓGICO RESPALDADO POR MÚLTIPLES CASOS — REQUIERE DEFINIR PRINCIPIOS ANTES DE DISEÑAR REPRESENTACIÓN` |
| D — Derechos económicos / propiedad dinámica | `EVIDENCIA FUERTE EN GRUPO ÉXITO — VALIDAR EN CASOS FUTUROS` | Evidencia de control ≠ porcentaje económico, pero no de la parte dinámica/contractual específica | **Sin cambio** — se mantiene `EVIDENCIA FUERTE EN GRUPO ÉXITO — VALIDAR EN CASOS FUTUROS`; ISA registrada solo como evidencia del problema más amplio de atribución |
| E — Base de medición / régimen monetario | `EVIDENCIA FUERTE EN GRUPO ÉXITO — VALIDAR EN CASOS FUTUROS` | Evidencia independiente (moneda funcional/contractual, indexación, coberturas, nominal vs. costo amortizado) | **Sube** a `PATRÓN OBSERVADO EN DOS CASOS DE NATURALEZA ECONÓMICA DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA`, con cautela de posible heterogeneidad interna del candidato |
| ISA-F (observación, no candidato) — Disponibilidad/restricción de recursos | No existía antes de este caso | Evidencia fuerte vía efectivo restringido | **Nuevo**: `EVIDENCIA FUERTE EN ISA — VALIDAR ANTES DE ELEVAR A CANDIDATO TRANSVERSAL`. Explícitamente **no** es Candidato F formal |

Ninguno de los candidatos ni la observación ISA-F se numera como R9,
R10 o R11.

## 4. Supplier financing, leases, CAPEX — estado consolidado

| Tema | Estado antes de ISA | Resultado ISA | Estado después de ISA |
|---|---|---|---|
| Supplier financing | `PROBLEMA FUERTEMENTE REFORZADO — CRITERIOS DE RECLASIFICACIÓN TODAVÍA ABIERTOS` | `EVIDENCIA INSUFICIENTE` | **Sin cambio** — ISA no se cuenta como cuarta instancia; la evidencia transversal sigue apoyada en Tecnoglass, Terpel y Grupo Éxito |
| Leases | `PROBLEMA DEMOSTRADO — TRATAMIENTO DE VALORACIÓN NO GENERALIZADO` | Reforzado (segunda instancia de doble rol arrendatario/arrendador) | **Sin cambio de estado** — se mantiene `PROBLEMA DEMOSTRADO — TRATAMIENTO DE VALORACIÓN NO GENERALIZADO` |
| CAPEX (guardrails) | Sin `% ingresos` universal; sin taxonomía binaria universal | Cautela nueva: clasificación contable del flujo de efectivo no determina por sí sola inversión económica | **Guardrails reforzados**, sin nueva taxonomía creada |

## 5. Horizonte / estado estable (Decisión 4) y estructura de capital (Decisión 2)

Ambas decisiones del Bloque 1B (`docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`)
**no cambian** — este reporte solo registra profundización conceptual:

- **Decisión 4 (horizonte explícito, 5 años fijos)**: ISA refuerza que
  vida física ≠ vida contractual ≠ horizonte explícito ≠ vida de la
  empresa ≠ perpetuidad, y deja abierta (sin resolver) la pregunta de
  qué significa "estado estable" para una compañía con activos finitos
  y capacidad de reinversión potencialmente continua. **No se aprueba
  horizonte. No se aprueba g. No se diseña terminal value nuevo.**
- **Decisión 2 (estructura de capital observada)**: ISA añade la
  cautela de que, antes de usar una estructura observada, puede
  importar determinar a qué `scope` pertenece — sin evidencia para
  concluir universalmente que cada proyecto necesita su propio WACC.
  **No se calcula WACC. No se modifica la Decisión 2.**

## 6. scope y purpose

- **`scope`**: `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR
  MÚLTIPLES CASOS` — **sin cambio de nivel**. ISA refuerza la necesidad
  (grupo consolidado, holding, filial, concesión, proyecto, activo,
  atribución al accionista) pero no aporta evidencia independiente que
  eleve el nivel ya alcanzado en el Caso 03. Se registra explícitamente
  la cautela: problema de `scope` ≠ obligación de modelar siempre todos
  los niveles.
- **`purpose`**: **sube de nivel** — de `NECESIDAD CONCEPTUAL RESPALDADA
  POR MÚLTIPLES CASOS, AÚN MENOS MADURA QUE SCOPE` (Caso 04) a
  `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS, AÚN
  MENOS MADURA QUE SCOPE` (Caso 05). Evidencia: WACC/tasas regulatorias,
  tasas usadas en mediciones contables, información segmentada de
  administración, y métricas contractuales, todas determinadas con un
  propósito distinto al de una valoración profesional de equity.
  **Importante**: necesidad conceptual de comprender `purpose` ≠
  necesidad de crear un campo `purpose`. **No se fusiona con `scope`. No
  se implementa.**

## 7. Qué cambia de estado y qué NO cambia — resumen exacto

### Cambia de estado

- Comparabilidad/perímetro: de "problema demostrado en múltiples
  economías" a "problema **fuertemente** demostrado en múltiples
  economías; evidencia suficiente para exigir tratamiento
  metodológico".
- `purpose`: sube un nivel de evidencia (de "respaldada" a "fuertemente
  respaldada"), sin alcanzar a `scope`.
- Candidato B (ciclo de vida económico): de dos a tres casos de
  naturaleza muy distinta.
- Candidato E (base de medición/régimen monetario): de un caso a dos
  casos de naturaleza distinta, con nueva cautela de heterogeneidad
  interna.
- R1, R2, R4 (base), R7, R8: de "cuatro casos" a "cinco casos"
  transversales.
- R3 (núcleo): de "cuatro casos" a "cinco casos" transversales, diseño
  sigue insuficientemente validado.

### NO cambia de estado

- `scope`: se mantiene en el nivel alcanzado en el Caso 03.
- Candidato A (neteo): se mantiene sin elevar — ISA no aportó evidencia.
- Candidato C (atribución temporal/corte de conocimiento): se mantiene
  reforzado sin cambio de etiqueta formal.
- Candidato D (derechos económicos/propiedad dinámica): se mantiene sin
  elevar — ISA solo aporta evidencia del problema más amplio de
  atribución, no de la parte dinámica/contractual específica.
- Supplier financing: se mantiene sin cambio — ISA no cuenta como cuarta
  instancia.
- Leases: se mantiene sin cambio de estado, aunque reforzado.
- Decisión 2 y Decisión 4 del Bloque 1B: no cambian; solo se
  profundizan conceptualmente.
- `assumption_relations`, `account_components`, `coherence_flags`:
  siguen sin implementarse, sin cambio de especificación.

### Nuevo en este caso, sin ser candidato formal

- Observación ISA-F (disponibilidad/restricción económica de recursos):
  registrada como evidencia de un solo caso, explícitamente **no**
  Candidato F — requiere ver si reaparece en un caso futuro.

## 8. Elementos que NO deben implementarse todavía

Sin cambios respecto a los Casos 01–04, reafirmado explícitamente por
ISA (`CASO-05-ISA-V0.md` §35, §37):

- `account_components`, `assumption_relations`, `coherence_flags` — se
  mantienen como concepto, ninguno se implementa.
- `scope`, `purpose` — necesidad conceptual fuertemente respaldada en
  ambos casos, sin tipo, enum ni estructura.
- `case_perimeter` — no se crea, pese al cambio de estado a "problema
  fuertemente demostrado".
- `contracts` como entidad universal — no se crea.
- `economic_period` — no se crea, pese al refuerzo del Candidato C.
- `economic_lifecycle` — no se crea, pese al refuerzo del Candidato B.
- `measurement_basis` ni enum monetario — no se crean, pese al refuerzo
  del Candidato E.
- `availability` — no se crea, pese a la observación ISA-F.
- Ningún grafo causal, motor de coherencia, motor automático de
  normalizaciones, "options engine", ni algoritmo automático de NCI/JV.
- Ninguna metodología de suma de partes (SOTP), múltiples DCF, múltiples
  WACC, múltiples g ni múltiples horizontes se declara obligatoria.
- No se calcula WACC. No se aprueba horizonte ni g. No se modifican las
  Decisiones 2 ni 4 del Bloque 1B.

## 9. Resumen de disposición final

- **Incorporado como refuerzo transversal, sin cambio de
  especificación**: R1, R2, R7, R8 (`PATRÓN OBSERVADO EN CINCO CASOS`);
  R4 en su formulación base (`PATRÓN OBSERVADO EN CINCO CASOS`); R3 en
  su núcleo conceptual también `PATRÓN OBSERVADO EN CINCO CASOS`, con
  diseño de `assumption_relations` insuficientemente validado.
- **Incorporado como necesidad conceptual reforzada, sin implementar**:
  `purpose` (sube de nivel); comparabilidad/perímetro (pasa a "problema
  fuertemente demostrado").
- **Mantenido sin cambio de nivel**: `scope`; Candidato A (neteo);
  Candidato C (atribución temporal); Candidato D (derechos
  económicos/propiedad dinámica); supplier financing; leases (estado,
  aunque reforzado).
- **Elevado con evidencia de un caso adicional**: Candidato B (ciclo de
  vida económico, ahora tres casos); Candidato E (base de medición,
  ahora dos casos).
- **Registrado como observación nueva, explícitamente no candidato
  formal**: ISA-F (disponibilidad/restricción de recursos).
- **Ninguna cifra de ISA** se incorporó como default, benchmark ni
  referencia metodológica de Velarix — el material de trabajo de este
  caso no incluyó cifras financieras específicas.
- **Ningún negocio ni driver específico de ISA** (transmisión,
  concesiones viales, TIC) se declaró requisito universal para otras
  empresas.
- **Ninguna de las ocho reglas R1–R8** se declara completa, cerrada ni
  definitiva por haber sobrevivido a cinco casos.

## 10. Conclusión de disposición del Expediente

Consistente con `CASO-05-ISA-V0.md` §36: **el Expediente V1 sobrevive
conceptualmente al Caso 05, pero todavía no está listo para congelarse
como arquitectura.** Ninguno de los candidatos (A–E) ni la observación
ISA-F se convierte en requisito de producto en este reporte. El
Expediente no se declara listo para implementación. Las Decisiones 2 y
4 del Bloque 1B no se cierran — solo se profundizan conceptualmente.

## 11. Qué sigue

1. Un eventual Caso 06 (empresa con una sexta economía distinta, no
   analizado en esta tarea) ayudaría a: evaluar si el patrón `PATRÓN
   OBSERVADO EN CINCO CASOS` (R1, R2, R3 en su núcleo, R4 base, R7, R8)
   se sostiene con un sexto punto de dato independiente; aportar una
   cuarta instancia al Candidato B y una tercera al Candidato E; aportar
   una segunda instancia independiente a los Candidatos A o D si aparece
   evidencia realmente equivalente, aportar evidencia adicional al
   Candidato C, y tensionar nuevamente B, E e ISA-F — sin presuponer
   resultado; y decidir si la observación ISA-F reaparece lo suficiente
   para registrarse como Candidato F formal.
2. Ninguno de los cambios de este reporte autoriza implementación — sigue
   pendiente autorización explícita y separada del fundador
   (`Negocio_Velarix_v4.2.md` §19, regla 19).
3. Este reporte y el Caso 05 quedan **formalmente cerrados y
   congelados**, tras esta revisión humana (ver encabezado). El cierre
   no afecta R1–R8, la metodología, los Bloques 1B/1C, el Expediente
   como arquitectura, los Candidatos A–E, ni la observación ISA-F, que
   permanecen abiertos.
4. Las preguntas metodológicas de `CASO-05-ISA-V0.md` §33 (scope,
   purpose, `assumption_relations`, supplier financing, leases,
   comparabilidad/perímetro, los cinco candidatos, la observación ISA-F,
   estado estable, y `scope` de la estructura de capital) quedan como
   agenda concreta para la próxima conversación con un revisor/experto
   financiero — no como ejercicio abstracto, sino con evidencia real de
   cinco casos independientes detrás.
