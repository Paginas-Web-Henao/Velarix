// Calculation Preflight — verificación de que ejecutar-calculo/index.ts
// realmente invoca el preflight, y en el orden correcto: Minimum
// Expediente -> Calculation Preflight -> calculo_en_curso/motor. Mismo
// patrón de inspección estática de código fuente que
// minimum-expediente-checkpoint.integration.test.ts y
// calculation-envelope.integration.test.ts — index.ts no puede importarse
// en Vitest (usa `serve()` de Deno std).

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("ejecutar-calculo/index.ts — orden real del gate (verificación estática de código fuente)", () => {
  const sourcePath = path.resolve(__dirname, "../ejecutar-calculo/index.ts");
  const source = fs.readFileSync(sourcePath, "utf-8");

  it("importa evaluateCalculationPreflight desde _shared, no una copia local", () => {
    expect(source).toContain('import { evaluateCalculationPreflight } from "../_shared/calculation-preflight.ts"');
  });

  it("9/10. Minimum Expediente ocurre ANTES del preflight, que ocurre ANTES de calculo_en_curso y del motor", () => {
    const idxCheckpointPassed = source.indexOf("if (!checkpoint.passed)");
    const idxPreflightCall = source.indexOf("evaluateCalculationPreflight({");
    const idxPreflightGate = source.indexOf("if (!preflight.passed)");
    const idxCalculoEnCurso = source.indexOf('status: "calculo_en_curso"');
    const idxEngineCall = source.indexOf("runCanonicalFinancialEngine(typedInput");

    expect(idxCheckpointPassed).toBeGreaterThan(-1);
    expect(idxPreflightCall).toBeGreaterThan(-1);
    expect(idxPreflightGate).toBeGreaterThan(-1);
    expect(idxCalculoEnCurso).toBeGreaterThan(-1);
    expect(idxEngineCall).toBeGreaterThan(-1);

    expect(idxCheckpointPassed).toBeLessThan(idxPreflightCall);
    expect(idxPreflightCall).toBeLessThan(idxPreflightGate);
    expect(idxPreflightGate).toBeLessThan(idxCalculoEnCurso);
    expect(idxCalculoEnCurso).toBeLessThan(idxEngineCall);
  });

  it("11. el gate de preflight retorna (con `return new Response`) ANTES de la sección 'Update status' — el motor nunca se invoca cuando el preflight falla", () => {
    const gateBlockStart = source.indexOf("if (!preflight.passed)");
    const gateBlockEnd = source.indexOf("// Update status", gateBlockStart);
    const gateBlock = source.slice(gateBlockStart, gateBlockEnd);
    expect(gateBlock).toContain("return new Response(JSON.stringify({");
    expect(gateBlock).toContain("CALCULATION_PREFLIGHT_REQUIRED");
    expect(gateBlock).not.toContain("runCanonicalFinancialEngine");
  });

  it("12. el bloqueo del preflight ocurre antes de cualquier escritura de calculation_result — 'calculation_result:' no aparece antes del gate de preflight", () => {
    const idxPreflightGate = source.indexOf("if (!preflight.passed)");
    const beforeGate = source.slice(0, idxPreflightGate);
    expect(beforeGate).not.toContain("calculation_result:");
  });

  it("el bloqueo del preflight registra un audit_event antes de responder 409, mismo patrón que Minimum Expediente", () => {
    const gateBlockStart = source.indexOf("if (!preflight.passed)");
    const gateBlockEnd = source.indexOf("// Update status", gateBlockStart);
    const gateBlock = source.slice(gateBlockStart, gateBlockEnd);
    expect(gateBlock).toContain('event_type: "calculation_preflight_failed"');
    expect(gateBlock).toContain("audit_events");
  });
});
