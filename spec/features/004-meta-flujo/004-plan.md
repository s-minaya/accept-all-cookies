# 004 · Meta-flujo — Plan

## Enfoque

Primero la máquina de estados del flujo (pura, con tests), después las piezas visuales (pantalla de selección, texto gigante, modales) y al final el cableado con stores y registro. El estado del flujo vive en el shell, no en los niveles: `playing → verdict(win|lose) → modal(win|lose) → select`, y los niveles solo conocen `onWin` / `onLose` / `timeLeft` / `paused`.

## Implementación

1. **Contrato** — añadir `paused: boolean` a `LevelProps` (`src/levels/types.ts`); actualizar el nivel de prueba para que congele su animación e ignore input con `paused` (+ test). Documentar el cambio en `tech-stack.md` (ver nota manual).
2. **Máquina de flujo** — `src/app/runFlow.ts` (pura, con tests): estados y transiciones `playing → verdict → modal → select`, quién detiene el contador y cuándo se permite input.
3. **`GiantVerdict`** — `src/components/xp/GiantVerdict/`(SCSS BEM): texto AGREE/DISAGREE al ~70 % del ancho, sonido correspondiente aumentado de volumen, animación fade + escala + rebotes (~800 ms) con CSS, dispara el sonido correspondiente al entrar, overlay que bloquea todo el input mientras dura. + Playground (con botón para lanzarla en ambos modos).
4. **Modales de veredicto** — `src/app/flow/WinDialog.tsx` y `LoseDialog.tsx` sobre `XPDialog`: textos del GDD §6–7 vía i18n (`meta.*`), botones vía `game.*` (Next / Return to Level Selection).
5. **`XPWindow` opcional** — prop para ocultar contador y X (la selección no los lleva); verificar en Playground que los niveles siguen igual.
6. **`LevelSelectScreen`** — `src/app/screens/LevelSelectScreen/`: ventana Cookie Preferences, `LevelList` (fila con estados bloqueado/disponible/completado en BEM: `level-row--locked`, `--available`, `--done`), ✓ verde, ubicado en `assets/ui/check.png`, botón Check conectado al primer nivel pendiente.
7. **Registro completo** — `src/levels/registry.ts` con los 12 huecos (nivel de prueba como relleno con el nombre real de cada categoría); nombres en `levels.N.name` (ES/EN).
8. **Cableado del récord** — al abrir un nivel: `recordIfImproved(jugadorActual, nivel)`; al completar el 12: marcar `finished`. Ampliar `rankingStore` con `finished?: boolean` (campo opcional: no rompe los datos v1 ya guardados) y su representación en `RankingList`. Tests: mejora sí/no, perder no toca, finished distinguible.
9. **Orquestación en el shell** — integrar `runFlow` en `LevelHost`/`AppShell`: ganar/perder → congelar nivel + parar contador → `GiantVerdict` → modal → acción (progreso + récord / reinicio) → selección.
10. **Integración y QA** — partida completa de 12 niveles (de prueba) ganando; partida perdiendo por cada vía (botón, contador, X); 5 anchos; móvil real vía Pages.

## Decisiones

- **El flujo vive en el shell, no en los niveles** — los niveles no saben nada de animaciones ni modales; solo emiten `onWin`/`onLose` y obedecen `paused`. Mantiene el contrato mínimo y el flujo testeable sin montar niveles.
- **`paused` como prop del contrato** en vez de desmontar el nivel al terminar — el GDD exige el nivel visible detrás del veredicto y la modal; desmontarlo lo haría desaparecer. Cambio de contrato pequeño, validado por el nivel de prueba.
- **Récord al abrir nivel** (no al completar) — implementa la lectura natural de "nivel máximo al que ha llegado": morir en el 7 registra 7. Completar el 12 añade `finished`. Descartado: récord = niveles completados (dejaría sin récord a quien muere en el 1, y "llegué al 7" es lo que la gente presume).
- **Relleno de huecos con el nivel de prueba** — permite jugar el bucle completo hoy y garantiza que cada feature de nivel solo sustituye su hueco. Descartado: deshabilitar Check hasta la 005 (dejaría el flujo sin ejercitar de verdad).
- **Animación del veredicto en CSS** (keyframes) y no con física/JS — 800 ms fijos, determinista, barata; el overlay bloquea input durante la animación.
- **Botones y títulos del falso SO en inglés vía `game.*`** (Next, Check, Return to Level Selection, Disagree, Cookies Accepted), mensajes de las modales traducidos vía `meta.*` — coherente con la regla del GDD §11.

## Riesgos

- **Carreras entre contador a 0 y acción del jugador en el mismo instante** — mitigación: `runFlow` es una máquina de estados pura: la primera transición gana y las demás se ignoran; test específico del empate.
- **El texto gigante desborda en 375 px** — mitigación: tamaño en función del ancho de la ventana (no fijo); QA en `xs` como criterio.
- **Ampliar el esquema del ranking rompe datos guardados** — mitigación: `finished` opcional y `storage.ts` ya tolera datos viejos; test de carga de una entrada v1 sin el campo.
- **El nivel de prueba no representa a los niveles reales respecto a `paused`** — mitigación: el nivel de prueba incluye animación continua e input activo precisamente para que congelarlo sea observable; las features de nivel heredan el patrón.
- **Deriva de estilos con la migración a Sass/BEM** — mitigación: los componentes nuevos nacen ya en BEM; no se reescriben los existentes dentro de esta feature (si hiciera falta, sería una tarea de la 017).
