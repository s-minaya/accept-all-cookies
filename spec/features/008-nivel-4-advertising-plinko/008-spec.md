# 008 · Nivel 4 — Advertising (Plinko)


## Qué hace

Implementa el Nivel 4 (GDD §9, Nivel 4): un tablero **Plinko** de 30 pegs por el que llueven botones Agree y Disagree pequeños con física, y un **gran botón Agree de 6 segmentos** en la parte inferior que el jugador mueve horizontalmente para capturar los buenos y esquivar los malos. Incluye además una herramienta transversal temporal: el **botón dev de saltar nivel**.

### Layout

- Recuadro de consentimiento estándar con el texto de Advertising Cookies (el único elemento con marco azul, según la regla vigente del GDD §4.4: **el tablero de juego no lleva marco** y aprovecha todo el espacio restante de la ventana).
- Tablero Plinko ocupando ese espacio: 30 pegs en distribución clásica de Plinko.
- Bajo el tablero, la **guía horizontal** del botón grande; el pie de la ventana no lleva botones (el botón grande ES el botón del nivel).

### El Plinko

- Desde arriba aparecen continuamente botones pequeños, cada uno aleatoriamente **Agree o Disagree al 50 %** (GDD §14).
- Caen con gravedad (matter.js, integración heredada de la 007), rebotan en los pegs y colisionan entre ellos; cada rebote altera ligeramente la trayectoria: aproximadamente predecible, nunca exacto.
- Tasa de aparición y población máxima como **parámetros ajustables** (GDD §14); los botones que caen fuera del alcance del jugador sin ser capturados desaparecen.

### Control del botón grande

- Solo movimiento **horizontal**, dentro de la guía:
  - **Ratón**: sigue la X del puntero (con `usePointer`).
  - **Táctil**: sigue el dedo arrastrando en cualquier punto del área de juego (GDD §15.2, no hace falta tocar el botón).
  - **Teclado**: flechas ← → (velocidad como parámetro).
- **Guía-slider** (GDD): la pista es azul oscuro `#153859`; el tramo entre el extremo izquierdo y la posición actual del botón se pinta beige `#B49E85` y encoge al volver a la izquierda — representa posición, nunca deja rastro.

### El botón de 6 segmentos

- Empieza vacío (`□□□□□□`). Visualmente es **un solo botón** con estética XP cuyos segmentos, al llenarse, muestran el estilo **completo** del botón Agree o Disagree (fondo, bordes, relieve — fragmentos de botón de verdad, no rectángulos de color).
- Capturar un **Agree**: sonido positivo + se rellena por la **izquierda**. Capturar un **Disagree**: sonido negativo + se rellena por la **derecha**.
- **Regla de sustitución**: mientras haya huecos, cada captura **solo rellena** un segmento por su lado, sin tocar los del contrario (capturar un Agree con la barra vacía → 1 Agree; capturar después un Disagree → 1 Agree y 1 Disagree conviviendo). **Con los 6 segmentos llenos**, cada nueva captura **sustituye el segmento fronterizo del color contrario** (el último de la frontera). El botón siempre representa el equilibrio actual.
- **Nota de GDD**: esta regla coincide con la prosa original del GDD (que era correcta); lo incoherente era su **ejemplo**, que borraba un Disagree con huecos disponibles. La corrección del ejemplo va como tarea, con el texto listo.

### Victoria y derrota

- **Victoria**: 6 segmentos Agree → flujo estándar con "Advertising Cookies".
- **Derrota**: 6 segmentos Disagree (motivo propio), contador a 0, o X.

### Pausa y recarga

- `paused` congela física, spawn, control y sonidos.
- Recargar a mitad de nivel: contador restaurado; física y **segmentos** vuelven a empezar (estado efímero, como la rotación de la 007). Con desenlace pendiente, la modal.

### Botón dev de saltar nivel (temporal)

- Un botón pequeño y discreto, visible **solo cuando la URL lleva `?dev`** (mismo patrón de interruptor de arranque que `?playground`), renderizado por `LevelHost` — funciona por tanto en cualquier nivel, presente o futuro, sin tocar los niveles.
- Al pulsarlo: completa el nivel actual al instante y vuelve a la selección **sin veredicto ni modal** (es una herramienta de testeo, no juego; el flujo real se prueba jugando).
- Pasa por el mismo camino de datos que una victoria real (`completeLevel`, con su efecto en récord/`finished` incluido — quien testee con `?dev` ensucia su ranking local a sabiendas; se puede limpiar borrando localStorage).
- **Se retira en la 017** junto con la Playground (añadir a su línea del roadmap) y queda anotado en AGENTS.md para que ningún agente lo "limpie" antes de tiempo ni lo olvide después.

## Por qué

Es el corazón arcade del juego: el primer nivel de habilidad continua (los anteriores son de descubrimiento). Reutiliza toda la infraestructura de física de la 007 — si aquella pagó los peajes, esta cobra los dividendos. Y el botón dev desbloquea el testeo del resto del proyecto: a partir de aquí quedan 8 niveles y probar el 11 sin poder saltar los 10 anteriores sería una tortura.

## Criterios de aceptación

### Plinko y control
- [ ] 30 pegs en distribución clásica; los botones caen, rebotan en pegs y entre ellos, con reparto Agree/Disagree ~50 % (test del generador con semilla).
- [ ] El botón grande sigue al puntero (ratón), al dedo arrastrando en cualquier punto del área (táctil) y a las flechas (teclado), siempre limitado a la guía (test del clamping).
- [ ] La guía pinta el tramo beige hasta la posición actual y encoge al volver, sin rastro permanente.
- [ ] El tablero se renderiza sin marco azul, aprovechando el espacio de la ventana (regla del GDD §4.4 vigente).

### Segmentos
- [ ] La máquina de segmentos cumple la regla confirmada en todos los casos: con huecos, cada captura solo rellena por su lado; con los 6 llenos, sustituye el fronterizo contrario; victoria con 6 Agree y derrota con 6 Disagree (tests exhaustivos de la lógica pura, incluidas secuencias mixtas largas, la remontada desde 5 contrarios y el tablero lleno alternando).
- [ ] Cada captura suena (positivo/negativo, respetando el interruptor de efectos) y el segmento muestra el estilo completo del botón correspondiente, no un rectángulo plano.
- [ ] ✋ Visual de los segmentos aprobado por Sofía (que parezca un botón troceado de verdad).

### Integración y calidad
- [ ] matter.js compartido con la 007 sin duplicarse en el bundle principal ni entre chunks (verificado en build).
- [ ] Cleanup total al desmontar (Runner, rAF, listeners) + test de no-fugas; `paused` congela todo.
- [ ] Recarga a mitad (contador restaurado, tablero y segmentos de cero) y con desenlace pendiente (modal).
- [ ] Hueco 4 sustituido con chunk propio; `levels.4.*` en ambos diccionarios; partida entera ganando y perdiendo; dedo y ratón; 5 anchos.

### Botón dev
- [ ] Sin `?dev` en la URL no existe (ni en el DOM); con `?dev`, completa el nivel al instante desde cualquier nivel y vuelve a la selección sin veredicto ni modal.
- [ ] Anotado en AGENTS.md (no retirar antes de la 017, retirar en la 017) y añadido a la línea de la 017 en el roadmap.

## Fuera de alcance

- Ajuste fino de dificultad (tasa de spawn, velocidad de caída) más allá de valores iniciales jugables → checkpoint aquí + repaso global en la 017.
- Persistir tablero o segmentos al recargar → efímeros a propósito.
- Retirar el botón dev → feature 017.
