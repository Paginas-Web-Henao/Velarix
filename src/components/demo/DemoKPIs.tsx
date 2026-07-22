import { formatNumber, formatPct, type AnalysisResult, type FinancialInputs } from "@/lib/financial-engine";

interface Props {
  result: AnalysisResult;
  inputs: FinancialInputs;
}

type ChipStatus = "above" | "below" | "aligned" | "na";

const StatusChip = ({ status, text }: { status: ChipStatus; text: string }) => {
  const styles: Record<ChipStatus, string> = {
    above: "bg-emerald-950 text-emerald-400 border-emerald-800",
    below: "bg-red-950 text-red-400 border-red-800",
    aligned: "bg-muted text-muted-foreground border-border",
    na: "bg-yellow-950 text-yellow-400 border-yellow-800",
  };
  const icons: Record<ChipStatus, string> = { above: "▲", below: "▼", aligned: "●", na: "⚠" };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-body px-2 py-0.5 rounded border ${styles[status]}`}>
      {icons[status]} {text}
    </span>
  );
};

const getStatus = (value: number, benchmark: number, higherIsBetter = true): { status: ChipStatus; text: string } => {
  const diff = value - benchmark;
  const threshold = benchmark * 0.05;
  if (Math.abs(diff) <= threshold) return { status: "aligned", text: "Alineado con benchmark" };
  if ((diff > 0 && higherIsBetter) || (diff < 0 && !higherIsBetter)) return { status: "above", text: "Por encima del benchmark" };
  return { status: "below", text: "Por debajo del benchmark" };
};

const DemoKPIs = ({ result, inputs }: Props) => {
  const bm = result.sectorBenchmark;
  const kpis = result.kpis;

  const sections = [
    {
      title: "Rentabilidad",
      items: [
        { label: "Margen Bruto", value: formatPct(kpis.grossMargin), benchmark: null, interpretation: "Rentabilidad después de costos directos" },
        { label: "Margen EBITDA", value: formatPct(kpis.ebitdaMargin), benchmark: bm.ebitdaMargin, interpretation: `Sector referencia: ${bm.ebitdaMargin}%`, higherIsBetter: true },
        { label: "Margen EBIT", value: formatPct(kpis.ebitMargin), benchmark: null, interpretation: "Rentabilidad operativa después de D&A" },
        { label: "Margen Neto", value: formatPct(kpis.netMargin), benchmark: null, interpretation: "Rentabilidad final después de impuestos e intereses" },
        { label: "ROE", value: formatPct(kpis.roe), benchmark: null, interpretation: "Retorno sobre el patrimonio de los accionistas" },
        { label: "ROA", value: formatPct(kpis.roa), benchmark: null, interpretation: "Retorno sobre activos totales" },
      ],
    },
    {
      title: "Crecimiento",
      items: [
        { label: "Crecimiento de ingresos", value: formatPct(kpis.revenueGrowth), benchmark: null, interpretation: "Tasa de crecimiento proyectada" },
      ],
    },
    {
      title: "Estructura financiera",
      items: [
        { label: "Deuda neta", value: `USD ${kpis.netDebt.toLocaleString("es-CO")}`, benchmark: null, interpretation: kpis.netDebt < 0 ? "Posición neta de caja" : "Deuda neta positiva" },
        { label: "Leverage (Deuda/EBITDA)", value: `${formatNumber(kpis.leverage)}x`, benchmark: null, interpretation: kpis.leverage < 2 ? "Apalancamiento conservador" : kpis.leverage < 4 ? "Apalancamiento moderado" : "Apalancamiento elevado" },
        { label: "Cobertura de intereses", value: `${formatNumber(kpis.interestCoverage)}x`, benchmark: null, interpretation: kpis.interestCoverage > 3 ? "Cobertura saludable" : "Cobertura ajustada" },
        { label: "Caja mínima operativa", value: `USD ${Math.round(kpis.cajaMinima).toLocaleString("es-CO")}`, benchmark: null, interpretation: "Referencia de liquidez mínima según días de caja configurados" },
      ],
    },
    {
      title: "Eficiencia operativa",
      items: [
        { label: "Días de cartera", value: `${kpis.daysReceivable} días`, benchmark: null, interpretation: "Tiempo promedio de cobro (demo)" },
        { label: "Días de inventario", value: `${kpis.daysInventory} días`, benchmark: null, interpretation: "Tiempo promedio de rotación (demo)" },
        { label: "Días de proveedores", value: `${kpis.daysPayable} días`, benchmark: null, interpretation: "Tiempo promedio de pago (demo)" },
        { label: "Ciclo de caja", value: `${kpis.cashCycle} días`, benchmark: null, interpretation: kpis.cashCycle < 30 ? "Ciclo de caja eficiente" : "Ciclo de caja moderado" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title} className="metallic-border rounded bg-velarix-bg-tertiary p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">{section.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {section.items.map((item) => {
              const statusData = item.benchmark != null
                ? getStatus(parseFloat(String(item.value)), item.benchmark, item.higherIsBetter !== false)
                : null;

              return (
                <div key={item.label} className="metallic-border rounded bg-background p-4">
                  <p className="font-body text-[10px] text-muted-foreground mb-1">{item.label}</p>
                  <p className="font-display text-lg font-bold text-foreground">{item.value}</p>
                  {statusData && <StatusChip status={statusData.status} text={statusData.text} />}
                  <p className="font-body text-[10px] text-muted-foreground mt-2">{item.interpretation}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DemoKPIs;
