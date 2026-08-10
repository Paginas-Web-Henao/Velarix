# Reorientación — Velarix como boutique de valoración expert-led

**Fecha:** 2026-08-10
**Tipo:** decisión estructural de negocio, `✅ Confirmado` por el fundador
(Nicolás). Este documento es la confirmación.
**Reemplaza como fuente de verdad vigente:** `Negocio_Velarix_v4.1.md` →
`Negocio_Velarix_v4.2.md` (v4.1 se conserva por historial, no se elimina).

---

## 1. Contexto

Después de revisar Velarix con un profesor con experiencia financiera
(reunión del **2026-08-10**, ver el kit de reunión ya retirado — sección
9 de este documento; el kit se había preparado bajo el nombre de carpeta
`docs/velarix/reunion-profesor-2026-08-06/`, una fecha incorrecta en el
nombre histórico de esa carpeta — la reunión real ocurrió el 2026-08-10),
el fundador tomó una decisión estructural sobre el producto y el modelo
de negocio.

Hasta esta fecha, la arquitectura conceptual de Velarix se aproximaba a:

```
ESTADOS FINANCIEROS → FÓRMULAS → VALORACIÓN
```

Es decir: un conjunto de supuestos metodológicos prácticamente uniforme,
aplicado por sector, sobre los estados financieros de cualquier empresa
del segmento objetivo (ver `_shared/financial-methodology.ts`,
`_shared/canonical-financial-engine.ts`, `_shared/capital-structure.ts`
— los 8 supuestos canónicos, `SECTOR_BENCHMARKS`, y los tres escenarios
pesimista/base/optimista con multiplicadores fijos).

## 2. Problema descubierto

Esa aproximación deja demasiado contexto empresarial sin resolver. Dos
empresas del mismo sector, con operaciones aparentemente similares,
incluso controladas por el mismo propietario, pueden requerir:

- diferente interpretación contable;
- diferentes normalizaciones;
- diferentes drivers de crecimiento;
- diferente horizonte explícito;
- diferente estructura de capital;
- diferente tratamiento tributario;
- diferentes métodos de valoración;
- diferentes supuestos de estado estable;
- diferente tratamiento de cuentas aparentemente equivalentes.

El caso concreto que expuso este problema con más claridad durante la
preparación de la reunión con el profesor fue el de patrimonio negativo
(Caso Dorado C, `docs/velarix/bloque-1c/CASOS-DORADOS-PROVISIONALES.md`):
el motor servidor aplica `Math.abs()` al patrimonio antes de calcular,
ocultando su signo — pero la causa de un patrimonio negativo (pérdidas
acumuladas, distribuciones, recompras, reorganización, estructura de
financiación) cambia qué tratamiento es correcto. Ninguna fórmula
uniforme puede decidir eso sin comprender la empresa específica.

## 3. Premisa anterior

`ESTADOS FINANCIEROS → FÓRMULAS → VALORACIÓN`. La tecnología, mediante un
conjunto de supuestos fijos por sector, produce una valoración que un
humano revisa al final del proceso.

## 4. Nueva premisa

Cada empresa debe entenderse individualmente **antes** de construir una
valoración:

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

La tecnología no sustituye el juicio financiero — lo estructura, lo
documenta y ejecuta lo que ya fue interpretado y aprobado.

## 5. Modelo de negocio

Velarix pasa a definirse formalmente como:

> "Una boutique de valoración empresarial apoyada por tecnología, en la
> cual la plataforma estructura información, conserva evidencia, detecta
> inconsistencias, genera preguntas, documenta normalizaciones, ejecuta
> cálculos aprobados y produce entregables, mientras Nicolás y expertos
> financieros interpretan la empresa, aprueban decisiones materiales y
> emiten la conclusión de valoración."

El cliente compra análisis, criterio, proceso, valoración, revisión
profesional y entregable — no acceso autónomo a un motor de valoración.
Definición completa: `Negocio_Velarix_v4.2.md` §1.1.

## 6. Papel del software

La plataforma es el sistema operativo interno de la boutique — no un
producto de autoservicio. El motor financiero determinístico **no se
elimina**; cambia de papel: deja de ser "el cerebro que decide cómo
valorar" y pasa a ser "un motor determinístico que ejecuta matemáticas
sobre inputs y supuestos que previamente fueron interpretados,
contextualizados y aprobados". El nuevo cerebro de Velarix es el
**Expediente de Valoración** de cada caso (ver
`docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`).

## 7. Papel de la IA

La IA no es el valuador. Es un asistente de análisis: puede leer
documentos, extraer información, clasificar cuentas, detectar
inconsistencias, identificar información faltante, comparar periodos,
encontrar cambios anormales, proponer preguntas, proponer clasificaciones,
resumir respuestas, preparar reconciliaciones, generar borradores y
recuperar decisiones anteriores similares. No aprueba normalizaciones
materiales, no elige silenciosamente un método, no inventa contexto
empresarial, no aprueba WACC/valor terminal/horizonte, no concluye
fraude/evasión, y no emite autónomamente el valor final. Detalle
completo: `Negocio_Velarix_v4.2.md` §9.8.

## 8. Papel de Nicolás

Nicolás opera la boutique y el sistema: relación con el cliente,
recopilación de información, operación del expediente, seguimiento,
investigación, análisis, coordinación, preparación de hipótesis,
documentación, control del proceso, entregables. Puede desarrollar
progresivamente mayor criterio financiero; una decisión material que
requiera experiencia superior se escala a un experto. Detalle:
`Negocio_Velarix_v4.2.md` §8.2.

## 9. Papel de los expertos

El experto financiero no diseña Velarix desde cero — Velarix debe
avanzar independientemente. El experto revisa casos concretos, cuestiona
hipótesis, corrige errores conceptuales, aprueba decisiones materiales, y
ayuda a convertir casos reales en mejores reglas metodológicas:

```
VELARIX ESTUDIA → NICOLÁS PROPONE → VELARIX DOCUMENTA
→ EXPERTO CRITICA CASOS/DECISIONES REALES → VELARIX CORRIGE
→ EL SISTEMA APRENDE
```

No: `VELARIX ESPERA AL EXPERTO PARA SABER QUÉ CONSTRUIR`. El profesor
específicamente no es responsable de diseñar todo Velarix — Nicolás
conoce finanzas y desarrolla las hipótesis iniciales; el profesor y
futuros expertos se usan para cuestionar y mejorar decisiones que surjan
de casos concretos.

**Qué bloquea el experto y qué no.** Es bloqueante para: la aprobación
metodológica formal cuando corresponda; decisiones financieras materiales
que Nicolás no pueda defender suficientemente por su cuenta; el cierre
formal de gates que expresamente requieren validación externa; y los
primeros entregables profesionales cuando aplique. **No** es bloqueante
para: estudiar casos públicos (§13.3.1 de `Negocio_Velarix_v4.2.md`),
construir hipótesis, analizar cuentas, diseñar preguntas, diseñar o
refinar el Expediente, implementar infraestructura que no codifique una
decisión financiera no aprobada, ni avanzar en Velarix en general.

Este ciclo es, en parte, el resultado directo de la conversación que
originó esta reorientación — el kit de materiales preparado
específicamente para la reunión del **2026-08-10** con el profesor (bajo
el nombre histórico de carpeta
`docs/velarix/reunion-profesor-2026-08-06/`, una fecha incorrecta en ese
nombre — la reunión ocurrió el 2026-08-10) se retiró del repositorio en
esta misma sesión, por autorización expresa del fundador: cumplió su
propósito puntual (esa reunión) y no es un documento autoritativo de
negocio ni de metodología — esos quedan consolidados aquí y en
`Negocio_Velarix_v4.2.md`. Se verificó antes de eliminarlo que contenía
únicamente los 6 archivos generados específicamente para esa reunión
(presentación HTML, guion oral, resumen, hoja de notas, trazabilidad,
instrucciones de apertura), sin ningún documento autoritativo ni trabajo
de otra sesión, y que ningún otro documento del repositorio lo
referenciaba. Ese nombre histórico de carpeta no debe recrearse.

## 10. Qué trabajo anterior se conserva

Ninguna parte del trabajo técnico ya realizado se destruye como
consecuencia de esta reorientación:

- pipeline de documentos, parsing, mapeo de cuentas, validaciones,
  structured input;
- motor financiero determinístico y cálculos DCF
  (`_shared/canonical-financial-engine.ts`, `_shared/capital-structure.ts`);
- funciones de análisis, trazabilidad (`_shared/calculation-provenance.ts`),
  versionado (`_shared/calculation-versioning.ts`);
- auditoría, seguridad, aislamiento entre clientes (Bloque 1D, cerrado);
- casos de prueba y casos dorados provisionales (Bloque 1C-Prep);
- infraestructura Supabase, autenticación;
- frontend existente;
- generación de narrativa, generación de PDF;
- todas las decisiones de seguridad ya cerradas.

## 11. Qué hipótesis anteriores quedan supersedidas

- Que una metodología prácticamente uniforme por sector es suficiente
  para valorar cualquier PYME del segmento — **supersedida**. Cada caso
  requiere un Expediente de Valoración propio.
- Que "5 años" es la verdad metodológica del horizonte explícito para
  toda empresa — **supersedida**; permanece como placeholder técnico
  provisional (`Negocio_Velarix_v4.2.md` §9.6).
- Que "g = 3%" es el crecimiento terminal correcto para toda empresa —
  **supersedida**, misma razón.
- Que existe un WACC general aplicable a cualquier empresa del segmento —
  **supersedida**; los inputs deben surgir del expediente específico del
  caso.
- Que pesimista/base/optimista, con multiplicadores fijos, es el
  mecanismo predeterminado para entregar una valoración — **supersedida**;
  la boutique busca una conclusión principal de valoración, con
  sensibilidad y escenarios como herramienta secundaria.

**Ninguna de estas hipótesis supersedidas implica que el código actual
esté "mal"** — implica que su rol cambia: de fuente de la metodología a
ejecutor de una metodología ya aprobada caso por caso. Ningún valor,
fórmula o comportamiento técnico se modificó en código como consecuencia
de esta reorientación (ver sección 13).

## 12. Implicaciones financieras

- Los 8 supuestos canónicos (`_shared/financial-methodology.ts`) siguen
  `approved: false` y sin validación de un revisor financiero externo —
  esto no cambia por la reorientación. Lo que cambia es el destino final
  de esos supuestos: dejan de aspirar a ser "la metodología oficial de
  Velarix" y pasan a ser, cuando corresponda, valores de referencia
  dentro de un expediente que los contextualiza caso por caso.
- La inconsistencia de patrimonio negativo (`Math.abs()` en
  `resolveEffectiveEquity`, `_shared/canonical-input-normalization.ts`)
  permanece documentada y sin corregir — su corrección debe surgir de un
  caso concreto y una decisión metodológica defendible, no de esta
  reorientación (`Negocio_Velarix_v4.2.md` §9.6.2).
- R-19 (`plan/MATRIZ-DE-RIESGOS.md`) mantiene severidad Alta — el riesgo
  metodológico de fondo no se mitiga por reorientar el negocio, solo por
  validación experta real caso por caso.

## 13. Implicaciones técnicas

- No se modificó ninguna fórmula, ningún motor, ninguna Edge Function,
  ninguna migración, ninguna configuración de Supabase/Auth/JWT Signing
  Keys en esta sesión — ver sección 17 (validación) para la confirmación
  explícita.
- El siguiente bloque de producto es el **Expediente de Valoración V1**
  (`docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`) — especificado en
  esta misma sesión, **no implementado**.
- El Bloque 1E (integración y activación del pipeline canónico) no se
  reactiva hasta superar un **checkpoint mínimo operativo y validado**
  del Expediente de Valoración — no su implementación completa: debe
  existir evidencia, sobre al menos un caso, de que el contexto
  específico de una empresa puede representarse antes del cálculo (ver
  `EXPEDIENTE-DE-VALORACION-V1.md` §0.1). Conectar narrativa y PDF a un
  motor sin esa evidencia repetiría el problema que esta reorientación
  busca corregir; el resto del Expediente puede seguir construyéndose de
  forma incremental después. Ver
  `docs/velarix/fases/FASE-01-EXACTITUD-FINANCIERA.md` y
  `docs/velarix/plan/MATRIZ-DE-DEPENDENCIAS.md` para la nota de
  reordenamiento agregada en esta sesión.
- 1A, 1B, 1C y 1D conservan su estado ya documentado (1D cerrado; 1A, 1B-P0
  cerrados; 1B-metodología y 1C sin cerrar formalmente, pendientes de
  revisor financiero externo) — nada de esto se reabre ni se reclasifica
  por esta reorientación.

## 14. Implicaciones comerciales

- El discurso comercial y de producto debe evitar cualquier lenguaje que
  sugiera valoración automática, autoservicio, o metodología idéntica por
  sector — ver `Negocio_Velarix_v4.2.md` §1.1 y §2.2 para la lista
  explícita de posicionamientos no permitidos.
- El precio, el modelo de cobro (§6 de `Negocio_Velarix_v4.2.md`) y el
  catálogo de servicios no cambian de fondo — la Valoración profesional
  (§5.3) se reencuadra para incluir explícitamente la construcción del
  Expediente de Valoración dentro de su alcance, sin cambiar su precio
  fijo ni su estructura de cobro.
- Se distinguen dos actividades bajo el nombre "Biblioteca de casos de
  valoración", que no deben confundirse: **(A) estudio manual de casos
  públicos** (primer caso: Tecnoglass) — **activo desde ahora**, sin
  interfaz, tablas, ingestión automática, scraping, Edge Functions, IA
  conectada ni motor modificado; sirve para diseñar y validar el
  Expediente antes de implementarlo; y **(B) biblioteca automatizada de
  casos** (ingestión automática, interfaz, scraping, procesamiento
  masivo) — esa sí permanece diferida. Ninguna de las dos se usará para
  concluir que empresas del mismo sector deben valorarse igual, sería la
  premisa exacta que se descarta aquí. Ver
  `docs/velarix/plan/BACKLOG-CLASIFICADO.md` (`BL-34` para B, `BL-35`
  para A) y `docs/velarix/plan/ROADMAP.md`.

## 15. Riesgos

- **Riesgo de sobre-diseño del Expediente de Valoración V1**: la
  especificación (`EXPEDIENTE-DE-VALORACION-V1.md`) identifica
  explícitamente un MVP realista, no el modelo completo descrito en esta
  reorientación, para evitar construir infraestructura que nadie usará
  todavía.
- **Riesgo de que "expert-led" se quede en discurso sin cambiar nada
  operativo**: mitigado por dejar la especificación técnica del
  Expediente como el próximo bloque concreto de trabajo, no solo una
  declaración de intenciones.
- **Riesgo de confundir esta reorientación con que el Bloque 1B-metodología
  o el Bloque 1C ya están cerrados**: no lo están — siguen dependiendo
  del mismo revisor financiero externo que ya se necesitaba antes de esta
  reorientación (`docs/velarix/bloque-1b-metodologia/PLAN-VALIDACION-REVISOR-FINANCIERO.md`).
- **Riesgo de que el fundador reabra el debate de modelo de negocio en
  cada sesión futura**: mitigado dejando este documento como referencia
  única y estable — una sesión futura de Claude Code debe leerlo antes de
  cuestionar la premisa expert-led, no rediscutirla desde cero.

## 16. Próximos bloques

1. **(A) Estudio manual de casos públicos** — **activo desde ahora**,
   primer caso Tecnoglass; ver
   `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md` §0. Insumo directo
   para el punto 2.
2. **Expediente de Valoración V1** — especificación ya creada
   (`docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`), a refinar con el
   punto 1; implementación pendiente de autorización explícita y
   separada.
3. **(B) Biblioteca automatizada de casos de valoración** — registrada
   como iniciativa diferida en backlog/roadmap (`BL-34`), sin ingestión
   automática todavía. No confundir con el punto 1 (A), que ya está en
   curso.
4. **Bloque 1E** — permanece bloqueado por 1B y 1C sin cerrar
   formalmente (**1D ya está cerrado**, no es un pendiente), más un
   checkpoint mínimo operativo y validado del Expediente de Valoración
   (no su implementación completa).
5. **Revisor financiero externo** — sigue siendo bloqueante para lo que
   específicamente bloquea (aprobación metodológica formal, decisiones
   financieras materiales, cierre de gates que requieren validación
   externa, primeros entregables profesionales) — no para el resto del
   avance de Velarix, que puede continuar sin esperarlo (ver §9 de este
   documento, precisión "qué bloquea y qué no").

---

## 17. Validación de esta sesión

- No se modificó ningún archivo de código (`.ts`, `.tsx`, `.sql`, Edge
  Functions, migraciones).
- No se tocó WACC, g, horizonte, escenarios, `Math.abs()`, ROE, impuestos,
  motores financieros, Supabase, Auth, ni JWT Signing Keys.
- No se desplegó nada.
- No se hizo push.
- No se reabrió ninguna auditoría de seguridad ni el Bloque 1E.
- No se creó ninguna tabla ni interfaz nueva.
- `Negocio_Velarix_v4.1.md` permanece sin eliminar.
- Los reportes históricos existentes (`docs/velarix/auditoria/*`,
  `docs/velarix/bloque-1a/*`, `docs/velarix/bloque-1b/*`,
  `docs/velarix/bloque-1b-metodologia/*` salvo la nota de reordenamiento
  explícita, `docs/velarix/bloque-1c/*`, `docs/velarix/bloque-1d/*`,
  `docs/velarix/seguridad-credenciales/*`) no se reescribieron para
  simular que la premisa expert-led ya regía cuando se escribieron —
  siguen describiendo el estado real en el momento en que se generaron.

## 18. Corrección de precisión (2026-08-10, mismo día)

Tras una precisión posterior del fundador sobre esta misma reorientación,
se corrigieron cuatro imprecisiones en este documento y en los demás
afectados (`Negocio_Velarix_v4.2.md`, `EXPEDIENTE-DE-VALORACION-V1.md`,
`ROADMAP.md`, `BACKLOG-CLASIFICADO.md`, `MATRIZ-DE-DEPENDENCIAS.md`,
`fases/FASE-01-EXACTITUD-FINANCIERA.md`, `GUIA-PASO-A-PASO.md`,
`plan/REGISTRO-DE-DECISIONES.md`):

1. El estudio manual de casos públicos (Biblioteca A, primer caso
   Tecnoglass) no debía quedar bloqueado hasta implementar el Expediente
   V1 — está activo desde ahora, y se distinguió explícitamente de la
   biblioteca automatizada (B), que sí permanece diferida.
2. El revisor/experto financiero externo no bloquea todo avance de
   Velarix — se precisó exactamente qué bloquea y qué no (§9).
3. La fecha de la reunión con el profesor que originó esta reorientación
   es **2026-08-10**, no 2026-08-06 (esa fecha corresponde al nombre
   histórico, incorrecto, de la carpeta del kit ya retirada — no se
   recrea).
4. La condición de entrada nueva de 1E se expresó con precisión: un
   checkpoint mínimo operativo y validado del Expediente, no su
   implementación completa; y se aclaró que 1D ya está cerrado, no es un
   pendiente actual.

Esta corrección no revirtió el commit `c6c02a3`, no modificó código, no
tocó Supabase/Auth/JWT Signing Keys, y no implementó el Expediente de
Valoración V1.
