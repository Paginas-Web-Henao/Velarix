---
tipo: moc
actualizado: 2026-10-15
tags: [velarix, moc, system]
---

# 02 — System

[[00-home]] · Anterior: [[01-METHODOLOGY]] · Siguiente: [[03-WORKBENCH]]

| Capa | Rol | Notas |
|---|---|---|
| Obsidian | Metodología, research, casos, decisiones | [[00-home]] |
| Claude / ChatGPT | Copiloto: research, preguntas, explicación; nunca aprueba | [[07-SKILL]] |
| Workbench | Interfaz privada single-owner (sin login; LOCAL_PRIVATE / DEPLOYED_PRIVATE) | [[03-WORKBENCH]] · [[ADR-008-single-owner-private-mode]] |
| Supabase | Private Valuation Data Layer | [[05-base-de-datos]] · [[06-api]] · [[07-autenticacion]] |
| Financial engine | Cálculo determinístico | [[motor-canonico]] |

## Arquitectura
- [[02-arquitectura]]: capas, rutas, carpetas, patrones · [[03-modulos]]: índice de módulos · [[04-flujos]]: pipeline, cálculo, revisión.

## Motor y trazabilidad
- [[motor-canonico]] · [[supuestos-y-preflight]] · [[reproducibilidad]] · [[expediente]]
- Auditoría del motor: [[05-financial-engine-audit]]

## Pipeline e IA
- [[pipeline-documental]] · [[narrativa-ia]] · [[informes-pdf]] · [[datos-de-mercado]] · [[notificaciones]]
- Integraciones externas: [[08-integraciones]] · Benchmarks de IA: [[benchmarks-ia]]

## Seguridad
- [[07-autenticacion]] (single-owner private mode, cómo se protege Supabase sin pantalla de login) · [[autorizacion]] · RLS y storage en [[05-base-de-datos]]

## Operación
- [[13-testing]] · [[14-deploy]] · [[12-bugs]]
