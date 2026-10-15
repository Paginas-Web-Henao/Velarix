// Secciones B–K del caso (A es la cabecera en CaseWorkbench). Solo leen lo
// que ya existe en Supabase y en el envelope del cálculo canónico; nunca
// recalculan ni rellenan supuestos. Donde no hay tabla para algo, se dice.
import { useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import DocumentUpload from "@/components/dashboard/DocumentUpload";
import { downloadCanonicalPdf } from "@/lib/canonical-pdf-download";
import type { PersistedCalculationResult, ResolvedCalculationAssumptions } from "@/types/calculation-result";
import { evaluateMinimumExpedienteCheckpoint } from "../../../supabase/functions/_shared/minimum-expediente-checkpoint";
import type { CaseData } from "./useCaseData";
import { DataTable, Empty, KV, type Layer, LayerTag, Panel } from "./ui";
import { date, fmt, fmt2, pct } from "./format";

interface SectionProps {
  data: CaseData;
  reload: () => void;
}

const noCalc = (
  <Empty>
    Este caso no tiene un <code>calculation_result</code> canónico persistido. Se genera al ejecutar el cálculo por
    <code> ejecutar-calculo</code> (checkpoint del Expediente + preflight + motor canónico).
  </Empty>
);

// ── B. EVIDENCE ────────────────────────────────────────────────────────────
export function EvidenceSection({ data, reload }: SectionProps) {
  const [uploading, setUploading] = useState(false);
  const cr = data.calculation;
  const snap = cr?.source_input_snapshot;
  const prov = cr?.provenance;

  if (uploading && data.analysis) {
    return (
      <Panel title="Cargar estados financieros" layer="EVIDENCE" right={<button onClick={() => setUploading(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>}>
        <DocumentUpload analysisId={data.analysis.id} onComplete={() => { setUploading(false); reload(); }} />
      </Panel>
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Panel
        title="Documentos"
        layer="EVIDENCE"
        right={<button onClick={() => setUploading(true)} className="flex items-center gap-1 text-xs text-primary hover:underline"><Upload size={12} /> Cargar</button>}
      >
        {data.documents.length === 0 ? <Empty>Sin documentos cargados.</Empty> : (
          <DataTable
            head={["Archivo", "Tipo declarado", "Estado", "Cargado"]}
            numericFrom={9}
            rows={data.documents.map((d) => [d.original_filename, d.doc_type_declared ?? "—", d.processing_status, date(d.uploaded_at)])}
          />
        )}
      </Panel>

      <Panel title="Provenance" layer="EVIDENCE">
        {!prov ? <Empty>Sin provenance: no hay cálculo canónico persistido.</Empty> : (
          <div className="space-y-2">
            <KV rows={[
              { k: "Estado global", v: prov.overall_status },
              { k: "Período base", v: prov.period_selection?.base_period ?? snap?.base_period ?? "—" },
              { k: "Modo de selección", v: prov.period_selection?.selection_mode ?? "—" },
              { k: "Moneda análisis / documento", v: `${prov.currency?.moneda_analisis ?? "—"} / ${prov.currency?.moneda_documento ?? "—"}` },
              { k: "Factor de conversión", v: fmt2(prov.currency?.factor_conversion) },
              { k: "Documentos / homologaciones", v: `${prov.document_ids?.length ?? 0} / ${prov.homologation_ids?.length ?? 0}` },
            ]} />
            {prov.warnings?.length > 0 && (
              <ul className="list-disc pl-4 text-xs text-amber-300">{prov.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            )}
          </div>
        )}
      </Panel>

      <Panel title="Estados financieros observados (source_input_snapshot)" layer="EVIDENCE">
        {!snap ? <Empty>Sin snapshot de Evidence.</Empty> : (
          <div className="grid gap-4 md:grid-cols-2">
            <DataTable head={["Estado de resultados", "Valor"]} rows={Object.entries(snap.income_statement).map(([k, v]) => [k, fmt(v)])} />
            <DataTable head={["Balance", "Valor"]} rows={Object.entries(snap.balance_sheet).map(([k, v]) => [k, fmt(v)])} />
          </div>
        )}
      </Panel>
    </div>
  );
}

// ── C. COMPANY UNDERSTANDING ──────────────────────────────────────────────
export function UnderstandingSection({ data }: SectionProps) {
  const a = data.analysis;
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Panel title="Contexto registrado" layer="EVIDENCE">
        <KV rows={[
          { k: "Empresa", v: a?.company_name ?? "—" },
          { k: "Sector", v: a?.sector ?? "—" },
          { k: "Moneda del análisis", v: a?.moneda_analisis ?? "—" },
        ]} />
      </Panel>
      <Panel title="Comprensión del negocio">
        <Empty>
          Velarix no tiene todavía una tabla para la comprensión del negocio (segmentos, geografía, drivers, riesgos).
          Esa información se documenta en el case MOC de Obsidian (<code>docs/cases/&lt;caso&gt;/00-case-home.md</code>).
          Las interpretaciones de cuentas materiales están en Accounts.
        </Empty>
      </Panel>
    </div>
  );
}

// ── D. ACCOUNTS / NORMALIZATION ───────────────────────────────────────────
export function AccountsSection({ data }: SectionProps) {
  const ambiguous = data.homologations.filter((h) => h.ambiguity_flag);
  return (
    <div className="grid gap-3">
      <Panel title={`Homologación de cuentas (${data.homologations.length}, ${ambiguous.length} ambiguas)`} layer="EVIDENCE">
        {data.homologations.length === 0 ? <Empty>Sin cuentas homologadas.</Empty> : (
          <DataTable
            head={["Etiqueta original", "Cuenta canónica", "Categoría", "Período", "Confianza", "Ambigua", "Valor"]}
            numericFrom={6}
            rows={data.homologations.map((h) => [
              h.original_label, h.canonical_account, h.category ?? "—", h.period ?? "—", h.confidence_score ?? "—",
              h.ambiguity_flag ? <span className="text-amber-300">sí</span> : "no", fmt(h.value),
            ])}
          />
        )}
      </Panel>
      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Interpretación de cuentas materiales (account_notes)" layer="JUDGMENT">
          {data.accountNotes.length === 0 ? <Empty>Sin notas. (El Expediente solo es visible con rol analyst/admin.)</Empty> : (
            <DataTable head={["Cuenta", "Interpretación"]} numericFrom={9} rows={data.accountNotes.map((n) => [n.canonical_account, n.interpretation_text])} />
          )}
        </Panel>
        <Panel title="Validaciones">
          {data.validations.length === 0 ? <Empty>Sin validaciones ejecutadas.</Empty> : (
            <DataTable
              head={["Regla", "Severidad", "Estado", "Bloquea", "Detalle"]}
              numericFrom={9}
              rows={data.validations.map((v) => [v.rule_code, v.severity, v.status, v.blocking_flag ? "sí" : "no", v.detail ?? ""])}
            />
          )}
        </Panel>
      </div>
      <Panel title="Normalización de EBITDA" layer="JUDGMENT">
        <Empty>
          No hay estructura persistida para ajustes de normalización (one-offs). El procedimiento está en la metodología
          (P-08). Los ajustes de un caso se documentan en su case MOC hasta que exista evidencia para modelarlos.
        </Empty>
      </Panel>
    </div>
  );
}

// ── E. QUESTIONS ──────────────────────────────────────────────────────────
export function QuestionsSection({ data }: SectionProps) {
  const answered = data.questions.filter((q) => q.expedient_answers.length > 0).length;
  const checkpoint = evaluateMinimumExpedienteCheckpoint({
    companyName: data.analysis?.company_name,
    sector: data.analysis?.sector,
    materialAccountsCount: data.accountNotes.length,
    ambiguitiesCount: data.questions.length,
    treatedAmbiguitiesCount: answered,
  });
  return (
    <div className="grid gap-3">
      <Panel title="Minimum Expediente Checkpoint" right={<span className={`font-mono text-[10px] ${checkpoint.passed ? "text-emerald-300" : "text-amber-300"}`}>{checkpoint.passed ? "PASA" : "NO PASA"}</span>}>
        <KV rows={[
          { k: "Contexto (empresa + sector)", v: checkpoint.checks.context ? "✓" : "✗" },
          { k: "≥1 cuenta material", v: checkpoint.checks.material_account ? "✓" : "✗" },
          { k: "≥1 ambigüedad registrada", v: checkpoint.checks.ambiguity ? "✓" : "✗" },
          { k: "≥1 tratamiento humano", v: checkpoint.checks.treatment ? "✓" : "✗" },
        ]} />
        {!data.valuationFile && <p className="mt-2 text-xs text-muted-foreground">Sin <code>valuation_file</code> visible para este caso.</p>}
      </Panel>
      <Panel title={`Preguntas del Expediente (${data.questions.length}, ${answered} respondidas)`} layer="JUDGMENT">
        {data.questions.length === 0 ? <Empty>Sin preguntas registradas.</Empty> : (
          <div className="space-y-2">
            {data.questions.map((q) => (
              <div key={q.id} className="border border-border/60 rounded p-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                  <span>{q.estado}</span>
                  {q.materialidad && <span>· materialidad {q.materialidad}</span>}
                  {q.generado_por_ia && <span className="text-sky-300">· propuesta por IA</span>}
                </div>
                <p className="text-xs text-foreground mt-1">{q.texto}</p>
                {q.razon && <p className="text-[11px] text-muted-foreground">{q.razon}</p>}
                {q.expedient_answers.map((ans) => (
                  <p key={ans.id} className="text-xs text-emerald-200 mt-1 border-l-2 border-emerald-500/40 pl-2">{ans.respuesta_texto}</p>
                ))}
              </div>
            ))}
          </div>
        )}
      </Panel>
      {data.reviews.length > 0 && (
        <Panel title="Revisiones manuales del caso">
          <DataTable head={["Estado", "Motivo", "Prioridad", "Creada"]} numericFrom={9} rows={data.reviews.map((r) => [r.estado, r.reason, r.prioridad ?? "—", date(r.created_at)])} />
        </Panel>
      )}
    </div>
  );
}

// ── F. JUDGMENT ───────────────────────────────────────────────────────────
interface JudgmentRow { area: string; value: string; layer: Layer; source: string; rationale: string; status: string }

function resolvedRows(ra: ResolvedCalculationAssumptions, cr: PersistedCalculationResult, growth: number | null): JudgmentRow[] {
  const r = (area: string, e: { source: string; rationale: string; status: string } , value: string): JudgmentRow =>
    ({ area, value, layer: "JUDGMENT", source: e.source, rationale: e.rationale, status: e.status });
  const capex = ra.capexReinvestmentDriver.value;
  const da = ra.depreciationDaDriver.value;
  const lambda = ra.countryRiskLambda.value;
  return [
    r("Tax", ra.taxTreatment, `${pct(ra.taxTreatment.value.marginalRatePct)} marginal · escudo ${pct(ra.taxTreatment.value.debtTaxShieldRatePct)}`),
    r("Capital structure", ra.capitalStructure, `E ${pct(ra.capitalStructure.value.equityWeight * 100)} / D ${pct(ra.capitalStructure.value.debtWeight * 100)} · ${ra.capitalStructure.value.structureSource}`),
    r("Risk free (local)", ra.riskFreeRateConstruction, `${pct(ra.riskFreeRateConstruction.value.localRatePct)} (ref ${pct(ra.riskFreeRateConstruction.value.referenceCurrencyRatePct)}, Δπ ${pct(ra.riskFreeRateConstruction.value.inflationDifferentialPct)})`),
    r("ERP (maduro)", ra.matureErp, pct(ra.matureErp.value.valuePct)),
    r("CRP", ra.countryRiskPremium, pct(ra.countryRiskPremium.value.valuePct)),
    r("Lambda (λ)", ra.countryRiskLambda, `${fmt2(lambda.value)} · ${lambda.mode}`),
    r("Beta (desapalancado)", ra.betaTreatment, `${fmt2(ra.betaTreatment.value.unleveredBeta)} · ${ra.betaTreatment.value.releveringMethod}`),
    { area: "Beta (reapalancado)", value: fmt2(cr.valuation?.betaLevered), layer: "CALCULATION", source: "motor canónico", rationale: "Hamada sobre la estructura resuelta", status: "calculado" },
    r("Cost of debt", ra.costOfDebt, `${pct(ra.costOfDebt.value.valuePct)} · ${ra.costOfDebt.value.hierarchy}`),
    { area: "Ke", value: pct(cr.valuation?.costOfEquity), layer: "CALCULATION", source: "motor canónico", rationale: "CAPM con Rf local + β×ERP + λ×CRP", status: "calculado" },
    { area: "WACC", value: pct(cr.valuation?.wacc), layer: "CALCULATION", source: "motor canónico", rationale: "Pesos y componentes resueltos", status: "calculado" },
    { area: "Revenue growth", value: growth === null ? "—" : pct(growth), layer: "JUDGMENT", source: "analyses.expected_growth", rationale: "Parámetro del motor; no es uno de los 13 supuestos resueltos", status: growth === null ? "sin dato" : "parámetro" },
    { area: "Margins", value: `EBITDA base ${pct(cr.kpis?.ebitdaMargin)}`, layer: "CALCULATION", source: "Evidence del período base", rationale: "El contrato v5 no tiene un supuesto explícito de margen", status: "derivado" },
    r("CAPEX", ra.capexReinvestmentDriver, capex.mode === "percent_of_revenue" ? `${pct(capex.capexPctOfRevenue)} de ingresos` : `ruta explícita: ${capex.explicitPath.map(fmt).join(" · ")}`),
    r("D&A", ra.depreciationDaDriver, da.mode === "percent_of_revenue" ? `${pct(da.daPctOfRevenue)} de ingresos` : `ruta explícita: ${da.explicitPath.map(fmt).join(" · ")}`),
    r("Working capital (ΔNWC)", ra.workingCapitalDriver, ra.workingCapitalDriver.value.explicitDeltaNwcByYear.map(fmt).join(" · ")),
    r("Terminal g", ra.terminalG, `${pct(ra.terminalG.value.valuePct)} (pes. ${pct(ra.terminalG.value.pessimisticScenarioPct)}, opt. ${pct(ra.terminalG.value.optimisticScenarioPct)})`),
    r("Timing / horizonte", ra.projectionHorizonYears, `${ra.projectionHorizonYears.value.years} años · fin de año`),
  ];
}

export function JudgmentSection({ data }: SectionProps) {
  const cr = data.calculation;
  if (!cr) return <Panel title="Supuestos" layer="JUDGMENT">{noCalc}</Panel>;
  const ra = cr.resolved_assumptions_used;

  if (!ra) {
    const snap = cr.version?.assumptions_snapshot ?? {};
    return (
      <Panel title="Supuestos (legacy)" layer="JUDGMENT">
        <p className="mb-2 text-xs text-amber-300">
          Este cálculo usó los supuestos globales por defecto (<code>{cr.version?.assumptions_source ?? "legacy"}</code>), no Judgment
          del caso. No es una valoración defendible hasta resolver los 13 supuestos y pasar el preflight.
        </p>
        <DataTable head={["Supuesto", "Valor", "Unidad", "Aprobado"]} rows={Object.entries(snap).map(([k, e]) => [k, fmt2(e.value), e.unit, e.approved ? "sí" : "no"])} />
      </Panel>
    );
  }

  const rows = resolvedRows(ra, cr, data.analysis?.expected_growth ?? null);
  return (
    <Panel title="Supuestos resueltos (resolved_assumptions_used)" layer="JUDGMENT">
      <DataTable
        head={["Área", "Valor", "Capa", "Estado", "Fuente", "Rationale"]}
        numericFrom={9}
        rows={rows.map((r) => [
          <span className="font-medium">{r.area}</span>,
          <span className="font-mono tabular-nums">{r.value}</span>,
          <LayerTag layer={r.layer} />,
          r.status,
          <span className="block max-w-[280px] truncate" title={r.source}>{r.source}</span>,
          <span className="block max-w-[360px] truncate" title={r.rationale}>{r.rationale}</span>,
        ])}
      />
      <p className="mt-2 text-[10px] text-muted-foreground">Pasa el cursor sobre fuente y rationale para ver el texto completo.</p>
    </Panel>
  );
}

// ── G. FORECAST ───────────────────────────────────────────────────────────
export function ForecastSection({ data }: SectionProps) {
  const p = data.calculation?.projections;
  if (!p?.length) return <Panel title="Forecast" layer="CALCULATION">{noCalc}</Panel>;
  const lines: [string, keyof (typeof p)[number]][] = [
    ["Revenue", "revenue"], ["Cost of sales", "costOfSales"], ["Gross profit", "grossProfit"], ["EBITDA", "ebitda"],
    ["D&A", "depreciation"], ["EBIT", "ebit"], ["Taxes", "taxes"], ["NOPAT", "nopat"], ["CAPEX", "capex"],
    ["ΔNWC", "deltaWC"], ["FCFF", "fcff"], ["PV FCFF", "discountedFcf"],
  ];
  return (
    <Panel title={`Proyección (${data.calculation?.moneda ?? ""})`} layer="CALCULATION">
      <DataTable head={["", ...p.map((y) => `Año ${y.year}`)]} rows={lines.map(([label, key]) => [label, ...p.map((y) => fmt(y[key] as number))])} />
    </Panel>
  );
}

// ── H. VALUATION ──────────────────────────────────────────────────────────
export function ValuationSection({ data }: SectionProps) {
  const cr = data.calculation;
  const v = cr?.valuation;
  if (!cr || !v) return <Panel title="Valoración" layer="CALCULATION">{noCalc}</Panel>;
  const sumPv = cr.projections?.reduce((s, y) => s + y.discountedFcf, 0);
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Panel title="DCF / FCFF" layer="CALCULATION">
        <KV rows={[
          { k: "Σ PV FCFF", v: fmt(sumPv) },
          { k: "Terminal value", v: fmt(v.terminalValue) },
          { k: "PV terminal value", v: fmt(v.discountedTV) },
          { k: "Enterprise value", v: fmt(v.enterpriseValue) },
          { k: "WACC", v: pct(v.wacc) },
          { k: "EV / EBITDA · EV / Revenue", v: `${fmt2(v.evEbitda)}x · ${fmt2(v.evRevenue)}x` },
        ]} />
        {v.waccWarning && <p className="mt-2 text-xs text-amber-300">{v.waccWarning}</p>}
      </Panel>
      <Panel title="Puente EV → Equity" layer="CALCULATION">
        <KV rows={[
          { k: "Enterprise value", v: fmt(v.enterpriseValue) },
          { k: "(−) Deuda neta", v: fmt(v.netDebt) },
          { k: "= Equity value", v: <strong>{fmt(v.equityValue)}</strong> },
        ]} />
        <p className="mt-2 text-[10px] text-muted-foreground">
          Partidas adicionales del puente (NCI, asociadas, leases, caja restringida) dependen del caso: ver C-08 en la metodología.
        </p>
      </Panel>
    </div>
  );
}

// ── I. CHALLENGE ──────────────────────────────────────────────────────────
export function ChallengeSection({ data }: SectionProps) {
  const cr = data.calculation;
  if (!cr) return <Panel title="Challenge" layer="CALCULATION">{noCalc}</Panel>;
  const sc = cr.scenarios;
  const matrix = cr.sensitivityMatrix ?? [];
  const waccDeltas = [...new Set(matrix.map((c) => c.waccDelta))].sort((a, b) => a - b);
  const gDeltas = [...new Set(matrix.map((c) => c.growthDelta))].sort((a, b) => a - b);
  const cell = (w: number, g: number) => matrix.find((c) => c.waccDelta === w && c.growthDelta === g)?.ev;
  return (
    <div className="grid gap-3">
      <Panel title="Escenarios" layer="CALCULATION">
        {!sc ? <Empty>Sin escenarios.</Empty> : (
          <DataTable
            head={["Escenario", "Crecimiento", "Margen EBITDA", "WACC", "g terminal", "EV"]}
            rows={(["pessimistic", "base", "optimistic"] as const).map((k) => {
              const s = sc[k];
              return [s?.label ?? k, pct(s?.assumptions.growth), pct(s?.assumptions.ebitdaMargin), pct(s?.assumptions.wacc), pct(s?.assumptions.terminalGrowth), fmt(s?.ev)];
            })}
          />
        )}
      </Panel>
      <Panel title="Sensibilidad EV: WACC × g (deltas en puntos)" layer="CALCULATION">
        {matrix.length === 0 ? <Empty>Sin matriz de sensibilidad.</Empty> : (
          <DataTable
            head={["WACC Δ \\ g Δ", ...gDeltas.map((g) => `${g > 0 ? "+" : ""}${g}`)]}
            rows={waccDeltas.map((w) => [`${w > 0 ? "+" : ""}${w}`, ...gDeltas.map((g) => {
              const ev = cell(w, g);
              return ev === 0 ? <span className="text-muted-foreground">n/c</span> : fmt(ev);
            })])}
          />
        )}
        <p className="mt-2 text-[10px] text-muted-foreground">n/c = no converge (WACC ≤ g). La suite mínima P-12 (pruebas adicionales de un factor) todavía no está implementada.</p>
      </Panel>
    </div>
  );
}

// ── J. OUTPUT ─────────────────────────────────────────────────────────────
export function OutputSection({ data }: SectionProps) {
  const [downloading, setDownloading] = useState(false);
  const cr = data.calculation;
  const a = data.analysis;
  if (!cr || !a) return <Panel title="Output">{noCalc}</Panel>;

  const limitations = [
    ...(cr.valuation?.waccWarning ? [cr.valuation.waccWarning] : []),
    ...(cr.provenance?.overall_status && cr.provenance.overall_status !== "complete" ? [`Provenance ${cr.provenance.overall_status}: no todas las cifras tienen procedencia completa.`] : []),
    ...(!cr.resolved_assumptions_used ? ["Supuestos legacy por defecto: no es una valoración defendible."] : []),
    ...(cr.provenance?.warnings ?? []),
  ];

  const handlePdf = async () => {
    setDownloading(true);
    await downloadCanonicalPdf({ calculationResult: cr, companyName: a.company_name, sector: a.sector });
    setDownloading(false);
  };

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Panel title="Conclusión" layer="CALCULATION" right={
        <button onClick={handlePdf} disabled={downloading} className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
          {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} PDF
        </button>
      }>
        <KV rows={[
          { k: "Rango EV (±1% WACC)", v: `${fmt(cr.valuation?.evLow)} — ${fmt(cr.valuation?.evHigh)}` },
          { k: "Enterprise value", v: fmt(cr.valuation?.enterpriseValue) },
          { k: "Equity value", v: fmt(cr.valuation?.equityValue) },
          { k: "WACC · g terminal", v: `${pct(cr.valuation?.wacc)} · ${pct(cr.resolved_assumptions_used?.terminalG.value.valuePct ?? cr.scenarios?.base?.assumptions.terminalGrowth)}` },
          { k: "Moneda", v: cr.moneda },
        ]} />
      </Panel>
      <Panel title="Limitaciones">
        {limitations.length === 0 ? <Empty>Sin limitaciones registradas en el envelope.</Empty> : (
          <ul className="list-disc pl-4 text-xs text-amber-300 space-y-1">{limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
        )}
      </Panel>
      {data.narrative?.executive_summary && (
        <Panel title="Resumen narrativo (borrador IA)">
          <p className="text-[10px] text-sky-300 mb-1">Borrador generado por IA a partir del cálculo canónico. No aprueba supuestos. Auditoría: {data.narrative.audit_passed ? "pasó" : "no pasó"}.</p>
          <p className="text-xs text-foreground whitespace-pre-line">{data.narrative.executive_summary}</p>
        </Panel>
      )}
    </div>
  );
}

// ── K. AUDIT TRAIL ────────────────────────────────────────────────────────
export function AuditSection({ data }: SectionProps) {
  const cr = data.calculation;
  const v = cr?.version;
  const fields = cr?.provenance?.fields ?? {};
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Identidad del cálculo">
          {!v ? noCalc : (
            <KV rows={[
              { k: "Input fingerprint", v: <span className="break-all">{v.input_fingerprint}</span> },
              { k: "Calculado", v: date(v.calculated_at) },
              { k: "Motor canónico", v: v.canonical_engine_version },
              { k: "Metodología", v: v.methodology_version },
              { k: "Schema del cálculo", v: v.calculation_schema_version },
              { k: "Fuente de supuestos", v: v.assumptions_source },
              { k: "Provenance", v: v.provenance_status },
            ]} />
          )}
        </Panel>
        <Panel title="Snapshots">
          <KV rows={[
            { k: "source_input_snapshot", v: cr?.source_input_snapshot ? `structured_input ${cr.source_input_snapshot.structured_input_id ?? "—"} · v${cr.source_input_snapshot.version_input ?? "—"}` : "ausente", layer: "EVIDENCE" },
            { k: "resolved_assumptions_used", v: cr?.resolved_assumptions_used ? "13 supuestos congelados" : "ausente (legacy)", layer: "JUDGMENT" },
            { k: "structured_input más reciente", v: data.latestStructuredInput ? `${date(data.latestStructuredInput.created_at)} · resolved_assumptions ${data.latestStructuredInput.hasResolvedAssumptions ? "sí" : "no"}` : "—" },
          ]} />
        </Panel>
      </div>
      {Object.keys(fields).length > 0 && (
        <Panel title="Provenance por campo">
          <DataTable
            head={["Campo", "Estado", "Documentos", "Homologaciones"]}
            rows={Object.entries(fields).map(([k, f]) => [k, f.source_status, String(f.document_ids?.length ?? 0), String(f.homologation_ids?.length ?? 0)])}
          />
        </Panel>
      )}
      <Panel title={`Eventos (${data.auditEvents.length})`}>
        {data.auditEvents.length === 0 ? <Empty>Sin eventos.</Empty> : (
          <DataTable head={["Fecha", "Componente", "Evento", "Detalle"]} numericFrom={9} rows={data.auditEvents.map((e) => [date(e.created_at), e.component ?? "—", e.event_type, e.event_detail ?? ""])} />
        )}
      </Panel>
    </div>
  );
}
