import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════
// Velarix — Notificaciones transaccionales por correo
// Templates HTML institucionales inline
// ═══════════════════════════════════════════════════════════════

const AZUL = "#2563EB";
const GRIS_OSCURO = "#1E293B";
const GRIS_TEXTO = "#475569";
const GRIS_CLARO = "#94A3B8";
const GRIS_SUPER = "#334155";
const FONDO = "#F8FAFC";
const BG_CARD = "#0B0F1A";

const base = (contenido: string, email: string) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${FONDO};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${FONDO};padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:${BG_CARD};border-radius:8px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <tr><td style="background:${AZUL};padding:20px 32px;">
          <span style="color:white;font-size:18px;font-weight:700;letter-spacing:-0.5px;">VELARIX</span>
        </td></tr>
        <tr><td style="padding:32px;">${contenido}</td></tr>
        <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding:16px 32px;text-align:center;">
          <p style="color:${GRIS_TEXTO};font-size:11px;margin:0 0 3px;">Velarix · Inteligencia financiera institucional · velarix.co</p>
          <p style="color:${GRIS_SUPER};font-size:11px;margin:0;">Este correo fue enviado a ${email}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const H1 = `color:#F1F5F9;font-size:21px;font-weight:700;margin:0 0 6px;`;
const SUB = `color:#64748B;font-size:13px;margin:0 0 24px;`;
const P = `color:${GRIS_CLARO};font-size:14px;line-height:1.6;margin:0 0 16px;`;
const BTN = `display:inline-block;background:${AZUL};color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;`;
const CARD = `background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:14px 18px;margin-bottom:10px;`;
const LBL = `color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 3px;`;
const VAL = `color:#F1F5F9;font-size:17px;font-weight:700;font-family:monospace;margin:0;`;

function templateAnalisisCompletado(params: any) {
  const { nombre, empresa, sector, enterpriseValue, wacc, margenEBITDA, url, email } = params;
  const ev = enterpriseValue ? `USD ${(enterpriseValue / 1e6).toFixed(1)}M` : "No disponible";
  const contenido = `
    <h1 style="${H1}">Análisis financiero completado</h1>
    <p style="${SUB}">${empresa} · ${sector}</p>
    <p style="${P}">Hola, ${nombre}:</p>
    <p style="${P}">El análisis de <strong style="color:#F1F5F9">${empresa}</strong> fue procesado correctamente. El informe está disponible en tu dashboard.</p>
    <div style="${CARD}"><p style="${LBL}">Enterprise Value estimado</p><p style="${VAL}">${ev}</p></div>
    <div style="display:flex;gap:10px;margin-bottom:24px;">
      <div style="${CARD}flex:1;"><p style="${LBL}">WACC aplicado</p><p style="${VAL}">${wacc ? (wacc * 100).toFixed(1) + "%" : "N/D"}</p></div>
      <div style="${CARD}flex:1;"><p style="${LBL}">Margen EBITDA</p><p style="${VAL}">${margenEBITDA ? margenEBITDA.toFixed(1) + "%" : "N/D"}</p></div>
    </div>
    <a href="${url}" style="${BTN}">Ver análisis completo</a>`;
  return base(contenido, email);
}

function templateReporteListo(params: any) {
  const { nombre, empresa, nombreReporte, urlReportes, email } = params;
  const contenido = `
    <h1 style="${H1}">Tu reporte está listo</h1>
    <p style="${SUB}">${empresa}</p>
    <p style="${P}">Hola, ${nombre}:</p>
    <p style="${P}">El reporte institucional de <strong style="color:#F1F5F9">${empresa}</strong> ha sido generado y está disponible para descarga.</p>
    <div style="${CARD}"><p style="${LBL}">Nombre del reporte</p><p style="color:#F1F5F9;font-size:14px;font-weight:600;margin:0;">${nombreReporte}</p></div>
    <a href="${urlReportes}" style="${BTN};margin-top:8px;">Ir a mis reportes</a>`;
  return base(contenido, email);
}

function templateErrorAnalisis(params: any) {
  const { nombre, empresa, mensajeError, urlDashboard, email } = params;
  const contenido = `
    <h1 style="${H1}color:#F87171;">Error en el análisis</h1>
    <p style="${SUB}">${empresa}</p>
    <p style="${P}">Hola, ${nombre}:</p>
    <p style="${P}">Se produjo un error durante el procesamiento del análisis de <strong style="color:#F1F5F9">${empresa}</strong>.</p>
    <div style="background:rgba(220,38,38,0.10);border:1px solid rgba(220,38,38,0.25);border-left:4px solid #DC2626;border-radius:6px;padding:14px 18px;margin-bottom:20px;">
      <p style="color:#FCA5A5;font-size:13px;margin:0;">${mensajeError}</p>
    </div>
    <a href="${urlDashboard}" style="${BTN}">Volver al dashboard</a>
    <p style="${P}font-size:12px;color:${GRIS_TEXTO};margin-top:20px;">Si el problema persiste escríbenos a soporte@velarix.co</p>`;
  return base(contenido, email);
}

function templateAnalisisBloqueado(params: any) {
  const { nombre, empresa, problemas, urlAnalisis, email } = params;
  const listaHTML = (problemas || []).map((p: string) => `<li style="color:#FCD34D;margin-bottom:6px;">${p}</li>`).join("");
  const contenido = `
    <h1 style="${H1}color:#FCD34D;">Acción requerida</h1>
    <p style="${SUB}">${empresa}</p>
    <p style="${P}">Hola, ${nombre}:</p>
    <p style="${P}">El análisis de <strong style="color:#F1F5F9">${empresa}</strong> fue bloqueado porque la información financiera no superó las validaciones de calidad.</p>
    <div style="background:rgba(217,119,6,0.10);border:1px solid rgba(217,119,6,0.25);border-left:4px solid #D97706;border-radius:6px;padding:14px 18px;margin-bottom:20px;">
      <p style="color:#FCD34D;font-size:12px;font-weight:600;margin:0 0 8px;">Problemas detectados:</p>
      <ul style="margin:0;padding-left:18px;">${listaHTML}</ul>
    </div>
    <a href="${urlAnalisis}" style="${BTN}">Cargar documentos corregidos</a>`;
  return base(contenido, email);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { tipo, analysis_id, datos_extra = {} } = await req.json();

    const { data: analysis } = await supabase
      .from("analyses")
      .select("user_id, company_name, sector, status")
      .eq("id", analysis_id)
      .single();

    if (!analysis) {
      return new Response(JSON.stringify({ success: false, error: "Análisis no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: authData } = await supabase.auth.admin.getUserById(analysis.user_id);
    const { data: perfil } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", analysis.user_id)
      .single();

    const email = authData?.user?.email;
    const nombre = perfil?.full_name || "Usuario";
    const empresa = analysis.company_name || "tu empresa";
    const appUrl = Deno.env.get("APP_URL") || "https://app.velarix.co";

    if (!email) {
      return new Response(JSON.stringify({ success: false, error: "Email no encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get calculation results for templates that need them
    let calcResult: any = null;
    if (["analisis_completado", "reporte_listo"].includes(tipo)) {
      const { data: cr } = await supabase
        .from("calculation_results")
        .select("output_payload")
        .eq("analysis_id", analysis_id)
        .order("created_at", { ascending: false })
        .limit(1).single();
      calcResult = cr?.output_payload;
    }

    let asunto = "";
    let html = "";

    switch (tipo) {
      case "analisis_completado":
        asunto = `Análisis completado — ${empresa}`;
        html = templateAnalisisCompletado({
          nombre, empresa, sector: analysis.sector,
          enterpriseValue: calcResult?.valuation_dcf?.enterprise_value,
          wacc: calcResult?.valuation_dcf?.wacc,
          margenEBITDA: calcResult?.kpis?.profitability?.ebitda_margin_pct,
          url: `${appUrl}/dashboard/analisis/${analysis_id}`,
          email,
        });
        break;

      case "reporte_listo":
        asunto = `Tu reporte Velarix está listo — ${empresa}`;
        html = templateReporteListo({
          nombre, empresa,
          nombreReporte: datos_extra.nombre_reporte || `Reporte · ${empresa}`,
          urlReportes: `${appUrl}/dashboard/reportes`,
          email,
        });
        break;

      case "error_analisis":
        asunto = `Error en el análisis — ${empresa}`;
        html = templateErrorAnalisis({
          nombre, empresa,
          mensajeError: datos_extra.mensaje_error || "Error inesperado durante el procesamiento.",
          urlDashboard: `${appUrl}/dashboard`,
          email,
        });
        break;

      case "analisis_bloqueado":
        asunto = `Acción requerida — ${empresa}`;
        html = templateAnalisisBloqueado({
          nombre, empresa,
          problemas: datos_extra.problemas || ["Error desconocido en la validación."],
          urlAnalisis: `${appUrl}/dashboard/analisis/${analysis_id}`,
          email,
        });
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Tipo desconocido: ${tipo}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Check if RESEND_API_KEY is available
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (resendKey) {
      // Send with Resend
      const respResend = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "Velarix <noreply@velarix.co>",
          to: [email],
          subject: asunto,
          html,
        }),
      });

      if (!respResend.ok) {
        const errBody = await respResend.text();
        console.error("Resend error:", errBody);
        // Don't fail the notification — log and continue
      }
    } else {
      console.log(`[enviar-notificacion] RESEND_API_KEY not configured. Email queued for: ${email}, type: ${tipo}`);
    }

    // Register in audit_events
    await supabase.from("audit_events").insert({
      analysis_id,
      event_type: `notificacion_${tipo}`,
      event_detail: `Notificación ${tipo} enviada a ${email}`,
      component: "enviar-notificacion",
      metadata: { email, asunto, tipo, resend_configured: !!resendKey },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("enviar-notificacion error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
