# 008 · Nivel 4 — Advertising (Plinko) — Tareas

## Lógica pura

- [x] `segments.ts`: máquina de los 6 segmentos (rellenar por su lado con huecos; sustituir el fronterizo contrario a tablero lleno) + tests exhaustivos. 12 tests.
- [x] `spawner.ts`: PRNG propio (xorshift32, sin dependencia) con semilla inyectable, distribución ~50 % Agree/Disagree. 6 tests.
- [x] `control.ts`: clamping de la paleta + paso de teclado. 9 tests.

## Física (`board.ts`)

- [x] 30 pegs al tresbolillo (`generatePegPositions`, pura — mismas coordenadas para física y DOM).
- [x] Lluvia de fichas con física real (matter.js, chunk compartido con la 007): spawn continuo, colisiones con pegs y entre ellas, captura por evento `collisionStart`, retirada al cruzar el fondo sin ser capturadas.
- [x] Botón grande como cuerpo cinemático: estático para matter.js (nunca responde a la gravedad), teletransportado a la posición del control en cada paso — participa en colisiones sin que la física decida su posición.
- [x] Detección de ficha encajada contra un peg por progreso neto en Y (no por velocidad instantánea, que puede quedarse por encima del umbral de reposo sin que el cuerpo avance de verdad): sin bajar al menos 5 px en 0,7 s recibe un empujón que la aleja del peg más cercano, hasta 3 veces antes de reciclarla de verdad como red de seguridad final.
- [x] Parámetros actuales: gravedad 0,0016; rebote (pegs y fichas) 0,35; tamaño de ficha 72×22; tamaño de paleta 110,4×48 (tamaño exacto de un `XPButton`); población 14 en escritorio / 8 en táctil; spawn cada 300 ms.
- [x] Cleanup total al desmontar (Runner parado, listeners desconectados, engine destruido) + tests de no-fugas. 9 tests.

## `Level04.tsx`

- [x] Texto de consentimiento en el marco azul del área de juego (como los niveles 1-3, corregido tras revisión de Sofía); tablero publicado aparte vía `useLevelBoard`, sin marco propio (GDD §4.4), aprovechando el espacio sobrante; sin pie (el botón grande vive dentro del tablero).
- [x] Fichas que caen: relleno de color oscuro (tono del anillo interior de un botón real) sin borde propio, con el texto "Agree"/"Disagree" en la tipografía habitual a menor tamaño.
- [x] Botón grande (paleta): relleno de dos colores creciendo desde cada lado, con el anillo interior y el texto de un botón real revelándose progresivamente a medida que crece; anillo exterior y bisel compartidos por toda la silueta.
- [x] Control por arrastre (ratón/táctil, `usePointer` con `onDragStart`/`onDragMove`) y teclado (flechas).
- [x] Al completarse los 6 segmentos de un color, el botón se bloquea (deja de responder al control, física en pausa) y se convierte en un botón real (`role="button"`, clic o Enter/Espacio) que dispara `onWin`/`onLose` — el desenlace nunca se dispara solo.
- [x] Sonidos de captura (`useAudio().playPositive/playNegative`) respetando el interruptor de efectos.
- [x] Cleanup total al desmontar; `paused` congela física, spawn, control y sonidos. 11 tests de componente + 5 tests del desenlace pendiente (`Level04.outcome.test.tsx`, `./board` simulado para disparar `onCapture` a mano).

## Integración

- [x] Hueco 4 del registro (sin `consentKey`, sin `frameless` — texto en el marco azul, tablero vía `useLevelBoard`); chunk propio (`Level04-*.js`) y matter.js factorizado en su propio chunk compartido con la 007 (`matter-*.js`, ~85 kB), no duplicado.
- [x] `levels.4.*` en ambos diccionarios.
- [x] Botón dev de saltar nivel en `LevelHost` (gated `?dev`, completa sin veredicto ni modal, mismo camino de datos que una victoria real) — funciona en cualquier nivel. Anotado en AGENTS.md y en la línea de la 017 del roadmap para su retirada futura.

## Extensiones a mecanismos compartidos

- [x] `usePointer` gana `onDragStart`/`onDragMove` como vía de control (ya existían para el nivel 3); el arrastre puede empezar en cualquier punto del área de juego, no hace falta pulsar sobre el botón.
- [x] `GameArea` reenvía su `ref` (`forwardRef`) al lienzo lógico — primer nivel real que usa `GameArea` fuera de la Playground; añadido un polyfill de `ResizeObserver` en `src/test/setup.ts` (jsdom no lo implementa).
- [x] `XPWindow`/`LevelDefinition` ganan `frameless`: `children` pasa a ser opcional y el marco azul deja de renderizarse cuando no hay `children`.
- [x] `useAudio()` memoiza `playPositive`/`playNegative` con `useCallback` — hook compartido, beneficia a cualquier consumidor que use su valor de retorno dentro de sus propios `useCallback`/`useEffect` (documentado en `tech-stack.md`).
- [x] Cuerpos físicos a tamaño lógico fijo (constantes en `board.ts`), nunca medidos con `getBoundingClientRect()`: el lienzo de `GameArea` se escala con `transform: scale()`, así que medir el tamaño en pantalla desalinearía cuerpo físico y sprite.

## GDD

- [x] Corregido el ejemplo de sustitución de segmentos (la prosa ya era correcta).
- [x] §14 con los parámetros de este nivel (segmentos, pegs, población, spawn, gravedad, rebote, tamaños, reposo/empujón, velocidad de teclado, ancho de captura).

## Pendiente

- [ ] ✋ **Checkpoint con Sofía**: dificultad jugando en escritorio y en su móvil (tasa de spawn, velocidad, anchura del sensor de captura, sensación de las trayectorias y del rebote) + aprobación del aspecto final de la paleta y de las fichas que caen. Los 5 anchos de referencia y el recorrido completo en móvil real vía Pages.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md` (pendiente del checkpoint).

## Mantenimiento (checklist recurrente)

- [ ] Si se ajusta cualquier parámetro de dificultad, actualizar GDD §14 y los tests afectados en el mismo cambio.
