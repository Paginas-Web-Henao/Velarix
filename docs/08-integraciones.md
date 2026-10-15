---
tipo: integraciones
actualizado: 2026-10-15
tags: [velarix, integraciones, ia, system]
---

# Integraciones externas

Volver a [[00-home]] · Arquitectura: [[02-arquitectura]]

> Solo se listan **nombres** de variables de entorno. Los valores viven en `.env`/`.env.local` (ignorados por git) y en los secrets de Supabase. No se documentan aquí.

| Servicio | Uso | Dónde | Variables |
|---|---|---|---|
| **Supabase** | Postgres, Auth, Storage, Edge Functions | `src/integrations/supabase/`, `supabase/` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEYS`, `SUPABASE_PUBLISHABLE_KEYS` |
| **Anthropic** | Homologación de cuentas (`map-accounts`) y narrativa (`generate-narrative`) | `_shared/anthropic-client.ts` (modelo fijo `claude-opus-4-8`) | `ANTHROPIC_API_KEY` |
| **OpenAI** | Extracción en `parse-document` (único proveedor productivo, fail-closed) | `_shared/parse-document-ai-provider.ts` | `PARSE_AI_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_PARSE_MODEL` |
| **Resend** | Emails transaccionales | `enviar-notificacion` | `RESEND_API_KEY`, `APP_URL` |
| **Vercel** | Hosting del frontend | `vercel.json`, `.vercel/` (ignorado) | — |
| **Damodaran / NYU Stern** | Benchmarks sectoriales (dataset 2026 hardcodeado, "actualizado anualmente en enero") | `update-snapshots/index.ts` | — |
| **Datos macro Colombia** | Datos de referencia del frontend | `src/data/velarix-datos-2026.ts` | — |

## Rol de la IA (regla v5.0)

La IA puede extraer, clasificar y proponer preguntas/inconsistencias. **Nunca** aprueba metodología, decide WACC, `g`, horizonte ni supuestos ([[04-VALUATION-METHODOLOGY-V5]] §17). Ninguno de los 3 llamadores de IA expone ese poder ([[01-scope-surgery]] §2).

## Selección de proveedor para `parse-document`

Decisión **D-11** en [[REGISTRO-DE-DECISIONES]]: OpenAI (Terra, `reasoning.effort=none`) elegido provisionalmente tras benchmark; Anthropic/Sonnet 5 evaluado pero no conectado. Evidencia: `../benchmark-evidence/2026-08-18/` (fuera del repo) y [[benchmarks-ia]].
