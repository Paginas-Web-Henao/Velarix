# 07 — Frontend, Rutas y UX

## Mapa de rutas (`src/App.tsx:32-52`) — VERIFICADO

| Ruta | Componente | Guardas |
|---|---|---|
| `/` | `Index` | pública |
| `/auth` | `Auth` | `AuthRoute` (si hay user → redirige a `/dashboard`) |
| `/dashboard` | `Dashboard` | `ProtectedRoute` (requiere `user`) |
| `/admin/revisiones` | `AdminReviews` | `ProtectedRoute` (requiere `user`) |
| `/admin/revisiones/:revisionId` | `AdminReviewDetail` | `ProtectedRoute` (requiere `user`) |
| `/reset-password` | `ResetPassword` | pública |
| `*` | `NotFound` | — |

**RIESGO severo — CONFIRMADO**: `ProtectedRoute` (`App.tsx:18-23`) solo
verifica `user` autenticado, no rol. No existe ningún concepto de
`role`/`admin` en `AuthContext.tsx` ni en el árbol de componentes (grep
sin resultados de "role"/"acceso"/"permission"). **No existe** ningún hook
`useAcceso` (`find` sin resultados). Cualquier usuario autenticado puede
navegar a `/admin/revisiones*`. Ver también `05-SEGURIDAD-DATOS-RLS.md`.

**RIESGO — VERIFICADO**: "QA Checklist" (`DashboardSidebar.tsx:18`,
`Dashboard.tsx:16,201`, componente `QAChecklist.tsx`) — checklist interna
de QA pre-lanzamiento, visible para cualquier usuario autenticado, sin
gate de rol.

## Enlaces vs. rutas reales

VERIFICADO — todos los `<Link>`/`href` a `/`, `/dashboard`, `/auth`
(Navbar, Auth, Dashboard, ResetPassword, NotFound) apuntan a rutas
existentes.

**Enlaces rotos — VERIFICADO**: `Footer.tsx:29,32` apuntan a anclas
`#macro` y `#trust`. Ninguna sección de la landing tiene esos `id`. Los
`id` reales son `platform`, `methodology`, `benchmarks`, `estimador`,
`reports`. `MacroSection.tsx:60` y `TrustGovernance.tsx:21` no tienen
`id` — clic en esos enlaces del footer no hace scroll a ningún lado
(fallback silencioso, sin error visible).

Nota menor: `Navbar.tsx:78-91` — "Mi dashboard" y "Mis análisis" apuntan
ambos a `/dashboard` (redundante, no roto).

## Pantallas sin backend real

VERIFICADO — `AdminReviews.tsx`/`AdminReviewDetail.tsx` usan
exclusivamente `manual-review-api.ts` (queries reales a Supabase +
edge function `continuar-tras-revision`). Sin datos de ejemplo
hardcodeados.

VERIFICADO — el estimador rápido de la demo (`DemoDashboard.tsx`,
`ValuationTeaser.tsx`) invoca `runAnalysis`/`quickValuation` de
`financial-engine.ts` (726 líneas de lógica DCF/WACC/CAPM real,
determinística, en el navegador) — no es decorativo, calcula de verdad.

**DEUDA — datos de referencia duplicados y potencialmente inconsistentes**:
dos datasets de benchmarks/macro distintos en el frontend
(`financial-engine.ts` vs. `velarix-datos-2026.ts`) más un tercero en
`update-snapshots/index.ts` (backend) — ver `04-CALIDAD-FINANCIERA.md`.
Distintas pantallas del mismo producto pueden mostrar cifras macro
diferentes para el mismo parámetro/fecha.

**RIESGO — datos de vigencia contradicen su propio mensaje de marketing
(con fecha del sistema 2026-07-22, VERIFICADO)**: el sistema de "vigencia"
(`evaluarVigencia`, `financial-engine.ts:600-713`) calcula frescura contra
`new Date()` real. Todas las fechas `ultimaActualizacion` hardcodeadas son
de enero-marzo 2026 (~120-190 días de antigüedad hoy), superando los
umbrales `amarillo` de sus propias frecuencias. Ejecutado hoy,
`DemoDataIntegrity.tsx` mostraría legítimamente "Requiere atención"
(rojo), contradiciendo "Frescura validada mensualmente"
(`TrustGovernance.tsx:5`) y "Última verificación: hoy" (`HeroSection.tsx:62,67`,
texto estático no calculado). Sin cron configurado que dispare
`update-snapshots`/`check-data-freshness` automáticamente.

VERIFICADO — `Dashboard.tsx`, `NewAnalysisStepper.tsx`, `DocumentUpload.tsx`,
`ProgressPanel.tsx`, `ReportsGallery.tsx`, `UserProfile.tsx`,
`DashboardHome.tsx`, `AnalysisList.tsx` — todos usan datos reales de
Supabase; sin `mock`/`dummy`/`fake`/`TODO` (grep negativo).

## Estados de carga/error/vacío/éxito

| Componente | Loading | Error | Vacío | Éxito |
|---|---|---|---|---|
| `Dashboard.tsx` | Sí | Parcial — sin estado global que distinga "sin datos" de "falló la carga" | Implícito | Sí (toasts) |
| `NewAnalysisStepper.tsx` | Sí | Sí (`pipelineError` + reintento) | N/A | Sí (paso dedicado) |
| `DocumentUpload.tsx` | Sí | Sí (`toast.error` en cada rama) | Sí | Sí |
| `ProgressPanel.tsx` | Sí | Sí (bloque dedicado + reglas fallidas) | N/A | Sí |
| `ReportsGallery.tsx` | No propio (depende del padre) | No propio (delega al padre) | Sí, explícito | Implícito |

**DEUDA**: `DashboardHome.tsx` no tiene copy explícito de estado vacío
(solo oculta la sección) — sí lo tiene `AnalysisList.tsx` y
`ReportsGallery.tsx`.

## Permisos visuales

VERIFICADO — no existe control por `role`/`plan`; la única lógica de
"gating" visual es por estado de autenticación (booleano). El
concepto de "plan" (free/paid) **no existe en ningún archivo del
frontend** (grep sin resultados de lógica de negocio relacionada) — NO
VERIFICABLE ningún control de acceso por plan.

VERIFICADO — el botón de descarga de PDF en la demo (tab "Reporte")
**realmente no existe en el DOM sin login**:
```
// Completely hide "Reporte" tab from sidebar when not logged in
if (t.ocultoSinLogin && !autenticado) return null;
```
`return null` real, no `disabled` — cumple la regla de negocio citada.
Matiz: el botón de descarga real de producción (`ReportsGallery.tsx`) está
protegido a nivel de ruta (`/dashboard` inalcanzable sin sesión), no por
un `return null` propio del componente.

## Lenguaje que promete de más

**RIESGO (lenguaje) — VERIFICADO**:
- `HeroSection.tsx:139`: *"Sin compromiso · Datos reales · Metodología
  auditada"* — "auditada" (participio) implica auditoría por un tercero
  ya realizada, más fuerte que "auditable" usado en otras partes.
- `HeroSection.tsx:67`: *"Última verificación: hoy · Fuente: simulación
  demo · Estado: ✓ Validado"* — rotulado como "simulación demo" (mitiga),
  pero "Última verificación: hoy" es texto estático no calculado.
- `TrustStrip.tsx:7`, `PlatformSection.tsx:21`, `MethodologySection.tsx:39`,
  `TrustGovernance.tsx:5,29` — "auditable"/"verificable"/"trazable"
  repetidos, dentro de lo permitido, pero generan inconsistencia de
  registro junto con `HeroSection.tsx:139`.

**No encontrado (buena señal)**: sin ocurrencias de "garantiza",
"certificado" (como certificación de EEFF), "Big Four", "PwC", "KPMG",
"Deloitte", "EY", "100% automático", "sin intervención humana" o
"autoservicio" en la landing ni en `Index.tsx`.

**DEUDA de consistencia (ausencia, no exceso)**: ninguna sección de la
landing menciona explícitamente que un analista humano revisa cada
informe antes de entregarlo — el copy enfatiza automatización
("Homologación contable automática", "Motor financiero: Determinístico ·
Frontend", "100% en navegador") sin comunicar la revisión humana
obligatoria que sí es parte del flujo real backend. El único lugar con la
idea de acompañamiento humano es el aviso legal del PDF, y ahí habla de
un asesor externo del cliente, no del equipo de revisión de Velarix.
**Riesgo de posicionamiento**: el copy actual se lee más como SaaS de
autoservicio que como boutique con revisión humana — ver
`11-CONTRADICCIONES-NEGOCIO-CODIGO.md`.

## Accesibilidad básica

VERIFICADO — sin `<img>` en `src/**/*.tsx` (el proyecto usa solo iconos
`lucide-react`), no aplica el problema de `alt` faltante.

**Botones icon-only sin `aria-label` — VERIFICADO**:
`Navbar.tsx:118-120` (toggle menú móvil), `ReportsGallery.tsx:52-56`
(toggle grid/lista), `AnalysisList.tsx:91-93` (eliminar análisis),
`DemoDashboard.tsx:189-191` (cerrar overlay), `Auth.tsx:92-94`
(mostrar/ocultar contraseña).

## Acciones decorativas sin persistencia real

VERIFICADO (negativo, buena señal) — sin `console.log`/`alert(` en
`onClick`/`onSubmit` de todo `src/**/*.tsx|ts`. Todos los handlers
revisados en componentes principales invocan Supabase, edge functions, o
`navigate()`/cambios de estado con efecto real. Única acción "nativa" no
envuelta en componente propio: `confirm()` en
`AdminReviewDetail.tsx:120` (bloqueo de análisis) — funcional, aunque
estéticamente inconsistente (`window.confirm` vs modal custom del resto
de la UI).

## Resumen de severidad

1. **RIESGO alto (control de acceso)**: `/admin/revisiones*` y "QA
   Checklist" alcanzables por cualquier usuario autenticado, sin
   verificación de rol en frontend.
2. **RIESGO (datos/lenguaje)**: datos macro/sectoriales desactualizados
   según su propio umbral de vigencia, triplicados sin sincronía,
   contradiciendo el discurso de "frescura validada"/"verificación hoy".
3. **RIESGO (lenguaje)**: "Metodología auditada" es más fuerte que lo que
   el producto puede sostener hoy.
4. **DEUDA (posicionamiento)**: el copy no comunica la revisión humana
   obligatoria, pese a existir en el backend.
5. **Enlace roto**: anclas `#macro`/`#trust` en el footer sin destino.
6. **DEUDA (accesibilidad)**: 5 botones icon-only sin `aria-label`.
7. Estados de carga/error/vacío/éxito en general bien cubiertos; brechas
   menores en `DashboardHome.tsx` y `ReportsGallery.tsx`.
