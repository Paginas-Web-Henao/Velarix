---
tipo: modulo
capa: frontend
estado_v5: KEEP (público en "/")
actualizado: 2026-10-15
tags: [velarix, modulo, demo]
---

# Estimador (demo pública)

Índice: [[03-modulos]] · Decisión: [[ADR-006-retirar-landing-comercial]] · Arquitectura: [[02-arquitectura]]

## Qué es
La raíz de la aplicación (`/`). Es una demo pública **sin login**: el cálculo corre entero en el navegador con el **motor cliente**, no con el [[motor-canonico]].

## Archivos
- `src/components/demo/DemoDashboard.tsx`: montado directamente en la ruta `/` (`src/App.tsx`). `open` y `onClose` son opcionales: sin `onClose` no aparece el botón de cerrar.
- `src/components/demo/`: `DemoInputsForm`, `DemoKPIs`, `DemoCharts`, `DemoSensitivity`, `DemoNormalization`, `DemoMacro`, `DemoDataIntegrity`, `DemoBenchmarkView`, `DemoReport` (PDF generado en el navegador).
- `src/lib/financial-engine.ts`: motor cliente (`runAnalysis`).

## Cambios del 2026-10-15
- Se eliminó el gate comercial: `SeccionBloqueada` ("… disponible con cuenta gratuita" / "Crear cuenta gratuita"), los candados y la pestaña "Reporte" oculta sin sesión. Ya no se usa `useAuth`.
- Las 9 pestañas (Inputs, Normalización, KPIs, Proyecciones, Valuación, Benchmarks, Macro, Reporte, Integridad) son públicas.
- Se quitó el texto "Mid-year en versión completa", porque aludía a una versión de pago.
- Se añadió un enlace discreto "Área privada →" a `/dashboard`. Es la única vía de navegación hacia el login que quedaba tras borrar el `Navbar` de la landing.

## Pendiente
- Decidir si el Estimador refleja las correcciones del motor canónico o queda como pieza aislada más simple ([[01-scope-surgery]] §8.5). Unificar motores es `NOT BUILDING`. Ver [[11-pendientes]].

## Tests
`DemoInputsForm.test.tsx`, `financial-engine.golden-cases.test.ts`, `financial-engine.characterization.test.ts`. BUG-01 en [[12-bugs]].
