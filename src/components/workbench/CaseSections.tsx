// Secciones B–K del caso (A es la cabecera en CaseWorkbench). Solo leen lo
// que ya existe en Supabase y en el envelope del cálculo canónico; nunca
// recalculan ni rellenan supuestos. Donde no hay tabla para algo, se dice.
import { useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import DocumentUpload from "@/components/dashboard/DocumentUpload";
import { downloadCanonicalPdf } from "@/lib/canonical-pdf-download";
import type { PersistedCalculationResult, ResolvedCalculationAssumptions } from "@/types/calculation-result";
import { evaluateMinimumExpedienteCheckpoint } from "../../../supabase/functions/_shared/minimum-expediente-checkpoint";
import { parseBusinessProfile, type SourcedItem } from "@/types/case-metadata";
import type { CaseData } from "./useCaseData";
import { DataTable, Empty, KV, type Layer, LayerTag, LongText, Panel } from "./ui";
import { caseProvenance, officialVerification, questionCode, questionThreads, questionTitle, reclassifiedQuestions, splitSource, type ProvenanceState, type SourceLayer } from "./case-provenance";
import { terminalReinvestmentCheck } from "@/lib/terminal-reinvestment-check";
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

const TONE: Record<ProvenanceState["tone"], string> = {
  ok: "text-emerald-300",
  info: "text-sky-300",
  missing: "text-amber-300",
};

function ProvenanceRow({ label, state }: { label: string; state: ProvenanceState }) {
  return (
    <div className="grid grid-cols-[minmax(150px,max-content)_1fr] gap-x-4 py-1 border-b border-border/40 last:border-0">
      <span className="font-body text-xs text-muted-foreground">{label}</span>
      <span className="text-xs">
        <span className={`font-mono text-[11px] ${TONE[state.tone]}`}>{state.status}</span>
        <span className="block text-[11px] text-muted-foreground whitespace-normal">{state.detail}</span>
      </span>
    </div>
  );
}

/** Origen de los números: evidencia canónica del repo ≠ documentos subidos a Supabase. */
export function SourceLayerTag({ layer }: { layer: SourceLayer }) {
  const style = layer === "REPO_CANONICAL_EVIDENCE" ? "text-violet-300 bg-violet-500/10 border-violet-500/30" : "text-sky-300 bg-sky-500/10 border-sky-500/30";
  return <span className={`inline-block border rounded px-1 py-px font-mono text-[9px] tracking-wide ${style}`}>{layer}</span>;
}

// ── B. EVIDENCE ────────────────────────────────────────────────────────────
export function EvidenceSection({ data, reload }: SectionProps) {
  const [uploading, setUploading] = useState(false);
  const cr = data.calculation;
  const snap = cr?.source_input_snapshot;
  const prov = cr?.provenance;
  const states = caseProvenance(data);

  if (uploading && data.analysis) {
    return (
      <Panel title="Cargar estados financieros" layer="EVIDENCE" right={<button onClick={() => { setUploading(false); reload(); }} className="text-xs text-muted-foreground hover:text-foreground">Cerrar</button>}>
        <DocumentUpload
          analysisId={data.analysis.id}
          calculated={!!data.calculation}
          onFinished={() => { setUploading(false); reload(); }}
        />
      </Panel>
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Panel
        title="Documentos (SUPABASE_DOCUMENT_EVIDENCE)"
        layer="EVIDENCE"
        right={<button onClick={() => setUploading(true)} className="flex items-center gap-1 text-xs text-primary hover:underline"><Upload size={12} /> Cargar</button>}
      >
        {data.documents.length === 0 ? (
          <Empty>
            Sin documentos cargados en Storage.
            {states.evidenceLayer === "REPO_CANONICAL_EVIDENCE" && " Este caso se materializó desde evidencia canónica del repo, no desde documentos subidos: no se simula ninguna ingesta."}
          </Empty>
        ) : (
          <DataTable
            head={["Archivo", "Tipo declarado (carga)", "Tipo efectivo (parser)", "Estado", "Cargado"]}
            numericFrom={9}
            rows={data.documents.map((d) => [
              d.original_filename,
              d.doc_type_declared ?? "—",
              d.doc_type_effective ? `${d.doc_type_effective} · ${d.doc_type_origin ?? "origen —"}` : "— (sin resolver)",
              d.processing_status,
              date(d.uploaded_at),
            ])}
          />
        )}
      </Panel>

      <Panel title="Provenance" layer="EVIDENCE">
        <div className="mb-2">
          <ProvenanceRow label="Case source provenance" state={states.caseSource} />
          <ProvenanceRow label="Document provenance" state={states.documents} />
          <ProvenanceRow label="Account homologation lineage" state={states.accountLineage} />
        </div>
        <KV rows={[{ k: "Evidence run activo (homologación + validación)", v: activeEvidenceRunLabel(data) }]} />
        {!prov ? <Empty>Sin envelope de provenance: no hay cálculo canónico persistido.</Empty> : (
          <div className="space-y-2">
            <KV rows={[
              { k: "Estado global (lineage documental)", v: prov.overall_status },
              { k: "Período seleccionado por pipeline documental", v: prov.period_selection?.base_period ?? "not available" },
              { k: "Modo de selección (pipeline documental)", v: prov.period_selection?.selection_mode ?? "not available" },
              { k: "Moneda análisis / documento", v: `${prov.currency?.moneda_analisis ?? "—"} / ${prov.currency?.moneda_documento ?? "—"}` },
              { k: "Factor de conversión", v: fmt2(prov.currency?.factor_conversion) },
              { k: "Documentos / homologaciones", v: `${prov.document_ids?.length ?? 0} / ${prov.homologation_ids?.length ?? 0}` },
            ]} />
            {prov.warnings?.length > 0 && (
              <details className="text-[11px] text-muted-foreground">
                <summary className="cursor-pointer">Detalle técnico del envelope ({prov.warnings.length})</summary>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 whitespace-normal">{prov.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </details>
            )}
          </div>
        )}
      </Panel>

      <Panel title="Estados financieros observados (source_input_snapshot)" layer="EVIDENCE" right={states.evidenceLayer ? <SourceLayerTag layer={states.evidenceLayer} /> : undefined}>
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
function SourcedList({ items, gap }: { items: SourcedItem[]; gap?: string }) {
  if (items.length === 0) return <Empty>{gap ?? "No documentado."}</Empty>;
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="text-xs text-foreground whitespace-normal">
          {it.text}
          <span className="block text-[10px] text-muted-foreground break-words">Fuente: {it.source}</span>
        </li>
      ))}
    </ul>
  );
}

export function UnderstandingSection({ data }: SectionProps) {
  const a = data.analysis;
  const bp = parseBusinessProfile(a?.business_profile);
  const blocks: [string, keyof NonNullable<typeof bp>["gaps"], SourcedItem[]][] = bp
    ? [["Segmentos", "segments", bp.segments], ["Geografías", "geographies", bp.geographies], ["Drivers de valor (documentados)", "value_drivers", bp.value_drivers], ["Riesgos clave", "key_risks", bp.key_risks]]
    : [];
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Contexto registrado" layer="EVIDENCE">
          <KV rows={[
            { k: "Empresa", v: a?.company_name ?? "—" },
            { k: "Sector", v: a?.sector ?? "—" },
            { k: "Moneda del análisis", v: a?.moneda_analisis ?? "—" },
            { k: "Interés valorado", v: <span className="whitespace-normal font-body">{a?.valued_interest ?? "—"}</span> },
            { k: "Arquitectura", v: <span className="whitespace-normal font-body">{a?.calculation_architecture ?? "—"}</span> },
            { k: "Fecha de valoración", v: a?.valuation_date ?? "—" },
            { k: "Basis of value", v: a?.basis_of_value ?? "—" },
          ]} />
        </Panel>
        <Panel title="Resumen del negocio">
          {!bp ? (
            <Empty>
              Sin resumen operativo registrado para este caso. La comprensión del negocio se documenta en el case MOC
              (<code>docs/cases/&lt;caso&gt;/00-case-home.md</code>).
            </Empty>
          ) : (
            <div className="space-y-2">
              {bp.summary ? <SourcedList items={[bp.summary]} /> : <Empty>{bp.gaps.summary ?? "Sin resumen documentado."}</Empty>}
              <p className="text-[10px] text-muted-foreground">
                Resumen operativo mínimo. El detalle completo vive en el case MOC{bp.moc_path ? <>: <code>{bp.moc_path}</code></> : ""}.
              </p>
            </div>
          )}
        </Panel>
      </div>
      {bp && (
        <div className="grid gap-3 xl:grid-cols-2">
          {blocks.map(([title, key, items]) => (
            <Panel key={key} title={title}><SourcedList items={items} gap={bp.gaps[key]} /></Panel>
          ))}
        </div>
      )}
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
            <DataTable head={["Cuenta", "Interpretación"]} numericFrom={9} wrap={[1]} rows={data.accountNotes.map((n) => [<span className="font-mono">{n.canonical_account}</span>, <span className="text-xs leading-relaxed">{n.interpretation_text}</span>])} />
          )}
        </Panel>
        <Panel title="Validaciones">
          {data.validations.length === 0 ? <Empty>Sin validaciones ejecutadas.</Empty> : (
            <DataTable
              head={["Regla", "Severidad", "Estado", "Bloquea", "Detalle"]}
              numericFrom={9}
              wrap={[4]}
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
  const threads = questionThreads(data.questions, data.auditEvents);
  const reclassified = reclassifiedQuestions(data.questions, data.auditEvents);
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
      <Panel title={`Preguntas del Expediente (${threads.length} vigentes · ${threads.filter((t) => t.current.expedient_answers.length > 0).length} respondidas · ${threads.filter((t) => t.current.expedient_answers.length === 0).length} abiertas)`} layer="JUDGMENT">
        {threads.length === 0 ? <Empty>Sin preguntas registradas.</Empty> : (
          <div className="space-y-1.5">
            {threads.map(({ code, current: q, history }) => {
              const open = q.expedient_answers.length === 0;
              const ev = q.razon ? splitSource(q.razon) : null;
              return (
                <details key={q.id} className="border border-border/60 rounded group">
                  <summary className="cursor-pointer list-none px-2 py-1.5 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground w-14 shrink-0">{code ?? "—"}</span>
                    <span className="text-xs text-foreground flex-1 min-w-0">{questionTitle(q.texto)}</span>
                    {history.length > 0 && <span className="font-mono text-[9px] text-sky-300">wording corregido</span>}
                    <span className={`font-mono text-[10px] ${open ? "text-amber-300" : "text-emerald-300"}`}>{open ? "abierta" : "respondida"}</span>
                  </summary>
                  <div className="px-2 pb-2 space-y-2 text-xs whitespace-normal break-words">
                    {(q.materialidad || q.generado_por_ia) && (
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {q.materialidad && <>materialidad {q.materialidad} </>}{q.generado_por_ia && <span className="text-sky-300">· propuesta por IA</span>}
                      </p>
                    )}
                    {ev && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pregunta / evidencia requerida</p>
                        <p className="text-muted-foreground">{ev.body}</p>
                        {ev.source && <p className="text-[10px] text-muted-foreground">Fuente: {ev.source}</p>}
                      </div>
                    )}
                    {open ? (
                      <p className="text-amber-300/90">Sin respuesta registrada: pendiente.</p>
                    ) : q.expedient_answers.map((ans) => {
                      const a = splitSource(ans.respuesta_texto);
                      return (
                        <div key={ans.id} className="border-l-2 border-emerald-500/40 pl-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Respuesta (Judgment) · {date(ans.respondido_at)}</p>
                          <p className="text-emerald-200">{a.body}</p>
                          {a.source && <p className="text-[10px] text-muted-foreground">Fuente: {a.source}</p>}
                        </div>
                      );
                    })}
                    {history.map((h) => {
                      const prevAnswer = h.expedient_answers[0]?.respuesta_texto;
                      const answerChanged = !!prevAnswer && prevAnswer !== q.expedient_answers[0]?.respuesta_texto;
                      return (
                        <div key={h.id} className="border-l-2 border-border pl-2 opacity-80">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Versión anterior (superseded) · {date(h.created_at)}</p>
                          {h.razon !== q.razon && <p className="text-muted-foreground line-through decoration-muted-foreground/40">{h.razon ?? h.texto}</p>}
                          {answerChanged && <p className="text-muted-foreground line-through decoration-muted-foreground/40">{prevAnswer}</p>}
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </Panel>
      {reclassified.length > 0 && (
        <Panel title={`Reclasificadas fuera del Judgment (${reclassified.length}, historial)`}>
          <div className="space-y-1.5">
            {reclassified.map((r) => (
              <details key={r.question.id} className="border border-border/60 rounded">
                <summary className="cursor-pointer list-none px-2 py-1.5 flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] text-muted-foreground w-14 shrink-0">{questionCode(r.question.texto) ?? "—"}</span>
                  <span className="flex-1 min-w-0 text-muted-foreground">{questionTitle(r.question.texto)}</span>
                  <span className="font-mono text-[10px] text-sky-300">{r.reclassifiedAs}</span>
                </summary>
                <div className="px-2 pb-2 space-y-1 text-xs whitespace-normal break-words">
                  <p className="text-muted-foreground">{r.reason}</p>
                  {r.question.razon && <p className="text-[11px] text-muted-foreground/80">Texto original: {r.question.razon}</p>}
                  <p className="text-[10px] text-muted-foreground">Reclasificada {date(r.at)} · la fila original se conserva.</p>
                </div>
              </details>
            ))}
          </div>
        </Panel>
      )}
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
        wrap={[1, 4, 5]}
        rows={rows.map((r) => [
          <span className="font-medium">{r.area}</span>,
          <span className="font-mono tabular-nums">{r.value}</span>,
          <LayerTag layer={r.layer} />,
          r.status,
          <LongText text={r.source} preview={110} className="text-[11px] text-muted-foreground" />,
          <LongText text={r.rationale} preview={140} className="text-[11px]" />,
        ])}
      />
      <p className="mt-2 text-[10px] text-muted-foreground">Fuentes y rationales largos: «ver completo» despliega el texto íntegro.</p>
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
        <p className="mt-2 text-[10px] text-muted-foreground">n/c = no converge (WACC ≤ g).</p>
      </Panel>
      <TerminalReinvestmentPanel data={data} />
      <Panel title="P-12 · suite adicional de challenge de un factor" right={<span className="font-mono text-[10px] text-amber-300">NOT IMPLEMENTED · PENDING</span>}>
        <Empty>
          La suite mínima de sensibilidades P-12 (pruebas adicionales de un factor) todavía no está implementada. No se muestran
          resultados simulados: los únicos challenges calculados son los escenarios de g terminal y la matriz WACC × g de arriba.
        </Empty>
      </Panel>
    </div>
  );
}

function TerminalReinvestmentPanel({ data }: { data: CaseData }) {
  const c = terminalReinvestmentCheck(data.calculation);
  const v = data.calculation?.version;
  const recorded = data.auditEvents.find((e) => {
    const m = e.metadata as Record<string, unknown> | null;
    return e.event_type === "terminal_reinvestment_check" && m?.input_fingerprint === v?.input_fingerprint && (m?.calculated_at ?? null) === (v?.calculated_at ?? null);
  });
  const tone = c.status === "PASS" ? "text-emerald-300" : c.status === "FAIL" ? "text-destructive" : "text-muted-foreground";
  const r6 = (x?: number) => (typeof x === "number" ? x.toFixed(6) : "—");
  return (
    <Panel title="Terminal reinvestment check" layer="CALCULATION" right={<span className={`font-mono text-[10px] ${tone}`}>status = {c.status}</span>}>
      {c.status === "NOT_AVAILABLE" ? <Empty>No disponible: {c.reason}</Empty> : (
        <>
          <KV rows={[
            { k: `Net Reinvestment (año ${c.year})`, v: `CAPEX ${fmt(c.capex)} − D&A ${fmt(c.depreciation)} + ΔNWC ${fmt(c.deltaNwc)} = ${fmt(c.netReinvestment)}` },
            { k: "Net Reinvestment / NOPAT", v: `${fmt(c.netReinvestment)} / ${fmt(c.nopat)} = ${r6(c.reinvestmentRate)}` },
            { k: "g / ROC", v: `${pct(c.gPct)} / ${pct(c.rocPct)} = ${r6(c.gOverRoc)}` },
            { k: "Banda aceptada", v: `${r6(c.acceptedRange?.[0])} – ${r6(c.acceptedRange?.[1])} (ROC ${c.rocRangePct ? `${c.rocRangePct[0]}%–${c.rocRangePct[1]}%` : `${c.rocPct}%`})` },
            { k: "ROC implícito", v: pct(c.impliedRocPct) },
          ]} />
          <p className="mt-2 text-[10px] text-muted-foreground whitespace-normal">
            Validación determinística (CALCULATION) sobre el cálculo persistido, no Judgment. ROC diagnóstico leído de <code>{c.rocSource}</code>.
            {recorded ? " Registrado en el audit trail (terminal_reinvestment_check)." : " Aún no registrado en el audit trail para este cálculo."}
          </p>
        </>
      )}
    </Panel>
  );
}

// ── J. OUTPUT ─────────────────────────────────────────────────────────────
export function OutputSection({ data }: SectionProps) {
  const [downloading, setDownloading] = useState(false);
  const cr = data.calculation;
  const a = data.analysis;
  if (!cr || !a) return <Panel title="Output">{noCalc}</Panel>;

  const verification = officialVerification(data);
  const states = caseProvenance(data);
  const lineageGaps = [
    ...(states.documents.status === "MISSING" ? ["Sin lineage de ingesta documental (documentos en Storage → cifras)."] : []),
    ...(states.accountLineage.status === "MISSING" ? ["Sin lineage de homologación de cuentas (account_homologations → cifras)."] : []),
  ];
  const limitations = [
    ...(cr.valuation?.waccWarning ? [cr.valuation.waccWarning] : []),
    ...(lineageGaps.length
      ? [`Trazabilidad documental: ${lineageGaps.join(" ")} Es una limitación de trazabilidad, no de reproducibilidad matemática${verification ? ": el cálculo está verificado oficialmente contra el resultado canónico congelado." : "."}`]
      : cr.provenance?.overall_status && cr.provenance.overall_status !== "complete" ? [`Lineage documental ${cr.provenance.overall_status}: no todas las cifras tienen procedencia documental completa.`] : []),
    ...(!cr.resolved_assumptions_used ? ["Supuestos legacy por defecto: no es una valoración defendible."] : []),
  ];

  const handlePdf = async () => {
    setDownloading(true);
    await downloadCanonicalPdf({ calculationResult: cr, companyName: a.company_name, sector: a.sector });
    setDownloading(false);
  };

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {verification ? (
        <Panel title="Official calculation verified" layer="CALCULATION" right={<span className="font-mono text-[10px] text-emerald-300">VERIFIED</span>}>
          <KV rows={[
            { k: "Fingerprint", v: verification.fingerprint },
            { k: "Assumptions", v: `${verification.assumptionsSource} · ${verification.assumptionsCount}` },
            { k: "Verification", v: `${verification.realMismatches} real mismatches` },
            { k: "Machine-precision equivalents", v: `${verification.floatEquivalent}${verification.toleranceK !== null ? ` (≤ ${verification.toleranceK}·ε)` : ""}` },
            { k: "Verificado", v: date(verification.verifiedAt) },
          ]} />
        </Panel>
      ) : (
        <Panel title="Verificación oficial" layer="CALCULATION" right={<span className="font-mono text-[10px] text-muted-foreground">NOT VERIFIED</span>}>
          <Empty>No hay una verificación oficial registrada para este cálculo (evento <code>official_calculation_verified</code> con el mismo fingerprint y fecha de cálculo).</Empty>
        </Panel>
      )}
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
          <ul className="list-disc pl-4 text-xs text-amber-300 space-y-1 whitespace-normal">{limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
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
  const states = caseProvenance(data);
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
              { k: "Lineage documental", v: v.provenance_status },
              { k: "Case source provenance", v: states.caseSource.status },
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
            head={["Campo", "Source layer", "Lineage", "Document lineage", "Homologation"]}
            numericFrom={9}
            rows={Object.entries(fields).map(([k, f]) => {
              const docs = f.document_ids?.length ?? 0;
              const homs = f.homologation_ids?.length ?? 0;
              const layer: SourceLayer | null = docs > 0 ? "SUPABASE_DOCUMENT_EVIDENCE" : states.evidenceLayer;
              return [
                <span className="font-mono">{k}</span>,
                layer ? <SourceLayerTag layer={layer} /> : <span className="text-muted-foreground">no registrada</span>,
                f.source_status,
                docs > 0 ? `${docs} documento(s)` : <span className="text-muted-foreground italic">not available</span>,
                homs > 0 ? `${homs} homologación(es)` : <span className="text-muted-foreground italic">not available</span>,
              ];
            })}
          />
          <p className="mt-2 text-[10px] text-muted-foreground">«not available» es una ausencia conocida de lineage documental, no un error: no se fabrican document_id, row_id ni homologation_id.</p>
        </Panel>
      )}
      <Panel title={`Eventos (${data.auditEvents.length})`}>
        {data.auditEvents.length === 0 ? <Empty>Sin eventos.</Empty> : (
          <DataTable head={["Fecha", "Componente", "Evento", "Detalle"]} numericFrom={9} wrap={[3]} rows={data.auditEvents.map((e) => [date(e.created_at), e.component ?? "—", e.event_type, e.event_detail ?? ""])} />
        )}
      </Panel>
    </div>
  );
}

/** Run de Evidence que alimenta homologaciones/validaciones mostradas (el historial no se suma). */
function activeEvidenceRunLabel(data: Pick<CaseData, "analysis" | "evidenceRuns">): string {
  const activeId = (data.analysis as { active_evidence_run_id?: string | null } | null)?.active_evidence_run_id ?? null;
  const history = data.evidenceRuns.length;
  if (!activeId) return history ? `Legacy (sin run promovido) · ${history} run(s) en historial` : "Legacy (filas anteriores al versionado)";
  const run = data.evidenceRuns.find((r) => r.id === activeId);
  return `${activeId.slice(0, 8)} · ${run?.status ?? "—"}${run?.completed_at ? ` · ${date(run.completed_at)}` : ""} · ${history} run(s) en historial`;
}
