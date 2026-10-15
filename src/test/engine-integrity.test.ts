// Protección del motor y de los fixtures congelados de Alpina.
//
// El cálculo oficial de Alpina (fingerprint db5429ad178da7f5) fue verificado
// contra el motor local el 2026-10-15 (0 diferencias reales). Si alguno de
// estos archivos cambia, la verificación persistida deja de describir el
// código del repo. Cambiarlos es posible, pero debe ser una decisión
// deliberada: actualizar el hash aquí obliga a hacerlo de forma explícita.
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PINNED: Record<string, string> = {
  "canonical-financial-engine.ts": "5ff1a97b4af74d8d8e8a623b7aad438f21e14edca1abcfe15fbaf1112f5c6996",
  "alpina-2024.structured-input.ts": "0e65c9bbb18ca4304c7126133a8c8091e03791ae833150a84deabad541fb6a53",
  "alpina-2024.resolved-assumptions.ts": "b37dee2bf208f8a29c592b72224aa9fb3d23a7d957912a9b5ab7f3ed72d3508f",
  "alpina-2024.canonical-execution.test.ts": "da2328b3ffb64d384d7784015da61f8fc76e003782152a4e1e50f82e9857a587",
};

describe("integridad del motor y de los fixtures congelados", () => {
  it.each(Object.entries(PINNED))("%s no cambió", (file, sha) => {
    const content = readFileSync(join(__dirname, "../../supabase/functions/_shared", file));
    expect(createHash("sha256").update(content).digest("hex")).toBe(sha);
  });
});
