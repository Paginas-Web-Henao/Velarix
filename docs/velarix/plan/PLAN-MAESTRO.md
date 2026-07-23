# Plan Maestro

Este documento ordena el trabajo recomendado **sin implementarlo**. Fuente
de evidencia: `auditoria/*`. Fuente de autoridad de negocio:
`Negocio_Velarix_v4.1.md`.

> **Actualizado 2026-07-23 (v2, tras D-07)**: la decisión de arquitectura
> `D-06` (`REGISTRO-DE-DECISIONES.md`) ya resolvió cuál motor de cálculo
> es el oficial (el pipeline del servidor), y el fundador la aprobó tras
> revisar el ZIP completo de la auditoría. La Fase 1 se divide ahora en
> **cinco** bloques — 1A, 1B, 1C, 1D, 1E — no cuatro. `BL-10` se mueve a
> 1D con prioridad P0; `BL-18` permanece en Fase 2 como P2 (en 1D solo se
> permite un helper mínimo acotado); nace `BL-29` para conectar la
> narrativa (no confundir con `BL-20`). Ver
> `fases/FASE-01-EXACTITUD-FINANCIERA.md` para el detalle completo,
> incluida la sección de exclusiones explícitas de toda la Fase 1.

## Estado inicial (al cierre de esta auditoría)

- Producto técnicamente funcional en sus partes individuales, con un
  split-brain arquitectónico central: el pipeline server-side con IA
  (parseo→homologación→validación→cálculo→narrativa) no llega al
  entregable que el cliente realmente recibe (PDF recalculado 100% en el
  navegador, sin narrativa).
- 3 bloqueantes de seguridad confirmados (2 de autenticación, 1 de control
  de rol).
- 4 bugs de cálculo financiero confirmados con causa raíz exacta.
- Cero cobertura de pruebas real.
- Ningún dato de cliente real ha entrado al sistema bajo el modelo de
  negocio v4.1 (etapa precomercial, confirmado por `Negocio_Velarix_v4.1.md`
  §1.4).

## Principios (heredados de `Negocio_Velarix_v4.1.md` §0 y §13)

1. Las decisiones comerciales validadas mandan sobre el código.
2. Una hipótesis de negocio no obliga a construir una funcionalidad.
3. Si el código contradice una decisión confirmada, se corrige el código.
4. No se reorganiza el repositorio por estética — solo con justificación
   de problema concreto, riesgo, beneficio, alcance, pruebas y rollback.
5. Se implementa una fase a la vez; no se abre la siguiente sin cerrar la
   anterior (checklist de cierre en cada `fases/FASE-XX-*.md`).
6. Ningún hallazgo se marca resuelto sin una prueba de regresión que lo
   demuestre.

## Prioridades (P0–P3, ver `Negocio_Velarix_v4.1.md` §17/§18 para el marco de fases)

### P0 — puede alterar cifras, exponer datos, destruir información o impedir pilotos

1. Consolidación de subcuentas rota (`.find()` en 3 archivos) — `auditoria/04`, hallazgo #1. → Fase 1B (prueba de especificación ya escrita en 1A).
2. Conversión de moneda nunca se aplica — `auditoria/04`, hallazgo (C). → Fase 1B.
3. PDF siempre etiqueta "USD" — `auditoria/04`, hallazgo #2. → Fase 1B.
4. ~~Split-brain de motores de cálculo (decidir cuál es el oficial)~~ — **decidido, `D-06`: el servidor es canónico.** Diseño del contrato canónico → Fase 1A. **Activación real** (conectar PDF/narrativa) → Fase 1E, no antes.
5. `ejecutar-calculo` sin verificación de ownership — `auditoria/05`. → Fase 1D.
6. `continuar-tras-revision` sin autenticación **ni autorización privilegiada** — `auditoria/05`. → Fase 1D. **Corrección de alcance (D-07)**: no basta con verificar ownership — el cliente propietario nunca debe poder aprobar/continuar su propia revisión; se requiere verificar que el llamante es analista/admin/invocación interna.
7. Sin control de rol real en `/admin/revisiones` — `auditoria/05`, `auditoria/07`. → recorte P0 en Fase 1D (impedir autoaprobación) + `BL-10` (auto-escalamiento de `role`, también P0 en 1D); sistema completo de rol (múltiples analistas) en Fase 2.
8. `ejecutar-calculo` lee campos inexistentes (`total_debt`/`financial_debt`) — `auditoria/04`, hallazgo (B). Ya no es latente: al declararse este motor canónico (D-06), es P0 real. → Fase 1B.

### P1 — necesario antes del primer cliente pagado

- Casos dorados y pruebas de regresión del motor financiero — `auditoria/04`.
- Trazabilidad mínima documento→cifra — `auditoria/04`, `auditoria/11` C-02.
- Auditoría de descargas — `auditoria/05`.
- Procedimiento real de eliminación de datos — `auditoria/05`.
- `run-analysis-pipeline` debe abortar ante falla de `map-accounts` — `auditoria/06`.
- Revisor financiero externo (persona, no código) — `Negocio_Velarix_v4.1.md` §9.4, bloqueante de negocio, no técnico.
- Contrato y NDA (documentos, no código) — `Negocio_Velarix_v4.1.md` §7, §23.

### P2 — necesario para repetibilidad

- `_shared/cors.ts` y `_shared/auth.ts` — extracción **completa** para las
  12 funciones. **Permanece en Fase 2, P2.** (El Bloque 1D de la Fase 1
  solo permite un helper mínimo acotado a las 2 funciones P0 intervenidas
  — no esta consolidación general.) — `auditoria/06`, `auditoria/10`.
- Consolidar los datos macro/sectoriales a una fuente canónica fija (esto
  se hace en Fase 1B, ver P0 arriba) — la **automatización dinámica**
  (cron real conectando `ejecutar-calculo` a `external_snapshots` en vivo)
  se difiere explícitamente a Fase 7. — `auditoria/04`, `auditoria/08`.
- Cobertura de notificaciones (`reporte_listo` dead code, gap de auditoría
  fallida) — depende de `BL-29` (conectar `generate-narrative`, Fase 1E) —
  `auditoria/08`.
- Tipar contratos de respuesta entre Edge Functions — `auditoria/06`.

### P3 — optimización, automatización o escalamiento

- Code-splitting del bundle (1.76MB) — `auditoria/09`.
- Paralelizar queries de polling — `auditoria/09`.
- Automatizar `update-snapshots`/`check-data-freshness` con cron real — `auditoria/08`.
- Retainers, time entries, pagos automáticos — diferido explícitamente por negocio (`Negocio_Velarix_v4.1.md` §13.3).

## Exclusiones explícitas de la Fase 1 (referencia rápida)

Ver el detalle completo en `fases/FASE-01-EXACTITUD-FINANCIERA.md`. En
resumen: pagos, retainers, dashboards nuevos, rediseño visual,
code-splitting, automatización de actualización macro, refactor general
de CORS/auth (`BL-18` completo), reorganización del repositorio, nuevos
segmentos/servicios, cambios comerciales, producción con datos reales de
terceros, y eliminación del motor cliente antes de cerrar 1E — ninguno de
estos entra en ningún bloque de la Fase 1.

**Regla explícita**: un problema visual (P3) no debe desplazar un error
financiero (P0). Ver `Negocio_Velarix_v4.1.md` §9.

## Dependencias (resumen; detalle completo en `MATRIZ-DE-DEPENDENCIAS.md`)

- La decisión raíz (P0-4) ya está tomada (`D-06`) y aprobada. La secuencia
  real ahora es **1A → 1B → 1C**, con **1D en paralelo** (coordinado en
  los archivos compartidos con 1A, nunca con agentes paralelos tocando el
  mismo archivo), y **1E solo cuando 1B, 1C y 1D estén cerrados** (ver
  `fases/FASE-01-EXACTITUD-FINANCIERA.md`):
  - 1A: solo diseño y pruebas (caracterización + especificación) — no
    activa nada en producción.
  - 1B: corrige los bugs financieros usando las pruebas de 1A.
  - 1C: casos dorados y trazabilidad sobre el motor ya corregido.
  - 1D: cierra los 2 huecos de autenticación, la autorización privilegiada
    de `continuar-tras-revision`, y el auto-escalamiento de `role`
    (`BL-10`).
  - 1E: única activación real — conecta PDF/narrativa al resultado
    servidor, solo en entorno controlado.
- La trazabilidad mínima (1C) depende de que 1A/1B ya hayan estabilizado
  el esquema de datos que se va a trazar.
- El revisor financiero externo (humano) debe estar identificado
  **antes** de que los casos dorados de 1C se den por aprobados
  (`Negocio_Velarix_v4.1.md` §9.4, §10.4) — no es una tarea de código, es
  una condición de entrada a Fase 3.
- El control de rol **completo** (más allá del recorte P0 de 1D) sigue
  siendo prerequisito de Fase 2 para que la revisión manual cumpla su
  propósito de negocio en todos los escenarios, no solo en el flujo
  tocado por Fase 1.

## Estrategia de pruebas

- Ningún bug financiero se cierra sin un caso de regresión que reproduzca
  el escenario exacto documentado en `auditoria/04-CALIDAD-FINANCIERA.md`
  (cada hallazgo ya incluye un caso propuesto).
- Los casos dorados deben cubrir, como mínimo: consolidación de
  subcuentas, conversión de moneda, formato monetario del PDF, WACC/Hamada
  con y sin deuda, ROE/ROA con datos reales vs. sintéticos.
- Ningún caso dorado se aprueba solo por el fundador — requiere
  aprobación del revisor financiero externo (`Negocio_Velarix_v4.1.md` §9.4).

## Estrategia de migraciones

- Ninguna migración se ejecuta como parte de esta auditoría.
- Cambios de esquema futuros (ej. campos de trazabilidad, tabla
  `retainers` cuando se autorice) deben ser aditivos (nuevas columnas/
  tablas), no destructivos, salvo decisión explícita documentada en
  `REGISTRO-DE-DECISIONES.md` con plan de rollback.
- Con `D-06` ya decidido, `analyses.calculation_result` (columna) queda
  como la fuente real — la tabla huérfana `calculation_results` (plural)
  se evalúa para retiro formal en el Bloque 1A, no se asume su borrado
  sin confirmar primero que nada más la referencia.

## Estrategia de rollback

- Cada `fases/FASE-XX-*.md` debe declarar su propio plan de rollback
  específico antes de ejecutarse (plantilla ya incluida en cada archivo).
- Regla general: ningún cambio en Edge Functions se despliega sin poder
  revertir al `index.ts` anterior (control de versión estándar); ninguna
  migración se aplica sin su reversa correspondiente documentada.
- **Principio no negociable (D-07)**: ningún rollback de la Fase 1 —
  especialmente en el Bloque 1E — puede consistir en volver silenciosamente
  al motor cliente para producir una valoración profesional. El rollback
  correcto es desactivar el flujo nuevo, bloquear la descarga profesional,
  y restaurar la última versión servidor conocida — **nunca** degradar a
  una cifra que se sabe o se sospecha incorrecta solo para mantener
  disponibilidad. Se prefiere suspender una entrega antes que entregar un
  número equivocado.

## Reglas de alcance

- No se implementan funcionalidades diferidas por negocio (§13.3) como
  efecto colateral de resolver un bug (ej. no construir un sistema de
  retainers al resolver la trazabilidad).
- No se reorganiza el repositorio (`frontend/`+`backend/` u otra
  estructura) sin justificación explícita — ver `auditoria/10`.

## Criterio para detenerse

Idéntico a `Negocio_Velarix_v4.1.md` §19 "Regla de detención": falta una
decisión crítica, una migración sería destructiva, hay riesgo de pérdida
de datos, el resultado financiero esperado no está definido, una prueba
falla, el código contradice una decisión confirmada, el alcance requiere
otra fase, o existe una duda legal/metodológica que no se puede resolver
con código.

## Punto recomendado para comenzar

**`fases/FASE-01-EXACTITUD-FINANCIERA.md`, Bloque 1A** — específicamente
la tabla comparativa de ambos motores (`BL-26`) y las pruebas de
especificación que reproducen los bugs conocidos y deben fallar (`BL-30`),
antes de tocar ningún bug financiero (1B) o de construir casos dorados
(1C) que documentarían un comportamiento que ya se sabe incorrecto. El
Bloque 1D (accesos P0) puede avanzar en un calendario independiente,
coordinando en secuencia (no en paralelo) los cambios sobre los archivos
que comparte con 1A. El Bloque 1E no comienza bajo ninguna circunstancia
hasta que 1B, 1C y 1D estén cerrados.
