import { describe, it, expect } from "vitest";
import { estimateCostUsd, ANTHROPIC_PRICING, OPENAI_PRICING } from "./pricing";

describe("pricing — tabla oficial vigente (verificada 2026-08-17)", () => {
  it("claude-sonnet-5: 2 USD input / 10 USD output por MTok", () => {
    expect(ANTHROPIC_PRICING["claude-sonnet-5"]).toEqual({ inputUsd: 2.0, outputUsd: 10.0 });
  });

  it("claude-opus-5: 5 USD input / 25 USD output por MTok", () => {
    expect(ANTHROPIC_PRICING["claude-opus-5"]).toEqual({ inputUsd: 5.0, outputUsd: 25.0 });
  });

  it("gpt-5.6-terra: 2 USD input / 12 USD output por MTok", () => {
    expect(OPENAI_PRICING["gpt-5.6-terra"]).toEqual({ inputUsd: 2.0, outputUsd: 12.0 });
  });

  it("gpt-5.6-sol: 5 USD input / 30 USD output por MTok", () => {
    expect(OPENAI_PRICING["gpt-5.6-sol"]).toEqual({ inputUsd: 5.0, outputUsd: 30.0 });
  });

  it("no incluye 'Luna' (no verificado para este pilot)", () => {
    expect(Object.keys(OPENAI_PRICING).some((k) => k.toLowerCase().includes("luna"))).toBe(false);
  });

  it("estimateCostUsd calcula correctamente para claude-sonnet-5", () => {
    // 1,000,000 input + 1,000,000 output => 2.0 + 10.0 = 12.0
    expect(estimateCostUsd("anthropic", "claude-sonnet-5", 1_000_000, 1_000_000)).toBeCloseTo(12.0);
  });

  it("estimateCostUsd calcula correctamente para gpt-5.6-terra", () => {
    // 1,000,000 input + 1,000,000 output => 2.0 + 12.0 = 14.0
    expect(estimateCostUsd("openai", "gpt-5.6-terra", 1_000_000, 1_000_000)).toBeCloseTo(14.0);
  });

  it("devuelve null para un modelo no listado, en vez de adivinar", () => {
    expect(estimateCostUsd("openai", "modelo-inexistente", 1000, 1000)).toBeNull();
  });

  it("devuelve null si faltan tokens (nunca inventa un número)", () => {
    expect(estimateCostUsd("anthropic", "claude-sonnet-5", null, 1000)).toBeNull();
  });
});
