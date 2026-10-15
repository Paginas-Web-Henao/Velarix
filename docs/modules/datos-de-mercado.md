---
tipo: modulo
capa: evidence
estado_v5: KEEP
actualizado: 2026-10-15
tags: [velarix, modulo, mercado]
---

# Datos de mercado

Índice: [[03-modulos]] · Integraciones: [[08-integraciones]]

## Archivos
- `supabase/functions/update-snapshots/index.ts` — dataset Damodaran 2026 hardcodeado → `external_snapshots`.
- `supabase/functions/check-data-freshness/index.ts` — umbrales de frescura → `data_sources`, `snapshot_updates`, `update_jobs_log`.
- `src/data/velarix-datos-2026.ts` — datos de referencia del frontend.

## Nota v5.0
La metodología exige obtener market inputs vigentes al momento del cálculo del caso y no fija valores en el documento ([[04-VALUATION-METHODOLOGY-V5]] §10.4). Para Alpina los componentes se entregan como supuestos resueltos, no desde estos snapshots.

> Pendiente de confirmar: cómo se programan estas funciones.
