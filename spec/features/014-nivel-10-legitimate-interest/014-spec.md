# 014 · Nivel 10 — Legitimate Interest

**Estado:** propuesta

## Qué hace

Implementa el Nivel 10 (GDD §9, Nivel 10): al principio parece un banner normal con dos botones **Disagree** (rojo a la izquierda, verde a la derecha). Pero **arrastrar una ventana por su barra de título la duplica**: aparece una copia idéntica, movible por su cuenta. Cada ventana solo puede parir una copia, y el proceso sigue hasta llegar a **7 ventanas**. En ese momento, **una de las siete, elegida al azar, cambia su botón verde a `Agree`** — y el jugador tiene que encontrarla entre el caos y pulsarla.

### Layout

- Texto de consentimiento de Legitimate Interest **dentro del marco azul** (patrón as-built), idéntico en las siete ventanas.
- Pie con los dos botones: **Disagree rojo** y **Disagree verde** (el verde es el que puede convertirse en Agree).
- Sin tablero: la mecánica son las ventanas.

### Duplicación

- Arrastrar una ventana **por su barra de título** (drag confirmado a 8 px, `usePointer`) la mueve siguiendo al puntero 1:1.
- En el instante en que el arrastre se confirma, **nace una copia** en la posición que esa ventana ocupaba al empezar el arrastre — el efecto es "la ventana se despega y deja otra debajo".
- **Cada ventana solo se duplica una vez** (la copia sí puede duplicarse a su vez, una vez). El proceso se detiene al llegar a **7 ventanas** en total; a partir de ahí, todas siguen siendo arrastrables pero ya no nacen copias.
- Las ventanas se apilan por orden de creación (la más nueva encima) y quedan **limitadas al viewport**: ninguna se puede perder fuera de pantalla.
- Todas las ventanas muestran **el mismo contador** (son copias de la misma ventana: coherente y parte del chiste) y **todas tienen su X**, que pierde igual que siempre.

### El Agree escondido

- Mientras hay **menos de 7** ventanas, todos los botones dicen `Disagree`.
- Al aparecer la **séptima**, se elige **una al azar** (PRNG con semilla) y solo esa cambia su botón verde a `Agree`. Las **otras seis** siguen mostrando `Disagree`. El cambio es instantáneo, sin animación ni aviso: si el jugador está mirando esa ventana, es su suerte.
- Cada partida elige una ventana distinta.

### Victoria y derrota

- **Victoria**: pulsar el `Agree` → flujo estándar con "Legitimate Interest".
- **Derrota**: pulsar cualquier `Disagree` (de cualquier ventana), pulsar la **X de cualquier ventana**, o contador a 0.

### Arquitectura: siete ventanas dentro de un nivel

`LevelHost` monta **una** `XPWindow`. Este nivel necesita siete, así que:

- La ventana del host es la **ventana nº 1**: mantiene el contrato de siempre (título, contador, X, texto en el marco, pie por `useLevelFooter`) y se mueve publicando una traslación en la ranura `windowTransform` que ya existe desde la 007 (misma ranura que usaba el nivel 3 para rotar).
- Las **copias 2–7** las renderiza el nivel en una ranura nueva del canal, **`overlay`**: una capa a pantalla completa por encima de la ventana del host, donde el nivel pinta instancias de `XPWindow` con exactamente las mismas props.
- Un único componente (`CloneWindow`) y una única función de pie garantizan que las siete sean **indistinguibles**: si la nº 1 se viera distinta de las copias, el nivel se rompería (delataría cuál es la original).

## Pausa y recarga

- `paused` congela el arrastre y el input de todas las ventanas.
- Recargar a mitad: contador restaurado; el nivel vuelve a **una sola ventana** y el sorteo del Agree se rehace (efímero, como el resto). Con desenlace pendiente, la modal.

## Por qué

Es el clímax de los niveles de "la interfaz te miente": el juego lleva diez niveles enseñándote que la ventana es el marco estable del mundo, y este la convierte en material desechable que se multiplica en tus manos. Técnicamente es la última pieza que le falta al canal nivel→host (una capa por encima de la ventana), y la que deja preparado el terreno para el nivel 12 y los créditos.

## Criterios de aceptación

### Duplicación
- [ ] Arrastrar una ventana por su barra de título la mueve 1:1 (ratón y dedo) y, al confirmarse el arrastre, nace una copia en la posición que ocupaba al empezar.
- [ ] Cada ventana se duplica **una sola vez**; el total se detiene en 7 y a partir de ahí ninguna genera copias nuevas (test de la lógica pura de duplicación).
- [ ] Las ventanas no pueden salir del viewport (test del clamping) y se apilan por orden de creación.
- [ ] Las siete son indistinguibles entre sí (mismo marcado, mismo estilo, mismo contador); nada en el DOM delata cuál es la original ni cuál llevará el Agree.

### El Agree
- [ ] Con menos de 7 ventanas, los 14 botones dicen `Disagree`; al aparecer la séptima, exactamente una ventana pasa su botón verde a `Agree` y las otras seis no cambian (test).
- [ ] La ventana elegida varía entre partidas (test con semillas distintas).

### Victoria y derrota
- [ ] Pulsar el `Agree` gana con el flujo estándar y la categoría correcta.
- [ ] Pulsar cualquier `Disagree`, la X de **cualquiera** de las siete ventanas, o agotar el contador, pierde con el flujo estándar.

### Integración y calidad
- [ ] Ranura `overlay` añadida al canal nivel→host y documentada en `tech-stack.md`; los niveles 1–9 siguen en verde.
- [ ] Hueco 10 sustituido con chunk propio (sin matter.js); `levels.10.*` en ambos diccionarios.
- [ ] El arrastre no re-renderiza el árbol por frame (posición por custom property escrita por ref, patrón as-built de 009–012).
- [ ] `paused` congela arrastres e input; recarga a mitad (una sola ventana, contador restaurado) y con desenlace pendiente (modal).
- [ ] Cleanup total al desmontar (listeners de arrastre) + test de no-fugas.
- [ ] Jugable con dedo y ratón; 5 anchos — en 375 px las siete ventanas se solapan mucho (es el caos buscado) pero **todas siguen siendo alcanzables y arrastrables**.
- [ ] ✋ Checkpoint de Sofía: sensación de la duplicación (¿se entiende que la ventana "deja otra atrás"?) y jugabilidad del caos de siete ventanas en su móvil.

## Fuera de alcance

- Traer al frente la ventana arrastrada → el apilado es por orden de creación y no cambia (ver plan).
- Animación de aparición de las copias → nacen ya colocadas, sin efecto (el GDD las quiere idénticas y sin aviso).
- Niveles 11–12 → features 015–016.
