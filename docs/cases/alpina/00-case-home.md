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
| Ejecución por `ejecutar-calculo` (flujo oficial) | ❓ pendiente de confirmar | [[11-pendientes]] |

**Siguiente bloqueo:** confirmar o ejecutar Alpina por el flujo oficial (checkpoint del Expediente + preflight). Hoy, además, la evidencia de las fases 4B–4F no está versionada en el repo (ver Evidence).

## Evidence

- Evidence FY2024 standalone (ingresos, EBITDA, EBIT, caja, deuda bancaria, leases, equity): `supabase/functions/_shared/alpina-2024.structured-input.ts`. **EVIDENCE**
- Estados financieros separados FY2024 y notas revisadas en 4B.1: **artefacto histórico no versionado** según los propios archivos. > Pendiente: ubicar y enlazar aquí (candidato: `docs/cases/alpina/evidence/`).

## Company Understanding

> Pendiente de documentar aquí: modelo de negocio, segmentos, geografía, drivers y riesgos. El razonamiento de por qué Alpina es un caso DCF corporativo limpio está en [[ADR-004-alpina-base-de-valoracion]].

## Questions

Las decisiones case-specific C-01…C-12 están en [[04-VALUATION-METHODOLOGY-V5]] §19 y [[03-methodology-decisions-v5]] (Capa B).

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

- [ ] Ejecutar o confirmar Alpina por `ejecutar-calculo`.
- [ ] Versionar o enlazar la evidencia 4B–4F.
- [ ] Documentar Company Understanding y Normalizations aquí.
- [ ] Completar la suite mínima de sensibilidades P-12.
- [ ] Definir el alcance del SOTP.
