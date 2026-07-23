# 03 — Flujos End-to-End

Para cada flujo: inicio, pasos reales, datos persistidos, errores,
reintentos, permisos, resultado, cobertura de pruebas, rutas muertas.
Toda la evidencia es VERIFICADO por lectura directa de código, salvo donde
se marque lo contrario.

## 1. Estimador rápido (demo, sin login)

- **Inicio**: `src/components/demo/DemoDashboard.tsx` / `ValuationTeaser.tsx`.
- **Pasos**: formulario corto → `financial-engine.ts::runAnalysis`/`quickValuation`, 100% cliente, sin llamada a Supabase (confirmado por grep, cero referencias a `supabase`/`fetch` en `src/components/demo/`).
- **Datos persistidos**: ninguno (no hay `INSERT` en este flujo).
- **Errores/reintentos**: no aplica (cálculo síncrono en memoria).
- **Permisos**: público, sin login. Pestañas "Proyecciones/Valuación/Benchmarks/Reporte" bloqueadas (`SeccionBloqueada`) para no autenticados; la pestaña "Reporte" se oculta con `return null` real, no `disabled` — VERIFICADO, cumple la regla de negocio.
- **Cobertura de pruebas**: ninguna.
- **Ruta muerta**: ninguna detectada en este flujo específico.

## 2. Autenticación

- **Inicio**: `src/pages/Auth.tsx`, `src/contexts/AuthContext.tsx`.
- **Pasos**: `supabase.auth.{signUp,signInWithPassword,signOut,resetPasswordForEmail,updateUser}` directos. Trigger SQL `handle_new_user` crea fila en `profiles` al signup.
- **Datos persistidos**: `profiles` (vía trigger), sesión en `auth.users` (gestión de Supabase).
- **Errores**: manejados con `toast.error` en el frontend.
- **Reintentos**: ninguno automático; el usuario reintenta manualmente.
- **Permisos**: público (`/auth`, `/reset-password`); `AuthRoute` redirige a `/dashboard` si ya hay sesión.
- **Cobertura de pruebas**: ninguna.
- **Nota de seguridad**: contraseña mínima de 6 caracteres en frontend (`Auth.tsx:31`); no verificable si Supabase Auth aplica un mínimo mayor a nivel de proyecto.

## 3. Creación de análisis

- **Inicio**: `NewAnalysisStepper.tsx::handleStep1`.
- **Pasos**: `INSERT` directo a `analyses` desde el cliente (no pasa por Edge Function), protegido solo por RLS (`user_id = auth.uid()`).
- **Datos persistidos**: fila en `analyses` (sector, moneda, expected_growth, status inicial).
- **Errores/reintentos**: `toast.error`, sin reintento automático.
- **Permisos**: RLS por `user_id`.
- **Cobertura de pruebas**: ninguna.

## 4. Carga de documentos

- **Inicio**: `src/components/dashboard/DocumentUpload.tsx::uploadFile` → Edge Function `upload-document`.
- **Pasos**: valida `Authorization` y ownership del `analysis_id`; valida tamaño (≤10MB) y MIME (PDF/XLSX/XLS/CSV); calcula SHA-256; sube a `financial-documents` en ruta `{user_id}/{analysis_id}/{doc_type}_{timestamp}_{filename}`; inserta `documents`; actualiza `analyses.status = "documentos_cargados"`; inserta `audit_events`.
- **Errores**: marca `documents.processing_status` según corresponda; `toast.error` en frontend.
- **Reintentos**: ninguno (ni frontend ni backend).
- **Permisos**: verificación de ownership VERIFICADA en la propia función (`upload-document/index.ts:54-58`).
- **Cobertura de pruebas**: ninguna.

## 5. Parseo

- **Inicio**: Edge Function `parse-document`, invocada por `run-analysis-pipeline`.
- **Pasos**: descarga archivo, detecta formato por magic bytes, extrae filas con parsers artesanales (regex sobre PDF crudo `BT...ET`/`Tj`, hojas Excel, CSV); si <3 filas con valor, fallback a IA (Anthropic) con hasta 6000-8000 caracteres del contenido; detecta convención de signos, escala y moneda; clasifica tipo de documento y períodos vía IA; guarda `documents_parsed`.
- **Errores**: marca `documents.processing_status = "fallido"`, lanza error 500 con mensaje; en la extracción por formato, `catch (e) { console.error(...) }` con fallback a IA (aceptable, hay red de seguridad).
- **Reintentos**: ninguno explícito.
- **Permisos**: verifica ownership (`parse-document/index.ts:487,493-494`).
- **Cobertura de pruebas**: ninguna.
- **Bug relevante**: `moneda_documento` y `factor_escala` calculados internamente nunca se persisten en `parsing_metadata` — ver `04-CALIDAD-FINANCIERA.md`, hallazgo (C).

## 6. Homologación de cuentas (mapping)

- **Inicio**: Edge Function `map-accounts`, invocada por `run-analysis-pipeline` (también invocable de forma independiente, sin lock propio).
- **Pasos**: Pass 1 basado en reglas locales (`TAXONOMY`); Pass 2 vía IA para cuentas no clasificadas; escribe `account_homologations` (con `DELETE` previo del mismo `analysis_id`, idempotente en re-ejecución secuencial pero **no** ante ejecución concurrente — ver `06-CALIDAD-CODIGO-Y-PRUEBAS.md`).
- **Errores**: si `callAnthropic` falla, el bloque de IA se salta silenciosamente (`if (aiResult)`), dejando cuentas `"unclassified"` sin avisar al usuario.
- **Reintentos**: ninguno.
- **Permisos**: verifica ownership (`map-accounts/index.ts:168-175`).
- **Cobertura de pruebas**: ninguna.
- **Bug relevante**: `has_blocking_issues` retorna siempre `false` (hardcodeado, `map-accounts/index.ts:354`) — el chequeo de cuentas críticas faltantes en `run-analysis-pipeline` nunca se activa. Código muerto que aparenta ser un control de calidad.

## 7. Validación

- **Inicio**: Edge Function `validate-analysis`.
- **Pasos**: evalúa ~20 reglas; **política explícita en el código: solo las reglas `DOC_*` bloquean**, el resto (incluyendo `BAL_001`) nunca bloquea — coherente con la regla de negocio confirmada.
- **Errores**: si la validación bloquea, `run-analysis-pipeline` marca `analyses.status = "validacion_bloqueada"` y dispara `enviar-notificacion` (`analisis_bloqueado`).
- **Permisos**: verifica ownership.
- **Cobertura de pruebas**: ninguna.

## 8. Structured input

- **Inicio**: Edge Function `build-structured-input`.
- **Pasos**: consolida `account_homologations` (vía `getAccountValue`, ver bug crítico en `04-CALIDAD-FINANCIERA.md`), aplica conversión de moneda/escala (que en la práctica nunca detecta divergencia por el bug de persistencia de `parse-document`), adjunta snapshot sectorial (de `external_snapshots` por sector-slug, que nunca coincide con `analysis.sector` guardado como label — ver hallazgo (A) en `04-CALIDAD-FINANCIERA.md` —, así que siempre cae al fallback hardcodeado), guarda `structured_inputs`.
- **Errores**: timeout de 55s vía `AbortController`; si aborta, retorna **HTTP 200 con `success:false`**, inconsistente con los 400/500 de los otros pasos.
- **Permisos**: verifica ownership.
- **Cobertura de pruebas**: ninguna.

## 9. Cálculo

- **Inicio**: Edge Function `ejecutar-calculo`.
- **Pasos**: motor DCF inline (WACC vía CAPM/Hamada, proyección 5 años, valor terminal Gordon Growth, sensibilidad ±1% y matriz 5×5); guarda en `analyses.calculation_result` (columna JSONB).
- **Errores**: marca `error_tecnico`, libera lock, retorna 200 con error.
- **Permisos — BLOQUEANTE**: **no verifica ownership**. Exige un header `Authorization` no vacío pero nunca llama a `auth.getUser` ni compara `analysis.user_id`. Ver `05-SEGURIDAD-DATOS-RLS.md`.
- **Cobertura de pruebas**: ninguna.
- **Resultado real**: `analyses.calculation_result` **no lo lee ningún componente del frontend** (grep confirma 0 usos) — el cálculo se computa, se guarda, y nunca se vuelve a leer. Ver `04-CALIDAD-FINANCIERA.md` para el bug de `totalDebt` latente en este motor.

## 10. Narrativa

- **Inicio**: Edge Function `generate-narrative`.
- **Pasos**: 14 secciones narrativas vía IA + motor de riesgos determinístico + recomendaciones + auditor de consistencia (6 criterios); guarda `report_narratives`; dispara `enviar-notificacion` (`analisis_completado`) solo si la auditoría pasa.
- **Permisos**: verifica ownership.
- **Cobertura de pruebas**: ninguna.
- **RUTA MUERTA — CONFIRMADA**: esta función **no se invoca desde `run-analysis-pipeline`** ni desde ningún componente del frontend (el wrapper `api-client.ts::generateNarrative` existe pero nunca se llama). `report_narratives` queda vacía en el flujo real de producto. `enviar-notificacion` con `tipo: "analisis_completado"` nunca se dispara en producción real como consecuencia directa.

## 11. Revisión manual

- **Inicio**: `src/pages/AdminReviews.tsx` / `AdminReviewDetail.tsx` → `src/lib/manual-review-api.ts` → Edge Function `continuar-tras-revision`.
- **Pasos**: crear → tomar → corregir cuentas → aprobar/bloquear → reanudar (reconstruye `structured_inputs` desde `account_homologations` corregidas).
- **Datos persistidos**: `manual_reviews`, `audit_events`.
- **Permisos — BLOQUEANTE doble**:
  1. `/admin/revisiones*` solo exige usuario autenticado (`ProtectedRoute`), sin verificación de rol.
  2. RLS de `manual_reviews` filtra por `analysis_id IN (SELECT id FROM analyses WHERE user_id = auth.uid())` — es decir, cada usuario solo ve/aprueba **sus propias** revisiones, permitiendo auto-aprobación.
  3. `continuar-tras-revision` **no valida ninguna autenticación** (ver `05-SEGURIDAD-DATOS-RLS.md`).
- **Cobertura de pruebas**: ninguna.

## 12. Generación de PDF y entrega

- **Inicio**: `src/pages/Dashboard.tsx::handleDownloadPDF`, invocado desde `ReportsGallery.tsx`.
- **Pasos**: lee **solo** `structured_inputs.input_payload` (no `calculation_result` ni `report_narratives`); rellena con `DEFAULT_INPUTS` donde falte; ejecuta `runAnalysis()` de `financial-engine.ts` (recálculo completo, cliente, "deterministic, no AI"); llama `generatePDF(result, inputs, "ejecutivo")`.
- **Errores**: `toast.error`.
- **Reintentos**: ninguno.
- **Permisos**: ruta protegida (`/dashboard`), sin control adicional dentro del componente.
- **Cobertura de pruebas**: ninguna.
- **Resultado**: el PDF descargado es producto de un segundo motor de cálculo, independiente del pipeline server-side con IA/homologación validada. Nunca se persiste (ni en Storage ni en `generated_reports`).

## 13. Notificaciones

- **Inicio**: Edge Function `enviar-notificacion`, invocada fire-and-forget desde `generate-narrative` (huérfana, ver #10), `run-analysis-pipeline` (2 casos: `analisis_bloqueado`, `error_analisis`).
- **Permisos — RIESGO**: no valida ningún `Authorization`/JWT; cualquiera con la clave `anon` puede invocarla para cualquier `analysis_id`.
- **Bug de esquema**: lee de la tabla `calculation_results` (nunca poblada; el dato real vive en la columna `analyses.calculation_result`) — el correo de "análisis completado" siempre mostraría "N/D" en EV/WACC/margen aunque llegara a dispararse.
- **Cobertura de pruebas**: ninguna.

## 14. Eliminación de datos

- **Confirmado por ausencia**: no existe ningún endpoint ni Edge Function que borre filas reales. `Dashboard.tsx::handleDelete` y `api-client.ts::eliminarAnalisis`/`deleteAnalysis` solo hacen `UPDATE analyses SET deleted_at = now()` (soft-delete). Ningún `storage.remove()` en todo el repo — los documentos originales permanecen indefinidamente en Storage aunque el análisis se "elimine" desde el dashboard. Sin endpoint de eliminación de cuenta.
