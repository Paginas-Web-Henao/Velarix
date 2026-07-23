# Definición de Terminado

"Compilar no es suficiente." Criterios globales y por tipo de tarea. Un
hallazgo de esta auditoría no se cierra hasta cumplir el criterio
correspondiente.

## Criterio global (aplica a toda tarea, sin excepción)

- [ ] El cambio tiene una prueba automatizada que falla sin el cambio y
      pasa con él (no basta con probarlo manualmente una vez).
- [ ] `npx tsc --build --noEmit` y `npm run lint` no introducen errores
      nuevos respecto al estado documentado en `auditoria/06`.
- [ ] El cambio está documentado: qué se corrigió, por qué, y con qué
      evidencia (referencia al hallazgo de `auditoria/*` que resuelve).
- [ ] Si el cambio toca un hallazgo `BLOQUEANTE`, se actualiza su estado
      en `plan/MATRIZ-DE-RIESGOS.md`, no se elimina la fila.
- [ ] No se marca "terminado" ocultando un error — si algo queda
      pendiente, se documenta explícitamente como tal, no se omite.

## Código (general)

- [ ] Sin `any` nuevo en contratos de respuesta entre Edge Functions
      (excepción ya identificada como no diferible, ver `auditoria/10`).
- [ ] Sin duplicación nueva de lógica ya identificada como duplicada
      (`corsHeaders`, patrón de auth, constantes macro) — si se toca uno
      de esos archivos, se aprovecha para consolidar, no para añadir una
      quinta copia.

## Bug financiero

- [ ] Existe una **prueba de especificación** (`BL-30`, Bloque 1A) que
      falla antes de la corrección y pasa después — no una prueba de
      caracterización (que solo registra el comportamiento actual,
      correcto o no, y **nunca** cuenta como criterio de corrección).
- [ ] Se siguieron los 4 pasos en orden: prueba que falla → corrección →
      prueba que pasa → verificación de que no se rompió otro resultado
      (correr toda la suite, no solo la prueba nueva).
- [ ] El caso de regresión se ejecuta en CI o al menos localmente antes de
      cada cambio futuro al motor de cálculo (no basta con correrlo una
      vez).
- [ ] El revisor financiero externo (`Negocio_Velarix_v4.1.md` §9.4)
      revisó y aprobó el cambio de metodología o fórmula, si aplica —
      un cambio de código en el motor de cálculo sin esta revisión no se
      considera terminado para efectos de la Fase 1.
- [ ] Se comparó el resultado contra un cálculo independiente en Excel
      (§10.2 del negocio) para al menos un caso real o realista.

## Distinción obligatoria: caracterización vs. especificación (Bloque 1A y siguientes)

- [ ] Toda prueba que registra el comportamiento **actual** del motor
      cliente (incluso si es incorrecto) está etiquetada como
      "caracterización" y se usa **solo** para comparar servidor vs.
      cliente en 1E — nunca para justificar que un bug es aceptable.
- [ ] Toda prueba que define el comportamiento **correcto esperado** está
      etiquetada como "especificación", y en el Bloque 1A debe **fallar**
      contra el motor servidor sin corregir — si pasa antes de 1B, algo
      está mal diseñado en la prueba o el bug ya no existe (verificar
      cuál de los dos antes de continuar).

## Estado y aprobación del análisis (Bloques 1A/1E)

- [ ] Solo el estado `approved_for_delivery` habilita generar o descargar
      el informe profesional — verificado **server-side**, nunca confiando
      en un flag del frontend.
- [ ] Existe una prueba que demuestra que **cualquier modificación
      posterior** (documento, mapping, input, supuesto, fórmula, narrativa
      o resultado) invalida una aprobación ya otorgada — el análisis
      vuelve a un estado anterior, no permanece "aprobado" con datos
      distintos a los aprobados.
- [ ] La aprobación registra usuario, rol, timestamp y versión exacta
      (cálculo, fórmulas, datos macro) — sin excepción.
- [ ] El PDF entregado corresponde a una versión inmutable o reproducible
      del resultado aprobado, no a un recálculo posterior.

## Rollback del Bloque 1E (regla no negociable)

- [ ] El plan de rollback **nunca** propone volver al motor cliente para
      producir una valoración profesional — ni como medida temporal, ni
      "solo para no interrumpir el servicio".
- [ ] El rollback verificado consiste en: desactivar el flujo nuevo,
      bloquear la descarga profesional, restaurar la última versión
      servidor conocida — con el motor cliente acotado a estimador/
      caracterización/visualización, igual que en operación normal.
- [ ] Si un rollback real ocurre, se documenta en
      `plan/REGISTRO-DE-DECISIONES.md` con la causa y la evidencia de que
      no se degradó a una cifra incorrecta.

## Migración de base de datos

- [ ] Es aditiva (nueva columna/tabla), no destructiva, salvo decisión
      explícita en `REGISTRO-DE-DECISIONES.md` con plan de rollback.
- [ ] Tiene su reversa (`down`) documentada o, si Supabase no la requiere
      explícitamente, un procedimiento manual de reversión escrito.
- [ ] No se ejecuta contra producción sin haberse probado antes en un
      entorno no productivo.
- [ ] RLS se revisa explícitamente para cualquier tabla nueva — no se
      asume que "ya heredará" seguridad de otra tabla.

## RLS / seguridad (Bloque 1D y Fase 2)

- [ ] La política se probó con **las 10 pruebas mínimas** de
      `fases/FASE-01-EXACTITUD-FINANCIERA.md` Bloque 1D (sin auth, solo
      anon key, usuario ajeno, cliente propietario, cliente intentando
      auto-escalar rol, analista no asignado, analista autorizado, admin
      autorizado, invocación interna válida, acceso cruzado sin filtrar
      información sensible) — no basta con probar el caso feliz.
- [ ] Si la corrección toca `ejecutar-calculo` (R-06), se verifica que ya
      no sea invocable con un `analysis_id` ajeno usando solo la clave
      `anon`.
- [ ] Si la corrección toca `continuar-tras-revision` (R-07), se verifica
      específicamente que el **cliente propietario del análisis** no
      pueda aprobar/continuar su propia revisión — ownership por sí solo
      NO es un criterio de aceptación válido para esta función.
- [ ] Si la corrección toca `BL-10` (auto-escalamiento de `role`), se
      verifica que ningún usuario pueda cambiar su propio `role` vía
      `UPDATE` directo, con y sin intentar rutas alternativas (RPC, etc.).
- [ ] La autorización se verificó en servidor y en RLS — una prueba que
      solo confirma que el frontend oculta un botón **no** cuenta como
      evidencia de corrección de seguridad.
- [ ] Los 4 actores (cliente propietario, analista autorizado,
      administrador, invocación interna) están documentados y probados
      por separado — no se asume que "usuario autenticado" es un actor
      único.

## UI / frontend

- [ ] Estados de carga, error, vacío y éxito están cubiertos
      explícitamente (no solo el camino feliz) — ver brechas ya
      identificadas en `auditoria/07`.
- [ ] Ningún texto nuevo de UI afirma algo no autorizado por
      `Negocio_Velarix_v4.1.md` §2.2 (rigor Big Four, garantías, auditoría
      certificada, "sin intervención humana").
- [ ] Botones interactivos nuevos tienen `aria-label` si son icon-only.

## Integración externa (Anthropic, Resend, pasarela de pago futura)

- [ ] Se documenta explícitamente qué datos se envían al proveedor
      externo y por qué (mínimo necesario, no el documento completo por
      defecto) — según `Negocio_Velarix_v4.1.md` §12.3.
- [ ] Existe manejo explícito de fallo del proveedor (no un `catch` que
      degrade silenciosamente sin dejar rastro en `audit_events`).

## Documentación

- [ ] Todo hallazgo nuevo cita archivo + línea o comando + resultado.
- [ ] No se presenta una hipótesis de negocio como requisito técnico
      confirmado.
- [ ] Los enlaces relativos entre archivos de `docs/velarix/` funcionan.

## Fase completa

- [ ] Se cumplió el "Criterio de salida" declarado en
      `Negocio_Velarix_v4.1.md` §18 para esa fase específica.
- [ ] Se cumplió el checklist de cierre del archivo
      `fases/FASE-XX-*.md` correspondiente.
- [ ] El fundador (u otra persona autorizada) confirmó explícitamente el
      cierre — ninguna fase se autocierra por criterio de una sesión de
      Claude Code.
