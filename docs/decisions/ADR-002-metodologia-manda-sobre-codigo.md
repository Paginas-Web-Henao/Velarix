---
tipo: decision
id: ADR-002
estado: aceptada
fecha: 2026-08-31
tags: [velarix, decision, metodologia]
---

# ADR-002 — La metodología escrita manda sobre el código

Índice: [[09-decisiones]]

## Decisión
La metodología se escribe y congela **antes** de tocar el motor. Si código y metodología discrepan, se resuelve primero en el documento y luego se cambia el código. Un cálculo financieramente incorrecto es bloqueante absoluto.

## Consecuencias
- Orden real de commits: `6748a6a` metodología (2026-09-02) → `dc3e2fb` auditoría → `884173d` tests-first → implementación 3C.
- La auditoría del motor se mide contra [[04-VALUATION-METHODOLOGY-V5]] §18.3 (implementation mismatches).

## Fuente
[[04-VALUATION-METHODOLOGY-V5]] (regla de autoridad), [[05-financial-engine-audit]].
