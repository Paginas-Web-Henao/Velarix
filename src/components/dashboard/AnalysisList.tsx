import { useState } from "react";
import { Upload, Trash2, Search } from "lucide-react";

interface Analysis {
  id: string;
  company_name: string;
  sector: string;
  status: string;
  expected_growth: number;
  created_at: string;
}

interface Props {
  analyses: Analysis[];
  onUpload: (id: string) => void;
  onDelete: (id: string) => void;
  onNewAnalysis: () => void;
  statusConfig: Record<string, { label: string; color: string }>;
}

type Filter = "all" | "completed" | "inprogress" | "blocked";

const AnalysisList = ({ analyses, onUpload, onDelete, onNewAnalysis, statusConfig }: Props) => {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = analyses.filter(a => {
    if (search && !a.company_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "completed") return a.status === "informe_generado" || a.status === "calculo_completo";
    if (filter === "inprogress") return !["informe_generado", "calculo_completo", "validacion_bloqueada", "error_tecnico"].includes(a.status);
    if (filter === "blocked") return a.status === "validacion_bloqueada" || a.status === "error_tecnico";
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "completed", label: "Completados" },
    { key: "inprogress", label: "En proceso" },
    { key: "blocked", label: "Bloqueados" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Mis análisis</h2>
        <button onClick={onNewAnalysis} className="bg-primary text-primary-foreground font-body text-sm px-4 py-2 rounded hover:bg-primary/90 active:scale-[0.97]">
          + Nuevo análisis
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`font-body text-xs px-3 py-1.5 rounded transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}>{f.label}</button>
        ))}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            className="bg-background metallic-border rounded pl-8 pr-3 py-1.5 text-xs font-body text-foreground focus:outline-none focus:border-primary/50 w-48" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 metallic-border rounded-lg bg-card">
          <p className="font-body text-sm text-muted-foreground">No se encontraron análisis.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const sc = statusConfig[a.status] || { label: a.status, color: "bg-muted text-muted-foreground" };
            return (
              <div key={a.id} className="metallic-border rounded-lg bg-card p-5 flex items-center justify-between hover:border-primary/20 transition-colors">
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
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {a.status === "creado" && (
                    <button onClick={() => onUpload(a.id)} className="flex items-center gap-1 font-body text-xs text-primary hover:underline">
                      <Upload size={14} /> Subir documentos
                    </button>
                  )}
                  <button onClick={() => onDelete(a.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnalysisList;
