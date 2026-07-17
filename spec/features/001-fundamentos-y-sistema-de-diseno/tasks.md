# 001 · Fundamentos y sistema de diseño — Tareas

- [x] Crear proyecto Vite (react-ts) con TypeScript estricto; configurar ESLint + Prettier + Vitest + RTL.
- [x] Configurar `base: '/<repo>/'` en `vite.config.ts`.
- [x] Crear `src/styles/tokens.css` con todos los colores del GDD y los 5 breakpoints; crear `reset.css`.
- [x] Elegir las dos fuentes pixel (validar licencia), autoalojarlas en woff2 y declarar los `@font-face`.
- [x] ✋ **Checkpoint con Sofía**: aprobar las fuentes viéndolas en la playground con textos reales del GDD.
      _Aprobadas: UI = DotGothic16, Display = Press Start 2P (ambas OFL-1.1, autoalojadas en `src/assets/fonts/`)._
- [x] Implementar `XPButton` (agree / disagree / neutral × 4 estados, hundimiento al pulsar, `@media (hover: hover)`).
- [x] Implementar `XPWindow` (barra de título + contador + X, recuadro de consentimiento con scroll interno, marco del área de juego).
- [x] Implementar `XPDialog` (modal centrado sin X, overlay con fondo visible).
- [x] Implementar `useCountdown` + tests (pausa, reinicio, callback único a 0, limpieza al desmontar).
- [x] Implementar `pointerLogic` + tests (tap vs drag a 8 px, inmovilidad configurable) y el hook `usePointer`.
- [x] Implementar `GameArea` (lienzo lógico 640×360, `ResizeObserver`, `transform: scale`, `touch-action: none`).
- [x] Montar la playground con una sección por pieza y textos reales del GDD.
- [x] Crear `.github/workflows/deploy.yml`.
- [ ] Verificar que la URL de Pages carga sin 404 (pendiente de push a `main` con Pages habilitado en el repo).
- [x] QA responsive en 375 / 480 / 768 / 1280 / 1920 px (verificado con Chromium headless); zonas interactivas ≥ 44 px en móvil.
- [ ] QA táctil en un móvil real desde la URL de Pages (tap, drag, hover no pegado). _Requiere la URL de Pages ya desplegada._
- [x] Validar contra los criterios de aceptación de `spec.md` (los que no dependen del deploy/dispositivo real).
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`. _Se hace tras el checkpoint de fuentes y el QA táctil en dispositivo real._

## Mantenimiento (checklist recurrente)

- [ ] Al añadir cualquier componente nuevo a `src/components/xp/`, comprobar que solo usa colores de `tokens.css` y textos por props, y añadirlo a la playground.
