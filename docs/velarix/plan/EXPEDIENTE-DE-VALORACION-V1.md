# Expediente de Valoración V1 — especificación

**Fecha:** 2026-08-10
**Estado:** especificación únicamente. **No implementar sin autorización
explícita y separada** (`Negocio_Velarix_v4.2.md` §19, regla 19).
**Depende de:** `docs/velarix/plan/REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md`
(contexto y justificación de negocio — no se repite aquí).

Este documento especifica **qué** construir y **cómo** se relaciona con
lo que ya existe. No contiene código, no define esquemas SQL finales, y
no asume ninguna decisión de UI todavía no tomada.

> **Precisión 2026-08-10 (mismo día, tras corrección del fundador)**: la
> implementación de este documento **no** es condición para que Velarix
> avance. El **estudio manual de casos públicos** (Biblioteca A — ver
> `docs/velarix/plan/REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md` y
> `BL-35` en `BACKLOG-CLASIFICADO.md`) está **activo desde ahora**,
> **antes** de implementar nada de este documento, y sirve precisamente
> para validarlo y corregirlo con evidencia real. Ver §0 abajo.

## 0. Paso previo obligatorio: validar esta especificación con casos reales

`✅ Activo desde 2026-08-10` — no requiere autorización adicional, no
requiere revisor financiero externo, no requiere ningún bloque técnico.

Antes de implementar cualquier paso de este documento, se estudia
manualmente al menos un caso con información financiera pública, para
comprobar que esta especificación representa lo que un caso real
necesita — y corregirla si no. Secuencia:

1. **Caso público 01 — Tecnoglass** (análisis manual, sin scraping ni
   automatización, dentro del repositorio).
2. Documentar, para ese caso: contexto de la empresa, cuentas relevantes,
   ambigüedades, información faltante, preguntas que se le harían a
   gerencia, posibles normalizaciones, hipótesis de proyección, supuestos
   que necesitan juicio, y dudas financieras reales.
3. Contrastar ese análisis contra las entidades y el workflow de este
   documento (§4–§6).
4. Modificar esta especificación si el caso demuestra que faltan o sobran
   conceptos.
5. Solo entonces autorizar e implementar el primer checkpoint mínimo
   (§0.1) del Expediente.
6. Repetir con casos de complejidad creciente.
7. Llevar al profesor o a un futuro revisor las dudas financieras reales
   que hayan surgido de esos casos — no pedirle que diseñe el Expediente
   desde cero.

Esta tarea de estudio manual **no calcula una valoración** del caso
público, **no descarga datos** de forma automatizada y **no hace web
scraping** — es lectura y documentación manual de información ya pública.

### 0.1 Qué cuenta como "checkpoint mínimo" (para la condición de entrada de 1E)

`fases/FASE-01-EXACTITUD-FINANCIERA.md` y `plan/MATRIZ-DE-DEPENDENCIAS.md`
condicionan la reactivación del Bloque 1E a este checkpoint, no a la
implementación completa de este documento. El checkpoint mínimo se
considera alcanzado cuando: existe al menos un caso (público o real) con
su contexto de empresa documentado, al menos una cuenta material
interpretada con su ambigüedad y tratamiento, y evidencia de que esa
interpretación pudo registrarse **antes** de cualquier cálculo — es
decir, los Pasos 1 y 2 de §19 funcionando sobre un caso concreto, no los
6 pasos completos.

---

## 1. Objetivo

Permitir representar, para cada caso de valoración, la comprensión de la
empresa, sus cuentas, las preguntas que surgen, las respuestas y
evidencia recibidas, las normalizaciones aplicadas, las hipótesis de
proyección, los supuestos financieros y sus aprobaciones — **antes** de
que el motor determinístico ejecute un cálculo. El expediente es la
entrada que hoy no existe entre "documentos parseados" y "cálculo".

## 2. Problema que resuelve

Hoy (`_shared/canonical-financial-engine.ts`,
`_shared/financial-methodology.ts`) el pipeline pasa directamente de
`structured_input` (datos ya homologados) a cálculo, aplicando 8 supuestos
fijos por sector sin registrar ninguna interpretación específica de la
empresa: por qué una cuenta significa lo que significa, qué ambigüedad
tenía, quién decidió su tratamiento, ni con qué evidencia. El Expediente
V1 cierra ese vacío — sin todavía cambiar el motor de cálculo mismo.

## 3. Usuarios

- **Nicolás (operador de la boutique)**: crea y llena el expediente,
  genera preguntas, registra respuestas, propone normalizaciones e
  hipótesis, solicita aprobación.
- **Experto/revisor financiero externo**: revisa hipótesis y supuestos
  materiales, aprueba o rechaza, deja observaciones.
- **Cliente**: responde preguntas y aporta evidencia (a través de
  Nicolás en V1 — no hay portal de cliente en el MVP, ver §16).
- **IA (asistente, no aprobador)**: puede proponer clasificaciones,
  preguntas y borradores de normalización — nunca aprueba nada (ver §14).

## 4. Workflow

```
Analysis existente (documento parseado, structured_input ya generado)
  │
  ▼
Crear Expediente vinculado al analysis_id
  │
  ▼
Completar ficha de EMPRESA (contexto cualitativo)
  │
  ▼
Revisar CUENTAS materiales una por una
  │  → identificar ambigüedad → generar PREGUNTA
  │  → recibir RESPUESTA + EVIDENCIA
  │  → proponer NORMALIZACIÓN (si aplica) → aprobar
  ▼
Definir HIPÓTESIS de proyección (driver + razonamiento + evidencia)
  │
  ▼
Definir SUPUESTOS financieros del caso (puede partir de
CANONICAL_METHODOLOGY como valor de referencia, pero queda registrado
como decisión del caso, no como aplicación automática)
  │
  ▼
Aprobación del expediente (Nicolás y/o revisor externo, según
materialidad — ver §11)
  │
  ▼
Expediente en estado "aprobado_para_calculo"
  │
  ▼
(Fuera de alcance de V1: disparar el cálculo ya existente usando
 los supuestos del expediente aprobado — ver §13)
```

## 5. Entidades

Nombres en `snake_case`, tentativos — sujetos a la convención real del
esquema existente al implementar.

| Entidad | Propósito |
|---|---|
| `valuation_files` (Expediente) | Contenedor raíz de un caso, 1:1 con un `analysis_id` existente |
| `company_context` | Ficha cualitativa de la empresa (1:1 con el expediente) |
| `account_notes` | Interpretación de una cuenta material (N por expediente). **Confirmado por Caso 01 (§21)**: debe distinguir explícitamente `clasificacion_contable` (dónde y cómo la reporta la empresa) de `interpretacion_economica` (driver real, fijo/variable/mixto, sensibilidad a volumen, sensibilidad a commodity/FX, mecanismo y lag de pass-through) — son campos distintos, uno no sustituye al otro |
| `account_components` | **Nueva, confirmada por Caso 01, refinada por Caso 02, reforzada por Caso 03 (§21, §22, §23)**: descomposición económica opcional de una partida o variable material cuando su comportamiento económico no puede explicarse como una sola cifra. La dimensión de descomposición **no se limita a subcuentas contables** (ej. Cost of Sales → materiales/labor/energía/logística en Tecnoglass) — puede ser también de negocio, de producto, de canal, de geografía o de contrato (ej. EDS/Industria/Aviación & Marinos/Lubricantes/Servicios Complementarios en Terpel; E&P/Transporte/Refinación/Gas-Transición/ISA en Ecopetrol). N por `account_notes`, cada componente con su propio driver, participación estimada, fuente y estado epistémico (§5.1). **Candidato registrado por Caso 03, no incorporado a esta formulación**: la misma necesidad puede aplicar también a cifras netas y a movimientos agregados (no solo a partidas/saldos) — ver §23, Candidato A |
| `expedient_questions` | Preguntas generadas, vinculables a cuenta/documento/normalización/supuesto |
| `expedient_answers` | Respuestas a una pregunta, con evidencia asociada |
| `evidence_links` | Trazabilidad entre una decisión y su fuente (documento, página, respuesta, nota, fuente externa) |
| `normalizations` | Ajustes propuestos/aprobados sobre un valor reportado, con historial completo. **Confirmado por Caso 01**: deben coexistir siempre tres capas de valor — reportado, normalizado y proyectado — ninguna sobrescribe a otra |
| `projection_hypotheses` | Hipótesis de proyección con driver, razonamiento, fórmula, responsable. **Confirmado por Caso 01 (§21)**: `driver` es texto libre específico de la empresa (backlog, unidades×precio, clientes×ARPU, contratos, capacidad, etc.) — nunca un enum cerrado ni un catálogo universal (regla R7); una línea material (ej. ingresos) puede requerir una o varias hipótesis de driver, no una sola tasa de crecimiento genérica |
| `case_assumptions` | Supuestos financieros del caso específico. **Campos ampliados, confirmados por Caso 01 (§21)**: nombre, valor, unidad, categoría, driver, tipo de información, método de determinación, fuente, fecha, razonamiento, contexto específico de la empresa, estado epistémico (§5.1), nivel de certeza, materialidad, sensibilidad, responsable, estado, aprobación. Puede referenciar `CANONICAL_METHODOLOGY` como punto de partida, sin heredar su valor automáticamente |
| `assumption_relations` | **Nueva, confirmada por Caso 01 (§21)**: relación/dependencia explícita entre dos `case_assumptions` y/o `projection_hypotheses` (ej. "CAPEX de expansión restringe la capacidad que limita a ingresos"), con tipo de relación y razonamiento — para que cambiar un supuesto no ignore lo que depende de él |
| `coherence_flags` | **Nueva, confirmada por Caso 01, conceptual únicamente (§21, §20)**: señal generada (por regla o por IA-asistida, nunca decisoria) cuando dos elementos del expediente resultan inconsistentes entre sí (ej. ingreso proyectado que excede la capacidad declarada, normalización sin evidencia, supuesto material sin sensibilidad) — el sistema señala, nunca decide ni corrige automáticamente |
| `expedient_approvals` | Registro de aprobaciones (quién, qué, cuándo, sobre qué versión) |

## 5.1 Clasificación epistémica (transversal, confirmada por Caso 01 — §21)

Todo campo material de `company_context`, `account_notes` (incluidos sus
`account_components`), `expedient_questions`, `projection_hypotheses` y
`case_assumptions` debe poder declarar su estado de conocimiento, con uno
de estos valores — nunca implícito, nunca por defecto silencioso:

- `hecho_documentado` — verificado contra una fuente (documento, reporte
  público, dato del cliente).
- `inferencia_razonable` — se deduce de hechos documentados, pero no es,
  en sí, un hecho verificado.
- `hipotesis` — supuesto de trabajo, todavía sin evidencia suficiente.
- `desconocido` — declarado explícitamente como no disponible. **No se
  rellena con un valor por defecto** — un campo puede quedar
  `desconocido` sin bloquear el resto del expediente (ver criterio de
  aceptación nuevo en §17).
- `pregunta_a_gerencia` — pendiente de respuesta del cliente/empresa.
- `decision_del_analista` — Nicolás decidió un tratamiento, documentado y
  trazable, sin que constituya todavía una aprobación experta.
- `aprobado_por_experto` — validado por el revisor financiero externo.

Esta clasificación es la que usó `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`
§16 para separar hechos, inferencias y desconocidos del caso Tecnoglass —
se incorpora aquí porque ese ejercicio demostró que sin esta distinción
explícita el expediente no puede diferenciar "lo sabemos" de "lo estamos
asumiendo".

## 5.2 Necesidades conceptuales abiertas sobre un supuesto: alcance y propósito (confirmado por Caso 02, reforzado por Casos 03, 04, 05 y 06 — §22, §23, §24, §25, §26)

`docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md` §11 mostró que, en
una organización con múltiples negocios, países o contratos, un mismo
supuesto puede no significar lo mismo en toda la empresa, y que una
cifra puede haber sido determinada originalmente para un propósito
distinto al de una valoración Velarix. `docs/velarix/casos/03-ecopetrol/CASO-03-ECOPETROL-V0.md`
§13 y §17 (R6) reforzó esto con un mecanismo adicional: perímetro
consolidado con intereses no controladores materiales (ISA-subsidiaria
de Ecopetrol, ≈51,4% de control — no confundir con el Caso 05,
Interconexión Eléctrica S.A. como entidad propia). `docs/velarix/casos/04-grupo-exito/CASO-04-GRUPO-EXITO-V0.md`
§20 (R6) aportó evidencia particularmente limpia sobre **propósito**:
tasas de descuento para impairment, supuestos de unidades generadoras de
efectivo (UGE), y metodologías de fair value inmobiliario — un supuesto
válido para impairment o para el fair value de un inmueble no es
automáticamente válido para una valoración profesional del equity,
porque fue determinado con un propósito distinto. `docs/velarix/casos/05-isa/CASO-05-ISA-V0.md`
§19 y §22 (R6) reforzó esto aún más con ejemplos adicionales de
propósito: WACC/tasas regulatorias, tasas usadas en mediciones
contables, información segmentada usada por administración, y métricas
contractuales. Esto deja registradas dos necesidades conceptuales sobre
`case_assumptions` (y potencialmente `projection_hypotheses`), **sin
implementarlas ni diseñar su tipo, enum o estructura todavía**:

- **Alcance** (nombre tentativo `scope`): ¿a qué aplica exactamente este
  supuesto? — por ejemplo empresa completa, filial, país, segmento, UGE,
  producto, contrato, concesión, proyecto, activo, o la porción
  atribuible después de intereses no controladores. **Necesidad
  conceptual fuertemente respaldada por múltiples casos** (Terpel +
  Ecopetrol) — ni el Caso 04 ni el Caso 05 aportaron evidencia
  independiente nueva que eleve este nivel; sigue sin definirse tipo,
  enum ni estructura. **Cautela añadida por el Caso 05**: un problema de
  `scope` no implica la obligación de modelar siempre todos los niveles
  posibles (grupo, holding, filial, concesión, proyecto, activo,
  accionista).
- **Propósito** (nombre tentativo `purpose`): ¿para qué fue originalmente
  determinado o utilizado este supuesto? — por ejemplo prueba de
  deterioro, presupuesto, planificación, covenant, valoración previa, o
  presentación gerencial. **Sube de nivel de evidencia con el Caso 04 y
  nuevamente con el Caso 05**: de "pregunta conceptual abierta,
  evidencia menor que `scope`" (hasta el Caso 03) a "necesidad
  conceptual respaldada por múltiples casos" (Caso 04) y ahora a
  **necesidad conceptual fuertemente respaldada por múltiples casos,
  todavía menos madura que `scope`** (Caso 05) — sigue sin definirse
  tipo, enum ni estructura, y sigue sin fusionarse con `scope`. **El
  Caso 05 deja explícito, además, que la necesidad conceptual de
  comprender `purpose` no equivale a la necesidad de crear un campo
  `purpose`** — puede resolverse eventualmente mediante contexto,
  procedencia, narrativa, método de determinación, u otra
  representación.

`docs/velarix/casos/06-bancolombia/CASO-06-BANCOLOMBIA-V0.md` §6, §17 y
§20 (R6) aportó **refuerzo muy fuerte** a ambas necesidades —
Bancolombia hace especialmente material distinguir holding (Grupo
Cibest), banco operativo regulado (Bancolombia S.A.), grupo consolidado,
unidad regulatoria, e interés económico final del accionista, así como
ejemplos adicionales de propósito (instrumento mantenido para cobrar,
negociar, cubrir riesgos, administrar liquidez, soportar necesidades
regulatorias) — **sin que ninguna de las dos necesidades suba de nivel
formal más allá de lo ya alcanzado en el Caso 05**: `scope` permanece
`NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS` y
`purpose` permanece `NECESIDAD CONCEPTUAL FUERTEMENTE RESPALDADA POR
MÚLTIPLES CASOS, AÚN MENOS MADURA QUE SCOPE`. El Caso 06 deja explícito
que un problema de `scope` no implica la obligación de modelar todos
los niveles posibles.

Ninguno de los dos nombres, tipos ni estructuras finales queda decidido
por esta actualización — ver `docs/velarix/casos/02-terpel/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
§2 (cambios #2 y #3), `docs/velarix/casos/03-ecopetrol/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
§3, `docs/velarix/casos/04-grupo-exito/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
§3, `docs/velarix/casos/05-isa/REPORTE-CONTRASTE-EXPEDIENTE-V1.md` §6, y
`docs/velarix/casos/06-bancolombia/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
§3.

## 6. Relaciones principales

- `valuation_files.analysis_id` → `analyses.id` (existente) — 1:1.
- `company_context.valuation_file_id` → `valuation_files.id` — 1:1.
- `account_notes.valuation_file_id` → `valuation_files.id` — N:1.
- `account_notes` puede referenciar `account_homologations`/
  `structured_inputs` existentes (para no duplicar qué cuenta es) — no
  redefine el mapeo de cuentas, lo interpreta.
- `expedient_questions.valuation_file_id` → `valuation_files.id` — N:1.
  `expedient_questions` puede vincularse opcionalmente a
  `account_notes`, `evidence_links`, `normalizations` o
  `case_assumptions` (una pregunta puede no estar ligada a nada más que
  la empresa en general).
- `expedient_answers.question_id` → `expedient_questions.id` — N:1.
- `evidence_links` puede apuntar a un `document_id` existente + página/
  sección, a una `expedient_answers.id`, o a una fuente externa (texto
  libre + URL si aplica).
- `normalizations.account_note_id` → `account_notes.id` — N:1 (una cuenta
  puede tener varias normalizaciones a lo largo del proceso, se conserva
  el historial completo, no se sobrescribe).
- `case_assumptions.valuation_file_id` → `valuation_files.id` — N:1 (un
  supuesto por nombre y versión, historial conservado).
- `account_components.account_note_id` → `account_notes.id` — N:1
  (**nueva, Caso 01, refinada por Caso 02**: componentes económicos de
  una partida material, descompuesta según la dimensión que explique su
  comportamiento — contable, de negocio, de producto, de canal, de
  geografía o de contrato, no solo contable).
- `assumption_relations` — **nueva, Caso 01**: relación N:N entre dos
  `case_assumptions` y/o `projection_hypotheses` (autorreferencial entre
  ambas entidades), con `tipo_relacion` (ej. `depende_de`,
  `restringe_a`, `debe_ser_consistente_con`) y razonamiento.
- `coherence_flags` — **nueva, Caso 01, conceptual**: referencia a dos o
  más elementos del expediente (cuentas, hipótesis, supuestos,
  normalizaciones) que resultan inconsistentes entre sí, más una
  descripción de la incoherencia detectada — sin relación de aprobación,
  porque no decide nada.
- `expedient_approvals.valuation_file_id` → `valuation_files.id` — N:1
  (puede haber una aprobación parcial de hipótesis y otra del expediente
  completo).

## 7. Estados

### Estado del expediente completo

```
en_construccion
→ preguntas_pendientes (existe al menos 1 pregunta sin responder)
→ listo_para_revision (todas las preguntas materiales respondidas)
→ en_revision_experta
→ aprobado_para_calculo
→ requiere_ajuste (si el revisor rechaza algo — vuelve a en_construccion
  con las observaciones registradas, no se pierde el trabajo previo)
```

### Estado de una pregunta

```
abierta → respondida → (si genera normalización) evaluada → cerrada
```

### Estado de una normalización

```
propuesta → aprobada | rechazada
```

Igual que la máquina de estados del análisis
(`fases/FASE-01-EXACTITUD-FINANCIERA.md`, sección "Estado y aprobación
final"): **cualquier modificación posterior a una entidad ya aprobada
invalida esa aprobación específica**, no todo el expediente — el
expediente vuelve a `requiere_ajuste` solo si la modificación afecta algo
ya marcado como aprobado.

## 8. Permisos

Reutiliza el modelo de actores ya definido en Bloque 1D
(`fases/FASE-01-EXACTITUD-FINANCIERA.md`, tabla de actores) — no se
inventa un modelo nuevo:

| Actor | Puede |
|---|---|
| Cliente propietario del `analysis_id` | Ver su propio expediente en modo lectura (si se decide exponerlo — no es requisito del MVP); nunca editar ni aprobar |
| Analista autorizado (Nicolás) | Crear, editar, generar preguntas, proponer normalizaciones/hipótesis/supuestos, solicitar revisión |
| Revisor financiero externo | Ver, comentar, aprobar/rechazar hipótesis y supuestos materiales |
| Administrador | Todo lo anterior |

Igual que el resto del sistema: la autorización se verifica en
servidor/RLS, nunca solo en el frontend.

## 9. Trazabilidad

Cada normalización y cada supuesto del caso debe poder responder: valor
original → quién lo cuestionó → por qué → qué evidencia se usó → quién lo
aprobó → valor final. Esto es una extensión natural de
`_shared/calculation-provenance.ts` (ya existente para
homologación→structured_input→calculation_result) — el Expediente V1
añade la capa anterior (empresa→cuenta→pregunta→evidencia→normalización)
que hoy no existe en ningún lado.

## 10. Preguntas

Cada pregunta conserva: texto, razón, materialidad (alta/media/baja, ver
§11), quién la generó (Nicolás o IA-asistida, marcado explícitamente),
respuesta, evidencia asociada, estado, y conclusión derivada (qué
normalización o hipótesis resultó de ella, si aplica). Una pregunta
generada por IA debe quedar marcada como tal — nunca se presenta como si
la hubiera generado un humano.

## 11. Materialidad

Criterio simple para V1 (no un modelo cuantitativo sofisticado): una
cuenta, normalización o supuesto es **material** si su variación
razonable cambia el Enterprise Value en más de un umbral porcentual a
definir por Nicolás/revisor antes de la implementación (ej. 5%, sujeto a
validación — no se fija aquí un número sin respaldo). Los elementos
materiales requieren aprobación del revisor externo; los no materiales
pueden aprobarse solo por Nicolás, quedando igualmente documentados.

## 12. Evidencias

Un `evidence_links` debe registrar al menos: tipo de fuente (documento
del cliente / respuesta del cliente / nota interna / fuente externa),
referencia exacta (documento + página/sección, o texto de la respuesta,
o URL/cita de la fuente externa), y quién la aportó. No se acepta una
normalización material sin al menos una evidencia vinculada.

## 13. Relación con los motores financieros existentes

El Expediente V1 **no reemplaza ni modifica**
`_shared/canonical-financial-engine.ts`,
`_shared/financial-methodology.ts` ni `_shared/capital-structure.ts`.
En esta primera versión:

- El expediente se construye en paralelo al pipeline existente
  (`build-structured-input` → `ejecutar-calculo`), sin bloquearlo ni
  alterar su comportamiento actual.
- `case_assumptions` puede usar `CANONICAL_METHODOLOGY` como
  **valor de referencia sugerido**, nunca como aplicación automática — el
  valor final que quede en el expediente es una decisión registrada del
  caso, aunque coincida numéricamente con el canónico.
- **Conectar el resultado del expediente al motor de cálculo real**
  (que el motor use los supuestos aprobados del expediente en vez de
  `CANONICAL_METHODOLOGY` directamente) es explícitamente **fuera de
  alcance de V1** — es un paso posterior, condicionado a que el MVP del
  expediente funcione primero de forma aislada y a una decisión separada
  del fundador.

## 14. Interacción futura con IA

En V1, la IA puede (si se decide activarla, no es obligatorio para el
MVP): sugerir preguntas a partir de inconsistencias detectadas en
`structured_input`, proponer un borrador de clasificación de una cuenta
ambigua, resumir una respuesta larga del cliente. Todo lo que la IA
proponga debe quedar marcado como sugerencia pendiente de aceptación
humana — nunca se inserta directamente como pregunta, normalización o
supuesto aprobado. Esto es consistente con `Negocio_Velarix_v4.2.md`
§9.8.

## 15. Relación con documentos

El expediente no reemplaza el almacenamiento ni el parsing existente de
documentos (`parse-document`, Storage). `evidence_links` referencia
documentos ya existentes por `document_id` — no se duplica el
almacenamiento de archivos.

## 16. Relación con el informe final

Fuera de alcance de V1: incluir el contenido del expediente en el PDF o
en la narrativa generada. Ese trabajo depende de que el Bloque 1E
(conexión de narrativa/PDF al resultado canónico) se reactive, lo cual a
su vez depende de superar el checkpoint mínimo descrito en §0.1 — no de
completar la implementación total del expediente (`Negocio_Velarix_v4.2.md`
§18) — es un paso posterior, no de esta especificación.

## 17. Criterios de aceptación del MVP

- [ ] Se puede crear un expediente vinculado a un `analysis_id` existente.
- [ ] Se puede registrar el contexto cualitativo de la empresa
      (`company_context`).
- [ ] Se puede anotar la interpretación de al menos una cuenta material
      (`account_notes`) sin perder el vínculo con `structured_inputs`.
- [ ] Se puede generar una pregunta, vincularla a una cuenta, recibir una
      respuesta y adjuntar evidencia.
- [ ] Se puede proponer una normalización y aprobarla, conservando el
      valor original y el ajustado (nunca se sobrescribe el original).
- [ ] Se puede registrar al menos una hipótesis de proyección con driver,
      razonamiento y responsable.
- [ ] Se puede registrar un supuesto del caso, opcionalmente partiendo de
      `CANONICAL_METHODOLOGY` como referencia, sin heredarlo
      automáticamente.
- [ ] El expediente completo puede pasar por el ciclo de estados
      (§7) hasta `aprobado_para_calculo`.
- [ ] Una modificación posterior a un elemento ya aprobado invalida esa
      aprobación específica (no todo el expediente).
- [ ] Ningún elemento material queda aprobado sin al menos una evidencia
      vinculada.
- [ ] El motor de cálculo existente sigue funcionando exactamente igual
      que antes — el expediente no lo interviene todavía (§13).
- [ ] **(Confirmado por Caso 01, §21)** Un campo material puede quedar
      marcado explícitamente `desconocido` (§5.1) sin bloquear el resto
      del expediente — no existe ningún relleno automático por defecto.
- [ ] **(Confirmado por Caso 01, §21)** Para al menos una cuenta, pueden
      coexistir su valor reportado, su valor normalizado (si aplica) y
      al menos una hipótesis de proyección que lo use — sin que ninguna
      capa sobrescriba a otra.

## 18. Pruebas necesarias

- Pruebas de las reglas de estado (una pregunta no puede cerrarse sin
  respuesta; una normalización material no puede aprobarse sin evidencia
  ni sin el rol correcto; una modificación posterior invalida la
  aprobación correspondiente).
- Pruebas de permisos (mismo patrón que
  `supabase/functions/_shared/authorization.test.ts`): cliente propietario
  no puede aprobar, analista puede proponer pero no aprobar lo material
  sin revisor si así se define, administrador puede todo.
- Pruebas de trazabilidad: dado un valor final de una cuenta normalizada,
  se puede reconstruir la cadena completa hasta la evidencia original.
- Prueba de que el motor de cálculo existente no cambia de comportamiento
  con el expediente presente pero no conectado (§13).

## 19. Plan de implementación incremental (referencial, no autorización de inicio)

1. **Paso 1 — esquema mínimo**: `valuation_files`, `company_context`,
   `account_notes`, sin preguntas ni normalizaciones todavía. Objetivo:
   poder documentar el contexto cualitativo de un caso real.
2. **Paso 2 — preguntas y evidencia**: `expedient_questions`,
   `expedient_answers`, `evidence_links`.
3. **Paso 3 — normalizaciones**: `normalizations`, con su ciclo
   propuesta→aprobada/rechazada y el historial completo.
4. **Paso 4 — hipótesis y supuestos del caso**: `projection_hypotheses`,
   `case_assumptions`.
5. **Paso 5 — aprobaciones y máquina de estados completa**:
   `expedient_approvals`, materialidad, ciclo de estados del expediente
   (§7).
6. **Paso 6 (fuera de V1, decisión separada)** — conectar
   `case_assumptions` aprobados al motor de cálculo real, reemplazando la
   lectura directa de `CANONICAL_METHODOLOGY`.

Cada paso se implementa, prueba y cierra antes de abrir el siguiente —
mismo principio operativo que la Fase 1 (`fases/FASE-01-EXACTITUD-FINANCIERA.md`,
"Ningún bloque de esta fase se ejecuta con agentes/sesiones en paralelo
que modifiquen los mismos archivos").

## 20. Explícitamente fuera de alcance de V1

- Conectar el expediente al motor de cálculo real (§13, §19 paso 6).
- Incluir el expediente en el PDF o la narrativa (§16).
- Portal de cliente para responder preguntas directamente (las respuestas
  se registran vía Nicolás en V1).
- Cualquier automatización de IA que apruebe o decida sin intervención
  humana (§14).
- **Biblioteca automatizada de casos (B)** — ingestión automática,
  interfaz de biblioteca, scraping, procesamiento masivo, búsqueda
  automatizada, entrenamiento con casos. Iniciativa relacionada pero
  separada y diferida, registrada como `BL-34` en
  `docs/velarix/plan/BACKLOG-CLASIFICADO.md`. **No confundir con** el
  estudio manual de casos públicos (Biblioteca A, §0 de este documento,
  `BL-35`), que sí está activo y es, de hecho, el paso previo obligatorio
  a esta misma implementación.
- Reactivación del Bloque 1E — bloqueada hasta superar el checkpoint
  mínimo de §0.1, no hasta completar este documento entero.
- **Implementación de `coherence_flags`** (§5, §6) — queda como concepto
  confirmado por Caso 01 y reforzado por Caso 02, no como autorización de
  implementación. Requiere criterio de un experto financiero antes de
  precisar su diseño.
- **Diseño e implementación de `scope` y `purpose`** (§5.2) — quedan
  como necesidad conceptual registrada por Caso 02, no como campos ni
  estructura a implementar. Requiere más casos y criterio experto.
- **Cualquier estructura para comparabilidad/perímetro histórico**
  (adquisiciones, ventas, reclasificaciones, operaciones discontinuadas,
  cambios de consolidación) — Caso 02 (§12, §22) registró esta necesidad
  con evidencia insuficiente para diseñar solución. Caso 03 (§13, §23)
  cambió el estado a `PROBLEMA DEMOSTRADO; EVIDENCIA INSUFICIENTE PARA
  DISEÑAR UNA SOLUCIÓN GENERAL` (evidencia directa: ISA-subsidiaria de
  Ecopetrol consolidada al 100% con ≈51,4% de control económico,
  intereses no controladores materiales). Caso 04 (§21, §24) aportó una
  segunda economía independiente con el mismo problema (estructuras
  inmobiliarias "Viva" con participación atribuible de 26,01%, negocios
  conjuntos al 50% fuera de consolidación línea por línea, y un cambio
  de perímetro de Argentina reconocido explícitamente por la propia
  compañía como limitante de comparabilidad) y elevó el estado a
  `PROBLEMA DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA TODAVÍA
  INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN GENERAL`. **Caso 05 (§23, §25)**
  — esta vez sobre Interconexión Eléctrica S.A. (ISA) como entidad
  propia, no como subsidiaria de otro caso — concentra dentro de una
  sola entidad consolidación sin 100% económico, NCI material, negocios
  conjuntos/asociadas fuera de consolidación línea por línea, y
  diferencias entre control y porcentaje económico, y eleva el estado a
  `PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA
  SUFICIENTE PARA EXIGIR TRATAMIENTO METODOLÓGICO, TODAVÍA INSUFICIENTE
  PARA DISEÑAR UNA REPRESENTACIÓN GENERAL` — **sigue sin crearse
  `case_perimeter` ni ninguna tabla, schema, campo, ni motor automático
  de NCI/JV**, porque exigir tratamiento metodológico no equivale a una
  solución de diseño disponible. **Cautela explícita del Caso 05**:
  problema de perímetro demostrado ≠ obligación de modelar entidad por
  entidad. **Caso 06 (§21, §26)** — sobre Grupo Cibest/Bancolombia S.A.,
  la primera institución financiera regulada de la secuencia — aporta
  holding distinto del banco operativo, regulación a `scopes`
  específicos, reorganización societaria completada en 2025, y una
  operación (Banistmo) con clasificación de perímetro relevante al
  cierre, y eleva el estado a `PROBLEMA FUERTEMENTE DEMOSTRADO EN
  MÚLTIPLES ECONOMÍAS, AHORA INCLUYENDO UNA INSTITUCIÓN FINANCIERA;
  EVIDENCIA SUFICIENTE PARA EXIGIR TRATAMIENTO METODOLÓGICO, TODAVÍA
  INSUFICIENTE PARA DISEÑAR UNA REPRESENTACIÓN GENERAL` — **sigue sin
  crearse `case_perimeter` ni ninguna estructura**.
- **Candidatos registrados por Caso 03, actualizados por Casos 04, 05 y
  06, sin arquitectura ni campos** (§23, §24, §25, §26):
  - **Candidato A — neteo de movimientos económicamente distintos**: ni
    Caso 04, ni Caso 05, ni Caso 06 aportaron evidencia independiente
    fuerte sobre este candidato; se mantiene sin elevar (`EVIDENCIA
    FUERTE EN ECOPETROL — VALIDAR EN CASOS FUTUROS`). Caso 06 aclara
    explícitamente que la coexistencia normal de activos y pasivos
    financieros en el balance de un banco no equivale, por sí misma, a
    evidencia de neteo económicamente destructivo.
  - **Candidato B — ciclo de vida económico de un activo o variable**:
    Caso 04 aportó una segunda economía de naturaleza muy distinta
    (ciclo de apertura/remodelación/cierre de tiendas de Grupo Éxito,
    frente al ciclo de agotamiento/abandono de activos E&P de
    Ecopetrol). Caso 05 aportó un tercer ciclo (concesiones de ISA). El
    estado subió a `PATRÓN OBSERVADO EN TRES CASOS DE NATURALEZA
    ECONÓMICA MUY DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA`. **Caso
    06** aporta una cuarta instancia, más débil estructuralmente que las
    tres anteriores (vida/vencimiento contractual de activos o pasivos
    financieros ≠ vida económica del portafolio ≠ vida de la compañía)
    — el estado sube a `PATRÓN OBSERVADO EN CUATRO CASOS DE NATURALEZA
    ECONÓMICA MUY DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA`. **No se
    crea `economic_lifecycle`.**
  - **Candidato C — atribución temporal/corte de conocimiento**: Caso 04
    aportó evidencia independiente fuerte; Caso 05 reforzó el problema
    sin elevar el estado, que quedó en `PROBLEMA METODOLÓGICO
    RESPALDADO POR MÚLTIPLES CASOS — REQUIERE DEFINIR PRINCIPIOS ANTES
    DE DISEÑAR REPRESENTACIÓN`. **Caso 06** refuerza muy fuertemente el
    problema (reorganización societaria de 2025; acuerdo sobre
    Banistmo, su clasificación al cierre, y sus eventos posteriores) y
    eleva el estado a `PROBLEMA METODOLÓGICO FUERTEMENTE RESPALDADO POR
    MÚLTIPLES CASOS — REQUIERE DEFINIR PRINCIPIOS ANTES DE DISEÑAR
    REPRESENTACIÓN`. **No se crea `economic_period`.**
  - **Candidato D — derechos económicos/propiedad dinámica (nuevo,
    Caso 04)**: la atribución económica puede depender no solo de la
    propiedad actual, sino de derechos u obligaciones contractuales
    capaces de modificarla (evidencia: opción de venta sobre intereses
    no controladores de Grupo Disco Uruguay, ejercida parcialmente en
    2025). Caso 05 aportó evidencia fuerte de que control ≠ porcentaje
    económico, pero no de la parte específicamente dinámica/contractual
    del candidato, sin elevar el estado. **Caso 06 tampoco aportó
    evidencia suficiente para reforzar el componente
    contractual/dinámico** — la reorganización societaria de 2025 es un
    cambio estructural completado, no un derecho contractual dinámico
    pendiente. Se mantiene sin elevar: `EVIDENCIA FUERTE EN GRUPO ÉXITO
    — VALIDAR EN CASOS FUTUROS`. **No se crea entidad, tabla, campos, ni
    modelo automático de valoración de opciones.**
  - **Candidato E — base de medición/régimen monetario (nuevo,
    Caso 04)**: Caso 05 aportó evidencia independiente de naturaleza
    distinta (moneda funcional, indexación, coberturas, medición
    nominal vs. costo amortizado) y el estado subió a `PATRÓN OBSERVADO
    EN DOS CASOS DE NATURALEZA ECONÓMICA DISTINTA — FORMULACIÓN GENERAL
    AÚN ABIERTA`. **Caso 06** aporta evidencia adicional fuerte (costo
    amortizado, FVOCI, FVTPL, impairment/ECL como "base de medición";
    moneda funcional y exposición FX como "régimen monetario"), pero
    **tensiona la formulación general en vez de simplemente
    reforzarla**: el estado pasa a `EVIDENCIA ADICIONAL FUERTE, PERO LA
    FORMULACIÓN GENERAL SE VUELVE MENOS ESTABLE: "BASE DE MEDICIÓN" Y
    "RÉGIMEN MONETARIO / MONEDA" PUEDEN SER FENÓMENOS RELACIONADOS PERO
    METODOLÓGICAMENTE DISTINTOS`. **No se divide todavía en E1/E2. No se
    crea `measurement_basis`, enum monetario, ni campos.**
  - **Observación ISA-F (nueva, Caso 05, explícitamente NO un candidato
    formal)**: "el reconocimiento, titularidad o control de un recurso
    no implica necesariamente que esté económicamente disponible para
    cualquier propósito" — evidencia original: efectivo restringido en
    ISA. **Caso 06** refuerza con un mecanismo distinto: cash contable ≠
    automáticamente cash disponible para net debt o distribución
    (liquidez prudencial bancaria) — el estado sube a `OBSERVACIÓN
    TRANSVERSAL FUERTEMENTE REFORZADA EN DOS ECONOMÍAS RADICALMENTE
    DISTINTAS — ISA Y BANCOLOMBIA — MANTENER ABIERTA PARA VALIDACIÓN EN
    CASOS 07–08 ANTES DE DECIDIR SU ELEVACIÓN`. **Sigue sin convertirse
    en Candidato F. No se crea `availability`, enum, campo, schema, ni
    automatización.**
  - **Observación Bancolombia-G (nueva, Caso 06, explícitamente NO un
    candidato formal)**: "la generación de utilidad o la existencia de
    patrimonio en una entidad regulada no determina por sí sola cuánto
    valor económico puede distribuirse al accionista final; pueden
    intervenir requerimientos de capital, crecimiento, buffers
    prudenciales y niveles societarios intermedios" (cadena conceptual:
    resultado → retención necesaria → capital que soporta crecimiento/
    riesgo → posible capital excedentario → capacidad de distribución de
    la subsidiaria → recursos recibidos por el holding → obligaciones
    propias del holding → capacidad final de distribución). Estado
    `EVIDENCIA FUERTE EN BANCOLOMBIA — OBSERVACIÓN SECTORIAL; VALIDAR
    ANTES DE ELEVAR A CANDIDATO TRANSVERSAL`. **No se llama "Candidato
    G". No se fusiona todavía con la observación ISA-F** — ambas tratan
    disponibilidad/capacidad de recursos, pero por mecanismos distintos.
    Munich Re (Caso 08, autorizado, no iniciado) es la prueba futura más
    relevante identificada para esta observación. **No se crea
    `capital_bridge`, `regulatory_capital`, `distributable_capital`,
    campos, tablas, ni reglas automáticas.**

  Todos los candidatos y las observaciones ISA-F y Bancolombia-G
  requieren más casos y, después, criterio experto antes de precisarse.
- **Cautelas conceptuales adicionales aportadas por el Caso 05, sin
  cambio de especificación** (§22, §25):
  - **R3**: no convertir `assumption_relations` en un grafo causal
    ingenuo de tipo A → B — las relaciones observadas en ISA pueden ser
    temporales, condicionales, regulatorias, reestimables, y afectadas
    por variables externas.
  - **R4**: la descomposición debería detenerse cuando una granularidad
    adicional deja de modificar materialmente la interpretación
    económica necesaria para el propósito del análisis — guía
    conceptual, no umbral numérico ni campo a implementar.
  - **CAPEX**: la clasificación contable de un desembolso en el estado
    de flujos de efectivo no determina por sí sola si existe inversión
    económica — no se crea todavía una nueva taxonomía de CAPEX.
- **Cautelas conceptuales adicionales aportadas por el Caso 06, sin
  cambio de especificación** (§20, §26):
  - **Arquitectura financiera método-dependiente**: la tasa de
    descuento, el flujo valorado, y el puente entre valor de empresa y
    valor de equity pueden depender del método de valoración elegido y
    del objeto económico valorado, no de una arquitectura financiera
    única — Bancolombia aporta evidencia suficiente para rechazar como
    obligación universal la secuencia `FCFF → WACC → CAPEX → NWC →
    Enterprise Value → net debt → Equity Value`, sin eliminarla como
    opción válida cuando la economía y el método la justifiquen. **No
    se aprueba ningún método alternativo. No se calcula WACC ni Cost of
    Equity. No se modifica la Decisión 1 del Bloque 1B.**
  - **Proceso universal ≠ arquitectura financiera específica**: el
    Expediente puede conservar una capa universal de proceso (evidencia
    → contexto → interpretación → estado de conocimiento → preguntas →
    normalizaciones → hipótesis/supuestos → selección/justificación
    metodológica → aprobación experta → cálculo → conclusión
    profesional) aunque la arquitectura financiera específica del
    método y de la economía valorada no sea universal — **esta
    distinción no se convierte en `industry_type`, `bank_mode`, enum de
    institución financiera, motores sectoriales, ni arquitectura
    técnica nueva.**
  - **Objeto de valoración**: puede ser necesario establecer
    explícitamente qué interés económico se está intentando valorar
    (ej. grupo consolidado, holding, subsidiaria regulada, u otro
    `scope`) antes de seleccionar método — necesidad metodológica, **no**
    diseño de datos. **No se crea `valuation_method` field, enum,
    selector, ni "method engine".**

---

## 21. Ajustes confirmados por el Caso 01 (Tecnoglass) — 2026-08-10

**Estado: especificación conceptual sujeta a validación adicional con
Caso 02; no autorización de implementación.** Detalle completo del caso
y del contraste: `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`
y `docs/velarix/casos/01-tecnoglass/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`.

El estudio manual del Caso Público 01 (Tecnoglass) confirmó ocho
necesidades que este documento no representaba con suficiente precisión
antes de esta actualización, y que ahora quedan incorporadas en §5, §5.1,
§6, §17 y §20:

1. **Clasificación epistémica explícita por campo** (§5.1) — sin ella, el
   expediente no puede distinguir un hecho de una hipótesis.
2. **Tres capas de valor coexistentes** (reportado / normalizado /
   proyectado) para cuentas y supuestos — ninguna sobrescribe a otra.
3. **Separación explícita entre clasificación contable e interpretación
   económica** de una cuenta (`account_notes`) — confirmado por el caso
   de tarifas registradas fuera de Cost of Sales en Tecnoglass.
4. **Descomposición económica opcional de cuentas agregadas**
   (`account_components`) — confirmado por la falta de desagregación
   pública del Cost of Sales de Tecnoglass.
5. **Campos ampliados de `case_assumptions`** (categoría, driver, tipo de
   información, método de determinación, nivel de certeza, materialidad,
   sensibilidad) — confirmado por la tabla de variables aportada por el
   fundador, con la regla explícita de que ningún valor de esa tabla es
   un default universal.
6. **Drivers de proyección específicos de empresa, no un catálogo
   cerrado** (`projection_hypotheses.driver` como texto libre) —
   confirmado por el rol central del backlog en Tecnoglass, que no se
   generaliza como requisito universal.
7. **Relaciones/dependencias explícitas entre supuestos**
   (`assumption_relations`) — confirmado por ejemplos concretos
   (CAPEX→capacidad→ingresos, backlog→working capital, g→reinversión).
8. **Detección de incoherencias sin decisión automática**
   (`coherence_flags`, conceptual, no implementado) — confirmado por
   patrones identificados en el caso (ej. ingreso que excedería la
   capacidad declarada, normalización sin evidencia).

**Explícitamente no confirmado por este caso** (queda fuera, sin
agregarse a la especificación): ningún valor numérico de Tecnoglass
(márgenes, tasas, múltiplos) se incorporó como default, benchmark ni
referencia metodológica de Velarix. Ningún driver específico de
Tecnoglass (backlog, capacidad manufacturera) se declaró requisito
universal para otras empresas. No se definió todavía el umbral de
materialidad que activa `account_components`, ni el diseño final de
`coherence_flags` — ambos requieren más casos y/o criterio experto antes
de precisarse (ver `REPORTE-CONTRASTE-EXPEDIENTE-V1.md`).

---

## 22. Ajustes confirmados por el Caso 02 (Organización Terpel) — 2026-08-10

**CASO 02 NO AUTORIZA IMPLEMENTACIÓN.** Ni el Caso 01, ni el Caso 02, ni
este contraste, ni esta actualización del Expediente constituyen
autorización para implementar ninguna estructura técnica (tablas, SQL,
migraciones, schemas, UI, motores, Edge Functions, automatizaciones,
persistencia, coherence engine, decomposition engine, o cualquier cambio
runtime). Solo Nicolás/fundador puede autorizar implementación, de forma
explícita y separada.

**Estado: especificación conceptual sujeta a validación adicional con
más casos; no autorización de implementación.** Detalle completo del
caso y del contraste:
`docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md` y
`docs/velarix/casos/02-terpel/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`.

El Caso Público 02 (Organización Terpel) no buscó practicar otra
valoración — buscó romper o refutar lo confirmado por el Caso 01. **Dos
casos muestran patrones; dos casos no crean leyes universales.** El
estudio manual de Terpel confirmó, profundizó o refinó lo siguiente,
ahora incorporado en §5, §5.2 y §20:

1. **R1, R2, R5, R7 y R8 (Caso 01, §19 del caso Tecnoglass) sobreviven,
   reforzadas con evidencia independiente** — decalaje, contratos y
   negocios con economics propios (R1); el fenómeno de decalaje como
   nueva evidencia de que observado ≠ normalizado ≠ proyectado (R2);
   preguntas sin respuesta disponible en este caso, preservadas como
   `desconocido`/`pregunta_a_gerencia` (R5); drivers de Terpel
   radicalmente distintos de los de Tecnoglass, sin biblioteca universal
   (R7); nuevos patrones de incoherencia detectables sin decisión
   automática (R8). Ninguna de estas reglas generó cambio de
   especificación — se registran como confirmación con segunda
   evidencia independiente.
2. **R4 se refina** (§5, tabla de `account_components`; §6): la
   descomposición económica de una partida material **no se limita a
   subcuentas contables** — la dimensión relevante puede ser también de
   negocio, de producto, de canal, de geografía o de contrato,
   confirmado por los negocios de Terpel (EDS, Industria, Aviación &
   Marinos, Lubricantes, Servicios Complementarios).
3. **R3 se profundiza, sin cambio de especificación**: Terpel sugiere
   cadenas causales de más de dos elementos (precio→inventario→decalaje→
   margen; plazo proveedor→AP→NWC→caja). Queda como pregunta abierta si
   `assumption_relations` necesita representar esto — **no se rediseña
   en esta actualización**.
4. **R6 se muestra incompleto**: se registra la necesidad conceptual de
   **alcance** (`scope`, §5.2) y de **propósito original** (`purpose`,
   §5.2) de un supuesto — **sin definir tipo, enum ni estructura**.
5. **Nueva pregunta abierta, sin estructura propuesta**: comparabilidad/
   perímetro histórico (adquisiciones, ventas, reclasificaciones,
   operaciones discontinuadas, cambios de consolidación) puede afectar
   la comparabilidad entre periodos — registrada en §20 como
   `EVIDENCIA INSUFICIENTE PARA DISEÑAR SOLUCIÓN — VALIDAR EN CASOS
   FUTUROS`, sin crear `case_perimeter` ni ninguna tabla.
6. **Segunda instancia de una pregunta metodológica ya abierta**: el
   plazo de pago ampliado con Ecopetrol reabre, con un instrumento
   distinto, la misma pregunta que el supplier finance de Tecnoglass
   (¿capital de trabajo operativo o financiación?) — sigue sin
   resolverse aquí; ahora hay dos instancias independientes del mismo
   tipo de pregunta, lo que la hace más relevante para llevar a un
   experto financiero, no menos abierta.

**Explícitamente no confirmado por este caso** (queda fuera, sin
agregarse a la especificación): ninguna cifra de Terpel se incorporó
—de hecho, el material de trabajo de este caso no incluyó cifras
financieras específicas—; ningún negocio o driver de Terpel (EDS,
Industria, Aviación & Marinos, Lubricantes, Servicios Complementarios)
se declaró requisito universal para otras empresas; no se decidió el
nombre, tipo ni estructura final de `scope` ni de `purpose`; no se
rediseñó `assumption_relations`; no se creó ninguna estructura para
comparabilidad/perímetro histórico; no se resolvió si el plazo con
Ecopetrol es capital de trabajo operativo o financiación. Todo lo
anterior requiere más casos y/o criterio experto antes de precisarse
(ver `docs/velarix/casos/02-terpel/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`).

---

## 23. Refinamientos documentales derivados del Caso 03 (Ecopetrol) — 2026-08-10

**CASO 03 NO AUTORIZA IMPLEMENTACIÓN.** Ni el Caso 01, ni el Caso 02, ni
el Caso 03, ni ninguno de sus reportes de contraste, ni esta
actualización del Expediente, constituyen autorización para implementar
ninguna estructura técnica (tablas, SQL, migraciones, schemas, UI,
motores, Edge Functions, automatizaciones, persistencia, coherence
engine, decomposition engine, grafo causal, `case_perimeter`,
`contracts`, `economic_period`, `economic_lifecycle`, o cualquier cambio
runtime). Solo Nicolás/fundador puede autorizar implementación, de forma
explícita y separada.

**Estado: especificación conceptual sujeta a validación adicional con
más casos; no autorización de implementación.** Detalle completo del
caso y del contraste:
`docs/velarix/casos/03-ecopetrol/CASO-03-ECOPETROL-V0.md` y
`docs/velarix/casos/03-ecopetrol/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`.

El Caso Público 03 (Ecopetrol, FY2025) no buscó practicar otra
valoración — buscó tensionar y, donde correspondiera, refutar lo
observado o reforzado por los Casos 01 y 02. **Dos casos muestran
patrones; dos casos no crean leyes universales.** Con un tercer caso, la
regla se mantiene: **tres casos siguen sin crear leyes universales**,
pero permiten registrar, con prudencia, qué reaparece de forma
transversal e idéntica en los tres (`PATRÓN OBSERVADO EN TRES CASOS`) —
nunca `CONFIRMADO`. El estudio manual de Ecopetrol aportó evidencia que
reforzó, profundizó o cambió de estado lo siguiente, ahora incorporado
en §5, §5.2 y §20:

1. **R1, R2, R7 y R8 pasan a `PATRÓN OBSERVADO EN TRES CASOS`** —
   reaparecen de forma transversal e idéntica en Tecnoglass, Terpel y
   Ecopetrol: contabilidad ≠ economía (reservas con causas heterogéneas,
   impairment neto que oculta movimientos opuestos, perímetro de ISA);
   observado ≠ normalizado ≠ proyectado (FEPC: CFO de un período incluye
   cobros originados en otro); drivers específicos por empresa (la
   ausencia de una biblioteca universal cerrada vuelve a observarse en
   tres economías muy distintas); detección de incoherencias sin
   decisión automática (nuevos ejemplos de Ecopetrol). Ninguna de estas
   cuatro reglas generó
   cambio de especificación — se registran con el nivel de evidencia más
   alto disponible hasta ahora, sin convertirse en ley universal.
2. **R3 se profundiza, sin cambio de especificación**: Ecopetrol aporta
   cadenas causales adicionales (reposición de reservas→CAPEX→
   agotamiento→horizonte; provisión de abandono→flujo terminal),
   consistentes con las de Terpel. Estado:
   `PATRÓN OBSERVADO EN TRES CASOS + DISEÑO INSUFICIENTEMENTE VALIDADO`
   — **no se rediseña `assumption_relations` en esta actualización**.
3. **R4 (formulación de §21/§22) se mantiene sin cambios** — *"una
   partida o variable material puede necesitar descomposición según la
   dimensión que explique su comportamiento económico"*. Ecopetrol
   aporta evidencia consistente con la dimensión "negocio" ya vista en
   Terpel, y además evidencia de una posible extensión (cifras netas y
   movimientos agregados, no solo partidas) que se registra como
   **Candidato A (neteo)**, sin modificar la formulación vigente de R4
   (ver §5, fila `account_components`).
4. **R5 se profundiza, sin nuevo enum**: `desconocido` puede significar
   tanto "falta el dato" como "tengo el dato pero no sé interpretarlo
   económicamente sin sus componentes" (impairment neto ≈0 de Ecopetrol).
   No se agrega ningún valor nuevo a la clasificación epistémica de §5.1.
5. **`scope` (§5.2) sube de nivel de evidencia**: pasa de "hueco
   conceptual sólido, reforzado por Terpel" a `NECESIDAD CONCEPTUAL
   FUERTEMENTE RESPALDADA POR MÚLTIPLES CASOS` — Ecopetrol muestra que un
   supuesto puede aplicar al grupo consolidado, a un negocio, o a la
   porción atribuible a Ecopetrol después de intereses no controladores
   (NCI). **`purpose` permanece sin cambio de nivel** — evidencia menor
   que `scope`, sin fusionarse con él.
6. **Comparabilidad/perímetro histórico cambia de estado** (§20): de
   `EVIDENCIA INSUFICIENTE PARA DISEÑAR SOLUCIÓN — VALIDAR EN CASOS
   FUTUROS` (Caso 02) a `PROBLEMA DEMOSTRADO; EVIDENCIA INSUFICIENTE
   PARA DISEÑAR UNA SOLUCIÓN GENERAL` (Caso 03) — evidencia directa: ISA
   consolidada al 100% con ≈51,4% de control económico, intereses no
   controladores materiales. **Sigue sin crearse `case_perimeter` ni
   ninguna estructura** — un problema demostrado no es, por sí mismo,
   evidencia suficiente para diseñar una solución general.
7. **Tres candidatos nuevos, registrados explícitamente como candidatos
   — no como R9/R10/R11** (§20): **Candidato A — neteo** ("el neteo puede
   destruir información económica relevante", evidencia: impairment neto
   de Ecopetrol); **Candidato B — ciclo de vida económico** ("algunas
   variables o activos tienen un ciclo de vida económico que importa
   para la valoración", evidencia: provisión de abandono/desmantelamiento
   y patrón reposición-agotamiento de reservas; **no se crea
   `economic_lifecycle`**); **Candidato C — atribución temporal / corte
   de conocimiento** (fecha de valoración, período financiero, fecha
   económica del hecho, fecha de reconocimiento, fecha de caja y fecha
   en que la información se conoció pueden ser distintas entre sí;
   **no se crea `economic_period`**). Los tres requieren más casos y,
   después, criterio experto antes de precisarse.

**Explícitamente no confirmado por este caso** (queda fuera, sin
agregarse a la especificación): ninguna cifra de Ecopetrol (reservas,
reposición, vida media, impairment, saldo FEPC, cobros FEPC, porcentaje
de control de ISA) se incorporó como default, benchmark ni referencia
metodológica de Velarix; ningún negocio o driver de Ecopetrol (E&P,
transporte, refinación, gas/transición, ISA) se declaró requisito
universal para otras empresas; no se decidió el nombre, tipo ni
estructura final de `scope` ni de `purpose`; no se rediseñó
`assumption_relations`; no se creó ninguna estructura para
comparabilidad/perímetro histórico pese al cambio de estado a "problema
demostrado"; no se crearon `economic_period`, `economic_lifecycle`,
`case_perimeter` ni ninguna entidad `contracts` universal; no se declaró
obligatoria ninguna metodología de suma de partes (SOTP), múltiples DCF,
múltiples WACC, múltiples g ni múltiples horizontes. Todo lo anterior
requiere más casos y/o criterio experto antes de precisarse (ver
`docs/velarix/casos/03-ecopetrol/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`).

---

## 24. Refinamientos documentales derivados del Caso 04 (Grupo Éxito) — 2026-08-12

**CASO 04 NO AUTORIZA IMPLEMENTACIÓN.** Ni el Caso 01, ni el Caso 02, ni
el Caso 03, ni el Caso 04, ni ninguno de sus reportes de contraste, ni
esta actualización del Expediente, constituyen autorización para
implementar ninguna estructura técnica (tablas, SQL, migraciones,
schemas, UI, motores, Edge Functions, automatizaciones, persistencia,
coherence engine, decomposition engine, grafo causal, `case_perimeter`,
`contracts`, `economic_period`, `economic_lifecycle`,
`measurement_basis`, o cualquier cambio runtime). Solo Nicolás/fundador
puede autorizar implementación, de forma explícita y separada.

**Estado: especificación conceptual sujeta a validación adicional con
más casos; no autorización de implementación.** Detalle completo del
caso y del contraste:
`docs/velarix/casos/04-grupo-exito/CASO-04-GRUPO-EXITO-V0.md` y
`docs/velarix/casos/04-grupo-exito/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`.
**El Caso 04 queda formalmente cerrado y congelado como caso de
estudio**, tras revisión humana — este cierre no cierra R1–R8, no cierra
la metodología, no congela el Expediente como arquitectura, y no cierra
ninguno de los Candidatos A–E, que siguen siendo candidatos.

El Caso Público 04 (Grupo Éxito, FY2025, con información posterior al
corte de 2026 documentada por separado) fue diseñado explícitamente
**para intentar romper Velarix, no para confirmarlo**. **Cuatro casos
muestran patrones más resistentes; cuatro casos no crean leyes
universales.** El estudio manual de Grupo Éxito aportó evidencia que
reforzó, profundizó, elevó o mantuvo sin cambio lo siguiente, ahora
incorporado en §5, §5.2 y §20:

1. **R1, R2, R4 (formulación base), R7 y R8 pasan a `PATRÓN OBSERVADO EN
   CUATRO CASOS`** — reaparecen de forma transversal e idéntica en
   Tecnoglass, Terpel, Ecopetrol y Grupo Éxito: contabilidad ≠ economía
   (inmobiliario book vs. fair value, supplier financing, perímetro con
   NCI); observado ≠ normalizado ≠ proyectado (NWC, cifra inmobiliaria,
   supplier financing); descomposición según dimensión económica
   relevante (inventarios, ingresos heterogéneos bajo una misma
   etiqueta); drivers específicos por empresa (métricas de retail sin
   precedente en los tres casos previos); detección de incoherencias sin
   decisión automática. Ninguna de estas cinco reglas generó cambio de
   especificación — se registran con el nivel de evidencia más alto
   disponible hasta ahora, sin convertirse en ley universal. **Cautela
   explícita añadida por este caso**: R1 no debe interpretarse como que
   la contabilidad es información inferior a reemplazar — sigue siendo
   evidencia fundamental. R4 no debe interpretarse como que más
   granularidad es automáticamente mejor análisis — la descomposición
   depende de comportamiento económico, materialidad y propósito. R7 no
   debe interpretarse como que un driver específico exige máxima
   granularidad disponible.
2. **R3 se profundiza, sin cambio de especificación**: Grupo Éxito
   aporta evidencia de causalidad inversa y retroalimentación entre
   supuestos, no solo de cadenas más largas. Estado: `PATRÓN OBSERVADO
   EN CUATRO CASOS + DISEÑO INSUFICIENTEMENTE VALIDADO` — **no se
   rediseña `assumption_relations` en esta actualización**.
3. **R5 se profundiza, sin nuevo enum**: supplier financing muestra que
   conocer la cifra, la clasificación contable y el contrato no equivale
   a conocer la interpretación económica correcta para valoración.
4. **`purpose` (§5.2) sube de nivel de evidencia**: pasa de "pregunta
   conceptual abierta, evidencia menor que `scope`" a `NECESIDAD
   CONCEPTUAL RESPALDADA POR MÚLTIPLES CASOS, AÚN MENOS MADURA QUE
   SCOPE` — evidencia: tasas de descuento para impairment, supuestos de
   UGE, y metodologías de fair value inmobiliario, todos determinados
   con un propósito distinto al de una valoración profesional de
   equity. **`scope` se mantiene sin cambio de nivel** — Caso 04 no
   aportó evidencia independiente nueva que lo eleve más allá de lo ya
   alcanzado en el Caso 03. No se fusionan.
5. **Comparabilidad/perímetro histórico cambia de estado** (§20): de
   `PROBLEMA DEMOSTRADO; EVIDENCIA INSUFICIENTE PARA DISEÑAR UNA
   SOLUCIÓN GENERAL` (Caso 03) a `PROBLEMA DEMOSTRADO EN MÚLTIPLES
   ECONOMÍAS; EVIDENCIA TODAVÍA INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN
   GENERAL` (Caso 04) — evidencia directa e independiente: estructuras
   inmobiliarias "Viva" con participación atribuible de 26,01%, negocios
   conjuntos al 50% fuera de consolidación línea por línea, y un cambio
   de perímetro de Argentina que la propia compañía reconoce como
   limitante de comparabilidad (información posterior al corte FY2025,
   1T26/2T26). **Sigue sin crearse `case_perimeter` ni ninguna
   estructura.**
6. **Candidatos A–C actualizados, D y E registrados como nuevos** (§20):
   **Candidato A — neteo**: sin evidencia independiente nueva en este
   caso, se mantiene sin elevar. **Candidato B — ciclo de vida
   económico**: sube a `PATRÓN OBSERVADO EN DOS CASOS DE NATURALEZA
   ECONÓMICA MUY DISTINTA — FORMULACIÓN GENERAL AÚN ABIERTA` (Ecopetrol:
   agotamiento de reservas E&P; Grupo Éxito: ciclo de apertura/
   remodelación/cierre de tiendas). **Candidato C — atribución
   temporal/corte de conocimiento**: sube a `PROBLEMA METODOLÓGICO
   RESPALDADO POR MÚLTIPLES CASOS — REQUIERE DEFINIR PRINCIPIOS ANTES
   DE DISEÑAR REPRESENTACIÓN`. **Candidato D (nuevo) — derechos
   económicos/propiedad dinámica**: la atribución económica puede
   depender de derechos u obligaciones contractuales capaces de
   modificarla (opción de venta sobre NCI de Grupo Disco Uruguay,
   ejercida parcialmente en 2025); `EVIDENCIA FUERTE EN GRUPO ÉXITO —
   VALIDAR EN CASOS FUTUROS`; **no se crea entidad, tabla, campos, ni
   modelo automático de valoración de opciones**. **Candidato E (nuevo)
   — base de medición/régimen monetario**: la base de medición y el
   régimen monetario de una cifra pueden ser necesarios para
   compararla, normalizarla o proyectarla (subsidiaria argentina
   hiperinflacionaria, NIC 29); `EVIDENCIA FUERTE EN GRUPO ÉXITO —
   VALIDAR EN CASOS FUTUROS`; **no se crea `measurement_basis`, enum
   monetario, ni campos**.

**Explícitamente no confirmado por este caso** (queda fuera, sin
agregarse a la especificación): ninguna cifra de Grupo Éxito
(inventarios, proveedores, leases, inmobiliario, CAPEX, participaciones
NCI, cifras de fidelización) se incorporó como default, benchmark ni
referencia metodológica de Velarix; ningún negocio o driver de Grupo
Éxito (formatos de tienda, métricas de retail) se declaró requisito
universal para otras empresas; no se decidió el nombre, tipo ni
estructura final de `scope` ni de `purpose`; no se rediseñó
`assumption_relations`; no se creó ninguna estructura para
comparabilidad/perímetro histórico pese al cambio de estado; no se
crearon `economic_period`, `economic_lifecycle`, `measurement_basis`,
`case_perimeter` ni ninguna entidad `contracts` universal; no se declaró
obligatoria ninguna metodología de suma de partes (SOTP), múltiples DCF,
múltiples WACC, múltiples g ni múltiples horizontes; la información
posterior al corte (1T26, 2T26) no se mezcló con el período base FY2025
ni reescribió retroactivamente el perímetro de consolidación al 31-dic-
2025. Todo lo anterior requiere más casos y/o criterio experto antes de
precisarse (ver
`docs/velarix/casos/04-grupo-exito/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`).

**Conclusión de esta actualización, consistente con
`CASO-04-GRUPO-EXITO-V0.md` §32**: el Expediente V1 sobrevive
conceptualmente al Caso 04, pero todavía no está listo para congelarse
como arquitectura.

---

## 25. Refinamientos documentales derivados del Caso 05 (ISA) — 2026-08-12

**CASO 05 NO AUTORIZA IMPLEMENTACIÓN.** Ni el Caso 01, ni el Caso 02, ni
el Caso 03, ni el Caso 04, ni el Caso 05, ni ninguno de sus reportes de
contraste, ni esta actualización del Expediente, constituyen
autorización para implementar ninguna estructura técnica (tablas, SQL,
migraciones, schemas, UI, motores, Edge Functions, automatizaciones,
persistencia, coherence engine, decomposition engine, grafo causal,
`case_perimeter`, `contracts`, `economic_period`, `economic_lifecycle`,
`measurement_basis`, `availability`, un "options engine", un algoritmo
automático de NCI/JV, o cualquier cambio runtime). Solo Nicolás/fundador
puede autorizar implementación, de forma explícita y separada.

**Estado: especificación conceptual sujeta a validación adicional con
más casos; no autorización de implementación.** Detalle completo del
caso y del contraste:
`docs/velarix/casos/05-isa/CASO-05-ISA-V0.md` y
`docs/velarix/casos/05-isa/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`.
**El Caso 05 — ISA queda FORMALMENTE CERRADO Y CONGELADO como caso de
estudio**, tras revisión humana — este cierre no cierra R1–R8, no cierra
la metodología, no cierra los Bloques 1B ni 1C, no congela el Expediente
como arquitectura, y no cierra ninguno de los Candidatos A–E ni eleva la
observación ISA-F a Candidato F, que siguen abiertos.

El Caso Público 05 (Interconexión Eléctrica S.A. — ISA, FY2025, con
información posterior al corte de 2026 documentada por separado) se usó
como quinta economía **para intentar romper Velarix, no para
confirmarlo**. **Cinco casos muestran patrones más resistentes; cinco
casos no crean leyes universales.** El estudio manual de ISA aportó
evidencia que reforzó, elevó, mantuvo sin cambio, o resultó insuficiente
para lo siguiente, ahora incorporado en §5.2 y §20:

1. **R1, R2, R7 y R8 pasan a `PATRÓN OBSERVADO EN CINCO CASOS`** —
   reaparecen de forma transversal e idéntica en Tecnoglass, Terpel,
   Ecopetrol, Grupo Éxito e ISA: contabilidad ≠ economía (activos
   físicamente similares representados como PPE/intangible/activo
   contractual/activo financiero según su naturaleza económica);
   observado ≠ normalizado ≠ proyectado (ingresos de construcción y
   activos contractuales); drivers específicos por empresa (RAP,
   tráfico, tarifas, garantías, concesión, sin biblioteca universal
   cerrada); detección de incoherencias sin decisión automática. Ninguna
   de estas cuatro reglas generó cambio de especificación — se
   registran con el nivel de evidencia más alto disponible hasta ahora,
   sin convertirse en ley universal. **Cautela añadida por este caso**:
   detectar una aparente contradicción ≠ demostrar que existe una
   contradicción — puede ser necesario comprender antes `scope` y
   `purpose` (R8).
2. **R3, en su núcleo conceptual, también pasa a `PATRÓN OBSERVADO EN
   CINCO CASOS`**, pero el diseño de `assumption_relations` sigue
   `INSUFICIENTEMENTE VALIDADO` — ISA aporta evidencia de relaciones
   temporales, condicionales, regulatorias y reestimables, no solo de
   cadenas más largas o con causalidad inversa. **Cautela explícita**:
   no convertir `assumption_relations` en un grafo causal ingenuo tipo
   A → B. **No se rediseña en esta actualización.**
3. **R4 (formulación de §21/§22) se mantiene sin cambios** — *"una
   partida o variable material puede necesitar descomposición según la
   dimensión que explique su comportamiento económico"* — ahora `PATRÓN
   OBSERVADO EN CINCO CASOS`. ISA aporta las dimensiones negocio, país,
   régimen regulatorio, contrato, concesión y proyecto, y una cautela
   nueva sin convertirla en estructura: *"la descomposición debería
   detenerse cuando una granularidad adicional deja de modificar
   materialmente la interpretación económica necesaria para el
   propósito del análisis"* (ver §5, fila `account_components`).
4. **R5 se profundiza, sin nuevo enum**: ISA aporta ejemplos
   especialmente claros mediante deuda en distintos niveles, leases,
   activos contractuales, efectivo restringido, y estructuras
   societarias.
5. **`purpose` (§5.2) sube nuevamente de nivel de evidencia**: pasa de
   "necesidad conceptual respaldada por múltiples casos, todavía menos
   madura que `scope`" (Caso 04) a **necesidad conceptual fuertemente
   respaldada por múltiples casos, todavía menos madura que `scope`**
   (Caso 05) — evidencia: WACC/tasas regulatorias, tasas usadas en
   mediciones contables, información segmentada de administración, y
   métricas contractuales. **`scope` se mantiene sin cambio de nivel**
   — ISA no aportó evidencia independiente nueva que lo eleve más allá
   de lo ya alcanzado en el Caso 03, aunque sí añade la cautela de que
   un problema de `scope` no obliga a modelar siempre todos los niveles
   posibles. No se fusionan.
6. **Comparabilidad/perímetro histórico cambia de estado** (§20): de
   `PROBLEMA DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA TODAVÍA
   INSUFICIENTE PARA DISEÑAR UNA SOLUCIÓN GENERAL` (Caso 04) a
   `PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA
   SUFICIENTE PARA EXIGIR TRATAMIENTO METODOLÓGICO, TODAVÍA
   INSUFICIENTE PARA DISEÑAR UNA REPRESENTACIÓN GENERAL` (Caso 05) —
   evidencia concentrada dentro de una sola entidad: consolidación sin
   100% económico, NCI material, JVs/asociadas fuera de consolidación
   línea por línea, y diferencias entre control y porcentaje económico.
   **Sigue sin crearse `case_perimeter` ni ninguna estructura** — exigir
   tratamiento metodológico no equivale a una solución de diseño
   disponible.
7. **Candidatos actualizados de forma desigual — resultados positivos y
   negativos** (§20): **Candidato A — neteo**: sin evidencia
   independiente nueva en este caso, se mantiene sin elevar.
   **Candidato B — ciclo de vida económico**: sube a `PATRÓN OBSERVADO
   EN TRES CASOS DE NATURALEZA ECONÓMICA MUY DISTINTA — FORMULACIÓN
   GENERAL AÚN ABIERTA` (Ecopetrol, Grupo Éxito, ISA), con la cautela de
   que el ciclo de un activo/proyecto/contrato no determina
   automáticamente el ciclo de vida de la compañía que lo posee.
   **Candidato C — atribución temporal/corte de conocimiento**:
   reforzado, sin elevar el estado. **Candidato D — derechos
   económicos/propiedad dinámica**: ISA aporta evidencia de que control
   ≠ porcentaje económico, pero no de la parte dinámica/contractual
   específica del candidato — se mantiene sin elevar. **Candidato E —
   base de medición/régimen monetario**: sube a `PATRÓN OBSERVADO EN DOS
   CASOS DE NATURALEZA ECONÓMICA DISTINTA — FORMULACIÓN GENERAL AÚN
   ABIERTA`, con la cautela de que puede estar agrupando fenómenos
   metodológicamente distintos.
8. **Nueva observación registrada — ISA-F, explícitamente NO un
   candidato formal** (§20): "el reconocimiento, titularidad o control
   de un recurso no implica necesariamente que esté económicamente
   disponible para cualquier propósito" (evidencia: efectivo
   restringido). Estado `EVIDENCIA FUERTE EN ISA — VALIDAR ANTES DE
   ELEVAR A CANDIDATO TRANSVERSAL`. **No se crea `availability`, enum,
   campo, schema, ni automatización.**
9. **Resultados negativos explícitos de este caso**: supplier financing
   **no** recibió evidencia suficiente en ISA — la evidencia transversal
   sigue apoyada en Tecnoglass, Terpel y Grupo Éxito, sin cambio de
   estado (`PROBLEMA FUERTEMENTE REFORZADO — CRITERIOS DE
   RECLASIFICACIÓN TODAVÍA ABIERTOS`). Leases se refuerza (segunda
   instancia de doble rol arrendatario/arrendador) sin cambio de estado
   (`PROBLEMA DEMOSTRADO — TRATAMIENTO DE VALORACIÓN NO
   GENERALIZADO`).
10. **Profundización conceptual, sin cambio, de las Decisiones 2 y 4 del
    Bloque 1B** (`docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`):
    la Decisión 2 (estructura de capital observada) añade la cautela de
    que, antes de usar una estructura observada, puede importar
    determinar a qué `scope` pertenece, sin evidencia para concluir
    universalmente que cada proyecto necesita su propio WACC. La
    Decisión 4 (horizonte explícito de 5 años) se refuerza con la
    distinción vida física ≠ vida contractual ≠ horizonte explícito ≠
    vida de la empresa ≠ perpetuidad, y con la pregunta abierta —no
    resuelta aquí— de qué significa "estado estable" para una compañía
    con activos finitos y capacidad de reinversión potencialmente
    continua. **Ninguna de las dos decisiones cambia.**

**Explícitamente no confirmado por este caso** (queda fuera, sin
agregarse a la especificación): ninguna cifra de ISA se incorporó como
default, benchmark ni referencia metodológica de Velarix —de hecho, el
material de trabajo de este caso no incluyó cifras financieras
específicas—; ningún negocio o driver de ISA (transmisión, concesiones
viales, TIC) se declaró requisito universal para otras empresas; no se
decidió el nombre, tipo ni estructura final de `scope` ni de `purpose`;
no se rediseñó `assumption_relations`; no se creó ninguna estructura
para comparabilidad/perímetro histórico pese al cambio de estado; no se
crearon `economic_period`, `economic_lifecycle`, `measurement_basis`,
`availability`, `case_perimeter` ni ninguna entidad `contracts`
universal; no se declaró obligatoria ninguna metodología de suma de
partes (SOTP), múltiples DCF, múltiples WACC, múltiples g ni múltiples
horizontes; no se calculó WACC; no se aprobó horizonte ni g; no se
modificaron las Decisiones 2 ni 4 del Bloque 1B más allá de su
profundización conceptual. Todo lo anterior requiere más casos y/o
criterio experto antes de precisarse (ver
`docs/velarix/casos/05-isa/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`).

**Conclusión de esta actualización, consistente con
`CASO-05-ISA-V0.md` §36**: el Expediente V1 sobrevive conceptualmente al
Caso 05, pero todavía no está listo para congelarse como arquitectura.
**El Caso 05 queda formalmente cerrado y congelado como caso de
estudio**, tras revisión humana del fundador — este cierre no cierra
R1–R8, no cierra la metodología, no cierra los Bloques 1B ni 1C, no
congela el Expediente como arquitectura, y no cierra ninguno de los
Candidatos A–E ni la observación ISA-F, que permanecen abiertos.

---

## 26. Refinamientos documentales derivados del Caso 06 (Grupo Cibest / Bancolombia) — 2026-08-12

**CASO 06 NO AUTORIZA IMPLEMENTACIÓN.** Ni el Caso 01, ni el Caso 02, ni
el Caso 03, ni el Caso 04, ni el Caso 05, ni el Caso 06, ni ninguno de
sus reportes de contraste, ni esta actualización del Expediente,
constituyen autorización para implementar ninguna estructura técnica
(tablas, SQL, migraciones, schemas, UI, motores, Edge Functions,
automatizaciones, persistencia, coherence engine, decomposition engine,
grafo causal, `case_perimeter`, `contracts`, `economic_period`,
`economic_lifecycle`, `measurement_basis`, `availability`,
`regulatory_capital`, `capital_bridge`, `distributable_capital`,
`valuation_method`, un "bank mode", un enum de institución financiera, o
cualquier cambio runtime). Solo Nicolás/fundador puede autorizar
implementación, de forma explícita y separada.

**Estado: especificación conceptual sujeta a validación adicional con
más casos; no autorización de implementación.** Detalle completo del
caso y del contraste:
`docs/velarix/casos/06-bancolombia/CASO-06-BANCOLOMBIA-V0.md` y
`docs/velarix/casos/06-bancolombia/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`.
**El Caso 06 queda FORMALMENTE CERRADO Y CONGELADO como caso de
estudio**, tras revisión y autorización explícita de Nicolás/fundador —
este cierre no cierra R1–R8, no cierra la metodología, no cierra los
Bloques 1B ni 1C, no congela el Expediente como arquitectura, y no
cierra ninguno de los Candidatos A–E ni las observaciones ISA-F y
Bancolombia-G, que siguen abiertos.

El Caso Público 06 (Grupo Cibest/Bancolombia S.A., FY2025, con
información posterior al corte de 2026 documentada por separado) se usó
como sexta economía — la primera institución financiera regulada de la
secuencia — **para intentar romper Velarix, no para confirmarlo**.
**Seis casos muestran patrones más resistentes; seis casos no crean
leyes universales.** El estudio manual de Bancolombia aportó evidencia
que reforzó, elevó, tensionó, mantuvo sin cambio, o resultó insuficiente
para lo siguiente, ahora incorporado en §5.2 y §20:

1. **R1, R2, R4 (formulación base), R7 y R8 pasan a `PATRÓN OBSERVADO EN
   SEIS CASOS`** — reaparecen de forma transversal e idéntica en
   Tecnoglass, Terpel, Ecopetrol, Grupo Éxito, ISA y Bancolombia:
   contabilidad ≠ economía (depósitos, intereses, liquidez, instrumentos
   financieros y capital con clasificación contable correcta que no
   determina, por sí sola, su interpretación para valoración); observado
   ≠ normalizado ≠ proyectado (provisiones/ECL, Banistmo); descomposición
   según dimensión económica relevante (producto, cartera, fondeo,
   riesgo, función económica, moneda, geografía, entidad, regulación);
   drivers específicos por empresa (NIM, costo de depósitos, yield de
   cartera, RWA, entre otros, sin biblioteca universal cerrada);
   detección de incoherencias sin decisión automática. Ninguna de estas
   cinco reglas generó cambio de especificación.
2. **R3, en su núcleo conceptual, también pasa a `PATRÓN OBSERVADO EN
   SEIS CASOS`**, pero el diseño de `assumption_relations` sigue
   insuficientemente validado — Bancolombia aporta evidencia de
   relaciones temporales, condicionales, regulatorias, macroeconómicas y
   bidireccionales o no lineales propias del balance bancario. **No se
   rediseña en esta actualización.**
3. **R5 se profundiza, sin nuevo enum**: Bancolombia aporta múltiples
   instancias de "conozco la cifra, pero todavía no sé cómo
   interpretarla económicamente para este propósito" (provisiones,
   cash/liquidez, capital).
4. **`scope` y `purpose` (§5.2) reciben refuerzo muy fuerte, sin subir de
   nivel formal**: Bancolombia hace especialmente material distinguir
   holding, banco operativo regulado, subsidiaria, grupo consolidado,
   unidad regulatoria, e interés económico final del accionista
   (`scope`); y aporta ejemplos adicionales de propósito — instrumento
   mantenido para cobrar, negociar, cubrir riesgos, administrar
   liquidez, soportar necesidades regulatorias (`purpose`). **No se
   concluye que `purpose` alcance la misma madurez que `scope`. No se
   fusionan. No se crean campos ni enums.**
5. **Comparabilidad/perímetro histórico cambia de estado** (§20): de
   `PROBLEMA FUERTEMENTE DEMOSTRADO EN MÚLTIPLES ECONOMÍAS; EVIDENCIA
   SUFICIENTE PARA EXIGIR TRATAMIENTO METODOLÓGICO, TODAVÍA INSUFICIENTE
   PARA DISEÑAR UNA REPRESENTACIÓN GENERAL` (Caso 05) a la misma
   formulación **ahora incluyendo una institución financiera** — la
   primera vez que el problema se demuestra en un banco regulado
   (holding distinto del banco operativo, reorganización societaria de
   2025, Banistmo). **Sigue sin crearse `case_perimeter` ni ninguna
   estructura.**
6. **Candidatos actualizados de forma desigual — resultados positivos,
   negativos y una tensión** (§20): **Candidato A — neteo**: sin
   evidencia nueva, se mantiene sin elevar. **Candidato B — ciclo de
   vida económico**: sube a cuatro casos de naturaleza económica muy
   distinta (Ecopetrol, Grupo Éxito, ISA, Bancolombia), con evidencia
   más débil que en los tres anteriores. **Candidato C — atribución
   temporal/corte de conocimiento**: sube a "fuertemente respaldado"
   (reorganización societaria 2025, Banistmo). **Candidato D — derechos
   económicos/propiedad dinámica**: sin evidencia nueva en dos casos
   consecutivos (ISA, Bancolombia), se mantiene sin elevar. **Candidato
   E — base de medición/régimen monetario**: recibe evidencia adicional
   fuerte, pero la formulación general se vuelve **menos estable** —
   Bancolombia refuerza que "base de medición" (costo amortizado, FVOCI,
   FVTPL, ECL) y "régimen monetario/moneda" (moneda funcional, FX)
   pueden ser fenómenos relacionados pero metodológicamente distintos.
   **No se divide todavía en E1/E2.**
7. **Observación ISA-F sube de nivel**: de `EVIDENCIA FUERTE EN ISA —
   VALIDAR ANTES DE ELEVAR A CANDIDATO TRANSVERSAL` a `OBSERVACIÓN
   TRANSVERSAL FUERTEMENTE REFORZADA EN DOS ECONOMÍAS RADICALMENTE
   DISTINTAS — ISA Y BANCOLOMBIA — MANTENER ABIERTA PARA VALIDACIÓN EN
   CASOS 07–08 ANTES DE DECIDIR SU ELEVACIÓN` (evidencia: cash contable ≠
   automáticamente cash disponible para net debt o distribución).
   **Sigue sin convertirse en Candidato F.**
8. **Nueva observación registrada — Bancolombia-G, explícitamente NO un
   candidato formal** (§20): puente de capital/capacidad de distribución
   entre banco operativo y holding. Estado `EVIDENCIA FUERTE EN
   BANCOLOMBIA — OBSERVACIÓN SECTORIAL; VALIDAR ANTES DE ELEVAR A
   CANDIDATO TRANSVERSAL`. **No se llama "Candidato G". No se fusiona
   con ISA-F. No se crean campos, tablas, ni reglas automáticas.**
9. **Resultados negativos explícitos de este caso**: supplier financing
   resultó irrelevante para Bancolombia como empresa valorada, sin
   cambio de estado (`PROBLEMA FUERTEMENTE REFORZADO — CRITERIOS DE
   RECLASIFICACIÓN TODAVÍA ABIERTOS`, apoyado en Tecnoglass, Terpel y
   Grupo Éxito). Leases se refuerza (Bancolombia aporta otra instancia
   explícita de doble rol lessee/lessor, después de ISA) sin cambio de
   estado (`PROBLEMA DEMOSTRADO — TRATAMIENTO DE VALORACIÓN NO
   GENERALIZADO`).
10. **Tensión metodológica documentada, sin resolver, sin cambiar
    decisiones aprobadas**: Bancolombia aporta evidencia suficiente para
    rechazar como obligación universal la secuencia `FCFF → WACC →
    CAPEX → NWC → Enterprise Value → net debt → Equity Value`, y para
    distinguir conceptualmente la **arquitectura universal del proceso
    de valoración** (evidencia → contexto → interpretación → estado de
    conocimiento → preguntas → normalizaciones → hipótesis/supuestos →
    selección/justificación metodológica → aprobación experta → cálculo
    → conclusión profesional) de la **arquitectura financiera específica
    del método y de la economía valorada** — ver §20. **Ninguna
    Decisión aprobada del Bloque 1B cambia** (Decisión 1 — supuestos de
    WACC; Decisión 2 — estructura de capital observada; Decisión 4 —
    horizonte explícito de 5 años). **No se calculó WACC, Cost of
    Equity, g, FCFF, FCFE, ni ninguna valoración.**

**Explícitamente no confirmado por este caso** (queda fuera, sin
agregarse a la especificación): ninguna cifra de Bancolombia se
incorporó como default, benchmark ni referencia metodológica de
Velarix; ningún negocio, driver, ni método de valoración específico de
Bancolombia se declaró requisito universal para otras empresas o
bancos; no se decidió el nombre, tipo ni estructura final de `scope` ni
de `purpose`; no se rediseñó `assumption_relations`; no se creó ninguna
estructura para comparabilidad/perímetro histórico pese al cambio de
estado; no se crearon `economic_period`, `economic_lifecycle`,
`measurement_basis`, `availability`, `case_perimeter`,
`regulatory_capital`, `capital_bridge`, `distributable_capital`,
`valuation_method`, ni ninguna entidad `contracts`/`bank_mode`/enum de
institución financiera; no se declaró obligatoria ninguna metodología
de valoración (Residual Income, FCFE, DDM, SOTP, ni la secuencia
FCFF/WACC/CAPEX/NWC/EV/net debt/Equity Value); no se seleccionó método
final de valoración para Bancolombia; no se eleva la observación ISA-F a
Candidato F; no se crea "Candidato G" para Bancolombia-G; no se divide el
Candidato E; no se cerraron los Bloques 1B ni 1C; no se modificó ninguna
Decisión financiera aprobada del Bloque 1B. Todo lo anterior requiere
más casos y/o criterio experto antes de precisarse (ver
`docs/velarix/casos/06-bancolombia/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`).

**Conclusión de esta actualización, consistente con
`CASO-06-BANCOLOMBIA-V0.md` §37**: el Expediente V1 sobrevive
conceptualmente al Caso 06 — refuerza especialmente su capa universal de
proceso frente a la arquitectura financiera específica del método y de
la economía valorada — pero todavía no está listo para congelarse como
arquitectura. **El Caso 06 queda FORMALMENTE CERRADO Y CONGELADO como
caso de estudio**, tras revisión y autorización explícita de Nicolás —
este cierre no cierra R1–R8 como leyes universales, no cierra la
metodología, no cierra los Bloques 1B ni 1C, no congela el Expediente
como arquitectura, no cierra ninguno de los Candidatos A–E ni las
observaciones ISA-F y Bancolombia-G, y no selecciona método de
valoración final. Los Casos 07 (Goldman Sachs) y 08 (Munich Re) están
autorizados, pero no se inician en esta actualización — ambos deben
todavía intentar romper las conclusiones de este caso.
