// Corrección de respuestas de autenticación — pruebas de especificación.
//
// Importan exactamente las mismas funciones (`extractBearerToken`,
// `requireAuthenticatedUser`, `classifyOwnedResourceLookup`,
// `classifyResourceLookup`, `mapErrorToResponse`,
// `shouldNotifyPipelineError`) que usan las 7 Edge Functions de usuario.
// No hay pruebas de "solo texto" — cada caso ejecuta la lógica real y
// verifica el resultado tipado.
//
// Ampliación (cierre de hallazgos previos a JWT Signing Keys): las formas
// de error simuladas en `requireAuthenticatedUser` (`AuthApiError`,
// `AuthRetryableFetchError`, `AuthUnknownError`, `AuthSessionMissingError`)
// replican exactamente los `name` que expone `@supabase/auth-js@2.68.0`
// (la dependencia real de `@supabase/supabase-js@2.49.1`, la versión
// pinneada que importan las 7 funciones vía esm.sh) — verificado leyendo
// el código fuente publicado de esa versión exacta. No son nombres
// inventados.

import { describe, it, expect, vi } from "vitest";
import {
  extractBearerToken,
  requireAuthenticatedUser,
  isClientAuthError,
  classifyOwnedResourceLookup,
  classifyResourceLookup,
  mapErrorToResponse,
  shouldNotifyPipelineError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  type AuthCheckResult,
} from "./user-auth";

const VALID_TOKEN = "eyJhbGciOiJIUzI1NiJ9.abc.def";
const OWNER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";

describe("extractBearerToken", () => {
  it("cabecera ausente (null) -> null", () => {
    expect(extractBearerToken(null)).toBeNull();
  });

  it("cabecera ausente (undefined) -> null", () => {
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it("cabecera vacía -> null", () => {
    expect(extractBearerToken("")).toBeNull();
  });

  it("esquema Basic en vez de Bearer -> null", () => {
    expect(extractBearerToken(`Basic ${VALID_TOKEN}`)).toBeNull();
  });

  it("Bearer sin token -> null", () => {
    expect(extractBearerToken("Bearer")).toBeNull();
  });

  it("Bearer con espacio pero sin token -> null", () => {
    expect(extractBearerToken("Bearer ")).toBeNull();
  });

  it("espacios incorrectos: sin separador entre esquema y token -> null", () => {
    expect(extractBearerToken(`Bearer${VALID_TOKEN}`)).toBeNull();
  });

  it("espacios incorrectos: tab en vez de espacio -> null", () => {
    expect(extractBearerToken(`Bearer\t${VALID_TOKEN}`)).toBeNull();
  });

  it("espacios incorrectos: token con espacio interno -> null", () => {
    expect(extractBearerToken("Bearer abc def")).toBeNull();
  });

  it("publishable key presentada como si fuera JWT: se extrae igual como token (la validación real la hace auth.getUser, no esta función)", () => {
    expect(extractBearerToken("Bearer sb_publishable_abc123")).toBe("sb_publishable_abc123");
  });

  it("token presente con formato válido -> se extrae exactamente", () => {
    expect(extractBearerToken(`Bearer ${VALID_TOKEN}`)).toBe(VALID_TOKEN);
  });

  it("tolera espacios externos en el valor de la cabecera (whitespace HTTP normal)", () => {
    expect(extractBearerToken(`  Bearer ${VALID_TOKEN}  `)).toBe(VALID_TOKEN);
  });
});

describe("isClientAuthError", () => {
  it("AuthApiError -> true (la API de Auth rechazó el token)", () => {
    expect(isClientAuthError({ name: "AuthApiError", status: 401 })).toBe(true);
  });

  it("AuthSessionMissingError -> true (sesión ya cerrada/inexistente)", () => {
    expect(isClientAuthError({ name: "AuthSessionMissingError", status: 400 })).toBe(true);
  });

  it("AuthRetryableFetchError -> false (fallo técnico de red/servicio, nunca 401)", () => {
    expect(isClientAuthError({ name: "AuthRetryableFetchError", status: 503 })).toBe(false);
  });

  it("AuthUnknownError -> false (fallo inesperado, nunca 401)", () => {
    expect(isClientAuthError({ name: "AuthUnknownError" })).toBe(false);
  });

  it("error sin name -> false", () => {
    expect(isClientAuthError({ status: 500 })).toBe(false);
  });

  it("null -> false", () => {
    expect(isClientAuthError(null)).toBe(false);
  });
});

describe("requireAuthenticatedUser", () => {
  it("sin cabecera Authorization: rechaza 401 sin invocar verifyToken", async () => {
    const verifyToken = vi.fn();
    await expect(requireAuthenticatedUser(null, verifyToken)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("Bearer malformado: rechaza 401 sin invocar verifyToken", async () => {
    const verifyToken = vi.fn();
    await expect(requireAuthenticatedUser("Basic xyz", verifyToken)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("usuario válido: devuelve exactamente el user.id de auth.getUser, nada más", async () => {
    const verifyToken = vi.fn<[], Promise<AuthCheckResult>>().mockResolvedValue({ user: { id: OWNER_ID }, error: null });
    const user = await requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken);
    expect(user.id).toBe(OWNER_ID);
    expect(verifyToken).toHaveBeenCalledWith(VALID_TOKEN);
  });

  it("token inválido confirmado por Auth (AuthApiError 401) -> 401", async () => {
    const verifyToken = vi.fn().mockResolvedValue({ user: null, error: { name: "AuthApiError", status: 401, message: "invalid JWT" } });
    await expect(requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("token expirado (AuthApiError 401, code bad_jwt) -> 401", async () => {
    const verifyToken = vi.fn().mockResolvedValue({ user: null, error: { name: "AuthApiError", status: 401, message: "JWT expired" } });
    await expect(requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("sesión ya cerrada/inexistente (AuthSessionMissingError) -> 401", async () => {
    const verifyToken = vi.fn().mockResolvedValue({ user: null, error: { name: "AuthSessionMissingError", status: 400 } });
    await expect(requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("error Auth API 5xx propio del servicio (AuthRetryableFetchError 503) -> nunca 401, error técnico real", async () => {
    const verifyToken = vi.fn().mockResolvedValue({ user: null, error: { name: "AuthRetryableFetchError", status: 503, message: "Service Unavailable" } });
    const rejection = requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken);
    await expect(rejection).rejects.not.toBeInstanceOf(UnauthorizedError);
    await expect(rejection).rejects.toMatchObject({ name: "AuthRetryableFetchError" });
  });

  it("error retryable de red/timeout (AuthRetryableFetchError status 0) -> nunca 401", async () => {
    const verifyToken = vi.fn().mockResolvedValue({ user: null, error: { name: "AuthRetryableFetchError", status: 0, message: "fetch failed" } });
    await expect(requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken)).rejects.not.toBeInstanceOf(UnauthorizedError);
  });

  it("error desconocido (AuthUnknownError, respuesta no-JSON de Auth) -> nunca 401", async () => {
    const verifyToken = vi.fn().mockResolvedValue({ user: null, error: { name: "AuthUnknownError", message: "Unexpected error" } });
    await expect(requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken)).rejects.not.toBeInstanceOf(UnauthorizedError);
  });

  it("usuario nulo sin error explicable (forma oficial no debería darse, pero ante la ambigüedad se falla cerrado a 500, nunca a 401)", async () => {
    const verifyToken = vi.fn().mockResolvedValue({ user: null, error: null });
    await expect(requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken)).rejects.not.toBeInstanceOf(UnauthorizedError);
  });

  it("excepción inesperada de verifyToken (nunca ocurre con auth.getUser + token explícito, pero se cubre defensivamente) -> se propaga, nunca se convierte en 401", async () => {
    const verifyToken = vi.fn().mockRejectedValue(new Error("bug interno inesperado"));
    const rejection = requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken);
    await expect(rejection).rejects.not.toBeInstanceOf(UnauthorizedError);
    await expect(rejection).rejects.toThrow("bug interno inesperado");
  });

  it("no descarta el campo error de auth.getUser: un AuthRetryableFetchError con user=null no colapsa en 401 solo por revisar 'user'", async () => {
    const verifyToken = vi.fn().mockResolvedValue({ user: null, error: { name: "AuthRetryableFetchError", status: 502 } });
    let caught: unknown;
    try {
      await requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken);
    } catch (e) {
      caught = e;
    }
    expect(caught).not.toBeInstanceOf(UnauthorizedError);
    expect((caught as { name?: string })?.name).toBe("AuthRetryableFetchError");
  });
});

describe("classifyOwnedResourceLookup", () => {
  it("sin error, recurso es del actor -> owner", () => {
    expect(classifyOwnedResourceLookup(null, { user_id: OWNER_ID }, OWNER_ID)).toBe("owner");
  });

  it("sin error, recurso inexistente (data null) -> not_found", () => {
    expect(classifyOwnedResourceLookup(null, null, OWNER_ID)).toBe("not_found");
  });

  it("sin filas (PGRST116), recurso null -> not_found (caso típico de .single() sobre id inexistente)", () => {
    expect(classifyOwnedResourceLookup({ code: "PGRST116" }, null, OWNER_ID)).toBe("not_found");
  });

  it("recurso existe pero es de otro usuario -> not_found (mismo resultado público que inexistente)", () => {
    expect(classifyOwnedResourceLookup(null, { user_id: OTHER_USER_ID }, OWNER_ID)).toBe("not_found");
  });

  it("error técnico real (código distinto a PGRST116) -> technical_error, nunca 404", () => {
    expect(classifyOwnedResourceLookup({ code: "08006" }, null, OWNER_ID)).toBe("technical_error");
  });

  it("error sin código (fallo genérico de conexión) -> technical_error", () => {
    expect(classifyOwnedResourceLookup({}, null, OWNER_ID)).toBe("technical_error");
  });
});

describe("classifyResourceLookup (existencia sin ownership — usado por parse-document para el documento)", () => {
  it("sin error, recurso presente -> found", () => {
    expect(classifyResourceLookup(null, { id: "doc-1" })).toBe("found");
  });

  it("sin error, recurso ausente (data null) -> not_found", () => {
    expect(classifyResourceLookup(null, null)).toBe("not_found");
  });

  it("PGRST116 (0 filas) -> not_found", () => {
    expect(classifyResourceLookup({ code: "PGRST116" }, null)).toBe("not_found");
  });

  it("error técnico real (código distinto a PGRST116) -> technical_error, nunca 404", () => {
    expect(classifyResourceLookup({ code: "57014" }, null)).toBe("technical_error");
  });
});

describe("mapErrorToResponse", () => {
  const fallback = { code: "TEST_ERROR", message: "Error genérico de prueba." };

  it("UnauthorizedError -> 401, cuerpo uniforme, sin detalles de la causa real", () => {
    const result = mapErrorToResponse(new UnauthorizedError(), fallback);
    expect(result.status).toBe(401);
    expect(result.body).toEqual({ success: false, error: { code: "UNAUTHORIZED", message: "Autenticación requerida." } });
  });

  it("NotFoundError -> 404, mensaje genérico, no distingue inexistente de ajeno", () => {
    const result = mapErrorToResponse(new NotFoundError(), fallback);
    expect(result.status).toBe(404);
    expect(result.body).toEqual({ success: false, error: { code: "NOT_FOUND", message: "Recurso no encontrado." } });
  });

  it("BadRequestError -> 400, usa el código y mensaje público definidos por la función, no un genérico", () => {
    const result = mapErrorToResponse(new BadRequestError("NO_ACCOUNTS", "No hay cuentas homologadas."), fallback);
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ success: false, error: { code: "NO_ACCOUNTS", message: "No hay cuentas homologadas." } });
  });

  it("Error técnico real -> 500 con el fallback.message seguro, NUNCA con error.message", () => {
    const result = mapErrorToResponse(new Error("relation \"analyses\" does not exist at db.internal.velarix:5432"), fallback);
    expect(result.status).toBe(500);
    expect(result.body).toEqual({ success: false, error: { code: "TEST_ERROR", message: "Error genérico de prueba." } });
  });

  it("valor no-Error lanzado -> 500 con mensaje de fallback (nunca revienta ni filtra el valor crudo)", () => {
    const result = mapErrorToResponse("boom", fallback);
    expect(result.status).toBe(500);
    expect(result.body).toEqual({ success: false, error: { code: "TEST_ERROR", message: "Error genérico de prueba." } });
  });

  it("errores de auth-js reales (AuthRetryableFetchError/AuthUnknownError) también caen en fallback.message, nunca en su propio .message", () => {
    const retryable = Object.assign(new Error("Service Unavailable"), { name: "AuthRetryableFetchError", status: 503 });
    const result = mapErrorToResponse(retryable, fallback);
    expect(result.status).toBe(500);
    expect(result.body.error.message).toBe("Error genérico de prueba.");
  });

  describe("la respuesta pública 500 nunca filtra detalles técnicos internos", () => {
    const casosSensibles: Array<[string, string]> = [
      ["nombre de tabla/columna de base de datos", 'column "user_id_fake" of relation "analyses_internal" does not exist'],
      ["fragmento SQL", "syntax error at or near SELECT * FROM analyses WHERE user_id ="],
      ["URL interna", "connect ECONNREFUSED http://internal-postgres.velarix.local:5432"],
      ["cabecera Authorization completa", "failed forwarding header Authorization: Bearer FAKE.TEST.TOKEN-not-a-real-jwt"],
      ["secret key sintética de prueba", "using key sb_secret_FAKE_TEST_VALUE_0000 failed"],
      ["JWT sintético de prueba", "could not decode eyJhbGciOiJIUzI1NiJ9.FAKE.PAYLOAD"],
      ["mensaje de red/timeout crudo", "fetch failed: ETIMEDOUT after 30000ms to auth.example-test.local"],
      ["fragmento de stack trace", "at Object.<anonymous> (/app/supabase/functions/parse-document/index.ts:512:11)"],
    ];

    it.each(casosSensibles)("no filtra: %s", (_label, mensajeTecnico) => {
      const result = mapErrorToResponse(new Error(mensajeTecnico), fallback);
      expect(result.status).toBe(500);
      const serialized = JSON.stringify(result.body);
      expect(serialized).not.toContain(mensajeTecnico);
      expect(serialized).not.toMatch(/Bearer|sb_secret_|sb_publishable_|eyJ|ECONNREFUSED|ETIMEDOUT|syntax error|relation ".*" does not exist/);
    });
  });

  it("ninguna respuesta 401/404/400 incluye tokens, claves ni cabeceras", () => {
    const unauthorized = mapErrorToResponse(new UnauthorizedError(), fallback);
    expect(JSON.stringify(unauthorized.body)).not.toMatch(/Bearer|sb_secret_|sb_publishable_|eyJ/);
    const notFound = mapErrorToResponse(new NotFoundError(), fallback);
    expect(JSON.stringify(notFound.body)).not.toMatch(/Bearer|sb_secret_|sb_publishable_|eyJ/);
    const badRequest = mapErrorToResponse(new BadRequestError("X", "mensaje público seguro"), fallback);
    expect(JSON.stringify(badRequest.body)).not.toMatch(/Bearer|sb_secret_|sb_publishable_|eyJ/);
  });
});

describe("shouldNotifyPipelineError", () => {
  const fallback = { code: "PIPELINE_ERROR", message: "Error en el pipeline de análisis." };

  it("error técnico real (500) con analysis_id capturado -> notifica", () => {
    const mapped = mapErrorToResponse(new Error("boom"), fallback);
    expect(shouldNotifyPipelineError(mapped, "analysis-123")).toBe(true);
  });

  it("error técnico real (500) sin analysis_id capturado (falló antes de leer el body) -> no notifica", () => {
    const mapped = mapErrorToResponse(new Error("boom"), fallback);
    expect(shouldNotifyPipelineError(mapped, null)).toBe(false);
  });

  it("fallo de autenticación (401) -> nunca notifica, aunque haya analysis_id capturado", () => {
    const mapped = mapErrorToResponse(new UnauthorizedError(), fallback);
    expect(shouldNotifyPipelineError(mapped, "analysis-123")).toBe(false);
  });

  it("recurso ajeno (404) -> nunca notifica al dueño real por un intento de otro usuario", () => {
    const mapped = mapErrorToResponse(new NotFoundError(), fallback);
    expect(shouldNotifyPipelineError(mapped, "analysis-123")).toBe(false);
  });

  it("precondición de negocio (400) -> nunca notifica, no es un error técnico", () => {
    const mapped = mapErrorToResponse(new BadRequestError("NO_DOCUMENTS", "Sin documentos."), fallback);
    expect(shouldNotifyPipelineError(mapped, "analysis-123")).toBe(false);
  });
});
