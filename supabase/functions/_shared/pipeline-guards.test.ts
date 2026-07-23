// BL-06 (Bloque 1B-P0) — Prueba de especificación de la decisión de
// abortar el pipeline tras un fallo de `map-accounts`. Importa
// exactamente la misma función pura (`evaluateMapAccountsResult`) que
// usa `run-analysis-pipeline/index.ts`.
//
// Cobertura real vs. declarada (transparencia, mismo criterio que
// docs/velarix/bloque-1a/BL-30-evidencia-pruebas-especificacion.md):
// esta prueba demuestra el punto 1 del requisito de BL-06 ("map-accounts
// falla" produce la decisión correcta de abortar, con el código/estado
// correctos y sin exponer información sensible). Los puntos 2-3
// ("las etapas posteriores no son llamadas", "el análisis termina en
// error técnico") están garantizados por construcción en
// `run-analysis-pipeline/index.ts` — el `return` inmediato tras
// `decision.shouldAbort` es la única forma de llegar al paso de
// validación, y `evaluateMapAccountsResult` es la función que decide
// eso — pero verificar la llamada real a `fetch` de los pasos 3/4/5 en
// un escenario end-to-end requeriría ejecutar el archivo completo
// (bloqueado por Deno no instalado + imports de URL + `serve()` de nivel
// superior, igual que BL-02/03/05 en Bloque 1A). Esa verificación de
// integración queda pendiente para cuando Deno esté disponible.

import { describe, it, expect } from "vitest";
import { evaluateMapAccountsResult } from "./pipeline-guards";

describe("evaluateMapAccountsResult — BL-06", () => {
  it("1. map-accounts falla (success: false): decide abortar con error técnico", () => {
    const decision = evaluateMapAccountsResult({
      success: false,
      error: { message: "Timeout llamando a Anthropic" },
    });
    expect(decision.shouldAbort).toBe(true);
    expect(decision.errorCode).toBe("MAP_ACCOUNTS_FAILED");
    expect(decision.analysisStatus).toBe("error_tecnico");
  });

  it("3. el mensaje de error no expone información sensible (solo el mensaje ya provisto por map-accounts)", () => {
    const decision = evaluateMapAccountsResult({
      success: false,
      error: { message: "Error en homologación" },
    });
    expect(decision.errorMessage).toBe("Error en homologación");
    // No debe incluir stack traces, tokens, ni URLs internas — solo se
    // propaga el mensaje ya sanitizado que devuelve map-accounts.
    expect(decision.errorMessage).not.toMatch(/https?:\/\//);
    expect(decision.errorMessage).not.toMatch(/key|token|secret/i);
  });

  it("cuentas críticas faltantes (has_blocking_issues): también aborta, con estado validacion_bloqueada", () => {
    const decision = evaluateMapAccountsResult({
      success: true,
      data: { total_mapped: 4, has_blocking_issues: true, missing_critical: ["revenue", "equity"] },
    });
    expect(decision.shouldAbort).toBe(true);
    expect(decision.errorCode).toBe("MAP_ACCOUNTS_BLOCKING");
    expect(decision.analysisStatus).toBe("validacion_bloqueada");
    expect(decision.errorMessage).toContain("revenue");
    expect(decision.errorMessage).toContain("equity");
  });

  it("map-accounts exitoso sin problemas bloqueantes: no aborta, el pipeline continúa", () => {
    const decision = evaluateMapAccountsResult({
      success: true,
      data: { total_mapped: 12, has_blocking_issues: false },
    });
    expect(decision.shouldAbort).toBe(false);
  });

  it("sin mensaje de error explícito: usa un mensaje genérico, no undefined ni vacío", () => {
    const decision = evaluateMapAccountsResult({ success: false });
    expect(decision.errorMessage).toBeTruthy();
  });

  it("missing_critical ausente en un has_blocking_issues: no revienta, produce un mensaje válido", () => {
    const decision = evaluateMapAccountsResult({
      success: true,
      data: { has_blocking_issues: true },
    });
    expect(decision.shouldAbort).toBe(true);
    expect(decision.errorMessage).toBe("Cuentas críticas faltantes: ");
  });
});
