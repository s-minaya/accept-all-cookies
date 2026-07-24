# 007 · Nivel 3 — Personalization — Tareas

- [ ] Refactor del canal nivel→host (`hostChannel.ts` con ranuras `footer` y `windowTransform`; `useLevelFooter` como envoltorio; nuevo `useWindowRotation`) + tests; verificar que los tests de los niveles 1–2 siguen en verde.
- [ ] Documentar el canal consolidado y la excepción de timers (rAF/Runner con limpieza obligatoria; `setInterval` sigue prohibido) en `tech-stack.md` y AGENTS.md.
- [ ] Implementar `rotationLogic.ts` (delta angular con normalización ±180°, tap-vs-drag sobre `pointerLogic`) + tests.
- [ ] Implementar `agreeAnchor.ts` (eje + distancia según viewport; casos apaisado, vertical y casi cuadrado) + tests.
- [ ] Implementar `Level03.tsx`: consentimiento estándar + recuadro de lluvia; rotación con `usePointer` publicando `useWindowRotation`; Agree anclado fuera de pantalla; pie con solo Disagree.
- [ ] Implementar `rain.ts` con matter.js dinámico: spawn continuo, reciclaje, población ≤25 (parámetro), gravedad en coordenadas de pantalla (test del vector), sync cuerpo→DOM por rAF.
- [ ] Cleanup completo al desmontar (Runner parado, rAF cancelado, Engine destruido) + test de no-fugas; `paused` congela física, rotación e input.
- [ ] Sustituir el hueco 3 del registro; verificar chunk propio y que matter.js no está en el bundle principal.
- [ ] Añadir `levels.3.*` a ambos diccionarios.
- [ ] Añadir al GDD §14 los parámetros nuevos de este nivel (población máx. de la lluvia, tasa de spawn, margen de la geometría del Agree).
- [ ] ✋ **Checkpoint con Sofía**: tacto de la rotación, densidad de la lluvia y tamaño táctil de los Disagrees en su móvil; decidir si hace falta inercia.
- [ ] QA: partida entera ganando y perdiendo (Disagree fijo, Disagree de lluvia, contador, X — con y sin rotación); recarga a mitad y con desenlace pendiente; 5 anchos (geometría del Agree verificada en 375 vertical y 1280 apaisado); móvil real vía Pages.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Cualquier cambio futuro en el canal nivel→host se re-valida con los niveles 1, 2 y 3 y con el nivel de prueba de la Playground.
