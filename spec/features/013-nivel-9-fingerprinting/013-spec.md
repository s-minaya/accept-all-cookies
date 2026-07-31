# 013 · Nivel 9 — Fingerprinting

**Estado:** implementada

## Qué hace

Implementa el Nivel 9 (GDD §9, Nivel 9): una cuadrícula de **12 casillas**, del mismo tamaño que un botón Agree/Disagree real, por las que van apareciendo y desapareciendo Agrees y Disagrees por **ciclos sincronizados** — varios a la vez, tan rápido que es prácticamente imposible cazar un Agree por reflejos. La solución oculta es la contraria a la intuición: **quedarse completamente quieto** sobre una casilla la congela, y entonces se puede esperar con calma a que le toque un Agree.

### Layout

- Texto de consentimiento de Fingerprinting **dentro del marco azul**, ajustado a su contenido (patrón as-built).
- La **cuadrícula** se publica vía `useLevelBoard` debajo del marco, sin marco propio: **4×3** en tablet/escritorio, **3×4** en móvil (xs/sm), igual que el nivel 8. Cada casilla tiene el **mismo tamaño que un botón Agree/Disagree real** — no una casilla más grande con recorrido interno.
- **Sin pie de ventana**: la cuadrícula es toda la interacción.

### Los botones que aparecen

- El grid entero avanza por **ciclos sincronizados** (no casilla a casilla de forma independiente): cada ciclo, **varias casillas a la vez** reciben un botón nuevo, **Agree o Disagree al 50 %**, con la garantía de que **al menos una del lote sea Agree** (PRNG con semilla, `src/utils/prng.ts`).
- Los botones no se desplazan: **aparecen y desaparecen** directamente en su casilla. Al llegar el ciclo siguiente, el lote entero se limpia de golpe y aparece uno nuevo — cuando aparece un lote, desaparece el anterior.
- El ritmo de los ciclos es tan rápido que cazar un Agree por reflejos es prácticamente imposible (parámetro): el jugador solo ve muchos Agree y Disagree apareciendo y desapareciendo por toda la cuadrícula.
- Pulsar un botón mientras esté visible (recién aparecido o ya congelado) cuenta igual: Agree gana, Disagree pierde. No se penaliza ni se premia la suerte de forma especial.

### La mecánica oculta: quedarse quieto

- Si el puntero permanece **completamente inmóvil** sobre una casilla durante **~1 s** (umbral de inmovilidad de `usePointer`, de la 001), esa casilla queda **congelada**:
  - El botón que haya dentro (o el siguiente que le toque en un ciclo posterior) **se retiene y permanece visible**, sobreviviendo a los ciclos siguientes mientras el puntero siga inmóvil.
  - **El resto de casillas siguen ciclando con normalidad.**
- Mover el puntero (> 8 px, el umbral tap-vs-drag de la casa) **descongela**: la casilla queda expuesta al siguiente ciclo, que puede limpiarla como a cualquier otra. Para volver a congelar hay que volver a estarse quieto otro segundo.
- **Si lo congelado es un Disagree**, se queda ahí ocupando la casilla: el jugador debe moverse (descongelar) y volver a intentarlo. Ese es el bucle de tensión del nivel: cada congelación es una moneda al aire y equivocarse cuesta un segundo.
- No hay ningún indicador visual de que una casilla está congelada más allá del propio botón retenido: descubrirlo es el nivel.

### Equivalente táctil (GDD §15.2)

- **Mantener el dedo pulsado** sobre una casilla ~1 s (sin desplazarlo más de 8 px) la congela igual que el puntero inmóvil.
- **Levantar el dedo sobre un botón congelado equivale a pulsarlo**: Agree gana, Disagree pierde. Levantarlo sin botón congelado no hace nada.
- Arrastrar el dedo fuera de la casilla antes de levantarlo descongela y no pulsa nada.
- Levantar el dedo sin moverlo (sin pulsar nada) también descongela: la casilla queda expuesta de nuevo al ciclo siguiente.

### Victoria y derrota

- **Victoria**: pulsar un Agree, congelado o recién aparecido en su ciclo → flujo estándar con "Fingerprinting".
- **Derrota**: pulsar un Disagree, congelado o recién aparecido en su ciclo → `failed`; contador a 0; o X.

### Pausa y recarga

- `paused` congela toda la cuadrícula (los ciclos y el temporizador de inmovilidad) y el input; al reanudar continúa sin saltos.
- Recargar a mitad: contador restaurado; la cuadrícula empieza **vacía y de cero** (efímero, como el resto). Con desenlace pendiente, la modal.

## Por qué

Es el mejor chiste de diseño del juego: una interfaz que te entrena a perseguir y cuya solución es exactamente lo contrario. Y es el único nivel que usa la capacidad de "puntero inmóvil" que `usePointer` tiene desde la feature 001 sin que nadie la haya estrenado todavía — la deuda más antigua del proyecto, por fin cobrada.

## Criterios de aceptación

### Ciclos y apariciones
- [x] Cada ciclo, varias casillas reciben un botón a la vez, con reparto Agree/Disagree ~50 % y al menos un Agree garantizado en el lote (test de `chooseCycleBatch`/`runCycle` con semilla, incluida una comprobación sobre 100 semillas distintas).
- [x] Los botones no se desplazan: aparecen y desaparecen directamente en su casilla; al llegar el ciclo siguiente, el lote anterior se limpia de golpe y aparece uno nuevo (verificado con Playwright y con un test determinista de dos ciclos consecutivos).
- [x] Pulsar un botón visible (congelado o recién aparecido) tiene el mismo efecto sea cual sea el momento: Agree gana, Disagree pierde.

### Congelación
- [x] Con el puntero inmóvil ~1 s sobre una casilla, esa casilla congela su botón (o el siguiente que le toque) y solo esa: las otras 11 siguen ciclando con normalidad (test de la lógica + verificación con Playwright).
- [x] Mover el puntero > 8 px descongela: la casilla queda expuesta al ciclo siguiente, que puede limpiarla como a cualquier otra (verificado con Playwright).
- [x] Un Disagree congelado ocupa la casilla hasta que el jugador descongela; no bloquea el resto del nivel.
- [x] En táctil: mantener pulsado ~1 s congela; **levantar el dedo sobre un botón congelado equivale a pulsarlo** (Agree gana, Disagree pierde); levantar sin botón congelado no hace nada; arrastrar fuera antes de levantar no pulsa; levantar sin moverse tampoco deja la casilla congelada para siempre (bug real corregido en `usePointer`, ver `013-tasks.md`). (Sale gratis del `onClick` nativo de `XPButton` — sin ruta de acción propia que pueda disparar dos veces.)

### Integración y calidad
- [x] Hueco 9 sustituido con chunk propio (sin matter.js); `levels.9.*` en ambos diccionarios; PRNG compartido reutilizado.
- [x] Los ciclos no re-renderizan el árbol por fotograma: son eventos discretos (~2/s), el estado de las 12 casillas vive en React normal, sin ningún escritor imperativo por frame; el componente que posiciona/mide es el mismo que monta la cuadrícula (lección de la 010/011/012).
- [x] `paused` congela los ciclos, el temporizador de inmovilidad e input, y reanuda sin saltos; recarga a mitad (cuadrícula vacía, contador restaurado) y con desenlace pendiente (modal).
- [x] Cleanup total al desmontar (rAF, listeners) + test de no-fugas.
- [x] Cuadrícula 4×3 en md+ y 3×4 en xs/sm, casillas del mismo tamaño que un botón real (≥ 44 px de área táctil), sin scroll en 375 px.
- [x] Partida entera ganando y perdiendo; 5 anchos (verificados con Playwright). Móvil real vía Pages: pendiente del checkpoint, como el resto de niveles.
- [x] ✋ Checkpoint de Sofía: mecánica corregida aprobada ("esttá perfecto").

## Fuera de alcance

- Cualquier pista de la mecánica oculta (brillo en la casilla, tutorial, texto) → descubrirlo es el nivel.
- Sonido al aparecer/congelar → tentador, pero delataría la mecánica; se decide en el checkpoint, no de salida.
- Niveles 10–12 → features 014–016.
