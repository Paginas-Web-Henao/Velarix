---
tipo: contexto
actualizado: 2026-10-15
tags: [velarix, contexto]
---

# Contexto del proyecto

> **Definición vigente (2026-10-15):** Velarix es un **Personal Valuation & Projection Workbench**, el sistema personal de Nicolás. No es un negocio, un SaaS ni una demo pública ([[ADR-007-personal-valuation-workbench]]).

Volver a [[00-home]] · Siguiente: [[02-arquitectura]] · Decisión de origen: [[ADR-001-redefinicion-v5]]

## Qué hace

Velarix valora empresas por **DCF a la firma (FCFF)**. El flujo implementado en código es:

documentos financieros → extracción con IA → homologación de cuentas → validación → `structured_input` → checkpoint del Expediente + preflight de supuestos → motor de cálculo canónico → narrativa (IA) → PDF.

Ver [[04-flujos]] y [[02-arquitectura]].

## Problema que resuelve (framing v5.0)

Según [[04-VALUATION-METHODOLOGY-V5]] §1: la mayoría de errores serios de valoración ocurren cuando una capa se disfraza de otra (juicio presentado como evidencia, cálculo que decide en silencio). Velarix es *"un sistema que fuerza la separación de evidencia / juicio / cálculo y hace trazable cada supuesto material"*.

- **Evidence** — hecho verificable en fuente primaria, con procedencia.
- **Judgment** — decisión humana documentada y defendible.
- **Calculation** — aplicación determinística; **el motor no tiene autoridad metodológica**.

> [!note] Framing descartado
> "Automatizar la valoración" fue el framing v1 y se considera mal posicionamiento para v5.0. No es un producto ni un negocio.

## Historia de versiones

| Versión | Fecha | Qué era | Documento |
|---|---|---|---|
| v1 | 2026-03 | SaaS de valoración automatizada con IA | README.md, `Negocio.md` |
| v4.1 / v4.2 | 2026-08-10 | Boutique de valoración "expert-led" con clientes | `Negocio_Velarix_v4.2.md`, [[REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10]] |
| **v5.0** | 2026-08-31 | Proyecto personal de evidencia técnica, caso único Alpina | [[01-scope-surgery]] y siguientes |

## Usuarios

- **Único usuario real en v5.0:** el autor (Nicolás Henao), que debe poder defender personalmente cada decisión metodológica ([[03-methodology-decisions-v5]] §0).
- **Audiencia de la evidencia:** lectores técnicos/financieros del caso (p. ej. entrevistas de valoración). > Pendiente de confirmar cómo se presentará (demo + writeup).

## Roles (en código)

Velarix es un workbench privado de un solo owner, sin login en el flujo normal ([[ADR-008-single-owner-private-mode]]). Internamente `profiles.role` ∈ `user` | `analyst` | `admin` (ver [[07-autenticacion]]); el owner tiene `admin`. Los roles `analyst`/`admin` vienen del modelo v4.2 (revisión humana). [[01-scope-surgery]] §1 deja abierta la pregunta de si deben colapsar a un solo actor. > Pendiente de confirmar.

## Stack

- **Frontend:** React 18 + Vite 8 + TypeScript, Tailwind + shadcn/ui (Radix), React Router 6, TanStack Query, Recharts, jsPDF.
- **Backend:** Supabase — Postgres con RLS, Auth, Storage, Edge Functions (Deno).
- **IA:** Anthropic (`claude-opus-4-8` en `anthropic-client.ts`) para homologación y narrativa; OpenAI para `parse-document` (decisión D-11). Ver [[08-integraciones]].
- **Tests:** Vitest + Testing Library (jsdom). Playwright configurado pero sin carpeta `tests/`.
- **Hosting frontend:** Vercel (SPA rewrite en `vercel.json`).

## Alcance v5.0 (congelado)

1. Documento de metodología (10–15 págs.) — ✅
2. Auditoría + corrección del motor — ✅ (según commits)
3. **Un** caso completo: Alpina — 🟡 en curso ([[caso-alpina]])
4. ~~Estimador como demo pública sin login~~: superado por [[ADR-007-personal-valuation-workbench]] (no hay demo pública; el Estimador es el [[quick-model]] privado)
5. README / writeup final: 🟡 README reescrito como workbench personal; falta el writeup del caso

Detalle en [[10-roadmap]].

## Restricciones principales

- La **metodología escrita manda sobre el código**: si discrepan, se corrige primero el documento ([[04-VALUATION-METHODOLOGY-V5]]).
- Un cálculo financieramente incorrecto es un bloqueante absoluto, por encima de cualquier trabajo visual.
- **Un solo caso** se termina (Alpina). Los 8 casos históricos (Tecnoglass, Terpel, Ecopetrol, Grupo Éxito, ISA, Bancolombia, Goldman Sachs, Munich Re) son material de aprendizaje archivado, no backlog.
- La IA puede encontrar información, inconsistencias y preguntas; **nunca aprueba metodología ni supuestos**.
- No se construye nada fuera del checklist ("NOT BUILDING"): segundo caso, nuevos sectores, multi-tenant, CRM, pricing, unificación de motores, workflows de aprobación.
- Moneda base: COP (`analyses.moneda_analisis` por defecto `'COP'`).
