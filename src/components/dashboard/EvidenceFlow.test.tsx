// Flujo CREATE CASE → UPLOAD → PARSE → MAP → VALIDATE → STOP en la UI.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const sb = vi.hoisted(() => ({
  inserted: [] as unknown[],
  status: "documentos_cargados",
  session: { access_token: "tok" } as null | { access_token: string },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => {
  const chain = (table: string) => {
    const c: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "limit"]) c[m] = () => c;
    c.insert = (row: unknown) => { sb.inserted.push(row); return c; };
    c.single = async () => (table === "analyses" && sb.inserted.length ? { data: { id: "new-case-1" }, error: null } : { data: { status: sb.status, validation_status: null }, error: null });
    c.then = (res: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(res);
    return c;
  };
  return { supabase: { from: chain, auth: { getSession: async () => ({ data: { session: sb.session } }) } } };
});

import NewAnalysisStepper from "./NewAnalysisStepper";
import DocumentUpload from "./DocumentUpload";
import ProgressPanel from "./ProgressPanel";

beforeEach(() => { sb.inserted = []; sb.status = "documentos_cargados"; sb.session = { access_token: "tok" }; });
afterEach(() => vi.unstubAllGlobals());

describe("NewAnalysisStepper", () => {
  it("no pide crecimiento, no trae placeholder de Alpina y crea el caso con expected_growth null y metadata null", async () => {
    render(<NewAnalysisStepper userId="u1" onComplete={() => {}} />);
    expect(screen.queryByText(/Crecimiento esperado de ingresos/i)).toBeNull(); // ya no hay campo
    expect(document.querySelector('input[type="number"]')).toBeNull();
    expect(document.body.innerHTML).not.toMatch(/Alpina/);
    fireEvent.change(screen.getByPlaceholderText("Nombre legal de la empresa"), { target: { value: "Empresa X" } });
    fireEvent.click(screen.getByText("Continuar →"));
    await waitFor(() => expect(sb.inserted).toHaveLength(1));
    const row = sb.inserted[0] as Record<string, unknown>;
    expect(row.expected_growth).toBeNull();
    expect(Object.values(row)).not.toContain(25);
    expect(row).toMatchObject({ valuation_date: null, base_period: null, basis_of_value: null, valued_interest: null, calculation_architecture: null });
  });

  it("guarda la metadata escrita en el formulario", async () => {
    render(<NewAnalysisStepper userId="u1" onComplete={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Nombre legal de la empresa"), { target: { value: "Empresa X" } });
    fireEvent.change(screen.getByLabelText("Fecha de valoración"), { target: { value: "2024-12-31" } });
    fireEvent.change(screen.getByLabelText("Período base"), { target: { value: "FY2024" } });
    fireEvent.click(screen.getByText("Continuar →"));
    await waitFor(() => expect(sb.inserted).toHaveLength(1));
    expect(sb.inserted[0]).toMatchObject({ valuation_date: "2024-12-31", base_period: "FY2024", basis_of_value: null });
  });
});

describe("DocumentUpload — Procesar Evidence", () => {
  const withUploadedDoc = async (props: Partial<Parameters<typeof DocumentUpload>[0]> = {}) => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("upload-document")
        ? new Response(JSON.stringify({ success: true, data: { document_id: "d1" } }))
        : new Response(JSON.stringify({ success: false, error: { code: "CASE_ALREADY_CALCULATED", message: "ya calculado" } }), { status: 409 }));
    vi.stubGlobal("fetch", fetchMock);
    const view = render(<DocumentUpload analysisId="a1" {...props} />);
    const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "er.pdf", { type: "application/pdf" })] } });
    await screen.findByText(/Estado de resultados detectado/);
    return fetchMock;
  };

  it("el botón dice «Procesar Evidence» y el copy no promete ejecutar el motor", () => {
    render(<DocumentUpload analysisId="a1" />);
    expect(screen.getByText("Procesar Evidence", { selector: "button" })).toBeTruthy();
    expect(screen.queryByText(/Ejecutar pipeline de análisis/)).toBeNull();
    expect(document.body.textContent).not.toMatch(/construye input para el motor/);
    expect(document.body.textContent).toMatch(/No construye el input\s+del motor ni calcula/);
  });

  it("un error HTTP al iniciar el pipeline llega como fallo con su mensaje", async () => {
    const onStarted = vi.fn();
    const onFinished = vi.fn();
    const fetchMock = await withUploadedDoc({ onStarted, onFinished });
    fireEvent.click(screen.getByText("Procesar Evidence", { selector: "button" }));
    await waitFor(() => expect(onFinished).toHaveBeenCalled());
    expect(onStarted).toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledWith({ ok: false, code: "CASE_ALREADY_CALCULATED", message: "ya calculado" });
    expect(fetchMock.mock.calls.map((c) => c[0] as string).filter((u) => /build-structured-input|ejecutar-calculo/.test(u))).toEqual([]);
  });

  it("en un caso calculado: aviso visible y «Procesar Evidence» deshabilitado", async () => {
    render(<DocumentUpload analysisId="a1" calculated />);
    expect(screen.getByText(/NO forman parte de ese cálculo/)).toBeTruthy();
    expect((screen.getByText("Procesar Evidence", { selector: "button" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("ProgressPanel — solo fases de Evidence", () => {
  it.each(["validacion_aprobada", "validacion_con_advertencias"])("termina en %s sin fases de Cálculo/Narrativa/Informe", async (status) => {
    sb.status = status;
    const onCompletado = vi.fn();
    render(<ProgressPanel analysisId="a1" onCompletado={onCompletado} />);
    await waitFor(() => expect(onCompletado).toHaveBeenCalled());
    expect(screen.getByText("✓")).toBeTruthy();
    for (const f of ["Documentos", "Extracción", "Cuentas", "Validación"]) expect(screen.getByText(f)).toBeTruthy();
    expect(screen.queryByText("Cálculo")).toBeNull();
    expect(screen.queryByText("Narrativa")).toBeNull();
    expect(screen.queryByText("Informe")).toBeNull();
    expect(screen.getByText("Procesando Evidence")).toBeTruthy();
  });

  it("validación bloqueada se reporta como error, no como completado", async () => {
    sb.status = "validacion_bloqueada";
    const onCompletado = vi.fn();
    const onError = vi.fn();
    render(<ProgressPanel analysisId="a1" onCompletado={onCompletado} onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onCompletado).not.toHaveBeenCalled();
  });
});
