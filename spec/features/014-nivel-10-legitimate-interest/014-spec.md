# 014 · Nivel 10 — Legitimate Interest

**Estado:** implementada

## Qué hace

Implementa el Nivel 10 (GDD §9, Nivel 10): al principio parece un banner normal con dos botones **Disagree rojos e idénticos** — el color no distingue izquierdo de derecho. Pero **arrastrar una ventana por su barra de título la duplica**: aparece una copia idéntica, movible por su cuenta. Cada ventana solo puede parir una copia, y el proceso sigue hasta llegar a **7 ventanas**. En ese momento, **una de las seis primeras, elegida al azar, cambia su botón derecho — a la vez, color y texto — a `Agree` verde** (la séptima, recién nacida, nunca lo lleva) — y el jugador tiene que encontrarla entre el caos y pulsarla.

### Layout

- Texto de consentimiento de Legitimate Interest **dentro del marco azul**, sobre fondo **blanco** (patrón as-built de los niveles sin `consentKey`: 1, 2, 7, 8, 9 — todos usan `background: var(--color-white)` en su propio wrapper, no el beige de `.xp-window__interior`), idéntico en las siete ventanas — mismo nodo, reutilizado literalmente (`consentContent` en `Level10.tsx`), así que nunca puede desincronizarse entre la nº 1 y una copia.
- Pie con los dos botones: **ambos rojos, `Disagree`** (a diferencia de otros niveles, aquí NO hay un botón "verde disfrazado" desde el principio — el color solo cambia en el momento del sorteo, en una única ventana).
- Sin tablero: la mecánica son las ventanas.

### Duplicación

- Arrastrar una ventana **por su barra de título** (drag confirmado a 8 px, `usePointer`) la mueve siguiendo al puntero 1:1.
- En el instante en que el arrastre se confirma, **nace una copia** en la posición que esa ventana ocupaba al empezar el arrastre — el efecto es "la ventana se despega y deja otra debajo".
- **La ventana agarrada pasa siempre al frente de la pila** (corregido tras revisión de Sofía: "queremos que se arrastre la pantalla de delante y deje de ocultar la de atrás"): se ve inequívocamente que es ELLA la que se mueve, nunca una ventana estática tapándola por delante. El apilado no es fijo por antigüedad — cada ventana lleva su propio orden (`zIndex`, `windows.ts`), actualizado al instante en cada arrastre, ocurra o no una duplicación.
- **Cada ventana solo se duplica una vez** (la copia sí puede duplicarse a su vez, una vez); volver a agarrarla igualmente la trae al frente, aunque ya no nazca copia. El proceso se detiene al llegar a **7 ventanas** en total; a partir de ahí, todas siguen siendo arrastrables pero ya no nacen copias.
- Las ventanas quedan **limitadas al viewport** en tablet/escritorio (contención total: ninguna se puede perder fuera de pantalla). En móvil (`xs` y `sm`, ≤480 px — corregido tras revisión de Sofía: `xs` solo, ≤375 px, dejaba fuera a la mayoría de teléfonos reales) se permite un asomo parcial por los lados —hasta un 70% del ancho puede quedar fuera— pero **nunca menos de un 30% visible**, para que ninguna quede inalcanzable (GDD §15.2). Imprescindible en pantallas estrechas: si la ventana ocupa casi todo el ancho, un arrastre normal con el dedo no la aleja lo bastante como para dejar de tapar a la de debajo — el asomo parcial le da al jugador margen real para separarlas.
- Todas las ventanas muestran **el mismo contador** (son copias de la misma ventana: coherente y parte del chiste) y **todas tienen su X**, que pierde igual que siempre.

### El Agree escondido

- Mientras hay **menos de 7** ventanas, todos los botones son rojos y dicen `Disagree`.
- Al aparecer la **séptima**, se elige **una al azar entre las seis anteriores** (PRNG con semilla; la recién nacida queda siempre excluida) y solo el botón derecho de esa ventana cambia, **a la vez color y texto** (rojo `Disagree` → verde `Agree`). Las **otras seis** siguen exactamente igual, rojas y `Disagree`. El cambio es instantáneo, sin animación ni aviso: si el jugador está mirando esa ventana, es su suerte.
- Cada partida elige una ventana distinta.

### Victoria y derrota

- **Victoria**: pulsar el `Agree` → flujo estándar con "Legitimate Interest".
- **Derrota**: pulsar cualquier `Disagree` (de cualquier ventana), pulsar la **X de cualquier ventana**, o contador a 0.

### Arquitectura: siete ventanas dentro de un nivel

`LevelHost` monta **una** `XPWindow`. Este nivel necesita siete, así que:

- La ventana del host es la **ventana nº 1**: mantiene el contrato de siempre (título, contador, X, texto en el marco, pie por `useLevelFooter`) y se mueve publicando una traslación en la ranura `windowTransform` que ya existe desde la 007 (misma ranura que usaba el nivel 3 para rotar).
- Las **copias 2–7** las renderiza el nivel en una ranura nueva del canal, **`overlay`**: una capa a pantalla completa por encima de la ventana del host, donde el nivel pinta instancias de `XPWindow` con exactamente las mismas props.
- Un único componente (`LevelWindow`) y una única función de pie garantizan que las siete sean **indistinguibles**: si la nº 1 se viera distinta de las copias, el nivel se rompería (delataría cuál es la original).

## Pausa y recarga

- `paused` congela el arrastre y el input de todas las ventanas.
- Recargar a mitad: contador restaurado; el nivel vuelve a **una sola ventana** y el sorteo del Agree se rehace (efímero, como el resto). Con desenlace pendiente, la modal.

## Por qué

Es el clímax de los niveles de "la interfaz te miente": el juego lleva diez niveles enseñándote que la ventana es el marco estable del mundo, y este la convierte en material desechable que se multiplica en tus manos. Técnicamente es la última pieza que le falta al canal nivel→host (una capa por encima de la ventana), y la que deja preparado el terreno para el nivel 12 y los créditos.

## Criterios de aceptación

### Duplicación
- [x] Arrastrar una ventana por su barra de título la mueve 1:1 (ratón y dedo) y, al confirmarse el arrastre, nace una copia en la posición que ocupaba al empezar.
- [x] La ventana agarrada pasa al frente de la pila al instante, ocurra o no una duplicación (test de `bringToFront`); se ve moverse a ella, nunca a una ventana estática tapándola.
- [x] Cada ventana se duplica **una sola vez**; el total se detiene en 7 y a partir de ahí ninguna genera copias nuevas (test de la lógica pura de duplicación).
- [x] Las ventanas no pueden salir del viewport en tablet/escritorio (test del clamping); en móvil (`xs`+`sm`, ≤480px) pueden asomar parcialmente por los lados pero nunca menos de un 30% de su ancho (test del clamping con `minVisibleX` y de `minVisibleXFor` en los límites del umbral).
- [x] Las siete son indistinguibles entre sí (mismo marcado, mismo estilo, mismo contador); nada en el DOM delata cuál es la original ni cuál llevará el Agree.

### El Agree
- [x] Con menos de 7 ventanas, los 14 botones son rojos y dicen `Disagree`; al aparecer la séptima, exactamente una de las SEIS anteriores pasa su botón derecho a verde/`Agree` (color y texto a la vez) y las demás (incluida la recién nacida) no cambian (test).
- [x] La ventana elegida varía entre partidas (test con semillas distintas); la recién nacida nunca es la elegida (test).

### Victoria y derrota
- [x] Pulsar el `Agree` gana con el flujo estándar y la categoría correcta.
- [x] Pulsar cualquier `Disagree`, la X de **cualquiera** de las siete ventanas, o agotar el contador, pierde con el flujo estándar.

### Integración y calidad
- [x] Ranuras `overlay` y `windowZIndex` añadidas al canal nivel→host y documentadas en `tech-stack.md`; los niveles 1–9 siguen en verde.
- [x] Hueco 10 sustituido con chunk propio (sin matter.js); `levels.10.*` en ambos diccionarios.
- [x] El arrastre no re-renderiza el árbol por frame (posición por custom property escrita por ref, patrón as-built de 009–012).
- [x] `paused` congela arrastres e input; recarga a mitad (una sola ventana, contador restaurado) y con desenlace pendiente (modal).
- [x] Cleanup total al desmontar (listeners de arrastre) + test de no-fugas.
- [x] Jugable con dedo y ratón; 5 anchos — en móvil (`xs`+`sm`, ≤480px, cualquier teléfono real) las ventanas se reducen (GDD §15.2) para que quepa más de una a la vez; aun así se solapan mucho (es el caos buscado) pero **todas siguen siendo alcanzables y arrastrables** (verificado con toques reales simulados por CDP, no solo ratón).
- [x] ✋ Checkpoint de Sofía: aprobada tras cuatro rondas de correcciones ("perfecto, commit y push") — sensación de la duplicación, indistinguibilidad de las siete ventanas y jugabilidad del caos en móvil.

## Fuera de alcance

- Animación de aparición de las copias → nacen ya colocadas, sin efecto (el GDD las quiere idénticas y sin aviso).
- Niveles 11–12 → features 015–016.
