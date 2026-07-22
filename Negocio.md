# Velarix — Definición de Negocio y Plan de Desarrollo

> Documento de referencia única. Cualquier decisión de producto, feature o
> prioridad técnica se valida contra este documento antes de tocar código.
> Si algo en el código contradice lo que dice aquí, este documento manda —
> se corrige el código, no al revés.
>
> **Estructura:** el documento avanza por Pasos, en orden. Cada Paso
> termina con las decisiones ya confirmadas contigo (✅) o, si algo sigue
> abierto, con la pregunta puntual pendiente.

Última actualización: 2026-07-22 (v3 — modelo de retainer confirmado)

---

## Paso 1 — Posicionamiento y propuesta de valor

**Qué es Velarix:** una **boutique de asesoría financiera corporativa**
(corporate finance advisory), en la línea de lo que hace la práctica de
*corporate finance* de un Big Four (PwC, KPMG) o una boutique independiente
de valoración — potenciada por un motor propio de IA + cálculo
determinístico que le permite operar con la velocidad y el costo de una
herramienta de software, no con la estructura de costos de una consultora
tradicional con decenas de analistas.

**✅ Confirmado — cómo trabajas:** cierras **proyectos puntuales** (no
suscripciones ni membresías), como haría una boutique de valoración. Cada
cliente contrata un proyecto de valoración con un alcance definido.

**✅ Confirmado — alcance:** no es solo entregar un PDF. **Acompañas al
cliente en el proceso** (por ejemplo, en la conversación con un
inversionista o un banco), y ese acompañamiento se factura como tiempo
adicional — no está incluido gratis en el fee del proyecto base.

**Mercado objetivo (sin cambios):** PYME colombiana, contadores, CFOs,
fondos de inversión pequeños — gente que hoy no puede pagar un Big Four
pero necesita un nivel de rigor similar.

**Contexto real de arranque:** hoy operas solo, y además estudias — el
crecimiento inicial es deliberadamente lento (ver Paso 2 y Paso 13). Eso no
es un problema a resolver ahora, es el punto de partida realista.

---

## Paso 2 — Modelo de ingresos: Retainer (como un abogado)

**✅ Confirmado — mecanismo de cobro:** modelo de **retainer**, igual a como
factura un abogado — el cliente deja un anticipo, y ese anticipo se va
consumiendo por horas de trabajo (análisis, acompañamiento, llamadas,
ajustes). Cuando se agota, se recarga si el proyecto sigue activo.

Esto resuelve exactamente lo que planteaste al inicio: el costo de IA por
proyecto es de unos pocos centavos de dólar — una fracción irrelevante
frente a un retainer medido en horas de trabajo profesional. Ya no hay que
calcular "cuántos análisis cubre el plan" — cada hora facturada ya cubre
de sobra el costo de cómputo.

**Dos etapas de precio (tu propia distinción):**

| Etapa | Cuándo | Cómo cobras |
|---|---|---|
| **Etapa 1 — arranque** | Ahora, mientras validas y construyes reputación | Precio "de abogado independiente" — accesible, pensado para que el primer cliente diga que sí |
| **Etapa 2 — establecido** | Cuando ya tengas casos de éxito y reputación en el sector | Precio alineado con lo que cobran las firmas grandes de asesoría/valoración corporativa en tu sector objetivo |

**Punto de partida sugerido para la Etapa 1** (cifra ilustrativa, no
validada — ajústala cuando hables con tu primer cliente real):
- Anticipo inicial: **$1.500.000 – $3.000.000 COP** por proyecto de
  valoración completa.
- Tarifa por hora sobre ese anticipo: **$80.000 – $150.000 COP/hora**
  (análisis adicional, ajustes, acompañamiento, llamadas).
- El "Diagnóstico Express" (mayormente IA, sin acompañamiento) puede seguir
  existiendo como opción de entrada más barata y sin consumo de retainer —
  útil para clientes que solo quieren el informe, no acompañamiento.

**✅ Confirmado — el gancho gratuito no es una calculadora de autoservicio:**
lo que quieres es que el estimador rápido sirva sobre todo para **abrir una
conversación de venta contigo** ("hablar con el cliente para venderme"), no
para que el cliente resuelva todo solo sin hablar contigo. Aun así, debe
verse en la página como algo serio y funcional — no como un formulario
vacío. El precio de cada servicio se termina de definir en esa
conversación, no necesariamente publicado de forma rígida en la página.

### Pendiente concreto (no bloqueante, para cuando llegues ahí):
- Definir el monto exacto del anticipo y la tarifa/hora con tu primer
  cliente real, y ajustar desde ahí.

---

## Paso 3 — Roles y actores

| Rol | Quién es | Qué hace |
|---|---|---|
| **Cliente** | PYME, contador, CFO, fondo pequeño que contrata un proyecto | Deja el anticipo (retainer), sube documentos, recibe el entregable, puede solicitar acompañamiento facturado por horas |
| **Analista/Consultor** (`role = analyst`) | Tú hoy; en el futuro, analistas contratados | Revisa el borrador que genera la IA, hace ajustes de juicio profesional, acompaña al cliente en decisiones reales, registra horas contra el retainer |
| **Admin** (`role = admin`) | Tú, como operador de Velarix | Gestiona clientes, retainers, proyectos activos, ve auditoría completa, gestiona actualización de datos macro/sectoriales |
| **Visitante (sin login)** | Cualquiera que llega a la landing | Estimador rápido gratuito — pensado como gancho de conversación, no como entregable final |

**Nota sobre crecimiento (tu propia respuesta):** si el negocio crece,
contratas más gente — pero la IA se queda como **base permanente** para el
análisis de estados financieros y el funcionamiento general de la
plataforma, no como algo que se reemplaza. Lo que sí escala con más
personal es la parte de **juicio humano y acompañamiento en decisiones
reales** — ahí es donde entran nuevos analistas, no a hacer lo que ya hace
bien la IA.

---

## Paso 4 — Catálogo de servicios

| Entregable | Estimador gratis | Diagnóstico Express | Valoración Full Service (retainer) |
|---|:---:|:---:|:---:|
| Rango de EV rápido (sin login) | Sí | — | — |
| Conversación de venta contigo | Sí (el objetivo real) | — | — |
| Carga de documentos reales | — | Sí | Sí |
| Motor DCF completo (WACC, FCFF, TV, sensibilidad) | — | Sí | Sí |
| PDF institucional de 18 páginas | — | Sí | Sí |
| Benchmark sectorial (Damodaran + macro Colombia) | — | Sí | Sí |
| Revisión humana completa (juicio profesional, no solo QA) | — | — | Sí |
| Acompañamiento en decisiones reales (negociación, presentación) | — | — | Sí, facturado por horas contra el retainer |

---

## Paso 5 — Flujos de trabajo

### 5.1 Flujo Diagnóstico Express (mayormente IA, sin retainer)

```
Cliente contrata → sube documentos → parse-document → map-accounts
→ validate-analysis → build-structured-input → ejecutar-calculo
→ generate-narrative → QA rápido tuyo antes de entregar
→ entrega del PDF
```

### 5.2 Flujo Valoración Full Service (retainer)

```
Cliente deja el anticipo (retainer) → sube documentos
→ [mismo pipeline técnico: parse → map-accounts → validate → calculo
   → narrativa con IA genera el primer borrador completo]
→ Analista (tú) revisa a fondo — ✅ regla confirmada: para el trabajo
  estándar de análisis, el resultado de la IA es suficiente punto de
  partida; pero antes de acompañar al cliente en una decisión real
  (negociar con un inversionista, presentar ante junta), el analista debe
  tener los estados financieros completamente claros y verificados a
  fondo, no solo confiar en el resumen de la IA.
→ Horas de revisión y de acompañamiento se registran contra el retainer
→ Entrega del informe final + acompañamiento en la(s) decisión(es) real(es)
```

### 5.3 Flujo del estimador gratis (gancho de venta, no autoservicio)

```
Visitante llena formulario corto (sector, ingresos, EBITDA aproximado)
→ Estimador rápido en el navegador (sin IA, sin backend) devuelve un rango
  de EV y el múltiplo sectorial de referencia
→ CTA principal: "Hablemos de tu caso" (conversación directa contigo),
  no un checkout automático
```

---

## Paso 6 — Arquitectura de datos

### 6.1 Tablas existentes (16) — ya en producción, no se tocan sin razón

`user_profiles`, `analyses`, `documents`, `parsed_documents`,
`account_mappings`, `validation_results`, `structured_inputs`,
`calculation_results`, `narrative_reports`, `generated_reports`,
`manual_reviews`, `analysis_jobs`, `audit_events`, `data_sources`,
`snapshot_updates`, `update_jobs_log`.

### 6.2 Campos/tablas nuevas necesarias para el modelo de retainer

Para **retainers y horas facturadas** (reemplaza lo que antes era
"suscripciones"):
- `retainers` — un registro por proyecto contratado: cliente, monto del
  anticipo, saldo disponible, tarifa/hora acordada, estado (activo/agotado/
  cerrado).
- `time_entries` — cada hora (o fracción) registrada contra un retainer:
  fecha, descripción del trabajo (revisión, ajuste, llamada,
  acompañamiento), horas, quién la registró (`consultor_id`).
- `payments` — recargas del retainer (anticipo inicial + recargas
  posteriores), monto, fecha, método (transferencia, Nequi, etc.).

Para el **flujo de revisión humana** (extender `manual_reviews`, ya
existente):
- `consultor_id` (FK a `user_profiles` con `role = analyst`)
- `tipo_revision`: `qa_rapido` (Express) | `full_service_analisis` |
  `full_service_acompanamiento`
- `anotaciones_consultor` (texto/JSON con los ajustes hechos)
- `horas_registradas` (referencia a `time_entries`)

Para **cumplimiento de datos personales** (ver Paso 12):
- Campo de retención en `documents` — cuánto tiempo se conservan los
  estados financieros de un cliente antes de poder pedir su eliminación.

---

## Paso 7 — Reglas de negocio

Reglas técnicas ya vigentes (no se cambian sin discutirlo):

- **BAL_001** (ecuación patrimonial descuadrada) siempre es `WARNING`,
  nunca `CRITICAL` — nunca bloquea el análisis.
- La conversión de moneda se aplica en el *structured input*, nunca en el
  parser.
- El motor financiero (WACC/DCF) va inline en la Edge Function
  `ejecutar-calculo`, no como import externo.
- El Account Mapper nunca debe mapear subtotales, solo cuentas base, y debe
  **sumar** todos los sub-ítems de una misma cuenta canónica (hoy roto,
  ver Paso 11, Bug 1/4).

Reglas nuevas del modelo de retainer:

- Ninguna hora de acompañamiento en decisiones reales se registra sin que
  el analista haya revisado a fondo los estados financieros del caso — no
  se factura tiempo sobre un análisis que solo vio la IA.
- Si el retainer se agota a mitad de un proyecto, el trabajo se pausa hasta
  que el cliente recargue — esto debe quedar claro desde el contrato
  inicial, no descubrirse a mitad de camino.
- El estimador gratis nunca genera PDF ni cobro — es exclusivamente gancho
  de conversación.

---

## Paso 8 — Autenticación y seguridad

- **Auth:** Supabase Auth — email/password como mínimo. Evaluar login con
  Google más adelante para reducir fricción a CFOs/contadores.
- **RLS (Row Level Security):** cada cliente solo ve sus propios proyectos
  y su propio saldo de retainer. El rol `analyst` necesita política
  adicional para ver los proyectos **asignados a él**, no todos los de
  todos los clientes.
- **Datos sensibles:** los documentos son estados financieros reales de
  empresas reales. Confirmar que ningún analista o admin puede descargar
  el archivo original de un cliente sin que quede registrado en
  `audit_events`.
- **Secretos:** `ANTHROPIC_API_KEY`, `RESEND_API_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` viven solo como secrets de Supabase Edge
  Functions, nunca en el frontend ni en el repositorio.

---

## Paso 9 — Notificaciones por correo (Resend)

| Evento | A quién |
|---|---|
| Proyecto contratado / anticipo recibido | Cliente + analista asignado |
| Documentos recibidos | Analista |
| Diagnóstico Express entregado | Cliente |
| Full Service: borrador de IA listo para revisión | Analista |
| Full Service: revisión completa, listo para entregar | Cliente |
| Retainer por debajo de un umbral (ej. 20% del saldo) | Cliente + analista |
| Llamada de acompañamiento agendada | Cliente + analista |

---

## Paso 10 — Integraciones

| Integración | Para qué | Estado |
|---|---|---|
| Anthropic (Claude) | Lectura de documentos, homologación de cuentas, redacción de narrativa | Migrado — pendiente configurar `ANTHROPIC_API_KEY` en Supabase |
| Supabase | Auth, base de datos, storage, Edge Functions | En producción |
| Resend | Correos transaccionales | En producción — confirmar cobertura de eventos (Paso 9) |
| Cobro (manual por ahora) | Anticipo y recargas de retainer | Manual (transferencia/Nequi) en Fase 3; automatizar solo si el volumen lo justifica (Fase 5) |
| Fuente de datos macro/sectoriales (Damodaran, Banrep, DANE) | Actualización de `velarix-datos-2026` | Parcialmente manual — confirmar automatización real |

---

## Paso 11 — Riesgos técnicos conocidos (resolver antes de cobrarle a alguien)

No se puede vender un servicio de valoración financiera con estos bugs
activos:

1. **Consolidación de sub-ítems rota (confirmado, causa raíz encontrada):**
   `getAccountValue` en `build-structured-input` usa `.find()` en vez de
   sumar — toma solo la primera fila que matchea una cuenta canónica,
   nunca la suma. Afecta EBITDA (opex) y caja (efectivo + CDT).
2. **Moneda en el PDF no respeta la elección del usuario (confirmado):** no
   existe `formatMoneda()`, el PDF siempre muestra USD.
3. **TRM y otras constantes duplicadas a mano** entre Edge Functions y
   frontend — riesgo de que diverjan con el tiempo.
4. **ROE/ROA, timer del panel de progreso, paginación doble del PDF** —
   reportados por ti, aún sin verificar contra el código actual.

---

## Paso 12 — Cumplimiento y legal (Colombia)

- Los estados financieros de un cliente son datos personales y
  empresariales sensibles bajo la **Ley 1581 de 2012 (Habeas Data)**:
  política de tratamiento de datos visible, consentimiento explícito al
  subir documentos, mecanismo real de eliminación a solicitud.
- **✅ Confirmado:** estás cómodo con el nivel de responsabilidad
  profesional que implica venderte como "asesoría" y no solo como
  "herramienta" — de hecho lo ves como lo que hace el negocio más
  monetizable y escalable de verdad. Aun así, hay que dejar explícito en
  los términos del servicio qué garantiza Velarix y qué queda como
  decisión final del cliente (especialmente en los momentos de
  acompañamiento en decisiones reales).
- Un modelo de retainer (anticipo + consumo por horas) es una figura común
  en servicios profesionales en Colombia (así facturan abogados y
  contadores independientes) — no requiere una estructura legal especial
  distinta a la de cualquier prestación de servicios profesionales, pero sí
  conviene un contrato simple que explique cómo se consume el anticipo y
  qué pasa si se agota.
- El PDF ya tiene una página de aviso legal — revisar que el lenguaje
  cubra: (a) que Velarix no es una firma auditora certificada, (b) que la
  valoración es una estimación profesional basada en los datos entregados,
  no una opinión de valor auditada.

---

## Paso 13 — Plan de acción por fases

> Orden estricto. No se salta una fase sin razón explícita. El ritmo de
> crecimiento está pensado para 1–2 proyectos al mes al inicio — es
> intencional, no un problema a resolver.

### Fase 0 — Fundamentos (en curso)
- [x] Desconexión completa de Lovable (IA migrada a Anthropic directo)
- [x] Git inicializado y conectado a GitHub (`Paginas-Web-Henao/Velarix`)
- [x] Node.js instalado, dependencias reinstaladas, build verificado
- [x] Modelo de negocio definido: boutique de valoración, retainer tipo
  abogado (este documento, v3)
- [ ] Configurar `ANTHROPIC_API_KEY` en Supabase

### Fase 1 — Estabilización técnica (antes de tocar un solo cliente nuevo)
- [ ] Resolver Bug 1/4 (consolidación de sub-ítems) — el más crítico
- [ ] Resolver Bug 6 (moneda en PDF)
- [ ] Verificar y resolver Bugs 2, 3, 5, 7
- [ ] Reorganizar repo en `frontend/` + `backend/`
- [ ] Extraer fórmulas financieras duplicadas a un módulo compartido

### Fase 2 — MVP funcional del flujo Full Service
- [ ] Correr el flujo completo con los archivos de prueba reales
  (`ER_PR1.xlsx`, `ESF_PR1.xlsx`) y validar los números contra los valores
  correctos ya documentados
- [ ] Confirmar cobertura de notificaciones por correo (Paso 9)

### Fase 3 — Primeros 1-2 clientes reales (tu meta de 60 días)
- [ ] Definir el monto exacto del anticipo y la tarifa/hora con el primer
  cliente real (ver Paso 2)
- [ ] Onboarding manual de 1 o 2 clientes — ritmo deliberadamente lento
- [ ] Cobro manual (transferencia/Nequi) del anticipo
- [ ] Registrar horas manualmente (aunque sea en una hoja de cálculo) antes
  de construir `time_entries` en la base de datos — validar el proceso a
  mano primero

### Fase 4 — Formalizar el flujo de revisión y acompañamiento
- [ ] Extender `manual_reviews` con los campos del Paso 6.2
- [ ] Construir `retainers` y `time_entries` en la base de datos
- [ ] Conectar el flujo con notificaciones (saldo de retainer, etc.)

### Fase 5 — Automatización de cobro (solo si el volumen lo justifica)
- [ ] Evaluar pasarela de pago (Wompi/ePayco) — no antes de tener demanda
  validada
- [ ] Automatizar recargas de retainer

### Fase 6 — Seguridad y cumplimiento
- [ ] Auditoría completa de políticas RLS (especialmente rol `analyst`)
- [ ] Política de datos personales + mecanismo de borrado
- [ ] Contrato simple de retainer + términos de servicio con el lenguaje
  de responsabilidad profesional del Paso 12

### Fase 7 — Escalamiento
- [ ] Contratar analistas adicionales para la parte de juicio humano y
  acompañamiento (no para reemplazar el motor de IA, que se queda como
  base permanente)
- [ ] Transición de precio Etapa 1 → Etapa 2 (Paso 2) cuando ya haya
  reputación y casos de éxito
- [ ] Automatización real de actualización de datos macro/sectoriales

---

## Estado del documento

Todas las decisiones estructurales quedaron confirmadas en esta versión.
Lo único pendiente es táctico, no estratégico: el monto exacto del
anticipo y la tarifa/hora (Fase 3) — eso se define con el primer cliente
real, no antes.

Cuando quieras, seguimos con la **Fase 1** (los bugs técnicos) para dejar
el producto listo antes de tocar a un cliente de verdad.
