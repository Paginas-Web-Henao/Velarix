// Velarix v5 — FASE 4F.5. Primera ejecución canónica REAL del caso
// Alpina (standalone parent DCF) contra `runCanonicalFinancialEngine`.
// Sin mock, sin bypass, sin reconstrucción paralela del input — importa
// directamente `ALPINA_2024_STRUCTURED_INPUT`/`ALPINA_2024_EXPECTED_GROWTH_PCT`
// (4F.4) y llama al motor real una sola vez; todas las aserciones leen
// del MISMO resultado. NO SOTP, NO sensitivity overlays (lambda/g/
// capital structure/matriz WACC-g) — eso es auditoría posterior. NO
// modifica producción.
//
// Sector (auditoría previa a elegir el string, `canonical-financial-engine.ts`):
// `sector` se usa en exactamente 3 puntos — `resolveEffectiveSectorBenchmark(sector)`
// para obtener `bench`; `bench.beta` como `sectorBetaUnlevered` dentro de
// `computeCapitalStructure` (params legacy); y `bench` como
// `result.sectorBenchmark` (campo informativo de salida). El propio
// comentario de `capital-structure.ts` (Bloque 3C.2/3C.3, RC-2/RC-3)
// confirma que la rama v5 (activada aquí porque `resolved_assumptions`
// está presente) NUNCA lee `sectorBetaUnlevered`/`taxRatePct`/
// `costOfDebtPct`/`riskFreeRatePct`/`erpPct` legacy — consume
// exclusivamente los 7 componentes resueltos. Por tanto `sector` no
// puede modificar beta/Ke/WACC/forecast/tax/CAPEX/D&A/ΔNWC/terminal g/
// FCFF/TV/EV en esta ejecución — solo alimenta `result.sectorBenchmark`
// (presentación). Verificado abajo EMPÍRICAMENTE (no solo por lectura de
// código): se ejecuta el motor con dos sectores distintos y se comprueba
// que todos los outputs DCF-critical son bit-idénticos. Se usa el string
// canónico existente más cercano, `"Alimentos y bebidas"` — no se crea
// un sector nuevo.

import { describe, it, expect } from "vitest";
import { runCanonicalFinancialEngine } from "./canonical-financial-engine";
import { ALPINA_2024_STRUCTURED_INPUT, ALPINA_2024_EXPECTED_GROWTH_PCT } from "./alpina-2024.structured-input";
import { computeInputFingerprint } from "./calculation-fingerprint";
import { buildSourceInputSnapshot } from "./source-input-snapshot";
import { buildResolvedAssumptionsSnapshot } from "./resolved-assumptions-snapshot";
import { buildCalculationVersionInfo } from "./calculation-versioning";

const ALPINA_SECTOR = "Alimentos y bebidas";

/** Tolerancia relativa para outputs financieros de gran magnitud (COP miles) — no un snapshot frágil de cada decimal, pero sí exige coincidencia material real. */
function expectApprox(actual: number, expected: number, relTol = 1e-6) {
  const diff = Math.abs(actual - expected);
  const scale = Math.max(Math.abs(expected), 1);
  expect(diff / scale).toBeLessThan(relTol);
}

const result = runCanonicalFinancialEngine(ALPINA_2024_STRUCTURED_INPUT, ALPINA_SECTOR, ALPINA_2024_EXPECTED_GROWTH_PCT);

describe("Alpina 2024 — ejecución canónica REAL (4F.5, base case, standalone parent, sin SOTP)", () => {
  describe("A. DCF-critical outputs", () => {
    it("cost of capital: βL, Ke, Kd after-tax, WACC — coinciden con el cross-check independiente (04 §10, Hamada/CAPM/WACC)", () => {
      expectApprox(result.valuation.betaLevered, 0.8171488128280637);
      expectApprox(result.valuation.costOfEquity, 11.684548477145515);
      expectApprox(result.valuation.costOfDebtAfterTax, 7.6635); // 11.79 × (1-0.35), exacto
      expectApprox(result.valuation.wacc, 10.554236424286662);
      expect(result.valuation.wacc).toBeGreaterThan(3); // WACC > g terminal (04 §11)
      expect(result.valuation.waccWarning).toBeNull();
    });

    it("Y1-Y5: revenue/EBITDA/D&A/EBIT/NOPAT/CAPEX/ΔNWC/FCFF coinciden con el cross-check independiente", () => {
      const expected = [
        { revenue: 2_161_327_866.07, ebitda: 302_358_795.87, da: 90_775_770.37494001, ebit: 211_583_025.49506, nopat: 137_528_966.571789, capex: 70_718_655, deltaWC: 1_609_505, fcff: 155_976_576.946729 },
        { revenue: 2_226_167_702.0520997, ebitda: 311_429_559.74609995, da: 93_499_043.48618819, ebit: 217_930_516.25991178, nopat: 141_654_835.56894267, capex: 82_003_940, deltaWC: 1_666_749, fcff: 151_483_190.05513084 },
        { revenue: 2_292_952_733.113663, ebitda: 320_772_446.538483, da: 96_304_014.79077385, ebit: 224_468_431.74770916, nopat: 145_904_480.63601094, capex: 93_921_384, deltaWC: 1_717_193, fcff: 146_569_918.4267848 },
        { revenue: 2_361_741_315.1070733, ebitda: 330_395_619.93463755, da: 99_193_135.23449709, ebit: 231_202_484.70014048, nopat: 150_281_615.05509132, capex: 106_470_072, deltaWC: 1_768_880, fcff: 141_235_798.2895884 },
        { revenue: 2_432_593_554.560285, ebitda: 340_307_488.5326766, da: 102_168_929.29153198, ebit: 238_138_559.2411446, nopat: 154_790_063.506744, capex: 119_695_825, deltaWC: 1_821_877, fcff: 135_441_290.79827598 },
      ];
      expect(result.projections).toHaveLength(5);
      result.projections.forEach((p, i) => {
        const e = expected[i];
        expectApprox(p.revenue, e.revenue);
        expectApprox(p.ebitda, e.ebitda);
        expectApprox(p.depreciation, e.da);
        expectApprox(p.ebit, e.ebit);
        expectApprox(p.nopat, e.nopat);
        expect(p.capex).toBe(e.capex); // path explícito, exacto
        expect(p.deltaWC).toBe(e.deltaWC); // path explícito, exacto
        expectApprox(p.fcff, e.fcff);
      });
    });

    it("PV(FCFF) por año y terminal value/PV(TV) coinciden con el cross-check independiente (Gordon Growth sobre FCFF₅)", () => {
      const expectedPV = [141_086_024.37279728, 123_940_619.78614512, 108_472_257.35704544, 94_546_015.66136895, 82_011_383.31742637];
      result.projections.forEach((p, i) => expectApprox(p.discountedFcf, expectedPV[i]));

      // Traza de la fórmula real (canonical-financial-engine.ts): TV = FCFF₅×(1+g)/(WACC−g); PV(TV) = TV/(1+WACC)^5 — Gordon Growth estándar, sin mid-year, base FCFF (no NOPAT).
      expectApprox(result.valuation.terminalValue, 1_846_705_897.021187);
      expectApprox(result.valuation.discountedTV, 1_118_203_350.7102702);
    });

    it("Enterprise Value = ΣPV(FCFF) + PV(TV) — recalculado independientemente, sin tolerancia económica", () => {
      const sumPV = result.projections.reduce((s, p) => s + p.discountedFcf, 0);
      const evRecomputed = sumPV + result.valuation.discountedTV;
      expectApprox(result.valuation.enterpriseValue, evRecomputed, 1e-9);
      expectApprox(result.valuation.enterpriseValue, 1_668_259_651.2050533);
    });
  });

  describe("B. Bridge outputs", () => {
    it("debt-like, cash, net debt, standalone equity value (before SOTP)", () => {
      expect(result.kpis.netDebt).toBe(797_129_347 - 49_548_598); // 747,580,749
      expect(result.valuation.netDebt).toBe(747_580_749);
      expectApprox(result.valuation.equityValue, result.valuation.enterpriseValue - result.valuation.netDebt, 1e-9);
      expectApprox(result.valuation.equityValue, 920_678_902.2050533);
      // Etiqueta deliberada — este NO es el equity value final de Alpina.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const STANDALONE_PARENT_EQUITY_VALUE_BEFORE_SOTP = result.valuation.equityValue;
      expect(STANDALONE_PARENT_EQUITY_VALUE_BEFORE_SOTP).toBeGreaterThan(0);
    });
  });

  describe("C. Lease mapping execution confirmation (clasificación MAPPING_SUPPORTED, no reabrir — solo confirmar en ejecución real)", () => {
    it("debt-like usado = 797,129,347 (bancaria+leases), consumido una única vez en netDebt", () => {
      expect(result.valuation.netDebt).toBe(797_129_347 - 49_548_598);
    });

    it("D&A proyectado deriva de depreciationDaDriver (4.2% revenue) — sin segunda adición de ROU en ningún año", () => {
      result.projections.forEach((p) => expectApprox(p.depreciation, p.revenue * 0.042));
    });

    it("CAPEX proyectado = el aggregate economic reinvestment path explícito, consumido literalmente una sola vez por año", () => {
      const expectedCapex = [70_718_655, 82_003_940, 93_921_384, 106_470_072, 119_695_825];
      result.projections.forEach((p, i) => expect(p.capex).toBe(expectedCapex[i]));
    });
  });

  describe("D. Auxiliary/non-DCF outputs — DOCUMENTA el legacy leakage conocido, NO lo valida metodológicamente", () => {
    it("DOCUMENTADO (UNIVERSAL_NON_DCF_OUTPUT_MISMATCH): el 'interest' proyectado usa Kd legacy (8%), NO el 11.79% v5 resuelto — constante en los 5 años porque usa totalDebt de Evidence, no un balance proyectado", () => {
      const legacyKdImplied = 797_129_347 * 0.08;
      result.projections.forEach((p) => expectApprox(p.interest, legacyKdImplied));
      // Si algún día esto usara el Kd v5 (11.79%), el valor sería materialmente distinto — confirma que HOY no lo usa.
      const v5KdImplied = 797_129_347 * 0.1179;
      expect(Math.abs(result.projections[0].interest - v5KdImplied)).toBeGreaterThan(1_000_000);
    });

    it("DOCUMENTADO (UNIVERSAL_NON_DCF_OUTPUT_MISMATCH): netMargin/roe/roa del año base usan tax rate legacy (30%), NO el 35% v5 resuelto", () => {
      const ebit0 = 200_310_448, interestExpenseReal = 99_244_487, equity = 175_759_391;
      const netIncome0Legacy30 = (ebit0 - interestExpenseReal) * (1 - 0.30);
      expectApprox(result.kpis.roe as number, (netIncome0Legacy30 / equity) * 100);
      // Con el 35% v5 el ROE sería materialmente distinto — confirma que HOY no lo usa.
      const netIncome0V5_35 = (ebit0 - interestExpenseReal) * (1 - 0.35);
      expect(Math.abs((result.kpis.roe as number) - (netIncome0V5_35 / equity) * 100)).toBeGreaterThan(1);
    });

    it("CONFIRMADO: interestCoverage/netDebt/leverage SÍ usan Evidence real (histórica), no la línea legacy — no contaminados", () => {
      expectApprox(result.kpis.interestCoverage, 200_310_448 / 99_244_487);
      expect(result.kpis.netDebt).toBe(747_580_749);
    });

    it("CONFIRMADO: el legacy leakage (Kd 8%, tax 30%) NO contamina ningún output DCF-critical — FCFF/WACC/TV/EV ya verificados en A arriba contra el cross-check independiente", () => {
      // No-op deliberado: esta prueba es documental — la prueba real ya
      // ocurrió en el describe "A" (los outputs DCF-critical coinciden
      // exactamente con el cross-check calculado sin usar Kd/tax legacy
      // en ningún punto de FCFF/WACC/TV/EV).
      expect(result.valuation.waccWarning).toBeNull();
    });
  });

  describe("E. Sector inertness — prueba empírica, no solo lectura de código", () => {
    it("cambiar el sector NO cambia ningún output DCF-critical en ejecución v5 (solo cambia sectorBenchmark)", () => {
      const altResult = runCanonicalFinancialEngine(ALPINA_2024_STRUCTURED_INPUT, "Software / Tecnología", ALPINA_2024_EXPECTED_GROWTH_PCT);

      expect(altResult.valuation.betaLevered).toBe(result.valuation.betaLevered);
      expect(altResult.valuation.costOfEquity).toBe(result.valuation.costOfEquity);
      expect(altResult.valuation.wacc).toBe(result.valuation.wacc);
      expect(altResult.valuation.terminalValue).toBe(result.valuation.terminalValue);
      expect(altResult.valuation.enterpriseValue).toBe(result.valuation.enterpriseValue);
      expect(altResult.valuation.equityValue).toBe(result.valuation.equityValue);
      altResult.projections.forEach((p, i) => expect(p.fcff).toBe(result.projections[i].fcff));

      // Lo único que SÍ cambia con el sector: el benchmark informativo.
      expect(altResult.sectorBenchmark).not.toEqual(result.sectorBenchmark);
    });
  });

  describe("F. Sensitivity valuation (4F.6B — post-fix regression, UNIVERSAL_SENSITIVITY_MATRIX_MISMATCH corregido)", () => {
    it("sensitivityMatrix[waccDelta=0,growthDelta=0].ev coincide con el EV base — ya no cae a drivers legacy", () => {
      const center = result.sensitivityMatrix.find((c) => c.waccDelta === 0 && c.growthDelta === 0);
      expect(center).toBeDefined();
      expectApprox(center!.ev, result.valuation.enterpriseValue, 1e-6);
    });

    it("evLow < EV base < evHigh, y ambos reconcilian exactamente con la matriz (waccDelta=+1/-1, growthDelta=0)", () => {
      expect(result.valuation.evLow).toBeLessThan(result.valuation.enterpriseValue);
      expect(result.valuation.evHigh).toBeGreaterThan(result.valuation.enterpriseValue);

      const cellPlus1 = result.sensitivityMatrix.find((c) => c.waccDelta === 1 && c.growthDelta === 0);
      const cellMinus1 = result.sensitivityMatrix.find((c) => c.waccDelta === -1 && c.growthDelta === 0);
      expectApprox(result.valuation.evLow, cellPlus1!.ev, 1e-9);
      expectApprox(result.valuation.evHigh, cellMinus1!.ev, 1e-9);
    });
  });
});

describe("Alpina 2024 — fingerprint/snapshot (canal identificado, calculado localmente, sin Supabase)", () => {
  it("computeInputFingerprint/buildSourceInputSnapshot/buildResolvedAssumptionsSnapshot/buildCalculationVersionInfo se calculan puramente local — sin simular el flujo DB de ejecutar-calculo", () => {
    const fingerprint = computeInputFingerprint(ALPINA_2024_STRUCTURED_INPUT, ALPINA_SECTOR, ALPINA_2024_EXPECTED_GROWTH_PCT);
    expect(typeof fingerprint).toBe("string");
    expect(fingerprint.length).toBeGreaterThan(0);

    const sourceSnapshot = buildSourceInputSnapshot({
      structuredInputId: null, // sin fila real de `structured_inputs` — caso manual, no ingesta documental (honesto, no simulado)
      versionInput: null,
      sector: ALPINA_SECTOR,
      input: ALPINA_2024_STRUCTURED_INPUT,
    });
    expect(sourceSnapshot.structured_input_id).toBeNull();
    expect(sourceSnapshot.sector).toBe(ALPINA_SECTOR);

    const assumptionsSnapshot = buildResolvedAssumptionsSnapshot(ALPINA_2024_STRUCTURED_INPUT.resolved_assumptions);
    expect(assumptionsSnapshot).not.toBeNull();
    expect(Object.keys(assumptionsSnapshot!)).toHaveLength(13);

    // provenanceStatus="missing": honesto para un caso sin cadena de
    // homologación documental (no hay `account_homologations`/
    // `structured_inputs` reales detrás de este artifact) — mismo
    // criterio que `buildMissingProvenance` en `ejecutar-calculo/index.ts`
    // cuando no hay provenance real que declarar.
    const versionInfo = buildCalculationVersionInfo({
      inputFingerprint: fingerprint,
      provenanceStatus: "missing",
      resolvedAssumptions: ALPINA_2024_STRUCTURED_INPUT.resolved_assumptions,
    });
    expect(versionInfo.assumptions_source).toBe("resolved_case_input");
    expect(versionInfo.input_fingerprint).toBe(fingerprint);
  });
});
