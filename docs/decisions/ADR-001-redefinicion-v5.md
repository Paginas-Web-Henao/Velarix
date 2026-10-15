---
tipo: decision
id: ADR-001
estado: aceptada
fecha: 2026-08-31
tags: [velarix, decision, alcance]
---

# ADR-001 — Velarix v5.0: proyecto personal de evidencia técnica

Índice: [[09-decisiones]]

## Contexto
v4.2 (2026-08-10) planteaba una boutique de valoración expert-led con clientes ([[REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10]], D-09). [[01-scope-surgery]] mostró que multi-tenancy, CRM, pricing u onboarding nunca se implementaron: vivían solo en documentos.

## Decisión
Velarix deja de ser un negocio. Es un proyecto personal para demostrar criterio financiero y rigor de modelación con **un único caso completo (Alpina)**. Alcance congelado: metodología → auditoría/corrección del motor → caso Alpina → demo → README.

## Consecuencias
- Se elimina el revisor externo como gate estructural; el autor debe defender cada decisión ([[03-methodology-decisions-v5]] §0).
- Los 8 casos históricos quedan como material de aprendizaje, no como backlog.
- Landing comercial y documentos de negocio pasan a legado ([[landing]]).
- Cualquier idea nueva se marca `NOT BUILDING`.

## Fuente
[[01-scope-surgery]], [[03-methodology-decisions-v5]].
