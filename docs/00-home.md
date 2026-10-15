---
tipo: home
proyecto: Velarix
actualizado: 2026-10-15
tags: [velarix, home]
---

# Velarix

**Personal Valuation & Projection Workbench**: mi sistema para estudiar empresas, preservar Evidence, documentar Judgment, ejecutar Calculation determinístico y producir valoraciones defendibles, trazables y reproducibles. No es un producto ni un negocio ([[ADR-007-personal-valuation-workbench]]).

> **VELARIX IS A PRIVATE SINGLE-OWNER VALUATION WORKBENCH.** Sin SaaS, sin flujo de autenticación público, sin cuentas de clientes. Se abre directo en `/workbench`; los datos siguen protegidos por Supabase Auth + RLS con la identidad del owner ([[ADR-008-single-owner-private-mode]], [[07-autenticacion]]).

> **Evidence ≠ Judgment ≠ Calculation.** El motor calcula. La metodología gobierna. El humano decide.

## Active Case

| | |
|---|---|
| Caso | **[[cases/alpina/00-case-home\|Alpina Productos Alimenticios S.A.S. BIC]]** |
| Estado | 🟡 13/13 supuestos resueltos; ejecución canónica congelada en test; **materializado en Supabase**, **cálculo oficial verificado** (EV 1,668,259,651 · WACC 10.55%) y **metadata estructurado** (2024-12-31 · Market Value IVS 102) |
| Fecha de valoración | 2024-12-31 · Market Value (IVS 102) · COP miles |
| Siguiente bloqueo | Challenge (suite P-12, no implementada) y preguntas abiertas C-05, C-06, C-09, C-12 (el cross-check g/ROC ya pasó como check determinístico) |

## Start Here

1. **Metodología**: [[01-METHODOLOGY]]
2. **Workbench**: [[03-WORKBENCH]]
3. **Caso activo**: [[cases/alpina/00-case-home\|Alpina]]
4. **Decisiones**: [[05-DECISIONS]]
5. **Skill / IA**: [[07-SKILL]]

Mapas: [[01-METHODOLOGY]] · [[02-SYSTEM]] · [[03-WORKBENCH]] · [[04-CASES]] · [[05-DECISIONS]] · [[06-RESEARCH]] · [[07-SKILL]] · [[99-archive]]

## Current Work

| Now | Next | Blocked |
|---|---|---|
| Revisar el workbench privado (rama `personal-workbench`, sin merge) | Alpina por `ejecutar-calculo` y suite de sensibilidades P-12 | Evidence de Alpina 4B–4F no versionada en el repo |
| Configurar `.env.local` con las credenciales del owner (LOCAL_PRIVATE) | | |
| Documentar Company Understanding y Normalizations de Alpina en su case MOC | Writeup final del caso | Decisiones de roles y signups (abajo) |

Detalle: [[10-roadmap]] · [[11-pendientes]]

## Financial Methodology

Autoridad única: **[[04-VALUATION-METHODOLOGY-V5]]**, con sus principios en [[03-methodology-decisions-v5]]. Índice por tema: [[01-METHODOLOGY]].

## System

[[02-SYSTEM]]: arquitectura ([[02-arquitectura]]), Supabase ([[05-base-de-datos]]), motor ([[motor-canonico]]), reproducibilidad ([[reproducibilidad]]).

## Case

Alpina: [[cases/alpina/00-case-home\|case home]] · evidence y supuestos en `alpina-2024.*` ([[caso-alpina]]) · cálculo y sensibilidades en el workbench (Valuation y Challenge) · todos los casos en [[04-CASES]].

## Open Decisions

1. Roles: hoy el owner conserva `admin` internamente sin migración ([[ADR-008-single-owner-private-mode]]). Pendiente: pasar a dueño único puro (opción B de [[ADR-007-personal-valuation-workbench]], migración remota).
2. Desactivar los signups en Supabase Auth (ajuste remoto; la UI ya no ofrece registro).
3. Prompt de `generate-narrative` ("plataforma de inteligencia financiera institucional"): reescribirlo o dejarlo, dado el benchmark congelado.
4. Dónde versionar la evidencia de Alpina (4B–4F).
5. `valuation_date` / `basis_of_value` como columnas de `analyses` (migración) o solo en el case MOC.
6. Metodológicas abiertas: O-01 perímetro/NCI y O-02 materialidad ([[03-methodology-decisions-v5]]).

## Known Issues

- Alpina no confirmada por el flujo oficial ([[11-pendientes]]).
- Horizonte fijo de 5 años y convención de fin de año (LIM-01, LIM-02).
- Dos motores, cliente y canónico: el [[quick-model]] no es canónico (LIM-03).
- Sin CI. Lint con 266 errores previos (BUG-05). Ver [[12-bugs]].

## Claude / AI

- [[VELARIX-VALUATION-SKILL]]: qué puede y qué no puede hacer la IA, y el workflow de 13 pasos.
- [[claude-commands]]: `/velarix-new-case`, `/velarix-assumptions`, `/velarix-run-valuation`…
- `CLAUDE.md` (raíz del repo).

## Archive

Material histórico (SaaS, boutique, roadmaps comerciales, los 8 casos de aprendizaje): **[[99-archive]]**.
