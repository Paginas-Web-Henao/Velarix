---
tipo: decision
id: ADR-004
estado: aceptada
fecha: 2026-09-07
tags: [velarix, decision, alpina]
---

# ADR-004 — Alpina: base de valor, fecha y arquitectura del caso

Índice: [[09-decisiones]] · Módulo: [[caso-alpina]]

## Decisión
- Sujeto: 100% del economic equity de Alpina Productos Alimenticios S.A.S. BIC.
- Basis of value: **Market Value** (IVS 102). Investment Value/Worth descartado: no hay comprador o tenedor particular con sinergias específicas.
- Fecha de valoración: **2024-12-31**, igual al cierre del período base (no hay stub period).
- Arquitectura `PARENT_DCF_PLUS_SOTP`: el parent operating DCF standalone está en código; el SOTP es un análisis separado.
- Leases: `CAPITALIZED_LEASES`.

## Por qué Alpina
Caso DCF corporativo limpio: negocio operativo entendible, ingresos recurrentes, inventario, cuentas por cobrar/pagar, CAPEX y deuda, con años de estados consolidados públicos aunque es privada.

## Fuente
Cabecera de `supabase/functions/_shared/alpina-2024.resolved-assumptions.ts` (commit `325f71c`). Resuelve la "basis of value pendiente" de [[04-VALUATION-METHODOLOGY-V5]] §19.
