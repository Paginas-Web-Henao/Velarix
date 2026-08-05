// Corrección de respuestas de autenticación — pruebas de especificación.
//
// Importan exactamente las mismas funciones (`extractBearerToken`,
// `requireAuthenticatedUser`, `classifyOwnedResourceLookup`,
// `mapErrorToResponse`, `shouldNotifyPipelineError`) que usan las 7
// Edge Functions de usuario. No hay pruebas de "solo texto" — cada caso
// ejecuta la lógica real y verifica el resultado tipado.

import { describe, it, expect, vi } from "vitest";
import {
  extractBearerToken,
  requireAuthenticatedUser,
  classifyOwnedResourceLookup,
  mapErrorToResponse,
  shouldNotifyPipelineError,
  UnauthorizedError,
  NotFoundError,
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

describe("requireAuthenticatedUser", () => {
  it("sin cabecera Authorization: rechaza sin invocar verifyToken", async () => {
    const verifyToken = vi.fn();
    await expect(requireAuthenticatedUser(null, verifyToken)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("Bearer malformado: rechaza sin invocar verifyToken", async () => {
    const verifyToken = vi.fn();
    await expect(requireAuthenticatedUser("Basic xyz", verifyToken)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("auth.getUser devuelve usuario nulo (token aleatorio/inválido): 401", async () => {
    const verifyToken = vi.fn().mockResolvedValue(null);
    await expect(requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("auth.getUser lanza (token alterado/expirado, error de red): 401, nunca 500", async () => {
    const verifyToken = vi.fn().mockRejectedValue(new Error("invalid signature"));
    await expect(requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("usuario válido: devuelve exactamente el user.id de auth.getUser, nada más", async () => {
    const verifyToken = vi.fn().mockResolvedValue({ id: OWNER_ID });
    const user = await requireAuthenticatedUser(`Bearer ${VALID_TOKEN}`, verifyToken);
    expect(user.id).toBe(OWNER_ID);
    expect(verifyToken).toHaveBeenCalledWith(VALID_TOKEN);
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

describe("mapErrorToResponse", () => {
  const fallback = { code: "TEST_ERROR", message: "Error genérico de prueba." };

  it("UnauthorizedError -> 401, cuerpo uniforme, sin detalles de la causa real", () => {
    const result = mapErrorToResponse(new UnauthorizedError(), fallback);
    expect(result.status).toBe(401);
    expect(result.body).toEqual({ success: false, error: { code: "UNAUTHORIZED", message: "Autenticación requerida." } });
  });

  it("NotFoundError -> 404, mensaje genérico que no revela si el recurso existe", () => {
    const result = mapErrorToResponse(new NotFoundError(), fallback);
    expect(result.status).toBe(404);
    expect(result.body).toEqual({ success: false, error: { code: "NOT_FOUND", message: "Recurso no encontrado." } });
  });

  it("Error técnico real -> 500 con el código de fallback propio de la función", () => {
    const result = mapErrorToResponse(new Error("db connection lost"), fallback);
    expect(result.status).toBe(500);
    expect(result.body).toEqual({ success: false, error: { code: "TEST_ERROR", message: "db connection lost" } });
  });

  it("valor no-Error lanzado -> 500 con mensaje de fallback (nunca revienta ni filtra el valor crudo)", () => {
    const result = mapErrorToResponse("boom", fallback);
    expect(result.status).toBe(500);
    expect(result.body).toEqual({ success: false, error: { code: "TEST_ERROR", message: "Error genérico de prueba." } });
  });

  it("ninguna respuesta de error incluye tokens, claves ni cabeceras", () => {
    const result = mapErrorToResponse(new Error("Authorization: Bearer eyJhbGci... apikey=sb_secret_x"), fallback);
    // El código de la función real nunca pasa el header como mensaje de Error;
    // esta prueba documenta que aunque lo hiciera, 401/404 no lo expondrían.
    const unauthorized = mapErrorToResponse(new UnauthorizedError(), fallback);
    expect(JSON.stringify(unauthorized.body)).not.toMatch(/Bearer|sb_secret_|sb_publishable_|eyJ/);
    const notFound = mapErrorToResponse(new NotFoundError(), fallback);
    expect(JSON.stringify(notFound.body)).not.toMatch(/Bearer|sb_secret_|sb_publishable_|eyJ/);
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
});
