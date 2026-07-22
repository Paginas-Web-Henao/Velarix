import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  siempreVisible: boolean; // visible without login
  ocultoSinLogin: boolean; // completely hidden from sidebar without login
}

const TABS: TabDef[] = [
  { key: "inputs", label: "Inputs financieros", siempreVisible: true, ocultoSinLogin: false },
  { key: "normalizacion", label: "Normalización", siempreVisible: true, ocultoSinLogin: false },
  { key: "kpis", label: "KPIs", siempreVisible: true, ocultoSinLogin: false },
  { key: "proyecciones", label: "Proyecciones", siempreVisible: false, ocultoSinLogin: false },
  { key: "valuacion", label: "Valuación", siempreVisible: false, ocultoSinLogin: false },
  { key: "benchmarks", label: "Benchmarks", siempreVisible: false, ocultoSinLogin: false },
  { key: "macro", label: "Contexto macro", siempreVisible: true, ocultoSinLogin: false },
  { key: "reporte", label: "Reporte", siempreVisible: false, ocultoSinLogin: true },
  { key: "integridad", label: "Integridad de datos", siempreVisible: true, ocultoSinLogin: false },
];

// Blocked section component for unauthenticated users
const SeccionBloqueada = ({ titulo, onRegistro }: { titulo: string; onRegistro: () => void }) => (
  <div className="flex flex-col items-center justify-center h-96 text-center">
    <div className="metallic-border rounded-lg bg-velarix-bg-tertiary p-10 max-w-md">
      <Lock size={28} className="text-muted-foreground mx-auto mb-4" />
      <p className="font-body text-sm text-muted-foreground mb-2">
        {titulo} disponible con cuenta gratuita
      </p>
      <p className="font-body text-[11px] text-muted-foreground/60 mb-5">
        Accede al análisis completo: proyecciones, DCF, sensibilidad y reporte descargable.
      </p>
      <button
        onClick={onRegistro}
        className="font-body text-sm px-6 py-2.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
      >
        Crear cuenta gratuita
      </button>
    </div>
  </div>
);

interface Props {
  open: boolean;
  onClose: () => void;
}

const DemoDashboard = ({ open, onClose }: Props) => {
  const [inputs, setInputs] = useState<FinancialInputs>({ ...DEFAULT_INPUTS });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("inputs");
  const { user } = useAuth();
  const navigate = useNavigate();
  const autenticado = !!user;

  const handleRun = () => {
    const r = runAnalysis(inputs);
    setResult(r);
    setActiveTab("kpis");
  };

  const handleRegistro = () => {
    onClose();
    navigate("/auth");
  };

  if (!open) return null;

  const needsResult = !["inputs", "normalizacion", "macro", "integridad"].includes(activeTab);

  // Tabs blocked without login
  const tabsBloqueadas: Tab[] = autenticado
    ? []
    : ["proyecciones", "valuacion", "benchmarks", "reporte"];

  return (
    <AnimatePresence>
      <motion.div
        key="demo-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex"
      >
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-border bg-velarix-bg-secondary flex flex-col">
          <div className="h-14 flex items-center px-5 border-b border-border">
            <span className="font-display text-lg font-bold text-foreground">Velarix</span>
            <span className="ml-2 text-[10px] font-body text-primary bg-primary/10 px-2 py-0.5 rounded">Demo</span>
          </div>
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {TABS.map((t, i) => {
              // Completely hide "Reporte" tab from sidebar when not logged in
              if (t.ocultoSinLogin && !autenticado) return null;

              const isBloqueada = !autenticado && !t.siempreVisible;

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
                  {isBloqueada && (
                    <Lock size={10} className="ml-auto text-muted-foreground/50" />
                  )}
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
              Convención: fin de año · Mid-year en versión completa
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
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="flex">
              {/* Center */}
              <div className="flex-1 p-6">
                {result?.waccWarning && activeTab === "valuacion" && autenticado && (
                  <div className="mb-4 p-3 rounded bg-yellow-950/50 border border-yellow-800 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
                    <p className="font-body text-xs text-yellow-400">{result.waccWarning}</p>
                  </div>
                )}

                {/* Always visible tabs */}
                {activeTab === "inputs" && (
                  <DemoInputsForm inputs={inputs} setInputs={setInputs} onRun={handleRun} />
                )}
                {activeTab === "normalizacion" && <DemoNormalization inputs={inputs} />}
                {activeTab === "kpis" && result && <DemoKPIs result={result} inputs={inputs} />}
                {activeTab === "macro" && <DemoMacro />}
                {activeTab === "integridad" && <DemoDataIntegrity />}

                {/* Tabs that require auth — show blocked section or content */}
                {activeTab === "proyecciones" && (
                  !autenticado
                    ? <SeccionBloqueada titulo="Proyecciones a 5 años" onRegistro={handleRegistro} />
                    : result ? <DemoCharts result={result} inputs={inputs} /> : null
                )}
                {activeTab === "valuacion" && (
                  !autenticado
                    ? <SeccionBloqueada titulo="Valoración DCF y sensibilidad" onRegistro={handleRegistro} />
                    : result ? <DemoSensitivity result={result} inputs={inputs} /> : null
                )}
                {activeTab === "benchmarks" && (
                  !autenticado
                    ? <SeccionBloqueada titulo="Benchmark empresa vs sector" onRegistro={handleRegistro} />
                    : result ? <DemoBenchmarkView result={result} inputs={inputs} /> : null
                )}
                {activeTab === "reporte" && (
                  !autenticado
                    ? <SeccionBloqueada titulo="Reporte institucional PDF" onRegistro={handleRegistro} />
                    : result ? <DemoReport result={result} inputs={inputs} /> : null
                )}

                {/* Need result prompt — only for authenticated users on result tabs */}
                {needsResult && !result && autenticado && !tabsBloqueadas.includes(activeTab) && (
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

export default DemoDashboard;
