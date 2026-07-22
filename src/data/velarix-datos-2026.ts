// src/data/velarix-datos-2026.ts
// Fuentes: Damodaran Jan 2026 · Banrep · DANE · US Treasury
// Fecha de referencia: 22 marzo 2026
// *** FUENTE ÚNICA DE DATOS — toda la app importa de aquí ***

// ─── MACRO COLOMBIA ─────────────────────────────────────────────────────────

export interface MacroParameter {
  label: string;
  fuente: string;
  frecuencia: string;
  ultimaActualizacion: string;
  proximaActualizacion: string;
  valorActual: number;
  unidad: string;
  datos: { periodo: string; valor: number }[];
}

export const MACRO_COLOMBIA: Record<string, MacroParameter> = {
  inflacion_ipc: {
    label: "Inflación IPC (%)",
    fuente: "DANE",
    frecuencia: "mensual",
    ultimaActualizacion: "2026-02-28",
    proximaActualizacion: "2026-03-31",
    valorActual: 3.88,
    unidad: "%",
    datos: [
      { periodo: "2020", valor: 1.61 },
      { periodo: "2021", valor: 5.62 },
      { periodo: "2022", valor: 13.12 },
      { periodo: "2023", valor: 9.28 },
      { periodo: "2024", valor: 5.20 },
      { periodo: "Ene 2025", valor: 5.22 },
      { periodo: "Jun 2025", valor: 4.71 },
      { periodo: "Dic 2025", valor: 4.00 },
      { periodo: "Ene 2026", valor: 3.95 },
      { periodo: "Feb 2026", valor: 3.88 },
    ],
  },
  tasa_politica: {
    label: "Tasa política monetaria (%)",
    fuente: "Banco de la República",
    frecuencia: "mensual",
    ultimaActualizacion: "2026-03-15",
    proximaActualizacion: "2026-04-30",
    valorActual: 7.50,
    unidad: "%",
    datos: [
      { periodo: "2020", valor: 1.75 },
      { periodo: "2021", valor: 3.00 },
      { periodo: "2022", valor: 12.00 },
      { periodo: "2023", valor: 13.25 },
      { periodo: "Mar 2024", valor: 12.25 },
      { periodo: "Sep 2024", valor: 10.25 },
      { periodo: "Dic 2024", valor: 9.50 },
      { periodo: "Jun 2025", valor: 8.50 },
      { periodo: "Dic 2025", valor: 8.00 },
      { periodo: "Ene 2026", valor: 7.75 },
      { periodo: "Mar 2026", valor: 7.50 },
    ],
  },
  trm: {
    label: "TRM COP/USD (promedio mensual)",
    fuente: "Banco de la República",
    frecuencia: "mensual",
    ultimaActualizacion: "2026-03-01",
    proximaActualizacion: "2026-04-01",
    valorActual: 4080,
    unidad: "COP/USD",
    datos: [
      { periodo: "2020", valor: 3693 },
      { periodo: "2021", valor: 3744 },
      { periodo: "2022", valor: 4255 },
      { periodo: "2023", valor: 4326 },
      { periodo: "2024", valor: 4166 },
      { periodo: "Mar 2025", valor: 4220 },
      { periodo: "Jun 2025", valor: 4120 },
      { periodo: "Sep 2025", valor: 4040 },
      { periodo: "Dic 2025", valor: 3985 },
      { periodo: "Ene 2026", valor: 4050 },
      { periodo: "Feb 2026", valor: 4080 },
    ],
  },
  pib: {
    label: "Crecimiento PIB real (%)",
    fuente: "DANE",
    frecuencia: "trimestral",
    ultimaActualizacion: "2026-02-28",
    proximaActualizacion: "2026-05-31",
    valorActual: 2.8,
    unidad: "%",
    datos: [
      { periodo: "2020", valor: -7.0 },
      { periodo: "2021", valor: 10.6 },
      { periodo: "2022", valor: 7.3 },
      { periodo: "2023", valor: 0.6 },
      { periodo: "2024 Q1", valor: 1.2 },
      { periodo: "2024 Q2", valor: 1.5 },
      { periodo: "2024 Q3", valor: 1.8 },
      { periodo: "2024 Q4", valor: 2.1 },
      { periodo: "2025 Q1", valor: 2.3 },
      { periodo: "2025 Q2", valor: 2.5 },
      { periodo: "2025 Q3", valor: 2.7 },
      { periodo: "2025 Q4", valor: 2.8 },
    ],
  },
};

// ─── MERCADO GLOBAL ─────────────────────────────────────────────────────────

export interface MarketParameter {
  label: string;
  fuente: string;
  frecuencia: string;
  ultimaActualizacion: string;
  proximaActualizacion: string;
  valorActual: number;
  unidad: string;
}

export const MERCADO_GLOBAL: Record<string, MarketParameter> = {
  risk_free_rate: {
    label: "Tasa libre de riesgo (US Treasury 10Y)",
    fuente: "US Treasury / FRED",
    frecuencia: "mensual",
    ultimaActualizacion: "2026-03-01",
    proximaActualizacion: "2026-04-01",
    valorActual: 4.35,
    unidad: "%",
  },
  erp_emergentes: {
    label: "Equity Risk Premium — mercados emergentes",
    fuente: "Damodaran Country Risk Premium",
    frecuencia: "trimestral",
    ultimaActualizacion: "2026-01-15",
    proximaActualizacion: "2026-04-15",
    valorActual: 5.80,
    unidad: "%",
  },
  embi_colombia: {
    label: "Prima de riesgo país Colombia (EMBI)",
    fuente: "JP Morgan EMBI · Banrep",
    frecuencia: "semanal",
    ultimaActualizacion: "2026-03-20",
    proximaActualizacion: "2026-03-27",
    valorActual: 2.20,
    unidad: "%",
  },
};

// ─── DAMODARAN 2026 — 15 SECTORES COLOMBIA ──────────────────────────────────

export interface SectorData {
  label: string;
  beta_unlevered: number;
  ev_ebitda: number;
  ev_revenue: number;
  ebitda_margin: number;
  wacc_ref: number;
  fuente: string;
  vigente_hasta: string;
}

export const SECTOR_BENCHMARKS_2026: Record<string, SectorData> = {
  "software-tecnologia": {
    label: "Software / Tecnología",
    beta_unlevered: 1.22, ev_ebitda: 13.0, ev_revenue: 4.8,
    ebitda_margin: 26.0, wacc_ref: 11.2,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "retail-comercio": {
    label: "Retail / Comercio",
    beta_unlevered: 1.08, ev_ebitda: 9.5, ev_revenue: 2.2,
    ebitda_margin: 18.5, wacc_ref: 10.2,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "servicios-empresariales": {
    label: "Servicios empresariales",
    beta_unlevered: 0.98, ev_ebitda: 10.5, ev_revenue: 2.6,
    ebitda_margin: 20.5, wacc_ref: 9.6,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "manufactura": {
    label: "Manufactura",
    beta_unlevered: 1.18, ev_ebitda: 8.5, ev_revenue: 1.9,
    ebitda_margin: 16.5, wacc_ref: 10.6,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "consumo-consumer": {
    label: "Consumo / Consumer Products",
    beta_unlevered: 0.93, ev_ebitda: 11.5, ev_revenue: 3.1,
    ebitda_margin: 22.5, wacc_ref: 9.1,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "alimentos-bebidas": {
    label: "Alimentos y bebidas",
    beta_unlevered: 0.78, ev_ebitda: 10.5, ev_revenue: 2.3,
    ebitda_margin: 18.5, wacc_ref: 9.1,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "agroindustria": {
    label: "Agroindustria",
    beta_unlevered: 0.83, ev_ebitda: 8.5, ev_revenue: 1.6,
    ebitda_margin: 15.5, wacc_ref: 9.6,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "salud": {
    label: "Salud",
    beta_unlevered: 0.88, ev_ebitda: 11.5, ev_revenue: 2.9,
    ebitda_margin: 20.5, wacc_ref: 9.6,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "educacion": {
    label: "Educación",
    beta_unlevered: 0.73, ev_ebitda: 9.5, ev_revenue: 2.1,
    ebitda_margin: 18.5, wacc_ref: 8.6,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "transporte-logistica": {
    label: "Transporte y logística",
    beta_unlevered: 1.03, ev_ebitda: 8.5, ev_revenue: 1.7,
    ebitda_margin: 14.5, wacc_ref: 10.1,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "construccion-infraestructura": {
    label: "Construcción e infraestructura",
    beta_unlevered: 1.13, ev_ebitda: 7.5, ev_revenue: 1.5,
    ebitda_margin: 13.5, wacc_ref: 10.6,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "energia-utilities": {
    label: "Energía y utilities",
    beta_unlevered: 0.52, ev_ebitda: 9.5, ev_revenue: 3.1,
    ebitda_margin: 36.0, wacc_ref: 8.1,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "turismo-hospitalidad": {
    label: "Turismo y hospitalidad",
    beta_unlevered: 1.28, ev_ebitda: 9.5, ev_revenue: 2.1,
    ebitda_margin: 16.5, wacc_ref: 11.1,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "inmobiliario": {
    label: "Inmobiliario",
    beta_unlevered: 0.68, ev_ebitda: 13.5, ev_revenue: 5.2,
    ebitda_margin: 41.0, wacc_ref: 8.6,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
  "financiero-seguros": {
    label: "Financiero / Seguros",
    beta_unlevered: 0.83, ev_ebitda: 10.5, ev_revenue: 3.6,
    ebitda_margin: 31.0, wacc_ref: 9.1,
    fuente: "Damodaran Jan 2026", vigente_hasta: "2026-12-31",
  },
};

// ─── VALORES POR DEFECTO DEL MOTOR DE CÁLCULO ──────────────────────────────

export const DEFAULTS_MOTOR = {
  rf_rate: MERCADO_GLOBAL.risk_free_rate.valorActual,     // 4.35%
  erp: MERCADO_GLOBAL.erp_emergentes.valorActual,         // 5.80%
  tax_rate: 35,       // Impuesto corporativo Colombia 2025-2026
  equity_weight: 0.70,
  debt_weight: 0.30,
  cost_debt: 8.0,
  terminal_growth: 3.0,
  capex_pct: 5.0,
  wc_pct: 3.0,
  horizonte: 5,
};

// ─── MAPEO SECTOR SLUG → LABEL (para el motor de cálculo) ──────────────────

export function getSectorLabel(slugOrLabel: string): string {
  // If it's already a label, return it
  const bySlug = SECTOR_BENCHMARKS_2026[slugOrLabel];
  if (bySlug) return bySlug.label;
  // If it's a label, find it
  const entry = Object.values(SECTOR_BENCHMARKS_2026).find(s => s.label === slugOrLabel);
  return entry?.label || slugOrLabel;
}

export function getSectorByLabel(label: string): SectorData | undefined {
  return Object.values(SECTOR_BENCHMARKS_2026).find(s => s.label === label);
}

export function getSectorBySlug(slug: string): SectorData | undefined {
  return SECTOR_BENCHMARKS_2026[slug];
}
