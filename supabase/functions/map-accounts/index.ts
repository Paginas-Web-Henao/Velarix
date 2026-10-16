import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { callAnthropic } from "../_shared/anthropic-client.ts";
import { normalizeLabel } from "../_shared/account-taxonomy.ts";
import { buildRuleMappings, evaluateAiProposalForContextRows, evaluateAiProposalForUncontextualRows } from "../_shared/statement-aware-mapping.ts";
import { createEvidenceRun, failEvidenceRun, markEvidenceRun } from "../_shared/evidence-runs.ts";
import { effectiveDocType } from "../_shared/document-type.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { evaluateEvidenceReprocessing, reprocessingRejectedAuditEvent } from "../_shared/evidence-pipeline-guards.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, BadRequestError, mapErrorToResponse } from "../_shared/user-auth.ts";
import { selectLatestParsedDocumentPerDocument, AmbiguousDocumentParseError } from "../_shared/latest-parsed-document.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT — Consolidation-based Account Mapper
// ═══════════════════════════════════════════════════════════════

const SYSTEM_ACCOUNT_MAPPER = `Eres un experto en contabilidad colombiana. Recibes el contenido
COMPLETO de un documento financiero y debes:

1. Identificar qué tipo de documento es cada sección
   (Estado de Resultados o Estado de Situación Financiera/Balance)

2. Entender la jerarquía: qué son cuentas base vs subtotales.
   Los subtotales (Total Activos, Utilidad Bruta, etc.) NO se mapean
   como cuentas canónicas — se calculan automáticamente.

3. Mapear SOLO las cuentas base (no subtotales) a la taxonomía:
   
   ESTADO DE RESULTADOS - cuentas base:
   revenue: ingresos operacionales, ventas netas, ingresos por servicios,
            ingresos por actividades ordinarias — LA LÍNEA DE INGRESOS PRINCIPAL
   cost_of_sales: costo de ventas, costo de producción, CMV
   opex: gastos administración, gastos ventas, gastos generales, 
         gastos de personal, otros gastos operativos
         (SUMA de todos los gastos operativos que NO sean depreciación)
   da: depreciación, amortización — cualquier línea que mencione estas palabras
   interest_expense: gastos financieros, intereses pagados, gasto de intereses
   taxes: impuesto de renta, provisión fiscal
   net_income: utilidad neta, utilidad del ejercicio, resultado del período
   
   BALANCE - cuentas base:
   cash: efectivo, caja, bancos, equivalentes de efectivo, CDT
         (SUMA de todas las cuentas de liquidez inmediata)
   accounts_receivable: cuentas por cobrar, cartera, deudores comerciales
   inventory: inventarios, existencias
   ppe: equipos, maquinaria, propiedad planta y equipo NETO
        (activo fijo menos depreciación acumulada)
   accounts_payable: proveedores por pagar, cuentas por pagar
   current_financial_debt: obligaciones bancarias CP, créditos CP
   long_term_financial_debt: obligaciones bancarias LP, créditos LP
   taxes_payable: impuesto de renta por pagar (esto es un PASIVO, no taxes)
   equity_capital: capital social, capital suscrito
   retained_earnings: utilidades ejercicios anteriores, reservas
   net_income_equity: utilidades del ejercicio (en el balance, no el P&L)
   total_assets: total activo, total activos, total del activo, activo total
   total_liabilities: total pasivo, total pasivos
   equity: patrimonio, patrimonio neto, total patrimonio

4. CONSOLIDAR cuando corresponda:
   Si hay 'Gastos de Personal' + 'Otros Gastos Admón' → ambos van a opex
   Si hay 'Caja' + 'Bancos' + 'CDT' → todos van a cash
   Si hay 'Equipos' + 'Deprec Acum' → el NETO va a ppe

5. Devolver JSON con una entrada POR CUENTA CANÓNICA (no por fila).
   Cada período como clave en "values":
   {
     "mappings": [
       {
         "canonical_account": "revenue",
         "values": {"2024": 50154, "2023": 45000},
         "confidence": 0.95,
         "nota": "Ventas Netas",
         "source_labels": ["Ventas Netas"]
       },
       {
         "canonical_account": "opex",
         "values": {"2024": 11888, "2023": 10500},
         "confidence": 0.88,
         "nota": "Suma de Gastos Personal (9041) + Otros Gastos (2847)",
         "source_labels": ["Gastos de Personal", "Otros Gastos de Admón y Ventas"]
       },
       {
         "canonical_account": "da",
         "values": {"2024": 794, "2023": 650},
         "confidence": 0.95,
         "nota": "Depreciación de Equipos de Oficina",
         "source_labels": ["Depreciación de Equipos de Oficina"]
       }
     ]
   }

IMPORTANTE: Los valores que devuelves son los que usa el motor de cálculo.
No inventes valores. Si no encuentras una cuenta, NO la incluyas.
Los cálculos (EBITDA, utilidad bruta, equity total) los hace Velarix automáticamente.
Solo devuelve JSON, sin texto adicional.`;

const SYSTEM_ACCOUNT_REVIEW = `Eres el revisor contable de segunda instancia de Velarix.
Recibes una cuenta ambigua con contexto. Devuelve JSON:
{
  "canonical_account": "nombre o null",
  "confidence_score": 0-1,
  "ambiguity_flag": true/false,
  "mapping_note": "justificación"
}`;

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// (TAXONOMY, normalizeLabel, matchAccount -> ver ../_shared/account-taxonomy.ts.
// Bug 1: exact match ahora tiene precedencia global sobre substring.)
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Evidence run de esta homologación (si se llegó a crear): un fallo lo marca
  // failed y el set activo anterior sigue intacto.
  let evidenceRunId: string | null = null;
  let mappingFailureCode = "MAPPING_ERROR";
  let failedAnalysisId: string | null = null;
  let db: Parameters<typeof failEvidenceRun>[0] | null = null;
  try {
    const authHeader = req.headers.get("Authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const secretKey = resolveAdminSecretKey();
    const anonKey = resolvePublishableKey();
    const supabase = createClient(supabaseUrl, secretKey);
    db = supabase;
    const anonClient = createClient(supabaseUrl, anonKey);
    const user = await requireAuthenticatedUser(authHeader, async (token) => {
      const { data, error } = await anonClient.auth.getUser(token);
      return { user: data.user, error };
    });

    const { analysis_id } = await req.json();
    if (!analysis_id) throw new Error("analysis_id required");

    const { data: analysis, error: analysisError } = await supabase.from("analyses").select("id, user_id, status, calculation_result, active_evidence_run_id").eq("id", analysis_id).single();
    const lookup = classifyOwnedResourceLookup(analysisError, analysis, user.id);
    if (lookup === "not_found") throw new NotFoundError();
    if (lookup === "technical_error") throw analysisError;

    // Caso con cálculo oficial persistido: este endpoint de Evidence no lo
    // reprocesa. Antes de cualquier escritura; el audit event es la única.
    // Se preserva el resultado oficial y su provenance; el versionado de
    // Evidence (ADR-009) solo aplica a casos no calculados.
    const reprocessing = evaluateEvidenceReprocessing(analysis);
    if (!reprocessing.allowed) {
      await supabase.from("audit_events").insert(reprocessingRejectedAuditEvent({
        analysisId: analysis_id, userId: user.id, component: "map-accounts", status: (analysis as { status?: string }).status, decision: reprocessing,
      }));
      return new Response(JSON.stringify({ success: false, error: { code: reprocessing.code, message: reprocessing.message } }), { status: reprocessing.httpStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("analyses").update({ status: "homologacion_en_curso" }).eq("id", analysis_id);

    // Get parsed documents
    const { data: documents } = await supabase.from("documents").select("id, doc_type_declared, doc_type_effective").eq("analysis_id", analysis_id);
    const { data: parsedDocsAllVersions } = await supabase.from("documents_parsed").select("*").in("document_id", (documents || []).map(d => d.id));

    if (!parsedDocsAllVersions || parsedDocsAllVersions.length === 0) {
      throw new BadRequestError("NO_PARSED_DOCUMENTS", "No hay documentos parseados disponibles para homologar. Verifica que los documentos se procesaron correctamente.");
    }

    // Bug parses duplicados: parse-document puede reejecutarse sobre el
    // mismo document_id (debugging, re-subida) — cada corrida es un INSERT
    // nuevo en documents_parsed, sin UNIQUE en document_id, y el historial
    // se conserva a propósito. Sin esto, un documento parseado 2 veces
    // duplicaba cada homologación (mismo original_label × canonical_account
    // × period × value insertado dos veces). Se conserva solo la versión
    // vigente (created_at más reciente) por document_id — ver
    // ../_shared/latest-parsed-document.ts para el criterio de desempate.
    let parsedDocs: typeof parsedDocsAllVersions;
    try {
      parsedDocs = selectLatestParsedDocumentPerDocument(parsedDocsAllVersions);
    } catch (e) {
      if (e instanceof AmbiguousDocumentParseError) {
        throw new BadRequestError("AMBIGUOUS_DOCUMENT_PARSE_VERSION", e.message);
      }
      throw e;
    }

    // Versionado no destructivo: NO se borran las homologaciones anteriores.
    // Este run produce un set nuevo; el set activo solo cambia cuando
    // validate-analysis complete y promueva el run (ver ../_shared/evidence-runs.ts).
    const userId = user.id;
    failedAnalysisId = analysis_id;
    evidenceRunId = await createEvidenceRun(supabase, {
      analysisId: analysis_id, userId,
      previousActiveRunId: (analysis as { active_evidence_run_id?: string | null }).active_evidence_run_id ?? null,
      sourceParsedDocumentIds: parsedDocs.map(p => p.id),
    });
    const runId = evidenceRunId;

    // ──── Build full document text for AI context ────
    const allRows: any[] = [];
    const docTypeMap: Record<string, string> = {};

    for (const parsed of parsedDocs) {
      const structure = parsed.parsed_structure as any;
      const rows = structure?.rows || structure?.data || [];
      const documentId = parsed.document_id;
      const docType = effectiveDocType((documents || []).find(d => d.id === documentId)) || "unknown";
      docTypeMap[documentId] = docType;

      for (const row of rows) {
        const label = row.original_label || row.label || row.account || row.name || "";
        if (!label || typeof label !== "string" || label.length < 2) continue;
        const valuesObj = row.values || {};
        allRows.push({
          label, values: valuesObj, documentId, docType, posicion: row.posicion,
          // Lineage del extractor multi-estado (ausente en CSV/PDF/Excel de una hoja).
          statement: row.statement ?? null, section: row.source_section ?? null, unit: row.unit ?? null,
          sheet: row.source_sheet ?? null, sourceLabel: row.source_label ?? null,
        });
      }
    }

    // ──── PASS 1: Rule-based matching ────
    // Filas sin contexto: regla previa idéntica. Filas con contexto de estado:
    // compatibilidad estado/sección/unidad y sin duplicados operacionales —
    // ver ../_shared/statement-aware-mapping.ts.
    const drafts = buildRuleMappings(analysis_id, allRows);
    // Cada fila queda ligada al run que la produjo.
    for (const d of drafts) (d.record as typeof d.record & { evidence_run_id: string }).evidence_run_id = runId;
    const mappings: any[] = drafts.map(d => d.record);
    const foundAccounts = new Set<string>(mappings.filter(m => m.canonical_account !== "unclassified").map(m => m.canonical_account));
    const contextual = drafts.some(d => d.contextual);

    // Insert pass 1
    if (mappings.length > 0) {
      const { error: insertError } = await supabase.from("account_homologations").insert(mappings);
      if (insertError) {
        mappingFailureCode = "INSERT_FAILED";
        throw new Error(`Error al guardar homologaciones: ${insertError.message}`);
      }
    }

    // ──── PASS 2: AI Consolidation-based mapping ────
    const unclassifiedCount = mappings.filter(m => m.canonical_account === "unclassified").length;
    const aiRejected: { canonical_account: string; period: string; reason: string; code?: string; source_labels?: string[] }[] = [];
    // Métricas de IA medidas, no supuestas: candidatas (filas abiertas que la IA
    // podría clasificar; con contexto, sin conflicto determinístico), solicitudes,
    // estado de la respuesta, propuestas recibidas/omitidas/aplicadas/rechazadas.
    const ai = {
      candidates: contextual
        ? drafts.filter(d => d.record.canonical_account === "unclassified" && (!d.rejection || d.rejection === "NO_MATCH")).length
        : unclassifiedCount,
      requests: 0,
      response: "not_requested" as "not_requested" | "no_response" | "rate_limited" | "unparseable" | "received",
      proposals_received: 0,
      proposals_skipped: 0,
      classifications_applied: 0,
    };

    if (ai.candidates > 0) {
      // Send FULL document to AI for structural understanding
      const docSummary = allRows.map(r => {
        const vals = Object.entries(r.values).map(([k, v]) => `${k}:${v}`).join(", ");
        return `[${r.docType}] ${r.label} → ${vals || "sin valor"}`;
      }).join("\n");

      const aiResult = await callAnthropic(SYSTEM_ACCOUNT_MAPPER,
        `Analiza este documento financiero COMPLETO y mapea las cuentas a la taxonomía canónica.\nConsolida cuentas que representan lo mismo.\n\nDocumento:\n${docSummary.substring(0, 8000)}`, 6000);
      ai.requests = 1;
      ai.response = aiResult === null ? "no_response" : aiResult === "__RATE_LIMITED__" ? "rate_limited" : "unparseable";

      if (aiResult && aiResult !== "__RATE_LIMITED__") {
        try {
          const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const aiData = JSON.parse(jsonMatch[0]);
            const aiMappings = aiData.mappings || aiData.accounts || [];
            ai.response = "received";

            for (const aiMap of aiMappings) {
              const numericPeriods = Object.values(aiMap?.values || {}).filter(v => typeof v === "number").length;
              ai.proposals_received += numericPeriods;
              if (!aiMap.canonical_account || aiMap.confidence < 0.5) { ai.proposals_skipped += numericPeriods; continue; }

              // Find matching unclassified rows by source labels
              const sourceLabels = aiMap.source_labels || [aiMap.nota || ""];
              const periods = aiMap.values || {};

              for (const [period, value] of Object.entries(periods)) {
                if (typeof value !== "number") continue;

                // Check if this canonical_account + period already exists with high confidence
                const existing = mappings.find(m =>
                  m.canonical_account === aiMap.canonical_account &&
                  m.period === period &&
                  m.confidence_score === "alta"
                );
                if (existing) { ai.proposals_skipped++; continue; }

                // Update or create mapping
                const matchingUnclassified = mappings.filter(m =>
                  m.canonical_account === "unclassified" &&
                  m.period === period &&
                  sourceLabels.some((sl: string) =>
                    normalizeLabel(m.original_label).includes(normalizeLabel(sl)) ||
                    normalizeLabel(sl).includes(normalizeLabel(m.original_label))
                  )
                );

                if (contextual) {
                  // Lineage con contexto de estado: la IA solo puede CLASIFICAR una
                  // única fila fuente compatible (estado/sección/unidad), sin cambiar
                  // su valor ni resolver conflictos determinísticos; tampoco crea
                  // filas consolidadas con cifras propias.
                  const targets = drafts.filter(d => matchingUnclassified.includes(d.record));
                  const decision = targets.length > 0
                    ? evaluateAiProposalForContextRows(targets, aiMap.canonical_account, value)
                    : { accepted: false as const, reason: "sin fila fuente: la IA no crea homologaciones con cifras propias" };
                  if (!decision.accepted) {
                    aiRejected.push({ canonical_account: aiMap.canonical_account, period, reason: decision.reason });
                    continue;
                  }
                  const t = targets[0].record;
                  await supabase.from("account_homologations")
                    .update({
                      canonical_account: aiMap.canonical_account,
                      confidence_score: aiMap.confidence >= 0.90 ? "alta" : "media",
                      ambiguity_flag: aiMap.confidence < 0.75,
                      mapping_notes: `IA (clasificación, valor de la fila fuente): ${aiMap.nota || aiMap.canonical_account} · ${t.mapping_notes}`,
                    })
                    .eq("analysis_id", analysis_id)
                    .eq("evidence_run_id", runId)
                    .eq("original_label", t.original_label)
                    .eq("category", t.category)
                    .eq("period", period);
                  t.canonical_account = aiMap.canonical_account;
                  ai.classifications_applied++;
                } else {
                  // Lineage sin contexto de estado: misma regla que con contexto.
                  // AI classification ≠ Evidence creation. La IA solo puede
                  // re-clasificar UNA fila fuente observada cuyo valor sea
                  // exactamente el que propone; nunca escribe `value`, nunca crea
                  // una fila (ni "consolidada") con una cifra propia, ni inventa
                  // etiqueta o documento. Lo demás se registra como rechazado.
                  const decision = evaluateAiProposalForUncontextualRows(matchingUnclassified, value, mappings);
                  if (!decision.accepted) {
                    const existingRule = mappings.find(m => m.canonical_account === aiMap.canonical_account && m.period === period);
                    if (decision.code === "AI_SYNTHETIC_HOMOLOGATION_NOT_ALLOWED" && existingRule) { ai.proposals_skipped++; continue; }
                    aiRejected.push({ canonical_account: aiMap.canonical_account, period, reason: decision.reason, code: decision.code, source_labels: sourceLabels });
                    continue;
                  }
                  const t = matchingUnclassified[0];
                  const { error: classificationError } = await supabase.from("account_homologations")
                    .update({
                      canonical_account: aiMap.canonical_account,
                      confidence_score: aiMap.confidence >= 0.90 ? "alta" : "media",
                      ambiguity_flag: aiMap.confidence < 0.75,
                      mapping_notes: `IA (clasificación, valor de la fila fuente): ${aiMap.nota || aiMap.canonical_account} · ${t.mapping_notes ?? ""}`,
                    })
                    .eq("analysis_id", analysis_id)
                    .eq("evidence_run_id", runId)
                    .eq("original_label", t.original_label)
                    .eq("category", t.category)
                    .eq("period", period);
                  if (classificationError) {
                    aiRejected.push({ canonical_account: aiMap.canonical_account, period, reason: `la clasificación no se aplicó: ${classificationError.message}`, code: "AI_CLASSIFICATION_NOT_APPLIED" });
                    continue;
                  }
                  t.canonical_account = aiMap.canonical_account;
                  ai.classifications_applied++;
                }
                foundAccounts.add(aiMap.canonical_account);
              }
            }
          }
        } catch (e) { console.error("AI mapping parse error:", e); }
      }
    }

    // Etapa de homologación terminada: el run queda "mapped" (aún NO activo;
    // se promueve solo cuando validate-analysis lo complete).
    await markEvidenceRun(supabase, runId, { status: "mapped", mapped_at: new Date().toISOString() });

    // Audit event
    const stillMissing = ["revenue", "cash", "total_assets", "total_liabilities", "equity"].filter(c => !foundAccounts.has(c));

    await supabase.from("audit_events").insert({
      analysis_id, event_type: "mapping_end",
      event_detail: `Homologación: ${mappings.length} filas (${unclassifiedCount} sin clasificar por reglas), ${stillMissing.length} críticas faltantes · IA: ${ai.candidates} candidatas, ${ai.requests} solicitud(es), respuesta ${ai.response}, ${ai.proposals_received} propuestas, ${ai.classifications_applied} aplicadas, ${aiRejected.length} rechazadas`,
      component: "map-accounts", user_id: user.id,
      metadata: {
        evidence_run_id: runId,
        total_mapped: mappings.length, unclassified_by_rules: unclassifiedCount, missing_critical: stillMissing, found_accounts: Array.from(foundAccounts),
        ai_candidates: ai.candidates, ai_requests: ai.requests, ai_response: ai.response,
        ai_proposals_received: ai.proposals_received, ai_proposals_skipped: ai.proposals_skipped,
        ai_classifications_applied: ai.classifications_applied, ai_proposals_rejected: aiRejected.length,
        ai_rejected: aiRejected,
        ...(contextual ? {
          statement_context: true,
          rejected_by_rule: drafts.reduce((acc, d) => (d.rejection && d.rejection !== "NO_MATCH" ? { ...acc, [d.rejection]: (acc[d.rejection] ?? 0) + 1 } : acc), {} as Record<string, number>),
        } : {}),
      },
    });

    return new Response(JSON.stringify({
      success: true,
      data: { evidence_run_id: runId, evidence_run_status: "mapped", total_mapped: mappings.length, found_accounts: Array.from(foundAccounts), missing_critical: stillMissing, has_blocking_issues: false },
      meta: { analysis_id, timestamp: new Date().toISOString() },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("map-accounts error:", error);
    if (evidenceRunId && db) {
      await failEvidenceRun(db, evidenceRunId, "mapping", mappingFailureCode, error instanceof Error ? error.message : String(error)).catch(() => {});
      // analyses.status = estado del último intento: no queda "en curso" tras un
      // fallo directo (mismo estado que fija run-analysis-pipeline). El puntero
      // activo NO se toca: el set anterior sigue siendo el operacional.
      if (failedAnalysisId) await db.from("analyses").update({ status: "error_tecnico" }).eq("id", failedAnalysisId).then(() => {}, () => {});
    }
    const mapped = mapErrorToResponse(error, { code: "MAPPING_ERROR", message: "Error en la homologación contable." });
    // El run fallido queda trazable (status failed); el set activo no cambió.
    const body = evidenceRunId ? { ...mapped.body, data: { evidence_run_id: evidenceRunId, evidence_run_status: "failed" } } : mapped.body;
    return new Response(JSON.stringify(body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
