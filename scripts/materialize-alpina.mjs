// npm run materialize:alpina [-- --apply | --calculate]
//
// Materializa Alpina (caso canónico del repo) en Supabase como el caso
// operativo del owner. Plan puro y fuentes: scripts/alpina/materialization-plan.ts.
//
//   (sin flags)   DRY-RUN: lee Supabase y muestra qué escribiría. No escribe nada.
//   --apply       Escribe lo que falte (idempotente: nunca duplica; aborta ante inconsistencias).
//   --calculate   Ejecuta el flujo oficial `ejecutar-calculo` (checkpoint + preflight + motor)
//                 sobre el caso ya materializado y compara el resultado, sin tolerancia,
//                 con el motor local sobre el mismo fixture congelado. Si ya existe un
//                 cálculo persistido, solo compara (no recalcula).
//
// Seguridad (ADR-008):
// - Usa la sesión del owner (VELARIX_OWNER_EMAIL/PASSWORD de .env.local) con la
//   publishable key: todo pasa por RLS, como en la app. Nunca secret/service_role.
// - El owner se resuelve de la sesión (auth), nunca de un UUID fijo.
// - No imprime credenciales ni tokens.
import { execFileSync } from "node:child_process";
import { createServer, loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const CALCULATE = args.has("--calculate");
if (APPLY && CALCULATE) fail("Usa --apply y --calculate en ejecuciones separadas (revisa el Expediente entre ambas).");

function fail(msg) {
  console.error(`\n✗ ABORTADO: ${msg}`);
  process.exit(1);
}
const log = (...a) => console.log(...a);

// ─── Cargar módulos TS del repo (solo lectura) vía Vite ─────────────
// Solo se usa ssrLoadModule (Node): el pre-bundling de dependencias del
// navegador no aplica. Sin `noDiscovery`/`entries: []`, el scanner recorre
// index.html → src/ y falla al no conocer el alias `@/` (configFile:false).
const vite = await createServer({
  server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error", configFile: false,
  optimizeDeps: { noDiscovery: true, entries: [] },
});
let plan, engine, fp, snap;
try {
  plan = await vite.ssrLoadModule("/scripts/alpina/materialization-plan.ts");
  engine = await vite.ssrLoadModule("/supabase/functions/_shared/canonical-financial-engine.ts");
  fp = await vite.ssrLoadModule("/supabase/functions/_shared/calculation-fingerprint.ts");
  snap = await vite.ssrLoadModule("/supabase/functions/_shared/resolved-assumptions-snapshot.ts");
} finally {
  await vite.close();
}
const { ALPINA_ANALYSIS: A, ALPINA_STRUCTURED_PAYLOAD: PAYLOAD, ALPINA_ACCOUNT_NOTES, ALPINA_QUESTIONS, sameJson, questionKey } = plan;

// ─── Provenance: los fixtures deben estar commiteados ────────────────
const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();
const dirty = git("status", "--porcelain", "--", ...plan.SOURCE_FILES, "scripts/alpina");
if (dirty) {
  const msg = `hay cambios sin commitear en las fuentes canónicas:\n${dirty}\nLa provenance debe apuntar a un commit.`;
  if (APPLY || CALCULATE) fail(msg);
  console.warn(`⚠ ${msg} (aviso de dry-run)`);
}
const gitCommit = git("rev-parse", "HEAD");
const localFingerprint = fp.computeInputFingerprint(PAYLOAD, A.sector, A.expected_growth);

// ─── Sesión del owner ───────────────────────────────────────────────
const env = loadEnv("development", process.cwd(), "");
for (const k of ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY", "VELARIX_OWNER_EMAIL", "VELARIX_OWNER_PASSWORD"]) {
  if (!env[k]) fail(`falta ${k} en .env.local`);
}
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: auth, error: authErr } = await sb.auth.signInWithPassword({ email: env.VELARIX_OWNER_EMAIL, password: env.VELARIX_OWNER_PASSWORD });
if (authErr || !auth.session) fail(`no se pudo iniciar la sesión del owner (${authErr?.message ?? "sin sesión"})`);
const owner = auth.user.id;

const must = (res, what) => {
  if (res.error) fail(`${what}: ${res.error.message}`);
  return res.data;
};

try {
  const profile = must(await sb.from("profiles").select("role").eq("id", owner).maybeSingle(), "leyendo profiles");
  if (!["admin", "analyst"].includes(profile?.role)) fail(`el owner tiene rol ${profile?.role ?? "sin perfil"}; el Expediente exige admin/analyst (RLS).`);

  const countAnalyses = async () => (await sb.from("analyses").select("id", { count: "exact", head: true })).count;
  const before = await countAnalyses();

  log(`Velarix · materialize:alpina — ${CALCULATE ? "CALCULATE" : APPLY ? "APPLY" : "DRY-RUN (no escribe)"}`);
  log(`  owner        ${owner} (rol ${profile.role}, resuelto desde la sesión)`);
  log(`  commit       ${gitCommit}`);
  log(`  fingerprint  ${localFingerprint} (local, fixture congelado)`);
  log(`  analyses     ${before} visibles por RLS antes`);

  // ─── Detección del caso existente ─────────────────────────────────
  const existing = must(await sb.from("analyses").select("*").eq("company_name", A.company_name), "buscando el caso");
  if (existing.length > 1) fail(`hay ${existing.length} filas "${A.company_name}". No se toca nada: resuelve el duplicado a mano.`);
  let analysis = existing[0] ?? null;
  if (analysis) {
    if (analysis.deleted_at) fail("el caso existe pero está archivado (deleted_at). No se reactiva automáticamente.");
    if (analysis.user_id !== owner) fail("el caso existe pero pertenece a otro usuario.");
    for (const k of ["sector", "moneda_analisis"]) if (analysis[k] !== A[k]) fail(`analyses.${k} = ${JSON.stringify(analysis[k])}, esperado ${JSON.stringify(A[k])}.`);
    if (Number(analysis.expected_growth) !== A.expected_growth) fail(`analyses.expected_growth = ${analysis.expected_growth}, esperado ${A.expected_growth}.`);
  }

  const actions = [];
  const plannedId = (label) => (analysis ? analysis.id : `<${label}>`);

  // Estado actual de cada pieza (todo vacío si el caso no existe).
  const si = analysis ? must(await sb.from("structured_inputs").select("id, input_payload, version_input").eq("analysis_id", analysis.id).maybeSingle(), "leyendo structured_inputs") : null;
  if (si && !sameJson(si.input_payload, PAYLOAD)) fail("structured_inputs.input_payload difiere del fixture canónico. No se sobrescribe: revisa a mano.");

  const vf = analysis ? must(await sb.from("valuation_files").select("id").eq("analysis_id", analysis.id).maybeSingle(), "leyendo valuation_files") : null;
  const notes = vf ? must(await sb.from("account_notes").select("*").eq("valuation_file_id", vf.id), "leyendo account_notes") : [];
  const questions = vf ? must(await sb.from("expedient_questions").select("*, expedient_answers(*)").eq("valuation_file_id", vf.id), "leyendo expedient_questions") : [];
  const materializedEvent = analysis
    ? must(await sb.from("audit_events").select("id, metadata").eq("analysis_id", analysis.id).eq("event_type", plan.MATERIALIZATION_EVENT), "leyendo audit_events")
    : [];

  if (!analysis) actions.push(["analyses", `crear "${A.company_name}" · ${A.sector} · g ${A.expected_growth}% · ${A.moneda_analisis} · status creado`]);
  if (!si) actions.push(["structured_inputs", `crear (copia exacta del fixture, 13 supuestos resueltos, version_input repo-canonical@${gitCommit.slice(0, 7)})`]);
  if (!vf) actions.push(["valuation_files", "crear"]);

  for (const note of ALPINA_ACCOUNT_NOTES) {
    const found = notes.filter((r) => r.canonical_account === note.canonical_account);
    if (found.length > 1) fail(`account_notes duplicadas para ${note.canonical_account}.`);
    if (found[0] && found[0].interpretation_text !== note.interpretation_text) fail(`account_notes.${note.canonical_account} existe con otro texto (las notas son inmutables: revisa a mano).`);
    if (!found[0]) actions.push(["account_notes", note.canonical_account]);
  }
  // Metadata estructurado (migración 20261015180000): solo se rellena lo
  // que está NULL; un valor distinto al documentado aborta (nunca se pisa).
  const caseColumns = { ...plan.ALPINA_CASE_COLUMNS, business_profile: plan.ALPINA_BUSINESS_PROFILE };
  const metadataPatch = {};
  if (analysis) {
    for (const [k, v] of Object.entries(caseColumns)) {
      if (!(k in analysis)) fail(`analyses.${k} no existe: aplica primero la migración 20261015180000_case_metadata_and_question_versions.`);
      if (analysis[k] === null) metadataPatch[k] = v;
      else if (!sameJson(analysis[k], v)) fail(`analyses.${k} ya tiene un valor distinto al documentado. No se sobrescribe.`);
    }
  } else Object.assign(metadataPatch, caseColumns);
  if (Object.keys(metadataPatch).length) actions.push(["analyses (metadata)", Object.keys(metadataPatch).join(", ")]);

  // Preguntas: la versión VIGENTE de cada código es la que ninguna otra fila
  // supersede. Una corrección de wording se registra insertando una nueva
  // versión (supersedes_question_id) — nunca UPDATE/DELETE de la anterior.
  const supersededIds = new Set(questions.map((r) => r.supersedes_question_id).filter(Boolean));
  const questionPlan = ALPINA_QUESTIONS.map((q) => {
    const current = questions.filter((r) => questionKey(r.texto) === q.code && !supersededIds.has(r.id));
    if (current.length > 1) fail(`expedient_questions: varias versiones vigentes para ${q.code}.`);
    const row = current[0] ?? null;
    const old = plan.SUPERSEDED_QUESTION_WORDING[q.code];
    let kind = "ok";
    if (!row) kind = "create";
    else if (row.texto === q.texto && row.razon === q.razon) kind = "ok";
    else if (old && row.texto === q.texto && row.razon === old.razon) kind = "supersede";
    else fail(`expedient_questions ${q.code} existe con un texto que no coincide ni con la versión vigente ni con una versión superseded conocida.`);
    const answers = kind === "ok" ? row.expedient_answers ?? [] : [];
    if (answers.length > 1) fail(`varias respuestas para ${q.code}.`);
    if (answers[0] && answers[0].respuesta_texto !== q.answer) fail(`la respuesta de ${q.code} difiere de la fuente del repo.`);
    if (kind === "create") actions.push(["expedient_questions", `${q.code} (${q.answer ? "respondida" : "ABIERTA"})`]);
    if (kind === "supersede") actions.push(["expedient_questions", `${q.code} nueva versión (supersede ${row.id}; la anterior se conserva) + audit event`]);
    if (q.answer && !answers[0]) actions.push(["expedient_answers", `${q.code}${kind === "supersede" ? " (nueva versión, mismo Judgment)" : ""}`]);
    return { q, row, kind, answered: !!answers[0] };
  });
  if (materializedEvent.length === 0) actions.push(["audit_events", `${plan.MATERIALIZATION_EVENT} (provenance + capas)`]);

  // ─── CALCULATE ────────────────────────────────────────────────────
  if (CALCULATE) {
    if (!analysis || actions.length) fail(`el caso no está completamente materializado (${actions.length} pasos pendientes). Ejecuta primero --apply.`);
    await calculateAndCompare(analysis);
    process.exitCode = 0;
  } else {
    log(`\nPlan (${actions.length} escrituras):`);
    if (!actions.length) log("  — nada que hacer: Alpina ya está materializada y es consistente con el repo.");
    for (const [t, d] of actions) log(`  + ${t.padEnd(20)} ${d}`);
    log("\nNo se escribe: documents, account_homologations, validation_results, manual_reviews, calculation_results,");
    log("analyses.calculation_result (solo ejecutar-calculo), analyses.input_payload (fuente canónica = structured_inputs).");

    if (!APPLY) {
      log("\nDRY-RUN: nada escrito. Para escribir: npm run materialize:alpina -- --apply");
    } else if (actions.length) {
      await apply();
      log(`\n✓ Aplicado. analyses visibles: antes ${before} → después ${await countAnalyses()}.`);
      log("Siguiente paso (cuando revises el Expediente): npm run materialize:alpina -- --calculate");
    }
  }

  async function apply() {
    if (!analysis) {
      analysis = must(await sb.from("analyses").insert({ user_id: owner, ...A, ...metadataPatch, status: "creado" }).select("*").single(), "creando analyses");
      for (const k of Object.keys(metadataPatch)) delete metadataPatch[k];
      log(`  ✓ analyses ${analysis.id}`);
    }
    if (!si) {
      must(await sb.from("structured_inputs").insert({ analysis_id: analysis.id, input_payload: PAYLOAD, version_input: `repo-canonical@${gitCommit.slice(0, 7)}` }).select("id").single(), "creando structured_inputs");
      log("  ✓ structured_inputs");
    }
    let vfId = vf?.id;
    if (!vfId) {
      vfId = must(await sb.from("valuation_files").insert({ analysis_id: analysis.id, created_by: owner }).select("id").single(), "creando valuation_files").id;
      log("  ✓ valuation_files");
    }
    for (const note of ALPINA_ACCOUNT_NOTES) {
      if (notes.some((r) => r.canonical_account === note.canonical_account)) continue;
      must(await sb.from("account_notes").insert({ valuation_file_id: vfId, created_by: owner, ...note }).select("id").single(), `creando account_notes ${note.canonical_account}`);
      log(`  ✓ account_notes ${note.canonical_account}`);
    }
    if (Object.keys(metadataPatch).length) {
      must(await sb.from("analyses").update(metadataPatch).eq("id", analysis.id).select("id").single(), "rellenando metadata del caso");
      log(`  ✓ analyses metadata (${Object.keys(metadataPatch).join(", ")})`);
    }
    for (const { q, row: existingRow, kind, answered } of questionPlan) {
      let row = kind === "ok" ? existingRow : null;
      if (!row) {
        row = must(await sb.from("expedient_questions").insert({
          valuation_file_id: vfId, texto: q.texto, razon: q.razon, materialidad: null,
          generado_por_ia: false, generado_por: owner, estado: q.answer ? "respondida" : "abierta",
          ...(kind === "supersede" ? { supersedes_question_id: existingRow.id } : {}),
        }).select("*").single(), `creando pregunta ${q.code}`);
        log(`  ✓ expedient_questions ${q.code}${kind === "supersede" ? " (nueva versión)" : ""}`);
        if (kind === "supersede") {
          must(await sb.from("audit_events").insert({
            analysis_id: analysis.id, user_id: owner, component: "materialize-alpina", event_type: "expedient_question_superseded",
            event_detail: `${q.code}: wording corregido; la versión anterior se conserva (${existingRow.id}). ${plan.SUPERSEDED_QUESTION_WORDING[q.code].reason}`,
            metadata: {
              code: q.code, superseded_question_id: existingRow.id, new_question_id: row.id, git_commit: gitCommit,
              previous_razon: existingRow.razon, new_razon: q.razon, reason: plan.SUPERSEDED_QUESTION_WORDING[q.code].reason,
            },
          }).select("id").single(), `registrando supersede ${q.code}`);
          log(`  ✓ audit_events expedient_question_superseded ${q.code}`);
        }
      }
      if (q.answer && !(kind === "ok" && answered)) {
        must(await sb.from("expedient_answers").insert({ question_id: row.id, respuesta_texto: q.answer, respondido_por: owner }).select("id").single(), `creando respuesta ${q.code}`);
        log(`  ✓ expedient_answers ${q.code}`);
      }
    }
    if (materializedEvent.length === 0) {
      must(await sb.from("audit_events").insert({
        analysis_id: analysis.id, user_id: owner, event_type: plan.MATERIALIZATION_EVENT, component: "materialize-alpina",
        event_detail: `Caso materializado desde fixtures canónicos del repo (${gitCommit.slice(0, 7)}). Sin documentos subidos; cálculo pendiente del flujo oficial.`,
        metadata: plan.buildMaterializationMetadata({ gitCommit, inputFingerprint: localFingerprint }),
      }).select("id").single(), "registrando audit_event");
      log(`  ✓ audit_events ${plan.MATERIALIZATION_EVENT}`);
    }
  }

  async function calculateAndCompare(row) {
    let cr = row.calculation_result;
    if (!cr) {
      log("\nEjecutando ejecutar-calculo (flujo oficial)…");
      const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/ejecutar-calculo`, {
        method: "POST",
        headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${auth.session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id: row.id }),
      });
      const body = await res.json().catch(() => null);
      log(`  HTTP ${res.status} ${JSON.stringify(body?.error ?? body?.data ?? body)}`);
      if (!res.ok || !body?.success) fail("el flujo oficial no completó el cálculo (ver respuesta arriba). No se compara nada.");
      cr = must(await sb.from("analyses").select("calculation_result").eq("id", row.id).single(), "leyendo calculation_result").calculation_result;
    } else {
      log("\nYa existe un cálculo persistido: solo se compara (no se recalcula).");
    }

    const local = JSON.parse(JSON.stringify(engine.runCanonicalFinancialEngine(PAYLOAD, A.sector, A.expected_growth)));
    const cmp = { exactMatches: 0, floatEquivalent: [], realMismatches: [] };
    for (const k of plan.COMPARED_RESULT_KEYS) plan.compareJson(local[k], cr[k], `$.${k}`, cmp);
    plan.compareJson(JSON.parse(JSON.stringify(snap.buildResolvedAssumptionsSnapshot(PAYLOAD.resolved_assumptions))), cr.resolved_assumptions_used, "$.resolved_assumptions_used", cmp);
    // Identidad del cálculo: siempre exactas, sin tolerancia.
    for (const [path, expected, actual] of [
      ["$.version.input_fingerprint", localFingerprint, cr.version?.input_fingerprint],
      ["$.version.assumptions_source", "resolved_case_input", cr.version?.assumptions_source],
    ]) {
      if (expected === actual) cmp.exactMatches++;
      else cmp.realMismatches.push({ path, expected, actual });
    }

    const v = cr.valuation ?? {};
    const raCount = Object.keys(cr.resolved_assumptions_used ?? {}).length;
    log(`  fingerprint        ${cr.version?.input_fingerprint}`);
    log(`  assumptions_source ${cr.version?.assumptions_source} · ${raCount} resolved assumptions`);
    log(`  oficial: EV ${v.enterpriseValue} · Equity ${v.equityValue} · WACC ${v.wacc}`);
    log(`  local:   EV ${local.valuation.enterpriseValue} · Equity ${local.valuation.equityValue} · WACC ${local.valuation.wacc}`);

    const stats = cmp.floatEquivalent.map((d) => {
      const abs = Math.abs(d.expected - d.actual);
      return { ...d, abs, rel: abs / Math.max(1, Math.abs(d.expected), Math.abs(d.actual)) };
    });
    const maxAbs = Math.max(0, ...stats.map((s) => s.abs));
    const maxRel = Math.max(0, ...stats.map((s) => s.rel));
    log(`\n  exact matches:              ${cmp.exactMatches}`);
    log(`  floating-point equivalent:  ${cmp.floatEquivalent.length}  (K=${plan.MACHINE_PRECISION_K}·ε; max abs ${maxAbs.toExponential(3)}, max rel ${maxRel.toExponential(3)})`);
    log(`  real mismatches:            ${cmp.realMismatches.length}`);
    for (const s of stats) log(`    ~ ${s.path}: ${s.expected} · oficial ${s.actual} (abs ${s.abs.toExponential(2)}, rel ${s.rel.toExponential(2)})`);

    const summary = {
      materialization_id: plan.MATERIALIZATION_ID, git_commit: gitCommit, input_fingerprint: localFingerprint,
      calculated_at: cr.version?.calculated_at ?? null,
      tolerance: { rule: "|a-b| <= K*Number.EPSILON*max(1,|a|,|b|)", K: plan.MACHINE_PRECISION_K },
      exact_matches: cmp.exactMatches, float_equivalent: cmp.floatEquivalent.length, real_mismatches: cmp.realMismatches.length,
      max_abs_difference: maxAbs, max_rel_difference: maxRel,
    };

    if (cmp.realMismatches.length) {
      must(await sb.from("audit_events").insert({
        analysis_id: row.id, user_id: owner, component: "materialize-alpina", event_type: "official_calculation_mismatch",
        event_detail: `${cmp.realMismatches.length} diferencias reales entre ejecutar-calculo y el motor local congelado.`,
        metadata: { ...summary, differences: cmp.realMismatches.slice(0, 50) },
      }).select("id").single(), "registrando comparación");
      for (const d of cmp.realMismatches.slice(0, 30)) log(`  ≠ ${d.path}: esperado ${JSON.stringify(d.expected)} · oficial ${JSON.stringify(d.actual)}`);
      fail(`${cmp.realMismatches.length} diferencias REALES entre el flujo oficial y el resultado congelado.`);
    }

    // Idempotente: un único evento de verificación por cálculo persistido.
    // Los eventos anteriores (incluido un mismatch de la comparación de
    // tolerancia cero) se conservan: el historial no se reescribe.
    const prior = must(await sb.from("audit_events").select("id, metadata").eq("analysis_id", row.id).eq("event_type", "official_calculation_verified"), "leyendo verificaciones previas");
    if (prior.some((e) => e.metadata?.calculated_at === summary.calculated_at && e.metadata?.input_fingerprint === localFingerprint)) {
      log("\n✓ Verificado (ya registrado antes para este cálculo; no se duplica el evento).");
      return;
    }
    must(await sb.from("audit_events").insert({
      analysis_id: row.id, user_id: owner, component: "materialize-alpina", event_type: "official_calculation_verified",
      event_detail: `Official result verified: 0 diferencias materiales/reales. ${cmp.floatEquivalent.length} diferencias numéricas aceptadas, exclusivamente de precisión de máquina (≤ ${plan.MACHINE_PRECISION_K}·ε relativo; max rel ${maxRel.toExponential(2)}).`,
      metadata: { ...summary, float_equivalent_differences: stats.map(({ path, expected, actual, abs, rel }) => ({ path, expected, actual, abs, rel })) },
    }).select("id").single(), "registrando verificación");
    log("\n✓ Official result verified: 0 real mismatches; las diferencias aceptadas son solo de precisión de máquina.");
  }
} finally {
  await sb.auth.signOut();
}
