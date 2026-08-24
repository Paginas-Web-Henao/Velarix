// Bug map-accounts (múltiples parses por documento) — extraído a un módulo
// puro para poder probarlo con Vitest sin Deno/Supabase (index.ts no se
// puede importar directo, igual que el resto de las Edge Functions de este
// repo). Sin red, sin efectos secundarios.
//
// parse-document puede reejecutarse legítimamente sobre el mismo
// document_id (p. ej. durante debugging, o si el usuario vuelve a subir el
// mismo archivo) — cada ejecución hace un INSERT nuevo en documents_parsed,
// nunca un update/delete de las versiones anteriores (el historial se
// conserva a propósito). documents_parsed.document_id no tiene constraint
// UNIQUE.
//
// Antes, map-accounts leía TODAS las filas de documents_parsed que
// matcheaban los document_id del analysis y las procesaba todas, sin
// deduplicar por document_id. Con 2 parses del mismo documento, cada fila
// de parsed_structure se contaba dos veces, duplicando homologaciones
// (mismo original_label × canonical_account × period × value insertado dos
// veces) — sin que exista una constraint UNIQUE en account_homologations
// que lo evite.
//
// La corrección: por cada document_id, conservar únicamente la versión con
// el created_at más reciente. created_at es NOT NULL DEFAULT now() en el
// esquema (ver migración 20260320164123), así que siempre está presente —
// es la única señal de vigencia disponible (no existe un campo de versión
// explícito). `id` es un UUID aleatorio (gen_random_uuid()), sin orden
// temporal, así que no puede usarse como desempate.

export class AmbiguousDocumentParseError extends Error {
  constructor(
    public readonly documentId: string,
    public readonly tiedCreatedAt: string,
  ) {
    super(
      `Existen múltiples versiones de documents_parsed para document_id "${documentId}" ` +
        `con el mismo created_at (${tiedCreatedAt}) — no hay forma segura de determinar cuál ` +
        `es la vigente. Requiere revisión manual antes de homologar.`,
    );
    this.name = "AmbiguousDocumentParseError";
  }
}

export interface ParsedDocumentVersion {
  document_id: string;
  created_at: string;
}

/**
 * De todas las filas de documents_parsed recibidas (potencialmente varias
 * por el mismo document_id), devuelve UNA sola por document_id: la de
 * created_at más reciente. Documentos distintos nunca se mezclan ni se
 * deduplican entre sí — la agrupación es exclusivamente por document_id.
 *
 * Fail-closed: si dos versiones del MISMO document_id tienen exactamente
 * el mismo created_at, no se elige ninguna arbitrariamente — se lanza
 * AmbiguousDocumentParseError.
 */
export function selectLatestParsedDocumentPerDocument<T extends ParsedDocumentVersion>(
  parsedDocs: readonly T[],
): T[] {
  const byDocument = new Map<string, T[]>();
  for (const doc of parsedDocs) {
    const versions = byDocument.get(doc.document_id);
    if (versions) versions.push(doc);
    else byDocument.set(doc.document_id, [doc]);
  }

  const result: T[] = [];
  for (const [documentId, versions] of byDocument) {
    const maxTime = Math.max(...versions.map((v) => new Date(v.created_at).getTime()));
    const atMax = versions.filter((v) => new Date(v.created_at).getTime() === maxTime);
    if (atMax.length > 1) {
      throw new AmbiguousDocumentParseError(documentId, atMax[0].created_at);
    }
    result.push(atMax[0]);
  }
  return result;
}
