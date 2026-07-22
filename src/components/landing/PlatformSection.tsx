import { motion } from "framer-motion";
import { Upload, CheckSquare, BarChart3, Calculator, FileText } from "lucide-react";

const steps = [
  { icon: Upload, label: "Cargar estados financieros", desc: "Balance, P&L y flujo de caja", num: "01" },
  { icon: CheckSquare, label: "Normalizar y validar", desc: "Homologación contable automática", num: "02" },
  { icon: BarChart3, label: "Revisar KPIs", desc: "Diagnóstico de estructura financiera", num: "03" },
  { icon: Calculator, label: "Proyectar y valorar", desc: "DCF, WACC, escenarios", num: "04" },
  { icon: FileText, label: "Generar reporte", desc: "PDF institucional de 12 páginas", num: "05" },
];

const PlatformSection = () => (
  <section id="platform" className="py-24 bg-background">
    <div className="container mx-auto px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <p className="font-body text-[11px] uppercase tracking-[0.2em] text-primary text-center mb-3">Plataforma</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">
          Una plataforma financiera seria, diseñada para decisiones reales
        </h2>
        <p className="font-body text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
          Cada paso del proceso está diseñado para producir resultados auditables y defendibles.
        </p>
      </motion.div>

      <div className="mt-16 flex flex-col lg:flex-row items-stretch gap-0">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="flex-1 relative"
          >
            <div className="flex flex-col items-center text-center px-4 py-8 metallic-border rounded bg-velarix-bg-card-dark mx-1 h-full">
              <span className="font-display text-xs text-primary font-bold mb-3">{step.num}</span>
              <div className="w-12 h-12 rounded flex items-center justify-center bg-primary/10 mb-4">
                <step.icon size={20} className="text-primary" />
              </div>
              <p className="font-body text-sm text-foreground font-medium">{step.label}</p>
              <p className="font-body text-xs text-muted-foreground mt-1">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-1 w-2 h-[2px] bg-primary/30 z-10" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PlatformSection;
