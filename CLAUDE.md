# CLAUDE.md — Velarix

**Velarix is a personal valuation & projection workbench, not a commercial product.** One user: Nicolás.

## Rules

- Never propose customers, pricing, subscriptions, sales, CRM, multi-tenancy, growth, landing pages, public demos or onboarding, unless Nicolás explicitly changes the project's purpose.
- **Methodology has authority over code**: `docs/velarix-v5/04-VALUATION-METHODOLOGY-V5.md` (+ `03-methodology-decisions-v5.md`). If they conflict, the document is fixed first, and only with Nicolás's decision.
- **Evidence ≠ Judgment ≠ Calculation.** The engine calculates, the methodology governs, the human decides.
- **Financial correctness > UX > speed.** A financially wrong number is a blocker.
- The AI never silently approves assumptions (WACC, beta, g, normalizations, capital structure, CAPEX, NWC, taxes), never fabricates evidence and never bypasses preflight.
- The Quick Model (`src/lib/financial-engine.ts`) is **not** canonical. Do not unify the engines (NOT BUILDING).
- `docs/velarix/` and `Negocio*.md` are **historical / superseded** (see `docs/99-archive.md`). Never treat them as current scope.
- Do not read or print `.env*`, `.vercel/`, `supabase/.temp/`. Ignore `velarix-code-latest/`.
- No destructive Supabase changes (drops, RLS removal, remote migrations) without explicit confirmation.

## Read first

- Before significant work: `docs/00-home.md`.
- Before valuation or case work: `docs/skill/VELARIX-VALUATION-SKILL.md` and the active case MOC (`docs/cases/<case>/00-case-home.md`).
- Before financial model changes: the canonical methodology.
- Before architectural changes: the ADRs in `docs/decisions/` and `docs/02-arquitectura.md`.

## Keep the knowledge system current

| When you change… | Update… |
|---|---|
| a case | its case MOC (`docs/cases/<case>/00-case-home.md`) |
| methodology | the methodology docs (never silently) |
| architecture | `docs/02-arquitectura.md`, `docs/maps/02-SYSTEM.md`, module notes |
| a decision | a new or updated ADR + `docs/09-decisiones.md` |
| a known issue | `docs/12-bugs.md` |
| significant AI behavior | `docs/skill/VELARIX-VALUATION-SKILL.md` |

## Map

- App (private): `/` → `/workbench` (session) or `/auth`; workbench in `src/pages/Workbench.tsx` + `src/components/workbench/`.
- Canonical engine: `supabase/functions/_shared/canonical-financial-engine.ts`. Assumptions/preflight: `_shared/resolved-calculation-assumptions.ts`, `_shared/calculation-preflight.ts`. Alpina: `_shared/alpina-2024.*`.
- Commands: `npm run dev` (8080) · `npm test` (green except 1 known `test.fails`) · `npm run build` · `npm run lint` (266 pre-existing errors; add none).
- Claude Code: skill `velarix-valuation`, commands `/velarix-new-case`, `/velarix-review-evidence`, `/velarix-assumptions`, `/velarix-run-valuation`, `/velarix-challenge`, `/velarix-case-summary`.
