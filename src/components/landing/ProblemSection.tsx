import { motion } from "framer-motion";
import { Clock, Layers, EyeOff, Target } from "lucide-react";

const cards = [
  {
    icon: Clock,
    title: "Modelos manuales, resultados frágiles",
    desc: "Los modelos en Excel son lentos de construir, difíciles de actualizar y propensos a errores que nadie detecta hasta que ya es tarde.",
  },
  {
    icon: Layers,
    title: "Datos de benchmark fragmentados",
    desc: "Encontrar comparables sectoriales confiables en Colombia requiere semanas de trabajo. Sin benchmark, no hay contexto. Sin contexto, no hay criterio.",
  },
  {
    icon: EyeOff,
    title: "Valoraciones con supuestos ocultos",
    desc: "Muchas valoraciones circulan sin que el lector pueda rastrear sus hipótesis. Cuando el inversionista pregunta, la respuesta no convence.",
  },
  {
    icon: Target,
    title: "Los fundadores necesitan outputs de grado institucional",
    desc: "Un proceso de M&A, due diligence o levantamiento de capital no admite presentaciones con formato de calculadora. Exige calidad de reporte institucional.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const ProblemSection = () => (
  <section className="py-24 section-alt">
    <div className="container mx-auto px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <p className="font-body text-[11px] uppercase tracking-[0.2em] text-primary text-center mb-3">El problema</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center max-w-3xl mx-auto">
          El problema no es analizar una empresa. Es hacerlo con criterio financiero real.
        </h2>
        <p className="font-body text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
          La mayoría de las herramientas disponibles no estaban diseñadas para este nivel de exigencia.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-16">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="metallic-border-hover rounded bg-velarix-bg-card-dark p-6 group"
          >
            <div className="w-10 h-10 rounded flex items-center justify-center bg-primary/10 mb-4">
              <card.icon size={18} className="text-primary" />
            </div>
            <h3 className="font-display text-base font-semibold text-foreground mb-2">{card.title}</h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
