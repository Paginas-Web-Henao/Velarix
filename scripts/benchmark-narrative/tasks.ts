// Snapshot de los prompts/lógica productivos de
// supabase/functions/generate-narrative/index.ts en HEAD c34f964 (FASE
// 1E/Subbloque 2, Paso 1). NO se importa ese archivo directamente — tiene
// un `serve()` de Deno top-level e imports por URL (deno.land, esm.sh)
// incompatibles con Node/tsx, el mismo motivo por el que
// scripts/benchmark-ai/runner.test.ts snapshotea en vez de importar
// parse-document/index.ts.
//
// Lo que SÍ se importa (no se duplica) es la lógica pura de
// `_shared/narrative-calculation-adapter.ts` — `mapCalculationResultToNarrativeViewModel`
// y `detectRisks` son las funciones REALES que generate-narrative/index.ts
// usa para construir el view model y los riesgos; este harness nunca
// reimplementa esa parte.
//
// Solo se snapshotea lo que vive INLINE en generate-narrative/index.ts:
// los 5 system prompts, los `dataKeys` de cada sección, la plantilla de
// userPrompt, la función `generateRecommendations`/`recMap`, y la
// derivación de `estado`. Ver ./tasks.test.ts para el chequeo estático que
// detecta divergencia de las reglas críticas frente al archivo real.

import {
  mapCalculationResultToNarrativeViewModel,
  detectRisks,
  type NarrativeCalculationViewModel,
  type NarrativeRisk,
} from "../../supabase/functions/_shared/narrative-calculation-adapter.ts";
import type { BenchmarkTask } from "./types.ts";
import type { NarrativeFixture, AuditNarrativeBundleVariants } from "./fixtures.ts";

// ── SYSTEM_BASE — idéntico a generate-narrative/index.ts línea 31 ──
export const SYSTEM_BASE = `Eres el analista financiero senior de Velarix, una plataforma de inteligencia financiera institucional para empresas colombianas.

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

export interface SectionTaskDefinition {
  key: "executive_summary" | "profitability_analysis" | "valuation_analysis";
  title: string;
  system: string;
  dataKeys: (keyof NarrativeCalculationViewModel)[];
  maxTokens: number;
}

// ── Snapshot exacto de SECTIONS (solo las 3 secciones usadas por este benchmark — generate-narrative/index.ts líneas 50-157) ──
export const SECTION_TASKS: readonly SectionTaskDefinition[] = [
  {
    key: "executive_summary",
    title: "Resumen Ejecutivo",
    system: `${SYSTEM_BASE}\n\nTu función es redactar el resumen ejecutivo del informe. Esta es la sección más importante: debe permitir entender completamente el caso sin leer el resto.\n\nEstructura obligatoria:\n  Párrafo 1: Diagnóstico general de la empresa\n  Párrafo 2: Principales fortalezas (máximo 2, con dato)\n  Párrafo 3: Principales debilidades o riesgos (máximo 2, con dato)\n  Párrafo 4: Resultado de valoración (si existe) — EV, rango, WACC\n  Párrafo 5: Recomendación ejecutiva de cierre\n\nExtensión: 5 párrafos · 250–400 palabras`,
    dataKeys: ["enterpriseValue", "equityValue", "wacc", "costOfEquity", "betaLevered", "evEbitda", "evRevenue", "netDebt", "evLow", "evHigh", "kpis", "growth"],
    maxTokens: 800,
  },
  {
    key: "profitability_analysis",
    title: "Análisis de Rentabilidad",
    system: `${SYSTEM_BASE}\n\nRedacta el análisis de rentabilidad.\n  Párrafo 1: Dato — márgenes actuales (bruto, EBITDA, neto)\n  Párrafo 2: Interpretación — capacidad de captura de valor\n  Párrafo 3: Comparación sectorial (si benchmark disponible)\n  Párrafo 4: ROE y ROA (si disponibles)\nExtensión: 3–4 párrafos · 150–200 palabras\nSi márgenes negativos: "la empresa registra pérdidas operativas en el período analizado".\nPara la comparación sectorial, compara ÚNICAMENTE métricas donde exista tanto el valor de la empresa (kpis) como el de referencia (sectorBenchmark) — p.ej. kpis.ebitdaMargin vs sectorBenchmark.ebitdaMargin. sectorBenchmark no incluye referencia de ROE ni ROA: no compares esas dos métricas contra el sector.\nSi benchmark no disponible: omitir comparación sin mencionarla.`,
    dataKeys: ["kpis", "sectorBenchmark"],
    maxTokens: 500,
  },
  {
    key: "valuation_analysis",
    title: "Valoración por DCF",
    system: `${SYSTEM_BASE}\n\nRedacta la sección de valoración por DCF.\n  Párrafo 1: Componentes del WACC — describe ÚNICAMENTE los componentes presentes en los datos entregados (wacc, costOfEquity, costOfDebtAfterTax si está disponible, betaLevered). No reconstruyas ni infieras pesos de capital (equity/deuda), tasas o supuestos que no te fueron entregados.\n  Párrafo 2: Resultado — EV, equity value, rango\n  Párrafo 3: Composición del valor — cita terminalValue/discountedTV y el enterpriseValue si están disponibles\n  Párrafo 4: Interpretación ejecutiva — qué sostiene el valor y sensibilidad\nExtensión: 4–5 párrafos · 200–250 palabras\n\nDescribe el peso del valor terminal (discountedTV) frente al Enterprise Value únicamente a partir de los datos entregados. No afirmes que domina salvo que los datos lo sustenten. No calcules ni menciones un porcentaje/participación que no te fue entregado explícitamente.\nSiempre menciona el rango, no solo el punto central.`,
    dataKeys: ["enterpriseValue", "equityValue", "wacc", "costOfEquity", "costOfDebtAfterTax", "discountedTV", "evEbitda", "evRevenue", "terminalValue", "betaLevered", "netDebt", "evLow", "evHigh", "projections"],
    maxTokens: 700,
  },
];

// ── SYSTEM_CONCLUSION — idéntico a generate-narrative/index.ts línea 239 ──
export const SYSTEM_CONCLUSION = `${SYSTEM_BASE}

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

export const CONCLUSION_MAX_TOKENS = 800;

// ── SYSTEM_AUDITOR — idéntico a generate-narrative/index.ts línea 262 ──
export const SYSTEM_AUDITOR = `Eres el auditor de consistencia narrativa de Velarix. Recibes el informe financiero completo y el output numérico del análisis. Verifica que la narrativa sea matemática y lógicamente consistente.

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

export const AUDIT_MAX_TOKENS = 1200;

// ── generateRecommendations/recMap — snapshot de generate-narrative/index.ts líneas 185-210 ──
interface RecommendationRule {
  titulo: string;
  razon: string;
  impacto_esperado: string;
  prioridad: "Alta" | "Media" | "Baja";
}

const REC_MAP: Record<string, RecommendationRule> = {
  END_001: { titulo: "Gestionar activamente el nivel de endeudamiento", razon: "Deuda neta/EBITDA supera 3.0x.", impacto_esperado: "Mayor flexibilidad financiera.", prioridad: "Alta" },
  END_002: { titulo: "Revisar la estructura de deuda para mejorar cobertura de intereses", razon: "Cobertura de intereses insuficiente.", impacto_esperado: "Menor riesgo de incumplimiento en servicio de deuda.", prioridad: "Alta" },
  RENT_001: { titulo: "Implementar plan de recuperación de rentabilidad operativa", razon: "Pérdidas a nivel EBITDA comprometen la viabilidad del modelo.", impacto_esperado: "Retorno a márgenes operativos positivos.", prioridad: "Alta" },
  RENT_003: { titulo: "Revisar carga financiera y fiscal", razon: "EBITDA positivo pero resultado neto negativo indica presión financiera o fiscal.", impacto_esperado: "Mejora del resultado neto disponible.", prioridad: "Media" },
  CREC_001: { titulo: "Construir escenarios con crecimientos más conservadores", razon: "El supuesto de crecimiento es agresivo y la valoración es altamente sensible.", impacto_esperado: "Mejor gestión de expectativas con inversionistas.", prioridad: "Media" },
  VAL_001: { titulo: "Revisar supuestos operativos del modelo de valoración", razon: "EV negativo sugiere que los supuestos actuales no generan valor.", impacto_esperado: "Modelo de valoración con supuestos más realistas.", prioridad: "Alta" },
  VAL_002: { titulo: "Comunicar el rango de valoración con sus supuestos", razon: "Alta dispersión del EV según sensibilidad.", impacto_esperado: "Mejor comunicación del rango creíble.", prioridad: "Media" },
};

export function generateRecommendations(risks: readonly NarrativeRisk[]): Array<RecommendationRule & { numero: number; riesgo_origen: string; categoria: string }> {
  const recs: Array<RecommendationRule & { numero: number; riesgo_origen: string; categoria: string }> = [];
  risks.forEach((risk, i) => {
    const rec = REC_MAP[risk.id];
    if (rec) recs.push({ numero: i + 1, ...rec, riesgo_origen: risk.id, categoria: risk.categoria });
  });
  const pOrder: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 };
  recs.sort((a, b) => pOrder[a.prioridad] - pOrder[b.prioridad]);
  return recs.slice(0, 6);
}

/** Snapshot de la derivación de `estado` — generate-narrative/index.ts línea 441. */
export function deriveEstado(vm: NarrativeCalculationViewModel): "sólido" | "tensionado" | "en transición" {
  return (vm.kpis.ebitdaMargin > 0 && (vm.kpis.leverage == null || vm.kpis.leverage < 3)) ? "sólido" : (vm.kpis.ebitdaMargin < 0 ? "tensionado" : "en transición");
}

/** Construye el view model REAL a partir del fixture — reutiliza la función de producción, no la reimplementa. */
export function buildViewModel(fixture: NarrativeFixture): NarrativeCalculationViewModel {
  return mapCalculationResultToNarrativeViewModel(fixture.calculationResult);
}

export interface TaskInput {
  task: BenchmarkTask;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}

/** Plantilla de userPrompt de las secciones genéricas — idéntica a generate-narrative/index.ts línea 387. */
function buildSectionUserPrompt(title: string, companyName: string, sector: string, sectionData: Record<string, unknown>): string {
  return `Redacta la sección "${title}" del informe financiero con estos datos:\n\nEmpresa: ${companyName}\nSector: ${sector}\n\nDatos disponibles:\n${JSON.stringify(sectionData, null, 2)}\n\nDevuelve SOLO el texto de la sección.`;
}

function pickDataKeys(vm: NarrativeCalculationViewModel, keys: readonly (keyof NarrativeCalculationViewModel)[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (vm[key] !== undefined) out[key] = vm[key];
  }
  return out;
}

const SECTOR_BY_FIXTURE_DEFAULT = "Sector sintético de benchmark";

/**
 * Construye systemPrompt/userPrompt/maxTokens EXACTAMENTE como producción
 * construiría la evidencia de cada tarea — sin ampliar el contexto para
 * hacer el benchmark artificialmente más fácil. `auditVariant` solo aplica
 * a `narrative_audit` (default "clean").
 */
export function buildTaskInput(
  task: BenchmarkTask,
  fixture: NarrativeFixture,
  auditVariant: keyof AuditNarrativeBundleVariants = "clean",
): TaskInput {
  const vm = buildViewModel(fixture);
  const sector = fixture.calculationResult.source_input_snapshot.sector ?? SECTOR_BY_FIXTURE_DEFAULT;

  if (task === "conclusion") {
    const risks = detectRisks(vm);
    const recommendations = generateRecommendations(risks);
    const estado = deriveEstado(vm);
    const conclusionPrompt = `Redacta la conclusión final del informe:\n\nEmpresa: ${fixture.companyName} · Sector: ${sector}\n\nDiagnóstico:\n  Margen EBITDA: ${vm.kpis.ebitdaMargin?.toFixed(1) ?? "N/D"}%\n  Enterprise Value: ${vm.moneda} ${vm.enterpriseValue != null ? Math.round(vm.enterpriseValue).toLocaleString() : "N/D"}\n  WACC: ${vm.wacc != null ? vm.wacc.toFixed(1) : "N/D"}%\n\nEstado general: ${estado}\nRiesgo principal: ${risks[0]?.nombre || "Ninguno identificado"}\nRecomendación prioritaria: ${recommendations[0]?.titulo || "Ninguna"}\n\nDevuelve SOLO el texto.`;
    return { task, systemPrompt: SYSTEM_CONCLUSION, userPrompt: conclusionPrompt, maxTokens: CONCLUSION_MAX_TOKENS };
  }

  if (task === "narrative_audit") {
    const groundTruth = {
      enterpriseValue: vm.enterpriseValue, equityValue: vm.equityValue, wacc: vm.wacc,
      evEbitda: vm.evEbitda, evRevenue: vm.evRevenue, netDebt: vm.netDebt,
      kpis: vm.kpis, growth: vm.growth, evLow: vm.evLow, evHigh: vm.evHigh,
    };
    const allNarrative = fixture.auditNarrativeBundle[auditVariant];
    const auditPrompt = `Audita este informe financiero.\n\nDATOS CALCULADOS (ground truth):\n${JSON.stringify(groundTruth, null, 2)}\n\nNARRATIVA COMPLETA POR SECCIÓN:\n${allNarrative}`;
    return { task, systemPrompt: SYSTEM_AUDITOR, userPrompt: auditPrompt, maxTokens: AUDIT_MAX_TOKENS };
  }

  const section = SECTION_TASKS.find((s) => s.key === task);
  if (!section) throw new Error(`tarea desconocida: ${task}`);
  const sectionData = pickDataKeys(vm, section.dataKeys);
  sectionData.companyName = fixture.companyName;
  sectionData.sector = sector;
  const userPrompt = buildSectionUserPrompt(section.title, fixture.companyName, sector, sectionData);
  return { task, systemPrompt: section.system, userPrompt, maxTokens: section.maxTokens };
}
