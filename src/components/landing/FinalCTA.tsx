import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onOpenDemo?: () => void;
}

const FinalCTA = ({ onOpenDemo }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSolicitarDemo = () => navigate("/auth");
  const handleExplorar = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 blur-[120px] rounded-full" />
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-foreground max-w-3xl mx-auto leading-tight">
            Conoce el valor de tu empresa antes de que la sala te lo pregunte.
          </h2>
          <p className="font-body text-muted-foreground mt-6 max-w-xl mx-auto text-base leading-relaxed">
            Desde el diagnóstico financiero hasta la valoración y el reporte ejecutivo, Velarix te ayuda a llegar preparado.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <button
              onClick={handleSolicitarDemo}
              className="font-body text-sm px-8 py-3 rounded bg-primary text-primary-foreground hover:brightness-110 transition-all duration-200 shadow-lg shadow-primary/25 active:scale-[0.97]"
            >
              Solicitar demo
            </button>
            <button
              onClick={handleExplorar}
              className="font-body text-sm px-8 py-3 rounded metallic-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-200 active:scale-[0.97]"
            >
              Ver plataforma
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
