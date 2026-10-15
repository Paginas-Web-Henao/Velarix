---
tipo: modulo
capa: salida
estado_v5: KEEP
actualizado: 2026-10-15
tags: [velarix, modulo, pdf]
---

# Informes PDF

Índice: [[03-modulos]]

## Qué es
Generación del informe en el navegador con jsPDF, alimentado por el snapshot canónico (commit `5750fcf`).

## Archivos
- `src/lib/pdf-generator.ts`
- `src/lib/pdf-canonical-mapper.ts` — mapea `calculation_result` canónico al PDF; no recalcula.
- `src/types/calculation-result.ts` — tipos del resultado persistido.
- `src/lib/canonical-pdf-download.ts`: descarga fail-closed desde Workbench → Output; bucket `reportes-pdf`; tabla `generated_reports`. (`ReportsGallery.tsx` se eliminó el 2026-10-15.)

## Tests
`pdf-generator.currency.spec.test.ts`, `pdf-canonical-calculation.regression.test.ts`.
