import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Shield, Activity, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const DashboardMockup = () => (
  <div className="relative w-full max-w-lg">
    <div className="absolute -inset-10 bg-primary/10 blur-[80px] rounded-full" />
    <div className="relative space-y-3">
      <div className="metallic-border rounded-lg bg-velarix-bg-card-dark p-4">
        <p className="text-xs text-muted-foreground font-body mb-2">Rango de Valoración (USD)</p>
        <div className="flex items-end gap-4">
          <span className="font-display text-2xl font-bold text-foreground">$12.4M</span>
          <span className="text-muted-foreground text-sm">—</span>
          <span className="font-display text-2xl font-bold text-foreground">$15.8M</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-primary to-secondary" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="metallic-border rounded-lg bg-velarix-bg-card-dark p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-primary" />
            <p className="text-xs text-muted-foreground font-body">Ingresos</p>
          </div>
          <p className="font-display text-lg font-bold text-foreground">$3.0M</p>
          <p className="text-xs text-primary mt-1">+25% YoY</p>
        </div>
        <div className="metallic-border rounded-lg bg-velarix-bg-card-dark p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-primary" />
            <p className="text-xs text-muted-foreground font-body">WACC</p>
          </div>
          <p className="font-display text-lg font-bold text-foreground">10.4%</p>
          <p className="text-xs text-muted-foreground mt-1">Ke: 12.1% · Kd: 5.6%</p>
        </div>
        <div className="metallic-border rounded-lg bg-velarix-bg-card-dark p-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} className="text-primary" />
            <p className="text-xs text-muted-foreground font-body">Margen EBITDA</p>
          </div>
          <p className="font-display text-lg font-bold text-foreground">22%</p>
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-body px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            ▲ Por encima del benchmark
          </div>
        </div>
        <div className="metallic-border rounded-lg bg-velarix-bg-card-dark p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-primary" />
            <p className="text-xs text-muted-foreground font-body">Reporte</p>
          </div>
          <p className="font-display text-sm font-bold text-primary">AAA Standard</p>
          <p className="text-xs text-muted-foreground mt-1">Última verificación: hoy</p>
        </div>
      </div>
      <div className="metallic-border rounded-lg bg-velarix-bg-card-dark p-3 flex items-center gap-2">
        <CheckCircle2 size={12} className="text-primary" />
        <p className="text-[10px] text-muted-foreground font-body">Última verificación: hoy · Fuente: simulación demo · Estado: ✓ Validado</p>
      </div>
    </div>
  </div>
);

interface Props {
  onOpenDemo?: () => void;
}

const HeroSection = ({ onOpenDemo }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSolicitarDemo = () => {
    navigate("/auth");
  };

  const handleExplorar = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 blur-[120px] rounded-full" />
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.p
              custom={0} initial="hidden" animate="visible" variants={fadeUp}
              className="font-body text-[11px] uppercase tracking-[0.2em] text-primary mb-4"
            >
              Inteligencia financiera institucional
            </motion.p>
            <motion.h1
              custom={1} initial="hidden" animate="visible" variants={fadeUp}
              className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] text-foreground"
            >
              Inteligencia financiera para empresas que necesitan precisión.
            </motion.h1>
            <motion.p
              custom={2} initial="hidden" animate="visible" variants={fadeUp}
              className="font-body text-base md:text-lg text-muted-foreground mt-6 max-w-xl leading-relaxed"
            >
              Diagnóstico financiero estructurado, proyecciones a 5 años y valoración empresarial con metodología auditable. Reportes listos para comité de dirección, junta directiva o due diligence de inversionistas.
            </motion.p>
            <motion.div
              custom={3} initial="hidden" animate="visible" variants={fadeUp}
              className="flex flex-wrap gap-4 mt-8"
            >
              <button
                onClick={handleSolicitarDemo}
                className="font-body text-sm px-7 py-3 rounded bg-primary text-primary-foreground hover:brightness-110 transition-all duration-200 shadow-lg shadow-primary/25 active:scale-[0.97]"
              >
                Solicitar demo
              </button>
              <button
                onClick={handleExplorar}
                className="font-body text-sm px-7 py-3 rounded metallic-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-200 active:scale-[0.97]"
              >
                Explorar plataforma
              </button>
            </motion.div>
            <motion.p
              custom={4} initial="hidden" animate="visible" variants={fadeUp}
              className="font-body text-[11px] text-muted-foreground mt-4"
            >
              Sin compromiso · Datos reales · Metodología auditada
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:block"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
