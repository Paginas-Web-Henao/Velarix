// Fix período AI fallback — antes, parse-document/index.ts tomaba solo
// `Object.values(row.values)[0]` de cada fila devuelta por
// SYSTEM_PARSER_FALLBACK, descartando cualquier período adicional y
// persistiendo el único valor sobreviviente bajo la clave literal "col_1"
// (nunca un año real), lo que map-accounts interpretaba como si "col_1"
// fuera el período — y resolveBasePeriod lo rechazaba siempre por no ser
// YYYY, bloqueando el análisis sin importar cuántos períodos tuviera el
// documento. Estos tests prueban la explosión correcta (una ParsedRow por
// cuenta × período, igual convención que extraerExcel/extraerCSV) sin
// levantar Deno/Supabase.

import { describe, it, expect } from "vitest";
import { explodeAiFallbackRowByPeriod, normalizarNumero, UnmappedAiColumnError } from "./parse-document-ai-fallback";
import { resolveBasePeriod } from "./period-resolution";

describe("explodeAiFallbackRowByPeriod", () => {
  it("1. un período: headers ['Cuenta','2025'], values {col_1:100} -> una fila con periodo 2025 y valor 100", () => {
    const rows = explodeAiFallbackRowByPeriod("Ingresos", { col_1: 100 }, ["Cuenta", "2025"]);
    expect(rows).toEqual([{ valor: 100, periodo: "2025", columna: 0 }]);
  });

  it("2. dos períodos: headers ['Cuenta','2024','2025'], values {col_1:100,col_2:120} -> dos filas 2024=100 y 2025=120", () => {
    const rows = explodeAiFallbackRowByPeriod("Ingresos", { col_1: 100, col_2: 120 }, ["Cuenta", "2024", "2025"]);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.periodo === "2024")).toEqual({ valor: 100, periodo: "2024", columna: 0 });
    expect(rows.find((r) => r.periodo === "2025")).toEqual({ valor: 120, periodo: "2025", columna: 1 });
  });

  it("3. ausencia parcial: solo col_2 presente -> NO crea fila 2024, únicamente 2025=120", () => {
    const rows = explodeAiFallbackRowByPeriod("Deterioro de cartera", { col_2: 120 }, ["Cuenta", "2024", "2025"]);
    expect(rows).toEqual([{ valor: 120, periodo: "2025", columna: 1 }]);
    expect(rows.some((r) => r.periodo === "2024")).toBe(false);
  });

  it("4. negativo: el signo se preserva exactamente, tanto si llega como número como si llega como string con paréntesis", () => {
    const rowsNumero = explodeAiFallbackRowByPeriod("Resultado neto del ejercicio", { col_2: -52_300_000 }, ["Cuenta", "2024", "2025"]);
    expect(rowsNumero).toEqual([{ valor: -52_300_000, periodo: "2025", columna: 1 }]);

    const rowsString = explodeAiFallbackRowByPeriod("Resultado neto del ejercicio", { col_2: "(52.300.000)" }, ["Cuenta", "2024", "2025"]);
    expect(rowsString).toEqual([{ valor: -52_300_000, periodo: "2025", columna: 1 }]);
  });

  it("5. dos cuentas x dos períodos: 2024 y 2025 nunca se intercambian ni se mezclan entre cuentas", () => {
    const headers = ["Cuenta", "2024", "2025"];
    const revenue = explodeAiFallbackRowByPeriod("Ingresos", { col_1: 6_200_000_000, col_2: 6_850_000_000 }, headers);
    const costOfSales = explodeAiFallbackRowByPeriod("Costo de ventas", { col_1: 3_700_000_000, col_2: 4_050_000_000 }, headers);

    expect(revenue.find((r) => r.periodo === "2024")?.valor).toBe(6_200_000_000);
    expect(revenue.find((r) => r.periodo === "2025")?.valor).toBe(6_850_000_000);
    expect(costOfSales.find((r) => r.periodo === "2024")?.valor).toBe(3_700_000_000);
    expect(costOfSales.find((r) => r.periodo === "2025")?.valor).toBe(4_050_000_000);

    // Ningún valor de una cuenta aparece bajo el período de la otra.
    expect(revenue.find((r) => r.periodo === "2024")?.valor).not.toBe(3_700_000_000);
    expect(costOfSales.find((r) => r.periodo === "2025")?.valor).not.toBe(6_850_000_000);
  });

  it("6. columna sin header (fail-closed): col_2 presente pero column_headers no tiene posición 2 -> lanza UnmappedAiColumnError, no null ni año inventado", () => {
    expect(() => explodeAiFallbackRowByPeriod("Ingresos", { col_2: 120 }, ["Cuenta", "2024"])).toThrow(UnmappedAiColumnError);

    let caught: unknown = null;
    try {
      explodeAiFallbackRowByPeriod("Ingresos", { col_2: 120 }, ["Cuenta", "2024"]);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(UnmappedAiColumnError);
    expect((caught as UnmappedAiColumnError).columnKey).toBe("col_2");
    expect((caught as UnmappedAiColumnError).originalLabel).toBe("Ingresos");
  });

  it("column_headers vacío con valores presentes también falla cerrado (no hay ningún header)", () => {
    expect(() => explodeAiFallbackRowByPeriod("Ingresos", { col_1: 100 }, [])).toThrow(UnmappedAiColumnError);
  });

  it("col_0 (índice reservado a la columna de etiqueta) se ignora, nunca se trata como período", () => {
    const rows = explodeAiFallbackRowByPeriod("Ingresos", { col_0: 999, col_1: 100 }, ["Cuenta", "2025"]);
    expect(rows).toEqual([{ valor: 100, periodo: "2025", columna: 0 }]);
  });

  it("valor no numérico y no parseable no genera fila (no se fabrica un 0)", () => {
    const rows = explodeAiFallbackRowByPeriod("Ingresos", { col_1: "n/a" }, ["Cuenta", "2025"]);
    expect(rows).toEqual([]);
  });
});

describe("normalizarNumero — reubicada desde parse-document/index.ts, sin cambio de comportamiento", () => {
  it("preserva negativos entre paréntesis", () => {
    expect(normalizarNumero("(52.300.000)")).toBe(-52_300_000);
  });
  it("pasa through números ya numéricos", () => {
    expect(normalizarNumero(-52_300_000)).toBe(-52_300_000);
  });
  it("null/undefined/vacío -> null", () => {
    expect(normalizarNumero(null)).toBeNull();
    expect(normalizarNumero(undefined)).toBeNull();
    expect(normalizarNumero("")).toBeNull();
  });
});

describe("8. integración lógica — filas explotadas + resolveBasePeriod eligen 2025 sin mezclar años", () => {
  it("con 2024 y 2025 explotados desde AI fallback, resolveBasePeriod selecciona 2025 (latest_simple_fiscal_year)", () => {
    const headers = ["Cuenta", "2024", "2025"];
    const revenue = explodeAiFallbackRowByPeriod("Ingresos", { col_1: 400, col_2: 500 }, headers);
    const cash = explodeAiFallbackRowByPeriod("Caja", { col_1: 40, col_2: 50 }, headers);

    const periodosExplotados = [...revenue, ...cash].map((r) => r.periodo);
    const resolution = resolveBasePeriod(periodosExplotados);

    expect(resolution.ok).toBe(true);
    expect(resolution.basePeriod).toBe("2025");
    expect(resolution.selectionMode).toBe("latest_simple_fiscal_year");
    expect(resolution.availablePeriods).toEqual(["2024", "2025"]);
  });

  it("con un solo período explotado (2025), resolveBasePeriod ya no ve 'col_1' — ve '2025' real", () => {
    const rows = explodeAiFallbackRowByPeriod("Ingresos", { col_1: 100 }, ["Cuenta", "2025"]);
    const resolution = resolveBasePeriod(rows.map((r) => r.periodo));
    expect(resolution.ok).toBe(true);
    expect(resolution.basePeriod).toBe("2025");
    expect(resolution.selectionMode).toBe("single_explicit");
  });
});
