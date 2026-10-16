import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluate, summarizeEvidenceValidation, type ValidationResult } from "./validation-rules";

const ok = (code: string, severity: ValidationResult["severity"] = "media"): ValidationResult => ({ code, severity, description: code, passed: true, detail: null, blocking: false });
const fail = (code: string, severity: ValidationResult["severity"], blocking = false): ValidationResult => ({ code, severity, description: code, passed: false, detail: "x", blocking });

describe("J. Evidence validation ≠ calculation readiness", () => {
  it("Evidence puede quedar aprobada sin afirmar que el caso está listo para calcular", () => {
    const s = summarizeEvidenceValidation([ok("DOC_001", "critica"), fail("MAP_003", "informativa"), fail("IS_006", "informativa")]);
    expect(s).toMatchObject({ semaphore: "verde", validationStatus: "aprobado", analysisStatus: "validacion_aprobada", scope: "evidence_validation", calculationReadiness: "NOT_EVALUATED" });
    expect(s.label).toBe("✓ Evidence validada");
    expect(s.label).not.toMatch(/\bListo\b/);
  });

  it("advertencias y bloqueos conservan la semántica previa (amarillo / rojo) con etiquetas de Evidence", () => {
    expect(summarizeEvidenceValidation([fail("MAP_004", "media")])).toMatchObject({ semaphore: "amarillo", analysisStatus: "validacion_con_advertencias", label: "⚠ Evidence validada con advertencias", warningCount: 1 });
    expect(summarizeEvidenceValidation([fail("DOC_003", "critica", true)])).toMatchObject({ semaphore: "rojo", analysisStatus: "validacion_bloqueada", label: "✗ Evidence bloqueada", criticalCount: 1 });
  });

  it("ninguna etiqueta dice simplemente 'Listo'", () => {
    for (const r of [[], [fail("MAP_004", "media")], [fail("DOC_003", "critica", true)]]) {
      expect(summarizeEvidenceValidation(r).label).not.toMatch(/Listo/);
    }
  });

  it("el handler de validate-analysis usa el resumen y declara el alcance y la preparación NO evaluada", () => {
    const src = readFileSync(join(__dirname, "../validate-analysis/index.ts"), "utf8");
    expect(src).toContain("summarizeEvidenceValidation(results)");
    expect(src).toContain("calculation_readiness: summary.calculationReadiness");
    expect(src).not.toMatch(/"✓ Listo"|Listo con advertencias/);
  });
});

describe("K. IS_006 no promete un default ni un fallback", () => {
  const is006 = evaluate([], [{ original_filename: "x.xlsx", file_size_bytes: 10, processing_status: "completado", doc_type_declared: "estados_financieros" }], ["2024"], "2024").find((r) => r.code === "IS_006")!;

  it("sin impuestos homologados: falla y pide revisión/Judgment, sin tasa de referencia", () => {
    expect(is006.passed).toBe(false);
    expect(is006.detail).toMatch(/Judgment/);
    expect(is006.detail).not.toMatch(/tasa corporativa|de referencia|se usará|default|fallback/i);
  });

  it("estados_financieros cuenta como documento con estado de resultados (MAP_001 media si faltan ingresos)", () => {
    const docs = [{ original_filename: "x.xlsx", file_size_bytes: 10, processing_status: "completado", doc_type_declared: "estados_financieros" }];
    expect(evaluate([], docs, ["2024"], "2024").find((r) => r.code === "MAP_001")).toMatchObject({ severity: "media" });
  });
});

describe("N/O/P. mensajes de Evidence sin promesas de cálculo", () => {
  const docs = [{ original_filename: "x.xlsx", file_size_bytes: 10, processing_status: "completado", doc_type_declared: "estados_financieros" }];
  const byCode = (code: string) => evaluate([], docs, ["2024"], "2024").find((r) => r.code === code)!;

  it("N. MAP_002 no promete cero", () => {
    expect(byCode("MAP_002").detail).not.toMatch(/valor cero|se usará/i);
    expect(byCode("MAP_002").detail).toMatch(/revisión/);
  });
  it("O. MAP_005 no afirma una suma de componentes inexistente", () => {
    expect(byCode("MAP_005").detail).not.toMatch(/se calculará/i);
    expect(byCode("MAP_005").detail).toMatch(/no se deriva por suma/);
  });
  it("P. PER_002 no promete cómo se proyectará", () => {
    expect(byCode("PER_002").detail).not.toMatch(/Proyecciones basadas/);
    expect(byCode("PER_002").detail).toMatch(/no se evalúa en esta etapa/);
  });
  it("severidades y bloqueo no cambian", () => {
    expect([byCode("MAP_002"), byCode("MAP_005"), byCode("PER_002")].map((r) => [r.severity, r.blocking])).toEqual([["media", false], ["informativa", false], ["informativa", false]]);
  });
});
