import { useEffect, type Dispatch, type SetStateAction } from "react";
import { SECTOR_KEYS, SECTOR_BENCHMARKS, DEFAULT_INPUTS, type FinancialInputs } from "@/lib/financial-engine";
import { RotateCcw } from "lucide-react";

interface Props {
  inputs: FinancialInputs;
  setInputs: Dispatch<SetStateAction<FinancialInputs>>;
  onRun: () => void;
}

const DemoInputsForm = ({ inputs, setInputs, onRun }: Props) => {
  const update = (field: keyof FinancialInputs, value: string | number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const bm = SECTOR_BENCHMARKS[inputs.sector];
    if (bm) {
      setInputs((prev) => ({ ...prev }));
    }
  }, [inputs.sector]);

  const handleReset = () => {
    setInputs({ ...DEFAULT_INPUTS });
  };

  const numField = (label: string, field: keyof FinancialInputs, hint?: string) => (
    <div>
      <label className="font-body text-xs text-muted-foreground block mb-1">{label}</label>
      <input
        type="number"
        value={inputs[field] as number}
        onChange={(e) => update(field, Number(e.target.value))}
        className="w-full bg-background metallic-border rounded px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
      />
      {hint && <p className="font-body text-[9px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

  const sectorBm = SECTOR_BENCHMARKS[inputs.sector];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Context */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Contexto de la empresa</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs text-muted-foreground block mb-1">Nombre</label>
            <input
              type="text"
              value={inputs.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              className="w-full bg-background metallic-border rounded px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground block mb-1">Sector</label>
            <select
              value={inputs.sector}
              onChange={(e) => update("sector", e.target.value)}
              className="w-full bg-background metallic-border rounded px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
            >
              {SECTOR_KEYS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <p className="font-body text-[10px] text-muted-foreground mt-3">
          País: Colombia (fijo) · Moneda: USD (demo)
        </p>

        {sectorBm && (
          <div className="mt-3 p-3 rounded bg-background/50 border border-border/30">
            <p className="font-body text-[10px] text-primary uppercase tracking-wider mb-2">Referencia sectorial precargada</p>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { l: "Beta (βU)", v: sectorBm.beta.toString() },
                { l: "EBITDA ref", v: `${sectorBm.ebitdaMargin}%` },
                { l: "EV/EBITDA", v: `${sectorBm.evEbitda}x` },
                { l: "EV/Rev", v: `${sectorBm.evRevenue}x` },
                { l: "WACC ref", v: `${sectorBm.waccRef}%` },
              ].map((item) => (
                <div key={item.l}>
                  <p className="font-body text-[9px] text-muted-foreground">{item.l}</p>
                  <p className="font-display text-xs font-bold text-foreground">{item.v}</p>
                </div>
              ))}
            </div>
            <p className="font-body text-[9px] text-muted-foreground mt-2">
              {sectorBm.source} · Actualización: {sectorBm.lastUpdated}
            </p>
          </div>
        )}
      </div>

      {/* Historical data */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Datos históricos (Año base)</h3>
        <div className="grid grid-cols-2 gap-4">
          {numField("Ingresos actuales (USD)", "revenue")}
          {numField("Costo de ventas (USD)", "costOfSales")}
          {numField("Gastos operativos / SG&A (USD)", "opex")}
          {numField("Depreciación y amortización (USD)", "depreciation")}
          {numField("Deuda financiera total (USD)", "totalDebt")}
          {numField("Caja y equivalentes (USD)", "cash")}
          {numField("Patrimonio contable (USD)", "equity")}
          {numField("Intereses financieros (USD)", "interestExpense")}
        </div>
      </div>

      {/* Operating assumptions */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Supuestos operativos</h3>
        <div className="grid grid-cols-2 gap-4">
          {numField("Tasa de crecimiento proyectado (%)", "growth")}
          {numField("Margen EBITDA (%)", "ebitdaMargin")}
          {numField("CAPEX (% ingresos)", "capexPct")}
          {numField("Δ Capital de trabajo (% ingresos)", "wcPct")}
          {numField("Tasa de impuestos (%)", "taxRate")}
          {numField("Crecimiento terminal g (%)", "terminalGrowth")}
          {numField("Días de caja operativa mínima", "diasMinCaja")}
        </div>
      </div>

      {/* Market assumptions */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Supuestos de mercado</h3>
        <div className="grid grid-cols-2 gap-4">
          {numField("Tasa libre de riesgo (Rf) (%)", "riskFreeRate", "Ref: US Treasury 10Y")}
          {numField("Prima de riesgo (ERP) (%)", "erp", "Ref: Damodaran — emergentes")}
          {numField("Costo de deuda pre-tax (%)", "costOfDebt")}
          <div>
            <label className="font-body text-xs text-muted-foreground block mb-1">Peso equity / deuda (%)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={inputs.equityWeight * 100}
                onChange={(e) => {
                  const eq = Number(e.target.value) / 100;
                  setInputs(prev => ({ ...prev, equityWeight: eq, debtWeight: 1 - eq }));
                }}
                className="w-1/2 bg-background metallic-border rounded px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
              />
              <input
                type="number"
                value={inputs.debtWeight * 100}
                readOnly
                className="w-1/2 bg-background metallic-border rounded px-3 py-2 text-sm font-body text-muted-foreground"
              />
            </div>
          </div>
        </div>
        <p className="font-body text-xs text-muted-foreground mt-3">
          Beta sectorial (desapalancado): <span className="text-foreground font-semibold">{sectorBm?.beta ?? "—"}</span>
          {" · "}Fuente: <span className="text-foreground">{sectorBm?.source ?? "—"}</span>
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRun}
          className="flex-1 font-body text-sm px-8 py-3 rounded bg-primary text-primary-foreground hover:brightness-110 transition-all shadow-lg shadow-primary/25 active:scale-[0.97]"
        >
          Ejecutar análisis completo
        </button>
        <button
          onClick={handleReset}
          className="font-body text-sm px-4 py-3 rounded metallic-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all active:scale-[0.97] flex items-center gap-2"
        >
          <RotateCcw size={14} />
          Restablecer
        </button>
      </div>
    </div>
  );
};

export default DemoInputsForm;
