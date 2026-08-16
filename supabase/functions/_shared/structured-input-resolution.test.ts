// Hallazgo B (bridge structured_inputs -> analyses.input_payload) —
// pruebas de especificación del resolver puro que usa `ejecutar-calculo`.

import { describe, it, expect } from "vitest";
import { resolveStructuredInput } from "./structured-input-resolution";

describe("resolveStructuredInput — Hallazgo B", () => {
  it("B1. structured_inputs válido, analyses.input_payload=null: se resuelve SIN bridge manual", () => {
    const payload = { income_statement: { revenue: 500000000 } };
    const r = resolveStructuredInput({ structuredInputPayload: payload, analysisInputPayload: null });
    expect(r.source).toBe("structured_inputs");
    expect(r.payload).toBe(payload); // mismo objeto, no una copia mutada
  });

  it("B2. provenance dentro del payload se preserva intacto (no se toca el payload)", () => {
    const payload = {
      income_statement: { revenue: 500000000 },
      provenance: { overall_status: "complete", period_selection: { base_period: "2025" } },
    };
    const r = resolveStructuredInput({ structuredInputPayload: payload, analysisInputPayload: null });
    expect((r.payload as any).provenance).toEqual({ overall_status: "complete", period_selection: { base_period: "2025" } });
  });

  it("B3. structured_inputs existe pero revenue está realmente ausente: el resolver lo devuelve tal cual, no maquilla el dato faltante", () => {
    const payload = { income_statement: { revenue: null } };
    const r = resolveStructuredInput({ structuredInputPayload: payload, analysisInputPayload: null });
    expect(r.source).toBe("structured_inputs");
    // El resolver no decide si el cálculo puede proceder — solo entrega
    // el payload de la fuente correcta. El caller (ejecutar-calculo) sigue
    // rechazando revenue ausente exactamente igual que antes.
    expect((r.payload as any).income_statement.revenue).toBeNull();
  });

  it("B5. legacy: sin fila en structured_inputs, analyses.input_payload sí existe -> fallback legacy", () => {
    const legacyPayload = { income_statement: { revenue: 400000000 } };
    const r = resolveStructuredInput({ structuredInputPayload: null, analysisInputPayload: legacyPayload });
    expect(r.source).toBe("analyses_legacy");
    expect(r.payload).toBe(legacyPayload);
  });

  it("B5b. ninguna de las dos fuentes existe: payload null, source 'none'", () => {
    const r = resolveStructuredInput({ structuredInputPayload: null, analysisInputPayload: null });
    expect(r.payload).toBeNull();
    expect(r.source).toBe("none");
  });

  it("B6. drift: ambas fuentes existen con valores distintos -> structured_inputs SIEMPRE gana, nunca se mezclan ni se usa la legacy", () => {
    const fresh = { income_statement: { revenue: 500000000 } }; // el más reciente, en structured_inputs
    const stale = { income_statement: { revenue: 800000000 } }; // copia vieja/legacy en analyses.input_payload
    const r = resolveStructuredInput({ structuredInputPayload: fresh, analysisInputPayload: stale });
    expect(r.source).toBe("structured_inputs");
    expect(r.payload).toBe(fresh);
    expect((r.payload as any).income_statement.revenue).toBe(500000000);
    expect((r.payload as any).income_statement.revenue).not.toBe(800000000);
  });

  it("B7. no aplica selección entre múltiples versiones: structured_inputs.analysis_id es UNIQUE NOT NULL en el schema (ver migración 20260320180111), por lo que solo puede existir 0 o 1 fila por análisis — el resolver recibe siempre, a lo sumo, un único payload candidato de esa fuente.", () => {
    // Prueba de documentación: el resolver no implementa ninguna lógica de
    // "elegir la versión más reciente entre varias" porque el schema hace
    // que ese caso sea estructuralmente imposible. No hay nada que
    // seleccionar entre "muchas" filas — por eso `ejecutar-calculo` usa
    // `.maybeSingle()` y no `.limit(1).order(...)`.
    const payload = { income_statement: { revenue: 500000000 } };
    const r = resolveStructuredInput({ structuredInputPayload: payload, analysisInputPayload: null });
    expect(r.source).toBe("structured_inputs");
  });
});
