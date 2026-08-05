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
 * Precondición de negocio con JWT válido (p.ej. "sin cuentas homologadas
 * todavía") — nunca un problema de autenticación ni de ownership. Mapea a
 * 400 con un código y mensaje públicos definidos por cada función.
 */
export class BadRequestError extends Error {
  code: string;
  publicMessage: string;

  constructor(code: string, publicMessage: string) {
    super(code);
    this.name = "BadRequestError";
    this.code = code;
    this.publicMessage = publicMessage;
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
 * Forma mínima de un error de `@supabase/auth-js` (versión 2.68.0, la que
 * resuelve realmente `@supabase/supabase-js@2.49.1`, importado por las 7
 * Edge Functions vía esm.sh). Se identifica por `name`, igual que los
 * type guards oficiales `isAuthApiError`/`isAuthRetryableFetchError` del
 * propio paquete — sin importar las clases reales, para mantener este
 * módulo puro y sin dependencias de Supabase.
 */
export interface MinimalAuthError {
  name?: string;
  status?: number;
  message?: string;
}

/**
 * Resultado de `auth.getUser(token)` con un token explícito: en esa forma
 * de uso, auth-js 2.68.0 nunca lanza — atrapa internamente cualquier
 * `AuthError` (`AuthApiError`, `AuthRetryableFetchError`,
 * `AuthUnknownError`, `AuthSessionMissingError`, ...) y siempre resuelve
 * `{ data: { user: null }, error }`. `verifyToken` debe devolver ambos
 * campos — nunca descartar `error` quedándose solo con `data.user`.
 */
export interface AuthCheckResult {
  user: MinimalUser | null;
  error: MinimalAuthError | null;
}

/**
 * Nombres de error que auth-js atribuye de forma inequívoca al propio
 * JWT/cliente: `AuthApiError` (la API de Auth rechazó el token — inválido,
 * alterado, expirado, revocado) y `AuthSessionMissingError` (el
 * `session_id` del JWT ya no corresponde a una sesión activa, p.ej. el
 * usuario cerró sesión en otro lugar). Nunca incluye
 * `AuthRetryableFetchError` (red, timeout, 502/503/504 del propio
 * servicio de Auth) ni `AuthUnknownError` — esos son fallos técnicos
 * reales, no problemas de autenticación del cliente.
 */
const CLIENT_AUTH_ERROR_NAMES = new Set(["AuthApiError", "AuthSessionMissingError"]);

export function isClientAuthError(error: MinimalAuthError | null | undefined): boolean {
  return !!error && typeof error.name === "string" && CLIENT_AUTH_ERROR_NAMES.has(error.name);
}

/**
 * Valida la sesión de un usuario real a partir del header `Authorization`.
 * `verifyToken` es la única parte impura de esta función — cada Edge
 * Function la implementa llamando al mecanismo oficial de Supabase Auth
 * (`anonClient.auth.getUser(token)`) y devolviendo tanto `data.user` como
 * `error`, nunca decodificando el JWT manualmente.
 *
 * Política conservadora (fail closed):
 * - usuario válido -> se devuelve, sin más comprobaciones;
 * - `error` es un error de cliente inequívoco (`isClientAuthError`) ->
 *   `UnauthorizedError` (401) — token ausente, esquema incorrecto, vacío,
 *   malformado, alterado, expirado o de una sesión ya cerrada;
 * - cualquier otro caso (error técnico real, error sin clasificar, o
 *   ausencia total de usuario y de error) -> se relanza tal cual, nunca se
 *   convierte en 401 — el catch-all de cada función lo mapea a 500 con un
 *   mensaje público seguro, nunca con el mensaje técnico crudo.
 */
export async function requireAuthenticatedUser(
  authHeaderValue: string | null | undefined,
  verifyToken: (token: string) => Promise<AuthCheckResult>,
): Promise<MinimalUser> {
  const token = extractBearerToken(authHeaderValue);
  if (!token) throw new UnauthorizedError();

  const result = await verifyToken(token);

  if (result.user) return result.user;

  if (isClientAuthError(result.error)) throw new UnauthorizedError();

  // Sin usuario y sin un error que auth-js clasifique inequívocamente como
  // problema del cliente (p.ej. AuthRetryableFetchError por red o 5xx de
  // Auth, AuthUnknownError, o ausencia total de error) -> fallo técnico
  // real. Ante la ambigüedad se falla cerrado hacia 500, nunca hacia 401.
  throw result.error ?? new Error("auth.getUser no devolvió usuario ni error clasificable.");
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

export type ResourceExistenceOutcome = "found" | "not_found" | "technical_error";

/**
 * Igual que `classifyOwnedResourceLookup`, pero sin comparar ownership —
 * para recursos hijos ya acotados por una columna de la propia consulta
 * (p.ej. `documents` filtrado por `analysis_id`, donde el ownership del
 * `analysis_id` ya se validó antes). Distingue "no existe" (`PGRST116` o
 * `.single()` sin filas) de un fallo técnico real de la consulta, que
 * nunca debe convertirse en 404.
 */
export function classifyResourceLookup(
  error: MinimalPostgrestError | null | undefined,
  resource: unknown | null | undefined,
): ResourceExistenceOutcome {
  if (error && error.code !== POSTGREST_NO_ROWS_CODE) return "technical_error";
  if (!resource) return "not_found";
  return "found";
}

export interface AuthAwareErrorResponse {
  status: 400 | 401 | 404 | 500;
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
 * existe), `BadRequestError` -> 400 con el código y mensaje públicos que
 * define cada función, cualquier otro error -> 500.
 *
 * La rama 500 usa exclusivamente `fallback.message` — nunca
 * `error.message` ni ningún otro dato del error real. Un error técnico
 * real (fallo de base de datos, nombre de tabla, URL interna, stack
 * trace, cabecera Authorization, etc.) solo debe quedar en los logs
 * internos de cada función (vía `console.error`, antes de llamar a esta
 * función), nunca en la respuesta al cliente.
 */
export function mapErrorToResponse(
  error: unknown,
  fallback: { code: string; message: string },
): AuthAwareErrorResponse {
  if (error instanceof UnauthorizedError) return { status: 401, body: UNAUTHORIZED_BODY };
  if (error instanceof NotFoundError) return { status: 404, body: NOT_FOUND_BODY };
  if (error instanceof BadRequestError) {
    return { status: 400, body: { success: false, error: { code: error.code, message: error.publicMessage } } };
  }
  return {
    status: 500,
    body: { success: false, error: { code: fallback.code, message: fallback.message } },
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
