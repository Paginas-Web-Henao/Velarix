// Bug 1 (map-accounts) — taxonomía y matcher de cuentas, extraídos de
// map-accounts/index.ts a un módulo puro para poder probarlos con Vitest
// (index.ts importa `serve()` de Deno std y no puede cargarse fuera de
// Deno). Sin cambios de comportamiento salvo la precedencia exact > substring
// corregida en `matchAccount` — ver comentario ahí.

export const TAXONOMY: Record<string, Record<string, string[]>> = {
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

export function normalizeLabel(label: string): string {
  let s = label.toLowerCase().trim();
  s = s.replace(/^\d{4,6}[\s\-\.]+/, "").trim();
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s&/]/g, "").replace(/\s+/g, " ");
}

/**
 * Bug 1: antes, el match exacto y el match por substring se evaluaban
 * sinónimo por sinónimo dentro del mismo recorrido de TAXONOMY, así que
 * un substring de una cuenta definida ANTES en el objeto (p. ej. "ventas"
 * de `revenue`) ganaba sobre el match EXACTO de una cuenta definida
 * DESPUÉS (p. ej. "costo de ventas" de `cost_of_sales`) — "Costo de
 * Ventas" nunca llegaba a evaluarse contra su propio sinónimo exacto.
 *
 * Ahora: PASS 1 recorre TODA la taxonomía buscando únicamente match
 * exacto; solo si ninguna cuenta tiene match exacto, PASS 2 aplica la
 * misma lógica de substring que ya existía. El match exacto gana
 * globalmente, sin importar el orden de definición de TAXONOMY. No se
 * resuelven aquí conflictos entre dos substrings distintos — eso
 * conserva exactamente el comportamiento anterior (primer match por
 * orden de iteración).
 */
export function matchAccount(label: string): { canonical: string | null; category: string; score: number } {
  const normalized = normalizeLabel(label);

  for (const [category, accounts] of Object.entries(TAXONOMY)) {
    for (const [canonical, synonyms] of Object.entries(accounts)) {
      for (const synonym of synonyms) {
        if (normalized === normalizeLabel(synonym)) {
          return { canonical, category, score: 0.95 };
        }
      }
    }
  }

  for (const [category, accounts] of Object.entries(TAXONOMY)) {
    for (const [canonical, synonyms] of Object.entries(accounts)) {
      for (const synonym of synonyms) {
        const normalizedSyn = normalizeLabel(synonym);
        if (normalized.includes(normalizedSyn) || normalizedSyn.includes(normalized)) {
          return { canonical, category, score: 0.82 };
        }
      }
    }
  }

  return { canonical: null, category: "unknown", score: 0.30 };
}
