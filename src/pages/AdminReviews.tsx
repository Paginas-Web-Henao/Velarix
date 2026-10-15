import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { obtenerRevisiones } from "@/lib/manual-review-api";
import { ArrowLeft, AlertTriangle, Clock, CheckCircle, XCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ESTADO_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  pendiente: { label: "Pendiente", icon: Clock, className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  en_revision: { label: "En revisión", icon: AlertTriangle, className: "bg-primary/15 text-primary border-primary/30" },
  aprobado: { label: "Aprobado", icon: CheckCircle, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  bloqueado: { label: "Bloqueado", icon: XCircle, className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const MOTIVOS: Record<string, string> = {
  cuenta_baja_confianza: "Cuenta con confianza baja",
  validacion_bloqueada: "Validación bloqueada",
  narrativa_fallida: "Auditoría narrativa fallida",
  solicitud_admin: "Solicitud de administrador",
};

// Review Center del workbench (ADR-007): se renderiza embebido en /workbench.
const AdminReviews = ({ embedded = false }: { embedded?: boolean }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [revisiones, setRevisiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");

  useEffect(() => {
    loadReviews();
  }, [filtro]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await obtenerRevisiones(filtro);
      setRevisiones(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtros = [
    { key: "pendiente", label: "Pendientes" },
    { key: "en_revision", label: "En revisión" },
    { key: "todas", label: "Todas" },
  ];

  return (
    <div className={embedded ? "text-foreground" : "min-h-screen bg-background text-foreground"}>
      {!embedded && (
        <div className="border-b border-border bg-card">
          <div className="flex items-center h-14 px-6 gap-4">
            <button onClick={() => navigate("/workbench")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
              <ArrowLeft size={16} /> Workbench
            </button>
          </div>
        </div>
      )}

      <div className={embedded ? "max-w-4xl" : "max-w-4xl mx-auto p-8"}>
        <div className="mb-6">
          <h1 className="font-display text-lg font-semibold mb-1">Review Center</h1>
          <p className="text-muted-foreground text-xs font-body">
            Revisión humana (Judgment) de homologaciones, validaciones bloqueadas y narrativas que no pasaron su auditoría.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {filtros.map((f) => (
            <Button
              key={f.key}
              variant={filtro === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro(f.key)}
              className="font-body text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <p className="text-muted-foreground text-sm font-body">Cargando revisiones...</p>
        ) : revisiones.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm font-body">
                No hay revisiones {filtro === "todas" ? "" : "en estado " + filtro} en este momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {revisiones.map((rev) => {
              const estado = ESTADO_CONFIG[rev.estado] || ESTADO_CONFIG.pendiente;
              const Icon = estado.icon;
              const analysis = rev.analyses;

              return (
                <Card
                  key={rev.id}
                  className={`bg-card border-border hover:border-primary/30 cursor-pointer transition-colors ${
                    rev.prioridad === "urgente" ? "border-destructive/30" : ""
                  }`}
                  onClick={() => navigate(`/workbench/reviews/${rev.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-body text-sm font-semibold text-foreground">
                            {analysis?.company_name || "Empresa sin nombre"}
                          </h3>
                          {rev.prioridad === "urgente" && (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <Zap size={10} /> Urgente
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs font-body mb-2">
                          {analysis?.sector} · {MOTIVOS[rev.reason] || rev.reason}
                        </p>
                        <p className="text-muted-foreground/60 text-[11px] font-body">
                          {new Date(rev.created_at).toLocaleDateString("es-CO", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-[11px] gap-1 ${estado.className}`}>
                        <Icon size={12} />
                        {estado.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
