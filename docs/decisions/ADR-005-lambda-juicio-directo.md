---
tipo: decision
id: ADR-005
estado: aceptada
fecha: 2026-09-07
tags: [velarix, decision, wacc]
---

# ADR-005 — Lambda de riesgo país: modo de juicio directo documentado

Índice: [[09-decisiones]] · Módulo: [[supuestos-y-preflight]]

## Contexto
El contrato exigía siempre `domesticRevenuePctCompany` / `domesticRevenuePctMarketAvg`, lo que obligaba a fabricar evidencia cuando no existe (RC-5).

## Decisión
`countryRiskLambda` admite dos modos mutuamente excluyentes: `observed_revenue_exposure` (preferido, con evidencia de ingresos por geografía) o `direct_documented_judgment` (documentando explícitamente por qué la evidencia es insuficiente).

## Fuente
Commits `ab5d90b` (docs), `3e841a4` (test), `14d7e63` (feat); [[05-financial-engine-audit]] §5–§6, [[04-VALUATION-METHODOLOGY-V5]] §19 (C-11).
