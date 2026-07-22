import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const items = [
  "Datos verificables",
  "Benchmarks sectoriales",
  "Metodología auditable",
  "Reportes AAA",
  "Actualización continua",
];

const TrustStrip = () => (
  <section className="border-y border-border bg-velarix-bg-secondary">
    <div className="container mx-auto px-6 py-5">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="flex flex-wrap justify-center gap-x-10 gap-y-3"
      >
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-primary" />
            <span className="font-body text-sm text-muted-foreground">{item}</span>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default TrustStrip;
