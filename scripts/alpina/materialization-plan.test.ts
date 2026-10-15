// El plan de materialización de Alpina solo transporta datos verificables
// del repo: nada inventado, nada que se aparte de los fixtures congelados.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ALPINA_2024_STRUCTURED_INPUT } from "../../supabase/functions/_shared/alpina-2024.structured-input";
import {
  ALPINA_BUSINESS_PROFILE,
  ALPINA_CASE_COLUMNS,
  SUPERSEDED_QUESTION_WORDING,
  SUPERSEDED_ANSWER_WORDING,
  RECLASSIFIED_QUESTIONS,
  C07_STALE_SENTENCE,
  ALPINA_ACCOUNT_NOTES,
  ALPINA_ANALYSIS,
  ALPINA_QUESTIONS,
  ALPINA_STRUCTURED_PAYLOAD,
  METHODOLOGY_QUESTION_TEXT,
  SOURCE_FILES,
  MACHINE_PRECISION_K,
  buildMaterializationMetadata,
  compareJson,
  isFloatEquivalent,
  questionKey,
  sameJson,
} from "./materialization-plan";

const root = join(__dirname, "../..");
const read = (f: string) => readFileSync(join(root, f), "utf8");

describe("plan de materialización de Alpina", () => {
  it("el structured input es una copia exacta del fixture (con los 13 supuestos resueltos)", () => {
    expect(sameJson(ALPINA_STRUCTURED_PAYLOAD, ALPINA_2024_STRUCTURED_INPUT)).toBe(true);
    expect(Object.keys(ALPINA_STRUCTURED_PAYLOAD.resolved_assumptions as object)).toHaveLength(13);
    expect((ALPINA_STRUCTURED_PAYLOAD.income_statement as { taxes: unknown }).taxes).toBeNull();
  });

  it("el sector es el mismo con el que se congeló la ejecución canónica", () => {
    expect(read("supabase/functions/_shared/alpina-2024.canonical-execution.test.ts")).toContain(`const ALPINA_SECTOR = "${ALPINA_ANALYSIS.sector}";`);
    expect(ALPINA_ANALYSIS.expected_growth).toBe(3);
    expect(ALPINA_ANALYSIS.moneda_analisis).toBe("COP");
  });

  it("todos los archivos fuente citados existen", () => {
    for (const f of SOURCE_FILES) expect(() => read(f), f).not.toThrow();
  });

  it("tema y evidencia de cada pregunta C-xx están literalmente en la metodología (Capa B)", () => {
    const doc = read("docs/velarix-v5/03-methodology-decisions-v5.md");
    for (const [code, [topic, evidence]] of Object.entries(METHODOLOGY_QUESTION_TEXT)) {
      expect(doc, code).toContain(`| ${code} | ${topic} |`);
      expect(doc, code).toContain(evidence);
    }
  });

  it("las preguntas sin respuesta documentada quedan abiertas; las respondidas citan su fuente", () => {
    // 12 canónicas: 8 respondidas, 4 abiertas (C-05/C-06/C-09/C-12).
    expect(ALPINA_QUESTIONS).toHaveLength(12);
    expect(ALPINA_QUESTIONS.filter((q) => !q.answer).map((q) => q.code)).toEqual(["C-05", "C-06", "C-09", "C-12"]);
    for (const q of ALPINA_QUESTIONS) {
      expect(questionKey(q.texto)).toBe(q.code);
      if (q.answer) {
        expect(q.answer).toMatch(/^\[REPO_CANONICAL_JUDGMENT/);
        expect(q.answer).toMatch(/Fuente: (supabase|docs)\//);
      }
    }
  });

  it("las notas de cuentas materiales reconcilian con la evidencia del fixture", () => {
    expect(ALPINA_ACCOUNT_NOTES.map((a) => a.canonical_account)).toEqual(["financial_debt_total", "da"]);
    expect(ALPINA_ACCOUNT_NOTES[0].interpretation_text).toContain("653,189,423 + pasivos por arrendamiento (NIIF 16) 143,939,924 = 797,129,347");
    expect(ALPINA_ACCOUNT_NOTES[1].interpretation_text).toContain("93,241,781 = depreciación PP&E 48,776,286 + depreciación ROU 31,731,724 + amortización de intangibles 12,733,771");
  });

  it("el metadata separa las cuatro capas y declara que no hay documentos ni cálculo copiado", () => {
    const m = buildMaterializationMetadata({ gitCommit: "abc", inputFingerprint: "f" });
    expect(Object.keys(m.layers)).toEqual(["REPO_CANONICAL_EVIDENCE", "JUDGMENT", "SUPABASE_DOCUMENT_EVIDENCE", "CALCULATION"]);
    expect(m.layers.SUPABASE_DOCUMENT_EVIDENCE).toMatch(/ninguna/);
    expect(m.case.valuation_date).toBe("2024-12-31");
  });
});

describe("metadata estructurado y wording corregido", () => {
  it("las columnas de metadata de Alpina salen de fuentes documentadas", () => {
    expect(ALPINA_CASE_COLUMNS).toMatchObject({ valuation_date: "2024-12-31", base_period: "FY2024 (cierre 2024-12-31)", basis_of_value: "Market Value (IVS 102)" });
    expect(read("docs/decisions/ADR-004-alpina-base-de-valoracion.md")).toMatch(/2024-12-31[\s\S]*Market Value[\s\S]*100% del economic equity|100% del economic equity[\s\S]*Market Value[\s\S]*2024-12-31/);
  });

  it("el perfil de negocio solo trae ítems con fuente, sin segmentos inventados", () => {
    const p = ALPINA_BUSINESS_PROFILE;
    expect(p.segments).toEqual([]);
    expect(p.gaps.segments).toMatch(/No documentados/);
    for (const item of [p.summary!, ...p.geographies, ...p.value_drivers, ...p.key_risks]) {
      expect(item.source).toMatch(/(docs|supabase)\//);
    }
    expect(p.value_drivers.map((d) => d.text).join(" ")).toContain("13.99%");
    expect(p.key_risks.map((d) => d.text).join(" ")).toContain("18.06%");
    expect(p.moc_path).toBe("docs/cases/alpina/00-case-home.md");
  });

  it("C-11 ya no acopla la pregunta vigente a un CRP fechado; el wording 2.85% queda solo como historial", () => {
    const c11 = ALPINA_QUESTIONS.find((q) => q.code === "C-11")!;
    expect(c11.razon).not.toContain("2.85%");
    expect(c11.razon).toContain("CRP vigente aplicado al caso");
    expect(SUPERSEDED_QUESTION_WORDING["C-11"].razon).toContain("el CRP de 2.85%");
    expect(c11.answer).toContain("[REPO_CANONICAL_JUDGMENT]"); // el Judgment no cambia
  });

  it("C-07.1 ya no es pregunta canónica: queda como reclasificada a CALCULATION_VALIDATION (fila conservada)", () => {
    expect(ALPINA_QUESTIONS.some((x) => x.code === "C-07.1")).toBe(false);
    const r = RECLASSIFIED_QUESTIONS.find((x) => x.code === "C-07.1")!;
    expect(r.reclassifiedAs).toBe("CALCULATION_VALIDATION");
    expect(r.answer).toBeNull(); // nunca se convierte en Judgment
    expect(questionKey(r.texto)).toBe("C-07.1");
  });

  it("C-07 vigente sin el wording stale 'pendiente'; la transcripción anterior queda como superseded", () => {
    const c07 = ALPINA_QUESTIONS.find((x) => x.code === "C-07")!.answer!;
    expect(read("supabase/functions/_shared/alpina-2024.resolved-assumptions.ts")).toContain(C07_STALE_SENTENCE); // fixture intacto
    expect(c07).not.toContain(C07_STALE_SENTENCE);
    expect(c07).toContain("TERMINAL REINVESTMENT CHECK");
    expect(c07).toMatch(/^\[REPO_CANONICAL_JUDGMENT\]/);
    expect(SUPERSEDED_ANSWER_WORDING["C-07"].answer).toContain(C07_STALE_SENTENCE);
    expect(SUPERSEDED_ANSWER_WORDING["C-07"].requiresTerminalCheck).toBe(true);
  });

  it("C-04 y C-07 quedan consistentes: C-04 afirma la verificación g/ROC y C-07 ya no la declara pendiente", () => {
    const c04 = ALPINA_QUESTIONS.find((x) => x.code === "C-04")!.answer!;
    const c07 = ALPINA_QUESTIONS.find((x) => x.code === "C-07")!.answer!;
    expect(c04).toMatch(/Net Reinvestment\/NOPAT ≈ g\/ROC/);
    expect(c07).not.toMatch(/pendiente como cross-check/);
  });
});

describe("compareJson (oficial vs. congelado: EXACT_MATCH / FLOAT_EQUIVALENT / REAL_MISMATCH)", () => {
  it("estructura, claves, tipos y strings son exactos", () => {
    expect(compareJson({ a: 1, b: [1, "x", null, true] }, { a: 1, b: [1, "x", null, true] })).toEqual({ exactMatches: 5, floatEquivalent: [], realMismatches: [] });
    expect(compareJson({ a: 1 }, { a: 1, extra: 0 }).realMismatches).toEqual([{ path: "$.extra", expected: undefined, actual: 0 }]);
    expect(compareJson({ a: [1] }, { a: { 0: 1 } }).realMismatches).toHaveLength(1);
    expect(compareJson({ s: "resolved_case_input" }, { s: "legacy" }).realMismatches).toHaveLength(1);
    expect(compareJson({ n: 1 }, { n: "1" }).realMismatches).toHaveLength(1);
  });

  it("acepta las 10 diferencias de 1 ULP observadas en Alpina (Deno vs. Node) como FLOAT_EQUIVALENT", () => {
    const observed: [number, number][] = [
      [82011383.31742637, 82011383.31742638],
      [1593751363.2183373, 1593751363.2183375],
      [1753330143.7317526, 1753330143.7317529],
    ];
    for (const [a, b] of observed) {
      const r = compareJson({ v: a }, { v: b });
      expect(r.realMismatches).toEqual([]);
      expect(r.floatEquivalent).toHaveLength(1);
    }
  });

  it("cualquier diferencia financiera real es REAL_MISMATCH, aunque sea minúscula", () => {
    const ev = 1668259651.2050533;
    expect(compareJson({ ev }, { ev: ev + 0.001 }).realMismatches).toHaveLength(1); // 1 peso (COP miles)
    expect(compareJson({ ev }, { ev: ev + 1e-5 }).realMismatches).toHaveLength(1);  // ~6e-15 relativo
    expect(compareJson({ w: 10.554236424286662 }, { w: 10.554236424286662 + 1e-12 }).realMismatches).toHaveLength(1);
    expect(isFloatEquivalent(0, 5e-16)).toBe(true); // suelo absoluto 4·ε ≈ 8.9e-16 cerca de cero
    expect(isFloatEquivalent(0, 1e-15)).toBe(false);
    expect(isFloatEquivalent(0, 1e-12)).toBe(false);
    expect(isFloatEquivalent(NaN, NaN)).toBe(false);
  });

  it("K se mantiene en precisión de máquina (≤ 8·ε), nunca una tolerancia financiera", () => {
    expect(MACHINE_PRECISION_K).toBeGreaterThanOrEqual(1);
    expect(MACHINE_PRECISION_K).toBeLessThanOrEqual(8);
  });
});
