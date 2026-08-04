# 012 · Nivel 8 — Third-Party Providers (trilero) — Plan

> Plan pre-implementación: describe el enfoque tal como se planeó antes de escribir código, no se ha mantenido sincronizado con ajustes posteriores. Dos cambios de fondo respecto a lo que describe este documento: (1) el reloj de fases (`phaseClock.ts`) no reproduce el guion vía una `transition` CSS — entrega progreso continuo 0..1 por fotograma y `Level08Grid.tsx` escribe la posición interpolada él mismo (mismo patrón imperativo que `Reel.tsx`/`Board.tsx`), lo que evita por completo el riesgo que este plan señalaba en "congelar una transición CSS a medio camino": `paused` simplemente deja de escribir, sin ningún truco de congelado; (2) la cuadrícula vive en un componente propio, `Level08Grid.tsx` (no inline en `Level08.tsx` como sugiere el punto 4 de abajo) — bug real encontrado con Playwright: `useLevelBoard` monta la cuadrícula un ciclo de render después del propio `Level08`, así que un `useLayoutEffect` en el componente equivocado leía refs todavía `null` y los 12 botones se quedaban apilados en el origen (mismo problema que ya resolvió `Board.tsx` en la 010, aplicado aquí igual). Para el estado final as-built, ver `012-spec.md` y `012-tasks.md`. (3) Post-cierre, corrección de playtesting: al elegir en `choosing`, solo el botón pulsado gira hacia su cara real antes de disparar `onWin`/`onLose` (nueva fase `revealChoice`) — el veredicto ya no salta directo al resultado; ver `012-tasks.md`, "Corrección de playtesting".

## Enfoque

Separar por completo **coreografía** de **render**: toda la partida (posición inicial del Agree + las tres rondas de intercambios) se genera de golpe al pulsar el Agree, como un **guion determinista** derivado de una semilla; el componente solo lo reproduce. Así el barajado entero es testeable sin navegador y es imposible que la animación y la "verdad" (dónde está el Agree) discrepen — el fallo clásico de este tipo de nivel.

## Implementación

1. **Guion del barajado** — `src/levels/level08/shuffle.ts` (puro, + tests, PRNG de `src/utils/prng.ts`):
   - `createShuffleScript(seed, agreeIndex)` → `{ rounds: Round[], finalAgreeCell: number }`, con `Round = { durationMs, swaps: [a, b][] }`.
   - Cada ronda genera N pares disjuntos por tanda (parámetros por ronda: 4 / 6 / 8 intercambios, ajustables) sobre 12 celdas; aplicando el guion a una permutación identidad se obtiene el mapa final celda→botón.
   - Tests: la permutación resultante es una biyección; el Agree acaba en `finalAgreeCell`; misma semilla → mismo guion; semillas distintas → posiciones iniciales distintas (muestreo).
2. **Máquina de fases** — `src/levels/level08/phases.ts` (pura, + tests): `reveal → flip → shuffling(ronda 0..2) → choosing → done`; qué input se acepta en cada fase (solo `reveal` y `choosing`); avance por duración acumulada.
3. **Reloj de fases** — un temporizador basado en rAF con acumulador (patrón de `pathAnimator` de la 010): avanza las fases, se congela con `paused` y se cancela en cleanup. Sin `setTimeout` sueltos (evita el problema de "pausar a mitad" que ya resolvió la 009).
4. **Componente** — `Level08.tsx`: texto en el marco; cuadrícula vía `useLevelBoard`; 12 botones **con identidad estable** (key = id de botón, no celda) posicionados por `transform: translate(var(--cell-x), var(--cell-y))`; los intercambios cambian esas custom properties y una `transition` de la duración de la ronda hace el resto — cero re-render por frame.
5. **Estilos** — `Level08.module.scss` (BEM): rejilla responsive (4×3 / 3×4), flip 3D con `rotateY` y cambio de cara a mitad del giro, `z-index` temporal a los dos botones que se cruzan, arco ligero opcional en el recorrido (keyframe con desplazamiento vertical) si Sofía lo pide en el checkpoint.
6. **Identidad oculta** — el botón que era Agree se identifica solo por su id en el estado del nivel; el DOM no lleva ninguna marca (`data-*`, clases, orden) que permita distinguirlo tras el flip. Test: tras el flip, los 12 nodos tienen atributos y clases idénticos salvo la posición.
7. **Registro e i18n** — hueco 8 sin `consentKey`; `levels.8.*` en ambos diccionarios (texto de consentimiento ya redactado en el GDD).
8. **GDD** — anotar la decisión sobre pulsar Disagree en la fase reveal y añadir a §14 los parámetros (duración del flip, duraciones e intercambios por ronda).
9. **QA** — ganar y perder; pulsar durante el barajado (no debe pasar nada); `paused` a mitad de ronda; recargas; 5 anchos; móvil real; checkpoint de legibilidad.

## Decisiones

- **Guion precalculado en vez de barajar "en vivo"** — misma filosofía que el camino precalculado del nivel 6: la lógica decide todo de golpe (puro, testeable) y la animación solo reproduce. Descartado: intercambiar aleatoriamente en cada tick (la verdad viviría en el DOM y sería intestable).
- **Identidad de botón estable, la celda es un atributo** — React mantiene los 12 nodos y solo cambian sus coordenadas: los intercambios se ven como movimiento continuo, no como parpadeos. Descartado: reordenar el array (React remontaría/reordenaría nodos y rompería la ilusión).
- **Posición por custom property + `transition` CSS** — el navegador interpola; cero JS por frame, coherente con 009–011. La duración de la ronda es la duración de la transición.
- **Reloj de fases sobre rAF, no `setTimeout`** — `paused` tiene que congelar el barajado sin desfasar lo que queda de ronda; con timeouts habría que recalcular restos a mano (la 009 ya pagó ese peaje).
- **Pulsar un Disagree en reveal = derrota (por defecto)** — coherente con toda la casa: un Disagree es un Disagree. La alternativa ("no hace nada") convertiría los 11 en decorado y le quitaría tensión al primer clic, que es el momento en que el jugador decide fiarse de lo que ve.
- **3×4 en móvil en vez de 4×3 encogido** — 12 celdas igual, pero botones legibles y ≥ 44 px en 375 px; la lógica no cambia (el guion opera sobre índices 0–11, no sobre coordenadas).
- **`coin.mp3` en el flip** — el momento pide un golpe sonoro y el asset ya existe; una sola vez, no doce. Vetable.

## Riesgos

- **El barajado resulta imposible de seguir (o trivial)** — mitigación: número de intercambios por ronda y duraciones son parámetros; el checkpoint de Sofía decide; si hace falta, más intercambios en la ronda rápida o arco en los recorridos.
- **Dos botones que intercambian se solapan y "parpadean"** — mitigación: `z-index` temporal al par en movimiento y, si hace falta, arco vertical para que el cruce se lea; se ajusta con los ojos en el checkpoint.
- **La identidad del Agree se filtra al DOM sin querer** (orden de nodos, clase residual del reveal) — mitigación: test explícito de indistinguibilidad tras el flip; es el bug que haría el nivel trivial para cualquiera que abra el inspector.
- **`paused` a mitad de una transición CSS** — mitigación: al pausar se congela la transición (`transition: none` + fijar el valor interpolado actual) y al reanudar se relanza con el tiempo restante de la ronda; test de la máquina de fases y verificación visual.
- **Recarga a mitad de barajado deja al jugador confundido** (vuelve al reveal con otra posición) — es coherente con el resto de niveles (estado efímero) y además evita regalar información; anotado en la spec.
