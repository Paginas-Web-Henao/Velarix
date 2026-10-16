import { useState, useCallback, useEffect, type DragEvent, type ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertTriangle, Loader2, Play, FileText, Info } from "lucide-react";
import { interpretPipelineResponse, type PipelineOutcome } from "@/lib/evidence-pipeline";

interface Props {
  analysisId: string;
  /** El pipeline de Evidence se está lanzando (antes de esperar la respuesta). */
  onStarted?: () => void;
  /** El servidor respondió (o no hubo respuesta: `uncertain`). */
  onFinished?: (outcome: PipelineOutcome) => void;
  /** El caso ya tiene un cálculo oficial: no se reprocesa y los documentos nuevos quedan fuera de él. */
  calculated?: boolean;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];
const MAX_SIZE = 10 * 1024 * 1024;

// `estados_financieros`: un archivo con varios estados (p. ej. balance + resultados + flujo de caja).
type DocType = "estado_resultados" | "balance_general" | "estados_financieros";

interface UploadedDoc {
  id: string;
  filename: string;
  docType: DocType;
  status: string;
}

interface ContentDetection {
  tieneEstadoResultados: boolean;
  tieneBalanceGeneral: boolean;
  tieneAmbos: boolean;
}

const DocumentUpload = ({ analysisId, onStarted, onFinished, calculated = false }: Props) => {
  const [uploads, setUploads] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [contentDetection, setContentDetection] = useState<ContentDetection | null>(null);
  const [conversionNote, setConversionNote] = useState<string | null>(null);
  const [excludedNotice, setExcludedNotice] = useState<string | null>(null);

  const uploadFile = async (file: File, docType: DocType) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`Formato no soportado: ${file.name}. Acepta PDF, Excel o CSV.`);
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(`${file.name} excede el límite de 10MB.`);
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sesión expirada."); return; }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("analysis_id", analysisId);
      formData.append("doc_type", docType);

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-document`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: formData,
      });

      const result = await resp.json();
      if (!resp.ok || !result.success) {
        toast.error(result.error?.message || "Error al cargar el documento.");
        return;
      }

      const newDoc: UploadedDoc = {
        id: result.data.document_id,
        filename: file.name,
        docType,
        status: "cargado",
      };

      setUploads((prev) => [...prev, newDoc]);

      // Check content detection from parse response
      if (result.data?.contenido_detectado) {
        const cd = result.data.contenido_detectado;
        setContentDetection(cd);
        if (cd.tieneAmbos) {
          toast.success(`${file.name} contiene Estado de Resultados y Balance General.`);
        } else {
          toast.success(`${file.name} cargado correctamente.`);
        }
      } else {
        toast.success(`${file.name} cargado correctamente.`);
      }

      if (result.data?.nota_conversion) {
        setConversionNote(result.data.nota_conversion);
      }

      // Documento subido a un caso ya calculado: queda cargado pero fuera del cálculo oficial existente.
      if (result.data?.excluded_from_calculation && result.data?.warning) {
        setExcludedNotice(result.data.warning);
        toast.warning(result.data.warning);
      }
    } catch (e: any) {
      toast.error(e.message || "Error de red al cargar el documento.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: DragEvent, docType: DocType) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file, docType);
  }, [analysisId]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>, docType: DocType) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, docType);
  };

  const hasCombined = uploads.some((u) => u.docType === "estados_financieros");
  const hasER = uploads.some((u) => u.docType === "estado_resultados") || hasCombined || contentDetection?.tieneEstadoResultados;
  const hasBG = uploads.some((u) => u.docType === "balance_general") || hasCombined || contentDetection?.tieneBalanceGeneral;
  const hasAmbos = contentDetection?.tieneAmbos;
  const canRunPipeline = (hasER && hasBG) || hasAmbos || uploads.length > 0;

  // Pipeline de EVIDENCE: parsea → homologa → valida y se detiene. No construye
  // el input del motor ni calcula.
  const runPipeline = async () => {
    if (calculated) return;
    setPipelineRunning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesión expirada.");
        onFinished?.({ ok: false, message: "Sesión expirada." });
        return;
      }
      onStarted?.();

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-analysis-pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysis_id: analysisId }),
      });
      const body = await resp.json().catch(() => null);
      const outcome = interpretPipelineResponse(resp.ok, resp.status, body);
      if (!outcome.ok) toast.error(outcome.message);
      else toast.success("Evidence procesada.");
      onFinished?.(outcome);
    } catch (e: any) {
      // Sin respuesta HTTP (red/timeout): el pipeline pudo seguir en el servidor;
      // el progreso real lo da el estado del caso.
      toast.warning("No se recibió respuesta del servidor. El avance se sigue por el estado del caso.");
      onFinished?.({ ok: false, uncertain: true, message: e?.message });
    } finally {
      setPipelineRunning(false);
    }
  };

  const dropZone = (docType: DocType, label: string, uploaded: boolean, disabled: boolean = false) => (
    <div
      onDrop={(e) => !disabled && handleDrop(e, docType)}
      onDragOver={(e) => e.preventDefault()}
      className={`metallic-border rounded-lg p-6 text-center transition-colors ${
        uploaded ? "bg-green-950/20 border-green-800/30" :
        disabled ? "bg-muted/10 border-muted/20 opacity-50" :
        "bg-card hover:border-primary/30"
      }`}
    >
      {uploaded ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="text-green-400" size={24} />
          <p className="font-body text-sm text-green-400">{label} detectado</p>
          <p className="font-body text-[10px] text-muted-foreground">
            {uploads.find((u) => u.docType === docType)?.filename || "Detectado en archivo combinado"}
          </p>
        </div>
      ) : (
        <label className={`flex flex-col items-center gap-3 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
          <Upload className="text-muted-foreground" size={24} />
          <div>
            <p className="font-body text-sm text-foreground">{label}</p>
            <p className="font-body text-[10px] text-muted-foreground mt-1">
              {disabled ? "No necesario — detectado en el archivo cargado" : "Arrastra o haz clic · PDF, Excel, CSV · Máx 10MB"}
            </p>
          </div>
          {!disabled && (
            <input type="file" className="hidden" accept=".pdf,.xlsx,.xls,.csv"
              onChange={(e) => handleFileSelect(e, docType)} disabled={uploading} />
          )}
        </label>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Cargar estados financieros</h2>
        <p className="font-body text-sm text-muted-foreground">
          Sube el estado de resultados y el balance general. Si tu archivo contiene ambos, solo necesitas cargarlo una vez.
        </p>
      </div>

      {calculated && (
        <div className="rounded-lg border border-amber-800/30 bg-amber-950/20 p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-400 mt-0.5 shrink-0" size={18} />
          <p className="font-body text-xs text-amber-300">
            Este caso ya tiene un cálculo oficial. Los documentos que cargues ahora NO forman parte de ese cálculo hasta una futura
            ejecución o versionado explícitos, y el pipeline de Evidence no reprocesa casos calculados.
          </p>
        </div>
      )}
      {excludedNotice && (
        <div className="rounded-lg border border-amber-800/30 bg-amber-950/10 p-3 text-xs text-amber-300" role="status">{excludedNotice}</div>
      )}

      {/* Content detection message */}
      {hasAmbos && (
        <div className="rounded-lg border border-green-800/30 bg-green-950/20 p-4 flex items-start gap-3">
          <FileText className="text-green-400 mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-body text-sm text-green-400 font-medium">
              ✓ Tu archivo contiene tanto el Estado de Resultados como el Balance General.
            </p>
            <p className="font-body text-[11px] text-muted-foreground mt-1">
              No necesitas cargar un segundo archivo. Puedes procesar la Evidence directamente.
            </p>
          </div>
        </div>
      )}

      {/* Conversion note */}
      {conversionNote && (
        <div className="rounded-lg border border-blue-800/20 bg-blue-950/10 p-3 flex items-center gap-2">
          <Info className="text-blue-400 shrink-0" size={16} />
          <p className="font-body text-xs text-blue-300">{conversionNote}</p>
        </div>
      )}

      {dropZone("estados_financieros", "Estados financieros / archivo combinado", hasCombined)}

      <div className="grid grid-cols-2 gap-4">
        {dropZone("estado_resultados", "Estado de resultados",
          !!(hasER), (hasAmbos || hasCombined) && !uploads.some(u => u.docType === "estado_resultados"))}
        {dropZone("balance_general", "Balance general / Estado de situación financiera",
          !!(hasBG), (hasAmbos || hasCombined) && !uploads.some(u => u.docType === "balance_general"))}
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-primary">
          <Loader2 size={16} className="animate-spin" />
          <span className="font-body text-sm">Cargando documento...</span>
        </div>
      )}

      {/* Pipeline execution */}
      <div className="metallic-border rounded-lg bg-card p-6">
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">Procesar Evidence</h3>
        <p className="font-body text-xs text-muted-foreground mb-4">
          El sistema: parsea documentos → homologa cuentas (IA) → valida consistencia, y se detiene ahí. No construye el input
          del motor ni calcula: el Judgment y el cálculo son pasos posteriores y explícitos.
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={runPipeline}
            disabled={!canRunPipeline || pipelineRunning || calculated}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-sm px-5 py-2.5 rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pipelineRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {pipelineRunning ? "Procesando..." : "Procesar Evidence"}
          </button>

          {!canRunPipeline && !calculated && (
            <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle size={12} className="text-yellow-400" />
              Sube al menos un documento para continuar
            </p>
          )}
        </div>
      </div>

      {/* Formats info */}
      <div className="metallic-border rounded-lg bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-xs font-semibold text-foreground mb-3">Formatos aceptados</h4>
        <div className="grid grid-cols-4 gap-3">
          {[
            { ext: "PDF", desc: "Texto seleccionable" },
            { ext: "XLSX", desc: "Excel moderno" },
            { ext: "XLS", desc: "Excel clásico" },
            { ext: "CSV", desc: "Valores separados" },
          ].map((f) => (
            <div key={f.ext} className="text-center p-3 rounded bg-muted/20">
              <p className="font-display text-xs font-bold text-primary">{f.ext}</p>
              <p className="font-body text-[9px] text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
        <p className="font-body text-[10px] text-muted-foreground mt-3">
          No se soportan imágenes escaneadas sin OCR, archivos .docx ni archivos protegidos con contraseña.
        </p>
      </div>
    </div>
  );
};

export default DocumentUpload;
