# Fase 01 — Exactitud Financiera

> **Actualizado 2026-07-23 (v2, tras D-07)**: el fundador revisó el ZIP
> completo de la auditoría y aprobó la auditoría y la decisión `D-06`,
> pero la Fase 1 **no queda autorizada para implementación** — se
> corrige aquí la secuencia interna antes de cualquier autorización
> adicional. La secuencia pasa de 4 a **5 bloques**: 1A, 1B, 1C, 1D, 1E.

## Estado

**Bloque 1A cerrado documentalmente (2026-07-23), con limitación técnica
registrada**: BL-04 tiene prueba de especificación ejecutable; BL-02,
BL-03 y BL-05 tienen evidencia de trazado manual, pero sus pruebas de
especificación ejecutables siguen **pendientes** — no se consideran
resueltas por esta evidencia. Ver sección "Bloque 1A" para el detalle de
entregables y el documento
`docs/velarix/bloque-1a/REPORTE-CIERRE-BLOQUE-1A.md`.

**Bloque 1B-P0 completado (2026-07-23)**: BL-02, BL-03, BL-04, BL-05 y
BL-06 corregidos con pruebas ejecutables reales. **1B-metodología sigue
pendiente** (BL-17, R-19, ROE/ROA, escenarios). Ver
`docs/velarix/bloque-1b/REPORTE-IMPLEMENTACION-1B-P0.md`.

**Bloque 1D-P0 completado (2026-07-23)**: BL-07, BL-08, recorte P0 de
BL-09 implementados y activos en el código. **BL-10 corregido y
revisado, pero sigue sin aplicarse**: la migración SQL fue corregida
(la auditoría de intentos rechazados no puede persistir dentro de la
misma transacción que un `RAISE EXCEPTION` — se documentó esa limitación
y se rediseñó `admin_set_user_role` para devolver un resultado
estructurado en vez de lanzar excepción, permitiendo que sus rechazos sí
se auditen de forma durable), se creó su rollback
(`supabase/rollback/`), pero **no se pudo aplicar**: Supabase CLI,
`psql` y Docker no están disponibles en este entorno, y no hay
credenciales de conexión directa (`.env` solo tiene la anon key/URL/project
id, sin service role key ni cadena de conexión). BL-10 permanece
**abierto en producción real** hasta que el fundador aplique la
migración manualmente. Ver
`docs/velarix/bloque-1d/REPORTE-IMPLEMENTACION-1D-P0.md` §12.

Bloques 1C y 1E, y el resto de 1B (1B-metodología), siguen **sin
autorizar y sin iniciar**.

## Objetivo

`Negocio_Velarix_v4.1.md` §18: "Impedir resultados incorrectos."

## Justificación de negocio

El mayor riesgo del negocio (§10.1) "no es una caída del sitio. Es
entregar un resultado convincente pero equivocado." Esta secuencia existe
precisamente para que ningún bloque active un flujo hacia el cliente antes
de que el bloque anterior lo haya probado y cerrado.

## Exclusiones explícitas de la Fase 1 completa

No se hace, bajo ningún bloque de esta fase:

- Pagos, retainers, o cualquier automatización de cobro.
- Dashboards nuevos ni rediseño visual.
- Code-splitting del bundle ni otras optimizaciones de rendimiento.
- Automatización de actualización de datos macro (cron real para
  `update-snapshots`/`check-data-freshness`) — permanece en Fase 7.
- Refactor general de CORS/autenticación de las 12 Edge Functions
  (`BL-18`) — permanece en Fase 2 como consolidación P2.
- Reorganización del repositorio.
- Nuevos segmentos o servicios de negocio.
- Cambios comerciales (precio, contrato, NDA).
- Producción con datos reales de un tercero (eso es Fase 3 en adelante).
- Eliminación del motor cliente (`financial-engine.ts`) antes de cerrar
  1E — se acota su uso, no se borra.

## Regla operativa de ejecución

**Ningún bloque de esta fase se ejecuta con agentes/sesiones en paralelo
que modifiquen los mismos archivos.** En particular, 1A y 1D comparten
archivos (`ejecutar-calculo`, `continuar-tras-revision`) — se coordinan en
secuencia dentro de esos archivos específicos, aunque 1D como bloque
pueda avanzar en un calendario independiente de 1A/1B/1C.

## Secuencia y dependencias

```
1A (caracterización y contrato canónico — solo diseño y pruebas, sin activar nada)
  │
  ▼
1B (corrección financiera — sobre el motor, usando las pruebas de 1A)
  │
  ▼
1C (casos dorados, trazabilidad, revisión externa — sobre el motor ya corregido)
  │
  ▼
1E (integración y activación controlada — solo si 1B, 1C Y 1D están cerrados)
  ▲
  │
1D (seguridad P0 del flujo — en paralelo a 1A/1B/1C como bloque,
    pero internamente secuencial y coordinado con 1A en los archivos compartidos)
```

1E es el único bloque que depende de **los otros cuatro** (1B, 1C y 1D
cerrados; 1A ya cerrado documentalmente por ser su prerequisito natural,
con la limitación de BL-30 descrita abajo pendiente de resolverse en 1B).
Nada se activa para un usuario real hasta que 1E declare cumplidos todos
sus criterios.

---

## Bloque 1A — Caracterización y contrato canónico

> **Cerrado documentalmente el 2026-07-23, con limitación técnica
> registrada.** BL-04 tiene prueba de especificación ejecutable; BL-02,
> BL-03 y BL-05 tienen evidencia de trazado manual, pero sus pruebas de
> especificación ejecutables siguen **pendientes**. La evidencia manual
> confirma la causa aparente de cada bug; **no reemplaza** una prueba
> automatizada, y ningún bug puede marcarse corregido únicamente mediante
> trazado manual. Entregables reales en `docs/velarix/bloque-1a/`:
> `BL-26-tabla-comparativa-motores.md`, `BL-28-diseno-maquina-estados.md`,
> `BL-30-evidencia-pruebas-especificacion.md`, `BL-32-diseno-versionado.md`,
> `REPORTE-CIERRE-BLOQUE-1A.md`. Contrato tipado en
> `src/types/calculation-result.ts` (BL-31, no conectado a producción).
> Pruebas nuevas: `src/lib/financial-engine.characterization.test.ts`
> (BL-27) y `src/lib/pdf-generator.currency.spec.test.ts` (BL-30/BL-04).
> Ver la sección "Criterios de aceptación" más abajo para el detalle exacto
> de qué se cumplió tal como quedó.

### Alcance

- **Tabla comparativa completa de ambos motores** (`BL-26`): entradas,
  fórmulas, salidas y consumidores de `ejecutar-calculo` vs.
  `financial-engine.ts`, línea a línea.
- **Pruebas de caracterización** (`BL-27`): registran qué produce **hoy**
  `financial-engine.ts` para un conjunto de casos — **incluyendo su
  comportamiento incorrecto**. Sirven de referencia de comparación en 1E,
  no de criterio de corrección.
- **Pruebas de especificación** (`BL-30`, nuevo): reproducen cada bug
  conocido (BL-02 a BL-05) como una prueba que **debe fallar** contra el
  motor servidor tal como está hoy. Definen el comportamiento correcto
  esperado — son el criterio real que 1B tiene que satisfacer.
- **Contrato tipado del resultado canónico** (`BL-31`, nuevo): esquema
  explícito (tipos, no `any`) de qué campos y estructura debe tener
  `calculation_result` para que narrativa y PDF lo consuman de forma
  confiable en 1E.
- **Diseño de estados del análisis** (`BL-28`): la máquina de estados
  completa se documenta en la sección "Estado y aprobación final" más
  abajo — este bloque solo la **diseña**, no la implementa en producción.
- **Diseño de versionado** (`BL-32`, nuevo): cómo se identifica qué
  versión de fórmulas, qué versión de fuentes de datos macro/sectoriales,
  y qué hash/identificador de input generó un resultado — se diseña aquí,
  se implementa en 1C.
- **Definición del flujo de aprobación**: quién aprueba, sobre qué
  evidencia, y qué estado alcanza el análisis al aprobarse
  (`human_review_pending` → `approved_for_delivery`, ver sección de
  estados).
- **Estrategia de transición**: la ya descrita en `D-06` — no se elimina
  el motor cliente hasta que 1E confirme equivalencia.

### Explícitamente, en 1A NO se hace

- No se conecta el PDF profesional al resultado del servidor (eso es 1E).
- No se conecta `generate-narrative` al pipeline real (eso es 1E, `BL-29`).
- No se habilita el nuevo flujo a ningún usuario, ni siquiera de prueba
  interna.
- Ningún bug financiero se corrige todavía (eso es 1B) — 1A solo escribe
  la prueba que demuestra que el bug existe.

### Distinción obligatoria: caracterización vs. especificación

| | Pruebas de caracterización | Pruebas de especificación |
|---|---|---|
| Qué registran | El comportamiento **actual**, sea correcto o no | El comportamiento **correcto esperado** |
| Estado inicial esperado | Pasan siempre (documentan un hecho) | **Fallan** contra el motor sin corregir |
| Uso | Comparar servidor vs. cliente en 1E; detectar regresiones no intencionales | Definir el criterio de éxito de cada corrección en 1B |
| Riesgo si se confunden | Se podría "aprobar" un bug porque una prueba de caracterización lo registra como normal | — |

**Las pruebas de caracterización nunca se usan como criterio de
corrección financiera.** Si una prueba de caracterización registra un
resultado incorrecto, eso no lo vuelve aceptable — la prueba de
especificación correspondiente es la que manda.

### Hallazgos que resuelve

`BL-01` (como diseño, no como activación), `BL-26`, `BL-27`, `BL-28`,
`BL-30`, `BL-31`, `BL-32`. Ver `plan/BACKLOG-CLASIFICADO.md`.

Nota: `BL-06` (pipeline no aborta ante falla de `map-accounts`) y `BL-20`
**ya no viven en 1A** — `BL-06` se corrige junto con 1B (es un bug de
confiabilidad del mismo pipeline que se está corrigiendo), y `BL-20`
depende de `BL-29` (conexión de narrativa), que vive en 1E.

### Archivos o componentes potencialmente afectados

Ninguno de producción todavía — este bloque produce documentación de
diseño (tabla comparativa, contrato tipado, diseño de estados/versionado)
y pruebas nuevas (caracterización + especificación), sin tocar el
comportamiento de ningún endpoint existente.

### Riesgos

Ver `R-04` en `plan/MATRIZ-DE-RIESGOS.md`. Riesgo específico de este
bloque: si las pruebas de especificación no cubren exactamente los bugs
ya documentados en `auditoria/04-CALIDAD-FINANCIERA.md`, 1B podría
"corregir" sin resolver el problema real.

### Pruebas obligatorias

Las de caracterización y especificación descritas arriba — son el
entregable de este bloque, no una validación posterior.

### Criterios de aceptación

- [x] Tabla comparativa completa y revisada —
      `docs/velarix/bloque-1a/BL-26-tabla-comparativa-motores.md`.
- [x] Prueba de especificación real y ejecutable para BL-04 (PDF "USD"
      fijo) — falla contra el código actual usando `test.fails()`,
      manteniendo `npm test` en verde
      (`src/lib/pdf-generator.currency.spec.test.ts`).
- [~] Pruebas de especificación para BL-02, BL-03 y BL-05: **no son
      ejecutables en este entorno** — Deno no está instalado y los 3
      archivos involucrados (`build-structured-input`, `ejecutar-calculo`)
      tienen imports de URL no resolubles en Node/Vitest más un `serve()`
      incondicional de nivel superior, lo que impide incluso importarlos
      para pruebas aisladas sin reescribir su estructura (un refactor que
      1A tiene prohibido improvisar). Se documentó evidencia de trazado
      manual, archivo y línea, en
      `docs/velarix/bloque-1a/BL-30-evidencia-pruebas-especificacion.md`
      — este es el resultado aceptado explícitamente por el fundador para
      este caso ("si una función no puede probarse sin refactor, documenta
      la limitación y detente únicamente sobre esa prueba"). **La
      evidencia manual confirma la causa aparente de cada bug, pero no
      reemplaza una prueba automatizada** — BL-30 queda cerrado
      parcialmente, no completamente, hasta que existan las 3 pruebas
      ejecutables pendientes (primer paso obligatorio de Bloque 1B, ver
      su sección "Condiciones de entrada").
- [x] Pruebas de caracterización del motor cliente — 12 escenarios (10
      mínimos + 2 adicionales) en
      `src/lib/financial-engine.characterization.test.ts`, todas pasan
      (registran el comportamiento actual, correcto o no).
- [x] Contrato tipado del resultado canónico — `src/types/calculation-result.ts`,
      sin `any`, no conectado a producción.
- [x] Diseño de estados documentado —
      `docs/velarix/bloque-1a/BL-28-diseno-maquina-estados.md`.
- [x] Diseño de versionado documentado —
      `docs/velarix/bloque-1a/BL-32-diseno-versionado.md`.
- [x] `npm test`, `npx tsc --build --noEmit` y `npm run build` terminan
      igual o mejor que el baseline registrado antes de empezar (ver
      `docs/velarix/bloque-1a/REPORTE-CIERRE-BLOQUE-1A.md`, sección de
      validaciones) — ningún error nuevo introducido.

### Plan de rollback

No aplica — este bloque no modificó ningún comportamiento en producción.
Los archivos nuevos (pruebas, tipos, documentación) pueden eliminarse sin
ningún efecto sobre el comportamiento actual del sistema si el fundador
decidiera revertir este bloque.

### Condiciones de detención

Si el revisor financiero externo, al revisar la tabla comparativa,
identifica una diferencia entre motores no documentada por la auditoría
original, se detiene y se documenta como hallazgo nuevo antes de seguir a
1B.

**Detención parcial ya ejecutada** (no bloqueante para el resto de 1A, tal
como autorizó el fundador): las pruebas de especificación de BL-02, BL-03
y BL-05 se detuvieron en la evidencia documentada de la sección anterior
por el bloqueo ambiental de Deno — el resto de 1A continuó y se cerró
igual.

---

## Bloque 1B — Correcciones financieras

> **1B-P0 completado; 1B-metodología pendiente** (2026-07-23). Ver
> `docs/velarix/bloque-1b/REPORTE-IMPLEMENTACION-1B-P0.md`. Se
> corrigieron `BL-02`, `BL-03`, `BL-04`, `BL-05` y `BL-06` con pruebas
> ejecutables reales (financial-accounts.test.ts, currency.test.ts,
> pdf-generator.currency.spec.test.ts, capital-structure.test.ts,
> pipeline-guards.test.ts). **No completado todavía**: `BL-17`
> (consolidación de constantes), `R-19` (7 supuestos ajustables sin
> reconciliar), y cualquier cambio metodológico de WACC/CAPM/estructura
> de capital/escenarios/ROE-ROA — ver sección "Alcance" abajo, sin
> modificar.

### Alcance

- `BL-02` — Consolidación de subcuentas. **Corregido en 1B-P0.**
- `BL-03` — Conversión de moneda. **Corregido en 1B-P0.**
- `BL-04` — Formato y etiqueta de moneda en PDF. **Corregido en 1B-P0.**
- `BL-05` — Campo de deuda mal nombrado en `ejecutar-calculo`. **Corregido en 1B-P0.**
- `BL-06` — Detener el pipeline ante falla de `map-accounts` (bug de
  confiabilidad del mismo pipeline que se está corrigiendo). **Corregido en 1B-P0.**
- ROE/ROA (parte de `R-04`/hallazgo #4 de `auditoria/04`) — usar
  `net_income` real donde exista, agregar clamps de sanidad.
  **Pendiente (1B-metodología) — no tocado en 1B-P0.**
- Signos, unidades, redondeos — revisión puntual para confirmar que no
  queda ninguna doble aplicación. **Pendiente (1B-metodología).**
- Constantes macro y sectoriales (`BL-17`): definir una **sola fuente
  canónica, fija, versionada y determinística**. Registrar en cada
  resultado qué versión de fórmulas y de fuentes se utilizó (usando el
  diseño de versionado de `BL-32`). **No conectar automatizaciones
  dinámicas, cron, ni actualización automática de `external_snapshots`
  en este bloque** — esa automatización queda diferida a Fase 7
  explícitamente. **Pendiente (1B-metodología) — no tocado en 1B-P0.**
- Fórmulas duplicadas que afecten el resultado canónico — reconciliar
  contra la tabla comparativa de 1A. **Pendiente (1B-metodología).**

### Orden obligatorio por cada bug

1. Confirmar que existe la prueba de especificación de 1A que falla.
2. Implementar la corrección.
3. Demostrar que la prueba ahora pasa.
4. Correr toda la suite (caracterización + especificación + regresión
   existente) para verificar que no se rompió otro resultado.

Ningún bug se da por corregido si se salta alguno de estos 4 pasos.

### Hallazgos que resuelve

`BL-02`, `BL-03`, `BL-04`, `BL-05`, `BL-06`, `BL-17`. Ver
`plan/BACKLOG-CLASIFICADO.md`.

### Condiciones de entrada

- [x] Bloque 1A cerrado documentalmente (2026-07-23): tabla comparativa
      (`BL-26`), contrato tipado (`BL-31`) y pruebas de caracterización
      del cliente (`BL-27`) ya existen.
- [x] **Resuelto en 1B-P0 (2026-07-23)**: se aplicó la opción (b) —
      extracción mínima y controlada de la lógica financiera pura a
      `supabase/functions/_shared/` (`financial-accounts.ts`,
      `currency.ts`, `capital-structure.ts`, `pipeline-guards.ts`),
      probada desde Vitest e importada realmente por las Edge Functions.
      BL-02, BL-03, BL-04, BL-05 y BL-06 ahora tienen pruebas ejecutables
      reales y pasando — ver `docs/velarix/bloque-1b/REPORTE-IMPLEMENTACION-1B-P0.md`
      y `PRUEBAS-BL-02.md` a `PRUEBAS-BL-06.md`. La única cobertura que
      sigue pendiente (no bloqueante, documentada) es la verificación de
      integración end-to-end de BL-06 sobre el archivo completo de
      `run-analysis-pipeline` (bloqueada por Deno no instalado, ver
      `PRUEBAS-BL-06.md`).

### Archivos o componentes potencialmente afectados

`supabase/functions/build-structured-input/index.ts`,
`supabase/functions/validate-analysis/index.ts`,
`supabase/functions/continuar-tras-revision/index.ts` (solo la lógica de
consolidación, no la autenticación — eso es 1D),
`supabase/functions/ejecutar-calculo/index.ts`,
`supabase/functions/parse-document/index.ts`,
`supabase/functions/run-analysis-pipeline/index.ts`,
`src/lib/pdf-generator.ts` (solo la función de formato de moneda, el PDF
sigue sin conectarse al servidor hasta 1E), `src/data/velarix-datos-2026.ts`,
`supabase/functions/update-snapshots/index.ts` (solo para fijar la fuente
canónica, no para automatizarla).

### Cambios de base de datos potenciales

Posible ajuste de la clave `sector` en `external_snapshots` (slug vs.
label) para BL-17 — preferir corregir el código de consulta antes que los
datos ya sembrados.

### Riesgos

Ver `R-01`, `R-02`, `R-03`, `R-05` en `plan/MATRIZ-DE-RIESGOS.md`.

### Pruebas obligatorias

Todas las de especificación de 1A deben pasar al cerrar este bloque, sin
romper ninguna prueba de caracterización que documentara un
comportamiento que **sí** era correcto.

### Criterios de aceptación

Cada bug de la lista tiene su prueba de especificación pasando; la
consolidación de constantes macro/sectoriales queda en una sola fuente,
versionada, sin automatización dinámica todavía.

- [x] BL-02, BL-03, BL-04, BL-05, BL-06: prueba de especificación
      ejecutable pasando (1B-P0, 2026-07-23) — ver
      `docs/velarix/bloque-1b/REPORTE-IMPLEMENTACION-1B-P0.md`.
- [ ] ROE/ROA, signos/unidades/redondeos, consolidación de constantes
      (`BL-17`), fórmulas duplicadas: **pendientes** — no se tocaron en
      1B-P0. El Bloque 1B **no está cerrado completo** mientras estos
      sigan pendientes.

### Plan de rollback

Cada corrección en un commit separado y revertible. Ninguna migración
destructiva.

BL-02/03/04/05/06 (1B-P0): no se hizo ningún commit todavía (ver
`REPORTE-IMPLEMENTACION-1B-P0.md`, sección `git status --short`) — el
rollback disponible hoy es simplemente descartar los archivos
modificados/nuevos listados ahí, sin ningún efecto en producción (nada
se desplegó).

### Condiciones de detención

Si una corrección rompe una prueba de caracterización que documentaba un
comportamiento correcto no identificado antes, se detiene esa corrección
y se escala al revisor financiero externo.

---

## Bloque 1C — Casos dorados, trazabilidad y revisión externa

### Alcance

- `BL-14` — Casos dorados y pruebas de regresión formales (sobre el motor
  ya corregido por 1B).
- Comparación con Excel independiente para al menos un caso real o
  realista.
- `BL-15` — Trazabilidad completa: documento → fila → mapping → input →
  fórmula → resultado → narrativa → PDF (la narrativa y el PDF se conectan
  recién en 1E, pero el diseño de trazabilidad debe contemplarlos desde
  ahora para no rehacer el esquema).
- Implementación del versionado diseñado en 1A (`BL-32`): versión del
  cálculo, versión de fórmulas, versión de datos macro, hash/identificador
  del input — registrados en cada resultado.
- Aprobación formal del revisor financiero externo sobre los casos
  dorados.

### Hallazgos que resuelve

`BL-14`, `BL-15`, implementación de `BL-32`. Ver
`plan/BACKLOG-CLASIFICADO.md` y `plan/MATRIZ-DE-TRAZABILIDAD.md`.

### Condiciones de entrada

- [ ] Bloque 1B completo: los bugs conocidos ya no están presentes en el
      motor canónico.

### Archivos o componentes potencialmente afectados

Nuevos archivos de prueba, posible campo nuevo de trazabilidad/versionado
en `structured_inputs`/`calculation_results` (aditivo).

### Cambios de base de datos potenciales

Campo(s) de trazabilidad y versión (`document_id`/`mapping_id`/
`source_row_ids`, `formula_version`, `macro_data_version`, `input_hash`)
en `structured_inputs` y `calculation_results` — aditivo.

### Riesgos

Ver `R-13` en `plan/MATRIZ-DE-RIESGOS.md`.

### Pruebas obligatorias

Suite completa de casos dorados ejecutándose en CI/local.

### Criterios de aceptación

**Este bloque no se considera finalizado si los casos dorados no fueron
aprobados por el revisor financiero externo** — no basta con que el
código los implemente y pasen técnicamente.

### Plan de rollback

No aplica en sentido destructivo — son pruebas y campos aditivos.

### Condiciones de detención

Si el revisor financiero externo no aprueba, el bloque permanece abierto
indefinidamente hasta lograr esa aprobación — no se fuerza el cierre.

---

## Bloque 1D — Seguridad P0 del flujo

> **1D-P0 completado (2026-07-23).** Ver
> `docs/velarix/bloque-1d/REPORTE-IMPLEMENTACION-1D-P0.md` y
> `MATRIZ-PRUEBAS-AUTORIZACION.md`. Se implementaron BL-07, BL-08, el
> recorte P0 de BL-09 y BL-10 (migración SQL creada, **no aplicada**).
> Hallazgo nuevo descubierto durante este bloque: la política RLS de
> `manual_reviews` permitía la autoaprobación **directamente contra la
> base de datos**, no solo por falta de verificación en la Edge
> Function — corregido en la misma migración. No se tocó `src/App.tsx`
> ni ningún gate de rol en el frontend (fuera de alcance explícito de
> 1D-P0: "no dashboards", "no reorganices código") — la defensa
> principal quedó en la Edge Function + RLS, tal como exige la regla
> explícita de este bloque.
>
> **Finalización operativa (2026-07-23, sesión posterior)**: se corrigió
> una imprecisión de la migración (auditaba un intento rechazado con un
> `INSERT` que un `RAISE EXCEPTION` posterior revertía en la misma
> transacción — ver §12.1 del reporte). Se creó el rollback
> (`supabase/rollback/`). **La migración no se pudo aplicar**: sin
> Supabase CLI, `psql` ni Docker disponibles, y sin credenciales de
> conexión directa en este entorno — se reportó el bloqueo, no se
> improvisó ninguna vía alternativa. BL-10 sigue **sin efecto real**
> hasta que se aplique manualmente.

### Alcance

Ejecución **secuencial**, no con agentes paralelos que toquen los mismos
archivos que 1A/1B (coordinar explícitamente el orden de cambios sobre
`ejecutar-calculo` y `continuar-tras-revision`).

- `BL-07` — Autenticación **y** autorización correcta de `ejecutar-calculo`
  (verificar sesión válida + `analysis.user_id === user.id`).
- `BL-08` — Autenticación de `continuar-tras-revision` **más**
  autorización privilegiada — **no basta con ownership**. El propietario
  de un análisis normalmente es el cliente, y el cliente **nunca** debe
  poder aprobar ni continuar su propia revisión. La verificación debe
  confirmar que quien llama es un analista autorizado, un administrador,
  o una invocación interna legítima del sistema — no solo que el
  `analysis_id` le pertenece.
- Recorte de `BL-09` — impedir autoaprobación (el cliente propietario no
  puede aprobar/bloquear su propia revisión).
- `BL-10` (**movido aquí desde Fase 2, prioridad P0**) — proteger
  `profiles.role` contra auto-escalamiento. El control de rol de todo el
  flujo no es válido mientras un usuario pueda auto-asignarse el rol que
  necesita para saltarse el control.
- Políticas RLS correspondientes a los puntos anteriores.
- Registro en `audit_events` de las acciones críticas (aprobación,
  bloqueo, ejecución de cálculo, intentos rechazados).
- Pruebas negativas y positivas (lista completa abajo).

### Actores a definir y documentar explícitamente

| Actor | Quién es | Qué puede hacer en este flujo |
|---|---|---|
| Cliente propietario | Dueño del `analysis_id` | Ver su propio análisis, **no** aprobar/continuar su propia revisión |
| Analista autorizado | `role = analyst`, asignado (hoy: el fundador) | Revisar, aprobar, bloquear, continuar el flujo tras revisión |
| Administrador | `role = admin` | Todo lo anterior + gestión general |
| Invocación interna del sistema | Ej. `run-analysis-pipeline` llamando a `ejecutar-calculo` con el mismo contexto de autenticación ya validado | Ejecutar pasos del pipeline en nombre del propietario ya autenticado, sin re-exponer un endpoint público sin control |

**Regla explícita**: la autorización se aplica en servidor y en RLS. La
protección de rutas del frontend (`ProtectedRoute`, ocultar botones) es
**únicamente defensa adicional** — nunca el control principal. Un cambio
de UI que oculte un botón no es, por sí solo, una corrección de
seguridad.

### Pruebas mínimas obligatorias

1. Sin autenticación.
2. Usando únicamente la clave `anon`.
3. Usuario autenticado ajeno al análisis.
4. Cliente propietario del análisis (debe poder ver, no aprobar).
5. Cliente intentando cambiar su propio `role`.
6. Analista no asignado a ese análisis específico (si el modelo de rol
   distingue asignación).
7. Analista autorizado (camino feliz de aprobación).
8. Admin autorizado (camino feliz).
9. Invocación interna válida (pipeline llamando en nombre de un usuario ya
   autenticado).
10. Intento de acceso cruzado — debe fallar **sin filtrar información
    sensible** en el mensaje de error (no revelar si el `analysis_id`
    existe o pertenece a otro usuario).

### Alcance explícitamente excluido de este bloque

**No** se hace en 1D un refactor global de las 12 Edge Functions. `BL-18`
(extracción completa de `_shared/cors.ts` y `_shared/auth.ts`) **permanece
en Fase 2, como consolidación P2**. En 1D solo se permite escribir un
helper mínimo y acotado si es estrictamente necesario para que
`ejecutar-calculo` y `continuar-tras-revision` (las 2 funciones P0
intervenidas) queden protegidas — no una extracción general para las 12
funciones.

### Hallazgos que resuelve

`BL-07`, `BL-08`, recorte de `BL-09`, `BL-10`. Ver
`plan/BACKLOG-CLASIFICADO.md`.

### Condiciones de entrada

Ninguna — puede empezar de inmediato, coordinando en secuencia con 1A
sobre los archivos compartidos.

### Archivos o componentes potencialmente afectados

`supabase/functions/ejecutar-calculo/index.ts`,
`supabase/functions/continuar-tras-revision/index.ts`, migración RLS sobre
`profiles` (política UPDATE) y `manual_reviews`, posible helper mínimo
nuevo (no `_shared/auth.ts` completo — ver exclusión arriba), `src/App.tsx`
(gate de rol como defensa adicional, no principal).

### Cambios de base de datos potenciales

- Política RLS ajustada en `profiles` (UPDATE con `WITH CHECK` que excluya
  `role`, o `role` movido a tabla separada gestionada solo por service
  role).
- Política RLS ajustada en `manual_reviews` para reflejar los 4 actores
  definidos arriba, no solo `user_id = auth.uid()`.

### Riesgos

Ver `R-06`, `R-07`, `R-08`, `R-09` en `plan/MATRIZ-DE-RIESGOS.md`.

### Pruebas obligatorias

Las 10 listadas arriba, automatizadas.

- [x] **Cumplido (1D-P0)**: las 10 (más 2 adicionales) están cubiertas
      como pruebas puras reales en
      `supabase/functions/_shared/authorization.test.ts` (24 pruebas,
      todas pasan) — ver `docs/velarix/bloque-1d/MATRIZ-PRUEBAS-AUTORIZACION.md`
      para el mapeo exacto. La verificación end-to-end contra un
      Postgres/Deno real sigue pendiente (bloqueo ambiental, mismo que
      Bloque 1A).

### Criterios de aceptación

Las 10 pruebas pasan; ningún cliente propietario puede aprobar su propia
revisión; ningún usuario puede auto-escalar su `role`.

- [x] Las 10 pruebas (pure-function) pasan.
- [x] `canContinueAfterReview` bloquea explícitamente al propietario
      (`owner_self_approval_blocked`), y la migración de BL-10 cierra
      también la vía de UPDATE directo a `manual_reviews`.
- [x] `canChangeRole` + el trigger de BL-10 bloquean el auto-escalamiento
      — pendiente de que la migración se **aplique** para que la
      protección de base de datos tenga efecto real (hoy la protección
      real y activa es la de la Edge Function/RLS de la aplicación
      cuando exista; el trigger SQL está creado pero no aplicado).

### Plan de rollback

Cambios aditivos de autorización — bajo riesgo de romper el flujo
legítimo si siguen el patrón ya probado en las demás funciones y respetan
la tabla de actores.

Código (`ejecutar-calculo`, `continuar-tras-revision`): ningún commit
todavía — revertir es descartar los archivos modificados. Migración SQL:
no aplicada, por lo que no hay nada que revertir en Supabase; si se
aplica en el futuro y hay que revertirla, el rollback es: `DROP TRIGGER
trg_protect_profile_role`, `DROP FUNCTION protect_profile_role_column`,
`DROP FUNCTION admin_set_user_role`, y restaurar la política `FOR ALL`
original de `manual_reviews` (queda documentada en el comentario de la
migración, con `DROP POLICY IF EXISTS` sobre las 4 nuevas).

### Condiciones de detención

Ninguna específica más allá de las generales — bloque acotado y de bajo
riesgo de bloquearse por decisiones externas.

---

## Bloque 1E — Integración y activación controlada

**Solo puede comenzar cuando 1B, 1C y 1D estén cerrados.**

### Alcance

- Conectar el PDF al resultado canónico (`analyses.calculation_result`).
- Conectar `generate-narrative` al pipeline real (`BL-29`, nuevo — no
  reutiliza `BL-20`, que es un ítem distinto sobre notificaciones muertas).
- Garantizar que cálculo, narrativa y PDF correspondan a la **misma
  versión** (usando el versionado diseñado en 1A e implementado en 1C).
- Impedir que el frontend vuelva a ejecutar fórmulas profesionales
  (`Dashboard.tsx::handleDownloadPDF` deja de llamar `runAnalysis()`).
- Mantener el motor cliente exclusivamente para los usos autorizados por
  `D-06` (estimador, visualización de resultados ya calculados, gráficas
  derivadas, previsualización sin recalcular).
- Comparar servidor y cliente para los casos ya caracterizados en 1A
  (`BL-27`) — documentar y aprobar cualquier diferencia encontrada.
- Habilitar el flujo únicamente en entorno controlado o mediante una
  bandera de activación explícita — **no** para usuarios finales hasta
  superar todos los criterios de aceptación de este bloque.

### Hallazgos que resuelve

`BL-01` (activación real, ya diseñada en 1A), `BL-29`, `BL-20` (una vez
`BL-29` conecta la narrativa, se puede corregir el gap de notificación y
retirar `reporte_listo`), `BL-16` (auditar descargas, una vez el PDF
pueda servirse/validarse en un punto verificable del servidor).

### Condiciones de entrada

- [ ] Bloque 1B cerrado (bugs financieros corregidos).
- [ ] Bloque 1C cerrado (casos dorados aprobados por el revisor externo).
- [ ] Bloque 1D cerrado (seguridad P0 del flujo probada).

### Archivos o componentes potencialmente afectados

`src/pages/Dashboard.tsx`, `supabase/functions/run-analysis-pipeline/index.ts`,
`supabase/functions/generate-narrative/index.ts`, `src/lib/pdf-generator.ts`,
`src/lib/api-client.ts` (retirar o conectar los wrappers huérfanos),
posible bandera de activación (feature flag) nueva.

### Cambios de base de datos potenciales

Campo de estado adicional si se requiere para la bandera de activación
controlada (aditivo). Implementación final de los estados de la sección
"Estado y aprobación final" (abajo).

### Riesgos

Ver `R-04` en `plan/MATRIZ-DE-RIESGOS.md`. Riesgo específico: activar el
flujo nuevo para usuarios reales antes de que la comparación
servidor/cliente esté aprobada expondría al primer cliente a una
regresión no detectada.

### Pruebas obligatorias

- Todas las de 1B, 1C y 1D siguen pasando.
- Comparación servidor vs. cliente sobre los casos de `BL-27` — sin
  diferencias no explicadas.
- Prueba de que el frontend ya no ejecuta `runAnalysis()` para el flujo
  profesional.
- Prueba de que la descarga profesional está bloqueada antes de
  `approved_for_delivery`.
- Prueba de que una modificación posterior (documento, mapping, input,
  supuesto, fórmula, narrativa o resultado) invalida una aprobación ya
  otorgada.

### Casos de regresión

Los de 1B/1C, más cualquier diferencia servidor/cliente documentada y
resuelta durante la comparación de este bloque.

### Criterios de aceptación (cierre de 1E, y de la Fase 1 completa)

- El motor servidor pasa todos los casos de regresión.
- Los casos dorados están aprobados por el revisor financiero externo.
- La seguridad P0 (1D) está cerrada.
- El PDF no ejecuta fórmulas financieras — solo presenta el resultado
  aprobado.
- La narrativa y el PDF usan la misma versión de cálculo.
- La descarga profesional está bloqueada antes de `approved_for_delivery`.
- Existe una modificación de prueba que invalida una aprobación ya
  otorgada, y el sistema lo refleja correctamente.
- Existe prueba de acceso cruzado (heredada de 1D) pasando.
- Existe prueba de que el cliente no puede autoaprobar su propia revisión.
- Existe prueba de que el `role` no puede auto-escalarse.
- El rollback de este bloque **no** vuelve al motor cliente para producir
  una valoración profesional (ver sección de rollback abajo).
- El flujo no se ha habilitado para terceros sin autorización expresa del
  fundador.

### Plan de rollback (corregido — no es un rollback al motor cliente)

**El rollback de 1E nunca puede ser "volver silenciosamente al motor
cliente para producir una valoración profesional."** Eso sería entregar
una cifra que la propia auditoría ya identificó como potencialmente
distinta/incorrecta, solo para mantener disponibilidad — inaceptable para
este negocio. El rollback permitido es:

1. Desactivar el flujo profesional nuevo (apagar la bandera de
   activación).
2. Impedir la descarga profesional mientras el flujo está desactivado —
   no ofrecer un sustituto degradado.
3. Restaurar la última versión conocida y validada del motor servidor
   (no la del cliente).
4. Conservar el motor cliente únicamente para estimador, caracterización
   o visualización permitida — nunca reactivarlo como fuente de una
   valoración profesional, ni siquiera temporalmente.
5. **Preferir suspender temporalmente una entrega antes que producir una
   valoración que se sabe o se sospecha incorrecta.** La disponibilidad
   nunca es una razón válida para degradar la exactitud en este negocio.

### Condiciones de detención

Cualquier diferencia servidor/cliente no explicada durante la
comparación detiene la activación — no se activa "mientras se investiga",
se investiga primero.

---

## Estado y aprobación final del análisis

Máquina de estados mínima (nombres no definitivos, sujetos a
implementación real en 1A/diseño y 1E/activación):

```text
uploaded
→ parsed
→ mapped
→ validated
→ calculated
→ narrative_generated
→ human_review_pending
→ approved_for_delivery
→ delivered
```

Reglas que gobiernan esta máquina de estados (documentadas aquí,
implementadas en 1A diseño → 1C versionado → 1E activación):

- **Solo `approved_for_delivery` permite generar o descargar el informe
  profesional.** Ningún estado anterior habilita la descarga.
- La verificación de que un análisis está en `approved_for_delivery` se
  hace **server-side** — nunca se confía en un flag del cliente/frontend.
- **Cualquier modificación posterior** a documentos, mappings, inputs,
  supuestos, fórmulas, narrativa o resultados **invalida la aprobación**
  — el análisis vuelve a un estado anterior (`calculated` o el que
  corresponda), no permanece en `approved_for_delivery` con datos
  distintos a los que se aprobaron.
- La aprobación registra: usuario que aprobó, su rol, timestamp, y la
  versión exacta (de cálculo, fórmulas y datos macro, según el
  versionado de `BL-32`) que se aprobó.
- El PDF entregado corresponde a una **versión inmutable o reproducible**
  del resultado aprobado — no a un recálculo posterior, aunque use los
  mismos datos de entrada.

---

## Evidencias requeridas (toda la fase)

Tabla comparativa (1A), pruebas de caracterización y especificación
(1A), commits/diffs de cada corrección (1B), resultado de casos dorados y
aprobación del revisor externo (1C), resultado de las 10 pruebas de
seguridad (1D), comparación servidor/cliente y pruebas de invalidación de
aprobación (1E).

## Checklist de cierre (toda la fase)

- [ ] 1A: tabla comparativa, pruebas de caracterización y especificación,
      contrato tipado, diseño de estados y versionado — completos.
- [ ] 1B: BL-02 a BL-06, BL-17, ROE/ROA — resueltos con el ciclo de 4
      pasos completo cada uno.
- [ ] 1C: casos dorados y trazabilidad aprobados por el revisor financiero
      externo.
- [ ] 1D: las 10 pruebas de seguridad pasan; BL-10 resuelto; sin refactor
      global de las 12 funciones.
- [ ] 1E: PDF y narrativa conectados al resultado canónico; comparación
      servidor/cliente aprobada; flujo activado solo en entorno
      controlado.
- [ ] `plan/MATRIZ-DE-RIESGOS.md` actualizada fila por fila.
- [ ] Reporte de implementación completado por cada bloque.

## Plantilla del reporte de implementación

Ver plantilla en `fases/FASE-00-CIERRE-DE-AUDITORIA.md` — una instancia
separada por bloque (1A, 1B, 1C, 1D, 1E).
