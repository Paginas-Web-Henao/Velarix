# Índice y Síntesis Maestra — Consolidación Transversal de los Ocho Casos — V1

**Fecha:** 2026-08-14
**Estado:** Documento de consolidación. NO es una valoración. NO
autoriza implementación de ningún cambio técnico. NO selecciona método
de valoración. NO inicia el Bloque 1E. NO reabre ni modifica ninguno de
los ocho casos congelados. Esta consolidación se construye **sobre**
los ocho casos; no los reescribe retrospectivamente.
**Autorización**: tarea de documentación autorizada por Nicolás/fundador
exclusivamente para consolidar transversalmente los hallazgos
metodológicos de la primera batería de ocho casos de estudio de
Velarix.

---

## 1. Estado de la primera batería

La primera batería de ocho casos de estudio manual de Velarix está
**cerrada y congelada** según el estado actual del proyecto:

| # | Caso | Estado |
|---|---|---|
| 01 | Tecnoglass | Cerrado y congelado |
| 02 | Organización Terpel | Cerrado |
| 03 | Ecopetrol | Formalmente cerrado y congelado |
| 04 | Grupo Éxito | Formalmente cerrado y congelado |
| 05 | ISA | Formalmente cerrado y congelado |
| 06 | Grupo Cibest / Bancolombia S.A. | Formalmente cerrado y congelado |
| 07 | The Goldman Sachs Group, Inc. | Formalmente cerrado y congelado |
| 08 | Munich Re | Formalmente cerrado y congelado |

## 2. Documentos de cada caso

Cada caso tiene dos documentos fuente, ambos congelados y no
modificados por esta consolidación:

- `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md` y su `REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
- `docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md` y su `REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
- `docs/velarix/casos/03-ecopetrol/CASO-03-ECOPETROL-V0.md` y su `REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
- `docs/velarix/casos/04-grupo-exito/CASO-04-GRUPO-EXITO-V0.md` y su `REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
- `docs/velarix/casos/05-isa/CASO-05-ISA-V0.md` y su `REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
- `docs/velarix/casos/06-bancolombia/CASO-06-BANCOLOMBIA-V0.md` y su `REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
- `docs/velarix/casos/07-goldman-sachs/CASO-07-GOLDMAN-SACHS-V0.md` y su `REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
- `docs/velarix/casos/08-munich-re/CASO-08-MUNICH-RE-V0.md` y su `REPORTE-CONTRASTE-EXPEDIENTE-V1.md`

## 3. Qué significa y qué NO significa el cierre de los ocho casos

**Significa**: cada caso individual tiene investigación y contraste
suficientemente documentados; sus conclusiones y cautelas quedan
preservadas como fotografía metodológica de ese caso en su fecha; no se
reabre ni reanaliza salvo nueva evidencia concreta, contradicción
documental real, un fallo concreto, un requerimiento nuevo, o una
pregunta explícita del fundador.

**NO significa**: que R1–R8 sean leyes universales; que la metodología
esté cerrada; que los Bloques 1B ni 1C estén cerrados; que el
Expediente esté congelado como arquitectura; que los Candidatos A–G o
las observaciones abiertas estén resueltos; que exista autorización de
implementación; que se haya seleccionado un método de valoración; que
WACC, Cost of Equity, g o el horizonte hayan sido aprobados o
modificados; ni que un caso posterior autorice reinterpretar
retrospectivamente un caso anterior más allá de lo que ese caso
posterior documentó explícitamente.

## 4. Principio epistemológico: patrones ≠ leyes universales

Frecuencia ≠ fuerza de evidencia. 8/8 no crea una ley universal; 1/8
puede revelar una excepción crítica. Cada fenómeno de esta consolidación
se evaluó por fuerza, independencia, diversidad económica,
materialidad, severidad si se ignora, posibilidad de tratamiento
humano, riesgo de sobreingeniería y generalizabilidad — no mediante un
score compuesto.

En consecuencia, este documento y los otros cuatro de esta carpeta usan
sistemáticamente la disciplina de lenguaje siguiente:

- Nunca: `"CONFIRMADO POR OCHO CASOS"`.
- Siempre que corresponda exactamente: `"PATRÓN OBSERVADO EN OCHO
  CASOS"`.
- Cada afirmación se etiqueta explícitamente como `HECHO DOCUMENTADO`,
  `DISTINCIÓN CONCEPTUAL`, `INFERENCIA ANALÍTICA`, `INFERENCIA
  METODOLÓGICA`, `PREGUNTA ABIERTA` o `EVIDENCIA INSUFICIENTE` en los
  documentos de detalle (`01`–`03`).

## 5. Inferencia maestra de la consolidación

**INFERENCIA METODOLÓGICA**:

> Velarix puede estandarizar fuertemente el proceso mediante el cual se
> entiende, cuestiona, documenta, valida y decide una valoración; la
> primera batería no aporta evidencia para estandarizar de la misma
> manera una arquitectura financiera única aplicable a todas las
> empresas.

Esto **no es R9**. Esto **no es ley universal**. Esto **no autoriza
implementación**.

Separación central de esta consolidación:

```
ARQUITECTURA TRANSVERSAL DEL PROCESO
        ≠
ARQUITECTURA FINANCIERA UNIVERSAL DEL MÉTODO
```

La segunda se registra como **abstracción descartada como
obligatoriedad universal** — no se eliminan FCFF, WACC, EV, NWC, CAPEX,
net debt, etc.; se descarta únicamente que cualquiera de ellos sea
obligatorio para toda empresa. Esta distinción se documenta en detalle
como fenómeno `PROCESS-ARCH` en `01-REGISTRO-FENOMENOS-Y-MATRIZ-V1.md`.

## 6. Resumen de las tres capas de generalidad

**Capa A — Principios / preguntas transversales del proceso**: no son
respuestas financieras universales. Incluyen R1–R8 (en su núcleo),
`scope`, `purpose`, perímetro, unidad de análisis, atribución temporal,
disponibilidad de recursos, y la distinción arquitectura del proceso ≠
arquitectura financiera. Ver disciplinas y guardrails en
`01-REGISTRO-FENOMENOS-Y-MATRIZ-V1.md`.

**Capa B — Familia económica/regulatoria**: la única familia
suficientemente respaldada actualmente es **instituciones financieras
prudencialmente reguladas/capitalizadas** (evidencia: Bancolombia /
Grupo Cibest, Goldman Sachs, Munich Re). No se crean `bank_mode`,
`insurance_mode`, `financial_institution` enum, `industry_type`, ni
selector automático de metodología. No se crean otras familias B
todavía — en particular, **no** se crean "empresas no financieras",
"empresas reguladas" ni "multinegocio" como familias, porque la
evidencia no lo justifica.

**Capa C — Mecánica económica específica**: empresa / negocio /
contrato / instrumento / regulación / situación concreta, propia de
cada uno de los ocho casos, nunca generalizada como default para otro
caso.

## 7. Matriz ejecutiva de estados finales — R1 a R8

| Regla | Estado transversal final (tras C08) | Núcleo vs. representación |
|---|---|---|
| R1 — Contabilidad ≠ economía | PATRÓN OBSERVADO EN OCHO CASOS | Formalizar en metodología |
| R2 — Observado ≠ normalizado ≠ proyectado | PATRÓN OBSERVADO EN OCHO CASOS | Formalizar en metodología |
| R3 — Relaciones entre supuestos | PATRÓN OBSERVADO EN OCHO CASOS (núcleo) | Representación (`assumption_relations`) insuficientemente validada — más evidencia |
| R4 — Descomposición según dimensión económica | PATRÓN OBSERVADO EN OCHO CASOS (formulación base) | Extensión a cifras netas/movimientos — a validar |
| R5 — Estado de conocimiento explícito | SOBREVIVE Y SE PROFUNDIZA | Formalizar en metodología |
| R6 (histórico C01) / scope / purpose | scope y purpose: NECESIDAD CONCEPTUAL MUY FUERTEMENTE RESPALDADA | Llevar a diseño 1B/1C |
| R7 — Drivers específicos por empresa | PATRÓN OBSERVADO EN OCHO CASOS | Formalizar en metodología |
| R8 — Detectar sin decidir | PATRÓN OBSERVADO EN OCHO CASOS | Alerta / pregunta del sistema |

Ver el detalle completo de las ocho reglas, los siete candidatos (A–G),
las dos observaciones abiertas (compensación de Goldman, exposición/
retención/capital de Munich Re), y los 46 fenómenos registrados en
`01-REGISTRO-FENOMENOS-Y-MATRIZ-V1.md`.

## 8. Los siete frentes de diseño enviados al puente 1B/1C

Desarrollados en detalle, con problema demostrado, casos que soportan y
matizan, formulación exacta, generalidad, riesgos y mínimo diseño a
estudiar, en `04-BACKLOG-Y-PUENTE-1B-1C-V1.md` §4:

1. **SCOPE** — a qué objeto o parte de la organización aplica una
   afirmación, supuesto, evidencia o cálculo.
2. **PURPOSE** — para qué fue construida originalmente una cifra y para
   qué se usa ahora.
3. **PERÍMETRO / COMPARABILIDAD** — cómo NCI, JVs, consolidación y
   regímenes duales de reporte afectan comparabilidad y atribución.
4. **UNIDAD ECONÓMICA ADECUADA** — qué unidad económica es apropiada
   para el análisis y por qué.
5. **ATRIBUCIÓN TEMPORAL / CORTE DE CONOCIMIENTO** — qué fenómeno
   económico atribuimos al corte y con qué información disponible.
6. **DISPONIBILIDAD ECONÓMICA DE RECURSOS** — reconocimiento/propiedad/
   control ≠ disponibilidad económica automática.
7. **GOBIERNO Y TRAZABILIDAD DE SELECCIÓN DE MÉTODO** — cómo preservar
   trazabilidad completa desde el objeto valorado hasta el método
   aprobado y su aprobador.

Cada uno de los siete frentes tiene estado explícito:
**DISEÑO AUTORIZADO PARA ESTUDIO FUTURO — IMPLEMENTACIÓN NO
AUTORIZADA.**

## 9. Qué no llega a diseño todavía

Lista completa en `04-BACKLOG-Y-PUENTE-1B-1C-V1.md` §3. Incluye, entre
otros: rediseño general de `assumption_relations`, `case_perimeter`,
`economic_lifecycle`, `economic_period`, `measurement_basis`, enum de
régimen monetario, `availability` booleano, `restricted_asset`,
modelo de fungibilidad, `capital_bridge`, `distributable_capital`,
`regulatory_capital`, motores de netting/collateral/reinsurance/IFRS17/
CSM/risk-adjustment/reservas, `bank_mode`, `insurance_mode`,
`industry_type`, `valuation_method` automático, motores de Residual
Income/FCFE/Potential Distributions/SOTP, `cost_of_equity` field,
automatización de WACC, horizonte variable, y g automática/dinámica.

## 10. Estado de JPMorgan

**JPMorgan NO se inicia. No se crea Caso 09.** La consolidación
transversal de los ocho casos, tal como se ejecuta en este documento,
no identificó un vacío bloqueante que requiera un noveno caso. Munich
Re (Caso 08) ya dejó explícitamente registrado que JPMorgan "no se
convierte automáticamente en Caso 09" y queda "reservado únicamente si,
después de la consolidación transversal, aporta evidencia nueva que la
justifique" (`CASO-08-MUNICH-RE-V0.md` §1, §36).

Esta consolidación confirma esa reserva: **RESERVED / NOT_INITIATED.**
Solo debería reconsiderarse ante una pregunta concreta — por ejemplo, la
coexistencia material dentro de un mismo conglomerado de commercial
banking + payments + investment banking + markets + asset/wealth
management, una combinación que ni Bancolombia (banca comercial) ni
Goldman Sachs (banca de inversión/gestión de activos) ni Munich Re
(seguros/reaseguros) demostraron de forma unificada.

## 11. Próximo paso

Volver a los Bloques 1B/1C para el diseño metodológico/documental de los
siete frentes de la sección 8, con el respaldo de evidencia consolidada
de esta batería de ocho casos. Esta consolidación no ejecuta ese
diseño — lo deja preparado y trazable.

## 12. IMPLEMENTATION_STATUS

**IMPLEMENTATION_STATUS = NOT_AUTHORIZED** para los 46 fenómenos del
Phenomenon Registry, para los siete frentes del puente 1B/1C, y para
cualquier otro elemento mencionado en los cinco documentos de esta
carpeta, sin excepción.

## 13. Documentos de esta consolidación

- [`01-REGISTRO-FENOMENOS-Y-MATRIZ-V1.md`](./01-REGISTRO-FENOMENOS-Y-MATRIZ-V1.md) — Phenomenon Registry (46 fenómenos con ID estable) y matriz Case × Phenomenon.
- [`02-REGISTRO-EVIDENCIA-V1.md`](./02-REGISTRO-EVIDENCIA-V1.md) — Registro de evidencia material (Evidence IDs con formato E-01-001 hasta E-08-022) que sustenta el Phenomenon Registry.
- [`03-GENEALOGIAS-Y-GAPS-V1.md`](./03-GENEALOGIAS-Y-GAPS-V1.md) — Evolution ledger de los fenómenos más desarrollados y trece traceability gaps obligatorios.
- [`04-BACKLOG-Y-PUENTE-1B-1C-V1.md`](./04-BACKLOG-Y-PUENTE-1B-1C-V1.md) — Backlog metodológico con códigos M-A a M-J y los siete frentes de diseño autorizados para estudio futuro en 1B/1C.

## 14. Alcance y limitaciones de esta consolidación

- No se calculó ni aprobó Enterprise Value, Equity Value, precio por
  acción, WACC, Cost of Equity, g, ni horizonte para ninguna empresa.
- No se seleccionó método de valoración para ningún caso ni para
  ninguna familia de empresas.
- No se modificó ninguno de los 16 documentos congelados de los Casos
  01–08.
- No se modificó `EXPEDIENTE-DE-VALORACION-V1.md`, las Decisiones del
  Bloque 1B, ni `REGISTRO-DE-DECISIONES.md`.
- No se tocó código, schema, migraciones, Edge Functions, autenticación,
  JWT, ni infraestructura.
- No se inició el Bloque 1E.
- No se creó el Caso 09 / JPMorgan.
- Donde esta consolidación encontró una contradicción real entre la
  instrucción de ejecución y los documentos congelados, se registró
  explícitamente como traceability gap en `03-GENEALOGIAS-Y-GAPS-V1.md`
  en vez de resolverse silenciosamente — ninguna de esas contradicciones
  altera materialmente una conclusión consolidada autorizada por este
  documento.
