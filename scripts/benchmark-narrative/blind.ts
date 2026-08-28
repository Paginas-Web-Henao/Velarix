// Soporte para revisión humana ciega — genera un artefacto Case/Task/
// Output A/Output B sin exponer provider/model en la parte de evaluación.
// El mapping A/B -> provider queda en una estructura SEPARADA
// (`BlindReviewMapping`), nunca mezclada con las filas que vería el
// revisor humano. Módulo puro — sin red, sin I/O.
//
// La asignación A/B es determinística a partir de (fixtureId, task, seed)
// vía un hash — NO siempre asigna Anthropic="A" (eso introduciría un sesgo
// de orden trivial de romper para quien revisa). Ver blind.test.ts.

import type { Provider, FixtureId, BenchmarkTask } from "./types.ts";

/** FNV-1a de 32 bits — determinístico, sin dependencias externas, suficiente para esto (no es criptográfico). */
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export type BlindLabel = "A" | "B";

export interface BlindAssignment {
  fixtureId: FixtureId;
  task: BenchmarkTask;
  labelForProvider: Record<Provider, BlindLabel>;
  providerForLabel: Record<BlindLabel, Provider>;
}

/** Asigna A/B de forma determinística — mismo (fixtureId, task, seed) siempre produce la misma asignación, pero la asignación varía entre combinaciones (no es un mapeo fijo Anthropic=A). */
export function assignBlindLabels(fixtureId: FixtureId, task: BenchmarkTask, seed = 0): BlindAssignment {
  const hash = fnv1a(`${fixtureId}::${task}::${seed}`);
  const anthropicIsA = hash % 2 === 0;
  const labelForProvider: Record<Provider, BlindLabel> = anthropicIsA
    ? { anthropic: "A", openai: "B" }
    : { anthropic: "B", openai: "A" };
  const providerForLabel: Record<BlindLabel, Provider> = anthropicIsA
    ? { A: "anthropic", B: "openai" }
    : { A: "openai", B: "anthropic" };
  return { fixtureId, task, labelForProvider, providerForLabel };
}

export interface BlindReviewRow {
  case: FixtureId;
  task: BenchmarkTask;
  outputA: string | null;
  outputB: string | null;
}

export interface BlindReviewMapping {
  fixtureId: FixtureId;
  task: BenchmarkTask;
  providerForLabel: Record<BlindLabel, Provider>;
}

export interface BlindReviewInput {
  fixtureId: FixtureId;
  task: BenchmarkTask;
  provider: Provider;
  text: string | null;
}

export interface BlindReviewArtifact {
  rows: BlindReviewRow[];
  mapping: BlindReviewMapping[];
}

/**
 * Arma el artefacto ciego a partir de resultados ya obtenidos (reales, vía
 * --execute, o simulados en un test) — nunca llama a ningún proveedor.
 * `rows` es lo que vería el revisor humano (sin provider/model); `mapping`
 * es la clave A/B -> provider, que se guarda por separado.
 */
export function buildBlindReviewArtifact(results: readonly BlindReviewInput[], seed = 0): BlindReviewArtifact {
  const byFixtureTask = new Map<string, { fixtureId: FixtureId; task: BenchmarkTask; anthropic: string | null; openai: string | null }>();
  for (const r of results) {
    const key = `${r.fixtureId}::${r.task}`;
    const entry = byFixtureTask.get(key) ?? { fixtureId: r.fixtureId, task: r.task, anthropic: null, openai: null };
    entry[r.provider] = r.text;
    byFixtureTask.set(key, entry);
  }

  const rows: BlindReviewRow[] = [];
  const mapping: BlindReviewMapping[] = [];
  for (const entry of byFixtureTask.values()) {
    const assignment = assignBlindLabels(entry.fixtureId, entry.task, seed);
    rows.push({
      case: entry.fixtureId,
      task: entry.task,
      outputA: assignment.providerForLabel.A === "anthropic" ? entry.anthropic : entry.openai,
      outputB: assignment.providerForLabel.B === "anthropic" ? entry.anthropic : entry.openai,
    });
    mapping.push({ fixtureId: entry.fixtureId, task: entry.task, providerForLabel: assignment.providerForLabel });
  }
  return { rows, mapping };
}
