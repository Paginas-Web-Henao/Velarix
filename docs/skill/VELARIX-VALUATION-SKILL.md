---
tipo: skill
version: 1.0
actualizado: 2026-10-15
tags: [velarix, skill]
---

# Velarix Valuation Skill

Volver a [[00-home]] · Mapa: [[07-SKILL]] · Comandos de Claude Code: [[claude-commands]]

Especificación **provider-agnostic**: vale para Claude, ChatGPT o cualquier copiloto. Las adaptaciones a cada herramienta (por ejemplo `.claude/skills/velarix-valuation/SKILL.md`) solo apuntan aquí; no duplican reglas.

## Purpose

Ayudar a Nicolás a proyectar y valorar empresas con la metodología Velarix, produciendo valoraciones **defendibles, trazables y reproducibles**. Velarix es una herramienta personal, no un producto: el copiloto nunca propone clientes, pricing, ventas, landing, growth ni multi-tenancy.

## Core Principle

**Evidence ≠ Judgment ≠ Calculation**

| Capa | Qué es | Quién la produce |
|---|---|---|
| EVIDENCE | Dato verificable con procedencia (estado financiero, nota, fuente oficial) | Documentos y fuentes; la IA puede extraer, nunca inventar |
| JUDGMENT | Decisión documentada ante evidencia insuficiente o ambigua (WACC, β, g, normalizaciones…) | **Nicolás**; la IA puede proponer y cuestionar |
| CALCULATION | Aplicación determinística de fórmulas sobre Evidence + Judgment | Motor canónico (`canonical-financial-engine.ts`) |

El motor calcula. La metodología gobierna. El humano decide.

## Before valuation work, read

1. `docs/00-home.md`: estado, caso activo y bloqueos.
2. Metodología canónica: `docs/velarix-v5/04-VALUATION-METHODOLOGY-V5.md` (autoridad sobre el código) y `03-methodology-decisions-v5.md` (P-01…P-14).
3. Decisiones: `docs/09-decisiones.md` y los ADR de `docs/decisions/`.
4. El case MOC activo: `docs/cases/<caso>/00-case-home.md`.
5. Arquitectura, solo si hace falta: `docs/02-arquitectura.md`, `docs/maps/02-SYSTEM.md`.

Nunca tomes como vigente nada de `docs/velarix/` ni de `Negocio*.md`: es histórico ([[99-archive]]).

## Workflow

| # | Paso | Salida | Dónde vive |
|---|---|---|---|
| 1 | **Open / Create Case** | Case MOC desde la plantilla + caso en el workbench (Nuevo caso) | `docs/cases/<caso>/00-case-home.md` (desde `docs/cases/_case-template.md`); fila `analyses` |
| 2 | Gather Evidence | Estados financieros, notas y fuentes con procedencia | Workbench → Evidence; carpeta del caso |
| 3 | Understand Business | Modelo de negocio, segmentos, geografía, drivers, riesgos | Case MOC, sección Company Understanding |
| 4 | Map Accounts | Homologación etiqueta → cuenta canónica | Workbench → Accounts (`account_homologations`) |
| 5 | Detect Ambiguities | Lista de ambigüedades materiales | Workbench → Questions (`expedient_questions`) |
| 6 | Ask Questions | Preguntas concretas con su razón y materialidad | Ídem; respuestas en `expedient_answers` |
| 7 | Normalize | Ajustes de EBITDA o cuentas, con evidencia y rationale | Case MOC (no hay tabla todavía); notas en `account_notes` |
| 8 | Resolve Assumptions | Los 13 `ResolvedCalculationAssumptions` + growth, cada uno con source y rationale | Case MOC + `structured_input.resolved_assumptions` |
| 9 | Forecast | Drivers de ingresos, márgenes, CAPEX, D&A y ΔNWC | Resueltos en el paso 8; el motor proyecta |
| 10 | Calculate | Ejecución por el flujo oficial: checkpoint → preflight → motor | `ejecutar-calculo`; nunca saltarse el preflight |
| 11 | Challenge | Escenarios, WACC × g, pruebas de un factor, supuestos cuestionados | Workbench → Challenge; case MOC |
| 12 | Conclude | Rango de valoración, conclusión y limitaciones | Workbench → Output |
| 13 | Document | Case MOC actualizado, ADR si hubo decisión, audit trail verificado | Obsidian + Workbench → Audit trail |

## AI MAY

- summarize evidence (citando la fuente)
- identify gaps
- classify accounts (como propuesta)
- generate questions
- research (dejando la fuente y la fecha de consulta)
- challenge assumptions
- explain calculations
- compare scenarios
- produce drafts, marcados como borrador

## AI MUST NOT

- fabricate evidence
- silently approve assumptions
- choose WACC without documented judgment
- decide terminal g without rationale (coherencia g / ROC y WACC > g)
- silently normalize EBITDA
- overwrite methodology (si el código o un caso contradice la metodología, se señala; el documento se cambia primero y solo con decisión de Nicolás)
- bypass preflight
- bypass Evidence/Judgment separation
- report a valuation as reproducible if provenance is missing
- usar el Quick Model (motor cliente) como si fuera una valoración canónica

## Source priority

1. Primary company evidence (estados financieros auditados, notas, informes de gestión)
2. Official / regulatory sources (Supersociedades, SFC, DIAN, Banco de la República, DANE)
3. High-quality market sources (Damodaran / NYU Stern, IVSC)
4. Secondary sources (prensa especializada, analistas)
5. AI inference: siempre etiquetada como inferencia y nunca usada como Evidence

## Output discipline

Todo número material debe poder clasificarse como **EVIDENCE**, **JUDGMENT** o **CALCULATION**, con:

- **Evidence**: fuente, período y unidad.
- **Judgment**: valor, rationale, alternativas consideradas, fuente y estado (propuesto o resuelto por Nicolás).
- **Calculation**: qué fórmula o motor y con qué inputs (fingerprint si existe).

Si un número no se puede clasificar, no se presenta como resultado.

## Escalation

Detente y pregunta a Nicolás cuando:

- una decisión material requiere Judgment;
- la evidencia es insuficiente o contradictoria;
- la metodología no cubre el caso;
- un resultado depende de un supuesto no resuelto.
