# Matriz de Dependencias

Qué tarea/hallazgo depende de qué otra cosa antes de poder empezar. Esto
determina el orden interno de trabajo dentro de cada fase (ver
`fases/FASE-XX-*.md`).

> **Actualizado 2026-07-23 (tras D-07)**: se corrige una contradicción de
> la versión anterior — la conexión de `generate-narrative` y del PDF al
> resultado servidor **no** ocurre en el Bloque 1A (que es solo diseño y
> pruebas, sin activar nada), sino en el **Bloque 1E**. Esta versión
> refleja la secuencia completa 1A → 1B → 1C → 1E, con 1D en paralelo.

## Decisión raíz — RESUELTA y APROBADA (`D-06`, refinada en `D-07`, 2026-07-23)

**Decidir cuál motor de cálculo es el oficial** ya no es una decisión
pendiente — el fundador la aprobó. Lo que antes dependía de "tomar la
decisión" ahora depende de **implementarla** en la secuencia correcta:

| Tarea | Depende de… | Por qué |
|---|---|---|
| Tabla comparativa, contrato tipado, diseño de estados/versionado, pruebas de caracterización | Nada — es el primer paso | Bloque 1A — **cerrado documentalmente 2026-07-23**, ver `docs/velarix/bloque-1a/REPORTE-CIERRE-BLOQUE-1A.md` |
| Pruebas de especificación ejecutables para BL-02, BL-03 y BL-05 | Habilitar Deno en el entorno de pruebas, o extraer la lógica pura a módulos probables desde Vitest (refactor mínimo y controlado) | **Pendiente** — solo BL-04 tiene prueba ejecutable hoy; BL-02/03/05 solo tienen evidencia de trazado manual, que no reemplaza una prueba automatizada |
| Corrección del bug (B) — `ejecutar-calculo` lee campos inexistentes | Bloque 1A completo (prueba de especificación ya escrita y fallando) | Se corrige en 1B, sobre el motor que 1A ya caracterizó — no antes, y no sin una prueba que demuestre la corrección |
| Conexión de `generate-narrative` al flujo real (`BL-29`) | Bloques 1B, 1C **y** 1D cerrados | Es tarea explícita del **Bloque 1E**, no de 1A — activar la narrativa antes de corregir los bugs (1B) o de tener casos dorados aprobados (1C) expondría al usuario a resultados no probados |
| Conexión del PDF al resultado canónico | Bloques 1B, 1C y 1D cerrados | Misma razón — tarea del Bloque 1E |
| Diseño del campo de trazabilidad (`document_id`/`mapping_id`) | Bloque 1A (diseño) y Bloque 1B completo (implementación en 1C) | El esquema de datos debe estabilizarse (bugs corregidos) antes de implementar qué se traza |
| Corrección de `enviar-notificacion` (lee tabla huérfana `calculation_results`) | Bloque 1A (decide si se retira la tabla huérfana) para el diseño; Bloque 1E para que la corrección tenga efecto real (la narrativa debe estar conectada) | Corregir el nombre de tabla sin que la narrativa esté conectada no resuelve el problema de fondo |
| Casos dorados del motor financiero (`BL-14`) | Bloques 1A y 1B completos | Bloque 1C — no tiene sentido crear casos dorados sobre un motor que todavía tiene bugs conocidos sin corregir |

## Dependencias entre bugs financieros (Bloque 1B, una vez cerrado el Bloque 1A)

> **Actualizado 2026-07-23 (1B-P0)**: R-01, R-02, R-03, R-05 y R-14
> quedaron **corregidos** — ver
> `docs/velarix/bloque-1b/REPORTE-IMPLEMENTACION-1B-P0.md`. Las
> dependencias descritas abajo se conservan como registro de por qué se
> pudieron corregir en el orden en que se hizo (todas resultaron
> efectivamente independientes entre sí, como se había anticipado).

- R-01 (consolidación de subcuentas) — independiente, puede corregirse en
  paralelo con R-02/R-03, siempre que cada uno tenga su prueba de
  especificación de 1A ya escrita y fallando. **Corregido en 1B-P0.**
- R-02 (conversión de moneda) — independiente. **Corregido en 1B-P0.**
- R-03 (PDF "USD") — depende de que exista el dato de `moneda_analisis`
  correctamente propagado (ya existe hoy en `structured_inputs`); no
  depende de R-02, son bugs distintos en archivos distintos. **Corregido en 1B-P0.**
- R-05 (campo de deuda mal nombrado) — independiente de R-01/R-02/R-03,
  mismo archivo (`ejecutar-calculo`) que otras correcciones — coordinar en
  el mismo commit o en commits secuenciales, no en paralelo. **Corregido en 1B-P0.**
- R-14 (`run-analysis-pipeline` no aborta ante falla de `map-accounts`) —
  independiente, puede corregirse en cualquier momento del Bloque 1B. **Corregido en 1B-P0.**
- Constantes macro/sectoriales (`BL-17`) — independiente de los bugs
  anteriores, pero comparte archivos (`build-structured-input`,
  `ejecutar-calculo`, `update-snapshots`) — coordinar el orden de commits.

## Dependencias de seguridad — Bloque 1D (independiente de 1A/1B/1C como bloque, coordinado en archivos compartidos)

- R-06 (`ejecutar-calculo` sin ownership) — depende únicamente de que
  `D-06`/`D-07` ya estén decididos (lo están); no depende de que 1A/1B/1C
  avancen. Coordinar en secuencia (no en paralelo) con los cambios que 1A
  haga sobre el mismo archivo.
- R-07 (`continuar-tras-revision` sin autenticación ni autorización
  privilegiada) — misma independencia que R-06. **Depende del modelo de
  actores** (cliente propietario / analista autorizado / administrador /
  invocación interna) estar definido — se define dentro del propio Bloque
  1D, no es una dependencia externa.
- R-08 (recorte: impedir autoaprobación) y R-09 (`BL-10`, auto-escalamiento
  de `role`) — ambos P0 en 1D. R-09 debe resolverse **antes o junto con**
  R-08: no tiene sentido impedir que un cliente apruebe su propia revisión
  si ese mismo cliente puede auto-asignarse `role = analyst` para saltarse
  el control.
- El **sistema completo** de control de rol (permisos por asignación
  entre múltiples analistas) permanece en Fase 2, y depende de que
  `Negocio_Velarix_v4.1.md` confirme quién exactamente puede ser
  "analista" además del fundador.
- `BL-18` (extracción completa de `_shared/cors.ts`/`_shared/auth.ts`)
  **no es dependencia de 1D** — permanece en Fase 2, P2. En 1D solo se
  permite un helper mínimo acotado a las 2 funciones P0, si es
  estrictamente necesario.
- R-12 (eliminación real de datos) — permanece en Fase 2, depende de una
  decisión legal (§12.4, §23 de `Negocio_Velarix_v4.1.md`, pendiente de
  abogado externo).

## Dependencias del Bloque 1E (el más dependiente de toda la Fase 1)

- 1E depende de **1B, 1C y 1D cerrados** — no de "en progreso", cerrados.
- La comparación servidor/cliente de 1E depende de las pruebas de
  caracterización escritas en 1A (`BL-27`) — si no existen o están
  incompletas, 1E no tiene con qué comparar.
- La activación controlada (bandera de activación / entorno controlado)
  depende de que el diseño de estados de 1A (`approved_for_delivery`,
  etc.) ya esté implementado — no se activa un flujo que no sabe
  distinguir "calculado" de "aprobado para entrega".

## Dependencias hacia el negocio (no técnicas, bloquean fases completas)

- **Revisor financiero externo** (`Negocio_Velarix_v4.1.md` §9.4) — no es
  una tarea de código. Bloquea el cierre del Bloque 1C (aprobación de
  casos dorados) y, por extensión, el inicio de 1E. También bloquea el
  inicio de la Fase 3 (pilotos). Debe identificarse en paralelo al trabajo
  de código de 1A/1B, no después.
- **Contrato y NDA** (`Negocio_Velarix_v4.1.md` §7, §23) — bloquea el
  inicio de la Fase 3. Depende de revisión de un abogado externo (§8.2).
- **Precio validado** (`Negocio_Velarix_v4.1.md` §6.2, §6.4) — bloquea la
  Fase 4, no bloquea la Fase 1/2/3.

## Qué NO puede empezar todavía (resumen)

> **Actualizado 2026-07-23**: Bloque 1A quedó **cerrado documentalmente,
> con limitación técnica registrada** (ver
> `fases/FASE-01-EXACTITUD-FINANCIERA.md`, sección "Bloque 1A"). Bloque 1B
> ya puede iniciar en cuanto se autorice explícitamente — sigue sin
> iniciarse. Nota: la prueba de especificación ejecutable solo existe para
> BL-04; BL-02, BL-03 y BL-05 tienen evidencia de trazado manual, que
> **confirma la causa aparente de cada bug pero no reemplaza una prueba
> automatizada** (bloqueo de Deno en este entorno) — sus pruebas
> ejecutables siguen **pendientes**. Ningún bug puede marcarse corregido
> únicamente mediante trazado manual: antes de modificar BL-02, BL-03 o
> BL-05 en Bloque 1B debe existir una prueba ejecutable que falle. El
> **primer paso obligatorio de Bloque 1B** es habilitar un entorno de
> pruebas para las Edge Functions mediante Deno, o extraer la lógica
> financiera pura a módulos probables desde Vitest con un refactor mínimo
> y controlado — recién después se procede a corregir cada bug.

| Tarea | Bloqueada por |
|---|---|
| Bloque 1B-P0 (corrección de BL-02/03/04/05/06) | **Completado 2026-07-23** — ver `docs/velarix/bloque-1b/REPORTE-IMPLEMENTACION-1B-P0.md` |
| Bloque 1B-metodología (BL-17, R-19, ROE/ROA, escenarios) | Autorización explícita del fundador — sigue sin iniciarse |
| Bloque 1C (casos dorados y trazabilidad) | Bloque 1B completo |
| Bloque 1E (integración y activación) | Bloques 1B, 1C **y** 1D todos cerrados |
| Conexión real de `generate-narrative` y del PDF al servidor | Bloque 1E — no antes, bajo ninguna circunstancia |
| Automatización de cobro (Fase 5) | Precio validado + al menos un cliente pagado |
| Retainers/time entries (Fase 7) | Repetibilidad demostrada (Fase 6) — diferido explícitamente por negocio |
| Automatización dinámica de datos macro (cron real) | Diferida a Fase 7 — no se conecta en el Bloque 1B, aunque ahí sí se fije la fuente canónica |
| Cualquier piloto con datos reales de un tercero | Fase 1 completa (1A–1E) y Fase 2 completas + revisor financiero + contrato/NDA |
