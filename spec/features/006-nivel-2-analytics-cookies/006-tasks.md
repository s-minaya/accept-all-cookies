# 006 · Nivel 2 — Analytics Cookies — Tareas

- [x] Implementar `Level02.tsx` con el patrón de la 005 (texto en el marco, pie vía `useLevelFooter` memoizado) y los botones cruzados (`variant="disagree"` + `game.agree` → gana; `variant="agree"` + `game.disagree` → pierde), con comentario explicando el cruce.
- [x] Reutilizar o añadir el `LoseReason` de "botón incorrecto" (si se añade: documentarlo en `tech-stack.md` en el mismo cambio). Reutilizado `'failed'` (ya existente y ya documentado en `types.ts` como "p. ej. botón incorrecto"): no hizo falta tocar `tech-stack.md`.
- [x] Sustituir el hueco 2 del registro y verificar el chunk propio en el build.
- [x] Añadir el texto de consentimiento del nivel a ambos diccionarios bajo `levels.2.*`.
- [x] Tests de componente: Agree rojo → `onWin`; Disagree verde → `onLose(motivo)`; clases de variante cruzadas respecto al texto.
- [x] QA: partida completa ganando (verificado con Playwright contra el servidor de desarrollo: colores cruzados confirmados por clase, Agree rojo dispara el flujo estándar hasta la modal Cookies Accepted con la categoría correcta) y perdiendo (botón, contador y X); recarga a mitad de nivel y con desenlace pendiente; 5 anchos y móvil real vía Pages confirmados por Sofía.
- [x] Validar contra los criterios de aceptación de `spec.md`: todos cumplidos.
- [x] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.
