# 008 · Nivel 4 — Advertising (Plinko) — Tareas

- [ ] Implementar el botón dev de saltar nivel en `LevelHost` (gated `?dev`, completa sin veredicto ni modal); anotarlo en AGENTS.md y en la línea de la 017 del roadmap.
- [ ] Corregir el **ejemplo** de sustitución del GDD del nivel 4 (la prosa era correcta y se queda tal cual). Ejemplo corregido: `🟩🟩□□🟥🟥 + Agree → 🟩🟩🟩□🟥🟥 + Agree → 🟩🟩🟩🟩🟥🟥 (tablero lleno) + Agree → 🟩🟩🟩🟩🟩🟥 + Agree → 🟩🟩🟩🟩🟩🟩` (y el inverso con Disagree).
- [ ] Implementar `segments.ts` (máquina pura, regla confirmada: rellenar por su lado con huecos; sustituir el fronterizo contrario a tablero lleno) + tests exhaustivos (rellenos mixtos, sustituciones, remontada desde (1,5), victoria/derrota, secuencias largas).
- [ ] Implementar `spawner.ts` con semilla inyectable + test de distribución ~50 %.
- [ ] Implementar `board.ts`: 30 pegs al tresbolillo, lluvia con colisiones, botón grande cinemático, capturas por evento de colisión, retirada de no-capturados; sync cuerpo→DOM por rAF.
- [ ] Implementar `control.ts` (clamping puro + test) conectado a `usePointer` (puntero/arrastre en toda el área) y flechas de teclado; alimentar cuerpo cinemático y guía-slider.
- [ ] Implementar `Level04.tsx`: consentimiento estándar, tablero sin marco aprovechando el espacio, guía beige/azul, botón de 6 segmentos con estilos de `XPButton` compartidos; sin pie.
- [ ] Sonidos de captura (positivo/negativo) respetando el interruptor de efectos.
- [ ] Cleanup total al desmontar + test de no-fugas; `paused` congela física, spawn, control y sonidos.
- [ ] Sustituir el hueco 4 del registro; verificar chunk propio y matter.js compartido sin duplicar.
- [ ] Añadir `levels.4.*` a ambos diccionarios y los parámetros nuevos al GDD §14.
- [ ] ✋ **Checkpoint con Sofía**: visual del botón troceado + dificultad jugando en escritorio y en su móvil (tasa de spawn, velocidad, anchura del sensor de captura).
- [ ] QA: partida entera ganando y perdiendo (segmentos, contador, X); recarga a mitad y con desenlace pendiente; botón dev desde varios niveles; 5 anchos; móvil real vía Pages.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Si se ajusta cualquier parámetro de dificultad, actualizar GDD §14 y los tests afectados en el mismo cambio.
