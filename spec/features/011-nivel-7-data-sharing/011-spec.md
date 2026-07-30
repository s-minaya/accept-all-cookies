# 011 · Nivel 7 — Data Sharing

**Estado:** implementada

## Qué hace

Implementa el Nivel 7 (GDD §9, Nivel 7): a la vista hay **dos botones Disagree** — los dos rojos. Sin embargo, son una **cubierta**: debajo, oculto y completamente fijo, está el verdadero botón **Agree** (mismo tamaño, mismo verde). El jugador debe **arrastrar la cubierta** para destaparlo, soltarla y pulsar el Agree. Esto se aplica a ambos botones Disagree.

### Layout

- Sin tablero: texto de consentimiento de Data Sharing **dentro del marco azul** (patrón de los niveles 1–2).
- Pie de ventana vía `useLevelFooter`: **Disagrees rojos** a la izquierda y a la derecha, ambos encima de los Agrees fijos.

### La mecánica

- **Tap sobre el Disagree rojo izquierdo** → derrota (`failed`) siempre. Es un botón normal, no cambia nunca.
- **Tap sobre la cubierta SIN haberla arrastrado nunca** → derrota (`failed`), igual que el Disagree izquierdo.
- **Arrastrar la cubierta** (umbral tap-vs-drag de 8 px, `usePointer`, ratón y dedo por igual): la cubierta sigue **exactamente** al puntero en cualquier dirección, revelando progresivamente el Agree que hay debajo. Al soltar, **se queda donde está** (sin volver a su sitio).
- **En cuanto se arrastra una vez, la cubierta queda desarmada para siempre**: a partir de ahí, pulsarla —esté donde esté, incluso si ha vuelto a tapar el Agree— no hace nada, ni gana ni pierde. Arrastrarla es lo que la "desactiva" como Disagree.
- La cubierta se mueve **DENTRO del espacio del propio botón, nunca hacia el resto de la ventana**: el hueco del botón recorta (`overflow: hidden`) lo que se salga de sus límites, así que arrastrarla del todo la hace desaparecer dentro de su propio hueco — igual que "retirar una tarjeta que cubre otra" (GDD).
- El **Agree no se mueve jamás**: se revela solo porque la cubierta deja de taparlo. Sin transformaciones, ni cambios de texto o color: el botón ya estaba ahí.

### Victoria y derrota

- **Victoria**: tap sobre el Agree → flujo estándar con "Data Sharing".
- **Derrota**: tap sobre el Disagree rojo izquierdo, tap sobre la cubierta antes de arrastrarla nunca, contador a 0, o X.
- **Nota de GDD**: los diálogos propios del nivel ("Data Sharing accepted." / "Data Sharing rejected.") son anteriores al flujo unificado y quedan sustituidos por el estándar — precedente de los niveles 1 y 5 (retoque de GDD en tareas).

### Pausa y recarga

- `paused` congela el arrastre y el input (una cubierta a medio arrastre se queda quieta; al reanudar, el arrastre en curso se considera terminado en esa posición — no se "recupera" un dedo fantasma).
- Recargar a mitad: contador restaurado; **la cubierta vuelve a su posición inicial** tapando el Agree (efímero, como siempre). Con desenlace pendiente, la modal.

## Por qué

Es el dark pattern más literal del juego (el botón que dice una cosa tapando al que dice otra) y el primero cuyo tablero es… el propio pie de botones. Técnicamente es pequeño pero ejercita una esquina nueva: un elemento del pie que se arrastra dentro de su propio hueco sin re-renderizar en cada movimiento — resolver bien ese render deja sentado el patrón (custom property imperativa, nodo del pie memoizado) para el nivel 10, donde se arrastran ventanas enteras (ahí sí, libremente).

## Criterios de aceptación

### Mecánica
- [x] Tap en el Disagree rojo izquierdo → derrota, siempre;
- [x] Tap en la cubierta antes de arrastrarla nunca → derrota, igual que el Disagree izquierdo.
- [x] Un arrastre ≥ 8 px sobre la cubierta nunca es derrota: la cubierta sigue al puntero 1:1 en cualquier dirección, con dedo y con ratón, y al soltar se queda donde está.
- [x] Tras el primer arrastre, la cubierta queda desarmada: un tap posterior sobre ella (esté donde esté) no gana ni pierde.
- [x] La cubierta no puede salir del espacio de su propio botón hacia el resto de la ventana (test del clamping puro con posiciones extremas + verificado con Playwright arrastrando mucho más allá de su propio ancho: se recorta dentro de su hueco, nunca aparece en otra parte de la ventana).
- [x] El Agree permanece inmóvil siempre; la parte expuesta es pulsable y la tapada no (verificado con la cubierta a medias: clic en la zona expuesta gana; en la tapada —sobre la cubierta— no hace nada tras el primer arrastre).
- [x] Victoria por Agree con el flujo estándar y la categoría correcta.

### Render y rendimiento
- [x] El movimiento de la cubierta durante el arrastre no re-renderiza el pie ni el nivel por frame (posición vía custom property imperativa; el nodo del pie memoizado no entra en bucle con `LevelHost` — el bug conocido de la 005).
- [x] La cubierta se recorta (`overflow: hidden`) al salir del espacio de su propio botón — verificado con Playwright: arrastrarla mucho más allá de su ancho no la hace aparecer en ninguna otra parte de la ventana, solo la hace desaparecer dentro de su hueco.

### Integración y calidad
- [x] Hueco 7 sustituido con chunk propio (sin matter.js); `levels.7.*` en ambos diccionarios.
- [x] `paused` congela el arrastre (y un arrastre interrumpido por pausa termina limpio); recarga a mitad (cubierta al sitio, contador restaurado) y con desenlace pendiente (modal).
- [x] Cleanup de listeners al desmontar (test de no-fugas).
- [x] Partida entera ganando y perdiendo (las cuatro derrotas); dedo y ratón.
- [x] GDD retocado (diálogos propios → flujo estándar; la cubierta queda desarmada tras el primer arrastre; la cubierta es roja; movimiento confinado a su propio hueco).

## Fuera de alcance

- Pistas visuales de que la cubierta se puede arrastrar → descubrirlo es el nivel (el cursor puede insinuar `grab` sobre la cubierta, como en el nivel 3 — única concesión, vetable).
- Niveles 8–12 → features 012–016.
