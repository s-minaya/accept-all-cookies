# 004 · Meta-flujo — Tareas

- [x] Añadir `paused` a `LevelProps`, actualizar el nivel de prueba (congela animación e input) + test.
- [x] Implementar `runFlow` (máquina de estados pura) + tests, incluido el empate contador-a-0 vs acción del jugador.
- [x] Implementar `GiantVerdict` (AGREE/DISAGREE, ~800 ms, sonido, overlay que bloquea input) y añadirlo a la Playground con disparadores de prueba.
- [x] Implementar las modales de victoria y derrota con los textos del GDD (mensajes `meta.*` en ES/EN; botones y títulos vía `game.*`).
- [x] Añadir a `XPWindow` la opción de ocultar contador y X; verificar en Playground.
- [x] Implementar `LevelSelectScreen` con la lista de 12 niveles (tres estados BEM), ✓ verde y botón Check.
- [x] Completar `registry.ts` con los 12 huecos (nivel de prueba como relleno) y `levels.N.name` en ambos diccionarios.
- [x] Cablear el récord: `recordIfImproved` al abrir nivel, `finished` al completar el 12; ampliar `rankingStore` y `RankingList` + tests (mejora sí/no, perder no toca, entrada v1 sin `finished` carga bien).
- [x] Orquestar el flujo en el shell: ganar/perder → congelar + parar contador → veredicto → modal → progreso/reinicio → selección.
- [x] Deshabilitar Check con los 12 niveles completados.
- [ ] QA: partida completa ganando los 12; derrotas por botón, por contador y por X; ranking reflejado en la landing; 5 anchos; móvil real vía Pages (veredicto legible en 375 px).
  - Verificado por tests automatizados (Vitest + Testing Library, sin navegador real): partida completa ganando los 12 seguidos, derrota por cada una de las 3 vías, ranking actualizado y no alterado por derrota.
  - Pendiente de Sofía (no hay navegador disponible en esta sesión para verificarlo): aspecto visual real de `GiantVerdict`/las modales, los 5 anchos de referencia y el recorrido completo en móvil real vía Pages.
- [x] Validar contra los criterios de aceptación de `spec.md`: todos cumplidos salvo el último (jugable en los 5 anchos de referencia), pendiente de verificación visual por Sofía.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md` (pendiente hasta cerrar el punto de QA visual anterior).

## Mantenimiento (checklist recurrente)

- [ ] Cada feature de nivel (005–016) sustituye su hueco del registro y se juega una vez dentro del flujo completo (ganar Y perder) antes de darse por cerrada.
