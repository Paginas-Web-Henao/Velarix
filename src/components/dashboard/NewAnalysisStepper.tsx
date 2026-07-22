import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, Loader2, XCircle, RotateCcw } from "lucide-react";
import DocumentUpload from "./DocumentUpload";
import { SECTOR_BENCHMARKS, SECTOR_KEYS } from "@/lib/financial-engine";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import ProgressPanel from "./ProgressPanel";

const SECTORS = SECTOR_KEYS;

interface Props {
  userId: string;
  onComplete: () => void;
}

const steps = [
  { num: 1, label: "Datos de la empresa" },
  { num: 2, label: "Cargar documentos" },
  { num: 3, label: "Procesamiento" },
  { num: 4, label: "Análisis listo" },
];

const NewAnalysisStepper = ({ userId, onComplete }: Props) => {
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Step 1 fields
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState(SECTORS[0]);
  const [moneda, setMoneda] = useState("COP");
  const [growth, setGrowth] = useState(25);

  const sectorKey = Object.keys(SECTOR_BENCHMARKS).find(
    k => SECTOR_BENCHMARKS[k].label === sector
  );
  const benchData = sectorKey ? SECTOR_BENCHMARKS[sectorKey] : null;

  const handleStep1 = async () => {
    if (!company.trim()) { toast.error("Ingresa el nombre de la empresa."); return; }
    setCreating(true);
    const { data, error } = await supabase
      .from("analyses")
      .insert({ user_id: userId, company_name: company.trim(), sector, expected_growth: growth, moneda_analisis: moneda, status: "creado" as const } as any)
      .select()
      .single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    setAnalysisId(data.id);
    setStep(2);
    toast.success("Datos guardados. Ahora carga los documentos financieros.");
  };

  // Called when DocumentUpload triggers pipeline start (onComplete from DocumentUpload)
  const handleDocumentsComplete = () => {
    // Move to step 3 immediately when pipeline starts
    setStep(3);
  };

  const handlePipelineComplete = () => {
    setStep(4);
    setPipelineError(null);
  };

  const handlePipelineError = (msg: string) => {
    setPipelineError(msg);
    // Stay on step 3 with error state
  };

  const handleRetry = () => {
    setPipelineError(null);
    setStep(2);
  };

  return (
    <div>
      {/* Stepper header — 4 steps */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => {
          const completada = step > s.num;
          const activa = step === s.num;
          const errorEnPaso = s.num === 3 && pipelineError && step === 3;
          return (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-bold ${
                errorEnPaso ? "bg-destructive/20 text-destructive" :
                completada ? "bg-emerald-500/20 text-emerald-400" :
                activa ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {errorEnPaso ? <XCircle size={14} /> :
                 completada ? <CheckCircle2 size={14} /> : s.num}
              </div>
              <span className={`font-body text-xs ${
                errorEnPaso ? "text-destructive" :
                activa ? "text-foreground" : "text-muted-foreground"
              }`}>{s.label}</span>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-muted-foreground mx-1" />}
            </div>
          );
        })}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="metallic-border rounded-lg bg-card p-6 max-w-2xl">
          <h2 className="font-display text-lg font-bold text-foreground mb-6">Datos de la empresa</h2>
          <div className="space-y-4">
            <div>
              <label className="font-body text-xs text-muted-foreground block mb-1">Nombre de la empresa *</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
                placeholder="Ej: Empresa ABC S.A.S." />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground block mb-1">Sector *</label>
              <select value={sector} onChange={e => setSector(e.target.value)}
                className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50">
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {benchData && (
              <div className="bg-background rounded p-3 metallic-border">
                <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Benchmarks de referencia — {sector}</p>
                <div className="flex flex-wrap gap-4 font-body text-xs text-foreground">
                  <span>Beta: <strong>{benchData.beta}</strong></span>
                  <span>WACC ref: <strong>{benchData.waccRef}%</strong></span>
                  <span>Margen EBITDA: <strong>{benchData.ebitdaMargin}%</strong></span>
                  <span>EV/EBITDA: <strong>{benchData.evEbitda}x</strong></span>
                </div>
                <p className="font-body text-[9px] text-muted-foreground mt-1">Fuente: Damodaran · Dataset Velarix</p>
              </div>
            )}
            <div>
              <label className="font-body text-xs text-muted-foreground block mb-1">Moneda del análisis *</label>
              <select value={moneda} onChange={e => setMoneda(e.target.value)}
                className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50">
                <option value="COP">COP — Peso colombiano (mantener moneda original)</option>
                <option value="USD">USD — Dólar estadounidense (convertir a USD)</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground block mb-1">Crecimiento esperado de ingresos (%) *</label>
              <input type="number" value={growth} onChange={e => setGrowth(Number(e.target.value))}
                className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
                min={-50} max={200} />
            </div>
            <button onClick={handleStep1} disabled={creating}
              className="bg-primary text-primary-foreground font-body text-sm px-6 py-2.5 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors active:scale-[0.97]">
              {creating ? <><Loader2 size={14} className="inline animate-spin mr-2" />Guardando...</> : "Continuar →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Document upload */}
      {step === 2 && analysisId && (
        <DocumentUpload analysisId={analysisId} onComplete={handleDocumentsComplete} />
      )}

      {/* Step 3 — Processing (ProgressPanel) */}
      {step === 3 && analysisId && (
        <div className="space-y-6">
          <ProgressPanel
            analysisId={analysisId}
            onCompletado={handlePipelineComplete}
            onError={handlePipelineError}
          />
          {pipelineError && (
            <div className="text-center space-y-3">
              <button onClick={handleRetry}
                className="inline-flex items-center gap-2 bg-destructive/10 text-destructive font-body text-sm px-5 py-2.5 rounded border border-destructive/30 hover:bg-destructive/20 transition-colors">
                <RotateCcw size={14} />
                Intentar nuevamente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Analysis ready */}
      {step === 4 && (
        <div className="metallic-border rounded-lg bg-card p-8 text-center max-w-lg mx-auto">
          <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="font-display text-lg font-bold text-foreground mb-2">¡Análisis completado!</h2>
          <p className="font-body text-sm text-muted-foreground mb-6">
            Los documentos de <strong>{company}</strong> han sido procesados exitosamente. Ya puedes ver los resultados completos.
          </p>
          <button onClick={onComplete}
            className="bg-primary text-primary-foreground font-body text-sm px-6 py-2.5 rounded hover:bg-primary/90 active:scale-[0.97]">
            Ver mi análisis completo →
          </button>
        </div>
      )}
    </div>
  );
};

export default NewAnalysisStepper;
