// Metadata estructurado del caso (migración 20261015180000). Resumen
// operativo para el Workbench; el narrativo completo vive en el case MOC.
// Cada ítem cita su fuente: nada se muestra sin procedencia.

export interface SourcedItem {
  text: string;
  source: string;
}

export interface BusinessProfile {
  /** Ruta del case MOC (Obsidian), fuente narrativa canónica. */
  moc_path: string | null;
  summary: SourcedItem | null;
  segments: SourcedItem[];
  geographies: SourcedItem[];
  value_drivers: SourcedItem[];
  key_risks: SourcedItem[];
  /** Por qué un bloque está vacío (ausencia conocida, no olvido). */
  gaps: Partial<Record<"summary" | "segments" | "geographies" | "value_drivers" | "key_risks", string>>;
}

const isItem = (v: unknown): v is SourcedItem =>
  !!v && typeof v === "object" && typeof (v as SourcedItem).text === "string" && typeof (v as SourcedItem).source === "string";

/** Lectura defensiva del JSONB: casos legacy o parciales nunca rompen la UI. */
export function parseBusinessProfile(raw: unknown): BusinessProfile | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const list = (k: string) => (Array.isArray(r[k]) ? (r[k] as unknown[]).filter(isItem) : []);
  return {
    moc_path: typeof r.moc_path === "string" ? r.moc_path : null,
    summary: isItem(r.summary) ? r.summary : null,
    segments: list("segments"),
    geographies: list("geographies"),
    value_drivers: list("value_drivers"),
    key_risks: list("key_risks"),
    gaps: r.gaps && typeof r.gaps === "object" ? (r.gaps as BusinessProfile["gaps"]) : {},
  };
}
