// Descarga del PDF real de un caso (antes en `pages/Dashboard.tsx`).
//
// Fail-closed (Fase 1E / Subbloque 1): el PDF solo puede consumir el
// calculation_result canónico ya persistido por ejecutar-calculo —
// históricos, valoración y metadata de versión deben venir del MISMO
// calculation_result. NO se recalcula con el motor cliente, NO se usan
// valores por defecto de UI, y NO se vuelve a consultar structured_inputs:
// si falta algo, se bloquea la descarga.
import { toast } from "sonner";
import { generatePDF } from "@/lib/pdf-generator";
import { mapCanonicalCalculationToPdfData } from "@/lib/pdf-canonical-mapper";
import type { PersistedCalculationResult } from "@/types/calculation-result";

export async function downloadCanonicalPdf(params: {
  companyName: string;
  sector: string;
  calculationResult: PersistedCalculationResult | null;
}): Promise<void> {
  const { calculationResult, companyName, sector } = params;
  if (!calculationResult) {
    toast.error("El cálculo canónico aún no está disponible. Ejecuta el cálculo antes de generar el informe.");
    return;
  }
  if (!calculationResult.source_input_snapshot) {
    toast.error("El cálculo disponible no contiene el snapshot canónico requerido para generar un informe trazable. Vuelve a ejecutar el cálculo.");
    return;
  }
  try {
    const { result, inputs, historicals } = mapCanonicalCalculationToPdfData({ calculationResult, companyName, sector });
    await generatePDF(result, inputs, "ejecutivo", historicals);
    toast.success("PDF generado y descargado.");
  } catch (err) {
    console.error("[downloadCanonicalPdf]", err);
    toast.error("Error al generar el PDF: " + (err instanceof Error ? err.message : "Error desconocido"));
  }
}
