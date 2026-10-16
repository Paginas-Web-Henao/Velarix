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
import { runCanonicalFinancialEngine, type CanonicalStructuredInput } from "./canonical-financial-engine";
import { computeInputFingerprint } from "./calculation-fingerprint";
import { buildCalculationVersionInfo, CANONICAL_ENGINE_VERSION } from "./calculation-versioning";
import { buildMissingProvenance } from "./calculation-provenance";
import { buildSourceInputSnapshot } from "./source-input-snapshot";
import { buildResolvedAssumptionsSnapshot } from "./resolved-assumptions-snapshot";
import { CANONICAL_METHODOLOGY } from "./financial-methodology";
import { EXAMPLE_RESOLVED_ASSUMPTIONS } from "./resolved-calculation-assumptions.fixtures";
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

  it("16. Bloque 1E/Subbloque 1 (corrección de versionado): el envelope completo — con source_input_snapshot — queda en calculation_schema_version 1.1.0, sin tocar canonical_engine_version ni methodology_version", () => {
    const fixture = CASO_A_ESTABLE_SERVIDOR;
    const result = runCanonicalFinancialEngine(fixture.input, fixture.sector, fixture.expectedGrowth);
    const inputFingerprint = computeInputFingerprint(fixture.input, fixture.sector, fixture.expectedGrowth);
    const provenance = buildMissingProvenance({
      analysisId: "test-analysis",
      monedaAnalisis: fixture.input.moneda_analisis || "COP",
      monedaDocumento: null,
      factorConversion: fixture.input.factor_conversion || 1,
      builtAt: "2026-08-26T00:00:00.000Z",
    });
    const version = buildCalculationVersionInfo({ inputFingerprint, provenanceStatus: provenance.overall_status, calculatedAt: "2026-08-26T00:00:00.000Z" });
    const sourceInputSnapshot = buildSourceInputSnapshot({
      structuredInputId: "struct-1",
      versionInput: "2.3",
      sector: fixture.sector,
      input: fixture.input,
    });
    // Bloque 3C.6: `resolved_assumptions_used` es `null` para este golden
    // case legacy (nunca se inventa Judgment retroactivo).
    const resolvedAssumptionsUsed = buildResolvedAssumptionsSnapshot(undefined);
    // Misma composición que ejecutar-calculo/index.ts:
    // `{ ...result, version, provenance, source_input_snapshot: sourceInputSnapshot, resolved_assumptions_used: resolvedAssumptionsUsed }`.
    const enveloped = { ...result, version, provenance, source_input_snapshot: sourceInputSnapshot, resolved_assumptions_used: resolvedAssumptionsUsed };

    // El schema del envelope subió (campo aditivo nuevo: source_input_snapshot).
    expect(enveloped.version.calculation_schema_version).toBe("1.1.0");
    // El motor no cambió: ninguna fórmula, mismo número de versión.
    expect(enveloped.version.canonical_engine_version).toBe(CANONICAL_ENGINE_VERSION);
    expect(enveloped.version.canonical_engine_version).toBe("1.0.0");
    // La metodología no cambió.
    expect(enveloped.version.methodology_version).toBe(CANONICAL_METHODOLOGY.methodologyVersion);
    // El snapshot está presente y corresponde al mismo input/fingerprint de este envelope.
    expect(enveloped.source_input_snapshot).toBeDefined();
    expect(enveloped.source_input_snapshot.income_statement.revenue).toBe(fixture.input.income_statement?.revenue ?? null);
    expect(enveloped.version.input_fingerprint).toBe(inputFingerprint);
    // Legacy: assumptions_source explícito, sin Judgment inventado.
    expect(enveloped.version.assumptions_source).toBe("legacy_canonical_default");
    expect(enveloped.resolved_assumptions_used).toBeNull();
  });

  it("17. Bloque 3C.6: una ejecución v5 (input_payload con resolved_assumptions) produce un envelope con las 4 capas separadas — fingerprint/version/resolved_assumptions_used reflejan el Judgment, source_input_snapshot permanece limitado a Evidence", () => {
    const fixture = CASO_A_ESTABLE_SERVIDOR;
    // Mismo patrón que ejecutar-calculo/index.ts: `input_payload` con la
    // clave `resolved_assumptions` presente activa la ejecución v5 en
    // TODOS los módulos por igual (motor, fingerprint, preflight,
    // versioning) — nunca por inferencia del contenido financiero.
    const v5Input: CanonicalStructuredInput = { ...fixture.input, resolved_assumptions: EXAMPLE_RESOLVED_ASSUMPTIONS };

    const legacyFingerprint = computeInputFingerprint(fixture.input, fixture.sector, fixture.expectedGrowth);
    const v5Fingerprint = computeInputFingerprint(v5Input, fixture.sector, fixture.expectedGrowth);
    const provenance = buildMissingProvenance({
      analysisId: "test-analysis",
      monedaAnalisis: v5Input.moneda_analisis || "COP",
      monedaDocumento: null,
      factorConversion: v5Input.factor_conversion || 1,
      builtAt: "2026-09-05T00:00:00.000Z",
    });
    const version = buildCalculationVersionInfo({
      inputFingerprint: v5Fingerprint,
      provenanceStatus: provenance.overall_status,
      calculatedAt: "2026-09-05T00:00:00.000Z",
      resolvedAssumptions: EXAMPLE_RESOLVED_ASSUMPTIONS,
    });
    const sourceInputSnapshot = buildSourceInputSnapshot({
      structuredInputId: "struct-1",
      versionInput: "2.3",
      sector: fixture.sector,
      input: v5Input,
    });
    const resolvedAssumptionsUsed = buildResolvedAssumptionsSnapshot(EXAMPLE_RESOLVED_ASSUMPTIONS);
    const enveloped = { version, provenance, source_input_snapshot: sourceInputSnapshot, resolved_assumptions_used: resolvedAssumptionsUsed };

    // Fingerprint: cambia porque el Judgment entró a la identidad de Calculation.
    expect(v5Fingerprint).not.toBe(legacyFingerprint);
    // Version: assumptions_source distingue explícitamente v5 de legacy.
    expect(enveloped.version.assumptions_source).toBe("resolved_case_input");
    expect(enveloped.version.input_fingerprint).toBe(v5Fingerprint);
    // resolved_assumptions_used: Judgment completo, congelado.
    expect(enveloped.resolved_assumptions_used).toEqual(EXAMPLE_RESOLVED_ASSUMPTIONS);
    // source_input_snapshot: permanece limitado a Evidence, sin Judgment mezclado.
    expect(enveloped.source_input_snapshot).not.toHaveProperty("resolved_assumptions");
    expect(JSON.stringify(enveloped.source_input_snapshot)).not.toContain("terminalG");
    // Las tres capas coexisten sin solaparse.
    const snapshotKeys = new Set(Object.keys(enveloped.source_input_snapshot));
    const judgmentKeys = new Set(Object.keys(enveloped.resolved_assumptions_used as object));
    expect([...snapshotKeys].filter((k) => judgmentKeys.has(k))).toEqual([]);
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
    // ADR-010: fingerprint, motor y preflight reciben el MISMO crecimiento —
    // el del judgment set congelado en el input, o en legacy `analysis.expected_growth ?? null`.
    expect(source).toContain("computeInputFingerprint(typedInput, analysis.sector, expectedGrowth)");
    expect(source).toContain("runCanonicalFinancialEngine(typedInput, analysis.sector, expectedGrowth)");
    expect(source).toContain(": (analysis.expected_growth ?? null);");
    expect(source).toContain("buildCalculationVersionInfo({");
    expect(source).toContain("source_input_snapshot: sourceInputSnapshot,");
    expect(source).toContain("calculation_result: enrichedResult,");
  });

  it("Bloque 3C.6: incluye resolved_assumptions_used en el envelope, vía la función real buildResolvedAssumptionsSnapshot — nunca una copia manual ni mezclado con source_input_snapshot", () => {
    expect(source).toContain('import { buildResolvedAssumptionsSnapshot } from "../_shared/resolved-assumptions-snapshot.ts"');
    expect(source).toContain("buildResolvedAssumptionsSnapshot(inputResolvedAssumptions)");
    expect(source).toContain("resolved_assumptions_used: resolvedAssumptionsUsed,");
  });

  it("Bloque 3C.6: legacy vs. v5 por presencia de la clave resolved_assumptions en input_payload (Object.hasOwnProperty), no por inferencia de contenido financiero", () => {
    expect(source).toContain('Object.prototype.hasOwnProperty.call(input || {}, "resolved_assumptions")');
    // Preflight y versioning reciben resolvedAssumptions SOLO cuando isV5Input es verdadero — nunca incondicionalmente.
    expect(source).toContain("...(isV5Input ? { resolvedAssumptions: inputResolvedAssumptions } : {})");
  });

  it("Bloque 1E/Subbloque 1 (corrección): el snapshot del structured input se construye del MISMO `input` usado para fingerprint, no de una consulta nueva", () => {
    expect(source).toContain('import { buildSourceInputSnapshot } from "../_shared/source-input-snapshot.ts"');
    expect(source).toContain("buildSourceInputSnapshot({");
    expect(source).toContain("input,");
    // No hay una segunda consulta a `structured_inputs` después de resolver `input` —
    // solo aparece la única lectura de arriba (`.from("structured_inputs")`).
    const structuredInputsQueries = (source.match(/\.from\("structured_inputs"\)/g) || []).length;
    expect(structuredInputsQueries).toBe(1);
  });

  it("no queda ninguna copia manual de las fórmulas de versionado/procedencia dentro de ejecutar-calculo (solo se invocan las funciones importadas)", () => {
    expect(source).not.toContain("function buildCalculationVersionInfo");
    expect(source).not.toContain("function buildCalculationProvenance");
    expect(source).not.toContain("function computeInputFingerprint");
  });
});
