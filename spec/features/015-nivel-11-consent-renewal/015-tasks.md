# 015 · Nivel 11 — Consent Renewal — Tareas

- [ ] Colocar los assets en `src/assets/`: `sans.png` (sprite) y `sans-voice.mp3` (~1 s, pensado para loop).
- [ ] Implementar `conversation.ts` (guion de 8 pasos = 4 preguntas ×2, respuesta esperada por paso, `answer()` → advance/win/lose) + tests exhaustivos (las 8 posiciones, correcta e incorrecta en cada una).
- [ ] Ampliar `AudioManager`: `startVoiceLoop()`/`stopVoiceLoop()` (elemento propio con `loop`, sujeto a `soundEffectsOn`) y `duckMusic(factor)`/`unduckMusic()` (multiplicador sobre los factores por dispositivo y el volumen de Ajustes, con fundido ~150 ms, idempotentes) + tests (loop arranca/para, el volumen vuelve exactamente al anterior, idempotencia).
- [ ] Implementar `useTypewriter` sobre el reloj rAF de la casa (prefijo visible, `done`, `skip()`), arrancando voz + ducking al empezar cada frase y parándolos al terminar o al saltar; congelable por `paused` (voz pausada, música restaurada) y con cleanup que **siempre** deja la voz parada y la música restaurada + test con tiempo simulado.
- [ ] Implementar `Level11.tsx`: consentimiento en el marco (nodo memoizado); vía `useLevelBoard`, Sans abajo a la derecha + `SpeechBubble` con la pregunta y los botones `No`/`Yes` (`game.*`); vía `useLevelFooter`, el Disagree rojo → `onLose('failed')`.
- [ ] Bloqueo de input: botones deshabilitados mientras escribe + margen `ANSWER_UNLOCK_MS`; `pointerdown` sobre el bocadillo completa el texto, corta la voz y restaura la música.
- [ ] Estilos `Level11.module.scss`: bocadillo con cola hacia Sans; **Comic Sans solo dentro del bocadillo** (con fallback), nunca heredada por los botones ni por el resto del nivel; bocadillo a la izquierda en md+ y encima en xs/sm; ancho fluido para la pregunta larga; botones ≥ 44 px; sprite pixelado.
- [ ] Sustituir el hueco 11 del registro; verificar chunk propio sin matter.js.
- [ ] Añadir `levels.11.*` (consentimiento + 4 preguntas) a ambos diccionarios; verificar que `No`/`Yes` siguen en `game.*` sin traducir.
- [ ] Documentar `sans-voice.mp3` como quinto asset de audio (GDD §2.3, `tech-stack.md`, AGENTS.md) y añadir a GDD §14: ms/carácter, margen de desbloqueo, factor de ducking y duración del fundido.
- [ ] Anotar para la feature 016 el crédito: "Sans © Toby Fox (Undertale) — homenaje sin ánimo de lucro", junto a la mención ya prevista a *Doki Doki Action Game*.
- [ ] `paused` congela escritura, voz e input y restaura la música; cleanup total al desmontar + test de no-fugas (**la música nunca se queda agachada**).
- [ ] ✋ **Checkpoint con Sofía**: tamaño y posición de Sans y del bocadillo, Comic Sans en pantalla real, velocidad de escritura, volumen relativo voz/música y factor de ducking (¿molesta el bombeo en ocho frases o mejor agachar toda la conversación?), y si la segunda vuelta engaña o irrita.
- [ ] QA: ganar las 8 respuestas; perder respondiendo mal en cada una de las 8 posiciones; perder por el Disagree del pie, por contador y por X **a mitad de frase** (comprobando que la música vuelve a su volumen); ráfaga de clics rápidos que no encadena respuestas; `skip()` completa y corta la voz; `paused` a mitad de frase; recarga a mitad (vuelve a la pregunta 1) y con desenlace pendiente; 5 anchos con la pregunta larga sin desbordar; móvil real con **toques CDP** (`Input.dispatchTouchEvent`, no `page.mouse`).
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.
