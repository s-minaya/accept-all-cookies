# 009 · Nivel 5 — Social Media (tragaperras) — Plan

> Plan pre-implementación: describe el enfoque tal como se planeó antes de escribir código, no se ha mantenido sincronizado con ajustes posteriores (QA con Sofía, correcciones visuales). Para el estado final as-built, ver `009-spec.md` y `009-tasks.md`.

## Enfoque

Toda la mecánica es una **máquina de estados pura + una tira que se desplaza**: primero la lógica (generación de tiras, encaje, estados spinning/stopped/respin), después el render (tira cíclica con rAF) y al final el cableado. Sin física: el nivel más barato técnicamente desde la 006, a propósito — la complejidad presupuestaria de esta feature está en el ajuste fino del "tacto" de tragaperras, no en el código.

## Implementación

1. **PRNG común** — extraer el xorshift32 de `src/levels/level04/spawner.ts` a `src/utils/prng.ts`; `spawner.ts` pasa a importarlo (tests del nivel 4 en verde antes de seguir).
2. **Generación de tiras** — `src/levels/level05/reels.ts` (pura, + tests): tira cíclica de N casillas (parámetro, ~12) con ~40 % Agree, semilla inyectable, y garantía de al menos un Agree y un Disagree por tira (reintento o reparación determinista).
3. **Máquina del nivel** — `src/levels/level05/slotMachine.ts` (pura, + tests): estado por rodillo (`spinning | stopped(resultIndex)`) + fase global (`playing | respinPause`); transiciones: `stop(rodillo, offset)` → encaje a casilla más cercana (función pura offset→índice, con test de bordes en el punto medio entre casillas) → resultado; tres parados → evaluar: triple Agree → `won`; si no → `respinPause` → (tras la pausa) reset a los tres girando.
4. **Render de rodillos** — `src/levels/level05/Reel.tsx`: tira duplicada para el bucle visual, desplazamiento por rAF con velocidad base + desfase por rodillo (parámetros), transform con custom property (regla de estilos en línea del tech-stack); marcador de fila central.
5. **Componente** — `Level05.tsx`: texto en el marco; tablero (3 rodillos + 3 Stops en estilo neutro, deshabilitado=oscurecido con el estado ya existente de `XPButton`) vía `useLevelBoard` + `fillHeight`; sonido positivo/negativo al parar según resultado; `onWin()` al evaluar triple Agree.
6. **Pausa de rehabilitación** — timeout único (limpiado en cleanup y congelado por `paused`: al pausar se cancela y al reanudar se relanza con el tiempo restante — o más simple: la pausa se mide contra el rAF ya pausado; decidir en implementación la variante más limpia, criterio: `paused` la congela de verdad).
7. **Registro e i18n** — hueco 5 sin `consentKey`; `levels.5.*` en ambos diccionarios.
8. **GDD** — retoques: mensajes de derrota del nivel 5 → nota de flujo estándar (mismo texto-patrón que el del nivel 1); §14: velocidad base de giro, desfase entre rodillos, casillas por tira, pausa de rehabilitación.
9. **QA** — partida entera ganando y perdiendo (contador con rodillos girando y con los tres parados en plena pausa; X); recargas; `paused` en todas las fases; 5 anchos (3 rodillos en 375 px); móvil real vía Pages; ✋ checkpoint de tacto.

## Decisiones

- **Sin matter.js** — un rodillo no es física, es una cinta que se mueve; usarlo aquí sería cargar 85 kB para un translate. El rAF queda amparado por la excepción de timers de la 007. Descartado: reutilizar `board.ts` del plinko (nada que reutilizar de verdad).
- **Encaje a la casilla más cercana al parar** — el GDD pide "se detiene inmediatamente en la posición actual" y también que "el botón que queda visible en el centro" sea el resultado; sin encaje, el resultado puede quedar a medias entre dos casillas y ser ilegible o discutible. El encaje es instantáneo a la casilla más cercana: conserva el espíritu de "inmediato" y hace el resultado inequívoco. Descartado: desaceleración larga de tragaperras real (cinemática bonita pero convierte el timing del jugador en mentira).
- **Victoria inmediata al tercer Stop, sin bloqueo+confirmación** — el patrón del nivel 4 existe porque allí el desenlace puede decidirse sin acción del jugador (una captura que ni ves); aquí el desenlace ES la pulsación deliberada del tercer Stop. Añadir confirmación sería fricción sin protección. (Distinción anotada para futuros niveles: bloqueo+clic solo cuando el desenlace puede llegar "solo".)
- **Rehabilitación con pausa visible (~1 s) y sin sonido** — el jugador necesita un instante para leer el resultado fallido antes de que todo vuelva a girar; un sonido en cada fallo se haría repetitivo con muchos intentos. Parámetro por si el playtesting pide otra cosa.
- **PRNG a `src/utils/`** — segunda consumidora; la regla de "2+ sitios → se extrae" aplica a utilidades igual que a componentes. Descartado: copiarlo (deriva garantizada).
- **Garantía de Agree y Disagree en cada tira** — con 12 casillas al 40 % la probabilidad de una tira degenerada es minúscula pero no nula, y una tira sin Agrees haría el nivel literalmente imposible en ese rodillo. La reparación determinista (forzar al menos uno de cada) elimina la clase entera de bug.

## Riesgos

- **El "tacto" de tragaperras no convence** (velocidad, encaje, legibilidad en movimiento) — mitigación: todos los diales con nombre en constantes; el checkpoint de Sofía es la vara; el desenfoque de movimiento o efectos extra, solo si ella los pide (017).
- **Timing imposible o trivial** — a la velocidad configurada, parar un Agree concreto puede ser pura suerte o pura facilidad; mitigación: velocidad y proporción son los dos diales, se calibran jugando en el checkpoint (objetivo del GDD: "complicado pero no frustrante").
- **Tres rodillos no caben en 375 px** — mitigación: los rodillos usan tamaños relativos con mínimo táctil en los Stops; criterio de aceptación explícito en `xs`; si aprieta, los botones de la tira pueden reducirse antes que los Stops.
- **La pausa de rehabilitación interactúa mal con `paused` o con el fin del contador** — mitigación: la fase `respinPause` vive en la máquina pura con tests propios (pausar durante la pausa, contador muriendo durante la pausa), no en un timeout suelto sin dueño.
