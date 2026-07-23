# Pruebas — BL-06 (El pipeline no aborta ante falla de map-accounts)

Bloque 1B-P0. Bug corregido: en `run-analysis-pipeline/index.ts`, el
paso 2 (`map-accounts`) nunca detenía el pipeline — ni cuando la
respuesta era `success: false`, ni cuando `has_blocking_issues: true`, ni
en el bloque `catch`. La ejecución siempre continuaba al paso 3
(validación) con cuentas potencialmente mal homologadas o sin
homologar, y podía terminar produciendo un informe "completado" con
datos defectuosos.

## Refactor mínimo de testabilidad

Módulo puro `supabase/functions/_shared/pipeline-guards.ts`
(`evaluateMapAccountsResult`) — decide si el pipeline debe abortar y con
qué código/mensaje/estado, a partir de la respuesta JSON de
`map-accounts`. `run-analysis-pipeline/index.ts` ahora llama a esta
misma función y, si `shouldAbort` es `true`, actualiza el estado, libera
el lock y retorna inmediatamente — sin llegar a los pasos 3, 4 o 5.

## Archivo de prueba

`supabase/functions/_shared/pipeline-guards.test.ts`

## Comando y resultado

```
$ npx vitest run supabase/functions/_shared/pipeline-guards.test.ts

 Test Files  1 passed (1)
      Tests  6 passed (6)
```

## Cobertura real vs. declarada (transparencia)

`run-analysis-pipeline/index.ts` es una Edge Function de Deno con
imports de URL y un `serve()` incondicional de nivel superior — el mismo
bloqueo ambiental que BL-02/03/05 en Bloque 1A (Deno no instalado en este
entorno). No se puede importar el archivo completo en Vitest para una
prueba de integración end-to-end.

Lo que **sí** se demuestra con una prueba real y ejecutable:

1. **"map-accounts falla" produce la decisión correcta** — `success: false`
   → `shouldAbort: true`, `errorCode: "MAP_ACCOUNTS_FAILED"`,
   `analysisStatus: "error_tecnico"`. ✅ Prueba real, pasa.
2. **El mensaje de error no expone información sensible** — se propaga
   tal cual el mensaje ya sanitizado de `map-accounts`, sin URLs ni
   tokens. ✅ Prueba real, pasa.
3. **Cuentas críticas faltantes también abortan** (`has_blocking_issues`),
   con `analysisStatus: "validacion_bloqueada"`. ✅ Prueba real, pasa.

Lo que queda como **garantía por construcción, no verificada por
integración**:

- "Las etapas posteriores no son llamadas": en el código real, el
  `return` inmediato dentro del `if (decision.shouldAbort)` es la única
  forma de llegar al paso 3 — no hay ninguna ruta de código entre ese
  `return` y la llamada a `validate-analysis`. Verificar esto con un
  mock de `fetch` que confirme que las llamadas a `validate-analysis`/
  `build-structured-input`/`ejecutar-calculo` nunca ocurren requeriría
  ejecutar el archivo completo — bloqueado por el mismo motivo que
  arriba. **Pendiente para cuando Deno esté disponible en el entorno de
  pruebas** (o para una extracción más profunda del control de flujo del
  pipeline a un módulo puro, que no se hizo aquí por ser un refactor más
  amplio del permitido en 1B-P0).

## Antes / después (evidencia concreta)

```ts
// ANTES (run-analysis-pipeline/index.ts, hasta antes de este bloque):
const mapResult = await mapResp.json();
steps.push({ step: "map-accounts", success: mapResult.success, ... });
if (mapResult.data?.has_blocking_issues) {
  steps.push({ step: "map-accounts", success: false, ... }); // solo registra, no detiene
}
await updateJob("homologacion", 100, "Homologación completada.", "completado"); // ¡se marca "completado" igual!
// -> el código sigue al paso 3 sin importar si mapResult.success era false

// DESPUÉS:
const decision = evaluateMapAccountsResult(mapResult);
if (decision.shouldAbort) {
  // actualiza estado, libera lock, retorna de inmediato — el paso 3 nunca se alcanza
  return new Response(JSON.stringify({ success: false, error: {...}, data: { steps } }), ...);
}
await updateJob("homologacion", 100, "Homologación completada.", "completado");
```

## Regresión

`npm test -- --run` completo: 59 pruebas pasan, 0 fallos.
