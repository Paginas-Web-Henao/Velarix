import { BarChart3, FileText, Clock, Building2, PlusCircle, Upload } from "lucide-react";
import type { DashboardView } from "./DashboardSidebar";

interface Analysis {
  id: string;
  company_name: string;
  sector: string;
  status: string;
  expected_growth: number;
  created_at: string;
}

interface Props {
  displayName: string;
  analyses: Analysis[];
  onNavigate: (view: DashboardView) => void;
  onUpload: (id: string) => void;
  statusConfig: Record<string, { label: string; color: string }>;
}

const DashboardHome = ({ displayName, analyses, onNavigate, onUpload, statusConfig }: Props) => {
  const completedCount = analyses.filter(a => a.status === "informe_generado").length;
  const lastAnalysis = analyses[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Bienvenido, {displayName}.</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Gestiona tus análisis de valoración empresarial</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BarChart3, label: "Análisis realizados", value: String(analyses.length) },
          { icon: FileText, label: "Reportes generados", value: String(completedCount) },
          { icon: Clock, label: "Último análisis", value: lastAnalysis ? new Date(lastAnalysis.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—" },
          { icon: Building2, label: "Sector principal", value: lastAnalysis?.sector || "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="metallic-border rounded-lg bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className="text-primary" />
              <p className="font-body text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
            <p className="font-display text-xl font-bold text-foreground truncate">{value}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => onNavigate("nuevo")}
        className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-sm px-6 py-3 rounded hover:bg-primary/90 transition-colors active:scale-[0.97] mb-8"
      >
        <PlusCircle size={16} /> Nuevo análisis
      </button>

      {analyses.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Análisis recientes</h2>
          <div className="space-y-3">
            {analyses.slice(0, 3).map(a => {
              const sc = statusConfig[a.status] || { label: a.status, color: "bg-muted text-muted-foreground" };
              return (
                <div key={a.id} className="metallic-border rounded-lg bg-card p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display text-sm font-semibold text-foreground truncate">{a.company_name}</h3>
                      <span className="font-body text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">{a.sector}</span>
                      <span className={`font-body text-[10px] px-2 py-0.5 rounded ${sc.color}`}>{sc.label}</span>
                    </div>
                    <p className="font-body text-[10px] text-muted-foreground mt-1">
                      {new Date(a.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })} · Crecimiento: {a.expected_growth}%
                    </p>
                  </div>
                  {a.status === "creado" && (
                    <button onClick={() => onUpload(a.id)} className="flex items-center gap-1 font-body text-xs text-primary hover:underline">
                      <Upload size={14} /> Subir documentos
                    </button>
                  )}
                </div>
              );
            })}
            {analyses.length > 3 && (
              <button onClick={() => onNavigate("analisis")} className="font-body text-xs text-primary hover:underline">
                Ver todos los análisis →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
