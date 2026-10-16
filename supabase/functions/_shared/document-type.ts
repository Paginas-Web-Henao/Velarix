// Tipo documental efectivo de un documento parseado (decisión pura).
//
// Regla: una clasificación determinística más rica nunca se degrada por una
// clasificación de IA parcial. Si el extractor de libros detectó al menos dos
// estados financieros principales (balance, resultados, flujo de caja), el
// documento es `estados_financieros`, aunque la IA — que solo ve una muestra
// de las primeras filas — diga `balance_general` o `estado_resultados`.
// Sin esa evidencia determinística se conserva la regla previa: IA →
// declarado en la carga → detección de contenido si nada es reconocible.

export const COMBINED_FINANCIAL_STATEMENTS = "estados_financieros";

export type DocTypeOrigin = "DETERMINISTIC_WORKBOOK" | "AI_CLASSIFIER" | "DECLARED" | "CONTENT_DETECTION";

export interface DocTypeInput {
  /** Categorías de estados principales extraídas determinísticamente (p. ej. ["balance_sheet", "income_statement", "cash_flow"]). */
  workbookStatements?: readonly string[] | null;
  aiType?: string | null;
  declared?: string | null;
  content: { tieneEstadoResultados: boolean; tieneBalanceGeneral: boolean; tieneAmbos: boolean };
}

export function resolveEffectiveDocType(input: DocTypeInput): { docType: string; origin: DocTypeOrigin } {
  const principal = new Set((input.workbookStatements ?? []).filter((s) => ["balance_sheet", "income_statement", "cash_flow"].includes(s)));
  if (principal.size >= 2) return { docType: COMBINED_FINANCIAL_STATEMENTS, origin: "DETERMINISTIC_WORKBOOK" };

  let docType = input.aiType || input.declared || "no_reconocible";
  let origin: DocTypeOrigin = input.aiType ? "AI_CLASSIFIER" : input.declared ? "DECLARED" : "CONTENT_DETECTION";
  if (docType === "no_reconocible") {
    if (input.content.tieneAmbos) docType = "mixto";
    else if (input.content.tieneEstadoResultados) docType = "estado_resultados";
    else if (input.content.tieneBalanceGeneral) docType = "balance_general";
    if (docType !== "no_reconocible") origin = "CONTENT_DETECTION";
  }
  return { docType, origin };
}

/**
 * Tipo operacional de un documento persistido: el efectivo resuelto por el
 * parser y, si aún no existe (documento sin parsear o legacy), el declarado
 * en la carga. El declarado nunca se sobrescribe.
 */
export function effectiveDocType(doc: { doc_type_effective?: string | null; doc_type_declared?: string | null } | null | undefined): string | null {
  return doc?.doc_type_effective ?? doc?.doc_type_declared ?? null;
}
