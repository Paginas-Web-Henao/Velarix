---
tipo: roadmap
actualizado: 2026-10-15
tags: [velarix, roadmap]
---

# Roadmap v5.0 (alcance congelado)

Volver a [[00-home]] · Anterior: [[09-decisiones]] · Pendientes concretos: [[11-pendientes]] · Limitaciones que condicionan la fase 3: [[12-bugs]]

Orden fijado por el usuario y por [[01-scope-surgery]] §8: **metodología → auditoría/corrección del motor → expediente → caso Alpina → demo → README**. Nada fuera de esta lista se construye.

| # | Entregable | Estado | Evidencia |
|---|---|---|---|
| 1 | Documento de metodología (10–15 págs.) | ✅ Hecho | [[04-VALUATION-METHODOLOGY-V5]], commit `6748a6a` (2026-09-02) |
| 2a | Auditoría del motor vs. metodología | ✅ Hecho | [[05-financial-engine-audit]] v1.3, commit `dc3e2fb` |
| 2b | Tests-first de root causes | ✅ Hecho | [[06-tests-first-plan]], commit `884173d` |
| 2c | Corrección del motor (Bloque 3C) | ✅ Hecho según commits | `79f1695` preflight · `50cfcf4` equity/estructura · `d512c88` WACC/Ke · `757405f` drivers/FCFF · `2cbe1bf` terminal value · `a07c225` reproducibilidad |
| 3 | Caso Alpina completo | 🟡 En curso | `325f71c` supuestos resueltos · `b9e362c` input preflight · `0df086c` primera ejecución canónica · `7e52dfc`/`50f2d08`/`c52f901` sensibilidad, escenarios, KPIs (todo 2026-09-07) |
| 4 | Estimador como demo pública sin login | 🟡 Gate eliminado y `/` = Estimador (2026-10-15, sin commit). Falta decidir su relación con el motor canónico | [[ADR-006-retirar-landing-comercial]], [[estimador-demo]] |
| 5 | README / writeup final | 🟡 README reescrito con el framing v5.0 (2026-10-15, sin commit); writeup final pendiente | `README.md` |

## Detalle de la fase 3 (Alpina)

Según [[05-financial-engine-audit]] §12:

- [x] Calcular los 13 supuestos resueltos de Alpina
- [ ] Cuantificar si RC-4 (working capital) escala a P0 — > Pendiente de confirmar
- [ ] Decisiones condicionales: horizonte, stub period (no aplica si la fecha de valoración = cierre FY2024, como dice `alpina-2024.resolved-assumptions.ts`), bridge, realización fiscal — > Pendiente de confirmar
- [ ] Ejecutar Alpina por el flujo real `ejecutar-calculo` con preflight legítimamente pasado — > Pendiente de confirmar
- [ ] Cross-check independiente vía script (opcional)
- [ ] SOTP (análisis separado mencionado en `alpina-2024.*`) — > Pendiente de confirmar alcance
- [ ] Suite mínima de sensibilidades (P-12) completa — > Pendiente de confirmar

## Detalle de la fase 5 (limpieza final)

De [[01-scope-surgery]] §8 punto 6:

- [x] Retirar la landing comercial: hecho el 2026-10-15, por adelantado y por decisión explícita ([[ADR-006-retirar-landing-comercial]]).
- [ ] Archivar los 4 docs de negocio de la raíz del repo (desenganchando antes sus referencias desde [[EXPEDIENTE-DE-VALORACION-V1]]).
- [ ] Retirar las fases comerciales del roadmap histórico.
- [ ] Writeup final (el README ya se reescribió).

## Roadmap histórico (superado)

[[ROADMAP]] y `docs/velarix/fases/FASE-00…08` describen el plan boutique v4.2 (pilotos, primer cliente pagado, escalamiento). No aplica en v5.0.
