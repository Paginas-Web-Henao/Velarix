import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
// LOCAL TAXONOMY (rule-based first pass)
// ═══════════════════════════════════════════════════════════════

const TAXONOMY: Record<string, Record<string, string[]>> = {
  income_statement: {
    revenue: ["ventas", "ventas netas", "ingresos", "ingresos operacionales", "ingresos de actividades ordinarias", "revenue", "sales", "net sales", "ingresos netos", "ingresos brutos", "ingresos por servicios"],
    cost_of_sales: ["costo de ventas", "costos de ventas", "costo directo", "cogs", "cost of sales", "costo de produccion", "costo de mercancia vendida"],
    opex: ["gastos operativos", "gastos operacionales", "gastos de administracion", "gastos administrativos", "gastos de ventas", "operating expenses", "sg&a", "opex", "gastos de administracion y ventas", "gastos generales", "gastos de personal", "otros gastos de administracion", "otros gastos de administracion y ventas", "otros gastos operativos"],
    da: ["depreciacion", "amortizacion", "depreciacion y amortizacion", "d&a", "depreciation", "depreciaciones", "depreciacion de equipos", "depreciacion de equipos de oficina", "depreciacion del periodo"],
    ebit: ["ebit", "utilidad operativa", "utilidad operacional", "resultado operacional", "utilidad de operacion"],
    interest_expense: ["intereses", "gasto financiero", "gastos financieros", "interest expense", "gasto de intereses", "intereses pagados", "costos financieros"],
    taxes: ["impuestos", "impuesto de renta", "provision de impuestos", "impuesto de renta y complementarios", "impuesto diferido"],
    net_income: ["utilidad neta", "utilidad del ejercicio", "resultado del periodo", "net income", "resultado neto", "ganancia o perdida del ejercicio"],
  },
  balance_sheet: {
    cash: ["caja", "efectivo", "disponible", "cash", "efectivo y equivalentes", "caja y bancos", "bancos", "caja general", "cdt", "certificados de deposito"],
    accounts_receivable: ["cartera", "clientes", "cuentas por cobrar", "receivables", "deudores", "deudores comerciales"],
    inventory: ["inventario", "inventarios", "existencias", "inventory"],
    ppe: ["propiedad planta y equipo", "activos fijos", "pp&e", "equipos", "maquinaria", "maquinaria y equipo"],
    total_assets: ["total activos", "total activo", "total del activo", "total assets", "activo total", "total general activo", "total activo neto"],
    accounts_payable: ["proveedores", "cuentas por pagar", "payables"],
    current_financial_debt: ["deuda financiera cp", "obligaciones financieras corrientes", "obligaciones financieras cp", "obligaciones bancarias cp"],
    long_term_financial_debt: ["deuda financiera lp", "deuda de largo plazo", "obligaciones financieras lp", "obligaciones bancarias lp"],
    total_liabilities: ["total pasivos", "total pasivo", "total liabilities"],
    equity: ["patrimonio", "patrimonio neto", "total patrimonio", "capital contable", "equity"],
  },
};

function normalizeLabel(label: string): string {
  let s = label.toLowerCase().trim();
  s = s.replace(/^\d{4,6}[\s\-\.]+/, "").trim();
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s&/]/g, "").replace(/\s+/g, " ");
}

function matchAccount(label: string): { canonical: string | null; category: string; score: number } {
  const normalized = normalizeLabel(label);
  for (const [category, accounts] of Object.entries(TAXONOMY)) {
    for (const [canonical, synonyms] of Object.entries(accounts)) {
      for (const synonym of synonyms) {
        const normalizedSyn = normalizeLabel(synonym);
        if (normalized === normalizedSyn) return { canonical, category, score: 0.95 };
        if (normalized.includes(normalizedSyn) || normalizedSyn.includes(normalized)) return { canonical, category, score: 0.82 };
      }
    }
  }
  return { canonical: null, category: "unknown", score: 0.30 };
}

// ═══════════════════════════════════════════════════════════════
// AI Helper
// ═══════════════════════════════════════════════════════════════

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string, maxTokens = 4000): Promise<string | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], max_tokens: maxTokens }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || serviceRoleKey;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { analysis_id } = await req.json();
    if (!analysis_id) throw new Error("analysis_id required");

    const { data: analysis } = await supabase.from("analyses").select("id, user_id").eq("id", analysis_id).single();
    if (!analysis || analysis.user_id !== user.id) throw new Error("Not found");

    await supabase.from("analyses").update({ status: "homologacion_en_curso" }).eq("id", analysis_id);

    // Get parsed documents
    const { data: documents } = await supabase.from("documents").select("id, doc_type_declared").eq("analysis_id", analysis_id);
    const { data: parsedDocs } = await supabase.from("documents_parsed").select("*").in("document_id", (documents || []).map(d => d.id));

    if (!parsedDocs || parsedDocs.length === 0) throw new Error("No hay documentos parseados disponibles para homologar.");

    // Clear previous mappings
    await supabase.from("account_homologations").delete().eq("analysis_id", analysis_id);

    // ──── Build full document text for AI context ────
    const allRows: any[] = [];
    const docTypeMap: Record<string, string> = {};

    for (const parsed of parsedDocs) {
      const structure = parsed.parsed_structure as any;
      const rows = structure?.rows || structure?.data || [];
      const documentId = parsed.document_id;
      const docType = (documents || []).find(d => d.id === documentId)?.doc_type_declared || "unknown";
      docTypeMap[documentId] = docType;

      for (const row of rows) {
        const label = row.original_label || row.label || row.account || row.name || "";
        if (!label || typeof label !== "string" || label.length < 2) continue;
        const valuesObj = row.values || {};
        allRows.push({ label, values: valuesObj, documentId, docType, posicion: row.posicion });
      }
    }

    // ──── PASS 1: Rule-based matching ────
    const mappings: any[] = [];
    const foundAccounts = new Set<string>();

    for (const row of allRows) {
      const periods = Object.keys(row.values).filter(k => row.values[k] != null && typeof row.values[k] === "number");
      if (periods.length > 0) {
        for (const period of periods) {
          const val = row.values[period];
          const { canonical, category, score } = matchAccount(row.label);
          if (canonical) foundAccounts.add(canonical);
          mappings.push({
            analysis_id, document_id: row.documentId,
            original_label: row.label,
            canonical_account: canonical || "unclassified",
            category: category === "unknown" ? (row.docType === "estado_resultados" ? "income_statement" : "balance_sheet") : category,
            period, value: typeof val === "number" ? val : null,
            confidence_score: score >= 0.90 ? "alta" : score >= 0.75 ? "media" : "baja",
            ambiguity_flag: score < 0.75 || canonical === null,
            mapping_notes: canonical ? `Regla: ${canonical} (${score.toFixed(2)})` : `Regla: no clasificado (${score.toFixed(2)})`,
          });
        }
      } else {
        const val = row.values.col_1 || null;
        const { canonical, category, score } = matchAccount(row.label);
        if (canonical) foundAccounts.add(canonical);
        mappings.push({
          analysis_id, document_id: row.documentId,
          original_label: row.label,
          canonical_account: canonical || "unclassified",
          category: category === "unknown" ? (row.docType === "estado_resultados" ? "income_statement" : "balance_sheet") : category,
          period: null, value: typeof val === "number" ? val : null,
          confidence_score: score >= 0.90 ? "alta" : score >= 0.75 ? "media" : "baja",
          ambiguity_flag: score < 0.75 || canonical === null,
          mapping_notes: canonical ? `Regla: ${canonical} (${score.toFixed(2)})` : `Regla: no clasificado (${score.toFixed(2)})`,
        });
      }
    }

    // Insert pass 1
    if (mappings.length > 0) {
      const { error: insertError } = await supabase.from("account_homologations").insert(mappings);
      if (insertError) throw new Error(`Error al guardar homologaciones: ${insertError.message}`);
    }

    // ──── PASS 2: AI Consolidation-based mapping ────
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const unclassifiedCount = mappings.filter(m => m.canonical_account === "unclassified").length;

    if (unclassifiedCount > 0 && LOVABLE_API_KEY) {
      // Send FULL document to AI for structural understanding
      const docSummary = allRows.map(r => {
        const vals = Object.entries(r.values).map(([k, v]) => `${k}:${v}`).join(", ");
        return `[${r.docType}] ${r.label} → ${vals || "sin valor"}`;
      }).join("\n");

      const aiResult = await callAI(LOVABLE_API_KEY, SYSTEM_ACCOUNT_MAPPER,
        `Analiza este documento financiero COMPLETO y mapea las cuentas a la taxonomía canónica.\nConsolida cuentas que representan lo mismo.\n\nDocumento:\n${docSummary.substring(0, 8000)}`, 6000);

      if (aiResult) {
        try {
          const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const aiData = JSON.parse(jsonMatch[0]);
            const aiMappings = aiData.mappings || aiData.accounts || [];

            for (const aiMap of aiMappings) {
              if (!aiMap.canonical_account || aiMap.confidence < 0.5) continue;

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
                if (existing) continue;

                // Update or create mapping
                const matchingUnclassified = mappings.filter(m =>
                  m.canonical_account === "unclassified" &&
                  m.period === period &&
                  sourceLabels.some((sl: string) =>
                    normalizeLabel(m.original_label).includes(normalizeLabel(sl)) ||
                    normalizeLabel(sl).includes(normalizeLabel(m.original_label))
                  )
                );

                if (matchingUnclassified.length > 0) {
                  // Update the first match
                  await supabase.from("account_homologations")
                    .update({
                      canonical_account: aiMap.canonical_account,
                      confidence_score: aiMap.confidence >= 0.90 ? "alta" : "media",
                      ambiguity_flag: aiMap.confidence < 0.75,
                      value: value,
                      mapping_notes: `IA (consolidación): ${aiMap.nota || aiMap.canonical_account}`,
                    })
                    .eq("analysis_id", analysis_id)
                    .eq("original_label", matchingUnclassified[0].original_label)
                    .eq("period", period);
                } else {
                  // Check if we already have this account from rule-based
                  const existingRule = mappings.find(m =>
                    m.canonical_account === aiMap.canonical_account && m.period === period
                  );
                  if (!existingRule) {
                    // Insert new consolidated mapping
                    await supabase.from("account_homologations").insert({
                      analysis_id,
                      document_id: allRows[0]?.documentId || null,
                      original_label: sourceLabels.join(" + "),
                      canonical_account: aiMap.canonical_account,
                      category: ["revenue", "cost_of_sales", "opex", "da", "ebit", "interest_expense", "taxes", "net_income"].includes(aiMap.canonical_account) ? "income_statement" : "balance_sheet",
                      period,
                      value: value,
                      confidence_score: aiMap.confidence >= 0.90 ? "alta" : "media",
                      ambiguity_flag: false,
                      mapping_notes: `IA (consolidación): ${aiMap.nota || "Mapeado por contexto"}`,
                    });
                  }
                }
                foundAccounts.add(aiMap.canonical_account);
              }
            }
          }
        } catch (e) { console.error("AI mapping parse error:", e); }
      }
    }

    // Audit event
    const stillMissing = ["revenue", "cash", "total_assets", "total_liabilities", "equity"].filter(c => !foundAccounts.has(c));

    await supabase.from("audit_events").insert({
      analysis_id, event_type: "mapping_end",
      event_detail: `Homologación: ${mappings.length} filas, ${unclassifiedCount} revisadas por IA, ${stillMissing.length} críticas faltantes`,
      component: "map-accounts", user_id: user.id,
      metadata: { total_mapped: mappings.length, ai_reviewed: unclassifiedCount, missing_critical: stillMissing, found_accounts: Array.from(foundAccounts) },
    });

    return new Response(JSON.stringify({
      success: true,
      data: { total_mapped: mappings.length, found_accounts: Array.from(foundAccounts), missing_critical: stillMissing, has_blocking_issues: false },
      meta: { analysis_id, timestamp: new Date().toISOString() },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("map-accounts error:", error);
    return new Response(JSON.stringify({ success: false, error: { code: "MAPPING_ERROR", message: error instanceof Error ? error.message : "Error en la homologación contable." } }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
