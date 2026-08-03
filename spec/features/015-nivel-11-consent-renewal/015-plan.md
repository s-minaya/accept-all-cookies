# 015 · Nivel 11 — Consent Renewal — Plan

> Corregido tras revisión de Sofía jugando la primera versión ("ha quedado genial, pero..."): (1) el pie de ventana con el Disagree señuelo (descrito más abajo en "Decisiones") se retira por completo — "no me convence que haya un botón de disagree, lo vamos a eliminar"; `Level11.tsx` deja de llamar a `useLevelFooter`, mismo patrón sin pie que los niveles 8-9. (2) Sans crece en xs/sm respecto a md+ (antes 6rem/8rem respectivamente, ahora 10rem/8rem) — en móvil el bocadillo se apila encima de él, así que sobra ancho para que sea más protagonista.
>
> Segunda ronda: (3) "los botones de yes no en este nivel en la version española deberian decir si/no" — extendido por Sofía a los demás botones neutros del juego, no solo este nivel: "en general los botones estos neutros creo que se deberian traducir (check, stop, etc)". Cambia una regla de todo el proyecto (GDD §11, AGENTS.md), no solo de esta feature: dentro de `game.*`, ahora SOLO Agree/Disagree y los títulos del veredicto (`cookiesAccepted`, el `disagree` de Game Over) se quedan fijos en inglés, por la mecánica de similitud visual que solo ellos tienen; Check/Stop/OK/Yes se traducen con normalidad (`es.json`: Comprobar/Parar/Aceptar/Sí — `No` coincide en los dos idiomas). `gameKeys.test.ts` reescrito para reflejar la nueva regla. Verificado que ningún botón afectado depende de un ancho fijo demasiado justo (el `Stop` de 84px del nivel 5 es el más ajustado; "Parar" se eligió en vez de "Detener" por caber mejor).
>
> Tercera ronda: (4) "algunas traducciones son demasiado literales... revisa todas las que suenen mal y cambialas en todo el proyecto" — auditoría completa de `es.json` (no solo el nivel 11), buscando calcos del inglés que un hablante nativo no usaría. Cambiados: nivel 7 "Compartición de Datos" → "Uso Compartido de Datos" (el ejemplo que dio Sofía); nivel 8 "Proveedores de Terceros" → "Proveedores Externos"; nivel 6 "Seguimiento entre Sitios" → "Seguimiento entre Sitios Web" (para que coincidiera con su propio texto de consentimiento); nivel 10 "la provisión de" → "el suministro de"; nivel 2 "las personas visitantes" → "los usuarios". Sin cambios de código, solo contenido — ningún test citaba estas cadenas literalmente.

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
4. **Componente** — `Level11.tsx`: consentimiento en el marco (nodo memoizado); vía `useLevelBoard`, el área con el sprite de Sans abajo a la derecha y el `SpeechBubble` (pregunta + botones `No`/`Yes`, `XPButton` con textos de `game.*`). Sin pie de ventana (corregido tras revisión de Sofía, ver blockquote superior): toda la interacción vive en el bocadillo.
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
- **Sin pie de ventana** (corregido tras revisión de Sofía, ver blockquote superior) — la primera versión tenía un Disagree señuelo en el pie ("derrota real: el jugador harto... tiene una salida a mano, y es la equivocada"); descartado porque a Sofía no le convencía tenerlo. Toda la interacción, ganar y perder, vive dentro del bocadillo — mismo patrón sin pie que los niveles 8-9.
- **Sans más grande en xs/sm que en md+** (corregido tras revisión de Sofía) — en desktop el bocadillo va a su lado y compite por espacio horizontal; en móvil se apila encima de él, así que el ancho libre puede ir a hacerlo más grande sin apretar nada más.
- **No/Yes se traducen, ya no son excepción de `game.*`** (corregido tras revisión de Sofía, segunda ronda) — la excepción original agrupaba TODO `game.*` bajo "vocabulario del falso sistema operativo", pero la única razón de peso (similitud visual Agree/Disagree, GDD §11) no le aplica a los botones neutros; mantenerlos en inglés era una decisión estética sin respaldo mecánico, y a Sofía no le convencía verla en un nivel que traduce todo lo demás.

## Riesgos

- **La música se queda agachada al salir del nivel** — mitigación: `unduckMusic()` en el cleanup del hook (no en el handler de victoria), test de no-fugas específico y QA saliendo por X a mitad de frase.
- **Efecto "bombeo" con ocho subidas y bajadas** — mitigación: fundido corto; si molesta, alternativa de agachar toda la conversación (decidido en el checkpoint).
- **El loop de voz se nota cortado** (el corte del mp3 al repetir) — mitigación: es el comportamiento del asset original; si canta demasiado, el checkpoint puede decidir bajar su volumen o recortar el silencio final del archivo.
- **Comic Sans no está en el dispositivo** (Linux, algún Android) — mitigación: fallback declarado; si Sofía quiere garantizarla, se autoaloja Comic Neue (OFL) como se hizo con las fuentes pixel.
- **La segunda vuelta irrita en vez de engañar** — efecto buscado por el GDD, pero se mide en el checkpoint; el dial es la velocidad de escritura, nunca reducir las 8 preguntas.
- **La pregunta 3 desborda el bocadillo en 375 px** — mitigación: ancho fluido, salto de línea y bocadillo encima del sprite en xs/sm; criterio explícito.
- **Doble disparo del mismo botón** (clic + pointerup) — una única ruta de acción, el `onClick` nativo de `XPButton`, como en la 013.
