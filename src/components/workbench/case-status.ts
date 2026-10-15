// Etiquetas de `analyses.status` (enum `analysis_status`).
export const CASE_STATUS: Record<string, { label: string; color: string }> = {
  creado: { label: "Creado", color: "text-muted-foreground" },
  documentos_cargados: { label: "Documentos cargados", color: "text-sky-300" },
  parsing_en_curso: { label: "Extrayendo…", color: "text-sky-300" },
  parsing_completado: { label: "Extracción completa", color: "text-sky-300" },
  homologacion_en_curso: { label: "Homologando…", color: "text-sky-300" },
  validacion_aprobada: { label: "Validado", color: "text-emerald-300" },
  validacion_con_advertencias: { label: "Validado con advertencias", color: "text-amber-300" },
  validacion_bloqueada: { label: "Validación bloqueada", color: "text-destructive" },
  revision_manual_requerida: { label: "Revisión manual", color: "text-amber-300" },
  calculo_en_curso: { label: "Calculando…", color: "text-sky-300" },
  calculo_completo: { label: "Cálculo completo", color: "text-emerald-300" },
  interpretacion_en_curso: { label: "Generando narrativa…", color: "text-sky-300" },
  informe_generado: { label: "Completado", color: "text-emerald-300" },
  error_tecnico: { label: "Error técnico", color: "text-destructive" },
};
