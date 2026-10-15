import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth.tsx";
import Workbench from "./pages/Workbench.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminReviewDetail from "./pages/AdminReviewDetail.tsx";

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground font-body text-sm">Cargando...</p></div>
);

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/workbench" replace />;
  return <>{children}</>;
}

// "/" no tiene contenido propio (ADR-007): sesión → workbench, sin sesión → login.
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return <Navigate to={user ? "/workbench" : "/auth"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* App privada (ADR-007): sin landing ni demo pública. */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/workbench" element={<ProtectedRoute><Workbench /></ProtectedRoute>} />
            <Route path="/workbench/reviews/:revisionId" element={<ProtectedRoute><AdminReviewDetail /></ProtectedRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Compatibilidad: enlaces viejos (emails ya enviados, marcadores). */}
            <Route path="/dashboard/*" element={<Navigate to="/workbench" replace />} />
            <Route path="/admin/*" element={<Navigate to="/workbench?view=reviews" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
