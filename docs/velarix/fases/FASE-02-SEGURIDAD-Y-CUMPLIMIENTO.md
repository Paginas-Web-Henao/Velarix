# Fase 02 — Seguridad y Cumplimiento Mínimo

> **Actualizado 2026-07-23 (tras D-07)**: `BL-07`, `BL-08`, el recorte de
> `BL-09` (impedir autoaprobación) y `BL-10` **ya no viven aquí** — se
> adelantaron al Bloque 1D de la Fase 1 (ver
> `fases/FASE-01-EXACTITUD-FINANCIERA.md`) porque son P0 del flujo que esa
> fase interviene directamente. Esta fase conserva el **sistema completo**
> de rol (permisos por asignación entre múltiples analistas, más allá del
> recorte mínimo de 1D) y el resto del alcance de seguridad general.

## Estado

Bloqueada. Depende del cierre de Fase 01 completa (1A–1E) — ya no es
"parcialmente paralelizable" en lo que respecta a `ejecutar-calculo`/
`continuar-tras-revision`, porque esa parte específica ya se resuelve
dentro de la Fase 1 (Bloque 1D).

## Objetivo

`Negocio_Velarix_v4.1.md` §18: "Poder recibir información real de forma
responsable."

## Justificación de negocio

§12.1 del negocio: "La seguridad mínima... debe existir **antes** del
primer cliente real." Los 2 huecos de autenticación más urgentes y el
riesgo de auto-escalamiento de `role` ya se resuelven en el Bloque 1D de
la Fase 1, por ser P0 del flujo que esa fase toca directamente. Esta fase
completa el resto: sistema de rol para múltiples analistas, resto de
funciones sin autenticación, minimización de datos a IA, eliminación real
de datos, y la consolidación de `_shared/` que 1D dejó pendiente.

## Condiciones de entrada

- [ ] Fase 01 (1A–1E) cerrada.
- [ ] Si se decide contratar un analista adicional, esa cuenta real debe
      existir para probar el sistema completo de rol de esta fase
      (dependencia de negocio, no técnica).

## Alcance

- `BL-11` — Autenticar `update-snapshots` y `enviar-notificacion`.
- `BL-12` — Minimizar datos enviados a Anthropic.
- `BL-13` — Implementar eliminación real de datos.
- `BL-16` — Auditar descargas (depende de que el Bloque 1E ya haya
  conectado el PDF a un flujo verificable server-side).
- `BL-18` — Extraer `_shared/cors.ts` y `_shared/auth.ts` para las **12**
  Edge Functions (consolidación general, P2 — el Bloque 1D de la Fase 1
  solo permitió un helper mínimo acotado a las 2 funciones P0, no esta
  extracción completa).
- `BL-19` — Tipar contratos de respuesta entre Edge Functions.
- `BL-21` — Race condition en `map-accounts`.
- Sistema completo de control de rol (extensión de lo ya resuelto en 1D):
  permisos por asignación entre múltiples analistas, no solo impedir
  autoaprobación.

## Exclusiones

No se implementa aquí ninguna pasarela de pago ni automatización
comercial (Fase 5). No se redacta el contrato/NDA completo aquí (es
trabajo legal, no de código) — solo se documenta la dependencia. No se
repite el trabajo ya cerrado en el Bloque 1D (BL-07, BL-08, recorte de
BL-09, BL-10).

## Hallazgos que resuelve

`BL-11`, `BL-12`, `BL-13`, `BL-16`, `BL-18`, `BL-19`, `BL-21`, y la
extensión completa del sistema de rol. Ver `plan/BACKLOG-CLASIFICADO.md`.

## Dependencias

El sistema completo de rol depende de que exista más de un `analyst` real
para tener sentido probarlo (dependencia de negocio). `BL-12` y `BL-13`
dependen de revisión legal externa (§12.3, §12.4, §23 del negocio). `BL-16`
depende del Bloque 1E de la Fase 1. Ver `plan/MATRIZ-DE-DEPENDENCIAS.md`.

## Orden interno de trabajo

1. `BL-18` (extraer `_shared/auth.ts`/`_shared/cors.ts` para las 12
   funciones, generalizando el helper mínimo que 1D ya creó para las 2
   funciones P0).
2. `BL-19` (tipar contratos de respuesta) — se beneficia de tener
   `_shared/` ya consolidado.
3. `BL-11`, `BL-21` (independientes, pueden hacerse en cualquier momento).
4. Sistema completo de rol (el ítem más grande de esta fase) — requiere
   decisión de negocio sobre si ya existe más de un analista real.
5. `BL-12`, `BL-13` (dependen de revisión legal — pueden avanzar en
   paralelo mientras se espera esa revisión, pero no cerrarse sin ella).
6. `BL-16` (al final, una vez el Bloque 1E de la Fase 1 esté cerrado).

## Archivos o componentes potencialmente afectados

`supabase/functions/update-snapshots/index.ts`,
`supabase/functions/enviar-notificacion/index.ts`,
`supabase/functions/map-accounts/index.ts`, las 12 Edge Functions (para
`BL-18`/`BL-19`), nuevo `supabase/functions/_shared/auth.ts` y
`_shared/cors.ts` (generalizados desde el helper mínimo de 1D),
`src/App.tsx`, `src/contexts/AuthContext.tsx`, migraciones de RLS para el
sistema completo de asignación de analistas.

## Cambios de base de datos potenciales

- Migración aditiva: tabla o campo de asignación explícita
  analista↔análisis, si el sistema completo de rol lo requiere (hoy no
  existe ninguna lógica de asignación automática).
- Posible endpoint/función nueva para eliminación real de datos (`BL-13`),
  sin migración destructiva sobre datos existentes salvo ejecución
  explícita del borrado a solicitud de un cliente real.

## Riesgos

Ver `R-10`, `R-11`, `R-12`, `R-15` en `plan/MATRIZ-DE-RIESGOS.md`
(`R-06` a `R-09` ya se resuelven en el Bloque 1D de la Fase 1).

## Pruebas obligatorias

- Prueba de eliminación real: solicitar borrado de un análisis de prueba
  y confirmar que el documento ya no existe en Storage ni en las tablas
  derivadas.
- Prueba de que un analista solo ve/gestiona los análisis que le fueron
  asignados (sistema completo de rol, más allá del recorte de 1D).
- Prueba de invocación de `update-snapshots`/`enviar-notificacion` sin
  credenciales de servicio → debe fallar.

## Casos de regresión

Los mismos escenarios de prueba de arriba, automatizados y repetibles.

## Criterios de aceptación

`Negocio_Velarix_v4.1.md` §18, Fase 2: "revisión técnica y jurídica
mínima aprobada."

## Evidencias requeridas

Resultado de cada prueba (arriba), aprobación explícita del abogado
externo para `BL-12`/`BL-13`, y actualización de
`plan/MATRIZ-DE-RIESGOS.md`.

## Plan de rollback

Los cambios de autenticación/autorización son aditivos — bajo riesgo de
romper el flujo normal si se implementan siguiendo el mismo patrón ya
probado en el Bloque 1D. Cualquier migración de RLS debe poder revertirse
a la política anterior sin pérdida de datos.

## Condiciones de detención

- Si la revisión legal de `BL-12`/`BL-13` no está disponible, se avanza
  el resto de la fase pero no se cierra sin esos dos ítems o sin una
  decisión explícita documentada de diferirlos con justificación.
- Si no existe todavía una segunda cuenta `analyst` real, se implementa
  el mecanismo técnico del sistema completo de rol pero no se declara
  "probado" hasta tener esa cuenta.

## Checklist de cierre

- [ ] `BL-11`, `BL-18`, `BL-19`, `BL-21` resueltos.
- [ ] Sistema completo de rol implementado (más allá del recorte de 1D).
- [ ] `BL-12`, `BL-13`, `BL-16` resueltos o explícitamente diferidos con
      justificación documentada.
- [ ] Revisión legal mínima documentada.
- [ ] `plan/MATRIZ-DE-RIESGOS.md` actualizada.
- [ ] Reporte de implementación completado.

## Plantilla del reporte de implementación

Ver plantilla en `fases/FASE-00-CIERRE-DE-AUDITORIA.md`.
