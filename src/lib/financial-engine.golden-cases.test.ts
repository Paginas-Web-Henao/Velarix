// Bloque 1C-Prep — Pruebas financieras sobre los 3 casos dorados
// técnicos provisionales. Importa exactamente `runAnalysis` — la misma
// función que usa producción (Dashboard.tsx, DemoDashboard.tsx) — nunca
// una copia de sus fórmulas. Ver
// docs/velarix/bloque-1c/CASOS-DORADOS-PROVISIONALES.md y
// docs/velarix/bloque-1c/MATRIZ-DE-PRUEBAS-FINANCIERAS.md.
//
// Estado: "Caso dorado técnico provisional — pendiente de aprobación
// financiera." Ninguno de estos casos ni de estas pruebas fue aprobado
// por el fundador ni por un revisor financiero externo.

import { describe, it, expect, test } from "vitest";
import { runAnalysis, DEFAULT_INPUTS, type FinancialInputs } from "./financial-engine";
import { CASO_A_ESTABLE, CASO_B_ALTO_CRECIMIENTO, CASO_C_TENSIONADA } from "./financial-engine.golden-cases.fixtures";

const CASOS = {
  A: CASO_A_ESTABLE,
  B: CASO_B_ALTO_CRECIMIENTO,
  C: CASO_C_TENSIONADA,
};

describe("1. Identidad financiera básica", () => {
  it.each(Object.entries(CASOS))("Caso %s: margen bruto y margen EBITDA históricos son consistentes con revenue/costOfSales/opex/D&A", (_nombre, inputs) => {
    const r = runAnalysis(inputs);
    const grossMarginEsperado = ((inputs.revenue - inputs.costOfSales) / inputs.revenue) * 100;
    expect(r.kpis.grossMargin).toBeCloseTo(grossMarginEsperado, 6);
    // ebitdaMargin histórico se deriva de revenue/costOfSales/opex/D&A, no del input ebitdaMargin (que es un supuesto de proyección).
    const ebitda0Esperado = inputs.revenue - inputs.costOfSales - inputs.opex + inputs.depreciation;
    expect(r.kpis.ebitdaMargin).toBeCloseTo((ebitda0Esperado / inputs.revenue) * 100, 6);
  });
});

describe("2. Pesos de deuda y patrimonio", () => {
  it.each(Object.entries(CASOS))("Caso %s: betaLevered refleja la dirección del apalancamiento (debtWeight/equityWeight)", (_nombre, inputs) => {
    const r = runAnalysis(inputs);
    const deRatio = inputs.debtWeight / inputs.equityWeight;
    // Hamada: a mayor deRatio, mayor betaLevered relativo al beta del sector (siempre que taxRate<100).
    if (deRatio > 0) {
      expect(r.betaLevered).toBeGreaterThan(r.sectorBenchmark.beta * 0.999); // tolerancia de redondeo
    }
    expect(Number.isFinite(r.betaLevered)).toBe(true);
  });
});

describe("3. WACC", () => {
  it.each(Object.entries(CASOS))("Caso %s: WACC es finito, positivo, y queda entre costOfDebtAfterTax y costOfEquity", (_nombre, inputs) => {
    const r = runAnalysis(inputs);
    expect(Number.isFinite(r.wacc)).toBe(true);
    expect(r.wacc).toBeGreaterThan(0);
    // Un promedio ponderado siempre queda entre los dos componentes que promedia.
    const lo = Math.min(r.costOfEquity, r.costOfDebtAfterTax);
    const hi = Math.max(r.costOfEquity, r.costOfDebtAfterTax);
    expect(r.wacc).toBeGreaterThanOrEqual(lo - 1e-6);
    expect(r.wacc).toBeLessThanOrEqual(hi + 1e-6);
  });
});

describe("4. Flujo de caja libre (FCFF)", () => {
  it.each(Object.entries(CASOS))("Caso %s: cada fcff proyectado es consistente con sus propios componentes (nopat + D&A - capex - ΔWC)", (_nombre, inputs) => {
    const r = runAnalysis(inputs);
    for (const p of r.projections) {
      expect(p.fcff).toBeCloseTo(p.nopat + p.depreciation - p.capex - p.deltaWC, 6);
    }
  });
});

describe("5. Valor terminal", () => {
  it("Caso A: discountedTV es consistente con terminalValue descontado 5 años al WACC", () => {
    const r = runAnalysis(CASO_A_ESTABLE);
    const waccDecimal = r.wacc / 100;
    expect(r.discountedTV).toBeCloseTo(r.terminalValue / Math.pow(1 + waccDecimal, 5), 4);
  });
});

describe("6. Descuento a valor presente", () => {
  it("Caso A: cada discountedFcf es consistente con fcff descontado al año correspondiente", () => {
    const r = runAnalysis(CASO_A_ESTABLE);
    const waccDecimal = r.wacc / 100;
    for (const p of r.projections) {
      expect(p.discountedFcf).toBeCloseTo(p.fcff / Math.pow(1 + waccDecimal, p.year), 4);
    }
  });
});

describe("7. Enterprise value", () => {
  it.each(Object.entries(CASOS))("Caso %s: enterpriseValue = suma de discountedFcf (Y1-Y5) + discountedTV", (_nombre, inputs) => {
    const r = runAnalysis(inputs);
    const sumaDescontada = r.projections.reduce((s, p) => s + p.discountedFcf, 0);
    expect(r.enterpriseValue).toBeCloseTo(sumaDescontada + r.discountedTV, 2);
  });
});

describe("8. Equity value", () => {
  it.each(Object.entries(CASOS))("Caso %s: equityValue = max(enterpriseValue - netDebt, 0)", (_nombre, inputs) => {
    const r = runAnalysis(inputs);
    expect(r.equityValue).toBeCloseTo(Math.max(r.enterpriseValue - r.netDebt, 0), 2);
  });
});

describe("9. Deuda neta", () => {
  it.each(Object.entries(CASOS))("Caso %s: netDebt = totalDebt - cash", (_nombre, inputs) => {
    const r = runAnalysis(inputs);
    expect(r.netDebt).toBeCloseTo(inputs.totalDebt - inputs.cash, 6);
  });
});

describe("10. Sensibilidad a WACC", () => {
  it.each(Object.entries(CASOS))("Caso %s: evLow y evHigh acotan razonablemente enterpriseValue", (_nombre, inputs) => {
    const r = runAnalysis(inputs);
    if (r.evLow > 0 && r.evHigh > 0) {
      // evLow usa WACC+1% (EV menor), evHigh usa WACC-1% (EV mayor) -- ver financial-engine.ts:306-320.
      expect(r.evLow).toBeLessThanOrEqual(r.evHigh);
    }
  });
});

describe("11. Sensibilidad a crecimiento perpetuo", () => {
  it("Caso A: a igual WACC (waccDelta=0), un mayor crecimiento terminal no reduce el EV de la matriz de sensibilidad", () => {
    const r = runAnalysis(CASO_A_ESTABLE);
    const filaWacc0 = r.sensitivityMatrix.filter(c => c.waccDelta === 0).sort((a, b) => a.growthDelta - b.growthDelta);
    for (let i = 1; i < filaWacc0.length; i++) {
      if (filaWacc0[i - 1].ev > 0 && filaWacc0[i].ev > 0) {
        expect(filaWacc0[i].ev).toBeGreaterThanOrEqual(filaWacc0[i - 1].ev - 1e-6);
      }
    }
  });
});

describe("12. Manejo de EBITDA negativo (Caso C)", () => {
  it("Caso C: EBITDA histórico es negativo y el motor no produce NaN/Infinity en los resultados principales", () => {
    const ebitda0 = CASO_C_TENSIONADA.revenue - CASO_C_TENSIONADA.costOfSales - CASO_C_TENSIONADA.opex + CASO_C_TENSIONADA.depreciation;
    expect(ebitda0).toBeLessThan(0);

    const r = runAnalysis(CASO_C_TENSIONADA);
    expect(Number.isFinite(r.enterpriseValue)).toBe(true);
    expect(Number.isFinite(r.wacc)).toBe(true);
    expect(Number.isFinite(r.equityValue)).toBe(true);
    // leverage se define como 0 cuando ebitda0 <= 0 (clamp existente, financial-engine.ts:363).
    expect(r.kpis.leverage).toBe(0);
  });
});

describe("13. Patrimonio negativo (Caso C)", () => {
  it("Caso C: patrimonio negativo -> ROE se recorta a 0, ROA queda finito, no hay división por cero silenciosa", () => {
    expect(CASO_C_TENSIONADA.equity).toBeLessThan(0);
    const r = runAnalysis(CASO_C_TENSIONADA);
    // roe se define como 0 cuando equity <= 0 (clamp existente, financial-engine.ts:359).
    expect(r.kpis.roe).toBe(0);
    expect(Number.isFinite(r.kpis.roa)).toBe(true);
  });
});

describe("14. Datos insuficientes / 15. Prevención de NaN e Infinity", () => {
  test.fails("especificación: revenue=0 no debería producir márgenes en Infinity/NaN (falla hoy — limitación conocida, ver DECISIONES-FINANCIERAS-PENDIENTES.md)", () => {
    const inputs: FinancialInputs = { ...DEFAULT_INPUTS, revenue: 0 };
    const r = runAnalysis(inputs);
    // Evidencia real (verificada ejecutando la prueba): con revenue=0,
    // enterpriseValue/wacc quedan en 0 (finitos, pero un resultado
    // silenciosamente engañoso — una empresa con revenue 0 no vale
    // "exactamente 0" de forma confiable, es un dato insuficiente, no
    // una valoración). Los márgenes históricos SÍ quedan en Infinity/NaN,
    // porque dividen directamente por `inputs.revenue` sin ningún clamp
    // (financial-engine.ts: grossMargin/ebitdaMargin/ebitMargin/netMargin).
    // El servidor lanza un error explícito ante revenue=0
    // (ejecutar-calculo/index.ts:101); el cliente no — divergencia ya
    // documentada en BL-26 sección 5, no resuelta silenciosamente aquí
    // (no se decidió si el cliente debería lanzar error, devolver null,
    // o degradar con aviso — ver DECISIONES-FINANCIERAS-PENDIENTES.md).
    expect(Number.isFinite(r.kpis.grossMargin)).toBe(true);
    expect(Number.isFinite(r.kpis.ebitdaMargin)).toBe(true);
    expect(Number.isFinite(r.kpis.ebitMargin)).toBe(true);
    expect(Number.isFinite(r.kpis.netMargin)).toBe(true);
  });

  it("evidencia: revenue=0 hoy produce márgenes no finitos (registro del comportamiento actual, no un criterio de corrección)", () => {
    const inputs: FinancialInputs = { ...DEFAULT_INPUTS, revenue: 0 };
    const r = runAnalysis(inputs);
    const algunMargenNoFinito = [r.kpis.grossMargin, r.kpis.ebitdaMargin, r.kpis.ebitMargin, r.kpis.netMargin]
      .some((v) => !Number.isFinite(v));
    expect(algunMargenNoFinito).toBe(true);
    // enterpriseValue/wacc, en cambio, quedan en un valor finito (0) hoy
    // -- no crashean, pero son un resultado silenciosamente incorrecto.
    expect(r.enterpriseValue).toBe(0);
  });
});
