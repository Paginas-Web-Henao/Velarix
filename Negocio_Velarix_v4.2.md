# Velarix — Definición de Negocio y Plan de Validación

> **Documento maestro de negocio — versión 4.2**
>
> Este documento define qué es Velarix, qué vende, a quién sirve, qué riesgos
> acepta y qué debe validarse antes de construir o modificar funcionalidades.
>
> El código debe respetar este documento, pero **una hipótesis comercial no se
> convierte en verdad por estar escrita aquí**. Cuando una decisión no haya sido
> validada con clientes, expertos o evidencia técnica, debe conservar su estado
> de hipótesis o pendiente.

**Última actualización:** 2026-08-10
**Etapa actual:** precomercial / estabilización y validación
**Operador inicial:** una sola persona (Nicolás), junto con expertos financieros externos
**Capacidad inicial máxima:** 1 proyecto activo de valoración profesional a la vez

---

## 0.0 Nota de versión — reorientación expert-led (2026-08-10)

`✅ Confirmado`

Esta versión (v4.2) reemplaza a `Negocio_Velarix_v4.1.md` como fuente de
verdad vigente, **sin eliminarla** (se conserva por historial — ver
`docs/velarix/README.md` §"Higiene documental").

El cambio central respecto a v4.1: Velarix deja de construirse bajo la
premisa de que una empresa puede valorarse aplicando una metodología
prácticamente uniforme por sector sobre sus estados financieros. La
premisa v4.2 es que **cada empresa debe entenderse individualmente**
antes de construir una valoración — dos empresas del mismo sector, con
operaciones aparentemente similares, incluso controladas por el mismo
propietario, pueden requerir interpretación contable, normalizaciones,
drivers de crecimiento, horizonte, estructura de capital, tratamiento
tributario, método de valoración y supuestos de estado estable distintos.

El detalle completo de esta reorientación, sus razones y sus
consecuencias vive en
`docs/velarix/plan/REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md`. Este
documento (v4.2) incorpora esa reorientación como definición de negocio
vigente; el documento de decisión explica el porqué y el historial.

Todas las secciones de v4.1 que no se mencionan explícitamente abajo como
modificadas permanecen vigentes sin cambios de fondo — v4.2 es una
revisión dirigida, no una reescritura completa.

---

# 0. Sistema de estados del documento

Todas las decisiones relevantes deben llevar uno de estos estados:

| Estado | Significado |
|---|---|
| `✅ Confirmado` | Decisión aceptada por el fundador y coherente con la etapa actual |
| `🧪 Hipótesis` | Supuesto que debe validarse con clientes, pilotos o datos |
| `📊 Validación financiera` | Requiere revisión de un profesional con experiencia en valoración o finanzas |
| `⚖️ Revisión legal` | Requiere revisión jurídica o contractual antes de usarse comercialmente |
| `💻 Confirmado técnicamente` | Verificado directamente contra el código, base de datos o infraestructura |
| `⏸️ Diferido` | No se construye todavía; solo se retoma cuando exista una condición concreta |
| `🚨 Bloqueante` | Impide trabajar con clientes reales o cobrar |

## Regla de autoridad

1. Las decisiones comerciales validadas mandan sobre el código.
2. Las decisiones financieras validadas mandan sobre automatizaciones o narrativas de IA.
3. Las obligaciones de seguridad y cumplimiento mandan sobre conveniencia o velocidad.
4. Una hipótesis no obliga a construir una funcionalidad.
5. Si el código contradice una decisión confirmada, se corrige el código.
6. Si la evidencia contradice este documento, se actualiza primero este documento y luego el código.
7. Claude Code no debe interpretar el texto como autorización automática para implementar.
8. **(Nueva en v4.2)** Ninguna funcionalidad debe permitir que la tecnología decida, sin aprobación humana experta, cómo interpretar una empresa, qué normalización aplicar, qué método de valoración usar o cuál es la conclusión de valor. La tecnología ejecuta; el criterio humano interpreta y aprueba.

---

# 1. Resumen ejecutivo

## 1.1 Qué es Velarix

`✅ Confirmado` — **redefinido en v4.2**

Velarix es una **boutique de valoración empresarial apoyada por
tecnología**, operada por Nicolás junto con expertos financieros, en la
cual la plataforma estructura información, conserva evidencia, detecta
inconsistencias, genera preguntas, documenta normalizaciones, ejecuta
cálculos aprobados y produce entregables — mientras Nicolás y los
expertos financieros interpretan la empresa, aprueban decisiones
materiales y emiten la conclusión de valoración.

El cliente compra análisis, criterio, proceso, valoración, revisión
profesional y entregable. **El cliente no compra acceso autónomo a un
motor de valoración.**

Combina:

- cálculo financiero determinístico, aplicado sobre supuestos ya
  interpretados y aprobados para el caso específico;
- automatización en lectura y organización de información;
- apoyo de inteligencia artificial para análisis, clasificación y
  redacción — nunca para decidir metodología ni emitir valor;
- revisión humana obligatoria en toda decisión material;
- explicación transparente de supuestos;
- acompañamiento adicional cuando el cliente lo contrata.

Velarix no se presenta, en ninguna etapa, como un SaaS de autoservicio
para ejecutar diagnósticos o valoraciones profesionales, ni como un
sistema que determina automáticamente una metodología idéntica por
sector. La plataforma es el **sistema operativo interno de la boutique**:
un espacio controlado para recibir información, ejecutar análisis
aprobados y entregar resultados con revisión experta.

La única excepción pública de autoservicio es el **Estimador gratuito**
descrito en la sección 5.1. Este utiliza pocas variables, no recibe
documentos, no produce una valoración profesional y funciona
exclusivamente como herramienta de entrada comercial.

**Velarix NO debe presentarse internamente como:**

- SaaS de valoración automática;
- herramienta donde el cliente sube un Excel y obtiene su valor;
- sustituto de un analista financiero;
- sistema que determina automáticamente una metodología idéntica por sector;
- IA que decide cuánto vale una empresa sin aprobación humana.

## 1.2 Qué problema resuelve

`🧪 Hipótesis prioritaria`

Muchas PYMES necesitan comprender un rango razonable de valor para enfrentar
situaciones como:

- entrada de un nuevo socio;
- salida de un socio;
- venta parcial o total;
- negociación privada;
- sucesión;
- planeación financiera;
- preparación para conversar con un posible inversionista.

Las alternativas tradicionales pueden resultar costosas, lentas o difíciles de
entender para una PYME. Velarix busca ofrecer un proceso más accesible,
estructurado, rápido y transparente, sin fingir el alcance institucional de una
firma grande.

## 1.3 Propuesta de valor inicial

`✅ Confirmado` — **matizada en v4.2**

> Valoraciones financieras interpretadas caso por caso, con criterio
> experto y apoyo tecnológico, combinando comprensión profunda de cada
> empresa, cálculo reproducible, automatización y revisión humana.

Velarix debe competir inicialmente en:

- claridad;
- agilidad;
- trazabilidad;
- cercanía;
- precio coherente con una boutique independiente;
- explicación comprensible para dueños y socios;
- control de alcance;
- capacidad de mostrar cómo se llegó a cada conclusión;
- **(nuevo en v4.2)** comprensión real de la empresa específica, no una
  aplicación mecánica de fórmulas por sector.

No debe competir todavía afirmando que tiene el mismo rigor institucional,
reputación, independencia o estructura de control de una Big Four.

## 1.4 Etapa real del negocio

`✅ Confirmado`

Velarix se encuentra en etapa **precomercial**.

Todavía debe:

- corregir errores financieros conocidos;
- validar la metodología con un revisor externo;
- construir casos de prueba reproducibles;
- definir contratos y límites;
- comprobar seguridad mínima;
- ejecutar pilotos;
- medir horas reales;
- validar disposición a pagar;
- probar el proceso comercial;
- **(nuevo en v4.2)** construir el Expediente de Valoración (ver §9.5) como
  base operativa de la boutique, antes de reactivar el Bloque 1E de
  integración técnica.

No se considera listo para vender una valoración profesional hasta superar los
bloqueantes definidos en este documento.

---

# 2. Posicionamiento y límites

## 2.1 Posicionamiento aprobado

`✅ Confirmado` — **reforzado en v4.2**

Velarix se posiciona como una boutique independiente de valoración y
análisis financiero para PYMES, **operada por personas con criterio
experto**, con tecnología propia para estructurar información, acelerar
tareas operativas y mejorar la trazabilidad — nunca para sustituir el
juicio profesional.

## 2.2 Posicionamientos no permitidos en esta etapa

`✅ Confirmado`

No debe afirmarse públicamente que Velarix:

- tiene rigor equivalente al de PwC, KPMG, Deloitte o EY;
- reemplaza una auditoría;
- emite una opinión de valor auditada;
- garantiza el precio de venta de una empresa;
- certifica estados financieros;
- asegura que una negociación será exitosa;
- reemplaza asesoría legal, tributaria o contable;
- es una plataforma completamente autónoma;
- permite tomar decisiones sin revisión humana;
- ofrece recomendaciones reguladas de inversión;
- **(nuevo en v4.2)** aplica la misma metodología a cualquier empresa del
  mismo sector sin analizar su caso particular.

## 2.3 Qué no es Velarix

`✅ Confirmado`

Velarix no es inicialmente:

- un marketplace de inversionistas;
- una firma auditora;
- una firma legal;
- una firma contable;
- un banco;
- un fondo;
- un intermediario de valores;
- una plataforma de trading;
- una agencia de corretaje;
- un software contable;
- un sistema ERP;
- un SaaS masivo de autoservicio;
- una herramienta para litigios o peritajes;
- una autoridad que determine un precio único y definitivo;
- **(nuevo en v4.2)** un motor que decide automáticamente cómo valorar una
  empresa a partir únicamente de su sector.

---

# 3. Cliente inicial

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §3 para el
detalle completo (segmento prioritario, perfil operativo, canales,
segmentos diferidos). Estas hipótesis no fueron revisadas por la
reorientación de v4.2.

---

# 4. Casos de uso

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §4.

---

# 5. Catálogo de servicios

## 5.1 Estimador gratuito

`✅ Confirmado`

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §5.1. El
Estimador sigue siendo la única excepción pública de autoservicio,
explícitamente no presentada como valoración profesional.

## 5.2 Diagnóstico de preparación

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §5.2.

## 5.3 Valoración profesional

`✅ Confirmado como servicio objetivo`
`📊 Pendiente de validación metodológica`
`⚖️ Pendiente de contrato`
`🧭 Reencuadrado en v4.2 — ver §9.5 (Expediente de Valoración)`

Debe incluir, según el alcance contratado, todo lo ya definido en
`Negocio_Velarix_v4.1.md` §5.3, más lo que agrega v4.2:

- **comprensión individual de la empresa** antes de aplicar cualquier
  cálculo — no se asume que el sector determina la metodología;
- construcción del **Expediente de Valoración** del caso (empresa,
  cuentas, preguntas, evidencia, normalizaciones, hipótesis, supuestos,
  aprobaciones — ver §9.5);
- selección de método justificada caso por caso, no por defecto sectorial;
- una **conclusión principal de valoración**, con sensibilidad y
  escenarios como herramienta secundaria de análisis (ver §9.6), no como
  tres resultados equivalentes.

La valoración debe tener un precio fijo acordado antes de iniciar.

## 5.4 Acompañamiento adicional

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §5.4.

## 5.5 Regla de independencia entre entregable y horas

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §5.5.

---

# 6. Modelo comercial y precios

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §6 completo
(estructura de cobro, precio inicial, fórmula interna mínima, validación
de precio, política de descuentos). La reorientación de v4.2 no modifica
el modelo comercial ni de precios.

---

# 7. Alcance y exclusiones contractuales

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §7.

---

# 8. Operación inicial

## 8.1 Capacidad

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §8.1.

## 8.2 Roles

`✅ Confirmado` — **ampliado en v4.2**

| Rol | Etapa inicial | Responsabilidad |
|---|---|---|
| Fundador / operador de la boutique (Nicolás) | Activo | Relación con el cliente, recopilación de información, operación del expediente, seguimiento, investigación, análisis, coordinación, preparación de hipótesis, documentación, control del proceso, entregables. Puede desarrollar progresivamente mayor criterio financiero, pero escala a un experto cuando una decisión material lo requiere |
| Cliente responsable | Activo | Entrega información, valida contexto y responde preguntas |
| Experto/revisor financiero externo | Requerido para metodología y primeros casos | No diseña Velarix desde cero — revisa casos concretos, cuestiona hipótesis, corrige errores conceptuales, aprueba decisiones materiales, y ayuda a convertir casos reales en mejores reglas metodológicas (ver §9.7, ciclo propone→critica→aprende→mejora) |
| Abogado externo | Puntual | Revisa contrato, alcance, privacidad y límites |
| Contador externo | Puntual | Revisa facturación, obligaciones y criterios contables |
| Analista adicional | Diferido | Solo cuando exista demanda y proceso repetible |
| Admin independiente | Diferido | Solo cuando el volumen lo justifique |

## 8.3 Principio de revisión

`✅ Confirmado` — **reforzado en v4.2**

La IA nunca aprueba por sí sola un entregable. Ver §9.8 (nuevo papel de
la IA) para el detalle de qué puede y qué no puede hacer.

El consultor debe:

- revisar documentos;
- verificar homologaciones;
- comprender ajustes;
- revisar supuestos;
- validar resultados;
- leer todo el informe;
- aprobar la entrega.

Para los primeros proyectos, además debe existir segunda revisión externa.

---

# 9. Metodología financiera

## 9.1 Principio general

`✅ Confirmado`

La narrativa puede usar IA. Los cálculos deben ser determinísticos,
reproducibles y probados.

## 9.2 Métodos

`📊 Validación financiera` — **matizado en v4.2**

El método no debe elegirse automáticamente sin contexto — **tampoco debe
elegirse automáticamente por sector**, tal como aclara §9.5 y §9.6.

Pueden evaluarse:

- DCF;
- múltiplos de mercado;
- transacciones comparables;
- valor patrimonial ajustado;
- combinación de métodos;
- escenarios.

La elección debe documentarse y ser coherente con:

- etapa de la empresa;
- estabilidad;
- información disponible;
- sector;
- finalidad;
- estructura de ingresos;
- calidad de proyecciones.

## 9.3 Decisiones que requieren juicio

`📊 Validación financiera`

No deben tratarse como simples fórmulas:

- EBITDA normalizado;
- gastos no recurrentes;
- remuneración de socios;
- capital de trabajo;
- deuda financiera;
- caja excedentaria;
- pasivos contingentes;
- tasa de descuento;
- beta;
- prima de riesgo;
- estructura de capital;
- crecimiento terminal;
- comparables;
- descuentos;
- concentración de clientes;
- dependencia del fundador;
- riesgo regulatorio;
- riesgo de liquidez.

## 9.4 Revisor externo

`🚨 Bloqueante antes del primer cliente pagado`

Debe existir una persona con experiencia demostrable en finanzas, valoración,
contabilidad o corporate finance que:

1. revise la metodología base;
2. revise los casos dorados;
3. cuestione los supuestos;
4. revise los primeros proyectos;
5. documente observaciones;
6. no dependa de Claude como fuente metodológica.

## 9.5 Expediente de Valoración — el nuevo cerebro de Velarix

`✅ Confirmado (dirección)` `📊 Validación financiera (contenido de cada expediente)` — **nueva sección en v4.2**

El verdadero cerebro de Velarix no es el motor de cálculo — es el
**Expediente de Valoración** de cada caso: la representación estructurada
de cómo se llegó a comprender esa empresa específica antes de calcular
nada.

El principio de arquitectura conceptual es:

```
DOCUMENTOS Y DATOS
→ COMPRENDER LA EMPRESA
→ COMPRENDER LAS CUENTAS
→ IDENTIFICAR AMBIGÜEDADES
→ GENERAR PREGUNTAS
→ RECIBIR RESPUESTAS Y SOPORTES
→ NORMALIZAR
→ DEFINIR HIPÓTESIS
→ SELECCIONAR MÉTODO
→ APROBAR SUPUESTOS
→ CALCULAR
→ CONTRASTAR
→ REVISIÓN EXPERTA
→ CONCLUSIÓN
→ INFORME
```

Esto reemplaza, como principio rector, la arquitectura anterior
(`ESTADOS FINANCIEROS → FÓRMULAS → VALORACIÓN`), que dejaba demasiado
contexto empresarial sin resolver.

El expediente debe llegar a representar como mínimo:

- **Empresa**: actividad real, productos/servicios, forma de generar
  ingresos, geografía, clientes, proveedores, concentración, contratos,
  capacidad instalada, estructura operacional, dependencia de personas
  clave, etapa de desarrollo, estacionalidad, riesgos relevantes, objetivo
  de la valoración, fecha de valoración.
- **Cuenta**: para cada cuenta material — cuenta original, periodo, valor
  original, descripción, qué contiene realmente, recurrente/no
  recurrente, operativa/no operativa, relación con propietarios, soporte
  disponible, ambigüedades, tratamiento propuesto, tratamiento aprobado.
  No se asume que el nombre contable explica suficientemente la realidad
  económica de la cuenta.
- **Pregunta**: vinculada a empresa, cuenta, documento, inconsistencia,
  supuesto o normalización; conserva razón, materialidad, quién la
  generó, respuesta, soporte, estado, conclusión derivada.
- **Evidencia**: trazabilidad entre una decisión y documento, página,
  cuenta, respuesta, nota, fuente externa, responsable.
- **Normalización**: nunca se sobrescribe silenciosamente un dato
  original — se conserva `VALOR REPORTADO → AJUSTE PROPUESTO → RAZÓN →
  EVIDENCIA → RESPONSABLE → VALOR APROBADO`.
- **Supuesto**: nombre, valor, unidad, método de obtención, fuente,
  fecha, razonamiento, empresa específica, responsable, estado,
  sensibilidad, aprobación.

La especificación técnica de implementación de este expediente (MVP,
entidades, workflow, criterios de aceptación) vive en
`docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md` — este documento de
negocio define el **qué y el porqué**; ese documento técnico define el
**cómo**, sin implementarlo todavía.

## 9.6 Proyecciones, horizonte, crecimiento terminal, WACC y escenarios — principio caso por caso

`📊 Validación financiera` — **nueva sección en v4.2, consolida y reencuadra criterios previamente dispersos**

Ninguno de estos elementos se determina automáticamente por sector. El
sector aporta referencias, benchmarks, comparables, rangos y contexto —
no determina la proyección, el horizonte, la tasa de descuento ni el
crecimiento terminal de una empresa específica.

- **Proyecciones**: los drivers dependen de cada empresa (capacidad
  instalada, contratos, cartera, recurrencia, precios, volumen,
  expansión, inflación, inversión, utilización de capacidad,
  concentración de clientes, estructura de costos, capital de trabajo,
  ciclo económico). Cada hipótesis de proyección debe tener driver,
  razonamiento, evidencia, fórmula aplicada, responsable y aprobación.
- **Horizonte explícito**: no se mantiene "5 años" como verdad
  metodológica universal. La política futura es que el horizonte sea el
  necesario para modelar el periodo durante el cual la empresa todavía
  no ha alcanzado las condiciones de estado estable — con casos de
  referencia entre aproximadamente 3 y 10 años, sin que ese rango se
  convierta en regla rígida. Debe justificarse empresa por empresa. El
  comportamiento técnico actual (5 años fijos en el motor) permanece
  como placeholder provisional hasta que el Expediente de Valoración
  controle este parámetro caso por caso.
- **Crecimiento terminal (g)**: no se mantiene "g = 3% para todas las
  empresas". La g definitiva debe surgir del contexto específico del
  estado estable de cada empresa (moneda, inflación de largo plazo,
  crecimiento real sostenible, mercado/geografía, madurez, reinversión,
  retorno sobre capital), documentada y aprobada caso por caso. El valor
  actual en el motor permanece como placeholder técnico hasta que exista
  la decisión financiera aprobada que lo reemplace.
- **WACC**: no existe un único WACC general aplicable a todas las
  empresas. A futuro, los inputs (moneda, fecha, tasa libre de riesgo,
  ERP, beta, comparables, estructura de capital, costo de deuda, riesgo
  país, ajustes defendibles) deben surgir del expediente específico del
  caso, con fuentes, razonamiento y aprobación documentados. El motor
  actual permanece como herramienta matemática que ejecuta el cálculo,
  no como quien decide los inputs.
- **Escenarios**: Velarix no tendrá como filosofía principal entregar
  pesimista/base/optimista como tres valores equivalentes. La boutique
  busca emitir una **conclusión principal de valoración**, con
  sensibilidad, stress testing, análisis de drivers e incertidumbres
  disponibles internamente, y escenarios cuando realmente sean útiles
  para comprender un riesgo específico. Los multiplicadores actuales del
  motor permanecen únicamente como comportamiento técnico provisional.

**Ninguno de estos comportamientos técnicos provisionales se modifica en
código como consecuencia de esta sección** — son placeholders conocidos,
documentados, hasta que un caso concreto y una decisión metodológica
defendible los reemplacen.

## 9.6.1 Impuestos

`📊 Validación financiera`

No se asume que una diferencia entre lo reportado y lo recalculado
implica evasión, fraude o manipulación. Se distingue expresamente entre
elusión (puede ser legal), evasión (ilegal), diferencia contable/fiscal, y
tratamiento todavía no conciliado. El proceso futuro debe intentar
conocer impuestos relevantes, periodo, impuesto corriente/diferido,
bases, tratamientos especiales, pérdidas fiscales, diferencias
permanentes/temporales, explicación del cliente y soportes. Es válido
conservar lo reportado, recalcular una referencia, comparar, preguntar,
reconciliar o normalizar si corresponde — nunca asumir la causa de una
diferencia sin contexto.

## 9.6.2 Patrimonio negativo

`📊 Validación financiera`

Se mantiene el signo real del patrimonio. Patrimonio negativo es una
condición que requiere comprender su causa (pérdidas acumuladas,
distribuciones, recompras, reorganizaciones, ajustes contables,
estructura de financiación, u otras razones legítimas) — no se asume
automáticamente que implica mal negocio o irregularidad. Dependiendo de
la causa pueden cambiar la interpretación de ROE, la estructura de
capital, el WACC, el método o la necesidad de revisión. La inconsistencia
técnica conocida entre el motor servidor (que aplica valor absoluto al
patrimonio antes de calcular, ocultando su signo negativo) y el motor
cliente (que sí conserva el signo) permanece documentada y sin corregir
en código — su corrección debe surgir de un caso concreto y una decisión
metodológica defendible, no de esta reorientación de negocio.

## 9.7 Rol del experto financiero

`✅ Confirmado` — **nueva sección en v4.2**

El experto no diseña Velarix desde cero — Velarix debe avanzar
independientemente. El experto se utiliza para revisar casos concretos,
cuestionar hipótesis, corregir errores conceptuales, aprobar decisiones
materiales, y ayudar a convertir casos reales en mejores reglas
metodológicas. El ciclo esperado es:

```
VELARIX PROPONE Y DOCUMENTA → EXPERTO CRITICA → VELARIX APRENDE → REGLA MEJORA
```

No: `EXPERTO DISEÑA TODO → VELARIX ESPERA`.

## 9.8 IA — nuevo papel

`✅ Confirmado` — **nueva sección en v4.2**

La IA no será el valuador. Inicialmente es un asistente de análisis.

Puede ayudar a: leer documentos, extraer información, clasificar
cuentas, detectar inconsistencias, identificar información faltante,
comparar periodos, encontrar cambios anormales, proponer preguntas,
proponer posibles clasificaciones, resumir respuestas, preparar
reconciliaciones, generar borradores, recuperar decisiones anteriores
similares.

La IA no debe: aprobar normalizaciones materiales, elegir silenciosamente
un método, inventar contexto empresarial, aprobar WACC, aprobar valor
terminal, aprobar horizonte, concluir que existe fraude/evasión, ni
emitir autónomamente el valor final.

En una evolución futura podrá mejorar utilizando el historial de casos
revisados y aprobados. No se entrenan modelos propios en esta etapa.

## 9.9 Modelo operativo elegido

`✅ Confirmado` — **nueva sección en v4.2**

El modelo inicial: Nicolás y los expertos comprenden la empresa y
aprueban los datos/supuestos necesarios; la plataforma estructura y
automatiza el resto. La arquitectura debe construirse desde el inicio
para evolucionar hacia una IA que comprenda progresivamente más
información, proponga preguntas específicas y ayude a construir el
expediente — sin que esa evolución elimine la aprobación experta. La
opción manual completa permanece como fallback para casos que no puedan
estructurarse suficientemente.

---

# 10. Calidad y trazabilidad

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §10 completo.
El Expediente de Valoración (§9.5) es coherente con y refuerza estos
mismos requisitos de trazabilidad, no los reemplaza.

---

# 11. Flujos de trabajo

Sin cambios respecto a v4.1 en el flujo de Estimador gratuito y
Acompañamiento adicional — ver `Negocio_Velarix_v4.1.md` §11.1 y §11.4.

## 11.3 Valoración profesional — actualizado en v4.2

El flujo de v4.1 §11.3 permanece vigente, con la construcción del
Expediente de Valoración (§9.5) integrada explícitamente entre "mapping"
y "cálculo determinístico":

```text
Precalificación
→ propuesta
→ NDA y contrato
→ anticipo
→ onboarding
→ carga de documentos
→ validación
→ parseo
→ mapping
→ revisión manual de mapping
→ construcción del Expediente de Valoración (comprensión de la empresa,
  preguntas, respuestas, evidencia, normalizaciones, hipótesis, supuestos)
→ structured input
→ cálculo determinístico
→ revisión de supuestos
→ narrativa asistida por IA
→ revisión humana completa
→ revisión externa
→ control de calidad
→ informe
→ reunión
→ corrección incluida
→ cierre
```

---

# 12. Seguridad, datos y proveedores

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §12 completo.
La reorientación de v4.2 no modifica ninguna decisión de seguridad,
retención o eliminación de datos.

---

# 13. Arquitectura de producto

## 13.1 Principio

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §13.1.

## 13.2 Componentes existentes

`💻 Confirmado parcialmente` — **reencuadrado en v4.2**

Todos los componentes listados en `Negocio_Velarix_v4.1.md` §13.2 se
conservan como activos válidos. El motor financiero determinístico no se
elimina — **cambia su papel**: deja de ser "el cerebro que decide cómo
valorar" y pasa a ser "un motor determinístico que ejecuta matemáticas
sobre inputs y supuestos que previamente fueron interpretados,
contextualizados y aprobados" a través del Expediente de Valoración
(§9.5).

También se conservan como activos válidos: pipeline de documentos,
parsing, mapeo de cuentas, validaciones, structured input, cálculos DCF,
funciones de análisis, trazabilidad, auditoría, seguridad, aislamiento
entre clientes, casos de prueba, infraestructura Supabase, autenticación,
frontend existente, generación de narrativa, generación de PDF, y todas
las decisiones de seguridad ya cerradas (Bloque 1D).

## 13.3 Componentes diferidos

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §13.3.

## 13.3.1 Biblioteca de casos de valoración (nueva línea de trabajo — diferida)

`⏸️ Diferido` — **nueva subsección en v4.2**

Se registra como nueva línea de trabajo metodológica una futura
"Biblioteca de casos de valoración": usar empresas con información
pública para probar el workflow del Expediente de Valoración, practicar
normalización, identificar preguntas, descubrir excepciones, comparar
tratamientos, mejorar reglas y preparar dudas concretas para expertos.
No se usará para concluir que empresas del mismo sector deben valorarse
igual — sería exactamente la premisa que esta reorientación descarta. No
se implementa todavía ingestión automática de estos casos; queda
registrada como iniciativa en `docs/velarix/plan/BACKLOG-CLASIFICADO.md`
y `docs/velarix/plan/ROADMAP.md`.

## 13.4 Registro manual inicial

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §13.4.

## 13.5 Refactors

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §13.5.

---

# 14. Riesgos técnicos conocidos

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §14 completo.
Ninguno de estos riesgos técnicos se corrige como consecuencia de esta
reorientación de negocio.

---

# 15. Ventas y confianza

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §15 completo.

---

# 16. Validación del negocio

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §16 completo.

---

# 17. Criterios para cobrar

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §17 completo.
Se añade, como parte de "cada cifra material es trazable" (§17.2), que
esa trazabilidad debe incluir el Expediente de Valoración del caso, no
solo la cadena documento→cifra ya exigida.

---

# 18. Plan de trabajo por fases

> No se avanza de fase solo porque el código compile. Cada fase tiene condiciones
> de entrada, entregables, pruebas y criterios de salida.

Las Fases 0 a 8 descritas en `Negocio_Velarix_v4.1.md` §18 permanecen
vigentes sin cambios de fondo. **v4.2 agrega** que, dentro de la Fase 1
(exactitud financiera), el **Bloque 1E (integración y activación)** no
se reactiva hasta que exista una primera versión operativa del
**Expediente de Valoración** (ver §9.5 y
`docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`) — conectar
narrativa y PDF a un motor que sigue sin capturar el contexto específico
de cada empresa repetiría exactamente el problema que esta reorientación
busca corregir. El detalle de qué queda reordenado dentro de la Fase 1 se
documenta en `docs/velarix/fases/FASE-01-EXACTITUD-FINANCIERA.md` y
`docs/velarix/plan/MATRIZ-DE-DEPENDENCIAS.md`, no se repite aquí.

---

# 19. Reglas para Claude Code

`✅ Confirmado`

Cuando Claude Code reciba este archivo:

1. Debe leerlo completo.
2. No debe modificar código solo por haberlo leído.
3. Debe diferenciar hechos, hipótesis y pendientes.
4. No debe construir funciones diferidas.
5. No debe crear SaaS, suscripciones o pagos sin autorización.
6. No debe realizar refactors masivos no solicitados.
7. Debe verificar el repositorio antes de afirmar que algo existe.
8. Debe citar archivos, funciones y líneas en sus auditorías.
9. Debe escribir resultados directamente en archivos `.md`.
10. Debe respetar ubicaciones y nombres definidos en el prompt técnico.
11. Debe separar auditoría de implementación.
12. Debe implementar una fase a la vez.
13. Debe ejecutar pruebas.
14. Debe documentar evidencia.
15. Debe detenerse al completar el alcance autorizado.
16. No debe ocultar errores para declarar una fase terminada.
17. No debe inventar validaciones legales o financieras.
18. Debe marcar lo que requiere revisión humana.
19. **(Nueva en v4.2)** No debe implementar el Expediente de Valoración V1
    (§9.5) sin una autorización explícita y separada, aunque la
    especificación técnica ya exista en
    `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`.
20. **(Nueva en v4.2)** No debe presentar ninguna metodología, supuesto o
    cálculo como aplicable uniformemente "por sector" — debe marcar
    explícitamente cuándo un valor es un placeholder técnico provisional
    pendiente del análisis específico de un caso.

## Regla de detención

Claude Code debe detenerse cuando:

- falte una decisión crítica;
- una migración sea destructiva;
- exista riesgo de pérdida de datos;
- el resultado financiero esperado no esté definido;
- una prueba falle;
- el código contradiga una decisión confirmada;
- el alcance requiera otra fase;
- exista una duda legal o metodológica que no pueda resolver con código.

---

# 20. Decisiones confirmadas

- Velarix es una **boutique de valoración empresarial expert-led**,
  apoyada por tecnología — la plataforma es su sistema operativo interno,
  no un producto de autoservicio (v4.2).
- Cada empresa debe entenderse individualmente antes de construir una
  valoración — el sector aporta contexto, no determina la metodología (v4.2).
- El servicio principal no es autoservicio.
- La valoración profesional requiere revisión humana.
- La valoración se cobra a precio fijo.
- El acompañamiento adicional se cobra por bolsa de horas.
- El estimador gratuito sirve como gancho comercial.
- El Diagnóstico no debe presentarse como valoración completa.
- El crecimiento inicial será lento.
- Se operará un proyecto profesional a la vez.
- La exactitud financiera precede a la venta.
- La seguridad precede a datos reales.
- Los primeros casos requieren revisión externa.
- Las automatizaciones comerciales se difieren.
- Claude no implementa sin un plan autorizado.
- Las decisiones no validadas siguen siendo hipótesis.
- El motor financiero determinístico se conserva, pero ejecuta sobre
  supuestos ya interpretados y aprobados caso por caso — no decide la
  metodología (v4.2).
- La IA es asistente de análisis, nunca valuadora ni aprobadora de
  decisiones materiales (v4.2).
- El Bloque 1E no se reactiva sin una primera versión operativa del
  Expediente de Valoración (v4.2).

---

# 21. Hipótesis pendientes

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §21.

---

# 22. Pendientes de validación financiera

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §22. La
reorientación de v4.2 no resuelve ninguno de estos pendientes; los
reencuadra dentro del principio de "caso por caso" (§9.6).

---

# 23. Pendientes legales y contractuales

Sin cambios respecto a v4.1 — ver `Negocio_Velarix_v4.1.md` §23.

---

# 24. Estado actual

## Estado estratégico

`✅ Documento reorientado (v4.2)`

La dirección del negocio cambió de "metodología uniforme por sector" a
"boutique expert-led con expediente de valoración por caso". Varias
decisiones comerciales siguen abiertas y deben validarse (§21, §22, §23).

## Estado técnico

`💻 Pendiente de auditoría`

No se asume que el repositorio implementa correctamente este documento.
El motor financiero existente permanece como herramienta matemática
válida, pendiente de integrarse al Expediente de Valoración.

## Estado comercial

`🚨 No listo para venta profesional`

Puede prepararse para pilotos después de resolver exactitud, revisión
externa, seguridad mínima, y una primera versión operativa del
Expediente de Valoración.

## Siguiente paso

Implementar el **Expediente de Valoración V1** según la especificación de
`docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`, sin reabrir el debate
de modelo de negocio que ya quedó resuelto en esta versión y en
`docs/velarix/plan/REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md`.
