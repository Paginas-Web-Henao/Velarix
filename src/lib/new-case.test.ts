import { describe, it, expect } from "vitest";
import { buildNewCaseRow } from "./new-case";
import { interpretPipelineResponse, isEvidenceComplete, EVIDENCE_PHASES } from "./evidence-pipeline";

const base = { userId: "u", company: "  Empresa X  ", sector: "Manufactura", moneda: "USD", valuationDate: "", basePeriod: "", basisOfValue: "", valuedInterest: "", calculationArchitecture: "" };

describe("buildNewCaseRow", () => {
  it("un caso nuevo guarda expected_growth: null explícito (nunca 25) y metadata vacía como null", () => {
    const row = buildNewCaseRow(base);
    expect(row).toHaveProperty("expected_growth", null);
    expect(Object.values(row)).not.toContain(25);
    expect(row).toMatchObject({ valuation_date: null, base_period: null, basis_of_value: null, valued_interest: null, calculation_architecture: null });
    expect(row.company_name).toBe("Empresa X");
    expect(row.status).toBe("creado");
  });

  it("la metadata escrita se persiste tal cual (recortada); espacios = null", () => {
    const row = buildNewCaseRow({ ...base, valuationDate: "2024-12-31", basePeriod: " FY2024 ", basisOfValue: "   " });
    expect(row.valuation_date).toBe("2024-12-31");
    expect(row.base_period).toBe("FY2024");
    expect(row.basis_of_value).toBeNull();
  });
});

describe("evidence-pipeline (frontend)", () => {
  it("solo validación aprobada / con advertencias cierran el flujo de Evidence", () => {
    expect(isEvidenceComplete("validacion_aprobada")).toBe(true);
    expect(isEvidenceComplete("validacion_con_advertencias")).toBe(true);
    for (const s of ["validacion_bloqueada", "calculo_completo", "informe_generado", "documentos_cargados", null]) expect(isEvidenceComplete(s)).toBe(false);
    expect(EVIDENCE_PHASES.map((f) => f.nombre)).toEqual(["Documentos", "Extracción", "Cuentas", "Validación"]);
  });

  it("cualquier no-2xx o success:false es fallo con su mensaje", () => {
    expect(interpretPipelineResponse(true, 200, { success: true })).toEqual({ ok: true });
    expect(interpretPipelineResponse(false, 409, { success: false, error: { code: "CASE_ALREADY_CALCULATED", message: "m" } })).toEqual({ ok: false, code: "CASE_ALREADY_CALCULATED", message: "m" });
    expect(interpretPipelineResponse(true, 200, { success: false, error: { message: "x" } }).ok).toBe(false);
    expect(interpretPipelineResponse(false, 502, null)).toMatchObject({ ok: false, message: "El pipeline respondió HTTP 502." });
  });
});
