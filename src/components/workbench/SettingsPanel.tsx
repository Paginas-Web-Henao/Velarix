// Settings del workbench (ADR-008): sustituye a la antigua vista "Cuenta".
// No hay gestión de usuarios ni de roles: solo el estado del entorno
// privado. Preferencias de modelo/moneda/AI/export se añadirán aquí.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOwnerSession } from "@/contexts/OwnerSessionContext";
import { Panel } from "@/components/workbench/ui";

// Rol mínimo que exigen RLS (Expediente, manual_reviews) y authorization.ts
// para que el owner pueda revisar y aceptar Judgment (deuda técnica ADR-008).
const OWNER_ROLES = new Set(["admin", "analyst"]);

export default function SettingsPanel() {
  const { mode, user, lock } = useOwnerSession();
  const [role, setRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
      .then(({ data }) => setRole(data?.role ?? null));
  }, [user]);

  const supabaseHost = (() => {
    try { return new URL(import.meta.env.VITE_SUPABASE_URL).host; } catch { return "—"; }
  })();

  const rows: [string, React.ReactNode][] = [
    ["Modo de acceso", <span className="font-mono">{mode === "local_private" ? "LOCAL_PRIVATE" : "DEPLOYED_PRIVATE"}</span>],
    ["Supabase", <span className="font-mono">{supabaseHost}</span>],
    ["Sesión del owner", user ? <span className="font-mono">{user.email}</span> : "—"],
    ["Rol interno", role === undefined ? "…" : OWNER_ROLES.has(role ?? "") ? <span className="font-mono">{role}</span> : (
      <span className="text-destructive">{role ?? "sin perfil"} — el Review Center y el Expediente requieren admin/analyst (ver docs/07-autenticacion.md)</span>
    )],
  ];

  return (
    <div className="max-w-2xl space-y-3">
      <Panel title="Settings">
        <dl className="grid grid-cols-[10rem_1fr] gap-y-1.5 text-xs">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <p className="font-body text-[11px] text-muted-foreground">
        Velarix es un workbench privado de un solo owner: sin registro ni cuentas de terceros. Los datos siguen protegidos por
        Supabase Auth + RLS con la identidad del owner (ADR-008).
      </p>
      {mode === "deployed_private" && (
        <button onClick={() => void lock()} className="text-xs text-muted-foreground hover:text-destructive">
          Bloquear esta instancia
        </button>
      )}
    </div>
  );
}
