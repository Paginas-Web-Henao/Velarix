import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Freshness thresholds in days
const VIGENCIA_DIAS: Record<string, { verde: number; amarillo: number }> = {
  diario:      { verde: 1,   amarillo: 3   },
  semanal:     { verde: 7,   amarillo: 14  },
  mensual:     { verde: 31,  amarillo: 45  },
  trimestral:  { verde: 92,  amarillo: 120 },
  anual:       { verde: 366, amarillo: 420 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const hoy = new Date();

    const { data: fuentes } = await supabase
      .from("data_sources")
      .select("*")
      .eq("activo", true);

    const reporteFrescura: Array<{
      fuente_id: string;
      nombre: string;
      frecuencia: string;
      estado: string;
      dias_desde_actualizacion: number | null;
      fecha_ultima_actualizacion: string | null;
      requiere_accion: boolean;
    }> = [];

    for (const fuente of fuentes || []) {
      const diasVigencia = VIGENCIA_DIAS[fuente.frecuencia];
      if (!diasVigencia) continue;

      // Get latest update for this source
      const { data: ultimaAct } = await supabase
        .from("snapshot_updates")
        .select("updated_at, fecha_dato")
        .eq("source_id", fuente.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let estadoFrescura = "rojo";
      let diasDesde: number | null = null;

      if (ultimaAct?.fecha_dato) {
        const fechaRef = new Date(ultimaAct.fecha_dato);
        diasDesde = Math.floor((hoy.getTime() - fechaRef.getTime()) / (1000 * 60 * 60 * 24));

        if (diasDesde <= diasVigencia.verde) {
          estadoFrescura = "verde";
        } else if (diasDesde <= diasVigencia.amarillo) {
          estadoFrescura = "amarillo";
        }
      } else {
        // No updates recorded — check if we have snapshots at all
        const { data: anySnapshot } = await supabase
          .from("external_snapshots")
          .select("effective_date")
          .order("effective_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (anySnapshot) {
          const fechaSnap = new Date(anySnapshot.effective_date);
          diasDesde = Math.floor((hoy.getTime() - fechaSnap.getTime()) / (1000 * 60 * 60 * 24));
          if (diasDesde <= diasVigencia.verde) estadoFrescura = "verde";
          else if (diasDesde <= diasVigencia.amarillo) estadoFrescura = "amarillo";
        }
      }

      reporteFrescura.push({
        fuente_id: fuente.id,
        nombre: fuente.nombre,
        frecuencia: fuente.frecuencia,
        estado: estadoFrescura,
        dias_desde_actualizacion: diasDesde,
        fecha_ultima_actualizacion: ultimaAct?.fecha_dato || null,
        requiere_accion: estadoFrescura === "rojo",
      });
    }

    // Save freshness report
    await supabase.from("update_jobs_log").insert({
      job_nombre: "check-data-freshness",
      estado: "completado",
      resultado: {
        total_fuentes: reporteFrescura.length,
        verdes: reporteFrescura.filter((f) => f.estado === "verde").length,
        amarillas: reporteFrescura.filter((f) => f.estado === "amarillo").length,
        rojas: reporteFrescura.filter((f) => f.estado === "rojo").length,
        reporte: reporteFrescura,
      },
      completed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, data: { reporte: reporteFrescura } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-freshness error:", error);
    return new Response(
      JSON.stringify({ success: false, error: { message: error instanceof Error ? error.message : "Error" } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
