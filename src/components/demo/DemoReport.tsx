import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, formatCurrencyFull, formatNumber, formatPct, NORMALIZATION_MAP, type AnalysisResult, type FinancialInputs } from "@/lib/financial-engine";
import { generatePDF, type PDFVersion } from "@/lib/pdf-generator";

interface Props {
  result: AnalysisResult;
  inputs: FinancialInputs;
}

const reportSections = [
  { num: 1, title: "Portada", desc: "Logo Velarix, nombre empresa, sector, fecha, CONFIDENCIAL" },
  { num: 2, title: "Resumen ejecutivo", desc: "Enterprise Value, Equity Value, rango, WACC, escenario base" },
  { num: 3, title: "Diagnóstico financiero", desc: "Tabla de KPIs con interpretación y benchmark" },
  { num: 4, title: "Normalización contable", desc: "Tabla de homologación de cuentas aplicada" },
  { num: 5, title: "Estado de resultados proyectado", desc: "Tabla 5 años con P&L completo" },
  { num: 6, title: "Proyección de FCFF", desc: "Tabla y gráfico del puente NOPAT → FCFF" },
  { num: 7, title: "Valoración DCF", desc: "Fórmulas, supuestos, resultado completo" },
  { num: 8, title: "Análisis de sensibilidad", desc: "Matriz WACC × g completa" },
  { num: 9, title: "Benchmarks sectoriales", desc: "Comparación vs sector en 5 métricas" },
  { num: 10, title: "Matriz de supuestos", desc: "Todos los inputs usados con fuente" },
  { num: 11, title: "Apéndice metodológico", desc: "Explicación de cada fórmula utilizada" },
  { num: 12, title: "Aviso legal", desc: "Disclaimer y trazabilidad de fuentes" },
];

const DemoReport = ({ result, inputs }: Props) => {
  const [expandedSection, setExpandedSection] = useState<number | null>(2);
  const [generating, setGenerating] = useState(false);
  const [pdfVersion, setPdfVersion] = useState<PDFVersion>("ejecutivo");

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await generatePDF(result, inputs, pdfVersion);
    } finally {
      setGenerating(false);
    }
  };

  const renderSectionContent = (num: number) => {
    switch (num) {
      case 2:
        return (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { l: "Enterprise Value (base)", v: formatCurrency(result.enterpriseValue) },
              { l: "Equity Value", v: formatCurrency(result.equityValue) },
              { l: "Rango de valoración", v: `${formatCurrency(result.evLow)} – ${formatCurrency(result.evHigh)}` },
              { l: "WACC aplicado", v: formatPct(result.wacc) },
              { l: "Ke (costo equity)", v: formatPct(result.costOfEquity) },
              { l: "Beta re-apalancado", v: formatNumber(result.betaLevered, 2) },
              { l: "EV/EBITDA implícito", v: `${formatNumber(result.evEbitda)}x` },
              { l: "EV/Revenue implícito", v: `${formatNumber(result.evRevenue)}x` },
            ].map(item => (
              <div key={item.l} className="flex justify-between px-2 py-1">
                <span className="font-body text-[10px] text-muted-foreground">{item.l}</span>
                <span className="font-body text-xs text-foreground font-semibold">{item.v}</span>
              </div>
            ))}
          </div>
        );
      case 5:
        return (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[10px] font-body">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-1">Concepto</th>
                  {result.projections.map(p => <th key={p.year} className="text-right py-1">Y{p.year}</th>)}
                </tr>
              </thead>
              <tbody>
                {(["revenue", "ebitda", "ebit", "netIncome", "fcff"] as const).map(key => (
                  <tr key={key} className="border-b border-border/20">
                    <td className="py-1 text-muted-foreground">{{ revenue: "Ingresos", ebitda: "EBITDA", ebit: "EBIT", netIncome: "Utilidad neta", fcff: "FCFF" }[key]}</td>
                    {result.projections.map(p => (
                      <td key={p.year} className="text-right py-1 text-foreground">{formatCurrency(p[key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Vista previa del reporte Velarix</h3>
          <p className="font-body text-xs text-muted-foreground mt-1">{inputs.companyName} · {inputs.sector} · {new Date().toLocaleDateString("es-CO")}</p>
        </div>
        <span className="text-[10px] font-body text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">AAA Reporting Standard</span>
      </div>

      {/* Report sections */}
      <div className="space-y-2">
        {reportSections.map((s) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: s.num * 0.03 }}
            className="metallic-border-hover rounded bg-velarix-bg-tertiary overflow-hidden"
          >
            <button
              onClick={() => setExpandedSection(expandedSection === s.num ? null : s.num)}
              className="w-full flex items-start gap-3 p-4 text-left"
            >
              <div className="w-6 h-6 rounded flex items-center justify-center bg-primary/10 shrink-0 mt-0.5">
                <span className="font-display text-[10px] font-bold text-primary">{s.num}</span>
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-semibold text-foreground">{s.title}</p>
                <p className="font-body text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
              {expandedSection === s.num ? <ChevronUp size={14} className="text-muted-foreground mt-1" /> : <ChevronDown size={14} className="text-muted-foreground mt-1" />}
            </button>
            {expandedSection === s.num && (
              <div className="px-4 pb-4">
                {renderSectionContent(s.num) || (
                  <p className="font-body text-[10px] text-muted-foreground italic">Contenido completo disponible en el PDF descargable.</p>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Auditability */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-3">Auditabilidad del modelo</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Metodología visible y documentada",
            "Supuestos editables por el usuario",
            "Fuentes de parámetros identificadas",
            "Lógica financiera explícita (no caja negra)",
            "Sensibilidad replicable",
            "FCFF con estándar CFA",
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-primary shrink-0" />
              <span className="font-body text-[10px] text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Version selector */}
      <div className="flex items-center gap-3 mb-3">
        <label className="font-body text-xs text-muted-foreground">Versión del informe:</label>
        <select
          value={pdfVersion}
          onChange={e => setPdfVersion(e.target.value as PDFVersion)}
          className="bg-background metallic-border rounded px-3 py-1.5 text-xs font-body text-foreground focus:outline-none focus:border-primary/50"
        >
          <option value="ejecutivo">Ejecutiva (15 páginas esenciales)</option>
          <option value="completo">Completa (21 páginas — todas las secciones)</option>
        </select>
      </div>

      <button
        onClick={handleDownload}
        disabled={generating}
        className="w-full font-body text-sm px-6 py-3 rounded bg-primary text-primary-foreground hover:brightness-110 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Download size={14} />
        {generating ? "Generando informe..." : `Descargar informe ${pdfVersion === "ejecutivo" ? "ejecutivo" : "completo"} (PDF)`}
      </button>
    </div>
  );
};

export default DemoReport;
