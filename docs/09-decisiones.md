---
tipo: decisiones
actualizado: 2026-10-15
tags: [velarix, decisiones, adr, decision]
---

# Decisiones

Volver a [[00-home]] · Anterior: [[13-testing]] · Siguiente: [[10-roadmap]] · Notas individuales en `docs/decisions/` · Plantilla: [[plantilla-decision]]

## Jerarquía de autoridad

1. [[03-methodology-decisions-v5]] v1.1 — fuente canónica de decisiones metodológicas.
2. [[04-VALUATION-METHODOLOGY-V5]] v1.1 — documento metodológico definitivo; si un documento histórico lo contradice, prevalece este (y `03`).
3. [[05-financial-engine-audit]] v1.3 — donde `01`/`02`/`03` divergen de `04`, manda `04`.
4. Documentación histórica (`docs/velarix/`) — contexto, no autoridad.

## Decisiones v5.0 (notas en `decisions/`)

| ID | Decisión | Fecha |
|---|---|---|
| [[ADR-001-redefinicion-v5]] | Velarix deja de ser negocio; proyecto personal de evidencia técnica | 2026-08-31 |
| [[ADR-002-metodologia-manda-sobre-codigo]] | La metodología escrita tiene autoridad sobre la implementación | 2026-08-31 |
| [[ADR-003-separacion-evidence-judgment-snapshots]] | `resolved_assumptions_used` separado de `source_input_snapshot` | 2026-09-03 |
| [[ADR-004-alpina-base-de-valoracion]] | Alpina: Market Value, 2024-12-31, standalone parent DCF + SOTP separado | 2026-09-07 |
| [[ADR-005-lambda-juicio-directo]] | `country_risk_lambda` admite juicio directo documentado | 2026-09-07 |
| [[ADR-006-retirar-landing-comercial]] | Se elimina la landing B2B (la parte "Estimador público" quedó superada por ADR-007) | 2026-10-15 |
| [[ADR-007-personal-valuation-workbench]] | Velarix = Personal Valuation & Projection Workbench; app privada, sin demo pública | 2026-10-15 |

## Principios metodológicos cerrados (P-01 … P-14)

Definidos en [[03-methodology-decisions-v5]] (Capa A):

P-01 Convención de signos · P-02 Estructura de capital · P-03 Impuesto corporativo · P-04 FCFF, EBIT negativo y NOLs · P-05 WACC y consistencia moneda/inflación · P-06 Working capital operativo · P-07 CAPEX y reinversión · P-08 Normalización de EBITDA · P-09 Coherencia del valor terminal · P-10 Puente EV → Equity · P-11 DLOM y size premium condicionales · P-12 Suite mínima de sensibilidades · P-13 Fecha de valoración y convención de descuento · P-14 Sin prima genérica por empresa privada colombiana.

Decisiones case-specific de Alpina: C-01 … C-12 (Capa B del mismo documento y [[04-VALUATION-METHODOLOGY-V5]] §19). Preguntas abiertas: O-01, O-02 (abiertas), O-03 (`NOT BUILDING`).

## Registro histórico D-01 … D-11 (pre-v5)

En [[REGISTRO-DE-DECISIONES]]:

| ID | Tema | Vigencia en v5.0 |
|---|---|---|
| D-01 | Fuente de verdad de negocio para la auditoría | Histórica |
| D-02 | Excluir `velarix-code-latest/` | Vigente (sigue ignorado por git) |
| D-03 | `claude-opus-4-8` como identificador válido | Vigente |
| D-04 | Auditoría sin migraciones ni llamadas en vivo | Histórica |
| D-05 | Duplicación de código como deuda clasificada | Vigente |
| D-06 | El pipeline del servidor es el motor canónico | **Vigente — base de v5** |
| D-07 | Secuencia de implementación 1A–1E | Histórica |
| D-08 | 10 decisiones metodológicas 1B-M | Superada por `03` v1.1 |
| D-09 | Reorientación boutique expert-led | **Superada por v5.0** |
| D-10 | El Expediente se refina con casos reales antes de implementarse | Vigente |
| D-11 | OpenAI (Terra) como proveedor de `parse-document` | Vigente (provisional) |

## Explícitamente NO construir

De [[05-financial-engine-audit]] §10 y [[04-VALUATION-METHODOLOGY-V5]] §18.2: unificación de motores servidor/cliente · roles/workflows/tablas de aprobación · estructuras genéricas NCI/leases para múltiples casos · `forecast_growth_path` año a año · clamp sobre beta/Ke · sensibilidades de un factor como funciones genéricas del motor · segundo caso, nuevos sectores, multi-tenant, CRM, pricing.
