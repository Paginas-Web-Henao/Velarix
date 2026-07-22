import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { evaluarVigencia, formatearFechaVigencia, type VigenciaEstado } from "@/lib/financial-engine";
import { MACRO_COLOMBIA } from "@/data/velarix-datos-2026";

const chartTooltipStyle = {
  background: "#0D1117",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 4,
  fontSize: 12,
  color: "#F5F7FA",
};

const vigenciaColors: Record<VigenciaEstado, { punto: string; texto: string }> = {
  verde: { punto: "bg-emerald-500", texto: "text-muted-foreground" },
  amarillo: { punto: "bg-amber-500", texto: "text-amber-500" },
  rojo: { punto: "bg-red-500", texto: "text-red-500" },
  desconocido: { punto: "bg-muted-foreground", texto: "text-muted-foreground" },
};

const EtiquetaVigencia = ({ ultimaActualizacion, frecuencia, fuente }: { ultimaActualizacion: string; frecuencia: string; fuente: string }) => {
  const v = evaluarVigencia(ultimaActualizacion, frecuencia);
  const c = vigenciaColors[v.estado];

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.punto}`} />
      <span className={`font-body text-[10px] ${c.texto}`}>
        {fuente} · {formatearFechaVigencia(ultimaActualizacion)}
      </span>
      {v.estado === "rojo" && (
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
          Actualización pendiente
        </span>
      )}
      {v.estado === "amarillo" && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Por actualizar
        </span>
      )}
    </div>
  );
};

const DemoMacro = () => {
  // Build chart data from centralized data file
  const charts = Object.entries(MACRO_COLOMBIA).map(([key, param]) => ({
    key,
    label: param.label,
    source: param.fuente,
    frecuencia: param.frecuencia,
    ultimaActualizacion: param.ultimaActualizacion,
    proximaActualizacion: param.proximaActualizacion,
    valorActual: param.valorActual,
    unidad: param.unidad,
    data: param.datos.map(d => ({ period: d.periodo, value: d.valor })),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {charts.map((chart) => {
          const v = evaluarVigencia(chart.ultimaActualizacion, chart.frecuencia);
          return (
            <div key={chart.key} className="metallic-border rounded bg-velarix-bg-tertiary p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display text-sm font-semibold text-foreground">{chart.label}</h4>
                <span className={`text-[9px] font-body px-2 py-0.5 rounded border ${
                  v.estado === "verde"
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : v.estado === "amarillo"
                    ? "bg-amber-950 text-amber-400 border-amber-800"
                    : "bg-red-950 text-red-400 border-red-800"
                }`}>
                  {v.textoEstado}
                </span>
              </div>

              {/* Current value highlight */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-mono text-xl font-bold text-primary">
                  {chart.valorActual.toLocaleString("es-CO")}{chart.unidad === "%" ? "%" : ""}
                </span>
                {chart.unidad !== "%" && (
                  <span className="font-body text-[10px] text-muted-foreground">{chart.unidad}</span>
                )}
              </div>

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
                    <XAxis dataKey="period" tick={{ fontSize: 9, fill: "#A9B4C2" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "#A9B4C2" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2.5, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <EtiquetaVigencia
                ultimaActualizacion={chart.ultimaActualizacion}
                frecuencia={chart.frecuencia}
                fuente={chart.source}
              />
            </div>
          );
        })}
      </div>

      {/* Market data integrity panel */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-3">Integridad de datos de mercado</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="font-body text-[10px] text-muted-foreground mb-1">Fuentes conectadas</p>
            <p className="font-body text-xs text-foreground font-semibold">Banco de la República, DANE, US Treasury</p>
          </div>
          <div>
            <p className="font-body text-[10px] text-muted-foreground mb-1">Última verificación</p>
            <p className="font-body text-xs text-foreground font-semibold">Mar 2026</p>
          </div>
          <div>
            <p className="font-body text-[10px] text-muted-foreground mb-1">Estado de validación</p>
            <p className="font-body text-xs text-emerald-400 font-semibold">✓ Datos vigentes</p>
          </div>
          <div>
            <p className="font-body text-[10px] text-muted-foreground mb-1">Datos Damodaran</p>
            <p className="font-body text-xs text-foreground font-semibold">Enero 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoMacro;
