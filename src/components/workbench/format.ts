// Formato numérico del workbench (es-CO). "—" cuando no hay dato: nunca 0.
const NF0 = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const NF2 = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

export const fmt = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? NF0.format(v) : "—");
export const fmt2 = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? NF2.format(v) : "—");
export const pct = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? `${NF2.format(v)}%` : "—");
export const date = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString("es-CO", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
