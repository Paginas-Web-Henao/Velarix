import { describe, it, expect } from "vitest";
import {
  EVIDENCE_FINAL_STATUSES,
  evaluateEvidenceReprocessing,
  hasPersistedCalculation,
  resolveEvidenceFinalStatus,
  statusAfterUpload,
  uploadWarning,
} from "./evidence-pipeline-guards";

describe("evidence-pipeline-guards", () => {
  it("el estado final lo fija la validación: aprobado / aprobado_con_advertencias; cualquier otro no es un final", () => {
    expect(resolveEvidenceFinalStatus("aprobado")).toBe("validacion_aprobada");
    expect(resolveEvidenceFinalStatus("aprobado_con_advertencias")).toBe("validacion_con_advertencias");
    for (const v of ["bloqueado", "", null, undefined, "verde"]) expect(resolveEvidenceFinalStatus(v)).toBeNull();
    expect([...EVIDENCE_FINAL_STATUSES]).toEqual(["validacion_aprobada", "validacion_con_advertencias"]);
  });

  it("un calculation_result persistido bloquea el reprocesamiento (409 CASE_ALREADY_CALCULATED)", () => {
    const d = evaluateEvidenceReprocessing({ calculation_result: { valuation: {} } });
    expect(d).toMatchObject({ allowed: false, httpStatus: 409, code: "CASE_ALREADY_CALCULATED" });
    expect(evaluateEvidenceReprocessing({ calculation_result: null })).toEqual({ allowed: true });
    expect(evaluateEvidenceReprocessing({})).toEqual({ allowed: true });
    expect(evaluateEvidenceReprocessing(null)).toEqual({ allowed: true });
    expect(hasPersistedCalculation({ calculation_result: {} })).toBe(true);
  });

  it("subir un documento no cambia el estado de un caso calculado; en uno no calculado, sí", () => {
    expect(statusAfterUpload({ calculation_result: { x: 1 } })).toBeNull();
    expect(statusAfterUpload({ calculation_result: null })).toBe("documentos_cargados");
    expect(uploadWarning({ calculation_result: { x: 1 } })).toMatch(/NO forma parte de ese cálculo/);
    expect(uploadWarning({ calculation_result: null })).toBeNull();
  });
});
