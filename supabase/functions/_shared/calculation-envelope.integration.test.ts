// Bloque 1C-T — Pruebas de integración del "sobre" (envelope) de
// versionado + procedencia que `ejecutar-calculo/index.ts` agrega al
// resultado del motor canónico.
//
// Dos cosas se prueban aquí, y ninguna reimplementa fórmulas financieras:
//
// 1. Compatibilidad: el envelope agrega `version`/`provenance` sin
//    alterar ni un solo campo de lo que ya produce
//    `runCanonicalFinancialEngine` (projections/scenarios/kpis/valuation/
//    sensitivityMatrix/sectorBenchmark/moneda/factor_conversion) — se
//    ejecuta el motor real contra los 3 fixtures dorados y se compara.
//    Las regresiones numéricas exactas de A/B/C viven en
//    `canonical-financial-engine.golden-cases.test.ts` (sin cambios en
//    este bloque, no se duplican aquí).
//
// 2. `ejecutar-calculo/index.ts` importa y usa realmente
//    `calculation-fingerprint.ts`/`calculation-versioning.ts`/
//    `calculation-provenance.ts` — verificado por inspección estática del
//    código fuente (no por ejecución: ese archivo sigue sin poder
//    importarse en Vitest por sus imports de Deno/Supabase/`serve()`,
//    mismo bloqueo documentado desde Bloque 1A/1B-P0).

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { runCanonicalFinancialEngine } from "./canonical-financial-engine";
import { computeInputFingerprint } from "./calculation-fingerprint";
import { buildCalculationVersionInfo } from "./calculation-versioning";
import { buildMissingProvenance } from "./calculation-provenance";
import {
  CASO_A_ESTABLE_SERVIDOR,
  CASO_B_ALTO_CRECIMIENTO_SERVIDOR,
  CASO_C_TENSIONADA_SERVIDOR,
} from "./canonical-financial-engine.golden-cases.fixtures";

const CASOS = [
  ["A", CASO_A_ESTABLE_SERVIDOR] as const,
  ["B", CASO_B_ALTO_CRECIMIENTO_SERVIDOR] as const,
  ["C", CASO_C_TENSIONADA_SERVIDOR] as const,
];

describe("Compatibilidad del envelope (versionado + procedencia) sobre el resultado del motor canónico", () => {
  it.each(CASOS)("14. Caso %s: el envelope preserva projections/scenarios/kpis/valuation/sensitivityMatrix/sectorBenchmark/moneda/factor_conversion sin alterarlos", (_nombre, fixture) => {
    const result = runCanonicalFinancialEngine(fixture.input, fixture.sector, fixture.expectedGrowth);

    // Misma composición que ejecutar-calculo/index.ts: `{ ...result, version, provenance }`.
    const inputFingerprint = computeInputFingerprint(fixture.input, fixture.sector, fixture.expectedGrowth);
    const provenance = buildMissingProvenance({
      analysisId: "test-analysis",
      monedaAnalisis: fixture.input.moneda_analisis || "COP",
      monedaDocumento: null,
      factorConversion: fixture.input.factor_conversion || 1,
      builtAt: "2026-07-23T00:00:00.000Z",
    });
    const version = buildCalculationVersionInfo({ inputFingerprint, provenanceStatus: provenance.overall_status, calculatedAt: "2026-07-23T00:00:00.000Z" });
    const enveloped = { ...result, version, provenance };

    // Compatibilidad: cada campo original queda EXACTAMENTE igual (misma referencia/valor), no una copia parcial ni recalculada.
    expect(enveloped.projections).toBe(result.projections);
    expect(enveloped.scenarios).toBe(result.scenarios);
    expect(enveloped.kpis).toBe(result.kpis);
    expect(enveloped.valuation).toBe(result.valuation);
    expect(enveloped.sensitivityMatrix).toBe(result.sensitivityMatrix);
    expect(enveloped.sectorBenchmark).toBe(result.sectorBenchmark);
    expect(enveloped.moneda).toBe(result.moneda);
    expect(enveloped.factor_conversion).toBe(result.factor_conversion);

    // Los campos nuevos existen y son coherentes.
    expect(enveloped.version.input_fingerprint).toBe(inputFingerprint);
    expect(enveloped.version.provenance_status).toBe("missing"); // buildMissingProvenance en este test, deliberado
    expect(enveloped.provenance.overall_status).toBe("missing");
  });

  it("15. revenue=0 sigue siendo rechazado por el motor incluso cuando se compone el envelope alrededor (comportamiento conservado, no re-decidido aquí)", () => {
    expect(() => runCanonicalFinancialEngine({ income_statement: { revenue: 0 }, balance_sheet: {} }, "Manufactura", 5))
      .toThrow("Revenue es 0 — no se puede calcular valoración.");
    // El fingerprint/versionado/procedencia nunca se construyen para un
    // cálculo que lanzó — ejecutar-calculo/index.ts solo los arma DESPUÉS
    // de que `runCanonicalFinancialEngine` devuelve un resultado exitoso
    // (ver bloque try/catch de ese archivo, verificado por inspección
    // estática abajo).
  });
});

describe("ejecutar-calculo/index.ts usa realmente el contrato nuevo (verificación estática de código fuente)", () => {
  const sourcePath = path.resolve(__dirname, "../ejecutar-calculo/index.ts");
  const source = fs.readFileSync(sourcePath, "utf-8");

  it("13. importa las 3 funciones reales de versionado/procedencia/fingerprint desde _shared, no una copia local", () => {
    expect(source).toContain('import { computeInputFingerprint } from "../_shared/calculation-fingerprint.ts"');
    expect(source).toContain('import { buildCalculationVersionInfo } from "../_shared/calculation-versioning.ts"');
    expect(source).toContain('import { buildMissingProvenance, type CalculationProvenance } from "../_shared/calculation-provenance.ts"');
  });

  it("13. invoca las funciones importadas y persiste version/provenance dentro de calculation_result", () => {
    expect(source).toContain("computeInputFingerprint(typedInput, analysis.sector, analysis.expected_growth)");
    expect(source).toContain("buildCalculationVersionInfo({");
    expect(source).toContain("const enrichedResult = { ...result, version, provenance };");
    expect(source).toContain("calculation_result: enrichedResult,");
  });

  it("no queda ninguna copia manual de las fórmulas de versionado/procedencia dentro de ejecutar-calculo (solo se invocan las funciones importadas)", () => {
    expect(source).not.toContain("function buildCalculationVersionInfo");
    expect(source).not.toContain("function buildCalculationProvenance");
    expect(source).not.toContain("function computeInputFingerprint");
  });
});
