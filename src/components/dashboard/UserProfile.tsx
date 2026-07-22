import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const UserProfile = () => {
  const { user, updatePassword } = useAuth();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, company").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setCompany(data.company || "");
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, company }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil actualizado.");
  };

  const handlePwChange = async () => {
    if (newPw.length < 6) { toast.error("Mínimo 6 caracteres."); return; }
    setChangingPw(true);
    const { error } = await updatePassword(newPw);
    setChangingPw(false);
    if (error) toast.error(error);
    else { toast.success("Contraseña actualizada."); setNewPw(""); }
  };

  return (
    <div className="max-w-lg">
      <h2 className="font-display text-lg font-semibold text-foreground mb-6">Mi perfil</h2>

      <div className="metallic-border rounded-lg bg-card p-6 space-y-4 mb-6">
        <div>
          <label className="font-body text-xs text-muted-foreground block mb-1">Nombre completo</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
            className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground block mb-1">Empresa</label>
          <input type="text" value={company} onChange={e => setCompany(e.target.value)}
            className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
            placeholder="Nombre de tu empresa" />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground block mb-1">Correo electrónico</label>
          <input type="email" value={user?.email || ""} disabled
            className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-muted-foreground cursor-not-allowed" />
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-primary text-primary-foreground font-body text-sm px-5 py-2 rounded hover:bg-primary/90 disabled:opacity-50 active:scale-[0.97]">
          {saving ? <><Loader2 size={14} className="inline animate-spin mr-2" />Guardando...</> : "Guardar cambios"}
        </button>
      </div>

      <div className="metallic-border rounded-lg bg-card p-6 space-y-4">
        <h3 className="font-display text-sm font-semibold text-foreground">Cambiar contraseña</h3>
        <div>
          <label className="font-body text-xs text-muted-foreground block mb-1">Nueva contraseña</label>
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
            className="w-full bg-background metallic-border rounded px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
            placeholder="Mínimo 6 caracteres" minLength={6} />
        </div>
        <button onClick={handlePwChange} disabled={changingPw || newPw.length < 6}
          className="bg-primary text-primary-foreground font-body text-sm px-5 py-2 rounded hover:bg-primary/90 disabled:opacity-50 active:scale-[0.97]">
          {changingPw ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </div>

      <div className="mt-6 metallic-border rounded-lg bg-card p-4">
        <p className="font-body text-xs text-muted-foreground">
          Cuenta creada: {user?.created_at ? new Date(user.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "—"}
        </p>
      </div>
    </div>
  );
};

export default UserProfile;
