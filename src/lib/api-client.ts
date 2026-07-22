import { supabase } from "@/integrations/supabase/client";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("No autenticado. Inicia sesión para continuar.");
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

async function callFunction(name: string, body: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data.error?.message || "Error desconocido";
    const errorCode = data.error?.code || "UNKNOWN";

    if (response.status === 429) throw new Error("Límite de solicitudes alcanzado. Intenta de nuevo en unos segundos.");
    if (response.status === 402) throw new Error("Créditos insuficientes. Contacta al administrador.");
    if (response.status === 409) throw new Error("Ya hay un proceso en curso para este análisis.");

    throw new Error(`[${errorCode}] ${errorMsg}`);
  }

  return data;
}

// ─── Analysis CRUD ───

export async function createAnalysis(sector: string, companyName: string, expectedGrowth: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: user.id,
      sector,
      company_name: companyName,
      expected_growth: expectedGrowth,
      status: "creado",
    })
    .select()
    .single();

  if (error) throw new Error(`Error al crear análisis: ${error.message}`);
  return data;
}

export async function getAnalyses() {
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Error al obtener análisis: ${error.message}`);
  return data;
}

export async function getAnalysis(analysisId: string) {
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .single();

  if (error) throw new Error(`Error al obtener análisis: ${error.message}`);
  return data;
}

export async function deleteAnalysis(analysisId: string) {
  const { error } = await supabase
    .from("analyses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", analysisId);

  if (error) throw new Error(`Error al eliminar análisis: ${error.message}`);
}

// ─── Document Upload ───

export async function uploadDocument(analysisId: string, file: File, docType: "estado_resultados" | "balance_general") {
  const headers = await getAuthHeaders();
  delete (headers as any)["Content-Type"]; // Let browser set multipart boundary

  const formData = new FormData();
  formData.append("file", file);
  formData.append("analysis_id", analysisId);
  formData.append("doc_type", docType);

  const response = await fetch(`${FUNCTIONS_URL}/upload-document`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || "Error al cargar el documento.");
  }

  return data;
}

// ─── Pipeline Execution ───

export async function runAnalysisPipeline(analysisId: string) {
  return callFunction("run-analysis-pipeline", { analysis_id: analysisId });
}

export async function parseDocument(analysisId: string, documentId: string) {
  return callFunction("parse-document", { analysis_id: analysisId, document_id: documentId });
}

export async function mapAccounts(analysisId: string) {
  return callFunction("map-accounts", { analysis_id: analysisId });
}

export async function validateAnalysis(analysisId: string) {
  return callFunction("validate-analysis", { analysis_id: analysisId });
}

export async function buildStructuredInput(analysisId: string) {
  return callFunction("build-structured-input", { analysis_id: analysisId });
}

// ─── Narrative Generation ───

export async function generateNarrative(analysisId: string, calculationOutput: any) {
  return callFunction("generate-narrative", {
    analysis_id: analysisId,
    calculation_output: calculationOutput,
  });
}

// ─── Store Calculation Results ───

export async function storeCalculationResults(analysisId: string, inputPayload: any, outputPayload: any) {
  const { error } = await supabase
    .from("calculation_results")
    .insert({
      analysis_id: analysisId,
      input_payload: inputPayload,
      output_payload: outputPayload,
      engine_version: "2.1",
    });

  if (error) throw new Error(`Error al guardar resultados: ${error.message}`);

  await supabase
    .from("analyses")
    .update({ status: "calculo_completo" })
    .eq("id", analysisId);
}

// ─── Snapshots ───

export async function getCurrentSnapshot(sector: string) {
  const { data, error } = await supabase
    .from("external_snapshots")
    .select("*")
    .eq("sector", sector)
    .order("effective_date", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function getSnapshot(snapshotId: string) {
  const { data, error } = await supabase
    .from("external_snapshots")
    .select("*")
    .eq("id", snapshotId)
    .single();

  if (error) throw new Error(`Snapshot no encontrado: ${error.message}`);
  return data;
}

// ─── Audit Events ───

export async function getAuditEvents(analysisId: string) {
  const { data, error } = await supabase
    .from("audit_events")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Error al obtener eventos: ${error.message}`);
  return data;
}

// ─── Validation Results ───

export async function getValidationResults(analysisId: string) {
  const { data, error } = await supabase
    .from("validation_results")
    .select("*")
    .eq("analysis_id", analysisId);

  if (error) throw new Error(`Error al obtener validaciones: ${error.message}`);
  return data;
}

// ─── Homologated Accounts ───

export async function getMappedAccounts(analysisId: string) {
  const { data, error } = await supabase
    .from("account_homologations")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Error al obtener homologaciones: ${error.message}`);
  return data;
}

// ─── Reports ───

export async function getNarrative(analysisId: string) {
  const { data, error } = await supabase
    .from("report_narratives")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function getGeneratedReports(analysisId: string) {
  const { data, error } = await supabase
    .from("generated_reports")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("generated_at", { ascending: false });

  if (error) return [];
  return data;
}
