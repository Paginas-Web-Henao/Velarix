// ADR-007 — Velarix es una app privada: no hay landing ni demo pública.
// Fija el contrato de rutas: "/" redirige según sesión, /workbench exige
// sesión, el logout vuelve a /auth y las rutas legacy redirigen.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const auth = vi.hoisted(() => ({
  user: null as null | { id: string; email: string },
  loading: false,
  signOut: vi.fn(async () => { auth.user = null; }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: auth.user, session: null, loading: auth.loading, signOut: auth.signOut,
    signIn: vi.fn(), signUp: vi.fn(), resetPassword: vi.fn(), updatePassword: vi.fn(),
  }),
}));

// Cliente Supabase inerte: cualquier cadena de query resuelve a lista vacía.
vi.mock("@/integrations/supabase/client", () => {
  const result = { data: [], error: null };
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "is", "order", "eq", "limit", "update", "insert"]) chain[m] = () => chain;
  chain.maybeSingle = async () => ({ data: null, error: null });
  chain.single = async () => ({ data: null, error: null });
  chain.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve);
  return { supabase: { from: () => chain, auth: { getSession: async () => ({ data: { session: null } }) } } };
});

import App from "@/App";

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

describe("rutas privadas (ADR-007)", () => {
  beforeEach(() => { auth.user = null; auth.loading = false; auth.signOut.mockClear(); });

  it("'/' sin sesión redirige a /auth (no hay home pública)", async () => {
    renderAt("/");
    await waitFor(() => expect(window.location.pathname).toBe("/auth"));
    expect(screen.getByText("Personal Valuation Workbench")).toBeTruthy();
    expect(screen.queryByText(/Crear cuenta/i)).toBeNull();
  });

  it("'/' con sesión redirige a /workbench", async () => {
    auth.user = { id: "u1", email: "n@example.com" };
    renderAt("/");
    await waitFor(() => expect(window.location.pathname).toBe("/workbench"));
    expect(screen.getByText("VALUATION WORKBENCH")).toBeTruthy();
  });

  it("/workbench sin sesión redirige a /auth", async () => {
    renderAt("/workbench");
    await waitFor(() => expect(window.location.pathname).toBe("/auth"));
  });

  it("/auth con sesión redirige a /workbench", async () => {
    auth.user = { id: "u1", email: "n@example.com" };
    renderAt("/auth");
    await waitFor(() => expect(window.location.pathname).toBe("/workbench"));
  });

  it("logout cierra sesión y vuelve a /auth", async () => {
    auth.user = { id: "u1", email: "n@example.com" };
    const view = renderAt("/workbench");
    fireEvent.click(await screen.findByText("Salir"));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
    view.rerender(<App />);
    await waitFor(() => expect(window.location.pathname).toBe("/auth"));
  });

  it("rutas legacy /dashboard y /admin redirigen al workbench (y exigen sesión)", async () => {
    auth.user = { id: "u1", email: "n@example.com" };
    renderAt("/dashboard/analisis/abc");
    await waitFor(() => expect(window.location.pathname).toBe("/workbench"));
    renderAt("/admin/revisiones");
    await waitFor(() => expect(window.location.search).toBe("?view=reviews"));
  });

  it("no queda ningún texto comercial ni de demo en la entrada", async () => {
    renderAt("/");
    await waitFor(() => expect(window.location.pathname).toBe("/auth"));
    expect(document.body.textContent).not.toMatch(/cuenta gratuita|Solicitar demo|institucional|\bDemo\b/i);
  });
});
