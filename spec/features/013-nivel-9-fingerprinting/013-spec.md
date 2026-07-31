# 013 · Nivel 9 — Fingerprinting

**Estado:** aprobado

## Qué hace

Implementa el Nivel 9 (GDD §9, Nivel 9): una cuadrícula de **12 casillas vacías** por las que asoman botones Agree y Disagree que **suben y desaparecen a toda velocidad**, imposibles de cazar persiguiéndolos. La solución oculta es la contraria a la intuición: **quedarse completamente quieto** sobre una casilla la congela, y entonces se puede esperar con calma a que aparezca un Agree.

### Layout

- Texto de consentimiento de Fingerprinting **dentro del marco azul**, ajustado a su contenido (patrón as-built).
- La **cuadrícula** se publica vía `useLevelBoard` debajo del marco, sin marco propio: **4×3** en tablet/escritorio, **3×4** en móvil (xs/sm), igual que el nivel 8. Las casillas se ven como huecos vacíos (sin botón dentro) al empezar.
- **Sin pie de ventana**: la cuadrícula es toda la interacción.

### Los botones que pasan

- Cada una de las 12 casillas funciona de forma **independiente**: cada cierto tiempo aleatorio aparece en ella un botón, **Agree o Disagree al 50 %** (PRNG con semilla, `src/utils/prng.ts`).
- El botón **entra por abajo, sube deprisa y sale por arriba**, recortado por la casilla (`overflow: hidden`). El tiempo visible es tan corto que cazarlos a base de reflejos es prácticamente imposible (parámetro).
- Pulsar un botón **en movimiento** cuenta igual que pulsarlo quieto: Agree gana, Disagree pierde. No se penaliza ni se premia la suerte de forma especial.

### La mecánica oculta: quedarse quieto

- Si el puntero permanece **completamente inmóvil** sobre una casilla durante **~1 s** (umbral de inmovilidad de `usePointer`, de la 001), esa casilla queda **congelada**:
  - El botón que haya dentro (o el siguiente que entre) **se detiene y permanece visible** mientras el puntero siga inmóvil.
  - Un botón congelado se detiene en la **parte alta de la casilla**, no en el centro: así queda a la vista por encima del dedo en táctil (decisión de accesibilidad táctil, ver plan).
  - **El resto de casillas siguen funcionando con normalidad.**
- Mover el puntero (> 8 px, el umbral tap-vs-drag de la casa) **descongela**: el botón retenido reanuda su subida y se va, y la casilla vuelve a la normalidad. Para volver a congelar hay que volver a estarse quieto otro segundo.
- **Si lo congelado es un Disagree**, se queda ahí ocupando la casilla: el jugador debe moverse (descongelar, dejar que se vaya) y volver a intentarlo. Ese es el bucle de tensión del nivel: cada congelación es una moneda al aire y equivocarse cuesta un segundo.
- No hay ningún indicador visual de que una casilla está congelada más allá del propio botón detenido: descubrirlo es el nivel.

### Equivalente táctil (GDD §15.2)

- **Mantener el dedo pulsado** sobre una casilla ~1 s (sin desplazarlo más de 8 px) la congela igual que el puntero inmóvil.
- **Levantar el dedo sobre un botón congelado equivale a pulsarlo**: Agree gana, Disagree pierde. Levantarlo sin botón congelado no hace nada.
- Arrastrar el dedo fuera de la casilla antes de levantarlo descongela y no pulsa nada.

### Victoria y derrota

- **Victoria**: pulsar un Agree (congelado o en movimiento) → flujo estándar con "Fingerprinting".
- **Derrota**: pulsar un Disagree (congelado o en movimiento) → `failed`; contador a 0; o X.

### Pausa y recarga

- `paused` congela toda la cuadrícula (movimientos, apariciones y el temporizador de inmovilidad) y el input; al reanudar continúa sin saltos.
- Recargar a mitad: contador restaurado; la cuadrícula empieza **vacía y de cero** (efímero, como el resto). Con desenlace pendiente, la modal.

## Por qué

Es el mejor chiste de diseño del juego: una interfaz que te entrena a perseguir y cuya solución es exactamente lo contrario. Y es el único nivel que usa la capacidad de "puntero inmóvil" que `usePointer` tiene desde la feature 001 sin que nadie la haya estrenado todavía — la deuda más antigua del proyecto, por fin cobrada.

## Criterios de aceptación

### Movimiento y apariciones
- [ ] Las 12 casillas generan botones de forma independiente, con reparto Agree/Disagree ~50 % (test del generador con semilla).
- [ ] Los botones entran por abajo, suben y salen por arriba recortados por su casilla; a la velocidad configurada, cazarlos persiguiéndolos es impracticable (verificado en el checkpoint, no por test).
- [ ] Pulsar un botón en movimiento tiene el mismo efecto que pulsarlo congelado (Agree gana, Disagree pierde).

### Congelación
- [ ] Con el puntero inmóvil ~1 s sobre una casilla, esa casilla congela su botón (o el siguiente que entre) en la parte alta, y solo esa: las otras 11 siguen su ritmo (test de la lógica + verificación visual).
- [ ] Mover el puntero > 8 px descongela: el botón reanuda su subida y se va.
- [ ] Un Disagree congelado ocupa la casilla hasta que el jugador descongela; no bloquea el resto del nivel.
- [ ] En táctil: mantener pulsado ~1 s congela; **levantar el dedo sobre un botón congelado equivale a pulsarlo** (Agree gana, Disagree pierde); levantar sin botón congelado no hace nada; arrastrar fuera antes de levantar no pulsa.

### Integración y calidad
- [ ] Hueco 9 sustituido con chunk propio (sin matter.js); `levels.9.*` en ambos diccionarios; PRNG compartido reutilizado.
- [ ] La animación no re-renderiza el árbol por frame (posiciones por custom property escritas por ref, patrón as-built 009–012); el componente que posiciona es el mismo que monta la cuadrícula (lección de la 010/011/012).
- [ ] `paused` congela movimientos, apariciones, el temporizador de inmovilidad e input, y reanuda sin saltos; recarga a mitad (cuadrícula vacía, contador restaurado) y con desenlace pendiente (modal).
- [ ] Cleanup total al desmontar (rAF, listeners) + test de no-fugas.
- [ ] Cuadrícula 4×3 en md+ y 3×4 en xs/sm, casillas con área táctil ≥ 44 px, sin scroll en 375 px.
- [ ] Partida entera ganando y perdiendo; 5 anchos; móvil real vía Pages.
- [ ] ✋ Checkpoint de Sofía: velocidad de los botones (que se sienta imposible sin ser injusta), tiempo de inmovilidad, y sobre todo **que el botón congelado se vea con el dedo encima** en su móvil.

## Fuera de alcance

- Cualquier pista de la mecánica oculta (brillo en la casilla, tutorial, texto) → descubrirlo es el nivel.
- Sonido al congelar → tentador, pero delataría la mecánica; se decide en el checkpoint, no de salida.
- Niveles 10–12 → features 014–016.
