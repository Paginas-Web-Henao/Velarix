// Bug NULL/vacuous-pass — pruebas de especificación de `evaluate()`, la
// función real usada por `validate-analysis` (no una copia de la condición).
//
// Cubre: DOC_002 deja de aprobar `file_size_bytes` ausente; BAL_002,
// BAL_003, BAL_005 e IS_001 dejan de emitir un PASS vacío cuando su input
// no existe — en su lugar, la regla de propiedad NO se emite y la ausencia
// queda registrada por su MAP_* correspondiente (mismo precedente
// arquitectónico ya usado por BAL_001).

import { describe, it, expect } from "vitest";
import { evaluate, type DocumentInput } from "./validation-rules";
import type { HomologatedAccountRow } from "./financial-accounts";

const BASE_PERIOD = "2025";
const PERIODS = ["2025"];

function doc(overrides: Partial<DocumentInput> = {}): DocumentInput {
  return {
    original_filename: "estado_financiero.pdf",
    file_size_bytes: 1_000_000,
    processing_status: "completado",
    doc_type_declared: "balance_general",
    ...overrides,
  };
}

function findRule(results: ReturnType<typeof evaluate>, code: string) {
  return results.find((r) => r.code === code);
}

describe("evaluate — DOC_002 (tamaño de archivo)", () => {
  it("A. 5 MB: PASS", () => {
    const results = evaluate([], [doc({ file_size_bytes: 5 * 1024 * 1024 })], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "DOC_002");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(true);
  });

  it("B. 15 MB: FAIL, blocking, detail de tamaño excedido", () => {
    const results = evaluate([], [doc({ file_size_bytes: 15 * 1024 * 1024 })], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "DOC_002");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(false);
    expect(rule?.blocking).toBe(true);
    expect(rule?.detail).toBe("Archivo supera 10 MB.");
  });

  it("C. file_size_bytes null: FAIL, blocking, detail de tamaño desconocido (vacuous-pass corregido)", () => {
    const results = evaluate([], [doc({ file_size_bytes: null })], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "DOC_002");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(false);
    expect(rule?.blocking).toBe(true);
    expect(rule?.detail).toBe("No se pudo determinar el tamaño del archivo.");
  });
});

describe("evaluate — BAL_002 (total activos mayor a cero)", () => {
  it("A. total_assets presente > 0: PASS", () => {
    const accounts: HomologatedAccountRow[] = [{ canonical_account: "total_assets", value: 1_000_000, period: "2025" }];
    const results = evaluate(accounts, [], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "BAL_002");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(true);
  });

  it("B. total_assets presente <= 0: FAIL", () => {
    const accounts: HomologatedAccountRow[] = [{ canonical_account: "total_assets", value: 0, period: "2025" }];
    const results = evaluate(accounts, [], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "BAL_002");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(false);
  });

  it("C. total_assets missing: BAL_002 NO se emite; MAP_005 conserva su comportamiento actual", () => {
    const results = evaluate([], [], PERIODS, BASE_PERIOD);
    expect(findRule(results, "BAL_002")).toBeUndefined();
    const map005 = findRule(results, "MAP_005");
    expect(map005).toBeDefined();
    expect(map005?.passed).toBe(false);
    expect(map005?.severity).toBe("informativa");
    expect(map005?.detail).toBe("No se identificó total activos. Se calculará por suma de componentes.");
  });
});

describe("evaluate — BAL_003 (patrimonio positivo)", () => {
  it("A. equity presente > 0: PASS", () => {
    const accounts: HomologatedAccountRow[] = [{ canonical_account: "equity", value: 500_000, period: "2025" }];
    const results = evaluate(accounts, [], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "BAL_003");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(true);
  });

  it("B. equity presente <= 0: FAIL", () => {
    const accounts: HomologatedAccountRow[] = [{ canonical_account: "equity", value: -100, period: "2025" }];
    const results = evaluate(accounts, [], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "BAL_003");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(false);
  });

  it("C. equity missing: BAL_003 NO se emite; MAP_004 conserva su comportamiento actual", () => {
    const results = evaluate([], [], PERIODS, BASE_PERIOD);
    expect(findRule(results, "BAL_003")).toBeUndefined();
    const map004 = findRule(results, "MAP_004");
    expect(map004).toBeDefined();
    expect(map004?.passed).toBe(false);
    expect(map004?.severity).toBe("media");
    expect(map004?.detail).toBe("No se identificó patrimonio.");
  });
});

describe("evaluate — BAL_005 (caja no negativa, valor OBSERVADO — hallazgo BAL_005/cash resuelto)", () => {
  it("A. cash observado === 0: PASS", () => {
    const accounts: HomologatedAccountRow[] = [{ canonical_account: "cash", value: 0, period: "2025" }];
    const results = evaluate(accounts, [], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "BAL_005");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(true);
  });

  it("B. cash observado > 0: PASS", () => {
    const accounts: HomologatedAccountRow[] = [{ canonical_account: "cash", value: 1_000, period: "2025" }];
    const results = evaluate(accounts, [], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "BAL_005");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(true);
  });

  it("C. cash observado < 0: BAL_005 ahora detecta el signo negativo real (ya no pasa por sumAccountValue/Math.abs) — FAIL, no bloqueante, severity informativa, detail con 'posible' sobregiro (no lo afirma)", () => {
    const accounts: HomologatedAccountRow[] = [{ canonical_account: "cash", value: -1, period: "2025" }];
    const results = evaluate(accounts, [], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "BAL_005");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(false);
    expect(rule?.blocking).toBe(false);
    expect(rule?.severity).toBe("informativa");
    expect(rule?.detail).toBe("Caja con valor negativo (posible sobregiro).");
  });

  it("D. cash missing: BAL_005 NO se emite; MAP_002 conserva su comportamiento actual", () => {
    const results = evaluate([], [], PERIODS, BASE_PERIOD);
    expect(findRule(results, "BAL_005")).toBeUndefined();
    const map002 = findRule(results, "MAP_002");
    expect(map002).toBeDefined();
    expect(map002?.passed).toBe(false);
    expect(map002?.severity).toBe("media");
    expect(map002?.detail).toBe("No se identificó caja. Se usará valor cero.");
  });
});

describe("evaluate — IS_001 (ingresos mayores a cero)", () => {
  it("A. revenue presente > 0: PASS", () => {
    const accounts: HomologatedAccountRow[] = [{ canonical_account: "revenue", value: 2_000_000, period: "2025" }];
    const results = evaluate(accounts, [], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "IS_001");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(true);
  });

  it("B. revenue presente <= 0: FAIL", () => {
    const accounts: HomologatedAccountRow[] = [{ canonical_account: "revenue", value: 0, period: "2025" }];
    const results = evaluate(accounts, [], PERIODS, BASE_PERIOD);
    const rule = findRule(results, "IS_001");
    expect(rule).toBeDefined();
    expect(rule?.passed).toBe(false);
  });

  it("C. revenue missing + estado de resultados cargado: IS_001 NO se emite; MAP_001 falla con severity media", () => {
    const documents = [doc({ doc_type_declared: "estado_resultados" })];
    const results = evaluate([], documents, PERIODS, BASE_PERIOD);
    expect(findRule(results, "IS_001")).toBeUndefined();
    const map001 = findRule(results, "MAP_001");
    expect(map001).toBeDefined();
    expect(map001?.passed).toBe(false);
    expect(map001?.severity).toBe("media");
  });

  it("D. revenue missing + sin estado de resultados: IS_001 NO se emite; MAP_001 falla con severity informativa", () => {
    const results = evaluate([], [], PERIODS, BASE_PERIOD);
    expect(findRule(results, "IS_001")).toBeUndefined();
    const map001 = findRule(results, "MAP_001");
    expect(map001).toBeDefined();
    expect(map001?.passed).toBe(false);
    expect(map001?.severity).toBe("informativa");
  });
});

describe("evaluate — BAL_001 (regresión del precedente de omisión)", () => {
  it("si falta cualquiera de sus inputs (total_assets, total_liabilities, equity), BAL_001 NO se emite", () => {
    const accounts: HomologatedAccountRow[] = [
      { canonical_account: "total_assets", value: 1_000_000, period: "2025" },
      { canonical_account: "total_liabilities", value: 400_000, period: "2025" },
      // equity ausente
    ];
    const results = evaluate(accounts, [], PERIODS, BASE_PERIOD);
    expect(findRule(results, "BAL_001")).toBeUndefined();
  });
});
