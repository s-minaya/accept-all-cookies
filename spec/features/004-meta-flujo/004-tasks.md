# 004 · Meta-flujo — Tareas

- [ ] Añadir `paused` a `LevelProps`, actualizar el nivel de prueba (congela animación e input) + test.
- [ ] Implementar `runFlow` (máquina de estados pura) + tests, incluido el empate contador-a-0 vs acción del jugador.
- [ ] Implementar `GiantVerdict` (AGREE/DISAGREE, ~800 ms, sonido, overlay que bloquea input) y añadirlo a la Playground con disparadores de prueba.
- [ ] Implementar las modales de victoria y derrota con los textos del GDD (mensajes `meta.*` en ES/EN; botones y títulos vía `game.*`).
- [ ] Añadir a `XPWindow` la opción de ocultar contador y X; verificar en Playground.
- [ ] Implementar `LevelSelectScreen` con la lista de 12 niveles (tres estados BEM), ✓ verde y botón Check.
- [ ] Completar `registry.ts` con los 12 huecos (nivel de prueba como relleno) y `levels.N.name` en ambos diccionarios.
- [ ] Cablear el récord: `recordIfImproved` al abrir nivel, `finished` al completar el 12; ampliar `rankingStore` y `RankingList` + tests (mejora sí/no, perder no toca, entrada v1 sin `finished` carga bien).
- [ ] Orquestar el flujo en el shell: ganar/perder → congelar + parar contador → veredicto → modal → progreso/reinicio → selección.
- [ ] Deshabilitar Check con los 12 niveles completados.
- [ ] QA: partida completa ganando los 12; derrotas por botón, por contador y por X; ranking reflejado en la landing; 5 anchos; móvil real vía Pages (veredicto legible en 375 px).
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Cada feature de nivel (005–016) sustituye su hueco del registro y se juega una vez dentro del flujo completo (ganar Y perder) antes de darse por cerrada.
