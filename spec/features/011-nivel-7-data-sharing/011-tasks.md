# 011 · Nivel 7 — Data Sharing — Tareas

- [ ] Implementar `coverLogic.ts` (clamping al interior de la ventana) + tests (esquinas y cada borde).
- [ ] Implementar `Level07.tsx`: texto en el marco; pie vía `useLevelFooter` (nodo memoizado) con Disagrees rojos y la pila Agree-fijo + cubierta (`XPButton` variante agree con texto `game.disagree`).
- [ ] Arrastre de la cubierta con `usePointer`: tap → `onLose('failed')` (antes y después de moverla); drag → posición por custom property imperativa, clamping aplicado, posición final a estado solo al soltar.
- [ ] Apilado y overflow: la cubierta visible entera por toda la ventana durante el arrastre (revisar la cadena de `overflow`; portal como plan B).
- [ ] Cursor `grab`/`grabbing` sobre la cubierta.
- [ ] `paused` congela el arrastre (interrumpido = terminado en esa posición); cleanup de listeners al desmontar + test de no-fugas.
- [ ] Sustituir el hueco 7 del registro; verificar chunk propio sin matter.js.
- [ ] Añadir `levels.7.*` a ambos diccionarios.
- [ ] GDD: diálogos propios del nivel 7 → nota de flujo estándar (patrón de los niveles 1 y 5) + anotar la lectura estricta del tap sobre la cubierta movida.
- [ ] ✋ **Checkpoint con Sofía**: que el efecto "tarjeta que destapa otra" se lea bien al arrastrar (escritorio y su móvil).
- [ ] QA: victoria por Agree (total y parcialmente descubierto); las derrotas; arrastre cerca del rojo sin clic accidental; `paused` a medio arrastre; recarga a mitad y con desenlace pendiente; 5 anchos; móvil real vía Pages.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.
