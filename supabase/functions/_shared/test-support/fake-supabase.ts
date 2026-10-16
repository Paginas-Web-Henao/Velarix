// Doble de prueba mínimo de supabase-js para ejercer las Edge Functions
// (index.ts) dentro de Vitest. NO es un cliente real: solo implementa las
// cadenas de consulta que usan run-analysis-pipeline y upload-document, y
// registra cada escritura para poder afirmar qué tocó y qué no.

export interface Write {
  table: string;
  op: "insert" | "update" | "upsert" | "delete";
  payload?: unknown;
  filters: Record<string, unknown>;
}

export interface FakeState {
  analysis: Record<string, unknown> | null;
  documents: Record<string, unknown>[];
  writes: Write[];
  /** Hooks por tabla para simular efectos de otras funciones (p. ej. validate-analysis). */
  storageUploads: string[];
}

export function createFakeState(analysis: Record<string, unknown>, documents: Record<string, unknown>[] = []): FakeState {
  return { analysis: structuredClone(analysis), documents: structuredClone(documents), writes: [], storageUploads: [] };
}

export function createFakeSupabase(state: FakeState, userId: string | null = "owner-1") {
  const exec = (q: { table: string; op: string; payload?: unknown; filters: Record<string, unknown> }, single: boolean) => {
    if (q.op !== "select") state.writes.push({ table: q.table, op: q.op as Write["op"], payload: q.payload, filters: q.filters });

    if (q.table === "analyses") {
      if (q.op === "update") {
        if (state.analysis && state.analysis.id === q.filters.id) Object.assign(state.analysis, q.payload as object);
        return { data: null, error: null };
      }
      if (q.op === "select") return { data: state.analysis, error: state.analysis ? null : { code: "PGRST116", message: "no rows" } };
    }
    if (q.table === "job_locks" && q.op === "select") return { data: null, error: { code: "PGRST116", message: "no rows" } };
    if (q.table === "documents") {
      if (q.op === "select") return { data: state.documents, error: null };
      if (q.op === "insert") return { data: { id: "doc-1", ...(q.payload as object) }, error: null };
    }
    return { data: single ? null : [], error: null };
  };

  const from = (table: string) => {
    const q: { table: string; op: string; payload?: unknown; filters: Record<string, unknown> } = { table, op: "select", filters: {} };
    const chain: Record<string, unknown> = {
      select: () => chain,
      insert: (p: unknown) => { q.op = "insert"; q.payload = p; return chain; },
      update: (p: unknown) => { q.op = "update"; q.payload = p; return chain; },
      upsert: (p: unknown) => { q.op = "upsert"; q.payload = p; return chain; },
      delete: () => { q.op = "delete"; return chain; },
      eq: (k: string, v: unknown) => { q.filters[k] = v; return chain; },
      is: () => chain, order: () => chain, limit: () => chain, in: () => chain,
      single: () => Promise.resolve(exec(q, true)),
      maybeSingle: () => Promise.resolve(exec(q, true)),
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(exec(q, false)).then(res, rej),
    };
    return chain;
  };

  return {
    from,
    auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null }, error: null }) },
    storage: { from: () => ({ upload: async (path: string) => { state.storageUploads.push(path); return { error: null }; } }) },
  };
}

export const writesTo = (state: FakeState, table: string, op?: Write["op"]) =>
  state.writes.filter((w) => w.table === table && (!op || w.op === op));
