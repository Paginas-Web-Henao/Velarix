# 05 — Seguridad, Datos y RLS

Ninguna política ni archivo fue modificado durante esta auditoría.

## Nota de nomenclatura — CONTRADICCIÓN

`Negocio_Velarix_v4.1.md` §13.2 nombra `user_profiles`, `parsed_documents`,
`account_mappings`, `narrative_reports`. El esquema real usa `profiles`,
`documents_parsed`, `account_homologations`, `report_narratives`. No es un
riesgo de seguridad, pero dificulta auditar por nombre — ver
`11-CONTRADICCIONES-NEGOCIO-CODIGO.md`.

## RLS

VERIFICADO — todas las tablas del negocio tienen
`ENABLE ROW LEVEL SECURITY` (migraciones `20260320164123`, `20260320180111`,
`20260322202441`).

### RIESGO — escalamiento de privilegios en `profiles.role`

`20260320164123...sql:278-281`:
```sql
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);
```
Sin `WITH CHECK`, sin restricción de columnas. Cualquier usuario
autenticado puede ejecutar
`supabase.from('profiles').update({role:'admin'}).eq('id', auth.uid())` y
auto-asignarse `role`. VERIFICADO que `role` (default `'user'`) existe y
**no se usa en ninguna política RLS ni en ningún componente frontend**
(grep sin resultados de uso real más allá del tipo generado). El campo
existe pero no protege nada hoy — es una bomba de tiempo para cuando se
implemente control de rol basado en él.

### BLOQUEANTE — panel "admin" sin control de rol real

`src/App.tsx:43-44` protege `/admin/revisiones` y
`/admin/revisiones/:revisionId` solo con `ProtectedRoute` (= usuario
autenticado, sin chequeo de `role`). `AdminReviews.tsx`/`AdminReviewDetail.tsx`
no verifican rol en ningún punto. La única barrera real es la RLS de
`manual_reviews` (`FOR ALL USING (analysis_id IN (SELECT id FROM analyses
WHERE user_id = auth.uid()))`, `20260320180111...sql:35-37`) — limita a
"propias", así que un cliente **no ve** revisiones de otros clientes, pero
**sí puede auto-aprobar o auto-bloquear su propia revisión manual**
navegando a `/admin/revisiones` y usando `aprobarRevision`/`bloquearRevision`
(`manual-review-api.ts:234-341`), sin que ningún analista humano
intervenga. Rompe el propósito de negocio del flujo de revisión manual
(`Negocio_Velarix_v4.1.md` §8.3: "La IA nunca aprueba por sí sola un
entregable").

### RIESGO — políticas `USING (true)` en datos de referencia

`external_snapshots`, `data_sources`, `snapshot_updates`, `update_jobs_log`
— SELECT abierto a cualquier autenticado. Datos no confidenciales de
clientes (benchmarks Damodaran, tasas macro), riesgo bajo/aceptable,
documentado por completitud.

VERIFICADO — `job_locks` usa `USING (false)`, correcto (solo accesible vía
service role).

## Storage

VERIFICADO — 2 buckets, ambos `public: false`: `financial-documents`
(`20260320180111...sql:56-63`, políticas por carpeta `= auth.uid()::text`)
y `reportes-pdf` (`20260323003518...sql:2-18`, mismo patrón).

VERIFICADO — sin `getPublicUrl` ni `createSignedUrl` en todo el repo; toda
descarga pasa por Edge Functions con service role. Correcto en diseño.

`reportes-pdf` tiene bucket + políticas pero **nunca se usa** (los PDF se
generan 100% en cliente). Sin impacto de seguridad actual, indica
funcionalidad de negocio no implementada.

Como no hay descarga entre clientes (todo filtrado por carpeta
`auth.uid()`), no se pudo demostrar ni refutar desde el código una fuga
cruzada vía Storage — el diseño es correcto **si** `storage_path` siempre
se genera con `${user.id}/...` (confirmado en `upload-document/index.ts:78`).

## Secretos y variables de entorno

VERIFICADO — variables por función (ver tabla completa en
`08-INFRAESTRUCTURA-E-INTEGRACIONES.md`): `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`/`SUPABASE_PUBLISHABLE_KEY`,
`ANTHROPIC_API_KEY`, `APP_URL`, `RESEND_API_KEY`.

VERIFICADO — `upload-document/index.ts:18` usa indebidamente
`VITE_SUPABASE_URL` como fallback server-side (mezcla convención
client-only con backend; no es fuga, es mala práctica).

VERIFICADO — `.env` local solo contiene las 3 variables `VITE_*`, sin
valores asignados; ningún secreto de servidor vive ahí.

VERIFICADO — frontend (`import.meta.env`) solo usa `VITE_SUPABASE_URL` y
`VITE_SUPABASE_PUBLISHABLE_KEY`. Ningún secreto de servidor expuesto al
bundle.

VERIFICADO — `.gitignore` cubre `.env`/`.env.local`; `git log --all -- .env`
no devuelve commits — nunca se subió al historial.

VERIFICADO — sin secretos hardcodeados (búsqueda de patrones `sk-ant-`,
asignaciones literales, JWT-like strings — sin resultados).

## Auth

VERIFICADO — `AuthContext.tsx` usa API estándar de Supabase, sin lógica
custom insegura. `ProtectedRoute`/`AuthRoute` (`App.tsx:18-23`) separan
login/dashboard por estado de sesión, sin ningún nivel de rol.

RIESGO menor — contraseña mínima de 6 caracteres en frontend; NO
VERIFICABLE si Supabase Auth aplica un mínimo mayor a nivel de proyecto.

### Patrón IDOR — 7 de 9 funciones lo hacen bien

VERIFICADO — validan correctamente `analysis.user_id === user.id` tras
`anonClient.auth.getUser(...)`: `parse-document`, `map-accounts`,
`validate-analysis`, `build-structured-input`, `generate-narrative`,
`upload-document`, `run-analysis-pipeline`.

### BLOQUEANTE — IDOR confirmado en `ejecutar-calculo`

`supabase/functions/ejecutar-calculo/index.ts:244-263`. Solo exige que
exista *algún* header `Authorization` (línea 245) — **nunca llama a
`.auth.getUser()`**, **nunca compara `analysis.user_id`**. Usa
`serviceRoleKey` para leer/escribir cualquier `analysis_id` del body.
Dado que `supabase/config.toml` no declara ningún override de
`verify_jwt`, el gateway de Supabase exige un JWT *válido* a nivel de
plataforma — pero la propia clave pública `anon`/`VITE_SUPABASE_PUBLISHABLE_KEY`
(visible en el bundle del frontend) **es** un JWT válido firmado por el
proyecto, por lo que satisface esa verificación de plataforma (INFERIDO,
basado en comportamiento estándar documentado de Supabase Edge Functions).
Resultado: cualquiera con la clave anon pública puede invocar
`ejecutar-calculo` con el `analysis_id` de **cualquier cliente** y recibe
en la respuesta `enterprise_value`, `equity_value`, `wacc`, `ev_ebitda` de
esa empresa (líneas 311-320), además de sobrescribir
`analyses.calculation_result` de esa empresa.

### BLOQUEANTE — sin ninguna autenticación en `continuar-tras-revision`

`supabase/functions/continuar-tras-revision/index.ts:10-19`. No lee
`Authorization`, no llama `getUser`, no valida propiedad del
`analysis_id`. Usa service role directamente. Es la función que hace
avanzar el pipeline saltándose el bloqueo de revisión manual. Cualquiera
con el `analysis_id` de cualquier empresa puede forzar el avance de esa
validación bloqueada de otra empresa.

### RIESGO — sin autenticación en `update-snapshots`

`supabase/functions/update-snapshots/index.ts:46-53`: acepta `body.macro`
sin control de acceso y sobreescribe `macro_payload` de **todos** los
snapshots vigentes — integridad de datos compartidos por todos los
clientes.

### RIESGO — sin autenticación en `check-data-freshness` y `enviar-notificacion`

`check-data-freshness`: no acepta input sensible, impacto bajo (posible
spam de logs). `enviar-notificacion` (`index.ts:112-134`): no valida quién
llama; permite a cualquiera disparar correos (con datos de EV/WACC/margen
en el cuerpo, líneas 169-176) hacia el cliente legítimo con solo
adivinar/conocer un `analysis_id`. Riesgo de espionaje de existencia de
análisis + posible email-bombing, no de fuga directa al llamante.

## Datos enviados a proveedores externos (IA)

Todas las llamadas vía `_shared/anthropic-client.ts`, sin logging del
contenido enviado.

- `parse-document` (fallback, líneas 543-550): envía hasta 6000-8000
  caracteres del **contenido crudo del documento** — potencialmente el
  estado financiero completo, incluyendo cualquier encabezado con razón
  social/NIT que el archivo original contenga. INFERIDO: sin redacción ni
  anonimización previa.
- `map-accounts` (líneas 256-263): envía el **documento completo** de
  filas contables extraídas (hasta 8000 caracteres), etiquetas y valores
  por período — no un resumen.
- `generate-narrative` (líneas 344-347, 403): envía explícitamente
  `analysis.company_name` (razón social) y `analysis.sector` junto con
  KPIs calculados. VERIFICADO: no existe campo NIT en el esquema, por lo
  que el NIT nunca se envía (no existe como dato) — pero el **nombre real
  de la empresa sí se envía** a un proveedor externo junto a sus cifras
  financieras.

## Auditoría y logs

CONFIRMADO — ausencia de auditoría de descargas: ningún `event_type` en
`audit_events` corresponde a una descarga de documento original o PDF
generado (porque además no existe ningún flujo server-side que sirva esas
descargas — los PDF se generan 100% en el navegador).

RIESGO — datos financieros/PII en logs:
- `enviar-notificacion/index.ts:241`: loguea el email real del cliente
  cuando `RESEND_API_KEY` no está configurado.
- `ejecutar-calculo/index.ts:254,285`: loguea `analysis_id` y
  `enterprise_value`.
- `run-analysis-pipeline/index.ts:194-195`: loguea claves del input
  estructurado y el `revenue` de la empresa.

## CORS

VERIFICADO — las 12 Edge Functions usan
`"Access-Control-Allow-Origin": "*"`. Combinado con los 2 bugs BLOQUEANTES
de IDOR, amplía la superficie: cualquier sitio web (no solo el frontend
oficial) puede invocar esas funciones desde el navegador de una víctima.

## Eliminación de datos

CONFIRMADO (ausencia) — no existe eliminación real. Único mecanismo:
soft-delete (`analyses.deleted_at`). Sin `DELETE FROM` real, sin
`storage.remove()` en todo el repo, sin job de purga ni endpoint de
"derecho al olvido". Los documentos originales permanecen indefinidamente
en Storage aunque el análisis se "elimine" desde el dashboard.

## Resumen de severidad (más graves primero)

1. **BLOQUEANTE** — `continuar-tras-revision` sin ninguna autenticación → permite saltar el control de revisión manual de cualquier cliente.
2. **BLOQUEANTE** — `ejecutar-calculo` sin verificación de sesión ni de ownership → fuga cruzada de valoración financiera.
3. **BLOQUEANTE** — `/admin/revisiones` sin control de rol → un cliente puede auto-aprobar/auto-bloquear su propia revisión, anulando el control de calidad humano.
4. **RIESGO** (latente) — `profiles` UPDATE sin `WITH CHECK` → auto-asignación de `role`, explotable si se implementa control de rol.
5. **RIESGO** — `update-snapshots` y `enviar-notificacion` sin autenticación.
6. **RIESGO** — datos financieros completos + nombre de empresa enviados a Anthropic sin anonimización.
7. **RIESGO** — sin auditoría de descargas ni eliminación real de datos.
8. **RIESGO menor** — CORS `*` en las 12 funciones; PII/cifras en logs; contraseña mínima de 6 caracteres.
9. **CONTRADICCIÓN** — nomenclatura de tablas negocio vs. esquema real; `reportes-pdf`/`generated_reports` sin uso funcional.
