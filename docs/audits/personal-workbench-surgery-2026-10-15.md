---
tipo: auditoria
fecha: 2026-10-15
rama: personal-workbench
checkpoint_previo: e9d8f58
tags: [velarix, auditoria, system]
---

# Auditoría — cirugía "Personal Valuation Workbench"

Volver a [[00-home]] · Decisión resultante: [[ADR-007-personal-valuation-workbench]]

Inventario hecho **antes** de modificar nada en la rama `personal-workbench`. Se buscaron términos comerciales (SaaS, cliente, lead, pricing, plan, premium, gratis, suscripción, billing, checkout, Stripe, pago, trial, demo, solicitar, contacto, organización, tenant, CRM, onboarding, consultoría, boutique, comité, inversionistas, due diligence, lanzamiento, institucional…) en `src/`, `supabase/`, `scripts/`, configuración, README, CLAUDE.md y `docs/`. El contexto prima sobre la coincidencia textual: "Equity Risk Premium", "clientes" como cuenta contable (cuentas por cobrar) o "cliente" como motor del navegador **no** son hallazgos.

Tipos: `ACTIVE_CONTRADICTION` · `HISTORICAL_CONTEXT` · `TECHNICALLY_REQUIRED` · `SAFE_TO_REMOVE` · `NEEDS_DECISION`.

## 1. Código y configuración activos

| Hallazgo | Archivo | Tipo | Acción recomendada |
|---|---|---|---|
| `/` abre una demo pública sin login (`DemoDashboard`) | `src/App.tsx` | ACTIVE_CONTRADICTION | `/` → `/auth` o `/workbench` según sesión |
| Badge "Demo", nombre `DemoDashboard`, "Calculadora demo" | `src/components/demo/DemoDashboard.tsx`, `src/pages/Dashboard.tsx` | ACTIVE_CONTRADICTION | Renombrar a Quick Model (no canónico) dentro del workbench |
| "Moneda: USD (demo)", KPIs "(demo)" | `DemoInputsForm.tsx`, `DemoKPIs.tsx` | ACTIVE_CONTRADICTION | Cambiar a "Quick Model" / "referencial" |
| Registro público ("Crear cuenta", modo `register`) en una herramienta personal | `src/pages/Auth.tsx` | ACTIVE_CONTRADICTION | Quitar registro de la UI; desactivar signups en Supabase Auth requiere cambio remoto → NEEDS_DECISION |
| Subtítulo "Inteligencia financiera institucional" | `src/pages/Auth.tsx` | ACTIVE_CONTRADICTION | "Personal Valuation Workbench" |
| Badge "Plataforma", "Bienvenido", "Gestiona tus análisis", "Mis análisis", "Mis reportes" | `src/pages/Dashboard.tsx`, `dashboard/*` | ACTIVE_CONTRADICTION | Reemplazar por el Workbench |
| "Checklist de Lanzamiento", "listo para lanzamiento" | `src/components/dashboard/QAChecklist.tsx` | ACTIVE_CONTRADICTION | "Valuation QA Checklist" |
| "recibir un reporte institucional" | `src/components/dashboard/ReportsGallery.tsx` | ACTIVE_CONTRADICTION | Componente absorbido por la sección Output del caso |
| "Generando análisis institucional…" | `src/hooks/useAnalysisProgress.ts` | ACTIVE_CONTRADICTION | "Generando narrativa…" |
| `<title>Velarix \| Financial Intelligence Platform</title>`, meta/og "reportes de grado institucional para empresas en Colombia" | `index.html` | ACTIVE_CONTRADICTION | Título neutro + `noindex` |
| `robots.txt` permite indexar todo | `public/robots.txt` | ACTIVE_CONTRADICTION | `Disallow: /` (app privada) |
| Portada y cierre del PDF: "Inteligencia financiera institucional"; comentarios "Premium dark cover" | `src/lib/pdf-generator.ts` | ACTIVE_CONTRADICTION (texto) | Cambiar el tagline del PDF; los comentarios de diseño se dejan |
| Fallback "Empresa demo" y etiquetas "Referencia demo" en el PDF | `src/lib/pdf-generator.ts` | ACTIVE_CONTRADICTION | "Empresa sin nombre" / "Referencia Quick Model" |
| `DEFAULT_INPUTS.companyName = "Empresa Demo"` | `src/lib/financial-engine.ts` | ACTIVE_CONTRADICTION (solo etiqueta) | "Empresa ejemplo" (no toca cálculo) |
| Email: footer "Inteligencia financiera institucional · velarix.co"; enlaces a `/dashboard/...` | `supabase/functions/enviar-notificacion/index.ts` | ACTIVE_CONTRADICTION | Cambiar copy y enlaces a `/workbench`. Requiere **deploy** de la Edge Function para tener efecto |
| Prompt: "una plataforma de inteligencia financiera institucional para empresas colombianas", "usuarios de negocio" | `supabase/functions/generate-narrative/index.ts`, copia en `scripts/benchmark-narrative/tasks.ts` | NEEDS_DECISION | Cambiar el prompt cambia la narrativa y rompe la paridad con el benchmark congelado. No se toca sin decisión |
| Cabecera "VELARIX v4.1 — Motor Narrativo Institucional" | `generate-narrative/index.ts` | HISTORICAL_CONTEXT | Dejar |
| Comentarios que citan `Negocio_Velarix_v4.1.md` | `supabase/functions/_shared/financial-methodology.ts` | HISTORICAL_CONTEXT | Dejar (genealogía) |
| "cliente propietario" en autorización y tests | `_shared/authorization*.ts` | HISTORICAL_CONTEXT | Dejar; ver §5 (roles) |
| `pricing.ts` (costo USD de APIs de IA) | `scripts/benchmark-ai/` | TECHNICALLY_REQUIRED | Dejar: es costo de tokens, no pricing comercial |
| "clientes" como sinónimo de cuentas por cobrar | `_shared/account-taxonomy.ts` | TECHNICALLY_REQUIRED | Dejar |
| Fixtures "Empresa Demo S.A.S." | `minimum-expediente-checkpoint*.test.ts` | TECHNICALLY_REQUIRED | Dejar (datos sintéticos de test) |
| Default de columna `analyses.company_name = 'Empresa Demo'` | migración `20260320164123` | NEEDS_DECISION | No se toca: cambiarlo requiere migración remota |
| `profiles.company` y su edición en Perfil | migración base, `UserProfile.tsx` | COMMERCIAL_LEGACY / SAFE_TO_REMOVE (UI) | Quitar el campo de la UI; la columna se conserva |
| Resultados JSON de benchmark con nombres "… B2B Demo" | `scripts/benchmark-narrative/results/` (ignorado por git) | HISTORICAL_CONTEXT | Dejar |

## 2. Pagos, planes y suscripciones

**NO COMMERCIAL BILLING IMPLEMENTED.**

No hay Stripe, MercadoPago, payments, subscriptions, plans, pricing, checkout, billing, trial, upgrade ni premium, ni en `package.json`, ni en `src/`, ni en `supabase/functions`, ni en las migraciones. La única "subscription" del código es el objeto de `supabase.auth.onAuthStateChange` (`AuthContext.tsx`), que es técnico. No hay variables de entorno de pago.

## 3. Rutas

| Ruta actual | Funcionalidad real | Clasificación | Destino |
|---|---|---|---|
| `/` | Estimador público (motor cliente) | REMOVE (como pública) | Redirección según sesión |
| `/auth` | Login, registro, recuperación | KEEP (solo login y recuperación) | `/auth` |
| `/reset-password` | Nueva contraseña | KEEP | `/reset-password` |
| `/dashboard` | Lista de análisis, nuevo análisis, carga de documentos, reportes, perfil, QA, calculadora | MERGE_INTO_WORKBENCH | `/workbench` (+ redirección legacy, porque los emails enlazan `/dashboard/*`) |
| `/admin/revisiones` | Cola de `manual_reviews` | MERGE_INTO_WORKBENCH | Sección "Reviews" del workbench |
| `/admin/revisiones/:revisionId` | Corregir cuentas, aprobar o bloquear | REPURPOSE | `/workbench/reviews/:revisionId` (necesita pantalla completa) |
| `*` | 404 | KEEP | — |

## 4. Componentes

| Componente | Función real | Clasificación |
|---|---|---|
| `demo/DemoDashboard.tsx` | Contenedor del modelo rápido con motor cliente | RENAME → `demo/QuickModel.tsx`, abierto desde el workbench |
| `demo/Demo*.tsx` (10 subcomponentes) | Paneles del Quick Model | KEEP (nombres internos; el texto visible ya no dice "demo") |
| `dashboard/NewAnalysisStepper.tsx` | Crear caso + carga + procesamiento | REPURPOSE ("Nuevo caso") |
| `dashboard/DocumentUpload.tsx` | Subir estados financieros y lanzar pipeline | KEEP (sección Evidence) |
| `dashboard/ProgressPanel.tsx` | Progreso del pipeline | KEEP |
| `dashboard/QAChecklist.tsx` | QA del informe/flujo | REPURPOSE ("Valuation QA Checklist") |
| `dashboard/UserProfile.tsx` | Nombre, empresa, contraseña | REPURPOSE ("Cuenta": sin campo empresa) |
| `dashboard/AnalysisList.tsx` | Lista filtrable de análisis | MERGE (lista de casos del workbench) → REMOVE |
| `dashboard/DashboardHome.tsx` | Bienvenida + contadores | REMOVE |
| `dashboard/DashboardSidebar.tsx` | Navegación del dashboard | REMOVE (reemplazado) |
| `dashboard/ReportsGallery.tsx` | Galería de reportes por análisis | MERGE (sección Output del caso) → REMOVE |
| `pages/Dashboard.tsx` | Página contenedora | REMOVE → `pages/Workbench.tsx` |
| `pages/AdminReviews.tsx` | Lista de revisiones | MERGE (se reutiliza embebida) |
| `pages/AdminReviewDetail.tsx` | Detalle y aprobación | REPURPOSE (ruta bajo `/workbench`) |

## 5. Supabase — schema (solo lectura de migraciones)

No existen tablas `subscriptions`, `plans`, `payments`, `billing`, `organizations`, `tenants`, `clients` ni CRM. Confirmado contra las 10 migraciones.

| Objeto | Clasificación | Nota |
|---|---|---|
| `analyses` | CORE_PERSONAL | Es el **caso**. Le faltan `valuation_date` y `basis_of_value` como columnas (hoy viven en `alpina-2024.*` y en Obsidian) |
| `documents`, `documents_parsed` | CORE_PERSONAL | Evidence |
| `account_homologations`, `validation_results` | CORE_PERSONAL | Accounts / Normalization |
| `structured_inputs` | CORE_PERSONAL | Evidence normalizada (y `resolved_assumptions` cuando exista) |
| `calculation_results`, `analyses.calculation_result` | CORE_PERSONAL | Calculation + envelope. Duplicación parcial → TECH_DEBT |
| `valuation_files`, `account_notes`, `expedient_questions`, `expedient_answers` | CORE_PERSONAL | Expediente / Questions |
| `audit_events` | CORE_PERSONAL | Audit trail |
| `report_narratives`, `generated_reports` | USEFUL_LEGACY | Output |
| `external_snapshots`, `data_sources`, `snapshot_updates`, `update_jobs_log` | USEFUL_LEGACY | Datos de mercado del pipeline legacy |
| `analysis_jobs`, `job_locks` | TECH_DEBT | Infra del pipeline asíncrono |
| `manual_reviews` | USEFUL_LEGACY → candidato a "Judgment review" | Revisión humana de homologaciones o validaciones dudosas; `continuar-tras-revision` reconstruye el input al aprobar |
| `profiles.full_name` | CORE_PERSONAL | — |
| `profiles.company` | COMMERCIAL_LEGACY | Sin uso funcional |
| `profiles.role` (`user`/`analyst`/`admin`) + trigger + `admin_set_user_role` | USEFUL_LEGACY / NEEDS_DECISION | Existe por el modelo boutique (dueño ≠ aprobador). Hoy es la única barrera contra la auto-aprobación: el dueño necesita `analyst`/`admin` para aprobar revisiones y para ver o crear el Expediente |
| Default `analyses.company_name = 'Empresa Demo'` | TECH_DEBT | — |
| RLS por `auth.uid()` en todas las tablas de caso | CORE_PERSONAL | **Se conserva** |
| Buckets `financial-documents`, `reportes-pdf` (privados, carpeta = uid) | CORE_PERSONAL | Se conservan |

**Propuesta (no ejecutada):** colapsar `user/analyst/admin` en un único dueño. Diseño en [[ADR-007-personal-valuation-workbench]] §"Propuesta de simplificación de roles". No se preparó migración: la ganancia es conceptual y el riesgo (RLS del Expediente, `authorization.ts`, tests de 1D) no se justifica sin una decisión explícita.

## 6. Supabase — estado (solo lectura)

| Comprobación | Resultado |
|---|---|
| `supabase/.temp/project-ref` = proyecto enlazado = `config.toml` `project_id` = host de `VITE_SUPABASE_URL` | ✅ coinciden (valores no impresos) |
| Clave del frontend | Formato nuevo `sb_publishable_…` |
| Variables frontend (`.env`) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Variables en `.env.local` | `VERCEL_OIDC_TOKEN` (Vercel CLI) |
| Secrets de Edge Functions (nombres) | `SUPABASE_URL`, `SUPABASE_SECRET_KEYS`, `SUPABASE_PUBLISHABLE_KEYS`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENAI_PARSE_MODEL`, `PARSE_AI_PROVIDER`, `RESEND_API_KEY`, `APP_URL` |
| CLI de Supabase | **No instalado**. `supabase gen types --linked` requiere CLI + token personal (`SUPABASE_ACCESS_TOKEN`), que no están disponibles |
| `src/integrations/supabase/types.ts` | **Desactualizado**: faltan las 4 tablas del Expediente. Se añadieron a mano, copiando exactamente la migración `20260817140000` (sin tocar la DB) |
| Schema drift remoto | No verificable sin CLI/credenciales |

## 7. Documentación

| Ámbito | Líneas con términos comerciales | Tipo | Acción |
|---|---|---|---|
| `docs/velarix/` | ~1.177 | HISTORICAL_CONTEXT | Marcar como histórico en [[99-archive]]; no borrar |
| `docs/velarix-v5/` | ~139 | HISTORICAL_CONTEXT (el v5 explica por qué se abandonó lo comercial) | Canónico; no se edita |
| `Negocio*.md`, `NEGOCIO_V4_VELARIX.md` (raíz del repo) | ~346 | HISTORICAL_CONTEXT | Marcados en [[99-archive]]; no se mueven (los citan documentos v5) |
| Docs activos (`docs/*.md`, `modules/`, `decisions/`) | 64 | Mezcla | Las menciones a la "demo pública" pasan a ser ACTIVE_CONTRADICTION tras ADR-007 → se actualizan; el resto es contexto histórico explícito |
| `README.md`, `CLAUDE.md` | 6 | ACTIVE_CONTRADICTION ("demo pública") | Reescribir |

## 8. Resultado (ejecutado en la rama `personal-workbench`)

| Acción | Estado |
|---|---|
| `/` → `/workbench` o `/auth`; sin demo pública; rutas legacy redirigen | ✅ `1a52f2e` |
| Workbench con secciones A–K, Quick Model no canónico y Review Center embebido | ✅ `1a52f2e` |
| Registro público retirado de la UI | ✅ (desactivar signups en Supabase Auth: pendiente, es un ajuste remoto) |
| Copy comercial (Auth, QA, progreso, PDF, `index.html`, `robots.txt`, emails) | ✅ (el email requiere redeploy de la Edge Function) |
| Prompt de `generate-narrative` | ⏸ NEEDS_DECISION, no se tocó |
| `types.ts` con las tablas del Expediente | ✅ (a mano, idéntico a la migración) |
| Schema remoto | No se tocó: no hubo migraciones, drops ni cambios de RLS |
| Documentación comercial histórica | Marcada `HISTORICAL / SUPERSEDED` (19 archivos), sin borrar nada |
