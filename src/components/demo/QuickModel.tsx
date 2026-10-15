import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import {
  DEFAULT_INPUTS,
  SECTOR_KEYS,
  SECTOR_BENCHMARKS,
  runAnalysis,
  formatCurrency,
  formatNumber,
  formatPct,
  type FinancialInputs,
  type AnalysisResult,
} from "@/lib/financial-engine";
import DemoCharts from "./DemoCharts";
import DemoBenchmarkView from "./DemoBenchmarkView";
import DemoReport from "./DemoReport";
import DemoSensitivity from "./DemoSensitivity";
import DemoNormalization from "./DemoNormalization";
import DemoKPIs from "./DemoKPIs";
import DemoInputsForm from "./DemoInputsForm";
import DemoMacro from "./DemoMacro";
import DemoDataIntegrity from "./DemoDataIntegrity";

type Tab = "inputs" | "normalizacion" | "kpis" | "proyecciones" | "valuacion" | "benchmarks" | "macro" | "reporte" | "integridad";

interface TabDef {
  key: Tab;
  label: string;
}

// Quick Model (ADR-007): modelo rápido, local y exploratorio con el motor
// cliente (`src/lib/financial-engine.ts`). NO es el motor canónico, no usa
// Evidence ni supuestos resueltos y no persiste nada.
const TABS: TabDef[] = [
  { key: "inputs", label: "Inputs financieros" },
  { key: "normalizacion", label: "Normalización" },
  { key: "kpis", label: "KPIs" },
  { key: "proyecciones", label: "Proyecciones" },
  { key: "valuacion", label: "Valuación" },
  { key: "benchmarks", label: "Benchmarks" },
  { key: "macro", label: "Contexto macro" },
  { key: "reporte", label: "Reporte" },
  { key: "integridad", label: "Integridad de datos" },
];

interface Props {
  open?: boolean;
  onClose?: () => void;
}

const QuickModel = ({ open = true, onClose }: Props) => {
  const [inputs, setInputs] = useState<FinancialInputs>({ ...DEFAULT_INPUTS });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("inputs");

  const handleRun = () => {
    const r = runAnalysis(inputs);
    setResult(r);
    setActiveTab("kpis");
  };


  if (!open) return null;

  const needsResult = !["inputs", "normalizacion", "macro", "integridad"].includes(activeTab);

  return (
    <AnimatePresence>
      <motion.div
        key="quick-model-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex"
      >
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-border bg-velarix-bg-secondary flex flex-col">
          <div className="h-14 flex items-center px-5 border-b border-border">
            <span className="font-display text-lg font-bold text-foreground">Velarix</span>
            <span className="ml-2 text-[10px] font-body text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Quick Model · no canónico</span>
          </div>
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {TABS.map((t, i) => {
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`w-full text-left font-body text-sm px-3 py-2 rounded transition-colors flex items-center gap-2 ${
                    activeTab === t.key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  <span className="text-[10px] font-display font-bold text-muted-foreground w-4">{i + 1}</span>
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Auditability panel */}
          <div className="border-t border-border p-4">
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Auditabilidad</p>
            <div className="space-y-1">
              {[
                "DCF con FCFF (CFA)",
                "WACC: CAPM + D/E",
                "Beta re-apalancado (Hamada)",
                "Gordon Growth TV",
                "3 Escenarios",
                "Sensibilidad 5×5",
                "100% en navegador",
                "IA: solo datos externos",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <span className="text-primary text-[10px]">✓</span>
                  <span className="font-body text-[10px] text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
            <p className="font-body text-[9px] text-muted-foreground mt-2 pt-2 border-t border-border/30">
              Convención: fin de año
            </p>
            <p className="font-body text-[9px] text-amber-400/80 mt-2">
              Exploratorio: no usa Evidence ni supuestos resueltos del caso. Para valoraciones defendibles usa el caso canónico.
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-velarix-bg-secondary/50">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-sm font-semibold text-foreground">
                {TABS.find((t) => t.key === activeTab)?.label}
              </h2>
              {result && (
                <span className="text-[10px] font-body text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {inputs.companyName} · {inputs.sector}
                </span>
              )}
              {result?.waccWarning && (
                <span className="text-[10px] font-body text-yellow-400 bg-yellow-950 px-2 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle size={10} /> WACC ≤ g
                </span>
              )}
            </div>
            {onClose && (
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <div className="flex">
              {/* Center */}
              <div className="flex-1 p-6">
                {result?.waccWarning && activeTab === "valuacion" && (
                  <div className="mb-4 p-3 rounded bg-yellow-950/50 border border-yellow-800 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
                    <p className="font-body text-xs text-yellow-400">{result.waccWarning}</p>
                  </div>
                )}

                {activeTab === "inputs" && (
                  <DemoInputsForm inputs={inputs} setInputs={setInputs} onRun={handleRun} />
                )}
                {activeTab === "normalizacion" && <DemoNormalization inputs={inputs} />}
                {activeTab === "kpis" && result && <DemoKPIs result={result} inputs={inputs} />}
                {activeTab === "macro" && <DemoMacro />}
                {activeTab === "integridad" && <DemoDataIntegrity />}

                {activeTab === "proyecciones" && result && <DemoCharts result={result} inputs={inputs} />}
                {activeTab === "valuacion" && result && <DemoSensitivity result={result} inputs={inputs} />}
                {activeTab === "benchmarks" && result && <DemoBenchmarkView result={result} inputs={inputs} />}
                {activeTab === "reporte" && result && <DemoReport result={result} inputs={inputs} />}

                {/* Need result prompt */}
                {needsResult && !result && (
                  <div className="flex flex-col items-center justify-center h-96 text-center">
                    <p className="font-body text-muted-foreground mb-4">Ejecuta el análisis primero para ver resultados.</p>
                    <button onClick={() => setActiveTab("inputs")} className="font-body text-sm px-6 py-2 rounded bg-primary text-primary-foreground">
                      Ir a inputs
                    </button>
                  </div>
                )}
              </div>

              {/* Right panel — key metrics */}
              {result && !["reporte", "integridad"].includes(activeTab) && (
                <div className="w-56 shrink-0 border-l border-border bg-velarix-bg-secondary/30 p-4 space-y-3">
                  <h4 className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Métricas clave</h4>
                  {[
                    { label: "Revenue (Y1)", value: formatCurrency(result.projections[0].revenue) },
                    { label: "EBITDA (Y1)", value: formatCurrency(result.projections[0].ebitda) },
                    { label: "FCFF (Y1)", value: formatCurrency(result.projections[0].fcff) },
                    { label: "WACC", value: formatPct(result.wacc) },
                    { label: "Enterprise Value", value: formatCurrency(result.enterpriseValue) },
                    { label: "Equity Value", value: formatCurrency(result.equityValue) },
                    { label: "EV/EBITDA", value: `${formatNumber(result.evEbitda)}x` },
                    { label: "EV/Revenue", value: `${formatNumber(result.evRevenue)}x` },
                  ].map((m) => (
                    <div key={m.label} className="metallic-border rounded bg-velarix-bg-tertiary p-3">
                      <p className="font-body text-[10px] text-muted-foreground">{m.label}</p>
                      <p className="font-display text-sm font-bold text-foreground mt-1">{m.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickModel;
