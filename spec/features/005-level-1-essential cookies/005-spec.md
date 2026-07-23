# 005 · Nivel 1 — Essential Cookies

## Qué hace

Implementa el primer nivel real del juego (GDD §9, Nivel 1) y lo enchufa en el hueco 1 del registro, sustituyendo al nivel de prueba. Es el nivel-tutorial: mecánica mínima, pero estrena el patrón de construcción que seguirán los otros once.

### Mecánica

- La ventana muestra el texto de consentimiento de Essential Cookies y la zona de botones inferior con **dos huecos**: el de **Agree** (verde), vacío al empezar, y el de **Disagree** (rojo), visible desde el principio.
- El botón **Agree no existe durante los primeros 7 segundos** de nivel: ni se ve, ni se puede pulsar, ni está en el DOM. A los 7 segundos aparece en su hueco reservado, sin fanfarria (darse cuenta es parte del juego). El hueco reservado evita que el layout salte y provoque clics erróneos.
- **Pulsar Disagree NO es derrota** (excepción a la regla general, ya prevista en el GDD): se abre un diálogo XP de error sobre el nivel:
  - Título: `Error` · Mensaje: "Essential cookies cannot be rejected." (traducible) · Botón: `OK`.
  - Al pulsar OK, **el nivel se reinicia desde cero**: la ventana reaparece como al principio, el contador vuelve a 100 y el Agree tarda otros 7 segundos en aparecer.
- **Mientras el diálogo de error está abierto, el contador sigue corriendo**: solo se reinicia al pulsar OK. Si llega a 0 con el diálogo abierto, es la derrota estándar (y sí, es cruel a propósito: encaja con el tono del juego).

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
- [ ] Durante los primeros 7 s de nivel, el Agree no está en el DOM ni es alcanzable por teclado, dedo o ratón; a los 7 s aparece en su hueco sin desplazar el layout.
- [ ] La aparición del Agree se deriva del tiempo del contador (no de un timer propio): con el nivel en `paused`, el plazo de 7 s también queda congelado (test).
- [ ] Pulsar Disagree abre el diálogo de error con sus textos correctos en ES y EN; nunca provoca derrota, tampoco pulsándolo repetidas veces.
- [ ] OK en el diálogo reinicia el nivel: contador a 100, Agree oculto de nuevo, estado interno limpio (test del cableado de `onRestart`).
- [ ] El contador sigue corriendo con el diálogo abierto; si llega a 0, se dispara la derrota estándar por tiempo.

### Integración
- [ ] El hueco 1 del registro carga este nivel (chunk propio en el build); los huecos 2–12 siguen con el nivel de prueba.
- [ ] Ganar recorre el flujo estándar completo con la categoría "Essential Cookies" y deja el nivel 1 en verde con el 2 seleccionado.
- [ ] Perder por contador y por X recorre el flujo estándar de derrota y reinicia la partida.
- [ ] Partida jugada entera al menos una vez ganando y una perdiendo (regla de mantenimiento de la 004).

### Calidad
- [ ] Textos del nivel en ambos diccionarios bajo `levels.1.*`; botones vía `game.*` intactos.
- [ ] Jugable con dedo y ratón; correcto en los 5 anchos (el texto de consentimiento hace scroll interno si no cabe).
- [ ] `paused` congela el nivel por completo (incluido el diálogo de error si está abierto).

## Fuera de alcance

- Niveles 2–12 → features 006–016.
- Cualquier cambio del flujo estándar de victoria/derrota → es de la 004 y no se toca aquí.
- El retardo de 7 s como dificultad ajustable por nivel de forma genérica → si otro nivel lo necesitara, se generalizará entonces.
