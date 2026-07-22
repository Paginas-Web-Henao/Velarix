import { motion } from "framer-motion";
import { LayoutDashboard, BarChart3, TrendingUp, FileText, Settings, Database, DollarSign, PieChart } from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: BarChart3, label: "KPIs" },
  { icon: TrendingUp, label: "Proyecciones" },
  { icon: DollarSign, label: "Valoración" },
  { icon: PieChart, label: "Benchmarks" },
  { icon: FileText, label: "Reportes" },
  { icon: Database, label: "Datos" },
  { icon: Settings, label: "Configuración" },
];

const ProductPreview = () => (
  <section className="py-24 bg-background">
    <div className="container mx-auto px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <p className="font-body text-[11px] uppercase tracking-[0.2em] text-primary text-center mb-3">Vista previa</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">Dentro de la plataforma</h2>
        <p className="font-body text-muted-foreground text-center mt-4">Una experiencia diseñada para analistas que valoran la precisión.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mt-14 metallic-border rounded-lg bg-velarix-bg-secondary overflow-hidden blue-glow-subtle"
      >
        <div className="flex min-h-[480px]">
          {/* Sidebar */}
          <div className="w-48 border-r border-border bg-velarix-bg-tertiary p-4 hidden md:block">
            <p className="font-display text-sm font-bold text-foreground mb-6">Velarix</p>
            <div className="space-y-1">
              {sidebarItems.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-body transition-colors ${
                    i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">TechCo S.A.S.</h3>
                <p className="font-body text-xs text-muted-foreground">Software / Tecnología · Colombia</p>
              </div>
              <div className="flex gap-2">
                <span className="font-body text-[10px] px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">Valoración activa</span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Ingresos", value: "$8,420M", change: "+12.3%" },
                { label: "EBITDA", value: "$1,890M", change: "+8.7%" },
                { label: "Margen EBITDA", value: "22.4%", change: "+1.2pp" },
                { label: "FCF", value: "$1,240M", change: "+15.1%" },
              ].map((kpi) => (
                <div key={kpi.label} className="metallic-border rounded bg-velarix-bg-card-dark p-3">
                  <p className="font-body text-[10px] text-muted-foreground">{kpi.label}</p>
                  <p className="font-display text-base font-bold text-foreground mt-1">{kpi.value}</p>
                  <p className="font-body text-[10px] text-primary mt-0.5">{kpi.change}</p>
                </div>
              ))}
            </div>

            {/* Bottom panels */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="metallic-border rounded bg-velarix-bg-card-dark p-4">
                <p className="font-display text-xs font-semibold text-foreground mb-3">Valoración DCF</p>
                <div className="space-y-2">
                  {[
                    { l: "Escenario Base", v: "$15,200M" },
                    { l: "Escenario Optimista", v: "$18,400M" },
                    { l: "Escenario Conservador", v: "$12,100M" },
                  ].map((s) => (
                    <div key={s.l} className="flex justify-between items-center">
                      <span className="font-body text-xs text-muted-foreground">{s.l}</span>
                      <span className="font-display text-sm font-bold text-foreground">{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="metallic-border rounded bg-velarix-bg-card-dark p-4">
                <p className="font-display text-xs font-semibold text-foreground mb-3">Costo de capital</p>
                <div className="space-y-2">
                  {[
                    { l: "WACC", v: "14.2%" },
                    { l: "Ke (costo del equity)", v: "18.4%" },
                    { l: "Kd (costo de deuda)", v: "9.1%" },
                    { l: "Escudo fiscal", v: "35%" },
                  ].map((s) => (
                    <div key={s.l} className="flex justify-between items-center">
                      <span className="font-body text-xs text-muted-foreground">{s.l}</span>
                      <span className="font-display text-sm font-bold text-foreground">{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default ProductPreview;
