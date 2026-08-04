# 016 · Nivel 12 — Accept All + créditos

**Estado:** implementada

## Qué hace

Implementa el **jefe final** (GDD §9, Nivel 12) y la **pantalla de créditos**. Aparentemente basta con pulsar `Agree` muchas veces para llenar una barra de progreso. En realidad la barra es **teatro**: tras un número aleatorio de pulsaciones (**entre 15 y 35**), el botón se convierte **instantáneamente** en `Disagree` —misma posición, de verde a rojo, sin animación ni aviso— contando con que el jugador esté clicando en piloto automático. Quien lo detecta y **deja de pulsar 2 segundos** ve el botón volver a `Agree`; al pulsarlo, la barra se completa sola y el juego termina.

### Layout

- Texto de consentimiento de Accept All **dentro del marco azul**, sobre fondo blanco (patrón as-built).
- Vía `useLevelBoard`, debajo del marco: la **barra de progreso** horizontal.
- **Pie de ventana** vía `useLevelFooter`: **Disagree rojo** a la izquierda (botón normal, pulsarlo pierde) y a la derecha el **botón protagonista**, que empieza siendo `Agree` verde.

### La barra de progreso

- Empieza vacía. Cada pulsación del botón protagonista la sube **muy poco** (parámetro), dando la sensación de que harán falta muchísimos clics.
- Si pasan **0,5 s sin pulsar**, la barra **decrece** un poco (parámetro). Sigue decreciendo también durante el estado trampa y durante la espera de 2 s: es tensión visual, no mecánica.
- **La barra nunca se completa a base de clics**: es puro teatro y así está documentado en el GDD. Su única función es inducir el clic compulsivo. Solo se completa de golpe al ganar.

### La trampa

- Al montar el nivel se sortea `switchAt` ∈ **[15, 35]** (PRNG con semilla, `src/utils/prng.ts`).
- **En el instante en que se registra la pulsación número `switchAt`**, el botón pasa a `Disagree` rojo: misma posición, mismo tamaño, cambio inmediato de color y texto, **sin transición** — la siguiente pulsación del jugador en piloto automático cae sobre él.
- Pulsar el botón mientras es `Disagree` → **derrota** (`failed`), igual que el Disagree fijo de la izquierda.
- Si el jugador **deja de pulsar durante 2 s** con el botón en estado trampa, este vuelve a `Agree` verde (también instantáneo).
- Pulsarlo entonces → **victoria**: la barra se completa automáticamente hasta el 100 % con una animación breve y se dispara el flujo estándar con "Accept All".
- Si el jugador vuelve a pulsar antes de que pasen los 2 s, pierde. El temporizador de 2 s **se reinicia con cada pulsación fallida**… pero como esa pulsación ya es derrota, en la práctica solo hay una oportunidad: parar a tiempo.

### Fin del juego

- La modal de victoria del nivel 12 muestra el mensaje final del GDD §7.2 ("You have accepted every cookie category.") y su botón es **`Credits`** (ya previsto desde la 004).
- Al pulsarlo se abre la **pantalla de créditos**, no la selección de niveles.

### Pantalla de créditos

- Pantalla propia del shell (el hueco `credits` existe como placeholder desde la 002), con estética XP: `XPWindow` con scroll interno, sin contador y sin X.
- Contenido (GDD §10), en tono gracioso y cómplice, en ES/EN:
  - Felicitación troll al jugador por haber luchado por el derecho a ser rastreado.
  - Créditos de autoría (Sofía Minaya) por diseño, pixel art y guerra psicológica; **código a medias con Claude** ("Sofía Minaya & Claude" en la fila de Código, ver as-built).
  - **Inspiración**: *Doki Doki Action Game*.
  - **Homenaje**: "Sans © Toby Fox (Undertale) — homenaje sin ánimo de lucro" (requisito heredado de la 015).
  - **Agradecimiento especial** al jugador ("A ti.") por demostrar que los patrones oscuros funcionan.
  - El remate sobre las cookies: las únicas del juego son las del `localStorage`, y solo guardan el ranking.
- Un único botón: **volver al menú principal**.
- **Al salir de créditos, la partida se reinicia** (`resetRun`) para que el jugador pueda volver a jugar desde el Nivel 1. El récord del ranking (con su marca `finished`, ya cableada en la 004) **no** se toca.
- **Confeti** al llegar a la pantalla (ver as-built): celebración puramente visual, nunca bloquea el botón de volver.

**As-built (ronda 2):** el texto completo de los créditos se reescribió (intro en dos tiempos, agradecimiento especial reestructurado en tres bloques, chiste de los datos ampliado a 7 líneas con remate final) manteniendo la guía de puntos y el resto de la estructura, y se sumó a Claude en el crédito de Código sin trasladar ningún mensaje personal literal al juego. El efecto de confeti al llegar a los créditos se implementó en CSS puro (sin dependencia nueva, ver `spec/constitution/tech-stack.md`) siguiendo el mismo patrón sin librería que `GiantVerdict`: 60 piezas de 8×8px con la paleta de tokens existente, generadas una vez y auto-limpiadas con `animation-fill-mode: forwards` (sin `setTimeout`).

### Pausa y recarga

- `paused` congela el decaimiento de la barra, el temporizador de 2 s y el input.
- Recargar a mitad: contador restaurado; barra, contador de clics y `switchAt` **de cero** (efímero, como el resto). Con desenlace pendiente, la modal.

## Por qué

Es el remate temático del juego: después de once niveles peleándose con la interfaz para poder aceptar, el último le pide al jugador exactamente lo que todo banner de cookies quiere de él —clicar sin mirar— y le castiga por hacerlo. Y cierra el proyecto: con esta feature el juego se puede jugar entero, de la landing a los créditos.

## Criterios de aceptación

### Barra y trampa
- [x] Cada pulsación sube la barra un poco; sin pulsar, decrece cada 0,5 s; nunca llega al 100 % a base de clics (test de la lógica pura con series largas).
- [x] `switchAt` se sortea en [15, 35] y el cambio a `Disagree` ocurre exactamente en esa pulsación, sin animación ni transición (test con semillas distintas).
- [x] Pulsar el botón en estado trampa pierde; pulsar el Disagree fijo de la izquierda pierde en cualquier momento.
- [x] Tras 2 s sin pulsar en estado trampa, el botón vuelve a `Agree`; pulsarlo entonces completa la barra al 100 % y gana con el flujo estándar y la categoría correcta.
- [x] El estado del botón (agree/trampa/restaurado) es una máquina pura testeada en sus cuatro transiciones, incluida la pulsación justo en el límite de los 2 s.

### Fin del juego y créditos
- [x] La modal de victoria del nivel 12 muestra el mensaje final y su botón `Credits` abre la pantalla de créditos (no la selección).
- [x] Los créditos existen en ES y EN, con la autoría, la inspiración (*Doki Doki Action Game*) y el homenaje a Sans © Toby Fox; scroll interno si no caben; sin contador ni X.
- [x] El botón de los créditos vuelve a la landing **reiniciando la partida** (`resetRun`), y el ranking conserva el récord con su marca `finished` (test).
- [x] Tras los créditos, pulsar Empezar inicia una partida nueva desde el Nivel 1 (verificado jugando: no queda el juego en un estado "sin nivel disponible").
- [x] El confeti (petición de la ronda 2 del checkpoint) es decorativo puro: `aria-hidden`, `pointer-events: none`, nunca bloquea el botón de volver ni añade roles/botones accesibles (test) — verificado también con Playwright a tres anchos (1280/390/375) sin desbordamiento horizontal.

### Integración y calidad
- [x] Hueco 12 sustituido con chunk propio (sin matter.js); `levels.12.*` y `credits.*` en ambos diccionarios; PRNG compartido reutilizado.
- [x] La barra no re-renderiza el árbol por frame (custom property escrita por ref, patrón as-built 009–015); el componente que la posiciona es el que se monta (lección 010–012).
- [x] `paused` congela decaimiento, temporizador de 2 s e input; recarga a mitad (todo de cero, contador restaurado) y con desenlace pendiente (modal).
- [x] Cleanup total al desmontar (reloj, temporizadores) + test de no-fugas.
- [x] Botones ≥ 44 px; clic sostenido/ráfaga con dedo y con ratón; 5 anchos; móvil real con **toques CDP** (`Input.dispatchTouchEvent`, no `page.mouse`). (As-built: verificado en 1280px escritorio y 390×844/375×667 móvil con toques CDP reales; el resto de anchos y el móvil real vía Pages quedan para el checkpoint, igual que en el resto de niveles.)
- [x] ✋ Checkpoint: textos de los créditos en ES y EN, ritmo de la barra (que dé sensación de "faltan mil clics" sin ser tediosa) y si la trampa cae bien jugando del tirón tras los once niveles anteriores. (Aprobado, con retoques de texto propios — ver as-built de la ronda 2 arriba y en `016-tasks.md`.)

## Fuera de alcance

- Retirar la Playground y `?dev` → feature 017.
- Balanceo final de dificultad y repaso global de audio/responsive → feature 017.
- Estadísticas de partida en los créditos (tiempo total, intentos) → no está en el GDD; al backlog si apetece.
