# 006 · Nivel 2 — Analytics Cookies — Tareas

- [ ] Implementar `Level02.tsx` con el patrón de la 005 (texto en el marco, pie vía `useLevelFooter` memoizado) y los botones cruzados (`variant="disagree"` + `game.agree` → gana; `variant="agree"` + `game.disagree` → pierde), con comentario explicando el cruce.
- [ ] Reutilizar o añadir el `LoseReason` de "botón incorrecto" (si se añade: documentarlo en `tech-stack.md` en el mismo cambio).
- [ ] Sustituir el hueco 2 del registro y verificar el chunk propio en el build.
- [ ] Añadir el texto de consentimiento del nivel a ambos diccionarios bajo `levels.2.*`.
- [ ] Tests de componente: Agree rojo → `onWin`; Disagree verde → `onLose(motivo)`; clases de variante cruzadas respecto al texto.
- [ ] QA: partida completa ganando y perdiendo (botón, contador y X); recarga a mitad de nivel (retoma jugable) y con desenlace pendiente (muestra la modal); 5 anchos; móvil real vía Pages.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.
