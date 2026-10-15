// TERMINAL REINVESTMENT CHECK (04 §8/§11, P-07/P-09): validación
// DETERMINÍSTICA sobre un cálculo ya persistido — no es Judgment ni toca el
// motor. Comprueba la coherencia del año terminal:
//
//   Net Reinvestment = CAPEX − D&A + ΔNWC        (último año proyectado)
//   Reinvestment Rate = Net Reinvestment / NOPAT
//   ≈ g / ROC
//
// Todos los insumos se leen del `calculation_result` (proyecciones y
// `resolved_assumptions_used`). El ROC no es un campo numérico del contrato:
// es el diagnóstico documentado en `terminalG.rationale` ("ROC diagnóstico
// ≈24% (rango 23.5%–24.5%…)"); se extrae de ahí, nunca se fija en código.
// PASS = la tasa cae dentro del rango g/ROC_max … g/ROC_min documentado.

export interface TerminalReinvestmentInputs {
  projections?: { year: number; capex: number; depreciation: number; deltaWC: number; nopat: number }[] | null;
  resolved_assumptions_used?: { terminalG?: { value?: { valuePct?: number }; rationale?: string } } | null;
}

export type TerminalReinvestmentStatus = "PASS" | "FAIL" | "NOT_AVAILABLE";

export interface TerminalReinvestmentCheck {
  status: TerminalReinvestmentStatus;
  reason?: string;
  year?: number;
  capex?: number;
  depreciation?: number;
  deltaNwc?: number;
  nopat?: number;
  netReinvestment?: number;
  reinvestmentRate?: number;
  gPct?: number;
  rocPct?: number;
  rocRangePct?: [number, number] | null;
  gOverRoc?: number;
  /** [g/ROC_max, g/ROC_min]: banda aceptada derivada del rango documentado de ROC. */
  acceptedRange?: [number, number];
  /** ROC implícito por la reinversión del caso: g / Reinvestment Rate. */
  impliedRocPct?: number;
  rocSource: string;
}

const ROC_SOURCE = "resolved_assumptions_used.terminalG.rationale";
const ROC_RE = /ROC diagnóstico\s*≈\s*([\d.]+)%(?:\s*\(rango\s*([\d.]+)%\s*[–-]\s*([\d.]+)%)?/;

export function parseDocumentedRoc(rationale: string | undefined): { rocPct: number; range: [number, number] | null } | null {
  const m = rationale ? ROC_RE.exec(rationale) : null;
  if (!m) return null;
  return { rocPct: Number(m[1]), range: m[2] && m[3] ? [Number(m[2]), Number(m[3])] : null };
}

export function terminalReinvestmentCheck(cr: TerminalReinvestmentInputs | null | undefined): TerminalReinvestmentCheck {
  const y = cr?.projections?.at(-1);
  const tg = cr?.resolved_assumptions_used?.terminalG;
  const gPct = tg?.value?.valuePct;
  const roc = parseDocumentedRoc(tg?.rationale);
  if (!y) return { status: "NOT_AVAILABLE", reason: "Sin proyecciones persistidas.", rocSource: ROC_SOURCE };
  if (typeof gPct !== "number" || !roc) return { status: "NOT_AVAILABLE", reason: "Sin g terminal resuelto o sin ROC diagnóstico documentado.", rocSource: ROC_SOURCE };
  if (!(y.nopat > 0)) return { status: "NOT_AVAILABLE", reason: "NOPAT terminal no positivo.", rocSource: ROC_SOURCE };

  const netReinvestment = y.capex - y.depreciation + y.deltaWC;
  const reinvestmentRate = netReinvestment / y.nopat;
  const gOverRoc = gPct / roc.rocPct;
  // Sin rango documentado, la banda es el punto (solo tolerancia de máquina).
  const [rocLo, rocHi] = roc.range ?? [roc.rocPct, roc.rocPct];
  const acceptedRange: [number, number] = [gPct / rocHi, gPct / rocLo];
  const eps = 4 * Number.EPSILON;
  const pass = reinvestmentRate >= acceptedRange[0] - eps && reinvestmentRate <= acceptedRange[1] + eps;

  return {
    status: pass ? "PASS" : "FAIL",
    year: y.year, capex: y.capex, depreciation: y.depreciation, deltaNwc: y.deltaWC, nopat: y.nopat,
    netReinvestment, reinvestmentRate, gPct, rocPct: roc.rocPct, rocRangePct: roc.range, gOverRoc, acceptedRange,
    impliedRocPct: reinvestmentRate > 0 ? gPct / reinvestmentRate : undefined,
    rocSource: ROC_SOURCE,
  };
}
