import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { formatNumber, type AnalysisResult, type FinancialInputs } from "@/lib/financial-engine";

interface Props {
  result: AnalysisResult;
  inputs: FinancialInputs;
}

const DemoBenchmarkView = ({ result, inputs }: Props) => {
  const bm = result.sectorBenchmark;

  const comparisonData = [
    { metric: "Margen EBITDA", empresa: parseFloat(inputs.ebitdaMargin.toFixed(1)), sector: bm.ebitdaMargin, diff: inputs.ebitdaMargin - bm.ebitdaMargin },
    { metric: "Beta", empresa: parseFloat(result.betaLevered.toFixed(2)), sector: bm.beta, diff: result.betaLevered - bm.beta },
    { metric: "WACC ref.", empresa: parseFloat(result.wacc.toFixed(1)), sector: bm.waccRef, diff: result.wacc - bm.waccRef },
    { metric: "EV/EBITDA", empresa: parseFloat(result.evEbitda.toFixed(1)), sector: bm.evEbitda, diff: result.evEbitda - bm.evEbitda },
    { metric: "EV/Revenue", empresa: parseFloat(result.evRevenue.toFixed(1)), sector: bm.evRevenue, diff: result.evRevenue - bm.evRevenue },
  ];

  // Radar data (normalized to 0-100 scale)
  const maxVals = { "Margen EBITDA": 40, "Beta": 2, "WACC": 20, "EV/EBITDA": 20, "EV/Revenue": 8 };
  const radarData = [
    { subject: "Margen", empresa: (inputs.ebitdaMargin / 40) * 100, sector: (bm.ebitdaMargin / 40) * 100 },
    { subject: "Beta", empresa: (result.betaLevered / 2) * 100, sector: (bm.beta / 2) * 100 },
    { subject: "WACC", empresa: (result.wacc / 20) * 100, sector: (bm.waccRef / 20) * 100 },
    { subject: "EV/EBITDA", empresa: (result.evEbitda / 20) * 100, sector: (bm.evEbitda / 20) * 100 },
    { subject: "EV/Rev", empresa: (result.evRevenue / 8) * 100, sector: (bm.evRevenue / 8) * 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Benchmark cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Beta desapalancado", value: bm.beta.toString(), desc: "Riesgo operativo del sector" },
          { label: "Margen EBITDA promedio", value: `${bm.ebitdaMargin}%`, desc: "Rentabilidad operativa de referencia" },
          { label: "EV/EBITDA", value: `${bm.evEbitda}x`, desc: "Múltiplo de valoración por flujo" },
          { label: "EV/Revenue", value: `${bm.evRevenue}x`, desc: "Múltiplo de valoración por ingresos" },
          { label: "WACC referencia", value: `${bm.waccRef}%`, desc: "Costo de capital estimado" },
        ].map((c) => (
          <div key={c.label} className="metallic-border-hover rounded bg-velarix-bg-tertiary p-4">
            <p className="font-body text-[10px] text-muted-foreground mb-1">{c.label}</p>
            <p className="font-display text-lg font-bold text-foreground">{c.value}</p>
            <p className="font-body text-[9px] text-muted-foreground mt-1">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5 overflow-x-auto">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Tu empresa vs benchmark ({inputs.sector})</h4>
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-muted-foreground text-xs border-b border-border">
              <th className="text-left py-2">Métrica</th>
              <th className="text-right py-2">Tu empresa</th>
              <th className="text-right py-2">Benchmark</th>
              <th className="text-right py-2">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row) => (
              <tr key={row.metric} className="border-b border-border/20">
                <td className="py-2 text-muted-foreground text-xs">{row.metric}</td>
                <td className="text-right py-2 text-foreground font-semibold text-xs">{row.empresa}</td>
                <td className="text-right py-2 text-muted-foreground text-xs">{row.sector}</td>
                <td className={`text-right py-2 text-xs font-semibold ${row.diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {row.diff >= 0 ? "+" : ""}{row.diff.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Radar chart */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Perfil comparativo (Radar)</h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(0 0% 100% / 0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#A9B4C2" }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar name="Tu empresa" dataKey="empresa" stroke="#0E5FD8" fill="#0E5FD8" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Benchmark" dataKey="sector" stroke="#AEB7C2" fill="#AEB7C2" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="5 5" />
              <Legend wrapperStyle={{ fontSize: 11, color: "#A9B4C2" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar comparison */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Comparación directa</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#A9B4C2" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="metric" type="category" tick={{ fontSize: 10, fill: "#A9B4C2" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, fontSize: 12, color: "#F5F7FA" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#A9B4C2" }} />
              <Bar dataKey="empresa" fill="hsl(216 86% 45%)" radius={[0, 3, 3, 0]} name="Tu empresa" />
              <Bar dataKey="sector" fill="hsl(215 10% 50%)" radius={[0, 3, 3, 0]} name="Benchmark" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DemoBenchmarkView;
