# 011 · Nivel 7 — Data Sharing — Tareas

- [x] Implementar `coverLogic.ts` (clamping del desplazamiento a ± el ancho/alto de la propia cubierta — corregido sobre una primera versión que clampaba al interior de la ventana entera, ver más abajo) + tests (cada eje, cada signo, esquina).
- [x] Implementar `Level07.tsx`: texto en el marco; pie vía `useLevelFooter` (nodo memoizado) con Disagrees rojos y la pila Agree-fijo + cubierta (`XPButton` variante **disagree**, no agree — confirmado durante la implementación: los dos botones visibles son rojos, GDD corregido para que coincida).
- [x] Arrastre de la cubierta con `usePointer`: tap → `onLose('failed')` **solo si nunca se ha arrastrado antes** (revertido: la lectura estricta original —pierde siempre, incluso ya movida— se cambió por "arrastrarla la desarma para siempre", ver GDD y `011-plan.md`); drag → posición por custom property imperativa, clamping aplicado, sin estado de React (un ref — mismo patrón que `Reel.tsx`/`Board.tsx`, sobrevive a re-renders ajenos sin arriesgar el bucle de la 005).
- [x] Apilado y overflow: **corregido** — debe arrastrarse dentro del espacio del mismo botón, no debe salirse hacia la ventana. La primera versión la dejaba recorrer toda la ventana (`position: absolute` contra `.xp-window`, con `position: relative` añadido ahí para eso); sustituido por algo más simple: la cubierta NUNCA sale del grid de su propia pila (`position: relative` + `overflow: hidden` en `.level-07-footer__stack`), se desplaza con `transform` y el propio hueco recorta lo que se salga — sin portal, sin tocar `XPWindow.module.scss` (revertido).
- [x] Cursor `grab`/`grabbing` sobre la cubierta.
- [x] `paused` congela el arrastre (interrumpido = terminado en esa posición); cleanup de listeners al desmontar + test de no-fugas.
- [x] Sustituir el hueco 7 del registro; verificar chunk propio sin matter.js.
- [x] Añadir `levels.7.*` a ambos diccionarios.
- [x] Corregido el aspecto visual de la cubierta (se notaba trucado: el borde azul oscuro quedaba cortado) — el borde de `XPButton` es `box-shadow`, no `border`, y se dibuja 3px fuera de la caja del botón; el `overflow: hidden` de la pila (ajustado exactamente al tamaño del botón) lo recortaba incluso en reposo. Arreglado con `padding: 3px` en `.level-07-footer__stack`.
- [x] GDD: diálogos propios del nivel 7 ya estaban en formato de flujo estándar (patrón de los niveles 1 y 5, sin diálogo propio citado) + corregido el color de la cubierta (rojo, no verde) + revertida la lectura estricta del tap tras mover la cubierta (ahora se desarma) + anotado que el movimiento queda confinado a su propio hueco.
- [x] ✋ **Checkpoint**: efecto "tarjeta que destapa otra" aprobado.
- [x] QA: victoria por Agree (total y parcialmente descubierto); las cuatro derrotas; la cubierta desarmada tras arrastrarla no gana ni pierde; `paused` a medio arrastre; recarga a mitad; 5 anchos sin scroll horizontal ni vertical; dedo y ratón.
- [x] Validar contra los criterios de aceptación de `spec.md`.
- [x] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.
