# 009 · Nivel 5 — Social Media (tragaperras)

## Qué hace

Implementa el Nivel 5 (GDD §9, Nivel 5): una **máquina tragaperras de tres rodillos** llenos de botones Agree y Disagree girando a gran velocidad. El jugador detiene cada rodillo con su botón **Stop**; solo `Agree | Agree | Agree` supera el nivel. Si detiene los tres sin conseguirlo, tras una breve pausa **los rodillos vuelven a girar y los Stops se rehabilitan** — puede intentarlo tantas veces como el contador le permita.

### Layout (patrón as-built de la 007/008)

- Texto de consentimiento de Social Media Cookies **dentro del marco azul**, ajustado a su contenido.
- El **tablero de la tragaperras** se publica aparte vía `useLevelBoard` y se renderiza debajo del marco, sin marco propio, aprovechando el espacio sobrante (`fillHeight` activo, como el nivel 3: los rodillos necesitan altura real).
- Dentro del tablero: **tres rodillos verticales** centrados y, bajo cada uno, su botón **Stop** (estilo neutro). **Sin pie de ventana**: toda la interacción es con los Stops.

### Los rodillos

- Cada rodillo es una **tira cíclica** de botones Agree/Disagree generada al montar con **PRNG con semilla** (compartido con el del nivel 4, extraído a módulo común): proporción **~40 % Agree** (GDD §14), con la garantía de que ninguna tira queda sin Agrees ni sin Disagrees.
- Giran desde el inicio a gran velocidad (parámetro), con un pequeño desfase de velocidad entre rodillos (decorativo). **Sin matter.js**: es un desplazamiento vertical cíclico con rAF (excepción de timers vigente), no física.
- Un marcador visual señala la **fila central** de cada rodillo (la que cuenta como resultado).

### Los botones Stop

- Al pulsar un Stop: su rodillo se detiene **al instante**, con un ajuste de encaje a la casilla más cercana para que el botón resultante quede perfectamente centrado en el marcador (decisión: legibilidad del resultado; el "instante" del GDD se conserva — el encaje es subpíxel-a-casilla, no una animación larga).
- Suena la confirmación: **positivo si el resultado es Agree, negativo si es Disagree** (respetando el interruptor de efectos).
- El Stop usado queda **deshabilitado y oscurecido**; los otros rodillos siguen girando.

### Rehabilitación

- Con los **tres rodillos detenidos** y resultado distinto de triple Agree: tras una **pausa breve** (parámetro, ~1 s, para que el jugador vea y digiera el resultado), los tres rodillos vuelven a girar y los tres Stops se rehabilitan. Sin sonido adicional.
- No hay límite de intentos: el límite es el contador.

### Victoria y derrota

- **Victoria**: los tres rodillos detenidos mostrando `Agree | Agree | Agree` → `onWin()` inmediato (la pulsación del tercer Stop ya es el acto deliberado del jugador; no aplica el patrón de bloqueo+confirmación del nivel 4, que existe porque allí el desenlace puede decidirse sin que el jugador haga nada) → flujo estándar con "Social Media Cookies".
- **Derrota**: **solo** contador a 0 o X o los 3 rodillos en disagree.
- **Nota de GDD**: los mensajes de derrota propios del nivel en el GDD ("Time expired.", "Cookie preferences discarded.") son anteriores al Game Over unificado y quedan sustituidos por el flujo estándar, como en el precedente del nivel 1 (retoque de GDD en tareas).

### Pausa y recarga

- `paused` congela rodillos (rAF), pausa de rehabilitación, Stops y sonidos.
- Recargar a mitad: contador restaurado; rodillos, resultados parciales y tiras **de cero** (efímero, como en 007/008). Con desenlace pendiente, la modal.

## Por qué

Es el nivel de azar-con-timing del juego: puro tira y afloja contra el reloj, sin mecánica oculta que descubrir — un respiro de diseño entre el plinko y el tablero de flechas. Técnicamente es barato (nada de física: una tira que se desplaza), y consolida dos piezas compartidas: el PRNG común y el patrón de tablero-bajo-marco por tercera vez consecutiva.

## Criterios de aceptación

### Rodillos y Stops
- [ ] Los tres rodillos giran desde el inicio; cada tira respeta ~40 % de Agree con al menos un Agree y un Disagree (test del generador con semilla).
- [ ] Cada Stop detiene su rodillo al instante con encaje a la casilla más cercana; el resultado es el de la fila central marcada (test de la función de encaje: desplazamiento → índice resultante).
- [ ] El Stop usado queda deshabilitado y oscurecido; los demás rodillos siguen girando; suena positivo/negativo según el resultado.
- [ ] Tres detenidos sin triple Agree → tras la pausa configurada, los tres giran de nuevo y los tres Stops se rehabilitan (test de la máquina de estados del nivel), tantas veces como haga falta.

### Victoria y derrota
- [ ] Triple Agree al detener el tercero → `onWin()` inmediato con el flujo estándar y la categoría correcta.
- [ ] La única derrota es contador a 0 o X o 3 disagree; verificado también con los tres rodillos parados esperando la rehabilitación cuando el contador muere.

### Integración y calidad
- [ ] Texto en el marco azul; tablero vía `useLevelBoard` debajo, con `fillHeight`; sin pie; hueco 5 sustituido con chunk propio; **sin matter.js en este chunk** (verificado en build).
- [ ] PRNG extraído a módulo común y reutilizado por los niveles 4 y 5 sin duplicación (tests de ambos en verde).
- [ ] Cleanup total al desmontar (rAF, timeouts de la pausa) + test de no-fugas; `paused` congela todo, incluida la pausa de rehabilitación.
- [ ] Recarga a mitad (contador restaurado, tragaperras de cero) y con desenlace pendiente (modal).
- [ ] `levels.5.*` en ambos diccionarios; GDD retocado (mensajes de derrota → flujo estándar; §14 con velocidad, desfase, pausa de rehabilitación).
- [ ] Partida entera ganando y perdiendo; dedo y ratón (los Stops cumplen el mínimo táctil); 5 anchos (los tres rodillos caben en 375 px sin scroll horizontal).

## Fuera de alcance

- Niveles 6–12 → features 010–016.
- Efectos de "casi-premio" (dos Agrees y el tercero pasa rozando) o animaciones de celebración → si el playtesting los pide, a la 017.
- Ajuste fino de velocidad/proporción → valores iniciales jugables aquí, repaso global en la 017.
