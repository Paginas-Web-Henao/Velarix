# 11 — Contradicciones Negocio vs. Código

Comparación explícita entre `Negocio_Velarix_v4.1.md` y el estado real del
repositorio. Ninguna hipótesis de negocio (`🧪`) se trata aquí como
requisito confirmado.

| ID | Decisión de negocio | Evidencia en código | Estado | Riesgo | Acción futura |
|---|---|---|---|---|---|
| C-01 | §8.3 "La IA nunca aprueba por sí sola un entregable" — revisión humana obligatoria | `/admin/revisiones` sin control de rol; RLS de `manual_reviews` permite auto-aprobación del propio cliente | CONTRADICCIÓN | Bloqueante (negocio) | Fase 2 — implementar rol real antes de aceptar el primer cliente pagado |
| C-02 | §17.2 "Cada cifra material es trazable" (requisito para cobrar Valoración profesional) | `structured_inputs`/`calculation_results`/`report_narratives` solo tienen `analysis_id`, sin `document_id`/`mapping_id` por cifra | CONTRADICCIÓN | Alta (deuda que bloquea Fase 1) | Fase 1 — agregar trazabilidad mínima antes de cerrar la fase |
| C-03 | §10.2 "Antes de cobrar deben existir casos dorados" | Único test real es `example.test.ts` trivial; sin fixtures financieras | CONTRADICCIÓN | Bloqueante | Fase 1 |
| C-04 | §17.1 "El mismo input produce el mismo resultado dentro de la versión aprobada" | El PDF (cliente) y `analyses.calculation_result` (servidor) pueden divergir por usar dos implementaciones distintas del motor | CONTRADICCIÓN | Crítica | Fase 1 — decidir un único motor oficial |
| C-05 | §12.2 "Auditoría de descargas" (control mínimo de seguridad) | Ningún `event_type` de `audit_events` corresponde a descarga de documento/PDF; el PDF ni siquiera pasa por un endpoint servidor | CONTRADICCIÓN | Alta | Fase 2 |
| C-06 | §12.5 "Debe existir un procedimiento real para eliminar información" | Solo existe soft-delete (`deleted_at`); sin `storage.remove()` en todo el repo | CONTRADICCIÓN | Bloqueante | Fase 2 |
| C-07 | §12.1 "La seguridad mínima… debe existir antes del primer cliente real" | `ejecutar-calculo` y `continuar-tras-revision` sin verificación de ownership/autenticación | CONTRADICCIÓN | Bloqueante | Fase 2 |
| C-08 | §13.2 nombres de tabla (`user_profiles`, `parsed_documents`, `account_mappings`, `narrative_reports`) | Esquema real usa `profiles`, `documents_parsed`, `account_homologations`, `report_narratives` | CONTRADICCIÓN (nomenclatura, no funcional) | Baja — solo dificulta auditar por nombre | Actualizar la nomenclatura en `Negocio_Velarix_v4.1.md` en su próxima revisión, o documentar el mapeo una vez |
| C-09 | §9.1 "Los cálculos deben ser determinísticos, reproducibles y probados" | Determinísticos: sí (confirmado, sin `Math.random` en el motor). Reproducibles entre servidor y cliente: no (dos motores). Probados: no | CONTRADICCIÓN PARCIAL | Alta | Fase 1 |
| C-10 | Copy de landing (`HeroSection.tsx:139`, "Metodología auditada") | Etapa real es precomercial, sin revisor externo contratado todavía (§9.4, bloqueante) | CONTRADICCIÓN (lenguaje) | Riesgo de posicionamiento, no técnico | Ajustar copy antes de cualquier lanzamiento comercial (Fase 4) |
| C-11 | Copy de landing no comunica revisión humana obligatoria, mientras enfatiza automatización total | El backend sí implementa revisión humana (`manual_reviews`) | CONTRADICCIÓN (lenguaje, inversa a C-10) | Riesgo de posicionamiento | Fase 4 — alinear copy con el modelo real de boutique + revisión humana |
| C-12 | §1.1 "no se presenta… como SaaS de autoservicio" salvo el Estimador gratuito (§1.1, texto ya corregido en v4.1) | El Estimador gratuito (`5.1`) es efectivamente autoservicio público, consistente con la excepción ya documentada | SIN CONTRADICCIÓN (resuelto en v4.1) | — | Ninguna — v4.1 ya deja esto explícito |

## Funcionalidades que existen en código pero están diferidas por negocio (§13.3, §3.4, §4.2)

Estas no son contradicciones — son evidencia de que el código **no**
construyó de más en estas áreas, lo cual es consistente con la etapa
precomercial:

| Funcionalidad diferida por negocio | ¿Existe en código? |
|---|---|
| Sistema completo de retainers | No — no hay tabla `retainers` ni `time_entries` |
| Pagos automáticos | No — sin integración de pasarela de pago en el repo |
| Múltiples analistas / asignación inteligente | No — `manual_reviews` no tiene lógica de asignación automática |
| Suscripciones / planes | No — sin concepto de "plan" en el código (confirmado en `07-FRONTEND-RUTAS-Y-UX.md`) |
| Facturación automática | No |
| Autoservicio total | Parcial — el Estimador gratuito es autoservicio limitado, consistente con §1.1 v4.1; el resto del producto requiere intervención (aunque la revisión humana esté rota, ver C-01) |
| Marketplace | No |
| Aplicación móvil | No |

Esto confirma que el equipo no se adelantó a construir funcionalidad
diferida — el problema real está en la **exactitud y seguridad de lo que
ya existe**, no en exceso de alcance.

## Nota sobre el documento de negocio en sí (no una contradicción de código)

Existen 3 archivos de definición de negocio en la raíz del repo
(`Negocio.md`, `NEGOCIO_V4_VELARIX.md`, `Negocio_Velarix_v4.1.md`). Esta
auditoría usó `Negocio_Velarix_v4.1.md` como fuente de verdad, indicado
explícitamente por el fundador. Ver nota completa en
`docs/velarix/README.md`.
