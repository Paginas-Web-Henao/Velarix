import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OwnerSessionProvider } from "@/contexts/OwnerSessionContext";
import OwnerGate from "@/components/workbench/OwnerGate";
import Workbench from "./pages/Workbench.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminReviewDetail from "./pages/AdminReviewDetail.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OwnerSessionProvider>
          <Routes>
            {/* Single-owner private mode (ADR-008): "/" entra directo al workbench. */}
            <Route path="/" element={<Navigate to="/workbench" replace />} />
            <Route path="/workbench" element={<OwnerGate><Workbench /></OwnerGate>} />
            <Route path="/workbench/reviews/:revisionId" element={<OwnerGate><AdminReviewDetail /></OwnerGate>} />
            {/* Rutas retiradas (sin login, registro ni recuperación): marcadores y emails viejos. */}
            {["/auth", "/login", "/register", "/signup", "/reset-password"].map((p) => (
              <Route key={p} path={p} element={<Navigate to="/workbench" replace />} />
            ))}
            <Route path="/dashboard/*" element={<Navigate to="/workbench" replace />} />
            <Route path="/admin/*" element={<Navigate to="/workbench?view=reviews" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OwnerSessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
