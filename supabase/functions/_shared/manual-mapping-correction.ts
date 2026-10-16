// Reglas puras de la corrección manual de homologaciones sobre Evidence
// versionada (ADR-011, cierra LIM-09). Sin Supabase, sin Deno.
//
// Una corrección de HOMOLOGACIÓN cambia solo la cuenta canónica (y la metadata
// de mapping de esa fila); nunca la Evidence observada (label, valor, período,
// documento, estado fuente). La cuenta destino debe pertenecer a la taxonomía
// del MISMO estado financiero que la fila (`category`): reclasificar una fila
// entre estados (p. ej. tomar D&A del flujo de caja como `da`) es una decisión
// metodológica de fuentes, no una corrección de mapping. `unclassified`
// (des-mapear) siempre se admite.

import { TAXONOMY } from "./account-taxonomy.ts";

export const UNCLASSIFIED = "unclassified";
export const MANUAL_CORRECTION_REASON_MIN = 10;
export const MANUAL_CORRECTION_ACTOR_FIELDS = ["created_by", "manual_correction_by", "manual_corrected_at", "user_id", "actor"] as const;
export const MANUAL_CORRECTION_ROLES: readonly string[] = ["analyst", "admin"];

export function allowedCanonicalAccountsFor(category: string | null | undefined): string[] {
  const section = category ? TAXONOMY[category] : undefined;
  return [...(section ? Object.keys(section) : []), UNCLASSIFIED];
}

export type CorrectionTargetDecision = { ok: true } | { ok: false; code: "CANONICAL_ACCOUNT_NOT_ALLOWED" | "MANUAL_CORRECTION_NOOP"; message: string };

export function evaluateCorrectionTarget(row: { canonical_account: string; category: string | null }, target: string): CorrectionTargetDecision {
  const allowed = allowedCanonicalAccountsFor(row.category);
  if (!allowed.includes(target)) {
    return { ok: false, code: "CANONICAL_ACCOUNT_NOT_ALLOWED", message: `"${target}" no es una cuenta canónica válida para una fila de ${row.category ?? "estado desconocido"} (válidas: ${allowed.join(", ")}). Usar una fila de otro estado como fuente es una decisión metodológica, no una corrección de mapping.` };
  }
  if (row.canonical_account === target) return { ok: false, code: "MANUAL_CORRECTION_NOOP", message: `La fila ya está mapeada a "${target}".` };
  return { ok: true };
}

/** Traduce el rechazo de la RPC (los mensajes empiezan con el código) a una respuesta estable. */
export function classifyCorrectionRpcError(error: { message?: string }): { status: number; code: string } {
  const code = (error.message ?? "").split(":")[0].trim();
  const map: Record<string, number> = {
    EVIDENCE_RUN_CHANGED: 409, CASE_ALREADY_CALCULATED: 409, HOMOLOGATION_NOT_IN_ACTIVE_RUN: 409, ACTIVE_EVIDENCE_RUN_INVALID: 409,
    MANUAL_CORRECTION_NOOP: 400, MANUAL_CORRECTION_INVALID: 400, ANALYSIS_NOT_FOUND: 404, MANUAL_CORRECTION_COPY_MISMATCH: 500,
  };
  return map[code] ? { status: map[code], code } : { status: 500, code: "MANUAL_CORRECTION_FAILED" };
}
