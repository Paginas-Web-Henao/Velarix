// Corrección manual de homologaciones (ADR-009): legacy permitida; filas de un
// evidence run versionado son inmutables → rechazo ANTES de cualquier UPDATE.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryDb, type MemoryDb } from "../../supabase/functions/_shared/test-support/memory-db";

const h = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@/integrations/supabase/client", () => ({ get supabase() { return h.client; } }));

const { corregirCuenta, VersionedManualCorrectionError } = await import("./manual-review-api");

let m: MemoryDb;
let updates: { table: string; payload: unknown }[];
function setup(activeRunId: string | null, rowRunId: string | null) {
  m = createMemoryDb({
    analyses: [{ id: "a1", user_id: "owner-1", active_evidence_run_id: activeRunId }],
    account_homologations: [{ id: "h1", analysis_id: "a1", original_label: "Gastos raros", canonical_account: "unclassified", evidence_run_id: rowRunId, mapping_notes: "Regla: no clasificado" }],
    manual_reviews: [{ id: "rev1", analysis_id: "a1", correcciones: [] }],
    audit_events: [],
  });
  updates = [];
  const base = m.client as { from: (t: string) => Record<string, (...a: unknown[]) => unknown> };
  h.client = { from: (t: string) => { const c = base.from(t); const up = c.update; c.update = (p: unknown) => { updates.push({ table: t, payload: p }); return up(p); }; return c; } };
}
const correct = () => corregirCuenta({ revisionId: "rev1", homologationId: "h1", nuevoCanonicalAccount: "opex", justificacion: "Gasto operativo según nota 12 del informe." });
const row = () => m.tables.account_homologations[0];

describe("corregirCuenta — inmutabilidad de evidence runs", () => {
  beforeEach(() => setup(null, null));

  it("1. legacy (sin run activo ni run en la fila): conserva el comportamiento actual", async () => {
    await correct();
    expect(row()).toMatchObject({ canonical_account: "opex", confidence_score: "alta" });
    expect(updates.map((u) => u.table)).toContain("account_homologations");
  });

  it("2. caso versionado (run activo): rechazo ANTES de cualquier UPDATE", async () => {
    setup("run-B", "run-B");
    await expect(correct()).rejects.toBeInstanceOf(VersionedManualCorrectionError);
    expect(updates).toEqual([]);
  });

  it("3. la fila histórica de un run permanece intacta (también sin puntero, p. ej. run fallido)", async () => {
    setup(null, "run-C");
    const before = structuredClone(row());
    await expect(correct()).rejects.toThrow(/inmutables/);
    expect(row()).toEqual(before);
    expect(m.tables.audit_events).toEqual([]);
  });

  it("4. el error explica que hace falta un nuevo Evidence run y trae el código pendiente", async () => {
    setup("run-B", "run-B");
    const err = await correct().catch((e) => e);
    expect(err.code).toBe("VERSIONED_MANUAL_MAPPING_CORRECTION_PENDING");
    expect(err.message).toMatch(/nuevo Evidence run/);
  });
});
