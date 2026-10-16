import { describe, it, expect } from "vitest";
import { evaluateAiFallbackText, AI_FALLBACK_MIN_TEXT_CHARS, DOCUMENT_TEXT_UNAVAILABLE } from "./document-text-gate";

const LEGIBLE = "Estado de resultados consolidado. Ingresos operacionales 2024 1.000.000 y 2023 900.000. Costo de ventas 2024 600.000. ".repeat(3);

describe("evaluateAiFallbackText — el fallback de IA solo recibe texto legible", () => {
  it("vacío, null o solo espacios → EMPTY", () => {
    for (const t of [null, undefined, "", "   \n\t "]) {
      const d = evaluateAiFallbackText(t);
      expect(d).toMatchObject({ allowed: false, code: DOCUMENT_TEXT_UNAVAILABLE, reason: "EMPTY" });
    }
  });

  it("texto legible pero por debajo del mínimo explícito → TOO_SHORT", () => {
    const d = evaluateAiFallbackText("Ventas 1.000 Costos 500");
    expect(d).toMatchObject({ allowed: false, reason: "TOO_SHORT" });
    expect(evaluateAiFallbackText("a".repeat(AI_FALLBACK_MIN_TEXT_CHARS - 1))).toMatchObject({ allowed: false, reason: "TOO_SHORT" });
  });

  it("bytes de un binario decodificados (NUL, controles, U+FFFD) → BINARY_CONTENT", () => {
    const pdfBinario = "%PDF-1.4\n" + Array.from({ length: 600 }, (_, i) => String.fromCharCode((i * 37) % 256)).join("");
    expect(evaluateAiFallbackText(pdfBinario)).toMatchObject({ allowed: false, reason: "BINARY_CONTENT" });
    expect(evaluateAiFallbackText(LEGIBLE + "�".repeat(20))).toMatchObject({ allowed: false, reason: "BINARY_CONTENT" });
    expect(evaluateAiFallbackText(LEGIBLE + "\u0000")).toMatchObject({ allowed: false, reason: "BINARY_CONTENT" });
  });

  it("texto largo pero mayoritariamente símbolos → LOW_QUALITY", () => {
    expect(evaluateAiFallbackText("#$%&*@!~^<>{}[]|/".repeat(20))).toMatchObject({ allowed: false, reason: "LOW_QUALITY" });
  });

  it("texto extraído legible y suficiente → permitido, normalizado", () => {
    const d = evaluateAiFallbackText(LEGIBLE);
    expect(d.allowed).toBe(true);
    if (d.allowed) expect(d.text).toBe(LEGIBLE.replace(/\s+/g, " ").trim());
  });

  it("el mensaje de rechazo es estable y no promete reconstrucción", () => {
    const d = evaluateAiFallbackText("");
    if (d.allowed) throw new Error("debía rechazar");
    expect(d.message).toContain(DOCUMENT_TEXT_UNAVAILABLE);
    expect(d.metrics).toEqual({ chars: 0, alnum_ratio: null, binary_ratio: null });
  });
});
