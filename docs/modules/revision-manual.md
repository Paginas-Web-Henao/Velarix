---
tipo: modulo
capa: judgment
estado_v5: KEEP (actor por confirmar)
actualizado: 2026-10-15
tags: [velarix, modulo, revision]
---

# Revisión manual

Índice: [[03-modulos]] · Flujo: [[04-flujos]] §3

## Qué es
Cola de revisión humana para homologaciones dudosas o narrativas que no pasan su auditoría.

## Archivos
- `src/lib/manual-review-api.ts` — `crearRevisionManual`, `obtenerRevisiones*`, `tomarRevision`, `obtenerDetalleRevision`, `corregirCuenta`, `aprobarRevision`, `bloquearRevision`.
- `src/pages/AdminReviews.tsx` (embebido en el workbench como **Review Center**) y `src/pages/AdminReviewDetail.tsx` (`/workbench/reviews/:revisionId`).
- `supabase/functions/continuar-tras-revision/index.ts` — reanuda tras aprobación → `validacion_aprobada`.
- Tabla `manual_reviews`.

## Notas v5.0
Requiere rol `analyst`/`admin`. Si sigue siendo el modelo correcto con un solo actor está abierto. Ver [[07-autenticacion]].

## Tests
`continuar-tras-revision.regression.test.ts`, `authorization.test.ts`.
