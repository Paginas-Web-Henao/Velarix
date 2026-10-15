---
tipo: decision
id: ADR-006
estado: aceptada
fecha: 2026-10-15
tags: [velarix, decision, frontend, alcance]
---

# ADR-006 — Retirar la landing comercial

Índice: [[09-decisiones]] · Módulos: [[landing]], [[estimador-demo]] · Antecedente: [[ADR-001-redefinicion-v5]]

## Contexto
Velarix v5 no es un producto comercial. La raíz `/` mostraba una landing B2B de v4.x ("Solicitar demo", CTAs, narrativa de SaaS o boutique), y el Estimador funcionaba como embudo de captación: varias pestañas exigían "Crear cuenta gratuita". [[01-scope-surgery]] §5 ya había clasificado la landing como eliminable sin riesgo técnico. El usuario confirmó explícitamente la decisión el 2026-10-15, lo que adelanta el retiro que estaba previsto para el final del roadmap.

## Decisión
Se elimina la landing B2B y el concepto mismo de landing; no se sustituye por otra. La raíz de la aplicación pasa a ser el Estimador público (`/` → `DemoDashboard`), sin login obligatorio.

Supabase Auth se mantiene para lo que de verdad lo necesita (dashboard, revisiones admin y Edge Functions).

## Alternativas consideradas
- **Redirigir `/` a `/dashboard`**: descartada, porque obligaría a autenticarse para ver cualquier cosa, cuando el Estimador no necesita backend.
- **Una página de presentación nueva**: descartada por petición explícita ("no quiero sustituir la landing por otra landing").

## Consecuencias
- Se reduce la deuda legacy de v4.x (−1.371 líneas entre `Index.tsx` y `components/landing/`) y el frontend queda alineado con el propósito real del proyecto.
- El Estimador avanza el entregable 4 del roadmap (demo pública sin login). Ver [[10-roadmap]].
- La navegación al área privada queda en un enlace "Área privada →" dentro del Estimador.

## Fuente
Cambios sin commit del 2026-10-15: `src/App.tsx`, `src/components/demo/DemoDashboard.tsx`, borrado de `src/pages/Index.tsx` y `src/components/landing/`.
