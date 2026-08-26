import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveBasePeriod } from "../_shared/period-resolution.ts";
import { normalizeCurrencyCode } from "../_shared/currency.ts";
import {
  buildCanonicalStructuredInput,
  buildDefaultSnapshot,
  CANONICAL_STRUCTURED_INPUT_VERSION,
} from "../_shared/structured-input-builder.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, BadRequestError, mapErrorToResponse } from "../_shared/user-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TRM from macro data (single source of truth)
const TRM = 4080;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const secretKey = resolveAdminSecretKey();
    const anonKey = resolvePublishableKey();
    const supabase = createClient(supabaseUrl, secretKey);
    const anonClient = createClient(supabaseUrl, anonKey);
    const user = await requireAuthenticatedUser(authHeader, async (token) => {
      const { data, error } = await anonClient.auth.getUser(token);
      return { user: data.user, error };
    });

    const { analysis_id } = await req.json();
    if (!analysis_id) throw new Error("analysis_id required");

    const { data: analysis, error: analysisError } = await supabase.from("analyses").select("*").eq("id", analysis_id).single();
    const lookup = classifyOwnedResourceLookup(analysisError, analysis, user.id);
    if (lookup === "not_found") throw new NotFoundError();
    if (lookup === "technical_error") throw analysisError;

    // PROBLEMA 5: Flexible status — never block, just log
    const estadosPermitidos = [
      "validacion_aprobada", "validacion_con_advertencias", "validacion_bloqueada",
      "calculo_en_curso", "documentos_cargados", "parsing_completado", "homologacion_en_curso"
    ];
    if (!estadosPermitidos.includes(analysis.status)) {
      console.log("[build-structured-input] Estado actual:", analysis.status, "— continuando de todas formas");
    }

    const { data: accounts } = await supabase.from("account_homologations").select("*").eq("analysis_id", analysis_id);
    if (!accounts || accounts.length === 0) {
      throw new BadRequestError("NO_ACCOUNTS", "No hay cuentas homologadas.");
    }

    // Bug 2 — política provisional de base_period: se resuelve un único
    // período base ANTES de leer ninguna cifra financiera. Si es ambiguo,
    // no se construye un input estructurado parcialmente arbitrario — se
    // bloquea de forma explícita y trazable (mismo framework de errores
    // que NO_ACCOUNTS arriba).
    const periodResolution = resolveBasePeriod(accounts.map((a: any) => a.period ?? null));
    if (!periodResolution.ok) {
      await supabase.from("audit_events").insert({
        analysis_id, event_type: "periodo_base_ambiguo",
        event_detail: periodResolution.reason ?? "Período base ambiguo — requiere revisión humana.",
        component: "build-structured-input", user_id: user.id,
        metadata: { available_periods: periodResolution.availablePeriods, selection_mode: periodResolution.selectionMode },
      });
      throw new BadRequestError(
        "PERIOD_AMBIGUOUS",
        periodResolution.reason ?? "Período base ambiguo — requiere revisión humana antes de continuar.",
      );
    }
    const basePeriod = periodResolution.basePeriod;
    const periods = periodResolution.availablePeriods;

    // ── Currency conversion (BL-03) ──
    // monedaAnalisis: elección real del usuario (analyses.moneda_analisis,
    // default 'COP' — es un valor de producto, no una moneda "detectada").
    const monedaAnalisis = normalizeCurrencyCode((analysis as any).moneda_analisis) ?? "COP";
    const { data: auditParse } = await supabase.from("audit_events")
      .select("metadata").eq("analysis_id", analysis_id).eq("event_type", "parse_complete")
      .order("created_at", { ascending: false }).limit(1);
    const parseMeta = (auditParse?.[0]?.metadata as any) || {};
    // monedaDoc: moneda REAL del documento fuente, detectada por
    // parse-document. Antes de la corrección de BL-03, este campo nunca
    // sobrevivía la persistencia (ver parse-document/index.ts) y siempre
    // caía al valor por defecto — ahora, si sigue ausente, es porque
    // genuinamente no se detectó ninguna evidencia, no por un bug de
    // persistencia. No se asume "COP" en ese caso.
    const monedaDoc = normalizeCurrencyCode(parseMeta.moneda_documento);
    const factorEscala = Number(parseMeta.factor_escala) || 1;

    const { data: dbSnapshot } = await supabase
      .from("external_snapshots").select("*")
      .eq("sector", analysis.sector)
      .order("effective_date", { ascending: false })
      .limit(1).single();

    const snapshot = dbSnapshot || buildDefaultSnapshot(analysis.sector, TRM);
    const snapshotId = dbSnapshot?.id || null;

    const builtAt = new Date().toISOString();

    // Se necesita el id real de la fila de `structured_inputs` para la
    // procedencia (`structured_input_id`) antes de construir el payload
    // que se va a persistir en esa misma fila. Se reutiliza el id
    // existente si ya hay una fila para este `analysis_id` (columna
    // UNIQUE); si no, se genera uno nuevo aquí mismo para poder incluirlo
    // en el único upsert de abajo, sin una escritura previa intermedia.
    const { data: existingRow } = await supabase
      .from("structured_inputs").select("id").eq("analysis_id", analysis_id).maybeSingle();
    const structuredInputId: string = existingRow?.id || crypto.randomUUID();

    // Único constructor del contrato canónico `structured_input` v2.3 —
    // compartido con continuar-tras-revision (ver
    // _shared/structured-input-builder.ts). Este archivo solo resuelve
    // I/O (analysis, accounts, moneda, snapshot, id de fila) y persiste;
    // ya no ensambla el payload por su cuenta (ver
    // structured-input-canonical-contract.regression.test.ts).
    const structuredInput = buildCanonicalStructuredInput({
      analysisId: analysis_id,
      sector: analysis.sector,
      expectedGrowth: analysis.expected_growth || 25,
      accounts,
      basePeriod,
      periods,
      periodSelectionMode: periodResolution.selectionMode,
      monedaAnalisis,
      monedaDocumento: monedaDoc,
      scaleFactor: factorEscala,
      exchangeRate: TRM,
      snapshot: {
        id: snapshotId,
        data_payload: snapshot.data_payload || snapshot,
        macro_payload: snapshot.macro_payload || null,
      },
      structuredInputId,
      createdAt: builtAt,
    });

    await supabase.from("structured_inputs").upsert(
      { id: structuredInputId, analysis_id, input_payload: structuredInput, version_input: CANONICAL_STRUCTURED_INPUT_VERSION },
      { onConflict: "analysis_id" },
    );
    if (snapshotId) await supabase.from("analyses").update({ snapshot_id: snapshotId }).eq("id", analysis_id);

    await supabase.from("audit_events").insert({
      analysis_id, event_type: "structured_input_built",
      event_detail: `Input v${CANONICAL_STRUCTURED_INPUT_VERSION}: ${structuredInput.quality_flags.length} flags, ${periods.length} períodos, base_period: ${basePeriod}, moneda: ${monedaAnalisis}`,
      component: "build-structured-input", user_id: user.id,
      metadata: { quality_flags: structuredInput.quality_flags, periods, base_period: basePeriod, snapshot_id: snapshotId, version: CANONICAL_STRUCTURED_INPUT_VERSION, moneda_analisis: monedaAnalisis, moneda_documento: monedaDoc, factor_total: structuredInput.factor_conversion },
    });

    return new Response(JSON.stringify({
      success: true, data: structuredInput,
      meta: { analysis_id, timestamp: new Date().toISOString() },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("build-structured-input error:", error);
    const mapped = mapErrorToResponse(error, { code: "BUILD_ERROR", message: "Error al construir el input estructurado." });
    return new Response(JSON.stringify(mapped.body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
