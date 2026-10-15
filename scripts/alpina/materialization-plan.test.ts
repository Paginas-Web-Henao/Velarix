// El plan de materialización de Alpina solo transporta datos verificables
// del repo: nada inventado, nada que se aparte de los fixtures congelados.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ALPINA_2024_STRUCTURED_INPUT } from "../../supabase/functions/_shared/alpina-2024.structured-input";
import {
  ALPINA_ACCOUNT_NOTES,
  ALPINA_ANALYSIS,
  ALPINA_QUESTIONS,
  ALPINA_STRUCTURED_PAYLOAD,
  METHODOLOGY_QUESTION_TEXT,
  SOURCE_FILES,
  buildMaterializationMetadata,
  diffJson,
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

describe("diffJson (comparación oficial vs. congelado, sin tolerancia)", () => {
  it("detecta cualquier diferencia numérica, de clave o de tipo", () => {
    expect(diffJson({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })).toEqual([]);
    expect(diffJson({ a: 1 }, { a: 1.0000000001 })).toHaveLength(1);
    expect(diffJson({ a: 1 }, { a: 1, extra: 0 })).toEqual([{ path: "$.extra", expected: undefined, actual: 0 }]);
    expect(diffJson({ a: [1] }, { a: { 0: 1 } })).toHaveLength(1);
  });
});
