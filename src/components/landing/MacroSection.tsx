import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Database, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { MACRO_COLOMBIA } from "@/data/velarix-datos-2026";
import { evaluarVigencia, formatearFechaVigencia } from "@/lib/financial-engine";

const macroKeys = ["inflacion_ipc", "tasa_politica", "trm", "pib"] as const;

const charts = macroKeys.map((key) => {
  const p = MACRO_COLOMBIA[key];
  return {
    title: p.label,
    data: p.datos.map((d) => ({ m: d.periodo, v: d.valor })),
    suffix: p.unidad === "%" ? "%" : "",
    source: p.fuente,
    ultimaActualizacion: p.ultimaActualizacion,
    frecuencia: p.frecuencia,
  };
});

const MiniChart = ({ title, data, suffix, source, ultimaActualizacion, frecuencia }: {
  title: string; data: { m: string; v: number }[]; suffix: string; source: string;
  ultimaActualizacion: string; frecuencia: string;
}) => {
  const v = evaluarVigencia(ultimaActualizacion, frecuencia);
  const colorDot = v.estado === "verde" ? "bg-emerald-500" : v.estado === "amarillo" ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="metallic-border rounded bg-velarix-bg-card-dark p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-display text-sm font-semibold text-foreground">{title}</h4>
        <span className="font-body text-[10px] text-muted-foreground">{data[0]?.m}–{data[data.length - 1]?.m}</span>
      </div>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" />
            <XAxis dataKey="m" tick={{ fontSize: 10, fill: "hsl(215 20% 63%)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 63%)" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: "hsl(222 39% 7%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 4, fontSize: 12 }}
              labelStyle={{ color: "hsl(215 20% 63%)" }}
              formatter={(val: number) => [`${val}${suffix}`, ""]}
            />
            <Line type="monotone" dataKey="v" stroke="hsl(217 80% 53%)" strokeWidth={2} dot={{ r: 2, fill: "hsl(217 80% 53%)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colorDot}`} />
        <span className="font-body text-[10px] text-muted-foreground">
          {source} · {formatearFechaVigencia(ultimaActualizacion)}
        </span>
      </div>
    </div>
  );
};

const MacroSection = () => (
  <section className="py-24 bg-background">
    <div className="container mx-auto px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <p className="font-body text-[11px] uppercase tracking-[0.2em] text-primary text-center mb-3">Contexto macro</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">
          Contexto macroeconómico que mejora el criterio financiero
        </h2>
        <p className="font-body text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
          Variables macro integradas directamente en los modelos de proyección y costo de capital.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8 mt-16">
        <div className="grid md:grid-cols-2 gap-5">
          {charts.map((c) => (
            <MiniChart key={c.title} {...c} />
          ))}
        </div>

        <div className="metallic-border rounded bg-velarix-bg-card-dark p-6 h-fit">
          <h4 className="font-display text-sm font-semibold text-foreground mb-5">Integridad de datos de mercado</h4>
          <div className="space-y-4">
            {[
              { icon: Database, label: "Fuentes conectadas", value: "Banco de la República, DANE, US Treasury" },
              { icon: Clock, label: "Última verificación", value: formatearFechaVigencia(MACRO_COLOMBIA.inflacion_ipc.ultimaActualizacion) },
              { icon: CheckCircle2, label: "Estado de validación", value: "✓ Activo" },
              { icon: RefreshCw, label: "Frecuencia de actualización", value: "Mensual" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/10 shrink-0 mt-0.5">
                  <item.icon size={14} className="text-primary" />
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-body text-sm text-foreground font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default MacroSection;
