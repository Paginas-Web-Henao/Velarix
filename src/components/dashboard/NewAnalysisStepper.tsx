import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, Loader2, XCircle, RotateCcw } from "lucide-react";
import DocumentUpload from "./DocumentUpload";
import { SECTOR_BENCHMARKS, SECTOR_KEYS } from "@/lib/financial-engine";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import ProgressPanel from "./ProgressPanel";
import { buildNewCaseRow } from "@/lib/new-case";
import type { PipelineOutcome } from "@/lib/evidence-pipeline";

const SECTORS = SECTOR_KEYS;

interface Props {
  userId: string;
  /** Evidence procesada: el Workbench abre el caso creado. */
  onComplete: (analysisId: string) => void;
}

const steps = [
  { num: 1, label: "Datos de la empresa" },
  { num: 2, label: "Cargar documentos" },
  { num: 3, label: "Procesar Evidence" },
  { num: 4, label: "Evidence lista" },
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
  // Metadata opcional del caso: vacío = null (pendiente), nunca inventado.
  const [valuationDate, setValuationDate] = useState("");
  const [basePeriod, setBasePeriod] = useState("");
  const [basisOfValue, setBasisOfValue] = useState("");
  const [valuedInterest, setValuedInterest] = useState("");
  const [calcArchitecture, setCalcArchitecture] = useState("");

  const sectorKey = Object.keys(SECTOR_BENCHMARKS).find(
    k => SECTOR_BENCHMARKS[k].label === sector
  );
  const benchData = sectorKey ? SECTOR_BENCHMARKS[sectorKey] : null;

  const handleStep1 = async () => {
    if (!company.trim()) { toast.error("Ingresa el nombre de la empresa."); return; }
    setCreating(true);
    const { data, error } = await supabase
      .from("analyses")
      .insert(buildNewCaseRow({
        userId, company, sector, moneda,
        valuationDate, basePeriod, basisOfValue, valuedInterest, calculationArchitecture: calcArchitecture,
      }))
      .select()
      .single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    setAnalysisId(data.id);
    setStep(2);
    toast.success("Datos guardados. Ahora carga los documentos financieros.");
  };

  // DocumentUpload lanzó el pipeline de Evidence: pasar al seguimiento.
  const handlePipelineStarted = () => {
    setPipelineError(null);
    setStep(3);
  };

  // El servidor respondió: un fallo HTTP (p. ej. 409/400) no cambia el estado del
  // caso, así que el sondeo de ProgressPanel no lo vería. Sin respuesta (red) no
  // se asume fallo: el progreso sigue por el estado del caso.
  const handlePipelineFinished = (outcome: PipelineOutcome) => {
    if (!outcome.ok && !outcome.uncertain) setPipelineError(outcome.message ?? "El pipeline de Evidence falló.");
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
                placeholder="Nombre legal de la empresa" />
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
            <fieldset className="space-y-3 border-t border-border pt-4">
              <legend className="font-body text-xs text-muted-foreground pr-2">
                Metadata del caso (opcional — vacío queda «pendiente»)
              </legend>
              <p className="font-body text-[10px] text-muted-foreground">
                El crecimiento esperado y los supuestos son Judgment: se registran después, no al crear el caso.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="valuation_date" className="font-body text-xs text-muted-foreground block mb-1">Fecha de valoración</label>
                  <input id="valuation_date" type="date" value={valuationDate} onChange={e => setValuationDate(e.target.value)}
                    className="w-full bg-background metallic-border rounded px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label htmlFor="base_period" className="font-body text-xs text-muted-foreground block mb-1">Período base</label>
                  <input id="base_period" type="text" value={basePeriod} onChange={e => setBasePeriod(e.target.value)} placeholder="Ej: FY2024"
                    className="w-full bg-background metallic-border rounded px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50" />
                </div>
              </div>
              <div>
                <label htmlFor="basis_of_value" className="font-body text-xs text-muted-foreground block mb-1">Basis of value</label>
                <input id="basis_of_value" type="text" value={basisOfValue} onChange={e => setBasisOfValue(e.target.value)}
                  className="w-full bg-background metallic-border rounded px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label htmlFor="valued_interest" className="font-body text-xs text-muted-foreground block mb-1">Interés valorado / perímetro</label>
                <input id="valued_interest" type="text" value={valuedInterest} onChange={e => setValuedInterest(e.target.value)}
                  className="w-full bg-background metallic-border rounded px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label htmlFor="calculation_architecture" className="font-body text-xs text-muted-foreground block mb-1">Arquitectura del cálculo</label>
                <input id="calculation_architecture" type="text" value={calcArchitecture} onChange={e => setCalcArchitecture(e.target.value)}
                  className="w-full bg-background metallic-border rounded px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50" />
              </div>
            </fieldset>
            <button onClick={handleStep1} disabled={creating}
              className="bg-primary text-primary-foreground font-body text-sm px-6 py-2.5 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors active:scale-[0.97]">
              {creating ? <><Loader2 size={14} className="inline animate-spin mr-2" />Guardando...</> : "Continuar →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Document upload */}
      {step === 2 && analysisId && (
        <DocumentUpload analysisId={analysisId} onStarted={handlePipelineStarted} onFinished={handlePipelineFinished} />
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
          <h2 className="font-display text-lg font-bold text-foreground mb-2">Evidence procesada</h2>
          <p className="font-body text-sm text-muted-foreground mb-6">
            Los documentos de <strong>{company}</strong> fueron extraídos, homologados y validados. El proceso se detiene aquí:
            el Judgment y el cálculo son pasos posteriores y explícitos.
          </p>
          <button onClick={() => analysisId && onComplete(analysisId)}
            className="bg-primary text-primary-foreground font-body text-sm px-6 py-2.5 rounded hover:bg-primary/90 active:scale-[0.97]">
            Abrir caso →
          </button>
        </div>
      )}
    </div>
  );
};

export default NewAnalysisStepper;
