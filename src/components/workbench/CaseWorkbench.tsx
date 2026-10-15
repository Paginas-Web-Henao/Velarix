// Vista de un caso: cabecera fija (A. CASE) + pestañas B–K.
import { RefreshCw } from "lucide-react";
import { useCaseData } from "./useCaseData";
import {
  AccountsSection, AuditSection, ChallengeSection, EvidenceSection, ForecastSection,
  JudgmentSection, OutputSection, QuestionsSection, UnderstandingSection, ValuationSection,
} from "./CaseSections";
import { CASE_STATUS } from "./case-status";
import { date, fmt } from "./format";

export const CASE_TABS = [
  { key: "evidence", label: "Evidence", Component: EvidenceSection },
  { key: "business", label: "Business", Component: UnderstandingSection },
  { key: "accounts", label: "Accounts", Component: AccountsSection },
  { key: "questions", label: "Questions", Component: QuestionsSection },
  { key: "judgment", label: "Judgment", Component: JudgmentSection },
  { key: "forecast", label: "Forecast", Component: ForecastSection },
  { key: "valuation", label: "Valuation", Component: ValuationSection },
  { key: "challenge", label: "Challenge", Component: ChallengeSection },
  { key: "output", label: "Output", Component: OutputSection },
  { key: "audit", label: "Audit trail", Component: AuditSection },
] as const;

export type CaseTab = (typeof CASE_TABS)[number]["key"];

interface Props {
  caseId: string;
  tab: CaseTab;
  onTabChange: (tab: CaseTab) => void;
  onArchive: (caseId: string) => void;
}

export default function CaseWorkbench({ caseId, tab, onTabChange, onArchive }: Props) {
  const { data, loading, error, reload } = useCaseData(caseId);
  const a = data.analysis;
  const cr = data.calculation;
  const status = a ? CASE_STATUS[a.status] ?? { label: a.status, color: "text-muted-foreground" } : null;
  const Active = CASE_TABS.find((t) => t.key === tab)?.Component ?? EvidenceSection;

  if (error) return <p className="p-4 text-xs text-destructive">Error cargando el caso: {error}</p>;
  if (!a) return <p className="p-4 text-xs text-muted-foreground">{loading ? "Cargando caso…" : "Caso no encontrado o sin acceso."}</p>;

  return (
    <div className="flex flex-col min-h-0">
      {/* A. CASE */}
      <div className="border-b border-border bg-card/40 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-base font-semibold text-foreground truncate">{a.company_name}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 font-mono text-[10px] text-muted-foreground">
              <span>{a.sector}</span>
              <span>moneda {a.moneda_analisis ?? "—"}</span>
              <span>período base {cr?.source_input_snapshot?.base_period ?? "—"}</span>
              <span title="No hay columna en BD: se documenta en el case MOC">fecha de valoración —</span>
              <span title="No hay columna en BD: se documenta en el case MOC">basis of value —</span>
              <span className={status?.color}>{status?.label}</span>
              <span>actualizado {date(a.updated_at)}</span>
              {cr?.valuation && <span className="text-foreground">EV {fmt(cr.valuation.enterpriseValue)} · Equity {fmt(cr.valuation.equityValue)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={reload} title="Recargar" className="text-muted-foreground hover:text-foreground"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
            <button
              onClick={() => { if (window.confirm(`¿Archivar el caso "${a.company_name}"? (borrado lógico)`)) onArchive(a.id); }}
              className="text-[10px] text-muted-foreground hover:text-destructive"
            >
              Archivar
            </button>
          </div>
        </div>
        <nav className="mt-2 flex gap-1 overflow-x-auto">
          {CASE_TABS.map((t, i) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={`px-2.5 h-7 rounded-t font-body text-xs whitespace-nowrap border-b-2 ${
                tab === t.key ? "border-primary text-foreground bg-muted/30" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="font-mono text-[9px] text-muted-foreground mr-1">{String.fromCharCode(66 + i)}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-4 overflow-auto">
        <Active data={data} reload={reload} />
      </div>
    </div>
  );
}
