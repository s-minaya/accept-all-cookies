# 014 · Nivel 10 — Legitimate Interest — Tareas

- [ ] Añadir la ranura `overlay` al canal nivel→host (`useLevelOverlay`, `useLayoutEffect`, render a pantalla completa sobre la ventana en `LevelHost`) + tests; verificar que los niveles 1–9 siguen en verde.
- [ ] Documentar la ranura `overlay` en `tech-stack.md` y AGENTS.md (junto con la lección ya conocida: el componente que posiciona debe ser el que se monta).
- [ ] Implementar `windows.ts` (modelo puro: duplicación una vez por ventana, tope de 7, clamping al viewport, sorteo del Agree con semilla) + tests.
- [ ] Implementar `LevelWindow.tsx` + `renderFooter(windowId, isAgree)` como **única** ruta de render de una ventana de este nivel (usada tanto por la nº 1 como por las copias).
- [ ] Mover la ventana nº 1 publicando `translate(...)` en la ranura `windowTransform`; publicar su pie con `useLevelFooter` usando el mismo `renderFooter`.
- [ ] Renderizar las copias 2–7 en `overlay`, posicionadas por custom property escrita por ref (sin re-render por frame).
- [ ] Arrastre por la barra de título con `usePointer`: al confirmarse el drag, nace la copia (si procede) en la posición inicial de la ventana arrastrada.
- [ ] Al llegar a la séptima ventana, sortear cuál lleva el `Agree` y cambiar solo ese botón, sin animación.
- [ ] `paused` congela arrastres e input; cleanup total al desmontar + test de no-fugas.
- [ ] Sustituir el hueco 10 del registro; verificar chunk propio sin matter.js.
- [ ] Añadir `levels.10.*` a ambos diccionarios.
- [ ] GDD §14: tope de ventanas y nota de dónde nace la copia.
- [ ] Revisar el CSS de `XPWindow` en busca de suposiciones de "una sola ventana en la página" (selectores de contexto, ids, `z-index` frente a la modal de fin de nivel).
- [ ] ✋ **Checkpoint con Sofía**: que la duplicación se entienda al arrastrar, que la nº 1 sea indistinguible de las copias y que el caos de siete ventanas siga siendo jugable en su móvil.
- [ ] QA: duplicar hasta 7 y comprobar que no salen más; ganar pulsando el Agree; perder por Disagree de una copia, por la X de una copia y por contador; comparar el marcado de la nº 1 con el de una copia; `paused` a medio arrastre; recarga a mitad (una sola ventana) y con desenlace pendiente; 5 anchos con todas las ventanas alcanzables; móvil real vía Pages.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.
