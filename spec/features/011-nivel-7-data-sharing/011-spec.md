# 011 · Nivel 7 — Data Sharing

**Estado:** propuesta

## Qué hace

Implementa el Nivel 7 (GDD §9, Nivel 7): a la vista hay **dos botones Disagree** — los dos rojos. Sin embargo, son una **cubierta**: debajo, oculto y completamente fijo, está el verdadero botón **Agree** (mismo tamaño, mismo verde). El jugador debe **arrastrar la cubierta** para destaparlo, soltarla y pulsar el Agree. Esto se aplica a ambos botones Disagree.

### Layout

- Sin tablero: texto de consentimiento de Data Sharing **dentro del marco azul** (patrón de los niveles 1–2).
- Pie de ventana vía `useLevelFooter`: **Disagrees rojos** a la izquierda y a la derecha, ambos encima de los Agrees fijos.

### La mecánica

- **Tap sobre los Disagrees rojos** → derrota (`failed`). Es un botón normal.
- **Arrastrar la cubierta** (umbral tap-vs-drag de 8 px, `usePointer`, ratón y dedo por igual): la cubierta sigue **exactamente** al puntero en cualquier dirección, revelando progresivamente el Agree que hay debajo. Al soltar, **se queda donde está** (sin volver a su sitio); una vez arrastrado cualquier Disagree, desaparece con una transición dentro del mismo botón, como si arrastrarlo lo enviara fuera.
- La cubierta queda **limitada al interior de la ventana del nivel** (clamping): no puede "perderse" fuera de la pantalla ni esconderse detrás de nada.
- El **Agree no se mueve jamás**: se revela solo porque la cubierta deja de taparlo. Sin transformaciones, ni cambios de texto o color: el botón ya estaba ahí.

### Victoria y derrota

- **Victoria**: tap sobre el Agree → flujo estándar con "Data Sharing".
- **Derrota**: tap sobre los Disagrees rojos, contador a 0, o X.
- **Nota de GDD**: los diálogos propios del nivel ("Data Sharing accepted." / "Data Sharing rejected.") son anteriores al flujo unificado y quedan sustituidos por el estándar — precedente de los niveles 1 y 5 (retoque de GDD en tareas).

### Pausa y recarga

- `paused` congela el arrastre y el input (una cubierta a medio arrastre se queda quieta; al reanudar, el arrastre en curso se considera terminado en esa posición — no se "recupera" un dedo fantasma).
- Recargar a mitad: contador restaurado; **la cubierta vuelve a su posición inicial** tapando el Agree (efímero, como siempre). Con desenlace pendiente, la modal.

## Por qué

Es el dark pattern más literal del juego (el botón que dice una cosa tapando al que dice otra) y el primero cuyo tablero es… el propio pie de botones. Técnicamente es pequeño pero ejercita una esquina nueva: un elemento del pie que se arrastra libremente por toda la ventana — resolver bien su render (sin re-render en cada movimiento, sin recortes de overflow) deja el patrón listo para el nivel 10, donde se arrastran ventanas enteras.

## Criterios de aceptación

### Mecánica
- [ ] Tap en el rojo → derrota;
- [ ] Un arrastre ≥ 8 px sobre la cubierta nunca es derrota: la cubierta sigue al puntero 1:1 en cualquier dirección, con dedo y con ratón, y al soltar desaparece dentro del espacio del botón.
- [ ] La cubierta no puede salir del interior de la ventana del nivel (test del clamping puro con posiciones extremas).
- [ ] El Agree permanece inmóvil siempre; la parte expuesta es pulsable y la tapada no (verificado con la cubierta a medias: clic en la zona expuesta gana, en la tapada — sobre la cubierta — pierde).
- [ ] Victoria por Agree con el flujo estándar y la categoría correcta.

### Render y rendimiento
- [ ] El movimiento de la cubierta durante el arrastre no re-renderiza el pie ni el nivel por frame (posición vía custom property imperativa; el nodo del pie memoizado no entra en bucle con `LevelHost` — el bug conocido de la 005).
- [ ] La cubierta se ve por encima de todo el contenido de la ventana mientras se arrastra (sin recortes de `overflow` a su paso).

### Integración y calidad
- [ ] Hueco 7 sustituido con chunk propio (sin matter.js); `levels.7.*` en ambos diccionarios.
- [ ] `paused` congela el arrastre (y un arrastre interrumpido por pausa termina limpio); recarga a mitad (cubierta al sitio, contador restaurado) y con desenlace pendiente (modal).
- [ ] Cleanup de listeners al desmontar (test de no-fugas).
- [ ] Partida entera ganando y perdiendo (las cuatro derrotas); dedo y ratón.
- [ ] GDD retocado (diálogos propios → flujo estándar).

## Fuera de alcance

- Pistas visuales de que la cubierta se puede arrastrar → descubrirlo es el nivel (el cursor puede insinuar `grab` sobre la cubierta, como en el nivel 3 — única concesión, vetable).
- Niveles 8–12 → features 012–016.
