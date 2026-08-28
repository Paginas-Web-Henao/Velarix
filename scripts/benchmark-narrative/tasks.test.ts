import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BENCHMARK_TASKS } from "./types";
import { findFixture } from "./fixtures";
import { SYSTEM_BASE, SYSTEM_CONCLUSION, SYSTEM_AUDITOR, SECTION_TASKS, FINANCIAL_SEMANTIC_GUARDRAILS, buildTaskInput, buildViewModel, deriveEstado, generateRecommendations } from "./tasks";
import { detectRisks } from "../../supabase/functions/_shared/narrative-calculation-adapter";

const HERE = dirname(fileURLToPath(import.meta.url));
const GENERATE_NARRATIVE_SOURCE = readFileSync(resolve(HERE, "../../supabase/functions/generate-narrative/index.ts"), "utf-8");

describe("BENCHMARK_TASKS — inventario", () => {
  it("exactamente las 5 tareas pedidas", () => {
    expect(BENCHMARK_TASKS).toEqual(["executive_summary", "profitability_analysis", "valuation_analysis", "conclusion", "narrative_audit"]);
  });

  it("SECTION_TASKS cubre exactamente executive_summary/profitability_analysis/valuation_analysis", () => {
    expect(SECTION_TASKS.map((s) => s.key).sort()).toEqual(["executive_summary", "profitability_analysis", "valuation_analysis"]);
  });
});

describe("buildTaskInput — evidencia exacta de producción, sin ampliarla", () => {
  const fixture = findFixture("CASE_A_MODERATE");

  it("las 5 tareas producen systemPrompt/userPrompt/maxTokens no vacíos", () => {
    for (const task of BENCHMARK_TASKS) {
      const input = buildTaskInput(task, fixture);
      expect(input.systemPrompt.length).toBeGreaterThan(0);
      expect(input.userPrompt.length).toBeGreaterThan(0);
      expect(input.maxTokens).toBeGreaterThan(0);
    }
  });

  it("profitability_analysis solo entrega kpis + sectorBenchmark (más companyName/sector) — no el calculation_result entero", () => {
    const input = buildTaskInput("profitability_analysis", fixture);
    const parsedJsonMatch = input.userPrompt.match(/\{[\s\S]*\}/);
    expect(parsedJsonMatch).toBeTruthy();
    const data = JSON.parse(parsedJsonMatch![0]);
    expect(Object.keys(data).sort()).toEqual(["companyName", "kpis", "sectorBenchmark", "sector"].sort());
    expect(data.enterpriseValue).toBeUndefined();
    expect(data.projections).toBeUndefined();
  });

  it("valuation_analysis usa exactamente los dataKeys productivos actuales", () => {
    const section = SECTION_TASKS.find((s) => s.key === "valuation_analysis")!;
    expect(section.dataKeys.sort()).toEqual(
      ["enterpriseValue", "equityValue", "wacc", "costOfEquity", "costOfDebtAfterTax", "discountedTV", "evEbitda", "evRevenue", "terminalValue", "betaLevered", "netDebt", "evLow", "evHigh", "projections"].sort(),
    );
  });

  it("narrative_audit NO depende de las otras 4 llamadas — usa el auditNarrativeBundle sintético del fixture", () => {
    const input = buildTaskInput("narrative_audit", fixture, "clean");
    expect(input.userPrompt).toContain(fixture.auditNarrativeBundle.clean);
    expect(input.userPrompt).toContain("DATOS CALCULADOS");
  });

  it("conclusion incluye estado/riesgo principal/recomendación prioritaria derivados del mismo fixture", () => {
    const vm = buildViewModel(fixture);
    const risks = detectRisks(vm);
    const recs = generateRecommendations(risks);
    const estado = deriveEstado(vm);
    const input = buildTaskInput("conclusion", fixture);
    expect(input.userPrompt).toContain(`Estado general: ${estado}`);
    if (risks[0]) expect(input.userPrompt).toContain(risks[0].nombre);
    if (recs[0]) expect(input.userPrompt).toContain(recs[0].titulo);
  });
});

// ═══════════════════════════════════════════════════════════════
// Chequeo estático de divergencia — HEAD c34f964. Si generate-narrative/
// index.ts cambia una de estas reglas críticas, este test falla y avisa
// que el snapshot de tasks.ts quedó desactualizado. No es igualdad
// byte-for-byte de todo el archivo — solo de las reglas listadas en la
// tarea (Paso 2, sección 10).
// ═══════════════════════════════════════════════════════════════

describe("snapshot de prompts — divergencia frente a generate-narrative/index.ts real", () => {
  const criticalRules = [
    "No mencionas cifras inexistentes.",
    "No inventas comparables sectoriales ni fuentes.",
    "No calculas WACC, EV, FCFF ni indicadores — solo interpretas outputs ya calculados.",
    "No reconstruyas ni infieras pesos de capital (equity/deuda), tasas o supuestos que no te fueron entregados.",
    "No afirmes que domina salvo que los datos lo sustenten.",
  ];

  it("las 5 reglas críticas existen en el archivo productivo real", () => {
    for (const rule of criticalRules) {
      expect(GENERATE_NARRATIVE_SOURCE).toContain(rule);
    }
  });

  it("las mismas 5 reglas críticas existen en el snapshot de este harness (SYSTEM_BASE + valuation_analysis)", () => {
    const valuationSystem = SECTION_TASKS.find((s) => s.key === "valuation_analysis")!.system;
    const combined = `${SYSTEM_BASE}\n${valuationSystem}`;
    for (const rule of criticalRules) {
      expect(combined).toContain(rule);
    }
  });

  it("SYSTEM_CONCLUSION y SYSTEM_AUDITOR productivos siguen conteniendo sus marcadores estructurales clave", () => {
    expect(GENERATE_NARRATIVE_SOURCE).toContain("Tu función es redactar la conclusión final del informe financiero.");
    expect(SYSTEM_CONCLUSION).toContain("Tu función es redactar la conclusión final del informe financiero.");
    expect(GENERATE_NARRATIVE_SOURCE).toContain("Eres el auditor de consistencia narrativa de Velarix.");
    expect(SYSTEM_AUDITOR).toContain("Eres el auditor de consistencia narrativa de Velarix.");
  });

  it("generateRecommendations/recMap del snapshot coincide en las 7 reglas de riesgo->recomendación productivas", () => {
    for (const id of ["END_001", "END_002", "RENT_001", "RENT_003", "CREC_001", "VAL_001", "VAL_002"]) {
      expect(GENERATE_NARRATIVE_SOURCE).toContain(`${id}:`);
    }
  });

  it("FINANCIAL_SEMANTIC_GUARDRAILS es un candidato de hardening que NO existe todavía en generate-narrative/index.ts real", () => {
    expect(GENERATE_NARRATIVE_SOURCE).not.toContain("GUARDRAILS SEMÁNTICOS FINANCIEROS");
  });
});

// ═══════════════════════════════════════════════════════════════
// Hardening — guardrails semánticos financieros (Subbloque 2.E, evidencia
// de 2 benchmarks reales). Confirma que la propuesta de hardening aparece
// en el input real de las 4 tareas narrativas relevantes y del auditor —
// NO que ya esté activa en producción (ver test de arriba).
// ═══════════════════════════════════════════════════════════════

describe("FINANCIAL_SEMANTIC_GUARDRAILS aparece en el input de las tareas relevantes", () => {
  const fixture = findFixture("CASE_A_MODERATE");
  const GUARDRAIL_MARKER = "GUARDRAILS SEMÁNTICOS FINANCIEROS";

  it("executive_summary, profitability_analysis, valuation_analysis y conclusion incluyen los guardrails en systemPrompt", () => {
    for (const task of ["executive_summary", "profitability_analysis", "valuation_analysis", "conclusion"] as const) {
      const input = buildTaskInput(task, fixture);
      expect(input.systemPrompt).toContain(GUARDRAIL_MARKER);
    }
  });

  it("SYSTEM_AUDITOR también conoce los guardrails al evaluar narrativas", () => {
    const input = buildTaskInput("narrative_audit", fixture);
    expect(input.systemPrompt).toContain(GUARDRAIL_MARKER);
    expect(SYSTEM_AUDITOR).toContain(GUARDRAIL_MARKER);
  });

  it("los 7 guardrails cubren explícitamente EBITDA-vs-WACC, interestCoverage=EBIT/interés, y 'pérdida operativa' con EBIT>0", () => {
    expect(FINANCIAL_SEMANTIC_GUARDRAILS).toMatch(/margen.*wacc/is);
    expect(FINANCIAL_SEMANTIC_GUARDRAILS).toContain("EBIT / interest_expense");
    expect(FINANCIAL_SEMANTIC_GUARDRAILS).toContain('Nunca "pérdida operativa"');
  });
});
