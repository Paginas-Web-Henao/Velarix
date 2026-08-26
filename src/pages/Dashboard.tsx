import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generatePDF } from "@/lib/pdf-generator";
import { mapCanonicalCalculationToPdfData } from "@/lib/pdf-canonical-mapper";
import type { PersistedCalculationResult } from "@/types/calculation-result";
import DemoDashboard from "@/components/demo/DemoDashboard";
import DashboardSidebar, { type DashboardView } from "@/components/dashboard/DashboardSidebar";
import DashboardHome from "@/components/dashboard/DashboardHome";
import NewAnalysisStepper from "@/components/dashboard/NewAnalysisStepper";
import AnalysisList from "@/components/dashboard/AnalysisList";
import ReportsGallery from "@/components/dashboard/ReportsGallery";
import UserProfile from "@/components/dashboard/UserProfile";
import DocumentUpload from "@/components/dashboard/DocumentUpload";
import QAChecklist from "@/components/dashboard/QAChecklist";
import { ArrowLeft } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  creado: { label: "Creado", color: "bg-muted text-muted-foreground" },
  documentos_cargados: { label: "Documentos cargados", color: "bg-primary/15 text-primary" },
  parsing_en_curso: { label: "Procesando...", color: "bg-primary/15 text-primary" },
  parsing_completado: { label: "Parsing completo", color: "bg-primary/15 text-primary" },
  homologacion_en_curso: { label: "Homologando...", color: "bg-primary/15 text-primary" },
  validacion_aprobada: { label: "Validado ✓", color: "bg-emerald-500/15 text-emerald-400" },
  validacion_con_advertencias: { label: "Validado ⚠", color: "bg-amber-500/15 text-amber-400" },
  validacion_bloqueada: { label: "Bloqueado ✗", color: "bg-destructive/15 text-destructive" },
  calculo_en_curso: { label: "Calculando...", color: "bg-primary/15 text-primary" },
  calculo_completo: { label: "Cálculo completo", color: "bg-emerald-500/15 text-emerald-400" },
  interpretacion_en_curso: { label: "Generando narrativa...", color: "bg-primary/15 text-primary" },
  informe_generado: { label: "Completado ✓", color: "bg-emerald-500/15 text-emerald-400" },
  error_tecnico: { label: "Error técnico", color: "bg-destructive/15 text-destructive" },
  revision_manual_requerida: { label: "Revisión manual", color: "bg-amber-500/15 text-amber-400" },
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<DashboardView>("inicio");
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoOpen, setDemoOpen] = useState(false);
  const [uploadAnalysisId, setUploadAnalysisId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchAnalyses = async () => {
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (!error && data) setAnalyses(data);
    setLoading(false);
  };

  useEffect(() => { fetchAnalyses(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("analyses").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Análisis eliminado."); fetchAnalyses(); }
  };

  const handleDownloadPDF = async (id: string) => {
    setDownloadingId(id);
    try {
      const analysis = analyses.find((a) => a.id === id);
      if (!analysis) { toast.error("Análisis no encontrado."); return; }

      // Fail-closed (Fase 1E / Subbloque 1): el PDF real solo puede
      // consumir el calculation_result canónico ya persistido por
      // ejecutar-calculo — históricos, valoración y metadata de versión
      // deben venir del MISMO calculation_result. NO se recalcula con el
      // motor cliente, NO se usan valores por defecto de UI, y NO se
      // vuelve a consultar structured_inputs: se bloquea la descarga.
      const calculationResult = analysis.calculation_result as PersistedCalculationResult | null;
      if (!calculationResult) {
        toast.error("El cálculo canónico aún no está disponible. Ejecuta el cálculo antes de generar el informe.");
        return;
      }
      if (!calculationResult.source_input_snapshot) {
        toast.error("El cálculo disponible no contiene el snapshot canónico requerido para generar un informe trazable. Vuelve a ejecutar el cálculo.");
        return;
      }

      const { result, inputs, historicals } = mapCanonicalCalculationToPdfData({
        calculationResult,
        companyName: analysis.company_name,
        sector: analysis.sector,
      });

      await generatePDF(result, inputs, "ejecutivo", historicals);
      toast.success("PDF generado y descargado exitosamente.");
    } catch (err: any) {
      console.error("[handleDownloadPDF]", err);
      toast.error("Error al generar el PDF: " + (err.message || "Error desconocido"));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";

  // Document upload sub-view
  if (uploadAnalysisId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <DashboardHeader email={user?.email} onDemo={() => setDemoOpen(true)} />
        <div className="flex">
          <DashboardSidebar active="analisis" onChange={v => { setUploadAnalysisId(null); setView(v); }} onLogout={handleLogout} userName={displayName} />
          <main className="flex-1 p-8 max-w-4xl">
            <button onClick={() => { setUploadAnalysisId(null); fetchAnalyses(); }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm mb-6">
              <ArrowLeft size={16} /> Volver a mis análisis
            </button>
            <DocumentUpload analysisId={uploadAnalysisId} onComplete={() => { setUploadAnalysisId(null); fetchAnalyses(); }} />
          </main>
        </div>
        <DemoDashboard open={demoOpen} onClose={() => setDemoOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader email={user?.email} onDemo={() => setDemoOpen(true)} />
      <div className="flex">
        <DashboardSidebar active={view} onChange={setView} onLogout={handleLogout} userName={displayName} />
        <main className="flex-1 p-8 overflow-auto">
          {loading ? (
            <p className="font-body text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <>
              {view === "inicio" && (
                <DashboardHome
                  displayName={displayName}
                  analyses={analyses}
                  onNavigate={setView}
                  onUpload={id => { setUploadAnalysisId(id); }}
                  statusConfig={statusConfig}
                />
              )}
              {view === "nuevo" && (
                <NewAnalysisStepper userId={user!.id} onComplete={() => { setView("analisis"); fetchAnalyses(); }} />
              )}
              {view === "analisis" && (
                <AnalysisList
                  analyses={analyses}
                  onUpload={id => setUploadAnalysisId(id)}
                  onDelete={handleDelete}
                  onNewAnalysis={() => setView("nuevo")}
                  statusConfig={statusConfig}
                />
              )}
              {view === "reportes" && (
                <ReportsGallery
                  analyses={analyses}
                  onNewAnalysis={() => setView("nuevo")}
                  onDownload={handleDownloadPDF}
                  downloadingId={downloadingId}
                />
              )}
              {view === "perfil" && <UserProfile />}
              {view === "qa" && <QAChecklist />}
            </>
          )}
        </main>
      </div>
      <DemoDashboard open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
};

function DashboardHeader({ email, onDemo }: { email?: string; onDemo: () => void }) {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-4">
          <a href="/" className="font-display text-lg font-bold text-foreground">Velarix</a>
          <span className="text-[10px] font-body text-primary bg-primary/10 px-2 py-0.5 rounded">Plataforma</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onDemo} className="font-body text-xs text-muted-foreground hover:text-foreground">Calculadora demo</button>
          <span className="font-body text-xs text-muted-foreground">{email}</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
