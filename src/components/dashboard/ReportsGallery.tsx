import { useState } from "react";
import { FileText, Download, LayoutGrid, List, Loader2 } from "lucide-react";

interface Analysis {
  id: string;
  company_name: string;
  sector: string;
  status: string;
  created_at: string;
}

interface Props {
  analyses: Analysis[];
  onNewAnalysis: () => void;
  onDownload?: (id: string) => void;
  downloadingId?: string | null;
}

const ReportsGallery = ({ analyses, onNewAnalysis, onDownload, downloadingId }: Props) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const completedAnalyses = analyses.filter(a => a.status === "informe_generado" || a.status === "calculo_completo");

  const formatReportName = (a: Analysis) => {
    const d = new Date(a.created_at);
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `Reporte · ${a.company_name} · ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  if (completedAnalyses.length === 0) {
    return (
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-6">Mis reportes</h2>
        <div className="text-center py-16 metallic-border rounded-lg bg-card">
          <FileText size={32} className="text-muted-foreground mx-auto mb-4" />
          <p className="font-body text-sm text-muted-foreground mb-2">Aún no tienes reportes generados.</p>
          <p className="font-body text-xs text-muted-foreground mb-4">
            Carga los estados financieros de tu empresa y ejecuta tu primer análisis para recibir un reporte institucional.
          </p>
          <button onClick={onNewAnalysis} className="bg-primary text-primary-foreground font-body text-sm px-5 py-2 rounded hover:bg-primary/90 active:scale-[0.97]">
            + Crear primer análisis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Mis reportes</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedAnalyses.map(a => (
            <div key={a.id} className="metallic-border rounded-lg bg-card overflow-hidden hover:border-primary/20 transition-colors">
              <div className="bg-primary h-2" />
              <div className="p-5">
                <p className="font-display text-xs font-bold text-primary mb-1">VELARIX</p>
                <p className="font-body text-[10px] text-muted-foreground mb-3">Reporte de Valoración Empresarial</p>
                <h3 className="font-display text-sm font-semibold text-foreground mb-1">{a.company_name}</h3>
                <p className="font-body text-xs text-muted-foreground">{a.sector}</p>
                <div className="border-t border-border mt-4 pt-3 flex items-center justify-between">
                  <p className="font-body text-[10px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <button
                    onClick={() => onDownload?.(a.id)}
                    disabled={downloadingId === a.id}
                    className="flex items-center gap-1 font-body text-[10px] text-primary hover:underline disabled:opacity-50"
                  >
                    {downloadingId === a.id
                      ? <><Loader2 size={12} className="animate-spin" /> Generando...</>
                      : <><Download size={12} /> Descargar PDF</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="metallic-border rounded-lg bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-body text-[10px] text-muted-foreground uppercase tracking-wide px-4 py-3">Reporte</th>
                <th className="text-left font-body text-[10px] text-muted-foreground uppercase tracking-wide px-4 py-3">Sector</th>
                <th className="text-left font-body text-[10px] text-muted-foreground uppercase tracking-wide px-4 py-3">Fecha</th>
                <th className="text-right font-body text-[10px] text-muted-foreground uppercase tracking-wide px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {completedAnalyses.map(a => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-body text-xs text-foreground">{formatReportName(a)}</td>
                  <td className="px-4 py-3 font-body text-xs text-muted-foreground">{a.sector}</td>
                  <td className="px-4 py-3 font-body text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDownload?.(a.id)}
                      disabled={downloadingId === a.id}
                      className="flex items-center gap-1 font-body text-[10px] text-primary hover:underline ml-auto disabled:opacity-50"
                    >
                      {downloadingId === a.id
                        ? <><Loader2 size={12} className="animate-spin" /> Generando...</>
                        : <><Download size={12} /> Descargar</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportsGallery;
