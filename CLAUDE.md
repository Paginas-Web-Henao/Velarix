# CLAUDE.md — Velarix

Contexto para Claude y otros agentes. La documentación completa está en `docs/` (empieza por `docs/00-home.md`).

## Qué es
Velarix v5.0: proyecto personal de valoración DCF/FCFF que demuestra rigor financiero con **un solo caso completo, Alpina** (no es un producto ni un negocio). Principio central: separar **Evidence / Judgment / Calculation**. El motor ejecuta; nunca decide ni aprueba supuestos.

## Reglas obligatorias
- La metodología escrita manda: `docs/velarix-v5/04-VALUATION-METHODOLOGY-V5.md` (y `03-methodology-decisions-v5.md`). Si el código la contradice, se corrige primero el documento.
- Un cálculo financieramente incorrecto es bloqueante, por encima de cualquier trabajo de UI.
- No añadir funcionalidad fuera del alcance congelado (`docs/10-roadmap.md`). Las ideas nuevas se anotan como `NOT BUILDING`, no se construyen.
- No reabrir el enfoque comercial (clientes, pricing, CRM, multi-tenant). No hay landing (eliminada, ADR-006): no crear páginas de marketing, CTAs, "Solicitar demo" ni gates de login como embudo.
- Los 8 casos históricos de `docs/velarix/casos/` son material de aprendizaje, no backlog.
- La IA puede extraer, clasificar y proponer preguntas; nunca aprueba metodología ni supuestos.
- No leer ni imprimir `.env`, `.env.local`, `supabase/.temp/` ni `.vercel/`.
- Ignorar `velarix-code-latest/` (snapshot viejo, fuera de git).

## Mapa rápido
- Frontend: `src/` (React + Vite + shadcn). Alias `@` → `src/`.
- Rutas: `/` = Estimador público sin login (`src/components/demo/DemoDashboard.tsx`); `/auth`, `/reset-password` públicas; `/dashboard` y `/admin/revisiones*` protegidas (`ProtectedRoute`).
- Motor canónico: `supabase/functions/_shared/canonical-financial-engine.ts` (+ `capital-structure.ts`).
- Supuestos/preflight: `_shared/resolved-calculation-assumptions.ts`, `_shared/calculation-preflight.ts`.
- Caso Alpina: `_shared/alpina-2024.*`.
- Edge Functions: `supabase/functions/<nombre>/index.ts`; lógica pura y tests en `_shared/`.
- Motor cliente (solo el Estimador): `src/lib/financial-engine.ts`.

## Comandos
```bash
npm run dev     # http://localhost:8080
npm test        # vitest run (esperado: todo verde salvo 1 test.fails conocido)
npm run lint    # tiene 268 errores preexistentes (ver docs/12-bugs.md BUG-05); no introducir nuevos
npm run build
```

## Convenciones
- Commits en estilo Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`).
- Tests de especificación primero (`it.fails` → `it` cuando se implementa). Sufijos: `.v5.test.ts`, `.golden-cases.test.ts`, `.integration.test.ts`, `.regression.test.ts`.
- Módulos de `_shared/` puros: sin Supabase, sin `serve()`, sin env, importables desde Deno y Vitest.
- Dominio y BD en español; tipos del motor en inglés.

## Al terminar un trabajo
Actualizar `docs/11-pendientes.md`, `docs/10-roadmap.md` y, si hubo una decisión, crear `docs/decisions/ADR-NNN-*.md` desde `docs/decisions/plantilla-decision.md`.
