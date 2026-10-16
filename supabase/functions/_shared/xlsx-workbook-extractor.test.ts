import { describe, it, expect } from "vitest";
import {
  detectDeclaredScale, classifyStatementSheet, parseCloseDate, classifyDuration, unitOfLabel,
  extractFinancialStatementsWorkbook, DeclaredScaleConflictError, type SheetInput,
} from "./xlsx-workbook-extractor";

// Libro sintético con la forma de un Financial_Report.xlsx de EDGAR (ninguna cifra es real).
const merge = (r0: number, c0: number, r1: number, c1: number) => ({ s: { r: r0, c: c0 }, e: { r: r1, c: c1 } });
const BALANCE: SheetInput = {
  name: "Consolidated Balance Sheets",
  matrix: [
    ["Consolidated Balance Sheets - USD ($) $ in Thousands", "Dec. 31, 2024", "Dec. 31, 2023"],
    ["Current assets:", " ", " "],
    ["Cash and cash equivalents", 1200, 1100],
    ["Total assets", 9000, 8500],
    ["Total liabilities", 4000, 3900],
    ["Related Party [Member]", " ", " "],
    ["Other current liabilities", 70, 60],
  ],
};
const OPERATIONS: SheetInput = {
  name: "Consolidated Statements of Oper",
  matrix: [
    ["Consolidated Statements of Operations - USD ($) $ in Thousands", "12 Months Ended", null, null],
    [null, "Dec. 31, 2024", "Dec. 31, 2023", "Dec. 31, 2022"],
    ["Net sales", 5000, 4500, 4000],
    ["Net income", 600, 550, 500],
    ["Basic income per share", 1.25, 1.1, 1.0],
    ["Basic weighted average common shares outstanding", 480000, 500000, 500000],
  ],
  merges: [merge(0, 1, 0, 3)],
};
const CASH: SheetInput = {
  name: "Consolidated Statements of Cash",
  matrix: [
    ["Consolidated Statements of Cash Flows - USD ($) $ in Thousands", "12 Months Ended", null, null],
    [null, "Dec. 31, 2024", "Dec. 31, 2023", "Dec. 31, 2022"],
    ["Net cash provided by operating activities", 700, 650, 600],
    ["Purchases of property and equipment", -300, -280, -250],
  ],
  merges: [merge(0, 1, 0, 3)],
};
const PARENTHETICAL: SheetInput = { name: "Consolidated Balance Sheets (Pa", matrix: [["Consolidated Balance Sheets (Parenthetical) - $ / shares", "Dec. 31, 2024"], ["Par value", 0.0001]] };
const DETAILS: SheetInput = { name: "Schedule of Inventories (Detail", matrix: [["Schedule of Inventories (Details) - USD ($) $ in Thousands", "Dec. 31, 2024"], ["Raw materials", 10]] };
const POLICIES: SheetInput = { name: "Basis of Presentation (Policies)", matrix: [["Basis of Presentation (Policies)", "12 Months Ended"], [null, "Dec. 31, 2024"]] };
const EQUITY: SheetInput = { name: "Consolidated Statements of Shar", matrix: [["Consolidated Statements of Shareholders' Equity - USD ($) $ in Thousands", "Common Stock [Member]", "Total"], ["Balance at Dec. 31, 2023", 5, 100]] };
const COVER: SheetInput = { name: "Cover", matrix: [["Cover - USD ($)", "12 Months Ended"], [null, "Dec. 31, 2024"], ["Document Type", "10-K"]] };
const WORKBOOK = [COVER, BALANCE, PARENTHETICAL, OPERATIONS, EQUITY, CASH, POLICIES, DETAILS];

describe("detectDeclaredScale — la escala declarada se reconoce explícitamente", () => {
  it.each([
    ["Consolidated Balance Sheets - USD ($) $ in Thousands", 1_000],
    ["$ in Thousands", 1_000],
    ["USD in Thousands", 1_000],
    ["in thousands", 1_000],
    ["  IN   THOUSANDS ", 1_000],
    ["Statement - USD ($) $ in Millions", 1_000_000],
    ["$ in Millions", 1_000_000],
    ["USD in Millions", 1_000_000],
    ["in Millions", 1_000_000],
    ["Estado de resultados — cifras en millones de pesos", 1_000_000],
    ["Balance general (miles de pesos)", 1_000],
  ])("%s → %d", (text, factor) => {
    expect(detectDeclaredScale(text)?.factor).toBe(factor);
  });

  it("acciones y enteros no son escala monetaria; '$ / shares in Units' tampoco", () => {
    expect(detectDeclaredScale("USD ($) $ / shares in Units, shares in Thousands")).toBeNull();
    expect(detectDeclaredScale("Details $ in Thousands, Integer in Millions")?.factor).toBe(1_000);
    expect(detectDeclaredScale("shares in Thousands, $ in Millions")?.factor).toBe(1_000_000);
  });

  it("sin declaración → null (la inferencia por magnitud queda a cargo del handler)", () => {
    expect(detectDeclaredScale("Estado de resultados 2024")).toBeNull();
    expect(detectDeclaredScale("")).toBeNull();
  });

  it("dos escalas monetarias distintas en el mismo encabezado → conflicto, no se elige una", () => {
    expect(() => detectDeclaredScale("$ in Thousands; $ in Millions")).toThrow(DeclaredScaleConflictError);
  });
});

describe("classifyStatementSheet — estados principales por título/nombre normalizado", () => {
  it.each([
    ["Balance Sheet", "balance_sheet"], ["Consolidated Balance Sheets", "balance_sheet"],
    ["Statement of Financial Position", "balance_sheet"], ["Consolidated Statements of Financial Position", "balance_sheet"],
    ["Statement of Operations", "income_statement"], ["Consolidated Statements of Operations", "income_statement"],
    ["Income Statement", "income_statement"], ["Statement of Income", "income_statement"], ["Statements of Income", "income_statement"],
    ["Profit and Loss", "income_statement"], ["Statement of Comprehensive Income", "income_statement"],
    ["Consolidated Statements of Operations and Comprehensive Income", "income_statement"],
    ["Statement of Cash Flows", "cash_flow"], ["Consolidated Statements of Cash Flows", "cash_flow"], ["Cash Flow Statement", "cash_flow"],
    ["Consolidated Statements of Shareholders' Equity", "equity"],
  ])("%s → %s", (title, cat) => {
    expect(classifyStatementSheet("Sheet1", title)).toBe(cat);
  });

  it("usa el título cuando la pestaña está truncada a 31 caracteres", () => {
    expect(classifyStatementSheet("Consolidated Statements of Oper", "Consolidated Statements of Operations and Comprehensive Income - USD ($) $ in Thousands")).toBe("income_statement");
  });

  it.each([
    ["Consolidated Balance Sheets (Pa", "Consolidated Balance Sheets (Parenthetical) - $ / shares"],
    ["Basis of Presentation (Policies)", "Basis of Presentation (Policies)"],
    ["Income Taxes (Tables)", "Income Taxes (Tables)"],
    ["Schedule of Inventories (Detail", "Schedule of Inventories (Details) - USD ($) $ in Thousands"],
    ["Debt (Details Narrative)", "Debt (Details Narrative) - USD ($) $ in Thousands"],
    ["Cover", "Cover - USD ($)"],
  ])("no es estado principal: %s", (name, title) => {
    expect(classifyStatementSheet(name, title)).toBeNull();
  });
});

describe("períodos — solo se resuelve FY con contexto anual explícito", () => {
  it.each([
    ["Dec. 31, 2024", { y: 2024, m: 12, d: 31 }], ["December 31, 2024", { y: 2024, m: 12, d: 31 }],
    ["31 Dec 2024", { y: 2024, m: 12, d: 31 }], ["2024-12-31", { y: 2024, m: 12, d: 31 }], ["Jun. 30, 2025", { y: 2025, m: 6, d: 30 }],
  ])("parseCloseDate(%s)", (label, expected) => {
    expect(parseCloseDate(label)).toEqual(expected);
  });

  it("formatos no reconocidos → null (no se adivina)", () => {
    expect(parseCloseDate("Q4 2024")).toBeNull();
    expect(parseCloseDate("LTM Jun-2025")).toBeNull();
  });

  it("duraciones: 12 meses/año = anual; 3/6/9 meses, trimestre, LTM = interino", () => {
    expect(classifyDuration("12 Months Ended")).toBe("annual");
    expect(classifyDuration("Year Ended")).toBe("annual");
    for (const d of ["3 Months Ended", "6 Months Ended", "9 Months Ended", "Three Months Ended", "Quarter Ended", "LTM"]) expect(classifyDuration(d)).toBe("interim");
    expect(classifyDuration(null)).toBeNull();
  });
});

describe("extractFinancialStatementsWorkbook — libro SEC sintético", () => {
  const out = extractFinancialStatementsWorkbook(WORKBOOK)!;

  it("procesa balance + resultados + flujo de caja (una vez cada hoja); patrimonio se detecta sin extraer", () => {
    expect(out.sheets.map((s) => [s.sheet, s.category])).toEqual([
      ["Consolidated Balance Sheets", "balance_sheet"],
      ["Consolidated Statements of Oper", "income_statement"],
      ["Consolidated Statements of Cash", "cash_flow"],
    ]);
    expect(out.detected_not_extracted.map((s) => s.category)).toEqual(["equity"]);
    expect(new Set(out.filas.map((f) => f.hoja))).toEqual(new Set(out.sheets.map((s) => s.sheet)));
  });

  it("no selecciona Parenthetical, Policies, Details ni Cover", () => {
    const hojas = new Set(out.filas.map((f) => f.hoja));
    for (const s of [PARENTHETICAL, POLICIES, DETAILS, COVER, EQUITY]) expect(hojas.has(s.name)).toBe(false);
  });

  it("valores CRUDOS del archivo + escala declarada común ($ in Thousands → 1000)", () => {
    expect(out.declaredScale).toMatchObject({ name: "thousands", factor: 1_000, text: "$ in Thousands" });
    const cash = out.filas.filter((f) => f.texto === "Cash and cash equivalents").map((f) => [f.periodo, f.valor]);
    expect(cash).toEqual([["2024", 1200], ["2023", 1100]]);
  });

  it("'Dec. 31, 2024' bajo '12 Months Ended' → 2024; el balance resuelve por cierre anual del mismo libro", () => {
    expect(out.sheets.map((s) => s.periods)).toEqual([["2024", "2023"], ["2024", "2023", "2022"], ["2024", "2023", "2022"]]);
    expect(out.sheets.every((s) => s.unresolved_periods.length === 0)).toBe(true);
    expect(out.column_headers).toEqual(["2024", "2023", "2022"]);
    const ni = out.filas.find((f) => f.texto === "Net income" && f.periodo === "2022")!;
    expect(ni.periodo_etiqueta).toBe("12 Months Ended Dec. 31, 2022");
  });

  it("secciones dimensionales [Member] no son partidas principales (se excluyen y se registran)", () => {
    expect(out.filas.some((f) => f.texto === "Other current liabilities")).toBe(false);
    expect(out.sheets[0]).toMatchObject({ dimensional_rows_excluded: 1, dimensional_members: ["Related Party [Member]"] });
  });

  it("source_section: el encabezado sin valores más cercano anterior, literal; uno nuevo sustituye al anterior", () => {
    const bs: SheetInput = { name: "Balance Sheet", matrix: [
      ["Balance Sheet - USD ($) $ in Thousands", "Dec. 31, 2024"],
      ["Current assets:", " "], ["Cash", 10],
      ["Long-term assets:", " "], ["Deferred income taxes", 3],
      ["Long-term liabilities:", " "], ["Deferred income taxes", 7],
      ["Related Party [Member]", " "], ["Other current liabilities", 1],
    ] };
    const res = extractFinancialStatementsWorkbook([bs, OPERATIONS])!;
    const rows = res.filas.filter((f) => f.hoja === "Balance Sheet" && f.valor !== null).map((f) => [f.texto, f.valor, f.seccion]);
    expect(rows).toEqual([["Cash", 10, "Current assets:"], ["Deferred income taxes", 3, "Long-term assets:"], ["Deferred income taxes", 7, "Long-term liabilities:"]]);
    // Antes del primer encabezado no hay sección: no se infiere.
    expect(out.filas.find((f) => f.texto === "Net sales")?.seccion).toBeNull();
  });

  it("EPS y número de acciones quedan marcados por unidad (la escala monetaria no es suya)", () => {
    expect(out.filas.find((f) => f.texto === "Basic income per share")?.unidad).toBe("por_accion");
    expect(out.filas.find((f) => f.texto.startsWith("Basic weighted average"))?.unidad).toBe("acciones");
    expect(unitOfLabel("Net sales")).toBe("monetaria");
    expect(unitOfLabel("Preferred shares, $0.0001 par value, 1,000,000 shares authorized")).toBe("monetaria");
  });

  it("'3 Months Ended Dec. 31, 2024' NO se convierte en FY2024: queda literal y no resuelto", () => {
    const q = (s: SheetInput): SheetInput => ({ ...s, matrix: s.matrix.map((r, i) => (i === 0 ? r.map((c) => (c === "12 Months Ended" ? "3 Months Ended" : c)) : r)) });
    const res = extractFinancialStatementsWorkbook([BALANCE, q(OPERATIONS), q(CASH)])!;
    const ops = res.sheets.find((s) => s.category === "income_statement")!;
    expect(ops.periods).toEqual([]);
    expect(ops.unresolved_periods).toContain("3 Months Ended Dec. 31, 2024");
    expect(res.filas.find((f) => f.texto === "Net income")?.periodo).toBe("3 Months Ended Dec. 31, 2024");
    // Sin un cierre de 12 meses en el libro, la fecha del balance tampoco se convierte en FY.
    expect(res.sheets.find((s) => s.category === "balance_sheet")!.unresolved_periods).toEqual(["Dec. 31, 2024", "Dec. 31, 2023"]);
  });

  it("escalas declaradas distintas (o ausentes) entre hojas seleccionadas → fail-closed", () => {
    const millones: SheetInput = { ...CASH, matrix: CASH.matrix.map((r, i) => (i === 0 ? [String(r[0]).replace("Thousands", "Millions"), ...r.slice(1)] : r)) };
    expect(() => extractFinancialStatementsWorkbook([BALANCE, OPERATIONS, millones])).toThrow(DeclaredScaleConflictError);
    const sinEscala: SheetInput = { ...CASH, matrix: CASH.matrix.map((r, i) => (i === 0 ? ["Consolidated Statements of Cash Flows", ...r.slice(1)] : r)) };
    expect(() => extractFinancialStatementsWorkbook([BALANCE, OPERATIONS, sinEscala])).toThrow(DeclaredScaleConflictError);
  });

  it("con menos de dos estados principales → null (ruta clásica de una hoja)", () => {
    expect(extractFinancialStatementsWorkbook([BALANCE, PARENTHETICAL, DETAILS])).toBeNull();
    expect(extractFinancialStatementsWorkbook([{ name: "Hoja1", matrix: [["Cuenta", "2024"], ["Ventas", 100]] }])).toBeNull();
  });

  it("libro sin escala declarada y con encabezados de año simples: valores crudos, sin escala, períodos 'YYYY'", () => {
    const res = extractFinancialStatementsWorkbook([
      { name: "Estado de Resultados", matrix: [["Estado de resultados", "2024", "2023"], ["Ingresos", 100, 90]] },
      { name: "Balance General", matrix: [["Balance general", "2024", "2023"], ["Activos totales", 500, 450]] },
    ])!;
    expect(res.declaredScale).toBeNull();
    expect(res.column_headers).toEqual(["2024", "2023"]);
    expect(res.filas.filter((f) => f.texto === "Ingresos").map((f) => f.valor)).toEqual([100, 90]);
  });
});
