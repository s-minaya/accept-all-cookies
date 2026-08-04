# 011 · Nivel 7 — Data Sharing — Plan

> Plan pre-implementación: describe el enfoque tal como se planeó antes de escribir código, no se ha mantenido sincronizado con ajustes posteriores. Tres cambios de fondo respecto a lo que describe este documento: (1) color de la cubierta corregido a rojo, contradiciendo el GDD de entonces; (2) la cubierta NO se arrastra "por toda la ventana" como dice este plan — tras ver la primera versión: debe quedarse DENTRO del espacio de su propio botón (`overflow: hidden` en la pila, sin salir hacia el resto de la ventana), más simple que lo planeado aquí y sin necesitar portal ni `position: relative` en `XPWindow`; (3) la "lectura estricta" de la sección Decisiones más abajo (tap sobre la cubierta pierde SIEMPRE, incluso tras moverla) queda **revertida** tras probarlo: arrastrar la cubierta la desarma para siempre, un tap posterior sobre ella no gana ni pierde. Para el estado final as-built, ver `011-spec.md` y `011-tasks.md`.

## Enfoque

Nivel pequeño con un único problema técnico de verdad: **un botón del pie que se arrastra por toda la ventana sin re-renders por frame ni recortes de overflow**. La lógica pura se reduce al clamping; todo lo demás es composición de piezas existentes (`usePointer` con su tap-vs-drag, `XPButton`, `useLevelFooter`).

## Implementación

1. **Clamping** — `src/levels/level07/coverLogic.ts` (pura, + tests): dada la posición propuesta de la cubierta y el rectángulo interior de la ventana, devuelve la posición limitada. Casos: esquinas, arrastres más allá de cada borde.
2. **La pila del pie** — `Level07.tsx` publica vía `useLevelFooter` (nodo memoizado, dependencias primitivas): Disagree rojo (`XPButton variant="disagree"` → `onLose('failed')`) y, a la derecha, un contenedor relativo con el **Agree fijo** (`XPButton variant="agree"` → `onWin()`) y la **cubierta** encima (`XPButton variant="disagree"` con texto `game.disagree` — rojo, igual que el Disagree normal)
3. **Arrastre** — `usePointer` sobre la cubierta (`windowRef` del canal para el rectángulo de referencia): tap → `onLose('failed')`; drag → la posición se aplica **imperativamente** como custom property (`--cover-x/--cover-y`) sobre el elemento, sin estado de React por movimiento (el estado de React solo guarda la posición final al soltar, para que sobreviva a re-renders ajenos). Al soltar, la cubierta queda donde el clamping diga.
4. **Apilado y overflow** — la cubierta usa `position: absolute` + `z-index` por encima del contenido de la ventana; revisar la cadena de ancestros del pie (`overflow`) para que no la recorte al salir de su celda — si algún ancestro de `XPWindow` recorta por diseño, plan B: promover la cubierta a un portal dentro del contenedor de la ventana en el primer `dragStart` (decidir en implementación; criterio de aceptación: se ve entera por toda la ventana).
5. **Cursor** — `grab`/`grabbing` sobre la cubierta (patrón del nivel 3)
6. **Registro e i18n** — hueco 7 sin `consentKey`; `levels.7.*` en ambos diccionarios.
7. **GDD** — retoque: diálogos propios del nivel 7 → nota de flujo estándar (patrón de los niveles 1 y 5).
8. **QA** — las cuatro derrotas y la victoria; arrastre con dedo y ratón; cubierta a medias (mitad expuesta gana, mitad tapada pierde); `paused` a medio arrastre; recargas; 5 anchos; móvil real vía Pages.

## Decisiones

- **Tap sobre la cubierta pierde también después de moverla** — el GDD dice "pulsa el Disagree rojo sin arrastrarlo" pensando en el estado inicial, pero la regla coherente con todo el juego es "pulsar un Disagree es rechazar", diga donde diga; un botón que se vuelve inofensivo tras moverlo sería una excepción invisible. Se aplica la lectura estricta y se anota en el GDD.
- **Posición por custom property imperativa, no estado por frame** — un `setState` por `pointermove` re-renderizaría el pie decenas de veces por segundo y coquetearía con el bug de bucle del `footer` (005); la custom property toca solo estilo. Descartado: estado de React por movimiento.
- **La cubierta es un `XPButton` real (variante disagree, igual que el Disagree normal de al lado)** — cero estilos duplicados, y el "mismo tamaño" del GDD sale gratis del sistema de diseño (confirmado durante la 011: los dos botones visibles son rojos, no el rojo/verde asimétrico de una versión anterior del GDD — corregido ahí también). Descartado: un div disfrazado (prohibido por la constitución).
- **Clamping al interior de la ventana** — el GDD no lo dice, pero perder la cubierta fuera de la pantalla dejaría un estado absurdo (Agree revelado sin rastro de la cubierta que dice Disagree); el límite mantiene la escena legible. Además protege el táctil: un arrastre entusiasta con el dedo no la manda al limbo.
- **El arrastre interrumpido por `paused` termina en esa posición** — "recuperar" un arrastre tras una pausa exigiría un puntero que quizá ya no está (dedo levantado durante la modal); terminar limpio es predecible y sin estados fantasma.
- **Sin `logic.ts` general** — solo el clamping merece función pura (precedente de la 006: lógica con test cuando hay lógica); tap-vs-drag ya lo da `usePointer`.

## Riesgos

- **Algún ancestro recorta la cubierta al salir del pie** — mitigación: criterio de aceptación explícito + plan B del portal ya previsto en el paso 4; se decide con el DOM real delante, no a ciegas.
- **En 375 px la pila y el rojo quedan demasiado juntos** (un arrastre corto hacia la izquierda roza el rojo) — el rojo solo pierde por **tap**, no por que la cubierta pase por encima, así que no hay derrota accidental por proximidad; aun así, QA táctil específico de que arrastrar cerca del rojo no dispara su clic.
- **El jugador no descubre que se puede arrastrar** — mitigación: el cursor `grab` en escritorio; en móvil, el patrón ya está entrenado por el nivel 3 (arrastrar es la herramienta de la casa).
- **Duplicar la pila para que "parezca" que hay dos botones verdes** (cubierta y Agree idénticos pueden leerse como un solo botón con sombra) — mitigación: es exactamente la ilusión que el GDD quiere; el checkpoint visual confirma que el efecto "tarjeta que destapa otra" se lee bien al arrastrar.
