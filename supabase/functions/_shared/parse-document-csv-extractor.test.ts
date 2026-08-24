// Bug pérdida de cuenta en CSV de una sola columna — evidencia remota real:
// el fixture sintético (prosa, sin separador real) perdía la fila
// "Ingresos" porque extraerCSV() confundía esa línea de DATOS con un
// encabezado, solo porque contenía un año (2024) embebido en su texto. Ver
// comentario en parse-document-csv-extractor.ts para el detalle completo.

import { describe, it, expect } from "vitest";
import { extraerCSV, normalizarTexto } from "./parse-document-csv-extractor";

const toBytes = (texto: string): Uint8Array => new TextEncoder().encode(texto);

const FIXTURE_TERRA_TEST = `Reporte sintetico de prueba — Empresa Terra Test S.A.S.
Documento generado exclusivamente para validar el proveedor Terra de parse-document. Ninguna cifra es real.

Ingresos 2024: 1.000.000. Ingresos 2025: 1.200.000.
Costo de ventas 2024: 600.000. Costo de ventas 2025: 700.000.
Gastos operativos 2024: 200.000. Gastos operativos 2025: 220.000.
Resultado neto del ejercicio 2025: (50.000).
Caja 2025: 300.000.`;

describe("extraerCSV — fixture sintético de una sola columna (evidencia remota real)", () => {
  it("1. la línea 'Ingresos' NO se confunde con encabezado: sobrevive como fila, no se descarta", () => {
    const { filas } = extraerCSV(toBytes(FIXTURE_TERRA_TEST));
    const filaIngresos = filas.find((f) => /ingresos/i.test(f.texto));
    expect(filaIngresos).toBeDefined();
  });

  it("2. el texto reconstruido a partir de filas (equivalente a textoPlano) contiene 'Ingresos' y sus cifras — esto es lo que llega a SYSTEM_PARSER_FALLBACK", () => {
    const { filas } = extraerCSV(toBytes(FIXTURE_TERRA_TEST));
    const textoPlano = filas.map((f) => `${f.texto} ${f.valor_raw || ""}`).join("\n");
    expect(textoPlano).toMatch(/ingresos/i);
    expect(textoPlano).toContain("1.000.000");
    expect(textoPlano).toContain("1.200.000");
  });

  it("3. las demás cuentas (Costo de ventas, Gastos operativos, Resultado neto, Caja) siguen sobreviviendo", () => {
    const { filas } = extraerCSV(toBytes(FIXTURE_TERRA_TEST));
    const labels = filas.map((f) => f.texto).join(" | ");
    expect(labels).toMatch(/costo de ventas/i);
    expect(labels).toMatch(/gastos operativos/i);
    expect(labels).toMatch(/resultado neto/i);
    expect(labels).toMatch(/caja/i);
  });

  it("no se detecta ningún encabezado real en este documento (prosa de una sola columna, sin años en columna >1) — column_headers vacío", () => {
    const { metadatos } = extraerCSV(toBytes(FIXTURE_TERRA_TEST));
    expect(metadatos.column_headers).toEqual([]);
  });
});

describe("extraerCSV — no regresiona la detección de encabezado real en CSV tabular genuino", () => {
  it("un CSV tabular real ('Cuenta,2024,2025') sigue detectando el encabezado y explotando por período, sin cambios", () => {
    const csvTabular = "Cuenta,2024,2025\nIngresos,1000000,1200000\nCosto de ventas,600000,700000\n";
    const { filas, metadatos } = extraerCSV(toBytes(csvTabular));

    expect(metadatos.column_headers).toEqual(["Cuenta", "2024", "2025"]);

    const ingresos2024 = filas.find((f) => f.texto === "Ingresos" && f.periodo === "2024");
    const ingresos2025 = filas.find((f) => f.texto === "Ingresos" && f.periodo === "2025");
    expect(ingresos2024?.valor).toBe(1000000);
    expect(ingresos2025?.valor).toBe(1200000);
  });

  it("un encabezado tabular con año en la primera columna sigue siendo detectado igual (regresión de forma)", () => {
    const csvTabular = "2024,2025\n1000000,1200000\n";
    const { metadatos } = extraerCSV(toBytes(csvTabular));
    expect(metadatos.column_headers).toEqual(["2024", "2025"]);
  });
});

describe("normalizarTexto — reubicada desde parse-document/index.ts, sin cambio de comportamiento", () => {
  it("preserva un label de prosa con año embebido tal cual (solo trim, sin alterar dígitos internos)", () => {
    expect(normalizarTexto("Ingresos 2024: 1.000.000. Ingresos 2025: 1.200.000.")).toBe(
      "Ingresos 2024: 1.000.000. Ingresos 2025: 1.200.000.",
    );
  });
  it("null/vacío -> string vacío", () => {
    expect(normalizarTexto(null)).toBe("");
  });
});
