import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const ESTADOS_PROGRESO: Record<string, { pct: number; msg: string; fase: number }> = {
  creado:                      { pct: 2,   msg: "Iniciando análisis...",                    fase: 1 },
  documentos_cargados:         { pct: 5,   msg: "Documentos recibidos.",                     fase: 1 },
  parsing_en_curso:            { pct: 15,  msg: "Extrayendo información financiera...",      fase: 2 },
  parsing_completado:          { pct: 30,  msg: "Documentos procesados.",                    fase: 2 },
  homologacion_en_curso:       { pct: 45,  msg: "Homologando cuentas contables...",          fase: 3 },
  validacion_aprobada:         { pct: 55,  msg: "Información validada.",                     fase: 3 },
  validacion_con_advertencias: { pct: 55,  msg: "Validado con advertencias.",                fase: 3 },
  validacion_bloqueada:        { pct: 55,  msg: "Validación bloqueada.",                     fase: 3 },
  calculo_en_curso:            { pct: 65,  msg: "Calculando proyecciones y valoración...",   fase: 4 },
  calculo_completo:            { pct: 75,  msg: "Cálculo financiero completado.",            fase: 4 },
  interpretacion_en_curso:     { pct: 85,  msg: "Generando análisis institucional...",       fase: 5 },
  informe_generado:            { pct: 100, msg: "¡Informe listo para descarga!",             fase: 6 },
  error_tecnico:               { pct: 0,   msg: "Error en el análisis.",                     fase: 0 },
  revision_manual_requerida:   { pct: 55,  msg: "Revisión manual requerida.",                fase: 3 },
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

      if (analysis.status === "informe_generado" || analysis.status === "calculo_completo") {
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
