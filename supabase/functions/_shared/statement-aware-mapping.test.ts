import { describe, it, expect } from "vitest";
import { TAXONOMY, matchAccount } from "./account-taxonomy";
import {
  buildRuleMappings, matchAccountInContext, sectionSide, evaluateAiProposalForContextRows, BALANCE_SIDE, type SourceRow,
} from "./statement-aware-mapping";

// Filas con la forma del extractor multi-estado (cifras sintéticas).
const row = (label: string, values: Record<string, number>, statement?: string, section?: string | null, unit?: string): SourceRow => ({
  label, values, documentId: "d1", docType: "estados_financieros",
  ...(statement ? { statement, section: section ?? null, unit: unit ?? "monetaria", sheet: `${statement} sheet`, sourceLabel: label } : {}),
});
const mapped = (rows: SourceRow[]) => buildRuleMappings("a1", rows).map((d) => d.record);
const classified = (rows: SourceRow[]) => mapped(rows).filter((r) => r.canonical_account !== "unclassified");

describe("duplicados entre estados (income_statement vs cash_flow)", () => {
  const rows = [
    row("Net income", { "2024": 600 }, "income_statement", "Operating expenses:"),
    row("Net income", { "2024": 600 }, "cash_flow", "CASH FLOWS FROM OPERATING ACTIVITIES"),
  ];

  it("1. misma etiqueta + período en ambos estados: una sola homologación operacional de net_income", () => {
    expect(classified(rows).filter((r) => r.canonical_account === "net_income" && r.period === "2024")).toHaveLength(1);
  });

  it("2. la del estado de resultados conserva su homologación válida", () => {
    const ni = classified(rows).find((r) => r.canonical_account === "net_income")!;
    expect(ni).toMatchObject({ category: "income_statement", value: 600, confidence_score: "alta", ambiguity_flag: false });
  });

  it("3. la del flujo de caja conserva su lineage pero queda abierta: no suplanta ni se suma", () => {
    const cf = mapped(rows).find((r) => r.category === "cash_flow")!;
    expect(cf).toMatchObject({ canonical_account: "unclassified", value: 600, period: "2024", ambiguity_flag: true });
    expect(cf.mapping_notes).toMatch(/STATEMENT_INCOMPATIBLE/);
    expect(cf.mapping_notes).toMatch(/estado=cash_flow; sección="CASH FLOWS FROM OPERATING ACTIVITIES"/);
  });

  it("líneas de flujo con palabras de balance ('Cash provided by operating activities') no se vuelven cash", () => {
    expect(classified([row("Cash Provided By Operating Activities", { "2024": 700 }, "cash_flow", null)])).toEqual([]);
  });
});

describe("duplicados dentro del mismo estado y sección", () => {
  it("4. misma etiqueta en el balance con secciones distintas: se mantienen como filas distintas", () => {
    const r = mapped([
      row("Deferred income taxes", { "2024": 285 }, "balance_sheet", "Long-term assets:"),
      row("Deferred income taxes", { "2024": 11419 }, "balance_sheet", "Long-term liabilities:"),
    ]);
    expect(r.map((x) => x.value)).toEqual([285, 11419]);
    expect(r.map((x) => /sección="([^"]+)"/.exec(x.mapping_notes)![1])).toEqual(["Long-term assets:", "Long-term liabilities:"]);
  });

  it("5. la taxonomía tiene lado de balance: la sección distingue activo de patrimonio ('Equity method investment' en activos ≠ equity)", () => {
    expect(matchAccount("Equity method investment").canonical).toBe("equity"); // la regla genérica lo confundiría
    expect(matchAccountInContext({ label: "Equity method investment", statement: "balance_sheet", section: "Long-term assets:", unit: "monetaria" }))
      .toMatchObject({ canonical: null, rejection: "SECTION_INCOMPATIBLE" });
    expect(matchAccountInContext({ label: "Total shareholders' equity", statement: "balance_sheet", section: "SHAREHOLDERS' EQUITY", unit: "monetaria" }))
      .toMatchObject({ canonical: "equity", rejection: null });
    expect(sectionSide("LIABILITIES AND SHAREHOLDERS' EQUITY")).toBeNull(); // declara dos lados → no decide
    for (const k of Object.keys(TAXONOMY.balance_sheet)) expect(BALANCE_SIDE[k], k).toBeDefined();
  });

  it("6. sin cuenta canónica que soporte la distinción (impuesto diferido activo/pasivo): quedan abiertas, no se adivinan ni se netean", () => {
    const r = mapped([
      row("Deferred income taxes", { "2024": 285 }, "balance_sheet", "Long-term assets:"),
      row("Deferred income taxes", { "2024": 11419 }, "balance_sheet", "Long-term liabilities:"),
    ]);
    expect(r.every((x) => x.canonical_account === "unclassified")).toBe(true);
    expect(r).toHaveLength(2);
  });

  it("misma cuenta canónica + período + etiqueta repetida: todas quedan abiertas (DUPLICATE_LABEL_CONTEXT), nunca la primera", () => {
    const r = mapped([
      row("Total liabilities", { "2024": 4000 }, "balance_sheet", "Long-term liabilities:"),
      row("Total liabilities", { "2024": 4100 }, "balance_sheet", "Other liabilities:"),
    ]);
    expect(r.map((x) => x.canonical_account)).toEqual(["unclassified", "unclassified"]);
    expect(r.every((x) => /DUPLICATE_LABEL_CONTEXT/.test(x.mapping_notes))).toBe(true);
  });

  it("varias cuentas por substring dentro del estado → SUBSTRING_AMBIGUOUS (no gana la primera por orden)", () => {
    expect(matchAccountInContext({ label: "Total liabilities and shareholders' equity", statement: "balance_sheet", section: null, unit: "monetaria" }))
      .toMatchObject({ canonical: null, rejection: "SUBSTRING_AMBIGUOUS" });
  });
});

describe("unidades no monetarias", () => {
  it("7. unit=por_accion no entra en una cuenta canónica monetaria (aunque la etiqueta diga 'net income')", () => {
    const r = mapped([row("Net income per share", { "2024": 1.25 }, "income_statement", null, "por_accion")]);
    expect(r).toEqual([expect.objectContaining({ canonical_account: "unclassified", value: 1.25 })]);
    expect(r[0].mapping_notes).toMatch(/UNIT_NOT_MONETARY/);
  });

  it("8. unit=acciones no entra en una cuenta canónica monetaria", () => {
    const r = mapped([row("Weighted average shares — revenue participating", { "2024": 480000 }, "income_statement", null, "acciones")]);
    expect(r[0]).toMatchObject({ canonical_account: "unclassified", value: 480000 });
    expect(r[0].mapping_notes).toMatch(/UNIT_NOT_MONETARY/);
  });
});

describe("comportamiento conservado", () => {
  it("9. filas monetarias normales con contexto se homologan como antes (mismo canonical y score)", () => {
    const r = classified([
      row("Net sales", { "2024": 5000, "2023": 4500 }, "income_statement", "Revenues:"),
      row("Cost of sales", { "2024": 3000 }, "income_statement", null),
      row("Cash and cash equivalents", { "2024": 1200 }, "balance_sheet", "Current assets:"),
      row("Total assets", { "2024": 9000 }, "balance_sheet", "Long-term assets:"),
    ]);
    expect(r.map((x) => [x.canonical_account, x.period, x.value, x.confidence_score])).toEqual([
      ["revenue", "2023", 4500, "alta"], ["revenue", "2024", 5000, "alta"], ["cost_of_sales", "2024", 3000, "alta"],
      ["cash", "2024", 1200, "media"], ["total_assets", "2024", 9000, "alta"],
    ]);
  });

  it("10. filas legacy sin statement/section/unit: idéntico a la regla previa (matchAccount + categoría por doc_type)", () => {
    const legacy = [row("Ventas netas", { "2024": 100 }), row("Costo de ventas", { "2024": 60 }), row("Bancos", { "2024": 10 }), row("Caja", { "2024": 5 }), row("Cuenta rara", {}), row("Utilidad neta", { col_1: 7 })];
    expect(mapped(legacy)).toEqual([
      expect.objectContaining({ original_label: "Ventas netas", canonical_account: "revenue", category: "income_statement", period: "2024", value: 100, confidence_score: "alta", ambiguity_flag: false, mapping_notes: "Regla: revenue (0.95)" }),
      expect.objectContaining({ original_label: "Costo de ventas", canonical_account: "cost_of_sales", period: "2024" }),
      expect.objectContaining({ original_label: "Bancos", canonical_account: "cash", value: 10 }),
      expect.objectContaining({ original_label: "Caja", canonical_account: "cash", value: 5 }), // subcuentas: se consolidan como antes
      expect.objectContaining({ original_label: "Cuenta rara", canonical_account: "unclassified", category: "balance_sheet", period: null, value: null, ambiguity_flag: true, mapping_notes: "Regla: no clasificado (0.30)" }),
      expect.objectContaining({ original_label: "Utilidad neta", canonical_account: "net_income", period: "col_1", value: 7 }),
    ]);
  });

  it("filas de encabezado con contexto (sin valor) no generan homologaciones con período nulo", () => {
    expect(mapped([row("Current assets:", {}, "balance_sheet", "Current assets:")])).toEqual([]);
  });
});

describe("IA: solo clasifica, nunca resuelve un conflicto determinístico ni cambia valores", () => {
  const drafts = buildRuleMappings("a1", [
    row("Net income", { "2024": 600 }, "cash_flow", null),
    row("Short-term deposits", { "2024": 50 }, "balance_sheet", "Current assets:"),
    row("Deferred income taxes", { "2024": 285 }, "balance_sheet", "Long-term assets:"),
    row("Deferred income taxes", { "2024": 11419 }, "balance_sheet", "Long-term liabilities:"),
  ]);
  const byLabel = (l: string) => drafts.filter((d) => d.record.original_label === l);

  it("rechaza reclasificar una fila con conflicto de estado", () => {
    expect(evaluateAiProposalForContextRows(byLabel("Net income"), "net_income", 600)).toMatchObject({ accepted: false });
  });
  it("acepta clasificar una fila sin match si es compatible y conserva el valor", () => {
    expect(evaluateAiProposalForContextRows(byLabel("Short-term deposits"), "cash", 50)).toEqual({ accepted: true });
  });
  it("rechaza si cambia el valor, si la cuenta es de otro lado del balance, o si hay varias filas destino", () => {
    expect(evaluateAiProposalForContextRows(byLabel("Short-term deposits"), "cash", 55)).toMatchObject({ accepted: false });
    expect(evaluateAiProposalForContextRows(byLabel("Short-term deposits"), "accounts_payable", 50)).toMatchObject({ accepted: false });
    expect(evaluateAiProposalForContextRows(byLabel("Deferred income taxes"), "total_liabilities", 285)).toMatchObject({ accepted: false });
  });
});
