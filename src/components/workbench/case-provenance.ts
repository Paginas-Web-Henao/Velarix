// Semántica de procedencia del caso, derivada SOLO de datos persistidos
// (calculation_result + audit_events + tablas del caso). Nada específico de
// un caso: Alpina no se nombra aquí. Nunca se declara VERIFIED sin un
// evento de verificación que coincida con el cálculo persistido.
import type { CaseData, CaseQuestion } from "./useCaseData";

export type SourceLayer = "REPO_CANONICAL_EVIDENCE" | "SUPABASE_DOCUMENT_EVIDENCE";

export interface ProvenanceState {
  status: string;
  tone: "ok" | "info" | "missing";
  detail: string;
}

type EventMeta = Record<string, unknown> | null | undefined;
const meta = (e: { metadata?: unknown }) => (e.metadata ?? null) as EventMeta;
const num = (v: unknown) => (typeof v === "number" ? v : null);

export interface OfficialVerification {
  fingerprint: string;
  assumptionsSource: string;
  assumptionsCount: number;
  exactMatches: number | null;
  floatEquivalent: number;
  realMismatches: 0;
  toleranceK: number | null;
  verifiedAt: string;
  gitCommit: string | null;
}

/**
 * Verificación oficial vigente: existe un evento `official_calculation_verified`
 * con 0 diferencias reales para EXACTAMENTE este cálculo (mismo fingerprint y
 * mismo `calculated_at`). Si el cálculo cambia, la verificación deja de aplicar.
 */
export function officialVerification(data: Pick<CaseData, "calculation" | "auditEvents">): OfficialVerification | null {
  const v = data.calculation?.version;
  if (!v?.input_fingerprint) return null;
  const ev = data.auditEvents.find((e) => {
    const m = meta(e);
    return e.event_type === "official_calculation_verified" && !!m &&
      m.input_fingerprint === v.input_fingerprint &&
      (m.calculated_at ?? null) === (v.calculated_at ?? null) &&
      m.real_mismatches === 0;
  });
  if (!ev) return null;
  const m = meta(ev)!;
  const tol = m.tolerance as { K?: unknown } | undefined;
  return {
    fingerprint: v.input_fingerprint,
    assumptionsSource: v.assumptions_source,
    assumptionsCount: Object.keys(data.calculation?.resolved_assumptions_used ?? {}).length,
    exactMatches: num(m.exact_matches),
    floatEquivalent: num(m.float_equivalent) ?? 0,
    realMismatches: 0,
    toleranceK: num(tol?.K),
    verifiedAt: ev.created_at,
    gitCommit: typeof m.git_commit === "string" ? m.git_commit : null,
  };
}

/** Evento que registra que el caso se materializó desde fuentes canónicas del repo. */
export function repoMaterialization(data: Pick<CaseData, "auditEvents">) {
  const ev = data.auditEvents.find((e) => e.event_type === "case_materialized_from_repo");
  if (!ev) return null;
  const m = meta(ev);
  return { gitCommit: typeof m?.git_commit === "string" ? m.git_commit : null, fingerprint: typeof m?.input_fingerprint_local === "string" ? m.input_fingerprint_local : null, at: ev.created_at };
}

export interface CaseProvenance {
  caseSource: ProvenanceState;
  documents: ProvenanceState;
  accountLineage: ProvenanceState;
  /** Capa de origen de los números del structured input / snapshot. */
  evidenceLayer: SourceLayer | null;
}

export function caseProvenance(data: Pick<CaseData, "calculation" | "auditEvents" | "documents" | "homologations">): CaseProvenance {
  const cr = data.calculation;
  const repo = repoMaterialization(data);
  const verified = officialVerification(data);
  const provDocs = cr?.provenance?.document_ids?.length ?? 0;
  const provHoms = cr?.provenance?.homologation_ids?.length ?? 0;
  const complete = cr?.provenance?.overall_status === "complete";

  let caseSource: ProvenanceState;
  if (repo) {
    const sameInput = !!verified && (!repo.fingerprint || repo.fingerprint === verified.fingerprint);
    caseSource = sameInput
      ? { status: "VERIFIED · REPO_CANONICAL", tone: "ok", detail: `Materializado desde fuentes canónicas del repo${repo.gitCommit ? ` (commit ${repo.gitCommit.slice(0, 7)})` : ""}; resultado oficial verificado contra el cálculo congelado (fingerprint ${verified!.fingerprint}).` }
      : { status: "REPO_CANONICAL", tone: "info", detail: `Materializado desde fuentes canónicas del repo${repo.gitCommit ? ` (commit ${repo.gitCommit.slice(0, 7)})` : ""}; sin verificación oficial vigente para este cálculo.` };
  } else {
    caseSource = { status: "NOT RECORDED", tone: "missing", detail: "No hay un evento que registre el origen del caso." };
  }

  const documents: ProvenanceState = provDocs > 0
    ? { status: complete ? "COMPLETE" : "PARTIAL", tone: complete ? "ok" : "info", detail: `${provDocs} documento(s) enlazados al cálculo · ${data.documents.length} en Storage.` }
    : { status: "MISSING", tone: "missing", detail: `Sin lineage de ingesta documental para este cálculo (${data.documents.length} documento(s) en Storage).` };

  const accountLineage: ProvenanceState = provHoms > 0
    ? { status: complete ? "COMPLETE" : "PARTIAL", tone: complete ? "ok" : "info", detail: `${provHoms} homologación(es) enlazadas · ${data.homologations.length} en el caso.` }
    : { status: "MISSING", tone: "missing", detail: `Sin lineage de homologación de cuentas (${data.homologations.length} homologaciones en el caso).` };

  return { caseSource, documents, accountLineage, evidenceLayer: provDocs > 0 ? "SUPABASE_DOCUMENT_EVIDENCE" : repo ? "REPO_CANONICAL_EVIDENCE" : null };
}

// ── Preguntas del Expediente: código y versiones ─────────────────────────

/** Código estable de una pregunta (`[C-11] …` → `C-11`, `[C-07.1] …` → `C-07.1`). */
export const questionCode = (texto: string) => /^\[(C-\d{2}(?:\.\d+)?)\]/.exec(texto)?.[1] ?? null;
export const questionTitle = (texto: string) => texto.replace(/^\[[^\]]+\]\s*/, "");

export interface QuestionThread {
  code: string | null;
  current: CaseQuestion;
  /** Versiones anteriores (superseded), de la más reciente a la más antigua. Se conservan, nunca se borran. */
  history: CaseQuestion[];
}

/** Agrupa versiones: la vigente es la que ninguna otra fila supersede. Orden por código (C-07 < C-07.1 < C-08). */
export function questionThreads(questions: CaseQuestion[]): QuestionThread[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const superseded = new Set(questions.map((q) => q.supersedes_question_id).filter((x): x is string => !!x));
  const threads = questions.filter((q) => !superseded.has(q.id)).map((current) => {
    const history: CaseQuestion[] = [];
    for (let prev = current.supersedes_question_id ? byId.get(current.supersedes_question_id) : undefined; prev; prev = prev.supersedes_question_id ? byId.get(prev.supersedes_question_id) : undefined) {
      history.push(prev);
    }
    return { code: questionCode(current.texto), current, history };
  });
  return threads.sort((a, b) => (a.code && b.code ? a.code.localeCompare(b.code, undefined, { numeric: true }) : a.code ? -1 : b.code ? 1 : 0));
}

/** Separa "… Fuente: X" para mostrarlo aparte. Solo presentación: el texto completo sigue accesible. */
export function splitSource(text: string): { body: string; source: string | null } {
  const i = text.lastIndexOf(" Fuente: ");
  return i < 0 ? { body: text, source: null } : { body: text.slice(0, i), source: text.slice(i + " Fuente: ".length) };
}
