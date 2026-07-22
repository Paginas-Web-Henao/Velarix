import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const methodCards = [
  { title: "DCF", desc: "Descuento de flujos de caja libre proyectados usando el costo ponderado de capital. Base de toda valoración seria." },
  { title: "WACC", desc: "Costo de capital ponderado entre equity y deuda, ajustado por escudo fiscal. Calibrado con parámetros de mercado reales." },
  { title: "ERP", desc: "Equity Risk Premium: compensación exigida por el mercado por encima de la tasa libre de riesgo. Base para el costo del equity vía CAPM." },
  { title: "Beta", desc: "Medida del riesgo sistemático del sector. Se usa desapalancado y se re-apalanca según la estructura financiera de la empresa." },
  { title: "Múltiplos", desc: "EV/EBITDA y EV/Revenue como contraste de mercado al DCF. Validación cruzada de la valoración." },
  { title: "Sensibilidad", desc: "Matriz de Enterprise Value ante cambios en WACC y tasa de crecimiento terminal. Fundamental para comunicar rangos creíbles." },
];

const flowSteps = [
  "Proyección de ingresos",
  "Margen EBITDA",
  "Impuestos operativos",
  "CAPEX",
  "Variación de capital de trabajo",
  "FCFF libre",
  "WACC (CAPM + estructura de capital)",
  "Valor terminal (Gordon Growth)",
  "DCF Enterprise Value",
  "Rango de escenarios",
];

interface Props {
  onOpenDemo?: () => void;
}

const MethodologySection = ({ onOpenDemo }: Props) => (
  <section id="methodology" className="py-24 section-alt">
    <div className="container mx-auto px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <p className="font-body text-[11px] uppercase tracking-[0.2em] text-primary text-center mb-3">Metodología</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">
          Lógica de valoración que puedes explicar y defender
        </h2>
        <p className="font-body text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
          Cada supuesto está documentado. Cada resultado es trazable. Sin cajas negras.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12 mt-16">
        {/* Flow diagram */}
        <div className="flex flex-col items-center">
          {flowSteps.map((step, i) => (
            <div key={step} className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="metallic-border rounded bg-velarix-bg-card-dark px-8 py-3 text-center"
              >
                <span className="font-body text-sm text-foreground font-medium">{step}</span>
              </motion.div>
              {i < flowSteps.length - 1 && (
                <ArrowDown size={14} className="text-primary/50 my-1" />
              )}
            </div>
          ))}
        </div>

        {/* Method cards */}
        <div className="grid grid-cols-2 gap-4">
          {methodCards.map((card) => (
            <div key={card.title} className="metallic-border-hover rounded bg-velarix-bg-secondary p-5">
              <h4 className="font-display text-sm font-bold text-primary mb-2">{card.title}</h4>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA to demo */}
      <div className="flex justify-center mt-12">
        <button
          onClick={onOpenDemo}
          className="font-body text-sm px-7 py-3 rounded bg-primary text-primary-foreground hover:brightness-110 transition-all duration-200 shadow-lg shadow-primary/25 active:scale-[0.97]"
        >
          Probar la metodología en vivo
        </button>
      </div>
    </div>
  </section>
);

export default MethodologySection;
