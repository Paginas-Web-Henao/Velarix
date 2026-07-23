// Bloque 1D-P0 — Pruebas de especificación del módulo de autorización.
// Importan exactamente las mismas funciones puras
// (`canExecuteCalculation`, `canContinueAfterReview`, `canChangeRole`,
// `isInternalServiceCall`) que usan `ejecutar-calculo/index.ts` y
// `continuar-tras-revision/index.ts`.
//
// Cubre los 12 escenarios mínimos exigidos por el Bloque 1D. Ver
// `docs/velarix/bloque-1d/MATRIZ-PRUEBAS-AUTORIZACION.md` para el mapeo
// completo escenario -> prueba -> archivo real.

import { describe, it, expect } from "vitest";
import {
  canExecuteCalculation,
  canContinueAfterReview,
  canChangeRole,
  isInternalServiceCall,
  type AuthenticatedActor,
} from "./authorization";

const OWNER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
const ANALYST_ID = "33333333-3333-3333-3333-333333333333";
const ADMIN_ID = "44444444-4444-4444-4444-444444444444";
const SERVICE_ROLE_KEY = "test-service-role-secret";

const owner: AuthenticatedActor = { userId: OWNER_ID, role: "user" };
const otherUser: AuthenticatedActor = { userId: OTHER_USER_ID, role: "user" };
const analyst: AuthenticatedActor = { userId: ANALYST_ID, role: "analyst" };
const admin: AuthenticatedActor = { userId: ADMIN_ID, role: "admin" };

describe("canExecuteCalculation (BL-07) — escenarios 1, 2, 3, 4, 7, 8, 9, 10", () => {
  it("1. sin autenticación (actor null, sin header): rechazado 401", () => {
    const d = canExecuteCalculation({ actor: null, isInternalCall: false, analysisOwnerId: OWNER_ID });
    expect(d.allowed).toBe(false);
    expect(d.httpStatus).toBe(401);
  });

  it("2. solo anon key (auth.getUser no resuelve -> actor null, igual que sin sesión)", () => {
    // La Edge Function llama auth.getUser(anonKey) y obtiene user: null —
    // desde la perspectiva del módulo puro es indistinguible del caso 1,
    // por diseño: ambos significan "no hay identidad de usuario verificada".
    const d = canExecuteCalculation({ actor: null, isInternalCall: false, analysisOwnerId: OWNER_ID });
    expect(d.allowed).toBe(false);
    expect(d.reasonCode).toBe("no_session");
  });

  it("3. usuario ajeno al análisis: rechazado, sin revelar si el análisis existe", () => {
    const d = canExecuteCalculation({ actor: otherUser, isInternalCall: false, analysisOwnerId: OWNER_ID });
    expect(d.allowed).toBe(false);
    expect(d.httpStatus).toBe(404);
  });

  it("4. cliente propietario ejecutando su propio cálculo: permitido", () => {
    const d = canExecuteCalculation({ actor: owner, isInternalCall: false, analysisOwnerId: OWNER_ID });
    expect(d.allowed).toBe(true);
    expect(d.reasonCode).toBe("owner");
  });

  it("7. analista autorizado: permitido incluso sobre un análisis ajeno", () => {
    const d = canExecuteCalculation({ actor: analyst, isInternalCall: false, analysisOwnerId: OWNER_ID });
    expect(d.allowed).toBe(true);
    expect(d.reasonCode).toBe("privileged_role");
  });

  it("8. administrador autorizado: permitido", () => {
    const d = canExecuteCalculation({ actor: admin, isInternalCall: false, analysisOwnerId: OWNER_ID });
    expect(d.allowed).toBe(true);
  });

  it("9. invocación interna válida: permitida sin necesidad de actor", () => {
    const d = canExecuteCalculation({ actor: null, isInternalCall: true, analysisOwnerId: OWNER_ID });
    expect(d.allowed).toBe(true);
    expect(d.reasonCode).toBe("internal_call");
  });

  it("10. acceso cruzado sin filtración: 'ajeno' y 'no existe' devuelven el mismo status y el mismo mensaje", () => {
    const ajeno = canExecuteCalculation({ actor: otherUser, isInternalCall: false, analysisOwnerId: OWNER_ID });
    const noExiste = canExecuteCalculation({ actor: otherUser, isInternalCall: false, analysisOwnerId: null });
    expect(ajeno.httpStatus).toBe(noExiste.httpStatus);
    expect(ajeno.publicMessage).toBe(noExiste.publicMessage);
  });
});

describe("canContinueAfterReview (BL-08/BL-09) — escenarios 5, 7, 8, 9, 11, 12", () => {
  it("5. cliente propietario intentando continuar/aprobar su propia revisión: rechazado", () => {
    const d = canContinueAfterReview({
      actor: owner, isInternalCall: false, analysisOwnerId: OWNER_ID,
      reviewState: "aprobado", alreadyContinued: false,
    });
    expect(d.allowed).toBe(false);
    expect(d.reasonCode).toBe("owner_self_approval_blocked");
    expect(d.httpStatus).toBe(403);
  });

  it("usuario ajeno (no propietario, no analista): también rechazado", () => {
    const d = canContinueAfterReview({
      actor: otherUser, isInternalCall: false, analysisOwnerId: OWNER_ID,
      reviewState: "aprobado", alreadyContinued: false,
    });
    expect(d.allowed).toBe(false);
    expect(d.reasonCode).toBe("not_privileged");
  });

  it("7. analista autorizado con revisión aprobada: permitido", () => {
    const d = canContinueAfterReview({
      actor: analyst, isInternalCall: false, analysisOwnerId: OWNER_ID,
      reviewState: "aprobado", alreadyContinued: false,
    });
    expect(d.allowed).toBe(true);
  });

  it("8. administrador autorizado: permitido", () => {
    const d = canContinueAfterReview({
      actor: admin, isInternalCall: false, analysisOwnerId: OWNER_ID,
      reviewState: "aprobado", alreadyContinued: false,
    });
    expect(d.allowed).toBe(true);
  });

  it("9. invocación interna válida: permitida sin exigir rol", () => {
    const d = canContinueAfterReview({
      actor: null, isInternalCall: true, analysisOwnerId: OWNER_ID,
      reviewState: "aprobado", alreadyContinued: false,
    });
    expect(d.allowed).toBe(true);
  });

  it("11. revisión en estado inválido (pendiente): rechazado incluso para un analista", () => {
    const d = canContinueAfterReview({
      actor: analyst, isInternalCall: false, analysisOwnerId: OWNER_ID,
      reviewState: "pendiente", alreadyContinued: false,
    });
    expect(d.allowed).toBe(false);
    expect(d.reasonCode).toBe("invalid_review_state");
  });

  it("12. segundo intento de continuar una revisión ya procesada: rechazado (409, idempotencia)", () => {
    const d = canContinueAfterReview({
      actor: analyst, isInternalCall: false, analysisOwnerId: OWNER_ID,
      reviewState: "aprobado", alreadyContinued: true,
    });
    expect(d.allowed).toBe(false);
    expect(d.reasonCode).toBe("already_continued");
    expect(d.httpStatus).toBe(409);
  });

  it("sin autenticación: rechazado 401 antes de evaluar el estado de la revisión", () => {
    const d = canContinueAfterReview({
      actor: null, isInternalCall: false, analysisOwnerId: OWNER_ID,
      reviewState: "aprobado", alreadyContinued: false,
    });
    expect(d.allowed).toBe(false);
    expect(d.httpStatus).toBe(401);
  });
});

describe("canChangeRole (BL-10) — escenario 6", () => {
  it("6. cliente intentando cambiar su propio rol: rechazado (no es admin)", () => {
    const d = canChangeRole({ actor: owner, targetUserId: OWNER_ID, newRole: "admin" });
    expect(d.allowed).toBe(false);
    expect(d.reasonCode).toBe("not_admin");
  });

  it("un admin no puede cambiar su propio rol por esta vía (auto-modificación bloqueada)", () => {
    const d = canChangeRole({ actor: admin, targetUserId: ADMIN_ID, newRole: "user" });
    expect(d.allowed).toBe(false);
    expect(d.reasonCode).toBe("self_role_change_blocked");
  });

  it("admin cambiando el rol de otro usuario: permitido", () => {
    const d = canChangeRole({ actor: admin, targetUserId: OWNER_ID, newRole: "analyst" });
    expect(d.allowed).toBe(true);
  });

  it("rol destino inválido: rechazado incluso si el actor es admin", () => {
    const d = canChangeRole({ actor: admin, targetUserId: OWNER_ID, newRole: "superadmin" as never });
    expect(d.allowed).toBe(false);
    expect(d.reasonCode).toBe("invalid_role");
  });

  it("sin sesión: rechazado 401", () => {
    const d = canChangeRole({ actor: null, targetUserId: OWNER_ID, newRole: "admin" });
    expect(d.allowed).toBe(false);
    expect(d.httpStatus).toBe(401);
  });
});

describe("isInternalServiceCall — detección de invocación interna real", () => {
  it("9 (soporte). coincide exactamente con la service role key real", () => {
    expect(isInternalServiceCall(`Bearer ${SERVICE_ROLE_KEY}`, SERVICE_ROLE_KEY)).toBe(true);
  });

  it("no acepta un campo público simulando 'internal' — solo el secreto real cuenta", () => {
    expect(isInternalServiceCall("Bearer internal-true", SERVICE_ROLE_KEY)).toBe(false);
    expect(isInternalServiceCall(`Bearer ${SERVICE_ROLE_KEY}suffix`, SERVICE_ROLE_KEY)).toBe(false);
  });

  it("header ausente o secreto ausente: false, nunca true por omisión", () => {
    expect(isInternalServiceCall(null, SERVICE_ROLE_KEY)).toBe(false);
    expect(isInternalServiceCall(`Bearer ${SERVICE_ROLE_KEY}`, undefined)).toBe(false);
    expect(isInternalServiceCall(undefined, undefined)).toBe(false);
  });
});
