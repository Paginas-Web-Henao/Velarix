import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setReady(true);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Las contraseñas no coinciden."); return; }
    if (password.length < 6) { toast.error("Mínimo 6 caracteres."); return; }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) { toast.error(error); return; }
    toast.success("Contraseña actualizada correctamente.");
    navigate("/auth");
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-xl text-foreground mb-2">Enlace inválido</h1>
          <p className="font-body text-sm text-muted-foreground mb-4">Este enlace de restablecimiento no es válido o ha expirado.</p>
          <a href="/auth" className="font-body text-sm text-primary hover:underline">Volver al inicio de sesión</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md metallic-border rounded-lg bg-card p-8">
        <h2 className="font-display text-lg font-semibold text-foreground mb-6">Nueva contraseña</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-xs text-muted-foreground block mb-1">Nueva contraseña</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
              minLength={6} />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground block mb-1">Confirmar contraseña</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
              minLength={6} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-primary-foreground font-body text-sm font-medium py-2.5 rounded hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
