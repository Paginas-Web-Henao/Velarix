---
tipo: deploy
actualizado: 2026-10-15
tags: [velarix, deploy, system]
---

# Deploy

Volver a [[00-home]] · Relacionado: [[02-arquitectura]], [[08-integraciones]]

## Frontend — Vercel

- Proyecto Vercel `velarix` (`.vercel/project.json`, ignorado por git).
- `vercel.json`: rewrite de todas las rutas a `/index.html` (fallback SPA, commit `cb48be9`).
- Build: `npm run build` (`vite build`) → `dist/` (ignorado por git).
- Variables necesarias en el build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. **Nunca** definir en Vercel variables `VITE_*` con secretos, ni `VELARIX_OWNER_*`.
- Un build desplegado siempre es `DEPLOYED_PRIVATE`: no tiene sesión automática del owner y muestra la barrera de desbloqueo (fail closed, [[ADR-008-single-owner-private-mode]]). Los datos siguen protegidos por RLS.
- `npm run build` termina con `scripts/check-bundle-secrets.mjs`: el build falla si `dist/` contiene secretos server-side.
- > Pendiente de confirmar: si el deploy es automático desde `main` en GitHub o manual con la CLI.

## Backend — Supabase

- Proyecto enlazado con `supabase link` (estado local en `supabase/.temp/`, ignorado).
- Migraciones: `supabase/migrations/` (aplicar con la CLI de Supabase). Rollback manual disponible solo para `20260723090000` en `supabase/rollback/`.
- Edge Functions: `supabase/functions/*`; configuración de `verify_jwt` en `supabase/config.toml` (todas en `false`, ver [[07-autenticacion]]).
- Secrets requeridos por las funciones (solo nombres): `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENAI_PARSE_MODEL`, `PARSE_AI_PROVIDER`, `RESEND_API_KEY`, `APP_URL`. `SUPABASE_URL`, `SUPABASE_SECRET_KEYS` y `SUPABASE_PUBLISHABLE_KEYS` los inyecta la plataforma.
- > Pendiente de confirmar: cómo se programan `update-snapshots` y `check-data-freshness` (no hay cron definido en el repo).

## Estado de las Edge Functions

- 2026-10-15: `ejecutar-calculo` re-desplegada desde el commit `5a36ef2` (**v14**). La v13 (2026-08-26) correspondía al commit `5750fcf`, anterior a toda la implementación v5: hacía caer los casos v5 en el preflight legacy (`CALCULATION_PREFLIGHT_REQUIRED` con los 9 supuestos legacy). Se verificó que la v14 descargada es idéntica a HEAD. Comando: `npx supabase functions deploy ejecutar-calculo --project-ref <ref> --use-api`.
- Las otras 11 funciones siguen en versiones de agosto. Hay que verificar si divergen del repo antes de usarlas con casos v5 (ver [[11-pendientes]]).
- Para comparar lo desplegado con el repo: `npx supabase functions download <fn> --workdir <carpeta vacía> --use-api` y diff contra `supabase/functions/`. Nunca descargar sobre el repo, porque sobrescribe los archivos locales.

## Desarrollo local

```bash
cd velarix-code
npm install
npm run dev       # Vite en http://127.0.0.1:8080 — LOCAL_PRIVATE (sin login)
npm run preview   # puerto 4173
```

`.claude/launch.json` define estas dos configuraciones para Claude Code.

Para entrar sin login, añade `VELARIX_OWNER_EMAIL` y `VELARIX_OWNER_PASSWORD` a `.env.local` (ver [[07-autenticacion]]). El servidor solo escucha en loopback; `npm run preview` es un build de producción y por eso pide desbloqueo.

## CI/CD

No aplica actualmente: no hay pipelines de CI en el repo.
