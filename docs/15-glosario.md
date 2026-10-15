---
tipo: glosario
actualizado: 2026-10-15
tags: [velarix, glosario]
---

# Glosario

Volver a [[00-home]]

## Conceptos de Velarix

- **Evidence / Judgment / Calculation** — las tres capas separadas de toda valoración en Velarix. Evidence = dato verificable con procedencia; Judgment = decisión humana documentada; Calculation = aplicación determinística sin autoridad metodológica. [[04-VALUATION-METHODOLOGY-V5]] §1.
- **Defendibilidad técnica** — criterio de calidad: cada decisión material debe poder explicarse, reproducirse y someterse a stress test.
- **Expediente de Valoración** — expediente completo de un caso (documentos → … → conclusión). Spec: [[EXPEDIENTE-DE-VALORACION-V1]]. En código solo existe el mínimo. [[expediente]]
- **Minimum Expediente Checkpoint** — gate que exige contexto, ≥1 cuenta material, ≥1 ambigüedad y ≥1 tratamiento humano antes de calcular.
- **Preflight** — gate que exige los 13 `ResolvedCalculationAssumptions` antes de invocar el motor. [[supuestos-y-preflight]]
- **ResolvedCalculationAssumptions** — contrato de 13 supuestos resueltos (Judgment) que consume el motor. [[05-financial-engine-audit]] §6.
- **structured_input** — Evidence financiera normalizada (estado de resultados + balance) que alimenta el cálculo.
- **source_input_snapshot / resolved_assumptions_used** — congelación separada de Evidence y Judgment en el resultado. [[reproducibilidad]]
- **Fingerprint** — hash determinístico de evidencia + supuestos; si cambia cualquiera, cambia la identidad del cálculo.
- **Motor canónico** — `canonical-financial-engine.ts` (servidor). Opuesto al motor cliente del Estimador.
- **Estimador**: demo pública sin login en la raíz `/` (`DemoDashboard`), con el motor cliente. [[estimador-demo]]
- **Golden cases A/B/C** — fixtures sintéticos que fijan resultados esperados del motor.
- **RC-1 … RC-5** — root causes de la auditoría del motor. [[05-financial-engine-audit]]
- **P-01 … P-14 / C-01 … C-12 / O-01 … O-03** — principios cerrados, decisiones case-specific de Alpina y preguntas abiertas. [[03-methodology-decisions-v5]]
- **NOT BUILDING** — etiqueta para ideas explícitamente fuera de alcance.
- **Bloque (1A…1E, 2A/2B, 3A/3B/3C, 4B…4F)** — unidades de trabajo históricas; cada una deja un reporte en `docs/`.
- **Homologación** — mapeo de etiquetas contables originales a cuentas canónicas (`map-accounts`).

## Finanzas

- **DCF** — Discounted Cash Flow.
- **FCFF** — Free Cash Flow to the Firm; flujo antes de pagos a acreedores, descontado al WACC.
- **FCFE** — Free Cash Flow to Equity (no se mezcla con FCFF).
- **EV (Enterprise Value)** → **Equity Value** — puente: EV − deuda neta ± partidas no operativas, NCI, asociadas, leases. P-10.
- **WACC** — costo promedio ponderado de capital. **Ke** — costo del equity (CAPM). **Kd** — costo de la deuda.
- **ERP** — Equity Risk Premium. **CRP** — Country Risk Premium. **λ (lambda)** — exposición de la empresa al riesgo país.
- **Fisher** — paridad para convertir tasas entre monedas/inflaciones.
- **g terminal** — crecimiento a perpetuidad del valor terminal; debe ser coherente con ROC: *Reinvestment Rate = g / ROC*.
- **ROC** — Return on Capital.
- **NWC / Operating Working Capital** — capital de trabajo operativo no-caja (AR + inventario − AP − pasivos acumulados operativos).
- **CAPEX de mantenimiento vs. crecimiento** — P-07.
- **D&A** — depreciación y amortización.
- **NOLs** — pérdidas fiscales acumuladas compensables.
- **NIIF 16 / IFRS 16** — arrendamientos; en Alpina se usa la convención `CAPITALIZED_LEASES`.
- **NCI** — Non-controlling interests (participaciones no controladoras).
- **DLOM** — Discount for Lack of Marketability; condicional, nunca automático (P-11).
- **SOTP** — Sum of the Parts.
- **Stub period** — primer período parcial cuando la fecha de valoración no coincide con un cierre.
- **Mid-year convention** — descontar flujos a mitad de año en vez de fin de año.
- **Basis of value** — base de valor (IVS 102): Market Value, Investment Value/Worth, etc.
- **IVS** — International Valuation Standards (IVSC), edición vigente desde 2025-01-31.
- **TRM** — Tasa Representativa del Mercado (COP/USD).
- **COP miles** — unidad de los estados de Alpina en el repo.
