---
tipo: testing
actualizado: 2026-10-15
tags: [velarix, testing, vitest, system]
---

# Testing

Volver a [[00-home]] · Anterior: [[expediente]] · Siguiente: [[09-decisiones]] · Relacionado: [[06-tests-first-plan]], [[MATRIZ-DE-PRUEBAS-FINANCIERAS]]

Qué protege la suite: [[motor-canonico]], [[supuestos-y-preflight]], [[reproducibilidad]], [[expediente]], [[caso-alpina]], [[quick-model]].

## Comandos

```bash
cd velarix-code
npm test          # vitest run
npm run test:watch
npm run build     # vite build + scripts/check-bundle-secrets.mjs
npm run lint      # eslint .
```

## Estado verificado (2026-10-15, rama `personal-workbench`)

```
Test Files  65 passed (65)
     Tests  1062 passed | 1 expected fail (1063)
```

El único fallo esperado es `test.fails` de BUG-01 (revenue = 0 en el motor cliente). Ver [[12-bugs]].

## Configuración

- **Vitest** (`vitest.config.ts`): entorno `jsdom`, `globals: true`, setup `src/test/setup.ts`. Incluye:
  - `src/**/*.{test,spec}.{ts,tsx}`
  - `supabase/functions/_shared/**/*.{test,spec}.ts`
  - `vite/**/*.{test,spec}.ts` (guards del servidor local, [[ADR-008-single-owner-private-mode]])
  - `scripts/benchmark-ai/**` y `scripts/benchmark-narrative/**`
- **Testing Library** (`@testing-library/react`, `jest-dom`).
- **Playwright** configurado (`playwright.config.ts`, `testDir: ./tests`) pero la carpeta no existe: no hay tests E2E.
- **Sin CI**: no existe `.github/workflows`. Los tests solo corren localmente.
- **Sin typecheck** de `supabase/functions/_shared` (fuera de `tsconfig.app.json`).

## Tipos de test (convención de nombres)

| Sufijo / patrón | Propósito | Ejemplos |
|---|---|---|
| `*.golden-cases.test.ts` + `*.fixtures.ts` | Casos dorados sintéticos A/B/C, fijan WACC/EV/Equity/FCFF | `canonical-financial-engine.golden-cases.test.ts`, `src/lib/financial-engine.golden-cases.test.ts` |
| `*.v5.test.ts` | Especificación v5 escrita antes del código (Bloque 3B); sus `it.fails` ya pasaron a `it` | 8 archivos: fingerprint, preflight, versioning, consumption, capital-structure, roe-negative-equity, source-input-snapshot, working-capital |
| `*.integration.test.ts` | Varios módulos `_shared` juntos | `calculation-envelope`, `calculation-preflight`, `minimum-expediente-checkpoint` |
| `*.regression.test.ts` | Bugs ya corregidos | `continuar-tras-revision`, `structured-input-canonical-contract`, `pdf-canonical-calculation` |
| `*.characterization.test.ts` | Fija comportamiento actual sin juzgarlo | `financial-engine.characterization.test.ts` |
| `alpina-2024.*.test.ts` | Caso real Alpina | `canonical-execution`, `resolved-assumptions`, `structured-input` |
| `scripts/benchmark-*/**.test.ts` | Harness de benchmarks de IA | [[benchmarks-ia]] |
| Acceso single-owner | Rutas sin login, fail closed, secretos fuera del bundle ([[ADR-008-single-owner-private-mode]]) | `src/test/private-routing.test.tsx`, `src/test/secret-exposure.test.ts`, `src/lib/access-mode.test.ts`, `vite/owner-session-guards.test.ts` |

## Regla de trabajo (de [[06-tests-first-plan]])

Cuando una implementación hace pasar un `it.fails`, Vitest lo marca como *unexpected pass*: (1) verificar que pasa por la razón correcta, (2) convertirlo a `it`, (3) mantenerlo verde. La suite debe quedar con exit code 0 en cada paso intermedio.
