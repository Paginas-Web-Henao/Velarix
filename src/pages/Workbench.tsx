// Velarix Workbench (ADR-007): interfaz privada de trabajo. Un caso de
// valoración = una fila de `analyses`. Estado de navegación en la URL
// (?case=…&tab=… / ?view=…) para no multiplicar rutas.
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Calculator, ClipboardCheck, FolderOpen, Plus, Settings, ShieldCheck } from "lucide-react";
import { useOwnerSession } from "@/contexts/OwnerSessionContext";
import { supabase } from "@/integrations/supabase/client";
import NewAnalysisStepper from "@/components/dashboard/NewAnalysisStepper";
import QAChecklist from "@/components/dashboard/QAChecklist";
import QuickModel from "@/components/demo/QuickModel";
import AdminReviews from "@/pages/AdminReviews";
import SettingsPanel from "@/components/workbench/SettingsPanel";
import CaseWorkbench, { CASE_TABS, type CaseTab } from "@/components/workbench/CaseWorkbench";
import { CASE_STATUS } from "@/components/workbench/case-status";
import { DataTable, Empty, Panel } from "@/components/workbench/ui";
import { date, fmt } from "@/components/workbench/format";
import type { CaseRow } from "@/components/workbench/useCaseData";

type ToolView = "new" | "reviews" | "qa" | "settings";
type CaseSummary = Pick<CaseRow, "id" | "company_name" | "sector" | "status" | "updated_at" | "moneda_analisis" | "calculation_result">;

const TOOLS: { key: ToolView; label: string; icon: typeof Plus }[] = [
  { key: "new", label: "Nuevo caso", icon: Plus },
  { key: "reviews", label: "Review Center", icon: ShieldCheck },
  { key: "qa", label: "QA Checklist", icon: ClipboardCheck },
  { key: "settings", label: "Settings", icon: Settings },
];

const isCaseTab = (v: string | null): v is CaseTab => CASE_TABS.some((t) => t.key === v);

export default function Workbench() {
  const { user, mode } = useOwnerSession();
  const [params, setParams] = useSearchParams();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickOpen, setQuickOpen] = useState(false);

  const caseId = params.get("case");
  const tabParam = params.get("tab");
  const tab: CaseTab = isCaseTab(tabParam) ? tabParam : "evidence";
  // `?view=account` (antigua vista "Cuenta") se abre como Settings.
  const viewParam = params.get("view") === "account" ? "settings" : params.get("view");
  const view = TOOLS.some((t) => t.key === viewParam) ? (viewParam as ToolView) : null;

  const loadCases = useCallback(async () => {
    const { data, error } = await supabase
      .from("analyses")
      .select("id, company_name, sector, status, updated_at, moneda_analisis, calculation_result")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setCases(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadCases(); }, [loadCases]);

  const openCase = (id: string, nextTab: CaseTab = "evidence") => setParams({ case: id, tab: nextTab });
  const openTool = (t: ToolView) => setParams({ view: t });

  const archiveCase = async (id: string) => {
    const { error } = await supabase.from("analyses").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Caso archivado.");
    setParams({});
    loadCases();
  };

  const valuationOf = (c: CaseSummary) =>
    (c.calculation_result as { valuation?: { enterpriseValue?: number; equityValue?: number } } | null)?.valuation;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Barra superior */}
      <header className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button onClick={() => setParams({})} className="font-display text-sm font-bold">Velarix</button>
          <span className="font-mono text-[10px] text-muted-foreground">VALUATION WORKBENCH</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground" title="Single-owner private mode (ADR-008)">
          {mode === "local_private" ? "LOCAL_PRIVATE" : "DEPLOYED_PRIVATE"}
        </span>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Panel lateral */}
        <aside className="w-60 shrink-0 border-r border-border bg-card/40 flex flex-col">
          <div className="px-3 pt-3 pb-1 flex items-center justify-between">
            <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Casos</span>
            <button onClick={() => openTool("new")} title="Nuevo caso" className="text-muted-foreground hover:text-primary"><Plus size={14} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto px-1">
            {loading ? <p className="px-2 text-xs text-muted-foreground">Cargando…</p> : cases.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground">Sin casos.</p>
            ) : cases.map((c) => {
              const st = CASE_STATUS[c.status] ?? { label: c.status, color: "text-muted-foreground" };
              return (
                <button
                  key={c.id}
                  onClick={() => openCase(c.id)}
                  className={`w-full text-left px-2 py-1.5 rounded ${caseId === c.id ? "bg-primary/10" : "hover:bg-muted/30"}`}
                >
                  <span className="block font-body text-xs text-foreground truncate">{c.company_name}</span>
                  <span className={`block font-mono text-[9px] ${st.color}`}>{st.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="border-t border-border p-1">
            <button onClick={() => setQuickOpen(true)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30">
              <Calculator size={13} /> Quick Model <span className="ml-auto font-mono text-[9px] text-amber-400">no canónico</span>
            </button>
            {TOOLS.filter((t) => t.key !== "new").map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => openTool(key)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs ${view === key ? "text-foreground bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </aside>

        {/* Área principal */}
        <main className="flex-1 min-w-0 overflow-auto">
          {caseId ? (
            <CaseWorkbench key={caseId} caseId={caseId} tab={tab} onTabChange={(t) => openCase(caseId, t)} onArchive={archiveCase} />
          ) : view === "new" ? (
            <div className="p-4 max-w-3xl">
              <NewAnalysisStepper userId={user!.id} onComplete={() => { setParams({}); loadCases(); }} />
            </div>
          ) : view === "reviews" ? (
            <div className="p-4"><AdminReviews embedded /></div>
          ) : view === "qa" ? (
            <div className="p-4"><QAChecklist /></div>
          ) : view === "settings" ? (
            <div className="p-4"><SettingsPanel /></div>
          ) : (
            <div className="p-4 space-y-3">
              <Panel title="Casos de valoración" right={<button onClick={() => openTool("new")} className="flex items-center gap-1 text-xs text-primary hover:underline"><FolderOpen size={12} /> Nuevo caso</button>}>
                {cases.length === 0 ? <Empty>Sin casos todavía. Crea uno con «Nuevo caso».</Empty> : (
                  <DataTable
                    head={["Empresa", "Sector", "Estado", "Moneda", "EV", "Equity", "Actualizado"]}
                    numericFrom={4}
                    rows={cases.map((c) => {
                      const v = valuationOf(c);
                      const st = CASE_STATUS[c.status] ?? { label: c.status, color: "" };
                      return [
                        <button onClick={() => openCase(c.id)} className="text-left text-primary hover:underline">{c.company_name}</button>,
                        c.sector, <span className={st.color}>{st.label}</span>, c.moneda_analisis ?? "—",
                        fmt(v?.enterpriseValue), fmt(v?.equityValue), date(c.updated_at),
                      ];
                    })}
                  />
                )}
              </Panel>
              <p className="font-body text-[11px] text-muted-foreground">
                Evidence ≠ Judgment ≠ Calculation. El motor calcula, la metodología gobierna y el humano decide.
                Metodología, decisiones y case files viven en Obsidian (<code>docs/00-home.md</code>).
              </p>
            </div>
          )}
        </main>
      </div>

      <QuickModel open={quickOpen} onClose={() => setQuickOpen(false)} />
    </div>
  );
}
