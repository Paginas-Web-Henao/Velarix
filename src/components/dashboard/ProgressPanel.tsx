import { useEffect, useState, useCallback } from "react";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { CheckCircle2, AlertTriangle, Loader2, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

const FASES = [
  { numero: 1, nombre: "Documentos", icono: "📄" },
  { numero: 2, nombre: "Extracción", icono: "🔍" },
  { numero: 3, nombre: "Validación", icono: "✓" },
  { numero: 4, nombre: "Cálculo", icono: "⚡" },
  { numero: 5, nombre: "Narrativa", icono: "📝" },
  { numero: 6, nombre: "Informe", icono: "📊" },
];

const TIEMPO_ESTIMADO = 120;

interface Props {
  analysisId: string;
  onCompletado?: () => void;
  onError?: (msg: string) => void;
}

interface FailedRule {
  rule_code: string;
  severity: string;
  detail: string | null;
}

const ProgressPanel = ({ analysisId, onCompletado, onError }: Props) => {
  const { progreso, completado, error } = useAnalysisProgress(analysisId);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_ESTIMADO);
  const [timerActivo, setTimerActivo] = useState(true);
  const [failedRules, setFailedRules] = useState<FailedRule[]>([]);
  const [notaConversion, setNotaConversion] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!timerActivo) return;
    const timer = setInterval(() => {
      setTiempoTranscurrido(t => t + 1);
      setTiempoRestante(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timerActivo]);

  const formatTiempo = (s: number) => {
    const m = Math.floor(s / 60);
    const seg = s % 60;
    return `${m}:${seg.toString().padStart(2, "0")}`;
  };

  const getMensajeTimer = () => {
    if (completado) return `✓ Completado en ${formatTiempo(tiempoTranscurrido)} — ¡más rápido de lo esperado!`;
    if (error) return `Falló después de ${formatTiempo(tiempoTranscurrido)}`;
    if (tiempoTranscurrido < 30) return `Tiempo estimado: ${formatTiempo(tiempoRestante)}`;
    if (tiempoTranscurrido < 60) return `Procesando... ${formatTiempo(tiempoRestante)} restantes`;
    if (tiempoTranscurrido < 90) return `Casi listo, generando el análisis... ${formatTiempo(tiempoRestante)}`;
    if (tiempoRestante > 0) return `Tomando un poco más de lo usual, ya casi... ${formatTiempo(tiempoRestante)}`;
    return `Procesando documento complejo, por favor espera...`;
  };

  // Fetch conversion note
  useEffect(() => {
    const fetchNota = async () => {
      const { data } = await supabase
        .from("audit_events").select("metadata")
        .eq("analysis_id", analysisId).eq("event_type", "parse_complete")
        .order("created_at", { ascending: false }).limit(1);
      const meta = data?.[0]?.metadata as any;
      const nota = meta?.nota_moneda || meta?.nota_conversion;
      if (nota) setNotaConversion(nota);
    };
    fetchNota();
  }, [analysisId, progreso?.fase]);

  // Stop timer + callbacks
  useEffect(() => {
    if (completado) { setTimerActivo(false); onCompletado?.(); }
  }, [completado, onCompletado]);

  useEffect(() => {
    if (error) { setTimerActivo(false); onError?.(error); }
  }, [error, onError]);

  // Fetch failed rules
  useEffect(() => {
    if (!error && progreso?.validacion !== "bloqueado") return;
    const fetchRules = async () => {
      const { data } = await supabase
        .from("validation_results").select("rule_code, severity, detail")
        .eq("analysis_id", analysisId).eq("status", "failed")
        .order("blocking_flag", { ascending: false });
      if (data && data.length > 0) setFailedRules(data as FailedRule[]);
    };
    fetchRules();
  }, [analysisId, error, progreso?.validacion]);

  return (
    <div className="metallic-border rounded-lg bg-card p-8">
      <h3 className="font-display text-lg font-bold text-foreground mb-6">
        Ejecutando análisis financiero
      </h3>

      {/* Phase indicators */}
      <div className="flex items-center gap-1 mb-8">
        {FASES.map((fase) => {
          const completada = (progreso?.fase || 0) > fase.numero;
          const activa = (progreso?.fase || 0) === fase.numero;
          return (
            <div key={fase.numero} className={`flex-1 text-center transition-opacity ${completada || activa ? "opacity-100" : "opacity-30"}`}>
              <div className={`w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center text-sm border ${
                completada ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" :
                activa ? "bg-primary/20 border-primary text-primary" :
                "bg-muted/20 border-border text-muted-foreground"
              }`}>
                {completada ? <CheckCircle2 size={14} /> : activa ? <Loader2 size={14} className="animate-spin" /> : <span className="text-xs">{fase.icono}</span>}
              </div>
              <span className="font-body text-[10px] text-muted-foreground">{fase.nombre}</span>
            </div>
          );
        })}
      </div>

      <Progress value={progreso?.porcentaje || 0} className="h-1.5 mb-4" />

      {/* Conversion note */}
      {notaConversion && (
        <div className="mb-4 p-2.5 rounded-md bg-primary/10 border border-primary/20">
          <p className="font-body text-xs text-primary flex items-center gap-1.5">
            <Info size={13} />
            {notaConversion}
          </p>
        </div>
      )}

      {/* Status message */}
      <p className="font-body text-sm text-muted-foreground text-center">
        {error || progreso?.mensaje || "Iniciando..."}
      </p>

      {/* Percentage */}
      <p className={`font-mono text-2xl font-bold text-center mt-2 ${
        error ? "text-destructive" : completado ? "text-emerald-400" : "text-primary"
      }`}>
        {error ? "Error" : completado ? "✓" : `${progreso?.porcentaje || 0}%`}
      </p>

      {/* Countdown timer */}
      <p className="font-mono text-xs text-muted-foreground text-center mt-1">
        {getMensajeTimer()}
      </p>

      {/* Error detail */}
      {error && (
        <div className="mt-4 p-4 rounded bg-destructive/10 border border-destructive/30">
          <p className="font-body text-sm text-destructive flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </p>
        </div>
      )}

      {/* Failed rules */}
      {failedRules.length > 0 && (
        <div className="mt-4 p-4 rounded bg-destructive/5 border border-destructive/20">
          <p className="font-body text-xs font-semibold text-destructive mb-2">Reglas de validación que fallaron:</p>
          <div className="space-y-1.5">
            {failedRules.map((rule) => (
              <div key={rule.rule_code} className="flex items-start gap-2">
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                  rule.severity === "critica" ? "bg-destructive/20 text-destructive" : "bg-yellow-500/20 text-yellow-600"
                }`}>{rule.rule_code}</span>
                <span className="font-body text-[11px] text-muted-foreground">{rule.detail || "Sin detalle"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job details */}
      {progreso?.jobs && progreso.jobs.length > 0 && (
        <div className="mt-6 space-y-1">
          {progreso.jobs.map((job, i) => (
            <div key={i} className="flex items-center gap-2 font-body text-[10px]">
              <span className={
                job.status === "completado" ? "text-emerald-400" :
                job.status === "error" ? "text-destructive" :
                job.status === "en_progreso" ? "text-primary" : "text-muted-foreground"
              }>
                {job.status === "completado" ? "✓" : job.status === "error" ? "✗" : job.status === "en_progreso" ? "◉" : "○"}
              </span>
              <span className="text-muted-foreground capitalize">{job.job_type}: {job.progreso_mensaje || job.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressPanel;
