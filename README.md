# Velarix

**Velarix is a personal valuation and projection workbench**: the system I use to study companies, organize financial evidence, build projections, document judgment and produce company valuations (DCF / FCFF) that are defensible, traceable and reproducible.

It is not a product or a service. It also serves as evidence of technical financial judgment.

## What

- Organizes **evidence**: financial statements, notes and sources with provenance.
- Normalizes accounts and documents ambiguities and questions.
- Records **judgment** explicitly: 13 resolved assumptions (tax, capital structure, risk-free rate, ERP, CRP, λ, β, cost of debt, CAPEX, D&A, working capital, terminal g, horizon), each with source and rationale.
- Runs a **deterministic calculation**: forecast, FCFF, WACC, terminal value, EV → equity bridge, scenarios and WACC × g sensitivity.
- Keeps an **audit trail**: separate evidence and judgment snapshots, input fingerprint, calculation version and provenance.

## Why

Most serious valuation errors happen when one layer is disguised as another: judgment presented as evidence, or a calculation that silently decides. Velarix forces the separation:

> **Evidence ≠ Judgment ≠ Calculation.** The engine calculates, the methodology governs, the human decides.

## Methodology

The written methodology has authority over the code:

- [`docs/velarix-v5/04-VALUATION-METHODOLOGY-V5.md`](docs/velarix-v5/04-VALUATION-METHODOLOGY-V5.md): valuation methodology (IVS, Damodaran, IFRS, Colombian sources).
- [`docs/velarix-v5/03-methodology-decisions-v5.md`](docs/velarix-v5/03-methodology-decisions-v5.md): closed principles P-01…P-14 and case-specific decisions.
- [`docs/velarix-v5/05-financial-engine-audit.md`](docs/velarix-v5/05-financial-engine-audit.md): engine audit against the methodology.

## Architecture

| Layer | Role |
|---|---|
| Obsidian (`docs/`) | Methodology, research, case files, decisions |
| AI copilot (Claude / ChatGPT) | Research, questions, explanations; never approves assumptions ([skill spec](docs/skill/VELARIX-VALUATION-SKILL.md)) |
| Workbench (`src/`, React + Vite) | Private UI: cases, evidence, accounts, questions, judgment, forecast, valuation, challenge, output, audit trail |
| Supabase (`supabase/`) | Private data layer: Postgres + RLS, Auth, Storage, Edge Functions |
| Financial engine (`supabase/functions/_shared/canonical-financial-engine.ts`) | Deterministic calculation; decides nothing |

The app is private: `/` redirects to `/workbench` (with session) or `/auth`. The Quick Model inside the workbench uses a simpler client-side engine and is **not canonical**.

## How to run

```bash
npm install
npm run dev      # http://localhost:8080 (needs VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)
npm test         # Vitest suite
npm run build
npm run lint
```

## Current case

**Alpina Productos Alimenticios S.A.S. BIC**: standalone parent operating DCF, Market Value (IVS 102), valuation date 2024-12-31, COP. All 13 assumptions are resolved and the first canonical execution is frozen in tests. Status: [`docs/cases/alpina/00-case-home.md`](docs/cases/alpina/00-case-home.md).

## Documentation

Start at [`docs/00-home.md`](docs/00-home.md). This repository root is also the Obsidian vault (open `velarix-code/` as a vault). Decisions: [`docs/09-decisiones.md`](docs/09-decisiones.md). Historical material (earlier SaaS and boutique phases) is archived and marked as superseded: [`docs/99-archive.md`](docs/99-archive.md).
