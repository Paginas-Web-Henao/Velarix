---
tipo: modulo
capa: caso
estado_v5: EN CURSO
actualizado: 2026-10-15
tags: [velarix, modulo, alpina, caso]
---

# Caso Alpina

Índice: [[03-modulos]] · Decisión: [[ADR-004-alpina-base-de-valoracion]] · Roadmap: [[10-roadmap]]

Cadena del caso: metodología [[04-VALUATION-METHODOLOGY-V5]] (§19, decisiones C-01…C-12) → Evidence y gate [[expediente]] → Judgment [[supuestos-y-preflight]] → Calculation [[motor-canonico]] → trazabilidad [[reproducibilidad]]. Tests: [[13-testing]].

## Qué es
El **único caso completo** de v5.0: Alpina Productos Alimenticios S.A.S. BIC.

## Definición del caso (de `alpina-2024.resolved-assumptions.ts`)
- Sujeto: 100% del economic equity.
- Basis of value: **Market Value** (IVS 102).
- Fecha de valoración: **2024-12-31** (coincide con el cierre del período base FY2024 standalone).
- Arquitectura: `PARENT_DCF_PLUS_SOTP`; el código cubre solo el **standalone parent operating DCF**. El SOTP es análisis separado.
- `expected_growth` 3.0% plano, 5 años (parámetro del motor, no uno de los 13 supuestos).
- Convención de leases: `CAPITALIZED_LEASES`.
- Unidades: COP miles. Sector usado: `"Alimentos y bebidas"` (solo informativo en la rama v5).

## Archivos (`supabase/functions/_shared/`)
- `alpina-2024.structured-input.ts` — Evidence FY2024 (`ALPINA_2024_STRUCTURED_INPUT`).
- `alpina-2024.resolved-assumptions.ts` — los 13 supuestos resueltos reales.
- `alpina-2024.canonical-execution.test.ts` — primera ejecución canónica real contra `runCanonicalFinancialEngine` (sin mock), comprueba que el sector no altera outputs DCF.
- `alpina-2024.resolved-assumptions.test.ts`, `alpina-2024.structured-input.test.ts`.

## Trazabilidad de la evidencia
Los propios archivos indican que los estados financieros y notas revisados en las fases 4B–4F son un **artefacto histórico no versionado** en este repo. > Pendiente de confirmar dónde viven (candidato: `docs/research/`).

## Estado
Ver [[10-roadmap]] fase 3 y [[11-pendientes]].

## Material de aprendizaje (no backlog)
Los 8 casos históricos en `docs/velarix/casos/` y [[00-INDICE-Y-SINTESIS-MAESTRA-V1]].
