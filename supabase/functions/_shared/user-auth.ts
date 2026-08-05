// Corrección de respuestas de autenticación (2026-08-05).
//
// Módulo puro compartido por las 7 Edge Functions de usuario
// (parse-document, map-accounts, validate-analysis,
// build-structured-input, generate-narrative, upload-document,
// run-analysis-pipeline). Antes, cada una lanzaba `Error` genéricos
// para "sin Authorization", "JWT inválido" y "recurso ajeno", y un
// único catch por función los convertía a todos en 500 —
// incluidos los rechazos de autenticación (deben ser 401) y las
// denegaciones de ownership (deben ser 404 seguro, sin revelar si el
// recurso existe o es de otro usuario).
//
// Sin imports de Supabase, de URL ni de Deno — importable desde Deno y
// desde Vitest indistintamente, igual que `authorization.ts`.

export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * Extrae el token de un header `Authorization: Bearer <token>`. Exige el
 * esquema exacto `Bearer` (nunca `Basic` ni otro), uno o más espacios
 * como separador (nunca tab ni ausencia de separador), y un token no
 * vacío y sin espacios internos. Devuelve `null` en cualquier otro caso
 * — ausente, vacío, esquema distinto, "Bearer" sin token, o espacios
 * incorrectos — nunca lanza. Reemplaza el patrón previo
 * `authHeader.replace("Bearer ", "")`, que no comprobaba el esquema
 * antes de recortar el prefijo.
 */
export function extractBearerToken(authHeaderValue: string | null | undefined): string | null {
  if (!authHeaderValue) return null;
  const match = /^Bearer +(\S+)$/.exec(authHeaderValue.trim());
  return match ? match[1] : null;
}

export interface MinimalUser {
  id: string;
}

/**
 * Valida la sesión de un usuario real a partir del header `Authorization`.
 * `verifyToken` es la única parte impura de esta función — cada Edge
 * Function la implementa llamando al mecanismo oficial de Supabase Auth
 * (`anonClient.auth.getUser(token)`), nunca decodificando el JWT
 * manualmente. Lanza siempre `UnauthorizedError`, sin distinguir la
 * causa exacta (token ausente, esquema incorrecto, vacío, malformado,
 * alterado, expirado, no resuelto por Supabase, o un fallo técnico del
 * propio chequeo) — la respuesta pública debe ser 401 uniforme en todos
 * los casos, sin filtrar cuál fue el motivo real del rechazo.
 */
export async function requireAuthenticatedUser(
  authHeaderValue: string | null | undefined,
  verifyToken: (token: string) => Promise<MinimalUser | null>,
): Promise<MinimalUser> {
  const token = extractBearerToken(authHeaderValue);
  if (!token) throw new UnauthorizedError();

  let user: MinimalUser | null;
  try {
    user = await verifyToken(token);
  } catch {
    throw new UnauthorizedError();
  }
  if (!user) throw new UnauthorizedError();
  return user;
}

export type ResourceLookupOutcome = "owner" | "not_found" | "technical_error";

export interface MinimalPostgrestError {
  code?: string;
}

const POSTGREST_NO_ROWS_CODE = "PGRST116";

/**
 * Clasifica el resultado de una consulta `.single()` sobre un recurso
 * con ownership (p.ej. `analyses`), distinguiendo tres casos que antes
 * se colapsaban en uno solo ("no existe o no es tuyo" -> 500 genérico):
 *
 * - `owner`: el recurso existe y pertenece al actor.
 * - `not_found`: el recurso no existe, o existe pero es de otro
 *   usuario — deliberadamente el mismo resultado público para los dos
 *   casos (ver `NotFoundError`), para no revelar la existencia de un
 *   recurso ajeno.
 * - `technical_error`: la consulta falló por una razón real distinta a
 *   "cero filas" (p.ej. caída de conexión) — nunca se convierte en 404,
 *   debe seguir siendo un 500.
 */
export function classifyOwnedResourceLookup(
  error: MinimalPostgrestError | null | undefined,
  resource: { user_id: string } | null | undefined,
  actorUserId: string,
): ResourceLookupOutcome {
  if (error && error.code !== POSTGREST_NO_ROWS_CODE) return "technical_error";
  if (!resource) return "not_found";
  if (resource.user_id !== actorUserId) return "not_found";
  return "owner";
}

export interface AuthAwareErrorResponse {
  status: 401 | 404 | 500;
  body: {
    success: false;
    error: { code: string; message: string };
  };
}

const UNAUTHORIZED_BODY = { success: false as const, error: { code: "UNAUTHORIZED", message: "Autenticación requerida." } };
const NOT_FOUND_BODY = { success: false as const, error: { code: "NOT_FOUND", message: "Recurso no encontrado." } };

/**
 * Traduce cualquier error capturado en el handler de una Edge Function a
 * una respuesta HTTP coherente: `UnauthorizedError` -> 401,
 * `NotFoundError` -> 404 (mensaje genérico, no revela si el recurso
 * existe), cualquier otro error -> 500 con el código de fallback propio
 * de cada función (mismo comportamiento que tenían las 7 funciones
 * antes de esta corrección para los errores técnicos reales).
 */
export function mapErrorToResponse(
  error: unknown,
  fallback: { code: string; message: string },
): AuthAwareErrorResponse {
  if (error instanceof UnauthorizedError) return { status: 401, body: UNAUTHORIZED_BODY };
  if (error instanceof NotFoundError) return { status: 404, body: NOT_FOUND_BODY };
  return {
    status: 500,
    body: { success: false, error: { code: fallback.code, message: error instanceof Error ? error.message : fallback.message } },
  };
}

/**
 * Decide si `run-analysis-pipeline` debe notificar un error técnico tras
 * capturar el `analysis_id` una sola vez (nunca releyendo el body ya
 * consumido). Solo notifica errores técnicos reales (500) — nunca
 * fallos de autenticación (401) ni de ownership (404), y nunca si no
 * hay `analysis_id` capturado de forma segura.
 */
export function shouldNotifyPipelineError(
  mapped: AuthAwareErrorResponse,
  capturedAnalysisId: string | null,
): capturedAnalysisId is string {
  return mapped.status === 500 && capturedAnalysisId !== null;
}
