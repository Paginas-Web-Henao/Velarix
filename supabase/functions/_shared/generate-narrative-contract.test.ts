// Bloque 1E — Subbloque 2 — Pruebas de contrato de
// generate-narrative/index.ts. Ese archivo sigue sin poder importarse en
// Vitest por sus imports de Deno/Supabase/`serve()` (mismo bloqueo
// documentado desde Bloque 1A/1B-P0 para ejecutar-calculo/index.ts) — se
// verifica por inspección estática del código fuente real, no por
// ejecución, siguiendo el mismo patrón que
// `calculation-envelope.integration.test.ts`.
//
// El comportamiento del adaptador (mapeo/gates/detectRisks) ya está
// cubierto exhaustivamente en `narrative-calculation-adapter.test.ts` —
// aquí solo se prueba que `generate-narrative/index.ts` realmente usa ese
// adaptador tal como está escrito, no una copia local.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(__dirname, "../generate-narrative/index.ts"), "utf-8");

describe("generate-narrative — contrato de request (A, D)", () => {
  it("A. el body destructurado es únicamente { analysis_id } — ya no calculation_output", () => {
    expect(source).toContain("const { analysis_id } = await req.json();");
    expect(source).not.toMatch(/calculation_output/);
  });

  it("D. no existe ningún fallback a cifras financieras enviadas por el caller — el único origen de datos financieros es el adaptador sobre analysis.calculation_result", () => {
    // Ninguna cifra de sección se lee de `req`/`body` directamente; todas
    // pasan por `vm`/`vmRecord`, derivado de `mapCalculationResultToNarrativeViewModel`.
    expect(source).not.toMatch(/req\.(json\(\))?\.(enterpriseValue|wacc|kpis|projections)/);
    expect(source).toContain("mapCalculationResultToNarrativeViewModel(calculationResult)");
  });
});

describe("generate-narrative — fuente del cálculo (B, C)", () => {
  it("B. NO lee calculation_output del body en ningún punto (grep negativo exhaustivo)", () => {
    expect(source).not.toMatch(/\bcalculation_output\b/);
  });

  it("C. lee calculation_result desde analyses (SELECT explícito) y valida con el adaptador antes de usarlo", () => {
    expect(source).toMatch(/\.select\("id, company_name, sector, status, calculation_result, user_id"\)/);
    expect(source).toContain("assertNarrativeCalculationResult(analysis.calculation_result)");
  });

  it("el gate del calculation_result corre ANTES del update de status a interpretacion_en_curso (orden real en el archivo)", () => {
    const gateIndex = source.indexOf("assertNarrativeCalculationResult(analysis.calculation_result)");
    const statusIndex = source.indexOf('status: "interpretacion_en_curso"');
    expect(gateIndex).toBeGreaterThan(0);
    expect(statusIndex).toBeGreaterThan(0);
    expect(gateIndex).toBeLessThan(statusIndex);
  });
});

describe("generate-narrative — persistencia sin ON CONFLICT inválido", () => {
  it('no usa upsert(..., {onConflict:"analysis_id"}) — analysis_id no es UNIQUE en report_narratives', () => {
    expect(source).not.toMatch(/onConflict:\s*["']analysis_id["']/);
  });

  it("busca la narrativa más reciente por analysis_id (order + limit 1) y actualiza/inserta por id exacto, nunca por analysis_id directo", () => {
    expect(source).toContain('.order("created_at", { ascending: false })');
    expect(source).toContain(".limit(1)");
    expect(source).toMatch(/\.update\(narrativeRow\)\.eq\("id", existingNarrative\.id\)/);
  });
});

describe("generate-narrative — trazabilidad y versión", () => {
  it("persiste _calculation_meta dentro de sections_payload, sin schema nuevo", () => {
    expect(source).toContain("_calculation_meta: calculationMeta");
  });

  it('generation_version subió de "4.0" a "4.1"', () => {
    expect(source).toContain('const NARRATIVE_GENERATION_VERSION = "4.1";');
    expect(source).not.toMatch(/generation_version:\s*"4\.0"/);
  });

  it("audit_events.metadata incluye narrative_generation_version/input_fingerprint/calculation_schema_version sin volcar todo el cálculo", () => {
    expect(source).toContain("narrative_generation_version: NARRATIVE_GENERATION_VERSION");
    expect(source).toContain("input_fingerprint: calculationMeta.input_fingerprint");
    expect(source).toContain("calculation_schema_version: calculationMeta.calculation_schema_version");
    expect(source).not.toMatch(/metadata:\s*\{[^}]*calculationResult[^}]*\}/s);
  });
});

describe("generate-narrative — fail-closed HTTP (E–J cubiertos por narrative-calculation-adapter.test.ts; aquí solo el wiring HTTP)", () => {
  it("mapea CalculationResultRequiredError/UnsupportedCalculationResultError a 409 con el código real del error, sin degradar a 500 ni 200", () => {
    expect(source).toContain("status: 409");
    expect(source).toContain("calculationErrorResponse(e.code, ");
    expect(source).toContain("e instanceof CalculationResultRequiredError");
    expect(source).toContain("e instanceof UnsupportedCalculationResultError");
  });
});

describe("Bloque 1E static safety — sin motor(es) financiero(s) ni defaults dentro de generate-narrative", () => {
  it("O. no invoca runCanonicalFinancialEngine, runAnalysis ni DEFAULT_INPUTS", () => {
    expect(source).not.toMatch(/runCanonicalFinancialEngine/);
    expect(source).not.toMatch(/\brunAnalysis\s*\(/);
    expect(source).not.toMatch(/DEFAULT_INPUTS/);
  });

  it("importa el adaptador real desde _shared, no una copia local de detectRisks", () => {
    expect(source).toContain('from "../_shared/narrative-calculation-adapter.ts"');
    expect(source).not.toMatch(/function detectRisks/);
  });
});

// ═══════════════════════════════════════════════════════════════
// Corrección final (Bloque 1E/Subbloque 2): moneda, secciones sin datos
// canónicos, LIQ_001, analysis_id ausente, persistencia sin ignorar errores.
// ═══════════════════════════════════════════════════════════════

describe("moneda — sin USD hardcodeado (corrección)", () => {
  it("no existe ningún literal \"USD\" en generate-narrative/index.ts", () => {
    expect(source).not.toMatch(/USD/);
  });

  it("el Enterprise Value de la conclusión usa vm.moneda", () => {
    expect(source).toContain("Enterprise Value: ${vm.moneda}");
  });
});

describe("secciones sin datos/método canónico suficiente (liquidity_analysis, efficiency_analysis, multiples_valuation)", () => {
  it("B/C/G/H. las tres secciones quedan marcadas not_available, con contenido determinístico, sin invocar IA", () => {
    expect(source).toContain('liquidity_analysis: "No hay métricas canónicas suficientes');
    expect(source).toContain('efficiency_analysis: "No hay métricas canónicas suficientes');
    expect(source).toContain('multiples_valuation: "No se ejecutó una valoración canónica independiente por múltiplos');
    expect(source).toContain('status: "not_available"');
    // La rama not_available hace `continue` ANTES de la única línea que
    // llama a callAnthropic dentro del loop de secciones — nunca se
    // alcanza esa llamada para estas tres claves.
    const loopStart = source.indexOf("for (const section of SECTIONS) {");
    const notAvailableBranch = source.indexOf("SECTIONS_NOT_AVAILABLE[section.key]", loopStart);
    const continueStatement = source.indexOf("continue;", notAvailableBranch);
    const callAnthropicInLoop = source.indexOf("await callAnthropic(section.system", loopStart);
    expect(notAvailableBranch).toBeGreaterThan(loopStart);
    expect(continueStatement).toBeGreaterThan(notAvailableBranch);
    expect(continueStatement).toBeLessThan(callAnthropicInLoop);
  });

  it("L. el mensaje not_available de multiples_valuation nunca afirma que se ejecutó una valoración independiente por múltiplos", () => {
    expect(source).toMatch(/No se ejecutó una valoración canónica independiente por múltiplos/);
    // Ninguna otra ocurrencia activa (fuera del `system` legacy documentado
    // y no usado) afirma lo contrario cerca de la clave multiples_valuation.
    expect(source).not.toMatch(/Se ejecutó una valoración (canónica )?independiente por múltiplos/);
  });
});

describe("benchmark/multiples — sin instrucción de inventar fuente/fecha (D)", () => {
  it("multiples_valuation ya no exige \"Siempre menciona la fuente\" de forma absoluta", () => {
    expect(source).not.toMatch(/Siempre menciona la fuente de los múltiplos/);
    expect(source).toMatch(/fuente de los múltiplos de referencia SOLO si está presente/);
  });

  it("benchmark_comparison ya no exige \"Siempre mencionar fuente y fecha\" de forma absoluta", () => {
    expect(source).not.toMatch(/Siempre mencionar fuente y fecha del benchmark/);
    expect(source).toMatch(/fuente y fecha del benchmark SOLO si están presentes/);
  });
});

describe("valor terminal — sin afirmación absoluta de dominancia (E)", () => {
  it("valuation_analysis ya no instruye \"Siempre menciona que el valor terminal domina\"", () => {
    expect(source).not.toMatch(/Siempre menciona que el valor terminal domina/);
    expect(source).toMatch(/No afirmes que domina salvo que los datos lo sustenten/);
  });
});

describe("LIQ_001 — eliminado también de generateRecommendations (F)", () => {
  it("no existe ninguna entrada LIQ_001 en recMap (objeto de recomendaciones)", () => {
    expect(source).not.toMatch(/LIQ_001:\s*\{/);
  });
});

describe("analysis_id ausente — 400 explícito (H)", () => {
  it('lanza BadRequestError("MISSING_ANALYSIS_ID", ...) en vez de un Error genérico', () => {
    expect(source).toContain('throw new BadRequestError("MISSING_ANALYSIS_ID", "analysis_id es requerido.");');
    expect(source).not.toMatch(/throw new Error\("analysis_id required"\)/);
  });
});

describe("persistencia — errores ya no se ignoran (I)", () => {
  it("SELECT de existingNarrative captura y relanza su error", () => {
    expect(source).toContain("const { data: existingNarrative, error: existingNarrativeError } = await supabase");
    expect(source).toContain("if (existingNarrativeError) throw existingNarrativeError;");
  });

  it("UPDATE e INSERT de report_narratives capturan y relanzan su error", () => {
    expect(source).toContain("const { error: updateNarrativeError } = await supabase.from(\"report_narratives\").update(narrativeRow)");
    expect(source).toContain("if (updateNarrativeError) throw updateNarrativeError;");
    expect(source).toContain("const { error: insertNarrativeError } = await supabase.from(\"report_narratives\").insert(narrativeRow);");
    expect(source).toContain("if (insertNarrativeError) throw insertNarrativeError;");
  });

  it("INSERT de audit_events captura y relanza su error", () => {
    expect(source).toContain("const { error: auditEventError } = await supabase.from(\"audit_events\").insert({");
    expect(source).toContain("if (auditEventError) throw auditEventError;");
  });

  it("UPDATE final de analyses.status captura y relanza su error", () => {
    expect(source).toContain("const { error: finalStatusError } = await supabase.from(\"analyses\").update({");
    expect(source).toContain("if (finalStatusError) throw finalStatusError;");
  });

  it("la notificación fire-and-forget ocurre DESPUÉS de los 4 checks de error, nunca antes", () => {
    const lastErrorCheck = source.lastIndexOf("if (finalStatusError) throw finalStatusError;");
    const notification = source.indexOf("Fire notification", lastErrorCheck);
    expect(lastErrorCheck).toBeGreaterThan(0);
    expect(notification).toBeGreaterThan(lastErrorCheck);
  });
});

// ═══════════════════════════════════════════════════════════════
// Última corrección (Bloque 1E/Subbloque 2): contrato evidencia → sección.
// Cada SECTIONS.dataKeys debe corresponder a campos reales de
// NarrativeCalculationViewModel — verificado contra el archivo real de
// generate-narrative/index.ts, sin reimplementar SECTIONS aquí.
// ═══════════════════════════════════════════════════════════════

describe("revenue_analysis (C, D)", () => {
  it("C. recibe historical (además de projections/growth)", () => {
    expect(source).toContain('dataKeys: ["historical", "projections", "growth"],');
  });

  it("D. el prompt no exige una tendencia histórica que el período base no sustenta", () => {
    expect(source).toMatch(/El período base no constituye por sí solo una tendencia histórica/);
    expect(source).not.toMatch(/nivel absoluto de ingresos y evolución/);
  });
});

describe("cost_analysis (E)", () => {
  it("E. recibe historical y no exige un ratio/porcentaje nuevo no entregado", () => {
    expect(source).toContain('dataKeys: ["kpis", "historical"],');
    expect(source).not.toMatch(/composición de costos y peso relativo sobre ingresos/);
    expect(source).toMatch(/No calcules ningún porcentaje\/ratio nuevo/);
  });
});

describe("profitability_analysis (F)", () => {
  it("F. recibe sectorBenchmark para poder pedir comparación sectorial", () => {
    expect(source).toContain('dataKeys: ["kpis", "sectorBenchmark"],');
  });
});

describe("financial_structure (G)", () => {
  it("G. recibe historical además de netDebt/kpis", () => {
    expect(source).toContain('dataKeys: ["historical", "netDebt", "kpis"],');
    expect(source).toMatch(/No reconstruyas financial_debt_total a partir de sus componentes/);
  });
});

describe("benchmark_comparison (I)", () => {
  it("I. dataKeys contiene sectorBenchmark", () => {
    expect(source).toContain('dataKeys: ["kpis", "sectorBenchmark", "evEbitda", "evRevenue", "wacc", "betaLevered"],');
  });

  it("no se presenta como un método de valoración adicional", () => {
    expect(source).toMatch(/No llames a esta sección "valoración por múltiplos"/);
  });
});

describe("valuation_analysis — WACC sin pesos inventados (J, K)", () => {
  it("J. el prompt no exige construir el WACC paso a paso con pesos de capital no entregados", () => {
    expect(source).not.toMatch(/Construcción del WACC — Ke \(CAPM\), Kd, pesos — paso a paso/);
    expect(source).toMatch(/No reconstruyas ni infieras pesos de capital \(equity\/deuda\), tasas o supuestos/);
  });

  it("K. recibe costOfDebtAfterTax porque el prompt lo menciona explícitamente como componente posible", () => {
    expect(source).toMatch(/costOfDebtAfterTax si está disponible/);
    expect(source).toContain('dataKeys: ["enterpriseValue", "equityValue", "wacc", "costOfEquity", "costOfDebtAfterTax", "discountedTV", "evEbitda", "evRevenue", "terminalValue", "betaLevered", "netDebt", "evLow", "evHigh", "projections"],');
  });

  it("no calcula ni menciona un nuevo porcentaje de participación del valor terminal", () => {
    expect(source).toMatch(/No calcules ni menciones un porcentaje\/participación que no te fue entregado/);
    expect(source).not.toMatch(/discountedTV\s*\/\s*(vm\.)?enterpriseValue/);
  });
});
