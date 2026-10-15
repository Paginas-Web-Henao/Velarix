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
Requiere rol `analyst`/`admin` (RLS + `authorization.ts`); el owner lo cumple con `admin` ([[ADR-008-single-owner-private-mode]]).

Single-owner: no hay analistas ni admins. Es la **revisión de Judgment del owner**, con etiquetas de UI sobre los mismos valores de `manual_reviews.estado`: `pendiente` → Abierta, `en_revision` → En revisión, `aprobado` → Aceptada, `bloqueado` → Rechazada. Valor metodológico conservado: nada continúa sin una aceptación explícita, con notas mínimas y registrada en `audit_events`. Ver [[07-autenticacion]].

## Tests
`continuar-tras-revision.regression.test.ts`, `authorization.test.ts`.
