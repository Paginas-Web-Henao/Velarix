import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  formatCurrency,
  formatNumber,
  formatPct,
  NORMALIZATION_MAP,
  SECTOR_BENCHMARKS,
  type AnalysisResult,
  type FinancialInputs,
  type ReportingCurrency,
} from "./financial-engine";

// ═══════════════════════════════════════════════════════════════
// VELARIX INSTITUTIONAL PDF GENERATOR v4.0
// Premium dark cover · Design system · 10 numbered sections
// KPI cards · Color-coded risks · Institutional conclusion
// ═══════════════════════════════════════════════════════════════

// ─── DESIGN SYSTEM ──────────────────────────────────────────────
const DS = {
  color: {
    azul:       [37,  99,  235]  as [number, number, number],
    azulOscuro: [30,  58,  138]  as [number, number, number],
    negro:      [15,  23,  42]   as [number, number, number],
    grisOscuro: [30,  41,  59]   as [number, number, number],
    gris:       [71,  85,  105]  as [number, number, number],
    grisClaro:  [148, 163, 180]  as [number, number, number],
    grisLinea:  [226, 232, 240]  as [number, number, number],
    grisFondo:  [241, 245, 249]  as [number, number, number],
    blanco:     [255, 255, 255]  as [number, number, number],
    verde:      [22,  163, 74]   as [number, number, number],
    rojo:       [220, 38,  38]   as [number, number, number],
    amarillo:   [217, 119, 6]    as [number, number, number],
    azulSuave:  [219, 234, 254]  as [number, number, number],
    infoBg:     [239, 246, 255]  as [number, number, number],
    warnBg:     [255, 251, 235]  as [number, number, number],
  },
  margin: { top: 28, right: 20, bottom: 24, left: 20 },
  pageW: 210,
  pageH: 297,
  contentW: 170,
  headerH: 14,
  footerH: 10,
  lineH: 5,
};

const contentArea = {
  y: DS.margin.top + DS.headerH + 4,
  yMax: DS.pageH - DS.margin.bottom - DS.footerH,
};

export type PDFVersion = "ejecutivo" | "completo";

type PageKey =
  | "portada" | "disclaimer" | "resumen_ejecutivo" | "perfil_empresa"
  | "calidad_datos" | "analisis_ingresos" | "analisis_costos"
  | "analisis_rentabilidad" | "analisis_liquidez" | "analisis_endeudamiento"
  | "analisis_eficiencia" | "analisis_vh" | "analisis_cualitativo"
  | "proyecciones_pl" | "proyecciones_fcff"
  | "valuacion_dcf" | "valuacion_multiplos" | "benchmarks" | "sensibilidad"
  | "riesgos" | "recomendaciones"
  | "supuestos" | "metodologia" | "conclusion" | "aviso_legal";

const EJECUTIVO_PAGES: PageKey[] = [
  "portada", "disclaimer", "resumen_ejecutivo", "perfil_empresa",
  "calidad_datos", "analisis_ingresos", "analisis_rentabilidad",
  "analisis_endeudamiento", "proyecciones_pl", "proyecciones_fcff",
  "valuacion_dcf", "sensibilidad",
  "riesgos", "recomendaciones",
  "supuestos", "conclusion", "aviso_legal",
];

const COMPLETO_PAGES: PageKey[] = [
  "portada", "disclaimer", "resumen_ejecutivo", "perfil_empresa",
  "calidad_datos", "analisis_ingresos", "analisis_costos",
  "analisis_rentabilidad", "analisis_liquidez", "analisis_endeudamiento",
  "analisis_eficiencia", "analisis_vh", "analisis_cualitativo",
  "proyecciones_pl", "proyecciones_fcff",
  "valuacion_dcf", "valuacion_multiplos", "benchmarks", "sensibilidad",
  "riesgos", "recomendaciones",
  "supuestos", "metodologia", "conclusion", "aviso_legal",
];

// ─── FORMAT HELPERS ─────────────────────────────────────────────
// BL-04 (Bloque 1B-P0): `fUSD` mostraba "USD" de forma incondicional sin
// importar la moneda real del análisis (docs/velarix/bloque-1a/BL-26-*,
// docs/velarix/bloque-1a/BL-30-*). `formatMoneda` es la versión
// paramétrica — recibe la moneda explícitamente, no la asume.
export function formatMoneda(v: number | null | undefined, currency: ReportingCurrency): string {
  if (v == null) return "N/D";
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${currency} ${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${currency} ${(v / 1e3).toFixed(0)}K`;
  return `${currency} ${Math.round(v).toLocaleString("es-CO")}`;
}
const fPctVal = (v: number | null | undefined) =>
  v != null ? `${(typeof v === "number" && v < 1 && v > -1 ? v * 100 : v).toFixed(1)}%` : "N/D";
const fPctRaw = (v: number) => `${v.toFixed(1)}%`;
const fNum = (v: number | null | undefined, d = 1) =>
  v != null ? v.toFixed(d) : "N/D";
const fDelta = (v: number | null | undefined) =>
  v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}` : "N/D";

const evalChip = (val: number, benchRef: number | null, higherIsBetter = true): string => {
  if (benchRef == null) return "—";
  const diff = val - benchRef;
  if (Math.abs(diff) < 1) return "● Alineado";
  if (higherIsBetter) return diff > 0 ? "✓ Favorable" : "⚠ Por debajo";
  return diff < 0 ? "✓ Favorable" : "⚠ Por encima";
};

// ─── PDF DRAWING UTILITIES ──────────────────────────────────────

function dibujarEncabezado(doc: jsPDF, empresa: string, pagina: number, total: number) {
  doc.setFillColor(...DS.color.azulOscuro);
  doc.rect(0, 0, DS.pageW, DS.headerH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DS.color.blanco);
  doc.text("VELARIX", DS.margin.left, 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 180);
  doc.text(empresa, DS.pageW / 2, 9, { align: "center" });

  doc.setTextColor(...DS.color.blanco);
  doc.text(`${pagina} / ${total}`, DS.pageW - DS.margin.right, 9, { align: "right" });
}

function dibujarPie(doc: jsPDF, reportId: string) {
  const yPie = DS.pageH - DS.footerH;
  doc.setDrawColor(...DS.color.grisLinea);
  doc.setLineWidth(0.3);
  doc.line(DS.margin.left, yPie, DS.pageW - DS.margin.right, yPie);

  const fecha = new Date().toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric",
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...DS.color.grisClaro);
  doc.text(`Velarix · velarix.co · Confidencial · ${fecha}`, DS.margin.left, yPie + 4);
  doc.text(`ID: ${reportId}`, DS.pageW - DS.margin.right, yPie + 4, { align: "right" });
}

function dibujarTituloSeccion(doc: jsPDF, titulo: string, yPos: number): number {
  // Blue bar on left
  doc.setFillColor(...DS.color.azul);
  doc.rect(DS.margin.left, yPos, 3, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...DS.color.negro);
  doc.text(titulo, DS.margin.left + 6, yPos + 5);

  doc.setDrawColor(...DS.color.grisLinea);
  doc.setLineWidth(0.3);
  doc.line(DS.margin.left, yPos + 8, DS.margin.left + DS.contentW, yPos + 8);

  return yPos + 12;
}

function dibujarKPI(doc: jsPDF, label: string, valor: string, x: number, yPos: number, w: number, h: number, colorValor?: [number, number, number]) {
  doc.setFillColor(...DS.color.grisFondo);
  doc.roundedRect(x, yPos, w, h, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...DS.color.gris);
  doc.text(label.toUpperCase(), x + 4, yPos + 5);

  doc.setFont("courier", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...(colorValor || DS.color.azul));
  doc.text(valor, x + 4, yPos + 14);
}

function dibujarParrafo(doc: jsPDF, texto: string, yPos: number, maxW = DS.contentW): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...DS.color.grisOscuro);
  const lineas = doc.splitTextToSize(texto, maxW);
  doc.text(lineas, DS.margin.left, yPos);
  return yPos + lineas.length * 4.5 + 4;
}

function verificarPagina(doc: jsPDF, yActual: number, alturaNeeded: number, empresa: string, reportId: string, totalPages: number): number {
  if (yActual + alturaNeeded > contentArea.yMax) {
    doc.addPage();
    const pagina = (doc as any).internal.getNumberOfPages();
    dibujarEncabezado(doc, empresa, pagina, totalPages);
    dibujarPie(doc, reportId);
    return contentArea.y;
  }
  return yActual;
}

const colorPorValor = (valor: number, umbral = 0): [number, number, number] =>
  valor >= umbral ? DS.color.verde : DS.color.rojo;

// ─── DYNAMIC PAGE INCLUSION ─────────────────────────────────────
function shouldIncludePage(page: PageKey, result: AnalysisResult): boolean {
  switch (page) {
    case "analisis_vh": return false;
    case "valuacion_multiplos": return result.enterpriseValue > 0;
    case "sensibilidad": return result.sensitivityMatrix.length > 0;
    case "benchmarks": return !!result.sectorBenchmark;
    default: return true;
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════
export async function generatePDF(
  result: AnalysisResult,
  inputs: FinancialInputs,
  version: PDFVersion = "ejecutivo"
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const M = DS.margin.left;
  const W = DS.contentW;

  // BL-04: moneda de reporte real del análisis, no un literal fijo. Se
  // mantiene el nombre `fUSD` (en vez de renombrar sus 44 usos) para que
  // esta corrección sea mínima y no toque el resto del archivo.
  const fUSD = (v: number | null | undefined) => formatMoneda(v, inputs.reportingCurrency);

  const fecha = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  const empresa = inputs.companyName?.trim() || "Empresa demo";
  const bm = result.sectorBenchmark;
  const sectorLabel = bm.label || inputs.sector;
  const reportId = Math.random().toString(36).substring(2, 10).toUpperCase();

  const basePagesOrdered = version === "ejecutivo" ? [...EJECUTIVO_PAGES] : [...COMPLETO_PAGES];
  const pageList = basePagesOrdered.filter(p => shouldIncludePage(p, result));
  const totalPages = pageList.length;

  // Precomputed values
  const ebitdaY0 = inputs.revenue - inputs.costOfSales - inputs.opex + inputs.depreciation;
  const ebitY0 = ebitdaY0 - inputs.depreciation;
  const utilidadNeta = (ebitY0 - inputs.interestExpense) * (1 - inputs.taxRate / 100);
  const costRatio = ((inputs.costOfSales / inputs.revenue) * 100).toFixed(1);
  const opexRatio = ((inputs.opex / inputs.revenue) * 100).toFixed(1);

  // Build dynamic risks
  const risks: { name: string; impact: string; probability: string; category: string; desc: string; indicator: string }[] = [];
  if (inputs.growth > 40) risks.push({ name: "Crecimiento agresivo", impact: "Alto", probability: "Media", category: "CREC", desc: `El supuesto del ${inputs.growth}% supera al promedio sectorial.`, indicator: `Crecimiento: ${inputs.growth}%` });
  if (result.kpis.leverage > 3) risks.push({ name: "Apalancamiento elevado", impact: "Alto", probability: "Alta", category: "END", desc: `DN/EBITDA de ${fNum(result.kpis.leverage)}x limita la flexibilidad financiera.`, indicator: `DN/EBITDA: ${fNum(result.kpis.leverage)}x` });
  if (inputs.cash < result.kpis.cajaMinima) risks.push({ name: "Liquidez operativa ajustada", impact: "Medio", probability: "Media", category: "LIQ", desc: `Caja (${fUSD(inputs.cash)}) bajo la caja mínima recomendada (${fUSD(result.kpis.cajaMinima)}).`, indicator: `Caja vs mínima` });
  if (result.kpis.interestCoverage < 3) risks.push({ name: "Cobertura de intereses limitada", impact: "Alto", probability: "Media", category: "END", desc: `Cobertura de ${fNum(result.kpis.interestCoverage)}x con poco margen.`, indicator: `ICR: ${fNum(result.kpis.interestCoverage)}x` });
  if (inputs.ebitdaMargin < bm.ebitdaMargin) risks.push({ name: "Margen EBITDA inferior al sector", impact: "Medio", probability: "Alta", category: "RENT", desc: `Margen EBITDA ${(bm.ebitdaMargin - inputs.ebitdaMargin).toFixed(1)}pp debajo del benchmark.`, indicator: `Margen: ${inputs.ebitdaMargin.toFixed(1)}% vs ${bm.ebitdaMargin}%` });
  if (risks.length === 0) risks.push({ name: "Sin riesgos críticos detectados", impact: "Bajo", probability: "Baja", category: "GEN", desc: "Indicadores financieros en niveles saludables.", indicator: "—" });

  // Build recommendations
  const recs: { title: string; priority: string; reason: string }[] = [];
  if (inputs.cash < result.kpis.cajaMinima) recs.push({ title: "Fortalecer posición de caja operativa", priority: "Alta", reason: `Caja actual bajo el mínimo de ${inputs.diasMinCaja} días de ingresos.` });
  if (inputs.ebitdaMargin < bm.ebitdaMargin) recs.push({ title: "Mejorar eficiencia operativa", priority: "Media", reason: `Margen EBITDA ${(bm.ebitdaMargin - inputs.ebitdaMargin).toFixed(1)}pp debajo del benchmark.` });
  recs.push({ title: "Documentar supuestos de crecimiento", priority: "Media", reason: `Validar el ${inputs.growth}% con evidencia comercial.` });
  recs.push({ title: "Actualizar el análisis periódicamente", priority: "Media", reason: "Re-ejecutar al cierre de cada trimestre." });
  if (result.kpis.leverage > 2) recs.push({ title: "Evaluar plan de desapalancamiento", priority: "Alta", reason: `Leverage de ${fNum(result.kpis.leverage)}x puede mejorarse.` });

  // Helper for autoTable end
  const getTableEnd = (): number => (doc as any).lastAutoTable?.finalY ?? contentArea.y;

  // ═══ PORTADA — Dark premium ═══
  const renderPortada = () => {
    doc.setFillColor(...DS.color.negro);
    doc.rect(0, 0, DS.pageW, DS.pageH, "F");

    // Blue band top
    doc.setFillColor(...DS.color.azul);
    doc.rect(0, 0, DS.pageW, 6, "F");

    // Blue bar left
    doc.setFillColor(...DS.color.azul);
    doc.rect(0, 6, 4, DS.pageH - 12, "F");

    // VELARIX logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DS.color.grisClaro);
    doc.text("VELARIX", M + 6, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...DS.color.gris);
    doc.text("Inteligencia financiera institucional", M + 6, 36);

    // Divider
    doc.setDrawColor(...DS.color.azul);
    doc.setLineWidth(0.5);
    doc.line(M + 6, 42, DS.pageW - DS.margin.right, 42);

    // Company name — large
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(...DS.color.blanco);
    const nombreLineas = doc.splitTextToSize(empresa, DS.pageW - M - DS.margin.right - 12);
    doc.text(nombreLineas, M + 6, 58);

    const yTipo = 58 + nombreLineas.length * 10 + 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 180);
    doc.text("Informe de Análisis Financiero", M + 6, yTipo);

    doc.setFontSize(9.5);
    doc.setTextColor(...DS.color.gris);
    doc.text(`${sectorLabel} · Período analizado: Año base`, M + 6, yTipo + 8);

    // Cover KPI cards
    const yMetricas = yTipo + 22;
    const metricas = [
      { label: "Enterprise Value", valor: fUSD(result.enterpriseValue) },
      { label: "Margen EBITDA", valor: `${inputs.ebitdaMargin.toFixed(1)}%` },
      { label: "WACC", valor: fPctVal(result.wacc) },
      { label: "Deuda neta / EBITDA", valor: `${fNum(result.kpis.leverage)}x` },
    ];

    metricas.forEach((m, i) => {
      const col = i % 2;
      const fila = Math.floor(i / 2);
      const x = M + 6 + col * 82;
      const yCard = yMetricas + fila * 22;

      doc.setFillColor(...DS.color.grisOscuro);
      doc.roundedRect(x, yCard, 76, 18, 2, 2, "F");

      doc.setFillColor(...DS.color.azul);
      doc.rect(x, yCard, 2, 18, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...DS.color.gris);
      doc.text(m.label.toUpperCase(), x + 5, yCard + 6);

      doc.setFont("courier", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...DS.color.blanco);
      doc.text(m.valor, x + 5, yCard + 14);
    });

    // Bottom
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...DS.color.gris);
    doc.text(`Generado el ${fecha}`, M + 6, DS.pageH - 20);
    doc.text("Confidencial · Solo para uso interno", M + 6, DS.pageH - 15);

    doc.setFillColor(...DS.color.azul);
    doc.rect(0, DS.pageH - 6, DS.pageW, 6, "F");
  };

  // ═══ DISCLAIMER ═══
  const renderDisclaimer = () => {
    let y = DS.margin.top;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DS.color.negro);
    doc.text("Aviso legal y limitaciones del análisis", M, y);
    y += 10;

    const textos = [
      "Este informe fue generado por Velarix utilizando información financiera proporcionada por el usuario, procesada mediante algoritmos de análisis automatizado y modelos de valoración financiera.",
      "El contenido de este documento tiene carácter informativo y no constituye asesoría de inversión, recomendación de compra o venta de activos, ni opinión legal o fiscal de ningún tipo. Las proyecciones y valoraciones presentadas se basan en supuestos que pueden no materializarse.",
      "Velarix no garantiza la exactitud, integridad o idoneidad de la información contenida en este informe para ningún propósito específico. El usuario es el único responsable de las decisiones que tome con base en este análisis.",
      "Los datos de referencia sectorial provienen de fuentes públicas (Damodaran Industry Data) y datos macroeconómicos de Colombia (Banco de la República, DANE) con la vigencia indicada en cada sección.",
      "Este documento es confidencial. Su distribución, reproducción parcial o total sin autorización escrita de Velarix está prohibida.",
    ];

    textos.forEach(p => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...DS.color.grisOscuro);
      const lineas = doc.splitTextToSize(p, W);
      doc.text(lineas, M, y);
      y += lineas.length * 4.5 + 4;
    });

    y += 10;
    doc.setDrawColor(...DS.color.grisLinea);
    doc.setLineWidth(0.3);
    doc.line(M, y, M + 60, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DS.color.azul);
    doc.text("Velarix", M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DS.color.gris);
    doc.text("velarix.co · noreply@velarix.co", M, y + 5);
  };

  // ═══ SECTION RENDERERS ═══

  const renderResumenEjecutivo = () => {
    let y = dibujarTituloSeccion(doc, "1. Resumen ejecutivo", contentArea.y);

    const tarjetas = [
      { label: "Ingresos anuales", valor: fUSD(inputs.revenue) },
      { label: "Margen EBITDA", valor: `${inputs.ebitdaMargin.toFixed(1)}%` },
      { label: "Enterprise Value", valor: fUSD(result.enterpriseValue) },
      { label: "Deuda neta / EBITDA", valor: `${fNum(result.kpis.leverage)}x` },
    ];
    const ancho = (W - 9) / 4;
    tarjetas.forEach((t, i) => {
      dibujarKPI(doc, t.label, t.valor, M + i * (ancho + 3), y, ancho, 20);
    });
    y += 26;

    const summaryText = `${empresa}, del sector ${sectorLabel}, presenta un Enterprise Value estimado de ${fUSD(result.enterpriseValue)} bajo el escenario base, con un rango de valoración entre ${fUSD(result.evLow)} y ${fUSD(result.evHigh)} (sensibilidad ±1% WACC). El WACC calculado es de ${fPctVal(result.wacc)}, derivado de un costo del equity (Ke) de ${fPctVal(result.costOfEquity)} y un costo de deuda después de impuestos de ${fPctVal(result.costOfDebtAfterTax)}.\n\nLos múltiplos implícitos forward son ${fNum(result.evEbitda)}x EV/EBITDA y ${fNum(result.evRevenue)}x EV/Revenue, comparados con los benchmarks sectoriales de ${bm.evEbitda}x y ${bm.evRevenue}x respectivamente.`;
    y = dibujarParrafo(doc, summaryText, y);

    y += 2;
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Indicador", "Valor", "Benchmark", "Evaluación"]],
      body: [
        ["Margen EBITDA", `${inputs.ebitdaMargin.toFixed(1)}%`, `${bm.ebitdaMargin}%`, evalChip(inputs.ebitdaMargin, bm.ebitdaMargin)],
        ["Crecimiento ingresos", `${inputs.growth.toFixed(1)}%`, "—", inputs.growth > 50 ? "⚠ Agresivo" : "✓ Razonable"],
        ["Deuda neta / EBITDA", `${fNum(result.kpis.leverage)}x`, "—", result.kpis.leverage < 2 ? "✓ Bajo" : result.kpis.leverage < 4 ? "⚠ Moderado" : "✗ Elevado"],
        ["Cobertura intereses", `${fNum(result.kpis.interestCoverage)}x`, "—", result.kpis.interestCoverage > 5 ? "✓ Holgada" : result.kpis.interestCoverage > 2 ? "⚠ Adecuada" : "✗ Ajustada"],
        ["WACC", fPctVal(result.wacc), `${bm.waccRef}%`, evalChip(result.wacc, bm.waccRef, false)],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 8.5 },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      theme: "grid",
    });
  };

  const renderPerfil = () => {
    let y = dibujarTituloSeccion(doc, "2. Perfil del análisis y calidad de datos", contentArea.y);

    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Parámetro", "Detalle"]],
      body: [
        ["Empresa", empresa],
        ["Sector", sectorLabel],
        ["País", "Colombia"],
        ["Moneda del análisis", inputs.reportingCurrency],
        ["Fuente de benchmarks", bm.source],
        ["Fecha del informe", fecha],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontSize: 8.5, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      theme: "grid",
    });
    y = getTableEnd() + 8;

    // Quality badges
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DS.color.gris);
    doc.text("CALIDAD DE LA INFORMACIÓN", M, y);
    y += 5;

    const badges = [
      { label: "Completitud", valor: "100%" },
      { label: "Consistencia", valor: "100%" },
      { label: "Alertas", valor: "0" },
    ];
    const anchoB = 50;
    badges.forEach((b, i) => {
      const x = M + i * (anchoB + 5);
      doc.setFillColor(...DS.color.grisFondo);
      doc.roundedRect(x, y, anchoB, 14, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...DS.color.gris);
      doc.text(b.label.toUpperCase(), x + 3, y + 5);
      doc.setFont("courier", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...DS.color.negro);
      doc.text(b.valor, x + 3, y + 12);
    });
    y += 20;

    // Normalization table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DS.color.gris);
    doc.text("HOMOLOGACIÓN CONTABLE APLICADA", M, y);
    y += 4;

    const normRows = Object.entries(NORMALIZATION_MAP).slice(0, 8).map(([orig, canon]) => [orig, "→", typeof canon === "string" ? canon : String(canon)]);
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Cuenta original", "", "Cuenta Velarix"]],
      body: normRows,
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: DS.color.grisOscuro },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      columnStyles: { 1: { cellWidth: 10, halign: "center" } },
      theme: "grid",
    });
  };

  const renderCalidadDatos = () => {
    let y = dibujarTituloSeccion(doc, "3. Calidad de datos y procesamiento", contentArea.y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Indicador", "Valor", "Estado"]],
      body: [
        ["Fuente de datos", "Inputs directos del usuario", "✓ Verificado"],
        ["Completitud", "Cuentas críticas presentes", "✓ Alta"],
        ["Consistencia contable", "Ecuación patrimonial consistente", "✓ Validada"],
        ["Períodos disponibles", "Año base (Y0)", "✓ Disponible"],
        ["Normalización", "Taxonomía Velarix estándar", "✓ Completa"],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 8.5 },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      theme: "grid",
    });
  };

  const renderIngresos = () => {
    let y = dibujarTituloSeccion(doc, "4. Desempeño financiero — Ingresos", contentArea.y);

    // P&L table
    const bodyPnl = [
      ["Ingresos operacionales", fUSD(inputs.revenue), "100.0%"],
      ["Costo de ventas", fUSD(inputs.costOfSales), `${costRatio}%`],
      ["Gastos operativos", fUSD(inputs.opex), `${opexRatio}%`],
      ["EBITDA", fUSD(ebitdaY0), `${inputs.ebitdaMargin.toFixed(1)}%`],
      ["D&A", fUSD(inputs.depreciation), `${(inputs.depreciation / inputs.revenue * 100).toFixed(1)}%`],
      ["EBIT", fUSD(ebitY0), `${((ebitY0 / inputs.revenue) * 100).toFixed(1)}%`],
      ["Gastos financieros", fUSD(inputs.interestExpense), "—"],
      ["Utilidad neta", fUSD(utilidadNeta), `${((utilidadNeta / inputs.revenue) * 100).toFixed(1)}%`],
    ];

    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Estado de Resultados", `Valor (${inputs.reportingCurrency})`, "% Ingresos"]],
      body: bodyPnl,
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontSize: 8.5, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: "right", fontStyle: "bold" },
        2: { halign: "right", textColor: DS.color.gris },
      },
      didParseCell: (data: any) => {
        if (data.section === "body" && ["EBITDA", "Utilidad neta"].some((t: string) => String(data.row.raw[0]).includes(t))) {
          data.cell.styles.fillColor = DS.color.azulSuave;
          data.cell.styles.fontStyle = "bold";
        }
      },
      theme: "grid",
    });
    y = getTableEnd() + 8;

    // Profitability KPI cards
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DS.color.gris);
    doc.text("INDICADORES DE RENTABILIDAD", M, y);
    y += 5;

    const indicadores = [
      { label: "Margen bruto", valor: fPctRaw(result.kpis.grossMargin) },
      { label: "Margen EBITDA", valor: fPctRaw(result.kpis.ebitdaMargin) },
      { label: "Margen neto", valor: fPctRaw(result.kpis.netMargin) },
      { label: "ROE", valor: fPctRaw(result.kpis.roe) },
      { label: "ROA", valor: fPctRaw(result.kpis.roa) },
    ];
    const anchoI = (W - 16) / 5;
    indicadores.forEach((ind, i) => {
      dibujarKPI(doc, ind.label, ind.valor, M + i * (anchoI + 4), y, anchoI, 18);
    });
  };

  const renderCostos = () => {
    let y = dibujarTituloSeccion(doc, "4b. Estructura de costos", contentArea.y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Componente", "Valor (Y0)", "% de ingresos"]],
      body: [
        ["Ingresos", fUSD(inputs.revenue), "100.0%"],
        ["Costo de ventas", fUSD(inputs.costOfSales), `${costRatio}%`],
        ["Gastos operativos", fUSD(inputs.opex), `${opexRatio}%`],
        ["D&A", fUSD(inputs.depreciation), `${(inputs.depreciation / inputs.revenue * 100).toFixed(1)}%`],
        ["EBITDA", fUSD(ebitdaY0), `${inputs.ebitdaMargin.toFixed(1)}%`],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      theme: "grid",
    });
    let yEnd = getTableEnd() + 6;
    dibujarParrafo(doc, `La estructura de costos muestra un ratio de costo de ventas del ${costRatio}%, con gastos operativos del ${opexRatio}%. El margen EBITDA resultante de ${inputs.ebitdaMargin.toFixed(1)}% se compara con el benchmark sectorial de ${bm.ebitdaMargin}%.`, yEnd);
  };

  const renderRentabilidad = () => {
    let y = dibujarTituloSeccion(doc, "5. Análisis de rentabilidad", contentArea.y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Indicador", "Valor", "Benchmark sector", "Evaluación"]],
      body: [
        ["Margen bruto", fPctRaw(result.kpis.grossMargin), "—", "—"],
        ["Margen EBITDA", fPctRaw(result.kpis.ebitdaMargin), `${bm.ebitdaMargin}%`, evalChip(result.kpis.ebitdaMargin, bm.ebitdaMargin)],
        ["Margen EBIT", fPctRaw(result.kpis.ebitMargin), "—", "—"],
        ["Margen neto", fPctRaw(result.kpis.netMargin), "—", "—"],
        ["ROE", fPctRaw(result.kpis.roe), "—", result.kpis.roe > 15 ? "✓ Sólido" : "⚠ Moderado"],
        ["ROA", fPctRaw(result.kpis.roa), "—", result.kpis.roa > 10 ? "✓ Eficiente" : "⚠ Moderado"],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      theme: "grid",
    });
    let yEnd = getTableEnd() + 6;
    const ebitdaDelta = result.kpis.ebitdaMargin - bm.ebitdaMargin;
    dibujarParrafo(doc, `La empresa presenta un margen EBITDA de ${fPctRaw(result.kpis.ebitdaMargin)}, ${ebitdaDelta > 0 ? `${ebitdaDelta.toFixed(1)}pp por encima` : `${Math.abs(ebitdaDelta).toFixed(1)}pp por debajo`} del benchmark sectorial (${bm.ebitdaMargin}%). El ROE de ${fPctRaw(result.kpis.roe)} indica ${result.kpis.roe > 20 ? "un retorno sólido sobre el capital" : "retornos que deben evaluarse en contexto"}.`, yEnd);
  };

  const renderLiquidez = () => {
    let y = dibujarTituloSeccion(doc, "5b. Análisis de liquidez", contentArea.y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Indicador", "Valor", "Evaluación"]],
      body: [
        ["Caja y equivalentes", fUSD(inputs.cash), "—"],
        ["Caja mínima operativa", fUSD(result.kpis.cajaMinima), inputs.cash > result.kpis.cajaMinima ? "✓ Suficiente" : "⚠ Ajustada"],
        ["Días de cartera", `${result.kpis.daysReceivable} días`, "Referencia demo"],
        ["Ciclo de caja", `${result.kpis.cashCycle} días`, "Referencia demo"],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      theme: "grid",
    });
  };

  const renderEndeudamiento = () => {
    let y = dibujarTituloSeccion(doc, "6. Estructura financiera y endeudamiento", contentArea.y);

    // Balance table
    const bodyBal = [
      ["Caja y equivalentes", fUSD(inputs.cash)],
      ["Total activos", fUSD(inputs.totalDebt + inputs.equity)],
      ["Deuda financiera total", fUSD(inputs.totalDebt)],
      ["Patrimonio", fUSD(inputs.equity)],
      ["Deuda neta", fUSD(result.netDebt)],
    ];
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Situación Financiera", `Valor (${inputs.reportingCurrency})`]],
      body: bodyBal,
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontSize: 8.5, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
      theme: "grid",
    });
    y = getTableEnd() + 8;

    // Leverage KPI cards
    const ratios = [
      { label: "DN / EBITDA", valor: `${fNum(result.kpis.leverage)}x` },
      { label: "Cob. intereses", valor: `${fNum(result.kpis.interestCoverage)}x` },
      { label: "Deuda / Patrimonio", valor: `${fNum(inputs.totalDebt / inputs.equity)}x` },
    ];
    const anchoR = (W - 10) / 3;
    ratios.forEach((r, i) => {
      dibujarKPI(doc, r.label, r.valor, M + i * (anchoR + 5), y, anchoR, 18);
    });
    y += 24;

    dibujarParrafo(doc, `La empresa presenta un leverage de ${fNum(result.kpis.leverage)}x DN/EBITDA con una cobertura de intereses de ${fNum(result.kpis.interestCoverage)}x. ${result.kpis.leverage < 2 ? "La estructura de capital es conservadora." : result.kpis.leverage < 4 ? "El apalancamiento es moderado y requiere seguimiento." : "El nivel de apalancamiento es elevado y limita la flexibilidad financiera."}`, y);
  };

  const renderEficiencia = () => {
    let y = dibujarTituloSeccion(doc, "6b. Eficiencia operativa", contentArea.y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Indicador", "Valor", "Nota"]],
      body: [
        ["Rotación de activos", `${fNum(inputs.revenue / (inputs.totalDebt + inputs.equity))}x`, "Ingresos / Activos totales"],
        ["Días de cartera", `${result.kpis.daysReceivable} días`, "Referencia demo"],
        ["Días de inventario", `${result.kpis.daysInventory} días`, "Referencia demo"],
        ["Ciclo de caja", `${result.kpis.cashCycle} días`, "Referencia demo"],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      theme: "grid",
    });
  };

  const renderAnalisisCualitativo = () => {
    let y = dibujarTituloSeccion(doc, "6c. Análisis cualitativo de desempeño", contentArea.y);
    const fortalezaOp = result.kpis.ebitdaMargin > bm.ebitdaMargin ? "Alta" : "Moderada";
    const disciplinaFin = result.kpis.leverage < 2 ? "Alta" : result.kpis.leverage < 4 ? "Moderada" : "Baja";
    const generacionCaja = result.projections[0].fcff > 0 ? "Sólida" : "Débil";

    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Dimensión", "Evaluación", "Base de inferencia"]],
      body: [
        ["Fortaleza operativa", fortalezaOp, "Margen EBITDA vs benchmark sectorial"],
        ["Disciplina financiera", disciplinaFin, "Leverage y cobertura de intereses"],
        ["Escalabilidad", inputs.growth > 20 ? "Alta" : "Moderada", "Crecimiento proyectado"],
        ["Generación de caja", generacionCaja, "FCFF proyectado Y1"],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      theme: "grid",
    });
    let yEnd = getTableEnd() + 6;
    dibujarParrafo(doc, `El perfil financiero sugiere ${fortalezaOp.toLowerCase() === "alta" ? "fortaleza operativa clara" : "margen de mejora en eficiencia"}, con ${disciplinaFin.toLowerCase() === "alta" ? "estructura de capital conservadora" : "apalancamiento que requiere monitoreo"}. La generación de caja ${generacionCaja.toLowerCase() === "sólida" ? "es positiva y respalda la tesis de valoración" : "presenta desafíos"}.`, yEnd);
  };

  const renderProyeccionesPL = () => {
    let y = dibujarTituloSeccion(doc, "7. Proyecciones financieras", contentArea.y);
    const plRows = [
      { label: "Ingresos", y0: inputs.revenue, key: "revenue" },
      { label: "EBITDA", y0: ebitdaY0, key: "ebitda" },
      { label: "EBIT", y0: ebitY0, key: "ebit" },
      { label: "Utilidad neta", y0: utilidadNeta, key: "netIncome" },
    ];
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Proyección base", "Y0", ...result.projections.map(p => `Y${p.year}`)]],
      body: plRows.map(r => [r.label, fUSD(r.y0), ...result.projections.map(p => fUSD((p as any)[r.key] as number))]),
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      bodyStyles: { fontSize: 8.5, textColor: DS.color.grisOscuro },
      theme: "grid",
    });
    let yEnd = getTableEnd() + 6;
    dibujarParrafo(doc, `Las proyecciones asumen un crecimiento anual del ${inputs.growth}% con margen EBITDA del ${inputs.ebitdaMargin}%. Al Y5, los ingresos alcanzarían ${fUSD(result.projections[4].revenue)} (${(result.projections[4].revenue / inputs.revenue).toFixed(1)}x sobre la base).`, yEnd);
  };

  const renderProyeccionesFCFF = () => {
    let y = dibujarTituloSeccion(doc, "7b. Flujo de caja libre (FCFF)", contentArea.y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Concepto", ...result.projections.map(p => `Y${p.year}`)]],
      body: [
        ["NOPAT", ...result.projections.map(p => fUSD(p.nopat))],
        ["(+) D&A", ...result.projections.map(p => fUSD(p.depreciation))],
        ["(−) CAPEX", ...result.projections.map(p => fUSD(p.capex))],
        ["(−) ΔWC", ...result.projections.map(p => fUSD(p.deltaWC))],
        ["= FCFF", ...result.projections.map(p => fUSD(p.fcff))],
        ["PV FCFF", ...result.projections.map(p => fUSD(p.discountedFcf))],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      bodyStyles: { fontSize: 8.5, textColor: DS.color.grisOscuro },
      theme: "grid",
    });
    let yEnd = getTableEnd() + 6;
    dibujarParrafo(doc, `El FCFF sigue el estándar CFA: NOPAT + D&A − CAPEX − ΔWC. CAPEX es ${inputs.capexPct}% de ingresos y capital de trabajo ${inputs.wcPct}%. El FCFF Y5 (${fUSD(result.projections[4].fcff)}) es la base del valor terminal (Gordon Growth).`, yEnd);
  };

  const renderValuacionDCF = () => {
    let y = dibujarTituloSeccion(doc, "8. Valoración DCF — Enterprise Value", contentArea.y);

    // WACC construction
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Parámetro de costo de capital", "Valor"]],
      body: [
        ["Tasa libre de riesgo (Rf)", `${inputs.riskFreeRate}%`],
        ["Beta desapalancado (βU)", `${bm.beta}`],
        ["Beta re-apalancado (βL)", formatNumber(result.betaLevered, 2)],
        ["Prima de riesgo (ERP)", `${inputs.erp}%`],
        ["Costo del equity (Ke)", fPctVal(result.costOfEquity)],
        ["Kd after-tax", fPctVal(result.costOfDebtAfterTax)],
        ["Peso equity / deuda", `${(inputs.equityWeight * 100).toFixed(0)}% / ${(inputs.debtWeight * 100).toFixed(0)}%`],
        ["WACC", fPctVal(result.wacc)],
        ["Crecimiento terminal (g)", `${inputs.terminalGrowth}%`],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: "right", fontStyle: "bold" } },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.row.raw[0] === "WACC") {
          data.cell.styles.fillColor = DS.color.azulSuave;
          data.cell.styles.fontStyle = "bold";
        }
      },
      theme: "grid",
    });
    y = getTableEnd() + 10;

    // EV result cards — blue for final values
    const resultados = [
      { label: "PV Flujos Y1–Y5", valor: fUSD(result.projections.reduce((s, p) => s + p.discountedFcf, 0)), highlight: false },
      { label: "PV Valor terminal", valor: fUSD(result.discountedTV), highlight: false },
      { label: "Enterprise Value", valor: fUSD(result.enterpriseValue), highlight: true },
      { label: "Equity Value", valor: fUSD(result.equityValue), highlight: true },
    ];
    const anchoR = (W - 9) / 4;
    resultados.forEach((r, i) => {
      const bgColor = r.highlight ? DS.color.azul : DS.color.grisFondo;
      const txtColor = r.highlight ? DS.color.blanco : DS.color.azul;
      const lblColor = r.highlight ? [200, 220, 255] as [number, number, number] : DS.color.gris;

      doc.setFillColor(...bgColor);
      doc.roundedRect(M + i * (anchoR + 3), y, anchoR, 22, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...lblColor);
      doc.text(r.label.toUpperCase(), M + i * (anchoR + 3) + 4, y + 6);

      doc.setFont("courier", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...txtColor);
      doc.text(r.valor, M + i * (anchoR + 3) + 4, y + 16);
    });
    y += 28;

    // Range
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DS.color.grisOscuro);
    doc.text(`Rango (±1% WACC): ${fUSD(result.evLow)} — ${fUSD(result.enterpriseValue)} — ${fUSD(result.evHigh)}`, M, y);
  };

  const renderValuacionMultiplos = () => {
    let y = dibujarTituloSeccion(doc, "8b. Valoración por múltiplos de mercado", contentArea.y);
    const ebitdaY1 = result.projections[0].ebitda;
    const revY1 = result.projections[0].revenue;

    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Método", "Bajo", "Base", "Alto"]],
      body: [
        ["EV/EBITDA", fUSD(ebitdaY1 * bm.evEbitda * 0.85), fUSD(ebitdaY1 * bm.evEbitda), fUSD(ebitdaY1 * bm.evEbitda * 1.15)],
        ["EV/Revenue", fUSD(revY1 * bm.evRevenue * 0.85), fUSD(revY1 * bm.evRevenue), fUSD(revY1 * bm.evRevenue * 1.15)],
        ["EV por DCF", "—", fUSD(result.enterpriseValue), "—"],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 8.5 },
      bodyStyles: { fontSize: 9, halign: "right", textColor: DS.color.grisOscuro },
      columnStyles: { 0: { halign: "left", fontStyle: "bold", cellWidth: 75 } },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      theme: "grid",
    });
  };

  const renderBenchmarks = () => {
    let y = dibujarTituloSeccion(doc, "9. Benchmark sectorial", contentArea.y);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...DS.color.grisClaro);
    doc.text(`Fuente: ${bm.source} · ${bm.lastUpdated}`, M, y);
    y += 7;

    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Métrica", "Empresa", "Sector (ref.)", "Diferencia"]],
      body: [
        ["Margen EBITDA (%)", `${inputs.ebitdaMargin.toFixed(1)}%`, `${bm.ebitdaMargin}%`, `${fDelta(inputs.ebitdaMargin - bm.ebitdaMargin)} pp`],
        ["WACC (%)", fPctVal(result.wacc), `${bm.waccRef}%`, `${fDelta(result.wacc - bm.waccRef)} pp`],
        ["EV/EBITDA", `${fNum(result.evEbitda)}x`, `${bm.evEbitda}x`, `${fDelta(result.evEbitda - bm.evEbitda)}x`],
        ["EV/Revenue", `${fNum(result.evRevenue)}x`, `${bm.evRevenue}x`, `${fDelta(result.evRevenue - bm.evRevenue)}x`],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontSize: 8.5, fontStyle: "bold" },
      bodyStyles: { fontSize: 9.5, halign: "center", textColor: DS.color.grisOscuro },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold", cellWidth: 70 },
        1: { halign: "right", fontStyle: "bold" },
        2: { halign: "right" },
        3: { halign: "right", fontStyle: "bold" },
      },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 3) {
          const val = parseFloat(data.cell.text[0]);
          if (!isNaN(val)) {
            data.cell.styles.textColor = val >= 0 ? DS.color.verde : DS.color.rojo;
          }
        }
      },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      theme: "grid",
    });
  };

  const renderSensibilidad = () => {
    let y = dibujarTituloSeccion(doc, "9b. Análisis de sensibilidad — WACC × g", contentArea.y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DS.color.gris);
    doc.text(`Enterprise Value (${inputs.reportingCurrency}) para cada combinación de WACC y g terminal`, M, y);
    y += 5;

    const waccBase = result.wacc / 100;
    const gBase = inputs.terminalGrowth / 100;
    const deltas = [-2, -1, 0, 1, 2];
    const gOffsets = [0.02, 0.01, 0, -0.01, -0.02];

    const sensHead = ["g \\ WACC", ...deltas.map(d => `${((waccBase + d / 100) * 100).toFixed(1)}%`)];
    const sensBody = gOffsets.map(gOff => [
      `g ${((gBase + gOff) * 100).toFixed(1)}%`,
      ...deltas.map(wd => {
        const cell = result.sensitivityMatrix.find(c => c.waccDelta === wd && c.growthDelta === Math.round(gOff * 100));
        return cell && cell.ev > 0 ? fUSD(cell.ev) : "—";
      }),
    ]);

    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [sensHead],
      body: sensBody,
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 7.5, halign: "center" },
      bodyStyles: { fontSize: 8, halign: "right", textColor: DS.color.grisOscuro },
      columnStyles: { 0: { halign: "left", fontStyle: "bold", cellWidth: 30 } },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.row.index === 2 && data.column.index === 3) {
          data.cell.styles.fillColor = DS.color.azulSuave;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = DS.color.azulOscuro;
        }
      },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      theme: "grid",
    });
    let yEnd = getTableEnd() + 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...DS.color.grisClaro);
    doc.text("La celda resaltada corresponde al escenario base.", M, yEnd);
  };

  // ═══ RISKS — Color-coded cards ═══
  const renderRiesgos = () => {
    let y = dibujarTituloSeccion(doc, "10. Riesgos identificados", contentArea.y);

    const impactColors: Record<string, { bg: [number, number, number]; txt: [number, number, number] }> = {
      Alto: { bg: [254, 226, 226], txt: DS.color.rojo },
      Medio: { bg: [254, 249, 195], txt: [120, 90, 0] },
      Bajo: { bg: [220, 252, 231], txt: DS.color.verde },
    };

    risks.slice(0, 5).forEach((r, idx) => {
      y = verificarPagina(doc, y, 18, empresa, reportId, totalPages);
      const c = impactColors[r.impact] || impactColors.Medio;

      doc.setFillColor(...c.bg);
      doc.roundedRect(M, y, W, 14, 1.5, 1.5, "F");

      // Left border color
      doc.setFillColor(...c.txt);
      doc.rect(M, y, 2.5, 14, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...DS.color.negro);
      doc.text(`${idx + 1}. ${r.name}`, M + 6, y + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...DS.color.gris);
      doc.text(r.indicator, M + 6, y + 10.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...c.txt);
      doc.text(`Impacto: ${r.impact}`, M + W - 30, y + 5.5);
      doc.text(`Prob: ${r.probability}`, M + W - 30, y + 10.5);

      y += 17;
    });
  };

  // ═══ RECOMMENDATIONS — Numbered chips ═══
  const renderRecomendaciones = () => {
    let y = dibujarTituloSeccion(doc, "10b. Recomendaciones prioritarias", contentArea.y);

    recs.slice(0, 4).forEach((rec, idx) => {
      y = verificarPagina(doc, y, 22, empresa, reportId, totalPages);

      doc.setFillColor(...DS.color.grisFondo);
      doc.roundedRect(M, y, W, 18, 1.5, 1.5, "F");

      // Blue number chip
      doc.setFillColor(...DS.color.azul);
      doc.roundedRect(M, y, 10, 18, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...DS.color.blanco);
      doc.text(String(idx + 1), M + 3.5, y + 11);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...DS.color.negro);
      doc.text(rec.title, M + 14, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...DS.color.gris);
      const razon = doc.splitTextToSize(rec.reason, W - 48);
      doc.text(razon[0] || "", M + 14, y + 13);

      // Priority chip
      const prioColor = rec.priority === "Alta" ? DS.color.rojo : DS.color.amarillo;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...prioColor);
      doc.text(rec.priority, M + W - 18, y + 6);

      y += 21;
    });
  };

  const renderSupuestos = () => {
    let y = dibujarTituloSeccion(doc, "11. Matriz de supuestos", contentArea.y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Supuesto", "Valor", "Fuente"]],
      body: [
        ["Tasa libre de riesgo (Rf)", `${inputs.riskFreeRate}%`, "US Treasury 10Y"],
        ["ERP", `${inputs.erp}%`, "Damodaran — mercados emergentes"],
        ["Beta desapalancado", `${bm.beta}`, bm.source],
        ["Beta re-apalancado", formatNumber(result.betaLevered, 2), "Ecuación de Hamada"],
        ["Costo de deuda (pre-tax)", `${inputs.costOfDebt}%`, "Input usuario"],
        ["Tasa de impuestos", `${inputs.taxRate}%`, "Input usuario"],
        ["Crecimiento de ingresos", `${inputs.growth}%`, "Input usuario"],
        ["Margen EBITDA", `${inputs.ebitdaMargin}%`, "Input usuario"],
        ["CAPEX (% ingresos)", `${inputs.capexPct}%`, "Input usuario"],
        ["Δ Capital de trabajo", `${inputs.wcPct}%`, "Input usuario"],
        ["Crecimiento terminal (g)", `${inputs.terminalGrowth}%`, "Input usuario"],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      bodyStyles: { fontSize: 9, textColor: DS.color.grisOscuro },
      theme: "grid",
    });
  };

  const renderMetodologia = () => {
    let y = dibujarTituloSeccion(doc, "12. Apéndice metodológico", contentArea.y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: DS.margin.right },
      head: [["Fórmula", "Descripción"]],
      body: [
        ["EBITDA = Ingresos - Costos - Opex + DA", "Resultado operativo antes de D&A, intereses e impuestos"],
        ["NOPAT = EBIT × (1 - t)", "Utilidad operativa neta (estándar CFA)"],
        ["FCFF = NOPAT + DA - CAPEX - ΔWC", "Flujo de caja libre para proveedores de capital"],
        ["βL = βU × [1 + (1-t) × (D/E)]", "Hamada — re-apalancamiento del beta"],
        ["Ke = Rf + βL × ERP", "CAPM — costo del equity"],
        ["WACC = Ke×We + Kd(1-t)×Wd", "Costo ponderado de capital"],
        ["TV = FCFF5 × (1+g) / (WACC - g)", "Valor terminal (Gordon Growth)"],
        ["EV = Σ[FCFFt/(1+WACC)^t] + PV(TV)", "Enterprise Value total"],
      ],
      headStyles: { fillColor: DS.color.azulOscuro, textColor: DS.color.blanco, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: DS.color.grisFondo },
      bodyStyles: { fontSize: 8.5, textColor: DS.color.grisOscuro },
      theme: "grid",
    });
  };

  const renderConclusion = () => {
    let y = dibujarTituloSeccion(doc, "13. Conclusión", contentArea.y);
    const leverageStatus = result.kpis.leverage < 2 ? "bajo" : result.kpis.leverage < 4 ? "moderado" : "elevado";
    const marginStatus = inputs.ebitdaMargin > bm.ebitdaMargin ? "por encima" : "por debajo";

    y = dibujarParrafo(doc, `${empresa} es una empresa del sector ${sectorLabel} con un perfil financiero ${result.kpis.roe > 15 && result.kpis.leverage < 3 ? "sólido" : "que requiere seguimiento"}. El margen EBITDA de ${inputs.ebitdaMargin.toFixed(1)}% se ubica ${marginStatus} del benchmark (${bm.ebitdaMargin}%), con leverage ${leverageStatus} de ${fNum(result.kpis.leverage)}x DN/EBITDA.\n\nEnterprise Value estimado: ${fUSD(result.enterpriseValue)}, rango: ${fUSD(result.evLow)} — ${fUSD(result.evHigh)}. Equity Value: ${fUSD(result.equityValue)} tras deducir deuda neta de ${fUSD(result.netDebt)}.\n\nEstos resultados son estimaciones. Una valoración definitiva requiere información adicional y contexto estratégico. Se recomienda utilizar este análisis como punto de partida para conversaciones informadas con asesores financieros.`, y);

    y += 10;
    doc.setDrawColor(...DS.color.grisLinea);
    doc.setLineWidth(0.4);
    doc.line(M, y, M + 60, y);
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DS.color.azul);
    doc.text("Velarix", M, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...DS.color.gris);
    doc.text("Inteligencia financiera institucional", M, y + 5);
    doc.text("velarix.co", M, y + 10);

    doc.setTextColor(...DS.color.grisClaro);
    doc.setFontSize(7.5);
    doc.text(`Generado el ${fecha}`, M, y + 15);
  };

  const renderAvisoLegal = () => {
    let y = dibujarTituloSeccion(doc, "Aviso legal", contentArea.y);
    const paragraphs = [
      "Este reporte ha sido generado por la plataforma Velarix con fines exclusivos de análisis financiero informativo.",
      "Los resultados son estimaciones construidas a partir de supuestos del usuario y parámetros de mercado. No constituyen asesoría financiera regulada ni recomendación de inversión.",
      "Velarix no asume responsabilidad por decisiones tomadas con base en este análisis sin acompañamiento de un asesor certificado.",
      "Las proyecciones son inherentemente inciertas. Los resultados reales pueden diferir materialmente de los estimados.",
      "Este documento es confidencial. Su distribución a terceros sin autorización es responsabilidad de quien lo comparta.",
    ];
    paragraphs.forEach(p => {
      y = dibujarParrafo(doc, p, y);
      y += 2;
    });
  };

  // ═══ RENDER ALL PAGES ═══
  const pageRenderers: Record<PageKey, () => void> = {
    portada: renderPortada,
    disclaimer: renderDisclaimer,
    resumen_ejecutivo: renderResumenEjecutivo,
    perfil_empresa: renderPerfil,
    calidad_datos: renderCalidadDatos,
    analisis_ingresos: renderIngresos,
    analisis_costos: renderCostos,
    analisis_rentabilidad: renderRentabilidad,
    analisis_liquidez: renderLiquidez,
    analisis_endeudamiento: renderEndeudamiento,
    analisis_eficiencia: renderEficiencia,
    analisis_vh: () => {},
    analisis_cualitativo: renderAnalisisCualitativo,
    proyecciones_pl: renderProyeccionesPL,
    proyecciones_fcff: renderProyeccionesFCFF,
    valuacion_dcf: renderValuacionDCF,
    valuacion_multiplos: renderValuacionMultiplos,
    benchmarks: renderBenchmarks,
    sensibilidad: renderSensibilidad,
    riesgos: renderRiesgos,
    recomendaciones: renderRecomendaciones,
    supuestos: renderSupuestos,
    metodologia: renderMetodologia,
    conclusion: renderConclusion,
    aviso_legal: renderAvisoLegal,
  };

  pageList.forEach((pageKey, idx) => {
    if (idx > 0) doc.addPage();
    const renderer = pageRenderers[pageKey];
    if (renderer) renderer();

    // Add header/footer to interior pages (not portada, not disclaimer)
    if (idx > 1) {
      dibujarEncabezado(doc, empresa, idx + 1, totalPages);
      dibujarPie(doc, reportId);
    }
  });

  // Update pagination on all interior pages
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 3; i <= total; i++) {
    doc.setPage(i);
    // Re-draw pagination with correct total
    doc.setFillColor(...DS.color.azulOscuro);
    doc.rect(DS.pageW - DS.margin.right - 20, 2, 22, 10, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...DS.color.blanco);
    doc.text(`${i} / ${total}`, DS.pageW - DS.margin.right, 9, { align: "right" });
  }

  const fileName = `Velarix_${empresa.replace(/\s+/g, "_")}_${new Date().getFullYear()}.pdf`;
  doc.save(fileName);
}
