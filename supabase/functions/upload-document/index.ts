import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    // Try multiple env var sources for resilience
    const supabaseUrl = Deno.env.get("SUPABASE_URL") 
      || Deno.env.get("VITE_SUPABASE_URL")
      || `https://inujmyxdqbdnzbxxeoyh.supabase.co`;
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") 
      || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
      || req.headers.get("apikey");

    // ENV vars verified available after deploy

    if (!anonKey) {
      throw new Error("No API key available");
    }

    // Use service role key if available, otherwise use anon key with user JWT
    const supabase = serviceRoleKey 
      ? createClient(supabaseUrl, serviceRoleKey)
      : createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } }
        });

    // Verify user using anon key
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const analysisId = formData.get("analysis_id") as string;
    const docType = formData.get("doc_type") as string;

    if (!file || !analysisId || !docType) {
      return new Response(JSON.stringify({ success: false, error: { code: "MISSING_PARAMS", message: "Se requiere archivo, ID de análisis y tipo de documento." } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify analysis belongs to user
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses").select("id, user_id, status").eq("id", analysisId).single();
    if (analysisError || !analysis || analysis.user_id !== user.id) {
      return new Response(JSON.stringify({ success: false, error: { code: "NOT_FOUND", message: "Análisis no encontrado o no autorizado." } }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    // Update analysis status
    await supabase.from("analyses").update({ status: "documentos_cargados" }).eq("id", analysisId);

    // Audit event
    await supabase.from("audit_events").insert({
      analysis_id: analysisId,
      event_type: "upload_document",
      event_detail: `Documento cargado: ${file.name} (${docType})`,
      component: "upload-document",
      user_id: user.id,
      metadata: { document_id: document.id, filename: file.name, mime_type: file.type, size_bytes: file.size, checksum },
    });

    return new Response(JSON.stringify({
      success: true,
      data: { document_id: document.id, filename: file.name, doc_type: docType, checksum },
      meta: { analysis_id: analysisId, status: "documentos_cargados", timestamp: new Date().toISOString() },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("upload-document error:", error);
    return new Response(JSON.stringify({ success: false, error: { code: "UPLOAD_ERROR", message: error instanceof Error ? error.message : "Error al cargar el documento." } }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
