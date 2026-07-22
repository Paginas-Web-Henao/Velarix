import { DATA_INTEGRITY, SECTOR_BENCHMARKS, SECTOR_KEYS, evaluarVigencia, formatearFechaVigencia, evaluarVigenciaCompleta, type VigenciaEstado } from "@/lib/financial-engine";
import { CheckCircle2, AlertTriangle, Database, Shield } from "lucide-react";

const estadoStyles: Record<VigenciaEstado, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  verde: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-950", label: "✓ Vigente" },
  amarillo: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-950", label: "⚠ Por actualizar" },
  rojo: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-950", label: "✗ Desactualizado" },
  desconocido: { icon: Database, color: "text-muted-foreground", bg: "bg-muted", label: "? Desconocido" },
};

const DemoDataIntegrity = () => {
  const vigenciaCompleta = evaluarVigenciaCompleta();

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className={`metallic-border rounded p-4 flex items-center justify-between ${
        vigenciaCompleta.estadoGeneral === "verde" ? "bg-emerald-950/30 border-emerald-800/30" :
        vigenciaCompleta.estadoGeneral === "amarillo" ? "bg-amber-950/30 border-amber-800/30" :
        "bg-red-950/30 border-red-800/30"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            vigenciaCompleta.estadoGeneral === "verde" ? "bg-emerald-400" :
            vigenciaCompleta.estadoGeneral === "amarillo" ? "bg-amber-400" : "bg-red-400"
          }`} />
          <div>
            <p className="font-display text-sm font-semibold text-foreground">
              Estado general de datos: {vigenciaCompleta.estadoGeneral === "verde" ? "Todos vigentes" :
                vigenciaCompleta.estadoGeneral === "amarillo" ? "Algunos por actualizar" : "Requiere atención"}
            </p>
            <p className="font-body text-[10px] text-muted-foreground">
              Evaluado: {new Date().toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex gap-3 text-[10px] font-body">
          <span className="text-emerald-400">🟢 {vigenciaCompleta.resumen.verdes}</span>
          <span className="text-amber-400">🟡 {vigenciaCompleta.resumen.amarillos}</span>
          <span className="text-red-400">🔴 {vigenciaCompleta.resumen.rojos}</span>
        </div>
      </div>

      {/* Data integrity table with live vigencia */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Integridad de datos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-border">
                <th className="text-left py-2">Fuente</th>
                <th className="text-left py-2">Parámetro</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-left py-2">Última actualización</th>
              </tr>
            </thead>
            <tbody>
              {DATA_INTEGRITY.map((row, i) => {
                const v = evaluarVigencia(row.ultimaActualizacion, row.frecuencia);
                const s = estadoStyles[v.estado];
                return (
                  <tr key={i} className="border-b border-border/20">
                    <td className="py-2 text-muted-foreground text-xs">{row.source}</td>
                    <td className="py-2 text-foreground text-xs">{row.param}</td>
                    <td className="py-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded ${s.bg} ${s.color} border ${
                        v.estado === "verde" ? "border-emerald-800" :
                        v.estado === "amarillo" ? "border-amber-800" : "border-red-800"
                      }`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">
                      {row.lastUpdate}
                      <span className="ml-1 text-[9px] text-muted-foreground/60">
                        ({formatearFechaVigencia(row.ultimaActualizacion)})
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="font-body text-[10px] text-muted-foreground mt-3">
          Frecuencia de actualización: Anual (sectores Damodaran) · Mensual (macro, Rf) · Semanal (EMBI) · Evaluación automática con fecha del sistema
        </p>
      </div>

      {/* Motor vs Governance separation */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
          <h4 className="font-display text-sm font-semibold text-foreground mb-3">
            Motor financiero <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded ml-2">Frontend</span>
          </h4>
          <div className="space-y-2">
            {[
              "Proyecciones financieras a 5 años",
              "Cálculo de KPIs (rentabilidad, estructura, eficiencia)",
              "WACC con re-apalancamiento de beta (CAPM)",
              "DCF: descuento de FCFF año por año",
              "Valor terminal (Gordon Growth Model)",
              "Matriz de sensibilidad (WACC × g)",
              "Escenarios: pesimista / base / optimista",
              "Todas las fórmulas son determinísticas",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-primary shrink-0" />
                <span className="font-body text-[10px] text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
          <h4 className="font-display text-sm font-semibold text-foreground mb-3">
            Gobernanza de datos <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded ml-2">Backend</span>
          </h4>
          <div className="space-y-2">
            {[
              "Actualización de datasets de benchmarks sectoriales",
              "Verificación de frescura de fuentes macro",
              "Validación de consistencia de tablas de sectores",
              "Alertas cuando un parámetro está desactualizado",
              "Mantenimiento del dataset Damodaran (anual)",
              "Trazabilidad de fuentes en el reporte",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-muted-foreground shrink-0" />
                <span className="font-body text-[10px] text-muted-foreground">{item}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
              {["NO calcula proyecciones", "NO razona sobre números en tiempo real", "NO reemplaza ninguna fórmula del motor"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="text-red-400 text-[10px]">✗</span>
                  <span className="font-body text-[10px] text-red-400/70">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sector data freshness */}
      <div className="metallic-border rounded bg-velarix-bg-tertiary p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-3">Cobertura sectorial — {SECTOR_KEYS.length} sectores</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SECTOR_KEYS.map((key) => {
            const bm = SECTOR_BENCHMARKS[key];
            return (
              <div key={key} className="flex items-center justify-between px-3 py-2 rounded bg-background/50">
                <span className="font-body text-[10px] text-foreground">{bm.label}</span>
                <span className="font-body text-[9px] text-muted-foreground">{bm.lastUpdated}</span>
              </div>
            );
          })}
        </div>
        <p className="font-body text-[10px] text-muted-foreground mt-3">
          Fuente base: Damodaran Industry Betas & Multiples (Global) Enero 2026 · Ajustes para contexto Colombia donde aplica
        </p>
      </div>
    </div>
  );
};

export default DemoDataIntegrity;
