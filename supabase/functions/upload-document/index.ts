import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, mapErrorToResponse } from "../_shared/user-auth.ts";
import { statusAfterUpload, uploadWarning } from "../_shared/evidence-pipeline-guards.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL")!;
    const secretKey = resolveAdminSecretKey();
    const anonKey = resolvePublishableKey();

    const supabase = createClient(supabaseUrl, secretKey);

    // Verify user using publishable key
    const anonClient = createClient(supabaseUrl, anonKey);
    const user = await requireAuthenticatedUser(authHeader, async (token) => {
      const { data, error } = await anonClient.auth.getUser(token);
      return { user: data.user, error };
    });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const analysisId = formData.get("analysis_id") as string;
    const docType = formData.get("doc_type") as string;

    if (!file || !analysisId || !docType) {
      return new Response(JSON.stringify({ success: false, error: { code: "MISSING_PARAMS", message: "Se requiere archivo, ID de análisis y tipo de documento." } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify analysis belongs to user
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses").select("id, user_id, status, calculation_result").eq("id", analysisId).single();
    const lookup = classifyOwnedResourceLookup(analysisError, analysis, user.id);
    if (lookup === "not_found") throw new NotFoundError();
    if (lookup === "technical_error") throw analysisError;

    // Validate file size (10MB)
    if (file.size > 10485760) {
      return new Response(JSON.stringify({ success: false, error: { code: "DOC_002", message: "El archivo excede el límite de 10MB." } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate MIME type
    const allowedMimes = ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"];
    if (!allowedMimes.includes(file.type)) {
      return new Response(JSON.stringify({ success: false, error: { code: "DOC_001", message: `El formato "${file.type || file.name.split('.').pop()}" no es soportado. Acepta PDF, Excel (.xlsx, .xls) o CSV.` } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate checksum
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Upload to storage
    const storagePath = `${user.id}/${analysisId}/${docType}_${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("financial-documents")
      .upload(storagePath, fileBuffer, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    // Create document record
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        analysis_id: analysisId,
        doc_type_declared: docType,
        original_filename: file.name,
        mime_type: file.type,
        storage_path: storagePath,
        checksum,
        file_size_bytes: file.size,
        processing_status: "pendiente",
      })
      .select()
      .single();
    if (docError) throw new Error(`Document record failed: ${docError.message}`);

    // Update analysis status. Un caso con cálculo oficial persistido conserva
    // su estado: subir un documento no degrada ese cálculo, y el documento
    // NO forma parte de él hasta una futura ejecución/versionado explícitos.
    const newStatus = statusAfterUpload(analysis);
    if (newStatus) await supabase.from("analyses").update({ status: newStatus }).eq("id", analysisId);
    const warning = uploadWarning(analysis);

    // Audit event
    await supabase.from("audit_events").insert({
      analysis_id: analysisId,
      event_type: "upload_document",
      event_detail: `Documento cargado: ${file.name} (${docType})${warning ? " — caso ya calculado: fuera del cálculo oficial existente" : ""}`,
      component: "upload-document",
      user_id: user.id,
      metadata: { document_id: document.id, filename: file.name, mime_type: file.type, size_bytes: file.size, checksum, ...(warning ? { excluded_from_official_calculation: true } : {}) },
    });

    return new Response(JSON.stringify({
      success: true,
      data: { document_id: document.id, filename: file.name, doc_type: docType, checksum, excluded_from_calculation: !!warning, ...(warning ? { warning } : {}) },
      meta: { analysis_id: analysisId, status: newStatus ?? analysis.status, timestamp: new Date().toISOString() },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("upload-document error:", error);
    const mapped = mapErrorToResponse(error, { code: "UPLOAD_ERROR", message: "Error al cargar el documento." });
    return new Response(JSON.stringify(mapped.body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
