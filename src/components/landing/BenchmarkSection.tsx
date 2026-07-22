import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { SECTOR_BENCHMARKS, SECTOR_KEYS } from "@/lib/financial-engine";

const BenchmarkSection = () => {
  const [selected, setSelected] = useState(SECTOR_KEYS[0]);
  const bm = SECTOR_BENCHMARKS[selected];

  const chartData = SECTOR_KEYS.slice(0, 8).map((s) => ({
    name: SECTOR_BENCHMARKS[s].label.split(" ")[0].substring(0, 8),
    evEbitda: SECTOR_BENCHMARKS[s].evEbitda,
  }));

  return (
    <section id="benchmarks" className="py-24 section-alt">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="font-body text-[11px] uppercase tracking-[0.2em] text-primary text-center mb-3">Benchmarks</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">
            Benchmarks sectoriales construidos para comparación disciplinada
          </h2>
          <p className="font-body text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
            Múltiplos, betas y márgenes de referencia por sector, actualizados y documentados.
          </p>
        </motion.div>

        {/* Sector selector */}
        <div className="flex flex-wrap justify-center gap-2 mt-12">
          {SECTOR_KEYS.map((s) => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`font-body text-xs px-4 py-2 rounded transition-all duration-200 active:scale-[0.97] ${
                selected === s
                  ? "bg-primary text-primary-foreground"
                  : "metallic-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {SECTOR_BENCHMARKS[s].label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 mt-12">
          {/* Benchmark cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Beta desapalancado", value: bm.beta.toString(), desc: "Riesgo operativo del sector" },
              { label: "Margen EBITDA promedio", value: `${bm.ebitdaMargin}%`, desc: "Rentabilidad operativa de referencia" },
              { label: "EV/EBITDA", value: `${bm.evEbitda}x`, desc: "Múltiplo de valoración por flujo" },
              { label: "EV/Revenue", value: `${bm.evRevenue}x`, desc: "Múltiplo de valoración por ingresos" },
              { label: "WACC referencia", value: `${bm.waccRef}%`, desc: "Costo de capital estimado del sector" },
            ].map((item) => (
              <div key={item.label} className="metallic-border-hover rounded bg-velarix-bg-card-dark p-5">
                <p className="font-body text-xs text-muted-foreground mb-2">{item.label}</p>
                <p className="font-display text-xl font-bold text-foreground">{item.value}</p>
                <p className="font-body text-[10px] text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="metallic-border rounded bg-velarix-bg-card-dark p-5">
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">EV/EBITDA por sector</h4>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(215 20% 63%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 63%)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(222 39% 7%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 4, fontSize: 12 }}
                  />
                  <Bar dataKey="evEbitda" fill="hsl(217 80% 53%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="font-body text-[9px] text-muted-foreground mt-2">Fuente: Damodaran (Global) · Última actualización: Ene 2025</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenchmarkSection;
