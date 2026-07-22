import { NORMALIZATION_MAP, formatCurrencyFull, type FinancialInputs } from "@/lib/financial-engine";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface Props {
  inputs: FinancialInputs;
}

const DemoNormalization = ({ inputs }: Props) => {
  const ebitda = inputs.revenue - inputs.costOfSales - inputs.opex + inputs.depreciation;
  const ebit = ebitda - inputs.depreciation;

  const validationItems = [
    { label: "Ingresos validados", ok: inputs.revenue > 0 },
    { label: "EBITDA calculado", ok: true, value: formatCurrencyFull(ebitda) },
    { label: "Estructura financiera mapeada", ok: inputs.totalDebt >= 0 && inputs.equity > 0 },
    { label: "Supuestos listos para motor", ok: true },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Mapping table */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Homologación de cuentas</h3>
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-muted-foreground text-xs border-b border-border">
              <th className="text-left py-2 pr-4">Cuenta original</th>
              <th className="w-8"></th>
              <th className="text-left py-2">Cuenta normalizada Velarix</th>
            </tr>
          </thead>
          <tbody>
            {NORMALIZATION_MAP.map((row) => (
              <tr key={row.normalized} className="border-b border-border/20">
                <td className="py-2.5 pr-4 text-muted-foreground text-xs">{row.original}</td>
                <td className="py-2.5"><ArrowRight size={12} className="text-primary" /></td>
                <td className="py-2.5 text-foreground font-semibold text-xs">{row.normalized}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Values mapped */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Valores normalizados (Año base)</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Ingresos", value: inputs.revenue },
            { label: "Costos", value: inputs.costOfSales },
            { label: "Opex", value: inputs.opex },
            { label: "Depreciación", value: inputs.depreciation },
            { label: "EBITDA", value: ebitda },
            { label: "EBIT", value: ebit },
            { label: "Deuda", value: inputs.totalDebt },
            { label: "Caja", value: inputs.cash },
            { label: "Patrimonio", value: inputs.equity },
            { label: "Intereses", value: inputs.interestExpense },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center px-3 py-2 rounded bg-background/50">
              <span className="font-body text-xs text-muted-foreground">{item.label}</span>
              <span className="font-body text-sm text-foreground font-semibold">{formatCurrencyFull(item.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Validation */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Estado de validación</h3>
        <div className="space-y-3">
          {validationItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <CheckCircle2 size={16} className={item.ok ? "text-primary" : "text-muted-foreground"} />
              <span className="font-body text-sm text-foreground">{item.label}</span>
              {item.value && <span className="font-body text-xs text-muted-foreground ml-auto">{item.value}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemoNormalization;
