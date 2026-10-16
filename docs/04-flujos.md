---
tipo: flujos
actualizado: 2026-10-16
tags: [velarix, flujos, system]
---

# Flujos

Volver a [[00-home]] · Relacionado: [[06-api]], [[05-base-de-datos]]

## 1. Pipeline de Evidence

> **Evidence ≠ Judgment ≠ Calculation.** El pipeline automático solo procesa **Evidence**:
>
> **CREATE CASE → UPLOAD → PARSE → MAP ACCOUNTS → VALIDATE → STOP**
>
> `build-structured-input` y `ejecutar-calculo` **ya no forman parte** del pipeline automático. El input del motor necesita Judgment (los 13 `resolved_assumptions` y el crecimiento esperado), que todavía no existe al terminar la Evidence. El cálculo es un paso posterior y explícito (§2).

Orquestado por `supabase/functions/run-analysis-pipeline/index.ts`. El frontend lo dispara con el botón **«Procesar Evidence»** de `src/components/dashboard/DocumentUpload.tsx` (Workbench → Nuevo caso, o Workbench → Evidence → Cargar).

```mermaid
sequenceDiagram
  actor U as Usuario
  participant FE as Workbench
  participant UP as upload-document
  participant PL as run-analysis-pipeline
  participant PD as parse-document
  participant MA as map-accounts
  participant VA as validate-analysis
  U->>FE: crea el caso (NewAnalysisStepper)<br/>expected_growth = null · metadata vacía = null
  FE->>UP: sube archivo (PDF/Excel/CSV)
  FE->>PL: «Procesar Evidence»
  Note over PL: caso con calculation_result → 409 CASE_ALREADY_CALCULATED
  PL->>PD: status = parsing_en_curso
  PL->>MA: status = homologacion_en_curso
  Note over PL,MA: pipeline-guards: aborta si la homologación falla o tiene bloqueos
  PL->>VA: validación (fija el estado final)
  alt validación bloqueada
    PL-->>FE: status = validacion_bloqueada (+ notificación)
  else aprobada / con advertencias
    PL-->>FE: STOP · status = validacion_aprobada | validacion_con_advertencias<br/>audit event evidence_pipeline_complete
  end
  FE->>U: abre el caso (Accounts)
```

- **Estado final:** el que deja `validate-analysis`. No hay un estado nuevo; el pipeline no escribe `calculo_en_curso` ni `informe_generado`, ni `analyses.input_payload`.
- **Eventos:** se registra `evidence_pipeline_complete`. Los `pipeline_complete` históricos se conservan tal cual.
- **Casos ya calculados:** si `analyses.calculation_result` existe, ningún endpoint de reprocesamiento de Evidence (`run-analysis-pipeline`, `parse-document`, `map-accounts`, `validate-analysis`) modifica el caso. Responden 409 `CASE_ALREADY_CALCULATED` y su única escritura es el audit event `evidence_reprocessing_rejected`. El motivo es la limitación LIM-05 (`EVIDENCE_REPROCESSING_VERSIONING_PENDING`, [[12-bugs]]).
- **Excepción, `upload-document`:** puede adjuntar un documento a un caso calculado. No cambia su estado ni su `calculation_result`, y el documento queda marcado fuera del cálculo oficial existente (`excluded_from_calculation`).
- **Lógica pura:** `supabase/functions/_shared/evidence-pipeline-guards.ts`, compartida por las cinco funciones y probada contra el código real de los `index.ts` (`evidence-*.edge.test.ts`, `upload-document.edge.test.ts`).

Estados posibles (`analysis_status`): `creado`, `documentos_cargados`, `parsing_en_curso`, `parsing_completado`, `homologacion_en_curso`, `validacion_aprobada`, `validacion_con_advertencias`, `validacion_bloqueada`, `revision_manual_requerida`, `calculo_en_curso`, `calculo_completo`, `interpretacion_en_curso`, `informe_generado`, `error_tecnico`. El progreso visible se mapea en `src/hooks/useAnalysisProgress.ts`.

## 2. Cálculo (`ejecutar-calculo`)

Paso **explícito**, separado de la Evidence: no lo dispara el pipeline. Hoy se invoca directamente (Alpina: `npm run materialize:alpina -- --calculate`). El Workbench todavía no tiene un botón de cálculo ni un editor de Judgment.

```mermaid
flowchart TB
  A[Request] --> B{Autorización<br/>authorization.ts}
  B -- no --> X1[401/403]
  B -- sí --> C{Minimum Expediente<br/>Checkpoint}
  C -- falla --> X2[409 + audit_event]
  C -- pasa --> D{Preflight<br/>13 resolved_assumptions}
  D -- falla --> X3[409 + calculation_preflight_failed]
  D -- pasa --> E[runCanonicalFinancialEngine]
  E --> F[Envelope: fingerprint, versión, provenance,<br/>source_input_snapshot, resolved_assumptions_used]
  F --> G[(analyses.calculation_result)]
```

Ver [[supuestos-y-preflight]], [[expediente]], [[motor-canonico]], [[reproducibilidad]].

## 3. Revisión manual

1. Se crea una revisión (`crearRevisionManual` en `src/lib/manual-review-api.ts`) → `analyses.status = revision_manual_requerida`. `generate-narrative` también puede dejar ese estado si su auditoría interna no pasa.
2. Un `analyst`/`admin` la toma, corrige cuentas, y aprueba o bloquea (Workbench → Review Center; detalle en `/workbench/reviews/:id`).
3. Al aprobar, se invoca `continuar-tras-revision`, que reconstruye el `structured_input` y deja el análisis en `validacion_aprobada`.

Ver [[revision-manual]] y [[07-autenticacion]].

## 4. Narrativa y PDF

- `generate-narrative` produce el texto a partir del `calculation_result` canónico (vía `narrative-calculation-adapter.ts`). No se encontró ningún componente del frontend que la invoque (solo existe `generateNarrative` en `api-client.ts`). > Pendiente de confirmar cómo se dispara hoy.
- El PDF se genera en el navegador con `pdf-generator.ts`, alimentado por `pdf-canonical-mapper.ts` (ligado al snapshot canónico, commit `5750fcf`).

## 5. Flujo metodológico del Expediente (v5.0)

Este es el flujo **conceptual** definido en la metodología; solo una parte está en código.

```mermaid
flowchart LR
  docs[Documentos] --> emp[Entender empresa] --> ctas[Entender cuentas] --> amb[Ambigüedades] --> preg[Preguntas] --> evi[Evidencia]
  evi --> norm[Normalización] --> hip[Hipótesis] --> met[Método] --> sup[Supuestos] --> calc[Cálculo] --> con[Contraste] --> concl[Conclusión]
```

En código existe: el checkpoint mínimo (contexto, ≥1 cuenta material, ≥1 ambigüedad, ≥1 tratamiento humano) y el contrato de supuestos resueltos. El resto está especificado en [[EXPEDIENTE-DE-VALORACION-V1]].

## 6. Caso Alpina (ruta usada hasta ahora)

`alpina-2024.structured-input.ts` + `alpina-2024.resolved-assumptions.ts` → `evaluateCalculationPreflight` → `runCanonicalFinancialEngine` dentro de Vitest (`alpina-2024.canonical-execution.test.ts`). La ruta oficial exigida por [[05-financial-engine-audit]] §1 es a través de `ejecutar-calculo`. Ver [[caso-alpina]].
