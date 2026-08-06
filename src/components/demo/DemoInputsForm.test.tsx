// Pruebas dirigidas — Decisión 9 y Decisión 10A
// (docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md)
//
// Decisión 9: el cliente ya no debe ver controles para ajustar los 7
// supuestos canónicos (capexPct, wcPct, taxRate, terminalGrowth,
// riskFreeRate, erp, costOfDebt) — el servidor siempre los ignora
// (`_shared/financial-methodology.ts`, `editableByInput: false` en los 8).
//
// Decisión 10A: el formulario debe impedir ejecutar el análisis con
// ingresos <= 0, con un mensaje visible asociado al campo.

import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DemoInputsForm from "./DemoInputsForm";
import { DEFAULT_INPUTS, type FinancialInputs } from "@/lib/financial-engine";

function renderForm(initialInputs: FinancialInputs = { ...DEFAULT_INPUTS }) {
  const onRun = vi.fn();
  let currentInputs = initialInputs;
  // El propio componente dispara setInputs desde un useEffect en el montaje
  // inicial (no-op, { ...prev }) — rerenderFn empieza null para no invocar
  // rerender antes de que exista (evita el TDZ de `const { rerender } = render(...)`).
  let rerenderFn: ((ui: ReactElement) => void) | null = null;
  const setInputs = vi.fn((updater) => {
    currentInputs = typeof updater === "function" ? updater(currentInputs) : updater;
    rerenderFn?.(<DemoInputsForm inputs={currentInputs} setInputs={setInputs} onRun={onRun} />);
  });
  const { rerender } = render(<DemoInputsForm inputs={currentInputs} setInputs={setInputs} onRun={onRun} />);
  rerenderFn = rerender;
  return { onRun, setInputs, getInputs: () => currentInputs };
}

describe("Decisión 9 — controles de supuestos canónicos retirados del cliente", () => {
  const controlesRetirados = [
    /capex/i,
    /capital de trabajo/i,
    /tasa de impuestos/i,
    /crecimiento terminal/i,
    /tasa libre de riesgo/i,
    /prima de riesgo \(erp\)/i,
    /costo de deuda/i,
  ];

  it("ninguno de los 7 controles de supuestos canónicos aparece en el formulario", () => {
    renderForm();
    for (const pattern of controlesRetirados) {
      expect(screen.queryByText(pattern)).not.toBeInTheDocument();
    }
  });

  it("no queda ningún input con name/label asociado a capexPct, wcPct, taxRate, terminalGrowth, riskFreeRate, erp o costOfDebt", () => {
    renderForm();
    // Solo deben existir los inputs numéricos de los campos permitidos.
    const labels = screen.getAllByText(/./).map((el) => el.textContent);
    const textoCompleto = labels.join(" ").toLowerCase();
    expect(textoCompleto).not.toMatch(/capex \(% ingresos\)/);
    expect(textoCompleto).not.toMatch(/δ capital de trabajo/);
    expect(textoCompleto).not.toMatch(/tasa de impuestos \(%\)/);
    expect(textoCompleto).not.toMatch(/crecimiento terminal g \(%\)/);
    expect(textoCompleto).not.toMatch(/tasa libre de riesgo \(rf\)/);
    expect(textoCompleto).not.toMatch(/costo de deuda pre-tax/);
  });

  it("el cliente no puede modificar esos valores porque no existe ningún control para hacerlo", () => {
    renderForm();
    // Confirma que no hay ningún spinbutton adicional a los campos permitidos.
    const numericInputs = screen.getAllByRole("spinbutton");
    // Campos numéricos permitidos: revenue, costOfSales, opex, depreciation,
    // totalDebt, cash, equity, interestExpense, growth, ebitdaMargin,
    // diasMinCaja, equityWeight, debtWeight = 13.
    expect(numericInputs).toHaveLength(13);
  });

  it("el payload conserva el contrato: capexPct/wcPct/taxRate/terminalGrowth/riskFreeRate/erp/costOfDebt siguen presentes en inputs con sus valores por defecto, nunca alterados por el cliente", () => {
    const { getInputs } = renderForm();
    const inputs = getInputs();
    expect(inputs.capexPct).toBe(DEFAULT_INPUTS.capexPct);
    expect(inputs.wcPct).toBe(DEFAULT_INPUTS.wcPct);
    expect(inputs.taxRate).toBe(DEFAULT_INPUTS.taxRate);
    expect(inputs.terminalGrowth).toBe(DEFAULT_INPUTS.terminalGrowth);
    expect(inputs.riskFreeRate).toBe(DEFAULT_INPUTS.riskFreeRate);
    expect(inputs.erp).toBe(DEFAULT_INPUTS.erp);
    expect(inputs.costOfDebt).toBe(DEFAULT_INPUTS.costOfDebt);
  });

  it("el formulario conserva su funcionamiento: los campos permitidos (revenue, sector, growth) siguen editables", () => {
    const { getInputs } = renderForm();
    const revenueInput = screen.getByLabelText(/ingresos actuales/i);
    fireEvent.change(revenueInput, { target: { value: "9000000" } });
    expect(getInputs().revenue).toBe(9000000);

    const nameInput = screen.getByDisplayValue(DEFAULT_INPUTS.companyName);
    fireEvent.change(nameInput, { target: { value: "Empresa Prueba" } });
    expect(getInputs().companyName).toBe("Empresa Prueba");
  });

  it("no se altera el cálculo financiero: al ejecutar con datos válidos, onRun se llama con los supuestos canónicos intactos", () => {
    const { onRun, getInputs } = renderForm();
    fireEvent.click(screen.getByRole("button", { name: /ejecutar análisis completo/i }));
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(getInputs().capexPct).toBe(DEFAULT_INPUTS.capexPct);
    expect(getInputs().erp).toBe(DEFAULT_INPUTS.erp);
  });
});

describe("Decisión 10A — bloqueo de revenue <= 0", () => {
  it("ingresos iguales a cero: bloquea el envío y muestra el mensaje", () => {
    const { onRun } = renderForm({ ...DEFAULT_INPUTS, revenue: 0 });
    fireEvent.click(screen.getByRole("button", { name: /ejecutar análisis completo/i }));
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Los ingresos deben ser mayores que cero para ejecutar el análisis.");
  });

  it("el mensaje de error está asociado al campo de ingresos (accesibilidad)", () => {
    renderForm({ ...DEFAULT_INPUTS, revenue: 0 });
    fireEvent.click(screen.getByRole("button", { name: /ejecutar análisis completo/i }));
    const revenueInput = screen.getByLabelText(/ingresos actuales/i);
    expect(revenueInput).toHaveAttribute("aria-invalid", "true");
    expect(revenueInput).toHaveAttribute("aria-describedby", "demo-revenue-error");
  });

  it("ingresos negativos también bloquean el envío", () => {
    const { onRun } = renderForm({ ...DEFAULT_INPUTS, revenue: -100 });
    fireEvent.click(screen.getByRole("button", { name: /ejecutar análisis completo/i }));
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("valor positivo permitido: el envío procede y no muestra error", () => {
    const { onRun } = renderForm({ ...DEFAULT_INPUTS, revenue: 5_000_000 });
    fireEvent.click(screen.getByRole("button", { name: /ejecutar análisis completo/i }));
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("corregir el campo a un valor positivo después de un intento fallido limpia el error y permite ejecutar", () => {
    const { onRun, getInputs } = renderForm({ ...DEFAULT_INPUTS, revenue: 0 });
    fireEvent.click(screen.getByRole("button", { name: /ejecutar análisis completo/i }));
    expect(onRun).not.toHaveBeenCalled();

    const revenueInput = screen.getByLabelText(/ingresos actuales/i);
    fireEvent.change(revenueInput, { target: { value: "1000000" } });
    expect(getInputs().revenue).toBe(1000000);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ejecutar análisis completo/i }));
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("ausencia de regresión en el flujo normal: con los valores por defecto, el análisis se ejecuta sin fricción", () => {
    const { onRun } = renderForm();
    fireEvent.click(screen.getByRole("button", { name: /ejecutar análisis completo/i }));
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("el botón 'Restablecer' limpia también el error de ingresos", () => {
    renderForm({ ...DEFAULT_INPUTS, revenue: 0 });
    fireEvent.click(screen.getByRole("button", { name: /ejecutar análisis completo/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /restablecer/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
