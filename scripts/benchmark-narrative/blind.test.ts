import { describe, it, expect } from "vitest";
import { assignBlindLabels, buildBlindReviewArtifact } from "./blind";
import { BENCHMARK_FIXTURES } from "./fixtures";
import { BENCHMARK_TASKS } from "./types";

describe("assignBlindLabels — determinístico, sin sesgo de orden fijo", () => {
  it("misma combinación (fixture, task, seed) siempre produce la misma asignación", () => {
    const a1 = assignBlindLabels("CASE_A_MODERATE", "executive_summary", 7);
    const a2 = assignBlindLabels("CASE_A_MODERATE", "executive_summary", 7);
    expect(a1).toEqual(a2);
  });

  it("labelForProvider y providerForLabel son inversos entre sí", () => {
    for (const fixture of BENCHMARK_FIXTURES) {
      for (const task of BENCHMARK_TASKS) {
        const assignment = assignBlindLabels(fixture.id, task, 0);
        expect(assignment.providerForLabel[assignment.labelForProvider.anthropic]).toBe("anthropic");
        expect(assignment.providerForLabel[assignment.labelForProvider.openai]).toBe("openai");
      }
    }
  });

  // N. la asignación NO siempre pone Anthropic="A" — verificado sobre
  // toda la matriz real (3 fixtures × 5 tasks = 15 combinaciones).
  it("N. Anthropic no siempre queda asignado a la etiqueta A", () => {
    const labels = new Set<string>();
    for (const fixture of BENCHMARK_FIXTURES) {
      for (const task of BENCHMARK_TASKS) {
        labels.add(assignBlindLabels(fixture.id, task, 0).labelForProvider.anthropic);
      }
    }
    expect(labels.has("A")).toBe(true);
    expect(labels.has("B")).toBe(true);
  });

  it("un seed distinto puede cambiar la asignación de una misma combinación", () => {
    const seeds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const results = seeds.map((seed) => assignBlindLabels("CASE_B_FINANCIAL_STRESS", "conclusion", seed).labelForProvider.anthropic);
    expect(new Set(results).size).toBeGreaterThan(1);
  });
});

describe("buildBlindReviewArtifact — filas sin provider visible, mapping separado", () => {
  it("las filas no exponen ningún campo de provider/model", () => {
    const { rows } = buildBlindReviewArtifact(
      [
        { fixtureId: "CASE_A_MODERATE", task: "executive_summary", provider: "anthropic", text: "texto anthropic" },
        { fixtureId: "CASE_A_MODERATE", task: "executive_summary", provider: "openai", text: "texto openai" },
      ],
      1,
    );
    expect(rows.length).toBe(1);
    const row = rows[0] as unknown as Record<string, unknown>;
    expect(row.provider).toBeUndefined();
    expect(row.model).toBeUndefined();
    expect([row.outputA, row.outputB].sort()).toEqual(["texto anthropic", "texto openai"].sort());
  });

  it("el mapping reconstruye correctamente qué provider generó cada texto", () => {
    const { rows, mapping } = buildBlindReviewArtifact(
      [
        { fixtureId: "CASE_B_FINANCIAL_STRESS", task: "conclusion", provider: "anthropic", text: "texto anthropic" },
        { fixtureId: "CASE_B_FINANCIAL_STRESS", task: "conclusion", provider: "openai", text: "texto openai" },
      ],
      2,
    );
    const row = rows[0];
    const map = mapping[0];
    const textForProvider = (p: "anthropic" | "openai") => (map.providerForLabel.A === p ? row.outputA : row.outputB);
    expect(textForProvider("anthropic")).toBe("texto anthropic");
    expect(textForProvider("openai")).toBe("texto openai");
  });
});
