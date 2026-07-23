# Reporte de cierre — Bloque 1A (Caracterización y contrato canónico)

Fecha: 2026-07-23. Alcance: exclusivamente Bloque 1A de
`fases/FASE-01-EXACTITUD-FINANCIERA.md`. Bloques 1B, 1C, 1D y 1E **no se
iniciaron**.

## Estado real (corregido)

> **Bloque 1A cerrado documentalmente, con limitación técnica
> registrada**: BL-04 tiene prueba de especificación ejecutable; BL-02,
> BL-03 y BL-05 tienen evidencia de trazado manual, pero sus pruebas de
> especificación ejecutables siguen **pendientes**.
>
> - La evidencia manual confirma la causa aparente de cada bug.
> - La evidencia manual **no reemplaza** una prueba automatizada.
> - Antes de modificar BL-02, BL-03 o BL-05 en Bloque 1B, debe existir una
>   prueba ejecutable que falle.
> - El primer paso de Bloque 1B será habilitar un entorno de pruebas para
>   las Edge Functions mediante Deno, o extraer la lógica financiera pura
>   a módulos probables, con un refactor mínimo y controlado.
> - Ningún bug puede marcarse corregido únicamente mediante trazado
>   manual.

## 1. Pre-chequeo (antes de modificar nada)

```
$ git status --short
?? NEGOCIO_V4_VELARIX.md
?? Negocio_Velarix_v4.1.md
?? docs/
?? velarix-documentacion-auditoria.zip

$ git branch --show-current
main

$ git diff --stat
(vacío)

$ which deno
deno: command not found
```

Herramientas confirmadas: npm (con `package-lock.json`), Vitest
configurado para escanear solo `src/**/*.{test,spec}.{ts,tsx}`
(`vitest.config.ts`). Deno **no está instalado** en este entorno —
condición ambiental que determinó el alcance real de BL-30 (ver sección
4).

## 2. Baseline registrado antes de cualquier cambio

| Comando | Resultado baseline |
|---|---|
| `npm test -- --run` | 1 archivo de prueba, 1 prueba, todas pasan (`src/test/example.test.ts`) |
| `npx tsc --build --noEmit` | Sin salida — compila limpio |
| `npm run build` | Compila exitosamente; advertencia preexistente de bundle >500kB (`R-17`, no relacionada con este bloque) |
| `npm run lint` | 310 problemas (286 errores, 24 warnings) totales — de los cuales una parte proviene de `velarix-code-latest/`, una carpeta de respaldo duplicada ya documentada como decisión `D-02` (no forma parte del repositorio real, está en `.gitignore`) |

## 3. Trabajo realizado, archivo por archivo

### Nuevos (todos agregados, ninguno de producción modificado)

| Archivo | Contenido | BL |
|---|---|---|
| `src/lib/financial-engine.characterization.test.ts` | 12 pruebas de caracterización del motor cliente (10 mínimas + 2 adicionales), todas ejecutan y pasan | BL-27 |
| `src/lib/pdf-generator.currency.spec.test.ts` | 1 prueba de especificación real y ejecutable para BL-04, usando `test.fails()` y mocks de `jspdf`/`jspdf-autotable` (sin tocar `pdf-generator.ts`) | BL-30 (parcial — BL-04) |
| `src/types/calculation-result.ts` | Contrato tipado de `calculation_result`, sin `any`, no importado desde ningún código de producción | BL-31 |
| `docs/velarix/bloque-1a/BL-26-tabla-comparativa-motores.md` | Comparación completa servidor vs. cliente: entradas, fórmulas, constantes, validaciones, moneda, salidas, consumo/persistencia, y 5 diferencias sin explicación documentada | BL-26 |
| `docs/velarix/bloque-1a/BL-28-diseno-maquina-estados.md` | Diseño de la máquina de estados, mapeo con los estados reales actuales, reglas de `approved_for_delivery` y `stale` | BL-28 |
| `docs/velarix/bloque-1a/BL-30-evidencia-pruebas-especificacion.md` | Evidencia de trazado manual para BL-02/BL-03/R-05, y registro del resultado real de la prueba ejecutable de BL-04 | BL-30 |
| `docs/velarix/bloque-1a/BL-32-diseno-versionado.md` | Diseño de `calculationVersion`, `formulaVersion`, `macroDataVersion`, `inputHash` | BL-32 |
| Este archivo | Reporte de cierre | — |

### Modificados (solo documentación de planificación, ningún archivo de código)

`fases/FASE-01-EXACTITUD-FINANCIERA.md`, `plan/BACKLOG-CLASIFICADO.md`,
`plan/MATRIZ-DE-DEPENDENCIAS.md`, `plan/MATRIZ-DE-TRAZABILIDAD.md`,
`plan/MATRIZ-DE-RIESGOS.md` (nueva fila `R-19`, hallazgo nuevo de este
bloque: 7 supuestos hardcodeados en el servidor que el cliente expone como
ajustables — ver `BL-26-tabla-comparativa-motores.md` sección 4).

### No tocados (confirmado)

Ningún archivo bajo `supabase/functions/`, ningún archivo bajo `src/lib/`
salvo los dos archivos de prueba nuevos, `src/pages/Dashboard.tsx`, ni
ningún archivo de configuración (`package.json`, `vite.config.ts`,
`vitest.config.ts`, `eslint.config.js`). Verificado con `git status
--short` al final del bloque: solo aparecen archivos nuevos, ninguno con
marca de modificación (`M`).

## 4. BL-30 — resultado real, no completamente terminado

Orden de preferencia exigido: (1) mecanismo de fallo esperado sobre una
prueba real → (2) suite aislada ejecutable → (3) evidencia documentada de
fallo manual.

- **BL-04 (PDF "USD" fijo)**: se alcanzó la opción 1. Prueba real,
  ejecuta hoy, resultado registrado: `1 expected fail` — la aserción
  interna falla contra el código actual (confirma el bug), y `npm test`
  se mantiene en verde gracias a `test.fails()`.
- **BL-02 (subcuentas), BL-03 (moneda), R-05 (campo de deuda)**: bloqueadas
  por una condición ambiental verificada, no por falta de esfuerzo:
  Deno no está instalado en este entorno, y los 3 archivos involucrados
  ejecutan `serve()` de forma incondicional al nivel superior del módulo
  además de tener imports de URL no resolubles en Node — importar el
  módulo para llegar a la función pura ya dispara un efecto secundario.
  Exportar la función pura no resuelve esto (el módulo completo no carga
  en este entorno). Solucionarlo de raíz requeriría separar la lógica de
  cálculo del handler HTTP — el tipo exacto de refactor que el Bloque 1A
  tiene prohibido improvisar. Se documentó evidencia de trazado manual con
  cita de archivo y línea para cada uno, siguiendo la instrucción explícita
  del fundador: "si una función no puede probarse sin hacer un refactor...
  documenta la limitación y detente únicamente sobre esa prueba,
  continuando con el resto de 1A." **Esta evidencia queda registrada como
  pendiente, no como cerrada**: antes de corregir cualquiera de estos 3
  bugs en Bloque 1B debe existir primero una prueba de especificación
  ejecutable y roja — el primer paso obligatorio de 1B es habilitar Deno
  en el entorno de pruebas, o extraer la lógica financiera pura a módulos
  probables desde Vitest mediante un refactor mínimo y controlado.

## 5. Validaciones finales (después de todos los cambios)

| Comando | Resultado | Comparación con baseline |
|---|---|---|
| `npm test -- --run` | 3 archivos de prueba, 13 pruebas pasan + 1 "expected fail" (14 total) | Sin regresiones; la prueba original (`example.test.ts`) sigue pasando; las 13 nuevas pasan; la de BL-04 falla intencionalmente y queda contenida por `test.fails()` |
| `npx tsc --build --noEmit` | Sin salida — compila limpio | Idéntico al baseline, sin errores nuevos |
| `npm run build` | Compila exitosamente, mismo tamaño de bundle, misma advertencia preexistente de code-splitting | Idéntico al baseline |
| `npm run lint` | 310 problemas (286 errores, 24 warnings) — idéntico al baseline | **Cero problemas nuevos** atribuibles a los 3 archivos nuevos de `src/` (`financial-engine.characterization.test.ts`, `pdf-generator.currency.spec.test.ts`, `calculation-result.ts`) |

**Clasificación de resultados**: ningún error nuevo introducido; ningún
error preexistente resuelto (no correspondía a este bloque); las 3
pruebas de BL-02/BL-03/BL-05 se clasifican como "no ejecutable en este
entorno, con evidencia documentada, prueba automatizada **pendiente**" —
no como completadas.

## 6. Artefactos de build eliminados (no forman parte del entregable)

`tsconfig.app.tsbuildinfo` y `tsconfig.node.tsbuildinfo` se generaron como
efecto secundario de correr `tsc --build` durante la validación — se
eliminaron después de confirmarlos como artefactos no intencionales, igual
que en la auditoría original.

## 7. Confirmación de alcance

- [x] BL-30 **no se marca como completamente terminado** — solo BL-04
      tiene prueba ejecutable; BL-02/BL-03/BL-05 quedan pendientes de una
      prueba automatizada real (ver sección "Estado real" arriba).
- [x] No se corrigió ningún bug financiero.
- [x] No se conectó el PDF ni la narrativa al resultado del servidor.
- [x] No se tocó autenticación, roles ni RLS.
- [x] No se ejecutaron migraciones ni se tocó Supabase real.
- [x] No se instalaron dependencias nuevas.
- [x] No se reorganizó el código existente.
- [x] No se eliminó el motor cliente.
- [x] No se activó ninguna bandera de activación.
- [x] No se tocó producción.
- [x] No se hizo commit ni push.
- [x] Bloques 1B, 1C, 1D y 1E **no fueron iniciados ni marcados como
      iniciados** en ningún documento.
