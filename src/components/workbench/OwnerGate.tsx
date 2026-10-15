// Single-owner private mode (ADR-008). Barrera de acceso del workbench.
// No es una ruta: envuelve /workbench. En LOCAL_PRIVATE configurado nunca
// se ve (la sesión llega sola). Solo aparece si no hay sesión del owner:
// despliegue (DEPLOYED_PRIVATE) o LOCAL_PRIVATE sin credenciales locales.
// Sin registro, sin recuperación de contraseña: la cuenta del owner ya
// existe en Supabase.
import { useState, type FormEvent, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { useOwnerSession } from "@/contexts/OwnerSessionContext";

export default function OwnerGate({ children }: { children: ReactNode }) {
  const { status, mode, unlock } = useOwnerSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "ready") return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-body text-sm">Abriendo Velarix…</p>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await unlock(email, password);
    setBusy(false);
    if (error) setError(error);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 border border-border rounded-lg bg-card p-6">
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-muted-foreground" />
          <h1 className="font-display text-sm font-bold">Velarix bloqueado</h1>
          <span className="ml-auto font-mono text-[9px] text-muted-foreground">
            {mode === "local_private" ? "LOCAL_PRIVATE" : "DEPLOYED_PRIVATE"}
          </span>
        </div>
        <p className="font-body text-xs text-muted-foreground">
          {mode === "local_private"
            ? "No hay sesión automática del owner: faltan las credenciales del owner en .env.local del servidor local (ver docs/07-autenticacion.md). Puedes desbloquear manualmente."
            : "Instancia desplegada: el acceso a los datos exige la cuenta del owner."}
        </p>
        <input
          type="email" autoComplete="username" required placeholder="Email del owner"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="password" autoComplete="current-password" required placeholder="Contraseña"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
          {busy ? "Desbloqueando…" : "Desbloquear"}
        </button>
      </form>
    </div>
  );
}
