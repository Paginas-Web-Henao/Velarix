---
tipo: home
proyecto: Velarix
version_proyecto: v5.0
actualizado: 2026-10-15
tags: [velarix, home]
---

# Velarix

## Resumen

Velarix es un sistema de valoración corporativa por DCF (FCFF) construido con React + Vite y Supabase. Su propósito actual (v5.0) es ser un **proyecto técnico personal** que demuestre criterio financiero, modelación reproducible y trazabilidad de decisiones mediante **un único caso completo: Alpina Productos Alimenticios S.A.S. BIC**.

El principio central: separar **Evidence** (dato observado) / **Judgment** (decisión humana documentada) / **Calculation** (motor determinístico que no decide nada). Ver [[01-contexto]].

La raíz de la app (`/`) es el Estimador público, sin login. La landing comercial v4.x se retiró el 2026-10-15 ([[ADR-006-retirar-landing-comercial]]).

## Estado actual

| Frente | Estado | Fuente |
|---|---|---|
| Metodología escrita (v5.0) | ✅ Congelada (commit `6748a6a`, 2026-09-02) | [[04-VALUATION-METHODOLOGY-V5]] |
| Auditoría del motor | ✅ Congelada v1.3 (commit `dc3e2fb`) | [[05-financial-engine-audit]] |
| Tests-first (Bloque 3B) | ✅ Escritos; sus `it.fails` ya pasaron a `it` | [[06-tests-first-plan]] |
| Corrección del motor (Bloque 3C) | ✅ Implementado según commits 2026-09-03 → 09-06 (RC-1/2/3, WACC, FCFF, TV, reproducibilidad) | `git log` |
| Caso Alpina | 🟡 Supuestos resueltos + primera ejecución canónica congelada en tests (2026-09-07). Ejecución por el flujo real `ejecutar-calculo` contra Supabase: **pendiente de confirmar** | [[caso-alpina]] |
| Demo pública (Estimador) | 🟡 Pública en `/`, sin gate de login (2026-10-15). Falta decidir su relación con el motor canónico | [[estimador-demo]] |
| Landing comercial v4.x | ✅ Retirada (2026-10-15) | [[ADR-006-retirar-landing-comercial]] |
| README | 🟡 Reescrito con el framing v5.0 (2026-10-15). Writeup final pendiente | [[11-pendientes]] |
| Suite de tests | ✅ 61 archivos, 1026 tests verdes, 1 fallo esperado (verificado 2026-10-15) | [[13-testing]] |

## Ruta de lectura

[[01-contexto]] → [[02-arquitectura]] → [[03-modulos]] → [[caso-alpina]] → [[04-VALUATION-METHODOLOGY-V5]] → [[motor-canonico]] → [[expediente]] → [[13-testing]] → [[09-decisiones]] → [[10-roadmap]]

## Navegación

- [[01-contexto]] — qué es, para qué, restricciones
- [[02-arquitectura]] — capas, flujo de datos, carpetas
- [[03-modulos]] — índice de módulos funcionales
- [[04-flujos]] — pipeline de análisis, revisión manual, cálculo
- [[05-base-de-datos]] — tablas, RLS, storage
- [[06-api]] — Edge Functions y cliente frontend
- [[07-autenticacion]] — Supabase Auth, roles, autorización
- [[08-integraciones]] — Anthropic, OpenAI, Resend, Vercel, Damodaran
- [[09-decisiones]] — registro de decisiones técnicas y metodológicas
- [[10-roadmap]] — alcance congelado v5.0
- [[11-pendientes]] — trabajo abierto
- [[12-bugs]] — defectos y limitaciones conocidas
- [[13-testing]] — Vitest, golden cases, tests v5
- [[14-deploy]] — Vercel + Supabase
- [[15-glosario]] — términos financieros y del dominio

## Módulos principales

Núcleo v5.0 (lo que importa para Alpina):
- [[motor-canonico]] · [[supuestos-y-preflight]] · [[reproducibilidad]] · [[caso-alpina]] · [[expediente]]

Pipeline y soporte:
- [[pipeline-documental]] · [[revision-manual]] · [[narrativa-ia]] · [[informes-pdf]] · [[autorizacion]] · [[datos-de-mercado]] · [[notificaciones]]

Frontend:
- [[estimador-demo]] (público, `/`) · [[dashboard]] (privado)

Herramientas:
- [[benchmarks-ia]]

## Prioridades actuales

Derivadas del checklist congelado v5.0 y del estado del repo (ver [[10-roadmap]]):

1. Confirmar/ejecutar Alpina por el flujo oficial `ejecutar-calculo` (no solo el test del motor puro).
2. Cerrar los ítems case-dependent de Alpina documentados en [[05-financial-engine-audit]] §10–§12.
3. Estimador: decidir su relación con el motor canónico (el gate de login ya se quitó).
4. Writeup final y archivo de los documentos de negocio v4.x.

## Riesgos técnicos

- **Dos motores DCF** (cliente `src/lib/financial-engine.ts` vs. servidor canónico). Unificación explícitamente `NOT BUILDING`; riesgo de que la demo muestre números que el motor canónico no produciría. → [[estimador-demo]]
- **Horizonte de 5 años fijo** en el motor (`MOTOR_SUPPORTED_PROJECTION_HORIZON_YEARS = 5`). → [[12-bugs]]
- **Evidencia Alpina (4B–4F) no versionada** en este repo: los archivos `alpina-2024.*` lo declaran explícitamente. → [[caso-alpina]]
- **Sin CI**: no hay `.github/`; los tests solo se ejecutan localmente. → [[13-testing]]
- `supabase/functions/_shared` no está cubierto por ningún `tsconfig` oficial (no hay typecheck de Deno en el repo). → [[13-testing]]

## Documentación rápida

- Metodología canónica: [[04-VALUATION-METHODOLOGY-V5]] (manda sobre el código)
- Decisiones de principio: [[03-methodology-decisions-v5]]
- Auditoría del motor: [[05-financial-engine-audit]]
- Inventario estructural v5.0: [[01-scope-surgery]]
- Spec del Expediente: [[EXPEDIENTE-DE-VALORACION-V1]]
- Registro histórico de decisiones D-01…D-11: [[REGISTRO-DE-DECISIONES]]
- Auditoría inicial del repo (jul-2026): [[00-RESUMEN-EJECUTIVO]]
- Contexto para Claude / agentes: [CLAUDE.md](../CLAUDE.md)
- Cómo usar este vault: [[obsidian-guia]]
