---
tipo: modulo
capa: frontend
estado_v5: KEEP (no canónico)
actualizado: 2026-10-15
tags: [velarix, modulo, workbench]
---

# Quick Model

Índice: [[03-modulos]] · Mapa: [[03-WORKBENCH]] · Decisión: [[ADR-007-personal-valuation-workbench]]

## Qué es
Modelo rápido, **local y exploratorio** dentro del workbench (panel lateral → Quick Model). Corre entero en el navegador con el **motor cliente** (`src/lib/financial-engine.ts`). **No es canónico**: no usa Evidence del caso ni supuestos resueltos, no persiste nada y no tiene fingerprint.

| | Quick Model | Caso canónico |
|---|---|---|
| Motor | `src/lib/financial-engine.ts` (cliente) | `canonical-financial-engine.ts` ([[motor-canonico]]) |
| Inputs | Formulario libre, supuestos por defecto | Evidence + 13 supuestos resueltos ([[supuestos-y-preflight]]) |
| Gates | Ninguno | Checkpoint del [[expediente]] + preflight |
| Persistencia / trazabilidad | No | Supabase + envelope ([[reproducibilidad]]) |
| Uso | Explorar órdenes de magnitud | Valoración defendible |

Unificar los motores sigue siendo `NOT BUILDING` (D-06 en [[REGISTRO-DE-DECISIONES]]).

## Archivos
- `src/components/demo/QuickModel.tsx` (antes `DemoDashboard.tsx`; solo se renombró el contenedor).
- `src/components/demo/Demo*.tsx`: subpaneles (inputs, normalización, KPIs, proyecciones, sensibilidad, benchmarks, macro, reporte, integridad). Sus nombres internos conservan el prefijo `Demo`; el texto visible ya no dice "demo".

## Historia
- v4.x: gancho de captación de leads en la landing.
- [[ADR-006-retirar-landing-comercial]]: demo pública en `/` sin login.
- [[ADR-007-personal-valuation-workbench]]: deja de ser pública y pasa a ser una herramienta privada no canónica.

## Tests
`DemoInputsForm.test.tsx`, `financial-engine.golden-cases.test.ts`, `financial-engine.characterization.test.ts`. BUG-01 en [[12-bugs]].
