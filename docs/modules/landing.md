---
tipo: modulo
capa: frontend
estado_v5: RETIRED
retirado: 2026-10-15
actualizado: 2026-10-15
tags: [velarix, modulo, retirado]
---

# Landing comercial — RETIRADA / ELIMINADA

Índice: [[03-modulos]] · Decisión: [[ADR-006-retirar-landing-comercial]]

> [!important] Este módulo ya no existe en el código. La nota se conserva solo como registro de lo eliminado.

## Qué era
La página `/` de v4.x: marketing B2B con framing de SaaS o boutique ("Solicitar demo", "listo para comité de dirección"), CTAs comerciales y el Estimador como gancho de captación de leads.

## Qué se eliminó (2026-10-15)
- `src/pages/Index.tsx`
- `src/components/landing/` completo (15 archivos): `BenchmarkSection`, `FinalCTA`, `FinancialEngineSection`, `Footer`, `HeroSection`, `MacroSection`, `MethodologySection`, `Navbar`, `PlatformSection`, `ProblemSection`, `ProductPreview`, `ReportsSection`, `TrustGovernance`, `TrustStrip`, `ValuationTeaser`.
- La ruta `/` → `<Index />` en `src/App.tsx`.
- Dos ítems del checklist QA que solo tenían sentido con la landing o con el gate (`src/components/dashboard/QAChecklist.tsx`, ítems 39 y 40).

Ninguno de esos componentes lo usaba otra vista; antes de borrar se verificó que su único importador era `Index.tsx`. Las funciones de `src/lib/financial-engine.ts` y los datos de `src/data/velarix-datos-2026.ts` que usaba la landing **no se tocaron**. `quickValuation` quedó sin uso en producción y solo lo ejercita `financial-engine.characterization.test.ts`.

## Por qué
Velarix v5.0 no es un producto comercial ([[ADR-001-redefinicion-v5]]). La landing contradecía el propósito del proyecto y era deuda legacy de v4.x.

## Reemplazo
Ninguno: no hay otra landing. La ruta `/` abre directamente el [[estimador-demo]].

## Recuperación
Los archivos siguen en el historial de git (último commit que los contiene: `c52f901`).
