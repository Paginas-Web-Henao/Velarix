# Roadmap

Refleja las Fases 0–8 de `Negocio_Velarix_v4.1.md` §18. Sin fechas
inventadas — solo estados y dependencias. Ver `fases/FASE-XX-*.md` para
el detalle ejecutable de cada una.

| Fase | Objetivo | Estado | Depende de |
|---|---|---|---|
| Fase 0 — Revisión del negocio y del estado real | Alinear documento, repositorio y realidad | **en curso** — auditoría aprobada por el fundador (2026-07-23); documentación de Fase 1 corregida (D-07), aún no autorizada para implementación | — |
| Fase 1 — Exactitud financiera | Impedir resultados incorrectos | pendiente de autorización. Decisión de arquitectura tomada y aprobada (`D-06`), plan refinado (`D-07`); dividida en **5 bloques** — ver detalle abajo | Autorización explícita del fundador para iniciar |
| ↳ 1A — Caracterización y contrato canónico | Tabla comparativa, pruebas de caracterización y especificación, contrato tipado, diseño de estados/versionado — **sin activar nada en producción** | pendiente | Autorización de inicio |
| ↳ 1B — Correcciones financieras | Corregir bugs (BL-02 a BL-06, BL-17, ROE/ROA) usando las pruebas de 1A | bloqueada | 1A completo |
| ↳ 1C — Casos dorados, trazabilidad y revisión externa | Probar y trazar el resultado ya corregido; aprobación del revisor financiero externo | bloqueada | 1B completo |
| ↳ 1D — Seguridad P0 del flujo | 2 huecos de autenticación + autorización privilegiada (no solo ownership) + `BL-10` (auto-escalamiento de rol) | pendiente, **secuencial internamente, coordinado con 1A en archivos compartidos** | Autorización de inicio |
| ↳ 1E — Integración y activación controlada | Conectar PDF/narrativa al resultado canónico; activar solo en entorno controlado | bloqueada | 1B, 1C **y** 1D cerrados |
| Fase 2 — Seguridad y cumplimiento mínimo | Poder recibir información real de forma responsable | bloqueada | Fase 1 completa (1A–1E) — ya no parcialmente independiente: el control de acceso urgente ya vive en 1D |
| Fase 3 — Pilotos controlados | Validar metodología, operación, tiempo y experiencia | bloqueada | Fase 1 + Fase 2 completas, revisor financiero externo identificado |
| Fase 4 — Preparación comercial | Poder vender con claridad y control | bloqueada | Fase 3 completa (mínimo 2 pilotos) |
| Fase 5 — Primer cliente pagado | Validar la entrega comercial completa | bloqueada | Fase 4 completa |
| Fase 6 — Repetibilidad | Demostrar que el servicio puede repetirse | bloqueada | Fase 5 completa (proyecto cerrado y documentado) |
| Fase 7 — Automatización selectiva | Automatizar solo tareas ya validadas | bloqueada | Fase 6 (repetición demostrada, no solo deseada) |
| Fase 8 — Escalamiento | Aumentar capacidad sin reducir calidad | bloqueada | Fase 7 |

## Nota sobre paralelismo Fase 1 / Fase 2

Los ítems más urgentes de seguridad (2 huecos de autenticación, control de
rol suficiente para impedir autoaprobación, auto-escalamiento de `role`)
ya no esperan a Fase 2 — viven en el Bloque 1D de la Fase 1. Fase 2
conserva el trabajo de seguridad **no urgente para este flujo específico**:
sistema completo de rol para múltiples analistas, `BL-18`/`BL-19`
(consolidación general), minimización de datos a IA, eliminación real de
datos.

## Nota sobre paralelismo interno de Fase 1 (1A–1E)

Ver `fases/FASE-01-EXACTITUD-FINANCIERA.md`, diagrama de dependencias: 1A
→ 1B → 1C es secuencial. 1D avanza en un calendario independiente de
1A/1B/1C, pero **nunca con agentes/sesiones en paralelo modificando los
mismos archivos** que 1A (`ejecutar-calculo`, `continuar-tras-revision`) —
se coordina en secuencia sobre esos archivos específicos. 1E es el bloque
de cierre: solo empieza cuando 1B, 1C **y** 1D están cerrados, sin
excepción.

## Qué NO tiene fecha todavía (y por qué)

Ninguna fase tiene fecha estimada. `Negocio_Velarix_v4.1.md` §21 marca
como hipótesis pendiente la "duración media" y el "volumen mensual
sostenible" — estimar fechas antes de medir horas reales en al menos un
piloto sería inventar un dato no verificable, prohibido por las reglas de
esta auditoría (§4, "No presentes una sospecha como hecho").
