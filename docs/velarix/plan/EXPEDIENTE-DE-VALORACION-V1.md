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
| `account_components` | **Nueva, confirmada por Caso 01, refinada por Caso 02 (§21, §22)**: descomposición económica opcional de una partida o variable material cuando su comportamiento económico no puede explicarse como una sola cifra. La dimensión de descomposición **no se limita a subcuentas contables** (ej. Cost of Sales → materiales/labor/energía/logística en Tecnoglass) — puede ser también de negocio, de producto, de canal, de geografía o de contrato (ej. EDS/Industria/Aviación & Marinos/Lubricantes/Servicios Complementarios en Terpel). N por `account_notes`, cada componente con su propio driver, participación estimada, fuente y estado epistémico (§5.1) |
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

## 5.2 Necesidades conceptuales abiertas sobre un supuesto: alcance y propósito (confirmado por Caso 02 — §22)

`docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md` §11 mostró que, en
una organización con múltiples negocios, países o contratos, un mismo
supuesto puede no significar lo mismo en toda la empresa, y que una
cifra puede haber sido determinada originalmente para un propósito
distinto al de una valoración Velarix. Esto deja registradas dos
necesidades conceptuales sobre `case_assumptions` (y potencialmente
`projection_hypotheses`), **sin implementarlas ni diseñar su tipo,
enum o estructura todavía**:

- **Alcance** (nombre tentativo `scope`): ¿a qué aplica exactamente este
  supuesto? — por ejemplo empresa completa, filial, país, segmento, UGE,
  producto o contrato. Evidencia relativamente fuerte (Caso 02).
- **Propósito** (nombre tentativo `purpose`): ¿para qué fue originalmente
  determinado o utilizado este supuesto? — por ejemplo prueba de
  deterioro, presupuesto, planificación, covenant, valoración previa, o
  presentación gerencial. Evidencia más débil que la de `scope` (Caso
  02), pero justificada.

Ninguno de los dos nombres, tipos ni estructuras finales queda decidido
por esta actualización — ver `docs/velarix/casos/02-terpel/REPORTE-CONTRASTE-EXPEDIENTE-V1.md`
§2 (cambios #2 y #3).

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
  cambios de consolidación) — Caso 02 (§12, §22) registra esta necesidad
  con evidencia insuficiente para diseñar solución; no se crea
  `case_perimeter` ni ninguna tabla o schema.

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
