# Velarix — Definición de Negocio y Plan de Validación

> **Documento maestro de negocio — versión 4**
>
> Este documento define qué es Velarix, qué vende, a quién sirve, qué riesgos
> acepta y qué debe validarse antes de construir o modificar funcionalidades.
>
> El código debe respetar este documento, pero **una hipótesis comercial no se
> convierte en verdad por estar escrita aquí**. Cuando una decisión no haya sido
> validada con clientes, expertos o evidencia técnica, debe conservar su estado
> de hipótesis o pendiente.

**Última actualización:** 2026-07-22  
**Etapa actual:** precomercial / estabilización y validación  
**Operador inicial:** una sola persona  
**Capacidad inicial máxima:** 1 proyecto activo de valoración profesional a la vez

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

---

# 1. Resumen ejecutivo

## 1.1 Qué es Velarix

`✅ Confirmado`

Velarix es una **boutique de valoración y análisis financiero para PYMES
colombianas, apoyada por tecnología propia**.

Combina:

- cálculo financiero determinístico;
- automatización en lectura y organización de información;
- apoyo de inteligencia artificial para clasificación y redacción;
- revisión humana;
- explicación transparente de supuestos;
- acompañamiento adicional cuando el cliente lo contrata.

Velarix no se presenta inicialmente como SaaS de autoservicio. La plataforma es,
en la primera etapa, una herramienta interna y un espacio controlado para
recibir información, ejecutar análisis y entregar resultados.

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

`✅ Confirmado`

> Valoraciones financieras estructuradas y transparentes para PYMES,
> combinando cálculo reproducible, automatización y revisión humana.

Velarix debe competir inicialmente en:

- claridad;
- agilidad;
- trazabilidad;
- cercanía;
- precio coherente con una boutique independiente;
- explicación comprensible para dueños y socios;
- control de alcance;
- capacidad de mostrar cómo se llegó a cada conclusión.

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
- probar el proceso comercial.

No se considera listo para vender una valoración profesional hasta superar los
bloqueantes definidos en este documento.

---

# 2. Posicionamiento y límites

## 2.1 Posicionamiento aprobado

`✅ Confirmado`

Velarix se posiciona como una boutique independiente de valoración y análisis
financiero para PYMES, con tecnología propia para acelerar tareas operativas y
mejorar la trazabilidad.

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
- ofrece recomendaciones reguladas de inversión.

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
- una autoridad que determine un precio único y definitivo.

---

# 3. Cliente inicial

## 3.1 Segmento prioritario

`🧪 Hipótesis prioritaria`

El cliente inicial será:

> PYME colombiana privada, administrada por sus propietarios o socios, que
> necesita una valoración para una negociación entre socios, entrada o salida
> de un socio, venta parcial o planeación de una transacción privada.

## 3.2 Perfil operativo sugerido

`🧪 Hipótesis`

Inicialmente se priorizan empresas que:

- tengan al menos dos o tres años de información financiera;
- cuenten con estados financieros organizados;
- no operen en sectores altamente regulados;
- tengan una estructura societaria comprensible;
- no requieran valoración de múltiples subsidiarias;
- no estén en litigio por el valor;
- no busquen usar el informe como peritaje judicial;
- acepten que la valoración es una estimación profesional;
- tengan un interlocutor responsable disponible.

## 3.3 Canales iniciales

`🧪 Hipótesis`

Los canales prioritarios serán:

- contadores independientes;
- pequeñas firmas contables;
- CFOs externos o fraccionales;
- abogados corporativos que no presten valoración;
- referencias personales;
- empresarios conocidos;
- profesores o redes universitarias;
- alianzas con consultores de PYMES.

El contador o asesor puede funcionar como canal de confianza. La empresa sigue
siendo el cliente final salvo que exista un contrato B2B diferente.

## 3.4 Segmentos diferidos

`⏸️ Diferido`

No se priorizan inicialmente:

- fondos de inversión;
- banca de inversión;
- compañías públicas;
- conglomerados;
- entidades financieras;
- aseguradoras;
- startups sin información histórica suficiente;
- compañías con múltiples países;
- valoraciones para litigios;
- valoraciones fiscales;
- fairness opinions;
- transacciones sometidas a regulación especializada.

---

# 4. Casos de uso

## 4.1 Casos permitidos inicialmente

`🧪 Hipótesis prioritaria`

Velarix se enfocará inicialmente en máximo dos casos de uso:

1. Entrada, salida o negociación entre socios.
2. Venta parcial o total de una PYME privada.

Estos casos deben validarse mediante entrevistas y pilotos antes de ampliar el
catálogo.

## 4.2 Casos secundarios

`⏸️ Diferido`

Después de obtener experiencia pueden evaluarse:

- sucesión empresarial;
- preparación para levantar capital privado;
- planeación interna;
- evaluación de escenarios;
- valoración periódica para seguimiento estratégico.

## 4.3 Casos excluidos

`✅ Confirmado`

Velarix no aceptará inicialmente encargos destinados principalmente a:

- procesos judiciales;
- arbitrajes;
- disputas tributarias;
- certificaciones oficiales;
- valoraciones regulatorias;
- mercado público de valores;
- insolvencia compleja;
- reestructuraciones con múltiples acreedores;
- instrumentos financieros complejos;
- propiedad intelectual aislada;
- activos mineros, petroleros o biológicos especializados;
- entidades financieras reguladas;
- recomendaciones de compra o venta de valores.

---

# 5. Catálogo de servicios

## 5.1 Estimador gratuito

`✅ Confirmado`

Objetivo: abrir una conversación comercial.

Características:

- no requiere login;
- no permite subir documentos;
- usa pocas variables;
- entrega un rango aproximado;
- explica que no es una valoración;
- no genera PDF profesional;
- no guarda información financiera sensible salvo consentimiento;
- muestra el método de forma resumida;
- invita a agendar una conversación.

Entradas sugeridas:

- sector;
- ventas aproximadas;
- EBITDA aproximado;
- crecimiento;
- país o moneda;
- motivo de la consulta.

Salida permitida:

- rango indicativo;
- múltiplo de referencia;
- advertencias;
- explicación sencilla;
- CTA para hablar con Velarix.

## 5.2 Diagnóstico de preparación

`🧪 Hipótesis`

Objetivo: determinar si la empresa tiene información suficiente y cuáles son
los principales ajustes antes de contratar una valoración profesional.

Puede incluir:

- revisión de documentos;
- evaluación de calidad de datos;
- detección de inconsistencias;
- EBITDA preliminar;
- lista de ajustes potenciales;
- información faltante;
- rango estrictamente indicativo;
- recomendaciones para preparar la valoración.

No debe incluir:

- opinión profesional final de valor;
- PDF presentado como valoración completa;
- acompañamiento de negociación;
- recomendaciones de inversión;
- uso como peritaje;
- lenguaje que sugiera certificación.

La revisión humana sigue siendo obligatoria antes de entregar.

## 5.3 Valoración profesional

`✅ Confirmado como servicio objetivo`
`📊 Pendiente de validación metodológica`
`⚖️ Pendiente de contrato`

Debe incluir, según el alcance contratado:

- reunión inicial;
- lista de documentos;
- análisis de calidad;
- normalización de información;
- homologación de cuentas;
- modelo financiero;
- DCF cuando corresponda;
- análisis de supuestos;
- valor terminal;
- sensibilidades;
- benchmark sectorial;
- explicación de metodología;
- trazabilidad;
- revisión humana completa;
- informe final;
- reunión de presentación;
- una ronda de correcciones dentro del alcance.

La valoración debe tener un precio fijo acordado antes de iniciar.

## 5.4 Acompañamiento adicional

`✅ Confirmado`

Se contrata por bolsa de horas prepagada o retainer separado.

Puede cubrir:

- preparación de reuniones;
- explicación a otros socios;
- escenarios adicionales;
- ajustes por nueva información;
- presentación ante terceros;
- apoyo analítico durante una negociación;
- reuniones posteriores a la entrega.

No se incluye ilimitadamente en el precio base.

## 5.5 Regla de independencia entre entregable y horas

`✅ Confirmado`

La valoración profesional tiene un precio fijo.

El acompañamiento posterior se cobra por horas prepagadas.

No debe usarse un retainer abierto para ocultar el costo final del entregable
principal.

---

# 6. Modelo comercial y precios

## 6.1 Estructura de cobro

`✅ Confirmado`

### Valoración profesional

- precio fijo;
- anticipo inicial;
- saldo contra avance o entrega;
- alcance escrito;
- límite de documentos;
- límite de entidades;
- límite de años;
- una ronda de ajustes;
- fecha estimada condicionada a recibir información completa.

### Acompañamiento adicional

- bolsa de horas prepagada;
- tarifa acordada;
- registro de tiempo;
- saldo visible;
- recarga antes de continuar;
- sin trabajo a crédito salvo decisión explícita.

## 6.2 Precio inicial

`🧪 Hipótesis`

No existe todavía un precio final validado.

Los valores previos de $1.500.000 a $3.000.000 COP no deben considerarse una
decisión confirmada.

Antes de fijar precio deben medirse:

- horas de preparación;
- horas de análisis;
- horas de revisión;
- reuniones;
- correcciones;
- revisión externa;
- herramientas;
- impuestos;
- administración;
- adquisición del cliente;
- riesgo;
- margen.

## 6.3 Fórmula interna mínima

`✅ Confirmado`

El precio mínimo interno debe estimarse así:

```text
Precio mínimo =
(horas estimadas × tarifa interna mínima)
+ costo de revisión externa
+ herramientas y proveedores
+ costos administrativos
+ contingencia por correcciones
+ margen objetivo
```

La tarifa interna debe incluir tiempo no facturable y riesgo profesional.

## 6.4 Validación de precio

`🧪 Hipótesis`

Antes de publicar precios rígidos se deben realizar:

- mínimo 10 entrevistas con clientes o canales;
- mínimo 3 conversaciones explícitas de precio;
- mínimo 2 pilotos medidos;
- una comparación básica de alternativas;
- cálculo de margen real;
- registro de objeciones;
- definición de descuento máximo.

## 6.5 Política de descuentos

`🧪 Hipótesis`

Los primeros pilotos pueden tener descuento a cambio de:

- acceso a información suficiente;
- disponibilidad para entrevistas;
- autorización para usar resultados anonimizados;
- testimonio;
- retroalimentación;
- medición completa del proceso.

El descuento debe mostrarse sobre un precio de referencia y no convertir el
trabajo en gratuito sin una razón estratégica.

---

# 7. Alcance y exclusiones contractuales

## 7.1 Alcance obligatorio

`⚖️ Revisión legal`

Cada propuesta debe indicar:

- entidad valorada;
- fecha de valoración;
- finalidad;
- metodología;
- documentos esperados;
- años incluidos;
- número de escenarios;
- entregables;
- reuniones;
- correcciones;
- cronograma;
- precio;
- forma de pago;
- responsables;
- uso permitido;
- exclusiones;
- tratamiento de información;
- causales de suspensión.

## 7.2 Exclusiones mínimas

`⚖️ Revisión legal`

El contrato debe aclarar que Velarix no:

- audita estados financieros;
- certifica información entregada por el cliente;
- garantiza un precio de transacción;
- garantiza acceso a crédito o inversión;
- ofrece asesoría tributaria;
- ofrece asesoría legal;
- realiza intermediación;
- capta recursos;
- coloca valores;
- representa a las partes;
- detecta necesariamente fraude;
- reemplaza una due diligence integral;
- asume responsabilidad por información falsa u omitida.

## 7.3 Uso del informe

`⚖️ Revisión legal`

Debe definirse:

- quién puede usarlo;
- para qué finalidad;
- si puede compartirse;
- si puede citarse parcialmente;
- fecha de vigencia;
- condiciones para actualizarlo;
- prohibición de editarlo;
- advertencia sobre nueva información;
- dependencia de supuestos.

---

# 8. Operación inicial

## 8.1 Capacidad

`✅ Confirmado`

Mientras Velarix sea operado por una sola persona:

- máximo un proyecto profesional activo a la vez;
- máximo uno o dos proyectos al mes;
- los diagnósticos se limitan según carga;
- no se prometen tiempos imposibles;
- no se acepta un proyecto sin disponibilidad de revisión;
- los estudios y obligaciones personales forman parte de la capacidad real.

## 8.2 Roles

| Rol | Etapa inicial | Responsabilidad |
|---|---|---|
| Fundador / consultor | Activo | Venta, análisis, revisión, comunicación, entrega y administración |
| Cliente responsable | Activo | Entrega información, valida contexto y responde preguntas |
| Revisor financiero externo | Requerido para metodología y primeros casos | Revisa supuestos, modelo y consistencia |
| Abogado externo | Puntual | Revisa contrato, alcance, privacidad y límites |
| Contador externo | Puntual | Revisa facturación, obligaciones y criterios contables |
| Analista adicional | Diferido | Solo cuando exista demanda y proceso repetible |
| Admin independiente | Diferido | Solo cuando el volumen lo justifique |

## 8.3 Principio de revisión

`✅ Confirmado`

La IA nunca aprueba por sí sola un entregable.

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

`📊 Validación financiera`

El método no debe elegirse automáticamente sin contexto.

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

---

# 10. Calidad y trazabilidad

## 10.1 Riesgo principal

`✅ Confirmado`

El mayor riesgo no es una caída del sitio. Es entregar un resultado convincente
pero equivocado.

## 10.2 Controles obligatorios

`🚨 Bloqueante`

Antes de cobrar deben existir:

- casos dorados;
- resultados esperados documentados;
- comparación contra Excel independiente;
- conciliación de balance;
- reconciliación de EBITDA;
- sumatoria correcta de subcuentas;
- control de moneda;
- control de unidades;
- control de signos;
- trazabilidad de cada resultado;
- validación de supuestos;
- pruebas de regresión;
- versionado de fórmulas;
- versionado de fuentes;
- revisión manual de mappings;
- advertencias por datos faltantes;
- aprobación humana;
- registro de cambios.

## 10.3 Trazabilidad mínima

`✅ Confirmado`

Cada cifra material del informe debe poder conectarse con:

1. documento original;
2. hoja o sección;
3. cuenta o fila;
4. mapping aplicado;
5. ajuste realizado;
6. fórmula usada;
7. supuesto;
8. resultado;
9. versión del modelo;
10. persona que aprobó.

## 10.4 Casos dorados

`🚨 Bloqueante`

Debe existir un conjunto de archivos de prueba con:

- datos conocidos;
- resultado esperado;
- mappings esperados;
- advertencias esperadas;
- DCF esperado;
- sensibilidades esperadas;
- PDF esperado;
- pruebas automatizadas;
- comparación documentada.

Un cambio en código no se aprueba si altera los resultados sin una explicación y
validación.

---

# 11. Flujos de trabajo

## 11.1 Estimador gratuito

```text
Visitante
→ completa formulario corto
→ cálculo local o servicio no sensible
→ recibe rango aproximado
→ ve advertencias
→ CTA para conversación
```

## 11.2 Diagnóstico de preparación

```text
Cliente acepta alcance
→ firma documentos necesarios
→ entrega archivos
→ validación de seguridad
→ parseo
→ mapping
→ validación
→ revisión humana
→ identificación de faltantes y ajustes
→ informe de diagnóstico
→ conversación de cierre
```

## 11.3 Valoración profesional

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

## 11.4 Acompañamiento adicional

```text
Cliente compra bolsa de horas
→ se define objetivo
→ se verifica que el caso esté revisado
→ se registra cada actividad
→ se descuenta saldo
→ se informa saldo
→ se pausa al agotarse
```

---

# 12. Seguridad, datos y proveedores

## 12.1 Regla temporal

`🚨 Bloqueante`

La seguridad mínima y los documentos contractuales deben existir **antes** del
primer cliente real. No se dejan para una fase posterior a la comercialización.

## 12.2 Controles mínimos

`🚨 Bloqueante`

- autenticación;
- autorización;
- RLS;
- acceso por mínimo privilegio;
- separación por cliente;
- almacenamiento privado;
- secretos fuera del frontend;
- auditoría de descargas;
- auditoría de acciones;
- cifrado en tránsito;
- copias de seguridad;
- procedimiento de eliminación;
- cierre de acceso;
- inventario de proveedores;
- protocolo de incidente;
- política de retención;
- revisión de logs;
- eliminación de datos de prueba reales.

## 12.3 Uso de inteligencia artificial

`⚖️ Revisión legal`
`💻 Pendiente de auditoría`

Antes de enviar información a un proveedor de IA se debe:

- entender la política aplicable;
- documentar qué datos se envían;
- minimizar datos;
- eliminar identificadores innecesarios;
- evitar enviar archivos completos cuando no sea necesario;
- informar al cliente;
- definir retención;
- evitar secretos o datos irrelevantes;
- registrar la operación;
- evaluar alternativas locales para información crítica.

## 12.4 Datos personales y empresariales

`⚖️ Revisión legal`

No se harán afirmaciones categóricas sin asesoría.

Los documentos empresariales pueden contener:

- datos de representantes;
- firmas;
- identificaciones;
- salarios;
- información de empleados;
- socios;
- cuentas;
- datos bancarios;
- información comercial reservada.

Velarix debe tratar toda información del cliente como confidencial y aplicar la
normativa que corresponda según la naturaleza real de los datos.

## 12.5 Eliminación

`🚨 Bloqueante`

Debe existir un procedimiento real para:

- solicitar eliminación;
- verificar identidad;
- eliminar documentos;
- eliminar derivados;
- conservar únicamente lo exigido;
- registrar la acción;
- informar excepciones;
- revocar accesos.

---

# 13. Arquitectura de producto

## 13.1 Principio

`✅ Confirmado`

La arquitectura se construye para soportar el servicio, no para simular escala
antes de tener demanda.

## 13.2 Componentes existentes

`💻 Confirmado parcialmente`

Tablas existentes reportadas:

- user_profiles;
- analyses;
- documents;
- parsed_documents;
- account_mappings;
- validation_results;
- structured_inputs;
- calculation_results;
- narrative_reports;
- generated_reports;
- manual_reviews;
- analysis_jobs;
- audit_events;
- data_sources;
- snapshot_updates;
- update_jobs_log.

La existencia, uso y calidad de cada tabla debe verificarse contra el repositorio
y la base de datos antes de planificar migraciones.

## 13.3 Componentes diferidos

`⏸️ Diferido`

No construir todavía, salvo necesidad demostrada:

- sistema completo de retainers;
- time entries avanzados;
- pagos automáticos;
- múltiples analistas;
- asignación inteligente;
- dashboards de operación complejos;
- suscripciones;
- planes;
- facturación automática;
- autoservicio total;
- marketplace;
- aplicación móvil.

## 13.4 Registro manual inicial

`✅ Confirmado`

Durante pilotos y primeros casos se puede usar una hoja controlada para:

- horas;
- pagos;
- documentos;
- revisiones;
- actividades;
- pendientes;
- decisiones;
- incidencias.

Se automatiza solo cuando el proceso manual haya sido validado.

## 13.5 Refactors

`✅ Confirmado`

No se realizará una reorganización masiva del repositorio solo por estética.

Un refactor debe justificar:

- problema concreto;
- riesgo actual;
- beneficio;
- alcance;
- pruebas;
- plan de reversión.

La prioridad es corregir cálculos, trazabilidad, seguridad y pruebas.

---

# 14. Riesgos técnicos conocidos

## 14.1 Consolidación de subcuentas

`🚨 Bloqueante`
`💻 Causa raíz reportada`

`getAccountValue` usaría `.find()` y tomaría la primera coincidencia, en lugar de
sumar todas las filas asociadas a una cuenta canónica.

Impacto potencial:

- EBITDA;
- gastos;
- caja;
- CDT;
- otras cuentas compuestas.

Debe verificarse y corregirse con pruebas.

## 14.2 Moneda en PDF

`🚨 Bloqueante`
`💻 Reportado`

El PDF no respetaría correctamente la moneda seleccionada y podría mostrar USD
de forma fija.

Debe existir una función central de formato de moneda y pruebas por moneda.

## 14.3 Constantes duplicadas

`🚨 Bloqueante si afectan resultados`
`💻 Reportado`

TRM y otras constantes podrían estar duplicadas entre frontend y Edge Functions.

Debe existir una fuente controlada, versionada y trazable.

## 14.4 Otros errores

`💻 Pendiente de verificación`

- ROE;
- ROA;
- temporizador;
- paginación doble;
- otros bugs identificados en conversaciones anteriores.

No deben tratarse como confirmados hasta verificarlos contra el código.

---

# 15. Ventas y confianza

## 15.1 Activos comerciales mínimos

`🚨 Bloqueante antes del lanzamiento comercial`

- descripción clara del servicio;
- muestra anonimizada;
- explicación de metodología;
- formulario de precalificación;
- presentación corta;
- propuesta comercial;
- NDA;
- contrato;
- checklist de documentos;
- cronograma;
- política de correcciones;
- preguntas frecuentes;
- perfil del fundador;
- información del revisor externo;
- proceso de seguridad;
- casos o pilotos;
- canal de contacto.

## 15.2 Proceso comercial inicial

```text
Referencia o lead
→ precalificación
→ conversación de descubrimiento
→ evaluación de caso permitido
→ explicación de límites
→ propuesta
→ NDA
→ contrato
→ anticipo
→ onboarding
```

## 15.3 Preguntas de precalificación

- ¿Por qué necesita la valoración?
- ¿Quién usará el informe?
- ¿Existe una negociación activa?
- ¿Cuántas entidades hay?
- ¿Cuántos años de información existen?
- ¿Los estados están organizados?
- ¿Hay litigios?
- ¿Hay socios en desacuerdo?
- ¿Existen proyecciones?
- ¿Cuál es el plazo?
- ¿Qué decisión se tomará?
- ¿Qué nivel de acompañamiento necesita?

## 15.4 Criterios para rechazar un proyecto

`✅ Confirmado`

Se rechaza o remite un proyecto cuando:

- excede la competencia actual;
- exige certificación;
- tiene finalidad judicial;
- requiere una opinión regulada;
- no hay información suficiente;
- el cliente busca un número predeterminado;
- solicita manipular supuestos;
- no acepta límites;
- no acepta contrato;
- no paga anticipo;
- hay conflicto de interés;
- no existe capacidad;
- presenta riesgo reputacional inaceptable.

---

# 16. Validación del negocio

## 16.1 Entrevistas

`🧪 Hipótesis`

Antes de escalar se realizarán conversaciones con:

- dueños de PYMES;
- contadores;
- CFOs;
- abogados corporativos;
- compradores;
- posibles revisores.

Objetivos:

- validar dolor;
- lenguaje;
- confianza;
- precio;
- objeciones;
- documentos;
- proceso;
- tiempos;
- necesidad de acompañamiento.

## 16.2 Pilotos

`🚨 Bloqueante antes del primer cliente regular`

Mínimo recomendado:

- 2 pilotos controlados;
- 1 caso dorado interno;
- 1 comparación externa;
- medición completa de horas;
- revisión financiera externa;
- retroalimentación del usuario;
- registro de errores;
- revisión de seguridad.

## 16.3 Métricas iniciales

- leads;
- conversaciones;
- propuestas;
- conversión;
- tiempo por proyecto;
- horas de corrección;
- errores detectados;
- margen;
- satisfacción;
- claridad percibida;
- intención de recomendar;
- fuentes de clientes;
- porcentaje de documentos incompletos;
- tiempo hasta recibir documentos;
- cambios de alcance.

---

# 17. Criterios para cobrar

`🚨 Bloqueante`

No se cobra una valoración profesional hasta cumplir:

- [ ] El mismo input produce el mismo resultado.
- [ ] Cada cifra material es trazable.
- [ ] El modelo coincide con un cálculo independiente.
- [ ] Los bugs financieros críticos están resueltos.
- [ ] Existen pruebas de regresión.
- [ ] La metodología fue revisada externamente.
- [ ] Existe contrato.
- [ ] Existe NDA.
- [ ] Existen términos y límites.
- [ ] La seguridad mínima fue auditada.
- [ ] Existe eliminación de datos.
- [ ] El cliente conoce el uso de proveedores.
- [ ] El precio fue calculado con horas reales.
- [ ] Existe segunda revisión.
- [ ] El alcance puede ejecutarse con la capacidad disponible.
- [ ] Existe plan ante información incompleta.
- [ ] El informe diferencia estimación, supuestos y hechos.
- [ ] El cliente entiende que no es auditoría ni garantía.
- [ ] Se puede defender el modelo ante un profesional competente.

---

# 18. Plan de trabajo por fases

> No se avanza de fase solo porque el código compile. Cada fase tiene condiciones
> de entrada, entregables, pruebas y criterios de salida.

## Fase 0 — Revisión del negocio y del estado real

**Objetivo:** alinear documento, repositorio y realidad.

- [x] Definir Velarix como boutique apoyada por tecnología.
- [x] Separar precio fijo y acompañamiento por horas.
- [x] Identificar segmento inicial como hipótesis.
- [x] Adelantar seguridad y cumplimiento.
- [x] Diferenciar decisiones e hipótesis.
- [ ] Auditar repositorio contra este documento.
- [ ] Auditar base de datos.
- [ ] Confirmar bugs.
- [ ] Identificar código obsoleto.
- [ ] Identificar funcionalidades prematuras.
- [ ] Crear mapa de arquitectura real.
- [ ] Crear matriz de riesgos.
- [ ] Crear plan técnico.

**Criterio de salida:** existe una auditoría documentada y no se ha modificado
código fuera de correcciones urgentes autorizadas.

## Fase 1 — Exactitud financiera

**Objetivo:** impedir resultados incorrectos.

- [ ] Corregir consolidación.
- [ ] Corregir moneda.
- [ ] Centralizar constantes.
- [ ] Verificar ROE y ROA.
- [ ] Crear casos dorados.
- [ ] Comparar contra Excel.
- [ ] Añadir pruebas.
- [ ] Implementar trazabilidad.
- [ ] Validar mappings.
- [ ] Versionar fórmulas.
- [ ] Documentar supuestos.
- [ ] Revisar metodología externamente.

**Criterio de salida:** casos dorados aprobados, resultados reproducibles y
revisión externa documentada.

## Fase 2 — Seguridad y cumplimiento mínimo

**Objetivo:** poder recibir información real de forma responsable.

- [ ] Auditoría RLS.
- [ ] Matriz de acceso.
- [ ] Auditoría de Storage.
- [ ] Auditoría de secrets.
- [ ] Auditoría de proveedores.
- [ ] Minimización de datos.
- [ ] Eliminación.
- [ ] Retención.
- [ ] Logs.
- [ ] Protocolo de incidente.
- [ ] NDA.
- [ ] Contrato.
- [ ] Política de privacidad.
- [ ] Consentimientos necesarios.

**Criterio de salida:** revisión técnica y jurídica mínima aprobada.

## Fase 3 — Pilotos controlados

**Objetivo:** validar metodología, operación, tiempo y experiencia.

- [ ] Seleccionar casos autorizados.
- [ ] Ejecutar máximo un caso a la vez.
- [ ] Registrar horas.
- [ ] Registrar errores.
- [ ] Obtener revisión externa.
- [ ] Recoger retroalimentación.
- [ ] Ajustar alcance.
- [ ] Ajustar checklist.
- [ ] Ajustar informe.
- [ ] Calcular costo real.

**Criterio de salida:** al menos dos pilotos completos y una decisión informada
sobre precio y oferta.

## Fase 4 — Preparación comercial

**Objetivo:** poder vender con claridad y control.

- [ ] Definir precio.
- [ ] Definir descuento máximo.
- [ ] Crear propuesta.
- [ ] Crear muestra.
- [ ] Crear precalificación.
- [ ] Crear activos comerciales.
- [ ] Crear proceso de onboarding.
- [ ] Crear proceso de cierre.
- [ ] Definir criterios de rechazo.
- [ ] Definir capacidad.

**Criterio de salida:** proceso comercial ejecutable sin improvisación.

## Fase 5 — Primer cliente pagado

**Objetivo:** validar la entrega comercial completa.

- [ ] Aceptar un proyecto permitido.
- [ ] Firmar documentos.
- [ ] Cobrar anticipo.
- [ ] Ejecutar proceso.
- [ ] Revisar externamente.
- [ ] Entregar.
- [ ] Medir margen.
- [ ] Documentar lecciones.
- [ ] Obtener testimonio cuando proceda.

**Criterio de salida:** proyecto cerrado, pagado, documentado y sin incidentes
críticos.

## Fase 6 — Repetibilidad

**Objetivo:** demostrar que el servicio puede repetirse.

- [ ] Estandarizar plantillas.
- [ ] Reducir retrabajo.
- [ ] Mejorar onboarding.
- [ ] Medir conversión.
- [ ] Construir alianzas.
- [ ] Consolidar casos.
- [ ] Ajustar precios.
- [ ] Definir capacidad mensual.

**Criterio de salida:** tres o más proyectos consistentes y margen aceptable.

## Fase 7 — Automatización selectiva

**Objetivo:** automatizar solo tareas ya validadas.

Posibles funcionalidades:

- retainers;
- time entries;
- pagos;
- notificaciones;
- asignación;
- dashboards;
- actualizaciones de datos;
- autoservicio limitado.

**Condición de entrada:** el problema ocurre repetidamente y el ahorro esperado
justifica el costo y riesgo.

## Fase 8 — Escalamiento

**Objetivo:** aumentar capacidad sin reducir calidad.

- [ ] Contratar analistas.
- [ ] Formalizar revisión.
- [ ] Separar funciones.
- [ ] Mejorar control de calidad.
- [ ] Definir entrenamiento.
- [ ] Implementar permisos por asignación.
- [ ] Aumentar precios según reputación.
- [ ] Evaluar nuevos segmentos.

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

- Velarix es una boutique apoyada por tecnología.
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

---

# 21. Hipótesis pendientes

- Segmento inicial exacto.
- Caso de uso con mayor disposición a pagar.
- Canal comercial más efectivo.
- Alcance final del Diagnóstico.
- Precio de la valoración.
- Tarifa de acompañamiento.
- Duración media.
- Volumen mensual sostenible.
- Documentos típicos.
- Porcentaje de leads calificados.
- Conversión.
- Margen.
- Necesidad real del estimador.
- Valor comercial de un PDF largo.
- Disposición a firmar NDA.
- Nivel de confianza generado por revisión externa.

---

# 22. Pendientes de validación financiera

- Metodología completa.
- Selección de métodos.
- WACC.
- Beta.
- prima de riesgo.
- estructura de capital.
- crecimiento terminal.
- normalización.
- comparables.
- tratamiento de deuda y caja.
- ajustes por concentración.
- sensibilidad.
- condiciones para rechazar un DCF.
- lenguaje del informe.
- casos dorados.
- tolerancias aceptables.

---

# 23. Pendientes legales y contractuales

- Forma jurídica y tributaria.
- Contrato.
- NDA.
- privacidad.
- tratamiento de datos.
- confidencialidad.
- propiedad intelectual.
- responsabilidad.
- uso del informe.
- límites de asesoría.
- relación con proveedores.
- retención.
- eliminación.
- consentimiento.
- exclusiones.
- acompañamiento de negociación.
- facturación.
- cláusulas de suspensión.

---

# 24. Estado actual

## Estado estratégico

`✅ Documento reorganizado`

La dirección del negocio está definida, pero varias decisiones comerciales
siguen abiertas y deben validarse.

## Estado técnico

`💻 Pendiente de auditoría`

No se asume que el repositorio implementa correctamente este documento.

## Estado comercial

`🚨 No listo para venta profesional`

Puede prepararse para pilotos después de resolver exactitud, revisión externa y
seguridad mínima.

## Siguiente paso

Entregar este documento a Claude Code con una instrucción de **lectura y
auditoría únicamente**, sin modificar código.

El resultado esperado será una estructura documental que incluya:

- auditoría del estado actual;
- arquitectura real;
- calidad financiera;
- seguridad;
- deuda técnica;
- matriz de riesgos;
- matriz de dependencias;
- plan maestro;
- fases;
- criterios de terminado.

Después de revisar esos archivos se autorizará la implementación de la primera
fase.
