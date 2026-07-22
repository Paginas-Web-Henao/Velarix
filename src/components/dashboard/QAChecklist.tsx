import { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Link2, Calculator, Download, CheckCircle2, AlertTriangle } from "lucide-react";

interface CheckItem {
  id: number;
  text: string;
}

interface CheckSection {
  title: string;
  icon: ReactNode;
  items: CheckItem[];
}

const SECTIONS: CheckSection[] = [
  {
    title: "Parsing y carga",
    icon: <FileText className="h-4 w-4" />,
    items: [
      { id: 1, text: "PDF digital de Siigo/World Office carga y parsea correctamente" },
      { id: 2, text: "PDF escaneado muestra mensaje de error institucional (no falla silencioso)" },
      { id: 3, text: "Excel con múltiples hojas detecta la hoja correcta automáticamente" },
      { id: 4, text: "Excel con períodos comparativos (2023 y 2024 en columnas) extrae ambos" },
      { id: 5, text: "CSV con separador punto y coma (;) parsea correctamente" },
      { id: 6, text: "CSV con encoding latin-1 (tildes y ñ) se lee correctamente" },
      { id: 7, text: "Archivo > 10MB muestra mensaje de error de tamaño (no el navegador)" },
      { id: 8, text: "Archivo DOCX muestra mensaje de formato no soportado" },
      { id: 9, text: "Archivo vacío (0 KB) muestra mensaje de error adecuado" },
      { id: 10, text: "Valores en COP se detectan y se ofrece conversión a USD" },
    ],
  },
  {
    title: "Homologación y validación",
    icon: <Link2 className="h-4 w-4" />,
    items: [
      { id: 11, text: '"Utilidad del ejercicio" se mapea a net_income con confianza >= 0.85' },
      { id: 12, text: '"4105 Ingresos por servicios" (con código PUC) se mapea a revenue' },
      { id: 13, text: "Cuentas de patrimonio (reserva legal, superávit) se agregan a equity" },
      { id: 14, text: "El semáforo verde aparece en un P&L y balance completos y consistentes" },
      { id: 15, text: "El semáforo rojo bloquea cuando la ecuación patrimonial falla > 1%" },
      { id: 16, text: "Las advertencias (amarillo) se muestran con mensajes en español institucional" },
      { id: 17, text: "Un análisis con solo P&L (sin balance) genera semáforo amarillo, no rojo" },
      { id: 18, text: "Los valores en millones se detectan y se multiplican correctamente" },
      { id: 19, text: "El impuesto diferido se suma al impuesto corriente en structured input" },
      { id: 20, text: "Cuentas con ambigüedad alta (< 0.75) se marcan en rojo en la vista previa" },
    ],
  },
  {
    title: "Motor de cálculo y resultados",
    icon: <Calculator className="h-4 w-4" />,
    items: [
      { id: 21, text: "El EV del DCF tiene un valor razonable para una PYME colombiana (USD 500K–100M)" },
      { id: 22, text: "El WACC está entre 8% y 16% para todos los sectores colombianos" },
      { id: 23, text: "La proyección de ingresos en Y5 es coherente con la tasa de crecimiento" },
      { id: 24, text: "El FCFF en Y1 es positivo para empresas con EBITDA > 0" },
      { id: 25, text: "La sensibilidad muestra 25 celdas (5×5) con la celda base resaltada" },
      { id: 26, text: "El benchmark muestra diferencias correctas empresa vs sector" },
      { id: 27, text: "Si WACC <= g, el DCF muestra mensaje de error (no divide por cero)" },
      { id: 28, text: "El resumen ejecutivo narrativo se genera en menos de 15 segundos" },
      { id: 29, text: 'El estado del análisis llega a "informe_generado" en menos de 90 segundos' },
      { id: 30, text: 'El correo de "análisis completado" llega en menos de 3 minutos' },
    ],
  },
  {
    title: "PDF y experiencia de usuario",
    icon: <Download className="h-4 w-4" />,
    items: [
      { id: 31, text: "La portada muestra el nombre de empresa correcto" },
      { id: 32, text: "La paginación es correcta en todos los tipos de documento probados" },
      { id: 33, text: "La tabla de P&L no tiene celdas vacías para cuentas que sí existen" },
      { id: 34, text: "La valoración DCF muestra el WACC construido paso a paso" },
      { id: 35, text: "La matriz de sensibilidad se ve alineada y legible" },
      { id: 36, text: "Los riesgos tienen el borde de color correcto (rojo/amarillo/verde)" },
      { id: 37, text: "La firma de Velarix aparece al final de la conclusión" },
      { id: 38, text: "El PDF se descarga con el nombre correcto (Velarix-Empresa-Fecha.pdf)" },
      { id: 39, text: "Sin login: el botón de PDF no existe en el DOM (verificar con inspector)" },
      { id: 40, text: "Los datos en los gráficos de la landing llegan hasta feb/mar 2026" },
    ],
  },
];

export default function QAChecklist() {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const total = 40;
  const done = checked.size;
  const pct = Math.round((done / total) * 100);
  const isReady = done === total;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              {isReady ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              Checklist de Lanzamiento — {done}/{total}
            </span>
            <Badge variant={isReady ? "default" : "secondary"}>
              {isReady ? "✓ LISTO" : `${pct}%`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={pct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {isReady
              ? "Todos los puntos verificados. El sistema está listo para lanzamiento."
              : `Faltan ${total - done} puntos por verificar antes del lanzamiento.`}
          </p>
        </CardContent>
      </Card>

      {/* Sections */}
      {SECTIONS.map(section => {
        const sectionDone = section.items.filter(i => checked.has(i.id)).length;
        return (
          <Card key={section.title} className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </span>
                <Badge variant={sectionDone === section.items.length ? "default" : "outline"} className="text-xs">
                  {sectionDone}/{section.items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.items.map(item => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <Checkbox
                    checked={checked.has(item.id)}
                    onCheckedChange={() => toggle(item.id)}
                    className="mt-0.5"
                  />
                  <span className={`text-sm leading-snug transition-colors ${
                    checked.has(item.id) ? "text-muted-foreground line-through" : "text-foreground"
                  }`}>
                    <span className="text-muted-foreground mr-1.5 font-mono text-xs">{item.id}.</span>
                    {item.text}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
