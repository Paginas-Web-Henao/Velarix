# Reporte de contraste — Caso 02 (Organización Terpel) vs. `EXPEDIENTE-DE-VALORACION-V1.md`

**Fecha:** 2026-08-10
**Insumo:** `docs/velarix/casos/02-terpel/CASO-02-TERPEL-V0.md`
**Insumo previo:** `docs/velarix/casos/01-tecnoglass/CASO-01-TECNOGLASS-V0.md`
y su reporte de contraste (misma carpeta que ese caso).
**Objetivo:** determinar, con el Caso 02 como segundo punto de dato
independiente, qué de lo confirmado por Tecnoglass **sobrevive**, qué
**se profundiza o cambia de forma**, y qué necesidad **nueva** aparece que
el Expediente V1 (ya actualizado por el Caso 01) no representaba
todavía. El propósito no es meter todo lo imaginable al Expediente —
solo agregar o refinar lo que dos casos, no uno, demuestran necesario.

**Regla rectora de este reporte**: dos casos muestran patrones; dos casos
no crean leyes universales. Ningún hallazgo de este reporte se trata como
cerrado solo por haber aparecido en dos empresas.

**Clasificaciones usadas:** `SOBREVIVE — REFORZADA` (el patrón de
Tecnoglass reaparece con evidencia adicional e independiente),
`SOBREVIVE, PERO SE PROFUNDIZA` (el patrón reaparece, pero Terpel agrega
matices que la formulación original no capturaba del todo), `CAMBIA` (la
formulación original sesgaba hacia un caso específico de Tecnoglass;
Terpel obliga a generalizarla), `NUEVO — REQUIERE MÁS CASOS` (necesidad
que Tecnoglass no mostró y que Terpel sí, sin evidencia suficiente
todavía para diseñar solución), `EVIDENCIA INSUFICIENTE` (Terpel lo
sugiere, pero no hay base para actuar).

**CASO 02 NO AUTORIZA IMPLEMENTACIÓN.** Este reporte de contraste, igual
que el caso que resume, es exclusivamente documental. Ningún cambio
descrito aquí autoriza crear tablas, migraciones, schemas, UI, motores,
Edge Functions, automatizaciones ni ningún otro cambio técnico. Solo
Nicolás/fundador puede autorizar implementación, de forma explícita y
separada.

---

## 1. Contraste formal R1–R8

Ver detalle completo con evidencia en `CASO-02-TERPEL-V0.md` §14. Resumen:

| Regla | Resultado Caso 02 | Nota |
|---|---|---|
| R1 — Contabilidad ≠ economía | `SOBREVIVE — REFORZADA` | Evidencia distinta a Tecnoglass: decalaje, contratos con clientes, negocios con economics propios dentro de un reporte consolidado |
| R2 — Observado ≠ normalizado ≠ proyectado | `SOBREVIVE — REFORZADA` | El decalaje demuestra que "observado" no equivale automáticamente a "proyectable" ni a "normalizado" |
| R3 — Los supuestos están relacionados | `SOBREVIVE, PERO SE PROFUNDIZA` | Cadenas causales más largas (precio→inventario→decalaje→margen; plazo proveedor→AP→NWC→caja) sugieren que una relación simple entre dos elementos puede no bastar — **no se rediseña `assumption_relations` en este reporte** |
| R4 — Una cuenta agregada puede necesitar descomposición | `CAMBIA` | La formulación original (Cost of Sales de Tecnoglass) sesgaba hacia descomposición **contable**. Terpel muestra que la dimensión relevante puede ser negocio, producto, canal, geografía o contrato — ver §2 abajo |
| R5 — Estado de conocimiento explícito | `SOBREVIVE` | Terpel contiene preguntas que la información disponible en este caso no permite responder; se preservan como `DESCONOCIDO`/`PREGUNTA_A_GERENCIA` |
| R6 — Método de determinación | `SOBREVIVE, PERO PARECE INCOMPLETO` | Introduce dos candidatos nuevos: `scope` (alcance) y `purpose` (propósito original) — ver §3 y §4 abajo |
| R7 — Drivers específicos por empresa | `SOBREVIVE — FUERTEMENTE REFORZADA` | Terpel usa drivers radicalmente distintos de Tecnoglass; confirmado con dos economías muy distintas que no existe biblioteca universal cerrada |
| R8 — Detectar incoherencias sin decidir | `SOBREVIVE — REFORZADA` | Nuevos ejemplos conceptuales específicos de Terpel (decalaje divergente sin evidencia, AP que sube sin registrar el cambio de plazo, CAPEX sin explicación operacional) |

## 2. Matriz de contraste — cambios propuestos al Expediente

| # | Hallazgo Terpel | ¿Expediente V1 (post-Caso 01) ya lo cubría? | Cobertura previa | Cambio requerido | Razón | Evidencia del caso | Prioridad | ¿Implementación futura? | ¿Requiere experto? | ¿Requiere más casos? | Clasificación |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `account_components` estaba descrito en función del ejemplo de Tecnoglass (Cost of Sales → materiales/labor/energía/logística), lo que sesga hacia descomposición contable | Parcial | El concepto ya existía, pero su descripción lo ligaba implícitamente a subcuentas contables | Refinar la descripción de `account_components` (y de R4 en la especificación) para dejar explícito que la dimensión de descomposición puede ser contable, de negocio, de producto, de canal, de geografía o de contrato — no solo contable | Terpel muestra negocios (EDS/Industria/Aviación & Marinos/Lubricantes/Servicios Complementarios) como dimensión de descomposición relevante, distinta de una subcuenta contable | `CASO-02-TERPEL-V0.md` §5, §14 (R4) | Alta | Sí, mismo paso ya previsto (Paso 1/2 del plan incremental) | No | No — la lista de dimensiones observadas (contable, negocio, producto, canal, geografía, contrato) ya cubre lo visto en dos casos, pero no se declara cerrada | `PATRÓN OBSERVADO EN DOS CASOS` |
| 2 | Un supuesto puede aplicar a distintos alcances dentro de una misma organización (empresa completa, filial, país, segmento, UGE, producto, contrato) | No | Ausente — `case_assumptions` no distinguía a qué alcance aplica un supuesto | Registrar la necesidad conceptual de un campo de alcance (nombre tentativo `scope`), **sin definir tipo, enum ni estructura** | Terpel, por tener múltiples negocios y geografías, expone que un mismo nombre de supuesto puede significar cosas distintas según a qué parte de la organización se refiera — Tecnoglass, con una sola línea de negocio predominante, no dejó esto tan visible | `CASO-02-TERPEL-V0.md` §11, §14 (R6) | Alta (concepto) / Ninguna (implementación) | Sí — el diseño final de `scope` requiere criterio experto | Sí — un tercer caso ayudaría a confirmar si el alcance necesita jerarquía (ej. país dentro de segmento) o es una dimensión plana | `NUEVO — REQUIERE MÁS CASOS` |
| 3 | Una cifra puede haber sido determinada originalmente para un propósito distinto a una valoración Velarix (prueba de deterioro, presupuesto, covenant, planificación, presentación gerencial) | Parcial | `case_assumptions` ya registra `metodo_de_determinacion` y `fuente`, pero no el propósito original de uso de la cifra | Registrar la necesidad conceptual de preservar el propósito/contexto original de un supuesto (nombre tentativo `purpose`), **sin imponer todavía un campo obligatorio ni diseño de tipo** | La transferibilidad de un supuesto a una valoración depende, en parte, de para qué fue calculado originalmente — este matiz no apareció con la misma claridad en Tecnoglass | `CASO-02-TERPEL-V0.md` §11, §14 (R6) | Media (concepto) / Ninguna (implementación) | Sí | Sí — la evidencia de este caso es más débil que la de `scope`; se mantiene como necesidad registrada, no como campo casi decidido | `NUEVO — REQUIERE MÁS CASOS` (evidencia más débil que #2) |
| 4 | Cadenas causales observadas (precio→inventario→decalaje→margen; plazo proveedor→AP→NWC→caja) son más largas que las relaciones simples de dos elementos vistas en Tecnoglass | Parcial | `assumption_relations` ya existe como concepto (N:N entre dos elementos, con tipo de relación y razonamiento) | Ninguno todavía — se registra como pregunta metodológica abierta si `assumption_relations` necesita representar cadenas de más de dos elementos, dirección, mecanismo u origen/destino explícitos | Evitar rediseñar una entidad conceptual con evidencia de solo dos casos | `CASO-02-TERPEL-V0.md` §14 (R3) | Media | No aplica todavía | Sí | Sí | `SOBREVIVE, PERO SE PROFUNDIZA` (sin cambio de especificación) |
| 5 | El decalaje demuestra que "EBITDA sin decalaje" no es automáticamente el EBITDA correcto ni proyectable | Sí | El Expediente V1 ya exige que reportado/normalizado/proyectado coexistan (§5, §17, confirmado por Caso 01) | Ninguno — se registra como caso de uso concreto que confirma la regla ya incorporada, no como estructura adicional | El decalaje es evidencia independiente (distinta de working capital de Tecnoglass) de la misma necesidad ya cubierta | `CASO-02-TERPEL-V0.md` §7 | Baja (no genera cambio estructural) | No aplica | No | No | `PATRÓN OBSERVADO EN DOS CASOS` (ya cubierto, sin cambio) |
| 6 | Terpel expone que eventos como adquisiciones, ventas, reclasificaciones, operaciones discontinuadas o cambios de consolidación pueden afectar la comparabilidad entre periodos | No | Ausente — el Expediente no representa explícitamente esta necesidad | Ninguno todavía — se registra como pregunta abierta, sin diseñar `case_perimeter` ni ninguna estructura | La evidencia de este caso es cualitativa y no cuantificada; no hay base suficiente para diseñar una solución | `CASO-02-TERPEL-V0.md` §12 | Media (concepto) / Ninguna (implementación) | Sí | Sí — necesita más casos, idealmente uno con un evento real de adquisición/desconsolidación documentado | `EVIDENCIA INSUFICIENTE PARA DISEÑAR SOLUCIÓN — VALIDAR EN CASOS FUTUROS` |
| 7 | Contratos con clientes (aportes vinculados a estaciones, exclusividad, volumen mínimo, duración) generan preguntas económicas propias | Parcial | `expedient_questions`, `case_assumptions` y `evidence_links` ya permiten representar buena parte de esto sin entidad dedicada | Ninguno — se confirma que, por ahora, no hace falta una entidad `contracts` | Ni Tecnoglass ni Terpel demuestran todavía que los contratos requieran estructura propia; ambos casos se representan suficientemente con lo existente | `CASO-02-TERPEL-V0.md` §9 | Baja | No aplica | No necesariamente | Sí — si un caso futuro muestra contratos con condiciones muy heterogéneas o de alto volumen, podría revisarse | `PATRÓN OBSERVADO EN DOS CASOS` (no se crea estructura) |
| 8 | Arrendamientos materiales requieren comprensión económica antes de decidir tratamiento (deuda vs. operativo) | Sí | Ya representable vía `account_notes`/`case_assumptions` con estado epistémico `pregunta_a_gerencia` o `decision_del_analista` | Ninguno | Confirma que no hace falta entidad nueva para arrendamientos, igual que con supplier finance en Tecnoglass | `CASO-02-TERPEL-V0.md` §10 | Baja | No aplica | Sí, para la decisión de tratamiento final | No | `PATRÓN OBSERVADO EN DOS CASOS` (no se crea estructura) |
| 9 | El plazo ampliado de pago con Ecopetrol reabre, con un instrumento distinto, la misma pregunta que el supplier finance de Tecnoglass: ¿NWC operativo o financiación? | No aplica — pregunta metodológica, no cambio de estructura | — | Ninguno al Expediente; se registra como segunda instancia de la misma pregunta metodológica abierta desde el Caso 01 | El Expediente ya permite registrar esto vía `case_assumptions`/`account_notes` con el estado epistémico correspondiente — sigue faltando criterio, no estructura | `CASO-02-TERPEL-V0.md` §6, §15 | Media | No aplica | Sí | No necesariamente — pero refuerza que es un patrón recurrente entre empresas con proveedores concentrados, no un caso aislado de Tecnoglass | `SOBREVIVE, PERO SE PROFUNDIZA` (misma pregunta abierta, ahora con dos instancias) |

---

## 3. Resumen de disposición final

### Ya lo representa el Expediente V1

Contabilidad vs. economía; reportado/normalizado/proyectado;
clasificación epistémica; drivers específicos por empresa;
desconocido/preguntas/evidencia; el fenómeno de decalaje como caso de uso
de la separación reportado/normalizado/proyectado ya existente; la
pregunta de supplier financing como pregunta metodológica sin respuesta
automática (ahora con una segunda instancia: el plazo con Ecopetrol).

### Lo representa parcialmente

- **Descomposición económica** (`account_components`): existía
  conceptualmente, pero descrita en términos que sesgaban hacia
  subcuentas contables. Se refina (cambio #1 arriba) para que la
  dimensión de descomposición pueda ser contable, de negocio, de
  producto, de canal, de geografía o de contrato.
- **Cadenas causales** (`assumption_relations`): permite relaciones,
  pero sigue sin saberse si representa suficientemente dirección,
  mecanismo, causalidad u origen/destino de cadenas más largas que dos
  elementos. **No se rediseña.**
- **Scope**: el contexto textual libre ya existente ayuda, pero no
  garantiza representar inequívocamente a qué unidad económica aplica un
  supuesto dentro de una organización con múltiples negocios y países.
  **Se registra como hueco conceptual sólido**, reforzado por Terpel.
- **Purpose**: fuente y método de determinación ayudan, pero puede ser
  necesario preservar explícitamente el propósito original de un
  supuesto para evaluar su transferibilidad. **Se registra como
  necesidad conceptual con diseño abierto**, con evidencia más débil que
  `scope`.
- **Contratos**: pueden documentarse con las estructuras existentes; dos
  casos todavía no demuestran que requieran estructura dedicada.

### No lo representa claramente

- **Comparabilidad / perímetro histórico**: Terpel sugiere que
  adquisiciones, ventas, reclasificaciones, operaciones discontinuadas o
  cambios de consolidación pueden afectar la comparabilidad entre
  periodos. El Expediente no lo representa explícitamente. **No se
  diseña `case_perimeter` ni ninguna estructura** — se registra como
  `EVIDENCIA INSUFICIENTE PARA DISEÑAR SOLUCIÓN — VALIDAR EN CASOS
  FUTUROS`.

### No hay evidencia de que sobre

El Caso 02 **no** demuestra que deban eliminarse: clasificación
epistémica, `account_components`, `case_assumptions`, projection
drivers, `assumption_relations`, `coherence_flags`, ni las capas
reportado/normalizado/proyectado. Tampoco se declaran universales por
haber sobrevivido a dos casos.

## 4. Qué sigue

1. Un eventual Caso 03 (empresa con una tercera economía distinta, no
   analizado en esta tarea) ayudaría a: confirmar o corregir el refinamiento
   de R4 (dimensiones de descomposición), aportar una tercera instancia de
   la pregunta de "cuenta comercial operativa vs. financiera" (Tecnoglass:
   supplier finance: Terpel: plazo Ecopetrol), y dar evidencia sobre
   comparabilidad/perímetro, que hoy sigue con evidencia insuficiente.
2. Ninguno de los cambios de este reporte autoriza implementación — sigue
   pendiente autorización explícita y separada del fundador
   (`Negocio_Velarix_v4.2.md` §19, regla 19).
3. Las preguntas metodológicas de `CASO-02-TERPEL-V0.md` §16 (scope,
   purpose, cadenas causales de `assumption_relations`, criterio para
   CAPEX de transición energética, tratamiento de cuentas comerciales con
   condiciones ampliadas, comparabilidad/perímetro) quedan como agenda
   concreta para la próxima conversación con un revisor/experto
   financiero — no como ejercicio abstracto, sino con evidencia real de
   dos casos independientes detrás.
