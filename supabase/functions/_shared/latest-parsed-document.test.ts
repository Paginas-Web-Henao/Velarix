// Bug map-accounts (múltiples parses por documento) — ver comentario en
// latest-parsed-document.ts. Evidencia remota real: mismo document_id con
// 2 filas en documents_parsed (parse viejo periods_detected=null, parse
// nuevo periods_detected=["2024","2025"]) — map-accounts las procesaba
// ambas, duplicando cada homologación.

import { describe, it, expect } from "vitest";
import { selectLatestParsedDocumentPerDocument, AmbiguousDocumentParseError, type ParsedDocumentVersion } from "./latest-parsed-document";

interface Fixture extends ParsedDocumentVersion {
  id: string;
  label: string;
}

const v = (id: string, document_id: string, created_at: string, label: string): Fixture => ({ id, document_id, created_at, label });

describe("selectLatestParsedDocumentPerDocument", () => {
  it("1. mismo document_id con parse viejo + parse nuevo -> solo se procesa el nuevo (evidencia remota real)", () => {
    const viejo = v("p-viejo", "doc-A", "2026-08-24T12:49:34.122327+00:00", "viejo");
    const nuevo = v("p-nuevo", "doc-A", "2026-08-24T13:03:35.670256+00:00", "nuevo");

    const result = selectLatestParsedDocumentPerDocument([viejo, nuevo]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p-nuevo");
    expect(result[0].label).toBe("nuevo");
  });

  it("2. dos document_id distintos -> se procesa el parse más reciente de CADA uno (nunca se mezclan)", () => {
    const aViejo = v("a-viejo", "doc-A", "2026-01-01T00:00:00Z", "a-viejo");
    const aNuevo = v("a-nuevo", "doc-A", "2026-01-02T00:00:00Z", "a-nuevo");
    const bUnico = v("b-unico", "doc-B", "2026-01-01T12:00:00Z", "b-unico");

    const result = selectLatestParsedDocumentPerDocument([aViejo, aNuevo, bUnico]);

    expect(result).toHaveLength(2);
    expect(result.find((r) => r.document_id === "doc-A")?.id).toBe("a-nuevo");
    expect(result.find((r) => r.document_id === "doc-B")?.id).toBe("b-unico");
  });

  it("3. un solo parse por document_id -> comportamiento actual preservado (pasa tal cual)", () => {
    const unico = v("solo-uno", "doc-A", "2026-01-01T00:00:00Z", "solo-uno");
    const result = selectLatestParsedDocumentPerDocument([unico]);
    expect(result).toEqual([unico]);
  });

  it("4. parse viejo y nuevo con las mismas cuentas -> el resultado no incluye el contenido del parse viejo", () => {
    const viejo = v("p-viejo", "doc-A", "2026-01-01T00:00:00Z", "viejo");
    const nuevo = v("p-nuevo", "doc-A", "2026-01-02T00:00:00Z", "nuevo");
    const result = selectLatestParsedDocumentPerDocument([viejo, nuevo]);
    expect(result.map((r) => r.id)).not.toContain("p-viejo");
    expect(result).toHaveLength(1);
  });

  it("5. documentos distintos con misma original_label/período NO se deduplican entre sí — la agrupación es solo por document_id", () => {
    const docA = v("a1", "doc-A", "2026-01-01T00:00:00Z", "Costo de ventas");
    const docB = v("b1", "doc-B", "2026-01-01T00:00:00Z", "Costo de ventas");
    const result = selectLatestParsedDocumentPerDocument([docA, docB]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id).sort()).toEqual(["a1", "b1"]);
  });

  it("6. el resultado no depende del orden en que Supabase devuelva las filas", () => {
    const viejo = v("p-viejo", "doc-A", "2026-01-01T00:00:00Z", "viejo");
    const nuevo = v("p-nuevo", "doc-A", "2026-01-02T00:00:00Z", "nuevo");

    const ordenA = selectLatestParsedDocumentPerDocument([viejo, nuevo]);
    const ordenB = selectLatestParsedDocumentPerDocument([nuevo, viejo]);

    expect(ordenA.map((r) => r.id)).toEqual(["p-nuevo"]);
    expect(ordenB.map((r) => r.id)).toEqual(["p-nuevo"]);
  });

  it("7. empate exacto de created_at -> falla cerrado (AmbiguousDocumentParseError), no elige al azar", () => {
    const empate1 = v("empate-1", "doc-A", "2026-01-01T00:00:00.000Z", "e1");
    const empate2 = v("empate-2", "doc-A", "2026-01-01T00:00:00.000Z", "e2");

    expect(() => selectLatestParsedDocumentPerDocument([empate1, empate2])).toThrow(AmbiguousDocumentParseError);

    let caught: unknown = null;
    try {
      selectLatestParsedDocumentPerDocument([empate1, empate2]);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(AmbiguousDocumentParseError);
    expect((caught as AmbiguousDocumentParseError).documentId).toBe("doc-A");
  });

  it("7b. el empate solo bloquea el document_id afectado — otros documentos sin empate no deberían intentarse resolver en la misma llamada", () => {
    const empate1 = v("empate-1", "doc-A", "2026-01-01T00:00:00.000Z", "e1");
    const empate2 = v("empate-2", "doc-A", "2026-01-01T00:00:00.000Z", "e2");
    const bUnico = v("b-unico", "doc-B", "2026-01-01T00:00:00.000Z", "b-unico");

    expect(() => selectLatestParsedDocumentPerDocument([empate1, empate2, bUnico])).toThrow(AmbiguousDocumentParseError);
  });

  it("un empate de created_at entre dos versiones NO máximas no dispara el error (solo importa el empate en el máximo)", () => {
    const vieja1 = v("vieja-1", "doc-A", "2026-01-01T00:00:00.000Z", "v1");
    const vieja2 = v("vieja-2", "doc-A", "2026-01-01T00:00:00.000Z", "v2");
    const nueva = v("nueva", "doc-A", "2026-01-02T00:00:00.000Z", "nueva");

    const result = selectLatestParsedDocumentPerDocument([vieja1, vieja2, nueva]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("nueva");
  });
});
