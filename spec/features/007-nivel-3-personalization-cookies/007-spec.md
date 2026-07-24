# 007 · Nivel 3 — Personalization Cookies

## Qué hace

Implementa el Nivel 3 (GDD §9, Nivel 3): la **ventana entera del nivel rota 360° libremente** arrastrando con ratón o dedo, el botón **Agree está anclado a la ventana pero fuera de la pantalla** (solo entra en el viewport al rotar), y dentro del área de juego un recuadro deja caer **decenas de botones Disagree con física real** que rebotan — y que son clicables: tocarlos es Game Over.

### Layout

Nivel **con tablero propio** (patrón estándar, sin la excepción del 4.3): recuadro de consentimiento pequeño con el texto de Personalization Cookies + área de juego con el **recuadro de lluvia** (más estrecho que el del texto) dentro del marco azul. En el pie, **solo el botón Disagree** — el Agree no está en el pie: está anclado a la ventana, fuera de la pantalla.

### Rotación

- Arrastrar desde cualquier punto **no interactivo** de la ventana (barra de título incluida) la rota sobre su **centro**, libre, 360°, en ambos sentidos, siguiendo el ángulo del puntero respecto al centro (1:1, sin inercia).
- **Rota la ventana entera**: barra de título, contador, botón X, texto, área de juego y pie. El contador sigue corriendo (y leyéndose torcido) y la X sigue siendo clicable — y sigue siendo derrota — en cualquier ángulo.
- El umbral tap-vs-drag de 8 px (GDD §15.3) distingue: **tap** sobre un elemento = su acción (Disagree → derrota); **drag** empezando en cualquier sitio = rotación, nunca derrota.

### El Agree oculto

- Está **anclado a la ventana** (gira con ella), a una distancia del centro calculada al montar el nivel para que a 0° quede **fuera del viewport** y entre en pantalla al rotar (~90°):
  - Viewport apaisado → se ancla **bajo** la ventana (más allá del borde inferior de la pantalla) y aparece por un **lateral** al rotar.
  - Viewport vertical → se ancla a un **lateral** y aparece por arriba/abajo al rotar.
  - La distancia se elige entre las dos semidimensiones del viewport, con margen (detalle geométrico en el plan).
- En viewports casi cuadrados el margen puede quedar justo y asomar un **borde del Agree** a 0°: se acepta como degradación (un destello verde asomando es una pista de descubrimiento, no un bug).
- Una vez visible, pulsarlo (tap, no drag) → `onWin()` → flujo estándar con "Personalization Cookies".

### La lluvia de Disagrees

- En el recuadro de lluvia caen continuamente botones **Disagree** pequeños con **física de matter.js**: gravedad, rebotes entre ellos y contra las paredes del recuadro.
- **La gravedad es siempre "hacia abajo de la pantalla"**, no del recuadro: al rotar la ventana, los botones caen en cascada dentro del recuadro girado — es la señal física de que la rotación es real y el gran caramelo visual del nivel.
- Los botones de la lluvia son **clicables**: tap sobre cualquiera → derrota (motivo botón incorrecto). Empezar un drag sobre uno → rotación, sin castigo.
- Población limitada (máx. ~25 simultáneos, reciclando los que se acumulan; parámetro ajustable) para mantener el rendimiento.

### Victoria y derrota

- **Victoria**: tap sobre el Agree descubierto.
- **Derrota**: tap sobre cualquier Disagree (el fijo del pie o cualquiera de la lluvia), contador a 0, o la X (en cualquier ángulo).

### Recarga y pausa

- `paused` congela física, lluvia, rotación e input.
- Recargar a mitad de nivel restaura el contador (comportamiento general), pero **la rotación vuelve a 0° y la lluvia empieza de nuevo**: el estado visual/físico es efímero y no se persiste. Con desenlace pendiente, la modal correspondiente, como en el resto de niveles.

### Cambio de contrato (el tercero → consolidación)

Rotar la ventana exige que el nivel publique una transformación que aplica el shell (la ventana es de `LevelHost`, no del nivel). Es la **tercera** ampliación del contrato, así que se aplica la regla de freno de la 005: en vez de otro hook suelto, se **consolida el canal nivel→host** que ya existe para el pie (`useLevelFooter`) en un único mecanismo con ranuras con nombre (pie, transformación de ventana), del que `useLevelFooter` pasa a ser un envoltorio fino — los niveles 1 y 2 no se tocan. Detalle en el plan; se documenta en `tech-stack.md` en el mismo cambio.

## Por qué

Es el primer nivel "wow" del juego y el que más vende la premisa en un clip de 10 segundos. Técnicamente estrena tres cosas de las que dependen niveles posteriores: matter.js con su import dinámico (el nivel 4 lo reutiliza), el canal nivel→host consolidado, y la excepción a la regla de timers para bucles de física/animación. Mejor estrenarlas aquí, donde la física es decorativa-letal, que en el plinko donde es el corazón jugable.

## Criterios de aceptación

### Rotación
- [ ] Arrastrar desde cualquier zona no interactiva rota la ventana entera (título, contador, X, texto, área, pie) sobre su centro, 360° en ambos sentidos, siguiendo el dedo/ratón 1:1.
- [ ] Un drag que empieza sobre un botón (incluido un Disagree de la lluvia) rota y no dispara su acción; un tap sí la dispara (umbral 8 px, test de la lógica).
- [ ] La X y el contador funcionan en cualquier ángulo de rotación.

### Agree oculto
- [ ] A 0°, el Agree no es visible (salvo el borde tolerado en viewports casi cuadrados) ni pulsable por accidente desde fuera de pantalla.
- [ ] Al rotar, entra en el viewport y un tap sobre él gana con el flujo estándar y la categoría correcta.
- [ ] La geometría (eje de anclaje + distancia) se calcula al montar según la orientación del viewport (test de la función pura con viewports apaisado, vertical y casi cuadrado).

### Lluvia
- [ ] Los Disagrees caen, rebotan entre sí y contra el recuadro, con la gravedad siempre orientada hacia abajo **de la pantalla**: al rotar la ventana, caen en cascada dentro del recuadro girado (test de la transformación del vector de gravedad).
- [ ] Tap sobre cualquier Disagree de la lluvia (o el del pie) → derrota estándar con motivo de botón incorrecto.
- [ ] La población se mantiene ≤ el máximo configurado sin acumulación infinita ni caída de rendimiento apreciable.

### Integración y calidad
- [ ] matter.js se importa dinámicamente dentro del chunk del nivel: no aparece en el bundle principal ni en los chunks de otros niveles (verificado en el build).
- [ ] Al desmontar el nivel no queda vivo ningún Runner/rAF/listener de física (test).
- [ ] `paused` congela física, rotación e input; recargar a mitad de nivel retoma con el contador restaurado, rotación a 0 y lluvia nueva; con desenlace pendiente, la modal.
- [ ] Hueco 3 del registro sustituido, chunk propio; texto en ambos diccionarios bajo `levels.3.*`.
- [ ] Partida entera ganando y perdiendo; jugable con dedo y ratón; correcto en los 5 anchos (la geometría del Agree verificada al menos en 375 px vertical y 1280 px apaisado).
- [ ] Canal nivel→host consolidado documentado en `tech-stack.md`; niveles 1 y 2 sin cambios funcionales (sus tests siguen en verde).

## Fuera de alcance

- El plinko del nivel 4 → feature 008 (reutilizará la integración de matter.js de aquí).
- Inercia o "impulso" en la rotación → si el playtesting la pide, se añade como parámetro; de salida es 1:1.
- Persistir rotación o estado de la lluvia al recargar → efímeros a propósito.
