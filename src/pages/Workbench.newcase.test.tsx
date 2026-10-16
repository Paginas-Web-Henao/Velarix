// Al terminar el flujo de Evidence de un caso nuevo, el Workbench abre ese caso (Accounts).
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";

vi.mock("@/contexts/OwnerSessionContext", () => ({ useOwnerSession: () => ({ user: { id: "u1" }, mode: "local_private" }) }));
vi.mock("@/integrations/supabase/client", () => {
  const c: Record<string, unknown> = {};
  for (const m of ["select", "is", "order", "eq", "update"]) c[m] = () => c;
  c.then = (res: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(res);
  return { supabase: { from: () => c } };
});
vi.mock("@/components/dashboard/NewAnalysisStepper", () => ({
  default: ({ onComplete }: { onComplete: (id: string) => void }) => <button onClick={() => onComplete("case-77")}>finish</button>,
}));
vi.mock("@/components/workbench/CaseWorkbench", () => ({ default: () => <p>case view</p>, CASE_TABS: [{ key: "evidence" }, { key: "accounts" }] }));
vi.mock("@/components/demo/QuickModel", () => ({ default: () => null }));
vi.mock("@/pages/AdminReviews", () => ({ default: () => null }));
vi.mock("@/components/dashboard/QAChecklist", () => ({ default: () => null }));
vi.mock("@/components/workbench/SettingsPanel", () => ({ default: () => null }));

import Workbench from "./Workbench";

function Where() {
  const l = useLocation();
  return <output data-testid="loc">{l.search}</output>;
}

describe("Workbench — nuevo caso", () => {
  it("al terminar, abre el caso creado en Accounts en vez de volver a la lista", async () => {
    render(<MemoryRouter initialEntries={["/workbench?view=new"]}><Workbench /><Where /></MemoryRouter>);
    fireEvent.click(await screen.findByText("finish"));
    await waitFor(() => expect(screen.getByTestId("loc").textContent).toBe("?case=case-77&tab=accounts"));
    expect(screen.getByText("case view")).toBeTruthy();
  });
});
