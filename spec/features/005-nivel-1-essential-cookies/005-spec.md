# 005 · Nivel 1 — Essential Cookies

**Estado:** en curso

## Qué hace

Implementa el primer nivel real del juego (GDD §9, Nivel 1) y lo enchufa en el hueco 1 del registro, sustituyendo al nivel de prueba. Es el nivel-tutorial: mecánica mínima, pero estrena el patrón de construcción que seguirán los otros once.

### Mecánica

- Este nivel no tiene tablero propio (GDD §4.3, excepción): su texto de consentimiento — más largo que un banner normal, con scroll interno si no cabe — ocupa el interior del marco azul del área de juego en vez del recuadro de consentimiento pequeño. Los botones Agree/Disagree se quedan en el pie de la ventana, fuera del marco, como en cualquier otro nivel.
- Zona de botones inferior con **dos huecos**: el de **Agree** (verde), vacío al empezar, y el de **Disagree** (rojo), visible desde el principio.
- El botón **Agree no existe durante los primeros 7 segundos** de nivel: ni se ve, ni se puede pulsar, ni está en el DOM. A los 7 segundos aparece en su hueco reservado, sin fanfarria (darse cuenta es parte del juego). El hueco reservado evita que el layout salte y provoque clics erróneos.
- **Pulsar Disagree NO es derrota** (excepción a la regla general, ya prevista en el GDD): se abre un diálogo XP de error sobre el nivel:
  - Título: `Error` · Mensaje: "Essential cookies cannot be rejected." (traducible) · Botón: `OK`.
  - Al pulsar OK, **el nivel se reinicia desde cero**: la ventana reaparece como al principio, el contador vuelve a 100 y el Agree tarda otros 7 segundos en aparecer.
- **Mientras el diálogo de error está abierto, el contador sigue corriendo**: solo se reinicia al pulsar OK. Si llega a 0 con el diálogo abierto, es la derrota estándar (y sí, es cruel a propósito: encaja con el tono del juego).

### Botones fuera del marco: `useLevelFooter`

Los botones inferiores de un nivel nunca van dentro del marco azul del área de juego (aunque el nivel use ese marco para su propio texto, como el nivel 1) — van en el pie de `XPWindow`, gestionado por el shell. El contrato se resuelve con un hook nuevo, `useLevelFooter(nodo)` (`src/levels/levelFooter.ts`): el nivel le pasa el `ReactNode` de sus botones (memoizado con `useMemo`, dependencias primitivas) y `LevelHost` lo publica en el `footer` de la ventana vía contexto. `LevelDefinition.consentKey` pasa a ser opcional: los niveles sin tablero (como el 1) lo omiten y muestran su texto directamente en el marco (`XPWindow` con `scrollableContent`, acotado a 18rem de alto con scroll interno — la ventana en sí no se agranda, solo el nivel 1 la usa así, no la pantalla de selección que sí necesita ocupar toda la pantalla vía la prop independiente `fillHeight`).

### Victoria y derrota

- **Victoria**: pulsar Agree → `onWin()` → flujo estándar de la 004 (AGREE gigante → "Cookies Accepted: Essential Cookies" → selección con el nivel 1 en verde).
- **Derrota**: solo por contador a 0 o por la X — ambas ya gestionadas por el shell. Pulsar Disagree nunca es derrota en este nivel.
- ⚠️ **Resolución de conflicto del GDD**: el bloque "Caso Agree" del Nivel 1 (el diálogo propio "✔ Essential Cookies accepted. You may continue. [OK]") es anterior al diseño unificado de Level Complete y queda **sustituido por el flujo estándar** — ganar no muestra ningún diálogo extra del nivel. El diálogo de error de Disagree sí se mantiene: es la mecánica. (Requiere retoque manual del GDD, ver tareas.)

### Cambio de contrato

`LevelProps` gana **`onRestart?: () => void`** (opcional): el nivel lo invoca para pedir al shell "vuelve a empezarme". El shell responde remontando el componente del nivel (estado interno limpio gratis) y reiniciando el contador a 100. Ningún nivel recibe control directo del timer: sigue siendo de solo lectura.

## Por qué

Primer nivel jugable de verdad y banco de pruebas del patrón "carpeta de nivel autocontenida + lógica pura + contrato": si aquí queda limpio, los niveles 2–12 son repetir la receta con otra mecánica. Además resuelve la única laguna real del contrato (reiniciar un nivel desde dentro) con la mecánica más simple que la necesita.

## Criterios de aceptación

### Mecánica
- [x] El texto de consentimiento ocupa el marco azul del área de juego (sin recuadro de consentimiento aparte) y los botones Agree/Disagree se renderizan en el pie de la ventana, fuera del marco (test de integración + build).
- [x] Durante los primeros 7 s de nivel, el Agree no está en el DOM ni es alcanzable por teclado, dedo o ratón; a los 7 s aparece en su hueco sin desplazar el layout.
- [x] La aparición del Agree se deriva del tiempo del contador (no de un timer propio): con el nivel en `paused`, el plazo de 7 s también queda congelado (test).
- [x] Pulsar Disagree abre el diálogo de error con sus textos correctos en ES y EN; nunca provoca derrota, tampoco pulsándolo repetidas veces.
- [x] OK en el diálogo reinicia el nivel: contador a 100, Agree oculto de nuevo, estado interno limpio (test del cableado de `onRestart`).
- [x] El contador sigue corriendo con el diálogo abierto; si llega a 0, se dispara la derrota estándar por tiempo.

### Integración
- [x] El hueco 1 del registro carga este nivel (chunk propio en el build); los huecos 2–12 siguen con el nivel de prueba.
- [x] Ganar recorre el flujo estándar completo con la categoría "Essential Cookies" y deja el nivel 1 en verde con el 2 seleccionado.
- [x] Perder por contador y por X recorre el flujo estándar de derrota y reinicia la partida.
- [x] Partida jugada entera al menos una vez ganando y una perdiendo (regla de mantenimiento de la 004).

### Calidad
- [x] Textos del nivel en ambos diccionarios bajo `levels.1.*`; botones vía `game.*` intactos.
- [ ] Jugable con dedo y ratón; correcto en los 5 anchos (el texto de consentimiento hace scroll interno si no cabe). **Pendiente de verificación visual de Sofía**: esta sesión no tuvo acceso a un navegador real.
- [x] `paused` congela el nivel por completo (incluido el diálogo de error si está abierto).

## Fuera de alcance

- Niveles 2–12 → features 006–016.
- Cualquier cambio del flujo estándar de victoria/derrota → es de la 004 y no se toca aquí.
- El retardo de 7 s como dificultad ajustable por nivel de forma genérica → si otro nivel lo necesitara, se generalizará entonces.
