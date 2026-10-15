---
tipo: deploy
actualizado: 2026-10-15
tags: [velarix, deploy]
---

# Deploy

Volver a [[00-home]] · Relacionado: [[02-arquitectura]], [[08-integraciones]]

## Frontend — Vercel

- Proyecto Vercel `velarix` (`.vercel/project.json`, ignorado por git).
- `vercel.json`: rewrite de todas las rutas a `/index.html` (fallback SPA, commit `cb48be9`).
- Build: `npm run build` (`vite build`) → `dist/` (ignorado por git).
- Variables necesarias en el build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- > Pendiente de confirmar: si el deploy es automático desde `main` en GitHub o manual con la CLI.

## Backend — Supabase

- Proyecto enlazado con `supabase link` (estado local en `supabase/.temp/`, ignorado).
- Migraciones: `supabase/migrations/` (aplicar con la CLI de Supabase). Rollback manual disponible solo para `20260723090000` en `supabase/rollback/`.
- Edge Functions: `supabase/functions/*`; configuración de `verify_jwt` en `supabase/config.toml` (todas en `false`, ver [[07-autenticacion]]).
- Secrets requeridos por las funciones (solo nombres): `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENAI_PARSE_MODEL`, `PARSE_AI_PROVIDER`, `RESEND_API_KEY`, `APP_URL`. `SUPABASE_URL`, `SUPABASE_SECRET_KEYS` y `SUPABASE_PUBLISHABLE_KEYS` los inyecta la plataforma.
- > Pendiente de confirmar: cómo se programan `update-snapshots` y `check-data-freshness` (no hay cron definido en el repo).

## Desarrollo local

```bash
cd velarix-code
npm install
npm run dev       # Vite en http://localhost:8080
npm run preview   # puerto 4173
```

`.claude/launch.json` define estas dos configuraciones para Claude Code.

## CI/CD

No aplica actualmente: no hay pipelines de CI en el repo.
