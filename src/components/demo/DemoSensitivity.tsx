import { formatCurrency, formatNumber, formatPct, formatCurrencyFull, type AnalysisResult, type FinancialInputs } from "@/lib/financial-engine";

interface Props {
  result: AnalysisResult;
  inputs: FinancialInputs;
}

const DemoSensitivity = ({ result, inputs }: Props) => {
  const deltas = [-2, -1, 0, 1, 2];

  // Color coding for sensitivity matrix
  const allEvs = result.sensitivityMatrix.filter(c => c.ev > 0).map(c => c.ev);
  const minEV = Math.min(...allEvs);
  const maxEV = Math.max(...allEvs);
  const getCellColor = (ev: number) => {
    if (ev <= 0) return "";
    const ratio = (ev - minEV) / (maxEV - minEV || 1);
    if (ratio > 0.7) return "bg-emerald-950/50 text-emerald-400";
    if (ratio > 0.4) return "text-foreground";
    return "bg-red-950/50 text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* DCF summary */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Resumen de valoración DCF</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Enterprise Value (base)", value: formatCurrency(result.enterpriseValue) },
            { label: "Equity Value", value: formatCurrency(result.equityValue) },
            { label: "Rango EV (±1% WACC)", value: `${formatCurrency(result.evLow)} – ${formatCurrency(result.evHigh)}` },
            { label: "WACC aplicado", value: formatPct(result.wacc) },
            { label: "Ke (costo equity)", value: formatPct(result.costOfEquity) },
            { label: "Kd after-tax", value: formatPct(result.costOfDebtAfterTax) },
            { label: "Beta re-apalancado", value: formatNumber(result.betaLevered, 2) },
            { label: "Deuda neta", value: formatCurrencyFull(result.netDebt) },
          ].map((m) => (
            <div key={m.label} className="metallic-border rounded bg-background p-4">
              <p className="font-body text-xs text-muted-foreground mb-1">{m.label}</p>
              <p className="font-display text-base font-bold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Implied multiples vs sector */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Múltiplos implícitos vs sector</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="metallic-border rounded bg-background p-4">
            <p className="font-body text-xs text-muted-foreground mb-1">EV/EBITDA implícito</p>
            <p className="font-display text-lg font-bold text-foreground">{formatNumber(result.evEbitda)}x</p>
            <p className="font-body text-[10px] text-muted-foreground mt-1">Sector: {result.sectorBenchmark.evEbitda}x</p>
          </div>
          <div className="metallic-border rounded bg-background p-4">
            <p className="font-body text-xs text-muted-foreground mb-1">EV/Revenue implícito</p>
            <p className="font-display text-lg font-bold text-foreground">{formatNumber(result.evRevenue)}x</p>
            <p className="font-body text-[10px] text-muted-foreground mt-1">Sector: {result.sectorBenchmark.evRevenue}x</p>
          </div>
        </div>
      </div>

      {/* Scenario EVs */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Enterprise Value por escenario</h4>
        <div className="grid grid-cols-3 gap-4">
          {([
            { label: "Pesimista", value: result.scenarioEVs.pessimistic, color: "text-red-400" },
            { label: "Base", value: result.scenarioEVs.base, color: "text-primary" },
            { label: "Optimista", value: result.scenarioEVs.optimistic, color: "text-emerald-400" },
          ]).map((s) => (
            <div key={s.label} className="metallic-border rounded bg-background p-4 text-center">
              <p className="font-body text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-display text-lg font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DCF Waterfall */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Composición del Enterprise Value (DCF Waterfall)</h4>
        <div className="space-y-2">
          {result.projections.map((p) => {
            const maxVal = Math.max(...result.projections.map(x => x.discountedFcf), result.discountedTV);
            const w = maxVal > 0 ? (p.discountedFcf / maxVal) * 100 : 0;
            return (
              <div key={p.year} className="flex items-center gap-3">
                <span className="font-body text-xs text-muted-foreground w-16">PV FCFF Y{p.year}</span>
                <div className="flex-1 h-6 rounded bg-background overflow-hidden">
                  <div className="h-full rounded bg-primary/80" style={{ width: `${Math.max(w, 2)}%` }} />
                </div>
                <span className="font-body text-xs text-foreground w-20 text-right">{formatCurrency(p.discountedFcf)}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-3">
            <span className="font-body text-xs text-muted-foreground w-16">PV TV</span>
            <div className="flex-1 h-6 rounded bg-background overflow-hidden">
              <div className="h-full rounded bg-secondary" style={{ width: `100%` }} />
            </div>
            <span className="font-body text-xs text-foreground w-20 text-right">{formatCurrency(result.discountedTV)}</span>
          </div>
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="font-body text-sm font-semibold text-foreground">Enterprise Value Total</span>
            <span className="font-display text-lg font-bold text-primary">{formatCurrency(result.enterpriseValue)}</span>
          </div>
        </div>
      </div>

      {/* Sensitivity matrix */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5 overflow-x-auto">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Análisis de sensibilidad (WACC vs Crecimiento terminal)</h4>
        <table className="w-full text-xs font-body">
          <thead>
            <tr>
              <th className="text-left py-2 pr-2 text-muted-foreground">WACC \ g</th>
              {deltas.map((gd) => (
                <th key={gd} className="text-right py-2 px-2 text-muted-foreground">g{gd >= 0 ? "+" : ""}{gd}%</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deltas.map((wd) => (
              <tr key={wd} className="border-t border-border/20">
                <td className="py-2 pr-2 text-muted-foreground">WACC{wd >= 0 ? "+" : ""}{wd}%</td>
                {deltas.map((gd) => {
                  const cell = result.sensitivityMatrix.find((c) => c.waccDelta === wd && c.growthDelta === gd);
                  const isBase = wd === 0 && gd === 0;
                  return (
                    <td key={gd} className={`text-right py-2 px-2 ${isBase ? "font-bold text-primary" : getCellColor(cell?.ev || 0)}`}>
                      {cell && cell.ev > 0 ? formatCurrency(cell.ev) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="font-body text-[10px] text-muted-foreground mt-3">
          Convención fin de año · Ajuste por mid-year disponible en versión completa
        </p>
      </div>
    </div>
  );
};

export default DemoSensitivity;
