// Carga de solo lectura de un caso (fila de `analyses`) y de todo lo que
// cuelga de él en Supabase. Todas las consultas pasan por RLS: si el rol
// no permite ver una tabla (p. ej. el Expediente exige analyst/admin), la
// sección muestra el vacío en vez de inventar datos.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { PersistedCalculationResult } from "@/types/calculation-result";

export type CaseRow = Tables<"analyses">;

export interface CaseQuestion extends Tables<"expedient_questions"> {
  expedient_answers: Tables<"expedient_answers">[];
}

export interface CaseData {
  analysis: CaseRow | null;
  calculation: PersistedCalculationResult | null;
  documents: Pick<Tables<"documents">, "id" | "original_filename" | "doc_type_declared" | "mime_type" | "processing_status" | "uploaded_at" | "file_size_bytes">[];
  homologations: Tables<"account_homologations">[];
  validations: Tables<"validation_results">[];
  valuationFile: Tables<"valuation_files"> | null;
  accountNotes: Tables<"account_notes">[];
  questions: CaseQuestion[];
  reviews: Pick<Tables<"manual_reviews">, "id" | "estado" | "reason" | "prioridad" | "created_at">[];
  narrative: Pick<Tables<"report_narratives">, "executive_summary" | "audit_passed" | "created_at"> | null;
  auditEvents: Pick<Tables<"audit_events">, "id" | "event_type" | "event_detail" | "component" | "created_at" | "metadata">[];
  latestStructuredInput: { id: string; version_input: string | null; created_at: string; hasResolvedAssumptions: boolean } | null;
}

const EMPTY: CaseData = {
  analysis: null, calculation: null, documents: [], homologations: [], validations: [], valuationFile: null,
  accountNotes: [], questions: [], reviews: [], narrative: null, auditEvents: [], latestStructuredInput: null,
};

export function useCaseData(caseId: string | null) {
  const [data, setData] = useState<CaseData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caseId) { setData(EMPTY); return; }
    setLoading(true);
    setError(null);
    try {
      const { data: analysis, error: aErr } = await supabase.from("analyses").select("*").eq("id", caseId).maybeSingle();
      if (aErr) throw aErr;

      const [docs, homs, vals, vf, reviews, narr, events, si] = await Promise.all([
        supabase.from("documents").select("id, original_filename, doc_type_declared, mime_type, processing_status, uploaded_at, file_size_bytes").eq("analysis_id", caseId).order("uploaded_at", { ascending: false }),
        supabase.from("account_homologations").select("*").eq("analysis_id", caseId).order("canonical_account"),
        supabase.from("validation_results").select("*").eq("analysis_id", caseId).order("created_at"),
        supabase.from("valuation_files").select("*").eq("analysis_id", caseId).maybeSingle(),
        supabase.from("manual_reviews").select("id, estado, reason, prioridad, created_at").eq("analysis_id", caseId).order("created_at", { ascending: false }),
        supabase.from("report_narratives").select("executive_summary, audit_passed, created_at").eq("analysis_id", caseId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("audit_events").select("id, event_type, event_detail, component, created_at, metadata").eq("analysis_id", caseId).order("created_at", { ascending: false }).limit(100),
        supabase.from("structured_inputs").select("id, version_input, created_at, input_payload").eq("analysis_id", caseId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      let accountNotes: Tables<"account_notes">[] = [];
      let questions: CaseQuestion[] = [];
      if (vf.data) {
        const [notes, qs] = await Promise.all([
          supabase.from("account_notes").select("*").eq("valuation_file_id", vf.data.id).order("created_at"),
          supabase.from("expedient_questions").select("*, expedient_answers(*)").eq("valuation_file_id", vf.data.id).order("created_at"),
        ]);
        accountNotes = notes.data ?? [];
        questions = (qs.data as CaseQuestion[] | null) ?? [];
      }

      const payload = si.data?.input_payload as Record<string, unknown> | null | undefined;
      setData({
        analysis,
        calculation: (analysis?.calculation_result as unknown as PersistedCalculationResult | null) ?? null,
        documents: docs.data ?? [],
        homologations: homs.data ?? [],
        validations: vals.data ?? [],
        valuationFile: vf.data ?? null,
        accountNotes,
        questions,
        reviews: reviews.data ?? [],
        narrative: narr.data ?? null,
        auditEvents: events.data ?? [],
        latestStructuredInput: si.data
          ? {
              id: si.data.id,
              version_input: si.data.version_input,
              created_at: si.data.created_at,
              hasResolvedAssumptions: !!payload && Object.prototype.hasOwnProperty.call(payload, "resolved_assumptions"),
            }
          : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
