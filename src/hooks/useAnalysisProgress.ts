import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EVIDENCE_PHASES_DONE, isEvidenceComplete } from "@/lib/evidence-pipeline";

export interface ProgressState {
  porcentaje: number;
  mensaje: string;
  fase: number;
  jobs: Array<{
    job_type: string;
    status: string;
    progreso_pct: number;
    progreso_mensaje: string;
    error_mensaje: string | null;
  }>;
  validacion: string | null;
}

// Progreso del pipeline de EVIDENCE (parse → cuentas → validación → STOP).
// Fases: 1 Documentos · 2 Extracción · 3 Cuentas · 4 Validación. Los estados de
// cálculo/narrativa/informe (casos legacy o ejecuciones posteriores) no son parte
// de este flujo: se muestran como "todas las fases de Evidence completas".
const FASE_COMPLETA = EVIDENCE_PHASES_DONE;
const ESTADOS_PROGRESO: Record<string, { pct: number; msg: string; fase: number }> = {
  creado:                      { pct: 2,   msg: "Iniciando procesamiento de Evidence...",     fase: 1 },
  documentos_cargados:         { pct: 5,   msg: "Documentos recibidos.",                       fase: 1 },
  parsing_en_curso:            { pct: 15,  msg: "Extrayendo información financiera...",        fase: 2 },
  parsing_completado:          { pct: 30,  msg: "Documentos procesados.",                      fase: 2 },
  homologacion_en_curso:       { pct: 45,  msg: "Homologando cuentas contables...",            fase: 3 },
  validacion_aprobada:         { pct: 100, msg: "Evidence validada. El proceso se detiene aquí.", fase: FASE_COMPLETA },
  validacion_con_advertencias: { pct: 100, msg: "Evidence validada con advertencias. El proceso se detiene aquí.", fase: FASE_COMPLETA },
  validacion_bloqueada:        { pct: 80,  msg: "Validación bloqueada.",                       fase: 4 },
  revision_manual_requerida:   { pct: 80,  msg: "Revisión manual requerida.",                  fase: 4 },
  // Fuera de este flujo (cálculo y posteriores): no se muestran fases de ellos.
  calculo_en_curso:            { pct: 100, msg: "Cálculo en curso (fuera del flujo de Evidence).", fase: FASE_COMPLETA },
  calculo_completo:            { pct: 100, msg: "Cálculo completado.",                         fase: FASE_COMPLETA },
  interpretacion_en_curso:     { pct: 100, msg: "Narrativa en curso.",                         fase: FASE_COMPLETA },
  informe_generado:            { pct: 100, msg: "Informe generado.",                           fase: FASE_COMPLETA },
  error_tecnico:               { pct: 0,   msg: "Error en el procesamiento.",                  fase: 0 },
};

export const useAnalysisProgress = (analysisId: string | null) => {
  const [estado, setEstado] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<ProgressState | null>(null);
  const [completado, setCompletado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const consultarEstado = useCallback(async () => {
    if (!analysisId) return;

    try {
      const { data: analysis } = await supabase
        .from("analyses")
        .select("status, validation_status")
        .eq("id", analysisId)
        .single();

      if (!analysis) return;

      const estadoActual = ESTADOS_PROGRESO[analysis.status];

      // Query jobs for granular progress
      const { data: jobs } = await supabase
        .from("analysis_jobs" as any)
        .select("job_type, status, progreso_pct, progreso_mensaje, error_mensaje")
        .eq("analysis_id", analysisId)
        .order("created_at", { ascending: false });

      const jobsTyped = (jobs || []) as any[];
      const jobActivo = jobsTyped.find((j: any) => j.status === "en_progreso");

      setEstado(analysis.status);
      setProgreso({
        porcentaje: jobActivo?.progreso_pct || estadoActual?.pct || 0,
        mensaje: jobActivo?.progreso_mensaje || estadoActual?.msg || "",
        fase: estadoActual?.fase || 0,
        jobs: jobsTyped,
        validacion: analysis.validation_status,
      });

      // El flujo de Evidence termina en validación aprobada / con advertencias.
      if (isEvidenceComplete(analysis.status)) {
        setCompletado(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }

      if (analysis.status === "error_tecnico") {
        const jobConError = jobsTyped.find((j: any) => j.status === "error");
        setError(jobConError?.error_mensaje || "Error desconocido en el análisis.");
        if (intervalRef.current) clearInterval(intervalRef.current);
      }

      if (analysis.status === "validacion_bloqueada") {
        setError("El análisis fue bloqueado por problemas en la información financiera.");
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch (err) {
      console.error("Error consultando estado:", err);
    }
  }, [analysisId]);

  useEffect(() => {
    if (!analysisId) return;

    setCompletado(false);
    setError(null);
    consultarEstado();

    intervalRef.current = setInterval(consultarEstado, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [analysisId, consultarEstado]);

  return { estado, progreso, completado, error };
};
