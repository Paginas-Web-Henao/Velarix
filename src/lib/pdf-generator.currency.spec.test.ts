// BL-04 (Bloque 1A → corregido en Bloque 1B-P0) — Prueba de
// especificación para el hallazgo R-03 / BL-04 ("El PDF siempre muestra
// 'USD'", docs/velarix/auditoria/04-*).
//
// Historia de esta prueba:
// - Bloque 1A (docs/velarix/bloque-1a/BL-30-evidencia-pruebas-especificacion.md):
//   se escribió con `test.fails()` porque el bug existía (fUSD hardcodeaba
//   "USD" incondicionalmente, pdf-generator.ts:85-86 en su versión de
//   entonces). Resultado registrado entonces: "1 expected fail".
// - Bloque 1B-P0: se corrigió `src/lib/pdf-generator.ts` (función
//   `formatMoneda(valor, currency)` paramétrica, ver `FinancialInputs.reportingCurrency`
//   en `financial-engine.ts`) y `src/pages/Dashboard.tsx` (pasa la moneda
//   real del `structured_input`). Esta prueba ahora es una prueba NORMAL
//   (sin `test.fails()`) y debe pasar.
//
// Sigue sin exportar las funciones internas de `pdf-generator.ts` para
// probarlas: se mockean las dependencias de terceros (`jspdf`,
// `jspdf-autotable`) y se captura cada cadena de texto que `generatePDF`
// intenta dibujar — la misma técnica de Bloque 1A, ahora usada para
// verificar el comportamiento correcto en vez de solo documentar el bug.

import { describe, test, expect, vi, beforeEach } from "vitest";
import type { AnalysisResult, FinancialInputs } from "./financial-engine";

const capturedTexts: string[] = [];
const capturedTableCells: string[] = [];

vi.mock("jspdf", () => {
  class FakeJsPDF {
    lastAutoTable: { finalY: number } | undefined;
    internal = { getNumberOfPages: () => 1 };

    constructor(_opts?: unknown) {}

    setFillColor(..._args: unknown[]) { return this; }
    setDrawColor(..._args: unknown[]) { return this; }
    setLineWidth(..._args: unknown[]) { return this; }
    setFont(..._args: unknown[]) { return this; }
    setFontSize(..._args: unknown[]) { return this; }
    setTextColor(..._args: unknown[]) { return this; }
    rect(..._args: unknown[]) { return this; }
    roundedRect(..._args: unknown[]) { return this; }
    line(..._args: unknown[]) { return this; }
    addPage() { return this; }
    setPage(_n: number) { return this; }
    splitTextToSize(text: string, _maxW: number) { return [text]; }
    text(value: string | string[], _x?: number, _y?: number, _opts?: unknown) {
      if (Array.isArray(value)) capturedTexts.push(...value);
      else capturedTexts.push(value);
      return this;
    }
    save(_fileName: string) { /* no-op: no descarga real en la prueba */ }
  }
  return { default: FakeJsPDF };
});

vi.mock("jspdf-autotable", () => {
  return {
    default: (doc: { lastAutoTable?: { finalY: number } }, options: { head?: unknown[][]; body?: unknown[][] }) => {
      const flatten = (rows?: unknown[][]) =>
        (rows || []).flat().map((c) => String(c));
      capturedTableCells.push(...flatten(options.head));
      capturedTableCells.push(...flatten(options.body));
      doc.lastAutoTable = { finalY: 100 };
    },
  };
});

async function renderAndCapture(inputsOverrides: Partial<FinancialInputs>) {
  capturedTexts.length = 0;
  capturedTableCells.length = 0;

  const { generatePDF } = await import("./pdf-generator");
  const { DEFAULT_INPUTS, runAnalysis } = await import("./financial-engine");

  const inputs: FinancialInputs = { ...DEFAULT_INPUTS, ...inputsOverrides };
  const result: AnalysisResult = runAnalysis(inputs);
  await generatePDF(result, inputs, "ejecutivo");

  return [...capturedTexts, ...capturedTableCells];
}

describe("BL-04 — formato de moneda paramétrico en el PDF (corregido en Bloque 1B-P0)", () => {
  beforeEach(() => {
    capturedTexts.length = 0;
    capturedTableCells.length = 0;
  });

  test("PDF en COP no contiene la etiqueta 'USD' en ningún texto", async () => {
    const allText = await renderAndCapture({
      companyName: "Empresa Colombiana de Prueba S.A.S.",
      sector: "Retail / Comercio",
      reportingCurrency: "COP",
    });
    const containsUSD = allText.some((t) => /\bUSD\b/.test(t));
    expect(containsUSD).toBe(false);
  });

  test("PDF en USD sí muestra la etiqueta 'USD'", async () => {
    const allText = await renderAndCapture({
      companyName: "Empresa con reporte en USD",
      sector: "Retail / Comercio",
      reportingCurrency: "USD",
    });
    const containsUSD = allText.some((t) => /\bUSD\b/.test(t));
    expect(containsUSD).toBe(true);
  });

  test("la fila 'Moneda del análisis' refleja la moneda real (COP)", async () => {
    const allText = await renderAndCapture({ reportingCurrency: "COP" });
    expect(allText).toContain("COP");
  });

  test("la fila 'Moneda del análisis' refleja la moneda real (USD)", async () => {
    const allText = await renderAndCapture({ reportingCurrency: "USD" });
    expect(allText).toContain("USD");
  });

  test("valores en COP muestran la etiqueta COP en las cifras formateadas (cobertura de los 44 usos previos de fUSD)", async () => {
    const allText = await renderAndCapture({ reportingCurrency: "COP" });
    const hasCOPFormattedValue = allText.some((t) => /\bCOP\s/.test(t));
    expect(hasCOPFormattedValue).toBe(true);
  });
});
