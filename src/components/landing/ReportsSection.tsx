import { motion } from "framer-motion";
import { Award } from "lucide-react";

const reports = [
  { title: "Reporte ejecutivo financiero", desc: "Resumen ejecutivo con diagnóstico, KPIs clave y análisis de tendencias." },
  { title: "Resumen de valoración", desc: "Resultado DCF, rangos de valor y validación por múltiplos." },
  { title: "Diagnóstico de KPIs", desc: "Indicadores operativos, de rentabilidad y eficiencia con contexto sectorial." },
  { title: "Proyecciones a 5 años", desc: "Proyección de ingresos, EBITDA, FCF y estructura de capital." },
  { title: "Comparación de escenarios", desc: "Escenarios pesimista, base y optimista con impacto en valoración." },
  { title: "Matriz de supuestos", desc: "Documentación completa de supuestos utilizados en el modelo." },
  { title: "Apéndice metodológico", desc: "Marco metodológico DCF, WACC y fuentes de datos." },
  { title: "Trazabilidad de fuentes", desc: "Trazabilidad de cada dato macro y sectorial utilizado." },
];

interface Props {
  onOpenDemo?: () => void;
}

const ReportsSection = ({ onOpenDemo }: Props) => (
  <section id="reports" className="py-24 section-alt relative">
    <div className="container mx-auto px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <p className="font-body text-[11px] uppercase tracking-[0.2em] text-primary text-center mb-3">Reportes</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">
          Reportes diseñados para fundadores, equipos financieros y conversaciones con inversionistas
        </h2>
        <p className="font-body text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
          Reportes con estándar de banca de inversión, listos para comité, junta directiva o due diligence.
        </p>
      </motion.div>

      {/* AAA Badge */}
      <div className="flex justify-center mt-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 metallic-border">
          <Award size={16} className="text-primary" />
          <span className="font-display text-xs font-bold text-primary tracking-wider">AAA REPORTING STANDARD</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
        {reports.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="metallic-border-hover rounded bg-velarix-bg-card-dark p-5 group"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 rounded bg-primary" />
              <span className="font-display text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h4 className="font-display text-xs font-bold text-foreground mb-2">{r.title}</h4>
            <p className="font-body text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA to demo */}
      <div className="flex justify-center mt-10">
        <button
          onClick={onOpenDemo}
          className="font-body text-sm px-7 py-3 rounded metallic-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-200 active:scale-[0.97]"
        >
          Ver un reporte de ejemplo →
        </button>
      </div>
    </div>
  </section>
);

export default ReportsSection;
