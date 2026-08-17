// Minimum Expediente Checkpoint — pruebas de especificación del
// evaluador puro (los 4 checks de §0.1, nada más).

import { describe, it, expect } from "vitest";
import { evaluateMinimumExpedienteCheckpoint } from "./minimum-expediente-checkpoint";

describe("evaluateMinimumExpedienteCheckpoint", () => {
  it("E1. todo presente -> PASS", () => {
    const r = evaluateMinimumExpedienteCheckpoint({
      companyName: "Empresa Demo S.A.S.",
      sector: "Servicios empresariales",
      materialAccountsCount: 1,
      ambiguitiesCount: 1,
      treatedAmbiguitiesCount: 1,
    });
    expect(r.passed).toBe(true);
    expect(r.checks).toEqual({ context: true, material_account: true, ambiguity: true, treatment: true });
    expect(r.missing).toEqual([]);
  });

  it("E2. company_name o sector vacío -> FAIL context", () => {
    const r1 = evaluateMinimumExpedienteCheckpoint({
      companyName: "", sector: "Servicios empresariales",
      materialAccountsCount: 1, ambiguitiesCount: 1, treatedAmbiguitiesCount: 1,
    });
    expect(r1.passed).toBe(false);
    expect(r1.checks.context).toBe(false);
    expect(r1.missing).toContain("context");

    const r2 = evaluateMinimumExpedienteCheckpoint({
      companyName: "Empresa Demo S.A.S.", sector: null,
      materialAccountsCount: 1, ambiguitiesCount: 1, treatedAmbiguitiesCount: 1,
    });
    expect(r2.passed).toBe(false);
    expect(r2.checks.context).toBe(false);
  });

  it("E3. 0 account_notes -> FAIL material_account", () => {
    const r = evaluateMinimumExpedienteCheckpoint({
      companyName: "Empresa Demo S.A.S.", sector: "Servicios empresariales",
      materialAccountsCount: 0, ambiguitiesCount: 1, treatedAmbiguitiesCount: 1,
    });
    expect(r.passed).toBe(false);
    expect(r.checks.material_account).toBe(false);
    expect(r.missing).toContain("material_account");
  });

  it("E4. 0 expedient_questions -> FAIL ambiguity", () => {
    const r = evaluateMinimumExpedienteCheckpoint({
      companyName: "Empresa Demo S.A.S.", sector: "Servicios empresariales",
      materialAccountsCount: 1, ambiguitiesCount: 0, treatedAmbiguitiesCount: 0,
    });
    expect(r.passed).toBe(false);
    expect(r.checks.ambiguity).toBe(false);
    expect(r.missing).toContain("ambiguity");
  });

  it("E5. pregunta existe pero 0 answers -> FAIL treatment", () => {
    const r = evaluateMinimumExpedienteCheckpoint({
      companyName: "Empresa Demo S.A.S.", sector: "Servicios empresariales",
      materialAccountsCount: 1, ambiguitiesCount: 1, treatedAmbiguitiesCount: 0,
    });
    expect(r.passed).toBe(false);
    expect(r.checks.treatment).toBe(false);
    expect(r.missing).toEqual(["treatment"]);
  });

  it("E6. varias preguntas, una tiene respuesta -> PASS treatment", () => {
    const r = evaluateMinimumExpedienteCheckpoint({
      companyName: "Empresa Demo S.A.S.", sector: "Servicios empresariales",
      materialAccountsCount: 2, ambiguitiesCount: 5, treatedAmbiguitiesCount: 1,
    });
    expect(r.checks.ambiguity).toBe(true);
    expect(r.checks.treatment).toBe(true);
    expect(r.passed).toBe(true);
  });

  it("E7. conteos >1 en todo -> comportamiento estable, no exige unanimidad", () => {
    const r = evaluateMinimumExpedienteCheckpoint({
      companyName: "Empresa Demo S.A.S.", sector: "Servicios empresariales",
      materialAccountsCount: 12, ambiguitiesCount: 8, treatedAmbiguitiesCount: 3,
    });
    expect(r.passed).toBe(true);
    expect(r.checks).toEqual({ context: true, material_account: true, ambiguity: true, treatment: true });
  });

  it("E8. strings solo whitespace en contexto -> FAIL context", () => {
    const r = evaluateMinimumExpedienteCheckpoint({
      companyName: "   ", sector: "\t\n",
      materialAccountsCount: 1, ambiguitiesCount: 1, treatedAmbiguitiesCount: 1,
    });
    expect(r.passed).toBe(false);
    expect(r.checks.context).toBe(false);
    expect(r.missing).toContain("context");
  });
});
