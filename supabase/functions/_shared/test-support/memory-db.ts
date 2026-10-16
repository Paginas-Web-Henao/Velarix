// Base de datos EN MEMORIA con la forma mínima de supabase-js que usan las
// Edge Functions (from().select/insert/update/delete + eq/is/in/order/limit +
// single/maybeSingle). A diferencia de fake-supabase.ts, aplica los filtros
// de verdad — incluido el compare-and-swap de la promoción de evidence runs —
// y conserva el estado entre llamadas para simular varios runs.
// Solo para tests: no es un cliente real.

export type Row = Record<string, unknown>;

export interface MemoryDb {
  tables: Record<string, Row[]>;
  /** Tablas cuyo próximo insert falla (simula un error de escritura). */
  failInsertOnce: Set<string>;
  /** Próximo insert de la tabla devuelve ESTE error (p. ej. el rechazo de un trigger). */
  insertErrorOnce: Map<string, { code?: string; message: string }>;
  /** Se ejecuta justo antes de cada insert/update: simula una escritura concurrente intercalada. */
  hooks: { before?: (table: string, op: string, payload: unknown) => void };
  client: { from: (t: string) => unknown; auth: { getUser: () => Promise<unknown> }; storage: { from: () => unknown } };
}

export function createMemoryDb(initial: Record<string, Row[]>, opts: { userId?: string; file?: Uint8Array } = {}): MemoryDb {
  const tables: Record<string, Row[]> = Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, structuredClone(v)]));
  const failInsertOnce = new Set<string>();
  const insertErrorOnce = new Map<string, { code?: string; message: string }>();
  const hooks: MemoryDb["hooks"] = {};
  let seq = 0;

  const from = (table: string) => {
    const q = { op: "select", returning: false, payload: undefined as unknown, onConflict: "id", eq: {} as Record<string, unknown>, is: {} as Record<string, null>, in: {} as Record<string, unknown[]> };
    const match = (r: Row) =>
      Object.entries(q.eq).every(([k, v]) => r[k] === v) &&
      Object.entries(q.is).every(([k]) => r[k] === null || r[k] === undefined) &&
      Object.entries(q.in).every(([k, vs]) => vs.includes(r[k]));
    // single: exige una fila (PGRST116 si no hay). maybeSingle: 0 filas = { data: null, error: null }, como supabase-js.
    const run = (single: boolean, maybe = false) => {
      if (q.op !== "select" && q.op !== "delete") hooks.before?.(table, q.op, q.payload);
      const rows = (tables[table] ??= []);
      if (q.op === "insert") {
        const injected = insertErrorOnce.get(table);
        if (injected) { insertErrorOnce.delete(table); return { data: null, error: injected }; }
        if (failInsertOnce.has(table)) { failInsertOnce.delete(table); return { data: null, error: { message: `simulated insert failure on ${table}` } }; }
        for (const p of ([] as Row[]).concat(q.payload as Row)) rows.push({ id: `${table}-${++seq}`, created_at: new Date(Date.now() + seq).toISOString(), ...p });
        return { data: null, error: null };
      }
      if (q.op === "upsert") {
        for (const p of ([] as Row[]).concat(q.payload as Row)) {
          const hit = rows.find((r) => r[q.onConflict] === p[q.onConflict]);
          if (hit) Object.assign(hit, p);
          else rows.push({ id: `${table}-${++seq}`, created_at: new Date(Date.now() + seq).toISOString(), ...p });
        }
        return { data: null, error: null };
      }
      if (q.op === "update") {
        const hit = rows.filter(match);
        hit.forEach((r) => Object.assign(r, q.payload));
        return { data: q.returning ? hit.map((r) => structuredClone(r)) : null, error: null };
      }
      if (q.op === "delete") { tables[table] = rows.filter((r) => !match(r)); return { data: null, error: null }; }
      const hits = rows.filter(match).map((r) => structuredClone(r));
      if (single && maybe) return { data: hits[0] ?? null, error: null };
      return single ? { data: hits[0] ?? null, error: hits[0] ? null : { code: "PGRST116", message: "no rows" } } : { data: hits, error: null };
    };
    const chain: Record<string, unknown> = {
      select: () => { if (q.op !== "select") q.returning = true; return chain; }, order: () => chain, limit: () => chain,
      eq: (k: string, v: unknown) => { q.eq[k] = v; return chain; },
      is: (k: string) => { q.is[k] = null; return chain; },
      in: (k: string, vs: unknown[]) => { q.in[k] = vs; return chain; },
      insert: (p: unknown) => { q.op = "insert"; q.payload = p; return chain; },
      update: (p: unknown) => { q.op = "update"; q.payload = p; return chain; },
      upsert: (p: unknown, o?: { onConflict?: string }) => { q.op = "upsert"; q.payload = p; q.onConflict = o?.onConflict ?? "id"; return chain; },
      delete: () => { q.op = "delete"; return chain; },
      single: () => Promise.resolve(run(true)), maybeSingle: () => Promise.resolve(run(true, true)),
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(run(false)).then(res, rej),
    };
    return chain;
  };

  return {
    tables, failInsertOnce, insertErrorOnce, hooks,
    client: {
      from,
      auth: { getUser: async () => ({ data: { user: { id: opts.userId ?? "owner-1" } }, error: null }) },
      storage: { from: () => ({ download: async () => ({ data: new Blob([(opts.file ?? new Uint8Array()) as BlobPart]), error: null }) }) },
    },
  };
}
