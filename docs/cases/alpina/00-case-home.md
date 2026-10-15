---
type: valuation-case
company: Alpina Productos Alimenticios S.A.S. BIC
status: in-progress
valuation_date: 2024-12-31
currency: COP (miles)
basis_of_value: Market Value (IVS 102)
architecture: PARENT_DCF_PLUS_SOTP (código cubre solo el parent DCF standalone)
tags: [velarix, case, alpina]
---

# Alpina — case home

Mapa: [[04-CASES]] · Decisión del caso: [[ADR-004-alpina-base-de-valoracion]] · Código: [[caso-alpina]] · Metodología: [[04-VALUATION-METHODOLOGY-V5]] §19

Caso activo y **único caso completo** de Velarix v5. Este MOC **no duplica datos**: enlaza a donde viven.

## Status

| Campo | Valor | Fuente |
|---|---|---|
| Sujeto | 100% del economic equity | `alpina-2024.resolved-assumptions.ts` (cabecera) |
| Fecha de valoración | 2024-12-31 (= cierre del período base FY2024, sin stub period) | ídem |
| Basis of value | Market Value (IVS 102) | ídem, [[ADR-004-alpina-base-de-valoracion]] |
| Moneda / unidad | COP miles | `alpina-2024.structured-input.ts` |
| Supuestos resueltos | ✅ 13/13 (`ALPINA_2024_RESOLVED_ASSUMPTIONS`) | commit `325f71c` |
| Primera ejecución canónica | ✅ congelada en test (motor puro) | `alpina-2024.canonical-execution.test.ts`, commit `0df086c` |
| Caso operativo en Supabase | ✅ materializado 2026-10-15 (`analyses` `ca6de328-…`, owner) desde los fixtures, commit `18f34a0` | `npm run materialize:alpina` · `scripts/alpina/materialization-plan.ts` |
| Ejecución por `ejecutar-calculo` (flujo oficial) | ✅ 2026-10-15: `calculo_completo`, `resolved_case_input`, fingerprint `db5429ad178da7f5`. EV 1,668,259,651.21 · Equity (standalone, antes de SOTP) 920,678,902.21 · WACC 10.5542%. **Verificado contra el resultado congelado:** 530 exactos, 10 equivalentes en punto flotante (1 ULP, Deno vs. Node, rel ≤ 1.82e-16), 0 diferencias reales (evento `official_calculation_verified`, commit `c020cca`). El evento `official_calculation_mismatch` previo (comparación con tolerancia cero) se conserva en el historial | `npm run materialize:alpina -- --calculate` |
| Historial del flujo oficial | El primer intento (2026-10-15) pasó el checkpoint pero cayó en el preflight **legacy**: la función remota (v13) era la del commit `5750fcf`, anterior al v5 y sin la detección de `resolved_assumptions` (3C.6). Se re-desplegó `ejecutar-calculo` desde `5a36ef2` → **v14**, idéntica al repo. Falta relanzar | `npm run materialize:alpina -- --calculate` |

**Siguiente bloqueo:** completar el challenge (suite P-12) y responder C-05, C-06, C-09 y C-12. El cálculo oficial ya está persistido y verificado. Hoy, además, la evidencia de las fases 4B–4F no está versionada en el repo (ver Evidence).

## Evidence

- Evidence FY2024 standalone (ingresos, EBITDA, EBIT, caja, deuda bancaria, leases, equity): `supabase/functions/_shared/alpina-2024.structured-input.ts`. **EVIDENCE**
- Estados financieros separados FY2024 y notas revisadas en 4B.1: **artefacto histórico no versionado** según los propios archivos. > Pendiente: ubicar y enlazar aquí (candidato: `docs/cases/alpina/evidence/`).

## Supabase (caso operativo)

Materializado con `npm run materialize:alpina -- --apply`, en una sola dirección: fixtures del repo → Supabase. Los fixtures nunca se modifican. Es idempotente: si se repite, no escribe nada, y aborta ante duplicados o cualquier divergencia.

| Capa | Dónde quedó | Origen |
|---|---|---|
| REPO_CANONICAL_EVIDENCE | `structured_inputs.input_payload` (income statement / balance sheet FY2024) | `alpina-2024.structured-input.ts` (copia exacta) |
| JUDGMENT | `structured_inputs.input_payload.resolved_assumptions` (13/13) | `alpina-2024.resolved-assumptions.ts` |
| JUDGMENT (Expediente) | 2 `account_notes` (`financial_debt_total`, `da`) y 12 `expedient_questions` C-01…C-12: 8 respondidas, transcritas con el prefijo `[REPO_CANONICAL_JUDGMENT]` y su archivo fuente; **C-05, C-06, C-09, C-12 abiertas** (el repo no las responde) | `alpina-2024.*`, [[03-methodology-decisions-v5]] Capa B |
| SUPABASE_DOCUMENT_EVIDENCE | **Ninguna**: no se subieron documentos ni se simuló el pipeline documental | — |
| CALCULATION | **Pendiente**: solo por `ejecutar-calculo`, nunca copiado del test | — |

**Metadata estructurado** (columnas de `analyses`, migración `20261015180000`; rellenado el 2026-10-15 solo desde fuentes documentadas):

| Campo | Valor | Fuente |
|---|---|---|
| `valuation_date` | 2024-12-31 | ADR-004 |
| `base_period` | FY2024 (cierre 2024-12-31) | ADR-004 / fixtures |
| `basis_of_value` | Market Value (IVS 102) | ADR-004 |
| `valued_interest` | 100% del economic equity, standalone parent (antes de SOTP) | ADR-004 |
| `calculation_architecture` | PARENT_DCF_PLUS_SOTP (en código solo el standalone parent DCF) | ADR-004 |
| `business_profile` | Resumen, geografías, drivers y riesgos, cada uno con su fuente. **Segmentos vacíos** (no documentados) | `scripts/alpina/materialization-plan.ts` |

**Provenance:** case source = `VERIFIED · REPO_CANONICAL`. Document provenance y account homologation lineage = `MISSING`: no hubo ingesta documental. Es una limitación de trazabilidad, no de validez: el cálculo está verificado oficialmente.

Las filas del Expediente son inmutables desde la app (RLS solo permite INSERT).

## Company Understanding

> Pendiente de documentar aquí en extenso: modelo de negocio y **segmentos**. Mientras tanto, el workbench → Business muestra solo el resumen operativo sustentado en el repo (geografías, drivers y riesgos ya documentados en los fixtures y en [[ADR-004-alpina-base-de-valoracion]]). Este MOC sigue siendo la fuente narrativa canónica.

## Questions

Las decisiones case-specific C-01…C-12 están en [[04-VALUATION-METHODOLOGY-V5]] §19 y [[03-methodology-decisions-v5]] (Capa B).

- **C-11, wording corregido (2026-10-15):** la pregunta decía "el CRP de 2.85%", un snapshot fechado de ene-2026. Ahora dice "el CRP vigente aplicado al caso" (el vigente es 2.541%). La versión anterior se conserva en Supabase como *superseded* (`supersedes_question_id` + audit event `expedient_question_superseded`). El Judgment (λ = 1, R-01) no cambia.
- **Cross-check g/ROC terminal (antes C-07.1):** resuelto como validación **determinística**, no como Judgment. Es el **TERMINAL REINVESTMENT CHECK** (workbench → Challenge; audit event `terminal_reinvestment_check`), calculado sobre el cálculo persistido:
  - Y5: Net Reinvestment = CAPEX 119,695,825 − D&A 102,168,929.29 + ΔNWC 1,821,877 = 19,348,772.71.
  - Net Reinvestment / NOPAT 154,790,063.51 = **0.1250001**, frente a g/ROC = 3%/24% = 0.125. La banda documentada (ROC 23.5–24.5%) es 0.1224–0.1277. ROC implícito: 23.99998%. **PASS**.
  - La fila C-07.1 se conserva como historial, reclasificada `CALCULATION_VALIDATION` (`expedient_question_reclassified`).
  - La transcripción de C-07 tiene una nueva versión sin la frase "pendiente"; la anterior queda como superseded. El rationale congelado del fixture no cambia.
  - C-04 ("g verificado contra Net Reinvestment/NOPAT ≈ g/ROC") y C-07 quedan consistentes.
- Siguen abiertas: C-05, C-06, C-09 y C-12.

## Normalizations

> Pendiente de documentar: ajustes de EBITDA aplicados (P-08). Convención de leases: `CAPITALIZED_LEASES`.

## Assumptions

Los 13 supuestos resueltos (valor, fuente, rationale) viven en `alpina-2024.resolved-assumptions.ts`. Una vez ejecutado por el flujo oficial, también se ven en el workbench → Judgment. Growth: 3.0% plano a 5 años (parámetro del motor, no uno de los 13). **JUDGMENT**

## Forecast · Valuation · Sensitivities

Resultado del motor sobre el input real (**CALCULATION**): `alpina-2024.canonical-execution.test.ts`. Correcciones del 2026-09-07: sensibilidad con drivers v5 (`7e52dfc`), escenarios con overlays de g (`50f2d08`) y KPIs desde evidencia observada (`c52f901`). Suite P-12 completa: pendiente.

## Conclusion

> Pendiente: no hay conclusión hasta ejecutar por el flujo oficial y completar el challenge.

## Limitations

- SOTP fuera del código (análisis separado).
- Horizonte fijo de 5 años y convención de fin de año. Ver [[12-bugs]] LIM-01.
- Evidence fuente no versionada (ver arriba).

## Audit Trail

> Pendiente: fingerprint y versión del cálculo oficial (workbench → Audit trail).

## Open Items

- [x] Materializar Alpina en Supabase (2026-10-15, `npm run materialize:alpina`).
- [x] Ejecutar `ejecutar-calculo` y verificarlo contra el congelado (0 diferencias reales; tolerancia de máquina 4·ε).
- [ ] Responder C-05 (normalizaciones), C-06 (supplier finance), C-09 (DLOM/size premium) y C-12 (drivers de forecast).
- [x] Cross-check g/ROC terminal: TERMINAL REINVESTMENT CHECK = PASS (0.1250001 vs 0.125).
- [ ] Documentar los segmentos de Alpina (Company Understanding).
- [ ] Versionar o enlazar la evidencia 4B–4F.
- [ ] Documentar Company Understanding y Normalizations aquí.
- [ ] Completar la suite mínima de sensibilidades P-12.
- [ ] Definir el alcance del SOTP.
