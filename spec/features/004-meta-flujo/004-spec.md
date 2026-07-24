# 004 · Meta-flujo

**Estado:** implementada

## Qué hace

Construye el esqueleto jugable del juego: la pantalla de selección de niveles real y el flujo completo de victoria y derrota, con sus animaciones y ventanas. Al cerrar esta feature, el bucle entero del juego se puede jugar de principio a fin (con el nivel de prueba ocupando los huecos de los 12 niveles reales hasta que lleguen las features 005–016).

### Pantalla de selección de niveles (GDD §5)

- `XPWindow` con título **Cookie Preferences**, fondo beige `#EFE7DC`, **sin contador y sin botón X** (la ventana común debe permitir ocultarlos), ocupando casi toda la altura de la pantalla (`scrollableContent`, único uso de `XPWindow` que activa este modo — ver "Ventana de nivel" más abajo).
- Botón de volver a la landing anclado dentro del cuerpo beige (prop `cornerAccessory` de `XPWindow`), en flujo normal (reserva su propio espacio, nunca tapa la lista): arriba a la izquierda en tablet/escritorio, abajo a la izquierda en móvil.
- Lista de los 12 niveles en un único bloque blanco continuo (sin borde ni separación entre filas — el único borde azul de la pantalla es el que ya envuelve la lista, el marco de `XPWindow`), con scroll interno si no caben las 12 filas. Cada fila lleva el número delante del nombre ("1: Essential Cookies") en negrita, con tres estados:
  - **Bloqueado**: blanco, texto negro, sin icono ni botón.
  - **Disponible**: igual que el bloqueado, pero con el botón **Check** al final de la fila — su presencia es la única marca de que es el nivel disponible.
  - **Completado**: fondo verde con aire por los 4 lados y esquinas redondeadas (no a sangre con la fila) + icono ✓ blanco con bordes verdes más oscuros al final de la fila (en el sitio donde el disponible muestra el Check); persiste toda la partida.
- El botón Check vive dentro de la fila disponible, no como botón separado de la pantalla: abre siempre el primer nivel no completado. Con los 12 completados no hay fila disponible, así que no aparece en ningún sitio.
- Los nombres de los niveles se traducen (`levels.N.name`); son contenido, no palabras del juego.

### Ventana de nivel

`XPWindow` se ajusta a su contenido y queda centrada en la pantalla (`LevelHost` la envuelve en un contenedor `min-height: 100dvh` con centrado) — a diferencia de la pantalla de selección, nunca ocupa la altura completa de la pantalla.

### Flujo de victoria (GDD §7)

1. El nivel dispara `onWin()` → el contador se detiene y el nivel queda **congelado** (ver contrato más abajo).
2. **Fase 1 — texto gigante `AGREE`**: ~70 % del ancho de la ventana con la letra lo más grande posible dentro de ese espacio, blanco con contorno grueso del tono del botón Agree (`--color-agree-border`) y destello/resplandor detrás a juego, fuente pixel display; fade + escala + 2–3 rebotes; **sonido positivo**; toda la interfaz bloqueada; ~800 ms.
3. **Fase 2 — ventana modal** (mismo `XPDialog`/`XPWindow`, sin X, nivel visible detrás): título **Cookies Accepted**, mensaje dinámico con el nombre de la categoría completada, botón **Next**.
4. Pulsar Next: actualiza el progreso (`completeLevel`), actualiza el récord del ranking, vuelve a la selección con el nivel en verde y el siguiente auto-seleccionado.

### Flujo de derrota (GDD §6)

1. El nivel dispara `onLose(reason)` — o el shell lo dispara por contador a 0 o por la X.
2. **Fase 1 — texto gigante `DISAGREE`**: mismo comportamiento, con contorno y destello del tono del botón Disagree (`--color-disagree-border`) y **sonido negativo**.
3. **Fase 2 — ventana modal**: título **Disagree**, mensaje del GDD, botón **Return to Level Selection**.
4. Pulsar el botón: **reinicia la partida por completo** (todas las marcas verdes desaparecen, Level 1 vuelve a ser el único disponible). El ranking **no** se toca.

### Récord del ranking

- **Definición** (fija la ambigüedad del GDD §1.2): el récord es el **nivel más alto alcanzado** — se registra al *abrir* un nivel, de modo que morir en el nivel 7 deja récord 7. Completar el nivel 12 marca además la partida como **terminada** (`finished`), que el ranking muestra de forma distinguible de "llegó al 12" (insignia verde en vez del número de nivel).
- `recordIfImproved` se llama al abrir cada nivel (y `finished` al completar el 12) con el jugador actual. Es el cableado que faltaba desde la 002.
- El avatar del personaje en la ventana Ranking crece progresivamente con el ancho de pantalla: 56px (móvil) → 72px (tablet, ≥481px) → 88px (escritorio, ≥1025px) → 136px (escritorio grande, ≥1441px).
- Cada fila del ranking pone el nombre de usuario en su propia línea y el nivel alcanzado (o la insignia de terminado) junto con la fecha en una segunda línea debajo, en vez de las 4 columnas en una sola fila — así un nombre largo nunca se corta por falta de sitio.

### Cambio de jugador reinicia la partida

Confirmar en la modal de Personaje un personaje y/o nombre **distinto** del jugador activo reinicia la partida en curso (`resetRun`), igual que un Game Over pero sin pasar por la ventana de derrota ni volver a la pantalla de selección — el jugador se queda donde estaba (normalmente la landing) y puede pulsar Empezar para jugar desde el Nivel 1. Confirmar sin cambiar nada no reinicia nada. El récord histórico del ranking nunca se toca por esto.

### Cambio de contrato de nivel

`LevelProps` gana `paused: boolean`: mientras se muestra el veredicto o la modal, el nivel sigue montado y visible detrás pero congelado (sin animaciones propias ni input). El nivel de prueba se actualiza para demostrarlo.

### Registro de niveles

El registro tiene los 12 huecos; los niveles aún no implementados apuntan al nivel de prueba con el nombre real de su categoría. Las features 005–016 los van sustituyendo. Con los 12 completados, la modal del 12 usa el botón **Next** (Credits llega en la 016) y en la selección no queda ninguna fila disponible, así que el botón Check no aparece.

## Por qué

Es el momento en que el proyecto pasa de "pantallas" a "juego": todo el ciclo jugar → ganar/perder → progresar/reiniciar queda cerrado y probado antes de construir ningún nivel real. Cada feature de nivel (005–016) solo tendrá que enchufar su mecánica en un flujo ya verificado. Además salda la deuda detectada por el agente: el ranking por fin se alimenta.

## Criterios de aceptación

### Selección
- [x] La ventana de selección no muestra contador ni X, ocupa casi toda la altura de la pantalla y respeta el diseño del GDD §5 (título, beige, lista sin bordes internos, botón de volver dentro del cuerpo beige sin tapar ninguna fila).
- [x] Los tres estados de fila se ven correctamente (numeradas, sin separación entre ellas, el completado con aire y esquinas redondeadas); el disponible aparece auto-seleccionado con el botón Check al final de su fila; no se puede abrir ningún otro nivel por ningún medio.
- [x] Check abre el primer nivel no completado; con los 12 completados, ninguna fila lo muestra.
- [x] La ventana de un nivel (a diferencia de la de selección) se ajusta a su contenido y queda centrada en la pantalla, nunca ocupa la altura completa.

### Flujo de victoria
- [x] Al ganar: contador detenido, nivel congelado, AGREE gigante con su animación y sonido (~800 ms, input bloqueado), después la modal Cookies Accepted con el nombre de la categoría correcta, y Next devuelve a la selección con el nivel en verde y el siguiente seleccionado.

### Flujo de derrota
- [x] Al perder (por acción del nivel, contador a 0 o X): DISAGREE gigante con sonido negativo, modal Disagree, y su botón reinicia la partida entera (verde borrado, Level 1 único disponible).
- [x] El ranking no se altera al perder (test).

### Récord
- [x] Abrir un nivel registra el récord si mejora el histórico del jugador actual (test).
- [x] Completar el nivel 12 marca la partida como terminada y el ranking lo muestra distinguible (test + visual).
- [x] Tras una partida que mejora el récord, la ventana Ranking de la landing lo refleja (cierre del criterio diferido de la 003).

### Cambio de jugador
- [x] Confirmar un personaje y/o nombre distinto del jugador activo reinicia la partida en curso; confirmar la misma identidad no reinicia nada; el récord del ranking no se ve afectado en ningún caso (test).

### Contrato y calidad
- [x] `paused` congela el nivel de prueba (animación e input) mientras hay veredicto o modal, con el nivel visible detrás (test).
- [x] Los 12 huecos del registro cargan (nivel de prueba donde toque) separados del bundle principal en el build; serán chunks distintos entre sí en cuanto cada feature de nivel (005-016) sustituya su hueco.
- [x] Nombres de nivel y mensajes de las modales en ambos diccionarios (`levels.*`, `meta.*`); los títulos Disagree/Cookies Accepted y el botón Check permanecen en inglés vía `game.*` con el test de identidad — Next (`meta.win.nextButton`) y Return to Level Selection (`meta.lose.returnButton`) sí se traducen, no son vocabulario del falso sistema operativo (GDD §11).
- [x] Todo el flujo es jugable con dedo y ratón y correcto en los 5 anchos de referencia. Confirmado visualmente por Sofía.

## Fuera de alcance

- Los 12 niveles reales → features 005–016.
- Pantalla de créditos y botón Credits del nivel 12 → feature 016.

