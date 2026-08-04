# 015 · Nivel 11 — Consent Renewal — Plan

Ver `015-spec.md` para el comportamiento actual.

## Enfoque

Máquina de conversación pura (8 pasos) + un bocadillo que escribe con voz. Nada de física ni azar. Los dos puntos de cuidado son de **audio**: la voz en bucle (arrancar/parar limpiamente, sin quedarse sonando) y el **ducking de la música** (bajarla mientras habla y restaurarla siempre, incluso si el jugador pierde o se va a mitad de frase). El resto es composición de piezas ya rodadas.

## Implementación

1. **Guion y máquina** — `src/levels/level11/conversation.ts` (puro, + tests): `SCRIPT` = las 4 preguntas con su respuesta esperada, repetidas ×2 (8 pasos con `questionKey` y `expected`); `answer(step, given)` → `'advance' | 'win' | 'lose'`. Tests: recorrido correcto completo, respuesta incorrecta en cada una de las 8 posiciones, y que solo los pasos 4 y 8 esperan `Yes`.
2. **Audio: voz y ducking en `AudioManager`** — métodos nuevos:
   - `startVoiceLoop()` / `stopVoiceLoop()` — un `HTMLAudioElement` propio con `loop = true`, sujeto a `soundEffectsOn` (si los efectos están apagados, no suena, pero el ducking tampoco se aplica: no tendría sentido agachar la música por un silencio).
   - `duckMusic(factor)` / `unduckMusic()` — multiplican el volumen efectivo de la música por el factor sobre los `DESKTOP/MOBILE_MUSIC_VOLUME_FACTOR` existentes, con un fundido corto (~150 ms) por pasos, y son **idempotentes** (llamar dos veces no encadena reducciones). El nivel de volumen de Ajustes se sigue respetando: el ducking es un multiplicador más, no un valor absoluto.
   - Tests con el mock de audio existente: loop arranca/para, ducking devuelve el volumen exacto anterior, idempotencia.
3. **Escritura + voz** — `src/levels/level11/useTypewriter.ts` sobre el reloj rAF de la casa (patrón `clock.ts` de la 013): prefijo visible, `done`, `skip()`. Al empezar una frase: `startVoiceLoop()` + `duckMusic(...)`; al terminar o al hacer `skip()`: `stopVoiceLoop()` + `unduckMusic()`. `paused` congela el avance, pausa la voz y **desagacha** la música. El cleanup del hook garantiza el mismo par de llamadas pase lo que pase (desmontaje por victoria, derrota, X o navegación).
4. **Componente** — `Level11.tsx`: consentimiento en el marco (nodo memoizado); vía `useLevelBoard`, el área con el sprite de Sans abajo a la derecha y el `SpeechBubble` (pregunta + botones `No`/`Yes`, `XPButton` con textos de `game.*`). Sin pie de ventana: toda la interacción vive en el bocadillo.
5. **Bloqueo de input** — botones `disabled` mientras `!done`; se habilitan tras `ANSWER_UNLOCK_MS` (~200 ms). `pointerdown` sobre el bocadillo → `skip()`.
6. **Estilos** — `Level11.module.scss` (BEM): bocadillo pixel con cola hacia Sans; **familia Comic Sans solo dentro del bocadillo** (`"Comic Sans MS", "Comic Neue", cursive`), nunca heredada por botones ni por el resto del nivel; bocadillo a la izquierda del sprite en md+ y encima en xs/sm; ancho fluido para la pregunta larga; botones ≥ 44 px; sprite con `image-rendering: pixelated`.
7. **Registro e i18n** — hueco 11 sin `consentKey`; `levels.11.*` (consentimiento + 4 preguntas) en ES y EN. `No`/`Yes` ya existen en `game.*`.
8. **Assets y docs** — `sans.png` y `sans-voice.mp3` en `src/assets/`; GDD §2.3 pasa a listar cinco assets de audio; §14 gana ms/carácter, margen de desbloqueo, factor de ducking y duración del fundido. Nota del crédito a Toby Fox para la 016.
9. **QA** — ganar las 8; perder en cada posición; contador; X a mitad de frase (la música debe volver a su nivel); ráfaga de clics; `skip()`; `paused` a mitad de frase; recarga; 5 anchos; móvil con toques CDP.

## Decisiones

- **Voz en bucle en vez de blip por carácter** — el asset es de ~1 s pensado para repetirse; un solo elemento con `loop` es más simple y más fiel que disparar un pool de sonidos cortos. Ventaja añadida: no hay que decidir qué caracteres suenan.
- **Ducking mientras habla, no durante todo el nivel** — la voz solo compite con la música mientras escribe; agachar la música los 100 s dejaría el nivel apagado. El fundido de ~150 ms evita el efecto "bombeo" en ocho frases. Alternativa si en el checkpoint suena a bombeo: agachar durante toda la conversación y restaurar al salir (cambio de dos líneas).
- **Ducking como multiplicador, no como valor absoluto** — se apila sobre los factores por dispositivo y sobre el volumen de Ajustes que ya existen; así el slider del jugador sigue mandando.
- **`unduckMusic()` en el cleanup, sin excepciones** — el bug más probable de esta feature es salir del nivel (X, derrota, victoria) con la música agachada para el resto de la partida. Es criterio de aceptación explícito y test.
- **Comic Sans confinada al bocadillo** — es fiel al personaje y un chiste tipográfico de época, pero si se filtrara a los botones rompería el sistema de diseño; se declara en la clase del bocadillo, no en un ancestro.
- **Crédito a Toby Fox en los créditos** — convierte el guiño en homenaje explícito; requisito de esta feature aunque el texto viva en la 016.
- **Bloqueo de input hasta terminar la frase (+ margen)** — decisión de justicia: la trampa debe ser psicológica, no mecánica. Con `skip()` disponible, nadie está obligado a esperar.
- **Sin indicador de progreso** — lo pide el GDD explícitamente; un "3/8" arruinaría el nivel.
- **Orden `No` izquierda / `Yes` derecha, fijo** — la memoria muscular es la mecánica.
- **Sin pie de ventana** — un Disagree señuelo ahí sería una derrota real con una salida a mano y equivocada; descartado. Toda la interacción, ganar y perder, vive dentro del bocadillo — mismo patrón sin pie que los niveles 8-9.
- **Sans más grande en xs/sm que en md+** — en desktop el bocadillo va a su lado y compite por espacio horizontal; en móvil se apila encima de él, así que el ancho libre puede ir a hacerlo más grande sin apretar nada más.
- **No/Yes se traducen, ya no son excepción de `game.*`** — la excepción original agrupaba TODO `game.*` bajo "vocabulario del falso sistema operativo", pero la única razón de peso (similitud visual Agree/Disagree, GDD §11) no le aplica a los botones neutros; mantenerlos en inglés era una decisión estética sin respaldo mecánico.

## Riesgos

- **La música se queda agachada al salir del nivel** — mitigación: `unduckMusic()` en el cleanup del hook (no en el handler de victoria), test de no-fugas específico y QA saliendo por X a mitad de frase.
- **Efecto "bombeo" con ocho subidas y bajadas** — mitigación: fundido corto; si molesta, alternativa de agachar toda la conversación (decidido en el checkpoint).
- **El loop de voz se nota cortado** (el corte del mp3 al repetir) — mitigación: es el comportamiento del asset original; si canta demasiado, el checkpoint puede decidir bajar su volumen o recortar el silencio final del archivo.
- **Comic Sans no está en el dispositivo** (la mayoría de móviles) — resuelto en la 017: Comic Neue (OFL) autoalojada como fuente de respaldo real, mismo patrón que las fuentes pixel.
- **La segunda vuelta irrita en vez de engañar** — efecto buscado por el GDD, pero se mide en el checkpoint; el dial es la velocidad de escritura, nunca reducir las 8 preguntas.
- **La pregunta 3 desborda el bocadillo en 375 px** — mitigación: ancho fluido, salto de línea y bocadillo encima del sprite en xs/sm; criterio explícito.
- **Doble disparo del mismo botón** (clic + pointerup) — una única ruta de acción, el `onClick` nativo de `XPButton`, como en la 013.
