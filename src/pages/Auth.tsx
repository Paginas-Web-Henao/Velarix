import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

// Herramienta personal (ADR-007): sin registro público. Las cuentas se
// crean desde Supabase; aquí solo se inicia sesión o se recupera acceso.
type Mode = "login" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) { toast.error(error); return; }
        toast.success("Revisa tu correo para restablecer la contraseña.");
        setMode("login");
        return;
      }
      const { error } = await signIn(email, password);
      if (error) { toast.error(error); return; }
      navigate("/workbench");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Velarix</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">Personal Valuation Workbench</p>
        </div>

        <div className="metallic-border rounded-lg bg-card p-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-6">
            {mode === "login" ? "Iniciar sesión" : "Restablecer contraseña"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-body text-xs text-muted-foreground block mb-1">Correo electrónico</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
                placeholder="correo"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="font-body text-xs text-muted-foreground block mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50 pr-10"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground font-body text-sm font-medium py-2.5 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Enviar enlace"}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            {mode === "login" && (
              <button onClick={() => setMode("forgot")} className="font-body text-xs text-primary hover:underline block mx-auto">
                ¿Olvidaste tu contraseña?
              </button>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="font-body text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
                <ArrowLeft size={12} /> Volver al inicio de sesión
              </button>
            )}
          </div>
        </div>

        <p className="font-body text-[10px] text-muted-foreground text-center mt-6">
          Acceso privado. Los resultados son análisis personales, no asesoría financiera regulada.
        </p>
      </div>
    </div>
  );
};

export default Auth;
