# 004 · Meta-flujo


## Qué hace

Construye el esqueleto jugable del juego: la pantalla de selección de niveles real y el flujo completo de victoria y derrota, con sus animaciones y ventanas. Al cerrar esta feature, el bucle entero del juego se puede jugar de principio a fin (con el nivel de prueba ocupando los huecos de los 12 niveles reales hasta que lleguen las features 005–016).

### Pantalla de selección de niveles (GDD §5)

- `XPWindow` con título **Cookie Preferences**, fondo beige `#EFE7DC` que deja ver los bordes azules, **sin contador y sin botón X** (la ventana común debe permitir ocultarlos).
- Lista de los 12 niveles (fondo blanco, borde 1 px gris) con tres estados por fila:
  - **Bloqueado**: blanco, texto negro, no seleccionable.
  - **Disponible**: el primer nivel no completado, seleccionado automáticamente.
  - **Completado**: fondo verde + icono ✓ blanco con bordes verdes más oscuros; persiste toda la partida.
- Botón **Check** (neutro) a la derecha: abre siempre el primer nivel no completado. No hay elección libre de nivel.
- Los nombres de los niveles se traducen (`levels.N.name`); son contenido, no palabras del juego.

### Flujo de victoria (GDD §7)

1. El nivel dispara `onWin()` → el contador se detiene y el nivel queda **congelado** (ver contrato más abajo).
2. **Fase 1 — texto gigante `AGREE`**: ~70 % del ancho de la ventana, blanco con contorno verde grueso, utilizando el mismo tono del agree original, fuente pixel display; fade + escala + 2–3 rebotes; **sonido positivo**; toda la interfaz bloqueada; ~800 ms.
3. **Fase 2 — ventana modal** (mismo `XPDialog`/`XPWindow`, sin X, nivel visible detrás): título **Cookies Accepted**, mensaje dinámico con el nombre de la categoría completada, botón **Next**.
4. Pulsar Next: actualiza el progreso (`completeLevel`), actualiza el récord del ranking, vuelve a la selección con el nivel en verde y el siguiente auto-seleccionado.

### Flujo de derrota (GDD §6)

1. El nivel dispara `onLose(reason)` — o el shell lo dispara por contador a 0 o por la X.
2. **Fase 1 — texto gigante `DISAGREE`**: idéntico comportamiento, con **sonido negativo**.
3. **Fase 2 — ventana modal**: título **Disagree**, mensaje del GDD, botón **Return to Level Selection**.
4. Pulsar el botón: **reinicia la partida por completo** (todas las marcas verdes desaparecen, Level 1 vuelve a ser el único disponible). El ranking **no** se toca.

### Récord del ranking

- **Definición** (fija la ambigüedad del GDD §1.2): el récord es el **nivel más alto alcanzado** — se registra al *abrir* un nivel, de modo que morir en el nivel 7 deja récord 7. Completar el nivel 12 marca además la partida como **terminada** (`finished`), que el ranking muestra de forma distinguible de "llegó al 12".
- `recordIfImproved` se llama al abrir cada nivel (y `finished` al completar el 12) con el jugador actual. Es el cableado que faltaba desde la 002.

### Cambio de contrato de nivel

`LevelProps` gana `paused: boolean`: mientras se muestra el veredicto o la modal, el nivel sigue montado y visible detrás pero congelado (sin animaciones propias ni input). El nivel de prueba se actualiza para demostrarlo.

### Registro de niveles

El registro tiene los 12 huecos; los niveles aún no implementados apuntan al nivel de prueba con el nombre real de su categoría. Las features 005–016 los van sustituyendo. Con los 12 completados, la modal del 12 usa el botón **Next** (Credits llega en la 016) y en la selección el botón Check queda deshabilitado.

## Por qué

Es el momento en que el proyecto pasa de "pantallas" a "juego": todo el ciclo jugar → ganar/perder → progresar/reiniciar queda cerrado y probado antes de construir ningún nivel real. Cada feature de nivel (005–016) solo tendrá que enchufar su mecánica en un flujo ya verificado. Además salda la deuda detectada por el agente: el ranking por fin se alimenta.

## Criterios de aceptación

### Selección
- [ ] La ventana de selección no muestra contador ni X, y respeta el diseño del GDD §5 (título, beige, lista, Check).
- [ ] Los tres estados de fila se ven correctamente; el disponible aparece auto-seleccionado; no se puede abrir ningún otro nivel por ningún medio.
- [ ] Check abre el primer nivel no completado; con los 12 completados, Check está deshabilitado.

### Flujo de victoria
- [ ] Al ganar: contador detenido, nivel congelado, AGREE gigante con su animación y sonido (~800 ms, input bloqueado), después la modal Cookies Accepted con el nombre de la categoría correcta, y Next devuelve a la selección con el nivel en verde y el siguiente seleccionado.

### Flujo de derrota
- [ ] Al perder (por acción del nivel, contador a 0 o X): DISAGREE gigante con sonido negativo, modal Disagree, y su botón reinicia la partida entera (verde borrado, Level 1 único disponible).
- [ ] El ranking no se altera al perder (test).

### Récord
- [ ] Abrir un nivel registra el récord si mejora el histórico del jugador actual (test).
- [ ] Completar el nivel 12 marca la partida como terminada y el ranking lo muestra distinguible (test + visual).
- [ ] Tras una partida que mejora el récord, la ventana Ranking de la landing lo refleja (cierre del criterio diferido de la 003).

### Contrato y calidad
- [ ] `paused` congela el nivel de prueba (animación e input) mientras hay veredicto o modal, con el nivel visible detrás (test).
- [ ] Los 12 huecos del registro cargan (nivel de prueba donde toque) cada uno como chunk separado en el build.
- [ ] Nombres de nivel y mensajes de las modales en ambos diccionarios (`levels.*`, `meta.*`); los textos de botón del falso SO (Next, Check, Return to Level Selection, títulos Disagree/Cookies Accepted en tanto contienen palabras del juego) permanecen en inglés vía `game.*` con el test de identidad.
- [ ] Todo el flujo es jugable con dedo y ratón y correcto en los 5 anchos de referencia.

## Fuera de alcance

- Los 12 niveles reales → features 005–016.
- Pantalla de créditos y botón Credits del nivel 12 → feature 016.

