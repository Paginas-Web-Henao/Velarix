# Roadmap

Refleja las Fases 0–8 de `Negocio_Velarix_v4.2.md` §18 (antes v4.1 — ver
nota de actualización abajo). Sin fechas inventadas — solo estados y
dependencias. Ver `fases/FASE-XX-*.md` para el detalle ejecutable de cada
una.

> **Actualizado 2026-08-10 (`D-09`, reorientación boutique expert-led;
> precisada el mismo día tras corrección del fundador)**:
> `Negocio_Velarix_v4.1.md` fue reemplazado por `Negocio_Velarix_v4.2.md`
> como fuente de verdad de negocio (ver
> `docs/velarix/plan/REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md`, que
> documenta la reunión del fundador con el profesor el **2026-08-10**).
> El bloque 1E de la Fase 1 gana una condición de entrada adicional (ver
> fila 1E abajo) — un **checkpoint mínimo operativo** del Expediente, no
> su implementación completa. Se registran dos líneas de trabajo nuevas y
> distintas: **(A) estudio manual de casos públicos** — activo desde
> ahora, sin dependencias técnicas, primer caso Tecnoglass — y **(B)
> biblioteca automatizada de casos** — diferida, sin relación de bloqueo
> con (A). Ver `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`.
> Ninguna fase ya cerrada o en curso cambia de estado por esta
> actualización.

| Fase | Objetivo | Estado | Depende de |
|---|---|---|---|
| Fase 0 — Revisión del negocio y del estado real | Alinear documento, repositorio y realidad | **en curso** — auditoría aprobada por el fundador (2026-07-23); documentación de Fase 1 corregida (D-07), aún no autorizada para implementación | — |
| Fase 1 — Exactitud financiera | Impedir resultados incorrectos | pendiente de autorización. Decisión de arquitectura tomada y aprobada (`D-06`), plan refinado (`D-07`); dividida en **5 bloques** — ver detalle abajo | Autorización explícita del fundador para iniciar |
| ↳ 1A — Caracterización y contrato canónico | Tabla comparativa, pruebas de caracterización y especificación, contrato tipado, diseño de estados/versionado — **sin activar nada en producción** | pendiente | Autorización de inicio |
| ↳ 1B — Correcciones financieras | Corregir bugs (BL-02 a BL-06, BL-17, ROE/ROA) usando las pruebas de 1A | bloqueada | 1A completo |
| ↳ 1C — Casos dorados, trazabilidad y revisión externa | Probar y trazar el resultado ya corregido; aprobación del revisor financiero externo | bloqueada | 1B completo |
| ↳ 1D — Seguridad P0 del flujo | 2 huecos de autenticación + autorización privilegiada (no solo ownership) + `BL-10` (auto-escalamiento de rol) | pendiente, **secuencial internamente, coordinado con 1A en archivos compartidos** | Autorización de inicio |
| ↳ 1E — Integración y activación controlada | Conectar PDF/narrativa al resultado canónico; activar solo en entorno controlado | bloqueada | 1B y 1C cerrados (**1D ya está cerrado**, no es pendiente), **más un checkpoint mínimo operativo y validado del Expediente de Valoración (`D-09`, no su implementación completa)** |
| Estudio manual de casos públicos — Biblioteca (A) (nuevo, `D-09`, activo) | Analizar empresas con información financiera pública (primer caso: Tecnoglass) para diseñar y validar el Expediente antes de implementarlo | **en curso desde 2026-08-10** | Ninguna — no requiere revisor, ni Expediente implementado, ni ningún bloque técnico |
| Expediente de Valoración V1 — implementación (nuevo, `D-09`) | Representar comprensión de empresa/cuentas/preguntas/evidencia/normalizaciones/hipótesis/supuestos antes de calcular | especificado, no autorizado para implementar | Autorización explícita y separada del fundador; se beneficia del estudio manual de casos (fila anterior), sin depender estrictamente de él |
| Biblioteca automatizada de casos (B) (nuevo, diferido, `D-09`) | Ingestión automática, interfaz, scraping, procesamiento masivo de casos públicos | diferida | Decisión de producto — sin fecha ni bloqueo técnico fijado |
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
