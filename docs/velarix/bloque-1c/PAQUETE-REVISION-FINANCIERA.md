# Paquete de revisión financiera — Bloque 1C-T

## 1. Propósito de la revisión

Este documento reúne, en un solo lugar, lo que un revisor financiero
externo o el fundador necesitan para evaluar el motor de valoración
**servidor** (`runCanonicalFinancialEngine`) — el motor declarado
canónico por `D-06`/`D-07` — antes de que cualquiera de sus resultados
pueda considerarse aprobado para uso real con datos de un cliente.

Ningún caso ni ninguna cifra de este documento ha sido revisada ni
aprobada todavía. El propósito es **preparar** esa revisión, no
adelantarla ni sustituirla.

## 2. Versión del motor y metodología

| Campo | Valor |
|---|---|
| `canonical_engine_version` | `1.0.0` (`_shared/calculation-versioning.ts`) |
| `methodology_version` | `1.0.0-provisional` (`CANONICAL_METHODOLOGY.methodologyVersion`, `_shared/financial-methodology.ts`) |
| `calculation_schema_version` | `1.0.0` (formato del "sobre" que agrega versionado + procedencia al resultado del motor) |

Los 8 supuestos financieros que esta versión de la metodología fija
(tasa de impuesto, CAPEX % ingresos, capital de trabajo % ingresos,
crecimiento terminal, costo de deuda, tasa libre de riesgo, prima de
riesgo de mercado, D&A % ingresos) están **todos** marcados
`approved: false` en `CANONICAL_METHODOLOGY` — ninguno ha sido aprobado
formalmente. Detalle completo en
`docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md`
(no se duplica aquí).

## 3. Resumen de los casos A, B y C (motor servidor)

Los tres casos son **sintéticos y provisionales**. Resultados producidos
ejecutando realmente `runCanonicalFinancialEngine` (no calculados a
mano), ver detalle completo, inputs y comparación contra el motor
cliente en `docs/velarix/bloque-1c/CASOS-DORADOS-PROVISIONALES.md`.

| Caso | Perfil | WACC | Enterprise Value | Equity Value | `waccWarning` |
|---|---|---|---|---|---|
| A | Estable y rentable | 9.9202% | COP 12.766.089.939 | COP 12.366.089.939 | ninguno |
| B | Alto crecimiento, alta reinversión (según supuestos fijos del servidor) | 11.3613% | COP 9.615.506.880 | COP 9.915.506.880 | ninguno |
| C | Tensionada (EBITDA y patrimonio negativos) | 10.4800% | COP −4.239.525.044 | COP 0 (piso) | ninguno |

Nota sobre el Caso C: el servidor reporta ROE = −77% para este caso por
un hallazgo del cierre técnico anterior (`Math.abs()` aplicado al
patrimonio antes de los clamps de KPI) — ver decisión pendiente #6.

## 4. Las diez decisiones pendientes (resumen)

Detalle completo, alternativas, impacto y recomendación técnica de cada
una en
`docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md`
— no se duplica aquí, solo se resume para orientar la revisión:

1. Fuente y vigencia de los supuestos de mercado (tasa libre de riesgo, ERP, beta sectorial, spread de deuda).
2. Estructura de capital: derivada de saldos reales vs. estructura "objetivo".
3. Tasa de crecimiento perpetuo (g terminal) fija al 3% para todos los sectores.
4. Horizonte explícito del DCF fijo en 5 años.
5. Normalización de EBITDA e impuestos/utilidad neta históricos ignorados.
6. Tratamiento de empresas con patrimonio negativo (incluye el hallazgo `Math.abs()` del servidor).
7. Uso de utilidad neta vs. NOPAT para ROE/ROA.
8. Límites de los escenarios optimista y pesimista (el servidor no varía capex/wc% por escenario; el cliente sí).
9. ¿Deben los 8 supuestos canónicos ser editables desde `structured_input`?
10. Manejo de `revenue = 0` / datos insuficientes en el motor cliente.

## 5. Recomendación técnica existente

No se introduce ninguna recomendación nueva en este paquete. La
recomendación técnica por decisión ya está documentada en
`DECISIONES-FINANCIERAS-PENDIENTES.md` (columna "Recomendación técnica"
de cada una). En síntesis, la postura de este bloque ha sido: mantener
el comportamiento actual documentado explícitamente como provisional en
todos los casos donde no hay una decisión ya aprobada, y no resolver
ninguna decisión metodológica de forma silenciosa.

## 6. Resolución del revisor

- [ ] Aprobado
- [ ] Aprobado con ajustes (detallar abajo)
- [ ] Rechazado

**Observaciones del revisor:**

```




```

*(Este documento no declara ni simula que un revisor ya haya marcado
ninguna de las opciones anteriores. El estado por defecto es "sin
resolución" hasta que un revisor financiero externo o el fundador lo
complete.)*

## 7. Declaraciones

- Los tres casos (A, B, C) son **sintéticos**, construidos para
  ejercitar el motor en perfiles representativos (estable, alto
  crecimiento, tensionada) — no representan ninguna empresa real.
- **No se usaron datos de ningún cliente real de Velarix** en la
  construcción de estos casos ni en ninguna prueba de este bloque.

## 8. Checklist final del revisor

- [ ] Revisé la versión del motor y la metodología (sección 2).
- [ ] Revisé los tres resultados canónicos A/B/C (sección 3) contra mi
      propio criterio profesional de valoración.
- [ ] Revisé las diez decisiones pendientes en
      `DECISIONES-FINANCIERAS-PENDIENTES.md` y tengo una postura sobre
      cada una (aprobar el comportamiento actual, o exigir un cambio).
- [ ] Entiendo que ningún resultado de este paquete está conectado hoy
      al PDF entregable ni a la narrativa generada por IA (esa conexión
      es exclusiva del Bloque 1E, y solo ocurre después de que 1B, 1C y
      1D estén formalmente cerrados).
- [ ] Entiendo que la trazabilidad técnica (documento → homologación →
      cálculo) implementada en este bloque es una preparación técnica,
      no una aprobación de los supuestos financieros en sí.
- [ ] Marqué una resolución en la sección 6.
