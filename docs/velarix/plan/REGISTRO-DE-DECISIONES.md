# Registro de Decisiones

Registra únicamente decisiones tomadas o verificadas **durante esta
auditoría**. No reemplaza `Negocio_Velarix_v4.1.md` — las decisiones de
negocio viven ahí. Aquí solo van decisiones operativas/técnicas sobre
cómo se ejecutó la auditoría misma, y hallazgos que requirieron una
decisión de criterio para clasificarse.

## D-01 — Fuente de verdad de negocio para esta auditoría

- **Fecha**: 2026-07-22
- **Contexto**: existen 3 archivos de definición de negocio en la raíz
  del repo (`Negocio.md` v3, `NEGOCIO_V4_VELARIX.md` v4,
  `Negocio_Velarix_v4.1.md` v4.1) con contenido distinto.
- **Decisión**: usar `Negocio_Velarix_v4.1.md` como fuente de verdad para
  toda esta auditoría, por instrucción explícita del fundador en el
  prompt de esta tarea.
- **Evidencia**: `diff` entre v4 y v4.1 confirma que v4.1 es una versión
  posterior que resuelve 3 tensiones identificadas en una revisión de
  comprensión previa de v4.
- **Consecuencias**: los otros dos archivos no se tocaron (no estaba
  autorizado moverlos/renombrarlos/eliminarlos). Quedan como hallazgo de
  higiene documental en `docs/velarix/README.md`.
- **Estado**: aplicada.
- **Quién debe aprobar**: el fundador debe confirmar o corregir esta
  elección, y decidir qué hacer con los otros dos archivos.

## D-02 — Exclusión de `velarix-code-latest/` del alcance de auditoría

- **Fecha**: 2026-07-22
- **Contexto**: existe una carpeta `velarix-code-latest/` en la raíz del
  repo, respaldo de una versión anterior del proyecto bajo Lovable.
- **Decisión**: excluir esta carpeta de todo hallazgo de la auditoría —
  no representa código vigente. Se instruyó explícitamente a los 6
  subagentes de solo lectura que la ignoraran.
- **Evidencia**: `.gitignore` ya la excluye del control de versiones;
  `eslint.config.js` no la excluye (causa 144 de los 286 errores de lint
  reportados por `npm run lint` sin filtrar, ver `auditoria/06`).
- **Consecuencias**: los conteos de errores de lint en `auditoria/06`
  están filtrados manualmente para excluir esta carpeta. Se recomienda
  (no se ejecutó) agregarla a `ignores` en `eslint.config.js` para que
  futuras ejecuciones de `npm run lint` no requieran este filtrado manual.
- **Estado**: aplicada para esta auditoría; el fix de `eslint.config.js`
  queda como tarea pendiente (ver `BACKLOG-CLASIFICADO.md`).
- **Quién debe aprobar**: no requiere aprobación adicional — es
  higiene de configuración, no una decisión de negocio.

## D-03 — Clasificación de `claude-opus-4-8` como identificador válido

- **Fecha**: 2026-07-22
- **Contexto**: uno de los 6 subagentes de auditoría, sin acceso a
  documentación externa de modelos Anthropic, marcó el modelo
  `claude-opus-4-8` (usado en `_shared/anthropic-client.ts:18`) como
  "identificador de modelo dudoso" y posible riesgo.
- **Decisión**: reclasificar este hallazgo como **RESUELTO, no riesgo**.
  Esta sesión ya contaba con la referencia oficial de modelos Anthropic
  (cargada antes de ejecutar la migración de Lovable a Anthropic en una
  fase anterior de este mismo trabajo) que confirma `claude-opus-4-8`
  (Claude Opus 4.8) como modelo real y vigente.
- **Evidencia**: referencia de modelos cargada en esta sesión antes de la
  migración; no se hizo ninguna llamada en vivo a la API de Anthropic
  durante esta auditoría de solo lectura para reconfirmarlo.
- **Consecuencias**: `auditoria/00-RESUMEN-EJECUTIVO.md` y
  `auditoria/08-INFRAESTRUCTURA-E-INTEGRACIONES.md` reflejan esta
  reclasificación explícitamente, sin ocultar que el subagente lo marcó
  como duda.
- **Estado**: aplicada.
- **Quién debe aprobar**: ninguna acción requerida; queda documentado por
  transparencia sobre por qué el hallazgo de un subagente se sobreescribió.

## D-04 — No se ejecutaron migraciones, cambios de RLS, ni llamadas en vivo a Supabase/Anthropic durante la auditoría

- **Fecha**: 2026-07-22
- **Contexto**: el alcance autorizado permitía "ejecutar lint, typecheck,
  pruebas y build cuando existan y sea seguro", pero no migraciones,
  seeds, resets, deploys, ni comandos que escriban en Supabase o expongan
  secretos.
- **Decisión**: se respetó estrictamente ese límite. Las validaciones
  ejecutadas fueron únicamente `git status`, `npm run lint`,
  `npx tsc --build --noEmit`, `npm test`, `npx vite build` — todas locales,
  ninguna contra servicios externos.
- **Evidencia**: comandos y resultados documentados en `auditoria/06-CALIDAD-CODIGO-Y-PRUEBAS.md`.
- **Consecuencias**: ciertos hallazgos quedan marcados `NO VERIFICABLE`
  (ej. comportamiento real de `verify_jwt` en producción, configuración
  real de variables de entorno en el entorno de despliegue) porque
  confirmarlos habría requerido acceso no autorizado en esta tarea.
- **Estado**: aplicada.
- **Quién debe aprobar**: no aplica — es cumplimiento del alcance ya
  autorizado, no una decisión nueva.

## D-05 — Trato de la duplicación de código como deuda clasificada, no como corrección inmediata

- **Fecha**: 2026-07-22
- **Contexto**: se identificaron múltiples duplicaciones (motores de
  cálculo, `corsHeaders`, patrón de autenticación, datasets Damodaran).
- **Decisión**: documentar toda duplicación con su severidad real
  (algunas son P0 por su efecto en exactitud financiera, otras son P2/P3
  de mantenibilidad), sin recomendar una consolidación masiva inmediata.
- **Evidencia**: `Negocio_Velarix_v4.1.md` §13.5 exige que un refactor
  justifique problema concreto, riesgo, beneficio, alcance, pruebas y
  rollback antes de ejecutarse — una auditoría de solo lectura no puede
  cumplir ese estándar por sí sola.
- **Consecuencias**: `plan/PLAN-MAESTRO.md` y `auditoria/10` separan
  explícitamente qué duplicación es P0 (motores de cálculo, por su efecto
  en exactitud) de la que es P2 (`corsHeaders`, patrón de auth).
- **Estado**: aplicada.
- **Quién debe aprobar**: el fundador decide, fase por fase, cuándo
  ejecutar cada consolidación — ver `fases/FASE-01-EXACTITUD-FINANCIERA.md`
  y siguientes.

## D-06 — Decisión de arquitectura: el pipeline del servidor es el motor de cálculo canónico

- **Fecha**: 2026-07-23
- **Tipo**: decisión de arquitectura, `✅ Confirmado` por el fundador.
  Resuelve la dependencia raíz identificada en `MATRIZ-DE-DEPENDENCIAS.md`
  (BL-01) y el hallazgo central de `auditoria/04-CALIDAD-FINANCIERA.md`
  y `auditoria/02-ARQUITECTURA-ACTUAL.md` (split-brain de motores de
  cálculo).

### Contexto

La auditoría (Fase 0) confirmó que existen dos implementaciones
independientes del motor DCF/WACC: una server-side
(`supabase/functions/ejecutar-calculo`, con pipeline completo de
parseo→homologación→validación→structured input→narrativa IA→revisión
humana) y una client-side (`src/lib/financial-engine.ts`, ejecutada de
nuevo en el navegador al descargar el PDF, `src/pages/Dashboard.tsx:64-133`).
El PDF que el cliente descarga hoy usa exclusivamente la segunda,
ignorando el resultado ya calculado y persistido por la primera, y sin
narrativa de IA. Era necesario decidir cuál es la fuente oficial de
verdad antes de corregir ningún bug financiero (ver `MATRIZ-DE-DEPENDENCIAS.md`).

### Alternativas consideradas

1. **Mantener el motor del navegador como oficial** — es el que ya
   produce el entregable visible hoy, requeriría menos cambios
   inmediatos.
2. **Declarar el motor del servidor como canónico** — exige reconectar el
   PDF y la narrativa al resultado persistido, pero preserva el pipeline
   de validación, homologación y revisión humana.
3. **Mantener ambos indefinidamente**, sincronizados manualmente — ya
   descartada de forma implícita por la propia auditoría: es la causa
   raíz del problema, no una solución.

### Decisión

**El pipeline del servidor es la única fuente oficial de verdad
financiera** para el Diagnóstico de preparación y la Valoración
profesional. Flujo canónico:

```
documentos → parseo → homologación → validación → structured input
→ cálculo determinístico en servidor → resultado persistido y versionado
→ narrativa generada a partir de ese mismo resultado → revisión humana
→ PDF basado exclusivamente en el resultado aprobado
```

El frontend **no** debe recalcular una valoración profesional. El motor
del navegador (`financial-engine.ts`) se conserva, **temporalmente y con
alcance reducido**, únicamente para:

- el Estimador gratuito (§5.1 del negocio — ya es su uso legítimo hoy);
- visualización de resultados ya calculados (sin volver a ejecutar
  fórmulas);
- gráficas o tablas derivadas del resultado del servidor;
- previsualización de un informe sin recalcular.

El PDF puede seguir renderizándose en el frontend si la arquitectura
actual lo exige por ahora, pero **no puede ejecutar fórmulas financieras
ni reconstruir resultados** — todas sus cifras deben provenir del
`calculation_result` canónico persistido en el servidor.

### Razones

- Preserva trazabilidad, homologación validada y revisión humana — todo
  lo que el motor del navegador se salta hoy.
- Evita depender del dispositivo/navegador del cliente para un cálculo
  financiero que se va a defender ante un revisor externo o un cliente.
- Elimina la posibilidad estructural de que interfaz y servidor muestren
  cifras distintas para el mismo análisis.
- Es coherente con `Negocio_Velarix_v4.1.md` §9.1 ("los cálculos deben
  ser determinísticos, reproducibles y probados") — reproducible exige
  una sola implementación autoritativa, no dos que puedan divergir.

### Consecuencias

- El `calculation_result` persistido en `analyses.calculation_result` deja
  de ser un dato que "se guarda pero no se lee" (hallazgo de
  `auditoria/04`) y pasa a ser la entrada obligatoria de narrativa y PDF.
- `generate-narrative` debe conectarse al flujo real de
  `run-analysis-pipeline` (hoy huérfana, ver `auditoria/03`,
  `auditoria/08`).
- El bug latente (B) de `auditoria/04` (`ejecutar-calculo` lee
  `bs.total_debt`/`bs.financial_debt`, campos inexistentes) deja de ser
  "latente" y pasa a ser P0 real, porque este motor se convierte en el
  único que importa.
- Se requiere trabajo de transición (no un corte inmediato) — ver
  estrategia abajo.

### Riesgos de esta decisión

- Si la transición se apura sin pruebas de caracterización, se puede
  introducir una regresión visible para el usuario (un resultado que
  antes se veía y ahora no, o que cambia de valor sin explicación).
- El motor del servidor tiene su propio bug latente (B) que debe
  corregirse como parte de esta misma transición, no después.

### Estrategia de transición (no se elimina el motor del cliente de inmediato)

1. Inventariar y comparar ambos motores línea a línea (entradas,
   fórmulas, salidas, consumidores) — ver Fase 1A.
2. Escribir pruebas de caracterización que registren qué produce hoy el
   motor del cliente para un conjunto de casos, **antes** de tocar nada.
3. Corregir el motor del servidor (bug B y los demás bugs financieros de
   Fase 1B) hasta que sus resultados sean confiables y probados.
4. Conectar narrativa y PDF al `calculation_result` del servidor.
5. Comparar, para los mismos casos de prueba, servidor vs. cliente. Solo
   cuando coincidan (o se entienda y apruebe cualquier diferencia) se
   considera al motor del servidor listo para reemplazar al del cliente
   en el flujo de Diagnóstico/Valoración.
6. El motor del cliente se retira de ese rol (no del código
   necesariamente) solo después del paso 5 — nunca antes.

### Condiciones para reconsiderar esta decisión

- Si las pruebas de caracterización revelan que el pipeline del servidor
  no puede replicar razonablemente los resultados que el negocio ya
  considera correctos, sin una explicación clara del porqué.
- Si el revisor financiero externo (`Negocio_Velarix_v4.1.md` §9.4)
  identifica un problema estructural en el enfoque server-side que no
  estaba contemplado aquí.
- Cualquier reconsideración se documenta como una nueva entrada en este
  registro (D-07 en adelante), no se sobreescribe esta decisión.

- **Quién debe aprobar**: el fundador ya aprobó esta decisión (este mismo
  registro es la confirmación). Cambios futuros a esta decisión requieren
  la misma autoridad.
- **Estado (actualizado 2026-07-23)**: `✅ Confirmado — decisión resuelta,
  implementación pendiente`. El fundador revisó el ZIP completo de
  `docs/velarix/` y aprobó explícitamente tanto la auditoría como esta
  decisión. La Fase 1 **no** queda autorizada para implementación
  todavía — requería y recibió una corrección documental final, registrada
  en D-07.

## D-07 — Refinamiento del plan de implementación de D-06: secuencia 1A–1E

- **Fecha**: 2026-07-23
- **Tipo**: refinamiento documental de un plan ya aprobado (D-06), no una
  nueva decisión de arquitectura. `✅ Confirmado` por el fundador.

### Contexto

Tras revisar el ZIP completo de la auditoría, el fundador aprobó D-06 pero
identificó que la secuencia 1A→1B→1C→1D (versión anterior) mezclaba
diseño con implementación dentro de 1A, no distinguía pruebas de
caracterización de pruebas de especificación, subestimaba el control de
acceso necesario en `continuar-tras-revision` (ownership no es
suficiente), y no separaba la activación del flujo nuevo (conexión real
de PDF/narrativa al servidor) de la corrección de los bugs subyacentes.

### Decisión

Se reestructura la Fase 1 en **cinco** bloques, no cuatro:

1. **1A — Caracterización y contrato canónico**: solo diseño, pruebas de
   caracterización (registran el comportamiento actual, incluso
   incorrecto) y pruebas de especificación (definen el comportamiento
   correcto y deben **fallar** antes de 1B). Ningún cambio en 1A habilita
   el servidor como entregable real.
2. **1B — Correcciones financieras**: cada bug sigue el ciclo
   prueba-que-falla → corrección → prueba-que-pasa → verificación de no
   regresión, usando las pruebas de especificación ya escritas en 1A.
3. **1C — Casos dorados, trazabilidad y revisión externa**: sobre el
   motor ya corregido por 1B.
4. **1D — Seguridad P0 del flujo**: secuencial (no agentes paralelos
   modificando los mismos archivos), con autorización real (no solo
   ownership) para `continuar-tras-revision`, y `BL-10` (auto-escalamiento
   de `role`) movido aquí como P0.
5. **1E — Integración y activación controlada** (nuevo): solo empieza
   cuando 1B, 1C y 1D están cerrados. Conecta PDF y narrativa al resultado
   canónico, compara servidor vs. cliente sobre los casos caracterizados
   en 1A, y activa el flujo nuevo solo en entorno controlado o tras
   bandera de activación — nunca para usuarios finales sin superar todos
   los criterios de `fases/FASE-01-EXACTITUD-FINANCIERA.md`.

### Razones

- Diseñar el contrato canónico y las pruebas de especificación **antes**
  de tocar el motor evita que la corrección de bugs (1B) se haga sin un
  criterio de éxito ya definido.
- `continuar-tras-revision` no puede protegerse solo verificando que el
  `analysis_id` pertenece al llamante — el propietario del análisis
  típicamente **es** el cliente, y el cliente nunca debe poder
  aprobar/continuar su propia revisión. Se requiere autorización basada en
  rol (analista/admin/invocación interna), no solo ownership.
- Separar 1E de 1A/1B/1C evita activar el flujo nuevo para usuarios reales
  antes de que seguridad, exactitud y trazabilidad estén cerradas.

### Consecuencias

- `BL-01` ahora vive en 1A como **diseño únicamente** — no se
  "resuelve" hasta 1E, donde se activa realmente.
- `BL-10` se mueve de Fase 2 a 1D, con prioridad P0 (no P1).
- `BL-18` (extracción completa de `_shared/cors.ts`/`_shared/auth.ts`)
  **permanece en Fase 2, P2** — en 1D solo se permite un helper mínimo si
  es estrictamente necesario para las 2 funciones P0 intervenidas, no un
  refactor de las 12 funciones.
- Nace `BL-29` (conectar `generate-narrative` al pipeline canónico) como
  ítem separado de `BL-20` (que queda acotado a notificaciones muertas/gap
  de cobertura, sin relación con la conexión de la narrativa).
- El rollback de 1E queda explícitamente prohibido de volver
  silenciosamente al motor cliente para producir una valoración
  profesional — el rollback correcto es desactivar el flujo nuevo y
  suspender la entrega, nunca degradar a un resultado que se sabe
  incorrecto.

### Riesgos

Si esta secuencia no se respeta (ej. se corrige un bug de 1B antes de que
existan las pruebas de especificación de 1A), se pierde la garantía de que
la corrección resuelve exactamente el comportamiento documentado como
incorrecto — se estaría corrigiendo "a ojo".

### Estrategia de transición

Sin cambios respecto a D-06 — se mantiene la estrategia de no eliminar el
motor cliente hasta que 1E confirme equivalencia (o explique y apruebe
cualquier diferencia) entre servidor y cliente.

### Condiciones para reconsiderar

Las mismas de D-06, más: si durante 1D se determina que el modelo de
actores (cliente propietario / analista autorizado / administrador /
invocación interna) no es suficiente para algún caso real, se documenta
como D-08, no se improvisa sobre esta decisión.

- **Quién debe aprobar**: el fundador ya aprobó este refinamiento (este
  registro es la confirmación).
