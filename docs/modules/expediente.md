---
tipo: modulo
capa: evidence-judgment
estado_v5: KEEP (mínimo implementado)
actualizado: 2026-10-15
tags: [velarix, modulo, expediente]
---

# Expediente de Valoración

Índice: [[03-modulos]] · Spec completa: [[EXPEDIENTE-DE-VALORACION-V1]]

## Qué es
El expediente del caso: documentos → entender empresa → cuentas → ambigüedades → preguntas → evidencia → normalización → hipótesis → método → supuestos → cálculo → contraste → conclusión. Ver [[04-flujos]] §5.

## Implementado en código (solo el mínimo)
- `supabase/functions/_shared/minimum-expediente-checkpoint.ts` — 4 checks: contexto, ≥1 cuenta material, ≥1 ambigüedad, ≥1 tratamiento humano. **No** evalúa WACC, g, horizonte ni aprobación metodológica.
- Tablas (migración `20260817140000`): `valuation_files`, `account_notes`, `expedient_questions`, `expedient_answers`. Ver [[05-base-de-datos]].
- Lo consume `ejecutar-calculo` antes del preflight ([[supuestos-y-preflight]]) y del [[motor-canonico]]. Es uno de los dos gates que [[caso-alpina]] debe pasar por el flujo oficial.

## No implementado
El resto de entidades de la spec (p. ej. `company_context`, `case_assumptions`). Decisión D-10: se refina con evidencia de casos reales antes de implementarse.

## Tests
`minimum-expediente-checkpoint.test.ts`, `minimum-expediente-checkpoint.integration.test.ts`.
