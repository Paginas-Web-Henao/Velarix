import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════
// VELARIX v4.0 — Motor Narrativo Institucional Completo
// Bloques 3-5: 20 secciones + riesgos + recomendaciones + auditoría
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

// ── Section definitions (Bloques 3+4) ──
const SECTIONS = [
  {
    key: "executive_summary",
    title: "Resumen Ejecutivo",
    system: `${SYSTEM_BASE}\n\nTu función es redactar el resumen ejecutivo del informe. Esta es la sección más importante: debe permitir entender completamente el caso sin leer el resto.\n\nEstructura obligatoria:\n  Párrafo 1: Diagnóstico general de la empresa\n  Párrafo 2: Principales fortalezas (máximo 2, con dato)\n  Párrafo 3: Principales debilidades o riesgos (máximo 2, con dato)\n  Párrafo 4: Resultado de valoración (si existe) — EV, rango, WACC\n  Párrafo 5: Recomendación ejecutiva de cierre\n\nExtensión: 5 párrafos · 250–400 palabras`,
    dataKeys: ["enterpriseValue", "equityValue", "wacc", "ke", "betaLevered", "evEbitdaImplied", "evRevenueImplied", "netDebt", "evLow", "evHigh", "kpis", "growth"],
    maxTokens: 800,
  },
  {
    key: "company_profile",
    title: "Perfil de la Empresa",
    system: `${SYSTEM_BASE}\n\nRedacta la sección de perfil de la empresa.\n  Párrafo 1: Contexto del caso (empresa, sector, períodos, tipo de análisis)\n  Párrafo 2: Características inferibles del comportamiento financiero\n  Párrafo 3: Alcance y limitaciones del análisis\nExtensión: 2–3 párrafos · 100–150 palabras\nNo inventes características del negocio que no estén en los datos.`,
    dataKeys: ["kpis", "growth"],
    maxTokens: 400,
  },
  {
    key: "revenue_analysis",
    title: "Análisis de Ingresos y Crecimiento",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de ingresos y crecimiento.\n  Párrafo 1: Dato — nivel absoluto de ingresos y evolución\n  Párrafo 2: Interpretación — qué dice la tendencia sobre el negocio\n  Párrafo 3: Implicación — sostenibilidad y base para proyecciones\nExtensión: 3–4 párrafos · 150–200 palabras\nSi solo hay un período: describe nivel absoluto sin inventar tendencia.\nSi crecimiento > 50%: advertir que es agresivo sin dramatizar.`,
    dataKeys: ["kpis", "proyecciones", "growth"],
    maxTokens: 500,
  },
  {
    key: "cost_analysis",
    title: "Análisis de Costos y Estructura Operativa",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de costos y estructura operativa.\n  Párrafo 1: Dato — composición de costos y peso relativo sobre ingresos\n  Párrafo 2: Interpretación — eficiencia o presión de la estructura\n  Párrafo 3: Implicación — modelo operativo y márgenes\nExtensión: 3–4 párrafos · 150–200 palabras`,
    dataKeys: ["kpis"],
    maxTokens: 500,
  },
  {
    key: "profitability_analysis",
    title: "Análisis de Rentabilidad",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de rentabilidad.\n  Párrafo 1: Dato — márgenes actuales (bruto, EBITDA, neto)\n  Párrafo 2: Interpretación — capacidad de captura de valor\n  Párrafo 3: Comparación sectorial (si benchmark disponible)\n  Párrafo 4: ROE y ROA (si disponibles)\nExtensión: 3–4 párrafos · 150–200 palabras\nSi márgenes negativos: "la empresa registra pérdidas operativas en el período analizado".\nSi benchmark no disponible: omitir comparación sin mencionarla.`,
    dataKeys: ["kpis"],
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
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de endeudamiento.\n  Párrafo 1: Dato — deuda total, composición CP/LP, deuda neta\n  Párrafo 2: Interpretación — nivel de apalancamiento y sostenibilidad\n  Párrafo 3: Implicación — capacidad de servicio de deuda y riesgo\nExtensión: 3–4 párrafos · 150–200 palabras\n\nEscala deuda neta/EBITDA: <1.0x bajo, 1.0–2.5x moderado, 2.5–4.0x elevado, >4.0x alto.\nSi deuda neta < 0: posición neta de caja (favorable).`,
    dataKeys: ["kpis", "netDebt"],
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
    dataKeys: ["proyecciones", "growth"],
    maxTokens: 500,
  },
  {
    key: "valuation_analysis",
    title: "Valoración por DCF",
    system: `${SYSTEM_BASE}\n\nRedacta la sección de valoración por DCF.\n  Párrafo 1: Construcción del WACC — Ke (CAPM), Kd, pesos — paso a paso\n  Párrafo 2: Resultado — EV, equity value, rango\n  Párrafo 3: Composición del valor — períodos explícitos vs valor terminal\n  Párrafo 4: Interpretación ejecutiva — qué sostiene el valor y sensibilidad\nExtensión: 4–5 párrafos · 200–250 palabras\n\nSiempre menciona que el valor terminal domina en modelos DCF.\nSiempre menciona el rango, no solo el punto central.`,
    dataKeys: ["enterpriseValue", "equityValue", "wacc", "ke", "pvFCFFTotal", "pvTerminalValue", "discountedTV", "evEbitdaImplied", "evRevenueImplied", "terminalValue", "betaLevered", "netDebt", "evLow", "evHigh"],
    maxTokens: 700,
  },
  {
    key: "multiples_valuation",
    title: "Valoración por Múltiplos",
    system: `${SYSTEM_BASE}\n\nRedacta la sección de valoración por múltiplos.\n  Párrafo 1: Metodología — múltiplos usados y fuente de comparables\n  Párrafo 2: Resultados — rangos de valoración por múltiplo\n  Párrafo 3: Contraste con DCF — convergencia o divergencia y explicación\nExtensión: 3–4 párrafos · 150–200 palabras\n\nNo afirmes cuál método es más correcto — son complementarios.\nSiempre menciona la fuente de los múltiplos de referencia.`,
    dataKeys: ["enterpriseValue", "evEbitdaImplied", "evRevenueImplied", "kpis"],
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
    system: `${SYSTEM_BASE}\n\nRedacta la comparación sectorial.\n  Párrafo 1: Dato — comparación de métricas clave empresa vs sector\n  Párrafo 2: Interpretación — posición relativa y qué la explica\n  Párrafo 3: Implicación — qué significa para valoración y gestión\nExtensión: 3–4 párrafos · 150–200 palabras\n\nSolo comenta métricas para las que tienes tanto valor empresa como sector.\nNo inferir benchmark que no esté en los datos entregados.\nSiempre mencionar fuente y fecha del benchmark.\nSi no hay benchmark: indicar sobriamente ausencia de referencia.`,
    dataKeys: ["kpis", "evEbitdaImplied", "evRevenueImplied", "wacc", "betaLevered"],
    maxTokens: 500,
  },
];

// ═══════════════════════════════════════════════════════════════
// BLOQUE 5 — Motor de Riesgos Determinístico
// ═══════════════════════════════════════════════════════════════

function detectRisks(output: any): any[] {
  const risks: any[] = [];
  const kpis = output.kpis || {};
  const growth = output.growth || 0;

  // LIQ_001: Razón corriente baja
  if (kpis.liquidezCorriente != null && kpis.liquidezCorriente < 1.2) {
    risks.push({ id: "LIQ_001", nombre: "Liquidez corriente ajustada", categoria: "Liquidez", indicador: `Razón corriente: ${kpis.liquidezCorriente.toFixed(2)}x`, umbral: "< 1.2x", impacto: "Alto", probabilidad: "Media" });
  }

  // END_001: Apalancamiento elevado
  if (kpis.leverageDeudaEBITDA != null && kpis.leverageDeudaEBITDA > 3.0) {
    risks.push({ id: "END_001", nombre: "Nivel de apalancamiento elevado", categoria: "Endeudamiento", indicador: `Deuda neta/EBITDA: ${kpis.leverageDeudaEBITDA.toFixed(2)}x`, umbral: "> 3.0x", impacto: "Alto", probabilidad: "Media" });
  }

  // END_002: Cobertura de intereses baja
  if (kpis.coberturaIntereses != null && kpis.coberturaIntereses < 2.0) {
    risks.push({ id: "END_002", nombre: "Cobertura de intereses insuficiente", categoria: "Endeudamiento", indicador: `Cobertura: ${kpis.coberturaIntereses.toFixed(1)}x`, umbral: "< 2.0x", impacto: "Alto", probabilidad: "Alta" });
  }

  // RENT_001: EBITDA margin negativo
  if (kpis.margenEBITDA != null && kpis.margenEBITDA < 0) {
    risks.push({ id: "RENT_001", nombre: "Pérdidas operativas en el período analizado", categoria: "Rentabilidad", indicador: `Margen EBITDA: ${kpis.margenEBITDA.toFixed(1)}%`, umbral: "< 0%", impacto: "Alto", probabilidad: "Alta" });
  }

  // RENT_003: Net margin negativo con EBITDA positivo
  if (kpis.margenNeto != null && kpis.margenNeto < 0 && kpis.margenEBITDA != null && kpis.margenEBITDA > 0) {
    risks.push({ id: "RENT_003", nombre: "Resultado neto negativo a pesar de EBITDA positivo", categoria: "Rentabilidad", indicador: `Margen neto: ${kpis.margenNeto.toFixed(1)}%`, umbral: "< 0% con EBITDA positivo", impacto: "Medio", probabilidad: "Media" });
  }

  // CREC_001: Growth agresivo
  if (growth > 50) {
    risks.push({ id: "CREC_001", nombre: "Supuesto de crecimiento agresivo en el modelo", categoria: "Crecimiento", indicador: `Crecimiento asumido: ${growth}%`, umbral: "> 50% anual", impacto: "Alto", probabilidad: "Media" });
  }

  // VAL_001: EV negativo
  if (output.enterpriseValue != null && output.enterpriseValue < 0) {
    risks.push({ id: "VAL_001", nombre: "Enterprise Value negativo bajo los supuestos del modelo", categoria: "Valoración", indicador: `EV: USD ${Math.round(output.enterpriseValue).toLocaleString()}`, umbral: "EV < 0", impacto: "Alto", probabilidad: "Alta" });
  }

  // VAL_002: Alta sensibilidad
  if (output.evLow && output.evHigh && output.evHigh / output.evLow > 2.0) {
    risks.push({ id: "VAL_002", nombre: "Alta sensibilidad del valor a supuestos del modelo", categoria: "Valoración", indicador: `Rango EV: USD ${(output.evLow / 1e6).toFixed(1)}M – ${(output.evHigh / 1e6).toFixed(1)}M`, umbral: "Ratio > 2.0x", impacto: "Medio", probabilidad: "Media" });
  }

  // Sort by impact then probability
  const impOrder: Record<string, number> = { Alto: 0, Medio: 1, Bajo: 2 };
  const probOrder: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 };
  risks.sort((a, b) => (impOrder[a.impacto] - impOrder[b.impacto]) || (probOrder[a.probabilidad] - probOrder[b.probabilidad]));
  return risks;
}

// ═══════════════════════════════════════════════════════════════
// Motor de Recomendaciones (riesgo → acción)
// ═══════════════════════════════════════════════════════════════

function generateRecommendations(risks: any[], kpis: any): any[] {
  const recMap: Record<string, any> = {
    LIQ_001: { titulo: "Fortalecer la posición de liquidez corriente", razon: "Razón corriente por debajo del umbral mínimo de 1.2x.", impacto_esperado: "Reducción del riesgo de incumplimiento CP.", prioridad: "Alta" },
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

// ═══════════════════════════════════════════════════════════════
// AI caller
// ═══════════════════════════════════════════════════════════════

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string, maxTokens = 2000): Promise<string | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) {
      const status = res.status;
      console.error("AI call failed:", status, await res.text());
      if (status === 429) return "__RATE_LIMITED__";
      if (status === 402) return "__PAYMENT_REQUIRED__";
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) { console.error("AI call error:", e); return null; }
}

function handleAIResult(content: string | null, title: string): { title: string; content: string; status: string } {
  if (content === "__RATE_LIMITED__") return { title, content: "[Sección pendiente — límite de solicitudes.]", status: "rate_limited" };
  if (content === "__PAYMENT_REQUIRED__") return { title, content: "[Sección pendiente — créditos insuficientes.]", status: "payment_required" };
  if (content) return { title, content, status: "generated" };
  return { title, content: "[Error al generar esta sección]", status: "error" };
}

// ═══════════════════════════════════════════════════════════════
// Main handler
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
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    const { analysis_id, calculation_output } = await req.json();
    if (!analysis_id || !calculation_output) throw new Error("analysis_id and calculation_output required");

    const { data: analysis } = await supabase.from("analyses").select("*").eq("id", analysis_id).single();
    if (!analysis || analysis.user_id !== user.id) throw new Error("Not found");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    await supabase.from("analyses").update({ status: "interpretacion_en_curso" }).eq("id", analysis_id);

    // ── Phase 1: Generate all narrative sections (Bloques 3+4) ──
    const sectionsPayload: Record<string, any> = {};
    let executiveSummary = "";

    for (const section of SECTIONS) {
      const sectionData: Record<string, any> = {};
      for (const key of section.dataKeys) {
        if (calculation_output[key] !== undefined) sectionData[key] = calculation_output[key];
      }
      sectionData.companyName = analysis.company_name;
      sectionData.sector = analysis.sector;

      const userPrompt = `Redacta la sección "${section.title}" del informe financiero con estos datos:\n\nEmpresa: ${analysis.company_name}\nSector: ${analysis.sector}\n\nDatos disponibles:\n${JSON.stringify(sectionData, null, 2)}\n\nDevuelve SOLO el texto de la sección.`;

      const content = await callAI(LOVABLE_API_KEY, section.system, userPrompt, section.maxTokens);
      sectionsPayload[section.key] = handleAIResult(content, section.title);
      if (section.key === "executive_summary" && content && content !== "__RATE_LIMITED__" && content !== "__PAYMENT_REQUIRED__") {
        executiveSummary = content;
      }

      await new Promise(r => setTimeout(r, 300));
    }

    // ── Phase 2: Deterministic risk detection (Bloque 5) ──
    const risks = detectRisks(calculation_output);
    const recommendations = generateRecommendations(risks, calculation_output.kpis || {});

    // ── Phase 3: AI narrative for risks ──
    let risksNarrative: any[] = [];
    if (risks.length > 0) {
      const risksPrompt = `Redacta la descripción para cada uno de estos riesgos identificados:\n\n${JSON.stringify(risks.map(r => ({ id: r.id, nombre: r.nombre, categoria: r.categoria, indicador: r.indicador, impacto: r.impacto, probabilidad: r.probabilidad })), null, 2)}`;
      const risksContent = await callAI(LOVABLE_API_KEY, SYSTEM_RISKS_NARRATIVE, risksPrompt, 800);
      if (risksContent && risksContent !== "__RATE_LIMITED__" && risksContent !== "__PAYMENT_REQUIRED__") {
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
      const recsContent = await callAI(LOVABLE_API_KEY, SYSTEM_RECS_NARRATIVE, recsPrompt, 800);
      sectionsPayload["recommendations"] = handleAIResult(recsContent, "Recomendaciones");
      sectionsPayload["recommendations"].recommendations_data = recommendations;
      await new Promise(r => setTimeout(r, 300));
    } else {
      sectionsPayload["recommendations"] = { title: "Recomendaciones", content: "No se generaron recomendaciones bajo el perfil financiero actual.", status: "generated", recommendations_data: [] };
    }

    // ── Phase 5: Conclusion (Bloque 5) ──
    const estado = (calculation_output.kpis?.margenEBITDA > 0 && (calculation_output.kpis?.leverageDeudaEBITDA == null || calculation_output.kpis?.leverageDeudaEBITDA < 3)) ? "sólido" : (calculation_output.kpis?.margenEBITDA < 0 ? "tensionado" : "en transición");

    const conclusionPrompt = `Redacta la conclusión final del informe:\n\nEmpresa: ${analysis.company_name} · Sector: ${analysis.sector}\n\nDiagnóstico:\n  Margen EBITDA: ${calculation_output.kpis?.margenEBITDA?.toFixed(1) || "N/D"}%\n  Enterprise Value: USD ${calculation_output.enterpriseValue ? Math.round(calculation_output.enterpriseValue).toLocaleString() : "N/D"}\n  WACC: ${calculation_output.wacc ? (calculation_output.wacc * 100).toFixed(1) : "N/D"}%\n\nEstado general: ${estado}\nRiesgo principal: ${risks[0]?.nombre || "Ninguno identificado"}\nRecomendación prioritaria: ${recommendations[0]?.titulo || "Ninguna"}\n\nDevuelve SOLO el texto.`;

    const conclusionContent = await callAI(LOVABLE_API_KEY, SYSTEM_CONCLUSION, conclusionPrompt, 800);
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
      enterpriseValue: calculation_output.enterpriseValue,
      equityValue: calculation_output.equityValue,
      wacc: calculation_output.wacc,
      evEbitdaImplied: calculation_output.evEbitdaImplied,
      evRevenueImplied: calculation_output.evRevenueImplied,
      netDebt: calculation_output.netDebt,
      kpis: calculation_output.kpis,
      growth: calculation_output.growth,
      evLow: calculation_output.evLow,
      evHigh: calculation_output.evHigh,
    }, null, 2)}\n\nNARRATIVA COMPLETA POR SECCIÓN:\n${allNarrative}`;

    const auditResult = await callAI(LOVABLE_API_KEY, SYSTEM_AUDITOR, auditPrompt, 1200);
    if (auditResult && auditResult !== "__RATE_LIMITED__" && auditResult !== "__PAYMENT_REQUIRED__") {
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
    await supabase.from("report_narratives").upsert({
      analysis_id,
      executive_summary: executiveSummary,
      sections_payload: sectionsPayload,
      generation_version: "4.0",
      audit_passed: auditPassed,
      audit_notes: auditNotes,
    }, { onConflict: "analysis_id" });

    await supabase.from("analyses").update({
      status: auditPassed ? "informe_generado" : "revision_manual_requerida",
    }).eq("id", analysis_id);

    await supabase.from("audit_events").insert({
      analysis_id,
      event_type: auditPassed ? "narrative_audit_passed" : "narrative_audit_failed",
      event_detail: `Narrativa v4.0: ${Object.keys(sectionsPayload).length} secciones, ${risks.length} riesgos, ${recommendations.length} recomendaciones, auditoría ${auditPassed ? "aprobada" : "fallida"} (score: ${auditScore})`,
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
      },
    });

    // Fire notification — fire and forget
    if (auditPassed) {
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/enviar-notificacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")}` },
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
        version: "4.0",
        sections_count: Object.keys(sectionsPayload).length,
        risks_count: risks.length,
        recommendations_count: recommendations.length,
        timestamp: new Date().toISOString(),
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("generate-narrative error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: "NARRATIVE_ERROR",
        message: error instanceof Error ? error.message : "Error al generar la narrativa.",
      },
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
