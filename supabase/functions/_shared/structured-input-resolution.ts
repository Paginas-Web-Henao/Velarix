// Hallazgo B — resolución de la fuente canónica del structured input que
// consume `ejecutar-calculo`. `structured_inputs.input_payload` es la
// fuente canónica (constraint UNIQUE NOT NULL sobre analysis_id: una sola
// fila por análisis, sin ambigüedad de versión; ya es la fuente que lee
// el flujo real de descarga de PDF del frontend en
// src/pages/Dashboard.tsx). `analyses.input_payload` se conserva
// únicamente como fallback legacy para analyses anteriores a la
// existencia de `structured_inputs` — solo se usa si no hay fila ahí, así
// que no puede haber drift silencioso entre ambas fuentes cuando ambas
// existen: `structured_inputs` siempre gana.

export type StructuredInputSource = "structured_inputs" | "analyses_legacy" | "none";

export interface StructuredInputResolution {
  payload: unknown | null;
  source: StructuredInputSource;
}

export function resolveStructuredInput(params: {
  structuredInputPayload: unknown | null | undefined;
  analysisInputPayload: unknown | null | undefined;
}): StructuredInputResolution {
  if (params.structuredInputPayload !== null && params.structuredInputPayload !== undefined) {
    return { payload: params.structuredInputPayload, source: "structured_inputs" };
  }
  if (params.analysisInputPayload !== null && params.analysisInputPayload !== undefined) {
    return { payload: params.analysisInputPayload, source: "analyses_legacy" };
  }
  return { payload: null, source: "none" };
}
