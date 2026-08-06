# Prompt original — Consolidación de las 10 decisiones metodológicas de Velarix

**Fecha de la sesión:** 2026-08-06
**Guardado como copia fiel de la instrucción recibida, sin editar.**

---

# CLAUDE CODE — CONSOLIDACIÓN DE LAS 10 DECISIONES METODOLÓGICAS DE VELARIX

## 1. CONTEXTO Y OBJETIVO

El fundador de Velarix, Nicolás, ya revisó y respondió las 10 decisiones metodológicas pendientes del Bloque 1B.

Tu trabajo es:

1. inspeccionar el repositorio y la documentación vigente;
2. consolidar formalmente las 10 decisiones;
3. diferenciar con precisión:
   - decisiones confirmadas por el fundador;
   - comportamiento provisional permitido;
   - asuntos que requieren validación financiera externa;
   - funcionalidades diferidas;
   - cambios autorizados para implementar ahora;
4. actualizar únicamente la documentación directamente afectada;
5. implementar solo dos cambios de producto de bajo riesgo expresamente autorizados:
   - Decisión 9: retirar del cliente los controles para modificar supuestos financieros que actualmente no tienen efecto real;
   - Decisión 10A: impedir desde el formulario enviar un análisis con ingresos iguales a cero;
6. preparar un paquete claro para el futuro revisor financiero;
7. crear pruebas específicas para los dos cambios implementados;
8. producir un informe final completo;
9. crear un único commit local;
10. no hacer push.

No interpretes estas decisiones como autorización para modificar fórmulas financieras que todavía requieren revisión externa.

---

## 2. VERIFICACIÓN INICIAL OBLIGATORIA

Antes de modificar cualquier archivo:

1. Ejecuta:
   - pwd
   - git status --short
   - git status -sb
   - git log --oneline -10

2. Confirma:
   - que estás en el repositorio correcto de Velarix;
   - la rama actual;
   - el commit HEAD;
   - si existen cambios previos;
   - cuántos commits locales están pendientes de push.

3. No descartes, reviertas, restaures ni sobrescribas cambios existentes.

4. No uses:
   - git reset;
   - git restore;
   - git checkout --;
   - git clean;
   - force push;
   - comandos destructivos equivalentes.

5. Si existen cambios previos que afectan los mismos archivos que necesitas modificar:
   - no los sobrescribas;
   - inspecciona su origen;
   - continúa únicamente si puedes conservarlos;
   - detente si existe un conflicto real que pueda destruir trabajo.

6. No copies, imprimas ni guardes secretos, tokens, API keys o valores de archivos .env.

---

## 3. FUENTES OBLIGATORIAS

Lee completamente, como mínimo:

- Negocio_Velarix_v4.1.md
- NEGOCIO_V4_VELARIX.md
- Negocio.md
- docs/velarix/README.md
- docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md
- docs/velarix/bloque-1b-metodologia/REPORTE-RECONCILIACION-METODOLOGICA.md
- docs/velarix/bloque-1b/REPORTE-IMPLEMENTACION-1B-P0.md
- docs/velarix/bloque-1c/CASOS-DORADOS-PROVISIONALES.md
- docs/velarix/bloque-1c/MATRIZ-DE-PRUEBAS-FINANCIERAS.md
- docs/velarix/bloque-1c/PAQUETE-REVISION-FINANCIERA.md
- docs/velarix/bloque-1c/REPORTE-IMPLEMENTACION-1C-TECNICO.md
- docs/velarix/plan/REGISTRO-DE-DECISIONES.md
- docs/velarix/plan/BACKLOG-CLASIFICADO.md
- docs/velarix/plan/MATRIZ-DE-DEPENDENCIAS.md
- docs/velarix/plan/MATRIZ-DE-RIESGOS.md
- docs/velarix/fases/FASE-01-EXACTITUD-FINANCIERA.md

Determina cuál de los tres documentos de negocio es la fuente de verdad vigente usando:

- versión declarada;
- referencias desde docs/velarix/README.md;
- historial Git;
- contenido;
- relaciones de supersesión.

No actualices los tres documentos indiscriminadamente.

Si la autoridad documental no es inequívoca:

- no dupliques decisiones en los tres;
- documenta la ambigüedad;
- actualiza el registro especializado bajo docs/velarix/bloque-1b-metodologia/;
- deja una recomendación concreta para resolver la duplicidad.

---

## 4. SISTEMA DE ESTADOS

Respeta los estados oficiales del proyecto:

- ✅ Confirmado
- 🧪 Hipótesis
- 📊 Validación financiera
- ⚖️ Revisión legal
- 💻 Confirmado técnicamente
- ⏸️ Diferido
- 🚨 Bloqueante

Una misma decisión puede tener:

- una política de producto confirmada;
- una metodología financiera pendiente de validación;
- una funcionalidad futura diferida.

No conviertas automáticamente una decisión del fundador en una fórmula financieramente aprobada.

---

## 5. DECISIONES CONFIRMADAS POR EL FUNDADOR

### DECISIÓN 1 — SUPUESTOS DE MERCADO DEL WACC

Estado:

- 📊 Validación financiera para la metodología y valores definitivos.
- ⏸️ Diferido para automatización completa mediante APIs.

Decisión:

Durante la etapa inicial, un revisor financiero externo deberá validar las fuentes, valores, periodicidad y reglas utilizadas para:

- tasa libre de riesgo;
- ERP;
- beta sectorial;
- costo de deuda;
- prima país;
- prima por tamaño;
- cualquier otro ajuste del WACC.

A futuro, Velarix deberá obtener y actualizar estos datos mediante varias fuentes y APIs confiables.

La arquitectura futura deberá incluir:

- fuente principal;
- fuentes de contraste;
- jerarquía entre fuentes;
- fecha de vigencia;
- fecha de consulta;
- versión del dato;
- trazabilidad;
- validación cruzada;
- detección de anomalías;
- rangos permitidos;
- fallback controlado;
- último valor validado;
- alerta cuando dos fuentes difieran materialmente;
- bloqueo cuando falte un dato crítico.

El backend podrá ejecutar controles automáticos, pero no se considerará un sustituto absoluto del revisor financiero.

No implementar APIs, integraciones ni cambios de WACC en esta tarea.

Los valores actuales pueden seguir usándose únicamente como provisionales para desarrollo y pruebas sintéticas.

---

### DECISIÓN 2 — ESTRUCTURA DE CAPITAL OBSERVADA VS. OBJETIVO

Estado:

- ✅ Confirmado para la política del producto estándar.
- 📊 Validación financiera para los criterios de override.
- ⏸️ Diferido para la interfaz de consultoría.

Decisión:

El producto estándar debe utilizar siempre la estructura de capital observada de la empresa para mantener una metodología uniforme.

El cliente no podrá modificar directamente la estructura de capital.

En una futura capa de consultoría, Nicolás o un analista autorizado podrá usar una estructura de capital objetivo distinta cuando exista una justificación financiera clara.

Todo override futuro deberá:

- estar restringido por rol;
- incluir justificación;
- conservar valor original;
- conservar valor ajustado;
- identificar al responsable;
- registrar fecha;
- quedar auditado;
- reflejarse en el informe;
- poder revertirse;
- no sobrescribir silenciosamente los datos originales.

Un revisor financiero deberá definir antes de implementarlo:

- cuándo se permite;
- qué soportes requiere;
- qué límites aplica;
- cómo afecta beta, WACC y Enterprise Value.

No implementar overrides ni modificar la estructura de capital en esta tarea.

---

### DECISIÓN 3 — CRECIMIENTO PERPETUO

Estado:

- ✅ Confirmado como dirección futura del producto.
- 📊 Validación financiera para la fórmula y límites.
- ⏸️ Diferido para implementación dinámica.

Decisión:

La tasa de crecimiento perpetuo no debe permanecer fija en 3% para todas las empresas.

La metodología futura deberá considerar varias variables, entre ellas:

- inflación esperada de largo plazo;
- crecimiento real potencial;
- moneda de valoración;
- exposición geográfica;
- madurez del sector;
- madurez de la empresa;
- capacidad sostenible de reinversión;
- retorno sobre capital en estado estable;
- contexto macroeconómico;
- fecha y vigencia de las fuentes.

La tasa resultante deberá:

- respetar límites conservadores;
- ser consistente con el estado estable;
- ser compatible con el WACC;
- registrar fuentes y fecha;
- detectar combinaciones imposibles;
- recibir validación inicial y periódica.

El 3% actual puede mantenerse únicamente como supuesto provisional de desarrollo.

No modificar g terminal ni fórmulas de valor terminal en esta tarea.

---

### DECISIÓN 4 — HORIZONTE EXPLÍCITO DEL DCF

Estado:

- ✅ Confirmado para mantener 5 años actualmente.
- ⏸️ Diferido para horizonte variable.
- 📊 Validación financiera para reglas de selección futura.

Decisión:

Velarix mantendrá por ahora un horizonte explícito fijo de 5 años.

Esto no significa valorar la empresa únicamente durante 5 años. Después del periodo explícito, el modelo utiliza el valor terminal para representar la perpetuidad.

A futuro, la arquitectura deberá permitir horizontes explícitos variables, por ejemplo:

- 5 años;
- 7 años;
- 10 años;
- otro horizonte metodológicamente justificado.

La selección deberá depender de:

- madurez de la empresa;
- etapa de crecimiento;
- tiempo esperado de estabilización;
- convergencia de márgenes;
- reinversión;
- riesgo;
- disponibilidad de proyecciones defendibles.

Cuando una empresa no se estabilice dentro de 5 años, el sistema deberá advertir que el horizonte puede ser insuficiente y enviar el caso a revisión.

No cambiar el horizonte ni la arquitectura del motor en esta tarea.

---

### DECISIÓN 5 — IMPUESTOS Y UTILIDAD HISTÓRICA

Estado:

- ✅ Confirmado para la política de revisión y conciliación.
- 📊 Validación financiera y tributaria para la metodología.
- ⏸️ Diferido para la función avanzada de revisión asistida.

Decisión:

Velarix no debe asumir automáticamente que los impuestos, utilidad neta u otros datos históricos reportados por el cliente son correctos.

Tampoco debe asumir que una diferencia representa evasión, fraude, manipulación o error intencional.

La metodología futura deberá:

1. conservar la cifra reportada;
2. calcular una referencia independiente;
3. comparar ambas cifras;
4. cuantificar diferencias;
5. identificar diferencias materiales;
6. solicitar explicaciones o soportes;
7. detener la aprobación automática cuando corresponda;
8. permitir revisión humana;
9. conservar trazabilidad de cualquier ajuste;
10. mostrar, cuando sea útil:
    - resultado basado en información reportada;
    - resultado normalizado o ajustado para valoración.

La explicación deberá ser neutral.

Un revisor financiero y tributario deberá definir:

- documentos mínimos;
- impuesto corriente;
- impuesto diferido;
- conciliación contable-fiscal;
- ajustes permitidos;
- umbrales de materialidad;
- condiciones de bloqueo;
- condiciones para continuar con advertencia;
- responsables de aprobación.

No modificar impuestos, utilidad histórica ni normalización de EBITDA en esta tarea.

---

### FUNCIÓN FUTURA RELACIONADA CON LA DECISIÓN 5

Estado:

- ⏸️ Diferido.
- 📊 Validación financiera y tributaria.
- ⚖️ Revisión legal y de tratamiento de datos antes de activarse.

Debe quedar registrada una función futura exclusiva para Nicolás o administradores autorizados.

La función permitirá cargar manualmente documentos complementarios, por ejemplo:

- declaración de renta;
- conciliación fiscal;
- notas a estados financieros;
- certificados;
- soportes contables;
- documentos tributarios.

La IA en el backend podrá:

- extraer información;
- clasificar datos;
- comparar cifras;
- detectar diferencias;
- identificar documentos faltantes;
- preparar preguntas;
- mostrar valor reportado, valor recalculado y diferencia;
- registrar nivel de confianza;
- conservar evidencia y trazabilidad.

La función no podrá:

- acusar evasión;
- afirmar fraude;
- modificar libros;
- aprobar automáticamente obligaciones tributarias;
- reemplazar a un contador;
- reemplazar a un revisor;
- tomar decisiones finales sin intervención humana.

No implementar esta función en esta tarea.

---

### DECISIÓN 6 — PATRIMONIO NEGATIVO

Estado:

- ✅ Confirmado para la política de interpretación y presentación.
- 📊 Validación financiera para el efecto sobre WACC, beta y valoración.
- 🚨 Bloqueante para cierre metodológico mientras los motores produzcan resultados contradictorios.
- No autorizado para corrección de fórmulas en esta tarea.

Decisión:

Velarix debe conservar el patrimonio con su signo real.

Nunca debe convertir artificialmente un patrimonio negativo en positivo para ocultar su condición.

Cuando el patrimonio sea negativo:

- el ROE no debe presentarse como 0%;
- tampoco debe mostrarse como un porcentaje ordinario sin contexto;
- debe mostrarse como "No interpretable por patrimonio negativo" o "N/A";
- debe aparecer una alerta;
- el caso debe pasar a revisión;
- deben mostrarse los indicadores que sí sean interpretables;
- debe conservarse el patrimonio original;
- debe usarse total_assets real cuando exista y cuando la metodología haya sido validada;
- ambos motores deberán aplicar finalmente el mismo tratamiento.

Patrimonio negativo no significa automáticamente:

- que la empresa esté en pérdida;
- que el negocio esté mal;
- que exista fraude;
- que exista una irregularidad.

Puede relacionarse con:

- pérdidas acumuladas;
- distribuciones a socios;
- recompras;
- ajustes contables;
- reorganizaciones;
- estructura de deuda;
- otras circunstancias.

Un revisor financiero deberá definir cómo afecta:

- beta apalancada;
- WACC;
- estructura de capital;
- Enterprise Value;
- Equity Value;
- casos dorados;
- presentación del informe.

No modificar Math.abs(), ROE, total_assets, beta, WACC ni motores financieros durante esta tarea.

Documenta con exactitud la inconsistencia actual y sus criterios de aceptación futuros.

---

### DECISIÓN 7 — UTILIDAD NETA VS. NOPAT

Estado:

- ✅ Confirmado.
- Solo requiere formalización documental.

Decisión:

Mantener el comportamiento actual:

- utilidad neta para ROE;
- utilidad neta para ROA;
- NOPAT para el flujo de caja del DCF.

No se debe cambiar el motor.

Documenta por qué las métricas son diferentes:

- ROE y ROA son indicadores de rentabilidad contable;
- el DCF usa NOPAT como componente operativo del FCFF;
- utilizar métricas diferentes en esos contextos es intencional.

---

### DECISIÓN 8 — ESCENARIOS BASE, OPTIMISTA Y PESIMISTA

Estado:

- ✅ Confirmado para mantener provisionalmente la configuración actual.
- 📊 Validación financiera para la metodología definitiva.
- ⏸️ Diferido para escenarios dinámicos y unificación definitiva.

Decisión:

Por ahora, Velarix mantendrá porcentajes o multiplicadores fijos para construir los escenarios.

Esto es provisional.

La metodología futura deberá variar según factores como:

- sector;
- madurez;
- etapa del negocio;
- contexto macroeconómico;
- ciclo económico;
- volatilidad histórica;
- estructura de costos;
- capacidad de inversión;
- comportamiento de márgenes;
- crecimiento histórico;
- crecimiento proyectado;
- riesgos específicos.

Un revisor deberá definir:

- variables que cambian;
- límites;
- multiplicadores;
- relaciones entre variables;
- fuentes;
- reglas de consistencia;
- tratamiento por sector;
- tratamiento por etapa empresarial.

Después de la validación, servidor y cliente deberán usar exactamente la misma metodología.

No modificar multiplicadores, CAPEX, capital de trabajo, crecimiento, margen o WACC de los escenarios en esta tarea.

---

### DECISIÓN 9 — SUPUESTOS AJUSTABLES POR EL CLIENTE

Estado:

- ✅ Confirmado.
- AUTORIZADO PARA IMPLEMENTACIÓN INMEDIATA.

Decisión:

La página y el producto estándar deben ejecutar siempre la misma metodología.

El cliente no debe ver controles que aparenten permitir ajustar supuestos financieros cuando el backend no aplica esos ajustes.

Debes inspeccionar el código real y:

1. localizar todos los controles visibles para modificar los supuestos canónicos;
2. identificar qué campos se muestran;
3. identificar qué valores se envían;
4. eliminar esos controles del flujo del cliente;
5. eliminar textos, ayudas o promesas relacionadas;
6. evitar que el cliente pueda alterar esos valores mediante la interfaz;
7. conservar el contrato del backend si eliminarlo implica una migración o un cambio financiero fuera de alcance;
8. no crear todavía una interfaz de analista;
9. no implementar overrides;
10. no cambiar valores financieros por defecto.

La eliminación debe ser completa desde la perspectiva del cliente:

- no debe quedar un botón oculto;
- no debe quedar un acordeón;
- no debe quedar una opción deshabilitada que prometa disponibilidad futura;
- no debe quedar texto que diga que el cliente puede personalizar la metodología;
- no debe enviarse un valor controlado por el cliente si el campo ya no existe.

No elimines estructuras internas utilizadas por pruebas, servidor o futuras migraciones sin analizar su impacto.

Crea pruebas que demuestren:

- los controles ya no aparecen;
- el cliente no puede modificarlos;
- el formulario conserva su funcionamiento;
- el payload mantiene el contrato requerido sin aceptar overrides del cliente;
- no se altera el cálculo financiero.

---

### DECISIÓN 10 — REVENUE IGUAL A CERO

Estado:

- ✅ Confirmado para la opción A inmediata.
- ⏸️ Diferido para la defensa adicional en el motor cliente.

Decisión inmediata:

El formulario debe impedir enviar un análisis cuando los ingresos sean iguales a cero.

Implementa la validación en la capa más temprana y apropiada del formulario existente.

Requisitos:

- no permitir el envío;
- mostrar un mensaje claro;
- asociar el mensaje al campo correspondiente;
- conservar accesibilidad;
- no depender únicamente de deshabilitar visualmente el botón;
- preservar validaciones existentes;
- no modificar fórmulas financieras;
- no cambiar el motor cliente;
- no cambiar el motor servidor.

Mensaje recomendado:

"Los ingresos deben ser mayores que cero para ejecutar el análisis."

Si el esquema actual ya rechaza ingresos negativos, conserva ese comportamiento.

No amplíes esta tarea a otros formularios que no alimenten el análisis profesional sin evidencia de que comparten el mismo riesgo.

Crea pruebas para:

- ingresos iguales a cero;
- mensaje visible;
- envío bloqueado;
- valor positivo permitido;
- ausencia de regresión en el flujo normal.

Decisión futura:

El motor cliente también deberá rechazar revenue = 0 como segunda capa de defensa, pero solo después de revisar todos sus llamadores.

No implementar esa segunda capa en esta tarea.

---

## 6. CLASIFICACIÓN OBLIGATORIA DEL TRABAJO

Crea una matriz con estas cuatro categorías:

### A. IMPLEMENTAR AHORA

Únicamente:

- Decisión 9: retirar controles de supuestos ajustables del cliente.
- Decisión 10A: validación de ingresos mayores que cero en el formulario.

### B. DOCUMENTAR AHORA SIN CAMBIAR FÓRMULAS

- Decisión 1.
- Decisión 2.
- Decisión 3.
- Decisión 4.
- Decisión 5.
- Función administrativa de revisión fiscal asistida.
- Decisión 6.
- Decisión 7.
- Decisión 8.
- Decisión 10B.

### C. ENVIAR A REVISOR

Como mínimo:

- fuentes y reglas del WACC;
- estructura de capital objetivo;
- crecimiento perpetuo;
- selección futura de horizonte;
- impuestos y conciliación;
- normalización financiera;
- patrimonio negativo;
- total_assets;
- efecto sobre beta y WACC;
- escenarios dinámicos;
- umbrales de materialidad;
- casos dorados definitivos.

### D. DIFERIR

- APIs financieras automáticas;
- overrides de consultoría;
- horizonte variable;
- g terminal dinámica;
- escenarios dinámicos;
- función fiscal asistida por IA;
- defensa revenue = 0 dentro del motor cliente;
- interfaz especial para analistas.

---

## 7. DOCUMENTOS A CREAR

Crea estos archivos:

1. docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-APROBADAS-POR-FUNDADOR.md

Debe contener:

- fecha;
- fundador: Nicolás;
- contexto;
- las 10 decisiones;
- estados;
- decisión actual;
- comportamiento permitido;
- comportamiento prohibido;
- dependencia del revisor;
- criterio futuro;
- impacto técnico;
- criterio de aceptación;
- trazabilidad hacia documentos previos.

2. docs/velarix/bloque-1b-metodologia/PLAN-VALIDACION-REVISOR-FINANCIERO.md

Debe contener:

- objetivo;
- perfil mínimo del revisor;
- documentos que debe recibir;
- preguntas exactas;
- decisiones que debe aprobar;
- entregables esperados;
- evidencia requerida;
- formato de aprobación;
- puntos que puede rechazar;
- proceso para registrar cambios;
- criterio para cerrar 1B metodología;
- criterio para cerrar 1C.

3. docs/velarix/bloque-1b-metodologia/ROADMAP-METODOLOGIA-DINAMICA.md

Debe separar:

- versión provisional actual;
- versión validada inicial;
- automatización con APIs;
- metodología dinámica futura;
- función de consultoría;
- función fiscal asistida;
- dependencias;
- riesgos;
- orden recomendado;
- condiciones para no construir todavía.

4. docs/velarix/bloque-1b-metodologia/PROMPT-CLAUDE-CONSOLIDACION-DECISIONES-2026-08-06.md

Guarda una copia fiel de esta instrucción.

5. docs/velarix/bloque-1b-metodologia/REPORTE-CONSOLIDACION-DECISIONES-2026-08-06.md

Debe completarse al final con:

- estado inicial;
- análisis;
- archivos modificados;
- decisiones documentadas;
- cambios implementados;
- pruebas;
- resultados;
- limitaciones;
- asuntos enviados a revisor;
- asuntos diferidos;
- estado final de Git;
- commit.

No crees una nueva jerarquía de carpetas si no es necesaria.

---

## 8. DOCUMENTOS EXISTENTES A ACTUALIZAR

Actualiza únicamente cuando exista relación directa y sin eliminar evidencia histórica:

- docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md
- docs/velarix/bloque-1c/PAQUETE-REVISION-FINANCIERA.md
- docs/velarix/plan/REGISTRO-DE-DECISIONES.md
- docs/velarix/plan/BACKLOG-CLASIFICADO.md
- docs/velarix/plan/MATRIZ-DE-DEPENDENCIAS.md
- docs/velarix/plan/MATRIZ-DE-RIESGOS.md
- docs/velarix/fases/FASE-01-EXACTITUD-FINANCIERA.md
- documento maestro de negocio, únicamente si identificas con certeza cuál es la versión autoritativa.

Reglas:

- no borres el análisis original;
- marca qué decisiones ya respondió el fundador;
- distingue respuesta del fundador de aprobación del revisor;
- enlaza al nuevo documento aprobado;
- elimina la apariencia de que las 10 decisiones siguen totalmente sin responder;
- no declares que todas están financieramente aprobadas;
- no cierres 1B metodología;
- no cierres 1C;
- no desbloquees 1E;
- no declares el producto listo para pilotos pagados;
- no modifiques documentos de seguridad salvo una referencia mínima estrictamente necesaria.

---

## 9. LÍMITES TÉCNICOS ABSOLUTOS

No está autorizado:

- cambiar fórmulas de WACC;
- cambiar beta;
- cambiar estructura de capital;
- cambiar g terminal;
- cambiar horizonte del DCF;
- cambiar escenarios;
- cambiar CAPEX;
- cambiar capital de trabajo;
- cambiar normalización de EBITDA;
- cambiar impuestos;
- cambiar utilidad neta;
- cambiar NOPAT;
- cambiar ROE o ROA;
- modificar Math.abs() del patrimonio;
- cambiar total_assets;
- unificar motores financieros;
- modificar casos dorados esperados;
- implementar APIs;
- crear nuevas API keys;
- modificar variables de entorno;
- crear funciones administrativas;
- implementar análisis fiscal con IA;
- crear overrides de analista;
- tocar RLS;
- tocar migraciones;
- tocar Auth;
- tocar Edge Functions;
- tocar supabase/config.toml;
- desplegar;
- modificar Supabase remoto;
- rotar claves;
- tocar JWT Signing Keys;
- hacer push;
- crear ZIP;
- modificar binarios.

Esta tarea no es una nueva auditoría de seguridad.

No reabras ni repitas trabajo de autenticación sin una prueba fallida nueva o un hallazgo concreto relacionado directamente con los dos cambios autorizados.

---

## 10. MÉTODO DE IMPLEMENTACIÓN

### Para la Decisión 9

1. Busca referencias reales a:
   - supuestos;
   - assumptions;
   - structured_input;
   - canonical assumptions;
   - sliders;
   - inputs financieros ajustables;
   - controles de crecimiento, margen, WACC, impuestos, CAPEX o capital de trabajo.

2. Traza:
   - componente;
   - formulario;
   - estado;
   - validación;
   - payload;
   - receptor.

3. Determina qué controles son realmente visibles al cliente.

4. Elimina únicamente la capacidad visible y efectiva del cliente para modificarlos.

5. Conserva:
   - defaults canónicos;
   - contratos internos necesarios;
   - compatibilidad;
   - comportamiento del backend.

6. No construyas todavía la capa de consultoría.

### Para la Decisión 10

1. Identifica el formulario exacto que alimenta el análisis profesional.
2. Identifica el esquema de validación actual.
3. Implementa la regla en el lugar más coherente con la arquitectura existente.
4. Reutiliza patrones y componentes existentes.
5. Evita validaciones duplicadas innecesarias.
6. Añade el mensaje claro.
7. Verifica que no se produzca una llamada al cálculo con revenue = 0.

---

## 11. PRUEBAS Y VALIDACIONES

Primero detecta:

- package manager;
- scripts disponibles;
- framework de pruebas;
- ubicación de pruebas relacionadas.

Orden obligatorio:

1. pruebas dirigidas de la Decisión 9;
2. pruebas dirigidas de la Decisión 10;
3. pruebas del formulario o flujo directamente afectado;
4. typecheck una sola vez;
5. build una sola vez;
6. lint de archivos modificados, si existe una forma segura;
7. suite completa máximo una sola vez y únicamente después de que las pruebas dirigidas pasen.

No ejecutes la suite completa repetidamente.

No reinicies todas las pruebas por cada fallo aislado.

Ante un fallo:

1. ejecuta la prueba específica;
2. corrige únicamente la causa;
3. repite esa prueba;
4. continúa cuando pase.

Si el lint global mantiene deuda preexistente:

- no intentes reparar todo el repositorio;
- registra el conteo;
- verifica que no introdujiste hallazgos nuevos en los archivos modificados.

No ejecutes:

- pruebas remotas;
- pruebas contra producción;
- migraciones;
- seeds;
- deploys;
- comandos de Supabase que escriban;
- scripts que requieran exponer secretos.

Registra para cada comando:

- comando exacto;
- resultado;
- duración aproximada;
- cantidad de pruebas;
- fallos;
- si el fallo era previo o nuevo.

---

## 12. CONTROL DE CALIDAD ANTES DEL COMMIT

Antes de crear el commit:

1. Ejecuta git diff --check.
2. Revisa git diff completo.
3. Ejecuta git status --short.
4. Confirma que:
   - no hay secretos;
   - no hay .env;
   - no hay ZIP;
   - no hay binarios;
   - no hay migraciones;
   - no hay cambios de Supabase;
   - no hay cambios de Auth;
   - no hay cambios financieros fuera de alcance;
   - solo se implementaron las Decisiones 9 y 10A;
   - las demás decisiones son documentales;
   - las pruebas relevantes pasan;
   - el informe final está actualizado;
   - no se declaró falsamente cerrado 1B, 1C o 1E.

---

## 13. COMMIT

Si todos los cambios autorizados y las validaciones pasan:

Crea un único commit local con el mensaje:

fix: apply approved valuation input guardrails

No hagas push.

No incluyas commits previos dentro de un squash o reescritura.

No uses amend sobre commits existentes.

Después del commit ejecuta:

- git status --short
- git status -sb
- git log --oneline -5
- git show --stat --oneline HEAD

Registra el hash.

Si las validaciones relevantes no pasan por un problema nuevo causado por esta tarea:

- no hagas commit;
- corrige el problema dentro del alcance;
- vuelve a ejecutar únicamente la prueba afectada.

Si existe un bloqueo preexistente que no fue causado por esta tarea:

- no modifiques código ajeno;
- documenta la evidencia;
- decide si los cambios autorizados siguen siendo verificables;
- no afirmes que todo está verde si no lo está.

---

## 14. RESPUESTA FINAL OBLIGATORIA

Tu respuesta final debe incluir exactamente estas secciones:

1. Veredicto.
2. Estado inicial de Git.
3. Fuente documental autoritativa identificada.
4. Archivos leídos.
5. Archivos creados.
6. Archivos actualizados.
7. Matriz de las 10 decisiones.
8. Cambios implementados para la Decisión 9.
9. Cambios implementados para la Decisión 10A.
10. Cambios expresamente no implementados.
11. Pruebas ejecutadas y resultados exactos.
12. Estado de 1B metodología.
13. Estado de 1C.
14. Estado de 1E.
15. Paquete pendiente para revisor financiero.
16. Funcionalidades diferidas.
17. Riesgos que permanecen.
18. Commit creado y hash.
19. Estado final de Git.
20. Próximo paso único recomendado.

El veredicto debe diferenciar entre:

- decisiones del fundador consolidadas;
- cambios de producto implementados;
- metodología financiera todavía pendiente;
- bloqueos para cierre formal.

No afirmes que Velarix está listo para valoraciones profesionales, pilotos pagados o clientes reales únicamente por completar esta tarea.
