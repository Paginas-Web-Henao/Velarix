import { motion } from "framer-motion";
import { Database, BookOpen, SlidersHorizontal, GitBranch, FileCheck, ArrowRight } from "lucide-react";

const pillars = [
  { icon: Database, title: "Fuentes macro verificadas", desc: "Banco de la República, DANE, Damodaran. Frescura validada mensualmente." },
  { icon: BookOpen, title: "Metodología transparente", desc: "DCF con FCFF (estándar CFA), CAPM, Hamada. Documentación completa." },
  { icon: SlidersHorizontal, title: "Supuestos controlables", desc: "Cada variable es explícita, editable y trazable por el usuario." },
  { icon: GitBranch, title: "Outputs trazables", desc: "Cada resultado se conecta a su fuente de origen y parámetro." },
  { icon: FileCheck, title: "Lógica de reporte profesional", desc: "Formato institucional de 12 páginas, listo para stakeholders." },
];

const archSteps = [
  { label: "Fuentes de datos", sub: "Damodaran · Banrep · DANE" },
  { label: "Capa de validación", sub: "Frescura · Consistencia" },
  { label: "Motor financiero", sub: "Determinístico · Frontend" },
  { label: "Generador de reporte", sub: "12 páginas · PDF" },
  { label: "Dashboard usuario", sub: "9 módulos · Interactivo" },
];

const TrustGovernance = () => (
  <section className="py-24 section-alt">
    <div className="container mx-auto px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <p className="font-body text-[11px] uppercase tracking-[0.2em] text-primary text-center mb-3">Gobernanza</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">
          Construido sobre disciplina, no sobre caja negra
        </h2>
        <p className="font-body text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
          Cada dato, supuesto y resultado es verificable. Sin cajas negras ni algoritmos opacos.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mt-16">
        {pillars.map((p) => (
          <div key={p.title} className="metallic-border rounded bg-velarix-bg-card-dark p-5 text-center">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-primary/10 mx-auto mb-3">
              <p.icon size={18} className="text-primary" />
            </div>
            <h4 className="font-display text-xs font-bold text-foreground mb-2">{p.title}</h4>
            <p className="font-body text-[11px] text-muted-foreground leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Architecture diagram */}
      <div className="mt-14 flex flex-wrap items-start justify-center gap-2">
        {archSteps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            <div className="px-4 py-3 rounded metallic-border bg-velarix-bg-card-dark text-center">
              <span className="font-body text-xs text-foreground font-medium block">{step.label}</span>
              <span className="font-body text-[9px] text-muted-foreground block mt-0.5">{step.sub}</span>
            </div>
            {i < archSteps.length - 1 && <ArrowRight size={14} className="text-primary/50" />}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustGovernance;
