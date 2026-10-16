import { supabase } from "@/integrations/supabase/client";
import { selectActiveRows, evaluateManualMappingCorrection } from "../../supabase/functions/_shared/evidence-runs";

/** Corrección rechazada: la fila pertenece a un evidence run versionado (inmutable). */
export class VersionedManualCorrectionError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "VersionedManualCorrectionError";
  }
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("No autenticado.");
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

// ── Create manual review request ──

export async function crearRevisionManual({
  analysisId,
  motivo,
  cuentasARevisar,
  prioridad = "normal",
}: {
  analysisId: string;
  motivo: string;
  cuentasARevisar?: any[];
  prioridad?: "normal" | "urgente";
}) {
  // Check if review already exists
  const { data: existing } = await supabase
    .from("manual_reviews")
    .select("id, estado")
    .eq("analysis_id", analysisId)
    .in("estado", ["pendiente", "en_revision"])
    .maybeSingle();

  if (existing) return { revision_id: existing.id, ya_existia: true };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data, error } = await supabase
    .from("manual_reviews")
    .insert({
      analysis_id: analysisId,
      requested_by: user.id,
      reason: motivo,
      estado: "pendiente",
      prioridad,
      cuentas_a_revisar: cuentasARevisar || [],
    } as any)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("analyses").update({ status: "revision_manual_requerida" }).eq("id", analysisId);

  await supabase.from("audit_events").insert({
    analysis_id: analysisId,
    user_id: user.id,
    event_type: "revision_manual_solicitada",
    event_detail: `Motivo: ${motivo}. Cuentas: ${cuentasARevisar?.length || 0}`,
    component: "manual-review",
  });

  return { revision_id: data.id, ya_existia: false };
}

// ── Get pending reviews ──

export async function obtenerRevisionesPendientes() {
  const { data, error } = await supabase
    .from("manual_reviews")
    .select(`
      *,
      analyses!inner(company_name, sector, status, user_id)
    `)
    .in("estado", ["pendiente", "en_revision"])
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// ── Get all reviews (with optional filter) ──

export async function obtenerRevisiones(filtro?: string) {
  let query = supabase
    .from("manual_reviews")
    .select(`
      *,
      analyses!inner(company_name, sector, status)
    `)
    .order("created_at", { ascending: false });

  if (filtro && filtro !== "todas") {
    query = query.eq("estado", filtro);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ── Take a review ──

export async function tomarRevision(revisionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data, error } = await supabase
    .from("manual_reviews")
    .update({
      estado: "en_revision",
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", revisionId)
    .eq("estado", "pendiente")
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Get review detail with related data ──

export async function obtenerDetalleRevision(revisionId: string) {
  const { data: revision, error } = await supabase
    .from("manual_reviews")
    .select(`
      *,
      analyses!inner(company_name, sector, status, expected_growth)
    `)
    .eq("id", revisionId)
    .single();

  if (error) throw error;

  const analysisId = revision.analysis_id;

  const { data: analysisRow } = await supabase.from("analyses").select("*").eq("id", analysisId).maybeSingle();
  const activeRunId = (analysisRow as { active_evidence_run_id?: string | null } | null)?.active_evidence_run_id ?? null;
  const [homologaciones, validaciones] = await Promise.all([
    supabase
      .from("account_homologations")
      .select("*")
      .eq("analysis_id", analysisId)
      .order("created_at", { ascending: true }),
    supabase
      .from("validation_results")
      .select("*")
      .eq("analysis_id", analysisId)
      .eq("status", "failed"),
  ]);

  return {
    revision,
    // Solo el set activo de Evidence (el historial de runs no se mezcla).
    cuentas_homologadas: selectActiveRows(homologaciones.data || [], activeRunId),
    validaciones_fallidas: selectActiveRows(validaciones.data || [], activeRunId),
  };
}

// ── Apply account correction ──

export async function corregirCuenta({
  revisionId,
  homologationId,
  nuevoCanonicalAccount,
  justificacion,
}: {
  revisionId: string;
  homologationId: string;
  nuevoCanonicalAccount: string | null;
  justificacion: string;
}) {
  if (!justificacion || justificacion.trim().length < 10) {
    throw new Error("La justificación debe tener al menos 10 caracteres.");
  }

  // Get original
  const { data: original } = await supabase
    .from("account_homologations")
    .select("*")
    .eq("id", homologationId)
    .single();

  if (!original) throw new Error("Cuenta no encontrada.");

  // ADR-009: una fila de un evidence run no cambia retrospectivamente. Solo el
  // modelo legacy (sin run activo ni run en la fila) admite la corrección en
  // sitio; en un caso versionado se rechaza ANTES de cualquier UPDATE.
  const { data: analysisRow } = await supabase.from("analyses").select("*").eq("id", original.analysis_id).maybeSingle();
  const decision = evaluateManualMappingCorrection({
    activeRunId: (analysisRow as { active_evidence_run_id?: string | null } | null)?.active_evidence_run_id ?? null,
    rowRunId: (original as { evidence_run_id?: string | null }).evidence_run_id ?? null,
  });
  if ("code" in decision) throw new VersionedManualCorrectionError(decision.code, decision.message);

  // Update the mapping
  await supabase
    .from("account_homologations")
    .update({
      canonical_account: nuevoCanonicalAccount || "sin_mapear",
      confidence_score: "alta",
      ambiguity_flag: false,
      mapping_notes: `[REVISIÓN MANUAL] ${justificacion}`,
    })
    .eq("id", homologationId);

  // Record correction in review
  const { data: review } = await supabase
    .from("manual_reviews")
    .select("correcciones")
    .eq("id", revisionId)
    .single();

  const correcciones = ((review as any)?.correcciones as any[]) || [];
  correcciones.push({
    homologation_id: homologationId,
    original: original.canonical_account,
    corregido: nuevoCanonicalAccount,
    justificacion,
    timestamp: new Date().toISOString(),
  });

  await supabase
    .from("manual_reviews")
    .update({ correcciones, updated_at: new Date().toISOString() } as any)
    .eq("id", revisionId);

  // Audit
  await supabase.from("audit_events").insert({
    analysis_id: original.analysis_id,
    event_type: "cuenta_corregida_manualmente",
    event_detail: `"${original.original_label}": ${original.canonical_account} → ${nuevoCanonicalAccount}. ${justificacion}`,
    component: "manual-review",
  });

  return { corregida: true };
}

// ── Approve review ──

export async function aprobarRevision({
  revisionId,
  notas,
}: {
  revisionId: string;
  notas: string;
}) {
  if (!notas || notas.trim().length < 20) {
    throw new Error("Las notas de resolución son obligatorias (mínimo 20 caracteres).");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data: revision } = await supabase
    .from("manual_reviews")
    .select("analysis_id")
    .eq("id", revisionId)
    .single();

  if (!revision) throw new Error("Revisión no encontrada.");

  await supabase
    .from("manual_reviews")
    .update({
      estado: "aprobado",
      reviewed_by: user.id,
      resolution: "approved",
      resolution_notes: notas,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", revisionId);

  await supabase.from("audit_events").insert({
    analysis_id: revision.analysis_id,
    user_id: user.id,
    event_type: "revision_manual_aprobada",
    event_detail: notas,
    component: "manual-review",
  });

  // Trigger continuation
  try {
    const headers = await getAuthHeaders();
    await fetch(`${FUNCTIONS_URL}/continuar-tras-revision`, {
      method: "POST",
      headers,
      body: JSON.stringify({ analysis_id: revision.analysis_id }),
    });
  } catch (e) {
    console.error("Error al continuar tras revisión:", e);
  }

  return { aprobado: true };
}

// ── Block review ──

export async function bloquearRevision({
  revisionId,
  motivoBloqueo,
}: {
  revisionId: string;
  motivoBloqueo: string;
}) {
  if (!motivoBloqueo || motivoBloqueo.trim().length < 20) {
    throw new Error("El motivo de bloqueo es obligatorio (mínimo 20 caracteres).");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data: revision } = await supabase
    .from("manual_reviews")
    .select("analysis_id")
    .eq("id", revisionId)
    .single();

  if (!revision) throw new Error("Revisión no encontrada.");

  await supabase
    .from("manual_reviews")
    .update({
      estado: "bloqueado",
      reviewed_by: user.id,
      resolution: "blocked",
      resolution_notes: motivoBloqueo,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", revisionId);

  await supabase
    .from("analyses")
    .update({ status: "validacion_bloqueada" })
    .eq("id", revision.analysis_id);

  await supabase.from("audit_events").insert({
    analysis_id: revision.analysis_id,
    user_id: user.id,
    event_type: "revision_manual_bloqueada",
    event_detail: motivoBloqueo,
    component: "manual-review",
  });

  return { bloqueado: true };
}
