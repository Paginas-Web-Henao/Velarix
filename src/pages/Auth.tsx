import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

type Mode = "login" | "register" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
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
      if (mode === "register") {
        if (password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres."); return; }
        const { error } = await signUp(email, password, fullName);
        if (error) { toast.error(error); return; }
        toast.success("Cuenta creada. Bienvenido a Velarix.");
        navigate("/dashboard");
        return;
      }
      const { error } = await signIn(email, password);
      if (error) { toast.error(error); return; }
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <h1 className="font-display text-3xl font-bold text-foreground">Velarix</h1>
          </a>
          <p className="font-body text-sm text-muted-foreground mt-2">Inteligencia financiera institucional</p>
        </div>

        <div className="metallic-border rounded-lg bg-card p-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-6">
            {mode === "login" ? "Iniciar sesión" : mode === "register" ? "Crear cuenta" : "Restablecer contraseña"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="font-body text-xs text-muted-foreground block mb-1">Nombre completo</label>
                <input
                  type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
                  placeholder="Tu nombre"
                />
              </div>
            )}

            <div>
              <label className="font-body text-xs text-muted-foreground block mb-1">Correo electrónico</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
                placeholder="tu@empresa.com"
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
              {loading ? "Procesando..." : mode === "login" ? "Iniciar sesión" : mode === "register" ? "Crear cuenta" : "Enviar enlace"}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="font-body text-xs text-primary hover:underline block mx-auto">
                  ¿Olvidaste tu contraseña?
                </button>
                <p className="font-body text-xs text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <button onClick={() => setMode("register")} className="text-primary hover:underline">Crear cuenta</button>
                </p>
              </>
            )}
            {mode === "register" && (
              <p className="font-body text-xs text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => setMode("login")} className="text-primary hover:underline">Iniciar sesión</button>
              </p>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="font-body text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
                <ArrowLeft size={12} /> Volver al inicio de sesión
              </button>
            )}
          </div>
        </div>

        <p className="font-body text-[10px] text-muted-foreground text-center mt-6">
          Velarix es una plataforma de análisis financiero. Los resultados no constituyen asesoría financiera regulada.
        </p>
      </div>
    </div>
  );
};

export default Auth;
