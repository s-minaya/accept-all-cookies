# 008 · Nivel 4 — Advertising (Plinko)

## Qué hace

Implementa el Nivel 4 (GDD Nivel 4): un tablero **Plinko** de 30 pegs por el que llueven fichas Agree y Disagree con física, y un **gran botón Agree de 6 segmentos** en la parte inferior que el jugador arrastra horizontalmente para capturar las buenas y esquivar las malas. Incluye además una herramienta transversal temporal: el **botón dev de saltar nivel**.

### Layout

- El texto de Advertising Cookies ocupa el marco azul del área de juego, como los niveles 1-3 (corregido tras revisión de Sofía: "los terminos y condiciones de las cookies no estan en su recuadro azul, como en todos los niveles"). El tablero Plinko se publica aparte, DEBAJO de ese marco y fuera de él (GDD §4.4), sin marco propio — mismo patrón que el recuadro de lluvia del nivel 3.
- Tablero Plinko ocupando ese espacio: 30 pegs en distribución clásica de Plinko.
- Bajo el tablero, la guía horizontal del botón grande; el pie de la ventana no lleva botones (el botón grande ES el botón del nivel).

### El Plinko

- Desde arriba aparecen continuamente fichas finas (relleno del tono oscuro de un botón real, sin borde propio ni el relieve/anillo interior de un botón real), con el texto "Agree"/"Disagree" en la misma tipografía que los botones reales pero a menor tamaño, cada una aleatoriamente Agree o Disagree al 50 % (GDD §14).
- Caen con gravedad (matter.js, integración compartida con la 007), rebotan en los pegs y colisionan entre ellas; cada rebote altera ligeramente la trayectoria: aproximadamente predecible, nunca exacto. Una ficha que quede encajada contra un peg (detectada por falta de progreso neto en Y, no por velocidad instantánea) recibe un empujón para liberarse, hasta un máximo de intentos, antes de reciclarse de verdad como último recurso.
- Tasa de aparición y población máxima como parámetros ajustables (GDD §14); las fichas que caen fuera del alcance del jugador sin ser capturadas desaparecen.

### Control del botón grande

- Solo movimiento horizontal, dentro de la guía:
  - **Ratón**: se arrastra (pulsar y mover); el arrastre puede empezar en cualquier punto del área de juego, no hace falta pulsar sobre el botón.
  - **Táctil**: arrastrar el dedo en cualquier punto del área de juego (GDD §15.2).
  - **Teclado**: flechas ← → (velocidad como parámetro).
- **Guía-slider**: la pista es azul oscuro `#153859`; el tramo entre el extremo izquierdo y la posición actual del botón se pinta beige `#B49E85` y encoge al volver a la izquierda — representa posición, nunca deja rastro.
- **Bloqueo al decidirse el desenlace**: en cuanto los 6 segmentos son de un solo color, el botón deja de responder a ratón/táctil/teclado (la física entera se pausa) y pasa a ser un botón real, pulsable, que dispara el veredicto.

### El botón de 6 segmentos

- Empieza vacío (`□□□□□□`). Visualmente es un único botón, del mismo tamaño exacto que un Agree/Disagree real del resto del juego: los 6 segmentos son una cuenta interna, no 6 botones pegados uno junto a otro. El relleno crece desde cada lado con el color exacto de Agree/Disagree, adopta también el anillo interior de color de un botón real por ese lado, y revela progresivamente el texto "Agree"/"Disagree" a medida que crece, letra a letra — el anillo exterior oscuro y el bisel siguen siendo los de la silueta exterior compartida, no de cada relleno.
- Capturar un Agree: sonido positivo + se rellena por la izquierda. Capturar un Disagree: sonido negativo + se rellena por la derecha.
- **Regla de sustitución**: mientras haya huecos, cada captura solo rellena un segmento por su lado, sin tocar los del contrario. Con los 6 segmentos llenos, cada nueva captura sustituye el segmento fronterizo del color contrario. El botón siempre representa el equilibrio actual.

### Victoria y derrota

- **Victoria**: 6 segmentos Agree bloquean el botón grande; un clic (o Enter/Espacio con foco) sobre él dispara el flujo estándar con "Advertising Cookies".
- **Derrota**: 6 segmentos Disagree, con el mismo bloqueo + clic para confirmar; o contador a 0, o X (estas dos, inmediatas, sin botón que pulsar).

### Pausa y recarga

- `paused` congela física, spawn, control y sonidos. Un desenlace ya decidido pero sin confirmar congela lo mismo, por el mismo mecanismo (`setPaused`), independientemente del `paused` del host.
- Recargar a mitad de nivel: contador restaurado; física y segmentos vuelven a empezar (estado efímero, como la rotación de la 007). Con desenlace pendiente, la modal.

### Botón dev de saltar nivel (temporal)

- Un botón pequeño y discreto, visible solo cuando la URL lleva `?dev` (mismo patrón que `?playground`), renderizado por `LevelHost` — funciona en cualquier nivel, presente o futuro, sin tocar los niveles.
- Al pulsarlo: completa el nivel actual al instante y vuelve a la selección sin veredicto ni modal.
- Pasa por el mismo camino de datos que una victoria real (`completeLevel`, con su efecto en récord/`finished` incluido).
- Se retira en la 017 junto con la Playground; anotado en AGENTS.md para que no se retire antes de tiempo.

## Por qué

Es el corazón arcade del juego: el primer nivel de habilidad continua (los anteriores son de descubrimiento). Reutiliza toda la infraestructura de física de la 007. El botón dev desbloquea el testeo del resto del proyecto.

## Criterios de aceptación

### Plinko y control
- [x] 30 pegs en distribución clásica; las fichas caen, rebotan en pegs y entre ellas, con reparto Agree/Disagree ~50 %.
- [x] El botón grande se mueve arrastrando con el ratón, con el dedo (táctil) y con las flechas (teclado), siempre limitado a la guía; mover el ratón sin pulsar no lo mueve.
- [x] La guía pinta el tramo beige hasta la posición actual y encoge al volver, sin rastro permanente.
- [x] El texto de consentimiento vive en el marco azul del área de juego (como los niveles 1-3); el tablero se publica aparte vía `useLevelBoard`, sin marco propio, aprovechando el espacio sobrante de la ventana.

### Segmentos
- [x] La máquina de segmentos cumple la regla en todos los casos: con huecos, cada captura solo rellena por su lado; con los 6 llenos, sustituye el fronterizo contrario; victoria con 6 Agree y derrota con 6 Disagree.
- [x] Cada captura suena (respetando el interruptor de efectos) y el botón entero se rellena con el color correspondiente, dentro de una única silueta con relieve.
- [x] Al completarse los 6 segmentos de un color, el botón se bloquea y el desenlace no se dispara hasta que el jugador lo pulsa (`role="button"`, clic o Enter/Espacio).
- [ ] ✋ Visual y tamaño del botón-paleta y de las fichas que caen aprobados por Sofía; dificultad general jugando en escritorio y móvil.

### Integración y calidad
- [x] matter.js compartido con la 007 sin duplicarse en el bundle principal ni entre chunks.
- [x] Cleanup total al desmontar (Runner, rAF, listeners de teclado); `paused` congela todo.
- [x] Recarga a mitad de nivel (contador restaurado, tablero y segmentos de cero) y con desenlace pendiente (modal, mecanismo compartido de la 004).
- [x] Hueco 4 sustituido con chunk propio; `levels.4.*` en ambos diccionarios; partida entera ganando y perdiendo, con dedo y ratón. Pendiente de Sofía: los 5 anchos de referencia y móvil real vía Pages.

### Botón dev
- [x] Sin `?dev` en la URL no existe (ni en el DOM); con `?dev`, completa el nivel al instante desde cualquier nivel y vuelve a la selección sin veredicto ni modal.
- [x] Anotado en AGENTS.md (no retirar antes de la 017) y añadido a la línea de la 017 en el roadmap.

## Fuera de alcance

- Ajuste fino de dificultad más allá de valores iniciales jugables → checkpoint aquí + repaso global en la 017.
- Persistir tablero o segmentos al recargar → efímeros a propósito.
- Retirar el botón dev → feature 017.
