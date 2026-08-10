# Guía paso a paso — todo lo que falta para que Velarix funcione como negocio

Este documento es un mapa general, en lenguaje simple, de **todo el camino**:
lo que ya está hecho, lo que falta, y quién tiene que hacer cada cosa (tú o
Claude Code). No reemplaza los documentos técnicos detallados que ya existen
en `docs/velarix/` — los resume y los ordena en una sola línea de tiempo para
que tengas el panorama completo sin tener que leer 20 archivos.

Es un documento vivo: lo iremos completando a medida que me des más
información (precios, decisiones legales, etc.).

> **Actualización 2026-08-10 — reorientación expert-led (`D-09`),
> precisada el mismo día tras corrección del fundador**: en una
> conversación con un profesor de finanzas el **2026-08-10**,
> reorientaste a Velarix como boutique de valoración expert-led — cada
> empresa se entiende individualmente antes de valorarla, en vez de
> aplicar una metodología uniforme por sector. La fuente de negocio
> vigente pasó de `Negocio_Velarix_v4.1.md` a `Negocio_Velarix_v4.2.md`.
> Esto agrega dos pasos nuevos: un **estudio manual de casos públicos**
> (primer caso: Tecnoglass) que **ya está activo, sin depender de ningún
> revisor ni bloque técnico** (ver nuevo Paso 3.5), y un checkpoint
> mínimo del Expediente antes del Bloque 1E — no su implementación
> completa (ver Paso 4.5 y Paso 5, actualizados). El resto de esta guía
> sigue vigente sin cambios. Detalle completo de la reorientación:
> `docs/velarix/plan/REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md`.

---

## 0. Qué es Velarix, en una frase

Una boutique de valoración empresarial expert-led para PYMEs colombianas,
apoyada en tecnología (no un SaaS de autoservicio ni un motor que decide la
metodología por sector). Nicolás y expertos financieros comprenden cada
empresa antes de calcular; el motor ejecuta lo ya interpretado y aprobado, y
**una persona siempre revisa antes de entregar nada** — eso es parte del
producto, no un detalle técnico.

Fuente completa: `Negocio_Velarix_v4.2.md` (documento maestro de negocio).

---

## 1. Dónde estás hoy (resumen honesto)

**Del lado técnico** (lo que se ha hecho en el código, hasta hoy):

| Bloque | Qué es | Estado |
|---|---|---|
| Fase 0 | Auditoría completa del código y el negocio | ✅ Cerrada |
| 1A | Diseño: comparar los dos motores de cálculo, definir cuál manda | ✅ Cerrado |
| 1B-P0 | Corregir bugs financieros (suma de cuentas, moneda, etc.) | ✅ Cerrado |
| 1B-M | Poner de acuerdo la metodología entre el motor del cliente y el del servidor | ✅ Cerrado técnicamente — quedan **10 decisiones de metodología** que solo tú o un revisor financiero pueden aprobar |
| 1C (casos dorados + trazabilidad) | Probar el motor con casos de ejemplo, y poder rastrear de dónde salió cada cifra | ✅ Cerrado técnicamente — los casos son **provisionales**, falta que un revisor financiero externo los apruebe |
| 1D (seguridad) | Que nadie pueda ver datos ajenos ni auto-asignarse un rol de administrador | ✅ **Cerrado** (2026-08-05) — desplegado y probado en la base de datos de desarrollo; ya no es un pendiente |
| 1E (conectar todo de verdad) | Que el PDF y el informe final usen el motor ya corregido, no el que corre en el navegador | ⛔ No iniciado — depende de cerrar 1B y 1C (1D ya está cerrado), más un checkpoint mínimo del Expediente de Valoración (ver Paso 4.5) |
| Fase 2 en adelante | Seguridad completa, pilotos, ventas, primer cliente, repetibilidad, automatización | ⛔ No iniciado |

**Del lado de negocio** (lo que no es código, y nadie más que tú puede resolver):

- Todavía no existe un **revisor financiero externo** identificado.
- Todavía no existen **NDA ni contrato** listos para usar con un cliente.
- El **precio** de la valoración profesional sigue siendo una hipótesis, no un número validado.
- No se ha decidido la **forma legal/tributaria** del negocio.
- No se ha hecho ningún piloto real todavía.

En resumen: **el producto técnico va bastante más adelantado que las
decisiones de negocio que le dan sustento.** Ese es normal en esta etapa, pero
es importante que lo tengas claro — no puedes vender ni cobrar todavía,
aunque el código funcione.

---

## 2. La ruta completa, paso a paso

La regla de oro (ya la venimos siguiendo): **no se salta de fase**. Cada fase
tiene que cerrarse antes de abrir la siguiente. Esto es intencional — evita
que construyamos sobre algo que todavía no sabemos si está bien.

### Paso 1 — Activar la seguridad (Bloque 1D) — ✅ completado (2026-08-05)

**Quién lo hizo:** tú, en el dashboard de Supabase.

El permiso de tu cuenta se resolvió, ambas Edge Functions
(`ejecutar-calculo`, `continuar-tras-revision`) quedaron desplegadas y
verificadas, y **1D está cerrado — ya no es un pendiente**. Se deja este
paso documentado por historial, no como pendiente activo.

Detalle completo: `docs/velarix/bloque-1d/REPORTE-ACTIVACION-1D.md`.

### Paso 2 — Cerrar las 10 decisiones de metodología financiera pendientes

**Quién lo hace:** tú y/o un revisor financiero externo (no es código).

Hay 10 preguntas financieras que el código **no puede responder solo** —
son decisiones de criterio profesional (ejemplo: ¿el crecimiento perpetuo
debe ser fijo en 3% o depender de la inflación real? ¿qué hacer cuando el
patrimonio de una empresa es negativo?). Cada una tiene alternativas
explicadas y una recomendación técnica, pero la decisión final es tuya o de
un revisor.

Lista completa: `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md`.

### Paso 3 — Conseguir un revisor financiero externo

**Quién lo hace:** tú (no es código).

**Precisión importante (2026-08-10):** el revisor **no bloquea todo el
avance de Velarix** — bloquea específicamente: la aprobación formal de
los casos dorados (Paso 4), cobrar cualquier servicio con datos reales
(sección 17 del documento de negocio), y el inicio de los pilotos
(Fase 3). **No bloquea**: estudiar casos públicos (Paso 3.5), construir
hipótesis, analizar cuentas, diseñar preguntas, ni diseñar o refinar el
Expediente de Valoración — todo eso puede avanzar ya, sin esperar al
revisor. Sigue siendo la pieza de negocio más urgente para lo que sí
bloquea, junto con validar el precio real.

### Paso 3.5 (nuevo, 2026-08-10) — Estudiar casos públicos para diseñar el Expediente

**Quién lo hace:** tú (y Claude Code para documentar), **ya, sin esperar
al revisor ni a ningún bloque técnico**.

Antes de implementar el Expediente de Valoración, conviene analizar
manualmente empresas con información financiera pública para descubrir
qué necesita representar de verdad. Primer caso previsto: **Tecnoglass**.
Para cada caso se documenta: contexto de la empresa, cuentas relevantes,
ambigüedades, información faltante, preguntas que le harías a gerencia,
posibles normalizaciones, hipótesis de proyección, supuestos que
requieren juicio, y dudas financieras reales. Ese análisis se contrasta
contra `EXPEDIENTE-DE-VALORACION-V1.md` y, si el caso demuestra que faltan
o sobran conceptos, se ajusta la especificación **antes** de implementar
nada. Las dudas reales que surjan de estos casos son justamente lo que le
llevas al profesor — no le pides que diseñe Velarix desde cero.

Modelo: `Velarix estudia → Nicolás propone → Velarix documenta → experto
critica casos/decisiones reales → Velarix corrige → el sistema aprende`.
No al revés (esperar al experto para saber qué construir).

### Paso 4 — Aprobación formal de los casos dorados (cierre real de Bloque 1C)

**Quién lo hace:** el revisor financiero externo, con tu coordinación.

Ya existen 3 casos de prueba (empresa estable, empresa de alto crecimiento,
empresa en dificultades) ejecutados contra el motor real, con resultados
documentados. Falta que una persona con criterio financiero los revise y
diga "esto está bien" o "esto hay que ajustarlo".

Documento a revisar: `docs/velarix/bloque-1c/PAQUETE-REVISION-FINANCIERA.md`
(hecho específicamente para que un revisor externo lo lea y firme).

### Paso 4.5 (nuevo, 2026-08-10) — Primer checkpoint del Expediente de Valoración V1

**Quién lo hace:** Claude Code, con tu autorización explícita, después de
que el Paso 3.5 haya dado suficiente evidencia sobre al menos un caso.

No hace falta implementar el Expediente completo antes de seguir — hace
falta un **checkpoint mínimo operativo y validado**: suficiente para
demostrar, sobre al menos un caso real o público, que el contexto
específico de una empresa (su historia, sus cuentas ambiguas, las
preguntas que generó, las normalizaciones propuestas) puede representarse
antes del cálculo. El resto del Expediente (Pasos 2 a 6 de su
especificación técnica) puede seguir construyéndose de forma incremental
después de este checkpoint, en paralelo con el resto de la ruta.

Especificación completa: `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`.

### Paso 5 — Bloque 1E: conectar todo de verdad

**Quién lo hace:** Claude Code, una vez cerrados 1B y 1C (**1D ya está
cerrado**, no es un pendiente) **y** superado el checkpoint mínimo del
Expediente de Valoración (Paso 4.5) — no se exige su implementación
completa.

Hoy el PDF que descarga un cliente se recalcula en el navegador, sin pasar
por el motor del servidor (el que ya corregimos) ni por la narrativa
generada con IA. En este bloque se conecta todo para que lo que el cliente
recibe sea exactamente el resultado ya revisado y aprobado. Es la última
pieza técnica antes de poder pensar en recibir datos reales de un cliente.

### Paso 6 — Fase 2: seguridad y cumplimiento completo

**Quién lo hace:** mitad Claude Code (RLS, storage, logs), mitad tú/abogado
(NDA, contrato, política de privacidad, forma de eliminar datos de un
cliente si lo pide).

Esto es lo que te habilita legalmente a recibir información real de una
empresa. Sin esto, aunque el motor esté perfecto, no deberías tocar datos
de un cliente de verdad.

### Paso 7 — Fase 3: pilotos controlados

**Quién lo hace:** tú, con acompañamiento técnico.

Mínimo 2 pilotos reales (pero controlados, no un cliente pagando todavía),
con horas medidas, errores registrados, y revisión externa. Esto es lo que
te va a decir si el precio, el tiempo y el proceso que imaginaste
funcionan de verdad.

### Paso 8 — Fase 4: preparación comercial

**Quién lo hace:** tú.

Definir precio real (ya no hipótesis), descuentos máximos, propuesta
comercial, muestra de informe, preguntas de precalificación de clientes,
proceso de cierre de venta.

### Paso 9 — Fase 5: primer cliente pagado

El primer proyecto real, de principio a fin: contrato firmado, anticipo
cobrado, entrega revisada externamente, margen medido, lecciones
documentadas.

### Paso 10 — Fases 6, 7 y 8: repetir, automatizar, escalar

Solo después de que el primer cliente (Paso 9) haya salido bien y se
repita un par de veces más. Aquí es donde eventualmente entrarían cosas
como cobros automáticos, asignación de casos entre varios analistas, etc.
— nada de esto se construye antes de tiempo.

---

## 3. Lista corta: cosas que **solo tú** puedes resolver (no son de código)

Esta es la lista que más te conviene mirar seguido, porque son las que
frenan el avance aunque el código esté listo:

- [x] Confirmar permisos de tu cuenta en Supabase (Paso 1) — completado 2026-08-05.
- [ ] Conseguir un revisor financiero externo (Paso 3).
- [ ] Aprobar (o mandar a ajustar) las 10 decisiones de metodología (Paso 2).
- [ ] Definir forma legal/tributaria del negocio.
- [ ] Redactar o conseguir un NDA y un contrato base.
- [ ] Validar el precio real de la valoración profesional (hoy es una hipótesis).
- [ ] Decidir política de privacidad y de eliminación de datos de un cliente.

---

## 4. Próximo paso recomendado ahora mismo

**El Paso 3.5** (estudiar el primer caso público, Tecnoglass) puede
avanzar ya mismo, sin depender de nadie más. En paralelo, el **Paso 3**
(conseguir revisor financiero) es el que más tiempo humano toma, así que
conviene empezar a moverlo ya, aunque no sea código. El Paso 1 ya está
completado (2026-08-05).

---

## 5. Dónde encontrar el detalle de cada cosa

- Estado técnico completo, bloque por bloque: `docs/velarix/fases/FASE-01-EXACTITUD-FINANCIERA.md`
- Todas las fases del negocio (0 a 8): `docs/velarix/plan/ROADMAP.md`
- Todo lo pendiente de código, ordenado por prioridad: `docs/velarix/plan/BACKLOG-CLASIFICADO.md`
- Riesgos abiertos: `docs/velarix/plan/MATRIZ-DE-RIESGOS.md`
- Las 10 decisiones financieras pendientes: `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md`
- La reorientación expert-led y por qué se tomó: `docs/velarix/plan/REORIENTACION-BOUTIQUE-EXPERT-LED-2026-08-10.md`
- Especificación del Expediente de Valoración V1: `docs/velarix/plan/EXPEDIENTE-DE-VALORACION-V1.md`
- El documento de negocio completo (precios, contratos, criterios para cobrar, etc.): `Negocio_Velarix_v4.2.md`
