# Guía paso a paso — todo lo que falta para que Velarix funcione como negocio

Este documento es un mapa general, en lenguaje simple, de **todo el camino**:
lo que ya está hecho, lo que falta, y quién tiene que hacer cada cosa (tú o
Claude Code). No reemplaza los documentos técnicos detallados que ya existen
en `docs/velarix/` — los resume y los ordena en una sola línea de tiempo para
que tengas el panorama completo sin tener que leer 20 archivos.

Es un documento vivo: lo iremos completando a medida que me des más
información (precios, decisiones legales, etc.).

---

## 0. Qué es Velarix, en una frase

Una boutique de valoración financiera para PYMEs colombianas, apoyada en
tecnología (no un SaaS de autoservicio). El motor calcula, pero **una persona
siempre revisa antes de entregar nada** — eso es parte del producto, no un
detalle técnico.

Fuente completa: `Negocio_Velarix_v4.1.md` (documento maestro de negocio).

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
| 1D (seguridad) | Que nadie pueda ver datos ajenos ni auto-asignarse un rol de administrador | 🟡 **Parcial** — ya está activo y probado en la base de datos de desarrollo; falta desplegar 2 funciones (bloqueado por un permiso de tu cuenta de Supabase, ver abajo) |
| 1E (conectar todo de verdad) | Que el PDF y el informe final usen el motor ya corregido, no el que corre en el navegador | ⛔ No iniciado — depende de cerrar 1B, 1C y 1D primero |
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

### Paso 1 — Terminar de activar la seguridad (Bloque 1D)

**Quién lo hace:** tú, en el dashboard de Supabase (no es código).

Al desplegar las Edge Functions me encontré con un error de permisos: tu
cuenta/token conectado a Supabase no tiene privilegios para desplegar
funciones ni ver las llaves del proyecto (aunque sí puede modificar la base
de datos, por eso las migraciones sí funcionaron).

**Qué tienes que revisar tú:**
1. Entra a supabase.com/dashboard → tu proyecto → configuración de
   organización/miembros.
2. Confirma que tu cuenta tenga el rol **Owner** o **Administrator** del
   proyecto (no un rol limitado tipo "Developer" con permisos recortados).
3. Avísame cuando lo confirmes, y retomamos el despliegue de
   `ejecutar-calculo` y `continuar-tras-revision`.

Detalle completo de lo que ya se probó: `docs/velarix/bloque-1d/REPORTE-ACTIVACION-1D.md`.

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

Esto **bloquea** varias cosas: la aprobación de los casos dorados (Paso 4),
el poder cobrar cualquier servicio con datos reales (sección 17 del
documento de negocio), y el inicio de los pilotos (Fase 3). Es la pieza de
negocio más urgente ahora mismo, junto con el Paso 1.

### Paso 4 — Aprobación formal de los casos dorados (cierre real de Bloque 1C)

**Quién lo hace:** el revisor financiero externo, con tu coordinación.

Ya existen 3 casos de prueba (empresa estable, empresa de alto crecimiento,
empresa en dificultades) ejecutados contra el motor real, con resultados
documentados. Falta que una persona con criterio financiero los revise y
diga "esto está bien" o "esto hay que ajustarlo".

Documento a revisar: `docs/velarix/bloque-1c/PAQUETE-REVISION-FINANCIERA.md`
(hecho específicamente para que un revisor externo lo lea y firme).

### Paso 5 — Bloque 1E: conectar todo de verdad

**Quién lo hace:** Claude Code, una vez cerrados 1B, 1C y 1D.

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

- [ ] Confirmar permisos de tu cuenta en Supabase (Paso 1).
- [ ] Conseguir un revisor financiero externo (Paso 3).
- [ ] Aprobar (o mandar a ajustar) las 10 decisiones de metodología (Paso 2).
- [ ] Definir forma legal/tributaria del negocio.
- [ ] Redactar o conseguir un NDA y un contrato base.
- [ ] Validar el precio real de la valoración profesional (hoy es una hipótesis).
- [ ] Decidir política de privacidad y de eliminación de datos de un cliente.

---

## 4. Próximo paso recomendado ahora mismo

**El Paso 1** (revisar tus permisos en Supabase) es el más rápido de
resolver y desbloquea seguir con el Bloque 1D. En paralelo, el **Paso 3**
(conseguir revisor financiero) es el que más tiempo humano toma, así que
conviene empezar a moverlo ya, aunque no sea código.

---

## 5. Dónde encontrar el detalle de cada cosa

- Estado técnico completo, bloque por bloque: `docs/velarix/fases/FASE-01-EXACTITUD-FINANCIERA.md`
- Todas las fases del negocio (0 a 8): `docs/velarix/plan/ROADMAP.md`
- Todo lo pendiente de código, ordenado por prioridad: `docs/velarix/plan/BACKLOG-CLASIFICADO.md`
- Riesgos abiertos: `docs/velarix/plan/MATRIZ-DE-RIESGOS.md`
- Las 10 decisiones financieras pendientes: `docs/velarix/bloque-1b-metodologia/DECISIONES-FINANCIERAS-PENDIENTES.md`
- El documento de negocio completo (precios, contratos, criterios para cobrar, etc.): `Negocio_Velarix_v4.1.md`
