// Fila de `analyses` para un caso NUEVO. Un caso nuevo no introduce
// Judgment: `expected_growth` se guarda explícitamente como `null`
// ("pendiente"), nunca el 25 del DEFAULT de la columna ni de la UI, y la
// metadata del caso vacía queda `null` (no se inventa).
import type { TablesInsert } from "@/integrations/supabase/types";

export interface NewCaseForm {
  userId: string;
  company: string;
  sector: string;
  moneda: string;
  valuationDate: string;
  basePeriod: string;
  basisOfValue: string;
  valuedInterest: string;
  calculationArchitecture: string;
}

const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

export function buildNewCaseRow(f: NewCaseForm): TablesInsert<"analyses"> {
  return {
    user_id: f.userId,
    company_name: f.company.trim(),
    sector: f.sector,
    moneda_analisis: f.moneda,
    status: "creado",
    expected_growth: null,
    valuation_date: orNull(f.valuationDate),
    base_period: orNull(f.basePeriod),
    basis_of_value: orNull(f.basisOfValue),
    valued_interest: orNull(f.valuedInterest),
    calculation_architecture: orNull(f.calculationArchitecture),
  };
}
