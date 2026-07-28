# 008 · Nivel 4 — Advertising (Plinko) — Plan

> Plan pre-implementación: describe el enfoque tal como se planeó antes de escribir código, no se ha mantenido sincronizado con ajustes posteriores (QA con Sofía, correcciones de layout). Para el estado final as-built, ver `008-spec.md` y `008-tasks.md`.

## Enfoque

Primero el botón dev (desbloquea el testeo de todo lo demás y es minúsculo), después la **máquina de segmentos pura** (el corazón de las reglas, testeable sin física), y por último el tablero físico reutilizando los patrones de la 007 (import dinámico, Runner propio, sync cuerpo→DOM por rAF, cleanup). El botón grande es un cuerpo **cinemático** de matter.js que se teletransporta a la posición del control en cada frame; las capturas son eventos de colisión contra él.

## Implementación

1. **Botón dev** — en `LevelHost`: si `new URLSearchParams(location.search).has('dev')` (leído una vez al arrancar, mismo patrón que `?playground`), renderiza un botón pequeño fuera de la ventana del nivel que llama a la misma acción de completar que la victoria real pero saltando veredicto y modal (directo a selección). Anotarlo en AGENTS.md y en la línea de la 017 del roadmap.
2. **Máquina de segmentos** — `src/levels/level04/segments.ts` (pura, + tests exhaustivos): estado `{agree: number, disagree: number}` con `agree + disagree ≤ 6`; `catchAgree()`: si `agree + disagree < 6` → `agree++`; si no (tablero lleno) → `disagree--, agree++`; simétrico para `catchDisagree()`; detección de victoria (6, 0) y derrota (0, 6). Tests: la secuencia corregida del GDD, rellenos mixtos con huecos, sustituciones a tablero lleno, remontada desde (1, 5), alternancias a tablero lleno.
3. **Generador de spawns** — `src/levels/level04/spawner.ts` (puro, semilla inyectable, + test de distribución ~50 %): tipo y X de aparición de cada botón; tasa y población máxima como constantes-parámetro.
4. **Tablero físico** — `src/levels/level04/board.ts`: matter.js dinámico; 30 pegs estáticos circulares en rejilla clásica al tresbolillo, calculados desde el tamaño lógico del área; cuerpos rectangulares para los botones que caen; **cuerpo cinemático** para el botón grande (posición fijada por frame desde el control); evento de colisión botón-caído ↔ botón-grande = captura (retirar cuerpo, sonido, `segments`); los que cruzan el fondo sin captura se retiran.
5. **Control** — `src/levels/level04/control.ts` (puro el clamping, + test) conectado a `usePointer` (X del puntero / arrastre táctil en toda el área) y a las flechas del teclado (velocidad-parámetro); alimenta al cuerpo cinemático y a la custom property de la guía-slider.
6. **Componente** — `Level04.tsx`: consentimiento estándar; tablero **sin marco azul** ocupando el espacio restante (regla GDD §4.4 vigente); guía + botón grande de 6 segmentos; sin `useLevelFooter` (este nivel no tiene botones de pie — decisión abajo).
7. **Visual de segmentos** — el botón grande comparte las clases/mixins del `XPButton` real (bordes concéntricos, relieve) y cada segmento pinta el **relleno + borde interior** del estilo Agree o Disagree; separadores sutiles entre segmentos. ✋ Checkpoint visual con Sofía.
8. **i18n y registro** — `levels.4.*` en ambos diccionarios; hueco 4 sustituido.
9. **GDD** — ediciones: corregir el ejemplo de sustitución de segmentos (tras la confirmación de Sofía) y añadir a §14 los parámetros nuevos (tasa de spawn, población máx., velocidad de teclado, radio/rebote de pegs si se exponen).
10. **QA** — partida entera ganando y perdiendo (por segmentos, contador y X); recargas; `paused`; 5 anchos (el tablero escala con la resolución lógica); móvil real vía Pages con checkpoint de dificultad.

## Decisiones

- **Regla de segmentos confirmada por Sofía: rellenar con huecos, sustituir a tablero lleno** — coincide con la prosa original del GDD. Implicación de diseño: la fase de relleno es una carrera de acumulación (los dos colores conviven), y la fase de tablero lleno es un tira y afloja segmento a segmento — remontar desde (1, 5) exige 5 sustituciones seguidas sin fallar, que es la tensión buena del final de nivel. Los diales de dificultad siguen siendo la tasa y mezcla del spawn.
- **Botón grande como cuerpo cinemático** — participa en las colisiones de matter (los botones que caen pueden rebotar en él de refilón, realista) pero su posición la manda el jugador, no la física. Descartado: detección por solape de rectángulos a mano (duplicaría lo que matter ya hace y perdería los rebotes laterales).
- **Sin `useLevelFooter` en este nivel** — el GDD pone el botón grande *dentro* del área de juego (encima está el tablero) y no hay Agree/Disagree de pie; publicar un pie vacío sería ruido. El canal de la 007 lo permite sin tocar nada.
- **Spawner con semilla inyectable** — los tests de distribución y las reproducciones de bugs necesitan determinismo; en juego real la semilla es aleatoria. Coste: una función de PRNG mínima propia (sin dependencia).
- **Los botones no capturados desaparecen bajo el tablero** — mantener cadáveres acumulándose al fondo saturaría la población y taparía el botón grande. El "suelo" es la captura o el olvido.
- **Botón dev en `LevelHost`, no por nivel, y sin veredicto** — una sola implementación para los 12 niveles y velocidad de testeo máxima; el flujo real de victoria ya se prueba jugando. Gated por `?dev` para que el build público normal no exponga un botón de trampa.

## Riesgos

- **Dificultad descompensada** (100 s puede ser muy justo o trivial según tasa de spawn y velocidad de caída) — mitigación: todos los diales son parámetros con nombre en un solo archivo de constantes; checkpoint de dificultad con Sofía jugando en escritorio y móvil; repaso final en la 017.
- **Capturas injustas** (un Disagree que "roza" el botón grande cuenta) — mitigación: la zona de captura puede ser un sensor ligeramente más estrecho que el visual del botón (parámetro); se afina en el checkpoint.
- **Rendimiento con más cuerpos que la 007** (pegs + lluvia + colisiones entre caídos) — mitigación: población máxima paramétrica, pegs estáticos (baratos), y la vara de medir de la 007 en el móvil real de Sofía; primer ajuste si sufre: bajar población y tasa.
- **El visual de "botón troceado" queda a rectángulos de colores** — mitigación: checkpoint explícito de Sofía con la implementación real; plan B visual: renderizar seis mini-botones XP completos pegados (menos fiel al GDD "un único botón", pero digno) — decidir con los ojos.
- **El arrastre táctil del control pelea con el scroll de la página** — mitigación: `touch-action: none` en el área de juego (regla ya existente de `GameArea`) y QA táctil específico.
