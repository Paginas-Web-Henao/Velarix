import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatCurrency, formatCurrencyFull, type AnalysisResult, type FinancialInputs } from "@/lib/financial-engine";

const chartTooltipStyle = {
  background: "#0D1117",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 4,
  fontSize: 12,
  color: "#F5F7FA",
};

interface Props {
  result: AnalysisResult;
  inputs: FinancialInputs;
}

type Scenario = "pessimistic" | "base" | "optimistic";

const DemoCharts = ({ result, inputs }: Props) => {
  const [scenario, setScenario] = useState<Scenario>("base");

  const activeProjections = result.scenarios[scenario];
  const sa = result.scenarioAssumptions[scenario];

  const data = activeProjections.map((p) => ({
    name: `Y${p.year}`,
    revenue: Math.round(p.revenue),
    ebitda: Math.round(p.ebitda),
    fcff: Math.round(p.fcff),
    netIncome: Math.round(p.netIncome),
  }));

  // Multi-scenario overlay data
  const scenarioData = result.scenarios.base.map((_, i) => ({
    name: `Y${i + 1}`,
    pesimista: Math.round(result.scenarios.pessimistic[i].revenue),
    base: Math.round(result.scenarios.base[i].revenue),
    optimista: Math.round(result.scenarios.optimistic[i].revenue),
  }));

  const fcffScenarioData = result.scenarios.base.map((_, i) => ({
    name: `Y${i + 1}`,
    pesimista: Math.round(result.scenarios.pessimistic[i].fcff),
    base: Math.round(result.scenarios.base[i].fcff),
    optimista: Math.round(result.scenarios.optimistic[i].fcff),
  }));

  // P&L table keys
  const plRows: { key: keyof typeof activeProjections[0]; label: string; bold?: boolean }[] = [
    { key: "revenue", label: "Ingresos" },
    { key: "costOfSales", label: "Costo de ventas" },
    { key: "grossProfit", label: "Utilidad bruta", bold: true },
    { key: "ebitda", label: "EBITDA", bold: true },
    { key: "depreciation", label: "D&A" },
    { key: "ebit", label: "EBIT", bold: true },
    { key: "interest", label: "Intereses" },
    { key: "ebt", label: "EBT" },
    { key: "taxes", label: "Impuestos" },
    { key: "netIncome", label: "Utilidad neta", bold: true },
  ];

  const fcffRows: { key: keyof typeof activeProjections[0]; label: string; bold?: boolean; prefix?: string }[] = [
    { key: "ebit", label: "EBIT" },
    { key: "nopat", label: "NOPAT (EBIT × (1−t))", bold: true },
    { key: "depreciation", label: "+ D&A", prefix: "+" },
    { key: "capex", label: "– CAPEX", prefix: "–" },
    { key: "deltaWC", label: "– ΔCapital de trabajo", prefix: "–" },
    { key: "fcff", label: "FCFF", bold: true },
  ];

  return (
    <div className="space-y-6">
      {/* Scenario selector */}
      <div className="flex items-center gap-3">
        <span className="font-body text-xs text-muted-foreground">Escenario:</span>
        {(["pessimistic", "base", "optimistic"] as Scenario[]).map((s) => (
          <button
            key={s}
            onClick={() => setScenario(s)}
            className={`font-body text-xs px-4 py-1.5 rounded transition-all ${
              scenario === s ? "bg-primary text-primary-foreground" : "metallic-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {result.scenarioAssumptions[s].label}
          </button>
        ))}
      </div>

      {/* Scenario assumptions */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
          {[
            { l: "Crecimiento", v: `${sa.growth.toFixed(1)}%` },
            { l: "Margen EBITDA", v: `${sa.ebitdaMargin.toFixed(1)}%` },
            { l: "CAPEX %", v: `${sa.capexPct.toFixed(1)}%` },
            { l: "WC %", v: `${sa.wcPct.toFixed(1)}%` },
            { l: "WACC", v: `${sa.wacc.toFixed(1)}%` },
            { l: "g terminal", v: `${sa.terminalGrowth.toFixed(1)}%` },
          ].map((item) => (
            <div key={item.l}>
              <p className="font-body text-[10px] text-muted-foreground">{item.l}</p>
              <p className="font-display text-sm font-bold text-foreground">{item.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* P&L Table */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5 overflow-x-auto">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Estado de resultados proyectado — {sa.label}</h4>
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-muted-foreground text-xs border-b border-border">
              <th className="text-left py-2 pr-4">Concepto</th>
              <th className="text-right py-2 px-2">Y0</th>
              {activeProjections.map((p) => (
                <th key={p.year} className="text-right py-2 px-2">Y{p.year}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-foreground">
            {plRows.map((row) => (
              <tr key={row.key} className={`border-b border-border/20 ${row.bold ? "font-semibold" : ""}`}>
                <td className="py-2 pr-4 text-muted-foreground text-xs">{row.label}</td>
                <td className="text-right py-2 px-2 text-xs">
                  {row.key === "revenue" ? formatCurrency(inputs.revenue) : "—"}
                </td>
                {activeProjections.map((p) => (
                  <td key={p.year} className={`text-right py-2 px-2 text-xs ${row.bold ? "text-primary" : ""}`}>
                    {formatCurrency(p[row.key] as number)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FCFF Table */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5 overflow-x-auto">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Proyección de FCFF</h4>
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-muted-foreground text-xs border-b border-border">
              <th className="text-left py-2 pr-4">Concepto</th>
              {activeProjections.map((p) => (
                <th key={p.year} className="text-right py-2 px-2">Y{p.year}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-foreground">
            {fcffRows.map((row) => (
              <tr key={row.key} className={`border-b border-border/20 ${row.bold ? "font-semibold" : ""}`}>
                <td className="py-2 pr-4 text-muted-foreground text-xs">{row.label}</td>
                {activeProjections.map((p) => (
                  <td key={p.year} className={`text-right py-2 px-2 text-xs ${row.bold ? "text-primary" : ""}`}>
                    {formatCurrency(p[row.key] as number)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revenue scenario chart */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Ingresos proyectados (3 escenarios)</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#A9B4C2" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#A9B4C2" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatCurrency(v), ""]} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#A9B4C2" }} />
              <Line type="monotone" dataKey="pesimista" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="base" stroke="#0E5FD8" strokeWidth={2} dot={{ r: 3, fill: "#0E5FD8" }} />
              <Line type="monotone" dataKey="optimista" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FCFF scenario chart */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">FCFF proyectado (3 escenarios)</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fcffScenarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#A9B4C2" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#A9B4C2" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatCurrency(v), ""]} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#A9B4C2" }} />
              <Line type="monotone" dataKey="pesimista" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="base" stroke="#0E5FD8" strokeWidth={2} dot={{ r: 3, fill: "#0E5FD8" }} />
              <Line type="monotone" dataKey="optimista" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* EBITDA bar chart */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">EBITDA proyectado — {sa.label}</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#A9B4C2" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#A9B4C2" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatCurrency(v), "EBITDA"]} />
              <Bar dataKey="ebitda" fill="hsl(216 86% 45%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DemoCharts;
