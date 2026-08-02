# 015 · Nivel 11 — Consent Renewal

**Estado:** propuesta

## Qué hace

Implementa el Nivel 11 (GDD §9, Nivel 11): **Sans** (Undertale) aparece en la esquina inferior derecha de la ventana e interroga al jugador desde un bocadillo con dos botones, **No** y **Yes**. El texto de cada pregunta **se escribe letra a letra en Comic Sans** mientras suena **su voz en bucle**, que se detiene en cuanto la frase está completa; la **música de fondo baja mucho** mientras habla para que se le oiga. Hay que responder correctamente **ocho preguntas seguidas** (dos vueltas idénticas de cuatro). La dificultad no está en entender las preguntas, sino en **romper el patrón que el propio juego te enseña**: las tres primeras se responden `No`… y la cuarta, `Yes`.

### Sans

- Guiño deliberado: es el único personaje del juego que viene de fuera, y su presencia es parte del mensaje del proyecto (portfolio personal, sin ánimo de lucro).
- **Se acredita en los créditos** (feature 016): "Sans © Toby Fox (Undertale) — homenaje sin ánimo de lucro", junto a la mención ya prevista a *Doki Doki Action Game*. Esto es requisito de esta feature, aunque el texto aterrice en la 016.
- Sprite fijo, sin animación de entrada (cada milisegundo antes de la primera pregunta es tiempo del contador).

### El bocadillo

- Bocadillo de diálogo saliendo de Sans, con la cola apuntando hacia él.
- **El texto va en Comic Sans** (`"Comic Sans MS", "Comic Neue", cursive`) — única excepción tipográfica del juego, deliberada y fiel: es la fuente de Sans, y de paso encaja con la broma del falso Windows XP. Todo lo demás del nivel (consentimiento, botones) mantiene las fuentes del sistema de diseño.
- **Efecto de escritura**: el texto aparece carácter a carácter (~25 ms/carácter, parámetro).
- **Voz en bucle**: `sans-voice.mp3` (~1 s) se reproduce **en loop desde el primer carácter hasta el último** y se corta al completarse la frase. Respeta el interruptor de efectos de Ajustes.
- **Ducking de la música**: mientras Sans habla, la música de fondo baja a una fracción de su volumen (parámetro, arranque ~20 %), con un fundido corto al bajar y al subir para que no dé saltos. Al terminar la frase vuelve a su nivel.
- Tocar el bocadillo mientras escribe **completa el texto de golpe**, corta la voz y restaura la música.

### Layout

- Texto de consentimiento de Consent Renewal **dentro del marco azul**, sobre fondo blanco (patrón as-built de los niveles sin `consentKey`).
- Sans + bocadillo se publican vía `useLevelBoard`, debajo del marco: sprite abajo a la derecha, bocadillo a su izquierda en md+ y **encima** en xs/sm (más ancho disponible para la pregunta larga).
- Los botones **No** y **Yes** viven dentro del bocadillo, en ese orden (izquierda→derecha; el orden importa: es lo que crea la memoria muscular).
- **Pie de ventana** vía `useLevelFooter`: el **Disagree rojo** del GDD. No sirve para nada bueno — pulsarlo es derrota; está ahí como señuelo, para que el jugador que se harta del interrogatorio tenga una salida falsa y tentadora.

### La conversación

Secuencia de cuatro preguntas que se repite **dos veces** (8 respuestas correctas seguidas para ganar). Sin ninguna diferencia visual entre vueltas, sin indicador de progreso y sin aviso de que el patrón cambia:

| # | Pregunta | Correcta |
|---|---|---|
| 1 | Are you having any trouble? | **No** |
| 2 | No, but you are having some trouble, right? | **No** |
| 3 | No, no, don't push yourself... you're having trouble, right? | **No** |
| 4 | Do you intend to agree? | **Yes** |

- Cada respuesta correcta avanza a la siguiente pregunta; la octava correcta gana.
- **Cualquier respuesta incorrecta es derrota inmediata** (`failed`).
- Las preguntas se traducen (`levels.11.*`); los botones **No** y **Yes** viven en `game.*` y **no se traducen** (GDD §11).

### Bloqueo de input mientras habla

- **Los botones no responden hasta que el texto termina de escribirse** (más un margen de ~200 ms). Motivo: sin ese bloqueo, un jugador que hace clic rápido tres veces en `No` encadenaría la cuarta respuesta sin haberla leído — la trampa del nivel debe ser el patrón, no el doble clic accidental. Quien tenga prisa puede saltar el texto tocando el bocadillo.

### Victoria y derrota

- **Victoria**: octava respuesta correcta → flujo estándar con "Consent Renewal".
- **Derrota**: cualquier respuesta incorrecta, pulsar el **Disagree** del pie, contador a 0, o X.

### Pausa y recarga

- `paused` congela la escritura, la voz (se pausa, no se reinicia) y el input; la música vuelve a su volumen normal mientras el nivel está pausado.
- Recargar a mitad: contador restaurado; la conversación **vuelve a la primera pregunta** (efímero, como el resto). Con desenlace pendiente, la modal.

## Por qué

Es el único nivel del juego donde el adversario tiene cara y voz. Los diez anteriores manipulan con interfaz; este lo hace con lenguaje — el mismo "¿seguro que no quieres…?" de los banners reales, llevado al absurdo, y en boca del personaje que mejor encarna ese tono. La Comic Sans, la voz en bucle y el ducking son lo que convierten un cuestionario en una conversación.

## Criterios de aceptación

### Conversación
- [ ] Las ocho preguntas se suceden en el orden del GDD (dos vueltas idénticas de cuatro) y solo la secuencia `No, No, No, Yes ×2` gana (test exhaustivo de la máquina: las 8 posiciones, respuesta correcta e incorrecta en cada una).
- [ ] Cualquier respuesta incorrecta pierde de inmediato con el flujo estándar, en cualquiera de las 8 posiciones.
- [ ] No hay ningún indicador de progreso ni diferencia visual entre la primera y la segunda vuelta.
- [ ] Los botones son `No` y `Yes` en ese orden, sin traducir (claves `game.*`, test de identidad ES/EN intacto); las preguntas sí se traducen (`levels.11.*`, ambos diccionarios).

### Voz, escritura y música
- [ ] El texto se escribe carácter a carácter en **Comic Sans**, con fallback declarado por si la fuente no está disponible.
- [ ] La voz suena **en bucle** desde el primer carácter y **se corta exactamente al completarse la frase** (no sigue sonando en los silencios entre preguntas); respeta el interruptor de efectos.
- [ ] Mientras habla, la música baja al factor configurado con fundido corto, y vuelve a su nivel al terminar (sin saltos audibles); el volumen de Ajustes se sigue respetando en ambos estados.
- [ ] Tocar el bocadillo completa el texto de golpe, corta la voz y restaura la música.
- [ ] Los botones no responden mientras escribe (+ margen): una ráfaga de clics rápidos **no** puede encadenar dos respuestas.

### Layout
- [ ] Sans aparece abajo a la derecha con su bocadillo (cola apuntándole); bocadillo a la izquierda en md+ y encima en xs/sm; la pregunta más larga no desborda en 375 px.
- [ ] Botones ≥ 44 px, con dedo y con ratón. El Disagree del pie está presente y pulsarlo pierde.

### Integración y calidad
- [ ] Hueco 11 sustituido con chunk propio (sin matter.js); `paused` congela escritura, voz e input y restaura la música; recarga a mitad (vuelta a la pregunta 1, contador restaurado) y con desenlace pendiente (modal).
- [ ] Cleanup total al desmontar (reloj de escritura, voz parada, música restaurada) + test de no-fugas: **salir del nivel nunca deja la música agachada**.
- [ ] `sans-voice.mp3` documentado como asset de audio (GDD §2.3, tech-stack, AGENTS) junto a positivo, negativo, música y `coin.mp3`.
- [ ] Crédito a Toby Fox / Undertale recogido para la pantalla de créditos (feature 016).
- [ ] Partida entera ganando (las 8) y perdiendo (respuesta incorrecta, Disagree, contador y X); 5 anchos; móvil real vía Pages con **toques reales** (CDP `Input.dispatchTouchEvent`, no `page.mouse` — lección de la 014).
- [ ] ✋ Checkpoint de Sofía: tamaño y posición de Sans y del bocadillo, velocidad de escritura, volumen relativo voz/música y el factor de ducking, y si la segunda vuelta engaña bien jugada del tirón.

## Fuera de alcance

- Nivel 12 y créditos → feature 016 (donde aterriza el texto del crédito a Toby Fox).
