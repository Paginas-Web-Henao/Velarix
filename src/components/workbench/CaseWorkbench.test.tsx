// Cabecera del caso: metadata estructurado (migración 20261015180000).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({ analysis: null as Record<string, unknown> | null }));

vi.mock("./useCaseData", () => ({
  useCaseData: () => ({
    data: { analysis: state.analysis, calculation: { valuation: { enterpriseValue: 1668259651.2050533, equityValue: 920678902.2050533 } } },
    loading: false, error: null, reload: () => {},
  }),
}));
vi.mock("./CaseSections", () => {
  const S = () => null;
  return { EvidenceSection: S, UnderstandingSection: S, AccountsSection: S, QuestionsSection: S, JudgmentSection: S, ForecastSection: S, ValuationSection: S, ChallengeSection: S, OutputSection: S, AuditSection: S };
});

import CaseWorkbench from "./CaseWorkbench";

const BASE = { id: "a1", company_name: "Alpina Productos Alimenticios S.A.S. BIC", sector: "Alimentos y bebidas", moneda_analisis: "COP", status: "calculo_completo", updated_at: "2026-10-15T15:12:03Z" };

describe("cabecera del caso", () => {
  beforeEach(() => { state.analysis = null; });

  it("Alpina: período base, fecha de valoración y basis of value reales", () => {
    state.analysis = { ...BASE, valuation_date: "2024-12-31", base_period: "FY2024 (cierre 2024-12-31)", basis_of_value: "Market Value (IVS 102)" };
    render(<CaseWorkbench caseId="a1" tab="evidence" onTabChange={() => {}} onArchive={() => {}} />);
    expect(screen.getByText("período base FY2024 (cierre 2024-12-31)")).toBeTruthy();
    expect(screen.getByText("fecha de valoración 2024-12-31")).toBeTruthy();
    expect(screen.getByText("basis of value Market Value (IVS 102)")).toBeTruthy();
    expect(screen.getByText(/^EV 1\.668\.259\.651 · Equity 920\.678\.902$/)).toBeTruthy();
  });

  it("metadata null (caso legacy) no rompe: muestra guiones", () => {
    state.analysis = { ...BASE, valuation_date: null, base_period: null, basis_of_value: null };
    render(<CaseWorkbench caseId="a1" tab="evidence" onTabChange={() => {}} onArchive={() => {}} />);
    expect(screen.getByText("fecha de valoración —")).toBeTruthy();
    expect(screen.getByText("basis of value —")).toBeTruthy();
  });
});
