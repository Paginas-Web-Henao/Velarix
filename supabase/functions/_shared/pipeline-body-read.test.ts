// Guarda de regresión sobre el bug de `req.clone()` corregido en
// `run-analysis-pipeline` (commit 217a677): lee el código fuente real
// desplegado — no un mock — para bloquear que alguien reintroduzca
// `req.clone()` en el catch o una segunda lectura del body.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pipelineSourcePath = join(here, "..", "run-analysis-pipeline", "index.ts");
const source = readFileSync(pipelineSourcePath, "utf-8");

// El archivo tiene comentarios que describen en prosa el bug ya corregido
// (mencionan literalmente "req.clone()" y "req.json()" como texto
// explicativo) — se excluyen las líneas de comentario para comprobar
// exclusivamente el código ejecutable real.
const codeOnly = source
  .split("\n")
  .filter((line) => !line.trim().startsWith("//"))
  .join("\n");

describe("run-analysis-pipeline — el body del request se lee una sola vez", () => {
  it("no usa req.clone() en el código ejecutable", () => {
    expect(codeOnly).not.toMatch(/req\.clone\(/);
  });

  it("llama a req.json() exactamente una vez en el código ejecutable", () => {
    const matches = codeOnly.match(/req\.json\(\)/g) || [];
    expect(matches).toHaveLength(1);
  });

  it("captura analysis_id en una variable de ámbito externo (capturedAnalysisId) antes del try", () => {
    const tryIndex = source.indexOf("try {");
    const declIndex = source.indexOf("let capturedAnalysisId");
    expect(declIndex).toBeGreaterThan(-1);
    expect(declIndex).toBeLessThan(tryIndex);
  });

  it("el catch usa capturedAnalysisId, no vuelve a leer ni clonar req", () => {
    const catchBlock = source.slice(source.indexOf("} catch (error) {"));
    expect(catchBlock).toContain("capturedAnalysisId");
    expect(catchBlock).not.toMatch(/req\.json\(\)|req\.clone\(/);
  });

  it("la notificación de error solo se decide vía shouldNotifyPipelineError (401/404 nunca notifican)", () => {
    const catchBlock = source.slice(source.indexOf("} catch (error) {"));
    expect(catchBlock).toContain("shouldNotifyPipelineError(mapped, capturedAnalysisId)");
  });
});
