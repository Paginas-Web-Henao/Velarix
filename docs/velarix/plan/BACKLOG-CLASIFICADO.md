# Backlog Clasificado

Todos los hallazgos de esta auditoría, consolidados por causa raíz (sin
duplicar el mismo defecto en varias filas). Referencia cruzada a
`MATRIZ-DE-RIESGOS.md` (R-xx) y `auditoria/11-CONTRADICCIONES-NEGOCIO-CODIGO.md`
(C-xx) donde aplica.

> **Actualizado 2026-07-23 (v2, tras D-07)**: la columna "Fase" referencia
> ahora los **cinco** bloques de la Fase 1 (1A/1B/1C/1D/1E, no cuatro).
> Cambios de esta revisión: `BL-01` se divide en diseño (1A) y activación
> (1E); `BL-06` se corrige en 1B, no en 1A; `BL-08` se corrige para exigir
> autorización privilegiada, no solo ownership; `BL-10` se mueve de Fase 2
> a **1D, P0**; `BL-18` **vuelve** a Fase 2 P2 (no se adelanta a 1D — solo
> un helper mínimo si es necesario); `BL-16` y `BL-20` pasan a depender de
> **1E**, no de 1A; nacen `BL-29`, `BL-30`, `BL-31`, `BL-32`.

> **Actualizado 2026-07-23 (cierre documental de Bloque 1A, con
> limitación técnica registrada)**: `BL-26`, `BL-27`, `BL-28` (diseño),
> `BL-31` y `BL-32` (diseño) quedan **cerrados** — ver
> `docs/velarix/bloque-1a/REPORTE-CIERRE-BLOQUE-1A.md` para el detalle y
> los archivos entregados. `BL-30` **no está completamente terminado**:
> BL-04 tiene prueba de especificación ejecutable; BL-02, BL-03 y BL-05
> tienen evidencia de trazado manual, pero sus pruebas de especificación
> ejecutables siguen **pendientes**
> (`docs/velarix/bloque-1a/BL-30-evidencia-pruebas-especificacion.md`).
> La evidencia manual confirma la causa aparente de cada bug; **no
> reemplaza** una prueba automatizada, y **ningún bug puede marcarse
> corregido únicamente mediante trazado manual**. El primer paso
> obligatorio de Bloque 1B es habilitar un entorno de pruebas para las
> Edge Functions mediante Deno, o extraer la lógica financiera pura a
> módulos probables desde Vitest con un refactor mínimo y controlado —
> solo después de tener esa prueba ejecutable y roja se procede a corregir
> BL-02, BL-03 o BL-05. Ni `BL-01` (activación), ni `BL-02/03/04/05`
> (corrección real), ni `BL-29` quedan resueltos por este cierre — siguen
> abiertos para 1B/1E.

> **Actualizado 2026-07-23 (Bloque 1D-P0)**: `BL-07`, `BL-08` y el
> recorte P0 de `BL-09` quedan **corregidos y en el código** — ver
> `docs/velarix/bloque-1d/REPORTE-IMPLEMENTACION-1D-P0.md`. `BL-10`
> queda **corregido solo en la migración SQL local** — la migración
> (`supabase/migrations/20260723090000_bloque_1d_bl10_role_protection.sql`)
> **no se aplicó** a ningún Postgres; hasta que un administrador la
> aplique explícitamente, la brecha de auto-escalamiento de `profiles.role`
> sigue existiendo en cualquier entorno real. El sistema completo de
> asignación entre múltiples analistas (parte de `BL-09`) sigue en Fase 2,
> sin tocar.

> **Actualizado 2026-08-05 (Bloque 1D-OPS — CERRADO)**: `BL-10` queda
> **aplicado y verificado** en el proyecto Supabase de desarrollo (vacío,
> sin datos reales) — la brecha de auto-escalamiento ya no existe.
> `ejecutar-calculo` y `continuar-tras-revision` desplegadas (`ACTIVE`),
> con autenticación mixta implementada explícitamente en el código
> (`verify_jwt: false`, justificado — la puerta de entrada de Supabase no
> reconoce el formato de secret key nuevo) y migradas por completo a
> `SUPABASE_SECRET_KEYS`/`SUPABASE_PUBLISHABLE_KEYS` tras el incidente de
> exposición de la legacy `service_role`. 15 pruebas SQL/RPC/RLS + 10
> escenarios de autenticación + reglas de negocio (ownership, roles,
> idempotencia) reverificadas por HTTP real. Primer administrador real
> (cuenta del fundador) identificado sin ambigüedad y promovido mediante
> bootstrap protegido, sin tocar su contraseña — verificado que no puede
> autoescalarse y sí puede operar sobre otros usuarios. **1D queda
> cerrado.** Ver `docs/velarix/bloque-1d/REPORTE-ACTIVACION-1D.md`.

> **Actualizado 2026-08-05 (saneamiento P0 de claves legacy)**: las otras
> 10 Edge Functions que dependían de `SUPABASE_SERVICE_ROLE_KEY`/
> `SUPABASE_ANON_KEY` fueron migradas en una sesión separada, cerrando
> también `BL-11` (ver abajo) como consecuencia directa. Pendiente:
> revocar manualmente la legacy `service_role`/`anon` desde el dashboard
> de Supabase — ya no tiene consumidores operativos conocidos en este
> repositorio. Ver
> `docs/velarix/seguridad-credenciales/REPORTE-MIGRACION-CLAVES-LEGACY.md`.

> **Actualizado 2026-07-23 (Bloque 1B-M + 1C-Prep)**: 12 diferencias
> cliente/servidor de `BL-26` clasificadas en 5 categorías (ver
> `docs/velarix/bloque-1b-metodologia/REPORTE-RECONCILIACION-METODOLOGICA.md`).
> 3 bugs técnicos corregidos directamente (2 variables muertas, 2 KPIs
> demo con evaluación engañosa en el PDF — el cambio de escenarios que se
> había aplicado copiando el criterio del cliente resultó ser una
> decisión metodológica no autorizada y fue **revertido** en el cierre
> técnico de 2026-07-23, no cuenta como corrección). `BL-17` avanza
> parcialmente (`_shared/financial-methodology.ts`). **10 decisiones
> metodológicas quedan pendientes de aprobación** — ninguna se decidió
> silenciosamente (ver `DECISIONES-FINANCIERAS-PENDIENTES.md`). `BL-14`
> avanza como **preparación técnica** (3 casos dorados provisionales, no
> formales, no aprobados por ningún revisor); en el cierre técnico se
> agregó además el motor servidor canónico extraído y ejecutable
> (`_shared/canonical-financial-engine.ts`, `runCanonicalFinancialEngine`)
> con regresiones numéricas reales (19 pruebas) — Bloque 1C como tal
> **sigue sin iniciarse**. `BL-15` sigue sin tocar.

> **Actualizado 2026-07-23 (Bloque 1C-T)**: `BL-15` avanza de "sin
> tocar" a **parcial** — trazabilidad técnica real implementada
> (`_shared/calculation-provenance.ts`) desde `account_homologations`
> hasta `structured_inputs`/`calculation_result` para 8 cifras
> priorizadas, con `source_row_ids` explícitamente `"missing"`
> (limitación real del esquema, documentada, no inventada). `BL-32`
> avanza de "diseño" a **implementación parcial** —
> `_shared/calculation-versioning.ts` agrega `canonical_engine_version`,
> `methodology_version` (derivado de `CANONICAL_METHODOLOGY`, sin
> duplicar) y un `input_fingerprint` determinístico
> (`_shared/calculation-fingerprint.ts`) a cada `calculation_result`. Ver
> `docs/velarix/bloque-1c/REPORTE-IMPLEMENTACION-1C-TECNICO.md` y
> `docs/velarix/bloque-1c/PAQUETE-REVISION-FINANCIERA.md`. El motor
> canónico no se modificó — A/B/C sin cambios. Bloque 1C formal **sigue
> sin cerrarse**: falta la aprobación del revisor financiero externo y la
> conexión al PDF (exclusiva de 1E).

> **Actualizado 2026-08-06 (respuesta del fundador a 1B-M + cierre parcial
> de `R-19`)**: el fundador respondió las 10 decisiones metodológicas
> pendientes — ver
> `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md`.
> Ningún `BL-XX` de esta tabla queda cerrado por esa respuesta (ninguno
> de los 32 la referencia directamente como criterio de cierre). Efecto
> indirecto real: la mitad de la superficie de `R-19`
> (`plan/MATRIZ-DE-RIESGOS.md`) — el cliente veía controles de WACC/
> CAPEX/impuestos que el servidor siempre ignoraba — se corrigió al
> retirar esos controles de `src/components/demo/DemoInputsForm.tsx`
> (Decisión 9). La pregunta de fondo de `R-19` (si el servidor debería
> leer esos 7 supuestos del input alguna vez) permanece abierta, ahora
> registrada como Etapa futura en
> `docs/velarix/bloque-1b-metodologia/ROADMAP-METODOLOGIA-DINAMICA.md`.
> También se implementó, en la misma sesión, el bloqueo de `revenue <= 0`
> en ese mismo formulario (Decisión 10A) — no corresponde a ningún
> `BL-XX` existente, es una corrección de UX de bajo riesgo, no un
> hallazgo de la auditoría original.
> **Actualizado 2026-08-10 (`D-09`, reorientación boutique expert-led;
> precisada el mismo día tras corrección del fundador)**: ver
> `docs/velarix/plan/REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md` y
> `Negocio_Velarix_v4.2.md`. Ningún `BL-XX` existente cambia de estado por
> esta actualización. Se agregan tres filas nuevas al final de esta
> tabla: `BL-33` (Expediente de Valoración V1, especificado no
> implementado), `BL-34` (Biblioteca **automatizada** de casos —
> ingestión, interfaz, scraping — diferida) y `BL-35` (estudio **manual**
> de casos públicos, primer caso Tecnoglass — **activo desde ahora**, sin
> depender de `BL-33` ni de un revisor financiero externo).

| ID | Título | Descripción | Categoría | Severidad | Prioridad | Fase | Dependencia | Evidencia | Criterio de aceptación | Revisión requerida |
|---|---|---|---|---|---|---|---|---|---|---|
| BL-01 | Motor de cálculo oficial: diseño (1A) y activación (1E) | **Decisión ya tomada y aprobada (`D-06`/`D-07`)**: el pipeline del servidor es canónico. El diseño del contrato y de la estrategia de transición se hace en 1A; la conexión real de PDF/narrativa y la activación controlada se hacen en 1E, solo tras cerrar 1B/1C/1D | Arquitectura | Crítica | P0 | **Fase 1A (diseño) → Fase 1E (activación)** | 1A: ninguna. 1E: Bloques 1B, 1C y 1D cerrados | `auditoria/04`, `auditoria/02`, `R-04`, `REGISTRO-DE-DECISIONES.md` D-06/D-07 | 1A: contrato y estrategia documentados. 1E: PDF y narrativa consumen `calculation_result`; motor cliente acotado a Estimador/visualización/previsualización; activación solo en entorno controlado | Fundador (ya aprobó la decisión); revisor financiero valida la implementación en 1C/1E |
| BL-02 | Corregir consolidación de subcuentas — **[CORREGIDO EN 1B-P0]** | `getAccountValue`/`getVal`/`getValue` deben sumar todas las filas del mismo `canonical_account`+período, no tomar la primera | Financiero | Crítica | P0 | Fase 1B | Bloque 1A cerrado documentalmente, **pero la prueba de especificación ejecutable de `BL-30` para este bug sigue pendiente** (solo hay evidencia de trazado manual) — primer paso de 1B: habilitar Deno o extraer la lógica pura con refactor mínimo y controlado, y lograr que esa prueba falle antes de corregir | `auditoria/04` #1, `R-01` | Existe una prueba de especificación ejecutable que falla antes de la corrección y pasa después (no basta con la evidencia manual de 1A) | Revisor financiero externo |
| BL-03 | Corregir conversión de moneda — **[CORREGIDO EN 1B-P0]** | Persistir `moneda_documento`/`factor_escala` desde `parse-document` hasta `build-structured-input`, y activar la rama de conversión real | Financiero | Crítica | P0 | Fase 1B | Bloque 1A cerrado documentalmente, **pero la prueba de especificación ejecutable de `BL-30` para este bug sigue pendiente** (solo hay evidencia de trazado manual) — mismo primer paso que BL-02 | `auditoria/04` (C), `R-02` | Existe una prueba de especificación ejecutable que falla antes de la corrección y pasa después (no basta con la evidencia manual de 1A) | Revisor financiero externo |
| BL-04 | Corregir formato de moneda en PDF — **[CORREGIDO EN 1B-P0]** | Reemplazar `fUSD` hardcodeado por `formatMoneda(valor, moneda_analisis)` paramétrica en todo `pdf-generator.ts` | Financiero / Frontend | Crítica | P0 | Fase 1B | Bloque 1A completo | `auditoria/04` #2, `R-03` | Ningún PDF de un análisis en COP muestra "USD" (aplica ya en 1B sobre el PDF actual; se reconfirma en 1E sobre el PDF ya conectado) | Ninguna adicional (verificación visual + prueba automatizada) |
| BL-05 | Corregir campo de deuda en `ejecutar-calculo` — **[CORREGIDO EN 1B-P0]** | Leer `financial_debt_total` en vez de `total_debt`/`financial_debt` (inexistentes) — ya no es un bug latente: al ser el servidor el motor canónico, este bug es P0 real | Financiero | Crítica | P0 | Fase 1B | Bloque 1A cerrado documentalmente, **pero la prueba de especificación ejecutable de `BL-30` para este bug sigue pendiente** (solo hay evidencia de trazado manual) — mismo primer paso que BL-02/BL-03 | `auditoria/04` (B), `R-05` | Existe una prueba de especificación ejecutable que falla antes de la corrección y pasa después (no basta con la evidencia manual de 1A) | Revisor financiero externo |
| BL-06 | Detener el pipeline ante falla de `map-accounts` — **[CORREGIDO EN 1B-P0]** | Agregar `return`/abort explícito en el catch de `run-analysis-pipeline` cuando `map-accounts` lanza excepción, igual que los otros 4 pasos | Confiabilidad | Alta | P0/P1 | **Fase 1B** (corrección de confiabilidad del mismo pipeline que 1B interviene — no es tarea de diseño, se corrige junto con los demás bugs) | Ninguna | `auditoria/06`, `R-14` | Un fallo simulado de `map-accounts` detiene el pipeline y marca `error_tecnico`, sin continuar a validación | Ninguna adicional |
| BL-07 | Verificar ownership en `ejecutar-calculo` — **[CORREGIDO EN 1D-P0]** | Agregar `auth.getUser` + comparación `analysis.user_id === user.id`, igual que las demás funciones | Seguridad | Bloqueante | P0 | Fase 1D | Ninguna (independiente de 1A/1B/1C como bloque; coordinar en secuencia con 1A sobre el mismo archivo) | `auditoria/05`, `R-06` | Invocación directa con `analysis_id` ajeno y clave anon devuelve 403/404, no datos | Ninguna adicional (prueba de penetración simple) |
| BL-08 | Autorizar `continuar-tras-revision` (no solo autenticar) — **[CORREGIDO EN 1D-P0]** | **Corrección de alcance (D-07)**: no basta con verificar ownership — el propietario del análisis suele ser el cliente, y el cliente nunca debe poder aprobar/continuar su propia revisión. Debe verificarse que el llamante es analista autorizado, admin, o invocación interna legítima | Seguridad | Bloqueante | P0 | Fase 1D | Modelo de actores definido dentro del propio Bloque 1D | `auditoria/05`, `R-07` | Las 10 pruebas mínimas de 1D pasan, incluida "cliente propietario no puede aprobar su propio análisis" | Ninguna adicional |
| BL-09 | Impedir autoaprobación (recorte P0) + sistema completo de rol (Fase 2) — **[RECORTE P0 CORREGIDO EN 1D-P0; sistema completo sigue en Fase 2]** | Recorte mínimo en 1D: un cliente no puede aprobar/bloquear su propia revisión. Sistema completo (permisos por asignación entre múltiples analistas) en Fase 2 | Seguridad / Negocio | Bloqueante | P0 (recorte) / P1 (sistema completo) | **Recorte P0 en Fase 1D; sistema completo en Fase 2** | Recorte: ninguna. Sistema completo: al menos una segunda cuenta `analyst` real (dependencia de negocio) | `auditoria/05`, `auditoria/07`, `R-08` | Recorte: un cliente no puede autoaprobar. Sistema completo: permisos por asignación funcionando entre 2+ analistas | Fundador (define el modelo de rol exacto) |
| BL-10 | Cerrar `profiles` UPDATE contra auto-escalamiento de `role` — **[CERRADO EN 1D-OPS, 2026-08-05]** | Agregar `WITH CHECK` que excluya `role`, o mover `role` a tabla separada gestionada solo por service role. Corrección de finalización (2026-07-23): se eliminó del trigger un `INSERT` de auditoría que un `RAISE EXCEPTION` posterior habría revertido igualmente (no persistía); `admin_set_user_role` ahora devuelve `jsonb` estructurado en vez de lanzar excepción, para que sus rechazos sí se auditen. Rollback creado en `supabase/rollback/`. **Activación (1D-OPS)**: migración aplicada al proyecto Supabase de desarrollo (vacío, sin datos reales); verificada con 15 pruebas reales de SQL/RPC/RLS y HTTP autenticado contra `ejecutar-calculo`/`continuar-tras-revision` ya desplegadas. **Corrección de credenciales y autenticación mixta (2026-07-30 → 2026-08-05)**: legacy `service_role`/`anon` expuestas/retiradas del código (migrado a `SUPABASE_SECRET_KEYS`/`SUPABASE_PUBLISHABLE_KEYS`), autenticación mixta explícita implementada (`verify_jwt: false` justificado), y primer administrador real (fundador) configurado por bootstrap protegido — ver `docs/velarix/bloque-1d/REPORTE-ACTIVACION-1D.md` | Seguridad | Alta — **P0, no P1** (el control de rol de 1D no es válido mientras exista esta brecha) | **P0** | **Fase 1D — CERRADA** (movido desde Fase 2 — D-07) | Ninguna (puede resolverse antes o junto con BL-09) | `auditoria/05`, `R-09` | Un usuario no puede cambiar su propio `role` vía `UPDATE` directo — **verificado en Postgres real y por HTTP real (proyecto de desarrollo)** | Ninguna adicional |
| BL-11 | Autenticar `update-snapshots` y `enviar-notificacion` — **[CERRADO, 2026-08-05]** | Restringir a invocación por service role/cron, o agregar verificación mínima. Cerrado como consecuencia directa del saneamiento P0 de claves legacy: ambas funciones (más `check-data-freshness`, que tenía la misma brecha) ahora exigen `apikey` = secret key `default` y rechazan cualquier otra credencial — ver `docs/velarix/seguridad-credenciales/REPORTE-MIGRACION-CLAVES-LEGACY.md` | Seguridad | Media | P1/P2 → **Cerrado** | Fase 2 | Ninguna | `auditoria/05`, `R-10` | Invocación directa sin credenciales de servicio es rechazada — **verificado por HTTP real** | Ninguna adicional |
| BL-12 | Minimizar datos enviados a Anthropic | Evaluar qué campos son necesarios vs. contenido completo/nombre de empresa | Privacidad | Media | P1/P2 | Fase 2 | Revisión legal (§12.3, §12.4 del negocio) | `auditoria/05` §5, `R-11` | Documento de política de datos a IA aprobado por abogado externo, código ajustado en consecuencia | Abogado externo |
| BL-13 | Implementar eliminación real de datos | Borrado real de filas derivadas + `storage.remove()` de documentos originales, no solo soft-delete | Cumplimiento | Bloqueante | P1 | Fase 2 | Decisión legal sobre alcance de "eliminación completa" | `auditoria/05` §8, `R-12` | Una solicitud de eliminación borra documentos de Storage y filas derivadas, con registro en `audit_events` | Abogado externo |
| BL-14 | Crear casos dorados y pruebas de regresión del motor financiero — **[1C-PREP: 3 casos técnicos provisionales creados en 1B-M/1C-Prep, NO formales ni aprobados]** | Fixtures con datos conocidos y resultado esperado para WACC/DCF/consolidación/moneda, sobre el motor ya corregido | Calidad | Crítica | P1 | Fase 1C | Bloques 1A y 1B completos (no probar un motor que aún tiene bugs conocidos) | `auditoria/04`, `auditoria/06`, `R-13` | Suite de pruebas ejecuta en CI/local y falla si se reintroduce cualquiera de los bugs BL-02/03/04/05/06 | Revisor financiero externo |
| BL-15 | Agregar trazabilidad completa documento→cifra→PDF — **[PARCIAL en 1C-T: implementado hasta `calculation_result`, sin conectar al PDF]** | `_shared/calculation-provenance.ts` traza `homologation_ids`/`document_ids` para 8 cifras priorizadas desde `account_homologations` hasta `structured_inputs`/`calculation_result`. `source_row_ids` (fila cruda del documento) sigue `"missing"` — limitación real del esquema, no implementada. Extensión hasta el PDF sigue siendo tarea de 1E | Calidad / Negocio | Alta | P1 | Fase 1C (diseño en 1A, implementación parcial en 1C-T, verificación final en 1E cuando el PDF ya esté conectado) | Bloques 1A y 1B completos | `auditoria/04`, `plan/MATRIZ-DE-TRAZABILIDAD.md`, C-02, `docs/velarix/bloque-1c/REPORTE-IMPLEMENTACION-1C-TECNICO.md` | Se puede responder "¿de qué fila salió esta cifra del PDF?" sin reconstrucción manual, una vez cerrado 1E | Ninguna adicional |
| BL-16 | Auditar descargas de documentos/PDF | Registrar en `audit_events` cada descarga real, una vez el PDF se sirva/verifique desde un punto controlado del servidor | Seguridad | Alta | P1 | Fase 2 | **Bloque 1E completo** (antes no existe un punto server-side verificable de la descarga profesional) | `auditoria/05` §6, C-05 | Cada descarga de documento original o PDF queda registrada con usuario y timestamp | Ninguna adicional |
| BL-17 | Consolidar constantes macro/sectoriales a una fuente canónica fija — **[PARCIAL: `_shared/financial-methodology.ts` centraliza los 7+1 supuestos del servidor en 1B-M; no unifica con el cliente ni con build-structured-input]** | Unificar las 4 copias de Damodaran 2026 y las 5 copias de TRM/Rf/ERP en una sola fuente, versionada y determinística; corregir el mismatch slug/label. **No conectar automatización dinámica/cron/actualización en vivo de `external_snapshots`** — eso se difiere a Fase 7 | Deuda / Financiero | Alta | P2 | Fase 1B | Bloque 1A completo | `auditoria/04`, `auditoria/08`, `auditoria/10` | Un cambio de TRM en un solo lugar se refleja en todo el sistema; ninguna automatización dinámica conectada todavía | Revisor financiero externo |
| BL-18 | Extraer `_shared/cors.ts` y `_shared/auth.ts` (consolidación completa, 12 funciones) | Eliminar las 12 copias de `corsHeaders` y las 9+ copias del patrón de autenticación. **Permanece en Fase 2, P2** — el Bloque 1D solo puede escribir un helper mínimo acotado a las 2 funciones P0 (`ejecutar-calculo`, `continuar-tras-revision`) si es estrictamente necesario, no esta extracción general | Deuda | Media | P2 | **Fase 2** (no 1D) | Ninguna | `auditoria/06`, `auditoria/10` | Las 12 funciones importan desde `_shared/`, sin duplicación | Ninguna adicional |
| BL-19 | Tipar contratos de respuesta entre Edge Functions | Reemplazar `any` en `mapResult`/`buildResult` por tipos explícitos `{success, data, error}` | Deuda | Media | P2 | Fase 2 | Ninguna | `auditoria/06` | El compilador fuerza a manejar `success:false` explícitamente en `run-analysis-pipeline` | Ninguna adicional |
| BL-20 | Corregir gap de notificación tras auditoría de narrativa fallida + retirar `reporte_listo` muerto | Agregar disparo de notificación cuando `auditPassed=false`; eliminar o conectar `reporte_listo` — solo tiene sentido una vez la narrativa realmente se ejecute | Deuda | Baja/Media | P2 | **Fase 1E** (depende de que `BL-29` conecte `generate-narrative`; ya no es tarea de 1A) | `BL-29` | `auditoria/08` | Notificación real para el estado `revision_manual_requerida`; sin tipos de evento sin uso | Ninguna adicional |
| BL-21 | Race condition en `map-accounts` | Agregar lock propio o constraint de unicidad para evitar filas duplicadas ante invocación concurrente | Confiabilidad | Media | P2 | Fase 2 | Ninguna | `auditoria/06`, `R-15` | Dos invocaciones simultáneas para el mismo `analysis_id` no duplican filas | Ninguna adicional |
| BL-22 | Ajustar copy de landing | Revisar "Metodología auditada" y comunicar explícitamente la revisión humana obligatoria | Negocio / Frontend | Media | P2/P3 | Fase 4 | Ninguna | `auditoria/07`, C-10, C-11 | Copy revisado y aprobado antes de cualquier lanzamiento comercial | Fundador (posiblemente abogado si hay lenguaje de garantía) |
| BL-23 | Code-splitting del bundle | `React.lazy` en rutas pesadas (`Dashboard`, landing con `framer-motion`/`recharts`) | Rendimiento | Baja | P3 | Fase 7 | Plan de medición (ver `auditoria/09`) | `auditoria/09`, `R-17` | Bundle principal reducido, medido antes/después | Ninguna adicional |
| BL-24 | Excluir `velarix-code-latest/` de `eslint.config.js` | Agregar la carpeta a `ignores` para que `npm run lint` no reporte ruido de código no vigente | Higiene | Baja | P3 | Cualquiera (no bloquea nada) | Ninguna | `auditoria/06`, `REGISTRO-DE-DECISIONES.md` D-02 | `npm run lint` reporta solo hallazgos de código real | Ninguna adicional |
| BL-25 | Consolidar los 3 archivos de definición de negocio en la raíz | Decidir cuál queda como único documento maestro | Higiene / Negocio | Baja (no bloquea código) | P3 | Cualquiera | Ninguna | `docs/velarix/README.md`, `REGISTRO-DE-DECISIONES.md` D-01 | Un solo archivo de negocio vigente en la raíz del repo | Fundador |
| BL-26 | Tabla comparativa de ambos motores de cálculo | Documentar entradas, fórmulas, salidas y consumidores de `ejecutar-calculo` vs. `financial-engine.ts`, línea a línea, antes de tocar código | Arquitectura | Alta | P0 | Fase 1A | Ninguna — es el primer paso del bloque | `auditoria/04`, `D-06` | Tabla completa y revisada, sin fórmulas sin mapear entre ambos motores | Revisor financiero externo (valida que la comparación sea completa) |
| BL-27 | Pruebas de caracterización del motor cliente | Registrar qué produce **hoy** `financial-engine.ts` para un conjunto de casos — incluyendo comportamiento incorrecto — para comparar contra el servidor en 1E | Calidad | Alta | P0 | Fase 1A | BL-26 | `D-06` (estrategia de transición) | Snapshot de resultados actuales versionado y reproducible; **no se usa como criterio de corrección financiera** | Ninguna adicional |
| BL-28 | Definir estados de persistencia y aprobación del análisis | Diseñar la máquina de estados completa (`uploaded → … → approved_for_delivery → delivered`, ver `fases/FASE-01-EXACTITUD-FINANCIERA.md` sección "Estado y aprobación final"); distinguir "calculado" de "aprobado para entrega" | Arquitectura / Negocio | Alta | P0 | Fase 1A (diseño) → Fase 1E (aplicación real) | BL-26 | `auditoria/04` (hallazgo "informe_generado engañoso"), `Negocio_Velarix_v4.1.md` §8.3 | Diseño completo y documentado en 1A; en 1E, solo `approved_for_delivery` habilita la descarga, verificado server-side | Fundador |
| BL-29 | Conectar `generate-narrative` al pipeline canónico | Reconectar `generate-narrative` a `run-analysis-pipeline` para que la narrativa se genere realmente sobre el `calculation_result` del servidor. **No confundir con `BL-20`** (que es sobre notificaciones/eventos muertos, no sobre la conexión de la narrativa en sí) | Arquitectura | Crítica | P0 | **Fase 1E** | Bloques 1B, 1C y 1D cerrados | `auditoria/04`, `auditoria/08`, `D-07` | La narrativa se genera con datos reales del pipeline, en la misma versión que el PDF | Revisor financiero externo (valida que el contenido narrativo sea consistente con el resultado numérico) |
| BL-30 | Pruebas de especificación (deben fallar antes de 1B) — **parcialmente pendiente** | Reproducir cada bug conocido (BL-02 a BL-05) como una prueba que falla contra el motor servidor tal como está hoy — define el comportamiento correcto esperado. **Estado real**: BL-04 tiene prueba ejecutable (`src/lib/pdf-generator.currency.spec.test.ts`); BL-02, BL-03 y BL-05 solo tienen evidencia de trazado manual (`docs/velarix/bloque-1a/BL-30-evidencia-pruebas-especificacion.md`), que confirma la causa aparente del bug pero no reemplaza una prueba automatizada | Calidad | Crítica | P0 | Fase 1A (BL-04 cerrado) → **primer paso de Fase 1B** (BL-02/03/05 pendientes) | BL-26 | `auditoria/04` | BL-04: prueba ejecutable y fallando (cumplido). BL-02/03/05: **pendiente** — requiere habilitar Deno o extraer la lógica pura con refactor mínimo y controlado antes de que la prueba pueda ejecutarse; ningún bug se marca corregido únicamente con la evidencia manual | Revisor financiero externo |
| BL-31 | Contrato tipado del resultado canónico | Esquema explícito (tipos, no `any`) de qué campos y estructura debe tener `calculation_result` para que narrativa y PDF lo consuman de forma confiable | Arquitectura | Alta | P0 | Fase 1A | BL-26 | `auditoria/06` (uso extendido de `any` en contratos entre funciones) | Contrato documentado y tipado, sin ambigüedad de campos | Ninguna adicional |
| BL-32 | Diseño de versionado (fórmulas, fuentes de datos, cálculo) — **[IMPLEMENTACIÓN PARCIAL en 1C-T]** | `_shared/calculation-versioning.ts` agrega `canonical_engine_version`, `methodology_version` (derivado de `CANONICAL_METHODOLOGY`), `assumptions_snapshot` e `input_fingerprint` (determinístico, `_shared/calculation-fingerprint.ts`) a cada `calculation_result`. No implementa versión de datos macro/sectoriales por separado (`SECTOR_BENCHMARKS` no tiene versión propia todavía) | Arquitectura | Alta | P0 | Fase 1A (diseño) → Fase 1C (implementación parcial) | BL-26 | `Negocio_Velarix_v4.1.md` §10.3, `plan/MATRIZ-DE-TRAZABILIDAD.md`, `docs/velarix/bloque-1c/REPORTE-IMPLEMENTACION-1C-TECNICO.md` | Diseño documentado en 1A; implementado y poblado en cada resultado a partir de 1C-T (versión de macro/sectoriales todavía pendiente) | Revisor financiero externo |
| BL-33 | Expediente de Valoración V1 (nuevo, `D-09`, 2026-08-10) | Representar la comprensión de la empresa, sus cuentas, preguntas, evidencia, normalizaciones, hipótesis y supuestos del caso, antes de ejecutar el cálculo — ver especificación completa | Arquitectura / Negocio | Alta | P0 (condición de entrada de 1E) | Nuevo bloque, **no autorizado para implementar** | Ninguna técnica; requiere autorización explícita y separada del fundador | `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`, `docs/velarix/plan/REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md` | Los 10 criterios de aceptación listados en la especificación (§17) | Fundador (autorización de inicio); revisor financiero externo (aprobaciones materiales dentro del expediente) |
| BL-34 | Biblioteca **automatizada** de casos de valoración (B) (nuevo, diferido, `D-09`, precisado 2026-08-10) | Ingestión automática, interfaz de biblioteca, scraping, procesamiento masivo, búsqueda automatizada, almacenamiento especializado y entrenamiento con casos — explícitamente diferido | Negocio / Calidad | Baja (no bloquea nada hoy) | P3 | Diferido por decisión de producto — sin dependencia técnica ni de `BL-33` fijada | Ninguna | `Negocio_Velarix_v4.2.md` §13.3.1 | Iniciativa registrada; sin ingestión automática implementada | Fundador |
| BL-35 | Estudio **manual** de casos públicos — Biblioteca (A) (nuevo, `D-09`, precisado 2026-08-10) — **Caso 01 (V0) completado el mismo día** | Analizar manualmente empresas con información financiera pública para comprender empresa/cuentas, detectar ambigüedades, formular preguntas, proponer normalizaciones e hipótesis, y usar esa evidencia para refinar `EXPEDIENTE-DE-VALORACION-V1.md` antes de implementarlo. No requiere interfaz, tablas, ingestión automática, scraping, Edge Functions, IA conectada ni motor modificado. **Caso 01 — Tecnoglass**: documentado en `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`, contrastado en `REPORTE-CONTRASTE-EXPEDIENTE-V1.md` de la misma carpeta; confirmó 8 necesidades ya incorporadas conceptualmente a `EXPEDIENTE-DE-VALORACION-V1.md` §5, §5.1, §6, §17, §20, §21 (sin autorizar implementación). **Iniciativa sigue activa** — un solo caso no cierra `BL-35`; Caso 02 (empresa con economía distinta) sigue pendiente, sin fecha ni analizar todavía | Negocio / Metodología | Media (insumo directo para diseñar bien el Expediente) | P1 | **Activo desde 2026-08-10** — no depende de `BL-33` ni de ningún bloque técnico | Ninguna | `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`, `docs/velarix/plan/REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md`, `docs/velarix/casos/01-tecnoglass/` | Al menos un caso público documentado (empresa, cuentas, ambigüedades, preguntas, normalizaciones propuestas, hipótesis, dudas reales) y contrastado contra la especificación del Expediente — **cumplido con Caso 01** | Ninguna obligatoria para el Caso 01 — el profesor/experto puede revisar las dudas reales que surgieron (ver §17–18 del caso), no diseñar el caso |
