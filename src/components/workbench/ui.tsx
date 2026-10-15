// Primitivas del Workbench (ADR-007): densidad útil, jerarquía clara y la
// capa de cada número visible (Evidence / Judgment / Calculation).
import type { ReactNode } from "react";

export type Layer = "EVIDENCE" | "JUDGMENT" | "CALCULATION";

const LAYER_STYLE: Record<Layer, string> = {
  EVIDENCE: "text-sky-300 bg-sky-500/10 border-sky-500/30",
  JUDGMENT: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  CALCULATION: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
};

export function LayerTag({ layer }: { layer: Layer }) {
  return (
    <span className={`inline-block border rounded px-1 py-px font-mono text-[9px] tracking-wide ${LAYER_STYLE[layer]}`}>
      {layer}
    </span>
  );
}

export function Panel({ title, layer, right, children }: { title: string; layer?: Layer; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="border border-border rounded bg-card/60">
      <header className="flex items-center justify-between gap-2 px-3 h-8 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-body text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
          {layer && <LayerTag layer={layer} />}
        </div>
        {right}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

/** Estado vacío honesto: dice qué falta y dónde vive hoy esa información. */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="font-body text-xs text-muted-foreground italic">{children}</p>;
}

export function KV({ rows }: { rows: { k: string; v: ReactNode; layer?: Layer }[] }) {
  return (
    <dl className="grid grid-cols-[minmax(140px,max-content)_1fr] gap-x-4 gap-y-1">
      {rows.map((r) => (
        <div key={r.k} className="contents">
          <dt className="font-body text-xs text-muted-foreground">{r.k}</dt>
          <dd className="font-mono text-xs text-foreground tabular-nums flex items-center gap-2">
            <span>{r.v}</span>
            {r.layer && <LayerTag layer={r.layer} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DataTable({ head, rows, numericFrom = 1 }: { head: ReactNode[]; rows: ReactNode[][]; numericFrom?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-border">
            {head.map((h, i) => (
              <th key={i} className={`px-2 py-1 font-body font-medium text-muted-foreground whitespace-nowrap ${i >= numericFrom ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-border/40 hover:bg-muted/20">
              {r.map((c, ci) => (
                <td key={ci} className={`px-2 py-1 whitespace-nowrap ${ci >= numericFrom ? "text-right font-mono tabular-nums" : "font-body"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
