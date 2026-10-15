// ADR-008 — single-owner private mode. Fija el contrato de rutas: "/"
// entra directo al workbench, no existe flujo de login/registro/
// recuperación, y sin sesión del owner la app queda bloqueada (fail
// closed) en vez de abrirse.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const sb = vi.hoisted(() => ({
  session: null as null | { user: { id: string; email: string } },
  setSession: vi.fn(),
}));

// Cliente Supabase inerte: cualquier cadena de query resuelve a lista vacía.
vi.mock("@/integrations/supabase/client", () => {
  const result = { data: [], error: null };
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "is", "order", "eq", "limit", "update", "insert"]) chain[m] = () => chain;
  chain.maybeSingle = async () => ({ data: null, error: null });
  chain.single = async () => ({ data: null, error: null });
  chain.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve);
  return {
    supabase: {
      from: () => chain,
      auth: {
        getSession: async () => ({ data: { session: sb.session } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        setSession: sb.setSession,
        signInWithPassword: vi.fn(async () => ({ error: null })),
        signOut: vi.fn(async () => ({ error: null })),
      },
    },
  };
});

import App from "@/App";

const OWNER = { user: { id: "owner-1", email: "owner@example.com" } };
const fetchMock = vi.fn();

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

describe("single-owner private mode (ADR-008)", () => {
  beforeEach(() => {
    sb.session = OWNER;
    sb.setSession.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("'/' termina en /workbench y el workbench carga", async () => {
    renderAt("/");
    await waitFor(() => expect(window.location.pathname).toBe("/workbench"));
    expect(await screen.findByText("VALUATION WORKBENCH")).toBeTruthy();
    expect(screen.getByText("LOCAL_PRIVATE")).toBeTruthy();
  });

  it.each(["/auth", "/login", "/register", "/signup", "/reset-password"])("%s ya no existe: redirige a /workbench", async (path) => {
    renderAt(path);
    await waitFor(() => expect(window.location.pathname).toBe("/workbench"));
    expect(await screen.findByText("VALUATION WORKBENCH")).toBeTruthy();
  });

  it("no hay login, registro, recuperación de contraseña ni logout visibles", async () => {
    renderAt("/workbench");
    await screen.findByText("VALUATION WORKBENCH");
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/Iniciar sesi[oó]n|Registr|Crear cuenta|Sign ?up|contraseña|Recuperar|Salir|Cuenta\b/i);
    expect(screen.getByText("Settings")).toBeTruthy();
  });

  it("LOCAL_PRIVATE sin sesión: la pide al servidor local y entra sin interacción", async () => {
    sb.session = null;
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ access_token: "a", refresh_token: "r" }), { status: 200 }));
    sb.setSession.mockImplementation(async () => { sb.session = OWNER; return { error: null }; });
    renderAt("/");
    expect(await screen.findByText("VALUATION WORKBENCH")).toBeTruthy();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/__velarix/owner-session");
    expect(init).toMatchObject({ method: "POST", headers: { "x-velarix-owner": "1" } });
    expect(sb.setSession).toHaveBeenCalledWith({ access_token: "a", refresh_token: "r" });
  });

  it("sin sesión y sin servidor local: fail closed (bloqueado, sin datos, sin registro)", async () => {
    sb.session = null;
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    renderAt("/workbench");
    expect(await screen.findByText("Velarix bloqueado")).toBeTruthy();
    expect(screen.queryByText("VALUATION WORKBENCH")).toBeNull();
    expect(document.body.textContent).not.toMatch(/Registr|Crear cuenta|Sign ?up|Recuperar|Olvidaste/i);
    expect(window.location.pathname).toBe("/workbench");
  });

  it("rutas legacy /dashboard y /admin redirigen al workbench", async () => {
    renderAt("/dashboard/analisis/abc");
    await waitFor(() => expect(window.location.pathname).toBe("/workbench"));
    renderAt("/admin/revisiones");
    await waitFor(() => expect(window.location.search).toBe("?view=reviews"));
  });
});
