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
| `account_notes` | Interpretación de una cuenta material (N por expediente) |
| `expedient_questions` | Preguntas generadas, vinculables a cuenta/documento/normalización/supuesto |
| `expedient_answers` | Respuestas a una pregunta, con evidencia asociada |
| `evidence_links` | Trazabilidad entre una decisión y su fuente (documento, página, respuesta, nota, fuente externa) |
| `normalizations` | Ajustes propuestos/aprobados sobre un valor reportado, con historial completo |
| `projection_hypotheses` | Hipótesis de proyección con driver, razonamiento, fórmula, responsable |
| `case_assumptions` | Supuestos financieros del caso específico (puede referenciar `CANONICAL_METHODOLOGY` como punto de partida, sin heredar su valor automáticamente) |
| `expedient_approvals` | Registro de aprobaciones (quién, qué, cuándo, sobre qué versión) |

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
