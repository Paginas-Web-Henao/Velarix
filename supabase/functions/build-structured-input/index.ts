import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveBasePeriod } from "../_shared/period-resolution.ts";
import { applyActiveRunFilter, selectActiveRows } from "../_shared/evidence-runs.ts";
import { loadActiveJudgment } from "../_shared/judgment-loader.ts";
import { resolveActiveEvidenceDocumentMetadata } from "../_shared/evidence-document-metadata.ts";
import { LEGACY_EXCHANGE_RATE_COP_PER_USD, resolveStructuredInputCurrency } from "../_shared/structured-input-currency.ts";
import {
  buildCanonicalStructuredInput,
  resolveStructuredInputSnapshot,
  CANONICAL_STRUCTURED_INPUT_VERSION,
} from "../_shared/structured-input-builder.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, BadRequestError, mapErrorToResponse } from "../_shared/user-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TRM from macro data (single source of truth)
const TRM = LEGACY_EXCHANGE_RATE_COP_PER_USD; // LEGACY_COMPATIBILITY_DEFAULT (solo snapshot por defecto y casos legacy)

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

    // Solo el set operacional ACTIVO (puntero del análisis; legacy si es null):
    // nunca filas de varios evidence runs.
    const activeRunId = (analysis as { active_evidence_run_id?: string | null }).active_evidence_run_id ?? null;
    const { data: allRunRows } = await applyActiveRunFilter(supabase.from("account_homologations").select("*").eq("analysis_id", analysis_id), activeRunId);
    const accounts = selectActiveRows(allRunRows || [], activeRunId);
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
    // monedaDoc / factorEscala: metadata REAL del documento fuente, detectada
    // por parse-document (BL-03; si la moneda falta, no se asume "COP").
    // Ligada al set ACTIVO de Evidence: sale de los documents_parsed fuente
    // del evidence run activo, nunca del último parse del análisis (un parse
    // posterior cuyo run falló no cambia moneda/escala). Legacy: último
    // parse_complete, como antes. Ver _shared/evidence-document-metadata.ts.
    const docMeta = await resolveActiveEvidenceDocumentMetadata(supabase, analysis);
    if (!docMeta.ok) {
      await supabase.from("audit_events").insert({
        analysis_id, event_type: "structured_input_metadata_blocked", event_detail: `${docMeta.code}: ${docMeta.message}`,
        component: "build-structured-input", user_id: user.id, metadata: { code: docMeta.code, active_evidence_run_id: analysis.active_evidence_run_id ?? null },
      });
      return new Response(JSON.stringify({ success: false, error: { code: docMeta.code, message: docMeta.message } }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Moneda/escala/FX: en casos versionados nada implícito (ni COP, ni factor 1,
    // ni TRM fija); legacy conserva LEGACY_COMPATIBILITY_DEFAULT. Ver _shared/structured-input-currency.ts.
    const currency = resolveStructuredInputCurrency({ monedaAnalisisRaw: analysis.moneda_analisis, docMeta });
    if (!currency.ok) {
      await supabase.from("audit_events").insert({
        analysis_id, event_type: "structured_input_metadata_blocked", event_detail: `${currency.code}: ${currency.message}`,
        component: "build-structured-input", user_id: user.id, metadata: { code: currency.code, active_evidence_run_id: analysis.active_evidence_run_id ?? null },
      });
      return new Response(JSON.stringify({ success: false, error: { code: currency.code, message: currency.message } }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const monedaAnalisis = currency.monedaAnalisis;
    const monedaDoc = currency.monedaDocumento;
    const factorEscala = currency.factorEscala;

    const { data: dbSnapshot } = await supabase
      .from("external_snapshots").select("*")
      .eq("sector", analysis.sector)
      .order("effective_date", { ascending: false })
      .limit(1).single();

    // Versionado sin fila real → snapshot ausente (null), nunca el default con
    // fuentes/fechas fijas; legacy conserva el default (LEGACY_COMPATIBILITY_DEFAULT).
    const snapshot = resolveStructuredInputSnapshot({
      versioned: currency.mode === "versioned",
      dbSnapshot,
      sector: analysis.sector,
      legacyExchangeRate: TRM,
    });
    const snapshotId = snapshot.id;

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
    // Judgment versionado (ADR-010): con judgment set activo, el input es v5 y
    // sale EXCLUSIVAMENTE de ese set (validado contra el evidence run activo);
    // sin puntero, comportamiento legacy previo (sin inventar valores).
    const activeJudgment = await loadActiveJudgment(supabase, analysis);
    if (activeJudgment.mode === "judgment_set" && !activeJudgment.resolution.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: "JUDGMENT_SET_INVALID", message: "El judgment set activo no se puede materializar; no se construye el input.", issues: activeJudgment.resolution.issues },
      }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const judgment = activeJudgment.mode === "judgment_set" && activeJudgment.resolution.ok ? activeJudgment.resolution.judgment : null;

    const structuredInput = buildCanonicalStructuredInput({
      analysisId: analysis_id,
      sector: analysis.sector,
      // Judgment: null = no resuelto (el preflight de cálculo lo bloquea); nunca 25 por defecto.
      expectedGrowth: analysis.expected_growth ?? null,
      accounts,
      basePeriod,
      periods,
      periodSelectionMode: periodResolution.selectionMode,
      monedaAnalisis,
      monedaDocumento: monedaDoc,
      scaleFactor: factorEscala,
      exchangeRate: currency.exchangeRate,
      snapshot: {
        id: snapshotId,
        data_payload: snapshot.data_payload,
        macro_payload: snapshot.macro_payload,
      },
      structuredInputId,
      createdAt: builtAt,
      judgment,
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
