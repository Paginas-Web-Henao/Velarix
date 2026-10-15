// Último pase de producto (2026-10-15): metadata estructurado, semántica de
// provenance, verificación oficial y legibilidad. Datos: el envelope se
// construye con el motor canónico real sobre el fixture congelado de Alpina
// (sin recalcular nada en producción) y eventos de auditoría de ejemplo.
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { runCanonicalFinancialEngine } from "../../../supabase/functions/_shared/canonical-financial-engine";
import { buildMissingProvenance } from "../../../supabase/functions/_shared/calculation-provenance";
import { buildSourceInputSnapshot } from "../../../supabase/functions/_shared/source-input-snapshot";
import { buildResolvedAssumptionsSnapshot } from "../../../supabase/functions/_shared/resolved-assumptions-snapshot";
import { ALPINA_2024_STRUCTURED_INPUT } from "../../../supabase/functions/_shared/alpina-2024.structured-input";
import { ALPINA_BUSINESS_PROFILE, ALPINA_CASE_COLUMNS, ALPINA_QUESTIONS, RECLASSIFIED_QUESTIONS, SUPERSEDED_ANSWER_WORDING, SUPERSEDED_QUESTION_WORDING } from "../../../scripts/alpina/materialization-plan";
import type { CaseData, CaseQuestion } from "./useCaseData";
import { AuditSection, ChallengeSection, EvidenceSection, JudgmentSection, OutputSection, QuestionsSection, UnderstandingSection, AccountsSection } from "./CaseSections";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/lib/canonical-pdf-download", () => ({ downloadCanonicalPdf: vi.fn() }));

const FP = "db5429ad178da7f5";
const CALC_AT = "2026-10-15T15:12:03.000Z";

function calculation() {
  const result = runCanonicalFinancialEngine(ALPINA_2024_STRUCTURED_INPUT, "Alimentos y bebidas", 3);
  return {
    ...result,
    version: { input_fingerprint: FP, calculated_at: CALC_AT, assumptions_source: "resolved_case_input", provenance_status: "missing" },
    provenance: buildMissingProvenance({ analysisId: "a1", monedaAnalisis: "COP", monedaDocumento: null, factorConversion: 1, builtAt: CALC_AT }),
    source_input_snapshot: buildSourceInputSnapshot({ structuredInputId: "si1", versionInput: "repo-canonical@18f34a0", sector: "Alimentos y bebidas", input: ALPINA_2024_STRUCTURED_INPUT }),
    resolved_assumptions_used: buildResolvedAssumptionsSnapshot(ALPINA_2024_STRUCTURED_INPUT.resolved_assumptions),
  };
}

const ev = (event_type: string, metadata: Record<string, unknown>) =>
  ({ id: event_type, event_type, event_detail: null, component: "materialize-alpina", created_at: "2026-10-15T15:23:04Z", metadata });
const MATERIALIZED = ev("case_materialized_from_repo", { git_commit: "18f34a0aaaaaaa", input_fingerprint_local: FP });
const VERIFIED = ev("official_calculation_verified", { input_fingerprint: FP, calculated_at: CALC_AT, real_mismatches: 0, float_equivalent: 10, exact_matches: 530, tolerance: { K: 4 } });

let qid = 0;
function questions(): CaseQuestion[] {
  const rows: CaseQuestion[] = [];
  const mk = (texto: string, razon: string, answer: string | null, supersedes: string | null = null): CaseQuestion => {
    const id = `q${++qid}`;
    const row = {
      id, valuation_file_id: "vf", texto, razon, materialidad: null, generado_por_ia: false, generado_por: "o",
      estado: answer ? "respondida" : "abierta", created_at: "2026-10-15T14:42:38Z", supersedes_question_id: supersedes,
      expedient_answers: answer ? [{ id: `${id}a`, question_id: id, respuesta_texto: answer, respondido_por: "o", respondido_at: "2026-10-15T14:42:38Z", created_at: "2026-10-15T14:42:38Z" }] : [],
    } as CaseQuestion;
    rows.push(row);
    return row;
  };
  for (const q of ALPINA_QUESTIONS) {
    if (q.code === "C-11") {
      const old = mk(q.texto, SUPERSEDED_QUESTION_WORDING["C-11"].razon, q.answer);
      mk(q.texto, q.razon, q.answer, old.id);
    } else if (q.code === "C-07") {
      const old = mk(q.texto, q.razon, SUPERSEDED_ANSWER_WORDING["C-07"].answer);
      mk(q.texto, q.razon, q.answer, old.id);
    } else mk(q.texto, q.razon, q.answer);
  }
  const c071 = RECLASSIFIED_QUESTIONS[0];
  const row = mk(c071.texto, c071.razon, null);
  RECLASSIFIED_ID = row.id;
  return rows;
}
let RECLASSIFIED_ID = "";

function caseData(over: Partial<CaseData> = {}, analysisOver: Record<string, unknown> = {}): CaseData {
  return {
    analysis: {
      id: "a1", user_id: "o", company_name: "Alpina Productos Alimenticios S.A.S. BIC", sector: "Alimentos y bebidas", expected_growth: 3,
      moneda_analisis: "COP", status: "calculo_completo", created_at: CALC_AT, updated_at: CALC_AT,
      ...ALPINA_CASE_COLUMNS, business_profile: ALPINA_BUSINESS_PROFILE, ...analysisOver,
    } as unknown as CaseData["analysis"],
    calculation: calculation() as unknown as CaseData["calculation"],
    documents: [], homologations: [], validations: [], valuationFile: { id: "vf" } as CaseData["valuationFile"],
    accountNotes: [{ id: "n1", valuation_file_id: "vf", canonical_account: "financial_debt_total", interpretation_text: "x".repeat(50) + " TEXTO-COMPLETO-FINAL", created_by: "o", created_at: CALC_AT }],
    questions: questions(), reviews: [], narrative: null,
    auditEvents: [VERIFIED, MATERIALIZED, ev("expedient_question_reclassified", { question_id: RECLASSIFIED_ID, reclassified_as: "CALCULATION_VALIDATION", reason: RECLASSIFIED_QUESTIONS[0].reason }), ev("terminal_reinvestment_check", { input_fingerprint: FP, calculated_at: CALC_AT, status: "PASS" })] as CaseData["auditEvents"],
    latestStructuredInput: null,
    ...over,
  };
}

const reload = () => {};

describe("Business: metadata estructurado y resumen con fuentes", () => {
  it("muestra interés valorado, arquitectura y el resumen operativo con referencia al case MOC", () => {
    render(<UnderstandingSection data={caseData()} reload={reload} />);
    expect(screen.getByText(/100% del economic equity de Alpina/)).toBeTruthy();
    expect(screen.getByText(/PARENT_DCF_PLUS_SOTP/)).toBeTruthy();
    expect(screen.getByText("docs/cases/alpina/00-case-home.md")).toBeTruthy();
    expect(screen.getByText(/No documentados en el repo/)).toBeTruthy(); // segmentos: ausencia explícita
  });

  it("un caso sin metadata (legacy) no rompe: muestra guiones y el aviso del MOC", () => {
    render(<UnderstandingSection data={caseData({}, { valuation_date: null, base_period: null, basis_of_value: null, valued_interest: null, calculation_architecture: null, business_profile: null })} reload={reload} />);
    expect(screen.getByText(/Sin resumen operativo registrado/)).toBeTruthy();
  });
});

describe("Provenance: repo canónico ≠ lineage documental", () => {
  it("Evidence distingue case source (verificado) de document/homologation lineage (missing)", () => {
    render(<EvidenceSection data={caseData()} reload={reload} />);
    expect(screen.getByText("Período seleccionado por pipeline documental")).toBeTruthy();
    expect(screen.getAllByText("not available").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Período base")).toBeNull();
    expect(screen.getByText("VERIFIED · REPO_CANONICAL")).toBeTruthy();
    expect(screen.getAllByText("MISSING")).toHaveLength(2);
    expect(screen.getByText("REPO_CANONICAL_EVIDENCE")).toBeTruthy();
    expect(screen.getByText(/no desde documentos subidos/)).toBeTruthy();
  });

  it("sin evento de verificación, el origen repo NO se marca VERIFIED", () => {
    render(<EvidenceSection data={caseData({ auditEvents: [MATERIALIZED] as CaseData["auditEvents"] })} reload={reload} />);
    expect(screen.getByText("REPO_CANONICAL")).toBeTruthy();
    expect(screen.queryByText(/VERIFIED/)).toBeNull();
  });

  it("Audit trail: cada campo muestra su capa y la ausencia conocida de lineage, sin ids fabricados", () => {
    render(<AuditSection data={caseData()} reload={reload} />);
    const table = screen.getByText("Provenance por campo").closest("section")!;
    expect(within(table).getAllByText("REPO_CANONICAL_EVIDENCE").length).toBeGreaterThanOrEqual(8);
    expect(within(table).getAllByText("not available").length).toBeGreaterThanOrEqual(16);
  });
});

describe("Output: verificación oficial derivada de datos reales", () => {
  it("muestra VERIFIED con fingerprint, supuestos, 0 mismatches y equivalentes de máquina", () => {
    render(<OutputSection data={caseData()} reload={reload} />);
    expect(screen.getByText("VERIFIED")).toBeTruthy();
    expect(screen.getByText(FP)).toBeTruthy();
    expect(screen.getByText("resolved_case_input · 13")).toBeTruthy();
    expect(screen.getByText("0 real mismatches")).toBeTruthy();
    expect(screen.getByText("10 (≤ 4·ε)")).toBeTruthy();
    expect(screen.getByText(/limitación de trazabilidad, no de reproducibilidad matemática/)).toBeTruthy();
  });

  it.each([
    ["sin evento", []],
    ["evento de otro cálculo (fingerprint distinto)", [ev("official_calculation_verified", { input_fingerprint: "otro", calculated_at: CALC_AT, real_mismatches: 0 })]],
    ["evento de otra ejecución (calculated_at distinto)", [ev("official_calculation_verified", { input_fingerprint: FP, calculated_at: "2026-01-01T00:00:00Z", real_mismatches: 0 })]],
    ["solo un mismatch", [ev("official_calculation_mismatch", { input_fingerprint: FP, calculated_at: CALC_AT, real_mismatches: 10 })]],
  ])("no muestra VERIFIED: %s", (_l, events) => {
    render(<OutputSection data={caseData({ auditEvents: events as CaseData["auditEvents"] })} reload={reload} />);
    expect(screen.queryByText("VERIFIED")).toBeNull();
    expect(screen.getByText("NOT VERIFIED")).toBeTruthy();
  });
});

describe("Questions: versiones, estados y texto completo", () => {
  it("C-11 vigente sin 2.85%; la versión anterior se conserva como superseded", () => {
    const { container } = render(<QuestionsSection data={caseData()} reload={reload} />);
    const c11 = [...container.querySelectorAll("details")].find((d) => d.textContent?.includes("C-11"))!;
    expect(c11.textContent).toContain("CRP vigente aplicado al caso");
    expect(c11.textContent).toContain("Versión anterior (superseded)");
    const current = c11.textContent!.split("Versión anterior (superseded)")[0];
    expect(current).not.toContain("2.85%");
    expect(c11.textContent).toContain("el CRP de 2.85%"); // historial visible
  });

  it("12 canónicas: C-05, C-06, C-09, C-12 abiertas; el resto respondidas", () => {
    const { container } = render(<QuestionsSection data={caseData()} reload={reload} />);
    const status = (code: string) => [...container.querySelectorAll("details")].find((d) => d.querySelector("summary")?.textContent?.startsWith(code))!.querySelector("summary")!.textContent!;
    for (const c of ["C-05", "C-06", "C-09", "C-12"]) expect(status(c)).toMatch(/abierta$/);
    for (const c of ["C-01", "C-02", "C-03", "C-04", "C-07", "C-08", "C-10", "C-11"]) expect(status(c)).toMatch(/respondida$/);
    expect(screen.getByText(/12 vigentes · 8 respondidas · 4 abiertas/)).toBeTruthy();
  });

  it("C-07.1 aparece solo como reclasificada (CALCULATION_VALIDATION), con su fila original preservada", () => {
    const { container } = render(<QuestionsSection data={caseData()} reload={reload} />);
    expect(screen.getByText(/Reclasificadas fuera del Judgment \(1, historial\)/)).toBeTruthy();
    expect(screen.getByText("CALCULATION_VALIDATION")).toBeTruthy();
    expect(container.textContent).toContain("Texto original: " + RECLASSIFIED_QUESTIONS[0].razon);
    const summaries = [...container.querySelectorAll("summary")].map((x) => x.textContent ?? "");
    expect(summaries.filter((t) => t.startsWith("C-07.1"))).toHaveLength(1);
    expect(summaries.find((t) => t.startsWith("C-07.1"))).not.toMatch(/abierta|respondida/);
  });

  it("C-07 vigente sin 'pendiente'; la respuesta anterior se ve como superseded", () => {
    const { container } = render(<QuestionsSection data={caseData()} reload={reload} />);
    const c07 = [...container.querySelectorAll("details")].find((d) => d.querySelector("summary")?.textContent?.startsWith("C-07Plan"))!;
    const [current, history] = c07.textContent!.split("Versión anterior (superseded)");
    expect(current).toContain("TERMINAL REINVESTMENT CHECK");
    expect(current).not.toContain("Verificación g/ROC terminal pendiente");
    expect(history).toContain("Verificación g/ROC terminal pendiente");
  });

  it("la respuesta Judgment completa y su fuente quedan accesibles (no se resumen)", () => {
    const { container } = render(<QuestionsSection data={caseData()} reload={reload} />);
    const c01 = ALPINA_QUESTIONS.find((q) => q.code === "C-01")!.answer!;
    const body = c01.slice(0, c01.lastIndexOf(" Fuente: "));
    expect(container.textContent).toContain(body);
    expect(container.textContent).toContain("alpina-2024.resolved-assumptions.ts → taxTreatment");
  });
});

describe("Legibilidad de texto largo", () => {
  it("Judgment: fuentes y rationales largos se leen completos (sin truncate)", () => {
    const { container } = render(<JudgmentSection data={caseData()} reload={reload} />);
    const rationale = ALPINA_2024_STRUCTURED_INPUT.resolved_assumptions!.capitalStructure.rationale;
    expect(container.textContent).toContain(rationale);
    expect(container.querySelector(".truncate")).toBeNull();
  });

  it("Accounts: la interpretación completa se envuelve, sin cortar", () => {
    const { container } = render(<AccountsSection data={caseData()} reload={reload} />);
    expect(container.textContent).toContain("TEXTO-COMPLETO-FINAL");
    const cell = screen.getByText(/TEXTO-COMPLETO-FINAL/).closest("td")!;
    expect(cell.className).toContain("whitespace-normal");
  });
});

describe("Challenge", () => {
  it("TERMINAL REINVESTMENT CHECK: PASS calculado del cálculo persistido y marcado como registrado", () => {
    render(<ChallengeSection data={caseData()} reload={reload} />);
    expect(screen.getByText("status = PASS")).toBeTruthy();
    expect(screen.getByText("19.348.773 / 154.790.064 = 0.125000")).toBeTruthy(); // Net Reinvestment / NOPAT
    expect(screen.getByText("3% / 24% = 0.125000")).toBeTruthy(); // g / ROC
    expect(screen.getByText(/Registrado en el audit trail/)).toBeTruthy();
  });

  it("P-12 aparece como NOT IMPLEMENTED / PENDING, sin resultados simulados", () => {
    render(<ChallengeSection data={caseData()} reload={reload} />);
    expect(screen.getByText("NOT IMPLEMENTED · PENDING")).toBeTruthy();
  });
});
