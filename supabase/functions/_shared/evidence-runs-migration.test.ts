// La migración de versionado es aditiva y no toca datos existentes.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sql = readFileSync(join(__dirname, "../../migrations/20261016120000_evidence_runs_and_document_types.sql"), "utf8");
const code = sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");

describe("migración evidence_runs + tipos documentales", () => {
  it("es aditiva: sin DROP, DELETE, UPDATE, TRUNCATE ni cambios de RLS existentes", () => {
    expect(code).not.toMatch(/\b(DROP|DELETE\s+FROM|TRUNCATE|UPDATE\s+public\.|DISABLE ROW LEVEL SECURITY|ALTER POLICY|RENAME)\b/i);
    // Las FK nuevas usan ON DELETE solo hacia analyses (igual que las tablas existentes) o NO ACTION.
    expect((code.match(/ON DELETE \w+/g) ?? [])).toEqual(["ON DELETE CASCADE"]);
  });

  it("la tabla nueva tiene RLS y la lectura se deriva del dueño del análisis", () => {
    expect(code).toMatch(/ALTER TABLE public\.evidence_runs ENABLE ROW LEVEL SECURITY/);
    expect(code).toMatch(/FOR SELECT\s+TO authenticated\s+USING \(\s*analysis_id IN \(SELECT id FROM public\.analyses WHERE user_id = auth\.uid\(\)\)/);
    expect(code).not.toMatch(/evidence_runs FOR (INSERT|UPDATE|DELETE|ALL)/);
  });

  it("columnas nuevas nullable (legacy queda en NULL) y doc_type_declared no se renombra ni elimina", () => {
    for (const col of ["account_homologations\n  ADD COLUMN IF NOT EXISTS evidence_run_id UUID", "validation_results\n  ADD COLUMN IF NOT EXISTS evidence_run_id UUID", "analyses\n  ADD COLUMN IF NOT EXISTS active_evidence_run_id UUID", "doc_type_effective TEXT", "doc_type_origin TEXT"]) {
      expect(code).toContain(col);
    }
    expect(code).not.toMatch(/(evidence_run_id|active_evidence_run_id|doc_type_effective) UUID NOT NULL|doc_type_effective TEXT NOT NULL/);
    expect(code).not.toMatch(/doc_type_declared\s+(TYPE|DROP)/i);
  });
});
