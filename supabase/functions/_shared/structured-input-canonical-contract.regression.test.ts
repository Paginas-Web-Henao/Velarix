// REGRESIÓN — CONTRATO CANÓNICO: PARALLEL CANONICAL REBUILD BUG.
//
// build-structured-input/index.ts y continuar-tras-revision/index.ts ya
// comparten `deriveCoreFinancialFields` para la derivación NUMÉRICA de los
// campos financieros, pero cada archivo seguía ensamblando su propio objeto
// `structuredInput` con un literal independiente — no existía un
// constructor compartido del PAYLOAD CANÓNICO completo. Fix: ambos caminos
// ahora llaman a `buildCanonicalStructuredInput` (ver
// `structured-input-builder.ts`), la única implementación pura del
// contrato v2.3.
//
// Este archivo fija dos cosas distintas, en dos bloques:
//
// 1. ARQUITECTURA — verificación estática mínima de que NINGUNA Edge
//    Function mantiene un constructor paralelo del payload ni reimplementa
//    directamente moneda/provenance: ambas delegan en el builder
//    compartido. No se prueba aquí "qué produce continuar-tras-revision"
//    campo por campo — eso dejaría de tener sentido en cuanto ambos caminos
//    comparten la misma función; probarlo así congelaría la duplicación en
//    vez de protegernos de ella.
//
// 2. CONTRATO — pruebas semánticas directas sobre `buildCanonicalStructuredInput`
//    (la función pura real, sin mocks) que fijan version, keys, balance_sheet,
//    provenance, moneda, quality_flags/validation_notes y created_at. Como
//    la arquitectura (1) garantiza que ambas Edge Functions llaman a esta
//    misma función, protegerla a ella protege a ambos caminos por igual —
//    sin necesitar invocar Deno/Supabase ni importar los `index.ts`.
//
// index.ts no puede importarse en Vitest: usa `serve()` de Deno std y URL
// imports de esm.sh/deno.land (mismo problema documentado en
// continuar-tras-revision.regression.test.ts).

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  buildCanonicalStructuredInput,
  CANONICAL_STRUCTURED_INPUT_VERSION,
  type CanonicalStructuredInputAccountRow,
  type CanonicalSnapshotInput,
} from "./structured-input-builder";

const buildSourcePath = path.resolve(__dirname, "../build-structured-input/index.ts");
const continuarSourcePath = path.resolve(__dirname, "../continuar-tras-revision/index.ts");
const buildSource = fs.readFileSync(buildSourcePath, "utf-8");
const continuarSource = fs.readFileSync(continuarSourcePath, "utf-8");

describe("ARQUITECTURA — ambas Edge Functions delegan en el builder canónico compartido, ninguna mantiene un constructor paralelo", () => {
  // Import multilínea tolerante: ambos archivos importan varios símbolos
  // (buildCanonicalStructuredInput, buildDefaultSnapshot,
  // CANONICAL_STRUCTURED_INPUT_VERSION) del mismo módulo — no se exige una
  // única línea exacta, solo que el símbolo y la ruta del módulo compartido
  // aparezcan en el mismo bloque de import.
  function importsSymbolFromBuilder(source: string, symbol: string): boolean {
    const importBlock = /import\s*\{([^}]*)\}\s*from\s*"\.\.\/_shared\/structured-input-builder\.ts";/.exec(source);
    return !!importBlock && new RegExp(`\\b${symbol}\\b`).test(importBlock[1]);
  }

  it("build-structured-input importa buildCanonicalStructuredInput desde _shared/structured-input-builder.ts", () => {
    expect(importsSymbolFromBuilder(buildSource, "buildCanonicalStructuredInput")).toBe(true);
  });

  it("continuar-tras-revision importa buildCanonicalStructuredInput desde _shared/structured-input-builder.ts", () => {
    expect(importsSymbolFromBuilder(continuarSource, "buildCanonicalStructuredInput")).toBe(true);
  });

  it("build-structured-input asigna el resultado del builder directamente a structuredInput (no lo envuelve en un objeto adicional)", () => {
    expect(buildSource).toMatch(/const structuredInput\s*=\s*buildCanonicalStructuredInput\(/);
  });

  it("continuar-tras-revision asigna el resultado del builder directamente a structuredInput (no lo envuelve en un objeto adicional)", () => {
    expect(continuarSource).toMatch(/const structuredInput\s*=\s*buildCanonicalStructuredInput\(/);
  });

  it("REGRESIÓN: build-structured-input ya no mantiene un constructor local del payload (patrón `const structuredInput = {`)", () => {
    expect(buildSource).not.toContain("const structuredInput = {");
  });

  it("REGRESIÓN: continuar-tras-revision ya no mantiene un constructor local del payload (patrón `const structuredInput = {`)", () => {
    expect(continuarSource).not.toContain("const structuredInput = {");
  });

  it("REGRESIÓN: ninguna Edge Function hardcodea version_input como literal — la única fuente de verdad es CANONICAL_STRUCTURED_INPUT_VERSION dentro del builder", () => {
    expect(buildSource).not.toMatch(/version_input\s*:\s*"[\d.]+"/);
    expect(continuarSource).not.toMatch(/version_input\s*:\s*"[\d.]+"/);
  });

  it("REGRESIÓN: continuar-tras-revision no reimplementa la conversión de moneda directamente — delega en el builder", () => {
    expect(continuarSource).not.toContain("computeTotalConversionFactor");
  });

  it("REGRESIÓN: continuar-tras-revision no reimplementa provenance directamente — delega en el builder", () => {
    expect(continuarSource).not.toContain("buildCalculationProvenance");
  });

  it("build-structured-input tampoco reimplementa moneda/provenance fuera del builder (misma regla, ambos lados)", () => {
    expect(buildSource).not.toContain("computeTotalConversionFactor");
    expect(buildSource).not.toContain("buildCalculationProvenance");
  });
});

describe("CONTRATO — buildCanonicalStructuredInput produce el payload v2.3 completo (protege a ambas Edge Functions por igual)", () => {
  const baseRows: CanonicalStructuredInputAccountRow[] = [
    { id: "row-revenue", document_id: "doc-1", canonical_account: "revenue", period: "2025", value: 1200000 },
    { id: "row-cogs", document_id: "doc-1", canonical_account: "cost_of_sales", period: "2025", value: 700000 },
    { id: "row-opex", document_id: "doc-1", canonical_account: "opex", period: "2025", value: 220000 },
    { id: "row-ni", document_id: "doc-1", canonical_account: "net_income", period: "2025", value: -50000 },
    { id: "row-cash", document_id: "doc-1", canonical_account: "cash", period: "2025", value: 300000 },
  ];

  const baseSnapshot: CanonicalSnapshotInput = {
    id: null,
    data_payload: { sector_data: { beta_unlevered: { value: 0.98 } } },
    macro_payload: { macro_colombia: { trm_avg: { value: 4080 } } },
  };

  function buildFixture(overrides: Partial<Parameters<typeof buildCanonicalStructuredInput>[0]> = {}) {
    return buildCanonicalStructuredInput({
      analysisId: "test-analysis-id",
      sector: "Servicios empresariales",
      expectedGrowth: 25,
      accounts: baseRows,
      basePeriod: "2025",
      periods: ["2025"],
      periodSelectionMode: "single_explicit",
      monedaAnalisis: "COP",
      monedaDocumento: "COP",
      scaleFactor: 1,
      exchangeRate: 4080,
      snapshot: baseSnapshot,
      structuredInputId: "struct-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      ...overrides,
    });
  }

  const REQUIRED_CANONICAL_KEYS = [
    "analysis_id",
    "created_at",
    "base_period",
    "periods",
    "income_statement",
    "balance_sheet",
    "quality_flags",
    "validation_notes",
    "sector",
    "moneda_analisis",
    "moneda_documento",
    "factor_conversion",
    "expected_growth",
    "snapshot_id",
    "snapshot_data",
    "macro_data",
    "provenance",
    "version_input",
  ];

  const REQUIRED_BALANCE_SHEET_KEYS = [
    "cash",
    "accounts_receivable",
    "inventory",
    "accounts_payable",
    "ppe",
    "current_financial_debt",
    "long_term_financial_debt",
    "financial_debt_total",
    "equity",
    "total_assets",
    "total_liabilities",
  ];

  it("A. version_input = 2.3, única fuente de verdad", () => {
    expect(CANONICAL_STRUCTURED_INPUT_VERSION).toBe("2.3");
    expect(buildFixture().version_input).toBe(CANONICAL_STRUCTURED_INPUT_VERSION);
  });

  it("B. contiene las 18 keys del contrato canónico", () => {
    const output = buildFixture();
    const missing = REQUIRED_CANONICAL_KEYS.filter((k) => !(k in output));
    expect(missing).toEqual([]);
  });

  it("C. balance_sheet contiene accounts_payable y todas las cuentas canónicas", () => {
    const output = buildFixture();
    const missing = REQUIRED_BALANCE_SHEET_KEYS.filter((k) => !(k in output.balance_sheet));
    expect(missing).toEqual([]);
  });

  it("D. provenance se construye con la misma lógica canónica (buildCalculationProvenance real, sin mocks)", () => {
    const output = buildFixture();
    expect(output.provenance.analysis_id).toBe("test-analysis-id");
    expect(output.provenance.structured_input_id).toBe("struct-1");
    expect(output.provenance.homologation_ids).toEqual(expect.arrayContaining(["row-revenue", "row-cash"]));
    expect(output.provenance.fields.revenue.source_status).toBe("complete");
  });

  it("created_at / snapshot_id / snapshot_data / macro_data presentes", () => {
    const output = buildFixture();
    expect(output.created_at).toBe("2026-01-01T00:00:00.000Z");
    expect(output.snapshot_id).toBeNull();
    expect(output.snapshot_data).toEqual(baseSnapshot.data_payload);
    expect(output.macro_data).toEqual(baseSnapshot.macro_payload);
  });

  it("F. quality_flags y validation_notes se derivan dinámicamente, nunca un placeholder estático", () => {
    const output = buildFixture();
    // Fixture sin inventory/accounts_receivable/interest_expense/ebitda observados:
    expect(output.quality_flags).toEqual(
      expect.arrayContaining(["sin_inventario_declarado", "sin_cartera_declarada", "sin_gastos_financieros", "ebitda_no_derivable"]),
    );
    expect(output.quality_flags).not.toEqual(["revisado_manualmente"]);
    expect(output.validation_notes).not.toEqual(["Cuentas corregidas por revisión manual"]);
  });

  it("E. semántica de moneda: factor_conversion != 1 se aplica realmente a los valores derivados", () => {
    const cop = buildFixture();
    const usd = buildFixture({ monedaDocumento: "USD", monedaAnalisis: "COP", scaleFactor: 1, exchangeRate: 4080 });

    expect(cop.factor_conversion).toBe(1);
    expect(usd.factor_conversion).toBe(4080);
    expect(usd.income_statement.revenue).toBe(cop.income_statement.revenue! * 4080);
    expect(usd.balance_sheet.cash).toBe(cop.balance_sheet.cash! * 4080);
  });

  it("balance_sheet: cuentas ausentes en accounts (equity, total_assets, total_liabilities, da, deuda) quedan null, nunca fabricadas", () => {
    const output = buildFixture();
    expect(output.income_statement.da).toBeNull();
    expect(output.income_statement.ebitda).toBeNull();
    expect(output.balance_sheet.equity).toBeNull();
    expect(output.balance_sheet.total_assets).toBeNull();
    expect(output.balance_sheet.total_liabilities).toBeNull();
    expect(output.balance_sheet.current_financial_debt).toBeNull();
    expect(output.balance_sheet.long_term_financial_debt).toBeNull();
    expect(output.balance_sheet.financial_debt_total).toBeNull();
    expect(output.income_statement.net_income).toBe(-50000);
    expect(output.income_statement.revenue).toBe(1200000);
    expect(output.balance_sheet.cash).toBe(300000);
  });
});
