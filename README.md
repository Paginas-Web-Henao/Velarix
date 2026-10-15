# Velarix

Proyecto técnico personal de valoración empresarial (DCF / FCFF), diseñado para demostrar:

- **Rigor metodológico**: una metodología escrita y congelada antes del código, que manda sobre la implementación.
- **Criterio financiero**: cada decisión material (estructura de capital, tasa impositiva, riesgo país, `g` terminal, capital de trabajo, CAPEX) está documentada y se puede defender.
- **Trazabilidad**: cualquier cifra del resultado se puede rastrear hasta su origen.
- **Separación Evidence / Judgment / Calculation**: los datos observados, las decisiones humanas y el cálculo determinístico viven en capas separadas. El motor ejecuta, pero no decide ni aprueba supuestos.
- **Reproducibilidad**: la misma evidencia con los mismos supuestos produce siempre el mismo resultado (fingerprint, versionado, snapshots separados de evidencia y supuestos).
- **Un flagship case completo**: **Alpina Productos Alimenticios S.A.S. BIC**. Base de valor: Market Value (IVS 102). Fecha de valoración: 2024-12-31. DCF operativo standalone de la matriz.

## Documentos clave

| Documento | Contenido |
|---|---|
| [`docs/velarix-v5/04-VALUATION-METHODOLOGY-V5.md`](docs/velarix-v5/04-VALUATION-METHODOLOGY-V5.md) | Metodología de valoración (autoridad sobre el código) |
| [`docs/velarix-v5/03-methodology-decisions-v5.md`](docs/velarix-v5/03-methodology-decisions-v5.md) | Principios metodológicos cerrados (P-01…P-14) y decisiones del caso (C-01…C-12) |
| [`docs/velarix-v5/05-financial-engine-audit.md`](docs/velarix-v5/05-financial-engine-audit.md) | Auditoría del motor contra la metodología |
| [`docs/velarix-v5/06-tests-first-plan.md`](docs/velarix-v5/06-tests-first-plan.md) | Especificación por tests antes de corregir el motor |
| [`docs/00-home.md`](docs/00-home.md) | Punto de entrada de la documentación (vault de Obsidian) |

## Cómo está construido

- **Motor canónico** (`supabase/functions/_shared/canonical-financial-engine.ts`): FCFF, WACC, valor terminal y puente EV → Equity. Solo consume supuestos ya resueltos.
- **Supuestos resueltos + preflight** (`_shared/resolved-calculation-assumptions.ts`, `_shared/calculation-preflight.ts`): 13 supuestos de juicio explícitos. El cálculo se bloquea si falta alguno.
- **Expediente mínimo** (`_shared/minimum-expediente-checkpoint.ts`): exige contexto, cuentas materiales, ambigüedades y tratamiento humano antes de calcular.
- **Caso Alpina** (`_shared/alpina-2024.*`): evidencia FY2024 y supuestos resueltos reales, ejecutados contra el motor canónico.
- **Pipeline documental** (Supabase Edge Functions): extracción y homologación de estados financieros con IA. La IA nunca aprueba supuestos.
- **Estimador** (`src/components/demo/`): demo pública en `/`, sin login, con un motor cliente simplificado.

Stack: React + Vite + TypeScript (frontend) · Supabase: Postgres con RLS, Auth, Storage y Edge Functions (backend) · Vitest (tests).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:8080
npm test         # suite Vitest
npm run lint
npm run build
```

## Estado

El alcance v5.0 está congelado: metodología → auditoría y corrección del motor → caso Alpina → demo pública → este README. El estado detallado está en [`docs/10-roadmap.md`](docs/10-roadmap.md).
