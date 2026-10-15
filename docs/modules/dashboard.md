---
tipo: modulo
capa: frontend
estado_v5: KEEP
actualizado: 2026-10-15
tags: [velarix, modulo, frontend]
---

# Dashboard privado

Índice: [[03-modulos]]

Ruta `/dashboard` (protegida). `src/pages/Dashboard.tsx` + `src/components/dashboard/`:
`DashboardHome`, `DashboardSidebar`, `NewAnalysisStepper` (crea `analyses`), `DocumentUpload`, `ProgressPanel`, `AnalysisList`, `ReportsGallery`, `UserProfile` (`profiles.full_name`, `company`), `QAChecklist`.

Usa `src/lib/api-client.ts`. Ver [[pipeline-documental]] e [[informes-pdf]].

Documento histórico: [[07-FRONTEND-RUTAS-Y-UX]].
