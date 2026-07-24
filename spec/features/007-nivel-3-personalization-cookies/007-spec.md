# 007 · Nivel 3 — Personalization Cookies

**Estado:** en curso

## Qué hace

Implementa el Nivel 3 (GDD §9, Nivel 3): la **ventana entera del nivel rota 360° libremente** arrastrando con ratón o dedo, y dentro del recuadro de lluvia (donde caen decenas de botones **Disagree con física real**) hay una **cámara oculta** a la derecha, recortada por el propio marco del recuadro, donde reposa quieto el botón **Agree** como un cuerpo físico más — sin moverse hasta el primer giro del jugador. Solo girar la ventana en sentido **antihorario (izquierda)** inclina la gravedad de la lluvia lo suficiente para que el Agree ruede fuera de su escondite y caiga dentro del recuadro visible, donde se puede pulsar; una vez ahí, no puede volver a esconderse.

### Layout

Excepción del GDD §4.3 (como los niveles 1 y 2, **corregido tras revisión de Sofía, dos rondas**):
1. Primera ronda: se descartó por completo el patrón estándar con recuadro de consentimiento pequeño separado — el texto de consentimiento pasó al interior del marco azul del área de juego, como los niveles 1-2.
2. Segunda ronda ("el borde azul oscuro SOLO cubre los términos y condiciones de las cookies. El tablero de juego se renderiza justo debajo, aprovechando el tamaño sobrante que queda"): el marco azul **se ajusta solo al texto** (`children` de `XPWindow`, sin estirarse) — ya no comparte marco con el recuadro de lluvia. El **recuadro de lluvia** (más estrecho que el del texto) se publica aparte, vía la nueva ranura `board` del canal nivel→host (`useLevelBoard`), y `XPWindow` lo renderiza como `boardBelowFrame`: **debajo del marco azul, fuera de él**, en el espacio sobrante del cuerpo de la ventana. Cuando `boardBelowFrame` está presente, el marco deja de estirarse (`flex: 1`) y pasa a `flex: 0 0 auto`, ajustado a su contenido.

En el pie, **solo el botón Disagree** — el Agree no está en el pie ni anclado a la ventana: vive dentro del propio recuadro de lluvia, como un cuerpo físico más. La ventana usa `fillHeight` (a diferencia del nivel 1, que no lo necesita): no por el texto (que vuelve a acotarse a los ~12rem moderados de siempre), sino porque sin altura real en la ventana no habría espacio "sobrante" que darle al recuadro de lluvia debajo del marco — sin `fillHeight` el recuadro de lluvia queda recortado o fuera de la vista (bug real, detectado en QA con Playwright).

### Rotación

- Arrastrar desde cualquier punto **no interactivo** de la ventana (barra de título incluida) la rota sobre su **centro**, libre, 360°, en ambos sentidos, siguiendo el ángulo del puntero respecto al centro (1:1, sin inercia).
- **Rota la ventana entera**: barra de título, contador, botón X, texto, área de juego y pie. El contador sigue corriendo (y leyéndose torcido) y la X sigue siendo clicable — y sigue siendo derrota — en cualquier ángulo.
- El cursor sobre la ventana indica que se puede arrastrar (`grab` en reposo, `grabbing` mientras se arrastra), para que el jugador descubra la mecánica sin depender solo de tropezar con ella.
- El umbral tap-vs-drag de 8 px (GDD §15.3) distingue: **tap** sobre un elemento = su acción (Disagree → derrota); **drag** empezando en cualquier sitio = rotación, nunca derrota.

### El Agree oculto

- Vive **dentro del recuadro de lluvia**, como un cuerpo más de la simulación de matter.js, en una **cámara oculta** que se extiende a la derecha del recuadro visible — recortada por el propio `overflow: hidden` del recuadro (no por el borde del viewport).
- Nace ya en su posición de reposo, **completamente quieto** (sin caída animada al cargar el nivel — corregido tras QA: antes se veía "esconderse" un instante). No responde a la gravedad hasta que el jugador gira la ventana por primera vez, sea cual sea el sentido.
- **Solo girar en sentido antihorario (izquierda)** inclina la gravedad (siempre "hacia abajo de la pantalla", igual que la lluvia) lo suficiente para que ruede desde la cámara oculta hasta el recuadro visible. Girar en sentido horario (derecha) lo empuja más adentro de su escondite, nunca lo revela.
- Una vez dentro del recuadro visible, cae y rebota como un Disagree más — clicables ambos por igual, pero pulsarlo a él (tap, no drag) → `onWin()` → flujo estándar con "Personalization Cookies". No se recicla como los Disagree: una vez revelado, **no puede volver a la cámara oculta** aunque el jugador gire hacia el otro lado después (corregido tras QA: antes podía "perderse" de nuevo al rebotar y girar).

### La lluvia de Disagrees

- En el recuadro de lluvia caen continuamente botones **Disagree** pequeños con **física de matter.js**: gravedad, rebotes entre ellos y contra las paredes del recuadro.
- **La gravedad es siempre "hacia abajo de la pantalla"**, no del recuadro: al rotar la ventana, los botones caen en cascada dentro del recuadro girado — es la señal física de que la rotación es real, el gran caramelo visual del nivel, y el mismo mecanismo que revela al Agree.
- Los botones de la lluvia son **clicables**: tap sobre cualquiera → derrota (motivo botón incorrecto). Empezar un drag sobre uno → rotación, sin castigo.
- Población limitada (máx. ~25 simultáneos en escritorio, reciclando los que se acumulan; parámetro ajustable) para mantener el rendimiento. **En dispositivos táctiles, la población se reduce a ~12** (detectado por tipo de puntero, igual que el multiplicador de volumen de la música — no dejan sitio en pantalla, corregido tras revisión de Sofía). El Agree no cuenta para ese máximo ni se recicla.

### Victoria y derrota

- **Victoria**: tap sobre el Agree, una vez ha caído dentro del recuadro visible.
- **Derrota**: tap sobre cualquier Disagree (el fijo del pie o cualquiera de la lluvia), contador a 0, o la X (en cualquier ángulo).

### Recarga y pausa

- `paused` congela física, lluvia, rotación e input.
- Recargar a mitad de nivel restaura el contador (comportamiento general), pero **la rotación vuelve a 0° y la lluvia (incluido el Agree, de vuelta a su cámara oculta) empieza de nuevo**: el estado visual/físico es efímero y no se persiste. Con desenlace pendiente, la modal correspondiente, como en el resto de niveles.

### Cambio de contrato (el tercero → consolidación)

Rotar la ventana exige que el nivel publique una transformación que aplica el shell (la ventana es de `LevelHost`, no del nivel). Es la **tercera** ampliación del contrato, así que se aplica la regla de freno de la 005: en vez de otro hook suelto, se **consolida el canal nivel→host** que ya existe para el pie (`useLevelFooter`) en un único mecanismo con ranuras con nombre (pie, transformación de ventana, ref de solo lectura a la ventana para enganchar gestos), del que `useLevelFooter` pasa a ser un envoltorio fino — los niveles 1 y 2 no se tocan. Detalle en el plan; se documenta en `tech-stack.md` en el mismo cambio.

## Por qué

Es el primer nivel "wow" del juego y el que más vende la premisa en un clip de 10 segundos. Técnicamente estrena tres cosas de las que dependen niveles posteriores: matter.js con su import dinámico (el nivel 4 lo reutiliza), el canal nivel→host consolidado, y la excepción a la regla de timers para bucles de física/animación. Mejor estrenarlas aquí, donde la física es decorativa-letal, que en el plinko donde es el corazón jugable.

## Criterios de aceptación

### Rotación
- [x] Arrastrar desde cualquier zona no interactiva rota la ventana entera (título, contador, X, texto, área, pie) sobre su centro, 360° en ambos sentidos, siguiendo el dedo/ratón 1:1.
- [x] Un drag que empieza sobre un botón (incluido un Disagree de la lluvia) rota y no dispara su acción; un tap sí la dispara (umbral 8 px, test de la lógica + verificado con Playwright).
- [x] La X y el contador funcionan en cualquier ángulo de rotación (verificado con Playwright).
- [x] El cursor sobre la ventana cambia a `grab`/`grabbing` para insinuar que se puede arrastrar.
- [x] El arrastre táctil en móvil no dispara el gesto nativo del navegador ("pull to refresh") ni recarga la página a mitad de partida (`touch-action: none` en la ventana rotable + `overscroll-behavior-y: none` general — corregido tras reporte de Sofía en producción, verificado con Playwright emulando un dispositivo táctil).

### Agree oculto
- [x] A 0°, el Agree no es visible ni en movimiento: reposa quieto en su cámara oculta a la derecha del recuadro de lluvia, recortada por el propio marco del recuadro (no por el viewport), sin caída animada al cargar (verificado con Playwright: transform idéntico durante los primeros ~500 ms).
- [x] Permanece quieto hasta el primer giro del jugador (en cualquier sentido); a partir de ahí responde a la gravedad como un Disagree (verificado con Playwright: sin movimiento a los 2 s sin girar).
- [x] Solo girar en sentido **antihorario (izquierda)** lo hace rodar fuera de la cámara oculta y caer dentro del recuadro visible; girar en sentido horario (derecha) no lo revela (verificado con Playwright en ambos sentidos: tests de `rain.ts` + confirmación visual en el navegador).
- [x] Una vez dentro del recuadro visible, cae y rebota como un Disagree más; un tap sobre él gana con el flujo estándar y la categoría correcta (verificado con Playwright). No se recicla como los Disagree, y **no puede volver a la cámara oculta** aunque el jugador gire hacia el otro lado después (verificado con Playwright: sigue a la vista tras 8 s girando en sentido horario).

### Lluvia
- [x] Los Disagrees caen, rebotan entre sí y contra el recuadro, con la gravedad siempre orientada hacia abajo **de la pantalla**: al rotar la ventana, caen en cascada dentro del recuadro girado (test de la transformación del vector de gravedad + verificado visualmente con Playwright).
- [x] Tap sobre cualquier Disagree de la lluvia (o el del pie) → derrota estándar con motivo de botón incorrecto.
- [x] La población se mantiene ≤ el máximo configurado (25 en escritorio, 12 en dispositivos táctiles — verificado con Playwright emulando un dispositivo táctil) sin acumulación infinita; sin caída de rendimiento apreciable en las pruebas realizadas (verificación exhaustiva de rendimiento en dispositivos reales, pendiente de Sofía).

### Integración y calidad
- [x] El texto de consentimiento va dentro del marco azul del área de juego (excepción del GDD §4.3, como los niveles 1-2), ajustado a su contenido, sin recuadro de consentimiento pequeño separado; el recuadro de lluvia va justo debajo, **fuera de ese marco** (ranura `board` del canal, `boardBelowFrame` en `XPWindow`), con espacio real para verse sin necesitar scroll (verificado con Playwright).
- [x] matter.js se importa dinámicamente dentro del chunk del nivel: no aparece en el bundle principal ni en los chunks de otros niveles (verificado en el build con `grep` sobre `dist/`).
- [x] Al desmontar el nivel no queda vivo ningún Runner/rAF/listener de física (test).
- [x] `paused` congela física, rotación e input; recargar a mitad de nivel retoma con el contador restaurado, rotación a 0 y lluvia nueva; con desenlace pendiente, la modal (mismo mecanismo de la 004, no tiene lógica nueva que probar en este nivel).
- [x] Hueco 3 del registro sustituido, chunk propio; texto en ambos diccionarios bajo `levels.3.*`.
- [x] Partida entera ganando y perdiendo (verificado con Playwright); jugable con dedo y ratón (mismo `usePointer`/`XPButton` del resto del juego); los 5 anchos de referencia y el recorrido en móvil/tablet/escritorio reales, confirmados por Sofía.
- [x] Canal nivel→host consolidado documentado en `tech-stack.md`; niveles 1 y 2 sin cambios funcionales (sus tests siguen en verde — solo cambió el import del canal en sus arneses de test).

## Fuera de alcance

- El plinko del nivel 4 → feature 008 (reutilizará la integración de matter.js de aquí).
- Inercia o "impulso" en la rotación → si el playtesting la pide, se añade como parámetro; de salida es 1:1.
- Persistir rotación o estado de la lluvia al recargar → efímeros a propósito.
