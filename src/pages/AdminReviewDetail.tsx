import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  obtenerDetalleRevision,
  tomarRevision,
  corregirCuenta,
  aprobarRevision,
  bloquearRevision,
} from "@/lib/manual-review-api";
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TAXONOMIA = [
  { value: "revenue", label: "Ingresos (revenue)" },
  { value: "cost_of_sales", label: "Costo de ventas" },
  { value: "opex", label: "Gastos operativos (opex)" },
  { value: "da", label: "Depreciación y amortización" },
  { value: "ebitda", label: "EBITDA" },
  { value: "ebit", label: "EBIT" },
  { value: "interest_expense", label: "Gastos financieros" },
  { value: "taxes", label: "Impuestos" },
  { value: "net_income", label: "Utilidad neta" },
  { value: "cash", label: "Caja y equivalentes" },
  { value: "accounts_receivable", label: "Cuentas por cobrar" },
  { value: "inventory", label: "Inventarios" },
  { value: "total_current_assets", label: "Total activos corrientes" },
  { value: "ppe", label: "Propiedad planta y equipo" },
  { value: "total_assets", label: "Total activos" },
  { value: "accounts_payable", label: "Cuentas por pagar" },
  { value: "current_financial_debt", label: "Deuda financiera CP" },
  { value: "long_term_financial_debt", label: "Deuda financiera LP" },
  { value: "total_liabilities", label: "Total pasivos" },
  { value: "equity", label: "Patrimonio" },
  { value: "sin_mapear", label: "— No mapear (descartar)" },
];

const AdminReviewDetail = () => {
  const { revisionId } = useParams<{ revisionId: string }>();
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [corrections, setCorrections] = useState<Record<string, { canonical_account?: string; justificacion?: string }>>({});
  const [notasResolucion, setNotasResolucion] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (revisionId) loadDetail();
  }, [revisionId]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await obtenerDetalleRevision(revisionId!);
      setDetalle(data);
      if (data.revision.estado === "pendiente") {
        try { await tomarRevision(revisionId!); } catch {}
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCorrection = (id: string, field: string, value: string) => {
    setCorrections((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleApplyCorrection = async (homologationId: string) => {
    const c = corrections[homologationId];
    if (!c?.canonical_account) { toast.error("Selecciona la cuenta canónica."); return; }
    if (!c?.justificacion || c.justificacion.length < 10) { toast.error("Justificación mínimo 10 caracteres."); return; }
    setProcessing(true);
    try {
      await corregirCuenta({
        revisionId: revisionId!,
        homologationId,
        nuevoCanonicalAccount: c.canonical_account === "sin_mapear" ? null : c.canonical_account,
        justificacion: c.justificacion,
      });
      toast.success("Cuenta corregida.");
      await loadDetail();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (notasResolucion.trim().length < 20) { toast.error("Notas mínimo 20 caracteres."); return; }
    setProcessing(true);
    try {
      await aprobarRevision({ revisionId: revisionId!, notas: notasResolucion });
      toast.success("Revisión aprobada. El flujo continuará automáticamente.");
      setTimeout(() => navigate("/admin/revisiones"), 1500);
    } catch (err: any) {
      toast.error(err.message);
      setProcessing(false);
    }
  };

  const handleBlock = async () => {
    if (notasResolucion.trim().length < 20) { toast.error("Motivo mínimo 20 caracteres."); return; }
    if (!confirm("¿Confirmas que quieres bloquear este análisis definitivamente?")) return;
    setProcessing(true);
    try {
      await bloquearRevision({ revisionId: revisionId!, motivoBloqueo: notasResolucion });
      toast.success("Análisis bloqueado definitivamente.");
      setTimeout(() => navigate("/admin/revisiones"), 1500);
    } catch (err: any) {
      toast.error(err.message);
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Cargando detalle...</p></div>;
  if (!detalle) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-destructive text-sm">Revisión no encontrada.</p></div>;

  const { revision, cuentas_homologadas, validaciones_fallidas } = detalle;
  const analysis = revision.analyses;
  const cuentasCriticas = cuentas_homologadas.filter(
    (c: any) => c.confidence_score === "baja" || c.confidence_score === "media" || c.ambiguity_flag
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card">
        <div className="flex items-center h-14 px-6 gap-4">
          <button onClick={() => navigate("/admin/revisiones")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft size={16} /> Revisiones
          </button>
          <span className="font-display text-lg font-bold">{analysis?.company_name || "Detalle"}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 space-y-6">
        {/* Header info */}
        <div>
          <p className="text-muted-foreground text-sm font-body">
            {analysis?.sector} · Motivo: {revision.reason}
          </p>
        </div>

        {/* Failed validations */}
        {validaciones_fallidas.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-body flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                Validaciones fallidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {validaciones_fallidas.map((v: any) => (
                <div
                  key={v.id}
                  className={`rounded-md p-3 text-xs font-body ${
                    v.severity === "critica"
                      ? "bg-destructive/10 border border-destructive/20 text-destructive"
                      : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                  }`}
                >
                  <span className="font-semibold">[{v.rule_code}] {v.severity}</span>
                  {v.detail && <p className="mt-1 text-muted-foreground">{v.detail}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Accounts needing correction */}
        {cuentasCriticas.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-body flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                Cuentas que requieren corrección ({cuentasCriticas.length})
              </CardTitle>
              <p className="text-muted-foreground text-xs font-body">
                Revisa el mapeo de cada cuenta y aplica la corrección si corresponde.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {cuentasCriticas.map((cuenta: any) => {
                const c = corrections[cuenta.id] || {};
                const scoreColor =
                  cuenta.confidence_score === "alta" ? "text-emerald-400" :
                  cuenta.confidence_score === "media" ? "text-amber-400" : "text-destructive";

                return (
                  <div key={cuenta.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-muted-foreground text-[11px] font-body">Texto original:</p>
                      <p className="text-foreground text-sm font-semibold font-body">"{cuenta.original_label}"</p>
                      <div className="flex gap-3 mt-1 text-xs font-body">
                        <span className="text-muted-foreground">
                          Mapeo: <span className="text-foreground font-medium">{cuenta.canonical_account || "Sin mapear"}</span>
                        </span>
                        <span className={`font-semibold ${scoreColor}`}>
                          Score: {cuenta.confidence_score}
                        </span>
                        {cuenta.ambiguity_flag && (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">⚠ Ambigua</Badge>
                        )}
                      </div>
                      {cuenta.mapping_notes && (
                        <p className="text-muted-foreground/60 text-[11px] italic mt-1">{cuenta.mapping_notes}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Select
                        value={c.canonical_account ?? cuenta.canonical_account ?? ""}
                        onValueChange={(v) => handleCorrection(cuenta.id, "canonical_account", v)}
                      >
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue placeholder="Cuenta canónica correcta" />
                        </SelectTrigger>
                        <SelectContent>
                          {TAXONOMIA.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-xs">
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Textarea
                        placeholder="Justificación (mínimo 10 caracteres)..."
                        value={c.justificacion || ""}
                        onChange={(e) => handleCorrection(cuenta.id, "justificacion", e.target.value)}
                        className="text-xs min-h-[50px]"
                      />

                      <Button
                        size="sm"
                        onClick={() => handleApplyCorrection(cuenta.id)}
                        disabled={processing}
                        className="text-xs"
                      >
                        Aplicar corrección
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Resolution */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-body">Resolución</CardTitle>
            <p className="text-muted-foreground text-xs font-body">
              Documenta tu decisión y confirma. Ambas acciones quedan registradas en auditoría.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-muted-foreground text-xs font-body block mb-2">
                Notas de resolución (obligatorio · mínimo 20 caracteres):
              </label>
              <Textarea
                value={notasResolucion}
                onChange={(e) => setNotasResolucion(e.target.value)}
                placeholder="Documenta el criterio de tu decisión, las correcciones aplicadas y observaciones..."
                className="min-h-[100px] text-sm"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle size={16} className="mr-2" />
                {processing ? "Procesando..." : "Aprobar y continuar análisis"}
              </Button>

              <Button
                variant="outline"
                onClick={handleBlock}
                disabled={processing}
                className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <XCircle size={16} className="mr-2" />
                Bloquear definitivamente
              </Button>
            </div>

            <p className="text-muted-foreground/50 text-[11px] font-body">
              Al aprobar, el análisis continuará desde donde fue detenido. Al bloquear, queda cerrado y el usuario es notificado.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReviewDetail;
