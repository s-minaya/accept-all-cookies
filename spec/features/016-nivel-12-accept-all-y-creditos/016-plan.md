# 016 · Nivel 12 — Accept All + créditos — Plan

## Enfoque

Dos entregables independientes en una feature: el **nivel** (una máquina de estados pura de tres estados y una barra que sube y baja) y la **pantalla de créditos** (contenido + una transición de cierre del juego). Se hace primero el nivel, y los créditos al final porque cierran el ciclo completo y conviene probarlos con una partida de verdad detrás.

## Implementación

1. **Máquina del botón y la barra** — `src/levels/level12/acceptAll.ts` (puro, + tests):
   - Estado `{ progress, clicks, phase: 'agree' | 'trap' | 'restored', sinceLastClick, switchAt }`.
   - `click()` → sube `progress`, incrementa `clicks`; si `clicks === switchAt` pasa a `trap`; en `trap` devuelve `'lose'`; en `restored` devuelve `'win'`.
   - `tick(dt)` → decaimiento cada `DECAY_INTERVAL_MS` (0,5 s) y, en `trap`, paso a `restored` tras `RESTORE_MS` (2 s).
   - `createSwitchAt(seed)` → entero en [15, 35] con el PRNG compartido.
   - Tests: series largas que nunca alcanzan el 100 %, cambio exacto en `switchAt`, derrota al pulsar en `trap`, restauración a los 2 s, pulsación justo en el límite (antes → pierde, después → gana), decaimiento sin pulsar.
2. **Reloj** — el rAF de la casa (patrón `clock.ts`), congelable por `paused`, cancelable en cleanup; alimenta `tick(dt)`.
3. **Componente del nivel** — `Level12.tsx`: consentimiento en el marco (nodo memoizado); vía `useLevelBoard`, la barra (`ProgressBar` con relleno por custom property escrita por ref, sin re-render por frame; componente propio que se monta con el nodo publicado); vía `useLevelFooter`, el Disagree fijo y el botón protagonista (`XPButton` con `variant`/texto derivados de la fase, sin `transition` en color).
4. **Victoria** — al pulsar en `restored`: bloquear input, animar la barra al 100 % (~400 ms, parámetro) y luego `onWin()`. Es el único momento en que la barra llega arriba.
5. **Pantalla de créditos** — `src/app/screens/CreditsScreen/`: `XPWindow` sin contador ni X, con `scrollableContent`; contenido desde i18n (`credits.*`); botón de volver que llama a `resetRun()` y navega a la landing. `AppShell` ya tiene el hueco `credits` desde la 002: se sustituye el placeholder.
6. **Ruta de fin de juego** — el botón `Credits` de la modal de victoria del nivel 12 (previsto en la 004) navega a `credits` en vez de a `select`; verificar que `completeLevel(12)` + `finished` ya se aplican antes.
7. **Textos** — `levels.12.*` (consentimiento) y `credits.*` (bloques del GDD §10) en ES y EN. Los créditos incluyen la autoría, *Doki Doki Action Game* y "Sans © Toby Fox (Undertale) — homenaje sin ánimo de lucro".
8. **GDD** — §14: incremento por clic, decaimiento e intervalo, rango de `switchAt`, tiempo de restauración, duración del llenado final. §10: reflejar el crédito a Toby Fox junto al de Doki Doki.
9. **QA** — ganar parando a tiempo; perder cayendo en la trampa, por el Disagree fijo, por contador y por X; recorrido completo landing → 12 niveles → créditos → landing → Empezar (partida nueva); `paused`; recarga; 5 anchos; móvil con toques CDP.

## Decisiones

- **El cambio ocurre en la pulsación `switchAt`, no en la siguiente** — así el botón ya está rojo cuando el jugador lanza el clic número `switchAt + 1`, que es exactamente la trampa que describe el GDD ("que pulse el botón convertido en Disagree sin darse cuenta"). Documentado porque la alternativa (cambiar *antes* de procesar el clic) haría perder al jugador en el propio clic del cambio, que sería injusto.
- **Sin bloqueo de input ni antirrebote** — al contrario que en el nivel 11, aquí el clic compulsivo **es** la mecánica: cualquier protección desactivaría la trampa. Único bloqueo: durante la animación final de victoria.
- **La barra sigue decayendo en `trap` y en `restored`** — mantiene la tensión visual ("estoy perdiendo progreso") mientras el jugador duda si parar; da igual mecánicamente, porque la victoria la completa de golpe. Coherente con "es puro teatro".
- **Volver de créditos reinicia la partida** — con los 12 niveles completados no queda "siguiente nivel", así que sin `resetRun()` el jugador volvería a una selección sin nada disponible. El récord y su marca `finished` viven en el ranking y no se ven afectados. (Hueco del GDD que esta feature cierra.)
- **Los créditos son pantalla del shell, no una modal** — merecen la pantalla entera, tienen scroll y son el final del juego; además el hueco ya existía desde la 002.
- **Sin `transition` de color en el botón protagonista** — el GDD pide cambio instantáneo; una transición, por corta que sea, avisaría por el rabillo del ojo.
- **Animación breve de llenado final (~400 ms)** — el GDD dice que la barra "se completa automáticamente"; hacerlo de golpe se leería como un fallo, y 400 ms dan el instante de recompensa antes del AGREE gigante.

## Riesgos

- **La trampa no funciona porque el jugador ya viene escaldado de once niveles** — es aceptable (el juego enseña a desconfiar y este es el examen final); el checkpoint mide si aun así cae. Diales: rango de `switchAt` y ritmo de la barra.
- **Clic compulsivo + móvil = toques fantasma o zoom por doble toque** — mitigación: `touch-action: manipulation` en el botón, y QA táctil específico con toques CDP rápidos.
- **La barra "casi llena" hace pensar que se puede completar** — mitigación: el incremento y el decaimiento se calibran para que se estabilice claramente por debajo del final; test de series largas que fija ese techo.
- **El jugador se queda atascado tras los créditos** (selección sin nivel disponible) — mitigación: `resetRun()` al volver, con criterio de aceptación que lo verifica jugando.
- **Los créditos se quedan solo en inglés o con tono desigual entre idiomas** — mitigación: checkpoint explícito de Sofía sobre ambas versiones; es su voz, no la del agente.
- **`finished` no se llega a marcar si el jugador cierra en la modal final** — mitigación: `completeLevel(12)` y `finished` se aplican al confirmar la modal, antes de navegar a créditos; verificar en QA que el ranking lo refleja aunque el jugador no llegue a ver los créditos.
