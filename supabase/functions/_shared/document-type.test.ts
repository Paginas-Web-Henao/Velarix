import { describe, it, expect } from "vitest";
import { resolveEffectiveDocType } from "./document-type";

const none = { tieneEstadoResultados: false, tieneBalanceGeneral: false, tieneAmbos: false };
const all = { tieneEstadoResultados: true, tieneBalanceGeneral: true, tieneAmbos: true };

describe("resolveEffectiveDocType — la clasificación determinística del libro manda", () => {
  it("A. libro con balance + resultados + flujo de caja → estados_financieros (determinístico)", () => {
    expect(resolveEffectiveDocType({ workbookStatements: ["balance_sheet", "income_statement", "cash_flow"], aiType: null, declared: "estado_resultados", content: all }))
      .toEqual({ docType: "estados_financieros", origin: "DETERMINISTIC_WORKBOOK" });
  });

  it("B. una clasificación IA parcial (solo vio el balance) no degrada la clasificación multi-estado", () => {
    for (const aiType of ["balance_general", "estado_resultados", "mixto"]) {
      expect(resolveEffectiveDocType({ workbookStatements: ["balance_sheet", "cash_flow"], aiType, declared: "balance_general", content: all }).docType).toBe("estados_financieros");
    }
  });

  it("C. archivo legacy de solo balance sigue siendo balance_general", () => {
    expect(resolveEffectiveDocType({ workbookStatements: null, aiType: "balance_general", declared: "balance_general", content: { ...none, tieneBalanceGeneral: true } }))
      .toEqual({ docType: "balance_general", origin: "AI_CLASSIFIER" });
  });

  it("D. archivo legacy de solo resultados sigue siendo estado_resultados", () => {
    expect(resolveEffectiveDocType({ workbookStatements: null, aiType: null, declared: "estado_resultados", content: { ...none, tieneEstadoResultados: true } }))
      .toEqual({ docType: "estado_resultados", origin: "DECLARED" });
  });

  it("un solo estado principal no basta para estados_financieros; se conserva la regla previa (IA → declarado → contenido)", () => {
    expect(resolveEffectiveDocType({ workbookStatements: ["balance_sheet"], aiType: "balance_general", declared: null, content: none }).docType).toBe("balance_general");
    expect(resolveEffectiveDocType({ workbookStatements: [], aiType: "no_reconocible", declared: null, content: all })).toEqual({ docType: "mixto", origin: "CONTENT_DETECTION" });
    expect(resolveEffectiveDocType({ workbookStatements: [], aiType: null, declared: null, content: none }).docType).toBe("no_reconocible");
  });

  it("el patrimonio (equity) no cuenta como estado principal para esta regla", () => {
    expect(resolveEffectiveDocType({ workbookStatements: ["balance_sheet", "equity"], aiType: "balance_general", declared: null, content: none }).docType).toBe("balance_general");
  });
});

describe("tipo operacional persistido: effective ?? declared", async () => {
  const { effectiveDocType } = await import("./document-type");
  const { evaluate } = await import("./validation-rules");

  it("L. legacy de un solo estado sin tipo efectivo: cae al declarado", () => {
    expect(effectiveDocType({ doc_type_declared: "estado_resultados", doc_type_effective: null })).toBe("estado_resultados");
    expect(effectiveDocType({ doc_type_declared: "balance_general" })).toBe("balance_general");
    expect(effectiveDocType({ doc_type_declared: "estado_resultados", doc_type_effective: "estados_financieros" })).toBe("estados_financieros");
    expect(effectiveDocType(null)).toBeNull();
  });

  it("M. la validación usa effective ?? declared (un 'balance_general' declarado con efectivo multi-estado cuenta como resultados)", () => {
    const doc = (declared: string, effective: string | null) => [{ original_filename: "x.xlsx", file_size_bytes: 1, processing_status: "completado", doc_type_declared: declared, doc_type_effective: effective }];
    const map001 = (d: ReturnType<typeof doc>) => evaluate([], d, ["2024"], "2024").find((r) => r.code === "MAP_001")!;
    expect(map001(doc("balance_general", "estados_financieros")).severity).toBe("media");
    expect(map001(doc("balance_general", null)).severity).toBe("informativa");
  });
});
