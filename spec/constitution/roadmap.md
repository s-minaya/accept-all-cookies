# Roadmap

_Orden y estado de las features. El GDD (`../assets/accept-all-cookies-gdd.md`) define QUÉ es cada cosa; cada feature lo traduce a spec + plan + tareas._

## Hecho ✅

1. **001 · Fundamentos y sistema de diseño** — proyecto Vite + React, tokens de color, fuentes pixel (DotGothic16 + Press Start 2P, aprobadas por Sofía), breakpoints y sistema responsive (resolución lógica + escala), `XPWindow`, `XPButton` (agree / disagree / neutral, 4 estados), `XPDialog`, hook `usePointer`, hook `useCountdown`. Playground desplegada en GitHub Pages y verificada en móvil real por Sofía.
2. **002 · Shell y estado global** — enrutado de pantallas por estado interno (`AppShell`, 4 pantallas placeholder), store Zustand (`run`, `settings`, `ranking`, los tres persistidos en `storage.ts`: recargar la página retoma la partida donde se dejó), i18n ES/EN + `useT()`, audio (`AudioManager`/`useAudio`, sonido de victoria/derrota disparado desde `AppShell`), contrato `LevelComponent` + `LevelHost` con carga perezosa por nivel, nivel de prueba end-to-end. `AppShell` sustituye a la Playground como raíz de `App.tsx` (Playground sigue accesible vía `?playground` hasta la 017).
3. **003 · Landing** — landing real: fondo (`landing-bg.png` en escritorio ≥1025px, `landing-bg-mobile.png` en móvil y tablet), `CuteButton` "Empezar", 4 accesos solo-icono estilo "retro 8-bit" (Personaje/Ranking/Información/Configuración; esquina inferior derecha en fila en escritorio/tablet, centro derecha en columna en móvil). Ventanas modales sobre `XPWindow`/`XPDialog` (con X y `className` opcionales): selección de personaje + nombre (`playerStore`, `aac.v1.lastPlayer`), ranking (orden puro `rankingSort.ts`, actualización real del récord diferida a la 004), información, ajustes (idioma; volumen — solo afecta a la música, no a los efectos; música y efectos on/off por separado). Nuevas piezas de diseño: `XPTextInput`, `XPSlider`, `XPToggle`.

## Siguiente 🔜

4. **004 · Meta-flujo** — pantalla de selección de niveles, ventanas Game Over y Level Complete con las animaciones AGREE/DISAGREE, reinicio de progreso, actualización del ranking (incluye cablear `recordIfImproved`, diferido explícitamente desde la 003).

## Backlog (ordenado) 💡

5. **005 · Nivel 1 — Essential Cookies** — retardo del Agree, diálogo de error, reinicio del contador. (Primer nivel real: valida el contrato de nivel de punta a punta.)
6. **006 · Nivel 2 — Analytics Cookies** — colores intercambiados.
7. **007 · Nivel 3 — Personalization** — rotación 360° de la ventana + lluvia de Disagrees con física.
8. **008 · Nivel 4 — Advertising (Plinko)** — física, botón de 6 segmentos, guía-slider.
9. **009 · Nivel 5 — Social Media (tragaperras)** — rodillos, stops, rehabilitación.
10. **010 · Nivel 6 — Cross-Site Tracking** — tablero verificado (`../assets/nivel6-tablero.json`), cámara que sigue a la llave.
11. **011 · Nivel 7 — Data Sharing** — cubierta arrastrable, tap-vs-drag.
12. **012 · Nivel 8 — Third-Party Providers (trilero)** — giro, barajados, bloqueo de input.
13. **013 · Nivel 9 — Fingerprinting** — casillas independientes, puntero inmóvil / mantener pulsado.
14. **014 · Nivel 10 — Legitimate Interest** — ventanas que se duplican al arrastrarse.
15. **015 · Nivel 11 — Consent Renewal** — personaje tipo Clippy, patrón de preguntas.
16. **016 · Nivel 12 — Accept All + créditos** — barra teatral, switcheo del botón, pantalla de créditos.
17. **017 · Pulido y QA transversal** — balanceo de dificultad, repaso de audio, QA responsive en los 5 anchos de referencia, accesibilidad básica, rendimiento.

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código. Los niveles 5–16 pueden reordenarse si conviene, pero 001–004 son prerrequisito de todos.
