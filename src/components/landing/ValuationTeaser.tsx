import { useState } from "react";
import { motion } from "framer-motion";
import { quickValuation, formatCurrency, formatCurrencyFull, SECTOR_KEYS } from "@/lib/financial-engine";

interface Props {
  onOpenDemo?: () => void;
}

const ValuationTeaser = ({ onOpenDemo }: Props) => {
  const [revenue, setRevenue] = useState(3_000_000);
  const [growth, setGrowth] = useState(25);
  const [margin, setMargin] = useState(22);
  const [sector, setSector] = useState(SECTOR_KEYS[0]);
  const [result, setResult] = useState<ReturnType<typeof quickValuation> | null>(null);

  const handleCalc = () => {
    setResult(quickValuation(revenue, growth, margin, sector));
  };

  return (
    <section id="estimador" className="py-24 section-alt relative overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <p className="font-body text-[11px] uppercase tracking-[0.2em] text-primary text-center mb-3">
            Estimador rápido
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">
            Estima el valor de tu empresa en segundos
          </h2>
          <p className="font-body text-sm text-muted-foreground text-center mt-3 max-w-xl mx-auto">
            Ingresa tus datos básicos y obtén una estimación rápida basada en múltiplos sectoriales.
          </p>

          <div className="mt-10 metallic-border rounded-lg bg-velarix-bg-card-dark p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="font-body text-xs text-muted-foreground block mb-1">Ingresos actuales (USD)</label>
                <input
                  type="number"
                  value={revenue}
                  onChange={(e) => setRevenue(Number(e.target.value))}
                  className="w-full bg-muted metallic-border rounded px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground block mb-1">Crecimiento esperado (%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={growth}
                  onChange={(e) => setGrowth(Number(e.target.value))}
                  className="w-full accent-primary mt-1"
                />
                <div className="flex justify-between items-center mt-1">
                  <input
                    type="number"
                    value={growth}
                    onChange={(e) => setGrowth(Number(e.target.value))}
                    className="w-16 bg-muted metallic-border rounded px-2 py-1 text-xs font-body text-foreground focus:outline-none"
                  />
                  <span className="font-body text-xs text-muted-foreground">{growth}%</span>
                </div>
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground block mb-1">Margen EBITDA (%)</label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full accent-primary mt-1"
                />
                <div className="flex justify-between items-center mt-1">
                  <input
                    type="number"
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-16 bg-muted metallic-border rounded px-2 py-1 text-xs font-body text-foreground focus:outline-none"
                  />
                  <span className="font-body text-xs text-muted-foreground">{margin}%</span>
                </div>
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground block mb-1">Sector</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-muted metallic-border rounded px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
                >
                  {SECTOR_KEYS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleCalc}
                className="font-body text-sm px-8 py-3 rounded bg-primary text-primary-foreground hover:brightness-110 transition-all duration-200 shadow-lg shadow-primary/25 active:scale-[0.97]"
              >
                Calcular estimación
              </button>
            </div>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <div className="metallic-border rounded bg-muted p-4 text-center">
                  <p className="font-body text-xs text-muted-foreground mb-1">Rango estimado de valoración</p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {formatCurrency(result.low)} — {formatCurrency(result.high)}
                  </p>
                </div>
                <div className="metallic-border rounded bg-muted p-4 text-center">
                  <p className="font-body text-xs text-muted-foreground mb-1">Múltiplo EV/EBITDA</p>
                  <p className="font-display text-lg font-bold text-primary">{result.multiple}x</p>
                </div>
                <div className="metallic-border rounded bg-muted p-4 text-center">
                  <p className="font-body text-xs text-muted-foreground mb-1">WACC referencia</p>
                  <p className="font-display text-lg font-bold text-foreground">{result.waccRef}%</p>
                </div>
                <div className="metallic-border rounded bg-muted p-4 text-center">
                  <p className="font-body text-xs text-muted-foreground mb-1">EBITDA implícito</p>
                  <p className="font-display text-lg font-bold text-foreground">{formatCurrencyFull(result.ebitda)}</p>
                </div>
              </motion.div>
            )}

            {result && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={onOpenDemo}
                  className="font-body text-xs px-6 py-2 rounded metallic-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-200"
                >
                  Ver análisis completo →
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ValuationTeaser;
