// Módulo puro compartido — Bloque 1D-P0 (BL-07, BL-08, BL-09, BL-10).
//
// Decisiones de autorización para el flujo financiero. Sin imports de
// URL, sin Supabase, sin `serve()`, sin variables de entorno, sin
// efectos secundarios — importable desde Deno y desde Vitest
// indistintamente. Las Edge Functions resuelven la identidad real
// (JWT, `profiles.role`, existencia del análisis) y le pasan el
// resultado a estas funciones puras, que son las únicas que deciden.
//
// Modelo mínimo de actores (parte del esquema real ya existente:
// `profiles.role TEXT DEFAULT 'user'`, sin sistema de asignación entre
// analistas todavía):
// - "user": cliente propietario de sus propios análisis.
// - "analyst": puede revisar/aprobar/bloquear y continuar el pipeline.
//   Hoy, el fundador es el único analista real — no existe todavía una
//   relación de asignación análisis↔analista, así que cualquier usuario
//   con role="analyst" está autorizado para cualquier análisis.
// - "admin": acciones privilegiadas, sujeto a auditoría.
// - Invocación interna: verificada comparando el `Authorization` header
//   contra el valor real de `SUPABASE_SERVICE_ROLE_KEY` (ver
//   `isInternalServiceCall`) — nunca un campo público como `{internal:true}`.

export type ActorRole = "user" | "analyst" | "admin";

export interface AuthenticatedActor {
  userId: string;
  role: ActorRole;
}

export type AuthorizationHttpStatus = 401 | 403 | 404 | 409;

export interface AuthorizationDecision {
  allowed: boolean;
  /** Código interno para logs/auditoría — nunca se expone tal cual al cliente. */
  reasonCode: string;
  /** Solo presente cuando `allowed` es `false`. */
  httpStatus?: AuthorizationHttpStatus;
  /** Mensaje seguro para el cliente — nunca confirma la existencia de un recurso ajeno. */
  publicMessage?: string;
}

const GENERIC_NOT_FOUND_MESSAGE = "Análisis no encontrado.";
const GENERIC_UNAUTHORIZED_MESSAGE = "No autorizado.";
const GENERIC_NO_SESSION_MESSAGE = "No autenticado.";

/**
 * Detecta una invocación interna real comparando el `Authorization`
 * header contra el valor real de la service role key — nunca confiando
 * en un campo enviado por el cliente. Función pura: recibe el secreto
 * como parámetro, no lo lee de `Deno.env` (eso es responsabilidad de la
 * Edge Function que la invoca).
 */
export function isInternalServiceCall(authHeader: string | null | undefined, serviceRoleKey: string | undefined): boolean {
  if (!authHeader || !serviceRoleKey) return false;
  return authHeader === `Bearer ${serviceRoleKey}`;
}

export interface CalculationAuthorizationInput {
  /** `null` = no hay sesión válida (sin header, o el JWT no resuelve a un usuario real — incluye el caso "solo anon key"). */
  actor: AuthenticatedActor | null;
  isInternalCall: boolean;
  /** `null` = el análisis no existe (o no se pudo cargar). */
  analysisOwnerId: string | null;
}

/**
 * BL-07 — ¿puede este actor ejecutar `ejecutar-calculo` sobre este
 * análisis? Regla de negocio actual: el cliente propietario SÍ puede
 * ejecutar el cálculo de su propio análisis (es una acción normal del
 * flujo, no una aprobación) — a diferencia de `canContinueAfterReview`.
 */
export function canExecuteCalculation(input: CalculationAuthorizationInput): AuthorizationDecision {
  const { actor, isInternalCall, analysisOwnerId } = input;

  if (isInternalCall) {
    return { allowed: true, reasonCode: "internal_call" };
  }

  if (!actor) {
    return { allowed: false, reasonCode: "no_session", httpStatus: 401, publicMessage: GENERIC_NO_SESSION_MESSAGE };
  }

  if (actor.role === "admin" || actor.role === "analyst") {
    return { allowed: true, reasonCode: "privileged_role" };
  }

  if (analysisOwnerId === null) {
    // No revelar si el análisis existe o no para otro usuario.
    return { allowed: false, reasonCode: "analysis_not_found", httpStatus: 404, publicMessage: GENERIC_NOT_FOUND_MESSAGE };
  }

  if (actor.userId === analysisOwnerId) {
    return { allowed: true, reasonCode: "owner" };
  }

  // Usuario ajeno: mismo status y mismo mensaje que "no existe" — un
  // atacante no puede distinguir "no existe" de "existe pero no es tuyo".
  return { allowed: false, reasonCode: "not_owner", httpStatus: 404, publicMessage: GENERIC_NOT_FOUND_MESSAGE };
}

export interface ReviewContinuationAuthorizationInput {
  actor: AuthenticatedActor | null;
  isInternalCall: boolean;
  analysisOwnerId: string | null;
  /** Estado real de `manual_reviews.estado` para esta revisión. */
  reviewState: string | null;
  /** ¿Ya se ejecutó `continuar-tras-revision` para esta aprobación? (control de idempotencia) */
  alreadyContinued: boolean;
}

const REQUIRED_REVIEW_STATE = "aprobado";

/**
 * BL-08/BL-09 — ¿puede este actor continuar el pipeline tras una
 * revisión manual? A diferencia de BL-07, el cliente propietario NUNCA
 * puede autoaprobarse/autocontinuar, sin importar el estado de la
 * revisión — ownership por sí solo no es un criterio válido aquí.
 */
export function canContinueAfterReview(input: ReviewContinuationAuthorizationInput): AuthorizationDecision {
  const { actor, isInternalCall, analysisOwnerId, reviewState, alreadyContinued } = input;

  if (!isInternalCall) {
    if (!actor) {
      return { allowed: false, reasonCode: "no_session", httpStatus: 401, publicMessage: GENERIC_NO_SESSION_MESSAGE };
    }

    if (actor.role !== "analyst" && actor.role !== "admin") {
      const isOwner = analysisOwnerId !== null && actor.userId === analysisOwnerId;
      return {
        allowed: false,
        reasonCode: isOwner ? "owner_self_approval_blocked" : "not_privileged",
        httpStatus: 403,
        publicMessage: GENERIC_UNAUTHORIZED_MESSAGE,
      };
    }
  }

  if (reviewState !== REQUIRED_REVIEW_STATE) {
    return { allowed: false, reasonCode: "invalid_review_state", httpStatus: 403, publicMessage: "La revisión no está en un estado que permita continuar." };
  }

  if (alreadyContinued) {
    return { allowed: false, reasonCode: "already_continued", httpStatus: 409, publicMessage: "Esta revisión ya fue procesada." };
  }

  return { allowed: true, reasonCode: "authorized" };
}

export interface RoleChangeAuthorizationInput {
  actor: AuthenticatedActor | null;
  targetUserId: string;
  newRole: ActorRole;
}

const VALID_ROLES: readonly ActorRole[] = ["user", "analyst", "admin"];

/**
 * BL-10 — ¿puede este actor cambiar el rol de `targetUserId`? Ningún
 * usuario puede cambiar su propio rol por esta vía, ni siquiera un
 * admin (la modificación de roles es siempre un acto sobre un tercero,
 * explícito y auditado — ver migración SQL de BL-10).
 */
export function canChangeRole(input: RoleChangeAuthorizationInput): AuthorizationDecision {
  const { actor, targetUserId, newRole } = input;

  if (!actor) {
    return { allowed: false, reasonCode: "no_session", httpStatus: 401, publicMessage: GENERIC_NO_SESSION_MESSAGE };
  }

  if (actor.role !== "admin") {
    return { allowed: false, reasonCode: "not_admin", httpStatus: 403, publicMessage: GENERIC_UNAUTHORIZED_MESSAGE };
  }

  if (actor.userId === targetUserId) {
    return { allowed: false, reasonCode: "self_role_change_blocked", httpStatus: 403, publicMessage: GENERIC_UNAUTHORIZED_MESSAGE };
  }

  if (!VALID_ROLES.includes(newRole)) {
    return { allowed: false, reasonCode: "invalid_role", httpStatus: 403, publicMessage: "Rol inválido." };
  }

  return { allowed: true, reasonCode: "authorized" };
}
