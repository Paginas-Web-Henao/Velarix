# Velarix

Plataforma SaaS de análisis financiero institucional para empresas colombianas.
El usuario sube estados financieros (PDF, Excel, CSV) → la plataforma los
procesa con IA → genera valoración DCF completa + PDF institucional listo
para presentar a inversionistas o juntas directivas.

## Stack

- Frontend: React + Vite (`src/`)
- Backend: Supabase (Postgres + RLS, Auth, Storage, Edge Functions en `supabase/`)
- LLM: Anthropic Claude (llamado directo vía `supabase/functions/_shared/anthropic-client.ts`)

## Desarrollo

```
npm install
npm run dev
```
