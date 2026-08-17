// Minimum Expediente Checkpoint — pruebas de la composición que hace
// ejecutar-calculo (resolver conteos desde valuation_file/account_notes/
// expedient_questions/expedient_answers -> evaluar). `computeCheckpointCounts`
// replica EXACTAMENTE la lógica de conteo de ejecutar-calculo/index.ts
// (mismo "si no hay valuation_file -> todo 0", mismo dedup por Set de
// question_id) sobre arreglos en memoria, ya que index.ts no puede
// importarse en Vitest (usa `serve()` de Deno std). El guard real se
// verifica también por inspección estática de código fuente (G7),
// mismo patrón que calculation-envelope.integration.test.ts.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { evaluateMinimumExpedienteCheckpoint } from "./minimum-expediente-checkpoint";

function computeCheckpointCounts(params: {
  valuationFileExists: boolean;
  accountNotesCount: number;
  questionsCount: number;
  answerQuestionIds: string[];
}) {
  if (!params.valuationFileExists) {
    return { materialAccountsCount: 0, ambiguitiesCount: 0, treatedAmbiguitiesCount: 0 };
  }
  return {
    materialAccountsCount: params.accountNotesCount,
    ambiguitiesCount: params.questionsCount,
    treatedAmbiguitiesCount: new Set(params.answerQuestionIds).size,
  };
}

describe("Minimum Expediente Checkpoint — composición real (ejecutar-calculo)", () => {
  const baseContext = { companyName: "Empresa Demo S.A.S.", sector: "Servicios empresariales" };

  it("G1. sin valuation_file -> checkpoint fail (material_account, ambiguity y treatment en false)", () => {
    const counts = computeCheckpointCounts({
      valuationFileExists: false,
      accountNotesCount: 5, // aunque existieran filas huérfanas, sin valuation_file no cuentan
      questionsCount: 5,
      answerQuestionIds: ["q1"],
    });
    const r = evaluateMinimumExpedienteCheckpoint({ ...baseContext, ...counts });
    expect(r.passed).toBe(false);
    expect(r.checks.material_account).toBe(false);
    expect(r.checks.ambiguity).toBe(false);
    expect(r.checks.treatment).toBe(false);
  });

  it("G2. valuation_file + 1 account_note únicamente -> fail ambiguity y treatment", () => {
    const counts = computeCheckpointCounts({
      valuationFileExists: true,
      accountNotesCount: 1,
      questionsCount: 0,
      answerQuestionIds: [],
    });
    const r = evaluateMinimumExpedienteCheckpoint({ ...baseContext, ...counts });
    expect(r.checks.material_account).toBe(true);
    expect(r.checks.ambiguity).toBe(false);
    expect(r.checks.treatment).toBe(false);
    expect(r.passed).toBe(false);
  });

  it("G3. + 1 expedient_question sin respuesta -> fail treatment", () => {
    const counts = computeCheckpointCounts({
      valuationFileExists: true,
      accountNotesCount: 1,
      questionsCount: 1,
      answerQuestionIds: [],
    });
    const r = evaluateMinimumExpedienteCheckpoint({ ...baseContext, ...counts });
    expect(r.checks.ambiguity).toBe(true);
    expect(r.checks.treatment).toBe(false);
    expect(r.passed).toBe(false);
    expect(r.missing).toEqual(["treatment"]);
  });

  it("G4. + 1 expedient_answer -> PASS", () => {
    const counts = computeCheckpointCounts({
      valuationFileExists: true,
      accountNotesCount: 1,
      questionsCount: 1,
      answerQuestionIds: ["question-1"],
    });
    const r = evaluateMinimumExpedienteCheckpoint({ ...baseContext, ...counts });
    expect(r.passed).toBe(true);
  });

  it("G4b. múltiples respuestas a la MISMA pregunta cuentan como 1 tratada (dedup por question_id, no por fila)", () => {
    const counts = computeCheckpointCounts({
      valuationFileExists: true,
      accountNotesCount: 1,
      questionsCount: 2,
      answerQuestionIds: ["question-1", "question-1", "question-1"], // 3 filas, 1 pregunta
    });
    expect(counts.treatedAmbiguitiesCount).toBe(1);
    const r = evaluateMinimumExpedienteCheckpoint({ ...baseContext, ...counts });
    expect(r.passed).toBe(true);
  });

  it("G5. un input_payload/structured_input válido NO puede por sí solo saltar el checkpoint: el evaluador no recibe ni considera nada del structured input", () => {
    // El contrato de entrada del evaluador (ver minimum-expediente-checkpoint.ts)
    // no tiene ningún campo relacionado con revenue/income_statement/
    // structured input — no existe ningún parámetro que un input
    // financiero válido pueda usar para forzar `passed: true`.
    const counts = computeCheckpointCounts({
      valuationFileExists: true,
      accountNotesCount: 1,
      questionsCount: 1,
      answerQuestionIds: [], // sin tratamiento, aunque el structured input fuera perfecto
    });
    const r = evaluateMinimumExpedienteCheckpoint({ ...baseContext, ...counts });
    expect(r.passed).toBe(false); // sigue fallando pase lo que pase con el input financiero
  });

  it("G6. evaluar el checkpoint es puro: no muta su input ni produce efectos secundarios sobre datos externos", () => {
    const input = { ...baseContext, materialAccountsCount: 1, ambiguitiesCount: 1, treatedAmbiguitiesCount: 1 };
    const inputSnapshot = JSON.parse(JSON.stringify(input));
    const r1 = evaluateMinimumExpedienteCheckpoint(input);
    const r2 = evaluateMinimumExpedienteCheckpoint(input);
    expect(input).toEqual(inputSnapshot); // el input no fue mutado
    expect(r1).toEqual(r2); // resultado determinístico, sin estado oculto
  });

  it("G7. inspección estática: el bloqueo por checkpoint ocurre en el código ANTES de invocar el motor canónico", () => {
    const sourcePath = path.resolve(__dirname, "../ejecutar-calculo/index.ts");
    const source = fs.readFileSync(sourcePath, "utf-8");

    const checkpointFailIdx = source.indexOf('code: "MINIMUM_EXPEDIENTE_REQUIRED"');
    const engineCallIdx = source.indexOf("runCanonicalFinancialEngine(typedInput");

    expect(checkpointFailIdx).toBeGreaterThan(-1);
    expect(engineCallIdx).toBeGreaterThan(-1);
    expect(checkpointFailIdx).toBeLessThan(engineCallIdx);

    // Confirma también que no existe ningún bypass explícito del guard
    // (isInternalServiceCall no debe aparecer condicionando el checkpoint).
    const checkpointBlockStart = source.indexOf("Minimum Expediente Checkpoint (docs/velarix");
    const checkpointBlockEnd = checkpointFailIdx;
    const checkpointBlock = source.slice(checkpointBlockStart, checkpointBlockEnd);
    expect(checkpointBlock).not.toContain("isInternalCall");
    expect(checkpointBlock).not.toContain("skip_checkpoint");
    expect(checkpointBlock).not.toContain("test_mode");
  });

  it("G8. el guard distingue error real de DB (throw, cae en el catch general) de ausencia legítima (checkpoint FAIL/409) — inspección estática de ejecutar-calculo/index.ts", () => {
    const sourcePath = path.resolve(__dirname, "../ejecutar-calculo/index.ts");
    const source = fs.readFileSync(sourcePath, "utf-8");

    expect(source).toContain("error: valuationFileError");
    expect(source).toContain("if (valuationFileError)");
    expect(source).toContain("if (materialRes.error) throw");
    expect(source).toContain("if (questionsRes.error) throw");
    expect(source).toContain("if (answeredRes.error) throw");

    // Los 4 chequeos de error deben aparecer ANTES de evaluar el
    // checkpoint (para que un error real nunca llegue a producir
    // MINIMUM_EXPEDIENTE_REQUIRED).
    const lastErrorCheckIdx = source.indexOf("if (answeredRes.error) throw");
    const checkpointEvalIdx = source.indexOf("evaluateMinimumExpedienteCheckpoint({");
    expect(lastErrorCheckIdx).toBeGreaterThan(-1);
    expect(checkpointEvalIdx).toBeGreaterThan(-1);
    expect(lastErrorCheckIdx).toBeLessThan(checkpointEvalIdx);
  });
});

describe("Minimum Expediente Checkpoint — migration (inspección estática del SQL)", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../../migrations/20260817140000_minimum_expediente_checkpoint.sql",
  );
  const sql = fs.readFileSync(migrationPath, "utf-8");

  it("M1. crea únicamente las 4 tablas oficiales, sin company_context/evidence_links/otras", () => {
    expect(sql).toContain("CREATE TABLE public.valuation_files");
    expect(sql).toContain("CREATE TABLE public.account_notes");
    expect(sql).toContain("CREATE TABLE public.expedient_questions");
    expect(sql).toContain("CREATE TABLE public.expedient_answers");
    expect(sql).not.toContain("CREATE TABLE public.company_context");
    expect(sql).not.toContain("CREATE TABLE public.evidence_links");
    expect(sql).not.toContain("CREATE TABLE public.normalizations");
    expect(sql).not.toContain("CREATE TYPE public.epistemic_status");
  });

  it("M2. append-only: ninguna política FOR UPDATE ni FOR DELETE en las 4 tablas", () => {
    expect(sql).not.toContain("FOR UPDATE");
    expect(sql).not.toContain("FOR DELETE");
  });

  it("M3. atribución de actor sigue protegida en INSERT (rol + identidad, no solo rol)", () => {
    expect(sql).toContain("created_by = auth.uid()");
    expect(sql).toContain("generado_por = auth.uid()");
    expect(sql).toContain("respondido_por = auth.uid()");
  });

  it("M4. sin índice redundante sobre valuation_files.analysis_id (UNIQUE ya lo crea)", () => {
    expect(sql).not.toContain("idx_valuation_files_analysis");
  });

  it("M5. account_note_id pospuesto: no existe como columna en expedient_questions (puede mencionarse en comentarios explicando la decisión)", () => {
    const tableStart = sql.indexOf("CREATE TABLE public.expedient_questions");
    const tableEnd = sql.indexOf(");", tableStart);
    const tableDefinition = sql.slice(tableStart, tableEnd);
    expect(tableDefinition).not.toContain("account_note_id");
  });

  it("M6. account_notes sin updated_at (append-only, sin uso real todavía)", () => {
    const accountNotesBlock = sql.slice(sql.indexOf("CREATE TABLE public.account_notes"), sql.indexOf("CREATE TABLE public.expedient_questions"));
    expect(accountNotesBlock).not.toContain("updated_at");
  });

  it("M7. RLS habilitada en las 4 tablas", () => {
    expect(sql).toContain("ALTER TABLE public.valuation_files ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("ALTER TABLE public.account_notes ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("ALTER TABLE public.expedient_questions ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("ALTER TABLE public.expedient_answers ENABLE ROW LEVEL SECURITY");
  });
});
