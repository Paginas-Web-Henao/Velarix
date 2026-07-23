// Módulo puro compartido — Bloque 1B-P0, BL-06.
//
// Decisión de si el pipeline (`run-analysis-pipeline/index.ts`) debe
// abortar tras el paso de homologación (`map-accounts`). Antes de esta
// corrección, ni un `success: false` ni `has_blocking_issues: true`
// detenían el pipeline — la ejecución siempre continuaba al paso de
// validación con cuentas potencialmente mal homologadas o sin homologar.
//
// Sin imports de URL, sin Supabase, sin `serve()`, sin variables de
// entorno, sin efectos secundarios — importable desde Deno y desde
// Vitest indistintamente.

export interface MapAccountsResult {
  success: boolean;
  error?: { message?: string };
  data?: {
    total_mapped?: number;
    has_blocking_issues?: boolean;
    missing_critical?: string[];
  };
}

export interface PipelineAbortDecision {
  shouldAbort: boolean;
  errorCode?: string;
  errorMessage?: string;
  analysisStatus?: string;
}

/**
 * Evalúa la respuesta de `map-accounts` y decide si el pipeline debe
 * abortar antes de llegar a validación/cálculo. Nunca deja pasar un
 * `success: false` ni cuentas críticas faltantes en silencio.
 */
export function evaluateMapAccountsResult(mapResult: MapAccountsResult): PipelineAbortDecision {
  if (!mapResult.success) {
    return {
      shouldAbort: true,
      errorCode: "MAP_ACCOUNTS_FAILED",
      errorMessage: mapResult.error?.message || "Error al homologar las cuentas contables.",
      analysisStatus: "error_tecnico",
    };
  }

  if (mapResult.data?.has_blocking_issues) {
    return {
      shouldAbort: true,
      errorCode: "MAP_ACCOUNTS_BLOCKING",
      errorMessage: `Cuentas críticas faltantes: ${(mapResult.data.missing_critical || []).join(", ")}`,
      analysisStatus: "validacion_bloqueada",
    };
  }

  return { shouldAbort: false };
}
