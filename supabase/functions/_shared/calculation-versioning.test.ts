// Bloque 1C-T — Pruebas del versionado del cálculo. Importa el módulo
// real, nunca reimplementa los valores de CANONICAL_METHODOLOGY dentro
// de la prueba.

import { describe, it, expect } from "vitest";
import {
  buildCalculationVersionInfo,
  CANONICAL_ENGINE_VERSION,
  CALCULATION_SCHEMA_VERSION,
} from "./calculation-versioning";
import { CANONICAL_METHODOLOGY } from "./financial-methodology";

describe("buildCalculationVersionInfo", () => {
  it("5. methodology_version proviene de CANONICAL_METHODOLOGY.methodologyVersion, no de un valor duplicado", () => {
    const info = buildCalculationVersionInfo({ inputFingerprint: "abc123", provenanceStatus: "complete" });
    expect(info.methodology_version).toBe(CANONICAL_METHODOLOGY.methodologyVersion);
  });

  it("6. canonical_engine_version está presente y no es un timestamp ni un número aleatorio", () => {
    const info = buildCalculationVersionInfo({ inputFingerprint: "abc123", provenanceStatus: "complete" });
    expect(info.canonical_engine_version).toBe(CANONICAL_ENGINE_VERSION);
    expect(info.canonical_engine_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(info.calculation_schema_version).toBe(CALCULATION_SCHEMA_VERSION);
  });

  it("7. assumptions_snapshot corresponde exactamente a los 8 supuestos realmente usados por CANONICAL_METHODOLOGY", () => {
    const info = buildCalculationVersionInfo({ inputFingerprint: "abc123", provenanceStatus: "complete" });
    const expectedKeys = Object.keys(CANONICAL_METHODOLOGY.assumptions).sort();
    expect(Object.keys(info.assumptions_snapshot).sort()).toEqual(expectedKeys);

    for (const [key, assumption] of Object.entries(CANONICAL_METHODOLOGY.assumptions)) {
      expect(info.assumptions_snapshot[key]).toEqual({
        value: assumption.value,
        unit: assumption.unit,
        approved: assumption.approved,
      });
    }
  });

  it("propaga input_fingerprint y provenance_status recibidos sin alterarlos", () => {
    const info = buildCalculationVersionInfo({ inputFingerprint: "deadbeef00000001", provenanceStatus: "partial" });
    expect(info.input_fingerprint).toBe("deadbeef00000001");
    expect(info.provenance_status).toBe("partial");
  });

  it("calculated_at usa el valor explícito recibido cuando se provee (determinístico para pruebas), y una fecha ISO válida si no", () => {
    const info = buildCalculationVersionInfo({ inputFingerprint: "x", provenanceStatus: "missing", calculatedAt: "2026-01-01T00:00:00.000Z" });
    expect(info.calculated_at).toBe("2026-01-01T00:00:00.000Z");

    const info2 = buildCalculationVersionInfo({ inputFingerprint: "x", provenanceStatus: "missing" });
    expect(() => new Date(info2.calculated_at).toISOString()).not.toThrow();
  });

  it("12. no incluye ningún secreto, token o variable de entorno — el módulo no importa Deno/Supabase/env", () => {
    const info = buildCalculationVersionInfo({ inputFingerprint: "x", provenanceStatus: "complete" });
    const serialized = JSON.stringify(info).toLowerCase();
    for (const forbidden of ["service_role", "bearer ", "authorization", "secret", "password", "apikey", "supabase.co"]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(serialized).not.toMatch(/eyj[a-z0-9_-]+\.eyj[a-z0-9_-]+\./); // patrón de JWT
  });
});
