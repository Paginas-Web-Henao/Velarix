import { Linkedin, Twitter } from "lucide-react";

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const footerSections = [
  {
    title: "Plataforma",
    links: [
      { label: "Dashboard", action: "demo" },
      { label: "Proyecciones", action: "demo" },
      { label: "Valoración", action: "demo" },
      { label: "Reportes", href: "#reports" },
    ],
  },
  {
    title: "Metodología",
    links: [
      { label: "DCF", href: "#methodology" },
      { label: "WACC", href: "#methodology" },
      { label: "Múltiplos", href: "#benchmarks" },
      { label: "Sensibilidad", href: "#methodology" },
    ],
  },
  {
    title: "Datos",
    links: [
      { label: "Macro Colombia", href: "#macro" },
      { label: "Benchmarks", href: "#benchmarks" },
      { label: "Betas", href: "#benchmarks" },
      { label: "Fuentes", href: "#trust" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Contacto", href: "#estimador" },
      { label: "Demo", action: "demo" },
      { label: "Estimador", href: "#estimador" },
      { label: "Metodología", href: "#methodology" },
    ],
  },
];

interface Props {
  onOpenDemo?: () => void;
}

const Footer = ({ onOpenDemo }: Props) => (
  <footer className="border-t border-border bg-velarix-bg-secondary py-16">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-6 gap-10">
        <div className="md:col-span-2">
          <p className="font-display text-lg font-bold text-foreground">Velarix</p>
          <p className="font-body text-sm text-muted-foreground mt-3 max-w-xs leading-relaxed">
            Inteligencia financiera para empresas que necesitan precisión, rigor y reportes de grado institucional.
          </p>
          <div className="flex gap-3 mt-5">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded flex items-center justify-center metallic-border text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin size={14} />
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded flex items-center justify-center metallic-border text-muted-foreground hover:text-foreground transition-colors">
              <Twitter size={14} />
            </a>
          </div>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <p className="font-display text-xs font-bold text-foreground uppercase tracking-wider mb-4">{section.title}</p>
            <div className="space-y-2">
              {section.links.map((link) => {
                if ("action" in link && link.action === "demo") {
                  return (
                    <button
                      key={link.label}
                      onClick={onOpenDemo}
                      className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  );
                }
                return (
                  <a
                    key={link.label}
                    href={"href" in link ? link.href : "#"}
                    className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border mt-12 pt-8">
        <p className="font-body text-xs text-muted-foreground text-center">
          © 2026 Velarix. Todos los derechos reservados. La información presentada no constituye asesoría financiera ni recomendación de inversión.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
