---
description: Revisa el estado de los 13 supuestos resueltos de un caso Velarix y propone (sin aprobar) los faltantes
argument-hint: <caso>
---

Sigue `docs/skill/VELARIX-VALUATION-SKILL.md` (paso 8) para el caso: $ARGUMENTS

1. Lee la metodología canónica (§6–§13 de `docs/velarix-v5/04-VALUATION-METHODOLOGY-V5.md`) y el contrato de `supabase/functions/_shared/resolved-calculation-assumptions.ts`.
2. Construye una tabla con los 13 supuestos más growth: valor, fuente, rationale, estado (resuelto / propuesto / faltante).
3. Para cada faltante, propone alternativas con su evidencia y su trade-off. **No elijas por Nicolás.**
4. Señala incoherencias (WACC ≤ g, g/ROC, moneda e inflación, pesos que no suman 1).
