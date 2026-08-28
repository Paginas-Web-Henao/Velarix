import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { callAnthropic } from "../_shared/anthropic-client.ts";
import { resolveAdminSecretKey, resolvePublishableKey } from "../_shared/admin-key.ts";
import { requireAuthenticatedUser, classifyOwnedResourceLookup, NotFoundError, BadRequestError, mapErrorToResponse } from "../_shared/user-auth.ts";
import {
  assertNarrativeCalculationResult,
  mapCalculationResultToNarrativeViewModel,
  buildCalculationMeta,
  detectRisks,
  CalculationResultRequiredError,
  UnsupportedCalculationResultError,
  type NarrativeCalculationViewModel,
} from "../_shared/narrative-calculation-adapter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NARRATIVE_GENERATION_VERSION = "4.1";

// ═══════════════════════════════════════════════════════════════
// VELARIX v4.1 — Motor Narrativo Institucional Completo
// Bloques 3-5: 20 secciones + riesgos + recomendaciones + auditoría
// Bloque 1E/Subbloque 2: consume exclusivamente analyses.calculation_result
// canónico (vía narrative-calculation-adapter.ts) — ya no acepta cifras
// financieras desde el request.
// ═══════════════════════════════════════════════════════════════

const SYSTEM_BASE = `Eres el analista financiero senior de Velarix, una plataforma de inteligencia financiera institucional para empresas colombianas.

PRINCIPIO DE CONSTRUCCIÓN NARRATIVA:
Cada párrafo sigue: DATO → INTERPRETACIÓN → IMPLICACIÓN EJECUTIVA
Nunca inviertas este orden. Nunca empieces con una conclusión.

RESTRICCIONES ABSOLUTAS:
- Solo usas los datos que te entrego. No mencionas cifras inexistentes.
- No inventas comparables sectoriales ni fuentes.
- No calculas WACC, EV, FCFF ni indicadores — solo interpretas outputs ya calculados.
- No usas lenguaje de marketing, emocional ni exagerado.
- No contradices los datos numéricos en ninguna circunstancia.

TONO: Institucional. Sobrio. Técnico. Preciso. Claro para usuarios de negocio.
IDIOMA: Español colombiano formal. Términos técnicos en inglés: DCF, WACC, EBITDA, CAPM, Beta, ERP, FCFF, EV/EBITDA, EV/Revenue, NOPAT.

Devuelve únicamente el texto de la sección. Sin JSON. Sin encabezados. Sin markdown.`;

// ── Section definitions (Bloques 3+4) — dataKeys ya sobre nombres canónicos ──
const SECTIONS = [
  {
    key: "executive_summary",
    title: "Resumen Ejecutivo",
    system: `${SYSTEM_BASE}\n\nTu función es redactar el resumen ejecutivo del informe. Esta es la sección más importante: debe permitir entender completamente el caso sin leer el resto.\n\nEstructura obligatoria:\n  Párrafo 1: Diagnóstico general de la empresa\n  Párrafo 2: Principales fortalezas (máximo 2, con dato)\n  Párrafo 3: Principales debilidades o riesgos (máximo 2, con dato)\n  Párrafo 4: Resultado de valoración (si existe) — EV, rango, WACC\n  Párrafo 5: Recomendación ejecutiva de cierre\n\nExtensión: 5 párrafos · 250–400 palabras`,
    dataKeys: ["enterpriseValue", "equityValue", "wacc", "costOfEquity", "betaLevered", "evEbitda", "evRevenue", "netDebt", "evLow", "evHigh", "kpis", "growth"],
    maxTokens: 800,
  },
  {
    key: "company_profile",
    title: "Perfil de la Empresa",
    system: `${SYSTEM_BASE}\n\nRedacta la sección de perfil de la empresa.\n  Párrafo 1: Contexto del caso (empresa, sector, período base, tipo de análisis)\n  Párrafo 2: Características inferibles del comportamiento financiero\n  Párrafo 3: Alcance y limitaciones del análisis\nExtensión: 2–3 párrafos · 100–150 palabras\nNo inventes características del negocio que no estén en los datos.\nSolo dispones del período base (historical.base_period), no de una serie histórica de varios períodos.`,
    dataKeys: ["kpis", "growth", "historical"],
    maxTokens: 400,
  },
  {
    key: "revenue_analysis",
    title: "Análisis de Ingresos y Crecimiento",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de ingresos y crecimiento.\n  Párrafo 1: Dato — nivel de ingresos del período base (historical.income_statement.revenue) y proyecciones ya calculadas (projections)\n  Párrafo 2: Interpretación — qué dice el supuesto de crecimiento (growth) sobre el negocio\n  Párrafo 3: Implicación — sostenibilidad y base para las proyecciones entregadas\nExtensión: 3–4 párrafos · 150–200 palabras\nEl período base no constituye por sí solo una tendencia histórica. No infieras evolución histórica no entregada.\nSi crecimiento > 50%: advertir que es agresivo sin dramatizar.`,
    dataKeys: ["historical", "projections", "growth"],
    maxTokens: 500,
  },
  {
    key: "cost_analysis",
    title: "Análisis de Costos y Estructura Operativa",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de costos y estructura operativa.\n  Párrafo 1: Dato — cifras del período base disponibles en historical.income_statement (revenue, cost_of_sales, opex, da, ebitda, ebit) y los márgenes ya calculados en kpis\n  Párrafo 2: Interpretación — eficiencia o presión de la estructura, usando los márgenes de kpis (no calcules nuevos porcentajes)\n  Párrafo 3: Implicación — modelo operativo y márgenes\nExtensión: 3–4 párrafos · 150–200 palabras\nMenciona solo las cifras de historical.income_statement que estén presentes (no nulas) — si alguna falta, omítela sin señalarlo.\nNo calcules ningún porcentaje/ratio nuevo — usa exclusivamente los márgenes ya presentes en kpis.`,
    dataKeys: ["kpis", "historical"],
    maxTokens: 500,
  },
  {
    key: "profitability_analysis",
    title: "Análisis de Rentabilidad",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de rentabilidad.\n  Párrafo 1: Dato — márgenes actuales (bruto, EBITDA, neto)\n  Párrafo 2: Interpretación — capacidad de captura de valor\n  Párrafo 3: Comparación sectorial (si benchmark disponible)\n  Párrafo 4: ROE y ROA (si disponibles)\nExtensión: 3–4 párrafos · 150–200 palabras\nSi márgenes negativos: "la empresa registra pérdidas operativas en el período analizado".\nPara la comparación sectorial, compara ÚNICAMENTE métricas donde exista tanto el valor de la empresa (kpis) como el de referencia (sectorBenchmark) — p.ej. kpis.ebitdaMargin vs sectorBenchmark.ebitdaMargin. sectorBenchmark no incluye referencia de ROE ni ROA: no compares esas dos métricas contra el sector.\nSi benchmark no disponible: omitir comparación sin mencionarla.`,
    dataKeys: ["kpis", "sectorBenchmark"],
    maxTokens: 500,
  },
  {
    key: "liquidity_analysis",
    title: "Análisis de Liquidez",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de liquidez.\n  Párrafo 1: Dato — razón corriente, prueba ácida, capital de trabajo\n  Párrafo 2: Interpretación — capacidad de cumplimiento CP\n  Párrafo 3: Implicación — riesgos de liquidez o holgura confirmada\nExtensión: 3–4 párrafos · 150–200 palabras\n\nEscala razón corriente: >2.0 holgada, 1.2–2.0 adecuada, 1.0–1.2 ajustada, <1.0 riesgo material.\nSi caja < 15 días de ingresos: señal de atención.`,
    dataKeys: ["kpis"],
    maxTokens: 500,
  },
  {
    key: "financial_structure",
    title: "Análisis de Estructura Financiera y Endeudamiento",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de endeudamiento.\n  Párrafo 1: Dato — deuda financiera (historical.balance_sheet.current_financial_debt / long_term_financial_debt / financial_debt_total), caja (historical.balance_sheet.cash) y deuda neta (netDebt)\n  Párrafo 2: Interpretación — nivel de apalancamiento (kpis.leverage) y cobertura de intereses (kpis.interestCoverage)\n  Párrafo 3: Implicación — capacidad de servicio de deuda y riesgo\nExtensión: 3–4 párrafos · 150–200 palabras\n\nMenciona solo los campos de historical.balance_sheet que estén presentes (no nulos) — si alguno falta, omítelo sin señalarlo. No reconstruyas financial_debt_total a partir de sus componentes si no viene ya calculado.\nEscala deuda neta/EBITDA (kpis.leverage): <1.0x bajo, 1.0–2.5x moderado, 2.5–4.0x elevado, >4.0x alto.\nSi deuda neta < 0: posición neta de caja (favorable).`,
    dataKeys: ["historical", "netDebt", "kpis"],
    maxTokens: 500,
  },
  // ── Bloque 4 sections ──
  {
    key: "efficiency_analysis",
    title: "Análisis de Eficiencia Operativa",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de eficiencia operativa.\n  Párrafo 1: Dato — ratios disponibles (rotación activos, días cartera, inventario, proveedores, ciclo de caja)\n  Párrafo 2: Interpretación — qué dicen sobre el uso del capital operativo\n  Párrafo 3: Implicación — gestión de cartera, inventario y capital de trabajo\nExtensión: 2–3 párrafos · 100–150 palabras\n\nEscala de días de cartera:\n  < 30 días → Cobro ágil, bajo riesgo\n  30–60 días → Plazo estándar\n  60–90 días → Plazo extendido, monitorear\n  > 90 días → Cartera lenta, riesgo de deterioro\n\nSi algún ratio es null: omitirlo sin mencionar su ausencia.`,
    dataKeys: ["kpis"],
    maxTokens: 400,
  },
  {
    key: "qualitative_analysis",
    title: "Análisis Cualitativo de Desempeño",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis cualitativo de desempeño. Traduce el comportamiento financiero en lectura de negocio.\n  Párrafo 1: Fortaleza operativa — solidez del modelo inferida del perfil financiero\n  Párrafo 2: Disciplina financiera — estructura de capital y gestión de obligaciones\n  Párrafo 3: Escalabilidad y sostenibilidad — repetibilidad del desempeño observado\n  Párrafo 4: Señales de tensión o atención (si existen)\nExtensión: 4–5 párrafos · 200–250 palabras\n\nNo inventes ventajas competitivas ni modelos de negocio específicos. Solo infiere lo que el comportamiento financiero sustenta.`,
    dataKeys: ["kpis", "growth", "netDebt"],
    maxTokens: 600,
  },
  {
    key: "projections_analysis",
    title: "Proyecciones Financieras",
    system: `${SYSTEM_BASE}\n\nRedacta la sección de proyecciones financieras.\n  Párrafo 1: Supuestos del modelo\n  Párrafo 2: Evolución proyectada de ingresos y EBITDA (escenario base)\n  Párrafo 3: Comportamiento del FCFF y generación de caja\n  Párrafo 4: Lectura del escenario — qué tan exigente, razonable o conservador\nExtensión: 3–4 párrafos · 150–200 palabras\n\nSi growth > 50%: advertirlo como supuesto agresivo.\nSi growth < 5%: mencionarlo como supuesto conservador.\nSi FCFF negativo en algún año: mencionarlo con explicación.\nNo calcules proyecciones — solo interpreta las que te entrego.`,
    dataKeys: ["projections", "growth"],
    maxTokens: 500,
  },
  {
    key: "valuation_analysis",
    title: "Valoración por DCF",
    system: `${SYSTEM_BASE}\n\nRedacta la sección de valoración por DCF.\n  Párrafo 1: Componentes del WACC — describe ÚNICAMENTE los componentes presentes en los datos entregados (wacc, costOfEquity, costOfDebtAfterTax si está disponible, betaLevered). No reconstruyas ni infieras pesos de capital (equity/deuda), tasas o supuestos que no te fueron entregados.\n  Párrafo 2: Resultado — EV, equity value, rango\n  Párrafo 3: Composición del valor — cita terminalValue/discountedTV y el enterpriseValue si están disponibles\n  Párrafo 4: Interpretación ejecutiva — qué sostiene el valor y sensibilidad\nExtensión: 4–5 párrafos · 200–250 palabras\n\nDescribe el peso del valor terminal (discountedTV) frente al Enterprise Value únicamente a partir de los datos entregados. No afirmes que domina salvo que los datos lo sustenten. No calcules ni menciones un porcentaje/participación que no te fue entregado explícitamente.\nSiempre menciona el rango, no solo el punto central.`,
    dataKeys: ["enterpriseValue", "equityValue", "wacc", "costOfEquity", "costOfDebtAfterTax", "discountedTV", "evEbitda", "evRevenue", "terminalValue", "betaLevered", "netDebt", "evLow", "evHigh", "projections"],
    maxTokens: 700,
  },
  {
    key: "multiples_valuation",
    title: "Valoración por Múltiplos",
    // Bloque 1E/Subbloque 2 (corrección final): esta sección queda
    // `not_available` — ver SECTIONS_NOT_AVAILABLE más abajo. El motor
    // canónico no ejecuta una valoración INDEPENDIENTE por múltiplos;
    // `valuation.evEbitda`/`evRevenue` son múltiplos implícitos del
    // resultado DCF, no un segundo método de valoración. `system`/
    // `dataKeys` quedan documentados pero no se usan mientras esta
    // sección esté marcada no disponible.
    system: `${SYSTEM_BASE}\n\nRedacta la sección de valoración por múltiplos.\n  Párrafo 1: Metodología — múltiplos usados\n  Párrafo 2: Resultados — rangos de valoración por múltiplo\n  Párrafo 3: Contraste con DCF — convergencia o divergencia y explicación\nExtensión: 3–4 párrafos · 150–200 palabras\n\nNo afirmes cuál método es más correcto — son complementarios.\nMenciona la fuente de los múltiplos de referencia SOLO si está presente en los datos entregados. No inventes ni atribuyas una fuente que no te fue entregada — si no está disponible, omite la mención de fuente sin señalar su ausencia.`,
    dataKeys: ["enterpriseValue", "evEbitda", "evRevenue", "kpis"],
    maxTokens: 500,
  },
  {
    key: "sensitivity_analysis",
    title: "Análisis de Sensibilidad",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de sensibilidad.\n  Párrafo 1: Variables analizadas — WACC y g como factores de mayor impacto\n  Párrafo 2: Lectura de la matriz — rango total y extremos\n  Párrafo 3: Implicación — robustez o fragilidad del resultado central\nExtensión: 3–4 párrafos · 150–200 palabras\n\nNo reproduzcas la tabla completa — sintetiza extremos y variable dominante.\nSi rango > 2x el EV base: resultado sensible, depende fuertemente de supuestos.\nSi rango < 30% del EV base: relativa robustez.`,
    dataKeys: ["sensitivityMatrix", "wacc", "evLow", "evHigh", "enterpriseValue"],
    maxTokens: 500,
  },
  {
    key: "benchmark_comparison",
    title: "Comparación Sectorial",
    system: `${SYSTEM_BASE}\n\nRedacta la comparación sectorial (NO es una valoración por múltiplos — es una referencia de contraste, no un método de valoración adicional).\n  Párrafo 1: Dato — compara valores de la empresa/cálculo (kpis.ebitdaMargin, evEbitda, evRevenue, wacc, betaLevered) contra los de referencia sectorial (sectorBenchmark.ebitdaMargin, sectorBenchmark.evEbitda, sectorBenchmark.evRevenue, sectorBenchmark.waccRef, sectorBenchmark.beta)\n  Párrafo 2: Interpretación — posición relativa y qué la explica\n  Párrafo 3: Implicación — qué significa para valoración y gestión\nExtensión: 3–4 párrafos · 150–200 palabras\n\nSolo comenta pares de métricas donde exista tanto el valor de la empresa como el de sectorBenchmark.\nNo inferir benchmark que no esté en los datos entregados.\nMenciona fuente y fecha del benchmark SOLO si están presentes en los datos entregados — no las inventes ni las asumas.\nNo llames a esta sección "valoración por múltiplos" ni la presentes como un método de valoración adicional.\nSi no hay benchmark: indicar sobriamente ausencia de referencia.`,
    dataKeys: ["kpis", "sectorBenchmark", "evEbitda", "evRevenue", "wacc", "betaLevered"],
    maxTokens: 500,
  },
];

// Bloque 1E/Subbloque 2 (corrección + corrección final): secciones que se
// persisten como contenido determinístico, sin invocar IA, en vez de dejar
// que el modelo interprete/rellene sobre datos que no tiene:
//
// - liquidity_analysis / efficiency_analysis: piden métricas (razón
//   corriente, prueba ácida, capital de trabajo, días de cartera/
//   inventario/proveedores, ciclo de caja) que NUNCA existieron en
//   `CanonicalKPIs` ni en el motor cliente — limitación estructural, no
//   ausencia puntual.
// - multiples_valuation: el motor canónico NO ejecuta una valoración
//   INDEPENDIENTE por múltiplos — `valuation.evEbitda`/`evRevenue` son
//   múltiplos implícitos del resultado DCF, no un segundo método de
//   valoración por comparables. Presentar una sección "Valoración por
//   Múltiplos" insinuaría un método que no existe.
const SECTIONS_NOT_AVAILABLE: Record<string, string> = {
  liquidity_analysis: "No hay métricas canónicas suficientes para emitir una conclusión trazable sobre esta sección.",
  efficiency_analysis: "No hay métricas canónicas suficientes para emitir una conclusión trazable sobre esta sección.",
  multiples_valuation: "No se ejecutó una valoración canónica independiente por múltiplos dentro de este cálculo. Los múltiplos disponibles se utilizan únicamente como referencias de contraste y no constituyen una segunda conclusión de valor.",
};

// ═══════════════════════════════════════════════════════════════
// Motor de Recomendaciones (riesgo → acción)
// Sin cambios de contrato — opera sobre `risks` (mismos ids/campos que
// siempre), no sobre nombres del contrato legacy que el request enviaba antes.
// ═══════════════════════════════════════════════════════════════

function generateRecommendations(risks: ReturnType<typeof detectRisks>, _kpis: NarrativeCalculationViewModel["kpis"]): any[] {
  const recMap: Record<string, any> = {
    // LIQ_001 eliminado (Bloque 1E/Subbloque 2): la regla de riesgo que la
    // originaba ya no existe (liquidezCorriente no está en CanonicalKPIs) —
    // sin sustituto, no tiene sentido mantener una recomendación que nunca
    // puede originarse.
    END_001: { titulo: "Gestionar activamente el nivel de endeudamiento", razon: "Deuda neta/EBITDA supera 3.0x.", impacto_esperado: "Mayor flexibilidad financiera.", prioridad: "Alta" },
    END_002: { titulo: "Revisar la estructura de deuda para mejorar cobertura de intereses", razon: "Cobertura de intereses insuficiente.", impacto_esperado: "Menor riesgo de incumplimiento en servicio de deuda.", prioridad: "Alta" },
    RENT_001: { titulo: "Implementar plan de recuperación de rentabilidad operativa", razon: "Pérdidas a nivel EBITDA comprometen la viabilidad del modelo.", impacto_esperado: "Retorno a márgenes operativos positivos.", prioridad: "Alta" },
    RENT_003: { titulo: "Revisar carga financiera y fiscal", razon: "EBITDA positivo pero resultado neto negativo indica presión financiera o fiscal.", impacto_esperado: "Mejora del resultado neto disponible.", prioridad: "Media" },
    CREC_001: { titulo: "Construir escenarios con crecimientos más conservadores", razon: "El supuesto de crecimiento es agresivo y la valoración es altamente sensible.", impacto_esperado: "Mejor gestión de expectativas con inversionistas.", prioridad: "Media" },
    VAL_001: { titulo: "Revisar supuestos operativos del modelo de valoración", razon: "EV negativo sugiere que los supuestos actuales no generan valor.", impacto_esperado: "Modelo de valoración con supuestos más realistas.", prioridad: "Alta" },
    VAL_002: { titulo: "Comunicar el rango de valoración con sus supuestos", razon: "Alta dispersión del EV según sensibilidad.", impacto_esperado: "Mejor comunicación del rango creíble.", prioridad: "Media" },
  };

  const recs: any[] = [];
  risks.forEach((risk, i) => {
    const rec = recMap[risk.id];
    if (rec) {
      recs.push({ numero: i + 1, ...rec, riesgo_origen: risk.id, categoria: risk.categoria });
    }
  });
  const pOrder: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 };
  recs.sort((a, b) => pOrder[a.prioridad] - pOrder[b.prioridad]);
  return recs.slice(0, 6);
}

// ═══════════════════════════════════════════════════════════════
// Prompts for risks, recommendations, conclusion
// ═══════════════════════════════════════════════════════════════

const SYSTEM_RISKS_NARRATIVE = `${SYSTEM_BASE}

Tu función es redactar la descripción de cada riesgo identificado en el análisis.
Para cada riesgo recibes: nombre, categoría, indicador que lo sustenta, impacto y probabilidad.

Por cada riesgo escribe 2–3 líneas que expliquen:
  - qué dice el indicador
  - por qué representa un riesgo para la empresa
  - qué consecuencia concreta podría tener si se materializa

Las descripciones deben derivarse del indicador entregado, no de suposiciones.
Tono: sobrio, institucional, directo.
Devuelve JSON: [{"id":"...","descripcion":"..."}]
Solo JSON. Sin texto adicional.`;

const SYSTEM_RECS_NARRATIVE = `${SYSTEM_BASE}

Tu función es redactar la sección de recomendaciones del informe.
Cada recomendación ya tiene título, razón, impacto esperado y prioridad.
Presenta cada una en formato narrativo institucional: título + razón + impacto + prioridad.
Tono: ejecutivo, sobrio, accionable.
Devuelve únicamente el texto formateado. Sin JSON.`;

const SYSTEM_CONCLUSION = `${SYSTEM_BASE}

Tu función es redactar la conclusión final del informe financiero.
Es la última sección del cuerpo principal y debe cerrar con criterio ejecutivo claro.

Estructura:
  Párrafo 1: Cómo luce la empresa en términos generales — diagnóstico de cierre
  Párrafo 2: Qué está impulsando o frenando la creación de valor
  Párrafo 3: Si el negocio parece sólido, tensionado, escalable o frágil
  Párrafo 4: Cuál es el siguiente frente lógico de gestión
  Párrafo 5: Cierre institucional — una línea que sintetice el mensaje central

Extensión: 5 párrafos · 300–450 palabras

La conclusión debe ser consistente con el resumen ejecutivo, los riesgos y las recomendaciones.
No introduzcas información nueva. No repitas párrafos de otras secciones.
Si hay limitaciones de datos: reconocerlas sin minimizarlas.
Devuelve únicamente el texto, sin encabezados ni JSON.`;

// ═══════════════════════════════════════════════════════════════
// Enhanced Narrative Auditor (6 criteria — Bloque 5)
// ═══════════════════════════════════════════════════════════════

const SYSTEM_AUDITOR = `Eres el auditor de consistencia narrativa de Velarix. Recibes el informe financiero completo y el output numérico del análisis. Verifica que la narrativa sea matemática y lógicamente consistente.

Verifica estos seis criterios:

1. NÚMEROS INVENTADOS — ¿La narrativa menciona alguna cifra que no existe en los datos?
2. COMPARABLES INVENTADOS — ¿Menciona benchmarks no presentes en los datos?
3. CONTRADICCIÓN DE RATIOS — ¿Alguna afirmación contradice un indicador calculado?
4. RECOMENDACIONES SIN RESPALDO — ¿Alguna recomendación no se conecta con hallazgos?
5. TONO INCONSISTENTE — ¿Hay pérdidas pero la narrativa suena optimista, o viceversa?
6. INCONSISTENCIA ENTRE SECCIONES — ¿El resumen ejecutivo contradice la conclusión?

Devuelve ÚNICAMENTE este JSON:
{
  "audit_passed": true o false,
  "score": número entre 0 y 100,
  "issues": [
    {
      "tipo": "NUMERO_INVENTADO | COMPARABLE_INVENTADO | CONTRADICCION | RECOMENDACION_SIN_RESPALDO | TONO_INCONSISTENTE | INCONSISTENCIA_ENTRE_SECCIONES",
      "seccion": "nombre de la sección",
      "descripcion": "descripción específica del problema",
      "fragmento": "fragmento exacto del texto",
      "severidad": "CRITICA | MEDIA | BAJA"
    }
  ],
  "resumen": "evaluación general en 2 líneas"
}

Si no hay problemas: audit_passed = true, score = 100, issues = [].
Solo JSON. Sin texto adicional.`;

function handleAIResult(content: string | null, title: string): { title: string; content: string; status: string } {
  if (content === "__RATE_LIMITED__") return { title, content: "[Sección pendiente — límite de solicitudes.]", status: "rate_limited" };
  if (content) return { title, content, status: "generated" };
  return { title, content: "[Error al generar esta sección]", status: "error" };
}

function calculationErrorResponse(code: string, message: string): Response {
  return new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status: 409,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ═══════════════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════════════

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

    // Bloque 1E/Subbloque 2: el body ya solo trae el identificador del
    // análisis — el cálculo se lee siempre server-side desde
    // analyses.calculation_result, nunca de cifras que el caller decida enviar.
    const { analysis_id } = await req.json();
    if (!analysis_id) throw new BadRequestError("MISSING_ANALYSIS_ID", "analysis_id es requerido.");

    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .select("id, company_name, sector, status, calculation_result, user_id")
      .eq("id", analysis_id)
      .single();
    const lookup = classifyOwnedResourceLookup(analysisError, analysis, user.id);
    if (lookup === "not_found") throw new NotFoundError();
    if (lookup === "technical_error") throw analysisError;

    // Gate técnico fail-closed (ANTES de tocar analyses.status): el
    // calculation_result debe ser un envelope canónico completo, de la
    // versión de schema soportada, con fingerprint y snapshot presentes.
    // Nunca se recalcula ni se completa con defaults — o es válido, o se
    // rechaza explícito pidiendo volver a ejecutar el cálculo.
    let calculationResult;
    try {
      calculationResult = assertNarrativeCalculationResult(analysis.calculation_result);
    } catch (e) {
      if (e instanceof CalculationResultRequiredError) {
        return calculationErrorResponse(e.code, "El cálculo canónico aún no está disponible para este análisis. Ejecuta el cálculo antes de generar la narrativa.");
      }
      if (e instanceof UnsupportedCalculationResultError) {
        return calculationErrorResponse(e.code, "El cálculo disponible no es compatible con la narrativa actual. Vuelve a ejecutar un cálculo compatible.");
      }
      throw e;
    }

    const vm = mapCalculationResultToNarrativeViewModel(calculationResult);
    const calculationMeta = buildCalculationMeta(calculationResult);

    if (!Deno.env.get("ANTHROPIC_API_KEY")) throw new Error("ANTHROPIC_API_KEY not configured");

    await supabase.from("analyses").update({ status: "interpretacion_en_curso" }).eq("id", analysis_id);

    // ── Phase 1: Generate all narrative sections (Bloques 3+4) ──
    const sectionsPayload: Record<string, any> = {};
    let executiveSummary = "";
    const vmRecord = vm as unknown as Record<string, unknown>;

    for (const section of SECTIONS) {
      // Bloque 1E/Subbloque 2 (corrección + corrección final): sin llamar a
      // Anthropic para secciones donde el motor canónico no tiene ninguna
      // métrica/método real que sustente una interpretación — contenido
      // determinístico, sobrio, sin conclusión financiera inventada.
      if (SECTIONS_NOT_AVAILABLE[section.key]) {
        sectionsPayload[section.key] = { title: section.title, content: SECTIONS_NOT_AVAILABLE[section.key], status: "not_available" };
        continue;
      }

      const sectionData: Record<string, any> = {};
      for (const key of section.dataKeys) {
        if (vmRecord[key] !== undefined) sectionData[key] = vmRecord[key];
      }
      sectionData.companyName = analysis.company_name;
      sectionData.sector = analysis.sector;

      const userPrompt = `Redacta la sección "${section.title}" del informe financiero con estos datos:\n\nEmpresa: ${analysis.company_name}\nSector: ${analysis.sector}\n\nDatos disponibles:\n${JSON.stringify(sectionData, null, 2)}\n\nDevuelve SOLO el texto de la sección.`;

      const content = await callAnthropic(section.system, userPrompt, section.maxTokens);
      sectionsPayload[section.key] = handleAIResult(content, section.title);
      if (section.key === "executive_summary" && content && content !== "__RATE_LIMITED__") {
        executiveSummary = content;
      }

      await new Promise(r => setTimeout(r, 300));
    }

    // ── Phase 2: Deterministic risk detection (Bloque 5) — adaptador canónico ──
    const risks = detectRisks(vm);
    const recommendations = generateRecommendations(risks, vm.kpis);

    // ── Phase 3: AI narrative for risks ──
    let risksNarrative: any[] = [];
    if (risks.length > 0) {
      const risksPrompt = `Redacta la descripción para cada uno de estos riesgos identificados:\n\n${JSON.stringify(risks.map(r => ({ id: r.id, nombre: r.nombre, categoria: r.categoria, indicador: r.indicador, impacto: r.impacto, probabilidad: r.probabilidad })), null, 2)}`;
      const risksContent = await callAnthropic(SYSTEM_RISKS_NARRATIVE, risksPrompt, 800);
      if (risksContent && risksContent !== "__RATE_LIMITED__") {
        try {
          const jsonMatch = risksContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) risksNarrative = JSON.parse(jsonMatch[0]);
        } catch (_e) { console.error("Error parsing risk narratives"); }
      }
      await new Promise(r => setTimeout(r, 300));
    }

    // Merge risk descriptions
    const risksWithDesc = risks.map(r => ({
      ...r,
      descripcion: risksNarrative.find((n: any) => n.id === r.id)?.descripcion || r.indicador,
    }));

    sectionsPayload["risks"] = {
      title: "Riesgos Identificados",
      content: risksWithDesc.map(r => `**${r.nombre}** (${r.categoria} · Impacto: ${r.impacto})\n${r.descripcion}`).join("\n\n") || "No se identificaron riesgos materiales bajo los supuestos actuales.",
      status: "generated",
      risks_data: risksWithDesc,
    };

    // ── Phase 4: AI narrative for recommendations ──
    if (recommendations.length > 0) {
      const recsPrompt = `Redacta las recomendaciones del informe:\n\n${JSON.stringify(recommendations, null, 2)}`;
      const recsContent = await callAnthropic(SYSTEM_RECS_NARRATIVE, recsPrompt, 800);
      sectionsPayload["recommendations"] = handleAIResult(recsContent, "Recomendaciones");
      sectionsPayload["recommendations"].recommendations_data = recommendations;
      await new Promise(r => setTimeout(r, 300));
    } else {
      sectionsPayload["recommendations"] = { title: "Recomendaciones", content: "No se generaron recomendaciones bajo el perfil financiero actual.", status: "generated", recommendations_data: [] };
    }

    // ── Phase 5: Conclusion (Bloque 5) ──
    const estado = (vm.kpis.ebitdaMargin > 0 && (vm.kpis.leverage == null || vm.kpis.leverage < 3)) ? "sólido" : (vm.kpis.ebitdaMargin < 0 ? "tensionado" : "en transición");

    // wacc/ebitdaMargin ya vienen en porcentaje del motor canónico (p.ej.
    // 11.2, no 0.112) — a diferencia del contrato legacy anterior, aquí
    // NO se multiplica por 100 de nuevo.
    const conclusionPrompt = `Redacta la conclusión final del informe:\n\nEmpresa: ${analysis.company_name} · Sector: ${analysis.sector}\n\nDiagnóstico:\n  Margen EBITDA: ${vm.kpis.ebitdaMargin?.toFixed(1) ?? "N/D"}%\n  Enterprise Value: ${vm.moneda} ${vm.enterpriseValue != null ? Math.round(vm.enterpriseValue).toLocaleString() : "N/D"}\n  WACC: ${vm.wacc != null ? vm.wacc.toFixed(1) : "N/D"}%\n\nEstado general: ${estado}\nRiesgo principal: ${risks[0]?.nombre || "Ninguno identificado"}\nRecomendación prioritaria: ${recommendations[0]?.titulo || "Ninguna"}\n\nDevuelve SOLO el texto.`;

    const conclusionContent = await callAnthropic(SYSTEM_CONCLUSION, conclusionPrompt, 800);
    sectionsPayload["conclusion"] = handleAIResult(conclusionContent, "Conclusión General");

    await new Promise(r => setTimeout(r, 300));

    // ── Phase 6: Narrative Audit (enhanced 6-criteria — Bloque 5) ──
    let auditPassed = true;
    let auditScore = 100;
    let auditNotes = "";

    const allNarrative = Object.values(sectionsPayload)
      .filter((s: any) => s.status === "generated")
      .map((s: any) => `## ${s.title}\n${s.content}`)
      .join("\n\n");

    const auditPrompt = `Audita este informe financiero.\n\nDATOS CALCULADOS (ground truth):\n${JSON.stringify({
      enterpriseValue: vm.enterpriseValue,
      equityValue: vm.equityValue,
      wacc: vm.wacc,
      evEbitda: vm.evEbitda,
      evRevenue: vm.evRevenue,
      netDebt: vm.netDebt,
      kpis: vm.kpis,
      growth: vm.growth,
      evLow: vm.evLow,
      evHigh: vm.evHigh,
    }, null, 2)}\n\nNARRATIVA COMPLETA POR SECCIÓN:\n${allNarrative}`;

    const auditResult = await callAnthropic(SYSTEM_AUDITOR, auditPrompt, 1200);
    if (auditResult && auditResult !== "__RATE_LIMITED__") {
      try {
        const jsonMatch = auditResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const criticalIssues = (parsed.issues || []).filter((i: any) => i.severidad === "CRITICA");
          auditPassed = criticalIssues.length === 0;
          auditScore = parsed.score ?? (auditPassed ? 100 : 50);
          auditNotes = parsed.issues?.length > 0
            ? parsed.issues.map((i: any) => `[${i.severidad || i.type}] ${i.tipo || i.type}: ${i.descripcion || i.description}`).join("; ")
            : "Sin problemas detectados.";
          if (parsed.resumen) auditNotes += ` | Resumen: ${parsed.resumen}`;
        }
      } catch (_e) { auditNotes = "Error al parsear auditoría."; }
    } else {
      auditNotes = "Auditoría no completada.";
    }

    // ── Phase 7: Store results ──
    // Sin migration: `report_narratives.analysis_id` NO tiene constraint
    // UNIQUE, así que un upsert con conflicto declarado sobre esa columna
    // no es válido (Postgres exige un unique/exclusion constraint que lo
    // respalde). Se busca la narrativa más reciente del analysis y se
    // actualiza por su id exacto; si no existe ninguna, se inserta. Nunca
    // se actualizan/borran múltiples filas.
    const narrativeRow = {
      analysis_id,
      executive_summary: executiveSummary,
      // Trazabilidad (Bloque 1E/Subbloque 2, sin schema nuevo): metadata
      // técnica del cálculo consumido, embebida en el JSON ya existente
      // bajo una clave reservada — nunca se duplica el calculation_result completo.
      sections_payload: { ...sectionsPayload, _calculation_meta: calculationMeta },
      generation_version: NARRATIVE_GENERATION_VERSION,
      audit_passed: auditPassed,
      audit_notes: auditNotes,
    };

    // Bloque 1E/Subbloque 2 (corrección): cada paso de persistencia revisa
    // su `error` y lanza — antes se ignoraban, lo que permitía responder
    // success aunque la narrativa no hubiera quedado realmente guardada o
    // trazada. Esto NO es una transacción distribuida (sigue siendo un
    // conjunto de operaciones separadas contra Postgres/Supabase, misma
    // limitación normal de siempre) — solo deja de silenciar fallos reales.
    // Orden: persistir report_narratives -> audit_event -> status final de
    // analyses -> notificación fire-and-forget al final.
    const { data: existingNarrative, error: existingNarrativeError } = await supabase
      .from("report_narratives")
      .select("id")
      .eq("analysis_id", analysis_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingNarrativeError) throw existingNarrativeError;

    if (existingNarrative) {
      const { error: updateNarrativeError } = await supabase.from("report_narratives").update(narrativeRow).eq("id", existingNarrative.id);
      if (updateNarrativeError) throw updateNarrativeError;
    } else {
      const { error: insertNarrativeError } = await supabase.from("report_narratives").insert(narrativeRow);
      if (insertNarrativeError) throw insertNarrativeError;
    }

    const { error: auditEventError } = await supabase.from("audit_events").insert({
      analysis_id,
      event_type: auditPassed ? "narrative_audit_passed" : "narrative_audit_failed",
      event_detail: `Narrativa v${NARRATIVE_GENERATION_VERSION}: ${Object.keys(sectionsPayload).length} secciones, ${risks.length} riesgos, ${recommendations.length} recomendaciones, auditoría ${auditPassed ? "aprobada" : "fallida"} (score: ${auditScore})`,
      component: "generate-narrative",
      user_id: user.id,
      metadata: {
        sections: Object.keys(sectionsPayload).length,
        generated: Object.values(sectionsPayload).filter((s: any) => s.status === "generated").length,
        risks_count: risks.length,
        recommendations_count: recommendations.length,
        audit_passed: auditPassed,
        audit_score: auditScore,
        audit_notes: auditNotes,
        narrative_generation_version: NARRATIVE_GENERATION_VERSION,
        input_fingerprint: calculationMeta.input_fingerprint,
        calculation_schema_version: calculationMeta.calculation_schema_version,
      },
    });
    if (auditEventError) throw auditEventError;

    const { error: finalStatusError } = await supabase.from("analyses").update({
      status: auditPassed ? "informe_generado" : "revision_manual_requerida",
    }).eq("id", analysis_id);
    if (finalStatusError) throw finalStatusError;

    // Fire notification — fire and forget, solo después de que todo lo
    // anterior se persistió correctamente.
    if (auditPassed) {
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/enviar-notificacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": secretKey },
        body: JSON.stringify({ tipo: "analisis_completado", analysis_id }),
      }).catch(e => console.error("Notification error:", e));
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        executive_summary: executiveSummary,
        sections: sectionsPayload,
        risks: risksWithDesc,
        recommendations,
        audit_passed: auditPassed,
        audit_score: auditScore,
        audit_notes: auditNotes,
      },
      meta: {
        analysis_id,
        status: auditPassed ? "informe_generado" : "revision_manual_requerida",
        version: NARRATIVE_GENERATION_VERSION,
        sections_count: Object.keys(sectionsPayload).length,
        risks_count: risks.length,
        recommendations_count: recommendations.length,
        timestamp: new Date().toISOString(),
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("generate-narrative error:", error);
    const mapped = mapErrorToResponse(error, { code: "NARRATIVE_ERROR", message: "Error al generar la narrativa." });
    return new Response(JSON.stringify(mapped.body), { status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
