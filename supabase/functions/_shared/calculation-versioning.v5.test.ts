// Bloque 3B — Tests-first del versioning v5, distinguiendo
// assumptions_source "resolved_case_input" vs "legacy_canonical_default",
// docs/velarix-v5/05-financial-engine-audit.md v1.3 §7. Llama a la
// función REAL de producción (`buildCalculationVersionInfo`) — nunca
// reimplementa su lógica. No se modifica calculation-versioning.ts en
// este bloque.

import { describe, it, expect } from "vitest";
import { buildCalculationVersionInfo } from "./calculation-versioning";
import { CANONICAL_METHODOLOGY } from "./financial-methodology";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";
import type { ResolvedCalculationAssumptions } from "./resolved-calculation-assumptions";

function buildVersionV5Target(resolvedAssumptions?: ResolvedCalculationAssumptions) {
  return buildCalculationVersionInfo({
    inputFingerprint: "abc123",
    provenanceStatus: "complete",
    resolvedAssumptions,
  });
}

// Bloque 3C.6 — corrección: las dos aserciones "HOY" originales
// documentaban el gap real de 05 v1.3 §7 (versioning ignoraba
// resolvedAssumptions) — premisa inválida una vez implementado. Se
// retiran; reemplazadas por una verificación LEGACY genuina (sin la
// clave `resolvedAssumptions` en absoluto), que confirma que el
// versioning histórico no cambió de comportamiento.
describe("Versioning — LEGACY (sin resolvedAssumptions, verde — compatibilidad histórica)", () => {
  it("assumptions_snapshot sigue reflejando CANONICAL_METHODOLOGY (los 8 defaults globales) y assumptions_source = 'legacy_canonical_default'", () => {
    const info = buildCalculationVersionInfo({ inputFingerprint: "abc123", provenanceStatus: "complete" });
    expect(Object.keys(info.assumptions_snapshot).sort()).toEqual(Object.keys(CANONICAL_METHODOLOGY.assumptions).sort());
    expect(info.assumptions_source).toBe("legacy_canonical_default");
  });
});

describe("Versioning — V5 OBJETIVO", () => {
  it("una ejecución legacy (sin resolvedAssumptions) declara assumptions_source = 'legacy_canonical_default'", () => {
    const info = buildVersionV5Target(undefined);
    expect(info.assumptions_source).toBe("legacy_canonical_default");
  });

  it("una ejecución v5 (con resolvedAssumptions) declara assumptions_source = 'resolved_case_input'", () => {
    const info = buildVersionV5Target(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(info.assumptions_source).toBe("resolved_case_input");
  });

  it("el snapshot/resumen de supuestos usados corresponde a los valores REALMENTE resueltos de la ejecución, no a CANONICAL_METHODOLOGY", () => {
    const info = buildVersionV5Target(EXAMPLE_RESOLVED_ASSUMPTIONS);
    const serialized = JSON.stringify(info.assumptions_snapshot);
    // El terminal g resuelto (3.5%) debe aparecer reflejado; el legacy (terminalGrowthPct=3) no debe presentarse como si fuera el usado.
    expect(serialized).toContain("3.5");
    expect(info.assumptions_snapshot).not.toEqual(
      Object.fromEntries(
        Object.entries(CANONICAL_METHODOLOGY.assumptions).map(([k, a]) => [k, { value: a.value, unit: a.unit, approved: a.approved }]),
      ),
    );
  });

  it("cambiar el judgment (terminal_g resuelto) produce una identidad de versión/snapshot distinta", () => {
    const changed: ResolvedCalculationAssumptions = {
      ...EXAMPLE_RESOLVED_ASSUMPTIONS,
      terminalG: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG, value: { ...EXAMPLE_RESOLVED_ASSUMPTIONS.terminalG.value, valuePct: 4.75 } },
    };
    const info1 = buildVersionV5Target(EXAMPLE_RESOLVED_ASSUMPTIONS);
    const info2 = buildVersionV5Target(changed);
    expect(JSON.stringify(info1.assumptions_snapshot)).not.toBe(JSON.stringify(info2.assumptions_snapshot));
  });

  it("versioning no reporta los 8 defaults globales de CANONICAL_METHODOLOGY como si hubieran sido usados cuando la ejecución consumió valores resueltos", () => {
    // OJO (corregido en Bloque 3B.2): un `toContain("35")` sobre el JSON
    // serializado es frágil — `riskFreeRatePct: 4.35` (legacy) YA
    // contiene la subcadena "35", lo que haría pasar este test en verde
    // hoy por una coincidencia de texto, no porque la tasa resuelta
    // (35%) se haya usado realmente. Se reemplaza por una comparación
    // estructural directa entre el snapshot con resolvedAssumptions y el
    // snapshot puramente legacy — ambos son hoy idénticos (rojo
    // correcto), y solo dejarían de serlo cuando el snapshot realmente
    // refleje lo resuelto.
    const legacyOnly = buildCalculationVersionInfo({ inputFingerprint: "abc123", provenanceStatus: "complete" });
    const withResolved = buildVersionV5Target(EXAMPLE_RESOLVED_ASSUMPTIONS);
    expect(JSON.stringify(withResolved.assumptions_snapshot)).not.toBe(JSON.stringify(legacyOnly.assumptions_snapshot));
    expect(CANONICAL_METHODOLOGY.assumptions.taxRatePct.value).toBe(30); // el legacy global sigue intacto — no se tocó el default
  });
});
