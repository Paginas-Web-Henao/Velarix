// Single-owner private mode (ADR-008). Sustituye al antiguo AuthContext:
// no hay registro, login como flujo normal, recuperación de contraseña
// ni logout. La sesión de Supabase del owner se obtiene así:
// 1. Sesión ya persistida en el navegador (supabase-js la refresca sola).
// 2. LOCAL_PRIVATE: el servidor local la inicia (OWNER_SESSION_PATH).
// 3. Si nada de lo anterior funciona → `locked`: barrera de desbloqueo
//    del owner (OwnerUnlock). Nunca se abre la app sin sesión válida.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { OWNER_SESSION_HEADER, OWNER_SESSION_PATH, resolveAccessMode, type AccessMode } from "@/lib/access-mode";

export type OwnerSessionStatus = "loading" | "ready" | "locked";

interface OwnerSessionContextType {
  status: OwnerSessionStatus;
  mode: AccessMode;
  user: User | null;
  /** Desbloqueo manual del owner (solo cuando `status === "locked"`). */
  unlock: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Cierra la sesión del navegador (solo útil en DEPLOYED_PRIVATE). */
  lock: () => Promise<void>;
}

const OwnerSessionContext = createContext<OwnerSessionContextType | undefined>(undefined);

const currentAccessMode = (): AccessMode =>
  resolveAccessMode({ isDevBuild: import.meta.env.DEV, hostname: typeof window === "undefined" ? null : window.location.hostname });

async function bootstrapLocalOwnerSession(): Promise<boolean> {
  try {
    const r = await fetch(OWNER_SESSION_PATH, {
      method: "POST",
      credentials: "same-origin",
      headers: { [OWNER_SESSION_HEADER]: "1" },
    });
    if (!r.ok) return false;
    const { access_token, refresh_token } = (await r.json()) as { access_token?: string; refresh_token?: string };
    if (!access_token || !refresh_token) return false;
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    return !error;
  } catch {
    return false;
  }
}

export function OwnerSessionProvider({ children }: { children: ReactNode }) {
  const [mode] = useState<AccessMode>(currentAccessMode);
  const [status, setStatus] = useState<OwnerSessionStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const bootstrapping = useRef(false);

  const acquire = useCallback(async () => {
    if (bootstrapping.current) return;
    bootstrapping.current = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setStatus("ready");
        return;
      }
      if (mode === "local_private" && (await bootstrapLocalOwnerSession())) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser(data.session.user);
          setStatus("ready");
          return;
        }
      }
      setUser(null);
      setStatus("locked");
    } finally {
      bootstrapping.current = false;
    }
  }, [mode]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setStatus("ready");
      } else {
        // Sesión perdida (refresh revocado, lock): se vuelve a adquirir.
        setUser(null);
        void acquire();
      }
    });
    void acquire();
    return () => subscription.unsubscribe();
  }, [acquire]);

  const unlock = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const lock = async () => {
    await supabase.auth.signOut();
  };

  return (
    <OwnerSessionContext.Provider value={{ status, mode, user, unlock, lock }}>
      {children}
    </OwnerSessionContext.Provider>
  );
}

export function useOwnerSession() {
  const ctx = useContext(OwnerSessionContext);
  if (!ctx) throw new Error("useOwnerSession must be used within OwnerSessionProvider");
  return ctx;
}
